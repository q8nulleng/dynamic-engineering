/*
 * SketchTaskPanel - نافذة تصميم الكروكي المتخصصة (مختصرة)
 * تصميم مكثف يحافظ على: القسيمة، الأدوار، طابع التصميم، الاجتماعات
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X, PenLine, MapPin, Building2, Palette, Users,
  CheckCircle2, Clock, Plus, Calendar, ChevronRight,
  ChevronDown, ChevronUp, Layers, Home, Compass
} from "lucide-react";

/* ─── Types ─── */
interface Meeting {
  id: number; date: string; attendees: string[];
  agreed: string[]; changes: string; status: "confirmed" | "pending";
}

const FLOORS = [
  { key: "سرداب", label: "السرداب", rooms: "خادمة، مغسلة، مستودع، كهرباء", notes: "مدخل سيارات مزدوج، ارتفاع 3م", color: "oklch(0.55 0.10 200)", icon: Layers },
  { key: "أرضي", label: "الأرضي", rooms: "مجلس رجال، استقبال، ضيوف، مطبخ، حديقة", notes: "مجلس رجال بمدخل مستقل", color: "oklch(0.60 0.12 30)", icon: Home },
  { key: "أول", label: "الأول", rooms: "ماستر + دريسنج، 3 غرف أطفال، صالة، مطبخ صغير", notes: "ماستر بإطلالة على الحديقة", color: "oklch(0.55 0.15 250)", icon: Building2 },
  { key: "ثاني", label: "الثاني", rooms: "غرفة والدين، غرفة إضافية، صالة", notes: "مدخل مستقل للوالدين", color: "oklch(0.60 0.15 280)", icon: Building2 },
  { key: "سطح", label: "السطح", rooms: "ملحق: غرفة + حمام، مجلس مكشوف، مسبح 8×4م", notes: "مظلة للمجلس المكشوف", color: "oklch(0.55 0.15 150)", icon: Compass },
];

const MEETINGS: Meeting[] = [
  { id: 1, date: "2026-04-10", attendees: ["م. مارك", "فهد العتيبي"],
    agreed: ["مساحة 400م²", "واجهة شمالية", "موديرن كلاسيك", "مدخل رجال شرقي"],
    changes: "جلسة أولى — لا تعديلات", status: "confirmed" },
  { id: 2, date: "2026-04-14", attendees: ["م. مارك", "م. مصطفى", "فهد العتيبي"],
    agreed: ["مسبح في السطح", "تعديل موقع المطبخ", "دريسنج للماستر"],
    changes: "نقل المطبخ للجهة الغربية", status: "confirmed" },
  { id: 3, date: "2026-04-20", attendees: ["م. مارك", "فهد العتيبي"],
    agreed: ["مراجعة الكروكي الأول", "تعديل الواجهة", "اعتماد التوزيع"],
    changes: "إضافة أعمدة كلاسيكية للواجهة", status: "pending" },
];

type Tab = "plot" | "floors" | "style" | "meetings";

