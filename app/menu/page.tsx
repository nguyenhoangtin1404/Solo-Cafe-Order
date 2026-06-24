import { getMenuWithCategories } from "@/lib/services/product.service";
import { MenuView } from "@/components/menu/MenuView";
import type { MenuCategory, MenuOption, MenuProduct } from "@/types/menu";
import type { ProductWithOptions } from "@/types/product";

export const dynamic = "force-dynamic";

function hasNoEmptySelectOption(p: ProductWithOptions): boolean {
  return !p.options.some(
    (opt) => opt.type === "select" && opt.values.length === 0
  );
}

function toMenuProduct(p: ProductWithOptions): MenuProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    image_url: p.image_url,
    options: p.options
      .filter((opt) => opt.values.length > 0)
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .map(
        (opt): MenuOption => ({
          id: opt.id,
          name: opt.name,
          type: opt.type,
          values: [...opt.values]
            .sort(
              (a, b) => a.extra_price - b.extra_price || (a.id < b.id ? -1 : 1)
            )
            .map((v) => ({
              id: v.id,
              name: v.name,
              extra_price: v.extra_price,
            })),
        })
      ),
  };
}

export default async function MenuPage() {
  const raw = await getMenuWithCategories();
  const categories: MenuCategory[] = raw
    .map((cat) => ({
      id: cat.id,
      name: cat.name,
      sort_order: cat.sort_order,
      products: cat.products.filter(hasNoEmptySelectOption).map(toMenuProduct),
    }))
    .filter((cat) => cat.products.length > 0);

  if (categories.length === 0) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center"
        style={{
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <span className="text-5xl">☕</span>
        <h1 className="text-xl font-semibold">Vibe Cafe</h1>
        <p className="text-muted-foreground">
          Menu đang được cập nhật. Vui lòng quay lại sau!
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MenuView categories={categories} />
    </div>
  );
}
