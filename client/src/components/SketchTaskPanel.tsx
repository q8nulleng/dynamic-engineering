/*
 * SketchTaskPanel - نافذة تصميم الكروكي المتخصصة
 * تحاكي طبيعة مهمة التصميم المعماري الأولي
 * تحتوي على:
 *   1. معلومات القسيمة (الموقع، المساحة، الشكل، الواجهة)
 *   2. متطلبات الأدوار (السرداب، الأرضي، الأول، الثاني، السطح)
 *   3. طابع التصميم والمتطلبات الجمالية
 *   4. سجل الاجتماعات مع المالك
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X, ChevronRight, PenLine, MapPin, Building2, Palette,
  Users, CheckCircle2, Clock, Plus, Calendar, MessageSquare,
  ChevronDown, ChevronUp, Layers, Home, Compass
} from "lucide-react";

/* ===== Types ===== */
interface FloorRequirement {
  floor: string;
  label: string;
  rooms: string;
  notes: string;
  icon: React.ElementType;
  color: string;
}

interface Meeting {
  id: number;
  date: string;
  attendees: string[];
  duration: string;
  agreed: string[];
  changes: string;
  status: "confirmed" | "pending";
}

interface SketchData {
  // معلومات القسيمة
  plotArea: string;
  plotShape: "زاوية" | "داخلية" | "قاطعة";
  plotFacing: "شمال" | "جنوب" | "شرق" | "غرب";
  blockedSides: string[];
  plotLocation: string;
  // طابع التصميم
  designStyle: string;
  exteriorMaterial: string;
  colorPalette: string;
  specialRequests: string;
  // الأدوار
  floors: FloorRequirement[];
  // الاجتماعات
  meetings: Meeting[];
  // الحالة
  sketchVersion: number;
  lastUpdated: string;
  approvalStatus: "في الانتظار" | "معتمد" | "يحتاج تعديل";
}

/* ===== Sample Data ===== */
const sampleSketchData: SketchData = {
  plotArea: "400",
  plotShape: "زاوية",
  plotFacing: "شمال",
  blockedSides: ["جنوب", "شرق", "غرب"],
  plotLocation: "الجهراء - قطعة 12 - قسيمة 5",
  designStyle: "موديرن كلاسيك",
  exteriorMaterial: "حجر طبيعي + زجاج",
  colorPalette: "بيج فاتح + رمادي + أبيض",
  specialRequests: "مدخل رئيسي واسع، بركة ماء في الحديقة، مصعد داخلي",
  floors: [
    {
      floor: "سرداب",
      label: "السرداب",
      rooms: "غرفة خادمة، مغسلة، مستودع، غرفة كهرباء",
      notes: "ارتفاع 3م، مدخل سيارات مزدوج",
      icon: Layers,
      color: "oklch(0.55 0.10 200)",
    },
    {
      floor: "أرضي",
      label: "الدور الأرضي",
      rooms: "مجلس رجال، صالة استقبال، غرفة ضيوف + حمام، مطبخ، حديقة أمامية",
      notes: "مجلس رجال مستقل بمدخل خاص",
      icon: Home,
      color: "oklch(0.60 0.12 30)",
    },
    {
      floor: "أول",
      label: "الدور الأول",
      rooms: "غرفة ماستر + حمام + دريسنج، 3 غرف أطفال، صالة عائلية، مطبخ صغير",
      notes: "غرفة الماستر بإطلالة على الحديقة",
      icon: Building2,
      color: "oklch(0.55 0.15 250)",
    },
    {
      floor: "ثاني",
      label: "الدور الثاني",
      rooms: "غرفة والدين + حمام، غرفة إضافية، صالة صغيرة",
      notes: "مدخل مستقل للوالدين إن أمكن",
      icon: Building2,
      color: "oklch(0.60 0.15 280)",
    },
    {
      floor: "سطح",
      label: "السطح",
      rooms: "ملحق سطح: غرفة + حمام، مجلس مكشوف، مسبح",
      notes: "مسبح 8×4م، مجلس مكشوف بمظلة",
      icon: Compass,
      color: "oklch(0.55 0.15 150)",
    },
  ],
  meetings: [
    {
      id: 1,
      date: "2026-04-10",
      attendees: ["م. مارك", "فهد العتيبي"],
      duration: "90 دقيقة",
      agreed: [
        "الموافقة على المساحة الكلية 400م²",
        "تحديد الواجهة الشمالية",
        "طابع موديرن كلاسيك",
        "مدخل رجال مستقل من الجانب الشرقي",
      ],
      changes: "لا تعديلات - جلسة أولى لجمع المتطلبات",
      status: "confirmed",
    },
    {
      id: 2,
      date: "2026-04-14",
      attendees: ["م. مارك", "م. مصطفى", "فهد العتيبي"],
      duration: "60 دقيقة",
      agreed: [
        "إضافة مسبح في السطح",
        "تعديل موقع المطبخ في الأرضي",
        "إضافة دريسنج لغرفة الماستر",
      ],
      changes: "تعديل توزيع الدور الأول - نقل المطبخ للجهة الغربية",
      status: "confirmed",
    },
    {
      id: 3,
      date: "2026-04-20",
      attendees: ["م. مارك", "فهد العتيبي"],
      duration: "45 دقيقة",
      agreed: [
        "مراجعة الكروكي الأول",
        "طلب تعديل واجهة الدور الأرضي",
        "الموافقة على توزيع الأدوار",
      ],
      changes: "تعديل الواجهة الرئيسية - إضافة أعمدة كلاسيكية",
      status: "pending",
    },
  ],
  sketchVersion: 3,
  lastUpdated: "2026-04-20",
  approvalStatus: "يحتاج تعديل",
};

