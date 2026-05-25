/**
 * كرت التصميم المعماري المدمج — Interactive Architectural Design Card
 * يجمع كل مهام مرحلة التصميم المعماري في كرت واحد:
 * - فتح نموذج الطلبات
 * - رفع الكروكي + إرسال للعميل
 * - جلسات التصحيح (تسجيل ملاحظات)
 * - اعتماد الكروكي → إطلاق المرحلة التالية
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pencil, FileText, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, Send, MessageSquare,
  Calendar, Plus, Check, X, ExternalLink
} from "lucide-react";
import { useUploadDocument, useDocuments, useProjectMeetings, useCreateProjectMeeting, useApproveTask } from "@/lib/api";
import { toast } from "sonner";

interface ArchitecturalDesignCardProps {
  projectId: string;
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  phaseColor: string;
  tasks: Array<{ id: number; name: string; status: string; assignee?: string }>;
  onOpenBrief: () => void;
}

export default function ArchitecturalDesignCard({
  projectId, clientId, clientName, clientPhone, phaseColor, tasks, onOpenBrief
}: ArchitecturalDesignCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingAgreed, setMeetingAgreed] = useState("");

  const uploadDoc = useUploadDocument();
  const approveTask = useApproveTask(projectId);
  const { data: docs } = useDocuments({ projectId });
  const { data: meetings } = useProjectMeetings(projectId);
  const createMeeting = useCreateProjectMeeting(projectId);

  // Find sketch doc
  const sketchDoc = (docs || []).find(d =>
    d.name.includes("كروكي") || d.name.includes("sketch") || d.category === "مخططات معمارية"
  );

  // Find approval task
  const approvalTask = tasks.find(t => t.name.includes("اعتماد"));
  const sketchTask = tasks.find(t => t.name.includes("كروكي") || t.name.includes("تصميم"));
  const isApproved = approvalTask?.status === "done";

  // Sub-steps status
  const steps = [
    { label: "جلسة الطلبات", done: (meetings || []).length > 0 },
    { label: "تصميم الكروكي", done: !!sketchDoc },
    { label: "إرسال للعميل", done: (meetings || []).some(m => JSON.parse(m.agreed || "[]").some((a: string) => a.includes("إرسال"))) },
    { label: "اعتماد الكروكي", done: isApproved },
  ];
  const doneSteps = steps.filter(s => s.done).length;
  const progress = Math.round((doneSteps / steps.length) * 100);

  const handleSketchUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png,.dwg";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", `كروكي - ${clientName}`);
      formData.append("category", "مخططات معمارية");
      formData.append("projectId", projectId);
      if (clientId) formData.append("clientId", clientId);

      uploadDoc.mutate(formData, {
        onSuccess: () => toast.success("تم رفع الكروكي بنجاح"),
        onError: () => toast.error("فشل رفع الملف"),
      });
    };
    input.click();
  };

  const handleSendToClient = () => {
    const phone = clientPhone?.replace(/[^0-9]/g, "") || "";
    const msg = encodeURIComponent(
      `مرحباً ${clientName}،\nتم الانتهاء من الكروكي المبدئي لمشروعكم.\nنرجو مراجعته وإبداء ملاحظاتكم.\n\nمكتب ديناميك للاستشارات الهندسية`
    );
    window.open(`https://wa.me/${phone.startsWith("965") ? phone : "965" + phone}?text=${msg}`, "_blank");
  };

  const handleAddMeeting = () => {
    if (!meetingNotes.trim()) return;
    createMeeting.mutate({
      date: new Date().toISOString().split("T")[0],
      attendees: JSON.stringify(["م. مصطفى", clientName]),
      agreed: JSON.stringify(meetingAgreed ? meetingAgreed.split("\n").filter(Boolean) : []),
      notes: meetingNotes,
      status: "completed",
    }, {
      onSuccess: () => {
        toast.success("تم تسجيل الجلسة");
        setShowAddMeeting(false);
        setMeetingNotes("");
        setMeetingAgreed("");
      },
    });
  };

  const handleApprove = () => {
    if (!approvalTask) {
      // If no specific approval task, approve the sketch task
      const taskToApprove = sketchTask || tasks[tasks.length - 1];
      if (taskToApprove) {
        approveTask.mutate(taskToApprove.id, {
          onSuccess: (data) => {
            toast.success("تم اعتماد الكروكي — سيتم إطلاق المرحلة التالية");
            if (data.triggered?.length) {
              toast.info(`تم تفعيل: ${data.triggered.join("، ")}`);
            }
          },
        });
      }
    } else {
      approveTask.mutate(approvalTask.id, {
        onSuccess: (data) => {
          toast.success("تم اعتماد الكروكي — سيتم إطلاق المرحلة التالية");
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
            <Pencil className="w-4 h-4" style={{ color: phaseColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold">التصميم المعماري</h3>
            <p className="text-[10px] text-muted-foreground">الكروكي والجلسات والاعتماد</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isApproved && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: phaseColor }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3 space-y-3">
          {/* Steps Progress */}
          <div className="flex items-center gap-1">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                  step.done ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {step.done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className="text-[9px] text-muted-foreground truncate hidden sm:inline">{step.label}</span>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded ${step.done ? "bg-green-300" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-9 gap-1.5"
              onClick={onOpenBrief}
            >
              <FileText className="w-3.5 h-3.5" />
              نموذج الطلبات
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-9 gap-1.5"
              onClick={handleSketchUpload}
              disabled={uploadDoc.isPending}
            >
              {uploadDoc.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              {sketchDoc ? "تحديث الكروكي" : "رفع الكروكي"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-9 gap-1.5"
              onClick={handleSendToClient}
              disabled={!sketchDoc}
            >
              <Send className="w-3.5 h-3.5" />
              إرسال للعميل
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-9 gap-1.5"
              onClick={() => setShowAddMeeting(true)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              تسجيل جلسة
            </Button>
          </div>

          {/* Meetings Log */}
          {(meetings || []).length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                سجل الجلسات ({(meetings || []).length})
              </h4>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {(meetings || []).slice(0, 3).map(m => (
                  <div key={m.id} className="flex items-start gap-2 p-1.5 rounded-lg bg-muted/30 text-[10px]">
                    <span className="text-muted-foreground shrink-0" dir="ltr">{m.date}</span>
                    <span className="flex-1 truncate">{m.notes}</span>
                    <Badge variant="secondary" className="text-[8px] h-4 shrink-0">
                      {m.status === "completed" ? "مكتمل" : "معلق"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Meeting Form */}
          {showAddMeeting && (
            <div className="border rounded-xl p-3 space-y-2 bg-muted/20">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold">تسجيل جلسة تصميم</h5>
                <button onClick={() => setShowAddMeeting(false)} className="p-1 rounded hover:bg-muted">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">ملاحظات الجلسة *</label>
                <textarea
                  className="w-full border rounded-lg px-2 py-1.5 text-xs bg-background mt-0.5 min-h-[60px]"
                  placeholder="ملاحظات العميل، التعديلات المطلوبة..."
                  value={meetingNotes}
                  onChange={e => setMeetingNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">ما تم الاتفاق عليه (سطر لكل بند)</label>
                <textarea
                  className="w-full border rounded-lg px-2 py-1.5 text-xs bg-background mt-0.5 min-h-[40px]"
                  placeholder="تعديل غرفة النوم الرئيسية&#10;إضافة بلكونة..."
                  value={meetingAgreed}
                  onChange={e => setMeetingAgreed(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full text-xs h-7 text-white"
                style={{ backgroundColor: phaseColor }}
                onClick={handleAddMeeting}
                disabled={createMeeting.isPending || !meetingNotes.trim()}
              >
                {createMeeting.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3 ml-1" />}
                حفظ الجلسة
              </Button>
            </div>
          )}

          {/* Approval Button */}
          {!isApproved && sketchDoc && (
            <Button
              size="sm"
              className="w-full text-xs h-9 text-white gap-1.5"
              style={{ backgroundColor: "#16a34a" }}
              onClick={handleApprove}
              disabled={approveTask.isPending}
            >
              {approveTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              اعتماد الكروكي — إطلاق المرحلة التالية
            </Button>
          )}

          {isApproved && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">تم اعتماد الكروكي</span>
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-[10px] text-muted-foreground">المسؤول: م. مصطفى (المعماري)</span>
            <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: phaseColor, color: phaseColor }}>
              {isApproved ? "مكتمل" : progress > 0 ? "جارٍ" : "لم يبدأ"}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
