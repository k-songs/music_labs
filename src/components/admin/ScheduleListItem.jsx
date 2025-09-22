import { Edit, Play, Pause } from "lucide-react";

export function ScheduleListItem({ user, schedule, onEditSchedule }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium text-gray-900">{user.name}</h3>
            <span className="text-sm text-gray-500">
              ID: {user.patient_id}
            </span>
            <span className="text-sm text-gray-500">
              {user.age || user.calculated_age}세 ·{" "}
              {user.gender === "male"
                ? "남성"
                : user.gender === "female"
                ? "여성"
                : "기타"}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>진단: {user.diagnosis}</span>
            {user.phone && <span>연락처: {user.phone}</span>}
            {user.email && <span>이메일: {user.email}</span>}
          </div>

          {schedule && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">기간:</span>
                  <div className="font-medium">
                    {new Date(schedule.start_date).toLocaleDateString()} ~{" "}
                    {new Date(schedule.end_date).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">상태:</span>
                  <div className="flex items-center space-x-1">
                    {schedule.is_active ? (
                      <>
                        <Play className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">활성</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 text-gray-600" />
                        <span className="text-gray-600 font-medium">비활성</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">완료율:</span>
                  <div className="font-medium">
                    {schedule.completion_percentage || 0}%
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">총 기간:</span>
                  <div className="font-medium">{schedule.total_weeks}주</div>
                </div>
              </div>

              {Array.isArray(schedule.days_of_week) &&
                schedule.days_of_week.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-500 text-xs">활성 요일: </span>
                    <span className="text-xs">
                      {schedule.days_of_week
                        .map(
                          (day) =>
                            ["일", "월", "화", "수", "목", "금", "토"][day],
                        )
                        .join(", ")}
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          {schedule ? (
            <button
              onClick={() => onEditSchedule({ ...schedule })}
              className="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
              title="스케줄 수정"
            >
              <Edit className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-sm text-gray-500 px-3 py-1 bg-gray-100 rounded-lg">
              스케줄 없음
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
