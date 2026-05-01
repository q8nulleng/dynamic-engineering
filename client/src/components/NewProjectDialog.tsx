/*
 * NewProjectDialog - نموذج إضافة مشروع جديد
 * خطوات: التصنيف الرئيسي → التصنيف الفرعي → ربط العميل → بيانات المشروع
 * الجديد: خطوة ربط العميل (اختيار عميل موجود أو إنشاء جديد)
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Home, Factory, TrendingUp, Store,
  Building2, Wrench, PlusSquare, Layers, Trash2, Eye,
  ChevronRight, ChevronLeft, User, MapPin, FileText, Check,
  Search, Users, Phone, UserPlus, UserCheck, Star
} from "lucide-react";
import { clientsDB, type Client } from "@/pages/Clients";

/* ─── التصنيفات ─── */
const MAIN_CATS = [
  { key: "سكن خاص",  label: "سكن خاص",  icon: Home,       color: "oklch(0.50 0.15 250)", desc: "فلل، بيوت، شاليهات سكنية" },
  { key: "صناعي",    label: "صناعي",    icon: Factory,    color: "oklch(0.50 0.15 30)",  desc: "مصانع، مستودعات، ورش" },
  { key: "استثماري", label: "استثماري", icon: TrendingUp, color: "oklch(0.50 0.15 150)", desc: "عمارات، مجمعات سكنية" },
  { key: "تجاري",    label: "تجاري",    icon: Store,      color: "oklch(0.50 0.15 60)",  desc: "مراكز تجارية، مكاتب، محلات" },
];

const SUB_CATS = [
  { key: "بناء جديد",    label: "بناء جديد",    icon: Building2,  desc: "إنشاء مبنى جديد من الصفر" },
  { key: "تعديل",        label: "تعديل",        icon: Wrench,     desc: "تعديل على مبنى قائم" },
  { key: "إضافة",        label: "إضافة",        icon: PlusSquare, desc: "إضافة أدوار أو ملحقات" },
  { key: "تعديل وإضافة", label: "تعديل وإضافة", icon: Layers,     desc: "تعديل مع إضافة ملحقات" },
  { key: "هدم",          label: "هدم",          icon: Trash2,     desc: "هدم مبنى قائم" },
  { key: "إشراف",        label: "إشراف",        icon: Eye,        desc: "إشراف هندسي على التنفيذ" },
];

const KUWAIT_AREAS = [
  "العاصمة", "حولي", "الفروانية", "الأحمدي", "الجهراء", "مبارك الكبير",
  "السالمية", "الرميثية", "البيان", "الزهراء", "الفحيحيل", "الشويخ",
  "الصليبية", "الجابرية", "بيان", "الرقة", "العارضية", "صباح الأحمد",
];

const typeLabels: Record<string, string> = {
  individual: "فرد",
  company: "شركة",
  heirs: "ورثة",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (project: {
    name: string; client: string; type: string; serviceType: string;
    area: string; phone: string; notes: string; clientId?: string;
  }) => void;
}

