/*
 * DocumentsTaskPanel - بطاقة تجميع المستندات (سكن خاص - بناء جديد)
 * ─ مهمة تلقائية للسكرتير محمد ثروت بالاتصال على العميل وجمع المستندات
 * ─ 4 مستندات مطلوبة: بطاقة مدنية زوج، بطاقة مدنية زوجة، وثيقة الأرض، الموقع العام
 * ─ رفع المستند يظهر تلقائياً في حافظة مستندات العميل
 */
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X, CheckCircle2, Clock, AlertCircle, MinusCircle,
  ChevronDown, ChevronUp, MessageSquare, FolderOpen,
  Send, Upload, Phone, User, Bell, FileText,
  Paperclip, Eye, Trash2, CheckSquare, Square
} from "lucide-react";

/* ─── أنواع ─── */
type DocStatus = "pending" | "received" | "missing";

interface UploadedFile {
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface RequiredDoc {
  id: string;
  name: string;
  description: string;
  status: DocStatus;
  receivedDate?: string;
  file?: UploadedFile;
}

interface SecretaryTask {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: "pending" | "done" | "in_progress";
  notes?: string;
  createdAt: string;
}

/* ─── إعدادات الحالات ─── */
const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: "مطلوب",  color: "oklch(0.55 0.15 60)",  bg: "oklch(0.97 0.03 60)",  icon: Clock        },
  received: { label: "مستلم",  color: "oklch(0.50 0.15 150)", bg: "oklch(0.97 0.03 150)", icon: CheckCircle2 },
  missing:  { label: "ناقص",   color: "oklch(0.50 0.15 20)",  bg: "oklch(0.97 0.03 20)",  icon: AlertCircle  },
};

/* ─── المستندات المطلوبة (سكن خاص - بناء جديد) ─── */
const INITIAL_DOCS: RequiredDoc[] = [
  {
    id: "doc1",
    name: "البطاقة المدنية للزوج",
    description: "نسخة من البطاقة المدنية سارية المفعول",
    status: "pending",
  },
  {
    id: "doc2",
    name: "البطاقة المدنية للزوجة",
    description: "نسخة من البطاقة المدنية سارية المفعول",
    status: "pending",
  },
  {
    id: "doc3",
    name: "وثيقة الأرض (الكوشان)",
    description: "سند ملكية القسيمة الرسمي من البلدية",
    status: "pending",
  },
  {
    id: "doc4",
    name: "الموقع العام للأرض",
    description: "خريطة الموقع من بلدية الكويت تُظهر موقع القسيمة",
    status: "pending",
  },
];

/* ─── مهمة السكرتير التلقائية ─── */
const INITIAL_SECRETARY_TASK: SecretaryTask = {
  id: "st1",
  title: "الاتصال بالعميل وجمع المستندات المطلوبة",
  assignee: "محمد ثروت",
  dueDate: "خلال يومي عمل",
  status: "in_progress",
  notes: "التواصل مع العميل عبر الواتساب أو الاتصال المباشر وطلب إرسال المستندات الأربعة المطلوبة",
  createdAt: "اليوم - تم الإنشاء تلقائياً عند فتح الملف",
};

interface Props {
  open: boolean;
  onClose: () => void;
  taskName?: string;
  projectName?: string;
  clientName?: string;
  clientPhone?: string;
  onDocumentsUpdate?: (docs: RequiredDoc[]) => void; // لربط حافظة العميل
}

