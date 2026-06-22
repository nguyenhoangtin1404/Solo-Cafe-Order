"use client";

import { useEffect, useRef, useState } from "react";
import type { MenuCategory } from "@/types/menu";

interface Props {
  categories: MenuCategory[];
}

function getVisibleSectionId(categories: MenuCategory[]): string {
  for (const cat of categories) {
    const el = document.getElementById(`section-${cat.id}`);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.4 && rect.bottom > 60) {
      return cat.id;
    }
  }
  return categories[0]?.id ?? "";
}

export function CategoryTabs({ categories }: Props) {
  const [activeId, setActiveId] = useState(() => {
    if (typeof document === "undefined") return categories[0]?.id ?? "";
    return getVisibleSectionId(categories);
  });
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0])
          setActiveId(visible[0].target.id.replace("section-", ""));
      },
      { rootMargin: "-60px 0px -60% 0px", threshold: 0 }
    );

    categories.forEach((cat) => {
      const el = document.getElementById(`section-${cat.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActiveId(id);
  };

  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>(
      `[data-id="${activeId}"]`
    );
    tab?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeId]);

  return (
    <div
      ref={tabsRef}
      className="sticky top-0 z-10 flex gap-2 overflow-x-auto bg-background px-4 py-2 shadow-sm"
      style={{ scrollbarWidth: "none" }}
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-id={cat.id}
          onClick={() => scrollTo(cat.id)}
          className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors ${
            activeId === cat.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
