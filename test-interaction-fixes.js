const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CraftingSystem = require('./lib/crafting-system');

async function testInteractionFixes() {
  console.log('🔧 Testing Interaction Fixes\n');

  try {
    // Find a user
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!user) {
      console.log('❌ No users found in database.');
      return;
    }

    console.log(`✅ Testing with user: ${user.username} (Level ${user.level})`);

    // Test 1: Check if user already has Blacksmith's Forge unlocked
    console.log('\n1️⃣ Testing station unlock status...');
    const userStations = await prisma.userCraftingStation.findMany({
      where: { userId: user.id },
      include: { station: true }
    });

    const blacksmithStation = await prisma.craftingStation.findFirst({
      where: { name: "Blacksmith's Forge" }
    });

    if (!blacksmithStation) {
      console.log('❌ Blacksmith\'s Forge station not found.');
      return;
    }

    const hasBlacksmith = userStations.some(us => us.stationId === blacksmithStation.id);
    console.log(`   🏭 Blacksmith's Forge unlocked: ${hasBlacksmith ? '✅' : '❌'}`);

    // Test 2: Try to unlock the station (should handle duplicate gracefully)
    console.log('\n2️⃣ Testing station unlock with upsert...');
    const unlockResult = await CraftingSystem.unlockStation(user.id, blacksmithStation.id);
    
    console.log(`   📋 Unlock result: ${unlockResult.success ? '✅' : '❌'}`);
    console.log(`   💬 Message: ${unlockResult.message}`);

    // Test 3: Verify the station is still accessible
    console.log('\n3️⃣ Testing station accessibility...');
    const recipes = await CraftingSystem.getEquipmentRecipesForStation(
      user.id,
      blacksmithStation.id,
      'Mage',
      'WEAPON'
    );

    console.log(`   📋 Available recipes: ${recipes.length}`);
    if (recipes.length > 0) {
      console.log(`   🎯 First recipe: ${recipes[0].resultEquipment.name}`);
      console.log(`   🔨 Can craft: ${recipes[0].canCraft ? '✅' : '❌'}`);
    }

    // Test 4: Check user's coins (should not be deducted if already unlocked)
    console.log('\n4️⃣ Testing coin balance...');
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    console.log(`   💰 Original coins: ${user.coins}`);
    console.log(`   💰 Current coins: ${updatedUser.coins}`);
    console.log(`   💰 Difference: ${user.coins - updatedUser.coins}`);

    console.log('\n✅ Interaction fixes test completed!');

  } catch (error) {
    console.error('❌ Error in interaction fixes test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testInteractionFixes().catch(console.error);
}

module.exports = { testInteractionFixes }; 