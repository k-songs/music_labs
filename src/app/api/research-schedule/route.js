import sql from "@/app/api/utils/sql";

// 연구 일정 생성
export async function POST(request) {
  try {
    const {
      user_id,
      start_date,
      total_weeks,
      sessions_per_week,
      session_duration_minutes,
      days_of_week, // [0,1,2,3,4,5,6] for Sun-Sat
      music_frequency = 1,
      music_frequency_unit = "daily",
      music_sessions_per_occurrence = 1,
      survey_frequency = 1,
      survey_frequency_unit = "daily",
      selected_music_types = [],
      active_survey_types = [],
      is_active = true,
    } = await request.json();

    if (!user_id || !start_date || !total_weeks || !session_duration_minutes) {
      return Response.json(
        {
          success: false,
          error: "사용자 ID, 시작일, 총 기간, 세션 시간은 필수 항목입니다.",
        },
        { status: 400 },
      );
    }

    // 사용자 존재 확인
    const userExists = await sql`
      SELECT id FROM users WHERE id = ${user_id}
    `;

    if (userExists.length === 0) {
      return Response.json(
        {
          success: false,
          error: "존재하지 않는 사용자입니다.",
        },
        { status: 404 },
      );
    }

    // 기존 활성 스케줄 비활성화
    await sql`
      UPDATE research_schedules 
      SET is_active = false 
      WHERE user_id = ${user_id} AND is_active = true
    `;

    // 종료일 계산
    const startDate = new Date(start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + total_weeks * 7);

    // days_of_week가 제공되지 않으면 전체 요일로 설정
    const finalDaysOfWeek =
      Array.isArray(days_of_week) && days_of_week.length > 0
        ? days_of_week
        : [0, 1, 2, 3, 4, 5, 6];

    // 총 예상 세션 수 계산
    const sessionsPerWeekCount = sessions_per_week || finalDaysOfWeek.length;
    const totalExpectedSessions = total_weeks * sessionsPerWeekCount;

    const [schedule] = await sql`
      INSERT INTO research_schedules (
        user_id, start_date, end_date, total_weeks, sessions_per_week,
        session_duration_minutes, days_of_week, total_expected_sessions,
        music_frequency, music_frequency_unit, music_sessions_per_occurrence,
        survey_frequency, survey_frequency_unit,
        selected_music_types, active_survey_types, is_active, 
        daily_music_sessions, daily_survey_sessions
      ) VALUES (
        ${user_id}, ${start_date}, ${endDate.toISOString().split("T")[0]}, 
        ${total_weeks}, ${sessionsPerWeekCount}, ${session_duration_minutes},
        ${finalDaysOfWeek}, ${totalExpectedSessions},
        ${music_frequency}, ${music_frequency_unit}, ${music_sessions_per_occurrence},
        ${survey_frequency}, ${survey_frequency_unit},
        ${selected_music_types}, ${active_survey_types}, ${is_active},
        ${music_frequency_unit === "daily" ? music_frequency : 1},
        ${survey_frequency_unit === "daily" ? survey_frequency : 1}
      )
      RETURNING *
    `;

    return Response.json({
      success: true,
      schedule: schedule,
      message: "연구 스케줄이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error("Error creating research schedule:", error);
    return Response.json(
      {
        success: false,
        error: "연구 스케줄 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

// 연구 일정 조회 + 진행률 계산
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const includeProgress = searchParams.get("include_progress") === "true";

    if (userId) {
      // 특정 사용자의 스케줄 조회
      const schedules = await sql`
        SELECT rs.*, u.name as user_name, u.patient_id
        FROM research_schedules rs
        JOIN users u ON rs.user_id = u.id
        WHERE rs.user_id = ${userId} AND rs.is_active = true
        ORDER BY rs.created_at DESC
      `;

      if (schedules.length === 0) {
        return Response.json(
          {
            success: false,
            error: "해당 사용자의 활성 스케줄을 찾을 수 없습니다.",
          },
          { status: 404 },
        );
      }

      const schedule = schedules[0]; // 가장 최신 스케줄
      let progressData = null;

      if (includeProgress) {
        // 실제 세션 참여 현황
        const sessions = await sql`
          SELECT 
            session_date,
            completed,
            duration_minutes,
            music_type
          FROM music_sessions 
          WHERE user_id = ${userId}
            AND session_date BETWEEN ${schedule.start_date} AND ${schedule.end_date}
          ORDER BY session_date ASC
        `;

        // 설문 완료 현황
        const surveys = await sql`
          SELECT 
            DATE(survey_date) as survey_date,
            survey_type,
            percentage_score
          FROM survey_scores 
          WHERE user_id = ${userId}
            AND DATE(survey_date) BETWEEN ${schedule.start_date} AND ${schedule.end_date}
          ORDER BY survey_date ASC
        `;

        // 진행률 계산
        const completedSessions = sessions.filter((s) => s.completed).length;
        const totalSessions = sessions.length;
        const sessionProgress = Math.round(
          (completedSessions / schedule.total_expected_sessions) * 100,
        );

        progressData = {
          sessions_completed: completedSessions,
          sessions_total: totalSessions,
          sessions_expected: schedule.total_expected_sessions,
          session_progress_percentage: sessionProgress,
          surveys_completed: surveys.length,
          recent_sessions: sessions.slice(-5),
          recent_surveys: surveys.slice(-5),
        };
      }

      return Response.json({
        success: true,
        schedule: schedule,
        progress: progressData,
      });
    } else {
      // 모든 스케줄 조회 (관리자용)
      const schedules = await sql`
        SELECT 
          rs.*, 
          u.name as user_name, 
          u.patient_id,
          COUNT(ms.id) as total_sessions,
          COUNT(CASE WHEN ms.completed = true THEN 1 END) as completed_sessions
        FROM research_schedules rs
        JOIN users u ON rs.user_id = u.id
        LEFT JOIN music_sessions ms ON rs.user_id = ms.user_id 
          AND ms.session_date BETWEEN rs.start_date AND rs.end_date
        GROUP BY rs.id, u.name, u.patient_id
        ORDER BY rs.created_at DESC
      `;

      // 각 스케줄에 대해 완료율 계산
      const schedulesWithProgress = schedules.map((schedule) => {
        const completionPercentage =
          schedule.total_expected_sessions > 0
            ? Math.round(
                (schedule.completed_sessions /
                  schedule.total_expected_sessions) *
                  100,
              )
            : 0;

        return {
          ...schedule,
          completion_percentage: completionPercentage,
        };
      });

      return Response.json({
        success: true,
        schedules: schedulesWithProgress,
        total: schedulesWithProgress.length,
      });
    }
  } catch (error) {
    console.error("Error fetching research schedule:", error);
    return Response.json(
      {
        success: false,
        error: "연구 스케줄 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

// 연구 일정 수정
export async function PUT(request) {
  try {
    const requestBody = await request.json();
    console.log("스케줄 업데이트 요청:", requestBody);

    const {
      id,
      user_id,
      start_date,
      end_date,
      total_weeks,
      sessions_per_week,
      session_duration_minutes,
      days_of_week,
      music_frequency,
      music_frequency_unit,
      music_sessions_per_occurrence,
      survey_frequency,
      survey_frequency_unit,
      selected_music_types,
      daily_music_sessions,
      daily_survey_sessions,
      active_survey_types,
      is_active,
      total_expected_sessions,
    } = requestBody;

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "스케줄 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    // 스케줄 존재 확인
    const existingSchedule = await sql`
      SELECT id FROM research_schedules WHERE id = ${id}
    `;

    if (existingSchedule.length === 0) {
      return Response.json(
        {
          success: false,
          error: "해당 스케줄을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 수정할 필드들만 업데이트
    const updates = [];
    const values = [];

    if (user_id !== undefined) {
      updates.push(`user_id = $${values.length + 1}`);
      values.push(user_id);
    }
    if (start_date !== undefined) {
      updates.push(`start_date = $${values.length + 1}`);
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push(`end_date = $${values.length + 1}`);
      values.push(end_date);
    }
    if (total_weeks !== undefined) {
      updates.push(`total_weeks = $${values.length + 1}`);
      values.push(total_weeks);
    }
    if (sessions_per_week !== undefined) {
      updates.push(`sessions_per_week = $${values.length + 1}`);
      values.push(sessions_per_week);
    }
    if (session_duration_minutes !== undefined) {
      updates.push(`session_duration_minutes = $${values.length + 1}`);
      values.push(session_duration_minutes);
    }
    if (days_of_week !== undefined) {
      updates.push(`days_of_week = $${values.length + 1}`);
      values.push(Array.isArray(days_of_week) ? days_of_week : []);
    }
    if (selected_music_types !== undefined) {
      updates.push(`selected_music_types = $${values.length + 1}`);
      values.push(
        Array.isArray(selected_music_types) ? selected_music_types : [],
      );
    }
    if (active_survey_types !== undefined) {
      updates.push(`active_survey_types = $${values.length + 1}`);
      values.push(
        Array.isArray(active_survey_types) ? active_survey_types : [],
      );
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${values.length + 1}`);
      values.push(is_active);
    }
    if (music_frequency !== undefined) {
      updates.push(`music_frequency = $${values.length + 1}`);
      values.push(music_frequency);
    }
    if (music_frequency_unit !== undefined) {
      updates.push(`music_frequency_unit = $${values.length + 1}`);
      values.push(music_frequency_unit);
    }
    if (music_sessions_per_occurrence !== undefined) {
      updates.push(`music_sessions_per_occurrence = $${values.length + 1}`);
      values.push(music_sessions_per_occurrence);
    }
    if (survey_frequency !== undefined) {
      updates.push(`survey_frequency = $${values.length + 1}`);
      values.push(survey_frequency);
    }
    if (survey_frequency_unit !== undefined) {
      updates.push(`survey_frequency_unit = $${values.length + 1}`);
      values.push(survey_frequency_unit);
    }
    if (total_expected_sessions !== undefined) {
      updates.push(`total_expected_sessions = $${values.length + 1}`);
      values.push(total_expected_sessions);
    }
    if (daily_music_sessions !== undefined) {
      updates.push(`daily_music_sessions = $${values.length + 1}`);
      values.push(daily_music_sessions);
    }
    if (daily_survey_sessions !== undefined) {
      updates.push(`daily_survey_sessions = $${values.length + 1}`);
      values.push(daily_survey_sessions);
    }

    if (updates.length === 0) {
      return Response.json(
        {
          success: false,
          error: "수정할 데이터가 없습니다.",
        },
        { status: 400 },
      );
    }

    values.push(id);
    const query = `
      UPDATE research_schedules 
      SET ${updates.join(", ")} 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const updatedSchedule = await sql(query, values);

    if (updatedSchedule.length === 0) {
      return Response.json(
        {
          success: false,
          error: "스케줄 업데이트에 실패했습니다.",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      schedule: updatedSchedule[0],
      message: "스케줄이 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("Error updating research schedule:", error);
    return Response.json(
      {
        success: false,
        error: "연구 스케줄 수정 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

// 연구 일정 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get("id");

    if (!scheduleId) {
      return Response.json(
        {
          success: false,
          error: "스케줄 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    // 스케줄 존재 확인
    const existingSchedule = await sql`
      SELECT id, user_id FROM research_schedules WHERE id = ${scheduleId}
    `;

    if (existingSchedule.length === 0) {
      return Response.json(
        {
          success: false,
          error: "해당 스케줄을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 스케줄 삭제 (관련 세션과 설문은 유지하되 스케줄만 삭제)
    await sql`
      DELETE FROM research_schedules WHERE id = ${scheduleId}
    `;

    return Response.json({
      success: true,
      message: "스케줄이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error deleting research schedule:", error);
    return Response.json(
      {
        success: false,
        error: "연구 스케줄 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
