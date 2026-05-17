/*
 * Design: Desert Oasis Professional
 * Quotations - عروض الأسعار الهندسية
 * Updated with full 23 packages from Odoo.sh + Location fields
 */
import { useState } from "react";
import { Link } from "wouter";
import { useQuotations } from "@/lib/api";
import { exportQuotationPdf } from "@/lib/pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Send, CheckCircle, Eye, Download, MessageCircle, Receipt, ChevronDown, ChevronUp, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

/* ── Full 23 Engineering Packages from Odoo.sh ── */
export const allPackages: Record<string, { name: string; price: string; buildingType: string; serviceType: string; level: string; features: string[] }[]> = {
  "سكن خاص": [
    { name: "الباقة الأساسية - سكن خاص", price: "1,500", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "فحص التربة", "إمكانية إيصال التيار", "إصدار رخصة البلدية", "مخطط صرف صحي", "واجهة 3D", "مخطط فرش", "إشراف 3 أشهر"] },
    { name: "الباقة المميزة - سكن خاص", price: "1,600", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Premium",
      features: ["جميع خدمات الباقة الأساسية", "تصميم الكهرباء والصحي", "واجهات ثلاثية الأبعاد متعددة", "تعديلات إضافية"] },
    { name: "الباقة الذهبية - سكن خاص", price: "2,200", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Gold",
      features: ["جميع خدمات الباقة المميزة", "التصميم الداخلي", "الإشراف الهندسي الكامل", "تعديلات غير محدودة"] },
    { name: "باقة الإشراف - سكن خاص", price: "150", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Supervision",
      features: ["إشراف هندسي كامل", "3 زيارات أسبوعياً", "تقارير دورية", "استلام أعمال"] },
    { name: "باقة تعديل - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات القائمة", "تصميم التعديلات", "تقديم البلدية", "إشراف"] },
    { name: "باقة إضافة - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات القائمة", "تصميم الإضافات", "تقديم البلدية", "إشراف"] },
    { name: "باقة تعديل وإضافة - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات القائمة", "تصميم التعديلات والإضافات", "تقديم البلدية", "إشراف"] },
    { name: "باقة الهدم - سكن خاص", price: "250", buildingType: "سكن خاص", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية", "إشراف على الهدم"] },
  ],
  "استثماري": [
    { name: "الباقة الأساسية - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "إشراف"] },
    { name: "إضافة - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات", "تصميم الإضافات", "تقديم البلدية"] },
    { name: "إضافة وتعديل - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات والإضافات", "تقديم البلدية"] },
    { name: "تعديل - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات", "تقديم البلدية"] },
    { name: "هدم - استثماري", price: "250", buildingType: "استثماري", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية"] },
  ],
  "تجاري": [
    { name: "الباقة الأساسية - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "إشراف"] },
    { name: "إضافة - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات", "تصميم الإضافات", "تقديم البلدية"] },
    { name: "إضافة وتعديل - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات والإضافات", "تقديم البلدية"] },
    { name: "تعديل - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات", "تقديم البلدية"] },
    { name: "هدم - تجاري", price: "250", buildingType: "تجاري", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية"] },
  ],
  "صناعي": [
    { name: "الباقة الأساسية - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "إشراف"] },
    { name: "إضافة - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات", "تصميم الإضافات", "تقديم البلدية"] },
    { name: "إضافة وتعديل - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات والإضافات", "تقديم البلدية"] },
    { name: "تعديل - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات", "تقديم البلدية"] },
    { name: "هدم - صناعي", price: "250", buildingType: "صناعي", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية"] },
  ],
};

const flatPackages = Object.values(allPackages).flat();

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  "مسودة":      { label: "مسودة",      color: "text-gray-600",   bg: "bg-gray-100"  },
  "مرسل":       { label: "مرسل",       color: "text-blue-600",   bg: "bg-blue-50"   },
  "مقبول":      { label: "مقبول",      color: "text-green-600",  bg: "bg-green-50"  },
  "مرفوض":      { label: "مرفوض",      color: "text-red-600",    bg: "bg-red-50"    },
  "عقد":        { label: "تحول لعقد", color: "text-purple-600", bg: "bg-purple-50" },
  "تم التعاقد": { label: "تم التعاقد", color: "text-emerald-700",bg: "bg-emerald-50"},
  "منتهي":      { label: "منتهي",      color: "text-gray-500",   bg: "bg-gray-100"  },
};

const fallbackStatus = { label: "—", color: "text-gray-500", bg: "bg-gray-50" };

