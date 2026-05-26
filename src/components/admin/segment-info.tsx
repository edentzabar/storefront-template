"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const SEGMENTS = [
  { label: "VIP", description: "לקוח שהוציא 5,000 ₪ ומעלה (סכום מצטבר על פני כל ההזמנות הפעילות)." },
  { label: "חוזר", description: "ביצע 2 הזמנות פעילות לפחות." },
  { label: "חדש", description: "נרשם ב-14 הימים האחרונים." },
  { label: "בסיכון", description: "ביצע הזמנה לפחות פעם אחת, אבל לא הזמין ב-60 הימים האחרונים." },
  { label: "נטוש", description: "לא הזמין מעל 180 ימים. סיכוי גבוה שלא יחזור — שווה לפנות יזומה." },
  { label: "מנהל", description: "משתמש עם תפקיד admin (יש לו גישה לפאנל ניהול)." },
];

export function SegmentInfo() {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center justify-center size-5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        aria-label="הסבר תיוגים"
      >
        <Info className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0">
        <div className="px-4 py-3 border-b border-border">
          <div className="text-sm font-medium">איך עובדים התיוגים</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            תיוגים מחושבים אוטומטית מהיסטוריית הלקוח. אין צורך לעדכן ידנית.
          </div>
        </div>
        <ul className="divide-y divide-border max-h-[320px] overflow-y-auto">
          {SEGMENTS.map((s) => (
            <li key={s.label} className="px-4 py-2.5">
              <div className="text-xs font-medium text-foreground mb-0.5">
                {s.label}
              </div>
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                {s.description}
              </div>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground bg-muted/40">
          הספים (₪5K, 14 ימים וכו&apos;) יהיו ניתנים להגדרה דרך עמוד ההגדרות
          בעתיד.
        </div>
      </PopoverContent>
    </Popover>
  );
}