export default function NewProjectDialog({ open, onClose, onAdd }: Props) {
  const [step, setStep] = useState(1); // 1: رئيسي | 2: فرعي | 3: ربط عميل | 4: بيانات
  const [mainCat, setMainCat] = useState("");
  const [subCat,  setSubCat]  = useState("");

  // ربط العميل
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientSearch, setClientSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", client: "", area: "", phone: "", notes: "",
  });

  const selectedMain = MAIN_CATS.find(c => c.key === mainCat);
  const accentColor  = selectedMain?.color || "oklch(0.30 0.05 250)";

  const reset = () => {
    setStep(1); setMainCat(""); setSubCat("");
    setClientMode("existing"); setClientSearch(""); setSelectedClientId(null);
    setForm({ name: "", client: "", area: "", phone: "", notes: "" });
  };

  const handleClose = () => { reset(); onClose(); };

  // تصفية العملاء حسب البحث ونوع المشروع
  const filteredClients = clientsDB.filter(c => {
    const matchSearch = !clientSearch ||
      c.name.includes(clientSearch) ||
      c.phone.includes(clientSearch) ||
      c.area.includes(clientSearch);
    return matchSearch;
  });

  const selectedClient = clientsDB.find(c => c.id === selectedClientId);

  // عند اختيار عميل موجود: تعبئة بيانات النموذج تلقائياً
  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
    setForm(f => ({
      ...f,
      client: client.name,
      area: client.area,
      phone: client.phone,
    }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.client || !form.area) return;
    onAdd({
      ...form,
      type: mainCat,
      serviceType: subCat,
      clientId: selectedClientId || undefined,
    });
    handleClose();
  };

  const isStep3Valid = clientMode === "existing" ? !!selectedClientId : (form.client.trim().length > 0);
  const isFormValid = form.name.trim() && form.client.trim() && form.area.trim();

  const stepLabels = ["التصنيف الرئيسي", "نوع الخدمة", "ربط العميل", "بيانات المشروع"];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: accentColor }} />
            مشروع جديد
            {mainCat && <span className="text-xs font-normal text-muted-foreground">— {mainCat}{subCat ? ` · ${subCat}` : ""}</span>}
          </DialogTitle>
        </DialogHeader>

        {/* ─── شريط الخطوات (4 خطوات) ─── */}
        <div className="flex items-center gap-0.5 mb-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-0.5 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all"
                style={{
                  backgroundColor: step >= s ? accentColor : "hsl(var(--muted))",
                  color: step >= s ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                {step > s ? <Check className="w-3 h-3" /> : s}
              </div>
              <span className="text-[9px] text-muted-foreground hidden sm:block truncate flex-1">
                {stepLabels[s - 1]}
              </span>
              {s < 4 && <div className="w-3 h-px bg-border mx-0.5 shrink-0" />}
            </div>
          ))}
        </div>

        {/* ─── الخطوة 1: التصنيف الرئيسي ─── */}
        {step === 1 && (
          <div className="grid grid-cols-2 gap-3 py-2">
            {MAIN_CATS.map(cat => {
              const Icon = cat.icon;
              const isSelected = mainCat === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => setMainCat(cat.key)}
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border text-right transition-all relative"
                  style={{
                    borderColor: isSelected ? `color-mix(in oklch, ${cat.color} 60%, transparent)` : "hsl(var(--border))",
                    backgroundColor: isSelected ? `color-mix(in oklch, ${cat.color} 10%, white)` : "transparent",
                  }}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `color-mix(in oklch, ${cat.color} 15%, white)` }}>
                    <Icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cat.color }}>
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── الخطوة 2: التصنيف الفرعي ─── */}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-2 py-2">
            {SUB_CATS.map(sub => {
              const Icon = sub.icon;
              const isSelected = subCat === sub.key;
              return (
                <button
                  key={sub.key}
                  onClick={() => setSubCat(sub.key)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border text-right transition-all"
                  style={{
                    borderColor: isSelected ? `color-mix(in oklch, ${accentColor} 60%, transparent)` : "hsl(var(--border))",
                    backgroundColor: isSelected ? `color-mix(in oklch, ${accentColor} 10%, white)` : "transparent",
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `color-mix(in oklch, ${accentColor} 12%, white)` }}>
                    <Icon className="w-4 h-4" style={{ color: accentColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">{sub.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{sub.desc}</p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── الخطوة 3: ربط العميل ─── */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            {/* اختيار الوضع */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setClientMode("existing")}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                style={{
                  borderColor: clientMode === "existing" ? `color-mix(in oklch, ${accentColor} 60%, transparent)` : "hsl(var(--border))",
                  backgroundColor: clientMode === "existing" ? `color-mix(in oklch, ${accentColor} 8%, white)` : "transparent",
                }}
              >
                <UserCheck className="w-6 h-6" style={{ color: clientMode === "existing" ? accentColor : "hsl(var(--muted-foreground))" }} />
                <p className="text-xs font-bold">عميل موجود</p>
                <p className="text-[10px] text-muted-foreground">اختر من القائمة</p>
              </button>
              <button
                onClick={() => { setClientMode("new"); setSelectedClientId(null); }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                style={{
                  borderColor: clientMode === "new" ? `color-mix(in oklch, ${accentColor} 60%, transparent)` : "hsl(var(--border))",
                  backgroundColor: clientMode === "new" ? `color-mix(in oklch, ${accentColor} 8%, white)` : "transparent",
                }}
              >
                <UserPlus className="w-6 h-6" style={{ color: clientMode === "new" ? accentColor : "hsl(var(--muted-foreground))" }} />
                <p className="text-xs font-bold">عميل جديد</p>
                <p className="text-[10px] text-muted-foreground">أدخل البيانات يدوياً</p>
              </button>
            </div>

            {/* اختيار عميل موجود */}
            {clientMode === "existing" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم أو الهاتف أو المنطقة..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="text-xs pr-9"
                  />
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {filteredClients.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4">لا توجد نتائج</p>
                  ) : (
                    filteredClients.map(client => {
                      const isSelected = selectedClientId === client.id;
                      return (
                        <button
                          key={client.id}
                          onClick={() => handleSelectClient(client)}
                          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition-all"
                          style={{
                            borderColor: isSelected ? `color-mix(in oklch, ${accentColor} 60%, transparent)` : "hsl(var(--border))",
                            backgroundColor: isSelected ? `color-mix(in oklch, ${accentColor} 8%, white)` : "transparent",
                          }}
                        >
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: accentColor }}
                          >
                            {client.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{client.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{client.area}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Phone className="w-2.5 h-2.5" />{client.phone}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <Badge className="text-[9px] px-1.5 py-0 bg-muted text-muted-foreground border-0">
                              {typeLabels[client.type]}
                            </Badge>
                            <span className="text-[9px] text-muted-foreground">{client.projects.length} مشروع</span>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: accentColor }}>
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* ملخص العميل المختار */}
                {selectedClient && (
                  <div className="p-3 rounded-xl border border-green-200 bg-green-50">
                    <p className="text-[10px] font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" />
                      تم اختيار العميل — البيانات ستُعبأ تلقائياً
                    </p>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <span className="text-muted-foreground">الاسم:</span>
                      <span className="font-medium">{selectedClient.name}</span>
                      <span className="text-muted-foreground">المنطقة:</span>
                      <span className="font-medium">{selectedClient.area} ق{selectedClient.block}/قس{selectedClient.plot}</span>
                      <span className="text-muted-foreground">المساحة:</span>
                      <span className="font-medium">{selectedClient.parcelArea} م²</span>
                      {selectedClient.civilId && (
                        <>
                          <span className="text-muted-foreground">الرقم المدني:</span>
                          <span className="font-medium" dir="ltr">{selectedClient.civilId}</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* عميل جديد */}
            {clientMode === "new" && (
              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] text-amber-700 flex items-center gap-1.5">
                    <UserPlus className="w-3 h-3" />
                    سيُنشأ ملف عميل جديد تلقائياً عند إنشاء المشروع
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" style={{ color: accentColor }} />
                    اسم العميل <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="الاسم الكامل للعميل"
                    value={form.client}
                    onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">رقم الهاتف</Label>
                  <Input
                    placeholder="05XXXXXXXX"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="text-sm"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── الخطوة 4: بيانات المشروع ─── */}
        {step === 4 && (
          <div className="space-y-3 py-2">
            {/* ملخص العميل المرتبط */}
            {selectedClient && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: accentColor }}>
                  {selectedClient.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{selectedClient.name}</p>
                  <p className="text-[10px] text-muted-foreground">{selectedClient.area} · {selectedClient.phone}</p>
                </div>
                <Badge className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 border-0 shrink-0">مرتبط</Badge>
              </div>
            )}

            {/* اسم المشروع */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: accentColor }} />
                اسم المشروع <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder={`${mainCat} - ${subCat} - ${form.area || "المنطقة"}`}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* اسم العميل (إذا لم يُختر من القائمة) */}
            {!selectedClient && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" style={{ color: accentColor }} />
                  اسم العميل <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="الاسم الكامل للعميل"
                  value={form.client}
                  onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                  className="text-sm"
                />
              </div>
            )}

            {/* المنطقة */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" style={{ color: accentColor }} />
                المنطقة / الموقع <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {KUWAIT_AREAS.map(area => (
                  <button
                    key={area}
                    onClick={() => setForm(f => ({ ...f, area }))}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                    style={{
                      backgroundColor: form.area === area ? `color-mix(in oklch, ${accentColor} 12%, white)` : "transparent",
                      borderColor: form.area === area ? `color-mix(in oklch, ${accentColor} 50%, transparent)` : "hsl(var(--border))",
                      color: form.area === area ? accentColor : "hsl(var(--muted-foreground))",
                    }}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <Input
                placeholder="أو اكتب الموقع يدوياً..."
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                className="text-sm mt-1"
              />
            </div>

            {/* ملاحظات */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">ملاحظات (اختياري)</Label>
              <textarea
                placeholder="أي ملاحظات إضافية عن المشروع..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full text-sm border rounded-lg px-3 py-2 resize-none bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* ─── أزرار التنقل ─── */}
        <DialogFooter className="flex-row-reverse gap-2 pt-2 border-t">
          {step > 1 && (
            <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1">
              <ChevronRight className="w-3.5 h-3.5" />
              السابق
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClose}>إلغاء</Button>

          {step < 4 ? (
            <Button
              size="sm"
              disabled={
                step === 1 ? !mainCat :
                step === 2 ? !subCat :
                step === 3 ? !isStep3Valid : false
              }
              onClick={() => setStep(s => s + 1)}
              className="gap-1 mr-auto"
              style={{ backgroundColor: accentColor }}
            >
              التالي
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!isFormValid}
              onClick={handleSubmit}
              className="gap-1 mr-auto"
              style={{ backgroundColor: accentColor }}
            >
              <Check className="w-3.5 h-3.5" />
              إنشاء المشروع
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
