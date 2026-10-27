import type { PaymentStatus } from "@/lib/data";

export default function StatusPill({ status }: { status: PaymentStatus }) {
  const map = {
    pending: ["wait", "Waiting"],
    approved: ["good", "Approved"],
    rejected: ["bad", "Not found"],
  } as const;
  const [cls, label] = map[status];
  return <span className={`pill ${cls}`}>{label}</span>;
}
