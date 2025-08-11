import React, { useRef, useState } from 'react';
import AudioRecorderTile from './AudioRecorderTile';

export default function WriteFormSection() {
  const [tempo, setTempo] = useState(60);
  const [meter, setMeter] = useState('4/4');
  const [recording, setRecording] = useState(false);

  const recorderRef = useRef(null);

  const triggerRecording = () => {
    if (!recorderRef.current || recording) return;

    const settings = {
      bpm: tempo,
      meter,
      slowMode: false,
      startsAtFirstBeat: true,
      startOffsetSec: 2.5,
    };

    setRecording(true);
    recorderRef.current.startRecording(settings);
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12 px-4 py-6 rounded-2xl shadow-lg bg-gray-900 text-white border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center">Generate Drum Sheet Music</h2>

      {/* Tempo 선택 */}
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

      {/* Meter 선택 */}
      <div className="mb-6">
        <label className="block font-medium mb-2">Meter</label>
        <select
          value={meter}
          onChange={(e) => setMeter(e.target.value)}
          className="w-full text-black px-3 py-2 rounded"
        >
          {['4/4', '3/4', '6/8', '12/8', '5/4', '7/8'].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* 유일한 액션 버튼 */}
      <div className="mb-2">
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

      {/* 타일은 headless 로드(엔진만) */}
      <AudioRecorderTile
        ref={recorderRef}
        headless
        onTranscribeStart={() => {}}
        onTranscribeStatusUpdate={() => {}}
        onTranscribeEnd={() => setRecording(false)}
      />
    </div>
  );
}