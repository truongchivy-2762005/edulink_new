"use client";
import { useState } from "react";
import { X, Upload, Link as LinkIcon, FileText } from "lucide-react";
import { submitWork } from "@/lib/api";
import styles from "./SubmitWorkModal.module.css";

interface Props {
  milestoneId: string;
  jobTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitWorkModal({ milestoneId, jobTitle, onClose, onSuccess }: Props) {
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirming" | "done">("form");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!link.trim()) return;
    setError("");
    setStep("confirming");
    setIsLoading(true);
    try {
      await submitWork(milestoneId, { link, description });
      setStep("done");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể nộp sản phẩm.");
      setStep("form");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Nộp sản phẩm</h2>
            <p className={styles.subtitle}>{jobTitle}</p>
          </div>
          <button id="close-modal" className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {step === "done" ? (
          /* ── Done State ─ */
          <div className={styles.doneState}>
            <div className={styles.doneIcon}>✅</div>
            <h3>Đã gửi thành công!</h3>
            <p>Doanh nghiệp sẽ xét duyệt trong 24–48 giờ. Bạn sẽ nhận thông báo kết quả.</p>
            <div className={styles.doneNote}>
              <span>💡</span>
              <span>USDC sẽ được giải ngân tự động qua Solana sau khi được duyệt.</span>
            </div>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: "20px" }} onClick={() => { onSuccess(); onClose(); }}>
              Về trang việc của tôi
            </button>
          </div>
        ) : (
          /* ── Form State ─ */
          <>
            <div className={styles.steps}>
              <div className={`${styles.step} ${step === "form" ? styles.stepActive : styles.stepDone}`}>
                <span>1</span> Điền thông tin
              </div>
              <div className={styles.stepLine} />
              <div className={`${styles.step} ${step === "confirming" ? styles.stepActive : ""}`}>
                <span>2</span> Xác nhận
              </div>
            </div>

            <div className={styles.form}>
              {error && <div className="badge badge-red">{error}</div>}
              {/* Link field */}
              <div className="input-group">
                <label className="input-label" htmlFor="submit-link">
                  Link sản phẩm <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <div className={styles.inputWithIcon}>
                  <LinkIcon size={16} className={styles.inputIcon} />
                  <input
                    id="submit-link"
                    type="url"
                    className={`input-field ${styles.inputWithPadding}`}
                    placeholder="https://github.com/... hoặc https://drive.google.com/..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="input-group">
                <label className="input-label" htmlFor="submit-desc">
                  Mô tả công việc đã làm
                </label>
                <textarea
                  id="submit-desc"
                  className={`input-field ${styles.textarea}`}
                  placeholder="Mô tả những gì bạn đã thực hiện, các tính năng nổi bật, cách test..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Tips */}
              <div className={styles.tips}>
                <div className={styles.tip}>
                  <FileText size={14} />
                  <span>Đảm bảo link có quyền xem công khai hoặc cấp quyền cho doanh nghiệp</span>
                </div>
                <div className={styles.tip}>
                  <Upload size={14} />
                  <span>Nộp bài sau khi đã kiểm tra kỹ — sau khi gửi bạn không thể rút lại</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button id="cancel-submit" className="btn-ghost" onClick={onClose}>
                Hủy
              </button>
              <button
                id="confirm-submit"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!link.trim() || isLoading}
              >
                {isLoading ? (
                  <><span className={styles.spinner} /> Đang gửi...</>
                ) : (
                  <>📤 Nộp sản phẩm</>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
