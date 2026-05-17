import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight, Phone, FileText, Building2,
  Users, Edit2, Plus, Download, Upload,
  MessageSquare, ChevronDown, ChevronUp,
  ExternalLink, Copy, Trash2, MapPin, Star,
  Banknote, CreditCard, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Client } from "./Clients";
import { kuwaitGovernorates, serviceTypes, projectTypeColors } from "./Clients";
import { useClient, useUpdateClient, useDeleteClient, useProjects, useContracts, useInvoices, useDocuments } from "@/lib/api";

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  completed: { label: "منتهي", color: "bg-gray-100 text-gray-600" },
  pending: { label: "بانتظار", color: "bg-yellow-100 text-yellow-700" },
};

// ── نجوم التقييم ───────────────────────────────────────────────────────────
function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 transition-colors ${
            s <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"
          } ${onChange ? "cursor-pointer" : ""}`}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          onClick={() => onChange && onChange(s)}
        />
      ))}
    </div>
  );
}

// ── نموذج تعديل البيانات الشخصية ──────────────────────────────────────────
function EditPersonalDialog({ client, open, onClose }: {
  client: Client;
  open: boolean;
  onClose: () => void;
}) {
  const updateClient = useUpdateClient();
  const [form, setForm] = useState({
    name: client.name, phone: client.phone, phone2: client.phone2 || "",
    civilId: client.civilId || "", email: client.email || "",
    spouseName: client.spouseName || "", spouseCivilId: client.spouseCivilId || "",
    notes: client.notes || "", rating: client.rating || 0,
    status: client.status,
  });

  const handleSave = () => {
    updateClient.mutate({ id: client.id, ...form }, {
      onSuccess: () => { toast.success("تم تحديث البيانات"); onClose(); },
      onError: () => toast.error("حدث خطأ أثناء التحديث"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل البيانات الشخصية</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">الاسم الكامل</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-right text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">رقم الهاتف</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="text-right text-sm" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">هاتف بديل</label>
              <Input value={form.phone2} onChange={(e) => setForm({ ...form, phone2: e.target.value })} className="text-right text-sm" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">الرقم المدني</label>
              <Input value={form.civilId} onChange={(e) => setForm({ ...form, civilId: e.target.value })} className="text-right text-sm" dir="ltr" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">البريد الإلكتروني</label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="text-right text-sm" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">اسم الزوجة</label>
              <Input value={form.spouseName} onChange={(e) => setForm({ ...form, spouseName: e.target.value })} className="text-right text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">رقمها المدني</label>
              <Input value={form.spouseCivilId} onChange={(e) => setForm({ ...form, spouseCivilId: e.target.value })} className="text-right text-sm" dir="ltr" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">الحالة</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Client["status"] })}
              className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
              <option value="active">نشط</option>
              <option value="completed">منتهي</option>
              <option value="pending">بانتظار</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">التقييم</label>
            <StarRating rating={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">ملاحظات</label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="text-right text-sm" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={updateClient.isPending} className="bg-blue-600 hover:bg-blue-700">
            {updateClient.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── نموذج تعديل بيانات القسيمة ────────────────────────────────────────────
function EditParcelDialog({ client, open, onClose }: {
  client: Client;
  open: boolean;
  onClose: () => void;
}) {
  const updateClient = useUpdateClient();
  const [form, setForm] = useState({
    governorate: client.governorate || "",
    area: client.area || "",
    block: client.block || "",
    plot: client.plot || "",
    parcelArea: String(client.parcelArea || ""),
    parcelShape: client.parcelShape || "مستطيل",
    parcelFacing: client.parcelFacing || "شمال",
    ownershipDoc: client.ownershipDoc || "",
    ownershipDate: client.ownershipDate || "",
    projectType: client.projectType || "سكن خاص",
    serviceType: client.serviceType || "بناء جديد",
  });

  const govAreas = form.governorate ? (kuwaitGovernorates[form.governorate] || []) : [];

  const handleSave = () => {
    updateClient.mutate({
      id: client.id,
      ...form,
      parcelArea: Number(form.parcelArea) || 0,
    }, {
      onSuccess: () => { toast.success("تم تحديث بيانات القسيمة"); onClose(); },
      onError: () => toast.error("حدث خطأ أثناء التحديث"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات القسيمة والخدمة</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">المحافظة</label>
              <select value={form.governorate}
                onChange={(e) => setForm({ ...form, governorate: e.target.value, area: "" })}
                className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                <option value="">اختر المحافظة...</option>
                {Object.keys(kuwaitGovernorates).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">المنطقة</label>
              <select value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white"
                disabled={!form.governorate}>
                <option value="">اختر المنطقة...</option>
                {govAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">القطعة</label>
              <Input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} className="text-right text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">القسيمة</label>
              <Input value={form.plot} onChange={(e) => setForm({ ...form, plot: e.target.value })} className="text-right text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">المساحة (م²)</label>
              <Input value={form.parcelArea} onChange={(e) => setForm({ ...form, parcelArea: e.target.value })}
                type="number" className="text-right text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">شكل القسيمة</label>
              <select value={form.parcelShape} onChange={(e) => setForm({ ...form, parcelShape: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                <option>مستطيل</option><option>زاوية</option><option>مثلث</option><option>غير منتظم</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">وجهة القسيمة</label>
              <select value={form.parcelFacing} onChange={(e) => setForm({ ...form, parcelFacing: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm text-right bg-white">
                <option>شمال</option><option>جنوب</option><option>شرق</option><option>غرب</option>
                <option>شمال شرق</option><option>شمال غرب</option><option>جنوب شرق</option><option>جنوب غرب</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">رقم وثيقة الملكية</label>
              <Input value={form.ownershipDoc} onChange={(e) => setForm({ ...form, ownershipDoc: e.target.value })} className="text-right text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">تاريخ الوثيقة</label>
              <Input value={form.ownershipDate} onChange={(e) => setForm({ ...form, ownershipDate: e.target.value })}
                type="date" className="text-right text-sm" />
            </div>
          </div>
          <div className="border-t pt-3">
            <label className="text-xs font-medium text-gray-600 mb-2 block">نوع المعاملة</label>
            <div className="grid grid-cols-4 gap-2">
              {["سكن خاص", "صناعي", "استثماري", "تجاري"].map((t) => (
                <button key={t} onClick={() => setForm({ ...form, projectType: t, serviceType: "بناء جديد" })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                    form.projectType === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{t}</button>
              ))}
            </div>
            <label className="text-xs font-medium text-gray-600 mb-2 mt-3 block">نوع الخدمة</label>
            <div className="grid grid-cols-3 gap-2">
              {(serviceTypes[form.projectType] || []).map((s) => (
                <button key={s} onClick={() => setForm({ ...form, serviceType: s })}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                    form.serviceType === s ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={updateClient.isPending} className="bg-blue-600 hover:bg-blue-700">
            {updateClient.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── الصفحة الرئيسية ────────────────────────────────────────────────────────
export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"info" | "projects" | "contracts" | "invoices" | "docs" | "forms">("info");
  const [showParcel, setShowParcel] = useState(true);
  const [showEditPersonal, setShowEditPersonal] = useState(false);
  const [showEditParcel, setShowEditParcel] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const { data: client, isLoading } = useClient(params.id || "");
  const { data: allProjects = [] } = useProjects();
  const { data: allContracts = [] } = useContracts();
  const { data: allInvoices = [] } = useInvoices();
  const { data: allDocs = [] } = useDocuments();
  const deleteClient = useDeleteClient();

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-500 mb-4">العميل غير موجود</p>
          <Button onClick={() => navigate("/clients")}>العودة للعملاء</Button>
        </div>
      </div>
    );
  }

  const clientProjects = allProjects.filter((p) => p.clientId === client.id);
  const clientContracts = allContracts.filter((c) => c.clientId === client.id || c.client === client.name);
  const clientInvoices = allInvoices.filter((i) => i.clientId === client.id || i.client === client.name);
  const clientDocs = allDocs.filter((d) => d.clientId === client.id);
  const totalContractsValue = clientContracts.reduce((s, c) => s + parseFloat(c.amount || "0"), 0);
  const totalPaid = clientInvoices.filter((i) => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0);
  const totalRemaining = totalContractsValue - totalPaid;
  const statusInfo = statusLabels[client.status];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  const handleDelete = () => {
    deleteClient.mutate(client.id, {
      onSuccess: () => {
        toast.success("تم حذف العميل");
        navigate("/clients");
      },
      onError: () => toast.error("حدث خطأ أثناء الحذف"),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <button onClick={() => navigate("/clients")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowRight className="w-4 h-4" />
            العملاء
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${
                client.type === "company" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {client.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${projectTypeColors[client.projectType] || "bg-gray-400"}`} />
                    {client.projectType} — {client.serviceType}
                  </span>
                  <span>·</span>
                  <span>{client.id}</span>
                  <span>·</span>
                  <span>منذ {client.createdAt}</span>
                </div>
                {client.rating > 0 && (
                  <div className="mt-1">
                    <StarRating rating={client.rating} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => window.open(`tel:${client.phone}`)}>
                <Phone className="w-4 h-4" /> اتصال
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => window.open(`https://wa.me/965${client.phone}`)}>
                <MessageSquare className="w-4 h-4 text-green-600" /> واتساب
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                onClick={() => navigate(`/projects/new?client=${client.id}`)}>
                <Plus className="w-4 h-4" /> مشروع جديد
              </Button>
            </div>
          </div>

          {/* ملخص مالي سريع */}
          {totalContractsValue > 0 && (
            <div className="flex gap-4 mt-3 px-1">
              {[
                { label: "قيمة العقود", value: totalContractsValue, color: "text-blue-700" },
                { label: "المحصّل", value: totalPaid, color: "text-green-600" },
                { label: "المتبقي", value: totalRemaining, color: totalRemaining > 0 ? "text-amber-600" : "text-gray-500" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>{s.label}:</span>
                  <span className={`font-bold ${s.color}`}>{s.value.toLocaleString()} د.ك</span>
                </div>
              ))}
            </div>
          )}

          {/* التبويبات */}
          <div className="flex gap-1 mt-4 border-b -mb-px overflow-x-auto">
            {[
              { key: "info", label: "بيانات العميل", icon: Users },
              { key: "projects", label: `المشاريع (${clientProjects.length})`, icon: Building2 },
              { key: "contracts", label: `العقود (${clientContracts.length})`, icon: Banknote },
              { key: "invoices", label: `الفواتير (${clientInvoices.length})`, icon: CreditCard },
              { key: "docs", label: `المستندات (${clientDocs.length})`, icon: FolderOpen },
              { key: "forms", label: "نماذج البلدية", icon: Download },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-6 max-w-4xl">

        {/* تبويب بيانات العميل */}
        {activeTab === "info" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">البيانات الشخصية</h3>
                <button onClick={() => setShowEditPersonal(true)}
                  className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="الاسم الكامل" value={client.name} onCopy={() => copyToClipboard(client.name, "الاسم")} />
                <InfoRow label="رقم الهاتف" value={client.phone} dir="ltr" onCopy={() => copyToClipboard(client.phone, "الهاتف")} />
                {client.phone2 && <InfoRow label="هاتف بديل" value={client.phone2} dir="ltr" />}
                {client.civilId && <InfoRow label="الرقم المدني" value={client.civilId} dir="ltr" onCopy={() => copyToClipboard(client.civilId, "الرقم المدني")} />}
                {client.email && <InfoRow label="البريد الإلكتروني" value={client.email} dir="ltr" />}
                {client.spouseName && <InfoRow label="اسم الزوجة" value={client.spouseName} />}
                {client.spouseCivilId && <InfoRow label="رقم مدني الزوجة" value={client.spouseCivilId} dir="ltr" />}
              </div>
              {client.notes && (
                <div className="mt-4 bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
                  <span className="font-medium">ملاحظة: </span>{client.notes}
                </div>
              )}
            </div>

            {/* بيانات القسيمة */}
            <div className="bg-white rounded-2xl border p-5">
              <button className="flex items-center justify-between w-full mb-4"
                onClick={() => setShowParcel(!showParcel)}>
                <h3 className="font-semibold text-gray-800">بيانات القسيمة والخدمة</h3>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                    onClick={(e) => { e.stopPropagation(); setShowEditParcel(true); }}>
                    <Edit2 className="w-3.5 h-3.5" /> تعديل
                  </button>
                  {showParcel ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>
              {showParcel && (
                <div className="grid grid-cols-2 gap-4">
                  {client.governorate && <InfoRow label="المحافظة" value={client.governorate} />}
                  <InfoRow label="المنطقة" value={client.area} />
                  <InfoRow label="القطعة" value={client.block} />
                  <InfoRow label="القسيمة" value={client.plot} />
                  <InfoRow label="المساحة" value={`${client.parcelArea} م²`} />
                  <InfoRow label="شكل القسيمة" value={client.parcelShape} />
                  <InfoRow label="وجهة القسيمة" value={client.parcelFacing} />
                  {client.ownershipDoc && <InfoRow label="رقم وثيقة الملكية" value={client.ownershipDoc} onCopy={() => copyToClipboard(client.ownershipDoc, "رقم الوثيقة")} />}
                  {client.ownershipDate && <InfoRow label="تاريخ الوثيقة" value={client.ownershipDate} />}
                  <InfoRow label="نوع المعاملة" value={client.projectType} />
                  <InfoRow label="نوع الخدمة" value={client.serviceType} />
                </div>
              )}
            </div>

            {/* حذف العميل */}
            <div className="bg-white rounded-2xl border border-red-100 p-5">
              <h3 className="font-semibold text-red-700 mb-2">منطقة الخطر</h3>
              <p className="text-xs text-gray-500 mb-3">حذف العميل نهائي ولا يمكن التراجع عنه.</p>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
                onClick={() => setShowDeleteAlert(true)}>
                <Trash2 className="w-4 h-4" />
                حذف العميل
              </Button>
            </div>
          </div>
        )}

        {/* تبويب المشاريع */}
        {activeTab === "projects" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{clientProjects.length} مشروع مرتبط</h3>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                onClick={() => navigate(`/projects/new?client=${client.id}`)}>
                <Plus className="w-4 h-4" /> مشروع جديد
              </Button>
            </div>
            {clientProjects.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا يوجد مشاريع مرتبطة بهذا العميل</p>
              </div>
            ) : (
              clientProjects.map((p) => (
                <div key={p.id}
                  className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.id} · {p.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-xs text-gray-500 mb-1">{p.type} — {p.serviceType}</div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-blue-700">
                      {p.progress}%
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* تبويب العقود */}
        {activeTab === "contracts" && (
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 mb-2">{clientContracts.length} عقد مرتبط</h3>
            {clientContracts.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
                <Banknote className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا يوجد عقود مرتبطة</p>
              </div>
            ) : clientContracts.map((c) => {
              const statusColor: Record<string, string> = {
                "مسودة": "bg-gray-100 text-gray-600",
                "فعّال": "bg-green-100 text-green-700",
                "مكتمل": "bg-blue-100 text-blue-700",
                "ملغى": "bg-red-100 text-red-600",
              };
              return (
                <div key={c.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{c.id}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.type} — {c.service} · {c.date}</div>
                    {c.package && <div className="text-xs text-gray-400 mt-0.5">{c.package}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-800">{parseFloat(c.amount || "0").toLocaleString()} د.ك</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[c.status] || "bg-gray-100 text-gray-600"}`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* تبويب الفواتير */}
        {activeTab === "invoices" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{clientInvoices.length} فاتورة مرتبطة</h3>
              <div className="flex gap-3 text-xs text-gray-500">
                <span>محصّل: <strong className="text-green-600">{totalPaid.toLocaleString()} د.ك</strong></span>
                <span>متبقي: <strong className="text-amber-600">{totalRemaining.toLocaleString()} د.ك</strong></span>
              </div>
            </div>
            {clientInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا يوجد فواتير مرتبطة</p>
              </div>
            ) : clientInvoices.map((inv) => {
              const statusColor: Record<string, string> = {
                "مسودة": "bg-gray-100 text-gray-600",
                "مُرسلة": "bg-blue-100 text-blue-700",
                "مدفوعة جزئياً": "bg-amber-100 text-amber-700",
                "مدفوعة": "bg-green-100 text-green-700",
                "متأخرة": "bg-red-100 text-red-700",
                "ملغاة": "bg-gray-100 text-gray-500",
              };
              return (
                <div key={inv.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{inv.invoiceNumber || inv.id}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {inv.date}{inv.dueDate ? ` · استحقاق: ${inv.dueDate}` : ""}
                    </div>
                    {inv.paymentType && <div className="text-xs text-gray-400 mt-0.5">{inv.paymentType}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-800">{inv.total.toLocaleString()} د.ك</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[inv.status] || "bg-gray-100 text-gray-600"}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* تبويب المستندات */}
        {activeTab === "docs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">مستندات العميل</h3>
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => navigate("/documents")}>
                <Upload className="w-4 h-4" /> رفع مستند
              </Button>
            </div>
            {clientDocs.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا يوجد مستندات مرفوعة لهذا العميل</p>
                <p className="text-xs mt-1">ارفع الملفات من صفحة المستندات وربطها بالعميل</p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientDocs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.category} · {doc.fileSize}{doc.uploadedAt ? ` · ${doc.uploadedAt.slice(0, 10)}` : ""}</p>
                    </div>
                    {doc.url && (
                      <a href={doc.url} download={doc.name}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* تبويب نماذج البلدية */}
        {activeTab === "forms" && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mb-4">
              <strong>تعبئة تلقائية:</strong> النماذج ستُعبَّأ تلقائياً ببيانات العميل والقسيمة المحفوظة. تأكد من اكتمال بيانات العميل أولاً.
            </div>
            <h3 className="font-semibold text-gray-800 mb-3">
              نماذج {client.serviceType} — {client.projectType}
            </h3>

            {client.serviceType === "بناء جديد" && (
              <div className="space-y-2">
                {[
                  { name: "إقرارات المكتب", pages: 7, desc: "7 نماذج فرعية: طلب رخصة، تعهدات المخططات، خطاب الاتفاق" },
                  { name: "تعهد تصميم إنشائي", pages: 1, desc: "تعهد المكتب بالتصميم الإنشائي" },
                  { name: "تعهد عدم المطالبة بالكهرباء", pages: 1, desc: "تعهد المالك بعدم المطالبة بالخدمات" },
                  { name: "تعهدات المالك", pages: 12, desc: "12 تعهد: عدم تأجير، خدمات، مناسيب، توكيل، بيانات" },
                  { name: "تعهد الاطلاع على شهادة الإسكان", pages: 2, desc: "تعهد الاطلاع على شهادة إلى من يهمه الأمر" },
                ].map((form, i) => <FormCard key={i} form={form} client={client as any} />)}
              </div>
            )}

            {(client.serviceType === "تعديل وإضافة" || client.serviceType === "تعديل" || client.serviceType === "إضافة") && (
              <div className="space-y-2">
                {[
                  { name: "إقرارات المكتب", pages: 7, desc: "7 نماذج فرعية: طلب رخصة، تعهدات المخططات، خطاب الاتفاق" },
                  { name: "تعهد تصميم إنشائي", pages: 1, desc: "تعهد المكتب بالتصميم الإنشائي" },
                  { name: "تعهد عدم المطالبة بالكهرباء", pages: 1, desc: "تعهد المالك بعدم المطالبة بالخدمات" },
                  { name: "تعهدات المالك", pages: 12, desc: "12 تعهد: عدم تأجير، خدمات، مناسيب، توكيل، بيانات" },
                  { name: "تعهد الكشف على العقار وخلوه من المخالفات", pages: 4, desc: "3 نماذج: كشف العقار، مطابقة البناء القائم، المسؤولية الإنشائية" },
                ].map((form, i) => <FormCard key={i} form={form} client={client as any} />)}
              </div>
            )}

            <div className="pt-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 py-6 text-base"
                onClick={() => toast.success("جارٍ تعبئة جميع النماذج... (قريباً)")}>
                <Download className="w-5 h-5" />
                تعبئة وتحميل جميع النماذج دفعة واحدة
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showEditPersonal && (
        <EditPersonalDialog client={client as any} open={showEditPersonal} onClose={() => setShowEditPersonal(false)} />
      )}
      {showEditParcel && (
        <EditParcelDialog client={client as any} open={showEditParcel} onClose={() => setShowEditParcel(false)} />
      )}

      <Dialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-700">تأكيد حذف العميل</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            سيتم حذف العميل <strong>{client.name}</strong> نهائياً. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <DialogFooter className="gap-2 flex-row-reverse">
            <Button variant="outline" onClick={() => setShowDeleteAlert(false)}>إلغاء</Button>
            <Button onClick={handleDelete} disabled={deleteClient.isPending}
              className="bg-red-600 hover:bg-red-700 text-white">
              {deleteClient.isPending ? "جارٍ الحذف..." : "حذف نهائي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, dir: d, onCopy }: { label: string; value: string; dir?: string; onCopy?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-800" dir={d || "rtl"}>{value || "—"}</span>
        {onCopy && value && (
          <button onClick={onCopy} className="p-0.5 hover:bg-gray-100 rounded">
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

function FormCard({ form, client }: { form: { name: string; pages: number; desc: string }; client: Client }) {
  const isComplete = client.area && client.block && client.plot && client.name && client.ownershipDoc;
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-800">{form.name}</div>
          <div className="text-xs text-gray-500">{form.desc} · {form.pages} صفحة</div>
        </div>
      </div>
      <Button size="sm" variant={isComplete ? "default" : "outline"}
        className={isComplete ? "bg-blue-600 hover:bg-blue-700 gap-1.5" : "gap-1.5 text-gray-500"}
        onClick={() => {
          if (!isComplete) toast.error("يرجى إكمال بيانات القسيمة أولاً");
          else toast.success(`جارٍ تعبئة "${form.name}"... (قريباً)`);
        }}>
        <Download className="w-3.5 h-3.5" />
        {isComplete ? "تعبئة وتحميل" : "بيانات ناقصة"}
      </Button>
    </div>
  );
}
