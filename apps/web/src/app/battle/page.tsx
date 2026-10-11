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

interface StageCardProps {
  contestant: Contestant;
  hotkey: string;
  selected: boolean;
  dimmed: boolean;
  disabled: boolean;
  submitting: boolean;
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
  onVote,
  onReport,
}: StageCardProps) {
  const firstName = contestant.displayName.split(' ')[0];

  return (
    <article
      className={`relative aspect-[2/3] min-w-0 overflow-hidden rounded-2xl bg-[#17171d] transition-opacity duration-200 sm:aspect-[3/4] ${
        selected ? 'ring-2 ring-[#ff4d8d]' : ''
      } ${dimmed ? 'opacity-50' : ''}`}
    >
      <img
        src={getImageUrl(contestant.imageUrl)}
        alt={contestant.displayName}
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      <button
        type="button"
        onClick={onReport}
        aria-label={`Report ${contestant.displayName}`}
        title="Report contestant"
        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/75 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <Flag className="h-4 w-4" />
      </button>

      <span className="absolute left-2 top-2 hidden h-7 min-w-7 items-center justify-center rounded-md bg-black/55 px-2 text-xs font-semibold text-white backdrop-blur-sm sm:flex">
        {hotkey}
      </span>

      {selected && (
        <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#ff4d8d] text-white sm:left-12">
          <Check className="h-4 w-4" />
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-5">
        <h3 className={`${DISPLAY} truncate text-base font-semibold leading-tight text-white sm:text-3xl`}>
          {contestant.displayName}
        </h3>
        {contestant.department && (
          <p className="mt-0.5 truncate text-xs text-white/70 sm:text-sm">{contestant.department}</p>
        )}

        <button
          type="button"
          onClick={onVote}
          disabled={disabled}
          className={`mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors sm:mt-3 sm:min-h-11 sm:px-3 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed ${
            selected
              ? 'bg-[#ff4d8d] text-white'
              : 'bg-white text-black enabled:hover:bg-white/90 disabled:opacity-60'
          }`}
        >
          <span className="truncate">
            {submitting && selected ? 'Saving vote...' : `Vote ${firstName}`}
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

    const idempotencyKey = `vote-${user.id}-${currentBattle.id}-${Date.now()}`;

    try {
      await apiClient(`/battles/${currentBattle.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({
          selectedStudentId: contestantId,
          idempotencyKey
        })
      });

      // INSTANT TRANSITION: If we have a prefetched battle ready, render immediately
      if (prefetchedBattle && prefetchedBattle.id !== currentBattle.id) {
        setCurrentBattle(prefetchedBattle);
        setPrefetchedBattle(null);
        setSelectedContestantId(null);
        setIsSubmittingVote(false);
        // Pre-fetch the subsequent battle in the background
        fetchNextBattle(false);
      } else {
        // Otherwise fetch fresh next battle
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
      className={`${displayFont.variable} ${bodyFont.variable} mx-auto w-full max-w-4xl flex-1 overflow-x-hidden px-2 py-6 font-[family-name:var(--font-body)] sm:px-6 sm:py-12`}
    >
      {/* Header */}
      <header className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
        <div>
          <h1 className={`${DISPLAY} text-3xl font-semibold tracking-tight text-white sm:text-5xl`}>
            Who is more beautiful and attractive?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/60 sm:text-base">
            Pick the one you find more beautiful, attractive and sharp. The next pair loads right away.
          </p>
        </div>
        <p className="hidden shrink-0 items-center gap-1.5 text-xs text-white/50 md:flex">
          Keys
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-white">1</kbd>
          <kbd className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-white">2</kbd>
        </p>
      </header>

      {/* Voting Error Banner */}
      {votingError && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3.5 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <span>{votingError}</span>
          </div>
          {!user && (
            <Link
              href="/login"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-black hover:bg-white/90"
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
              className="aspect-[2/3] animate-pulse rounded-2xl bg-[#17171d] sm:aspect-[3/4]"
            />
          ))}
        </div>
      ) : hasNoMoreBattles ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#14141a] px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-9 w-9 text-[#ff4d8d]" />
          <h2 className={`${DISPLAY} mt-4 text-2xl font-semibold text-white sm:text-3xl`}>
            You've voted on every battle
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/60">
            There are no more pairs for now. Check again later, or see how the contestants rank.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => fetchNextBattle(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
              Check for new battles
            </button>
            <Link
              href="/leaderboard"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white px-5 text-sm font-semibold text-black hover:bg-white/90"
            >
              View leaderboard
            </Link>
          </div>
        </div>
      ) : currentBattle ? (
        <div className="relative grid grid-cols-2 gap-2 sm:gap-4">
          <StageCard
            contestant={currentBattle.contestantA}
            hotkey="1"
            selected={selectedContestantId === currentBattle.contestantA.id}
            dimmed={isSubmittingVote && selectedContestantId !== currentBattle.contestantA.id}
            submitting={isSubmittingVote}
            disabled={isSubmittingVote}
            onVote={() => handleVote(currentBattle.contestantA.id)}
            onReport={() =>
              openReport('STUDENT', currentBattle.contestantA.id, currentBattle.contestantA.displayName)
            }
          />

          <div
            aria-hidden="true"
            className={`${DISPLAY} pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#0b0b0f] text-[10px] font-bold text-white ring-4 ring-[#0b0b0f] sm:h-14 sm:w-14 sm:text-base`}
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
            onVote={() => handleVote(currentBattle.contestantB.id)}
            onReport={() =>
              openReport('STUDENT', currentBattle.contestantB.id, currentBattle.contestantB.displayName)
            }
          />
        </div>
      ) : null}

      {/* Comments */}
      {currentBattle && (
        <section className="mt-12 max-w-2xl border-t border-white/10 pt-8 sm:mt-16">
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-white/60" />
            <h2 className={`${DISPLAY} text-xl font-semibold text-white`}>Discussion</h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
              {comments.length}
            </span>
          </div>

          <form onSubmit={handlePostComment} className="mb-6">
            {commentError && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-red-400/25 bg-red-500/10 p-2.5 text-sm text-red-200"
              >
                {commentError}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder={user ? 'Add a comment. Keep it kind.' : 'Sign in to comment'}
                disabled={!user || isPostingComment}
                aria-label="Write a comment"
                className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-[#14141a] px-4 text-base text-white placeholder-white/35 focus:border-white/40 focus:outline-none disabled:opacity-50 sm:text-sm"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!user || !newCommentText.trim() || isPostingComment}
                aria-label="Post comment"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Post</span>
              </button>
            </div>
          </form>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {comments.length === 0 && !commentsLoading ? (
              <p className="py-8 text-center text-sm text-white/50">
                No comments yet. Start the discussion.
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        {comment.authorName}
                      </span>
                      <span className="shrink-0 text-xs text-white/40">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center">
                      {comment.isOwner && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          aria-label="Delete comment"
                          title="Delete comment"
                          className="flex h-9 w-9 items-center justify-center rounded-md text-white/40 transition-colors hover:text-red-300"
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
                        className="flex h-9 w-9 items-center justify-center rounded-md text-white/40 transition-colors hover:text-white"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-1 break-words text-sm leading-relaxed text-white/75">
                    {comment.body}
                  </p>
                </div>
              ))
            )}
          </div>

          {hasMoreComments && (
            <div className="pt-5">
              <button
                type="button"
                onClick={() => currentBattle && fetchComments(currentBattle.id, commentsCursor || undefined)}
                disabled={commentsLoading}
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/5 disabled:opacity-50"
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