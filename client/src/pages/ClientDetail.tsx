import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowRight, Phone, MapPin, FileText, Building2, Home,
  Users, Edit2, Plus, Download, Upload, CheckCircle2,
  Clock, AlertCircle, Star, MessageSquare, Mail,
  CreditCard, Calendar, Folder, ChevronDown, ChevronUp,
  ExternalLink, Copy, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { clientsDB, Client } from "./Clients";

const projectTypeColors: Record<string, string> = {
  "سكن خاص": "bg-blue-500",
  "صناعي": "bg-orange-500",
  "استثماري": "bg-green-500",
  "تجاري": "bg-yellow-500",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "نشط", color: "bg-green-100 text-green-700" },
  completed: { label: "منتهي", color: "bg-gray-100 text-gray-600" },
  pending: { label: "بانتظار", color: "bg-yellow-100 text-yellow-700" },
};

// بيانات المشاريع المرتبطة (تجريبية)
const projectsPreview: Record<string, { id: string; name: string; status: string; phase: string; progress: number; date: string }[]> = {
  "C001": [
    { id: "S00048", name: "بناء جديد - خيطان ق2/212", status: "نشط", phase: "المرحلة الرابعة", progress: 55, date: "2025-01-15" },
  ],
  "C002": [
    { id: "S00045", name: "تعديل وإضافة - الفروانية ق5/88", status: "نشط", phase: "المرحلة الثانية", progress: 40, date: "2025-02-20" },
  ],
  "C003": [
    { id: "S00040", name: "تعديل - القادسية ق2/113", status: "مكتمل", phase: "مكتمل", progress: 100, date: "2024-11-10" },
    { id: "S00041", name: "إضافة - القادسية ق2/113", status: "نشط", phase: "المرحلة الأولى", progress: 20, date: "2025-03-01" },
  ],
  "C004": [
    { id: "S00035", name: "بناء صناعي - الشويخ ق3/44", status: "نشط", phase: "المرحلة الثالثة", progress: 70, date: "2024-09-05" },
  ],
  "C005": [
    { id: "S00030", name: "تعديل وإضافة - ضاحية صباح السالم ق9/225", status: "مكتمل", phase: "مكتمل", progress: 100, date: "2024-06-12" },
  ],
};

// مستندات العميل (تجريبية)
const docsPreview: Record<string, { name: string; type: string; status: "uploaded" | "missing" | "required"; date?: string }[]> = {
  "C001": [
    { name: "بطاقة مدنية - فهد العتيبي", type: "هوية", status: "uploaded", date: "2025-01-20" },
    { name: "بطاقة مدنية - نوف العنزي", type: "هوية", status: "uploaded", date: "2025-01-20" },
    { name: "وثيقة الأرض", type: "ملكية", status: "uploaded", date: "2025-01-22" },
    { name: "الموقع العام", type: "مخطط", status: "missing" },
  ],
  "C002": [
    { name: "بطاقة مدنية - محمد الرشيدي", type: "هوية", status: "uploaded", date: "2025-02-25" },
    { name: "وثيقة الأرض", type: "ملكية", status: "required" },
    { name: "الموقع العام", type: "مخطط", status: "required" },
  ],
};

