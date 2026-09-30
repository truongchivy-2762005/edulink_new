"use client";

import { AuthProvider } from "@/lib/auth";
import SolanaWalletProvider from "@/components/SolanaWalletProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SolanaWalletProvider>
      <AuthProvider>{children}</AuthProvider>
    </SolanaWalletProvider>
  );
}
