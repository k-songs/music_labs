"use client";

import { useState } from "react";
import { X } from "lucide-react";

export default function EditPtaModal({ show, onClose, user, onSave }) {
  const [formData, setFormData] = useState({
    test_date: new Date().toISOString().split('T')[0],
    // 좌측 기도
    left_ac_250: '',
    left_ac_500: '',
    left_ac_1000: '',
    left_ac_2000: '',
    left_ac_3000: '',
    left_ac_4000: '',
    left_ac_6000: '',
    left_ac_8000: '',
    // 우측 기도
    right_ac_250: '',
    right_ac_500: '',
    right_ac_1000: '',
    right_ac_2000: '',
    right_ac_3000: '',
    right_ac_4000: '',
    right_ac_6000: '',
    right_ac_8000: '',
    // 좌측 골도
    left_bc_250: '',
    left_bc_500: '',
    left_bc_1000: '',
    left_bc_2000: '',
    left_bc_3000: '',
    left_bc_4000: '',
    left_bc_6000: '',
    left_bc_8000: '',
    // 우측 골도
    right_bc_250: '',
    right_bc_500: '',
    right_bc_1000: '',
    right_bc_2000: '',
    right_bc_3000: '',
    right_bc_4000: '',
    right_bc_6000: '',
    right_bc_8000: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 좌측 기도, 우측 기도, 좌측 골도, 우측 골도 각각 저장
      const ptaEntries = [];
      
      // 좌측 기도
      if (hasData('left_ac')) {
        ptaEntries.push({
          user_id: user.id,
          test_date: formData.test_date,
          ear_side: 'left',
          test_type: 'AC',
          freq_250: parseValue(formData.left_ac_250),
          freq_500: parseValue(formData.left_ac_500),
          freq_1000: parseValue(formData.left_ac_1000),
          freq_2000: parseValue(formData.left_ac_2000),
          freq_3000: parseValue(formData.left_ac_3000),
          freq_4000: parseValue(formData.left_ac_4000),
          freq_6000: parseValue(formData.left_ac_6000),
          freq_8000: parseValue(formData.left_ac_8000),
        });
      }

      // 우측 기도
      if (hasData('right_ac')) {
        ptaEntries.push({
          user_id: user.id,
          test_date: formData.test_date,
          ear_side: 'right',
          test_type: 'AC',
          freq_250: parseValue(formData.right_ac_250),
          freq_500: parseValue(formData.right_ac_500),
          freq_1000: parseValue(formData.right_ac_1000),
          freq_2000: parseValue(formData.right_ac_2000),
          freq_3000: parseValue(formData.right_ac_3000),
          freq_4000: parseValue(formData.right_ac_4000),
          freq_6000: parseValue(formData.right_ac_6000),
          freq_8000: parseValue(formData.right_ac_8000),
        });
      }

      // 좌측 골도
      if (hasData('left_bc')) {
        ptaEntries.push({
          user_id: user.id,
          test_date: formData.test_date,
          ear_side: 'left',
          test_type: 'BC',
          freq_250: parseValue(formData.left_bc_250),
          freq_500: parseValue(formData.left_bc_500),
          freq_1000: parseValue(formData.left_bc_1000),
          freq_2000: parseValue(formData.left_bc_2000),
          freq_3000: parseValue(formData.left_bc_3000),
          freq_4000: parseValue(formData.left_bc_4000),
          freq_6000: parseValue(formData.left_bc_6000),
          freq_8000: parseValue(formData.left_bc_8000),
        });
      }

      // 우측 골도
      if (hasData('right_bc')) {
        ptaEntries.push({
          user_id: user.id,
          test_date: formData.test_date,
          ear_side: 'right',
          test_type: 'BC',
          freq_250: parseValue(formData.right_bc_250),
          freq_500: parseValue(formData.right_bc_500),
          freq_1000: parseValue(formData.right_bc_1000),
          freq_2000: parseValue(formData.right_bc_2000),
          freq_3000: parseValue(formData.right_bc_3000),
          freq_4000: parseValue(formData.right_bc_4000),
          freq_6000: parseValue(formData.right_bc_6000),
          freq_8000: parseValue(formData.right_bc_8000),
        });
      }

      if (ptaEntries.length === 0) {
        alert('최소한 하나의 검사 결과를 입력해주세요.');
        return;
      }

      // 각 PTA 엔트리를 저장
      for (const entry of ptaEntries) {
        const response = await fetch('/api/pta-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });

        if (!response.ok) {
          throw new Error('PTA 결과 저장에 실패했습니다.');
        }
      }

      onSave();
      onClose();
      // 폼 초기화
      setFormData({
        test_date: new Date().toISOString().split('T')[0],
        left_ac_250: '', left_ac_500: '', left_ac_1000: '', left_ac_2000: '',
        left_ac_3000: '', left_ac_4000: '', left_ac_6000: '', left_ac_8000: '',
        right_ac_250: '', right_ac_500: '', right_ac_1000: '', right_ac_2000: '',
        right_ac_3000: '', right_ac_4000: '', right_ac_6000: '', right_ac_8000: '',
        left_bc_250: '', left_bc_500: '', left_bc_1000: '', left_bc_2000: '',
        left_bc_3000: '', left_bc_4000: '', left_bc_6000: '', left_bc_8000: '',
        right_bc_250: '', right_bc_500: '', right_bc_1000: '', right_bc_2000: '',
        right_bc_3000: '', right_bc_4000: '', right_bc_6000: '', right_bc_8000: '',
      });
    } catch (error) {
      console.error('PTA 결과 저장 오류:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const parseValue = (value) => {
    return value && value.trim() !== '' ? parseFloat(value) : null;
  };

  const hasData = (prefix) => {
    return Object.keys(formData).some(key => 
      key.startsWith(prefix) && formData[key] && formData[key].trim() !== ''
    );
  };

  if (!show) return null;

  const FrequencyInput = ({ label, name, value }) => (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={handleChange}
        step="0.5"
        min="-10"
        max="120"
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        placeholder="dB"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">PTA 검사 결과 입력</h2>
            <p className="text-sm text-gray-600">
              {user?.name} ({user?.patient_id}) - 순음청력검사 결과
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검사 날짜 *
            </label>
            <input
              type="date"
              name="test_date"
              value={formData.test_date}
              onChange={handleChange}
              required
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 좌측 귀 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">좌측 귀</h3>
              
              {/* 좌측 기도 */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">기도 (AC - Air Conduction)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <FrequencyInput label="250Hz" name="left_ac_250" value={formData.left_ac_250} />
                  <FrequencyInput label="500Hz" name="left_ac_500" value={formData.left_ac_500} />
                  <FrequencyInput label="1000Hz" name="left_ac_1000" value={formData.left_ac_1000} />
                  <FrequencyInput label="2000Hz" name="left_ac_2000" value={formData.left_ac_2000} />
                  <FrequencyInput label="3000Hz" name="left_ac_3000" value={formData.left_ac_3000} />
                  <FrequencyInput label="4000Hz" name="left_ac_4000" value={formData.left_ac_4000} />
                  <FrequencyInput label="6000Hz" name="left_ac_6000" value={formData.left_ac_6000} />
                  <FrequencyInput label="8000Hz" name="left_ac_8000" value={formData.left_ac_8000} />
                </div>
              </div>

              {/* 좌측 골도 */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">골도 (BC - Bone Conduction)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <FrequencyInput label="250Hz" name="left_bc_250" value={formData.left_bc_250} />
                  <FrequencyInput label="500Hz" name="left_bc_500" value={formData.left_bc_500} />
                  <FrequencyInput label="1000Hz" name="left_bc_1000" value={formData.left_bc_1000} />
                  <FrequencyInput label="2000Hz" name="left_bc_2000" value={formData.left_bc_2000} />
                  <FrequencyInput label="3000Hz" name="left_bc_3000" value={formData.left_bc_3000} />
                  <FrequencyInput label="4000Hz" name="left_bc_4000" value={formData.left_bc_4000} />
                  <FrequencyInput label="6000Hz" name="left_bc_6000" value={formData.left_bc_6000} />
                  <FrequencyInput label="8000Hz" name="left_bc_8000" value={formData.left_bc_8000} />
                </div>
              </div>
            </div>

            {/* 우측 귀 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">우측 귀</h3>
              
              {/* 우측 기도 */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">기도 (AC - Air Conduction)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <FrequencyInput label="250Hz" name="right_ac_250" value={formData.right_ac_250} />
                  <FrequencyInput label="500Hz" name="right_ac_500" value={formData.right_ac_500} />
                  <FrequencyInput label="1000Hz" name="right_ac_1000" value={formData.right_ac_1000} />
                  <FrequencyInput label="2000Hz" name="right_ac_2000" value={formData.right_ac_2000} />
                  <FrequencyInput label="3000Hz" name="right_ac_3000" value={formData.right_ac_3000} />
                  <FrequencyInput label="4000Hz" name="right_ac_4000" value={formData.right_ac_4000} />
                  <FrequencyInput label="6000Hz" name="right_ac_6000" value={formData.right_ac_6000} />
                  <FrequencyInput label="8000Hz" name="right_ac_8000" value={formData.right_ac_8000} />
                </div>
              </div>

              {/* 우측 골도 */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-3">골도 (BC - Bone Conduction)</h4>
                <div className="grid grid-cols-4 gap-2">
                  <FrequencyInput label="250Hz" name="right_bc_250" value={formData.right_bc_250} />
                  <FrequencyInput label="500Hz" name="right_bc_500" value={formData.right_bc_500} />
                  <FrequencyInput label="1000Hz" name="right_bc_1000" value={formData.right_bc_1000} />
                  <FrequencyInput label="2000Hz" name="right_bc_2000" value={formData.right_bc_2000} />
                  <FrequencyInput label="3000Hz" name="right_bc_3000" value={formData.right_bc_3000} />
                  <FrequencyInput label="4000Hz" name="right_bc_4000" value={formData.right_bc_4000} />
                  <FrequencyInput label="6000Hz" name="right_bc_6000" value={formData.right_bc_6000} />
                  <FrequencyInput label="8000Hz" name="right_bc_8000" value={formData.right_bc_8000} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>입력 안내:</strong> 각 주파수별로 측정된 청력 역치를 dB HL 단위로 입력하세요. 
              측정하지 않은 주파수는 비워두셔도 됩니다. 입력된 데이터는 자동으로 PTA 평균이 계산됩니다.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '저장 중...' : 'PTA 결과 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}