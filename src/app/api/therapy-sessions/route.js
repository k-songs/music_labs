import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const moduleId = searchParams.get('module_id');
    const date = searchParams.get('date');

    let query = `
      SELECT 
        ts.*,
        tm.name as module_name,
        tm.display_name as module_display_name,
        u.name as user_name,
        u.patient_id
      FROM therapy_sessions ts
      JOIN therapy_modules tm ON ts.module_id = tm.id
      JOIN users u ON ts.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (userId) {
      conditions.push(`ts.user_id = $${params.length + 1}`);
      params.push(parseInt(userId));
    }
    
    if (moduleId) {
      conditions.push(`ts.module_id = $${params.length + 1}`);
      params.push(parseInt(moduleId));
    }
    
    if (date) {
      conditions.push(`ts.session_date = $${params.length + 1}`);
      params.push(date);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY ts.session_date DESC, ts.start_time DESC`;

    const sessions = await sql(query, params);

    return Response.json({ 
      success: true, 
      sessions: sessions 
    });

  } catch (error) {
    console.error('Error fetching therapy sessions:', error);
    return Response.json(
      { error: '치료 세션 조회 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      user_id,
      module_id,
      session_date = new Date().toISOString().split('T')[0],
      total_exercises = 0,
      session_notes = null
    } = body;

    if (!user_id || !module_id) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다 (user_id, module_id)' },
        { status: 400 }
      );
    }

    // 오늘 이미 같은 모듈의 세션이 진행 중인지 확인
    const existingSessions = await sql(`
      SELECT id FROM therapy_sessions 
      WHERE user_id = $1 AND module_id = $2 AND session_date = $3 AND completed = false
    `, [user_id, module_id, session_date]);

    if (existingSessions.length > 0) {
      return Response.json(
        { error: '이미 진행 중인 세션이 있습니다' },
        { status: 400 }
      );
    }

    const result = await sql(`
      INSERT INTO therapy_sessions (
        user_id, module_id, session_date, start_time, 
        total_exercises, session_notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      user_id, module_id, session_date, new Date().toISOString(),
      total_exercises, session_notes
    ]);

    return Response.json({ 
      success: true, 
      session: result[0] 
    });

  } catch (error) {
    console.error('Error creating therapy session:', error);
    return Response.json(
      { error: '치료 세션 생성 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}