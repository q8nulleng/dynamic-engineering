/*
 * NewProjectDialog - نموذج إضافة مشروع جديد
 * خطوات: التصنيف الرئيسي → التصنيف الفرعي → بيانات المشروع
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Home, Factory, TrendingUp, Store,
  Building2, Wrench, PlusSquare, Layers, Trash2, Eye,
  ChevronRight, ChevronLeft, User, MapPin, FileText, Check
} from "lucide-react";

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

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (project: {
    name: string; client: string; type: string; serviceType: string;
    area: string; phone: string; notes: string;
  }) => void;
}

export default function NewProjectDialog({ open, onClose, onAdd }: Props) {
  const [step, setStep] = useState(1); // 1: رئيسي | 2: فرعي | 3: بيانات
  const [mainCat, setMainCat] = useState("");
  const [subCat,  setSubCat]  = useState("");
  const [form, setForm] = useState({
    name: "", client: "", area: "", phone: "", notes: "",
  });

  const selectedMain = MAIN_CATS.find(c => c.key === mainCat);
  const accentColor  = selectedMain?.color || "oklch(0.30 0.05 250)";

  const reset = () => {
    setStep(1); setMainCat(""); setSubCat("");
    setForm({ name: "", client: "", area: "", phone: "", notes: "" });
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = () => {
    if (!form.name || !form.client || !form.area) return;
    onAdd({ ...form, type: mainCat, serviceType: subCat });
    handleClose();
  };

  const isFormValid = form.name.trim() && form.client.trim() && form.area.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: accentColor }} />
            مشروع جديد
            {mainCat && <span className="text-xs font-normal text-muted-foreground">— {mainCat}{subCat ? ` · ${subCat}` : ""}</span>}
          </DialogTitle>
        </DialogHeader>

        {/* ─── شريط الخطوات ─── */}
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-1 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all"
                style={{
                  backgroundColor: step >= s ? accentColor : "hsl(var(--muted))",
                  color: step >= s ? "white" : "hsl(var(--muted-foreground))",
                }}
              >
                {step > s ? <Check className="w-3 h-3" /> : s}
              </div>
              <span className="text-[10px] text-muted-foreground hidden sm:block">
                {s === 1 ? "التصنيف الرئيسي" : s === 2 ? "نوع الخدمة" : "بيانات المشروع"}
              </span>
              {s < 3 && <div className="flex-1 h-px bg-border mx-1" />}
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
                  className="flex flex-col items-start gap-2 p-3 rounded-xl border text-right transition-all"
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

        {/* ─── الخطوة 3: بيانات المشروع ─── */}
        {step === 3 && (
          <div className="space-y-3 py-2">
            {/* اسم المشروع */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: accentColor }} />
                اسم المشروع <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="مثال: فيلا سكنية - السالمية"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="text-sm"
              />
            </div>

            {/* اسم العميل */}
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

            {/* رقم الهاتف */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" style={{ color: accentColor }} />
                رقم الهاتف
              </Label>
              <Input
                placeholder="05XXXXXXXX"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="text-sm"
                dir="ltr"
              />
            </div>

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
              {/* أو كتابة يدوية */}
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

          {step < 3 ? (
            <Button
              size="sm"
              disabled={step === 1 ? !mainCat : !subCat}
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
