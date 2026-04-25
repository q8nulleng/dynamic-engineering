/*
 * ContractPaymentPanel - كرت العقد وتحصيل الدفعة الأولى
 * ─ معلومات العقد (ثابتة قابلة للطي)
 * ─ الدفعة الأولى فقط (30% عند التعاقد)
 * ─ تاق المسؤول: محمد المحاسب
 */
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  X, ChevronDown, ChevronUp, CheckCircle2, Clock,
  Upload, CreditCard, Banknote, User, FileText, Eye,
  Calendar, DollarSign, Receipt, Phone, MessageSquare
} from "lucide-react";
import { toast } from "sonner";

type PaymentStatus = "paid" | "pending";

interface Props {
  open: boolean;
  onClose: () => void;
  projectName?: string;
  clientName?: string;
  clientPhone?: string;
  contractNumber?: string;
  packageType?: string;
  contractTotal?: number;
}

export default function ContractPaymentPanel({
  open, onClose,
  projectName = "بناء جديد سكن خاص - نت",
  clientName = "فهد العتيبي",
  clientPhone = "96599123456",
  contractNumber = "CON-2026-048",
  packageType = "باقة مميزة - سكن خاص",
  contractTotal = 3500,
}: Props) {
  const firstPayAmount = Math.round(contractTotal * 0.3);
  const [payStatus, setPayStatus] = useState<PaymentStatus>("paid");
  const [showInfo, setShowInfo] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payMethod, setPayMethod] = useState("كاش");
  const [paidDate, setPaidDate] = useState("2026/03/15");
  const [paidMethod, setPaidMethod] = useState("تحويل بنكي");
  const [receiptFile, setReceiptFile] = useState<{ name: string; size: string } | null>(
    { name: "receipt-001.pdf", size: "245 KB" }
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
    setReceiptFile({ name: file.name, size: sizeStr });
    toast.success("تم رفع الإيصال");
    e.target.value = "";
  };

  const confirmPayment = () => {
    setPayStatus("paid");
    setPaidDate(new Date().toLocaleDateString("ar-KW"));
    setPaidMethod(payMethod);
    setShowPayForm(false);
    toast.success("تم تحصيل الدفعة الأولى!", {
      description: "📁 تم تحديث سجل الدفعات تلقائياً",
    });
  };

  const isPaid = payStatus === "paid";

  return (
    <div className="fixed inset-0 z-50 flex" dir="rtl">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp" />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative mr-auto w-full max-w-sm bg-background shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: "1px solid hsl(var(--border))" }}>

        {/* ─── Header ─── */}
        <div className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                style={{ backgroundColor: "oklch(0.95 0.04 150)" }}>💰</div>
              <div>
                <h2 className="font-bold text-sm">العقد وتحصيل الدفعة الأولى</h2>
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
                borderColor: isPaid ? "oklch(0.60 0.15 150)" : "oklch(0.60 0.15 60)",
                color: isPaid ? "oklch(0.45 0.15 150)" : "oklch(0.50 0.15 60)",
              }}>
              {isPaid ? "✓ الدفعة الأولى محصّلة" : "⏳ بانتظار التحصيل"}
            </Badge>
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
                <p className="font-semibold">{contractTotal.toLocaleString()} د.ك</p>
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
            {/* التواصل مع العميل */}
            <div className="flex gap-2 mt-3 pt-2 border-t">
              <a href={`tel:${clientPhone}`}
                className="flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1.5 rounded-md border hover:bg-muted/30 transition-colors">
                <Phone className="w-3 h-3" /> اتصال
              </a>
              <a href={`https://wa.me/${clientPhone}`} target="_blank"
                className="flex-1 flex items-center justify-center gap-1.5 text-[10px] py-1.5 rounded-md border hover:bg-muted/30 transition-colors"
                style={{ color: "oklch(0.50 0.15 150)" }}>
                <MessageSquare className="w-3 h-3" /> واتساب
              </a>
            </div>
          </div>
        )}

        {/* ─── الدفعة الأولى ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-xl border p-4" style={{
            backgroundColor: isPaid ? "oklch(0.98 0.01 150)" : "oklch(0.98 0.01 60)",
          }}>
            {/* عنوان الدفعة */}
            <div className="flex items-center gap-3 mb-3">
              {isPaid
                ? <CheckCircle2 className="w-6 h-6 shrink-0" style={{ color: "oklch(0.50 0.15 150)" }} />
                : <Clock className="w-6 h-6 shrink-0" style={{ color: "oklch(0.55 0.15 60)" }} />
              }
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">الدفعة الأولى</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: isPaid ? "oklch(0.92 0.04 150)" : "oklch(0.92 0.04 60)",
                      color: isPaid ? "oklch(0.40 0.15 150)" : "oklch(0.45 0.15 60)",
                    }}>
                    {isPaid ? "محصّلة" : "بانتظار"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  30% من قيمة العقد · عند التعاقد
                </p>
              </div>
            </div>

            {/* المبلغ */}
            <div className="text-center py-3 mb-3 rounded-lg" style={{
              backgroundColor: isPaid ? "oklch(0.95 0.03 150)" : "oklch(0.95 0.03 60)",
            }}>
              <p className="text-2xl font-bold" style={{
                color: isPaid ? "oklch(0.40 0.15 150)" : "oklch(0.45 0.15 60)",
              }}>
                {firstPayAmount.toLocaleString()} <span className="text-sm">د.ك</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                من إجمالي {contractTotal.toLocaleString()} د.ك
              </p>
            </div>

            {/* تفاصيل الدفعة المحصّلة */}
            {isPaid && (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.15 150)" }} />
                    <span>{paidMethod}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.15 150)" }} />
                    <span>{paidDate}</span>
                  </div>
                </div>

                {/* الإيصال */}
                {receiptFile && (
                  <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-background/60">
                    <Receipt className="w-3.5 h-3.5" style={{ color: "oklch(0.50 0.15 250)" }} />
                    <span className="truncate flex-1">{receiptFile.name}</span>
                    <span className="text-[10px] text-muted-foreground">{receiptFile.size}</span>
                    <button className="p-1 rounded hover:bg-muted transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* نموذج تسجيل الدفعة */}
            {!isPaid && !showPayForm && (
              <button onClick={() => setShowPayForm(true)}
                className="w-full text-xs py-2.5 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: "oklch(0.50 0.15 250)" }}>
                <DollarSign className="w-3.5 h-3.5 inline ml-1" />
                تسجيل تحصيل الدفعة
              </button>
            )}

            {!isPaid && showPayForm && (
              <div className="space-y-3">
                {/* طريقة الدفع */}
                <div>
                  <p className="text-[10px] font-semibold mb-1.5">طريقة الدفع</p>
                  <div className="flex gap-1.5">
                    {["كاش", "تحويل بنكي", "كي نت"].map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        className="flex-1 text-[10px] px-2 py-2 rounded-lg border transition-colors flex items-center justify-center gap-1"
                        style={{
                          backgroundColor: payMethod === m ? "oklch(0.50 0.15 250)" : "transparent",
                          color: payMethod === m ? "white" : "inherit",
                          borderColor: payMethod === m ? "oklch(0.50 0.15 250)" : "hsl(var(--border))",
                        }}>
                        {m === "كاش" && <Banknote className="w-3 h-3" />}
                        {m === "تحويل بنكي" && <CreditCard className="w-3 h-3" />}
                        {m === "كي نت" && <DollarSign className="w-3 h-3" />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* رفع إيصال */}
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full text-[10px] px-2 py-2 rounded-lg border border-dashed hover:bg-muted/30 transition-colors flex items-center justify-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {receiptFile ? receiptFile.name : "رفع إيصال التحويل (اختياري)"}
                </button>

                {/* أزرار */}
                <div className="flex gap-2">
                  <button onClick={confirmPayment}
                    className="flex-1 text-xs py-2 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: "oklch(0.50 0.15 150)" }}>
                    ✓ تأكيد التحصيل
                  </button>
                  <button onClick={() => setShowPayForm(false)}
                    className="text-xs px-4 py-2 rounded-lg border hover:bg-muted transition-colors">
                    إلغاء
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── تذييل ─── */}
        <div className="px-4 py-2.5 border-t bg-muted/20 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            💰 الدفعة المحصّلة تُسجّل تلقائياً في قسم الدفعات
          </p>
        </div>
      </div>
    </div>
  );
}
