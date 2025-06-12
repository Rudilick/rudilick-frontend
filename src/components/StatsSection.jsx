import React from 'react';
import CountUp from 'react-countup';

// 숫자 포맷팅 함수 (K, M, B 단위 변환)
function formatNumber(value) {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
  return value.toString();
}

export default function StatsSection() {
  const stats = {
    visits: 12345,
    users: 785,
    licks: 248,
  };

  return (
    <section className="bg-gray-900 text-white py-12 px-6"> {/* ✅ 주변과 일치하는 배경색 */}
      <div className="max-w-5xl mx-auto text-center">
        {/* ❌ 제목 삭제됨 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <p className="text-4xl font-extrabold">
              <CountUp
                end={stats.visits}
                duration={2.5}
                formattingFn={formatNumber}
              />
            </p>
            <p className="text-gray-400 mt-2">Total Visits</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">
              <CountUp
                end={stats.users}
                duration={2.5}
                formattingFn={formatNumber}
              />
            </p>
            <p className="text-gray-400 mt-2">Registered Users</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">
              <CountUp
                end={stats.licks}
                duration={2.5}
                formattingFn={formatNumber}
              />
            </p>
            <p className="text-gray-400 mt-2">Uploaded Licks</p>
          </div>
        </div>
      </div>
    </section>
  );
}