/**
 * Documents — صفحة المستندات الرئيسية
 * تعرض العملاء كبطاقات مع عدد الملفات
 * فلاتر بالفئة + بحث + أزرار أقسام
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, User, FolderOpen, FileText, Building2,
  ChevronLeft, Upload, Filter, PenTool, Wrench,
} from "lucide-react";
import { useDocuments, useProjects, useClients, useUploadDocument } from "@/lib/api";
import { toast } from "sonner";

/* ─── فلاتر الأقسام ─── */
const SECTIONS = [
  { key: "all", label: "الكل", icon: FolderOpen },
  { key: "docs", label: "وثائق", icon: FileText },
  { key: "drawings", label: "مخططات", icon: PenTool },
  { key: "govt", label: "حكومية", icon: Building2 },
  { key: "contracts", label: "عقود", icon: Wrench },
];

const SECTION_CATEGORIES: Record<string, string[]> = {
  docs: ["بيانات العميل", "مستندات العميل", "تجهيز الملف", "أخرى"],
  drawings: ["مخططات معمارية", "مخططات إنشائية", "مخططات تنفيذية"],
  govt: ["مستندات حكومية", "بلدية"],
  contracts: ["عقود وعروض", "عقود موقعة"],
};

export default function Documents() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadClientId, setUploadClientId] = useState("");
  const [uploadProjectId, setUploadProjectId] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");

  const { data: docs = [], isLoading } = useDocuments();
  const { data: projects = [] } = useProjects();
  const { data: clients = [] } = useClients();
  const uploadMutation = useUploadDocument();

  /* ─── فلترة حسب القسم ─── */
  const filteredDocs = activeSection === "all"
    ? docs
    : docs.filter(d => {
        const cats = SECTION_CATEGORIES[activeSection] || [];
        return cats.includes(d.category);
      });

  /* ─── تجميع حسب العميل ─── */
  const clientGroups: Record<string, typeof docs> = {};
  for (const doc of filteredDocs) {
    const cid = doc.clientId || "__no_client__";
    if (!clientGroups[cid]) clientGroups[cid] = [];
    clientGroups[cid].push(doc);
  }

  /* ─── بحث ─── */
  const searchLower = searchTerm.toLowerCase();
  const filteredClients = Object.entries(clientGroups).filter(([cid, cDocs]) => {
    if (!searchTerm) return true;
    const clientName = clients.find(c => c.id === cid)?.name || "";
    if (clientName.toLowerCase().includes(searchLower)) return true;
    return cDocs.some(d => d.name.toLowerCase().includes(searchLower));
  });

  /* ─── رفع ملف ─── */
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    if (uploadClientId) formData.append("clientId", uploadClientId);
    if (uploadProjectId) formData.append("projectId", uploadProjectId);
    formData.append("name", file.name);
    formData.append("category", uploadCategory || "أخرى");
    try {
      await uploadMutation.mutateAsync(formData);
      toast.success("تم رفع الملف بنجاح");
      setShowUpload(false);
    } catch {
      toast.error("فشل رفع الملف");
    }
    e.target.value = "";
  };

  /* ─── إحصائيات ─── */
  const totalDocs = filteredDocs.length;
  const totalClients = filteredClients.length;

  return (
    <div className="space-y-5">
      {/* ─── العنوان ─── */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">المستندات</h1>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Upload className="w-4 h-4" />
          رفع ملف
        </Button>
      </div>

      {/* ─── نموذج رفع ملف ─── */}
      {showUpload && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">رفع ملف جديد</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              className="rounded-lg border px-3 py-2 text-sm bg-background"
              value={uploadClientId}
              onChange={e => setUploadClientId(e.target.value)}
            >
              <option value="">اختر العميل</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm bg-background"
              value={uploadProjectId}
              onChange={e => setUploadProjectId(e.target.value)}
            >
              <option value="">اختر المشروع</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="rounded-lg border px-3 py-2 text-sm bg-background"
              value={uploadCategory}
              onChange={e => setUploadCategory(e.target.value)}
            >
              <option value="">اختر الفئة</option>
              <option value="مستندات العميل">مستندات العميل</option>
              <option value="عقود موقعة">عقود موقعة</option>
              <option value="مستندات حكومية">مستندات حكومية</option>
              <option value="مخططات معمارية">مخططات معمارية</option>
              <option value="مخططات إنشائية">مخططات إنشائية</option>
              <option value="تجهيز الملف">تجهيز الملف</option>
              <option value="بلدية">بلدية</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              اضغط لاختيار ملف (PDF, صور, أوتوكاد, أي صيغة)
            </span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf,.doc,.docx,.xls,.xlsx"
              onChange={handleUpload}
            />
          </label>
        </div>
      )}

      {/* ─── البحث ─── */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث باسم العميل أو الملف..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* ─── فلاتر الأقسام ─── */}
      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.key;
          return (
            <Button
              key={sec.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={() => setActiveSection(sec.key)}
            >
              <Icon className="w-3.5 h-3.5" />
              {sec.label}
            </Button>
          );
        })}
      </div>

      {/* ─── إحصائيات ─── */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{totalDocs} ملف</span>
        <span>•</span>
        <span>{totalClients} عميل</span>
      </div>

      {/* ─── قائمة العملاء ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-40 text-muted-foreground">
          جاري التحميل...
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">لا توجد مستندات</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredClients.map(([cid, cDocs]) => {
            const client = clients.find(c => c.id === cid);
            const clientName = client?.name || (cid === "__no_client__" ? "بدون عميل" : cid);
            const clientProjects = [...new Set(cDocs.map(d => d.projectId).filter(Boolean))];
            const initial = clientName.charAt(0);

            return (
              <button
                key={cid}
                onClick={() => navigate(`/documents/${cid}`)}
                className="flex items-center gap-4 px-4 py-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors text-right w-full"
              >
                {/* أيقونة العميل */}
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
                  style={{ backgroundColor: "oklch(0.45 0.12 250)" }}
                >
                  {initial}
                </div>

                {/* معلومات العميل */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{clientName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {clientProjects.length} مشروع • {cDocs.length} ملف
                  </p>
                </div>

                {/* Badge عدد الملفات */}
                <Badge variant="secondary" className="shrink-0">
                  {cDocs.length}
                </Badge>

                {/* سهم الدخول */}
                <ChevronLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
