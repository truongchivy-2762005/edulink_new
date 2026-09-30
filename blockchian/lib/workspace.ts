import { createWorkspaceClient } from "./workspace-client.mjs";

export type StaffRole = "employer" | "mentor" | "admin";
export interface Person {
  id: number;
  name: string;
  email: string;
  role: StaffRole | "student";
  reputation_score: number;
  wallet_address?: string | null;
  student_profile?: {
    university?: string;
    major?: string;
    bio?: string;
    skills?: string[];
    completed_jobs: number;
    sbt_data?: unknown[];
  };
}
export interface Page<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
}
export interface Submission {
  id: number;
  work_url?: string;
  file_path?: string;
  description?: string;
  employer_feedback?: string;
  submitted_at: string;
  student?: Person;
}
export interface Milestone {
  id: number;
  title: string;
  description?: string;
  amount: string;
  due_date: string;
  status: string;
  release_tx?: string;
  submissions?: Submission[];
  disputes?: Dispute[];
}
export interface Candidate {
  id: number;
  student_id: number;
  match_score: string | number | null;
  ai_reason?: string;
  match_breakdown?: {
    skills: number;
    certificates: number;
    reputation: number;
    experience: number;
    ontime: number;
  };
  match_reasons?: string[];
  matched_skills?: string[];
  status: string;
  source: string;
  student: Person;
}
export interface Escrow {
  id: number;
  job_id: number;
  amount: string;
  status: string;
  deposit_tx?: string;
  release_tx?: string;
  refund_tx?: string;
  job?: Job;
}
export interface Job {
  id: number;
  employer_id: number;
  title: string;
  description: string;
  required_skills: string[];
  budget: string;
  deadline: string;
  status: string;
  employer?: Person;
  milestones: Milestone[];
  applications?: Candidate[];
  applications_count?: number;
  escrow?: Escrow | null;
}
export interface Vote {
  id: number;
  mentor_id: number;
  student_percentage: number;
  reason?: string;
  mentor?: Person;
}
export interface Dispute {
  id: number;
  reason: string;
  evidence?: string[];
  status: string;
  student_percentage?: number;
  resolution?: string;
  dispute_tx?: string;
  created_at: string;
  milestone: Milestone & { job: Job };
  votes: Vote[];
  creator?: Person;
}
export interface Company {
  company_name: string;
  industry?: string;
  website?: string;
  description?: string;
}
export interface WorkspaceConfig {
  blockchain_mode: "mock" | "devnet";
}
export const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    .replace(/\/$/, "")
    .replace(/\/api$/, "") + "/api";
const TOKEN_KEY = "edulink_staff_token_v1";
export const getStaffToken = () =>
  typeof window === "undefined" ? null : sessionStorage.getItem(TOKEN_KEY);
export const clearStaffSession = () => sessionStorage.removeItem(TOKEN_KEY);
export const workspaceApi = createWorkspaceClient(API_BASE, getStaffToken);

export async function staffLogin(
  email: string,
  password: string,
  expectedRole: StaffRole,
): Promise<Person> {
  const result = await workspaceApi<{ user: Person; token: string }>("/login", {
    method: "POST",
    body: { email: email.trim(), password },
  });
  if (result.user.role !== expectedRole) {
    await createWorkspaceClient(API_BASE, () => result.token)("/logout", {
      method: "POST",
    }).catch(() => {});
    throw new Error(
      "Tài khoản không thuộc vai trò đã chọn. Vui lòng chọn đúng vai trò.",
    );
  }
  sessionStorage.setItem(TOKEN_KEY, result.token);
  return result.user;
}
export async function downloadSubmission(id: number) {
  const response = await fetch(
    API_BASE + "/workspace/submissions/" + id + "/file",
    {
      headers: {
        Authorization: "Bearer " + getStaffToken(),
        Accept: "application/octet-stream",
      },
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!response.ok)
    throw new Error("Không tải được tệp bài nộp. Vui lòng thử lại.");
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    response.headers
      .get("Content-Disposition")
      ?.match(/filename="?([^";]+)"?/i)?.[1] || "submission-" + id;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const money = (value: string | number) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 6 }).format(
    Number(value),
  );
export const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN");
