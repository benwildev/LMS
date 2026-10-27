import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSettings, paymentsForUser } from "@/lib/data";
import { num, when } from "@/lib/format";
import StatusPill from "@/components/StatusPill";

export const metadata = { title: "Payments" };

export default async function StudentPayments() {
  const user = await requireUser("/dashboard/payments");
  const [s, payments] = await Promise.all([getSettings(), paymentsForUser(user.id)]);
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Payments</h1>
          <p>
            bKash Send Money to {s.bkash_number} ({s.bkash_type}). We check each one by hand.
          </p>
        </div>
      </div>
      {payments.length === 0 ? (
        <p className="empty">
          You haven’t sent a payment yet. <Link className="textbtn" href="/#courses">Browse courses</Link>
        </p>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl stackable">
            <thead>
              <tr>
                <th>Course</th>
                <th>TrxID</th>
                <th>Sent</th>
                <th className="num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b style={{ fontWeight: 600 }}>{p.course_title}</b>
                    <small>From {p.sender_number}</small>
                  </td>
                  <td className="secondary">
                    <span className="mono">{p.trx_id}</span>
                  </td>
                  <td className="secondary">{when(p.created_at)}</td>
                  <td className="num">৳{num(p.amount)}</td>
                  <td className="secondary">
                    <StatusPill status={p.status} />
                    {p.status === "rejected" && (
                      <small>
                        {p.admin_note}{" "}
                        <Link className="textbtn" href={`/checkout/${p.course_slug}`}>
                          Send again
                        </Link>
                      </small>
                    )}
                    {p.status === "approved" && (
                      <small>
                        <Link className="textbtn" href={`/learn/${p.course_slug}`}>
                          Open course
                        </Link>
                      </small>
                    )}
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
