/**
 * كرت التصميم الإنشائي والواجهات المدمج — Structural & Facades Card
 * يجمع مهام مرحلة التصميم الإنشائي + الرسم والإخراج:
 * - رفع الواجهات
 * - رفع المخططات الإنشائية
 * - إرسال للعميل
 * - اعتماد
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building, Layers, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, Send, Upload,
  Check, X, Eye
} from "lucide-react";
import { useUploadDocument, useDocuments, useApproveTask } from "@/lib/api";
import { toast } from "sonner";

interface StructuralDesignCardProps {
  projectId: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  phaseColor: string;
  tasks: Array<{ id: number; name: string; status: string; assignee?: string }>;
}

interface DocSlot {
  key: string;
  label: string;
  category: string;
  searchTerms: string[];
}

const DOC_SLOTS: DocSlot[] = [
  { key: "facades", label: "الواجهات", category: "مخططات معمارية", searchTerms: ["واجه", "facade"] },
  { key: "structural", label: "المخططات الإنشائية", category: "مخططات إنشائية", searchTerms: ["إنشائ", "structural", "أعمدة"] },
  { key: "sections", label: "القطاعات والتفاصيل", category: "مخططات معمارية", searchTerms: ["قطاع", "section", "تفصيل"] },
  { key: "mep", label: "الصحي والكهربائي", category: "مخططات", searchTerms: ["صحي", "كهرب", "mep"] },
];

export default function StructuralDesignCard({
  projectId, clientId, clientName, clientPhone, phaseColor, tasks
}: StructuralDesignCardProps) {
  const [expanded, setExpanded] = useState(true);

  const uploadDoc = useUploadDocument();
  const approveTask = useApproveTask(projectId);
  const { data: docs } = useDocuments({ projectId });

  // Check which docs are uploaded
  const getSlotDoc = (slot: DocSlot) => {
    return (docs || []).find(d =>
      slot.searchTerms.some(term => d.name.includes(term) || d.category.includes(term))
    );
  };

  const uploadedCount = DOC_SLOTS.filter(s => getSlotDoc(s)).length;
  const progress = Math.round((uploadedCount / DOC_SLOTS.length) * 100);

  // Find approval task
  const approvalTask = tasks.find(t => t.name.includes("اعتماد") || t.name.includes("إنشائي"));
  const lastTask = tasks[tasks.length - 1];
  const isApproved = approvalTask?.status === "done" || lastTask?.status === "done";

  const handleUpload = (slot: DocSlot) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.dwg,.dxf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `${slot.label} - ${clientName}`);
      formData.append("category", slot.category);
      formData.append("projectId", projectId);
      if (clientId) formData.append("clientId", clientId);

      uploadDoc.mutate(formData, {
        onSuccess: () => toast.success(`تم رفع ${slot.label} بنجاح`),
        onError: () => toast.error("فشل رفع الملف"),
      });
    };
    input.click();
  };

  const handleSendToClient = () => {
    const phone = clientPhone?.replace(/[^0-9]/g, "") || "";
    const msg = encodeURIComponent(
      `مرحباً ${clientName}،\nتم الانتهاء من المخططات الإنشائية والواجهات.\nنرجو مراجعتها وإبداء ملاحظاتكم.\n\nمكتب ديناميك للاستشارات الهندسية`
    );
    window.open(`https://wa.me/${phone.startsWith("965") ? phone : "965" + phone}?text=${msg}`, "_blank");
  };

  const handleApprove = () => {
    const taskToApprove = approvalTask || lastTask;
    if (taskToApprove) {
      approveTask.mutate(taskToApprove.id, {
        onSuccess: (data) => {
          toast.success("تم اعتماد المخططات — سيتم إطلاق المرحلة التالية");
          if (data.triggered?.length) {
            toast.info(`تم تفعيل: ${data.triggered.join("، ")}`);
          }
        },
      });
    }
  };

  return (
    <div className="rounded-2xl border-2 overflow-hidden transition-all" style={{ borderColor: phaseColor + "40" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        style={{ backgroundColor: phaseColor + "10" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: phaseColor + "20" }}>
            <Layers className="w-4 h-4" style={{ color: phaseColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold">الإنشائي والواجهات</h3>
            <p className="text-[10px] text-muted-foreground">المخططات الإنشائية + الواجهات + الإخراج</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isApproved && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <Badge variant="secondary" className="text-[10px] h-5">
            {uploadedCount}/{DOC_SLOTS.length}
          </Badge>
          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: phaseColor }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3 space-y-3">
          {/* Document Slots */}
          <div className="space-y-2">
            {DOC_SLOTS.map(slot => {
              const doc = getSlotDoc(slot);
              return (
                <div
                  key={slot.key}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                    doc ? "bg-green-50 border-green-200" : "bg-background hover:border-gray-300"
                  }`}
                >
                  <div className={`shrink-0 ${doc ? "text-green-600" : "text-muted-foreground"}`}>
                    {doc ? <CheckCircle2 className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs flex-1 ${doc ? "text-green-700 font-medium" : ""}`}>
                    {slot.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {doc && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={doc ? "ghost" : "outline"}
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleUpload(slot)}
                      disabled={uploadDoc.isPending}
                    >
                      {uploadDoc.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                        doc ? "تحديث" : "رفع"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8 gap-1.5"
              onClick={handleSendToClient}
              disabled={uploadedCount === 0}
            >
              <Send className="w-3.5 h-3.5" />
              إرسال للعميل
            </Button>
          </div>

          {/* Approval */}
          {!isApproved && uploadedCount >= 2 && (
            <Button
              size="sm"
              className="w-full text-xs h-9 text-white gap-1.5"
              style={{ backgroundColor: "#16a34a" }}
              onClick={handleApprove}
              disabled={approveTask.isPending}
            >
              {approveTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              اعتماد المخططات — إطلاق المرحلة التالية
            </Button>
          )}

          {isApproved && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">تم اعتماد المخططات</span>
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground">الإنشائي: م. أمين</span>
              <span className="text-[10px] text-muted-foreground">الواجهات: عفيف</span>
            </div>
            <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: phaseColor, color: phaseColor }}>
              {isApproved ? "مكتمل" : progress > 0 ? "جارٍ" : "لم يبدأ"}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
