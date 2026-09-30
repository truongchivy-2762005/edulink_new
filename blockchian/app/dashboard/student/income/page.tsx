"use client";
import { useEffect, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { fetchTransactions, getIncomeChartData, type Transaction } from "@/lib/api";
import { ArrowUpRight, ArrowDownLeft, Minus, ExternalLink } from "lucide-react";
import styles from "./page.module.css";

export default function IncomePage() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const chartData = getIncomeChartData(txs);

  useEffect(() => {
    fetchTransactions()
      .then(setTxs)
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Không tải được giao dịch."))
      .finally(() => setIsLoading(false));
  }, []);

  const totalEarned = txs.filter(t => t.type === "earned").reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = txs.filter(t => t.type === "withdrawn").reduce((s, t) => s + t.amount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Thu nhập</h1>
        <p className={styles.subtitle}>Theo dõi USDC kiếm được và lịch sử giao dịch Solana</p>
      </div>

      {error && <div className="badge badge-red" style={{ marginBottom: "16px" }}>{error}</div>}

      {/* Summary cards */}
      <div className={styles.summaryCards}>
        <div className={`glass-card ${styles.summaryCard} ${styles.mainBalance}`}>
          <div className={styles.balanceLabel}>Số dư hiện tại</div>
          <div className={styles.balanceNum}>{(totalEarned - totalWithdrawn).toFixed(2)}</div>
          <div className={styles.balanceToken}>USDC</div>
          <button id="withdraw-btn" className="btn-primary" style={{ marginTop: "20px", fontSize: "13px", padding: "10px 24px" }}>
            Rút về ví Phantom →
          </button>
        </div>

        <div className={`glass-card ${styles.summaryCard}`}>
          <div className={styles.cardIcon} style={{ background: "rgba(20,241,149,0.15)" }}>
            <ArrowUpRight size={20} color="var(--color-secondary)" />
          </div>
          <div className={styles.cardValue} style={{ color: "var(--color-secondary)" }}>
            +{totalEarned.toFixed(1)}
          </div>
          <div className={styles.cardLabel}>Tổng kiếm được (USDC)</div>
        </div>

        <div className={`glass-card ${styles.summaryCard}`}>
          <div className={styles.cardIcon} style={{ background: "rgba(255,77,109,0.15)" }}>
            <ArrowDownLeft size={20} color="var(--color-danger)" />
          </div>
          <div className={styles.cardValue} style={{ color: "var(--color-danger)" }}>
            -{totalWithdrawn.toFixed(1)}
          </div>
          <div className={styles.cardLabel}>Đã rút về ví</div>
        </div>

        <div className={`glass-card ${styles.summaryCard}`}>
          <div className={styles.cardIcon} style={{ background: "rgba(255,215,0,0.15)" }}>
            <Minus size={20} color="var(--color-accent)" />
          </div>
          <div className={styles.cardValue} style={{ color: "var(--color-accent)" }}>
            {(totalEarned - totalWithdrawn).toFixed(1)}
          </div>
          <div className={styles.cardLabel}>Lợi nhuận ròng (USDC)</div>
        </div>
      </div>

      {/* Income Chart */}
      <div className={`glass-card ${styles.chartCard}`}>
        <h2 className={styles.chartTitle}>Thu nhập theo tháng (USDC)</h2>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9945FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9945FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-default)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
                formatter={(val: unknown) => [`${val} USDC`, "Thu nhập"]}
              />
              <Area
                type="monotone"
                dataKey="earned"
                stroke="#9945FF"
                strokeWidth={2}
                fill="url(#incomeGrad)"
                dot={{ fill: "#9945FF", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#14F195" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction history */}
      <div className={styles.txSection}>
        <h2 className={styles.txTitle}>Lịch sử giao dịch</h2>
        {isLoading ? (
          <div className="skeleton" style={{ height: "200px", borderRadius: "var(--radius-lg)" }} />
        ) : (
          <div className={styles.txList}>
            {txs.map((tx) => (
              <div key={tx.id} className={`glass-card ${styles.txCard}`}>
                <div className={`${styles.txIcon} ${tx.type === "earned" ? styles.txEarned : tx.type === "withdrawn" ? styles.txWithdrawn : styles.txISA}`}>
                  {tx.type === "earned" ? <ArrowUpRight size={16} /> :
                   tx.type === "withdrawn" ? <ArrowDownLeft size={16} /> :
                   <Minus size={16} />}
                </div>
                <div className={styles.txInfo}>
                  <div className={styles.txDesc}>{tx.description}</div>
                  <div className={styles.txMeta}>
                    <span>{tx.from}</span>
                    <span>•</span>
                    <span>{new Date(tx.timestamp).toLocaleDateString("vi-VN")}</span>
                    {tx.txHash && (
                      <>
                        <span>•</span>
                        <a
                          href={`https://explorer.solana.com/tx/${tx.txHash}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.txHash}
                        >
                          <span className="mono">{tx.txHash}</span>
                          <ExternalLink size={10} />
                        </a>
                      </>
                    )}
                  </div>
                </div>
                <div className={`${styles.txAmount} ${tx.amount > 0 ? styles.txPos : styles.txNeg}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount} {tx.token}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
