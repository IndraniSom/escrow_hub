export enum Role {
  CLIENT = "CLIENT",
  FREELANCER = "FREELANCER",
  ADMIN = "ADMIN",
}

export enum ProjectStatus {
  PENDING = "PENDING",
  FUNDED = "FUNDED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  DISPUTED = "DISPUTED",
  CANCELLED = "CANCELLED",
}

export enum MilestoneStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum EscrowState {
  FUNDED = "FUNDED",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  DISPUTED = "DISPUTED",
  REFUNDED = "REFUNDED",
}

export enum DisputeState {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED = "RESOLVED",
  DISMISSED = "DISMISSED",
}

export enum Verdict {
  IN_FAVOR_OF_CLIENT = "IN_FAVOR_OF_CLIENT",
  IN_FAVOR_OF_FREELANCER = "IN_FAVOR_OF_FREELANCER",
  SPLIT = "SPLIT",
  DISMISSED = "DISMISSED",
}

export interface User {
  id: string;
  stellarAddress: string;
  role: Role;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  email?: string;
  reputationScore: number;
  totalProjects: number;
  completedProjects: number;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  escrowAmount: string;
  tokenSymbol: string;
  stellarEscrowId?: string;
  escrowContractId?: string;
  clientId: string;
  freelancerId?: string;
  deadline?: string;
  githubRepo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  amount: string;
  status: MilestoneStatus;
  dueDate?: string;
  submissionUri?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Escrow {
  id: string;
  projectId: string;
  stellarEscrowId: string;
  contractId: string;
  clientAddress: string;
  freelancerAddress: string;
  tokenAddress: string;
  amount: string;
  releasedAmount: string;
  state: EscrowState;
  milestoneCount: number;
  completedMilestones: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  projectId: string;
  raisedById: string;
  reason: string;
  description?: string;
  state: DisputeState;
  verdict?: Verdict;
  resolution?: string;
  clientAmount?: string;
  freelancerAmount?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Review {
  id: string;
  fromId: string;
  toId: string;
  projectId?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export interface Integration {
  id: string;
  userId: string;
  plugin: string;
  status: string;
  scopes: string[];
  accessToken?: string;
  refreshToken?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: string;
  tokenSymbol: string;
  stellarTxHash?: string;
  status: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event: string;
  payload: Record<string, unknown>;
  processed: boolean;
  createdAt: string;
  projectId?: string;
  userId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface AuthChallengeResponse {
  challengeId: string;
  challenge: string;
}

export interface AuthVerifyResponse {
  accessToken: string;
  user: User;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
