// Item categories for organization
const { getItemEmoji } = require('./emoji-config');

const ITEM_CATEGORIES = {
  RELICS: {
    name: 'Relics',
    emoji: '🏺',
    description: 'Ancient artifacts and treasures',
    color: '#FFD700'
  },
  CRYSTALS: {
    name: 'Crystals',
    emoji: '💎',
    description: 'Mystical crystals and gems',
    color: '#00BFFF'
  },
  WEAPONS: {
    name: 'Weapons',
    emoji: '⚔️',
    description: 'Combat weapons and tools',
    color: '#DC143C'
  },
  ARMOR: {
    name: 'Armor',
    emoji: '🛡️',
    description: 'Protective gear and armor',
    color: '#4169E1'
  },
  POTIONS: {
    name: 'Potions',
    emoji: '🧪',
    description: 'Magical potions and elixirs',
    color: '#9932CC'
  },
  MATERIALS: {
    name: 'Materials',
    emoji: '📦',
    description: 'Crafting materials and resources',
    color: '#8B4513'
  }
};

// Map items to categories based on their names and properties
function categorizeItem(item) {
  const name = item.name.toLowerCase();
  
  // Crystals
  if (name.includes('crystal') || name.includes('gem') || name.includes('shard')) {
    return 'CRYSTALS';
  }
  
  // Weapons
  if (name.includes('sword') || name.includes('axe') || name.includes('dagger') || 
      name.includes('bow') || name.includes('staff') || name.includes('weapon')) {
    return 'WEAPONS';
  }
  
  // Armor
  if (name.includes('armor') || name.includes('helmet') || name.includes('shield') || 
      name.includes('chest') || name.includes('boots') || name.includes('gauntlets')) {
    return 'ARMOR';
  }
  
  // Potions
  if (name.includes('potion') || name.includes('elixir') || name.includes('scroll') || 
      name.includes('potion')) {
    return 'POTIONS';
  }
  
  // Materials
  if (name.includes('material') || name.includes('ore') || name.includes('wood') || 
      name.includes('leather') || name.includes('cloth') || name.includes('metal')) {
    return 'MATERIALS';
  }
  
  // Default to relics for ancient/treasure items
  return 'RELICS';
}

// Group inventory items by category
function groupInventoryByCategory(inventoryItems) {
  const categories = {};
  
  for (const invItem of inventoryItems) {
    const category = categorizeItem(invItem.item);
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push(invItem);
  }
  
  return categories;
}

// Create dynamic sell buttons based on inventory categories
function createSellCategoryButtons(categories) {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const rows = [];
  let currentRow = new ActionRowBuilder();
  let buttonCount = 0;
  
  for (const [categoryKey, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    
    const category = ITEM_CATEGORIES[categoryKey];
    const totalItems = items.reduce((sum, invItem) => sum + invItem.quantity, 0);
    
    const button = new ButtonBuilder()
      .setCustomId(`sell_category_${categoryKey}`)
      .setLabel(`${category.emoji} ${category.name} (${totalItems})`)
      .setStyle(ButtonStyle.Primary);
    
    currentRow.addComponents(button);
    buttonCount++;
    
    // Discord allows max 5 buttons per row
    if (buttonCount >= 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
      buttonCount = 0;
    }
  }
  
  // Add navigation buttons to the last row
  if (buttonCount > 0) {
    // Add back button
    const backButton = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('🔙 Back')
      .setStyle(ButtonStyle.Secondary);
    
    currentRow.addComponents(backButton);
    rows.push(currentRow);
  } else if (rows.length > 0) {
    // If we have rows but no current row, add navigation to the last row
    const lastRow = rows[rows.length - 1];
    const backButton = new ButtonBuilder()
      .setCustomId('back')
      .setLabel('🔙 Back')
      .setStyle(ButtonStyle.Secondary);
    
    lastRow.addComponents(backButton);
  }
  
  return rows;
}

// Create sell buttons for items within a category
function createSellItemButtons(categoryItems, categoryKey) {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const rows = [];
  let currentRow = new ActionRowBuilder();
  let buttonCount = 0;
  
  for (const invItem of categoryItems) {
              const button = new ButtonBuilder()
            .setCustomId(`sell_item_${invItem.item.id}`)
            .setLabel(`${getItemEmoji(invItem.item.name, invItem.item.rarity)} ${invItem.item.name} x${invItem.quantity}`)
            .setStyle(ButtonStyle.Success);
    
    currentRow.addComponents(button);
    buttonCount++;
    
    // Discord allows max 5 buttons per row
    if (buttonCount >= 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
      buttonCount = 0;
    }
  }
  
  // Add the current row if it has buttons
  if (buttonCount > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

module.exports = {
  ITEM_CATEGORIES,
  categorizeItem,
  groupInventoryByCategory,
  createSellCategoryButtons,
  createSellItemButtons
}; 