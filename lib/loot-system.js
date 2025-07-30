const prisma = require('./database');

// Zone-based item value modifiers
const ZONE_VALUE_MODIFIERS = {
  'Jungle Ruins': 1.0,      // Level 1-10 (baseline)
  'Frozen Crypt': 1.3,      // Level 5-20 (+30% value)
  'Mirage Dunes': 1.6,      // Level 15-50 (+60% value)
  'Sunken Temple': 2.0,     // Level 25-100 (+100% value)
  'Volcanic Forge': 2.5,    // Level 35-100 (+150% value)
  'Twilight Moor': 3.0,     // Level 45-100 (+200% value)
  'Skyreach Spires': 3.5,   // Level 55-100 (+250% value)
  'Obsidian Wastes': 4.0,   // Level 65-100 (+300% value)
  'Astral Caverns': 4.5,    // Level 75-100 (+350% value)
  'Ethereal Sanctum': 5.0   // Level 85-100 (+400% value)
};

// Rarity-based loot table with dynamic values and quantity ranges
const rarityLootTable = {
  'COMMON': {
    value: 15,
    quantityRange: [3, 8], // drop 3–8
    dropRate: 0.6 // 60% chance
  },
  'UNCOMMON': {
    value: 60,
    quantityRange: [2, 5], // drop 2–5
    dropRate: 0.3 // 30% chance
  },
  'RARE': {
    value: 180,
    quantityRange: [1, 3], // drop 1–3
    dropRate: 0.08 // 8% chance
  },
  'LEGENDARY': {
    value: 600,
    quantityRange: [1, 2], // drop 1–2
    dropRate: 0.015 // 1.5% chance
  },
  'MYTHIC': {
    value: 1800,
    quantityRange: [1, 1], // drop exactly 1
    dropRate: 0.005 // 0.5% chance
  }
};

