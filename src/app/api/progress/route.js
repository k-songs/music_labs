import sql from '@/app/api/utils/sql';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return Response.json({ error: '사용자 ID가 필요합니다' }, { status: 400 });
    }

    // 사용자의 활성 스케줄 조회
    const scheduleQuery = await sql`
      SELECT * FROM research_schedules 
      WHERE user_id = ${userId} AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (scheduleQuery.length === 0) {
      return Response.json({ error: '활성 스케줄이 없습니다' }, { status: 404 });
    }

    const schedule = scheduleQuery[0];
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);
    const today = new Date();

    // 전체 진행률 계산
    const [sessionsData, surveysData] = await sql.transaction([
      sql`
        SELECT COUNT(*) as completed_sessions
        FROM music_sessions 
        WHERE user_id = ${userId} 
        AND completed = true
        AND session_date BETWEEN ${schedule.start_date} AND ${schedule.end_date}
      `,
      sql`
        SELECT COUNT(*) as completed_surveys
        FROM survey_scores 
        WHERE user_id = ${userId}
        AND survey_date BETWEEN ${schedule.start_date} AND ${schedule.end_date}
      `
    ]);

    const totalCompletedSessions = parseInt(sessionsData[0].completed_sessions);
    const totalCompletedSurveys = parseInt(surveysData[0].completed_surveys);

    // 주차별 진행률 계산
    const weeklyProgress = [];
    const currentDate = new Date(startDate);
    let weekNumber = 1;

    while (currentDate <= endDate && weekNumber <= schedule.total_weeks) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6); // 7일 후
      
      // 이번 주가 스케줄 끝날보다 나중이면 조정
      if (weekEnd > endDate) {
        weekEnd.setTime(endDate.getTime());
      }

      // 이번 주 완료된 세션 수
      const weekSessionsQuery = await sql`
        SELECT COUNT(*) as sessions
        FROM music_sessions 
        WHERE user_id = ${userId} 
        AND completed = true
        AND session_date BETWEEN ${weekStart.toISOString().split('T')[0]} 
        AND ${weekEnd.toISOString().split('T')[0]}
      `;

      // 이번 주 완료된 설문 수
      const weekSurveysQuery = await sql`
        SELECT COUNT(*) as surveys
        FROM survey_scores 
        WHERE user_id = ${userId}
        AND DATE(survey_date) BETWEEN ${weekStart.toISOString().split('T')[0]} 
        AND ${weekEnd.toISOString().split('T')[0]}
      `;

      const sessionsCompleted = parseInt(weekSessionsQuery[0].sessions);
      const surveysCompleted = parseInt(weekSurveysQuery[0].surveys);
      
      // 이번 주 목표 세션 수 계산 (활동 요일만 계산)
      let expectedSessions = 0;
      const activeDays = schedule.days_of_week || [];
      
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        if (activeDays.includes(d.getDay())) {
          expectedSessions += schedule.music_sessions_per_occurrence || 1;
        }
      }

      // 미래 주차는 아직 시작되지 않음을 표시
      const isCurrentOrPastWeek = weekEnd <= today;
      
      weeklyProgress.push({
        week: weekNumber,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        sessions_completed: sessionsCompleted,
        sessions_expected: expectedSessions,
        surveys_completed: surveysCompleted,
        completion_rate: expectedSessions > 0 ? Math.round((sessionsCompleted / expectedSessions) * 100) : 0,
        is_current_or_past: isCurrentOrPastWeek,
        is_current_week: weekStart <= today && today <= weekEnd
      });

      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }

    // 전체 진행률
    const overallProgress = {
      sessions_completed: totalCompletedSessions,
      sessions_expected: schedule.total_expected_sessions,
      surveys_completed: totalCompletedSurveys,
      completion_percentage: Math.round((totalCompletedSessions / schedule.total_expected_sessions) * 100),
      weekly_progress: weeklyProgress,
      schedule_info: {
        total_weeks: schedule.total_weeks,
        sessions_per_week: schedule.sessions_per_week,
        session_duration: schedule.session_duration_minutes,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        days_of_week: schedule.days_of_week
      }
    };

    return Response.json({ 
      success: true, 
      progress: overallProgress,
      schedule: schedule
    });

  } catch (error) {
    console.error('진행률 조회 실패:', error);
    return Response.json({ 
      error: '진행률 조회 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}