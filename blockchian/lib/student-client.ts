import { createWorkspaceClient } from "./workspace-client.mjs";

export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    .replace(/\/$/, "")
    .replace(/\/api$/, "") + "/api";

const TOKEN_KEY = "edulink_student_token_v1";

export const getStudentToken = () =>
  typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY);

export const setStudentToken = (token: string) =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearStudentToken = () => localStorage.removeItem(TOKEN_KEY);

export const studentApi = createWorkspaceClient(API_BASE, getStudentToken);

export const publicApi = createWorkspaceClient(API_BASE, () => null);
