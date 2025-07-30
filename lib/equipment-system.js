const prisma = require('./database');

class EquipmentSystem {
  /**
   * Get all equipment
   * @returns {Promise<Array>} Array of all equipment
   */
  static async getAllEquipment() {
    try {
      const equipment = await prisma.equipment.findMany({
        orderBy: [
          { rarity: 'asc' },
          { level: 'asc' },
          { name: 'asc' }
        ]
      });
      return equipment;
    } catch (error) {
      console.error('Error getting equipment:', error);
      return [];
    }
  }

  /**
   * Get equipment by type
   * @param {string} type - Equipment type
   * @returns {Promise<Array>} Array of equipment of specified type
   */
  static async getEquipmentByType(type) {
    try {
      const equipment = await prisma.equipment.findMany({
        where: { type: type },
        orderBy: [
          { rarity: 'asc' },
          { level: 'asc' },
          { name: 'asc' }
        ]
      });
      return equipment;
    } catch (error) {
      console.error('Error getting equipment by type:', error);
      return [];
    }
  }

  /**
   * Get equipment by class and rarity
   * @param {string} playerClass - Player class
   * @param {string} rarity - Equipment rarity
   * @returns {Promise<Array>} Array of equipment for the class and rarity
   */
  static async getEquipmentByClassAndRarity(playerClass, rarity) {
    try {
      const gearSetNames = this.getClassGearSetNames(playerClass);
      const equipment = await prisma.equipment.findMany({
        where: {
          type: 'ARMOR',
          rarity: rarity,
          OR: gearSetNames.map(name => ({
            name: {
              contains: name
            }
          }))
        },
        orderBy: [
          { level: 'asc' },
          { name: 'asc' }
        ]
      });
      return equipment;
    } catch (error) {
      console.error('Error getting equipment by class and rarity:', error);
      return [];
    }
  }

  /**
   * Get class gear set names
   * @param {string} playerClass - Player class
   * @returns {Array} Array of gear set names for the class
   */
  static getClassGearSetNames(playerClass) {
    const gearSets = {
      'Paladin': ['Stonewall', 'Undying', 'Ironskin'],
      'Rogue': ['Shadowleaf', 'Silent Fang', 'Velvet Coil'],
      'Hunter': ['Snarehide', 'Wolfsight', 'Trailwalker'],
      'Mage': ['Runespun', 'Dustwoven', 'Kindling']
    };
    return gearSets[playerClass] || [];
  }

  /**
   * Get user's equipped gear
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's equipped gear by slot
   */
  static async getUserEquippedGear(userId) {
    try {
      const equippedGear = await prisma.equippedGear.findMany({
        where: { userId },
        include: {
          equipment: true
        }
      });

      // Organize by slot
      const gearBySlot = {};
      for (const slot of ['WEAPON', 'HEAD', 'CHEST', 'LEGS', 'FEET', 'ACCESSORY_1', 'ACCESSORY_2']) {
        gearBySlot[slot] = null;
      }

      for (const equipped of equippedGear) {
        gearBySlot[equipped.slot] = equipped.equipment;
      }

      return gearBySlot;
    } catch (error) {
      console.error('Error getting user equipped gear:', error);
      return {};
    }
  }

  /**
   * Get user's equipped gear sets
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's equipped gear sets
   */
  static async getUserEquippedGearSets(userId) {
    try {
      const equippedGear = await prisma.equippedGear.findMany({
        where: { userId },
        include: {
          equipment: true
        }
      });

      // Group by gear set type
      const gearSets = {
        armor: null,
        weapon: null
      };

      for (const equipped of equippedGear) {
        if (equipped.equipment.type === 'ARMOR') {
          gearSets.armor = equipped.equipment;
        } else if (equipped.equipment.type === 'WEAPON') {
          gearSets.weapon = equipped.equipment;
        }
      }

      return gearSets;
    } catch (error) {
      console.error('Error getting user equipped gear sets:', error);
      return { armor: null, weapon: null };
    }
  }

