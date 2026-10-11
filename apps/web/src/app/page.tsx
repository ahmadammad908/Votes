'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, Trophy, ShieldCheck, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';

type Pick = 'a' | 'b' | null;

const DEMO = {
  a: { name: 'Contestant A', dept: 'Computer Science', votes: 58 },
  b: { name: 'Contestant B', dept: 'Architecture', votes: 42 },
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

function Avatar({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-surface-200 to-surface-100 text-3xl font-bold text-white/30 sm:text-4xl">
      {label}
    </div>
  );
}

function BattlePreview() {
  const [pick, setPick] = useState<Pick>(null);
  const voted = pick !== null;

  const options: { key: 'a' | 'b'; initial: string }[] = [
    { key: 'a', initial: 'A' },
    { key: 'b', initial: 'B' },
  ];

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-100 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between px-1 text-xs text-gray-400">
        <span>Try a sample battle</span>
        <span>{voted ? 'Vote recorded' : 'Tap to vote'}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {options.map(({ key, initial }) => {
          const c = DEMO[key];
          const selected = pick === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setPick(key)}
              disabled={voted}
              aria-pressed={selected}
              className={`group relative overflow-hidden rounded-xl border text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink ${
                selected
                  ? 'border-brand-pink'
                  : 'border-white/10 enabled:hover:border-white/30'
              } ${voted && !selected ? 'opacity-60' : ''}`}
            >
              <div className="aspect-[3/4] w-full">
                <Avatar label={initial} />
              </div>
              <div className="border-t border-white/10 bg-surface-200/60 px-3 py-2.5">
                <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                <div className="truncate text-xs text-gray-400">{c.dept}</div>
              </div>

              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-pink text-white">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 px-1">
        {voted ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="bg-brand-pink transition-all duration-500"
                style={{ width: `${DEMO.a.votes}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-300">
              <span>{DEMO.a.votes}% A</span>
              <span>{DEMO.b.votes}% B</span>
            </div>
            <button
              type="button"
              onClick={() => setPick(null)}
              className="text-xs text-gray-400 underline underline-offset-4 hover:text-white"
            >
              Reset sample
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Sample data. Real battles use real contestants.</p>
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
          setMetrics((prev) => ({ ...prev, totalParticipants: res.totalParticipants }));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-24 lg:pt-24">
        <div className="text-left">
          <p className="mb-5 inline-flex items-center gap-2 text-sm text-emerald-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Open only to consenting university students
          </p>

          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Two students. One vote. Pick your favorite.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg">
            Campus Beauty Battles puts two contestants side by side and lets you choose.
            Vote, see the result, and move straight to the next pair.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/battle"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-pink px-6 text-base font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <Flame className="h-5 w-5" />
              Start voting
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/15 px-6 text-base font-semibold text-gray-100 transition-colors hover:border-white/30 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Trophy className="h-5 w-5 text-brand-gold" />
              Leaderboard
            </Link>
          </div>

          <dl className="mt-12 grid max-w-md grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-4">
            <div className="pr-3">
              <dt className="text-xs text-gray-400">Contestants</dt>
              <dd className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                {metrics.totalParticipants}
              </dd>
            </div>
            <div className="px-3">
              <dt className="text-xs text-gray-400">Live battles</dt>
              <dd className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                {metrics.activeBattles}
              </dd>
            </div>
            <div className="pl-3">
              <dt className="text-xs text-gray-400">Votes cast</dt>
              <dd className="mt-1 text-xl font-semibold text-white sm:text-2xl">
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
      <section className="border-t border-white/10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-24">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              How a battle works
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-400 sm:text-base">
              It takes a few seconds. You can vote on as many battles as you like.
            </p>
          </div>

          <ol className="divide-y divide-white/10 border-y border-white/10">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 py-5 sm:gap-6 sm:py-6">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-gray-200">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Promises */}
      <section className="border-t border-white/10 bg-surface-100/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Fair for voters, safe for contestants
          </h2>

          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
            {PROMISES.map((p) => (
              <div key={p.title} className="border-t border-brand-pink/60 pt-4">
                <h3 className="text-base font-semibold text-white sm:text-lg">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contestant CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-white/10 bg-surface-100 p-6 sm:p-10 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Want to take part?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-300 sm:text-base">
              Read and sign the participant agreement, upload one photo, and represent your
              department. You can withdraw whenever you want.
            </p>
          </div>

          <Link
            href="/participant/consent"
            className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-black transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black md:w-auto"
          >
            Read and sign agreement
          </Link>
        </div>
      </section>
    </div>
  );
}