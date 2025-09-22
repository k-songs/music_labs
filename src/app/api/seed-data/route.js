import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    console.log("Starting to seed data...");

    // 1. 샘플 사용자 추가
    const sampleUsers = [
      {
        name: "김민수",
        patient_id: "P001",
        age: 45,
        gender: "male",
        phone: "010-1234-5678",
        email: "minsu.kim@example.com",
        birth_date: "1978-03-15",
        diagnosis: "돌발성 난청",
        pta_result: 35.5,
        pta_db_hl: 38.0,
        hearing_test_date: "2024-01-15",
        consent_given: true,
      },
      {
        name: "이영희",
        patient_id: "P002",
        age: 52,
        gender: "female",
        phone: "010-2345-6789",
        email: "younghee.lee@example.com",
        birth_date: "1971-07-22",
        diagnosis: "이명",
        pta_result: 28.0,
        pta_db_hl: 30.5,
        hearing_test_date: "2024-02-01",
        consent_given: true,
      },
      {
        name: "박철호",
        patient_id: "P003",
        age: 38,
        gender: "male",
        phone: "010-3456-7890",
        email: "cheolho.park@example.com",
        birth_date: "1985-11-08",
        diagnosis: "소음성 난청",
        pta_result: 42.0,
        pta_db_hl: 45.5,
        hearing_test_date: "2024-01-28",
        consent_given: true,
      },
    ];

    const userIds = [];
    for (const user of sampleUsers) {
      try {
        const [newUser] = await sql`
          INSERT INTO users (
            name, patient_id, age, gender, phone, email, birth_date,
            diagnosis, pta_result, pta_db_hl, hearing_test_date, 
            consent_given, consent_date, last_visit_date, created_at
          )
          VALUES (
            ${user.name}, ${user.patient_id}, ${user.age}, ${user.gender},
            ${user.phone}, ${user.email}, ${user.birth_date}, ${user.diagnosis},
            ${user.pta_result}, ${user.pta_db_hl}, ${user.hearing_test_date},
            ${user.consent_given}, ${new Date().toISOString()}, 
            ${new Date().toISOString().split("T")[0]}, ${new Date().toISOString()}
          )
          ON CONFLICT (patient_id) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email
          RETURNING id
        `;
        userIds.push(newUser.id);
        console.log(`Created/updated user: ${user.name} (ID: ${newUser.id})`);
      } catch (err) {
        console.error(`Error creating user ${user.name}:`, err);
      }
    }

    // 2. 음악 타입 추가
    const musicTypes = [
      {
        name: "클래식 음악",
        description: "바로크 및 고전 시대의 클래식 음악",
      },
      {
        name: "자연음",
        description: "숲속 새소리, 물소리 등 자연의 소리",
      },
      {
        name: "바이노럴 비트",
        description: "좌우 귀에 서로 다른 주파수를 제공하는 음향치료",
      },
      {
        name: "화이트 노이즈",
        description: "모든 주파수가 동일한 강도로 포함된 소음",
      },
    ];

    for (const musicType of musicTypes) {
      try {
        await sql`
          INSERT INTO music_types (name, description, is_active, created_at)
          VALUES (${musicType.name}, ${musicType.description}, true, ${new Date().toISOString()})
          ON CONFLICT (name) DO UPDATE SET 
            description = EXCLUDED.description
        `;
        console.log(`Created/updated music type: ${musicType.name}`);
      } catch (err) {
        console.error(`Error creating music type ${musicType.name}:`, err);
      }
    }

    // 3. 설문 유형 추가
    const surveyTypes = [
      {
        name: "THI",
        display_name: "이명장애지수 (THI)",
        description: "이명으로 인한 생활 장애 평가",
      },
      {
        name: "HHIA",
        display_name: "청각장애지수 (HHIA)",
        description: "청각 장애로 인한 생활 장애 평가",
      },
      {
        name: "SSQ12",
        display_name: "음성 공간 음질 설문 (SSQ12)",
        description: "듣기 능력의 3가지 영역 평가",
      },
      {
        name: "REHAB",
        display_name: "재활 효과 설문",
        description: "음악 재활의 주관적 효과 평가",
      },
    ];

    for (const surveyType of surveyTypes) {
      try {
        await sql`
          INSERT INTO survey_types (name, display_name, description, is_active, created_at)
          VALUES (${surveyType.name}, ${surveyType.display_name}, ${surveyType.description}, true, ${new Date().toISOString()})
          ON CONFLICT (name) DO UPDATE SET 
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description
        `;
        console.log(`Created/updated survey type: ${surveyType.name}`);
      } catch (err) {
        console.error(`Error creating survey type ${surveyType.name}:`, err);
      }
    }

    // 4. 사용자별 기본 스케줄 생성
    for (const userId of userIds) {
      try {
        // 기존 활성 스케줄 비활성화
        await sql`
          UPDATE research_schedules 
          SET is_active = false 
          WHERE user_id = ${userId} AND is_active = true
        `;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 28); // 4주 기본 스케줄

        await sql`
          INSERT INTO research_schedules (
            user_id, start_date, end_date, total_weeks, sessions_per_week,
            session_duration_minutes, days_of_week, total_expected_sessions,
            daily_music_sessions, daily_survey_sessions, active_survey_types,
            is_active, created_by, music_frequency, music_frequency_unit,
            survey_frequency, survey_frequency_unit, selected_music_types
          )
          VALUES (
            ${userId},
            ${startDate.toISOString().split("T")[0]},
            ${endDate.toISOString().split("T")[0]},
            4,
            7,
            30,
            ARRAY[0,1,2,3,4,5,6],
            28,
            1,
            1,
            ARRAY['THI', 'HHIA', 'SSQ12'],
            true,
            'seed-data',
            1,
            'daily',
            1,
            'daily',
            ARRAY['클래식 음악', '자연음']
          )
          ON CONFLICT DO NOTHING
        `;
        console.log(`Created default schedule for user ${userId}`);
      } catch (err) {
        console.error(`Error creating schedule for user ${userId}:`, err);
      }
    }

    // 5. 샘플 세션 추가
    const sampleSessions = [];
    const musicTypeNames = musicTypes.map((m) => m.name);

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      const sessionCount = Math.floor(Math.random() * 8) + 3; // 3-10 sessions per user

      for (let j = 0; j < sessionCount; j++) {
        const sessionDate = new Date();
        sessionDate.setDate(
          sessionDate.getDate() - Math.floor(Math.random() * 14),
        ); // Last 14 days

        const startTime = new Date(sessionDate);
        startTime.setHours(9 + Math.floor(Math.random() * 10)); // 9AM - 7PM
        startTime.setMinutes(Math.floor(Math.random() * 60));

        const duration = 20 + Math.floor(Math.random() * 40); // 20-60 minutes
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const musicType =
          musicTypeNames[Math.floor(Math.random() * musicTypeNames.length)];
        const completed = Math.random() > 0.15; // 85% completion rate

        sampleSessions.push({
          user_id: userId,
          session_date: sessionDate.toISOString().split("T")[0],
          start_time: startTime.toISOString(),
          end_time: completed ? endTime.toISOString() : null,
          duration_minutes: completed ? duration : null,
          music_type: musicType,
          volume_db_spl: "65-70dB SPL",
          completed: completed,
        });
      }
    }

    for (const session of sampleSessions) {
      try {
        await sql`
          INSERT INTO music_sessions (
            user_id, session_date, start_time, end_time, duration_minutes,
            music_type, volume_db_spl, completed, created_at
          )
          VALUES (
            ${session.user_id}, ${session.session_date}, ${session.start_time},
            ${session.end_time}, ${session.duration_minutes}, ${session.music_type},
            ${session.volume_db_spl}, ${session.completed}, ${new Date().toISOString()}
          )
        `;
      } catch (err) {
        console.error("Error creating session:", err);
      }
    }

    // 6. 샘플 설문 점수 추가
    const surveyTypeNames = ["THI", "HHIA", "SSQ12"];
    let totalSurveys = 0;

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];

      for (const surveyType of surveyTypeNames) {
        const numSurveys = Math.floor(Math.random() * 2) + 1; // 1-2 surveys per type per user

        for (let j = 0; j < numSurveys; j++) {
          const surveyDate = new Date();
          surveyDate.setDate(
            surveyDate.getDate() - Math.floor(Math.random() * 12),
          ); // Last 12 days

          let totalScore, maxScore, detailedScores;

          if (surveyType === "THI" || surveyType === "HHIA") {
            // THI/HHIA: 0-100 점수
            totalScore = Math.floor(Math.random() * 60) + 10; // 10-70 (중간 정도 장애)
            maxScore = 100;

            if (surveyType === "THI") {
              detailedScores = {
                functional_score: Math.floor(totalScore * 0.6),
                emotional_score: Math.floor(totalScore * 0.3),
                catastrophic_score: Math.floor(totalScore * 0.1),
              };
            } else {
              detailedScores = {
                social_score: Math.floor(totalScore * 0.5),
                emotional_score: Math.floor(totalScore * 0.5),
              };
            }
          } else if (surveyType === "SSQ12") {
            // SSQ12: 0-10 점수
            const avgScore = 4 + Math.random() * 4; // 4-8 average (중간 정도)
            totalScore = Math.round(avgScore * 10) / 10;
            maxScore = 10;
            detailedScores = {
              speech_score:
                Math.round((avgScore + (Math.random() - 0.5)) * 10) / 10,
              spatial_score:
                Math.round((avgScore + (Math.random() - 0.5)) * 10) / 10,
              quality_score:
                Math.round((avgScore + (Math.random() - 0.5)) * 10) / 10,
            };
          }

          const percentageScore =
            Math.round((totalScore / maxScore) * 100 * 10) / 10;

          try {
            await sql`
              INSERT INTO survey_scores (
                user_id, session_id, survey_type, total_score, max_possible_score,
                percentage_score, survey_date, detailed_scores, subscale_scores
              )
              VALUES (
                ${userId}, NULL, ${surveyType}, ${totalScore}, ${maxScore},
                ${percentageScore}, ${surveyDate.toISOString()}, 
                ${JSON.stringify(detailedScores)}, ${JSON.stringify(detailedScores)}
              )
            `;
            totalSurveys++;

            console.log(
              `Created ${surveyType} survey for user ${userId} (Score: ${totalScore}/${maxScore})`,
            );
          } catch (err) {
            console.error(
              `Error creating ${surveyType} survey for user ${userId}:`,
              err,
            );
          }
        }
      }
    }

    return Response.json({
      success: true,
      message: "📊 샘플 데이터가 성공적으로 생성되었습니다!",
      data: {
        users: userIds.length,
        musicTypes: musicTypes.length,
        surveyTypes: surveyTypes.length,
        sessions: sampleSessions.length,
        surveys: totalSurveys,
        schedules: userIds.length,
      },
    });
  } catch (error) {
    console.error("Error seeding data:", error);
    return Response.json(
      {
        success: false,
        error: "샘플 데이터 생성 중 오류가 발생했습니다.",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
