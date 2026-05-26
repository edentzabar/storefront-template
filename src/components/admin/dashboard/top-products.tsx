import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import type { TopProduct } from "@/lib/admin-queries";

export function TopProducts({ products }: { products: TopProduct[] }) {
  const max = Math.max(1, ...products.map((p) => p.revenue));
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-emerald-100 dark:bg-emerald-950/50 grid place-items-center">
            <TrendingUp className="size-3.5 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <div className="font-medium">המוצרים המובילים</div>
            <div className="text-xs text-muted-foreground mt-0.5">30 הימים האחרונים</div>
          </div>
        </div>
        <Link
          href="/admin/products"
          className="text-xs text-brand-accent hover:underline no-underline inline-flex items-center gap-1"
        >
          כל המוצרים
          <ArrowLeft className="size-3" />
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          עדיין לא הוזמנו מוצרים בתקופה זו.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="px-5 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors no-underline text-foreground"
              >
                <div className="text-[11px] tabular-nums text-muted-foreground w-4 text-center shrink-0">
                  #{i + 1}
                </div>
                <div className="relative size-10 rounded-md overflow-hidden bg-muted shrink-0">
                  {p.image && (
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-gradient"
                      style={{ width: `${Math.max(8, (p.revenue / max) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-sm font-semibold tabular-nums">
                    ₪{p.revenue.toLocaleString("he-IL")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {p.unitsSold} יחידות
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
