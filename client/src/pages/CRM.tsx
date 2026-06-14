/*
 * CRM - Simplified view with collapsible sections
 * Each stage is a clickable button that expands to show leads
 */
import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Building, Percent, Tag, Save, Printer, Download,
  ClipboardList, MessageCircle, Activity, Users, MapPin, Loader2,
  Pencil, Trash2, Eye, CheckCircle, Hash, Ruler, ArrowRightLeft, Archive,
  Clock, UserCheck, CalendarPlus, Bell, Briefcase,
  Upload, CreditCard, ShieldCheck, AlertCircle, ImageIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { kuwaitGovernorates } from "./Clients";
import {
  useCreateQuotation, useUpdateQuotation, useDeleteQuotation, useQuotationsByLead, useQuotations,
  useCrmLeads, useCreateCrmLead, useUpdateCrmLead, useDeleteCrmLead,
  useArchiveCrmLead, useRestoreCrmLead, useArchivedCrmLeads,
  useCreateClient, useCreateProject, useCreateContract, useUpdateContract,
  useCreateInvoice, useContracts, useContractsByLead, useProjects, useContractTemplates,
  useAppointmentsByLead, useCreateAppointment, useDeleteAppointment, useAppointments,
  useEmployees, usePackages,
} from "@/lib/api";
import { exportQuotationPdf, exportContractPdf, downloadQuotationPdf, printQuotationPdf, downloadContractPdf } from "@/lib/pdf";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: string;
  source: string;
  referralName?: string;
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
  parcelNumber?: string;
  landArea?: number;
  assignedTo?: string;
  stage?: string;
  isArchived?: number;
  archivedAt?: string;
  archivedReason?: string;
  // وثائق التوقيع
  civilCardUrl?: string;
  signedContractUrl?: string;
  contractSigningStatus?: string;
}

