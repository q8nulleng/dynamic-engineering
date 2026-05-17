export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
      <h1 className="text-6xl font-bold text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>404</h1>
      <p className="text-xl font-medium">الصفحة غير موجودة</p>
      <p className="text-muted-foreground">الصفحة التي تبحث عنها غير موجودة أو تم نقلها</p>
      <a href="/" className="text-primary hover:underline">العودة للرئيسية</a>
    </div>
  );
}
