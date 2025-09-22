import { Settings, Plus, Users } from "lucide-react";

export default function AdminHeader({ onAddUser, onLogout }) {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                연구자 관리 페이지
              </h1>
              <p className="text-gray-600">
                난청·이명 음악 재활 연구 데이터 관리
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onAddUser}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>새 참여자 추가</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors border border-gray-300 rounded-lg"
            >
              <Users className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
