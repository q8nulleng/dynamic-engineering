/*
 * Design: Desert Oasis Professional
 * Payments & Invoicing - الدفعات والفواتير
 * Updated with full invoicing system from Odoo.sh (Invoice Lines, Tax 15%, Statuses)
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard, Plus, TrendingUp, Clock, CheckCircle2, AlertTriangle, Receipt,
  Send, Printer, Eye, RotateCcw, ChevronDown, ChevronUp, FileText
} from "lucide-react";

const paymentStats = [
  { label: "إجمالي الإيرادات", value: "12,500", icon: TrendingUp, color: "oklch(0.55 0.15 150)" },
  { label: "دفعات مستحقة", value: "3,200", icon: Clock, color: "oklch(0.72 0.10 60)" },
  { label: "دفعات مستلمة", value: "9,300", icon: CheckCircle2, color: "oklch(0.55 0.15 150)" },
  { label: "متأخرة", value: "1,500", icon: AlertTriangle, color: "oklch(0.60 0.12 30)" },
];

interface InvoiceLine {
  product: string;
  label: string;
  quantity: number;
  price: number;
  taxRate: number;
}

interface Invoice {
  id: string;
  customer: string;
  project: string;
  invoiceDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  status: "مسودة" | "مرحّلة" | "مدفوعة" | "غير مدفوعة" | "متأخرة";
  paymentRef?: string;
}

const invoices: Invoice[] = [
  {
    id: "INV/2026/00001", customer: "تهاني خالد محمد بورسلي", project: "S00047",
    invoiceDate: "2026-04-15", dueDate: "2026-05-15",
    lines: [
      { product: "رسوم فتح ملف", label: "رسوم فتح ملف وتصميم مبدئي", quantity: 1, price: 50, taxRate: 15 },
    ],
    status: "مرحّلة", paymentRef: "INV/2026/00001",
  },
  {
    id: "INV/2026/00002", customer: "أحمد الكويتي", project: "S00046",
    invoiceDate: "2026-04-10", dueDate: "2026-05-10",
    lines: [
      { product: "باقة الهدم - سكن خاص", label: "باقة الهدم - سكن خاص", quantity: 1, price: 250, taxRate: 15 },
    ],
    status: "مدفوعة",
  },
  {
    id: "INV/2026/00003", customer: "فهد العتيبي", project: "S00048",
    invoiceDate: "2026-04-08", dueDate: "2026-05-08",
    lines: [
      { product: "الباقة الذهبية - سكن خاص", label: "الباقة الذهبية - سكن خاص", quantity: 1, price: 2200, taxRate: 15 },
    ],
    status: "غير مدفوعة",
  },
  {
    id: "INV/2026/00004", customer: "شركة الخليج", project: "S00049",
    invoiceDate: "2026-04-05", dueDate: "2026-04-20",
    lines: [
      { product: "رسوم فتح ملف", label: "رسوم فتح ملف", quantity: 1, price: 50, taxRate: 15 },
      { product: "الباقة الأساسية - تجاري", label: "الباقة الأساسية - تجاري - دفعة أولى", quantity: 1, price: 1000, taxRate: 15 },
    ],
    status: "متأخرة",
  },
  {
    id: "INV/2026/00005", customer: "محمد العلي", project: "S00050",
    invoiceDate: "2026-04-01", dueDate: "2026-05-01",
    lines: [
      { product: "الباقة الأساسية - استثماري", label: "الباقة الأساسية - استثماري", quantity: 1, price: 2000, taxRate: 15 },
    ],
    status: "مسودة",
  },
];

const statusConfig: Record<string, { color: string; bg: string }> = {
  "مسودة": { color: "text-gray-600", bg: "bg-gray-100" },
  "مرحّلة": { color: "text-blue-600", bg: "bg-blue-50" },
  "مدفوعة": { color: "text-green-700", bg: "bg-green-50" },
  "غير مدفوعة": { color: "text-amber-700", bg: "bg-amber-50" },
  "متأخرة": { color: "text-red-700", bg: "bg-red-50" },
};

const projectPayments = [
  { project: "S00046 - هدم السالمية", total: 250, paid: 250, installments: 1 },
  { project: "S00047 - تعديل مشرف", total: 500, paid: 50, installments: 3 },
  { project: "S00048 - فيلا الجهراء", total: 2200, paid: 0, installments: 3 },
  { project: "S00049 - مبنى تجاري", total: 2000, paid: 0, installments: 2 },
];

function calcInvoiceTotal(lines: InvoiceLine[]) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.price, 0);
  const tax = lines.reduce((s, l) => s + l.quantity * l.price * (l.taxRate / 100), 0);
  return { subtotal, tax, total: subtotal + tax };
}

export default function Payments() {
  const [view, setView] = useState<"invoices" | "progress">("invoices");
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {paymentStats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{stat.value} <span className="text-xs font-normal">د.ك</span></p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <Button variant={view === "invoices" ? "default" : "outline"} size="sm" onClick={() => setView("invoices")}
            style={view === "invoices" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            <Receipt className="w-4 h-4 ml-1" />
            الفواتير
          </Button>
          <Button variant={view === "progress" ? "default" : "outline"} size="sm" onClick={() => setView("progress")}
            style={view === "progress" ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}>
            <CreditCard className="w-4 h-4 ml-1" />
            تقدم الدفعات
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 ml-1" />
            فاتورة فتح ملف 50 د.ك
          </Button>
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }} size="sm">
            <Plus className="w-4 h-4 ml-1" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      {view === "invoices" ? (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <Input placeholder="بحث..." className="max-w-xs" />
            <Select>
              <SelectTrigger className="w-32"><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="posted">مرحّلة</SelectItem>
                <SelectItem value="paid">مدفوعة</SelectItem>
                <SelectItem value="not-paid">غير مدفوعة</SelectItem>
                <SelectItem value="overdue">متأخرة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-right py-3 px-4 font-medium w-8"></th>
                      <th className="text-right py-3 px-4 font-medium">رقم الفاتورة</th>
                      <th className="text-right py-3 px-4 font-medium">العميل</th>
                      <th className="text-right py-3 px-4 font-medium">المشروع</th>
                      <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                      <th className="text-right py-3 px-4 font-medium">الاستحقاق</th>
                      <th className="text-right py-3 px-4 font-medium">قبل الضريبة</th>
                      <th className="text-right py-3 px-4 font-medium">الإجمالي</th>
                      <th className="text-right py-3 px-4 font-medium">الحالة</th>
                      <th className="text-right py-3 px-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const { subtotal, tax, total } = calcInvoiceTotal(inv.lines);
                      const st = statusConfig[inv.status];
                      const isExpanded = expandedInvoice === inv.id;
                      return (
                        <>
                          <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer"
                            onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                            <td className="py-3 px-4">
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs" style={{ fontFamily: "'Space Grotesk'" }}>{inv.id}</td>
                            <td className="py-3 px-4 font-medium text-xs">{inv.customer}</td>
                            <td className="py-3 px-4 text-xs text-muted-foreground">{inv.project}</td>
                            <td className="py-3 px-4 text-xs" dir="ltr">{inv.invoiceDate}</td>
                            <td className="py-3 px-4 text-xs" dir="ltr">{inv.dueDate}</td>
                            <td className="py-3 px-4" style={{ fontFamily: "'Space Grotesk'" }}>{subtotal.toFixed(3)}</td>
                            <td className="py-3 px-4 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{total.toFixed(3)}</td>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded-full ${st.bg} ${st.color}`}>{inv.status}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="إرسال وطباعة"><Send className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="معاينة"><Eye className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" title="تسجيل دفعة"><CreditCard className="w-3.5 h-3.5" /></Button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={inv.id + "-detail"} className="bg-muted/10">
                              <td colSpan={10} className="py-4 px-6">
                                {/* Invoice Lines */}
                                <h4 className="text-xs font-bold mb-2 text-muted-foreground uppercase tracking-wider">سطور الفاتورة</h4>
                                <table className="w-full text-xs mb-4">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-right py-2 px-3 font-medium">المنتج</th>
                                      <th className="text-right py-2 px-3 font-medium">الوصف</th>
                                      <th className="text-right py-2 px-3 font-medium">الكمية</th>
                                      <th className="text-right py-2 px-3 font-medium">السعر</th>
                                      <th className="text-right py-2 px-3 font-medium">الضريبة</th>
                                      <th className="text-right py-2 px-3 font-medium">المجموع</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {inv.lines.map((line, li) => (
                                      <tr key={li} className="border-b last:border-0">
                                        <td className="py-2 px-3 font-medium">{line.product}</td>
                                        <td className="py-2 px-3 text-muted-foreground">{line.label}</td>
                                        <td className="py-2 px-3" style={{ fontFamily: "'Space Grotesk'" }}>{line.quantity}</td>
                                        <td className="py-2 px-3" style={{ fontFamily: "'Space Grotesk'" }}>{line.price.toFixed(3)}</td>
                                        <td className="py-2 px-3" style={{ fontFamily: "'Space Grotesk'" }}>{line.taxRate}%</td>
                                        <td className="py-2 px-3 font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{(line.quantity * line.price).toFixed(3)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {/* Totals */}
                                <div className="flex justify-end">
                                  <div className="w-64 space-y-1 text-xs">
                                    <div className="flex justify-between"><span className="text-muted-foreground">المجموع قبل الضريبة:</span><span style={{ fontFamily: "'Space Grotesk'" }}>{subtotal.toFixed(3)} د.ك</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">ضريبة القيمة المضافة (15%):</span><span style={{ fontFamily: "'Space Grotesk'" }}>{tax.toFixed(3)} د.ك</span></div>
                                    <div className="flex justify-between pt-1 border-t font-bold"><span>الإجمالي:</span><span style={{ fontFamily: "'Space Grotesk'" }}>{total.toFixed(3)} د.ك</span></div>
                                  </div>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-2 mt-4 pt-3 border-t">
                                  <Button size="sm" className="text-xs" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                                    <Send className="w-3 h-3 ml-1" />
                                    إرسال وطباعة
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-xs">
                                    <CreditCard className="w-3 h-3 ml-1" />
                                    تسجيل دفعة
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-xs">
                                    <RotateCcw className="w-3 h-3 ml-1" />
                                    إشعار دائن
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Payment Progress */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectPayments.map((pp, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold">{pp.project}</h4>
                  <span className="text-xs" style={{ fontFamily: "'Space Grotesk'" }}>
                    {pp.paid}/{pp.total} د.ك
                  </span>
                </div>
                <Progress value={(pp.paid / pp.total) * 100} className="h-2.5 mb-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{pp.installments} أقساط</span>
                  <span style={{ fontFamily: "'Space Grotesk'" }}>{Math.round((pp.paid / pp.total) * 100)}% مدفوع</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
