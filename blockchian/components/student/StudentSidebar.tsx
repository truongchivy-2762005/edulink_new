"use client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Briefcase, CheckSquare, TrendingUp, User,
  LogOut, ChevronRight, Wallet,
} from "lucide-react";
import styles from "./StudentSidebar.module.css";

const NAV_ITEMS = [
  { href: "/dashboard/student", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/dashboard/student/jobs", icon: Briefcase, label: "Tìm việc" },
  { href: "/dashboard/student/my-jobs", icon: CheckSquare, label: "Việc của tôi" },
  { href: "/dashboard/student/income", icon: TrendingUp, label: "Thu nhập" },
  { href: "/dashboard/student/profile", icon: User, label: "Hồ sơ & SBT" },
];

export default function StudentSidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⬡</span>
        <span className="gradient-text">EduLink Hub</span>
      </div>

      {/* User card */}
      {user && (
        <div className={styles.userCard}>
          <img src={user.avatar} alt={user.name} className={styles.avatar} />
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userRole}>
              <span className="badge badge-purple">Sinh viên</span>
            </div>
          </div>
        </div>
      )}

      {/* Wallet info */}
      {user?.walletAddress && (
        <div className={styles.walletBox}>
          <div className={styles.walletRow}>
            <Wallet size={14} color="var(--color-secondary)" />
            <span className={`${styles.walletAddr} mono`}>{user.walletAddress}</span>
          </div>
          <div className={styles.walletBalance}>
            <span className={styles.balanceNum}>{user.usdc.toFixed(2)}</span>
            <span className={styles.balanceToken}>USDC</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/dashboard/student"
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s/g, "-")}`}
              className={`${styles.navItem} ${isActive ? styles.navActive : ""}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {isActive && <ChevronRight size={14} className={styles.navChevron} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button id="logout-btn" className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </button>
    </aside>
  );
}
