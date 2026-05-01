/*
 * SupervisionTaskPanel - كرت الإشراف على التنفيذ
 * - 12 مرحلة صب مع حالة كل مرحلة
 * - تسجيل الزيارات الميدانية (التاريخ + الملاحظات + صور)
 * - إحصائيات الزيارات وتتبع الإنجاز
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, HardHat, CheckCircle2, Circle, Clock, AlertCircle,
  Camera, Plus, ChevronDown, ChevronUp, MapPin, Calendar,
  User, FileText, Image, Trash2, Check, Building2,
  ClipboardCheck, Activity, Flag, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
type StageStatus = "pending" | "in_progress" | "done" | "issue";

interface SiteVisit {
  id: number;
  date: string;
  engineer: string;
  stage: string;
  notes: string;
  issues: string;
  photos: string[]; // أسماء الصور
  accepted: boolean; // قبول المرحلة
}

interface ConcreteStage {
  id: number;
  name: string;
  status: StageStatus;
  startDate?: string;
  endDate?: string;
  notes?: string;
  visitCount: number;
  accepted: boolean;
}

/* ─── مراحل الصب الـ12 ─── */
const INITIAL_STAGES: ConcreteStage[] = [
  { id: 1,  name: "مرحلة الحفر",                  status: "done",        startDate: "2026-02-10", endDate: "2026-02-15", visitCount: 3, accepted: true },
  { id: 2,  name: "مرحلة القواعد",                status: "done",        startDate: "2026-02-16", endDate: "2026-02-28", visitCount: 5, accepted: true },
  { id: 3,  name: "مرحلة أعمدة السرداب",          status: "done",        startDate: "2026-03-01", endDate: "2026-03-10", visitCount: 4, accepted: true },
  { id: 4,  name: "مرحلة صب سقف السرداب",         status: "done",        startDate: "2026-03-11", endDate: "2026-03-20", visitCount: 3, accepted: true },
  { id: 5,  name: "مرحلة أعمدة الدور الأرضي",    status: "in_progress", startDate: "2026-03-21", visitCount: 2, accepted: false },
  { id: 6,  name: "مرحلة صب سقف الدور الأرضي",   status: "pending",     visitCount: 0, accepted: false },
  { id: 7,  name: "مرحلة أعمدة الدور الأول",      status: "pending",     visitCount: 0, accepted: false },
  { id: 8,  name: "مرحلة صب سقف الدور الأول",     status: "pending",     visitCount: 0, accepted: false },
  { id: 9,  name: "مرحلة أعمدة الدور الثاني",     status: "pending",     visitCount: 0, accepted: false },
  { id: 10, name: "مرحلة صب سقف الدور الثاني",    status: "pending",     visitCount: 0, accepted: false },
  { id: 11, name: "مرحلة أعمدة السطح",            status: "pending",     visitCount: 0, accepted: false },
  { id: 12, name: "مرحلة صب سقف السطح",           status: "pending",     visitCount: 0, accepted: false },
];

/* ─── زيارات تجريبية ─── */
const INITIAL_VISITS: SiteVisit[] = [
  {
    id: 1, date: "2026-04-20", engineer: "م. فداء", stage: "مرحلة أعمدة الدور الأرضي",
    notes: "تم فحص حديد التسليح، مطابق للمخطط. الأعمدة في الوضع الصحيح.",
    issues: "", photos: ["IMG_001.jpg", "IMG_002.jpg"], accepted: false,
  },
  {
    id: 2, date: "2026-04-24", engineer: "م. فداء", stage: "مرحلة أعمدة الدور الأرضي",
    notes: "متابعة أعمال الصب. تم التحقق من الغطاء الخرساني.",
    issues: "وجود فجوات صغيرة في الصب — تم إبلاغ المقاول",
    photos: ["IMG_003.jpg"], accepted: false,
  },
];

/* ─── حالات المراحل ─── */
const stageConfig: Record<StageStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  pending:     { label: "لم تبدأ",     color: "text-gray-400",   bg: "bg-gray-50",    border: "border-gray-200", icon: Circle },
  in_progress: { label: "جارية",       color: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200", icon: Activity },
  done:        { label: "مكتملة",      color: "text-green-600",  bg: "bg-green-50",   border: "border-green-200", icon: CheckCircle2 },
  issue:       { label: "توجد مشكلة",  color: "text-red-600",    bg: "bg-red-50",     border: "border-red-200",  icon: AlertCircle },
};

