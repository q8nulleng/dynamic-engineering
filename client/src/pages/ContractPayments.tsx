/**
 * ContractPayments — نظام التحصيل المرن
 * يعرض جدول دفعات العقد مع إمكانية تجزئة كل دفعة وتسجيل التحصيلات
 */
import { useState } from "react";
import { toast } from "sonner";
import { useContracts } from "@/lib/api";
import {
  usePaymentSchedule, usePaymentCollections, useScheduleCollections,
  useCreatePaymentSchedule, useBulkCreatePaymentSchedule,
  useUpdatePaymentSchedule, useDeletePaymentSchedule,
  useCollectPayment, useDeleteCollection,
  PaymentScheduleItem, PaymentCollectionItem,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown, ChevronUp, Plus, Trash2, CheckCircle2, Clock,
  AlertTriangle, Banknote, Loader2, Split, Edit2, X, Receipt,
} from "lucide-react";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: "لم تُحصَّل", color: "text-gray-600", bg: "bg-gray-100", icon: <Clock className="w-3 h-3" /> },
  partial: { label: "جزئية", color: "text-amber-700", bg: "bg-amber-50", icon: <AlertTriangle className="w-3 h-3" /> },
  paid:    { label: "مكتملة", color: "text-green-700", bg: "bg-green-50", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const PAYMENT_METHODS = ["نقدي", "تحويل بنكي", "K-Net", "شيك"];

// ── نافذة تسجيل تحصيل ────────────────────────────────────────────────────────
function CollectDialog({
  schedule,
  contractId,
  onClose,
}: {
  schedule: PaymentScheduleItem;
  contractId: string;
  onClose: () => void;
}) {
  const remaining = (schedule.amount || 0) - (schedule.collectedAmount || 0);
  const [amount, setAmount] = useState(remaining > 0 ? String(remaining.toFixed(3)) : "");
  const [method, setMethod] = useState("نقدي");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const collectPayment = useCollectPayment(contractId);
  const { data: collections = [] } = useScheduleCollections(schedule.id);

  const handleCollect = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("أدخل مبلغاً صحيحاً"); return; }
    await collectPayment.mutateAsync({ scheduleId: schedule.id, amount: amt, paymentMethod: method, paymentDate: date, reference, notes });
    toast.success(`✅ تم تسجيل تحصيل ${amt.toFixed(3)} د.ك`);
    onClose();
  };

  const deleteCol = useDeleteCollection(contractId);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">تسجيل تحصيل — {schedule.label}</DialogTitle>
        </DialogHeader>

        {/* ملخص الدفعة */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-muted/40 rounded-lg text-sm text-right">
          <div>
            <div className="text-xs text-muted-foreground">إجمالي الدفعة</div>
            <div className="font-bold">{(schedule.amount || 0).toFixed(3)} د.ك</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">المُحصَّل</div>
            <div className="font-bold text-green-600">{(schedule.collectedAmount || 0).toFixed(3)} د.ك</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">المتبقي</div>
            <div className="font-bold text-amber-600">{remaining.toFixed(3)} د.ك</div>
          </div>
        </div>

        {/* شريط التقدم */}
        <Progress
          value={schedule.amount ? ((schedule.collectedAmount || 0) / schedule.amount) * 100 : 0}
          className="h-2"
        />

        {/* سجل التحصيلات السابقة */}
        {collections.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">التحصيلات السابقة:</div>
            {collections.map(c => (
              <div key={c.id} className="flex items-center justify-between text-xs p-1.5 bg-green-50 rounded border border-green-100">
                <button
                  className="text-red-400 hover:text-red-600"
                  onClick={async () => {
                    await deleteCol.mutateAsync(c.id);
                    toast.success("تم حذف التحصيل");
                  }}
                ><X className="w-3 h-3" /></button>
                <span className="text-muted-foreground">{c.paymentDate} · {c.paymentMethod}</span>
                <span className="font-bold text-green-700">{(c.amount || 0).toFixed(3)} د.ك</span>
              </div>
            ))}
          </div>
        )}

        {/* نموذج تحصيل جديد */}
        <div className="space-y-3 pt-2 border-t">
          <div className="text-sm font-semibold">تسجيل تحصيل جديد</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">المبلغ (د.ك)</Label>
              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.000"
                className="text-right"
                dir="ltr"
              />
            </div>
            <div>
              <Label className="text-xs">طريقة الدفع</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">تاريخ التحصيل</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">رقم المرجع (شيك/تحويل)</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="اختياري" />
            </div>
          </div>
          <div>
            <Label className="text-xs">ملاحظات</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="اختياري" />
          </div>
        </div>

        <DialogFooter className="gap-2 flex-row-reverse">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button
            onClick={handleCollect}
            disabled={collectPayment.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {collectPayment.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <Banknote className="w-4 h-4 ml-1" />}
            تسجيل التحصيل
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── نافذة إنشاء/تعديل جدول الدفعات ──────────────────────────────────────────
function ScheduleBuilderDialog({
  contractId,
  contractAmount,
  existingSchedule,
  onClose,
}: {
  contractId: string;
  contractAmount: number;
  existingSchedule: PaymentScheduleItem[];
  onClose: () => void;
}) {
  const DEFAULT_SCHEDULES = [
    { label: "الدفعة الأولى — عند التوقيع", percentage: 30, triggerEvent: "عند توقيع العقد", order: 1 },
    { label: "الدفعة الثانية — بعد الرفع البلدي", percentage: 30, triggerEvent: "بعد الرفع البلدي", order: 2 },
    { label: "الدفعة الثالثة — عند الانتهاء", percentage: 40, triggerEvent: "عند التسليم النهائي", order: 3 },
  ];

  const [rows, setRows] = useState<Array<{ label: string; percentage: string; triggerEvent: string; dueDate: string; notes: string }>>(
    existingSchedule.length > 0
      ? existingSchedule.map(s => ({
          label: s.label,
          percentage: String(s.percentage || 0),
          triggerEvent: s.triggerEvent || "",
          dueDate: s.dueDate || "",
          notes: s.notes || "",
        }))
      : DEFAULT_SCHEDULES.map(s => ({
          label: s.label,
          percentage: String(s.percentage),
          triggerEvent: s.triggerEvent,
          dueDate: "",
          notes: "",
        }))
  );

  const bulkCreate = useBulkCreatePaymentSchedule(contractId);

  const totalPct = rows.reduce((s, r) => s + (parseFloat(r.percentage) || 0), 0);

  const addRow = () => setRows(prev => [...prev, { label: "", percentage: "", triggerEvent: "", dueDate: "", notes: "" }]);
  const removeRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: string, val: string) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [key]: val } : r));

  const handleSave = async () => {
    if (totalPct > 100.1) { toast.error("مجموع النسب يتجاوز 100%"); return; }
    const schedules = rows.map((r, i) => ({
      label: r.label || `دفعة ${i + 1}`,
      percentage: parseFloat(r.percentage) || 0,
      amount: contractAmount * ((parseFloat(r.percentage) || 0) / 100),
      triggerEvent: r.triggerEvent,
      dueDate: r.dueDate,
      notes: r.notes,
      order: i + 1,
    }));
    await bulkCreate.mutateAsync(schedules);
    toast.success("✅ تم حفظ جدول الدفعات");
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">جدول دفعات العقد</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          إجمالي العقد: <strong>{contractAmount.toFixed(3)} د.ك</strong>
          {" · "}
          مجموع النسب: <strong className={totalPct > 100.1 ? "text-red-600" : "text-green-600"}>{totalPct.toFixed(1)}%</strong>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-12 gap-1.5 items-center p-2 border rounded-lg bg-muted/20">
              <div className="col-span-4">
                <Input
                  value={row.label}
                  onChange={e => updateRow(i, "label", e.target.value)}
                  placeholder="اسم الدفعة"
                  className="text-xs h-8"
                />
              </div>
              <div className="col-span-2">
                <div className="relative">
                  <Input
                    type="number"
                    value={row.percentage}
                    onChange={e => updateRow(i, "percentage", e.target.value)}
                    placeholder="%"
                    className="text-xs h-8 pl-6"
                    dir="ltr"
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
                {row.percentage && contractAmount > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-0.5 text-center">
                    {(contractAmount * (parseFloat(row.percentage) / 100)).toFixed(3)} د.ك
                  </div>
                )}
              </div>
              <div className="col-span-3">
                <Input
                  value={row.triggerEvent}
                  onChange={e => updateRow(i, "triggerEvent", e.target.value)}
                  placeholder="الحدث المُحفِّز"
                  className="text-xs h-8"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="date"
                  value={row.dueDate}
                  onChange={e => updateRow(i, "dueDate", e.target.value)}
                  className="text-xs h-8"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => removeRow(i)} className="text-red-400 hover:text-red-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addRow} className="w-full mt-2">
          <Plus className="w-3 h-3 ml-1" /> إضافة دفعة
        </Button>

        <DialogFooter className="gap-2 flex-row-reverse">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={bulkCreate.isPending}>
            {bulkCreate.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
            حفظ جدول الدفعات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── بطاقة دفعة واحدة ─────────────────────────────────────────────────────────
function ScheduleCard({
  item,
  contractId,
}: {
  item: PaymentScheduleItem;
  contractId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showCollect, setShowCollect] = useState(false);
  const { data: collections = [] } = useScheduleCollections(expanded ? item.id : undefined);
  const deleteSchedule = useDeletePaymentSchedule();
  const st = STATUS_MAP[item.status] || STATUS_MAP.pending;
  const pct = item.amount > 0 ? Math.min(100, ((item.collectedAmount || 0) / item.amount) * 100) : 0;

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* رأس البطاقة */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="font-semibold text-sm">{item.label}</span>
            <Badge className={`text-[10px] px-1.5 py-0.5 ${st.bg} ${st.color} border-0 flex items-center gap-1`}>
              {st.icon}{st.label}
            </Badge>
          </div>
          {item.triggerEvent && (
            <div className="text-xs text-muted-foreground mt-0.5">{item.triggerEvent}</div>
          )}
        </div>

        <div className="text-right min-w-[120px]">
          <div className="font-bold text-base">{(item.amount || 0).toFixed(3)} <span className="text-xs font-normal">د.ك</span></div>
          {item.percentage > 0 && (
            <div className="text-xs text-muted-foreground">{item.percentage}% من العقد</div>
          )}
        </div>

        <div className="min-w-[80px]">
          <div className="text-xs text-muted-foreground text-center mb-1">
            {(item.collectedAmount || 0).toFixed(3)} / {(item.amount || 0).toFixed(3)}
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-green-700 border-green-300 hover:bg-green-50"
            onClick={e => { e.stopPropagation(); setShowCollect(true); }}
          >
            <Banknote className="w-3 h-3 ml-1" />
            تحصيل
          </Button>
          <button
            className="text-red-400 hover:text-red-600 p-1"
            onClick={async e => {
              e.stopPropagation();
              if (!confirm("حذف هذه الدفعة؟")) return;
              await deleteSchedule.mutateAsync({ id: item.id, contractId });
              toast.success("تم الحذف");
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* تفاصيل التحصيلات */}
      {expanded && (
        <div className="border-t bg-muted/10 p-3 space-y-2">
          {collections.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">لا توجد تحصيلات بعد</p>
          ) : (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground mb-1">سجل التحصيلات:</div>
              {collections.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-white rounded border">
                  <span className="text-muted-foreground">{c.paymentDate}</span>
                  <span className="text-muted-foreground">{c.paymentMethod}</span>
                  {c.reference && <span className="text-muted-foreground">#{c.reference}</span>}
                  <span className="font-bold text-green-700">{(c.amount || 0).toFixed(3)} د.ك</span>
                </div>
              ))}
            </div>
          )}
          {item.dueDate && (
            <div className="text-xs text-muted-foreground">📅 تاريخ الاستحقاق: {item.dueDate}</div>
          )}
          {item.notes && (
            <div className="text-xs text-muted-foreground">📝 {item.notes}</div>
          )}
        </div>
      )}

      {showCollect && (
        <CollectDialog schedule={item} contractId={contractId} onClose={() => setShowCollect(false)} />
      )}
    </div>
  );
}

