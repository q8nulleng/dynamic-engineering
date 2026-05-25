# Project TODO

- [x] Fix vite.config.ts (__dirname → import.meta.dirname for ESM compatibility)
- [x] Fix main.tsx - resolve merge conflict, add tRPC provider and superjson
- [x] Fix Home.tsx - remove undefined useAuth reference
- [x] Fix storageProxy.ts - add type assertion for req.params[0]
- [x] Fix Contracts.tsx - add missing ContractTemplate type and hooks to api.ts
- [x] Fix command.tsx - remove unsupported showCloseButton prop
- [x] Add vite-env.d.ts for import.meta.env type support
- [x] Update package.json scripts to use new server/_core/index.ts entry point
- [x] Verify all 19 contract templates are present in database
- [x] Verify all APIs working (clients, projects, CRM, contracts, invoices, templates)
- [x] Verify UI rendering correctly (dashboard, CRM, contracts page)
- [x] Fix pnpm-lock.yaml mismatch with package.json for deployment
- [x] Fix: deployed site shows only 5 contract templates instead of 19
- [x] Improve PDF output formatting to match original contract documents
- [x] Fix PDF formatting: termsText shows as raw JSON/field names instead of formatted sections
- [x] Change client from "ورثة الجسار" to "شركة مايكوا لتركيب أنظمة التبريد" (company type)
- [x] Create 9 project tasks with correct statuses (completed/in-progress/pending)
- [x] Upload and organize documents (أوراق الجسار PDF) in documents section
- [x] Add signed contract copy to contracts section
- [x] Increase multer file size limit from 20MB to 50MB for large document uploads
- [x] Add signedFileUrl field to contracts table and API
- [x] Add "العقد الموقع (PDF)" download button in contracts detail view
- [x] Upload signed contract PDF (extracted pages 1-3 from أوراق الجسار)
- [x] Upload electricity request document (page 4 from أوراق الجسار)
- [x] Update client type to "company" for شركة مايكوا

## نظام المواعيد
- [x] إضافة جدول appointments في MySQL schema
- [x] إضافة API routes للمواعيد (CRUD)
- [x] إضافة خانة موعد في كرت CRM (تاريخ + وقت + سبب + مسؤول + واتساب)
- [x] إنشاء صفحة تقويم لعرض جميع المواعيد (تقويم شهري + قائمة)
- [x] ربط التقويم بالـ sidebar (رابط المواعيد في القائمة الجانبية)

## إصلاحات إنشاء المشروع
- [x] إصلاح POST /api/projects لإنشاء عميل تلقائياً عند إنشاء مشروع جديد
- [x] إصلاح POST /api/projects لإنشاء عقد فارغ تلقائياً مرتبط بالمشروع
- [x] إضافة مراحل عمل تلقائية لكل أنواع المشاريع (صناعي، سكن خاص، استثماري، تجاري)
- [x] تحسين Header صفحة ProjectDetail للموبايل
- [x] تحسين شريط المراحل في ProjectDetail للموبايل

## نظام خطط العمل المركزية
- [x] إنشاء جدول work_plans وwork_plan_phases وwork_plan_tasks في schema
- [x] ترحيل الجداول الجديدة إلى MySQL
- [x] إنشاء API routes لخطط العمل (CRUD)
- [x] إنشاء صفحة WorkPlans.tsx لإدارة الخطط المركزية
- [x] ربط صفحة خطط العمل بالـ sidebar
- [x] إضافة زر "استيراد خطة عمل" في صفحة تفاصيل المشروع
- [x] إضافة زر "إضافة مهمة" يدوياً في صفحة تفاصيل المشروع
- [x] إضافة خطط عمل افتراضية لكل نوع مشروع (صناعي، سكن خاص، استثماري، تجاري)

## نموذج طلبات المشروع الرقمي + تحديث خطط العمل
- [x] إنشاء نموذج طلبات المشروع الرقمي مع Canvas للرسم بالقلم
- [x] حقول النموذج: اسم المالك، رقم التلفون، بيانات القسيمة، مكونات كل دور، اتجاه الشمال، الطابع المعماري، مساحة الأرض
- [x] مساحة Canvas للرسم الحر (سكتش الكروكي) بالقلم على الآيباد
- [x] حفظ النموذج مرتبطاً بالمشروع في قاعدة البيانات
- [x] تحديث خطة عمل السكن الخاص بالمراحل والمهام الجديدة (7 مراحل)
- [x] بناء آلية الإطلاق التلقائي للمهام عند اكتمال مهمة trigger
- [x] ربط النموذج بصفحة تفاصيل المشروع وخطة العمل

## الكروت التفاعلية المدمجة
- [x] إضافة جدول client_documents في MySQL لحفظ الوثائق المرفوعة
- [x] إنشاء API routes لرفع الملفات وحفظها في storage + ربطها بالعميل
- [x] إنشاء API route لإرسال إيميل (طلب تربة / طلب كهرباء)
- [x] بناء كرت "تجهيز الملف" المدمج (رفع وثائق + إرسال طلب تربة + إرسال طلب كهرباء)
- [x] بناء كرت "التصميم المعماري" المدمج (نموذج طلبات + كروكي + جلسات + اعتماد)
- [x] بناء كرت "الواجهات والأعمدة" المدمج (رفع ملفات + إرسال للعميل + اعتماد)
- [x] بناء كرت "التقديم للبلدية" المدمج (checklist + رقم معاملة + ملاحظات)
- [x] دمج الكروت التفاعلية في صفحة ProjectDetail بدلاً من الكروت القديمة
- [x] اختبار رفع الملفات وحفظها في مستندات العميل