export default function Quotations() {
  const { data: quotations = [], isLoading } = useQuotations();
  const [view, setView] = useState<"list" | "packages">("list");
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>("الكل");
  const [expandedQuotation, setExpandedQuotation] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [exportingId, setExportingId] = useState<string | null>(null);

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  const filtered = quotations.filter((q) => {
    const matchSearch = !search || q.client.includes(search) || q.id.includes(search) || (q.civilId || "").includes(search);
    const matchStatus = statusFilter === "الكل" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredPackages = selectedBuildingType === "الكل"
    ? flatPackages
    : allPackages[selectedBuildingType] || [];

  async function handlePdf(e: React.MouseEvent, q: typeof quotations[0]) {
    e.stopPropagation();
    setExportingId(q.id);
    const tid = toast.loading("جاري إنشاء PDF...");
    try {
      const pkg = flatPackages.find(p => p.name === q.package) ?? {
        name: q.package, price: q.amount, features: [], level: "-",
      };
      await exportQuotationPdf(
        { name: q.client, phone: "—", type: q.type, serviceType: q.service, governorate: q.governorate, area: q.area },
        pkg,
      );
      toast.success("تم فتح نافذة الطباعة", { id: tid });
    } catch (err: unknown) {
      const blocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(blocked ? "السماح بالنوافذ المنبثقة مطلوب" : "فشل إنشاء PDF", { id: tid });
    } finally {
      setExportingId(null);
    }
  }

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
            الباقات الهندسية ({flatPackages.length})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Receipt className="w-4 h-4 ml-1" />
            فاتورة فتح ملف 50 د.ك
          </Button>
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            <Plus className="w-4 h-4 ml-2" />
            عرض سعر جديد
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="بحث بالاسم أو الرقم المدني..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">كل الحالات</SelectItem>
                {Object.keys(statusConfig).map(s => (
                  <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                ))}
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
                      <th className="text-right py-3 px-4 font-medium w-8"></th>
                      <th className="text-right py-3 px-4 font-medium">الرقم</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">نوع العقار</th>
                      <th className="text-right py-3 px-4 font-medium">نوع الخدمة</th>
                      <th className="text-right py-3 px-4 font-medium">الباقة</th>
                      <th className="text-right py-3 px-4 font-medium">المبلغ (د.ك)</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q) => {
                      const st = statusConfig[q.status] ?? fallbackStatus;
                      const isExpanded = expandedQuotation === q.id;
                      return (
                        <>
                          <tr key={q.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedQuotation(isExpanded ? null : q.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                              {q.id}
                              {q.leadId && (
                                <Link href="/crm">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 ms-1 cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-600">CRM</Badge>
                                </Link>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium">{q.client}</td>
                            <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{q.type}</Badge></td>
                            <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{q.service}</Badge></td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">{q.package}</td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{q.amount}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="واتساب"
                                  onClick={() => window.open(`https://wa.me/965${q.civilId}`, "_blank")}>
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تحميل PDF"
                                  disabled={exportingId === q.id}
                                  onClick={(e) => handlePdf(e, q)}>
                                  {exportingId === q.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Download className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={q.id + "-detail"} className="bg-muted/10">
                              <td colSpan={9} className="py-4 px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Project Details */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">بيانات المشروع</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">الرقم المدني:</span><span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{q.civilId}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الإصدار:</span><span dir="ltr">{q.date}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">صلاحية العرض:</span><span>{q.validityDays || 30} يوم</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الانتهاء:</span><span dir="ltr">{q.expiryDate || "—"}</span></div>
                                    </div>
                                  </div>
                                  {/* Location Details */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      بيانات الموقع
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">المحافظة:</span><span>{q.governorate}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">المنطقة:</span><span>{q.area}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">مساحة الأرض:</span><span>{q.landArea} م²</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">القطعة:</span><span>{q.block}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">رقم القسيمة:</span><span>{q.plot}</span></div>
                                    </div>
                                  </div>
                                  {/* Payment Schedule */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">جدول الدفعات</h4>
                                    <div className="space-y-2 text-sm">
                                      {(() => {
                                        const amt = parseFloat(q.amount?.replace(",", "") || "0");
                                        return [
                                          { label: "الدفعة الأولى (30%)", val: amt * 0.30, note: "عند التوقيع" },
                                          { label: "الدفعة الثانية (40%)", val: amt * 0.40, note: "عند اعتماد التصاميم" },
                                          { label: "الدفعة الثالثة (30%)", val: amt * 0.30, note: "عند الإنجاز" },
                                        ].map((d, i) => (
                                          <div key={i} className="flex justify-between items-center">
                                            <div>
                                              <div className="text-muted-foreground text-xs">{d.label}</div>
                                              <div className="text-[10px] text-muted-foreground">{d.note}</div>
                                            </div>
                                            <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>
                                              {d.val.toLocaleString("ar-KW", { minimumFractionDigits: 3 })} د.ك
                                            </span>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                          لا توجد عروض أسعار مطابقة للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Packages Grid - Full 23 packages */
        <>
          {/* Building Type Filter */}
          <div className="flex gap-2 flex-wrap">
            {["الكل", "سكن خاص", "استثماري", "تجاري", "صناعي"].map((bt) => (
              <Button
                key={bt}
                variant={selectedBuildingType === bt ? "default" : "outline"}
                size="sm"
                className="text-xs"
                style={selectedBuildingType === bt ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}
                onClick={() => setSelectedBuildingType(bt)}
              >
                {bt}
                <Badge variant="secondary" className="mr-1.5 text-[10px] px-1.5">
                  {bt === "الكل" ? flatPackages.length : (allPackages[bt]?.length || 0)}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPackages.map((pkg, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm leading-tight">{pkg.name}</CardTitle>
                    {pkg.level !== "-" && (
                      <Badge className="text-[10px] shrink-0 text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{pkg.level}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px]">{pkg.buildingType}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{pkg.serviceType}</Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2" style={{ color: "oklch(0.72 0.10 60)", fontFamily: "'Space Grotesk'" }}>
                    {pkg.price} <span className="text-sm font-normal">د.ك</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
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
        </>
      )}
    </div>
  );
}
