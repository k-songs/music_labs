import {
  BarChart3,
  Users,
  Music,
  FileText,
  Activity,
  Settings,
  Brain,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "개요", icon: BarChart3 },
  { id: "participants", label: "참가자 관리", icon: Users },
  { id: "music", label: "음악 관리", icon: Music },
  { id: "therapy", label: "치료 관리", icon: Brain },
  { id: "surveys", label: "설문 관리", icon: FileText },
  { id: "monitoring", label: "활동 모니터링", icon: Activity },
  { id: "settings", label: "시스템 설정", icon: Settings },
];

export default function AdminTabs({ activeTab, setActiveTab }) {
  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-4 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
