const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PassiveSkillSystem {
  /**
   * Apply all passive skill effects for a specific action
   * @param {Object} battleState - Current battle state
   * @param {string} action - The action being performed ('attack', 'defend', 'special', 'ultimate', 'turn_start', 'turn_end')
   * @returns {Object} - Effects applied and messages to display
   */
  static applyPassiveEffects(battleState, action) {
    const effects = {
      healing: 0,
      damageBonus: 0,
      damageReduction: 0,
      messages: []
    };

    if (!battleState.skillEffects || !battleState.skillEffects.passiveBonuses) {
      return effects;
    }

    const passiveBonuses = battleState.skillEffects.passiveBonuses;

    // Apply effects based on action type
    switch (action) {
      case 'defend':
        this.applyDefensivePassives(battleState, passiveBonuses, effects);
        break;
      case 'attack':
        this.applyOffensivePassives(battleState, passiveBonuses, effects);
        break;
      case 'turn_start':
        this.applyTurnStartPassives(battleState, passiveBonuses, effects);
        break;
      case 'turn_end':
        this.applyTurnEndPassives(battleState, passiveBonuses, effects);
        break;
      case 'damage_taken':
        this.applyDamageTakenPassives(battleState, passiveBonuses, effects);
        break;
    }

    return effects;
  }

  /**
   * Apply passive skills that trigger on defensive actions
   */
  static applyDefensivePassives(battleState, passiveBonuses, effects) {
    // Radiant Shield - Heal when using defensive skills
    if (passiveBonuses['Radiant Shield']) {
      const healPercent = passiveBonuses['Radiant Shield'] / 100;
      const healAmount = Math.floor(battleState.playerMaxHp * healPercent);
      battleState.playerHp = Math.min(battleState.playerMaxHp, battleState.playerHp + healAmount);
      effects.healing += healAmount;
      effects.messages.push(`Radiant Shield healed ${healAmount} HP`);
    }

    // Sanctified Armor - Regenerate HP each turn
    if (passiveBonuses['Sanctified Armor']) {
      const regenPercent = passiveBonuses['Sanctified Armor'] / 100;
      const regenAmount = Math.floor(battleState.playerMaxHp * regenPercent);
      battleState.playerHp = Math.min(battleState.playerMaxHp, battleState.playerHp + regenAmount);
      effects.healing += regenAmount;
      effects.messages.push(`Sanctified Armor regenerated ${regenAmount} HP`);
    }

    // Bulwark - Reduce damage taken when HP < 30%
    if (passiveBonuses['Bulwark']) {
      const hpPercent = (battleState.playerHp / battleState.playerMaxHp) * 100;
      if (hpPercent < 30) {
        const damageReduction = passiveBonuses['Bulwark'] / 100;
        effects.damageReduction += damageReduction;
        effects.messages.push(`Bulwark reduced incoming damage by ${Math.floor(damageReduction * 100)}%`);
      }
    }
  }

  /**
   * Apply passive skills that trigger on offensive actions
   */
  static applyOffensivePassives(battleState, passiveBonuses, effects) {
    // Smite - Bonus damage vs bosses
    if (passiveBonuses['Smite']) {
      const bossNames = [
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
      
      if (bossNames.includes(battleState.beastName)) {
        const smiteBonus = passiveBonuses['Smite'] / 100;
        const bonusDamage = Math.floor(battleState.playerStats.attack * smiteBonus);
        effects.damageBonus += bonusDamage;
        effects.messages.push(`Smite added ${bonusDamage} bonus damage vs boss`);
      }
    }

    // Crusade - Attack speed bonus (affects cooldowns)
    if (passiveBonuses['Crusade']) {
      // This would affect attack timing/cooldowns
      effects.messages.push(`Crusade increased attack speed`);
    }

    // Glory Strike - Critical damage bonus
    if (passiveBonuses['Glory Strike']) {
      // This would affect critical hit damage
      effects.messages.push(`Glory Strike increased critical damage`);
    }
  }

  /**
   * Apply passive skills that trigger at turn start
   */
  static applyTurnStartPassives(battleState, passiveBonuses, effects) {
    // Sanctified Armor - Regenerate HP each turn
    if (passiveBonuses['Sanctified Armor']) {
      const regenPercent = passiveBonuses['Sanctified Armor'] / 100;
      const regenAmount = Math.floor(battleState.playerMaxHp * regenPercent);
      battleState.playerHp = Math.min(battleState.playerMaxHp, battleState.playerHp + regenAmount);
      effects.healing += regenAmount;
      effects.messages.push(`Sanctified Armor regenerated ${regenAmount} HP`);
    }

    // Daylight Aura - Stats boost during day cycles
    if (passiveBonuses['Daylight Aura']) {
      // This would boost all stats during day cycles
      effects.messages.push(`Daylight Aura boosted your stats`);
    }
  }

  /**
   * Apply passive skills that trigger at turn end
   */
  static applyTurnEndPassives(battleState, passiveBonuses, effects) {
    // Any end-of-turn effects would go here
  }

  /**
   * Apply passive skills that trigger when taking damage
   */
  static applyDamageTakenPassives(battleState, passiveBonuses, effects) {
    // Bulwark - Reduce damage taken when HP < 30%
    if (passiveBonuses['Bulwark']) {
      const hpPercent = (battleState.playerHp / battleState.playerMaxHp) * 100;
      if (hpPercent < 30) {
        const damageReduction = passiveBonuses['Bulwark'] / 100;
        effects.damageReduction += damageReduction;
        effects.messages.push(`Bulwark reduced incoming damage by ${Math.floor(damageReduction * 100)}%`);
      }
    }
  }

  /**
   * Get all passive skills for a user with their effects
   */
  static async getUserPassiveSkills(userId) {
    try {
      const userSkills = await prisma.userSkill.findMany({
        where: { 
          userId: userId,
          skill: {
            type: 'PASSIVE'
          }
        },
        include: {
          skill: true
        }
      });

      return userSkills.map(userSkill => {
        const skill = userSkill.skill;
        const effect = skill.baseEffect + (skill.effectPerLevel * (userSkill.level - 1));
        
        return {
          name: skill.name,
          description: skill.description,
          category: skill.category,
          level: userSkill.level,
          maxLevel: skill.maxLevel,
          effect: effect,
          effectPercent: effect * 100
        };
      });
    } catch (error) {
      console.error('Error getting user passive skills:', error);
      return [];
    }
  }
}

module.exports = PassiveSkillSystem; 