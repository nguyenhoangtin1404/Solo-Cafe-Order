# Hướng dẫn vận hành — Dành cho Owner

## Bắt đầu ca làm việc

1. Mở trình duyệt → truy cập `https://your-cafe.vercel.app/dashboard`
2. Đăng nhập bằng email + mật khẩu
3. **Bấm banner "Bật thông báo âm thanh 🔔"** — trình duyệt chặn âm thanh tự động theo chính sách bảo mật, phải có ít nhất 1 lần tương tác trước khi hệ thống phát được tiếng beep
4. Để màn hình dashboard mở trong suốt ca — không cần reload

---

## Nhận và xử lý order

### Khi có order mới
- Màn hình phát tiếng **beep**
- Card order mới xuất hiện ở tab **"Đang chờ"** (trên cùng)
- Xem: mã đơn, tên khách, danh sách món, ghi chú

### Bắt đầu pha
- Bấm **"Bắt đầu pha ▶"** trên card
- Order chuyển sang tab **"Đang làm"**

### Hoàn thành
- Pha xong → bấm **"Đã xong ✓"**
- Gọi khách: đọc tên (pickup_name) hoặc đọc mã đơn (ví dụ: "Đơn A001")
- Card tự biến khỏi màn hình

### Huỷ đơn
- Chỉ huỷ được khi đơn còn ở **"Đang chờ"**
- Bấm nút huỷ → xác nhận → đơn bị huỷ

---

## Quản lý menu

Truy cập `/admin` để quản lý sản phẩm.

### Tắt sản phẩm hết hàng
1. Vào `/admin`
2. Tìm sản phẩm → gạt toggle **"Còn hàng"** sang tắt
3. Sản phẩm **biến khỏi menu khách ngay lập tức**
4. Khi có hàng lại → gạt lại

### Thêm sản phẩm mới
1. Bấm **"+ Thêm sản phẩm"**
2. Điền: tên, danh mục, giá (VND, không có chữ "đ"), mô tả
3. Upload ảnh (JPG/PNG/WebP, tối đa 2MB)
4. Thêm options nếu có (Size, Topping...) và extra_price cho mỗi value
5. Bấm **"Lưu sản phẩm"**

### Sửa sản phẩm
1. Bấm **"Sửa"** trên card sản phẩm
2. Chỉnh thông tin → **"Lưu"**
3. **Lưu ý**: sửa giá chỉ ảnh hưởng order MỚI — order đã đặt giữ nguyên giá cũ

### Xoá sản phẩm
- Xoá mềm — sản phẩm ẩn khỏi hệ thống nhưng lịch sử order vẫn giữ
- Nên **tắt hàng** thay vì xoá nếu chỉ tạm thời hết

---

## Mã đơn hàng (Order Code)

- Format: `A001`, `A002`... đến `A999`, rồi `B001`...
- **Reset mỗi ngày** — mỗi ngày bắt đầu lại từ A001
- Khi gọi khách: "Đơn A001 ơi!" hoặc đọc tên nếu có pickup_name

---

## Xử lý sự cố thường gặp

### Không nghe tiếng beep khi có order
→ Bấm vào banner "Bật thông báo âm thanh" ở đầu trang dashboard
→ Nếu không thấy banner: reload trang, rồi bấm bất kỳ đâu trước

### Dot realtime màu đỏ (mất kết nối)
→ Kiểm tra kết nối internet
→ Hệ thống tự reconnect sau vài giây — chờ dot chuyển xanh
→ Nếu vẫn đỏ sau 30 giây: reload trang

### Dashboard không cập nhật order mới
→ Kiểm tra dot realtime — nếu đỏ: mất kết nối
→ Reload trang để tải lại dữ liệu

### Khách nói đặt rồi nhưng không thấy order
→ Kiểm tra tab "Đang chờ" và "Tất cả"
→ Có thể khách bị rate limit (> 10 lần đặt/phút từ cùng IP) — hiếm xảy ra

### Quên mật khẩu
→ Liên hệ người setup hệ thống để reset mật khẩu qua Supabase Dashboard

---

## Cuối ca

- Không cần làm gì đặc biệt — hệ thống tự lưu tất cả
- Order code tự reset lúc 00:00 ngày hôm sau
- Có thể xem lịch sử order trong tab "Xong" / "Tất cả" trên dashboard
