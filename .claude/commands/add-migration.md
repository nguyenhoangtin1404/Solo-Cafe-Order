Tạo Supabase migration mới cho Solo Cafe Order project.

**Arguments**: $ARGUMENTS (mô tả migration, ví dụ: "add order_items table" hoặc "add is_available to products")

## Làm theo các bước sau:

1. **Kiểm tra schema hiện tại**
   - Đọc `docs/DB_SCHEMA.md` để nắm full schema
   - Đọc `supabase/schema.sql` nếu đã tồn tại

2. **Tạo file migration**
   - Path: `supabase/migrations/<timestamp>_<slug>.sql`
   - Timestamp format: `YYYYMMDDHHMMSS`
   - Slug: snake_case mô tả ngắn (e.g. `add_order_items_table`)

3. **Migration template**

```sql
-- supabase/migrations/<timestamp>_<description>.sql

-- Description: <mô tả rõ ràng migration này làm gì>

-- UP migration
<SQL statements>

-- Indexes (nếu có)
<CREATE INDEX statements>

-- RLS
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "<policy_name>" ON <table_name>
  FOR <SELECT|INSERT|UPDATE|DELETE>
  TO <anon|authenticated>
  USING (<condition>);
```

4. **Rules bắt buộc**
   - Không xóa cột có data — dùng `ALTER TABLE ... ADD COLUMN` hoặc nullable
   - Không đổi type column đang có data
   - Giá tiền luôn là `int` (VND), không dùng `decimal`/`float`
   - Bật RLS cho mọi table mới
   - Viết explicit policy — không `USING (true)` cho table sensitive
   - Thêm index cho foreign keys và columns thường dùng trong WHERE

5. **Sau khi tạo migration**
   - Cập nhật `docs/DB_SCHEMA.md` để sync với thay đổi
   - Cập nhật `types/` nếu schema thay đổi ảnh hưởng TypeScript types
   - Kiểm tra `supabase/seed.sql` có cần update không

6. **Chạy migration (local)**

```bash
supabase db reset     # reset + replay all migrations
# hoặc
supabase migration up # apply pending migrations
```
