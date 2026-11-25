export const BILL_CATEGORIES = [
  "Mortgage/Rent", "Utilities", "Insurance", "Car", "Phone/Internet", "Subscriptions",
  "Groceries", "Childcare", "Debt", "Healthcare", "Savings", "Other",
];

export const STATUSES = [
  { value: "idea", label: "Idea", cls: "bg-stone-100 text-stone-700" },
  { value: "planned", label: "Planned", cls: "bg-sky-100 text-sky-800" },
  { value: "in_progress", label: "In progress", cls: "bg-amber-100 text-amber-800" },
  { value: "done", label: "Done", cls: "bg-brand-100 text-brand-700" },
] as const;

export const PRIORITIES = [
  { value: 1, label: "High" },
  { value: 2, label: "Medium" },
  { value: 3, label: "Low" },
];
