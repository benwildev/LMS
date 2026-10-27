import { getSettings } from "@/lib/data";
import SettingsForm from "@/components/admin/SettingsForm";

export const metadata = { title: "Settings" };

export default async function Settings() {
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Settings</h1>
          <p>The bKash number here is what every student sees at checkout.</p>
        </div>
      </div>
      <SettingsForm initial={await getSettings()} />
    </>
  );
}
