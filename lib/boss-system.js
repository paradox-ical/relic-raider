const prisma = require('./database');

class BossSystem {
  // Boss spawn conditions and tracking
  static bossSpawnConditions = {
    'Ancient Guardian of the Jungle': {
      zone: 'Jungle Ruins',
      minLevel: 5,
      baseChance: 0.02, // 2% base chance
      timeRequirement: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 50,
      cooldown: 6 * 60 * 60 * 1000 // 6 hours cooldown after defeat
    },
    'Frost Giant King': {
      zone: 'Frozen Crypts',
      minLevel: 15,
      baseChance: 0.015, // 1.5% base chance
      timeRequirement: 48 * 60 * 60 * 1000, // 48 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 150,
      cooldown: 12 * 60 * 60 * 1000 // 12 hours cooldown
    },
    'Desert Pharaoh': {
      zone: 'Mirage Dunes',
      minLevel: 25,
      baseChance: 0.012, // 1.2% base chance
      timeRequirement: 72 * 60 * 60 * 1000, // 72 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 300,
      cooldown: 18 * 60 * 60 * 1000 // 18 hours cooldown
    },
    'Abyssal Leviathan': {
      zone: 'Sunken Temple',
      minLevel: 35,
      baseChance: 0.01, // 1% base chance
      timeRequirement: 96 * 60 * 60 * 1000, // 96 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 500,
      cooldown: 24 * 60 * 60 * 1000 // 24 hours cooldown
    },
    'Volcanic Titan': {
      zone: 'Volcanic Forge',
      minLevel: 45,
      baseChance: 0.008, // 0.8% base chance
      timeRequirement: 120 * 60 * 60 * 1000, // 120 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 750,
      cooldown: 30 * 60 * 60 * 1000 // 30 hours cooldown
    },
    'Shadow Lord': {
      zone: 'Twilight Moor',
      minLevel: 55,
      baseChance: 0.006, // 0.6% base chance
      timeRequirement: 144 * 60 * 60 * 1000, // 144 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 1000,
      cooldown: 36 * 60 * 60 * 1000 // 36 hours cooldown
    },
    'Storm Dragon': {
      zone: 'Skyreach Spires',
      minLevel: 65,
      baseChance: 0.005, // 0.5% base chance
      timeRequirement: 168 * 60 * 60 * 1000, // 168 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 1500,
      cooldown: 42 * 60 * 60 * 1000 // 42 hours cooldown
    },
    'Void Emperor': {
      zone: 'Obsidian Wastes',
      minLevel: 75,
      baseChance: 0.004, // 0.4% base chance
      timeRequirement: 192 * 60 * 60 * 1000, // 192 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 2000,
      cooldown: 48 * 60 * 60 * 1000 // 48 hours cooldown
    },
    'Celestial Archon': {
      zone: 'Astral Caverns',
      minLevel: 85,
      baseChance: 0.003, // 0.3% base chance
      timeRequirement: 216 * 60 * 60 * 1000, // 216 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 2500,
      cooldown: 54 * 60 * 60 * 1000 // 54 hours cooldown
    },
    'Divine Seraph': {
      zone: 'Ethereal Sanctum',
      minLevel: 95,
      baseChance: 0.002, // 0.2% base chance
      timeRequirement: 240 * 60 * 60 * 1000, // 240 hours
      achievementRequirement: 'beastsSlain',
      achievementThreshold: 3000,
      cooldown: 60 * 60 * 60 * 1000 // 60 hours cooldown
    }
  };

  // Check if a boss can spawn for a user in their current zone
  static async canBossSpawn(user, zoneName) {
    try {
      // Find the boss for this zone
      const bossName = this.getBossForZone(zoneName);
      if (!bossName) return { canSpawn: false, reason: 'No boss for this zone' };

      const bossConfig = this.bossSpawnConditions[bossName];
      if (!bossConfig) return { canSpawn: false, reason: 'Boss configuration not found' };

      // Check level requirement
      if (user.level < bossConfig.minLevel) {
        return { 
          canSpawn: false, 
          reason: `Level ${bossConfig.minLevel} required (you are level ${user.level})` 
        };
      }

      // Check achievement requirement
      if (user[bossConfig.achievementRequirement] < bossConfig.achievementThreshold) {
        return { 
          canSpawn: false, 
          reason: `${bossConfig.achievementThreshold} beasts must be slain (you have ${user[bossConfig.achievementRequirement]})` 
        };
      }

      // Check cooldown
      const lastBossDefeat = await this.getLastBossDefeat(user.id, bossName);
      if (lastBossDefeat) {
        const timeSinceDefeat = Date.now() - lastBossDefeat.defeatedAt.getTime();
        if (timeSinceDefeat < bossConfig.cooldown) {
          const remainingCooldown = bossConfig.cooldown - timeSinceDefeat;
          const hoursRemaining = Math.ceil(remainingCooldown / (60 * 60 * 1000));
          return { 
            canSpawn: false, 
            reason: `Boss on cooldown for ${hoursRemaining} more hours` 
          };
        }
      }

      // Check time requirement (account age)
      const accountAge = Date.now() - user.createdAt.getTime();
      if (accountAge < bossConfig.timeRequirement) {
        const daysRequired = Math.ceil(bossConfig.timeRequirement / (24 * 60 * 60 * 1000));
        return { 
          canSpawn: false, 
          reason: `Account must be ${daysRequired} days old` 
        };
      }

      return { canSpawn: true, bossName, bossConfig };
    } catch (error) {
      console.error('Error checking boss spawn:', error);
      return { canSpawn: false, reason: 'Error checking spawn conditions' };
    }
  }

