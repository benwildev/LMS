import { approvePayment, rejectPayment, reopenPayment } from "@/app/actions/admin";
import type { PaymentRow } from "@/lib/data";
import Submit from "./Submit";

export default function PaymentRowActions({ p }: { p: PaymentRow }) {
  if (p.status === "pending") {
    return (
      <div className="row-actions">
        <details className="reject">
          <summary className="btn btn-ghost btn-sm">Reject</summary>
          <form action={rejectPayment.bind(null, p.id)}>
            <input
              className="input"
              name="note"
              placeholder="Reason the student will see"
              defaultValue="TrxID not found in our bKash statement."
              aria-label="Reason"
            />
            <Submit className="btn btn-danger btn-sm" pending="…">
              Reject
            </Submit>
          </form>
        </details>
        <form action={approvePayment.bind(null, p.id)}>
          <Submit className="btn btn-sm" pending="Approving…">
            Approve
          </Submit>
        </form>
      </div>
    );
  }
  return (
    <div className="row-actions">
      <form action={reopenPayment.bind(null, p.id)}>
        <Submit className="textbtn" pending="…">
          {p.status === "approved" ? "Undo approval" : "Reopen"}
        </Submit>
      </form>
    </div>
  );
}
