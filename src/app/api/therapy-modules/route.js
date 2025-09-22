import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active_only') === 'true';

    let query = `
      SELECT 
        tm.*,
        COUNT(te.id) as exercise_count
      FROM therapy_modules tm
      LEFT JOIN therapy_exercises te ON tm.id = te.module_id AND te.is_active = true
    `;
    
    const params = [];
    
    if (activeOnly) {
      query += ` WHERE tm.is_active = $${params.length + 1}`;
      params.push(true);
    }
    
    query += `
      GROUP BY tm.id
      ORDER BY tm.module_order ASC, tm.created_at ASC
    `;

    const modules = await sql(query, params);

    return Response.json({ 
      success: true, 
      modules: modules 
    });

  } catch (error) {
    console.error('Error fetching therapy modules:', error);
    return Response.json(
      { error: '치료 모듈 조회 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      display_name, 
      description, 
      module_order, 
      difficulty_level = 1,
      is_active = true 
    } = body;

    if (!name || !display_name || !module_order) {
      return Response.json(
        { error: '필수 필드가 누락되었습니다 (name, display_name, module_order)' },
        { status: 400 }
      );
    }

    const result = await sql(`
      INSERT INTO therapy_modules (name, display_name, description, module_order, difficulty_level, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, display_name, description, module_order, difficulty_level, is_active]);

    return Response.json({ 
      success: true, 
      module: result[0] 
    });

  } catch (error) {
    console.error('Error creating therapy module:', error);
    return Response.json(
      { error: '치료 모듈 생성 중 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
}