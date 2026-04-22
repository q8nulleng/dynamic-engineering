/*
 * ProjectDetail - صفحة تفاصيل المشروع الداخلية
 * تعرض مراحل المشروع بنظام Kanban حسب نوع المشروع والخدمة
 * 4 أنواع مشاريع مدروسة من Odoo.sh:
 *   1. بناء جديد سكن خاص (S00048) - 5 مراحل - 39 مهمة
 *   2. بناء جديد صناعي (S00049) - 4 مراحل - 28 مهمة
 *   3. تعديل واضافة سكن خاص (S00047) - 4 مراحل - 42 مهمة
 *   4. تعديل سكن خاص (S00050) - 4 مراحل
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, Users, MapPin, Link2, CheckCircle2, Circle,
  Clock, ChevronDown, ChevronUp, AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useRoute, Link } from "wouter";

/* ===== Types ===== */
interface SubTask { name: string; done: boolean; assignee?: string; }
interface Task { name: string; status: "done" | "in_progress" | "blocked" | "pending"; subTasks?: SubTask[]; assignee?: string; }
interface Phase { title: string; subtitle?: string; tasks: Task[]; }
interface ProjectData {
  id: string; name: string; client: string; type: string; serviceType: string;
  area: string; quotation: string; progress: number; currentPhase: number; phases: Phase[];
}

/* ========================================================================
   قوالب المراحل حسب نوع المشروع - من Odoo.sh
   ======================================================================== */

/* --- مراحل الصب والأعمدة (مشتركة) --- */
const structuralSubTasks = (done: boolean[]): SubTask[] => [
  { name: "مرحلة الحفر", done: done[0] ?? false },
  { name: "مرحلة القواعد", done: done[1] ?? false },
  { name: "مرحلة أعمدة السرداب", done: done[2] ?? false },
  { name: "مرحلة صب سقف السرداب", done: done[3] ?? false },
  { name: "مرحلة أعمدة الدور الأرضي", done: done[4] ?? false },
  { name: "مرحلة صب سقف الدور الأرضي", done: done[5] ?? false },
  { name: "مرحلة أعمدة الدور الأول", done: done[6] ?? false },
  { name: "مرحلة صب سقف الدور الأول", done: done[7] ?? false },
  { name: "مرحلة أعمدة الدور الثاني", done: done[8] ?? false },
  { name: "مرحلة صب سقف الدور الثاني", done: done[9] ?? false },
  { name: "مرحلة أعمدة السطح", done: done[10] ?? false },
  { name: "مرحلة صب سقف السطح", done: done[11] ?? false },
];

/* ========================================================================
   بيانات المشاريع - 4 أنواع من Odoo.sh
   ======================================================================== */
