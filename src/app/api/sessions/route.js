import sql from "@/app/api/utils/sql";

// Create new music session
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, music_type, session_date, session_notes } = body;

    if (!user_id || !music_type) {
      return Response.json(
        {
          success: false,
          error: "사용자 ID와 음악 유형은 필수 항목입니다.",
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

    const start_time = new Date().toISOString();
    const date = session_date || new Date().toISOString().split("T")[0];

    // Check user's research schedule to validate session creation
    const userSchedules = await sql`
      SELECT * FROM research_schedules 
      WHERE user_id = ${user_id} 
      AND is_active = true 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const userSchedule = userSchedules[0];

    if (userSchedule) {
      // Check if today is an active day
      const today = new Date(date);
      const todayDayOfWeek = today.getDay();
      const activeDays = Array.isArray(userSchedule.days_of_week)
        ? userSchedule.days_of_week
        : [];

      if (!activeDays.includes(todayDayOfWeek)) {
        return Response.json(
          {
            success: false,
            error: "오늘은 스케줄에 따른 비활성일입니다.",
          },
          { status: 400 },
        );
      }

      // Check daily session limits
      const todaySessions = await sql`
        SELECT COUNT(*) as session_count
        FROM music_sessions
        WHERE user_id = ${user_id} AND session_date = ${date}
      `;

      const musicFreq = userSchedule.music_frequency || 1;
      const musicUnit = userSchedule.music_frequency_unit || "daily";

      let requiredSessionsToday = 0;
      switch (musicUnit) {
        case "daily":
          requiredSessionsToday = musicFreq;
          break;
        case "weekly":
          requiredSessionsToday = Math.ceil(musicFreq / activeDays.length);
          break;
        case "monthly":
          const activeDaysPerWeek = activeDays.length;
          const activeDaysPerMonth = Math.round(activeDaysPerWeek * 4.33);
          requiredSessionsToday = Math.ceil(musicFreq / activeDaysPerMonth);
          break;
      }

      const completedToday = todaySessions[0]?.session_count || 0;
      if (completedToday >= requiredSessionsToday) {
        return Response.json(
          {
            success: false,
            error: `오늘의 세션을 모두 완료했습니다 (${completedToday}/${requiredSessionsToday})`,
          },
          { status: 400 },
        );
      }

      // Verify selected music type is allowed for this user
      const allowedMusicTypes = Array.isArray(userSchedule.selected_music_types)
        ? userSchedule.selected_music_types
        : [];

      if (
        allowedMusicTypes.length > 0 &&
        !allowedMusicTypes.includes(music_type)
      ) {
        return Response.json(
          {
            success: false,
            error: "이 음악 유형은 스케줄에 허용되지 않습니다.",
          },
          { status: 400 },
        );
      }
    }

    // Count today's sessions for sequence numbering
    const todaySessionsForSequence = await sql`
      SELECT COUNT(*) as session_count
      FROM music_sessions
      WHERE user_id = ${user_id} AND session_date = ${date}
    `;

    const session_sequence =
      (todaySessionsForSequence[0]?.session_count || 0) + 1;

    const result = await sql`
      INSERT INTO music_sessions (
        user_id, session_date, start_time, music_type, volume_db_spl, 
        session_notes, session_sequence
      )
      VALUES (
        ${user_id}, ${date}, ${start_time}, ${music_type}, '65-70dB SPL',
        ${session_notes || `세션 ${session_sequence} - ${new Date().toLocaleTimeString("ko-KR")} 시작`}, 
        ${session_sequence}
      )
      RETURNING *
    `;

    return Response.json({
      success: true,
      session: result[0],
      message: "음악 세션이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return Response.json(
      {
        success: false,
        error: "세션 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

// Get sessions with optional date filtering
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get("user_id");
    const date = url.searchParams.get("date"); // YYYY-MM-DD format

    if (user_id) {
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

      let query = `
        SELECT s.*, u.name as user_name, u.patient_id
        FROM music_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = $1
      `;
      let params = [user_id];

      if (date) {
        query += ` AND s.session_date = $2`;
        params.push(date);
      }

      query += ` ORDER BY s.session_date DESC, s.start_time DESC`;

      const result = await sql(query, params);

      return Response.json({
        success: true,
        sessions: result,
        total: result.length,
      });
    }

    // Get all sessions (admin view)
    let query = `
      SELECT s.*, u.name as user_name, u.patient_id
      FROM music_sessions s
      JOIN users u ON s.user_id = u.id
    `;
    let params = [];

    if (date) {
      query += ` WHERE s.session_date = $1`;
      params.push(date);
    }

    query += ` ORDER BY s.session_date DESC, s.start_time DESC`;

    const result = await sql(query, params);

    return Response.json({
      success: true,
      sessions: result,
      total: result.length,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return Response.json(
      {
        success: false,
        error: "세션 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
