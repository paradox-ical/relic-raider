const prisma = require('./database');

class UserManagement {
  /**
   * Safely get or create a user with proper error handling and transaction safety
   * @param {string} discordId - Discord user ID
   * @param {string} username - Discord username
   * @param {string} guildId - Guild ID (optional)
   * @returns {Promise<Object>} User object
   */
  static async getOrCreateUser(discordId, username, guildId = null) {
    try {
      // First try to find existing user
      let user = await prisma.user.findUnique({
        where: { discordId: discordId }
      });

      if (user) {
        // Update username in case it changed
        if (user.username !== username) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { username: username }
          });
        }
        return user;
      }

      // Create new user with transaction safety
      return await prisma.$transaction(async (tx) => {
        // Double-check user doesn't exist (race condition protection)
        const existingUser = await tx.user.findUnique({
          where: { discordId: discordId }
        });

        if (existingUser) {
          return existingUser;
        }

        // Create user with all required defaults
        const newUser = await tx.user.create({
          data: {
            discordId: discordId,
            username: username,
            guildId: guildId,
            level: 1,
            experience: 0,
            coins: 0,
            currentZone: "Jungle Ruins",
            totalExplorations: 0,
            baseHp: 100,
            baseAttack: 10,
            baseDefense: 5,
            beastsSlain: 0,
            bossesSlain: 0,
            playerClass: "Adventurer",
            skillPoints: 0,
            totalSkillPoints: 0,
            tutorialCompleted: false,
            selectedBranch: null,
            branchUnlockNotified: false,
            lastPassiveRespecTime: null,
            lastActiveRespecTime: null,
            lastUltimateRespecTime: null
          }
        });

        return newUser;
      });

    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      
      // Handle specific database errors
      if (error.code === 'P2002') {
        // Unique constraint violation - user was created by another process
        return await prisma.user.findUnique({
          where: { discordId: discordId }
        });
      }
      
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Validate user data integrity
   * @param {Object} user - User object to validate
   * @returns {Object} Validation result
   */
  static validateUserData(user) {
    const issues = [];

    // Check required fields
    if (!user.discordId) issues.push('Missing discordId');
    if (!user.username) issues.push('Missing username');
    if (user.level < 1) issues.push('Invalid level');
    if (user.experience < 0) issues.push('Invalid experience');
    if (user.coins < 0) issues.push('Invalid coins');
    if (user.baseHp < 1) issues.push('Invalid baseHp');
    if (user.baseAttack < 0) issues.push('Invalid baseAttack');
    if (user.baseDefense < 0) issues.push('Invalid baseDefense');
    if (user.beastsSlain < 0) issues.push('Invalid beastsSlain');
    if (user.bossesSlain < 0) issues.push('Invalid bossesSlain');
    if (user.skillPoints < 0) issues.push('Invalid skillPoints');
    if (user.totalSkillPoints < 0) issues.push('Invalid totalSkillPoints');
    if (user.totalExplorations < 0) issues.push('Invalid totalExplorations');

    return {
      isValid: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Repair corrupted user data
   * @param {string} userId - User ID to repair
   * @returns {Promise<Object>} Repair result
   */
  static async repairUserData(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const validation = this.validateUserData(user);
      if (validation.isValid) {
        return { success: true, message: 'User data is valid' };
      }

      // Repair invalid data
      const repairData = {};
      
      if (user.level < 1) repairData.level = 1;
      if (user.experience < 0) repairData.experience = 0;
      if (user.coins < 0) repairData.coins = 0;
      if (user.baseHp < 1) repairData.baseHp = 100;
      if (user.baseAttack < 0) repairData.baseAttack = 10;
      if (user.baseDefense < 0) repairData.baseDefense = 5;
      if (user.beastsSlain < 0) repairData.beastsSlain = 0;
      if (user.bossesSlain < 0) repairData.bossesSlain = 0;
      if (user.skillPoints < 0) repairData.skillPoints = 0;
      if (user.totalSkillPoints < 0) repairData.totalSkillPoints = 0;
      if (user.totalExplorations < 0) repairData.totalExplorations = 0;
      if (!user.currentZone) repairData.currentZone = "Jungle Ruins";
      if (!user.playerClass) repairData.playerClass = "Adventurer";

      if (Object.keys(repairData).length > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: repairData
        });

        return { 
          success: true, 
          message: 'User data repaired', 
          repairedFields: Object.keys(repairData) 
        };
      }

      return { success: true, message: 'No repairs needed' };

    } catch (error) {
      console.error('Error repairing user data:', error);
      return { success: false, message: `Repair failed: ${error.message}` };
    }
  }

  /**
   * Get user with validation and repair if needed
   * @param {string} discordId - Discord user ID
   * @param {string} username - Discord username
   * @param {string} guildId - Guild ID (optional)
   * @returns {Promise<Object>} User object
   */
  static async getValidatedUser(discordId, username, guildId = null) {
    const user = await this.getOrCreateUser(discordId, username, guildId);
    
    // Validate user data
    const validation = this.validateUserData(user);
    if (!validation.isValid) {
      console.warn(`User ${user.id} has data integrity issues:`, validation.issues);
      
      // Attempt to repair
      const repairResult = await this.repairUserData(user.id);
      if (repairResult.success) {
        // Get the repaired user
        return await prisma.user.findUnique({
          where: { id: user.id }
        });
      } else {
        console.error(`Failed to repair user ${user.id}:`, repairResult.message);
      }
    }

    return user;
  }

  /**
   * Check if user exists and is valid
   * @param {string} discordId - Discord user ID
   * @returns {Promise<boolean>} Whether user exists and is valid
   */
  static async userExists(discordId) {
    try {
      const user = await prisma.user.findUnique({
        where: { discordId: discordId }
      });

      if (!user) return false;

      const validation = this.validateUserData(user);
      return validation.isValid;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Delete user and all related data (for testing/cleanup)
   * @param {string} discordId - Discord user ID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteUser(discordId) {
    try {
      const user = await prisma.user.findUnique({
        where: { discordId: discordId }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Delete all related data in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete related records
        await tx.inventoryItem.deleteMany({ where: { userId: user.id } });
        await tx.userEquipment.deleteMany({ where: { userId: user.id } });
        await tx.userCollection.deleteMany({ where: { userId: user.id } });
        await tx.userBrush.deleteMany({ where: { userId: user.id } });
        await tx.userMap.deleteMany({ where: { userId: user.id } });
        await tx.userAchievement.deleteMany({ where: { userId: user.id } });
        await tx.userTitle.deleteMany({ where: { userId: user.id } });
        await tx.userChallengeProgress.deleteMany({ where: { userId: user.id } });
        await tx.hiddenAchievementDiscovery.deleteMany({ where: { userId: user.id } });
        await tx.bossDefeat.deleteMany({ where: { userId: user.id } });
        await tx.userCraftingProgress.deleteMany({ where: { userId: user.id } });
        await tx.userCraftingStation.deleteMany({ where: { userId: user.id } });
        await tx.userSkill.deleteMany({ where: { userId: user.id } });
        await tx.equippedSkill.deleteMany({ where: { userId: user.id } });
        await tx.equippedGear.deleteMany({ where: { userId: user.id } });

        // Delete the user
        await tx.user.delete({ where: { id: user.id } });
      });

      return { success: true, message: 'User and all related data deleted' };

    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: `Deletion failed: ${error.message}` };
    }
  }
}

module.exports = UserManagement; 