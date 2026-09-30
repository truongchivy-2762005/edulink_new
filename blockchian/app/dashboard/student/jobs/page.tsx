"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Zap } from "lucide-react";
import { fetchJobs, SKILL_CATEGORIES, type Job } from "@/lib/api";
import JobCard from "@/components/student/JobCard";
import styles from "./page.module.css";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [budgetMin, setBudgetMin] = useState(0);
  const [showAIOnly, setShowAIOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không tải được danh sách việc."))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = jobs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (category !== "Tất cả") {
      result = result.filter((j) => j.category === category);
    }
    if (budgetMin > 0) {
      result = result.filter((j) => j.budget >= budgetMin);
    }
    if (showAIOnly) {
      result = result.filter((j) => j.isAIRecommended);
    }
    // Sort: AI recommended first, then by match score
    result = [...result].sort((a, b) => {
      if (a.isAIRecommended && !b.isAIRecommended) return -1;
      if (!a.isAIRecommended && b.isAIRecommended) return 1;
      return (b.matchScore ?? 0) - (a.matchScore ?? 0);
    });
    return result;
  }, [jobs, search, category, budgetMin, showAIOnly]);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tìm việc</h1>
          <p className={styles.subtitle}>
            {filtered.length} công việc phù hợp với hồ sơ của bạn
          </p>
        </div>
        <div className={styles.aiToggle}>
          <button
            id="toggle-ai"
            className={`${styles.aiBtn} ${showAIOnly ? styles.aiBtnActive : ""}`}
            onClick={() => setShowAIOnly(!showAIOnly)}
          >
            <Zap size={14} />
            Chỉ xem AI gợi ý
          </button>
        </div>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* Filters */}
      <div className={`glass-card ${styles.filters}`}>
        {/* Search */}
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            id="job-search"
            type="text"
            className={`input-field ${styles.searchInput}`}
            placeholder="Tìm theo tên, kỹ năng, công ty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category pills */}
        <div className={styles.catPills}>
          {SKILL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              id={`cat-${cat}`}
              className={`${styles.catPill} ${category === cat ? styles.catActive : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Budget filter */}
        <div className={styles.budgetFilter}>
          <Filter size={14} color="var(--text-muted)" />
          <span className={styles.budgetLabel}>Ngân sách tối thiểu:</span>
          <select
            id="budget-filter"
            className={styles.budgetSelect}
            value={budgetMin}
            onChange={(e) => setBudgetMin(Number(e.target.value))}
          >
            <option value={0}>Tất cả</option>
            <option value={50}>50+ USDC</option>
            <option value={100}>100+ USDC</option>
            <option value={200}>200+ USDC</option>
            <option value={500}>500+ USDC</option>
          </select>
        </div>
      </div>

      {/* Job Grid */}
      {isLoading ? (
        <div className="grid-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton" style={{ height: "260px", borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🔍</span>
          <h3>Không tìm thấy việc phù hợp</h3>
          <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          <button className="btn-outline" style={{ marginTop: "16px" }} onClick={() => {
            setSearch(""); setCategory("Tất cả"); setBudgetMin(0); setShowAIOnly(false);
          }}>
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
