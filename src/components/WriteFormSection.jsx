import React, { useRef, useState } from 'react';
import AudioRecorderTile from './AudioRecorderTile';
import LoadingModal from './LoadingModal';

export default function WriteFormSection() {
  const [tempo, setTempo] = useState(60);        // 60 또는 40
  const [meter, setMeter] = useState("4/4");
  const [recording, setRecording] = useState(false);

  // 진행 모달 (업로드/전사 단계)
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [statusText, setStatusText] = useState("음원 전송 중...");

  // 하단 메시지 영역
  const [uiMsg, setUiMsg] = useState("Ready • PLAY TO WRITE 를 눌러 시작하세요");

  const recorderRef = useRef(null);

  const triggerRecording = () => {
    if (!recorderRef.current) return;
    const settings = {
      bpm: tempo,               // 백엔드로는 명시적으로 bpm 전달
      meter: meter,
      startsAtFirstBeat: false, // 카운트 1마디 후 시작
      startOffsetSec: 0,        // 타일에서 1마디 기준으로 계산해 전달
    };
    // UI 즉시 전환
    setRecording(true);
    setUiMsg("Are you ready?");
    recorderRef.current.startRecording(settings);
  };

  const finishRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.stopRecording();
    setRecording(false);
  };

  const cancelRecording = () => {
    if (!recorderRef.current) return;
    recorderRef.current.cancelRecording();
    setRecording(false);
    setUiMsg("취소되었습니다. 다시 PLAY TO WRITE 를 눌러 시작하세요.");
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12 px-4 py-6 rounded-2xl shadow-lg bg-gray-900 text-white border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center">Generate Drum Sheet Music</h2>

      {/* Tempo 선택 (60 / 40) */}
      <div className="mb-4">
        <label className="block font-medium mb-2">Tempo</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTempo(60)}
            className={`w-full py-3 rounded-xl font-semibold ${tempo === 60 ? 'bg-gray-700' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            60 BPM
          </button>
          <button
            onClick={() => setTempo(40)}
            className={`w-full py-3 rounded-xl font-semibold ${tempo === 40 ? 'bg-orange-500' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            40 BPM
          </button>
        </div>
      </div>

      {/* Meter 선택 */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Meter</label>
        <select
          value={meter}
          onChange={(e) => setMeter(e.target.value)}
          className="w-full text-black px-3 py-2 rounded"
        >
          {["4/4", "3/4", "6/8", "12/8", "5/4", "7/8"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* 메인 버튼 영역 */}
      {!recording ? (
        <button
          onClick={triggerRecording}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-semibold"
        >
          PLAY TO WRITE
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={finishRecording}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold"
          >
            FINISH
          </button>
          <button
            onClick={cancelRecording}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* 녹음 타일: 화면엔 보이지 않지만(사운드 스케줄/업로드 담당) */}
      <AudioRecorderTile
        ref={recorderRef}
        onUiMessage={(msg) => setUiMsg(msg)}
        onRecordingChange={(isRec) => setRecording(isRec)}
        onTranscribeStart={() => {
          setShowLoadingModal(true);
          setStatusText("음원 전송 중...");
        }}
        onTranscribeStatusUpdate={(text) => setStatusText(text)}
        onTranscribeEnd={() => {
          setShowLoadingModal(false);
          setUiMsg("완료! 결과 미디/이미지가 생성되었습니다.");
        }}
      />

      {/* 하단 상태바 */}
      <div className="mt-6 px-4 py-3 rounded-xl bg-gray-800 text-center text-gray-200">
        {uiMsg}
      </div>

      {/* 진행 중 모달 */}
      {showLoadingModal && <LoadingModal status={statusText} />}
    </div>
  );
}