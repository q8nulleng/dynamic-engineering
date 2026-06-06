import mysql from './node_modules/mysql2/promise.js';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// 1. فحص المشاريع التي لها مراحل مكررة (أكثر من 7)
const [dupProjects] = await conn.execute(`
  SELECT project_id, COUNT(*) as cnt 
  FROM phases 
  GROUP BY project_id 
  HAVING cnt > 7
  ORDER BY cnt DESC
`);
console.log('مشاريع بها مراحل مكررة (أكثر من 7):', JSON.stringify(dupProjects, null, 2));

// 2. لكل مشروع مكرر، احتفظ فقط بأول 7 مراحل (أقل IDs) وأحذف الباقي
for (const row of dupProjects) {
  const projectId = row.project_id;
  console.log(`\nإصلاح مشروع: ${projectId} (${row.cnt} مرحلة)`);
  
  // جلب كل المراحل مرتبة بالـ ID
  const [allPhases] = await conn.execute(
    `SELECT id, title, \`order\` FROM phases WHERE project_id = ? ORDER BY id ASC`,
    [projectId]
  );
  
  console.log('المراحل الموجودة:', allPhases.map(p => `${p.id}: ${p.title}`).join(', '));
  
  // تحديد المراحل الفريدة (أول ظهور لكل عنوان)
  const seen = new Set();
  const keepIds = [];
  const deleteIds = [];
  
  for (const phase of allPhases) {
    if (!seen.has(phase.title)) {
      seen.add(phase.title);
      keepIds.push(phase.id);
    } else {
      deleteIds.push(phase.id);
    }
  }
  
  console.log('المراحل المحفوظة:', keepIds);
  console.log('المراحل المحذوفة:', deleteIds);
  
  if (deleteIds.length > 0) {
    // حذف المهام المرتبطة بالمراحل المكررة أولاً
    for (const phaseId of deleteIds) {
      await conn.execute(`DELETE FROM tasks WHERE phase_id = ?`, [phaseId]);
    }
    // حذف المراحل المكررة
    await conn.execute(
      `DELETE FROM phases WHERE id IN (${deleteIds.map(() => '?').join(',')})`,
      deleteIds
    );
    console.log(`✅ حُذفت ${deleteIds.length} مرحلة مكررة من مشروع ${projectId}`);
  }
  
  // إعادة ترتيب المراحل المتبقية
  const [remainingPhases] = await conn.execute(
    `SELECT id FROM phases WHERE project_id = ? ORDER BY id ASC`,
    [projectId]
  );
  for (let i = 0; i < remainingPhases.length; i++) {
    await conn.execute(`UPDATE phases SET \`order\` = ? WHERE id = ?`, [i, remainingPhases[i].id]);
  }
  console.log(`✅ تم إعادة ترتيب ${remainingPhases.length} مرحلة`);
}

// 3. فحص النتيجة النهائية
const [finalCheck] = await conn.execute(`
  SELECT project_id, COUNT(*) as cnt 
  FROM phases 
  GROUP BY project_id 
  ORDER BY cnt DESC
  LIMIT 10
`);
console.log('\nالنتيجة النهائية (أكثر 10 مشاريع):', JSON.stringify(finalCheck, null, 2));

await conn.end();
console.log('\n✅ اكتمل الإصلاح');