const projectsDB: Record<string, ProjectData> = {

  /* ═══════════════════════════════════════════════════════════════════════
     النوع 1: بناء جديد سكن خاص (S00048 - نت - 39 مهمة - 5 مراحل)
     ═══════════════════════════════════════════════════════════════════════ */
  "S00048": {
    id: "S00048", name: "بناء جديد سكن خاص - نت", client: "فهد العتيبي",
    type: "سكن خاص", serviceType: "بناء جديد", area: "الجهراء", quotation: "S00048",
    progress: 55, currentPhase: 3,
    phases: [
      {
        title: "المرحلة الأولى", subtitle: "تجهيز الملف",
        tasks: [
          { name: "تصميم الكروكي", status: "done", assignee: "م. مارك" },
          { name: "تجميع المستندات", status: "done", assignee: "محمد ثروت", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: true }, { name: "الوثيقة", done: true },
          ]},
          { name: "العقد وتحصيل الدفعة الأولى", status: "done", assignee: "محمد ثروت" },
          { name: "تجهيز النماذج والتعهدات والتوقيع", status: "done", assignee: "محمد ثروت" },
          { name: "فحص التربة - كتاب الكهرباء", status: "done", assignee: "محمد ثروت", subTasks: [
            { name: "فحص التربة تم الإرسال", done: true }, { name: "فحص التربة تم الاعتماد", done: true },
            { name: "الكهرباء تم الإرسال", done: true }, { name: "الكهرباء تم الاعتماد", done: true },
          ]},
        ],
      },
      {
        title: "المرحلة الثانية", subtitle: "التصميم",
        tasks: [
          { name: "سيستم الأعمدة", status: "done", assignee: "م. أمين" },
          { name: "الواجهات", status: "done", assignee: "م. مصطفى" },
          { name: "رسم مخطط البلدية", status: "done", assignee: "عرفان" },
        ],
      },
      {
        title: "المرحلة الثالثة", subtitle: "البلدية والاعتماد",
        tasks: [
          { name: "إرسال للبلدية", status: "done", assignee: "محمد ثروت" },
          { name: "اعتماد البلدية", status: "done", assignee: "محمد ثروت" },
          { name: "تحصيل الدفعة الأخيرة من العقد", status: "done", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الرابعة", subtitle: "الكراسة والمخططات",
        tasks: [
          { name: "تصميم المخطط الإنشائي", status: "in_progress", assignee: "م. أمين",
            subTasks: structuralSubTasks([true,true,true,true,true,true,false,false,false,false,false,false]) },
          { name: "تصميم مخطط الصحي", status: "pending", assignee: "م. أمين" },
          { name: "تصميم مخطط الكهرباء", status: "pending", assignee: "م. أمين" },
          { name: "تصميم مخطط الفرش", status: "pending", assignee: "م. مصطفى" },
          { name: "تجهيز الكراسة النهائية", status: "pending", assignee: "م. مارك" },
        ],
      },
      {
        title: "المرحلة الخامسة", subtitle: "الإشراف",
        tasks: [
          { name: "إصدار تعهد الإشراف", status: "pending", assignee: "محمد ثروت" },
          { name: "الإشراف على التنفيذ", status: "pending", assignee: "م. فداء",
            subTasks: structuralSubTasks([false,false,false,false,false,false,false,false,false,false,false,false]) },
          { name: "كتب البنك", status: "pending", assignee: "محمد ثروت" },
          { name: "إنهاء الإشراف", status: "pending", assignee: "م. فداء" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════
     النوع 2: بناء جديد صناعي (S00049 - 28 مهمة - 4 مراحل)
     الفرق: المرحلة الثالثة فيها مطافي + تنظيم + بلدية (7 مهام)
     المرحلة الرابعة أبسط (3 مهام بدون كهرباء وفرش)
     لا يوجد مرحلة إشراف
     ═══════════════════════════════════════════════════════════════════════ */
  "S00049": {
    id: "S00049", name: "بناء جديد صناعي", client: "شركة الخليج",
    type: "صناعي", serviceType: "بناء جديد", area: "حولي", quotation: "S00049",
    progress: 30, currentPhase: 1,
    phases: [
      {
        title: "المرحلة الأولى", subtitle: "تجهيز الملف",
        tasks: [
          { name: "تصميم الكروكي", status: "done", assignee: "م. مارك" },
          { name: "تجميع المستندات", status: "done", assignee: "محمد ثروت", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: true }, { name: "الوثيقة", done: true },
          ]},
          { name: "العقد وتحصيل الدفعة الأولى", status: "done", assignee: "محمد ثروت" },
          { name: "تجهيز النماذج والتعهدات والتوقيع", status: "done", assignee: "محمد ثروت" },
          { name: "فحص التربة - كتاب الكهرباء", status: "done", assignee: "محمد ثروت", subTasks: [
            { name: "فحص التربة تم الإرسال", done: true }, { name: "فحص التربة تم الاعتماد", done: true },
            { name: "الكهرباء تم الإرسال", done: true }, { name: "الكهرباء تم الاعتماد", done: true },
          ]},
        ],
      },
      {
        title: "المرحلة الثانية", subtitle: "التصميم",
        tasks: [
          { name: "سيستم الأعمدة", status: "in_progress", assignee: "م. أمين" },
          { name: "الواجهات", status: "blocked", assignee: "م. مصطفى" },
          { name: "رسم مخطط البلدية", status: "blocked", assignee: "عرفان" },
        ],
      },
      {
        title: "المرحلة الثالثة", subtitle: "البلدية والاعتماد (مطافي + تنظيم + بلدية)",
        tasks: [
          { name: "إرسال للمطافي", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد المطافي", status: "blocked", assignee: "محمد ثروت" },
          { name: "إرسال للتنظيم", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد التنظيم", status: "blocked", assignee: "محمد ثروت" },
          { name: "إرسال للبلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد البلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "تحصيل الدفعة الأخيرة من العقد", status: "blocked", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الرابعة", subtitle: "الكراسة",
        tasks: [
          { name: "تصميم المخطط الإنشائي", status: "blocked", assignee: "م. أمين" },
          { name: "تصميم مخطط الصحي", status: "blocked", assignee: "م. أمين" },
          { name: "تجهيز الكراسة النهائية", status: "blocked", assignee: "م. مارك" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════
     النوع 3: تعديل واضافة سكن خاص (S00047 - 42 مهمة - 4 مراحل)
     الفرق: المرحلة الأولى تبدأ بدراسة المخطط القديم + كشف على العقار
     لا يوجد فحص تربة أو كتاب كهرباء أو نماذج وتعهدات
     المرحلة الثانية بدون واجهات
     المرحلة الرابعة: مخطط إنشائي كامل + كراسة (بدون صحي وكهرباء وفرش)
     ═══════════════════════════════════════════════════════════════════════ */
  "S00047": {
    id: "S00047", name: "تعديل وإضافة سكن خاص - مشرف", client: "تهاني خالد محمد بورسلي",
    type: "سكن خاص", serviceType: "تعديل وإضافة", area: "مشرف - حولي", quotation: "S00047",
    progress: 15, currentPhase: 0,
    phases: [
      {
        title: "المرحلة الأولى", subtitle: "تجهيز الملف",
        tasks: [
          { name: "دراسة المخطط الإنشائي القديم", status: "in_progress", assignee: "م. أمين",
            subTasks: structuralSubTasks([false,false,false,false,false,false,false,false,false,false,false,false]) },
          { name: "كشف على العقار", status: "done", assignee: "م. فداء" },
          { name: "كروكي", status: "done", assignee: "م. مارك" },
          { name: "جمع الوثائق والمستندات", status: "in_progress", assignee: "محمد ثروت", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: true }, { name: "الوثيقة", done: false },
          ]},
          { name: "العقد وتحصيل الدفعة الأولى", status: "done", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الثانية", subtitle: "التصميم",
        tasks: [
          { name: "سيستم الأعمدة", status: "blocked", assignee: "م. أمين" },
          { name: "رسم البلدية", status: "blocked", assignee: "عرفان" },
        ],
      },
      {
        title: "المرحلة الثالثة", subtitle: "البلدية والاعتماد",
        tasks: [
          { name: "إرسال للبلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد البلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "تحصيل الدفعة الأخيرة من العقد", status: "blocked", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الرابعة", subtitle: "الكراسة والإشراف",
        tasks: [
          { name: "مخطط إنشائي كامل", status: "blocked", assignee: "م. أمين",
            subTasks: structuralSubTasks([false,false,false,false,false,false,false,false,false,false,false,false]) },
          { name: "تجهيز الكراسة النهائية", status: "blocked", assignee: "م. مارك" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════
     النوع 4: تعديل سكن خاص (S00050 - 4 مراحل)
     مشابه لتعديل واضافة لكن بدون مراحل الإضافة
     المرحلة الأولى: دراسة مخطط قديم + كشف + مستندات + عقد (بدون كروكي)
     المرحلة الثانية: سيستم أعمدة + رسم بلدية
     المرحلة الثالثة: بلدية واعتماد
     المرحلة الرابعة: كراسة
     ═══════════════════════════════════════════════════════════════════════ */
  "S00050": {
    id: "S00050", name: "تعديل سكن خاص", client: "سالم المطيري",
    type: "سكن خاص", serviceType: "تعديل", area: "السالمية - حولي", quotation: "S00050",
    progress: 40, currentPhase: 1,
    phases: [
      {
        title: "المرحلة الأولى", subtitle: "تجهيز الملف",
        tasks: [
          { name: "دراسة المخطط الإنشائي القديم", status: "done", assignee: "م. أمين",
            subTasks: structuralSubTasks([true,true,true,true,true,true,true,true,true,true,true,true]) },
          { name: "كشف على العقار", status: "done", assignee: "م. فداء" },
          { name: "جمع الوثائق والمستندات", status: "done", assignee: "محمد ثروت", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: true }, { name: "الوثيقة", done: true },
          ]},
          { name: "العقد وتحصيل الدفعة الأولى", status: "done", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الثانية", subtitle: "التصميم",
        tasks: [
          { name: "سيستم الأعمدة", status: "in_progress", assignee: "م. أمين" },
          { name: "رسم البلدية", status: "blocked", assignee: "عرفان" },
        ],
      },
      {
        title: "المرحلة الثالثة", subtitle: "البلدية والاعتماد",
        tasks: [
          { name: "إرسال للبلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد البلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "تحصيل الدفعة الأخيرة من العقد", status: "blocked", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الرابعة", subtitle: "الكراسة",
        tasks: [
          { name: "مخطط إنشائي كامل", status: "blocked", assignee: "م. أمين",
            subTasks: structuralSubTasks([false,false,false,false,false,false,false,false,false,false,false,false]) },
          { name: "تجهيز الكراسة النهائية", status: "blocked", assignee: "م. مارك" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════
     النوع 2 (مثال ثاني): تعديل صناعي (S00051 - 5 مراحل)
     مزيج بين تعديل سكن خاص + متطلبات الصناعي (مطافي + تنظيم)
     ═══════════════════════════════════════════════════════════════════════ */
  "S00051": {
    id: "S00051", name: "تعديل صناعي", client: "مؤسسة البناء",
    type: "صناعي", serviceType: "تعديل", area: "الشويخ الصناعية", quotation: "S00051",
    progress: 10, currentPhase: 0,
    phases: [
      {
        title: "المرحلة الأولى", subtitle: "تجهيز الملف",
        tasks: [
          { name: "دراسة المخطط الإنشائي القديم", status: "in_progress", assignee: "م. أمين",
            subTasks: structuralSubTasks([true,true,false,false,false,false,false,false,false,false,false,false]) },
          { name: "كشف على العقار", status: "done", assignee: "م. فداء" },
          { name: "جمع الوثائق والمستندات", status: "in_progress", assignee: "محمد ثروت", subTasks: [
            { name: "الموقع العام", done: true }, { name: "المدنية", done: false }, { name: "الوثيقة", done: false },
          ]},
          { name: "العقد وتحصيل الدفعة الأولى", status: "pending", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الثانية", subtitle: "التصميم",
        tasks: [
          { name: "سيستم الأعمدة", status: "blocked", assignee: "م. أمين" },
          { name: "رسم البلدية", status: "blocked", assignee: "عرفان" },
        ],
      },
      {
        title: "المرحلة الثالثة", subtitle: "البلدية والاعتماد (مطافي + تنظيم + بلدية)",
        tasks: [
          { name: "إرسال للمطافي", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد المطافي", status: "blocked", assignee: "محمد ثروت" },
          { name: "إرسال للتنظيم", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد التنظيم", status: "blocked", assignee: "محمد ثروت" },
          { name: "إرسال للبلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "اعتماد البلدية", status: "blocked", assignee: "محمد ثروت" },
          { name: "تحصيل الدفعة الأخيرة من العقد", status: "blocked", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الرابعة", subtitle: "الكراسة",
        tasks: [
          { name: "مخطط إنشائي كامل", status: "blocked", assignee: "م. أمين" },
          { name: "تصميم مخطط الصحي", status: "blocked", assignee: "م. أمين" },
          { name: "تجهيز الكراسة النهائية", status: "blocked", assignee: "م. مارك" },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════
     مثال إضافي: بناء جديد سكن خاص (S00045 - شبه مكتمل)
     لتوضيح مشروع في مرحلة الإشراف
     ═══════════════════════════════════════════════════════════════════════ */
  "S00045": {
    id: "S00045", name: "فيلا - صباح الأحمد", client: "خالد الرشيدي",
    type: "سكن خاص", serviceType: "بناء جديد", area: "صباح الأحمد - مبارك الكبير", quotation: "S00045",
    progress: 90, currentPhase: 4,
    phases: [
      {
        title: "المرحلة الأولى", subtitle: "تجهيز الملف",
        tasks: [
          { name: "تصميم الكروكي", status: "done", assignee: "م. مارك" },
          { name: "تجميع المستندات", status: "done", assignee: "محمد ثروت" },
          { name: "العقد وتحصيل الدفعة الأولى", status: "done", assignee: "محمد ثروت" },
          { name: "تجهيز النماذج والتعهدات والتوقيع", status: "done", assignee: "محمد ثروت" },
          { name: "فحص التربة - كتاب الكهرباء", status: "done", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الثانية", subtitle: "التصميم",
        tasks: [
          { name: "سيستم الأعمدة", status: "done", assignee: "م. أمين" },
          { name: "الواجهات", status: "done", assignee: "م. مصطفى" },
          { name: "رسم مخطط البلدية", status: "done", assignee: "عرفان" },
        ],
      },
      {
        title: "المرحلة الثالثة", subtitle: "البلدية والاعتماد",
        tasks: [
          { name: "إرسال للبلدية", status: "done", assignee: "محمد ثروت" },
          { name: "اعتماد البلدية", status: "done", assignee: "محمد ثروت" },
          { name: "تحصيل الدفعة الأخيرة من العقد", status: "done", assignee: "محمد ثروت" },
        ],
      },
      {
        title: "المرحلة الرابعة", subtitle: "الكراسة والمخططات",
        tasks: [
          { name: "تصميم المخطط الإنشائي", status: "done", assignee: "م. أمين" },
          { name: "تصميم مخطط الصحي", status: "done", assignee: "م. أمين" },
          { name: "تصميم مخطط الكهرباء", status: "done", assignee: "م. أمين" },
          { name: "تصميم مخطط الفرش", status: "done", assignee: "م. مصطفى" },
          { name: "تجهيز الكراسة النهائية", status: "done", assignee: "م. مارك" },
        ],
      },
      {
        title: "المرحلة الخامسة", subtitle: "الإشراف",
        tasks: [
          { name: "إصدار تعهد الإشراف", status: "done", assignee: "محمد ثروت" },
          { name: "الإشراف على التنفيذ", status: "in_progress", assignee: "م. فداء",
            subTasks: structuralSubTasks([true,true,true,true,true,true,true,true,true,true,true,true]) },
          { name: "كتب البنك", status: "done", assignee: "محمد ثروت" },
          { name: "إنهاء الإشراف", status: "pending", assignee: "م. فداء" },
        ],
      },
    ],
  },
};

/* ===== Visual Config ===== */
const phaseColors = [
  "oklch(0.55 0.15 250)", "oklch(0.72 0.10 60)", "oklch(0.60 0.15 280)",
  "oklch(0.60 0.12 30)", "oklch(0.55 0.15 150)",
];

const statusConfig = {
  done: { label: "مكتمل", color: "oklch(0.55 0.15 150)", icon: CheckCircle2, bg: "bg-green-50 text-green-700" },
  in_progress: { label: "قيد العمل", color: "oklch(0.55 0.15 250)", icon: Clock, bg: "bg-blue-50 text-blue-700" },
  blocked: { label: "معلّق", color: "oklch(0.60 0.12 30)", icon: AlertCircle, bg: "bg-orange-50 text-orange-700" },
  pending: { label: "لم يبدأ", color: "oklch(0.70 0.00 0)", icon: Circle, bg: "bg-gray-50 text-gray-500" },
};

export { projectsDB };

export default function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = params?.id || "";
  const project = projectsDB[projectId];
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-muted-foreground">المشروع غير موجود</p>
        <Link href="/projects"><Button variant="outline"><ArrowRight className="w-4 h-4 ml-2" />العودة للمشاريع</Button></Link>
      </div>
    );
  }

  const getPhaseProgress = (phase: Phase) => {
    const total = phase.tasks.length;
    const done = phase.tasks.filter(t => t.status === "done").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  };

  const totalTasks = project.phases.reduce((s, p) => s + p.tasks.length, 0);
  const doneTasks = project.phases.reduce((s, p) => s + p.tasks.filter(t => t.status === "done").length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/projects">
          <Button variant="outline" size="sm" className="shrink-0"><ArrowRight className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{project.name}</h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{project.client}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.area}</span>
            <span className="flex items-center gap-1" dir="ltr" style={{ fontFamily: "'Space Grotesk'" }}>
              <Link2 className="w-3 h-3" />{project.quotation}
            </span>
          </div>
        </div>
        <div className="text-left shrink-0">
          <Badge variant="outline" className="text-xs">{project.type}</Badge>
          <Badge variant="secondary" className="text-xs mr-1">{project.serviceType}</Badge>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/20">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">الإنجاز الكلي</span>
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk'" }}>{doneTasks}/{totalTasks} مهمة</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk'", color: phaseColors[project.currentPhase] || phaseColors[0] }}>
          {project.progress}%
        </span>
      </div>

      {/* Phase Timeline */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {project.phases.map((phase, pi) => {
          const phaseProgress = getPhaseProgress(phase);
          const isCurrent = pi === project.currentPhase;
          const isDone = phaseProgress === 100;
          const color = phaseColors[pi % phaseColors.length];
          return (
            <div key={pi} className="flex items-center gap-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs whitespace-nowrap ${isCurrent ? "shadow-sm" : ""}`}
                style={{
                  borderColor: isCurrent ? color : isDone ? "oklch(0.55 0.15 150)" : undefined,
                  backgroundColor: isCurrent ? `color-mix(in oklch, ${color} 8%, white)` : undefined,
                }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                  style={{ backgroundColor: isDone ? "oklch(0.55 0.15 150)" : isCurrent ? color : "oklch(0.80 0.00 0)" }}>
                  {isDone ? "✓" : pi + 1}
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium ${isDone ? "text-green-700" : isCurrent ? "" : "text-muted-foreground"}`}>{phase.title}</span>
                  {phase.subtitle && <span className="text-[9px] text-muted-foreground">{phase.subtitle}</span>}
                </div>
                <span className="text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{phaseProgress}%</span>
              </div>
              {pi < project.phases.length - 1 && <div className="w-4 h-px bg-border shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
        {project.phases.map((phase, pi) => {
          const color = phaseColors[pi % phaseColors.length];
          const phaseProgress = getPhaseProgress(phase);
          const isCurrent = pi === project.currentPhase;
          const phaseDone = phase.tasks.filter(t => t.status === "done").length;

          return (
            <div key={pi} className="min-w-[280px] w-[280px] shrink-0">
              <div className="mb-3 px-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <h3 className="text-sm font-bold">{phase.title}</h3>
                  {isCurrent && <Badge className="text-[9px] text-white px-1.5" style={{ backgroundColor: color }}>الحالية</Badge>}
                </div>
                {phase.subtitle && <p className="text-[10px] text-muted-foreground mr-5 mb-1">{phase.subtitle}</p>}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${phaseProgress}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{phaseDone}/{phase.tasks.length}</span>
                </div>
              </div>

              <div className="space-y-2">
                {phase.tasks.map((task, ti) => {
                  const taskKey = `${pi}-${ti}`;
                  const isExpanded = expandedTask === taskKey;
                  const config = statusConfig[task.status];
                  const StatusIcon = config.icon;
                  const hasSubTasks = task.subTasks && task.subTasks.length > 0;
                  const subDone = task.subTasks?.filter(st => st.done).length || 0;
                  const subTotal = task.subTasks?.length || 0;

                  return (
                    <div key={ti} className={`p-3 rounded-lg border transition-all ${hasSubTasks ? "cursor-pointer" : ""} ${isExpanded ? "shadow-sm" : "hover:shadow-sm"}`}
                      style={isExpanded ? { borderColor: color } : {}}
                      onClick={() => hasSubTasks && setExpandedTask(isExpanded ? null : taskKey)}>
                      <div className="flex items-start gap-2">
                        <StatusIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: config.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium leading-tight">{task.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[9px] px-1.5 h-4 ${config.bg}`} variant="secondary">{config.label}</Badge>
                            {task.assignee && <span className="text-[10px] text-muted-foreground">{task.assignee}</span>}
                          </div>
                          {hasSubTasks && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${subTotal > 0 ? (subDone / subTotal) * 100 : 0}%`, backgroundColor: color }} />
                              </div>
                              <span className="text-[9px] text-muted-foreground" style={{ fontFamily: "'Space Grotesk'" }}>{subDone}/{subTotal}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          )}
                        </div>
                      </div>
                      {isExpanded && task.subTasks && (
                        <div className="mt-2 pt-2 border-t space-y-1" onClick={(e) => e.stopPropagation()}>
                          {task.subTasks.map((st, sti) => (
                            <div key={sti} className="flex items-center gap-2 py-0.5 text-[11px]">
                              {st.done ? <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" /> : <Circle className="w-3 h-3 text-gray-300 shrink-0" />}
                              <span className={`flex-1 ${st.done ? "line-through text-muted-foreground" : ""}`}>{st.name}</span>
                              {st.assignee && <span className="text-[9px] text-muted-foreground">{st.assignee}</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
