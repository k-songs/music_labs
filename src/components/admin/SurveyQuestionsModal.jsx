"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  X, 
  Plus, 
  Settings, 
  Edit, 
  Trash2, 
  Save, 
  MoveUp, 
  MoveDown,
  FileText 
} from "lucide-react";

export default function SurveyQuestionsModal({ surveyType, onClose }) {
  const queryClient = useQueryClient();
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    response_options: null,
  });

  // 설문 질문들 조회
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["survey-questions", surveyType.name],
    queryFn: async () => {
      const response = await fetch(`/api/survey-questions?survey_type=${surveyType.name}`);
      if (!response.ok) throw new Error("Failed to fetch questions");
      const data = await response.json();
      return data.questions || [];
    },
    enabled: !!surveyType,
  });

  // 질문 추가
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData) => {
      const response = await fetch("/api/survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          survey_type: surveyType.name,
          question_number: questions.length + 1,
          question_text: questionData.question_text,
          response_options: questionData.response_options,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "질문 추가에 실패했습니다");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-questions", surveyType.name]);
      setShowAddQuestion(false);
      setNewQuestion({ question_text: "", response_options: null });
    },
  });

  // 질문 수정
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, questionData }) => {
      const response = await fetch("/api/survey-questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          question_text: questionData.question_text,
          response_options: questionData.response_options,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "질문 수정에 실패했습니다");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-questions", surveyType.name]);
      setEditingQuestion(null);
    },
  });

  // 질문 삭제
  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId) => {
      const response = await fetch(`/api/survey-questions?id=${questionId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "질문 삭제에 실패했습니다");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-questions", surveyType.name]);
    },
  });

  const handleEditQuestion = (question) => {
    setEditingQuestion({
      ...question,
      question_text: question.question_text,
      response_options: question.response_options,
    });
  };

  const handleSaveEdit = () => {
    if (!editingQuestion.question_text.trim()) {
      alert("질문 내용을 입력해주세요.");
      return;
    }
    
    updateQuestionMutation.mutate({
      id: editingQuestion.id,
      questionData: {
        question_text: editingQuestion.question_text,
        response_options: editingQuestion.response_options,
      },
    });
  };

  const handleDeleteQuestion = (question) => {
    if (confirm(`"${question.question_text}"을(를) 삭제하시겠습니까?`)) {
      deleteQuestionMutation.mutate(question.id);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      alert("질문 내용을 입력해주세요.");
      return;
    }
    
    addQuestionMutation.mutate(newQuestion);
  };

  if (!surveyType) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                설문 질문 관리
              </h2>
              <p className="text-sm text-gray-600">
                {surveyType.display_name} ({surveyType.name})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* 질문 추가 버튼 */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddQuestion(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>새 질문 추가</span>
            </button>
          </div>

          {/* 로딩 */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 질문 목록 */}
              {questions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    등록된 질문이 없습니다
                  </h3>
                  <p className="text-gray-600 mb-4">
                    첫 번째 질문을 추가하여 설문을 구성하세요.
                  </p>
                </div>
              ) : (
                questions
                  .sort((a, b) => a.question_number - b.question_number)
                  .map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      isEditing={editingQuestion?.id === question.id}
                      editingData={editingQuestion}
                      onEdit={handleEditQuestion}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingQuestion(null)}
                      onDelete={handleDeleteQuestion}
                      onChange={setEditingQuestion}
                      isUpdating={updateQuestionMutation.isPending}
                    />
                  ))
              )}
            </div>
          )}

          {/* 새 질문 추가 폼 */}
          {showAddQuestion && (
            <div className="mt-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-medium text-gray-900 mb-3">새 질문 추가</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    질문 내용 *
                  </label>
                  <textarea
                    value={newQuestion.question_text}
                    onChange={(e) =>
                      setNewQuestion((prev) => ({
                        ...prev,
                        question_text: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="질문 내용을 입력하세요"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddQuestion}
                    disabled={addQuestionMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {addQuestionMutation.isPending ? "추가 중..." : "질문 추가"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddQuestion(false);
                      setNewQuestion({ question_text: "", response_options: null });
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              총 {questions.length}개 질문
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 질문 카드 컴포넌트
function QuestionCard({
  question,
  isEditing,
  editingData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onChange,
  isUpdating,
}) {
  if (isEditing) {
    return (
      <div className="border border-blue-300 rounded-lg p-4 bg-blue-50">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              질문 {question.question_number}
            </label>
            <textarea
              value={editingData.question_text}
              onChange={(e) =>
                onChange((prev) => ({
                  ...prev,
                  question_text: e.target.value,
                }))
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onSave}
              disabled={isUpdating}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isUpdating ? "저장 중..." : "저장"}</span>
            </button>
            <button
              onClick={onCancel}
              className="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              질문 {question.question_number}
            </span>
            {!question.is_active && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                비활성
              </span>
            )}
          </div>
          <p className="text-gray-900 leading-relaxed">
            {question.question_text}
          </p>
          
          {question.response_options && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">사용자 정의 응답 옵션 있음</p>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => onEdit(question)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="질문 수정"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(question)}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="질문 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}