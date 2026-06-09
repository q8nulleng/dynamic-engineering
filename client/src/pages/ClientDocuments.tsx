/**
 * ClientDocuments — صفحة مستندات عميل محدد
 * تصميم مجلدات ملونة مع أيقونات دلالية لكل نوع مستند
 */
import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, FileText, Image, File, Eye, Download,
  FolderOpen, X, Upload, Share2,
  ZoomIn, ZoomOut, RotateCw, ExternalLink, Folder,
  Stamp, MapPin, ClipboardCheck, HardHat, BookOpen,
  Building2, Ruler, Droplets, Layers, PenTool, Map,
  MonitorSpeaker, Zap, FileCode2, ChevronLeft, Plus,
} from "lucide-react";
import { useDocuments, useProjects, useClients, useUploadDocument } from "@/lib/api";
import { toast } from "sonner";

/* ─── تعريف مجلدات المستندات الثابتة ─── */
interface FolderDef {
  id: string;
  label: string;
  category: string;
  icon: React.ElementType;
  color: string;        // لون الأيقونة والنص
  bg: string;           // لون الخلفية
  border: string;       // لون الحدود
  group: string;        // المجموعة
}

const DOCUMENT_FOLDERS: FolderDef[] = [
  // ─── مستندات البلدية ───
  {
    id: "license",
    label: "الرخصة",
    category: "الرخصة",
    icon: Stamp,
    color: "#1d4ed8",
    bg: "#eff6ff",
    border: "#bfdbfe",
    group: "مستندات البلدية",
  },
  {
    id: "boundary",
    label: "استلام الحدود",
    category: "استلام الحدود",
    icon: MapPin,
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
    group: "مستندات البلدية",
  },
  {
    id: "supervision_end",
    label: "إنهاء الإشراف",
    category: "إنهاء الإشراف",
    icon: ClipboardCheck,
    color: "#15803d",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    group: "مستندات البلدية",
  },
  {
    id: "supervision",
    label: "الإشراف",
    category: "الإشراف",
    icon: HardHat,
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
    group: "مستندات البلدية",
  },
  {
    id: "first_plan_page",
    label: "صفحة المخطط الأولى",
    category: "صفحة المخطط الأولى",
    icon: BookOpen,
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#ddd6fe",
    group: "مستندات البلدية",
  },
  {
    id: "arch_plans",
    label: "المخططات المعمارية",
    category: "المخططات المعمارية",
    icon: Building2,
    color: "#0f766e",
    bg: "#f0fdfa",
    border: "#99f6e4",
    group: "مستندات البلدية",
  },
  {
    id: "struct_plans",
    label: "المخططات الإنشائية",
    category: "المخططات الإنشائية",
    icon: Ruler,
    color: "#b91c1c",
    bg: "#fff1f2",
    border: "#fecdd3",
    group: "مستندات البلدية",
  },
  {
    id: "mep_plans",
    label: "مخططات الصحي والكهرباء والتكييف",
    category: "مخططات الصحي والكهرباء والتكييف",
    icon: Droplets,
    color: "#0284c7",
    bg: "#f0f9ff",
    border: "#7dd3fc",
    group: "مستندات البلدية",
  },
  {
    id: "facade_plans",
    label: "مخططات الواجهات",
    category: "مخططات الواجهات",
    icon: Layers,
    color: "#9333ea",
    bg: "#fdf4ff",
    border: "#e9d5ff",
    group: "مستندات البلدية",
  },
  {
    id: "detail_plans",
    label: "المخططات التفصيلية",
    category: "المخططات التفصيلية",
    icon: PenTool,
    color: "#c2410c",
    bg: "#fff7ed",
    border: "#fed7aa",
    group: "مستندات البلدية",
  },
  {
    id: "municipality_plans",
    label: "مخططات البلدية",
    category: "مخططات البلدية",
    icon: Map,
    color: "#166534",
    bg: "#f0fdf4",
    border: "#86efac",
    group: "مستندات البلدية",
  },
  {
    id: "autocad_dwf",
    label: "الأوتوكاد والـ DWF",
    category: "الأوتوكاد والـ DWF",
    icon: FileCode2,
    color: "#374151",
    bg: "#f9fafb",
    border: "#d1d5db",
    group: "مستندات البلدية",
  },
  // ─── مستندات الكهرباء ───
  {
    id: "electricity_connection",
    label: "لايصال التيار",
    category: "لايصال التيار",
    icon: Zap,
    color: "#ca8a04",
    bg: "#fefce8",
    border: "#fde047",
    group: "مستندات الكهرباء",
  },
  // ─── مستندات العميل ───
  {
    id: "civil_id",
    label: "البطاقة المدنية",
    category: "بطاقة مدنية",
    icon: FileText,
    color: "#1e40af",
    bg: "#eff6ff",
    border: "#93c5fd",
    group: "مستندات العميل",
  },
  {
    id: "ownership_deed",
    label: "وثيقة الملكية",
    category: "وثيقة ملكية",
    icon: Stamp,
    color: "#065f46",
    bg: "#ecfdf5",
    border: "#6ee7b7",
    group: "مستندات العميل",
  },
  {
    id: "site_map_doc",
    label: "خريطة الموقع",
    category: "خريطة الموقع",
    icon: MapPin,
    color: "#7e22ce",
    bg: "#faf5ff",
    border: "#c4b5fd",
    group: "مستندات العميل",
  },
  {
    id: "soil_test",
    label: "فحص التربة",
    category: "فحوصات تقنية",
    icon: MonitorSpeaker,
    color: "#92400e",
    bg: "#fffbeb",
    border: "#fcd34d",
    group: "فحوصات تقنية",
  },
  {
    id: "other_docs",
    label: "أخرى",
    category: "أخرى",
    icon: Folder,
    color: "#6b7280",
    bg: "#f9fafb",
    border: "#e5e7eb",
    group: "أخرى",
  },
];

