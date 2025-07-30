const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CraftingSystem = require('./lib/crafting-system');

async function testCraftingSimple() {
  console.log('🔨 Simple Crafting System Test\n');

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

    // Get the Blacksmith's Forge station ID
    const blacksmithStation = await prisma.craftingStation.findFirst({
      where: { name: "Blacksmith's Forge" }
    });

    if (!blacksmithStation) {
      console.log('❌ Blacksmith\'s Forge station not found.');
      return;
    }

    console.log(`🏭 Found station: ${blacksmithStation.name} (ID: ${blacksmithStation.id})`);

    // Test getting recipes with the correct station ID
    const recipes = await CraftingSystem.getEquipmentRecipesForStation(
      user.id,
      blacksmithStation.id,
      'Mage',
      'WEAPON'
    );

    console.log(`\n📋 Found ${recipes.length} Mage weapon recipes:`);
    for (const recipe of recipes) {
      console.log(`   - ${recipe.resultEquipment.name} (Level ${recipe.requiredLevel})`);
      console.log(`     Can Craft: ${recipe.canCraft ? '✅' : '❌'}`);
    }

    if (recipes.length > 0) {
      console.log('\n🎯 Testing first recipe...');
      const firstRecipe = recipes[0];
      
      // Test if user can craft it
      const canCraft = await CraftingSystem.canCraftRecipe(user.id, firstRecipe.id);
      console.log(`   Can craft ${firstRecipe.resultEquipment.name}: ${canCraft ? '✅' : '❌'}`);
      
      if (canCraft) {
        console.log('   🎉 User can craft this item!');
      } else {
        console.log('   ❌ User cannot craft this item.');
      }
    }

    console.log('\n✅ Crafting system test completed!');

  } catch (error) {
    console.error('❌ Error in crafting test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCraftingSimple().catch(console.error);
}

module.exports = { testCraftingSimple }; 