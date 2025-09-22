"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Music,
  FileText,
  BarChart3,
  User,
  Clock,
  CheckCircle,
  Calendar,
  Settings,
  AlertCircle,
  Brain,
} from "lucide-react";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [loginId, setLoginId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 코드 저장 테스트 - 2025-08-09 (이 주석이 보이면 최신 버전)

  // 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    const savedUserType = localStorage.getItem("userType");

    console.log("Saved user:", savedUser, "Type:", savedUserType);

    if (savedUser && savedUserType) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setUserType(savedUserType);
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("userType");
      }
    }
  }, []);

  // 사용자 정보 조회 (참가자용)
  const { data: userData, refetch: refetchUser } = useQuery({
    queryKey: ["user", loginId],
    queryFn: async () => {
      if (!loginId) return null;

      const response = await fetch(`/api/users?patient_id=${loginId}`);
      const data = await response.json();

      console.log("User fetch response:", data);

      if (!response.ok) {
        throw new Error(data.error || "사용자를 찾을 수 없습니다");
      }

      return data.user;
    },
    enabled: false,
  });

  // 사용자 스케줄 조회
  const { data: scheduleData, refetch: refetchSchedule } = useQuery({
    queryKey: ["schedule", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return null;

      console.log(`📅 스케줄 조회 중... 사용자 ID: ${currentUser.id}`);
      const response = await fetch(
        `/api/research-schedule?user_id=${currentUser.id}`,
      );
      const data = await response.json();

      console.log("Schedule fetch response:", data);

      if (!response.ok) {
        console.warn("스케줄 조회 실패:", data.error);
        return null;
      }

      return data.schedule;
    },
    enabled: !!currentUser?.id && userType === "patient",
    staleTime: 0, // 항상 최신 데이터 가져오기
    cacheTime: 0, // 캐시 사용 안함
    refetchOnWindowFocus: true, // 창에 포커스 시 새로고침
    refetchInterval: 10000, // 10초마다 자동 새로고침 (기존 30초 → 10초)
  });

  // 오늘의 세션 조회
  const { data: todaySessionsData } = useQuery({
    queryKey: ["today-sessions", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/sessions?user_id=${currentUser.id}&date=${today}`,
      );
      const data = await response.json();

      if (!response.ok) {
        console.warn("세션 조회 실패:", data.error);
        return [];
      }

      return data.sessions || [];
    },
    enabled: !!currentUser?.id && userType === "patient",
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  // 오늘의 설문 조회
  const { data: todaySurveysData } = useQuery({
    queryKey: ["today-surveys", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];

      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/surveys?user_id=${currentUser.id}&date=${today}`,
      );
      const data = await response.json();

      if (!response.ok) {
        console.warn("설문 조회 실패:", data.error);
        return [];
      }

      return data.scores || [];
    },
    enabled: !!currentUser?.id && userType === "patient",
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    console.log("Attempting login with ID:", loginId);

    if (!loginId.trim()) {
      setError("ID를 입력해주세요");
      setIsLoading(false);
      return;
    }

    // 관리자 로그인 확인 - 데이터베이스에서 관리자 ID 조회
    try {
      const adminResponse = await fetch("/api/settings?key=admin_id");
      const adminData = await adminResponse.json();

      if (
        adminResponse.ok &&
        adminData.setting &&
        loginId.trim() === adminData.setting.setting_value
      ) {
        console.log("Admin login detected");

        const adminUser = {
          type: "admin",
          id: loginId,
          name: "관리자",
          patient_id: loginId,
        };

        setCurrentUser(adminUser);
        setUserType("admin");
        localStorage.setItem("currentUser", JSON.stringify(adminUser));
        localStorage.setItem("userType", "admin");

        // 바로 관리자 페이지로 이동
        setTimeout(() => {
          window.location.href = "/admin";
        }, 100);
        setIsLoading(false);
        return;
      }
    } catch (adminError) {
      console.warn("관리자 설정 조회 실패:", adminError);
      // 관리자 설정 조회 실패해도 참가자 로그인 시도는 계속
    }

    // 참가자 로그인
    try {
      console.log("Attempting patient login");
      const result = await refetchUser();

      if (result.data) {
        console.log("Patient login successful:", result.data);
        setCurrentUser(result.data);
        setUserType("patient");
        localStorage.setItem("currentUser", JSON.stringify(result.data));
        localStorage.setItem("userType", "patient");
        setError("");
      } else {
        console.log("Patient not found");
        setError("참가자 ID를 찾을 수 없습니다");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "참가자 ID를 찾을 수 없습니다");
    }

    setIsLoading(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserType(null);
    setLoginId("");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userType");
  };

  const handleAdminAccess = () => {
    window.location.href = "/admin";
  };

  // 관리자인 경우 바로 관리자 페이지로 리다이렉트
  useEffect(() => {
    if (userType === "admin") {
      console.log("Admin user detected, redirecting...");
      setTimeout(() => {
        window.location.href = "/admin";
      }, 100);
    }
  }, [userType]);

  // 오늘 활동 가능 여부 체크 (참가자용)
  const canDoActivityToday = () => {
    if (userType !== "patient" || !scheduleData) {
      return {
        music: false,
        survey: false,
        isActiveDay: false,
        reason: "스케줄 없음",
        debug: { scheduleData: null, userType },
      };
    }

    // 스케줄이 활성화되어 있는지 확인
    if (!scheduleData.is_active) {
      return {
        music: false,
        survey: false,
        isActiveDay: false,
        reason: "비활성 스케줄",
        debug: { isActive: scheduleData.is_active },
      };
    }

    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const activeDays = Array.isArray(scheduleData.days_of_week)
      ? scheduleData.days_of_week
      : [];
    const isActiveDay = activeDays.includes(todayDayOfWeek);

    console.log("🗓️ 활동일 체크:", {
      today: today.toDateString(),
      todayDayOfWeek,
      activeDays,
      isActiveDay,
      scheduleData: scheduleData,
    });

    if (!isActiveDay) {
      return {
        music: false,
        survey: false,
        isActiveDay: false,
        reason: "쉬는 날",
        debug: { todayDayOfWeek, activeDays, isActiveDay },
      };
    }

    // 스케줄 기간 확인
    const scheduleStart = new Date(scheduleData.start_date);
    const scheduleEnd = new Date(scheduleData.end_date);
    const todayDate = new Date(today.toDateString()); // 시간 제거

    // 시작일과 종료일도 시간 부분 제거하여 날짜만 비교
    const scheduleStartDate = new Date(scheduleStart.toDateString());
    const scheduleEndDate = new Date(scheduleEnd.toDateString());

    if (todayDate < scheduleStartDate || todayDate > scheduleEndDate) {
      return {
        music: false,
        survey: false,
        isActiveDay: false,
        reason: "스케줄 기간 외",
        debug: { todayDate, scheduleStartDate, scheduleEndDate },
      };
    }

    // 오늘 완료된 활동 수
    const completedMusicToday =
      todaySessionsData?.filter((s) => s.completed).length || 0;
    const completedSurveyToday = todaySurveysData?.length || 0;

    // 음악 세션 하루 필요 횟수 계산
    let requiredMusicSessions = 1;
    if (scheduleData.music_frequency_unit === "daily") {
      // 매일 frequency * sessions_per_occurrence
      requiredMusicSessions =
        (scheduleData.music_frequency || 1) *
        (scheduleData.music_sessions_per_occurrence || 1);
    } else if (scheduleData.music_frequency_unit === "weekly") {
      // 주간 빈도를 활동일로 나누어 분배
      const activeDaysInWeek = activeDays.length;
      if (activeDaysInWeek > 0) {
        const weeklyTotal =
          (scheduleData.music_frequency || 1) *
          (scheduleData.music_sessions_per_occurrence || 1);
        requiredMusicSessions = Math.ceil(weeklyTotal / activeDaysInWeek);
      }
    }

    // 설문 하루 필요 횟수 계산
    let requiredSurveys = 1;
    if (scheduleData.survey_frequency_unit === "daily") {
      // 매일 frequency * daily_survey_sessions
      requiredSurveys =
        (scheduleData.survey_frequency || 1) *
        (scheduleData.daily_survey_sessions || 1);
    } else if (scheduleData.survey_frequency_unit === "weekly") {
      // 주간 빈도를 활동일로 나누어 분배
      const activeDaysInWeek = activeDays.length;
      if (activeDaysInWeek > 0) {
        const weeklyTotal =
          (scheduleData.survey_frequency || 1) *
          (scheduleData.daily_survey_sessions || 1);
        requiredSurveys = Math.ceil(weeklyTotal / activeDaysInWeek);
      }
    }

    const canDoMusic = completedMusicToday < requiredMusicSessions;
    const canDoSurvey = completedSurveyToday < requiredSurveys;

    console.log("🎵 활동 빈도 계산:", {
      musicFrequency: scheduleData.music_frequency,
      musicFrequencyUnit: scheduleData.music_frequency_unit,
      musicSessionsPerOccurrence: scheduleData.music_sessions_per_occurrence,
      surveyFrequency: scheduleData.survey_frequency,
      surveyFrequencyUnit: scheduleData.survey_frequency_unit,
      dailySurveySessions: scheduleData.daily_survey_sessions,
      activeDaysInWeek: activeDays.length,
      requiredMusicSessions,
      requiredSurveys,
      completedMusicToday,
      completedSurveyToday,
      canDoMusic,
      canDoSurvey,
    });

    return {
      music: canDoMusic,
      survey: canDoSurvey,
      isActiveDay: true,
      completedMusic: completedMusicToday,
      requiredMusic: requiredMusicSessions,
      completedSurveys: completedSurveyToday,
      requiredSurveys: requiredSurveys,
      reason: "활동일",
      debug: {
        scheduleData,
        todayDayOfWeek,
        activeDays,
        completedMusicToday,
        completedSurveyToday,
        requiredMusicSessions,
        requiredSurveys,
      },
    };
  };

  const activityStatus = canDoActivityToday();

  // 로그인하지 않은 경우
  if (!currentUser || !userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              음악 재활 연구 시스템
            </h1>
            <p className="text-gray-600">ID를 입력하여 로그인하세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자 ID
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="사용자 ID를 입력하세요"
                required
                disabled={isLoading}
              />
              {error && (
                <div className="mt-2 flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {error}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 관리자 대시보드
  if (userType === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    관리자 대시보드
                  </h1>
                  <p className="text-sm text-gray-600">
                    음악 재활 연구 시스템 관리
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleAdminAccess}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  관리자 페이지 이동
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-300 rounded-lg"
                >
                  <User className="w-4 h-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <Settings className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              관리자 모드
            </h2>
            <p className="text-gray-600 mb-6">
              연구 데이터 관리 및 참가자 모니터링을 수행할 수 있습니다.
            </p>
            <button
              onClick={handleAdminAccess}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              관리자 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 참가자 대시보드
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 상단 바 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  음악 재활 연구
                </h1>
                <p className="text-sm text-gray-600">
                  {currentUser.name} ({currentUser.patient_id})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  console.log("🔄 수동 새로고침 시작...");
                  await Promise.all([
                    refetchSchedule(),
                    queryClient.invalidateQueries([
                      "today-sessions",
                      currentUser.id,
                    ]),
                    queryClient.invalidateQueries([
                      "today-surveys",
                      currentUser.id,
                    ]),
                  ]);
                  console.log("✅ 수동 새로고침 완료");
                }}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                title="최신 스케줄 가져오기"
              >
                <Clock className="w-4 h-4" />
                <span>새로고침</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-300 rounded-lg"
              >
                <User className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 현재 날짜 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </h2>
              <p className="text-sm text-gray-600">
                {activityStatus.isActiveDay ? "활동일입니다" : "쉬는날입니다"}
              </p>
            </div>
          </div>
        </div>

        {/* 스케줄 상태 */}
        {scheduleData ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              연구 진행 상황
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Music className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">음악 세션</span>
                </div>
                <p className="text-sm text-blue-700">
                  {activityStatus.music ? "오늘 진행 가능" : "오늘 완료됨"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  완료: {activityStatus.completedMusic || 0}/
                  {activityStatus.requiredMusic || 0}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span className="font-medium">설문 작성</span>
                </div>
                <p className="text-sm text-green-700">
                  {activityStatus.survey ? "오늘 진행 가능" : "오늘 완료됨"}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  완료: {activityStatus.completedSurveys || 0}/
                  {activityStatus.requiredSurveys || 0}
                </p>
              </div>
            </div>

            {/* 스케줄 세부 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                스케줄 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
                <div>
                  <p>
                    <span className="font-medium">기간:</span>{" "}
                    {new Date(scheduleData.start_date).toLocaleDateString(
                      "ko-KR",
                    )}{" "}
                    ~{" "}
                    {new Date(scheduleData.end_date).toLocaleDateString(
                      "ko-KR",
                    )}
                  </p>
                  <p>
                    <span className="font-medium">활동 요일:</span>{" "}
                    {Array.isArray(scheduleData.days_of_week)
                      ? scheduleData.days_of_week
                          .map(
                            (day) =>
                              ["일", "월", "화", "수", "목", "금", "토"][day],
                          )
                          .join(", ")
                      : "없음"}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">음악 빈도:</span>{" "}
                    {scheduleData.music_frequency || 1}회{" "}
                    {scheduleData.music_frequency_unit === "daily"
                      ? "매일"
                      : "매주"}
                  </p>
                  <p>
                    <span className="font-medium">설문 빈도:</span>{" "}
                    {scheduleData.survey_frequency || 1}회{" "}
                    {scheduleData.survey_frequency_unit === "daily"
                      ? "매일"
                      : "매주"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-orange-50 rounded-xl shadow-sm p-6">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-orange-900 mb-2">
                스케줄이 설정되지 않았습니다
              </h2>
              <p className="text-orange-700">
                관리자에게 연구 스케줄 설정을 요청하세요.
              </p>
            </div>
          </div>
        )}

        {/* 메인 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 음악 세션 */}
          <a
            href={
              scheduleData && activityStatus.isActiveDay && activityStatus.music
                ? `/session?user_id=${currentUser.id}`
                : "#"
            }
            className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group ${
              !scheduleData ||
              !activityStatus.isActiveDay ||
              !activityStatus.music
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Music className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              음악 세션
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              표준화된 음악으로 청각 재활을 진행하세요
            </p>
            <div className="text-blue-600 text-sm font-medium">
              {scheduleData &&
              activityStatus.isActiveDay &&
              activityStatus.music
                ? "세션 시작 →"
                : activityStatus.isActiveDay
                  ? "오늘 완료됨"
                  : "쉬는날"}
            </div>
          </a>

          {/* 설문 작성 */}
          <a
            href={
              scheduleData &&
              activityStatus.isActiveDay &&
              activityStatus.survey
                ? `/survey?user_id=${currentUser.id}`
                : "#"
            }
            className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group ${
              !scheduleData ||
              !activityStatus.isActiveDay ||
              !activityStatus.survey
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              설문 작성
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              청각 상태와 재활 효과를 평가해주세요
            </p>
            <div className="text-green-600 text-sm font-medium">
              {scheduleData &&
              activityStatus.isActiveDay &&
              activityStatus.survey
                ? "설문 시작 →"
                : activityStatus.isActiveDay
                  ? "오늘 완료됨"
                  : "쉬는날"}
            </div>
          </a>

          {/* 음악 치료 프로그램 */}
          <a
            href={`/therapy?user_id=${currentUser.id}`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              음악 치료
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              단계별 청각 인지 재활 훈련을 체험하세요
            </p>
            <div className="text-purple-600 text-sm font-medium">
              치료 시작 →
            </div>
          </a>

          {/* 기록 보기 */}
          <a
            href={`/records?user_id=${currentUser.id}`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              내 기록
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              세션 기록과 설문 결과를 확인하세요
            </p>
            <div className="text-orange-600 text-sm font-medium">
              기록 보기 →
            </div>
          </a>
        </div>

        {/* 최근 활동 */}
        {(todaySessionsData?.length > 0 || todaySurveysData?.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              오늘의 활동
            </h2>
            <div className="space-y-3">
              {todaySessionsData?.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Music className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {session.music_type} 세션
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(session.start_time).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  {session.completed && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>
              ))}

              {todaySurveysData?.slice(0, 2).map((survey) => (
                <div
                  key={survey.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <FileText className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {survey.survey_type} 설문 완료
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(survey.survey_date).toLocaleString("ko-KR")} •
                      점수: {survey.total_score}/{survey.max_possible_score}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
