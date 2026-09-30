# EduLink Hub

Nền tảng kết nối sinh viên, doanh nghiệp và Mentor, gồm frontend Next.js và backend Laravel.

## Mã nguồn

- `blockchian/`: frontend, giao diện sinh viên và dashboard Doanh nghiệp / Mentor / Admin.
- `EduLink Hub/`: Laravel API, xác thực, công việc, milestone, matching và tranh chấp.
- Mã nguồn được lưu trực tiếp trong hai thư mục trên

## Chạy local

Yêu cầu Node.js tương thích Next.js 16, PHP >= 8.2, Composer và MySQL.

### Backend

```sh
cd "EduLink Hub"
composer install
cp .env.example .env
php artisan key:generate
```

Cấu hình database trong `.env`, sau đó:

```sh
php artisan migrate --seed
php artisan serve --host=127.0.0.1 --port=8000
```

Seeder mặc định tạo dữ liệu mẫu và các tài khoản sau, cùng mật khẩu `Password123!`:

- `student@edulink.test`
- `employer@edulink.test`
- `mentor@edulink.test`
- `admin@edulink.test`

Có thể tạo thêm mentor và sinh viên thử bằng `php artisan db:seed --class=WorkspaceDemoSeeder`.

### Frontend

```sh
cd blockchian
cp .env.example .env.local
npm ci
npm run build
npm start -- --hostname 127.0.0.1 --port 3000
```

Mở http://127.0.0.1:3000/login. Địa chỉ API được cấu hình bởi `NEXT_PUBLIC_API_URL` trước khi build.

## Trạng thái tích hợp

Giao diện Sinh viên, Doanh nghiệp, Mentor và Admin đều đã kết nối Laravel API. Luồng sinh viên gồm đăng ký, đăng nhập, xem việc, nhận việc, theo dõi milestone, nộp sản phẩm, xem thu nhập và SBT.

Thanh toán mặc định dùng `BLOCKCHAIN_MODE=mock`. Muốn dùng Solana devnet cần cấu hình program ID, mint USDC và xác minh giao dịch thực tế trước khi chuyển sang `BLOCKCHAIN_MODE=devnet`.

Không commit `.env`, khóa bí mật, database, thư viện cài đặt hoặc dữ liệu runtime.
