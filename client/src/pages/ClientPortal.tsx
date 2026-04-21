/*
 * Client Portal - بوابة العميل
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Globe, FileText, FolderOpen, MessageSquare, Clock,
  CheckCircle2, Building2, User, Calendar, Download
} from "lucide-react";

const projectTimeline = [
  { phase: "تجهيز الملف", status: "مكتمل", date: "1 أبريل 2025", icon: CheckCircle2, color: "text-green-600" },
  { phase: "التصميم المعماري", status: "قيد التنفيذ", date: "10 أبريل 2025", icon: Clock, color: "text-blue-600" },
  { phase: "التصميم الإنشائي", status: "قادم", date: "متوقع: 25 أبريل", icon: Clock, color: "text-gray-400" },
  { phase: "الرسم والمراجعة", status: "قادم", date: "متوقع: 5 مايو", icon: Clock, color: "text-gray-400" },
  { phase: "البلدية والتسليم", status: "قادم", date: "متوقع: 15 مايو", icon: Clock, color: "text-gray-400" },
];

const clientFiles = [
  { name: "عرض السعر المعتمد.pdf", date: "1 أبريل 2025", size: "420 KB" },
  { name: "العقد الموقع.pdf", date: "3 أبريل 2025", size: "680 KB" },
  { name: "المخطط المعماري - أولي.pdf", date: "15 أبريل 2025", size: "2.1 MB" },
  { name: "محضر اجتماع #1.pdf", date: "10 أبريل 2025", size: "180 KB" },
  { name: "محضر اجتماع #2.pdf", date: "18 أبريل 2025", size: "210 KB" },
];

const meetings = [
  { title: "اجتماع مراجعة التصميم المعماري", date: "20 أبريل 2025", time: "10:00 ص", attendees: "م. مصطفى، أحمد الكويتي" },
  { title: "عرض الواجهات ثلاثية الأبعاد", date: "25 أبريل 2025", time: "2:00 م", attendees: "م. مصطفى، عرفان" },
];

export default function ClientPortal() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">عرض تجريبي لما سيراه العميل عند تسجيل الدخول</p>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Globe className="w-3 h-3" />
          بوابة العميل
        </Badge>
      </div>

      {/* Client Info Banner */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="p-6" style={{ background: "linear-gradient(135deg, oklch(0.30 0.05 250), oklch(0.22 0.04 250))" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ backgroundColor: "oklch(0.72 0.10 60)", color: "white" }}>
              أ
            </div>
            <div className="text-white">
              <h3 className="text-lg font-bold">أحمد محمد الكويتي</h3>
              <p className="text-white/70 text-sm">مشروع: فيلا سكنية - السالمية</p>
            </div>
            <div className="mr-auto text-left">
              <p className="text-white/70 text-xs">نسبة الإنجاز</p>
              <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Space Grotesk'" }}>35%</p>
            </div>
          </div>
          <Progress value={35} className="mt-4 h-2" />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                مراحل المشروع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {projectTimeline.map((phase, i) => (
                  <div key={i} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <phase.icon className={`w-6 h-6 ${phase.color}`} />
                      {i < projectTimeline.length - 1 && (
                        <div className={`w-0.5 flex-1 mt-2 ${phase.status === "مكتمل" ? "bg-green-300" : "bg-gray-200"}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold">{phase.phase}</h4>
                        <Badge variant={phase.status === "مكتمل" ? "default" : phase.status === "قيد التنفيذ" ? "secondary" : "outline"}
                          className="text-xs"
                          style={phase.status === "مكتمل" ? { backgroundColor: "oklch(0.55 0.15 150)" } : {}}>
                          {phase.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{phase.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* MOM - Minutes of Meeting */}
          <Card className="border-0 shadow-sm mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
                محاضر الاجتماعات (MOM)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meetings.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "oklch(0.30 0.05 250)" }}>
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.date} - {m.time}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />{m.attendees}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Download className="w-3 h-3 ml-1" />
                      تحميل
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client Files */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderOpen className="w-5 h-5" style={{ color: "oklch(0.72 0.10 60)" }} />
              ملفاتي
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clientFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size} • {file.date}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
