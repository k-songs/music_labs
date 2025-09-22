"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SurveyScoreChart({ data, title, surveyType }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          설문 데이터가 없습니다.
        </div>
      </div>
    );
  }

  // 날짜별로 데이터 정리
  const chartData = data.map(item => ({
    date: new Date(item.survey_date).toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    }),
    score: item.percentage_score,
    totalScore: item.total_score,
    maxScore: item.max_possible_score,
    detailedScores: item.detailed_scores
  }));

  // 설문 타입별 색상 설정
  const getColor = (type) => {
    switch(type) {
      case 'THI': return '#ef4444'; // red
      case 'HHIA': return '#3b82f6'; // blue  
      case 'SSQ12': return '#10b981'; // green
      case 'REHAB': return '#8b5cf6'; // purple
      default: return '#6b7280'; // gray
    }
  };

  // 설문 타입별 해석 정보
  const getInterpretation = (type, score) => {
    if (type === 'THI') {
      if (score <= 16) return { level: '경미', color: 'text-green-600' };
      if (score <= 36) return { level: '가벼움', color: 'text-blue-600' };
      if (score <= 56) return { level: '보통', color: 'text-yellow-600' };
      if (score <= 76) return { level: '심함', color: 'text-orange-600' };
      return { level: '매우 심함', color: 'text-red-600' };
    } else if (type === 'HHIA') {
      if (score <= 16) return { level: '장애 없음', color: 'text-green-600' };
      if (score <= 42) return { level: '경미-보통', color: 'text-yellow-600' };
      return { level: '심각한 장애', color: 'text-red-600' };
    } else if (type === 'SSQ12') {
      if (score >= 7) return { level: '양호', color: 'text-green-600' };
      if (score >= 5) return { level: '보통', color: 'text-yellow-600' };
      return { level: '저조', color: 'text-red-600' };
    }
    return { level: '해석 정보 없음', color: 'text-gray-600' };
  };

  const latestScore = chartData[chartData.length - 1];
  const interpretation = getInterpretation(surveyType, latestScore?.score || 0);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {latestScore && (
          <div className="text-right">
            <div className="text-sm text-gray-500">최근 점수</div>
            <div className="text-xl font-bold" style={{ color: getColor(surveyType) }}>
              {latestScore.score}%
            </div>
            <div className={`text-sm font-medium ${interpretation.color}`}>
              {interpretation.level}
            </div>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <YAxis 
              domain={[0, surveyType === 'SSQ12' ? 10 : 100]}
              tick={{ fontSize: 12 }}
              stroke="#6b7280"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value, name) => [
                `${value}${surveyType === 'SSQ12' ? '/10' : '%'}`,
                '점수'
              ]}
              labelFormatter={(label) => `날짜: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke={getColor(surveyType)}
              strokeWidth={2}
              dot={{ fill: getColor(surveyType), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: getColor(surveyType), strokeWidth: 2, fill: 'white' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 추가 정보 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">총 평가 수</div>
            <div className="font-semibold">{chartData.length}회</div>
          </div>
          <div>
            <div className="text-gray-500">최고 점수</div>
            <div className="font-semibold text-green-600">
              {Math.max(...chartData.map(d => d.score))}%
            </div>
          </div>
          <div>
            <div className="text-gray-500">최저 점수</div>
            <div className="font-semibold text-red-600">
              {Math.min(...chartData.map(d => d.score))}%
            </div>
          </div>
          <div>
            <div className="text-gray-500">평균 점수</div>
            <div className="font-semibold">
              {Math.round(chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}