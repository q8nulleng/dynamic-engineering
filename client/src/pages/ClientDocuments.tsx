/**
 * ClientDocuments — صفحة تفاصيل مستندات عميل محدد
 * تعرض الملفات مرتبة: وثائق أولاً ثم مخططات
 * مع معاينة الملف مباشرة بدون تنزيل
 */
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, FileText, Image, File, PenTool, Building2, Eye,
  Download, FolderOpen, X, User, ScrollText, ClipboardList,
  Wrench, Banknote, ChevronDown, Folder, FolderOpen as FolderOpenIcon,
  ExternalLink, ZoomIn, ZoomOut, RotateCw,
} from "lucide-react";
import { useDocuments, useProjects, useClients } from "@/lib/api";

/* ─── تصنيف الفئات: وثائق أولاً ثم مخططات ─── */
const DOCUMENT_CATEGORIES = [
  "بيانات العميل",
  "مستندات العميل",
  "عقود وعروض",
  "عقود موقعة",
  "مستندات حكومية",
  "تجهيز الملف",
  "تقارير",
  "بلدية",
  "إشراف",
  "مالي",
  "أخرى",
];

const DRAWING_CATEGORIES = [
  "مخططات معمارية",
  "مخططات إنشائية",
  "مخططات تنفيذية",
];

const categoryIcons: Record<string, React.ElementType> = {
  "بيانات العميل":     User,
  "مستندات العميل":   User,
  "عقود وعروض":       ScrollText,
  "عقود موقعة":       ScrollText,
  "مستندات حكومية":  Building2,
  "تجهيز الملف":      FolderOpen,
  "تقارير":           ClipboardList,
  "مخططات معمارية":   Building2,
  "مخططات إنشائية":   Wrench,
  "مخططات تنفيذية":   PenTool,
  "بلدية":            FileText,
  "إشراف":            Eye,
  "مالي":             Banknote,
  "أخرى":             FolderOpen,
};

