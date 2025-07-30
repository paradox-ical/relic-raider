// XP System for Relic Raider
// New scaling: Level 100 requires 100,000 XP total

const SkillSystem = require('./skill-system');

// Zone XP modifiers
const ZONE_XP_MODIFIERS = {
  'Jungle Ruins': 1.0,      // Level 1-10
  'Frozen Crypt': 1.2,      // Level 5-20
  'Mirage Dunes': 1.5,      // Level 15-50
  'Sunken Temple': 1.8,     // Level 25-100
  'Volcanic Forge': 2.0,    // Level 35-100
  'Twilight Moor': 2.2,     // Level 45-100
  'Skyreach Spires': 2.5,   // Level 55-100
  'Obsidian Wastes': 2.8,   // Level 65-100
  'Astral Caverns': 3.0,    // Level 75-100
  'Ethereal Sanctum': 3.5   // Level 85-100
};

/**
 * Calculate XP required for a specific level
 * Formula: XP = 100 * level^1.5 (Zone 1)
 * @param {number} level - The level to calculate XP for
 * @param {string} zoneName - Zone name for scaling (optional)
 * @returns {number} XP required for that level
 */
function calculateXPForLevel(level, zoneName = 'Jungle Ruins') {
  const baseXP = Math.floor(100 * Math.pow(level, 1.5));
  
  // Zone-based XP scaling
  const zoneScaling = {
    'Jungle Ruins': 1.0,      // Zone 1
    'Frozen Crypt': 1.2,      // Zone 2
    'Mirage Dunes': 1.5,      // Zone 3
    'Sunken Temple': 2.0,     // Zone 4
    'Volcanic Forge': 2.5,    // Zone 5
    'Twilight Moor': 3.0,     // Zone 6
    'Skyreach Spires': 3.5,   // Zone 7
    'Obsidian Wastes': 4.5,   // Zone 8
    'Astral Caverns': 5.0,    // Zone 9
    'Ethereal Sanctum': 6.0   // Zone 10
  };
  
  const scaling = zoneScaling[zoneName] || 1.0;
  return Math.floor(baseXP * scaling);
}

/**
 * Calculate total XP required to reach a level
 * @param {number} level - The level to calculate total XP for
 * @param {string} zoneName - Zone name for scaling (optional)
 * @returns {number} Total XP required to reach that level
 */
function calculateTotalXPForLevel(level, zoneName = 'Jungle Ruins') {
  let totalXP = 0;
  for (let i = 1; i <= level; i++) {
    totalXP += calculateXPForLevel(i, zoneName);
  }
  return totalXP;
}

/**
 * Calculate current level based on total XP
 * @param {number} totalXP - Total XP earned
 * @param {string} zoneName - Zone name for scaling (optional)
 * @returns {number} Current level
 */
function calculateLevelFromXP(totalXP, zoneName = 'Jungle Ruins') {
  let level = 1;
  let xpNeeded = 0;
  
  while (level <= 100) {
    xpNeeded += calculateXPForLevel(level, zoneName);
    if (totalXP < xpNeeded) {
      return level;
    }
    level++;
  }
  
  return 100; // Cap at level 100
}

/**
 * Calculate XP progress within current level
 * @param {number} totalXP - Total XP earned
 * @param {string} zoneName - Zone name for scaling (optional)
 * @returns {Object} { currentLevel, xpInLevel, xpForNextLevel, progress }
 */
function calculateLevelProgress(totalXP, zoneName = 'Jungle Ruins') {
  const currentLevel = calculateLevelFromXP(totalXP, zoneName);
  const xpForCurrentLevel = calculateTotalXPForLevel(currentLevel - 1, zoneName);
  const xpInLevel = totalXP - xpForCurrentLevel;
  const xpForNextLevel = calculateXPForLevel(currentLevel, zoneName);
  
  return {
    currentLevel,
    xpInLevel,
    xpForNextLevel,
    progress: Math.min(100, Math.floor((xpInLevel / xpForNextLevel) * 100))
  };
}

/**
 * Calculate base XP gained from exploration
 * Formula: 8 + (player_level * 0.8) + random(0-8)
 * @param {number} playerLevel - Player's current level
 * @returns {number} Base XP gained
 */
function calculateBaseXP(playerLevel) {
  const baseXP = 8 + (playerLevel * 0.8);
  const randomBonus = Math.floor(Math.random() * 9); // 0-8
  return Math.floor(baseXP + randomBonus);
}

/**
 * Calculate total XP gained from exploration with zone modifier
 * @param {number} playerLevel - Player's current level
 * @param {string} zoneName - Name of the zone being explored
 * @returns {number} Total XP gained
 */
function calculateExplorationXP(playerLevel, zoneName) {
  const baseXP = calculateBaseXP(playerLevel);
  const zoneModifier = ZONE_XP_MODIFIERS[zoneName] || 1.0;
  return Math.floor(baseXP * zoneModifier);
}

/**
 * Get zone XP modifier
 * @param {string} zoneName - Name of the zone
 * @returns {number} XP modifier for that zone
 */
function getZoneXPModifier(zoneName) {
  return ZONE_XP_MODIFIERS[zoneName] || 1.0;
}

/**
 * Get all zone XP modifiers for display
 * @returns {Object} Zone name to modifier mapping
 */
function getAllZoneModifiers() {
  return ZONE_XP_MODIFIERS;
}

/**
 * Award XP to a user and handle level ups
 * @param {string} userId - User ID
 * @param {number} xpGained - XP to award
 * @param {string} zoneName - Zone name for level calculation (optional)
 * @returns {Promise<Object>} Result of XP award
 */
async function awardXP(userId, xpGained, zoneName = 'Jungle Ruins') {
  const prisma = require('./database');
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    const oldLevel = user.level;
    const newTotalXP = user.experience + xpGained;
    const newLevel = calculateLevelFromXP(newTotalXP, zoneName);

    // Update user's XP and level
    await prisma.user.update({
      where: { id: userId },
      data: {
        experience: newTotalXP,
        level: newLevel
      }
    });

    // Check if user leveled up
    if (newLevel > oldLevel) {
      // Award skill points for level ups
      const skillPointsAwarded = await SkillSystem.awardSkillPoints(userId, newLevel);
      
      return {
        success: true,
        xpGained,
        newTotalXP,
        oldLevel,
        newLevel,
        leveledUp: true,
        skillPointsAwarded
      };
    }

    return {
      success: true,
      xpGained,
      newTotalXP,
      oldLevel,
      newLevel,
      leveledUp: false
    };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return { success: false, message: 'An error occurred while awarding XP' };
  }
}

module.exports = {
  calculateXPForLevel,
  calculateTotalXPForLevel,
  calculateLevelFromXP,
  calculateLevelProgress,
  calculateBaseXP,
  calculateExplorationXP,
  getZoneXPModifier,
  getAllZoneModifiers,
  awardXP
}; 