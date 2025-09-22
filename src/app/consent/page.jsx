"use client";

import { useState, useEffect } from "react";
import { Shield, FileText, CheckCircle, Clock } from "lucide-react";

export default function ConsentPage() {
  const [userId, setUserId] = useState(null);
  const [consent, setConsent] = useState({
    research_participation: false,
    data_collection: false,
    data_sharing: false,
    withdrawal_right: false,
    contact_permission: false,
  });
  const [digitalSignature, setDigitalSignature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Extract user_id from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setUserId(urlParams.get("user_id"));
    }
  }, []);

  const consentItems = [
    {
      key: "research_participation",
      title: "연구 참여 동의",
      description:
        "난청·이명 환자를 위한 음악 재활 연구에 자발적으로 참여하는 것에 동의합니다.",
      required: true,
    },
    {
      key: "data_collection",
      title: "개인정보 수집 및 이용 동의",
      description:
        "연구 목적으로 개인정보(나이, 성별, 청력검사 결과, 설문 응답 등)를 수집·이용하는 것에 동의합니다.",
      required: true,
    },
    {
      key: "data_sharing",
      title: "연구 데이터 공유 동의",
      description:
        "연구 결과를 학술지나 학회에서 발표할 때 개인정보는 제외하고 연구 데이터를 사용하는 것에 동의합니다.",
      required: true,
    },
    {
      key: "withdrawal_right",
      title: "참여 철회권 인지",
      description:
        "언제든지 연구 참여를 철회할 수 있으며, 이로 인한 불이익이 없음을 이해했습니다.",
      required: true,
    },
    {
      key: "contact_permission",
      title: "연락처 활용 동의 (선택)",
      description:
        "연구 진행 상황 알림이나 추가 연구 참여 안내를 위해 연락처를 사용하는 것에 동의합니다.",
      required: false,
    },
  ];

  const handleConsentChange = (key, value) => {
    setConsent((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const isAllRequiredConsentsGiven = () => {
    return consentItems
      .filter((item) => item.required)
      .every((item) => consent[item.key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAllRequiredConsentsGiven()) {
      alert("필수 동의 항목을 모두 확인해주세요.");
      return;
    }

    if (!digitalSignature.trim()) {
      alert("성명을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 동의서 정보 저장
      const consentData = {
        user_id: parseInt(userId),
        consent_type: "research_participation",
        consent_text: JSON.stringify({
          items: consent,
          signature: digitalSignature,
          timestamp: new Date().toISOString(),
          ip_address: "client", // 실제로는 서버에서 IP 추출
          user_agent: navigator.userAgent,
        }),
        agreed: true,
        digital_signature: digitalSignature,
      };

      const response = await fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(consentData),
      });

      if (!response.ok) {
        throw new Error("동의서 저장에 실패했습니다.");
      }

      // 사용자 정보 업데이트 (동의 상태 반영)
      await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: parseInt(userId),
          consent_given: true,
        }),
      });

      setIsCompleted(true);
    } catch (error) {
      console.error("Consent submission error:", error);
      alert("동의서 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            잘못된 접근입니다
          </h1>
          <p className="text-gray-600">사용자 ID가 필요합니다.</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            동의서 작성 완료
          </h1>
          <p className="text-gray-600 mb-6">
            연구 참여 동의서가 성공적으로 제출되었습니다. 연구에 참여해 주셔서
            감사합니다.
          </p>
          <button
            onClick={() => (window.location.href = `/?user_id=${userId}`)}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            연구 참여 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                연구 참여 동의서
              </h1>
              <p className="text-gray-600">
                난청·이명 환자를 위한 음악 재활 연구
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {/* 연구 개요 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              연구 개요
            </h2>
            <div className="bg-blue-50 rounded-lg p-4 space-y-3 text-sm">
              <p>
                <strong>연구 제목:</strong> 난청·이명 환자를 위한 개인맞춤형
                음악 재활 시스템의 효과성 평가
              </p>
              <p>
                <strong>연구 기관:</strong> [기관명]
              </p>
              <p>
                <strong>연구 책임자:</strong> [책임자명]
              </p>
              <p>
                <strong>연구 목적:</strong> 음악을 활용한 청각 재활 프로그램이
                난청·이명 환자의 청각 기능 개선과 삶의 질 향상에 미치는 효과를
                과학적으로 검증하기 위함
              </p>
              <p>
                <strong>참여 기간:</strong> 약 4-8주 (개인별 차이 있음)
              </p>
            </div>
          </div>

          {/* 동의 항목들 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                동의 사항
              </h3>
              <div className="space-y-4">
                {consentItems.map((item) => (
                  <div
                    key={item.key}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">
                            {item.title}
                          </h4>
                          {item.required && (
                            <span className="text-red-500 text-sm">*</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={item.key}
                            value="agree"
                            checked={consent[item.key] === true}
                            onChange={() => handleConsentChange(item.key, true)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-green-600">동의</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name={item.key}
                            value="disagree"
                            checked={consent[item.key] === false}
                            onChange={() =>
                              handleConsentChange(item.key, false)
                            }
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-red-600">비동의</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 디지털 서명 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                디지털 서명
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    성명 (필수) *
                  </label>
                  <input
                    type="text"
                    value={digitalSignature}
                    onChange={(e) => setDigitalSignature(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="성명을 입력해주세요"
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      동의 일시
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {new Date().toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  * 필수 항목에 모두 동의해야 연구에 참여하실 수 있습니다.
                </p>
                <button
                  type="submit"
                  disabled={
                    !isAllRequiredConsentsGiven() ||
                    !digitalSignature.trim() ||
                    isSubmitting
                  }
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "제출 중..." : "동의서 제출"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            문의사항 연락처
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p>
              <strong>연구 책임자:</strong> [책임자명] ([직책])
            </p>
            <p>
              <strong>연구 기관:</strong> [기관명] [부서명]
            </p>
            <p>
              <strong>전화번호:</strong> [전화번호]
            </p>
            <p>
              <strong>이메일:</strong> [이메일주소]
            </p>
            <p className="text-gray-600 mt-3">
              연구와 관련된 모든 문의사항은 위 연락처로 문의해 주시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
