import sql from "@/app/api/utils/sql";

// Submit survey responses
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, session_id, survey_type, responses, survey_notes } = body;

    if (!user_id || !survey_type || !responses || !Array.isArray(responses)) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Check user's research schedule to validate survey submission
    const [userSchedule] = await sql`
      SELECT * FROM research_schedules 
      WHERE user_id = ${user_id} 
      AND is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (userSchedule) {
      // Check if today is an active day
      const todayDate = new Date(today);
      const todayDayOfWeek = todayDate.getDay();
      const activeDays = Array.isArray(userSchedule.days_of_week)
        ? userSchedule.days_of_week
        : JSON.parse(userSchedule.days_of_week || "[]");

      if (!activeDays.includes(todayDayOfWeek)) {
        return Response.json(
          { error: "Today is not an active day according to your schedule" },
          { status: 400 },
        );
      }

      // Check if survey type is allowed for this user
      const allowedSurveyTypes = Array.isArray(userSchedule.active_survey_types)
        ? userSchedule.active_survey_types
        : JSON.parse(userSchedule.active_survey_types || "[]");

      if (
        allowedSurveyTypes.length > 0 &&
        !allowedSurveyTypes.includes(survey_type)
      ) {
        return Response.json(
          { error: "This survey type is not allowed for your schedule" },
          { status: 400 },
        );
      }

      // Check daily survey session limits
      // A "survey session" means completing all required survey types in one session
      // Check if user has already completed a full survey session today
      const todaySurveySession = await sql`
        SELECT DISTINCT survey_date, survey_sequence 
        FROM survey_scores
        WHERE user_id = ${user_id} AND DATE(survey_date) = ${today}
        ORDER BY survey_sequence DESC
        LIMIT 1
      `;

      const surveyFreq = userSchedule.survey_frequency || 1;
      const surveyUnit = userSchedule.survey_frequency_unit || "daily";

      let requiredSurveySessionsToday = 0;
      switch (surveyUnit) {
        case "daily":
          requiredSurveySessionsToday = surveyFreq;
          break;
        case "weekly":
          requiredSurveySessionsToday = Math.ceil(
            surveyFreq / activeDays.length,
          );
          break;
        case "monthly":
          const activeDaysPerWeek = activeDays.length;
          const activeDaysPerMonth = Math.round(activeDaysPerWeek * 4.33);
          requiredSurveySessionsToday = Math.ceil(
            surveyFreq / activeDaysPerMonth,
          );
          break;
      }

      // Check if user has completed required survey sessions today
      const completedSessionsToday = todaySurveySession.length > 0 ? 1 : 0;

      if (completedSessionsToday >= requiredSurveySessionsToday) {
        return Response.json(
          {
            error: `You have already completed your daily survey session (${completedSessionsToday}/${requiredSurveySessionsToday})`,
          },
          { status: 400 },
        );
      }
    }

    // Check how many surveys the user has done today for sequence numbering
    const todayResponses = await sql`
      SELECT COUNT(DISTINCT survey_type) as survey_count
      FROM survey_scores
      WHERE user_id = ${user_id} AND DATE(survey_date) = ${today}
    `;

    const survey_sequence = (todayResponses[0]?.survey_count || 0) + 1;
    const completion_time = new Date().toISOString();

    // Insert all responses in a transaction
    const responseQueries = responses.map(
      (response, index) =>
        sql`INSERT INTO survey_responses (user_id, session_id, survey_type, question_number, response_value)
          VALUES (${user_id}, ${session_id || null}, ${survey_type}, ${index + 1}, ${response})`,
    );

    await sql.transaction(responseQueries);

    // Calculate total score based on survey type
    let totalScore, maxScore, percentage;

    if (survey_type === "THI" || survey_type === "HHIA") {
      // THI/HHIA: responses are 1=0pts, 2=2pts, 3=4pts
      totalScore = responses.reduce((sum, response) => {
        if (response === 1) return sum + 0;
        if (response === 2) return sum + 2;
        if (response === 3) return sum + 4;
        return sum;
      }, 0);
      maxScore = responses.length * 4;
    } else if (survey_type === "SSQ12") {
      // SSQ12: responses are 0-10 scale (direct values)
      totalScore = responses.reduce((sum, score) => sum + Number(score), 0);
      maxScore = responses.length * 10;
    } else {
      // Default Likert scale 1-5
      totalScore = responses.reduce((sum, score) => sum + Number(score), 0);
      maxScore = responses.length * 5;
    }

    percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    const completionNote =
      survey_notes ||
      `${survey_type} 설문 완료 - ${new Date().toLocaleTimeString("ko-KR")} (순서: ${survey_sequence})`;

    // Save calculated score
    const scoreResult = await sql`
      INSERT INTO survey_scores (
        user_id, session_id, survey_type, total_score, max_possible_score, 
        percentage_score, completion_time, survey_sequence, session_notes
      )
      VALUES (
        ${user_id}, ${session_id || null}, ${survey_type}, ${totalScore}, 
        ${maxScore}, ${percentage}, ${completion_time}, ${survey_sequence}, ${completionNote}
      )
      RETURNING *
    `;

    return Response.json({
      success: true,
      score: scoreResult[0],
      responses_count: responses.length,
    });
  } catch (error) {
    console.error("Error submitting survey:", error);
    return Response.json({ error: "Failed to submit survey" }, { status: 500 });
  }
}

// Get survey scores with optional date filtering
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");
    const survey_type = url.searchParams.get("survey_type");
    const date = url.searchParams.get("date"); // YYYY-MM-DD format

    let query = `
      SELECT ss.*, u.name as user_name, u.patient_id
      FROM survey_scores ss
      JOIN users u ON ss.user_id = u.id
    `;

    const conditions = [];
    const params = [];

    if (user_id) {
      conditions.push(`ss.user_id = $${params.length + 1}`);
      params.push(user_id);
    }

    if (survey_type) {
      conditions.push(`ss.survey_type = $${params.length + 1}`);
      params.push(survey_type);
    }

    if (date) {
      conditions.push(`DATE(ss.survey_date) = $${params.length + 1}`);
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY ss.survey_date DESC`;

    const result = await sql(query, params);

    return Response.json({ scores: result });
  } catch (error) {
    console.error("Error fetching survey scores:", error);
    return Response.json(
      { error: "Failed to fetch survey scores" },
      { status: 500 },
    );
  }
}
