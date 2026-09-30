"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, UserRole, getDashboardPath } from "@/lib/auth";
import styles from "./login.module.css";
import { staffLogin } from "@/lib/workspace";

const ROLES: {
  role: UserRole;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
}[] = [
  {
    role: "student",
    icon: "🎓",
    title: "Sinh viên",
    subtitle: "Nhận việc, tích lũy SBT CV, nhận thanh toán USDC",
    color: "#9945FF",
  },
  {
    role: "employer",
    icon: "🏢",
    title: "Doanh nghiệp",
    subtitle: "Đăng việc, ký quỹ Smart Contract, tuyển nhân tài",
    color: "#3B82F6",
  },
  {
    role: "mentor",
    icon: "🧑‍🏫",
    title: "Mentor / Chuyên gia",
    subtitle: "Cố vấn, thẩm định tranh chấp, nhận thù lao DAO",
    color: "#F59E0B",
  },
  {
    role: "admin",
    icon: "🛡️",
    title: "Quản trị viên",
    subtitle: "Quản trị hệ thống, giám sát On-chain metrics",
    color: "#14F195",
  },
];

export default function LoginPage() {
  const { loginWithCredentials, login } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu.");
      return;
    }

    try {
      setIsLoading(true);
      const loggedUser = selectedRole === "student"
        ? await loginWithCredentials(email, password, selectedRole)
        : await staffLogin(email, password, selectedRole);
      router.push(getDashboardPath(loggedUser.role));
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  const handleSocialLogin = async (role: UserRole) => {
    if (selectedRole !== "student") {
      setErrorMessage("Đăng nhập Google/OCID chưa được tích hợp cho workspace. Vui lòng dùng email và mật khẩu tài khoản hệ thống.");
      return;
    }
    try {
      setIsLoading(true);
      const loggedUser = await login(role);
      router.push(getDashboardPath(loggedUser.role));
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Background glow */}
      <div className={styles.bgGlow} />

      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className="gradient-text">EduLink Hub</span>
        </Link>

        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Chào mừng trở lại</h1>
            <p className={styles.subtitle}>
              Đăng nhập để truy cập tài khoản Web2.5 &amp; Ví Solana của bạn
            </p>
          </div>

          {/* Role selection tabs */}
          <div className={styles.rolesGrid}>
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.role;
              return (
                <div
                  key={r.role}
                  id={`role-btn-${r.role}`}
                  className={`${styles.roleOption} ${isSelected ? styles.roleOptionSelected : ""}`}
                  style={isSelected ? ({ "--role-color": r.color } as React.CSSProperties) : undefined}
                  onClick={() => handleRoleSelect(r.role)}
                >
                  <div className={styles.roleHeader}>
                    <span className={styles.roleIcon}>{r.icon}</span>
                    <div className={`${styles.radioCheck} ${isSelected ? styles.radioCheckSelected : ""}`}>
                      {isSelected && <div className={styles.radioDot} />}
                    </div>
                  </div>
                  <div className={styles.roleTitle}>{r.title}</div>
                  <div className={styles.roleSub}>{r.subtitle}</div>
                </div>
              );
            })}
          </div>

          {selectedRole !== "student" && <p style={{fontSize: 13, color: "var(--text-secondary)", marginBottom: 18}}>Workspace sử dụng tài khoản do hệ thống cấp. Phiên đăng nhập được giữ trong tab hiện tại.</p>}

          {/* Error Alert */}
          {errorMessage && (
            <div className={styles.errorAlert}>
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {/* Email Field */}
            <div className="input-group">
              <label className="input-label" htmlFor="login-email">
                Địa chỉ Email *
              </label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="VD: ten@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="input-group" style={{ marginTop: "14px" }}>
              <label className="input-label" htmlFor="login-password">
                Mật khẩu *
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Nhập mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            {/* Remember & Forgot options */}
            <div className={styles.optionsRow}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  className={styles.rememberCheckbox}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>

              <a
                href="#"
                className={styles.forgotLink}
                onClick={(e) => {
                  e.preventDefault();
                  alert("Vui lòng liên hệ quản trị viên hoặc tạo tài khoản mới nếu bạn quên mật khẩu.");
                }}
              >
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              id="login-submit-btn"
              type="submit"
              className={`btn-primary ${styles.loginBtn}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.spinner} />
                  Đang đăng nhập...
                </>
              ) : (
                <>
                  🚀 Đăng nhập
                  {selectedRole && ` — ${ROLES.find((r) => r.role === selectedRole)?.title}`}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.orRow}>
            <span className={styles.orLine} />
            <span className={styles.orText}>hoặc đăng nhập bằng</span>
            <span className={styles.orLine} />
          </div>

          {/* Social login buttons */}
          <div className={styles.socialBtns}>
            <button
              id="google-login-btn"
              type="button"
              className={styles.socialBtn}
              onClick={() => handleSocialLogin(selectedRole)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
              </svg>
              Google
            </button>

            <button
              id="ocid-login-btn"
              type="button"
              className={`${styles.socialBtn} ${styles.ocidBtn}`}
              onClick={() => handleSocialLogin("student")}
            >
              <span style={{ fontSize: "16px" }}>🎓</span>
              Open Campus OCID
            </button>
          </div>

          {/* Switch to Register */}
          <div className={styles.registerSwitch}>
            Chưa có tài khoản?
            <Link href="/register" id="link-to-register">
              Đăng ký ngay
            </Link>
          </div>

          <p className={styles.terms}>
            Bằng cách đăng nhập, bạn đồng ý với{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản sử dụng</a> và{" "}
            <a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a> của EduLink Hub.
          </p>
        </div>

        {/* Trust badges */}
        <div className={styles.trustBadges}>
          <span>🔒 Ví Solana mã hóa end-to-end</span>
          <span>⛓️ Dữ liệu trên blockchain không thể xóa</span>
          <span>⚡ Nhận USDC trong &lt; 1 giây</span>
        </div>
      </div>
    </div>
  );
}
