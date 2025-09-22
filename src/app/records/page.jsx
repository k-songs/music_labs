"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Music,
  FileText,
  TrendingUp,
  Download,
  BarChart3,
  Activity,
  Clock,
} from "lucide-react";
import SurveyScoreChart from "@/components/charts/SurveyScoreChart";
import ProgressChart from "@/components/charts/ProgressChart";

export default function RecordsPage() {
  const [userId, setUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSurveyType, setSelectedSurveyType] = useState("all");
  const [exportLoading, setExportLoading] = useState(false);

  // Extract user_id from URL or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const userIdFromUrl = urlParams.get("user_id");

      if (userIdFromUrl) {
        setUserId(userIdFromUrl);
      } else {
        // Try to get from localStorage
        const savedUser = localStorage.getItem("currentUser");
        const savedUserType = localStorage.getItem("userType");

        if (savedUser && savedUserType === "patient") {
          const user = JSON.parse(savedUser);
          setUserId(user.id);
        } else {
          // Redirect to home if no user found
          window.location.href = "/";
          return;
        }
      }
    }
  }, []);

  // Fetch user sessions
  const { data: sessionsData } = useQuery({
    queryKey: ["sessions", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/sessions?user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      return data.sessions;
    },
    enabled: !!userId,
  });

  // Fetch survey scores
  const { data: scoresData } = useQuery({
    queryKey: ["scores", userId],
    queryFn: async () => {
      if (!userId) return [];
      const response = await fetch(`/api/surveys?user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch scores");
      const data = await response.json();
      return data.scores;
    },
    enabled: !!userId,
  });

  // Fetch user info
  const { data: userData } = useQuery({
    queryKey: ["user-info", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await fetch(`/api/users?user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      const data = await response.json();
      return data.user;
    },
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">사용자 ID가 필요합니다.</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleBackToHome = () => {
    // Go back to appropriate home page
    const savedUserType = localStorage.getItem("userType");
    if (savedUserType === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Add export functionality
  const handleExportData = async (type) => {
    setExportLoading(true);

    try {
      let params = new URLSearchParams({
        user_id: userId,
        format: "csv",
      });

      if (type === "csv") {
        params.set("type", "sessions");
      } else if (type === "all") {
        params.set("type", "all");
        params.set("format", "json");
      }

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      if (type === "csv") {
        const csvText = await response.text();
        downloadFile(
          csvText,
          `my_sessions_${new Date().toISOString().split("T")[0]}.csv`,
          "text/csv",
        );
      } else if (type === "all") {
        const data = await response.json();

        // Use papaparse for better CSV formatting
        const Papa = await import("papaparse");

        let combinedContent = `=== 내 연구 참여 데이터 ===\n`;
        combinedContent += `참가자: ${userData?.name} (${userData?.patient_id})\n`;
        combinedContent += `내보낸 날짜: ${new Date().toLocaleDateString("ko-KR")}\n\n`;

        if (data.data) {
          Object.keys(data.data).forEach((sheetName) => {
            if (data.data[sheetName] && data.data[sheetName].length > 0) {
              combinedContent += `=== ${sheetName.toUpperCase()} ===\n`;
              combinedContent +=
                Papa.unparse(data.data[sheetName], {
                  header: true,
                  quotes: true,
                }) + "\n\n";
            }
          });
        }

        downloadFile(
          combinedContent,
          `my_research_data_${new Date().toISOString().split("T")[0]}.csv`,
          "text/csv",
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("데이터 내보내기에 실패했습니다: " + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType + ";charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate statistics
  const totalSessions = sessionsData?.length || 0;
  const completedSessions =
    sessionsData?.filter((s) => s.completed).length || 0;
  const totalMinutes =
    sessionsData?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0;
  const averageScore =
    scoresData?.length > 0
      ? scoresData.reduce(
          (sum, s) => sum + Number(s.percentage_score || 0),
          0,
        ) / scoresData.length
      : 0;

  // Group scores by survey type
  const scoresByType =
    scoresData?.reduce((acc, score) => {
      if (!acc[score.survey_type]) {
        acc[score.survey_type] = [];
      }
      acc[score.survey_type].push(score);
      return acc;
    }, {}) || {};

  // Get available survey types
  const surveyTypes = Object.keys(scoresByType);

  // Weekly progress calculation
  const weeklyProgress = sessionsData?.reduce((acc, session) => {
    const weekStart = new Date(session.session_date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!acc[weekKey]) {
      acc[weekKey] = {
        week: weekKey,
        sessions: 0,
        completed: 0,
        totalMinutes: 0,
      };
    }

    acc[weekKey].sessions++;
    if (session.completed) acc[weekKey].completed++;
    acc[weekKey].totalMinutes += session.duration_minutes || 0;

    return acc;
  }, {});

  const weeklyData = Object.values(weeklyProgress || {})
    .sort((a, b) => new Date(a.week) - new Date(b.week))
    .slice(-8); // Last 8 weeks

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleBackToHome}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">내 기록</h1>
              <p className="text-sm text-gray-600">
                {userData?.name} ({userData?.patient_id}) - 세션 기록과 설문
                결과를 확인하세요
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 세션</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalSessions}
                </p>
                <p className="text-xs text-gray-500">
                  완료율:{" "}
                  {totalSessions > 0
                    ? Math.round((completedSessions / totalSessions) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">완료 세션</p>
                <p className="text-2xl font-bold text-gray-900">
                  {completedSessions}
                </p>
                <p className="text-xs text-gray-500">
                  {totalSessions - completedSessions}개 진행중
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 재활 시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(totalMinutes / 60)}
                </p>
                <p className="text-xs text-gray-500">시간</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">평균 설문 점수</p>
                <p className="text-2xl font-bold text-gray-900">
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500">
                  % ({scoresData?.length || 0}개 설문)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4" />
                  <span>개요</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("sessions")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "sessions"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Music className="w-4 h-4" />
                  <span>세션 기록</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("surveys")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "surveys"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>설문 결과</span>
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Progress Chart */}
                <ProgressChart userId={userId} title="나의 연구 진행률" />

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    최근 활동
                  </h3>
                  <div className="space-y-3">
                    {/* Recent Sessions */}
                    {sessionsData?.slice(0, 3).map((session) => (
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
                            {formatDate(session.session_date)} •{" "}
                            {formatTime(session.start_time)}
                          </p>
                        </div>
                        {session.completed && (
                          <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            완료
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Recent Surveys */}
                    {scoresData?.slice(0, 2).map((score) => (
                      <div
                        key={score.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <FileText className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {score.survey_type} 설문 완료
                          </p>
                          <p className="text-xs text-gray-600">
                            점수: {score.total_score}/{score.max_possible_score}{" "}
                            ({Number(score.percentage_score)?.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "sessions" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    음악 재활 세션
                  </h3>
                  <span className="text-sm text-gray-600">
                    총 {totalSessions}개 세션
                  </span>
                </div>

                {sessionsData && sessionsData.length > 0 ? (
                  <div className="space-y-3">
                    {sessionsData.map((session) => (
                      <div
                        key={session.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                session.completed
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {session.music_type}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(session.session_date)} •{" "}
                                {formatTime(session.start_time)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {session.completed ? "완료" : "진행 중"}
                            </p>
                            {session.duration_minutes && (
                              <p className="text-sm text-gray-600">
                                {session.duration_minutes}분
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">아직 세션 기록이 없습니다.</p>
                    <button
                      onClick={() =>
                        (window.location.href = `/session?user_id=${userId}`)
                      }
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      첫 세션 시작하기
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "surveys" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    설문 결과 분석
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">설문 유형:</span>
                    <select
                      value={selectedSurveyType}
                      onChange={(e) => setSelectedSurveyType(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">전체</option>
                      {surveyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {Object.keys(scoresByType).length > 0 ? (
                  <div className="space-y-6">
                    {/* Survey Charts */}
                    {Object.entries(scoresByType)
                      .filter(
                        ([surveyType]) =>
                          selectedSurveyType === "all" ||
                          selectedSurveyType === surveyType,
                      )
                      .map(([surveyType, scores]) => (
                        <SurveyScoreChart
                          key={surveyType}
                          data={scores}
                          title={`${surveyType} 점수 변화`}
                          surveyType={surveyType}
                          chartType="line"
                        />
                      ))}

                    {/* Survey Details Table */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">
                          상세 설문 기록
                        </h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                설문 유형
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                측정일
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                점수
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                백분율
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {scoresData
                              ?.filter(
                                (score) =>
                                  selectedSurveyType === "all" ||
                                  selectedSurveyType === score.survey_type,
                              )
                              .map((score) => (
                                <tr key={score.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {score.survey_type}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600">
                                    {formatDate(score.survey_date)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-900">
                                    {score.total_score}/
                                    {score.max_possible_score}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <span className="font-medium text-blue-600">
                                      {Number(score.percentage_score)?.toFixed(
                                        1,
                                      )}
                                      %
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">아직 설문 결과가 없습니다.</p>
                    <button
                      onClick={() =>
                        (window.location.href = `/survey?user_id=${userId}`)
                      }
                      className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                      설문 작성하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Export Data */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                내 데이터 내보내기
              </h3>
              <p className="text-gray-600">
                나의 활동 기록을 파일로 다운로드할 수 있습니다
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExportData("csv")}
                disabled={exportLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{exportLoading ? "내보내는 중..." : "CSV 내보내기"}</span>
              </button>
              <button
                onClick={() => handleExportData("all")}
                disabled={exportLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>
                  {exportLoading ? "내보내는 중..." : "통합 내보내기"}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">CSV 내보내기</h4>
              <p className="text-sm text-gray-600 mb-3">
                나의 세션 기록을 Excel에서 열 수 있는 CSV 형식으로
                다운로드합니다.
              </p>
              <div className="text-sm text-gray-500">
                포함 내용: 음악 세션 기록, 완료 상태, 진행 시간
              </div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">통합 내보내기</h4>
              <p className="text-sm text-gray-600 mb-3">
                나의 모든 연구 참여 데이터를 하나의 파일에 포함하여
                다운로드합니다.
              </p>
              <div className="text-sm text-gray-500">
                포함 내용: 세션 기록, 설문 응답, 개인 통계, 진행률
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>참고:</strong> 내보낸 데이터는 연구 목적으로만 사용되며,
              개인정보는 안전하게 보호됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
