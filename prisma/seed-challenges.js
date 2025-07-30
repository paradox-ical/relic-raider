const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedChallenges() {
  console.log('🌱 Seeding achievement challenges and hidden achievements...');

  // Create hidden achievements
  const hiddenAchievements = [
    {
      name: 'The Unseen',
      description: 'Discover your first hidden achievement',
      category: 'special',
      requirement: 'hidden_discovery',
      requirementValue: 1,
      rewardCoins: 2000,
      rewardXP: 1000,
      isHidden: true
    },
    {
      name: 'Shadow Hunter',
      description: 'Discover 10 hidden achievements',
      category: 'special',
      requirement: 'hidden_completions',
      requirementValue: 10,
      rewardCoins: 15000,
      rewardXP: 7500,
      rewardTitle: 'The Shadow',
      isHidden: true
    },
    {
      name: 'Mythic Storm',
      description: 'Find 5 mythic items in a single day',
      category: 'exploration',
      requirement: 'mythic_daily',
      requirementValue: 5,
      rewardCoins: 25000,
      rewardXP: 10000,
      isHidden: true
    },
    {
      name: 'Perfect Timing',
      description: 'Complete an exploration exactly at the 4-second mark',
      category: 'exploration',
      requirement: 'perfect_timing',
      requirementValue: 1,
      rewardCoins: 5000,
      rewardXP: 2500,
      isHidden: true
    },
    {
      name: 'The Collector\'s Gambit',
      description: 'Own exactly 100 items in your inventory',
      category: 'collection',
      requirement: 'exact_inventory',
      requirementValue: 100,
      rewardCoins: 10000,
      rewardXP: 5000,
      isHidden: true
    },
    {
      name: 'Zone Master',
      description: 'Explore every available zone at least 10 times each',
      category: 'exploration',
      requirement: 'zone_master',
      requirementValue: 10,
      rewardCoins: 20000,
      rewardXP: 10000,
      rewardTitle: 'Zone Master',
      isHidden: true
    },
    {
      name: 'The Patient One',
      description: 'Wait 24 hours between explorations',
      category: 'exploration',
      requirement: 'patience',
      requirementValue: 1,
      rewardCoins: 3000,
      rewardXP: 1500,
      isHidden: true
    },
    {
      name: 'Rarity Perfectionist',
      description: 'Own exactly 1 item of each rarity level',
      category: 'collection',
      requirement: 'rarity_perfection',
      requirementValue: 1,
      rewardCoins: 15000,
      rewardXP: 7500,
      isHidden: true
    },
    {
      name: 'The Hoarder',
      description: 'Own 1000 of a single item',
      category: 'collection',
      requirement: 'mass_hoarding',
      requirementValue: 1000,
      rewardCoins: 12000,
      rewardXP: 6000,
      isHidden: true
    },
    {
      name: 'The Minimalist',
      description: 'Complete 50 explorations with an empty inventory',
      category: 'exploration',
      requirement: 'minimalist',
      requirementValue: 50,
      rewardCoins: 8000,
      rewardXP: 4000,
      isHidden: true
    },
    {
      name: 'The Gambler',
      description: 'Spend all your coins in a single purchase',
      category: 'economic',
      requirement: 'all_in',
      requirementValue: 1,
      rewardCoins: 20000,
      rewardXP: 10000,
      isHidden: true
    },
    {
      name: 'The Time Traveler',
      description: 'Explore at exactly midnight (server time)',
      category: 'exploration',
      requirement: 'midnight_exploration',
      requirementValue: 1,
      rewardCoins: 10000,
      rewardXP: 5000,
      isHidden: true
    },
    {
      name: 'The Perfectionist',
      description: 'Complete an exploration with exactly 100 XP gained',
      category: 'exploration',
      requirement: 'perfect_xp',
      requirementValue: 100,
      rewardCoins: 15000,
      rewardXP: 7500,
      isHidden: true
    },
    {
      name: 'The Strategist',
      description: 'Own every brush and map in the game',
      category: 'collection',
      requirement: 'complete_gear',
      requirementValue: 1,
      rewardCoins: 30000,
      rewardXP: 15000,
      rewardTitle: 'The Strategist',
      isHidden: true
    },
    {
      name: 'The Legendary',
      description: 'Reach level 100',
      category: 'level',
      requirement: 'max_level',
      requirementValue: 100,
      rewardCoins: 50000,
      rewardXP: 25000,
      rewardTitle: 'The Legendary',
      isHidden: true
    }
  ];

  for (const achievementData of hiddenAchievements) {
    await prisma.achievement.upsert({
      where: { name: achievementData.name },
      update: achievementData,
      create: achievementData
    });
  }

  // Create daily challenges
  const dailyChallenges = [
    {
      name: 'Daily Explorer',
      description: 'Complete 5 explorations today',
      category: 'daily',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      rewardCoins: 200,
      rewardXP: 100
    },
    {
      name: 'Daily Collector',
      description: 'Find 10 unique items today',
      category: 'daily',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      rewardCoins: 300,
      rewardXP: 150
    },
    {
      name: 'Daily Fortune',
      description: 'Earn 1000 coins today',
      category: 'daily',
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      rewardCoins: 500,
      rewardXP: 250
    }
  ];

  // Create weekly challenges
  const weeklyChallenges = [
    {
      name: 'Weekly Master',
      description: 'Complete 50 explorations this week',
      category: 'weekly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      rewardCoins: 1000,
      rewardXP: 500,
      rewardTitle: 'Weekly Champion'
    },
    {
      name: 'Weekly Collector',
      description: 'Find 100 unique items this week',
      category: 'weekly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rewardCoins: 1500,
      rewardXP: 750
    },
    {
      name: 'Weekly Millionaire',
      description: 'Earn 10,000 coins this week',
      category: 'weekly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rewardCoins: 2000,
      rewardXP: 1000
    }
  ];

  // Create seasonal challenges
  const seasonalChallenges = [
    {
      name: 'Summer Explorer',
      description: 'Complete 200 explorations during summer',
      category: 'seasonal',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      rewardCoins: 5000,
      rewardXP: 2500,
      rewardTitle: 'Summer Legend'
    },
    {
      name: 'Winter Collector',
      description: 'Find 500 unique items during winter',
      category: 'seasonal',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-02-28'),
      rewardCoins: 7500,
      rewardXP: 3750,
      rewardTitle: 'Winter Master'
    }
  ];

  const allChallenges = [...dailyChallenges, ...weeklyChallenges, ...seasonalChallenges];

  for (const challengeData of allChallenges) {
    await prisma.achievementChallenge.upsert({
      where: { name: challengeData.name },
      update: challengeData,
      create: challengeData
    });
  }

  console.log('✅ Challenges and hidden achievements seeded successfully!');
}

async function main() {
  try {
    await seedChallenges();
  } catch (error) {
    console.error('❌ Error seeding challenges:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedChallenges }; 