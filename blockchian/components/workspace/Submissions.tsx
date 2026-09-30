"use client";
import { Download, Link2 } from "lucide-react";
import {
  downloadSubmission,
  type Submission,
  dateLabel,
} from "@/lib/workspace";
import { External, useAction } from "./ui";
import s from "./Workspace.module.css";
export default function Submissions({ items }: { items: Submission[] }) {
  const action = useAction();
  if (!items.length) return <p className={s.muted}>Chưa có bài nộp.</p>;
  return (
    <>
      {action.feedback}
      {[...items].reverse().map((item) => (
        <div className={s.item} key={item.id}>
          <div className={s.milestoneTop}>
            <strong style={{ fontSize: 13 }}>
              {item.student?.name || "Sinh viên"} · Bài nộp #{item.id}
            </strong>
            <span className={s.muted}>{dateLabel(item.submitted_at)}</span>
          </div>
          <p className={s.description}>
            {item.description || "Không có mô tả bổ sung."}
          </p>
          {item.work_url && (
            <div className={s.file}>
              <Link2 size={16} />
              <External url={item.work_url}>Xem sản phẩm</External>
            </div>
          )}
          {item.file_path && (
            <button
              className={s.secondary}
              disabled={action.busy}
              onClick={() =>
                action.run(
                  () => downloadSubmission(item.id),
                  "Đã tải tệp bài nộp.",
                )
              }
            >
              <Download size={15} />
              Tải tệp đính kèm
            </button>
          )}
          {item.employer_feedback && (
            <p className={s.readonly}>
              Phản hồi doanh nghiệp: {item.employer_feedback}
            </p>
          )}
        </div>
      ))}
    </>
  );
}
