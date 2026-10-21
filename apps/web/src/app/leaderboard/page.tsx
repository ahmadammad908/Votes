'use client';

import React, { useEffect, useState } from 'react';
import { apiClient, getImageUrl } from '@/lib/api';
import { displayFont, bodyFont } from '@/lib/fonts';
import { Search, ChevronDown, Crown } from 'lucide-react';
import { LeaderboardEntryDTO, LeaderboardResponseDTO, UNIVERSITY_DEPARTMENTS } from '@campusface/shared';

const DISPLAY = 'font-[family-name:var(--font-display)]';

function standing(rank: number, gap: number) {
  if (rank === 1) return 'Leading';
  if (gap === 0) return 'Tied with #1';
  return `${gap} behind #1`;
}

function PodiumCard({ entry, gap }: { entry: LeaderboardEntryDTO; gap: number }) {
  const first = entry.rank === 1;
  const order = entry.rank === 1 ? 'order-2' : entry.rank === 2 ? 'order-1' : 'order-3';

  return (
    <article
      className={`${order} relative min-w-0 overflow-hidden rounded-2xl bg-gray-100 shadow-md ${
        first ? 'aspect-[3/4.7] ring-4 ring-[#6C1C74]' : 'aspect-[3/4.1] ring-1 ring-gray-200'
      }`}
    >
      <img
        src={getImageUrl(entry.imageUrl)}
        alt={entry.displayName}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#6C1C74]/95 via-[#6C1C74]/50 to-transparent" />

      <span
        className={`absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center gap-1 rounded-full px-2 text-xs font-bold shadow-sm ${
          first ? 'bg-[#6C1C74] text-white ring-2 ring-white' : 'bg-white text-[#6C1C74]'
        }`}
      >
        {first && <Crown className="h-3.5 w-3.5" />}
        {entry.rank}
      </span>

      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
        <h3 className={`${DISPLAY} truncate text-sm font-semibold leading-tight text-white sm:text-xl`}>
          {entry.displayName}
        </h3>
        <p className={`${DISPLAY} mt-0.5 text-lg font-semibold text-white sm:text-3xl`}>
          {entry.totalVotes}
          <span className="ml-1 font-sans text-[11px] font-normal text-white/80 sm:text-sm">votes</span>
        </p>
        <p className={`mt-0.5 truncate text-[11px] sm:text-xs ${first ? 'font-semibold text-white' : 'text-white/80'}`}>
          {standing(entry.rank, gap)}
        </p>
      </div>
    </article>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntryDTO[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchLeaderboard = async (dept?: string) => {
    setIsLoading(true);
    try {
      const endpoint = dept ? `/leaderboard?department=${encodeURIComponent(dept)}` : '/leaderboard';
      const data = await apiClient<LeaderboardResponseDTO>(endpoint);
      setEntries(data.entries);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedDept || undefined);
  }, [selectedDept]);

  const filteredEntries = entries.filter((e) =>
    e.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leaderVotes = entries.reduce((max, e) => Math.max(max, e.totalVotes), 0);
  const showPodium = !searchQuery && entries.length >= 3;
  const podium = showPodium ? entries.slice(0, 3) : [];
  const listEntries = showPodium ? filteredEntries.slice(3) : filteredEntries;

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} mx-auto w-full max-w-3xl overflow-x-hidden bg-white px-3 py-8 font-[family-name:var(--font-body)] text-gray-900 sm:px-6 sm:py-14`}
    >
      {/* Header */}
      <header className="mb-8">
        <h1 className={`${DISPLAY} text-3xl font-semibold tracking-tight text-[#6C1C74] sm:text-5xl`}>
          Who is winning?
        </h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
          Live ranking built from one-vs-one battle votes. Individual votes stay private.
        </p>
      </header>

      {/* Filters */}
      <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C1C74]/60" />
          <input
            type="text"
            placeholder="Search contestant"
            aria-label="Search contestant"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-base text-gray-900 placeholder-gray-400 focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74] sm:text-sm"
          />
        </div>

        <div className="relative">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            aria-label="Filter by department"
            className="min-h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-4 pr-10 text-base text-gray-900 focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74] sm:text-sm"
          >
            <option value="">All departments</option>
            {UNIVERSITY_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6C1C74]/60" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 items-end gap-2">
            <div className="order-1 aspect-[3/4.1] animate-pulse rounded-2xl bg-[#6C1C74]/10" />
            <div className="order-2 aspect-[3/4.7] animate-pulse rounded-2xl bg-[#6C1C74]/10" />
            <div className="order-3 aspect-[3/4.1] animate-pulse rounded-2xl bg-[#6C1C74]/10" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-[#6C1C74]/5" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-900">No contestants found</p>
          <p className="mt-1 text-sm text-gray-500">Try a different name or department.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {showPodium && (
            <section aria-label="Top three" className="mb-8 grid grid-cols-3 items-end gap-2 sm:gap-4">
              {podium.map((entry) => (
                <PodiumCard
                  key={entry.studentId}
                  entry={entry}
                  gap={leaderVotes - entry.totalVotes}
                />
              ))}
            </section>
          )}

          {/* Rest of the ranking */}
          {listEntries.length > 0 && (
            <ol className="divide-y divide-gray-200 border-y border-gray-200">
              {listEntries.map((entry) => {
                const gap = leaderVotes - entry.totalVotes;
                const pct = leaderVotes > 0 ? Math.round((entry.totalVotes / leaderVotes) * 100) : 0;
                const isLeader = entry.rank === 1;

                return (
                  <li key={entry.studentId} className="py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums text-[#6C1C74]">
                        {entry.rank}
                      </span>

                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 sm:h-14 sm:w-14">
                        <img
                          src={getImageUrl(entry.imageUrl)}
                          alt={entry.displayName}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                          {entry.displayName}
                        </h3>
                        {entry.department && (
                          <p className="truncate text-xs text-gray-500">{entry.department}</p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className={`${DISPLAY} text-xl font-semibold leading-none text-[#6C1C74] sm:text-2xl`}>
                          {entry.totalVotes}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">votes</p>
                      </div>
                    </div>

                    {/* Gap to the leader */}
                    <div className="mt-3 flex items-center gap-3 pl-10">
                      <div
                        className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#6C1C74]/10"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${entry.displayName} has ${pct}% of the leader's votes`}
                      >
                        <div
                          className={`h-full rounded-full ${isLeader ? 'bg-[#6C1C74]' : 'bg-[#6C1C74]/50'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-gray-500">{standing(entry.rank, gap)}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}

      {lastUpdated && (
        <p className="mt-8 text-xs text-gray-400">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}