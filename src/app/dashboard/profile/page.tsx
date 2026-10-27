import { requireUser } from "@/lib/auth";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Profile" };

export default async function Profile() {
  const user = await requireUser("/dashboard/profile");
  return (
    <>
      <div className="title-row">
        <div>
          <h1>Profile</h1>
          <p>{user.email}</p>
        </div>
      </div>
      <ProfileForm name={user.name} phone={user.phone} />
    </>
  );
}
