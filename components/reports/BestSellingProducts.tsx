"use client";

import { AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { BestSellingProduct } from "@/lib/services/report.service";
import { useBestSellingProducts } from "@/hooks/useBestSellingProducts";
import type { DateRange } from "./DateFilter";

interface Props {
  dateRange: DateRange;
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3">
          <div className="h-5 w-6 animate-pulse rounded bg-muted" />
          <div className="h-5 flex-1 animate-pulse rounded bg-muted" />
          <div className="h-5 w-16 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function ProductTable({ products }: { products: BestSellingProduct[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th className="pb-2 pr-3 font-medium">#</th>
            <th className="pb-2 pr-3 font-medium">Sản phẩm</th>
            <th className="pb-2 pr-3 text-right font-medium">SL bán</th>
            <th className="pb-2 text-right font-medium">Doanh thu</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr key={product.name} className="border-b last:border-0">
              <td className="py-2.5 pr-3 text-muted-foreground">{index + 1}</td>
              <td className="py-2.5 pr-3 font-medium">{product.name}</td>
              <td className="py-2.5 pr-3 text-right">
                {product.quantity.toLocaleString("vi-VN")}
              </td>
              <td className="py-2.5 text-right">{formatCurrency(product.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BestSellingProducts({ dateRange }: Props) {
  const { isLoading, data, error } = useBestSellingProducts(dateRange);

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Sản phẩm bán chạy</h2>
      </div>
      <div className="p-4">
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle size={16} aria-hidden="true" />
            Không thể tải dữ liệu. Vui lòng thử lại sau.
          </div>
        ) : !data || data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Chưa có dữ liệu trong khoảng thời gian này
          </p>
        ) : (
          <ProductTable products={data} />
        )}
      </div>
    </div>
  );
}
