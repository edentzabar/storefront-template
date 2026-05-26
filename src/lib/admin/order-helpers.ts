import type { OrderStatus } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "חדשה",
  processing: "בטיפול",
  shipped: "נשלחה",
  delivered: "סופקה",
  cancelled: "בוטלה",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: "bg-brand-accent/15 text-brand-accent-dark",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-brand-bg-soft text-brand-text-soft",
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
