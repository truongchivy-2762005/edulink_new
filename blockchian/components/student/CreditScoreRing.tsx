"use client";
import { useEffect, useRef } from "react";
import styles from "./CreditScoreRing.module.css";

interface Props {
  score: number;        // 0–1000
  size?: number;        // px
}

export default function CreditScoreRing({ score, size = 160 }: Props) {
  const circleRef = useRef<SVGCircleElement>(null);

  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = score / 1000;
  const dashOffset = circumference * (1 - pct);

  // Grade
  const grade =
    score >= 900 ? { label: "Xuất sắc", color: "#14F195" } :
    score >= 750 ? { label: "Tốt",      color: "#9945FF" } :
    score >= 600 ? { label: "Khá",      color: "#3B82F6" } :
    score >= 400 ? { label: "Trung bình",color: "#F59E0B" } :
                   { label: "Thấp",     color: "#FF4D6D" };

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.style.strokeDashoffset = String(circumference);
    // Trigger animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)";
          circleRef.current.style.strokeDashoffset = String(dashOffset);
        }
      });
    });
  }, [score, circumference, dashOffset]);

  return (
    <div className={styles.ring} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        {/* Gradient def */}
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945FF" />
            <stop offset="100%" stopColor={grade.color} />
          </linearGradient>
        </defs>
        {/* Progress arc */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${grade.color}60)` }}
        />
      </svg>

      {/* Center content */}
      <div className={styles.center}>
        <div className={styles.score} style={{ color: grade.color }}>{score}</div>
        <div className={styles.label}>{grade.label}</div>
        <div className={styles.sub}>/ 1000</div>
      </div>
    </div>
  );
}
