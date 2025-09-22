"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Calendar, TrendingUp, Target, CheckCircle } from "lucide-react";

export default function ProgressChart({ userId, title = "연구 진행률" }) {
  // 진행률 데이터 조회
  const {
    data: progressData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["progress", userId],
    queryFn: async () => {
      if (!userId) return null;

      const response = await fetch(`/api/progress?user_id=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "진행률 조회 실패");
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 30000, // 30초간 캐시
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !progressData) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          {error ? error.message : "진행률 데이터가 없습니다."}
        </div>
      </div>
    );
  }

  const { progress, schedule } = progressData;

  // 주별 진행률 차트 데이터 준비
  const weeklyData =
    progress.weekly_progress?.map((week) => ({
      week: `${week.week}주차`,
      completed: week.sessions_completed,
      expected: week.sessions_expected,
      completion_rate: week.completion_rate,
      surveys: week.surveys_completed,
      isCurrent: week.is_current_week,
      isPast: week.is_current_or_past,
      weekStart: week.week_start,
      weekEnd: week.week_end,
    })) || [];

  // 전체 진행률 파이 차트 데이터
  const overallData = [
    {
      name: "완료",
      value: progress.sessions_completed,
      color: "#10b981",
    },
    {
      name: "남은 세션",
      value: Math.max(
        0,
        progress.sessions_expected - progress.sessions_completed,
      ),
      color: "#e5e7eb",
    },
  ];

  // 주차별 완료율 추세 데이터
  const trendData =
    progress.weekly_progress
      ?.filter((week) => week.is_current_or_past)
      .map((week) => ({
        week: week.week,
        rate: week.completion_rate,
      })) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center space-x-3 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>

      {/* 전체 진행률 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-blue-600 font-medium">전체 진행률</div>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {progress.completion_percentage}%
          </div>
          <div className="text-xs text-blue-600">
            {progress.sessions_completed}/{progress.sessions_expected} 세션
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div className="text-sm text-green-600 font-medium">
              완료된 세션
            </div>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {progress.sessions_completed}
          </div>
          <div className="text-xs text-green-600">
            총 {progress.sessions_expected}개 중
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 font-medium">완료된 설문</div>
          <div className="text-2xl font-bold text-purple-700">
            {progress.surveys_completed}
          </div>
          <div className="text-xs text-purple-600">개</div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <div className="text-sm text-orange-600 font-medium">연구 기간</div>
          </div>
          <div className="text-2xl font-bold text-orange-700">
            {progress.schedule_info.total_weeks}
          </div>
          <div className="text-xs text-orange-600">주</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 주별 진행률 막대 차트 */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">
            주차별 세션 완료 현황
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeklyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value, name, props) => {
                    const data = props.payload;
                    if (name === "completed") {
                      return [
                        <div key="tooltip">
                          <div>완료: {value}세션</div>
                          <div>목표: {data.expected}세션</div>
                          <div>달성률: {data.completion_rate}%</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {data.weekStart} ~ {data.weekEnd}
                          </div>
                        </div>,
                        "세션 현황",
                      ];
                    }
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="expected"
                  fill="#e5e7eb"
                  name="expected"
                  opacity={0.6}
                />
                <Bar
                  dataKey="completed"
                  fill={(entry) =>
                    entry.isCurrent
                      ? "#f59e0b"
                      : entry.isPast
                        ? "#3b82f6"
                        : "#cbd5e1"
                  }
                  name="completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-300 rounded"></div>
              <span>목표</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>완료</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span>현재 주</span>
            </div>
          </div>
        </div>

        {/* 완료율 추세 라인 차트 */}
        <div>
          <h4 className="text-md font-semibold text-gray-800 mb-4">
            주차별 달성률 추세
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value}주차`}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value) => [`${value}%`, "달성률"]}
                  labelFormatter={(label) => `${label}주차`}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  activeDot={{
                    r: 6,
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 현재 주차 하이라이트 */}
      {weeklyData.find((week) => week.isCurrent) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            <h4 className="text-md font-semibold text-amber-900">
              이번 주 진행 상황
            </h4>
          </div>
          {(() => {
            const currentWeek = weeklyData.find((week) => week.isCurrent);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-amber-600 font-medium">주차</div>
                  <div className="text-amber-900">{currentWeek.week}</div>
                </div>
                <div>
                  <div className="text-amber-600 font-medium">완료 세션</div>
                  <div className="text-amber-900">
                    {currentWeek.completed}/{currentWeek.expected}
                  </div>
                </div>
                <div>
                  <div className="text-amber-600 font-medium">달성률</div>
                  <div className="text-amber-900">
                    {currentWeek.completion_rate}%
                  </div>
                </div>
                <div>
                  <div className="text-amber-600 font-medium">설문 완료</div>
                  <div className="text-amber-900">{currentWeek.surveys}개</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 상세 일정 정보 */}
      <div className="pt-6 border-t border-gray-200">
        <h4 className="text-md font-semibold text-gray-800 mb-3">
          연구 일정 정보
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-500">연구 기간</div>
            <div className="font-medium">
              {new Date(progress.schedule_info.start_date).toLocaleDateString(
                "ko-KR",
              )}{" "}
              ~
              {new Date(progress.schedule_info.end_date).toLocaleDateString(
                "ko-KR",
              )}
            </div>
          </div>
          <div>
            <div className="text-gray-500">주당 세션 수</div>
            <div className="font-medium">
              {progress.schedule_info.sessions_per_week}회
            </div>
          </div>
          <div>
            <div className="text-gray-500">세션당 시간</div>
            <div className="font-medium">
              {progress.schedule_info.session_duration}분
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="text-gray-500 text-sm">참여 요일</div>
          <div className="font-medium">
            {progress.schedule_info.days_of_week
              ?.map((day) => {
                const days = ["일", "월", "화", "수", "목", "금", "토"];
                return days[day];
              })
              .join(", ")}
            요일
          </div>
        </div>
      </div>
    </div>
  );
}
