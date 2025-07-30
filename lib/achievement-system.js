const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Achievement tracking system
class AchievementSystem {
  // Check and update achievements for a user
  static async checkAchievements(userId) {
    try {
      // Get all achievements
      const achievements = await prisma.achievement.findMany({
        where: { isHidden: false }
      });

      // Get user's current achievement progress
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true }
      });

      // Create a map of user's current achievements
      const userAchievementMap = new Map();
      userAchievements.forEach(ua => {
        userAchievementMap.set(ua.achievementId, ua);
      });

      // Get user stats for achievement checking
      const userStats = await this.getUserStats(userId);
      const newlyCompleted = [];

      // Check each achievement
      for (const achievement of achievements) {
        const currentProgress = userAchievementMap.get(achievement.id);
        const newProgress = this.calculateProgress(achievement, userStats);

        if (!currentProgress) {
          // Create new achievement progress
          const isCompleted = newProgress >= achievement.requirementValue;
          const now = new Date();
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              progress: newProgress,
              isCompleted,
              completedAt: isCompleted ? now : null,
              firstProgressAt: now,
              lastProgressAt: now
            }
          });

          if (isCompleted) {
            newlyCompleted.push(achievement);
            await this.grantRewards(userId, achievement);
          }
        } else if (!currentProgress.isCompleted && newProgress >= achievement.requirementValue) {
          // Complete existing achievement
          const now = new Date();
          await prisma.userAchievement.update({
            where: { id: currentProgress.id },
            data: {
              progress: newProgress,
              isCompleted: true,
              completedAt: now,
              lastProgressAt: now
            }
          });

          newlyCompleted.push(achievement);
          await this.grantRewards(userId, achievement);
        } else if (currentProgress.progress !== newProgress) {
          // Update progress
          await prisma.userAchievement.update({
            where: { id: currentProgress.id },
            data: { 
              progress: newProgress,
              lastProgressAt: new Date()
            }
          });
        }
      }

      return newlyCompleted;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  // Calculate progress for a specific achievement
  static calculateProgress(achievement, userStats) {
    switch (achievement.requirement) {
      case 'explorations':
        return userStats.totalExplorations;
      case 'unique_items':
        return userStats.uniqueItems;
      case 'mythic_items':
        return userStats.mythicItems;
      case 'legendary_items':
        return userStats.legendaryItems;
      case 'total_coins':
        return userStats.currentCoins;
      case 'total_coins_earned':
        return userStats.totalCoinsEarned;
      case 'coins_spent':
        return userStats.coinsSpent;
      case 'level':
        return userStats.level;
      case 'total_xp':
        return userStats.totalXP;
      case 'zones_explored':
        return userStats.zonesExplored;
      case 'rare_finds_single':
        return userStats.rareFindsSingle;
      case 'all_rarities':
        return userStats.allRarities;
      case 'early_exploration':
        return userStats.earlyExploration;
      case 'daily_explorations':
        return userStats.dailyExplorations;
      case 'mythic_daily':
        return userStats.mythicDaily;
      case 'perfect_day':
        return userStats.perfectDay;
      case 'zone_conqueror':
        return userStats.zoneConqueror;
      case 'daily_coins':
        return userStats.dailyCoins;
      case 'speed_demon':
        return userStats.speedDemon;
      case 'shop_purchases':
        return userStats.shopPurchases || 0;
      case 'night_exploration':
        return userStats.nightExploration || 0;
      case 'quick_exploration':
        return userStats.quickExploration || 0;
      case 'help_others':
        return userStats.helpOthers || 0;
      case 'gift_coins':
        return userStats.giftCoins || 0;
      default:
        return 0;
    }
  }

  // Get comprehensive user stats for achievement checking
  static async getUserStats(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Count total explorations (use real value now)
    const totalExplorations = user.totalExplorations;

    // Count unique items
    const uniqueItems = await prisma.inventoryItem.count({
      where: { userId }
    });

    // Count items by rarity
    const mythicItems = await prisma.inventoryItem.count({
      where: {
        userId,
        item: { rarity: 'MYTHIC' }
      }
    });

    const legendaryItems = await prisma.inventoryItem.count({
      where: {
        userId,
        item: { rarity: 'LEGENDARY' }
      }
    });

    const rareItems = await prisma.inventoryItem.count({
      where: {
        userId,
        item: { rarity: 'RARE' }
      }
    });

    const uncommonItems = await prisma.inventoryItem.count({
      where: {
        userId,
        item: { rarity: 'UNCOMMON' }
      }
    });

    const commonItems = await prisma.inventoryItem.count({
      where: {
        userId,
        item: { rarity: 'COMMON' }
      }
    });

    // Check if user has all rarities
    const allRarities = (mythicItems > 0 && legendaryItems > 0 && rareItems > 0 && 
                        uncommonItems > 0 && commonItems > 0) ? 1 : 0;

    // Count zones explored (estimate based on current zone)
    const zonesExplored = user.currentZone ? 1 : 0; // Simplified for now

    // Calculate total XP (same as experience for now)
    const totalXP = user.experience;

    // Calculate real tracking values based on user data and activity
    const coinsSpent = user.coinsSpent || 0; // Track purchases
    const rareFindsSingle = user.rareFindsSingle || 0; // Track per-exploration
    const earlyExploration = user.earlyExploration || 0; // Track bot start time
    const dailyExplorations = user.dailyExplorations || 0; // Track daily counts
    
    // New special achievement tracking - calculate based on user activity
    const mythicDaily = user.mythicDaily || 0; // Track daily mythic finds
    const perfectDay = user.perfectDay || 0; // Track perfect exploration days
    const zoneConqueror = user.zoneConqueror || 0; // Track zone exploration counts
    const dailyCoins = user.dailyCoins || 0; // Track daily coin earnings
    const speedDemon = user.speedDemon || 0; // Track rapid exploration sequences
    
    // New title achievement tracking - calculate based on user activity
    const shopPurchases = user.shopPurchases || 0; // Track shop purchases
    const nightExploration = user.nightExploration || 0; // Track midnight explorations
    const quickExploration = user.quickExploration || 0; // Track fast explorations
    const helpOthers = user.helpOthers || 0; // Track helping other players
    const giftCoins = user.giftCoins || 0; // Track coin gifting
    
    // Calculate some basic achievements based on current stats
    // For now, we'll use simplified calculations until we implement proper tracking
    const totalCoinsEarned = user.coins; // This should be tracked separately in the future

    return {
      level: user.level,
      experience: user.experience,
      currentCoins: user.coins,
      totalCoinsEarned: totalCoinsEarned,
      totalExplorations,
      uniqueItems,
      mythicItems,
      legendaryItems,
      rareItems,
      uncommonItems,
      commonItems,
      totalXP,
      zonesExplored,
      coinsSpent,
      rareFindsSingle,
      allRarities,
      earlyExploration,
      dailyExplorations,
      mythicDaily,
      perfectDay,
      zoneConqueror,
      dailyCoins,
      speedDemon,
      shopPurchases,
      nightExploration,
      quickExploration,
      helpOthers,
      giftCoins
    };
  }

  // Grant rewards for completed achievement
  static async grantRewards(userId, achievement) {
    try {
      // Grant coins
      if (achievement.rewardCoins > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { coins: { increment: achievement.rewardCoins } }
        });
      }

      // Grant XP
      if (achievement.rewardXP > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { experience: { increment: achievement.rewardXP } }
        });
      }

      // Grant title if specified
      if (achievement.rewardTitle) {
        const title = await prisma.title.findUnique({
          where: { name: achievement.rewardTitle }
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
      console.error('Error granting achievement rewards:', error);
    }
  }

  // Get user's achievements (including hidden ones)
  static async getUserAchievements(userId) {
    // Get regular achievements
    const regularAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: [
        { isCompleted: 'desc' },
        { achievement: { name: 'asc' } }
      ]
    });

    // Get hidden achievements and their discovery status
    const hiddenAchievements = await prisma.achievement.findMany({
      where: { isHidden: true },
      include: {
        hiddenDiscoveries: {
          where: { userId }
        }
      }
    });

    // Convert hidden achievements to user achievement format
    const hiddenUserAchievements = hiddenAchievements.map(achievement => {
      const isDiscovered = achievement.hiddenDiscoveries.length > 0;
      return {
        id: `hidden_${achievement.id}`,
        userId,
        achievementId: achievement.id,
        progress: isDiscovered ? 0 : 0, // Hidden achievements start at 0 progress when discovered
        isCompleted: false, // Hidden achievements are never "completed" in the regular sense
        completedAt: null,
        createdAt: isDiscovered ? achievement.hiddenDiscoveries[0].discoveredAt : new Date(),
        firstProgressAt: isDiscovered ? achievement.hiddenDiscoveries[0].discoveredAt : null,
        lastProgressAt: isDiscovered ? achievement.hiddenDiscoveries[0].discoveredAt : null,
        achievement: {
          ...achievement,
          isHidden: true,
          isDiscovered
        }
      };
    });

    // Combine regular and hidden achievements
    return [...regularAchievements, ...hiddenUserAchievements];
  }

  // Get user's titles
  static async getUserTitles(userId) {
    const userTitles = await prisma.userTitle.findMany({
      where: { userId },
      include: {
        title: true
      },
      orderBy: [
        { isEquipped: 'desc' },
        { title: { name: 'asc' } }
      ]
    });

    // Filter out titles with missing title data and clean up orphaned records
    const validTitles = [];
    for (const userTitle of userTitles) {
      if (userTitle.title && userTitle.title.name) {
        validTitles.push(userTitle);
      } else {
        // Clean up orphaned title record
        console.log(`Cleaning up orphaned title record for user ${userId}, titleId: ${userTitle.titleId}`);
        await prisma.userTitle.delete({
          where: { id: userTitle.id }
        });
      }
    }

    return validTitles;
  }

  // Get user's equipped title
  static async getEquippedTitle(userId) {
    const equippedTitle = await prisma.userTitle.findFirst({
      where: {
        userId,
        isEquipped: true
      },
      include: {
        title: true
      }
    });

    return equippedTitle?.title || null;
  }

  // Equip a title
  static async equipTitle(userId, titleId) {
    // Unequip all other titles
    await prisma.userTitle.updateMany({
      where: { userId },
      data: { isEquipped: false }
    });

    // Equip the selected title
    await prisma.userTitle.update({
      where: {
        userId_titleId: {
          userId,
          titleId
        }
      },
      data: { isEquipped: true }
    });
  }

  // Get all available achievements
  static async getAllAchievements() {
    return await prisma.achievement.findMany({
      orderBy: [
        { category: 'asc' },
        { requirementValue: 'asc' }
      ]
    });
  }

  // Get all available titles
  static async getAllTitles() {
    return await prisma.title.findMany({
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    });
  }
}

module.exports = AchievementSystem; 