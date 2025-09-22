"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function SurveyPage() {
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentSurvey, setCurrentSurvey] = useState(0);
  const [responses, setResponses] = useState({});
  const [completedSurveys, setCompletedSurveys] = useState([]);

  // URL에서 파라미터 추출
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get("user_id");
      const sessionIdParam = urlParams.get("session_id");

      if (userIdParam) {
        setUserId(userIdParam);
      } else {
        // localStorage에서 가져오기
        const savedUser = localStorage.getItem("currentUser");
        const savedUserType = localStorage.getItem("userType");

        if (savedUser && savedUserType === "patient") {
          const user = JSON.parse(savedUser);
          setUserId(user.id);
        } else {
          window.location.href = "/";
          return;
        }
      }

      if (sessionIdParam) {
        setSessionId(sessionIdParam);
      }
    }
  }, []);

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  // 사용자 스케줄 조회
  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ["schedule", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/research-schedule?user_id=${userId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.schedule;
    },
    enabled: !!userId,
  });

  // 오늘 설문 완료 확인
  const { data: todaySurveysData, isLoading: surveysLoading } = useQuery({
    queryKey: ["today-surveys", userId],
    queryFn: async () => {
      if (!userId) return [];
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/surveys?user_id=${userId}&date=${today}`,
      );
      if (!response.ok) return [];
      const data = await response.json();
      return data.scores || [];
    },
    enabled: !!userId,
  });

  // 설문 가능 여부 확인
  const canTakeSurveyToday = () => {
    if (!scheduleData) return false;

    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const activeDays = scheduleData.days_of_week || [];

    if (!activeDays.includes(todayDayOfWeek)) return false;

    // 스케줄 기간 확인
    const scheduleStart = new Date(scheduleData.start_date);
    const scheduleEnd = new Date(scheduleData.end_date);
    const todayDate = new Date(today.toDateString());
    const scheduleStartDate = new Date(scheduleStart.toDateString());
    const scheduleEndDate = new Date(scheduleEnd.toDateString());

    if (todayDate < scheduleStartDate || todayDate > scheduleEndDate) {
      return false;
    }

    const completedToday = todaySurveysData?.length || 0;

    // 설문 하루 필요 횟수 계산
    let requiredSurveys = 1;
    if (scheduleData.survey_frequency_unit === "daily") {
      requiredSurveys =
        (scheduleData.survey_frequency || 1) *
        (scheduleData.daily_survey_sessions || 1);
    } else if (scheduleData.survey_frequency_unit === "weekly") {
      const activeDaysInWeek = activeDays.length;
      if (activeDaysInWeek > 0) {
        const weeklyTotal =
          (scheduleData.survey_frequency || 1) *
          (scheduleData.daily_survey_sessions || 1);
        requiredSurveys = Math.ceil(weeklyTotal / activeDaysInWeek);
      }
    }

    return completedToday < requiredSurveys;
  };

  // 설문 유형들 (간단하게 하드코딩)
  const allSurveyTypes = [
    {
      type: "THI",
      title: "이명 평가 설문 (THI)",
      description: "이명으로 인한 일상생활의 어려움을 평가합니다",
      responseType: "thi",
    },
    {
      type: "HHIA",
      title: "청력 손실 평가 설문 (HHIA)",
      description: "청력 손실로 인한 어려움을 평가합니다",
      responseType: "hhia",
    },
    {
      type: "SSQ12",
      title: "공간 청각 평가 설문 (SSQ12)",
      description: "청각의 공간적 인지 능력을 평가합니다",
      responseType: "ssq12",
    },
  ];

  // 스케줄에서 활성화된 설문들만 필터링
  const surveyTypes = allSurveyTypes.filter(
    (survey) =>
      scheduleData?.active_survey_types?.includes(survey.type) || false,
  );

  // 설문 질문들 조회
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["survey-questions"],
    queryFn: async () => {
      const response = await fetch("/api/survey-questions");
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      return data.questions;
    },
    enabled: !!userId,
  });

  // 설문별로 질문 그룹화
  const surveyQuestions =
    questionsData?.reduce((acc, question) => {
      if (!acc[question.survey_type]) {
        acc[question.survey_type] = [];
      }
      acc[question.survey_type].push(question);
      return acc;
    }, {}) || {};

  // 설문 제출
  const submitSurveyMutation = useMutation({
    mutationFn: async ({ surveyType, surveyResponses }) => {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(userId),
          session_id: sessionId ? parseInt(sessionId) : null,
          survey_type: surveyType,
          responses: surveyResponses,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit survey");
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      setCompletedSurveys((prev) => [...prev, variables.surveyType]);
      queryClient.invalidateQueries(["today-surveys", userId]);

      // 다음 설문으로 이동 또는 완료
      if (currentSurvey < surveyTypes.length - 1) {
        setCurrentSurvey((prev) => prev + 1);
      } else {
        // 모든 설문 완료
        alert("모든 설문이 완료되었습니다!");
        window.location.href = `/`;
      }
    },
    onError: (error) => {
      alert(`설문 제출 중 오류가 발생했습니다: ${error.message}`);
    },
  });

  const handleResponseChange = (questionNumber, value) => {
    const currentSurveyData = surveyTypes[currentSurvey];
    if (!currentSurveyData) return;

    const surveyType = currentSurveyData.type;
    setResponses((prev) => ({
      ...prev,
      [surveyType]: {
        ...prev[surveyType],
        [questionNumber]: parseInt(value),
      },
    }));
  };

  const handleSubmitSurvey = () => {
    const currentSurveyData = surveyTypes[currentSurvey];
    if (!currentSurveyData) return;

    const surveyType = currentSurveyData.type;
    const questions = surveyQuestions[surveyType] || [];

    // 응답 배열 생성
    const surveyResponses = questions.map(
      (question) => responses[surveyType]?.[question.question_number] || 1,
    );

    submitSurveyMutation.mutate({ surveyType, surveyResponses });
  };

  const isCurrentSurveyComplete = () => {
    const currentSurveyData = surveyTypes[currentSurvey];
    if (!currentSurveyData) return false;

    const surveyType = currentSurveyData.type;
    const questions = surveyQuestions[surveyType] || [];
    const surveyResponses = responses[surveyType] || {};

    return questions.every(
      (question) => surveyResponses[question.question_number] !== undefined,
    );
  };

  // 응답 옵션
  const getResponseOptions = (responseType) => {
    switch (responseType) {
      case "thi":
      case "hhia":
        return [
          { value: 1, label: "아니오", score: 0 },
          { value: 2, label: "가끔", score: 2 },
          { value: 3, label: "예", score: 4 },
        ];
      case "ssq12":
        return Array.from({ length: 11 }, (_, i) => ({
          value: i,
          label: i === 0 ? "전혀 못함" : i === 10 ? "완벽함" : i.toString(),
          score: i,
        }));
      case "likert":
      default:
        return [
          { value: 1, label: "전혀 그렇지 않다" },
          { value: 2, label: "그렇지 않다" },
          { value: 3, label: "보통이다" },
          { value: 4, label: "그렇다" },
          { value: 5, label: "매우 그렇다" },
        ];
    }
  };

  // 로딩 중
  if (!userId || scheduleLoading || questionsLoading || surveysLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 스케줄 없음
  if (!scheduleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              스케줄이 설정되지 않았습니다
            </h2>
            <p className="text-gray-600 mb-4">
              관리자에게 연구 스케줄을 설정해달라고 요청하세요.
            </p>
            <button
              onClick={handleBackToHome}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 오늘 설문 불가능
  if (!canTakeSurveyToday()) {
    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const activeDays = scheduleData.days_of_week || [];
    const isActiveDay = activeDays.includes(todayDayOfWeek);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            {!isActiveDay ? (
              <>
                <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  오늘은 쉬는날입니다
                </h2>
                <p className="text-gray-600 mb-4">
                  활동 요일:{" "}
                  {activeDays
                    .map((day) => {
                      const dayNames = [
                        "일",
                        "월",
                        "화",
                        "수",
                        "목",
                        "금",
                        "토",
                      ];
                      return dayNames[day];
                    })
                    .join(", ")}
                </p>
              </>
            ) : (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  오늘 설문을 완료했습니다
                </h2>
                <p className="text-gray-600 mb-4">내일 다시 참여해주세요!</p>
              </>
            )}
            <button
              onClick={handleBackToHome}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 설문 없음
  if (!surveyTypes || surveyTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              활성화된 설문이 없습니다
            </h2>
            <p className="text-gray-600 mb-4">
              관리자가 설정한 설문이 없습니다.
            </p>
            <button
              onClick={handleBackToHome}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 현재 설문 데이터
  if (currentSurvey >= surveyTypes.length) {
    setCurrentSurvey(0);
    return null;
  }

  const currentSurveyData = surveyTypes[currentSurvey];
  const currentQuestions = surveyQuestions[currentSurveyData.type] || [];
  const responseOptions = getResponseOptions(currentSurveyData.responseType);

  if (currentQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              설문 질문이 없습니다
            </h2>
            <p className="text-gray-600 mb-4">
              관리자에게 설문 질문 추가를 요청하세요.
            </p>
            <button
              onClick={handleBackToHome}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToHome}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">설문 조사</h1>
                <p className="text-sm text-gray-600">
                  {currentSurvey + 1} / {surveyTypes.length} -{" "}
                  {currentSurveyData.title}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {surveyTypes.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    completedSurveys.includes(surveyTypes[index].type)
                      ? "bg-green-500"
                      : index === currentSurvey
                        ? "bg-blue-500"
                        : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* 설문 소개 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentSurveyData.title}
              </h2>
              <p className="text-sm text-gray-600">
                {currentSurveyData.description}
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(completedSurveys.length / surveyTypes.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            총 {currentQuestions.length}개 질문 • {completedSurveys.length}/
            {surveyTypes.length} 설문 완료
          </p>
        </div>

        {/* 설문 질문들 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="space-y-6">
            {currentQuestions.map((question) => (
              <div
                key={question.id}
                className="border-b border-gray-100 pb-6 last:border-b-0"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {question.question_number}. {question.question_text}
                </h3>

                <div
                  className={`grid gap-3 ${
                    currentSurveyData.responseType === "ssq12"
                      ? "grid-cols-2 md:grid-cols-6"
                      : currentSurveyData.responseType === "thi" ||
                          currentSurveyData.responseType === "hhia"
                        ? "grid-cols-1 md:grid-cols-3"
                        : "grid-cols-1 md:grid-cols-5"
                  }`}
                >
                  {responseOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        responses[currentSurveyData.type]?.[
                          question.question_number
                        ] === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.question_number}`}
                        value={option.value}
                        checked={
                          responses[currentSurveyData.type]?.[
                            question.question_number
                          ] === option.value
                        }
                        onChange={(e) =>
                          handleResponseChange(
                            question.question_number,
                            e.target.value,
                          )
                        }
                        className="mb-2 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-900 mb-1">
                        {option.value}
                      </span>
                      <span className="text-xs text-gray-600 text-center">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 네비게이션 */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              {Object.keys(responses[currentSurveyData.type] || {}).length} /{" "}
              {currentQuestions.length} 응답 완료
            </div>

            <div className="flex space-x-3">
              {currentSurvey > 0 && (
                <button
                  onClick={() => setCurrentSurvey((prev) => prev - 1)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={submitSurveyMutation.isPending}
                >
                  이전 설문
                </button>
              )}

              <button
                onClick={handleSubmitSurvey}
                disabled={
                  !isCurrentSurveyComplete() || submitSurveyMutation.isPending
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitSurveyMutation.isPending ? (
                  <span>제출 중...</span>
                ) : currentSurvey === surveyTypes.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>설문 완료</span>
                  </>
                ) : (
                  <>
                    <span>다음 설문</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-medium text-blue-800 mb-2">설문 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 각 질문에 대해 가장 적절한 답변을 선택해주세요</li>
            <li>• 모든 질문에 답변해야 다음 단계로 진행할 수 있습니다</li>
            <li>• 총 {surveyTypes.length}개의 설문을 순서대로 진행합니다</li>
            <li>• 하루에 한 번만 설문에 참여할 수 있습니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
