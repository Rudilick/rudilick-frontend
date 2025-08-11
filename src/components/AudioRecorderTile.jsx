import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const API_BASE_URL = "http://127.0.0.1:8000";

const AudioRecorderTile = forwardRef((props, ref) => {
  const mediaRecorderRef = useRef(null);
  const settingsRef = useRef(null);
  const clickSourcesRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [countNumber, setCountNumber] = useState(null);
  const [readyText, setReadyText] = useState(null);
  const recordedChunks = useRef([]);
  const timeoutRef = useRef(null);

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

  const resolveBpm = () => {
    const s = settingsRef.current || {};
    if (s.tempoPreset === "slow") return 60;
    if (s.tempoPreset === "veryslow") return 40;
    return s.slowMode ? 50 : (s.bpm || 120); // 하위호환
  };

  const playCountAndClick = async () => {
    const bpm = resolveBpm();
    const meter = (settingsRef.current && settingsRef.current.meter) || "4/4";

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

    const now = context.currentTime + 2.5 + interval;

    // 1마디 카운트인
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

    // 본 클릭 1분
    const countEndTime = now + beatsPerMeasure * interval + 0.05;
    const totalBeats = Math.floor(60 / interval);
    for (let i = 0; i < totalBeats; i++) {
      const scheduledTime = countEndTime + i * interval;
      const isFirstBeat = i % beatsPerMeasure === 0;
      const clickUrl = isFirstBeat ? '/audio/click_high.wav' : '/audio/click.wav';
      playBufferedSound(context, clickUrl, scheduledTime);
    }

    await new Promise((res) =>
      setTimeout(res, (beatsPerMeasure + totalBeats + 1) * interval * 1000)
    );
  };

  const startRecording = async (settings) => {
    if (recording) return;
    try {
      settingsRef.current = settings;

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

          const bpm = resolveBpm();
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          formData.append("bpm", String(bpm));
          formData.append("meter", (settingsRef.current?.meter) || "4/4");
          formData.append("slowMode", settingsRef.current?.slowMode ? "true" : "false");
          formData.append(
            "startsAtFirstBeat",
            settingsRef.current?.startsAtFirstBeat ? "true" : "false"
          );
          formData.append(
            "startOffsetSec",
            settingsRef.current?.startOffsetSec?.toString() || "0.0"
          );

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
      await playCountAndClick();

      // 자동 정지(최대 60초)
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
    <div className="p-4 bg-gray-800 rounded-xl shadow-lg text-white mt-4 text-center h-28 flex items-center justify-center">
      {readyText && <p className="text-4xl font-bold text-blue-400 animate-pulse">{readyText}</p>}
      {countNumber !== null && readyText === null && (
        <p className="text-4xl font-bold text-yellow-300 animate-pulse">{countNumber}</p>
      )}
      {recording && readyText === null && countNumber === null && (
        <p className="text-4xl font-bold text-green-400 animate-pulse">Now Recording...</p>
      )}
    </div>
  );
});

export default AudioRecorderTile;