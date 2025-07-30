const prisma = require('./database');

class ServerBossSystem {
  // Server-wide boss spawn conditions
  static serverBossConditions = {
    'Ancient Guardian of the Jungle': {
      zone: 'Jungle Ruins',
      minLevel: 5,
      baseChance: 0.05, // 5% base chance
      serverBeastsRequired: 1000, // Total beasts slain in zone
      serverCooldown: 2 * 60 * 60 * 1000 // 2 hours server cooldown
    },
    'Frost Giant King': {
      zone: 'Frozen Crypts',
      minLevel: 15,
      baseChance: 0.04, // 4% base chance
      serverBeastsRequired: 2500,
      serverCooldown: 4 * 60 * 60 * 1000 // 4 hours
    },
    'Desert Pharaoh': {
      zone: 'Mirage Dunes',
      minLevel: 25,
      baseChance: 0.035, // 3.5% base chance
      serverBeastsRequired: 5000,
      serverCooldown: 6 * 60 * 60 * 1000 // 6 hours
    },
    'Abyssal Leviathan': {
      zone: 'Sunken Temple',
      minLevel: 35,
      baseChance: 0.03, // 3% base chance
      serverBeastsRequired: 10000,
      serverCooldown: 8 * 60 * 60 * 1000 // 8 hours
    },
    'Volcanic Titan': {
      zone: 'Volcanic Forge',
      minLevel: 45,
      baseChance: 0.025, // 2.5% base chance
      serverBeastsRequired: 20000,
      serverCooldown: 12 * 60 * 60 * 1000 // 12 hours
    },
    'Shadow Lord': {
      zone: 'Twilight Moor',
      minLevel: 55,
      baseChance: 0.02, // 2% base chance
      serverBeastsRequired: 35000,
      serverCooldown: 16 * 60 * 60 * 1000 // 16 hours
    },
    'Storm Dragon': {
      zone: 'Skyreach Spires',
      minLevel: 65,
      baseChance: 0.015, // 1.5% base chance
      serverBeastsRequired: 50000,
      serverCooldown: 20 * 60 * 60 * 1000 // 20 hours
    },
    'Void Emperor': {
      zone: 'Obsidian Wastes',
      minLevel: 75,
      baseChance: 0.012, // 1.2% base chance
      serverBeastsRequired: 75000,
      serverCooldown: 24 * 60 * 60 * 1000 // 24 hours
    },
    'Celestial Archon': {
      zone: 'Astral Caverns',
      minLevel: 85,
      baseChance: 0.01, // 1% base chance
      serverBeastsRequired: 100000,
      serverCooldown: 30 * 60 * 60 * 1000 // 30 hours
    },
    'Divine Seraph': {
      zone: 'Ethereal Sanctum',
      minLevel: 95,
      baseChance: 0.008, // 0.8% base chance
      serverBeastsRequired: 100000, // Reduced from 150,000 to 100,000
      serverCooldown: 36 * 60 * 60 * 1000 // 36 hours
    }
  };

  // Get server-wide beast kill count for a zone
  static async getServerBeastKills(guildId, zoneName) {
    try {
      const totalKills = await prisma.user.aggregate({
        where: {
          guildId: guildId,
          currentZone: zoneName
        },
        _sum: {
          beastsSlain: true
        }
      });
      
      return totalKills._sum.beastsSlain || 0;
    } catch (error) {
      console.error('Error getting server beast kills:', error);
      return 0;
    }
  }



  // Check server-wide boss spawn conditions
  static async canBossSpawn(guildId, zoneName, user) {
    try {
      const bossName = this.getBossForZone(zoneName);
      if (!bossName) return { canSpawn: false, reason: 'No boss for this zone' };

      const bossConfig = this.serverBossConditions[bossName];
      if (!bossConfig) return { canSpawn: false, reason: 'Boss configuration not found' };

      // Check individual level requirement
      if (user.level < bossConfig.minLevel) {
        return { 
          canSpawn: false, 
          reason: `Level ${bossConfig.minLevel} required (you are level ${user.level})` 
        };
      }

      // Check server-wide beast kill requirement
      const serverBeastKills = await this.getServerBeastKills(guildId, zoneName);
      if (serverBeastKills < bossConfig.serverBeastsRequired) {
        return { 
          canSpawn: false, 
          reason: `${bossConfig.serverBeastsRequired.toLocaleString()} total beasts must be slain in ${zoneName} (server has ${serverBeastKills.toLocaleString()})` 
        };
      }



      // Check server-wide cooldown
      const lastBossDefeat = await this.getLastServerBossDefeat(guildId, bossName);
      if (lastBossDefeat) {
        const timeSinceDefeat = Date.now() - lastBossDefeat.defeatedAt.getTime();
        if (timeSinceDefeat < bossConfig.serverCooldown) {
          const remainingCooldown = bossConfig.serverCooldown - timeSinceDefeat;
          const hoursRemaining = Math.ceil(remainingCooldown / (60 * 60 * 1000));
          return { 
            canSpawn: false, 
            reason: `Boss on server cooldown for ${hoursRemaining} more hours` 
          };
        }
      }

      return { canSpawn: true, bossName, bossConfig, serverBeastKills };
    } catch (error) {
      console.error('Error checking server boss spawn:', error);
      return { canSpawn: false, reason: 'Error checking spawn conditions' };
    }
  }

