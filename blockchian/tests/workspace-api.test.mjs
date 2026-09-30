import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";

// Real HTTP boundary: catches missing bearer auth, wrong envelopes and swallowed errors.
test("workspace API unwraps Laravel data and sends the authenticated token", async () => {
  const { createWorkspaceClient } = await import("../lib/workspace-client.mjs");
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== "Bearer test-session") {
      res.writeHead(401);
      return res.end(
        JSON.stringify({ success: false, message: "Unauthenticated" }),
      );
    }
    res.end(
      JSON.stringify({
        success: true,
        data: {
          data: [{ id: 7, title: "Design" }],
          current_page: 1,
          last_page: 1,
          total: 1,
        },
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const client = createWorkspaceClient(
      `http://127.0.0.1:${server.address().port}/api`,
      () => "test-session",
    );
    const result = await client("/workspace/jobs");
    assert.deepEqual(result.data, [{ id: 7, title: "Design" }]);
    assert.equal(result.total, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("validation failures are rejected with field messages, never reported as success", async () => {
  const { createWorkspaceClient } = await import("../lib/workspace-client.mjs");
  const server = createServer((req, res) => {
    res.writeHead(422, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        message: "Invalid",
        errors: { budget: ["Milestones must equal budget"] },
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await assert.rejects(
      createWorkspaceClient(
        `http://127.0.0.1:${server.address().port}`,
        () => null,
      )("/jobs", { method: "POST", body: { budget: 100 } }),
      (error) =>
        error.status === 422 &&
        error.message.includes("Milestones must equal budget"),
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("money conversion preserves six decimal token units and refuses invalid input", async () => {
  const { tokenUnits, safeExternalUrl } =
    await import("../lib/workspace-client.mjs");
  assert.equal(tokenUnits("0.1") + tokenUnits("0.2"), tokenUnits("0.3"));
  assert.equal(tokenUnits("12.000001"), 12000001n);
  for (const value of ["-1", "1e3", "0.0000001", "abc", ""])
    assert.throws(() => tokenUnits(value));
  assert.equal(safeExternalUrl("javascript:alert(1)"), null);
  assert.equal(
    safeExternalUrl("https://example.com/work"),
    "https://example.com/work",
  );
});

test("pending deposit can be corrected and retried without recreating an unchanged signature", async () => {
  const { createWorkspaceClient, fundEscrow } =
    await import("../lib/workspace-client.mjs");
  let stored = "incorrect";
  const server = createServer(async (req, res) => {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body = raw ? JSON.parse(raw) : {};
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/jobs/7/escrow") {
      if (body.deposit_tx === stored) {
        res.writeHead(422);
        return res.end(
          JSON.stringify({ success: false, message: "Duplicate signature" }),
        );
      }
      stored = body.deposit_tx;
      return res.end(
        JSON.stringify({ success: true, data: { id: 9, deposit_tx: stored } }),
      );
    }
    if (req.url === "/escrows/9/verify" && stored === "corrected")
      return res.end(
        JSON.stringify({ success: true, data: { id: 9, status: "locked" } }),
      );
    res.writeHead(422);
    res.end(JSON.stringify({ success: false, message: "Invalid deposit" }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const client = createWorkspaceClient(
      "http://127.0.0.1:" + server.address().port,
      () => null,
    );
    const locked = await fundEscrow(
      client,
      { id: 7, escrow: { id: 9, deposit_tx: "incorrect" } },
      "corrected",
      false,
    );
    assert.equal(locked.status, "locked");
    const retried = await fundEscrow(
      client,
      { id: 7, escrow: { id: 9, deposit_tx: "corrected" } },
      "corrected",
      false,
    );
    assert.equal(retried.status, "locked");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
