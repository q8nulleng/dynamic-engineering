/**
 * useEmployee — hook لإدارة جلسة الموظف وصلاحياته
 */
import { useState, useEffect, createContext, useContext } from "react";

export type EmployeeRole =
  | "admin"
  | "accountant"
  | "architect"
  | "secretary"
  | "structural"
  | "draftsman"
  | "facade_designer";

export interface EmployeeData {
  id: number;
  name: string;
  email: string;
  role: EmployeeRole;
  specialty: string;
  isActive: number;
  lastLogin: string | null;
}

// الصلاحيات حسب الدور
export const ROLE_PERMISSIONS: Record<EmployeeRole, {
  label: string;
  canViewFinance: boolean;   // الدفعات والمحاسبة
  canViewAll: boolean;       // كل الأقسام
  navItems: string[];        // الصفحات المسموح بها
}> = {
  admin: {
    label: "مدير النظام",
    canViewFinance: true,
    canViewAll: true,
    navItems: ["all"],
  },
  accountant: {
    label: "محاسب",
    canViewFinance: true,
    canViewAll: true,
    navItems: ["all"],
  },
  architect: {
    label: "م. معماري رئيسي",
    canViewFinance: false,
    canViewAll: false,
    navItems: ["/", "/projects", "/tasks", "/documents", "/clients", "/appointments", "/crm", "/work-plans", "/reports"],
  },
  secretary: {
    label: "سكرتير",
    canViewFinance: false,
    canViewAll: false,
    navItems: ["/", "/projects", "/tasks", "/documents", "/clients", "/appointments", "/crm", "/quotations", "/contracts", "/work-plans", "/settings"],
  },
  structural: {
    label: "م. إنشائي",
    canViewFinance: false,
    canViewAll: false,
    navItems: ["/projects", "/tasks", "/documents"],
  },
  draftsman: {
    label: "رسام",
    canViewFinance: false,
    canViewAll: false,
    navItems: ["/projects", "/tasks", "/documents"],
  },
  facade_designer: {
    label: "رسام واجهات",
    canViewFinance: false,
    canViewAll: false,
    navItems: ["/projects", "/tasks", "/documents"],
  },
};

export function getRoleLabel(role: EmployeeRole): string {
  return ROLE_PERMISSIONS[role]?.label || role;
}

export function canAccessPath(role: EmployeeRole, path: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.navItems[0] === "all") return true;
  return perms.navItems.some(p => path === p || path.startsWith(p + "/"));
}

// Context
interface EmployeeContextType {
  employee: EmployeeData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
}

import React from "react";
export const EmployeeContext = createContext<EmployeeContextType>({
  employee: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refetch: () => {},
});

export function useEmployee() {
  return useContext(EmployeeContext);
}

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/employees/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      } else {
        setEmployee(null);
      }
    } catch {
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMe(); }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/employees/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "فشل تسجيل الدخول");
    }
    const data = await res.json();
    setEmployee(data.employee);
  };

  const logout = async () => {
    await fetch("/api/employees/logout", { method: "POST", credentials: "include" });
    setEmployee(null);
  };

  return React.createElement(EmployeeContext.Provider, {
    value: { employee, loading, login, logout, refetch: fetchMe },
    children,
  });
}
