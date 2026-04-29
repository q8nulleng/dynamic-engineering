import { useState } from "react";
import { useLocation } from "wouter";
import {
  Users, Plus, Search, Phone, MapPin, FileText,
  Building2, Home, Factory, TrendingUp, ChevronLeft,
  Filter, MoreVertical, Eye, Edit2, Trash2, MessageSquare,
  CheckCircle2, Clock, AlertCircle, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

// ==============================
// بيانات العملاء التجريبية
// ==============================
export const clientsDB: Client[] = [
  {
    id: "C001",
    name: "فهد عبدالله العتيبي",
    phone: "99001122",
    phone2: "55001122",
    civilId: "281011234567",
    email: "fahad@example.com",
    type: "individual",
    area: "خيطان",
    block: "2",
    plot: "212",
    parcelArea: 400,
    parcelShape: "زاوية",
    parcelFacing: "شمال",
    ownershipDoc: "12345",
    ownershipDate: "2018-05-10",
    spouseName: "نوف سالم العنزي",
    spouseCivilId: "285021234567",
    projects: ["S00048"],
    status: "active",
    rating: 5,
    notes: "عميل مميز، سريع في التجاوب",
    createdAt: "2025-01-15",
    projectType: "سكن خاص",
    serviceType: "بناء جديد",
  },
  {
    id: "C002",
    name: "محمد يوسف الرشيدي",
    phone: "66112233",
    phone2: "",
    civilId: "275031234567",
    email: "",
    type: "individual",
    area: "الفروانية",
    block: "5",
    plot: "88",
    parcelArea: 325,
    parcelShape: "مستطيل",
    parcelFacing: "جنوب",
    ownershipDoc: "67890",
    ownershipDate: "2020-03-22",
    spouseName: "",
    spouseCivilId: "",
    projects: ["S00045"],
    status: "active",
    rating: 4,
    notes: "",
    createdAt: "2025-02-20",
    projectType: "سكن خاص",
    serviceType: "تعديل وإضافة",
  },
  {
    id: "C003",
    name: "ورثة عبدالحميد خميس الخميس",
    phone: "55443322",
    phone2: "99443322",
    civilId: "",
    email: "",
    type: "heirs",
    area: "القادسية",
    block: "2",
    plot: "113",
    parcelArea: 500,
    parcelShape: "مستطيل",
    parcelFacing: "شرق",
    ownershipDoc: "11223",
    ownershipDate: "2015-11-05",
    spouseName: "",
    spouseCivilId: "",
    projects: ["S00040", "S00041"],
    status: "active",
    rating: 3,
    notes: "ملف ورثة - يحتاج وكالة",
    createdAt: "2024-11-10",
    projectType: "سكن خاص",
    serviceType: "تعديل وإضافة",
  },
  {
    id: "C004",
    name: "شركة الخليج للتطوير العقاري",
    phone: "22334455",
    phone2: "",
    civilId: "",
    email: "info@gulf-dev.com",
    type: "company",
    area: "الشويخ الصناعي",
    block: "3",
    plot: "44",
    parcelArea: 2000,
    parcelShape: "مستطيل",
    parcelFacing: "شمال",
    ownershipDoc: "55667",
    ownershipDate: "2019-07-18",
    spouseName: "",
    spouseCivilId: "",
    projects: ["S00035"],
    status: "active",
    rating: 4,
    notes: "شركة - التواصل مع م. خالد المدير",
    createdAt: "2024-09-05",
    projectType: "صناعي",
    serviceType: "بناء جديد",
  },
  {
    id: "C005",
    name: "عبدالله سرحان فلاح اليبسلي",
    phone: "97887766",
    phone2: "",
    civilId: "268041234567",
    email: "",
    type: "individual",
    area: "ضاحية صباح السالم",
    block: "9",
    plot: "225",
    parcelArea: 450,
    parcelShape: "مستطيل",
    parcelFacing: "غرب",
    ownershipDoc: "33445",
    ownershipDate: "2022-01-30",
    spouseName: "فاطمة علي الحربي",
    spouseCivilId: "272051234567",
    projects: ["S00030"],
    status: "completed",
    rating: 5,
    notes: "تم إنهاء المشروع بنجاح",
    createdAt: "2024-06-12",
    projectType: "سكن خاص",
    serviceType: "تعديل وإضافة",
  },
];

export interface Client {
  id: string;
  name: string;
  phone: string;
  phone2: string;
  civilId: string;
  email: string;
  type: "individual" | "company" | "heirs";
  area: string;
  block: string;
  plot: string;
  parcelArea: number;
  parcelShape: string;
  parcelFacing: string;
  ownershipDoc: string;
  ownershipDate: string;
  spouseName: string;
  spouseCivilId: string;
  projects: string[];
  status: "active" | "completed" | "pending";
  rating: number;
  notes: string;
  createdAt: string;
  projectType: string;
  serviceType: string;
}

const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
  individual: { label: "فرد", icon: Home, color: "bg-blue-100 text-blue-700" },
  company: { label: "شركة", icon: Building2, color: "bg-purple-100 text-purple-700" },
  heirs: { label: "ورثة", icon: Users, color: "bg-amber-100 text-amber-700" },
};

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  completed: { label: "منتهي", color: "bg-gray-100 text-gray-600", icon: CheckCircle2 },
  pending: { label: "بانتظار", color: "bg-yellow-100 text-yellow-700", icon: Clock },
};

