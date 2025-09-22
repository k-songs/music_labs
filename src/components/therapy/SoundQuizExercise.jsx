"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Volume2,
  Zap,
  Clock,
  Trophy,
} from "lucide-react";

export default function SoundQuizExercise({ exercise, onComplete }) {
  const [phase, setPhase] = useState("instruction"); // instruction, practice, complete
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentSound, setCurrentSound] = useState(null);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(10);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  const audioContextRef = useRef(null);
  const timerRef = useRef(null);

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

  const sounds = config.sounds || ["sparrow", "crow", "pigeon"];
  const quizType = config.quiz_type || "multiple_choice";
  const timeLimit = config.time_limit || 10;

  // 소리 데이터 (실제로는 오디오 파일이나 웹 오디오로 구현)
  const soundDatabase = {
    // 새소리
    sparrow: {
      name: "참새",
      category: "새소리",
      frequency: [3000, 6000],
      pattern: "chirp",
    },
    crow: {
      name: "까마귀",
      category: "새소리",
      frequency: [500, 2000],
      pattern: "caw",
    },
    pigeon: {
      name: "비둘기",
      category: "새소리",
      frequency: [200, 800],
      pattern: "coo",
    },
    robin: {
      name: "개똥지빠귀",
      category: "새소리",
      frequency: [2000, 8000],
      pattern: "warble",
    },

    // 자연음
    water_flow: {
      name: "물 흐르는 소리",
      category: "자연음",
      frequency: [100, 4000],
      pattern: "flowing",
    },
    wind: {
      name: "바람 소리",
      category: "자연음",
      frequency: [50, 2000],
      pattern: "whoosh",
    },
    rain: {
      name: "비 소리",
      category: "자연음",
      frequency: [200, 8000],
      pattern: "pattering",
    },
    thunder: {
      name: "천둥 소리",
      category: "자연음",
      frequency: [20, 200],
      pattern: "rumble",
    },

    // 일상음
    doorbell: {
      name: "초인종",
      category: "일상음",
      frequency: [800, 2000],
      pattern: "ding-dong",
    },
    phone_ring: {
      name: "전화벨",
      category: "일상음",
      frequency: [900, 1800],
      pattern: "ring",
    },
    car_horn: {
      name: "자동차 경적",
      category: "일상음",
      frequency: [200, 500],
      pattern: "honk",
    },
    footsteps: {
      name: "발소리",
      category: "일상음",
      frequency: [100, 1000],
      pattern: "step",
    },
  };

  const totalQuestions = Array.isArray(sounds) ? 15 : 12;

  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // 소리 합성 및 재생
  const playSound = (soundKey, duration = 2000) => {
    if (!audioContextRef.current || !soundDatabase[soundKey]) return;

    setIsPlaying(true);
    const soundData = soundDatabase[soundKey];
    const [minFreq, maxFreq] = soundData.frequency;

    // 소리 패턴에 따른 합성
    if (soundData.pattern === "chirp") {
      // 새소리 - 짧은 주파수 변조
      playChirpSound(minFreq, maxFreq, duration);
    } else if (soundData.pattern === "caw") {
      // 까마귀 - 거친 톤
      playRoughSound(minFreq, maxFreq, duration);
    } else if (soundData.pattern === "flowing") {
      // 물소리 - 화이트 노이즈 + 필터
      playFlowingSound(minFreq, maxFreq, duration);
    } else if (soundData.pattern === "whoosh") {
      // 바람소리 - 노이즈 + 주파수 변조
      playWindSound(minFreq, maxFreq, duration);
    } else if (soundData.pattern === "ring") {
      // 전화벨 - 반복적인 톤
      playRingingSound(minFreq, maxFreq, duration);
    } else {
      // 기본 톤
      playBasicTone(minFreq, duration);
    }

    setTimeout(() => setIsPlaying(false), duration);
  };

  const playChirpSound = (minFreq, maxFreq, duration) => {
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      minFreq,
      audioContextRef.current.currentTime,
    );

    // 주파수 변조 (짹짹 효과)
    for (let i = 0; i < 5; i++) {
      const time = audioContextRef.current.currentTime + i * 0.2;
      oscillator.frequency.setValueAtTime(
        minFreq + Math.random() * (maxFreq - minFreq),
        time,
      );
    }

    gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + duration / 1000,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
  };

  const playRoughSound = (minFreq, maxFreq, duration) => {
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.type = "sawtooth"; // 거친 톤
    oscillator.frequency.value = minFreq;

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + duration / 1000,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
  };

  const playFlowingSound = (minFreq, maxFreq, duration) => {
    // 노이즈 생성 (물소리 시뮬레이션)
    const bufferSize = (audioContextRef.current.sampleRate * duration) / 1000;
    const buffer = audioContextRef.current.createBuffer(
      1,
      bufferSize,
      audioContextRef.current.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() - 0.5) * 0.1;
    }

    const source = audioContextRef.current.createBufferSource();
    const filter = audioContextRef.current.createBiquadFilter();
    const gainNode = audioContextRef.current.createGain();

    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = maxFreq;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    gainNode.gain.value = 0.2;
    source.start(audioContextRef.current.currentTime);
  };

  const playWindSound = (minFreq, maxFreq, duration) => {
    // 바람소리 - 노이즈 + 주파수 변조
    const bufferSize = (audioContextRef.current.sampleRate * duration) / 1000;
    const buffer = audioContextRef.current.createBuffer(
      1,
      bufferSize,
      audioContextRef.current.sampleRate,
    );
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() - 0.5) * 0.15;
    }

    const source = audioContextRef.current.createBufferSource();
    const filter = audioContextRef.current.createBiquadFilter();
    const gainNode = audioContextRef.current.createGain();

    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = (minFreq + maxFreq) / 2;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    gainNode.gain.value = 0.3;
    source.start(audioContextRef.current.currentTime);
  };

  const playRingingSound = (minFreq, maxFreq, duration) => {
    // 전화벨 - 반복적인 톤
    const pattern = [minFreq, maxFreq, minFreq, maxFreq];
    pattern.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        oscillator.frequency.value = freq;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContextRef.current.currentTime + 0.3,
        );

        oscillator.start(audioContextRef.current.currentTime);
        oscillator.stop(audioContextRef.current.currentTime + 0.3);
      }, index * 400);
    });
  };

  const playBasicTone = (frequency, duration) => {
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + duration / 1000,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
  };

  // 새 문제 생성
  const generateNewQuestion = () => {
    let availableSounds;

    if (Array.isArray(sounds)) {
      availableSounds = sounds;
    } else if (sounds === "mixed_all") {
      availableSounds = Object.keys(soundDatabase);
    } else {
      availableSounds = Object.keys(soundDatabase).filter((key) =>
        soundDatabase[key].category.includes(sounds.replace("_sounds", "")),
      );
    }

    const correctSound =
      availableSounds[Math.floor(Math.random() * availableSounds.length)];
    setCurrentSound(correctSound);

    // 선택지 생성
    const wrongOptions = availableSounds
      .filter((sound) => sound !== correctSound)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const allOptions = [correctSound, ...wrongOptions]
      .sort(() => 0.5 - Math.random())
      .map((sound) => ({
        key: sound,
        name: soundDatabase[sound].name,
        category: soundDatabase[sound].category,
      }));

    setOptions(allOptions);
    setTimeLeft(timeLimit);

    // 소리 재생
    setTimeout(() => playSound(correctSound), 500);
  };

  // 타이머 시작
  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // 시간 초과
          handleAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 연습 시작
  const startPractice = () => {
    setPhase("practice");
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setUserAnswers([]);
    setStreak(0);
    setMaxStreak(0);
    setScore(0);
    generateNewQuestion();
    setTimeout(() => startTimer(), 1000);
  };

  // 답안 선택
  const handleAnswer = (selectedSound) => {
    clearInterval(timerRef.current);

    const isCorrect = selectedSound === currentSound;
    const timeTaken = timeLimit - timeLeft;
    const questionScore = isCorrect ? Math.max(100 - timeTaken * 5, 50) : 0;

    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);

    const newAnswer = {
      question: currentQuestion + 1,
      correctSound: currentSound,
      selectedSound: selectedSound,
      isCorrect: isCorrect,
      timeTaken: timeTaken,
      score: questionScore,
    };

    setUserAnswers((prev) => [...prev, newAnswer]);
    setScore((prev) => prev + questionScore);

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
      setStreak((prev) => {
        const newStreak = prev + 1;
        setMaxStreak((max) => Math.max(max, newStreak));
        return newStreak;
      });
    } else {
      setStreak(0);
    }

    // 다음 문제 또는 완료
    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestion + 1 < totalQuestions) {
        setCurrentQuestion((prev) => prev + 1);
        generateNewQuestion();
        setTimeout(() => startTimer(), 1000);
      } else {
        completeExercise();
      }
    }, 2000);
  };

  // 운동 완료
  const completeExercise = () => {
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const finalScore = Math.round((score / (totalQuestions * 100)) * 100);

    setPhase("complete");

    setTimeout(() => {
      onComplete({
        score: finalScore,
        accuracy: Math.round(accuracy),
        reactionTime:
          userAnswers.reduce((sum, a) => sum + a.timeTaken, 0) /
          userAnswers.length,
        attempts: 1,
        detailData: {
          exerciseType: exercise.exercise_type,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          maxStreak: maxStreak,
          averageTime:
            userAnswers.reduce((sum, a) => sum + a.timeTaken, 0) /
            userAnswers.length,
          userAnswers: userAnswers,
          sounds: sounds,
        },
      });
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 운동 정보 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Volume2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {exercise.display_name}
        </h3>
        <p className="text-gray-600">{exercise.description}</p>

        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500">퀴즈 타입</p>
            <p className="font-bold text-green-600">
              {quizType.replace("_", " ")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">문제 수</p>
            <p className="font-bold text-green-600">{totalQuestions}개</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">제한 시간</p>
            <p className="font-bold text-green-600">{timeLimit}초</p>
          </div>
        </div>
      </div>

      {/* 단계별 컨텐츠 */}
      {phase === "instruction" && (
        <div className="text-center space-y-6">
          <div className="bg-green-50 rounded-lg p-6">
            <h4 className="font-semibold text-green-900 mb-3">게임 방법</h4>
            <ol className="text-left text-sm text-green-800 space-y-2">
              <li>1. 다양한 소리를 들으며 정답을 맞추세요</li>
              <li>2. 각 문제마다 {timeLimit}초의 제한 시간이 있습니다</li>
              <li>3. 연속으로 맞추면 스트릭 보너스가 있어요!</li>
              <li>4. 빠르게 정답을 맞출수록 높은 점수를 얻습니다</li>
              <li>5. 총 {totalQuestions}개 문제에 도전하세요</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h5 className="font-medium text-blue-900 mb-1">빠른 응답</h5>
              <p className="text-xs text-blue-700">빨리 답할수록 높은 점수!</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h5 className="font-medium text-purple-900 mb-1">연속 정답</h5>
              <p className="text-xs text-purple-700">스트릭으로 보너스 획득!</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h5 className="font-medium text-orange-900 mb-1">제한 시간</h5>
              <p className="text-xs text-orange-700">시간 내에 정답 선택!</p>
            </div>
          </div>

          <button
            onClick={startPractice}
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
          >
            <div className="flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>퀴즈 시작하기</span>
            </div>
          </button>
        </div>
      )}

      {phase === "practice" && (
        <div className="space-y-6">
          {/* 게임 상태 */}
          <div className="bg-white rounded-lg p-4 border shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">문제</p>
                <p className="text-lg font-bold text-blue-600">
                  {currentQuestion + 1}/{totalQuestions}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">점수</p>
                <p className="text-lg font-bold text-green-600">{score}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">연속정답</p>
                <p className="text-lg font-bold text-purple-600">{streak}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">남은시간</p>
                <p
                  className={`text-lg font-bold ${timeLeft <= 3 ? "text-red-600" : "text-orange-600"}`}
                >
                  {timeLeft}초
                </p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* 문제 영역 */}
          {!showFeedback ? (
            <div className="bg-white rounded-lg p-6 border shadow-sm">
              <div className="text-center mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  이 소리는 무엇인가요?
                </h4>

                <button
                  onClick={() => currentSound && playSound(currentSound)}
                  disabled={isPlaying}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-6"
                >
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5" />
                    <span>{isPlaying ? "재생중..." : "소리 다시 듣기"}</span>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => (
                  <button
                    key={option.key}
                    onClick={() => handleAnswer(option.key)}
                    className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {option.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {option.category}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* 피드백 화면 */
            <div className="bg-white rounded-lg p-6 border shadow-sm text-center">
              {lastAnswerCorrect ? (
                <div>
                  <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-green-900 mb-2">
                    정답입니다! 🎉
                  </h4>
                  <p className="text-green-700 mb-2">
                    {soundDatabase[currentSound]?.name}을(를) 맞추셨네요!
                  </p>
                  {streak > 1 && (
                    <div className="bg-purple-100 rounded-lg p-3 mb-4">
                      <p className="text-purple-800 font-medium">
                        🔥 {streak}연속 정답! 대단해요!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">❌</span>
                  </div>
                  <h4 className="text-xl font-bold text-red-900 mb-2">
                    아쉬워요!
                  </h4>
                  <p className="text-red-700 mb-2">
                    정답은 <strong>{soundDatabase[currentSound]?.name}</strong>
                    이었습니다.
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-500">다음 문제로 이동합니다...</p>
            </div>
          )}
        </div>
      )}

      {phase === "complete" && (
        <div className="text-center py-8">
          <Trophy className="w-20 h-20 text-yellow-600 mx-auto mb-6" />
          <h4 className="text-2xl font-bold text-gray-900 mb-4">
            퀴즈 완료! 🎊
          </h4>
          <p className="text-gray-600 mb-6">
            소리 인식 퀴즈를 모두 완료했습니다!
          </p>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">최종 점수</p>
                <p className="text-2xl font-bold text-green-600">{score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">정답률</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((correctAnswers / totalQuestions) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">최대 연속정답</p>
                <p className="text-2xl font-bold text-purple-600">
                  {maxStreak}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">평균 응답시간</p>
                <p className="text-2xl font-bold text-orange-600">
                  {userAnswers.length > 0
                    ? Math.round(
                        userAnswers.reduce((sum, a) => sum + a.timeTaken, 0) /
                          userAnswers.length,
                      )
                    : 0}
                  초
                </p>
              </div>
            </div>
          </div>

          {/* 성과 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">
              {correctAnswers === totalQuestions
                ? "🏆 완벽해요! 모든 문제를 맞추셨네요!"
                : correctAnswers >= totalQuestions * 0.8
                  ? "🌟 훌륭해요! 대부분의 문제를 맞추셨어요!"
                  : correctAnswers >= totalQuestions * 0.6
                    ? "👍 좋아요! 절반 이상 맞추셨네요!"
                    : "💪 연습하면 더 잘할 수 있어요!"}
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
