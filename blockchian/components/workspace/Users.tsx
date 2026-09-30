"use client";
import { useState } from "react";
import { workspaceApi, type Person, type Page } from "@/lib/workspace";
import {
  Heading,
  Filters,
  useResource,
  useAction,
  Loading,
  LoadError,
  Empty,
  Pagination,
  Dialog,
} from "./ui";
import s from "./Workspace.module.css";
const roles: Record<string, string> = {
  student: "Sinh viên",
  employer: "Doanh nghiệp",
  mentor: "Mentor",
  admin: "Admin",
};
export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [selected, setSelected] = useState<Person | null>(null);
  const [name, setName] = useState("");
  const action = useAction();
  const resource = useResource<Page<Person>>(
    "/workspace/users?" +
      new URLSearchParams({ page: String(page), search, role }),
  );
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (
      await action.run(
        () =>
          workspaceApi("/workspace/users/" + selected.id, {
            method: "PATCH",
            body: { name: name.trim() },
          }),
        "Đã cập nhật người dùng.",
      )
    ) {
      setSelected(null);
      resource.reload();
    }
  };
  return (
    <>
      <Heading
        eyebrow="Quản trị hệ thống"
        title="Người dùng"
        description="Tra cứu tài khoản, vai trò, điểm uy tín và cập nhật thông tin hiển thị."
      />
      {!selected && action.feedback}
      <section className={s.panel}>
        <Filters
          search={search}
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          status={role}
          onStatus={(v) => {
            setRole(v);
            setPage(1);
          }}
          options={Object.entries(roles)}
        />
        {resource.loading ? (
          <Loading />
        ) : resource.error ? (
          <LoadError message={resource.error} retry={resource.reload} />
        ) : (
          resource.data && (
            <>
              {resource.data.data.length === 0 ? (
                <Empty title="Không tìm thấy người dùng">
                  Thử tên hoặc email khác.
                </Empty>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>Người dùng</th>
                        <th>Vai trò</th>
                        <th>Uy tín</th>
                        <th>Ví</th>
                        <th>Quản lý</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resource.data.data.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </td>
                          <td>
                            <span className={s.status + " " + s.purple}>
                              {roles[user.role]}
                            </span>
                          </td>
                          <td>{user.reputation_score}</td>
                          <td>
                            <span className={s.muted}>
                              {user.wallet_address
                                ? user.wallet_address.slice(0, 6) +
                                  "…" +
                                  user.wallet_address.slice(-4)
                                : "Chưa liên kết"}
                            </span>
                          </td>
                          <td>
                            <button
                              className={s.secondary}
                              onClick={() => {
                                setSelected(user);
                                setName(user.name);
                              }}
                            >
                              Chỉnh sửa
                            </button>
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
      {selected && (
        <Dialog
          title="Chỉnh sửa người dùng"
          onClose={() => setSelected(null)}
          busy={action.busy}
        >
          <p>
            {selected.email} · {roles[selected.role]}
          </p>
          {action.feedback}
          <form onSubmit={save}>
            <div className={s.field}>
              <label htmlFor="user-name">Tên hiển thị</label>
              <input
                id="user-name"
                className={s.input}
                value={name}
                required
                maxLength={255}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <button className={s.button} disabled={action.busy || !name.trim()}>
              {action.busy ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </form>
        </Dialog>
      )}
    </>
  );
}
