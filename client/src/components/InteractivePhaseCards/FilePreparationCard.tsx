/**
 * كرت تجهيز الملف المدمج — Interactive File Preparation Card
 * يجمع كل مهام المرحلة الأولى في كرت واحد:
 * - رفع الوثائق (بطاقة مدنية، سند ملكية، خريطة موقع، وكالة)
 * - إرسال طلب تربة عبر إيميل
 * - إرسال طلب كهرباء عبر إيميل
 * - تعبئة النماذج
 */
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Mail, CheckCircle2, Circle, Loader2,
  ChevronDown, ChevronUp, Send, Zap, MapPin, CreditCard,
  Building2, AlertCircle, X
} from "lucide-react";
import { useUploadDocument, useDocuments, useSendEmail } from "@/lib/api";
import { toast } from "sonner";

interface FilePreparationCardProps {
  projectId: string;
  clientId?: string;
  clientName: string;
  projectName: string;
  area?: string;
  plot?: string;
  block?: string;
  phaseColor: string;
  tasks: Array<{ id: number; name: string; status: string; assignee?: string }>;
}

interface DocItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  category: string;
  required: boolean;
}

const REQUIRED_DOCS: DocItem[] = [
  { key: "civil_id", label: "البطاقة المدنية", icon: <CreditCard className="w-4 h-4" />, category: "بيانات العميل", required: true },
  { key: "ownership", label: "سند الملكية", icon: <FileText className="w-4 h-4" />, category: "بيانات العميل", required: true },
  { key: "site_map", label: "خريطة الموقع", icon: <MapPin className="w-4 h-4" />, category: "بيانات العميل", required: true },
  { key: "power_attorney", label: "الوكالة (إن وجدت)", icon: <FileText className="w-4 h-4" />, category: "بيانات العميل", required: false },
  { key: "old_plans", label: "المخططات القديمة (إن وجدت)", icon: <Building2 className="w-4 h-4" />, category: "مخططات", required: false },
];