  // Calculate server-wide boss spawn chance
  static async calculateServerBossSpawnChance(guildId, zoneName, user) {
    const spawnCheck = await this.canBossSpawn(guildId, zoneName, user);
    if (!spawnCheck.canSpawn) return 0;

    const { bossConfig, serverBeastKills } = spawnCheck;
    let chance = bossConfig.baseChance;

    // Bonus chance based on server progress
    const progressRatio = serverBeastKills / bossConfig.serverBeastsRequired;
    if (progressRatio > 1) {
      chance += (progressRatio - 1) * 0.02; // +2% per threshold exceeded
    }

    // Bonus chance based on individual level
    const levelBonus = Math.max(0, (user.level - bossConfig.minLevel) * 0.002); // +0.2% per level above minimum
    chance += levelBonus;

    // Cap at 10% maximum chance
    return Math.min(0.10, chance);
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

  // Get the last time a boss was defeated on the server
  static async getLastServerBossDefeat(guildId, bossName) {
    try {
      const lastDefeat = await prisma.serverBossDefeat.findFirst({
        where: {
          guildId: guildId,
          bossName: bossName
        },
        orderBy: {
          defeatedAt: 'desc'
        }
      });
      return lastDefeat;
    } catch (error) {
      console.error('Error getting last server boss defeat:', error);
      return null;
    }
  }

  // Record a server boss defeat (or victory)
  static async recordServerBossDefeat(guildId, bossName, defeatedByUserId, bossWon = false) {
    try {
      await prisma.serverBossDefeat.create({
        data: {
          guildId: guildId,
          bossName: bossName,
          defeatedByUserId: defeatedByUserId,
          defeatedAt: new Date()
        }
      });
      
      // Store notification data for the client to send
      if (!global.serverBossNotifications) {
        global.serverBossNotifications = new Map();
      }
      
      const bossConfig = this.serverBossConditions[bossName];
      const cooldownHours = Math.ceil(bossConfig.serverCooldown / (60 * 60 * 1000));
      
      global.serverBossNotifications.set(guildId, {
        bossName: bossName,
        zone: bossConfig.zone,
        defeatedByUserId: defeatedByUserId,
        cooldownHours: cooldownHours,
        timestamp: new Date(),
        bossWon: bossWon
      });
      
    } catch (error) {
      console.error('Error recording server boss defeat:', error);
    }
  }
  
  // Get server boss notification (called by client)
  static getServerBossNotification(guildId) {
    if (!global.serverBossNotifications) return null;
    
    const notification = global.serverBossNotifications.get(guildId);
    if (notification) {
      // Remove the notification after it's been retrieved
      global.serverBossNotifications.delete(guildId);
      return notification;
    }
    return null;
  }

  // Get server boss spawn info
  static async getServerBossSpawnInfo(guildId, zoneName, user) {
    const spawnCheck = await this.canBossSpawn(guildId, zoneName, user);
    const spawnChance = await this.calculateServerBossSpawnChance(guildId, zoneName, user);
    const bossName = this.getBossForZone(zoneName);
    
    if (!bossName) {
      return {
        hasBoss: false,
        message: 'This zone has no boss'
      };
    }

    const bossConfig = this.serverBossConditions[bossName];
    const lastDefeat = await this.getLastServerBossDefeat(guildId, bossName);
    const serverBeastKills = await this.getServerBeastKills(guildId, zoneName);

    return {
      hasBoss: true,
      bossName,
      canSpawn: spawnCheck.canSpawn,
      reason: spawnCheck.reason,
      spawnChance: Math.round(spawnChance * 10000) / 100, // Convert to percentage
      requirements: {
        level: bossConfig.minLevel,
        serverBeastsRequired: bossConfig.serverBeastsRequired
      },
      serverProgress: {
        beastKills: serverBeastKills,
        progressPercent: Math.min(100, (serverBeastKills / bossConfig.serverBeastsRequired) * 100)
      },
      cooldown: lastDefeat ? {
        remaining: Math.max(0, bossConfig.serverCooldown - (Date.now() - lastDefeat.defeatedAt.getTime())),
        total: bossConfig.serverCooldown
      } : null
    };
  }

  // Check if a boss should spawn (called during exploration)
  static async shouldServerBossSpawn(guildId, zoneName, user) {
    const spawnChance = await this.calculateServerBossSpawnChance(guildId, zoneName, user);
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

module.exports = ServerBossSystem; 