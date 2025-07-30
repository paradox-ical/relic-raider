const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCraftingStations() {
  console.log('🌿 Seeding crafting stations...');

  try {
    // Create the new crafting stations
    const stations = [
      {
        name: 'Research Table',
        description: 'A mystical table for combining exploration relics into higher tier items. Unlock rare, legendary, and mythic relics through careful research.',
        location: 'main_menu',
        unlockCost: 10000,
        requiredLevel: 5
      },
      {
        name: 'Blacksmith\'s Forge',
        description: 'A master craftsman\'s forge for creating weapons, armor, and accessories. Forge powerful gear to enhance your combat abilities.',
        location: 'main_menu',
        unlockCost: 10000,
        requiredLevel: 5
      },
      {
        name: 'Shadow Altar',
        description: 'An ancient altar shrouded in darkness for combining boss fragments and crafting legendary boss gear. Only the worthy may access its power.',
        location: 'main_menu',
        unlockCost: 30000,
        requiredLevel: 25
      }
    ];

    for (const stationData of stations) {
      await prisma.craftingStation.upsert({
        where: { name: stationData.name },
        update: stationData,
        create: stationData
      });
      console.log(`✅ Created/Updated: ${stationData.name}`);
    }

    console.log('🎉 Crafting stations seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding crafting stations:', error);
  }
}

module.exports = seedCraftingStations;

if (require.main === module) {
  seedCraftingStations()
    .then(() => {
      console.log('Crafting stations seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Crafting stations seeding failed:', error);
      process.exit(1);
    });
} 