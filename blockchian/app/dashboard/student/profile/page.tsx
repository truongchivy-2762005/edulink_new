"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import CreditScoreRing from "@/components/student/CreditScoreRing";
import { fetchSBTs, type SBT } from "@/lib/api";
import { ExternalLink, Copy, Check } from "lucide-react";
import SolanaWalletConnect from "@/components/SolanaWalletConnect";
import OCIDConnectModal from "@/components/student/OCIDConnectModal";
import { API_BASE, getStaffToken } from "@/lib/workspace";
import styles from "./page.module.css";

export default function ProfilePage() {
  const { user } = useAuth();
  const [sbts, setSBTs] = useState<SBT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSBTs()
      .then(setSBTs)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không tải được SBT."))
      .finally(() => setIsLoading(false));
  }, []);

  // Handle OAuth2 Open Campus ID Redirect Callback Parameters
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const ocidParam = urlParams.get("ocid");

    if ((code || ocidParam || state?.startsWith("ocid_connect_")) && user && !user.ocid) {
      const cleanSlug = user.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "") || "student";

      const targetOcid = ocidParam || `ocid.${cleanSlug}.edu`;
      const targetUsername = targetOcid.replace(/^ocid\./, "").replace(/\.(edu|eth)$/, "");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("edulink_student_token_v1") ||
          sessionStorage.getItem("edulink_staff_token_v1") ||
          getStaffToken()
          : null;

      fetch(`${API_BASE}/ocid/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ocid: targetOcid,
          ocid_username: targetUsername,
          id_token: code || "oauth2_sandbox_token",
        }),
      })
        .then((res) => res.json())
        .then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          window.location.reload();
        })
        .catch(() => { });
    }
  }, [user]);

  const copyOCID = () => {
    navigator.clipboard.writeText(user?.ocid || "").then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!user) return null;

  const CATEGORY_COLORS: Record<string, string> = {
    Frontend: "badge-purple",
    Blockchain: "badge-green",
    Web3: "badge-blue",
    "Work Experience": "badge-gold",
    Design: "badge-red",
    Backend: "badge-gray",
    Data: "badge-blue",
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Hồ sơ & SBT Credentials</h1>
      {error && <div className="badge badge-red" style={{ marginBottom: "16px" }}>{error}</div>}

      <div className={styles.layout}>
        {/* ── Left: Profile card ── */}
        <div className={styles.leftCol}>
          {/* Profile card */}
          <div className={`glass-card ${styles.profileCard}`}>
            <div className={styles.avatarWrap}>
              <img src={user.avatar} alt={user.name} className={styles.avatar} />
              <div className={styles.onlineDot} />
            </div>
            <h2 className={styles.userName}>{user.name}</h2>
            <p className={styles.userEmail}>{user.email}</p>
            <span className="badge badge-purple" style={{ marginTop: "8px" }}>Sinh viên</span>

            <div className="divider" />

            {/* OCID */}
            {user.ocid && (
              <div className={styles.ocidBox}>
                <div className={styles.ocidLabel}>Open Campus ID</div>
                <div className={styles.ocidValue}>
                  <span className="mono">{user.ocid}</span>
                  <button id="copy-ocid" onClick={copyOCID} className={styles.copyBtn}>
                    {copied ? <Check size={14} color="var(--color-secondary)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            <OCIDConnectModal currentOcid={user.ocid} userName={user.name} />

            {/* Wallet */}
            {user.walletAddress && (
              <div className={styles.walletBox}>
                <div className={styles.ocidLabel}>Solana Wallet (On-chain)</div>
                <div className={styles.ocidValue}>
                  <span className="mono" style={{ fontSize: "12px" }}>{user.walletAddress}</span>
                  <a
                    href={`https://explorer.solana.com/address/${user.walletAddress}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.copyBtn}
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )}

            <SolanaWalletConnect />

            {/* Joined */}
            <div className={styles.joinedRow}>
              Tham gia từ {new Date(user.joinedAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
            </div>
          </div>

          {/* Credit Score */}
          <div className={`glass-card ${styles.creditCard}`}>
            <h3 className={styles.creditTitle}>Điểm Uy tín</h3>
            <div className={styles.creditCenter}>
              <CreditScoreRing score={user.creditScore} size={160} />
            </div>
            <div className={styles.creditBreakdown}>
              <div className={styles.bdRow}>
                <span>Hoàn thành đúng hạn</span>
                <span style={{ color: "var(--color-secondary)" }}>+350</span>
              </div>
              <div className={styles.bdRow}>
                <span>Đánh giá từ DN</span>
                <span style={{ color: "var(--color-secondary)" }}>+280</span>
              </div>
              <div className={styles.bdRow}>
                <span>SBT credentials</span>
                <span style={{ color: "var(--color-primary)" }}>+152</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: SBT Grid ── */}
        <div className={styles.rightCol}>
          <div className={styles.sbtHeader}>
            <h2 className={styles.sbtTitle}>
              Soulbound Token Credentials
              <span className="badge badge-purple" style={{ marginLeft: "10px" }}>{sbts.length} SBTs</span>
            </h2>
            <p className={styles.sbtSubtitle}>
              Các chứng chỉ on-chain từ Open Campus — không thể làm giả, không thể chuyển nhượng.
            </p>
          </div>

          {isLoading ? (
            <div className="grid-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton" style={{ height: "200px", borderRadius: "var(--radius-lg)" }} />
              ))}
            </div>
          ) : (
            <div className="grid-2">
              {sbts.map((sbt) => (
                <div key={sbt.id} className={`glass-card ${styles.sbtCard}`}>
                  {/* SBT Image/Icon */}
                  <div className={styles.sbtImgWrap}>
                    <img src={sbt.imageUrl} alt={sbt.title} className={styles.sbtImg} />
                  </div>

                  <div className={styles.sbtInfo}>
                    <span className={`badge ${CATEGORY_COLORS[sbt.category] || "badge-gray"}`}>
                      {sbt.category}
                    </span>
                    <h3 className={styles.sbtName}>{sbt.title}</h3>
                    <p className={styles.sbtIssuer}>✓ {sbt.issuer}</p>
                    <p className={styles.sbtMeta}>{sbt.metadata}</p>
                  </div>

                  <div className={styles.sbtFooter}>
                    <div className={styles.sbtDate}>
                      Cấp ngày {new Date(sbt.issuedAt).toLocaleDateString("vi-VN")}
                    </div>
                    {sbt.tokenAddress && (
                      <a
                        href={`https://explorer.solana.com/address/${sbt.tokenAddress}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.sbtLink}
                      >
                        Xem on-chain <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
