"use client";

import { useState, useCallback, useEffect } from "react";
import useUpload from "../../utils/useUpload";

export default function AddMusicTypeModal({
  show,
  onClose,
  newMusicType,
  setNewMusicType,
  onSubmit,
  isLoading,
  isEditing = false,
}) {
  const [upload, { loading: uploadLoading }] = useUpload();
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 오디오 파일인지 확인
      if (!file.type.startsWith("audio/")) {
        setUploadError("오디오 파일만 업로드할 수 있습니다.");
        return;
      }

      setUploadError(null);

      try {
        const { url, error } = await upload({ file });
        if (error) {
          setUploadError(error);
          return;
        }

        setNewMusicType((prev) => ({ ...prev, file_url: url }));
      } catch (error) {
        setUploadError("파일 업로드에 실패했습니다.");
      }
    },
    [upload, setNewMusicType],
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    // 입력 데이터 검증
    if (!newMusicType.name?.trim()) {
      alert("음악 이름을 입력해주세요.");
      return;
    }

    console.log("Submitting music type:", newMusicType);
    onSubmit(newMusicType);
  };

  // 모달이 열릴 때마다 기본값 설정
  useEffect(() => {
    if (show && !isEditing) {
      setNewMusicType((prev) => ({
        name: prev.name || "",
        description: prev.description || "",
        file_url: prev.file_url || "",
      }));
    }
  }, [show, isEditing, setNewMusicType]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditing ? "음원 수정" : "새 음원 추가"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                음원 이름
              </label>
              <input
                type="text"
                value={newMusicType.name || ""}
                onChange={(e) =>
                  setNewMusicType((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 바로크 음악"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={newMusicType.description || ""}
                onChange={(e) =>
                  setNewMusicType((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="음원에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                음원 파일
              </label>

              {/* 기존 파일이 있을 때 미리보기 */}
              {newMusicType.file_url && !uploadLoading && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">
                    {isEditing ? "현재 음원 파일:" : "업로드된 음원:"}
                  </p>
                  <audio controls className="w-full">
                    <source src={newMusicType.file_url} />
                    브라우저에서 오디오를 지원하지 않습니다.
                  </audio>
                </div>
              )}

              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={uploadLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {uploadLoading && (
                <p className="text-sm text-blue-600 mt-1">파일 업로드 중...</p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600 mt-1">{uploadError}</p>
              )}
              {!isEditing && newMusicType.file_url && !uploadLoading && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ 파일 업로드 완료
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {isEditing
                  ? "새 파일을 선택하면 기존 파일이 교체됩니다."
                  : "MP3, WAV, AAC 등 오디오 파일을 업로드하세요."}
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || uploadLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading
                  ? isEditing
                    ? "수정 중..."
                    : "추가 중..."
                  : isEditing
                    ? "수정"
                    : "추가"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
