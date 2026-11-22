export default function AboutPage() {
  return (
    <>
      <div className="page-head">
        <h1>حول التطبيق</h1>
      </div>
      <div className="empty" style={{ textAlign: "start" }}>
        <p>
          <strong>سمارت أغري</strong>: نظام ذكي لإدارة الري والتدفئة وقياسات
          الحساسات في الأراضي الفلاحية بولاية قبلي.
        </p>
        <p className="muted">
          تتواصل أجهزة ESP32 مع الخادم عبر MQTT، ويتحكم المزارع في كل شيء من هذه
          الواجهة.
        </p>
      </div>
    </>
  );
}
