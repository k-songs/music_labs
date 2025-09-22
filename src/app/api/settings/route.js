import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (key) {
      // 특정 설정 조회
      const result = await sql`
        SELECT setting_key, setting_value, description 
        FROM system_settings 
        WHERE setting_key = ${key}
      `;
      
      if (result.length === 0) {
        return Response.json({ error: '설정을 찾을 수 없습니다' }, { status: 404 });
      }
      
      return Response.json({ setting: result[0] });
    } else {
      // 모든 설정 조회
      const settings = await sql`
        SELECT setting_key, setting_value, description 
        FROM system_settings 
        ORDER BY setting_key
      `;
      
      return Response.json({ settings });
    }
  } catch (error) {
    console.error('설정 조회 오류:', error);
    return Response.json({ error: '설정 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { setting_key, setting_value, description } = await request.json();

    if (!setting_key || !setting_value) {
      return Response.json({ error: '설정 키와 값이 필요합니다' }, { status: 400 });
    }

    // 설정 생성 또는 업데이트
    const result = await sql`
      INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
      VALUES (${setting_key}, ${setting_value}, ${description || null}, CURRENT_TIMESTAMP)
      ON CONFLICT (setting_key) 
      DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    return Response.json({ 
      message: '설정이 저장되었습니다',
      setting: result[0]
    });
  } catch (error) {
    console.error('설정 저장 오류:', error);
    return Response.json({ error: '설정 저장 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { setting_key, setting_value, description } = await request.json();

    if (!setting_key || !setting_value) {
      return Response.json({ error: '설정 키와 값이 필요합니다' }, { status: 400 });
    }

    const result = await sql`
      UPDATE system_settings 
      SET setting_value = ${setting_value},
          description = ${description || null},
          updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ${setting_key}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: '설정을 찾을 수 없습니다' }, { status: 404 });
    }

    return Response.json({ 
      message: '설정이 업데이트되었습니다',
      setting: result[0]
    });
  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    return Response.json({ error: '설정 업데이트 중 오류가 발생했습니다' }, { status: 500 });
  }
}