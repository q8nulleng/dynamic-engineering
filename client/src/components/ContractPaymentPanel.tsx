import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSignature, CreditCard, Plus, X, FileText, Printer, Download, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useContractsByProject, useInvoices } from "@/lib/api";
import { exportContractPdf, downloadContractPdf } from "@/lib/pdf";
import type { Contract } from "@/lib/api";

interface ContractPaymentPanelProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
}

const statusColors: Record<string, string> = {
  "نشط": "bg-green-100 text-green-700",
  "مسودة": "bg-yellow-100 text-yellow-700",
  "مكتمل": "bg-blue-100 text-blue-700",
  "معلّق": "bg-orange-100 text-orange-700",
  "ملغي": "bg-red-100 text-red-700",
};

export default function ContractPaymentPanel({ open, onClose, projectName, projectId }: ContractPaymentPanelProps) {
  const { data: contracts = [], isLoading: contractsLoading } = useContractsByProject(projectId);
  const { data: allInvoices = [] } = useInvoices();
  const projectInvoices = allInvoices.filter(inv => inv.projectId === projectId);

  if (!open) return null;

  const contract = contracts[0] as Contract | undefined;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-full max-w-2xl bg-background shadow-xl flex flex-col z-50 overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base font-bold">العقود والدفعات — {projectName}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>
        <div className="p-4 space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contract Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileSignature className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
                  العقد
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contractsLoading ? (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Clock className="w-5 h-5 animate-spin ml-2" />
                    <span className="text-sm">جاري التحميل...</span>
                  </div>
                ) : contract ? (
                  <div className="space-y-3">
                    {/* Contract Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{contract.id}</p>
                        <p className="text-xs text-muted-foreground">{contract.date}</p>
                      </div>
                      <Badge className={`text-xs ${statusColors[contract.status] || "bg-gray-100 text-gray-700"}`}>
                        {contract.status}
                      </Badge>
                    </div>

                    {/* Contract Details */}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">النوع:</span>
                        <span className="font-medium">{contract.type || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">الباقة:</span>
                        <span className="font-medium">{contract.package || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">القيمة:</span>
                        <span className="font-bold text-primary">{contract.amount} د.ك</span>
                      </div>
                      {contract.area && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">الموقع:</span>
                          <span>{contract.area} — ق{contract.block} / {contract.plot}</span>
                        </div>
                      )}
                      {contract.signingDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاريخ التوقيع:</span>
                          <span dir="ltr">{contract.signingDate}</span>
                        </div>
                      )}
                    </div>

                    {/* Print & Download Buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-8 gap-1.5"
                        onClick={() => exportContractPdf(contract)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        طباعة
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs h-8 gap-1.5"
                        style={{ backgroundColor: "oklch(0.30 0.05 250)" }}
                        onClick={async () => {
                          try {
                            await downloadContractPdf(contract);
                          } catch {
                            // handled silently
                          }
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                        تحميل PDF
                      </Button>
                    </div>

                    {/* Signed file if exists */}
                    {contract.signedFileUrl && (
                      <a
                        href={contract.signedFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        العقد الموقع (PDF)
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا يوجد عقد مرتبط بهذا المشروع</p>
                    <p className="text-xs mt-1 text-muted-foreground">يُنشأ العقد تلقائياً عند قبول التعاقد من CRM</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payments Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
                  الدفعات ({projectInvoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectInvoices.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">لا توجد فواتير لهذا المشروع</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projectInvoices.map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-sm">
                        <div>
                          <p className="font-medium text-xs">{inv.invoiceNumber || inv.id}</p>
                          <p className="text-xs text-muted-foreground">{inv.paymentType || "فاتورة"}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-xs">{Number(inv.total || 0).toFixed(3)} د.ك</p>
                          <Badge className={`text-[10px] ${inv.status === "مدفوع" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {inv.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between text-xs font-semibold">
                      <span>الإجمالي:</span>
                      <span>{projectInvoices.reduce((s, i) => s + Number(i.total || 0), 0).toFixed(3)} د.ك</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
