"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HearingLevelChart({ ptaResults, selectedUser }) {
  if (!ptaResults || ptaResults.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        PTA 데이터가 없습니다.
      </div>
    );
  }

  // 데이터 준비
  const chartData = ptaResults
    .filter(result => !selectedUser || result.user_id === selectedUser)
    .sort((a, b) => new Date(a.test_date) - new Date(b.test_date))
    .map(result => ({
      date: new Date(result.test_date).toLocaleDateString('ko-KR'),
      ear_side: result.ear_side === 'left' ? '좌측' : '우측',
      test_type: result.test_type === 'AC' ? '기도' : '골도',
      pta_4freq: result.pta_4freq,
      pta_6freq: result.pta_6freq,
      label: `${new Date(result.test_date).toLocaleDateString('ko-KR')} (${result.ear_side === 'left' ? '좌측' : '우측'}, ${result.test_type === 'AC' ? '기도' : '골도'})`
    }));

  // 청력 정도 기준선
  const hearingLevels = [
    { value: 15, label: '정상', color: '#10B981' },
    { value: 25, label: '경도', color: '#F59E0B' },
    { value: 40, label: '중도', color: '#F97316' },
    { value: 55, label: '중고도', color: '#EF4444' },
    { value: 70, label: '고도', color: '#DC2626' },
    { value: 90, label: '심도', color: '#991B1B' }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{data.label}</p>
          <p className="text-blue-600">4분법 PTA: {data.pta_4freq} dB HL</p>
          <p className="text-green-600">6분법 PTA: {data.pta_6freq} dB HL</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">PTA 변화 추이</h3>
        <p className="text-sm text-gray-600">시간에 따른 청력 변화를 추적합니다.</p>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="label" 
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              fontSize={12}
            />
            <YAxis 
              domain={[0, 120]}
              label={{ value: 'dB HL', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {/* 청력 정도 기준선들 */}
            {hearingLevels.map((level, index) => (
              <Line
                key={`level-${index}`}
                dataKey={() => level.value}
                stroke={level.color}
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                name={`${level.label} (${level.value}dB)`}
                connectNulls={false}
              />
            ))}
            
            {/* 실제 PTA 데이터 */}
            <Line
              type="monotone"
              dataKey="pta_4freq"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              name="4분법 PTA"
            />
            <Line
              type="monotone"
              dataKey="pta_6freq"
              stroke="#10B981"
              strokeWidth={3}
              dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
              name="6분법 PTA"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 설명 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">청력 정도 분류</h4>
          <div className="space-y-1">
            {hearingLevels.slice(0, 3).map((level) => (
              <div key={level.label} className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 border-2" 
                  style={{ borderColor: level.color }}
                />
                <span>{level.label}: ~{level.value}dB</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-2">&nbsp;</h4>
          <div className="space-y-1">
            {hearingLevels.slice(3).map((level) => (
              <div key={level.label} className="flex items-center">
                <div 
                  className="w-3 h-3 mr-2 border-2" 
                  style={{ borderColor: level.color }}
                />
                <span>{level.label}: ~{level.value}dB</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-2">PTA 계산법</h4>
          <div className="space-y-1">
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 bg-blue-500 rounded-full" />
              <span>4분법: 500,1K,2K,4K Hz</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 mr-2 bg-green-500 rounded-full" />
              <span>6분법: 250,500,1K,2K,4K,8K Hz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}