import { cn } from "@/lib/utils";

export const BRAND_TITLE_CLASS = "font-bold text-secondary";
export const PAGE_TITLE_CLASS = "text-lg font-bold text-foreground";
export const HEADER_BAR_CLASS = "border-b border-border bg-card px-4 py-3";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  brand?: boolean;
  variant?: "hero" | "bar";
  sticky?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  brand = false,
  variant = "bar",
  sticky = false,
  leading,
  trailing,
  className,
}: PageHeaderProps) {
  const isHero = variant === "hero";

  return (
    <header
      className={cn(
        isHero ? "px-4 pb-3 pt-4" : HEADER_BAR_CLASS,
        sticky && "sticky top-0 z-10",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {leading}
          <div className="min-w-0">
            <h1
              className={cn(
                brand ? BRAND_TITLE_CLASS : PAGE_TITLE_CLASS,
                isHero ? "text-xl" : "truncate"
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-sm text-muted-foreground"
                suppressHydrationWarning={isHero}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </header>
  );
}
