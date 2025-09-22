import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings, Save, Shield, AlertCircle, CheckCircle } from "lucide-react";

export default function SystemSettingsTab() {
  const queryClient = useQueryClient();
  const [adminId, setAdminId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // success, error

  // 현재 관리자 ID 조회
  const { data: adminIdData, isLoading } = useQuery({
    queryKey: ["settings", "admin_id"],
    queryFn: async () => {
      const response = await fetch("/api/settings?key=admin_id");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "설정 조회 실패");
      }

      return data.setting;
    },
  });

  // 관리자 ID 데이터가 로드되면 초기값 설정
  useEffect(() => {
    if (adminIdData && adminIdData.setting_value) {
      setAdminId(adminIdData.setting_value);
    }
  }, [adminIdData]);

  // 설정 업데이트
  const updateAdminIdMutation = useMutation({
    mutationFn: async (newAdminId) => {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          setting_key: "admin_id",
          setting_value: newAdminId,
          description: "관리자 로그인 ID",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "설정 저장 실패");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "admin_id"] });
      setMessage("관리자 ID가 성공적으로 변경되었습니다.");
      setMessageType("success");

      // 3초 후 메시지 자동 숨김
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);
    },
    onError: (error) => {
      setMessage(error.message || "설정 저장 중 오류가 발생했습니다.");
      setMessageType("error");

      // 5초 후 메시지 자동 숨김
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    },
  });

  const handleSaveAdminId = (e) => {
    e.preventDefault();

    if (!adminId.trim()) {
      setMessage("관리자 ID를 입력해주세요.");
      setMessageType("error");
      return;
    }

    if (adminId.trim().length < 3) {
      setMessage("관리자 ID는 최소 3자 이상이어야 합니다.");
      setMessageType("error");
      return;
    }

    updateAdminIdMutation.mutate(adminId.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">시스템 설정</h2>
      </div>

      {/* 보안 설정 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">보안 설정</h3>
          </div>

          <form onSubmit={handleSaveAdminId} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관리자 로그인 ID
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="관리자 ID를 입력하세요"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading || updateAdminIdMutation.isPending}
                  minLength={3}
                  maxLength={50}
                />
                <button
                  type="submit"
                  disabled={isLoading || updateAdminIdMutation.isPending}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {updateAdminIdMutation.isPending ? "저장 중..." : "저장"}
                  </span>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                이 ID로만 관리자 페이지에 접근할 수 있습니다. 안전한 ID로
                설정하세요.
              </p>
            </div>
          </form>

          {/* 메시지 표시 */}
          {message && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-center space-x-2 ${
                messageType === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {messageType === "success" ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message}</span>
            </div>
          )}

          {/* 현재 설정 정보 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">현재 설정</h4>
            <div className="text-sm text-gray-600">
              <p>
                <span className="font-medium">현재 관리자 ID:</span>{" "}
                {isLoading
                  ? "로딩 중..."
                  : adminIdData?.setting_value || "설정되지 않음"}
              </p>
              {adminIdData?.updated_at && (
                <p className="mt-1">
                  <span className="font-medium">마지막 수정:</span>{" "}
                  {new Date(adminIdData.updated_at).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          </div>

          {/* 보안 가이드 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">보안 가이드</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 관리자 ID는 3자 이상으로 설정하세요</li>
              <li>• 추측하기 어려운 ID를 사용하세요</li>
              <li>• 정기적으로 ID를 변경하는 것을 권장합니다</li>
              <li>• 관리자 ID를 다른 사람과 공유하지 마세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
