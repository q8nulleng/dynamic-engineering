/*
 * Documents - إدارة المستندات والملفات
 */
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload, FileText, Image, File, Zap, Droplets, PenTool,
  Building2, Eye, Download, Search, FolderOpen, X, CheckCircle2,
  User, ScrollText, ClipboardList, Wrench, Banknote
} from "lucide-react";
import { useDocuments, useUploadDocument, useProjects } from "@/lib/api";
import { toast } from "sonner";

/* ─── هيكل المجلدات وفق القسم 8.2 ─── */
const CATEGORIES = [
  "بيانات العميل",
  "عقود وعروض",
  "تقارير",
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
  "عقود وعروض":      ScrollText,
  "تقارير":          ClipboardList,
  "مخططات معمارية":  Building2,
  "مخططات إنشائية":  Wrench,
  "مخططات تنفيذية":  PenTool,
  "بلدية":           FileText,
  "إشراف":           Eye,
  "مالي":            Banknote,
  "أخرى":            FolderOpen,
};

export default function Documents() {
  const { data: docs = [], isLoading } = useDocuments();
  const { data: projects = [] }        = useProjects();
  const uploadMutation = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search,           setSearch]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [selectedProject,  setSelectedProject]  = useState<string>("all");
  const [uploadCategory,   setUploadCategory]   = useState("أخرى");
  const [uploadProjectId,  setUploadProjectId]  = useState<string>("none");

  const filtered = docs.filter((d) => {
    const matchSearch  = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat     = selectedCategory === "الكل" || d.category === selectedCategory;
    const matchProject = selectedProject === "all" || d.projectId === selectedProject;
    return matchSearch && matchCat && matchProject;
  });

  /* تجميع حسب التصنيف */
  const grouped: Record<string, typeof docs> = {};
  for (const doc of filtered) {
    const cat = doc.category || "أخرى";
    (grouped[cat] = grouped[cat] || []).push(doc);
  }

  /* ترتيب المجلدات حسب الهيكل القياسي */
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const ai = CATEGORIES.indexOf(a);
    const bi = CATEGORIES.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

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
      onError: () => toast.error("فشل رفع الملف"),
    });
    e.target.value = "";
  }

  return (
    <div className="space-y-5">
      {/* Search + Upload */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المستندات..." className="pr-10" />
        </div>
        {/* Project filter */}
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-44 text-xs"><SelectValue placeholder="كل المشاريع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المشاريع</SelectItem>
            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {/* Upload controls */}
        <div className="flex items-center gap-2 mr-auto">
          <Select value={uploadProjectId} onValueChange={setUploadProjectId}>
            <SelectTrigger className="w-40 text-xs"><SelectValue placeholder="ربط بمشروع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون مشروع</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <select
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="text-xs border rounded-md px-2 py-2 bg-background text-foreground"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <Button
            style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
          >
            {uploadMutation.isPending
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />جاري الرفع...</>
              : <><Upload className="w-4 h-4 ml-2" />رفع ملف</>}
          </Button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* فلتر التصنيفات */}
      <div className="flex gap-2 flex-wrap">
        {["الكل", ...CATEGORIES].map((cat) => {
          const count = cat === "الكل" ? docs.length : docs.filter((d) => d.category === cat).length;
          const Icon = categoryIcons[cat] || FolderOpen;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all"
              style={{
                backgroundColor: selectedCategory === cat ? "oklch(0.30 0.05 250 / 0.08)" : "transparent",
                borderColor: selectedCategory === cat ? "oklch(0.30 0.05 250 / 0.4)" : "hsl(var(--border))",
                color: selectedCategory === cat ? "oklch(0.30 0.05 250)" : "hsl(var(--muted-foreground))",
              }}
            >
              <Icon className="w-3 h-3" />
              {cat}
              {count > 0 && <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-64 text-muted-foreground">جاري التحميل...</div>
      ) : docs.length === 0 ? (
        /* حالة فارغة */
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 opacity-30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">لا توجد ملفات مرفوعة بعد</p>
            <p className="text-xs text-muted-foreground mt-1">استخدم زر "رفع ملف" لإضافة مستندات</p>
          </CardContent>
        </Card>
      ) : sortedGroups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">لا توجد نتائج</div>
      ) : (
        <div className="space-y-4">
          {sortedGroups.map(([cat, catDocs]) => {
            const Icon = categoryIcons[cat] || FolderOpen;
            return (
              <Card key={cat} className="border-0 shadow-sm">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
                    {cat}
                    <Badge variant="secondary" className="text-xs mr-auto">{catDocs.length} ملف</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2">
                    {catDocs.map((doc) => {
                      const ext = doc.name.split(".").pop()?.toLowerCase() || "";
                      const FileIcon = ["png","jpg","jpeg","webp","svg"].includes(ext) ? Image
                        : ["pdf"].includes(ext) ? FileText
                        : File;
                      return (
                        <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: "oklch(0.30 0.05 250 / 0.08)" }}>
                            <FileIcon className="w-4 h-4" style={{ color: "oklch(0.30 0.05 250)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.fileSize}
                              {doc.uploadedAt ? ` • ${doc.uploadedAt.slice(0, 10)}` : ""}
                              {doc.projectId ? ` • ${projects.find(p => p.id === doc.projectId)?.name || doc.projectId}` : ""}
                            </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.url && (
                              <>
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                                </a>
                                <a href={doc.url} download={doc.name}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-3.5 h-3.5" /></Button>
                                </a>
                              </>
                            )}
                          </div>
                          <div className="shrink-0">
                            {doc.status === "received"
                              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                              : <X className="w-4 h-4 text-red-400" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
