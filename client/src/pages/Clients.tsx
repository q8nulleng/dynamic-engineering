import { useState } from "react";
import { useLocation } from "wouter";
import { useClients, useCreateClient, useProjects } from "@/lib/api";
import {
  Users, Plus, Search, Phone, MapPin, FileText,
  Building2, Home, MoreVertical, Eye, MessageSquare, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const clientsDB: Client[] = [];

export interface Client {
  id: string;
  name: string;
  phone: string;
  phone2: string;
  civilId: string;
  email: string;
  type: "individual" | "company" | "heirs";
  governorate: string;
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
  status: "active" | "completed" | "pending";
  rating: number;
  notes: string;
  createdAt: string;
  projectType: string;
  serviceType: string;
  projectSummary?: string;
}

export const kuwaitGovernorates: Record<string, string[]> = {
  "محافظة العاصمة": [
    "شرق", "مرقاب", "قبلة", "الميناء", "الديرة", "الوطية",
    "الشامية", "الروضة", "الخالدية", "النزهة",
    "كيفان", "الفيحاء", "اليرموك", "المنصورية", "الغرب",
    "ضاحية عبدالله السالم", "بنيد القار", "الدعية", "العديلية",
    "الدسمة", "الصليبيخات", "الشويخ الصناعي", "السرة",
    "أم الجسم", "البنيان", "فيلكا", "أخرى",
  ],
  "محافظة حولي": [
    "السالمية", "حولي", "الرميثية", "بيان", "مشرف",
    "الجابرية", "الزهراء", "الشعب", "القادسية",
    "سلوى", "الرقة", "العقيلة", "البدع", "ميدان حولي", "الشهداء", "أخرى",
  ],
  "محافظة الفروانية": [
    "خيطان", "الفروانية", "الرقعي", "العارضية", "أبو فطيرة",
    "ضاحية صباح السالم", "الأندلس", "الرابية", "إشبيلية",
    "الضجيج", "جليب الشيوخ", "عبدالله المبارك", "الفردوس",
    "الصليبية", "الحساوية", "أخرى",
  ],
  "محافظة مبارك الكبير": [
    "العدان", "المنقف", "الري", "صباح السالم",
    "أبو الحصانية", "القصور", "مبارك الكبير", "الفنيطيس", "الصباحية", "أخرى",
  ],
  "محافظة الأحمدي": [
    "الفنطاس", "أبو حليفة", "الأحمدي", "العيون", "هدية",
    "الظهر", "علي صباح السالم", "المقوع", "ضاحية جابر العلي",
    "الرقة", "الوفرة", "الزور", "الخيران", "المنطقة الصناعية", "أخرى",
  ],
  "محافظة الجهراء": [
    "الجهراء", "المطلاع", "تيماء", "النعيم", "القيروان",
    "كاظمة", "السبية", "أم العيش", "الواحة", "الناعم",
    "أمغرة", "القصر", "الوفرة الزراعية", "أخرى",
  ],
};

export const serviceTypes: Record<string, string[]> = {
  "سكن خاص": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "هدم", "إشراف"],
  "صناعي": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "هدم"],
  "استثماري": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "هدم"],
  "تجاري": ["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "هدم"],
};

