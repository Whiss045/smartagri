import { useAuth } from "../hooks/auth.hook";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="page-head">
        <h1>الإعدادات</h1>
      </div>
      <div className="empty" style={{ textAlign: "start" }}>
        <p>
          المستخدم: <strong>{user?.username}</strong>
        </p>
        <button className="btn btn--danger" onClick={() => void logout()}>
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}
