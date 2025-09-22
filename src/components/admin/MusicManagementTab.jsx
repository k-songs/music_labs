"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Music,
  Volume2,
  VolumeX,
  Edit,
  Trash2,
  Upload,
  Play,
  Pause,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AddMusicTypeModal from "./AddMusicTypeModal";

export default function MusicManagementTab() {
  const queryClient = useQueryClient();
  const [showAddMusicType, setShowAddMusicType] = useState(false);
  const [editingMusicType, setEditingMusicType] = useState(null);
  const [newMusicType, setNewMusicType] = useState({
    name: "",
    description: "",
    file_url: "",
  });

  // 음악 유형 조회
  const { data: musicTypesData = [], isLoading } = useQuery({
    queryKey: ["music-types"],
    queryFn: async () => {
      const response = await fetch("/api/music-types");
      const data = await response.json();
      console.log("Music types response:", data);
      return data.music_types || [];
    },
  });

  // 활성/비활성 토글 뮤테이션
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await fetch("/api/music-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!response.ok) throw new Error("음악 유형 업데이트에 실패했습니다");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["music-types"]);
    },
  });

  // 음악 유형 추가 뮤테이션
  const addMusicTypeMutation = useMutation({
    mutationFn: async (musicTypeData) => {
      console.log("Adding music type:", musicTypeData);
      const response = await fetch("/api/music-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(musicTypeData),
      });

      const result = await response.json();
      console.log("Add music type response:", result);

      if (!response.ok) {
        throw new Error(result.error || "음악 유형 추가에 실패했습니다");
      }
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ 음악 유형 추가 성공:", data);
      queryClient.invalidateQueries(["music-types"]);
      setShowAddMusicType(false);
      setNewMusicType({ name: "", description: "", file_url: "" });
      alert("✅ 새 음원이 성공적으로 추가되었습니다!");
    },
    onError: (error) => {
      console.error("❌ 음악 유형 추가 실패:", error);
      alert(`❌ 음원 추가 실패: ${error.message}`);
    },
  });

  // 음악 유형 삭제 뮤테이션
  const deleteMusicTypeMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/music-types?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("음악 유형 삭제에 실패했습니다");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["music-types"]);
    },
  });

  // 음악 유형 수정 뮤테이션
  const updateMusicTypeMutation = useMutation({
    mutationFn: async (musicTypeData) => {
      const response = await fetch("/api/music-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(musicTypeData),
      });
      if (!response.ok) throw new Error("음악 유형 수정에 실패했습니다");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["music-types"]);
      setEditingMusicType(null);
    },
  });

  const handleToggleActive = (musicType) => {
    toggleActiveMutation.mutate({
      id: musicType.id,
      is_active: !musicType.is_active,
    });
  };

  const handleDelete = (id) => {
    if (confirm("이 음악 유형을 삭제하시겠습니까?")) {
      deleteMusicTypeMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeMusicTypes = musicTypesData.filter((m) => m.is_active);
  const inactiveMusicTypes = musicTypesData.filter((m) => !m.is_active);

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">음악 관리</h2>
              <p className="text-sm text-gray-600 mt-1">
                참가자가 청취할 음악 유형을 관리합니다
              </p>
            </div>
            <button
              onClick={() => setShowAddMusicType(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>음악 추가</span>
            </button>
          </div>

          {/* 요약 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Music className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">총 음악 유형</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {musicTypesData.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">활성 음악</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeMusicTypes.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <VolumeX className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">비활성 음악</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {inactiveMusicTypes.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 활성 음악 유형 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              활성 음악 유형
            </h3>
            <div className="text-sm text-green-600">
              참가자가 선택할 수 있는 음악들
            </div>
          </div>

          {activeMusicTypes.length === 0 ? (
            <div className="text-center py-8">
              <Volume2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">활성화된 음악 유형이 없습니다.</p>
              <p className="text-sm text-gray-500 mt-1">
                아래 비활성 음악에서 활성화하거나 새 음악을 추가하세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeMusicTypes.map((musicType) => (
                <MusicCard
                  key={musicType.id}
                  musicType={musicType}
                  onToggleActive={handleToggleActive}
                  onEdit={setEditingMusicType}
                  onDelete={handleDelete}
                  isLoading={
                    toggleActiveMutation.isPending ||
                    deleteMusicTypeMutation.isPending
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* 비활성 음악 유형 */}
        {inactiveMusicTypes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                비활성 음악 유형
              </h3>
              <div className="text-sm text-gray-600">
                참가자에게 제공되지 않는 음악들
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inactiveMusicTypes.map((musicType) => (
                <MusicCard
                  key={musicType.id}
                  musicType={musicType}
                  onToggleActive={handleToggleActive}
                  onEdit={setEditingMusicType}
                  onDelete={handleDelete}
                  isLoading={
                    toggleActiveMutation.isPending ||
                    deleteMusicTypeMutation.isPending
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* 전체 음악이 없을 경우 */}
        {musicTypesData.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-center py-12">
              <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                음악 유형이 없습니다
              </h3>
              <p className="text-gray-600 mb-4">
                첫 번째 음악을 추가하여 연구를 시작하세요.
              </p>
              <button
                onClick={() => setShowAddMusicType(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>음악 추가</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 모달들 */}
      <AddMusicTypeModal
        show={showAddMusicType}
        onClose={() => {
          setShowAddMusicType(false);
          setNewMusicType({ name: "", description: "", file_url: "" });
        }}
        newMusicType={newMusicType}
        setNewMusicType={setNewMusicType}
        onSubmit={(data) => addMusicTypeMutation.mutate(data)}
        isLoading={addMusicTypeMutation.isPending}
      />

      {editingMusicType && (
        <AddMusicTypeModal
          show={true}
          onClose={() => setEditingMusicType(null)}
          newMusicType={editingMusicType}
          setNewMusicType={setEditingMusicType}
          onSubmit={(data) =>
            updateMusicTypeMutation.mutate({ id: editingMusicType.id, ...data })
          }
          isLoading={updateMusicTypeMutation.isPending}
          isEditing={true}
        />
      )}
    </>
  );
}

// 음악 카드 컴포넌트
function MusicCard({ musicType, onToggleActive, onEdit, onDelete, isLoading }) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        musicType.is_active
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">{musicType.name}</h4>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                musicType.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {musicType.is_active ? "활성" : "비활성"}
            </span>
          </div>
          {musicType.description && (
            <p className="text-sm text-gray-600 mb-2">
              {musicType.description}
            </p>
          )}
          <div className="flex items-center space-x-2 text-xs">
            {musicType.file_url ? (
              <span className="text-green-600">✓ 파일 업로드됨</span>
            ) : (
              <span className="text-orange-600">⚠ 파일 없음</span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={() => onEdit(musicType)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="수정"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(musicType.id)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 오디오 플레이어 */}
      {musicType.file_url && (
        <div className="mb-3">
          <audio controls className="w-full" style={{ height: "32px" }}>
            <source src={musicType.file_url} />
            브라우저에서 오디오를 지원하지 않습니다.
          </audio>
        </div>
      )}

      {/* 활성화 토글 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">참가자 제공</span>
        <button
          onClick={() => onToggleActive(musicType)}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            musicType.is_active ? "bg-green-600" : "bg-gray-300"
          } ${isLoading ? "opacity-50" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              musicType.is_active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {musicType.is_active
          ? "참가자가 이 음악을 선택할 수 있습니다"
          : "참가자에게 제공되지 않습니다"}
      </p>
    </div>
  );
}
