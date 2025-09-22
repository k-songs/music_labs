import { useState } from "react";
import {
  Users,
  BarChart3,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit,
  Calendar,
  Settings,
} from "lucide-react";

export default function ParticipantsTable({
  users,
  onDeleteUser,
  isDeleting,
  onEditUser,
  onManageSchedule,
}) {
  const [sortBy, setSortBy] = useState("patient_id");
  const [sortDirection, setSortDirection] = useState("asc");

  // 정렬된 사용자 목록
  const sortedUsers = [...users].sort((a, b) => {
    let aValue, bValue;

    if (sortBy === "name") {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (sortBy === "created_at") {
      aValue = new Date(a.created_at);
      bValue = new Date(b.created_at);
    } else if (sortBy === "patient_id") {
      aValue = a.patient_id.toLowerCase();
      bValue = b.patient_id.toLowerCase();
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const SortButton = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase hover:text-gray-700 group"
    >
      <span>{children}</span>
      {sortBy === field &&
        (sortDirection === "asc" ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        ))}
      {sortBy !== field && (
        <ChevronDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />
      )}
    </button>
  );

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          등록된 참가자가 없습니다
        </h3>
        <p className="text-gray-600">새 참가자를 추가해 보세요.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <SortButton field="patient_id">환자 ID</SortButton>
            </th>
            <th className="px-6 py-3 text-left">
              <SortButton field="name">이름</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              기본 정보
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              진단/상태
            </th>
            <th className="px-6 py-3 text-left">
              <SortButton field="created_at">등록일</SortButton>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              작업
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-blue-600">
                  {user.patient_id}
                </div>
              </td>
              <td className="px-6 py-4">
                <button
                  onClick={() => onEditUser && onEditUser(user)}
                  className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
                >
                  {user.name}
                </button>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {user.age}세,{" "}
                  {user.gender === "male"
                    ? "남성"
                    : user.gender === "female"
                      ? "여성"
                      : "기타"}
                </div>
                {user.phone && (
                  <div className="text-sm text-gray-500">{user.phone}</div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {user.diagnosis || "미기재"}
                </div>
                {user.pta_result && (
                  <div className="text-sm text-gray-500">
                    PTA: {user.pta_result}dB
                  </div>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString("ko-KR")}
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEditUser && onEditUser(user)}
                    className="text-blue-600 hover:text-blue-800"
                    title="정보 수정"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onManageSchedule && onManageSchedule(user)}
                    className="text-green-600 hover:text-green-800"
                    title="스케줄 관리"
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      (window.location.href = `/records?user_id=${user.id}`)
                    }
                    className="text-purple-600 hover:text-purple-800"
                    title="기록 보기"
                  >
                    <BarChart3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteUser(user)}
                    className="text-red-600 hover:text-red-800"
                    title="삭제"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
