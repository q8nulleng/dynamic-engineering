/**
 * كرت التقديم للبلدية المدمج — Municipal Submission Card
 * يجمع مهام مرحلة تقديم البلدية:
 * - Checklist المستندات المطلوبة
 * - رقم المعاملة
 * - ملاحظات البلدية
 * - حالة المراجعة
 */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2, CheckCircle2, Loader2,
  ChevronDown, ChevronUp, ClipboardCheck,
  Hash, MessageSquare, AlertTriangle, Check, X
} from "lucide-react";
import { useDocuments, useApproveTask, useCreateProjectMeeting, useProjectMeetings } from "@/lib/api";
import { toast } from "sonner";

interface MunicipalSubmissionCardProps {
  projectId: string;
  phaseColor: string;
  tasks: Array<{ id: number; name: string; status: string; assignee?: string }>;
}

interface ChecklistItem {
  key: string;
  label: string;
  required: boolean;
}

const MUNICIPALITY_CHECKLIST: ChecklistItem[] = [
  { key: "arch_plans", label: "المخططات المعمارية (3 نسخ)", required: true },
  { key: "struct_plans", label: "المخططات الإنشائية (3 نسخ)", required: true },
  { key: "facades", label: "الواجهات الملونة", required: true },
  { key: "soil_report", label: "تقرير فحص التربة", required: true },
  { key: "elec_cert", label: "شهادة إمكانية كهرباء", required: true },
  { key: "civil_id", label: "صورة البطاقة المدنية", required: true },
  { key: "ownership", label: "صورة سند الملكية", required: true },
  { key: "eng_license", label: "ترخيص المكتب الهندسي", required: true },
  { key: "pledge", label: "تعهد المهندس المشرف", required: false },
  { key: "fire_license", label: "موافقة الإطفاء (إن لزم)", required: false },
];

