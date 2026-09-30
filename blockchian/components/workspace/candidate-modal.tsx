"use client";

import React, { useState } from "react";
import { X, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { type Candidate } from "@/lib/workspace";
import ReputationHistory from "@/components/reputation-history";

interface CandidateModalProps {
  candidate: Candidate | null;
  jobRequiredSkills?: string[];
  onClose: () => void;
  onAccept?: (candidate: Candidate) => void;
  onReject?: (candidate: Candidate) => void;
  isEmployer?: boolean;
}

export default function CandidateModal({
  candidate,
  jobRequiredSkills = [],
  onClose,
  onAccept,
  onReject,
  isEmployer = false,
}: CandidateModalProps) {
  const [selectedSbt, setSelectedSbt] = useState<any | null>(null);

  if (!candidate) return null;

  const { student, match_score, match_breakdown, match_reasons, matched_skills } = candidate;
  const profile = student?.student_profile;
  const scoreNum = match_score ? Number(match_score) : 0;

  // SBT / OCA credentials array
  const sbtList = Array.isArray(profile?.sbt_data) ? profile.sbt_data : [];

  const breakdown = match_breakdown || {
    skills: 0,
    certificates: 0,
    reputation: 0,
    experience: 0,
    ontime: 0,
  };

  const matchedSkillSet = new Set((matched_skills || []).map((s) => s.toLowerCase()));

  const statusLabel =
    candidate.status === "accepted"
      ? "Đã nhận việc"
      : candidate.status === "pending"
      ? "Đang chờ duyệt"
      : candidate.status === "matched"
      ? "Được AI đề xuất"
      : candidate.status === "rejected"
      ? "Đã từ chối"
      : candidate.status;

  const statusColor =
    candidate.status === "accepted"
      ? "#34d399"
      : candidate.status === "pending"
      ? "#fbbf24"
      : candidate.status === "matched"
      ? "#a78bfa"
      : "#f87171";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #374151",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "680px",
          maxHeight: "90vh",
          overflowY: "auto",
          color: "#f9fafb",
          padding: "24px",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "6px",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>

        {/* Header Header Info */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", paddingRight: "40px" }}>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", margin: 0, color: "#ffffff" }}>
              {student.name}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#9ca3af" }}>
              {student.email} • {profile?.university || "Đại học"} • {profile?.major || "Chuyên ngành"}
            </p>
          </div>

          {/* Match Score Badge */}
          <div
            style={{
              textAlign: "center",
              padding: "8px 16px",
              borderRadius: "8px",
              background: "#1f2937",
              border: "1px solid #374151",
            }}
          >
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#9ca3af" }}>
              Điểm AI Match
            </div>
            <div style={{ fontSize: "24px", fontWeight: "700", color: scoreNum >= 80 ? "#34d399" : scoreNum >= 60 ? "#fbbf24" : "#a78bfa" }}>
              {scoreNum}<span style={{ fontSize: "13px", color: "#6b7280" }}>/100</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "10px",
            marginBottom: "20px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#1f2937",
            border: "1px solid #374151",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>Điểm Uy Tín</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#fbbf24", marginTop: "2px" }}>
              {student.reputation_score} / 100
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>Dự án đã làm</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#60a5fa", marginTop: "2px" }}>
              {profile?.completed_jobs || 0} việc
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>Chứng chỉ OCA/SBT</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#c084fc", marginTop: "2px" }}>
              {sbtList.length} chứng chỉ
            </div>
          </div>

          <div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>Trạng thái ứng tuyển</div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: statusColor, marginTop: "4px" }}>
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Score Breakdown Section */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "#f3f4f6" }}>
            Phân Tích Chi Tiết 5 Tiêu Chí
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* 1. Skills (35 pts) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "#d1d5db" }}>Kỹ năng đối sánh</span>
                <span style={{ fontWeight: "700", color: "#60a5fa" }}>{breakdown.skills} / 35đ</span>
              </div>
              <div style={{ height: "6px", background: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(breakdown.skills / 35) * 100}%`, background: "#3b82f6", borderRadius: "3px" }} />
              </div>
            </div>

            {/* 2. Certificates (20 pts) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "#d1d5db" }}>Chứng nhận Open Campus (OCA/SBT)</span>
                <span style={{ fontWeight: "700", color: "#c084fc" }}>{breakdown.certificates} / 20đ</span>
              </div>
              <div style={{ height: "6px", background: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(breakdown.certificates / 20) * 100}%`, background: "#8b5cf6", borderRadius: "3px" }} />
              </div>
            </div>

            {/* 3. Reputation (20 pts) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "#d1d5db" }}>Điểm uy tín hệ thống</span>
                <span style={{ fontWeight: "700", color: "#fbbf24" }}>{breakdown.reputation} / 20đ</span>
              </div>
              <div style={{ height: "6px", background: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(breakdown.reputation / 20) * 100}%`, background: "#f59e0b", borderRadius: "3px" }} />
              </div>
            </div>

            {/* 4. Experience (15 pts) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "#d1d5db" }}>Kinh nghiệm thực chiến</span>
                <span style={{ fontWeight: "700", color: "#34d399" }}>{breakdown.experience} / 15đ</span>
              </div>
              <div style={{ height: "6px", background: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(breakdown.experience / 15) * 100}%`, background: "#10b981", borderRadius: "3px" }} />
              </div>
            </div>

            {/* 5. On-time Rate (10 pts) */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                <span style={{ color: "#d1d5db" }}>Tỷ lệ bàn giao đúng hạn</span>
                <span style={{ fontWeight: "700", color: "#f472b6" }}>{breakdown.ontime} / 10đ</span>
              </div>
              <div style={{ height: "6px", background: "#374151", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(breakdown.ontime / 10) * 100}%`, background: "#ec4899", borderRadius: "3px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Reasons & Skill Tags */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "#f3f4f6" }}>
            Lý Do Đề Xuất Từ AI
          </h3>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#d1d5db", lineHeight: 1.6 }}>
            {match_reasons && match_reasons.length > 0 ? (
              match_reasons.map((reason, idx) => <li key={idx}>{reason}</li>)
            ) : (
              <li>Hồ sơ phù hợp với yêu cầu cơ bản của công việc.</li>
            )}
          </ul>
        </div>

        {/* Open Campus Achievements (SBTs) Section */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "#f3f4f6" }}>
            Chứng Chỉ Open Campus Achievements (OCA / SBT)
          </h3>
          {sbtList.length === 0 ? (
            <div style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>
              Ứng viên chưa liên kết hoặc chưa có chứng nhận SBT.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
              {sbtList.map((sbt: any, idx: number) => (
                <div
                  key={sbt.id || idx}
                  onClick={() => setSelectedSbt(sbt)}
                  style={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#60a5fa")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#374151")}
                >
                  <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: "600", textTransform: "uppercase" }}>
                    SBT Verified
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff", marginTop: "2px" }}>
                    {sbt.title || sbt.name || "Open Campus Badge"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
                    {sbt.issuer || "Open Campus Alliance"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Reputation History Log Section */}
        <div style={{ marginBottom: "20px" }}>
          <ReputationHistory userId={student.id} title="Lịch sử biến động điểm uy tín ứng viên" />
        </div>

        {/* Employer Action Buttons */}
        {isEmployer && candidate.status !== "accepted" && candidate.status !== "rejected" && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid #374151",
            }}
          >
            <button
              onClick={() => onAccept && onAccept(candidate)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Chấp Nhận Ứng Viên Này
            </button>
            <button
              onClick={() => onReject && onReject(candidate)}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #374151",
                backgroundColor: "#1f2937",
                color: "#ef4444",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Từ Chối
            </button>
          </div>
        )}

        {/* Selected Certificate Detail Sub-Modal */}
        {selectedSbt && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              padding: "20px",
            }}
            onClick={() => setSelectedSbt(null)}
          >
            <div
              style={{
                backgroundColor: "#111827",
                border: "1px solid #374151",
                borderRadius: "10px",
                width: "100%",
                maxWidth: "480px",
                padding: "20px",
                color: "#ffffff",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedSbt(null)}
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  background: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "6px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9ca3af",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>

              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 14px", color: "#ffffff" }}>
                {selectedSbt.title || selectedSbt.name || "Open Campus Certificate"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#1f2937", padding: "14px", borderRadius: "8px", border: "1px solid #374151" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Tổ chức Cấp phát</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#38bdf8", marginTop: "2px" }}>
                    {selectedSbt.issuer || "Open Campus Protocol Alliance"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Thời gian cấp</div>
                  <div style={{ fontSize: "12px", color: "#d1d5db", marginTop: "2px" }}>
                    {selectedSbt.issued_at || selectedSbt.issuedAt || "2026-01-15"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase" }}>Mã Xác Thực On-chain</div>
                  <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#34d399", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                    {selectedSbt.credential_hash || selectedSbt.tokenAddress || "0x8f7e9a1b2c3d4e5f"}
                    <a
                      href={`https://explorer.solana.com/address/${selectedSbt.credential_hash || "JC8zNCPiuxsCdrH7ffLxEvYX65PSWkGXSUt1rqMZ3KRQ"}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa" }}
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {selectedSbt.skills && selectedSbt.skills.length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", marginBottom: "4px" }}>Kỹ năng đã chứng nhận</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {selectedSbt.skills.map((sk: string) => (
                        <span key={sk} style={{ padding: "2px 6px", borderRadius: "4px", background: "rgba(139, 92, 246, 0.2)", color: "#c084fc", fontSize: "11px" }}>
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
                <button
                  onClick={() => setSelectedSbt(null)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    background: "#374151",
                    color: "#ffffff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
