const prisma = require('./database');

class SkillSystem {
  /**
   * Get all available player classes
   * @returns {Promise<Array>} Array of player classes
   */
  static async getAllClasses() {
    try {
      const classes = await prisma.playerClass.findMany({
        include: {
          classSkills: {
            include: {
              skill: true
            }
          }
        }
      });
      return classes;
    } catch (error) {
      console.error('Error getting player classes:', error);
      return [];
    }
  }

  /**
   * Get a specific player class
   * @param {string} className - Name of the class
   * @returns {Promise<Object|null>} Player class data
   */
  static async getClass(className) {
    try {
      const playerClass = await prisma.playerClass.findUnique({
        where: { name: className },
        include: {
          classSkills: {
            include: {
              skill: true
            }
          }
        }
      });
      return playerClass;
    } catch (error) {
      console.error('Error getting player class:', error);
      return null;
    }
  }

  /**
   * Change a user's class
   * @param {string} userId - User ID
   * @param {string} className - New class name
   * @returns {Promise<Object>} Result of class change
   */
  static async changeClass(userId, className) {
    try {
      const playerClass = await this.getClass(className);
      if (!playerClass) {
        return { success: false, message: 'Class not found' };
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Check if user already has this class
      if (user.playerClass === className) {
        return { success: false, message: 'You already have this class' };
      }

      // Update user's class
      await prisma.user.update({
        where: { id: userId },
        data: {
          playerClass: className,
          // Reset base stats to class defaults
          baseHp: playerClass.baseHp,
          baseAttack: playerClass.baseAttack,
          baseDefense: playerClass.baseDefense
        }
      });

      return {
        success: true,
        message: `Successfully changed to ${className}!`,
        class: playerClass
      };
    } catch (error) {
      console.error('Error changing class:', error);
      return { success: false, message: 'An error occurred while changing class' };
    }
  }

  /**
   * Get user's current skills
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of user's skills
   */
  static async getUserSkills(userId) {
    try {
      const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: {
          skill: true
        }
      });
      return userSkills;
    } catch (error) {
      console.error('Error getting user skills:', error);
      return [];
    }
  }

  /**
   * Get available skills for a user's class
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of available skills
   */
  static async getAvailableSkills(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSkills: {
            include: {
              skill: true
            }
          }
        }
      });

      if (!user || !user.playerClass) {
        return [];
      }

      const playerClass = await this.getClass(user.playerClass);
      if (!playerClass) {
        return [];
      }

      // Get all skills for this class
      const classSkills = playerClass.classSkills.map(cs => cs.skill);
      
      // Mark which skills the user already has
      const userSkillIds = user.userSkills.map(us => us.skillId);
      
      return classSkills.map(skill => ({
        ...skill,
        learned: userSkillIds.includes(skill.id),
        currentLevel: user.userSkills.find(us => us.skillId === skill.id)?.level || 0
      }));
    } catch (error) {
      console.error('Error getting available skills:', error);
      return [];
    }
  }

  /**
   * Check if a user can learn a specific skill
   * @param {string} userId - User ID
   * @param {string} skillId - Skill ID
   * @returns {Promise<Object>} Result of can learn check
   */
  static async canLearnSkill(userId, skillId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      if (!user.playerClass) {
        return { success: false, message: 'You need to choose a class first. Use `/skills class` to select a class.' };
      }

      const skill = await prisma.skill.findUnique({
        where: { id: skillId }
      });

      if (!skill) {
        return { success: false, message: 'Skill not found' };
      }

      // Check if user's class can learn this skill
      const playerClass = await prisma.playerClass.findUnique({
        where: { name: user.playerClass }
      });

      if (!playerClass) {
        return { success: false, message: 'Invalid class' };
      }

      const classSkill = await prisma.classSkill.findFirst({
        where: {
          classId: playerClass.id,
          skillId: skillId
        }
      });

      if (!classSkill) {
        return { success: false, message: `Your class (${user.playerClass}) cannot learn this skill.` };
      }

      // Check level requirement
      if (user.level < skill.requiredLevel) {
        return { success: false, message: `You need to be level ${skill.requiredLevel} to learn this skill. You are currently level ${user.level}.` };
      }

      // Check if user already has this skill
      const userSkill = await prisma.userSkill.findUnique({
        where: {
          userId_skillId: {
            userId: userId,
            skillId: skillId
          }
        }
      });

      if (userSkill) {
        return { success: false, message: 'You already know this skill.' };
      }

      // Check if user has skill points
      if (user.skillPoints <= 0) {
        return { success: false, message: 'You don\'t have enough skill points to learn this skill.' };
      }

      return { success: true, message: 'You can learn this skill!' };
    } catch (error) {
      console.error('Error checking if user can learn skill:', error);
      return { success: false, message: 'An error occurred while checking skill requirements.' };
    }
  }

  /**
   * Learn or upgrade a skill
   * @param {string} userId - User ID
   * @param {string} skillId - Skill ID
   * @returns {Promise<Object>} Result of skill learning/upgrade
   */
  static async learnSkill(userId, skillId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const skill = await prisma.skill.findUnique({
        where: { id: skillId }
      });

      if (!skill) {
        return { success: false, message: 'Skill not found' };
      }

      // Check if user has enough skill points
      if (user.skillPoints < 1) {
        return { success: false, message: 'Not enough skill points' };
      }

      // Check if user meets level requirement
      if (user.level < skill.requiredLevel) {
        return { success: false, message: `Requires level ${skill.requiredLevel}` };
      }

      // Check if user can learn this skill (has the class)
      const playerClass = await this.getClass(user.playerClass);
      if (!playerClass) {
        return { success: false, message: 'Invalid class' };
      }

      const canLearn = playerClass.classSkills.some(cs => cs.skillId === skillId);
      if (!canLearn) {
        return { success: false, message: 'Your class cannot learn this skill' };
      }

      // Check if skill is already at max level
      const existingSkill = await prisma.userSkill.findUnique({
        where: {
          userId_skillId: {
            userId: userId,
            skillId: skillId
          }
        }
      });

      if (existingSkill && existingSkill.level >= skill.maxLevel) {
        return { success: false, message: 'Skill is already at maximum level' };
      }

      // Learn or upgrade skill
      await prisma.$transaction(async (tx) => {
        // Deduct skill point
        await tx.user.update({
          where: { id: userId },
          data: {
            skillPoints: {
              decrement: 1
            }
          }
        });

        // Create or update skill
        if (existingSkill) {
          await tx.userSkill.update({
            where: {
              userId_skillId: {
                userId: userId,
                skillId: skillId
              }
            },
            data: {
              level: {
                increment: 1
              }
            }
          });
        } else {
          await tx.userSkill.create({
            data: {
              userId: userId,
              skillId: skillId,
              level: 1
            }
          });
        }
      });

      const newLevel = existingSkill ? existingSkill.level + 1 : 1;
      return {
        success: true,
        message: `Successfully ${existingSkill ? 'upgraded' : 'learned'} ${skill.name} to level ${newLevel}!`,
        skill: skill,
        newLevel: newLevel
      };
    } catch (error) {
      console.error('Error learning skill:', error);
      return { success: false, message: 'An error occurred while learning the skill' };
    }
  }

  /**
   * Calculate user's total stats including skills and equipment
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User's total stats
   */
  static async calculateUserStats(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userSkills: {
            include: {
              skill: true
            }
          },
          equippedGear: {
            include: {
              equipment: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      // Get class stats
      const playerClass = await this.getClass(user.playerClass);
      if (!playerClass) {
        return null;
      }

      // Calculate base stats from class and level
      const baseHp = playerClass.baseHp + (user.level * playerClass.hpPerLevel);
      const baseAttack = playerClass.baseAttack + (user.level * playerClass.attackPerLevel);
      const baseDefense = playerClass.baseDefense + (user.level * playerClass.defensePerLevel);

      // Calculate equipment bonuses
      let equipmentHp = 0;
      let equipmentAttack = 0;
      let equipmentDefense = 0;

      for (const equipped of user.equippedGear) {
        equipmentHp += equipped.equipment.hpBonus;
        equipmentAttack += equipped.equipment.attackBonus;
        equipmentDefense += equipped.equipment.defenseBonus;
      }

      // Calculate skill bonuses
      let skillHp = 0;
      let skillAttack = 0;
      let skillDefense = 0;
      let skillEffects = [];

      for (const userSkill of user.userSkills) {
        const skill = userSkill.skill;
        const effect = skill.baseEffect + (skill.effectPerLevel * (userSkill.level - 1));

        switch (skill.category) {
          case 'COMBAT':
            if (skill.name.includes('Attack') || skill.name.includes('Power')) {
              skillAttack += Math.floor(baseAttack * effect);
            } else if (skill.name.includes('Defense') || skill.name.includes('Guard')) {
              skillDefense += Math.floor(baseDefense * effect);
            } else if (skill.name.includes('Health') || skill.name.includes('Vitality')) {
              skillHp += Math.floor(baseHp * effect);
            }
            break;
          case 'EXPLORATION':
            // Exploration skills affect drop rates, not combat stats
            skillEffects.push({
              name: skill.name,
              effect: effect,
              type: 'exploration'
            });
            break;
          case 'CRAFTING':
            // Crafting skills affect crafting success rates
            skillEffects.push({
              name: skill.name,
              effect: effect,
              type: 'crafting'
            });
            break;
          case 'UTILITY':
            // Utility skills provide various bonuses
            skillEffects.push({
              name: skill.name,
              effect: effect,
              type: 'utility'
            });
            break;
        }
      }

      return {
        base: {
          hp: baseHp,
          attack: baseAttack,
          defense: baseDefense
        },
        equipment: {
          hp: equipmentHp,
          attack: equipmentAttack,
          defense: equipmentDefense
        },
        skills: {
          hp: skillHp,
          attack: skillAttack,
          defense: skillDefense,
          effects: skillEffects
        },
        total: {
          hp: baseHp + equipmentHp + skillHp,
          attack: baseAttack + equipmentAttack + skillAttack,
          defense: baseDefense + equipmentDefense + skillDefense
        }
      };
    } catch (error) {
      console.error('Error calculating user stats:', error);
      return null;
    }
  }

  /**
   * Award skill points to a user (called when they level up)
   * @param {string} userId - User ID
   * @param {number} level - New level
   * @returns {Promise<number>} Number of skill points awarded
   */
  static async awardSkillPoints(userId, level) {
    try {
      // Award skill points every 4 levels
      if (level % 4 === 0) {
        const pointsToAward = Math.floor(level / 4) * 2; // 2 points every 4 levels (adjusted for 2 full paths by level 100)
        
        await prisma.user.update({
          where: { id: userId },
          data: {
            skillPoints: {
              increment: pointsToAward
            },
            totalSkillPoints: {
              increment: pointsToAward
            }
          }
        });

        return pointsToAward;
      }
      return 0;
    } catch (error) {
      console.error('Error awarding skill points:', error);
      return 0;
    }
  }

  /**
   * Calculate and award retroactive skill points for users who are missing them
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of skill points awarded
   */
  static async awardRetroactiveSkillPoints(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return 0;
      }

      // Calculate how many skill points the user should have based on their level
      const expectedSkillPoints = Math.floor(user.level / 4) * 2;
      
      // Calculate how many skill points they actually have
      const currentSkillPoints = user.skillPoints || 0;
      const currentTotalSkillPoints = user.totalSkillPoints || 0;
      
      // Calculate how many skill points they're missing
      const missingSkillPoints = expectedSkillPoints - currentTotalSkillPoints;
      
      if (missingSkillPoints > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            skillPoints: {
              increment: missingSkillPoints
            },
            totalSkillPoints: {
              increment: missingSkillPoints
            }
          }
        });

    
        return missingSkillPoints;
      }
      
      return 0;
    } catch (error) {
      console.error('Error awarding retroactive skill points:', error);
      return 0;
    }
  }

  /**
   * Get skill effects for battle system
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Skill effects for battle
   */
  static async getBattleSkillEffects(userId) {
    try {
      const userSkills = await prisma.userSkill.findMany({
        where: { userId },
        include: {
          skill: true
        }
      });

      const effects = {
        activeSkills: [],
        passiveBonuses: {},
        ultimateSkill: null
      };

      for (const userSkill of userSkills) {
        const skill = userSkill.skill;
        const effect = skill.baseEffect + (skill.effectPerLevel * (userSkill.level - 1));

        switch (skill.type) {
          case 'ACTIVE':
            effects.activeSkills.push({
              id: skill.id,
              name: skill.name,
              description: skill.description,
              effect: effect,
              energyCost: skill.energyCost,
              cooldown: skill.cooldown,
              level: userSkill.level
            });
            break;
          case 'PASSIVE':
            // Include all passive skills, not just COMBAT category
            effects.passiveBonuses[skill.name] = effect;
        
            break;
          case 'ULTIMATE':
            effects.ultimateSkill = {
              id: skill.id,
              name: skill.name,
              description: skill.description,
              effect: effect,
              level: userSkill.level
            };
            break;
        }
      }

      return effects;
    } catch (error) {
      console.error('Error getting battle skill effects:', error);
      return {
        activeSkills: [],
        passiveBonuses: {},
        ultimateSkill: null
      };
    }
  }
}

module.exports = SkillSystem; 