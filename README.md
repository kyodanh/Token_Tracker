# TokenTracker

**AI Token Usage Monitor** — Theo dõi lượng token AI tiêu thụ ngay trên menu bar.

---

## Giới thiệu hệ thống

TokenTracker là ứng dụng desktop chạy trên **menu bar** (thanh trạng thái) giúp theo dõi thời gian thực lượng token và chi phí AI từ nhiều nhà cung cấp:

| Provider | Phương thức lấy dữ liệu |
|---|---|
| **Claude Code** | Đọc file log cục bộ `~/.claude/projects/**/*.jsonl` |
| **Claude Web** | Session token từ keychain |
| **OpenAI API** | OpenAI API key |
| **OpenRouter** | OpenRouter API key |
| **ChatGPT Web** | Session token từ keychain |

**Tính năng chính:**
- Hiển thị token đã dùng, chi phí USD, % sử dụng theo ngày
- Biểu đồ xu hướng chi tiêu 7 ngày gần nhất
- Nhắc nhở gia hạn subscription AI
- Cấu hình ngân sách và cảnh báo vượt mức
- Hỗ trợ nhiều tài khoản đồng thời

---

## Độ ổn định

| Nền tảng | Trạng thái |
|---|---|
| **macOS** (Apple Silicon & Intel) | ✅ Ổn định — khuyến nghị sử dụng |
| **Windows** | 🔄 Đang phát triển — cập nhật sau |

> Hiện tại chỉ hỗ trợ **macOS 13 (Ventura) trở lên**. Bản Windows sẽ được phát hành trong thời gian tới.

---

## Bảo mật & Dữ liệu

**Toàn bộ dữ liệu được lưu cục bộ trên máy — không có kết nối cloud.**

| Loại dữ liệu | Nơi lưu trữ |
|---|---|
| Database (token, chi phí, cài đặt) | `~/Library/Application Support/com.tokentracker.app/db.sqlite` |
| API keys, session tokens | macOS Keychain (mã hóa hệ thống) |
| Log Claude Code | `~/.claude/projects/` (chỉ đọc, không sao chép) |

- Không có telemetry, không gửi dữ liệu ra ngoài.
- API keys được lưu trong **Keychain** của hệ điều hành, không lưu dạng plain text.
- Xóa app là xóa toàn bộ dữ liệu.

---

## Cài đặt

Xem hướng dẫn chi tiết tại [INSTALL.md](./INSTALL.md).

**Tóm tắt nhanh (macOS):**

```bash
# 1. Tải DMG từ GitHub Releases
# 2. Kéo TokenTracker.app vào /Applications
# 3. Lần đầu mở: Right-click → Open (bỏ qua Gatekeeper)
# 4. App xuất hiện ở menu bar với icon ☕
```

---

## Hướng dẫn sử dụng

### Khởi động
Sau khi cài đặt, click icon **☕** trên menu bar để mở popup.

### Cấu hình provider
1. Click icon **☕** → **Settings** (hoặc click icon cài đặt ở popup)
2. Chọn tab **Providers**
3. Bật provider muốn theo dõi và nhập API key / session token tương ứng

### Xem số liệu hôm nay
- Popup chính hiển thị tổng token, chi phí USD, % ngân sách đã dùng
- Mỗi provider có card riêng với thanh tiến trình

### Xem xu hướng 7 ngày
- Cuộn xuống trong popup để xem biểu đồ chi tiêu tuần

### Quản lý subscription
- Tab **Subscriptions** trong Settings: thêm gói Claude Pro, ChatGPT Plus, v.v.
- App sẽ nhắc trước ngày gia hạn

### Tần suất cập nhật dữ liệu
| Provider | Chu kỳ tự động |
|---|---|
| Claude Code | Mỗi 60 giây |
| Các provider khác (API/Web) | Mỗi 5 phút |

---

## Cập nhật ứng dụng

App chưa có tính năng tự động cập nhật — kiểm tra và cài bản mới theo cách sau:

### Cách 1 — Kiểm tra thủ công trên GitHub

1. Mở trình duyệt, truy cập trang **Releases** của dự án
2. So sánh phiên bản mới nhất với phiên bản đang dùng (xem trong Settings → About)
3. Tải file `.dmg` mới về và cài đè lên bản cũ

> **Mẹo:** Thêm trang Releases vào bookmark hoặc tạo shortcut trên Desktop để kiểm tra nhanh.

### Cách 2 — Tạo Web Shortcut trên macOS (khuyến nghị)

Thêm shortcut trực tiếp lên **menu bar** hoặc **Desktop** để truy cập trang Releases bằng 1 click:

**Tạo shortcut trên Desktop:**
1. Mở **Safari** → truy cập trang Releases của dự án
2. Kéo icon 🔒 trên address bar xuống Desktop
3. Đặt tên "TokenTracker Updates"
4. Double-click file `.webloc` để mở trực tiếp

**Tạo shortcut trên Finder toolbar:**
1. Mở bất kỳ cửa sổ Finder
2. Kéo file `.webloc` vào Finder toolbar (giữ ⌘ trong lúc kéo)

**Kiểm tra phiên bản hiện tại:**
- Mở app → click icon ☕ → Settings → **About**

### Quy trình cài đặt bản mới

```
1. Tải .dmg mới từ Releases
2. Mở .dmg → kéo TokenTracker.app vào /Applications (chọn Replace)
3. Khởi động lại app từ /Applications
4. Dữ liệu cũ (database, API keys) được giữ nguyên
```

> Không cần gỡ cài đặt bản cũ trước — cài đè là đủ.

---

## Build từ source

**Yêu cầu:**
- Node.js 22+
- Rust (stable)
- Xcode Command Line Tools (macOS)

```bash
git clone <repo-url>
cd Token_Tracker/token-tracker
npm install
npm run tauri build
```

Xem script build đầy đủ tại [build.sh](./build.sh).

---

## Cấu trúc source

```
token-tracker/
├── src/                        # Frontend (React + TypeScript)
│   ├── windows/popup/          # Giao diện popup menu bar
│   ├── windows/settings/       # Cửa sổ Settings
│   ├── components/             # UI components dùng chung
│   ├── store/                  # Zustand state management
│   └── lib/                    # API bridge & types
├── src-tauri/                  # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── providers/          # Connector cho từng AI provider
│   │   ├── commands/           # Tauri commands (giao tiếp Frontend↔Backend)
│   │   ├── db.rs               # SQLite với SQLx
│   │   ├── poller.rs           # Background polling loops
│   │   ├── keychain.rs         # Lưu credentials an toàn
│   │   └── pricing.rs          # Tính chi phí token
│   └── migrations/             # SQL schema migrations
└── .github/workflows/
    └── release.yml             # CI/CD build macOS + Windows
```

**Tech stack:**

| Layer | Công nghệ |
|---|---|
| UI | React 19, TypeScript, TailwindCSS 4, Recharts |
| State | Zustand 5 |
| Desktop | Tauri 2 |
| Backend | Rust, Tokio, SQLx |
| Database | SQLite (embedded) |
| Build | Vite 7, GitHub Actions |
