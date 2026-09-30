"use client";
import { useState } from "react";
import Link from "next/link";
import { type Page, type Escrow, money } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceShell";
import {
  Heading,
  Alert,
  Filters,
  useResource,
  Loading,
  LoadError,
  Empty,
  Pagination,
  Status,
  TransactionLink,
} from "./ui";
import s from "./Workspace.module.css";
export default function Transactions() {
  const { user, config } = useWorkspace();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const resource = useResource<Page<Escrow>>(
    "/workspace/escrows?" +
      new URLSearchParams({ page: String(page), search, status }),
  );
  return (
    <>
      <Heading
        eyebrow="Theo dõi thanh toán"
        title="Giao dịch & ký quỹ"
        description="Đối chiếu từng khoản ký quỹ, giải ngân milestone và hoàn tiền."
      />
      {config.blockchain_mode === "mock" && (
        <Alert kind="notice">
          Backend đang ở chế độ mô phỏng. Các giao dịch mock không chuyển token
          trên Solana.
        </Alert>
      )}
      <section className={s.panel}>
        <Filters
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          status={status}
          onStatus={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            ["pending", "Đang chờ"],
            ["locked", "Đã ký quỹ"],
            ["released", "Đã giải ngân"],
            ["refunded", "Đã hoàn tiền"],
          ]}
        />
        {resource.loading ? (
          <Loading />
        ) : resource.error ? (
          <LoadError message={resource.error} retry={resource.reload} />
        ) : (
          resource.data && (
            <>
              {resource.data.data.length === 0 ? (
                <Empty title="Chưa có giao dịch">
                  Giao dịch sẽ xuất hiện sau khi công việc được ký quỹ.
                </Empty>
              ) : (
                resource.data.data.map((escrow) => (
                  <article className={s.item} key={escrow.id}>
                    <div className={s.milestoneTop}>
                      <Link
                        className={s.link}
                        href={
                          "/dashboard/" + user.role + "/jobs/" + escrow.job_id
                        }
                      >
                        {escrow.job?.title || "Công việc #" + escrow.job_id}
                      </Link>
                      <Status value={escrow.status} />
                    </div>
                    <div className={s.tableWrap}>
                      <table className={s.table}>
                        <thead>
                          <tr>
                            <th>Nội dung</th>
                            <th>Số tiền Mock USDC</th>
                            <th>Giao dịch</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Ký quỹ</td>
                            <td>{money(escrow.amount)}</td>
                            <td>
                              <TransactionLink signature={escrow.deposit_tx} />
                            </td>
                          </tr>
                          {escrow.job?.milestones
                            .filter((m) => m.release_tx)
                            .map((m) => (
                              <tr key={m.id}>
                                <td>Giải ngân · {m.title}</td>
                                <td>{money(m.amount)}</td>
                                <td>
                                  <TransactionLink signature={m.release_tx} />
                                </td>
                              </tr>
                            ))}
                          {escrow.refund_tx && (
                            <tr>
                              <td>Hoàn tiền</td>
                              <td>Đối chiếu giao dịch</td>
                              <td>
                                <TransactionLink signature={escrow.refund_tx} />
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))
              )}
              <Pagination page={resource.data} onChange={setPage} />
            </>
          )
        )}
      </section>
    </>
  );
}
