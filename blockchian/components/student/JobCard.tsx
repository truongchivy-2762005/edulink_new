"use client";
import Link from "next/link";
import { Clock, Users, Zap, Star } from "lucide-react";
import type { Job } from "@/lib/api";
import styles from "./JobCard.module.css";

interface Props {
  job: Job;
}

export default function JobCard({ job }: Props) {
  return (
    <Link href={`/dashboard/student/jobs/${job.id}`} id={`job-card-${job.id}`}>
      <article className={`${styles.card} glass-card`}>
        {/* AI Badge */}
        {job.isAIRecommended && (
          <div className={styles.aiBadge}>
            <Zap size={10} />
            AI Gợi ý
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <img
            src={job.companyLogo}
            alt={job.company}
            className={styles.logo}
          />
          <div>
            <h3 className={styles.title}>{job.title}</h3>
            <div className={styles.company}>{job.company}</div>
          </div>
        </div>

        {/* Match Score */}
        {job.matchScore !== undefined && (
          <div className={styles.matchRow}>
            <div className={styles.matchBar}>
              <div
                className={styles.matchFill}
                style={{ width: `${job.matchScore}%` }}
              />
            </div>
            <span className={styles.matchNum}>{job.matchScore}% phù hợp</span>
          </div>
        )}

        {/* Skills */}
        <div className={styles.skills}>
          {job.skills.slice(0, 3).map((s) => (
            <span key={s} className="badge badge-gray">{s}</span>
          ))}
          {job.skills.length > 3 && (
            <span className="badge badge-gray">+{job.skills.length - 3}</span>
          )}
        </div>

        {/* SBT Required */}
        {job.requiredSBTs.length > 0 && (
          <div className={styles.sbtRow}>
            <Star size={11} color="var(--color-accent)" />
            <span className={styles.sbtText}>Yêu cầu SBT</span>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.budget}>
            <span className={styles.budgetNum}>{job.budget}</span>
            <span className={styles.budgetToken}>USDC</span>
          </div>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Clock size={11} />
              {job.duration}
            </span>
            <span className={styles.metaItem}>
              <Users size={11} />
              {job.applicants}
            </span>
          </div>
        </div>

        {/* Category badge */}
        <div className={styles.category}>
          <span className="badge badge-purple">{job.category}</span>
        </div>
      </article>
    </Link>
  );
}
