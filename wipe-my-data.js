const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeMyData() {
  console.log('⚠️ Wiping all user data from the database...');
  try {
    // Delete in order to avoid foreign key constraint errors
    console.log('Deleting user achievements...');
    await prisma.userAchievement.deleteMany();
    
    console.log('Deleting user titles...');
    await prisma.userTitle.deleteMany();
    
    console.log('Deleting inventory items...');
    await prisma.inventoryItem.deleteMany();
    
    console.log('Deleting user collections...');
    await prisma.userCollection.deleteMany();
    
    console.log('Deleting user brushes...');
    await prisma.userBrush.deleteMany();
    
    console.log('Deleting user maps...');
    await prisma.userMap.deleteMany();
    
    console.log('Deleting user challenge progress...');
    await prisma.userChallengeProgress.deleteMany();
    
    console.log('Deleting hidden achievement discoveries...');
    await prisma.hiddenAchievementDiscovery.deleteMany();
    
    console.log('Deleting users...');
    await prisma.user.deleteMany();
    
    console.log('✅ All user data wiped successfully!');
  } catch (error) {
    console.error('❌ Error wiping user data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeMyData(); 