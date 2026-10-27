import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseBySlug, getSettings, isEnrolled, pendingPaymentFor } from "@/lib/data";
import { taka } from "@/lib/format";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CopyButton from "@/components/CopyButton";
import CheckoutForm from "./CheckoutForm";

export const metadata = { title: "Pay with bKash" };

export default async function Checkout({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  if (!course || !course.published) notFound();
  const user = await requireUser(`/checkout/${params.slug}`);
  if (course.price === 0) redirect(`/courses/${course.slug}`);
  if (user.role === "admin" || await isEnrolled(user.id, course.id)) redirect(`/learn/${course.slug}`);
  const s = await getSettings();
  const pending = await pendingPaymentFor(user.id, course.id);

  return (
    <>
      <SiteHeader siteName={s.site_name} user={user} />
      <main className="page">
        <section className="grid12 split">
          <div className="split-left">
            <h1 className="page-title">Pay {taka(course.price)} by bKash</h1>
            <p className="lead">
              For <Link className="link" href={`/courses/${course.slug}`}>{course.title}</Link>.
            </p>
            <div className="bkash-box">
              <span>
                Send Money to our bKash ({s.bkash_type})
              </span>
              <span className="big num">
                {s.bkash_number}
                <CopyButton text={s.bkash_number} />
              </span>
              <span>Amount: exactly {taka(course.price)}</span>
            </div>
            <ol className="steps">
              <li>Open the bKash app and choose Send Money.</li>
              <li>
                Send {taka(course.price)} to {s.bkash_number}. In Reference, you can write your email.
              </li>
              <li>Copy the Transaction ID (TrxID) from the confirmation SMS or the app’s history.</li>
              <li>Paste it here with the number you sent from, and press Send.</li>
            </ol>
            {s.payment_note && <p className="meta">{s.payment_note}</p>}
          </div>
          <div className="split-right">
            <div className="panel">
              {pending ? (
                <div className="form">
                  <h2 className="lead">We’ve got your payment.</h2>
                  <p className="meta">
                    TrxID {pending.trx_id} from {pending.sender_number} is waiting to be checked. You’ll see the lessons
                    on your dashboard as soon as it’s approved.
                  </p>
                  <Link className="btn" href="/dashboard">
                    Go to my courses
                  </Link>
                </div>
              ) : (
                <CheckoutForm courseId={course.id} price={course.price} phone={user.phone} />
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter s={s} />
    </>
  );
}
