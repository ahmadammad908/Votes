export type UserRole = 'STUDENT' | 'MODERATOR' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type ConsentStatus = 'PENDING' | 'ACTIVE' | 'WITHDRAWN';
export type ProfileStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED' | 'REMOVED';
export type BattleStatus = 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
export type ModerationStatus = 'VISIBLE' | 'HIDDEN' | 'REMOVED' | 'FLAGGED';
export type ReportTargetType = 'COMMENT' | 'STUDENT' | 'BATTLE';
export type ReportStatus = 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
}

export interface StudentProfileDTO {
  id: string;
  userId?: string | null;
  email?: string | null;
  displayName: string;
  department: string | null;
  imageUrl: string;
  consentStatus: ConsentStatus;
  consentRecordedAt: string | null;
  profileStatus: ProfileStatus;
  totalVotes?: number;
  rank?: number;
  createdAt: string;
}

export interface ContestantSummaryDTO {
  id: string;
  displayName: string;
  department: string | null;
  imageUrl: string;
  votes?: number;
}

export interface BattleDTO {
  id: string;
  contestantA: ContestantSummaryDTO;
  contestantB: ContestantSummaryDTO;
  votesA?: number;
  votesB?: number;
  totalVotes?: number;
  status: BattleStatus;
  createdAt: string;
}

export interface NextBattleResponseDTO {
  battle: BattleDTO | null;
  prefetchedNextBattle?: BattleDTO | null;
  hasMore: boolean;
  totalAvailableBattles?: number;
}

export interface VoteRequestDTO {
  selectedStudentId: string;
  idempotencyKey: string;
}

export interface VoteResponseDTO {
  success: boolean;
  voteId: string;
  battleId: string;
  selectedStudentId: string;
  message: string;
  votesA?: number;
  votesB?: number;
  totalVotes?: number;
}

export interface CommentDTO {
  id: string;
  battleId: string;
  userId: string;
  authorName: string;
  body: string;
  moderationStatus: ModerationStatus;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
}

export interface CommentsListResponseDTO {
  comments: CommentDTO[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

export interface LeaderboardEntryDTO {
  rank: number;
  studentId: string;
  displayName: string;
  department: string | null;
  imageUrl: string;
  totalVotes: number;
  winRate?: number;
}

export interface LeaderboardResponseDTO {
  entries: LeaderboardEntryDTO[];
  totalParticipants: number;
  lastUpdated: string;
  fromCache: boolean;
}

export interface ReportDTO {
  id: string;
  reporterUserId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  targetDetails?: Record<string, any>;
}

export interface ConsentRecordDTO {
  id: string;
  studentId: string;
  consentVersion: string;
  termsText: string;
  status: ConsentStatus;
  recordedAt: string;
  withdrawnAt: string | null;
}
