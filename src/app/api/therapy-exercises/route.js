import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('module_id');
    const exerciseType = searchParams.get('exercise_type');
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = `
      SELECT 
        te.*,
        tm.name as module_name,
        tm.display_name as module_display_name
      FROM therapy_exercises te
      JOIN therapy_modules tm ON te.module_id = tm.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (moduleId) {
      conditions.push(`te.module_id = $${params.length + 1}`);
      params.push(parseInt(moduleId));
    }
    
    if (exerciseType) {
      conditions.push(`te.exercise_type = $${params.length + 1}`);
      params.push(exerciseType);
    }
    
    if (activeOnly) {
      conditions.push(`te.is_active = $${params.length + 1}`);
      params.push(true);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY te.exercise_order ASC, te.created_at ASC`;

    const exercises = await sql(query, params);

    return Response.json({ 
      success: true, 
      exercises: exercises 
    });

  } catch (error) {
    console.error('Error fetching therapy exercises:', error);
    return Response.json(
      { error: '치료 운동 조회 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      module_id,
      name, 
      display_name, 
      description, 
      exercise_type,
      difficulty_level = 1,
      exercise_order = 1,
      config = {},
      is_active = true 
    } = body;

    if (!module_id || !name || !display_name || !exercise_type) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다 (module_id, name, display_name, exercise_type)' },
        { status: 400 }
      );
    }

    const result = await sql(`
      INSERT INTO therapy_exercises (
        module_id, name, display_name, description, exercise_type, 
        difficulty_level, exercise_order, config, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      module_id, name, display_name, description, exercise_type,
      difficulty_level, exercise_order, JSON.stringify(config), is_active
    ]);

    return Response.json({ 
      success: true, 
      exercise: result[0] 
    });

  } catch (error) {
    console.error('Error creating therapy exercise:', error);
    return Response.json(
      { error: '치료 운동 생성 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}