const typeLabels: Record<string, { label: string; color: string }> = {
  individual: { label: "فرد", color: "bg-blue-100 text-blue-700" },
  company: { label: "شركة", color: "bg-purple-100 text-purple-700" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  completed: { label: "منتهي", color: "bg-gray-100 text-gray-600" },
  pending: { label: "بانتظار", color: "bg-yellow-100 text-yellow-700" },
};

export const projectTypeColors: Record<string, string> = {
  "سكن خاص": "bg-blue-500",
  "صناعي": "bg-orange-500",
  "استثماري": "bg-green-500",
  "تجاري": "bg-yellow-500",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

// ── نموذج إضافة عميل جديد ──────────────────────────────────────────────────
function NewClientDialog({ open, onClose, onAdd }: {
  open: boolean;
  onClose: () => void;
  onAdd: (client: Omit<Client, "id">) => void;
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", phone: "", phone2: "", civilId: "", email: "",
    type: "individual" as Client["type"],
    spouseName: "", spouseCivilId: "",
    governorate: "", area: "", customArea: "", block: "", plot: "", parcelArea: "",
    parcelShape: "مستطيل", parcelFacing: "شمال",
    ownershipDoc: "", ownershipDate: "",
    projectType: "سكن خاص", serviceType: "بناء جديد",
    notes: "",
  });

  const govAreas = form.governorate ? (kuwaitGovernorates[form.governorate] || []) : [];

  const handleSubmit = () => {
    if (!form.name || !form.phone) {
      toast.error("يرجى إدخال الاسم ورقم الهاتف");
      return;
    }
    onAdd({
      name: form.name, phone: form.phone, phone2: form.phone2,
      civilId: form.civilId, email: form.email, type: form.type,
      governorate: form.governorate,
      area: form.area === "أخرى" && form.customArea ? form.customArea : form.area,
      block: form.block, plot: form.plot,
      parcelArea: Number(form.parcelArea) || 0, parcelShape: form.parcelShape,
      parcelFacing: form.parcelFacing, ownershipDoc: form.ownershipDoc,
      ownershipDate: form.ownershipDate, spouseName: form.spouseName,
      spouseCivilId: form.spouseCivilId, status: "pending", rating: 0,
      notes: form.notes, createdAt: new Date().toISOString().split("T")[0],
      projectType: form.projectType, serviceType: form.serviceType,
    });
    toast.success(`تم إضافة العميل ${form.name} بنجاح`);
    onClose();
    setStep(1);
    setForm({
      name: "", phone: "", phone2: "", civilId: "", email: "",
      type: "individual", spouseName: "", spouseCivilId: "",
      governorate: "", area: "", customArea: "", block: "", plot: "", parcelArea: "",
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
                  {(["individual", "company"] as const).map((t) => (
                    <button key={t} onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                        form.type === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                      }`}>
                      {t === "individual" ? "🏠 فرد" : "🏢 شركة"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">الاسم الكامل *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={form.type === "company" ? "اسم الشركة" : "الاسم الرباعي"} className="text-right text-sm" />
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">المحافظة</label>
                  <select
                    value={form.governorate}
                    onChange={(e) => setForm({ ...form, governorate: e.target.value, area: "" })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                    <option value="">اختر المحافظة...</option>
                    {Object.keys(kuwaitGovernorates).map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">المنطقة</label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value, customArea: "" })}
                    className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white"
                    disabled={!form.governorate}>
                    <option value="">اختر المنطقة...</option>
                    {govAreas.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                  {form.area === "أخرى" && (
                    <Input
                      value={form.customArea}
                      onChange={(e) => setForm({ ...form, customArea: e.target.value })}
                      placeholder="اكتب اسم المنطقة..."
                      className="text-right text-sm mt-1"
                    />
                  )}
                </div>
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
                <label className="text-xs font-medium text-gray-600 mb-2 block">نوع المعاملة</label>
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
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
                <div className="font-semibold text-gray-700 mb-2">ملخص بيانات العميل</div>
                <div className="flex justify-between"><span className="text-gray-500">الاسم</span><span className="font-medium">{form.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">الهاتف</span><span>{form.phone || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">المحافظة</span><span>{form.governorate || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">المنطقة</span><span>{form.area || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">القسيمة</span><span>{form.plot ? `ق${form.block}/ق${form.plot}` : "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">نوع الخدمة</span><span className="font-medium text-blue-600">{form.projectType} — {form.serviceType}</span></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 mt-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">السابق</Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="flex-1 bg-blue-600 hover:bg-blue-700">التالي</Button>
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

// ── الصفحة الرئيسية ──────────────────────────────────────────────────────────
export default function Clients() {
  const [, navigate] = useLocation();
  const { data: clients = [], isLoading } = useClients();
  const { data: allProjects = [] } = useProjects();
  const createClient = useCreateClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProjectType, setFilterProjectType] = useState("all");
  const [filterServiceType, setFilterServiceType] = useState("all");
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(search) ||
      (c.area || "").includes(search) ||
      (c.governorate || "").includes(search);
    const matchType = filterType === "all" || c.type === filterType;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    const matchPT = filterProjectType === "all" || c.projectType === filterProjectType;
    const matchST = filterServiceType === "all" || c.serviceType === filterServiceType;
    return matchSearch && matchType && matchStatus && matchPT && matchST;
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    projects: allProjects.length,
    pending: clients.filter((c) => c.status === "pending").length,
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

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
      <div className="px-6 py-3 bg-white border-b flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
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
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-right bg-white">
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="completed">منتهي</option>
          <option value="pending">بانتظار</option>
        </select>
        <select value={filterProjectType} onChange={(e) => setFilterProjectType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-right bg-white">
          <option value="all">كل المعاملات</option>
          <option value="سكن خاص">سكن خاص</option>
          <option value="صناعي">صناعي</option>
          <option value="استثماري">استثماري</option>
          <option value="تجاري">تجاري</option>
        </select>
        <select value={filterServiceType} onChange={(e) => setFilterServiceType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm text-right bg-white">
          <option value="all">كل الخدمات</option>
          <option value="بناء جديد">بناء جديد</option>
          <option value="تعديل">تعديل</option>
          <option value="إضافة">إضافة</option>
          <option value="تعديل وإضافة">تعديل وإضافة</option>
          <option value="إضافة مبنى قائم">إضافة مبنى قائم</option>
          <option value="هدم">هدم</option>
          <option value="إشراف">إشراف</option>
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
              const typeInfo = typeLabels[client.type] ?? typeLabels["individual"];
              const statusInfo = statusLabels[client.status];
              const clientProjects = allProjects.filter((p) => p.clientId === client.id);

              return (
                <div key={client.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(`/clients/${client.id}`)}>
                  <div className={`h-1.5 rounded-t-2xl ${projectTypeColors[client.projectType] || "bg-gray-400"}`} />

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${
                          client.type === "company" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{client.name}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          {client.rating > 0 && (
                            <div className="mt-1"><StarRating rating={client.rating} /></div>
                          )}
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

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span dir="ltr">{client.phone}</span>
                        {client.phone2 && <span className="text-gray-400">/ {client.phone2}</span>}
                      </div>
                      {(client.governorate || client.area) && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {client.governorate && (
                              <span className="text-gray-400">{client.governorate.replace("محافظة ", "")} · </span>
                            )}
                            {client.area}
                            {client.block && ` — ق${client.block}`}
                            {client.plot && `/${client.plot}`}
                            {client.parcelArea > 0 && (
                              <span className="text-gray-400"> ({client.parcelArea}م²)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${projectTypeColors[client.projectType] || "bg-gray-400"}`} />
                        <span className="text-xs text-gray-500">{client.projectType}</span>
                        {client.serviceType && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-500">{client.serviceType}</span>
                          </>
                        )}
                      </div>
                      {clientProjects.length > 0 ? (
                        <span className="text-xs text-purple-600 bg-purple-50 rounded-full px-2 py-0.5 font-medium">
                          {clientProjects.length} مشروع
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <FileText className="w-3.5 h-3.5" />
                          <span>عرض الملف</span>
                        </div>
                      )}
                    </div>

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
        onAdd={(c) => createClient.mutate(c as any)}
      />
    </div>
  );
}
