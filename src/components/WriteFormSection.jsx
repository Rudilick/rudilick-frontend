import React, { useRef, useState } from 'react';
import AudioRecorderTile from './AudioRecorderTile';
import LoadingModal from './LoadingModal';

export default function WriteFormSection() {
  // ✅ 60 / 40 두 가지 템포만
  const [tempoChoice, setTempoChoice] = useState(60); // 기본 60
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [statusText, setStatusText] = useState('음원 전송 중...');
  const [isBusy, setIsBusy] = useState(false); // 중복 클릭 방지용
  const recorderRef = useRef(null);

  const triggerRecording = async () => {
    if (!recorderRef.current || isBusy) return;
    setIsBusy(true);

    // 백엔드가 기대하는 최소 설정만 전달
    const settings = {
      bpm: tempoChoice,          // 60 또는 40
      meter: '4/4',              // 고정
      slowMode: false,           // 사용 안 함
      startsAtFirstBeat: true,   // 첫 박 기준
      startOffsetSec: 2.5        // 카운트다운 이후 시작 오프셋
    };

    try {
      recorderRef.current.startRecording(settings);
    } catch (e) {
      console.error(e);
      setIsBusy(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12 px-4 py-6 rounded-2xl shadow-lg bg-gray-900 text-white border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center">Generate Drum Sheet Music</h2>

      {/* ✅ 템포 선택 (60 / 40)만 남김 */}
      <div className="mb-6">
        <p className="block font-medium mb-3 text-center">Tempo</p>
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setTempoChoice(60)}
            className={`w-24 h-24 rounded-full border-2 ${
              tempoChoice === 60 ? 'border-white bg-white/10' : 'border-gray-500'
            } flex flex-col items-center justify-center transition`}
          >
            <span className="text-xl font-bold">60</span>
            <span className="text-xs opacity-80">Slow</span>
          </button>
          <button
            type="button"
            onClick={() => setTempoChoice(40)}
            className={`w-24 h-24 rounded-full border-2 ${
              tempoChoice === 40 ? 'border-white bg-white/10' : 'border-gray-500'
            } flex flex-col items-center justify-center transition`}
          >
            <span className="text-xl font-bold">40</span>
            <span className="text-xs opacity-80">Very Slow</span>
          </button>
        </div>
      </div>

      {/* ✅ PLAY TO WRITE 한 개만 표시 (Stop/Cancel 제거) */}
      <div className="mt-2">
        <button
          onClick={triggerRecording}
          disabled={isBusy}
          className={`w-full ${
            isBusy ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
          } text-white py-3 rounded-xl font-semibold transition`}
        >
          {isBusy ? 'PREPARING…' : 'PLAY TO WRITE'}
        </button>
      </div>

      {/* 🎙️ 녹음기 (상태 콜백 연결) */}
      <AudioRecorderTile
        ref={recorderRef}
        onTranscribeStart={() => {
          setShowLoadingModal(true);
          setStatusText('음원 전송 중...');
        }}
        onTranscribeStatusUpdate={(text) => setStatusText(text)}
        onTranscribeEnd={() => {
          setShowLoadingModal(false);
          setIsBusy(false);
        }}
      />

      {/* 진행 중 모달 */}
      {showLoadingModal && <LoadingModal status={statusText} />}
    </div>
  );
}