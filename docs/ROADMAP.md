# Roadmap

## Phase 1 — QR Menu MVP

**Goal**: Khách scan QR và gửi order được. Owner nhận order realtime.

### Tasks
- [ ] #1 Setup Next.js + TailwindCSS + Supabase + shadcn/ui
- [ ] #2 Setup DB schema (migrate + seed)
- [ ] #3 Build menu page (public, mobile-first)
- [ ] #4 Build product card + detail modal
- [ ] #5 Cart logic (local state + localStorage)
- [ ] #6 Submit order API (`POST /api/orders`)
- [ ] #7 Order success screen
- [ ] #8 Realtime dashboard (owner)
- [ ] #9 Order status update (`PATCH /api/orders/:id/status`)
- [ ] #10 Owner auth (Supabase Auth login page)
- [ ] #11 Deploy to Vercel

---

## Phase 2 — Operations

**Goal**: Giảm stress vận hành hàng ngày.

### Tasks
- [ ] Product availability toggle (`PATCH /api/products/:id/availability`)
- [ ] Admin panel — quản lý menu (thêm/sửa/xóa product)
- [ ] Upload ảnh món (Supabase Storage)
- [ ] Daily revenue summary
- [ ] Mobile optimization pass
- [ ] Print / share QR code

---

## Phase 3 — Loyalty

**Goal**: Tăng retention khách hàng.

### Tasks
- [ ] Customer account (optional, QR-based)
- [ ] Point system
- [ ] Voucher / discount code
- [ ] Buy X get Y
- [ ] Customer order history

---

## Phase 4 — Gamification

**Goal**: Tăng trải nghiệm và viral.

### Tasks
- [ ] Lucky wheel sau khi order
- [ ] Secret menu (unlock bằng code)
- [ ] Reward animation
- [ ] Mini game after order

---

## Out of Scope (MVP và các phase trên)

- Native mobile app
- Multi-store
- Inventory management phức tạp
- Offline sync
- Staff management
- Full accounting / ERP
- AI recommendation
