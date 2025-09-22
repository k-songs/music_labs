import { Users, Music, FileText, Calendar } from "lucide-react";

export default function StatsCards({ usersCount, sessionsStats, surveysStats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">총 참가자</p>
            <p className="text-2xl font-bold text-gray-900">{usersCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">총 세션</p>
            <p className="text-2xl font-bold text-gray-900">
              {sessionsStats?.total || 0}
            </p>
            <p className="text-xs text-gray-500">
              완료: {sessionsStats?.completed || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">총 설문</p>
            <p className="text-2xl font-bold text-gray-900">
              {surveysStats?.total || 0}
            </p>
            <p className="text-xs text-gray-500">
              유형: {surveysStats?.types || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">오늘 활동</p>
            <p className="text-2xl font-bold text-gray-900">
              {(sessionsStats?.today || 0) + (surveysStats?.today || 0)}
            </p>
            <p className="text-xs text-gray-500">세션+설문</p>
          </div>
        </div>
      </div>
    </div>
  );
}
