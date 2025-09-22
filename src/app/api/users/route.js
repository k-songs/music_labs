import sql from "@/app/api/utils/sql";

// Get all users or search users
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const patientId = searchParams.get("patient_id");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sort_by") || "patient_id";
    const sortOrder = searchParams.get("sort_order") || "ASC";

    if (userId) {
      const [user] = await sql`
        SELECT 
          u.*,
          CASE 
            WHEN u.birth_date IS NOT NULL 
            THEN calculate_age(u.birth_date) 
            ELSE u.age 
          END as calculated_age
        FROM users u 
        WHERE u.id = ${userId}
      `;

      if (!user) {
        return Response.json(
          {
            success: false,
            error: "사용자를 찾을 수 없습니다.",
          },
          { status: 404 },
        );
      }

      return Response.json({
        success: true,
        user,
      });
    }

    if (patientId) {
      const [user] = await sql`
        SELECT 
          u.*,
          CASE 
            WHEN u.birth_date IS NOT NULL 
            THEN calculate_age(u.birth_date) 
            ELSE u.age 
          END as calculated_age
        FROM users u 
        WHERE u.patient_id = ${patientId}
      `;

      if (!user) {
        return Response.json(
          {
            success: false,
            error: "해당 환자 ID를 찾을 수 없습니다.",
          },
          { status: 404 },
        );
      }

      return Response.json({
        success: true,
        user,
      });
    }

    // Build dynamic query for search and sort
    let baseQuery = `
      SELECT 
        u.*,
        CASE 
          WHEN u.birth_date IS NOT NULL 
          THEN calculate_age(u.birth_date) 
          ELSE u.age 
        END as calculated_age,
        COUNT(ms.id) as total_sessions,
        COUNT(CASE WHEN ms.completed = true THEN 1 END) as completed_sessions
      FROM users u 
      LEFT JOIN music_sessions ms ON u.id = ms.user_id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (search) {
      baseQuery += ` AND (
        LOWER(u.name) LIKE LOWER($${paramIndex}) OR 
        LOWER(u.patient_id) LIKE LOWER($${paramIndex}) OR 
        LOWER(u.diagnosis) LIKE LOWER($${paramIndex}) OR
        LOWER(u.email) LIKE LOWER($${paramIndex})
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    baseQuery += ` GROUP BY u.id`;

    // Validate sort column to prevent SQL injection
    const validSortColumns = [
      "name",
      "patient_id",
      "diagnosis",
      "hearing_test_date",
      "last_visit_date",
      "age",
    ];
    const sortColumn = validSortColumns.includes(sortBy)
      ? sortBy
      : "patient_id";
    const sortDirection = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    baseQuery += ` ORDER BY u.${sortColumn} ${sortDirection}`;

    const users = await sql(baseQuery, queryParams);

    return Response.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json(
      {
        success: false,
        error: "사용자 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

// Create new user
export async function POST(request) {
  try {
    const userData = await request.json();
    console.log("Received user data:", userData);

    const {
      name,
      birth_date,
      age,
      gender,
      phone,
      address,
      email,
      patient_id,
      diagnosis,
      pta_result,
      pta_db_hl,
      hearing_test_date,
      consent_given = false,
    } = userData;

    // 필수 필드 검증
    if (!name?.trim()) {
      return Response.json(
        {
          success: false,
          error: "이름은 필수 입력 사항입니다.",
        },
        { status: 400 },
      );
    }

    if (!patient_id?.trim()) {
      return Response.json(
        {
          success: false,
          error: "참여자 ID는 필수 입력 사항입니다.",
        },
        { status: 400 },
      );
    }

    // 중복 환자 ID 검사
    const existingUser = await sql`
      SELECT id FROM users WHERE patient_id = ${patient_id.trim()}
    `;

    if (existingUser.length > 0) {
      return Response.json(
        {
          success: false,
          error: "이미 존재하는 참여자 ID입니다.",
        },
        { status: 409 },
      );
    }

    // 나이 검증 - age나 birth_date 중 하나는 있어야 함
    if (!age && !birth_date) {
      return Response.json(
        {
          success: false,
          error: "나이 또는 생년월일은 필수 입력 사항입니다.",
        },
        { status: 400 },
      );
    }

    // Calculate age from birth_date if provided
    let calculatedAge = age;
    if (birth_date && !age) {
      const birthYear = new Date(birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      calculatedAge = currentYear - birthYear;
    }

    // 계산된 나이 검증
    if (!calculatedAge || calculatedAge <= 0 || calculatedAge > 120) {
      return Response.json(
        {
          success: false,
          error: "올바른 나이(1-120세)를 입력해주세요.",
        },
        { status: 400 },
      );
    }

    console.log("Inserting user with data:", {
      name: name.trim(),
      patient_id: patient_id.trim(),
      calculatedAge,
      gender: gender || "other",
    });

    const [newUser] = await sql`
      INSERT INTO users (
        name, birth_date, age, gender, phone, address, email,
        patient_id, diagnosis, pta_result, pta_db_hl, 
        hearing_test_date, consent_given, last_visit_date, consent_date
      )
      VALUES (
        ${name.trim()}, ${birth_date || null}, ${calculatedAge}, 
        ${gender || "other"}, ${phone || null}, ${address || null}, ${email || null},
        ${patient_id.trim()}, ${diagnosis || null}, ${pta_result || null}, 
        ${pta_db_hl || null}, ${hearing_test_date || null}, 
        ${consent_given}, ${new Date().toISOString().split("T")[0]},
        ${consent_given ? new Date().toISOString() : null}
      )
      RETURNING *
    `;

    console.log("Successfully created user:", newUser);

    // Automatically create a default research schedule for new user
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 28); // 4 weeks default

      await sql`
        INSERT INTO research_schedules (
          user_id, start_date, end_date, total_weeks, sessions_per_week,
          session_duration_minutes, days_of_week, total_expected_sessions,
          daily_music_sessions, daily_survey_sessions, active_survey_types,
          is_active, created_by, music_frequency, music_frequency_unit,
          survey_frequency, survey_frequency_unit, selected_music_types
        )
        VALUES (
          ${newUser.id},
          ${startDate.toISOString().split("T")[0]},
          ${endDate.toISOString().split("T")[0]},
          4,
          7,
          30,
          ARRAY[0,1,2,3,4,5,6],
          56,
          1,
          1,
          ARRAY['THI', 'HHIA', 'SSQ12'],
          true,
          'auto-generated',
          1,
          'daily',
          1,
          'daily',
          ARRAY[]::text[]
        )
      `;
      console.log("Default research schedule created for user:", newUser.id);
    } catch (scheduleError) {
      console.error(
        "Failed to create default schedule, but user was created:",
        scheduleError,
      );
      // Don't fail the user creation if schedule creation fails
    }

    return Response.json({
      success: true,
      user: newUser,
      message: "참가자가 성공적으로 추가되었습니다.",
    });
  } catch (error) {
    console.error("Error creating user:", error);
    console.error("Error details:", error.message, error.code);

    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          error: "이미 존재하는 참여자 ID입니다.",
        },
        { status: 409 },
      );
    }

    return Response.json(
      {
        success: false,
        error: `참여자 등록에 실패했습니다: ${error.message}`,
      },
      { status: 500 },
    );
  }
}

