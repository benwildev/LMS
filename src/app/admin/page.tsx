import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import {
  getSettings,
  listPayments,
  overviewStats,
  recentStudents,
  revenueByDay,
  revenueByMonth,
} from "@/lib/data";
import { num, taka } from "@/lib/format";
import Icon from "@/components/Icon";
import PillBars from "@/components/dash/PillBars";
import AreaChart from "@/components/dash/AreaChart";
import Avatars from "@/components/dash/Avatars";
import PaymentRowActions from "@/components/PaymentRowActions";
import { Avatar } from "@/components/AppShell";

export const metadata = { title: "Dashboard" };

const tk = (n: number) => `৳${num(n)}`;
const dhaka = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", ...o });

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const [s, st, waiting, months, week, fortnight, students] = await Promise.all([
    getSettings(),
    overviewStats(),
    listPayments("pending"),
    revenueByMonth(6),
    revenueByDay(7),
    revenueByDay(14),
    recentStudents(4),
  ]);
  const recent = waiting.length ? waiting : (await listPayments()).slice(0, 5);
  const weekTotal = week.reduce((a, d) => a + d.total, 0);
  const weekCount = week.reduce((a, d) => a + d.n, 0);
  const first = user.name.split(" ")[0];
  const now = new Date();
  const from = new Date(Date.now() - 29 * 86400000);
  const range = `${dhaka(from, { day: "numeric", month: "short" })} – ${dhaka(now, { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="bento">
      <div className="greet">
        <h1>
          Welcome back, <span>{first}</span>
        </h1>
        <div className="greet-tools">
          <span className="chip-pill">
            <Icon name="calendar" size={17} />
            {range}
          </span>
          <Link href="/admin/courses/new" className="chip-pill chip-action">
            <Icon name="plus" size={17} />
            New course
          </Link>
        </div>
      </div>

      <div className="b-grid b-admin">
        {/* Waiting for approval: the green card */}
        <section className="d-card area-a">
          <header className="d-head">
            <div>
              <h2>Waiting for approval</h2>
              <p>Payments to match in bKash</p>
            </div>
            <Link href="/admin/payments" className="d-arrow" aria-label="Open payments">
              <Icon name="arrow" size={18} />
            </Link>
          </header>
          <Link href="/admin/payments" className="money-card">
            <div className="mc-top">
              <b>bKash</b>
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path
                  d="M8 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M15 3.5a12 12 0 0 1 0 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="mc-label">{st.pending ? `${st.pending} waiting to check` : "Nothing waiting"}</span>
            <span className="mc-amount num">{tk(st.pendingAmount)}</span>
            <div className="mc-foot">
              <span className="num">**** {s.bkash_number.slice(-4)}</span>
              <span>{s.bkash_type}</span>
            </div>
          </Link>
        </section>

        {/* Approved this week */}
        <section className="d-card d-small area-b">
          <p className="d-label">Approved, last 7 days</p>
          <div className="d-row">
            <span className="d-big num">+{tk(weekTotal)}</span>
            <span className={`badge${weekCount ? "" : " badge-grey"}`}>
              {weekCount} {weekCount === 1 ? "payment" : "payments"}
            </span>
          </div>
        </section>

        {/* Income bars */}
        <div className="area-c">
          <PillBars
            title="Approved income"
            icon={<Icon name="card" size={18} />}
            money
            href="/admin/payments?status=approved"
            datasets={[
              { key: "m", name: "Monthly", data: months.map((m) => ({ label: m.label, total: m.total })) },
              { key: "d", name: "This week", data: week.map((d) => ({ label: dhaka(new Date(d.day + "T06:00:00Z"), { weekday: "short" }), total: d.total })) },
            ]}
          />
        </div>

        {/* Total income */}
        <section className="d-card area-d d-total">
          <header className="d-head">
            <div>
              <h2>Total income</h2>
              <p>Approved, all time</p>
            </div>
            <Link href="/admin/payments?status=approved" className="d-arrow" aria-label="Approved payments">
              <Icon name="arrow" size={18} />
            </Link>
          </header>
          <p className="d-center-label">Last 30 days {tk(st.revenue30)}</p>
          <p className="d-balance num">
            {tk(st.revenueAll)}
            <span>.00</span>
          </p>
          <div className="area-wrap">
            <AreaChart values={fortnight.map((d) => d.total)} id="adminArea" />
            <div className="split-btns">
              <Link href="/admin/payments" className="sb sb-on">
                Check payments <Icon name="up" size={15} />
              </Link>
              <Link href="/admin/courses" className="sb">
                Courses <Icon name="down" size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* Payments table */}
        <section className="d-card area-e">
          <header className="d-head">
            <div>
              <h2>{waiting.length ? "Payments to check" : "Recent payments"}</h2>
              <p>{waiting.length ? "Oldest first · approve to open the course" : "Nothing is waiting right now"}</p>
            </div>
            <Link href="/admin/payments" className="d-arrow" aria-label="All payments">
              <Icon name="arrow" size={18} />
            </Link>
          </header>
          {recent.length === 0 ? (
            <p className="empty">No payments yet. They appear here as students send them.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl d-tbl stackable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th className="num">Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recent.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="who">
                          <Avatar name={p.user_name} id={p.user_id} />
                          <div>
                            <b>{p.user_name}</b>
                            <small className="who-sub">{p.course_title}</small>
                          </div>
                        </div>
                      </td>
                      <td className="secondary">{dhaka(p.created_at, { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="secondary">{dhaka(p.created_at, { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="secondary">
                        <span className={`status s-${p.status}`}>
                          {p.status === "pending" ? "Waiting" : p.status === "approved" ? "Approved" : "Not found"}
                        </span>
                      </td>
                      <td className="num">
                        {taka(p.amount)}
                        <small className="mono-sub">{p.trx_id}</small>
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
        </section>

        {/* Students */}
        <section className="d-card area-f">
          <header className="d-head">
            <span className="d-icon">
              <Icon name="students" size={18} />
            </span>
            <div>
              <h2>Students</h2>
              <p>Accounts with at least one course</p>
            </div>
          </header>
          <div className="d-row d-row-big">
            <span className="d-balance num">{num(st.enrolled)}</span>
            <span className={`badge${students.newThisWeek ? "" : " badge-grey"}`}>+{students.newThisWeek} this week</span>
          </div>
          <div className="sub-card">
            <header className="d-head">
              <div>
                <h3>Newest students</h3>
                <p>
                  {num(students.total)} {students.total === 1 ? "account" : "accounts"} · {st.lessonsDone7} lessons passed
                  this week
                </p>
              </div>
              <Link href="/admin/students" className="d-arrow d-arrow-sm" aria-label="All students">
                <Icon name="arrow" size={16} />
              </Link>
            </header>
            {students.rows.length ? (
              <Avatars people={students.rows} more={Math.max(0, students.total - students.rows.length)} />
            ) : (
              <p className="sub">No students yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