export default function SketchTaskPanel({ onClose, phaseColor }: { onClose: () => void; phaseColor: string }) {
  const [tab, setTab] = useState<Tab>("plot");
  const [openMeeting, setOpenMeeting] = useState<number | null>(1);

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "plot",     label: "القسيمة",      icon: MapPin },
    { id: "floors",   label: "الأدوار",       icon: Building2, badge: 5 },
    { id: "style",    label: "التصميم",       icon: Palette },
    { id: "meetings", label: "الاجتماعات",    icon: Users, badge: 3 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="w-full max-w-md bg-background shadow-2xl flex flex-col"
        style={{ borderRight: `3px solid ${phaseColor}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-4 pt-3 pb-2 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `color-mix(in oklch, ${phaseColor} 15%, white)` }}>
              <PenLine className="w-4 h-4" style={{ color: phaseColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span>المشاريع</span><ChevronRight className="w-2.5 h-2.5" />
                <span style={{ color: phaseColor }}>المرحلة الأولى</span><ChevronRight className="w-2.5 h-2.5" />
                <span className="text-foreground">تصميم الكروكي</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold">تصميم الكروكي المعماري</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">يحتاج تعديل</span>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />الإصدار 3 · 2026-04-20</span>
            <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />3 اجتماعات · 10 بنود</span>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 mt-2 bg-muted/40 rounded-lg p-0.5">
            {tabs.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1 px-1.5 rounded-md text-[10px] font-medium transition-all ${active ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  style={active ? { color: phaseColor } : {}}>
                  <Icon className="w-3 h-3" />
                  <span>{t.label}</span>
                  {t.badge && <span className="text-[8px] px-1 rounded-full bg-muted/60">{t.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">

          {/* ══ القسيمة ══ */}
          {tab === "plot" && (
            <>
              {/* Visual plot */}
              <div className="relative h-28 rounded-xl border-2 border-dashed bg-muted/10 flex items-center justify-center"
                style={{ borderColor: `color-mix(in oklch, ${phaseColor} 35%, transparent)` }}>
                <div className="absolute top-1.5 left-2 text-[8px] text-muted-foreground flex flex-col items-center gap-0.5">
                  <span>ش</span><Compass className="w-3 h-3" /><span>ج</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-16 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-bold relative"
                    style={{ borderColor: phaseColor, background: `color-mix(in oklch, ${phaseColor} 8%, white)` }}>
                    <span style={{ color: phaseColor }}>400 م²</span>
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded bg-red-300" />
                    <div className="absolute top-1/2 -translate-y-1/2 -left-0.5 h-3/4 w-0.5 rounded bg-red-300" />
                    <div className="absolute top-1/2 -translate-y-1/2 -right-0.5 h-3/4 w-0.5 rounded bg-red-300" />
                  </div>
                  <span className="text-[8px] text-muted-foreground">واجهة: شمال</span>
                </div>
                <div className="absolute bottom-1.5 right-2 text-[8px] text-muted-foreground">زاوية</div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "الموقع", value: "الجهراء - ق12 - ق5", icon: MapPin },
                  { label: "المساحة", value: "400 م²", icon: Layers },
                  { label: "شكل القسيمة", value: "زاوية", icon: Compass },
                  { label: "وجه القسيمة", value: "شمال", icon: Compass },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/40">
                    <item.icon className="w-3.5 h-3.5 shrink-0" style={{ color: phaseColor }} />
                    <div className="min-w-0">
                      <p className="text-[9px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-semibold truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blocked sides */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">الجهات</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["شمال", "جنوب", "شرق", "غرب"].map(dir => {
                    const blocked = ["جنوب", "شرق", "غرب"].includes(dir);
                    return (
                      <span key={dir} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${blocked ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                        {blocked ? "🔴" : "🟢"} {dir}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ══ الأدوار ══ */}
          {tab === "floors" && (
            <div className="space-y-2">
              {FLOORS.map((floor) => {
                const Icon = floor.icon;
                return (
                  <div key={floor.key} className="rounded-xl border overflow-hidden">
                    <div className="flex items-center gap-2.5 px-3 py-2"
                      style={{ background: `color-mix(in oklch, ${floor.color} 8%, white)` }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: floor.color }}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-xs font-bold flex-1">{floor.label}</p>
                      <Badge variant="outline" className="text-[8px] px-1.5" style={{ borderColor: floor.color, color: floor.color }}>{floor.key}</Badge>
                    </div>
                    <div className="px-3 py-2 space-y-1.5 bg-background">
                      <p className="text-[11px] leading-relaxed">{floor.rooms}</p>
                      <div className="flex items-start gap-1 bg-muted/30 rounded-lg px-2 py-1">
                        <span className="text-[9px] shrink-0 mt-0.5">📌</span>
                        <p className="text-[10px] text-muted-foreground">{floor.notes}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══ طابع التصميم ══ */}
          {tab === "style" && (
            <div className="space-y-3">
              {/* Style hero - compact */}
              <div className="rounded-xl p-3 border text-center"
                style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${phaseColor} 8%, white), color-mix(in oklch, oklch(0.60 0.12 30) 8%, white))` }}>
                <span className="text-xl">🏛️</span>
                <p className="text-sm font-bold mt-0.5">موديرن كلاسيك</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: "مواد الواجهة", value: "حجر طبيعي + زجاج" },
                  { label: "لوحة الألوان", value: "بيج فاتح + رمادي + أبيض" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/40">
                    <Palette className="w-3.5 h-3.5 shrink-0" style={{ color: phaseColor }} />
                    <div>
                      <p className="text-[9px] text-muted-foreground">{item.label}</p>
                      <p className="text-xs font-semibold">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/20 rounded-xl p-2.5 border border-border/40">
                <p className="text-[9px] text-muted-foreground mb-1">متطلبات خاصة</p>
                <p className="text-xs leading-relaxed">مدخل رئيسي واسع، بركة ماء في الحديقة، مصعد داخلي</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">عناصر التصميم</p>
                <div className="flex flex-wrap gap-1.5">
                  {["أعمدة كلاسيكية", "نوافذ عالية", "مداخل مقوسة", "إضاءة خارجية", "حجر طبيعي", "زجاج مزدوج"].map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 border border-border/60 text-foreground/70">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══ الاجتماعات ══ */}
          {tab === "meetings" && (
            <div className="space-y-2">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 3, l: "اجتماع", c: phaseColor },
                  { v: 10, l: "بند متفق", c: "oklch(0.55 0.15 150)" },
                  { v: 2, l: "تعديل", c: "oklch(0.60 0.12 30)" },
                ].map(s => (
                  <div key={s.l} className="text-center p-2 rounded-xl border bg-background">
                    <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
                    <p className="text-[9px] text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Meeting cards */}
              {MEETINGS.map(m => {
                const open = openMeeting === m.id;
                return (
                  <div key={m.id} className="rounded-xl border overflow-hidden">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 text-right hover:bg-muted/20 transition-colors"
                      onClick={() => setOpenMeeting(open ? null : m.id)}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: phaseColor }}>{m.id}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold">الاجتماع {m.id}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${m.status === "confirmed" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                            {m.status === "confirmed" ? "✓ مؤكد" : "⏳ معلق"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                          <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{m.date}</span>
                          <span>· {m.agreed.length} بنود</span>
                        </div>
                      </div>
                      {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    </button>

                    {open && (
                      <div className="border-t bg-muted/10 px-3 py-2.5 space-y-2.5">
                        {/* Attendees */}
                        <div className="flex gap-1.5 flex-wrap">
                          {m.attendees.map((a, i) => (
                            <span key={i} className="flex items-center gap-1 text-[10px] bg-background border rounded-full px-2 py-0.5">
                              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold"
                                style={{ background: `color-mix(in oklch, ${phaseColor} 20%, white)`, color: phaseColor }}>
                                {a.replace("م. ", "").charAt(0)}
                              </div>
                              {a}
                            </span>
                          ))}
                        </div>
                        {/* Agreed */}
                        <div className="space-y-1">
                          {m.agreed.map((p, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                        {/* Changes */}
                        <div className="flex items-start gap-1.5 bg-orange-50 rounded-lg px-2 py-1.5">
                          <span className="text-xs shrink-0">🔄</span>
                          <p className="text-[10px] text-orange-600">{m.changes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed text-[11px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Plus className="w-3.5 h-3.5" />إضافة اجتماع جديد
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-3 py-2.5 border-t bg-muted/10 flex gap-2">
          <Button className="flex-1 text-white text-xs h-8" style={{ backgroundColor: phaseColor }} onClick={onClose}>إغلاق</Button>
          <Button variant="outline" size="sm" className="flex-1 text-xs h-8">تعديل المتطلبات</Button>
        </div>
      </div>
    </div>
  );
}
