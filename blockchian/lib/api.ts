import { getStudentToken, publicApi, studentApi } from "./student-client";

/**
 * lib/api.ts — API client cho EduLink Hub
 * Tích hợp với Backend (Khang) qua REST API
 * Các hàm runtime bên dưới luôn gọi Laravel API; dữ liệu mẫu chỉ còn là fixture giao diện cũ.
 */

/* ── Types ─────────────────────────────────────────────────── */
export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  category: string;
  skills: string[];
  requiredSBTs: string[];
  budget: number;           // USDC
  duration: string;         // e.g. "3 ngày"
  deadline: string;
  description: string;
  status: "open" | "in_progress" | "completed" | "disputed";
  applicants: number;
  postedAt: string;
  isAIRecommended?: boolean;
  matchScore?: number;      // 0–100, from AI Matchmaking (Hiếu)
  myApplication?: { id: number; status: string; created_at: string } | null;
}

export interface MyJob {
  id: string;
  jobId: string;
  title: string;
  company: string;
  budget: number;
  status: "accepted" | "in_progress" | "submitted" | "approved" | "disputed";
  deadline: string;
  submittedAt?: string;
  milestones: Milestone[];
  escrowAddress?: string;   // Solana escrow PDA (Ngữ)
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: "pending" | "completed" | "paid";
  dueDate: string;
}

export interface Transaction {
  id: string;
  type: "earned" | "withdrawn" | "isa_deduction";
  amount: number;
  token: "USDC" | "SOL";
  from: string;
  description: string;
  timestamp: string;
  txHash?: string;          // Solana tx hash (Ngữ)
  status: "confirmed" | "pending";
}

export interface SBT {
  id: string;
  title: string;
  issuer: string;
  category: string;
  issuedAt: string;
  metadata: string;
  tokenAddress?: string;
  imageUrl?: string;
}

/* ── Dynamic Date Helpers ───────────────────────────────────── */
function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

function getRelativeISODate(daysOffset: number, hoursOffset = 0, minutesOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  d.setMinutes(d.getMinutes() + minutesOffset);
  return d.toISOString();
}

/* ── Legacy UI fixtures (không dùng trong runtime) ─────────── */
export const MOCK_JOBS: Job[] = [
  {
    id: "job-001",
    title: "Xây dựng Landing Page NFT Marketplace",
    company: "MetaVerse Studio",
    companyLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=metaverse&size=40",
    category: "Frontend",
    skills: ["React", "TypeScript", "CSS3"],
    requiredSBTs: ["SBT-ReactJS-Advanced", "SBT-Web3-Basics"],
    budget: 120,
    duration: "5 ngày",
    deadline: getRelativeDate(5),
    description:
      "Xây dựng landing page cho NFT marketplace với animation mượt mà, kết nối ví Phantom. Yêu cầu kinh nghiệm React, hiểu biết cơ bản về Web3. Responsive trên mọi thiết bị.",
    status: "open",
    applicants: 7,
    postedAt: getRelativeDate(-2),
    isAIRecommended: true,
    matchScore: 94,
  },
  {
    id: "job-002",
    title: "Smart Contract Audit — DeFi Lending Protocol",
    company: "SecureChain Labs",
    companyLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=securechain&size=40",
    category: "Blockchain",
    skills: ["Solidity", "Foundry", "Security"],
    requiredSBTs: ["SBT-Solidity-Intermediate"],
    budget: 300,
    duration: "7 ngày",
    deadline: getRelativeDate(8),
    description:
      "Kiểm tra bảo mật smart contract DeFi lending. Viết báo cáo đầy đủ về các lỗ hổng tiềm ẩn, tấn công reentrancy, flash loan. Cần SBT Solidity từ Open Campus.",
    status: "open",
    applicants: 3,
    postedAt: getRelativeDate(-3),
    isAIRecommended: false,
    matchScore: 71,
  },
  {
    id: "job-003",
    title: "Thiết kế UI/UX App DePIN Sensor Dashboard",
    company: "IoT Solutions VN",
    companyLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=iotsol&size=40",
    category: "Design",
    skills: ["Figma", "UI/UX", "Data Visualization"],
    requiredSBTs: ["SBT-UIDesign-Fundamentals"],
    budget: 80,
    duration: "3 ngày",
    deadline: getRelativeDate(4),
    description:
      "Thiết kế dashboard hiển thị dữ liệu IoT sensor real-time. Style tối hiện đại, biểu đồ đẹp. Cần file Figma deliverable đầy đủ component.",
    status: "open",
    applicants: 12,
    postedAt: getRelativeDate(-1),
    isAIRecommended: true,
    matchScore: 88,
  },
  {
    id: "job-004",
    title: "Backend API cho Game P2E trên Solana",
    company: "GameFi Alpha",
    companyLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=gamefi&size=40",
    category: "Backend",
    skills: ["Node.js", "PostgreSQL", "Solana Web3.js"],
    requiredSBTs: ["SBT-NodeJS-Advanced", "SBT-Solana-Basics"],
    budget: 250,
    duration: "10 ngày",
    deadline: getRelativeDate(12),
    description:
      "Xây dựng REST API cho game Play-to-Earn. Tích hợp Solana cho NFT items, leaderboard on-chain, thanh toán SOL. Cần PostgreSQL cho metadata.",
    status: "open",
    applicants: 5,
    postedAt: getRelativeDate(-4),
    isAIRecommended: false,
    matchScore: 66,
  },
  {
    id: "job-005",
    title: "Viết Technical Documentation — Anchor Program",
    company: "SolanaHub VN",
    companyLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=solanahub&size=40",
    category: "Writing",
    skills: ["Technical Writing", "Rust", "Solana"],
    requiredSBTs: ["SBT-TechWriting-EN"],
    budget: 60,
    duration: "2 ngày",
    deadline: getRelativeDate(3),
    description:
      "Viết tài liệu kỹ thuật đầy đủ cho Anchor smart program. Bao gồm: account structures, instruction flow, error codes, và ví dụ tích hợp TypeScript SDK.",
    status: "open",
    applicants: 2,
    postedAt: getRelativeDate(-1),
    isAIRecommended: true,
    matchScore: 79,
  },
  {
    id: "job-006",
    title: "Data Analysis — Onchain Activity Report",
    company: "DeFi Analytics Co.",
    companyLogo: "https://api.dicebear.com/7.x/shapes/svg?seed=defianalytics&size=40",
    category: "Data",
    skills: ["Python", "SQL", "Data Analysis"],
    requiredSBTs: ["SBT-DataScience-Intro"],
    budget: 150,
    duration: "5 ngày",
    deadline: getRelativeDate(7),
    description:
      "Phân tích dữ liệu on-chain Solana để tìm patterns giao dịch. Viết Python scripts truy vấn RPC, xử lý dữ liệu và tạo báo cáo PDF với biểu đồ.",
    status: "open",
    applicants: 4,
    postedAt: getRelativeDate(-2),
    isAIRecommended: false,
    matchScore: 55,
  },
];

