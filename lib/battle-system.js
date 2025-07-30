const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BattleSystem {
  // Boss names for special handling
  static BOSS_NAMES = [
    'Ancient Guardian of the Jungle',
    'Frost Giant King', 
    'Desert Pharaoh',
    'Abyssal Leviathan',
    'Volcanic Titan',
    'Shadow Lord',
    'Storm Dragon',
    'Void Emperor',
    'Celestial Archon',
    'Divine Seraph'
  ];

  // Get a random beast for a specific region
  static async getRandomBeastForRegion(regionName, user = null) {
    try {
      // Check for boss spawn first if user is provided
      if (user) {
        const BossSystem = require('./boss-system');
        const shouldBossSpawn = await BossSystem.shouldBossSpawn(user, regionName);
        
        if (shouldBossSpawn) {
          const bossName = BossSystem.getBossForZone(regionName);
          if (bossName) {
            const bossBeast = await BossSystem.getBossBeast(bossName);
            if (bossBeast) {
              console.log(`🎯 BOSS SPAWN: ${bossName} for user ${user.username} in ${regionName}`);
              return bossBeast;
            }
          }
        }
      }

      // Extract the theme from the region name (e.g., "Jungle Ruins" -> "Aztec")
      const regionThemes = {
        'Jungle Ruins': 'Aztec',
        'Frozen Crypts': 'Norse',
        'Mirage Dunes': 'Egyptian',
        'Sunken Temple': 'Atlantean',
        'Volcanic Forge': 'Dwarven',
        'Twilight Moor': 'Gothic',
        'Skyreach Spires': 'Cloud Kingdom',
        'Obsidian Wastes': 'Dark Realm',
        'Astral Caverns': 'Cosmic',
        'Ethereal Sanctum': 'Divine'
      };

      const theme = regionThemes[regionName];
      if (!theme) {
        throw new Error(`Unknown region: ${regionName}`);
      }

      // Get all beasts for this theme (excluding bosses for normal spawns)
      const beasts = await prisma.beast.findMany({
        where: {
          name: {
            contains: theme
          },
          NOT: {
            name: {
              contains: 'Colossus'
            }
          }
        },
        include: {
          beastLootDrops: {
            include: {
              item: true
            }
          }
        }
      });

      if (beasts.length === 0) {
        throw new Error(`No beasts found for region: ${regionName}`);
      }

      // Weight selection by rarity (higher rarity = lower chance)
      const rarityWeights = {
        'UNCOMMON': 0.4,   // 40% chance
        'RARE': 0.3,       // 30% chance
        'LEGENDARY': 0.2,  // 20% chance
        'MYTHIC': 0.1      // 10% chance
      };

      // Create weighted array
      const weightedBeasts = [];
      beasts.forEach(beast => {
        const weight = rarityWeights[beast.rarity] || 0.1;
        const count = Math.floor(weight * 100); // Convert to count for weighted selection
        for (let i = 0; i < count; i++) {
          weightedBeasts.push(beast);
        }
      });

      // Randomly select a beast
      const randomIndex = Math.floor(Math.random() * weightedBeasts.length);
      return weightedBeasts[randomIndex];
    } catch (error) {
      console.error('Error getting random beast:', error);
      return null;
    }
  }

  // Calculate player stats (base + level bonuses + skills + equipment)
  static async calculatePlayerStats(user) {
    const SkillSystem = require('./skill-system');
    const EquipmentSystem = require('./equipment-system');
    
    // Get comprehensive stats including skills and equipment
    const totalStats = await SkillSystem.calculateUserStats(user.id);
    
    if (!totalStats) {
      // Fallback to basic calculation if skill system fails
      const level = user.level;
      const hp = user.baseHp + (level * 10);
      const attack = user.baseAttack + (level * 2);
      const defense = user.baseDefense + (level * 1);
      return { hp, attack, defense };
    }
    
    return totalStats.total;
  }

  // Calculate beast stats (base + level scaling)
  static calculateBeastStats(beast, playerLevel, userZone = 'Jungle Ruins') {
    // Zone definitions with level ranges and middle levels
    const zones = {
      'Jungle Ruins': { minLevel: 1, maxLevel: 10, middleLevel: 5.5 },
      'Frozen Crypt': { minLevel: 11, maxLevel: 20, middleLevel: 15.5 },
      'Mirage Dunes': { minLevel: 21, maxLevel: 30, middleLevel: 25.5 },
      'Sunken Temple': { minLevel: 31, maxLevel: 40, middleLevel: 35.5 },
      'Volcanic Forge': { minLevel: 41, maxLevel: 50, middleLevel: 45.5 },
      'Twilight Moor': { minLevel: 51, maxLevel: 60, middleLevel: 55.5 },
      'Skyreach Spires': { minLevel: 61, maxLevel: 70, middleLevel: 65.5 },
      'Obsidian Wastes': { minLevel: 71, maxLevel: 80, middleLevel: 75.5 },
      'Astral Caverns': { minLevel: 81, maxLevel: 90, middleLevel: 85.5 },
      'Ethereal Sanctum': { minLevel: 91, maxLevel: 100, middleLevel: 95.5 }
    };

    const zone = zones[userZone] || zones['Jungle Ruins'];
    
    // Base level multiplier (10% increase per level)
    const baseLevelMultiplier = 1 + (playerLevel * 0.1);
    
    // RNG modifier (0.2x - 2.0x)
    const rngModifier = 0.2 + (Math.random() * 1.8);
    
    // Sparkle system: 50% chance if player is above zone middle level
    let sparkleModifier = 0;
    let isSparkling = false;
    
    if (playerLevel > zone.middleLevel) {
      if (Math.random() < 0.5) { // 50% chance
        sparkleModifier = 0.5; // +50% level modifier
        isSparkling = true;
      }
    }
    
    // Final level multiplier
    const finalLevelMultiplier = baseLevelMultiplier * rngModifier + sparkleModifier;
    
    // Calculate stats
    const hp = Math.floor(beast.baseHp * finalLevelMultiplier);
    const attack = Math.floor(beast.baseAttack * finalLevelMultiplier);
    const defense = Math.floor(beast.baseDefense * finalLevelMultiplier);

    return { 
      hp, 
      attack, 
      defense, 
      isSparkling,
      levelMultiplier: finalLevelMultiplier,
      rngModifier,
      sparkleModifier
    };
  }

  // Initialize a new battle (called when fight starts)
  static async initializeBattle(user, beast, storedBeastStats = null) {
    const playerStats = await this.calculatePlayerStats(user);
    const beastStats = storedBeastStats || this.calculateBeastStats(beast, user.level, user.currentZone);
    
    // Get user's passive skills for battle effects
    const SkillSystem = require('./skill-system');
    const skillEffects = await SkillSystem.getBattleSkillEffects(user.id);

    // Get weapon effects for battle
    const WeaponEffectsSystem = require('./weapon-effects-system');
    const weaponEffects = await WeaponEffectsSystem.getWeaponEffects(user.id);

    return {
      userId: user.id, // Add userId for skill lookups
      playerHp: playerStats.hp,
      beastHp: beastStats.hp,
      playerMaxHp: playerStats.hp,
      beastMaxHp: beastStats.hp,
      playerStats,
      beastStats,
      skillEffects, // Add passive skill effects
      weaponEffects, // Add weapon effects
      beastName: beast.name, // Add beast name for passive skill checks
      battleLog: [],
      currentRound: 1,
      isPlayerTurn: true,
      isComplete: false,
      playerWon: false,
      beastWon: false,
      // Player status effects
      playerStatusEffects: {}, // Track player status effects like defense boosts
      // Action cooldowns and resources
      actionCooldowns: {
        special: 0,  // Special attack cooldown
        defend: 0    // Defend cooldown
      },
      energy: 100,   // Energy resource for special actions
      consecutiveDefends: 0, // Track consecutive defends
      beastRage: 0,  // Beast gets stronger over time
      ultimateProgress: 0,   // Player ultimate ability progress (0-100)
      ultimateReady: false   // Whether ultimate is ready to use
    };
  }

  // Execute a player action
  static async executePlayerAction(battleState, action) {
    const { playerStats, beastStats } = battleState;
    
    // Initialize skill cooldowns if not exists
    if (!battleState.skillCooldowns) {
      battleState.skillCooldowns = {};
    }
    
    // Reset consecutive defends if not defending
    if (action !== 'defend' && !action.startsWith('skill_')) {
      battleState.consecutiveDefends = 0;
    }
    
    // Reduce cooldowns
    if (battleState.actionCooldowns.special > 0) battleState.actionCooldowns.special--;
    if (battleState.actionCooldowns.defend > 0) battleState.actionCooldowns.defend--;
    
    // Reduce skill cooldowns
    for (const skillId in battleState.skillCooldowns) {
      if (battleState.skillCooldowns[skillId] > 0) {
        battleState.skillCooldowns[skillId]--;
      }
    }
    
    // Regenerate energy (5 per round)
    battleState.energy = Math.min(100, battleState.energy + 5);
    
    // Build ultimate progress (10 per round)
    battleState.ultimateProgress = Math.min(100, battleState.ultimateProgress + 10);
    if (battleState.ultimateProgress >= 100 && !battleState.ultimateReady) {
      battleState.ultimateReady = true;
    }
    
    // Process player status effects
    if (battleState.playerStatusEffects) {
      for (const [effectType, effect] of Object.entries(battleState.playerStatusEffects)) {
        if (effect.duration > 0) {
          effect.duration--;
          
          // Remove expired effects
          if (effect.duration <= 0) {
            // Restore original stats
            if (effectType === 'defenseBoost') {
              battleState.playerStats.defense = effect.originalDefense;
            }
            delete battleState.playerStatusEffects[effectType];
          }
        }
      }
    }
    
    // Handle equipped skills
    if (action.startsWith('skill_')) {
      const skillId = action.replace('skill_', '');
      return await this.executePlayerSkill(battleState, skillId);
    }
    
    switch (action) {
      case 'attack':
        return this.executePlayerAttack(battleState);
      case 'defend':
        return this.executePlayerDefend(battleState);
      case 'special':
        return this.executePlayerSpecial(battleState);
      case 'ultimate':
        return this.executePlayerUltimate(battleState);
      default:
        return this.executePlayerAttack(battleState);
    }
  }

  // Execute player attack
  static executePlayerAttack(battleState) {
    // Apply passive skill effects for offensive actions
    const PassiveSkillSystem = require('./passive-skill-system');
    const passiveEffects = PassiveSkillSystem.applyPassiveEffects(battleState, 'attack');
    
    // Process status effects at the start of the round
    const WeaponEffectsSystem = require('./weapon-effects-system');
    const statusEffects = WeaponEffectsSystem.processStatusEffects(battleState);
    
    const attackResult = this.calculateAttack(battleState.playerStats.attack, battleState.beastStats.defense, 'player');
    
    // Apply weapon effects to the attack
    const weaponAttackResult = WeaponEffectsSystem.applyWeaponEffectsToAttack(battleState, attackResult);
    
    // Apply bonus damage from passive skills
    const totalDamage = weaponAttackResult.damage + passiveEffects.damageBonus;
    
    if (weaponAttackResult.dodged) {
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerDodged: true,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
    } else {
      battleState.beastHp = Math.max(0, battleState.beastHp - totalDamage);
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerDamage: totalDamage,
        playerCritical: weaponAttackResult.critical,
        bonusDamage: passiveEffects.damageBonus,
        passiveEffects: passiveEffects.messages,
        weaponEffects: weaponAttackResult.effectMessages,
        statusEffects: statusEffects.messages,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
    }

    // Check if beast is defeated
    if (battleState.beastHp <= 0) {
      battleState.isComplete = true;
      battleState.playerWon = true;
      return battleState;
    }

    // Beast's turn
    return this.executeBeastTurn(battleState);
  }

  // Execute player defend (reduces incoming damage with chance to stun)
  static executePlayerDefend(battleState) {
    // Check cooldown
    if (battleState.actionCooldowns.defend > 0) {
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerDefendBlocked: true,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
      return this.executeBeastTurn(battleState);
    }
    
    // Increment consecutive defends
    battleState.consecutiveDefends++;
    
    // Set cooldown based on consecutive defends
    battleState.actionCooldowns.defend = Math.min(3, battleState.consecutiveDefends);
    
    // Check for stun (15% chance, increases with consecutive defends)
    const stunChance = Math.min(0.35, 0.15 + (battleState.consecutiveDefends * 0.05)); // 15% -> 20% -> 25% -> 30% -> 35%
    const stunned = Math.random() < stunChance;
    
    if (stunned) {
      // Initialize stun duration if not already set
      if (!battleState.beastStunned) {
        battleState.beastStunned = 2; // Stun for 2 rounds
      }
    }
    
    // Apply passive skill effects for defensive actions
    const PassiveSkillSystem = require('./passive-skill-system');
    const passiveEffects = PassiveSkillSystem.applyPassiveEffects(battleState, 'defend');
    
    // Apply healing to player HP
    if (passiveEffects.healing > 0) {
      battleState.playerHp = Math.min(battleState.playerMaxHp, battleState.playerHp + passiveEffects.healing);
    }
    
    // Player defends - no attack this turn, but beast damage is reduced
    battleState.battleLog.push({
      round: battleState.currentRound,
      playerDefended: true,
      playerStunned: stunned,
      passiveHealing: passiveEffects.healing,
      passiveEffects: passiveEffects.messages,
      beastHp: Math.max(0, battleState.beastHp),
      playerHp: battleState.playerHp
    });

    // Beast's turn with reduced damage (diminishing returns)
    const damageReduction = Math.max(0.3, 0.8 - (battleState.consecutiveDefends * 0.1)); // 80% -> 70% -> 60% -> 50% -> 30%
    return this.executeBeastTurn(battleState, true, damageReduction);
  }

  // Execute player special attack (higher damage, but less accurate)
  static executePlayerSpecial(battleState) {
    // Check cooldown and energy
    if (battleState.actionCooldowns.special > 0) {
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerSpecialBlocked: true,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
      return this.executeBeastTurn(battleState);
    }
    
    if (battleState.energy < 30) {
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerSpecialBlocked: true,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
      return this.executeBeastTurn(battleState);
    }
    
    // Consume energy and set cooldown
    battleState.energy -= 30;
    battleState.actionCooldowns.special = 2; // 2 round cooldown
    
    const baseDamage = Math.max(1, battleState.playerStats.attack - battleState.beastStats.defense);
    
    // Special attacks always hit if beast is stunned
    const accuracy = battleState.beastStunned && battleState.beastStunned > 0 ? 1.0 : 0.65;
    
    if (Math.random() < accuracy) {
      // Random damage multiplier between 3-5x
      const damageMultiplier = 3 + Math.random() * 2; // 3.0 to 5.0
      const damage = Math.floor(baseDamage * damageMultiplier + Math.random() * 5);
      battleState.beastHp = Math.max(0, battleState.beastHp - damage);
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerSpecial: true,
        playerDamage: damage,
        playerDamageMultiplier: Math.round(damageMultiplier * 10) / 10, // Round to 1 decimal
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
    } else {
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerMissed: true,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
    }

    // Check if beast is defeated
    if (battleState.beastHp <= 0) {
      battleState.isComplete = true;
      battleState.playerWon = true;
      return battleState;
    }

    // Beast's turn
    return this.executeBeastTurn(battleState);
  }

  // Execute beast's turn
  static executeBeastTurn(battleState, playerDefended = false, damageReduction = 0.5) {
    // Handle beast stun
    if (battleState.beastStunned && battleState.beastStunned > 0) {
      battleState.beastStunned--;
      battleState.battleLog.push({
        round: battleState.currentRound,
        beastStunned: true,
        beastStunRemaining: battleState.beastStunned,
        playerHp: Math.max(0, battleState.playerHp),
        beastHp: Math.max(0, battleState.beastHp)
      });
      
      // Round complete, increment round counter
      battleState.currentRound++;
      return battleState;
    }
    
    // Increase beast rage over time (beasts get stronger in longer battles)
    battleState.beastRage = Math.min(0.5, battleState.currentRound * 0.05); // Max 50% bonus
    
    // Apply stealth effects to reduce beast accuracy
    const WeaponEffectsSystem = require('./weapon-effects-system');
    WeaponEffectsSystem.applyStealthEffects(battleState);

    // Calculate beast attack with rage bonus
    const rageBonus = 1 + battleState.beastRage;
    const adjustedAttack = Math.floor(battleState.beastStats.attack * rageBonus);
    
    const beastAttackResult = this.calculateAttack(adjustedAttack, battleState.playerStats.defense, 'beast');
    
    if (beastAttackResult.dodged) {
      battleState.battleLog.push({
        round: battleState.currentRound,
        beastDodged: true,
        playerHp: Math.max(0, battleState.playerHp),
        beastHp: Math.max(0, battleState.beastHp)
      });
    } else {
      let finalDamage = beastAttackResult.damage;
      if (playerDefended) {
        finalDamage = Math.floor(finalDamage * damageReduction);
      }
      
      // Apply weapon effects to defense
      const weaponDefenseResult = WeaponEffectsSystem.applyWeaponEffectsToDefense(battleState, finalDamage);
      finalDamage = weaponDefenseResult.damage;
      
      // Apply passive skill effects for damage taken
      const PassiveSkillSystem = require('./passive-skill-system');
      const passiveEffects = PassiveSkillSystem.applyPassiveEffects(battleState, 'damage_taken');
      
      // Apply damage reduction from passive skills
      if (passiveEffects.damageReduction > 0) {
        finalDamage = Math.floor(finalDamage * (1 - passiveEffects.damageReduction));
      }
      
      battleState.playerHp = Math.max(0, battleState.playerHp - finalDamage);
      battleState.battleLog.push({
        round: battleState.currentRound,
        beastDamage: finalDamage,
        beastCritical: beastAttackResult.critical,
        playerDefended,
        beastRage: battleState.beastRage > 0,
        passiveEffects: passiveEffects.messages,
        weaponDefenseEffects: weaponDefenseResult.effectMessages,
        playerHp: Math.max(0, battleState.playerHp),
        beastHp: Math.max(0, battleState.beastHp)
      });
    }

    // Check if player is defeated
    if (battleState.playerHp <= 0) {
      battleState.isComplete = true;
      battleState.beastWon = true;
      return battleState;
    }

    // Round complete, increment round counter
    battleState.currentRound++;
    return battleState;
  }

  // Execute player ultimate ability
  static executePlayerUltimate(battleState) {
    // Check if ultimate is ready
    if (!battleState.ultimateReady) {
      battleState.battleLog.push({
        round: battleState.currentRound,
        playerUltimateBlocked: true,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp
      });
      return this.executeBeastTurn(battleState);
    }
    
    // Consume ultimate charge
    battleState.ultimateProgress = 0;
    battleState.ultimateReady = false;
    
    // Calculate ultimate damage (5-8x base damage)
    const baseDamage = Math.max(1, battleState.playerStats.attack - battleState.beastStats.defense);
    const damageMultiplier = 5 + Math.random() * 3; // 5.0 to 8.0
    const damage = Math.floor(baseDamage * damageMultiplier + Math.random() * 10);
    
    battleState.beastHp = Math.max(0, battleState.beastHp - damage);
    battleState.battleLog.push({
      round: battleState.currentRound,
      playerUltimate: true,
      playerDamage: damage,
      playerDamageMultiplier: Math.round(damageMultiplier * 10) / 10,
      beastHp: Math.max(0, battleState.beastHp),
      playerHp: battleState.playerHp
    });

    // Check if beast is defeated
    if (battleState.beastHp <= 0) {
      battleState.isComplete = true;
      battleState.playerWon = true;
      return battleState;
    }

    // Beast's turn
    return this.executeBeastTurn(battleState);
  }

  // Execute player equipped skill
  static async executePlayerSkill(battleState, skillId) {
    try {
      // Get the skill information
      const skill = await prisma.skill.findUnique({
        where: { id: skillId }
      });

      if (!skill) {
        console.error('Skill not found:', skillId);
        return this.executePlayerAttack(battleState);
      }

      // Check cooldown
      if (battleState.skillCooldowns[skillId] > 0) {
        battleState.battleLog.push({
          round: battleState.currentRound,
          playerSkillBlocked: true,
          skillName: skill.name,
          beastHp: Math.max(0, battleState.beastHp),
          playerHp: battleState.playerHp
        });
        return this.executeBeastTurn(battleState);
      }

      // Check energy cost for active skills
      if (skill.type === 'ACTIVE' && battleState.energy < 30) {
        battleState.battleLog.push({
          round: battleState.currentRound,
          playerSkillNoEnergy: true,
          skillName: skill.name,
          beastHp: Math.max(0, battleState.beastHp),
          playerHp: battleState.playerHp
        });
        return this.executeBeastTurn(battleState);
      }

      // Check ultimate charge for ultimate skills
      if (skill.type === 'ULTIMATE' && !battleState.ultimateReady) {
        battleState.battleLog.push({
          round: battleState.currentRound,
          playerUltimateBlocked: true,
          beastHp: Math.max(0, battleState.beastHp),
          playerHp: battleState.playerHp
        });
        return this.executeBeastTurn(battleState);
      }

      // Consume resources
      if (skill.type === 'ACTIVE') {
        battleState.energy = Math.max(0, battleState.energy - 30);
      } else if (skill.type === 'ULTIMATE') {
        battleState.ultimateProgress = 0;
        battleState.ultimateReady = false;
      }

      // Get user's skill level for proper effect calculation
      const userSkill = await prisma.userSkill.findFirst({
        where: { 
          userId: battleState.userId,
          skillId: skillId 
        }
      });
      
      const skillLevel = userSkill ? userSkill.level : 1;
      const skillEffect = skill.baseEffect + (skill.effectPerLevel * (skillLevel - 1));
      

      
      // Calculate skill effects based on skill type
      let playerHealing = 0;
      let damage = 0;
      let statusEffectApplied = false;
      
      if (skill.name.includes('Heal') || skill.name.includes('Restore') || skill.name.includes('Sunfire')) {
        // Healing skill - use calculated effect as percentage
        const healingPercentage = skillEffect; // e.g., 15 for 15%
        playerHealing = Math.floor(battleState.playerMaxHp * (healingPercentage / 100));
        battleState.playerHp = Math.min(battleState.playerMaxHp, battleState.playerHp + playerHealing);
        
      } else if (skill.name.includes('Beacon') || skill.name.includes('Boost') || skill.name.includes('Defense') ||
                 skill.name.includes('Ward') || skill.name.includes('Shield') || skill.name.includes('Seal') ||
                 skill.name.includes('Burn') || skill.name.includes('Poison') || skill.name.includes('Bleed') ||
                 skill.name.includes('Freeze') || skill.name.includes('Stun') || skill.name.includes('Slow') ||
                 skill.description.includes('boost') || skill.description.includes('reduce') || skill.description.includes('apply') ||
                 skill.description.includes('burn') || skill.description.includes('poison') || skill.description.includes('bleed') ||
                 skill.description.includes('freeze') || skill.description.includes('stun') || skill.description.includes('slow')) {
        
        // Status effect skill - determine type and apply effect
        let statusEffectType = 'defenseBoost'; // Default
        let duration = 3; // Default duration
        let statusEffectApplied = false;
        
        // Determine effect type based on skill name and description
        const skillName = skill.name.toLowerCase();
        const skillDesc = skill.description.toLowerCase();
        
        if (skillName.includes('beacon') || skillName.includes('ward') || skillDesc.includes('defense') || skillDesc.includes('defence')) {
          // Defense boost
          statusEffectType = 'defenseBoost';
          battleState.playerStatusEffects.defenseBoost = {
            value: skillEffect,
            duration: duration,
            originalDefense: battleState.playerStats.defense
          };
          battleState.playerStats.defense = Math.floor(battleState.playerStats.defense * (1 + skillEffect / 100));
          statusEffectApplied = true;
          
        } else if (skillName.includes('burn') || skillName.includes('flame') || skillDesc.includes('burn')) {
          // Burn effect on enemy
          statusEffectType = 'burn';
          if (!battleState.beastStatusEffects) battleState.beastStatusEffects = {};
          battleState.beastStatusEffects.burn = {
            damage: Math.floor(skillEffect * 2), // Burn damage per turn
            duration: duration,
            remainingTurns: duration
          };
          statusEffectApplied = true;
          
        } else if (skillName.includes('poison') || skillName.includes('toxic') || skillDesc.includes('poison')) {
          // Poison effect on enemy
          statusEffectType = 'poison';
          if (!battleState.beastStatusEffects) battleState.beastStatusEffects = {};
          battleState.beastStatusEffects.poison = {
            damage: Math.floor(skillEffect * 1.5), // Poison damage per turn
            duration: duration,
            remainingTurns: duration
          };
          statusEffectApplied = true;
          
        } else if (skillName.includes('bleed') || skillDesc.includes('bleed')) {
          // Bleed effect on enemy
          statusEffectType = 'bleed';
          if (!battleState.beastStatusEffects) battleState.beastStatusEffects = {};
          battleState.beastStatusEffects.bleed = {
            damage: Math.floor(skillEffect * 1.2), // Bleed damage per turn
            duration: duration,
            remainingTurns: duration
          };
          statusEffectApplied = true;
          
        } else if (skillName.includes('freeze') || skillName.includes('frost') || skillDesc.includes('freeze')) {
          // Freeze effect on enemy
          statusEffectType = 'freeze';
          if (!battleState.beastStatusEffects) battleState.beastStatusEffects = {};
          battleState.beastStatusEffects.freeze = {
            duration: 1, // Freeze typically lasts 1 turn
            remainingTurns: 1
          };
          statusEffectApplied = true;
          
        } else if (skillName.includes('stun') || skillDesc.includes('stun')) {
          // Stun effect on enemy
          statusEffectType = 'stun';
          if (!battleState.beastStatusEffects) battleState.beastStatusEffects = {};
          battleState.beastStatusEffects.stun = {
            duration: 1, // Stun typically lasts 1 turn
            remainingTurns: 1
          };
          statusEffectApplied = true;
          
        } else if (skillName.includes('slow') || skillDesc.includes('slow')) {
          // Slow effect on enemy
          statusEffectType = 'slow';
          if (!battleState.beastStatusEffects) battleState.beastStatusEffects = {};
          battleState.beastStatusEffects.slow = {
            value: skillEffect, // Slow percentage
            duration: duration,
            remainingTurns: duration
          };
          statusEffectApplied = true;
          
        } else {
          // Generic status effect
          statusEffectType = 'generic';
          statusEffectApplied = true;
        }
        
        if (statusEffectApplied) {
          // Store the status effect info for logging
          battleState.lastStatusEffect = {
            type: statusEffectType,
            value: skillEffect,
            duration: duration
          };
        }
        
      } else {
        // Damage skill - use skillEffect as percentage bonus
        const baseDamage = Math.max(1, battleState.playerStats.attack - battleState.beastStats.defense);
        const damageBonus = Math.floor(baseDamage * (skillEffect / 100)); // Convert percentage to bonus
        damage = Math.floor(baseDamage + damageBonus + Math.random() * 5);
        battleState.beastHp = Math.max(0, battleState.beastHp - damage);
      }

      // Set cooldown
      battleState.skillCooldowns[skillId] = skill.cooldown || 2;

      // Process status effects at the start of the round
      const WeaponEffectsSystem = require('./weapon-effects-system');
      const statusEffects = WeaponEffectsSystem.processStatusEffects(battleState);
      
      // Log the skill use
      const logEntry = {
        round: battleState.currentRound,
        playerSkill: true,
        skillName: skill.name,
        skillType: skill.type,
        beastHp: Math.max(0, battleState.beastHp),
        playerHp: battleState.playerHp,
        statusEffects: statusEffects.messages
      };
      
      // Add relevant fields based on skill type
      if (skill.name.includes('Heal') || skill.name.includes('Restore') || skill.name.includes('Sunfire')) {
        logEntry.playerHealing = playerHealing;
      } else if (statusEffectApplied) {
        logEntry.playerStatusEffect = true;
        logEntry.statusEffectType = battleState.lastStatusEffect.type;
        logEntry.statusEffectValue = battleState.lastStatusEffect.value;
        logEntry.statusEffectDuration = battleState.lastStatusEffect.duration;
      } else {
        logEntry.playerDamage = damage;
        logEntry.skillEffect = skillEffect;
      }
      
      // Add beast status effects if any are active
      if (battleState.beastStatusEffects && Object.keys(battleState.beastStatusEffects).length > 0) {
        logEntry.beastStatusEffects = { ...battleState.beastStatusEffects };
      }
      
      battleState.battleLog.push(logEntry);

      // Check if beast is defeated
      if (battleState.beastHp <= 0) {
        battleState.isComplete = true;
        battleState.playerWon = true;
        return battleState;
      }

      // Beast's turn
      return this.executeBeastTurn(battleState);

    } catch (error) {
      console.error('Error executing player skill:', error);
      return this.executePlayerAttack(battleState);
    }
  }

  // Get available player actions
  static async getPlayerActions(userId) {
    try {
      // Get user's equipped skills
      const equippedSkills = await prisma.equippedSkill.findMany({
        where: { userId: userId },
        include: { skill: true },
        orderBy: { slot: 'asc' }
      });

      // Get user's learned skills for level information
      const userSkills = await prisma.userSkill.findMany({
        where: { userId: userId },
        include: { skill: true }
      });

      const actions = [
        { id: 'attack', name: '⚔️ Attack', description: 'Basic attack' },
        { id: 'defend', name: '🛡️ Defend', description: 'Reduce damage + chance to stun (cooldown increases)' }
      ];

      // Add equipped active skills (only for slots 1-4)
      for (const equippedSkill of equippedSkills) {
        if (equippedSkill.skill.type === 'ACTIVE' && equippedSkill.slot >= 1 && equippedSkill.slot <= 4) {
          const userSkill = userSkills.find(us => us.skillId === equippedSkill.skillId);
          const level = userSkill ? userSkill.level : 1;
          const effect = equippedSkill.skill.baseEffect + (equippedSkill.skill.effectPerLevel * (level - 1));
          
          actions.push({
            id: `skill_${equippedSkill.skillId}`,
            name: `💥 ${equippedSkill.skill.name}`,
            description: `${equippedSkill.skill.description} (Level ${level}, ${effect} damage)`,
            skillId: equippedSkill.skillId,
            slot: equippedSkill.slot,
            type: 'ACTIVE'
          });
        }
      }

      // Add equipped ultimate skill (only if in slot 1)
      const ultimateSkill = equippedSkills.find(es => es.skill.type === 'ULTIMATE' && es.slot === 1);
      if (ultimateSkill) {
        const userSkill = userSkills.find(us => us.skillId === ultimateSkill.skillId);
        const level = userSkill ? userSkill.level : 1;
        const effect = ultimateSkill.skill.baseEffect + (ultimateSkill.skill.effectPerLevel * (level - 1));
        
        actions.push({
          id: `skill_${ultimateSkill.skillId}`,
          name: `🌟 ${ultimateSkill.skill.name}`,
          description: `${ultimateSkill.skill.description} (Level ${level}, ${effect} damage)`,
          skillId: ultimateSkill.skillId,
          slot: ultimateSkill.slot,
          type: 'ULTIMATE'
        });
      }

      return actions;
    } catch (error) {
      console.error('Error getting player actions:', error);
      // Fallback to basic actions
      return [
        { id: 'attack', name: '⚔️ Attack', description: 'Basic attack' },
        { id: 'defend', name: '🛡️ Defend', description: 'Reduce damage + chance to stun (cooldown increases)' },
        { id: 'special', name: '💥 Special', description: '3-5x damage (30 energy, 2 round cooldown)' },
        { id: 'ultimate', name: '🌟 Ultimate', description: 'Devastating attack (requires 100% ultimate charge)' }
      ];
    }
  }

  // Calculate attack with critical hits and dodges
  static calculateAttack(attack, defense, attacker) {
    // Base damage calculation
    const baseDamage = Math.max(1, attack - defense + Math.floor(Math.random() * 3) + 1);
    
    // Critical hit chance (15% for players, 10% for beasts)
    const criticalChance = attacker === 'player' ? 0.15 : 0.10;
    const isCritical = Math.random() < criticalChance;
    
    // Dodge chance (5% for players, 3% for beasts)
    const dodgeChance = attacker === 'player' ? 0.05 : 0.03;
    const isDodged = Math.random() < dodgeChance;
    
    if (isDodged) {
      return { dodged: true, damage: 0, critical: false };
    }
    
    let finalDamage = baseDamage;
    if (isCritical) {
      finalDamage = Math.floor(baseDamage * 1.5); // 50% bonus for critical hits
    }
    
    return { 
      dodged: false, 
      damage: finalDamage, 
      critical: isCritical 
    };
  }

  // Generate loot from beast
  static async generateBeastLoot(beast, isSparkling = false) {
    const loot = [];
    
    // Separate items by rarity
    const itemsByRarity = {
      'COMMON': beast.beastLootDrops.filter(drop => drop.item.rarity === 'COMMON'),
      'UNCOMMON': beast.beastLootDrops.filter(drop => drop.item.rarity === 'UNCOMMON'),
      'RARE': beast.beastLootDrops.filter(drop => drop.item.rarity === 'RARE'),
      'LEGENDARY': beast.beastLootDrops.filter(drop => drop.item.rarity === 'LEGENDARY'),
      'MYTHIC': beast.beastLootDrops.filter(drop => drop.item.rarity === 'MYTHIC')
    };
    
    // Base loot tiers based on beast rarity
    const baseLootTiers = {
      'UNCOMMON': { common: { min: 3, max: 6 }, uncommon: { min: 2, max: 3 } },
      'RARE': { common: { min: 4, max: 7 }, uncommon: { min: 3, max: 4 }, rare: { min: 2, max: 3 } },
      'LEGENDARY': { common: { min: 5, max: 8 }, uncommon: { min: 3, max: 5 }, rare: { min: 3, max: 4 }, legendary: { min: 2, max: 3 } },
      'MYTHIC': { common: { min: 6, max: 10 }, uncommon: { min: 4, max: 6 }, rare: { min: 3, max: 5 }, legendary: { min: 3, max: 4 }, mythic: { min: 2, max: 3 } }
    };
    
    // Get tier configuration for this beast
    const tierConfig = baseLootTiers[beast.rarity] || baseLootTiers['UNCOMMON'];
    
    // Sparkling bonus: increases quantities and adds higher tier chances
    const sparkleMultiplier = isSparkling ? 1.5 : 1;
    const sparkleBonus = isSparkling ? 0.3 : 0; // 30% chance for higher tier items when sparkling
    
    // Boss bonus (boss beasts get extra loot)
    const isBoss = this.BOSS_NAMES.includes(beast.name);
    const bossMultiplier = isBoss ? 2.0 : 1.0; // 2x loot for bosses
    const bossBonus = isBoss ? 0.5 : 0; // 50% chance for higher tier items when boss
    
    // Generate guaranteed loot for each tier
    for (const [rarity, config] of Object.entries(tierConfig)) {
      const items = itemsByRarity[rarity.toUpperCase()];
      if (!items || items.length === 0) continue;
      
      const minCount = Math.floor(config.min * sparkleMultiplier * bossMultiplier);
      const maxCount = Math.floor(config.max * sparkleMultiplier * bossMultiplier);
      const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
      
      // Select random items from this tier
      for (let i = 0; i < count; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)];
        const existingLoot = loot.find(l => l.item.id === randomItem.item.id);
        
        if (existingLoot) {
          existingLoot.quantity += 1;
        } else {
          loot.push({
            item: randomItem.item,
            quantity: 1
          });
        }
      }
    }
    
    // Additional RNG-based drops (chance for higher tier items)
    const additionalDropChances = {
      'UNCOMMON': { rare: 0.25, legendary: 0.10, mythic: 0.02 },
      'RARE': { legendary: 0.30, mythic: 0.15 },
      'LEGENDARY': { mythic: 0.35 },
      'MYTHIC': { legendary: 0.50 } // Mythic beasts can drop extra legendary items
    };
    
    const additionalChances = additionalDropChances[beast.rarity] || {};
    
    for (const [rarity, chance] of Object.entries(additionalChances)) {
      const adjustedChance = (chance + sparkleBonus + bossBonus) * sparkleMultiplier;
      if (Math.random() < adjustedChance) {
        const items = itemsByRarity[rarity.toUpperCase()];
        if (items && items.length > 0) {
          const randomItem = items[Math.floor(Math.random() * items.length)];
          const existingLoot = loot.find(l => l.item.id === randomItem.item.id);
          
          if (existingLoot) {
            existingLoot.quantity += 1;
          } else {
            loot.push({
              item: randomItem.item,
              quantity: 1
            });
          }
        }
      }
    }
    
    // Special boss fragment logic (for bosses only)
    if (beast.rarity === 'MYTHIC' && this.BOSS_NAMES.includes(beast.name)) {
      const fragmentItems = itemsByRarity['LEGENDARY'].filter(item => item.item.name.includes('Fragment'));
      if (fragmentItems.length > 0) {
        const fragmentChance = 0.25 + (sparkleBonus * 0.5); // 25% base, +15% when sparkling
        if (Math.random() < fragmentChance) {
          const randomFragment = fragmentItems[Math.floor(Math.random() * fragmentItems.length)];
          const existingLoot = loot.find(l => l.item.id === randomFragment.item.id);
          
          if (existingLoot) {
            existingLoot.quantity += 1;
          } else {
            loot.push({
              item: randomFragment.item,
              quantity: 1
            });
          }
        }
      }
    }
    
    // Ensure at least one item drops (fallback to common if nothing else)
    if (loot.length === 0) {
      const commonItems = itemsByRarity['COMMON'];
      if (commonItems && commonItems.length > 0) {
        const randomCommonItem = commonItems[Math.floor(Math.random() * commonItems.length)];
        loot.push({
          item: randomCommonItem.item,
          quantity: 1
        });
      }
    }
    
    return loot;
  }

  // Calculate coin reward based on beast rarity
  static calculateCoinReward(beast, baseCoins) {
    const rarityMultipliers = {
      'UNCOMMON': 3,
      'RARE': 5,
      'LEGENDARY': 10,
      'MYTHIC': 20
    };

    const multiplier = rarityMultipliers[beast.rarity] || 3;
    let reward = Math.floor(baseCoins * multiplier);
    
    // Boss bonus (boss beasts get extra coins)
    if (this.BOSS_NAMES.includes(beast.name)) {
      reward = Math.floor(reward * 3); // 3x bonus for bosses
    }
    
    return reward;
  }

  // Calculate XP reward based on beast rarity and zone
  static calculateXPReward(beast, userZone = 'Jungle Ruins') {
    // Zone definitions with XP scaling (balanced for reasonable progression)
    const zones = {
      'Jungle Ruins': { multiplier: 1.0, name: 'Zone 1' },
      'Frozen Crypts': { multiplier: 1.5, name: 'Zone 2' },
      'Mirage Dunes': { multiplier: 2.5, name: 'Zone 3' },
      'Sunken Temple': { multiplier: 3.5, name: 'Zone 4' },
      'Volcanic Forge': { multiplier: 4.5, name: 'Zone 5' },
      'Twilight Moor': { multiplier: 5.5, name: 'Zone 6' },
      'Skyreach Spires': { multiplier: 6.5, name: 'Zone 7' },
      'Obsidian Wastes': { multiplier: 7.5, name: 'Zone 8' },
      'Astral Caverns': { multiplier: 8.5, name: 'Zone 9' },
      'Ethereal Sanctum': { multiplier: 10.0, name: 'Zone 10' }
    };
    
    const zone = zones[userZone] || zones['Jungle Ruins'];
    
    // Base XP by rarity (Zone 1 values)
    const baseXP = {
      'UNCOMMON': 250,
      'RARE': 500,
      'LEGENDARY': 1000,
      'MYTHIC': 2000
    };
    
    const baseReward = baseXP[beast.rarity] || 250;
    let xpReward = Math.floor(baseReward * zone.multiplier);
    
    // Boss bonus (boss beasts get extra XP)
    if (this.BOSS_NAMES.includes(beast.name)) {
      xpReward = Math.floor(xpReward * 2); // 2x bonus for bosses
    }
    
    return xpReward;
  }

  // Process battle results and update user stats
  static async processBattleResults(user, beast, battleResult, baseCoins) {
    try {
      if (battleResult.playerWon) {
        // Player won - grant rewards
        const isSparkling = battleResult.beastStats?.isSparkling || false;
        const loot = await this.generateBeastLoot(beast, isSparkling);
        const coinReward = this.calculateCoinReward(beast, baseCoins);
        const xpReward = this.calculateXPReward(beast, user.currentZone);
        
        // Add items to inventory
        for (const lootItem of loot) {
          await prisma.inventoryItem.upsert({
            where: {
              userId_itemId: {
                userId: user.id,
                itemId: lootItem.item.id
              }
            },
            update: {
              quantity: {
                increment: lootItem.quantity
              }
            },
            create: {
              userId: user.id,
              itemId: lootItem.item.id,
              quantity: lootItem.quantity
            }
          });
        }

        // Update user stats
        const updateData = {
          coins: { increment: coinReward },
          beastsSlain: { increment: 1 },
          experience: { increment: xpReward }
        };
        
        // Check if this was a boss and record the defeat
        if (this.BOSS_NAMES.includes(beast.name)) {
          updateData.bossesSlain = { increment: 1 };
          
          // Record individual boss defeat for cooldown tracking
          const BossSystem = require('./boss-system');
          await BossSystem.recordBossDefeat(user.id, beast.name);
          
          // Record server boss defeat for server-wide cooldown
          const ServerBossSystem = require('./server-boss-system');
          await ServerBossSystem.recordServerBossDefeat(user.guildId || 'global', beast.name, user.id, false);
          
          // Send immediate notification
          await this.sendBossNotification(user.guildId || 'global', beast.name, user.id, false);
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: updateData
        });

        // Check if this was a boss
        const isBoss = this.BOSS_NAMES.includes(beast.name);
        const bossEmoji = isBoss ? '🏰 ' : '';
        const bossMessage = isBoss ? `🏆 **BOSS VICTORY!** You defeated the ${beast.name}!` : `🏆 Victory! You defeated the ${beast.name}!`;
        
        return {
          success: true,
          loot,
          coinReward,
          xpReward,
          message: bossMessage
        };
      } else {
        // Player lost - apply penalties
        const coinPenalty = Math.min(100, Math.floor(baseCoins * 0.25)); // 25% of base coins, max 100
        
        // Boss won - still record server cooldown
        if (this.BOSS_NAMES.includes(beast.name)) {
          const ServerBossSystem = require('./server-boss-system');
          await ServerBossSystem.recordServerBossDefeat(user.guildId || 'global', beast.name, user.id, true);
          
          // Send immediate notification
          await this.sendBossNotification(user.guildId || 'global', beast.name, user.id, true);
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            coins: { decrement: coinPenalty }
          }
        });

        return {
          success: false,
          coinPenalty,
          message: `💀 Defeat! The ${beast.name} was too powerful...`
        };
      }
    } catch (error) {
      console.error('Error processing battle results:', error);
      return {
        success: false,
        message: '❌ An error occurred while processing battle results.'
      };
    }
  }

  // Check if battle should be triggered (5-15% chance)
  static shouldTriggerBattle() {
    const chance = Math.random();
    return chance >= 0.85 && chance <= 1.0; // 15% chance
  }

  // Get battle trigger chance for display
  static getBattleTriggerChance() {
    return 15; // 15% chance
  }
  
  // Send boss notification immediately
  static async sendBossNotification(guildId, bossName, userId, bossWon = false) {
    try {
      const ServerBossSystem = require('./server-boss-system');
      const { EmbedBuilder } = require('discord.js');
      
      // Get boss config for cooldown info
      const bossConfig = ServerBossSystem.serverBossConditions[bossName];
      if (!bossConfig) return;
      
      const cooldownHours = Math.ceil(bossConfig.serverCooldown / (60 * 60 * 1000));
      
      // Create notification embed
      const embed = new EmbedBuilder()
        .setColor(bossWon ? '#FF6B35' : '#FF0000')
        .setTitle(bossWon ? '🏰 **SERVER BOSS VICTORIOUS!**' : '🏰 **SERVER BOSS DEFEATED!**')
        .setDescription(bossWon ? 
          `**${bossName}** has emerged victorious in **${bossConfig.zone}**!` :
          `**${bossName}** has been defeated in **${bossConfig.zone}**!`)
        .addFields(
          {
            name: bossWon ? '💀 Defeated Player' : '🎯 Defeated By',
            value: `<@${userId}>`,
            inline: true
          },
          {
            name: '⏰ Server Cooldown',
            value: `${cooldownHours} hours`,
            inline: true
          },
          {
            name: '📢 Server Notice',
            value: bossWon ?
              'This boss has proven its might and is now on cooldown. All players must wait before it can spawn again.' :
              'This boss is now on cooldown for the entire server. All players must wait before it can spawn again.',
            inline: false
          }
        )
        .setTimestamp()
        .setFooter({ text: 'Relic Raider - Server Boss System' });
      
      // Try to send to a channel in the guild
      // Note: This requires access to the Discord client, which we don't have here
      // For now, we'll store it in the global notifications for the ready event to pick up
      if (!global.serverBossNotifications) {
        global.serverBossNotifications = new Map();
      }
      
      global.serverBossNotifications.set(guildId, {
        bossName: bossName,
        zone: bossConfig.zone,
        defeatedByUserId: userId,
        cooldownHours: cooldownHours,
        timestamp: new Date(),
        bossWon: bossWon,
        embed: embed // Store the embed for immediate use
      });
      
    } catch (error) {
      console.error('Error sending boss notification:', error);
    }
  }
}

module.exports = BattleSystem; 