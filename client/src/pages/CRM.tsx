/*
 * CRM - Kanban board for client management
 */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Mail, MoreVertical } from "lucide-react";

const columns = [
  {
    title: "استفسار جديد",
    color: "oklch(0.55 0.15 250)",
    leads: [
      { name: "فهد العتيبي", phone: "9876 5432", type: "سكن خاص", source: "اتصال", date: "اليوم" },
      { name: "شركة النور", phone: "9812 3456", type: "تجاري", source: "واتساب", date: "أمس" },
    ],
  },
  {
    title: "تم التواصل",
    color: "oklch(0.72 0.10 60)",
    leads: [
      { name: "سالم المطيري", phone: "9911 2233", type: "استثماري", source: "زيارة", date: "منذ يومين" },
    ],
  },
  {
    title: "عرض سعر مرسل",
    color: "oklch(0.60 0.15 280)",
    leads: [
      { name: "أحمد الكويتي", phone: "9955 6677", type: "سكن خاص", source: "اتصال", date: "منذ 3 أيام" },
      { name: "مؤسسة البناء", phone: "9922 3344", type: "صناعي", source: "بريد", date: "منذ 5 أيام" },
    ],
  },
  {
    title: "تم التعاقد",
    color: "oklch(0.55 0.15 150)",
    leads: [
      { name: "خالد الرشيدي", phone: "9988 7766", type: "سكن خاص", source: "واتساب", date: "هذا الأسبوع" },
    ],
  },
];

export default function CRM() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">تتبع العملاء من الاستفسار حتى التعاقد</p>
        </div>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Plus className="w-4 h-4 ml-2" />
          عميل جديد
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {columns.map((col, ci) => (
          <div key={ci} className="min-w-[300px] w-[300px] shrink-0">
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-sm font-bold">{col.title}</h3>
              <Badge variant="secondary" className="text-xs mr-auto">{col.leads.length}</Badge>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {col.leads.map((lead, li) => (
                <Card key={li} className="border-0 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-bold">{lead.name}</h4>
                      <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -ml-1">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span dir="ltr">{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{lead.type}</Badge>
                        <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{lead.date}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}

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