export const MOCK_MY_JOBS: MyJob[] = [
  {
    id: "myjob-001",
    jobId: "job-007",
    title: "Tích hợp Privy Wallet vào React App",
    company: "DApp Factory",
    budget: 180,
    status: "in_progress",
    deadline: getRelativeDate(4),
    escrowAddress: "EscrowPDA...7xKp",
    milestones: [
      { id: "m1", title: "Setup Privy SDK + Login flow", amount: 60, status: "paid", dueDate: getRelativeDate(-3) },
      { id: "m2", title: "Embedded wallet + send tx", amount: 80, status: "completed", dueDate: getRelativeDate(-1) },
      { id: "m3", title: "Testing + Documentation", amount: 40, status: "pending", dueDate: getRelativeDate(4) },
    ],
  },
  {
    id: "myjob-002",
    jobId: "job-008",
    title: "Dịch thuật Whitepaper DeFi (EN→VI)",
    company: "CryptoViet Media",
    budget: 45,
    status: "submitted",
    deadline: getRelativeDate(0),
    submittedAt: getRelativeDate(-1),
    milestones: [
      { id: "m1", title: "Hoàn thành bản dịch đầy đủ", amount: 45, status: "completed", dueDate: getRelativeDate(0) },
    ],
  },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-001",
    type: "earned",
    amount: 60,
    token: "USDC",
    from: "DApp Factory",
    description: "Milestone 1: Setup Privy SDK + Login flow",
    timestamp: getRelativeISODate(-3, -2, -15),
    txHash: "3xKmN...8pLq",
    status: "confirmed",
  },
  {
    id: "tx-002",
    type: "earned",
    amount: 45,
    token: "USDC",
    from: "BlockLearn VN",
    description: "Hoàn thành khóa Solana Basics — Learn-to-Earn",
    timestamp: getRelativeISODate(-5, -4, -30),
    txHash: "5yRtP...2mWs",
    status: "confirmed",
  },
  {
    id: "tx-003",
    type: "earned",
    amount: 120,
    token: "USDC",
    from: "TechViet Solutions",
    description: "Job hoàn thành: Frontend Dashboard DeFi",
    timestamp: getRelativeISODate(-12, -6, 0),
    txHash: "9qUvX...4nZr",
    status: "confirmed",
  },
  {
    id: "tx-004",
    type: "withdrawn",
    amount: 100,
    token: "USDC",
    from: "EduLink Escrow",
    description: "Rút về ví ngoài (Phantom)",
    timestamp: getRelativeISODate(-16, -2, -10),
    txHash: "2bFgH...6kYt",
    status: "confirmed",
  },
  {
    id: "tx-005",
    type: "isa_deduction",
    amount: -2.5,
    token: "USDC",
    from: "ISA Smart Contract",
    description: "Hoàn vốn ISA: 5% từ job DApp Factory",
    timestamp: getRelativeISODate(-3, -2, -14),
    txHash: "7cDhI...1lZu",
    status: "confirmed",
  },
];

