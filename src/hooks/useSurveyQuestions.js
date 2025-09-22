import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSurveyQuestions() {
  const queryClient = useQueryClient();

  // Question states
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [selectedSurveyType, setSelectedSurveyType] = useState("");
  const [newQuestion, setNewQuestion] = useState({
    survey_type: "",
    question_number: 1,
    question_text: "",
  });

  // Survey type states
  const [showAddSurveyType, setShowAddSurveyType] = useState(false);
  const [editingSurveyType, setEditingSurveyType] = useState(null);
  const [newSurveyType, setNewSurveyType] = useState({
    name: "",
    display_name: "",
    description: "",
    is_active: true,
  });

  // Fetch survey types
  const { data: surveyTypesData } = useQuery({
    queryKey: ["survey-types"],
    queryFn: async () => {
      const response = await fetch("/api/survey-types");
      if (!response.ok) throw new Error("Failed to fetch survey types");
      const data = await response.json();
      return data.surveyTypes;
    },
  });

  // 설문 유형 데이터가 로드되거나 변경되면 첫 번째 설문 유형을 기본으로 선택
  useEffect(() => {
    if (surveyTypesData && surveyTypesData.length > 0) {
      // 현재 선택된 설문 유형이 없거나, 현재 선택된 유형이 목록에 없는 경우
      const currentlySelectedExists = surveyTypesData.some(
        (type) => type.name === selectedSurveyType,
      );

      if (!selectedSurveyType || !currentlySelectedExists) {
        const firstSurveyType = surveyTypesData[0].name;
        setSelectedSurveyType(firstSurveyType);
        setNewQuestion((prev) => ({
          ...prev,
          survey_type: firstSurveyType,
        }));
      }
    } else {
      // 설문 유형이 하나도 없으면 선택을 초기화
      setSelectedSurveyType("");
      setNewQuestion((prev) => ({
        ...prev,
        survey_type: "",
      }));
    }
  }, [surveyTypesData]);

  // Fetch survey questions
  const { data: questionsData } = useQuery({
    queryKey: ["survey-questions", selectedSurveyType],
    queryFn: async () => {
      if (!selectedSurveyType) return [];
      const response = await fetch(
        `/api/survey-questions?survey_type=${selectedSurveyType}`,
      );
      if (!response.ok) throw new Error("Failed to fetch survey questions");
      const data = await response.json();
      return data.questions || [];
    },
    enabled: !!selectedSurveyType,
  });

  // Question mutations
  const addQuestionMutation = useMutation({
    mutationFn: async (questionData) => {
      const response = await fetch("/api/survey-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add question");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-questions", selectedSurveyType]);
      queryClient.invalidateQueries(["question-counts"]);
      setShowAddQuestion(false);
      setNewQuestion({
        survey_type: selectedSurveyType,
        question_number: (questionsData?.length || 0) + 1,
        question_text: "",
      });
    },
    onError: (error) => {
      alert(`질문 추가 실패: ${error.message}`);
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async (questionData) => {
      const response = await fetch("/api/survey-questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update question");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-questions", selectedSurveyType]);
      queryClient.invalidateQueries(["question-counts"]);
      setEditingQuestion(null);
    },
    onError: (error) => {
      alert(`질문 수정 실패: ${error.message}`);
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/survey-questions?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete question");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-questions", selectedSurveyType]);
      queryClient.invalidateQueries(["question-counts"]);
    },
    onError: (error) => {
      alert(`질문 삭제 실패: ${error.message}`);
    },
  });

  // Survey type mutations
  const addSurveyTypeMutation = useMutation({
    mutationFn: async (surveyTypeData) => {
      const response = await fetch("/api/survey-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyTypeData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add survey type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-types"]);
      setShowAddSurveyType(false);
      setNewSurveyType({
        name: "",
        display_name: "",
        description: "",
        is_active: true,
      });
    },
    onError: (error) => {
      alert(`설문 유형 추가 실패: ${error.message}`);
    },
  });

  const updateSurveyTypeMutation = useMutation({
    mutationFn: async (surveyTypeData) => {
      const response = await fetch("/api/survey-types", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyTypeData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update survey type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-types"]);
      setEditingSurveyType(null);
      setShowAddSurveyType(false);
      setNewSurveyType({
        name: "",
        display_name: "",
        description: "",
        is_active: true,
      });
    },
    onError: (error) => {
      alert(`설문 유형 수정 실패: ${error.message}`);
    },
  });

  const deleteSurveyTypeMutation = useMutation({
    mutationFn: async (id) => {
      const response = await fetch(`/api/survey-types?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete survey type");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["survey-types"]);
    },
    onError: (error) => {
      alert(`설문 유형 삭제 실패: ${error.message}`);
    },
  });

  // Question handlers
  const handleAddQuestion = (e) => {
    e.preventDefault();
    addQuestionMutation.mutate({
      ...newQuestion,
      question_number: parseInt(newQuestion.question_number),
    });
  };

  const handleUpdateQuestion = (e) => {
    e.preventDefault();
    updateQuestionMutation.mutate(editingQuestion);
  };

  // Survey type handlers
  const handleAddSurveyType = () => {
    if (!newSurveyType.name?.trim() || !newSurveyType.display_name?.trim()) {
      alert("설문 코드와 설문 제목을 모두 입력해주세요.");
      return;
    }
    addSurveyTypeMutation.mutate(newSurveyType);
  };

  const handleUpdateSurveyType = () => {
    if (!editingSurveyType?.display_name?.trim()) {
      alert("설문 제목을 입력해주세요.");
      return;
    }
    updateSurveyTypeMutation.mutate(editingSurveyType);
  };

  const editSurveyType = (surveyType) => {
    setEditingSurveyType(surveyType);
    setNewSurveyType({
      ...surveyType,
      is_active: surveyType.is_active !== false,
    });
    setShowAddSurveyType(true);
  };

  // 선택된 설문 유형 변경 시 새 질문의 기본값도 업데이트
  const handleSelectedSurveyTypeChange = (surveyTypeName) => {
    setSelectedSurveyType(surveyTypeName);
    setNewQuestion((prev) => ({
      ...prev,
      survey_type: surveyTypeName,
      question_number: 1, // 새로운 설문 유형 선택 시 질문 번호 초기화
    }));
  };

  return {
    // Question data and states
    questionsData,
    selectedSurveyType,
    setSelectedSurveyType: handleSelectedSurveyTypeChange,
    showAddQuestion,
    setShowAddQuestion,
    editingQuestion,
    setEditingQuestion,
    newQuestion,
    setNewQuestion,

    // Survey type data and states
    surveyTypesData,
    showAddSurveyType,
    setShowAddSurveyType,
    editingSurveyType,
    setEditingSurveyType,
    newSurveyType,
    setNewSurveyType,

    // Question actions
    addQuestion: handleAddQuestion,
    updateQuestion: handleUpdateQuestion,
    deleteQuestion: deleteQuestionMutation.mutate,
    isLoadingQuestion:
      addQuestionMutation.isPending || updateQuestionMutation.isPending,

    // Survey type actions
    addSurveyType: handleAddSurveyType,
    updateSurveyType: handleUpdateSurveyType,
    editSurveyType,
    deleteSurveyType: deleteSurveyTypeMutation.mutate,
    isLoadingSurveyType:
      addSurveyTypeMutation.isPending || updateSurveyTypeMutation.isPending,
  };
}
