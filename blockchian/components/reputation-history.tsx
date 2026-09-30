"use client";

import React, { useEffect, useState } from "react";
import { Award, Clock, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";

export interface ReputationLogItem {
  id: number;
  user_id: number;
  job_id?: number | null;
  milestone_id?: number | null;
  change: number;
  score_after: number;
  reason: string;
  created_at: string;
}

interface ReputationHistoryProps {
  userId?: number;
  title?: string;
  maxItems?: number;
  compact?: boolean;
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000")
    .replace(/\/$/, "")
    .replace(/\/api$/, "") + "/api";

export default function ReputationHistory({
  userId,
  title = "Lịch sử biến động điểm uy tín",
  maxItems,
  compact = false,
}: ReputationHistoryProps) {
  const [logs, setLogs] = useState<ReputationLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const token =
      localStorage.getItem("edulink_student_token_v1") ||
      sessionStorage.getItem("edulink_staff_token_v1");

    const query = userId ? `?user_id=${userId}` : "";
    const endpoint = `${API_BASE}/reputation/history${query}`;

    fetch(endpoint, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Không thể tải lịch sử uy tín");
        }
        return res.json();
      })
      .then((resData) => {
        if (isMounted) {
          const list = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.data)
            ? resData.data
            : [];
          setLogs(list);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;

  return (
    <div
      style={{
        backgroundColor: compact ? "transparent" : "#111827",
        border: compact ? "none" : "1px solid #374151",
        borderRadius: "10px",
        padding: compact ? "0" : "20px",
        color: "#ffffff",
      }}
    >
      {/* Title Header */}
      {!compact && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            paddingBottom: "12px",
            borderBottom: "1px solid #374151",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={20} color="#fbbf24" />
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, color: "#f3f4f6" }}>
              {title}
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "#9ca3af" }}>
            {logs.length} bản ghi
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "16px 0", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
          Đang tải lịch sử điểm uy tín...
        </div>
      ) : error ? (
        <div style={{ padding: "12px", borderRadius: "6px", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#f87171", fontSize: "13px" }}>
          {error}
        </div>
      ) : displayLogs.length === 0 ? (
        <div style={{ padding: "16px 0", textAlign: "center", color: "#9ca3af", fontSize: "13px", fontStyle: "italic" }}>
          Chưa có biến động điểm uy tín nào được ghi nhận.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {displayLogs.map((item) => {
            const isPositive = item.change > 0;
            const isNegative = item.change < 0;

            const badgeBg = isPositive
              ? "rgba(52, 211, 153, 0.15)"
              : isNegative
              ? "rgba(248, 113, 113, 0.15)"
              : "rgba(156, 163, 175, 0.15)";

            const badgeColor = isPositive
              ? "#34d399"
              : isNegative
              ? "#f87171"
              : "#9ca3af";

            const formattedDate = new Date(item.created_at).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  gap: "12px",
                }}
              >
                {/* Left side: Reason & Date */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: "#f9fafb",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.reason}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                    <span style={{ fontSize: "11px", color: "#9ca3af", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={11} />
                      {formattedDate}
                    </span>
                    <span style={{ fontSize: "11px", color: "#6b7280" }}>
                      Sau biến động: <strong style={{ color: "#d1d5db" }}>{item.score_after}</strong>/100
                    </span>
                  </div>
                </div>

                {/* Right side: Change point badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    fontSize: "13px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isPositive ? (
                    <ArrowUpRight size={14} />
                  ) : isNegative ? (
                    <ArrowDownRight size={14} />
                  ) : null}
                  {isPositive ? `+${item.change}` : item.change} đ
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
