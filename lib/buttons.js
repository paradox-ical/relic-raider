const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// Button IDs
const BUTTON_IDS = {
  // Main menu
  EXPLORE: 'explore',
  CHARACTER: 'character',
  PROFILE: 'profile',
  REGIONS_BOSSES: 'regions_bosses',
  SHOP: 'shop',
  
  // Character submenu
  INVENTORY: 'inventory',
  SKILLS: 'skills',
  CLASS: 'class',
  CRAFTING: 'crafting',
  CHARACTER_BACK: 'character_back',
  
  // Profile submenu
  PROGRESS: 'progress_view',
  ACHIEVEMENTS: 'achievements_view',
  TITLES: 'titles',
  CHALLENGES: 'challenges_view',
  LEADERBOARD: 'leaderboard',
  PROFILE_BACK: 'profile_back',
  
  // Regions & Bosses submenu
  REGION: 'region',
  BOSSES_VIEW: 'bosses_view',
  
  // Explore
  EXPLORE_AGAIN: 'explore_again',
  SELL: 'sell',
  MENU: 'menu',
  
  // Shop categories
  SHOP_BRUSHES: 'shop_brushes',
  SHOP_MAPS: 'shop_maps',
  SHOP_GEAR: 'shop_gear',
  SHOP_SPECIAL: 'shop_special',
  SHOP_BACK: 'shop_back',
  
  // Navigation
  BACK: 'back',
  CLOSE: 'close'
};

// Create main menu buttons
function createMainMenuButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.EXPLORE)
        .setLabel('🔍 Explore')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CHARACTER)
        .setLabel('⚔️ Character')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.PROFILE)
        .setLabel('📊 Profile')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.REGIONS_BOSSES)
        .setLabel('🗺️ Regions & Bosses')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP)
        .setLabel('🛒 Shop')
        .setStyle(ButtonStyle.Secondary)
    );
}

// Create main menu buttons with zone bosses
function createMainMenuButtonsWithBosses() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.EXPLORE)
        .setLabel('🔍 Explore')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CHARACTER)
        .setLabel('⚔️ Character')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.PROFILE)
        .setLabel('📊 Profile')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.REGIONS_BOSSES)
        .setLabel('🗺️ Regions & Bosses')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP)
        .setLabel('🛒 Shop')
        .setStyle(ButtonStyle.Secondary)
    );
}

// Create explore result buttons
function createExploreButtons(user = null) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.EXPLORE_AGAIN)
      .setLabel('🔍 Explore Again')
      .setStyle(ButtonStyle.Primary)
  ];
  
  // Only show sell button if user has items to sell
  if (user && user.inventoryItems && user.inventoryItems.length > 0) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SELL)
        .setLabel('💰 Sell')
        .setStyle(ButtonStyle.Success)
    );
  }
  
  buttons.push(
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.MENU)
      .setLabel('🏠 Menu')
      .setStyle(ButtonStyle.Secondary)
  );
  
  return new ActionRowBuilder().addComponents(buttons);
}

// Create shop category buttons
function createShopButtons() {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP_BRUSHES)
        .setLabel('🖌️ Brushes')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP_MAPS)
        .setLabel('🗺️ Maps')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP_GEAR)
        .setLabel('⚔️ Gear')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP_SPECIAL)
        .setLabel('✨ Special')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SHOP_BACK)
        .setLabel('🔙 Back')
        .setStyle(ButtonStyle.Secondary)
    );
}

// Create character submenu buttons
function createCharacterButtons() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.INVENTORY)
        .setLabel('🎒 Inventory')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.SKILLS)
        .setLabel('⚔️ Skills')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CLASS)
        .setLabel('🎭 Class')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CRAFTING)
        .setLabel('🔨 Crafting')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CHARACTER_BACK)
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );

  return [row1, row2];
}

// Create profile submenu buttons
function createProfileButtons() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.PROGRESS)
        .setLabel('📊 Progress')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.ACHIEVEMENTS)
        .setLabel('🏆 Achievements')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.TITLES)
        .setLabel('👑 Titles')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CHALLENGES)
        .setLabel('🎯 Challenges')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.LEADERBOARD)
        .setLabel('🏆 Leaderboard')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.PROFILE_BACK)
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );

  return [row1, row2];
}

// Create navigation buttons
function createNavigationButtons(showClose = true) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId(BUTTON_IDS.BACK)
      .setLabel('🔙 Back')
      .setStyle(ButtonStyle.Secondary)
  ];
  
  if (showClose) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CLOSE)
        .setLabel('❌ Close')
        .setStyle(ButtonStyle.Danger)
    );
  }
  
  return new ActionRowBuilder().addComponents(buttons);
}

// Create purchase buttons for shop items
function createPurchaseButtons(itemId, price, canAfford) {
  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_${itemId}`)
        .setLabel(`💰 Buy (${price} coins)`)
        .setStyle(canAfford ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!canAfford),
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.BACK)
        .setLabel('🔙 Back')
        .setStyle(ButtonStyle.Secondary)
    );
}

module.exports = {
  BUTTON_IDS,
  createMainMenuButtons,
  createMainMenuButtonsWithBosses,
  createExploreButtons,
  createShopButtons,
  createCharacterButtons,
  createProfileButtons,
  createNavigationButtons,
  createPurchaseButtons
}; 