export default function ClientDetail() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"info" | "projects" | "docs" | "forms">("info");
  const [showParcel, setShowParcel] = useState(true);

  const client = clientsDB.find((c) => c.id === params.id);

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-500 mb-4">العميل غير موجود</p>
          <Button onClick={() => navigate("/clients")}>العودة للعملاء</Button>
        </div>
      </div>
    );
  }

  const projects = projectsPreview[client.id] || [];
  const docs = docsPreview[client.id] || [];
  const statusInfo = statusLabels[client.status];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ ${label}`);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <button onClick={() => navigate("/clients")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3">
            <ArrowRight className="w-4 h-4" />
            العملاء
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* أفاتار */}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm ${
                client.type === "company" ? "bg-purple-100 text-purple-700" :
                client.type === "heirs" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {client.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-gray-900">{client.name}</h1>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${projectTypeColors[client.projectType] || "bg-gray-400"}`} />
                    {client.projectType} — {client.serviceType}
                  </span>
                  <span>·</span>
                  <span>{client.id}</span>
                  <span>·</span>
                  <span>منذ {client.createdAt}</span>
                </div>
              </div>
            </div>

            {/* أزرار التواصل */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => window.open(`tel:${client.phone}`)}>
                <Phone className="w-4 h-4" />
                اتصال
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5"
                onClick={() => window.open(`https://wa.me/965${client.phone}`)}>
                <MessageSquare className="w-4 h-4 text-green-600" />
                واتساب
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5"
                onClick={() => navigate(`/projects/new?client=${client.id}`)}>
                <Plus className="w-4 h-4" />
                مشروع جديد
              </Button>
            </div>
          </div>

          {/* التبويبات */}
          <div className="flex gap-1 mt-4 border-b -mb-px">
            {[
              { key: "info", label: "بيانات العميل", icon: Users },
              { key: "projects", label: `المشاريع (${projects.length})`, icon: Building2 },
              { key: "docs", label: `المستندات (${docs.length})`, icon: FileText },
              { key: "forms", label: "نماذج البلدية", icon: Download },
            ].map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-6 max-w-4xl">

        {/* تبويب بيانات العميل */}
        {activeTab === "info" && (
          <div className="space-y-4">
            {/* البيانات الشخصية */}
            <div className="bg-white rounded-2xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">البيانات الشخصية</h3>
                <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                  <Edit2 className="w-3.5 h-3.5" /> تعديل
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="الاسم الكامل" value={client.name} onCopy={() => copyToClipboard(client.name, "الاسم")} />
                <InfoRow label="رقم الهاتف" value={client.phone} dir="ltr" onCopy={() => copyToClipboard(client.phone, "الهاتف")} />
                {client.phone2 && <InfoRow label="هاتف بديل" value={client.phone2} dir="ltr" />}
                {client.civilId && <InfoRow label="الرقم المدني" value={client.civilId} dir="ltr" onCopy={() => copyToClipboard(client.civilId, "الرقم المدني")} />}
                {client.email && <InfoRow label="البريد الإلكتروني" value={client.email} dir="ltr" />}
                {client.spouseName && <InfoRow label="اسم الزوجة" value={client.spouseName} />}
                {client.spouseCivilId && <InfoRow label="رقم مدني الزوجة" value={client.spouseCivilId} dir="ltr" />}
              </div>
              {client.notes && (
                <div className="mt-4 bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
                  <span className="font-medium">ملاحظة: </span>{client.notes}
                </div>
              )}
            </div>

            {/* بيانات القسيمة */}
            <div className="bg-white rounded-2xl border p-5">
              <button className="flex items-center justify-between w-full mb-4"
                onClick={() => setShowParcel(!showParcel)}>
                <h3 className="font-semibold text-gray-800">بيانات القسيمة</h3>
                <div className="flex items-center gap-2">
                  <button className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                    onClick={(e) => { e.stopPropagation(); }}>
                    <Edit2 className="w-3.5 h-3.5" /> تعديل
                  </button>
                  {showParcel ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>
              {showParcel && (
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="المنطقة" value={client.area} />
                  <InfoRow label="القطعة" value={client.block} />
                  <InfoRow label="القسيمة" value={client.plot} />
                  <InfoRow label="المساحة" value={`${client.parcelArea} م²`} />
                  <InfoRow label="شكل القسيمة" value={client.parcelShape} />
                  <InfoRow label="وجهة القسيمة" value={client.parcelFacing} />
                  {client.ownershipDoc && <InfoRow label="رقم وثيقة الملكية" value={client.ownershipDoc} onCopy={() => copyToClipboard(client.ownershipDoc, "رقم الوثيقة")} />}
                  {client.ownershipDate && <InfoRow label="تاريخ الوثيقة" value={client.ownershipDate} />}
                </div>
              )}
            </div>
          </div>
        )}

        {/* تبويب المشاريع */}
        {activeTab === "projects" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{projects.length} مشروع مرتبط</h3>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-1.5">
                <Plus className="w-4 h-4" /> مشروع جديد
              </Button>
            </div>
            {projects.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا يوجد مشاريع مرتبطة بهذا العميل</p>
              </div>
            ) : (
              projects.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.id} · {p.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="text-xs text-gray-500 mb-1">{p.phase}</div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full">
                        <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === "مكتمل" ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"
                    }`}>{p.status}</span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* تبويب المستندات */}
        {activeTab === "docs" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">مستندات العميل</h3>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Upload className="w-4 h-4" /> رفع مستند
              </Button>
            </div>

            {/* إحصائيات المستندات */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "مرفوعة", count: docs.filter((d) => d.status === "uploaded").length, color: "bg-green-50 text-green-700" },
                { label: "مطلوبة", count: docs.filter((d) => d.status === "required").length, color: "bg-yellow-50 text-yellow-700" },
                { label: "ناقصة", count: docs.filter((d) => d.status === "missing").length, color: "bg-red-50 text-red-700" },
              ].map((s) => (
                <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                  <div className="text-xl font-bold">{s.count}</div>
                  <div className="text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {docs.length === 0 ? (
              <div className="bg-white rounded-2xl border p-10 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>لا يوجد مستندات مرفوعة</p>
              </div>
            ) : (
              docs.map((doc, i) => (
                <div key={i} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      doc.status === "uploaded" ? "bg-green-100" :
                      doc.status === "missing" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      <FileText className={`w-4 h-4 ${
                        doc.status === "uploaded" ? "text-green-600" :
                        doc.status === "missing" ? "text-red-500" : "text-yellow-600"
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">{doc.name}</div>
                      <div className="text-xs text-gray-500">{doc.type}{doc.date ? ` · ${doc.date}` : ""}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      doc.status === "uploaded" ? "bg-green-100 text-green-700" :
                      doc.status === "missing" ? "bg-red-100 text-red-600" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {doc.status === "uploaded" ? "مرفوع ✓" : doc.status === "missing" ? "ناقص" : "مطلوب"}
                    </span>
                    {doc.status === "uploaded" ? (
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg" onClick={() => toast.info("جارٍ التحميل...")}>
                        <Download className="w-4 h-4 text-gray-500" />
                      </button>
                    ) : (
                      <button className="p-1.5 hover:bg-blue-50 rounded-lg" onClick={() => toast.info("اختر ملفاً للرفع")}>
                        <Upload className="w-4 h-4 text-blue-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* تبويب نماذج البلدية */}
        {activeTab === "forms" && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 mb-4">
              <strong>تعبئة تلقائية:</strong> النماذج ستُعبَّأ تلقائياً ببيانات العميل والقسيمة المحفوظة. تأكد من اكتمال بيانات العميل أولاً.
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">
              نماذج {client.serviceType} — {client.projectType}
            </h3>

            {/* نماذج البناء الجديد */}
            {client.serviceType === "بناء جديد" && (
              <div className="space-y-2">
                {[
                  { name: "إقرارات المكتب", pages: 7, desc: "7 نماذج فرعية: طلب رخصة، تعهدات المخططات، خطاب الاتفاق" },
                  { name: "تعهد تصميم إنشائي", pages: 1, desc: "تعهد المكتب بالتصميم الإنشائي" },
                  { name: "تعهد عدم المطالبة بالكهرباء", pages: 1, desc: "تعهد المالك بعدم المطالبة بالخدمات" },
                  { name: "تعهدات المالك", pages: 12, desc: "12 تعهد: عدم تأجير، خدمات، مناسيب، توكيل، بيانات" },
                  { name: "تعهد الاطلاع على شهادة الإسكان", pages: 2, desc: "تعهد الاطلاع على شهادة إلى من يهمه الأمر" },
                ].map((form, i) => (
                  <FormCard key={i} form={form} client={client} />
                ))}
              </div>
            )}

            {/* نماذج التعديل والإضافة */}
            {(client.serviceType === "تعديل وإضافة" || client.serviceType === "تعديل" || client.serviceType === "إضافة") && (
              <div className="space-y-2">
                {[
                  { name: "إقرارات المكتب", pages: 7, desc: "7 نماذج فرعية: طلب رخصة، تعهدات المخططات، خطاب الاتفاق" },
                  { name: "تعهد تصميم إنشائي", pages: 1, desc: "تعهد المكتب بالتصميم الإنشائي" },
                  { name: "تعهد عدم المطالبة بالكهرباء", pages: 1, desc: "تعهد المالك بعدم المطالبة بالخدمات" },
                  { name: "تعهدات المالك", pages: 12, desc: "12 تعهد: عدم تأجير، خدمات، مناسيب، توكيل، بيانات" },
                  { name: "تعهد الكشف على العقار وخلوه من المخالفات", pages: 4, desc: "3 نماذج: كشف العقار، مطابقة البناء القائم، المسؤولية الإنشائية" },
                ].map((form, i) => (
                  <FormCard key={i} form={form} client={client} />
                ))}
              </div>
            )}

            {/* زر تعبئة الكل */}
            <div className="pt-2">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 py-6 text-base"
                onClick={() => toast.success("جارٍ تعبئة جميع النماذج... (قريباً)")}>
                <Download className="w-5 h-5" />
                تعبئة وتحميل جميع النماذج دفعة واحدة
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// مكون صف المعلومات
function InfoRow({ label, value, dir: d, onCopy }: { label: string; value: string; dir?: string; onCopy?: () => void }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-gray-800" dir={d || "rtl"}>{value || "—"}</span>
        {onCopy && value && (
          <button onClick={onCopy} className="p-0.5 hover:bg-gray-100 rounded">
            <Copy className="w-3 h-3 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

// مكون كرت النموذج
function FormCard({ form, client }: { form: { name: string; pages: number; desc: string }; client: Client }) {
  const isComplete = client.area && client.block && client.plot && client.name && client.ownershipDoc;

  return (
    <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-800">{form.name}</div>
          <div className="text-xs text-gray-500">{form.desc} · {form.pages} صفحة</div>
        </div>
      </div>
      <Button size="sm" variant={isComplete ? "default" : "outline"}
        className={isComplete ? "bg-blue-600 hover:bg-blue-700 gap-1.5" : "gap-1.5 text-gray-500"}
        onClick={() => {
          if (!isComplete) {
            toast.error("يرجى إكمال بيانات القسيمة أولاً");
          } else {
            toast.success(`جارٍ تعبئة "${form.name}"... (قريباً)`);
          }
        }}>
        <Download className="w-3.5 h-3.5" />
        {isComplete ? "تعبئة وتحميل" : "بيانات ناقصة"}
      </Button>
    </div>
  );
}
