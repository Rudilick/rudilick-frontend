import React from 'react';
import CountUp from 'react-countup';

// 숫자 포맷팅 함수
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
    <section className="bg-gray-900 text-white py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 text-center">
        <div className="w-28 sm:w-40">
          <p className="text-2xl sm:text-4xl font-extrabold">
            <CountUp end={stats.visits} duration={2.5} formattingFn={formatNumber} />
          </p>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Total Visits</p>
        </div>
        <div className="w-28 sm:w-40">
          <p className="text-2xl sm:text-4xl font-extrabold">
            <CountUp end={stats.users} duration={2.5} formattingFn={formatNumber} />
          </p>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Registered Users</p>
        </div>
        <div className="w-28 sm:w-40">
          <p className="text-2xl sm:text-4xl font-extrabold">
            <CountUp end={stats.licks} duration={2.5} formattingFn={formatNumber} />
          </p>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Uploaded Licks</p>
        </div>
      </div>
    </section>
  );
}