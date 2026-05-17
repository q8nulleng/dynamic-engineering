/*
 * Payments & Invoicing — الدفعات والفواتير
 * Section 9 of FULL_SYSTEM_METHODOLOGY.md
 */
import { useState } from "react";
import { toast } from "sonner";
import { useInvoices, useCreateInvoice, useUpdateInvoice, useProjects, useContracts } from "@/lib/api";
import { exportInvoicePdf } from "@/lib/pdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  CreditCard, Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle, Receipt,
  Send, Download, ChevronDown, ChevronUp, FileText, Loader2, X, Banknote
} from "lucide-react";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  "مسودة":           { color: "text-gray-600",   bg: "bg-gray-100",   label: "مسودة"          },
  "مُرسلة":          { color: "text-blue-700",   bg: "bg-blue-50",    label: "مُرسلة"         },
  "مدفوعة جزئياً":  { color: "text-amber-700",  bg: "bg-amber-50",   label: "مدفوعة جزئياً" },
  "مدفوعة":          { color: "text-green-700",  bg: "bg-green-50",   label: "مدفوعة"          },
  "متأخرة":          { color: "text-red-700",    bg: "bg-red-50",     label: "متأخرة"          },
  "ملغاة":           { color: "text-gray-400",   bg: "bg-gray-50",    label: "ملغاة"           },
};

const PAYMENT_METHODS = ["نقدي", "تحويل بنكي", "K-Net", "شيك"];
const PAYMENT_TYPES   = ["أولى", "ثانية", "ثالثة", "أخرى"];

/* ─── نافذة دفعة جديدة ─── */
interface NewInvoiceForm {
  client: string; projectId: string; contractId: string;
  paymentType: string; subtotal: string; dueDate: string; notes: string;
}

const emptyForm: NewInvoiceForm = {
  client: "", projectId: "", contractId: "",
  paymentType: "أولى", subtotal: "", dueDate: "", notes: "",
};

