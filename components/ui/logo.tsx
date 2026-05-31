import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  xs: { mark: 24, name: "text-base",  sub: "text-[8px]"  },
  sm: { mark: 32, name: "text-lg",    sub: "text-[9px]"  },
  md: { mark: 44, name: "text-xl",    sub: "text-[10px]" },
  lg: { mark: 60, name: "text-3xl",   sub: "text-xs"     },
  xl: { mark: 80, name: "text-4xl",   sub: "text-sm"     },
};

export function Logo({
  variant = "dark",
  size = "md",
  showWordmark = true,
  className,
}: LogoProps) {
  const { mark, name, sub } = sizes[size];
  const src = variant === "dark" ? "/logo.svg" : "/logo-light.svg";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={src}
        alt="Vibe Coffee"
        width={mark}
        height={mark}
        priority
        className="shrink-0"
      />
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none gap-0.5">
          <span
            className={cn(
              "font-bold tracking-display",
              name,
              variant === "dark" ? "text-espresso" : "text-cream"
            )}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Vibe
          </span>
          <span
            className={cn(
              "font-semibold tracking-[0.18em] uppercase",
              sub,
              variant === "dark" ? "text-vibe-600" : "text-vibe-300"
            )}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Coffee
          </span>
        </div>
      )}
    </div>
  );
}

export function LogoMark({
  variant = "dark",
  size = "md",
  className,
}: Omit<LogoProps, "showWordmark">) {
  const { mark } = sizes[size];
  const src = variant === "dark" ? "/logo.svg" : "/logo-light.svg";
  return (
    <Image
      src={src}
      alt="Vibe Coffee"
      width={mark}
      height={mark}
      className={cn("shrink-0", className)}
    />
  );
}
