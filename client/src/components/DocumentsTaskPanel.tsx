/*
 * DocumentsTaskPanel - بطاقة تجميع المستندات التفاعلية
 * قائمة تحقق لكل مستند مطلوب مع حالة: مستلم / مطلوب / ناقص / غير مطلوب
 * مقسمة حسب الفئة: وثائق الملكية | مستندات الهوية | وثائق البلدية | تقارير فنية
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, FileText, CheckCircle2, Clock, AlertCircle, MinusCircle,
  ChevronDown, ChevronUp, Upload, MessageSquare, User,
  FolderOpen, Send, Plus, Paperclip
} from "lucide-react";

/* ─── أنواع الحالات ─── */
type DocStatus = "received" | "pending" | "missing" | "not_required";

interface Document {
  id: string;
  name: string;
  description?: string;
  status: DocStatus;
  receivedDate?: string;
  notes?: string;
  required: boolean;
}

interface DocCategory {
  id: string;
  label: string;
  icon: string;
  docs: Document[];
}

/* ─── بيانات المستندات الافتراضية ─── */
const defaultCategories: DocCategory[] = [
  {
    id: "ownership",
    label: "وثائق الملكية",
    icon: "🏠",
    docs: [
      { id: "d1", name: "الموقع العام", description: "خريطة الموقع من بلدية الكويت", status: "received", receivedDate: "10 أبريل", required: true },
      { id: "d2", name: "المدنية (سند الملكية)", description: "وثيقة ملكية القسيمة الرسمية", status: "received", receivedDate: "10 أبريل", required: true },
      { id: "d3", name: "الوثيقة / الكوشان", description: "كوشان القسيمة من البلدية", status: "received", receivedDate: "12 أبريل", required: true },
    ],
  },
  {
    id: "identity",
    label: "مستندات الهوية",
    icon: "🪪",
    docs: [
      { id: "d4", name: "البطاقة المدنية للمالك", description: "نسخة من البطاقة المدنية سارية المفعول", status: "received", receivedDate: "10 أبريل", required: true },
      { id: "d5", name: "وكالة رسمية (إن وجدت)", description: "وكالة قانونية في حال التعامل مع وكيل", status: "not_required", required: false },
    ],
  },
  {
    id: "municipality",
    label: "وثائق البلدية",
    icon: "🏛️",
    docs: [
      { id: "d6", name: "نموذج طلب رخصة البناء", description: "النموذج الرسمي من بلدية الكويت", status: "pending", required: true },
      { id: "d7", name: "تعهد المقاول", description: "تعهد المقاول المرخص بتنفيذ الأعمال", status: "missing", required: true },
      { id: "d8", name: "شهادة المهندس المشرف", description: "شهادة تسجيل المهندس في جمعية المهندسين", status: "pending", required: true },
    ],
  },
  {
    id: "technical",
    label: "تقارير فنية",
    icon: "🔬",
    docs: [
      { id: "d9", name: "تقرير فحص التربة", description: "تقرير من مختبر معتمد بالبلدية", status: "received", receivedDate: "15 أبريل", required: true },
      { id: "d10", name: "كتاب الكهرباء", description: "كتاب إيصال التيار الكهربائي من وزارة الكهرباء", status: "received", receivedDate: "15 أبريل", required: true },
      { id: "d11", name: "تقرير المساحة (إن طُلب)", description: "تقرير مساحي من جهة معتمدة", status: "not_required", required: false },
    ],
  },
];

/* ─── إعدادات الحالات ─── */
const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  received:     { label: "مستلم",      color: "oklch(0.50 0.15 150)", bg: "oklch(0.97 0.03 150)", icon: CheckCircle2 },
  pending:      { label: "مطلوب",      color: "oklch(0.55 0.15 60)",  bg: "oklch(0.97 0.03 60)",  icon: Clock        },
  missing:      { label: "ناقص",       color: "oklch(0.50 0.15 20)",  bg: "oklch(0.97 0.03 20)",  icon: AlertCircle  },
  not_required: { label: "غير مطلوب", color: "oklch(0.60 0.02 250)", bg: "oklch(0.97 0.01 250)", icon: MinusCircle  },
};

const STATUS_CYCLE: DocStatus[] = ["pending", "received", "missing", "not_required"];

interface Props {
  open: boolean;
  onClose: () => void;
  taskName?: string;
  projectName?: string;
}

