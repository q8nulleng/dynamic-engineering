/*
 * Design: Desert Oasis Professional
 * CRM - Kanban board with detailed lead forms
 * Updated with Odoo.sh fields + New Opportunity Dialog
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
  Plus, Phone, Mail, MoreVertical, Star, DollarSign, User,
  Calendar, FileText, Trophy, X, MessageCircle, Send, Activity,
  ChevronDown, ChevronUp, TrendingUp, Building, MapPin, Hash,
  Percent, Tag, UserCheck, Save, ClipboardList
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
  stage?: string;
}

const initialColumns: { title: string; color: string; leads: Lead[] }[] = [
  {
    title: "استفسار جديد",
    color: "oklch(0.55 0.15 250)",
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
    leads: [
      {
        name: "خالد الرشيدي", phone: "9988 7766", email: "khaled@email.com", type: "سكن خاص", source: "واتساب", date: "هذا الأسبوع",
        expectedRevenue: "1,500", probability: 100, priority: 2, salesperson: "أحمد", expectedClosing: "2026-04-20",
        tags: ["بناء جديد", "أساسية"], quotations: 1, civilId: "277040100612", serviceType: "بناء جديد",
      },
    ],
  },
];

const priorityLabels = ["", "متوسط", "مرتفع", "مرتفع جداً"];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  civilId: "",
  type: "",
  serviceType: "",
  source: "",
  salesperson: "",
  expectedRevenue: "",
  probability: "",
  expectedClosing: "",
  priority: "",
  tags: "",
  notes: "",
};

export default function CRM() {
  const [columns, setColumns] = useState(initialColumns);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "notes">("basic");

  const totalRevenue = columns.reduce((sum, col) =>
    sum + col.leads.reduce((s, l) => s + parseFloat(l.expectedRevenue.replace(",", "") || "0"), 0), 0);
  const totalLeads = columns.reduce((sum, col) => sum + col.leads.length, 0);
  const avgProbability = totalLeads > 0 ? Math.round(columns.reduce((sum, col) =>
    sum + col.leads.reduce((s, l) => s + l.probability, 0), 0) / totalLeads) : 0;

  const handleFormChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }

    const newLead: Lead = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      civilId: form.civilId || undefined,
      type: form.type || "سكن خاص",
      serviceType: form.serviceType || "بناء جديد",
      source: form.source || "اتصال",
      salesperson: form.salesperson || "أحمد",
      expectedRevenue: form.expectedRevenue || "0",
      probability: parseInt(form.probability) || 10,
      expectedClosing: form.expectedClosing || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      priority: (parseInt(form.priority) || 1) as 0 | 1 | 2 | 3,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [form.serviceType || "بناء جديد"],
      quotations: 0,
      date: "الآن",
      notes: form.notes || undefined,
    };

    setColumns(prev => {
      const updated = [...prev];
      updated[0] = { ...updated[0], leads: [newLead, ...updated[0].leads] };
      return updated;
    });

    setForm(emptyForm);
    setActiveTab("basic");
    setShowNewDialog(false);
    toast.success(`تمت إضافة فرصة "${form.name}" بنجاح`, {
      description: "تم إضافتها في مرحلة 'استفسار جديد'",
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">تتبع العملاء من الاستفسار حتى التعاقد</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 ml-1" />
            بريد إلكتروني
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 ml-1" />
            SMS
          </Button>
          <Button
            style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
            onClick={() => setShowNewDialog(true)}
          >
            <Plus className="w-4 h-4 ml-2" />
            فرصة جديدة
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الفرص</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.72 0.10 60 / 0.15)" }}>
              <DollarSign className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الإيرادات المتوقعة</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalRevenue.toLocaleString()} <span className="text-xs font-normal">د.ك</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">متوسط الاحتمالية</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{avgProbability}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50">
              <Trophy className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تم التعاقد</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{columns[3].leads.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 320px)" }}>
        {columns.map((col, ci) => (
          <div key={ci} className="min-w-[320px] w-[320px] shrink-0">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-bold">{col.title}</h3>
              <Badge variant="secondary" className="text-xs mr-auto">{col.leads.length}</Badge>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>
                {col.leads.reduce((s, l) => s + parseFloat(l.expectedRevenue.replace(",", "")), 0).toLocaleString()} د.ك
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {col.leads.map((lead, li) => {
                const isExpanded = expandedLead === `${ci}-${li}`;
                return (
                  <Card key={li} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setExpandedLead(isExpanded ? null : `${ci}-${li}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate">{lead.name}</h4>
                          {/* Priority Stars */}
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= lead.priority ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                            ))}
                            {lead.priority > 0 && (
                              <span className="text-[10px] text-muted-foreground mr-1">{priorityLabels[lead.priority]}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -ml-1" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      </div>

                      {/* Revenue & Probability */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold" style={{ color: "oklch(0.72 0.10 60)", fontFamily: "'Space Grotesk'" }}>
                            {lead.expectedRevenue}
                          </span>
                          <span className="text-[10px] text-muted-foreground">د.ك</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${lead.probability}%`,
                              backgroundColor: lead.probability >= 70 ? "oklch(0.55 0.15 150)" : lead.probability >= 40 ? "oklch(0.72 0.10 60)" : "oklch(0.55 0.15 250)"
                            }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{lead.probability}%</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{lead.type}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{lead.source}</Badge>
                        {lead.tags.map((tag, ti) => (
                          <Badge key={ti} className="text-[10px] text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{tag}</Badge>
                        ))}
                      </div>

                      {/* Smart Buttons */}
                      <div className="flex items-center gap-2 mt-2">
                        {lead.quotations > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            <FileText className="w-3 h-3 inline ml-0.5" />
                            {lead.quotations} عرض سعر
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground mr-auto">
                          <User className="w-3 h-3 inline ml-0.5" />
                          {lead.salesperson}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">تاريخ الإغلاق المتوقع:</span>
                              <p className="font-medium" dir="ltr">{lead.expectedClosing}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">المصدر:</span>
                              <p className="font-medium">{lead.source}</p>
                            </div>
                            {lead.civilId && (
                              <div>
                                <span className="text-muted-foreground">الرقم المدني:</span>
                                <p className="font-medium" dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{lead.civilId}</p>
                              </div>
                            )}
                            {lead.serviceType && (
                              <div>
                                <span className="text-muted-foreground">نوع الخدمة:</span>
                                <p className="font-medium">{lead.serviceType}</p>
                              </div>
                            )}
                          </div>
                          {lead.notes && (
                            <div className="text-xs">
                              <span className="text-muted-foreground">ملاحظات:</span>
                              <p className="font-medium mt-0.5">{lead.notes}</p>
                            </div>
                          )}
                          {/* Action Buttons */}
                          <div className="flex gap-1.5 flex-wrap">
                            <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                              <FileText className="w-3 h-3 ml-1" />
                              عرض سعر جديد
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
                    </CardContent>
                  </Card>
                );
              })}

              {/* Add card button */}
              <button
                className="w-full py-3 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
                onClick={() => setShowNewDialog(true)}
              >
                <Plus className="w-4 h-4" />
                إضافة
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== New Opportunity Dialog ==================== */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Dialog Header */}
          <div className="sticky top-0 z-10 bg-background border-b">
            <DialogHeader className="p-5 pb-0">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                  <Plus className="w-4 h-4 text-white" />
                </div>
                فرصة جديدة
              </DialogTitle>
            </DialogHeader>

            {/* Tabs */}
            <div className="flex gap-0 px-5 pt-4">
              {[
                { key: "basic" as const, label: "البيانات الأساسية", icon: User },
                { key: "details" as const, label: "تفاصيل المشروع", icon: Building },
                { key: "notes" as const, label: "ملاحظات", icon: ClipboardList },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? "border-current text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === tab.key ? { borderColor: "oklch(0.72 0.10 60)" } : {}}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-5 space-y-5">
            {/* ===== Tab 1: البيانات الأساسية ===== */}
            {activeTab === "basic" && (
              <div className="space-y-5">
                {/* اسم العميل + الهاتف */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      اسم العميل <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="أدخل اسم العميل الكامل"
                      value={form.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="9XXX XXXX"
                      dir="ltr"
                      className="text-right"
                      value={form.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                {/* البريد + الرقم المدني */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      البريد الإلكتروني
                    </label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      dir="ltr"
                      className="text-right"
                      value={form.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      الرقم المدني
                    </label>
                    <Input
                      placeholder="أدخل الرقم المدني (12 رقم)"
                      dir="ltr"
                      className="text-right"
                      maxLength={12}
                      value={form.civilId}
                      onChange={(e) => handleFormChange("civilId", e.target.value)}
                    />
                  </div>
                </div>

                {/* المسؤول + المصدر */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                      المسؤول (Salesperson)
                    </label>
                    <Select value={form.salesperson} onValueChange={(v) => handleFormChange("salesperson", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المسؤول" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder="كيف وصل العميل؟" />
                      </SelectTrigger>
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

                {/* الأولوية */}
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
                      <button
                        key={p.value}
                        onClick={() => handleFormChange("priority", p.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                          form.priority === p.value
                            ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                            : "border-border hover:border-yellow-200"
                        }`}
                      >
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

            {/* ===== Tab 2: تفاصيل المشروع ===== */}
            {activeTab === "details" && (
              <div className="space-y-5">
                {/* نوع العقار + نوع الخدمة */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع العقار
                    </label>
                    <Select value={form.type} onValueChange={(v) => handleFormChange("type", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع العقار" />
                      </SelectTrigger>
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
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الخدمة" />
                      </SelectTrigger>
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

                {/* الإيرادات المتوقعة + الاحتمالية */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      الإيرادات المتوقعة (د.ك)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      dir="ltr"
                      className="text-right"
                      value={form.expectedRevenue}
                      onChange={(e) => handleFormChange("expectedRevenue", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                      احتمالية التعاقد (%)
                    </label>
                    <Input
                      type="number"
                      placeholder="10"
                      min="0"
                      max="100"
                      dir="ltr"
                      className="text-right"
                      value={form.probability}
                      onChange={(e) => handleFormChange("probability", e.target.value)}
                    />
                  </div>
                </div>

                {/* تاريخ الإغلاق المتوقع + الوسوم */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      تاريخ الإغلاق المتوقع
                    </label>
                    <Input
                      type="date"
                      dir="ltr"
                      className="text-right"
                      value={form.expectedClosing}
                      onChange={(e) => handleFormChange("expectedClosing", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                      الوسوم (Tags)
                    </label>
                    <Input
                      placeholder="مثال: بناء جديد, ذهبية (مفصولة بفاصلة)"
                      value={form.tags}
                      onChange={(e) => handleFormChange("tags", e.target.value)}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-lg p-3 text-xs text-muted-foreground" style={{ backgroundColor: "oklch(0.72 0.10 60 / 0.08)" }}>
                  <p className="font-medium mb-1" style={{ color: "oklch(0.55 0.10 60)" }}>💡 ملاحظة</p>
                  <p>سيتم تحديد الباقة الهندسية المناسبة تلقائياً بناءً على نوع العقار ونوع الخدمة عند إنشاء عرض السعر.</p>
                </div>
              </div>
            )}

            {/* ===== Tab 3: ملاحظات ===== */}
            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                    ملاحظات داخلية
                  </label>
                  <Textarea
                    placeholder="أضف أي ملاحظات أو تفاصيل إضافية عن هذه الفرصة..."
                    rows={5}
                    value={form.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">هذه الملاحظات داخلية ولن تظهر للعميل</p>
                </div>

                {/* Quick Summary */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="text-sm font-bold">ملخص الفرصة</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">العميل:</span>
                      <p className="font-medium">{form.name || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الهاتف:</span>
                      <p className="font-medium" dir="ltr">{form.phone || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">نوع العقار:</span>
                      <p className="font-medium">{form.type || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">نوع الخدمة:</span>
                      <p className="font-medium">{form.serviceType || "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الإيرادات المتوقعة:</span>
                      <p className="font-medium">{form.expectedRevenue ? `${form.expectedRevenue} د.ك` : "—"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">المسؤول:</span>
                      <p className="font-medium">{form.salesperson || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setForm(emptyForm); setActiveTab("basic"); }}>
              إلغاء
            </Button>
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <Button
                  variant="outline"
                  onClick={() => setActiveTab(activeTab === "notes" ? "details" : "basic")}
                >
                  السابق
                </Button>
              )}
              {activeTab !== "notes" ? (
                <Button
                  onClick={() => setActiveTab(activeTab === "basic" ? "details" : "notes")}
                  style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                >
                  التالي
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                >
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
