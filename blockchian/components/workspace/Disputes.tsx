"use client";
import { useState } from "react";
import Link from "next/link";
import { type Dispute, type Page, dateLabel } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceShell";
import {
  Heading,
  Filters,
  useResource,
  Loading,
  LoadError,
  Empty,
  Pagination,
  Status,
} from "./ui";
import s from "./Workspace.module.css";
export default function Disputes() {
  const { user } = useWorkspace();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const resource = useResource<Page<Dispute>>(
    "/workspace/disputes?" +
      new URLSearchParams({ page: String(page), search, status }),
  );
  return (
    <>
      <Heading
        eyebrow={
          user.role === "mentor" ? "Hội đồng Mentor" : "Giải quyết tranh chấp"
        }
        title="Hồ sơ tranh chấp"
        description={
          user.role === "mentor"
            ? "Xem sản phẩm, đối chiếu bằng chứng và đưa ra đánh giá độc lập. Mỗi hồ sơ cần ba phiếu Mentor."
            : "Theo dõi bằng chứng, ý kiến của Mentor và kết quả giải quyết theo từng milestone."
        }
      />
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
            ["open", "Đang mở"],
            ["resolved", "Đã có phán quyết"],
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
                <Empty title="Không có tranh chấp phù hợp">
                  Các hồ sơ được mở từ màn hình nghiệm thu sẽ xuất hiện tại đây.
                </Empty>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Hồ sơ</th>
                        <th>Milestone</th>
                        <th>Phiếu Mentor</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resource.data.data.map((dispute) => (
                        <tr key={dispute.id}>
                          <td>
                            <strong>{dispute.milestone.job.title}</strong>
                            <small>
                              #{dispute.id} · {dateLabel(dispute.created_at)}
                            </small>
                          </td>
                          <td>{dispute.milestone.title}</td>
                          <td>
                            {dispute.votes.length}/3
                            {dispute.votes.some(
                              (v) => v.mentor_id === user.id,
                            ) && (
                              <small style={{ display: "block" }}>
                                Bạn đã bỏ phiếu
                              </small>
                            )}
                          </td>
                          <td>
                            <Status value={dispute.status} />
                          </td>
                          <td>
                            <Link
                              className={s.secondary}
                              href={
                                "/dashboard/" +
                                user.role +
                                "/disputes/" +
                                dispute.id
                              }
                            >
                              Xem hồ sơ
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={resource.data} onChange={setPage} />
            </>
          )
        )}
      </section>
    </>
  );
}
