import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const userId = searchParams.get('user_id');
    const exerciseId = searchParams.get('exercise_id');

    let query = `
      SELECT 
        tr.*,
        te.name as exercise_name,
        te.display_name as exercise_display_name,
        te.exercise_type,
        ts.session_date,
        tm.name as module_name,
        tm.display_name as module_display_name
      FROM therapy_results tr
      JOIN therapy_exercises te ON tr.exercise_id = te.id
      JOIN therapy_sessions ts ON tr.session_id = ts.id
      JOIN therapy_modules tm ON te.module_id = tm.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (sessionId) {
      conditions.push(`tr.session_id = $${params.length + 1}`);
      params.push(parseInt(sessionId));
    }
    
    if (userId) {
      conditions.push(`tr.user_id = $${params.length + 1}`);
      params.push(parseInt(userId));
    }
    
    if (exerciseId) {
      conditions.push(`tr.exercise_id = $${params.length + 1}`);
      params.push(parseInt(exerciseId));
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY tr.completed_at DESC`;

    const results = await sql(query, params);

    return Response.json({ 
      success: true, 
      results: results 
    });

  } catch (error) {
    console.error('Error fetching therapy results:', error);
    return Response.json(
      { error: '치료 결과 조회 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      session_id,
      exercise_id,
      user_id,
      attempt_number = 1,
      score,
      accuracy_percentage,
      reaction_time_ms,
      attempts_count = 1,
      result_data = {}
    } = body;

    if (!session_id || !exercise_id || !user_id) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다 (session_id, exercise_id, user_id)' },
        { status: 400 }
      );
    }

    const result = await sql(`
      INSERT INTO therapy_results (
        session_id, exercise_id, user_id, attempt_number,
        score, accuracy_percentage, reaction_time_ms, 
        attempts_count, result_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      session_id, exercise_id, user_id, attempt_number,
      score, accuracy_percentage, reaction_time_ms,
      attempts_count, JSON.stringify(result_data)
    ]);

    return Response.json({ 
      success: true, 
      result: result[0] 
    });

  } catch (error) {
    console.error('Error creating therapy result:', error);
    return Response.json(
      { error: '치료 결과 저장 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}