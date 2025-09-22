"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Brain,
  Music,
  Headphones,
  Volume2,
  Target,
  Star,
  CheckCircle,
  XCircle,
  Settings,
  Play,
} from "lucide-react";

export default function TherapyManagementTab() {
  const queryClient = useQueryClient();
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  // 치료 모듈 조회
  const { data: modulesData = [], isLoading: modulesLoading } = useQuery({
    queryKey: ["therapy-modules"],
    queryFn: async () => {
      const response = await fetch("/api/therapy-modules");
      const data = await response.json();
      return data.modules || [];
    },
  });

  // 운동 조회
  const { data: exercisesData = [], isLoading: exercisesLoading } = useQuery({
    queryKey: ["therapy-exercises", selectedModule?.id],
    queryFn: async () => {
      if (!selectedModule?.id) return [];
      const response = await fetch(`/api/therapy-exercises?module_id=${selectedModule.id}`);
      const data = await response.json();
      return data.exercises || [];
    },
    enabled: !!selectedModule?.id,
  });

  // 모듈 토글 뮤테이션
  const toggleModuleMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await fetch("/api/therapy-modules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!response.ok) throw new Error("모듈 업데이트에 실패했습니다");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["therapy-modules"]);
    },
  });

  // 운동 토글 뮤테이션
  const toggleExerciseMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const response = await fetch("/api/therapy-exercises", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!response.ok) throw new Error("운동 업데이트에 실패했습니다");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["therapy-exercises", selectedModule?.id]);
    },
  });

  const getModuleIcon = (moduleName) => {
    switch (moduleName) {
      case "rhythm_beat":
        return <Music className="w-6 h-6" />;
      case "pitch_melody":
        return <Headphones className="w-6 h-6" />;
      case "singing_listening":
        return <Volume2 className="w-6 h-6" />;
      case "sound_quiz":
        return <Brain className="w-6 h-6" />;
      default:
        return <Target className="w-6 h-6" />;
    }
  };

  const getModuleColor = (moduleName) => {
    switch (moduleName) {
      case "rhythm_beat":
        return "blue";
      case "pitch_melody":
        return "purple";
      case "singing_listening":
        return "green";
      case "sound_quiz":
        return "orange";
      default:
        return "gray";
    }
  };

  if (modulesLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeModules = modulesData.filter((m) => m.is_active);
  const inactiveModules = modulesData.filter((m) => !m.is_active);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">치료 프로그램 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              음악 치료 모듈과 운동을 관리하고 설정합니다
            </p>
          </div>
          <button
            onClick={() => setShowAddModule(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>모듈 추가</span>
          </button>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">총 모듈</p>
                <p className="text-2xl font-bold text-gray-900">
                  {modulesData.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">활성 모듈</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activeModules.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Target className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">총 운동</p>
                <p className="text-2xl font-bold text-gray-900">
                  {modulesData.reduce((sum, m) => sum + (m.exercise_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Play className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">총 세션</p>
                <p className="text-2xl font-bold text-gray-900">
                  {modulesData.reduce((sum, m) => sum + (m.session_count || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모듈 목록 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 활성 모듈 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">활성 모듈</h3>
            <div className="text-sm text-green-600">
              참가자가 이용할 수 있는 모듈
            </div>
          </div>

          {activeModules.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">활성화된 모듈이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isSelected={selectedModule?.id === module.id}
                  onSelect={() => setSelectedModule(module)}
                  onToggleActive={(module) => 
                    toggleModuleMutation.mutate({
                      id: module.id,
                      is_active: !module.is_active,
                    })
                  }
                  onEdit={setEditingModule}
                  getModuleIcon={getModuleIcon}
                  getModuleColor={getModuleColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* 비활성 모듈 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">비활성 모듈</h3>
            <div className="text-sm text-gray-600">
              참가자에게 제공되지 않는 모듈
            </div>
          </div>

          {inactiveModules.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">모든 모듈이 활성화되어 있습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inactiveModules.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  isSelected={selectedModule?.id === module.id}
                  onSelect={() => setSelectedModule(module)}
                  onToggleActive={(module) => 
                    toggleModuleMutation.mutate({
                      id: module.id,
                      is_active: !module.is_active,
                    })
                  }
                  onEdit={setEditingModule}
                  getModuleIcon={getModuleIcon}
                  getModuleColor={getModuleColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 선택된 모듈의 운동 목록 */}
      {selectedModule && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedModule.display_name} - 운동 목록
            </h3>
            <button
              onClick={() => setShowAddExercise(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>운동 추가</span>
            </button>
          </div>

          {exercisesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : exercisesData.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">이 모듈에는 운동이 없습니다.</p>
              <p className="text-sm text-gray-500 mt-1">
                첫 번째 운동을 추가해보세요.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exercisesData.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onToggleActive={(exercise) => 
                    toggleExerciseMutation.mutate({
                      id: exercise.id,
                      is_active: !exercise.is_active,
                    })
                  }
                  onEdit={setEditingExercise}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 모듈 카드 컴포넌트
function ModuleCard({ 
  module, 
  isSelected, 
  onSelect, 
  onToggleActive, 
  onEdit, 
  getModuleIcon, 
  getModuleColor 
}) {
  const color = getModuleColor(module.name);
  
  return (
    <div
      className={`border rounded-lg p-4 transition-all cursor-pointer ${
        isSelected
          ? `border-${color}-400 bg-${color}-50`
          : module.is_active
          ? "border-green-200 bg-green-50 hover:border-green-300"
          : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center text-${color}-600`}>
            {getModuleIcon(module.name)}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{module.display_name}</h4>
            <p className="text-sm text-gray-600">순서: {module.module_order}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(module);
            }}
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              module.is_active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {module.is_active ? "활성" : "비활성"}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {module.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          <span>운동 {module.exercise_count || 0}개</span>
          <span>난이도 {module.difficulty_level}/5</span>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(module);
          }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            module.is_active ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              module.is_active ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// 운동 카드 컴포넌트
function ExerciseCard({ exercise, onToggleActive, onEdit }) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        exercise.is_active
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h5 className="font-medium text-gray-900">{exercise.display_name}</h5>
          <p className="text-sm text-gray-600">순서: {exercise.exercise_order}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(exercise)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              exercise.is_active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {exercise.is_active ? "활성" : "비활성"}
          </span>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {exercise.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {Array.from({ length: exercise.difficulty_level }).map((_, i) => (
            <Star key={i} className="w-3 h-3 text-yellow-500 fill-current" />
          ))}
        </div>
        
        <button
          onClick={() => onToggleActive(exercise)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            exercise.is_active ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              exercise.is_active ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        타입: {exercise.exercise_type}
      </div>
    </div>
  );
}