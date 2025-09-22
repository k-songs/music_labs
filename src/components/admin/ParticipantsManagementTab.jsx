"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import ParticipantsTable from "./ParticipantsTable";
import AddUserModal from "./AddUserModal";
import EditUserModal from "./EditUserModal";
import ParticipantScheduleModal from "./ParticipantScheduleModal";
import { useAdminUsers } from "../../hooks/useAdminUsers";

export default function ParticipantsManagementTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [managingScheduleUser, setManagingScheduleUser] = useState(null);
  const { users, usersLoading, deleteUser, isDeleting } =
    useAdminUsers(searchQuery);

  const handleDeleteUser = async (user) => {
    if (
      !confirm(
        `정말로 ${user.name} (${user.patient_id}) 참가자를 삭제하시겠습니까?\n모든 관련 데이터가 함께 삭제됩니다.`,
      )
    ) {
      return;
    }

    try {
      await deleteUser(user.id);
      alert("참가자가 삭제되었습니다.");
    } catch (error) {
      alert(`삭제 실패: ${error.message}`);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleManageSchedule = (user) => {
    setManagingScheduleUser(user);
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">참가자 관리</h2>
            <p className="text-gray-600">
              참가자 등록, 정보 수정 및 스케줄 관리
            </p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>참가자 추가</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, ID, 진단 내용으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="text-sm text-gray-600">총 {users.length}명</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">참가자 목록</h3>
        </div>
        {usersLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ParticipantsTable
            users={users}
            onDeleteUser={handleDeleteUser}
            onEditUser={handleEditUser}
            onManageSchedule={handleManageSchedule}
            isDeleting={isDeleting}
          />
        )}
      </div>

      {/* 모달들 */}
      {showAddUser && <AddUserModal onClose={() => setShowAddUser(false)} />}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {managingScheduleUser && (
        <ParticipantScheduleModal
          user={managingScheduleUser}
          onClose={() => setManagingScheduleUser(null)}
        />
      )}
    </div>
  );
}
