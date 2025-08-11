import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const API_BASE_URL = "http://127.0.0.1:8000";

const AudioRecorderTile = forwardRef((props, ref) => {
  const mediaRecorderRef = useRef(null);
  const settingsRef = useRef(null);
  const clickSourcesRef = useRef([]);
  const recordedChunks = useRef([]);
  const countTimersRef = useRef([]);
  const autoStopRef = useRef(null);

  // 안전하게 타이머/클릭음을 모두 정리
  const clearAllTimersAndClicks = () => {
    countTimersRef.current.forEach(t => clearTimeout(t));
    countTimersRef.current = [];
    clickSourcesRef.current.forEach(src => {
      try { src.stop(); } catch {}
    });
    clickSourcesRef.current = [];
    clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
  };

  // 오디오 버퍼 재생(스케줄)
  const playBufferedSound = async (context, url, scheduledTime) => {
    const resp = await fetch(url);
    const arrayBuffer = await resp.arrayBuffer();
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

  // 카운트 + 메트로놈 + 메시지 스케줄링
  const playCountAndClick = async (meter, bpm) => {
    const beatsPerMeasure = parseInt(meter.split('/')[0], 10);
    const interval = 60 / bpm;

    const context = new (window.AudioContext || window.webkitAudioContext)();

    // 메시지 단계: Ready -> Hype -> (카운트) -> Now Recording
    props.onUiMessage?.("Are you ready?");
    countTimersRef.current.push(setTimeout(() => {
      const list = ["Let's groove!", "Let's go!", "Here we go!", "Time to hit!", "Drum on!"];
      props.onUiMessage?.(list[Math.floor(Math.random() * list.length)]);
    }, 1000));
    countTimersRef.current.push(setTimeout(() => {
      // hype 텍스트 잠깐 보여주고 사라짐
      props.onUiMessage?.("");
    }, 3000));

    // 카운트 시작 기준(약간의 준비시간 + 한 박 선행)
    const now = context.currentTime + 2.5 + interval;

    // 숫자 카운트(메시지로 표시) + 보이스 음원
    const countNames = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
    for (let i = 0; i < beatsPerMeasure; i++) {
      const scheduledTime = now + i * interval;

      // 숫자 표시 타이머
      const showTimer = setTimeout(() => {
        props.onUiMessage?.(`${i + 1}`);
      }, Math.max(0, (scheduledTime - context.currentTime) * 1000));
      countTimersRef.current.push(showTimer);

      // 보이스 카운트 재생
      const vName = countNames[i] || 'one';
      playBufferedSound(context, `/audio/${vName}.wav`, scheduledTime);
    }

    // 카운트 끝나는 시점 + 약간의 여유
    const countEndTime = now + beatsPerMeasure * interval + 0.05;

    // 클릭 시작 알림
    const startClicksTimer = setTimeout(() => {
      props.onUiMessage?.("Now Recording...");
    }, Math.max(0, (countEndTime - context.currentTime) * 1000));
    countTimersRef.current.push(startClicksTimer);

    // 클릭(메트로놈) 60초 분량 정도 사전 스케줄
    const totalBeats = Math.floor(60 / interval);
    for (let i = 0; i < totalBeats; i++) {
      const scheduledTime = countEndTime + i * interval;
      const isFirstBeat = i % beatsPerMeasure === 0;
      const url = isFirstBeat ? '/audio/click_high.wav' : '/audio/click.wav';
      playBufferedSound(context, url, scheduledTime);
    }

    // 카운트 1마디 만큼의 오프셋을 백엔드로 전달하기 위해 반환
    const startOffsetSec = beatsPerMeasure * interval + 0.05;
    return { startOffsetSec };
  };

  // 퍼블릭 메서드
  useImperativeHandle(ref, () => ({
    startRecording,
    stopRecording,
    cancelRecording,
  }));

  async function startRecording(settings) {
    if (mediaRecorderRef.current) return;

    try {
      settingsRef.current = settings;
      const bpm = settingsRef.current.bpm ?? 60;
      const meter = settingsRef.current.meter ?? "4/4";

      // 마이크 권한
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunks.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          const blob = new Blob(recordedChunks.current, { type: 'audio/webm' });
          props.onTranscribeStart?.();
          props.onTranscribeStatusUpdate?.("음원 전송 중...");

          const { startOffsetSec } = await scheduleInfoPromise;

          const formData = new FormData();
          formData.append("file", blob, "recording.webm");
          formData.append("bpm", String(bpm));
          formData.append("meter", meter);
          formData.append("slowMode", "false");
          formData.append("startsAtFirstBeat", "false");         // 오프셋 기준
          formData.append("startOffsetSec", String(startOffsetSec));

          const response = await fetch(`${API_BASE_URL}/record-and-transcribe/`, {
            method: "POST",
            body: formData,
          });

          props.onTranscribeStatusUpdate?.("악보 생성 중...");
          if (!response.ok) throw new Error("서버 응답 실패");
          await response.json();

          props.onTranscribeStatusUpdate?.("전사 완료");
        } catch (err) {
          console.error("⚠️ 전사 처리 중 오류:", err);
          props.onTranscribeStatusUpdate?.("⚠️ 오류 발생");
        } finally {
          props.onTranscribeEnd?.();
          props.onRecordingChange?.(false);
          props.onUiMessage?.("완료! 다시 녹음하려면 PLAY TO WRITE.");
          clearAllTimersAndClicks();
          mediaRecorderRef.current = null;
        }
      };

      // 녹음 시작
      mediaRecorderRef.current.start();
      props.onRecordingChange?.(true);

      // 카운트 + 클릭 스케줄 및 메시지
      const scheduleInfoPromise = playCountAndClick(meter, bpm);

      // 안전 자동 종료(60초)
      autoStopRef.current = setTimeout(() => stopRecording(), 60_000);
    } catch (err) {
      props.onUiMessage?.("❌ 마이크 접근 실패: " + (err?.message || String(err)));
      props.onRecordingChange?.(false);
      clearAllTimersAndClicks();
      mediaRecorderRef.current = null;
    }
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
    } catch {}
    props.onUiMessage?.("처리 중… (업로드/전사)");
    clearAllTimersAndClicks();
  }

  function cancelRecording() {
    if (!mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
    } catch {}
    // 업로드를 아예 하지 않기 위해 버퍼 비우기
    recordedChunks.current = [];
    props.onRecordingChange?.(false);
    props.onUiMessage?.("취소되었습니다.");
    clearAllTimersAndClicks();
    mediaRecorderRef.current = null;
  }

  return null; // 화면 UI는 부모가 담당
});

export default AudioRecorderTile;