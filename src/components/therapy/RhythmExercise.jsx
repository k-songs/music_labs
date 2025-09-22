"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Music,
  Timer,
} from "lucide-react";

export default function RhythmExercise({ exercise, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [userTaps, setUserTaps] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [showPattern, setShowPattern] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [phase, setPhase] = useState("instruction"); // instruction, demo, practice, complete

  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const metronomeRef = useRef(null);

  // Safely parse config - it might already be an object or a JSON string
  const config = (() => {
    try {
      if (typeof exercise.config === "string") {
        return JSON.parse(exercise.config);
      } else if (
        typeof exercise.config === "object" &&
        exercise.config !== null
      ) {
        return exercise.config;
      } else {
        return {};
      }
    } catch (error) {
      console.warn("Failed to parse exercise config:", error);
      return {};
    }
  })();

  const bpm = config.bpm || 80;
  const duration = config.duration || 30;
  const pattern = config.pattern || "simple_4_4";

  // 박자 패턴 정의
  const beatPatterns = {
    simple_4_4: [1, 0, 1, 0], // 강약강약
    complex: [1, 0, 1, 1, 0, 1, 0, 0], // 복합 패턴
    waltz: [1, 0, 0], // 왈츠 패턴
  };

  const currentPattern = beatPatterns[pattern] || beatPatterns["simple_4_4"];
  const beatInterval = 60000 / bpm; // milliseconds per beat

  useEffect(() => {
    // Web Audio API 초기화
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (metronomeRef.current) {
        clearTimeout(metronomeRef.current);
      }
    };
  }, []);

  // 메트로놈 소리 생성
  const playBeat = (isStrong = false) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = isStrong ? 800 : 400; // 강박/약박 주파수
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + 0.1,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  // 클릭/탭 소리 생성
  const playTapSound = () => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = 600;
    oscillator.type = "square";

    gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + 0.05,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.05);
  };

  // 데모 재생
  const startDemo = () => {
    setPhase("demo");
    setCurrentBeat(0);
    setIsPlaying(true);
    setStartTime(Date.now());

    let beatCount = 0;
    intervalRef.current = setInterval(() => {
      const patternIndex = beatCount % currentPattern.length;
      const isStrong = currentPattern[patternIndex] === 1;

      playBeat(isStrong);
      setCurrentBeat(beatCount);
      beatCount++;

      // 2패턴 반복 후 종료
      if (beatCount >= currentPattern.length * 2) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setPhase("instruction");
      }
    }, beatInterval);
  };

  // 연습 시작
  const startPractice = () => {
    setPhase("practice");
    setCurrentBeat(0);
    setUserTaps([]);
    setIsPlaying(true);
    setStartTime(Date.now());

    // 3초 카운트다운
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setCountdown(null);
          startMetronome();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 메트로놈 시작
  const startMetronome = () => {
    let beatCount = 0;
    const practiceBeats = Math.floor((duration * 1000) / beatInterval);

    intervalRef.current = setInterval(() => {
      const patternIndex = beatCount % currentPattern.length;
      const isStrong = currentPattern[patternIndex] === 1;

      playBeat(isStrong);
      setCurrentBeat(beatCount);
      beatCount++;

      if (beatCount >= practiceBeats) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        calculateScore();
      }
    }, beatInterval);
  };

  // 사용자 탭 처리
  const handleTap = () => {
    if (phase !== "practice" || !isPlaying) return;

    playTapSound();
    const tapTime = Date.now() - startTime;
    setUserTaps((prev) => [...prev, tapTime]);
  };

  // 점수 계산
  const calculateScore = () => {
    const expectedTaps = Math.floor((duration * 1000) / beatInterval);
    const tolerance = beatInterval * 0.3; // 30% 허용 오차

    let correctTaps = 0;
    let totalScore = 0;

    // 각 사용자 탭이 예상 박자와 얼마나 가까운지 계산
    userTaps.forEach((tapTime) => {
      for (let i = 0; i < expectedTaps; i++) {
        const expectedTime = i * beatInterval;
        const timeDiff = Math.abs(tapTime - expectedTime);

        if (timeDiff <= tolerance) {
          correctTaps++;
          const accuracy = Math.max(0, 1 - timeDiff / tolerance);
          totalScore += accuracy * 100;
          break;
        }
      }
    });

    const accuracy = expectedTaps > 0 ? (correctTaps / expectedTaps) * 100 : 0;
    const averageScore = userTaps.length > 0 ? totalScore / userTaps.length : 0;

    setPhase("complete");

    setTimeout(() => {
      onComplete({
        score: Math.round(averageScore),
        accuracy: Math.round(accuracy),
        reactionTime: null,
        attempts: 1,
        detailData: {
          exerciseType: exercise.exercise_type,
          bpm: bpm,
          pattern: pattern,
          duration: duration,
          expectedTaps: expectedTaps,
          userTaps: userTaps.length,
          correctTaps: correctTaps,
          timing_accuracy: accuracy,
        },
      });
    }, 2000);
  };

  const resetExercise = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPlaying(false);
    setCurrentBeat(0);
    setUserTaps([]);
    setStartTime(null);
    setCountdown(null);
    setPhase("instruction");
  };

  const renderPatternVisual = () => {
    return (
      <div className="flex justify-center space-x-2 mb-6">
        {currentPattern.map((beat, index) => (
          <div
            key={index}
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
              beat === 1
                ? "bg-blue-600 border-blue-600 text-white font-bold"
                : "bg-gray-200 border-gray-300 text-gray-600"
            } ${
              isPlaying && currentBeat % currentPattern.length === index
                ? "ring-4 ring-blue-300 scale-110"
                : ""
            }`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* 운동 정보 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {exercise.display_name}
        </h3>
        <p className="text-gray-600">{exercise.description}</p>

        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500">BPM</p>
            <p className="font-bold text-blue-600">{bpm}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">패턴</p>
            <p className="font-bold text-blue-600">
              {pattern.replace("_", " ")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">시간</p>
            <p className="font-bold text-blue-600">{duration}초</p>
          </div>
        </div>
      </div>

      {/* 박자 패턴 시각화 */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="text-center font-semibold text-gray-900 mb-4">
          박자 패턴
        </h4>
        {renderPatternVisual()}
        <p className="text-center text-sm text-gray-600">
          파란 원: 강박 (큰 소리), 회색 원: 약박 (작은 소리)
        </p>
      </div>

      {/* 단계별 컨텐츠 */}
      {phase === "instruction" && (
        <div className="text-center space-y-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-3">연습 방법</h4>
            <ol className="text-left text-sm text-blue-800 space-y-2">
              <li>1. 먼저 데모를 들으며 박자 패턴을 익히세요</li>
              <li>2. 메트로놈 소리에 맞춰 화면을 터치하세요</li>
              <li>3. 강박(파란 원)에서는 더 정확히 맞추세요</li>
              <li>4. {duration}초 동안 일정한 박자를 유지하세요</li>
            </ol>
          </div>

          <div className="space-y-4">
            <button
              onClick={startDemo}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <div className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>데모 듣기</span>
              </div>
            </button>

            <button
              onClick={startPractice}
              className="block px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg mx-auto"
            >
              연습 시작하기
            </button>
          </div>
        </div>
      )}

      {phase === "demo" && (
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 rounded-full">
              <Play className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-medium">데모 재생 중...</span>
            </div>
          </div>
          <p className="text-gray-600">박자 패턴을 잘 들어보세요</p>
        </div>
      )}

      {phase === "practice" && (
        <div className="text-center space-y-6">
          {countdown !== null ? (
            <div className="py-12">
              <div className="text-6xl font-bold text-blue-600 mb-4">
                {countdown}
              </div>
              <p className="text-gray-600">준비하세요...</p>
            </div>
          ) : (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <Timer className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">연습 중</span>
                </div>
                <p className="text-sm text-green-700">
                  박자에 맞춰 화면을 터치하세요! 탭한 횟수: {userTaps.length}
                </p>
              </div>

              <button
                onClick={handleTap}
                className="w-48 h-48 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full text-xl font-bold transition-all duration-100 transform active:scale-95 mx-auto block"
              >
                TAP!
              </button>

              <button
                onClick={resetExercise}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>다시 시작</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 mb-2">운동 완료!</h4>
          <p className="text-gray-600 mb-4">
            박자 훈련을 성공적으로 마쳤습니다.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              탭한 횟수: {userTaps.length}회
            </p>
          </div>

          <p className="text-sm text-gray-500">
            결과를 저장하고 다음 운동으로 이동합니다...
          </p>
        </div>
      )}
    </div>
  );
}
