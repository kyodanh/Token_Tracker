# TokenTracker — Installation Guide

**Version 1.0.0** | AI Token Usage Monitor

---

## macOS

### Yêu cầu hệ thống
- macOS 13 (Ventura) trở lên
- Apple Silicon (M1/M2/M3) hoặc Intel

### Bước 1 — Tải file

| Chip | File |
|------|------|
| Apple Silicon (M1/M2/M3) | `TokenTracker_1.0.0_aarch64.dmg` |
| Intel | `TokenTracker_1.0.0_x64.dmg` |

> Không biết máy dùng chip gì? → Apple menu → About This Mac → xem mục "Chip" hoặc "Processor"

### Bước 2 — Cài đặt

1. Mở file `.dmg` vừa tải
2. Kéo **TokenTracker.app** vào thư mục **Applications**
3. Đóng cửa sổ DMG và eject nó

### Bước 3 — Mở lần đầu (bỏ qua cảnh báo Gatekeeper)

Vì app chưa được notarize với Apple, macOS sẽ chặn lần đầu mở. Làm như sau:

**Cách A (khuyến nghị):**
1. Mở **Finder** → **Applications**
2. **Right-click** (hoặc Ctrl+click) vào **TokenTracker**
3. Chọn **Open**
4. Trong dialog hiện ra, bấm **Open**
5. Từ lần sau, mở bình thường bằng double-click

**Cách B (Terminal):**
```bash
xattr -d com.apple.quarantine /Applications/TokenTracker.app
```

### Bước 4 — Chạy ứng dụng

- App chạy ở **Menu Bar** (thanh trên cùng màn hình)
- Tìm icon **☕** hoặc icon TokenTracker ở góc phải menu bar
- Click vào icon để mở popup theo dõi token

### Gỡ cài đặt

Kéo `TokenTracker.app` từ Applications vào Trash.  
Xóa data: `~/Library/Application Support/com.tokentracker.app/`

---

## Windows

### Yêu cầu hệ thống
- Windows 10 (1903) hoặc Windows 11
- Kiến trúc 64-bit (x64)
- [Microsoft Visual C++ Redistributable](https://aka.ms/vs/17/release/vc_redist.x64.exe) (thường đã có sẵn)

### Bước 1 — Tải file

Tải file: `TokenTracker_1.0.0_x64-setup.exe`

### Bước 2 — Cài đặt

1. Chạy file `TokenTracker_1.0.0_x64-setup.exe`
2. Nếu xuất hiện **"Windows protected your PC"** (SmartScreen):
   - Bấm **"More info"**
   - Bấm **"Run anyway"**
3. Chọn **"Install for all users"** (cần quyền Admin) hoặc **"Install for me only"**
4. Bấm **Install** → đợi hoàn tất → bấm **Finish**

### Bước 3 — Chạy ứng dụng

- App tự động khởi chạy sau khi cài
- Tìm icon TokenTracker ở **System Tray** (góc dưới phải taskbar, có thể cần bấm mũi tên `^` để thấy)
- Click vào icon để mở popup theo dõi token
- App tự động chạy khi khởi động Windows

### Gỡ cài đặt

**Settings** → **Apps** → **Installed apps** → tìm **TokenTracker** → **Uninstall**

---

## Build từ source

### Yêu cầu
- [Node.js 18+](https://nodejs.org/)
- [Rust (stable)](https://rustup.rs/)
- [Tauri prerequisites](https://tauri.app/start/prerequisites/)

### macOS

```bash
# Clone repo
git clone <repo-url>
cd Token_Tracker

# Build arm64 (Apple Silicon)
./build.sh aarch64-apple-darwin

# Build x64 (Intel)
./build.sh x86_64-apple-darwin
```

Output: `token-tracker/src-tauri/target/<target>/release/bundle/dmg/`

### Windows

Trên máy Windows hoặc qua GitHub Actions:

```powershell
cd token-tracker
npm ci
npm run tauri build -- --target x86_64-pc-windows-msvc
```

Output: `token-tracker\src-tauri\target\x86_64-pc-windows-msvc\release\bundle\nsis\`

### GitHub Actions (Release tự động)

Push tag để kích hoạt build tự động cho cả 3 platform:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Workflow `.github/workflows/release.yml` sẽ tạo Draft Release với đủ 3 file:
- `TokenTracker_1.0.0_aarch64.dmg` (macOS Apple Silicon)
- `TokenTracker_1.0.0_x64.dmg` (macOS Intel)
- `TokenTracker_1.0.0_x64-setup.exe` (Windows)

---

## Troubleshooting

### macOS: "damaged and can't be opened"
```bash
xattr -c /Applications/TokenTracker.app
```

### macOS: App không hiện ở menu bar
- Kiểm tra menu bar không bị ẩn icon (kéo thanh separator)
- Khởi động lại: `pkill TokenTracker && open /Applications/TokenTracker.app`

### Windows: App không hiện ở system tray
- Bấm mũi tên `^` ở system tray để xem hidden icons
- Kiểm tra Task Manager xem process `TokenTracker.exe` có chạy không

### Lỗi database / data bị hỏng

**macOS:** Xóa `~/Library/Application Support/com.tokentracker.app/`  
**Windows:** Xóa `%APPDATA%\com.tokentracker.app\`
