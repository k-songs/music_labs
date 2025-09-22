import { useState, useEffect } from 'react';

export function usePtaResults(userId = null) {
  const [ptaResults, setPtaResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPtaResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = userId ? `/api/pta-results?user_id=${userId}` : '/api/pta-results';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`PTA 결과 조회 실패: ${response.status}`);
      }
      
      const data = await response.json();
      setPtaResults(data);
    } catch (err) {
      console.error('PTA 결과 조회 오류:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPtaResult = async (ptaData) => {
    setError(null);
    
    try {
      const response = await fetch('/api/pta-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ptaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PTA 결과 저장 실패');
      }

      const newResult = await response.json();
      setPtaResults(prev => [newResult, ...prev]);
      return newResult;
    } catch (err) {
      console.error('PTA 결과 추가 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  const updatePtaResult = async (id, ptaData) => {
    setError(null);
    
    try {
      const response = await fetch('/api/pta-results', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...ptaData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PTA 결과 수정 실패');
      }

      const updatedResult = await response.json();
      setPtaResults(prev => 
        prev.map(result => result.id === id ? updatedResult : result)
      );
      return updatedResult;
    } catch (err) {
      console.error('PTA 결과 수정 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  const deletePtaResult = async (id) => {
    setError(null);
    
    try {
      const response = await fetch(`/api/pta-results?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PTA 결과 삭제 실패');
      }

      setPtaResults(prev => prev.filter(result => result.id !== id));
    } catch (err) {
      console.error('PTA 결과 삭제 오류:', err);
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchPtaResults();
  }, [userId]);

  return {
    ptaResults,
    loading,
    error,
    fetchPtaResults,
    addPtaResult,
    updatePtaResult,
    deletePtaResult
  };
}