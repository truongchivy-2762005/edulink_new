# HƯỚNG DẪN CÀI ĐẶT, CHẠY VÀ VẬN HÀNH DỰ ÁN EDULINK HUB

> Tài liệu chi tiết dành cho các thành viên phát triển, người kiểm thử (QA) và người chấm dự án.

---

## MỤC LỤC
1. [Tổng quan kiến trúc dự án](#1-tổng-quan-kiến-trúc-dự-án)
2. [Yêu cầu môi trường (Prerequisites)](#2-yêu-cầu-môi-trường-prerequisites)
3. [Cài đặt lần đầu (Setup from Scratch)](#3-cài-đặt-lần-đầu-setup-from-scratch)
4. [Hướng dẫn chạy hằng ngày (Daily Running)](#4-hướng-dẫn-chạy-hằng-ngày-daily-running)
5. [Danh sách tài khoản kiểm thử (Demo Accounts)](#5-danh-sách-tài-khoản-kiểm-thử-demo-accounts)
6. [Quy trình vận hành chi tiết các luồng (Workflows)](#6-quy-trình-vận-hành-chi-tiết-các-luồng-workflows)
   - [Luồng 1: Tuyển dụng, Ký quỹ & Nghiệm thu (Happy Path)](#luồng-1-tuyển-dụng-ký-quỹ--nghiệm-thu-happy-path)
   - [Luồng 2: Trọng tài & Giải quyết tranh chấp (Dispute Flow)](#luồng-2-trọng-tài--giải-quyết-tranh-chấp-dispute-flow)
7. [Chế độ Blockchain: Mock Mode vs Solana Devnet](#7-chế-độ-blockchain-mock-mode-vs-solana-devnet)
8. [Xử lý lỗi thường gặp (Troubleshooting)](#8-xử-lý-lỗi-thường-gặp-troubleshooting)

---

## 1. Tổng quan kiến trúc dự án

**EduLink Hub** là nền tảng kết nối Doanh nghiệp, Sinh viên và Mentor với cơ chế ký quỹ (Escrow) minh bạch trên blockchain Solana:

```
┌────────────────────────────────────────────────────────┐
│                   GIAO DIỆN (Frontend)                 │
│         Next.js 16 (App Router) - Port 3000            │
│       Thư mục: blockchian/ (Student & Workspace)       │
└──────────────┬───────────────────────────┬─────────────┘
               │ (REST API / Sanctum)      │ (Web3 / Anchor)
               ▼                           ▼
┌───────────────────────────────┐  ┌─────────────────────┐
│       MÁY CHỦ (Backend)       │  │ SMART CONTRACT      │
│     Laravel 12 - Port 8000    │  │ Solana Devnet       │
│     Thư mục: EduLink Hub/     │  │ Program: edulink_   │
│   (Sanctum, Matching, Escrow) │  │ escrow              │
└──────────────┬────────────────┘  └─────────────────────┘
               │
               ▼
┌───────────────────────────────┐
│     CƠ SỞ DỮ LIỆU (DB)        │
│       MySQL - Port 3306       │
│     Database: edulink_hub     │
└───────────────────────────────┘
```

* **Frontend (`blockchian/`)**: Xây dựng bằng Next.js 16, React 19, TypeScript. Cung cấp cổng làm việc cho Sinh viên và 3 Dashboard quản trị (Doanh nghiệp, Mentor, Admin).
* **Backend (`EduLink Hub/`)**: Xây dựng bằng Laravel 12 REST API, xác thực bảo mật bằng Laravel Sanctum, thuật toán AI Matching sinh viên, quản lý công việc và giao dịch.
* **Database (`MySQL`)**: Lưu trữ thông tin người dùng, công việc, bài nộp, lịch sử tranh chấp và uy tín.
* **Blockchain (`Solana Devnet`)**: Smart Contract Anchor `edulink_escrow` quản lý khóa tiền ký quỹ (Escrow Vault), giải ngân theo milestone (Payout), hoàn tiền và phán quyết tranh chấp bằng SPL-Token (Mock USDC).

---

## 2. Yêu cầu môi trường (Prerequisites)

Trước khi chạy, máy tính cần cài đặt sẵn:
1. **PHP >= 8.2** (Khuyến nghị PHP 8.2 hoặc PHP 8.4) và **Composer**.
2. **Node.js >= 18.x** (Khuyến nghị Node.js 20 LTS) và **npm**.
3. **XAMPP** (hoặc MySQL Server độc lập chạy tại port 3306).
4. **Tiện ích ví Solana** (Phantom Wallet hoặc Solflare) cài trên trình duyệt Chrome/Brave/Edge.

---

## 3. Cài đặt lần đầu (Setup from Scratch)

### Bước 1: Khởi động Cơ sở dữ liệu (MySQL)
1. Mở **XAMPP Control Panel**, bấm **Start** tại mục **MySQL** (và Apache nếu cần dùng phpMyAdmin).
2. Mở trình duyệt vào `http://localhost/phpmyadmin/`.
3. Tạo một database mới tên là: `edulink_hub` (Collation: `utf8mb4_unicode_ci`).
*(Hoặc bạn có thể import trực tiếp file `edulink_hub.sql` có sẵn ở thư mục gốc).*

---

### Bước 2: Cấu hình và cài đặt Backend (Laravel)
Mở cửa sổ dòng lệnh (PowerShell hoặc Terminal), di chuyển vào thư mục backend:

```powershell
cd "c:\xampp\htdocs\solana-main\EduLink Hub"
```

1. Cài đặt các package PHP:
   ```powershell
   composer install
   ```

2. Tạo file cấu hình môi trường `.env`:
   ```powershell
   copy .env.example .env
   ```

3. Tạo mã khóa ứng dụng (Application Key):
   ```powershell
   php artisan key:generate
   ```

4. Kiểm tra file `.env` đã trỏ đúng vào database:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=edulink_hub
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. Khởi tạo bảng dữ liệu và nạp dữ liệu mẫu đầy đủ:
   ```powershell
   # Tạo các bảng cơ bản và dữ liệu gốc
   php artisan migrate:fresh --seed

   # Nạp thêm dữ liệu ứng viên Top 5 và 3 Mentor để kiểm thử tranh chấp
   php artisan db:seed --class=WorkspaceDemoSeeder
   ```

---

### Bước 3: Cấu hình và cài đặt Frontend (Next.js)
Mở cửa sổ dòng lệnh thứ hai, di chuyển vào thư mục frontend:

```powershell
cd "c:\xampp\htdocs\solana-main\blockchian"
```

1. Cài đặt các thư viện Node.js:
   ```powershell
   npm install
   ```

2. Kiểm tra file cấu hình `.env.local` (nếu chưa có thì sao chép từ `.env.example`):
   File [blockchian/.env.local](file:///c:/xampp/htdocs/solana-main/blockchian/.env.local) phải có nội dung sau:
   ```env
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   NEXT_PUBLIC_MOCK_USDC_MINT=Co4758jcs8XiSMgfiGhsM278KBceNQwzmX2B9fERd7J7
   NEXT_PUBLIC_SOLANA_PROGRAM_ID=JC8zNCPiuxsCdrH7ffLxEvYX65PSWkGXSUt1rqMZ3KRQ
   ```

---

### Bước 4: Smart Contract Solana (Lưu ý quan trọng)
* Smart Contract `edulink_escrow` **đã được biên dịch và triển khai sẵn** trên mạng **Solana Devnet** tại địa chỉ:
  `JC8zNCPiuxsCdrH7ffLxEvYX65PSWkGXSUt1rqMZ3KRQ`
* File IDL tương ứng đã được lưu sẵn tại [blockchian/lib/solana/edulink_escrow.json](file:///c:/xampp/htdocs/solana-main/blockchian/lib/solana/edulink_escrow.json).
* **Bạn KHÔNG CẦN phải chạy lại Solana Playground mỗi ngày.** Chỉ cần dùng Program ID đã có sẵn.

---

## 4. Hướng dẫn chạy hằng ngày (Daily Running)

Mỗi khi mở máy bắt đầu làm việc hoặc demo, bạn chỉ cần thực hiện 3 bước sau:

### 1. Bật MySQL
* Mở **XAMPP Control Panel** -> Bấm **Start** tại mục **MySQL**.

### 2. Bật Backend (Laravel API)
* Mở Terminal 1:
  ```powershell
  cd "c:\xampp\htdocs\solana-main\EduLink Hub"
  php artisan serve --host=127.0.0.1 --port=8000
  ```
  *API sẽ chạy tại: `http://127.0.0.1:8000/api`*

### 3. Bật Frontend (Next.js)
* Mở Terminal 2:
  ```powershell
  cd "c:\xampp\htdocs\solana-main\blockchian"
  npm run dev
  ```
  *Giao diện web sẽ chạy tại: `http://localhost:3000`*

### 4. Truy cập hệ thống
* Mở trình duyệt web truy cập: **`http://localhost:3000/login`**

---

## 5. Danh sách tài khoản kiểm thử (Demo Accounts)

Tất cả tài khoản demo sử dụng chung một mật khẩu: **`Password123!`**

| Vai trò (Role) | Email đăng nhập | Quyền hạn & Chức năng chính |
| :--- | :--- | :--- |
| **Doanh nghiệp (Employer)** | `employer@edulink.test` | Đăng việc, chia milestone, nạp ký quỹ (Escrow), duyệt bài nộp, giải ngân tiền, mở khiếu nại |
| **Sinh viên (Student)** | `student@edulink.test` | Xem việc làm, ứng tuyển, nộp sản phẩm từng milestone, nhận thanh toán USDC, nhận SBT uy tín |
| **Mentor 1 (Trọng tài)** | `mentor@edulink.test` | Xem hồ sơ tranh chấp, xem xét bằng chứng và bỏ phiếu tỷ lệ giải quyết |
| **Mentor 2 (Trọng tài)** | `mentor2@edulink.test` | Thành viên thứ hai tham gia hội đồng bỏ phiếu phân chia tiền |
| **Mentor 3 (Trọng tài)** | `mentor3@edulink.test` | Thành viên thứ ba trong ban trọng tài 3 người |
| **Quản trị viên (Admin)** | `admin@edulink.test` | Giám sát tất cả công việc, quản lý người dùng, ban hành phán quyết sau khi đủ 3 phiếu Mentor |

---

## 6. Quy trình vận hành chi tiết các luồng (Workflows)

### Luồng 1: Tuyển dụng, Ký quỹ & Nghiệm thu (Happy Path)

Đây là quy trình chuẩn từ lúc đăng việc cho đến khi sinh viên nhận được tiền:

```
[Doanh nghiệp] Đăng việc & Khởi tạo Milestone
      │
      ▼
[Doanh nghiệp] Ký quỹ tiền (Escrow Deposit qua Mock USDC)
      │
      ▼
[Sinh viên] Ứng tuyển công việc (Apply Job / AI Matching)
      │
      ▼
[Doanh nghiệp] Chọn ứng viên & Gán việc (Assign Candidate)
      │
      ▼
[Sinh viên] Làm việc & Nộp bài cho Milestone 1 (Submit Work)
      │
      ▼
[Doanh nghiệp] Nghiệm thu bài làm & Bấm Duyệt (Approve)
      │
      ▼
[Hệ thống/Solana] Tự động giải ngân (Payout Milestone) về ví Sinh viên
      │
      ▼
[Hệ thống] Cộng điểm Uy tín (Reputation Score) cho Sinh viên
```

#### Các bước thao tác trên giao diện:
1. Đăng nhập với tài khoản **Doanh nghiệp** (`employer@edulink.test`).
2. Vào **Dashboard Doanh nghiệp** -> Bấm **Đăng tin công việc mới** (`/dashboard/employer/jobs/new`).
3. Điền tiêu đề, mô tả, kỹ năng và thêm các **Milestone** (ví dụ: Milestone 1: 40 USDC, Milestone 2: 60 USDC). Bấm **Tạo công việc**.
4. Vào chi tiết công việc vừa tạo, bấm **Nạp tiền ký quỹ (Fund Escrow)** để chuyển số tiền ngân sách vào tài khoản ký quỹ an toàn.
5. Đăng xuất, đăng nhập vào tài khoản **Sinh viên** (`student@edulink.test`). Vào mục **Tìm việc**, tìm công việc vừa tạo và bấm **Ứng tuyển**.
6. Đăng nhập lại **Doanh nghiệp**, vào tab ứng viên của công việc đó, chọn sinh viên và bấm **Chấp nhận / Giao việc**.
7. Tài khoản **Sinh viên** vào mục **Việc của tôi**, chọn Milestone 1, tải file hoặc gửi link sản phẩm hoàn thành (bấm **Nộp bài**).
8. Tài khoản **Doanh nghiệp** vào chi tiết công việc, kiểm tra bài nộp của Milestone 1 và bấm **Nghiệm thu / Duyệt**.
9. Tiền được giải ngân cho sinh viên và trạng thái chuyển sang hoàn thành.

---

### Luồng 2: Trọng tài & Giải quyết tranh chấp (Dispute Flow)

Khi có bất đồng về chất lượng sản phẩm giữa doanh nghiệp và sinh viên:

```
[Doanh nghiệp/Sinh viên] Mở tranh chấp (Raise Dispute tại Milestone)
      │  (Tiền ký quỹ tại Milestone đó bị đóng băng on-chain)
      ▼
[Mentor 1, 2, 3] Đăng nhập -> Vào chi tiết tranh chấp -> Xem bằng chứng
      │  (Mỗi Mentor bỏ phiếu tỷ lệ chia tiền: % Doanh nghiệp - % Sinh viên)
      ▼
[Admin] Khi nhận đủ 3 phiếu -> Xem tỷ lệ trung bình -> Ban hành Phán quyết (Resolve)
      │
      ▼
[Hợp đồng Escrow] Thực thi phân chia tiền hoàn lại ví Doanh nghiệp & trả ví Sinh viên
```

#### Các bước thao tác trên giao diện:
1. Tại bài nộp chưa đạt của sinh viên, Doanh nghiệp bấm **Mở tranh chấp** kèm theo lý do và bằng chứng.
2. Lần lượt đăng nhập vào 3 tài khoản Mentor:
   * `mentor@edulink.test` -> Vào `/dashboard/mentor`, chọn tranh chấp, nhập tỷ lệ (ví dụ: 50% - 50%) và bấm **Gửi biểu quyết**.
   * `mentor2@edulink.test` -> Vào biểu quyết tương tự (ví dụ: 60% - 40%).
   * `mentor3@edulink.test` -> Vào biểu quyết (ví dụ: 40% - 60%).
3. Đăng nhập tài khoản **Admin** (`admin@edulink.test`) -> Vào `/dashboard/admin/disputes`.
4. Khi thấy hệ thống thông báo đã thu thập đủ 3 phiếu từ Mentor, Admin kiểm tra tỷ lệ đồng thuận và bấm **Ban hành phán quyết (Resolve Dispute)**.
5. Hợp đồng giải phóng số tiền theo đúng tỷ lệ phán quyết.
6. Hệ thống tự động ghi nhận biến động điểm uy tín tương ứng vào nhật ký `reputation_logs`.

---

### Luồng 3: Kết nối Open Campus ID (OCID) & Nhận Chứng nhận OCA/SBT

```
[Sinh viên] Vào Trang Cá nhân (Profile) -> Bấm "Kết nối Open Campus ID (OCID)"
      │
      ▼
[Hệ thống] Xác thực OAuth2 Sandbox / Instant Mock -> Nhận OCID Credential Token
      │
      ▼
[Hệ thống/OCA Engine] Tự động cấp Chữ ký & Badge "Open Campus ID Verified Student"
      │
      ▼
[Dashboard/Modal] Chứng chỉ OCA / SBT hiển thị dạng Badge Verified cao cấp
```

#### Các bước thao tác trên giao diện:
1. Đăng nhập tài khoản **Sinh viên** (`student@edulink.test`).
2. Vào trang **Hồ sơ cá nhân** (`/dashboard/student/profile`).
3. Bấm nút **Kết nối Open Campus ID (OCID)**.
4. Hệ thống mở Modal kết nối OCID Sandbox. Bạn có thể chọn:
   - **Xác thực Sandbox Instant (Khuyên dùng)**: Kết nối ngay lập tức để nhận badge.
   - **Đăng nhập OAuth2 Sandbox**: Chuyển hướng sang cổng cấp token Open Campus.
5. Sau khi thành công, sinh viên nhận ngay Badge **Open Campus ID Verified Student** dạng SBT kèm mã hash chữ ký số W3C Verified Credential.
6. Badge này tự động hiển thị trong mục **Chứng chỉ OCA/SBT** trên Hồ sơ Sinh viên và Modal ứng viên phía Doanh nghiệp.

---

### Luồng 4: Nhật ký Uy tín Động (Dynamic Reputation Timeline Log)

```
[Sự kiện Hệ thống] Duyệt Milestone (+10đ) | Trễ hạn (-5đ) | Hủy việc (-15đ) | Phán quyết Tranh chấp (+5đ / -20đ)
      │
      ▼
[ReputationService] Ghi nhận vào cơ sở dữ liệu `reputation_logs` kèm điểm sau biến động
      │
      ▼
[API /reputation/history] Trả về timeline biến động uy tín thời gian thực
      │
      ▼
[UI Component] Hiển thị đẹp mắt tại Dashboard Sinh viên & Modal Ứng viên phía Doanh nghiệp
```

#### Các bước thao tác kiểm tra biến động điểm uy tín:
1. **Kiểm tra cộng điểm (+10đ)**:
   - Doanh nghiệp duyệt bài nộp milestone đúng hạn của sinh viên.
   - Sinh viên kiểm tra **Dashboard Sinh viên** -> Mục **Lịch sử biến động điểm uy tín** xuất hiện dòng ghi nhận: `+10đ` kèm điểm tích lũy mới.
2. **Kiểm tra trừ điểm do Hủy việc (-15đ)**:
   - Sinh viên ứng tuyển và được Doanh nghiệp nhận việc.
   - Tại mục **Việc của tôi**, Sinh viên bấm **Hủy nhận việc**.
   - Điểm uy tín bị trừ `15 điểm` và ghi log lý do `Hủy nhận việc dự án #...`.
3. **Kiểm tra xem log từ phía Doanh nghiệp**:
   - Doanh nghiệp mở Modal chi tiết ứng viên Top 5 AI gợi ý.
   - Cuộn xuống mục **Lịch sử biến động điểm uy tín ứng viên** để đánh giá độ tin cậy của ứng viên trước khi nhận việc.

---

## 7. Chế độ Blockchain: Mock Mode vs Solana Devnet

Dự án hỗ trợ 2 chế độ vận hành blockchain:

### 1. Chế độ Mô phỏng (`BLOCKCHAIN_MODE=mock`) - *Khuyến nghị khi test giao diện nhanh*
* Không yêu cầu ví Phantom phải có SOL thật hay ký giao dịch on-chain.
* Backend tự động mô phỏng các transaction hash (ví dụ: `mock_deposit_...`, `mock_payout_...`).
* Giúp toàn bộ nhóm có thể kiểm thử toàn bộ luồng nghiệp vụ mà không phụ thuộc vào tình trạng mạng Solana Devnet.
* **Cách kích hoạt:**
  Trong file `EduLink Hub/.env`:
  ```env
  BLOCKCHAIN_MODE=mock
  ```

### 2. Chế độ Devnet thực tế (`BLOCKCHAIN_MODE=devnet`) - *Dùng khi demo blockchain on-chain*
* Cần kết nối ví **Phantom / Solflare** chuyển sang mạng **Solana Devnet**.
* Ví doanh nghiệp cần có:
  * **SOL Devnet**: để trả phí gas giao dịch (xin miễn phí tại [solfaucet.com](https://solfaucet.com)).
  * **Mock USDC Devnet**: token dùng để nạp ký quỹ (Mint: `Co4758jcs8XiSMgfiGhsM278KBceNQwzmX2B9fERd7J7`).
* Khi bấm nạp ký quỹ / giải ngân, ví Phantom sẽ hiện popup yêu cầu người dùng xác nhận chữ ký số (Sign Transaction).
* **Cách kích hoạt:**
  Trong file `EduLink Hub/.env`:
  ```env
  BLOCKCHAIN_MODE=devnet
  SOLANA_PROGRAM_ID=JC8zNCPiuxsCdrH7ffLxEvYX65PSWkGXSUt1rqMZ3KRQ
  MOCK_USDC_MINT=Co4758jcs8XiSMgfiGhsM278KBceNQwzmX2B9fERd7J7
  ```

---

## 8. Xử lý lỗi thường gặp (Troubleshooting)

### Lỗi 1: `CORS error` hoặc Không gọi được API từ frontend sang backend
* **Nguyên nhân:** Địa chỉ `NEXT_PUBLIC_API_URL` sai hoặc backend chưa chạy.
* **Khắc phục:**
  1. Đảm bảo lệnh `php artisan serve --port=8000` đang chạy.
  2. Kiểm tra file `blockchian/.env.local` có chính xác dòng:
     ```env
     NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
     ```
  3. Khởi động lại server frontend (`Ctrl + C` và gõ lại `npm run dev`).

### Lỗi 2: Lỗi `SQLSTATE[HY000] [1049] Unknown database 'edulink_hub'`
* **Nguyên nhân:** Chưa tạo database trong MySQL.
* **Khắc phục:** Mở phpMyAdmin tạo mới database tên là `edulink_hub`, sau đó chạy lại:
  ```powershell
  php artisan migrate:fresh --seed
  php artisan db:seed --class=WorkspaceDemoSeeder
  ```

### Lỗi 3: Đăng nhập báo lỗi `401 Unauthenticated` hoặc tự văng về trang Login
* **Nguyên nhân:** Phiên làm việc (Session) hoặc Sanctum token trong trình duyệt bị hết hạn hoặc sai lệch.
* **Khắc phục:**
  1. Mở cửa sổ ẩn danh (Incognito) hoặc bấm `F12` -> Vào mục `Application` -> `Session Storage` / `Local Storage` và xóa token cũ.
  2. Đăng nhập lại với đúng mật khẩu `Password123!`.

### Lỗi 4: Ví Phantom báo `Transaction simulation failed` hoặc `Insufficient Funds`
* **Nguyên nhân:** Ví không có đủ SOL Devnet để trả phí giao dịch (Transaction Fee & Rent Exemption).
* **Khắc phục:**
  1. Mở tiện ích Phantom -> Bấm cài đặt (Settings) -> Developer Settings -> Bật **Testnet Mode** và chọn **Solana Devnet**.
  2. Copy địa chỉ ví và dán vào [solfaucet.com](https://solfaucet.com) để xin 1 - 2 SOL Devnet.

### Lỗi 5: Lịch sử uy tín chưa cập nhật ngay sau khi Hủy việc hoặc Duyệt bài
* **Nguyên nhân:** Dữ liệu trang web chưa refresh lại từ API.
* **Khắc phục:** Bấm `F5` hoặc chuyển sang tab khác rồi quay lại, giao diện `ReputationHistory` sẽ tự động gọi API `GET /api/reputation/history` mới nhất.

---

## 9. Bảng Đối Soát Nghiệm Thu 6 Hạng Mục Tính Năng

| Hạng mục | Tính năng chính | Trạng thái | Vị trí nghiệm thu |
| :--- | :--- | :---: | :--- |
| **Hạng mục 1** | AI Matching Engine & Gợi ý Top 5 | ✅ Hoàn thành | Dashboard Doanh nghiệp -> Modal ứng viên gợi ý từ AI |
| **Hạng mục 2** | Open Campus ID (OCID) Connect | ✅ Hoàn thành | Sinh viên -> Profile -> Nút "Kết nối OCID" |
| **Hạng mục 3** | OCA / SBT Credential Reader | ✅ Hoàn thành | Dashboard Sinh viên & Modal Ứng viên Doanh nghiệp |
| **Hạng mục 4** | Engine Cấp Badge Open Campus (OCA) | ✅ Hoàn thành | Popup "Chúc mừng bạn nhận Badge" & API `/api/oca/issue` |
| **Hạng mục 5** | Dynamic Reputation Engine & Log Timeline | ✅ Hoàn thành | Dashboard Sinh viên & Modal Ứng viên Doanh nghiệp |
| **Hạng mục 6** | E2E Test, Seeder & Nghiệm thu | ✅ Hoàn thành | File `WorkspaceDemoSeeder.php` & Tài liệu vận hành |
