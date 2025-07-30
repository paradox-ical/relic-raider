const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAchievements() {
  console.log('🌱 Seeding achievements and titles...');

  // Create basic titles
  const titles = [

    {
      name: 'The Curious',
      description: 'Explored 3 different zones',
      category: 'achievement',
      rarity: 'common'
    },
    {
      name: 'The Beginner Collector',
      description: 'Own 5 different items',
      category: 'achievement',
      rarity: 'common'
    },
    {
      name: 'The Dedicated',
      description: 'A persistent explorer who never gives up',
      category: 'achievement',
      rarity: 'uncommon'
    },
    {
      name: 'The Night Owl',
      description: 'Explored after midnight',
      category: 'achievement',
      rarity: 'uncommon'
    },
    {
      name: 'The Collector\'s Apprentice',
      description: 'Own 25 unique items',
      category: 'achievement',
      rarity: 'uncommon'
    },
    {
      name: 'The Quick Draw',
      description: 'Completed an exploration in under 5 seconds',
      category: 'achievement',
      rarity: 'uncommon'
    },
    {
      name: 'The Generous',
      description: 'Gifted coins to another player',
      category: 'achievement',
      rarity: 'uncommon'
    },

    {
      name: 'The Collector',
      description: 'A master of gathering relics and treasures',
      category: 'achievement',
      rarity: 'rare'
    },
    {
      name: 'The Wealthy',
      description: 'A prosperous adventurer with deep pockets',
      category: 'achievement',
      rarity: 'rare'
    },
    {
      name: 'The Mythic Hunter',
      description: 'A legendary hunter of the rarest relics',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'The Legend',
      description: 'A true legend among adventurers',
      category: 'achievement',
      rarity: 'mythic'
    },
    {
      name: 'The Shadow',
      description: 'A master of discovering hidden secrets',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'Zone Master',
      description: 'A master of all exploration zones',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'The Strategist',
      description: 'A master of all tools and equipment',
      category: 'achievement',
      rarity: 'mythic'
    },
    {
      name: 'The Legendary',
      description: 'The ultimate achievement of power and skill',
      category: 'achievement',
      rarity: 'mythic'
    },
    {
      name: 'The Unstoppable',
      description: 'A relentless force of exploration and discovery',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'Mythic Storm',
      description: 'A tempest of mythic discoveries and legendary finds',
      category: 'achievement',
      rarity: 'mythic'
    },
    {
      name: 'The Perfect',
      description: 'A master of flawless exploration and perfect timing',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'Zone Conqueror',
      description: 'A conqueror of all exploration zones and territories',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'The Millionaire',
      description: 'A master of wealth accumulation and economic prowess',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'The Legendary Hunter',
      description: 'A master hunter of legendary treasures and relics',
      category: 'achievement',
      rarity: 'legendary'
    },
    {
      name: 'The Speed Demon',
      description: 'A lightning-fast explorer with incredible speed and precision',
      category: 'achievement',
      rarity: 'rare'
    }
  ];

  for (const titleData of titles) {
    await prisma.title.upsert({
      where: { name: titleData.name },
      update: titleData,
      create: titleData
    });
  }

  // Create detailed achievements
  const achievements = [
    // Exploration achievements

    {
      name: 'The Curious',
      description: 'Explored 3 different zones',
      category: 'exploration',
      requirement: 'zones_explored',
      requirementValue: 3,
      rewardTitle: 'The Curious',
      rewardCoins: 150,
      rewardXP: 75,
      isHidden: false
    },
    {
      name: 'The Beginner Collector',
      description: 'Own 5 different items',
      category: 'collection',
      requirement: 'unique_items',
      requirementValue: 5,
      rewardTitle: 'The Beginner Collector',
      rewardCoins: 100,
      rewardXP: 50,
      isHidden: false
    },

    {
      name: 'Lucky Explorer',
      description: 'Find 3 rare or better items in a single exploration',
      category: 'exploration',
      requirement: 'rare_finds_single',
      requirementValue: 1,
      rewardCoins: 750,
      rewardXP: 300,
      isHidden: false
    },

    // Collection achievements
    {
      name: 'The Collector\'s Apprentice',
      description: 'Own 25 unique items',
      category: 'collection',
      requirement: 'unique_items',
      requirementValue: 25,
      rewardTitle: 'The Collector\'s Apprentice',
      rewardCoins: 500,
      rewardXP: 250,
      isHidden: false
    },
    {
      name: 'Item Collector',
      description: 'Own 50 different items, becoming a true collector',
      category: 'collection',
      requirement: 'unique_items',
      requirementValue: 50,
      rewardTitle: 'The Collector',
      rewardCoins: 1000,
      rewardXP: 500,
      isHidden: false
    },
    {
      name: 'Mythic Discovery',
      description: 'Find your first mythic item, the rarest of treasures',
      category: 'collection',
      requirement: 'mythic_items',
      requirementValue: 1,
      rewardCoins: 5000,
      rewardXP: 1000,
      isHidden: false
    },
    {
      name: 'Rarity Hunter',
      description: 'Own at least one item of each rarity level',
      category: 'collection',
      requirement: 'all_rarities',
      requirementValue: 1,
      rewardCoins: 1500,
      rewardXP: 750,
      isHidden: false
    },
    {
      name: 'Legendary Collector',
      description: 'Own 10 legendary items',
      category: 'collection',
      requirement: 'legendary_items',
      requirementValue: 10,
      rewardCoins: 3000,
      rewardXP: 1500,
      isHidden: false
    },

    // Economic achievements
    {
      name: 'First Fortune',
      description: 'Earn your first 1,000 coins through exploration and trading',
      category: 'economic',
      requirement: 'total_coins_earned',
      requirementValue: 1000,
      rewardCoins: 100,
      rewardXP: 50,
      isHidden: false
    },
    {
      name: 'The Bargain Hunter',
      description: 'Bought something from the shop',
      category: 'economic',
      requirement: 'shop_purchases',
      requirementValue: 1,
      rewardTitle: 'The Bargain Hunter',
      rewardCoins: 50,
      rewardXP: 25,
      isHidden: false
    },
    {
      name: 'Wealthy Adventurer',
      description: 'Accumulate 10,000 coins, becoming a wealthy adventurer',
      category: 'economic',
      requirement: 'total_coins',
      requirementValue: 10000,
      rewardTitle: 'The Wealthy',
      rewardCoins: 500,
      rewardXP: 250,
      isHidden: false
    },
    {
      name: 'Millionaire',
      description: 'Accumulate 100,000 coins, achieving true wealth',
      category: 'economic',
      requirement: 'total_coins',
      requirementValue: 100000,
      rewardCoins: 10000,
      rewardXP: 5000,
      isHidden: false
    },
    {
      name: 'Smart Investor',
      description: 'Spend 5,000 coins on shop items',
      category: 'economic',
      requirement: 'coins_spent',
      requirementValue: 5000,
      rewardCoins: 250,
      rewardXP: 125,
      isHidden: false
    },

    // Level achievements
    {
      name: 'Rising Star',
      description: 'Reach level 10, showing promise as an adventurer',
      category: 'level',
      requirement: 'level',
      requirementValue: 10,
      rewardCoins: 300,
      rewardXP: 150,
      isHidden: false
    },
    {
      name: 'Veteran Explorer',
      description: 'Reach level 25, becoming a seasoned explorer',
      category: 'level',
      requirement: 'level',
      requirementValue: 25,
      rewardCoins: 750,
      rewardXP: 375,
      isHidden: false
    },
    {
      name: 'Legendary Status',
      description: 'Reach level 50, achieving legendary status',
      category: 'level',
      requirement: 'level',
      requirementValue: 50,
      rewardTitle: 'The Legend',
      rewardCoins: 2000,
      rewardXP: 1000,
      isHidden: false
    },
    {
      name: 'XP Master',
      description: 'Gain 10,000 total experience points',
      category: 'level',
      requirement: 'total_xp',
      requirementValue: 10000,
      rewardCoins: 500,
      rewardXP: 250,
      isHidden: false
    },

    // Special achievements - truly unique and challenging accomplishments
    {
      name: 'The Unstoppable',
      description: 'Complete 100 explorations in a single day',
      category: 'special',
      requirement: 'daily_explorations',
      requirementValue: 100,
      rewardCoins: 10000,
      rewardXP: 5000,
      rewardTitle: 'The Unstoppable',
      isHidden: false
    },
    {
      name: 'Mythic Storm',
      description: 'Find 5 mythic items in a single day',
      category: 'special',
      requirement: 'mythic_daily',
      requirementValue: 5,
      rewardCoins: 25000,
      rewardXP: 10000,
      rewardTitle: 'Mythic Storm',
      isHidden: false
    },
    {
      name: 'The Perfect Day',
      description: 'Complete 50 explorations and find at least one item in each',
      category: 'special',
      requirement: 'perfect_day',
      requirementValue: 50,
      rewardCoins: 15000,
      rewardXP: 7500,
      rewardTitle: 'The Perfect',
      isHidden: false
    },
    {
      name: 'Zone Conqueror',
      description: 'Explore every available zone at least 25 times each',
      category: 'special',
      requirement: 'zone_conqueror',
      requirementValue: 25,
      rewardCoins: 20000,
      rewardXP: 10000,
      rewardTitle: 'Zone Conqueror',
      isHidden: false
    },
    {
      name: 'The Millionaire Rush',
      description: 'Earn 100,000 coins in a single day',
      category: 'special',
      requirement: 'daily_coins',
      requirementValue: 100000,
      rewardCoins: 50000,
      rewardXP: 25000,
      rewardTitle: 'The Millionaire',
      isHidden: false
    },
    {
      name: 'The Collector\'s Dream',
      description: 'Own 500 different unique items',
      category: 'special',
      requirement: 'unique_items',
      requirementValue: 500,
      rewardCoins: 30000,
      rewardXP: 15000,
      rewardTitle: 'The Collector',
      isHidden: false
    },
    {
      name: 'The Legendary Hunter',
      description: 'Find 50 legendary items in total',
      category: 'special',
      requirement: 'legendary_items',
      requirementValue: 50,
      rewardCoins: 25000,
      rewardXP: 12500,
      rewardTitle: 'The Legendary Hunter',
      isHidden: false
    },
    {
      name: 'The Speed Demon',
      description: 'Complete 10 explorations within 1 minute total',
      category: 'special',
      requirement: 'speed_demon',
      requirementValue: 10,
      rewardCoins: 15000,
      rewardXP: 7500,
      rewardTitle: 'The Speed Demon',
      isHidden: false
    },
    {
      name: 'The Night Owl',
      description: 'Explored after midnight',
      category: 'special',
      requirement: 'night_exploration',
      requirementValue: 1,
      rewardTitle: 'The Night Owl',
      rewardCoins: 200,
      rewardXP: 100,
      isHidden: false
    },
    {
      name: 'The Quick Draw',
      description: 'Completed an exploration in under 5 seconds',
      category: 'special',
      requirement: 'quick_exploration',
      requirementValue: 1,
      rewardTitle: 'The Quick Draw',
      rewardCoins: 300,
      rewardXP: 150,
      isHidden: false
    },
    {
      name: 'The Explorer\'s Friend',
      description: 'Helped another player',
      category: 'special',
      requirement: 'help_others',
      requirementValue: 1,
      rewardTitle: 'The Explorer\'s Friend',
      rewardCoins: 100,
      rewardXP: 50,
      isHidden: false
    },
    {
      name: 'The Generous',
      description: 'Gifted coins to another player',
      category: 'special',
      requirement: 'gift_coins',
      requirementValue: 1,
      rewardTitle: 'The Generous',
      rewardCoins: 150,
      rewardXP: 75,
      isHidden: false
    }
  ];

  for (const achievementData of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievementData.name },
      update: achievementData,
      create: achievementData
    });
  }

  console.log('✅ Achievements and titles seeded successfully!');
}

async function main() {
  try {
    await seedAchievements();
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedAchievements }; 