  /**
   * Equip a gear set
   * @param {string} userId - User ID
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object>} Result of equip attempt
   */
  static async equipGearSet(userId, equipmentId) {
    try {
      const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId }
      });

      if (!equipment) {
        return { success: false, message: 'Equipment not found' };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Check level requirement
      if (user.level < equipment.level) {
        return { 
          success: false, 
          message: `You need to be level ${equipment.level} to equip this gear. You are currently level ${user.level}.` 
        };
      }

      // Check if user owns this equipment
      const userEquipment = await prisma.userEquipment.findUnique({
        where: {
          userId_equipmentId: {
            userId: userId,
            equipmentId: equipmentId
          }
        }
      });

      if (!userEquipment || userEquipment.quantity < 1) {
        return { success: false, message: 'You do not own this equipment' };
      }

      // Unequip current gear of the same type
      await this.unequipGearSet(userId, equipment.type);

      // Equip the new gear set
      await prisma.equippedGear.create({
        data: {
          userId: userId,
          equipmentId: equipmentId,
          slot: equipment.type === 'ARMOR' ? 'CHEST' : 'WEAPON' // Use CHEST for armor sets, WEAPON for weapons
        }
      });

      return { 
        success: true, 
        message: `Successfully equipped ${equipment.name}!`,
        equipment: equipment
      };
    } catch (error) {
      console.error('Error equipping gear set:', error);
      return { success: false, message: 'Failed to equip gear set' };
    }
  }

  /**
   * Unequip a gear set
   * @param {string} userId - User ID
   * @param {string} equipmentType - Equipment type (ARMOR or WEAPON)
   * @returns {Promise<Object>} Result of unequip attempt
   */
  static async unequipGearSet(userId, equipmentType) {
    try {
      const slot = equipmentType === 'ARMOR' ? 'CHEST' : 'WEAPON';
      
      const equippedGear = await prisma.equippedGear.findUnique({
        where: {
          userId_slot: {
            userId: userId,
            slot: slot
          }
        },
        include: {
          equipment: true
        }
      });

      if (!equippedGear) {
        return { success: false, message: 'No equipment equipped in this slot' };
      }

        await prisma.equippedGear.delete({
          where: {
            userId_slot: {
              userId: userId,
              slot: slot
            }
        }
      });

      return {
        success: true,
        message: `Successfully unequipped ${equippedGear.equipment.name}!`,
        equipment: equippedGear.equipment
      };
    } catch (error) {
      console.error('Error unequipping gear set:', error);
      return { success: false, message: 'Failed to unequip gear set' };
    }
  }

  /**
   * Unequip an item from a specific slot (legacy method)
   * @param {string} userId - User ID
   * @param {string} slot - Equipment slot
   * @returns {Promise<Object>} Result of unequip attempt
   */
  static async unequipItem(userId, slot) {
    try {
      const equippedGear = await prisma.equippedGear.findUnique({
        where: {
          userId_slot: {
            userId: userId,
            slot: slot
          }
        },
        include: {
          equipment: true
        }
      });

      if (!equippedGear) {
        return { success: false, message: 'No equipment equipped in this slot' };
      }

      await prisma.equippedGear.delete({
        where: {
          userId_slot: {
            userId: userId,
            slot: slot
          }
        }
      });

      return {
        success: true,
        message: `Successfully unequipped ${equippedGear.equipment.name}!`,
        equipment: equippedGear.equipment
      };
    } catch (error) {
      console.error('Error unequipping item:', error);
      return { success: false, message: 'Failed to unequip item' };
    }
  }

  /**
   * Calculate total equipment bonuses for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Object with total bonuses
   */
  static async calculateEquipmentBonuses(userId) {
    try {
      const equippedGear = await prisma.equippedGear.findMany({
        where: { userId },
        include: {
          equipment: true
        }
      });

      let totalHpBonus = 0;
      let totalAttackBonus = 0;
      let totalDefenseBonus = 0;

      for (const gear of equippedGear) {
        totalHpBonus += gear.equipment.hpBonus || 0;
        totalAttackBonus += gear.equipment.attackBonus || 0;
        totalDefenseBonus += gear.equipment.defenseBonus || 0;
      }

      return {
        hpBonus: totalHpBonus,
        attackBonus: totalAttackBonus,
        defenseBonus: totalDefenseBonus
      };
    } catch (error) {
      console.error('Error calculating equipment bonuses:', error);
      return { hpBonus: 0, attackBonus: 0, defenseBonus: 0 };
    }
  }

  /**
   * Get equipment recommendations for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Recommended equipment
   */
  static async getEquipmentRecommendations(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return [];

      const recommendations = [];
      const userClass = user.playerClass || 'Adventurer';

      // Get available equipment for user's class and level
      const availableEquipment = await prisma.equipment.findMany({
          where: {
          level: { lte: user.level },
          type: 'ARMOR',
          name: {
            contains: this.getClassGearSetNames(userClass)
            }
          },
          orderBy: [
            { rarity: 'desc' },
            { level: 'desc' }
          ],
        take: 5
        });

      return availableEquipment;
    } catch (error) {
      console.error('Error getting equipment recommendations:', error);
      return [];
    }
  }

  /**
   * Create equipment for a user (add to inventory)
   * @param {string} userId - User ID
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object>} Result of creation
   */
  static async createEquipment(userId, equipmentId) {
    try {
      const equipment = await prisma.equipment.findUnique({
        where: { id: equipmentId }
      });

      if (!equipment) {
        return { success: false, message: 'Equipment not found' };
      }

      // Add to user's equipment inventory
      await prisma.userEquipment.upsert({
        where: {
          userId_equipmentId: {
            userId: userId,
            equipmentId: equipmentId
          }
        },
        update: {
          quantity: {
            increment: 1
          }
        },
        create: {
          userId: userId,
          equipmentId: equipmentId,
          quantity: 1
        }
      });

      return {
        success: true,
        message: `Successfully obtained ${equipment.name}!`,
        equipment: equipment
      };
    } catch (error) {
      console.error('Error creating equipment:', error);
      return { success: false, message: 'Failed to create equipment' };
    }
  }

  /**
   * Get equipment by rarity
   * @param {string} rarity - Equipment rarity
   * @returns {Promise<Array>} Array of equipment of specified rarity
   */
  static async getEquipmentByRarity(rarity) {
    try {
      const equipment = await prisma.equipment.findMany({
        where: { rarity: rarity },
        orderBy: [
          { level: 'asc' },
          { name: 'asc' }
        ]
      });
      return equipment;
    } catch (error) {
      console.error('Error getting equipment by rarity:', error);
      return [];
    }
  }

  /**
   * Get ascended gear
   * @returns {Promise<Array>} Array of ascended equipment
   */
  static async getAscendedGear() {
    try {
      const equipment = await prisma.equipment.findMany({
        where: { rarity: 'ASCENDED' },
        orderBy: [
          { level: 'asc' },
          { name: 'asc' }
        ]
      });
      return equipment;
    } catch (error) {
      console.error('Error getting ascended gear:', error);
      return [];
    }
  }

  /**
   * Get user's owned equipment
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of owned equipment
   */
  static async getUserOwnedEquipment(userId) {
    try {
      const ownedEquipment = await prisma.userEquipment.findMany({
        where: { userId },
        include: {
          equipment: true
        },
        orderBy: [
          { equipment: { rarity: 'asc' } },
          { equipment: { level: 'asc' } },
          { equipment: { name: 'asc' } }
        ]
      });

      return ownedEquipment;
    } catch (error) {
      console.error('Error getting user owned equipment:', error);
      return [];
    }
  }

  /**
   * Compare two pieces of equipment
   * @param {Object} currentEquipment - Currently equipped item
   * @param {Object} newEquipment - New equipment to compare
   * @returns {Object} Comparison results
   */
  static compareEquipment(currentEquipment, newEquipment) {
    const comparison = {
      hpBonus: {
        current: currentEquipment?.hpBonus || 0,
        new: newEquipment.hpBonus || 0,
        difference: (newEquipment.hpBonus || 0) - (currentEquipment?.hpBonus || 0)
      },
      attackBonus: {
        current: currentEquipment?.attackBonus || 0,
        new: newEquipment.attackBonus || 0,
        difference: (newEquipment.attackBonus || 0) - (currentEquipment?.attackBonus || 0)
      },
      defenseBonus: {
        current: currentEquipment?.defenseBonus || 0,
        new: newEquipment.defenseBonus || 0,
        difference: (newEquipment.defenseBonus || 0) - (currentEquipment?.defenseBonus || 0)
      }
    };

    // Calculate total stat difference
    const totalCurrent = comparison.hpBonus.current + comparison.attackBonus.current + comparison.defenseBonus.current;
    const totalNew = comparison.hpBonus.new + comparison.attackBonus.new + comparison.defenseBonus.new;
    comparison.totalDifference = totalNew - totalCurrent;

    return comparison;
  }

  /**
   * Get equipment upgrade path for a user
   * @param {string} userId - User ID
   * @param {string} playerClass - Player's class
   * @returns {Promise<Array>} Array of upgrade recommendations
   */
  static async getEquipmentUpgradePath(userId, playerClass) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return [];

      // Get user's current equipment
      const equippedGear = await this.getUserEquippedGearSets(userId);
      
      // Get all available equipment for the user's class and level
      const availableEquipment = await prisma.equipment.findMany({
        where: {
          level: { lte: user.level },
          name: {
            contains: this.getClassGearSetNames(playerClass)
          }
        },
        orderBy: [
          { rarity: 'asc' },
          { level: 'asc' }
        ]
      });

      const upgrades = [];

      // Check for armor upgrades
      if (equippedGear.armor) {
        const betterArmor = availableEquipment.filter(equipment => 
          equipment.type === 'ARMOR' && 
          equipment.level > equippedGear.armor.level &&
          equipment.rarity !== equippedGear.armor.rarity
        );
        
        if (betterArmor.length > 0) {
          upgrades.push({
            type: 'ARMOR',
            current: equippedGear.armor,
            recommendations: betterArmor.slice(0, 3) // Top 3 recommendations
          });
        }
      }

      // Check for weapon upgrades
      if (equippedGear.weapon) {
        const betterWeapons = availableEquipment.filter(equipment => 
          equipment.type === 'WEAPON' && 
          equipment.level > equippedGear.weapon.level &&
          equipment.rarity !== equippedGear.weapon.rarity
        );
        
        if (betterWeapons.length > 0) {
          upgrades.push({
            type: 'WEAPON',
            current: equippedGear.weapon,
            recommendations: betterWeapons.slice(0, 3) // Top 3 recommendations
          });
        }
      }

      return upgrades;
    } catch (error) {
      console.error('Error getting equipment upgrade path:', error);
      return [];
    }
  }

  /**
   * Get equipment crafting requirements
   * @param {string} equipmentId - Equipment ID
   * @returns {Promise<Object>} Crafting requirements
   */
  static async getEquipmentCraftingRequirements(equipmentId) {
    try {
      const recipe = await prisma.craftingRecipe.findFirst({
        where: {
          resultEquipmentId: equipmentId
        },
        include: {
          recipeIngredients: {
            include: {
              item: true
            }
          },
          resultEquipment: true
        }
      });

      if (!recipe) {
        return null;
      }

      return {
        recipe: recipe,
        ingredients: recipe.recipeIngredients,
        cost: recipe.craftingCost,
        requiredLevel: recipe.requiredLevel
      };
    } catch (error) {
      console.error('Error getting equipment crafting requirements:', error);
      return null;
    }
  }

  /**
   * Get class gear set names for filtering
   * @param {string} playerClass - Player's class
   * @returns {string} Gear set names for the class
   */
  static getClassGearSetNames(playerClass) {
    const classGearSets = {
      'Paladin': 'Stonewall|Undying|Ironskin',
      'Rogue': 'Shadowleaf|Silent Fang|Velvet Coil',
      'Hunter': 'Snarehide|Wolfsight|Trailwalker',
      'Mage': 'Runespun|Dustwoven|Kindling'
    };

    return classGearSets[playerClass] || 'Adventurer';
  }
}

module.exports = EquipmentSystem; 