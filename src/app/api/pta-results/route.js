import sql from "@/app/api/utils/sql";

// PTA 결과 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    let query = `
      SELECT 
        id, user_id, test_date, ear_side, test_type,
        freq_250, freq_500, freq_1000, freq_2000, 
        freq_3000, freq_4000, freq_6000, freq_8000,
        pta_4freq, pta_6freq, created_at
      FROM pta_results
    `;
    
    let params = [];
    
    if (userId) {
      query += ` WHERE user_id = $1`;
      params = [userId];
    }
    
    query += ` ORDER BY test_date DESC, ear_side, test_type`;
    
    const results = await sql(query, params);
    
    return Response.json(results);
  } catch (error) {
    console.error('PTA 결과 조회 오류:', error);
    return Response.json({ error: 'PTA 결과를 가져오는데 실패했습니다.' }, { status: 500 });
  }
}

// PTA 결과 저장
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      user_id,
      test_date,
      ear_side, // 'left' or 'right'
      test_type, // 'AC' (기도) or 'BC' (골도)
      freq_250,
      freq_500,
      freq_1000,
      freq_2000,
      freq_3000,
      freq_4000,
      freq_6000,
      freq_8000
    } = body;

    // 필수 필드 검증
    if (!user_id || !test_date || !ear_side || !test_type) {
      return Response.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
    }

    // 4분법 PTA 계산 (500, 1000, 2000, 4000 Hz)
    const pta_4freq = await sql`
      SELECT calculate_pta_4freq(${freq_500}, ${freq_1000}, ${freq_2000}, ${freq_4000}) as result
    `;
    
    // 6분법 PTA 계산 (250, 500, 1000, 2000, 4000, 8000 Hz)
    const pta_6freq = await sql`
      SELECT calculate_pta_6freq(${freq_250}, ${freq_500}, ${freq_1000}, ${freq_2000}, ${freq_4000}, ${freq_8000}) as result
    `;

    // PTA 결과 저장
    const result = await sql`
      INSERT INTO pta_results (
        user_id, test_date, ear_side, test_type,
        freq_250, freq_500, freq_1000, freq_2000,
        freq_3000, freq_4000, freq_6000, freq_8000,
        pta_4freq, pta_6freq
      ) VALUES (
        ${user_id}, ${test_date}, ${ear_side}, ${test_type},
        ${freq_250}, ${freq_500}, ${freq_1000}, ${freq_2000},
        ${freq_3000}, ${freq_4000}, ${freq_6000}, ${freq_8000},
        ${pta_4freq[0].result}, ${pta_6freq[0].result}
      ) RETURNING *
    `;

    return Response.json(result[0]);
  } catch (error) {
    console.error('PTA 결과 저장 오류:', error);
    return Response.json({ error: 'PTA 결과 저장에 실패했습니다.' }, { status: 500 });
  }
}

// PTA 결과 수정
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      id,
      test_date,
      ear_side,
      test_type,
      freq_250,
      freq_500,
      freq_1000,
      freq_2000,
      freq_3000,
      freq_4000,
      freq_6000,
      freq_8000
    } = body;

    if (!id) {
      return Response.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    // 4분법 PTA 계산
    const pta_4freq = await sql`
      SELECT calculate_pta_4freq(${freq_500}, ${freq_1000}, ${freq_2000}, ${freq_4000}) as result
    `;
    
    // 6분법 PTA 계산
    const pta_6freq = await sql`
      SELECT calculate_pta_6freq(${freq_250}, ${freq_500}, ${freq_1000}, ${freq_2000}, ${freq_4000}, ${freq_8000}) as result
    `;

    const result = await sql`
      UPDATE pta_results SET
        test_date = ${test_date},
        ear_side = ${ear_side},
        test_type = ${test_type},
        freq_250 = ${freq_250},
        freq_500 = ${freq_500},
        freq_1000 = ${freq_1000},
        freq_2000 = ${freq_2000},
        freq_3000 = ${freq_3000},
        freq_4000 = ${freq_4000},
        freq_6000 = ${freq_6000},
        freq_8000 = ${freq_8000},
        pta_4freq = ${pta_4freq[0].result},
        pta_6freq = ${pta_6freq[0].result}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: 'PTA 결과를 찾을 수 없습니다.' }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error('PTA 결과 수정 오류:', error);
    return Response.json({ error: 'PTA 결과 수정에 실패했습니다.' }, { status: 500 });
  }
}

// PTA 결과 삭제
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'ID가 필요합니다.' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM pta_results WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ error: 'PTA 결과를 찾을 수 없습니다.' }, { status: 404 });
    }

    return Response.json({ message: 'PTA 결과가 삭제되었습니다.' });
  } catch (error) {
    console.error('PTA 결과 삭제 오류:', error);
    return Response.json({ error: 'PTA 결과 삭제에 실패했습니다.' }, { status: 500 });
  }
}