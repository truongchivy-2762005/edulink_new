"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  const countersRef = useRef<HTMLDivElement>(null);

  // Animate counters when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const counters = entry.target.querySelectorAll("[data-target]");
            counters.forEach((counter) => {
              const target = parseInt(counter.getAttribute("data-target") || "0");
              let current = 0;
              const step = target / 60;
              const timer = setInterval(() => {
                current = Math.min(current + step, target);
                counter.textContent = Math.floor(current).toLocaleString("vi-VN") +
                  (counter.getAttribute("data-suffix") || "");
                if (current >= target) clearInterval(timer);
              }, 16);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    if (countersRef.current) observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.page}>
      {/* Particles background */}
      <div className={styles.particles} aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={styles.particle} style={{
            left: `${(i * 17 + 5) % 100}%`,
            top: `${(i * 23 + 10) % 100}%`,
            animationDelay: `${(i * 0.4) % 5}s`,
            animationDuration: `${4 + (i % 3) * 2}s`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
          }} />
        ))}
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <span className="gradient-text">EduLink Hub</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#how-it-works">Cách hoạt động</a>
            <a href="#features">Tính năng</a>
            <a href="#stats">Thống kê</a>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className="btn-outline" style={{ padding: "10px 20px", fontSize: "13px" }}>
              Đăng nhập
            </Link>
            <Link href="/register" className="btn-primary" style={{ padding: "10px 20px", fontSize: "13px" }}>
              Đăng ký ngay →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className="badge badge-purple">🚀 Web2.5 Platform</span>
          <span className="badge badge-green">Powered by Solana</span>
          <span className="badge badge-gold">Open Campus OCID</span>
        </div>

        <h1 className={styles.heroTitle}>
          Việc làm thực tế.<br />
          <span className="gradient-text">Thanh toán tức thì.</span><br />
          Hồ sơ vĩnh viễn.
        </h1>

        <p className={styles.heroSubtitle}>
          Nền tảng kết nối sinh viên với doanh nghiệp qua{" "}
          <strong>Soulbound Token CV</strong> chống làm giả và{" "}
          <strong>Smart Contract Escrow USDC</strong> chống bùng lương.
        </p>

        <div className={styles.heroActions}>
          <Link href="/register" className="btn-primary" style={{ fontSize: "16px", padding: "14px 32px" }}>
            Tạo hồ sơ miễn phí →
          </Link>
          <a href="#how-it-works" className="btn-ghost" style={{ fontSize: "16px" }}>
            ▶ Xem cách hoạt động
          </a>
        </div>

        <div className={styles.heroChips}>
          <span>✓ Không cần biết Web3</span>
          <span>✓ Nhận USDC chỉ sau vài giây</span>
          <span>✓ CV không thể làm giả</span>
          <span>✓ Không lo bùng lương</span>
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────────── */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.container}>
          <p className="label" style={{ textAlign: "center", marginBottom: "12px" }}>Quy trình</p>
          <h2 className={`section-title ${styles.sectionTitle}`}>
            5 bước từ <span className="gradient-text">đăng ký đến nhận tiền</span>
          </h2>

          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <div key={i} className={`${styles.stepCard} glass-card`}>
                <div className={styles.stepNum}>{step.num}</div>
                <div className={styles.stepIcon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <p className="label" style={{ textAlign: "center", marginBottom: "12px" }}>Tính năng nổi bật</p>
          <h2 className={`section-title ${styles.sectionTitle}`}>
            Được xây dựng để <span className="gradient-text">bảo vệ bạn</span>
          </h2>

          <div className="grid-3" style={{ marginTop: "48px" }}>
            {FEATURES.map((f, i) => (
              <div key={i} className={`glass-card ${styles.featureCard}`}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className="card-title" style={{ marginBottom: "8px" }}>{f.title}</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.7" }}>{f.desc}</p>
                <div className={`badge ${f.badgeClass}`} style={{ marginTop: "16px" }}>{f.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section id="stats" className={styles.statsSection}>
        <div className={styles.container}>
          <div ref={countersRef} className={styles.statsGrid}>
            {STATS.map((s, i) => (
              <div key={i} className={styles.statItem}>
                <div className={styles.statNum}>
                  <span data-target={s.value} data-suffix={s.suffix}>0{s.suffix}</span>
                </div>
                <div className={styles.statLabel}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBox}>
            <h2 className="section-title">Sẵn sàng kiếm <span className="gradient-text">USDC đầu tiên</span>?</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "18px", marginTop: "16px" }}>
              Tạo hồ sơ miễn phí, kết nối OCID và bắt đầu nhận việc ngay hôm nay.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "32px", flexWrap: "wrap" }}>
              <Link href="/login" className="btn-primary" style={{ fontSize: "16px", padding: "16px 40px" }}>
                Bắt đầu — Miễn phí 🎓
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerInner}>
            <div className={styles.footerLogo}>
              <span className="gradient-text" style={{ fontSize: "20px", fontWeight: 800 }}>⬡ EduLink Hub</span>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "8px" }}>
                Thu hẹp khoảng cách giữa Học thuật và Kinh tế Gig.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                Powered by{" "}
                <strong style={{ color: "var(--color-primary)" }}>Open Campus</strong>
                {" "}×{" "}
                <strong style={{ color: "var(--color-secondary)" }}>Solana</strong>
              </span>
            </div>
          </div>
          <div className="divider" />
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
            © {new Date().getFullYear()} EduLink Hub. Dự án cuộc thi Web3 Hackathon.
          </p>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  { num: "01", icon: "🔐", title: "Đăng ký OCID", desc: "Dùng Open Campus ID hoặc Google. Ví Solana tự động tạo." },
  { num: "02", icon: "💼", title: "Khóa USDC Escrow", desc: "Doanh nghiệp lock tiền trước khi đăng việc." },
  { num: "03", icon: "🤖", title: "AI Matching", desc: "AI đối chiếu SBT → Gợi ý Top 5 ứng viên phù hợp nhất." },
  { num: "04", icon: "✅", title: "Hoàn thành & Duyệt", desc: "Nộp bài → Doanh nghiệp duyệt hoặc Mentor trọng tài." },
  { num: "05", icon: "💰", title: "Nhận USDC", desc: "Solana tự chuyển tiền. SBT mới đúc vào OCID của bạn." },
];

