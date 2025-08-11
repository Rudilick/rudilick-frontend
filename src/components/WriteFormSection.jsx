import React, { useRef, useState } from 'react';
import AudioRecorderTile from './AudioRecorderTile';

export default function WriteFormSection() {
  // 템포(60 / 40)
  const [tempo, setTempo] = useState(60);
  // 박자형식
  const [meter, setMeter] = useState('4/4');
  // 상태 메시지 전용
  const [statusText, setStatusText] = useState('Ready • PLAY TO WRITE 를 눌러 시작하세요');
  const [recording, setRecording] = useState(false);

  const recorderRef = useRef(null);

  const triggerRecording = () => {
    if (!recorderRef.current || recording) return;

    // 백엔드에 전달할 설정
    const settings = {
      bpm: tempo,                 // 60 또는 40
      meter,                      // 4/4 등
      slowMode: false,            // 고정
      startsAtFirstBeat: true,    // 첫박 기준 정렬
      startOffsetSec: 2.5,        // 카운트인 버퍼
    };

    setStatusText('카운트인 후 녹음이 시작됩니다…');
    setRecording(true);
    recorderRef.current.startRecording(settings);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12 px-4 py-6 rounded-2xl shadow-lg bg-gray-900 text-white border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center">Generate Drum Sheet Music</h2>

      {/* 템포 선택 (60 / 40) */}
      <div className="mb-5">
        <label className="block font-medium mb-2">Tempo</label>
        <div className="flex gap-3">
          {[60, 40].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTempo(t)}
              className={`flex-1 py-2 rounded-xl font-semibold border ${
                tempo === t ? 'bg-orange-500 border-orange-400' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
              }`}
            >
              {t} BPM
            </button>
          ))}
        </div>
      </div>

      {/* 박자형식 선택 */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Meter</label>
        <select
          value={meter}
          onChange={(e) => setMeter(e.target.value)}
          className="w-full text-black px-3 py-2 rounded"
        >
          {['4/4', '3/4', '6/8', '12/8', '5/4', '7/8'].map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* 상단의 유일한 액션 버튼: PLAY TO WRITE */}
      <div className="mb-6">
        <button
          onClick={triggerRecording}
          disabled={recording}
          className={`w-full py-3 rounded-xl font-semibold ${
            recording ? 'bg-gray-700 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {recording ? 'Recording…' : 'PLAY TO WRITE'}
        </button>
      </div>

      {/* 녹음기(보이지 않는 내부 엔진처럼 사용) */}
      <AudioRecorderTile
        ref={recorderRef}
        onTranscribeStart={() => {
          // 업로드 시작 시점(녹음 stop 후)
          setStatusText('음원 전송 중…');
        }}
        onTranscribeStatusUpdate={(text) => setStatusText(text)}
        onTranscribeEnd={() => {
          setRecording(false);
          setStatusText('완료! temp 폴더의 PNG를 확인하세요.');
        }}
      />

      {/* 하단 메시지 영역(이 칸만 남김) */}
      <div className="mt-4 p-4 rounded-xl bg-gray-800 border border-gray-700 min-h-[64px]">
        <p className="text-center text-sm text-gray-200 whitespace-pre-line">{statusText}</p>
      </div>
    </div>
  );
}