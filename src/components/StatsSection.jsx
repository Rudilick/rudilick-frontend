import React from 'react';
import CountUp from 'react-countup';

export default function StatsSection() {
  return (
    <section className="bg-gray-950 text-white py-12">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-10">RudiLick in Numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <p className="text-4xl font-extrabold">
              <CountUp end={12345} duration={2.5} separator="," />
            </p>
            <p className="text-gray-400 mt-2">Total Visits</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">
              <CountUp end={785} duration={2.5} separator="," />
            </p>
            <p className="text-gray-400 mt-2">Registered Users</p>
          </div>
          <div>
            <p className="text-4xl font-extrabold">
              <CountUp end={248} duration={2.5} separator="," />
            </p>
            <p className="text-gray-400 mt-2">Uploaded Licks</p>
          </div>
        </div>
      </div>
    </section>
  );
}