export function createWorkspaceClient(baseUrl, getToken) {
  return async function request(path, options = {}) {
    const token = getToken();
    let response;
    try {
      response = await fetch(baseUrl.replace(/\/$/, "") + path, {
        method: options.method || "GET",
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: "Bearer " + token } : {}),
        },
        body:
          options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal || AbortSignal.timeout(20000),
        cache: "no-store",
      });
    } catch (error) {
      if (options.signal?.aborted) throw error;
      throw new Error(
        "Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.",
      );
    }
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success === false) {
      const messages = result?.errors
        ? Object.values(result.errors).flat().join(" ")
        : "";
      const error = new Error(
        messages ||
          result?.message ||
          "Yêu cầu thất bại (" + response.status + ").",
      );
      error.status = response.status;
      if (response.status === 401 && typeof window !== "undefined")
        window.dispatchEvent(new Event("edulink:session-expired"));
      throw error;
    }
    if (!result || !Object.hasOwn(result, "data"))
      throw new Error("Máy chủ trả dữ liệu không đúng định dạng.");
    return result.data;
  };
}
export function tokenUnits(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,6})?$/.test(text))
    throw new Error("Số tiền phải có tối đa 6 chữ số thập phân.");
  const [whole, fraction = ""] = text.split(".");
  return BigInt(whole) * BigInt(1000000) + BigInt(fraction.padEnd(6, "0"));
}
export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export async function fundEscrow(request, job, signature, mock) {
  let escrow = job.escrow;
  const nextSignature = signature.trim();
  if (!mock && !nextSignature && !escrow?.deposit_tx)
    throw new Error("Vui lòng nhập chữ ký giao dịch ký quỹ.");
  if (
    !escrow ||
    (!mock && nextSignature && nextSignature !== escrow.deposit_tx)
  ) {
    escrow = await request("/jobs/" + job.id + "/escrow", {
      method: "POST",
      body: mock ? {} : { deposit_tx: nextSignature },
    });
  }
  return request("/escrows/" + escrow.id + "/verify", { method: "POST" });
}
