import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useScheduleManagement() {
  const queryClient = useQueryClient();

  // Fetch users
  const {
    data: usersData,
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch users");
      }
      return data.users || [];
    },
  });

  // Fetch schedules
  const {
    data: schedulesData,
    isLoading: loadingSchedules,
    error: schedulesError,
  } = useQuery({
    queryKey: ["research-schedules"],
    queryFn: async () => {
      const response = await fetch("/api/research-schedule");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch schedules");
      }
      return data.schedules || [];
    },
  });

  // Fetch music types
  const { data: musicTypes } = useQuery({
    queryKey: ["music-types", "active"],
    queryFn: async () => {
      const response = await fetch("/api/music-types/active");
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.warn("음악 유형 조회 실패:", data.error);
        return [];
      }
      return data.musicTypes || [];
    },
  });

  // Fetch survey types
  const { data: surveyTypes } = useQuery({
    queryKey: ["survey-types"],
    queryFn: async () => {
      const response = await fetch("/api/survey-types");
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.warn("설문 유형 조회 실패:", data.error);
        return [];
      }
      return data.surveyTypes?.filter((type) => type.is_active) || [];
    },
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to add user");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["users"]);
      alert(`✅ ${data.message || "참여자가 추가되었습니다!"}`);
    },
    onError: (error) => {
      alert(`❌ 참여자 추가 실패: ${error.message}`);
    },
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (scheduleData) => {
      console.log("📝 스케줄 업데이트 요청:", scheduleData);
      const response = await fetch("/api/research-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });
      const data = await response.json();
      console.log("📝 스케줄 업데이트 응답:", data);
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update schedule");
      }
      return data;
    },
    onSuccess: async (data, variables) => {
      console.log("✅ 스케줄 업데이트 성공:", data);
      console.log("🔄 통합 캐시 무효화 시작...");

      // 1. 관리자용 스케줄 목록 무효화
      await Promise.all([
        queryClient.invalidateQueries(["research-schedules"]),
        queryClient.invalidateQueries(["users"]),
        queryClient.invalidateQueries(["admin-users"]),
        queryClient.invalidateQueries(["schedules"]),
      ]);

      // 2. 해당 사용자의 참가자용 스케줄 캐시 무효화
      if (variables.user_id) {
        await Promise.all([
          queryClient.invalidateQueries(["schedule", variables.user_id]),
          queryClient.invalidateQueries([
            "participant-schedule",
            variables.user_id,
          ]),
          queryClient.invalidateQueries(["user-schedule", variables.user_id]),
          queryClient.invalidateQueries(["today-sessions", variables.user_id]),
          queryClient.invalidateQueries(["today-surveys", variables.user_id]),
        ]);

        // 3. 강제 리프레시 - 참가자 스케줄 데이터
        queryClient.refetchQueries(["schedule", variables.user_id]);

        console.log(`✅ 사용자 ${variables.user_id} 캐시 무효화 완료`);
      }

      // 4. 전역 설정 캐시 무효화
      await Promise.all([
        queryClient.invalidateQueries(["music-types"]),
        queryClient.invalidateQueries(["survey-types"]),
      ]);

      console.log("🎉 모든 캐시 무효화 완료!");
    },
    onError: (error) => {
      console.error("❌ 스케줄 업데이트 실패:", error);
      alert(`❌ 스케줄 업데이트 실패: ${error.message}`);
    },
  });

  const getScheduleForUser = (userId) => {
    return schedulesData?.find((schedule) => schedule.user_id === userId);
  };

  const stats = {
    totalUsers: usersData?.length || 0,
    activeSchedules: schedulesData?.filter((s) => s.is_active)?.length || 0,
    totalSchedules: schedulesData?.length || 0,
    completionRate:
      schedulesData?.length > 0
        ? (
            schedulesData.reduce(
              (acc, s) => acc + (s.completion_percentage || 0),
              0,
            ) / schedulesData.length
          ).toFixed(1)
        : 0,
  };

  return {
    usersData,
    schedulesData,
    musicTypes,
    surveyTypes,
    isLoading: loadingUsers || loadingSchedules,
    error: usersError || schedulesError,
    addUserMutation,
    updateScheduleMutation,
    getScheduleForUser,
    stats,
    invalidateData: () => {
      queryClient.invalidateQueries(["users"]);
      queryClient.invalidateQueries(["research-schedules"]);
    },
  };
}
