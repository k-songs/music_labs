"use client";

import { useState, useEffect } from "react";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminTabs from "../../components/admin/AdminTabs";
import OverviewTab from "../../components/admin/OverviewTab";
import ParticipantsManagementTab from "../../components/admin/ParticipantsManagementTab";
import MusicManagementTab from "../../components/admin/MusicManagementTab";
import TherapyManagementTab from "../../components/admin/TherapyManagementTab";
import SurveyManagementTab from "../../components/admin/SurveyManagementTab";
import ActivityMonitoringTab from "../../components/admin/ActivityMonitoringTab";
import SystemSettingsTab from "../../components/admin/SystemSettingsTab";
import { useAdminUsers } from "../../hooks/useAdminUsers";
import { useAdminOverview } from "../../hooks/useAdminOverview";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Initial data fetch for overview
  const { users, usersLoading } = useAdminUsers("");
  const {
    sessionsStats,
    surveysStats,
    isLoading: statsLoading,
  } = useAdminOverview();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUserType = localStorage.getItem("userType");
      if (savedUserType === "admin") {
        setIsAuthorized(true);
      } else {
        window.location.href = "/";
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("userType");
    window.location.href = "/";
  };

  const handleExport = () => {
    window.open("/api/export?type=all&format=csv", "_blank");
  };

  if (!isAuthorized || usersLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 페이지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AdminHeader
        onAddUser={() => {}} // User addition is now handled in ParticipantsManagementTab
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="space-y-6">
          {activeTab === "overview" && (
            <OverviewTab
              usersCount={users.length}
              sessionsStats={sessionsStats}
              surveysStats={surveysStats}
              onExport={handleExport}
            />
          )}
          {activeTab === "participants" && <ParticipantsManagementTab />}
          {activeTab === "music" && <MusicManagementTab />}
          {activeTab === "therapy" && <TherapyManagementTab />}
          {activeTab === "surveys" && <SurveyManagementTab />}
          {activeTab === "monitoring" && <ActivityMonitoringTab />}
          {activeTab === "settings" && <SystemSettingsTab />}
        </div>
      </div>
    </div>
  );
}
