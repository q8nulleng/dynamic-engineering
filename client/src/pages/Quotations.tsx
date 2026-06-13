/*
 * Design: Desert Oasis Professional
 * Quotations - عروض الأسعار الهندسية
 * Updated with full 23 packages from Odoo.sh + Location fields
 */
import { useState } from "react";
import { Link } from "wouter";
import { useQuotations, useUpdateQuotation, useCreateQuotation, useClients, usePackages, useCreatePackage, useUpdatePackage, useDeletePackage } from "@/lib/api";
import { downloadQuotationPdf } from "@/lib/pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, FileText, Send, CheckCircle, Eye, Download, MessageCircle, Receipt, ChevronDown, ChevronUp, MapPin, Loader2, Pencil, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* ── Fallback packages (used only if DB is empty) ── */
const allPackages: Record<string, { name: string; price: string; buildingType: string; serviceType: string; level: string; features: string[] }[]> = {
  "سكن خاص": [
    { name: "الباقة الأساسية - سكن خاص", price: "1,500", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "فحص التربة", "إمكانية إيصال التيار", "إصدار رخصة البلدية", "مخطط صرف صحي", "واجهة 3D", "مخطط فرش", "إشراف 3 أشهر"] },
    { name: "الباقة المميزة - سكن خاص", price: "1,600", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Premium",
      features: ["جميع خدمات الباقة الأساسية", "تصميم الكهرباء والصحي", "واجهات ثلاثية الأبعاد متعددة", "تعديلات إضافية"] },
    { name: "الباقة الذهبية - سكن خاص", price: "2,200", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Gold",
      features: ["جميع خدمات الباقة المميزة", "التصميم الداخلي", "الإشراف الهندسي الكامل", "تعديلات غير محدودة"] },
    { name: "باقة الإشراف - سكن خاص", price: "150", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Supervision",
      features: ["إشراف هندسي كامل", "3 زيارات أسبوعياً", "تقارير دورية", "استلام أعمال"] },
    { name: "باقة تعديل - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات القائمة", "تصميم التعديلات", "تقديم البلدية", "إشراف"] },
    { name: "باقة إضافة - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات القائمة", "تصميم الإضافات", "تقديم البلدية", "إشراف"] },
    { name: "باقة تعديل وإضافة - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات القائمة", "تصميم التعديلات والإضافات", "تقديم البلدية", "إشراف"] },
    { name: "باقة الهدم - سكن خاص", price: "250", buildingType: "سكن خاص", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية", "إشراف على الهدم"] },
  ],
  "استثماري": [
    { name: "الباقة الأساسية - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "إشراف"] },
    { name: "إضافة - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات", "تصميم الإضافات", "تقديم البلدية"] },
    { name: "إضافة وتعديل - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات والإضافات", "تقديم البلدية"] },
    { name: "تعديل - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات", "تقديم البلدية"] },
    { name: "هدم - استثماري", price: "250", buildingType: "استثماري", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية"] },
  ],
  "تجاري": [
    { name: "الباقة الأساسية - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "إشراف"] },
    { name: "إضافة - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات", "تصميم الإضافات", "تقديم البلدية"] },
    { name: "إضافة وتعديل - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات والإضافات", "تقديم البلدية"] },
    { name: "تعديل - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات", "تقديم البلدية"] },
    { name: "هدم - تجاري", price: "250", buildingType: "تجاري", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية"] },
  ],
  "صناعي": [
    { name: "الباقة الأساسية - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "بناء جديد", level: "Basic",
      features: ["التصميم المعماري", "التصميم الإنشائي", "الكهرباء والصحي", "تقديم البلدية", "إشراف"] },
    { name: "إضافة - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "إضافة", level: "-",
      features: ["دراسة المخططات", "تصميم الإضافات", "تقديم البلدية"] },
    { name: "إضافة وتعديل - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "تعديل وإضافة", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات والإضافات", "تقديم البلدية"] },
    { name: "تعديل - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "تعديل", level: "-",
      features: ["دراسة المخططات", "تصميم التعديلات", "تقديم البلدية"] },
    { name: "هدم - صناعي", price: "250", buildingType: "صناعي", serviceType: "هدم", level: "-",
      features: ["إعداد مستندات الهدم", "تقديم البلدية"] },
  ],
};

