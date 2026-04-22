/*
 * Design: Desert Oasis Professional
 * Contracts - العقود الهندسية
 * Based on Odoo.sh Engineering Contracts module
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus, FileSignature, Send, Printer, MessageCircle, Eye,
  FileText, CheckCircle2, Clock, AlertTriangle, XCircle,
  ChevronDown, ChevronUp
} from "lucide-react";

/* ── Contract Templates (11 from Odoo.sh) ── */
const contractTemplates = [
  { id: 1, name: "عقد بناء جديد - سكن خاص - الباقة الأساسية", buildingType: "سكن خاص", serviceType: "بناء جديد", packageType: "الأساسية" },
  { id: 2, name: "عقد بناء جديد - سكن خاص - الباقة المميزة", buildingType: "سكن خاص", serviceType: "بناء جديد", packageType: "المميزة" },
  { id: 3, name: "عقد بناء جديد - سكن خاص - الباقة الذهبية", buildingType: "سكن خاص", serviceType: "بناء جديد", packageType: "الذهبية" },
  { id: 4, name: "عقد بناء جديد - سكن خاص - باقة الإشراف", buildingType: "سكن خاص", serviceType: "بناء جديد", packageType: "الإشراف" },
  { id: 5, name: "عقد هدم - سكن خاص", buildingType: "سكن خاص", serviceType: "هدم", packageType: "-" },
  { id: 6, name: "عقد تعديل وإضافة - سكن خاص", buildingType: "سكن خاص", serviceType: "تعديل وإضافة", packageType: "-" },
  { id: 7, name: "عقد بناء جديد - استثماري", buildingType: "استثماري", serviceType: "بناء جديد", packageType: "-" },
  { id: 8, name: "عقد بناء جديد - تجاري", buildingType: "تجاري", serviceType: "بناء جديد", packageType: "-" },
  { id: 9, name: "عقد بناء جديد - صناعي", buildingType: "صناعي", serviceType: "بناء جديد", packageType: "-" },
  { id: 10, name: "عقد حدائق", buildingType: "حدائق", serviceType: "مظلات/حدائق", packageType: "-" },
  { id: 11, name: "عقد مظلات", buildingType: "مظلات", serviceType: "مظلات/حدائق", packageType: "-" },
];

