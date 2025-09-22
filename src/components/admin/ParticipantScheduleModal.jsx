"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Save, Music, FileText, Calendar, Clock } from "lucide-react";

export default function ParticipantScheduleModal({ user, onClose }) {
  const queryClient = useQueryClient();
  const [scheduleData, setScheduleData] = useState({
    user_id: user.id,
    start_date: new Date().toISOString().split("T")[0],
    total_weeks: 4,
    session_duration_minutes: 30,
    days_of_week: [1, 2, 3, 4, 5], // 월-금
    selected_music_types: [],
    active_survey_types: [],
    music_frequency: 1,
    music_frequency_unit: "daily",
    survey_frequency: 1,
    survey_frequency_unit: "daily",
    is_active: true,
  });

  // 음악 유형 목록 가져오기
  const { data: musicTypes } = useQuery({
    queryKey: ["music-types"],
    queryFn: async () => {
      const response = await fetch("/api/music-types");
      const data = await response.json();
      console.log("Music types API response:", data);
      return data.music_types?.filter((m) => m.is_active) || [];
    },
  });

  // 설문 유형 목록 가져오기
  const { data: surveyTypes } = useQuery({
    queryKey: ["survey-types"],
    queryFn: async () => {
      const response = await fetch("/api/survey-types");
      const data = await response.json();
      console.log("Survey types API response:", data);
      return data.surveyTypes?.filter((s) => s.is_active) || [];
    },
  });

  // 기존 스케줄 가져오기
  const { data: existingSchedule } = useQuery({
    queryKey: ["participant-schedule", user.id],
    queryFn: async () => {
      const response = await fetch(`/api/research-schedule?user_id=${user.id}`);
      const data = await response.json();
      return data.schedule;
    },
  });

  useEffect(() => {
    if (existingSchedule) {
      setScheduleData({
        ...existingSchedule,
        start_date:
          existingSchedule.start_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
      });
    }
  }, [existingSchedule]);

  // 스케줄 저장 뮤테이션
  const saveScheduleMutation = useMutation({
    mutationFn: async (data) => {
      console.log("💾 스케줄 저장 시작:", data);
      const method = existingSchedule ? "PUT" : "POST";
      const response = await fetch("/api/research-schedule", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "스케줄 저장에 실패했습니다");
      }

      const result = await response.json();
      console.log("✅ 스케줄 저장 완료:", result);
      return result;
    },
    onSuccess: async (data, variables) => {
      console.log("🔄 캐시 무효화 시작...");

      // 1. 관리자 페이지 관련 캐시 무효화
      await Promise.all([
        queryClient.invalidateQueries(["participant-schedule", user.id]),
        queryClient.invalidateQueries(["admin-users"]),
        queryClient.invalidateQueries(["users"]),
        queryClient.invalidateQueries(["research-schedules"]),
        queryClient.invalidateQueries(["schedules"]),
      ]);

      // 2. 참가자 화면 관련 캐시 무효화 (해당 사용자)
      await Promise.all([
        queryClient.invalidateQueries(["schedule", user.id]),
        queryClient.invalidateQueries(["user-schedule", user.id]),
        queryClient.invalidateQueries(["today-sessions", user.id]),
        queryClient.invalidateQueries(["today-surveys", user.id]),
      ]);

      // 3. 전역 캐시 무효화 (음악/설문 유형 등)
      await Promise.all([
        queryClient.invalidateQueries(["music-types"]),
        queryClient.invalidateQueries(["survey-types"]),
      ]);

      // 4. 강제 리프레시 - 참가자 스케줄 데이터
      queryClient.refetchQueries(["schedule", user.id]);

      console.log(
        `✅ 모든 캐시 무효화 완료 - 사용자 ${user.id} (${user.name})`,
      );

      // UI 업데이트를 위한 약간의 지연
      setTimeout(() => {
        onClose();
      }, 100);
    },
    onError: (error) => {
      console.error("❌ 스케줄 저장 실패:", error);
      alert(`스케줄 저장 실패: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (scheduleData.selected_music_types.length === 0) {
      alert("최소 하나의 음악 유형을 선택해주세요.");
      return;
    }
    if (scheduleData.active_survey_types.length === 0) {
      alert("최소 하나의 설문 유형을 선택해주세요.");
      return;
    }

    const endDate = new Date(scheduleData.start_date);
    endDate.setDate(endDate.getDate() + scheduleData.total_weeks * 7);

    const dataToSave = {
      ...scheduleData,
      end_date: endDate.toISOString().split("T")[0],
      sessions_per_week: scheduleData.days_of_week.length,
      total_expected_sessions:
        scheduleData.total_weeks * scheduleData.days_of_week.length,
    };

    saveScheduleMutation.mutate(dataToSave);
  };

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                연구 스케줄 설정
              </h3>
              <p className="text-gray-600 mt-1">
                {user.name} ({user.patient_id})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 기본 설정 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">기본 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 날짜
                  </label>
                  <input
                    type="date"
                    value={scheduleData.start_date}
                    onChange={(e) =>
                      setScheduleData((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    진행 기간 (주)
                  </label>
                  <input
                    type="number"
                    value={scheduleData.total_weeks}
                    onChange={(e) =>
                      setScheduleData((prev) => ({
                        ...prev,
                        total_weeks: parseInt(e.target.value) || 1,
                      }))
                    }
                    min="1"
                    max="52"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    세션 시간 (분)
                  </label>
                  <select
                    value={scheduleData.session_duration_minutes}
                    onChange={(e) =>
                      setScheduleData((prev) => ({
                        ...prev,
                        session_duration_minutes: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15분</option>
                    <option value={20}>20분</option>
                    <option value={30}>30분</option>
                    <option value={45}>45분</option>
                    <option value={60}>60분</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 활성 요일 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">활동 요일 선택</h4>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => (
                  <label
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <input
                      type="checkbox"
                      checked={scheduleData.days_of_week.includes(index)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...scheduleData.days_of_week, index]
                          : scheduleData.days_of_week.filter(
                              (d) => d !== index,
                            );
                        setScheduleData((prev) => ({
                          ...prev,
                          days_of_week: updated,
                        }));
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer ${
                        scheduleData.days_of_week.includes(index)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {day}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 음악 유형 선택 */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Music className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">음악 유형 선택</h4>
              </div>
              {musicTypes && musicTypes.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {musicTypes.map((musicType) => (
                    <label key={musicType.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scheduleData.selected_music_types.includes(
                          musicType.name,
                        )}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [
                                ...scheduleData.selected_music_types,
                                musicType.name,
                              ]
                            : scheduleData.selected_music_types.filter(
                                (type) => type !== musicType.name,
                              );
                          setScheduleData((prev) => ({
                            ...prev,
                            selected_music_types: updated,
                          }));
                        }}
                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {musicType.name}
                      </span>
                      {musicType.description && (
                        <span className="text-xs text-gray-500 ml-2">
                          - {musicType.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  활성화된 음악 유형이 없습니다. 음악 관리에서 먼저
                  설정해주세요.
                </p>
              )}
            </div>

            {/* 설문 유형 선택 */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">설문 유형 선택</h4>
              </div>
              {surveyTypes && surveyTypes.length > 0 ? (
                <div className="space-y-2">
                  {surveyTypes.map((surveyType) => (
                    <label key={surveyType.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scheduleData.active_survey_types.includes(
                          surveyType.name,
                        )}
                        onChange={(e) => {
                          const updated = e.target.checked
                            ? [
                                ...scheduleData.active_survey_types,
                                surveyType.name,
                              ]
                            : scheduleData.active_survey_types.filter(
                                (type) => type !== surveyType.name,
                              );
                          setScheduleData((prev) => ({
                            ...prev,
                            active_survey_types: updated,
                          }));
                        }}
                        className="mr-3 h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {surveyType.display_name || surveyType.name}
                      </span>
                      {surveyType.description && (
                        <span className="text-xs text-gray-500 ml-2">
                          - {surveyType.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  활성화된 설문 유형이 없습니다. 설문 관리에서 먼저
                  설정해주세요.
                </p>
              )}
            </div>

            {/* 빈도 설정 */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">활동 빈도 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    음악 세션 빈도
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={scheduleData.music_frequency}
                      onChange={(e) =>
                        setScheduleData((prev) => ({
                          ...prev,
                          music_frequency: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}회
                        </option>
                      ))}
                    </select>
                    <select
                      value={scheduleData.music_frequency_unit}
                      onChange={(e) =>
                        setScheduleData((prev) => ({
                          ...prev,
                          music_frequency_unit: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">일간</option>
                      <option value="weekly">주간</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설문 응답 빈도
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={scheduleData.survey_frequency}
                      onChange={(e) =>
                        setScheduleData((prev) => ({
                          ...prev,
                          survey_frequency: parseInt(e.target.value),
                        }))
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num}회
                        </option>
                      ))}
                    </select>
                    <select
                      value={scheduleData.survey_frequency_unit}
                      onChange={(e) =>
                        setScheduleData((prev) => ({
                          ...prev,
                          survey_frequency_unit: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="daily">일간</option>
                      <option value="weekly">주간</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 스케줄 활성화 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">스케줄 활성화</h4>
                <p className="text-sm text-gray-600">
                  활성화된 스케줄만 참가자에게 적용됩니다
                </p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={scheduleData.is_active}
                  onChange={(e) =>
                    setScheduleData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">활성화</span>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saveScheduleMutation.isPending}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {saveScheduleMutation.isPending
                  ? "저장 중..."
                  : existingSchedule
                    ? "수정"
                    : "생성"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
