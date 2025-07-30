const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupOrphanedAndDuplicateTitles() {
  console.log('🧹 Cleaning up orphaned and duplicate user title records...');

  try {
    // 1. Remove orphaned user title records
    const orphanedUserTitles = await prisma.userTitle.findMany({
      include: { title: true }
    });
    const orphanedRecords = orphanedUserTitles.filter(ut => !ut.title);
    if (orphanedRecords.length > 0) {
      console.log(`Found ${orphanedRecords.length} orphaned user title records. Deleting...`);
      await Promise.all(orphanedRecords.map(record =>
        prisma.userTitle.delete({ where: { id: record.id } })
      ));
      console.log(`✅ Deleted ${orphanedRecords.length} orphaned user title records.`);
    } else {
      console.log('✅ No orphaned user title records found!');
    }

    // 2. Remove duplicate user title records (same userId and titleId)
    const allUserTitles = await prisma.userTitle.findMany();
    const seen = new Set();
    const duplicates = [];
    allUserTitles.forEach(ut => {
      const key = ut.userId + '|' + ut.titleId;
      if (seen.has(key)) {
        duplicates.push(ut.id);
      } else {
        seen.add(key);
      }
    });
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate user title records. Deleting...`);
      await Promise.all(duplicates.map(id =>
        prisma.userTitle.delete({ where: { id } })
      ));
      console.log(`✅ Deleted ${duplicates.length} duplicate user title records.`);
    } else {
      console.log('✅ No duplicate user title records found!');
    }

  } catch (error) {
    console.error('❌ Error cleaning up titles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedAndDuplicateTitles(); 