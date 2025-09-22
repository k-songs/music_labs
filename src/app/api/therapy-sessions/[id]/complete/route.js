import sql from "@/app/api/utils/sql";

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      completed_exercises,
      overall_score,
      session_notes = null
    } = body;

    if (!id) {
      return Response.json(
        { error: '세션 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 세션 완료 처리
    const result = await sql(`
      UPDATE therapy_sessions 
      SET 
        end_time = $1,
        completed_exercises = $2,
        overall_score = $3,
        session_notes = $4,
        completed = true
      WHERE id = $5
      RETURNING *
    `, [
      new Date().toISOString(),
      completed_exercises || 0,
      overall_score || null,
      session_notes,
      parseInt(id)
    ]);

    if (result.length === 0) {
      return Response.json(
        { error: '세션을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return Response.json({ 
      success: true, 
      session: result[0] 
    });

  } catch (error) {
    console.error('Error completing therapy session:', error);
    return Response.json(
      { error: '세션 완료 처리 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}