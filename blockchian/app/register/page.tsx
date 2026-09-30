"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, UserRole, getDashboardPath } from "@/lib/auth";
import styles from "./register.module.css";

const ROLES: {
  role: UserRole;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  badge: string;
}[] = [
  {
    role: "student",
    icon: "🎓",
    title: "Sinh viên",
    subtitle: "Nhận việc, tích lũy SBT CV, nhận thanh toán USDC",
    color: "#9945FF",
    badge: "Open Campus OCID",
  },
  {
    role: "employer",
    icon: "🏢",
    title: "Doanh nghiệp",
    subtitle: "Đăng việc, ký quỹ Smart Contract, tuyển nhân tài",
    color: "#3B82F6",
    badge: "Escrow Vault",
  },
  {
    role: "mentor",
    icon: "🧑‍🏫",
    title: "Mentor / Chuyên gia",
    subtitle: "Cố vấn, thẩm định tranh chấp, nhận thù lao DAO",
    color: "#F59E0B",
    badge: "DAO Dispute",
  },
  {
    role: "admin",
    icon: "🛡️",
    title: "Quản trị viên",
    subtitle: "Quản trị hệ thống, giám sát On-chain metrics",
    color: "#14F195",
    badge: "System Governance",
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [selectedRole, setSelectedRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Student fields
  const [university, setUniversity] = useState("ĐH Khoa học Tự nhiên - ĐHQG TP.HCM");
  const [major, setMajor] = useState("Công nghệ thông tin (Kỹ thuật phần mềm)");
  // Employer fields
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("Công nghệ thông tin / Web3");

  // Mentor fields
  const [title, setTitle] = useState("Kỹ sư trưởng / Chuyên gia");
  const [expertise, setExpertise] = useState("Blockchain & Smart Contracts (Rust/Solana)");

  // Admin field
  const [adminCode, setAdminCode] = useState("");

  const [agreedTerms, setAgreedTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [creationStep, setCreationStep] = useState(0);

  // Calculate password strength
  const getPasswordStrength = () => {
    if (!password) return { score: 0, text: "", color: "transparent" };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, text: "Yếu", color: "#EF4444" };
    if (score <= 3) return { score: 2, text: "Trung bình", color: "#F59E0B" };
    return { score: 3, text: "Mạnh", color: "#10B981" };
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    // Basic Validations
    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập họ và tên hoặc tên tổ chức.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!agreedTerms) {
      setErrorMessage("Bạn cần đồng ý với Điều khoản sử dụng & Chính sách bảo mật.");
      return;
    }

    if (selectedRole === "admin" && adminCode.trim() !== "EDULINK_ROOT" && adminCode.trim() !== "ADMIN2025") {
      setErrorMessage("Mã xác thực Quản trị viên không chính xác (Gợi ý thử: ADMIN2025 hoặc EDULINK_ROOT).");
      return;
    }

    try {
      setIsLoading(true);
      setCreationStep(1); // Tạo cặp khóa ví Solana

      setTimeout(() => setCreationStep(2), 500); // Cấp định danh OCID & SBT
      setTimeout(() => setCreationStep(3), 1000); // Khởi tạo Passport & Tín dụng

      const newUser = await register({
        role: selectedRole,
        name: selectedRole === "employer" ? (companyName || name) : name,
        email,
        password,
        university: selectedRole === "student" ? university : undefined,
        major: selectedRole === "student" ? major : undefined,
        companyName: selectedRole === "employer" ? companyName : undefined,
        industry: selectedRole === "employer" ? industry : undefined,
        title: selectedRole === "mentor" ? title : undefined,
        expertise: selectedRole === "mentor" ? expertise : undefined,
        adminCode: selectedRole === "admin" ? adminCode : undefined,
      });

      setTimeout(() => {
        router.push(getDashboardPath(newUser.role));
      }, 1400);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi tạo tài khoản.");
    }
  };

  const handleQuickRegister = async (role: UserRole) => {
    setIsLoading(true);
    setCreationStep(1);
    setTimeout(() => setCreationStep(2), 400);
    setTimeout(() => setCreationStep(3), 800);

    const defaultNames: Record<UserRole, string> = {
      student: "Nguyễn Minh Vỹ",
      employer: "TechViet Digital Lab",
      mentor: "TS. Hoàng Quốc Bảo",
      admin: "EduLink Admin",
    };

    const newUser = await register({
      role,
      name: defaultNames[role],
      email: `${role}.${Date.now().toString().slice(-3)}@edulink.io`,
    });

    setTimeout(() => {
      router.push(getDashboardPath(newUser.role));
    }, 1200);
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgGlow} />

      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span className="gradient-text">EduLink Hub</span>
        </Link>

        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Đăng ký tài khoản</h1>
            <p className={styles.subtitle}>
              Khởi tạo hồ sơ Web2.5 & Ví Solana bảo mật chỉ trong 30 giây
            </p>
          </div>

          {/* Role selection tabs */}
          <div className={styles.rolesGrid}>
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.role;
              return (
                <div
                  key={r.role}
                  className={`${styles.roleOption} ${isSelected ? styles.roleOptionSelected : ""}`}
                  style={isSelected ? ({ "--role-color": r.color } as React.CSSProperties) : undefined}
                  onClick={() => setSelectedRole(r.role)}
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

          {/* Error Alert */}
          {errorMessage && (
            <div className={styles.errorAlert}>
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister}>
            <div className={styles.formGrid}>
              {/* Field 1: Full name or Company name */}
              <div className="input-group">
                <label className="input-label" htmlFor="reg-name">
                  {selectedRole === "employer" ? "Tên người đại diện / HR *" : "Họ và tên *"}
                </label>
                <input
                  id="reg-name"
                  type="text"
                  className="input-field"
                  placeholder={
                    selectedRole === "employer"
                      ? "VD: Nguyễn Văn A (HR Lead)"
                      : selectedRole === "mentor"
                      ? "VD: TS. Trần Quốc Bảo"
                      : "VD: Nguyễn Minh Vỹ"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Field 2: Email */}
              <div className="input-group">
                <label className="input-label" htmlFor="reg-email">
                  {selectedRole === "student" ? "Email sinh viên (.edu hoặc cá nhân) *" : "Địa chỉ Email *"}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="input-field"
                  placeholder={
                    selectedRole === "student"
                      ? "vy.nguyen@student.hcmus.edu.vn"
                      : "lienhe@congty.com"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Conditional Role-based fields */}
              {selectedRole === "student" && (
                <>
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-university">Trường Đại học</label>
                    <select
                      id="reg-university"
                      className="input-field"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                    >
                      <option value="ĐH Khoa học Tự nhiên - ĐHQG TP.HCM">ĐH Khoa học Tự nhiên - ĐHQG TP.HCM</option>
                      <option value="ĐH Bách Khoa - ĐHQG TP.HCM">ĐH Bách Khoa - ĐHQG TP.HCM</option>
                      <option value="ĐH Công nghệ Thông tin - ĐHQG TP.HCM">ĐH Công nghệ Thông tin - ĐHQG TP.HCM</option>
                      <option value="ĐH Quốc Tế - ĐHQG TP.HCM">ĐH Quốc Tế - ĐHQG TP.HCM</option>
                      <option value="ĐH Bách Khoa Hà Nội">ĐH Bách Khoa Hà Nội</option>
                      <option value="ĐH Công nghệ - ĐHQG Hà Nội">ĐH Công nghệ - ĐHQG Hà Nội</option>
                      <option value="Đại học FPT">Đại học FPT</option>
                      <option value="ĐH Kinh tế TP.HCM (UEH)">ĐH Kinh tế TP.HCM (UEH)</option>
                      <option value="Trường Đại học khác">Trường Đại học khác</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-major">Chuyên ngành đào tạo</label>
                    <input
                      id="reg-major"
                      type="text"
                      className="input-field"
                      placeholder="VD: Khoa học Máy tính / Thiết kế đồ họa"
                      value={major}
                      onChange={(e) => setMajor(e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedRole === "employer" && (
                <>
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-company">Tên Doanh nghiệp / Tổ chức *</label>
                    <input
                      id="reg-company"
                      type="text"
                      className="input-field"
                      placeholder="VD: TechViet Solutions Co., Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-industry">Lĩnh vực hoạt động</label>
                    <select
                      id="reg-industry"
                      className="input-field"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    >
                      <option value="Công nghệ thông tin / Web3">Công nghệ thông tin / Web3</option>
                      <option value="Fintech & Dịch vụ tài chính">Fintech & Dịch vụ tài chính</option>
                      <option value="Thiết kế đồ họa & Truyền thông">Thiết kế đồ họa & Truyền thông</option>
                      <option value="E-Commerce & Bán lẻ">E-Commerce & Bán lẻ</option>
                      <option value="EdTech & Giáo dục">EdTech & Giáo dục</option>
                      <option value="Khác">Lĩnh vực khác</option>
                    </select>
                  </div>
                </>
              )}

              {selectedRole === "mentor" && (
                <>
                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-title">Học hàm / Chức danh hiện tại</label>
                    <input
                      id="reg-title"
                      type="text"
                      className="input-field"
                      placeholder="VD: TS. Giảng viên / Senior Solution Architect"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label" htmlFor="reg-expertise">Chuyên môn thẩm định</label>
                    <input
                      id="reg-expertise"
                      type="text"
                      className="input-field"
                      placeholder="VD: Smart Contract Audit, AI/ML, Fullstack Web"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                    />
                  </div>
                </>
              )}

              {selectedRole === "admin" && (
                <div className={`input-group ${styles.fullWidth}`}>
                  <label className="input-label" htmlFor="reg-admin-code">Mã khóa xác thực Quản trị (Admin Secret Key) *</label>
                  <input
                    id="reg-admin-code"
                    type="password"
                    className="input-field"
                    placeholder="Nhập mã xác thực hệ thống (thử: ADMIN2025)"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Password */}
              <div className="input-group">
                <label className="input-label" htmlFor="reg-password">Mật khẩu *</label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                  placeholder="Ít nhất 8 ký tự"
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
                {password && (
                  <div className={styles.strengthMeter}>
                    <div className={styles.strengthBars}>
                      <div
                        className={styles.strengthBar}
                        style={{ background: strength.score >= 1 ? strength.color : undefined }}
                      />
                      <div
                        className={styles.strengthBar}
                        style={{ background: strength.score >= 2 ? strength.color : undefined }}
                      />
                      <div
                        className={styles.strengthBar}
                        style={{ background: strength.score >= 3 ? strength.color : undefined }}
                      />
                    </div>
                    <span className={styles.strengthText} style={{ color: strength.color }}>
                      {strength.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label className="input-label" htmlFor="reg-confirm-password">Xác nhận mật khẩu *</label>
                <input
                  id="reg-confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Web2.5 Features Callout */}
            <div className={styles.web25Banner}>
              <span className={styles.web25BannerIcon}>✨</span>
              <div>
                <div className={styles.web25BannerTitle}>
                  Tích hợp Web2.5 tự động &amp; Tiện lợi
                </div>
                <div className={styles.web25BannerDesc}>
                  Hệ thống tự động kích hoạt ví <strong>Solana Ed25519</strong> bảo mật cao và cấp <strong>Hồ sơ Soulbound Token</strong> mà không yêu cầu bạn phải am hiểu Web3.
                </div>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className={styles.termsRow}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
              />
              <span>
                Tôi đồng ý với <a href="#" onClick={(e) => e.preventDefault()}>Điều khoản dịch vụ</a> và <a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a> của EduLink Hub.
              </span>
            </label>

            {/* Submit button */}
            <button
              id="register-submit-btn"
              type="submit"
              className={`btn-primary ${styles.registerBtn}`}
              disabled={isLoading}
            >
              🚀 Đăng ký &amp; Khởi tạo ví Solana
            </button>
          </form>

          {/* Divider */}
          <div className={styles.orRow}>
            <span className={styles.orLine} />
            <span className={styles.orText}>hoặc đăng ký nhanh</span>
            <span className={styles.orLine} />
          </div>

          {/* Social Quick Register Buttons */}
          <div className={styles.socialBtns}>
            <button
              id="google-quick-reg"
              type="button"
              className={styles.socialBtn}
              onClick={() => handleQuickRegister(selectedRole)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
              </svg>
              Google
            </button>

            <button
              id="ocid-quick-reg"
              type="button"
              className={`${styles.socialBtn} ${styles.ocidBtn}`}
              onClick={() => handleQuickRegister("student")}
            >
              <span style={{ fontSize: "16px" }}>🎓</span>
              Open Campus OCID
            </button>
          </div>

          {/* Switch to login */}
          <div className={styles.loginSwitch}>
            Đã có tài khoản?
            <Link href="/login" id="link-to-login">
              Đăng nhập ngay
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className={styles.trustBadges}>
          <span>🔒 Mã hóa khóa riêng tư</span>
          <span>⛓️ Dữ liệu SBT bất biến</span>
          <span>⚡ Tốc độ giao dịch &lt; 1s</span>
        </div>
      </div>

      {/* Interactive Blockchain Onboarding Animation Modal */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingModal}>
            <div className={styles.spinnerLarge} />
            <h3 className={styles.modalTitle}>Đang tạo tài khoản Web2.5</h3>
            <p className={styles.modalSub}>Vui lòng giữ kết nối trong giây lát...</p>

            <div className={styles.onboardingSteps}>
              <div
                className={`${styles.onboardingStep} ${
                  creationStep > 1 ? styles.onboardingStepDone : creationStep === 1 ? styles.onboardingStepCurrent : ""
                }`}
              >
                <span className={styles.stepIcon}>{creationStep > 1 ? "✓" : "⚡"}</span>
                <span>Tạo ví Solana Embedded &amp; Cặp khóa bảo mật</span>
              </div>

              <div
                className={`${styles.onboardingStep} ${
                  creationStep > 2 ? styles.onboardingStepDone : creationStep === 2 ? styles.onboardingStepCurrent : ""
                }`}
              >
                <span className={styles.stepIcon}>{creationStep > 2 ? "✓" : "🪪"}</span>
                <span>Khởi tạo Soulbound Passport &amp; Open Campus OCID</span>
              </div>

              <div
                className={`${styles.onboardingStep} ${
                  creationStep >= 3 ? styles.onboardingStepDone : ""
                }`}
              >
                <span className={styles.stepIcon}>{creationStep >= 3 ? "✓" : "🎁"}</span>
                <span>Cấp tín dụng khởi nghiệp &amp; Chuyển hướng Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
