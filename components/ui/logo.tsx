import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
}

const sizes = {
  sm: { mark: 32, text: "text-lg" },
  md: { mark: 44, text: "text-2xl" },
  lg: { mark: 64, text: "text-3xl" },
  xl: { mark: 96, text: "text-4xl" },
};

export function Logo({
  variant = "dark",
  size = "md",
  showWordmark = true,
  className,
}: LogoProps) {
  const { mark, text } = sizes[size];
  const src = variant === "dark" ? "/logo.svg" : "/logo-light.svg";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src={src}
        alt="Vibe Coffee logo"
        width={mark}
        height={mark}
        priority
        className="shrink-0"
      />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-tight",
              text,
              variant === "dark" ? "text-espresso" : "text-cream"
            )}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Vibe
          </span>
          <span
            className={cn(
              "font-medium tracking-[0.2em] uppercase",
              size === "sm" ? "text-[9px]" : "text-xs",
              variant === "dark" ? "text-vibe-600" : "text-vibe-300"
            )}
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
