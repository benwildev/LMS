import Link from "next/link";
import { listPayments, paymentCounts, type PaymentStatus } from "@/lib/data";
import { ago, num, taka, when } from "@/lib/format";
import PaymentRowActions from "@/components/PaymentRowActions";
import StatusPill from "@/components/StatusPill";
import { Avatar } from "@/components/AppShell";

export const metadata = { title: "Payments" };

const TABS: { key: PaymentStatus | "all"; label: string }[] = [
  { key: "pending", label: "Waiting" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Not found" },
  { key: "all", label: "All" },
];

export default async function Payments({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const status = (TABS.find((t) => t.key === searchParams.status)?.key ?? "pending") as PaymentStatus | "all";
  const q = (searchParams.q || "").trim();
  const rows = await listPayments(status === "all" ? undefined : status, q || undefined);
  const counts = await paymentCounts();
  const countFor = (k: string) =>
    k === "all" ? counts.pending + counts.approved + counts.rejected : counts[k as PaymentStatus];
  const total = rows.reduce((a, r) => a + r.amount, 0);

  return (
    <>
      <div className="title-row">
        <div>
          <h1>Payments</h1>
          <p>Match each Transaction ID in your bKash statement, then approve it to open the course.</p>
        </div>
      </div>
      <nav className="tabs" aria-label="Payment status">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/payments?status=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={status === t.key ? "on" : ""}
          >
            {t.label}
            <span className="num">{num(countFor(t.key))}</span>
          </Link>
        ))}
      </nav>
      <div className="toolbar">
        <form>
          <input type="hidden" name="status" value={status} />
          <input className="input" type="search" name="q" defaultValue={q} placeholder="Search TrxID, number, name or course" />
        </form>
        <span className="count-note num">
          {rows.length} {rows.length === 1 ? "payment" : "payments"} · ৳{num(total)}
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="empty">
          {q ? `No payments match “${q}”.` : status === "pending" ? "Nothing waiting. Every payment has been checked." : "No payments here yet."}
        </p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl stackable">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>TrxID</th>
                <th>Sent from</th>
                <th className="num">Amount</th>
                <th className="num">Sent</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="who">
                      <Avatar name={p.user_name} id={p.user_id} />
                      <div>
                        <b>{p.user_name}</b>
                        <small>{p.user_email}</small>
                      </div>
                    </div>
                  </td>
                  <td className="secondary">{p.course_title}</td>
                  <td className="secondary">
                    <span className="mono">{p.trx_id}</span>
                  </td>
                  <td className="secondary num">{p.sender_number}</td>
                  <td className="num">
                    ৳{num(p.amount)}
                    {p.amount !== p.course_price && <small className="flag">Price now {taka(p.course_price)}</small>}
                  </td>
                  <td className="num secondary">
                    {when(p.created_at)}
                    <small>{ago(p.created_at)}</small>
                  </td>
                  <td className="secondary">
                    <StatusPill status={p.status} />
                    {p.admin_note && <small>{p.admin_note}</small>}
                  </td>
                  <td className="actions-cell">
                    <PaymentRowActions p={p} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