export const MOCK_SBTS: SBT[] = [
  {
    id: "sbt-001",
    title: "ReactJS Advanced Developer",
    issuer: "Open Campus",
    category: "Frontend",
    issuedAt: getRelativeDate(-60),
    metadata: "Chứng nhận thành thạo ReactJS, Hooks, Context API, Performance Optimization",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=react&backgroundColor=61dafb",
  },
  {
    id: "sbt-002",
    title: "Solana Basics Certified",
    issuer: "Open Campus × Solana Foundation",
    category: "Blockchain",
    issuedAt: getRelativeDate(-45),
    metadata: "Hiểu về kiến trúc Solana, accounts, programs, transaction flow",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=solana&backgroundColor=9945ff",
  },
  {
    id: "sbt-003",
    title: "Web3 Fundamentals",
    issuer: "Open Campus",
    category: "Web3",
    issuedAt: getRelativeDate(-90),
    metadata: "Nền tảng Web3, wallets, smart contracts, DeFi, NFT concepts",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=web3&backgroundColor=14f195",
  },
  {
    id: "sbt-004",
    title: "EduLink Job Verified — Level 1",
    issuer: "EduLink Hub",
    category: "Work Experience",
    issuedAt: getRelativeDate(-10),
    metadata: "Hoàn thành thành công 2 dự án trên EduLink Hub. Credit Score 750+",
    imageUrl: "https://api.dicebear.com/7.x/shapes/svg?seed=edulink&backgroundColor=ffd700",
  },
];

/* ── API Functions ─────────────────────────────────────────── */
interface BackendMilestone {
  id: number;
  title: string;
  amount: string | number;
  due_date: string;
  status: string;
  submissions?: Array<{ submitted_at: string }>;
}

interface BackendJob {
  id: number;
  title: string;
  description: string;
  required_skills?: string[] | null;
  budget: string | number;
  deadline: string;
  status: string;
  applications_count?: number;
  created_at: string;
  employer?: { name: string };
  milestones?: BackendMilestone[];
  escrow?: { id: number; program_id?: string | null } | null;
  my_application?: { id: number; status: string; created_at: string } | null;
}

interface BackendApplication {
  id: number;
  status: string;
  job: BackendJob;
}

interface Paginated<T> {
  data: T[];
}

const categoryFor = (skills: string[]): string => {
  const value = skills.join(" ").toLowerCase();
  if (/solana|rust|solidity|web3|blockchain/.test(value)) return "Blockchain";
  if (/react|vue|angular|css|frontend/.test(value)) return "Frontend";
  if (/laravel|php|node|sql|backend/.test(value)) return "Backend";
  if (/figma|design|ui|ux/.test(value)) return "Design";
  if (/data|python|analysis/.test(value)) return "Data";
  if (/writing|content|document/.test(value)) return "Writing";
  return "Khác";
};

