import React from 'react';
import CountUp from 'react-countup';

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
      <div className="max-w-5xl mx-auto flex justify-between items-center text-center gap-2">
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xl sm:text-3xl font-extrabold break-keep">
            <CountUp end={stats.visits} duration={2.5} formattingFn={formatNumber} />
          </p>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Total Visits</p>
        </div>
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xl sm:text-3xl font-extrabold break-keep">
            <CountUp end={stats.users} duration={2.5} formattingFn={formatNumber} />
          </p>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Registered Users</p>
        </div>
        <div className="flex-1 min-w-0 px-1">
          <p className="text-xl sm:text-3xl font-extrabold break-keep">
            <CountUp end={stats.licks} duration={2.5} formattingFn={formatNumber} />
          </p>
          <p className="text-gray-400 mt-1 text-xs sm:text-sm">Uploaded Licks</p>
        </div>
      </div>
    </section>
  );
}