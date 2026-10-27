"use client";
import { useFormState } from "react-dom";
import { saveProfile } from "@/app/actions/auth";
import Submit from "@/components/Submit";

export default function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [state, action] = useFormState(saveProfile, {});
  return (
    <form action={action}>
      <section className="set-row">
        <div className="set-label">
          <h2>Your details</h2>
          <p>Your phone number fills in the “sent from” field at checkout.</p>
        </div>
        <div className="set-panel fields">
          <div className="fields-2">
            <label className="field">
              <span>Full name</span>
              <input className="input" name="name" defaultValue={name} required />
            </label>
            <label className="field">
              <span>Phone</span>
              <input className="input num" name="phone" defaultValue={phone} placeholder="01XXXXXXXXX" />
            </label>
          </div>
        </div>
      </section>
      <section className="set-row">
        <div className="set-label">
          <h2>Password</h2>
          <p>Leave both empty to keep your current password.</p>
        </div>
        <div className="set-panel fields">
          <div className="fields-2">
            <label className="field">
              <span>Current password</span>
              <input className="input" type="password" name="current" autoComplete="current-password" />
            </label>
            <label className="field">
              <span>New password</span>
              <input className="input" type="password" name="password" autoComplete="new-password" minLength={8} />
            </label>
          </div>
          <div className="form-foot">
            <Submit className="btn" pending="Saving…">
              Save
            </Submit>
            {state.ok && <span className="stamp">{state.ok}</span>}
            {state.error && (
              <span className="err" role="alert">
                {state.error}
              </span>
            )}
          </div>
        </div>
      </section>
    </form>
  );
}
