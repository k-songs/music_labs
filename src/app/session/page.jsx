"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Square,
  Volume2,
  Clock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";

export default function SessionPage() {
  const queryClient = useQueryClient();
  const audioRef = useRef(null);

  // Get user_id from URL parameters or localStorage
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [selectedMusic, setSelectedMusic] = useState("");
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Extract user_id from URL or localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdParam = urlParams.get("user_id");

      if (userIdParam) {
        setUserId(userIdParam);
      } else {
        // Try to get from localStorage
        const savedUser = localStorage.getItem("currentUser");
        const savedUserType = localStorage.getItem("userType");

        if (savedUser && savedUserType === "patient") {
          const user = JSON.parse(savedUser);
          setUserId(user.id);
          setCurrentUser(user);
        } else {
          // Redirect to home if no user found
          window.location.href = "/";
          return;
        }
      }
    }
  }, []);

  const handleBackToHome = () => {
    // Go back to appropriate home page
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  // Fetch user's schedule to get selected music types
  const { data: userScheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ["user-schedule", userId],
    queryFn: async () => {
      const response = await fetch(`/api/research-schedule?user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user schedule");
      const data = await response.json();
      console.log("User schedule data:", data);
      return data.schedule;
    },
    enabled: !!userId,
    staleTime: 0, // 항상 최신 데이터
    cacheTime: 0, // 캐시 사용 안함
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // 30초마다 새로고침
  });

  // Fetch all music types first, then filter by user schedule
  const { data: allMusicTypesData, isLoading: musicTypesLoading } = useQuery({
    queryKey: ["music-types"],
    queryFn: async () => {
      const response = await fetch("/api/music-types");
      if (!response.ok) throw new Error("Failed to fetch music types");
      const data = await response.json();
      console.log("All music types:", data);
      return data.music_types;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Filter music types based on user schedule
  const availableMusicTypes = (() => {
    if (!allMusicTypesData) {
      console.log("No music types data available");
      return [];
    }

    // 활성화된 음원들만 우선 필터링
    const activeMusicTypes = allMusicTypesData.filter((type) => type.is_active);
    console.log("Active music types:", activeMusicTypes);

    // 스케줄에 선택된 음원이 있으면 그것만 사용
    if (
      userScheduleData?.selected_music_types &&
      userScheduleData.selected_music_types.length > 0
    ) {
      console.log(
        "Schedule selected music types:",
        userScheduleData.selected_music_types,
      );
      const filteredTypes = activeMusicTypes.filter((type) =>
        userScheduleData.selected_music_types.includes(type.name),
      );
      console.log("Filtered music types by schedule:", filteredTypes);
      return filteredTypes;
    }

    // 스케줄에 선택된 음원이 없으면 모든 활성 음원 사용
    console.log("Using all active music types");
    return activeMusicTypes;
  })();

  console.log("Final available music types:", availableMusicTypes);

  // Check if user already completed a session today
  const { data: todaySessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["today-sessions", userId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `/api/sessions?user_id=${userId}&date=${today}`,
      );
      if (!response.ok) throw new Error("Failed to fetch today's sessions");
      const data = await response.json();
      return data.sessions;
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Calculate if user can start a new session today
  const canStartSessionToday = () => {
    if (!userScheduleData || !todaySessionsData) return false;

    const today = new Date();
    const todayDayOfWeek = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Check if today is an active day
    const activeDays = userScheduleData.days_of_week || [];
    const isActiveDay = activeDays.includes(todayDayOfWeek);

    if (!isActiveDay) return false;

    // Calculate how many sessions are required today
    const musicFreq = userScheduleData.music_frequency || 1;
    const musicUnit = userScheduleData.music_frequency_unit || "daily";

    let requiredSessionsToday = 0;
    switch (musicUnit) {
      case "daily":
        requiredSessionsToday = musicFreq;
        break;
      case "weekly":
        // Weekly frequency distributed across active days
        requiredSessionsToday = Math.ceil(musicFreq / activeDays.length);
        break;
      case "monthly":
        // Monthly frequency distributed across ~30 days, only on active days
        const activeDaysPerWeek = activeDays.length;
        const activeDaysPerMonth = Math.round(activeDaysPerWeek * 4.33);
        requiredSessionsToday = Math.ceil(musicFreq / activeDaysPerMonth);
        break;
    }

    // Check how many sessions are completed today
    const completedSessionsToday =
      todaySessionsData?.filter((s) => s.completed).length || 0;

    return completedSessionsToday < requiredSessionsToday;
  };

  // 오늘 세션 가능 여부 간단 확인
  const canStartToday = () => {
    if (!userScheduleData) return false;

    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const activeDays = userScheduleData.days_of_week || [];

    if (!activeDays.includes(todayDayOfWeek)) return false;

    // 간단하게 - 오늘 완료된 세션이 0개면 가능
    const completedToday =
      todaySessionsData?.filter((s) => s.completed).length || 0;
    return completedToday === 0;
  };

  // 세션 요구사항 계산
  const getTodayRequirements = () => {
    if (!userScheduleData)
      return { required: 1, completed: 0, isActiveDay: true };

    const today = new Date();
    const todayDayOfWeek = today.getDay();
    const activeDays = userScheduleData.days_of_week || [];
    const isActiveDay = activeDays.includes(todayDayOfWeek);

    if (!isActiveDay) return { required: 0, completed: 0, isActiveDay: false };

    const completedToday =
      todaySessionsData?.filter((s) => s.completed).length || 0;

    // 음악 세션 하루 필요 횟수 계산 (홈페이지와 동일한 로직)
    let requiredSessionsToday = 1;
    if (userScheduleData.music_frequency_unit === "daily") {
      // 매일 frequency * sessions_per_occurrence
      requiredSessionsToday =
        (userScheduleData.music_frequency || 1) *
        (userScheduleData.music_sessions_per_occurrence || 1);
    } else if (userScheduleData.music_frequency_unit === "weekly") {
      // 주간 빈도를 활동일로 나누어 분배
      const activeDaysInWeek = activeDays.length;
      if (activeDaysInWeek > 0) {
        const weeklyTotal =
          (userScheduleData.music_frequency || 1) *
          (userScheduleData.music_sessions_per_occurrence || 1);
        requiredSessionsToday = Math.ceil(weeklyTotal / activeDaysInWeek);
      }
    }

    return {
      required: requiredSessionsToday,
      completed: completedToday,
      isActiveDay: true,
    };
  };

  const todayRequirements = getTodayRequirements();

  // Set default selected music when music types are loaded
  useEffect(() => {
    if (availableMusicTypes.length > 0 && !selectedMusic) {
      setSelectedMusic(availableMusicTypes[0].name);
    }
  }, [availableMusicTypes, selectedMusic]);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: parseInt(userId),
          music_type: selectedMusic,
          session_date: new Date().toISOString().split("T")[0],
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
      setSessionStartTime(Date.now());
      queryClient.invalidateQueries(["sessions"]);
      queryClient.invalidateQueries(["today-sessions", userId]);
    },
    onError: (error) => {
      alert(`세션 시작 실패: ${error.message}`);
    },
  });

  // Complete session mutation
  const completeSessionMutation = useMutation({
    mutationFn: async () => {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000 / 60);
      const response = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration_minutes: duration }),
      });
      if (!response.ok) throw new Error("Failed to complete session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sessions"]);
      queryClient.invalidateQueries(["today-sessions", userId]);
      window.location.href = `/survey?user_id=${userId}&session_id=${sessionId}`;
    },
  });

  // Timer effect
  useEffect(() => {
    let interval;
    if (sessionStarted && sessionStartTime) {
      interval = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted, sessionStartTime]);

  // Auto-complete based on user's schedule duration
  const sessionDurationSeconds =
    (userScheduleData?.session_duration_minutes || 60) * 60;
  useEffect(() => {
    if (currentTime >= sessionDurationSeconds) {
      handleCompleteSession();
    }
  }, [currentTime, sessionDurationSeconds]);

  const handleStartSession = () => {
    startSessionMutation.mutate();
  };

  const handlePlayPause = () => {
    const selectedMusicType = availableMusicTypes?.find(
      (m) => m.name === selectedMusic,
    );
    if (audioRef.current && selectedMusicType?.file_url) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCompleteSession = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    completeSessionMutation.mutate();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = (currentTime / sessionDurationSeconds) * 100;
  const selectedMusicType = availableMusicTypes?.find(
    (m) => m.name === selectedMusic,
  );

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

  if (scheduleLoading || musicTypesLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Check if user has a schedule
  if (!userScheduleData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              스케줄이 설정되지 않았습니다
            </h2>
            <p className="text-gray-600 mb-4">
              관리자에게 연락하여 연구 스케줄을 설정해달라고 요청하세요.
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

  // Check if today is not an active day
  if (!todayRequirements.isActiveDay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              오늘은 쉬는날입니다
            </h2>
            <p className="text-gray-600 mb-4">
              연구 스케줄에 따라 오늘은 활동일이 아닙니다.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              활동 요일:{" "}
              {userScheduleData.days_of_week
                ?.map((day) => {
                  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
                  return dayNames[day];
                })
                .join(", ")}
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

  // Check if user already completed required sessions today
  if (
    !canStartSessionToday() &&
    todayRequirements.completed >= todayRequirements.required
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              오늘 세션을 완료했습니다
            </h2>
            <p className="text-gray-600 mb-4">
              오늘의 목표 ({todayRequirements.required}회)를 모두 달성했습니다.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              내일 다시 참여해주세요!
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

  // Check if no music types are available for this user
  if (!availableMusicTypes || availableMusicTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              사용 가능한 음원이 없습니다
            </h2>
            <div className="text-left mb-4 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>디버깅 정보:</strong>
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1">
                <p>전체 음악 타입: {allMusicTypesData?.length || 0}개</p>
                <p>
                  활성 음악 타입:{" "}
                  {allMusicTypesData?.filter((m) => m.is_active).length || 0}개
                </p>
                <p>
                  스케줄 설정 음악:{" "}
                  {userScheduleData?.selected_music_types?.length || 0}개
                </p>
                <p>
                  선택된 음악들:{" "}
                  {JSON.stringify(userScheduleData?.selected_music_types || [])}
                </p>
                <p>최종 사용 가능: {availableMusicTypes.length}개</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              {!allMusicTypesData || allMusicTypesData.length === 0
                ? "관리자가 음악 파일을 업로드하지 않았습니다."
                : !userScheduleData?.selected_music_types ||
                    userScheduleData.selected_music_types.length === 0
                  ? "관리자가 이 사용자에게 음악을 할당하지 않았습니다."
                  : "할당된 음악 파일이 비활성화되었거나 파일이 없습니다."}
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
      {/* Header */}
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
              <h1 className="text-xl font-bold text-gray-900">
                음악 재활 세션
              </h1>
            </div>

            {/* Today's Progress Indicator */}
            <div className="text-right">
              <p className="text-sm text-gray-600">오늘의 진행</p>
              <p className="text-lg font-semibold text-blue-600">
                {todayRequirements.completed}/{todayRequirements.required}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {!sessionStarted ? (
          // Pre-session setup
          <div className="space-y-6">
            {/* Today's Session Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                오늘의 세션 현황
              </h2>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">완료</p>
                    <p className="text-2xl font-bold text-green-600">
                      {todayRequirements.completed}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">목표</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {todayRequirements.required}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (todayRequirements.completed / todayRequirements.required) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    {Math.round(
                      (todayRequirements.completed /
                        todayRequirements.required) *
                        100,
                    )}
                    % 완료
                  </p>
                </div>
              </div>
            </div>

            {/* Session Setup */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                세션 설정
              </h2>

              {/* Music Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  재생할 음악 선택 (관리자 설정 음원)
                </label>
                <div className="space-y-3">
                  {availableMusicTypes.map((music) => (
                    <label
                      key={music.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="music"
                        value={music.name}
                        checked={selectedMusic === music.name}
                        onChange={(e) => setSelectedMusic(e.target.value)}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {music.name}
                        </p>
                        {music.description && (
                          <p className="text-sm text-gray-600">
                            {music.description}
                          </p>
                        )}
                        {music.file_url ? (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ 음악 파일 업로드됨
                          </p>
                        ) : (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠ 음악 파일이 업로드되지 않음
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Volume Guidelines */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Volume2 className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">음압 안내</h3>
                </div>
                <p className="text-sm text-yellow-700">
                  권장 음압: 65-70dB SPL
                  <br />
                  편안한 대화 수준의 볼륨으로 조절해주세요.
                </p>
              </div>

              {/* Session Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">세션 정보</h3>
                </div>
                <p className="text-sm text-blue-700">
                  세션 시간: {userScheduleData?.session_duration_minutes || 60}
                  분
                  <br />
                  자동으로 완료되며, 완료 후 설문을 진행합니다.
                </p>
              </div>

              <button
                onClick={handleStartSession}
                disabled={
                  startSessionMutation.isPending || !selectedMusicType?.file_url
                }
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {startSessionMutation.isPending
                  ? "세션 시작 중..."
                  : !selectedMusicType?.file_url
                    ? "선택한 음악의 파일이 없습니다"
                    : `세션 시작 (${todayRequirements.completed + 1}/${todayRequirements.required})`}
              </button>
            </div>
          </div>
        ) : (
          // Active session
          <div className="space-y-6">
            {/* Progress */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  진행 상황
                </h2>
                <div className="text-2xl font-mono font-bold text-blue-600">
                  {formatTime(currentTime)}
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>시작</span>
                <span>{Math.round(progressPercentage)}% 완료</span>
                <span>
                  {userScheduleData?.session_duration_minutes || 60}분
                </span>
              </div>
            </div>

            {/* Music Player */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                현재 재생 중
              </h3>

              <div className="text-center mb-6">
                <h4 className="text-xl font-medium text-gray-900 mb-2">
                  {selectedMusic}
                </h4>
                <p className="text-gray-600">65-70dB SPL 권장</p>
                {selectedMusicType?.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedMusicType.description}
                  </p>
                )}
              </div>

              {/* Audio element */}
              {selectedMusicType?.file_url && (
                <audio
                  ref={audioRef}
                  loop
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={() => {
                    console.error("Audio failed to load");
                    setIsPlaying(false);
                  }}
                >
                  <source src={selectedMusicType.file_url} type="audio/mpeg" />
                  <source src={selectedMusicType.file_url} type="audio/mp4" />
                  <source src={selectedMusicType.file_url} type="audio/wav" />
                  브라우저가 오디오를 지원하지 않습니다.
                </audio>
              )}

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  disabled={!selectedMusicType?.file_url}
                  className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </button>
              </div>

              {!selectedMusicType?.file_url && (
                <div className="mt-6 text-center">
                  <p className="text-sm text-red-600 mb-4">
                    ⚠ 선택한 음악의 파일이 업로드되지 않았습니다.
                  </p>
                </div>
              )}
            </div>

            {/* Early completion option */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                세션 관리
              </h3>
              <p className="text-gray-600 mb-4">
                세션은 {userScheduleData?.session_duration_minutes || 60}분 후
                자동으로 완료됩니다. 필요시 조기 완료할 수 있습니다.
              </p>
              <button
                onClick={handleCompleteSession}
                disabled={completeSessionMutation.isPending}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {completeSessionMutation.isPending
                  ? "완료 처리 중..."
                  : "세션 완료하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
