/*
 * Documents — عرض هرمي: العميل ← المشروع ← فئة الوثيقة
 */
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, Image, File, PenTool, Building2, Eye,
  Download, Search, FolderOpen, X, CheckCircle2, User,
  ScrollText, ClipboardList, Wrench, Banknote, ChevronDown,
  ChevronLeft, Folder, FolderOpen as FolderOpenIcon, Home,
} from "lucide-react";
import { useDocuments, useUploadDocument, useProjects, useClients } from "@/lib/api";
import { useLocation } from "wouter";
import { toast } from "sonner";

/* ─── فئات الوثائق ─── */
const CATEGORIES = [
  "بيانات العميل",
  "مستندات العميل",
  "عقود وعروض",
  "عقود موقعة",
  "تقارير",
  "مستندات حكومية",
  "مخططات معمارية",
  "مخططات إنشائية",
  "مخططات تنفيذية",
  "بلدية",
  "إشراف",
  "مالي",
  "أخرى",
];

const categoryIcons: Record<string, React.ElementType> = {
  "بيانات العميل":    User,
  "مستندات العميل":  User,
  "عقود وعروض":      ScrollText,
  "عقود موقعة":      ScrollText,
  "مستندات حكومية": Building2,
  "تقارير":          ClipboardList,
  "مخططات معمارية":  Building2,
  "مخططات إنشائية":  Wrench,
  "مخططات تنفيذية":  PenTool,
  "بلدية":           FileText,
  "إشراف":           Eye,
  "مالي":            Banknote,
  "أخرى":            FolderOpen,
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  residential: "سكن خاص",
  industrial:  "صناعي",
  commercial:  "تجاري",
  investment:  "استثماري",
};

