/*
 * Design: Desert Oasis Professional
 * Quotations - عروض الأسعار الهندسية
 * Updated with full 23 packages from Odoo.sh + Location fields
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Send, CheckCircle, Eye, Download, MessageCircle, Receipt, ChevronDown, ChevronUp, MapPin } from "lucide-react";

/* ── Full 23 Engineering Packages from Odoo.sh ── */
const allPackages: Record<string, { name: string; price: string; buildingType: string; serviceType: string; level: string; features: string[] }[]> = {
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

/* ── Quotations with Location Data ── */
const quotations = [
  { id: "S00047", client: "تهاني خالد محمد بورسلي", type: "سكن خاص", service: "تعديل وإضافة", package: "باقة تعديل وإضافة - سكن خاص",
    amount: "500", status: "مقبول", date: "2026-04-15", civilId: "265110500317",
    governorate: "محافظة حولي", area: "مشرف", landArea: "375", block: "6", suburb: "0", plot: "367", surveyPlan: "30930" },
  { id: "S00046", client: "أحمد الكويتي", type: "سكن خاص", service: "هدم", package: "باقة الهدم - سكن خاص",
    amount: "250", status: "عقد", date: "2026-04-10", civilId: "290080100412",
    governorate: "محافظة حولي", area: "السالمية", landArea: "400", block: "8", suburb: "0", plot: "201", surveyPlan: "25100" },
  { id: "S00048", client: "فهد العتيبي", type: "سكن خاص", service: "بناء جديد", package: "الباقة الذهبية - سكن خاص",
    amount: "2,200", status: "مرسل", date: "2026-04-08", civilId: "281050300215",
    governorate: "محافظة الجهراء", area: "الجهراء", landArea: "500", block: "3", suburb: "2", plot: "122", surveyPlan: "31500" },
  { id: "S00049", client: "شركة الخليج", type: "تجاري", service: "بناء جديد", package: "الباقة الأساسية - تجاري",
    amount: "2,000", status: "مسودة", date: "2026-04-05", civilId: "CR-12345",
    governorate: "محافظة حولي", area: "حولي", landArea: "800", block: "1", suburb: "0", plot: "55", surveyPlan: "28000" },
  { id: "S00050", client: "محمد العلي", type: "استثماري", service: "بناء جديد", package: "الباقة الأساسية - استثماري",
    amount: "2,000", status: "مرسل", date: "2026-04-01", civilId: "275060200318",
    governorate: "محافظة الأحمدي", area: "الفحيحيل", landArea: "600", block: "5", suburb: "1", plot: "88", surveyPlan: "29500" },
  { id: "S00051", client: "سالم المطيري", type: "سكن خاص", service: "بناء جديد", package: "الباقة المميزة - سكن خاص",
    amount: "1,600", status: "مرفوض", date: "2026-03-25", civilId: "268030400512",
    governorate: "محافظة مبارك الكبير", area: "صباح الأحمد", landArea: "450", block: "12", suburb: "3", plot: "310", surveyPlan: "32000" },
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
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>("الكل");
  const [expandedQuotation, setExpandedQuotation] = useState<string | null>(null);

  const filteredPackages = selectedBuildingType === "الكل"
    ? flatPackages
    : allPackages[selectedBuildingType] || [];

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
            <Input placeholder="بحث بالاسم أو الرقم..." className="max-w-xs" />
            <Select>
              <SelectTrigger className="w-36"><SelectValue placeholder="نوع العقار" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">سكن خاص</SelectItem>
                <SelectItem value="investment">استثماري</SelectItem>
                <SelectItem value="commercial">تجاري</SelectItem>
                <SelectItem value="industrial">صناعي</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-36"><SelectValue placeholder="نوع الخدمة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">بناء جديد</SelectItem>
                <SelectItem value="demolition">هدم</SelectItem>
                <SelectItem value="modification">تعديل</SelectItem>
                <SelectItem value="addition">إضافة</SelectItem>
                <SelectItem value="mod-add">تعديل وإضافة</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-32"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="sent">مرسل</SelectItem>
                <SelectItem value="accepted">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="contract">عقد</SelectItem>
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
                    {quotations.map((q) => {
                      const st = statusConfig[q.status];
                      const isExpanded = expandedQuotation === q.id;
                      return (
                        <>
                          <tr key={q.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedQuotation(isExpanded ? null : q.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{q.id}</td>
                            <td className="py-3 px-4 font-medium">{q.client}</td>
                            <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{q.type}</Badge></td>
                            <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{q.service}</Badge></td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">{q.package}</td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{q.amount}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="إرسال"><Send className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="واتساب"><MessageCircle className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تحميل"><Download className="w-3.5 h-3.5" /></Button>
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
                                      <div className="flex justify-between"><span className="text-muted-foreground">التاريخ:</span><span dir="ltr">{q.date}</span></div>
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
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">بيانات إضافية</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">الضاحية:</span><span>{q.suburb}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">رقم القسيمة:</span><span>{q.plot}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">رقم المخطط المساحي:</span><span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{q.surveyPlan}</span></div>
                                    </div>
                                  </div>
                                </div>
                                {/* Required Documents */}
                                <div className="mt-4 pt-4 border-t">
                                  <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">المستندات المطلوبة</h4>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-xs">البطاقة المدنية للمالك</Badge>
                                    <Badge variant="outline" className="text-xs">رخصة البناء الأصلية</Badge>
                                    <Badge variant="outline" className="text-xs">المخططات المرخصة</Badge>
                                    <Badge variant="outline" className="text-xs">وثيقة البيت</Badge>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
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
