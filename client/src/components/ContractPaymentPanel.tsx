/*
 * ContractPaymentPanel - كرت العقد وتحصيل الدفعة الأولى
 * ─ معلومات العقد (ثابتة قابلة للطي)
 * ─ جدول الدفعات (الجزء الرئيسي)
 * ─ تاق المسؤول: محمد المحاسب
 */
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle,
  Upload, Receipt, CreditCard, Banknote, User, FileText, Eye,
  Calendar, DollarSign
} from "lucide-react";
import { toast } from "sonner";

/* ─── أنواع ─── */
type PaymentStatus = "paid" | "pending" | "overdue";

interface Payment {
  id: string;
  label: string;
  percentage: number;
  amount: number;
  status: PaymentStatus;
  dueAt: string;
  method?: string;
  paidDate?: string;
  receipt?: { name: string; size: string; uploadedAt: string };
}

/* ─── إعدادات الحالات ─── */
const PAY_STATUS: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  paid:    { label: "محصّلة",  color: "oklch(0.50 0.15 150)", bg: "oklch(0.97 0.03 150)", icon: CheckCircle2 },
  pending: { label: "بانتظار", color: "oklch(0.55 0.15 60)",  bg: "oklch(0.97 0.03 60)",  icon: Clock },
  overdue: { label: "متأخرة", color: "oklch(0.50 0.15 20)",  bg: "oklch(0.97 0.03 20)",  icon: AlertTriangle },
};

/* ─── البيانات ─── */
const CONTRACT_TOTAL = 3500;

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: "p1", label: "الدفعة الأولى", percentage: 30,
    amount: 1050, status: "paid", dueAt: "عند التعاقد",
    method: "تحويل بنكي", paidDate: "2026/03/15",
    receipt: { name: "receipt-001.pdf", size: "245 KB", uploadedAt: "10:30 ص" },
  },
  {
    id: "p2", label: "الدفعة الثانية", percentage: 40,
    amount: 1400, status: "pending", dueAt: "بعد اعتماد البلدية",
  },
  {
    id: "p3", label: "الدفعة النهائية", percentage: 30,
    amount: 1050, status: "pending", dueAt: "عند تسليم الكراسة",
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  taskName?: string;
  projectName?: string;
  clientName?: string;
  contractNumber?: string;
  packageType?: string;
}