/* ===== Tab Types ===== */
type TabType = "plot" | "floors" | "style" | "meetings";

interface SketchTaskPanelProps {
  onClose: () => void;
  phaseColor: string;
}

export default function SketchTaskPanel({ onClose, phaseColor }: SketchTaskPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("plot");
  const [expandedMeeting, setExpandedMeeting] = useState<number | null>(1);
  const data = sampleSketchData;

  const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "plot", label: "القسيمة", icon: MapPin },
    { id: "floors", label: "الأدوار", icon: Building2, count: data.floors.length },
    { id: "style", label: "طابع التصميم", icon: Palette },
    { id: "meetings", label: "الاجتماعات", icon: Users, count: data.meetings.length },
  ];

  const approvalColors = {
    "في الانتظار": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "معتمد": "bg-green-50 text-green-700 border-green-200",
    "يحتاج تعديل": "bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl" onClick={onClose}>
      <div className="flex-1 bg-black/40" />
      <div
        className="w-full max-w-xl bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderRight: `3px solid ${phaseColor}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="p-4 border-b bg-gradient-to-l from-muted/30 to-background">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `color-mix(in oklch, ${phaseColor} 15%, white)` }}
            >
              <PenLine className="w-5 h-5" style={{ color: phaseColor }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1">
                <span>المشاريع</span>
                <ChevronRight className="w-3 h-3" />
                <span style={{ color: phaseColor }}>المرحلة الأولى</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground font-medium">تصميم الكروكي</span>
              </div>
              <h2 className="text-base font-bold">تصميم الكروكي المعماري</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${approvalColors[data.approvalStatus]}`}>
                  {data.approvalStatus}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  الإصدار {data.sketchVersion} · آخر تحديث {data.lastUpdated}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {data.meetings.length} اجتماعات · {data.meetings.reduce((s, m) => s + m.agreed.length, 0)} بند متفق عليه
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 bg-muted/40 rounded-xl p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                    isActive ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={isActive ? { color: phaseColor } : {}}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`text-[9px] px-1 rounded-full ${isActive ? "bg-muted" : "bg-muted/60"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* ── Tab: القسيمة ── */}
          {activeTab === "plot" && (
            <div className="space-y-4">
              <SectionTitle icon={MapPin} title="معلومات القسيمة" color={phaseColor} />

              {/* Plot visual indicator */}
              <div className="relative w-full h-36 rounded-xl border-2 border-dashed bg-muted/20 flex items-center justify-center overflow-hidden"
                style={{ borderColor: `color-mix(in oklch, ${phaseColor} 40%, transparent)` }}>
                {/* Compass */}
                <div className="absolute top-2 left-2 flex flex-col items-center gap-0.5">
                  <div className="text-[9px] font-bold text-muted-foreground">ش</div>
                  <Compass className="w-4 h-4 text-muted-foreground" />
                  <div className="text-[9px] font-bold text-muted-foreground">ج</div>
                </div>
                {/* Plot shape */}
                <div className="flex flex-col items-center gap-1">
                  <div className="w-20 h-16 rounded-lg border-2 flex items-center justify-center text-xs font-bold relative"
                    style={{ borderColor: phaseColor, backgroundColor: `color-mix(in oklch, ${phaseColor} 8%, white)` }}>
                    <span style={{ color: phaseColor }}>{data.plotArea} م²</span>
                    {/* Blocked sides indicators */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full h-1 rounded-full bg-red-300 opacity-60" title="جنوب - مسدود" />
                    <div className="absolute top-1/2 -translate-y-1/2 -left-1 h-full w-1 rounded-full bg-red-300 opacity-60" title="غرب - مسدود" />
                    <div className="absolute top-1/2 -translate-y-1/2 -right-1 h-full w-1 rounded-full bg-red-300 opacity-60" title="شرق - مسدود" />
                  </div>
                  <span className="text-[9px] text-muted-foreground">الواجهة: {data.plotFacing}</span>
                </div>
                <div className="absolute bottom-2 right-2 text-[9px] text-muted-foreground">
                  شكل: {data.plotShape}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="الموقع" value={data.plotLocation} icon={MapPin} color={phaseColor} />
                <InfoCard label="المساحة" value={`${data.plotArea} م²`} icon={Layers} color={phaseColor} />
                <InfoCard label="شكل القسيمة" value={data.plotShape} icon={Compass} color={phaseColor} />
                <InfoCard label="وجه القسيمة" value={data.plotFacing} icon={Compass} color={phaseColor} />
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">الجهات المسدودة</p>
                <div className="flex gap-2 flex-wrap">
                  {["شمال", "جنوب", "شرق", "غرب"].map(dir => (
                    <span key={dir} className={`text-xs px-3 py-1 rounded-full border font-medium ${
                      data.blockedSides.includes(dir)
                        ? "bg-red-50 text-red-600 border-red-200"
                        : "bg-green-50 text-green-600 border-green-200"
                    }`}>
                      {data.blockedSides.includes(dir) ? "🔴" : "🟢"} {dir}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  🔴 مسدود (يحد بعقار آخر) · 🟢 مفتوح (شارع أو فراغ)
                </p>
              </div>
            </div>
          )}

          {/* ── Tab: الأدوار ── */}
          {activeTab === "floors" && (
            <div className="space-y-3">
              <SectionTitle icon={Building2} title="متطلبات الأدوار" color={phaseColor} />
              {data.floors.map((floor, i) => {
                const Icon = floor.icon;
                return (
                  <div key={i} className="rounded-xl border overflow-hidden">
                    <div className="flex items-center gap-3 p-3"
                      style={{ backgroundColor: `color-mix(in oklch, ${floor.color} 8%, white)` }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: floor.color }}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold">{floor.label}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px]" style={{ borderColor: floor.color, color: floor.color }}>
                        {floor.floor}
                      </Badge>
                    </div>
                    <div className="p-3 space-y-2 bg-background">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">الغرف والمساحات</p>
                        <p className="text-xs leading-relaxed">{floor.rooms}</p>
                      </div>
                      {floor.notes && (
                        <div className="flex items-start gap-1.5 bg-muted/30 rounded-lg p-2">
                          <span className="text-[10px] shrink-0 mt-0.5">📌</span>
                          <p className="text-[11px] text-muted-foreground">{floor.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Tab: طابع التصميم ── */}
          {activeTab === "style" && (
            <div className="space-y-4">
              <SectionTitle icon={Palette} title="طابع التصميم والمتطلبات الجمالية" color={phaseColor} />

              {/* Design style hero */}
              <div className="rounded-xl p-4 border text-center"
                style={{ background: `linear-gradient(135deg, color-mix(in oklch, ${phaseColor} 8%, white), color-mix(in oklch, oklch(0.60 0.12 30) 8%, white))` }}>
                <div className="text-2xl mb-1">🏛️</div>
                <p className="text-lg font-bold">{data.designStyle}</p>
                <p className="text-xs text-muted-foreground mt-0.5">طابع التصميم المعتمد</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <InfoCard label="مواد الواجهة الخارجية" value={data.exteriorMaterial} icon={Building2} color={phaseColor} />
                <InfoCard label="لوحة الألوان" value={data.colorPalette} icon={Palette} color={phaseColor} />
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  متطلبات خاصة
                </p>
                <div className="bg-muted/20 rounded-xl p-3 border border-border/40">
                  <p className="text-sm leading-relaxed">{data.specialRequests}</p>
                </div>
              </div>

              {/* Style reference tags */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">عناصر التصميم المطلوبة</p>
                <div className="flex flex-wrap gap-2">
                  {["أعمدة كلاسيكية", "نوافذ عالية", "مداخل مقوسة", "إضاءة خارجية", "حجر طبيعي", "زجاج مزدوج"].map(tag => (
                    <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted/50 border border-border/60 text-foreground/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: الاجتماعات ── */}
          {activeTab === "meetings" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle icon={Users} title="سجل الاجتماعات مع المالك" color={phaseColor} />
                <div className="text-[10px] text-muted-foreground bg-muted/40 px-2 py-1 rounded-full">
                  {data.meetings.reduce((s, m) => s + m.agreed.length, 0)} بند متفق عليه
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-2">
                <StatCard value={data.meetings.length} label="اجتماع" color={phaseColor} />
                <StatCard value={data.meetings.reduce((s, m) => s + m.agreed.length, 0)} label="بند مُتفق" color="oklch(0.55 0.15 150)" />
                <StatCard value={data.meetings.filter(m => m.changes !== "لا تعديلات - جلسة أولى لجمع المتطلبات").length} label="تعديل" color="oklch(0.60 0.12 30)" />
              </div>

              {/* Meeting cards */}
              {data.meetings.map((meeting) => {
                const isExpanded = expandedMeeting === meeting.id;
                return (
                  <div key={meeting.id} className="rounded-xl border overflow-hidden">
                    {/* Meeting header */}
                    <button
                      className="w-full flex items-center gap-3 p-3 text-right hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: phaseColor }}>
                        {meeting.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold">الاجتماع {meeting.id}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            meeting.status === "confirmed"
                              ? "bg-green-50 text-green-600"
                              : "bg-yellow-50 text-yellow-600"
                          }`}>
                            {meeting.status === "confirmed" ? "✓ مؤكد" : "⏳ معلق"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{meeting.date}
                          </span>
                          <span className="text-[10px] text-muted-foreground">· {meeting.duration}</span>
                          <span className="text-[10px] text-muted-foreground">· {meeting.agreed.length} بنود</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </button>

                    {/* Meeting details */}
                    {isExpanded && (
                      <div className="border-t bg-muted/10 p-3 space-y-3">
                        {/* Attendees */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">الحضور</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {meeting.attendees.map((a, i) => (
                              <span key={i} className="flex items-center gap-1 text-xs bg-background border rounded-full px-2 py-0.5">
                                <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] font-bold"
                                  style={{ backgroundColor: `color-mix(in oklch, ${phaseColor} 20%, white)`, color: phaseColor }}>
                                  {a.replace("م. ", "").charAt(0)}
                                </div>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Agreed points */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">ما تم الاتفاق عليه</p>
                          <div className="space-y-1">
                            {meeting.agreed.map((point, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Changes */}
                        <div className="flex items-start gap-2 bg-orange-50 rounded-lg p-2.5">
                          <span className="text-sm shrink-0">🔄</span>
                          <div>
                            <p className="text-[10px] font-semibold text-orange-700 mb-0.5">التعديلات المطلوبة</p>
                            <p className="text-xs text-orange-600">{meeting.changes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add meeting button */}
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Plus className="w-4 h-4" />
                إضافة اجتماع جديد
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-4 border-t bg-muted/10 flex gap-2">
          <Button className="flex-1 text-white text-sm" style={{ backgroundColor: phaseColor }} onClick={onClose}>
            إغلاق
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-sm">
            تعديل المتطلبات
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ===== Helper Components ===== */
function SectionTitle({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 15%, white)` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <p className="text-sm font-bold">{title}</p>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `color-mix(in oklch, ${color} 12%, white)` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center p-2.5 rounded-xl border bg-background">
      <p className="text-xl font-bold" style={{ color, fontFamily: "'Space Grotesk'" }}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
