import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const { user_id, session_id, survey_type, responses } = await request.json();

    if (!user_id || !survey_type || !responses) {
      return Response.json(
        { error: "user_id, survey_type, and responses are required" },
        { status: 400 }
      );
    }

    // 응답 배열을 PostgreSQL 배열 형태로 변환
    const responseArray = Object.values(responses).map(r => parseInt(r));

    let scoringResult;
    let maxScore = 100;

    // 설문 타입별 채점
    if (survey_type === 'THI') {
      const [result] = await sql`SELECT calculate_thi_score(${responseArray}) as score`;
      scoringResult = result.score;
      maxScore = 100;
    } else if (survey_type === 'HHIA') {
      const [result] = await sql`SELECT calculate_hhia_score(${responseArray}) as score`;
      scoringResult = result.score;
      maxScore = 100;
    } else if (survey_type === 'SSQ12') {
      const [result] = await sql`SELECT calculate_ssq12_score(${responseArray}) as score`;
      scoringResult = result.score;
      maxScore = 10;
    } else {
      // 기본 채점 (단순 합계)
      const totalScore = responseArray.reduce((sum, val) => sum + (val || 0), 0);
      const questionCount = responseArray.length;
      maxScore = questionCount * 5; // 5점 척도 가정
      
      scoringResult = {
        total_score: totalScore,
        max_score: maxScore,
        percentage: Math.round((totalScore / maxScore) * 100 * 10) / 10
      };
    }

    // 개별 응답들을 survey_responses 테이블에 저장
    const responsePromises = Object.entries(responses).map(([questionNum, responseValue]) => {
      return sql`
        INSERT INTO survey_responses (
          user_id, session_id, survey_type, question_number, response_value
        ) VALUES (
          ${user_id}, ${session_id}, ${survey_type}, ${parseInt(questionNum)}, ${parseInt(responseValue)}
        )
      `;
    });

    await Promise.all(responsePromises);

    // 총점을 survey_scores 테이블에 저장
    const [surveyScore] = await sql`
      INSERT INTO survey_scores (
        user_id, session_id, survey_type, total_score, max_possible_score, 
        percentage_score, detailed_scores, subscale_scores
      ) VALUES (
        ${user_id}, ${session_id || null}, ${survey_type}, 
        ${scoringResult.total_score}, ${maxScore}, 
        ${scoringResult.percentage}, ${JSON.stringify(scoringResult)},
        ${JSON.stringify(scoringResult)}
      )
      RETURNING *
    `;

    return Response.json({ 
      success: true, 
      scores: scoringResult,
      survey_score_id: surveyScore.id
    });

  } catch (error) {
    console.error('Survey scoring error:', error);
    return Response.json(
      { error: 'Failed to score survey' },
      { status: 500 }
    );
  }
}

// 사용자의 설문 점수 추이 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const surveyType = searchParams.get('survey_type');

    if (!userId) {
      return Response.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        ss.*,
        u.name as user_name,
        u.patient_id,
        DATE(ss.survey_date) as date_only
      FROM survey_scores ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.user_id = $1
    `;
    
    const params = [userId];
    
    if (surveyType) {
      query += ` AND ss.survey_type = $2`;
      params.push(surveyType);
    }
    
    query += ` ORDER BY ss.survey_date ASC`;

    const scores = await sql(query, params);

    // 그룹별로 정리
    const scoresByType = {};
    scores.forEach(score => {
      if (!scoresByType[score.survey_type]) {
        scoresByType[score.survey_type] = [];
      }
      scoresByType[score.survey_type].push({
        ...score,
        detailed_scores: typeof score.detailed_scores === 'string' 
          ? JSON.parse(score.detailed_scores) 
          : score.detailed_scores
      });
    });

    return Response.json({ 
      scores: scoresByType,
      timeline: scores.map(s => ({
        date: s.date_only,
        survey_type: s.survey_type,
        percentage_score: s.percentage_score,
        total_score: s.total_score
      }))
    });

  } catch (error) {
    console.error('Failed to fetch survey scores:', error);
    return Response.json(
      { error: 'Failed to fetch survey scores' },
      { status: 500 }
    );
  }
}