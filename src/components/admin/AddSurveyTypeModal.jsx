"use client";

export default function AddSurveyTypeModal({
  show,
  onClose,
  newSurveyType,
  setNewSurveyType,
  onSubmit,
  isLoading,
  isEditing = false,
}) {
  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isEditing ? "설문 유형 수정" : "새 설문 유형 추가"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설문 코드 (영문) *
              </label>
              <input
                type="text"
                value={newSurveyType.name}
                onChange={(e) =>
                  setNewSurveyType((prev) => ({
                    ...prev,
                    name: e.target.value.toUpperCase(),
                  }))
                }
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isEditing ? "bg-gray-100 text-gray-600" : ""
                }`}
                placeholder="예: CUSTOM"
                required
                disabled={isEditing}
              />
              <p className="text-xs text-gray-500 mt-1">
                영문 대문자로 입력해주세요 {isEditing && "(수정 불가)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설문 제목 *
              </label>
              <input
                type="text"
                value={newSurveyType.display_name}
                onChange={(e) =>
                  setNewSurveyType((prev) => ({
                    ...prev,
                    display_name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 맞춤형 청각 설문"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={newSurveyType.description || ""}
                onChange={(e) =>
                  setNewSurveyType((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="설문에 대한 간단한 설명을 입력하세요"
                rows={3}
              />
            </div>

            {isEditing && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newSurveyType.is_active !== false}
                  onChange={(e) =>
                    setNewSurveyType((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  활성화
                </label>
              </div>
            )}

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
                disabled={isLoading}
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
