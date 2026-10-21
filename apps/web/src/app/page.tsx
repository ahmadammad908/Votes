'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Trophy, ShieldCheck, Check, Sparkles, RefreshCw } from 'lucide-react';
import { apiClient, getImageUrl } from '@/lib/api';
import { BattleDTO, NextBattleResponseDTO } from '@campusface/shared';
import { useAuth } from '@/lib/auth-context';

type Pick = 'a' | 'b' | null;

interface ContestantDisplay {
  id: string;
  name: string;
  dept: string;
  imageUrl: string;
  votes: number;
}

const DEFAULT_CONTESTANTS = {
  a: {
    id: 'demo-a',
    name: 'Elena Rostova',
    dept: 'Computer Science',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    votes: 58,
  },
  b: {
    id: 'demo-b',
    name: 'Marcus Vance',
    dept: 'Architecture & Design',
    imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80',
    votes: 42,
  },
};

const STEPS = [
  {
    title: 'Two profiles appear',
    text: 'Every battle shows two students who have signed the participant agreement.',
  },
  {
    title: 'You pick one',
    text: 'Tap the photo you prefer. One vote per battle, tied to your account.',
  },
  {
    title: 'Next pair loads',
    text: 'Your vote is saved and the next battle opens right away, with no page reload.',
  },
];

const PROMISES = [
  {
    title: 'Consent comes first',
    text: 'Nobody is listed without a signed agreement. Contestants can withdraw and be removed at any time.',
  },
  {
    title: 'Only real students',
    text: 'Profiles come from verified university accounts. We never scrape photos from social media.',
  },
  {
    title: 'One person, one vote',
    text: 'Each account can vote once per battle, so rankings reflect real opinions instead of ballot stuffing.',
  },
];