export default function MunicipalSubmissionCard({
  projectId, phaseColor, tasks
}: MunicipalSubmissionCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [transactionNo, setTransactionNo] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submissionStatus, setSubmissionStatus] = useState<"pending" | "submitted" | "revision" | "approved">("pending");

  const approveTask = useApproveTask(projectId);
  const { data: docs } = useDocuments({ projectId });
  const { data: meetings } = useProjectMeetings(projectId);
  const createMeeting = useCreateProjectMeeting(projectId);

  // Auto-check items that have matching docs
  const getAutoChecked = () => {
    const auto = new Set<string>();
    const allDocs = docs || [];
    if (allDocs.some(d => d.category.includes("معمارية"))) auto.add("arch_plans");
    if (allDocs.some(d => d.category.includes("إنشائية") || d.name.includes("إنشائ"))) auto.add("struct_plans");
    if (allDocs.some(d => d.name.includes("واجه"))) auto.add("facades");
    if (allDocs.some(d => d.name.includes("تربة") || d.name.includes("soil"))) auto.add("soil_report");
    if (allDocs.some(d => d.name.includes("كهرباء") || d.name.includes("إمكانية"))) auto.add("elec_cert");
    if (allDocs.some(d => d.name.includes("بطاقة") || d.name.includes("مدنية"))) auto.add("civil_id");
    if (allDocs.some(d => d.name.includes("سند") || d.name.includes("ملكية"))) auto.add("ownership");
    return auto;
  };

  const autoChecked = getAutoChecked();
  const allChecked = new Set([...checkedItems, ...autoChecked]);
  const requiredItems = MUNICIPALITY_CHECKLIST.filter(i => i.required);
  const checkedRequired = requiredItems.filter(i => allChecked.has(i.key)).length;
  const progress = Math.round((checkedRequired / requiredItems.length) * 100);

  const toggleItem = (key: string) => {
    const next = new Set(checkedItems);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCheckedItems(next);
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    createMeeting.mutate({
      date: new Date().toISOString().split("T")[0],
      attendees: JSON.stringify(["البلدية"]),
      agreed: JSON.stringify([]),
      notes: `ملاحظة بلدية: ${noteText}`,
      changes: transactionNo ? `رقم المعاملة: ${transactionNo}` : "",
      status: "pending",
    }, {
      onSuccess: () => {
        toast.success("تم تسجيل ملاحظة البلدية");
        setShowNotes(false);
        setNoteText("");
      },
    });
  };

  const handleSubmit = () => {
    setSubmissionStatus("submitted");
    toast.success("تم تسجيل التقديم — بانتظار مراجعة البلدية");
  };

  const handleApprove = () => {
    const lastTask = tasks[tasks.length - 1];
    if (lastTask) {
      approveTask.mutate(lastTask.id, {
        onSuccess: (data) => {
          setSubmissionStatus("approved");
          toast.success("تم اعتماد المعاملة من البلدية!");
          if (data.triggered?.length) {
            toast.info(`تم تفعيل: ${data.triggered.join("، ")}`);
          }
        },
      });
    }
  };

  // Municipality notes from meetings
  const municipalityNotes = (meetings || []).filter(m => m.notes.includes("بلدية"));

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
            <Building2 className="w-4 h-4" style={{ color: phaseColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold">تقديم البلدية</h3>
            <p className="text-[10px] text-muted-foreground">المراجعة والاعتماد</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {submissionStatus === "approved" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
          {submissionStatus === "revision" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          <Badge variant="secondary" className="text-[10px] h-5">
            {checkedRequired}/{requiredItems.length}
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
          {/* Transaction Number */}
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <input
              className="flex-1 border rounded-lg px-2 py-1.5 text-xs bg-background"
              placeholder="رقم المعاملة (بعد التقديم)"
              value={transactionNo}
              onChange={e => setTransactionNo(e.target.value)}
              dir="ltr"
            />
            <Badge
              variant="outline"
              className={`text-[10px] h-5 shrink-0 ${
                submissionStatus === "approved" ? "border-green-300 text-green-700 bg-green-50" :
                submissionStatus === "submitted" ? "border-blue-300 text-blue-700 bg-blue-50" :
                submissionStatus === "revision" ? "border-amber-300 text-amber-700 bg-amber-50" :
                ""
              }`}
            >
              {submissionStatus === "approved" ? "معتمد" :
               submissionStatus === "submitted" ? "مقدّم" :
               submissionStatus === "revision" ? "مراجعة" :
               "لم يقدّم"}
            </Badge>
          </div>

          {/* Checklist */}
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <ClipboardCheck className="w-3 h-3" />
              قائمة المستندات المطلوبة
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {MUNICIPALITY_CHECKLIST.map(item => {
                const isChecked = allChecked.has(item.key);
                const isAuto = autoChecked.has(item.key);
                return (
                  <label
                    key={item.key}
                    className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-all ${
                      isChecked ? "bg-green-50" : "hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? "bg-green-600 border-green-600" : "border-gray-300"
                      }`}
                      onClick={() => !isAuto && toggleItem(item.key)}
                    >
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-xs flex-1 ${isChecked ? "text-green-700 line-through" : ""}`}>
                      {item.label}
                    </span>
                    {isAuto && (
                      <Badge variant="secondary" className="text-[8px] h-4">تلقائي</Badge>
                    )}
                    {!item.required && !isChecked && (
                      <span className="text-[9px] text-muted-foreground">(اختياري)</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Municipality Notes */}
          {municipalityNotes.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                ملاحظات البلدية
              </h4>
              <div className="space-y-1">
                {municipalityNotes.map(n => (
                  <div key={n.id} className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px]">
                    <span className="text-muted-foreground" dir="ltr">{n.date} — </span>
                    {n.notes.replace("ملاحظة بلدية: ", "")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-8 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => setShowNotes(true)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              ملاحظة بلدية
            </Button>
            {submissionStatus === "pending" && (
              <Button
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5 text-white"
                style={{ backgroundColor: phaseColor }}
                onClick={handleSubmit}
                disabled={progress < 100}
              >
                <Building2 className="w-3.5 h-3.5" />
                تسجيل التقديم
              </Button>
            )}
            {submissionStatus === "revision" && (
              <Button
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5 text-white"
                style={{ backgroundColor: phaseColor }}
                onClick={() => setSubmissionStatus("submitted")}
              >
                إعادة التقديم
              </Button>
            )}
          </div>

          {/* Add Note Form */}
          {showNotes && (
            <div className="border rounded-xl p-3 space-y-2 bg-amber-50/50 border-amber-200">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-800">تسجيل ملاحظة البلدية</h5>
                <button onClick={() => setShowNotes(false)} className="p-1 rounded hover:bg-amber-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white mt-0.5 min-h-[60px]"
                placeholder="ملاحظات المراجع..."
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs h-7 border-amber-300 text-amber-700"
                  onClick={() => { setSubmissionStatus("revision"); setShowNotes(false); }}
                >
                  مطلوب تعديل
                </Button>
                <Button
                  size="sm"
                  className="flex-1 text-xs h-7 text-white"
                  style={{ backgroundColor: "#d97706" }}
                  onClick={handleAddNote}
                  disabled={createMeeting.isPending || !noteText.trim()}
                >
                  {createMeeting.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "حفظ"}
                </Button>
              </div>
            </div>
          )}

          {/* Final Approval */}
          {submissionStatus === "submitted" && (
            <Button
              size="sm"
              className="w-full text-xs h-9 text-white gap-1.5"
              style={{ backgroundColor: "#16a34a" }}
              onClick={handleApprove}
              disabled={approveTask.isPending}
            >
              {approveTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              تم الاعتماد من البلدية
            </Button>
          )}

          {submissionStatus === "approved" && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">تم اعتماد المعاملة من البلدية</span>
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-[10px] text-muted-foreground">المسؤول: ثروت (السكرتير)</span>
            <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: phaseColor, color: phaseColor }}>
              {submissionStatus === "approved" ? "مكتمل" : submissionStatus === "submitted" ? "مقدّم" : "جارٍ"}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
