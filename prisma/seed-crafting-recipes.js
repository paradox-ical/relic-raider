const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌟 Seeding comprehensive crafting recipes...');

  // Define all crafting recipes for gear sets and weapons
  const craftingRecipes = [
    // PALADIN ARMOR RECIPES - Research Table
    {
      name: 'Craft Stonewall Set',
      description: 'Craft common defensive paladin armor',
      resultItemName: 'Stonewall Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Stonewall Set',
      description: 'Craft uncommon defensive paladin armor',
      resultItemName: 'Tough Stonewall Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Stonewall Set',
      description: 'Craft rare defensive paladin armor',
      resultItemName: 'Hardened Stonewall Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Stonewall Set',
      description: 'Craft legendary defensive paladin armor',
      resultItemName: 'Blazing Stonewall Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Stonewall Set',
      description: 'Craft mythic defensive paladin armor',
      resultItemName: 'Godforged Stonewall Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // PALADIN ARMOR RECIPES - Blacksmith's Forge
    {
      name: 'Craft Undying Set',
      description: 'Craft common offensive paladin armor',
      resultItemName: 'Undying Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Undying Set',
      description: 'Craft uncommon offensive paladin armor',
      resultItemName: 'Tough Undying Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Undying Set',
      description: 'Craft rare offensive paladin armor',
      resultItemName: 'Hardened Undying Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Undying Set',
      description: 'Craft legendary offensive paladin armor',
      resultItemName: 'Blazing Undying Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Undying Set',
      description: 'Craft mythic offensive paladin armor',
      resultItemName: 'Godforged Undying Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // ROGUE ARMOR RECIPES - Research Table
    {
      name: 'Craft Shadowleaf Set',
      description: 'Craft common evasion rogue armor',
      resultItemName: 'Shadowleaf Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Shadowleaf Set',
      description: 'Craft uncommon evasion rogue armor',
      resultItemName: 'Tough Shadowleaf Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Shadowleaf Set',
      description: 'Craft rare evasion rogue armor',
      resultItemName: 'Hardened Shadowleaf Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Shadowleaf Set',
      description: 'Craft legendary evasion rogue armor',
      resultItemName: 'Blazing Shadowleaf Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Shadowleaf Set',
      description: 'Craft mythic evasion rogue armor',
      resultItemName: 'Godforged Shadowleaf Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // ROGUE ARMOR RECIPES - Blacksmith's Forge
    {
      name: 'Craft Silent Fang Set',
      description: 'Craft common poison rogue armor',
      resultItemName: 'Silent Fang Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Silent Fang Set',
      description: 'Craft uncommon poison rogue armor',
      resultItemName: 'Tough Silent Fang Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Silent Fang Set',
      description: 'Craft rare poison rogue armor',
      resultItemName: 'Hardened Silent Fang Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Silent Fang Set',
      description: 'Craft legendary poison rogue armor',
      resultItemName: 'Blazing Silent Fang Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Silent Fang Set',
      description: 'Craft mythic poison rogue armor',
      resultItemName: 'Godforged Silent Fang Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // HUNTER ARMOR RECIPES - Research Table
    {
      name: 'Craft Snarehide Set',
      description: 'Craft common beast hunting hunter armor',
      resultItemName: 'Snarehide Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Snarehide Set',
      description: 'Craft uncommon beast hunting hunter armor',
      resultItemName: 'Tough Snarehide Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Snarehide Set',
      description: 'Craft rare beast hunting hunter armor',
      resultItemName: 'Hardened Snarehide Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Snarehide Set',
      description: 'Craft legendary beast hunting hunter armor',
      resultItemName: 'Blazing Snarehide Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Snarehide Set',
      description: 'Craft mythic beast hunting hunter armor',
      resultItemName: 'Godforged Snarehide Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // HUNTER ARMOR RECIPES - Blacksmith's Forge
    {
      name: 'Craft Wolfsight Set',
      description: 'Craft common accuracy hunter armor',
      resultItemName: 'Wolfsight Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Wolfsight Set',
      description: 'Craft uncommon accuracy hunter armor',
      resultItemName: 'Tough Wolfsight Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Wolfsight Set',
      description: 'Craft rare accuracy hunter armor',
      resultItemName: 'Hardened Wolfsight Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Wolfsight Set',
      description: 'Craft legendary accuracy hunter armor',
      resultItemName: 'Blazing Wolfsight Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Wolfsight Set',
      description: 'Craft mythic accuracy hunter armor',
      resultItemName: 'Godforged Wolfsight Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // MAGE ARMOR RECIPES - Research Table
    {
      name: 'Craft Runespun Set',
      description: 'Craft common raw magic mage armor',
      resultItemName: 'Runespun Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Runespun Set',
      description: 'Craft uncommon raw magic mage armor',
      resultItemName: 'Tough Runespun Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Runespun Set',
      description: 'Craft rare raw magic mage armor',
      resultItemName: 'Hardened Runespun Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Runespun Set',
      description: 'Craft legendary raw magic mage armor',
      resultItemName: 'Blazing Runespun Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Runespun Set',
      description: 'Craft mythic raw magic mage armor',
      resultItemName: 'Godforged Runespun Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Research Table',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    },

    // MAGE ARMOR RECIPES - Blacksmith's Forge
    {
      name: 'Craft Dustwoven Set',
      description: 'Craft common buff/debuff mage armor',
      resultItemName: 'Dustwoven Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Beast Claw', quantity: 5 },
        { itemName: 'Tablet of Aztec', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 15 }
      ]
    },
    {
      name: 'Craft Tough Dustwoven Set',
      description: 'Craft uncommon buff/debuff mage armor',
      resultItemName: 'Tough Dustwoven Set',
      craftingCost: 250,
      requiredLevel: 10,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Hardened Dustwoven Set',
      description: 'Craft rare buff/debuff mage armor',
      resultItemName: 'Hardened Dustwoven Set',
      craftingCost: 500,
      requiredLevel: 20,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 15 },
        { itemName: 'Statue of Flame', quantity: 50 },
        { itemName: 'Relic of Time', quantity: 35 }
      ]
    },
    {
      name: 'Craft Blazing Dustwoven Set',
      description: 'Craft legendary buff/debuff mage armor',
      resultItemName: 'Blazing Dustwoven Set',
      craftingCost: 1000,
      requiredLevel: 35,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 25 },
        { itemName: 'Statue of Flame', quantity: 75 },
        { itemName: 'Relic of Time', quantity: 50 }
      ]
    },
    {
      name: 'Craft Godforged Dustwoven Set',
      description: 'Craft mythic buff/debuff mage armor',
      resultItemName: 'Godforged Dustwoven Set',
      craftingCost: 2000,
      requiredLevel: 50,
      category: 'armor',
      stationName: 'Blacksmith\'s Forge',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 40 },
        { itemName: 'Statue of Flame', quantity: 100 },
        { itemName: 'Relic of Time', quantity: 75 }
      ]
    }
  ];

  console.log(`📝 Creating ${craftingRecipes.length} crafting recipes...`);

  for (const recipeData of craftingRecipes) {
    try {
      // Get the result item
      const resultItem = await prisma.equipment.findUnique({
        where: { name: recipeData.resultItemName }
      });

      if (!resultItem) {
        console.log(`⚠️ Skipping recipe for ${recipeData.resultItemName} - equipment not found`);
        continue;
      }

      // Get the station
      const station = await prisma.craftingStation.findUnique({
        where: { name: recipeData.stationName }
      });

      if (!station) {
        console.log(`⚠️ Skipping recipe for ${recipeData.resultItemName} - station ${recipeData.stationName} not found`);
        continue;
      }

      // Create the recipe
      const recipe = await prisma.craftingRecipe.upsert({
        where: { name: recipeData.name },
        update: {
          description: recipeData.description,
          resultItemId: resultItem.id,
          craftingCost: recipeData.craftingCost,
          requiredLevel: recipeData.requiredLevel,
          category: recipeData.category
        },
        create: {
          name: recipeData.name,
          description: recipeData.description,
          resultItemId: resultItem.id,
          craftingCost: recipeData.craftingCost,
          requiredLevel: recipeData.requiredLevel,
          category: recipeData.category
        }
      });

      // Create recipe ingredients
      for (const ingredient of recipeData.ingredients) {
        const item = await prisma.item.findUnique({
          where: { name: ingredient.itemName }
        });

        if (!item) {
          console.log(`⚠️ Skipping ingredient ${ingredient.itemName} - item not found`);
          continue;
        }

        await prisma.recipeIngredient.upsert({
          where: {
            recipeId_itemId: {
              recipeId: recipe.id,
              itemId: item.id
            }
          },
          update: { quantity: ingredient.quantity },
          create: {
            recipeId: recipe.id,
            itemId: item.id,
            quantity: ingredient.quantity
          }
        });
      }

      // Assign recipe to station
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

      console.log(`✅ Created recipe: ${recipeData.name}`);
    } catch (error) {
      console.log(`❌ Error creating recipe ${recipeData.name}:`, error.message);
    }
  }

  console.log('🎉 Crafting recipes seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding crafting recipes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 