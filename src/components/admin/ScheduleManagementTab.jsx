"use client";
import { useQuery } from "@tanstack/react-query";
import { Plus, Calendar } from "lucide-react";

export default function ScheduleManagementTab() {
  const { isLoading } = useQuery({
    queryKey: ["admin-schedules"],
    queryFn: async () => {
      const response = await fetch("/api/research-schedule");
      const data = await response.json();
      return data.schedules || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">스케줄 관리</h2>
          <p className="text-sm text-gray-600 mt-1">
            참가자별 연구 스케줄을 설정하고 관리합니다
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>스케줄 추가</span>
        </button>
      </div>

      <div className="text-center py-8">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">스케줄 관리 기능을 구현 중입니다.</p>
      </div>
    </div>
  );
}
