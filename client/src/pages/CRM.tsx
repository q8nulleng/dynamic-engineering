/*
 * CRM - Simplified view with collapsible sections
 * Each stage is a clickable button that expands to show leads
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus, Phone, Mail, Star, DollarSign, User,
  Calendar, FileText, Trophy, X, ChevronDown, ChevronUp,
  Building, Percent, Tag, Save,
  ClipboardList, MessageCircle, Activity, Users, MapPin, Loader2,
  Pencil, Trash2, Eye, CheckCircle, Hash, Ruler,
} from "lucide-react";
import { Link } from "wouter";
import { kuwaitGovernorates } from "./Clients";
import { allPackages } from "./Quotations";
import {
  useCreateQuotation, useUpdateQuotation, useQuotationsByLead, useQuotations,
  useCrmLeads, useCreateCrmLead, useUpdateCrmLead, useDeleteCrmLead,
  useCreateClient, useCreateProject, useCreateContract, useUpdateContract,
  useCreateInvoice, useContracts, useProjects, useContractTemplates,
} from "@/lib/api";
import { exportQuotationPdf } from "@/lib/pdf";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: string;
  source: string;
  date: string;
  expectedRevenue: string;
  probability: number;
  priority: 0 | 1 | 2 | 3;
  salesperson?: string;
  expectedClosing: string;
  tags: string[];
  quotations: number;
  civilId?: string;
  notes?: string;
  serviceType?: string;
  governorate?: string;
  area?: string;
  likelyContract?: string;
  plotNumber?: string;
  landArea?: number;
  assignedTo?: string;
}

const stageTemplates = [
  { title: "استفسار جديد",    color: "oklch(0.55 0.15 250)", icon: Users },
  { title: "تم التواصل",      color: "oklch(0.72 0.10 60)",  icon: Phone },
  { title: "عرض سعر مرسل",   color: "oklch(0.60 0.15 280)", icon: FileText },
  { title: "بانتظار التعاقد", color: "oklch(0.65 0.15 140)", icon: FileText },
  { title: "تم التعاقد",      color: "oklch(0.55 0.15 150)", icon: Trophy },
  { title: "فرص خاسرة",      color: "oklch(0.55 0.15 25)",  icon: X },
];

const priorityStars = (p: number) => (
  <div className="flex gap-0.5">
    {[1, 2, 3].map((s) => (
      <Star key={s} className={`w-3 h-3 ${s <= p ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
    ))}
  </div>
);

const emptyForm = {
  name: "", phone: "", type: "", serviceType: "",
  source: "", referralName: "", expectedRevenue: "", probability: "",
  expectedClosing: "", priority: "", governorate: "", area: "",
  notes: "", plotNumber: "", landArea: "",
};

type PkgType = { name: string; price: string; buildingType: string; serviceType: string; level: string; features: string[] };

function QuotationDialog({ lead, onClose, onSaved }: {
  lead: Lead;
  onClose: () => void;
  onSaved: (quotationId: string) => void;
}) {
  const createQuotation = useCreateQuotation();
  const [selectedPkg, setSelectedPkg] = useState<PkgType | null>(null);
  const [generating, setGenerating] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState("");

  const allFlat = Object.values(allPackages).flat();
  const byType = lead.type ? (allPackages[lead.type] || allFlat) : allFlat;
  const packages: PkgType[] = lead.serviceType
    ? (byType.filter(p => p.serviceType === lead.serviceType).length > 0
        ? byType.filter(p => p.serviceType === lead.serviceType)
        : byType)
    : byType;

  const buildQuotationPayload = () => {
    const now = new Date().toISOString().split("T")[0];
    const expiryDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
    const finalAmount = agreedPrice.trim() ? agreedPrice.trim() : selectedPkg!.price;
    return {
      client: lead.name,
      type: lead.type,
      service: lead.serviceType || "",
      package: selectedPkg!.name,
      amount: finalAmount,
      date: now,
      governorate: lead.governorate || "",
      area: lead.area || "",
      clientId: null,
      projectId: null,
      civilId: lead.civilId || "",
      landArea: lead.landArea ? String(lead.landArea) : "",
      block: "",
      suburb: "",
      plot: lead.plotNumber || "",
      surveyPlan: "",
      leadId: lead.id,
      validityDays: 30,
      expiryDate,
    };
  };

  const handleSaveDraft = async () => {
    if (!selectedPkg) return;
    await createQuotation.mutateAsync({ ...buildQuotationPayload(), status: "مسودة" });
    toast.success("تم حفظ المسودة — استخدم 'إرسال العرض' لنقل المرحلة");
    onClose();
  };

  const handleSend = async () => {
    if (!selectedPkg) return;
    const q = await createQuotation.mutateAsync({ ...buildQuotationPayload(), status: "مرسل" });
    toast.success("تم إرسال عرض السعر");
    onSaved(q.id);
  };

  const handleGeneratePDF = async () => {
    if (!selectedPkg) return;
    setGenerating(true);
    const tid = toast.loading("جاري إنشاء PDF...");
    try {
      const pkgForPdf = agreedPrice.trim()
        ? { ...selectedPkg, price: agreedPrice.trim() }
        : selectedPkg;
      await exportQuotationPdf(lead, pkgForPdf);
      toast.success("تم فتح نافذة الطباعة", { id: tid });
    } catch (err: unknown) {
      const isBlocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(
        isBlocked ? "السماح بالنوافذ المنبثقة مطلوب — اضغط على الأيقونة في شريط العنوان" : "فشل إنشاء PDF",
        { id: tid }
      );
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">إنشاء عرض سعر — {lead.name}</DialogTitle>
        </DialogHeader>

        {/* Client info */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <div><span className="text-muted-foreground">الهاتف: </span><span className="font-medium">{lead.phone}</span></div>
          <div><span className="text-muted-foreground">النوع: </span><span className="font-medium">{lead.type}</span></div>
          {lead.serviceType && <div><span className="text-muted-foreground">الخدمة: </span><span className="font-medium">{lead.serviceType}</span></div>}
          {lead.governorate && <div><span className="text-muted-foreground">المحافظة: </span><span className="font-medium">{lead.governorate}</span></div>}
          {lead.area && <div><span className="text-muted-foreground">المنطقة: </span><span className="font-medium">{lead.area}</span></div>}
        </div>

        {/* السعر المتفق عليه */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <label className="text-sm font-semibold text-amber-800 block mb-1.5">
            السعر المتفق عليه (اختياري)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              placeholder="اتركه فارغًا لاستخدام سعر الباقة..."
              className="flex-1 border border-amber-300 rounded-lg px-3 py-1.5 text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              dir="ltr"
            />
            <span className="text-sm font-medium text-amber-700">د.ك</span>
          </div>
          {agreedPrice && (
            <p className="text-xs text-amber-600 mt-1">✓ سيتم استخدام هذا السعر بدلاً من سعر الباقة</p>
          )}
        </div>

        {/* Package selection */}
        <div className="space-y-2">
          <h4 className="font-bold text-sm">الباقات المتاحة ({packages.length})</h4>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 border rounded-lg">لا توجد باقات لهذا النوع/الخدمة</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {packages.map((pkg, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedPkg(pkg === selectedPkg ? null : pkg)}
                  className={`w-full p-3 rounded-lg border text-right transition-all ${
                    selectedPkg === pkg
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                      : "border-border hover:border-blue-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk'" }}>
                      {pkg.price} د.ك
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{pkg.name}</span>
                      {pkg.level !== "-" && (
                        <Badge variant="outline" className="text-[10px]">{pkg.level}</Badge>
                      )}
                    </div>
                  </div>
                  {selectedPkg === pkg && (
                    <ul className="mt-2 text-xs text-muted-foreground space-y-1 text-right">
                      {pkg.features.map((f, fi) => <li key={fi}>• {f}</li>)}
                    </ul>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PDF Preview — official letterhead */}
        {selectedPkg && (
          <div
            className="border border-gray-300 overflow-hidden bg-white text-black"
            style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", direction: "rtl" }}
          >
            {/* Header */}
            <div className="px-5 pt-4">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", direction: "rtl", paddingBottom: "8px" }}>
                <img src="/assets/logo-dynamic.jpeg" style={{ width: "56px", height: "auto", objectFit: "contain" }} alt="Dynamic Logo" />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000" }}>ديناميك للإستشارات الهندسية</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#000", letterSpacing: "1.5px", marginTop: "3px", fontFamily: "'Space Grotesk',sans-serif" }}>DYNAMIC ENGINEERING CONSULTANTS</div>
                </div>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #000", margin: "0 0 4px" }} />
              <div style={{ textAlign: "center", fontSize: "9px", color: "#333", padding: "3px 0 10px" }}>
                إستشاريون (تصميم وإشراف) - معماري - إنشائي - مباني وإنشاءات - تصميم - إدارة مشاريع
              </div>
            </div>

            {/* Body */}
            <div className="px-5 pb-3">
              {/* Client info */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#000", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "6px" }}>بيانات العميل</div>
                {([
                  ["الاسم", lead.name],
                  ["الهاتف", lead.phone],
                  lead.type ? ["نوع المشروع", lead.type] : null,
                  lead.serviceType ? ["نوع الخدمة", lead.serviceType] : null,
                  lead.governorate ? ["المحافظة", lead.governorate] : null,
                  lead.area ? ["المنطقة", lead.area] : null,
                ] as ([string, string] | null)[]).filter((r): r is [string, string] => r !== null).map(([label, value], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: "11px", borderBottom: "1px dotted #ddd" }}>
                    <span style={{ color: "#555" }}>{label}</span>
                    <span style={{ fontWeight: 600, color: "#000" }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Package — black border frame */}
              <div style={{ border: "2px solid #000", padding: "12px 14px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#000", fontFamily: "'Space Grotesk',sans-serif" }}>
                    {agreedPrice.trim() ? agreedPrice.trim() : selectedPkg.price} <span style={{ fontSize: "11px", fontWeight: 600 }}>د.ك</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#000" }}>{selectedPkg.name}</div>
                    {selectedPkg.level !== "-" && <div style={{ fontSize: "9px", color: "#555", marginTop: "2px" }}>{selectedPkg.level}</div>}
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #ccc", paddingTop: "8px" }}>
                  {selectedPkg.features.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", gap: "6px", marginBottom: "4px", fontSize: "10px", color: "#000" }}>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validity — English date */}
              <div style={{ textAlign: "center", fontSize: "10px", color: "#555", border: "1px solid #ccc", padding: "6px" }}>
                هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار · {new Date().toISOString().split("T")[0]}
              </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: "1px solid #000", padding: "6px 20px 8px", textAlign: "center", fontSize: "8px", color: "#333" }}>
              <div style={{ fontWeight: "bold" }}>مدينة الكويت - قبلة - شارع الصالحية - مبنى رقم (18) الدور الاول مكتب رقم (1) موبايل: 22091228 - 50855599</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Kuwait city – Qiblah – Salihia.st – Building no:18 – First floor no-1 Mobil no: 22091228 – 50855599</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif" }}>Email: info@DynamicSaud.com</div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-start pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            variant="outline"
            disabled={!selectedPkg || createQuotation.isPending}
            onClick={handleSaveDraft}
          >
            {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
            حفظ مسودة
          </Button>
          <Button
            disabled={!selectedPkg || createQuotation.isPending}
            onClick={handleSend}
            style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
          >
            {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Mail className="w-3 h-3 ml-1" />}
            إرسال العرض
          </Button>
          <Button
            disabled={!selectedPkg || generating}
            onClick={handleGeneratePDF}
            style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <FileText className="w-3 h-3 ml-1" />}
            {generating ? "جاري الإنشاء..." : "تحميل PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── View Quote Dialog ────────────────────────────────────────────────────
function ViewQuoteDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: quotes, isLoading } = useQuotationsByLead(lead.id);
  const updateQuotation = useUpdateQuotation();
  const quote = quotes?.[0];
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ amount: "", service: "", package: "", status: "", type: "" });

  const startEdit = () => {
    if (!quote) return;
    setEditForm({ amount: quote.amount, service: quote.service, package: quote.package, status: quote.status, type: quote.type });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!quote) return;
    await updateQuotation.mutateAsync({ id: quote.id, ...editForm });
    toast.success("تم تحديث عرض السعر بنجاح");
    setEditing(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">عرض السعر — {lead.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !quote ? (
          <div className="text-center py-8 text-muted-foreground text-sm">لا يوجد عرض سعر مربوط بهذه الفرصة</div>
        ) : editing ? (
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
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>إلغاء</Button>
              <Button size="sm" disabled={updateQuotation.isPending} onClick={saveEdit}
                style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                {updateQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
                حفظ التعديل
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm border rounded-lg p-4 bg-muted/30">
              <div><span className="text-muted-foreground">رقم العرض:</span> <span className="font-mono font-bold">{quote.id}</span></div>
              <div><span className="text-muted-foreground">الحالة:</span> <Badge variant="outline">{quote.status}</Badge></div>
              <div><span className="text-muted-foreground">الباقة:</span> <span className="font-bold">{quote.package}</span></div>
              <div><span className="text-muted-foreground">المبلغ:</span> <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{quote.amount} د.ك</span></div>
              <div><span className="text-muted-foreground">تاريخ الإصدار:</span> <span dir="ltr">{quote.date}</span></div>
              <div><span className="text-muted-foreground">تاريخ الانتهاء:</span> <span dir="ltr">{quote.expiryDate || "—"}</span></div>
              <div><span className="text-muted-foreground">نوع الخدمة:</span> <span>{quote.service}</span></div>
              <div><span className="text-muted-foreground">نوع المشروع:</span> <span>{quote.type}</span></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>إغلاق</Button>
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="w-3.5 h-3.5 ml-1" />
                تعديل العرض
              </Button>
              <Link href="/quotations">
                <Button size="sm" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                  <FileText className="w-3.5 h-3.5 ml-1" />
                  فتح قسم عروض الأسعار
                </Button>
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Contract Dialog (templates from API) ─────────────────────────────────
function ContractDialog({ lead, onClose, onSaved }: {
  lead: Lead;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: quotes } = useQuotationsByLead(lead.id);
  const { data: apiTemplates = [], isLoading: templatesLoading } = useContractTemplates();
  const createContract = useCreateContract();
  const quote = quotes?.[0];

  const [form, setForm] = useState({
    civilId: lead.civilId || "",
    area: lead.area || "",
    block: "",
    plot: lead.plotNumber || "",
    amount: lead.expectedRevenue || "",
    signingDate: new Date().toISOString().slice(0, 10),
    templateType: "",
    contractType: lead.type || "",
    contractService: lead.serviceType || "",
    selectedTemplateId: 0,
  });
  const [busy, setBusy] = useState(false);

  // Sync amount from quote once loaded
  const quoteAmount = quote?.amount;
  const [amountSynced, setAmountSynced] = useState(false);
  if (quoteAmount && !amountSynced) {
    setForm(p => ({ ...p, amount: quoteAmount }));
    setAmountSynced(true);
  }

  const selectedTemplate = apiTemplates.find(t => t.id === form.selectedTemplateId) ?? null;

  const handleTemplateChange = (idStr: string) => {
    const id = parseInt(idStr, 10);
    const t = apiTemplates.find(x => x.id === id);
    setForm(p => ({
      ...p,
      selectedTemplateId: id,
      templateType: t?.name || p.templateType,
      contractType: t?.buildingType || p.contractType,
      contractService: t?.serviceType || p.contractService,
    }));
  };

  const handleSubmit = async () => {
    if (!form.civilId.trim()) { toast.error("يرجى إدخال الرقم المدني"); return; }
    if (!form.templateType) { toast.error("يرجى اختيار نوع العقد"); return; }
    setBusy(true);
    try {
      const now = new Date().toISOString().slice(0, 10);
      // Snapshot of template sections at time of contract creation
      const termsText = selectedTemplate
        ? JSON.stringify({
            scopeOfWork: selectedTemplate.scopeOfWork,
            terms: selectedTemplate.terms,
            party1Obligations: selectedTemplate.party1Obligations,
            party2Obligations: selectedTemplate.party2Obligations,
            paymentSchedule: selectedTemplate.paymentSchedule,
            duration: selectedTemplate.duration,
            notes: selectedTemplate.notes,
          })
        : "";

      await createContract.mutateAsync({
        client: lead.name,
        quotationId: quote?.id ?? null,
        projectId: null,
        clientId: null,
        type: form.contractType || lead.type || "",
        service: form.contractService || lead.serviceType || "",
        package: quote?.package || "",
        template: form.templateType,
        status: "مسودة",
        date: now,
        amount: form.amount,
        civilId: form.civilId,
        area: form.area,
        block: form.block,
        plot: form.plot,
        leadId: lead.id,
        templateType: form.templateType,
        termsText,
        signingDate: form.signingDate,
      });
      onSaved();
    } catch {
      toast.error("فشل إنشاء العقد");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">إنشاء عقد — {lead.name}</DialogTitle>
        </DialogHeader>
        {quote && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-muted/30 rounded-lg text-sm mb-2">
            <div><span className="text-muted-foreground">الباقة: </span><span className="font-bold">{quote.package}</span></div>
            <div><span className="text-muted-foreground">مبلغ العرض: </span><span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{quote.amount} د.ك</span></div>
          </div>
        )}
        <div className="space-y-4">
          {/* Template selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              نوع/قالب العقد <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.selectedTemplateId ? String(form.selectedTemplateId) : ""}
              onValueChange={handleTemplateChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={templatesLoading ? "جاري التحميل..." : "اختر قالب العقد الهندسي..."} />
              </SelectTrigger>
              <SelectContent>
                {apiTemplates.map(t => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="text-muted-foreground text-xs ml-1">{t.id}.</span> {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">{form.contractType}</Badge>
                  <Badge variant="secondary" className="text-xs">{form.contractService}</Badge>
                </div>
                {selectedTemplate.scopeOfWork && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed p-2 bg-muted/30 rounded border line-clamp-2">
                    {selectedTemplate.scopeOfWork.slice(0, 180)}...
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-muted-foreground" />الرقم المدني <span className="text-red-500">*</span></label>
              <Input placeholder="2XXXXXXXXXX" dir="ltr" value={form.civilId} onChange={(e) => setForm(p => ({ ...p, civilId: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-muted-foreground" />قيمة العقد (د.ك)</label>
              <Input type="number" dir="ltr" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />المنطقة</label>
              <Input placeholder="المنطقة" value={form.area} onChange={(e) => setForm(p => ({ ...p, area: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />القطعة</label>
              <Input placeholder="رقم القطعة" value={form.plot} onChange={(e) => setForm(p => ({ ...p, plot: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />القسيمة</label>
              <Input placeholder="رقم القسيمة" value={form.block} onChange={(e) => setForm(p => ({ ...p, block: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />تاريخ التوقيع</label>
              <Input type="date" dir="ltr" value={form.signingDate} onChange={(e) => setForm(p => ({ ...p, signingDate: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button disabled={busy} onClick={handleSubmit} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            {busy ? <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> : <Save className="w-3.5 h-3.5 ml-1" />}
            إنشاء العقد
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CRM() {
  const { data: leadsData } = useCrmLeads();
  const { data: contractsData } = useContracts();
  const { data: allProjects = [] } = useProjects();
  const { data: allQuotations = [] } = useQuotations();
  const createLead = useCreateCrmLead();
  const updateLead = useUpdateCrmLead();
  const deleteLead = useDeleteCrmLead();
  const createClient = useCreateClient();
  const createProject = useCreateProject();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const updateQuotation = useUpdateQuotation();
  const createInvoice = useCreateInvoice();

  const [openStage, setOpenStage] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState<"basic" | "details" | "notes">("basic");
  const [quotationTarget, setQuotationTarget] = useState<Lead | null>(null);
  const [viewQuoteTarget, setViewQuoteTarget] = useState<Lead | null>(null);
  const [contractTarget, setContractTarget] = useState<Lead | null>(null);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editActiveTab, setEditActiveTab] = useState<"basic" | "details" | "notes">("basic");
  const [signingBusy, setSigningBusy] = useState(false);

  const data = stageTemplates.map((t) => ({
    ...t,
    leads: (leadsData || []).filter((l) => l.stage === t.title) as Lead[],
  }));

  const handleContractSigned = async (lead: Lead) => {
    const contract = (contractsData || []).find((c) => c.leadId === lead.id);
    if (!contract) {
      toast.error("يرجى إنشاء عقد أولاً ثم حاول مجدداً");
      return;
    }
    setSigningBusy(true);
    try {
      const now = new Date().toISOString().slice(0, 10);
      const clientId = `C${Date.now().toString(36).toUpperCase()}`;
      const contractAmount = parseFloat(contract.amount || "0");

      const client = await createClient.mutateAsync({
        id: clientId,
        name: lead.name,
        phone: lead.phone,
        type: "individual" as const,
        governorate: lead.governorate || "",
        area: lead.area || "",
        block: "",
        plot: lead.plotNumber || "",
        parcelArea: lead.landArea || 0,
        status: "active" as const,
        rating: 4,
        createdAt: now,
        projectType: lead.type || "",
        serviceType: lead.serviceType || "",
        leadId: lead.id,
        totalContractsValue: contractAmount,
        totalPaid: 0,
        totalRemaining: contractAmount,
        notes: lead.notes || "",
        civilId: lead.civilId || contract.civilId || "",
        email: "",
        ownershipDoc: "",
        ownershipDate: "",
        spouseName: "",
        spouseCivilId: "",
        phone2: "",
        parcelShape: "",
        parcelFacing: "",
      });

      // Use max existing project number + 1 to avoid gaps from deleted projects
      const maxSeq = allProjects.reduce((max, p) => {
        const n = parseInt(p.id.replace(/^S/, ""), 10);
        return isNaN(n) ? max : Math.max(max, n);
      }, 0);
      const projectId = `S${String(maxSeq + 1).padStart(5, "0")}`;
      const defaultPhases = [
        { title: "تجهيز الملف", tasks: [
          { name: "تصميم الكروكي", status: "pending", order: 0 },
          { name: "تجميع المستندات", status: "pending", order: 1 },
          { name: "العقد والدفعة الأولى", status: "pending", order: 2 },
          { name: "نماذج البلدية", status: "pending", order: 3 },
        ]},
        { title: "التصميم", tasks: [
          { name: "التصميم المعماري", status: "pending", order: 0 },
          { name: "تصميم الواجهات", status: "pending", order: 1 },
          { name: "مخطط البلدية", status: "pending", order: 2 },
        ]},
        { title: "البلدية والاعتماد", tasks: [
          { name: "تقديم بلدية", status: "pending", order: 0 },
          { name: "الحصول على موافقة البلدية", status: "pending", order: 1 },
          { name: "دفع رسوم البلدية", status: "pending", order: 2 },
        ]},
        { title: "الكراسة والمخططات", tasks: [
          { name: "التصميم الإنشائي", status: "pending", order: 0 },
          { name: "التصميم الصحي", status: "pending", order: 1 },
          { name: "التصميم الكهربائي", status: "pending", order: 2 },
        ]},
        { title: "الإشراف", tasks: [
          { name: "إصدار خطاب إشراف", status: "pending", order: 0 },
          { name: "الإشراف الميداني", status: "pending", order: 1 },
          { name: "شهادة الإنجاز", status: "pending", order: 2 },
        ]},
      ];
      await createProject.mutateAsync({
        id: projectId,
        name: `${lead.type || "مشروع"} - ${lead.name}`,
        clientId: client.id,
        client: lead.name,
        type: lead.type || "سكن خاص",
        serviceType: lead.serviceType || "بناء جديد",
        area: lead.area || "",
        contractId: contract.id,
        leadId: lead.id,
        status: "جديد",
        phases: defaultPhases as unknown[],
      });

      // إنشاء المهام التلقائية مباشرة بعد المشروع
      await fetch(`/api/projects/${projectId}/auto-tasks`, { method: "POST" }).catch(() => null);

      // First invoice: file opening fee (50 KD) + 30% of contract amount
      const fileOpenFee = 50;
      const firstPct = contractAmount * 0.3;
      const subtotal = fileOpenFee + firstPct;
      const taxAmount = subtotal * 0.15;
      await createInvoice.mutateAsync({
        clientId: client.id,
        client: lead.name,
        project: projectId,
        projectId,
        contractId: contract.id,
        status: "مسودة",
        date: now,
        dueDate: new Date(new Date(contract.signingDate || now).getTime() + 7 * 86400000).toISOString().slice(0, 10),
        subtotal,
        taxRate: 15,
        taxAmount,
        total: subtotal + taxAmount,
        paymentType: "الدفعة الأولى",
        paymentMethod: "",
        lines: [
          { product: "رسوم فتح ملف", description: "رسوم فتح ملف وتسجيل المشروع", quantity: 1, price: fileOpenFee, taxPercent: 15, total: fileOpenFee * 1.15 },
          { product: "الدفعة الأولى 30%", description: `الدفعة الأولى - ${contract.package || lead.type}`, quantity: 1, price: firstPct, taxPercent: 15, total: firstPct * 1.15 },
        ],
      } as Parameters<typeof createInvoice.mutateAsync>[0]);

      await updateContract.mutateAsync({ id: contract.id, status: "نشط", projectId, signingDate: now });

      // تحديث حالة عرض السعر المرتبط
      const leadQuote = allQuotations.find((q) => q.leadId === lead.id);
      if (leadQuote) {
        await updateQuotation.mutateAsync({ id: leadQuote.id, status: "تم التعاقد" });
      }

      await updateLead.mutateAsync({ id: lead.id, stage: "تم التعاقد" });

      setSelectedLead(null);
      setOpenStage(stageTemplates.findIndex((s) => s.title === "تم التعاقد"));
      toast.success(`🎉 تم التعاقد مع "${lead.name}" — تم إنشاء العميل والمشروع والفاتورة الأولى`);
    } catch (err) {
      toast.error("حدث خطأ أثناء إتمام التعاقد — تحقق من البيانات وحاول مجدداً");
      console.error(err);
    } finally {
      setSigningBusy(false);
    }
  };

  const totalLeads = leadsData?.length ?? 0;
  const totalRevenue = (leadsData || []).reduce((s, l) => s + parseFloat((l.expectedRevenue || "0").replace(",", "") || "0"), 0);

  const handleFormChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
    if (!form.phone.trim()) { toast.error("يرجى إدخال رقم الهاتف"); return; }
    await createLead.mutateAsync({
      name: form.name,
      phone: form.phone,
      source: form.source,
      type: form.type,
      serviceType: form.serviceType,
      governorate: form.governorate,
      area: form.area,

      expectedRevenue: form.expectedRevenue || "0",
      probability: Number(form.probability) || 10,
      priority: Number(form.priority) || 0,
      expectedClosing: form.expectedClosing,
      notes: form.notes,
      plotNumber: form.plotNumber,
      landArea: Number(form.landArea) || 0,
      stage: "استفسار جديد",
      tags: [],
      quotations: 0,
      date: new Date().toISOString().slice(0, 10),
    });
    setOpenStage(0);
    setForm(emptyForm);
    setActiveTab("basic");
    setShowNewDialog(false);
    toast.success(`تمت إضافة فرصة "${form.name}" بنجاح`);
  };

  return (
    <div className="space-y-5">
      {/* Header - Simple */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">تتبع العملاء من الاستفسار حتى التعاقد</p>
        <Button onClick={() => setShowNewDialog(true)} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          فرصة جديدة
        </Button>
      </div>

      {/* Summary Row - Compact */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalLeads}</span>
          <span className="text-muted-foreground">فرصة</span>
        </div>
        <div className="w-px h-5 bg-border" />
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalRevenue.toLocaleString()}</span>
          <span className="text-muted-foreground">د.ك</span>
        </div>
      </div>

      {/* ===== Stage Buttons ===== */}
      <div className="space-y-3">
        {data.map((stage, si) => {
          const isOpen = openStage === si;
          const stageRevenue = stage.leads.reduce((s, l) => s + parseFloat((l.expectedRevenue || "0").replace(",", "") || "0"), 0);
          const Icon = stage.icon;

          return (
            <div key={si}>
              {/* Stage Button */}
              <button
                onClick={() => { setOpenStage(isOpen ? null : si); setSelectedLead(null); }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm"
                style={{
                  borderColor: isOpen ? stage.color : undefined,
                  backgroundColor: isOpen ? `color-mix(in oklch, ${stage.color} 5%, white)` : undefined,
                }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `color-mix(in oklch, ${stage.color} 15%, white)` }}>
                  <Icon className="w-5 h-5" style={{ color: stage.color }} />
                </div>

                {/* Title + Count */}
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-sm">{stage.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stage.leads.length} عميل · {stageRevenue.toLocaleString()} د.ك
                  </p>
                </div>

                {/* Badge + Arrow */}
                <Badge
                  className="text-white text-xs px-2.5 py-1"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.leads.length}
                </Badge>
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Expanded Leads List */}
              {isOpen && (
                <div className="mt-2 mr-4 border-r-2 pr-4 space-y-2" style={{ borderColor: stage.color }}>
                  {stage.leads.map((lead, li) => (
                    <div
                      key={li}
                      onClick={() => setSelectedLead(selectedLead === lead ? null : lead)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                        selectedLead === lead ? "shadow-sm" : ""
                      }`}
                      style={selectedLead === lead ? { borderColor: stage.color, backgroundColor: `color-mix(in oklch, ${stage.color} 3%, white)` } : {}}
                    >
                      {/* Lead Row */}
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: stage.color }}>
                          {lead.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold truncate">{lead.name}</h4>
                            {priorityStars(lead.priority || 0)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span dir="ltr">{lead.phone}</span>
                            <span>·</span>
                            <span>{lead.type}</span>
                          </div>
                        </div>

                        {/* Revenue */}
                        <div className="text-left shrink-0">
                          <p className="text-sm font-bold" style={{ color: stage.color, fontFamily: "'Space Grotesk'" }}>
                            {lead.expectedRevenue} <span className="text-[10px] font-normal text-muted-foreground">د.ك</span>
                          </p>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <div className="w-10 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${lead.probability || 0}%`, backgroundColor: stage.color }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{lead.probability || 0}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Lead Details */}
                      {selectedLead === lead && (
                        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          {/* Contact Details */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">{lead.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                              <span dir="ltr">{lead.expectedClosing}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.salesperson}</span>
                            </div>
                            {lead.serviceType && (
                              <div className="flex items-center gap-2">
                                <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{lead.serviceType}</span>
                              </div>
                            )}
                            {lead.governorate && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{lead.governorate}</span>
                              </div>
                            )}
                            {lead.area && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>{lead.area}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{lead.source}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex gap-1.5 flex-wrap">
                            {(lead.tags || []).map((tag, ti) => (
                              <Badge key={ti} variant="secondary" className="text-[10px]">{tag}</Badge>
                            ))}
                            {lead.quotations > 0 && (
                              <Badge className="text-[10px] text-white bg-blue-500">{lead.quotations} عرض سعر</Badge>
                            )}
                          </div>

                          {/* Actions — stage-specific */}
                          <div className="flex gap-2 flex-wrap">
                            {/* ── Stage 0: استفسار جديد ── */}
                            {si === 0 && (<>
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => window.open(`tel:${(lead.phone || "").replace(/\s/g, "")}`)}
                              ><Phone className="w-3 h-3 ml-1" />اتصال</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => window.open(`https://wa.me/965${(lead.phone || "").replace(/\s/g, "")}`, "_blank")}
                              ><MessageCircle className="w-3 h-3 ml-1" />واتساب</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-blue-600 border-blue-200"
                                onClick={async () => {
                                  await updateLead.mutateAsync({ id: lead.id, stage: "تم التواصل" });
                                  setOpenStage(1); setSelectedLead(null);
                                  toast.success(`"${lead.name}" → تم التواصل`);
                                }}
                              ><ChevronUp className="w-3 h-3 ml-1" />تم التواصل</Button>
                            </>)}

                            {/* ── Stage 1: تم التواصل ── */}
                            {si === 1 && (<>
                              <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                                onClick={() => setQuotationTarget(lead)}
                              ><FileText className="w-3 h-3 ml-1" />إنشاء عرض سعر</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200"
                                onClick={async () => {
                                  await updateLead.mutateAsync({ id: lead.id, stage: "فرص خاسرة" });
                                  setSelectedLead(null);
                                  toast.info(`"${lead.name}" → فرص خاسرة`);
                                }}
                              ><X className="w-3 h-3 ml-1" />خسارة</Button>
                            </>)}

                            {/* ── Stage 2: عرض سعر مرسل ── */}
                            {si === 2 && (<>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-300"
                                onClick={() => setViewQuoteTarget(lead)}
                              ><Eye className="w-3 h-3 ml-1" />عرض عرض السعر</Button>
                              <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                                onClick={async () => {
                                  await updateLead.mutateAsync({ id: lead.id, stage: "بانتظار التعاقد" });
                                  setOpenStage(3); setSelectedLead(null);
                                  toast.success(`"${lead.name}" → بانتظار التعاقد`);
                                }}
                              ><Trophy className="w-3 h-3 ml-1" />فوز</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200"
                                onClick={async () => {
                                  await updateLead.mutateAsync({ id: lead.id, stage: "فرص خاسرة" });
                                  setSelectedLead(null);
                                  toast.info(`"${lead.name}" → فرص خاسرة`);
                                }}
                              ><X className="w-3 h-3 ml-1" />خسارة</Button>
                            </>)}

                            {/* ── Stage 3: بانتظار التعاقد ── */}
                            {si === 3 && (<>
                              <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                                onClick={() => setContractTarget(lead)}
                              ><FileText className="w-3 h-3 ml-1" />إنشاء عقد</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-300"
                                onClick={() => setViewQuoteTarget(lead)}
                              ><Eye className="w-3 h-3 ml-1" />عرض عرض السعر</Button>
                              <Button size="sm" className="text-xs h-7 text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                                disabled={signingBusy}
                                onClick={() => handleContractSigned(lead)}
                              >
                                {signingBusy ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <CheckCircle className="w-3 h-3 ml-1" />}
                                تم التعاقد
                              </Button>
                            </>)}

                            {/* ── Stage 4: تم التعاقد (archived) ── */}
                            {si === 4 && (
                              <span className="text-xs text-muted-foreground italic">مكتمل — تم نقله للعملاء</span>
                            )}

                            {/* ── Stage 5: فرص خاسرة ── */}
                            {si === 5 && (<>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-blue-600 border-blue-200"
                                onClick={async () => {
                                  await updateLead.mutateAsync({ id: lead.id, stage: "استفسار جديد" });
                                  setOpenStage(0); setSelectedLead(null);
                                  toast.success(`"${lead.name}" → استفسار جديد (استعادة)`);
                                }}
                              ><ChevronUp className="w-3 h-3 ml-1" />استعادة</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200"
                                onClick={async () => {
                                  if (!window.confirm(`هل تريد حذف فرصة "${lead.name}" نهائياً؟`)) return;
                                  await deleteLead.mutateAsync(lead.id);
                                  setSelectedLead(null);
                                  toast.success(`تم حذف فرصة "${lead.name}"`);
                                }}
                              ><Trash2 className="w-3 h-3 ml-1" />حذف</Button>
                            </>)}

                            {/* Edit + Delete always visible except archived/lost */}
                            {si < 4 && (<>
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => {
                                  setEditForm({
                                    name: lead.name || "", phone: lead.phone || "",
                                    type: lead.type || "", serviceType: lead.serviceType || "",
                                    source: lead.source || "", referralName: "", expectedRevenue: lead.expectedRevenue || "",
                                    probability: String(lead.probability || ""),
                                    expectedClosing: lead.expectedClosing || "",
                                    priority: String(lead.priority || ""),
                                    governorate: lead.governorate || "", area: lead.area || "",
                                    notes: lead.notes || "",
                                    plotNumber: lead.plotNumber || "", landArea: String(lead.landArea || ""),
                                  });
                                  setEditActiveTab("basic");
                                  setEditTarget(lead);
                                }}
                              ><Pencil className="w-3 h-3 ml-1" />تعديل</Button>
                              {si === 0 && (
                                <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200"
                                  onClick={async () => {
                                    if (!window.confirm(`هل تريد حذف فرصة "${lead.name}" نهائياً؟`)) return;
                                    await deleteLead.mutateAsync(lead.id);
                                    setSelectedLead(null);
                                    toast.success(`تم حذف فرصة "${lead.name}"`);
                                  }}
                                ><Trash2 className="w-3 h-3 ml-1" />حذف</Button>
                              )}
                            </>)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ==================== Quotation Dialog ==================== */}
      {quotationTarget && (
        <QuotationDialog
          lead={quotationTarget}
          onClose={() => setQuotationTarget(null)}
          onSaved={async (_qid) => {
            const lead = quotationTarget;
            await updateLead.mutateAsync({
              id: lead.id,
              quotations: (lead.quotations || 0) + 1,
              stage: "عرض سعر مرسل",
            });
            setQuotationTarget(null);
            setOpenStage(2);
            setSelectedLead(null);
          }}
        />
      )}

      {/* ==================== View Quote Dialog ==================== */}
      {viewQuoteTarget && (
        <ViewQuoteDialog lead={viewQuoteTarget} onClose={() => setViewQuoteTarget(null)} />
      )}

      {/* ==================== Contract Dialog ==================== */}
      {contractTarget && (
        <ContractDialog
          lead={contractTarget}
          onClose={() => setContractTarget(null)}
          onSaved={async () => {
            setContractTarget(null);
            toast.success("تم إنشاء العقد — يمكنك الآن الضغط على 'تم التعاقد'");
          }}
        />
      )}

      {/* ==================== Edit Opportunity Dialog ==================== */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b">
            <DialogHeader className="p-5 pb-0">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.72 0.10 60)" }}>
                  <Pencil className="w-4 h-4 text-white" />
                </div>
                تعديل الفرصة — {editTarget?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-0 px-5 pt-4">
              {([
                { key: "basic" as const, label: "البيانات الأساسية", icon: User },
                { key: "details" as const, label: "تفاصيل المشروع", icon: Building },
                { key: "notes" as const, label: "ملاحظات", icon: ClipboardList },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setEditActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    editActiveTab === tab.key ? "border-current text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={editActiveTab === tab.key ? { borderColor: "oklch(0.72 0.10 60)" } : {}}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {editActiveTab === "basic" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      اسم العميل <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="أدخل اسم العميل الكامل" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="9XXX XXXX" dir="ltr" className="text-right" value={editForm.phone} onChange={(e) => setEditForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    مصدر العميل
                  </label>
                  <Select value={editForm.source} onValueChange={(v) => setEditForm(p => ({ ...p, source: v, referralName: v !== "إحالة" ? "" : p.referralName }))}>
                    <SelectTrigger><SelectValue placeholder="كيف وصل العميل؟" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="انستغرام">انستغرام</SelectItem>
                      <SelectItem value="جوجل">جوجل</SelectItem>
                      <SelectItem value="إحالة">إحالة من...</SelectItem>
                    </SelectContent>
                  </Select>
                  {editForm.source === "إحالة" && (
                    <Input
                      placeholder="اسم الشخص المحيل..."
                      value={editForm.referralName || ""}
                      onChange={(e) => setEditForm(p => ({ ...p, referralName: e.target.value }))}
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-muted-foreground" />
                    الأولوية
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "1", label: "متوسط", stars: 1 },
                      { value: "2", label: "مرتفع", stars: 2 },
                      { value: "3", label: "مرتفع جداً", stars: 3 },
                    ].map((p) => (
                      <button key={p.value} onClick={() => setEditForm(prev => ({ ...prev, priority: p.value }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                          editForm.priority === p.value ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-border hover:border-yellow-200"
                        }`}>
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= p.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {editActiveTab === "details" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع العقار
                    </label>
                    <Select value={editForm.type} onValueChange={(v) => setEditForm(p => ({ ...p, type: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="سكن خاص">سكن خاص</SelectItem>
                        <SelectItem value="استثماري">استثماري</SelectItem>
                        <SelectItem value="تجاري">تجاري</SelectItem>
                        <SelectItem value="صناعي">صناعي</SelectItem>
                        <SelectItem value="حكومي">حكومي</SelectItem>
                        <SelectItem value="مخازن/شبرات">مخازن / شبرات</SelectItem>
                        <SelectItem value="مساجد">مساجد</SelectItem>
                        <SelectItem value="مزارع">مزارع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع الخدمة
                    </label>
                    <Select value={editForm.serviceType} onValueChange={(v) => setEditForm(p => ({ ...p, serviceType: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع الخدمة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="بناء جديد">بناء جديد</SelectItem>
                        <SelectItem value="هدم">هدم</SelectItem>
                        <SelectItem value="تعديل">تعديل</SelectItem>
                        <SelectItem value="إضافة">إضافة</SelectItem>
                        <SelectItem value="تعديل وإضافة">تعديل وإضافة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      المحافظة
                    </label>
                    <Select value={editForm.governorate} onValueChange={(v) => setEditForm(p => ({ ...p, governorate: v, area: "" }))}>
                      <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(kuwaitGovernorates).map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      المنطقة
                    </label>
                    <Select value={editForm.area} onValueChange={(v) => setEditForm(p => ({ ...p, area: v }))} disabled={!editForm.governorate}>
                      <SelectTrigger><SelectValue placeholder={editForm.governorate ? "اختر المنطقة" : "اختر المحافظة أولاً"} /></SelectTrigger>
                      <SelectContent>
                        {(kuwaitGovernorates[editForm.governorate] || []).map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      الإيرادات المتوقعة (د.ك)
                    </label>
                    <Input type="number" placeholder="0" dir="ltr" className="text-right" value={editForm.expectedRevenue} onChange={(e) => setEditForm(p => ({ ...p, expectedRevenue: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                      احتمالية التعاقد (%)
                    </label>
                    <Input type="number" placeholder="10" min="0" max="100" dir="ltr" className="text-right" value={editForm.probability} onChange={(e) => setEditForm(p => ({ ...p, probability: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      تاريخ الإغلاق المتوقع
                    </label>
                    <Input type="date" dir="ltr" className="text-right" value={editForm.expectedClosing} onChange={(e) => setEditForm(p => ({ ...p, expectedClosing: e.target.value }))} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم القسيمة
                    </label>
                    <Input placeholder="رقم القسيمة" dir="ltr" value={editForm.plotNumber} onChange={(e) => setEditForm(p => ({ ...p, plotNumber: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                      مساحة الأرض (م²)
                    </label>
                    <Input type="number" placeholder="0" dir="ltr" value={editForm.landArea} onChange={(e) => setEditForm(p => ({ ...p, landArea: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {editActiveTab === "notes" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ملاحظات داخلية</label>
                  <Textarea placeholder="أضف ملاحظات عن هذه الفرصة..." rows={5} value={editForm.notes} onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => setEditTarget(null)}>إلغاء</Button>
            <div className="flex gap-2">
              {editActiveTab !== "basic" && (
                <Button variant="outline" onClick={() => setEditActiveTab(editActiveTab === "notes" ? "details" : "basic")}>السابق</Button>
              )}
              {editActiveTab !== "notes" ? (
                <Button onClick={() => setEditActiveTab(editActiveTab === "basic" ? "details" : "notes")} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>التالي</Button>
              ) : (
                <Button
                  disabled={updateLead.isPending}
                  onClick={async () => {
                    if (!editForm.name.trim()) { toast.error("يرجى إدخال اسم العميل"); return; }
                    await updateLead.mutateAsync({
                      id: (editTarget as any).id,
                      name: editForm.name,
                      phone: editForm.phone,
                      source: editForm.source,
                      type: editForm.type,
                      serviceType: editForm.serviceType,
                      governorate: editForm.governorate,
                      area: editForm.area,

                      expectedRevenue: editForm.expectedRevenue || "0",
                      probability: Number(editForm.probability) || 10,
                      priority: Number(editForm.priority) || 0,
                      expectedClosing: editForm.expectedClosing,
                      notes: editForm.notes,
                      plotNumber: editForm.plotNumber,
                      landArea: Number(editForm.landArea) || 0,
                    });
                    setEditTarget(null);
                    setSelectedLead(null);
                    toast.success(`تم تحديث بيانات "${editForm.name}" بنجاح`);
                  }}
                  style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                >
                  {updateLead.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
                  حفظ التعديلات
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== New Opportunity Dialog ==================== */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 bg-background border-b">
            <DialogHeader className="p-5 pb-0">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                  <Plus className="w-4 h-4 text-white" />
                </div>
                فرصة جديدة
              </DialogTitle>
            </DialogHeader>
            <div className="flex gap-0 px-5 pt-4">
              {([
                { key: "basic" as const, label: "البيانات الأساسية", icon: User },
                { key: "details" as const, label: "تفاصيل المشروع", icon: Building },
                { key: "notes" as const, label: "ملاحظات", icon: ClipboardList },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key ? "border-current text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                  style={activeTab === tab.key ? { borderColor: "oklch(0.72 0.10 60)" } : {}}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 space-y-5">
            {activeTab === "basic" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      اسم العميل <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="أدخل اسم العميل الكامل" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <Input placeholder="9XXX XXXX" dir="ltr" className="text-right" value={form.phone} onChange={(e) => handleFormChange("phone", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                    مصدر العميل
                  </label>
                  <Select value={form.source} onValueChange={(v) => handleFormChange("source", v)}>
                    <SelectTrigger><SelectValue placeholder="كيف وصل العميل؟" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="انستغرام">انستغرام</SelectItem>
                      <SelectItem value="جوجل">جوجل</SelectItem>
                      <SelectItem value="إحالة">إحالة من...</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.source === "إحالة" && (
                    <Input
                      placeholder="اسم الشخص المحيل..."
                      value={form.referralName || ""}
                      onChange={(e) => handleFormChange("referralName", e.target.value)}
                      className="mt-1"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-muted-foreground" />
                    الأولوية
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "1", label: "متوسط", stars: 1 },
                      { value: "2", label: "مرتفع", stars: 2 },
                      { value: "3", label: "مرتفع جداً", stars: 3 },
                    ].map((p) => (
                      <button key={p.value} onClick={() => handleFormChange("priority", p.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition-all ${
                          form.priority === p.value ? "border-yellow-400 bg-yellow-50 text-yellow-700" : "border-border hover:border-yellow-200"
                        }`}>
                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= p.stars ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                          ))}
                        </div>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "details" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع العقار
                    </label>
                    <Select value={form.type} onValueChange={(v) => handleFormChange("type", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع العقار" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="سكن خاص">سكن خاص</SelectItem>
                        <SelectItem value="استثماري">استثماري</SelectItem>
                        <SelectItem value="تجاري">تجاري</SelectItem>
                        <SelectItem value="صناعي">صناعي</SelectItem>
                        <SelectItem value="حكومي">حكومي</SelectItem>
                        <SelectItem value="مخازن/شبرات">مخازن / شبرات</SelectItem>
                        <SelectItem value="مساجد">مساجد</SelectItem>
                        <SelectItem value="مزارع">مزارع</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                      نوع الخدمة
                    </label>
                    <Select value={form.serviceType} onValueChange={(v) => handleFormChange("serviceType", v)}>
                      <SelectTrigger><SelectValue placeholder="اختر نوع الخدمة" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="بناء جديد">بناء جديد</SelectItem>
                        <SelectItem value="هدم">هدم</SelectItem>
                        <SelectItem value="تعديل">تعديل</SelectItem>
                        <SelectItem value="إضافة">إضافة</SelectItem>
                        <SelectItem value="تعديل وإضافة">تعديل وإضافة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      المحافظة
                    </label>
                    <Select value={form.governorate} onValueChange={(v) => { handleFormChange("governorate", v); handleFormChange("area", ""); }}>
                      <SelectTrigger><SelectValue placeholder="اختر المحافظة" /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(kuwaitGovernorates).map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      المنطقة
                    </label>
                    <Select
                      value={form.area}
                      onValueChange={(v) => handleFormChange("area", v)}
                      disabled={!form.governorate}>
                      <SelectTrigger><SelectValue placeholder={form.governorate ? "اختر المنطقة" : "اختر المحافظة أولاً"} /></SelectTrigger>
                      <SelectContent>
                        {(kuwaitGovernorates[form.governorate] || []).map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      الإيرادات المتوقعة (د.ك)
                    </label>
                    <Input type="number" placeholder="0" dir="ltr" className="text-right" value={form.expectedRevenue} onChange={(e) => handleFormChange("expectedRevenue", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                      احتمالية التعاقد (%)
                    </label>
                    <Input type="number" placeholder="10" min="0" max="100" dir="ltr" className="text-right" value={form.probability} onChange={(e) => handleFormChange("probability", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      تاريخ الإغلاق المتوقع
                    </label>
                    <Input type="date" dir="ltr" className="text-right" value={form.expectedClosing} onChange={(e) => handleFormChange("expectedClosing", e.target.value)} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم القسيمة
                    </label>
                    <Input placeholder="رقم القسيمة" dir="ltr" value={form.plotNumber} onChange={(e) => handleFormChange("plotNumber", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-muted-foreground" />
                      مساحة الأرض (م²)
                    </label>
                    <Input type="number" placeholder="0" dir="ltr" value={form.landArea} onChange={(e) => handleFormChange("landArea", e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">ملاحظات داخلية</label>
                  <Textarea placeholder="أضف ملاحظات عن هذه الفرصة..." rows={5} value={form.notes} onChange={(e) => handleFormChange("notes", e.target.value)} />
                </div>
                <div className="rounded-lg border p-4 space-y-2">
                  <h4 className="text-sm font-bold">ملخص الفرصة</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">العميل:</span> <span className="font-medium">{form.name || "—"}</span></div>
                    <div><span className="text-muted-foreground">الهاتف:</span> <span className="font-medium" dir="ltr">{form.phone || "—"}</span></div>
                    <div><span className="text-muted-foreground">المصدر:</span> <span className="font-medium">{form.source || "—"}</span></div>
                    <div><span className="text-muted-foreground">نوع العقار:</span> <span className="font-medium">{form.type || "—"}</span></div>
                    <div><span className="text-muted-foreground">نوع الخدمة:</span> <span className="font-medium">{form.serviceType || "—"}</span></div>
                    <div><span className="text-muted-foreground">المحافظة:</span> <span className="font-medium">{form.governorate || "—"}</span></div>
                    <div><span className="text-muted-foreground">المنطقة:</span> <span className="font-medium">{form.area || "—"}</span></div>
                    <div><span className="text-muted-foreground">الإيرادات:</span> <span className="font-medium">{form.expectedRevenue ? `${form.expectedRevenue} د.ك` : "—"}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-background border-t p-4 flex items-center justify-between gap-3">
            <Button variant="outline" onClick={() => { setShowNewDialog(false); setForm(emptyForm); setActiveTab("basic"); }}>إلغاء</Button>
            <div className="flex gap-2">
              {activeTab !== "basic" && (
                <Button variant="outline" onClick={() => setActiveTab(activeTab === "notes" ? "details" : "basic")}>السابق</Button>
              )}
              {activeTab !== "notes" ? (
                <Button onClick={() => setActiveTab(activeTab === "basic" ? "details" : "notes")} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>التالي</Button>
              ) : (
                <Button onClick={handleSubmit} style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الفرصة
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
