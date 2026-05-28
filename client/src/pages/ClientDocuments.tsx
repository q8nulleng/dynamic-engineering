/**
 * ClientDocuments — صفحة مستندات عميل محدد
 * عرض الملفات مرتبة بالفئات مع معاينة أونلاين + تنزيل + مشاركة واتساب
 */
import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, FileText, Image, File, Eye, Download,
  FolderOpen, X, Upload, Share2, ChevronDown,
  ZoomIn, ZoomOut, RotateCw, ExternalLink, Folder,
} from "lucide-react";
import { useDocuments, useProjects, useClients, useUploadDocument } from "@/lib/api";
import { toast } from "sonner";

/* ─── ترتيب الفئات ─── */
const CATEGORY_ORDER = [
  "مستندات العميل",
  "بيانات العميل",
  "تجهيز الملف",
  "عقود وعروض",
  "عقود موقعة",
  "مستندات حكومية",
  "بلدية",
  "مخططات معمارية",
  "مخططات إنشائية",
  "مخططات تنفيذية",
  "تقارير",
  "إشراف",
  "مالي",
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
  if (["dwg", "dxf"].includes(ext)) return "cad";
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
  // Use proxy endpoints for reliable viewing
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
      {/* شريط العنوان */}
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

      {/* محتوى المعاينة */}
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
        ) : fileType === "word" || fileType === "excel" ? (
          <div className="text-center text-white/70 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <File className="w-10 h-10 text-white/50" />
            </div>
            <p className="text-sm font-medium text-white/90">{doc.name}</p>
            <p className="text-xs text-white/50">ملف {fileType === "word" ? "Word" : "Excel"} — قم بتنزيله لعرضه</p>
            <a href={downloadUrl}>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Download className="w-4 h-4 ml-2" />
                تنزيل الملف
              </Button>
            </a>
          </div>
        ) : (
          <div className="text-center text-white/70 space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
              <File className="w-10 h-10 text-white/50" />
            </div>
            <p className="text-sm font-medium text-white/90">{doc.name}</p>
            <p className="text-xs text-white/50">
              {fileType === "cad" ? "ملف أوتوكاد — يُفتح ببرنامج AutoCAD" : "هذا النوع لا يدعم المعاينة المباشرة"}
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

/* ─── الصفحة الرئيسية ─── */
export default function ClientDocuments() {
  const { clientId } = useParams<{ clientId: string }>();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: docs = [], isLoading, error: docsError } = useDocuments();
  const { data: projects = [] } = useProjects();
  const { data: clients = [], error: clientsError } = useClients();
  const uploadMutation = useUploadDocument();

  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const [uploadCategory, setUploadCategory] = useState("");

  const client = clients.find(c => c.id === clientId);
  const cName = client?.name || (clientId === "__no_client__" ? "بدون عميل" : clientId || "");

  const clientDocs = docs.filter(d =>
    clientId === "__no_client__" ? !d.clientId : d.clientId === clientId
  );

  const catGroups: Record<string, typeof docs> = {};
  for (const doc of clientDocs) {
    const cat = doc.category || "أخرى";
    if (!catGroups[cat]) catGroups[cat] = [];
    catGroups[cat].push(doc);
  }

  const sortedCats = Object.keys(catGroups).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  const toggleCat = (cat: string) => setOpenCats(p => ({ ...p, [cat]: !p[cat] }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    if (clientId && clientId !== "__no_client__") formData.append("clientId", clientId);
    formData.append("name", file.name);
    formData.append("category", uploadCategory || "أخرى");
    try {
      await uploadMutation.mutateAsync(formData);
      toast.success("تم رفع الملف بنجاح");
    } catch {
      toast.error("فشل رفع الملف");
    }
    e.target.value = "";
  };

  const shareWhatsApp = (doc: any) => {
    const fullUrl = doc.url.startsWith("http") ? doc.url : window.location.origin + doc.url;
    const text = `📄 ${doc.name}\n${fullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-5">
      {previewDoc && (
        <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
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
            {clientDocs.length} ملف • {sortedCats.length} فئة
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-3.5 h-3.5" />
          رفع
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleUpload}
        />
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
      ) : clientDocs.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">لا توجد ملفات لهذا العميل</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCats.map(cat => {
            const catDocs = catGroups[cat];
            const isOpen = openCats[cat] !== false;

            return (
              <div key={cat} className="rounded-xl border bg-card overflow-hidden">
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-muted/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                    {isOpen ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />}
                  </div>
                  <span className="text-sm font-medium flex-1 text-right">{cat}</span>
                  <Badge variant="secondary" className="shrink-0">{catDocs.length}</Badge>
                  <ChevronDown
                    className="w-4 h-4 text-muted-foreground transition-transform shrink-0"
                    style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </button>

                {isOpen && (
                  <div className="border-t divide-y">
                    {catDocs.map((doc: any) => {
                      const fileType = getFileType(doc);
                      const FileIcon = fileType === "image" ? Image : fileType === "pdf" ? FileText : File;

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors"
                        >
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-muted/30">
                            <FileIcon className="w-4 h-4 text-muted-foreground" />
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
                              onClick={() => setPreviewDoc({ ...doc, category: cat })}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
