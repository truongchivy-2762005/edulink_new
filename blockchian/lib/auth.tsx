"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearStudentToken,
  getStudentToken,
  publicApi,
  setStudentToken,
  studentApi,
} from "./student-client";

export type UserRole = "student" | "employer" | "mentor" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  ocid?: string;
  walletAddress?: string;
  creditScore: number;
  usdc: number;
  sbtCount: number;
  joinedAt: string;
  university?: string;
  major?: string;
  companyName?: string;
  industry?: string;
  title?: string;
  expertise?: string;
}

export interface RegisterData {
  role: UserRole;
  name: string;
  email: string;
  password?: string;
  university?: string;
  major?: string;
  companyName?: string;
  industry?: string;
  title?: string;
  expertise?: string;
  adminCode?: string;
}

interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  wallet_address?: string | null;
  ocid?: string | null;
  reputation_score: number;
  earned_balance?: number;
  sbt_count?: number;
  created_at: string;
  student_profile?: {
    university?: string | null;
    major?: string | null;
    sbt_data?: unknown[] | null;
  } | null;
}

interface AuthResult {
  user: BackendUser;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (roleOrEmail: UserRole | string, passwordOrEmail?: string) => Promise<User>;
  loginWithCredentials: (email: string, password?: string, role?: UserRole) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  getAccountByEmail: (email: string) => User | undefined;
}

const mapUser = (user: BackendUser): User => ({
  id: String(user.id),
  name: user.name,
  email: user.email,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`,
  role: user.role,
  ocid: user.ocid || undefined,
  walletAddress: user.wallet_address || undefined,
  creditScore: user.reputation_score,
  usdc: Number(user.earned_balance || 0),
  sbtCount: user.sbt_count ?? user.student_profile?.sbt_data?.length ?? 0,
  joinedAt: user.created_at,
  university: user.student_profile?.university || undefined,
  major: user.student_profile?.major || undefined,
});

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => { throw new Error("not initialized"); },
  loginWithCredentials: async () => { throw new Error("not initialized"); },
  register: async () => { throw new Error("not initialized"); },
  logout: () => {},
  getAccountByEmail: () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      if (!getStudentToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const backendUser = await studentApi<BackendUser>("/me");
        if (active && backendUser.role === "student") setUser(mapUser(backendUser));
        if (backendUser.role !== "student") clearStudentToken();
      } catch {
        clearStudentToken();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    restore();

    const expire = () => {
      clearStudentToken();
      setUser(null);
    };
    window.addEventListener("edulink:session-expired", expire);
    return () => {
      active = false;
      window.removeEventListener("edulink:session-expired", expire);
    };
  }, []);

  const loginWithCredentials = async (
    email: string,
    password = "",
    expectedRole?: UserRole,
  ): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await publicApi<AuthResult>("/login", {
        method: "POST",
        body: { email: email.trim(), password },
      });
      if (expectedRole && result.user.role !== expectedRole) {
        throw new Error("Tài khoản không thuộc vai trò đã chọn.");
      }
      if (result.user.role !== "student") {
        throw new Error("Tài khoản này cần đăng nhập ở workspace dành cho nhân sự.");
      }
      setStudentToken(result.token);
      const mapped = mapUser(result.user);
      setUser(mapped);
      return mapped;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (roleOrEmail: UserRole | string, passwordOrEmail?: string) => {
    if (roleOrEmail === "student") {
      return loginWithCredentials("student@edulink.test", "Password123!", "student");
    }
    return loginWithCredentials(roleOrEmail, passwordOrEmail);
  };

  const register = async (data: RegisterData): Promise<User> => {
    if (data.role === "admin") {
      throw new Error("Không thể tự đăng ký tài khoản quản trị viên.");
    }
    const password = data.password || "";
    setIsLoading(true);
    try {
      const result = await publicApi<AuthResult>("/register", {
        method: "POST",
        body: {
          name: data.name.trim(),
          email: data.email.trim(),
          password,
          password_confirmation: password,
          role: data.role,
        },
      });
      setStudentToken(result.token);

      let backendUser = result.user;
      if (data.role === "student" && (data.university || data.major)) {
        backendUser = await studentApi<BackendUser>("/profile", {
          method: "PUT",
          body: { university: data.university, major: data.major },
        });
      }

      const mapped = mapUser(backendUser);
      setUser(data.role === "student" ? mapped : null);
      if (data.role !== "student") {
        sessionStorage.setItem("edulink_staff_token_v1", result.token);
        clearStudentToken();
      }
      return mapped;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    studentApi("/logout", { method: "POST" }).catch(() => {});
    clearStudentToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      loginWithCredentials,
      register,
      logout,
      getAccountByEmail: () => undefined,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function getDashboardPath(role: UserRole): string {
  return {
    student: "/dashboard/student",
    employer: "/dashboard/employer",
    mentor: "/dashboard/mentor",
    admin: "/dashboard/admin",
  }[role];
}
