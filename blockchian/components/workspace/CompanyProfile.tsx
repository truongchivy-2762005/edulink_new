"use client";
import { useState } from "react";
import { workspaceApi, type Company } from "@/lib/workspace";
import { Heading, useResource, useAction, Loading, LoadError } from "./ui";
import s from "./Workspace.module.css";
function Editor({ initial }: { initial: Company | null }) {
  const [form, setForm] = useState<Company>(
    initial || { company_name: "", industry: "", website: "", description: "" },
  );
  const action = useAction();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await action.run(
      () => workspaceApi("/workspace/company", { method: "PUT", body: form }),
      "Đã lưu hồ sơ doanh nghiệp.",
    );
  };
  return (
    <form onSubmit={submit}>
      {action.feedback}
      <section className={s.panel} style={{ maxWidth: 800 }}>
        <h2>Giới thiệu doanh nghiệp</h2>
        {(
          [
            ["company_name", "Tên doanh nghiệp", "text"],
            ["industry", "Lĩnh vực hoạt động", "text"],
            ["website", "Website", "url"],
          ] as const
        ).map(([field, label, type]) => (
          <div className={s.field} key={field}>
            <label htmlFor={field}>
              {label}
              {field === "company_name" ? " *" : ""}
            </label>
            <input
              id={field}
              type={type}
              className={s.input}
              value={form[field] || ""}
              maxLength={field === "website" ? 2048 : 255}
              required={field === "company_name"}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}
        <div className={s.field}>
          <label htmlFor="company-description">Giới thiệu</label>
          <textarea
            id="company-description"
            className={s.textarea}
            rows={6}
            maxLength={5000}
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <button className={s.button} disabled={action.busy}>
          {action.busy ? "Đang lưu…" : "Lưu hồ sơ"}
        </button>
      </section>
    </form>
  );
}
export default function CompanyProfile() {
  const resource = useResource<Company | null>("/workspace/company");
  return (
    <>
      <Heading
        eyebrow="Doanh nghiệp"
        title="Hồ sơ doanh nghiệp"
        description="Thông tin giới thiệu và liên hệ của doanh nghiệp."
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <LoadError message={resource.error} retry={resource.reload} />
      ) : (
        <Editor initial={resource.data || null} />
      )}
    </>
  );
}
