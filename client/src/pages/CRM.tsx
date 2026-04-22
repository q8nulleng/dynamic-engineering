/*
 * CRM - Simplified view with collapsible sections
 * Each stage is a clickable button that expands to show leads
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Phone, Mail, Star, DollarSign, User,
  Calendar, FileText, Trophy, X, ChevronDown, ChevronUp,
  Building, Hash, Percent, Tag, UserCheck, Save,
  ClipboardList, MessageCircle, Activity, Users, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

interface Lead {
  name: string;
  phone: string;
  email: string;
  type: string;
  source: string;
  date: string;
  expectedRevenue: string;
  probability: number;
  priority: 0 | 1 | 2 | 3;
  salesperson: string;
  expectedClosing: string;
  tags: string[];
  quotations: number;
  civilId?: string;
  notes?: string;
  serviceType?: string;
}

const stages: { title: string; color: string; icon: typeof Users; leads: Lead[] }[] = [
  {
    title: "استفسار جديد",
    color: "oklch(0.55 0.15 250)",
    icon: Users,
    leads: [
      {
        name: "فهد العتيبي", phone: "9876 5432", email: "fahad@email.com", type: "سكن خاص", source: "اتصال", date: "اليوم",
        expectedRevenue: "2,200", probability: 30, priority: 2, salesperson: "أحمد", expectedClosing: "2026-05-15",
        tags: ["بناء جديد", "ذهبية"], quotations: 0, civilId: "281050300215", serviceType: "بناء جديد",
      },
      {
        name: "شركة النور", phone: "9812 3456", email: "info@alnoor.com", type: "تجاري", source: "واتساب", date: "أمس",
        expectedRevenue: "4,000", probability: 20, priority: 1, salesperson: "محمد", expectedClosing: "2026-06-01",
        tags: ["بناء جديد"], quotations: 0, serviceType: "بناء جديد",
      },
      {
        name: "تهاني خالد محمد بورسلي", phone: "9955 1122", email: "fedaa.dynamic@gmail.com", type: "سكن خاص", source: "زيارة", date: "اليوم",
        expectedRevenue: "500", probability: 50, priority: 2, salesperson: "أحمد", expectedClosing: "2026-05-01",
        tags: ["تعديل وإضافة"], quotations: 2, civilId: "265110500317", serviceType: "تعديل وإضافة",
      },
    ],
  },
  {
    title: "تم التواصل",
    color: "oklch(0.72 0.10 60)",
    icon: Phone,
    leads: [
      {
        name: "سالم المطيري", phone: "9911 2233", email: "salem@email.com", type: "استثماري", source: "زيارة", date: "منذ يومين",
        expectedRevenue: "2,000", probability: 40, priority: 1, salesperson: "خالد", expectedClosing: "2026-05-20",
        tags: ["بناء جديد"], quotations: 1, serviceType: "بناء جديد",
      },
    ],
  },
  {
    title: "عرض سعر مرسل",
    color: "oklch(0.60 0.15 280)",
    icon: FileText,
    leads: [
      {
        name: "أحمد الكويتي", phone: "9955 6677", email: "ahmad@email.com", type: "سكن خاص", source: "اتصال", date: "منذ 3 أيام",
        expectedRevenue: "250", probability: 70, priority: 3, salesperson: "أحمد", expectedClosing: "2026-04-30",
        tags: ["هدم"], quotations: 1, civilId: "290080100412", serviceType: "هدم",
      },
      {
        name: "مؤسسة البناء", phone: "9922 3344", email: "info@building.com", type: "صناعي", source: "بريد", date: "منذ 5 أيام",
        expectedRevenue: "2,000", probability: 60, priority: 2, salesperson: "محمد", expectedClosing: "2026-05-10",
        tags: ["بناء جديد"], quotations: 1, serviceType: "بناء جديد",
      },
    ],
  },
  {
    title: "تم التعاقد",
    color: "oklch(0.55 0.15 150)",
    icon: Trophy,
    leads: [
      {
        name: "خالد الرشيدي", phone: "9988 7766", email: "khaled@email.com", type: "سكن خاص", source: "واتساب", date: "هذا الأسبوع",
        expectedRevenue: "1,500", probability: 100, priority: 2, salesperson: "أحمد", expectedClosing: "2026-04-20",
        tags: ["بناء جديد", "أساسية"], quotations: 1, civilId: "277040100612", serviceType: "بناء جديد",
      },
    ],
  },
];

const priorityStars = (p: number) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map((s) => (
      <Star key={s} className={`w-3 h-3 ${s <= p ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
    ))}
  </div>
);

const emptyForm = {
  name: "", phone: "", email: "", civilId: "", type: "", serviceType: "",
  source: "", salesperson: "", expectedRevenue: "", probability: "",
  expectedClosing: "", priority: "", tags: "", notes: "",
};

export default function CRM() {
  const [data] = useState(stages);
  const [openStage, setOpenStage] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "notes">("basic");

  const totalLeads = data.reduce((s, c) => s + c.leads.length, 0);
  const totalRevenue = data.reduce((s, c) => s + c.leads.reduce((a, l) => a + parseFloat(l.expectedRevenue.replace(",", "")), 0), 0);

  const handleFormChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
    if (!form.phone.trim()) { toast.error("يرجى إدخال رقم الهاتف"); return; }
    setForm(emptyForm);
    setActiveTab("basic");
    setShowNewDialog(false);
    toast.success(`تمت إضافة فرصة "${form.name}" بنجاح`);
  };

  return (
    <div className="space-y-5">
      {/* Header - Simple */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">تتبع العملاء من الاستفسار حتى التعاقد</p>
        <Button onClick={() => setShowNewDialog(true)} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          فرصة جديدة
        </Button>
      </div>

      {/* Summary Row - Compact */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalLeads}</span>
          <span className="text-muted-foreground">فرصة</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalRevenue.toLocaleString()}</span>
          <span className="text-muted-foreground">د.ك</span>
        </div>
      </div>

      {/* ===== Stage Buttons ===== */}
      <div className="space-y-3">
        {data.map((stage, si) => {
          const isOpen = openStage === si;
          const stageRevenue = stage.leads.reduce((s, l) => s + parseFloat(l.expectedRevenue.replace(",", "")), 0);
          const Icon = stage.icon;

          return (
            <div key={si}>
              {/* Stage Button */}
              <button
                onClick={() => { setOpenStage(isOpen ? null : si); setSelectedLead(null); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm"
                style={{
                  borderColor: isOpen ? stage.color : undefined,
                  backgroundColor: isOpen ? `color-mix(in oklch, ${stage.color} 5%, white)` : undefined,
                }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `color-mix(in oklch, ${stage.color} 15%, white)` }}>
                  <Icon className="w-5 h-5" style={{ color: stage.color }} />
                </div>

                {/* Title + Count */}
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-sm">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stage.leads.length} عميل · {stageRevenue.toLocaleString()} د.ك
                  </p>
                </div>

                {/* Badge + Arrow */}
                <Badge
                  className="text-white text-xs px-2.5 py-1"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.leads.length}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Leads List */}
              {isOpen && (
                <div className="mt-2 mr-4 border-r-2 pr-4 space-y-2" style={{ borderColor: stage.color }}>
                  {stage.leads.map((lead, li) => (
                    <div
                      key={li}
                      onClick={() => setSelectedLead(selectedLead === lead ? null : lead)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                        selectedLead === lead ? "shadow-sm" : ""
                      }`}
                      style={selectedLead === lead ? { borderColor: stage.color, backgroundColor: `color-mix(in oklch, ${stage.color} 3%, white)` } : {}}
                    >
                      {/* Lead Row */}
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: stage.color }}>
                          {lead.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold truncate">{lead.name}</h4>
                            {priorityStars(lead.priority)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span dir="ltr">{lead.phone}</span>
                            <span>·</span>
                            <span>{lead.type}</span>
                          </div>
                        </div>

                        {/* Revenue */}
                        <div className="text-left shrink-0">
                          <p className="text-sm font-bold" style={{ color: stage.color, fontFamily: "'Space Grotesk'" }}>
                            {lead.expectedRevenue} <span className="text-[10px] font-normal text-muted-foreground">د.ك</span>
                          </p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <div className="w-10 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${lead.probability}%`, backgroundColor: stage.color }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{lead.probability}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Lead Details */}
                      {selectedLead === lead && (
                        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          {/* Contact Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              <span dir="ltr">{lead.expectedClosing}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.salesperson}</span>
                            </div>
                            {lead.civilId && (
                              <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                <span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{lead.civilId}</span>
                              </div>
                            )}
                            {lead.serviceType && (
                              <div className="flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{lead.serviceType}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.source}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex gap-1.5 flex-wrap">
                            {lead.tags.map((tag, ti) => (
                              <Badge key={ti} variant="secondary" className="text-[10px]">{tag}</Badge>
                            ))}
                            {lead.quotations > 0 && (
                              <Badge className="text-[10px] text-white bg-blue-500">{lead.quotations} عرض سعر</Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                              <FileText className="w-3 h-3 ml-1" />
                              عرض سعر
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <Phone className="w-3 h-3 ml-1" />
                              اتصال
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7">
                              <MessageCircle className="w-3 h-3 ml-1" />
                              واتساب
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200">
                              <Trophy className="w-3 h-3 ml-1" />
                              فوز
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200">
                              <X className="w-3 h-3 ml-1" />
                              خسارة
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==================== New Opportunity Dialog ==================== */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b">
            <DialogHeader className="p-5 pb-0">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                  <Plus className="w-4 h-4 text-white" />
                </div>
                فرصة جديدة
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-0 px-5 pt-4">
              {([
                { key: "basic" as const, label: "البيانات الأساسية", icon: User },
                { key: "details" as const, label: "تفاصيل المشروع", icon: Building },
                { key: "notes" as const, label: "ملاحظات", icon: ClipboardList },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key ? "border-current text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === tab.key ? { borderColor: "oklch(0.72 0.10 60)" } : {}}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {activeTab === "basic" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      اسم العميل <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="أدخل اسم العميل الكامل" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="9XXX XXXX" dir="ltr" className="text-right" value={form.phone} onChange={(e) => handleFormChange("phone", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      البريد الإلكتروني
                    </label>
                    <Input type="email" placeholder="example@email.com" dir="ltr" className="text-right" value={form.email} onChange={(e) => handleFormChange("email", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      الرقم المدني
                    </label>
                    <Input placeholder="12 رقم" dir="ltr" className="text-right" maxLength={12} value={form.civilId} onChange={(e) => handleFormChange("civilId", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      المسؤول
                    </label>
                    <Select value={form.salesperson} onValueChange={(v) => handleFormChange("salesperson", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر المسؤول" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="أحمد">م. أحمد</SelectItem>
                        <SelectItem value="محمد">م. محمد</SelectItem>
                        <SelectItem value="خالد">م. خالد</SelectItem>
                        <SelectItem value="نواف">م. نواف</SelectItem>
                        <SelectItem value="مارك">م. مارك</SelectItem>
                        <SelectItem value="مصطفى">م. مصطفى</SelectItem>
                        <SelectItem value="فداء">م. فداء</SelectItem>
                        <SelectItem value="أمين">م. أمين</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                      مصدر العميل
                    </label>
                    <Select value={form.source} onValueChange={(v) => handleFormChange("source", v)}>
                      <SelectTrigger><SelectValue placeholder="كيف وصل العميل؟" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="اتصال">اتصال هاتفي</SelectItem>
                        <SelectItem value="واتساب">واتساب</SelectItem>
                        <SelectItem value="زيارة">زيارة المكتب</SelectItem>
                        <SelectItem value="بريد">بريد إلكتروني</SelectItem>
                        <SelectItem value="انستغرام">انستغرام</SelectItem>
                        <SelectItem value="إحالة">إحالة من عميل</SelectItem>
                        <SelectItem value="موقع">الموقع الإلكتروني</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-muted-foreground" />
                    الأولوية
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "1", label: "متوسط", stars: 1 },
                      { value: "2", label: "مرتفع", stars: 2 },
                      { value: "3", label: "مرتفع جداً", stars: 3 },
                    ].map((p) => (
                      <button key={p.value} onClick={() => handleFormChange("priority", p.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                          form.priority === p.value ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-border hover:border-yellow-200"
                        }`}>
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= p.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع العقار
                    </label>
                    <Select value={form.type} onValueChange={(v) => handleFormChange("type", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="سكن خاص">سكن خاص</SelectItem>
                        <SelectItem value="استثماري">استثماري</SelectItem>
                        <SelectItem value="تجاري">تجاري</SelectItem>
                        <SelectItem value="صناعي">صناعي</SelectItem>
                        <SelectItem value="حكومي">حكومي</SelectItem>
                        <SelectItem value="مخازن/شبرات">مخازن / شبرات</SelectItem>
                        <SelectItem value="مساجد">مساجد</SelectItem>
                        <SelectItem value="مزارع">مزارع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع الخدمة
                    </label>
                    <Select value={form.serviceType} onValueChange={(v) => handleFormChange("serviceType", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع الخدمة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="بناء جديد">بناء جديد</SelectItem>
                        <SelectItem value="هدم">هدم</SelectItem>
                        <SelectItem value="تعديل">تعديل</SelectItem>
                        <SelectItem value="إضافة">إضافة</SelectItem>
                        <SelectItem value="تعديل وإضافة">تعديل وإضافة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      الإيرادات المتوقعة (د.ك)
                    </label>
                    <Input type="number" placeholder="0" dir="ltr" className="text-right" value={form.expectedRevenue} onChange={(e) => handleFormChange("expectedRevenue", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                      احتمالية التعاقد (%)
                    </label>
                    <Input type="number" placeholder="10" min="0" max="100" dir="ltr" className="text-right" value={form.probability} onChange={(e) => handleFormChange("probability", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      تاريخ الإغلاق المتوقع
                    </label>
                    <Input type="date" dir="ltr" className="text-right" value={form.expectedClosing} onChange={(e) => handleFormChange("expectedClosing", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      الوسوم
                    </label>
                    <Input placeholder="بناء جديد, ذهبية (مفصولة بفاصلة)" value={form.tags} onChange={(e) => handleFormChange("tags", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ملاحظات داخلية</label>
                  <Textarea placeholder="أضف ملاحظات عن هذه الفرصة..." rows={5} value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)} />
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-bold">ملخص الفرصة</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">العميل:</span> <span className="font-medium">{form.name || "—"}</span></div>
                    <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium" dir="ltr">{form.phone || "—"}</span></div>
                    <div><span className="text-muted-foreground">نوع العقار:</span> <span className="font-medium">{form.type || "—"}</span></div>
                    <div><span className="text-muted-foreground">نوع الخدمة:</span> <span className="font-medium">{form.serviceType || "—"}</span></div>
                    <div><span className="text-muted-foreground">الإيرادات:</span> <span className="font-medium">{form.expectedRevenue ? `${form.expectedRevenue} د.ك` : "—"}</span></div>
                    <div><span className="text-muted-foreground">المسؤول:</span> <span className="font-medium">{form.salesperson || "—"}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setForm(emptyForm); setActiveTab("basic"); }}>إلغاء</Button>
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <Button variant="outline" onClick={() => setActiveTab(activeTab === "notes" ? "details" : "basic")}>السابق</Button>
              )}
              {activeTab !== "notes" ? (
                <Button onClick={() => setActiveTab(activeTab === "basic" ? "details" : "notes")} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>التالي</Button>
              ) : (
                <Button onClick={handleSubmit} style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الفرصة
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
