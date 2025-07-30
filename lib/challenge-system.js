const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ChallengeSystem {
  // Get active challenges for a user
  static async getActiveChallenges(userId) {
    const now = new Date();
    
    const challenges = await prisma.achievementChallenge.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      },
      include: {
        challengeProgress: {
          where: { userId }
        }
      },
      orderBy: [
        { category: 'asc' },
        { startDate: 'asc' }
      ]
    });

    return challenges.map(challenge => ({
      ...challenge,
      userProgress: challenge.challengeProgress[0] || null
    }));
  }

  // Get user's challenge progress
  static async getUserChallengeProgress(userId) {
    return await prisma.userChallengeProgress.findMany({
      where: { userId },
      include: {
        challenge: true
      },
      orderBy: [
        { isCompleted: 'desc' },
        { startedAt: 'desc' }
      ]
    });
  }

  // Check and update challenge progress
  static async checkChallengeProgress(userId, action, value = 1) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventoryItems: {
          include: { item: true }
        }
      }
    });

    if (!user) return [];

    const activeChallenges = await this.getActiveChallenges(userId);
    const newlyCompleted = [];

    for (const challenge of activeChallenges) {
      let progress = 0;
      let shouldUpdate = false;

      switch (challenge.name) {
        case 'Daily Explorer':
        case 'Weekly Master':
        case 'Summer Explorer':
          // Count explorations since challenge start
          const explorationCount = await this.countExplorationsSince(userId, challenge.startDate);
          progress = explorationCount;
          shouldUpdate = true;
          break;

        case 'Daily Collector':
        case 'Weekly Collector':
        case 'Winter Collector':
          // Count unique items found since challenge start
          const uniqueItems = await this.countUniqueItemsSince(userId, challenge.startDate);
          progress = uniqueItems;
          shouldUpdate = true;
          break;

        case 'Daily Fortune':
        case 'Weekly Millionaire':
          // Count coins earned since challenge start
          const coinsEarned = await this.countCoinsEarnedSince(userId, challenge.startDate);
          progress = coinsEarned;
          shouldUpdate = true;
          break;
      }

      if (shouldUpdate) {
        const userProgress = challenge.userProgress;
        
        if (!userProgress) {
          // Create new progress
          const isCompleted = progress >= this.getChallengeRequirement(challenge);
          await prisma.userChallengeProgress.create({
            data: {
              userId,
              challengeId: challenge.id,
              progress,
              isCompleted,
              completedAt: isCompleted ? new Date() : null
            }
          });

          if (isCompleted) {
            newlyCompleted.push(challenge);
            await this.grantChallengeRewards(userId, challenge);
          }
        } else if (!userProgress.isCompleted && progress >= this.getChallengeRequirement(challenge)) {
          // Complete existing progress
          await prisma.userChallengeProgress.update({
            where: { id: userProgress.id },
            data: {
              progress,
              isCompleted: true,
              completedAt: new Date()
            }
          });

          newlyCompleted.push(challenge);
          await this.grantChallengeRewards(userId, challenge);
        } else if (userProgress.progress !== progress) {
          // Update progress
          await prisma.userChallengeProgress.update({
            where: { id: userProgress.id },
            data: { progress }
          });
        }
      }
    }

    return newlyCompleted;
  }

  // Get challenge requirement value
  static getChallengeRequirement(challenge) {
    const requirements = {
      'Daily Explorer': 5,
      'Daily Collector': 10,
      'Daily Fortune': 1000,
      'Weekly Master': 50,
      'Weekly Collector': 100,
      'Weekly Millionaire': 10000,
      'Summer Explorer': 200,
      'Winter Collector': 500
    };

    return requirements[challenge.name] || 1;
  }

  // Count explorations since a date
  static async countExplorationsSince(userId, sinceDate) {
    // This is a simplified version - in a real implementation,
    // you'd track exploration history in a separate table
    // For now, we'll estimate based on user level and experience
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Rough estimate: assume 1 exploration per level
    return Math.floor(user.experience / 100);
  }

  // Count unique items since a date
  static async countUniqueItemsSince(userId, sinceDate) {
    const uniqueItems = await prisma.inventoryItem.count({
      where: {
        userId,
        createdAt: { gte: sinceDate }
      }
    });

    return uniqueItems;
  }

  // Count coins earned since a date
  static async countCoinsEarnedSince(userId, sinceDate) {
    // This is a simplified version - in a real implementation,
    // you'd track coin earning history
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Rough estimate based on current coins
    return user.coins;
  }

  // Grant challenge rewards
  static async grantChallengeRewards(userId, challenge) {
    try {
      // Grant coins
      if (challenge.rewardCoins > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { coins: { increment: challenge.rewardCoins } }
        });
      }

      // Grant XP
      if (challenge.rewardXP > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { experience: { increment: challenge.rewardXP } }
        });
      }

      // Grant title if specified
      if (challenge.rewardTitle) {
        const title = await prisma.title.findUnique({
          where: { name: challenge.rewardTitle }
        });

        if (title) {
          await prisma.userTitle.upsert({
            where: {
              userId_titleId: {
                userId,
                titleId: title.id
              }
            },
            update: {},
            create: {
              userId,
              titleId: title.id,
              isEquipped: false
            }
          });
        }
      }
    } catch (error) {
      console.error('Error granting challenge rewards:', error);
    }
  }

  // Hidden Achievement System
  static async discoverHiddenAchievement(userId, achievementId) {
    const discovery = await prisma.hiddenAchievementDiscovery.upsert({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      },
      update: {},
      create: {
        userId,
        achievementId,
        discoveredAt: new Date()
      }
    });

    return discovery;
  }

  // Get hidden achievements for a user
  static async getHiddenAchievements(userId) {
    const hiddenAchievements = await prisma.achievement.findMany({
      where: { isHidden: true },
      include: {
        hiddenDiscoveries: {
          where: { userId }
        }
      }
    });

    return hiddenAchievements.map(achievement => ({
      ...achievement,
      isDiscovered: achievement.hiddenDiscoveries.length > 0,
      discovery: achievement.hiddenDiscoveries[0] || null
    }));
  }

  // Use hint for hidden achievement
  static async useHint(userId, achievementId) {
    const discovery = await prisma.hiddenAchievementDiscovery.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId
        }
      }
    });

    if (discovery && !discovery.hintUsed) {
      await prisma.hiddenAchievementDiscovery.update({
        where: { id: discovery.id },
        data: {
          hintUsed: true,
          hintUsedAt: new Date()
        }
      });
    }

    return discovery;
  }

  // Get achievement hints
  static getAchievementHints() {
    return {
      'The Unseen': 'The first step into the unknown...',
      'Shadow Hunter': 'Ten shadows in the darkness...',
      'Mythic Storm': 'A storm of legends in a single day...',
      'Perfect Timing': 'Timing is everything...',
      'The Collector\'s Gambit': 'Exactly 100 treasures...',
      'Zone Master': 'Master of all realms...',
      'The Patient One': 'Time is your ally...',
      'Rarity Perfectionist': 'One of each, no more, no less...',
      'The Hoarder': 'A thousand of one...',
      'The Minimalist': 'Less is more...',
      'The Gambler': 'All or nothing...',
      'The Time Traveler': 'When the clock strikes twelve...',
      'The Perfectionist': 'Exactly 100 steps forward...',
      'The Strategist': 'Every tool in the arsenal...',
      'The Legendary': 'The ultimate milestone...'
    };
  }

  // Check hidden achievement progress
  static async checkHiddenAchievements(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        inventoryItems: {
          include: { item: true }
        },
        hiddenDiscoveries: {
          include: { achievement: true }
        },
        userBrushes: {
          include: { brush: true }
        },
        userMaps: {
          include: { map: true }
        }
      }
    });

    if (!user) return [];

    const newlyCompleted = [];
    const hiddenAchievements = await this.getHiddenAchievements(userId);

    for (const achievement of hiddenAchievements) {
      if (achievement.isDiscovered) continue; // Already discovered

      let shouldDiscover = false;

      switch (achievement.requirement) {
        case 'hidden_discovery':
          // This is a meta-achievement - will be handled separately
          break;

        case 'hidden_completions':
          const discoveredCount = user.hiddenDiscoveries.length;
          shouldDiscover = discoveredCount >= achievement.requirementValue;
          break;

        case 'mythic_daily':
          const mythicDaily = await this.checkMythicDaily(userId);
          shouldDiscover = mythicDaily >= achievement.requirementValue;
          break;

        case 'perfect_timing':
          const perfectTiming = await this.checkPerfectTiming(userId);
          shouldDiscover = perfectTiming >= achievement.requirementValue;
          break;

        case 'exact_inventory':
          const exactInventory = await this.checkExactInventory(userId);
          shouldDiscover = exactInventory >= achievement.requirementValue;
          break;

        case 'zone_master':
          const zoneMaster = await this.checkZoneMaster(userId);
          shouldDiscover = zoneMaster >= achievement.requirementValue;
          break;

        case 'patience':
          const patience = await this.checkPatience(userId);
          shouldDiscover = patience >= achievement.requirementValue;
          break;

        case 'rarity_perfection':
          const rarityPerfection = await this.checkRarityPerfection(userId);
          shouldDiscover = rarityPerfection >= achievement.requirementValue;
          break;

        case 'mass_hoarding':
          const massHoarding = await this.checkMassHoarding(userId);
          shouldDiscover = massHoarding >= achievement.requirementValue;
          break;

        case 'minimalist':
          const minimalist = await this.checkMinimalist(userId);
          shouldDiscover = minimalist >= achievement.requirementValue;
          break;

        case 'all_in':
          const allIn = await this.checkAllIn(userId);
          shouldDiscover = allIn >= achievement.requirementValue;
          break;

        case 'midnight_exploration':
          const midnightExploration = await this.checkMidnightExploration(userId);
          shouldDiscover = midnightExploration >= achievement.requirementValue;
          break;

        case 'perfect_xp':
          const perfectXP = await this.checkPerfectXP(userId);
          shouldDiscover = perfectXP >= achievement.requirementValue;
          break;

        case 'complete_gear':
          const completeGear = await this.checkCompleteGear(userId);
          shouldDiscover = completeGear >= achievement.requirementValue;
          break;

        case 'max_level':
          shouldDiscover = user.level >= achievement.requirementValue;
          break;
      }

      if (shouldDiscover) {
        await this.discoverHiddenAchievement(userId, achievement.id);
        newlyCompleted.push(achievement);
      }
    }

    return newlyCompleted;
  }

  // Check mythic items found today
  static async checkMythicDaily(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mythicItemsToday = await prisma.inventoryItem.count({
      where: {
        userId,
        item: { rarity: 'MYTHIC' },
        createdAt: { gte: today }
      }
    });

    return mythicItemsToday;
  }

  // Check perfect timing (4-second exploration)
  static async checkPerfectTiming(userId) {
    // This would need to be tracked during exploration
    // For now, return 0 - would need exploration history
    return 0;
  }

  // Check exact inventory count
  static async checkExactInventory(userId) {
    const totalItems = await prisma.inventoryItem.aggregate({
      where: { userId },
      _sum: { quantity: true }
    });

    return totalItems._sum.quantity || 0;
  }

  // Check zone master (explore each zone 10 times)
  static async checkZoneMaster(userId) {
    // This would need exploration history tracking
    // For now, return 0 - would need to track zone visits
    return 0;
  }

  // Check patience (24 hours between explorations)
  static async checkPatience(userId) {
    // This would need exploration history tracking
    // For now, return 0 - would need to track exploration timestamps
    return 0;
  }

  // Check rarity perfection (exactly 1 of each rarity)
  static async checkRarityPerfection(userId) {
    const rarityCounts = await prisma.inventoryItem.groupBy({
      by: ['itemId'],
      where: { userId },
      _sum: { quantity: true }
    });

    const itemRarities = await prisma.item.findMany({
      where: {
        id: { in: rarityCounts.map(r => r.itemId) }
      },
      select: { rarity: true }
    });

    const rarityMap = {};
    rarityCounts.forEach((count, index) => {
      const rarity = itemRarities[index]?.rarity;
      if (rarity) {
        rarityMap[rarity] = (rarityMap[rarity] || 0) + count._sum.quantity;
      }
    });

    // Check if user has exactly 1 of each rarity
    const requiredRarities = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHIC'];
    const hasOneOfEach = requiredRarities.every(rarity => rarityMap[rarity] === 1);

    return hasOneOfEach ? 1 : 0;
  }

  // Check mass hoarding (1000 of a single item)
  static async checkMassHoarding(userId) {
    const maxQuantity = await prisma.inventoryItem.aggregate({
      where: { userId },
      _max: { quantity: true }
    });

    return maxQuantity._max.quantity || 0;
  }

  // Check minimalist (explorations with empty inventory)
  static async checkMinimalist(userId) {
    // This would need exploration history tracking
    // For now, return 0 - would need to track inventory state during explorations
    return 0;
  }

  // Check all-in (spend all coins)
  static async checkAllIn(userId) {
    // This would need purchase history tracking
    // For now, return 0 - would need to track spending patterns
    return 0;
  }

  // Check midnight exploration
  static async checkMidnightExploration(userId) {
    // This would need exploration history tracking
    // For now, return 0 - would need to track exploration timestamps
    return 0;
  }

  // Check perfect XP (exactly 100 XP gained)
  static async checkPerfectXP(userId) {
    // This would need exploration history tracking
    // For now, return 0 - would need to track XP gains per exploration
    return 0;
  }

  // Check complete gear (all brushes and maps)
  static async checkCompleteGear(userId) {
    const totalBrushes = await prisma.brush.count();
    const totalMaps = await prisma.map.count();
    
    const userBrushes = await prisma.userBrush.count({
      where: { userId }
    });
    
    const userMaps = await prisma.userMap.count({
      where: { userId }
    });

    const hasAllBrushes = userBrushes >= totalBrushes;
    const hasAllMaps = userMaps >= totalMaps;

    return (hasAllBrushes && hasAllMaps) ? 1 : 0;
  }
}

module.exports = ChallengeSystem; 