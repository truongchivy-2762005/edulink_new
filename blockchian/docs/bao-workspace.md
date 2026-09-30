# Bàn giao phần việc của Bảo

Ba dashboard dùng chung thiết kế với frontend sinh viên và gọi Laravel API bằng Sanctum. Các route mới nằm trong `app/dashboard/employer`, `app/dashboard/mentor`, `app/dashboard/admin`; các thành phần dùng chung nằm trong `components/workspace`.

## Chức năng

| Vai trò | Đường dẫn | Chức năng |
| --- | --- | --- |
| Doanh nghiệp | /dashboard/employer | Công việc của doanh nghiệp, tìm kiếm, lọc trạng thái, phân trang |
| Doanh nghiệp | /dashboard/employer/jobs/new | Đăng việc, thêm/xóa milestone, kiểm tra tổng tiền và hạn bàn giao |
| Doanh nghiệp | /dashboard/employer/jobs/{id} | Chi tiết, Top 5 matching, xem hồ sơ ứng viên, bài nộp, duyệt, yêu cầu sửa, mở tranh chấp |
| Doanh nghiệp | /dashboard/employer/profile | Lưu tên, lĩnh vực, website và giới thiệu doanh nghiệp |
| Doanh nghiệp | /dashboard/employer/disputes | Theo dõi bằng chứng, phiếu Mentor và phán quyết |
| Doanh nghiệp | /dashboard/employer/transactions | Theo dõi ký quỹ, giải ngân từng milestone và hoàn tiền |
| Mentor | /dashboard/mentor | Danh sách tranh chấp, lọc và mở hồ sơ |
| Mentor | /dashboard/mentor/disputes/{id} | Xem bài nộp/bằng chứng, nhập tỷ lệ phân chia và nhận xét, xác nhận bỏ phiếu |
| Admin | /dashboard/admin | Tìm/lọc người dùng, xem vai trò và uy tín, chỉnh sửa tên hiển thị |
| Admin | /dashboard/admin/jobs | Giám sát mọi công việc và chi tiết nghiệm thu |
| Admin | /dashboard/admin/disputes | Xem hồ sơ, lưu phán quyết khi đủ ba phiếu; tỷ lệ dùng kết quả tính bởi backend |
| Admin | /dashboard/admin/transactions | Giám sát các giao dịch đã ghi nhận |

Có trạng thái tải, trống, lỗi, thử lại; xác nhận các thao tác nghiệm thu/bỏ phiếu/phán quyết; menu cho điện thoại; nhãn phân biệt giao dịch mô phỏng và Devnet. Các đường dẫn bằng chứng chỉ mở HTTP/HTTPS. Tệp bài nộp được tải qua API có kiểm tra quyền.

Quản trị người dùng hiện giới hạn ở tra cứu và sửa tên hiển thị. Không tự cấp quyền Admin, khóa tài khoản hay xóa dữ liệu nghiệp vụ.

## Chạy ứng dụng

Backend tại thư mục kế bên `EduLink Hub`. PHP phải đáp ứng `vendor/composer/platform_check.php`; bộ thư viện đang kiểm thử yêu cầu PHP >= 8.4.1.

1. Cấu hình database trong môi trường của backend.
2. Chạy `php artisan migrate` để thêm bảng `company_profiles`. Không cần xóa hoặc tạo lại các bảng cũ.
3. Chạy `php artisan serve --host=127.0.0.1 --port=8000`.
4. Trong frontend, sao chép `.env.example` sang `.env.local` nếu cần thay địa chỉ backend. Mặc định `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`; có thể cấu hình URL có hoặc không có hậu tố `/api`.
5. Chạy `npm ci`, `npm run build`, `npm start -- --hostname 127.0.0.1 --port 3000`.
6. Mở `http://127.0.0.1:3000/login`, chọn đúng vai trò và dùng tài khoản Laravel.

Biến `NEXT_PUBLIC_API_URL` được Next.js đưa vào lúc build: build lại khi thay biến này.

CORS tự bổ sung localhost/127.0.0.1 cổng 3000 trong môi trường `local` và `testing`. Production chỉ sử dụng các origin được khai báo qua `FRONTEND_URLS` (danh sách cách nhau bằng dấu phẩy) hoặc `FRONTEND_URL`; không dùng wildcard.

## Dữ liệu demo

Chỉ chạy seeder sau trên database demo riêng:

```sh
php artisan db:seed --class=WorkspaceDemoSeeder
```

Seeder này gọi seeder gốc và bổ sung hai Mentor cùng bốn ứng viên. Seeder gốc cập nhật các tài khoản demo đã có, vì vậy không chạy trên database người dùng thật.

Mật khẩu demo chung: `Password123!`.

- Doanh nghiệp: `employer@edulink.test`
- Mentor: `mentor@edulink.test`, `mentor2@edulink.test`, `mentor3@edulink.test`
- Admin: `admin@edulink.test`
- Sinh viên phục vụ API demo: `student@edulink.test`

Trong phiên kiểm thử, database riêng là `%TEMP%/edulink-bao-workspace-qa.sqlite`; database và file `.env` hiện có của dự án không bị thay thế.

