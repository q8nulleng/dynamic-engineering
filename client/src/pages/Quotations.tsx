/*
 * Quotations - عروض الأسعار الهندسية
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Send, CheckCircle, XCircle, Eye, Download } from "lucide-react";

const quotations = [
  { id: "Q-2025-001", client: "أحمد الكويتي", type: "سكن خاص", package: "الباقة الأساسية", amount: "1,500", status: "مسودة", date: "2025-04-20" },
  { id: "Q-2025-002", client: "شركة الخليج", type: "تجاري", package: "الباقة الأساسية", amount: "4,000", status: "مرسل", date: "2025-04-18" },
  { id: "Q-2025-003", client: "محمد العلي", type: "استثماري", package: "الباقة المميزة", amount: "5,500", status: "مقبول", date: "2025-04-15" },
  { id: "Q-2025-004", client: "سالم المطيري", type: "سكن خاص", package: "الباقة الذهبية", amount: "4,000", status: "مرفوض", date: "2025-04-10" },
  { id: "Q-2025-005", client: "خالد الرشيدي", type: "سكن خاص", package: "الباقة المميزة", amount: "2,500", status: "عقد", date: "2025-04-08" },
];

const packages = [
  { name: "الباقة الأساسية - سكن خاص", price: "1,500", features: ["التصميم المعماري", "التصميم الإنشائي", "تقديم البلدية"] },
  { name: "الباقة المميزة - سكن خاص", price: "2,500", features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "الواجهات ثلاثية الأبعاد"] },
  { name: "الباقة الذهبية - سكن خاص", price: "4,000", features: ["جميع خدمات الباقة المميزة", "التصميم الداخلي", "الإشراف الهندسي", "تعديلات غير محدودة"] },
  { name: "باقة الإشراف - سكن خاص", price: "2,000", features: ["إشراف هندسي كامل", "3 زيارات أسبوعياً", "تقارير دورية", "استلام أعمال"] },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  "مسودة": { label: "مسودة", color: "text-gray-600", bg: "bg-gray-100" },
  "مرسل": { label: "مرسل", color: "text-blue-600", bg: "bg-blue-50" },
  "مقبول": { label: "مقبول", color: "text-green-600", bg: "bg-green-50" },
  "مرفوض": { label: "مرفوض", color: "text-red-600", bg: "bg-red-50" },
  "عقد": { label: "تحول لعقد", color: "text-purple-600", bg: "bg-purple-50" },
};

export default function Quotations() {
  const [view, setView] = useState<"list" | "packages">("list");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}
            style={view === "list" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            عروض الأسعار
          </Button>
          <Button variant={view === "packages" ? "default" : "outline"} size="sm" onClick={() => setView("packages")}
            style={view === "packages" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            الباقات الهندسية
          </Button>
        </div>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          عرض سعر جديد
        </Button>
      </div>

      {view === "list" ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="بحث بالاسم أو الرقم..." className="max-w-xs" />
            <Select>
              <SelectTrigger className="w-40"><SelectValue placeholder="نوع المشروع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">سكن خاص</SelectItem>
                <SelectItem value="commercial">تجاري</SelectItem>
                <SelectItem value="investment">استثماري</SelectItem>
                <SelectItem value="industrial">صناعي</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="sent">مرسل</SelectItem>
                <SelectItem value="accepted">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium">الرقم</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">نوع المشروع</th>
                      <th className="text-right py-3 px-4 font-medium">الباقة</th>
                      <th className="text-right py-3 px-4 font-medium">المبلغ (د.ك)</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((q, i) => {
                      const st = statusConfig[q.status];
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer">
                          <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{q.id}</td>
                          <td className="py-3 px-4 font-medium">{q.client}</td>
                          <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{q.type}</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{q.package}</td>
                          <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{q.amount}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs" dir="ltr">{q.date}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-3.5 h-3.5" /></Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Packages Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg, i) => (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{pkg.name}</CardTitle>
                <p className="text-2xl font-bold" style={{ color: "oklch(0.72 0.10 60)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {pkg.price} <span className="text-sm font-normal">د.ك</span>
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {pkg.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.55 0.15 150)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-4" variant="outline" size="sm">تعديل الباقة</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