export default function Documents() {
  const [, navigate] = useLocation();
  const { data: docs = [],     isLoading } = useDocuments();
  const { data: projects = [] }            = useProjects();
  const { data: clients  = [] }            = useClients();
  const uploadMutation = useUploadDocument();
  const fileInputRef   = useRef<HTMLInputElement>(null);

  const [search,          setSearch]          = useState("");
  const [uploadCategory,  setUploadCategory]  = useState("أخرى");
  const [uploadProjectId, setUploadProjectId] = useState<string>("none");

  /* ─── حالة فتح/إغلاق كل مستوى ─── */
  const [openClients,    setOpenClients]    = useState<Record<string, boolean>>({});
  const [openProjects,   setOpenProjects]   = useState<Record<string, boolean>>({});
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleClient   = (id: string) => setOpenClients(p   => ({ ...p, [id]: !p[id] }));
  const toggleProject  = (id: string) => setOpenProjects(p  => ({ ...p, [id]: !p[id] }));
  const toggleCategory = (id: string) => setOpenCategories(p => ({ ...p, [id]: !p[id] }));

  /* ─── فلترة بالبحث (اسم الملف + اسم العميل + فئة الوثيقة) ─── */
  const filtered = docs.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nameMatch     = d.name.toLowerCase().includes(q);
    const catMatch      = (d.category || "").toLowerCase().includes(q);
    const clientMatch   = clientName(d.clientId || "__no_client__").toLowerCase().includes(q);
    const projectMatch  = projectInfo(d.projectId || "__no_project__").name.toLowerCase().includes(q);
    return nameMatch || catMatch || clientMatch || projectMatch;
  });

  /* ─── بناء الهيكل الهرمي ─── */
  // clientId → projectId → category → docs[]
  type DocType = typeof docs[0];
  const tree: Record<string, Record<string, Record<string, DocType[]>>> = {};

  for (const doc of filtered) {
    const cid = doc.clientId || "__no_client__";
    const pid = doc.projectId || "__no_project__";
    const cat = doc.category  || "أخرى";
    if (!tree[cid]) tree[cid] = {};
    if (!tree[cid][pid]) tree[cid][pid] = {};
    if (!tree[cid][pid][cat]) tree[cid][pid][cat] = [];
    tree[cid][pid][cat].push(doc);
  }

  /* ─── مساعد: اسم العميل ─── */
  const clientName = (id: string) => {
    if (id === "__no_client__") return "بدون عميل";
    return clients.find(c => c.id === id)?.name || id;
  };

  /* ─── مساعد: اسم المشروع + نوعه ─── */
  const projectInfo = (id: string) => {
    if (id === "__no_project__") return { name: "بدون مشروع", type: "" };
    const p = projects.find(p => p.id === id);
    return { name: p?.name || id, type: PROJECT_TYPE_LABELS[p?.type || ""] || p?.type || "" };
  };

  /* ─── رفع ملف ─── */
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("name", file.name);
    fd.append("category", uploadCategory);
    if (uploadProjectId && uploadProjectId !== "none") fd.append("projectId", uploadProjectId);
    uploadMutation.mutate(fd, {
      onSuccess: () => toast.success(`تم رفع: ${file.name}`),
      onError:   () => toast.error("فشل رفع الملف"),
    });
    e.target.value = "";
  }

  const totalDocs = docs.length;

  return (
    <div className="space-y-5">

      {/* ─── شريط البحث + رفع ─── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="بحث في المستندات..."
            className="pr-10"
          />
        </div>

        {/* أدوات الرفع */}
        <div className="flex items-center gap-2 mr-auto flex-wrap">
          <Select value={uploadProjectId} onValueChange={setUploadProjectId}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="ربط بمشروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون مشروع</SelectItem>
              {projects.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <select
            value={uploadCategory}
            onChange={e => setUploadCategory(e.target.value)}
            className="text-xs border rounded-md px-2 py-2 bg-background text-foreground"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <Button
            style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="text-white"
          >
            {uploadMutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />جاري الرفع...</>
              : <><Upload className="w-4 h-4 ml-2" />رفع ملف</>}
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* ─── إحصاء سريع ─── */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{totalDocs}</span> ملف
        <span>•</span>
        <span className="font-semibold text-foreground">{Object.keys(tree).length}</span> عميل
        <span>•</span>
        <span className="font-semibold text-foreground">
          {Object.values(tree).reduce((s, ps) => s + Object.keys(ps).length, 0)}
        </span> مشروع
      </div>

      {/* ─── محتوى ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-64 text-muted-foreground">جاري التحميل...</div>
      ) : totalDocs === 0 ? (
        <div className="rounded-xl border-0 shadow-sm bg-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">لا توجد ملفات مرفوعة بعد</p>
          <p className="text-xs text-muted-foreground mt-1">استخدم زر "رفع ملف" لإضافة مستندات</p>
        </div>
      ) : Object.keys(tree).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">لا توجد نتائج للبحث</div>
      ) : (
        <div className="space-y-3">
          {Object.entries(tree).map(([cid, projectsMap]) => {
            const cName     = clientName(cid);
            const isClientOpen = openClients[cid] !== false; // مفتوح افتراضياً
            const clientDocCount = Object.values(projectsMap)
              .flatMap(cats => Object.values(cats))
              .flat().length;

            return (
              <div key={cid} className="rounded-xl border shadow-sm overflow-hidden bg-card">

                {/* ── مستوى 1: العميل ── */}
                <div className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-muted/30 transition-colors">
                  <button
                    onClick={() => navigate(`/documents/${cid}`)}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "oklch(0.45 0.12 250)" }}
                    title="فتح ملف العميل"
                  >
                    {cName.charAt(0)}
                  </button>
                  <button
                    onClick={() => toggleClient(cid)}
                    className="flex-1 text-right"
                  >
                    <p className="font-semibold text-sm hover:underline cursor-pointer" onClick={(e) => { e.stopPropagation(); navigate(`/documents/${cid}`); }}>{cName}</p>
                    <p className="text-xs text-muted-foreground">
                      {Object.keys(projectsMap).length} مشروع • {clientDocCount} ملف
                    </p>
                  </button>
                  <ChevronDown
                    onClick={() => toggleClient(cid)}
                    className="w-4 h-4 text-muted-foreground transition-transform shrink-0 cursor-pointer"
                    style={{ transform: isClientOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </div>

                {/* ── مستوى 2: المشاريع ── */}
                {isClientOpen && (
                  <div className="border-t divide-y">
                    {Object.entries(projectsMap).map(([pid, catsMap]) => {
                      const { name: pName, type: pType } = projectInfo(pid);
                      const isProjectOpen = openProjects[pid] !== false; // مفتوح افتراضياً
                      const projectDocCount = Object.values(catsMap).flat().length;

                      return (
                        <div key={pid} className="bg-muted/10">

                          {/* عنوان المشروع */}
                          <button
                            onClick={() => toggleProject(pid)}
                            className="w-full flex items-center gap-3 px-5 py-2.5 text-right hover:bg-muted/30 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: "oklch(0.72 0.10 60 / 0.15)" }}>
                              {isProjectOpen
                                ? <FolderOpenIcon className="w-4 h-4" style={{ color: "oklch(0.55 0.12 60)" }} />
                                : <Folder className="w-4 h-4" style={{ color: "oklch(0.55 0.12 60)" }} />}
                            </div>
                            <div className="flex-1 text-right">
                              <p className="text-sm font-medium">{pName}</p>
                              <p className="text-xs text-muted-foreground">
                                {pType && <span className="ml-1">{pType} •</span>}
                                {Object.keys(catsMap).length} فئة • {projectDocCount} ملف
                              </p>
                            </div>
                            {pType && (
                              <Badge variant="outline" className="text-[10px] shrink-0">
                                <Home className="w-2.5 h-2.5 ml-1" />{pType}
                              </Badge>
                            )}
                            <ChevronLeft
                              className="w-4 h-4 text-muted-foreground transition-transform shrink-0"
                              style={{ transform: isProjectOpen ? "rotate(-90deg)" : "rotate(0deg)" }}
                            />
                          </button>

                          {/* ── مستوى 3: الفئات ── */}
                          {isProjectOpen && (
                            <div className="pb-2 px-3 space-y-1">
                              {CATEGORIES
                                .filter(cat => catsMap[cat])
                                .concat(Object.keys(catsMap).filter(k => !CATEGORIES.includes(k)))
                                .map(cat => {
                                  const catDocs = catsMap[cat] || [];
                                  if (!catDocs.length) return null;
                                  const catKey = `${pid}-${cat}`;
                                  const isCatOpen = openCategories[catKey] !== false; // مفتوح افتراضياً
                                  const CatIcon = categoryIcons[cat] || FolderOpen;

                                  return (
                                    <div key={cat} className="rounded-lg overflow-hidden border border-border/50">

                                      {/* عنوان الفئة */}
                                      <button
                                        onClick={() => toggleCategory(catKey)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-right hover:bg-muted/20 transition-colors bg-background/50"
                                      >
                                        <CatIcon className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.30 0.05 250)" }} />
                                        <span className="text-xs font-medium flex-1">{cat}</span>
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                          {catDocs.length}
                                        </Badge>
                                        <ChevronDown
                                          className="w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0"
                                          style={{ transform: isCatOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                                        />
                                      </button>

                                      {/* قائمة الملفات */}
                                      {isCatOpen && (
                                        <div className="divide-y divide-border/30">
                                          {catDocs.map(doc => {
                                            const ext = doc.name.split(".").pop()?.toLowerCase() || "";
                                            const FileIcon = ["png","jpg","jpeg","webp","svg"].includes(ext) ? Image
                                              : ["pdf"].includes(ext) ? FileText
                                              : File;
                                            return (
                                              <div key={doc.id}
                                                className="flex items-center gap-3 px-3 py-2 hover:bg-muted/20 transition-colors group">
                                                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                                                  style={{ backgroundColor: "oklch(0.30 0.05 250 / 0.08)" }}>
                                                  <FileIcon className="w-3.5 h-3.5" style={{ color: "oklch(0.30 0.05 250)" }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs truncate font-medium">{doc.name}</p>
                                                  <p className="text-[10px] text-muted-foreground">
                                                    {doc.fileSize}
                                                    {doc.uploadedAt ? ` • ${doc.uploadedAt.slice(0, 10)}` : ""}
                                                  </p>
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                  {doc.url && (
                                                    <>
                                                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                          <Eye className="w-3 h-3" />
                                                        </Button>
                                                      </a>
                                                      <a href={doc.url} download={doc.name}>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                                          <Download className="w-3 h-3" />
                                                        </Button>
                                                      </a>
                                                    </>
                                                  )}
                                                </div>
                                                <div className="shrink-0">
                                                  {doc.status === "received"
                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                    : <X className="w-3.5 h-3.5 text-muted-foreground/40" />}
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