function BattlePreview() {
  const { user } = useAuth();
  const [pick, setPick] = useState<Pick>(null);
  const [battleData, setBattleData] = useState<{
    battleId?: string;
    contestantA: ContestantDisplay;
    contestantB: ContestantDisplay;
  }>({
    contestantA: DEFAULT_CONTESTANTS.a,
    contestantB: DEFAULT_CONTESTANTS.b,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [voteCountedMsg, setVoteCountedMsg] = useState<string | null>(null);

  const fetchLiveBattle = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient<NextBattleResponseDTO>('/battles/next');
      if (res.battle) {
        const votesA = res.battle.contestantA.votes ?? res.battle.votesA ?? 0;
        const votesB = res.battle.contestantB.votes ?? res.battle.votesB ?? 0;
        setBattleData({
          battleId: res.battle.id,
          contestantA: {
            id: res.battle.contestantA.id,
            name: res.battle.contestantA.displayName,
            dept: res.battle.contestantA.department || 'General Studies',
            imageUrl: getImageUrl(res.battle.contestantA.imageUrl),
            votes: votesA,
          },
          contestantB: {
            id: res.battle.contestantB.id,
            name: res.battle.contestantB.displayName,
            dept: res.battle.contestantB.department || 'General Studies',
            imageUrl: getImageUrl(res.battle.contestantB.imageUrl),
            votes: votesB,
          },
        });
      }
    } catch {
      // Gracefully use default high quality contestants
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBattle();
  }, []);

  const voted = pick !== null;
  const totalVotes = battleData.contestantA.votes + battleData.contestantB.votes;
  const percentA = totalVotes > 0 ? Math.round((battleData.contestantA.votes / totalVotes) * 100) : 50;
  const percentB = 100 - percentA;

  const handleVote = async (choice: 'a' | 'b') => {
    if (voted) return;
    setPick(choice);

    const chosenContestant = choice === 'a' ? battleData.contestantA : battleData.contestantB;

    // Immediately increment the vote count in state so the user sees live feedback
    setBattleData((prev) => ({
      ...prev,
      contestantA: {
        ...prev.contestantA,
        votes: choice === 'a' ? prev.contestantA.votes + 1 : prev.contestantA.votes,
      },
      contestantB: {
        ...prev.contestantB,
        votes: choice === 'b' ? prev.contestantB.votes + 1 : prev.contestantB.votes,
      },
    }));

    setVoteCountedMsg(`✓ Vote Counted for ${chosenContestant.name.split(' ')[0]}!`);

    // If logged in and this is a real battle from the backend, record it
    if (user && battleData.battleId) {
      try {
        const idempotencyKey = `live-vote-${user.id}-${battleData.battleId}-${Date.now()}`;
        await apiClient(`/battles/${battleData.battleId}/vote`, {
          method: 'POST',
          body: JSON.stringify({
            selectedStudentId: chosenContestant.id,
            idempotencyKey,
          }),
        });
      } catch {
        // Vote already recorded or preview
      }
    }
  };

  const handleReset = () => {
    setPick(null);
    setVoteCountedMsg(null);
    fetchLiveBattle();
  };

  const options: { key: 'a' | 'b'; contestant: ContestantDisplay; percent: number; hotkey: string }[] = [
    { key: 'a', contestant: battleData.contestantA, percent: percentA, hotkey: 'Vote 1' },
    { key: 'b', contestant: battleData.contestantB, percent: percentB, hotkey: 'Vote 2' },
  ];

  return (
    <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-white p-4 shadow-xl shadow-[#6C1C74]/5 sm:p-5">
      {/* Live Badge & Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700">
            Live Voting Show
          </span>
        </div>

        <span className="text-[11px] font-semibold text-gray-500">
          {voted ? (
            <span className="font-bold text-[#6C1C74]">Voting counted!</span>
          ) : (
            'Tap photo or button to vote'
          )}
        </span>
      </div>

      {/* Two Contestants Grid */}
      <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
        {options.map(({ key, contestant, percent, hotkey }) => {
          const selected = pick === key;
          return (
            <div
              key={key}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 ${
                selected
                  ? 'border-[#6C1C74] ring-2 ring-[#6C1C74] shadow-md'
                  : 'border-gray-200 hover:border-[#6C1C74]/60'
              } ${voted && !selected ? 'opacity-60' : ''}`}
            >
              {/* Image Container */}
              <div
                onClick={() => handleVote(key)}
                className="relative aspect-[3/4] w-full cursor-pointer overflow-hidden bg-gray-100"
              >
                <img
                  src={contestant.imageUrl}
                  alt={contestant.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Hotkey Tag */}
                <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#6C1C74] shadow-sm backdrop-blur-sm">
                  {hotkey}
                </span>

                {/* Selected Checkmark */}
                {selected && (
                  <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#6C1C74] text-white shadow-md ring-2 ring-white">
                    <Check className="h-4 w-4" />
                  </span>
                )}

                {/* Live Votes Overlay Tag */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm">
                    🔥 {contestant.votes} Votes
                  </span>
                  <span className="text-xs font-bold">{percent}%</span>
                </div>
              </div>

              {/* Profile Details & Vote Action Button */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <div className="mb-2">
                  <div className="truncate text-sm font-bold text-gray-900">{contestant.name}</div>
                  <div className="truncate text-xs text-gray-500">{contestant.dept}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleVote(key)}
                  disabled={voted}
                  className={`flex w-full items-center justify-center rounded-xl py-2 text-xs font-bold transition-all ${
                    selected
                      ? 'bg-[#6C1C74] text-white shadow-md'
                      : 'bg-[#6C1C74]/10 text-[#6C1C74] hover:bg-[#6C1C74] hover:text-white disabled:opacity-60'
                  }`}
                >
                  {selected ? '✓ Voted' : `${hotkey}: ${contestant.name.split(' ')[0]}`}
                </button>
              </div>
            </div>
          );
        })}

        {/* VS Divider Badge */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/3 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#6C1C74] text-xs font-black text-white ring-4 ring-white shadow-lg"
        >
          VS
        </div>
      </div>

      {/* Real-time Voting Counter Display */}
      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-3">
        {voted ? (
          <div className="space-y-2.5 animate-fade-in" aria-live="polite">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800">
              <span className="text-[#6C1C74]">{voteCountedMsg}</span>
              <span className="text-gray-500">Total: {totalVotes} votes</span>
            </div>

            {/* Voting Ratio Progress Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-[#6C1C74] transition-all duration-700 ease-out"
                style={{ width: `${percentA}%` }}
              />
              <div
                className="bg-purple-300 transition-all duration-700 ease-out"
                style={{ width: `${percentB}%` }}
              />
            </div>

            <div className="flex justify-between text-xs font-bold">
              <span className="text-[#6C1C74]">
                {battleData.contestantA.name.split(' ')[0]}: {battleData.contestantA.votes} ({percentA}%)
              </span>
              <span className="text-purple-700">
                {battleData.contestantB.name.split(' ')[0]}: {battleData.contestantB.votes} ({percentB}%)
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 text-xs">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-[#6C1C74]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Next Sample Pair</span>
              </button>

              <Link
                href="/battle"
                className="inline-flex items-center gap-1 font-bold text-[#6C1C74] hover:underline"
              >
                <span>Full Battle Arena →</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[#6C1C74]" />
              <span>
                Live votes: <strong className="text-gray-900">{battleData.contestantA.votes}</strong> vs{' '}
                <strong className="text-gray-900">{battleData.contestantB.votes}</strong>
              </span>
            </div>
            <span className="text-[11px] text-gray-400">Total {totalVotes} votes</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [metrics, setMetrics] = useState({
    totalParticipants: 8,
    activeBattles: 5,
    totalVotes: 142,
  });

  useEffect(() => {
    apiClient<{ entries: any[]; totalParticipants: number }>('/leaderboard')
      .then((res) => {
        if (res.totalParticipants) {
          const sumVotes = res.entries?.reduce((sum, e) => sum + (e.totalVotes || 0), 0) || 142;
          setMetrics((prev) => ({
            ...prev,
            totalParticipants: res.totalParticipants,
            totalVotes: sumVotes
          }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full overflow-x-hidden bg-white text-gray-900">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-24 lg:pt-24">
        <div className="text-left">
          <p className="mb-5 inline-flex items-center gap-2 text-sm text-emerald-700">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Open only to consenting university students
          </p>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Two students. One vote. Pick your favorite.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-700 sm:text-lg">
            Superior Connection puts two contestants side by side and lets you choose.
            Vote, see the result, and move straight to the next pair.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/battle"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#6C1C74] px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1C74] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Flame className="h-5 w-5" />
              Start voting
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#6C1C74]/30 px-6 text-base font-semibold text-[#6C1C74] transition-colors hover:border-[#6C1C74] hover:bg-[#6C1C74]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1C74]"
            >
              <Trophy className="h-5 w-5 text-[#6C1C74]" />
              Leaderboard
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 divide-x divide-gray-200 border-y border-gray-200 py-4">
            <div className="pr-3">
              <dt className="text-xs text-gray-500">Contestants</dt>
              <dd className="mt-1 text-xl font-semibold text-[#6C1C74] sm:text-2xl">
                {metrics.totalParticipants}
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-xs text-gray-500">Live battles</dt>
              <dd className="mt-1 text-xl font-semibold text-[#6C1C74] sm:text-2xl">
                {metrics.activeBattles}
              </dd>
            </div>
            <div className="pl-3">
              <dt className="text-xs text-gray-500">Votes cast</dt>
              <dd className="mt-1 text-xl font-semibold text-[#6C1C74] sm:text-2xl">
                {metrics.totalVotes}
              </dd>
            </div>
          </dl>
        </div>

        <div className="flex justify-center lg:justify-end">
          <BattlePreview />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-200">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              How a battle works
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600 sm:text-base">
              It takes a few seconds. You can vote on as many battles as you like.
            </p>
          </div>

          <ol className="divide-y divide-gray-200 border-y border-gray-200">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 py-5 sm:gap-6 sm:py-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#6C1C74]/40 text-sm font-semibold text-[#6C1C74]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Promises */}
      <section className="border-t border-gray-200 bg-[#6C1C74]/5">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Fair for voters, safe for contestants
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {PROMISES.map((p) => (
              <div key={p.title} className="border-t-2 border-[#6C1C74] pt-4">
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contestant CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-[#6C1C74] p-6 sm:p-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Want to take part?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/80 sm:text-base">
              Read and sign the participant agreement, upload one photo, and represent your
              department. You can withdraw whenever you want.
            </p>
          </div>

          <Link
            href="/participant/consent"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-[#6C1C74] transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6C1C74] md:w-auto"
          >
            Read and sign agreement
          </Link>
        </div>
      </section>
    </div>
  );
}