export default function ContractPaymentPanel({
  open, onClose,
  taskName = "العقد وتحصيل الدفعة الأولى",
  projectName = "فيلا العتيبي - السالمية",
  clientName = "فهد العتيبي",
  contractNumber = "CON-2026-048",
  packageType = "باقة مميزة - سكن خاص",
}: Props) {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [showInfo, setShowInfo] = useState(false);
  const [showPayForm, setShowPayForm] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState("كاش");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPayId, setUploadingPayId] = useState<string | null>(null);

  if (!open) return null;

  const paidTotal = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const paidPct = Math.round((paidTotal / CONTRACT_TOTAL) * 100);
  const paidCount = payments.filter(p => p.status === "paid").length;

  /* ─── رفع إيصال ─── */
  const handleUploadClick = (payId: string) => {
    setUploadingPayId(payId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingPayId) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    setPayments(prev => prev.map(p => {
      if (p.id !== uploadingPayId) return p;
      return {
        ...p,
        receipt: { name: file.name, size: sizeStr, uploadedAt: new Date().toLocaleTimeString("ar-KW", { hour: "2-digit", minute: "2-digit" }) },
      };
    }));
    toast.success("تم رفع الإيصال بنجاح");
    setUploadingPayId(null);
    e.target.value = "";
  };

  /* ─── تسجيل دفعة ─── */
  const confirmPayment = (payId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== payId) return p;
      return {
        ...p,
        status: "paid" as PaymentStatus,
        method: payMethod,
        paidDate: new Date().toLocaleDateString("ar-KW"),
      };
    }));
    setShowPayForm(null);
    toast.success("تم تسجيل الدفعة بنجاح!", {
      description: "📁 تم تحديث سجل الدفعات تلقائياً",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mr-auto w-full max-w-md bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: "1px solid hsl(var(--border))" }}>

        {/* ─── Header ─── */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: "oklch(0.95 0.04 150)" }}>💰</div>
              <div>
                <h2 className="font-bold text-sm">{taskName}</h2>
                <p className="text-[10px] text-muted-foreground">{projectName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* تاق المسؤول + حالة */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 gap-1"
              style={{ borderColor: "oklch(0.55 0.15 150)", color: "oklch(0.45 0.15 150)" }}>
              <User className="w-2.5 h-2.5" />
              محمد المحاسب
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5"
              style={{
                borderColor: paidCount === payments.length ? "oklch(0.60 0.15 150)" : "oklch(0.60 0.15 60)",
                color: paidCount === payments.length ? "oklch(0.45 0.15 150)" : "oklch(0.50 0.15 60)",
              }}>
              {paidCount === payments.length ? "✓ محصّل بالكامل" : `${paidCount}/${payments.length} دفعات`}
            </Badge>
          </div>

          {/* شريط التقدم المالي */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>المحصّل: {paidTotal.toLocaleString()} د.ك</span>
              <span>الإجمالي: {CONTRACT_TOTAL.toLocaleString()} د.ك</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${paidPct}%`,
                  backgroundColor: paidCount === payments.length ? "oklch(0.55 0.15 150)" : "oklch(0.55 0.15 250)",
                }} />
            </div>
          </div>
        </div>

        {/* ─── معلومات العقد (قابلة للطي) ─── */}
        <button onClick={() => setShowInfo(!showInfo)}
          className="px-4 py-2 border-b flex items-center justify-between hover:bg-muted/30 transition-colors text-right w-full">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium">معلومات العقد</span>
            <span className="text-[10px] text-muted-foreground">
              {contractNumber} · {packageType}
            </span>
          </div>
          {showInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showInfo && (
          <div className="px-4 py-3 border-b bg-muted/10">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[10px] text-muted-foreground">رقم العقد</p>
                <p className="font-semibold">{contractNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">العميل</p>
                <p className="font-semibold">{clientName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">نوع الباقة</p>
                <p className="font-semibold">{packageType}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">قيمة العقد</p>
                <p className="font-semibold">{CONTRACT_TOTAL.toLocaleString()} د.ك</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">تاريخ التوقيع</p>
                <p className="font-semibold">2026/03/15</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">حالة العقد</p>
                <p className="font-semibold" style={{ color: "oklch(0.50 0.15 150)" }}>✓ موقّع</p>
              </div>
            </div>
          </div>
        )}

        {/* ─── جدول الدفعات ─── */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y">
            {payments.map(pay => {
              const cfg = PAY_STATUS[pay.status];
              const Icon = cfg.icon;
              return (
                <div key={pay.id} className="px-4 py-3">
                  {/* صف الدفعة */}
                  <div className="flex items-center gap-3">
                    <Icon style={{ color: cfg.color, width: 20, height: 20 }} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{pay.label}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                        <span>{pay.percentage}% · {pay.amount.toLocaleString()} د.ك</span>
                        <span>·</span>
                        <span>{pay.dueAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* تفاصيل الدفعة المحصّلة */}
                  {pay.status === "paid" && (
                    <div className="mt-2 mr-8 p-2 rounded-lg" style={{ backgroundColor: "oklch(0.98 0.01 150)" }}>
                      <div className="flex items-center gap-3 text-[10px]">
                        <div className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" style={{ color: "oklch(0.50 0.15 150)" }} />
                          <span>{pay.method}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" style={{ color: "oklch(0.50 0.15 150)" }} />
                          <span>{pay.paidDate}</span>
                        </div>
                      </div>
                      {pay.receipt && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                          <Receipt className="w-3 h-3" style={{ color: "oklch(0.50 0.15 250)" }} />
                          <span className="truncate">{pay.receipt.name}</span>
                          <span>·</span>
                          <span>{pay.receipt.size}</span>
                          <button className="p-0.5 rounded hover:bg-muted transition-colors mr-1">
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* أزرار الدفعة غير المحصّلة */}
                  {pay.status !== "paid" && (
                    <div className="mt-2 mr-8">
                      {showPayForm === pay.id ? (
                        <div className="p-2.5 rounded-lg border bg-muted/10">
                          <p className="text-[10px] font-semibold mb-2">تسجيل دفعة — {pay.amount.toLocaleString()} د.ك</p>
                          {/* طريقة الدفع */}
                          <div className="flex gap-1.5 mb-2">
                            {["كاش", "تحويل بنكي", "كي نت"].map(m => (
                              <button key={m} onClick={() => setPayMethod(m)}
                                className="text-[10px] px-2 py-1 rounded-md border transition-colors"
                                style={{
                                  backgroundColor: payMethod === m ? "oklch(0.50 0.15 250)" : "transparent",
                                  color: payMethod === m ? "white" : "inherit",
                                  borderColor: payMethod === m ? "oklch(0.50 0.15 250)" : "hsl(var(--border))",
                                }}>
                                {m === "كاش" && <Banknote className="w-3 h-3 inline ml-1" />}
                                {m === "تحويل بنكي" && <CreditCard className="w-3 h-3 inline ml-1" />}
                                {m === "كي نت" && <DollarSign className="w-3 h-3 inline ml-1" />}
                                {m}
                              </button>
                            ))}
                          </div>
                          {/* رفع إيصال */}
                          <button onClick={() => handleUploadClick(pay.id)}
                            className="w-full text-[10px] px-2 py-1.5 rounded-md border border-dashed hover:bg-muted/30 transition-colors flex items-center justify-center gap-1 mb-2">
                            <Upload className="w-3 h-3" />
                            {pay.receipt ? pay.receipt.name : "رفع إيصال التحويل (اختياري)"}
                          </button>
                          {/* أزرار تأكيد/إلغاء */}
                          <div className="flex gap-2">
                            <button onClick={() => confirmPayment(pay.id)}
                              className="flex-1 text-[10px] px-2 py-1.5 rounded-md text-white transition-colors"
                              style={{ backgroundColor: "oklch(0.50 0.15 150)" }}>
                              ✓ تأكيد التحصيل
                            </button>
                            <button onClick={() => setShowPayForm(null)}
                              className="text-[10px] px-3 py-1.5 rounded-md border hover:bg-muted transition-colors">
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowPayForm(pay.id)}
                          className="text-[10px] px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors flex items-center gap-1.5">
                          <DollarSign className="w-3 h-3" />
                          تسجيل دفعة
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── تذييل ─── */}
        <div className="px-4 py-2.5 border-t bg-muted/20 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            💰 الدفعات المحصّلة تُسجّل تلقائياً في قسم الدفعات
          </p>
        </div>
      </div>
    </div>
  );
}