  // Calculate boss spawn chance for a user
  static async calculateBossSpawnChance(user, zoneName) {
    const spawnCheck = await this.canBossSpawn(user, zoneName);
    if (!spawnCheck.canSpawn) return 0;

    const { bossConfig } = spawnCheck;
    let chance = bossConfig.baseChance;

    // Bonus chance based on achievements
    const achievementProgress = user[bossConfig.achievementRequirement] / bossConfig.achievementThreshold;
    if (achievementProgress > 1) {
      chance += (achievementProgress - 1) * 0.01; // +1% per achievement threshold exceeded
    }

    // Bonus chance based on level
    const levelBonus = Math.max(0, (user.level - bossConfig.minLevel) * 0.001); // +0.1% per level above minimum
    chance += levelBonus;

    // Cap at 5% maximum chance
    return Math.min(0.05, chance);
  }

  // Get the boss name for a specific zone
  static getBossForZone(zoneName) {
    const zoneBosses = {
      'Jungle Ruins': 'Ancient Guardian of the Jungle',
      'Frozen Crypts': 'Frost Giant King',
      'Mirage Dunes': 'Desert Pharaoh',
      'Sunken Temple': 'Abyssal Leviathan',
      'Volcanic Forge': 'Volcanic Titan',
      'Twilight Moor': 'Shadow Lord',
      'Skyreach Spires': 'Storm Dragon',
      'Obsidian Wastes': 'Void Emperor',
      'Astral Caverns': 'Celestial Archon',
      'Ethereal Sanctum': 'Divine Seraph'
    };
    return zoneBosses[zoneName];
  }

  // Get the last time a boss was defeated by a user
  static async getLastBossDefeat(userId, bossName) {
    try {
      const lastDefeat = await prisma.bossDefeat.findFirst({
        where: {
          userId: userId,
          bossName: bossName
        },
        orderBy: {
          defeatedAt: 'desc'
        }
      });
      return lastDefeat;
    } catch (error) {
      console.error('Error getting last boss defeat:', error);
      return null;
    }
  }

  // Record a boss defeat
  static async recordBossDefeat(userId, bossName) {
    try {
      await prisma.bossDefeat.create({
        data: {
          userId: userId,
          bossName: bossName,
          defeatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Error recording boss defeat:', error);
    }
  }

  // Get boss spawn info for a user
  static async getBossSpawnInfo(user, zoneName) {
    const spawnCheck = await this.canBossSpawn(user, zoneName);
    const spawnChance = await this.calculateBossSpawnChance(user, zoneName);
    const bossName = this.getBossForZone(zoneName);
    
    if (!bossName) {
      return {
        hasBoss: false,
        message: 'This zone has no boss'
      };
    }

    const bossConfig = this.bossSpawnConditions[bossName];
    const lastDefeat = await this.getLastBossDefeat(user.id, bossName);

    return {
      hasBoss: true,
      bossName,
      canSpawn: spawnCheck.canSpawn,
      reason: spawnCheck.reason,
      spawnChance: Math.round(spawnChance * 10000) / 100, // Convert to percentage
      requirements: {
        level: bossConfig.minLevel,
        beastsSlain: bossConfig.achievementThreshold,
        accountAge: Math.ceil(bossConfig.timeRequirement / (24 * 60 * 60 * 1000))
      },
      cooldown: lastDefeat ? {
        remaining: Math.max(0, bossConfig.cooldown - (Date.now() - lastDefeat.defeatedAt.getTime())),
        total: bossConfig.cooldown
      } : null
    };
  }

  // Check if a boss should spawn (called during exploration)
  static async shouldBossSpawn(user, zoneName) {
    const spawnChance = await this.calculateBossSpawnChance(user, zoneName);
    return Math.random() < spawnChance;
  }

  // Get boss beast data
  static async getBossBeast(bossName) {
    try {
      const boss = await prisma.beast.findFirst({
        where: {
          name: bossName
        },
        include: {
          beastLootDrops: {
            include: {
              item: true
            }
          }
        }
      });
      return boss;
    } catch (error) {
      console.error('Error getting boss beast:', error);
      return null;
    }
  }
}

module.exports = BossSystem; 