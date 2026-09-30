"use client";
import React, { useState } from "react";
import { createPortal } from "react-dom";

export interface SBTItem {
  id: string;
  title: string;
  issuer: string;
  issued_at: string;
  skills: string[];
  credential_hash: string;
  verified?: boolean;
  description?: string;
}

interface SBTListProps {
  sbts: SBTItem[];
}

export default function SBTList({ sbts }: SBTListProps) {
  const [selectedSbt, setSelectedSbt] = useState<SBTItem | null>(null);

  if (!sbts || sbts.length === 0) {
    return (
      <div
        style={{
          padding: "24px",
          textAlign: "center",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px dashed #cbd5e1",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        Chưa có chứng nhận Open Campus Achievement nào được cấp.
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {sbts.map((sbt) => (
          <div
            key={sbt.id}
            onClick={() => setSelectedSbt(sbt)}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              padding: "16px",
              cursor: "pointer",
              transition: "border-color 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#2563eb";
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(37, 99, 235, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  textTransform: "uppercase",
                }}
              >
                SBT Verified
              </span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{sbt.issued_at}</span>
            </div>

            <div style={{ fontWeight: 700, fontSize: "15px", color: "#0f172a", marginBottom: "4px" }}>
              {sbt.title}
            </div>

            <div style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
              {sbt.issuer}
            </div>

            {sbt.skills && sbt.skills.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {sbt.skills.slice(0, 3).map((skill, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "11px",
                      padding: "2px 6px",
                      backgroundColor: "#f1f5f9",
                      color: "#334155",
                      borderRadius: "4px",
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Credential Detail Modal */}
      {selectedSbt &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.75)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "16px",
            }}
            onClick={() => setSelectedSbt(null)}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "500px",
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                padding: "24px",
                color: "#1e293b",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
                  Chi tiết Chứng nhận Open Campus
                </h3>
                <button
                  onClick={() => setSelectedSbt(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "20px",
                    cursor: "pointer",
                    color: "#64748b",
                    padding: "4px",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "16px", color: "#0f172a", marginBottom: "4px" }}>
                  {selectedSbt.title}
                </div>
                <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                  Đơn vị cấp: <strong>{selectedSbt.issuer}</strong>
                </div>
                <div style={{ fontSize: "13px", color: "#475569", marginBottom: "12px" }}>
                  Ngày cấp: {selectedSbt.issued_at}
                </div>

                {selectedSbt.description && (
                  <div style={{ fontSize: "13px", color: "#334155", marginBottom: "12px", lineHeight: 1.4 }}>
                    {selectedSbt.description}
                  </div>
                )}

                <div style={{ marginBottom: "12px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", marginBottom: "6px" }}>
                    Kỹ năng đã được xác thực:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {selectedSbt.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "12px",
                          padding: "3px 8px",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          borderRadius: "6px",
                          fontWeight: 500,
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#64748b", wordBreak: "break-all" }}>
                  Mã On-Chain Hash: <code style={{ color: "#2563eb", fontFamily: "monospace" }}>{selectedSbt.credential_hash}</code>
                </div>
              </div>

              <button
                onClick={() => setSelectedSbt(null)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Đóng
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
