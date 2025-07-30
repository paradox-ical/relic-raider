const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const CraftingSystem = require('./lib/crafting-system');

async function testCraftingDebug() {
  console.log('🔨 Testing Crafting System Debug\n');

  try {
    // Find any user in the database
    console.log('1️⃣ Finding a test user...');
    const user = await prisma.user.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (!user) {
      console.log('❌ No users found in database. Please create a user first.');
      return;
    }

    console.log(`   ✅ Found user: ${user.username} (ID: ${user.id})`);
    console.log(`   💰 Coins: ${user.coins}`);
    console.log(`   🎭 Class: ${user.playerClass || 'None'}`);
    console.log(`   📊 Level: ${user.level}`);

    // Test inventory
    console.log('\n2️⃣ Testing user inventory...');
    const inventory = await prisma.inventoryItem.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    console.log(`   📦 Total inventory items: ${inventory.length}`);
    for (const item of inventory) {
      console.log(`      ${item.item.name}: ${item.quantity}`);
    }

    // Test crafting stations
    console.log('\n3️⃣ Testing user crafting stations...');
    const userStations = await prisma.userCraftingStation.findMany({
      where: { userId: user.id },
      include: { station: true }
    });

    console.log(`   🏭 Unlocked stations: ${userStations.length}`);
    for (const userStation of userStations) {
      console.log(`      ${userStation.station.name}`);
    }

    // If no stations unlocked, try to unlock the blacksmith's forge
    if (userStations.length === 0) {
      console.log('\n4️⃣ No stations unlocked. Attempting to unlock Blacksmith\'s Forge...');
      try {
        await CraftingSystem.unlockStation(user.id, 'blacksmiths-forge');
        console.log('   ✅ Successfully unlocked Blacksmith\'s Forge');
        
        // Refresh user stations
        const updatedStations = await prisma.userCraftingStation.findMany({
          where: { userId: user.id },
          include: { station: true }
        });
        console.log(`   🏭 Now have ${updatedStations.length} unlocked stations`);
      } catch (error) {
        console.log('   ❌ Failed to unlock station:', error.message);
      }
    }

    // Test Mage weapon recipes (or any class if user has one)
    const playerClass = user.playerClass || 'Mage';
    console.log(`\n5️⃣ Testing ${playerClass} weapon recipes...`);
    
    // First, let's check what recipes exist in the database
    console.log('   🔍 Checking all recipes in database...');
    const allRecipes = await prisma.craftingRecipe.findMany({
      include: {
        resultEquipment: true,
        stationRecipes: {
          include: {
            station: true
          }
        }
      }
    });
    
    console.log(`   📋 Total recipes in database: ${allRecipes.length}`);
    
    // Check for Mage weapon recipes specifically
    const mageWeaponRecipes = allRecipes.filter(recipe => {
      const equipment = recipe.resultEquipment;
      return equipment.type === 'WEAPON' && 
             (equipment.name.includes('Cinderstick') || 
              equipment.name.includes('Frostroot') || 
              equipment.name.includes('Sparkstone'));
    });
    
    console.log(`   ⚔️ Mage weapon recipes found: ${mageWeaponRecipes.length}`);
    for (const recipe of mageWeaponRecipes) {
      console.log(`      - ${recipe.resultEquipment.name} (Level ${recipe.requiredLevel})`);
      console.log(`        Stations: ${recipe.stationRecipes.map(sr => sr.station.name).join(', ')}`);
    }
    
    // Check what stations exist
    console.log('\n   🏭 Checking available stations...');
    const allStations = await prisma.craftingStation.findMany();
    console.log(`   📋 Total stations in database: ${allStations.length}`);
    for (const station of allStations) {
      console.log(`      - ${station.name} (ID: ${station.id})`);
    }
    
    const weaponRecipes = await CraftingSystem.getEquipmentRecipesForStation(
      user.id, 
      'blacksmiths-forge', // Assuming this is the station ID
      playerClass, 
      'WEAPON'
    );

    console.log(`   ⚔️ Available ${playerClass} weapon recipes: ${weaponRecipes.length}`);
    
    // Let's test the query manually with the correct station ID
    console.log('\n   🔍 Testing query manually...');
    const correctStationId = 'cmdnjagnm0001l6d8p67ul4ki'; // From the debug output above
    
    const manualQuery = await prisma.craftingRecipe.findMany({
      where: {
        OR: [
          {
            resultEquipment: {
              name: { contains: 'Cinderstick' },
              type: 'WEAPON'
            }
          },
          {
            resultEquipment: {
              name: { contains: 'Frostroot' },
              type: 'WEAPON'
            }
          },
          {
            resultEquipment: {
              name: { contains: 'Sparkstone' },
              type: 'WEAPON'
            }
          }
        ],
        requiredLevel: { lte: user.level },
        stationRecipes: {
          some: {
            stationId: correctStationId
          }
        }
      },
      include: {
        resultEquipment: true,
        recipeIngredients: {
          include: {
            item: true
          }
        }
      }
    });
    
    console.log(`   📋 Manual query results: ${manualQuery.length} recipes`);
    for (const recipe of manualQuery) {
      console.log(`      - ${recipe.resultEquipment.name} (Level ${recipe.requiredLevel})`);
    }
    
    // Test with the correct station ID
    console.log('\n   🔍 Testing with correct station ID...');
    const weaponRecipesCorrect = await CraftingSystem.getEquipmentRecipesForStation(
      user.id, 
      correctStationId,
      playerClass, 
      'WEAPON'
    );
    
    console.log(`   ⚔️ Available ${playerClass} weapon recipes (correct ID): ${weaponRecipesCorrect.length}`);
    
    for (const recipe of weaponRecipesCorrect) {
      console.log(`\n   📋 Recipe: ${recipe.resultEquipment.name}`);
      console.log(`      Level Required: ${recipe.requiredLevel}`);
      console.log(`      Cost: ${recipe.craftingCost} coins`);
      console.log(`      Can Craft: ${recipe.canCraft ? '✅' : '❌'}`);
      
      // Check ingredients
      console.log(`      📦 Ingredients:`);
      for (const ingredient of recipe.recipeIngredients) {
        const userItem = await prisma.inventoryItem.findUnique({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: ingredient.itemId
            }
          }
        });
        
        const userQuantity = userItem ? userItem.quantity : 0;
        const status = userQuantity >= ingredient.quantity ? '✅' : '❌';
        console.log(`         ${status} ${ingredient.item.name}: ${userQuantity}/${ingredient.quantity}`);
      }
    }

    // Test canCraftRecipe function
    console.log('\n6️⃣ Testing canCraftRecipe function...');
    if (weaponRecipes.length > 0) {
      const firstRecipe = weaponRecipes[0];
      const canCraft = await CraftingSystem.canCraftRecipe(user.id, firstRecipe.id);
      console.log(`   🔍 Can craft ${firstRecipe.resultEquipment.name}: ${canCraft ? '✅' : '❌'}`);
      
      // Detailed check
      console.log(`   📊 Detailed check:`);
      console.log(`      User Level: ${user.level} >= Required: ${firstRecipe.requiredLevel} = ${user.level >= firstRecipe.requiredLevel ? '✅' : '❌'}`);
      console.log(`      User Coins: ${user.coins} >= Cost: ${firstRecipe.craftingCost} = ${user.coins >= firstRecipe.craftingCost ? '✅' : '❌'}`);
      
      for (const ingredient of firstRecipe.recipeIngredients) {
        const userItem = await prisma.inventoryItem.findUnique({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: ingredient.itemId
            }
          }
        });
        
        const userQuantity = userItem ? userItem.quantity : 0;
        const hasEnough = userQuantity >= ingredient.quantity;
        console.log(`      ${ingredient.item.name}: ${userQuantity} >= ${ingredient.quantity} = ${hasEnough ? '✅' : '❌'}`);
      }
    }

    // Test button creation logic
    console.log('\n7️⃣ Testing button creation logic...');
    for (const recipe of weaponRecipes) {
      let buttonStyle = 'Secondary';
      let emoji = '❌';
      
      if (recipe.canCraft) {
        buttonStyle = 'Success';
        emoji = '🔨';
      }
      
      console.log(`   🎯 ${recipe.resultEquipment.name}:`);
      console.log(`      Can Craft: ${recipe.canCraft ? '✅' : '❌'}`);
      console.log(`      Button Style: ${buttonStyle}`);
      console.log(`      Emoji: ${emoji}`);
      console.log(`      Custom ID: craft_item_blacksmiths-forge_${playerClass}_WEAPON_0_${recipe.id}`);
    }

    console.log('\n🎉 Crafting system debug completed!');
    console.log('\n📊 Summary:');
    console.log(`   - User: ${user.username} (Level ${user.level})`);
    console.log(`   - Inventory Items: ${inventory.length}`);
    console.log(`   - Unlocked Stations: ${userStations.length}`);
    console.log(`   - Available Recipes: ${weaponRecipes.length}`);

  } catch (error) {
    console.error('❌ Error in crafting debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCraftingDebug().catch(console.error);
}

module.exports = { testCraftingDebug }; 