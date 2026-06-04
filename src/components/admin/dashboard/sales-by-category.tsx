type CategorySales = {
  id: string;
  name: string;
  revenue: number;
  unitsSold: number;
};

function fmtIls(value: number) {
  return `₪${Math.round(value).toLocaleString("he-IL")}`;
}

/**
 * Sales-by-category breakdown — was the other unique block on the
 * removed /admin/reports page. Folded into the dashboard so the
 * merchant still sees which categories drive revenue at a glance.
 */
export function SalesByCategoryList({ categories }: { categories: CategorySales[] }) {
  const totalRev = categories.reduce((s, c) => s + c.revenue, 0);
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="mb-4">
        <div className="font-medium">מכירות לפי קטגוריה</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          פילוח ההכנסות
        </div>
      </div>
      {categories.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          אין מכירות בתקופה זו.
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const pct = totalRev ? (cat.revenue / totalRev) * 100 : 0;
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground">
                      {fmtIls(cat.revenue)}
                    </span>{" "}
                    · {cat.unitsSold} יחידות · {pct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-gradient"
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
