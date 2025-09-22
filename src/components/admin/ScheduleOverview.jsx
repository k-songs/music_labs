import { Calendar, Target, Clock } from "lucide-react";

export default function ScheduleOverview({ schedulesData }) {
  const activeSchedules = schedulesData?.filter((s) => s.is_active).length || 0;

  const averageProgress =
    schedulesData?.length > 0
      ? Math.round(
          schedulesData.reduce(
            (sum, s) => sum + (s.completion_percentage || 0),
            0,
          ) / schedulesData.length,
        )
      : 0;

  const completedSchedules =
    schedulesData?.filter((s) => {
      const endDate = new Date(s.end_date);
      const today = new Date();
      return endDate < today;
    }).length || 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">활성 스케줄</p>
            <p className="text-2xl font-bold text-gray-900">
              {activeSchedules}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">평균 진행률</p>
            <p className="text-2xl font-bold text-gray-900">
              {averageProgress}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">완료된 연구</p>
            <p className="text-2xl font-bold text-gray-900">
              {completedSchedules}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
