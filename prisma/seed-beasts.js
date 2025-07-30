const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Data extracted from Relic_Raider_Beasts___Bosses__Unique_Boss_Loot_.csv
const beastsData = [
  // --- Jungle Ruins (Aztec) ---
  { name: "Twisted Serpent of Aztec", description: "A twisted serpent coils around ancient Aztec ruins.", baseHp: 150, baseAttack: 12, baseDefense: 6, rarity: "UNCOMMON", lootDrops: ["Beast Claw", "Frayed Hide", "Mossy Charm"] },
  { name: "Ancient Stalker of Aztec", description: "An ancient stalker emerges from the shadows.", baseHp: 200, baseAttack: 15, baseDefense: 8, rarity: "RARE", lootDrops: ["Duskwalker Idol", "Bone Carving", "Runed Talisman", "Sealed Coin"] },
  { name: "Barbed Construct of Aztec", description: "A barbed construct of stone and magic.", baseHp: 250, baseAttack: 18, baseDefense: 10, rarity: "RARE", lootDrops: ["Rare Beast Fang", "Sealed Coin", "Duskwalker Idol"] },
  { name: "Legendary Barbed Construct of Aztec", description: "A legendary barbed construct of stone and magic.", baseHp: 350, baseAttack: 22, baseDefense: 12, rarity: "LEGENDARY", lootDrops: ["Echoing Horn", "Fireheart Gem", "Runic Blade"] },
  { name: "Savage Construct of Aztec", description: "A savage construct of pure destruction.", baseHp: 400, baseAttack: 25, baseDefense: 14, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Primal Totem", "Runic Blade"] },
  { name: "Mythic Savage Construct of Aztec", description: "A mythic construct of pure destruction.", baseHp: 500, baseAttack: 30, baseDefense: 18, rarity: "MYTHIC", lootDrops: ["Mythic Beast Bone", "Ethereal Relic", "Shard of Ascension", "Veilstone"] },
  // --- Frozen Crypts (Norse) ---
  { name: "Ancient Phantom of Norse", description: "An ancient phantom drifts through the frozen crypts.", baseHp: 160, baseAttack: 13, baseDefense: 7, rarity: "UNCOMMON", lootDrops: ["Cracked Fang", "Mossy Charm", "Frayed Hide"] },
  { name: "Barbed Construct of Norse", description: "A barbed construct of ice and steel.", baseHp: 220, baseAttack: 16, baseDefense: 9, rarity: "RARE", lootDrops: ["Rare Beast Fang", "Runed Talisman", "Duskwalker Idol"] },
  { name: "Lurking Stalker of Norse", description: "A lurking stalker of the frozen wastes.", baseHp: 280, baseAttack: 19, baseDefense: 11, rarity: "RARE", lootDrops: ["Runed Talisman", "Sealed Coin", "Rare Beast Fang", "Bone Carving"] },
  { name: "Savage Phantom of Norse", description: "A savage phantom of pure destruction.", baseHp: 380, baseAttack: 25, baseDefense: 15, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Runic Blade", "Ancient Beast Core", "Echoing Horn"] },
  { name: "Savage Serpent of Norse", description: "A savage serpent of ice and shadow.", baseHp: 420, baseAttack: 28, baseDefense: 16, rarity: "LEGENDARY", lootDrops: ["Echoing Horn", "Fireheart Gem", "Primal Totem", "Runic Blade"] },
  { name: "Mythic Savage Phantom of Norse", description: "A mythic phantom of pure destruction.", baseHp: 520, baseAttack: 32, baseDefense: 18, rarity: "MYTHIC", lootDrops: ["Astral Sigil", "Shard of Ascension", "Ethereal Relic"] },
  // --- Mirage Dunes (Egyptian) ---
  { name: "Lurking Stalker of Egyptian", description: "A lurking stalker of the dunes.", baseHp: 170, baseAttack: 13, baseDefense: 7, rarity: "UNCOMMON", lootDrops: ["Mossy Charm", "Beast Claw", "Frayed Hide"] },
  { name: "Lurking Beast of Egyptian", description: "A rare beast of the dunes.", baseHp: 230, baseAttack: 17, baseDefense: 9, rarity: "RARE", lootDrops: ["Duskwalker Idol", "Runed Talisman", "Bone Carving"] },
  { name: "Lurking Warden of Egyptian", description: "A rare warden of the dunes.", baseHp: 250, baseAttack: 18, baseDefense: 10, rarity: "RARE", lootDrops: ["Duskwalker Idol", "Bone Carving", "Sealed Coin"] },
  { name: "Barbed Phantom of Egyptian", description: "A legendary phantom of the dunes.", baseHp: 360, baseAttack: 23, baseDefense: 13, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Ancient Beast Core", "Primal Totem"] },
  { name: "Twisted Stalker of Egyptian", description: "A legendary stalker of the dunes.", baseHp: 380, baseAttack: 24, baseDefense: 14, rarity: "LEGENDARY", lootDrops: ["Ancient Beast Core", "Fireheart Gem", "Primal Totem", "Echoing Horn"] },
  { name: "Mythic Lurking Warden of Egyptian", description: "A mythic warden of the dunes.", baseHp: 480, baseAttack: 29, baseDefense: 17, rarity: "MYTHIC", lootDrops: ["Shard of Ascension", "Veilstone", "Ethereal Relic", "Mythic Beast Bone"] },
  // --- Sunken Temple (Atlantean) ---
  { name: "Ancient Serpent of Atlantean", description: "An ancient serpent of the deep.", baseHp: 180, baseAttack: 14, baseDefense: 8, rarity: "UNCOMMON", lootDrops: ["Cracked Fang", "Beast Claw", "Mossy Charm", "Frayed Hide"] },
  { name: "Ancient Beast of Atlantean", description: "A rare beast of the deep.", baseHp: 240, baseAttack: 18, baseDefense: 10, rarity: "RARE", lootDrops: ["Bone Carving", "Runed Talisman", "Sealed Coin"] },
  { name: "Savage Warden of Atlantean", description: "A rare warden of the deep.", baseHp: 260, baseAttack: 19, baseDefense: 11, rarity: "RARE", lootDrops: ["Sealed Coin", "Rare Beast Fang", "Duskwalker Idol", "Runed Talisman"] },
  { name: "Twisted Warden of Atlantean", description: "A legendary warden of the deep.", baseHp: 370, baseAttack: 24, baseDefense: 14, rarity: "LEGENDARY", lootDrops: ["Ancient Beast Core", "Primal Totem", "Runic Blade"] },
  { name: "Twisted Phantom of Atlantean", description: "A legendary phantom of the deep.", baseHp: 390, baseAttack: 25, baseDefense: 15, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Runic Blade", "Echoing Horn"] },
  { name: "Lurking Stalker of Atlantean", description: "A mythic stalker of the deep.", baseHp: 490, baseAttack: 30, baseDefense: 18, rarity: "MYTHIC", lootDrops: ["Ethereal Relic", "Veilstone", "Shard of Ascension", "Astral Sigil"] },
  // --- Volcanic Forge (Dwarven) ---
  { name: "Twisted Construct of Dwarven", description: "A twisted construct of the forges.", baseHp: 190, baseAttack: 15, baseDefense: 8, rarity: "UNCOMMON", lootDrops: ["Uncommon Relic Shard", "Frayed Hide", "Beast Claw"] },
  { name: "Lurking Phantom of Dwarven", description: "A rare phantom of the forges.", baseHp: 250, baseAttack: 19, baseDefense: 11, rarity: "RARE", lootDrops: ["Duskwalker Idol", "Runed Talisman", "Sealed Coin"] },
  { name: "Barbed Stalker of Dwarven", description: "A rare stalker of the forges.", baseHp: 270, baseAttack: 20, baseDefense: 12, rarity: "RARE", lootDrops: ["Sealed Coin", "Bone Carving", "Runed Talisman"] },
  { name: "Barbed Beast of Dwarven", description: "A legendary beast of the forges.", baseHp: 380, baseAttack: 26, baseDefense: 16, rarity: "LEGENDARY", lootDrops: ["Runic Blade", "Echoing Horn", "Fireheart Gem"] },
  { name: "Ancient Serpent of Dwarven", description: "A legendary serpent of the forges.", baseHp: 400, baseAttack: 27, baseDefense: 17, rarity: "LEGENDARY", lootDrops: ["Runic Blade", "Ancient Beast Core", "Fireheart Gem"] },
  { name: "Ancient Construct of Dwarven", description: "A mythic construct of the forges.", baseHp: 510, baseAttack: 32, baseDefense: 19, rarity: "MYTHIC", lootDrops: ["Ethereal Relic", "Shard of Ascension", "Veilstone", "Astral Sigil"] },
  // --- Twilight Moor (Gothic) ---
  { name: "Dire Phantom of Gothic", description: "A dire phantom of the moor.", baseHp: 200, baseAttack: 15, baseDefense: 8, rarity: "UNCOMMON", lootDrops: ["Frayed Hide", "Mossy Charm", "Uncommon Relic Shard"] },
  { name: "Barbed Construct of Gothic", description: "A rare construct of the moor.", baseHp: 260, baseAttack: 19, baseDefense: 11, rarity: "RARE", lootDrops: ["Rare Beast Fang", "Duskwalker Idol", "Runed Talisman", "Sealed Coin"] },
  { name: "Dire Beast of Gothic", description: "A rare beast of the moor.", baseHp: 280, baseAttack: 21, baseDefense: 12, rarity: "RARE", lootDrops: ["Rare Beast Fang", "Bone Carving", "Runed Talisman", "Sealed Coin"] },
  { name: "Savage Serpent of Gothic", description: "A legendary serpent of the moor.", baseHp: 390, baseAttack: 27, baseDefense: 17, rarity: "LEGENDARY", lootDrops: ["Primal Totem", "Ancient Beast Core", "Echoing Horn", "Fireheart Gem"] },
  { name: "Twisted Phantom of Gothic", description: "A legendary phantom of the moor.", baseHp: 410, baseAttack: 28, baseDefense: 18, rarity: "LEGENDARY", lootDrops: ["Echoing Horn", "Ancient Beast Core", "Fireheart Gem", "Primal Totem"] },
  { name: "Twisted Serpent of Gothic", description: "A mythic serpent of the moor.", baseHp: 520, baseAttack: 33, baseDefense: 20, rarity: "MYTHIC", lootDrops: ["Shard of Ascension", "Mythic Beast Bone", "Astral Sigil"] },
  // --- Skyreach Spires (Cloud Kingdom) ---
  { name: "Lurking Serpent of Cloud Kingdom", description: "A lurking serpent of the clouds.", baseHp: 210, baseAttack: 16, baseDefense: 9, rarity: "UNCOMMON", lootDrops: ["Mossy Charm", "Frayed Hide", "Cracked Fang"] },
  { name: "Twisted Warden of Cloud Kingdom", description: "A rare warden of the clouds.", baseHp: 270, baseAttack: 20, baseDefense: 12, rarity: "RARE", lootDrops: ["Duskwalker Idol", "Bone Carving", "Sealed Coin", "Runed Talisman"] },
  { name: "Dire Serpent of Cloud Kingdom", description: "A rare serpent of the clouds.", baseHp: 290, baseAttack: 22, baseDefense: 13, rarity: "RARE", lootDrops: ["Rare Beast Fang", "Sealed Coin", "Runed Talisman", "Duskwalker Idol"] },
  { name: "Savage Beast of Cloud Kingdom", description: "A legendary beast of the clouds.", baseHp: 410, baseAttack: 29, baseDefense: 19, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Primal Totem", "Runic Blade"] },
  { name: "Twisted Warden of Cloud Kingdom", description: "A legendary warden of the clouds.", baseHp: 430, baseAttack: 30, baseDefense: 20, rarity: "LEGENDARY", lootDrops: ["Echoing Horn", "Fireheart Gem", "Ancient Beast Core", "Primal Totem"] },
  { name: "Barbed Stalker of Cloud Kingdom", description: "A mythic stalker of the clouds.", baseHp: 540, baseAttack: 34, baseDefense: 21, rarity: "MYTHIC", lootDrops: ["Ethereal Relic", "Astral Sigil", "Mythic Beast Bone"] },
  // --- Obsidian Wastes (Dark Realm) ---
  { name: "Barbed Warden of Dark Realm", description: "A barbed warden of the wastes.", baseHp: 220, baseAttack: 17, baseDefense: 10, rarity: "UNCOMMON", lootDrops: ["Beast Claw", "Cracked Fang", "Frayed Hide"] },
  { name: "Lurking Serpent of Dark Realm", description: "A rare serpent of the wastes.", baseHp: 280, baseAttack: 21, baseDefense: 12, rarity: "RARE", lootDrops: ["Runed Talisman", "Bone Carving", "Rare Beast Fang"] },
  { name: "Dire Beast of Dark Realm", description: "A rare beast of the wastes.", baseHp: 300, baseAttack: 23, baseDefense: 13, rarity: "RARE", lootDrops: ["Rare Beast Fang", "Bone Carving", "Runed Talisman", "Sealed Coin"] },
  { name: "Savage Beast of Dark Realm", description: "A legendary beast of the wastes.", baseHp: 420, baseAttack: 30, baseDefense: 20, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Primal Totem", "Runic Blade", "Echoing Horn"] },
  { name: "Dire Serpent of Dark Realm", description: "A legendary serpent of the wastes.", baseHp: 440, baseAttack: 31, baseDefense: 21, rarity: "LEGENDARY", lootDrops: ["Primal Totem", "Fireheart Gem", "Runic Blade"] },
  { name: "Barbed Construct of Dark Realm", description: "A mythic construct of the wastes.", baseHp: 550, baseAttack: 36, baseDefense: 22, rarity: "MYTHIC", lootDrops: ["Ethereal Relic", "Mythic Beast Bone", "Veilstone", "Astral Sigil"] },
  // --- Astral Caverns (Cosmic) ---
  { name: "Barbed Beast of Cosmic", description: "A barbed beast of the astral caverns.", baseHp: 230, baseAttack: 18, baseDefense: 10, rarity: "UNCOMMON", lootDrops: ["Uncommon Relic Shard", "Mossy Charm", "Cracked Fang", "Beast Claw"] },
  { name: "Dire Beast of Cosmic", description: "A rare beast of the astral caverns.", baseHp: 290, baseAttack: 22, baseDefense: 13, rarity: "RARE", lootDrops: ["Sealed Coin", "Bone Carving", "Runed Talisman"] },
  { name: "Enhanced Dire Beast of Cosmic", description: "An enhanced rare beast of the astral caverns.", baseHp: 310, baseAttack: 23, baseDefense: 14, rarity: "RARE", lootDrops: ["Runed Talisman", "Bone Carving", "Rare Beast Fang"] },
  { name: "Savage Construct of Cosmic", description: "A legendary construct of the astral caverns.", baseHp: 430, baseAttack: 32, baseDefense: 18, rarity: "LEGENDARY", lootDrops: ["Ancient Beast Core", "Primal Totem", "Runic Blade"] },
  { name: "Twisted Construct of Cosmic", description: "A legendary construct of the astral caverns.", baseHp: 450, baseAttack: 33, baseDefense: 19, rarity: "LEGENDARY", lootDrops: ["Fireheart Gem", "Echoing Horn", "Primal Totem"] },
  { name: "Ancient Stalker of Cosmic", description: "A mythic stalker of the astral caverns.", baseHp: 560, baseAttack: 38, baseDefense: 23, rarity: "MYTHIC", lootDrops: ["Shard of Ascension", "Veilstone", "Mythic Beast Bone"] },
  // --- Ethereal Sanctum (Divine) ---
  { name: "Barbed Construct of Divine", description: "A barbed construct of the sanctum.", baseHp: 240, baseAttack: 19, baseDefense: 11, rarity: "UNCOMMON", lootDrops: ["Beast Claw", "Frayed Hide", "Uncommon Relic Shard"] },
  { name: "Twisted Warden of Divine", description: "A rare warden of the sanctum.", baseHp: 300, baseAttack: 23, baseDefense: 14, rarity: "RARE", lootDrops: ["Runed Talisman", "Sealed Coin", "Bone Carving", "Duskwalker Idol"] },
  { name: "Dire Warden of Divine", description: "A rare warden of the sanctum.", baseHp: 320, baseAttack: 24, baseDefense: 15, rarity: "RARE", lootDrops: ["Sealed Coin", "Duskwalker Idol", "Runed Talisman"] },
  { name: "Ancient Stalker of Divine", description: "A legendary stalker of the sanctum.", baseHp: 450, baseAttack: 34, baseDefense: 21, rarity: "LEGENDARY", lootDrops: ["Runic Blade", "Primal Totem", "Echoing Horn", "Ancient Beast Core"] },
  { name: "Savage Warden of Divine", description: "A legendary warden of the sanctum.", baseHp: 470, baseAttack: 35, baseDefense: 22, rarity: "LEGENDARY", lootDrops: ["Primal Totem", "Echoing Horn", "Ancient Beast Core", "Runic Blade"] },
  { name: "Lurking Beast of Divine", description: "A mythic beast of the sanctum.", baseHp: 580, baseAttack: 40, baseDefense: 25, rarity: "MYTHIC", lootDrops: ["Astral Sigil", "Veilstone", "Mythic Beast Bone"] },

  // --- Bosses (Mythic) ---
  { name: "Ancient Guardian of the Jungle", description: "A massive guardian of stone and magic, protector of the jungle realm.", baseHp: 800, baseAttack: 45, baseDefense: 25, rarity: "MYTHIC", lootDrops: ["Crown of Vaelith", "Crown of Vaelith Fragment", "Astral Sigil", "Ethereal Relic"] },
  { name: "Frost Giant King", description: "A mighty frost giant king, ruler of the frozen realm.", baseHp: 850, baseAttack: 48, baseDefense: 28, rarity: "MYTHIC", lootDrops: ["Heart of the Frozen Titan", "Heart of the Frozen Titan Fragment", "Mythic Beast Bone", "Shard of Ascension"] },
  { name: "Desert Pharaoh", description: "An ancient pharaoh of sand and magic, ruler of the desert realm.", baseHp: 820, baseAttack: 46, baseDefense: 26, rarity: "MYTHIC", lootDrops: ["Scarab of the Mirage King", "Scarab of the Mirage King Fragment", "Ethereal Relic", "Astral Sigil"] },
  { name: "Abyssal Leviathan", description: "A massive leviathan of the deep, master of the abyssal realm.", baseHp: 830, baseAttack: 47, baseDefense: 27, rarity: "MYTHIC", lootDrops: ["Tear of the Deep", "Tear of the Deep Fragment", "Ethereal Relic", "Astral Sigil"] },
  { name: "Volcanic Titan", description: "A titan of fire and steel, embodiment of the volcanic realm.", baseHp: 840, baseAttack: 49, baseDefense: 29, rarity: "MYTHIC", lootDrops: ["Core of the Forge Wyrm", "Core of the Forge Wyrm Fragment", "Ethereal Relic", "Mythic Beast Bone"] },
  { name: "Shadow Lord", description: "A lord of shadows and mystery, ruler of the twilight realm.", baseHp: 810, baseAttack: 44, baseDefense: 24, rarity: "MYTHIC", lootDrops: ["Veil of the Moor Queen", "Veil of the Moor Queen Fragment", "Mythic Beast Bone", "Astral Sigil"] },
  { name: "Storm Dragon", description: "A mighty dragon of wind and sky, master of the storm realm.", baseHp: 825, baseAttack: 45, baseDefense: 25, rarity: "MYTHIC", lootDrops: ["Feather of the Sky God", "Feather of the Sky God Fragment", "Mythic Beast Bone", "Ethereal Relic"] },
  { name: "Void Emperor", description: "An emperor of darkness and corruption, lord of the void realm.", baseHp: 835, baseAttack: 48, baseDefense: 28, rarity: "MYTHIC", lootDrops: ["Obsidian Soulbrand", "Obsidian Soulbrand Fragment", "Shard of Ascension", "Veilstone"] },
  { name: "Celestial Archon", description: "An archon of the cosmos, wielder of celestial power.", baseHp: 845, baseAttack: 50, baseDefense: 30, rarity: "MYTHIC", lootDrops: ["Starforged Eye", "Starforged Eye Fragment", "Shard of Ascension", "Ethereal Relic"] },
  { name: "Divine Seraph", description: "A divine seraph, guardian of the sacred realm.", baseHp: 860, baseAttack: 52, baseDefense: 32, rarity: "MYTHIC", lootDrops: ["Halo of the Divine Sentinel", "Halo of the Divine Sentinel Fragment", "Shard of Ascension", "Veilstone"] }
];

async function seedBeasts() {
  console.log('🌱 Seeding all beasts and bosses from CSV...');

  for (const beastData of beastsData) {
    try {
      // Create the beast (without lootDrops field)
      const { lootDrops, ...beastDataWithoutLoot } = beastData;
      const beast = await prisma.beast.upsert({
        where: { name: beastData.name },
        update: beastDataWithoutLoot,
        create: beastDataWithoutLoot
      });

      // Create loot drops for this beast
      for (const itemName of lootDrops) {
        // Find the item by name
        const item = await prisma.item.findUnique({
          where: { name: itemName }
        });

        if (item) {
          // Drop rate logic
          let dropRate = 0.15; // Default
          if (beastData.rarity === 'UNCOMMON') dropRate = 0.15;
          else if (beastData.rarity === 'RARE') dropRate = 0.12;
          else if (beastData.rarity === 'LEGENDARY') dropRate = 0.08;
          else if (beastData.rarity === 'MYTHIC') dropRate = 0.05;
          // Boss fragments and main items
          if (itemName.includes('Fragment')) dropRate = 0.25;
          if (["Crown of Vaelith","Heart of the Frozen Titan","Scarab of the Mirage King","Tear of the Deep","Core of the Forge Wyrm","Veil of the Moor Queen","Feather of the Sky God","Obsidian Soulbrand","Starforged Eye","Halo of the Divine Sentinel"].includes(itemName)) dropRate = 0.10;

          await prisma.beastLootDrop.upsert({
            where: {
              beastId_itemId: {
                beastId: beast.id,
                itemId: item.id
              }
            },
            update: { dropRate },
            create: {
              beastId: beast.id,
              itemId: item.id,
              dropRate
            }
          });
        } else {
          console.log(`⚠️ Item not found: ${itemName}`);
        }
      }

      console.log(`✅ Created beast/boss: ${beast.name}`);
    } catch (error) {
      console.error(`❌ Error creating beast/boss ${beastData.name}:`, error);
    }
  }

  console.log('✅ All beasts and bosses seeded successfully!');
}

async function main() {
  try {
    await seedBeasts();
  } catch (error) {
    console.error('❌ Error seeding beasts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedBeasts }; 