import { useState, useEffect } from "react";
import { useEmployee, getRoleLabel, ROLE_PERMISSIONS, type EmployeeRole } from "@/hooks/useEmployee";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { UserPlus, Edit, Trash2, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: EmployeeRole;
  specialty: string;
  isActive: number;
  lastLogin: string | null;
}

const ROLES: { value: EmployeeRole; label: string }[] = [
  { value: "admin", label: "مدير النظام" },
  { value: "accountant", label: "محاسب" },
  { value: "architect", label: "م. معماري رئيسي" },
  { value: "secretary", label: "سكرتير" },
  { value: "structural", label: "م. إنشائي" },
  { value: "draftsman", label: "رسام" },
  { value: "facade_designer", label: "رسام واجهات" },
];

const ROLE_COLORS: Record<EmployeeRole, string> = {
  admin: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  accountant: "bg-green-500/20 text-green-300 border-green-500/30",
  architect: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  secretary: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  structural: "bg-red-500/20 text-red-300 border-red-500/30",
  draftsman: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  facade_designer: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

export default function EmployeesAdmin() {
  const { employee: currentUser } = useEmployee();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "draftsman" as EmployeeRole, specialty: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employees", { credentials: "include" });
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("فشل تحميل الموظفين");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  const openAdd = () => {
    setEditingEmp(null);
    setForm({ name: "", email: "", password: "", role: "draftsman", specialty: "" });
    setShowDialog(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setForm({ name: emp.name, email: emp.email, password: "", role: emp.role, specialty: emp.specialty || "" });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) return toast.error("الاسم والبريد مطلوبان");
    if (!editingEmp && !form.password) return toast.error("كلمة المرور مطلوبة للموظف الجديد");
    setSaving(true);
    try {
      const body: any = { name: form.name, email: form.email, role: form.role, specialty: form.specialty };
      if (form.password) body.password = form.password;

      const url = editingEmp ? `/api/employees/${editingEmp.id}` : "/api/employees";
      const method = editingEmp ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success(editingEmp ? "تم تحديث بيانات الموظف" : "تم إضافة الموظف بنجاح");
      setShowDialog(false);
      fetchEmployees();
    } catch (e: any) {
      toast.error(e.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (emp: Employee) => {
    try {
      await fetch(`/api/employees/${emp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: emp.isActive ? 0 : 1 }),
      });
      toast.success(emp.isActive ? "تم إيقاف الحساب" : "تم تفعيل الحساب");
      fetchEmployees();
    } catch {
      toast.error("فشل تحديث الحالة");
    }
  };

  const handleDelete = async (emp: Employee) => {
    if (!confirm(`هل تريد حذف حساب ${emp.name}؟`)) return;
    try {
      await fetch(`/api/employees/${emp.id}`, { method: "DELETE", credentials: "include" });
      toast.success("تم حذف الحساب");
      fetchEmployees();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  // فقط المدير يمكنه الوصول
  if (currentUser?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">ليس لديك صلاحية الوصول لهذه الصفحة</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة الموظفين</h1>
          <p className="text-slate-400 text-sm mt-1">إدارة حسابات وصلاحيات فريق العمل</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEmployees} className="border-slate-600 text-slate-300">
            <RefreshCw className="w-4 h-4 ml-1" />
            تحديث
          </Button>
          <Button onClick={openAdd} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
            <UserPlus className="w-4 h-4 ml-1" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* جدول الموظفين */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700/50 hover:bg-transparent">
              <TableHead className="text-slate-400 text-right">الاسم</TableHead>
              <TableHead className="text-slate-400 text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-slate-400 text-right">الدور</TableHead>
              <TableHead className="text-slate-400 text-right">الصلاحيات</TableHead>
              <TableHead className="text-slate-400 text-right">الحالة</TableHead>
              <TableHead className="text-slate-400 text-right">آخر دخول</TableHead>
              <TableHead className="text-slate-400 text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">جارٍ التحميل...</TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">لا يوجد موظفون بعد</TableCell>
              </TableRow>
            ) : employees.map(emp => {
              const perms = ROLE_PERMISSIONS[emp.role];
              return (
                <TableRow key={emp.id} className="border-slate-700/30 hover:bg-slate-700/20">
                  <TableCell className="text-white font-medium">{emp.name}</TableCell>
                  <TableCell className="text-slate-300 text-sm" dir="ltr">{emp.email}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full border ${ROLE_COLORS[emp.role]}`}>
                      {getRoleLabel(emp.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {perms.canViewAll
                        ? <span className="text-xs text-green-400">كل الأقسام</span>
                        : <span className="text-xs text-amber-400">مشاريع + مهام{perms.canViewFinance ? " + مالية" : ""}</span>
                      }
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.isActive ? "default" : "secondary"}
                      className={emp.isActive ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-slate-600/50 text-slate-400"}>
                      {emp.isActive ? "نشط" : "موقوف"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">
                    {emp.lastLogin ? new Date(emp.lastLogin).toLocaleDateString("ar-KW") : "لم يسجل بعد"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(emp)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-white">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(emp)}
                        className={`h-7 w-7 p-0 ${emp.isActive ? "text-amber-400 hover:text-amber-300" : "text-green-400 hover:text-green-300"}`}>
                        {emp.isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-300">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialog إضافة/تعديل */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingEmp ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-slate-300">الاسم الكامل</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="م. مصطفى المعامري"
                className="bg-slate-700/50 border-slate-600 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">البريد الإلكتروني</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="example@gmail.com" type="email" dir="ltr"
                className="bg-slate-700/50 border-slate-600 text-white text-left" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">
                {editingEmp ? "كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)" : "كلمة المرور"}
              </Label>
              <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" type="password"
                className="bg-slate-700/50 border-slate-600 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">الدور الوظيفي</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as EmployeeRole }))}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value} className="text-white hover:bg-slate-700">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                {ROLE_PERMISSIONS[form.role].canViewAll
                  ? "✓ يرى جميع الأقسام بما فيها المالية"
                  : ROLE_PERMISSIONS[form.role].canViewFinance
                  ? "✓ يرى جميع الأقسام بما فيها المالية"
                  : "✓ يرى المشاريع والمهام فقط (بدون المالية)"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">التخصص (اختياري)</Label>
              <Input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
                placeholder="مثال: تصميم معماري، واجهات..."
                className="bg-slate-700/50 border-slate-600 text-white" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}
              className="border-slate-600 text-slate-300">إلغاء</Button>
            <Button onClick={handleSave} disabled={saving}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold">
              {saving ? "جارٍ الحفظ..." : editingEmp ? "حفظ التعديلات" : "إضافة الموظف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