const projectTypeColors: Record<string, string> = {
  "سكن خاص": "bg-blue-500",
  "صناعي": "bg-orange-500",
  "استثماري": "bg-green-500",
  "تجاري": "bg-yellow-500",
};

// ==============================
// نموذج إضافة عميل جديد
// ==============================
function NewClientDialog({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (client: Client) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", phone: "", phone2: "", civilId: "", email: "",
    type: "individual" as Client["type"],
    spouseName: "", spouseCivilId: "",
    area: "", block: "", plot: "", parcelArea: "",
    parcelShape: "مستطيل", parcelFacing: "شمال",
    ownershipDoc: "", ownershipDate: "",
    projectType: "سكن خاص", serviceType: "بناء جديد",
    notes: "",
  });

  const kuwaiti_areas = [
    "خيطان", "الفروانية", "الرقعي", "العارضية", "أبو فطيرة",
    "السالمية", "حولي", "الرميثية", "بيان", "مشرف",
    "الجابرية", "النزهة", "الزهراء", "الشعب", "القادسية",
    "العدان", "المنقف", "الفنطاس", "أبو حليفة", "الأحمدي",
    "الصليبيخات", "الشامية", "الروضة", "الخالدية", "القيروان",
    "ضاحية صباح السالم", "الشويخ الصناعي", "الري", "المطلاع",
    "الجهراء", "تيماء", "العيون", "النعيم",
  ];

  const serviceTypes: Record<string, string[]> = {
    "سكن خاص": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم", "إشراف"],
    "صناعي": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"],
    "استثماري": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"],
    "تجاري": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "هدم"],
  };

  const handleSubmit = () => {
    if (!form.name || !form.phone) {
      toast.error("يرجى إدخال الاسم ورقم الهاتف");
      return;
    }
    const newClient: Client = {
      id: `C${String(clientsDB.length + 1).padStart(3, "0")}`,
      name: form.name,
      phone: form.phone,
      phone2: form.phone2,
      civilId: form.civilId,
      email: form.email,
      type: form.type,
      area: form.area,
      block: form.block,
      plot: form.plot,
      parcelArea: Number(form.parcelArea) || 0,
      parcelShape: form.parcelShape,
      parcelFacing: form.parcelFacing,
      ownershipDoc: form.ownershipDoc,
      ownershipDate: form.ownershipDate,
      spouseName: form.spouseName,
      spouseCivilId: form.spouseCivilId,
      projects: [],
      status: "pending",
      rating: 0,
      notes: form.notes,
      createdAt: new Date().toISOString().split("T")[0],
      projectType: form.projectType,
      serviceType: form.serviceType,
    };
    onAdd(newClient);
    toast.success(`تم إضافة العميل ${form.name} بنجاح`);
    onClose();
    setStep(1);
    setForm({
      name: "", phone: "", phone2: "", civilId: "", email: "",
      type: "individual", spouseName: "", spouseCivilId: "",
      area: "", block: "", plot: "", parcelArea: "",
      parcelShape: "مستطيل", parcelFacing: "شمال",
      ownershipDoc: "", ownershipDate: "",
      projectType: "سكن خاص", serviceType: "بناء جديد", notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            إضافة عميل جديد
          </DialogTitle>
          {/* شريط الخطوات */}
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
                }`}>{s}</div>
                <div className={`text-xs ${step >= s ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                  {s === 1 ? "البيانات الشخصية" : s === 2 ? "بيانات القسيمة" : "نوع الخدمة"}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 mx-1 ${step > s ? "bg-blue-600" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="py-2 space-y-3">
          {/* الخطوة 1: البيانات الشخصية */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">نوع العميل</label>
                <div className="flex gap-2">
                  {(["individual", "company", "heirs"] as const).map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        form.type === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                      }`}>
                      {typeLabels[t].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">الاسم الكامل *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={form.type === "company" ? "اسم الشركة" : form.type === "heirs" ? "ورثة ..." : "الاسم الرباعي"} className="text-right text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">رقم الهاتف *</label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9XXXXXXX" className="text-right text-sm" dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">هاتف بديل</label>
                  <Input value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })}
                    placeholder="اختياري" className="text-right text-sm" dir="ltr" />
                </div>
              </div>
              {form.type !== "company" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">الرقم المدني</label>
                    <Input value={form.civilId} onChange={(e) => setForm({ ...form, civilId: e.target.value })}
                      placeholder="12 رقم" className="text-right text-sm" dir="ltr" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">البريد الإلكتروني</label>
                    <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="اختياري" className="text-right text-sm" dir="ltr" />
                  </div>
                </div>
              )}
              {form.type === "individual" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">اسم الزوجة</label>
                    <Input value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })}
                      placeholder="اختياري" className="text-right text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">رقمها المدني</label>
                    <Input value={form.spouseCivilId} onChange={(e) => setForm({ ...form, spouseCivilId: e.target.value })}
                      placeholder="اختياري" className="text-right text-sm" dir="ltr" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">ملاحظات</label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="ملاحظة اختيارية..." className="text-right text-sm" />
              </div>
            </div>
          )}

          {/* الخطوة 2: بيانات القسيمة */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">المنطقة</label>
                <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                  <option value="">اختر المنطقة...</option>
                  {kuwaiti_areas.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">القطعة</label>
                  <Input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}
                    placeholder="رقم" className="text-right text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">القسيمة</label>
                  <Input value={form.plot} onChange={(e) => setForm({ ...form, plot: e.target.value })}
                    placeholder="رقم" className="text-right text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">المساحة (م²)</label>
                  <Input value={form.parcelArea} onChange={(e) => setForm({ ...form, parcelArea: e.target.value })}
                    placeholder="400" className="text-right text-sm" type="number" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">شكل القسيمة</label>
                  <select value={form.parcelShape} onChange={(e) => setForm({ ...form, parcelShape: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                    <option>مستطيل</option>
                    <option>زاوية</option>
                    <option>مثلث</option>
                    <option>غير منتظم</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">وجهة القسيمة</label>
                  <select value={form.parcelFacing} onChange={(e) => setForm({ ...form, parcelFacing: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                    <option>شمال</option>
                    <option>جنوب</option>
                    <option>شرق</option>
                    <option>غرب</option>
                    <option>شمال شرق</option>
                    <option>شمال غرب</option>
                    <option>جنوب شرق</option>
                    <option>جنوب غرب</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">رقم وثيقة الملكية</label>
                  <Input value={form.ownershipDoc} onChange={(e) => setForm({ ...form, ownershipDoc: e.target.value })}
                    placeholder="رقم الوثيقة" className="text-right text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">تاريخ الوثيقة</label>
                  <Input value={form.ownershipDate} onChange={(e) => setForm({ ...form, ownershipDate: e.target.value })}
                    type="date" className="text-right text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* الخطوة 3: نوع الخدمة */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">نوع المشروع</label>
                <div className="grid grid-cols-2 gap-2">
                  {["سكن خاص", "صناعي", "استثماري", "تجاري"].map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, projectType: t, serviceType: "بناء جديد" })}
                      className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        form.projectType === t
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                      {t === "سكن خاص" ? "🏠" : t === "صناعي" ? "🏭" : t === "استثماري" ? "📈" : "🏪"} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">نوع الخدمة</label>
                <div className="grid grid-cols-3 gap-2">
                  {(serviceTypes[form.projectType] || []).map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, serviceType: s })}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        form.serviceType === s
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              {/* ملخص */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="font-semibold text-gray-700 mb-2">ملخص بيانات العميل</div>
                <div className="flex justify-between"><span className="text-gray-500">الاسم</span><span className="font-medium">{form.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">الهاتف</span><span>{form.phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">المنطقة</span><span>{form.area || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">القسيمة</span><span>{form.plot ? `${form.area} ق${form.block}/ق${form.plot}` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">نوع الخدمة</span><span className="font-medium text-blue-600">{form.projectType} — {form.serviceType}</span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 mt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              السابق
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1 bg-blue-600 hover:bg-blue-700">
              التالي
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 ml-1" />
              إضافة العميل
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==============================
// الصفحة الرئيسية
// ==============================
export default function Clients() {
  const [, navigate] = useLocation();
  const [clients, setClients] = useState<Client[]>(clientsDB);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filtered = clients.filter((c) => {
    const matchSearch = c.name.includes(search) || c.phone.includes(search) || c.area.includes(search);
    const matchType = filterType === "all" || c.type === filterType;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    projects: clients.reduce((acc, c) => acc + c.projects.length, 0),
    pending: clients.filter((c) => c.status === "pending").length,
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">إدارة العملاء</h1>
              <p className="text-xs text-gray-500">{stats.total} عميل مسجّل</p>
            </div>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Plus className="w-4 h-4" />
            عميل جديد
          </Button>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: "إجمالي العملاء", value: stats.total, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "نشطون", value: stats.active, color: "text-green-600", bg: "bg-green-50" },
            { label: "إجمالي المشاريع", value: stats.projects, color: "text-purple-600", bg: "bg-purple-50" },
            { label: "بانتظار", value: stats.pending, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* فلاتر وبحث */}
      <div className="px-6 py-3 bg-white border-b flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف أو المنطقة..."
            className="pr-9 text-right text-sm" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-right bg-white">
          <option value="all">كل الأنواع</option>
          <option value="individual">أفراد</option>
          <option value="company">شركات</option>
          <option value="heirs">ورثة</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-right bg-white">
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="completed">منتهي</option>
          <option value="pending">بانتظار</option>
        </select>
        <span className="text-sm text-gray-500">{filtered.length} نتيجة</span>
      </div>

      {/* قائمة العملاء */}
      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">لا يوجد عملاء</p>
            <p className="text-sm mt-1">اضغط "عميل جديد" لإضافة أول عميل</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((client) => {
              const typeInfo = typeLabels[client.type];
              const statusInfo = statusLabels[client.status];
              const TypeIcon = typeInfo.icon;
              const StatusIcon = statusInfo.icon;

              return (
                <div key={client.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/clients/${client.id}`)}>
                  {/* شريط اللون العلوي */}
                  <div className={`h-1.5 rounded-t-2xl ${projectTypeColors[client.projectType] || "bg-gray-400"}`} />

                  <div className="p-4">
                    {/* الرأس */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${
                          client.type === "company" ? "bg-purple-100 text-purple-700" :
                          client.type === "heirs" ? "bg-amber-100 text-amber-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{client.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-right">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}>
                            <Eye className="w-4 h-4 ml-2" /> عرض الملف
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`tel:${client.phone}`); }}>
                            <Phone className="w-4 h-4 ml-2" /> اتصال
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/965${client.phone}`); }}>
                            <MessageSquare className="w-4 h-4 ml-2" /> واتساب
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* بيانات الاتصال */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span dir="ltr">{client.phone}</span>
                        {client.phone2 && <span className="text-gray-400">/ {client.phone2}</span>}
                      </div>
                      {client.area && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{client.area} — ق{client.block} / {client.plot}</span>
                          {client.parcelArea > 0 && <span className="text-gray-400">({client.parcelArea}م²)</span>}
                        </div>
                      )}
                    </div>

                    {/* الفاصل */}
                    <div className="border-t pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${projectTypeColors[client.projectType] || "bg-gray-400"}`} />
                        <span className="text-xs text-gray-500">{client.projectType}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-xs text-gray-500">{client.serviceType}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{client.projects.length} مشروع</span>
                      </div>
                    </div>

                    {/* ملاحظة */}
                    {client.notes && (
                      <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                        {client.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewClientDialog
        open={showNewDialog}
        onClose={() => setShowNewDialog(false)}
        onAdd={(c) => setClients([...clients, c])}
      />
    </div>
  );
}
