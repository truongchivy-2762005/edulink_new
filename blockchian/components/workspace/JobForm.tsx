"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { workspaceApi, type Job, money } from "@/lib/workspace";
import { tokenUnits } from "@/lib/workspace-client.mjs";
import { Heading, useAction, Alert } from "./ui";
import s from "./Workspace.module.css";
type Draft = {
  key: number;
  title: string;
  amount: string;
  due_date: string;
  description: string;
};
export default function JobForm() {
  const router = useRouter();
  const action = useAction();
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [milestones, setMilestones] = useState<Draft[]>([
    { key: 0, title: "", amount: "", due_date: "", description: "" },
  ]);
  const [nextKey, setNextKey] = useState(1);
  const update = (
    key: number,
    field: keyof Omit<Draft, "key">,
    value: string,
  ) =>
    setMilestones((rows) =>
      rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    );
  const total = milestones.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0,
  );
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const budgetUnits = tokenUnits(budget);
      if (budgetUnits <= BigInt(0))
        throw new Error("Ngân sách phải lớn hơn 0.");
      const sum = milestones.reduce((value, row) => {
        const units = tokenUnits(row.amount);
        if (units <= BigInt(0))
          throw new Error("Số tiền từng milestone phải lớn hơn 0.");
        return value + units;
      }, BigInt(0));
      if (sum !== budgetUnits)
        throw new Error("Tổng tiền milestone phải bằng ngân sách công việc.");
      const end = new Date(deadline);
      if (end.getTime() <= Date.now())
        throw new Error("Hạn hoàn thành phải ở tương lai.");
      if (
        milestones.some(
          (row) =>
            new Date(row.due_date).getTime() > end.getTime() ||
            new Date(row.due_date).getTime() <= Date.now(),
        )
      )
        throw new Error(
          "Hạn milestone phải ở tương lai và không vượt quá hạn công việc.",
        );
      if (
        !title.trim() ||
        !description.trim() ||
        milestones.some((row) => !row.title.trim())
      )
        throw new Error("Vui lòng nhập đầy đủ tên, mô tả và tên milestone.");
      await action.run(async () => {
        const job = await workspaceApi<Job>("/jobs", {
          method: "POST",
          body: {
            title: title.trim(),
            description: description.trim(),
            required_skills: [
              ...new Set(
                skills
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              ),
            ],
            budget,
            deadline: end.toISOString(),
            milestones: milestones.map(
              ({ title, amount, due_date, description }) => ({
                title: title.trim(),
                amount,
                due_date: new Date(due_date).toISOString(),
                description,
              }),
            ),
          },
        });
        router.push("/dashboard/employer/jobs/" + job.id);
      }, "Đã tạo công việc.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dữ liệu chưa hợp lệ.");
    }
  }
  return (
    <>
      <Link className={s.back} href="/dashboard/employer">
        <ArrowLeft size={14} />
        Công việc của bạn
      </Link>
      <Heading
        eyebrow="Cơ hội mới"
        title="Đăng công việc"
        description="Mô tả rõ kết quả cần bàn giao và chia ngân sách theo từng cột mốc. Công việc mới sẽ chờ ký quỹ."
      />
      {action.feedback}
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit}>
        <fieldset disabled={action.busy} style={{ border: 0, minWidth: 0 }}>
          <div className={s.grid}>
            <div>
              <section className={s.panel}>
                <h2>Thông tin công việc</h2>
                <div className={s.field}>
                  <label htmlFor="job-title">Tên công việc *</label>
                  <input
                    id="job-title"
                    className={s.input}
                    required
                    maxLength={255}
                    placeholder="VD: Thiết kế landing page cho khóa học"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className={s.field}>
                  <label htmlFor="job-description">
                    Mô tả & yêu cầu bàn giao *
                  </label>
                  <textarea
                    id="job-description"
                    className={s.textarea}
                    rows={6}
                    required
                    maxLength={10000}
                    placeholder="Mục tiêu, phạm vi, sản phẩm cần bàn giao…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className={s.field}>
                  <label htmlFor="job-skills">Kỹ năng yêu cầu</label>
                  <input
                    id="job-skills"
                    className={s.input}
                    placeholder="React, Figma, TypeScript"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                  />
                  <small>
                    Phân cách bằng dấu phẩy. Dùng để đề xuất ứng viên phù hợp.
                  </small>
                </div>
                <div className={s.formGrid}>
                  <div className={s.field}>
                    <label htmlFor="job-budget">Ngân sách Mock USDC *</label>
                    <input
                      id="job-budget"
                      className={s.input}
                      type="number"
                      min="0.000001"
                      step="0.000001"
                      required
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
                  </div>
                  <div className={s.field}>
                    <label htmlFor="job-deadline">Hạn hoàn thành *</label>
                    <input
                      id="job-deadline"
                      className={s.input}
                      type="datetime-local"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
              </section>
              <section className={s.panel}>
                <h2>Kế hoạch milestone</h2>
                {milestones.map((row, index) => (
                  <div className={s.milestoneRow} key={row.key}>
                    <div className={s.milestoneTop}>
                      <h3>Milestone {index + 1}</h3>
                      <button
                        type="button"
                        className={s.danger}
                        aria-label={"Xóa milestone " + (index + 1)}
                        disabled={milestones.length === 1}
                        onClick={() =>
                          setMilestones((rows) =>
                            rows.filter((item) => item.key !== row.key),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className={s.field}>
                      <label htmlFor={"m-title-" + row.key}>
                        Kết quả bàn giao *
                      </label>
                      <input
                        id={"m-title-" + row.key}
                        className={s.input}
                        required
                        maxLength={255}
                        value={row.title}
                        onChange={(e) =>
                          update(row.key, "title", e.target.value)
                        }
                      />
                    </div>
                    <div className={s.formGrid}>
                      <div className={s.field}>
                        <label htmlFor={"m-amount-" + row.key}>Số tiền *</label>
                        <input
                          id={"m-amount-" + row.key}
                          className={s.input}
                          type="number"
                          min="0.000001"
                          step="0.000001"
                          required
                          value={row.amount}
                          onChange={(e) =>
                            update(row.key, "amount", e.target.value)
                          }
                        />
                      </div>
                      <div className={s.field}>
                        <label htmlFor={"m-due-" + row.key}>
                          Hạn milestone *
                        </label>
                        <input
                          id={"m-due-" + row.key}
                          className={s.input}
                          type="datetime-local"
                          required
                          max={deadline || undefined}
                          value={row.due_date}
                          onChange={(e) =>
                            update(row.key, "due_date", e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className={s.field}>
                      <label htmlFor={"m-desc-" + row.key}>
                        Tiêu chí nghiệm thu
                      </label>
                      <textarea
                        id={"m-desc-" + row.key}
                        className={s.textarea}
                        maxLength={3000}
                        value={row.description}
                        onChange={(e) =>
                          update(row.key, "description", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  className={s.secondary}
                  type="button"
                  onClick={() => {
                    setMilestones((rows) => [
                      ...rows,
                      {
                        key: nextKey,
                        title: "",
                        amount: "",
                        due_date: "",
                        description: "",
                      },
                    ]);
                    setNextKey((v) => v + 1);
                  }}
                >
                  <Plus size={16} />
                  Thêm milestone
                </button>
              </section>
            </div>
            <aside>
              <section className={s.panel}>
                <span className={s.eyebrow}>Kiểm tra trước khi đăng</span>
                <h2 style={{ marginTop: 12 }}>Ngân sách dự kiến</h2>
                <div className={s.summary}>
                  <span>Ngân sách</span>
                  <strong>{money(budget || 0)}</strong>
                </div>
                <div className={s.summary}>
                  <span>Tổng milestone</span>
                  <strong>{money(total)}</strong>
                </div>
                <p className={s.muted}>
                  Đơn vị: Mock USDC. Tạo công việc chưa chuyển tiền; ký quỹ được
                  thực hiện ở bước tiếp theo.
                </p>
                <button
                  className={s.button}
                  style={{ width: "100%", marginTop: 24 }}
                  disabled={action.busy}
                >
                  {action.busy ? "Đang tạo…" : "Tạo công việc"}
                </button>
              </section>
            </aside>
          </div>
        </fieldset>
      </form>
    </>
  );
}
