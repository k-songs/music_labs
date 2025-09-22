"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Music, FileText, Calendar, Eye, TrendingUp, Users, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ActivityMonitoringTab() {
  const [selectedPeriod, setSelectedPeriod] = useState("7"); // days
  const [selectedParticipant, setSelectedParticipant] = useState("");

  // 참가자 목록
  const { data: participants } = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      return data.users || [];
    },
  });

  // 세션 데이터
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["monitoring-sessions", selectedPeriod, selectedParticipant],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedParticipant) params.set("user_id", selectedParticipant);
      params.set("days", selectedPeriod);
      
      const response = await fetch(`/api/sessions?${params}`);
      const data = await response.json();
      return data.sessions || [];
    },
  });

  // 설문 데이터
  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ["monitoring-surveys", selectedPeriod, selectedParticipant],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedParticipant) params.set("user_id", selectedParticipant);
      params.set("days", selectedPeriod);
      
      const response = await fetch(`/api/surveys?${params}`);
      const data = await response.json();
      return data.scores || [];
    },
  });

  const getParticipantName = (userId) => {
    const participant = participants?.find(p => p.id === userId);
    return participant ? `${participant.name} (${participant.patient_id})` : "알 수 없음";
  };

  // 통계 계산
  const stats = {
    totalSessions: sessions?.length || 0,
    completedSessions: sessions?.filter(s => s.completed).length || 0,
    totalSurveys: surveys?.length || 0,
    activeParticipants: new Set([
      ...(sessions?.map(s => s.user_id) || []),
      ...(surveys?.map(s => s.user_id) || [])
    ]).size,
  };

  const isLoading = sessionsLoading || surveysLoading;

  return (
    <div className="space-y-6">
      {/* 헤더 및 필터 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">활동 모니터링</h2>
            <p className="text-sm text-gray-600 mt-1">
              참가자들의 음악 세션 및 설문 수행 상황을 확인합니다
            </p>
          </div>
        </div>

        {/* 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              조회 기간
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">최근 1일</option>
              <option value="7">최근 7일</option>
              <option value="30">최근 30일</option>
              <option value="90">최근 90일</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              참가자 필터
            </label>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 참가자</option>
              {participants?.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name} ({participant.patient_id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Music className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">총 세션</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              <p className="text-xs text-green-600">완료: {stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">총 설문</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">활성 참가자</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeParticipants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">완료율</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalSessions > 0 
                  ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                  : 0
                }%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 세션 활동 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">최근 음악 세션</h3>
              <Music className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {getParticipantName(session.user_id)}
                        </p>
                        {session.completed ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {session.music_type} • {new Date(session.session_date).toLocaleDateString()}
                      </p>
                      {session.duration_minutes && (
                        <p className="text-xs text-gray-500">
                          {session.duration_minutes}분 진행
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-xs px-2 py-1 rounded-full ${
                        session.completed 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {session.completed ? "완료" : "진행중"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                선택한 기간 내 세션이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* 설문 활동 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">최근 설문 응답</h3>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : surveys && surveys.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {surveys.slice(0, 10).map((survey) => (
                  <div key={survey.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {getParticipantName(survey.user_id)}
                        </p>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {survey.survey_type} • {new Date(survey.survey_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        점수: {survey.total_score}/{survey.max_possible_score} 
                        {survey.percentage_score && ` (${survey.percentage_score}%)`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        완료
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                선택한 기간 내 설문이 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 참가자별 활동 요약 */}
      {!selectedParticipant && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">참가자별 활동 요약</h3>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ParticipantActivitySummary 
                participants={participants || []}
                sessions={sessions || []}
                surveys={surveys || []}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 참가자별 활동 요약 테이블
function ParticipantActivitySummary({ participants, sessions, surveys }) {
  const getActivitySummary = (participantId) => {
    const participantSessions = sessions.filter(s => s.user_id === participantId);
    const participantSurveys = surveys.filter(s => s.user_id === participantId);
    
    return {
      totalSessions: participantSessions.length,
      completedSessions: participantSessions.filter(s => s.completed).length,
      totalSurveys: participantSurveys.length,
      lastActivity: Math.max(
        ...participantSessions.map(s => new Date(s.session_date).getTime()),
        ...participantSurveys.map(s => new Date(s.survey_date).getTime()),
        0
      ),
    };
  };

  if (participants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        등록된 참가자가 없습니다
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            참가자
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            세션 활동
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            설문 응답
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            마지막 활동
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            완료율
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {participants.map((participant) => {
          const activity = getActivitySummary(participant.id);
          const completionRate = activity.totalSessions > 0 
            ? Math.round((activity.completedSessions / activity.totalSessions) * 100) 
            : 0;
          
          return (
            <tr key={participant.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <p className="text-sm font-medium text-gray-900">{participant.name}</p>
                  <p className="text-xs text-gray-500">{participant.patient_id}</p>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm">
                  <span className="text-gray-900">{activity.completedSessions}</span>
                  <span className="text-gray-500">/{activity.totalSessions}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{activity.totalSurveys}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-600">
                  {activity.lastActivity > 0 
                    ? new Date(activity.lastActivity).toLocaleDateString()
                    : "없음"
                  }
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  completionRate >= 80 
                    ? "bg-green-100 text-green-800"
                    : completionRate >= 60
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {completionRate}%
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}