function NewInvoiceDialog({ onClose }: { onClose: () => void }) {
  const { data: projects = [] } = useProjects();
  const { data: contracts = [] } = useContracts();
  const createInvoice = useCreateInvoice();
  const [form, setForm] = useState<NewInvoiceForm>(emptyForm);

  const set = (k: keyof NewInvoiceForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = () => {
    if (!form.client || !form.subtotal) {
      toast.error("العميل والمبلغ مطلوبان");
      return;
    }
    const sub = parseFloat(form.subtotal) || 0;
    const today = new Date().toISOString().slice(0, 10);
    const due = form.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);
    const selectedProject = projects.find(p => p.id === form.projectId);

    createInvoice.mutate(
      {
        client: form.client,
        project: selectedProject?.name || "",
        projectId: form.projectId || null,
        contractId: form.contractId || undefined,
        paymentType: form.paymentType,
        subtotal: sub,
        taxRate: 0,
        taxAmount: 0,
        total: sub,
        dueDate: due,
        date: today,
        status: "مسودة",
        notes: form.notes,
        lines: [{ product: "خدمات هندسية", description: `دفعة ${form.paymentType}`, quantity: 1, price: sub, taxPercent: 0, total: sub }] as Parameters<typeof createInvoice.mutate>[0]["lines"],
      },
      {
        onSuccess: (inv) => { toast.success(`تم إنشاء الفاتورة ${inv.invoiceNumber}`); onClose(); },
        onError: () => toast.error("فشل إنشاء الفاتورة"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">فاتورة جديدة</h3>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1">العميل *</Label>
            <Input value={form.client} onChange={e => set("client", e.target.value)} placeholder="اسم العميل" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1">المشروع</Label>
              <Select value={form.projectId} onValueChange={v => {
                const proj = projects.find(p => p.id === v);
                set("projectId", v);
                if (proj && !form.client) set("client", proj.client);
              }}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="اختر مشروعاً" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1">العقد</Label>
              <Select value={form.contractId} onValueChange={v => set("contractId", v)}>
                <SelectTrigger className="text-xs"><SelectValue placeholder="اختر عقداً" /></SelectTrigger>
                <SelectContent>
                  {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.id} — {c.client}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1">نوع الدفعة</Label>
              <Select value={form.paymentType} onValueChange={v => set("paymentType", v)}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1">المبلغ (د.ك) *</Label>
              <Input type="number" min="0" step="0.001" value={form.subtotal} onChange={e => set("subtotal", e.target.value)} placeholder="0.000" />
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1">تاريخ الاستحقاق</Label>
            <Input type="date" value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs mb-1">ملاحظات</Label>
            <Input value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="أي ملاحظات إضافية" />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button className="flex-1 text-white" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
            onClick={handleSubmit} disabled={createInvoice.isPending}>
            {createInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Plus className="w-4 h-4 ml-1" />}
            إنشاء الفاتورة
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── نافذة تسجيل دفعة ─── */
function RecordPaymentDialog({ invoiceId, invoiceNum, onClose }: { invoiceId: string; invoiceNum: string; onClose: () => void }) {
  const updateInvoice = useUpdateInvoice();
  const [method, setMethod] = useState("نقدي");

  const handleConfirm = () => {
    updateInvoice.mutate(
      { id: invoiceId, status: "مدفوعة", paymentMethod: method },
      {
        onSuccess: () => { toast.success(`تم تسجيل الدفعة للفاتورة ${invoiceNum}`); onClose(); },
        onError: () => toast.error("فشل تسجيل الدفعة"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-background w-full max-w-xs rounded-xl shadow-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-base">تسجيل دفعة — {invoiceNum}</h3>
        <div>
          <Label className="text-xs mb-1">طريقة الدفع</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}
            onClick={handleConfirm} disabled={updateInvoice.isPending}>
            {updateInvoice.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-1" />}
            تأكيد الدفع
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Payments() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: contracts = [] }           = useContracts();
  const updateInvoice = useUpdateInvoice();

  const [view,            setView]            = useState<"invoices" | "progress">("invoices");
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [exportingId,     setExportingId]     = useState<string | null>(null);
  const [search,          setSearch]          = useState("");
  const [statusFilter,    setStatusFilter]    = useState("all");
  const [showNewInvoice,  setShowNewInvoice]  = useState(false);
  const [payingInvoice,   setPayingInvoice]   = useState<{ id: string; num: string } | null>(null);

  async function handleExportPdf(e: React.MouseEvent, inv: typeof invoices[0]) {
    e.stopPropagation();
    setExportingId(inv.id);
    const tid = toast.loading("جاري تصدير PDF...");
    try {
      await exportInvoicePdf(inv);
      toast.success(`تم تحميل الفاتورة ${inv.invoiceNumber || inv.id}`, { id: tid });
    } catch (err) {
      const blocked = err instanceof Error && err.message === "popup_blocked";
      toast.error(blocked ? "السماح بالنوافذ المنبثقة مطلوب" : "فشل التصدير", { id: tid });
    } finally {
      setExportingId(null);
    }
  }

  function handleSend(e: React.MouseEvent, inv: typeof invoices[0]) {
    e.stopPropagation();
    if (inv.status !== "مسودة") return;
    updateInvoice.mutate(
      { id: inv.id, status: "مُرسلة" },
      { onSuccess: () => toast.success(`تم إرسال الفاتورة ${inv.invoiceNumber || inv.id}`) }
    );
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-96 text-muted-foreground">جاري التحميل...</div>;

  /* ─── Stats ─── */
  const totalRevenue  = invoices.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0);
  const totalPending  = invoices.filter(i => ["مُرسلة", "مدفوعة جزئياً"].includes(i.status)).reduce((s, i) => s + i.total, 0);
  const totalOverdue  = invoices.filter(i => i.status === "متأخرة").reduce((s, i) => s + i.total, 0);
  const draftCount    = invoices.filter(i => i.status === "مسودة").length;

  const stats = [
    { label: "إجمالي المحصّل",    value: totalRevenue.toFixed(3),  unit: "د.ك",    icon: TrendingUp,   color: "oklch(0.55 0.15 150)" },
    { label: "دفعات مستحقة",      value: totalPending.toFixed(3),  unit: "د.ك",    icon: Clock,        color: "oklch(0.72 0.10 60)"  },
    { label: "دفعات متأخرة",      value: totalOverdue.toFixed(3),  unit: "د.ك",    icon: AlertTriangle,color: "oklch(0.60 0.12 30)"  },
    { label: "مسودات",            value: String(draftCount),       unit: "فاتورة", icon: FileText,     color: "oklch(0.55 0.15 250)" },
  ];

  /* ─── Filters ─── */
  const filtered = invoices.filter(inv => {
    const matchSearch = !search
      || inv.client.includes(search)
      || (inv.invoiceNumber || "").includes(search)
      || (inv.project || "").includes(search);
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  /* ─── Payment Progress from real data ─── */
  const progressByContract = contracts
    .filter(c => c.status === "نشط" || c.status === "مكتمل")
    .map(c => {
      const contractInvoices = invoices.filter(inv => inv.contractId === c.id || inv.projectId === c.projectId);
      const contractTotal = parseFloat(c.amount || "0");
      const paid = contractInvoices.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total, 0);
      const pending = contractInvoices.filter(i => ["مُرسلة", "مدفوعة جزئياً"].includes(i.status)).reduce((s, i) => s + i.total, 0);
      return { contract: c, total: contractTotal, paid, pending, invoiceCount: contractInvoices.length };
    })
    .filter(p => p.total > 0 || p.invoiceCount > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      {showNewInvoice && <NewInvoiceDialog onClose={() => setShowNewInvoice(false)} />}
      {payingInvoice && <RecordPaymentDialog invoiceId={payingInvoice.id} invoiceNum={payingInvoice.num} onClose={() => setPayingInvoice(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "20" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-base font-bold leading-tight" style={{ fontFamily: "'Space Grotesk'" }}>
                  {s.value} <span className="text-xs font-normal">{s.unit}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "invoices" ? "default" : "outline"} size="sm" onClick={() => setView("invoices")}
            style={view === "invoices" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            <Receipt className="w-4 h-4 ml-1" />الفواتير
          </Button>
          <Button variant={view === "progress" ? "default" : "outline"} size="sm" onClick={() => setView("progress")}
            style={view === "progress" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            <CreditCard className="w-4 h-4 ml-1" />تقدم التحصيل
          </Button>
        </div>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }} size="sm" onClick={() => setShowNewInvoice(true)}>
          <Plus className="w-4 h-4 ml-1" />فاتورة جديدة
        </Button>
      </div>

      {view === "invoices" ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالعميل أو رقم الفاتورة..." className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل ({invoices.length})</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label} ({invoices.filter(i => i.status === k).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || statusFilter !== "all") && (
              <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                مسح الفلاتر
              </button>
            )}
          </div>

          {/* Invoices Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium w-8"></th>
                      <th className="text-right py-3 px-4 font-medium">رقم الفاتورة</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">المشروع</th>
                      <th className="text-right py-3 px-4 font-medium">النوع</th>
                      <th className="text-right py-3 px-4 font-medium">الاستحقاق</th>
                      <th className="text-right py-3 px-4 font-medium">الإجمالي</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={9} className="py-12 text-center text-muted-foreground text-sm">لا توجد فواتير</td></tr>
                    ) : filtered.map((inv) => {
                      const st = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG["مسودة"];
                      const isExpanded = expandedInvoice === inv.id;
                      return (
                        <>
                          <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk'" }}>
                              {inv.invoiceNumber || inv.id}
                            </td>
                            <td className="py-3 px-4 font-medium text-xs">{inv.client}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[120px]">{inv.project || "—"}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">{inv.paymentType || "—"}</td>
                            <td className="py-3 px-4 text-xs" dir="ltr">{inv.dueDate || "—"}</td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{inv.total.toFixed(3)}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                {inv.status === "مسودة" && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7" title="إرسال" onClick={(e) => handleSend(e, inv)}>
                                    <Send className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تصدير PDF"
                                  disabled={exportingId === inv.id}
                                  onClick={(e) => handleExportPdf(e, inv)}>
                                  {exportingId === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={inv.id + "-detail"} className="bg-muted/10">
                              <td colSpan={9} className="py-4 px-6">
                                {/* Lines */}
                                {(inv.lines || []).length > 0 && (
                                  <>
                                    <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">سطور الفاتورة</h4>
                                    <table className="w-full text-xs mb-4">
                                      <thead>
                                        <tr className="border-b">
                                          <th className="text-right py-2 px-3 font-medium">المنتج</th>
                                          <th className="text-right py-2 px-3 font-medium">الوصف</th>
                                          <th className="text-right py-2 px-3 font-medium">الكمية</th>
                                          <th className="text-right py-2 px-3 font-medium">السعر</th>
                                          <th className="text-right py-2 px-3 font-medium">المجموع</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {inv.lines.map((line, li) => (
                                          <tr key={li} className="border-b last:border-0">
                                            <td className="py-2 px-3 font-medium">{line.product}</td>
                                            <td className="py-2 px-3 text-muted-foreground">{line.description}</td>
                                            <td className="py-2 px-3" style={{ fontFamily: "'Space Grotesk'" }}>{line.quantity}</td>
                                            <td className="py-2 px-3" style={{ fontFamily: "'Space Grotesk'" }}>{line.price.toFixed(3)}</td>
                                            <td className="py-2 px-3 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{(line.quantity * line.price).toFixed(3)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </>
                                )}
                                {/* Totals */}
                                <div className="flex justify-end mb-4">
                                  <div className="w-64 space-y-1 text-xs">
                                    <div className="flex justify-between"><span className="text-muted-foreground">المجموع:</span><span style={{ fontFamily: "'Space Grotesk'" }}>{inv.subtotal.toFixed(3)} د.ك</span></div>
                                    {inv.taxAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">الضريبة:</span><span style={{ fontFamily: "'Space Grotesk'" }}>{inv.taxAmount.toFixed(3)} د.ك</span></div>}
                                    <div className="flex justify-between pt-1 border-t font-bold"><span>الإجمالي:</span><span style={{ fontFamily: "'Space Grotesk'" }}>{inv.total.toFixed(3)} د.ك</span></div>
                                  </div>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-2 pt-3 border-t flex-wrap">
                                  <Button size="sm" className="text-xs text-white" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                                    disabled={exportingId === inv.id} onClick={(e) => handleExportPdf(e, inv)}>
                                    {exportingId === inv.id ? <Loader2 className="w-3 h-3 ml-1 animate-spin" /> : <Download className="w-3 h-3 ml-1" />}
                                    تصدير PDF
                                  </Button>
                                  {inv.status === "مسودة" && (
                                    <Button size="sm" variant="outline" className="text-xs" onClick={(e) => handleSend(e, inv)}>
                                      <Send className="w-3 h-3 ml-1" />إرسال
                                    </Button>
                                  )}
                                  {["مُرسلة", "مدفوعة جزئياً", "متأخرة"].includes(inv.status) && (
                                    <Button size="sm" variant="outline" className="text-xs text-green-700 border-green-200"
                                      onClick={(e) => { e.stopPropagation(); setPayingInvoice({ id: inv.id, num: inv.invoiceNumber || inv.id }); }}>
                                      <Banknote className="w-3 h-3 ml-1" />تسجيل دفعة
                                    </Button>
                                  )}
                                  {inv.notes && <p className="text-xs text-muted-foreground self-center mr-auto">ملاحظات: {inv.notes}</p>}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Payment Progress */
        <div className="space-y-4">
          {progressByContract.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center text-muted-foreground">
                <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">لا توجد عقود نشطة</p>
              </CardContent>
            </Card>
          ) : progressByContract.map((pp, i) => {
            const pct = pp.total > 0 ? Math.round((pp.paid / pp.total) * 100) : 0;
            return (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold">{pp.contract.client}</h4>
                      <p className="text-xs text-muted-foreground">{pp.contract.id} — {pp.contract.templateType || pp.contract.type}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'" }}>
                        {pp.paid.toFixed(3)} <span className="text-xs font-normal text-muted-foreground">/ {pp.total.toFixed(3)} د.ك</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{pp.invoiceCount} فاتورة</p>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2.5 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {pp.pending > 0 && <span className="text-amber-600">مستحق: {pp.pending.toFixed(3)} د.ك</span>}
                    <span className="mr-auto font-medium" style={{ color: pct === 100 ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 250)" }}>
                      {pct}% محصّل
                    </span>
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