export default function FilePreparationCard({
  projectId, clientId, clientName, projectName, area, plot, block, phaseColor, tasks
}: FilePreparationCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showSoilEmail, setShowSoilEmail] = useState(false);
  const [showElecEmail, setShowElecEmail] = useState(false);
  const [soilEmail, setSoilEmail] = useState("info@soiltest.com.kw");
  const [elecEmail, setElecEmail] = useState("mew@mew.gov.kw");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const uploadDoc = useUploadDocument();
  const sendEmail = useSendEmail();
  const { data: docs } = useDocuments({ projectId });

  // Check which docs are already uploaded
  const uploadedDocs = new Set<string>(
    (docs || []).map(d => {
      if (d.name.includes("بطاقة") || d.name.includes("مدنية")) return "civil_id";
      if (d.name.includes("سند") || d.name.includes("ملكية")) return "ownership";
      if (d.name.includes("خريطة") || d.name.includes("موقع")) return "site_map";
      if (d.name.includes("وكالة")) return "power_attorney";
      if (d.name.includes("مخطط") || d.name.includes("قديم")) return "old_plans";
      return "";
    })
  );

  const uploadedCount = REQUIRED_DOCS.filter(d => d.required && uploadedDocs.has(d.key)).length;
  const requiredCount = REQUIRED_DOCS.filter(d => d.required).length;
  const progress = Math.round((uploadedCount / requiredCount) * 100);

  const handleFileUpload = (docItem: DocItem) => {
    setUploadingKey(docItem.key);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingKey) return;

    const docItem = REQUIRED_DOCS.find(d => d.key === uploadingKey);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", docItem?.label || file.name);
    formData.append("category", docItem?.category || "بيانات العميل");
    formData.append("projectId", projectId);
    if (clientId) formData.append("clientId", clientId);

    uploadDoc.mutate(formData, {
      onSuccess: () => {
        toast.success(`تم رفع ${docItem?.label || file.name} بنجاح`);
        setUploadingKey(null);
      },
      onError: () => {
        toast.error("فشل رفع الملف");
        setUploadingKey(null);
      },
    });
    e.target.value = "";
  };

  const handleSendSoilRequest = () => {
    const siteMapDoc = (docs || []).find(d => d.name.includes("خريطة") || d.name.includes("موقع"));
    const ownershipDoc = (docs || []).find(d => d.name.includes("سند") || d.name.includes("ملكية"));

    sendEmail.mutate({
      to: soilEmail,
      subject: `طلب فحص تربة — ${projectName}`,
      body: `السادة شركة فحص التربة المحترمين،\n\nنرجو إجراء فحص تربة للموقع التالي:\n- المشروع: ${projectName}\n- المنطقة: ${area || "—"}\n- القطعة: ${plot || "—"}\n- القسيمة: ${block || "—"}\n- المالك: ${clientName}\n\nمرفق خريطة الموقع وسند الملكية.\n\nمع التحية,\nمكتب ديناميك للاستشارات الهندسية`,
      attachmentUrls: [siteMapDoc?.url, ownershipDoc?.url].filter(Boolean) as string[],
      projectId,
      type: "soil",
    }, {
      onSuccess: () => {
        toast.success("تم إرسال طلب فحص التربة");
        setShowSoilEmail(false);
      },
      onError: () => toast.error("فشل إرسال الإيميل"),
    });
  };

  const handleSendElecRequest = () => {
    const ownershipDoc = (docs || []).find(d => d.name.includes("سند") || d.name.includes("ملكية"));

    sendEmail.mutate({
      to: elecEmail,
      subject: `طلب إمكانية كهرباء — ${projectName}`,
      body: `السادة وزارة الكهرباء والماء المحترمين،\n\nنرجو إصدار شهادة إمكانية كهرباء للموقع التالي:\n- المنطقة: ${area || "—"}\n- القطعة: ${plot || "—"}\n- القسيمة: ${block || "—"}\n- المالك: ${clientName}\n\nمرفق سند الملكية.\n\nمع التحية,\nمكتب ديناميك للاستشارات الهندسية`,
      attachmentUrls: ownershipDoc ? [ownershipDoc.url] : [],
      projectId,
      type: "electricity",
    }, {
      onSuccess: () => {
        toast.success("تم إرسال طلب إمكانية الكهرباء");
        setShowElecEmail(false);
      },
      onError: () => toast.error("فشل إرسال الإيميل"),
    });
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
            <FileText className="w-4 h-4" style={{ color: phaseColor }} />
          </div>
          <div>
            <h3 className="text-sm font-bold">تجهيز الملف</h3>
            <p className="text-[10px] text-muted-foreground">جمع الوثائق وإرسال الطلبات</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] h-5">
            {uploadedCount}/{requiredCount} مستند
          </Badge>
          <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: phaseColor }} />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-3 space-y-4">
          {/* Documents Upload Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              الوثائق المطلوبة
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQUIRED_DOCS.map(doc => {
                const isUploaded = uploadedDocs.has(doc.key);
                const isUploading = uploadingKey === doc.key && uploadDoc.isPending;
                return (
                  <div
                    key={doc.key}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      isUploaded ? "bg-green-50 border-green-200" : "bg-background hover:border-gray-300"
                    }`}
                  >
                    <div className={`shrink-0 ${isUploaded ? "text-green-600" : "text-muted-foreground"}`}>
                      {isUploaded ? <CheckCircle2 className="w-4 h-4" /> : doc.icon}
                    </div>
                    <span className={`text-xs flex-1 ${isUploaded ? "text-green-700 font-medium" : ""}`}>
                      {doc.label}
                      {!doc.required && <span className="text-muted-foreground mr-1">(اختياري)</span>}
                    </span>
                    <Button
                      size="sm"
                      variant={isUploaded ? "ghost" : "outline"}
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleFileUpload(doc)}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                        isUploaded ? "تحديث" : "رفع"
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              إرسال الطلبات
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => setShowSoilEmail(true)}
              >
                <Mail className="w-3.5 h-3.5" />
                طلب فحص تربة
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 gap-1.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => setShowElecEmail(true)}
              >
                <Zap className="w-3.5 h-3.5" />
                طلب إمكانية كهرباء
              </Button>
            </div>
          </div>

          {/* Soil Email Dialog */}
          {showSoilEmail && (
            <div className="border rounded-xl p-3 space-y-2 bg-amber-50/50 border-amber-200">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-amber-800">إرسال طلب فحص تربة</h5>
                <button onClick={() => setShowSoilEmail(false)} className="p-1 rounded hover:bg-amber-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">إيميل شركة التربة</label>
                <input
                  className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white mt-0.5"
                  value={soilEmail}
                  onChange={e => setSoilEmail(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">
                <p>سيتم إرفاق: خريطة الموقع + سند الملكية</p>
                {!uploadedDocs.has("site_map") && (
                  <p className="text-amber-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    يجب رفع خريطة الموقع أولاً
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="w-full text-xs h-7 text-white"
                style={{ backgroundColor: "#d97706" }}
                onClick={handleSendSoilRequest}
                    disabled={sendEmail.isPending || !uploadedDocs.has("site_map" as string)}
              >
                {sendEmail.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 ml-1" />}
                إرسال الطلب
              </Button>
            </div>
          )}

          {/* Electricity Email Dialog */}
          {showElecEmail && (
            <div className="border rounded-xl p-3 space-y-2 bg-blue-50/50 border-blue-200">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-blue-800">إرسال طلب إمكانية كهرباء</h5>
                <button onClick={() => setShowElecEmail(false)} className="p-1 rounded hover:bg-blue-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">إيميل وزارة الكهرباء</label>
                <input
                  className="w-full border rounded-lg px-2 py-1.5 text-xs bg-white mt-0.5"
                  value={elecEmail}
                  onChange={e => setElecEmail(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="text-[10px] text-muted-foreground">
                <p>سيتم إرفاق: سند الملكية</p>
                {!uploadedDocs.has("ownership") && (
                  <p className="text-blue-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    يجب رفع سند الملكية أولاً
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="w-full text-xs h-7 text-white"
                style={{ backgroundColor: "#2563eb" }}
                onClick={handleSendElecRequest}
                    disabled={sendEmail.isPending || !uploadedDocs.has("ownership" as string)}
              >
                {sendEmail.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 ml-1" />}
                إرسال الطلب
              </Button>
            </div>
          )}

          {/* Assignee */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-[10px] text-muted-foreground">المسؤول: ثروت (السكرتير)</span>
            <Badge variant="outline" className="text-[10px] h-5" style={{ borderColor: phaseColor, color: phaseColor }}>
              {progress === 100 ? "مكتمل" : "جارٍ"}
            </Badge>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={onFileSelected}
      />
    </div>
  );
}
