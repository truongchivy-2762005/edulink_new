"use client";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { Inbox, ExternalLink } from "lucide-react";
import { workspaceApi, type Page } from "@/lib/workspace";
import { safeExternalUrl } from "@/lib/workspace-client.mjs";
import s from "./Workspace.module.css";

export function useResource<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const key = path + "|" + revision;
  const [result, setResult] = useState<{
    key: string;
    data?: T;
    error?: string;
  }>({ key: "" });
  useEffect(() => {
    const controller = new AbortController();
    workspaceApi<T>(path, { signal: controller.signal })
      .then((data) => setResult({ key, data }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({ key, error: error.message });
      });
    return () => controller.abort();
  }, [path, key]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return {
    data: result.key === key ? result.data : undefined,
    error: result.key === key ? result.error : undefined,
    loading: result.key !== key,
    reload,
  };
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const locked = useRef(false);
  const run = async (action: () => Promise<unknown>, success: string) => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
      setMessage(success);
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thực hiện được thao tác.",
      );
      return false;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  };
  return {
    busy,
    message,
    error,
    run,
    feedback: (
      <>
        {error && <Alert>{error}</Alert>}
        {message && <Alert kind="success">{message}</Alert>}
      </>
    ),
  };
}
export function Alert({
  children,
  kind = "error",
}: {
  children: ReactNode;
  kind?: "error" | "success" | "notice";
}) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={
        s.alert +
        " " +
        (kind === "success" ? s.success : kind === "notice" ? s.notice : "")
      }
    >
      {children}
    </div>
  );
}
export function Loading() {
  return (
    <div className={s.loading} role="status">
      <span className={s.spinner} />
      Đang tải dữ liệu…
    </div>
  );
}
export function Empty({
  title = "Chưa có dữ liệu",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <Inbox size={30} />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function LoadError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <Alert>
      {message}{" "}
      <button className={s.secondary} onClick={retry}>
        Thử lại
      </button>
    </Alert>
  );
}
const statuses: Record<string, [string, string]> = {
  open: ["Đang mở", "good"],
  awaiting_funding: ["Chờ ký quỹ", "warning"],
  draft: ["Bản nháp", ""],
  in_progress: ["Đang thực hiện", "purple"],
  completed: ["Hoàn thành", "good"],
  disputed: ["Tranh chấp", "bad"],
  cancelled: ["Đã hủy", ""],
  pending: ["Đang chờ", "warning"],
  submitted: ["Chờ nghiệm thu", "warning"],
  approved: ["Đã duyệt · chờ trả tiền", "purple"],
  paid: ["Đã thanh toán", "good"],
  locked: ["Đã ký quỹ", "good"],
  released: ["Đã giải ngân", "good"],
  refunded: ["Đã hoàn tiền", ""],
  matched: ["Được đề xuất", "purple"],
  accepted: ["Đã nhận việc", "good"],
  rejected: ["Đã từ chối", ""],
  resolved: ["Đã có phán quyết", "good"],
};
export function Status({ value }: { value: string }) {
  const [label, color] = statuses[value] || [value, ""];
  return <span className={s.status + " " + (s[color] || "")}>{label}</span>;
}
export function External({
  url,
  children,
}: {
  url: string;
  children: ReactNode;
}) {
  const safe = safeExternalUrl(url);
  return safe ? (
    <a className={s.link} href={safe} target="_blank" rel="noopener noreferrer">
      {children}
      <ExternalLink size={12} />
    </a>
  ) : (
    <span className={s.muted}>Liên kết không hợp lệ</span>
  );
}
export function TransactionLink({ signature }: { signature?: string | null }) {
  if (!signature) return <span className={s.muted}>Chưa có giao dịch</span>;
  if (signature.startsWith("mock_"))
    return (
      <span className={s.status + " " + s.warning}>Giao dịch mô phỏng</span>
    );
  return (
    <External
      url={
        "https://explorer.solana.com/tx/" +
        encodeURIComponent(signature) +
        "?cluster=devnet"
      }
    >
      {signature.slice(0, 8) + "…" + signature.slice(-6)}
    </External>
  );
}
export function Pagination({
  page,
  onChange,
}: {
  page: Page<unknown>;
  onChange: (value: number) => void;
}) {
  return (
    <div className={s.pagination}>
      <span>
        {page.total} kết quả · Trang {page.current_page}/{page.last_page}
      </span>
      <div className={s.actions}>
        <button
          className={s.secondary}
          disabled={page.current_page <= 1}
          onClick={() => onChange(page.current_page - 1)}
        >
          Trước
        </button>
        <button
          className={s.secondary}
          disabled={page.current_page >= page.last_page}
          onClick={() => onChange(page.current_page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className={s.heading}>
      <div>
        <span className={s.eyebrow}>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </header>
  );
}
export function Dialog({
  title,
  onClose,
  children,
  busy = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="workspace-dialog-title"
      className={s.dialog}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="workspace-dialog-title">{title}</h2>
      {children}
      <div style={{ marginTop: 16 }}>
        <button className={s.secondary} disabled={busy} onClick={onClose}>
          Đóng
        </button>
      </div>
    </dialog>
  );
}
export function Filters({
  search,
  onSearch,
  status,
  onStatus,
  options,
}: {
  search: string;
  onSearch: (value: string) => void;
  status: string;
  onStatus: (value: string) => void;
  options: [string, string][];
}) {
  const [draft, setDraft] = useState(search);
  return (
    <div className={s.toolbar}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(draft.trim());
        }}
      >
        <input
          className={s.input}
          aria-label="Tìm kiếm"
          placeholder="Tìm theo tên…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button className={s.secondary}>Tìm kiếm</button>
      </form>
      <select
        className={s.select}
        aria-label="Lọc trạng thái"
        value={status}
        onChange={(event) => onStatus(event.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
