"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Headphones,
  Volume2,
} from "lucide-react";

export default function PitchExercise({ exercise, onComplete }) {
  const [phase, setPhase] = useState("instruction"); // instruction, demo, practice, complete
  const [currentNote, setCurrentNote] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [gameType, setGameType] = useState("pitch_recognition");
  const [melody, setMelody] = useState([]);
  const [userMelody, setUserMelody] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);

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

  const noteRange = config.note_range || ["C4", "C5"];
  const difficulty = config.difficulty || "basic";

  // 음표 주파수 매핑
  const noteFrequencies = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.0,
    A4: 440.0,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    F5: 698.46,
    G5: 783.99,
  };

  const noteNames = Object.keys(noteFrequencies);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }

    // 운동 타입에 따라 게임 설정
    if (exercise.exercise_type === "pitch_identify") {
      setGameType("pitch_recognition");
      setTotalQuestions(10);
    } else if (exercise.exercise_type === "melody_mimic") {
      setGameType("melody_repeat");
      setTotalQuestions(5);
    } else if (exercise.exercise_type === "interval_recognition") {
      setGameType("interval_training");
      setTotalQuestions(8);
    }

    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
    };
  }, [exercise.exercise_type]);

  // 음표 재생
  const playNote = (frequency, duration = 1000) => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContextRef.current.currentTime + duration / 1000,
    );

    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
  };

  // 멜로디 재생
  const playMelody = (notes, noteDuration = 500) => {
    setIsPlaying(true);
    notes.forEach((note, index) => {
      setTimeout(
        () => {
          const frequency = noteFrequencies[note];
          if (frequency) {
            playNote(frequency, noteDuration);
          }
          if (index === notes.length - 1) {
            setTimeout(() => setIsPlaying(false), noteDuration);
          }
        },
        index * (noteDuration + 100),
      );
    });
  };

  // 랜덤 음표 선택
  const getRandomNote = () => {
    const startIndex = noteNames.indexOf(noteRange[0]);
    const endIndex = noteNames.indexOf(noteRange[1]);
    const availableNotes = noteNames.slice(startIndex, endIndex + 1);
    return availableNotes[Math.floor(Math.random() * availableNotes.length)];
  };

  // 새 문제 생성
  const generateNewQuestion = () => {
    if (gameType === "pitch_recognition") {
      const note = getRandomNote();
      setCurrentNote(note);
      playNote(noteFrequencies[note]);
    } else if (gameType === "melody_repeat") {
      const melodyLength = difficulty === "basic" ? 3 : 4;
      const newMelody = Array.from({ length: melodyLength }, () =>
        getRandomNote(),
      );
      setMelody(newMelody);
      setUserMelody([]);
      setTimeout(() => playMelody(newMelody), 500);
    } else if (gameType === "interval_training") {
      const note1 = getRandomNote();
      const note1Index = noteNames.indexOf(note1);
      const interval = Math.floor(Math.random() * 4) + 2; // 2-5 semitones
      const note2Index = Math.min(note1Index + interval, noteNames.length - 1);
      const note2 = noteNames[note2Index];

      setMelody([note1, note2]);
      setTimeout(() => {
        playNote(noteFrequencies[note1], 800);
        setTimeout(() => playNote(noteFrequencies[note2], 800), 900);
      }, 500);
    }
  };

  // 연습 시작
  const startPractice = () => {
    setPhase("practice");
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setUserAnswers([]);
    generateNewQuestion();
  };

  // 답안 선택 (음정 인식)
  const selectAnswer = (selectedNote) => {
    const isCorrect = selectedNote === currentNote;
    const newAnswers = [
      ...userAnswers,
      {
        question: currentQuestion + 1,
        selected: selectedNote,
        correct: currentNote,
        isCorrect,
      },
    ];
    setUserAnswers(newAnswers);

    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1);
    }

    // 다음 문제 또는 완료
    if (currentQuestion + 1 < totalQuestions) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeout(() => generateNewQuestion(), 1000);
    } else {
      setTimeout(() => completeExercise(), 1000);
    }
  };

  // 멜로디 노트 선택
  const selectMelodyNote = (note) => {
    if (userMelody.length < melody.length) {
      const newUserMelody = [...userMelody, note];
      setUserMelody(newUserMelody);
      playNote(noteFrequencies[note], 300);

      // 멜로디 완성 시 확인
      if (newUserMelody.length === melody.length) {
        setTimeout(() => {
          const isCorrect = melody.every(
            (note, index) => note === newUserMelody[index],
          );
          const newAnswers = [
            ...userAnswers,
            {
              question: currentQuestion + 1,
              melody: melody,
              userMelody: newUserMelody,
              isCorrect,
            },
          ];
          setUserAnswers(newAnswers);

          if (isCorrect) {
            setCorrectAnswers((prev) => prev + 1);
          }

          if (currentQuestion + 1 < totalQuestions) {
            setCurrentQuestion((prev) => prev + 1);
            setTimeout(() => generateNewQuestion(), 1500);
          } else {
            setTimeout(() => completeExercise(), 1500);
          }
        }, 500);
      }
    }
  };

  // 운동 완료
  const completeExercise = () => {
    const accuracy = (correctAnswers / totalQuestions) * 100;
    const score = Math.round(
      accuracy * 0.8 + (userAnswers.length / totalQuestions) * 20,
    );

    setPhase("complete");

    setTimeout(() => {
      onComplete({
        score: score,
        accuracy: Math.round(accuracy),
        reactionTime: null,
        attempts: 1,
        detailData: {
          exerciseType: exercise.exercise_type,
          gameType: gameType,
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          userAnswers: userAnswers,
          difficulty: difficulty,
        },
      });
    }, 2000);
  };

  // 데모 재생
  const playDemo = () => {
    if (gameType === "pitch_recognition") {
      const demoNotes = ["C4", "E4", "G4", "C5"];
      demoNotes.forEach((note, index) => {
        setTimeout(() => {
          playNote(noteFrequencies[note], 800);
        }, index * 1000);
      });
    } else if (gameType === "melody_repeat") {
      const demoMelody = ["C4", "D4", "E4"];
      setTimeout(() => playMelody(demoMelody), 500);
    }
  };

  const resetExercise = () => {
    setPhase("instruction");
    setCurrentQuestion(0);
    setCorrectAnswers(0);
    setUserAnswers([]);
    setCurrentNote(null);
    setMelody([]);
    setUserMelody([]);
  };

  const renderPitchRecognition = () => {
    const startIndex = noteNames.indexOf(noteRange[0]);
    const endIndex = noteNames.indexOf(noteRange[1]);
    const availableNotes = noteNames.slice(startIndex, endIndex + 1);

    return (
      <div className="text-center space-y-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2">
            문제 {currentQuestion + 1}/{totalQuestions}
          </h4>
          <p className="text-purple-700">방금 들린 음표는 무엇인가요?</p>
          <button
            onClick={() =>
              currentNote && playNote(noteFrequencies[currentNote])
            }
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>다시 듣기</span>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableNotes.map((note) => (
            <button
              key={note}
              onClick={() => selectAnswer(note)}
              className="p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-purple-800">{note}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playNote(noteFrequencies[note], 500);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-800 mt-1"
                >
                  ♪ 미리듣기
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMelodyRepeat = () => {
    const startIndex = noteNames.indexOf(noteRange[0]);
    const endIndex = noteNames.indexOf(noteRange[1]);
    const availableNotes = noteNames.slice(startIndex, endIndex + 1);

    return (
      <div className="text-center space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2">
            문제 {currentQuestion + 1}/{totalQuestions}
          </h4>
          <p className="text-green-700 mb-3">
            들린 멜로디를 순서대로 선택하세요
          </p>

          <div className="flex justify-center space-x-2 mb-3">
            <button
              onClick={() => melody.length > 0 && playMelody(melody)}
              disabled={isPlaying}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>멜로디 다시 듣기</span>
              </div>
            </button>
          </div>

          <div className="text-sm text-green-600">
            선택한 음표: {userMelody.join(" → ")} ({userMelody.length}/
            {melody.length})
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableNotes.map((note) => (
            <button
              key={note}
              onClick={() => selectMelodyNote(note)}
              disabled={userMelody.length >= melody.length}
              className="p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-green-800">{note}</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playNote(noteFrequencies[note], 500);
                  }}
                  className="text-xs text-green-600 hover:text-green-800 mt-1"
                >
                  ♪ 미리듣기
                </button>
              </div>
            </button>
          ))}
        </div>

        {userMelody.length < melody.length && (
          <button
            onClick={() => setUserMelody([])}
            className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-1 justify-center">
              <RotateCcw className="w-4 h-4" />
              <span>다시 선택</span>
            </div>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 운동 정보 */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Headphones className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {exercise.display_name}
        </h3>
        <p className="text-gray-600">{exercise.description}</p>

        <div className="flex justify-center space-x-6 mt-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500">난이도</p>
            <p className="font-bold text-purple-600">{difficulty}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">문제 수</p>
            <p className="font-bold text-purple-600">{totalQuestions}개</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">음역대</p>
            <p className="font-bold text-purple-600">
              {noteRange[0]} - {noteRange[1]}
            </p>
          </div>
        </div>
      </div>

      {/* 단계별 컨텐츠 */}
      {phase === "instruction" && (
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-lg p-6">
            <h4 className="font-semibold text-purple-900 mb-3">연습 방법</h4>
            <ol className="text-left text-sm text-purple-800 space-y-2">
              {gameType === "pitch_recognition" && (
                <>
                  <li>1. 재생되는 음표를 주의 깊게 들으세요</li>
                  <li>2. 들린 음표와 같다고 생각하는 버튼을 선택하세요</li>
                  <li>3. 확실하지 않다면 '미리듣기'로 비교해보세요</li>
                  <li>4. 총 {totalQuestions}개 문제를 풀어보세요</li>
                </>
              )}
              {gameType === "melody_repeat" && (
                <>
                  <li>1. 재생되는 멜로디를 주의 깊게 들으세요</li>
                  <li>2. 들린 순서대로 음표를 선택하세요</li>
                  <li>3. 틀렸다면 '다시 선택'으로 초기화할 수 있습니다</li>
                  <li>4. 총 {totalQuestions}개 멜로디를 따라해보세요</li>
                </>
              )}
            </ol>
          </div>

          <div className="space-y-4">
            <button
              onClick={playDemo}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
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

      {phase === "practice" && (
        <div className="space-y-6">
          {/* 진행률 */}
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">진행률</span>
              <span className="text-sm text-gray-600">
                {currentQuestion + 1}/{totalQuestions}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
                }}
              ></div>
            </div>
            <div className="mt-2 text-center text-sm text-gray-600">
              정답: {correctAnswers}개 / 틀린답:{" "}
              {currentQuestion + 1 - correctAnswers - 1}개
            </div>
          </div>

          {/* 문제 영역 */}
          {gameType === "pitch_recognition" && renderPitchRecognition()}
          {gameType === "melody_repeat" && renderMelodyRepeat()}
        </div>
      )}

      {phase === "complete" && (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-900 mb-2">운동 완료!</h4>
          <p className="text-gray-600 mb-4">
            음정 훈련을 성공적으로 마쳤습니다.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">정답률</p>
                <p className="text-lg font-bold text-green-600">
                  {Math.round((correctAnswers / totalQuestions) * 100)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">정답 수</p>
                <p className="text-lg font-bold text-blue-600">
                  {correctAnswers}/{totalQuestions}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            결과를 저장하고 다음 운동으로 이동합니다...
          </p>
        </div>
      )}
    </div>
  );
}
