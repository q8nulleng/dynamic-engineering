/*
 * Documents - إدارة المستندات والملفات
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Upload, FolderOpen, FileText, Image, File, CreditCard, MapPin,
  Building2, Zap, Droplets, PenTool, Eye, Download, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

const clientDocs = [
  { name: "البطاقة المدنية", icon: CreditCard, status: "مرفوع", color: "text-green-600" },
  { name: "الوثيقة", icon: FileText, status: "مرفوع", color: "text-green-600" },
  { name: "المخطط المساحي", icon: MapPin, status: "مطلوب", color: "text-red-600" },
];

const projectDocs = [
  { category: "المعماري", icon: Building2, files: [
    { name: "المخطط المعماري - الدور الأرضي.dwg", size: "2.4 MB", date: "2025-04-18" },
    { name: "المخطط المعماري - الدور الأول.dwg", size: "2.1 MB", date: "2025-04-18" },
    { name: "الموقع العام.pdf", size: "850 KB", date: "2025-04-15" },
  ]},
  { category: "الإنشائي", icon: Building2, files: [
    { name: "المخطط الإنشائي - الأساسات.dwg", size: "3.2 MB", date: "2025-04-17" },
    { name: "حسابات إنشائية.pdf", size: "1.5 MB", date: "2025-04-16" },
  ]},
  { category: "الواجهات", icon: Image, files: [
    { name: "الواجهة الأمامية 3D.png", size: "5.8 MB", date: "2025-04-19" },
    { name: "الواجهة الجانبية 3D.png", size: "4.2 MB", date: "2025-04-19" },
  ]},
  { category: "الكهرباء", icon: Zap, files: [
    { name: "مخطط التوزيع الكهربائي.dwg", size: "1.8 MB", date: "2025-04-14" },
  ]},
  { category: "الصحي", icon: Droplets, files: [
    { name: "مخطط الصرف الصحي.dwg", size: "1.6 MB", date: "2025-04-13" },
  ]},
  { category: "نماذج البلدية", icon: PenTool, files: [
    { name: "نموذج طلب رخصة بناء.pdf", size: "320 KB", date: "2025-04-20" },
    { name: "نموذج تصنيف المبنى.pdf", size: "280 KB", date: "2025-04-20" },
  ]},
];

export default function Documents() {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="بحث في المستندات..." className="pr-10" />
        </div>
        <Button style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
          <Upload className="w-4 h-4 ml-2" />
          رفع ملف
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Documents */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              مستندات العميل
            </CardTitle>
            <p className="text-xs text-muted-foreground">مشروع: فيلا - السالمية</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white shadow-sm">
                    <doc.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className={`text-xs ${doc.color}`}>{doc.status}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    {doc.status === "مرفوع" ? "عرض" : "رفع"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Documents */}
        <div className="lg:col-span-2 space-y-4">
          {projectDocs.map((cat, ci) => (
            <Card key={ci} className="border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <cat.icon className="w-4 h-4" style={{ color: "oklch(0.72 0.10 60)" }} />
                  {cat.category}
                  <Badge variant="secondary" className="text-xs mr-auto">{cat.files.length} ملف</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-2">
                  {cat.files.map((file, fi) => (
                    <div key={fi} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                      <File className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
