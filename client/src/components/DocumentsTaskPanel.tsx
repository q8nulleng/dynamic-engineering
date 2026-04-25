/*
 * DocumentsTaskPanel - بطاقة تجميع المستندات (سكن خاص - بناء جديد)
 * ─ كرت مختصر: قائمة 4 مستندات + تاق المسؤول (محمد ثروت)
 * ─ الملفات المرفوعة تروح تلقائياً لقسم المستندات تحت اسم العميل
 * ─ المهمة تظهر بجدول مهام الموظف عند تسجيل الدخول
 */
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X, CheckCircle2, Clock, AlertCircle,
  Upload, Phone, FileText, Eye, User
} from "lucide-react";
import { toast } from "sonner";

/* ─── أنواع ─── */
type DocStatus = "pending" | "received" | "missing";

interface UploadedFile {
  name: string;
  size: string;
  uploadedAt: string;
}

interface RequiredDoc {
  id: string;
  name: string;
  status: DocStatus;
  file?: UploadedFile;
}

/* ─── إعدادات الحالات ─── */
const STATUS_CFG: Record<DocStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:  { label: "مطلوب", color: "oklch(0.55 0.15 60)",  bg: "oklch(0.97 0.03 60)",  icon: Clock },
  received: { label: "مستلم", color: "oklch(0.50 0.15 150)", bg: "oklch(0.97 0.03 150)", icon: CheckCircle2 },
  missing:  { label: "ناقص",  color: "oklch(0.50 0.15 20)",  bg: "oklch(0.97 0.03 20)",  icon: AlertCircle },
};

/* ─── المستندات المطلوبة ─── */
const INITIAL_DOCS: RequiredDoc[] = [
  { id: "d1", name: "البطاقة المدنية للزوج",  status: "received", file: { name: "civil-id-husband.pdf", size: "1.2 MB", uploadedAt: "10:30 ص" } },
  { id: "d2", name: "البطاقة المدنية للزوجة", status: "received", file: { name: "civil-id-wife.pdf", size: "980 KB", uploadedAt: "10:32 ص" } },
  { id: "d3", name: "وثيقة الأرض",            status: "pending" },
  { id: "d4", name: "الموقع العام",            status: "pending" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  taskName?: string;
  projectName?: string;
  clientName?: string;
  clientPhone?: string;
}

export default function DocumentsTaskPanel({
  open,
  onClose,
  taskName = "تجميع المستندات",
  projectName = "فيلا العتيبي - السالمية",
  clientName = "فهد العتيبي",
  clientPhone = "9XXXX5050",
}: Props) {
  const [docs, setDocs] = useState<RequiredDoc[]>(INITIAL_DOCS);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const receivedCount = docs.filter(d => d.status === "received").length;
  const pct = Math.round((receivedCount / docs.length) * 100);
  const allDone = receivedCount === docs.length;

  /* ─── رفع ملف ─── */
  const handleUploadClick = (docId: string) => {
    setUploadingDocId(docId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocId) return;

    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    const docName = docs.find(d => d.id === uploadingDocId)?.name;

    setDocs(prev => prev.map(d => {
      if (d.id !== uploadingDocId) return d;
      return {
        ...d,
        status: "received" as DocStatus,
        file: {
          name: file.name,
          size: sizeStr,
          uploadedAt: new Date().toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" }),
        },
      };
    }));

    // إشعار: الملف راح لقسم المستندات
    toast.success(`تم رفع "${docName}"`, {
      description: `📁 تم إضافة الملف تلقائياً في مستندات العميل "${clientName}"`,
    });

    // إذا اكتملت كل المستندات
    const newReceived = docs.filter(d => d.status === "received").length + 1;
    if (newReceived === docs.length) {
      toast.success("🎉 اكتملت جميع المستندات!", {
        description: "تم تحديث حالة المهمة تلقائياً",
      });
    }

    setUploadingDocId(null);
    e.target.value = "";
  };

  /* ─── تغيير حالة يدوي ─── */
  const cycleStatus = (docId: string) => {
    const cycle: DocStatus[] = ["pending", "received", "missing"];
    setDocs(prev => prev.map(d => {
      if (d.id !== docId) return d;
      const idx = cycle.indexOf(d.status);
      return { ...d, status: cycle[(idx + 1) % cycle.length] };
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mr-auto w-full max-w-md bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: "1px solid hsl(var(--border))" }}>

        {/* ─── Header ─── */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: "oklch(0.95 0.04 250)" }}>📁</div>
              <div>
                <h2 className="font-bold text-sm">{taskName}</h2>
                <p className="text-[10px] text-muted-foreground">{projectName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* تاق المسؤول + حالة */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 gap-1"
              style={{ borderColor: "oklch(0.55 0.15 250)", color: "oklch(0.45 0.15 250)" }}>
              <User className="w-2.5 h-2.5" />
              محمد ثروت
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5"
              style={{
                borderColor: allDone ? "oklch(0.60 0.15 150)" : "oklch(0.60 0.15 60)",
                color: allDone ? "oklch(0.45 0.15 150)" : "oklch(0.50 0.15 60)",
              }}>
              {allDone ? "✓ مكتمل" : `${receivedCount}/${docs.length} مستلم`}
            </Badge>
          </div>

          {/* شريط التقدم */}
          <div className="mt-2.5">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: allDone ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 250)",
                }} />
            </div>
          </div>
        </div>

        {/* ─── معلومات العميل ─── */}
        <div className="px-4 py-2.5 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: "oklch(0.50 0.15 250)" }}>
              {clientName[0]}
            </div>
            <div>
              <p className="text-xs font-semibold">{clientName}</p>
              <p className="text-[10px] text-muted-foreground">{clientPhone}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <a href={`https://wa.me/965${clientPhone}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md text-white"
              style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
              واتساب
            </a>
            <a href={`tel:${clientPhone}`}
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border hover:bg-muted transition-colors">
              <Phone className="w-2.5 h-2.5" />
              اتصال
            </a>
          </div>
        </div>

        {/* ─── قائمة المستندات ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y">
            {docs.map(doc => {
              const cfg = STATUS_CFG[doc.status];
              const Icon = cfg.icon;
              return (
                <div key={doc.id} className="px-4 py-3 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* أيقونة الحالة */}
                    <button onClick={() => cycleStatus(doc.id)}
                      className="shrink-0 hover:scale-110 transition-transform" title="غيّر الحالة">
                      <Icon style={{ color: cfg.color, width: 20, height: 20 }} />
                    </button>

                    {/* اسم المستند + حالة */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{doc.name}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* ملف مرفوع */}
                      {doc.file && (
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground">
                          <FileText className="w-3 h-3" style={{ color: "oklch(0.50 0.15 250)" }} />
                          <span className="truncate">{doc.file.name}</span>
                          <span>·</span>
                          <span>{doc.file.size}</span>
                          <button className="p-0.5 rounded hover:bg-muted transition-colors mr-1">
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* زر رفع */}
                    {doc.status !== "received" && (
                      <button onClick={() => handleUploadClick(doc.id)}
                        className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1.5 rounded-lg border hover:bg-muted transition-colors">
                        <Upload className="w-3 h-3" />
                        رفع
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── تذييل ─── */}
        <div className="px-4 py-2.5 border-t bg-muted/20 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            📁 الملفات المرفوعة تُضاف تلقائياً في قسم المستندات تحت اسم العميل
          </p>
        </div>
      </div>
    </div>
  );
}
