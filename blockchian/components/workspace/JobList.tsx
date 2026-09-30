"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import { type Job, type Page, money, dateLabel } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceShell";
import {
  useResource,
  Heading,
  Loading,
  LoadError,
  Empty,
  Status,
  Pagination,
  Filters,
} from "./ui";
import s from "./Workspace.module.css";
export default function JobList() {
  const { user } = useWorkspace();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, loading, error, reload } = useResource<Page<Job>>(
    "/workspace/jobs?" +
      new URLSearchParams({ page: String(page), search, status }),
  );
  const admin = user.role === "admin";
  const base = "/dashboard/" + user.role;
  return (
    <>
      <Heading
        eyebrow={admin ? "Giám sát hệ thống" : "Quản lý tuyển dụng"}
        title={admin ? "Tất cả công việc" : "Công việc của bạn"}
        description={
          admin
            ? "Theo dõi tiến độ, ngân sách và hồ sơ nghiệm thu trên toàn hệ thống."
            : "Từ cơ hội đầu tiên đến sản phẩm hoàn thiện. Quản lý công việc và từng milestone tại đây."
        }
      >
        {!admin && (
          <Link className={s.button} href={base + "/jobs/new"}>
            <Plus size={17} />
            Đăng công việc
          </Link>
        )}
      </Heading>
      <section className={s.panel}>
        <Filters
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          status={status}
          onStatus={(value) => {
            setStatus(value);
            setPage(1);
          }}
          options={[
            ["awaiting_funding", "Chờ ký quỹ"],
            ["open", "Đang mở"],
            ["in_progress", "Đang thực hiện"],
            ["disputed", "Tranh chấp"],
            ["completed", "Hoàn thành"],
            ["cancelled", "Đã hủy"],
          ]}
        />
        {loading ? (
          <Loading />
        ) : error ? (
          <LoadError message={error} retry={reload} />
        ) : (
          data && (
            <>
              {data.data.length === 0 ? (
                <Empty title="Chưa có công việc phù hợp">
                  Thử thay đổi bộ lọc hoặc tạo công việc đầu tiên.
                </Empty>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Công việc</th>
                        <th>Ngân sách</th>
                        <th>Tiến độ</th>
                        <th>Trạng thái</th>
                        <th>
                          <span className={s.muted}>Chi tiết</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.data.map((job) => (
                        <tr key={job.id}>
                          <td>
                            <Link href={base + "/jobs/" + job.id}>
                              <strong>{job.title}</strong>
                            </Link>
                            <small>
                              {admin ? job.employer?.name + " · " : ""}Hạn{" "}
                              {dateLabel(job.deadline)}
                            </small>
                          </td>
                          <td>
                            {money(job.budget)}
                            <br />
                            <small>Mock USDC</small>
                          </td>
                          <td>
                            {
                              job.milestones.filter((m) => m.status === "paid")
                                .length
                            }
                            /{job.milestones.length} milestone
                            <br />
                            <small>
                              {job.applications_count || 0} ứng viên
                            </small>
                          </td>
                          <td>
                            <Status value={job.status} />
                          </td>
                          <td>
                            <Link
                              className={s.secondary}
                              href={base + "/jobs/" + job.id}
                              aria-label={"Xem " + job.title}
                            >
                              <ArrowUpRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <Pagination page={data} onChange={setPage} />
            </>
          )
        )}
      </section>
    </>
  );
}