// Update user
export async function PUT(request) {
  try {
    const userData = await request.json();
    const {
      id,
      name,
      birth_date,
      age,
      gender,
      phone,
      address,
      email,
      patient_id,
      diagnosis,
      pta_result,
      pta_db_hl,
      hearing_test_date,
      consent_given,
    } = userData;

    if (!id || !name?.trim() || !patient_id?.trim()) {
      return Response.json(
        {
          success: false,
          error: "ID, 이름, 참가자 ID는 필수 항목입니다.",
        },
        { status: 400 },
      );
    }

    // 사용자 존재 확인
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${id}
    `;

    if (existingUser.length === 0) {
      return Response.json(
        {
          success: false,
          error: "사용자를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // 다른 사용자가 같은 patient_id 사용하는지 확인
    const duplicatePatientId = await sql`
      SELECT id FROM users WHERE patient_id = ${patient_id.trim()} AND id != ${id}
    `;

    if (duplicatePatientId.length > 0) {
      return Response.json(
        {
          success: false,
          error: "이미 다른 사용자가 사용 중인 참가자 ID입니다.",
        },
        { status: 409 },
      );
    }

    // Calculate age from birth_date if provided
    let calculatedAge = age;
    if (birth_date && !age) {
      const birthYear = new Date(birth_date).getFullYear();
      const currentYear = new Date().getFullYear();
      calculatedAge = currentYear - birthYear;
    }

    const [updatedUser] = await sql`
      UPDATE users 
      SET 
        name = ${name.trim()},
        birth_date = ${birth_date || null},
        age = ${calculatedAge || null},
        gender = ${gender || "other"},
        phone = ${phone || null},
        address = ${address || null},
        email = ${email || null},
        patient_id = ${patient_id.trim()},
        diagnosis = ${diagnosis || null},
        pta_result = ${pta_result || null},
        pta_db_hl = ${pta_db_hl || null},
        hearing_test_date = ${hearing_test_date || null},
        consent_given = ${consent_given !== undefined ? consent_given : false},
        last_visit_date = ${new Date().toISOString().split("T")[0]}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedUser) {
      return Response.json(
        {
          success: false,
          error: "사용자를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      user: updatedUser,
      message: "사용자 정보가 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          error: "이미 존재하는 참가자 ID입니다.",
        },
        { status: 409 },
      );
    }
    return Response.json(
      {
        success: false,
        error: "사용자 정보 수정 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
