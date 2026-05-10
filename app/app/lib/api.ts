/**
 * lib/api.ts — Centralized API configuration for Athex.
 *
 * ✅ To switch environments, update NEXT_PUBLIC_API_URL in .env.local
 *    or change API_BASE below. All app files import from here.
 */

// ── Base URL ──
// Reads from .env.local first, falls back to localhost for development.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://api.athex.xyz/api/v1";

// ── Convenience Auth Helpers ──
export const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("axion_jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getJsonHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...getAuthHeaders(),
});

// ── API Endpoints ──
export const ENDPOINTS = {
  // Auth
  login:          `${API_BASE}/auth/login`,
  register:       `${API_BASE}/auth/register`,
  verify:         `${API_BASE}/auth/verify`,
  forgotPassword: `${API_BASE}/auth/forgot-password`,
  resetPassword:  `${API_BASE}/auth/reset-password`,
  googleLogin:    `${API_BASE}/auth/google/login`,

  // Projects
  projects:       `${API_BASE}/projects`,

  // Ingestion
  ingest:         `${API_BASE}/ingest`,
  ingestYoutube:  `${API_BASE}/ingest/youtube`,
  status:         (id: string) => `${API_BASE}/status/${id}`,

  // Chat
  chatStream:     `${API_BASE}/chat/stream`,
  chatHistory:    (videoId: string) => `${API_BASE}/chat/history?video_id=${videoId}`,
  chatMessage:    (videoId: string, role: string, content: string) =>
    `${API_BASE}/chat/message?video_id=${videoId}&role=${role}&content=${encodeURIComponent(content)}`,

  // Study tools
  summary:        (videoId: string, type: string, time = 0) =>
    `${API_BASE}/summary?video_id=${videoId}&summary_type=${type}&current_time=${time}`,
  studyMaterial:  (videoId: string, type: string) =>
    `${API_BASE}/study-material?video_id=${videoId}&material_type=${type}`,
  exportPDF:      (videoId: string) => `${API_BASE}/export/pdf?video_id=${videoId}`,
} as const;
