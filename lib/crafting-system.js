const prisma = require('./database');

class CraftingSystem {
  /**
   * Get all available recipes for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of available recipes
   */
  static async getAvailableRecipes(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userCraftingStations: {
            include: {
              station: {
                include: {
                  stationRecipes: {
                    include: {
                      recipe: {
                        include: {
                          recipeIngredients: {
                            include: {
                              item: true
                            }
                          },
                          resultItem: true,
                          resultEquipment: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user) return [];

      const recipes = [];
      for (const userStation of user.userCraftingStations) {
        for (const stationRecipe of userStation.station.stationRecipes) {
          const recipe = stationRecipe.recipe;
          
          // Check if user meets level requirement
          if (user.level >= recipe.requiredLevel) {
            // Check if user has required ingredients
            const canCraft = await this.canCraftRecipe(userId, recipe.id);
            recipes.push({
              ...recipe,
              canCraft,
              stationName: userStation.station.name
            });
          }
        }
      }

      return recipes;
    } catch (error) {
      console.error('Error getting available recipes:', error);
      return [];
    }
  }

  /**
   * Check if a user can craft a specific recipe
   * @param {string} userId - User ID
   * @param {string} recipeId - Recipe ID
   * @returns {Promise<boolean>} Whether the user can craft the recipe
   */
  static async canCraftRecipe(userId, recipeId) {
    try {
      const recipe = await prisma.craftingRecipe.findUnique({
        where: { id: recipeId },
        include: {
          recipeIngredients: {
            include: {
              item: true
            }
          }
        }
      });

      if (!recipe) return false;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.level < recipe.requiredLevel) return false;

      // Check if user has enough coins
      if (user.coins < recipe.craftingCost) return false;

      // Check if user has all required ingredients
      for (const ingredient of recipe.recipeIngredients) {
        const userItem = await prisma.inventoryItem.findUnique({
          where: {
            userId_itemId: {
              userId: userId,
              itemId: ingredient.itemId
            }
          }
        });

        if (!userItem || userItem.quantity < ingredient.quantity) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking if user can craft recipe:', error);
      return false;
    }
  }

  /**
   * Craft an item using a recipe
   * @param {string} userId - User ID
   * @param {string} recipeId - Recipe ID
   * @returns {Promise<Object>} Result of crafting attempt
   */
  static async craftItem(userId, recipeId) {
    try {
      const recipe = await prisma.craftingRecipe.findUnique({
        where: { id: recipeId },
        include: {
          recipeIngredients: {
            include: {
              item: true
            }
          },
          resultItem: true,
          resultEquipment: true
        }
      });

      if (!recipe) {
        return { success: false, message: 'Recipe not found' };
      }

      // Check if user can craft
      const canCraft = await this.canCraftRecipe(userId, recipeId);
      if (!canCraft) {
        return { success: false, message: 'Cannot craft this recipe' };
      }

      // Start transaction
      const result = await prisma.$transaction(async (tx) => {
        // Deduct coins
        await tx.user.update({
          where: { id: userId },
          data: {
            coins: {
              decrement: recipe.craftingCost
            }
          }
        });

        // Remove ingredients from inventory
        for (const ingredient of recipe.recipeIngredients) {
          await tx.inventoryItem.update({
            where: {
              userId_itemId: {
                userId: userId,
                itemId: ingredient.itemId
              }
            },
            data: {
              quantity: {
                decrement: ingredient.quantity
              }
            }
          });

          // Remove item if quantity becomes 0
          const updatedItem = await tx.inventoryItem.findUnique({
            where: {
              userId_itemId: {
                userId: userId,
                itemId: ingredient.itemId
              }
            }
          });

          if (updatedItem && updatedItem.quantity <= 0) {
            await tx.inventoryItem.delete({
              where: {
                userId_itemId: {
                  userId: userId,
                  itemId: ingredient.itemId
                }
              }
            });
          }
        }

        // Add result to inventory (either item or equipment)
        if (recipe.resultItemId) {
          // Crafting an item
        const existingItem = await tx.inventoryItem.findUnique({
          where: {
            userId_itemId: {
              userId: userId,
              itemId: recipe.resultItemId
            }
          }
        });

        if (existingItem) {
          await tx.inventoryItem.update({
            where: {
              userId_itemId: {
                userId: userId,
                itemId: recipe.resultItemId
              }
            },
            data: {
              quantity: {
                increment: recipe.resultQuantity
              }
            }
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              userId: userId,
              itemId: recipe.resultItemId,
              quantity: recipe.resultQuantity
            }
          });
          }
        } else if (recipe.resultEquipmentId) {
          // Crafting equipment
          const existingEquipment = await tx.userEquipment.findUnique({
            where: {
              userId_equipmentId: {
                userId: userId,
                equipmentId: recipe.resultEquipmentId
              }
            }
          });

          if (existingEquipment) {
            await tx.userEquipment.update({
              where: {
                userId_equipmentId: {
                  userId: userId,
                  equipmentId: recipe.resultEquipmentId
                }
              },
              data: {
                quantity: {
                  increment: recipe.resultQuantity
                }
              }
            });
          } else {
            await tx.userEquipment.create({
              data: {
                userId: userId,
                equipmentId: recipe.resultEquipmentId,
                quantity: recipe.resultQuantity
              }
            });
          }
        }

        // Update crafting progress
        await tx.userCraftingProgress.upsert({
          where: {
            userId_recipeId: {
              userId: userId,
              recipeId: recipeId
            }
          },
          update: {
            timesCrafted: {
              increment: 1
            },
            lastCrafted: new Date()
          },
          create: {
            userId: userId,
            recipeId: recipeId,
            timesCrafted: 1,
            lastCrafted: new Date()
          }
        });

        // Return appropriate result
        if (recipe.resultItem) {
        return {
          success: true,
          message: `Successfully crafted ${recipe.resultQuantity}x ${recipe.resultItem.name}!`,
          craftedItem: recipe.resultItem,
          quantity: recipe.resultQuantity,
          cost: recipe.craftingCost
        };
        } else if (recipe.resultEquipment) {
          return {
            success: true,
            message: `Successfully crafted ${recipe.resultQuantity}x ${recipe.resultEquipment.name}!`,
            craftedItem: recipe.resultEquipment,
            quantity: recipe.resultQuantity,
            cost: recipe.craftingCost
          };
        }
      });

      return result;
    } catch (error) {
      console.error('Error crafting item:', error);
      return { success: false, message: 'An error occurred while crafting' };
    }
  }

  /**
   * Get user's crafting progress
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of crafting progress
   */
  static async getUserCraftingProgress(userId) {
    try {
      const progress = await prisma.userCraftingProgress.findMany({
        where: { userId },
        include: {
          recipe: {
            include: {
              resultItem: true,
              resultEquipment: true
            }
          }
        }
      });

      return progress;
    } catch (error) {
      console.error('Error getting user crafting progress:', error);
      return [];
    }
  }

  /**
   * Get user's unlocked crafting stations
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of unlocked stations
   */
  static async getUserStations(userId) {
    try {
      const stations = await prisma.userCraftingStation.findMany({
        where: { userId },
        include: {
          station: {
            include: {
              stationRecipes: {
                include: {
                  recipe: {
                    include: {
                      resultItem: true,
                      resultEquipment: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      return stations;
    } catch (error) {
      console.error('Error getting user stations:', error);
      return [];
    }
  }

  /**
   * Unlock a crafting station for a user
   * @param {string} userId - User ID
   * @param {string} stationId - Station ID
   * @returns {Promise<Object>} Result of unlock attempt
   */
  static async unlockStation(userId, stationId) {
    try {
      const station = await prisma.craftingStation.findUnique({
        where: { id: stationId }
      });

      if (!station) {
        return { success: false, message: 'Station not found' };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (user.level < station.requiredLevel) {
        return { success: false, message: `Requires level ${station.requiredLevel}` };
      }

      if (user.coins < station.unlockCost) {
        return { success: false, message: `Requires ${station.unlockCost} coins` };
      }

      // Check if already unlocked
      const existingStation = await prisma.userCraftingStation.findUnique({
        where: {
          userId_stationId: {
            userId: userId,
            stationId: stationId
          }
        }
      });

      if (existingStation) {
        return { success: false, message: 'Station already unlocked' };
      }

      // Unlock station
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: {
            coins: {
              decrement: station.unlockCost
            }
          }
        });

        await tx.userCraftingStation.create({
          data: {
            userId: userId,
            stationId: stationId
          }
        });
      });

      return {
        success: true,
        message: `Successfully unlocked ${station.name}!`,
        station: station
      };
    } catch (error) {
      console.error('Error unlocking station:', error);
      return { success: false, message: 'An error occurred while unlocking station' };
    }
  }

  /**
   * Get all available stations for a user to unlock
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of available stations
   */
  static async getAvailableStations(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userCraftingStations: true
        }
      });

      if (!user) return [];

      const allStations = await prisma.craftingStation.findMany();
      const unlockedStationIds = user.userCraftingStations.map(us => us.stationId);

      return allStations.map(station => {
        const canUnlock = user.level >= station.requiredLevel && 
                         user.coins >= station.unlockCost &&
                         !unlockedStationIds.includes(station.id);
        
        return {
          ...station,
          canUnlock,
          unlocked: unlockedStationIds.includes(station.id)
        };
      });
    } catch (error) {
      console.error('Error getting available stations:', error);
      return [];
    }
  }

  /**
   * Get equipment crafting recipes for a user's class
   * @param {string} userId - User ID
   * @param {string} playerClass - Player's class
   * @returns {Promise<Array>} Array of equipment recipes
   */
  static async getEquipmentRecipes(userId, playerClass) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return [];

      // Get class-specific gear set names
      const classGearSets = this.getClassGearSetNames(playerClass);
      
      const recipes = await prisma.craftingRecipe.findMany({
        where: {
          resultEquipment: {
            name: {
              contains: classGearSets
            }
          },
          requiredLevel: {
            lte: user.level
          }
        },
        include: {
          resultEquipment: true,
          recipeIngredients: {
            include: {
              item: true
            }
          }
        },
        orderBy: [
          { requiredLevel: 'asc' },
          { name: 'asc' }
        ]
      });

      // Check if user can craft each recipe
      const recipesWithStatus = [];
      for (const recipe of recipes) {
        const canCraft = await this.canCraftRecipe(userId, recipe.id);
        recipesWithStatus.push({
          ...recipe,
          canCraft
        });
      }

      return recipesWithStatus;
    } catch (error) {
      console.error('Error getting equipment recipes:', error);
      return [];
    }
  }

  /**
   * Get class gear set names for filtering
   * @param {string} playerClass - Player's class
   * @returns {string} Gear set names for the class
   */
  static getClassGearSetNames(playerClass) {
    const classGearSets = {
      'Paladin': ['Stonewall', 'Undying', 'Ironskin'],
      'Rogue': ['Shadowleaf', 'Silent Fang', 'Velvet Coil'],
      'Hunter': ['Snarehide', 'Wolfsight', 'Trailwalker'],
      'Mage': ['Runespun', 'Dustwoven', 'Kindling']
    };

    return classGearSets[playerClass] || ['Adventurer'];
  }

  /**
   * Get crafting progress for equipment recipes
   * @param {string} userId - User ID
   * @param {string} playerClass - Player's class
   * @returns {Promise<Array>} Array of crafting progress
   */
  static async getEquipmentCraftingProgress(userId, playerClass) {
    try {
      const classGearSets = this.getClassGearSetNames(playerClass);
      
      // Build OR conditions for each gear set name
      const gearSetConditions = classGearSets.map(gearSet => ({
        recipe: {
          resultEquipment: {
            name: {
              contains: gearSet
            }
          }
        }
      }));

      const progress = await prisma.userCraftingProgress.findMany({
        where: {
          userId: userId,
          OR: gearSetConditions
        },
        include: {
          recipe: {
            include: {
              resultEquipment: true
            }
          }
        },
        orderBy: [
          { timesCrafted: 'desc' },
          { lastCrafted: 'desc' }
        ]
      });

      return progress;
    } catch (error) {
      console.error('Error getting equipment crafting progress:', error);
      return [];
    }
  }

  /**
   * Get recommended next equipment to craft
   * @param {string} userId - User ID
   * @param {string} playerClass - Player's class
   * @returns {Promise<Array>} Array of recommended equipment
   */
  static async getRecommendedEquipment(userId, playerClass) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return [];

      // Get user's current equipment
      const equippedGear = await prisma.equippedGear.findMany({
        where: { userId },
        include: {
          equipment: true
        }
      });

      // Get all available equipment recipes for the user's class and level
      const recipes = await this.getEquipmentRecipes(userId, playerClass);
      
      const recommendations = [];

      for (const recipe of recipes) {
        const equipment = recipe.resultEquipment;
        
        // Check if user already owns this equipment
        const userEquipment = await prisma.userEquipment.findUnique({
          where: {
            userId_equipmentId: {
              userId: userId,
              equipmentId: equipment.id
            }
          }
        });

        if (userEquipment && userEquipment.quantity > 0) {
          continue; // Skip if user already owns it
        }

        // Check if this would be an upgrade
        const currentEquipment = equippedGear.find(eg => eg.equipment.type === equipment.type);
        
        if (!currentEquipment || equipment.level > currentEquipment.equipment.level) {
          recommendations.push({
            recipe: recipe,
            equipment: equipment,
            isUpgrade: !currentEquipment || equipment.level > currentEquipment.equipment.level,
            canCraft: recipe.canCraft
          });
        }
      }

      // Sort by level and rarity
      recommendations.sort((a, b) => {
        if (a.equipment.level !== b.equipment.level) {
          return a.equipment.level - b.equipment.level;
        }
        return this.getRarityValue(a.equipment.rarity) - this.getRarityValue(b.equipment.rarity);
      });

      return recommendations.slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error('Error getting recommended equipment:', error);
      return [];
    }
  }

  /**
   * Get rarity value for sorting
   * @param {string} rarity - Equipment rarity
   * @returns {number} Numeric value for sorting
   */
  static getRarityValue(rarity) {
    const rarityValues = {
      'COMMON': 1,
      'UNCOMMON': 2,
      'RARE': 3,
      'LEGENDARY': 4,
      'MYTHIC': 5,
      'ASCENDED': 6
    };
    return rarityValues[rarity] || 0;
  }

  /**
   * Get equipment recipes for a specific station, class, and type
   * @param {string} userId - User ID
   * @param {string} stationId - Station ID
   * @param {string} playerClass - Player's class
   * @param {string} equipmentType - Equipment type (ARMOR or WEAPON)
   * @returns {Promise<Array>} Array of equipment recipes
   */
  static async getEquipmentRecipesForStation(userId, stationId, playerClass, equipmentType) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return [];

      let whereCondition;

      if (equipmentType === 'WEAPON') {
        // For weapons, filter by class-specific weapon types
        const classWeaponTypes = {
          'paladin': ['Ironbrand', 'Warprayer', 'Vindicator'],
          'rogue': ['Fangpiercer', 'Shadowfang', 'Silent'],
          'hunter': ['Wolfsight', 'Bonehook', 'Tracker'],
          'mage': ['Cinderstick', 'Frostroot', 'Sparkstone']
        };
        
        const weaponTypes = classWeaponTypes[playerClass.toLowerCase()] || [];
        
        // Build OR conditions for each weapon type
        const weaponConditions = weaponTypes.map(weaponType => ({
          resultEquipment: {
            name: {
              contains: weaponType
            },
            type: equipmentType
          }
        }));

        whereCondition = {
          OR: weaponConditions,
          requiredLevel: {
            lte: user.level
          },
          stationRecipes: {
            some: {
              stationId: stationId
            }
          }
        };
      } else {
        // For armor, use class-specific gear set names
        const classGearSets = this.getClassGearSetNames(playerClass);
        
        // Build OR conditions for each gear set name
        const gearSetConditions = classGearSets.map(gearSet => ({
          resultEquipment: {
            name: {
              contains: gearSet
            },
            type: equipmentType
          }
        }));

        whereCondition = {
          OR: gearSetConditions,
          requiredLevel: {
            lte: user.level
          },
          stationRecipes: {
            some: {
              stationId: stationId
            }
          }
        };
      }

      const recipes = await prisma.craftingRecipe.findMany({
        where: whereCondition,
        include: {
          resultEquipment: true,
          recipeIngredients: {
            include: {
              item: true
            }
          }
        },
        orderBy: [
          { requiredLevel: 'asc' },
          { name: 'asc' }
        ]
      });

      // Check if user can craft each recipe
      const recipesWithStatus = [];
      for (const recipe of recipes) {
        const canCraft = await this.canCraftRecipe(userId, recipe.id);
        recipesWithStatus.push({
          ...recipe,
          canCraft
        });
      }

      return recipesWithStatus;
    } catch (error) {
      console.error('Error getting equipment recipes for station:', error);
      return [];
    }
  }
}

module.exports = CraftingSystem; 