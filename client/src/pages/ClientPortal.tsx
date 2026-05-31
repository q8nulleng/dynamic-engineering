/*
 * Client Portal — بوابة العميل (عرض ما يراه العميل)
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Globe, FileText, FolderOpen, MessageSquare, Clock,
  CheckCircle2, Building2, Calendar, Download, Phone,
  CreditCard, User,
} from "lucide-react";
import { useClients, useProjects, useDocuments, useInvoices, useProjectBrief } from "@/lib/api";

const CONTRACT_PHASES = [
  "تجهيز الملف", "التصميم المعماري", "التصميم الإنشائي",
  "الرسم والإخراج", "تقديم البلدية", "الإشراف",
];

export default function ClientPortal() {
  const { data: clients = [] } = useClients();
  const { data: allProjects = [] } = useProjects();
  const { data: allDocs = [] } = useDocuments();
  const { data: allInvoices = [] } = useInvoices();

  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const client = clients.find((c) => c.id === selectedClientId) || null;
  const clientProjects = allProjects.filter((p) => p.clientId === selectedClientId);
  const clientDocs = allDocs.filter((d) => d.clientId === selectedClientId);
  const clientInvoices = allInvoices.filter(
    (i) => i.clientId === selectedClientId || (client && i.client === client.name)
  );

  const mainProject = clientProjects[0] || null;
  const { data: projectBrief } = useProjectBrief(mainProject?.id || "");

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">عرض تجريبي لما سيراه العميل عند تسجيل الدخول</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="اختر عميلاً لعرض بوابته..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs gap-1">
            <Globe className="w-3 h-3" />
            بوابة العميل
          </Badge>
        </div>
      </div>

      {!client ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground font-medium">اختر عميلاً من القائمة أعلاه</p>
            <p className="text-xs text-muted-foreground mt-1">ستظهر هنا نظرة العميل على مشروعه وملفاته ودفعاته</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Client Banner */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="p-6" style={{ background: "linear-gradient(135deg, oklch(0.30 0.05 250), oklch(0.22 0.04 250))" }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
                  style={{ backgroundColor: "oklch(0.72 0.10 60)", color: "white" }}>
                  {client.name.charAt(0)}
                </div>
                <div className="text-white flex-1">
                  <h3 className="text-lg font-bold">{client.name}</h3>
                  {mainProject && (
                    <p className="text-white/70 text-sm">
                      مشروع: {mainProject.name} — {mainProject.type}
                    </p>
                  )}
                  <p className="text-white/50 text-xs mt-0.5">{clientProjects.length} مشروع · {clientDocs.length} مستند</p>
                </div>
                {mainProject && (
                  <div className="text-right shrink-0">
                    <p className="text-white/70 text-xs">نسبة الإنجاز</p>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk'" }}>
                      {mainProject.progress}%
                    </p>
                  </div>
                )}
              </div>
              {mainProject && <Progress value={mainProject.progress} className="mt-4 h-2 bg-white/20" />}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Timeline + Invoices */}
            <div className="lg:col-span-2 space-y-5">

              {/* Project timeline from phases */}
              {clientProjects.length > 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                      مراحل المشروع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientProjects.map((project) => {
                      const phases = project.phases || [];
                      const displayPhases = phases.length > 0
                        ? phases
                        : CONTRACT_PHASES.map((title, i) => ({
                            id: i,
                            title,
                            tasks: [] as { status: string }[],
                          }));
                      return (
                        <div key={project.id} className="mb-4 last:mb-0">
                          {clientProjects.length > 1 && (
                            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {project.name}
                            </p>
                          )}
                          <div className="space-y-0">
                            {displayPhases.map((phase, i) => {
                              const allDone = phase.tasks.length > 0 && phase.tasks.every((t) => t.status === "done");
                              const hasInProgress = phase.tasks.some((t) => t.status === "in_progress");
                              const isCompleted = allDone;
                              const isCurrent = !isCompleted && hasInProgress;
                              return (
                                <div key={phase.id} className="flex gap-4 pb-5 last:pb-0">
                                  <div className="flex flex-col items-center">
                                    {isCompleted ? (
                                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : isCurrent ? (
                                      <div className="w-6 h-6 rounded-full border-2 border-blue-500 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                                    )}
                                    {i < displayPhases.length - 1 && (
                                      <div className={`w-0.5 flex-1 mt-2 ${isCompleted ? "bg-green-300" : "bg-gray-200"}`} />
                                    )}
                                  </div>
                                  <div className="flex-1 pb-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-medium">{phase.title}</h4>
                                      <Badge
                                        variant={isCompleted ? "default" : isCurrent ? "secondary" : "outline"}
                                        className="text-xs"
                                        style={isCompleted ? { backgroundColor: "oklch(0.55 0.15 150)" } : {}}
                                      >
                                        {isCompleted ? "مكتمل" : isCurrent ? "قيد التنفيذ" : "قادم"}
                                      </Badge>
                                    </div>
                                    {phase.tasks.length > 0 && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {phase.tasks.filter((t) => t.status === "done").length} / {phase.tasks.length} مهمة مكتملة
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    لا يوجد مشاريع مرتبطة بهذا العميل
                  </CardContent>
                </Card>
              )}

              {/* Project Brief / نموذج الطلبات */}
              {projectBrief && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                      نموذج طلبات المشروع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {/* بيانات المالك */}
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                          <User className="w-3 h-3" /> بيانات المالك
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">الاسم</p>
                            <p className="font-medium">{projectBrief.ownerName || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">التلفون</p>
                            <p className="font-medium">{projectBrief.ownerPhone || "—"}</p>
                          </div>
                        </div>
                      </div>
                      {/* بيانات القسيمة */}
                      <div className="p-3 rounded-xl bg-muted/30">
                        <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> بيانات القسيمة
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground">المنطقة</p>
                            <p className="font-medium text-xs">{projectBrief.area || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">القطعة</p>
                            <p className="font-medium text-xs">{projectBrief.block || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">القسيمة</p>
                            <p className="font-medium text-xs">{projectBrief.plot || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">المساحة</p>
                            <p className="font-medium text-xs">{projectBrief.plotArea ? `${projectBrief.plotArea} م²` : "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">شكل القسيمة</p>
                            <p className="font-medium text-xs">{projectBrief.plotShape || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">اتجاه الشمال</p>
                            <p className="font-medium text-xs">{projectBrief.northDirection || "—"}</p>
                          </div>
                        </div>
                      </div>
                      {/* الطابع المعماري */}
                      {(projectBrief.architecturalStyle || projectBrief.floorsCount > 0) && (
                        <div className="p-3 rounded-xl bg-muted/30">
                          <p className="text-xs font-bold text-muted-foreground mb-2">الطابع المعماري</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground">الطابع</p>
                              <p className="font-medium text-xs">{projectBrief.architecturalStyle || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">عدد الأدوار</p>
                              <p className="font-medium text-xs">{projectBrief.floorsCount}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* ملاحظات */}
                      {projectBrief.notes && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-xs font-bold text-amber-700 mb-1">ملاحظات</p>
                          <p className="text-xs text-amber-800">{projectBrief.notes}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center">آخر تحديث: {projectBrief.updatedAt}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Schedule */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                    جدول الدفعات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientInvoices.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">لا يوجد فواتير مرتبطة</div>
                  ) : (
                    <div className="space-y-3">
                      {clientInvoices.map((inv) => {
                        const statusColors: Record<string, { bg: string; text: string }> = {
                          "مسودة": { bg: "bg-gray-100", text: "text-gray-600" },
                          "مُرسلة": { bg: "bg-blue-100", text: "text-blue-700" },
                          "مدفوعة جزئياً": { bg: "bg-amber-100", text: "text-amber-700" },
                          "مدفوعة": { bg: "bg-green-100", text: "text-green-700" },
                          "متأخرة": { bg: "bg-red-100", text: "text-red-700" },
                          "ملغاة": { bg: "bg-gray-100", text: "text-gray-500" },
                        };
                        const st = statusColors[inv.status] || statusColors["مسودة"];
                        return (
                          <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: "oklch(0.30 0.05 250 / 0.1)" }}>
                              <CreditCard className="w-5 h-5" style={{ color: "oklch(0.30 0.05 250)" }} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{inv.invoiceNumber || inv.id}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {inv.date}
                                {inv.dueDate && ` · استحقاق: ${inv.dueDate}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{inv.total.toLocaleString()} د.ك</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.bg} ${st.text}`}>
                                {inv.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Docs + Contact */}
            <div className="space-y-5">
              {/* Documents */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                    ملفاتي ({clientDocs.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientDocs.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      لا يوجد ملفات مرفوعة لهذا العميل
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">{doc.fileSize} · {doc.category}</p>
                          </div>
                          {doc.url ? (
                            <a href={`/api/documents/${doc.id}/download`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-40" disabled>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                    تواصل معنا
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full gap-2" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                    onClick={() => window.open("tel:50855599")}>
                    <Phone className="w-4 h-4" />
                    اتصل بمكتبنا
                  </Button>
                  <Button variant="outline" className="w-full gap-2 text-green-600 border-green-200 hover:bg-green-50"
                    onClick={() => window.open("https://wa.me/96550855599")}>
                    <MessageSquare className="w-4 h-4" />
                    واتساب
                  </Button>
                  <div className="pt-2 text-xs text-muted-foreground text-center space-y-1">
                    <p className="flex items-center justify-center gap-1">
                      <User className="w-3 h-3" />
                      ديناميك للإستشارات الهندسية
                    </p>
                    <p>50855599 — 22091228</p>
                    <p>info@DynamicSaud.com</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