const stageTemplates = [
  { title: "استفسار جديد",           color: "oklch(0.55 0.15 250)", icon: Users },
  { title: "تم التواصل",             color: "oklch(0.72 0.10 60)",  icon: Phone },
  { title: "عرض سعر مرسل",          color: "oklch(0.60 0.15 280)", icon: FileText },
  { title: "بانتظار التعاقد",        color: "oklch(0.65 0.15 140)", icon: FileText },
  { title: "جارٍ العمل - بدون عقد",  color: "oklch(0.60 0.18 45)",  icon: Briefcase },
  { title: "تم التعاقد",             color: "oklch(0.55 0.15 150)", icon: Trophy },
  { title: "فرص خاسرة",             color: "oklch(0.55 0.15 25)",  icon: X },
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
  notes: "", plotNumber: "", parcelNumber: "", landArea: "", customArea: "",
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
  const [editableFeatures, setEditableFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [editingFeatureIdx, setEditingFeatureIdx] = useState<number | null>(null);
  const [editingFeatureText, setEditingFeatureText] = useState("");

  const { data: dynamicPackages = {} } = usePackages();
  const allFlat = Object.values(dynamicPackages).flat();
  const byType = lead.type ? (dynamicPackages[lead.type] || allFlat) : allFlat;
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

  const handlePrintQuote = async () => {
    if (!selectedPkg) return;
    try {
      const pkgForPdf = {
        ...(agreedPrice.trim() ? { ...selectedPkg, price: agreedPrice.trim() } : selectedPkg),
        features: editableFeatures,
      };
      await exportQuotationPdf(lead, pkgForPdf);
    } catch (err: unknown) {
      const isBlocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(
        isBlocked ? "السماح بالنوافذ المنبثقة مطلوب — اضغط على الأيقونة في شريط العنوان"
        : "فشل فتح نافذة الطباعة"
      );
    }
  };

  const handleDownloadQuote = async () => {
    if (!selectedPkg) return;
    setGenerating(true);
    const tid = toast.loading("جاري تحميل PDF...");
    try {
      const pkgForPdf = {
        ...(agreedPrice.trim() ? { ...selectedPkg, price: agreedPrice.trim() } : selectedPkg),
        features: editableFeatures,
      };
      await downloadQuotationPdf(lead, pkgForPdf);
      toast.success("تم تحميل PDF بنجاح", { id: tid });
    } catch (err) {
      console.error("[PDF Error]", err);
      toast.error("فشل تحميل PDF", { id: tid });
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
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (pkg === selectedPkg) {
                      setSelectedPkg(null);
                      setEditableFeatures([]);
                    } else {
                      setSelectedPkg(pkg);
                      setEditableFeatures([...pkg.features]);
                      setNewFeature("");
                      setEditingFeatureIdx(null);
                    }
                  }}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                      e.preventDefault();
                      if (pkg === selectedPkg) {
                        setSelectedPkg(null);
                        setEditableFeatures([]);
                      } else {
                        setSelectedPkg(pkg);
                        setEditableFeatures([...pkg.features]);
                        setNewFeature("");
                        setEditingFeatureIdx(null);
                      }
                    }
                  }}
                  className={`w-full p-3 rounded-lg border text-right transition-all cursor-pointer ${
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
                    <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="text-xs font-semibold text-right mb-1" style={{ color: "oklch(0.55 0.15 250)" }}>✏️ وصف الخدمات (قابل للتعديل)</div>
                      {editableFeatures.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1">
                          {editingFeatureIdx === fi ? (
                            <>
                              <input
                                className="flex-1 text-xs border rounded px-2 py-1 text-right bg-white text-black"
                                value={editingFeatureText}
                                onChange={e => setEditingFeatureText(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") {
                                    const updated = [...editableFeatures];
                                    updated[fi] = editingFeatureText.trim() || f;
                                    setEditableFeatures(updated);
                                    setEditingFeatureIdx(null);
                                  } else if (e.key === "Escape") {
                                    setEditingFeatureIdx(null);
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                className="text-xs px-2 py-1 rounded bg-green-500 text-white"
                                onClick={() => {
                                  const updated = [...editableFeatures];
                                  updated[fi] = editingFeatureText.trim() || f;
                                  setEditableFeatures(updated);
                                  setEditingFeatureIdx(null);
                                }}
                              >✓</button>
                              <button
                                className="text-xs px-2 py-1 rounded bg-gray-300 text-black"
                                onClick={() => setEditingFeatureIdx(null)}
                              >✕</button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-xs text-right text-muted-foreground">• {f}</span>
                              <button
                                className="text-xs px-1.5 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => { setEditingFeatureIdx(fi); setEditingFeatureText(f); }}
                              >تعديل</button>
                              <button
                                className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-500 hover:bg-red-50"
                                onClick={() => setEditableFeatures(editableFeatures.filter((_, i) => i !== fi))}
                              >حذف</button>
                            </>
                          )}
                        </div>
                      ))}
                      {/* Add new feature */}
                      <div className="flex items-center gap-1 pt-1">
                        <input
                          className="flex-1 text-xs border rounded px-2 py-1 text-right bg-white text-black placeholder:text-gray-400"
                          placeholder="+ أضف خدمة جديدة..."
                          value={newFeature}
                          onChange={e => setNewFeature(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            e.stopPropagation();
                            if (e.key === "Enter" && newFeature.trim()) {
                              setEditableFeatures([...editableFeatures, newFeature.trim()]);
                              setNewFeature("");
                            }
                          }}
                        />
                        <button
                          className="text-xs px-2 py-1 rounded bg-blue-500 text-white disabled:opacity-40"
                          disabled={!newFeature.trim()}
                          onClick={() => {
                            if (newFeature.trim()) {
                              setEditableFeatures([...editableFeatures, newFeature.trim()]);
                              setNewFeature("");
                            }
                          }}
                        >إضافة</button>
                      </div>
                    </div>
                  )}
                </div>
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
                  {editableFeatures.map((f, fi) => (
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
            onClick={async () => {
              if (!selectedPkg) return;
              const q = await createQuotation.mutateAsync({ ...buildQuotationPayload(), status: "مرسل" });
              toast.success("تم حفظ العرض كمرسل");
              onSaved(q.id);
              const phone = (lead.phone || "").replace(/[^0-9]/g, "");
              const msg = encodeURIComponent(`مرحباً ${lead.name}،\nيسعدنا إرسال عرض السعر الخاص بمشروعكم.\nالباقة: ${selectedPkg.name}\nالمبلغ: ${agreedPrice.trim() || selectedPkg.price} د.ك\nنرجو مراجعة العرض والتواصل معنا لأي استفسار.\nشكراً لثقتكم بديناميك للاستشارات الهندسية`);
              const url = `https://wa.me/965${phone}?text=${msg}`;
              const win = window.open(url, "_blank", "noopener,noreferrer");
              if (!win) { window.location.href = url; }
            }}
            style={{ backgroundColor: "#25D366" }}
          >
            {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <MessageCircle className="w-3 h-3 ml-1" />}
            إرسال واتساب
          </Button>
          <Button
            disabled={!selectedPkg || createQuotation.isPending}
            onClick={async () => {
              if (!selectedPkg) return;
              const q = await createQuotation.mutateAsync({ ...buildQuotationPayload(), status: "مقبول" });
              toast.success("تم اعتماد عرض السعر بنجاح ✓");
              onSaved(q.id);
            }}
            style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
          >
            {createQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <CheckCircle className="w-3 h-3 ml-1" />}
            اعتماد العرض
          </Button>
          <Button
            disabled={!selectedPkg}
            onClick={handlePrintQuote}
            variant="outline"
          >
            <Printer className="w-3 h-3 ml-1" />
            طباعة
          </Button>
          <Button
            disabled={!selectedPkg || generating}
            onClick={handleDownloadQuote}
            style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
          >
            {generating ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Download className="w-3 h-3 ml-1" />}
            {generating ? "جاري التحميل..." : "تحميل PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── View Quote Dialog ────────────────────────────────────────────────────
function ViewQuoteDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: quotes, isLoading, refetch } = useQuotationsByLead(lead.id);
  const deleteQuotation = useDeleteQuotation();
  const quote = quotes?.[0];
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    if (!quote) return;
    await deleteQuotation.mutateAsync(quote.id);
    toast.success("تم حذف عرض السعر");
    onClose();
  };

  const [sendingPdf, setSendingPdf] = useState(false);

  const { data: allPkgsDb = {} } = usePackages();

  const buildPkgForPdf = (q: typeof quote) => {
    if (!q) return null;
    const allFlat = Object.values(allPkgsDb).flat();
    const matchedPkg = allFlat.find(p => p.name === q.package);
    // استخدام الخدمات المعدّلة إن وُجدت، وإلا الخدمات الأصلية من الباقة
    let customFeatures: string[] | undefined;
    if (q.featuresJson) {
      try { customFeatures = JSON.parse(q.featuresJson); } catch {}
    }
    if (matchedPkg) {
      return { ...matchedPkg, price: q.amount, ...(customFeatures ? { features: customFeatures } : {}) };
    }
    return { name: q.package, price: q.amount, level: "-", features: customFeatures || [q.service] };
  };

  const handleDownloadPdf = async () => {
    if (!quote) return;
    setSendingPdf(true);
    const tid = toast.loading("جاري إنشاء PDF...");
    try {
      const pkgForPdf = buildPkgForPdf(quote);
      if (!pkgForPdf) throw new Error('no package');
      const leadForPdf = {
        name: lead.name,
        phone: lead.phone,
        type: quote.type,
        serviceType: quote.service,
        governorate: lead.governorate,
        area: lead.area,
      };
      await downloadQuotationPdf(leadForPdf, pkgForPdf);
      toast.success("تم تحميل PDF بنجاح", { id: tid });
    } catch (err) {
      console.error("[PDF Error]", err);
      toast.error("فشل إنشاء PDF", { id: tid });
    } finally {
      setSendingPdf(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!quote) return;
    try {
      const pkgForPdf2 = buildPkgForPdf(quote);
      if (!pkgForPdf2) throw new Error('no package');
      const leadForPdf = {
        name: lead.name,
        phone: lead.phone,
        type: quote.type,
        serviceType: quote.service,
        governorate: lead.governorate,
        area: lead.area,
      };
      await printQuotationPdf(leadForPdf, pkgForPdf2);
    } catch {
      toast.error("فشل فتح نافذة الطباعة");
    }
  };

  const handleSendWhatsApp = async () => {
    if (!quote) return;
    // تحميل PDF أولاً
    setSendingPdf(true);
    const tid = toast.loading("جاري تحميل PDF ثم فتح واتساب...");
    try {
      const allFlat2 = Object.values(allPkgsDb).flat();
      const matchedPkg2 = allFlat2.find(p => p.name === quote.package);
      const pkgForPdf = matchedPkg2
        ? { ...matchedPkg2, price: quote.amount }
        : { name: quote.package, price: quote.amount, level: "-", features: [quote.service] };
      const leadForPdf = {
        name: lead.name,
        phone: lead.phone,
        type: quote.type,
        serviceType: quote.service,
        governorate: lead.governorate,
        area: lead.area,
      };
      await downloadQuotationPdf(leadForPdf, pkgForPdf);
      toast.success("تم تحميل PDF — الآن أرفقه في واتساب", { id: tid });
    } catch {
      toast.dismiss(tid);
    } finally {
      setSendingPdf(false);
    }
    // فتح واتساب على رقم العميل
    const phone = (lead.phone || "").replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(
      `مرحباً ${lead.name}،\nيسعدنا إرسال عرض السعر الخاص بمشروعكم.\nالباقة: ${quote.package}\nالمبلغ: ${quote.amount} د.ك\nتاريخ الانتهاء: ${quote.expiryDate || "—"}\nيرجى مراجعة الملف المرفق.\nشكراً لثقتكم بديناميك للاستشارات الهندسية`
    );
    const url = `https://wa.me/965${phone}?text=${msg}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) window.location.href = url;
  };

  return (
    <>
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">عرض السعر — {lead.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !quote ? (
          <div className="text-center py-8 text-muted-foreground text-sm">لا يوجد عرض سعر مربوط بهذه الفرصة</div>
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

            {/* تأكيد الحذف */}
            {confirmDelete && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="font-semibold text-red-800 mb-2">هل أنت متأكد من حذف عرض السعر؟ لا يمكن التراجع.</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setConfirmDelete(false)}>إلغاء</Button>
                  <Button size="sm" disabled={deleteQuotation.isPending} onClick={handleDelete}
                    style={{ backgroundColor: "oklch(0.55 0.15 25)", color: "white" }}>
                    {deleteQuotation.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Trash2 className="w-3 h-3 ml-1" />}
                    تأكيد الحذف
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 flex-wrap justify-end">
              <Button variant="outline" size="sm" onClick={onClose}>إغلاق</Button>
              <Button variant="outline" size="sm" className="text-red-600 border-red-200"
                onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                حذف العرض
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                <Pencil className="w-3.5 h-3.5 ml-1" />
                تعديل العرض
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintPdf}>
                <Printer className="w-3.5 h-3.5 ml-1" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" disabled={sendingPdf} onClick={handleDownloadPdf}>
                {sendingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <Download className="w-3.5 h-3.5 ml-1" />}
                تحميل PDF
              </Button>
              <Button size="sm" disabled={sendingPdf} onClick={handleSendWhatsApp}
                style={{ backgroundColor: "#25D366", color: "white" }}>
                {sendingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" /> : <MessageCircle className="w-3.5 h-3.5 ml-1" />}
                إرسال واتساب + PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    {/* نافذة التعديل الكاملة — تفتح QuotationEditDialog */}
    {showEditDialog && quote && (
      <QuotationEditDialog
        lead={lead}
        quote={quote}
        onClose={() => setShowEditDialog(false)}
        onSaved={() => { setShowEditDialog(false); refetch(); }}
      />
    )}
    </>
  );
}

// ── Quotation Edit Dialog — نفس نموذج الإنشاء لكن يُحدّث العرض الحالي ──────
function QuotationEditDialog({ lead, quote, onClose, onSaved }: {
  lead: Lead;
  quote: { id: string; amount: string; service: string; package: string; status: string; type: string; expiryDate?: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const updateQuotation = useUpdateQuotation();
  const qc = useQueryClient();
  const { data: dynamicPackages = {} } = usePackages();
  const allFlat = Object.values(dynamicPackages).flat() as PkgType[];

  // تحميل الباقة الحالية من قاعدة البيانات
  const initialPkg = allFlat.find(p => p.name === quote.package) || null;

  const [selectedPkg, setSelectedPkg] = useState<PkgType | null>(initialPkg);
  const [agreedPrice, setAgreedPrice] = useState(quote.amount || "");
  const [editableFeatures, setEditableFeatures] = useState<string[]>(
    initialPkg ? [...initialPkg.features] : [quote.service]
  );
  const [newFeature, setNewFeature] = useState("");
  const [editingFeatureIdx, setEditingFeatureIdx] = useState<number | null>(null);
  const [editingFeatureText, setEditingFeatureText] = useState("");
  const [status, setStatus] = useState(quote.status || "مرسل");
  const [saving, setSaving] = useState(false);

  const byType = lead.type ? (dynamicPackages[lead.type] || allFlat) : allFlat;
  const packages: PkgType[] = lead.serviceType
    ? (byType.filter(p => p.serviceType === lead.serviceType).length > 0
        ? byType.filter(p => p.serviceType === lead.serviceType)
        : byType)
    : byType;

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalAmount = agreedPrice.trim() ? agreedPrice.trim() : (selectedPkg?.price || quote.amount);
      await updateQuotation.mutateAsync({
        id: quote.id,
        amount: finalAmount,
        service: lead.serviceType || quote.service,
        package: selectedPkg?.name || quote.package,
        status,
        type: lead.type || quote.type,
        featuresJson: JSON.stringify(editableFeatures),
      });
      // إبطال query الخاصة بهذه الفرصة مباشرةً
      await qc.invalidateQueries({ queryKey: ["quotations", { leadId: lead.id }] });
      await qc.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("تم تحديث عرض السعر بنجاح");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">تعديل عرض السعر — {lead.name}</DialogTitle>
        </DialogHeader>

        {/* بيانات العميل */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg text-sm">
          <div><span className="text-muted-foreground">الهاتف: </span><span className="font-medium">{lead.phone}</span></div>
          <div><span className="text-muted-foreground">النوع: </span><span className="font-medium">{lead.type}</span></div>
          {lead.serviceType && <div><span className="text-muted-foreground">الخدمة: </span><span className="font-medium">{lead.serviceType}</span></div>}
          {lead.governorate && <div><span className="text-muted-foreground">المحافظة: </span><span className="font-medium">{lead.governorate}</span></div>}
          {lead.area && <div><span className="text-muted-foreground">المنطقة: </span><span className="font-medium">{lead.area}</span></div>}
        </div>

        {/* الحالة */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold">حالة العرض:</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white">
            {["مسودة", "مرسل", "مقبول", "مرفوض", "عقد", "تم التعاقد", "منتهي"].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* السعر المتفق عليه */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <label className="text-sm font-semibold text-amber-800 block mb-1.5">السعر المتفق عليه</label>
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
        </div>

        {/* اختيار الباقة */}
        <div className="space-y-2">
          <h4 className="font-bold text-sm">الباقات المتاحة ({packages.length})</h4>
          {packages.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3 border rounded-lg">لا توجد باقات لهذا النوع/الخدمة</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {packages.map((pkg, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (pkg === selectedPkg) {
                      setSelectedPkg(null);
                      setEditableFeatures([]);
                    } else {
                      setSelectedPkg(pkg);
                      setEditableFeatures([...pkg.features]);
                      setNewFeature("");
                      setEditingFeatureIdx(null);
                    }
                  }}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
                      e.preventDefault();
                      if (pkg === selectedPkg) { setSelectedPkg(null); setEditableFeatures([]); }
                      else { setSelectedPkg(pkg); setEditableFeatures([...pkg.features]); setNewFeature(""); setEditingFeatureIdx(null); }
                    }
                  }}
                  className={`w-full p-3 rounded-lg border text-right transition-all cursor-pointer ${
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
                      {pkg.level !== "-" && <Badge variant="outline" className="text-[10px]">{pkg.level}</Badge>}
                    </div>
                  </div>
                  {selectedPkg === pkg && (
                    <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                      <div className="text-xs font-semibold text-right mb-1" style={{ color: "oklch(0.55 0.15 250)" }}>✏️ وصف الخدمات (قابل للتعديل)</div>
                      {editableFeatures.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1">
                          {editingFeatureIdx === fi ? (
                            <>
                              <input
                                className="flex-1 text-xs border rounded px-2 py-1 text-right bg-white text-black"
                                value={editingFeatureText}
                                onChange={e => setEditingFeatureText(e.target.value)}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                  e.stopPropagation();
                                  if (e.key === "Enter") {
                                    const updated = [...editableFeatures];
                                    updated[fi] = editingFeatureText.trim() || f;
                                    setEditableFeatures(updated);
                                    setEditingFeatureIdx(null);
                                  } else if (e.key === "Escape") { setEditingFeatureIdx(null); }
                                }}
                                autoFocus
                              />
                              <button className="text-xs px-2 py-1 rounded bg-green-500 text-white"
                                onClick={() => { const u = [...editableFeatures]; u[fi] = editingFeatureText.trim() || f; setEditableFeatures(u); setEditingFeatureIdx(null); }}>✓</button>
                              <button className="text-xs px-2 py-1 rounded bg-gray-300 text-black"
                                onClick={() => setEditingFeatureIdx(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-xs text-right text-muted-foreground">• {f}</span>
                              <button className="text-xs px-1.5 py-0.5 rounded border border-blue-300 text-blue-600 hover:bg-blue-50"
                                onClick={() => { setEditingFeatureIdx(fi); setEditingFeatureText(f); }}>تعديل</button>
                              <button className="text-xs px-1.5 py-0.5 rounded border border-red-300 text-red-500 hover:bg-red-50"
                                onClick={() => setEditableFeatures(editableFeatures.filter((_, i) => i !== fi))}>حذف</button>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-1 pt-1">
                        <input
                          className="flex-1 text-xs border rounded px-2 py-1 text-right bg-white text-black placeholder:text-gray-400"
                          placeholder="+ أضف خدمة جديدة..."
                          value={newFeature}
                          onChange={e => setNewFeature(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter" && newFeature.trim()) { setEditableFeatures([...editableFeatures, newFeature.trim()]); setNewFeature(""); } }}
                        />
                        <button
                          className="text-xs px-2 py-1 rounded bg-blue-500 text-white disabled:opacity-40"
                          disabled={!newFeature.trim()}
                          onClick={() => { if (newFeature.trim()) { setEditableFeatures([...editableFeatures, newFeature.trim()]); setNewFeature(""); } }}
                        >إضافة</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* معاينة PDF */}
        {selectedPkg && (
          <div className="border border-gray-300 overflow-hidden bg-white text-black"
            style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", direction: "rtl" }}>
            <div className="px-5 pt-4">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", direction: "rtl", paddingBottom: "8px" }}>
                <img src="/assets/logo-dynamic.jpeg" style={{ width: "56px", height: "auto", objectFit: "contain" }} alt="Dynamic Logo" />
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 900, color: "#000" }}>ديناميك للإستشارات الهندسية</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#000", letterSpacing: "1.5px", marginTop: "3px", fontFamily: "'Space Grotesk',sans-serif" }}>DYNAMIC ENGINEERING CONSULTANTS</div>
                </div>
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #000", margin: "0 0 4px" }} />
              <div style={{ textAlign: "center", fontSize: "9px", color: "#555", paddingBottom: "8px" }}>
                إستشاريون (تصميم وإشراف) - معماري - إنشائي - مباني وإنشاءات - تصميم - إدارة مشاريع
              </div>
            </div>
            <div className="px-5 pb-3">
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
                  {editableFeatures.map((f, fi) => (
                    <div key={fi} style={{ display: "flex", gap: "6px", marginBottom: "4px", fontSize: "10px", color: "#000" }}>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: "10px", color: "#555", border: "1px solid #ccc", padding: "6px" }}>
                هذا العرض ساري لمدة <strong>30 يوماً</strong> من تاريخ الإصدار · {new Date().toISOString().split("T")[0]}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-start pt-2">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            disabled={saving}
            onClick={handleSave}
            style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Save className="w-3 h-3 ml-1" />}
            حفظ التعديلات
          </Button>
        </div>
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

  // خريطة تطابق serviceType بين الفرص والقوالب
  const serviceMatchMap: Record<string, string[]> = {
    "إشراف": ["إشراف"],
    "تعديل وإضافة": ["تعديل وإضافة", "تعديل وإضافة (مسك)"],
    "تعديل": ["تعديل وإضافة", "تعديل وإضافة (مسك)"],
    "إضافة": ["تعديل وإضافة", "تعديل وإضافة (مسك)"],
    "بناء جديد": ["تصميم وترخيص وإشراف", "تصميم وترخيص وإشراف (مسك)"],
    "هدم": ["هدم"],
    "رخصة زراعة": ["رخصة زراعة"],
    "رخصة مظلة": ["رخصة مظلة"],
  };
  const leadService = lead.serviceType || "";
  const leadType = lead.type || "";
  const matchedServices = serviceMatchMap[leadService] || [];
  // فلترة القوالب: تطابق نوع الخدمة + نوع المبنى
  const filteredTemplates = apiTemplates.filter(t => {
    if (matchedServices.length === 0) return true; // لا فلترة إذا لم يُعرَّف نوع الخدمة
    const serviceMatch = matchedServices.includes(t.serviceType || "");
    if (!serviceMatch) return false;
    // فلترة حسب نوع المبنى إذا محدد في الفرصة
    if (leadType && t.buildingType && t.buildingType !== leadType) return false;
    return true;
  });
  // ترتيب: نوع المبنى المطابق أولاً
  const sortedTemplates = [
    ...filteredTemplates.filter(t => t.buildingType === leadType),
    ...filteredTemplates.filter(t => t.buildingType !== leadType),
  ];

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
      // If template has HTML content field, include it; otherwise use structured fields
      const termsText = selectedTemplate
        ? JSON.stringify({
            content: selectedTemplate.content || "",
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
                {sortedTemplates.length === 0 && (
                  <SelectItem value="__none__" disabled>
                    لا توجد قوالب مطابقة لنوع الخدمة
                  </SelectItem>
                )}
                {sortedTemplates.map((t, idx) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    <span className="text-muted-foreground text-xs ml-1">{idx + 1}.</span> {t.name}
                    {t.buildingType === leadType && (
                      <span className="mr-1 text-xs text-emerald-600">✓</span>
                    )}
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
              <Input placeholder="رقم القطعة" value={form.block} onChange={(e) => setForm(p => ({ ...p, block: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" />القسيمة</label>
              <Input placeholder="رقم القسيمة" value={form.plot} onChange={(e) => setForm(p => ({ ...p, plot: e.target.value }))} />
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

// ── Lead Contract Section (shows contract inline after creation) ────────────
function LeadContractSection({
  lead,
  onCreateContract,
  onViewQuote,
  signingBusy,
  onSigned,
  onLeadUpdate,
}: {
  lead: Lead;
  onCreateContract: () => void;
  onViewQuote: () => void;
  signingBusy: boolean;
  onSigned: () => void;
  onLeadUpdate: () => void;
}) {
  const { data: contracts = [] } = useContractsByLead(lead.id);
  const contract = contracts[0];
  const [pdfBusy, setPdfBusy] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [uploadingCivil, setUploadingCivil] = useState(false);
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [signingStatus, setSigningStatus] = useState(lead.contractSigningStatus || "مسودة");
  // ── محرر العقد inline ──
  const [showEditor, setShowEditor] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const updateContract = useUpdateContract();

  // استخراج محتوى HTML من termsText
  const getContractHtml = useCallback(() => {
    if (!contract?.termsText) return "";
    try {
      const parsed = JSON.parse(contract.termsText);
      return parsed.content || parsed.scopeOfWork || "";
    } catch {
      return contract.termsText || "";
    }
  }, [contract]);

  const handleOpenEditor = () => {
    setShowEditor(true);
    // تأخير بسيط لضمان render المحرر قبل تعيين المحتوى
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = getContractHtml();
      }
    }, 50);
  };

  const handleSaveEditor = async () => {
    if (!contract || !editorRef.current) return;
    setEditorSaving(true);
    const tid = toast.loading("جاري حفظ التعديلات...");
    try {
      const newContent = editorRef.current.innerHTML;
      let parsed: Record<string, unknown> = {};
      try { parsed = JSON.parse(contract.termsText || "{}"); } catch {}
      parsed.content = newContent;
      await updateContract.mutateAsync({ id: contract.id, termsText: JSON.stringify(parsed) });
      toast.success("تم حفظ التعديلات بنجاح", { id: tid });
      setShowEditor(false);
      onLeadUpdate();
    } catch {
      toast.error("فشل حفظ التعديلات", { id: tid });
    } finally {
      setEditorSaving(false);
    }
  };

  const execCmd = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const handleContractPdf = async () => {
    if (!contract) return;
    setPdfBusy(true);
    const tid = toast.loading("جاري إنشاء PDF العقد...");
    try {
      await exportContractPdf(contract);
      toast.success("تم فتح نافذة الطباعة", { id: tid });
    } catch (err: unknown) {
      const blocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(
        blocked ? "السماح بالنوافذ المنبثقة مطلوب — اضغط على الأيقونة في شريط العنوان" : "فشل إنشاء PDF",
        { id: tid }
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const handleDownloadContractPdf = async () => {
    if (!contract) return;
    setDownloadBusy(true);
    const tid = toast.loading("جاري تحميل PDF العقد...");
    try {
      await downloadContractPdf(contract);
      toast.success("تم حفظ العقد في جهازك", { id: tid });
    } catch {
      toast.error("فشل تحميل PDF", { id: tid });
    } finally {
      setDownloadBusy(false);
    }
  };

  const handleUploadCivilCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCivil(true);
    const tid = toast.loading("جاري رفع البطاقة المدنية...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/leads/${lead.id}/upload-civil-card`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("فشل الرفع");
      toast.success("تم رفع البطاقة المدنية", { id: tid });
      onLeadUpdate();
    } catch {
      toast.error("فشل رفع البطاقة المدنية", { id: tid });
    } finally {
      setUploadingCivil(false);
      e.target.value = "";
    }
  };

  const handleUploadSignedContract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSigned(true);
    const tid = toast.loading("جاري رفع صورة العقد الموقع...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/leads/${lead.id}/upload-signed-contract`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("فشل الرفع");
      toast.success("تم رفع صورة العقد الموقع", { id: tid });
      onLeadUpdate();
    } catch {
      toast.error("فشل رفع صورة العقد الموقع", { id: tid });
    } finally {
      setUploadingSigned(false);
      e.target.value = "";
    }
  };

  const handleUpdateSigningStatus = async (newStatus: string) => {
    const tid = toast.loading("جاري تحديث الحالة...");
    try {
      const res = await fetch(`/api/leads/${lead.id}/signing-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setSigningStatus(newStatus);
      toast.success(`تم تحديث الحالة إلى: ${newStatus}`, { id: tid });
      onLeadUpdate();
    } catch {
      toast.error("فشل تحديث الحالة", { id: tid });
    }
  };

  // Signing status steps
  const signingSteps = ["مسودة", "جاهز للتوقيع", "موقّع"];
  const currentStepIdx = signingSteps.indexOf(signingStatus);

  const civilCardUrl = lead.civilCardUrl || "";
  const signedContractUrl = lead.signedContractUrl || "";

  return (
    <div className="space-y-2 w-full">
      {contract && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-blue-800 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />العقد المنشأ
            </span>
            <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">{contract.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-1 text-muted-foreground">
            <div><span className="font-medium text-foreground">النوع: </span>{contract.type}</div>
            <div><span className="font-medium text-foreground">المبلغ: </span><span dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{contract.amount} د.ك</span></div>
            <div><span className="font-medium text-foreground">الباقة: </span>{contract.package}</div>
            <div><span className="font-medium text-foreground">التاريخ: </span>{contract.date}</div>
          </div>
        </div>
      )}

      {/* ── وثائق التوقيع ── */}
      <div className="border border-amber-200 bg-amber-50 rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-amber-800 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />وثائق التوقيع والبدء
          </div>

          {/* شريط حالة التوقيع */}
          <div className="flex items-center gap-1 text-[10px]">
            {signingSteps.map((step, idx) => (
              <div key={step} className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdateSigningStatus(step)}
                  className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
                    idx === currentStepIdx
                      ? "bg-amber-500 text-white"
                      : idx < currentStepIdx
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  }`}
                >
                  {step}
                </button>
                {idx < signingSteps.length - 1 && (
                  <span className="text-gray-300">›</span>
                )}
              </div>
            ))}
          </div>

          {/* رفع الوثائق */}
          <div className="grid grid-cols-2 gap-2">
            {/* البطاقة المدنية */}
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                <CreditCard className="w-3 h-3" />البطاقة المدنية
              </div>
              {civilCardUrl ? (
                <div className="flex items-center gap-1">
                  <a href={civilCardUrl} target="_blank" rel="noreferrer"
                    className="text-[10px] text-blue-600 underline flex items-center gap-0.5">
                    <ImageIcon className="w-3 h-3" />عرض
                  </a>
                  <label className="cursor-pointer text-[10px] text-gray-500 hover:text-gray-700">
                    <Upload className="w-3 h-3 inline" />
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadCivilCard} />
                  </label>
                </div>
              ) : (
                <label className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded border border-dashed border-amber-300 text-[10px] text-amber-700 hover:bg-amber-100 ${uploadingCivil ? "opacity-50" : ""}`}>
                  {uploadingCivil ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  رفع
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadCivilCard} disabled={uploadingCivil} />
                </label>
              )}
            </div>

            {/* العقد الموقع */}
            <div className="space-y-1">
              <div className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                <FileText className="w-3 h-3" />العقد الموقع
              </div>
              {signedContractUrl ? (
                <div className="flex items-center gap-1">
                  <a href={signedContractUrl} target="_blank" rel="noreferrer"
                    className="text-[10px] text-blue-600 underline flex items-center gap-0.5">
                    <ImageIcon className="w-3 h-3" />عرض
                  </a>
                  <label className="cursor-pointer text-[10px] text-gray-500 hover:text-gray-700">
                    <Upload className="w-3 h-3 inline" />
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadSignedContract} />
                  </label>
                </div>
              ) : (
                <label className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded border border-dashed border-amber-300 text-[10px] text-amber-700 hover:bg-amber-100 ${uploadingSigned ? "opacity-50" : ""}`}>
                  {uploadingSigned ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  رفع
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleUploadSignedContract} disabled={uploadingSigned} />
                </label>
              )}
            </div>
          </div>

          {/* تحذير إذا لم يكن موقعاً */}
          {signingStatus !== "موقّع" && signedContractUrl && (
            <div className="text-[10px] text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />تأكيد التوقيع: اضغط على "موقّع" في الشريط أعلاه
            </div>
          )}
        </div>

      <div className="flex gap-2 flex-wrap">
        {!contract ? (
          <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
            onClick={onCreateContract}
          ><FileText className="w-3 h-3 ml-1" />إنشاء عقد</Button>
        ) : (
          <>
            <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-300"
              onClick={handleOpenEditor}
            ><Pencil className="w-3 h-3 ml-1" />تعديل العقد</Button>
            <Button size="sm" variant="outline" className="text-xs h-7 text-red-700 border-red-300"
              disabled={pdfBusy}
              onClick={handleContractPdf}
            >
              {pdfBusy
                ? <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                : <FileText className="w-3 h-3 ml-1" />}
              عرض العقد PDF
            </Button>
            <Button size="sm" variant="outline" className="text-xs h-7 text-green-700 border-green-300"
              disabled={downloadBusy}
              onClick={handleDownloadContractPdf}
            >
              {downloadBusy
                ? <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                : <Download className="w-3 h-3 ml-1" />}
              حفظ العقد PDF
            </Button>
          </>
        )}
        <Button size="sm" variant="outline" className="text-xs h-7 text-blue-700 border-blue-300"
          onClick={onViewQuote}
        ><Eye className="w-3 h-3 ml-1" />عرض السعر</Button>

        {/* زر بدء المشروع - يظهر فقط عند حالة موقّع */}
        {signingStatus === "موقّع" ? (
          <Button size="sm" className="text-xs h-7 text-white w-full" style={{ backgroundColor: "oklch(0.50 0.18 150)" }}
            disabled={signingBusy}
            onClick={onSigned}
          >
            {signingBusy ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Briefcase className="w-3 h-3 ml-1" />}
            بدء المشروع
          </Button>
        ) : contract ? (
          <div className="text-[10px] text-gray-500 flex items-center gap-1 w-full">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            لبدء المشروع، ارفع الوثائق وحدّد الحالة كـ "موقّع"
          </div>
        ) : null}
      </div>

      {/* ── محرر العقد inline ── */}
      {showEditor && contract && (
        <div className="border border-blue-300 bg-white rounded-lg p-3 space-y-2 mt-2">
          {/* شريط أدوات التنسيق */}
          <div className="flex flex-wrap gap-1 border-b pb-2">
            <span className="text-[10px] font-semibold text-blue-800 flex items-center gap-1 ml-auto">
              <Pencil className="w-3 h-3" />تعديل محتوى العقد
            </span>
            <button onClick={() => execCmd("bold")} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100 font-bold">ب</button>
            <button onClick={() => execCmd("italic")} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100 italic">i</button>
            <button onClick={() => execCmd("underline")} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100 underline">u</button>
            <button onClick={() => execCmd("insertOrderedList")} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100">قائمة مرقمة</button>
            <button onClick={() => execCmd("insertUnorderedList")} className="px-2 py-0.5 text-[10px] border rounded hover:bg-gray-100">• قائمة</button>
            <button
              onClick={() => {
                const para = document.createElement("p");
                para.innerHTML = "بند جديد: أضف نصك هنا";
                editorRef.current?.appendChild(para);
                editorRef.current?.focus();
              }}
              className="px-2 py-0.5 text-[10px] border rounded hover:bg-green-100 text-green-700"
            >+ بند</button>
          </div>

          {/* منطقة التحرير */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dir="rtl"
            className="min-h-[200px] max-h-[400px] overflow-y-auto text-xs p-2 border rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
            style={{ fontFamily: "'Noto Naskh Arabic', Arial, sans-serif", lineHeight: "2" }}
          />

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowEditor(false)}>
              <X className="w-3 h-3 ml-1" />إلغاء
            </Button>
            <Button size="sm" className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={editorSaving}
              onClick={handleSaveEditor}
            >
              {editorSaving ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Save className="w-3 h-3 ml-1" />}
              حفظ التعديلات
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── قائمة موظفي المكتب ──────────────────────────────────────────────────────
const officeStaff = [
  "م. مصطفى",
  "م. خالد",
  "م. أمين",
  "م. ناهد",
  "محمد ثروت",
  "عرفان",
  "عفيف",
];

// ── أسباب الموعد الجاهزة ─────────────────────────────────────────────────────
const appointmentReasons = [
  "زيارة الموقع",
  "اجتماع مع العميل",
  "توقيع العقد",
  "عرض التصميم",
  "متابعة المشروع",
  "تسليم المستندات",
  "استلام الدفعة",
  "معاينة أولية",
  "أخرى",
];

function AppointmentDialog({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const createAppointment = useCreateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const { data: appointments = [], isLoading } = useAppointmentsByLead(lead.id);
  const { data: employees = [] } = useEmployees();
  const activeEmployees = employees.filter((e: any) => e.isActive !== 0);
  const [form, setForm] = useState({
    date: "",
    time: "",
    reason: "",
    customReason: "",
    notes: "",
    assignedTo: "",
  });
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    if (!form.date || !form.reason) {
      toast.error("يرجى تحديد التاريخ والسبب");
      return;
    }
    setBusy(true);
    try {
      const finalReason = form.reason === "أخرى" ? form.customReason : form.reason;
      await createAppointment.mutateAsync({
        leadId: lead.id,
        clientId: null,
        clientName: lead.name,
        clientPhone: lead.phone || "",
        date: form.date,
        time: form.time,
        reason: finalReason,
        notes: form.notes || "",
        assignedTo: form.assignedTo || "",
        status: "scheduled",
      });
      toast.success("تم حجز الموعد بنجاح");
      setForm({ date: "", time: "", reason: "", customReason: "", notes: "", assignedTo: "" });
    } catch {
      toast.error("فشل حجز الموعد");
    } finally {
      setBusy(false);
    }
  };

  const sendWhatsApp = (appt: any) => {
    const phone = `965${(lead.phone || "").replace(/\s/g, "")}`;
    const dateStr = new Date(appt.date).toLocaleDateString("ar-KW", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const timeStr = appt.time ? ` الساعة ${appt.time}` : "";
    const assignedStr = appt.assignedTo ? `\nالمسؤول: ${appt.assignedTo}` : "";
    const msg = `السيد / ${lead.name} المحترم،\n\nتحية طيبة وبعد،\n\nيسعدنا في مكتب ديناميك للاستشارات الهندسية تذكيركم بموعدكم المحدد وفق التفاصيل التالية:\n\n📅 التاريخ: ${dateStr}\n⏰ الوقت: ${timeStr.replace(" الساعة ", "")}\n📋 نوع الاجتماع: ${appt.reason}${assignedStr}\n\nنتشرف بلقائكم في الموعد المحدد، ونأمل أن يكون اللقاء مثمراً.\n\nللاستفسار أو تعديل الموعد، يرجى التواصل معنا:\n📞 22091228 - 50855599\n📧 Info@DynamicSaud.com\n\nمع خالص التقدير والاحترام،\nمكتب ديناميك للاستشارات الهندسية`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-orange-500" />
            مواعيد — {lead.name}
          </DialogTitle>
        </DialogHeader>

        {/* نموذج موعد جديد */}
        <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
          <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />حجز موعد جديد
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">التاريخ *</label>
              <Input type="date" dir="ltr" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">الوقت</label>
              <Input type="time" dir="ltr" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">سبب الموعد *</label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="اختر سبب الموعد..." />
              </SelectTrigger>
              <SelectContent>
                {appointmentReasons.map(r => (
                  <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.reason === "أخرى" && (
              <Input className="mt-1.5 text-sm" placeholder="اكتب سبب الموعد..." value={form.customReason} onChange={e => setForm(f => ({ ...f, customReason: e.target.value }))} />
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">المسؤول</label>
            <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="اختر المسؤول..." />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.length > 0
                  ? activeEmployees.map((e: any) => (
                      <SelectItem key={e.id} value={e.name} className="text-sm">{e.name}</SelectItem>
                    ))
                  : officeStaff.map(s => (
                      <SelectItem key={s} value={s} className="text-sm">{s}</SelectItem>
                    ))
                }
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">ملاحظات</label>
            <Textarea placeholder="ملاحظات إضافية..." rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="text-sm" />
          </div>
          <Button onClick={handleSave} disabled={busy} className="w-full text-sm" style={{ backgroundColor: "oklch(0.65 0.15 50)" }}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
            حفظ الموعد
          </Button>
        </div>

        {/* قائمة المواعيد السابقة */}
        <div className="space-y-2">
          <h4 className="text-sm font-bold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            المواعيد المحجوزة
          </h4>
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : appointments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">لا توجد مواعيد محجوزة</p>
          ) : (
            appointments.map((appt: any) => (
              <div key={appt.id} className="p-3 rounded-lg border bg-card space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-orange-500" />
                        {new Date(appt.date).toLocaleDateString("ar-KW", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}
                      </span>
                      {appt.time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />{appt.time}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium">{appt.reason}</p>
                    {appt.assignedTo && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />{appt.assignedTo}
                      </p>
                    )}
                    {appt.notes && <p className="text-[11px] text-muted-foreground">{appt.notes}</p>}
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => deleteAppointment.mutateAsync(appt.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {/* زر واتساب تذكير */}
                <Button size="sm" variant="outline" className="w-full text-xs h-7 text-green-700 border-green-200 hover:bg-green-50"
                  onClick={() => sendWhatsApp(appt)}>
                  <MessageCircle className="w-3 h-3 ml-1" />
                  إرسال تذكير واتساب للعميل
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CRM() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: leadsData } = useCrmLeads();
  const { data: contractsData } = useContracts();
  const { data: allProjects = [] } = useProjects();
  const { data: allQuotations = [] } = useQuotations();
  const createLead = useCreateCrmLead();
  const updateLead = useUpdateCrmLead();
  const deleteLead = useDeleteCrmLead();
  const archiveLead = useArchiveCrmLead();
  const restoreLead = useRestoreCrmLead();
  const { data: archivedLeads = [] } = useArchivedCrmLeads();
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
    const [appointmentTarget, setAppointmentTarget] = useState<Lead | null>(null);
  const [showArchive, setShowArchive] = useState(false);
  const [wonDialogLead, setWonDialogLead] = useState<Lead | null>(null);
  const { data: allAppointments = [] } = useAppointments();
  // Build a Set of leadIds that have upcoming appointments
  const leadsWithAppointments = new Set(
    allAppointments
      .filter(a => a.leadId && a.status !== 'ملغي')
      .map(a => a.leadId)
  );
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

      // نقل وثائق التوقيع إلى مستندات المشروع
      const now2 = new Date().toISOString();
      if (lead.civilCardUrl) {
        await fetch("/api/upload-from-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: lead.civilCardUrl,
            clientId: client.id,
            projectId,
            name: `بطاقة مدنية - ${lead.name}`,
            category: "وثائق العقد",
          }),
        }).catch(() => null);
      }
      if (lead.signedContractUrl) {
        await fetch("/api/upload-from-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: lead.signedContractUrl,
            clientId: client.id,
            projectId,
            name: `عقد موقّع - ${lead.name}`,
            category: "وثائق العقد",
          }),
        }).catch(() => null);
      }
      void now2;

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
      toast.success(`🎉 تم قبول العقد مع "${lead.name}" — جاري فتح المشروع...`);
      // الانتقال التلقائي لصفحة المشروع
      setTimeout(() => navigate(`/projects/${projectId}`), 800);
    } catch (err) {
      toast.error("حدث خطأ أثناء إتمام التعاقد — تحقق من البيانات وحاول مجدداً");
      console.error(err);
    } finally {
      setSigningBusy(false);
    }
  };

  // ── بدء العمل بدون عقد (للأدمن) ──────────────────────────────────────────
  const handleStartWithoutContract = async (lead: Lead) => {
    setSigningBusy(true);
    try {
      const now = new Date().toISOString().slice(0, 10);
      const clientId = `C${Date.now().toString(36).toUpperCase()}`;

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
        rating: 3,
        createdAt: now,
        projectType: lead.type || "",
        serviceType: lead.serviceType || "",
        leadId: lead.id,
        totalContractsValue: 0,
        totalPaid: 0,
        totalRemaining: 0,
        notes: (lead.notes || "") + (lead.notes ? " | " : "") + "تم بدء العمل قبل إتمام التعاقد",
        civilId: lead.civilId || "",
        email: "",
        ownershipDoc: "",
        ownershipDate: "",
        spouseName: "",
        spouseCivilId: "",
        phone2: "",
        parcelShape: "",
        parcelFacing: "",
      });

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
        contractId: "",
        leadId: lead.id,
        status: "جارٍ العمل - بدون عقد",
        phases: defaultPhases as unknown[],
      });

      await fetch(`/api/projects/${projectId}/auto-tasks`, { method: "POST" }).catch(() => null);
      await updateLead.mutateAsync({ id: lead.id, stage: "جارٍ العمل - بدون عقد" });

      setSelectedLead(null);
      setOpenStage(stageTemplates.findIndex((s) => s.title === "جارٍ العمل - بدون عقد"));
      toast.success(`⚡ تم بدء العمل مع "${lead.name}" — المشروع مؤقت (بدون عقد)`);
    } catch (err) {
      toast.error("حدث خطأ أثناء بدء العمل — تحقق من البيانات");
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
      area: form.area === "أخرى" && form.customArea.trim() ? form.customArea.trim() : form.area,

      expectedRevenue: form.expectedRevenue || "0",
      probability: Number(form.probability) || 10,
      priority: Number(form.priority) || 0,
      expectedClosing: form.expectedClosing,
      notes: form.notes,
      plotNumber: form.plotNumber,
      parcelNumber: form.parcelNumber || "",
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowArchive(true)} className="text-amber-700 border-amber-300">
            <Archive className="w-4 h-4 ml-2" />
            الأرشيف ({archivedLeads.length})
          </Button>
          <Button onClick={() => setShowNewDialog(true)} style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            <Plus className="w-4 h-4 ml-2" />
            فرصة جديدة
          </Button>
        </div>
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
                            {leadsWithAppointments.has(lead.id) && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                                <Calendar className="w-2.5 h-2.5" />موعد
                              </span>
                            )}
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
                            {lead.plotNumber && (
                              <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">قسيمة:</span>
                                <span dir="ltr">{lead.plotNumber}</span>
                              </div>
                            )}
                            {lead.parcelNumber && (
                              <div className="flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">قطعة:</span>
                                <span dir="ltr">{lead.parcelNumber}</span>
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

                          {/* Stage Mover — always visible */}
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" />نقل إلى:</span>
                            <Select
                              value={lead.stage || stage.title}
                              onValueChange={async (newStage) => {
                                if (newStage === (lead.stage || stage.title)) return;
                                await updateLead.mutateAsync({ id: lead.id, stage: newStage });
                                const idx = stageTemplates.findIndex(s => s.title === newStage);
                                if (idx >= 0) setOpenStage(idx);
                                setSelectedLead(null);
                                toast.success(`"‏${lead.name}‏" → ${newStage}`);
                              }}
                            >
                              <SelectTrigger className="h-6 text-[11px] w-auto min-w-[130px] border-dashed">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stageTemplates.map((s) => (
                                  <SelectItem key={s.title} value={s.title} className="text-xs">
                                    {s.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                              <Button size="sm" variant="outline" className="text-xs h-7 text-orange-600 border-orange-200"
                                onClick={() => setAppointmentTarget(lead)}
                              ><CalendarPlus className="w-3 h-3 ml-1" />حجز موعد</Button>
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
                                onClick={() => setWonDialogLead(lead)}
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
                            {si === 3 && (
                              <div className="space-y-2 w-full">
                                <LeadContractSection lead={lead} onCreateContract={() => setContractTarget(lead)} onViewQuote={() => setViewQuoteTarget(lead)} signingBusy={signingBusy} onSigned={() => handleContractSigned(lead)} onLeadUpdate={() => queryClient.invalidateQueries({ queryKey: ['crm-leads'] })} />
                                <div className="border-t pt-2">
                                  <p className="text-[10px] text-muted-foreground mb-1.5">أو ابدأ العمل فوراً وأتمم التعاقد لاحقاً:</p>
                                  <Button size="sm" variant="outline" className="text-xs h-7 text-orange-700 border-orange-300 w-full"
                                    disabled={signingBusy}
                                    onClick={() => handleStartWithoutContract(lead)}
                                  >
                                    {signingBusy ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Briefcase className="w-3 h-3 ml-1" />}
                                    ⚡ بدء العمل بدون عقد
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* ── Stage 4: جارٍ العمل - بدون عقد ── */}
                            {si === 4 && (
                              <div className="space-y-2 w-full">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-xs">
                                  <p className="font-semibold text-orange-800 flex items-center gap-1 mb-1">
                                    <Briefcase className="w-3.5 h-3.5" />جارٍ العمل — بدون عقد
                                  </p>
                                  <p className="text-orange-700">تم إنشاء المشروع مؤقتاً. يرجى إتمام التعاقد لتفعيل كافة الخدمات.</p>
                                </div>
                                <Button size="sm" className="text-xs h-7 text-white w-full" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
                                  disabled={signingBusy}
                                  onClick={() => handleContractSigned(lead)}
                                >
                  {signingBusy ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <CheckCircle className="w-3 h-3 ml-1" />}
                  تم قبول العقد وفتح مشروع
                </Button>
                              </div>
                            )}

                            {/* ── Stage 5: تم التعاقد (archived) ── */}
                            {si === 5 && (
                              <span className="text-xs text-muted-foreground italic">مكتمل — تم نقله للعملاء</span>
                            )}

                            {/* ── Stage 6: فرص خاسرة ── */}
                            {si === 6 && (<>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-blue-600 border-blue-200"
                                onClick={async () => {
                                  await updateLead.mutateAsync({ id: lead.id, stage: "استفسار جديد" });
                                  setOpenStage(0); setSelectedLead(null);
                                  toast.success(`"${lead.name}" → استفسار جديد (استعادة)`);
                                }}
                              ><ChevronUp className="w-3 h-3 ml-1" />استعادة</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-amber-600 border-amber-200"
                                onClick={async () => {
                                  if (!window.confirm(`هل تريد أرشفة فرصة "${lead.name}"\u061f يمكن استعادتها لاحقاً.`)) return;
                                  await archiveLead.mutateAsync({ id: lead.id });
                                  setSelectedLead(null);
                                  toast.success(`تم أرشفة فرصة "${lead.name}"`);
                                }}
                              ><Archive className="w-3 h-3 ml-1" />أرشفة</Button>
                            </>)}

                            {/* Edit + Archive always visible except archived/lost */}
                            {si < 5 && (<>
                              <Button size="sm" variant="outline" className="text-xs h-7"
                                onClick={() => {
                                  setEditForm({
                                    name: lead.name || "", phone: lead.phone || "",
                                    type: lead.type || "", serviceType: lead.serviceType || "",
                                    source: lead.source || "", referralName: lead.referralName || "", expectedRevenue: lead.expectedRevenue || "",
                                    probability: String(lead.probability || ""),
                                    expectedClosing: lead.expectedClosing || "",
                                    priority: String(lead.priority || ""),
                                    governorate: lead.governorate || "",
                                    area: (() => {
                                      const govAreas = kuwaitGovernorates[lead.governorate || ""] || [];
                                      return govAreas.includes(lead.area || "") ? (lead.area || "") : (lead.area ? "أخرى" : "");
                                    })(),
                                    notes: lead.notes || "",
                                    plotNumber: lead.plotNumber || "", parcelNumber: lead.parcelNumber || "", landArea: String(lead.landArea || ""),
                                    customArea: (() => {
                                      const govAreas = kuwaitGovernorates[lead.governorate || ""] || [];
                                      return govAreas.includes(lead.area || "") ? "" : (lead.area || "");
                                    })(),
                                  });
                                  setEditActiveTab("basic");
                                  setEditTarget(lead);
                                }}
                              ><Pencil className="w-3 h-3 ml-1" />تعديل</Button>
                              <Button size="sm" variant="outline" className="text-xs h-7 text-amber-600 border-amber-200"
                                onClick={async () => {
                                  if (!window.confirm(`هل تريد أرشفة فرصة "${lead.name}"\u061f يمكن استعادتها لاحقاً.`)) return;
                                  await archiveLead.mutateAsync({ id: lead.id });
                                  setSelectedLead(null);
                                  toast.success(`تم أرشفة فرصة "${lead.name}"`);
                                }}
                              ><Archive className="w-3 h-3 ml-1" />أرشفة</Button>
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

      {/* ==================== Appointment Dialog ==================== */}
      {appointmentTarget && (
        <AppointmentDialog lead={appointmentTarget} onClose={() => setAppointmentTarget(null)} />
      )}

      {/* ==================== Contract Dialog ==================== */}
      {contractTarget && (
        <ContractDialog
          lead={contractTarget}
          onClose={() => setContractTarget(null)}
          onSaved={async () => {
            setContractTarget(null);
            toast.success("تم إنشاء العقد — يمكنك الآن الضغط على 'تم قبول العقد وفتح مشروع'");
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
                        <SelectItem value="إضافة مبنى قائم">إضافة مبنى قائم</SelectItem>
                        <SelectItem value="إضافة مبنى قائم بدون ترخيص">إضافة مبنى قائم بدون ترخيص</SelectItem>
                        <SelectItem value="إشراف">إشراف</SelectItem>
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
                    <Select value={editForm.area} onValueChange={(v) => setEditForm(p => ({ ...p, area: v, customArea: v !== "أخرى" ? "" : (p.customArea || "") }))} disabled={!editForm.governorate}>
                      <SelectTrigger><SelectValue placeholder={editForm.governorate ? "اختر المنطقة" : "اختر المحافظة أولاً"} /></SelectTrigger>
                      <SelectContent>
                        {(kuwaitGovernorates[editForm.governorate] || []).map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {editForm.area === "أخرى" && (
                      <Input
                        value={(editForm as any).customArea || ""}
                        onChange={(e) => setEditForm(p => ({ ...p, customArea: e.target.value } as any))}
                        placeholder="اكتب اسم المنطقة..."
                        className="mt-1 text-right text-sm"
                        autoFocus
                      />
                    )}
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
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم القطعة
                    </label>
                    <Input placeholder="رقم القطعة" dir="ltr" value={editForm.parcelNumber || ""} onChange={(e) => setEditForm(p => ({ ...p, parcelNumber: e.target.value }))} />
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
                      referralName: editForm.referralName || "",
                      type: editForm.type,
                      serviceType: editForm.serviceType,
                      governorate: editForm.governorate,
                      area: editForm.area === "أخرى" && (editForm as any).customArea?.trim() ? (editForm as any).customArea.trim() : editForm.area,

                      expectedRevenue: editForm.expectedRevenue || "0",
                      probability: Number(editForm.probability) || 10,
                      priority: Number(editForm.priority) || 0,
                      expectedClosing: editForm.expectedClosing,
                      notes: editForm.notes,
                      plotNumber: editForm.plotNumber,
                      parcelNumber: editForm.parcelNumber || "",
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
                        <SelectItem value="إضافة مبنى قائم">إضافة مبنى قائم</SelectItem>
                        <SelectItem value="إضافة مبنى قائم بدون ترخيص">إضافة مبنى قائم بدون ترخيص</SelectItem>
                        <SelectItem value="إشراف">إشراف</SelectItem>
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
                      onValueChange={(v) => { handleFormChange("area", v); if (v !== "أخرى") handleFormChange("customArea", ""); }}
                      disabled={!form.governorate}>
                      <SelectTrigger><SelectValue placeholder={form.governorate ? "اختر المنطقة" : "اختر المحافظة أولاً"} /></SelectTrigger>
                      <SelectContent>
                        {(kuwaitGovernorates[form.governorate] || []).map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.area === "أخرى" && (
                      <Input
                        value={form.customArea}
                        onChange={(e) => handleFormChange("customArea", e.target.value)}
                        placeholder="اكتب اسم المنطقة..."
                        className="mt-1 text-right text-sm"
                        autoFocus
                      />
                    )}
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
                      <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                      رقم القطعة
                    </label>
                    <Input placeholder="رقم القطعة" dir="ltr" value={form.parcelNumber || ""} onChange={(e) => handleFormChange("parcelNumber", e.target.value)} />
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

      {/* ===== Won Dialog ===== */}
      {wonDialogLead && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setWonDialogLead(null); }}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-yellow-500" />
                تهانينا! تم الفوز بالعقد 🎉
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-right">
                <p className="font-semibold text-green-800 mb-1">العميل: {wonDialogLead.name}</p>
                <p className="text-green-700">الخطوة التالية: طلب الأوراق المطلوبة لتجهيز العقد ودراسة المخططات</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-right">الأوراق المطلوبة:</p>
                <ul className="text-sm text-right space-y-1 text-muted-foreground">
                  <li>📄 وثيقة الملكية</li>
                  <li>🪪 البطاقة المدنية للملاك</li>
                  <li>🏗️ رخصة البناء (إن وُجدت)</li>
                  <li>📐 المخطط المرخص</li>
                </ul>
              </div>

              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-xs font-semibold text-right mb-2 text-muted-foreground">رسالة واتساب جاهزة:</p>
                <p className="text-sm text-right leading-relaxed" dir="rtl">
                  السلام عليكم {wonDialogLead.name} 👋
                  <br />بناءً على موافقتكم على عرض السعر، نحتاج منكم الأوراق التالية لتجهيز العقد ودراسة المخططات:
                  <br />1️⃣ وثيقة الملكية
                  <br />2️⃣ البطاقة المدنية للملاك
                  <br />3️⃣ رخصة البناء (إن وُجدت)
                  <br />4️⃣ المخطط المرخص
                  <br />شكراً لثقتكم 🙏
                </p>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => {
                    const msg = encodeURIComponent(
                      `السلام عليكم ${wonDialogLead.name} 👋\nبناءً على موافقتكم على عرض السعر، نحتاج منكم الأوراق التالية لتجهيز العقد ودراسة المخططات:\n1️⃣ وثيقة الملكية\n2️⃣ البطاقة المدنية للملاك\n3️⃣ رخصة البناء (إن وُجدت)\n4️⃣ المخطط المرخص\nشكراً لثقتكم 🙏`
                    );
                    const phone = wonDialogLead.phone.replace(/[^0-9]/g, "");
                    const intlPhone = phone.startsWith("965") ? phone : `965${phone}`;
                    window.open(`https://wa.me/${intlPhone}?text=${msg}`, "_blank");
                  }}
                >
                  <MessageCircle className="w-4 h-4 ml-1" />
                  إرسال عبر واتساب
                </Button>
                <Button
                  className="flex-1"
                  onClick={async () => {
                    await updateLead.mutateAsync({ id: wonDialogLead.id, stage: "بانتظار التعاقد" });
                    setWonDialogLead(null);
                    setSelectedLead(null);
                    toast.success(`🏆 "${wonDialogLead.name}" → بانتظار التعاقد`);
                  }}
                >
                  <Trophy className="w-4 h-4 ml-1" />
                  تأكيد الفوز
                </Button>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setWonDialogLead(null)}>إلغاء</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ===== Archive Dialog ===== */}
      <Dialog open={showArchive} onOpenChange={setShowArchive}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-amber-600" />
              أرشيف الفرص ({archivedLeads.length})
            </DialogTitle>
          </DialogHeader>
          {archivedLeads.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Archive className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد فرص مؤرشفة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archivedLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{lead.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{lead.stage}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <div>هاتف: {lead.phone} · نوع: {lead.type}</div>
                        <div>تاريخ الأرشفة: {lead.archivedAt || "—"}</div>
                        {lead.archivedReason && <div>السبب: {lead.archivedReason}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-green-700 border-green-300"
                        onClick={async () => {
                          await restoreLead.mutateAsync(lead.id);
                          toast.success(`تم استعادة فرصة "${lead.name}"`);
                        }}
                      >
                        <ChevronUp className="w-3 h-3 ml-1" />استعادة
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={async () => {
                          if (!window.confirm(`هل تريد حذف فرصة "${lead.name}" نهائياً؟`)) return;
                          await deleteLead.mutateAsync(lead.id);
                          toast.success(`تم حذف فرصة "${lead.name}" نهائياً`);
                        }}
                      >
                        <Trash2 className="w-3 h-3 ml-1" />حذف
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
