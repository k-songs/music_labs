"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  FileText,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Eye,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AddSurveyTypeModal from "./AddSurveyTypeModal";
import SurveyQuestionsModal from "./SurveyQuestionsModal";

export default function SurveyManagementTab() {
  const queryClient = useQueryClient();
  const [showAddSurvey, setShowAddSurvey] = useState(false);
  const [selectedSurveyForQuestions, setSelectedSurveyForQuestions] =
    useState(null);
  const [newSurveyType, setNewSurveyType] = useState({
    name: "",
    display_name: "",
    description: "",
  });

  // 설문 유형 조회
  const { data: surveyTypes = [], isLoading } = useQuery({
    queryKey: ["survey-types"],
    queryFn: async () => {
      const response = await fetch("/api/survey-types");
      const data = await response.json();
      return data.surveyTypes || [];
    },
  });

  // 설문 유형 추가 뮤테이션
  const addSurveyTypeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await fetch("/api/survey-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "설문 유형 추가에 실패했습니다");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-types"]);
      setShowAddSurvey(false);
      setNewSurveyType({
        name: "",
        display_name: "",
        description: "",
      });
    },
  });

  // 활성/비활성 토글 뮤테이션
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await fetch("/api/survey-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!response.ok) throw new Error("설문 유형 업데이트에 실패했습니다");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-types"]);
    },
  });

  const handleToggleActive = (surveyType) => {
    toggleActiveMutation.mutate({
      id: surveyType.id,
      is_active: !surveyType.is_active,
    });
  };

  const handleAddSurveyType = () => {
    if (!newSurveyType.name.trim() || !newSurveyType.display_name.trim()) {
      alert("설문 코드와 제목은 필수입니다.");
      return;
    }

    addSurveyTypeMutation.mutate({
      name: newSurveyType.name.trim().toUpperCase(),
      display_name: newSurveyType.display_name.trim(),
      description: newSurveyType.description.trim() || null,
      is_active: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeSurveys = surveyTypes.filter((s) => s.is_active);
  const inactiveSurveys = surveyTypes.filter((s) => !s.is_active);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">설문 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              참가자가 응답할 설문 유형을 관리합니다
            </p>
          </div>
          <button
            onClick={() => setShowAddSurvey(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>설문 유형 추가</span>
          </button>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">총 설문 유형</p>
                <p className="text-2xl font-bold text-gray-900">
                  {surveyTypes.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">활성 설문</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeSurveys.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">비활성 설문</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inactiveSurveys.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 활성 설문 유형 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            활성 설문 유형
          </h3>
          <div className="text-sm text-green-600">
            참가자가 선택할 수 있는 설문들
          </div>
        </div>

        {activeSurveys.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">활성화된 설문 유형이 없습니다.</p>
            <p className="text-sm text-gray-500 mt-1">
              아래 비활성 설문에서 활성화하거나 새 설문을 추가하세요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onToggleActive={handleToggleActive}
                onManageQuestions={setSelectedSurveyForQuestions}
                isLoading={toggleActiveMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* 비활성 설문 유형 */}
      {inactiveSurveys.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              비활성 설문 유형
            </h3>
            <div className="text-sm text-gray-600">
              참가자에게 제공되지 않는 설문들
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inactiveSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                onToggleActive={handleToggleActive}
                onManageQuestions={setSelectedSurveyForQuestions}
                isLoading={toggleActiveMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* 전체 설문이 없을 경우 */}
      {surveyTypes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              설문 유형이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              첫 번째 설문 유형을 추가하여 연구를 시작하세요.
            </p>
            <button
              onClick={() => setShowAddSurvey(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>설문 유형 추가</span>
            </button>
          </div>
        </div>
      )}

      {/* 설문 유형 추가 모달 */}
      <AddSurveyTypeModal
        show={showAddSurvey}
        onClose={() => setShowAddSurvey(false)}
        newSurveyType={newSurveyType}
        setNewSurveyType={setNewSurveyType}
        onSubmit={handleAddSurveyType}
        isLoading={addSurveyTypeMutation.isPending}
      />

      {/* 설문 질문 관리 모달 */}
      {selectedSurveyForQuestions && (
        <SurveyQuestionsModal
          surveyType={selectedSurveyForQuestions}
          onClose={() => setSelectedSurveyForQuestions(null)}
        />
      )}
    </div>
  );
}

// 설문 카드 컴포넌트
function SurveyCard({ survey, onToggleActive, onManageQuestions, isLoading }) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        survey.is_active
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-gray-900">
              {survey.display_name || survey.name}
            </h4>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                survey.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {survey.is_active ? "활성" : "비활성"}
            </span>
          </div>
          {survey.description && (
            <p className="text-sm text-gray-600 mb-2">{survey.description}</p>
          )}
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>유형: {survey.name}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button
            onClick={() => onManageQuestions(survey)}
            title="질문 관리"
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            title="미리보기"
            className="text-gray-400 hover:text-purple-600 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 활성화 토글 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">참가자 제공</span>
        <button
          onClick={() => onToggleActive(survey)}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            survey.is_active ? "bg-green-600" : "bg-gray-300"
          } ${isLoading ? "opacity-50" : ""}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              survey.is_active ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        {survey.is_active
          ? "참가자가 이 설문을 응답할 수 있습니다"
          : "참가자에게 제공되지 않습니다"}
      </p>
    </div>
  );
}

// 설문 유형별 기본 설명
const getSurveyDescription = (surveyType) => {
  const descriptions = {
    THI: "이명 장애 지수 - 이명이 일상생활에 미치는 영향을 평가합니다",
    HHIA: "청각 장애 지수 - 청력 손실이 사회적, 감정적 측면에 미치는 영향을 평가합니다",
    SSQ12: "공간청취능력 설문 - 소음 환경에서의 청취 능력을 평가합니다",
    REHAB: "재활 평가 설문 - 음악 치료의 효과를 종합적으로 평가합니다",
  };
  return descriptions[surveyType] || "사용자 정의 설문";
};
