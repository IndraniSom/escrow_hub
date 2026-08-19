import type {
  User,
  Project,
  Milestone,
  Escrow,
  Dispute,
  Review,
  Notification,
  Integration,
  Transaction,
  PaginatedResponse,
  AuthChallengeResponse,
  AuthVerifyResponse,
  ApiError,
} from "./types";

import { signMessage as freighterSignMessage } from "./freighter";

type FreighterSignResult = string | { signedMessage: string | null; signerAddress: string; error?: { message: string } };

export function normalizeSignedMessage(result: FreighterSignResult): string {
  if (typeof result === "string") return result;
  if (result?.error) throw new Error(result.error.message);
  if (!result.signedMessage) throw new Error("Freighter returned no signature");
  return result.signedMessage;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  setToken(token: string | null): void {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  private async stellarHeaders(): Promise<Record<string, string>> {
    if (typeof window === "undefined") return {};
    const address = localStorage.getItem("stellar_address");
    if (!address) throw new Error("No Stellar address connected");
    const { challenge } = await this.auth.challenge(address);
    const signatureStr = await freighterSignMessage(challenge, address);
    const signature = normalizeSignedMessage(signatureStr);
    return {
      Authorization: `Stellar ${signature}`,
      "x-stellar-public-key": address,
      "x-stellar-challenge": challenge,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    stellarAuth?: boolean,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (stellarAuth && typeof window !== "undefined") {
      Object.assign(headers, await this.stellarHeaders());
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error: ApiError = {
        status: res.status,
        message: "An error occurred",
      };
      try {
        const errBody = await res.json();
        error.message = errBody.message || errBody.error || res.statusText;
        error.errors = errBody.errors;
      } catch {
        error.message = res.statusText;
      }
      throw error;
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return res.json();
  }

  auth = {
    challenge: (publicKey?: string) =>
      this.request<AuthChallengeResponse>("POST", "/auth/challenge", { publicKey }),

    verify: (publicKey: string, signature: string, challenge: string, role?: string) =>
      this.request<AuthVerifyResponse>("POST", "/auth/verify", {
        publicKey,
        signature,
        challenge,
        role,
      }),

    me: () => this.request<User>("GET", "/auth/me"),
  };

  users = {
    list: (pagination?: PaginationParams) => {
      const params = pagination ? `?${new URLSearchParams(pagination as Record<string, string>).toString()}` : "";
      return this.request<PaginatedResponse<User>>("GET", `/users${params}`);
    },

    me: () => this.request<User>("GET", "/users/me"),

    get: (id: string) => this.request<User>("GET", `/users/${id}`),

    byAddress: (address: string) =>
      this.request<User>("GET", `/users/by-address/${encodeURIComponent(address)}`),

    update: (id: string, data: Partial<User>) =>
      this.request<User>("PATCH", `/users/${id}`, data),
  };

  projects = {
    create: (data: Partial<Project>) =>
      this.request<Project>("POST", "/projects", data),

    list: (pagination?: PaginationParams, status?: string) => {
      const params = new URLSearchParams();
      if (pagination?.page) params.set("page", String(pagination.page));
      if (pagination?.limit) params.set("limit", String(pagination.limit));
      if (status) params.set("status", status);
      const query = params.toString();
      return this.request<PaginatedResponse<Project>>("GET", `/projects${query ? `?${query}` : ""}`);
    },

    get: (id: string) => this.request<Project>("GET", `/projects/${id}`),

    update: (id: string, data: Partial<Project>) =>
      this.request<Project>("PATCH", `/projects/${id}`, data),

    delete: (id: string) => this.request<void>("DELETE", `/projects/${id}`),
  };

  milestones = {
    create: (data: Partial<Milestone>) =>
      this.request<Milestone>("POST", "/milestones", data),

    getByProject: (projectId: string) =>
      this.request<Milestone[]>("GET", `/milestones/project/${projectId}`),

    get: (id: string) => this.request<Milestone>("GET", `/milestones/${id}`),

    update: (id: string, data: Partial<Milestone>) =>
      this.request<Milestone>("PATCH", `/milestones/${id}`, data),

    start: (id: string) =>
      this.request<Milestone>("POST", `/milestones/${id}/start`),

    submit: (id: string, submissionUri: string) =>
      this.request<Milestone>("POST", `/milestones/${id}/submit`, { submissionUri }),

    approve: (id: string) =>
      this.request<Milestone>("POST", `/milestones/${id}/approve`),

    reject: (id: string) =>
      this.request<Milestone>("POST", `/milestones/${id}/reject`),
  };

  escrow = {
    create: (data: Partial<Escrow>) =>
      this.request<Escrow>("POST", "/escrow", data),

    fund: (projectId: string) =>
      this.request<Escrow>("POST", `/escrow/${projectId}/fund`, undefined, true),

    release: (projectId: string, milestoneId: string) =>
      this.request<Escrow>("POST", `/escrow/${projectId}/release`, { milestoneId }, true),

    refund: (projectId: string) =>
      this.request<Escrow>("POST", `/escrow/${projectId}/refund`, undefined, true),

    getByProject: (projectId: string) =>
      this.request<Escrow>("GET", `/escrow/${projectId}`),
  };

  disputes = {
    create: (data: Partial<Dispute>) =>
      this.request<Dispute>("POST", "/disputes", data),

    list: () => this.request<Dispute[]>("GET", "/disputes"),

    get: (id: string) => this.request<Dispute>("GET", `/disputes/${id}`),

    resolve: (id: string, data: { verdict: string; resolution?: string }) =>
      this.request<Dispute>("POST", `/disputes/${id}/resolve`, data),

    dismiss: (id: string) =>
      this.request<Dispute>("POST", `/disputes/${id}/dismiss`),
  };

  reputation = {
    get: (userId: string) => this.request<Review[]>("GET", `/reputation/${userId}`),

    submitReview: (data: Partial<Review>) =>
      this.request<Review>("POST", "/reputation/review", data),
  };

  notifications = {
    list: (pagination?: PaginationParams) => {
      const params = pagination ? `?${new URLSearchParams(pagination as Record<string, string>).toString()}` : "";
      return this.request<PaginatedResponse<Notification>>("GET", `/notifications${params}`);
    },

    create: (data: Partial<Notification>) =>
      this.request<Notification>("POST", "/notifications", data),

    markRead: (id: string) =>
      this.request<Notification>("PATCH", `/notifications/${id}/read`),

    markAllRead: () =>
      this.request<void>("POST", "/notifications/read-all"),

    delete: (id: string) =>
      this.request<void>("DELETE", `/notifications/${id}`),
  };

  integrations = {
    connect: (data: { platform: string; code: string }) =>
      this.request<Integration>("POST", "/integrations/connect", data),

    disconnect: (id: string) =>
      this.request<void>("POST", `/integrations/${id}/disconnect`),

    list: () => this.request<Integration[]>("GET", "/integrations"),

    update: (id: string, data: Partial<Integration>) =>
      this.request<Integration>("PATCH", `/integrations/${id}`, data),
  };

  wallet = {
    balance: () =>
      this.request<{ userId: string; balance: string; tokenBalances: Record<string, string>; currency: string }>("GET", "/wallet/balance", undefined, true),

    stellarBalance: () =>
      this.request<{ stellarAddress: string; balances: { assetType: string; assetCode: string; balance: string }[] }>("GET", "/wallet/stellar-balance", undefined, true),

    transactions: (pagination?: PaginationParams) => {
      const params = pagination ? `?${new URLSearchParams(pagination as Record<string, string>).toString()}` : "";
      return this.request<PaginatedResponse<Transaction>>("GET", `/wallet/transactions${params}`);
    },

    createTransaction: (data: Partial<Transaction>) =>
      this.request<Transaction>("POST", "/wallet/transactions", data),
  };
}

let clientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!clientInstance) {
    clientInstance = new ApiClient();
  }
  return clientInstance;
}