export default function DocumentsTaskPanel({
  open,
  onClose,
  taskName = "تجميع المستندات",
  projectName = "بناء جديد سكن خاص",
  clientName = "فهد العتيبي",
  clientPhone = "9XXXX5050",
  onDocumentsUpdate,
}: Props) {
  const [docs, setDocs] = useState<RequiredDoc[]>(INITIAL_DOCS);
  const [secTask, setSecTask] = useState<SecretaryTask>(INITIAL_SECRETARY_TASK);
  const [activeTab, setActiveTab] = useState<"docs" | "task" | "folder">("docs");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([
    { author: "النظام", text: "تم إنشاء مهمة تلقائية للسكرتير محمد ثروت بجمع المستندات من العميل", time: "اليوم", isSystem: true },
  ]);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  /* ─── إحصائيات ─── */
  const receivedCount = docs.filter(d => d.status === "received").length;
  const pct = Math.round((receivedCount / docs.length) * 100);
  const allReceived = receivedCount === docs.length;

  /* ─── محاكاة رفع ملف ─── */
  const handleUploadClick = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId) return;

    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    const updatedDocs = docs.map(d => {
      if (d.id !== uploadingDocId) return d;
      return {
        ...d,
        status: "received" as DocStatus,
        receivedDate: "اليوم",
        file: {
          name: file.name,
          size: sizeStr,
          uploadedAt: new Date().toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" }),
          uploadedBy: "محمد ثروت",
        },
      };
    });

    setDocs(updatedDocs);
    onDocumentsUpdate?.(updatedDocs); // إبلاغ حافظة العميل

    // تعليق تلقائي
    const docName = docs.find(d => d.id === uploadingDocId)?.name;
    setComments(prev => [{
      author: "محمد ثروت",
      text: `✅ تم رفع "${docName}" بنجاح — ${file.name}`,
      time: "الآن",
      isSystem: false,
    }, ...prev]);

    // إذا اكتملت كل المستندات
    const newReceived = updatedDocs.filter(d => d.status === "received").length;
    if (newReceived === updatedDocs.length) {
      setSecTask(prev => ({ ...prev, status: "done" }));
      setComments(prev => [{
        author: "النظام",
        text: "🎉 تم استلام جميع المستندات المطلوبة — تم تحديث حافظة مستندات العميل تلقائياً",
        time: "الآن",
        isSystem: true,
      }, ...prev]);
    }

    setUploadingDocId(null);
    e.target.value = "";
  };

  /* ─── تغيير حالة المستند يدوياً ─── */
  const cycleStatus = (docId: string) => {
    const cycle: DocStatus[] = ["pending", "received", "missing"];
    setDocs(prev => prev.map(d => {
      if (d.id !== docId) return d;
      const idx = cycle.indexOf(d.status);
      const next = cycle[(idx + 1) % cycle.length];
      return { ...d, status: next, receivedDate: next === "received" ? "اليوم" : d.receivedDate };
    }));
  };

  /* ─── إرسال تعليق ─── */
  const sendComment = () => {
    if (!comment.trim()) return;
    setComments(prev => [{ author: "نولينج", text: comment.trim(), time: "الآن", isSystem: false }, ...prev]);
    setComment("");
  };

  /* ─── مستندات حافظة العميل (محاكاة) ─── */
  const clientFolderDocs = docs.filter(d => d.status === "received" && d.file);

  const tabStyle = (tab: string) => ({
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: activeTab === tab ? "700" : "500",
    background: activeTab === tab ? "oklch(0.50 0.15 250)" : "transparent",
    color: activeTab === tab ? "white" : "oklch(0.55 0.02 250)",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      {/* hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mr-auto w-full max-w-xl bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: "1px solid hsl(var(--border))" }}>

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
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4"
                    style={{ borderColor: "oklch(0.70 0.10 150)", color: "oklch(0.50 0.15 150)" }}>
                    <CheckCircle2 className="w-2.5 h-2.5 ml-1" />
                    {receivedCount}/{docs.length} مستلم
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4"
                    style={{
                      borderColor: secTask.status === "done" ? "oklch(0.70 0.10 150)" : "oklch(0.70 0.10 60)",
                      color: secTask.status === "done" ? "oklch(0.50 0.15 150)" : "oklch(0.55 0.15 60)"
                    }}>
                    <User className="w-2.5 h-2.5 ml-1" />
                    مهمة م. ثروت: {secTask.status === "done" ? "مكتملة" : "جارية"}
                  </Badge>
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
              <span className="text-[11px] font-bold"
                style={{ color: allReceived ? "oklch(0.50 0.15 150)" : "oklch(0.55 0.15 250)" }}>
                {pct}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: allReceived ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 250)"
                }} />
            </div>
          </div>

          {/* تبويبات */}
          <div className="flex gap-1 mt-3 bg-muted/30 rounded-lg p-1">
            <button style={tabStyle("docs")} onClick={() => setActiveTab("docs")}>
              📋 المستندات
            </button>
            <button style={tabStyle("task")} onClick={() => setActiveTab("task")}>
              ✅ مهمة السكرتير
            </button>
            <button style={tabStyle("folder")} onClick={() => setActiveTab("folder")}>
              🗂️ حافظة العميل
              {clientFolderDocs.length > 0 && (
                <span className="mr-1 bg-white/30 text-white rounded-full px-1.5 text-[10px]">
                  {clientFolderDocs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ─── المحتوى ─── */}
        <div className="flex-1 overflow-y-auto">

          {/* ═══ تبويب المستندات ═══ */}
          {activeTab === "docs" && (
            <div className="p-4 space-y-2.5">
              {/* معلومات العميل */}
              <div className="flex items-center justify-between p-2.5 rounded-xl border bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "oklch(0.50 0.15 250)" }}>
                    {clientName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold">{clientName}</p>
                    <p className="text-[10px] text-muted-foreground">{clientPhone}</p>
                  </div>
                </div>
                <a href={`tel:${clientPhone}`}
                  className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "oklch(0.50 0.15 150)" }}>
                  <Phone className="w-3 h-3" />
                  اتصال
                </a>
              </div>

              {/* قائمة المستندات */}
              <div className="border rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 border-b">
                  <p className="text-xs font-semibold">المستندات المطلوبة من العميل</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    انقر على الأيقونة لتغيير الحالة · انقر على "رفع" لإضافة الملف
                  </p>
                </div>
                <div className="divide-y">
                  {docs.map(doc => {
                    const cfg = STATUS_CONFIG[doc.status];
                    const Icon = cfg.icon;
                    return (
                      <div key={doc.id} className="px-3 py-3 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start gap-2.5">
                          {/* أيقونة الحالة */}
                          <button onClick={() => cycleStatus(doc.id)} className="mt-0.5 shrink-0 hover:scale-110 transition-transform" title="انقر لتغيير الحالة">
                            <Icon style={{ color: cfg.color, width: 18, height: 18 }} />
                          </button>

                          {/* المعلومات */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium">{doc.name}</span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{doc.description}</p>

                            {/* ملف مرفوع */}
                            {doc.file && (
                              <div className="flex items-center gap-2 mt-1.5 p-1.5 rounded-lg bg-muted/30">
                                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.50 0.15 250)" }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-medium truncate">{doc.file.name}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {doc.file.size} · رُفع {doc.file.uploadedAt} بواسطة {doc.file.uploadedBy}
                                  </p>
                                </div>
                                <button className="p-1 rounded hover:bg-muted transition-colors">
                                  <Eye className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </div>
                            )}

                            {/* تاريخ الاستلام */}
                            {doc.receivedDate && doc.status === "received" && !doc.file && (
                              <p className="text-[10px] mt-1" style={{ color: "oklch(0.50 0.15 150)" }}>
                                ✓ تم الاستلام: {doc.receivedDate}
                              </p>
                            )}
                          </div>

                          {/* زر رفع */}
                          <button
                            onClick={() => handleUploadClick(doc.id)}
                            className="shrink-0 flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors hover:bg-muted"
                          >
                            <Upload className="w-3 h-3" />
                            رفع
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* تعليمة */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 text-[11px] text-muted-foreground">
                <span>💡</span>
                <span>عند رفع أي مستند سيظهر تلقائياً في حافظة مستندات العميل</span>
              </div>

              {/* سجل التعليقات */}
              <div className="border-t pt-3">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  السجل والملاحظات
                </h3>
                <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                  {comments.map((c, i) => (
                    <div key={i} className={`flex gap-2 ${c.isSystem ? "opacity-70" : ""}`}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                        style={{ backgroundColor: c.isSystem ? "oklch(0.60 0.02 250)" : "oklch(0.50 0.15 250)" }}>
                        {c.isSystem ? "⚙" : c.author[0]}
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
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 text-white"
                    style={{ backgroundColor: "oklch(0.50 0.15 150)" }}>ن</div>
                  <div className="flex-1 flex gap-1.5">
                    <input value={comment} onChange={e => setComment(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendComment()}
                      placeholder="أضف ملاحظة..."
                      className="flex-1 text-xs border rounded-lg px-2.5 py-1.5 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary" />
                    <button onClick={sendComment} disabled={!comment.trim()}
                      className="p-1.5 rounded-lg disabled:opacity-40 text-white"
                      style={{ backgroundColor: "oklch(0.50 0.15 250)" }}>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ تبويب مهمة السكرتير ═══ */}
          {activeTab === "task" && (
            <div className="p-4 space-y-3">
              {/* بطاقة المهمة التلقائية */}
              <div className="border rounded-xl overflow-hidden">
                <div className="px-3 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: secTask.status === "done" ? "oklch(0.97 0.03 150)" : "oklch(0.97 0.03 60)" }}>
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5" style={{ color: secTask.status === "done" ? "oklch(0.50 0.15 150)" : "oklch(0.55 0.15 60)" }} />
                    <span className="text-xs font-bold">مهمة تلقائية</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: secTask.status === "done" ? "oklch(0.50 0.15 150)" : "oklch(0.55 0.15 60)",
                        color: "white"
                      }}>
                      {secTask.status === "done" ? "✓ مكتملة" : "⏳ جارية"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{secTask.createdAt}</span>
                </div>

                <div className="p-3 space-y-3">
                  <div>
                    <p className="text-sm font-bold">{secTask.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{secTask.notes}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground">المسؤول</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ backgroundColor: "oklch(0.50 0.15 250)" }}>م</div>
                        <span className="text-xs font-semibold">{secTask.assignee}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-[10px] text-muted-foreground">الموعد</p>
                      <p className="text-xs font-semibold mt-1">{secTask.dueDate}</p>
                    </div>
                  </div>

                  {/* قائمة التحقق للمهمة */}
                  <div>
                    <p className="text-[11px] font-semibold mb-2">خطوات المهمة:</p>
                    <div className="space-y-1.5">
                      {[
                        { text: "الاتصال بالعميل وإبلاغه بالمستندات المطلوبة", done: true },
                        { text: "إرسال قائمة المستندات عبر الواتساب", done: true },
                        { text: "استلام المستندات من العميل", done: receivedCount > 0 },
                        { text: "رفع المستندات في الكرت وحافظة العميل", done: receivedCount === docs.length },
                      ].map((step, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {step.done
                            ? <CheckSquare className="w-4 h-4 shrink-0" style={{ color: "oklch(0.50 0.15 150)" }} />
                            : <Square className="w-4 h-4 shrink-0 text-muted-foreground" />}
                          <span className={`text-xs ${step.done ? "line-through text-muted-foreground" : ""}`}>
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* معلومات الاتصال */}
                  <div className="p-2.5 rounded-lg border">
                    <p className="text-[10px] text-muted-foreground mb-1.5">بيانات الاتصال بالعميل</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold">{clientName}</p>
                        <p className="text-[11px] text-muted-foreground">{clientPhone}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <a href={`tel:${clientPhone}`}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: "oklch(0.50 0.15 150)" }}>
                          <Phone className="w-3 h-3" />
                          اتصال
                        </a>
                        <a href={`https://wa.me/965${clientPhone}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: "oklch(0.50 0.15 145)" }}>
                          واتساب
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* زر إتمام المهمة */}
                  {secTask.status !== "done" && (
                    <Button
                      className="w-full h-8 text-xs"
                      style={{ backgroundColor: "oklch(0.50 0.15 150)" }}
                      onClick={() => {
                        setSecTask(prev => ({ ...prev, status: "done" }));
                        setComments(prev => [{
                          author: "محمد ثروت",
                          text: "تم إتمام مهمة تجميع المستندات",
                          time: "الآن",
                          isSystem: false,
                        }, ...prev]);
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 ml-1.5" />
                      تأكيد إتمام المهمة
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ تبويب حافظة العميل ═══ */}
          {activeTab === "folder" && (
            <div className="p-4 space-y-3">
              {/* رأس الحافظة */}
              <div className="flex items-center justify-between p-3 rounded-xl border"
                style={{ background: "linear-gradient(135deg, oklch(0.97 0.03 250), oklch(0.95 0.05 250))" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                    style={{ backgroundColor: "oklch(0.50 0.15 250)", color: "white" }}>
                    🗂️
                  </div>
                  <div>
                    <p className="text-sm font-bold">حافظة مستندات العميل</p>
                    <p className="text-[11px] text-muted-foreground">{clientName} · {clientFolderDocs.length} مستند مرفوع</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]"
                  style={{ borderColor: "oklch(0.70 0.10 250)", color: "oklch(0.50 0.15 250)" }}>
                  {clientFolderDocs.length}/{docs.length}
                </Badge>
              </div>

              {clientFolderDocs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-sm font-medium text-muted-foreground">لا توجد مستندات مرفوعة بعد</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    عند رفع المستندات في تبويب "المستندات" ستظهر هنا تلقائياً
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientFolderDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-xl border hover:bg-muted/20 transition-colors">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "oklch(0.95 0.04 250)" }}>
                        <FileText className="w-4.5 h-4.5" style={{ color: "oklch(0.50 0.15 250)", width: 18, height: 18 }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{doc.file?.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {doc.file?.size} · {doc.file?.uploadedAt} · {doc.file?.uploadedBy}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* المستندات المنتظرة */}
              {docs.filter(d => d.status !== "received").length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-muted/30 border-b">
                    <p className="text-xs font-semibold text-muted-foreground">المستندات المنتظرة</p>
                  </div>
                  <div className="divide-y">
                    {docs.filter(d => d.status !== "received").map(doc => {
                      const cfg = STATUS_CONFIG[doc.status];
                      const Icon = cfg.icon;
                      return (
                        <div key={doc.id} className="flex items-center gap-2.5 px-3 py-2.5">
                          <Icon style={{ color: cfg.color, width: 16, height: 16 }} />
                          <span className="text-xs flex-1">{doc.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="px-4 py-3 border-t bg-background flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span>المسؤول: محمد ثروت</span>
          </div>
          <Button size="sm" className="h-7 text-xs gap-1"
            style={{ backgroundColor: allReceived ? "oklch(0.50 0.15 150)" : "oklch(0.50 0.15 250)" }}
            onClick={onClose}>
            <CheckCircle2 className="w-3 h-3" />
            {allReceived ? "مكتمل — إغلاق" : "حفظ وإغلاق"}
          </Button>
        </div>
      </div>
    </div>
  );
}
