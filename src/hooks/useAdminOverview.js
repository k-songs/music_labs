import { useQuery } from "@tanstack/react-query";

export function useAdminOverview() {
    const { data: sessionsStats, isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions-stats"],
        queryFn: async () => {
          const response = await fetch("/api/sessions");
          const data = await response.json();
    
          if (!response.ok) {
            throw new Error("세션 통계를 불러올 수 없습니다");
          }
    
          const sessions = data.sessions || [];
          return {
            total: sessions.length,
            completed: sessions.filter((s) => s.completed).length,
            today: sessions.filter((s) => {
              const sessionDate = new Date(s.session_date);
              const today = new Date();
              return sessionDate.toDateString() === today.toDateString();
            }).length,
          };
        },
      });
    
      const { data: surveysStats, isLoading: surveysLoading } = useQuery({
        queryKey: ["surveys-stats"],
        queryFn: async () => {
          const response = await fetch("/api/surveys");
          const data = await response.json();
    
          if (!response.ok) {
            throw new Error("설문 통계를 불러올 수 없습니다");
          }
    
          const surveys = data.scores || [];
          return {
            total: surveys.length,
            today: surveys.filter((s) => {
              const surveyDate = new Date(s.survey_date);
              const today = new Date();
              return surveyDate.toDateString() === today.toDateString();
            }).length,
            types: [...new Set(surveys.map((s) => s.survey_type))].length,
          };
        },
      });

      return { 
        sessionsStats, 
        surveysStats,
        isLoading: sessionsLoading || surveysLoading
    };
}