/* ── Sample Contracts ── */
const contracts = [
  {
    id: "CON-2026-001", customer: "تهاني خالد محمد بورسلي", project: "S00047",
    buildingType: "سكن خاص", serviceType: "تعديل وإضافة", packageType: "الأساسية",
    amount: "500", date: "2026-04-15", status: "موقع", template: "عقد تعديل وإضافة - سكن خاص",
    civilId: "265110500317", area: "مشرف", block: "6", plot: "367",
  },
  {
    id: "CON-2026-002", customer: "فهد العتيبي", project: "S00048",
    buildingType: "سكن خاص", serviceType: "بناء جديد", packageType: "الذهبية",
    amount: "2,200", date: "2026-04-10", status: "نشط", template: "عقد بناء جديد - سكن خاص - الباقة الذهبية",
    civilId: "281050300215", area: "الجهراء", block: "3", plot: "122",
  },
  {
    id: "CON-2026-003", customer: "شركة الخليج", project: "S00049",
    buildingType: "تجاري", serviceType: "بناء جديد", packageType: "-",
    amount: "4,000", date: "2026-04-05", status: "مسودة", template: "عقد بناء جديد - تجاري",
    civilId: "CR-12345", area: "حولي", block: "1", plot: "55",
  },
  {
    id: "CON-2026-004", customer: "أحمد الكويتي", project: "S00046",
    buildingType: "سكن خاص", serviceType: "هدم", packageType: "-",
    amount: "250", date: "2026-03-20", status: "مكتمل", template: "عقد هدم - سكن خاص",
    civilId: "290080100412", area: "السالمية", block: "8", plot: "201",
  },
  {
    id: "CON-2026-005", customer: "محمد العلي", project: "S00050",
    buildingType: "استثماري", serviceType: "بناء جديد", packageType: "-",
    amount: "2,000", date: "2026-03-15", status: "مرسل للتوقيع", template: "عقد بناء جديد - استثماري",
    civilId: "275060200318", area: "الفحيحيل", block: "5", plot: "88",
  },
];

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "مسودة": { icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
  "مرسل للتوقيع": { icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
  "موقع": { icon: FileSignature, color: "text-purple-600", bg: "bg-purple-50" },
  "نشط": { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  "مكتمل": { icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50" },
  "ملغي": { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

const stageFlow = ["مسودة", "مرسل للتوقيع", "موقع", "نشط", "مكتمل"];

export default function Contracts() {
  const [view, setView] = useState<"list" | "templates">("list");
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}
            style={view === "list" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            العقود
          </Button>
          <Button variant={view === "templates" ? "default" : "outline"} size="sm" onClick={() => setView("templates")}
            style={view === "templates" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            قوالب العقود
          </Button>
        </div>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          عقد جديد
        </Button>
      </div>

      {view === "list" ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {stageFlow.map((stage) => {
              const count = contracts.filter((c) => c.status === stage).length;
              const st = statusConfig[stage];
              return (
                <Card key={stage} className="border-0 shadow-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${st.bg}`}>
                      <st.icon className={`w-4 h-4 ${st.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stage}</p>
                      <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{count}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="بحث بالاسم أو الرقم..." className="max-w-xs" />
            <Select>
              <SelectTrigger className="w-36"><SelectValue placeholder="نوع المبنى" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">سكن خاص</SelectItem>
                <SelectItem value="investment">استثماري</SelectItem>
                <SelectItem value="commercial">تجاري</SelectItem>
                <SelectItem value="industrial">صناعي</SelectItem>
                <SelectItem value="garden">حدائق</SelectItem>
                <SelectItem value="shades">مظلات</SelectItem>
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
                {stageFlow.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contracts Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium w-8"></th>
                      <th className="text-right py-3 px-4 font-medium">رقم العقد</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">المشروع</th>
                      <th className="text-right py-3 px-4 font-medium">نوع المبنى</th>
                      <th className="text-right py-3 px-4 font-medium">نوع الخدمة</th>
                      <th className="text-right py-3 px-4 font-medium">القيمة (د.ك)</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((c) => {
                      const st = statusConfig[c.status];
                      const isExpanded = expandedContract === c.id;
                      return (
                        <>
                          <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedContract(isExpanded ? null : c.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>{c.id}</td>
                            <td className="py-3 px-4 font-medium">{c.customer}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">{c.project}</td>
                            <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{c.buildingType}</Badge></td>
                            <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{c.serviceType}</Badge></td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{c.amount}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{c.status}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="إرسال للتوقيع"><FileSignature className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="واتساب"><MessageCircle className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="طباعة"><Printer className="w-3.5 h-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={c.id + "-detail"} className="bg-muted/10">
                              <td colSpan={9} className="py-4 px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Contract Info */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">معلومات العقد</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">القالب:</span><span className="font-medium text-xs">{c.template}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">التاريخ:</span><span dir="ltr">{c.date}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">نوع الباقة:</span><span>{c.packageType}</span></div>
                                    </div>
                                  </div>
                                  {/* Dynamic Fill Data */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">بيانات التعبئة التلقائية</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">الرقم المدني:</span><span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{c.civilId}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">المنطقة:</span><span>{c.area}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">القطعة:</span><span>{c.block}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">رقم القسيمة:</span><span>{c.plot}</span></div>
                                    </div>
                                  </div>
                                  {/* Stage Progress */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">مسار العقد</h4>
                                    <div className="flex items-center gap-1">
                                      {stageFlow.map((stage, idx) => {
                                        const currentIdx = stageFlow.indexOf(c.status);
                                        const isCompleted = idx <= currentIdx;
                                        const isCurrent = idx === currentIdx;
                                        return (
                                          <div key={stage} className="flex items-center gap-1 flex-1">
                                            <div className={`w-full h-2 rounded-full transition-colors ${isCompleted ? "" : "bg-gray-200"}`}
                                              style={isCompleted ? { backgroundColor: isCurrent ? "oklch(0.72 0.10 60)" : "oklch(0.55 0.15 150)" } : {}} />
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex justify-between mt-1">
                                      <span className="text-[10px] text-muted-foreground">مسودة</span>
                                      <span className="text-[10px] text-muted-foreground">مكتمل</span>
                                    </div>
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
        /* Contract Templates */
        <>
          <p className="text-sm text-muted-foreground">11 قالب عقد جاهز يغطي جميع أنواع المشاريع والخدمات الهندسية</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractTemplates.map((t) => (
              <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "oklch(0.72 0.10 60 / 0.15)" }}>
                      <FileText className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold leading-tight mb-2">{t.name}</h4>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{t.buildingType}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{t.serviceType}</Badge>
                        {t.packageType !== "-" && (
                          <Badge className="text-[10px] text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{t.packageType}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">
                      <Eye className="w-3 h-3 ml-1" />
                      معاينة
                    </Button>
                    <Button size="sm" className="flex-1 text-xs" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                      <Plus className="w-3 h-3 ml-1" />
                      إنشاء عقد
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
