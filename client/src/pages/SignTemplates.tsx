/*
 * Design: Desert Oasis Professional
 * Sign - التوقيع الإلكتروني
 * Based on Odoo.sh Sign module (103 templates)
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileSignature, Send, PenTool, Share2, Search, Filter,
  FileText, Stamp, CheckCircle2, Clock, BarChart3
} from "lucide-react";

/* ── Sign Template Categories ── */
const categories = [
  { label: "الكل", value: "all", count: 103 },
  { label: "سكن خاص", value: "residential", count: 32 },
  { label: "استثماري", value: "investment", count: 16 },
  { label: "تجاري", value: "commercial", count: 16 },
  { label: "صناعي", value: "industrial", count: 16 },
  { label: "مخازن/شبرات", value: "warehouses", count: 8 },
  { label: "مساجد", value: "mosques", count: 5 },
  { label: "جمعيات", value: "associations", count: 5 },
  { label: "مزارع", value: "farms", count: 5 },
];

/* ── Sample Templates ── */
const templates = [
  // سكن خاص
  { id: 1, name: "سكن خاص بناء جديد", category: "residential", type: "بناء جديد", stamped: true },
  { id: 2, name: "سكن خاص هدم بالختم", category: "residential", type: "هدم", stamped: true },
  { id: 3, name: "سكن خاص تعديل بالختم", category: "residential", type: "تعديل", stamped: true },
  { id: 4, name: "سكن خاص إضافة بالختم", category: "residential", type: "إضافة", stamped: true },
  { id: 5, name: "سكن خاص تعديل وإضافة بالختم", category: "residential", type: "تعديل وإضافة", stamped: true },
  // استثماري
  { id: 6, name: "استثماري بناء جديد بالختم", category: "investment", type: "بناء جديد", stamped: true },
  { id: 7, name: "استثماري هدم بالختم", category: "investment", type: "هدم", stamped: true },
  { id: 8, name: "استثماري تعديل بالختم", category: "investment", type: "تعديل", stamped: true },
  { id: 9, name: "استثماري تعديل واضافة بالختم", category: "investment", type: "تعديل وإضافة", stamped: true },
  // تجاري
  { id: 10, name: "تجاري بناء جديد بالختم", category: "commercial", type: "بناء جديد", stamped: true },
  { id: 11, name: "تجاري هدم بالختم", category: "commercial", type: "هدم", stamped: true },
  { id: 12, name: "تجاري تعديل بالختم", category: "commercial", type: "تعديل", stamped: true },
  { id: 13, name: "تجاري تعديل واضافة بالختم", category: "commercial", type: "تعديل وإضافة", stamped: true },
  // صناعي
  { id: 14, name: "صناعي بناء جديد بالختم", category: "industrial", type: "بناء جديد", stamped: true },
  { id: 15, name: "صناعي هدم بالختم", category: "industrial", type: "هدم", stamped: true },
  { id: 16, name: "صناعي تعديل بالختم", category: "industrial", type: "تعديل", stamped: true },
  { id: 17, name: "صناعي تعديل واضافة بالختم", category: "industrial", type: "تعديل وإضافة", stamped: true },
  // مخازن/شبرات
  { id: 18, name: "مخازن / شبرات هدم بالختم", category: "warehouses", type: "هدم", stamped: true },
  { id: 19, name: "مخازن / شبرات تعديل واضافة بالختم", category: "warehouses", type: "تعديل وإضافة", stamped: true },
  // مساجد
  { id: 20, name: "مساجد هدم بالختم", category: "mosques", type: "هدم", stamped: true },
  { id: 21, name: "مساجد تعديل واضافة بالختم", category: "mosques", type: "تعديل وإضافة", stamped: true },
  // جمعيات
  { id: 22, name: "جمعيات وتعاونيات هدم بالختم", category: "associations", type: "هدم", stamped: true },
  { id: 23, name: "جمعيات وتعاونيات تعديل بالختم", category: "associations", type: "تعديل", stamped: true },
  { id: 24, name: "جمعيات وتعاونيات تعديل واضافة بالختم", category: "associations", type: "تعديل وإضافة", stamped: true },
  // مزارع
  { id: 25, name: "مزارع هدم بالختم", category: "farms", type: "هدم", stamped: true },
  { id: 26, name: "مزارع تعديل واضافة بالختم", category: "farms", type: "تعديل وإضافة", stamped: true },
];

/* ── Dashboard Stats ── */
const dashStats = [
  { label: "إجمالي القوالب", value: "103", icon: FileText, color: "oklch(0.55 0.15 250)" },
  { label: "مختومة", value: "30", icon: Stamp, color: "oklch(0.72 0.10 60)" },
  { label: "بانتظار التوقيع", value: "3", icon: Clock, color: "oklch(0.60 0.12 30)" },
  { label: "موقعة", value: "12", icon: CheckCircle2, color: "oklch(0.55 0.15 150)" },
];

export default function SignTemplates() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter((t) => {
    const matchCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchSearch = !searchQuery || t.name.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dashStats.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? "default" : "outline"}
            size="sm"
            className="shrink-0 text-xs"
            style={selectedCategory === cat.value ? { backgroundColor: "oklch(0.30 0.05 250)" } : {}}
            onClick={() => setSelectedCategory(cat.value)}
          >
            {cat.label}
            <Badge variant="secondary" className="mr-1.5 text-[10px] px-1.5">{cat.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث في القوالب..."
            className="pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredTemplates.map((t) => (
          <Card key={t.id} className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer">
            <CardContent className="p-4">
              {/* Template Preview */}
              <div className="aspect-[3/4] rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
                style={{ backgroundColor: "oklch(0.97 0.01 80)" }}>
                <div className="text-center p-4">
                  <FileSignature className="w-10 h-10 mx-auto mb-2" style={{ color: "oklch(0.72 0.10 60 / 0.4)" }} />
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.name}</p>
                </div>
                {t.stamped && (
                  <div className="absolute top-2 left-2">
                    <Badge className="text-[10px] text-white" style={{ backgroundColor: "oklch(0.72 0.10 60)" }}>
                      <Stamp className="w-3 h-3 ml-1" />
                      مختوم
                    </Badge>
                  </div>
                )}
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" className="text-xs" style={{ backgroundColor: "oklch(0.72 0.10 60)" }}>
                    <Send className="w-3 h-3 ml-1" />
                    إرسال
                  </Button>
                  <Button size="sm" variant="secondary" className="text-xs">
                    <PenTool className="w-3 h-3 ml-1" />
                    وقّع الآن
                  </Button>
                </div>
              </div>

              {/* Template Info */}
              <h4 className="text-sm font-bold leading-tight mb-2">{t.name}</h4>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {categories.find((c) => c.value === t.category)?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          عرض {filteredTemplates.length} من أصل 103 قالب توقيع
        </p>
      </div>
    </div>
  );
}
