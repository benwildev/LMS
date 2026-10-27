"use client";
import { useFormState } from "react-dom";
import { submitPayment } from "@/app/actions/student";
import Submit from "@/components/Submit";

export default function CheckoutForm({ courseId, price, phone }: { courseId: number; price: number; phone: string }) {
  const [state, action] = useFormState(submitPayment, {});
  return (
    <form action={action} className="form">
      <input type="hidden" name="courseId" value={courseId} />
      <label className="field">
        <span>bKash number you sent from</span>
        <input
          className="input num"
          name="sender"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          defaultValue={state.fields?.sender ?? phone}
          required
        />
      </label>
      <label className="field">
        <span>Transaction ID (TrxID)</span>
        <input
          className="input mono num"
          name="trx"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. 9JK4R2X7PQ"
          defaultValue={state.fields?.trx}
          required
        />
        <small>It’s in the SMS bKash sends after the payment.</small>
      </label>
      {state.error && (
        <p className="notice notice-bad" role="alert">
          {state.error}
        </p>
      )}
      <Submit className="btn btn-lg" pending="Sending…">
        Send for checking · ৳{new Intl.NumberFormat("en-IN").format(price)}
      </Submit>
    </form>
  );
}