/* ─── Props ─── */
interface Props {
  open: boolean;
  onClose: () => void;
  projectName: string;
  clientName?: string;
}

export default function SupervisionTaskPanel({ open, onClose, projectName, clientName }: Props) {
  const [stages, setStages] = useState<ConcreteStage[]>(INITIAL_STAGES);
  const [visits, setVisits] = useState<SiteVisit[]>(INITIAL_VISITS);
  const [activeTab, setActiveTab] = useState<"stages" | "visits" | "add">("stages");
  const [expandedStage, setExpandedStage] = useState<number | null>(5); // المرحلة الجارية مفتوحة
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);

  // نموذج زيارة جديدة
  const [newVisit, setNewVisit] = useState({
    date: new Date().toISOString().split("T")[0],
    engineer: "م. فداء",
    stage: "مرحلة أعمدة الدور الأرضي",
    notes: "",
    issues: "",
    accepted: false,
  });

  if (!open) return null;

  const doneCount = stages.filter(s => s.status === "done").length;
  const inProgressStage = stages.find(s => s.status === "in_progress");
  const totalVisits = visits.length;
  const thisWeekVisits = visits.filter(v => {
    const d = new Date(v.date);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  }).length;

  const handleAdvanceStage = (stageId: number) => {
    setStages(prev => prev.map(s => {
      if (s.id !== stageId) return s;
      if (s.status === "pending") return { ...s, status: "in_progress", startDate: new Date().toISOString().split("T")[0] };
      if (s.status === "in_progress") return { ...s, status: "done", endDate: new Date().toISOString().split("T")[0], accepted: true };
      return s;
    }));
    const stage = stages.find(s => s.id === stageId);
    if (stage?.status === "in_progress") toast.success(`✅ تم اعتماد: ${stage.name}`);
    else toast.success(`▶ بدأت: ${stages.find(s => s.id === stageId)?.name}`);
  };

  const handleAddVisit = () => {
    if (!newVisit.notes.trim()) { toast.error("أدخل ملاحظات الزيارة"); return; }
    const visit: SiteVisit = {
      id: visits.length + 1,
      ...newVisit,
      photos: [],
    };
    setVisits(prev => [visit, ...prev]);
    // زيادة عداد الزيارات للمرحلة
    setStages(prev => prev.map(s =>
      s.name === newVisit.stage ? { ...s, visitCount: s.visitCount + 1 } : s
    ));
    setNewVisit(v => ({ ...v, notes: "", issues: "", accepted: false }));
    setActiveTab("visits");
    toast.success("تم تسجيل الزيارة الميدانية");
  };

  const accentColor = "oklch(0.35 0.08 250)";
  const tabs = [
    { key: "stages", label: "مراحل الصب", icon: Building2 },
    { key: "visits", label: `الزيارات (${totalVisits})`, icon: MapPin },
    { key: "add",    label: "تسجيل زيارة", icon: Plus },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md h-full bg-background shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0" style={{ background: "linear-gradient(135deg, oklch(0.25 0.06 150) 0%, oklch(0.30 0.08 160) 100%)" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <HardHat className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">الإشراف على التنفيذ</h3>
                <p className="text-[10px] text-white/70">{projectName}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${(doneCount / 12) * 100}%` }} />
            </div>
            <span className="text-xs font-bold text-white" style={{ fontFamily: "'Space Grotesk'" }}>
              {doneCount}/12 مرحلة
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex gap-3">
            {[
              { label: "مكتملة", value: doneCount, color: "text-green-300" },
              { label: "زيارات هذا الأسبوع", value: thisWeekVisits, color: "text-blue-300" },
              { label: "إجمالي الزيارات", value: totalVisits, color: "text-white" },
            ].map(s => (
              <div key={s.label} className="flex-1 text-center">
                <p className={`text-lg font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk'" }}>{s.value}</p>
                <p className="text-[9px] text-white/60">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {inProgressStage && (
              <span className="px-2 py-0.5 rounded-full bg-blue-400/30 text-blue-200 text-[10px] flex items-center gap-1">
                <Activity className="w-2.5 h-2.5" />
                {inProgressStage.name}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              م. فداء
            </span>
            {clientName && (
              <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px]">{clientName}</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b shrink-0 bg-muted/20">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-green-600 text-green-700 bg-green-50/50"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ─── تبويب مراحل الصب ─── */}
          {activeTab === "stages" && (
            <div className="p-3 space-y-2">
              {stages.map((stage) => {
                const cfg = stageConfig[stage.status];
                const Icon = cfg.icon;
                const isExpanded = expandedStage === stage.id;

                return (
                  <div key={stage.id} className={`rounded-xl border overflow-hidden transition-all ${cfg.bg} ${cfg.border}`}>
                    <div className="flex items-center gap-2.5 p-3">
                      {/* رقم المرحلة */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 text-white"
                        style={{ backgroundColor: stage.status === "done" ? "oklch(0.55 0.15 150)" : stage.status === "in_progress" ? "oklch(0.50 0.15 250)" : "oklch(0.70 0.02 250)" }}
                      >
                        {stage.status === "done" ? <Check className="w-3.5 h-3.5" /> : stage.id}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{stage.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                          {stage.visitCount > 0 && (
                            <>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />{stage.visitCount} زيارة
                              </span>
                            </>
                          )}
                          {stage.accepted && (
                            <Badge className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 border-0">معتمدة</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {stage.status !== "done" && (
                          <button
                            onClick={() => handleAdvanceStage(stage.id)}
                            className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white transition-all"
                            style={{ backgroundColor: stage.status === "pending" ? "oklch(0.50 0.15 250)" : "oklch(0.55 0.15 150)" }}
                          >
                            {stage.status === "pending" ? "ابدأ" : "اعتمد"}
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                          className="w-6 h-6 rounded-lg bg-background/60 flex items-center justify-center"
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 border-t border-border/30 bg-background/40 space-y-2">
                        {stage.startDate && (
                          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />بدأت: {stage.startDate}</span>
                            {stage.endDate && <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" />انتهت: {stage.endDate}</span>}
                          </div>
                        )}

                        {/* زيارات هذه المرحلة */}
                        {(() => {
                          const stageVisits = visits.filter(v => v.stage === stage.name);
                          return stageVisits.length > 0 ? (
                            <div>
                              <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />الزيارات ({stageVisits.length})
                              </p>
                              {stageVisits.map(v => (
                                <div key={v.id} className="p-2 rounded-lg bg-muted/20 border border-border/30 mb-1.5">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-semibold">{v.engineer}</span>
                                    <span className="text-[10px] text-muted-foreground" dir="ltr">{v.date}</span>
                                  </div>
                                  <p className="text-[10px] text-foreground/80">{v.notes}</p>
                                  {v.issues && (
                                    <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />{v.issues}
                                    </p>
                                  )}
                                  {v.photos.length > 0 && (
                                    <div className="flex gap-1 mt-1.5">
                                      {v.photos.map(p => (
                                        <div key={p} className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50 text-[9px] text-muted-foreground">
                                          <Image className="w-2.5 h-2.5" />{p}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground text-center py-2">لا توجد زيارات مسجلة لهذه المرحلة</p>
                          );
                        })()}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-[10px] h-7 gap-1"
                          onClick={() => { setActiveTab("add"); setNewVisit(v => ({ ...v, stage: stage.name })); }}
                        >
                          <Plus className="w-3 h-3" />
                          تسجيل زيارة لهذه المرحلة
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── تبويب الزيارات ─── */}
          {activeTab === "visits" && (
            <div className="p-3 space-y-2">
              {/* تحذير عدد الزيارات */}
              {thisWeekVisits < 3 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">تنبيه: زيارات هذا الأسبوع {thisWeekVisits}/3</p>
                    <p className="text-[10px] text-amber-600">يجب ألا تقل الزيارات عن 3 مرات أسبوعياً</p>
                  </div>
                </div>
              )}

              {visits.length === 0 ? (
                <div className="text-center py-10">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">لا توجد زيارات مسجلة</p>
                </div>
              ) : (
                visits.map(visit => {
                  const isExpanded = expandedVisit === visit.id;
                  return (
                    <div key={visit.id} className="rounded-xl border border-border/60 overflow-hidden">
                      <button
                        className="w-full flex items-center gap-2.5 p-3 text-right hover:bg-muted/20 transition-colors"
                        onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <HardHat className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{visit.stage}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{visit.engineer}</span>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground" dir="ltr">{visit.date}</span>
                            {visit.issues && <Badge className="text-[9px] px-1.5 py-0 bg-red-100 text-red-700 border-0">مشكلة</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {visit.photos.length > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Camera className="w-3 h-3" />{visit.photos.length}
                            </span>
                          )}
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 pt-0 border-t border-border/30 bg-muted/10 space-y-2">
                          <div className="mt-2">
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />ملاحظات الزيارة
                            </p>
                            <p className="text-xs text-foreground/80 leading-relaxed bg-background rounded-lg p-2 border border-border/40">{visit.notes}</p>
                          </div>

                          {visit.issues && (
                            <div>
                              <p className="text-[10px] font-semibold text-red-600 mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />المشاكل المرصودة
                              </p>
                              <p className="text-xs text-red-700 bg-red-50 rounded-lg p-2 border border-red-200">{visit.issues}</p>
                            </div>
                          )}

                          {visit.photos.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Camera className="w-3 h-3" />الصور ({visit.photos.length})
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {visit.photos.map(photo => (
                                  <div key={photo} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                                    <Image className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] text-muted-foreground">{photo}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {visit.accepted && (
                            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-green-50 border border-green-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-[10px] font-semibold text-green-700">تم قبول المرحلة في هذه الزيارة</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── تبويب تسجيل زيارة جديدة ─── */}
          {activeTab === "add" && (
            <div className="p-3 space-y-3">
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  تسجيل زيارة ميدانية جديدة
                </p>
                <p className="text-[10px] text-green-600 mt-0.5">يجب توثيق كل زيارة بالملاحظات والصور</p>
              </div>

              {/* التاريخ */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  تاريخ الزيارة
                </label>
                <input
                  type="date"
                  value={newVisit.date}
                  onChange={e => setNewVisit(v => ({ ...v, date: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                  dir="ltr"
                />
              </div>

              {/* المهندس */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  المهندس المشرف
                </label>
                <select
                  value={newVisit.engineer}
                  onChange={e => setNewVisit(v => ({ ...v, engineer: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {["م. فداء", "م. مارك", "م. أمين", "م. مصطفى"].map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              {/* المرحلة */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  المرحلة الحالية
                </label>
                <select
                  value={newVisit.stage}
                  onChange={e => setNewVisit(v => ({ ...v, stage: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {INITIAL_STAGES.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* الملاحظات */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                  ملاحظات الزيارة <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="وصف ما تم فحصه، حالة العمل، مطابقة المخططات..."
                  value={newVisit.notes}
                  onChange={e => setNewVisit(v => ({ ...v, notes: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 resize-none bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                  rows={3}
                />
              </div>

              {/* المشاكل */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5 text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  المشاكل المرصودة (إن وجدت)
                </label>
                <textarea
                  placeholder="أي مخالفات أو مشاكل تحتاج متابعة..."
                  value={newVisit.issues}
                  onChange={e => setNewVisit(v => ({ ...v, issues: e.target.value }))}
                  className="w-full text-sm border rounded-lg px-3 py-2 resize-none bg-transparent focus:outline-none focus:ring-1 focus:ring-primary border-red-200"
                  rows={2}
                />
              </div>

              {/* رفع صور */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-muted-foreground" />
                  صور الزيارة
                </label>
                <button
                  onClick={() => toast.info("رفع الصور سيكون متاحاً عند ربط النظام بالسيرفر الداخلي")}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-muted/20 transition-all text-muted-foreground"
                >
                  <Camera className="w-4 h-4" />
                  <span className="text-xs">اضغط لرفع صور الموقع</span>
                </button>
              </div>

              {/* قبول المرحلة */}
              <div
                className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${newVisit.accepted ? "bg-green-50 border-green-300" : "bg-muted/20 border-border"}`}
                onClick={() => setNewVisit(v => ({ ...v, accepted: !v.accepted }))}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${newVisit.accepted ? "bg-green-500 border-green-500" : "border-muted-foreground"}`}>
                  {newVisit.accepted && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <p className="text-xs font-semibold">قبول المرحلة رسمياً</p>
                  <p className="text-[10px] text-muted-foreground">تأكيد اكتمال المرحلة وصلاحيتها للانتقال للمرحلة التالية</p>
                </div>
              </div>

              <Button
                className="w-full text-white text-sm h-10 gap-2"
                style={{ backgroundColor: "oklch(0.45 0.15 150)" }}
                onClick={handleAddVisit}
              >
                <ClipboardCheck className="w-4 h-4" />
                حفظ الزيارة الميدانية
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/10 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted-foreground">
              {doneCount === 12
                ? "✅ اكتملت جميع مراحل الصب — جاهز لإنهاء الإشراف"
                : `المرحلة الحالية: ${inProgressStage?.name || "—"}`}
            </span>
            <span className="text-[10px] font-bold text-green-600" style={{ fontFamily: "'Space Grotesk'" }}>
              {Math.round((doneCount / 12) * 100)}%
            </span>
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs h-8" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
}
