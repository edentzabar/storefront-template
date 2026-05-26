import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowLeft } from "lucide-react";

type Product = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  stock: number;
  image: string;
};

export function LowStockList({ products }: { products: Product[] }) {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-amber-100 dark:bg-amber-950/50 grid place-items-center">
            <AlertTriangle className="size-3.5 text-amber-700 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-medium">מלאי נמוך</div>
            <div className="text-xs text-muted-foreground mt-0.5">5 יחידות או פחות</div>
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
          כל המוצרים במלאי תקין. 🎉
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {products.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/products/${p.id}/edit`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors no-underline text-foreground"
              >
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
                  <div className="text-[11px] text-muted-foreground truncate">{p.sku}</div>
                </div>
                <div className="text-sm tabular-nums shrink-0">
                  <span
                    className={
                      p.stock === 0
                        ? "text-rose-600 font-semibold"
                        : "text-amber-700 dark:text-amber-400 font-medium"
                    }
                  >
                    {p.stock}
                  </span>
                  <span className="text-muted-foreground text-[11px] mr-1">במלאי</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
