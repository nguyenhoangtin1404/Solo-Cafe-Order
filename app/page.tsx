import Image from "next/image";
import { Logo } from "@/components/ui/logo";

// ─── Color Swatches Data ─────────────────────────────────────────────────────

const palette = [
  { name: "Espresso",   hex: "#1C0A00", tw: "bg-[#1C0A00]",   light: true },
  { name: "Roast",      hex: "#3D1C02", tw: "bg-vibe-950",     light: true },
  { name: "Warm Brown", hex: "#7A4118", tw: "bg-vibe-800",     light: true },
  { name: "Caramel",    hex: "#C87941", tw: "bg-vibe-600",     light: false },
  { name: "Honey",      hex: "#E8A020", tw: "bg-vibe-500",     light: false },
  { name: "Cream",      hex: "#FEF3DC", tw: "bg-vibe-100",     light: false },
  { name: "Foam",       hex: "#FAFAF5", tw: "bg-foam border border-vibe-100", light: false },
  { name: "Coral",      hex: "#E8543A", tw: "bg-coral",        light: true },
  { name: "Matcha",     hex: "#2D6A4F", tw: "bg-matcha",       light: true },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <main className="min-h-screen bg-foam">

      {/* ── Hero ── */}
      <section className="gradient-brand relative overflow-hidden">
        <div className="absolute inset-0 opacity-5"
             style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #C87941 0%, transparent 60%), radial-gradient(circle at 80% 20%, #E8A020 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-5xl px-6 py-24 text-center">
          <Logo variant="light" size="xl" className="justify-center mb-10" />
          <h1 className="font-display text-5xl md:text-7xl font-bold text-cream mb-4">
            Vibe Coffee
          </h1>
          <p className="text-vibe-300 text-xl md:text-2xl font-light tracking-wide mb-2">
            Chill. Order. Sip.
          </p>
          <p className="text-vibe-400 mt-4 max-w-md mx-auto">
            Quét QR → Chọn đồ → Gửi order → Nhận thông báo khi xong.
            Đơn giản vậy thôi.
          </p>
          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <button className="btn-primary">Xem Menu</button>
            <button className="btn border-2 border-cream text-cream px-6 py-3 rounded-xl font-semibold hover:bg-cream hover:text-vibe-950 transition-all">
              Đặt ngay
            </button>
          </div>
        </div>
      </section>

      {/* ── Brand Colors ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel>Palette</SectionLabel>
        <h2 className="mb-8">Bảng màu thương hiệu</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {palette.map((swatch) => (
            <div key={swatch.name} className="flex flex-col gap-2">
              <div className={`h-20 rounded-2xl ${swatch.tw} shadow-card`} />
              <div>
                <p className="text-sm font-semibold text-espresso">{swatch.name}</p>
                <p className="text-xs text-vibe-500 font-mono">{swatch.hex}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6 my-0" />

      {/* ── Typography ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel>Typography</SectionLabel>
        <h2 className="mb-10">Kiểu chữ</h2>
        <div className="grid md:grid-cols-2 gap-10">
          <div className="card p-8">
            <p className="text-xs text-vibe-400 font-mono mb-4 tracking-wider uppercase">Display — Playfair Display</p>
            <p style={{ fontFamily: "var(--font-display)" }}
               className="text-5xl font-bold text-espresso leading-tight">
              Sip the<br />
              <span className="text-vibe-600">Vibe.</span>
            </p>
            <p style={{ fontFamily: "var(--font-display)" }}
               className="text-2xl font-normal text-vibe-700 mt-4">
              Phong cách. Hương vị. Cảm giác.
            </p>
          </div>
          <div className="card p-8">
            <p className="text-xs text-vibe-400 font-mono mb-4 tracking-wider uppercase">Body — Plus Jakarta Sans</p>
            <p className="text-4xl font-bold text-espresso">Aa Bb Cc</p>
            <p className="text-lg text-vibe-700 mt-3 leading-relaxed">
              Cà phê ngon, phục vụ nhanh.<br />
              Quét QR và thưởng thức.
            </p>
            <p className="text-sm text-vibe-500 mt-4">
              Regular · Medium · SemiBold · Bold
            </p>
          </div>
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6 my-0" />

      {/* ── Logo Variants ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel>Logo</SectionLabel>
        <h2 className="mb-10">Logo & Mark</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Dark background */}
          <div className="rounded-3xl bg-vibe-950 flex flex-col items-center justify-center gap-6 p-10">
            <Logo variant="light" size="xl" showWordmark={false} />
            <Logo variant="light" size="md" />
          </div>
          {/* Cream background */}
          <div className="rounded-3xl bg-cream border border-vibe-200 flex flex-col items-center justify-center gap-6 p-10">
            <Logo variant="light" size="xl" showWordmark={false} />
            <Logo variant="dark" size="md" />
          </div>
          {/* Gradient background */}
          <div className="rounded-3xl bg-vibe-gradient flex flex-col items-center justify-center gap-6 p-10">
            <Logo variant="light" size="xl" showWordmark={false} />
            <Logo variant="light" size="md" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {(["sm", "md", "lg"] as const).map((s) => (
            <div key={s} className="card p-6 flex flex-col items-center gap-3">
              <Logo size={s} />
              <span className="text-xs text-vibe-400 font-mono">{s.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="divider max-w-5xl mx-auto px-6 my-0" />

      {/* ── UI Components ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <SectionLabel>Components</SectionLabel>
        <h2 className="mb-10">Thành phần giao diện</h2>

        {/* Buttons */}
        <div className="card p-8 mb-6">
          <p className="text-sm font-semibold text-vibe-500 mb-6 uppercase tracking-wider">Buttons</p>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary">Đặt hàng</button>
            <button className="btn-brand">Xem menu</button>
            <button className="btn-outline">Huỷ đơn</button>
            <button className="btn-ghost">Thêm vào giỏ</button>
            <button className="btn-primary opacity-50 cursor-not-allowed">Disabled</button>
          </div>
        </div>

        {/* Badges */}
        <div className="card p-8 mb-6">
          <p className="text-sm font-semibold text-vibe-500 mb-6 uppercase tracking-wider">Order Status Badges</p>
          <div className="flex flex-wrap gap-3">
            <span className="badge-new">● Mới</span>
            <span className="badge-making">● Đang pha</span>
            <span className="badge-done">● Xong</span>
            <span className="badge-cancelled">● Huỷ</span>
          </div>
        </div>

        {/* Input */}
        <div className="card p-8 mb-6">
          <p className="text-sm font-semibold text-vibe-500 mb-6 uppercase tracking-wider">Inputs</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-espresso">Tên lấy đồ</label>
              <input className="input" placeholder="VD: Minh, Anh Tú..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-espresso">Ghi chú</label>
              <input className="input" placeholder="Ít đường, nhiều đá..." />
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card-hover p-6 cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-bold text-espresso">Cà phê sữa đá</h3>
                <p className="text-sm text-vibe-500">Cà phê phin truyền thống</p>
              </div>
              <span className="badge-new">Mới</span>
            </div>
            <p className="text-2xl font-bold text-vibe-600">35.000₫</p>
          </div>
          <div className="rounded-3xl bg-vibe-gradient p-6 text-cream">
            <p className="text-vibe-300 text-sm mb-1">Đơn hàng</p>
            <p className="font-display text-4xl font-bold mb-1">A042</p>
            <p className="text-vibe-200 text-sm">Chờ khoảng 9–12 phút</p>
            <div className="mt-4 flex gap-2">
              <span className="badge bg-vibe-800 text-vibe-200">● Đang pha</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-vibe-950 mt-16 py-12">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo variant="light" size="sm" />
          <div className="text-center md:text-right">
            <p className="text-vibe-400 text-sm">Brand Identity System</p>
            <p className="text-vibe-600 text-xs mt-1">Vibe Coffee © 2024</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-vibe-200 max-w-[2rem]" />
      <span className="text-xs font-mono font-semibold text-vibe-400 uppercase tracking-widest">
        {children}
      </span>
    </div>
  );
}
