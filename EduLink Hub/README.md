# EduLink Hub API

Backend REST API cho EduLink Hub, xây dựng bằng Laravel 12, Sanctum và MySQL. Hệ thống quản lý tài khoản, hồ sơ sinh viên, công việc, AI matching, milestone, bài nộp, escrow, tranh chấp và điểm uy tín.

## Chạy dự án

Yêu cầu PHP 8.2+, Composer và MySQL.

```bash
composer install
copy .env.example .env
php artisan key:generate
```

Khởi động MySQL trong XAMPP, tạo database `edulink_hub`, rồi chạy:

```bash
php artisan migrate:fresh --seed
php artisan serve
```

API mặc định ở `http://127.0.0.1:8000/api`. Gửi token qua header `Authorization: Bearer <token>`.

## Tài khoản demo

Mật khẩu chung: `Password123!`

| Vai trò | Email |
| --- | --- |
| Doanh nghiệp | `employer@edulink.test` |
| Sinh viên | `student@edulink.test` |
| Mentor | `mentor@edulink.test` |
| Admin | `admin@edulink.test` |

## Blockchain

Mặc định `BLOCKCHAIN_MODE=mock`. Khi smart contract Devnet sẵn sàng, đổi thành `devnet` và điền `SOLANA_PROGRAM_ID` cùng `MOCK_USDC_MINT`.

Backend chỉ lưu địa chỉ ví công khai và transaction signature. Hệ thống không nhận hoặc lưu seed phrase/private key.

## Kiểm thử

```bash
php artisan test
php artisan route:list --path=api
```

Có thể import collection [Postman](docs/EduLink-Hub.postman_collection.json) và chạy lần lượt 9 request để demo toàn bộ luồng.
