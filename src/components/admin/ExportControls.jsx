"use client";

import { useState } from "react";
import {
  Download,
  ChevronDown,
  FileText,
  BarChart3,
  Activity,
} from "lucide-react";

export default function ExportControls({ onExport }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    {
      value: "csv",
      label: "CSV 파일",
      icon: FileText,
      description: "Excel에서 열 수 있는 표 형식",
      fileExt: ".csv",
    },
    {
      value: "excel",
      label: "Excel 파일",
      icon: BarChart3,
      description: "Microsoft Excel 형식",
      fileExt: ".xlsx",
    },
    {
      value: "json",
      label: "JSON 파일",
      icon: Activity,
      description: "개발자용 데이터 형식",
      fileExt: ".json",
    },
  ];

  const handleExport = async (format) => {
    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const params = new URLSearchParams({
        type: "all",
        format: format === "excel" ? "json" : format,
      });

      const response = await fetch(`/api/export?${params}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      if (format === "csv") {
        // For CSV, we expect the API to return the CSV text directly
        const csvText = await response.text();
        downloadFile(
          csvText,
          `hearing_research_data_${new Date().toISOString().split("T")[0]}.csv`,
          "text/csv",
        );
      } else if (format === "excel") {
        // For Excel, we get JSON data and convert it using papaparse
        const data = await response.json();

        // Dynamic import papaparse
        const Papa = await import("papaparse");

        if (data.data && Object.keys(data.data).length > 0) {
          // Create a combined CSV with all sheets
          let combinedContent = "";

          Object.keys(data.data).forEach((sheetName) => {
            if (data.data[sheetName] && data.data[sheetName].length > 0) {
              combinedContent += `=== ${sheetName.toUpperCase()} ===\n`;
              combinedContent +=
                Papa.unparse(data.data[sheetName], {
                  header: true,
                  quotes: true,
                }) + "\n\n";
            }
          });

          downloadFile(
            combinedContent,
            `hearing_research_data_${new Date().toISOString().split("T")[0]}.csv`,
            "text/csv",
          );
        } else {
          throw new Error("No data available to export");
        }
      } else {
        // JSON format
        const data = await response.json();
        downloadFile(
          JSON.stringify(data, null, 2),
          `hearing_research_data_${new Date().toISOString().split("T")[0]}.json`,
          "application/json",
        );
      }
    } catch (error) {
      console.error("Export error:", error);
      alert("내보내기에 실패했습니다: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType + ";charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            데이터 내보내기
          </h3>
          <p className="text-gray-600 mt-1">
            전체 연구 데이터를 다양한 형식으로 내보냅니다.
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "내보내는 중..." : "내보내기"}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showExportMenu && !isExporting && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="p-2">
                {exportOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleExport(option.value)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <option.icon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {option.fileExt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 내보내기 옵션 설명 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map((option) => (
          <div
            key={option.value}
            className="p-3 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              <option.icon className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">{option.label}</span>
            </div>
            <p className="text-xs text-gray-600">{option.description}</p>
            <div className="mt-2">
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                {option.fileExt}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 포함 데이터 안내 */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">포함 데이터</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-700">
          <div>• 참가자 정보</div>
          <div>• 음악 세션 기록</div>
          <div>• 설문 응답 결과</div>
          <div>• 스케줄 정보</div>
          <div>• PTA 검사 결과</div>
          <div>• 시간별 통계</div>
          <div>• 진행률 데이터</div>
          <div>• 점수 분석 결과</div>
        </div>
      </div>
    </div>
  );
}
