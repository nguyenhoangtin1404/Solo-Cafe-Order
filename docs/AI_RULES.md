# AI Rules — PHẢI TUÂN THỦ

## 1. Quy tắc chung

- AI không tự quyết kiến trúc hay nghiệp vụ
- Nếu thiếu thông tin → hỏi lại, không giả định
- Chỉ code trong phạm vi được chỉ định
- Luôn đọc `CLAUDE.md` trước khi làm bất kỳ task nào

---

## 2. Coding Rules

- Không viết business logic trong API Route (Controller)
- Service không gọi Supabase trực tiếp — qua Repository
- Một function chỉ làm một việc
- Function ≤ 50 dòng
- Class ≤ 300 dòng
- Không dùng `any` trong TypeScript
- Không dùng biến global
- Không hardcode config — dùng env vars

---

## 3. Next.js Specific

- Dùng App Router (không Pages Router)
- Server Components là mặc định — chỉ dùng `"use client"` khi cần interactivity
- Fetch data trong Server Components khi có thể
- API Routes cho mutations và protected logic
- Không mix server/client logic trong cùng 1 file

---

## 4. Supabase Specific

- `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side
- Bật RLS trên tất cả tables
- Policy phải explicit — không `USING (true)` cho protected data
- Không query Supabase trực tiếp trong Components — qua API route hoặc Server Component

---

## 5. Error Handling

- Không throw error chung chung — phải có error code
- Dùng error codes từ `docs/ERROR_HANDLING.md`
- Không log thông tin nhạy cảm (password, token, PII)
- API errors phải có format: `{ "code": "...", "message": "..." }`

---

## 6. Forbidden

- Không hardcode giá tiền, ID, URL
- Không dùng `any` hoặc `// @ts-ignore`
- Không copy code bên ngoài chưa kiểm soát
- Không commit secret hoặc `.env`
- Không tự thay đổi DB schema

---

## 7. Mandatory

- Validate input tại API Route boundary
- Handle null/undefined — không assume data luôn có
- Viết code TypeScript đủ type — không optional type khi không cần
- Mobile-first CSS (min-width breakpoints, large tap targets ≥ 44px)
