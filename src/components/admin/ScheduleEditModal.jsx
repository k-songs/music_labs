import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";

export function ScheduleEditModal({
  show,
  onClose,
  schedule,
  updateScheduleMutation,
  musicTypes,
  surveyTypes,
}) {
  const [editingSchedule, setEditingSchedule] = useState(schedule);

  useEffect(() => {
    setEditingSchedule(schedule);
  }, [schedule]);

  const handleUpdateSchedule = (e) => {
    e.preventDefault();
    if (!editingSchedule) return;

    // end_date 계산
    const startDate = new Date(editingSchedule.start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + editingSchedule.total_weeks * 7);

    // 세션 빈도 계산
    const activeDaysCount = Array.isArray(editingSchedule.days_of_week)
      ? editingSchedule.days_of_week.length
      : 7;

    const scheduleDataToSend = {
      ...editingSchedule,
      end_date: endDate.toISOString().split("T")[0],
      sessions_per_week: activeDaysCount,
      total_expected_sessions: editingSchedule.total_weeks * activeDaysCount,
      // 기본값 설정
      music_frequency: editingSchedule.music_frequency || 1,
      music_frequency_unit: editingSchedule.music_frequency_unit || "daily",
      survey_frequency: editingSchedule.survey_frequency || 1,
      survey_frequency_unit: editingSchedule.survey_frequency_unit || "daily",
      music_sessions_per_occurrence:
        editingSchedule.music_sessions_per_occurrence || 1,
      daily_music_sessions:
        editingSchedule.music_frequency_unit === "daily"
          ? editingSchedule.music_frequency || 1
          : 1,
      daily_survey_sessions:
        editingSchedule.survey_frequency_unit === "daily"
          ? editingSchedule.survey_frequency || 1
          : 1,
    };

    console.log("스케줄 업데이트 데이터:", scheduleDataToSend);

    updateScheduleMutation.mutate(scheduleDataToSend, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  if (!show || !editingSchedule) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              스케줄 설정 수정
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUpdateSchedule} className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">기본 설정</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 날짜
                  </label>
                  <input
                    type="date"
                    value={editingSchedule.start_date.split("T")[0]}
                    onChange={(e) =>
                      setEditingSchedule((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    총 기간 (주)
                  </label>
                  <input
                    type="number"
                    value={editingSchedule.total_weeks}
                    onChange={(e) =>
                      setEditingSchedule((prev) => ({
                        ...prev,
                        total_weeks: parseInt(e.target.value) || 1,
                      }))
                    }
                    min="1"
                    max="52"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  세션 시간 (분)
                </label>
                <select
                  value={editingSchedule.session_duration_minutes}
                  onChange={(e) =>
                    setEditingSchedule((prev) => ({
                      ...prev,
                      session_duration_minutes: parseInt(e.target.value),
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15분</option>
                  <option value={20}>20분</option>
                  <option value={30}>30분</option>
                  <option value={45}>45분</option>
                  <option value={60}>60분</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  활성 요일
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {["일", "월", "화", "수", "목", "금", "토"].map(
                    (day, index) => (
                      <label
                        key={index}
                        className="flex items-center justify-center"
                      >
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(editingSchedule.days_of_week) &&
                            editingSchedule.days_of_week.includes(index)
                          }
                          onChange={(e) => {
                            const current = Array.isArray(
                              editingSchedule.days_of_week,
                            )
                              ? editingSchedule.days_of_week
                              : [];
                            const updated = e.target.checked
                              ? [...current, index]
                              : current.filter((d) => d !== index);
                            setEditingSchedule((prev) => ({
                              ...prev,
                              days_of_week: updated,
                            }));
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer ${
                            Array.isArray(editingSchedule.days_of_week) &&
                            editingSchedule.days_of_week.includes(index)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {day}
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* 빈도 설정 */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">활동 빈도 설정</h4>

              {/* 음악 세션 빈도 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3">
                  음악 세션 빈도
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      빈도
                    </label>
                    <input
                      type="number"
                      value={editingSchedule.music_frequency || 1}
                      onChange={(e) =>
                        setEditingSchedule((prev) => ({
                          ...prev,
                          music_frequency: parseInt(e.target.value) || 1,
                        }))
                      }
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      단위
                    </label>
                    <select
                      value={editingSchedule.music_frequency_unit || "daily"}
                      onChange={(e) =>
                        setEditingSchedule((prev) => ({
                          ...prev,
                          music_frequency_unit: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  예: "2 매일" = 하루에 2번, "3 매주" = 일주일에 3번
                </p>
              </div>

              {/* 설문 빈도 */}
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-3">설문 빈도</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      빈도
                    </label>
                    <input
                      type="number"
                      value={editingSchedule.survey_frequency || 1}
                      onChange={(e) =>
                        setEditingSchedule((prev) => ({
                          ...prev,
                          survey_frequency: parseInt(e.target.value) || 1,
                        }))
                      }
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-green-700 mb-1">
                      단위
                    </label>
                    <select
                      value={editingSchedule.survey_frequency_unit || "daily"}
                      onChange={(e) =>
                        setEditingSchedule((prev) => ({
                          ...prev,
                          survey_frequency_unit: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  예: "1 매일" = 하루에 1번, "2 매주" = 일주일에 2번
                </p>
              </div>
            </div>

            {musicTypes && musicTypes.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">음악 유형</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {musicTypes.map((musicType) => (
                    <label key={musicType.name} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(editingSchedule.selected_music_types) &&
                          editingSchedule.selected_music_types.includes(
                            musicType.name,
                          )
                        }
                        onChange={(e) => {
                          const current = Array.isArray(
                            editingSchedule.selected_music_types,
                          )
                            ? editingSchedule.selected_music_types
                            : [];
                          const updated = e.target.checked
                            ? [...current, musicType.name]
                            : current.filter((type) => type !== musicType.name);
                          setEditingSchedule((prev) => ({
                            ...prev,
                            selected_music_types: updated,
                          }));
                        }}
                        className="mr-3 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {musicType.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {surveyTypes && surveyTypes.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">설문 유형</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {surveyTypes.map((surveyType) => (
                    <label key={surveyType.name} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(editingSchedule.active_survey_types) &&
                          editingSchedule.active_survey_types.includes(
                            surveyType.name,
                          )
                        }
                        onChange={(e) => {
                          const current = Array.isArray(
                            editingSchedule.active_survey_types,
                          )
                            ? editingSchedule.active_survey_types
                            : [];
                          const updated = e.target.checked
                            ? [...current, surveyType.name]
                            : current.filter(
                                (type) => type !== surveyType.name,
                              );
                          setEditingSchedule((prev) => ({
                            ...prev,
                            active_survey_types: updated,
                          }));
                        }}
                        className="mr-3 h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {surveyType.display_name || surveyType.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">스케줄 활성화</h4>
                <p className="text-sm text-gray-600">
                  활성화된 스케줄만 참여자에게 적용됩니다
                </p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingSchedule.is_active ?? true}
                  onChange={(e) =>
                    setEditingSchedule((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">활성화</span>
              </label>
            </div>

            <div className="flex space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={updateScheduleMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>
                  {updateScheduleMutation.isPending ? "저장 중..." : "저장"}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