// Chest system for rare items
const chestSystem = {
  'COMMON': {
    emoji: '<:commonchest:1399184696654561380>',
    name: 'Common Chest',
    coinReward: [50, 150],
    dropRate: 0.15, // 15% chance
    rarityThreshold: 'COMMON'
  },
  'UNCOMMON': {
    emoji: '<:Uncommonchest:1399184780544708731>',
    name: 'Uncommon Chest',
    coinReward: [200, 500],
    dropRate: 0.08, // 8% chance
    rarityThreshold: 'UNCOMMON'
  },
  'RARE': {
    emoji: '<:rarechest:1399184757924954182>',
    name: 'Rare Chest',
    coinReward: [800, 1500],
    dropRate: 0.03, // 3% chance
    rarityThreshold: 'RARE'
  },
  'LEGENDARY': {
    emoji: '<:legendarychest:1399184837520396320>',
    name: 'Legendary Chest',
    coinReward: [2500, 5000],
    dropRate: 0.008, // 0.8% chance
    rarityThreshold: 'LEGENDARY'
  },
  'MYTHIC': {
    emoji: '<:mythicalchest:1399184857359450324>',
    name: 'Mythic Chest',
    coinReward: [8000, 15000],
    dropRate: 0.002, // 0.2% chance
    rarityThreshold: 'MYTHIC'
  }
};

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate dynamic coin value for an item based on its rarity and zone
 * @param {string} rarity - Item rarity (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
 * @param {string} zoneName - Name of the zone where item was found
 * @param {string} itemName - Name of the item (optional, used for beast material detection)
 * @returns {Object} { quantity: number, value: number, totalValue: number }
 */
function calculateDynamicValue(rarity, zoneName = 'Jungle Ruins', itemName = '') {
  const rarityData = rarityLootTable[rarity];
  const zoneModifier = ZONE_VALUE_MODIFIERS[zoneName] || 1.0;
  
  if (!rarityData) {
    // Fallback for unknown rarities
    return {
      quantity: 1,
      value: Math.floor(10 * zoneModifier),
      totalValue: Math.floor(10 * zoneModifier)
    };
  }
  
  const quantity = randomInt(rarityData.quantityRange[0], rarityData.quantityRange[1]);
  const baseValue = rarityData.value;
  const zoneValue = Math.floor(baseValue * zoneModifier);
  
  // Apply 500% increase (6x multiplier) for beast materials
  const isBeastMaterial = itemName && itemName.toLowerCase().includes('beast');
  const beastMultiplier = isBeastMaterial ? 2 : 1;
  const finalValue = Math.floor(zoneValue * beastMultiplier);
  const totalValue = quantity * finalValue;
  
  return {
    quantity: quantity,
    value: finalValue,
    totalValue: totalValue
  };
}

/**
 * Simulate exploration and find items with dynamic values
 * @param {Object} zone - Zone object with zoneItems
 * @param {number} mapMultiplier - Drop rate multiplier from user's best map
 * @returns {Object} Object containing foundItems array and chest info
 */
async function simulateExploration(zone, mapMultiplier = 1.0) {
  const foundItems = [];
  let chest = null;
  let chestItem = null;
  
  // Check each possible item in the zone
  for (const zoneItem of zone.zoneItems) {
    const rarityData = rarityLootTable[zoneItem.item.rarity];
    
    if (!rarityData) {
      // Skip items with unknown rarity
      continue;
    }
    
    // Map multiplier increases rarity drop rate, not overall drop rate
    const boostedRarityDropRate = rarityData.dropRate * mapMultiplier;
    const combinedDropRate = zoneItem.dropRate * boostedRarityDropRate;
    
    if (Math.random() < combinedDropRate) {
      const dynamicValue = calculateDynamicValue(zoneItem.item.rarity, zone.name);
      
      foundItems.push({
        item: zoneItem.item,
        quantity: dynamicValue.quantity,
        baseValue: dynamicValue.value,
        totalValue: dynamicValue.totalValue
      });
    }
  }
  
  // Generate a chest (independent of regular items)
  chest = generateChest();
  if (chest) {
    chestItem = findRandomItemByRarity(zone, chest.rarityThreshold);
  }
  
  // Limit to maximum 3 items, prioritizing rarer items
  if (foundItems.length > 3) {
    // Sort by rarity (rarer items first)
    const rarityOrder = { 'MYTHIC': 5, 'LEGENDARY': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
    foundItems.sort((a, b) => {
      const aRarity = rarityOrder[a.item.rarity] || 0;
      const bRarity = rarityOrder[b.item.rarity] || 0;
      return bRarity - aRarity;
    });
    
    // Take only the first 3 items
    foundItems.splice(3);
  }
  
  return {
    foundItems: foundItems,
    chest: chest,
    chestItem: chestItem
  };
}

/**
 * Add found items to user's inventory with dynamic values
 * @param {string} userId - User's database ID
 * @param {Array} foundItems - Array of found items with quantities
 */
async function addItemsToInventory(userId, foundItems) {
  for (const foundItem of foundItems) {
    await prisma.inventoryItem.upsert({
      where: {
        userId_itemId: {
          userId: userId,
          itemId: foundItem.item.id
        }
      },
      update: {
        quantity: {
          increment: foundItem.quantity
        }
      },
      create: {
        userId: userId,
        itemId: foundItem.item.id,
        quantity: foundItem.quantity
      }
    });
  }
}

/**
 * Generate a random chest based on drop rates
 * @returns {Object|null} Chest object or null if no chest found
 */
function generateChest() {
  const chestTypes = Object.keys(chestSystem);
  
  for (const chestType of chestTypes) {
    const chest = chestSystem[chestType];
    if (Math.random() < chest.dropRate) {
      const coinReward = randomInt(chest.coinReward[0], chest.coinReward[1]);
      return {
        type: chestType,
        emoji: chest.emoji,
        name: chest.name,
        coinReward: coinReward,
        rarityThreshold: chest.rarityThreshold
      };
    }
  }
  
  return null;
}

/**
 * Find a random item of specified rarity or higher from the zone
 * @param {Object} zone - Zone object with zoneItems
 * @param {string} minRarity - Minimum rarity required
 * @returns {Object|null} Random item or null if none found
 */
function findRandomItemByRarity(zone, minRarity) {
  const rarityOrder = { 'COMMON': 1, 'UNCOMMON': 2, 'RARE': 3, 'LEGENDARY': 4, 'MYTHIC': 5 };
  const minRarityLevel = rarityOrder[minRarity] || 1;
  
  const eligibleItems = zone.zoneItems.filter(zoneItem => {
    const itemRarityLevel = rarityOrder[zoneItem.item.rarity] || 0;
    return itemRarityLevel >= minRarityLevel;
  });
  
  if (eligibleItems.length === 0) {
    return null;
  }
  
  const randomZoneItem = eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
  const dynamicValue = calculateDynamicValue(randomZoneItem.item.rarity, zone.name);
  
  return {
    item: randomZoneItem.item,
    quantity: dynamicValue.quantity,
    baseValue: dynamicValue.value,
    totalValue: dynamicValue.totalValue
  };
}

/**
 * Calculate total value of found items
 * @param {Array} foundItems - Array of found items
 * @returns {number} Total value in coins
 */
function calculateTotalValue(foundItems) {
  return foundItems.reduce((total, foundItem) => {
    return total + foundItem.totalValue;
  }, 0);
}

module.exports = {
  rarityLootTable,
  chestSystem,
  randomInt,
  calculateDynamicValue,
  simulateExploration,
  addItemsToInventory,
  calculateTotalValue,
  generateChest,
  findRandomItemByRarity,
  ZONE_VALUE_MODIFIERS
}; 