import sql from "@/app/api/utils/sql";

// CSV 내보내기 엔드포인트
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'users', 'sessions', 'surveys', 'all'
    const format = searchParams.get("format") || "json"; // 'json', 'csv'
    const userId = searchParams.get("user_id"); // 특정 사용자만

    // New filter parameters
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const userIds = searchParams
      .get("user_ids")
      ?.split(",")
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));
    const surveyType = searchParams.get("survey_type");

    if (!type) {
      return Response.json(
        {
          error: "Export type is required (users, sessions, surveys, all)",
        },
        { status: 400 },
      );
    }

    let data = {};
    const timestamp = new Date().toISOString().split("T")[0];

    // Build filter conditions
    const buildDateFilter = (dateColumn, params) => {
      const conditions = [];
      if (startDate) {
        conditions.push(`${dateColumn} >= $${params.length + 1}`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`${dateColumn} <= $${params.length + 1}`);
        params.push(endDate);
      }
      return conditions;
    };

    const buildUserFilter = (userColumn, params) => {
      const conditions = [];
      if (userId) {
        conditions.push(`${userColumn} = $${params.length + 1}`);
        params.push(parseInt(userId));
      } else if (userIds && userIds.length > 0) {
        const placeholders = userIds
          .map((_, index) => `$${params.length + index + 1}`)
          .join(",");
        conditions.push(`${userColumn} IN (${placeholders})`);
        params.push(...userIds);
      }
      return conditions;
    };

    // 참여자 데이터 내보내기
    if (type === "users" || type === "all") {
      let participantsQuery = `
        SELECT 
          u.id,
          u.patient_id,
          u.name,
          u.age,
          u.gender,
          u.birth_date,
          u.phone,
          u.email,
          u.address,
          u.diagnosis,
          u.pta_result,
          u.pta_db_hl,
          u.hearing_test_date,
          u.consent_given,
          u.consent_date,
          u.last_visit_date,
          u.created_at,
          calculate_age(u.birth_date) as calculated_age,
          CASE 
            WHEN rs.id IS NOT NULL THEN CONCAT(rs.total_weeks, '주, 주', rs.sessions_per_week, '회')
            ELSE '미설정'
          END as research_schedule
        FROM users u
        LEFT JOIN research_schedules rs ON u.id = rs.user_id
      `;

      const params = [];
      const conditions = [];

      // Add user filter
      conditions.push(...buildUserFilter("u.id", params));

      // Add date filter for created_at
      conditions.push(...buildDateFilter("u.created_at::date", params));

      if (conditions.length > 0) {
        participantsQuery += ` WHERE ${conditions.join(" AND ")}`;
      }

      participantsQuery += ` ORDER BY u.created_at DESC`;

      const participants = await sql(participantsQuery, params);
      data.participants = participants;
    }

    // 세션 데이터 내보내기
    if (type === "sessions" || type === "all") {
      let sessionsQuery = `
        SELECT 
          ms.id,
          u.patient_id,
          u.name as participant_name,
          ms.session_date,
          ms.start_time,
          ms.end_time,
          ms.duration_minutes,
          ms.music_type,
          ms.volume_db_spl,
          ms.completed,
          ms.created_at,
          DATE_PART('week', ms.session_date) as week_number,
          EXTRACT(dow FROM ms.session_date) as day_of_week
        FROM music_sessions ms
        JOIN users u ON ms.user_id = u.id
      `;

      const params = [];
      const conditions = [];

      // Add user filter
      conditions.push(...buildUserFilter("ms.user_id", params));

      // Add date filter for session_date
      conditions.push(...buildDateFilter("ms.session_date", params));

      if (conditions.length > 0) {
        sessionsQuery += ` WHERE ${conditions.join(" AND ")}`;
      }

      sessionsQuery += ` ORDER BY ms.session_date DESC, ms.start_time DESC`;

      const sessions = await sql(sessionsQuery, params);
      data.sessions = sessions;
    }

    // 설문 데이터 내보내기
    if (type === "surveys" || type === "all") {
      let surveysQuery = `
        SELECT 
          ss.id,
          u.patient_id,
          u.name as participant_name,
          ss.survey_type,
          ss.total_score,
          ss.max_possible_score,
          ss.percentage_score,
          ss.survey_date,
          ss.detailed_scores,
          ss.subscale_scores,
          CASE ss.survey_type
            WHEN 'THI' THEN 
              CASE 
                WHEN ss.total_score <= 16 THEN '경미'
                WHEN ss.total_score <= 36 THEN '가벼운-보통'
                WHEN ss.total_score <= 56 THEN '보통'
                WHEN ss.total_score <= 76 THEN '심각'
                ELSE '극도로 심각'
              END
            WHEN 'HHIA' THEN
              CASE 
                WHEN ss.total_score <= 16 THEN '장애 없음'
                WHEN ss.total_score <= 42 THEN '가벼운-보통'
                ELSE '심각'
              END
            ELSE '해당없음'
          END as severity_interpretation
        FROM survey_scores ss
        JOIN users u ON ss.user_id = u.id
      `;

      const params = [];
      const conditions = [];

      // Add user filter
      conditions.push(...buildUserFilter("ss.user_id", params));

      // Add date filter for survey_date
      conditions.push(...buildDateFilter("ss.survey_date::date", params));

      // Add survey type filter
      if (surveyType && surveyType !== "all") {
        conditions.push(`ss.survey_type = $${params.length + 1}`);
        params.push(surveyType);
      }

      if (conditions.length > 0) {
        surveysQuery += ` WHERE ${conditions.join(" AND ")}`;
      }

      surveysQuery += ` ORDER BY ss.survey_date DESC`;

      const surveys = await sql(surveysQuery, params);

      // 설문 응답 상세 데이터도 포함
      let responsesQuery = `
        SELECT 
          sr.id,
          u.patient_id,
          u.name as participant_name,
          sr.survey_type,
          sr.question_number,
          sq.question_text,
          sr.response_value,
          sr.response_date
        FROM survey_responses sr
        JOIN users u ON sr.user_id = u.id
        LEFT JOIN survey_questions sq ON sr.survey_type = sq.survey_type AND sr.question_number = sq.question_number
      `;

      const responseParams = [];
      const responseConditions = [];

      // Add user filter
      responseConditions.push(...buildUserFilter("sr.user_id", responseParams));

      // Add date filter for response_date
      responseConditions.push(
        ...buildDateFilter("sr.response_date::date", responseParams),
      );

      // Add survey type filter
      if (surveyType && surveyType !== "all") {
        responseConditions.push(
          `sr.survey_type = $${responseParams.length + 1}`,
        );
        responseParams.push(surveyType);
      }

      if (responseConditions.length > 0) {
        responsesQuery += ` WHERE ${responseConditions.join(" AND ")}`;
      }

      responsesQuery += ` ORDER BY sr.response_date DESC, sr.survey_type, sr.question_number`;

      const responses = await sql(responsesQuery, responseParams);

      data.surveys = surveys;
      data.survey_responses = responses;
    }

    // Add filter metadata to response
    const filterInfo = {
      start_date: startDate,
      end_date: endDate,
      user_ids: userIds,
      survey_type: surveyType,
      single_user_id: userId,
    };

    // CSV 형식으로 변환
    if (format === "csv") {
      if (type === "all") {
        // 모든 데이터를 JSON으로 반환 (프론트엔드에서 ZIP 처리)
        const csvData = {};
        Object.keys(data).forEach((key) => {
          csvData[key] = convertToCSV(data[key]);
        });

        return Response.json({
          filename: `hearing_research_data_${timestamp}.zip`,
          data: csvData,
          format: "csv_collection",
          filters: filterInfo,
        });
      } else {
        const csvContent = convertToCSV(data[Object.keys(data)[0]]);
        const filename = `${type}_${timestamp}${startDate ? "_from_" + startDate : ""}${endDate ? "_to_" + endDate : ""}.csv`;
        return new Response(csvContent, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }
    }

    // Excel 형식으로 변환 (프론트엔드에서 처리)
    if (format === "excel") {
      const filename = `${type}_${timestamp}${startDate ? "_from_" + startDate : ""}${endDate ? "_to_" + endDate : ""}.xlsx`;
      return Response.json({
        filename: filename,
        data: data,
        format: "excel",
        filters: filterInfo,
        record_counts: {
          participants: data.participants?.length || 0,
          sessions: data.sessions?.length || 0,
          surveys: data.surveys?.length || 0,
          survey_responses: data.survey_responses?.length || 0,
        },
      });
    }

    // JSON 형식으로 반환
    return Response.json({
      data,
      timestamp,
      export_type: type,
      format,
      filters: filterInfo,
      record_counts: {
        participants: data.participants?.length || 0,
        sessions: data.sessions?.length || 0,
        surveys: data.surveys?.length || 0,
        survey_responses: data.survey_responses?.length || 0,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return Response.json({ error: "Failed to export data" }, { status: 500 });
  }
}

// CSV 변환 함수
function convertToCSV(data) {
  if (!data || data.length === 0) {
    return "";
  }

  // UTF-8 BOM 추가 (한글 지원)
  const BOM = "\uFEFF";

  // 헤더 생성
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  // 데이터 행 생성
  const csvRows = data.map((row) => {
    return headers
      .map((header) => {
        let value = row[header];

        // null/undefined 처리
        if (value === null || value === undefined) {
          value = "";
        }

        // 날짜 처리
        if (value instanceof Date) {
          value = value.toISOString().split("T")[0];
        }

        // JSON 객체 처리
        if (typeof value === "object") {
          value = JSON.stringify(value);
        }

        // CSV 이스케이핑
        value = String(value);
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      })
      .join(",");
  });

  return BOM + csvHeaders + "\n" + csvRows.join("\n");
}

// 통계 요약 내보내기
export async function POST(request) {
  try {
    const { type, filters } = await request.json();

    if (type === "summary_stats") {
      // 전체 통계 요약
      const [participantStats] = await sql`
        SELECT 
          COUNT(*) as total_participants,
          COUNT(CASE WHEN consent_given = true THEN 1 END) as consented_participants,
          AVG(age) as average_age,
          COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_count,
          COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_count
        FROM users
      `;

      const [sessionStats] = await sql`
        SELECT 
          COUNT(*) as total_sessions,
          COUNT(CASE WHEN completed = true THEN 1 END) as completed_sessions,
          AVG(duration_minutes) as average_duration,
          COUNT(DISTINCT user_id) as active_participants
        FROM music_sessions
      `;

      const surveyStats = await sql`
        SELECT 
          survey_type,
          COUNT(*) as total_surveys,
          COUNT(DISTINCT user_id) as participants_with_surveys,
          AVG(percentage_score) as average_percentage,
          MIN(percentage_score) as min_percentage,
          MAX(percentage_score) as max_percentage
        FROM survey_scores
        GROUP BY survey_type
      `;

      const diagnosisStats = await sql`
        SELECT 
          diagnosis,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentage
        FROM users
        GROUP BY diagnosis
        ORDER BY count DESC
      `;

      return Response.json({
        participant_stats: participantStats,
        session_stats: sessionStats,
        survey_stats: surveyStats,
        diagnosis_stats: diagnosisStats,
        generated_at: new Date().toISOString(),
      });
    }

    return Response.json({ error: "Invalid export type" }, { status: 400 });
  } catch (error) {
    console.error("Summary export error:", error);
    return Response.json(
      { error: "Failed to generate summary statistics" },
      { status: 500 },
    );
  }
}