## Đăng nhập và phạm vi tích hợp

- Ba vai trò của Bảo gọi `POST /api/login` và xác minh phiên bằng `GET /api/me`.
- Token được giữ trong sessionStorage của tab, không lưu mật khẩu.
- Vai trò lấy từ backend; chọn một tab vai trò không tự cấp quyền.
- Đăng xuất gọi API thu hồi token, rồi xóa phiên của tab.
- Đăng nhập Google/OCID cho workspace chưa được tích hợp; màn hình thông báo rõ khi chọn.
- Module đăng nhập/giao diện sinh viên hiện hữu của Vỹ vẫn giữ nguyên. Luồng đăng ký frontend hiện hữu vẫn là mô phỏng, vì vậy tài khoản workspace phải được tạo trong backend.

## API hỗ trợ mới

Tất cả endpoint dưới đây có tiền tố `/api/workspace` và yêu cầu Bearer token.

| Endpoint | Vai trò | Công dụng |
| --- | --- | --- |
| GET /config | Doanh nghiệp, Mentor, Admin | Chế độ blockchain |
| GET /jobs | Doanh nghiệp, Admin | Danh sách công việc có phân trang; doanh nghiệp chỉ thấy việc của mình |
| GET /jobs/{id} | Chủ việc, Admin | Hồ sơ ứng viên, milestone, bài nộp, tranh chấp và escrow |
| GET /disputes | Doanh nghiệp, Mentor, Admin | Danh sách tranh chấp; doanh nghiệp chỉ thấy tranh chấp của mình |
| GET /disputes/{id} | Chủ việc, Mentor, Admin | Chi tiết và bằng chứng phục vụ đánh giá |
| GET /submissions/{id}/file | Người có quyền xem xét | Tải tệp, không công khai đường dẫn storage |
| GET /company, PUT /company | Doanh nghiệp | Hồ sơ của doanh nghiệp hiện tại |
| GET /users | Admin | Danh sách người dùng có lọc và phân trang |
| PATCH /users/{id} | Admin | Cập nhật tên, không thay đổi vai trò |
| GET /escrows | Doanh nghiệp, Admin | Ký quỹ và lịch sử giao dịch gắn với milestone |

Các thao tác tạo việc, matching, duyệt/yêu cầu sửa, mở tranh chấp, bỏ phiếu, phán quyết và xác minh thanh toán dùng endpoint nghiệp vụ đã có.

## Điểm bàn giao cho các thành viên khác

- **Ngữ:** wallet connect/ký giao dịch và chương trình Anchor chưa nằm trong phần này. Chế độ mock chỉ cập nhật dữ liệu; chế độ Devnet nhận signature từ module ví và gửi backend xác minh. Signature pending nhập sai có thể được thay và kiểm tra lại.
- **Ngữ + Khang:** endpoint resolve hiện lưu phán quyết, chưa thực thi chia/hoàn token và hoàn tất trạng thái job. UI ghi rõ điều này, không hiển thị đã thanh toán sau phán quyết.
- **Khang:** bộ kiểm tra giao dịch Devnet hiện hữu cần hoàn thiện đối chiếu số tiền, mint, ví và escrow trước khi dùng cho thanh toán thật.
- **Hiếu:** UI lấy điểm/lý do matching từ API, không tạo điểm giả. OCID/OCA/OCB thuộc module riêng.
- **Vỹ + Khang:** dùng chung tài khoản/phiên và nối API sinh viên là công việc tích hợp tiếp theo; test trình duyệt chuẩn bị bài nộp qua API sinh viên để kiểm chứng màn hình của Bảo.

## Kiểm thử

Backend:

```sh
php artisan test
```

Frontend:

```sh
npm run test:workspace
npx tsc --noEmit
npx eslint components/workspace lib/workspace.ts lib/workspace-client.mjs app/dashboard/employer app/dashboard/mentor app/dashboard/admin app/login/page.tsx
npm run build
```

Kiểm thử trình duyệt cần backend/frontend local đang chạy với database demo riêng, seeder nêu trên và `BLOCKCHAIN_MODE=mock`:

```powershell
npx playwright install chromium
$env:E2E_WRITE_OK = '1'
npm run test:workspace:e2e
```

Script từ chối chạy nếu không xác nhận `E2E_WRITE_OK=1` hoặc URL không phải localhost. Script tạo một job demo, sửa tên một ứng viên demo và lưu hồ sơ doanh nghiệp demo; không chạy trên database sản xuất. Có thể tùy chọn `E2E_BASE_URL`, `E2E_API_URL`, `E2E_SCREENSHOTS`.

Test bao phủ: chặn người chưa đăng nhập, mật khẩu sai, lưu hồ sơ, sai tổng milestone, tạo việc, ký quỹ mock, matching, nghiệm thu, yêu cầu sửa, tranh chấp, ba Mentor bỏ phiếu, Admin lưu phán quyết, quản lý tên người dùng, menu mobile, đăng xuất và lỗi JavaScript.
