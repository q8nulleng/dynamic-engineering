/*
 * Design: Desert Oasis Professional
 * CRM - Kanban board with detailed lead forms
 * Updated with Odoo.sh fields: Expected Revenue, Probability, Email, Salesperson, Priority, Actions
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus, Phone, Mail, MoreVertical, Star, DollarSign, User,
  Calendar, FileText, Trophy, X, MessageCircle, Send, Activity,
  ChevronDown, ChevronUp, TrendingUp
} from "lucide-react";

interface Lead {
  name: string;
  phone: string;
  email: string;
  type: string;
  source: string;
  date: string;
  expectedRevenue: string;
  probability: number;
  priority: 0 | 1 | 2 | 3;
  salesperson: string;
  expectedClosing: string;
  tags: string[];
  quotations: number;
  civilId?: string;
  notes?: string;
}

const columns: { title: string; color: string; leads: Lead[] }[] = [
  {
    title: "استفسار جديد",
    color: "oklch(0.55 0.15 250)",
    leads: [
      {
        name: "فهد العتيبي", phone: "9876 5432", email: "fahad@email.com", type: "سكن خاص", source: "اتصال", date: "اليوم",
        expectedRevenue: "2,200", probability: 30, priority: 2, salesperson: "أحمد", expectedClosing: "2026-05-15",
        tags: ["بناء جديد", "ذهبية"], quotations: 0, civilId: "281050300215",
      },
      {
        name: "شركة النور", phone: "9812 3456", email: "info@alnoor.com", type: "تجاري", source: "واتساب", date: "أمس",
        expectedRevenue: "4,000", probability: 20, priority: 1, salesperson: "محمد", expectedClosing: "2026-06-01",
        tags: ["بناء جديد"], quotations: 0,
      },
      {
        name: "تهاني خالد محمد بورسلي", phone: "9955 1122", email: "fedaa.dynamic@gmail.com", type: "سكن خاص", source: "زيارة", date: "اليوم",
        expectedRevenue: "500", probability: 50, priority: 2, salesperson: "أحمد", expectedClosing: "2026-05-01",
        tags: ["تعديل وإضافة"], quotations: 2, civilId: "265110500317",
      },
    ],
  },
  {
    title: "تم التواصل",
    color: "oklch(0.72 0.10 60)",
    leads: [
      {
        name: "سالم المطيري", phone: "9911 2233", email: "salem@email.com", type: "استثماري", source: "زيارة", date: "منذ يومين",
        expectedRevenue: "2,000", probability: 40, priority: 1, salesperson: "خالد", expectedClosing: "2026-05-20",
        tags: ["بناء جديد"], quotations: 1,
      },
    ],
  },
  {
    title: "عرض سعر مرسل",
    color: "oklch(0.60 0.15 280)",
    leads: [
      {
        name: "أحمد الكويتي", phone: "9955 6677", email: "ahmad@email.com", type: "سكن خاص", source: "اتصال", date: "منذ 3 أيام",
        expectedRevenue: "250", probability: 70, priority: 3, salesperson: "أحمد", expectedClosing: "2026-04-30",
        tags: ["هدم"], quotations: 1, civilId: "290080100412",
      },
      {
        name: "مؤسسة البناء", phone: "9922 3344", email: "info@building.com", type: "صناعي", source: "بريد", date: "منذ 5 أيام",
        expectedRevenue: "2,000", probability: 60, priority: 2, salesperson: "محمد", expectedClosing: "2026-05-10",
        tags: ["بناء جديد"], quotations: 1,
      },
    ],
  },
  {
    title: "تم التعاقد",
    color: "oklch(0.55 0.15 150)",
    leads: [
      {
        name: "خالد الرشيدي", phone: "9988 7766", email: "khaled@email.com", type: "سكن خاص", source: "واتساب", date: "هذا الأسبوع",
        expectedRevenue: "1,500", probability: 100, priority: 2, salesperson: "أحمد", expectedClosing: "2026-04-20",
        tags: ["بناء جديد", "أساسية"], quotations: 1, civilId: "277040100612",
      },
    ],
  },
];

const priorityLabels = ["", "متوسط", "مرتفع", "مرتفع جداً"];

export default function CRM() {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const totalRevenue = columns.reduce((sum, col) =>
    sum + col.leads.reduce((s, l) => s + parseFloat(l.expectedRevenue.replace(",", "")), 0), 0);
  const totalLeads = columns.reduce((sum, col) => sum + col.leads.length, 0);
  const avgProbability = Math.round(columns.reduce((sum, col) =>
    sum + col.leads.reduce((s, l) => s + l.probability, 0), 0) / totalLeads);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground">تتبع العملاء من الاستفسار حتى التعاقد</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="w-4 h-4 ml-1" />
            بريد إلكتروني
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="w-4 h-4 ml-1" />
            SMS
          </Button>
          <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
            <Plus className="w-4 h-4 ml-2" />
            فرصة جديدة
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-50">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">إجمالي الفرص</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalLeads}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.72 0.10 60 / 0.15)" }}>
              <DollarSign className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الإيرادات المتوقعة</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{totalRevenue.toLocaleString()} <span className="text-xs font-normal">د.ك</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">متوسط الاحتمالية</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{avgProbability}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50">
              <Trophy className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">تم التعاقد</p>
              <p className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{columns[3].leads.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 320px)" }}>
        {columns.map((col, ci) => (
          <div key={ci} className="min-w-[320px] w-[320px] shrink-0">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-bold">{col.title}</h3>
              <Badge variant="secondary" className="text-xs mr-auto">{col.leads.length}</Badge>
              <span className="text-xs text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>
                {col.leads.reduce((s, l) => s + parseFloat(l.expectedRevenue.replace(",", "")), 0).toLocaleString()} د.ك
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {col.leads.map((lead, li) => {
                const isExpanded = expandedLead === `${ci}-${li}`;
                return (
                  <Card key={li} className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setExpandedLead(isExpanded ? null : `${ci}-${li}`)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate">{lead.name}</h4>
                          {/* Priority Stars */}
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${s <= lead.priority ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                            ))}
                            {lead.priority > 0 && (
                              <span className="text-[10px] text-muted-foreground mr-1">{priorityLabels[lead.priority]}</span>
                            )}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -ml-1" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span dir="ltr">{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{lead.email}</span>
                        </div>
                      </div>

                      {/* Revenue & Probability */}
                      <div className="flex items-center justify-between mt-3 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-bold" style={{ color: "oklch(0.72 0.10 60)", fontFamily: "'Space Grotesk'" }}>
                            {lead.expectedRevenue}
                          </span>
                          <span className="text-[10px] text-muted-foreground">د.ك</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${lead.probability}%`,
                              backgroundColor: lead.probability >= 70 ? "oklch(0.55 0.15 150)" : lead.probability >= 40 ? "oklch(0.72 0.10 60)" : "oklch(0.55 0.15 250)"
                            }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{lead.probability}%</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{lead.type}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{lead.source}</Badge>
                        {lead.tags.map((tag, ti) => (
                          <Badge key={ti} className="text-[10px] text-white" style={{ backgroundColor: "oklch(0.55 0.15 150)" }}>{tag}</Badge>
                        ))}
                      </div>

                      {/* Smart Buttons */}
                      <div className="flex items-center gap-2 mt-2">
                        {lead.quotations > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                            <FileText className="w-3 h-3 inline ml-0.5" />
                            {lead.quotations} عرض سعر
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground mr-auto">
                          <User className="w-3 h-3 inline ml-0.5" />
                          {lead.salesperson}
                        </span>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">تاريخ الإغلاق المتوقع:</span>
                              <p className="font-medium" dir="ltr">{lead.expectedClosing}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">المصدر:</span>
                              <p className="font-medium">{lead.source}</p>
                            </div>
                            {lead.civilId && (
                              <div>
                                <span className="text-muted-foreground">الرقم المدني:</span>
                                <p className="font-medium" dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>{lead.civilId}</p>
                              </div>
                            )}
                          </div>
                          {/* Action Buttons */}
                          <div className="flex gap-1.5 flex-wrap">
                            <Button size="sm" className="text-xs h-7" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                              <FileText className="w-3 h-3 ml-1" />
                              عرض سعر جديد
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 text-green-600 border-green-200">
                              <Trophy className="w-3 h-3 ml-1" />
                              فوز
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200">
                              <X className="w-3 h-3 ml-1" />
                              خسارة
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Add card button */}
              <button className="w-full py-3 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                إضافة
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
