const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedCraftingSystem() {
  console.log('🔨 Seeding crafting system...');

  // Create basic crafting stations
  const stations = [
    {
      name: 'Basic Crafting Table',
      description: 'A simple table for combining basic materials',
      location: 'main_menu',
      unlockCost: 0,
      requiredLevel: 1
    },
    {
      name: 'Advanced Forge',
      description: 'A specialized forge for creating weapons and armor',
      location: 'main_menu',
      unlockCost: 1000,
      requiredLevel: 10
    },
    {
      name: 'Mystic Altar',
      description: 'An ancient altar for crafting magical items',
      location: 'main_menu',
      unlockCost: 5000,
      requiredLevel: 25
    },
    {
      name: 'Boss Fragment Workshop',
      description: 'A specialized workshop for combining boss fragments',
      location: 'main_menu',
      unlockCost: 10000,
      requiredLevel: 50
    }
  ];

  for (const station of stations) {
    await prisma.craftingStation.upsert({
      where: { name: station.name },
      update: {},
      create: station
    });
  }

  // Create basic item combination recipes
  const recipes = [
    // Common to Uncommon combinations
    {
      name: 'Combine Common Aztec Items',
      description: 'Combine 3 common Aztec items to create an uncommon relic',
      resultItemName: 'Relic of Aztec',
      resultQuantity: 1,
      craftingCost: 50,
      requiredLevel: 1,
      category: 'combination',
      ingredients: [
        { itemName: 'Tablet of Aztec', quantity: 2 },
        { itemName: 'Statue of Flame', quantity: 1 }
      ]
    },
    {
      name: 'Combine Common Norse Items',
      description: 'Combine 3 common Norse items to create an uncommon relic',
      resultItemName: 'Relic of Norse',
      resultQuantity: 1,
      craftingCost: 50,
      requiredLevel: 1,
      category: 'combination',
      ingredients: [
        { itemName: 'Coin of Norse', quantity: 2 },
        { itemName: 'Statue of Wisdom', quantity: 1 }
      ]
    },
    {
      name: 'Combine Common Egyptian Items',
      description: 'Combine 3 common Egyptian items to create an uncommon relic',
      resultItemName: 'Relic of Egyptian',
      resultQuantity: 1,
      craftingCost: 50,
      requiredLevel: 1,
      category: 'combination',
      ingredients: [
        { itemName: 'Charm of Egyptian', quantity: 2 },
        { itemName: 'Relic of Flame', quantity: 1 }
      ]
    },
    {
      name: 'Combine Beast Materials',
      description: 'Combine beast materials to create a stronger component',
      resultItemName: 'Uncommon Relic Shard',
      resultQuantity: 1,
      craftingCost: 25,
      requiredLevel: 1,
      category: 'combination',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 3 },
        { itemName: 'Frayed Hide', quantity: 2 }
      ]
    },

    // Uncommon to Rare combinations
    {
      name: 'Forge Rare Beast Fang',
      description: 'Combine uncommon items to create a rare beast fang',
      resultItemName: 'Rare Beast Fang',
      resultQuantity: 1,
      craftingCost: 150,
      requiredLevel: 5,
      category: 'combination',
      ingredients: [
        { itemName: 'Uncommon Relic Shard', quantity: 2 },
        { itemName: 'Duskwalker Idol', quantity: 1 }
      ]
    },
    {
      name: 'Create Echoing Horn',
      description: 'Combine uncommon items to create an echoing horn',
      resultItemName: 'Echoing Horn',
      resultQuantity: 1,
      craftingCost: 150,
      requiredLevel: 5,
      category: 'combination',
      ingredients: [
        { itemName: 'Bone Carving', quantity: 2 },
        { itemName: 'Runed Talisman', quantity: 1 }
      ]
    },

    // Rare to Legendary combinations
    {
      name: 'Forge Ancient Beast Core',
      description: 'Combine rare items to create an ancient beast core',
      resultItemName: 'Ancient Beast Core',
      resultQuantity: 1,
      craftingCost: 500,
      requiredLevel: 15,
      category: 'combination',
      ingredients: [
        { itemName: 'Rare Beast Fang', quantity: 1 },
        { itemName: 'Fireheart Gem', quantity: 1 }
      ]
    },
    {
      name: 'Create Primal Totem',
      description: 'Combine rare items to create a primal totem',
      resultItemName: 'Primal Totem',
      resultQuantity: 1,
      craftingCost: 500,
      requiredLevel: 15,
      category: 'combination',
      ingredients: [
        { itemName: 'Echoing Horn', quantity: 1 },
        { itemName: 'Runic Blade', quantity: 1 }
      ]
    },

    // Legendary to Mythic combinations
    {
      name: 'Forge Mythic Beast Bone',
      description: 'Combine legendary items to create a mythic beast bone',
      resultItemName: 'Mythic Beast Bone',
      resultQuantity: 1,
      craftingCost: 1500,
      requiredLevel: 30,
      category: 'combination',
      ingredients: [
        { itemName: 'Ancient Beast Core', quantity: 1 },
        { itemName: 'Primal Totem', quantity: 1 }
      ]
    },

    // Boss Fragment combinations
    {
      name: 'Reconstruct Crown of Vaelith',
      description: 'Combine fragments to reconstruct the Crown of Vaelith',
      resultItemName: 'Crown of Vaelith',
      resultQuantity: 1,
      craftingCost: 5000,
      requiredLevel: 50,
      category: 'boss',
      ingredients: [
        { itemName: 'Crown of Vaelith Fragment', quantity: 3 }
      ]
    },
    {
      name: 'Reconstruct Heart of the Frozen Titan',
      description: 'Combine fragments to reconstruct the Heart of the Frozen Titan',
      resultItemName: 'Heart of the Frozen Titan',
      resultQuantity: 1,
      craftingCost: 5000,
      requiredLevel: 50,
      category: 'boss',
      ingredients: [
        { itemName: 'Heart of the Frozen Titan Fragment', quantity: 3 }
      ]
    }
  ];

  for (const recipeData of recipes) {
    try {
      // Get the result item
      const resultItem = await prisma.item.findUnique({
        where: { name: recipeData.resultItemName }
      });

      if (!resultItem) {
        console.log(`⚠️  Result item not found: ${recipeData.resultItemName}`);
        continue;
      }

      // Create the recipe
      const { ingredients, resultItemName, ...recipeInfo } = recipeData;
      const recipe = await prisma.craftingRecipe.upsert({
        where: { name: recipeInfo.name },
        update: {
          description: recipeInfo.description,
          resultItemId: resultItem.id,
          resultQuantity: recipeInfo.resultQuantity,
          craftingCost: recipeInfo.craftingCost,
          requiredLevel: recipeInfo.requiredLevel,
          category: recipeInfo.category
        },
        create: {
          ...recipeInfo,
          resultItemId: resultItem.id
        }
      });

      // Add ingredients
      for (const ingredient of ingredients) {
        const ingredientItem = await prisma.item.findUnique({
          where: { name: ingredient.itemName }
        });

        if (!ingredientItem) {
          console.log(`⚠️  Ingredient item not found: ${ingredient.itemName}`);
          continue;
        }

        await prisma.recipeIngredient.upsert({
          where: {
            recipeId_itemId: {
              recipeId: recipe.id,
              itemId: ingredientItem.id
            }
          },
          update: {
            quantity: ingredient.quantity
          },
          create: {
            recipeId: recipe.id,
            itemId: ingredientItem.id,
            quantity: ingredient.quantity
          }
        });
      }

      // Assign recipe to appropriate station
      let stationName = 'Basic Crafting Table';
      if (recipeInfo.category === 'boss') {
        stationName = 'Boss Fragment Workshop';
      } else if (recipeInfo.requiredLevel >= 30) {
        stationName = 'Mystic Altar';
      } else if (recipeInfo.requiredLevel >= 15) {
        stationName = 'Advanced Forge';
      }

      const station = await prisma.craftingStation.findUnique({
        where: { name: stationName }
      });

      if (station) {
        await prisma.stationRecipe.upsert({
          where: {
            stationId_recipeId: {
              stationId: station.id,
              recipeId: recipe.id
            }
          },
          update: {},
          create: {
            stationId: station.id,
            recipeId: recipe.id
          }
        });
      }

    } catch (error) {
      console.error(`❌ Error creating recipe ${recipeData.name}:`, error);
    }
  }

  console.log('✅ Crafting system seeded successfully!');
}

async function main() {
  try {
    await seedCraftingSystem();
  } catch (error) {
    console.error('❌ Error seeding crafting system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedCraftingSystem }; 