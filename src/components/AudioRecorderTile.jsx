import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const API_BASE_URL = "http://127.0.0.1:8000"; // 필요시 .env로 교체

const AudioRecorderTile = forwardRef((props, ref) => {
  const mediaRecorderRef = useRef(null);
  const clickSourcesRef = useRef([]);
  const recordedChunks = useRef([]);
  const timeoutRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [countNumber, setCountNumber] = useState(null);
  const [readyText, setReadyText] = useState(null);
  const [tempo, setTempo] = useState(60); // 60 또는 40만 사용

  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    cancelRecording,
  }));

  const playBufferedSound = async (context, url, scheduledTime) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
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

  const playCountAndClick = async (bpm) => {
    const meter = "4/4";
    const interval = 60 / bpm;
    const beatsPerMeasure = parseInt(meter.split('/')[0], 10);

    const countNames = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
    const hypeMessages = ["Let's groove!", "Let's go!", "Here we go!", "Time to hit!", "Drum on!"];

    const context = new (window.AudioContext || window.webkitAudioContext)();

    setReadyText("Are you ready?");
    setTimeout(() => {
      setReadyText(hypeMessages[Math.floor(Math.random() * hypeMessages.length)]);
    }, 1000);
    setTimeout(() => setReadyText(null), 3000);

    // 카운트인 시작 지연 + 한 박
    const now = context.currentTime + 2.5 + interval;

    // 1마디 카운트(보이스)
    for (let i = 0; i < beatsPerMeasure; i++) {
      const name = countNames[i];
      const scheduledTime = now + i * interval;

      setTimeout(() => {
        setCountNumber(i + 1);
        if (i === beatsPerMeasure - 1) {
          setTimeout(() => setCountNumber(null), interval * 1000 * 0.8);
        }
      }, (scheduledTime - context.currentTime) * 1000);

      playBufferedSound(context, `/audio/${name}.wav`, scheduledTime);
    }

    // 이후 클릭 (하이클릭=첫박)
    const countEndTime = now + beatsPerMeasure * interval + 0.05;
    const totalBeats = Math.floor(60 / interval);
    for (let i = 0; i < totalBeats; i++) {
      const scheduledTime = countEndTime + i * interval;
      const isFirstBeat = i % beatsPerMeasure === 0;
      const clickUrl = isFirstBeat ? '/audio/click_high.wav' : '/audio/click.wav';
      playBufferedSound(context, clickUrl, scheduledTime);
    }

    // 클릭 재생 끝날 때까지 대기
    await new Promise((res) => setTimeout(res, (beatsPerMeasure + totalBeats + 1) * interval * 1000));
  };

  const startRecording = async () => {
    if (recording) return;
    try {
      // 고정값들(간소화)
      const settings = {
        bpm: tempo,           // 60 또는 40
        meter: "4/4",         // 고정
        slowMode: false,      // 사용 안 함
        startsAtFirstBeat: false,
        startOffsetSec: 2.5,  // 카운트인 보정
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
        try {
          props.onTranscribeStart?.();
          props.onTranscribeStatusUpdate?.("음원 전송 중...");

          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          formData.append("bpm", String(settings.bpm));
          formData.append("meter", settings.meter);
          formData.append("slowMode", "false");
          formData.append("startsAtFirstBeat", settings.startsAtFirstBeat ? "true" : "false");
          formData.append("startOffsetSec", String(settings.startOffsetSec));

          const response = await fetch(`${API_BASE_URL}/record-and-transcribe/`, {
            method: "POST",
            body: formData,
          });

          props.onTranscribeStatusUpdate?.("악보 생성 중...");
          if (!response.ok) throw new Error("서버 응답 실패");

          const result = await response.json();
          console.log("✅ 전사 완료:", result);
          props.onTranscribeStatusUpdate?.("전사 완료");
        } catch (error) {
          console.error("⚠️ 전사 처리 중 오류:", error);
          props.onTranscribeStatusUpdate?.("⚠️ 오류 발생");
        }
        props.onTranscribeEnd?.();
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      await playCountAndClick(settings.bpm);

      // 안전 타임아웃(최대 60초)
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 60000);
    } catch (err) {
      alert("❌ 마이크 접근 실패: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setCountNumber(null);
      setReadyText(null);
      clearTimeout(timeoutRef.current);
      clickSourcesRef.current.forEach((source) => source.stop());
      clickSourcesRef.current = [];
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setCountNumber(null);
      setReadyText(null);
      clearTimeout(timeoutRef.current);
      clickSourcesRef.current.forEach((source) => source.stop());
      clickSourcesRef.current = [];
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-xl shadow-lg text-white space-y-4">
      {/* 템포 선택만 노출 */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setTempo(60)}
          className={`px-4 py-2 rounded-full border border-white/30 transition ${
            tempo === 60 ? 'bg-white text-gray-900' : 'bg-transparent text-white hover:bg-white/10'
          }`}
        >
          60 BPM
        </button>
        <button
          type="button"
          onClick={() => setTempo(40)}
          className={`px-4 py-2 rounded-full border border-white/30 transition ${
            tempo === 40 ? 'bg-white text-gray-900' : 'bg-transparent text-white hover:bg-white/10'
          }`}
        >
          40 BPM
        </button>
      </div>

      {/* 실행 버튼만 남김 */}
      <div className="text-center">
        <button
          onClick={startRecording}
          disabled={recording}
          className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-600 disabled:opacity-50 font-semibold"
        >
          Play to write
        </button>
      </div>

      {/* 진행 상태 */}
      <div className="h-10 flex items-center justify-center">
        {readyText && <p className="text-xl font-bold text-blue-400 animate-pulse">{readyText}</p>}
        {countNumber !== null && !readyText && (
          <p className="text-2xl font-bold text-yellow-300 animate-pulse">{countNumber}</p>
        )}
        {recording && !readyText && countNumber === null && (
          <p className="text-xl font-bold text-green-400 animate-pulse">Now Recording...</p>
        )}
      </div>
    </div>
  );
});

export default AudioRecorderTile;