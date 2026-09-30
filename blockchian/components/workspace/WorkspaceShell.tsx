"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Scale,
  Users,
  Building2,
  ArrowRightLeft,
  Hexagon,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import {
  workspaceApi,
  getStaffToken,
  clearStaffSession,
  type Person,
  type StaffRole,
  type WorkspaceConfig,
} from "@/lib/workspace";
import { Loading, LoadError } from "./ui";
import s from "./Workspace.module.css";
const Session = createContext<{ user: Person; config: WorkspaceConfig } | null>(
  null,
);
export function useWorkspace() {
  const context = useContext(Session);
  if (!context) throw new Error("Workspace context missing");
  return context;
}
const labels = {
  employer: "Doanh nghiệp",
  mentor: "Mentor",
  admin: "Quản trị viên",
};
export default function WorkspaceShell({
  role,
  children,
}: {
  role: StaffRole;
  children: ReactNode;
}) {
  const [session, setSession] = useState<{
    user: Person;
    config: WorkspaceConfig;
  } | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [mobile, setMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!getStaffToken()) {
      router.replace("/login");
      return;
    }
    const controller = new AbortController();
    Promise.all([
      workspaceApi<Person>("/me", { signal: controller.signal }),
      workspaceApi<WorkspaceConfig>("/workspace/config", {
        signal: controller.signal,
      }),
    ])
      .then(([user, config]) => {
        if (user.role !== role) {
          router.replace(
            user.role === "student" ? "/login" : "/dashboard/" + user.role,
          );
          return;
        }
        setError("");
        setSession({ user, config });
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      });
    const expired = () => {
      clearStaffSession();
      setSession(null);
      router.replace("/login");
    };
    window.addEventListener("edulink:session-expired", expired);
    return () => {
      controller.abort();
      window.removeEventListener("edulink:session-expired", expired);
    };
  }, [role, router, retry]);
  const logout = async () => {
    await workspaceApi("/logout", { method: "POST" }).catch(() => {});
    clearStaffSession();
    router.replace("/login");
  };
  const base = "/dashboard/" + role;
  const links =
    role === "employer"
      ? [
          { href: base, label: "Công việc", icon: BriefcaseBusiness },
          { href: base + "/disputes", label: "Tranh chấp", icon: Scale },
          {
            href: base + "/transactions",
            label: "Giao dịch",
            icon: ArrowRightLeft,
          },
          {
            href: base + "/profile",
            label: "Hồ sơ doanh nghiệp",
            icon: Building2,
          },
        ]
      : role === "mentor"
        ? [{ href: base, label: "Hồ sơ tranh chấp", icon: Scale }]
        : [
            { href: base, label: "Người dùng", icon: Users },
            {
              href: base + "/jobs",
              label: "Công việc",
              icon: BriefcaseBusiness,
            },
            { href: base + "/disputes", label: "Tranh chấp", icon: Scale },
            {
              href: base + "/transactions",
              label: "Giao dịch",
              icon: ArrowRightLeft,
            },
          ];
  if (error && !session)
    return (
      <div className={s.content}>
        <LoadError message={error} retry={() => setRetry((v) => v + 1)} />
        <Link className={s.link} href="/login">
          Về đăng nhập
        </Link>
      </div>
    );
  if (!session) return <Loading />;
  return (
    <Session.Provider value={session}>
      <div className={s.shell}>
        <aside
          className={s.sidebar + " " + (mobile ? s.open : "")}
          aria-label="Điều hướng workspace"
        >
          <Link className={s.brand} href="/">
            <Hexagon size={27} />
            <span>
              EduLink <span className="gradient-text">Hub</span>
            </span>
          </Link>
          <div className={s.identity}>
            <span className={s.eyebrow}>{labels[role]}</span>
            <strong>{session.user.name}</strong>
            <span>{session.user.email}</span>
          </div>
          <nav className={s.nav}>
            {links.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== base && pathname.startsWith(item.href + "/")) ||
                (role === "employer" &&
                  item.href === base &&
                  pathname.startsWith(base + "/jobs")) ||
                (role === "mentor" && item.href === base);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? s.active : ""}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMobile(false)}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={s.sidebarBottom}>
            <p>
              Cùng xây dựng cơ hội.
              <br />
              Từng công việc, từng cột mốc.
            </p>
            <button className={s.logout} onClick={logout}>
              <LogOut size={17} />
              Đăng xuất
            </button>
            <button className={s.mobileMenu} onClick={() => setMobile(false)}>
              <X size={18} />
              Đóng menu
            </button>
          </div>
        </aside>
        <div className={s.main}>
          <div className={s.topbar}>
            <div className={s.actions}>
              <button
                className={s.mobileMenu}
                aria-label="Mở menu"
                aria-expanded={mobile}
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={20} />
              </button>
              <span>Không gian làm việc / {labels[role]}</span>
            </div>
            <span className={s.network}>
              <i className={s.dot} />
              {session.config.blockchain_mode === "mock"
                ? "Thanh toán mô phỏng"
                : "Solana Devnet"}
            </span>
          </div>
          <main className={s.content}>{children}</main>
        </div>
      </div>
    </Session.Provider>
  );
}
