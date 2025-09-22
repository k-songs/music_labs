import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyType = searchParams.get("survey_type");
    const action = searchParams.get("action");

    // 설문 유형별 질문 개수 조회
    if (action === "counts") {
      const countResults = await sql`
        SELECT survey_type, COUNT(*) as count 
        FROM survey_questions 
        WHERE is_active = true 
        GROUP BY survey_type
      `;

      const counts = {};
      countResults.forEach((row) => {
        counts[row.survey_type] = parseInt(row.count);
      });

      return Response.json({ counts });
    }

    let questions;
    if (surveyType) {
      questions = await sql`
        SELECT * FROM survey_questions 
        WHERE survey_type = ${surveyType} 
        ORDER BY question_number ASC
      `;
    } else {
      questions = await sql`
        SELECT * FROM survey_questions 
        WHERE is_active = true 
        ORDER BY survey_type ASC, question_number ASC
      `;
    }

    return Response.json({ questions });
  } catch (error) {
    console.error("Error fetching survey questions:", error);
    return Response.json(
      { error: "Failed to fetch survey questions" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { survey_type, question_number, question_text, response_options } =
      await request.json();

    if (!survey_type || !question_number || !question_text?.trim()) {
      return Response.json(
        {
          error: "Survey type, question number, and question text are required",
        },
        { status: 400 },
      );
    }

    // 설문 유형이 존재하는지 확인
    const [existingSurveyType] = await sql`
      SELECT id FROM survey_types WHERE name = ${survey_type} AND is_active = true
    `;

    if (!existingSurveyType) {
      return Response.json(
        { error: "Invalid or inactive survey type" },
        { status: 400 },
      );
    }

    // 사용자 정의 답안 옵션 처리
    let responseOptionsJson = null;
    if (
      response_options &&
      Array.isArray(response_options) &&
      response_options.length > 0
    ) {
      // 빈 옵션 제거
      const filteredOptions = response_options.filter(
        (opt) => opt && opt.trim(),
      );
      if (filteredOptions.length > 0) {
        responseOptionsJson = JSON.stringify(filteredOptions);
      }
    }

    const [newQuestion] = await sql`
      INSERT INTO survey_questions (survey_type, question_number, question_text, response_options)
      VALUES (${survey_type}, ${question_number}, ${question_text.trim()}, ${responseOptionsJson})
      RETURNING *
    `;

    return Response.json({ question: newQuestion });
  } catch (error) {
    console.error("Error creating survey question:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return Response.json(
        {
          error:
            "Question with this number already exists for this survey type",
        },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to create survey question" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { id, question_text, is_active } = await request.json();

    if (!id || !question_text?.trim()) {
      return Response.json(
        { error: "ID and question text are required" },
        { status: 400 },
      );
    }

    const [updatedQuestion] = await sql`
      UPDATE survey_questions 
      SET question_text = ${question_text.trim()},
          is_active = ${is_active !== undefined ? is_active : true}
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedQuestion) {
      return Response.json(
        { error: "Survey question not found" },
        { status: 404 },
      );
    }

    return Response.json({ question: updatedQuestion });
  } catch (error) {
    console.error("Error updating survey question:", error);
    return Response.json(
      { error: "Failed to update survey question" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const [deletedQuestion] = await sql`
      UPDATE survey_questions 
      SET is_active = false
      WHERE id = ${id}
      RETURNING *
    `;

    if (!deletedQuestion) {
      return Response.json(
        { error: "Survey question not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting survey question:", error);
    return Response.json(
      { error: "Failed to delete survey question" },
      { status: 500 },
    );
  }
}
