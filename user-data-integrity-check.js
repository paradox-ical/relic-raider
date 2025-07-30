const { PrismaClient } = require('@prisma/client');
const UserManagement = require('./lib/user-management');

const prisma = new PrismaClient();

async function checkUserDataIntegrity() {
  console.log('🔍 Checking user data integrity...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany();
    console.log(`📊 Found ${users.length} users in database\n`);

    let corruptedUsers = [];
    let validUsers = 0;

    for (const user of users) {
      const validation = UserManagement.validateUserData(user);
      
      if (!validation.isValid) {
        corruptedUsers.push({
          id: user.id,
          discordId: user.discordId,
          username: user.username,
          issues: validation.issues
        });
      } else {
        validUsers++;
      }
    }

    console.log(`✅ Valid users: ${validUsers}`);
    console.log(`❌ Corrupted users: ${corruptedUsers.length}\n`);

    if (corruptedUsers.length > 0) {
      console.log('🔧 Corrupted users found:');
      corruptedUsers.forEach(user => {
        console.log(`  - ${user.username} (${user.discordId}): ${user.issues.join(', ')}`);
      });

      console.log('\n🛠️ Attempting to repair corrupted users...\n');

      let repairedCount = 0;
      let failedCount = 0;

      for (const corruptedUser of corruptedUsers) {
        const repairResult = await UserManagement.repairUserData(corruptedUser.id);
        
        if (repairResult.success) {
          console.log(`✅ Repaired user ${corruptedUser.username}: ${repairResult.message}`);
          if (repairResult.repairedFields) {
            console.log(`   Fixed fields: ${repairResult.repairedFields.join(', ')}`);
          }
          repairedCount++;
        } else {
          console.log(`❌ Failed to repair user ${corruptedUser.username}: ${repairResult.message}`);
          failedCount++;
        }
      }

      console.log(`\n📈 Repair Summary:`);
      console.log(`  - Successfully repaired: ${repairedCount}`);
      console.log(`  - Failed to repair: ${failedCount}`);
    } else {
      console.log('🎉 All user data is valid! No repairs needed.');
    }

  } catch (error) {
    console.error('❌ Error checking user data integrity:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function findOrphanedData() {
  console.log('🔍 Checking for orphaned data...\n');

  try {
    // Get all user IDs
    const allUserIds = await prisma.user.findMany({
      select: { id: true }
    });
    const userIdSet = new Set(allUserIds.map(u => u.id));

    // Check for orphaned inventory items (records where user doesn't exist)
    const allInventoryItems = await prisma.inventoryItem.findMany({
      select: { userId: true }
    });
    const orphanedInventory = allInventoryItems.filter(item => !userIdSet.has(item.userId));

    // Check for orphaned user equipment
    const allUserEquipment = await prisma.userEquipment.findMany({
      select: { userId: true }
    });
    const orphanedEquipment = allUserEquipment.filter(item => !userIdSet.has(item.userId));

    // Check for orphaned achievements
    const allUserAchievements = await prisma.userAchievement.findMany({
      select: { userId: true }
    });
    const orphanedAchievements = allUserAchievements.filter(item => !userIdSet.has(item.userId));

    // Check for orphaned titles
    const allUserTitles = await prisma.userTitle.findMany({
      select: { userId: true }
    });
    const orphanedTitles = allUserTitles.filter(item => !userIdSet.has(item.userId));

    console.log(`📦 Orphaned inventory items: ${orphanedInventory.length}`);
    console.log(`⚔️ Orphaned equipment: ${orphanedEquipment.length}`);
    console.log(`🏆 Orphaned achievements: ${orphanedAchievements.length}`);
    console.log(`👑 Orphaned titles: ${orphanedTitles.length}`);

    const totalOrphaned = orphanedInventory.length + orphanedEquipment.length + 
                          orphanedAchievements.length + orphanedTitles.length;

    if (totalOrphaned > 0) {
      console.log(`\n⚠️ Total orphaned records: ${totalOrphaned}`);
      console.log('💡 Consider running a cleanup script to remove orphaned data.');
      
      if (orphanedInventory.length > 0) {
        console.log(`   - Orphaned inventory items: ${orphanedInventory.length}`);
      }
      if (orphanedEquipment.length > 0) {
        console.log(`   - Orphaned equipment: ${orphanedEquipment.length}`);
      }
      if (orphanedAchievements.length > 0) {
        console.log(`   - Orphaned achievements: ${orphanedAchievements.length}`);
      }
      if (orphanedTitles.length > 0) {
        console.log(`   - Orphaned titles: ${orphanedTitles.length}`);
      }
    } else {
      console.log('\n✅ No orphaned data found!');
    }

  } catch (error) {
    console.error('❌ Error checking for orphaned data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function generateUserReport() {
  console.log('📊 Generating user data report...\n');

  try {
    const users = await prisma.user.findMany({
      include: {
        inventoryItems: true,
        userEquipment: true,
        userAchievements: true,
        userTitles: true,
        bossDefeats: true,
        userCraftingProgress: true,
        userSkills: true,
        equippedSkills: true,
        equippedGear: true
      }
    });

    console.log(`📈 User Statistics:`);
    console.log(`  - Total users: ${users.length}`);
    
    const activeUsers = users.filter(u => u.lastExplore && 
      (Date.now() - u.lastExplore.getTime()) < 7 * 24 * 60 * 60 * 1000);
    console.log(`  - Active users (last 7 days): ${activeUsers.length}`);
    
    const tutorialCompleted = users.filter(u => u.tutorialCompleted).length;
    console.log(`  - Tutorial completed: ${tutorialCompleted}`);
    
    const maxLevel = Math.max(...users.map(u => u.level));
    const avgLevel = Math.round(users.reduce((sum, u) => sum + u.level, 0) / users.length);
    console.log(`  - Highest level: ${maxLevel}`);
    console.log(`  - Average level: ${avgLevel}`);

    const totalCoins = users.reduce((sum, u) => sum + u.coins, 0);
    const avgCoins = Math.round(totalCoins / users.length);
    console.log(`  - Total coins in economy: ${totalCoins.toLocaleString()}`);
    console.log(`  - Average coins per user: ${avgCoins.toLocaleString()}`);

    console.log(`\n🎮 Class Distribution:`);
    const classStats = {};
    users.forEach(u => {
      const className = u.playerClass || 'Adventurer';
      classStats[className] = (classStats[className] || 0) + 1;
    });
    
    Object.entries(classStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([className, count]) => {
        const percentage = Math.round((count / users.length) * 100);
        console.log(`  - ${className}: ${count} (${percentage}%)`);
      });

  } catch (error) {
    console.error('❌ Error generating user report:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'check':
      await checkUserDataIntegrity();
      break;
    case 'orphaned':
      await findOrphanedData();
      break;
    case 'report':
      await generateUserReport();
      break;
    case 'all':
      await checkUserDataIntegrity();
      console.log('\n' + '='.repeat(50) + '\n');
      await findOrphanedData();
      console.log('\n' + '='.repeat(50) + '\n');
      await generateUserReport();
      break;
    default:
      console.log('Usage: node user-data-integrity-check.js <command>');
      console.log('Commands:');
      console.log('  check    - Check and repair corrupted user data');
      console.log('  orphaned - Find orphaned data records');
      console.log('  report   - Generate user statistics report');
      console.log('  all      - Run all checks');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkUserDataIntegrity,
  findOrphanedData,
  generateUserReport
}; 