export default function DocumentsTaskPanel({ open, onClose, taskName = "تجميع المستندات", projectName = "بناء جديد سكن خاص - نت" }: Props) {
  const [categories, setCategories] = useState<DocCategory[]>(defaultCategories);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["ownership", "municipality", "technical"]));
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { author: "محمد ثروت", text: "تم استلام وثائق الملكية الثلاث من العميل", time: "منذ 5 أيام" },
    { author: "محمد ثروت", text: "تقرير فحص التربة وصل وتم رفعه على الملف", time: "منذ يومين" },
  ]);

  if (!open) return null;

  /* ─── إحصائيات ─── */
  const allDocs = categories.flatMap(c => c.docs);
  const required = allDocs.filter(d => d.required);
  const receivedCount = required.filter(d => d.status === "received").length;
  const pendingCount  = required.filter(d => d.status === "pending").length;
  const missingCount  = required.filter(d => d.status === "missing").length;
  const pct = required.length > 0 ? Math.round((receivedCount / required.length) * 100) : 0;

  /* ─── تغيير حالة المستند ─── */
  const cycleStatus = (catId: string, docId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        docs: cat.docs.map(doc => {
          if (doc.id !== docId) return doc;
          const idx = STATUS_CYCLE.indexOf(doc.status);
          const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
          return {
            ...doc,
            status: next,
            receivedDate: next === "received" ? "اليوم" : doc.receivedDate,
          };
        }),
      };
    }));
  };

  /* ─── طي/فتح الفئة ─── */
  const toggleCat = (id: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ─── إرسال تعليق ─── */
  const sendComment = () => {
    if (!comment.trim()) return;
    setComments(prev => [{ author: "نولينج", text: comment.trim(), time: "الآن" }, ...prev]);
    setComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mr-auto w-full max-w-xl bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderRight: "none", borderLeft: "1px solid hsl(var(--border))" }}>

        {/* ─── Header ─── */}
        <div className="px-4 pt-4 pb-3 border-b bg-background shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
            <FolderOpen className="w-3 h-3" />
            <span>{projectName}</span>
            <span>›</span>
            <span>المرحلة الأولى - تجهيز الملف</span>
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: "oklch(0.95 0.04 250)" }}>
                📁
              </div>
              <div>
                <h2 className="font-bold text-sm leading-tight">{taskName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4"
                    style={{ borderColor: "oklch(0.70 0.10 150)", color: "oklch(0.50 0.15 150)" }}>
                    <CheckCircle2 className="w-2.5 h-2.5 ml-1" />
                    {receivedCount}/{required.length} مستلم
                  </Badge>
                  {missingCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4"
                      style={{ borderColor: "oklch(0.70 0.10 20)", color: "oklch(0.50 0.15 20)" }}>
                      <AlertCircle className="w-2.5 h-2.5 ml-1" />
                      {missingCount} ناقص
                    </Badge>
                  )}
                  {pendingCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4"
                      style={{ borderColor: "oklch(0.70 0.10 60)", color: "oklch(0.55 0.15 60)" }}>
                      <Clock className="w-2.5 h-2.5 ml-1" />
                      {pendingCount} مطلوب
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* شريط التقدم */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">اكتمال تجميع المستندات</span>
              <span className="text-[11px] font-bold" style={{ color: pct === 100 ? "oklch(0.50 0.15 150)" : "oklch(0.55 0.15 250)" }}>{pct}%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct === 100 ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 250)"
                }} />
            </div>
          </div>
        </div>

        {/* ─── المحتوى ─── */}
        <div className="flex-1 overflow-y-auto">

          {/* قائمة المستندات */}
          <div className="p-4 space-y-3">
            {categories.map(cat => {
              const isOpen = expandedCats.has(cat.id);
              const catReceived = cat.docs.filter(d => d.status === "received").length;
              const catTotal = cat.docs.length;
              return (
                <div key={cat.id} className="border rounded-xl overflow-hidden">
                  {/* رأس الفئة */}
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-sm font-semibold">{cat.label}</span>
                      <span className="text-[10px] text-muted-foreground">({catReceived}/{catTotal})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* شريط صغير */}
                      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${catTotal > 0 ? (catReceived / catTotal) * 100 : 0}%`,
                          backgroundColor: "oklch(0.55 0.15 150)"
                        }} />
                      </div>
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* قائمة المستندات */}
                  {isOpen && (
                    <div className="divide-y">
                      {cat.docs.map(doc => {
                        const cfg = STATUS_CONFIG[doc.status];
                        const Icon = cfg.icon;
                        return (
                          <div key={doc.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors">
                            {/* زر تغيير الحالة */}
                            <button
                              onClick={() => cycleStatus(cat.id, doc.id)}
                              className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                              title="انقر لتغيير الحالة"
                            >
                              <Icon className="w-4.5 h-4.5" style={{ color: cfg.color, width: 18, height: 18 }} />
                            </button>

                            {/* معلومات المستند */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${doc.status === "not_required" ? "line-through text-muted-foreground" : ""}`}>
                                  {doc.name}
                                </span>
                                {!doc.required && (
                                  <span className="text-[10px] text-muted-foreground">(اختياري)</span>
                                )}
                              </div>
                              {doc.description && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{doc.description}</p>
                              )}
                              {doc.receivedDate && doc.status === "received" && (
                                <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.50 0.15 150)" }}>
                                  ✓ تم الاستلام: {doc.receivedDate}
                                </p>
                              )}
                            </div>

                            {/* شارة الحالة */}
                            <div className="shrink-0">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* تعليمة الاستخدام */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 text-[11px] text-muted-foreground">
              <span>💡</span>
              <span>انقر على أيقونة الحالة لتغييرها: مطلوب ← مستلم ← ناقص ← غير مطلوب</span>
            </div>
          </div>

          {/* ─── قسم التعليقات ─── */}
          <div className="px-4 pb-4 border-t pt-3">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              السجل والملاحظات
            </h3>

            <div className="space-y-2.5 mb-3 max-h-36 overflow-y-auto">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                    style={{ backgroundColor: "oklch(0.50 0.15 250)" }}>
                    {c.author[0]}
                  </div>
                  <div className="flex-1 bg-muted/40 rounded-lg px-2.5 py-1.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold">{c.author}</span>
                      <span className="text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                    <p className="text-xs">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* إضافة تعليق */}
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                style={{ backgroundColor: "oklch(0.50 0.15 150)" }}>
                ن
              </div>
              <div className="flex-1 flex gap-1.5">
                <input
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendComment()}
                  placeholder="أضف ملاحظة أو تحديث..."
                  className="flex-1 text-xs border rounded-lg px-2.5 py-1.5 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={sendComment}
                  disabled={!comment.trim()}
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ backgroundColor: "oklch(0.50 0.15 250)", color: "white" }}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div className="px-4 py-3 border-t bg-background flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span>المسؤول: محمد ثروت</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Paperclip className="w-3 h-3" />
              رفع ملف
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1"
              style={{ backgroundColor: "oklch(0.50 0.15 150)" }}
              onClick={onClose}>
              <CheckCircle2 className="w-3 h-3" />
              حفظ وإغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
