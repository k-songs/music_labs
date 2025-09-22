import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Return all survey types for admin management
    const surveyTypes = await sql`
      SELECT * FROM survey_types 
      ORDER BY created_at DESC
    `;

    return Response.json({
      success: true,
      surveyTypes: surveyTypes,
      total: surveyTypes.length,
    });
  } catch (error) {
    console.error("Error fetching survey types:", error);
    return Response.json(
      {
        success: false,
        error: "설문 유형 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { name, display_name, description } = await request.json();

    if (!name?.trim() || !display_name?.trim()) {
      return Response.json(
        {
          success: false,
          error: "이름과 표시 이름은 필수 항목입니다.",
        },
        { status: 400 },
      );
    }

    // 중복 이름 확인
    const existingType = await sql`
      SELECT id FROM survey_types WHERE name = ${name.trim()}
    `;

    if (existingType.length > 0) {
      return Response.json(
        {
          success: false,
          error: "이미 존재하는 설문 유형 이름입니다.",
        },
        { status: 409 },
      );
    }

    const newSurveyTypes = await sql`
      INSERT INTO survey_types (name, display_name, description, is_active)
      VALUES (${name.trim()}, ${display_name.trim()}, ${description || null}, true)
      RETURNING *
    `;

    return Response.json({
      success: true,
      surveyType: newSurveyTypes[0],
      message: "설문 유형이 성공적으로 생성되었습니다.",
    });
  } catch (error) {
    console.error("Error creating survey type:", error);
    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          error: "이미 존재하는 설문 유형 이름입니다.",
        },
        { status: 409 },
      );
    }
    return Response.json(
      {
        success: false,
        error: "설문 유형 생성 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { id, name, display_name, description, is_active } =
      await request.json();

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "설문 유형 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    // 설문 유형 존재 확인
    const existingType = await sql`
      SELECT id FROM survey_types WHERE id = ${id}
    `;

    if (existingType.length === 0) {
      return Response.json(
        {
          success: false,
          error: "해당 설문 유형을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // Build update fields based on provided data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (display_name !== undefined)
      updateData.display_name = display_name.trim();
    if (description !== undefined) updateData.description = description || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return Response.json(
        {
          success: false,
          error: "수정할 데이터가 없습니다.",
        },
        { status: 400 },
      );
    }

    // 다른 설문 유형이 같은 이름을 사용하는지 확인
    if (name !== undefined) {
      const duplicateName = await sql`
        SELECT id FROM survey_types WHERE name = ${name.trim()} AND id != ${id}
      `;

      if (duplicateName.length > 0) {
        return Response.json(
          {
            success: false,
            error: "이미 다른 설문 유형이 사용 중인 이름입니다.",
          },
          { status: 409 },
        );
      }
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const values = fields.map((field) => updateData[field]);
    values.push(id);

    const query = `
      UPDATE survey_types 
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const updatedSurveyType = await sql(query, values);

    if (updatedSurveyType.length === 0) {
      return Response.json(
        {
          success: false,
          error: "설문 유형 업데이트에 실패했습니다.",
        },
        { status: 500 },
      );
    }

    return Response.json({
      success: true,
      surveyType: updatedSurveyType[0],
      message: "설문 유형이 성공적으로 업데이트되었습니다.",
    });
  } catch (error) {
    console.error("Error updating survey type:", error);
    if (error.code === "23505") {
      return Response.json(
        {
          success: false,
          error: "이미 존재하는 설문 유형 이름입니다.",
        },
        { status: 409 },
      );
    }
    return Response.json(
      {
        success: false,
        error: "설문 유형 수정 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        {
          success: false,
          error: "설문 유형 ID가 필요합니다.",
        },
        { status: 400 },
      );
    }

    // 설문 유형 존재 확인
    const existingType = await sql`
      SELECT id, name FROM survey_types WHERE id = ${id}
    `;

    if (existingType.length === 0) {
      return Response.json(
        {
          success: false,
          error: "해당 설문 유형을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    // Hard delete for admin purposes
    await sql`
      DELETE FROM survey_types WHERE id = ${id}
    `;

    return Response.json({
      success: true,
      message: `설문 유형 ${existingType[0].name}이 성공적으로 삭제되었습니다.`,
    });
  } catch (error) {
    console.error("Error deleting survey type:", error);
    return Response.json(
      {
        success: false,
        error: "설문 유형 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
