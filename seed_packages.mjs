import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const allPackages = [
  // سكن خاص
  { name: "الباقة الأساسية - سكن خاص", price: "1,500", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Basic", features: JSON.stringify(["التصميم المعماري","التصميم الإنشائي","فحص التربة","إمكانية إيصال التيار","إصدار رخصة البلدية","مخطط صرف صحي","واجهة 3D","مخطط فرش","إشراف 3 أشهر"]) },
  { name: "الباقة المميزة - سكن خاص", price: "1,600", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Premium", features: JSON.stringify(["جميع خدمات الباقة الأساسية","تصميم الكهرباء والصحي","واجهات ثلاثية الأبعاد متعددة","تعديلات إضافية"]) },
  { name: "الباقة الذهبية - سكن خاص", price: "2,200", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Gold", features: JSON.stringify(["جميع خدمات الباقة المميزة","التصميم الداخلي","الإشراف الهندسي الكامل","تعديلات غير محدودة"]) },
  { name: "باقة الإشراف - سكن خاص", price: "150", buildingType: "سكن خاص", serviceType: "بناء جديد", level: "Supervision", features: JSON.stringify(["إشراف هندسي كامل","3 زيارات أسبوعياً","تقارير دورية","استلام أعمال"]) },
  { name: "باقة تعديل - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "تعديل", level: "-", features: JSON.stringify(["دراسة المخططات القائمة","تصميم التعديلات","تقديم البلدية","إشراف"]) },
  { name: "باقة إضافة - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "إضافة", level: "-", features: JSON.stringify(["دراسة المخططات القائمة","تصميم الإضافات","تقديم البلدية","إشراف"]) },
  { name: "باقة تعديل وإضافة - سكن خاص", price: "500", buildingType: "سكن خاص", serviceType: "تعديل وإضافة", level: "-", features: JSON.stringify(["دراسة المخططات القائمة","تصميم التعديلات والإضافات","تقديم البلدية","إشراف"]) },
  { name: "باقة الهدم - سكن خاص", price: "250", buildingType: "سكن خاص", serviceType: "هدم", level: "-", features: JSON.stringify(["إعداد مستندات الهدم","تقديم البلدية","إشراف على الهدم"]) },
  // استثماري
  { name: "الباقة الأساسية - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "بناء جديد", level: "Basic", features: JSON.stringify(["التصميم المعماري","التصميم الإنشائي","الكهرباء والصحي","تقديم البلدية","إشراف"]) },
  { name: "إضافة - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "إضافة", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم الإضافات","تقديم البلدية"]) },
  { name: "إضافة وتعديل - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "تعديل وإضافة", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم التعديلات والإضافات","تقديم البلدية"]) },
  { name: "تعديل - استثماري", price: "2,000", buildingType: "استثماري", serviceType: "تعديل", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم التعديلات","تقديم البلدية"]) },
  { name: "هدم - استثماري", price: "250", buildingType: "استثماري", serviceType: "هدم", level: "-", features: JSON.stringify(["إعداد مستندات الهدم","تقديم البلدية"]) },
  // تجاري
  { name: "الباقة الأساسية - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "بناء جديد", level: "Basic", features: JSON.stringify(["التصميم المعماري","التصميم الإنشائي","الكهرباء والصحي","تقديم البلدية","إشراف"]) },
  { name: "إضافة - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "إضافة", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم الإضافات","تقديم البلدية"]) },
  { name: "إضافة وتعديل - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "تعديل وإضافة", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم التعديلات والإضافات","تقديم البلدية"]) },
  { name: "تعديل - تجاري", price: "2,000", buildingType: "تجاري", serviceType: "تعديل", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم التعديلات","تقديم البلدية"]) },
  { name: "هدم - تجاري", price: "250", buildingType: "تجاري", serviceType: "هدم", level: "-", features: JSON.stringify(["إعداد مستندات الهدم","تقديم البلدية"]) },
  // صناعي
  { name: "الباقة الأساسية - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "بناء جديد", level: "Basic", features: JSON.stringify(["التصميم المعماري","التصميم الإنشائي","الكهرباء والصحي","تقديم البلدية","إشراف"]) },
  { name: "إضافة - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "إضافة", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم الإضافات","تقديم البلدية"]) },
  { name: "إضافة وتعديل - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "تعديل وإضافة", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم التعديلات والإضافات","تقديم البلدية"]) },
  { name: "تعديل - صناعي", price: "2,000", buildingType: "صناعي", serviceType: "تعديل", level: "-", features: JSON.stringify(["دراسة المخططات","تصميم التعديلات","تقديم البلدية"]) },
  { name: "هدم - صناعي", price: "250", buildingType: "صناعي", serviceType: "هدم", level: "-", features: JSON.stringify(["إعداد مستندات الهدم","تقديم البلدية"]) },
];

const conn = await mysql.createConnection(process.env.DATABASE_URL);
for (const pkg of allPackages) {
  await conn.execute(
    "INSERT INTO packages (name, price, building_type, service_type, level, features) VALUES (?, ?, ?, ?, ?, ?)",
    [pkg.name, pkg.price, pkg.buildingType, pkg.serviceType, pkg.level, pkg.features]
  );
}
console.log(`✅ Seeded ${allPackages.length} packages`);
await conn.end();
