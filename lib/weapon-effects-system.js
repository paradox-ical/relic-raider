const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WeaponEffectsSystem {
  
  // Parse weapon special effects from equipment
  static parseWeaponEffects(equipment) {
    if (!equipment || !equipment.specialEffect) {
      return null;
    }
    
    try {
      return JSON.parse(equipment.specialEffect);
    } catch (e) {
      console.error('Error parsing weapon effects:', e);
      return null;
    }
  }

  // Get all equipped weapon effects for a user
  static async getWeaponEffects(userId) {
    const userEquipment = await prisma.userEquipment.findMany({
      where: { userId },
      include: {
        equipment: true
      }
    });

    const weaponEffects = [];
    
    for (const userEquip of userEquipment) {
      if (userEquip.equipment.type === 'WEAPON') {
        const effects = this.parseWeaponEffects(userEquip.equipment);
        if (effects) {
          weaponEffects.push({
            weaponName: userEquip.equipment.name,
            effects: effects
          });
        }
      }
    }
    
    return weaponEffects;
  }

  // Apply weapon effects to attack calculations
  static applyWeaponEffectsToAttack(battleState, baseAttackResult) {
    const weaponEffects = battleState.weaponEffects || [];
    let modifiedResult = { ...baseAttackResult };
    let effectMessages = [];

    for (const weapon of weaponEffects) {
      const effects = weapon.effects;
      
      // **CRITICAL HIT CHANCES**
      if (effects.crit_chance) {
        const critRoll = Math.random();
        if (critRoll < effects.crit_chance) {
          modifiedResult.critical = true;
          modifiedResult.damage = Math.floor(modifiedResult.damage * 1.5);
          effectMessages.push(`⚡ ${weapon.weaponName} critical hit!`);
        }
      }

      // **BLEED EFFECTS** (DoT damage)
      if (effects.bleed_chance) {
        const bleedRoll = Math.random();
        if (bleedRoll < effects.bleed_chance) {
          if (!battleState.beastStatusEffects) {
            battleState.beastStatusEffects = {};
          }
          battleState.beastStatusEffects.bleed = {
            damage: Math.floor(modifiedResult.damage * 0.3), // 30% of attack damage
            duration: 3, // 3 rounds
            source: weapon.weaponName
          };
          effectMessages.push(`🩸 ${weapon.weaponName} caused bleeding!`);
        }
      }

      // **POISON EFFECTS** (DoT damage)
      if (effects.poison_chance) {
        const poisonRoll = Math.random();
        if (poisonRoll < effects.poison_chance) {
          if (!battleState.beastStatusEffects) {
            battleState.beastStatusEffects = {};
          }
          battleState.beastStatusEffects.poison = {
            damage: effects.poison_damage || 5,
            duration: 4, // 4 rounds
            source: weapon.weaponName
          };
          effectMessages.push(`☠️ ${weapon.weaponName} poisoned the beast!`);
        }
      }

      // **STUN EFFECTS** (Skip beast turn)
      if (effects.stun_chance) {
        const stunRoll = Math.random();
        if (stunRoll < effects.stun_chance) {
          battleState.beastStunned = 2; // Stun for 2 rounds
          effectMessages.push(`💫 ${weapon.weaponName} stunned the beast!`);
        }
      }

      // **FIRE DAMAGE** (Extra fire damage)
      if (effects.fire_damage) {
        const fireDamage = Math.floor(modifiedResult.damage * effects.fire_damage);
        modifiedResult.damage += fireDamage;
        effectMessages.push(`🔥 ${weapon.weaponName} dealt ${fireDamage} fire damage!`);
      }

      // **BURN EFFECTS** (DoT fire damage)
      if (effects.burn_chance) {
        const burnRoll = Math.random();
        if (burnRoll < effects.burn_chance) {
          if (!battleState.beastStatusEffects) {
            battleState.beastStatusEffects = {};
          }
          battleState.beastStatusEffects.burn = {
            damage: Math.floor(modifiedResult.damage * 0.4), // 40% of attack damage
            duration: 3, // 3 rounds
            source: weapon.weaponName
          };
          effectMessages.push(`🔥 ${weapon.weaponName} set the beast on fire!`);
        }
      }

      // **FREEZE EFFECTS** (Skip beast turn + slow)
      if (effects.freeze_chance) {
        const freezeRoll = Math.random();
        if (freezeRoll < effects.freeze_chance) {
          battleState.beastStunned = 1; // Freeze for 1 round
          if (!battleState.beastStatusEffects) {
            battleState.beastStatusEffects = {};
          }
          battleState.beastStatusEffects.slow = {
            duration: 2, // Slow for 2 rounds
            source: weapon.weaponName
          };
          effectMessages.push(`❄️ ${weapon.weaponName} froze the beast!`);
        }
      }

      // **CHAIN LIGHTNING** (Hits multiple times)
      if (effects.chain_lightning) {
        const chainRoll = Math.random();
        if (chainRoll < effects.chain_lightning) {
          const chainHits = Math.floor(Math.random() * 3) + 2; // 2-4 hits
          const chainDamage = Math.floor(modifiedResult.damage * 0.6); // 60% damage per hit
          modifiedResult.damage += chainDamage * chainHits;
          effectMessages.push(`⚡ ${weapon.weaponName} chain lightning hit ${chainHits} times!`);
        }
      }
    }

    return {
      ...modifiedResult,
      effectMessages
    };
  }

  // Apply weapon effects to defense calculations
  static applyWeaponEffectsToDefense(battleState, incomingDamage) {
    const weaponEffects = battleState.weaponEffects || [];
    let modifiedDamage = incomingDamage;
    let effectMessages = [];

    for (const weapon of weaponEffects) {
      const effects = weapon.effects;
      
      // **BLOCK CHANCES** (Reduce damage)
      if (effects.block_chance) {
        const blockRoll = Math.random();
        if (blockRoll < effects.block_chance) {
          const blockReduction = 0.5; // Block 50% of damage
          modifiedDamage = Math.floor(modifiedDamage * (1 - blockReduction));
          effectMessages.push(`🛡️ ${weapon.weaponName} blocked the attack!`);
        }
      }

      // **EVASION** (Dodge attacks)
      if (effects.evasion) {
        const evasionRoll = Math.random();
        if (evasionRoll < effects.evasion) {
          modifiedDamage = 0; // Complete dodge
          effectMessages.push(`💨 ${weapon.weaponName} helped you evade!`);
        }
      }
    }

    return {
      damage: modifiedDamage,
      effectMessages
    };
  }

  // Process status effects at the start of each round
  static processStatusEffects(battleState) {
    if (!battleState.beastStatusEffects) {
      return [];
    }

    const statusMessages = [];
    let totalDamage = 0;

    // Process each status effect
    for (const [effectType, effect] of Object.entries(battleState.beastStatusEffects)) {
      if (effect.duration > 0) {
        // Apply damage for DoT effects
        if (effect.damage) {
          battleState.beastHp = Math.max(0, battleState.beastHp - effect.damage);
          totalDamage += effect.damage;
          
          switch (effectType) {
            case 'bleed':
              statusMessages.push(`🩸 Bleeding dealt ${effect.damage} damage`);
              break;
            case 'poison':
              statusMessages.push(`☠️ Poison dealt ${effect.damage} damage`);
              break;
            case 'burn':
              statusMessages.push(`🔥 Burning dealt ${effect.damage} damage`);
              break;
          }
        }

        // Reduce duration
        effect.duration--;
        
        // Remove expired effects
        if (effect.duration <= 0) {
          delete battleState.beastStatusEffects[effectType];
        }
      }
    }

    return {
      totalDamage,
      messages: statusMessages
    };
  }

  // Apply stealth bonuses (affects beast accuracy)
  static applyStealthEffects(battleState) {
    const weaponEffects = battleState.weaponEffects || [];
    let stealthBonus = 0;

    for (const weapon of weaponEffects) {
      const effects = weapon.effects;
      if (effects.stealth_bonus) {
        stealthBonus += effects.stealth_bonus;
      }
    }

    // Stealth reduces beast accuracy
    if (stealthBonus > 0) {
      battleState.beastAccuracyReduction = stealthBonus;
    }

    return stealthBonus;
  }

  // Apply range bonuses (affects attack accuracy)
  static applyRangeEffects(battleState) {
    const weaponEffects = battleState.weaponEffects || [];
    let rangeBonus = 0;

    for (const weapon of weaponEffects) {
      const effects = weapon.effects;
      if (effects.range_bonus) {
        rangeBonus += effects.range_bonus;
      }
    }

    // Range increases attack accuracy
    if (rangeBonus > 0) {
      battleState.playerAccuracyBonus = rangeBonus;
    }

    return rangeBonus;
  }

  // Apply utility effects (loot bonus, movement speed, etc.)
  static applyUtilityEffects(battleState) {
    const weaponEffects = battleState.weaponEffects || [];
    let utilityEffects = {};

    for (const weapon of weaponEffects) {
      const effects = weapon.effects;
      
      if (effects.loot_bonus) {
        utilityEffects.lootBonus = (utilityEffects.lootBonus || 0) + effects.loot_bonus;
      }
      
      if (effects.mana_regen) {
        utilityEffects.manaRegen = (utilityEffects.manaRegen || 0) + effects.mana_regen;
      }
      
      if (effects.movement_speed) {
        utilityEffects.movementSpeed = (utilityEffects.movementSpeed || 0) + effects.movement_speed;
      }
    }

    return utilityEffects;
  }
}

module.exports = WeaponEffectsSystem; 