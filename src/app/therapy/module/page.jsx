"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  Target,
  Star,
  Headphones,
  Volume2,
  Music,
  Gamepad2,
} from "lucide-react";

// Import exercise components
import RhythmExercise from "@/components/therapy/RhythmExercise";
import PitchExercise from "@/components/therapy/PitchExercise";
import SoundQuizExercise from "@/components/therapy/SoundQuizExercise";

export default function TherapyModulePage() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseResults, setExerciseResults] = useState([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Get parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get("user_id");
      const moduleIdParam = urlParams.get("module_id");

      if (userIdParam && moduleIdParam) {
        setUserId(parseInt(userIdParam));
        setModuleId(parseInt(moduleIdParam));
      } else {
        // Try to get from localStorage
        const savedUser = localStorage.getItem("currentUser");
        const savedUserType = localStorage.getItem("userType");

        if (savedUser && savedUserType === "patient") {
          const user = JSON.parse(savedUser);
          setUserId(user.id);
          setCurrentUser(user);
        }

        if (!userIdParam || !moduleIdParam) {
          window.location.href = "/therapy";
          return;
        }
      }
    }
  }, []);

  const handleBackToTherapy = () => {
    window.location.href = `/therapy?user_id=${userId}`;
  };

  // Fetch module information
  const { data: moduleData, isLoading: moduleLoading } = useQuery({
    queryKey: ["therapy-module", moduleId],
    queryFn: async () => {
      const response = await fetch(`/api/therapy-modules`);
      if (!response.ok) throw new Error("Failed to fetch module");
      const data = await response.json();
      return data.modules.find((m) => m.id === moduleId);
    },
    enabled: !!moduleId,
  });

  // Fetch exercises for this module
  const { data: exercisesData, isLoading: exercisesLoading } = useQuery({
    queryKey: ["therapy-exercises", moduleId],
    queryFn: async () => {
      const response = await fetch(
        `/api/therapy-exercises?module_id=${moduleId}&active_only=true`,
      );
      if (!response.ok) throw new Error("Failed to fetch exercises");
      const data = await response.json();
      return data.exercises.sort((a, b) => a.exercise_order - b.exercise_order);
    },
    enabled: !!moduleId,
  });

  // Start therapy session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/therapy-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          module_id: moduleId,
          total_exercises: exercisesData?.length || 0,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to start session");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setSessionStarted(true);
      setCurrentExerciseIndex(0);
      setExerciseResults([]);
    },
    onError: (error) => {
      alert(`세션 시작 실패: ${error.message}`);
    },
  });

  // Complete therapy session
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      const totalScore =
        exerciseResults.reduce((sum, result) => sum + result.score, 0) /
        exerciseResults.length;

      const response = await fetch(
        `/api/therapy-sessions/${sessionId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            completed_exercises: exerciseResults.length,
            overall_score: totalScore,
            session_notes: `Module: ${moduleData?.display_name}, Exercises completed: ${exerciseResults.length}`,
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to complete session");
      return response.json();
    },
    onSuccess: () => {
      setSessionCompleted(true);
      queryClient.invalidateQueries(["therapy-sessions"]);
    },
  });

  // Save exercise result
  const saveResultMutation = useMutation({
    mutationFn: async (resultData) => {
      const response = await fetch("/api/therapy-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          exercise_id: resultData.exerciseId,
          user_id: userId,
          score: resultData.score,
          accuracy_percentage: resultData.accuracy,
          reaction_time_ms: resultData.reactionTime,
          attempts_count: resultData.attempts,
          result_data: resultData.detailData,
        }),
      });
      if (!response.ok) throw new Error("Failed to save result");
      return response.json();
    },
  });

  const handleStartSession = () => {
    startSessionMutation.mutate();
  };

  const handleExerciseComplete = async (result) => {
    // Save individual exercise result
    await saveResultMutation.mutateAsync({
      exerciseId: exercisesData[currentExerciseIndex].id,
      score: result.score,
      accuracy: result.accuracy,
      reactionTime: result.reactionTime || null,
      attempts: result.attempts || 1,
      detailData: result.detailData || {},
    });

    // Add to session results
    const newResults = [...exerciseResults, result];
    setExerciseResults(newResults);

    // Move to next exercise or complete session
    if (currentExerciseIndex < exercisesData.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      // All exercises completed
      completeSessionMutation.mutate();
    }
  };

  const renderExerciseComponent = () => {
    if (!exercisesData || !sessionStarted) return null;

    const currentExercise = exercisesData[currentExerciseIndex];
    if (!currentExercise) return null;

    // Route to appropriate exercise component based on exercise type
    switch (currentExercise.exercise_type) {
      case "rhythm_clap":
      case "rhythm_pattern":
      case "tempo_sync":
        return (
          <RhythmExercise
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        );

      case "pitch_identify":
      case "melody_mimic":
      case "interval_recognition":
        return (
          <PitchExercise
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        );

      case "sound_quiz":
        return (
          <SoundQuizExercise
            exercise={currentExercise}
            onComplete={handleExerciseComplete}
          />
        );

      case "sing_along":
      case "music_analysis":
      case "karaoke":
        // 가창&음악감상 운동 (현재는 기본 컴포넌트로 대체)
        return (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Music className="w-12 h-12 text-green-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentExercise.display_name}
            </h3>
            <p className="text-gray-600 mb-6">{currentExercise.description}</p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 max-w-md mx-auto">
              <h4 className="font-semibold text-green-900 mb-3">
                음악 감상 및 가창 훈련
              </h4>
              <div className="space-y-3 text-sm text-green-800">
                <p>• 제공된 음악을 주의 깊게 들어보세요</p>
                <p>• 음악의 리듬과 멜로디를 느껴보세요</p>
                <p>• 가능하다면 따라 불러보세요</p>
                <p>• 음악의 특징을 기억해두세요</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>운동 타입:</strong> {currentExercise.exercise_type}
              </p>
              <p className="text-sm text-gray-600">
                <strong>난이도:</strong> {currentExercise.difficulty_level}/5
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  // Mock completion for singing/listening exercises
                  const mockResult = {
                    score: Math.floor(Math.random() * 30) + 70, // 70-100 range
                    accuracy: Math.floor(Math.random() * 25) + 75, // 75-100 range
                    reactionTime: null,
                    attempts: 1,
                    detailData: {
                      exerciseType: currentExercise.exercise_type,
                      completed: true,
                      participationScore: true,
                    },
                  };
                  handleExerciseComplete(mockResult);
                }}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>음악 감상 완료</span>
                </div>
              </button>
            </div>
          </div>
        );

      default:
        // Fallback for unknown exercise types
        return (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="w-12 h-12 text-gray-600" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentExercise.display_name}
            </h3>
            <p className="text-gray-600 mb-6">{currentExercise.description}</p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <p className="text-sm text-yellow-800">
                <strong>개발 중:</strong> 이 운동은 현재 개발 중입니다. 곧
                완전한 기능으로 제공될 예정입니다.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>운동 타입:</strong> {currentExercise.exercise_type}
              </p>
              <p className="text-sm text-gray-600">
                <strong>난이도:</strong> {currentExercise.difficulty_level}/5
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  // Simulate completion with random score for testing
                  const mockResult = {
                    score: Math.floor(Math.random() * 40) + 60, // 60-100 range
                    accuracy: Math.floor(Math.random() * 30) + 70, // 70-100 range
                    reactionTime: Math.floor(Math.random() * 1000) + 500, // 500-1500ms
                    attempts: 1,
                    detailData: {
                      exerciseType: currentExercise.exercise_type,
                      completed: true,
                      simulatedResult: true,
                    },
                  };
                  handleExerciseComplete(mockResult);
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>운동 완료 (시뮬레이션)</span>
                </div>
              </button>
            </div>
          </div>
        );
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
      default:
        return "gray";
    }
  };

  if (!userId || !moduleId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">잘못된 접근입니다.</p>
          <button
            onClick={() => (window.location.href = "/therapy")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            치료 프로그램으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (moduleLoading || exercisesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">모듈을 찾을 수 없습니다.</p>
          <button
            onClick={handleBackToTherapy}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            치료 프로그램으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!exercisesData || exercisesData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Target className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              운동이 설정되지 않았습니다
            </h2>
            <p className="text-gray-600 mb-4">
              이 모듈에는 아직 운동이 추가되지 않았습니다.
            </p>
            <button
              onClick={handleBackToTherapy}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              치료 프로그램으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const color = getModuleColor(moduleData.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBackToTherapy}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Module {moduleData.module_order}: {moduleData.display_name}
                </h1>
                <p className="text-sm text-gray-600">
                  {sessionStarted
                    ? `운동 ${currentExerciseIndex + 1}/${exercisesData.length}`
                    : `총 ${exercisesData.length}개 운동`}
                </p>
              </div>
            </div>

            {sessionStarted && !sessionCompleted && (
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-1">
                  {Array.from({ length: moduleData.difficulty_level }).map(
                    (_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-500 fill-current"
                      />
                    ),
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  진행률:{" "}
                  {Math.round(
                    (currentExerciseIndex / exercisesData.length) * 100,
                  )}
                  %
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* Session completed */}
        {sessionCompleted && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              세션 완료!
            </h2>
            <p className="text-gray-600 mb-6">
              {moduleData.display_name} 모듈을 성공적으로 완료했습니다.
            </p>

            {/* Results Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">결과 요약</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">완료한 운동</p>
                  <p className="text-lg font-bold text-blue-600">
                    {exerciseResults.length}개
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">평균 점수</p>
                  <p className="text-lg font-bold text-green-600">
                    {exerciseResults.length > 0
                      ? Math.round(
                          exerciseResults.reduce((sum, r) => sum + r.score, 0) /
                            exerciseResults.length,
                        )
                      : 0}
                    점
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">평균 정확도</p>
                  <p className="text-lg font-bold text-purple-600">
                    {exerciseResults.length > 0
                      ? Math.round(
                          exerciseResults.reduce(
                            (sum, r) => sum + (r.accuracy || 0),
                            0,
                          ) / exerciseResults.length,
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleBackToTherapy}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                치료 프로그램으로 돌아가기
              </button>
              <button
                onClick={() =>
                  (window.location.href = `/records?user_id=${userId}`)
                }
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                결과 상세 보기
              </button>
            </div>
          </div>
        )}

        {/* Pre-session info */}
        {!sessionStarted && !sessionCompleted && (
          <div className="space-y-6">
            {/* Module Introduction */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                모듈 소개
              </h2>
              <p className="text-gray-600 mb-4">{moduleData.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`bg-${color}-50 rounded-lg p-4`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className={`w-5 h-5 text-${color}-600`} />
                    <span className={`font-medium text-${color}-900`}>
                      운동 수
                    </span>
                  </div>
                  <p className={`text-sm text-${color}-700`}>
                    총 {exercisesData.length}개 운동
                  </p>
                </div>
                <div className={`bg-${color}-50 rounded-lg p-4`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className={`w-5 h-5 text-${color}-600`} />
                    <span className={`font-medium text-${color}-900`}>
                      난이도
                    </span>
                  </div>
                  <p className={`text-sm text-${color}-700`}>
                    Level {moduleData.difficulty_level}/5
                  </p>
                </div>
                <div className={`bg-${color}-50 rounded-lg p-4`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className={`w-5 h-5 text-${color}-600`} />
                    <span className={`font-medium text-${color}-900`}>
                      예상 시간
                    </span>
                  </div>
                  <p className={`text-sm text-${color}-700`}>
                    약 {exercisesData.length * 2 - 3}분
                  </p>
                </div>
              </div>

              {/* Exercise List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">운동 목록</h3>
                <div className="space-y-3">
                  {exercisesData.map((exercise, index) => (
                    <div
                      key={exercise.id}
                      className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center text-sm font-bold text-${color}-600`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {exercise.display_name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {exercise.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: exercise.difficulty_level }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 text-yellow-500 fill-current"
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Headphones className="w-6 h-6 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">시작하기 전에</h3>
              </div>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4" />
                  <span>헤드폰을 착용하고 조용한 환경을 확보하세요</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>집중할 수 있는 상태에서 시작하세요</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>중간에 중단하지 말고 끝까지 완료하세요</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>각 운동의 지시사항을 주의 깊게 읽으세요</span>
                </li>
              </ul>
            </div>

            {/* Start Button */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <button
                onClick={handleStartSession}
                disabled={startSessionMutation.isPending}
                className={`px-8 py-4 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 transition-colors font-medium text-lg disabled:opacity-50`}
              >
                {startSessionMutation.isPending ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>세션 시작 중...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>세션 시작하기</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Active Exercise */}
        {sessionStarted && !sessionCompleted && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {exercisesData[currentExerciseIndex]?.display_name}
                </h2>
                <div className="text-sm text-gray-600">
                  {currentExerciseIndex + 1} / {exercisesData.length}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
                  style={{
                    width: `${((currentExerciseIndex + 1) / exercisesData.length) * 100}%`,
                  }}
                ></div>
              </div>

              <p className="text-sm text-gray-600">
                {exercisesData[currentExerciseIndex]?.description}
              </p>
            </div>

            {/* Exercise Component */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {renderExerciseComponent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
