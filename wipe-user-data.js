const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeUserData() {
  console.log('⚠️ Wiping all user data from the database...');
  try {
    // Delete in order to avoid foreign key constraint errors
    await prisma.userAchievement.deleteMany();
    await prisma.userTitle.deleteMany();
    await prisma.inventoryItem.deleteMany();
    await prisma.userCollection.deleteMany();
    await prisma.userBrush.deleteMany();
    await prisma.userMap.deleteMany();
    await prisma.userChallengeProgress.deleteMany();
    await prisma.hiddenAchievementDiscovery.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ All user data wiped.');
  } catch (error) {
    console.error('❌ Error wiping user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeUserData(); 