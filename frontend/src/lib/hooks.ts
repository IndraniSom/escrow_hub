"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getApiClient, ApiClient } from "./api";
import type { User, Project, PaginatedResponse, ApiError } from "./types";

export function useApi(): ApiClient {
  return useMemo(() => getApiClient(), []);
}

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (publicKey: string) => Promise<void>;
  verify: (publicKey: string, signature: string, challenge: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const me = await api.auth.me();
      setUser(me);
      setError(null);
    } catch {
      setUser(null);
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const cancelled = false;
    void (async () => {
      try {
        const token = api.getToken();
        if (!token) {
          setUser(null);
          return;
        }
        const me = await api.auth.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) setUser(null);
        api.setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
  }, [api]);

  const login = useCallback(async (publicKey: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.auth.challenge(publicKey);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message || "Failed to get challenge");
      setLoading(false);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const verify = useCallback(
    async (publicKey: string, signature: string, ch: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.auth.verify(publicKey, signature, ch);
        api.setToken(res.accessToken);
        setUser(res.user);
      } catch (e) {
        const err = e as ApiError;
        setError(err.message || "Verification failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [api],
  );

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setError(null);
  }, [api]);

  return { user, loading, error, login, verify, logout, refresh: fetchMe };
}

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: string | null;
  totalPages: number;
  total: number;
  page: number;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function useProjects(limit = 10): UseProjectsReturn {
  const api = useApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: PaginatedResponse<Project> = await api.projects.list({ page, limit });
        if (!cancelled) {
          setProjects(res.data);
          setTotal(res.meta.total);
          setTotalPages(res.meta.totalPages);
        }
      } catch (e) {
        const err = e as ApiError;
        if (!cancelled) setError(err.message || "Failed to fetch projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProjects();
    return () => { cancelled = true; };
  }, [api, page, limit, refreshKey]);

  return { projects, loading, error, totalPages, total, page, setPage, refresh };
}

interface UseProjectReturn {
  project: Project | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useProject(id: string): UseProjectReturn {
  const api = useApi();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const fetchProject = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.projects.get(id);
        if (!cancelled) setProject(res);
      } catch (e) {
        const err = e as ApiError;
        if (!cancelled) setError(err.message || "Failed to fetch project");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (id) fetchProject();
    return () => { cancelled = true; };
  }, [api, id, refreshKey]);

  return { project, loading, error, refresh };
}
