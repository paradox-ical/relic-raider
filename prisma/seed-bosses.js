const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Boss data based on the CSV
const bossesData = [
  // Jungle Ruins - Ancient Guardian Theme
  {
    name: "Ancient Guardian of the Jungle",
    description: "A massive guardian of stone and magic, protector of the jungle realm.",
    baseHp: 500,
    baseAttack: 45,
    baseDefense: 25,
    rarity: "MYTHIC",
    lootDrops: ["Crown of Vaelith", "Crown of Vaelith Fragment", "Astral Sigil", "Ethereal Relic"]
  },

  // Frozen Crypts - Frost Giant Theme
  {
    name: "Frost Giant King",
    description: "A mighty frost giant king, ruler of the frozen realm.",
    baseHp: 550,
    baseAttack: 48,
    baseDefense: 28,
    rarity: "MYTHIC",
    lootDrops: ["Heart of the Frozen Titan", "Heart of the Frozen Titan Fragment", "Mythic Beast Bone", "Shard of Ascension"]
  },

  // Mirage Dunes - Desert Pharaoh Theme
  {
    name: "Desert Pharaoh",
    description: "An ancient pharaoh of sand and magic, ruler of the desert realm.",
    baseHp: 520,
    baseAttack: 46,
    baseDefense: 26,
    rarity: "MYTHIC",
    lootDrops: ["Scarab of the Mirage King", "Scarab of the Mirage King Fragment", "Ethereal Relic", "Astral Sigil"]
  },

  // Sunken Temple - Abyssal Leviathan Theme
  {
    name: "Abyssal Leviathan",
    description: "A massive leviathan of the deep, master of the abyssal realm.",
    baseHp: 530,
    baseAttack: 47,
    baseDefense: 27,
    rarity: "MYTHIC",
    lootDrops: ["Tear of the Deep", "Tear of the Deep Fragment", "Ethereal Relic", "Astral Sigil"]
  },

  // Volcanic Forge - Volcanic Titan Theme
  {
    name: "Volcanic Titan",
    description: "A titan of fire and steel, embodiment of the volcanic realm.",
    baseHp: 540,
    baseAttack: 49,
    baseDefense: 29,
    rarity: "MYTHIC",
    lootDrops: ["Core of the Forge Wyrm", "Core of the Forge Wyrm Fragment", "Ethereal Relic", "Mythic Beast Bone"]
  },

  // Twilight Moor - Shadow Lord Theme
  {
    name: "Shadow Lord",
    description: "A lord of shadows and mystery, ruler of the twilight realm.",
    baseHp: 510,
    baseAttack: 44,
    baseDefense: 24,
    rarity: "MYTHIC",
    lootDrops: ["Veil of the Moor Queen", "Veil of the Moor Queen Fragment", "Mythic Beast Bone", "Astral Sigil"]
  },

  // Skyreach Spires - Storm Dragon Theme
  {
    name: "Storm Dragon",
    description: "A mighty dragon of wind and sky, master of the storm realm.",
    baseHp: 525,
    baseAttack: 45,
    baseDefense: 25,
    rarity: "MYTHIC",
    lootDrops: ["Feather of the Sky God", "Feather of the Sky God Fragment", "Mythic Beast Bone", "Ethereal Relic"]
  },

  // Obsidian Wastes - Void Emperor Theme
  {
    name: "Void Emperor",
    description: "An emperor of darkness and corruption, lord of the void realm.",
    baseHp: 535,
    baseAttack: 48,
    baseDefense: 28,
    rarity: "MYTHIC",
    lootDrops: ["Obsidian Soulbrand", "Obsidian Soulbrand Fragment", "Shard of Ascension", "Veilstone"]
  },

  // Astral Caverns - Celestial Archon Theme
  {
    name: "Celestial Archon",
    description: "An archon of the cosmos, wielder of celestial power.",
    baseHp: 545,
    baseAttack: 50,
    baseDefense: 30,
    rarity: "MYTHIC",
    lootDrops: ["Starforged Eye", "Starforged Eye Fragment", "Shard of Ascension", "Ethereal Relic"]
  },

  // Ethereal Sanctum - Divine Seraph Theme
  {
    name: "Divine Seraph",
    description: "A divine seraph, guardian of the sacred realm.",
    baseHp: 560,
    baseAttack: 52,
    baseDefense: 32,
    rarity: "MYTHIC",
    lootDrops: ["Halo of the Divine Sentinel", "Halo of the Divine Sentinel Fragment", "Shard of Ascension", "Veilstone"]
  }
];

async function seedBosses() {
  console.log('🌱 Seeding bosses...');

  for (const bossData of bossesData) {
    try {
      // Create the boss (without lootDrops field)
      const { lootDrops, ...bossDataWithoutLoot } = bossData;
      const boss = await prisma.beast.upsert({
        where: { name: bossData.name },
        update: bossDataWithoutLoot,
        create: bossDataWithoutLoot
      });

      // Create loot drops for this boss
      for (const itemName of lootDrops) {
        // Find the item by name
        const item = await prisma.item.findUnique({
          where: { name: itemName }
        });

        if (item) {
          // Boss items have higher drop rates than regular beasts
          let dropRate = 0.15; // Default 15% for boss items
          
          // Boss-specific items have higher drop rates
          if (itemName.includes('Fragment')) {
            dropRate = 0.25; // 25% for fragments
          } else if (itemName.includes('Crown') || itemName.includes('Heart') || 
                     itemName.includes('Scarab') || itemName.includes('Tear') ||
                     itemName.includes('Core') || itemName.includes('Veil') ||
                     itemName.includes('Feather') || itemName.includes('Obsidian') ||
                     itemName.includes('Starforged') || itemName.includes('Halo')) {
            dropRate = 0.10; // 10% for main boss items
          }

          await prisma.beastLootDrop.upsert({
            where: {
              beastId_itemId: {
                beastId: boss.id,
                itemId: item.id
              }
            },
            update: { dropRate },
            create: {
              beastId: boss.id,
              itemId: item.id,
              dropRate
            }
          });
        } else {
          console.log(`⚠️ Item not found: ${itemName}`);
        }
      }

      console.log(`✅ Created boss: ${boss.name}`);
    } catch (error) {
      console.error(`❌ Error creating boss ${bossData.name}:`, error);
    }
  }

  console.log('✅ Bosses seeded successfully!');
}

async function main() {
  try {
    await seedBosses();
  } catch (error) {
    console.error('❌ Error seeding bosses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedBosses }; 