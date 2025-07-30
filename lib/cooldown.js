const prisma = require('./database');

// Default explore cooldown in milliseconds
const DEFAULT_EXPLORE_COOLDOWN = 4000; // 4 seconds

// Brush tiers and their multipliers
const BRUSH_TIERS = {
  'Frayed Straw Brush': { multiplier: 1.0, tier: 1 },
  'Worn Boar Bristle': { multiplier: 0.875, tier: 2 },
  'Polished Wood Brush': { multiplier: 0.75, tier: 3 },
  'Bronze Detail Brush': { multiplier: 0.625, tier: 4 },
  'Ivory Precision Brush': { multiplier: 0.5, tier: 5 },
  'Quartz Fiber Brush': { multiplier: 0.425, tier: 6 },
  'Phoenix Feather Brush': { multiplier: 0.325, tier: 7 },
  'Celestial Dust Brush': { multiplier: 0.25, tier: 8 }
};

/**
 * Get the user's current explore cooldown based on their best map
 * @param {Object} user - User object from database
 * @returns {number} Cooldown in milliseconds
 */
async function getExploreCooldown(user) {
  // Get user's brushes
  const userBrushes = await prisma.userBrush.findMany({
    where: { userId: user.id },
    include: { brush: true }
  });

  if (userBrushes.length === 0) {
    return DEFAULT_EXPLORE_COOLDOWN;
  }

  // Find the best brush (highest tier)
  const bestBrush = userBrushes.reduce((best, current) => {
    return current.brush.tier > best.brush.tier ? current : best;
  });

  return Math.floor(DEFAULT_EXPLORE_COOLDOWN * bestBrush.brush.multiplier);
}

/**
 * Check if user can explore (cooldown has passed)
 * @param {Object} user - User object from database
 * @returns {Object} { canExplore: boolean, timeLeft: number }
 */
async function canExplore(user) {
  if (!user.lastExplore) {
    return { canExplore: true, timeLeft: 0 };
  }

  const cooldown = await getExploreCooldown(user);
  const now = Date.now();
  const lastExploreTime = user.lastExplore.getTime();
  const timeLeft = Math.max(0, cooldown - (now - lastExploreTime));

  return {
    canExplore: timeLeft === 0,
    timeLeft: timeLeft
  };
}

/**
 * Update user's last explore timestamp
 * @param {string} userId - User's database ID
 */
async function updateLastExplore(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastExplore: new Date() }
  });
}

/**
 * Get user's best brush info
 * @param {string} userId - User's database ID
 * @returns {Object|null} Best brush info or null if no brushes
 */
async function getBestBrush(userId) {
  const userBrushes = await prisma.userBrush.findMany({
    where: { userId: userId },
    include: { brush: true }
  });

  if (userBrushes.length === 0) {
    return null;
  }

  return userBrushes.reduce((best, current) => {
    return current.brush.tier > best.brush.tier ? current : best;
  });
}

/**
 * Get user's best map info
 * @param {string} userId - User's database ID
 * @returns {Object|null} Best map info or null if no maps
 */
async function getBestMap(userId) {
  const userMaps = await prisma.userMap.findMany({
    where: { userId: userId },
    include: { map: true }
  });

  if (userMaps.length === 0) {
    return null;
  }

  return userMaps.reduce((best, current) => {
    return current.map.tier > best.map.tier ? current : best;
  });
}

module.exports = {
  getExploreCooldown,
  canExplore,
  updateLastExplore,
  getBestBrush,
  getBestMap,
  DEFAULT_EXPLORE_COOLDOWN,
  BRUSH_TIERS
}; 