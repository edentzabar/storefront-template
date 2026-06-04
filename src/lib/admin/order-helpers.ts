import type { OrderStatus } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "חדשה",
  processing: "בטיפול",
  shipped: "נשלחה",
  delivered: "סופקה",
  cancelled: "בוטלה",
};

// Semi-transparent backgrounds keep these readable on both the bright
// admin theme and the dark theme without needing a separate dark variant
// per swatch (10% opacity on a dark bg = subtle tint, on white = soft pastel).
export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-brand-accent/15 text-brand-accent-dark dark:text-brand-accent-light",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  shipped: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  delivered: "bg-green-500/10 text-green-700 dark:text-green-300",
  cancelled: "bg-muted text-muted-foreground",
};

export const SHIPPING_LABELS = {
  standard: "משלוח רגיל",
  express: "אקספרס 24 שעות",
  pickup: "איסוף עצמי",
};

export const PAYMENT_LABELS = {
  card: "כרטיס אשראי",
  bit: "Bit",
  applepay: "Apple Pay",
  googlepay: "Google Pay",
};