/* ─── نافذة معاينة الملف ─── */
function FilePreviewModal({
  doc,
  onClose,
}: {
  doc: { name: string; url: string; category?: string } | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!doc) return null;

  // تحديد الامتداد من اسم الملف أو من الرابط
  const nameExt = doc.name.includes(".") ? doc.name.split(".").pop()?.toLowerCase() || "" : "";
  const urlExt  = doc.url.includes(".")  ? doc.url.split(".").pop()?.split("?")[0].toLowerCase() || "" : "";
  const ext = nameExt || urlExt;

  const isImage  = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
  // ملف PDF صريح، أو بدون امتداد (الغالبية PDF)
  const isPDF    = ext === "pdf" || (!ext && !isImage);
  // ملفات Office تُعرض عبر Google Docs Viewer
  const isOffice = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods"].includes(ext);
  const googleViewerUrl = isOffice
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(doc.url)}&embedded=true`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.85)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* شريط العنوان */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card/90 backdrop-blur border-b shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{doc.name}</p>
          {doc.category && (
            <p className="text-xs text-muted-foreground">{doc.category}</p>
          )}
        </div>

        {/* أدوات الصورة */}
        {isImage && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setZoom(z => Math.max(25, z - 25))}
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-xs w-10 text-center">{zoom}%</span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setZoom(z => Math.min(300, z + 25))}
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setRotation(r => (r + 90) % 360)}
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        <a href={doc.url} download={doc.name}>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            تنزيل
          </Button>
        </a>
        <a href={doc.url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </a>
      </div>

      {/* محتوى المعاينة */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isPDF ? (
          <iframe
            src={doc.url + "#toolbar=1&navpanes=0&scrollbar=1"}
            className="w-full h-full rounded-lg border-0"
            style={{ minHeight: "70vh", maxWidth: "900px" }}
            title={doc.name}
          />
        ) : isOffice && googleViewerUrl ? (
          <iframe
            src={googleViewerUrl}
            className="w-full h-full rounded-lg border-0"
            style={{ minHeight: "70vh", maxWidth: "900px" }}
            title={doc.name}
          />
        ) : isImage ? (
          <img
            src={doc.url}
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
            <p className="text-xs text-white/50">نوع الملف: .{ext} — لا يدعم المعاينة المباشرة</p>
            <a href={doc.url} download={doc.name}>
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

/* ─── مكوّن قسم الفئات ─── */
function CategorySection({
  title,
  icon: SectionIcon,
  categories,
  catsMap,
  accentColor,
}: {
  title: string;
  icon: React.ElementType;
  categories: string[];
  catsMap: Record<string, any[]>;
  accentColor: string;
}) {
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string; category?: string } | null>(null);

  const toggleCat = (cat: string) =>
    setOpenCats(p => ({ ...p, [cat]: !p[cat] }));

  // عرض فئات هذا القسم فقط — الفئات غير المعروفة تذهب إلى قسم الوثائق فقط
  const ALL_KNOWN_CATS = [...DOCUMENT_CATEGORIES, ...DRAWING_CATEGORIES];
  const relevantCats = categories
    .filter(c => catsMap[c]?.length)
    .concat(
      // الفئات غير المعروفة تُضاف فقط لقسم الوثائق (وليس المخططات)
      title.includes("الوثائق")
        ? Object.keys(catsMap).filter(k => !ALL_KNOWN_CATS.includes(k) && catsMap[k]?.length)
        : []
    );

  if (relevantCats.length === 0) return null;

  const totalFiles = relevantCats.reduce((s, c) => s + (catsMap[c]?.length || 0), 0);

  return (
    <>
      {previewDoc && (
        <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      <div className="rounded-xl border shadow-sm overflow-hidden">
        {/* عنوان القسم */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: accentColor + "15" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentColor + "25" }}
          >
            <SectionIcon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{relevantCats.length} فئة • {totalFiles} ملف</p>
          </div>
        </div>

        {/* الفئات */}
        <div className="divide-y bg-card">
          {relevantCats.map(cat => {
            const catDocs = catsMap[cat] || [];
            const isOpen = openCats[cat] !== false; // مفتوح افتراضياً
            const CatIcon = categoryIcons[cat] || FolderOpen;

            return (
              <div key={cat}>
                {/* عنوان الفئة */}
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-right hover:bg-muted/30 transition-colors"
                >
                  <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-muted/30">
                    {isOpen
                      ? <FolderOpenIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      : <Folder className="w-3.5 h-3.5 text-muted-foreground" />}
                  </div>
                  <CatIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 text-right">{cat}</span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                    {catDocs.length}
                  </Badge>
                  <ChevronDown
                    className="w-4 h-4 text-muted-foreground transition-transform shrink-0"
                    style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </button>

                {/* قائمة الملفات */}
                {isOpen && (
                  <div className="bg-muted/10 divide-y divide-border/30 px-2 pb-1">
                    {catDocs.map((doc: any) => {
                      const ext = (doc.name || "").split(".").pop()?.toLowerCase() || "";
                      const isImg = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext);
                      const isPdf = ext === "pdf";
                      const FileIcon = isImg ? Image : isPdf ? FileText : File;

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/20 transition-colors group rounded-lg my-0.5"
                        >
                          {/* أيقونة الملف */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: accentColor + "12" }}
                          >
                            <FileIcon className="w-4 h-4" style={{ color: accentColor }} />
                          </div>

                          {/* اسم الملف */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {doc.fileSize}
                              {doc.uploadedAt ? ` • ${doc.uploadedAt.slice(0, 10)}` : ""}
                            </p>
                          </div>

                          {/* أزرار الإجراءات */}
                          <div className="flex gap-1 shrink-0">
                            {doc.url && (
                              <>
                                {/* زر المعاينة */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity"
                                  title="معاينة"
                                  onClick={() => setPreviewDoc({ name: doc.name, url: doc.url, category: cat })}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                {/* زر التنزيل */}
                                <a href={doc.url} download={doc.name}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-60 hover:opacity-100 transition-opacity"
                                    title="تنزيل"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </Button>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─── الصفحة الرئيسية ─── */
export default function ClientDocuments() {
  const { clientId } = useParams<{ clientId: string }>();
  const [, navigate] = useLocation();

  const { data: docs = [],     isLoading } = useDocuments();
  const { data: projects = [] }            = useProjects();
  const { data: clients  = [] }            = useClients();

  /* اسم العميل */
  const client = clients.find(c => c.id === clientId);
  const cName  = client?.name || clientId || "بدون عميل";

  /* فلترة ملفات هذا العميل فقط */
  const clientDocs = docs.filter(d => d.clientId === clientId);

  /* تجميع حسب المشروع ثم الفئة */
  // projectId → category → docs[]
  const byProject: Record<string, Record<string, any[]>> = {};
  for (const doc of clientDocs) {
    const pid = doc.projectId || "__no_project__";
    const cat = doc.category  || "أخرى";
    if (!byProject[pid]) byProject[pid] = {};
    if (!byProject[pid][cat]) byProject[pid][cat] = [];
    byProject[pid][cat].push(doc);
  }

  /* اسم المشروع */
  const projectName = (pid: string) => {
    if (pid === "__no_project__") return "بدون مشروع";
    return projects.find(p => p.id === pid)?.name || pid;
  };

  const projectType = (pid: string) => {
    if (pid === "__no_project__") return "";
    return projects.find(p => p.id === pid)?.type || "";
  };

  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const toggleProject = (pid: string) =>
    setOpenProjects(p => ({ ...p, [pid]: !p[pid] }));

  return (
    <div className="space-y-5">

      {/* ─── رأس الصفحة ─── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => navigate("/documents")}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm"
          style={{ backgroundColor: "oklch(0.45 0.12 250)" }}
        >
          {cName.charAt(0)}
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">{cName}</h1>
          <p className="text-xs text-muted-foreground">
            {Object.keys(byProject).length} مشروع • {clientDocs.length} ملف
          </p>
        </div>
      </div>

      {/* ─── محتوى ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-64 text-muted-foreground">
          جاري التحميل...
        </div>
      ) : clientDocs.length === 0 ? (
        <div className="rounded-xl border bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">لا توجد ملفات لهذا العميل</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byProject).map(([pid, catsMap]) => {
            const pName = projectName(pid);
            const pType = projectType(pid);
            const isOpen = openProjects[pid] !== false; // مفتوح افتراضياً
            const totalFiles = Object.values(catsMap).flat().length;

            return (
              <div key={pid} className="space-y-3">
                {/* عنوان المشروع */}
                <button
                  onClick={() => toggleProject(pid)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-muted/20 transition-colors text-right"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "oklch(0.72 0.10 60 / 0.15)" }}>
                    {isOpen
                      ? <FolderOpenIcon className="w-4 h-4" style={{ color: "oklch(0.55 0.12 60)" }} />
                      : <Folder className="w-4 h-4" style={{ color: "oklch(0.55 0.12 60)" }} />}
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-semibold text-sm">{pName}</p>
                    <p className="text-xs text-muted-foreground">
                      {pType && <span className="ml-1">{pType} •</span>}
                      {totalFiles} ملف
                    </p>
                  </div>
                  {pType && (
                    <Badge variant="outline" className="text-[10px] shrink-0">{pType}</Badge>
                  )}
                  <ChevronDown
                    className="w-4 h-4 text-muted-foreground transition-transform shrink-0"
                    style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </button>

                {/* أقسام الوثائق والمخططات */}
                {isOpen && (
                  <div className="pr-4 space-y-3">
                    {/* قسم الوثائق */}
                    <CategorySection
                      title="الوثائق والمستندات"
                      icon={FileText}
                      categories={DOCUMENT_CATEGORIES}
                      catsMap={catsMap}
                      accentColor="oklch(0.45 0.12 250)"
                    />

                    {/* قسم المخططات */}
                    <CategorySection
                      title="المخططات الهندسية"
                      icon={PenTool}
                      categories={DRAWING_CATEGORIES}
                      catsMap={catsMap}
                      accentColor="oklch(0.50 0.14 160)"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
