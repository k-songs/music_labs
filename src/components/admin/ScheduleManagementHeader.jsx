import { Calendar, Plus } from "lucide-react";

export function ScheduleManagementHeader({ onAddUser }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>스케줄 관리</span>
          </h1>
          <p className="text-gray-600 mt-1">
            연구 일정과 참여자를 관리합니다
          </p>
        </div>
        <button
          onClick={onAddUser}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>참여자 추가</span>
        </button>
      </div>
    </div>
  );
}
