"use client";

import { useState, useEffect } from "react";
import { usePtaResults } from "../../hooks/usePtaResults";

export default function AddPtaResultModal({ show, onClose, users, selectedUserId = null }) {
  const { addPtaResult } = usePtaResults();
  const [loading, setLoading] = useState(false);
  const [ptaData, setPtaData] = useState({
    user_id: selectedUserId || '',
    test_date: new Date().toISOString().split('T')[0],
    ear_side: 'left',
    test_type: 'AC',
    freq_250: '',
    freq_500: '',
    freq_1000: '',
    freq_2000: '',
    freq_3000: '',
    freq_4000: '',
    freq_6000: '',
    freq_8000: ''
  });

  // Calculate PTA averages
  const calculatePta4Freq = () => {
    const { freq_500, freq_1000, freq_2000, freq_4000 } = ptaData;
    const values = [freq_500, freq_1000, freq_2000, freq_4000]
      .filter(v => v !== '' && !isNaN(v))
      .map(Number);
    
    if (values.length === 4) {
      return (values.reduce((a, b) => a + b, 0) / 4).toFixed(2);
    }
    return '-';
  };

  const calculatePta6Freq = () => {
    const { freq_250, freq_500, freq_1000, freq_2000, freq_4000, freq_8000 } = ptaData;
    const values = [freq_250, freq_500, freq_1000, freq_2000, freq_4000, freq_8000]
      .filter(v => v !== '' && !isNaN(v))
      .map(Number);
    
    if (values.length === 6) {
      return (values.reduce((a, b) => a + b, 0) / 6).toFixed(2);
    }
    return '-';
  };

  useEffect(() => {
    if (selectedUserId) {
      setPtaData(prev => ({ ...prev, user_id: selectedUserId }));
    }
  }, [selectedUserId]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert frequency values to numbers or null
      const processedData = {
        ...ptaData,
        freq_250: ptaData.freq_250 ? Number(ptaData.freq_250) : null,
        freq_500: ptaData.freq_500 ? Number(ptaData.freq_500) : null,
        freq_1000: ptaData.freq_1000 ? Number(ptaData.freq_1000) : null,
        freq_2000: ptaData.freq_2000 ? Number(ptaData.freq_2000) : null,
        freq_3000: ptaData.freq_3000 ? Number(ptaData.freq_3000) : null,
        freq_4000: ptaData.freq_4000 ? Number(ptaData.freq_4000) : null,
        freq_6000: ptaData.freq_6000 ? Number(ptaData.freq_6000) : null,
        freq_8000: ptaData.freq_8000 ? Number(ptaData.freq_8000) : null,
      };

      await addPtaResult(processedData);
      
      // Reset form
      setPtaData({
        user_id: selectedUserId || '',
        test_date: new Date().toISOString().split('T')[0],
        ear_side: 'left',
        test_type: 'AC',
        freq_250: '',
        freq_500: '',
        freq_1000: '',
        freq_2000: '',
        freq_3000: '',
        freq_4000: '',
        freq_6000: '',
        freq_8000: ''
      });
      
      onClose();
    } catch (error) {
      console.error('PTA 결과 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPtaData(prev => ({ ...prev, [field]: value }));
  };

  const frequencies = [
    { key: 'freq_250', label: '250 Hz' },
    { key: 'freq_500', label: '500 Hz' },
    { key: 'freq_1000', label: '1000 Hz' },
    { key: 'freq_2000', label: '2000 Hz' },
    { key: 'freq_3000', label: '3000 Hz' },
    { key: 'freq_4000', label: '4000 Hz' },
    { key: 'freq_6000', label: '6000 Hz' },
    { key: 'freq_8000', label: '8000 Hz' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            PTA 검사 결과 추가
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  참여자 *
                </label>
                <select
                  value={ptaData.user_id}
                  onChange={(e) => handleInputChange('user_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={selectedUserId}
                >
                  <option value="">참여자를 선택하세요</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.patient_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검사 날짜 *
                </label>
                <input
                  type="date"
                  value={ptaData.test_date}
                  onChange={(e) => handleInputChange('test_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  측정 귀 *
                </label>
                <select
                  value={ptaData.ear_side}
                  onChange={(e) => handleInputChange('ear_side', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="left">좌측</option>
                  <option value="right">우측</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  검사 유형 *
                </label>
                <select
                  value={ptaData.test_type}
                  onChange={(e) => handleInputChange('test_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="AC">기도 (Air Conduction)</option>
                  <option value="BC">골도 (Bone Conduction)</option>
                </select>
              </div>
            </div>

            {/* 주파수별 역치 입력 */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                주파수별 청력 역치 (dB HL)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {frequencies.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="-10"
                      max="120"
                      value={ptaData[key]}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="dB HL"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 계산된 PTA 평균값 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                계산된 PTA 평균값
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    4분법 PTA (500, 1K, 2K, 4K Hz):
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {calculatePta4Freq()} dB HL
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    6분법 PTA (250, 500, 1K, 2K, 4K, 8K Hz):
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {calculatePta6Freq()} dB HL
                  </span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}