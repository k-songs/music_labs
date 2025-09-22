import { Users, Plus } from "lucide-react";
import { ScheduleListItem } from "./ScheduleListItem";

export function SchedulesList({
  users,
  getScheduleForUser,
  onEditSchedule,
  onAddUser,
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          참여자 및 스케줄 현황
        </h2>
      </div>

      {users && users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => {
            const schedule = getScheduleForUser(user.id);
            return (
              <ScheduleListItem
                key={user.id}
                user={user}
                schedule={schedule}
                onEditSchedule={onEditSchedule}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">참여자가 없습니다</p>
          <p className="text-sm mb-4">첫 번째 참여자를 추가해보세요</p>
          <button
            onClick={onAddUser}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>첫 참여자 추가</span>
          </button>
        </div>
      )}
    </div>
  );
}
