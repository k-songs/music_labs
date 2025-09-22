"use client";
import { useQuery } from "@tanstack/react-query";

export default function AddQuestionModal({
  show,
  onClose,
  newQuestion,
  setNewQuestion,
  onSubmit,
  isLoading,
}) {
  // 설문 유형 목록 조회
  const { data: surveyTypesData } = useQuery({
    queryKey: ["survey-types"],
    queryFn: async () => {
      const response = await fetch("/api/survey-types");
      if (!response.ok) throw new Error("Failed to fetch survey types");
      const data = await response.json();
      return data.surveyTypes;
    },
    enabled: show, // 모달이 열릴 때만 데이터 조회
  });

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
            새 질문 추가
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> 설문 유형 (필수)
              </label>
              <select
                value={newQuestion.survey_type}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    survey_type: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {surveyTypesData && surveyTypesData.length > 0 ? (
                  surveyTypesData.map((surveyType) => (
                    <option key={surveyType.name} value={surveyType.name}>
                      {surveyType.display_name} ({surveyType.name})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="THI">
                      THI (Tinnitus Handicap Inventory)
                    </option>
                    <option value="HHIA">
                      HHIA (Hearing Handicap Inventory)
                    </option>
                    <option value="SSQ12">
                      SSQ12 (Speech, Spatial and Qualities)
                    </option>
                    <option value="REHAB">재활 효과 평가</option>
                  </>
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                질문이 속할 설문 유형을 선택하세요
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> 질문 번호 (필수)
              </label>
              <input
                type="number"
                min="1"
                value={newQuestion.question_number}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    question_number: parseInt(e.target.value) || 1,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                placeholder="예: 1, 2, 3..."
              />
              <p className="text-xs text-gray-500 mt-1">
                설문 내에서 질문의 순서를 나타냅니다
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="text-red-500">*</span> 질문 내용 (필수)
              </label>
              <textarea
                value={newQuestion.question_text}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    question_text: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="환자에게 제시할 질문을 입력하세요"
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                명확하고 이해하기 쉬운 질문을 작성해주세요
              </p>
            </div>

            {/* 추가 정보 박스 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 mb-3">
                <strong>선택된 설문 유형의 답안 옵션:</strong>
              </p>

              {/* 설문 유형별 답안 옵션 미리보기 */}
              {newQuestion.survey_type === "THI" ||
              newQuestion.survey_type === "HHIA" ? (
                <div className="text-xs text-blue-700 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      1
                    </span>
                    <span>아니오 (0점)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      2
                    </span>
                    <span>가끔 (2점)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      3
                    </span>
                    <span>예 (4점)</span>
                  </div>
                  <p className="text-blue-600 mt-2 font-medium">
                    ✓ {newQuestion.survey_type} 전용 3점 척도 (최대 4점)
                  </p>
                </div>
              ) : newQuestion.survey_type === "SSQ12" ? (
                <div className="text-xs text-blue-700 space-y-1">
                  <div className="grid grid-cols-6 gap-1 mb-2">
                    {Array.from({ length: 11 }, (_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <span className="bg-blue-200 px-1 py-0.5 rounded text-blue-800 text-xs">
                          {i}
                        </span>
                        <span className="text-xs mt-1">
                          {i === 0 ? "못함" : i === 10 ? "완벽" : i}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-blue-600 mt-2 font-medium">
                    ✓ SSQ12 전용 11점 척도 (0-10점)
                  </p>
                </div>
              ) : (
                <div className="text-xs text-blue-700 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      1
                    </span>
                    <span>전혀 그렇지 않다</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      2
                    </span>
                    <span>그렇지 않다</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      3
                    </span>
                    <span>보통이다</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      4
                    </span>
                    <span>그렇다</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-200 px-2 py-1 rounded text-blue-800">
                      5
                    </span>
                    <span>매우 그렇다</span>
                  </div>
                  <p className="text-blue-600 mt-2 font-medium">
                    ✓ 기본 리커트 5점 척도
                  </p>
                </div>
              )}
            </div>

            {/* 답안 옵션 사용자 정의 (선택사항) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-3">
                답안 옵션 사용자 정의 (선택사항)
              </h4>
              <p className="text-xs text-gray-600 mb-3">
                기본 답안 옵션을 사용하거나, 아래에서 질문에 맞는 특별한 답안
                옵션을 설정할 수 있습니다.
              </p>

              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!newQuestion.customOptions}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({
                        ...prev,
                        customOptions: !e.target.checked ? null : [],
                      }))
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    기본 답안 옵션 사용
                  </span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!newQuestion.customOptions}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({
                        ...prev,
                        customOptions: e.target.checked ? [""] : null,
                      }))
                    }
                    className="text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    사용자 정의 답안 옵션
                  </span>
                </label>
              </div>

              {newQuestion.customOptions && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-gray-600">
                    각 답안 옵션을 입력하세요 (참가자가 선택할 수 있는 답안들):
                  </p>
                  {newQuestion.customOptions.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600 w-8">
                        {index + 1}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.customOptions];
                          newOptions[index] = e.target.value;
                          setNewQuestion((prev) => ({
                            ...prev,
                            customOptions: newOptions,
                          }));
                        }}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder={`답안 옵션 ${index + 1}`}
                      />
                      {newQuestion.customOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = newQuestion.customOptions.filter(
                              (_, i) => i !== index,
                            );
                            setNewQuestion((prev) => ({
                              ...prev,
                              customOptions: newOptions,
                            }));
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNewQuestion((prev) => ({
                          ...prev,
                          customOptions: [...prev.customOptions, ""],
                        }))
                      }
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100"
                    >
                      답안 추가
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNewQuestion((prev) => ({
                          ...prev,
                          customOptions: null,
                        }))
                      }
                      className="px-3 py-1 text-xs bg-gray-50 text-gray-600 border border-gray-200 rounded hover:bg-gray-100"
                    >
                      기본 옵션으로 되돌리기
                    </button>
                  </div>
                </div>
              )}
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
                disabled={
                  isLoading ||
                  !newQuestion.survey_type ||
                  !newQuestion.question_text?.trim()
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "추가 중..." : "질문 추가"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
