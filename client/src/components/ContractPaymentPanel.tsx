import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSignature, CreditCard, Plus, X } from "lucide-react";

interface ContractPaymentPanelProps {
  open: boolean;
  onClose: () => void;
  projectName: string;
}

export default function ContractPaymentPanel({ open, onClose, projectName }: ContractPaymentPanelProps) {
  if (!open) return null;

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
                <div className="text-center py-6 text-muted-foreground">
                  <FileSignature className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا يوجد عقد لهذا المشروع</p>
                  <Button size="sm" className="mt-3" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                    <Plus className="w-3 h-3 ml-1" />
                    إنشاء عقد
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payments Section */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
                  الدفعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">لا توجد فواتير لهذا المشروع</p>
                  <Button size="sm" className="mt-3" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                    <Plus className="w-3 h-3 ml-1" />
                    فاتورة جديدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
