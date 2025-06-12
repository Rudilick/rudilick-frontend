import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatsSection from '../components/StatsSection';
import GoogleLoginButton from '../components/GoogleLoginButton'; // ✅ 추가

export default function HomeScreen() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-8 bg-gray-900 text-white">
      {/* ❌ 상단 header 제거됨 */}
      <main className="w-full max-w-md text-center">

        {/* ✅ 제거: 우상단 로그인 상태 표시 */}
        {/* <div className="w-full text-right mb-2"> */}
        {/*   <GoogleLoginButton /> */}
        {/* </div> */}

        <h2 className="text-xl font-semibold mb-2">Make. Play. Share.</h2>
        <p className="text-gray-400 mb-6">
          Create your own drum licks and share them with the world.
        </p>
        <button
          onClick={() => navigate("/write")}
          className="w-full py-3 mb-10 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl"
        >
          PLAY TO WRITE
        </button>

        {/* 영상 타일: 1:1 비율 유지 */}
        <div className="w-full aspect-square overflow-hidden rounded-xl border border-gray-600 relative">
          <video
            src="/video/rudilick_home_video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* ✅ 로그인 버튼: 영상 내부 하단 중앙에 겹치게 */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
            <GoogleLoginButton />
          </div>
        </div>

        {/* ✅ 영상 아래 통계 영역 */}
        <StatsSection />
      </main>
    </div>
  );
}