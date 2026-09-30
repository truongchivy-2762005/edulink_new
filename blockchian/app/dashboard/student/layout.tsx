"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import StudentSidebar from "@/components/student/StudentSidebar";
import styles from "./layout.module.css";

export default function StudentDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.loadingSpinner} />
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user || user.role !== "student") return null;

  return (
    <div className="dashboard-layout">
      <StudentSidebar />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
