/**
 * DiscountRequests - صفحة مراجعة طلبات الخصم الخاص
 * خاصة بصاحب المكتب (م. سعود) للموافقة أو رفض طلبات الخصم
 */
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  BadgePercent, ThumbsUp, ThumbsDown, Clock, CheckCircle,
  XCircle, Loader2, User, DollarSign, Calendar, MessageSquare,
} from "lucide-react";
import { useDiscountRequests, useReviewDiscountRequest, type DiscountRequest } from "@/lib/api";
import { toast } from "sonner";

export default function DiscountRequests() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const { data: requests = [], isLoading } = useDiscountRequests(statusFilter === "all" ? undefined : statusFilter);
  const reviewRequest = useReviewDiscountRequest();

  const [reviewDialog, setReviewDialog] = useState<DiscountRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [reviewedBy] = useState("م. سعود");

  const handleReview = async (status: "approved" | "rejected") => {
    if (!reviewDialog) return;
    await reviewRequest.mutateAsync({
      id: reviewDialog.id,
      status,
      reviewedBy,
      reviewNote: reviewNote.trim() || undefined,
      finalDiscountValue: finalValue ? parseFloat(finalValue) : undefined,
    });
    toast.success(status === "approved" ? "✅ تمت الموافقة على الخصم وتطبيقه" : "❌ تم رفض طلب الخصم");
    setReviewDialog(null);
    setReviewNote("");
    setFinalValue("");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-800 border-amber-300">⏳ بانتظار المراجعة</Badge>;
      case "approved": return <Badge className="bg-green-100 text-green-800 border-green-300">✅ موافق عليه</Badge>;
      case "rejected": return <Badge className="bg-red-100 text-red-800 border-red-300">❌ مرفوض</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-purple-600" />
            طلبات الخصم الخاص
          </h1>
          <p className="text-sm text-muted-foreground mt-1">مراجعة وإقرار طلبات الخصم من الموظفين</p>
        </div>
        {pendingCount > 0 && statusFilter !== "pending" && (
          <Badge className="bg-amber-500 text-white text-sm px-3 py-1">
            {pendingCount} طلب معلق
          </Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "pending", label: "⏳ معلقة", color: "amber" },
          { key: "approved", label: "✅ موافق عليها", color: "green" },
          { key: "rejected", label: "❌ مرفوضة", color: "red" },
          { key: "all", label: "الكل", color: "gray" },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              statusFilter === tab.key
                ? "bg-purple-600 text-white border-purple-600"
                : "border-border hover:border-purple-300 text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BadgePercent className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">لا توجد طلبات خصم</p>
          <p className="text-sm mt-1">ستظهر هنا طلبات الخصم من الموظفين</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className={`border rounded-xl p-4 transition-all ${
                req.status === "pending"
                  ? "border-amber-200 bg-amber-50/50"
                  : req.status === "approved"
                  ? "border-green-200 bg-green-50/30"
                  : "border-red-200 bg-red-50/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  {/* Status + Lead */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(req.status)}
                    <span className="text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 inline ml-1" />
                      {new Date(req.createdAt).toLocaleDateString("ar-KW")}
                    </span>
                  </div>

                  {/* Discount Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-xs text-muted-foreground">السعر الأصلي</div>
                      <div className="font-bold">{req.originalPrice} د.ك</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-xs text-muted-foreground">الخصم المطلوب</div>
                      <div className="font-bold text-purple-700">
                        {req.discountType === "percentage"
                          ? `${req.discountValue}%`
                          : `${req.discountValue} د.ك`}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-xs text-muted-foreground">السعر بعد الخصم</div>
                      <div className="font-bold text-green-700">{req.discountedPrice.toFixed(3)} د.ك</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border">
                      <div className="text-xs text-muted-foreground">طلب بواسطة</div>
                      <div className="font-bold flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {req.requestedBy}
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  {req.reason && (
                    <div className="text-sm bg-white rounded-lg p-2 border">
                      <span className="text-muted-foreground">السبب: </span>
                      <span>{req.reason}</span>
                    </div>
                  )}

                  {/* Review Note */}
                  {req.reviewNote && (
                    <div className={`text-sm rounded-lg p-2 border flex items-start gap-2 ${
                      req.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}>
                      <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{req.reviewNote}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {req.status === "pending" && (
                  <Button
                    onClick={() => {
                      setReviewDialog(req);
                      setFinalValue(String(req.discountValue));
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                    size="sm"
                  >
                    <BadgePercent className="w-3 h-3 ml-1" />
                    مراجعة
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      {reviewDialog && (
        <Dialog open onOpenChange={() => setReviewDialog(null)}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <BadgePercent className="w-4 h-4 text-purple-600" />
                مراجعة طلب الخصم
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                طُلب بواسطة: {reviewDialog.requestedBy}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">السعر الأصلي</div>
                  <div className="text-lg font-bold">{reviewDialog.originalPrice} د.ك</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">السعر بعد الخصم</div>
                  <div className="text-lg font-bold text-purple-700">{reviewDialog.discountedPrice.toFixed(3)} د.ك</div>
                </div>
              </div>

              {/* Discount Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الخصم المطلوب:</span>
                  <span className="font-bold text-amber-700">
                    {reviewDialog.discountType === "percentage"
                      ? `${reviewDialog.discountValue}%`
                      : `${reviewDialog.discountValue} د.ك`}
                  </span>
                </div>
                {reviewDialog.reason && (
                  <div className="mt-2 pt-2 border-t border-amber-200">
                    <span className="text-muted-foreground">السبب: </span>
                    <span>{reviewDialog.reason}</span>
                  </div>
                )}
              </div>

              {/* Modify Discount Value */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  تعديل قيمة الخصم (اختياري — اتركه لاستخدام القيمة الأصلية)
                </Label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={finalValue}
                    onChange={e => setFinalValue(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-1.5 text-sm text-right bg-background focus:outline-none focus:ring-2 focus:ring-purple-300"
                    dir="ltr"
                  />
                  <span className="text-sm text-muted-foreground">
                    {reviewDialog.discountType === "percentage" ? "%" : "د.ك"}
                  </span>
                </div>
              </div>

              {/* Review Note */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">ملاحظة (اختياري)</Label>
                <Textarea
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="أضف ملاحظة للموظف..."
                  className="text-sm text-right resize-none"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setReviewDialog(null)}>إلغاء</Button>
              <Button
                onClick={() => handleReview("rejected")}
                disabled={reviewRequest.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {reviewRequest.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <ThumbsDown className="w-3 h-3 ml-1" />}
                رفض
              </Button>
              <Button
                onClick={() => handleReview("approved")}
                disabled={reviewRequest.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {reviewRequest.isPending ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <ThumbsUp className="w-3 h-3 ml-1" />}
                موافقة وتطبيق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