const flatPackages = Object.values(allPackages).flat();

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  "مسودة":      { label: "مسودة",      color: "text-gray-600",   bg: "bg-gray-100"  },
  "مرسل":       { label: "مرسل",       color: "text-blue-600",   bg: "bg-blue-50"   },
  "مقبول":      { label: "مقبول",      color: "text-green-600",  bg: "bg-green-50"  },
  "مرفوض":      { label: "مرفوض",      color: "text-red-600",    bg: "bg-red-50"    },
  "عقد":        { label: "تحول لعقد", color: "text-purple-600", bg: "bg-purple-50" },
  "تم التعاقد": { label: "تم التعاقد", color: "text-emerald-700",bg: "bg-emerald-50"},
  "منتهي":      { label: "منتهي",      color: "text-gray-500",   bg: "bg-gray-100"  },
};

const fallbackStatus = { label: "—", color: "text-gray-500", bg: "bg-gray-50" };

type Package = { name: string; price: string; buildingType: string; serviceType: string; level: string; features: string[] };

// loadPackages removed — use usePackages() hook from api.ts

export default function Quotations() {
  const { data: quotations = [], isLoading } = useQuotations();
  const [view, setView] = useState<"list" | "packages">("list");
  const [selectedBuildingType, setSelectedBuildingType] = useState<string>("الكل");
  const [expandedQuotation, setExpandedQuotation] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [editingQuote, setEditingQuote] = useState<typeof quotations[0] | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", service: "", package: "", status: "", type: "" });
  const updateQuotation = useUpdateQuotation();

  // Package editing state — now from DB
  const { data: packages = {} } = usePackages();
  const createPackageMutation = useCreatePackage();
  const updatePackageMutation = useUpdatePackage();
  const deletePackageMutation = useDeletePackage();
  const [editingPkg, setEditingPkg] = useState<(Package & { id?: number }) | null>(null);
  const [pkgForm, setPkgForm] = useState<Package>({ name: "", price: "", buildingType: "", serviceType: "", level: "", features: [] });
  const [pkgFeaturesText, setPkgFeaturesText] = useState("");

  const flatPkgs = Object.values(packages).flat();

  const [addingPkg, setAddingPkg] = useState(false);
  const [newPkgForm, setNewPkgForm] = useState<Package>({ name: "", price: "", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "-", features: [] });
  const [newPkgFeaturesText, setNewPkgFeaturesText] = useState("");

  // New quotation creation state
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [newQuoteClientId, setNewQuoteClientId] = useState("");
  const [newQuoteBuildingType, setNewQuoteBuildingType] = useState("سكن خاص");
  const [newQuoteServiceType, setNewQuoteServiceType] = useState("بناء جديد");
  const [newQuoteSelectedPkg, setNewQuoteSelectedPkg] = useState<Package | null>(null);
  const [newQuoteAgreedPrice, setNewQuoteAgreedPrice] = useState("");
  const [newQuoteNotes, setNewQuoteNotes] = useState("");
  const createQuotation = useCreateQuotation();
  const { data: clients = [] } = useClients();

  const newQuotePackages = packages[newQuoteBuildingType]
    ? (newQuoteServiceType
        ? (packages[newQuoteBuildingType].filter(p => p.serviceType === newQuoteServiceType).length > 0
            ? packages[newQuoteBuildingType].filter(p => p.serviceType === newQuoteServiceType)
            : packages[newQuoteBuildingType])
        : packages[newQuoteBuildingType])
    : flatPkgs;

  const handleCreateQuotation = async (status: string) => {
    const selectedClient = clients.find(c => c.id === newQuoteClientId);
    const now = new Date().toISOString().split("T")[0];
    const expiryDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const finalAmount = newQuoteAgreedPrice.trim() ? newQuoteAgreedPrice.trim() : newQuoteSelectedPkg!.price;
    await createQuotation.mutateAsync({
      client: selectedClient?.name || "",
      type: newQuoteBuildingType,
      service: newQuoteServiceType,
      package: newQuoteSelectedPkg!.name,
      amount: finalAmount,
      date: now,
      governorate: selectedClient?.governorate || "",
      area: selectedClient?.area || "",
      clientId: selectedClient?.id || null,
      projectId: null,
      civilId: selectedClient?.civilId || "",
      landArea: selectedClient?.parcelArea ? String(selectedClient.parcelArea) : "",
      block: selectedClient?.block || "",
      suburb: "",
      plot: selectedClient?.plot || "",
      surveyPlan: "",
      leadId: undefined,
      validityDays: 30,
      expiryDate,
      status,
    });
    toast.success(status === "مسودة" ? "تم حفظ المسودة" : status === "مرسل" ? "تم إنشاء عرض السعر" : "تم اعتماد عرض السعر");
    setCreatingQuote(false);
    setNewQuoteClientId("");
    setNewQuoteBuildingType("سكن خاص");
    setNewQuoteServiceType("بناء جديد");
    setNewQuoteSelectedPkg(null);
    setNewQuoteAgreedPrice("");
    setNewQuoteNotes("");
  };

  const saveNewPkg = async () => {
    const newPkg = { ...newPkgForm, features: newPkgFeaturesText.split("\n").map(f => f.trim()).filter(Boolean) };
    await createPackageMutation.mutateAsync(newPkg);
    setAddingPkg(false);
    setNewPkgForm({ name: "", price: "", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "-", features: [] });
    setNewPkgFeaturesText("");
    toast.success("تم إضافة الباقة بنجاح");
  };

  const deletePkg = async (pkg: Package & { id?: number }) => {
    if (!pkg.id) return;
    if (!confirm(`هل تريد حذف باقة "${pkg.name}"?`)) return;
    await deletePackageMutation.mutateAsync(pkg.id);
    toast.success("تم حذف الباقة");
  };

  const openEditPkg = (pkg: Package & { id?: number }) => {
    setEditingPkg(pkg);
    setPkgForm({ ...pkg });
    setPkgFeaturesText(pkg.features.join("\n"));
  };

  const saveEditPkg = async () => {
    if (!editingPkg || !editingPkg.id) return;
    const updated = { ...pkgForm, id: editingPkg.id, features: pkgFeaturesText.split("\n").map(f => f.trim()).filter(Boolean) };
    await updatePackageMutation.mutateAsync(updated as any);
    setEditingPkg(null);
    toast.success("تم حفظ تعديلات الباقة");
  };

  const startEditQuote = (q: typeof quotations[0]) => {
    setEditForm({ amount: q.amount, service: q.service, package: q.package, status: q.status, type: q.type });
    setEditingQuote(q);
  };

  const saveEditQuote = async () => {
    if (!editingQuote) return;
    await updateQuotation.mutateAsync({ id: editingQuote.id, ...editForm });
    toast.success("تم تحديث عرض السعر بنجاح");
    setEditingQuote(null);
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  const filtered = quotations.filter((q) => {
    const matchSearch = !search || q.client.includes(search) || q.id.includes(search) || (q.civilId || "").includes(search);
    const matchStatus = statusFilter === "الكل" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const filteredPackages = selectedBuildingType === "الكل"
    ? flatPkgs
    : packages[selectedBuildingType] || [];

  async function handlePdf(e: React.MouseEvent, q: typeof quotations[0]) {
    e.stopPropagation();
    setExportingId(q.id);
    const tid = toast.loading("جاري إنشاء PDF...");
    try {
      const pkg = flatPackages.find(p => p.name === q.package) ?? {
        name: q.package, price: q.amount, features: [], level: "-",
      };
      await downloadQuotationPdf(
        { name: q.client, phone: "—", type: q.type, serviceType: q.service, governorate: q.governorate, area: q.area },
        pkg,
      );
      toast.success("تم تحميل PDF بنجاح", { id: tid });
    } catch (err: unknown) {
      const blocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(blocked ? "السماح بالنوافذ المنبثقة مطلوب" : "فشل إنشاء PDF", { id: tid });
    } finally {
      setExportingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}
            style={view === "list" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            عروض الأسعار
          </Button>
          <Button variant={view === "packages" ? "default" : "outline"} size="sm" onClick={() => setView("packages")}
            style={view === "packages" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            الباقات الهندسية ({flatPackages.length})
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Receipt className="w-4 h-4 ml-1" />
            فاتورة فتح ملف 50 د.ك
          </Button>
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }} onClick={() => setCreatingQuote(true)}>
            <Plus className="w-4 h-4 ml-2" />
            عرض سعر جديد
          </Button>
        </div>
      </div>

      {view === "list" ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="بحث بالاسم أو الرقم المدني..."
              className="max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="الكل">كل الحالات</SelectItem>
                {Object.keys(statusConfig).map(s => (
                  <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium w-8"></th>
                      <th className="text-right py-3 px-4 font-medium">الرقم</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">نوع العقار</th>
                      <th className="text-right py-3 px-4 font-medium">نوع الخدمة</th>
                      <th className="text-right py-3 px-4 font-medium">الباقة</th>
                      <th className="text-right py-3 px-4 font-medium">المبلغ (د.ك)</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((q) => {
                      const st = statusConfig[q.status] ?? fallbackStatus;
                      const isExpanded = expandedQuotation === q.id;
                      return (
                        <>
                          <tr key={q.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedQuotation(isExpanded ? null : q.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk', monospace" }}>
                              {q.id}
                              {q.leadId && (
                                <Link href="/crm">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 ms-1 cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-600">CRM</Badge>
                                </Link>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium">{q.client}</td>
                            <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{q.type}</Badge></td>
                            <td className="py-3 px-4"><Badge variant="secondary" className="text-xs">{q.service}</Badge></td>
                            <td className="py-3 px-4 text-muted-foreground text-xs">{q.package}</td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{q.amount}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="عرض"><Eye className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" title="تعديل"
                  onClick={() => startEditQuote(q)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="واتساب"
                                  onClick={() => window.open(`https://wa.me/965${q.civilId}`, "_blank")}>
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تحميل PDF"
                                  disabled={exportingId === q.id}
                                  onClick={(e) => handlePdf(e, q)}>
                                  {exportingId === q.id
                                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    : <Download className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={q.id + "-detail"} className="bg-muted/10">
                              <td colSpan={9} className="py-4 px-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* Project Details */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">بيانات المشروع</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">الرقم المدني:</span><span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{q.civilId}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الإصدار:</span><span dir="ltr">{q.date}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">صلاحية العرض:</span><span>{q.validityDays || 30} يوم</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">تاريخ الانتهاء:</span><span dir="ltr">{q.expiryDate || "—"}</span></div>
                                    </div>
                                  </div>
                                  {/* Location Details */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />
                                      بيانات الموقع
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between"><span className="text-muted-foreground">المحافظة:</span><span>{q.governorate}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">المنطقة:</span><span>{q.area}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">مساحة الأرض:</span><span>{q.landArea} م²</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">القطعة:</span><span>{q.block}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">رقم القسيمة:</span><span>{q.plot}</span></div>
                                    </div>
                                  </div>
                                  {/* Payment Schedule */}
                                  <div>
                                    <h4 className="text-xs font-bold mb-3 text-muted-foreground uppercase tracking-wider">جدول الدفعات</h4>
                                    <div className="space-y-2 text-sm">
                                      {(() => {
                                        const amt = parseFloat(q.amount?.replace(",", "") || "0");
                                        return [
                                          { label: "الدفعة الأولى (30%)", val: amt * 0.30, note: "عند التوقيع" },
                                          { label: "الدفعة الثانية (40%)", val: amt * 0.40, note: "عند اعتماد التصاميم" },
                                          { label: "الدفعة الثالثة (30%)", val: amt * 0.30, note: "عند الإنجاز" },
                                        ].map((d, i) => (
                                          <div key={i} className="flex justify-between items-center">
                                            <div>
                                              <div className="text-muted-foreground text-xs">{d.label}</div>
                                              <div className="text-[10px] text-muted-foreground">{d.note}</div>
                                            </div>
                                            <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>
                                              {d.val.toLocaleString("ar-KW", { minimumFractionDigits: 3 })} د.ك
                                            </span>
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">
                          لا توجد عروض أسعار مطابقة للبحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Packages Grid - Full 23 packages */
        <>
          {/* Building Type Filter */}
          <div className="flex gap-2 flex-wrap">
            {["الكل", "سكن خاص", "استثماري", "تجاري", "صناعي"].map((bt) => (
              <Button
                key={bt}
                variant={selectedBuildingType === bt ? "default" : "outline"}
                size="sm"
                className="text-xs"
                style={selectedBuildingType === bt ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}
                onClick={() => setSelectedBuildingType(bt)}
              >
                {bt}
                <Badge variant="secondary" className="mr-1.5 text-[10px] px-1.5">
                  {bt === "الكل" ? flatPkgs.length : (packages[bt]?.length || 0)}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Add New Package Button */}
          <div className="flex justify-end mb-2">
            <Button size="sm" onClick={() => setAddingPkg(true)} style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
              <Plus className="w-4 h-4 ml-1" />باقة جديدة
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPackages.map((pkg, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm leading-tight">{pkg.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      {pkg.level !== "-" && (
                        <Badge className="text-[10px] shrink-0 text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{pkg.level}</Badge>
                      )}
                      <button onClick={() => deletePkg(pkg)} className="text-red-400 hover:text-red-600 p-0.5 rounded" title="حذف الباقة">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="outline" className="text-[10px]">{pkg.buildingType}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{pkg.serviceType}</Badge>
                  </div>
                  <p className="text-2xl font-bold mt-2" style={{ color: "oklch(0.72 0.10 60)", fontFamily: "'Space Grotesk'" }}>
                    {pkg.price} <span className="text-sm font-normal">د.ك</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {pkg.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "oklch(0.55 0.15 150)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4" variant="outline" size="sm" onClick={() => openEditPkg(pkg)}>
                    <Pencil className="w-3.5 h-3.5 ml-1" />تعديل الباقة
                  </Button>
                  <Button className="w-full mt-1" variant="ghost" size="sm" onClick={() => deletePkg(pkg)}
                    style={{ color: "oklch(0.55 0.15 20)" }}>
                    <Trash2 className="w-3.5 h-3.5 ml-1" />حذف الباقة
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Edit Quotation Dialog */}
      {editingQuote && (
        <Dialog open onOpenChange={() => setEditingQuote(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">تعديل عرض السعر — {editingQuote.client}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">المبلغ (د.ك)</label>
                  <Input value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">الحالة</label>
                  <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["مسودة", "مرسل", "مقبول", "مرفوض", "عقد", "تم التعاقد", "منتهي"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">نوع المشروع</label>
                  <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["سكن خاص", "استثماري", "تجاري", "صناعي"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">نوع الخدمة</label>
                  <select value={editForm.service} onChange={e => setEditForm(f => ({ ...f, service: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "هدم", "إشراف"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">اسم الباقة</label>
                <Input value={editForm.package} onChange={e => setEditForm(f => ({ ...f, package: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditingQuote(null)}>إلغاء</Button>
                <Button size="sm" disabled={updateQuotation.isPending} onClick={saveEditQuote}
                  style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                  {updateQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                  حفظ التعديل
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Package Dialog */}
      {editingPkg && (
        <Dialog open onOpenChange={() => setEditingPkg(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">تعديل الباقة — {editingPkg.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">اسم الباقة</label>
                  <Input value={pkgForm.name} onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">السعر (د.ك)</label>
                  <Input value={pkgForm.price} onChange={e => setPkgForm(f => ({ ...f, price: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">نوع المبنى</label>
                  <select value={pkgForm.buildingType} onChange={e => setPkgForm(f => ({ ...f, buildingType: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["سكن خاص", "استثماري", "تجاري", "صناعي"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">نوع الخدمة</label>
                  <select value={pkgForm.serviceType} onChange={e => setPkgForm(f => ({ ...f, serviceType: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "إضافة مبنى قائم بدون ترخيص", "هدم", "إشراف"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">المستوى (Level)</label>
                  <select value={pkgForm.level} onChange={e => setPkgForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["-", "Basic", "Premium", "Gold", "Supervision"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">الخدمات (كل خدمة في سطر)</label>
                <textarea
                  value={pkgFeaturesText}
                  onChange={e => setPkgFeaturesText(e.target.value)}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white resize-none"
                  placeholder="اكتب كل خدمة في سطر منفصل..."
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setEditingPkg(null)}>إلغاء</Button>
                <Button size="sm" onClick={saveEditPkg} style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                  <Save className="w-3 h-3 ml-1" />حفظ التعديل
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create New Quotation Dialog */}
      {creatingQuote && (
        <Dialog open onOpenChange={() => setCreatingQuote(false)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">إنشاء عرض سعر جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Client selector */}
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-1">العميل</label>
                <select
                  value={newQuoteClientId}
                  onChange={e => {
                    setNewQuoteClientId(e.target.value);
                    const c = clients.find(cl => cl.id === e.target.value);
                    if (c) {
                      if (c.projectType) setNewQuoteBuildingType(c.projectType);
                      if (c.serviceType) setNewQuoteServiceType(c.serviceType);
                    }
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">-- اختر العميل --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ""}</option>
                  ))}
                </select>
              </div>

              {/* Building type & service type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">نوع المبنى</label>
                  <select
                    value={newQuoteBuildingType}
                    onChange={e => { setNewQuoteBuildingType(e.target.value); setNewQuoteSelectedPkg(null); }}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {["سكن خاص", "استثماري", "تجاري", "صناعي"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-1">نوع الخدمة</label>
                  <select
                    value={newQuoteServiceType}
                    onChange={e => { setNewQuoteServiceType(e.target.value); setNewQuoteSelectedPkg(null); }}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "إضافة مبنى قائم بدون ترخيص", "هدم", "إشراف"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Agreed price */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="text-sm font-semibold text-amber-800 block mb-1.5">السعر المتفق عليه (اختياري)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newQuoteAgreedPrice}
                    onChange={e => setNewQuoteAgreedPrice(e.target.value)}
                    placeholder="اتركه فارغًا لاستخدام سعر الباقة..."
                    className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                    dir="ltr"
                  />
                  <span className="text-sm font-medium text-amber-700">د.ك</span>
                </div>
                {newQuoteAgreedPrice && <p className="text-xs text-amber-600 mt-1">✓ سيتم استخدام هذا السعر بدلاً من سعر الباقة</p>}
              </div>

              {/* Package selection */}
              <div>
                <h4 className="font-bold text-sm mb-2">اختر الباقة ({newQuotePackages.length} باقة متاحة)</h4>
                {newQuotePackages.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-3 border rounded-lg">لا توجد باقات لهذا النوع/الخدمة</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {newQuotePackages.map((pkg, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewQuoteSelectedPkg(pkg === newQuoteSelectedPkg ? null : pkg)}
                        className={`w-full p-3 rounded-lg border text-right transition-all ${
                          newQuoteSelectedPkg === pkg
                            ? "border-blue-500 bg-blue-50"
                            : "border-border hover:border-blue-300"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk'" }}>
                            {newQuoteAgreedPrice && newQuoteSelectedPkg === pkg ? newQuoteAgreedPrice : pkg.price} د.ك
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{pkg.name}</span>
                            {pkg.level !== "-" && <Badge variant="outline" className="text-[10px]">{pkg.level}</Badge>}
                          </div>
                        </div>
                        {newQuoteSelectedPkg === pkg && (
                          <ul className="mt-2 text-xs text-muted-foreground space-y-1 text-right">
                            {pkg.features.map((f, fi) => <li key={fi}>• {f}</li>)}
                          </ul>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-start pt-2 flex-wrap">
                <Button variant="outline" onClick={() => setCreatingQuote(false)}>إلغاء</Button>
                <Button
                  variant="outline"
                  disabled={!newQuoteSelectedPkg || !newQuoteClientId || createQuotation.isPending}
                  onClick={() => handleCreateQuotation("مسودة")}
                >
                  {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                  حفظ مسودة
                </Button>
                <Button
                  disabled={!newQuoteSelectedPkg || !newQuoteClientId || createQuotation.isPending}
                  onClick={() => handleCreateQuotation("مرسل")}
                  style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                >
                  {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Send className="w-3 h-3 ml-1" />}
                  إنشاء وإرسال
                </Button>
                <Button
                  disabled={!newQuoteSelectedPkg || !newQuoteClientId || createQuotation.isPending}
                  onClick={() => handleCreateQuotation("مقبول")}
                  style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                >
                  {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <CheckCircle className="w-3 h-3 ml-1" />}
                  اعتماد العرض
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add New Package Dialog */}
      {addingPkg && (
        <Dialog open onOpenChange={() => setAddingPkg(false)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">إضافة باقة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">اسم الباقة</label>
                  <Input value={newPkgForm.name} onChange={e => setNewPkgForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: الباقة الأساسية - سكن خاص" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">السعر (د.ك)</label>
                  <Input value={newPkgForm.price} onChange={e => setNewPkgForm(f => ({ ...f, price: e.target.value }))} dir="ltr" placeholder="1,500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">نوع المبنى</label>
                  <select value={newPkgForm.buildingType} onChange={e => setNewPkgForm(f => ({ ...f, buildingType: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["سكن خاص", "استثماري", "تجاري", "صناعي"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">نوع الخدمة</label>
                  <select value={newPkgForm.serviceType} onChange={e => setNewPkgForm(f => ({ ...f, serviceType: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["بناء جديد", "تعديل", "إضافة", "تعديل وإضافة", "إضافة مبنى قائم", "إضافة مبنى قائم بدون ترخيص", "هدم", "إشراف"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">المستوى (Level)</label>
                  <select value={newPkgForm.level} onChange={e => setNewPkgForm(f => ({ ...f, level: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white">
                    {["-", "Basic", "Premium", "Gold", "Supervision"].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">الخدمات (كل خدمة في سطر)</label>
                <textarea
                  value={newPkgFeaturesText}
                  onChange={e => setNewPkgFeaturesText(e.target.value)}
                  rows={5}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white resize-none"
                  placeholder="اكتب كل خدمة في سطر منفصل..."
                />
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setAddingPkg(false)}>إلغاء</Button>
                <Button size="sm" onClick={saveNewPkg} disabled={!newPkgForm.name || !newPkgForm.price}
                  style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                  <Plus className="w-3 h-3 ml-1" />إضافة الباقة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
