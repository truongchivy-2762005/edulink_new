import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const origin = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const apiBase = process.env.E2E_API_URL || "http://127.0.0.1:8000/api";
if (
  process.env.E2E_WRITE_OK !== "1" ||
  ![origin, apiBase].every((url) =>
    ["127.0.0.1", "localhost"].includes(new URL(url).hostname),
  )
)
  throw new Error(
    "Run only against an isolated local demo database with E2E_WRITE_OK=1.",
  );
const output =
  process.env.E2E_SCREENSHOTS || path.resolve("test-results/workspace");
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
const password = "Password123!";
const stamp = Date.now();
let employerToken;
async function api(endpoint, method = "GET", body, token) {
  const response = await fetch(apiBase + endpoint, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json();
  assert.equal(response.ok, true, endpoint + ": " + JSON.stringify(json));
  return json.data;
}
async function login(role, email) {
  await page.goto(origin + "/login");
  await page.locator("#role-btn-" + role).click();
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.locator("#login-submit-btn").click();
  await page.waitForURL("**/dashboard/" + role);
  await expect(page.getByRole("navigation")).toBeVisible();
  await expect(page.locator("[data-nextjs-dialog]")).toHaveCount(0);
}
async function shot(name) {
  await expect(page.getByText("Đang tải dữ liệu…", { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
}
function future(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 16);
}
try {
  await page.goto(origin + "/dashboard/admin");
  await page.waitForURL("**/login");
  await page.locator("#role-btn-employer").click();
  await page.locator("#login-email").fill("employer@edulink.test");
  await page.locator("#login-password").fill("incorrect-password");
  await page.locator("#login-submit-btn").click();
  await expect(page.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();
  assert.equal(new URL(page.url()).pathname, "/login");
  console.log("PASS: unauthenticated routes redirect and bad passwords fail");

  await login("employer", "employer@edulink.test");
  employerToken = await page.evaluate(() =>
    sessionStorage.getItem("edulink_staff_token_v1"),
  );
  await expect(
    page.getByRole("heading", { name: "Công việc của bạn", exact: true }),
  ).toBeVisible();
  await shot("employer-list");
  await page
    .getByRole("link", { name: "Hồ sơ doanh nghiệp", exact: true })
    .click();
  await page.getByLabel("Tên doanh nghiệp").fill("EduLink Studio QA");
  await page.getByLabel("Lĩnh vực hoạt động").fill("Giáo dục & công nghệ");
  await page.getByLabel("Website", { exact: true }).fill("https://example.com");
  await page
    .getByLabel("Giới thiệu", { exact: true })
    .fill("Kết nối sinh viên với những dự án thực tế.");
  await page.getByRole("button", { name: "Lưu hồ sơ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Đã lưu hồ sơ doanh nghiệp.",
  );
  await page.reload();
  await expect(page.getByLabel("Tên doanh nghiệp")).toHaveValue(
    "EduLink Studio QA",
  );
  console.log("PASS: company profile persists after reload");

  await page.goto(origin + "/dashboard/employer/jobs/new");
  await page
    .getByLabel("Tên công việc *", { exact: true })
    .fill("Dashboard học tập · QA " + stamp);
  await page
    .getByLabel("Mô tả & yêu cầu bàn giao *")
    .fill(
      "Xây dựng dashboard học tập responsive. Bàn giao source và hướng dẫn.",
    );
  await page.getByLabel("Kỹ năng yêu cầu").fill("React, English");
  await page.getByLabel("Ngân sách Mock USDC *").fill("100");
  await page.getByLabel("Hạn hoàn thành *", { exact: true }).fill(future(7));
  await page
    .getByLabel("Kết quả bàn giao *", { exact: true })
    .fill("Thiết kế giao diện");
  await page.getByLabel("Số tiền *", { exact: true }).fill("30");
  await page.getByLabel("Hạn milestone *", { exact: true }).fill(future(3));
  await page
    .getByLabel("Tiêu chí nghiệm thu", { exact: true })
    .fill("Đủ màn hình, hoạt động trên mobile.");
  await page
    .getByRole("button", { name: "Tạo công việc", exact: true })
    .click();
  await expect(page.getByRole("alert").filter({ hasText: "Tổng tiền milestone" })).toContainText(
    "Tổng tiền milestone phải bằng ngân sách",
  );
  await page.getByLabel("Số tiền *", { exact: true }).fill("40");
  await page
    .getByRole("button", { name: "Thêm milestone", exact: true })
    .click();
  await page
    .getByLabel("Kết quả bàn giao *", { exact: true })
    .nth(1)
    .fill("Bàn giao source");
  await page.getByLabel("Số tiền *", { exact: true }).nth(1).fill("60");
  await page
    .getByLabel("Hạn milestone *", { exact: true })
    .nth(1)
    .fill(future(6));
  await shot("employer-create");
  await page
    .getByRole("button", { name: "Tạo công việc", exact: true })
    .click();
  await page.waitForURL(/\/dashboard\/employer\/jobs\/\d+$/);
  const jobId = Number(new URL(page.url()).pathname.split("/").pop());
  await expect(
    page.getByRole("heading", { name: "Dashboard học tập · QA " + stamp }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Ký quỹ mô phỏng", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Đề xuất Top 5", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Đề xuất Top 5", exact: true })
    .click();
  await expect(page.locator("details")).toHaveCount(5);
  let job = await api(
    "/workspace/jobs/" + jobId,
    "GET",
    undefined,
    employerToken,
  );
  const studentLogin = await api("/login", "POST", {
    email: "student@edulink.test",
    password,
  });
  const studentToken = studentLogin.token;
  const application = job.applications.find(
    (item) => item.student_id === studentLogin.user.id,
  );
  assert.ok(application);
  await api(
    "/applications/" + application.id + "/accept",
    "POST",
    {},
    studentToken,
  );
  for (const milestone of job.milestones) {
    await api(
      "/milestones/" + milestone.id + "/submit",
      "POST",
      {
        work_url: "https://example.com/work",
        description: "Bản bàn giao cho " + milestone.title,
      },
      studentToken,
    );
  }
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Duyệt milestone", exact: true }),
  ).toHaveCount(2);
  await page
    .getByRole("button", { name: "Duyệt milestone", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Phản hồi nghiệm thu", { exact: true })
    .fill("Đạt yêu cầu thiết kế.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Duyệt milestone", exact: true }),
  ).toHaveCount(1);
  job = await api("/workspace/jobs/" + jobId, "GET", undefined, employerToken);
  assert.equal(job.milestones[0].status, "paid");
  await page.getByRole("button", { name: "Yêu cầu sửa", exact: true }).click();
  await page
    .getByLabel("Nội dung cần chỉnh sửa *")
    .fill("Bổ sung hướng dẫn chạy.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Yêu cầu sửa", exact: true }),
  ).toHaveCount(0);
  job = await api("/workspace/jobs/" + jobId, "GET", undefined, employerToken);
  assert.equal(job.milestones[1].status, "pending");
  await api(
    "/milestones/" + job.milestones[1].id + "/submit",
    "POST",
    {
      work_url: "https://example.com/final",
      description: "Đã bổ sung hướng dẫn",
    },
    studentToken,
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Mở tranh chấp", exact: true })
    .click();
  await page
    .getByLabel("Lý do tranh chấp *")
    .fill("Cần hội đồng đánh giá phạm vi bàn giao.");
  await page
    .getByLabel("Link bằng chứng", { exact: true })
    .fill("https://example.com/evidence");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Xác nhận", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: /Xem tranh chấp #/ }),
  ).toBeVisible();
  const disputeUrl = await page
    .getByRole("link", { name: /Xem tranh chấp #/ })
    .getAttribute("href");
  const disputeId = Number(disputeUrl.split("/").pop());
  await shot("employer-detail");
  console.log(
    "PASS: create with amount validation, mock funding, Top 5, approve, request revision, open dispute",
  );

  for (const [index, email] of [
    "mentor@edulink.test",
    "mentor2@edulink.test",
    "mentor3@edulink.test",
  ].entries()) {
    await login("mentor", email);
    await page.goto(origin + "/dashboard/mentor/disputes/" + disputeId);
    await expect(
      page.getByText("Cần hội đồng đánh giá phạm vi bàn giao."),
    ).toBeVisible();
    await page
      .getByLabel("Tỷ lệ cho sinh viên (%)")
      .fill(String([60, 70, 80][index]));
    await page
      .getByLabel("Nhận xét & căn cứ *")
      .fill("Đã đối chiếu sản phẩm và bằng chứng, đề xuất tỷ lệ tương ứng.");
    await page
      .getByRole("button", { name: "Gửi phiếu đánh giá", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Xác nhận bỏ phiếu", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Phiếu đánh giá của bạn" }),
    ).toBeVisible();
  }
  await shot("mentor-dispute");
  const votes = (
    await api(
      "/workspace/disputes/" + disputeId,
      "GET",
      undefined,
      employerToken,
    )
  ).votes;
  assert.equal(votes.length, 3);
  console.log("PASS: three distinct mentors vote via browser");

  await login("admin", "admin@edulink.test");
  await page
    .getByRole("textbox", { name: "Tìm kiếm", exact: true })
    .fill("student2@edulink.test");
  await page.getByRole("button", { name: "Tìm kiếm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Chỉnh sửa", exact: true }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "Chỉnh sửa", exact: true }).click();
  await page.getByLabel("Tên hiển thị").fill("Ứng viên QA đã xác minh");
  await page.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: /Ứng viên QA đã xác minh/ }),
  ).toBeVisible();
  await page.goto(origin + "/dashboard/admin/disputes/" + disputeId);
  await page
    .getByLabel("Nội dung phán quyết *")
    .fill("Thống nhất theo ba phiếu Mentor: sinh viên 70%, doanh nghiệp 30%.");
  await page
    .getByRole("button", { name: "Lưu phán quyết", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Xác nhận phán quyết", exact: true })
    .click();
  await expect(
    page.getByText(/Phán quyết đã được lưu: sinh viên 70%/),
  ).toBeVisible();
  await shot("admin-resolution");
  const resolved = await api(
    "/workspace/disputes/" + disputeId,
    "GET",
    undefined,
    employerToken,
  );
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.student_percentage, 70);
  console.log(
    "PASS: admin searches/edits users and resolves to the actual vote average",
  );

  await page.goto(origin + "/dashboard/admin/transactions");
  await expect(
    page.getByRole("heading", { name: "Giao dịch & ký quỹ", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Giao dịch mô phỏng").first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Mở menu", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.getByRole("link", { name: "Người dùng", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Người dùng", exact: true }),
  ).toBeVisible();
  await shot("admin-mobile");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Mobile page must not overflow",
  );
  await page.getByRole("button", { name: "Mở menu", exact: true }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await page.waitForURL("**/login");
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("edulink_staff_token_v1")),
    null,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: mobile navigation, transaction labels, logout and no browser JS errors",
  );
  console.log(JSON.stringify({ jobId, disputeId, screenshots: output }));
} catch (error) {
  await shot("failure");
  console.error("CURRENT PAGE:", page.url());
  console.error((await page.locator("body").innerText()).slice(0, 4500));
  throw error;
} finally {
  await browser.close();
}
