/*
 * Design: Desert Oasis Professional
 * Sidebar: Navy (#1B4965) with gold accents (#C4956A)
 * RTL layout with Arabic navigation
 */
import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAllTasks, useInvoices, useClients } from "@/lib/api";
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderKanban,
  ListChecks,
  FolderOpen,
  CreditCard,
  Globe,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  Menu,
  Building2,
  LogOut,
  Sun,
  Moon,
  Bell,
  FileSignature,
  Target,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/ThemeContext";

const navItems = [
  { path: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { path: "/crm", label: "CRM", icon: Target },
  { path: "/appointments", label: "المواعيد", icon: CalendarDays },
  { path: "/clients", label: "العملاء", icon: Users, badge: 5 },
  { path: "/projects", label: "المشاريع", icon: FolderKanban },
  { path: "/tasks", label: "المهام", icon: ListChecks, badge: 5 },
  { path: "/documents", label: "المستندات", icon: FolderOpen },
  { path: "/payments", label: "الدفعات", icon: CreditCard },
  { path: "/quotations", label: "عروض الأسعار", icon: FileText, badge: 2 },
  { path: "/contracts", label: "العقود الهندسية", icon: FileSignature, badge: 1 },
  { path: "/client-portal", label: "بوابة العميل", icon: Globe },
  { path: "/reports", label: "التقارير", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { data: allTasks = [] } = useAllTasks();
  const { data: allInvoices = [] } = useInvoices();
  const { data: clients = [] } = useClients();
  const today = new Date().toISOString().slice(0, 10);

  const overdueTasks = allTasks.filter(
    (t) => t.status !== "done" && t.status !== "cancelled" && t.deadline && t.deadline < today
  );
  const pendingReview = allTasks.filter((t) => t.status === "blocked");
  const overdueInvoices = allInvoices.filter(
    (i) => i.status === "متأخرة" || (i.status === "مُرسلة" && i.dueDate && i.dueDate < today)
  );
  const notifCount = overdueTasks.length + pendingReview.length + overdueInvoices.length;

  const notifications = [
    ...overdueTasks.map((t) => ({ id: `t${t.id}`, dot: "bg-red-500", text: `مهمة متأخرة: ${t.name}`, sub: t.projectName })),
    ...pendingReview.map((t) => ({ id: `r${t.id}`, dot: "bg-amber-500", text: `بانتظار مراجعة: ${t.name}`, sub: t.projectName })),
    ...overdueInvoices.map((i) => ({ id: `i${i.id}`, dot: "bg-orange-500", text: `فاتورة متأخرة: ${i.invoiceNumber || i.id}`, sub: i.client })),
  ];

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 transition-all duration-300 flex flex-col
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
          lg:relative lg:translate-x-0`}
        style={{ backgroundColor: "oklch(0.22 0.04 250)" }}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-5 py-5 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "oklch(0.72 0.10 60)" }}>
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-white font-bold text-base leading-tight">ديناميك</h1>
              <p className="text-white/50 text-xs">استشارات هندسية</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200
                    ${isActive
                      ? "text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                    }
                    ${collapsed ? "justify-center" : ""}
                  `}
                  style={isActive ? { backgroundColor: "oklch(0.72 0.10 60 / 0.2)" } : {}}
                  onClick={() => setMobileOpen(false)}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[oklch(0.72_0.10_60)]" : ""}`} />
                  {!collapsed && (
                    <>
                      <span className="text-sm flex-1">{item.label}</span>
                      {((item.path === "/clients" ? clients.length : item.badge) || 0) > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0 h-5"
                          style={{ backgroundColor: "oklch(0.72 0.10 60)", color: "white" }}
                        >
                          {item.path === "/clients" ? clients.length : item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`px-3 py-4 border-t border-white/10 ${collapsed ? "text-center" : ""}`}>
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: "oklch(0.72 0.10 60)" }}>
                ن
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">نولينج</p>
                <p className="text-white/40 text-xs truncate">مدير النظام</p>
              </div>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 -left-3 w-6 h-6 rounded-full items-center justify-center bg-white shadow-md border border-gray-200 text-gray-500 hover:text-gray-700"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-16 border-b bg-background flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "oklch(0.22 0.04 250)" }}>
                {navItems.find((n) => n.path === location)?.label ||
                (location.startsWith("/clients/") ? "ملف العميل" :
                location.startsWith("/projects/") ? "تفاصيل المشروع" :
                "لوحة التحكم")}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifs(!showNotifs)}>
                <Bell className="w-5 h-5" />
                {notifCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center text-white px-1 bg-red-500">
                    {notifCount > 9 ? "9+" : notifCount}
                  </span>
                )}
              </Button>
              {showNotifs && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-background border rounded-xl shadow-lg z-50 overflow-hidden" dir="rtl">
                  <div className="p-3 border-b font-medium text-sm flex items-center justify-between">
                    <span>الإشعارات</span>
                    {notifCount > 0 && <span className="text-xs text-muted-foreground">{notifCount} غير مقروء</span>}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground">لا توجد إشعارات جديدة</div>
                    ) : notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 p-3 hover:bg-muted/30 border-b last:border-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                        <div>
                          <p className="text-xs font-medium">{n.text}</p>
                          <p className="text-xs text-muted-foreground">{n.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowNotifs(false)}>
                      إغلاق
                    </Button>
                  </div>
                </div>
              )}
            </div>
            {toggleTheme && (
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}>
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
