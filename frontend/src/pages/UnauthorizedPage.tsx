import { Link } from "react-router-dom";

// Where ProtectedRoute sends visitors without a session
export default function UnauthorizedPage() {
  return (
    <div className="center-screen">
      <div>
        <h1>🔒 غير مصرّح</h1>
        <p className="muted">
          لا يمكن الوصول إلى الصفحة المطلوبة. يرجى التحقق من صلاحيات الوصول
          الخاصة بك أو التأكد من وجود نقطة دخول فعلية لهذه الصفحة
        </p>
        <Link className="btn btn--primary" to="/login">
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
