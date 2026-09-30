"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Scale, Loader2 } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { resolveDisputeOnChain } from "@/lib/solana/escrow-actions";
import { workspaceApi, type Dispute, money, dateLabel } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceShell";
import {
  Heading,
  useResource,
  useAction,
  Loading,
  LoadError,
  Alert,
  Status,
  External,
  Dialog,
  TransactionLink,
} from "./ui";
import Submissions from "./Submissions";
import s from "./Workspace.module.css";
function Voting({
  dispute,
  onSaved,
}: {
  dispute: Dispute;
  onSaved: () => void;
}) {
  const { user } = useWorkspace();
  const existing = dispute.votes.find((v) => v.mentor_id === user.id);
  const [percentage, setPercentage] = useState(
    String(existing?.student_percentage ?? 50),
  );
  const [reason, setReason] = useState(existing?.reason || "");
  const [confirm, setConfirm] = useState(false);
  const action = useAction();
  const locked =
    dispute.status !== "open" || (!existing && dispute.votes.length >= 3);
  const vote = async () => {
    if (
      await action.run(
        () =>
          workspaceApi("/disputes/" + dispute.id + "/vote", {
            method: "POST",
            body: {
              student_percentage: Number(percentage),
              reason: reason.trim(),
            },
          }),
        "Đã ghi nhận phiếu đánh giá.",
      )
    ) {
      setConfirm(false);
      onSaved();
    }
  };
  return (
    <section className={s.panel}>
      <h2>{existing ? "Phiếu đánh giá của bạn" : "Đưa ra đánh giá"}</h2>
      <p className={s.muted}>
        Tỷ lệ đề xuất cho sinh viên; phần còn lại đề xuất hoàn doanh nghiệp.
      </p>
      {!confirm && action.feedback}
      {locked ? (
        <Alert kind="notice">
          {dispute.status !== "open"
            ? "Hồ sơ đã có phán quyết, không thể sửa phiếu."
            : "Hồ sơ đã đủ ba Mentor đánh giá."}
        </Alert>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirm(true);
          }}
        >
          <div className={s.field} style={{ marginTop: 18 }}>
            <label htmlFor="vote-percentage">Tỷ lệ cho sinh viên (%)</label>
            <input
              id="vote-percentage"
              className={s.input}
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
            />
          </div>
          <div className={s.voteBar}>
            <span
              style={{
                width: Math.max(0, Math.min(100, Number(percentage))) + "%",
              }}
            />
          </div>
          <p className={s.muted}>
            Sinh viên:{" "}
            {money(
              (Number(dispute.milestone.amount) * Number(percentage)) / 100,
            )}{" "}
            · Doanh nghiệp:{" "}
            {money(
              (Number(dispute.milestone.amount) * (100 - Number(percentage))) /
                100,
            )}{" "}
            Mock USDC (dự kiến)
          </p>
          <div className={s.field} style={{ marginTop: 18 }}>
            <label htmlFor="vote-reason">Nhận xét & căn cứ *</label>
            <textarea
              id="vote-reason"
              className={s.textarea}
              required
              maxLength={3000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button className={s.button} disabled={action.busy || !reason.trim()}>
            {existing ? "Cập nhật phiếu" : "Gửi phiếu đánh giá"}
          </button>
        </form>
      )}
      {confirm && (
        <Dialog
          title="Xác nhận phiếu đánh giá"
          busy={action.busy}
          onClose={() => setConfirm(false)}
        >
          <p>
            Sinh viên {percentage}% · Doanh nghiệp {100 - Number(percentage)}%.
            Phiếu được lưu vào hồ sơ tranh chấp.
          </p>
          <p className={s.description}>{reason}</p>
          {action.feedback}
          <button className={s.button} disabled={action.busy} onClick={vote}>
            {action.busy ? "Đang gửi…" : "Xác nhận bỏ phiếu"}
          </button>
        </Dialog>
      )}
    </section>
  );
}
function Resolution({
  dispute,
  onSaved,
}: {
  dispute: Dispute;
  onSaved: () => void;
}) {
  const [resolution, setResolution] = useState("");
  const [disputeTx, setDisputeTx] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [isSigningOnChain, setIsSigningOnChain] = useState(false);
  const [onChainError, setOnChainError] = useState("");
  const action = useAction();
  const wallet = useWallet();
  const { connection } = useConnection();

  const average = Math.round(
    dispute.votes.reduce((sum, v) => sum + v.student_percentage, 0) /
      Math.max(1, dispute.votes.length),
  );

  const handleSignDisputeOnChain = async () => {
    if (!wallet.publicKey) {
      setOnChainError("Vui lòng kết nối ví Phantom trước.");
      return;
    }
    const employerWallet = dispute.milestone.job.employer?.wallet_address;
    const studentWallet = dispute.milestone.submissions?.[0]?.student?.wallet_address;

    if (!employerWallet || !studentWallet) {
      setOnChainError("Không tìm thấy địa chỉ ví Solana của một trong 2 bên để chia tiền on-chain.");
      return;
    }

    setIsSigningOnChain(true);
    setOnChainError("");
    try {
      const txSig = await resolveDisputeOnChain({
        jobId: dispute.milestone.job.id,
        employerAddress: employerWallet,
        studentPercentage: average,
        studentWalletAddress: studentWallet,
        employerWalletAddress: employerWallet,
        wallet,
        connection,
      });
      setDisputeTx(txSig);
    } catch (err: unknown) {
      setOnChainError(err instanceof Error ? err.message : "Thực thi chia tiền on-chain thất bại.");
    } finally {
      setIsSigningOnChain(false);
    }
  };

  const save = async () => {
    if (
      await action.run(
        () =>
          workspaceApi("/disputes/" + dispute.id + "/resolve", {
            method: "POST",
            body: {
              resolution: resolution.trim(),
              ...(disputeTx ? { dispute_tx: disputeTx } : {}),
            },
          }),
        "Đã lưu phán quyết.",
      )
    ) {
      setConfirm(false);
      onSaved();
    }
  };
  if (dispute.status !== "open") return null;
  return (
    <section className={s.panel}>
      <h2>Phán quyết của Admin</h2>
      <p className={s.muted}>
        Kết quả tính theo trung bình phiếu Mentor: sinh viên {average}%, doanh
        nghiệp {100 - average}%.
      </p>
      {dispute.votes.length < 3 ? (
        <Alert kind="notice">
          Cần đủ ba phiếu Mentor trước khi lưu phán quyết.
        </Alert>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirm(true);
          }}
        >
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <button
              type="button"
              className={s.button}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "10px 16px",
              }}
              disabled={isSigningOnChain || !wallet.publicKey}
              onClick={handleSignDisputeOnChain}
            >
              {isSigningOnChain ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang ký phán quyết on-chain trên Phantom...
                </>
              ) : (
                `⚡ Ký thực thi chia tiền bằng ví Phantom (${average}% Sinh viên - ${100 - average}% Doanh nghiệp)`
              )}
            </button>
            {onChainError && (
              <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>
                {onChainError}
              </p>
            )}
            {disputeTx && (
              <p style={{ color: "#4ade80", fontSize: 12, marginTop: 6 }}>
                Đã ký on-chain thành công: {disputeTx.slice(0, 10)}...
              </p>
            )}
          </div>
          <div className={s.field} style={{ marginTop: 18 }}>
            <label htmlFor="resolution">Nội dung phán quyết *</label>
            <textarea
              id="resolution"
              className={s.textarea}
              required
              maxLength={5000}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          </div>
          <button
            className={s.button}
            disabled={action.busy || !resolution.trim()}
          >
            Lưu phán quyết
          </button>
        </form>
      )}
      {confirm && (
        <Dialog
          title="Xác nhận phán quyết"
          busy={action.busy}
          onClose={() => setConfirm(false)}
        >
          <p>
            Kết thúc bỏ phiếu và ghi nhận tỷ lệ {average}% cho sinh viên.
            {disputeTx ? " Giao dịch on-chain đã được ký." : " Thao tác này lưu phán quyết vào hệ thống."}
          </p>
          {action.feedback}
          <button className={s.button} disabled={action.busy} onClick={save}>
            {action.busy ? "Đang lưu…" : "Xác nhận phán quyết"}
          </button>
        </Dialog>
      )}
    </section>
  );
}
export default function DisputeDetail({ id }: { id: string }) {
  const { user } = useWorkspace();
  const resource = useResource<Dispute>("/workspace/disputes/" + id);
  const dispute = resource.data;
  return (
    <>
      <Link
        className={s.back}
        href={
          "/dashboard/" +
          user.role +
          (user.role === "mentor" ? "" : "/disputes")
        }
      >
        <ArrowLeft size={14} />
        Hồ sơ tranh chấp
      </Link>
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <LoadError message={resource.error} retry={resource.reload} />
      ) : (
        dispute && (
          <>
            <Heading
              eyebrow={"Tranh chấp #" + dispute.id}
              title={dispute.milestone.job.title}
              description={
                dispute.milestone.title +
                " · Mở ngày " +
                dateLabel(dispute.created_at)
              }
            >
              <Status value={dispute.status} />
            </Heading>
            {dispute.status === "resolved" && (
              <Alert kind="notice">
                Phán quyết đã được lưu: sinh viên {dispute.student_percentage}%,
                doanh nghiệp {100 - Number(dispute.student_percentage)}%.
                {dispute.dispute_tx ? (
                  <div style={{ marginTop: 8 }}>
                    <strong>Giao dịch on-chain: </strong>
                    <TransactionLink signature={dispute.dispute_tx} />
                  </div>
                ) : (
                  " Việc phân chia đã được ghi nhận vào hệ thống."
                )}
              </Alert>
            )}
            <div className={s.grid}>
              <div>
                <section className={s.panel}>
                  <h2>Lý do & bằng chứng</h2>
                  <p className={s.muted} style={{ marginBottom: 12 }}>
                    Người mở: {dispute.creator?.name || "Người tham gia"}
                  </p>
                  <p className={s.description}>{dispute.reason}</p>
                  <div className={s.detailList}>
                    {dispute.evidence?.map((url, index) => (
                      <External key={url + index} url={url}>
                        Bằng chứng {index + 1}
                      </External>
                    ))}
                  </div>
                  {!dispute.evidence?.length && (
                    <p className={s.muted}>Không có link bằng chứng bổ sung.</p>
                  )}
                </section>
                <section className={s.panel}>
                  <h2>Tiêu chí & sản phẩm bàn giao</h2>
                  <p className={s.description}>
                    {dispute.milestone.description ||
                      dispute.milestone.job.description}
                  </p>
                  <Submissions items={dispute.milestone.submissions || []} />
                </section>
                {dispute.resolution && (
                  <section className={s.panel}>
                    <h2>Nội dung phán quyết</h2>
                    <p className={s.description}>{dispute.resolution}</p>
                  </section>
                )}
                <section className={s.panel}>
                  <div className={s.milestoneTop}>
                    <h2 style={{ margin: 0 }}>Ý kiến hội đồng</h2>
                    <span className={s.status + " " + s.purple}>
                      {dispute.votes.length}/3 phiếu
                    </span>
                  </div>
                  {dispute.votes.length === 0 ? (
                    <p className={s.muted}>Chưa có phiếu đánh giá.</p>
                  ) : (
                    dispute.votes.map((vote) => (
                      <div key={vote.id} className={s.item}>
                        <div className={s.milestoneTop}>
                          <strong>
                            {vote.mentor?.name || "Mentor #" + vote.mentor_id}
                          </strong>
                          <span className={s.status + " " + s.good}>
                            Sinh viên {vote.student_percentage}%
                          </span>
                        </div>
                        <p className={s.description}>
                          {vote.reason || "Không có nhận xét."}
                        </p>
                      </div>
                    ))
                  )}
                </section>
              </div>
              <aside>
                <section className={s.panel}>
                  <Scale size={22} color="#b98ae8" />
                  <h2 style={{ marginTop: 14 }}>Giá trị đang tranh chấp</h2>
                  <strong style={{ fontSize: 28 }}>
                    {money(dispute.milestone.amount)}{" "}
                    <small style={{ fontSize: 12 }}>Mock USDC</small>
                  </strong>
                  <p className={s.muted} style={{ marginTop: 12 }}>
                    Đánh giá dựa trên tiêu chí nghiệm thu và bằng chứng của
                    milestone.
                  </p>
                </section>
                {user.role === "mentor" && (
                  <Voting
                    key={
                      dispute.id +
                      "-" +
                      dispute.status +
                      "-" +
                      dispute.votes.length
                    }
                    dispute={dispute}
                    onSaved={resource.reload}
                  />
                )}
                {user.role === "admin" && (
                  <Resolution dispute={dispute} onSaved={resource.reload} />
                )}
              </aside>
            </div>
          </>
        )
      )}
    </>
  );
}
