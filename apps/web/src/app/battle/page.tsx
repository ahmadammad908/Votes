'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { apiClient, getImageUrl } from '@/lib/api';
import { displayFont, bodyFont } from '@/lib/fonts';
import {
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Flag,
  Trash2,
  Check,
} from 'lucide-react';
import { BattleDTO, CommentDTO, CommentsListResponseDTO, NextBattleResponseDTO } from '@campusface/shared';
import { ReportModal } from '@/components/ReportModal';

type Contestant = BattleDTO['contestantA'];

const DISPLAY = 'font-[family-name:var(--font-display)]';
const COMMENT_MAX = 500;

function getInitial(name?: string | null) {
  return (name?.trim().charAt(0) || '?').toUpperCase();
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(diff)) return '';
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

function CommentAvatar({ name, highlight = false }: { name?: string | null; highlight?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
        highlight ? 'bg-[#6C1C74] text-white' : 'bg-[#6C1C74]/10 text-[#6C1C74]'
      }`}
    >
      {getInitial(name)}
    </div>
  );
}

interface StageCardProps {
  contestant: Contestant;
  hotkey: string;
  selected: boolean;
  dimmed: boolean;
  disabled: boolean;
  submitting: boolean;
  voteCount?: number;
  totalVotes?: number;
  onVote: () => void;
  onReport: () => void;
}

function StageCard({
  contestant,
  hotkey,
  selected,
  dimmed,
  disabled,
  submitting,
  voteCount,
  totalVotes,
  onVote,
  onReport,
}: StageCardProps) {
  const firstName = contestant.displayName.split(' ')[0];
  const percent = totalVotes && totalVotes > 0 ? Math.round(((voteCount ?? contestant.votes ?? 0) / totalVotes) * 100) : null;

  return (
    <article
      className={`relative aspect-[2/3] min-w-0 overflow-hidden rounded-2xl bg-gray-100 shadow-md transition-opacity duration-200 sm:aspect-[3/4] ${
        selected ? 'ring-4 ring-[#6C1C74]' : 'ring-1 ring-gray-200'
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <img
        src={getImageUrl(contestant.imageUrl)}
        alt={contestant.displayName}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#6C1C74]/95 via-[#6C1C74]/50 to-transparent" />

      <button
        type="button"
        onClick={onReport}
        aria-label={`Report ${contestant.displayName}`}
        title="Report contestant"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#6C1C74] shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1C74]"
      >
        <Flag className="h-4 w-4" />
      </button>

      <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-md bg-white/90 px-2 text-xs font-semibold text-[#6C1C74] shadow-sm backdrop-blur-sm">
        Vote {hotkey}
      </span>

      {selected && (
        <span className="absolute left-20 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#6C1C74] text-white ring-2 ring-white">
          <Check className="h-4 w-4" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-5">
        <h3 className={`${DISPLAY} truncate text-base font-semibold leading-tight text-white sm:text-3xl`}>
          {contestant.displayName}
        </h3>
        {contestant.department && (
          <p className="mt-0.5 truncate text-xs text-white/80 sm:text-sm">{contestant.department}</p>
        )}

        {/* Live Vote Display */}
        <div className="mt-1.5 flex items-center justify-between text-xs font-bold text-white">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5 text-[11px] backdrop-blur-sm">
            🔥 {voteCount ?? contestant.votes ?? 0} Votes
          </span>
          {percent !== null && (
            <span className="text-[11px] text-white/90 font-bold">{percent}%</span>
          )}
        </div>

        <button
          type="button"
          onClick={onVote}
          disabled={disabled}
          className={`mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors sm:mt-3 sm:min-h-11 sm:px-3 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6C1C74] disabled:cursor-not-allowed ${
            selected
              ? 'bg-white text-[#6C1C74] font-bold shadow-md'
              : 'bg-white text-[#6C1C74] enabled:hover:bg-white/90 disabled:opacity-60'
          }`}
        >
          <span className="truncate">
            {submitting && selected ? '✓ Vote counted!' : `Vote ${hotkey}: ${firstName}`}
          </span>
        </button>
      </div>
    </article>
  );
}

export default function BattlePage() {
  const { user } = useAuth();

  // Battle State
  const [currentBattle, setCurrentBattle] = useState<BattleDTO | null>(null);
  const [prefetchedBattle, setPrefetchedBattle] = useState<BattleDTO | null>(null);
  const [isLoadingBattle, setIsLoadingBattle] = useState(true);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [selectedContestantId, setSelectedContestantId] = useState<string | null>(null);
  const [votingError, setVotingError] = useState<string | null>(null);
  const [hasNoMoreBattles, setHasNoMoreBattles] = useState(false);

  // Comments State
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCursor, setCommentsCursor] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'COMMENT' | 'STUDENT' | 'BATTLE'; id: string; name?: string }>({
    type: 'STUDENT',
    id: ''
  });

  // Fetch Next Battle
  const fetchNextBattle = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoadingBattle(true);
    setVotingError(null);

    try {
      const data = await apiClient<NextBattleResponseDTO>('/battles/next');
      if (!data.battle) {
        setHasNoMoreBattles(true);
        setCurrentBattle(null);
      } else {
        setHasNoMoreBattles(false);
        setCurrentBattle(data.battle);
        if (data.prefetchedNextBattle) {
          setPrefetchedBattle(data.prefetchedNextBattle);
        }
      }
    } catch (err: any) {
      setVotingError(err.message || 'Failed to load battles');
    } finally {
      setIsLoadingBattle(false);
    }
  }, []);

  // Fetch comments for active battle
  const fetchComments = useCallback(async (battleId: string, cursor?: string) => {
    setCommentsLoading(true);
    try {
      const endpoint = cursor
        ? `/battles/${battleId}/comments?cursor=${cursor}`
        : `/battles/${battleId}/comments`;
      const data = await apiClient<CommentsListResponseDTO>(endpoint);

      if (cursor) {
        setComments((prev) => [...prev, ...data.comments]);
      } else {
        setComments(data.comments);
      }
      setCommentsCursor(data.nextCursor);
      setHasMoreComments(data.hasMore);
    } catch (err) {
      // Non-critical, ignore or log
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNextBattle(true);
  }, [fetchNextBattle]);

  // When currentBattle changes, fetch comments independently
  useEffect(() => {
    if (currentBattle?.id) {
      setComments([]);
      setCommentsCursor(null);
      fetchComments(currentBattle.id);
    }
  }, [currentBattle?.id, fetchComments]);

  // Cast Vote Handler with idempotency & instant transition
  const handleVote = async (contestantId: string) => {
    if (!currentBattle || isSubmittingVote) return;

    if (!user) {
      setVotingError('Please register or sign in with your university account to cast a vote.');
      return;
    }

    setIsSubmittingVote(true);
    setSelectedContestantId(contestantId);
    setVotingError(null);

    // Optimistically increment live vote in UI
    setCurrentBattle((prev) => {
      if (!prev) return null;
      const isA = contestantId === prev.contestantA.id;
      return {
        ...prev,
        votesA: isA ? (prev.votesA ?? 0) + 1 : prev.votesA,
        votesB: !isA ? (prev.votesB ?? 0) + 1 : prev.votesB,
        totalVotes: (prev.totalVotes ?? 0) + 1,
        contestantA: {
          ...prev.contestantA,
          votes: isA ? (prev.contestantA.votes ?? 0) + 1 : prev.contestantA.votes
        },
        contestantB: {
          ...prev.contestantB,
          votes: !isA ? (prev.contestantB.votes ?? 0) + 1 : prev.contestantB.votes
        }
      };
    });

    const idempotencyKey = `vote-${user.id}-${currentBattle.id}-${Date.now()}`;

    try {
      await apiClient(`/battles/${currentBattle.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({
          selectedStudentId: contestantId,
          idempotencyKey
        })
      });

      // Brief delay so user sees "Vote Counted" animation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // TRANSITION: If we have a prefetched battle ready, render immediately
      if (prefetchedBattle && prefetchedBattle.id !== currentBattle.id) {
        setCurrentBattle(prefetchedBattle);
        setPrefetchedBattle(null);
        setSelectedContestantId(null);
        setIsSubmittingVote(false);
        fetchNextBattle(false);
      } else {
        await fetchNextBattle(false);
        setSelectedContestantId(null);
        setIsSubmittingVote(false);
      }
    } catch (err: any) {
      setIsSubmittingVote(false);
      setSelectedContestantId(null);
      setVotingError(err.message || 'Failed to submit vote. Please try again.');
    }
  };

  // Keyboard Navigation: '1' or Left for contestant A, '2' or Right for contestant B
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        !currentBattle ||
        isSubmittingVote
      ) {
        return;
      }

      if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleVote(currentBattle.contestantA.id);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleVote(currentBattle.contestantB.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentBattle, isSubmittingVote]);

  // Post Comment Handler
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBattle || !newCommentText.trim() || isPostingComment) return;

    if (!user) {
      setCommentError('Please sign in to post a comment.');
      return;
    }

    setIsPostingComment(true);
    setCommentError(null);

    try {
      const res = await apiClient<{ comment: CommentDTO }>(`/battles/${currentBattle.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: newCommentText })
      });

      setComments((prev) => [res.comment, ...prev]);
      setNewCommentText('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete Comment Handler
  const handleDeleteComment = async (commentId: string) => {
    if (!currentBattle) return;
    try {
      await apiClient(`/battles/${currentBattle.id}/comments/${commentId}`, {
        method: 'DELETE'
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete comment');
    }
  };

  const openReport = (type: 'COMMENT' | 'STUDENT' | 'BATTLE', id: string, name?: string) => {
    setReportTarget({ type, id, name });
    setReportModalOpen(true);
  };

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} mx-auto w-full max-w-4xl flex-1 overflow-x-hidden bg-white px-2 py-6 font-[family-name:var(--font-body)] text-gray-900 sm:px-6 sm:py-12`}
    >
      {/* Header */}
      <header className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className={`${DISPLAY} text-3xl font-semibold tracking-tight text-[#6C1C74] sm:text-5xl`}>
            Who is more beautiful and attractive?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
            Pick the one you find more beautiful, attractive and sharp. The next pair loads right away.
          </p>
        </div>
        <p className="hidden shrink-0 items-center gap-1.5 text-xs text-gray-500 md:flex">
          Keys
          <kbd className="rounded border border-[#6C1C74]/30 bg-[#6C1C74]/5 px-1.5 py-0.5 font-sans text-[#6C1C74]">1</kbd>
          <kbd className="rounded border border-[#6C1C74]/30 bg-[#6C1C74]/5 px-1.5 py-0.5 font-sans text-[#6C1C74]">2</kbd>
        </p>
      </header>

      {/* Voting Error Banner */}
      {votingError && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <span>{votingError}</span>
          </div>
          {!user && (
            <Link
              href="/login"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#6C1C74] px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Main Battle Area */}
      {isLoadingBattle ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[2/3] animate-pulse rounded-2xl bg-[#6C1C74]/10 sm:aspect-[3/4]"
            />
          ))}
        </div>
      ) : hasNoMoreBattles ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-9 w-9 text-[#6C1C74]" />
          <h2 className={`${DISPLAY} mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl`}>
            You've voted on every battle
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-gray-600">
            There are no more pairs for now. Check again later, or see how the contestants rank.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => fetchNextBattle(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#6C1C74]/30 px-5 text-sm font-semibold text-[#6C1C74] transition-colors hover:bg-[#6C1C74]/5"
            >
              <RefreshCw className="h-4 w-4" />
              Check for new battles
            </button>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#6C1C74] px-5 text-sm font-semibold text-white hover:opacity-90"
            >
              View leaderboard
            </Link>
          </div>
        </div>
      ) : currentBattle ? (
        <div className="space-y-4">
          {/* Live Duel Bar */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-800">
              <span className="flex items-center gap-1.5 text-[#6C1C74]">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span>LIVE BATTLE VOTES</span>
              </span>
              <span className="text-gray-500">
                Total: {(currentBattle.totalVotes ?? ((currentBattle.votesA ?? 0) + (currentBattle.votesB ?? 0)))} votes cast
              </span>
            </div>

            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="bg-[#6C1C74] transition-all duration-500"
                style={{
                  width: `${
                    (currentBattle.votesA || 0) + (currentBattle.votesB || 0) > 0
                      ? Math.round(
                          ((currentBattle.votesA || 0) /
                            ((currentBattle.votesA || 0) + (currentBattle.votesB || 0))) *
                            100
                        )
                      : 50
                  }%`
                }}
              />
              <div
                className="bg-purple-300 transition-all duration-500"
                style={{
                  width: `${
                    (currentBattle.votesA || 0) + (currentBattle.votesB || 0) > 0
                      ? 100 -
                        Math.round(
                          ((currentBattle.votesA || 0) /
                            ((currentBattle.votesA || 0) + (currentBattle.votesB || 0))) *
                            100
                        )
                      : 50
                  }%`
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs font-bold">
              <span className="text-[#6C1C74]">
                {currentBattle.contestantA.displayName.split(' ')[0]}: {currentBattle.votesA ?? 0} votes
              </span>
              <span className="text-purple-700">
                {currentBattle.contestantB.displayName.split(' ')[0]}: {currentBattle.votesB ?? 0} votes
              </span>
            </div>
          </div>

          <div className="relative grid grid-cols-2 gap-2 sm:gap-4">
            <StageCard
              contestant={currentBattle.contestantA}
              hotkey="1"
              selected={selectedContestantId === currentBattle.contestantA.id}
              dimmed={isSubmittingVote && selectedContestantId !== currentBattle.contestantA.id}
              submitting={isSubmittingVote}
              disabled={isSubmittingVote}
              voteCount={currentBattle.votesA ?? currentBattle.contestantA.votes ?? 0}
              totalVotes={(currentBattle.votesA ?? 0) + (currentBattle.votesB ?? 0)}
              onVote={() => handleVote(currentBattle.contestantA.id)}
              onReport={() =>
                openReport('STUDENT', currentBattle.contestantA.id, currentBattle.contestantA.displayName)
              }
            />

            <div
              aria-hidden="true"
              className={`${DISPLAY} pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#6C1C74] text-[10px] font-bold text-white ring-4 ring-white sm:h-14 sm:w-14 sm:text-base`}
            >
              VS
            </div>

            <StageCard
              contestant={currentBattle.contestantB}
              hotkey="2"
              selected={selectedContestantId === currentBattle.contestantB.id}
              dimmed={isSubmittingVote && selectedContestantId !== currentBattle.contestantB.id}
              submitting={isSubmittingVote}
              disabled={isSubmittingVote}
              voteCount={currentBattle.votesB ?? currentBattle.contestantB.votes ?? 0}
              totalVotes={(currentBattle.votesA ?? 0) + (currentBattle.votesB ?? 0)}
              onVote={() => handleVote(currentBattle.contestantB.id)}
              onReport={() =>
                openReport('STUDENT', currentBattle.contestantB.id, currentBattle.contestantB.displayName)
              }
            />
          </div>
        </div>
      ) : null}

      {/* Comments */}
      {currentBattle && (
        <section className="mt-12 w-full sm:mt-16">
          {/* Section header */}
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6C1C74] text-white">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className={`${DISPLAY} text-xl font-semibold text-gray-900 sm:text-2xl`}>
                  Discussion
                </h2>
                <span className="rounded-full bg-[#6C1C74]/10 px-2.5 py-0.5 text-xs font-semibold text-[#6C1C74]">
                  {comments.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 sm:text-sm">Share your thoughts on this battle.</p>
            </div>
          </div>

          {/* Composer */}
          <form
            onSubmit={handlePostComment}
            className="mb-6 rounded-2xl border border-[#6C1C74]/20 bg-[#6C1C74]/[0.03] p-3 sm:p-4"
          >
            {commentError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700"
              >
                {commentError}
              </div>
            )}

            <div className="flex gap-3">
              <CommentAvatar name={user?.email} highlight={!!user} />

              <div className="min-w-0 flex-1">
                <textarea
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={user ? 'Add a comment. Keep it kind.' : 'Sign in to comment'}
                  disabled={!user || isPostingComment}
                  aria-label="Write a comment"
                  rows={2}
                  maxLength={COMMENT_MAX}
                  className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 placeholder-gray-400 focus:border-[#6C1C74] focus:outline-none focus:ring-1 focus:ring-[#6C1C74] disabled:bg-gray-50 disabled:opacity-60 sm:text-sm"
                />

                <div className="mt-2 flex items-center justify-between gap-3">
                  {user ? (
                    <span className="text-xs text-gray-400">
                      {newCommentText.length}/{COMMENT_MAX}
                    </span>
                  ) : (
                    <Link
                      href="/login"
                      className="text-xs font-semibold text-[#6C1C74] underline underline-offset-4 hover:opacity-80"
                    >
                      Sign in to join the discussion
                    </Link>
                  )}

                  <button
                    type="submit"
                    disabled={!user || !newCommentText.trim() || isPostingComment}
                    aria-label="Post comment"
                    className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#6C1C74] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isPostingComment ? 'Posting...' : 'Post'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Comments list */}
          {comments.length === 0 && !commentsLoading ? (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#6C1C74]/10 text-[#6C1C74]">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-gray-900">No comments yet</p>
              <p className="mt-1 text-sm text-gray-500">Be the first to start the discussion.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li key={comment.id} className="flex gap-3">
                  <CommentAvatar name={comment.authorName} highlight={comment.isOwner} />

                  <div
                    className={`min-w-0 flex-1 rounded-2xl rounded-tl-sm border px-4 py-3 ${
                      comment.isOwner
                        ? 'border-[#6C1C74]/25 bg-[#6C1C74]/[0.06]'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="truncate text-sm font-semibold text-gray-900">
                          {comment.authorName}
                        </span>
                        {comment.isOwner && (
                          <span className="rounded-full bg-[#6C1C74] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            You
                          </span>
                        )}
                        <span className="shrink-0 text-xs text-gray-400">
                          {formatTime(comment.createdAt)}
                        </span>
                      </div>

                      <div className="-mr-2 flex shrink-0 items-center">
                        {comment.isOwner && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            aria-label="Delete comment"
                            title="Delete comment"
                            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            openReport('COMMENT', comment.id, `Comment by ${comment.authorName}`)
                          }
                          aria-label="Report comment"
                          title="Report comment"
                          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-[#6C1C74]/10 hover:text-[#6C1C74]"
                        >
                          <Flag className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-700">
                      {comment.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {commentsLoading && comments.length === 0 && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#6C1C74]/10" />
                  <div className="h-16 flex-1 animate-pulse rounded-2xl bg-[#6C1C74]/5" />
                </div>
              ))}
            </div>
          )}

          {hasMoreComments && (
            <div className="pt-5 text-center">
              <button
                type="button"
                onClick={() => currentBattle && fetchComments(currentBattle.id, commentsCursor || undefined)}
                disabled={commentsLoading}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#6C1C74]/30 px-6 text-sm font-semibold text-[#6C1C74] transition-colors hover:bg-[#6C1C74]/5 disabled:opacity-50"
              >
                {commentsLoading ? 'Loading...' : 'Load more comments'}
              </button>
            </div>
          )}
        </section>
      )}

      {/* Reporting Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType={reportTarget.type}
        targetId={reportTarget.id}
        targetName={reportTarget.name}
      />
    </div>
  );
}