const FEATURES = [
  {
    icon: "🪪", title: "Soulbound CV — Không thể làm giả",
    desc: "Bằng cấp và kinh nghiệm được đúc thành NFT Soulbound gắn với danh tính OCID. Doanh nghiệp xác minh on-chain tức thì.",
    badge: "Open Campus OCID", badgeClass: "badge-purple",
  },
  {
    icon: "🔒", title: "Escrow USDC — Không lo bùng lương",
    desc: "Doanh nghiệp phải lock USDC vào smart contract trước. Tiền chỉ giải ngân khi công việc được duyệt.",
    badge: "Solana Smart Contract", badgeClass: "badge-green",
  },
  {
    icon: "🤖", title: "AI Matchmaking — Đúng người đúng việc",
    desc: "AI phân tích SBT của bạn, đối chiếu với job description và gợi ý cơ hội phù hợp nhất.",
    badge: "Gemini AI", badgeClass: "badge-blue",
  },
  {
    icon: "⚡", title: "Thanh toán < 1 giây, phí gần 0",
    desc: "Solana xử lý hàng nghìn giao dịch/giây. Nhận USDC ngay sau khi milestone được duyệt.",
    badge: "Solana Network", badgeClass: "badge-green",
  },
  {
    icon: "🎓", title: "Học kiếm tiền — Learn-to-Earn",
    desc: "Hoàn thành khóa học trên Open Campus, nhận SBT và airdrop USDC.",
    badge: "Learn-to-Earn", badgeClass: "badge-gold",
  },
  {
    icon: "⚖️", title: "Trọng tài phi tập trung",
    desc: "Khi có tranh chấp, 3 Mentor uy tín cao nhất sẽ chấm độc lập. Công bằng, minh bạch.",
    badge: "Decentralized Arbitration", badgeClass: "badge-red",
  },
];

const STATS = [
  { value: 2847, suffix: "+", label: "Sinh viên đã đăng ký" },
  { value: 156, suffix: "+", label: "Doanh nghiệp đối tác" },
  { value: 48500, suffix: "", label: "USDC đã giải ngân" },
  { value: 1243, suffix: "+", label: "Dự án hoàn thành" },
];