// ── الصفحة الرئيسية ───────────────────────────────────────────────────────────
export default function ContractPayments() {
  const { data: contracts = [] } = useContracts();
  const [selectedContractId, setSelectedContractId] = useState<string>("");
  const [showBuilder, setShowBuilder] = useState(false);

  const selectedContract = contracts.find(c => c.id === selectedContractId);
  const contractAmount = parseFloat(selectedContract?.amount || "0") || 0;

  const { data: schedule = [] } = usePaymentSchedule(selectedContractId || undefined);
  const { data: allCollections = [] } = usePaymentCollections(selectedContractId || undefined);

  // إحصائيات
  const totalScheduled = schedule.reduce((s, r) => s + (r.amount || 0), 0);
  const totalCollected = schedule.reduce((s, r) => s + (r.collectedAmount || 0), 0);
  const totalPending = totalScheduled - totalCollected;
  const overallPct = totalScheduled > 0 ? (totalCollected / totalScheduled) * 100 : 0;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">نظام التحصيل المرن</h1>
        {selectedContractId && (
          <Button size="sm" onClick={() => setShowBuilder(true)}>
            <Edit2 className="w-3 h-3 ml-1" />
            {schedule.length > 0 ? "تعديل جدول الدفعات" : "إنشاء جدول الدفعات"}
          </Button>
        )}
      </div>

      {/* اختيار العقد */}
      <Card>
        <CardContent className="pt-4">
          <Label className="text-sm font-semibold mb-2 block">اختر العقد</Label>
          <Select value={selectedContractId} onValueChange={setSelectedContractId}>
            <SelectTrigger className="text-right">
              <SelectValue placeholder="اختر عقداً لعرض جدول دفعاته..." />
            </SelectTrigger>
            <SelectContent>
              {contracts.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.client} — {c.amount} د.ك ({c.type || "عقد"})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedContractId && (
        <>
          {/* إحصائيات */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "إجمالي العقد", value: contractAmount.toFixed(3), color: "text-blue-700", bg: "bg-blue-50" },
              { label: "إجمالي الجدول", value: totalScheduled.toFixed(3), color: "text-purple-700", bg: "bg-purple-50" },
              { label: "المُحصَّل", value: totalCollected.toFixed(3), color: "text-green-700", bg: "bg-green-50" },
              { label: "المتبقي", value: totalPending.toFixed(3), color: "text-amber-700", bg: "bg-amber-50" },
            ].map(stat => (
              <Card key={stat.label} className={`${stat.bg} border-0`}>
                <CardContent className="pt-3 pb-3 text-center">
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label} (د.ك)</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* شريط التقدم الإجمالي */}
          {totalScheduled > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>التقدم الإجمالي في التحصيل</span>
                <span>{overallPct.toFixed(1)}%</span>
              </div>
              <Progress value={overallPct} className="h-3" />
            </div>
          )}

          {/* جدول الدفعات */}
          {schedule.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <Receipt className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-3">لم يُحدَّد جدول دفعات لهذا العقد بعد</p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="w-4 h-4 ml-1" />
                  إنشاء جدول الدفعات
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold">جدول الدفعات ({schedule.length} دفعات)</div>
              {schedule.map(item => (
                <ScheduleCard key={item.id} item={item} contractId={selectedContractId} />
              ))}
            </div>
          )}

          {/* سجل كل التحصيلات */}
          {allCollections.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">سجل جميع التحصيلات ({allCollections.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {allCollections.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                    <span className="text-muted-foreground">{c.paymentDate}</span>
                    <span className="text-muted-foreground">{c.paymentMethod}</span>
                    {c.reference && <span className="text-muted-foreground">#{c.reference}</span>}
                    <span className="font-bold text-green-700">{(c.amount || 0).toFixed(3)} د.ك</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {showBuilder && selectedContractId && (
        <ScheduleBuilderDialog
          contractId={selectedContractId}
          contractAmount={contractAmount}
          existingSchedule={schedule}
          onClose={() => setShowBuilder(false)}
        />
      )}
    </div>
  );
}
