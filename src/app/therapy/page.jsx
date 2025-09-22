"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Brain,
  Music,
  Headphones,
  Mic,
  Target,
  Clock,
  Star,
  ArrowLeft,
  Play,
  CheckCircle,
  Lock,
  TrendingUp,
  Volume2,
} from "lucide-react";

export default function TherapyPage() {
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Get user info from URL or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get("user_id");

      if (userIdParam) {
        setUserId(userIdParam);
      } else {
        const savedUser = localStorage.getItem("currentUser");
        const savedUserType = localStorage.getItem("userType");

        if (savedUser && savedUserType === "patient") {
          const user = JSON.parse(savedUser);
          setUserId(user.id);
          setCurrentUser(user);
        } else {
          window.location.href = "/";
          return;
        }
      }
    }
  }, []);

  // Fetch therapy modules
  const { data: modulesData, isLoading: modulesLoading } = useQuery({
    queryKey: ["therapy-modules"],
    queryFn: async () => {
      const response = await fetch("/api/therapy-modules?active_only=true");
      if (!response.ok) throw new Error("Failed to fetch therapy modules");
      const data = await response.json();
      return data.modules;
    },
    enabled: !!userId,
  });

  // Fetch user's today therapy sessions
  const { data: todaySessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["therapy-sessions-today", userId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/therapy-sessions?user_id=${userId}&date=${today}`,
      );
      if (!response.ok) throw new Error("Failed to fetch therapy sessions");
      const data = await response.json();
      return data.sessions;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const handleBackToHome = () => {
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  const getModuleIcon = (moduleName) => {
    switch (moduleName) {
      case "rhythm_beat":
        return <Music className="w-8 h-8" />;
      case "pitch_melody":
        return <Headphones className="w-8 h-8" />;
      case "singing_listening":
        return <Mic className="w-8 h-8" />;
      case "sound_quiz":
        return <Volume2 className="w-8 h-8" />;
      default:
        return <Brain className="w-8 h-8" />;
    }
  };

  const getModuleColor = (moduleName) => {
    switch (moduleName) {
      case "rhythm_beat":
        return "blue";
      case "pitch_melody":
        return "purple";
      case "singing_listening":
        return "green";
      case "sound_quiz":
        return "orange";
      default:
        return "gray";
    }
  };

  const getCompletedSessionsForModule = (moduleId) => {
    return (
      todaySessionsData?.filter(
        (session) => session.module_id === moduleId && session.completed,
      ).length || 0
    );
  };

  const canStartModule = (module) => {
    // 모든 모듈은 일단 시작 가능하도록 설정
    // 나중에 순차적 잠금 기능 추가 가능
    return true;
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">사용자 ID가 필요합니다.</p>
          <button
            onClick={handleBackToHome}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (modulesLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToHome}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    음악 치료 프로그램
                  </h1>
                  <p className="text-sm text-gray-600">
                    단계별 청각 인지 재활 훈련
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* 프로그램 소개 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              프로그램 소개
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                단계적 난이도 조절
              </h3>
              <p className="text-sm text-blue-700">
                단순한 듣기에서 시작해 점차 복합적인 인지 활동으로 발전
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-medium text-purple-900 mb-2">
                개별 맞춤 훈련
              </h3>
              <p className="text-sm text-purple-700">
                난청과 경도인지장애 특성을 고려한 맞춤형 프로그램
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">실시간 피드백</h3>
              <p className="text-sm text-green-700">
                즉각적인 결과 확인과 진행 상황 모니터링
              </p>
            </div>
          </div>
        </div>

        {/* 오늘의 진행 상황 */}
        {todaySessionsData && todaySessionsData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                오늘의 진행 상황
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {modulesData?.map((module) => {
                const completedCount = getCompletedSessionsForModule(module.id);
                return (
                  <div
                    key={module.id}
                    className="bg-gray-50 rounded-lg p-4 text-center"
                  >
                    <div
                      className={`w-12 h-12 bg-${getModuleColor(module.name)}-100 rounded-lg flex items-center justify-center mx-auto mb-3`}
                    >
                      <div
                        className={`text-${getModuleColor(module.name)}-600`}
                      >
                        {getModuleIcon(module.name)}
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {module.display_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      완료: {completedCount}회
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 치료 모듈 목록 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">치료 모듈</h2>
          </div>

          <div className="space-y-6">
            {modulesData?.map((module, index) => {
              const isUnlocked = canStartModule(module);
              const completedToday = getCompletedSessionsForModule(module.id);
              const color = getModuleColor(module.name);

              return (
                <div
                  key={module.id}
                  className={`border rounded-xl p-6 transition-all ${
                    isUnlocked
                      ? "hover:shadow-md cursor-pointer"
                      : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div
                        className={`w-16 h-16 bg-${color}-100 rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <div className={`text-${color}-600`}>
                          {getModuleIcon(module.name)}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Module {module.module_order}: {module.display_name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {Array.from({
                              length: module.difficulty_level,
                            }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 text-yellow-500 fill-current`}
                              />
                            ))}
                          </div>
                          {!isUnlocked && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>

                        <p className="text-gray-600 mb-4">
                          {module.description}
                        </p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>운동 {module.exercise_count}개</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>난이도 {module.difficulty_level}/5</span>
                          </div>
                          {completedToday > 0 && (
                            <div className="flex items-center space-x-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>오늘 {completedToday}회 완료</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <a
                        href={
                          isUnlocked
                            ? `/therapy/module?user_id=${userId}&module_id=${module.id}`
                            : "#"
                        }
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                          isUnlocked
                            ? `bg-${color}-600 text-white hover:bg-${color}-700`
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                        onClick={(e) => {
                          if (!isUnlocked) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {isUnlocked ? (
                            <Play className="w-4 h-4" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                          <span>{isUnlocked ? "시작하기" : "잠금"}</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 안내사항 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-900 mb-3">
            치료 프로그램 안내사항
          </h3>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• 조용한 환경에서 헤드폰을 착용하고 진행하세요</li>
            <li>• 각 모듈은 순서대로 진행하는 것을 권장합니다</li>
            <li>• 피로감을 느끼면 휴식을 취한 후 계속하세요</li>
            <li>• 결과는 자동으로 저장되며 관리자가 모니터링합니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