const GROUP_ORDER = [
  "مستندات البلدية",
  "مستندات الكهرباء",
  "مستندات العميل",
  "فحوصات تقنية",
  "أخرى",
];

/* ─── تحديد نوع الملف ─── */
function getFileType(doc: { name: string; url: string; mimeType?: string; fileExtension?: string }) {
  if (doc.mimeType) {
    if (doc.mimeType.includes("pdf")) return "pdf";
    if (doc.mimeType.startsWith("image/")) return "image";
    if (doc.mimeType.includes("dwg") || doc.mimeType.includes("autocad")) return "cad";
    if (doc.mimeType.includes("word") || doc.mimeType.includes("document")) return "word";
    if (doc.mimeType.includes("sheet") || doc.mimeType.includes("excel")) return "excel";
  }
  const ext = (doc.fileExtension || doc.name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext)) return "image";
  if (["dwg", "dxf", "dwf"].includes(ext)) return "cad";
  if (["doc", "docx", "odt"].includes(ext)) return "word";
  if (["xls", "xlsx", "ods"].includes(ext)) return "excel";
  return "pdf";
}

/* ─── نافذة معاينة الملف ─── */
function FilePreviewModal({
  doc,
  onClose,
}: {
  doc: { id: number; name: string; url: string; mimeType?: string; fileExtension?: string; category?: string } | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!doc) return null;

  const fileType = getFileType(doc);
  const viewUrl = `/api/documents/${doc.id}/view`;
  const downloadUrl = `/api/documents/${doc.id}/download`;
  const shareUrl = doc.url.startsWith("http") ? doc.url : window.location.origin + doc.url;

  const shareWhatsApp = () => {
    const text = `📄 ${doc.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-card/95 backdrop-blur border-b shrink-0">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          {doc.category && <p className="text-xs text-muted-foreground">{doc.category}</p>}
        </div>
        {fileType === "image" && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(25, z - 25))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs w-10 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(300, z + 25))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRotation(r => (r + 90) % 360)}>
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={shareWhatsApp} title="مشاركة واتساب">
          <Share2 className="w-4 h-4" />
        </Button>
        <a href={downloadUrl}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            تنزيل
          </Button>
        </a>
        <a href={viewUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="فتح في تبويب جديد">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {fileType === "pdf" ? (
          <iframe
            src={viewUrl}
            className="w-full h-full rounded-lg border-0 bg-white"
            style={{ minHeight: "75vh", maxWidth: "900px" }}
            title={doc.name}
          />
        ) : fileType === "image" ? (
          <img
            src={viewUrl}
            alt={doc.name}
            className="rounded-lg shadow-2xl object-contain"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease",
            }}
          />
        ) : (
          <div className="text-center text-white/70 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <File className="w-10 h-10 text-white/50" />
            </div>
            <p className="text-sm font-medium text-white/90">{doc.name}</p>
            <p className="text-xs text-white/50">
              {fileType === "cad" ? "ملف أوتوكاد — يُفتح ببرنامج AutoCAD أو DWF Viewer" : "هذا النوع لا يدعم المعاينة المباشرة"}
            </p>
            <a href={downloadUrl}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Download className="w-4 h-4 ml-2" />
                تنزيل الملف
              </Button>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── نافذة محتويات المجلد ─── */
function FolderModal({
  folder,
  docs,
  onClose,
  onPreview,
  onUpload,
  uploading,
}: {
  folder: FolderDef;
  docs: any[];
  onClose: () => void;
  onPreview: (doc: any) => void;
  onUpload: (folder: FolderDef, file: File) => void;
  uploading: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = folder.icon;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(folder, file);
    e.target.value = "";
  };

  const shareWhatsApp = (doc: any) => {
    const fullUrl = doc.url.startsWith("http") ? doc.url : window.location.origin + doc.url;
    const text = `📄 ${doc.name}\n${fullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-card shadow-2xl overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        {/* رأس النافذة */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ backgroundColor: folder.bg, borderBottom: `2px solid ${folder.border}` }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: folder.color + "20", border: `1.5px solid ${folder.color}40` }}
          >
            <Icon className="w-6 h-6" style={{ color: folder.color }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base" style={{ color: folder.color }}>{folder.label}</h3>
            <p className="text-xs text-muted-foreground">{docs.length} ملف</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-black/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* قائمة الملفات */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 140px)" }}>
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <FolderOpen className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">لا توجد ملفات في هذا المجلد</p>
              <p className="text-xs mt-1 opacity-60">اضغط "رفع ملف" لإضافة مستند</p>
            </div>
          ) : (
            <div className="divide-y">
              {docs.map((doc: any) => {
                const fileType = getFileType(doc);
                const FileIcon = fileType === "image" ? Image : fileType === "pdf" ? FileText : File;
                return (
                  <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: folder.bg, border: `1px solid ${folder.border}` }}
                    >
                      <FileIcon className="w-4 h-4" style={{ color: folder.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileSize}
                        {doc.uploadedAt ? ` • ${doc.uploadedAt.slice(0, 10)}` : ""}
                        {doc.fileExtension ? ` • .${doc.fileExtension}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        title="معاينة"
                        onClick={() => onPreview({ ...doc, category: folder.label })}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <a href={`/api/documents/${doc.id}/download`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="تنزيل">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        title="مشاركة واتساب"
                        onClick={() => shareWhatsApp(doc)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* زر الرفع */}
        <div className="px-5 py-3 border-t bg-muted/5">
          <Button
            className="w-full gap-2"
            style={{ backgroundColor: folder.color }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus className="w-4 h-4" />
            {uploading ? "جاري الرفع..." : "رفع ملف"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.dwf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── بطاقة المجلد ─── */
function FolderCard({
  folder,
  count,
  onClick,
}: {
  folder: FolderDef;
  count: number;
  onClick: () => void;
}) {
  const Icon = folder.icon;
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 text-center w-full"
      style={{
        backgroundColor: folder.bg,
        borderColor: count > 0 ? folder.color + "60" : folder.border,
      }}
    >
      {/* أيقونة المجلد */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
        style={{
          backgroundColor: folder.color + "18",
          border: `2px solid ${folder.color}30`,
        }}
      >
        <Icon className="w-7 h-7" style={{ color: folder.color }} />
      </div>

      {/* اسم المجلد */}
      <p
        className="text-xs font-semibold leading-tight"
        style={{ color: folder.color }}
      >
        {folder.label}
      </p>

      {/* عدد الملفات */}
      {count > 0 ? (
        <span
          className="absolute top-2 left-2 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: folder.color }}
        >
          {count}
        </span>
      ) : (
        <span className="text-[10px] text-muted-foreground opacity-60">فارغ</span>
      )}
    </button>
  );
}

/* ─── الصفحة الرئيسية ─── */
export default function ClientDocuments() {
  const { clientId } = useParams<{ clientId: string }>();
  const [, navigate] = useLocation();

  const { data: docs = [], isLoading, error: docsError } = useDocuments();
  const { data: clients = [], error: clientsError } = useClients();
  const uploadMutation = useUploadDocument();

  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [openFolder, setOpenFolder] = useState<FolderDef | null>(null);
  const [uploadingFolder, setUploadingFolder] = useState<string | null>(null);

  const client = clients.find(c => c.id === clientId);
  const cName = client?.name || (clientId === "__no_client__" ? "بدون عميل" : clientId || "");

  const clientDocs = docs.filter(d =>
    clientId === "__no_client__" ? !d.clientId : d.clientId === clientId
  );

  // تجميع الملفات حسب الفئة
  const getDocsForFolder = (folder: FolderDef) => {
    return clientDocs.filter(d => {
      const cat = d.category || "أخرى";
      // مطابقة مباشرة
      if (cat === folder.category) return true;
      // مطابقة مرنة للفئات القديمة
      if (folder.id === "other_docs" && !DOCUMENT_FOLDERS.slice(0, -1).some(f => f.category === cat)) return true;
      return false;
    });
  };

  const handleUpload = async (folder: FolderDef, file: File) => {
    setUploadingFolder(folder.id);
    const formData = new FormData();
    formData.append("file", file);
    if (clientId && clientId !== "__no_client__") formData.append("clientId", clientId);
    formData.append("name", file.name);
    formData.append("category", folder.category);
    try {
      await uploadMutation.mutateAsync(formData);
      toast.success(`تم رفع الملف في "${folder.label}"`);
    } catch {
      toast.error("فشل رفع الملف");
    }
    setUploadingFolder(null);
  };

  const totalFiles = clientDocs.length;
  const filledFolders = DOCUMENT_FOLDERS.filter(f => getDocsForFolder(f).length > 0).length;

  // تجميع المجلدات حسب المجموعة
  const groupedFolders = GROUP_ORDER.map(group => ({
    group,
    folders: DOCUMENT_FOLDERS.filter(f => f.group === group),
  })).filter(g => g.folders.length > 0);

  return (
    <div className="space-y-5">
      {/* نافذة معاينة الملف */}
      {previewDoc && (
        <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* نافذة محتويات المجلد */}
      {openFolder && (
        <FolderModal
          folder={openFolder}
          docs={getDocsForFolder(openFolder)}
          onClose={() => setOpenFolder(null)}
          onPreview={setPreviewDoc}
          onUpload={handleUpload}
          uploading={uploadingFolder === openFolder.id}
        />
      )}

      {/* ─── رأس الصفحة ─── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate("/documents")}>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{ backgroundColor: "oklch(0.45 0.12 250)" }}
        >
          {cName.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight">{cName}</h1>
          <p className="text-xs text-muted-foreground">
            {totalFiles} ملف • {filledFolders} مجلد يحتوي ملفات
          </p>
        </div>
      </div>

      {/* ─── محتوى ─── */}
      {(docsError || clientsError) ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <p className="text-sm text-destructive font-medium">حدث خطأ في تحميل البيانات</p>
          <p className="text-xs text-muted-foreground mt-1">تحقق من الاتصال وأعد المحاولة</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>إعادة المحاولة</Button>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center min-h-40 text-muted-foreground">
          جاري التحميل...
        </div>
      ) : (
        <div className="space-y-6">
          {groupedFolders.map(({ group, folders }) => (
            <div key={group}>
              {/* عنوان المجموعة */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-wide">
                  {group}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* شبكة المجلدات */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {folders.map(folder => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    count={getDocsForFolder(folder).length}
                    onClick={() => setOpenFolder(folder)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
