"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/workspace";
import { generateMockOCID, getOCIDConnectUrl } from "@/lib/ocid";

interface OCIDConnectModalProps {
  currentOcid?: string | null;
  userName?: string;
  onSuccess?: () => void;
}

function cleanSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "student";
}

function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("edulink_student_token_v1") ||
    sessionStorage.getItem("edulink_staff_token_v1") ||
    ""
  );
}

export default function OCIDConnectModal({
  currentOcid,
  userName = "Student",
  onSuccess,
}: OCIDConnectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customOcid, setCustomOcid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const defaultSlug = cleanSlug(userName);
  const placeholderOcid = `ocid.${defaultSlug}.edu`;

  const handleConnect = async (ocidToConnect?: string) => {
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.");
      }

      const mock = generateMockOCID(userName);
      const targetOcid = ocidToConnect || customOcid.trim() || placeholderOcid;
      const targetUsername = targetOcid.replace(/^ocid\./, "").replace(/\.(edu|eth)$/, "");

      // Call Laravel API /ocid/connect with student/staff token
      const res = await fetch(`${API_BASE}/ocid/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ocid: targetOcid,
          ocid_username: targetUsername,
          id_token: mock.id_token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Kết nối OCID thất bại.");
      }

      setSuccessMsg("Kết nối thành công Open Campus ID!");
      setTimeout(() => {
        setIsOpen(false);
        if (onSuccess) onSuccess();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Xảy ra lỗi khi kết nối OCID.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth2Redirect = () => {
    const sandboxUrl = getOCIDConnectUrl(window.location.href);
    window.open(sandboxUrl, "_blank", "noopener,noreferrer");
  };

  const modalContent = isOpen ? (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
    >
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #374151",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "460px",
          padding: "20px",
          color: "#f9fafb",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
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

        <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px", color: "#ffffff" }}>
          Kết nối Open Campus ID (OCID)
        </h3>
        <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: "1.4", marginBottom: "16px" }}>
          Xác thực danh tính Web3 và lưu chứng chỉ học tập trên Open Campus Sandbox.
        </p>

        {error && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid #ef4444",
              color: "#fca5a5",
              fontSize: "12px",
              marginBottom: "14px",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "6px",
              background: "rgba(16, 185, 129, 0.15)",
              border: "1px solid #10b981",
              color: "#6ee7b7",
              fontSize: "12px",
              marginBottom: "14px",
            }}
          >
            {successMsg}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "600", color: "#d1d5db", display: "block", marginBottom: "4px" }}>
              Mã OCID mong muốn
            </label>
            <input
              type="text"
              placeholder={placeholderOcid}
              value={customOcid}
              onChange={(e) => setCustomOcid(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#1f2937",
                border: "1px solid #374151",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => handleConnect()}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              fontWeight: "600",
              fontSize: "13px",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Đang kết nối...
              </>
            ) : (
              "Kết nối Sandbox (1-Click)"
            )}
          </button>

          <div style={{ textAlign: "center", fontSize: "11px", color: "#6b7280" }}>Hoặc</div>

          <button
            type="button"
            onClick={handleOAuth2Redirect}
            style={{
              width: "100%",
              padding: "8px",
              borderRadius: "8px",
              background: "#1f2937",
              border: "1px solid #374151",
              color: "#38bdf8",
              fontSize: "12px",
              fontWeight: "500",
              cursor: "pointer",
            }}
          >
            Mở luồng OAuth2 Open Campus ID
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        style={{
          width: "100%",
          padding: "8px 14px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "13px",
          cursor: "pointer",
          border: currentOcid ? "1px solid #10b981" : "none",
          background: currentOcid ? "rgba(16, 185, 129, 0.15)" : "#2563eb",
          color: currentOcid ? "#34d399" : "#ffffff",
          marginTop: "10px",
        }}
      >
        {currentOcid ? "Đã kết nối OCID Sandbox" : "Kết nối Open Campus ID (OCID)"}
      </button>

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
