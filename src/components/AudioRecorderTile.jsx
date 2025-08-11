import React, { forwardRef, useImperativeHandle, useRef, useState, useMemo } from 'react';

const API_BASE_URL = "http://127.0.0.1:8000"; // 로컬 백엔드 주소

const AudioRecorderTile = forwardRef((props, ref) => {
  // 녹음/클릭 관리
  const mediaRecorderRef = useRef(null);
  const settingsRef = useRef(null); // 이번 세션(녹음 1회)의 확정 세팅
  const clickSourcesRef = useRef([]);
  const recordedChunks = useRef([]);
  const timeoutRef = useRef(null);

  // UI 상태
  const [recording, setRecording] = useState(false);
  const [countNumber, setCountNumber] = useState(null);
  const [readyText, setReadyText] = useState(null);
  const [statusText, setStatusText] = useState("");

  // 템포/미터 선택 UI
  const [tempoMode, setTempoMode] = useState("slow"); // 'slow' | 'very_slow' | 'advanced'
  const [customBpm, setCustomBpm] = useState(60);
  const [meter, setMeter] = useState("4/4"); // 필요 시 3/4 등 추가

  // 파생값(BPM)
  const uiBpm = useMemo(() => {
    if (tempoMode === "slow") return 60;
    if (tempoMode === "very_slow") return 40;
    const v = Number(customBpm);
    if (!Number.isFinite(v)) return 60;
    return Math.min(240, Math.max(30, Math.round(v)));
  }, [tempoMode, customBpm]);

  // 공용 유틸
  const getBeatsPerMeasure = (m) => {
    const n = parseInt(m.split("/")[0], 10);
    return Number.isFinite(n) ? n : 4;
  };

  // 외부 제어 노출
  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    cancelRecording,
  }));

  // 오디오 버퍼 재생
  const playBufferedSound = async (context, url, scheduledTime) => {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    const source = context.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(context.destination);
    source.start(scheduledTime);
    clickSourcesRef.current.push(source);
    return new Promise((resolve) => {
      source.onended = resolve;
    });
  };

  // 카운트인 + 클릭 (settingsRef.current의 확정값 사용)
  const playCountAndClick = async () => {
    const bpm = settingsRef.current.bpm;
    const meter = settingsRef.current.meter;
    const interval = 60 / bpm;
    const beatsPerMeasure = getBeatsPerMeasure(meter);

    const countNames = ["one", "two", "three", "four", "five", "six", "seven"];
    const hypeMessages = ["Let's groove!", "Let's go!", "Here we go!", "Time to hit!", "Drum on!"];
    const context = new (window.AudioContext || window.webkitAudioContext)();

    setReadyText("Are you ready?");
    setTimeout(() => setReadyText(hypeMessages[Math.floor(Math.random() * hypeMessages.length)]), 1000);
    setTimeout(() => setReadyText(null), 3000);

    // 살짝 선행 버퍼 후 시작
    const t0 = context.currentTime + 0.2;

    // 카운트인은 항상 1마디
    const countInBars = 1;
    const countInBeats = beatsPerMeasure * countInBars;

    // 카운트인(보이스 + 클릭)
    for (let i = 0; i < countInBeats; i++) {
      const scheduledTime = t0 + i * interval;
      const name = countNames[i] || "one";

      // 숫자 애니메이션
      setTimeout(() => {
        setCountNumber(i + 1);
        if (i === countInBeats - 1) {
          setTimeout(() => setCountNumber(null), interval * 1000 * 0.8);
        }
      }, Math.max(0, (scheduledTime - context.currentTime) * 1000));

      // 보이스 카운트
      playBufferedSound(context, `/audio/${name}.wav`, scheduledTime);

      // 클릭 (첫박 high)
      const isFirstBeat = i % beatsPerMeasure === 0;
      playBufferedSound(context, isFirstBeat ? "/audio/click_high.wav" : "/audio/click.wav", scheduledTime);
    }

    // 카운트인 후 지속 클릭(녹음 보조)
    const recordSeconds = 60; // 필요 시 조정
    const totalBeats = Math.floor(recordSeconds / interval);
    const clicksStart = t0 + countInBeats * interval;

    for (let i = 0; i < totalBeats; i++) {
      const scheduledTime = clicksStart + i * interval;
      const isFirstBeat = i % beatsPerMeasure === 0;
      playBufferedSound(context, isFirstBeat ? "/audio/click_high.wav" : "/audio/click.wav", scheduledTime);
    }

    // 전체 스케줄 대기
    await new Promise((res) =>
      setTimeout(res, Math.ceil((countInBeats * interval + recordSeconds + 0.5) * 1000))
    );
  };

  // 녹음 시작(부모가 settings 넣어줘도 호환)
  async function startRecording(optionalSettings) {
    if (recording) return;

    // 이번 세션 확정 bpm/meter 계산
    const effectiveBpm = Number(
      optionalSettings?.bpm ?? uiBpm
    );
    const effectiveMeter = optionalSettings?.meter ?? meter;
    const beatsPerMeasure = getBeatsPerMeasure(effectiveMeter);

    // startOffsetSec = 1마디 길이
    const startOffsetSec = (beatsPerMeasure * 60) / effectiveBpm;

    // 이번 세션 전달 설정
    settingsRef.current = {
      bpm: effectiveBpm,
      meter: effectiveMeter,
      slowMode: false,              // 백엔드 50BPM 강제 방지
      startsAtFirstBeat: true,      // 첫박 정렬 사용
      startOffsetSec: Number(startOffsetSec.toFixed(3)),
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: "audio/webm" });
        try {
          props.onTranscribeStart?.();
          setStatusText("음원 전송 중...");

          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          formData.append("bpm", String(settingsRef.current.bpm));
          formData.append("meter", settingsRef.current.meter);
          formData.append("slowMode", "false");
          formData.append("startsAtFirstBeat", settingsRef.current.startsAtFirstBeat ? "true" : "false");
          formData.append("startOffsetSec", String(settingsRef.current.startOffsetSec));

          const resp = await fetch(`${API_BASE_URL}/record-and-transcribe/`, {
            method: "POST",
            body: formData,
          });

          setStatusText("악보 생성 중...");
          if (!resp.ok) throw new Error("서버 응답 실패");
          const result = await resp.json();
          console.log("✅ 전사 완료:", result);
          setStatusText("전사 완료");
          props.onTranscribeStatusUpdate?.("전사 완료");
        } catch (err) {
          console.error("⚠️ 전사 처리 중 오류:", err);
          setStatusText("⚠️ 오류 발생");
          props.onTranscribeStatusUpdate?.("⚠️ 오류 발생");
        }
        props.onTranscribeEnd?.();
      };

      // 실제 녹음
      mediaRecorderRef.current.start();
      setRecording(true);
      setStatusText("카운트인/클릭 진행 중...");

      // 카운트인 + 클릭 (세션 확정값으로)
      await playCountAndClick();

      // 안전 타임아웃
      timeoutRef.current = setTimeout(() => stopRecording(), 60000);
    } catch (err) {
      alert("❌ 마이크 접근 실패: " + err.message);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setCountNumber(null);
      setReadyText(null);
      setStatusText("처리 중...");
      clearTimeout(timeoutRef.current);
      clickSourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
      clickSourcesRef.current = [];
    }
  }

  function cancelRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setCountNumber(null);
      setReadyText(null);
      setStatusText("취소됨");
      clearTimeout(timeoutRef.current);
      clickSourcesRef.current.forEach((s) => { try { s.stop(); } catch {} });
      clickSourcesRef.current = [];
    }
  }

  // UI
  const beatsPerMeasureUI = getBeatsPerMeasure(meter);
  const startOffsetPreview = ((beatsPerMeasureUI * 60) / uiBpm).toFixed(3);

  return (
    <div className="p-4 bg-gray-900 rounded-2xl shadow-xl text-white space-y-4">
      {/* 템포/미터 설정 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-80">Tempo</span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tempoMode"
              value="slow"
              checked={tempoMode === "slow"}
              onChange={() => setTempoMode("slow")}
            />
            <span>느리게(60)</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tempoMode"
              value="very_slow"
              checked={tempoMode === "very_slow"}
              onChange={() => setTempoMode("very_slow")}
            />
            <span>아주 느리게(40)</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="tempoMode"
              value="advanced"
              checked={tempoMode === "advanced"}
              onChange={() => setTempoMode("advanced")}
            />
            <span>고급</span>
          </label>
          {tempoMode === "advanced" && (
            <input
              type="number"
              className="w-20 px-2 py-1 rounded bg-gray-800 border border-gray-700"
              min={30}
              max={240}
              value={customBpm}
              onChange={(e) => setCustomBpm(e.target.value)}
              placeholder="BPM"
              title="30~240"
            />
          )}
          <span className="text-xs opacity-70 ml-1">(현재 BPM: {uiBpm})</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm opacity-80">Meter</span>
          <select
            className="px-2 py-1 rounded bg-gray-800 border border-gray-700"
            value={meter}
            onChange={(e) => setMeter(e.target.value)}
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            {/* 필요하면 6/8 등 추가 */}
          </select>
        </div>

        <div className="text-xs opacity-70">
          Count-in: 1 bar / StartOffsetSec(미리보기): {startOffsetPreview}s
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="p-4 bg-gray-800 rounded-xl text-center h-24 flex items-center justify-center">
        {readyText && <p className="text-2xl font-bold text-blue-400 animate-pulse">{readyText}</p>}
        {countNumber !== null && !readyText && (
          <p className="text-4xl font-bold text-yellow-300 animate-pulse">{countNumber}</p>
        )}
        {recording && !readyText && countNumber === null && (
          <p className="text-2xl font-bold text-green-400 animate-pulse">Now Recording...</p>
        )}
        {!recording && !readyText && countNumber === null && (
          <p className="text-sm opacity-75">{statusText || "준비됨"}</p>
        )}
      </div>

      {/* 로컬 컨트롤 버튼 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => startRecording()} // 부모가 settings 넘겨도 됨(startRecording(settings))
          className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 transition"
          disabled={recording}
        >
          ▶ 녹음 시작
        </button>
        <button
          onClick={stopRecording}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 transition"
          disabled={!recording}
        >
          ■ 정지
        </button>
        <button
          onClick={cancelRecording}
          className="px-4 py-2 rounded-xl bg-gray-700 hover:bg-gray-600 transition"
          disabled={!recording}
        >
          ✕ 취소
        </button>
      </div>
    </div>
  );
});

export default AudioRecorderTile;