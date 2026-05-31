import { Logo } from "@/components/ui/logo";

// ─── Data ────────────────────────────────────────────────────────────────────

const palette = [
  { group: "Coffee Heritage", swatches: [
    { name: "Espresso",   hex: "#1C0A00", bg: "bg-[#1C0A00]",   text: "text-white" },
    { name: "Roast",      hex: "#3D1C02", bg: "bg-vibe-950",    text: "text-white" },
    { name: "Caramel",    hex: "#C87941", bg: "bg-vibe-600",    text: "text-white" },
    { name: "Amber",      hex: "#E8A020", bg: "bg-vibe-500",    text: "text-white" },
    { name: "Cream",      hex: "#FEF3DC", bg: "bg-cream border border-border", text: "text-espresso" },
  ]},
  { group: "Clean AI", swatches: [
    { name: "Surface",    hex: "#FFFFFF", bg: "bg-white border border-border",   text: "text-gray-900" },
    { name: "Muted",      hex: "#F9FAFB", bg: "bg-surface-muted border border-border", text: "text-gray-900" },
    { name: "Border",     hex: "#E5E7EB", bg: "bg-border",       text: "text-gray-900" },
    { name: "AI Violet",  hex: "#7C3AED", bg: "bg-ai",           text: "text-white" },
  ]},
  { group: "Semantic", swatches: [
    { name: "Coral (CTA)", hex: "#E8543A", bg: "bg-coral",   text: "text-white" },
    { name: "Matcha",      hex: "#2D6A4F", bg: "bg-matcha",  text: "text-white" },
  ]},
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BrandPage() {
  return (
    <div className="min-h-screen bg-surface">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Logo size="sm" />
          <span className="label-section">Brand Identity</span>
          <span className="badge-ai">v1.0</span>
        </div>
      </header>

      {/* ── Hero — Two worlds collide ── */}
      <section className="relative overflow-hidden">
        {/* Split background */}
        <div className="absolute inset-0 flex">
          <div className="w-1/2 bg-[#1C0A00]" />
          <div className="w-1/2 bg-white bg-dots" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left — Heritage */}
            <div>
              <Logo variant="light" size="lg" className="mb-8" />
              <h1
                className="text-5xl md:text-6xl font-bold text-cream leading-[1.05] tracking-display"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Phin.<br />
                Prompt.<br />
                <span className="text-vibe-600">Pickup.</span>
              </h1>
              <p className="mt-6 text-vibe-300 text-lg">
                Cà phê truyền thống,<br />đặt hàng thông minh.
              </p>
            </div>

            {/* Right — AI */}
            <div className="flex flex-col gap-5">
              {/* Order tracking card mock */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="label-section">Đơn hàng của bạn</span>
                  <span className="badge-ai">AI-powered</span>
                </div>
                <div className="flex items-end gap-4 mb-5">
                  <span className="order-code text-6xl text-espresso">A042</span>
                  <span className="badge-making mb-2">● Đang pha</span>
                </div>
                <div className="bg-surface-muted rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-mono mb-1">Thời gian chờ</p>
                    <p className="font-display font-bold text-espresso">9 – 12 phút</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-vibe-100 flex items-center justify-center">
                    <SignalIcon />
                  </div>
                </div>
              </div>

              {/* Menu item card mock */}
              <div className="card-hover p-5 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl gradient-caramel shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-espresso truncate">Cà phê sữa đá</p>
                  <p className="text-sm text-gray-500">Phin truyền thống · Sữa đặc</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-vibe-600">35.000₫</p>
                  <button className="btn-primary text-xs px-3 py-1.5 mt-1" style={{minHeight: "unset"}}>
                    + Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6">

        {/* ── Palette ── */}
        <Section label="Palette" title="Bảng màu thương hiệu">
          <div className="space-y-8">
            {palette.map((group) => (
              <div key={group.group}>
                <p className="label-section mb-3">{group.group}</p>
                <div className="flex flex-wrap gap-3">
                  {group.swatches.map((s) => (
                    <div key={s.name} className="flex flex-col gap-2 w-[100px]">
                      <div className={`h-16 rounded-xl ${s.bg} shadow-card`} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{s.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{s.hex}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="divider" />

        {/* ── Typography ── */}
        <Section label="Type" title="Typography system">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-8">
              <p className="label-section mb-6">Display — Space Grotesk</p>
              <p
                className="text-6xl font-bold text-espresso leading-none mb-3"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              >
                Aa
              </p>
              <p
                className="text-3xl font-bold text-espresso mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Phin meets AI.
              </p>
              <p
                className="text-xl font-medium text-vibe-600"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Cà phê ngon. Đặt hàng thông minh.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Regular", "Medium", "SemiBold", "Bold"].map((w) => (
                  <span key={w} className="chip">{w}</span>
                ))}
              </div>
            </div>

            <div className="card p-8">
              <p className="label-section mb-6">Body — Plus Jakarta Sans</p>
              <p className="text-5xl font-bold text-gray-800 mb-3">Aa</p>
              <p className="text-base text-gray-700 leading-relaxed mb-4">
                Quét QR, chọn đồ yêu thích, gửi đơn và nhận thông
                báo khi cà phê của bạn sẵn sàng. Đơn giản vậy thôi.
              </p>
              <p className="font-mono text-sm text-gray-500 bg-surface-muted px-3 py-2 rounded-lg">
                ORDER_CODE = &quot;A042&quot;
              </p>
            </div>
          </div>

          {/* Type scale */}
          <div className="card p-8 mt-6">
            <p className="label-section mb-6">Type Scale</p>
            <div className="space-y-3 divide-y divide-border">
              {[
                { label: "Display", cls: "text-5xl font-bold", text: "Vibe Coffee" },
                { label: "H1",      cls: "text-4xl font-bold", text: "Menu hôm nay" },
                { label: "H2",      cls: "text-3xl font-bold", text: "Cà phê & Đồ uống" },
                { label: "H3",      cls: "text-2xl font-bold", text: "Cà phê sữa đá" },
                { label: "Body",    cls: "text-base",           text: "Đặt hàng và nhận ngay tại quầy" },
                { label: "Small",   cls: "text-sm text-gray-500", text: "Thời gian chờ: 9 phút" },
              ].map(({ label, cls, text }) => (
                <div key={label} className="flex items-baseline gap-6 py-3 first:pt-0">
                  <span className="label-section w-14 shrink-0">{label}</span>
                  <span
                    className={`${cls} text-gray-900 tracking-display font-display`}
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <div className="divider" />

        {/* ── Logo ── */}
        <Section label="Logo" title="Logo & Mark">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-[#1C0A00] p-10 flex flex-col items-center gap-6">
              <Logo variant="light" size="xl" showWordmark={false} />
              <Logo variant="light" size="sm" />
            </div>
            <div className="rounded-2xl bg-cream border border-border p-10 flex flex-col items-center gap-6">
              <Logo variant="light" size="xl" showWordmark={false} />
              <Logo variant="dark" size="sm" />
            </div>
            <div className="rounded-2xl bg-surface-muted bg-dots border border-border p-10 flex flex-col items-center gap-6">
              <Logo size="xl" showWordmark={false} />
              <Logo size="sm" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-5">
            {(["xs", "sm", "md", "lg"] as const).map((s) => (
              <div key={s} className="card p-5 flex flex-col items-center gap-3">
                <Logo size={s} showWordmark={false} />
                <span className="label-section">{s.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </Section>

        <div className="divider" />

        {/* ── Components ── */}
        <Section label="Components" title="UI Components">

          {/* Buttons */}
          <div className="card p-7 mb-5">
            <p className="label-section mb-5">Buttons</p>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary">Đặt hàng</button>
              <button className="btn-brand">Xem menu</button>
              <button className="btn-caramel">Xác nhận</button>
              <button className="btn-outline">Huỷ đơn</button>
              <button className="btn-ghost">Thêm vào giỏ</button>
            </div>
          </div>

          {/* Badges */}
          <div className="card p-7 mb-5">
            <p className="label-section mb-5">Status Badges</p>
            <div className="flex flex-wrap gap-3">
              <span className="badge-new">● Mới</span>
              <span className="badge-making">● Đang pha</span>
              <span className="badge-done">● Xong</span>
              <span className="badge-cancelled">● Đã huỷ</span>
              <span className="badge-ai">✦ AI-powered</span>
            </div>
          </div>

          {/* Inputs */}
          <div className="card p-7 mb-5">
            <p className="label-section mb-5">Form Inputs</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên lấy đồ</label>
                <input className="input" placeholder="VD: Minh, Anh Tú, Cô Ba..." />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Ghi chú</label>
                <input className="input" placeholder="Ít đường, nhiều đá, không đường..." />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {/* Menu card */}
            <div className="card-hover p-5">
              <div className="h-32 rounded-xl gradient-caramel mb-4" />
              <span className="badge-new mb-2 inline-block">Mới</span>
              <h3 className="font-display font-bold text-espresso">Cà phê sữa đá</h3>
              <p className="text-sm text-gray-500 mt-0.5 mb-3">Phin truyền thống</p>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-vibe-600 text-lg">35.000₫</span>
                <button className="btn-caramel text-xs px-3 py-1.5" style={{minHeight:"unset"}}>+ Thêm</button>
              </div>
            </div>

            {/* Order tracking card */}
            <div className="card p-5 bg-[#1C0A00]">
              <p className="text-vibe-400 text-xs font-mono mb-1">Đơn của bạn</p>
              <p className="font-display font-bold text-cream text-5xl tracking-display mb-1">A042</p>
              <p className="text-vibe-300 text-sm mb-4">Chờ khoảng 9 – 12 phút</p>
              <div className="flex items-center gap-2">
                <span className="badge bg-vibe-900 text-vibe-300 border-vibe-800">● Đang pha</span>
              </div>
            </div>

            {/* AI insight card */}
            <div className="card p-5 border-ai-light">
              <div className="flex items-center gap-2 mb-4">
                <span className="h-8 w-8 rounded-lg bg-ai-light flex items-center justify-center text-ai text-sm font-bold">✦</span>
                <span className="label-section">AI Insight</span>
              </div>
              <p className="font-display font-bold text-espresso mb-1">Giờ cao điểm</p>
              <p className="text-sm text-gray-500 mb-3">Hiện có 8 đơn đang chờ. Thời gian pha ~24 phút.</p>
              <div className="flex gap-1.5">
                {[70, 90, 45, 100, 85, 60].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-ai opacity-70"
                    style={{ height: `${h * 0.4}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        <div className="divider" />

        {/* ── Concept ── */}
        <Section label="Concept" title="Hai thế giới, một thương hiệu">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-[#1C0A00] p-8">
              <p className="text-vibe-600 text-xs font-mono mb-4 uppercase tracking-widest">Heritage</p>
              <h3 className="font-display text-3xl text-cream mb-3">Phin truyền thống</h3>
              <p className="text-vibe-300 leading-relaxed">
                Cà phê phin Việt — nhỏ từng giọt, đậm đà, chân thực.
                Hương vị không thay đổi qua bao thế hệ.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Phin filter", "Cà phê sữa", "Bạc xỉu", "Cốt dừa"].map(t => (
                  <span key={t} className="chip bg-vibe-900 border-vibe-800 text-vibe-300">{t}</span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-surface-muted bg-dots border border-border p-8">
              <p className="text-ai text-xs font-mono mb-4 uppercase tracking-widest">AI-first</p>
              <h3 className="font-display text-3xl text-espresso mb-3">Đặt hàng thông minh</h3>
              <p className="text-gray-500 leading-relaxed">
                QR scan → gửi order → AI ước tính thời gian chờ →
                realtime tracking. Không app, không đăng ký.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["QR order", "Realtime", "AI estimate", "No app"].map(t => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
            </div>
          </div>
        </Section>

      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-border mt-16 py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="label-section">
            Phin. Prompt. Pickup. — Brand Identity System v1.0
          </p>
          <span className="badge-ai">AI × Vietnamese Cafe</span>
        </div>
      </footer>

    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ label, title, children }: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-14">
      <p className="label-section mb-2">{label}</p>
      <h2
        className="text-3xl font-bold text-espresso mb-8 tracking-display"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Signal Icon (inline) ─────────────────────────────────────────────────────

function SignalIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 text-vibe-600">
      <path d="M2 16 Q10 4 18 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <path d="M5 16 Q10 7 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
      <path d="M8 16 Q10 10 12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="10" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  );
}