const mapJob = (job: BackendJob): Job => {
  const skills = job.required_skills || [];
  const days = Math.max(1, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
  const company = job.employer?.name || "Doanh nghiệp EduLink";
  return {
    id: String(job.id),
    title: job.title,
    company,
    companyLogo: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(company)}&size=40`,
    category: categoryFor(skills),
    skills,
    requiredSBTs: [],
    budget: Number(job.budget),
    duration: `${days} ngày`,
    deadline: job.deadline,
    description: job.description,
    status: ["open", "in_progress", "completed", "disputed"].includes(job.status)
      ? job.status as Job["status"]
      : "open",
    applicants: job.applications_count || 0,
    postedAt: job.created_at,
    myApplication: job.my_application || null,
  };
};

const mapMilestone = (milestone: BackendMilestone): Milestone => ({
  id: String(milestone.id),
  title: milestone.title,
  amount: Number(milestone.amount),
  status: milestone.status === "paid"
    ? "paid"
    : ["submitted", "approved"].includes(milestone.status)
      ? "completed"
      : "pending",
  dueDate: milestone.due_date,
});

const mapMyJob = (application: BackendApplication): MyJob => {
  const job = application.job;
  const milestones = job.milestones || [];
  const latestSubmission = milestones
    .flatMap((milestone) => milestone.submissions || [])
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))[0];
  let status: MyJob["status"] = "in_progress";
  if (job.status === "completed") status = "approved";
  else if (job.status === "disputed") status = "disputed";
  else if (milestones.some((milestone) => ["submitted", "approved"].includes(milestone.status))) status = "submitted";

  return {
    id: String(application.id),
    jobId: String(job.id),
    title: job.title,
    company: job.employer?.name || "Doanh nghiệp EduLink",
    budget: Number(job.budget),
    status,
    deadline: job.deadline,
    submittedAt: latestSubmission?.submitted_at,
    milestones: milestones.map(mapMilestone),
    escrowAddress: job.escrow
      ? job.escrow.program_id || `Escrow #${job.escrow.id}`
      : undefined,
  };
};

export async function fetchJobs(): Promise<Job[]> {
  const page = await publicApi<Paginated<BackendJob>>("/jobs?status=open&per_page=50");
  return page.data.map(mapJob);
}

export async function fetchJobById(id: string): Promise<Job | null> {
  // Dùng studentApi nếu đã đăng nhập để backend trả thêm trạng thái ứng tuyển
  const api = getStudentToken() ? studentApi : publicApi;
  try {
    return mapJob(await api<BackendJob>(`/jobs/${encodeURIComponent(id)}`));
  } catch (error) {
    if (error instanceof Error && "status" in error && (error as { status: number }).status === 404) return null;
    throw error;
  }
}

export async function fetchMyJobs(): Promise<MyJob[]> {
  const applications = await studentApi<BackendApplication[]>("/student/jobs");
  return applications.map(mapMyJob);
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const transactions = await studentApi<Array<{
    id: string;
    type: Transaction["type"];
    amount: number;
    token: Transaction["token"];
    from: string;
    description: string;
    timestamp: string;
    tx_hash?: string | null;
    status: Transaction["status"];
  }>>("/student/transactions");
  return transactions.map((item) => ({ ...item, txHash: item.tx_hash || undefined }));
}

export async function fetchSBTs(): Promise<SBT[]> {
  const sbts = await studentApi<Array<Record<string, unknown>>>("/student/sbts");
  return sbts.map((item, index) => ({
    id: String(item.id || item.token_address || `sbt-${index + 1}`),
    title: String(item.title || item.name || "EduLink Credential"),
    issuer: String(item.issuer || "EduLink Hub"),
    category: String(item.category || "Web3"),
    issuedAt: String(item.issued_at || item.issuedAt || new Date().toISOString()),
    metadata: String(item.metadata || item.description || "Chứng chỉ xác thực trên EduLink Hub"),
    tokenAddress: item.token_address ? String(item.token_address) : undefined,
    imageUrl: item.image_url
      ? String(item.image_url)
      : `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(String(item.name || index))}`,
  }));
}

export async function applyJob(jobId: string): Promise<{ success: boolean }> {
  await studentApi(`/jobs/${encodeURIComponent(jobId)}/apply`, { method: "POST" });
  return { success: true };
}

export async function cancelJobApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
  const res = await studentApi<{ message?: string }>(`/applications/${encodeURIComponent(applicationId)}/cancel`, { method: "POST" });
  return { success: true, message: res?.message || "Đã hủy ứng tuyển thành công." };
}

export async function submitWork(
  milestoneId: string,
  data: { link: string; description: string }
): Promise<{ success: boolean }> {
  await studentApi(`/milestones/${encodeURIComponent(milestoneId)}/submit`, {
    method: "POST",
    body: { work_url: data.link, description: data.description },
  });
  return { success: true };
}

/* ── Chart data helpers ─────────────────────────────────────── */
export function getIncomeChartData(transactions: Transaction[] = []) {
  const now = new Date();
  const months = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const earned = transactions
      .filter((transaction) => {
        const date = new Date(transaction.timestamp);
        return transaction.type === "earned" && date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    months.push({
      month: `Th${d.getMonth() + 1}`,
      earned,
    });
  }
  return months;
}

export const SKILL_CATEGORIES = [
  "Tất cả",
  "Frontend",
  "Backend",
  "Blockchain",
  "Design",
  "Writing",
  "Data",
];
