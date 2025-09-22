"use client";

import { useQuery } from "@tanstack/react-query";
import { Plus, Headphones } from "lucide-react";

export default function PtaManagementTab() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">PTA 관리</h2>
          <p className="text-sm text-gray-600 mt-1">
            참여자들의 순음청력검사(PTA) 결과를 관리합니다
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>PTA 결과 추가</span>
        </button>
      </div>

      <div className="text-center py-8">
        <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">PTA 관리 기능을 구현 중입니다.</p>
      </div>
    </div>
  );
}
