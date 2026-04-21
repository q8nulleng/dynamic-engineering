/*
 * Payments - الدفعات والفواتير
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle, Receipt } from "lucide-react";

const paymentStats = [
  { label: "إجمالي الإيرادات", value: "12,500", icon: TrendingUp, color: "oklch(0.55 0.15 150)" },
  { label: "دفعات مستحقة", value: "3,200", icon: Clock, color: "oklch(0.72 0.10 60)" },
  { label: "دفعات مستلمة", value: "9,300", icon: CheckCircle2, color: "oklch(0.55 0.15 150)" },
  { label: "متأخرة", value: "1,500", icon: AlertTriangle, color: "oklch(0.60 0.12 30)" },
];

const payments = [
  { id: "INV-001", client: "أحمد الكويتي", project: "فيلا - السالمية", type: "فتح كرت", amount: "100", paid: "100", status: "مدفوع", date: "2025-04-01" },
  { id: "INV-002", client: "أحمد الكويتي", project: "فيلا - السالمية", type: "دفعة أولى", amount: "700", paid: "700", status: "مدفوع", date: "2025-04-05" },
  { id: "INV-003", client: "أحمد الكويتي", project: "فيلا - السالمية", type: "دفعة ثانية", amount: "700", paid: "0", status: "مستحق", date: "2025-05-01" },
  { id: "INV-004", client: "شركة الخليج", project: "مبنى تجاري - حولي", type: "داون بيمنت", amount: "2,000", paid: "2,000", status: "مدفوع", date: "2025-03-15" },
  { id: "INV-005", client: "شركة الخليج", project: "مبنى تجاري - حولي", type: "دفعة ثانية", amount: "2,000", paid: "0", status: "متأخر", date: "2025-04-15" },
  { id: "INV-006", client: "محمد العلي", project: "مجمع - الفحيحيل", type: "فتح كرت", amount: "100", paid: "100", status: "مدفوع", date: "2025-04-10" },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  "مدفوع": { color: "text-green-700", bg: "bg-green-50" },
  "مستحق": { color: "text-amber-700", bg: "bg-amber-50" },
  "متأخر": { color: "text-red-700", bg: "bg-red-50" },
};

const projectPayments = [
  { project: "فيلا - السالمية", total: 1500, paid: 800, installments: 3 },
  { project: "مبنى تجاري - حولي", total: 4000, paid: 2000, installments: 2 },
  { project: "مجمع - الفحيحيل", total: 5500, paid: 100, installments: 3 },
];

export default function Payments() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {paymentStats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{stat.value} <span className="text-xs font-normal">د.ك</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment History */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                  سجل الدفعات
                </CardTitle>
                <Button size="sm" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                  <Plus className="w-4 h-4 ml-1" />
                  تسجيل دفعة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium">الرقم</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">المشروع</th>
                      <th className="text-right py-3 px-4 font-medium">النوع</th>
                      <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const st = statusConfig[p.status];
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer">
                          <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk'" }}>{p.id}</td>
                          <td className="py-3 px-4 font-medium text-xs">{p.client}</td>
                          <td className="py-3 px-4 text-xs text-muted-foreground">{p.project}</td>
                          <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{p.type}</Badge></td>
                          <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{p.amount} د.ك</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{p.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Payment Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              تقدم الدفعات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {projectPayments.map((pp, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{pp.project}</p>
                    <p className="text-xs" style={{ fontFamily: "'Space Grotesk'" }}>
                      {pp.paid}/{pp.total} د.ك
                    </p>
                  </div>
                  <Progress value={(pp.paid / pp.total) * 100} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">{pp.installments} أقساط • {Math.round((pp.paid / pp.total) * 100)}% مدفوع</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
