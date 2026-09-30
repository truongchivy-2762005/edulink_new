"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import CreditScoreRing from "@/components/student/CreditScoreRing";
import { fetchJobs, fetchMyJobs, type Job, type MyJob } from "@/lib/api";
import JobCard from "@/components/student/JobCard";
import ReputationHistory from "@/components/reputation-history";
import { TrendingUp, Briefcase, Award, ArrowRight, Clock, CheckCircle } from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [aiJobs, setAiJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchJobs(), fetchMyJobs()])
      .then(([jobs, mine]) => {
        const recommendations = jobs.filter((job) => job.isAIRecommended);
        setAiJobs((recommendations.length ? recommendations : jobs).slice(0, 3));
        setMyJobs(mine);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không tải được dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  if (!user) return null;

  const completedJobs = myJobs.filter((j) => j.status === "approved").length;
  const activeJobs = myJobs.filter((j) => j.status === "in_progress").length;

  return (
    <div className={styles.page}>
      {/* ── Header greeting ───────────────────────────── */}
      <div className={styles.greeting}>
        <div>
          <h1 className={styles.greetingTitle}>
            Xin chào, <span className="gradient-text">{user.name.split(" ").pop()}! 👋</span>
          </h1>
          <p className={styles.greetingSubtitle}>
            Hôm nay là ngày tốt để kiếm thêm USDC và tích lũy SBT.
          </p>
        </div>
        <div className={styles.greetingDate}>
          {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* ── Stats row ─────────────────────────────────── */}
      <div className={styles.statsRow}>
        {/* Credit Score Ring */}
        <div className={`glass-card ${styles.creditCard}`}>
          <div className={styles.creditLeft}>
            <CreditScoreRing score={user.creditScore} size={140} />
          </div>
          <div className={styles.creditRight}>
            <p className="label">Điểm Uy tín</p>
            <p className={styles.creditDesc}>
              Hoàn thành nhiều dự án hơn để nâng điểm và mở khóa việc lương cao hơn.
            </p>
            <div className={styles.creditBadges}>
              <span className="badge badge-purple">Top 15% sinh viên</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className={styles.quickStats}>
          <div className={`glass-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: "rgba(20,241,149,0.15)" }}>
              <TrendingUp size={20} color="var(--color-secondary)" />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNum} style={{ color: "var(--color-secondary)" }}>
                {user.usdc.toFixed(1)}
              </div>
              <div className={styles.statLabel}>USDC Số dư</div>
            </div>
          </div>

          <div className={`glass-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: "rgba(153,69,255,0.15)" }}>
              <Award size={20} color="var(--color-primary)" />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNum} style={{ color: "var(--color-primary)" }}>
                {user.sbtCount}
              </div>
              <div className={styles.statLabel}>SBT Credentials</div>
            </div>
          </div>

          <div className={`glass-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: "rgba(59,130,246,0.15)" }}>
              <Briefcase size={20} color="var(--color-info)" />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNum} style={{ color: "var(--color-info)" }}>
                {activeJobs}
              </div>
              <div className={styles.statLabel}>Việc đang làm</div>
            </div>
          </div>

          <div className={`glass-card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: "rgba(255,215,0,0.15)" }}>
              <CheckCircle size={20} color="var(--color-accent)" />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNum} style={{ color: "var(--color-accent)" }}>
                {completedJobs}
              </div>
              <div className={styles.statLabel}>Dự án hoàn thành</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Reputation History Timeline Section ───────── */}
      <section className={styles.section} style={{ marginTop: "24px" }}>
        <ReputationHistory title="Lịch sử biến động điểm uy tín của bạn" />
      </section>

      {/* ── Active jobs ───────────────────────────────── */}
      {myJobs.filter((j) => j.status === "in_progress").length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>
              <Clock size={18} color="var(--color-warning)" />
              Việc đang thực hiện
            </h2>
          </div>
          <div className={styles.activeJobsList}>
            {myJobs.filter((j) => j.status === "in_progress").map((job) => (
              <div key={job.id} className={`glass-card ${styles.activeJobCard}`}>
                <div>
                  <div className={styles.activeJobTitle}>{job.title}</div>
                  <div className={styles.activeJobCompany}>{job.company}</div>
                </div>
                <div className={styles.activeJobRight}>
                  <div className={styles.activeJobBudget}>{job.budget} USDC</div>
                  <div className={styles.activeDeadline}>
                    <Clock size={11} />
                    Hết hạn {new Date(job.deadline).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <span className="badge badge-blue">Đang làm</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── AI Recommended Jobs ───────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>
            🤖 AI gợi ý cho bạn
          </h2>
          <Link href="/dashboard/student/jobs" className="btn-ghost" style={{ fontSize: "13px" }}>
            Xem tất cả <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className={styles.skeletonGrid}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: "220px", borderRadius: "var(--radius-lg)" }} />
            ))}
          </div>
        ) : (
          <div className="grid-3">
            {aiJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
