import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    console.log("Starting to seed survey types and questions...");

    // 먼저 설문 유형들을 생성하거나 확인
    const surveyTypesToCreate = [
      {
        name: "THI",
        display_name: "Tinnitus Handicap Inventory (이명 장애 지수)",
        description:
          "이명으로 인한 일상생활 및 감정적 영향을 평가하는 25문항 설문",
      },
      {
        name: "HHIA",
        display_name:
          "Hearing Handicap Inventory for Adults (성인 청력 장애 지수)",
        description:
          "성인의 청력 손실이 일상생활에 미치는 영향을 평가하는 25문항 설문",
      },
      {
        name: "SSQ12",
        display_name: "Speech, Spatial and Qualities of Hearing Scale-12",
        description:
          "말소리 인지, 공간 청각, 음질 인식 능력을 평가하는 12문항 설문",
      },
      {
        name: "REHAB",
        display_name: "청각재활 및 음악치료 효과 평가",
        description: "음악치료 프로그램의 효과를 평가하는 8문항 설문",
      },
    ];

    // 설문 유형들 생성/업데이트
    let surveyTypesCreated = 0;
    for (const surveyType of surveyTypesToCreate) {
      try {
        await sql`
          INSERT INTO survey_types (name, display_name, description, is_active, created_at)
          VALUES (${surveyType.name}, ${surveyType.display_name}, ${surveyType.description}, true, ${new Date().toISOString()})
          ON CONFLICT (name) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            is_active = true
        `;
        surveyTypesCreated++;
        console.log(`Created/updated survey type: ${surveyType.name}`);
      } catch (err) {
        console.error(`Error creating survey type ${surveyType.name}:`, err);
      }
    }

    // THI (Tinnitus Handicap Inventory) - 25문항
    const thiQuestions = [
      "귀에서 소리가 들릴 때 집중이 어렵습니까?",
      "귀에서 소리가 크게 들려서 다른 사람의 말을 듣기 어렵습니까?",
      "귀에서 들리는 소리 때문에 화가 납니까?",
      "귀에서 들리는 소리 때문에 혼란스럽습니까?",
      "귀에서 들리는 소리 때문에 절망적입니까?",
      "귀에서 들리는 소리에 대해 많이 불평합니까?",
      "귀에서 들리는 소리 때문에 저녁에 잠들기 어렵습니까?",
      "귀에서 들리는 소리 때문에 사회생활을 피하려고 합니까?",
      "귀에서 들리는 소리 때문에 일에 방해를 받습니까?",
      "귀에서 들리는 소리 때문에 짜증이 자주 납니까?",
      "귀에서 들리는 소리 때문에 책 읽기가 어렵습니까?",
      "귀에서 들리는 소리 때문에 화가 나거나 분노를 느낍니까?",
      "귀에서 들리는 소리 때문에 가족이나 친구들과의 활동에 방해를 받습니까?",
      "귀에서 들리는 소리에 집중할 수 없다고 느낍니까?",
      "귀에서 들리는 소리가 너무 커서 조절할 수 없다고 느낍니까?",
      "귀에서 들리는 소리 때문에 피곤하다고 느낍니까?",
      "귀에서 들리는 소리 때문에 우울하다고 느낍니까?",
      "귀에서 들리는 소리 때문에 불안하다고 느낍니까?",
      "귀에서 들리는 소리에 대처할 수 없다고 느낍니까?",
      "귀에서 들리는 소리 때문에 기분이 나쁘다고 느낍니까?",
      "귀에서 들리는 소리로 인해 일상생활을 잘 할 수 없다고 느낍니까?",
      "귀에서 들리는 소리 때문에 휴식하기 어렵습니까?",
      "귀에서 들리는 소리 때문에 스트레스를 많이 받습니까?",
      "귀에서 들리는 소리 때문에 종종 나쁜 기분이 듭니까?",
      "귀에서 들리는 소리로 인해 삶을 즐기기 어렵다고 느낍니까?",
    ];

    // HHIA (Hearing Handicap Inventory for Adults) - 25문항
    const hhiaQuestions = [
      "전화를 사용할 때 듣기에 어려움이 있습니까?",
      "여러 사람이 동시에 말할 때 대화를 따라가기 어렵습니까?",
      "사람들이 명확하게 말하지 않는다고 불평합니까?",
      "가족들과 대화할 때 긴장합니까?",
      "집에서 방문객과 대화할 때 어려움이 있습니까?",
      "영화관이나 극장에서 대화나 연기를 이해하는데 어려움이 있습니까?",
      "대화 중에 상대방의 말을 자주 되묻습니까?",
      "TV나 라디오를 들을 때 다른 사람들이 너무 크다고 불평합니까?",
      "청력 문제 때문에 가족이나 친구들과 자주 다툽니까?",
      "대화에서 중요한 부분을 놓친다고 느낍니까?",
      "청력 문제 때문에 사회활동을 피합니까?",
      "청력 문제 때문에 당황스러운 상황을 경험합니까?",
      "청력 문제 때문에 파티나 사교모임에서 소외감을 느낍니까?",
      "청력 문제 때문에 우울감을 느낍니까?",
      "청력 문제로 인해 종교 활동 참여가 제한됩니까?",
      "청력 문제 때문에 다른 사람들과 말다툼을 합니까?",
      "청력 문제 때문에 TV 시청에 어려움이 있습니까?",
      "쇼핑할 때 직원과 의사소통에 어려움이 있습니까?",
      "청력 문제 때문에 좌절감을 느낍니까?",
      "청력 문제로 인해 신체적 위험(경보음 등)을 놓칠까 걱정됩니까?",
      "청력 문제 때문에 친구나 친척, 이웃과의 관계가 나빠졌습니까?",
      "청력 문제 때문에 가족들에게 짜증을 내게 됩니까?",
      "청력 문제로 인해 원하는 만큼 사람들과 어울리지 못합니까?",
      "청력 문제 때문에 식당에서 식사할 때 어려움이 있습니까?",
      "청력 문제로 인해 자신이 멍청하거나 무능력하다고 느낍니까?",
    ];

    // SSQ12 (Speech, Spatial and Qualities of Hearing Scale) - 12문항
    const ssq12Questions = [
      "조용한 환경에서 한 사람이 말할 때 말을 이해할 수 있습니까?",
      "여러 사람이 동시에 말하는 상황에서 한 사람의 목소리를 구별할 수 있습니까?",
      "소음이 있는 환경에서 대화를 이해할 수 있습니까?",
      "전화 통화 시 상대방의 말을 명확히 들을 수 있습니까?",
      "소리가 어느 방향에서 오는지 알 수 있습니까?",
      "소리가 얼마나 멀리서 오는지 판단할 수 있습니까?",
      "여러 소리 중에서 특정 소리를 찾을 수 있습니까?",
      "움직이는 차량의 소리 방향을 판단할 수 있습니까?",
      "음악을 들을 때 각 악기의 소리를 구별할 수 있습니까?",
      "일상생활의 소리들(문 닫는 소리, 물소리 등)을 자연스럽게 들을 수 있습니까?",
      "소리의 음색이나 음질을 잘 구별할 수 있습니까?",
      "전반적으로 들리는 소리가 자연스럽고 편안합니까?",
    ];

    // REHAB (청각재활 및 음악 자극 효과 평가) - 8문항
    const rehabQuestions = [
      "음악 치료 세션 후 대화 이해도가 향상되었다고 느끼십니까?",
      "음악 치료 후 이명 증상이 완화되었다고 느끼십니까?",
      "음악 치료가 집중력 향상에 도움이 되었다고 생각하십니까?",
      "음악 치료 세션이 스트레스 완화에 효과적이었다고 느끼십니까?",
      "음악 치료로 인해 전반적인 청각 능력이 개선되었다고 생각하십니까?",
      "음악 치료 세션이 심리적 안정감에 도움이 되었다고 느끼십니까?",
      "음악 치료 프로그램에 만족하십니까?",
      "전반적으로 음악 치료가 삶의 질 향상에 기여했다고 생각하십니까?",
    ];

    const allQuestions = [
      ...thiQuestions.map((text, index) => ({
        type: "THI",
        number: index + 1,
        text,
      })),
      ...hhiaQuestions.map((text, index) => ({
        type: "HHIA",
        number: index + 1,
        text,
      })),
      ...ssq12Questions.map((text, index) => ({
        type: "SSQ12",
        number: index + 1,
        text,
      })),
      ...rehabQuestions.map((text, index) => ({
        type: "REHAB",
        number: index + 1,
        text,
      })),
    ];

    let questionsAdded = 0;

    for (const question of allQuestions) {
      try {
        await sql`
          INSERT INTO survey_questions (survey_type, question_number, question_text, is_active, created_at)
          VALUES (${question.type}, ${question.number}, ${question.text}, true, ${new Date().toISOString()})
          ON CONFLICT (survey_type, question_number) DO UPDATE SET
            question_text = EXCLUDED.question_text,
            is_active = true
        `;
        questionsAdded++;
        console.log(
          `Added question ${question.type}-${question.number}: ${question.text.substring(0, 50)}...`,
        );
      } catch (err) {
        console.error(
          `Error adding question ${question.type}-${question.number}:`,
          err,
        );
      }
    }

    return Response.json({
      success: true,
      message: "설문 유형 및 질문이 성공적으로 생성되었습니다!",
      data: {
        surveyTypesCreated,
        questionsAdded: questionsAdded,
        breakdown: {
          THI: thiQuestions.length,
          HHIA: hhiaQuestions.length,
          SSQ12: ssq12Questions.length,
          REHAB: rehabQuestions.length,
        },
      },
    });
  } catch (error) {
    console.error("Error seeding survey data:", error);
    return Response.json(
      { error: "Failed to seed survey data", details: error.message },
      { status: 500 },
    );
  }
}
