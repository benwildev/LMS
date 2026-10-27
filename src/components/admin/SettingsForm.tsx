"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import Submit from "@/components/Submit";
import { saveSettings } from "@/app/actions/admin";

export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [state, action] = useFormState(saveSettings, {});
  const [num, setNum] = useState(initial.bkash_number ?? "");
  const [type, setType] = useState(initial.bkash_type ?? "Personal");

  return (
    <form action={action}>
      <section className="set-row">
        <div className="set-label">
          <h2>bKash payments</h2>
          <p>Students Send Money to this number, then paste their Transaction ID. You approve each one by hand.</p>
          <div className="preview-pay" aria-label="What students see">
            <span>Send Money to our bKash ({type})</span>
            <strong className="num">{num || "01XXXXXXXXX"}</strong>
            <span>Then paste the TrxID from the SMS.</span>
          </div>
        </div>
        <div className="set-panel fields">
          <div className="fields-2">
            <label className="field">
              <span>bKash number</span>
              <input
                className="input num"
                name="bkash_number"
                inputMode="numeric"
                value={num}
                onChange={(e) => setNum(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>Account type</span>
              <select name="bkash_type" value={type} onChange={(e) => setType(e.target.value)}>
                <option>Personal</option>
                <option>Agent</option>
                <option>Merchant</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>Note at checkout</span>
            <textarea name="payment_note" rows={3} defaultValue={initial.payment_note} />
            <small>Shown under the payment steps. Use it for anything students often get wrong.</small>
          </label>
        </div>
      </section>

      <section className="set-row">
        <div className="set-label">
          <h2>School</h2>
          <p>The name appears in the navigation, the footer and page titles.</p>
        </div>
        <div className="set-panel fields">
          <label className="field">
            <span>Name</span>
            <input className="input" name="site_name" defaultValue={initial.site_name} required />
          </label>
          <label className="field">
            <span>One-line description</span>
            <input className="input" name="tagline" defaultValue={initial.tagline} />
            <small>Used for search engines and link previews.</small>
          </label>
        </div>
      </section>

      <section className="set-row">
        <div className="set-label">
          <h2>Landing page</h2>
          <p>
            The announcement shows in the dark bar at the very top (leave it empty to hide the bar). The hero image sits
            on the right of the first screen; a photo with a transparent background works best.
          </p>
        </div>
        <div className="set-panel fields">
          <label className="field">
            <span>Homepage headline</span>
            <input className="input" name="hero_title" defaultValue={initial.hero_title} />
            <small>The last two words are highlighted in green.</small>
          </label>
          <label className="field">
            <span>Homepage introduction</span>
            <textarea name="hero_subtitle" rows={3} defaultValue={initial.hero_subtitle} />
          </label>
          <label className="field">
            <span>Announcement</span>
            <input
              className="input"
              name="announcement"
              defaultValue={initial.announcement}
              placeholder="Eid offer: every course 20% off until 15 June"
            />
          </label>
          <label className="field">
            <span>Hero image link</span>
            <input className="input" name="hero_image_url" defaultValue={initial.hero_image_url} placeholder="https://…/hero.png" />
            <small>Without one, the landing page shows a drawing of the lesson screen.</small>
          </label>
        </div>
      </section>

      <section className="set-row">
        <div className="set-label">
          <h2>Help for students</h2>
          <p>Shown in the footer as “Message us”. With a phone number it opens WhatsApp; otherwise it opens email.</p>
        </div>
        <div className="set-panel fields">
          <div className="fields-2">
            <label className="field">
              <span>WhatsApp number</span>
              <input className="input num" name="support_phone" defaultValue={initial.support_phone} placeholder="01XXXXXXXXX" />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" name="support_email" defaultValue={initial.support_email} />
            </label>
          </div>
          <div className="form-foot">
            <Submit className="btn" pending="Saving…">
              Save settings
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
