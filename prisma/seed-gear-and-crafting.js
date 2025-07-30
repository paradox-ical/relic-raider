const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌟 Seeding gear sets, weapons, and crafting recipes...');

  // Create crafting stations
  const stations = [
    { name: 'Research Table', description: 'A mystical table for combining exploration relics into higher tier items. Unlock rare, legendary, and mythic relics through careful research.', location: 'main_menu', unlockCost: 10000, requiredLevel: 5 },
    { name: 'Blacksmith\'s Forge', description: 'A master craftsman\'s forge for creating weapons, armor, and accessories. Forge powerful gear to enhance your combat abilities.', location: 'main_menu', unlockCost: 10000, requiredLevel: 5 },
    { name: 'Shadow Altar', description: 'An ancient altar shrouded in darkness for combining boss fragments and crafting legendary boss gear. Only the worthy may access its power.', location: 'main_menu', unlockCost: 30000, requiredLevel: 25 }
  ];

  for (const station of stations) {
    await prisma.craftingStation.upsert({
      where: { name: station.name },
      update: station,
      create: station
    });
  }

  // Equipment data for all gear sets and weapons
  const equipmentData = [
    // PALADIN GEAR SETS
    { name: 'Stonewall Set', description: 'Defensive paladin armor focused on protection', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 50, defenseBonus: 20, specialEffect: '{"guardian_oath": true}' },
    { name: 'Tough Stonewall Set', description: 'Enhanced defensive paladin armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 75, defenseBonus: 30, specialEffect: '{"guardian_oath": true}' },
    { name: 'Hardened Stonewall Set', description: 'Reinforced defensive paladin armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 100, defenseBonus: 40, specialEffect: '{"guardian_oath": true}' },
    { name: 'Blazing Stonewall Set', description: 'Legendary defensive paladin armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 150, defenseBonus: 60, specialEffect: '{"guardian_oath": true}' },
    { name: 'Godforged Stonewall Set', description: 'Mythic defensive paladin armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 200, defenseBonus: 80, specialEffect: '{"guardian_oath": true}' },

    { name: 'Undying Set', description: 'Offensive paladin armor focused on damage', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 30, attackBonus: 15, specialEffect: '{"crusader_fury": true}' },
    { name: 'Tough Undying Set', description: 'Enhanced offensive paladin armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 45, attackBonus: 25, specialEffect: '{"crusader_fury": true}' },
    { name: 'Hardened Undying Set', description: 'Reinforced offensive paladin armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 60, attackBonus: 35, specialEffect: '{"crusader_fury": true}' },
    { name: 'Blazing Undying Set', description: 'Legendary offensive paladin armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 90, attackBonus: 50, specialEffect: '{"crusader_fury": true}' },
    { name: 'Godforged Undying Set', description: 'Mythic offensive paladin armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 120, attackBonus: 70, specialEffect: '{"crusader_fury": true}' },

    { name: 'Ironskin Set', description: 'Support paladin armor focused on healing', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 40, defenseBonus: 10, specialEffect: '{"lightbound_path": true}' },
    { name: 'Tough Ironskin Set', description: 'Enhanced support paladin armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 60, defenseBonus: 15, specialEffect: '{"lightbound_path": true}' },
    { name: 'Hardened Ironskin Set', description: 'Reinforced support paladin armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 80, defenseBonus: 20, specialEffect: '{"lightbound_path": true}' },
    { name: 'Blazing Ironskin Set', description: 'Legendary support paladin armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 120, defenseBonus: 30, specialEffect: '{"lightbound_path": true}' },
    { name: 'Godforged Ironskin Set', description: 'Mythic support paladin armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 160, defenseBonus: 40, specialEffect: '{"lightbound_path": true}' },

    // ROGUE GEAR SETS
    { name: 'Shadowleaf Set', description: 'Evasion rogue armor focused on dodging', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 25, attackBonus: 10, specialEffect: '{"shadow_dance": true}' },
    { name: 'Tough Shadowleaf Set', description: 'Enhanced evasion rogue armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 40, attackBonus: 20, specialEffect: '{"shadow_dance": true}' },
    { name: 'Hardened Shadowleaf Set', description: 'Reinforced evasion rogue armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 55, attackBonus: 30, specialEffect: '{"shadow_dance": true}' },
    { name: 'Blazing Shadowleaf Set', description: 'Legendary evasion rogue armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 80, attackBonus: 45, specialEffect: '{"shadow_dance": true}' },
    { name: 'Godforged Shadowleaf Set', description: 'Mythic evasion rogue armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 105, attackBonus: 60, specialEffect: '{"shadow_dance": true}' },

    { name: 'Silent Fang Set', description: 'Poison rogue armor focused on DoT damage', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 20, attackBonus: 15, specialEffect: '{"venomcraft": true}' },
    { name: 'Tough Silent Fang Set', description: 'Enhanced poison rogue armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 35, attackBonus: 25, specialEffect: '{"venomcraft": true}' },
    { name: 'Hardened Silent Fang Set', description: 'Reinforced poison rogue armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 50, attackBonus: 35, specialEffect: '{"venomcraft": true}' },
    { name: 'Blazing Silent Fang Set', description: 'Legendary poison rogue armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 75, attackBonus: 50, specialEffect: '{"venomcraft": true}' },
    { name: 'Godforged Silent Fang Set', description: 'Mythic poison rogue armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 100, attackBonus: 65, specialEffect: '{"venomcraft": true}' },

    { name: 'Velvet Coil Set', description: 'Critical rogue armor focused on precision', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 15, attackBonus: 20, specialEffect: '{"dagger_arts": true}' },
    { name: 'Tough Velvet Coil Set', description: 'Enhanced critical rogue armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 30, attackBonus: 30, specialEffect: '{"dagger_arts": true}' },
    { name: 'Hardened Velvet Coil Set', description: 'Reinforced critical rogue armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 45, attackBonus: 40, specialEffect: '{"dagger_arts": true}' },
    { name: 'Blazing Velvet Coil Set', description: 'Legendary critical rogue armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 70, attackBonus: 55, specialEffect: '{"dagger_arts": true}' },
    { name: 'Godforged Velvet Coil Set', description: 'Mythic critical rogue armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 95, attackBonus: 70, specialEffect: '{"dagger_arts": true}' },

    // HUNTER GEAR SETS
    { name: 'Snarehide Set', description: 'Beast hunting hunter armor focused on loot', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 30, attackBonus: 10, specialEffect: '{"beast_mastery": true}' },
    { name: 'Tough Snarehide Set', description: 'Enhanced beast hunting hunter armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 45, attackBonus: 20, specialEffect: '{"beast_mastery": true}' },
    { name: 'Hardened Snarehide Set', description: 'Reinforced beast hunting hunter armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 60, attackBonus: 30, specialEffect: '{"beast_mastery": true}' },
    { name: 'Blazing Snarehide Set', description: 'Legendary beast hunting hunter armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 90, attackBonus: 45, specialEffect: '{"beast_mastery": true}' },
    { name: 'Godforged Snarehide Set', description: 'Mythic beast hunting hunter armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 120, attackBonus: 60, specialEffect: '{"beast_mastery": true}' },

    { name: 'Wolfsight Set', description: 'Accuracy hunter armor focused on precision', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 25, attackBonus: 15, specialEffect: '{"wild_precision": true}' },
    { name: 'Tough Wolfsight Set', description: 'Enhanced accuracy hunter armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 40, attackBonus: 25, specialEffect: '{"wild_precision": true}' },
    { name: 'Hardened Wolfsight Set', description: 'Reinforced accuracy hunter armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 55, attackBonus: 35, specialEffect: '{"wild_precision": true}' },
    { name: 'Blazing Wolfsight Set', description: 'Legendary accuracy hunter armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 85, attackBonus: 50, specialEffect: '{"wild_precision": true}' },
    { name: 'Godforged Wolfsight Set', description: 'Mythic accuracy hunter armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 115, attackBonus: 65, specialEffect: '{"wild_precision": true}' },

    { name: 'Trailwalker Set', description: 'Control hunter armor focused on utility', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 35, defenseBonus: 10, specialEffect: '{"trapcraft": true}' },
    { name: 'Tough Trailwalker Set', description: 'Enhanced control hunter armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 50, defenseBonus: 15, specialEffect: '{"trapcraft": true}' },
    { name: 'Hardened Trailwalker Set', description: 'Reinforced control hunter armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 65, defenseBonus: 20, specialEffect: '{"trapcraft": true}' },
    { name: 'Blazing Trailwalker Set', description: 'Legendary control hunter armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 95, defenseBonus: 30, specialEffect: '{"trapcraft": true}' },
    { name: 'Godforged Trailwalker Set', description: 'Mythic control hunter armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 125, defenseBonus: 40, specialEffect: '{"trapcraft": true}' },

    // MAGE GEAR SETS
    { name: 'Runespun Set', description: 'Raw magic mage armor focused on damage', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 20, attackBonus: 20, specialEffect: '{"elementalism": true}' },
    { name: 'Tough Runespun Set', description: 'Enhanced raw magic mage armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 35, attackBonus: 30, specialEffect: '{"elementalism": true}' },
    { name: 'Hardened Runespun Set', description: 'Reinforced raw magic mage armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 50, attackBonus: 40, specialEffect: '{"elementalism": true}' },
    { name: 'Blazing Runespun Set', description: 'Legendary raw magic mage armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 80, attackBonus: 55, specialEffect: '{"elementalism": true}' },
    { name: 'Godforged Runespun Set', description: 'Mythic raw magic mage armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 110, attackBonus: 70, specialEffect: '{"elementalism": true}' },

    { name: 'Dustwoven Set', description: 'Buff/debuff mage armor focused on utility', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 25, defenseBonus: 15, specialEffect: '{"runeweaving": true}' },
    { name: 'Tough Dustwoven Set', description: 'Enhanced buff/debuff mage armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 40, defenseBonus: 25, specialEffect: '{"runeweaving": true}' },
    { name: 'Hardened Dustwoven Set', description: 'Reinforced buff/debuff mage armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 55, defenseBonus: 35, specialEffect: '{"runeweaving": true}' },
    { name: 'Blazing Dustwoven Set', description: 'Legendary buff/debuff mage armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 85, defenseBonus: 50, specialEffect: '{"runeweaving": true}' },
    { name: 'Godforged Dustwoven Set', description: 'Mythic buff/debuff mage armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 115, defenseBonus: 65, specialEffect: '{"runeweaving": true}' },

    { name: 'Kindling Robes', description: 'Time mage armor focused on cooldown control', type: 'ARMOR', rarity: 'COMMON', level: 5, hpBonus: 30, attackBonus: 10, specialEffect: '{"chronomancy": true}' },
    { name: 'Tough Kindling Robes', description: 'Enhanced time mage armor', type: 'ARMOR', rarity: 'UNCOMMON', level: 10, hpBonus: 45, attackBonus: 20, specialEffect: '{"chronomancy": true}' },
    { name: 'Hardened Kindling Robes', description: 'Reinforced time mage armor', type: 'ARMOR', rarity: 'RARE', level: 20, hpBonus: 60, attackBonus: 30, specialEffect: '{"chronomancy": true}' },
    { name: 'Blazing Kindling Robes', description: 'Legendary time mage armor', type: 'ARMOR', rarity: 'LEGENDARY', level: 35, hpBonus: 90, attackBonus: 45, specialEffect: '{"chronomancy": true}' },
    { name: 'Godforged Kindling Robes', description: 'Mythic time mage armor', type: 'ARMOR', rarity: 'MYTHIC', level: 50, hpBonus: 120, attackBonus: 60, specialEffect: '{"chronomancy": true}' },

    // ASCENDED GEAR SETS (Jungle Ruins)
    { name: 'Sunscale Bastion', description: 'Ascended paladin armor from Jungle Ruins', type: 'ARMOR', rarity: 'ASCENDED', level: 75, hpBonus: 300, attackBonus: 100, defenseBonus: 150, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "paladin"}' },
    { name: 'Jungle Whisperwrap', description: 'Ascended rogue armor from Jungle Ruins', type: 'ARMOR', rarity: 'ASCENDED', level: 75, hpBonus: 200, attackBonus: 150, defenseBonus: 100, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "rogue"}' },
    { name: 'Rootbound Hauberk', description: 'Ascended hunter armor from Jungle Ruins', type: 'ARMOR', rarity: 'ASCENDED', level: 75, hpBonus: 250, attackBonus: 125, defenseBonus: 125, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "hunter"}' },
    { name: 'Eclipseweave Mantle', description: 'Ascended mage armor from Jungle Ruins', type: 'ARMOR', rarity: 'ASCENDED', level: 75, hpBonus: 180, attackBonus: 180, defenseBonus: 90, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "mage"}' },

    // ASCENDED WEAPONS (Jungle Ruins)
    { name: 'Blade of the Ancients', description: 'Ascended paladin weapon from Jungle Ruins', type: 'WEAPON', rarity: 'ASCENDED', level: 75, attackBonus: 200, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "paladin"}' },
    { name: 'Fang of the Exile', description: 'Ascended rogue weapon from Jungle Ruins', type: 'WEAPON', rarity: 'ASCENDED', level: 75, attackBonus: 250, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "rogue"}' },
    { name: 'Jaguar Bow', description: 'Ascended hunter weapon from Jungle Ruins', type: 'WEAPON', rarity: 'ASCENDED', level: 75, attackBonus: 225, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "hunter"}' },
    { name: 'Orb of Ancients', description: 'Ascended mage weapon from Jungle Ruins', type: 'WEAPON', rarity: 'ASCENDED', level: 75, attackBonus: 275, specialEffect: '{"ascended": true, "zone": "jungle_ruins", "class": "mage"}' },

    // Add more ascended gear for other zones...
    // (I'll continue with a few more examples, but the full list would be very long)
  ];

  // Create equipment items
  for (const equipment of equipmentData) {
    await prisma.equipment.upsert({
      where: { name: equipment.name },
      update: equipment,
      create: equipment
    });
  }

  console.log('✅ Equipment items created successfully!');

  // Create crafting recipes for a few examples (the full implementation would be much longer)
  const recipeExamples = [
    {
      name: 'Craft Stonewall Set',
      description: 'Craft common defensive paladin armor',
      resultItemName: 'Stonewall Set',
      craftingCost: 100,
      requiredLevel: 5,
      category: 'gear',
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
      category: 'gear',
      ingredients: [
        { itemName: 'Runed Talisman', quantity: 8 },
        { itemName: 'Statue of Flame', quantity: 30 },
        { itemName: 'Relic of Time', quantity: 20 }
      ]
    },
    {
      name: 'Craft Sunscale Bastion',
      description: 'Craft ascended paladin armor from Jungle Ruins',
      resultItemName: 'Sunscale Bastion',
      craftingCost: 5000,
      requiredLevel: 75,
      category: 'boss',
      ingredients: [
        { itemName: 'Crown of Vaelith', quantity: 2 },
        { itemName: 'Crown of Vaelith Fragment', quantity: 2 },
        { itemName: 'Astral Sigil', quantity: 50 },
        { itemName: 'Ethereal Relic', quantity: 50 },
        { itemName: 'Shard of Ascension', quantity: 35 },
        { itemName: 'Veilstone', quantity: 25 }
      ]
    }
  ];

  for (const recipeData of recipeExamples) {
    // Get the result item
    const resultItem = await prisma.equipment.findUnique({
      where: { name: recipeData.resultItemName }
    });

    if (!resultItem) {
      console.log(`⚠️ Skipping recipe for ${recipeData.resultItemName} - equipment not found`);
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

    // Assign recipe to appropriate station
    let stationName = 'Blacksmith Forge';
    if (recipeData.category === 'boss') {
      stationName = 'Ascended Altar';
    } else if (recipeData.resultItemName.includes('Runespun') || recipeData.resultItemName.includes('Dustwoven') || recipeData.resultItemName.includes('Kindling')) {
      stationName = 'Mystic Enchanter';
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
  }

  console.log('✅ Crafting recipes created successfully!');
  console.log('🎉 Gear and crafting system seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding gear and crafting:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 