"use client";
import { useQuery } from "@tanstack/react-query";
import { Music, CheckCircle, Clock, Activity } from "lucide-react";

export default function SessionManagementTab() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      return data.sessions || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const todaySessions = sessions.filter((s) => {
    const sessionDate = new Date(s.session_date);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });

  const completedSessions = sessions.filter((s) => s.completed);

  return (
    <div className="space-y-6">
      {/* 세션 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">총 세션</p>
              <p className="text-2xl font-bold text-gray-900">
                {sessions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">완료된 세션</p>
              <p className="text-2xl font-bold text-gray-900">
                {completedSessions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">오늘 세션</p>
              <p className="text-2xl font-bold text-gray-900">
                {todaySessions.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 세션 목록 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            최근 세션 ({sessions.slice(0, 10).length})
          </h3>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">진행된 세션이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.slice(0, 10).map((session) => (
              <div key={session.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Music className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {session.music_type}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.start_time).toLocaleString("ko-KR")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {session.duration_minutes && (
                      <span className="text-sm text-gray-500">
                        {session.duration_minutes}분
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.completed
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {session.completed ? "완료" : "진행중"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
