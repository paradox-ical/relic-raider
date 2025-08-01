const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { 
  BUTTON_IDS, 
  createMainMenuButtons, 
  createMainMenuButtonsWithBosses,
  createExploreButtons, 
  createShopButtons, 
  createCharacterButtons,
  createProfileButtons, 
  createNavigationButtons, 
  createPurchaseButtons 
} = require('./buttons');
const prisma = require('./database');
const { canExplore, updateLastExplore, getBestBrush, getBestMap } = require('./cooldown');
const { 
  groupInventoryByCategory, 
  createSellCategoryButtons, 
  createSellItemButtons,
  ITEM_CATEGORIES 
} = require('./item-categories');
const { simulateExploration, addItemsToInventory, calculateTotalValue } = require('./loot-system');
const AchievementSystem = require('./achievement-system');
const { getItemEmoji, getRarityEmoji } = require('./emoji-config');

// Ensure global battle state is always initialized at module load
if (!global.activeBattles) {
  global.activeBattles = new Map();
  console.log('[INIT] global.activeBattles initialized at module load');
}
if (!global.encounterBeasts) {
  global.encounterBeasts = new Map();
  console.log('[INIT] global.encounterBeasts initialized at module load');
}

// Helper function to safely defer interactions
async function safeDeferUpdate(interaction) {
  try {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
  } catch (error) {
    if (error.code === 10062) {
      console.warn(`[Button] Interaction already expired. Skipping: ${interaction.customId}`);
      return false;
    } else if (error.code === 40060) {
      console.warn(`[Button] Interaction already acknowledged. Skipping: ${interaction.customId}`);
      return false;
    }
    throw error;
  }
  return true;
}

async function handleButtonInteraction(interaction) {
  const { customId } = interaction;
  
  // Check if interaction is still valid
  if (!interaction.isButton()) {
    return;
  }
  
  // Ensure global.activeBattles is always initialized
  if (!global.activeBattles) {
    global.activeBattles = new Map();
    console.log('[INIT] global.activeBattles initialized:', typeof global.activeBattles);
  }
  
  try {
    // Defer the interaction immediately to prevent timeout
    console.log(`[DEBUG] Processing button: ${customId}`);
    const deferSuccess = await safeDeferUpdate(interaction);
    if (!deferSuccess) {
      console.log(`[DEBUG] Defer failed for: ${customId}`);
      return;
    }
    
    // Debug log to track interaction state
    console.log(`[${customId}] replied=${interaction.replied}, deferred=${interaction.deferred}`);
    
    // safe to do long async operations now...
    // Handle branch view buttons
    if (customId.startsWith('view_branch_')) {
      await handleViewBranch(interaction);
      return;
    }
    
    // Handle skill learning buttons
    if (customId.startsWith('learn_skill_')) {
      await handleLearnSkill(interaction);
      return;
    }
    
    // Handle skill upgrade buttons
    if (customId.startsWith('upgrade_skill_')) {
      await handleUpgradeSkill(interaction);
      return;
    }
    
    // Handle skills by category buttons
    if (customId.startsWith('view_skills_')) {
      await handleViewSkillsByCategory(interaction);
      return;
    }
    
    // Handle category respec buttons
    if (customId.startsWith('respec_category_')) {
      await handleRespecCategory(interaction);
      return;
    }
    
    // Handle equipped skills button
    if (customId === 'equipped_skills') {
      await handleEquippedSkills(interaction);
      return;
    }
    
    // Handle equip/unequip skill buttons
    if (customId.startsWith('equip_skill_')) {
      await handleEquipSkill(interaction);
      return;
    }
    
    // Handle empty slot buttons (do nothing)
    if (customId.startsWith('empty_slot_')) {
      await safeDeferUpdate(interaction);
      return;
    }
    
    // Handle ultimate not equipped button (do nothing)
    if (customId === 'ultimate_not_equipped') {
      await safeDeferUpdate(interaction);
      return;
    }
    
    // Handle class menu button
    if (customId === 'class_menu') {
      await handleClassMenu(interaction);
      return;
    }
    
    // Handle class change confirmation buttons
    if (customId === 'confirm_class_change') {
      await handleConfirmClassChange(interaction);
      return;
    }
    
    if (customId === 'cancel_class_change') {
      await handleCancelClassChange(interaction);
      return;
    }
    
    // Handle equipped skill actions (before switch statement)
    if (customId.startsWith('battle_action_skill_')) {
      const skillId = customId.replace('battle_action_skill_', '');
      await handleBattleAction(interaction, `skill_${skillId}`);
      return;
    }
    
    switch (customId) {
      case BUTTON_IDS.EXPLORE:
        await handleExplore(interaction);
        break;
      case BUTTON_IDS.EXPLORE_AGAIN:
        await handleExplore(interaction);
        break;
      case BUTTON_IDS.SELL:
        await handleSellItems(interaction);
        break;
      case BUTTON_IDS.CHARACTER:
        await handleCharacter(interaction);
        break;
      case BUTTON_IDS.PROFILE:
        await handleProfile(interaction);
        break;
      case BUTTON_IDS.REGIONS_BOSSES:
        await handleRegionsBosses(interaction);
        break;
      case BUTTON_IDS.SHOP:
        await handleShop(interaction);
        break;
      case BUTTON_IDS.REGION:
        await handleRegion(interaction);
        break;
      case BUTTON_IDS.INVENTORY:
        await handleInventory(interaction);
        break;
      case BUTTON_IDS.SKILLS:
        await handleSkills(interaction);
        break;
      case BUTTON_IDS.CLASS:
        await handleClassMenu(interaction);
        break;
      case BUTTON_IDS.CRAFTING:
        await handleCraftingMenu(interaction);
        break;
      case BUTTON_IDS.CHARACTER_BACK:
        await handleMenu(interaction);
        break;
      case BUTTON_IDS.LEADERBOARD:
        await handleLeaderboardAll(interaction);
        break;
      case BUTTON_IDS.MENU:
        await handleMenu(interaction);
        break;
          case BUTTON_IDS.SHOP_BRUSHES:
      await handleShopBrushes(interaction);
      break;
      case BUTTON_IDS.SHOP_MAPS:
        await handleShopMaps(interaction);
        break;
      case BUTTON_IDS.SHOP_GEAR:
        await handleShopGear(interaction);
        break;
      case BUTTON_IDS.SHOP_SPECIAL:
        await handleShopSpecial(interaction);
        break;
      case BUTTON_IDS.SHOP_BACK:
        await handleMenu(interaction);
        break;

      // Class selection and profile navigation buttons
      case 'choose_class_Paladin':
      case 'choose_class_Rogue':
      case 'choose_class_Hunter':
      case 'choose_class_Mage':
        await handleClassSelection(interaction);
        break;
      case 'tutorial_class_Paladin':
      case 'tutorial_class_Rogue':
      case 'tutorial_class_Hunter':
      case 'tutorial_class_Mage':
        await handleTutorialClassSelection(interaction);
        break;
      case 'tutorial_branch_Paladin_Guardian\'s Oath':
      case 'tutorial_branch_Paladin_Crusader\'s Fury':
      case 'tutorial_branch_Paladin_Lightbound Path':
      case 'tutorial_branch_Rogue_Shadow Dance':
      case 'tutorial_branch_Rogue_Venomcraft':
      case 'tutorial_branch_Rogue_Dagger Arts':
      case 'tutorial_branch_Hunter_Wild Precision':
      case 'tutorial_branch_Hunter_Beast Mastery':
      case 'tutorial_branch_Hunter_Trapcraft':
      case 'tutorial_branch_Mage_Elementalism':
      case 'tutorial_branch_Mage_Runeweaving':
      case 'tutorial_branch_Mage_Chronomancy':
        await handleTutorialBranchSelection(interaction);
        break;
      case 'tutorial_back_to_classes':
        await handleTutorialBackToClasses(interaction);
        break;
      case 'view_skill_tree':
        await handleViewSkillTree(interaction);
        break;
      case 'view_equipment':
        await handleViewEquipment(interaction);
        break;
      case 'change_class':
        await handleChangeClass(interaction);
        break;

      // Tutorial system buttons
      case 'tutorial_start':
        await handleTutorialStart(interaction);
        break;
      case 'tutorial_skip':
        await handleTutorialSkip(interaction);
        break;
      case 'tutorial_step_2':
        await handleTutorialStep2(interaction);
        break;
      case 'tutorial_complete':
        await handleTutorialComplete(interaction);
        break;
      case 'tutorial_restart':
        await handleTutorialRestart(interaction);
        break;
      case 'tutorial_explore':
        await handleTutorialExplore(interaction);
        break;
      case 'tutorial_hub':
        await handleTutorialHub(interaction);
        break;

      case BUTTON_IDS.PROGRESS:
        await handleProgressView(interaction);
        break;
      case BUTTON_IDS.ACHIEVEMENTS:
        await handleAchievementsView(interaction);
        break;
      case BUTTON_IDS.TITLES:
        await handleTitlesView(interaction);
        break;
      case BUTTON_IDS.CHALLENGES:
        await handleChallengesView(interaction);
        break;
      case BUTTON_IDS.PROFILE_BACK:
        await handleMenu(interaction);
        break;
      case BUTTON_IDS.BACK:
        await handleMenu(interaction);
        break;
            case BUTTON_IDS.CLOSE:
        await handleClose(interaction);
        break;
      case 'battle_fight':
        console.log('[DEBUG] battle_fight button clicked, starting handleBattleFight');
        await handleBattleFight(interaction);
        console.log('[DEBUG] handleBattleFight completed');
        break;
      case 'battle_flee':
        await handleBattleFlee(interaction);
        break;
      case 'battle_flee_during_battle':
        await handleBattleFleeDuringBattle(interaction);
        break;
      case 'battle_action_attack':
        console.log('[DEBUG] battle_action_attack button clicked');
        console.log('[DEBUG] global.activeBattles size before attack:', global.activeBattles ? global.activeBattles.size : 'null');
        await handleBattleAction(interaction, 'attack');
        console.log('[DEBUG] battle_action_attack completed');
        break;
      case 'battle_action_defend':
        await handleBattleAction(interaction, 'defend');
        break;
      case 'battle_action_special':
        await handleBattleAction(interaction, 'special');
        break;
      case BUTTON_IDS.BOSSES_VIEW:
        await handleZoneBosses(interaction);
        break;
      case 'battle_action_ultimate':
        await handleBattleAction(interaction, 'ultimate');
        break;
      case 'sell_items':
        await handleSellItems(interaction);
        break;
      // Leaderboard button handlers
      case 'lb_all':
        await handleLeaderboardAll(interaction);
        break;
      case 'lb_levels':
        await handleLeaderboardSpecific(interaction, 'levels', 'global');
        break;
      case 'lb_coins':
        await handleLeaderboardSpecific(interaction, 'coins', 'global');
        break;
      case 'lb_relics':
        await handleLeaderboardSpecific(interaction, 'relics', 'global');
        break;
      case 'lb_mythics':
        await handleLeaderboardSpecific(interaction, 'mythics', 'global');
        break;
      // Crafting button handlers
      case 'craft_stations':
        await handleCraftingStations(interaction);
        break;
      case 'craft_progress':
        await handleCraftingProgress(interaction);
        break;
      case 'craft_equipment_progress':
        await handleEquipmentCraftingProgress(interaction);
        break;
      case 'craft_equipment_recommendations':
        await handleEquipmentCraftingRecommendations(interaction);
        break;
      case 'craft_close':
        await handleClose(interaction);
        break;
      case 'lb_levels_server':
        await handleLeaderboardSpecific(interaction, 'levels', 'server');
        break;
      case 'lb_coins_server':
        await handleLeaderboardSpecific(interaction, 'coins', 'server');
        break;
      case 'lb_relics_server':
        await handleLeaderboardSpecific(interaction, 'relics', 'server');
        break;
      case 'lb_mythics_server':
        await handleLeaderboardSpecific(interaction, 'mythics', 'server');
        break;
      case 'lb_toggle_global':
        await handleLeaderboardToggle(interaction, 'global');
        break;
      case 'lb_toggle_server':
        await handleLeaderboardToggle(interaction, 'server');
        break;
      // Achievement button handlers
      case 'achievements_view':
        await handleAchievementsView(interaction);
        break;
      case 'titles_view':
        await handleTitlesView(interaction);
        break;
      case 'progress_view':
        await handleProgressView(interaction);
        break;
      case 'zone_bosses':
        await handleZoneBosses(interaction);
        break;
      case 'zone_bosses_info':
        // This is just a disabled page indicator button, no action needed
        await interaction.deferUpdate();
        break;
      case 'challenges_view':
        await handleChallengesView(interaction);
        break;
      case 'craft':
        await handleCraftingMenu(interaction);
        break;
      case 'inventory_craft':
        await handleInventoryCraft(interaction);
        break;
      default:
        if (customId.startsWith('achievement_category_')) {
          const parts = customId.replace('achievement_category_', '').split('_page_');
          const category = parts[0];
          const page = parts.length > 1 ? parseInt(parts[1]) : 0;
          await handleAchievementCategory(interaction, category, page);
        } else if (customId.startsWith('equip_title_')) {
          const titleId = customId.replace('equip_title_', '');
          await handleEquipTitle(interaction, titleId);
        } else if (customId.startsWith('titles_rarity_')) {
          const parts = customId.replace('titles_rarity_', '').split('_page_');
          const rarity = parts[0];
          const page = parts.length > 1 ? parseInt(parts[1]) : 0;
          await handleTitlesRarity(interaction, rarity, page);
        } else if (customId.startsWith('zone_bosses_page_')) {
          const page = parseInt(customId.replace('zone_bosses_page_', ''));
          await handleZoneBosses(interaction, page);
        } else if (customId === 'zone_bosses_info') {
          // Info button is disabled, do nothing
          return;
        } else
        if (customId.startsWith('buy_')) {
          await handlePurchase(interaction, customId);
        } else if (customId.startsWith('sell_category_')) {
          await handleSellCategory(interaction, customId);
        } else if (customId.startsWith('sell_item_')) {
          await handleSellSingleItem(interaction, customId);
        } else if (customId.startsWith('sell_all_category_')) {
          await handleSellAllCategory(interaction, customId);
        } else if (customId.startsWith('region_')) {
          await handleRegionSelect(interaction, customId);
        } else if (customId.startsWith('craft_station_')) {
          await handleCraftStationSelection(interaction, customId);
        } else if (customId.startsWith('craft_class_')) {
          await handleCraftClassSelection(interaction, customId);
        } else if (customId.startsWith('craft_type_')) {
          await handleCraftTypeSelection(interaction, customId);
        } else if (customId.startsWith('craft_item_')) {
          await handleCraftItemSelection(interaction, customId);
        } else if (customId.startsWith('craft_page_')) {
          await handleCraftPageNavigation(interaction, customId);
        } else if (customId === 'craft_equipment') {
          await handleCraftingMenu(interaction);
        } else if (customId.startsWith('craft_create_')) {
          await handleCraftCreate(interaction, customId);
        } else if (customId.startsWith('equip_equipment_')) {
          await handleEquipEquipment(interaction, customId);
        } else if (customId.startsWith('craft_back_to_items_')) {
          await handleCraftBackToItems(interaction, customId);
        } else if (customId === 'inventory_relics') {
          await handleInventoryRelics(interaction);
        } else if (customId === 'inventory_beasts') {
          await handleInventoryBeasts(interaction);
        } else if (customId === 'inventory_equipment') {
          await handleInventoryEquipment(interaction);
        } else if (customId.startsWith('sell_relics_')) {
          await handleSellRelics(interaction, customId);
        } else if (customId.startsWith('sell_beasts_')) {
          await handleSellBeasts(interaction, customId);
        } else if (customId.startsWith('relics_rarity_')) {
          await handleRelicsRarity(interaction, customId);
        } else if (customId.startsWith('beasts_rarity_')) {
          await handleBeastsRarity(interaction, customId);
        } else if (customId === 'inventory') {
          await handleInventory(interaction);
        } else if (customId.startsWith('research_combine_relic_') || customId.startsWith('research_combine_beast_')) {
          await handleResearchCombine(interaction, customId);
        } else if (customId === 'research_relics') {
          await handleResearchRelics(interaction);
        } else if (customId === 'research_beasts') {
          await handleResearchBeasts(interaction);
        } else if (customId.startsWith('craft_')) {
          await handleCraftingButton(interaction, customId);
        } else if (customId.startsWith('unlock_station_')) {
          await handleUnlockStation(interaction, customId);
        } else if (customId.startsWith('tutorial_branch_')) {
          await handleTutorialBranchSelection(interaction);
        } else if (customId.startsWith('tutorial_class_')) {
          await handleTutorialClassSelection(interaction);
        } else {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Unknown button interaction.', flags: 64 });
          } else if (interaction.deferred && !interaction.replied) {
            await interaction.editReply({ content: '❌ Unknown button interaction.' });
          } else if (interaction.replied) {
            await interaction.followUp({ content: '❌ Unknown button interaction.', flags: 64 });
          }
        }
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    
    // Only attempt reply if it's still valid
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: '❌ Something went wrong.',
          flags: 64
        });
      } catch (_) {
        // Ignore any errors from the error response
      }
    }
  }
}

async function handleExplore(interaction) {
  try {
    const discordId = interaction.user.id;
    
    // Get user
    let user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user) {
      await interaction.editReply({ 
        content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
        flags: 64 
      });
      return;
    }
    
    // Check cooldown
    const cooldownCheck = await canExplore(user);
    if (!cooldownCheck.canExplore) {
      const timeLeftSeconds = Math.ceil(cooldownCheck.timeLeft / 1000);
      const bestBrush = await getBestBrush(user.id);
      
      let cooldownMessage = `⏰ You need to wait **${timeLeftSeconds} seconds** before exploring again.`;
      if (bestBrush) {
        cooldownMessage += `\n🖌️ Your best brush: **${bestBrush.brush.name}** (${Math.floor(bestBrush.brush.multiplier * 100)}% cooldown)`;
      } else {
        cooldownMessage += `\n💡 Buy brushes from the shop to reduce cooldown!`;
      }
      
      // Send cooldown as separate ephemeral message and maintain original embed
      try {
        // Send cooldown message as ephemeral
        await interaction.followUp({ 
          content: cooldownMessage,
          ephemeral: true
        });
        
        // Keep the original embed unchanged
        return;
      } catch (error) {
        if (error.code === 10015) {
          console.log('Unknown webhook (cooldown branch), skipping...');
          return;
        }
        throw error;
      }
    }
  
  // Get user's selected region
  const zoneName = user.currentZone || 'Jungle Ruins';
  
  const currentZone = await prisma.zone.findFirst({
    where: { name: zoneName },
    include: {
      zoneItems: {
        include: {
          item: true
        }
      }
    }
  });
  
  if (!currentZone) {
    try {
      return await interaction.editReply(`❌ Zone "${zoneName}" not found. Please run the database seed.`);
    } catch (error) {
      if (error.code === 10015) {
        console.log('Unknown webhook error in zone error, skipping...');
        return;
      }
      throw error;
    }
  }
  
  // Get user's best map for drop rate multiplier
  const bestMap = await getBestMap(user.id);
  const mapMultiplier = bestMap ? bestMap.map.dropMultiplier : 1.0;
  
  // Check for battle trigger (15% chance)
  const BattleSystem = require('./battle-system');
  let battleBeast = null;
  let battleTriggered = false;
  
  if (BattleSystem.shouldTriggerBattle()) {
    battleBeast = await BattleSystem.getRandomBeastForRegion(zoneName, user);
    battleTriggered = battleBeast !== null;
  }
  
  // Simulate exploration with dynamic loot system and map multiplier
  const explorationResult = await simulateExploration(currentZone, mapMultiplier);
  const foundItems = explorationResult.foundItems;
  const chest = explorationResult.chest;
  const chestItem = explorationResult.chestItem;
  
  // Calculate XP using new system
  const { calculateExplorationXP, calculateLevelFromXP, getZoneXPModifier } = require('./xp-system');
  const experienceGained = calculateExplorationXP(user.level, currentZone.name);
  const zoneModifier = getZoneXPModifier(currentZone.name);
  
  // Add regular items to user's inventory
  await addItemsToInventory(user.id, foundItems);
  
  // Handle chest if found
  let chestCoins = 0;
  if (chest && chestItem) {
    // Add chest item to inventory
    await addItemsToInventory(user.id, [chestItem]);
    
    // Add chest coins to user's balance
    chestCoins = chest.coinReward;
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: chestCoins } }
    });
  }
  
  // Update user experience and level using new system
  const newExperience = user.experience + experienceGained;
  const newLevel = calculateLevelFromXP(newExperience, currentZone.name);
  const levelUp = newLevel > user.level;
  
  await prisma.user.update({
    where: { id: user.id },
    data: {
      experience: newExperience,
      level: newLevel
    }
  });
  // Increment totalExplorations
  await prisma.user.update({
    where: { id: user.id },
    data: { totalExplorations: { increment: 1 } }
  });
  
  // Update last explore timestamp
  await updateLastExplore(user.id);
  
  // Create dynamic color based on rarity of items found
  let embedColor = '#ffaa00'; // Default orange
  if (foundItems.length > 0) {
    const hasMythic = foundItems.some(item => item.item.rarity === 'MYTHIC');
    const hasLegendary = foundItems.some(item => item.item.rarity === 'LEGENDARY');
    const hasRare = foundItems.some(item => item.item.rarity === 'RARE');
    
    if (hasMythic) embedColor = '#ff0000'; // Red for mythic
    else if (hasLegendary) embedColor = '#ffd700'; // Gold for legendary
    else if (hasRare) embedColor = '#0080ff'; // Blue for rare
    else embedColor = '#00ff00'; // Green for common/uncommon
  }
  
  // Add chest bonus to color
  if (chest && chestItem) {
    if (chestItem.item.rarity === 'MYTHIC') embedColor = '#ff0000';
    else if (chestItem.item.rarity === 'LEGENDARY') embedColor = '#ffd700';
    else if (chestItem.item.rarity === 'RARE') embedColor = '#0080ff';
  }

  // Create dynamic title based on results
  let title = `🔍 Exploring ${currentZone.name}`;
  if (chest && chestItem) {
    title = `💎 TREASURE HUNT - ${currentZone.name}`;
  } else if (foundItems.length > 0) {
    const hasMythic = foundItems.some(item => item.item.rarity === 'MYTHIC');
    const hasLegendary = foundItems.some(item => item.item.rarity === 'LEGENDARY');
    if (hasMythic) title = `🌟 MYTHIC DISCOVERY - ${currentZone.name}`;
    else if (hasLegendary) title = `👑 LEGENDARY FIND - ${currentZone.name}`;
    else title = `🗺️ EXPLORATION - ${currentZone.name}`;
  }

  // Create embed response
  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(title)
    .setDescription(`**${currentZone.description}**\n\n${foundItems.length > 0 ? '🎁 **Items discovered!**' : '🔍 **Exploration complete!**'}`)
    .addFields(
      { 
        name: '📊 Experience Gained', 
        value: `**+${experienceGained.toLocaleString()} XP** ${Math.floor(zoneModifier * 100)}% zone bonus`, 
        inline: true 
      },
      { 
        name: '⭐ Level Progress', 
        value: `**Level ${newLevel}**${levelUp ? ' 🎉' : ''}`, 
        inline: true 
      },
      { 
        name: '💰 Total Coins', 
        value: `**${user.coins.toLocaleString()}** coins`, 
        inline: true 
      }
    );
  
      // Add modifiers info to embed with enhanced visuals
      const bestBrush = await getBestBrush(user.id);
      let modifiersText = '';
      let hasModifiers = false;
      
      if (bestBrush) {
        const cooldownReduction = Math.floor((1 - bestBrush.brush.multiplier) * 100);
        modifiersText += `🖌️ **${bestBrush.brush.name}**\n└ ⚡ **${cooldownReduction}%** cooldown reduction\n`;
        hasModifiers = true;
      }
      
      if (bestMap) {
        const rarityIncrease = Math.floor((bestMap.map.dropMultiplier - 1) * 100);
        modifiersText += `🗺️ **${bestMap.map.name}**\n└ 💎 **${rarityIncrease}%** rarity boost`;
        hasModifiers = true;
      }
      
      if (hasModifiers) {
        embed.addFields({ 
          name: '⚡ Active Modifiers', 
          value: modifiersText, 
          inline: false 
        });
      }
  
  if (foundItems.length > 0) {
    // Sort items by rarity for better visual hierarchy
    const rarityOrder = { 'MYTHIC': 5, 'LEGENDARY': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
    const sortedItems = foundItems.sort((a, b) => rarityOrder[b.item.rarity] - rarityOrder[a.item.rarity]);
    
    const itemsList = sortedItems.map(foundItem => {
      const rarityName = foundItem.item.rarity.charAt(0) + foundItem.item.rarity.slice(1).toLowerCase();
      const quantityText = foundItem.quantity > 1 ? ` x**${foundItem.quantity}**` : '';
      return `${getItemEmoji(foundItem.item.name, foundItem.item.rarity)} **${foundItem.item.name}**${quantityText}\n└ *${rarityName}*`;
    }).join('\n\n');
    
    embed.addFields({ 
      name: `🎁 Items Found (${foundItems.length})`, 
      value: itemsList,
      inline: false 
    });
  } else {
    embed.addFields({ 
      name: '🎁 Items Found', 
      value: '🔍 *Nothing this time... Keep exploring!*', 
      inline: false 
    });
  }
  
  // Add chest information if found
  if (chest && chestItem) {
    const rarityName = chestItem.item.rarity.charAt(0) + chestItem.item.rarity.slice(1).toLowerCase();
    const quantityText = chestItem.quantity > 1 ? ` x**${chestItem.quantity}**` : '';
    
    embed.addFields(
      { 
        name: `${chest.emoji} ${chest.name.toUpperCase()} DISCOVERED!`, 
        value: `🎉 **You found a ${chest.name.toLowerCase()}!** 🎉`, 
        inline: false 
      },
      { 
        name: '📦 Chest Contents', 
        value: `${getItemEmoji(chestItem.item.name, chestItem.item.rarity)} **${chestItem.item.name}**${quantityText}\n└ *${rarityName}*\n\n💰 **${chestCoins.toLocaleString()} coins** added to your balance!`, 
        inline: false 
      }
    );
  }
  
  if (levelUp) {
    embed.addFields({ 
      name: '🎉 🎊 LEVEL UP! 🎊 🎉', 
      value: `🌟 **Congratulations! You reached level ${newLevel}!** 🌟\n\n🎯 *Your journey continues to grow stronger!*`, 
      inline: false 
    });
  }
  
  // Check for achievements
  const newlyCompleted = await AchievementSystem.checkAchievements(user.id);
  if (newlyCompleted.length > 0) {
    const achievementText = newlyCompleted.map(achievement => {
      let rewardText = '';
      if (achievement.rewardCoins > 0) rewardText += `💰 **${achievement.rewardCoins.toLocaleString()} coins**`;
      if (achievement.rewardXP > 0) rewardText += rewardText ? ` | ⭐ **${achievement.rewardXP.toLocaleString()} XP**` : `⭐ **${achievement.rewardXP.toLocaleString()} XP**`;
      if (achievement.rewardTitle) rewardText += rewardText ? ` | 👑 **${achievement.rewardTitle}**` : `👑 **${achievement.rewardTitle}**`;
      
      return `🏆 **${achievement.name}**\n└ ${achievement.description}\n└ **Rewards:** ${rewardText || 'None'}`;
    }).join('\n\n');
    
    embed.addFields({ 
      name: '🎉 🎊 ACHIEVEMENT UNLOCKED! 🎊 🎉', 
      value: achievementText, 
      inline: false 
    });
    
    // Add celebration emoji to the embed color
    embed.setColor('#00FF00'); // Green for celebration
  }

  // Check for challenges
  const ChallengeSystem = require('./challenge-system');
  const newlyCompletedChallenges = await ChallengeSystem.checkChallengeProgress(user.id, 'explore');
  if (newlyCompletedChallenges.length > 0) {
    const challengeText = newlyCompletedChallenges.map(challenge => {
      let rewardText = '';
      if (challenge.rewardCoins > 0) rewardText += `💰 **${challenge.rewardCoins.toLocaleString()} coins**`;
      if (challenge.rewardXP > 0) rewardText += rewardText ? ` | ⭐ **${challenge.rewardXP.toLocaleString()} XP**` : `⭐ **${challenge.rewardXP.toLocaleString()} XP**`;
      if (challenge.rewardTitle) rewardText += rewardText ? ` | 👑 **${challenge.rewardTitle}**` : `👑 **${challenge.rewardTitle}**`;
      
      return `🎯 **${challenge.name}**\n└ ${challenge.description}\n└ **Rewards:** ${rewardText || 'None'}`;
    }).join('\n\n');
    
    embed.addFields({ 
      name: '🎯 🏆 CHALLENGE COMPLETED! 🏆 🎯', 
      value: challengeText, 
      inline: false 
    });
  }

  // Check for hidden achievements
  const newlyDiscoveredHidden = await ChallengeSystem.checkHiddenAchievements(user.id);
  if (newlyDiscoveredHidden.length > 0) {
    const hiddenText = newlyDiscoveredHidden.map(achievement => {
      let rewardText = '';
      if (achievement.rewardCoins > 0) rewardText += `💰 **${achievement.rewardCoins.toLocaleString()} coins**`;
      if (achievement.rewardXP > 0) rewardText += rewardText ? ` | ⭐ **${achievement.rewardXP.toLocaleString()} XP**` : `⭐ **${achievement.rewardXP.toLocaleString()} XP**`;
      if (achievement.rewardTitle) rewardText += rewardText ? ` | 👑 **${achievement.rewardTitle}**` : `👑 **${achievement.rewardTitle}**`;
      
      return `🔍 **${achievement.name}**\n└ ${achievement.description}\n└ **Rewards:** ${rewardText || 'None'}`;
    }).join('\n\n');
    
    embed.addFields({ 
      name: '🔍 🎭 HIDDEN ACHIEVEMENT DISCOVERED! 🎭 🔍', 
      value: hiddenText, 
      inline: false 
    });
    
    // Purple color for hidden achievements
    embed.setColor('#800080');
  }
  
  // Add motivational footer based on results
  let footerText = 'Keep exploring to discover more treasures! 🔍';
  
  if (chest && chestItem) {
    footerText = 'Incredible find! Your luck is legendary! 💎';
  } else if (foundItems.length > 0) {
    const hasMythic = foundItems.some(item => item.item.rarity === 'MYTHIC');
    const hasLegendary = foundItems.some(item => item.item.rarity === 'LEGENDARY');
    const hasRare = foundItems.some(item => item.item.rarity === 'RARE');
    
    if (hasMythic) footerText = 'A MYTHIC discovery! You are truly blessed! 🌟';
    else if (hasLegendary) footerText = 'Legendary loot! Your collection grows stronger! 👑';
    else if (hasRare) footerText = 'Rare treasures found! Your skill is impressive! 🔵';
    else footerText = 'Good finds! Every item brings you closer to greatness! 💪';
  } else {
    footerText = 'No items this time, but the adventure continues! 🗺️';
  }
  
  embed.setFooter({ text: footerText });
  embed.setTimestamp();
  
  // Get updated user data with inventory to check if sell button should be shown
  const updatedUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      inventoryItems: {
        include: {
          item: true
        }
      }
    }
  });
  
  // If battle was triggered, show battle encounter instead of normal exploration results
  if (battleTriggered && battleBeast) {
    // Calculate beast stats once and store them
    const BattleSystem = require('./battle-system');
    const beastStats = BattleSystem.calculateBeastStats(battleBeast, user.level, user.currentZone);
    
    // Store the encounter beast and its stats for the battle
    if (!global.encounterBeasts) {
      global.encounterBeasts = new Map();
    }
    global.encounterBeasts.set(interaction.user.id, { beast: battleBeast, stats: beastStats });
    console.log('[DEBUG] Stored encounter beast - Name:', battleBeast.name, 'Rarity:', battleBeast.rarity, 'ID:', battleBeast.id);
    
    await showBattleEncounter(interaction, user, battleBeast, foundItems, chestCoins, beastStats);
  } else {
    await interaction.editReply({
      embeds: [embed],
      components: [createExploreButtons(updatedUser)]
    });
  }
  } catch (error) {
    console.error('Error in handleExplore:', error);
    
    try {
      // Since we already deferred the interaction, we can only edit it
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred while exploring.' });
      }
    } catch (err) {
      if (err.code === 10015) {
        console.log('Unknown webhook when sending error message');
      } else {
        throw err;
      }
    }
  }
}

async function handleCharacter(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });
    
    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    // Check and award retroactive skill points
    const SkillSystem = require('./skill-system');
    const retroactivePoints = await SkillSystem.awardRetroactiveSkillPoints(user.id);
    
    // Refresh user data after potential skill point award
    const updatedUser = await prisma.user.findUnique({
      where: { discordId: userId }
    });
    
    let description = `Welcome to your character menu, **${updatedUser.username}**!\n\nSelect an option below:`;
    
    // Add notification if retroactive skill points were awarded
    if (retroactivePoints > 0) {
      description += `\n\n🎉 **You were awarded ${retroactivePoints} retroactive skill points!**`;
    }
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('⚔️ Character Menu')
      .setDescription(description)
      .addFields(
        { name: '🎒 Inventory', value: 'View and manage your items', inline: true },
        { name: '⚔️ Skills', value: 'Manage your class and skills', inline: true },
        { name: '🔨 Crafting', value: 'Access crafting stations and recipes', inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();
    
    await interaction.editReply({
      embeds: [embed],
      components: createCharacterButtons()
    });
    
  } catch (error) {
    console.error('Error in character handler:', error);
    try {
      await interaction.editReply('❌ An error occurred while loading the character menu.');
    } catch (err) {
      if (err.code === 10015) {
        console.log('Unknown webhook when sending error message');
      } else {
        throw err;
      }
    }
  }
}

async function handleRegionsBosses(interaction) {
  try {
    await safeDeferUpdate(interaction);
    const userId = interaction.user.id;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });
    
    if (!user) {
      return interaction.editReply('❌ User not found.');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#8B4513')
      .setTitle('🗺️ Regions & Bosses')
      .setDescription(`Welcome to the regions and bosses menu, **${user.username}**!\n\nSelect an option below:`)
      .addFields(
        { name: '🗺️ Regions', value: 'View and change your current region', inline: true },
        { name: '🏰 Bosses', value: 'View boss information and cooldowns', inline: true }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();
    
    // Create buttons for regions and bosses
    const row1 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTON_IDS.REGION)
          .setLabel('🗺️ Regions')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(BUTTON_IDS.BOSSES_VIEW)
          .setLabel('🏰 Bosses')
          .setStyle(ButtonStyle.Primary)
      );

    const row2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(BUTTON_IDS.BACK)
          .setLabel('🔙 Back to Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2]
    });
    
  } catch (error) {
    console.error('Error in regions bosses handler:', error);
    await interaction.editReply('❌ An error occurred while loading the regions and bosses menu.');
  }
}

async function handleSkills(interaction) {
  try {
    await safeDeferUpdate(interaction);
    const userId = interaction.user.id;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });
    
    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    // Check and award retroactive skill points
    const SkillSystem = require('./skill-system');
    const retroactivePoints = await SkillSystem.awardRetroactiveSkillPoints(user.id);
    
    // Refresh user data after potential skill point award
    const updatedUser = await prisma.user.findUnique({
      where: { discordId: userId }
    });
    
    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: updatedUser.id },
      include: { skill: true }
    });

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('⚔️ Skills Overview')
      .setDescription(`**Class:** ${updatedUser.playerClass || 'Adventurer'}\n**Skill Points:** ${updatedUser.skillPoints || 0} available (${updatedUser.totalSkillPoints || 0} total earned)`)
      .addFields(
        {
          name: '📊 Skills Summary',
          value: `**Total Skills Learned:** ${userSkills.length}\n**Passive Skills:** ${userSkills.filter(us => us.skill.type === 'PASSIVE').length}\n**Active Skills:** ${userSkills.filter(us => us.skill.type === 'ACTIVE').length}\n**Ultimate Skills:** ${userSkills.filter(us => us.skill.type === 'ULTIMATE').length}`,
          inline: true
        }
      );

    // Get all available skills for user's class
    if (updatedUser.playerClass) {
      const playerClass = await prisma.playerClass.findUnique({
        where: { name: updatedUser.playerClass }
      });

      if (playerClass) {
        const classSkills = await prisma.classSkill.findMany({
          where: { classId: playerClass.id },
          include: { skill: true },
          orderBy: { unlockLevel: 'asc' }
        });

        // Group skills by branch
        const skillsByBranch = {};
        for (const cs of classSkills) {
          if (!skillsByBranch[cs.branch]) {
            skillsByBranch[cs.branch] = [];
          }
          const userSkill = userSkills.find(us => us.skillId === cs.skillId);
          const isLearned = !!userSkill;
          const currentLevel = userSkill ? userSkill.level : 0;
          const maxLevel = cs.skill.type === 'ACTIVE' ? 3 : 2;
          const canLearn = updatedUser.level >= cs.unlockLevel && (updatedUser.skillPoints || 0) > 0 && !isLearned;
          const canUpgrade = isLearned && currentLevel < maxLevel && (updatedUser.skillPoints || 0) >= (currentLevel + 1);
          
          skillsByBranch[cs.branch].push({
            ...cs.skill,
            branch: cs.branch,
            unlockLevel: cs.unlockLevel,
            isLearned,
            currentLevel,
            maxLevel,
            canLearn,
            canUpgrade
          });
        }

        // Create skills display for each branch
        const branches = Object.keys(skillsByBranch).filter(branch => branch !== 'General');
        
        for (let i = 0; i < branches.length; i++) {
          const branch = branches[i];
          const skills = skillsByBranch[branch];
          
          const isSelectedBranch = updatedUser.selectedBranch === branch;
          const branchStatus = isSelectedBranch ? '🌟' : '🌳';
          
          let skillsText = '';
          for (const skill of skills) {
            let status = '🔒';
            if (skill.isLearned) {
              status = skill.currentLevel === skill.maxLevel ? '🌟' : '✅';
            } else if (skill.canLearn) {
              status = '🔓';
            }
            
            const levelText = skill.isLearned ? ` (Level ${skill.currentLevel}/${skill.maxLevel})` : ` (Level ${skill.unlockLevel})`;
            skillsText += `${status} **${skill.name}**${levelText} - ${skill.description}\n`;
          }
          
          // Truncate if too long
          if (skillsText.length > 800) {
            skillsText = skillsText.substring(0, 800) + '...\n*[Use Class Menu for full details]*';
          }
          
          embed.addFields({
            name: `${branchStatus} ${branch} Skills`,
            value: skillsText || 'No skills available',
            inline: false
          });
          
          // Add divider between branches (except after the last one)
          if (i < branches.length - 1) {
            embed.addFields({
              name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
              value: '',
              inline: false
            });
          }
        }
      }
    }

    // Add divider after skills
    embed.addFields({
      name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      value: '',
      inline: false
    });

    // Add navigation info
    embed.addFields({
      name: '📋 How to Manage Skills',
      value: '• **Class Menu**: Detailed skill management and upgrades\n• **Skill Points**: Earn 2 points every 4 levels\n• **Branch Access**: Selected branch always available, others unlock at level 25+',
      inline: false
    });

    // Create navigation buttons
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('class_menu')
          .setLabel('🎭 Class Menu')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('equipped_skills')
          .setLabel('⚔️ Equipped Skills')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(BUTTON_IDS.CHARACTER_BACK)
          .setLabel('🔙 Back to Character')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
    
  } catch (error) {
    console.error('Error in skills handler:', error);
    await interaction.editReply('❌ An error occurred while loading skills.');
  }
}

async function handleProfile(interaction) {
  const discordId = interaction.user.id;
  
  // Get user data
  let user = await prisma.user.findUnique({
    where: { discordId: discordId },
    include: {
      inventoryItems: {
        include: {
          item: true
        }
      }
    }
  });
  
  if (!user) {
    await interaction.reply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      flags: 64 
    });
    return;
  }

  // Check and award retroactive skill points
  const SkillSystem = require('./skill-system');
  const retroactivePoints = await SkillSystem.awardRetroactiveSkillPoints(user.id);
  
  // Refresh user data after potential skill point award
  const updatedUser = await prisma.user.findUnique({
    where: { discordId: discordId },
    include: {
      inventoryItems: {
        include: {
          item: true
        }
      }
    }
  });
  
  await safeDeferUpdate(interaction);
  
  // Get equipped title
  const equippedTitle = await AchievementSystem.getEquippedTitle(updatedUser.id);
  
  // Calculate experience progress using new system
  const { calculateLevelProgress, getZoneXPModifier } = require('./xp-system');
      const levelProgress = calculateLevelProgress(updatedUser.experience, updatedUser.currentZone);
  const zoneModifier = getZoneXPModifier(updatedUser.currentZone || 'Jungle Ruins');
  
  // Create embed with title display
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`📊 ${updatedUser.username}'s Profile${equippedTitle ? ` | 👑 ${equippedTitle.name}` : ''}`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: '⭐ Level', value: `${levelProgress.currentLevel}`, inline: true },
      { name: '📊 Experience', value: `${updatedUser.experience.toLocaleString()} XP`, inline: true },
      { name: '💰 Coins', value: `${updatedUser.coins}`, inline: true },
      { name: '👑 Title', value: equippedTitle ? `**${equippedTitle.name}**\n${equippedTitle.description}` : 'No title equipped', inline: false },
      { name: '📈 Progress to Next Level', value: `${levelProgress.xpInLevel.toLocaleString()}/${levelProgress.xpForNextLevel.toLocaleString()} XP (${levelProgress.progress}%)`, inline: false },
      { name: '🗺️ Current Zone', value: `${updatedUser.currentZone || 'Jungle Ruins'} (${Math.floor(zoneModifier * 100)}% XP)`, inline: true },
      { name: '🎒 Items in Inventory', value: `${updatedUser.inventoryItems.length}`, inline: true },
      { name: '📅 Member Since', value: `<t:${Math.floor(updatedUser.createdAt.getTime() / 1000)}:R>`, inline: true }
    )
    .setTimestamp();
  
  // Show inventory summary
  if (updatedUser.inventoryItems.length > 0) {
    const { calculateDynamicValue } = require('./loot-system');
    const totalInventoryValue = updatedUser.inventoryItems.reduce((total, invItem) => {
      // Use Jungle Ruins as default since we don't track which zone items came from
      const dynamicValue = calculateDynamicValue(invItem.item.rarity, 'Jungle Ruins');
      return total + (dynamicValue.value * invItem.quantity);
    }, 0);
    
    const totalItems = updatedUser.inventoryItems.reduce((total, invItem) => total + invItem.quantity, 0);
    
    // Get top 3 most valuable items
    const topItems = updatedUser.inventoryItems
      .sort((a, b) => {
        const aValue = calculateDynamicValue(a.item.rarity, 'Jungle Ruins').value * a.quantity;
        const bValue = calculateDynamicValue(b.item.rarity, 'Jungle Ruins').value * b.quantity;
        return bValue - aValue;
      })
      .slice(0, 3);
    
    const topItemsList = topItems.map(invItem => {
      const dynamicValue = calculateDynamicValue(invItem.item.rarity, 'Jungle Ruins');
      const totalValue = dynamicValue.value * invItem.quantity;
      return `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity} (${totalValue} coins)`;
    }).join('\n');
    
    embed.addFields({ 
      name: '🎒 Inventory Summary', 
      value: `**${updatedUser.inventoryItems.length} types** • **${totalItems} items** • **${totalInventoryValue} coins**\n\n**Top Items:**\n${topItemsList}`,
      inline: false 
    });
  }
  
  await interaction.editReply({
    embeds: [embed],
    components: createProfileButtons()
  });
}

async function handleShop(interaction) {
  await safeDeferUpdate(interaction);
  
  const embed = new EmbedBuilder()
    .setColor('#ffd700')
    .setTitle('🛒 Relic Raider Shop')
    .setDescription('Welcome to the shop! Choose a category to browse items.')
    .addFields(
              { name: '🖌️ Brushes', value: 'Reduce your explore cooldown times', inline: true },
        { name: '🗺️ Maps', value: 'Increase drop chances for better items', inline: true },
      { name: '⚔️ Gear', value: 'Improve your exploration outcomes', inline: true },
      { name: '✨ Special Items', value: 'Unique and limited-time items', inline: true }
    )
    .setTimestamp();
  
  await interaction.editReply({
    embeds: [embed],
    components: [createShopButtons()]
  });
}

async function handleShopBrushes(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    
    // Get user
    let user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user) {
      await interaction.editReply({ 
        content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
        ephemeral: true 
      });
      return;
    }
  
  // Get all brushes
  const brushes = await prisma.brush.findMany({
    orderBy: { tier: 'asc' }
  });
  
  // Get user's owned brushes
  const userBrushes = await prisma.userBrush.findMany({
    where: { userId: user.id },
    include: { brush: true }
  });
  
  const ownedBrushIds = userBrushes.map(ub => ub.brush.id);
  
  const embed = new EmbedBuilder()
    .setColor('#ffd700')
            .setTitle('🖌️ Brushes Shop')
    .setDescription('Buy brushes to reduce your explore cooldown times!')
    .setTimestamp();
  
  // Find the best brush the user owns
  let bestOwnedBrush = null;
  if (userBrushes.length > 0) {
    bestOwnedBrush = userBrushes.reduce((best, current) => {
      return current.brush.tier > best.brush.tier ? current : best;
    });
  }

  for (const brush of brushes) {
    const cooldownReduction = Math.floor((1 - brush.multiplier) * 100);
    const isOwned = ownedBrushIds.includes(brush.id);
    // Use the actual price (no multiplier needed since we already reduced prices)
    const displayPrice = brush.price;
    const canAfford = user.coins >= displayPrice;
    
    // Check if this brush is inferior to the best owned brush
    const isInferior = bestOwnedBrush ? brush.tier <= bestOwnedBrush.brush.tier : false;
    
    let status = '';
    if (isOwned) {
      status = ' ✅ **OWNED**';
    } else if (!canAfford) {
      status = ' ❌ **CAN\'T AFFORD**';
    } else if (isInferior) {
      status = ' ⬇️ **INFERIOR**';
    }
    
    // Calculate exact cooldown time
    const exactCooldown = (brush.multiplier * 4).toFixed(1);
    
    embed.addFields({
                name: `${getItemEmoji(brush.name, 'COMMON')} ${brush.name} - ${displayPrice} coins${status}`,
      value: `${brush.description}\n⏰ **${cooldownReduction}% cooldown reduction** (${exactCooldown}s cooldown)`,
      inline: false
    });
  }
  

  
  // Create purchase buttons for brushes
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  // Create multiple rows of buttons (max 5 buttons per row)
  const buttonRows = [];
  let currentRow = new ActionRowBuilder();
  let buttonCount = 0;
  
  for (const brush of brushes) {
    const isOwned = ownedBrushIds.includes(brush.id);
    // Use the actual price (no multiplier needed since we already reduced prices)
    const displayPrice = brush.price;
    const canAfford = user.coins >= displayPrice;
    
    // Check if this brush is inferior to the best owned brush
    const isInferior = bestOwnedBrush ? brush.tier <= bestOwnedBrush.brush.tier : false;
    
    const button = new ButtonBuilder()
      .setCustomId(`buy_${brush.id}`)
      .setLabel(`${brush.name.split(' ')[0]} (${displayPrice})`)
      .setStyle(canAfford && !isOwned && !isInferior ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(isOwned || !canAfford || isInferior);
    
    currentRow.addComponents(button);
    buttonCount++;
    
    // Create new row after 5 buttons
    if (buttonCount % 5 === 0) {
      buttonRows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
  }
  
  // Add the last row if it has buttons
  if (currentRow.components.length > 0) {
    buttonRows.push(currentRow);
  }
  
  // Add navigation buttons
  const navigationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('shop')
        .setLabel('🛒 Back to Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  buttonRows.push(navigationButtons);
  
  await interaction.editReply({
    embeds: [embed],
    components: buttonRows
  });
  } catch (error) {
    console.error('Error in handleShopBrushes:', error);
    
    // Check if interaction has already been replied to or deferred
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ An error occurred while loading the brushes shop. Please try again.', 
        ephemeral: true 
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ 
        content: '❌ An error occurred while loading the brushes shop. Please try again.' 
      });
    } else if (interaction.replied) {
      await interaction.followUp({ 
        content: '❌ An error occurred while loading the brushes shop. Please try again.', 
        ephemeral: true 
      });
    }
  }
}

async function handleShopMaps(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    
    // Get user
    let user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
  
  if (!user) {
    await interaction.editReply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      ephemeral: true 
    });
    return;
  }
  
  // Get all maps
  const maps = await prisma.map.findMany({
    orderBy: { tier: 'asc' }
  });
  
  // Get user's owned maps
  const userMaps = await prisma.userMap.findMany({
    where: { userId: user.id },
    include: { map: true }
  });
  
  const ownedMapIds = userMaps.map(um => um.map.id);
  
  const embed = new EmbedBuilder()
    .setColor('#4CAF50')
            .setTitle('🗺️ Maps Shop')
    .setDescription('Buy maps to increase your chances of finding better items!')
    .setTimestamp();
  
  // Find the best map the user owns
  let bestOwnedMap = null;
  if (userMaps.length > 0) {
    bestOwnedMap = userMaps.reduce((best, current) => {
      return current.map.tier > best.map.tier ? current : best;
    });
  }

  for (const map of maps) {
    const dropIncrease = Math.floor((map.dropMultiplier - 1) * 100);
    const isOwned = ownedMapIds.includes(map.id);
    const canAfford = user.coins >= map.price;
    
    // Check if this map is worse than what the user already owns
    const isWorseThanOwned = bestOwnedMap && map.tier <= bestOwnedMap.map.tier && !isOwned;
    
    let status = '';
    if (isOwned) {
      status = ' ✅ **OWNED**';
    } else if (isWorseThanOwned) {
      status = ' ✅ **OWNED**';
    } else if (!canAfford) {
      status = ' ❌ **CAN\'T AFFORD**';
    }
    
    embed.addFields({
              name: `${getItemEmoji(map.name, 'COMMON')} ${map.name} - ${map.price.toLocaleString()} coins${status}`,
      value: `${map.description}\n📈 **${dropIncrease}% rarity boost**`,
      inline: false
    });
  }
  
  // Create purchase buttons for maps
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  // Create multiple rows of buttons (max 5 buttons per row)
  const buttonRows = [];
  let currentRow = new ActionRowBuilder();
  let buttonCount = 0;
  
  for (const map of maps) {
    const isOwned = ownedMapIds.includes(map.id);
    const canAfford = user.coins >= map.price;
    
    // Check if this map is worse than what the user already owns
    const isWorseThanOwned = bestOwnedMap && map.tier <= bestOwnedMap.map.tier && !isOwned;
    
    // Skip buttons for maps that are worse than what the user owns
    if (isWorseThanOwned) {
      continue;
    }
    
    const button = new ButtonBuilder()
      .setCustomId(`buy_${map.id}`)
      .setLabel(`${map.name} (${map.price.toLocaleString()})`)
      .setStyle(canAfford && !isOwned ? ButtonStyle.Success : ButtonStyle.Secondary)
      .setDisabled(isOwned || !canAfford);
    
    currentRow.addComponents(button);
    buttonCount++;
    
    // Create new row after 5 buttons
    if (buttonCount % 5 === 0) {
      buttonRows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
  }
  
  // Add the current row if it has buttons
  if (currentRow.components.length > 0) {
    buttonRows.push(currentRow);
  }
  
  // Add navigation buttons
  const navigationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('shop')
        .setLabel('🛒 Back to Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  buttonRows.push(navigationButtons);
  
  await interaction.editReply({
    embeds: [embed],
    components: buttonRows
  });
  } catch (error) {
    console.error('Error in handleShopMaps:', error);
    
    // Check if interaction has already been replied to or deferred
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ An error occurred while loading the shop. Please try again.', 
        ephemeral: true 
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ 
        content: '❌ An error occurred while loading the shop. Please try again.' 
      });
    } else if (interaction.replied) {
      await interaction.followUp({ 
        content: '❌ An error occurred while loading the shop. Please try again.', 
        ephemeral: true 
      });
    }
  }
}

async function handleShopGear(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('⚔️ Gear Shop')
      .setDescription('Gear upgrades coming soon! This feature is under development.')
      .setTimestamp();
    
    // Create navigation buttons with return to shop
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const navigationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('shop')
        .setLabel('🛒 Back to Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [navigationButtons]
  });
  } catch (error) {
    console.error('Error in handleShopGear:', error);
    // Don't try to send error responses to avoid interaction acknowledgment issues
  }
}

async function handleShopSpecial(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('✨ Special Items Shop')
      .setDescription('Special items coming soon! This feature is under development.')
      .setTimestamp();
    
    // Create navigation buttons with return to shop
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const navigationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('shop')
        .setLabel('🛒 Back to Shop')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [navigationButtons]
  });
  } catch (error) {
    console.error('Error in handleShopSpecial:', error);
    // Don't try to send error responses to avoid interaction acknowledgment issues
  }
}

async function handleRegion(interaction) {
  await safeDeferUpdate(interaction);
  
  const discordId = interaction.user.id;
  
  // Get user to show their current level
  const user = await prisma.user.findUnique({
    where: { discordId: discordId }
  });
  
  // Get XP modifiers for zones
  const { getAllZoneModifiers, calculateLevelFromXP } = require('./xp-system');
  const zoneModifiers = getAllZoneModifiers();
  const currentLevel = calculateLevelFromXP(user?.experience || 0, user?.currentZone);
  
  // Get value modifiers for zones
  const { getAllZoneModifiers: getAllXPModifiers } = require('./xp-system');
  const { ZONE_VALUE_MODIFIERS } = require('./loot-system');
  const xpModifiers = getAllXPModifiers();
  
  // Create a more immersive region selection with world map
  const embed = new EmbedBuilder()
    .setColor('#4CAF50')
    .setTitle('🗺️ World of Relic Raider')
    .setDescription(`**Choose your exploration region** (You are level ${currentLevel})\n\n*Navigate the world map below to select your destination. Each region offers unique treasures and challenges.*`)
    .setImage('https://i.imgur.com/RuIDSix.png')
    .setFooter({ text: '🌍 Explore the world map to discover new regions and treasures!' })
    .addFields(
      { 
        name: '🌍 **World Map Legend**', 
        value: `**Starting Zones:**\n🌿 Jungle Ruins (Level 1-10) • 100% XP • 100% Value\n❄️ Frozen Crypt (Level 11-20) • 120% XP • 130% Value\n\n**Intermediate Zones:**\n🏜️ Mirage Dunes (Level 21-30) • 150% XP • 160% Value\n🌊 Sunken Temple (Level 31-40) • 180% XP • 200% Value\n🌋 Volcanic Forge (Level 41-50) • 200% XP • 250% Value\n\n**Advanced Zones:**\n🦇 Twilight Moor (Level 51-60) • 220% XP • 300% Value\n☁️ Skyreach Spires (Level 61-70) • 250% XP • 350% Value\n⚫ Obsidian Wastes (Level 71-80) • 280% XP • 400% Value\n✨ Astral Caverns (Level 81-90) • 300% XP • 450% Value\n👑 Ethereal Sanctum (Level 91-100) • 350% XP • 500% Value`, 
        inline: false 
      }
    )
    .setTimestamp();
  
  // Define zone level requirements
  const zoneRequirements = {
    'Jungle Ruins': 1,
    'Frozen Crypt': 11,
    'Mirage Dunes': 21,
    'Sunken Temple': 31,
    'Volcanic Forge': 41,
    'Twilight Moor': 51,
    'Skyreach Spires': 61,
    'Obsidian Wastes': 71,
    'Astral Caverns': 81,
    'Ethereal Sanctum': 91
  };

  // Get user's current zone
  const currentZone = user?.currentZone || 'Jungle Ruins';

  // Helper function to determine button style
  const getButtonStyle = (zoneName) => {
    if (currentZone === zoneName) {
      return ButtonStyle.Success; // Green for active zone
    }
    return currentLevel >= zoneRequirements[zoneName] ? ButtonStyle.Primary : ButtonStyle.Secondary;
  };

  // Create region selection buttons with level requirements and active zone highlighting
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('region_jungle_ruins')
        .setLabel('🌿 Jungle Ruins')
        .setStyle(getButtonStyle('Jungle Ruins'))
        .setDisabled(currentLevel < zoneRequirements['Jungle Ruins']),
      new ButtonBuilder()
        .setCustomId('region_frozen_crypt')
        .setLabel('❄️ Frozen Crypt')
        .setStyle(getButtonStyle('Frozen Crypt'))
        .setDisabled(currentLevel < zoneRequirements['Frozen Crypt']),
      new ButtonBuilder()
        .setCustomId('region_mirage_dunes')
        .setLabel('🏜️ Mirage Dunes')
        .setStyle(getButtonStyle('Mirage Dunes'))
        .setDisabled(currentLevel < zoneRequirements['Mirage Dunes']),
      new ButtonBuilder()
        .setCustomId('region_sunken_temple')
        .setLabel('🌊 Sunken Temple')
        .setStyle(getButtonStyle('Sunken Temple'))
        .setDisabled(currentLevel < zoneRequirements['Sunken Temple']),
      new ButtonBuilder()
        .setCustomId('region_volcanic_forge')
        .setLabel('🌋 Volcanic Forge')
        .setStyle(getButtonStyle('Volcanic Forge'))
        .setDisabled(currentLevel < zoneRequirements['Volcanic Forge'])
    );
  
  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('region_twilight_moor')
        .setLabel('🦇 Twilight Moor')
        .setStyle(getButtonStyle('Twilight Moor'))
        .setDisabled(currentLevel < zoneRequirements['Twilight Moor']),
      new ButtonBuilder()
        .setCustomId('region_skyreach_spires')
        .setLabel('☁️ Skyreach Spires')
        .setStyle(getButtonStyle('Skyreach Spires'))
        .setDisabled(currentLevel < zoneRequirements['Skyreach Spires']),
      new ButtonBuilder()
        .setCustomId('region_obsidian_wastes')
        .setLabel('⚫ Obsidian Wastes')
        .setStyle(getButtonStyle('Obsidian Wastes'))
        .setDisabled(currentLevel < zoneRequirements['Obsidian Wastes']),
      new ButtonBuilder()
        .setCustomId('region_astral_caverns')
        .setLabel('✨ Astral Caverns')
        .setStyle(getButtonStyle('Astral Caverns'))
        .setDisabled(currentLevel < zoneRequirements['Astral Caverns']),
      new ButtonBuilder()
        .setCustomId('region_ethereal_sanctum')
        .setLabel('👑 Ethereal Sanctum')
        .setStyle(getButtonStyle('Ethereal Sanctum'))
        .setDisabled(currentLevel < zoneRequirements['Ethereal Sanctum'])
    );
  
  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [row1, row2, row3]
  });
}

async function handleInventory(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    
    // Get user first, then their inventory
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user) {
      await interaction.editReply({ 
        content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
        ephemeral: true 
      });
      return;
    }
  
  // Get user's inventory and equipment
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: { item: true }
  });
  
  const userEquipment = await prisma.userEquipment.findMany({
    where: { userId: user.id },
    include: { equipment: true }
  });
  
  const embed = new EmbedBuilder()
    .setColor('#9C27B0')
    .setTitle('🎒 Inventory Management')
    .setDescription('Select a category to manage your items:')
    .setTimestamp();
  
  // Calculate totals for each category
  const relicMaterials = inventoryItems.filter(item => 
    !item.item.name.toLowerCase().includes('beast')
  );
  
  const beastMaterials = inventoryItems.filter(item => 
    item.item.name.toLowerCase().includes('beast')
  );
  
  const equipment = userEquipment.filter(ue => ue.quantity > 0);
  
  embed.addFields(
    {
      name: '🏺 Relic Materials',
      value: `${relicMaterials.length} different types\nTotal items: ${relicMaterials.reduce((sum, item) => sum + item.quantity, 0)}`,
      inline: true
    },
    {
      name: '🦴 Beast Materials', 
      value: `${beastMaterials.length} different types\nTotal items: ${beastMaterials.reduce((sum, item) => sum + item.quantity, 0)}`,
      inline: true
    },
    {
      name: '⚔️ Equipment',
      value: `${equipment.length} pieces owned\nEquipped: ${equipment.filter(ue => ue.isEquipped).length}`,
      inline: true
    }
  );
  
  // Create category selection buttons
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const categoryButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('inventory_relics')
        .setLabel('Relic Materials')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🏺'),
      new ButtonBuilder()
        .setCustomId('inventory_beasts')
        .setLabel('Beast Materials')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🦴'),
      new ButtonBuilder()
        .setCustomId('inventory_equipment')
        .setLabel('Equipment')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚔️')
    );
  
  const actionButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('sell_items')
        .setLabel('💰 Sell Items')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('inventory_craft')
        .setLabel('🔨 Craft')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [categoryButtons, actionButtons]
  });
  } catch (error) {
    console.error('Error in handleInventory:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading inventory.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleMenu(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const username = interaction.user.username;
    
    // Get user
    let user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          discordId: discordId,
          username: username,
          guildId: interaction.guildId || null,
          level: 1,
          experience: 0,
          coins: 0,
          tutorialCompleted: false
        }
      });
    }

    // Check if user needs tutorial
    const TutorialSystem = require('./tutorial-system');
    const needsTutorial = await TutorialSystem.needsTutorial(user.id);
    
    if (needsTutorial) {
      const { embed, components } = await TutorialSystem.startTutorial(interaction, user);
      return await interaction.editReply({ embeds: [embed], components: components });
    }

    // Calculate XP progress to next level
    const { calculateLevelProgress } = require('./xp-system');
    const levelProgress = calculateLevelProgress(user.experience, user.currentZone);
    
    // Get current region
    const currentZone = user.currentZone || 'Jungle Ruins';
    
    // Get active challenges and their completion status
    const ChallengeSystem = require('./challenge-system');
    const activeChallenges = await ChallengeSystem.getActiveChallenges(user.id);
    const completedChallenges = activeChallenges.filter(c => c.userProgress?.isCompleted).length;
    const totalChallenges = activeChallenges.length;
    
    // Create progress bar for level
    const progressBar = createProgressBar(levelProgress.progress);
    
    const embed = new EmbedBuilder()
      .setColor('#ffd700')
      .setTitle('🏴‍☠️ Relic Raider Hub')
      .setDescription(`Welcome back, **${user.username}**! Ready to hunt for ancient treasures?`)
      .addFields(
        { 
          name: '⭐ Level Progress', 
          value: `**Level ${user.level}** (${levelProgress.xpInLevel.toLocaleString()}/${levelProgress.xpForNextLevel.toLocaleString()} XP)\n${progressBar} **${levelProgress.progress}%**\n**${(levelProgress.xpForNextLevel - levelProgress.xpInLevel).toLocaleString()} XP to next level**`, 
          inline: false 
        },
        { 
          name: '💰 Coins', 
          value: `**${user.coins.toLocaleString()}**`, 
          inline: true 
        },
        { 
          name: '📊 Total Experience', 
          value: `**${user.experience.toLocaleString()} XP**`, 
          inline: true 
        },
        {
          name: '🗺️ Current Region',
          value: `**${currentZone}**`,
          inline: true
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // Add challenge completion status if there are active challenges
    if (totalChallenges > 0) {
      embed.addFields({
        name: '🎯 Active Challenges',
        value: `**${completedChallenges}/${totalChallenges}** completed`,
        inline: true
      });
    }

    await interaction.editReply({
      embeds: [embed],
      components: [createMainMenuButtonsWithBosses()]
    });
  } catch (error) {
    console.error('Error in handleMenu:', error);
    
    try {
      // Since we already deferred the interaction, we can only edit it
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({ content: '❌ An error occurred while loading the menu.' });
      }
    } catch (replyError) {
      console.error('Error sending error response in handleMenu:', replyError);
    }
  }
}



async function handleTitles(interaction) {
  // Redirect to the proper titles view
  await handleTitlesView(interaction);
}

async function handlePurchase(interaction, customId) {
  try {
    await safeDeferUpdate(interaction);
    
    const itemId = customId.replace('buy_', '');
    const discordId = interaction.user.id;
    
    // Get user
    let user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user) {
      await interaction.editReply({ 
        content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
        ephemeral: true 
      });
      return;
    }
  
  // Get the brush or map
  let brush = await prisma.brush.findUnique({
    where: { id: itemId }
  });
  
  let map = null;
  if (!brush) {
    map = await prisma.map.findUnique({
      where: { id: itemId }
    });
  }
  
  if (!brush && !map) {
    return interaction.editReply('❌ Item not found in shop!');
  }
  
  const item = brush || map;
  const isMap = !!map;
  
  // Use the actual price (no multiplier needed since we already reduced prices)
  const actualPrice = item.price;
  
  // Check if user has enough coins
  if (user.coins < actualPrice) {
    return interaction.editReply(`❌ You don't have enough coins! You need ${actualPrice.toLocaleString()} coins, but you have ${user.coins} coins.`);
  }
  
  // Check if user already owns this item
  if (isMap) {
    const existingMap = await prisma.userMap.findUnique({
      where: {
        userId_mapId: {
          userId: user.id,
          mapId: map.id
        }
      }
    });
    
    if (existingMap) {
      return interaction.editReply(`❌ You already own a ${map.name}!`);
    }
  } else {
    const existingBrush = await prisma.userBrush.findUnique({
      where: {
        userId_brushId: {
          userId: user.id,
          brushId: brush.id
        }
      }
    });
    
    if (existingBrush) {
      return interaction.editReply(`❌ You already own a ${brush.name}!`);
    }
  }
  
  // Purchase the item
  const transactionData = [
    // Deduct coins from user
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { decrement: actualPrice } }
    })
  ];
  
  if (isMap) {
    transactionData.push(
      // Add map to user's collection
      prisma.userMap.create({
        data: {
          userId: user.id,
          mapId: map.id
        }
      })
    );
  } else {
    transactionData.push(
      // Add brush to user's collection
      prisma.userBrush.create({
        data: {
          userId: user.id,
          brushId: brush.id
        }
      })
    );
  }
  
  await prisma.$transaction(transactionData);
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('🛒 Purchase Successful!')
    .setDescription(`You bought a **${item.name}** for ${actualPrice.toLocaleString()} coins!`)
    .addFields(
      { name: '💰 Remaining Coins', value: `${user.coins - actualPrice}`, inline: true }
    )
    .setTimestamp();
  
  if (isMap) {
    const dropIncrease = Math.floor((map.dropMultiplier - 1) * 100);
    embed.addFields(
      { name: '🗺️ Map Effect', value: `${dropIncrease}% drop rate increase`, inline: true }
    );
  } else {
    const cooldownReduction = Math.floor((1 - brush.multiplier) * 100);
    const newCooldown = Math.floor(brush.multiplier * 4);
    embed.addFields(
      { name: '🖌️ Brush Effect', value: `${cooldownReduction}% cooldown reduction`, inline: true },
      { name: '⏰ New Cooldown', value: `${newCooldown} seconds`, inline: true }
    );
  }
  
  await interaction.editReply({
    embeds: [embed],
    components: [createNavigationButtons(false)]
  });
  } catch (error) {
    console.error('Error in handlePurchase:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while processing your purchase.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleRegionSelect(interaction, customId) {
  const discordId = interaction.user.id;
  const regionName = customId.replace('region_', '').replace(/_/g, ' ');
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { discordId: discordId }
  });
  
  if (!user) {
    await interaction.reply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      ephemeral: true 
    });
    return;
  }
  
  await interaction.deferUpdate();
  
  // Get the selected zone
  const zone = await prisma.zone.findFirst({
    where: { name: regionName },
    include: {
      zoneItems: {
        include: {
          item: true
        }
      }
    }
  });
  
  if (!zone) {
    await interaction.editReply({
      content: `❌ Region "${regionName}" not found. Please run the database seed.`,
      embeds: [],
      components: []
    });
    return;
  }
  
  // Check if user meets level requirements
  if (user.level < zone.minLevel) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('❌ Level Requirement Not Met')
      .setDescription(`You need to be level ${zone.minLevel} to explore ${zone.name}.`)
      .addFields(
        { name: 'Your Level', value: `${user.level}`, inline: true },
        { name: 'Required Level', value: `${zone.minLevel}`, inline: true },
        { name: 'Levels Needed', value: `${zone.minLevel - user.level}`, inline: true }
      )
      .setTimestamp();
    
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const navigationButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('region')
          .setLabel('🗺️ Back to Regions')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🔙 Back to Menu')
          .setStyle(ButtonStyle.Secondary)
      );
    
    await interaction.editReply({
      embeds: [embed],
      components: [navigationButtons]
    });
    return;
  }
  
  // Save the user's zone selection
  await prisma.user.update({
    where: { id: user.id },
    data: { currentZone: zone.name }
  });
  
  // Show zone info and exploration button
  const embed = new EmbedBuilder()
    .setColor('#4CAF50')
    .setTitle(`🗺️ ${zone.name} - Selected!`)
    .setDescription(zone.description)
    .addFields(
      { name: '📊 Level Range', value: `${zone.minLevel}-${zone.maxLevel}`, inline: true },
      { name: '⭐ Your Level', value: `${user.level}`, inline: true },
      { name: '🎁 Available Items', value: `${zone.zoneItems.length} different items`, inline: true },
      { name: '✅ Status', value: 'This is now your active exploration zone!', inline: false }
    )
    .setTimestamp();
  
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const actionButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('explore')
        .setLabel('🔍 Explore This Region')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('region')
        .setLabel('🗺️ Back to Regions')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [actionButtons]
  });
}

async function handleClose(interaction) {
  await interaction.deferUpdate();
  
  await interaction.editReply({
    content: '✅ Menu closed.',
    embeds: [],
    components: []
  });
}

async function handleSellItems(interaction) {
  const discordId = interaction.user.id;
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { discordId: discordId }
  });
  
  if (!user) {
    await interaction.reply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      ephemeral: true 
    });
    return;
  }
  
  await interaction.deferUpdate();
  
  // Get user's inventory
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: { item: true }
  });
  
  if (inventoryItems.length === 0) {
    // Send ephemeral message that will disappear when user navigates away
    await interaction.followUp({
      content: '❌ You have no items to sell!',
      ephemeral: true
    });
    return;
  }
  
  // Group items by category
  const categories = groupInventoryByCategory(inventoryItems);
  
  // Create embed showing categories
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('💰 Sell Items')
    .setDescription('Choose a category to sell items from:')
    .setTimestamp();
  
  // Calculate overall totals
  const { calculateDynamicValue } = require('./loot-system');
  let totalInventoryValue = 0;
  let totalInventoryItems = 0;
  
  for (const [categoryKey, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    
    const category = ITEM_CATEGORIES[categoryKey];
    const totalItems = items.reduce((sum, invItem) => sum + invItem.quantity, 0);
    const totalValue = items.reduce((sum, invItem) => {
      const dynamicValue = calculateDynamicValue(invItem.item.rarity, 'Jungle Ruins');
      return sum + (dynamicValue.value * invItem.quantity);
    }, 0);
    
    totalInventoryValue += totalValue;
    totalInventoryItems += totalItems;
    
    embed.addFields({
      name: `${category.emoji} ${category.name}`,
      value: `${items.length} types • ${totalItems} total • ${totalValue} coins`,
      inline: true
    });
  }
  
  // Add summary field
  embed.addFields({
    name: '💰 Summary',
    value: `**${totalInventoryItems} items** worth **${totalInventoryValue} coins** total`,
    inline: false
  });
  
  // Create category buttons with return to inventory
  const categoryButtons = createSellCategoryButtons(categories);
  
  // Add return to inventory button to the last row
  if (categoryButtons.length > 0) {
    const lastRow = categoryButtons[categoryButtons.length - 1];
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    // Remove the existing back button and add both inventory and menu buttons
    lastRow.components = lastRow.components.filter(button => button.data.custom_id !== 'back');
    lastRow.addComponents(
      new ButtonBuilder()
        .setCustomId('inventory')
        .setLabel('🎒 Back to Inventory')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  
  await interaction.editReply({
    embeds: [embed],
    components: categoryButtons
  });
}

async function handleSellCategory(interaction, customId) {
  const discordId = interaction.user.id;
  const categoryKey = customId.replace('sell_category_', '');
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { discordId: discordId }
  });
  
  if (!user) {
    await interaction.reply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      ephemeral: true 
    });
    return;
  }
  
  await interaction.deferUpdate();
  
  // Get user's inventory
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: { item: true }
  });
  
  // Group items by category and get the specific category
  const categories = groupInventoryByCategory(inventoryItems);
  const categoryItems = categories[categoryKey] || [];
  
  if (categoryItems.length === 0) {
    await interaction.followUp({
      content: '❌ No items found in this category!',
      ephemeral: true
    });
    return;
  }
  
  const category = ITEM_CATEGORIES[categoryKey];
  
  // Create embed showing items in category
  const embed = new EmbedBuilder()
    .setColor(category.color)
    .setTitle(`${category.emoji} ${category.name} - Items to Sell`)
    .setDescription(category.description)
    .setTimestamp();
  
  // Sort items by rarity and value for better organization
  const rarityOrder = { 'MYTHIC': 5, 'LEGENDARY': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
  
  
  const sortedItems = categoryItems.sort((a, b) => {
    const aRarity = rarityOrder[a.item.rarity] || 0;
    const bRarity = rarityOrder[b.item.rarity] || 0;
    if (aRarity !== bRarity) return bRarity - aRarity;
    
    const { calculateDynamicValue } = require('./loot-system');
    const aValue = calculateDynamicValue(a.item.rarity, 'Jungle Ruins').value * a.quantity;
    const bValue = calculateDynamicValue(b.item.rarity, 'Jungle Ruins').value * b.quantity;
    return bValue - aValue;
  });
  
  // Create compact item list
  const itemsList = sortedItems.map(invItem => {
    const { calculateDynamicValue } = require('./loot-system');
    const dynamicValue = calculateDynamicValue(invItem.item.rarity, 'Jungle Ruins');
    const totalValue = dynamicValue.value * invItem.quantity;
    return `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity} (${totalValue} coins)`;
  }).join('\n');
  
  // Truncate itemsList if it's too long for Discord embed field (1024 character limit)
  const maxLength = 1000; // Leave some buffer
  let truncatedItemsList = itemsList;
  let truncatedCount = 0;
  
  if (itemsList.length > maxLength) {
    // Find the last complete item entry that fits within the limit
    const lines = itemsList.split('\n');
    let currentLength = 0;
    const truncatedLines = [];
    
    for (const line of lines) {
      if (currentLength + line.length + 1 <= maxLength) {
        truncatedLines.push(line);
        currentLength += line.length + 1; // +1 for newline
      } else {
        break;
      }
    }
    
    truncatedItemsList = truncatedLines.join('\n');
    truncatedCount = lines.length - truncatedLines.length;
  }
  
  embed.addFields({
    name: '🎒 Items to Sell',
    value: truncatedItemsList + (truncatedCount > 0 ? `\n\n*... and ${truncatedCount} more items*` : ''),
    inline: false
  });
  
  // Calculate total value for the category
  const { calculateDynamicValue } = require('./loot-system');
  let totalValue = 0;
  let totalItems = 0;
  
  for (const invItem of categoryItems) {
    const dynamicValue = calculateDynamicValue(invItem.item.rarity);
    totalValue += dynamicValue.value * invItem.quantity;
    totalItems += invItem.quantity;
  }
  
  // Create category sell button and navigation buttons
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`sell_all_category_${categoryKey}`)
        .setLabel(`💰 Sell All ${category.name} (${totalValue} coins)`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('sell_items')
        .setLabel('💰 Back to Categories')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('inventory')
        .setLabel('🎒 Back to Inventory')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  const allComponents = [actionRow];
  
  await interaction.editReply({
    embeds: [embed],
    components: allComponents
  });
}

async function handleSellSingleItem(interaction, customId) {
  const discordId = interaction.user.id;
  const itemId = customId.replace('sell_item_', '');
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { discordId: discordId }
  });
  
  if (!user) {
    await interaction.reply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      ephemeral: true 
    });
    return;
  }
  
  await interaction.deferUpdate();
  
  // Get the inventory item
  const inventoryItem = await prisma.inventoryItem.findUnique({
    where: {
      userId_itemId: {
        userId: user.id,
        itemId: itemId
      }
    },
    include: { item: true }
  });
  
  if (!inventoryItem) {
    await interaction.followUp({
      content: '❌ Item not found in your inventory!',
      ephemeral: true
    });
    return;
  }
  
  // Calculate dynamic value based on rarity
  const { calculateDynamicValue } = require('./loot-system');
  const dynamicValue = calculateDynamicValue(inventoryItem.item.rarity, 'Jungle Ruins');
  const totalValue = dynamicValue.value * inventoryItem.quantity;
  
  await prisma.$transaction([
    // Add coins to user
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: totalValue } }
    }),
    // Remove item from inventory
    prisma.inventoryItem.delete({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId: itemId
        }
      }
    })
  ]);
  

  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('💰 Sale Successful!')
    .setDescription(`You sold ${inventoryItem.quantity}x ${getItemEmoji(inventoryItem.item.name, inventoryItem.item.rarity)} **${inventoryItem.item.name}** for ${totalValue} coins!`)
    .addFields(
      { name: '📦 Items Sold', value: `${inventoryItem.quantity}x ${inventoryItem.item.name}`, inline: true },
      { name: '💰 Value per Item', value: `${inventoryItem.item.value} coins`, inline: true },
      { name: '💎 Total Earned', value: `${totalValue} coins`, inline: true },
      { name: '💰 New Balance', value: `${user.coins + totalValue} coins`, inline: false }
    )
    .setTimestamp();
  
  // Create navigation buttons
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const navigationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('sell_items')
        .setLabel('💰 Sell More Items')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('inventory')
        .setLabel('🎒 Back to Inventory')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [navigationButtons]
  });
}

async function handleSellAllCategory(interaction, customId) {
  const discordId = interaction.user.id;
  const categoryKey = customId.replace('sell_all_category_', '');
  
  // Get user
  const user = await prisma.user.findUnique({
    where: { discordId: discordId }
  });
  
  if (!user) {
    await interaction.reply({ 
      content: '❌ You need to start your adventure first! Use `/raid` to begin.', 
      ephemeral: true 
    });
    return;
  }
  
  await interaction.deferUpdate();
  
  // Get user's inventory
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { userId: user.id },
    include: { item: true }
  });
  
  // Group items by category and get the specific category
  const categories = groupInventoryByCategory(inventoryItems);
  const categoryItems = categories[categoryKey] || [];
  
  if (categoryItems.length === 0) {
    await interaction.followUp({
      content: '❌ No items found in this category!',
      ephemeral: true
    });
    return;
  }
  
  const category = ITEM_CATEGORIES[categoryKey];
  
  // Calculate total value and prepare for sale
  const { calculateDynamicValue } = require('./loot-system');
  let totalValue = 0;
  let totalItems = 0;
  const soldItems = [];
  
  for (const invItem of categoryItems) {
    const dynamicValue = calculateDynamicValue(invItem.item.rarity, 'Jungle Ruins');
    const itemValue = dynamicValue.value * invItem.quantity;
    totalValue += itemValue;
    totalItems += invItem.quantity;
    
    soldItems.push({
      name: invItem.item.name,
      quantity: invItem.quantity,
      value: itemValue,
      rarity: invItem.item.rarity
    });
  }
  
  // Perform the sale transaction
  await prisma.$transaction([
    // Add coins to user
    prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: totalValue } }
    }),
    // Remove all items in this category from inventory
    prisma.inventoryItem.deleteMany({
      where: {
        userId: user.id,
        itemId: {
          in: categoryItems.map(invItem => invItem.itemId)
        }
      }
    })
  ]);
  
  // Create success embed
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle(`💰 ${category.name} Sale Successful!`)
    .setDescription(`You sold all your ${category.name.toLowerCase()} for ${totalValue} coins!`)
    .addFields(
      { name: '📦 Items Sold', value: `${totalItems} total items`, inline: true },
      { name: '💰 Total Earned', value: `${totalValue} coins`, inline: true },
      { name: '💰 New Balance', value: `${user.coins + totalValue} coins`, inline: true }
    )
    .setTimestamp();
  
  // Add sold items to embed
  
  
  let soldItemsText = '';
  for (const item of soldItems) {
    soldItemsText += `${getItemEmoji(item.name, item.rarity)} **${item.name}** x${item.quantity} (${item.value} coins)\n`;
  }
  
  if (soldItemsText) {
    embed.addFields({
      name: '📋 Sold Items',
      value: soldItemsText,
      inline: false
    });
  }
  
  // Create navigation buttons
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  const navigationButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('sell_items')
        .setLabel('💰 Sell More Items')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('inventory')
        .setLabel('🎒 Back to Inventory')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );
  
  await interaction.editReply({
    embeds: [embed],
    components: [navigationButtons]
  });
}

// Leaderboard handler functions
async function handleLeaderboardAll(interaction) {
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏆 Relic Raider Leaderboards')
    .setDescription('Choose a category to view detailed rankings')
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_levels')
        .setLabel('🏆 Levels')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_coins')
        .setLabel('💰 Coins')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_relics')
        .setLabel('🎒 Relics')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_mythics')
        .setLabel('🔴 Mythics')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_toggle_global')
        .setLabel('🌍 Global Stats')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('lb_toggle_server')
        .setLabel('🏠 Server Stats')
        .setStyle(ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [row1, row2, row3]
  });
}

async function handleLeaderboardSpecific(interaction, type, scope = 'global') {
  let embed, title, description;
  let leaderboardData;

  try {
    switch (type) {
      case 'levels':
        title = '🏆 Level Leaderboard';
        description = `Top players by level (${scope === 'global' ? 'Global' : 'Server'})`;
        leaderboardData = await getLevelLeaderboard(scope === 'server' ? interaction.guildId : null);
        break;
      case 'coins':
        title = '💰 Coin Leaderboard';
        description = `Top players by total coins (${scope === 'global' ? 'Global' : 'Server'})`;
        leaderboardData = await getCoinLeaderboard(scope === 'server' ? interaction.guildId : null);
        break;
      case 'relics':
        title = '🎒 Relic Leaderboard';
        description = `Top players by total relics found (${scope === 'global' ? 'Global' : 'Server'})`;
        leaderboardData = await getRelicLeaderboard(scope === 'server' ? interaction.guildId : null);
        break;
      case 'mythics':
        title = '🔴 Mythic Relic Leaderboard';
        description = `Top players by mythic relics found (${scope === 'global' ? 'Global' : 'Server'})`;
        leaderboardData = await getMythicLeaderboard(scope === 'server' ? interaction.guildId : null);
        break;
      default:
        await interaction.editReply({ content: '❌ Invalid leaderboard type.', ephemeral: true });
        return;
    }
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    await interaction.editReply({ content: '❌ Failed to load leaderboard data.', ephemeral: true });
    return;
  }

  embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  // Add rankings
  try {
    if (leaderboardData && leaderboardData.length > 0) {
      const rankingsField = formatLeaderboardField('🏆 Top Players', leaderboardData, type);
      embed.addFields(rankingsField);
    } else {
      embed.addFields({
        name: '🏆 Top Players',
        value: 'No data available yet. Start exploring to appear on the leaderboard!',
        inline: false
      });
    }
  } catch (error) {
    console.error('Error formatting leaderboard field:', error);
    embed.addFields({
      name: '🏆 Top Players',
      value: 'Error loading leaderboard data',
      inline: false
    });
  }

  // Add navigation buttons
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_all')
        .setLabel('📊 All Categories')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_levels' : 'lb_levels_server')
        .setLabel('🏆 Levels')
        .setStyle(type === 'levels' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_coins' : 'lb_coins_server')
        .setLabel('💰 Coins')
        .setStyle(type === 'coins' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_relics' : 'lb_relics_server')
        .setLabel('🎒 Relics')
        .setStyle(type === 'relics' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_mythics' : 'lb_mythics_server')
        .setLabel('🔴 Mythics')
        .setStyle(type === 'mythics' ? ButtonStyle.Success : ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_toggle_global')
        .setLabel('🌍 Global Stats')
        .setStyle(scope === 'global' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_toggle_server')
        .setLabel('🏠 Server Stats')
        .setStyle(scope === 'server' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );

  try {
    await interaction.editReply({
      embeds: [embed],
      components: [row1, row2, row3]
    });
  } catch (error) {
    console.error('Error sending leaderboard reply:', error);
    try {
      await interaction.editReply({ content: '❌ Failed to display leaderboard.', ephemeral: true });
    } catch (replyError) {
      console.error('Failed to send error reply:', replyError);
    }
  }
}

async function getLevelLeaderboard(guildId = null) {
  // For now, return global data since we don't have guildId in User model
  // TODO: Implement server-specific filtering when guild system is added
  return await prisma.user.findMany({
    select: {
      username: true,
      level: true,
      experience: true
    },
    orderBy: [
      { level: 'desc' },
      { experience: 'desc' }
    ],
    take: 10
  });
}

async function getCoinLeaderboard(guildId = null) {
  // For now, return global data since we don't have guildId in User model
  // TODO: Implement server-specific filtering when guild system is added
  return await prisma.user.findMany({
    select: {
      username: true,
      coins: true
    },
    orderBy: { coins: 'desc' },
    take: 10
  });
}

async function getRelicLeaderboard(guildId = null) {
  // For now, return global data since we don't have guildId in User model
  // TODO: Implement server-specific filtering when guild system is added
  const results = await prisma.inventoryItem.groupBy({
    by: ['userId'],
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 10
  });

  // Get user information for each result
  const leaderboardData = [];
  for (const result of results) {
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { username: true }
    });
    
    if (user) {
      leaderboardData.push({
        userId: result.userId,
        username: user.username,
        _sum: { quantity: result._sum.quantity }
      });
    }
  }

  return leaderboardData;
}

async function getMythicLeaderboard(guildId = null) {
  // For now, return global data since we don't have guildId in User model
  // TODO: Implement server-specific filtering when guild system is added
  return await prisma.inventoryItem.findMany({
    where: {
      item: {
        rarity: 'MYTHIC'
      }
    },
    select: {
      userId: true,
      quantity: true,
      user: {
        select: {
          username: true
        }
      }
    },
    orderBy: { quantity: 'desc' },
    take: 10
  });
}

function formatLeaderboardField(title, data, type) {
  if (!data || data.length === 0) {
    return { name: title, value: 'No data available', inline: false };
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  let formattedData = [];
  
  try {
    switch (type) {
      case 'levels':
        formattedData = data.map((user, index) => {
          if (!user || !user.username) return null;
          const medal = medals[index] || `${index + 1}.`;
          return `${medal} **${user.username}** - Level ${user.level || 0} (${user.experience || 0} XP)`;
        }).filter(Boolean);
        break;
      case 'coins':
        formattedData = data.map((user, index) => {
          if (!user || !user.username) return null;
          const medal = medals[index] || `${index + 1}.`;
          return `${medal} **${user.username}** - ${(user.coins || 0).toLocaleString()} coins`;
        }).filter(Boolean);
        break;
      case 'relics':
        formattedData = data.map((item, index) => {
          if (!item || !item.username) return null;
          const medal = medals[index] || `${index + 1}.`;
          return `${medal} **${item.username}** - ${item._sum?.quantity || 0} relics`;
        }).filter(Boolean);
        break;
      case 'mythics':
        formattedData = data.map((item, index) => {
          if (!item || !item.user || !item.user.username) return null;
          const medal = medals[index] || `${index + 1}.`;
          return `${medal} **${item.user.username}** - ${item.quantity || 0} mythic relics`;
        }).filter(Boolean);
        break;
    }
  } catch (error) {
    console.error('Error formatting leaderboard data:', error);
    return { name: title, value: 'Error loading data', inline: false };
  }

  if (formattedData.length === 0) {
    return { name: title, value: 'No valid data available', inline: false };
  }

  return {
    name: title,
    value: formattedData.join('\n'),
    inline: false
  };
}

async function handleLeaderboardToggle(interaction, scope) {
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏆 Relic Raider Leaderboards')
    .setDescription(`Choose a category to view detailed rankings (${scope === 'global' ? 'Global' : 'Server'})`)
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_levels' : 'lb_levels_server')
        .setLabel('🏆 Levels')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_coins' : 'lb_coins_server')
        .setLabel('💰 Coins')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_relics' : 'lb_relics_server')
        .setLabel('🎒 Relics')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(scope === 'global' ? 'lb_mythics' : 'lb_mythics_server')
        .setLabel('🔴 Mythics')
        .setStyle(ButtonStyle.Primary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_toggle_global')
        .setLabel('🌍 Global Stats')
        .setStyle(scope === 'global' ? ButtonStyle.Success : ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_toggle_server')
        .setLabel('🏠 Server Stats')
        .setStyle(scope === 'server' ? ButtonStyle.Success : ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🔙 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [row1, row2, row3]
  });
}

// Achievement view handlers
async function handleAchievementsView(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    // Check for new achievements first
    const newlyCompleted = await AchievementSystem.checkAchievements(user.id);
    
    // Get user's achievements
    const userAchievements = await AchievementSystem.getUserAchievements(user.id);
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Achievements')
      .setDescription(`**${user.username}**'s achievement progress\n\nSelect a category to view detailed achievements:`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // Show newly completed achievements (limited to 3 most recent)
    if (newlyCompleted.length > 0) {
      const recentAchievements = newlyCompleted.slice(-3); // Get last 3 achievements
      const newAchievementsText = recentAchievements.map(achievement => 
        `🎉 **${achievement.name}** - ${achievement.description}`
      ).join('\n');
      
      let fieldName = '🎉 Newly Unlocked!';
      if (newlyCompleted.length > 3) {
        fieldName += ` (showing 3 most recent of ${newlyCompleted.length})`;
      }
      
      embed.addFields({
        name: fieldName,
        value: newAchievementsText,
        inline: false
      });
    }

    // Group achievements by category and show summary
    const categories = {};
    userAchievements.forEach(ua => {
      const category = ua.achievement.category;
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(ua);
    });

    // Create category summary
    const categorySummary = Object.entries(categories).map(([category, achievements]) => {
      const categoryEmoji = {
        'exploration': '🔍',
        'collection': '🎒',
        'economic': '💰',
        'level': '⭐',
        'special': '✨'
      };

      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const emoji = categoryEmoji[category] || '🏆';
      
      // Count regular completed achievements
      const regularCompleted = achievements.filter(ua => !ua.achievement.isHidden && ua.isCompleted).length;
      const regularTotal = achievements.filter(ua => !ua.achievement.isHidden).length;
      
      // Count discovered hidden achievements
      const hiddenDiscovered = achievements.filter(ua => ua.achievement.isHidden && ua.achievement.isDiscovered).length;
      const hiddenTotal = achievements.filter(ua => ua.achievement.isHidden).length;
      
      const totalCompleted = regularCompleted + hiddenDiscovered;
      const total = regularTotal + hiddenTotal;
      const percentage = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
      
      let summary = `${emoji} **${categoryName}**: ${totalCompleted}/${total} (${percentage}%)`;
      
      // Add hidden achievement info if there are any
      if (hiddenTotal > 0) {
        summary += `\n└ Hidden: ${hiddenDiscovered}/${hiddenTotal} discovered`;
      }
      
      return summary;
    }).join('\n');

    embed.addFields({
      name: '📊 Achievement Categories',
      value: categorySummary,
      inline: false
    });

    // Create category buttons
    const categoryButtons = new ActionRowBuilder();
    const categoryEmojis = {
      'exploration': '🔍',
      'collection': '🎒',
      'economic': '💰',
      'level': '⭐',
      'special': '✨',
      'hidden': '👻'
    };

    // Add regular category buttons (max 5 total buttons per row)
    let buttonCount = 0;
    Object.keys(categories).forEach((category, index) => {
      if (buttonCount < 5) { // Allow up to 5 buttons per row
        const emoji = categoryEmojis[category] || '🏆';
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        categoryButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(`achievement_category_${category}`)
            .setLabel(`${emoji} ${categoryName}`)
            .setStyle(ButtonStyle.Primary)
        );
        buttonCount++;
      }
    });

    // Add hidden achievements button if there are any hidden achievements and space available
    const hasHiddenAchievements = userAchievements.some(ua => ua.achievement.isHidden);
    if (hasHiddenAchievements && categoryButtons.components.length < 5) {
      const hiddenDiscovered = userAchievements.filter(ua => ua.achievement.isHidden && ua.achievement.isDiscovered).length;
      const hiddenTotal = userAchievements.filter(ua => ua.achievement.isHidden).length;
      
      categoryButtons.addComponents(
        new ButtonBuilder()
          .setCustomId('achievement_category_hidden')
          .setLabel(`👻 Hidden (${hiddenDiscovered}/${hiddenTotal})`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

    // Ensure we have at least one button in categoryButtons
    if (categoryButtons.components.length === 0) {
      categoryButtons.addComponents(
        new ButtonBuilder()
          .setCustomId('achievement_category_exploration')
          .setLabel('🔍 Exploration')
          .setStyle(ButtonStyle.Primary)
      );
    }

    // Add navigation buttons
    const navButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievement_category_hidden')
          .setLabel('👻 Hidden')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Titles')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🔙 Back to Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [categoryButtons, navButtons]
    });
  } catch (error) {
    console.error('Error in handleAchievementsView:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fetching achievements.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleTitlesView(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    const userTitles = await AchievementSystem.getUserTitles(user.id);
    const equippedTitle = await AchievementSystem.getEquippedTitle(user.id);
    
    // Debug: Log any titles with missing data
    const invalidTitles = userTitles.filter(ut => !ut.title || !ut.title.name || !ut.title.description);
    if (invalidTitles.length > 0) {
      console.log('Found titles with missing data:', invalidTitles.map(ut => ({
        id: ut.id,
        titleId: ut.titleId,
        title: ut.title,
        earnedAt: ut.earnedAt
      })));
    }
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('👑 Titles')
      .setDescription(`**${user.username}**'s earned titles`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    if (equippedTitle) {
      embed.addFields({
        name: '👑 Currently Equipped',
        value: `**${equippedTitle.name}** - ${equippedTitle.description}`,
        inline: false
      });
    }

    // Filter out any titles with missing data to prevent display issues
    const validUserTitles = userTitles.filter(ut => ut.title && ut.title.name && ut.title.description);
    
    // Limit to 5 most recent titles in main view to avoid overwhelming display
    const displayTitles = validUserTitles.slice(0, 5);
    const hasMoreTitles = validUserTitles.length > 5;
    
    if (displayTitles.length > 0) {
      const titlesText = displayTitles.map(ut => {
        const status = ut.isEquipped ? '👑' : '📜';

        
        // Handle potential null title or missing data
        if (!ut.title || !ut.title.name) {
          return `${status} ❓ **Unknown Title**\n└ Title data not found\n└ Earned: <t:${Math.floor(new Date(ut.earnedAt).getTime() / 1000)}:R>`;
        }
        
        // Safely get rarity emoji with fallback
        const rarity = ut.title.rarity || 'common';
        const rarityEmojis = {
          'mythic': '🔴',
          'legendary': '🟡',
          'rare': '🔵',
          'uncommon': '🟢',
          'common': '⚪'
        };
        const emoji = rarityEmojis[rarity] || '⚪';
        
        const earnedDate = new Date(ut.earnedAt);
        return `${status} ${emoji} **${ut.title.name}**\n└ ${ut.title.description}\n└ Earned: <t:${Math.floor(earnedDate.getTime() / 1000)}:R>`;
      }).join('\n\n');

      let fieldValue = titlesText;
      if (hasMoreTitles) {
        fieldValue += `\n\n*...and ${validUserTitles.length - 5} more titles. Use rarity buttons to view all titles.*`;
      }
      
      embed.addFields({
        name: `📜 Earned Titles (${validUserTitles.length})`,
        value: fieldValue,
        inline: false
      });
    } else {
      embed.addFields({
        name: '📜 Earned Titles',
        value: 'No titles earned yet. Complete achievements to unlock titles!',
        inline: false
      });
    }

    // Fetch all available titles for hybrid rarity button approach
    const allTitles = await AchievementSystem.getAllTitles();
    const totalByRarity = {
      'mythic': 0,
      'legendary': 0,
      'rare': 0,
      'uncommon': 0,
      'common': 0
    };
    allTitles.forEach(t => {
      const rarity = t.rarity || 'common';
      if (totalByRarity[rarity] !== undefined) totalByRarity[rarity]++;
    });

    // Group user's titles by rarity
    const titlesByRarity = {
      'mythic': [],
      'legendary': [],
      'rare': [],
      'uncommon': [],
      'common': []
    };
    validUserTitles.forEach(ut => {
      const rarity = ut.title.rarity || 'common';
      if (titlesByRarity[rarity]) {
        titlesByRarity[rarity].push(ut);
      }
    });

    // Create rarity category buttons (hybrid approach)
    const rarityButtons = new ActionRowBuilder();
    const rarityEmojis = {
      'mythic': '🔴',
      'legendary': '🟡', 
      'rare': '🔵',
      'uncommon': '🟢',
      'common': '⚪'
    };
    Object.entries(totalByRarity).forEach(([rarity, total]) => {
      const owned = titlesByRarity[rarity].length;
      const emoji = rarityEmojis[rarity] || '⚪';
      const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
      const equippedCount = titlesByRarity[rarity].filter(ut => ut.isEquipped).length;
      const label = `${emoji} ${rarityName} (${owned}/${total})`;
      const button = new ButtonBuilder()
        .setCustomId(`titles_rarity_${rarity}`)
        .setLabel(label)
        .setStyle(owned > 0 ? (equippedCount > 0 ? ButtonStyle.Success : ButtonStyle.Primary) : ButtonStyle.Secondary)
        .setDisabled(owned === 0);
      rarityButtons.addComponents(button);
    });

    // Add quick equip button for currently equipped title
    const quickEquipRow = new ActionRowBuilder();
    if (equippedTitle) {
      quickEquipRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`equip_title_${equippedTitle.id}`)
          .setLabel(`👑 ${equippedTitle.name}`)
          .setStyle(ButtonStyle.Success)
      );
    }

    // Add navigation buttons
    const navigationButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_view')
          .setLabel('🏆 Achievements')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Titles')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🔙 Back to Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    const allComponents = [rarityButtons];
    if (quickEquipRow.components.length > 0) {
      allComponents.push(quickEquipRow);
    }
    allComponents.push(navigationButtons);

    await interaction.editReply({
      embeds: [embed],
      components: allComponents
    });
  } catch (error) {
    console.error('Error in handleTitlesView:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fetching titles.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleProgressView(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    const userStats = await AchievementSystem.getUserStats(user.id);
    const userAchievements = await AchievementSystem.getUserAchievements(user.id);
    
    const completedAchievements = userAchievements.filter(ua => ua.isCompleted).length;
    const totalAchievements = userAchievements.length;
    
    // Get achievement statistics
    const completedAchievementsWithDates = userAchievements.filter(ua => ua.isCompleted);
    const recentAchievements = completedAchievementsWithDates
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 3);
    
    const totalRewardsEarned = completedAchievementsWithDates.reduce((total, ua) => {
      return total + (ua.achievement.rewardCoins || 0) + (ua.achievement.rewardXP || 0);
    }, 0);
    
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('📊 Achievement Progress')
      .setDescription(`**${user.username}**'s overall progress`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    embed.addFields(
      { name: '🏆 Achievements', value: `${completedAchievements}/${totalAchievements} completed`, inline: true },
      { name: '⭐ Level', value: `${userStats.level}`, inline: true },
      { name: '💰 Coins', value: `${userStats.currentCoins.toLocaleString()}`, inline: true },
      { name: '🔍 Explorations', value: `${userStats.totalExplorations}`, inline: true },
      { name: '🎒 Unique Items', value: `${userStats.uniqueItems}`, inline: true },
      { name: '🔴 Mythic Items', value: `${userStats.mythicItems}`, inline: true }
    );

    // Add achievement statistics
    embed.addFields({
      name: '📊 Achievement Statistics',
      value: `**Total Rewards Earned:** ${totalRewardsEarned.toLocaleString()}\n**Completion Rate:** ${Math.round((completedAchievements / totalAchievements) * 100)}%\n**Average Progress:** ${Math.round(userAchievements.reduce((sum, ua) => sum + (ua.progress / ua.achievement.requirementValue), 0) / totalAchievements * 100)}%`,
      inline: true
    });

    // Add recent achievements
    if (recentAchievements.length > 0) {
      const recentText = recentAchievements.map(ua => {
        const date = new Date(ua.completedAt);
        return `🏆 **${ua.achievement.name}** - <t:${Math.floor(date.getTime() / 1000)}:R>`;
      }).join('\n');
      
      embed.addFields({
        name: '🕒 Recent Achievements',
        value: recentText,
        inline: true
      });
    }

    // Add detailed collection stats
    embed.addFields({
      name: '📊 Collection Breakdown',
      value: `🔴 Mythic: ${userStats.mythicItems}\n🟡 Legendary: ${userStats.legendaryItems}\n🔵 Rare: ${userStats.rareItems || 0}\n🟢 Uncommon: ${userStats.uncommonItems || 0}\n⚪ Common: ${userStats.commonItems || 0}`,
      inline: true
    });

    // Add achievement categories breakdown
    const categoryStats = {};
    userAchievements.forEach(ua => {
      const category = ua.achievement.category;
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, completed: 0 };
      }
      categoryStats[category].total++;
      if (ua.isCompleted) categoryStats[category].completed++;
    });

    const categoryText = Object.entries(categoryStats).map(([category, stats]) => {
      const emoji = {
        'exploration': '🔍',
        'collection': '🎒',
        'economic': '💰',
        'level': '⭐',
        'special': '✨'
      }[category] || '🏆';
      
      const percentage = Math.round((stats.completed / stats.total) * 100);
      return `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}: ${stats.completed}/${stats.total} (${percentage}%)`;
    }).join('\n');

    embed.addFields({
      name: '📈 Category Progress',
      value: categoryText,
      inline: true
    });

    // Calculate completion percentage
    const completionPercentage = totalAchievements > 0 ? 
      Math.round((completedAchievements / totalAchievements) * 100) : 0;
    
    embed.addFields({
      name: '📈 Overall Progress',
      value: `${completionPercentage}% complete`,
      inline: false
    });

    // Add navigation buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_view')
          .setLabel('🏆 Achievements')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Titles')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🔙 Back to Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    });
  } catch (error) {
    console.error('Error in handleProgressView:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fetching progress.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Handle individual achievement category view
async function handleAchievementCategory(interaction, category, page = 0) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    // Get user's achievements for this category
    const userAchievements = await AchievementSystem.getUserAchievements(user.id);
    let categoryAchievements;
    
    if (category === 'hidden') {
      // For hidden category, get all hidden achievements
      categoryAchievements = userAchievements.filter(ua => ua.achievement.isHidden);
    } else {
      // For regular categories, filter by category and exclude hidden ones
      categoryAchievements = userAchievements.filter(ua => ua.achievement.category === category && !ua.achievement.isHidden);
    }
    
    if (categoryAchievements.length === 0) {
      await interaction.editReply({
        content: '❌ No achievements found for this category.',
        ephemeral: true
      });
      return;
    }

    const categoryEmoji = {
      'exploration': '🔍',
      'collection': '🎒',
      'economic': '💰',
      'level': '⭐',
      'special': '✨',
      'hidden': '👻'
    };

    const categoryName = category === 'hidden' ? 'Hidden' : category.charAt(0).toUpperCase() + category.slice(1);
    const emoji = categoryEmoji[category] || '🏆';
    
    // Count regular completed achievements
    const regularCompleted = categoryAchievements.filter(ua => !ua.achievement.isHidden && ua.isCompleted).length;
    const regularTotal = categoryAchievements.filter(ua => !ua.achievement.isHidden).length;
    
    // Count discovered hidden achievements
    const hiddenDiscovered = categoryAchievements.filter(ua => ua.achievement.isHidden && ua.achievement.isDiscovered).length;
    const hiddenTotal = categoryAchievements.filter(ua => ua.achievement.isHidden).length;
    
    const totalCompleted = regularCompleted + hiddenDiscovered;
    const total = regularTotal + hiddenTotal;
    const percentage = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;
    
    // Handle pagination for hidden achievements
    let displayAchievements = categoryAchievements;
    let currentPage = 0;
    let totalPages = 1;
    
    if (category === 'hidden') {
      const achievementsPerPage = 5;
      totalPages = Math.ceil(categoryAchievements.length / achievementsPerPage);
      currentPage = Math.max(0, Math.min(page, totalPages - 1));
      const startIndex = currentPage * achievementsPerPage;
      const endIndex = startIndex + achievementsPerPage;
      displayAchievements = categoryAchievements.slice(startIndex, endIndex);
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${emoji} ${categoryName} Achievements${category === 'hidden' && totalPages > 1 ? ` (Page ${currentPage + 1}/${totalPages})` : ''}`)
      .setDescription(`**${user.username}**'s ${categoryName.toLowerCase()} achievements\n\n**Progress:** ${totalCompleted}/${total} (${percentage}%)${hiddenTotal > 0 ? `\n**Hidden:** ${hiddenDiscovered}/${hiddenTotal} discovered` : ''}`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // Create detailed achievement list and split into multiple fields if needed
    const achievementEntries = displayAchievements.map(ua => {
      // Handle hidden achievements
      if (ua.achievement.isHidden) {
        // Check if user has discovered this hidden achievement
        const isDiscovered = ua.achievement.isDiscovered || false;
        
        if (!isDiscovered) {
          // Undiscovered hidden achievement
          return `❓ **???**\n└ ??? (???) ░░░░░░░░░░\n└ *This achievement is hidden. Complete certain actions to discover it.*\n└ **Rewards:** ???`;
        } else {
          // Discovered hidden achievement
          const status = '🔍';
          const progress = `${ua.progress}/${ua.achievement.requirementValue}`;
          const percentage = Math.min(Math.round((ua.progress / ua.achievement.requirementValue) * 100), 100);
          const progressBar = createProgressBar(percentage);
          
          let rewardText = '';
          if (ua.achievement.rewardCoins > 0) rewardText += `💰 **${ua.achievement.rewardCoins.toLocaleString()} coins**`;
          if (ua.achievement.rewardXP > 0) rewardText += rewardText ? ` | ⭐ **${ua.achievement.rewardXP.toLocaleString()} XP**` : `⭐ **${ua.achievement.rewardXP.toLocaleString()} XP**`;
          if (ua.achievement.rewardTitle) rewardText += rewardText ? ` | 👑 **${ua.achievement.rewardTitle}**` : `👑 **${ua.achievement.rewardTitle}**`;
          
          return `${status} **${ua.achievement.name}** *(Hidden)*\n└ ${progress} (${percentage}%) ${progressBar}\n└ ${ua.achievement.description}\n└ **Rewards:** ${rewardText || 'None'}`;
        }
      }
      
      // Regular achievements
      const status = ua.isCompleted ? '✅' : '⏳';
      const progress = ua.isCompleted ? 
        `${ua.achievement.requirementValue}/${ua.achievement.requirementValue}` :
        `${ua.progress}/${ua.achievement.requirementValue}`;
      
      const percentage = Math.min(Math.round((ua.progress / ua.achievement.requirementValue) * 100), 100);
      const progressBar = createProgressBar(percentage);
      
      let rewardText = '';
      if (ua.achievement.rewardCoins > 0) rewardText += `💰 **${ua.achievement.rewardCoins.toLocaleString()} coins**`;
      if (ua.achievement.rewardXP > 0) rewardText += rewardText ? ` | ⭐ **${ua.achievement.rewardXP.toLocaleString()} XP**` : `⭐ **${ua.achievement.rewardXP.toLocaleString()} XP**`;
      if (ua.achievement.rewardTitle) rewardText += rewardText ? ` | 👑 **${ua.achievement.rewardTitle}**` : `👑 **${ua.achievement.rewardTitle}**`;
      
      return `${status} **${ua.achievement.name}**\n└ ${progress} (${percentage}%) ${progressBar}\n└ ${ua.achievement.description}\n└ **Rewards:** ${rewardText || 'None'}`;
    });

    // Split achievements into multiple fields if they exceed Discord's 1024 character limit
    const maxFieldLength = 1024;
    let currentField = '';
    let fieldIndex = 1;

    for (const achievement of achievementEntries) {
      const achievementWithSeparator = achievement + '\n\n';
      
      if ((currentField + achievementWithSeparator).length > maxFieldLength) {
        // Add current field if it has content
        if (currentField.trim()) {
          embed.addFields({
            name: fieldIndex === 1 ? `${emoji} ${categoryName} Achievements` : `${emoji} ${categoryName} Achievements`,
            value: currentField.trim(),
            inline: false
          });
          fieldIndex++;
        }
        currentField = achievementWithSeparator;
      } else {
        currentField += achievementWithSeparator;
      }
    }

    // Add the last field if it has content
    if (currentField.trim()) {
      embed.addFields({
        name: fieldIndex === 1 ? `${emoji} ${categoryName} Achievements` : `${emoji} ${categoryName} Achievements`,
        value: currentField.trim(),
        inline: false
      });
    }

    // Add navigation buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_view')
          .setLabel('🔙 Back to Categories')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Titles')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🏠 Main Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    // Add pagination buttons for hidden achievements
    if (category === 'hidden' && totalPages > 1) {
      const paginationButtons = new ActionRowBuilder();
      
      // Add numbered page buttons (1-5)
      for (let i = 0; i < Math.min(5, totalPages); i++) {
        const button = new ButtonBuilder()
          .setCustomId(`achievement_category_hidden_page_${i}`)
          .setLabel(`${i + 1}`)
          .setStyle(i === currentPage ? ButtonStyle.Primary : ButtonStyle.Secondary);
        
        paginationButtons.addComponents(button);
      }
      
      // Add Previous/Next buttons if needed
      if (totalPages > 5) {
        if (currentPage > 0) {
          paginationButtons.addComponents(
            new ButtonBuilder()
              .setCustomId(`achievement_category_hidden_page_${currentPage - 1}`)
              .setLabel('◀️')
              .setStyle(ButtonStyle.Secondary)
          );
        }
        
        if (currentPage < totalPages - 1) {
          paginationButtons.addComponents(
            new ButtonBuilder()
              .setCustomId(`achievement_category_hidden_page_${currentPage + 1}`)
              .setLabel('▶️')
              .setStyle(ButtonStyle.Secondary)
          );
        }
      }
      
      await interaction.editReply({
        embeds: [embed],
        components: [buttons, paginationButtons]
      });
    } else {
      await interaction.editReply({
        embeds: [embed],
        components: [buttons]
      });
    }
  } catch (error) {
    console.error('Error in handleAchievementCategory:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fetching category achievements.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Handle titles by rarity with pagination
async function handleTitlesRarity(interaction, rarity, page = 0) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    const userTitles = await AchievementSystem.getUserTitles(user.id);
    const validUserTitles = userTitles.filter(ut => ut.title && ut.title.name && ut.title.description);
    
    // Filter titles by rarity
    const rarityTitles = validUserTitles.filter(ut => (ut.title.rarity || 'common') === rarity);
    
    if (rarityTitles.length === 0) {
      await interaction.editReply({
        content: `❌ No ${rarity} titles found.`,
        ephemeral: true
      });
      return;
    }

    const rarityEmojis = {
      'mythic': '🔴',
      'legendary': '🟡', 
      'rare': '🔵',
      'uncommon': '🟢',
      'common': '⚪'
    };

    const emoji = rarityEmojis[rarity] || '⚪';
    const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    const equippedCount = rarityTitles.filter(ut => ut.isEquipped).length;
    
    // Pagination: 3 titles per page (to avoid overwhelming display)
    const titlesPerPage = 3;
    const totalPages = Math.ceil(rarityTitles.length / titlesPerPage);
    const currentPage = Math.max(0, Math.min(page, totalPages - 1));
    const startIndex = currentPage * titlesPerPage;
    const endIndex = startIndex + titlesPerPage;
    const pageTitles = rarityTitles.slice(startIndex, endIndex);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`${emoji} ${rarityName} Titles`)
      .setDescription(`**${user.username}**'s ${rarityName.toLowerCase()} titles\n\n**Progress:** ${equippedCount}/${rarityTitles.length} equipped`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // Create title list
    const titlesText = pageTitles.map(ut => {
      const status = ut.isEquipped ? '👑' : '📜';
      const earnedDate = new Date(ut.earnedAt);
      return `${status} **${ut.title.name}**\n└ ${ut.title.description}\n└ Earned: <t:${Math.floor(earnedDate.getTime() / 1000)}:R>`;
    }).join('\n\n');

    embed.addFields({
      name: `📜 ${rarityName} Titles (Page ${currentPage + 1}/${totalPages})`,
      value: titlesText,
      inline: false
    });

    // Create title equip buttons (max 5 per row)
    const titleButtons = new ActionRowBuilder();
    pageTitles.forEach(ut => {
      const button = new ButtonBuilder()
        .setCustomId(`equip_title_${ut.titleId}`)
        .setLabel(ut.isEquipped ? `👑 ${ut.title.name}` : ut.title.name)
        .setStyle(ut.isEquipped ? ButtonStyle.Success : ButtonStyle.Secondary);
      
      titleButtons.addComponents(button);
    });

    // Create pagination buttons
    const paginationButtons = new ActionRowBuilder();
    
    if (totalPages > 1) {
      if (currentPage > 0) {
        paginationButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(`titles_rarity_${rarity}_page_${currentPage - 1}`)
            .setLabel('◀️ Previous')
            .setStyle(ButtonStyle.Secondary)
        );
      }
      
      if (currentPage < totalPages - 1) {
        paginationButtons.addComponents(
          new ButtonBuilder()
            .setCustomId(`titles_rarity_${rarity}_page_${currentPage + 1}`)
            .setLabel('Next ▶️')
            .setStyle(ButtonStyle.Secondary)
        );
      }
    }

    // Add navigation buttons
    const navigationButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Back to Titles')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('achievements_view')
          .setLabel('🏆 Achievements')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🏠 Main Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    const allComponents = [titleButtons];
    if (paginationButtons.components.length > 0) {
      allComponents.push(paginationButtons);
    }
    allComponents.push(navigationButtons);

    await interaction.editReply({
      embeds: [embed],
      components: allComponents
    });
  } catch (error) {
    console.error('Error in handleTitlesRarity:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fetching titles.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Handle title equipping
async function handleEquipTitle(interaction, titleId) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    // Equip the title
    await AchievementSystem.equipTitle(user.id, titleId);
    
    // Get the title info
    const title = await prisma.title.findUnique({
      where: { id: titleId }
    });

    if (!title) {
      await interaction.editReply({
        content: '❌ Title not found.',
        ephemeral: true
      });
      return;
    }

    // Show success message
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('👑 Title Equipped!')
      .setDescription(`**${user.username}** has equipped the title **${title.name}**!`)
      .addFields({
        name: '👑 Equipped Title',
        value: `**${title.name}**\n${title.description}`,
        inline: false
      })
      .setTimestamp();

    // Add navigation buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Back to Titles')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('achievements_view')
          .setLabel('🏆 Achievements')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🏠 Main Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    });
  } catch (error) {
    console.error('Error in handleEquipTitle:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while equipping the title.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Handle zone bosses view
async function handleZoneBosses(interaction, page = 0) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    const ServerBossSystem = require('./server-boss-system');
    const guildId = interaction.guildId || 'global';
    
    // Get all boss information
    const bossEntries = Object.entries(ServerBossSystem.serverBossConditions);
    const bossesPerPage = 2;
    const totalPages = Math.ceil(bossEntries.length / bossesPerPage);
    
    // Ensure page is within bounds
    page = Math.max(0, Math.min(page, totalPages - 1));
    
    // Get bosses for current page
    const startIndex = page * bossesPerPage;
    const endIndex = startIndex + bossesPerPage;
    const pageBosses = bossEntries.slice(startIndex, endIndex);
    
    const embed = new EmbedBuilder()
      .setColor('#8B0000')
      .setTitle('🏰 Zone Bosses')
      .setDescription(`**Legendary bosses that spawn when server requirements are met!**\n\n*Page ${page + 1} of ${totalPages} - Showing ${pageBosses.length} bosses*`)
      .setFooter({ text: '⚔️ Defeat these colossal foes for legendary rewards! 🏆' })
      .setTimestamp();

    for (let i = 0; i < pageBosses.length; i++) {
      const [bossName, bossConfig] = pageBosses[i];
      
      // Get server beast kills for this zone
      const serverBeastKills = await ServerBossSystem.getServerBeastKills(guildId, bossConfig.zone);
      
      // Check if boss can spawn for this user
      const spawnCheck = await ServerBossSystem.canBossSpawn(guildId, bossConfig.zone, user);
      
      // Get last defeat time
      const lastDefeat = await ServerBossSystem.getLastServerBossDefeat(guildId, bossName);
      let cooldownStatus = '';
      let cooldownEmoji = '⏰';
      
      if (lastDefeat) {
        const timeSinceDefeat = Date.now() - lastDefeat.defeatedAt.getTime();
        if (timeSinceDefeat < bossConfig.serverCooldown) {
          const remainingCooldown = bossConfig.serverCooldown - timeSinceDefeat;
          const hoursRemaining = Math.ceil(remainingCooldown / (60 * 60 * 1000));
          cooldownStatus = `**On cooldown for ${hoursRemaining}h**`;
          cooldownEmoji = '⏰';
        } else {
          cooldownStatus = '**Available**';
          cooldownEmoji = '✅';
        }
      } else {
        cooldownStatus = '**Available**';
        cooldownEmoji = '✅';
      }
      
      // Determine status emoji and requirements
      let statusEmoji = '❌';
      let requirementStatus = '';
      
      if (spawnCheck.canSpawn) {
        statusEmoji = '✅';
        requirementStatus = '**Ready to spawn!**';
      } else if (user.level < bossConfig.minLevel) {
        statusEmoji = '📈';
        requirementStatus = `**Level ${bossConfig.minLevel} required** (you: ${user.level})`;
      } else if (serverBeastKills < bossConfig.serverBeastsRequired) {
        statusEmoji = '⚔️';
        requirementStatus = `**${(bossConfig.serverBeastsRequired - serverBeastKills).toLocaleString()} more beasts needed**`;
      } else {
        statusEmoji = '⏰';
        requirementStatus = '**On cooldown**';
      }
      
      // Get boss beast for detailed loot info
      const bossBeast = await ServerBossSystem.getBossBeast(bossName);
      let lootInfo = '';
      if (bossBeast) {
        // Calculate boss-specific coin rewards (much higher than regular beasts)
        const bossIndex = Object.keys(ServerBossSystem.serverBossConditions).indexOf(bossName);
        const baseCoins = 10000 + (bossIndex * 5000); // 10K for first boss, 15K for second, etc.
        const minCoins = Math.floor(baseCoins * 0.8); // 80% of base
        const maxCoins = Math.floor(baseCoins * 1.2); // 120% of base
        const estimatedItems = Math.floor(bossBeast.baseHp / 50) + 20; // More items for bosses
        const rarityChance = Math.floor(bossBeast.baseHp / 40) + 5; // Higher mythic chance
        
        lootInfo = `\n\n💎 **Legendary Rewards:**`;
        lootInfo += `\n└ **${estimatedItems} items** (${rarityChance}% mythic chance)`;
        lootInfo += `\n└ **${minCoins.toLocaleString()} - ${maxCoins.toLocaleString()} coins**`;
        lootInfo += `\n└ **Unique ${bossName} artifacts**`;
        lootInfo += `\n└ **Exclusive titles & achievements**`;
      }
      
      // Create detailed boss field with enhanced formatting
      const bossFieldName = `${statusEmoji} **${bossName}**`;
      
      // Lore-based status messages
      const notReadyStatuses = [
        "The ancient guardian slumbers, waiting for worthy challengers...",
        "Dark whispers echo through the ruins, but the beast remains hidden",
        "The ground trembles slightly, a sign of the beast's restless sleep",
        "Ancient runes glow faintly, but the guardian is not yet awakened",
        "The air crackles with dormant power, the beast biding its time",
        "Shadows dance in the depths, but the colossus waits for more blood",
        "The earth itself seems to hold its breath, the guardian not yet ready",
        "Mystical barriers shimmer, keeping the beast in its eternal rest",
        "The wind carries ancient warnings, but the beast slumbers on",
        "Dark energy swirls in the depths, the guardian not yet awakened"
      ];
      
      const readyStatuses = [
        "The beast stirs in the shadows, its eyes burning with ancient fury!",
        "Dark energy crackles around the guardian - it's ready to strike!",
        "The ground shakes as the colossus emerges from its lair!",
        "Ancient power surges through the air - the beast is awakened!",
        "The guardian's roar echoes through the realm - it seeks challengers!",
        "Dark magic swirls around the beast - it's ready for battle!",
        "The colossus rises from the depths, its power overwhelming!",
        "Ancient fury burns in the beast's eyes - it's time to fight!",
        "The guardian's presence fills the air with dread - it's ready!",
        "Dark forces converge as the beast prepares for glorious combat!"
      ];
      
      // Select random status based on spawn readiness
      let loreStatus = '';
      if (spawnCheck.canSpawn) {
        const randomIndex = Math.floor(Math.random() * readyStatuses.length);
        loreStatus = readyStatuses[randomIndex];
      } else {
        const randomIndex = Math.floor(Math.random() * notReadyStatuses.length);
        loreStatus = notReadyStatuses[randomIndex];
      }
      
      // Create a more structured boss description
      const bossDescription = [
        `└ Ancient guardian of ${bossConfig.zone}`,
        ``,
        `📊 **Requirements:**`,
        `└ Level: ${bossConfig.minLevel} (you: ${user.level})`,
        `└ Server Beasts: ${serverBeastKills.toLocaleString()}/${bossConfig.serverBeastsRequired.toLocaleString()}`,
        `└ Spawn Chance: ${Math.round(bossConfig.baseChance * 10000) / 100}%`,
        `└ Cooldown: ${Math.ceil(bossConfig.serverCooldown / (60 * 60 * 1000))}h`,
        ``,
        `📋 **Status:** ${loreStatus}`,
        `${cooldownEmoji} **Cooldown:** ${cooldownStatus}`
      ].join('\n');
      
      embed.addFields({
        name: bossFieldName,
        value: bossDescription + lootInfo,
        inline: false
      });
      
      // Add divider between bosses (except after the last one)
      if (i < pageBosses.length - 1) {
        embed.addFields({
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '',
          inline: false
        });
      }
    }

    // Create pagination buttons
    const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    const paginationRow = new ActionRowBuilder();
    
    // Previous page button
    paginationRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`zone_bosses_page_${page - 1}`)
        .setLabel('◀️ Previous Page')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === 0)
    );
    
    // Page indicator with boss count
    paginationRow.addComponents(
      new ButtonBuilder()
        .setCustomId('zone_bosses_info')
        .setLabel(`📖 Page ${page + 1}/${totalPages}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );
    
    // Next page button and back to menu
    paginationRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`zone_bosses_page_${page + 1}`)
        .setLabel('Next Page ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(page === totalPages - 1),
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🏠 Back to Menu')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [paginationRow]
    });
  } catch (error) {
    console.error('Error in handleZoneBosses:', error);
    await interaction.editReply({
      content: '❌ An error occurred while loading zone bosses.',
      ephemeral: true
    });
  }
}

// Handle challenges view
async function handleChallengesView(interaction) {
  try {
    const discordId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      await interaction.editReply({
        content: '❌ You need to start your adventure first! Use `/raid` to begin.',
        ephemeral: true
      });
      return;
    }

    const ChallengeSystem = require('./challenge-system');
    const activeChallenges = await ChallengeSystem.getActiveChallenges(user.id);
    const userProgress = await ChallengeSystem.getUserChallengeProgress(user.id);

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🎯 Achievement Challenges')
      .setDescription(`**${user.username}**'s active challenges`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    if (activeChallenges.length > 0) {
      const challengeText = activeChallenges.map(challenge => {
        const progress = challenge.userProgress?.progress || 0;
        const requirement = ChallengeSystem.getChallengeRequirement(challenge);
        // Ensure requirement is not zero and progress is not negative
        const safeRequirement = Math.max(1, requirement);
        const safeProgress = Math.max(0, progress);
        const percentage = Math.round((safeProgress / safeRequirement) * 100);
        const progressBar = createProgressBar(percentage);
        
        const timeLeft = new Date(challenge.endDate) - new Date();
        const timeLeftHours = Math.floor(timeLeft / (1000 * 60 * 60));
        const timeLeftMinutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        let timeText = '';
        if (timeLeftHours > 24) {
          const days = Math.floor(timeLeftHours / 24);
          timeText = `${days} days left`;
        } else if (timeLeftHours > 0) {
          timeText = `${timeLeftHours}h ${timeLeftMinutes}m left`;
        } else {
          timeText = `${timeLeftMinutes}m left`;
        }

        const status = challenge.userProgress?.isCompleted ? '✅' : '🎯';
        const categoryEmoji = {
          'daily': '📅',
          'weekly': '📆',
          'seasonal': '🌍',
          'special': '✨'
        };

        return `${status} ${categoryEmoji[challenge.category]} **${challenge.name}**\n└ ${challenge.description}\n└ Progress: ${progress}/${requirement} ${progressBar} (${percentage}%)\n└ Time: ${timeText}`;
      }).join('\n\n');

      embed.addFields({
        name: `🎯 Active Challenges (${activeChallenges.length})`,
        value: challengeText,
        inline: false
      });
    } else {
      embed.addFields({
        name: '🎯 Active Challenges',
        value: 'No active challenges at the moment. Check back later for new challenges!',
        inline: false
      });
    }

    // Add completed challenges
    const completedChallenges = userProgress.filter(p => p.isCompleted);
    if (completedChallenges.length > 0) {
      const completedText = completedChallenges.slice(0, 5).map(progress => {
        const date = new Date(progress.completedAt);
        return `✅ **${progress.challenge.name}** - <t:${Math.floor(date.getTime() / 1000)}:R>`;
      }).join('\n');

      embed.addFields({
        name: `🏆 Recently Completed (${completedChallenges.length} total)`,
        value: completedText,
        inline: false
      });
    }

    // Add navigation buttons
    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('achievements_view')
          .setLabel('🏆 Achievements')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('challenges_view')
          .setLabel('🎯 Challenges')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('titles_view')
          .setLabel('👑 Titles')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('progress_view')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('🔙 Back to Menu')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons]
    });
  } catch (error) {
    console.error('Error in handleChallengesView:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fetching challenges.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Helper function to create progress bars
function createProgressBar(percentage) {
  // Ensure percentage is between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const filled = Math.round(clampedPercentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Show battle encounter UI
async function showBattleEncounter(interaction, user, beast, foundItems, chestCoins, storedBeastStats = null) {
  const BattleSystem = require('./battle-system');
  const { getBeastImage } = require('./beast-images');
  const playerStats = await BattleSystem.calculatePlayerStats(user);
  const beastStats = storedBeastStats || BattleSystem.calculateBeastStats(beast, user.level, user.currentZone);

  // Create health bar function
  const createHealthBar = (current, max, length = 8) => {
    const percentage = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  // Get rarity emoji and color
  const rarityEmoji = {
    'UNCOMMON': '🟢',
    'RARE': '🔵', 
    'LEGENDARY': '🟡',
    'MYTHIC': '🔴'
  };
  const rarityColor = {
    'UNCOMMON': '#00FF00',
    'RARE': '#0080FF',
    'LEGENDARY': '#FFD700', 
    'MYTHIC': '#FF0000'
  };

  // Check if beast is sparkling
  const isSparkling = beastStats.isSparkling || false;
  const sparkleEmoji = isSparkling ? '✨ ' : '';
  
  // Check if this is a boss
  const bossNames = [
    'Colossus of Aztec', // Jungle Ruins boss
    'Ancient Guardian of the Jungle',
    'Frost Giant King', 
    'Desert Pharaoh',
    'Abyssal Leviathan',
    'Volcanic Titan',
    'Shadow Lord',
    'Storm Dragon',
    'Void Emperor',
    'Celestial Archon',
    'Divine Seraph'
  ];
  const isBoss = bossNames.includes(beast.name);
  const bossEmoji = isBoss ? '🏰 ' : '';
  const bossTitle = isBoss ? 'BOSS ENCOUNTER!' : 'Wild Encounter!';
  const bossColor = isBoss ? '#FF0000' : (rarityColor[beast.rarity] || '#FF0000');
  
  // Validate player stats
  if (!playerStats || !playerStats.hp || !playerStats.attack || !playerStats.defense) {
    // Fallback to basic stats if calculation fails
    const fallbackStats = {
      hp: user.baseHp + (user.level * 10),
      attack: user.baseAttack + (user.level * 2),
      defense: user.baseDefense + (user.level * 1)
    };
    playerStats = fallbackStats;
  }

  // Get beast image if available
  const beastImageUrl = getBeastImage(beast.name);
  
  const embed = new EmbedBuilder()
    .setColor(bossColor)
    .setTitle(`${bossEmoji}${getItemEmoji(beast.name || "Beast", beast.rarity)} ${bossTitle}`)
    .setDescription(`${sparkleEmoji}**${beast.name}** - ${beast.rarity}${isSparkling ? ' ✨' : ''}\n${beast.description}${isSparkling ? '\n\n✨ **This beast is sparkling with extra power!**\n└ **Sparkling Modifiers:** +50% loot quantity, +30% higher tier chance' : ''}${isBoss ? '\n\n🏰 **A ZONE BOSS HAS APPEARED!**' : ''}\n\n*Do you stand your ground or flee?*`)
    .addFields(
      { 
        name: '👤 Your Stats', 
        value: `HP: ${createHealthBar(playerStats.hp, playerStats.hp)} ${playerStats.hp}\nAttack: ⚔️ ${playerStats.attack} Defense: 🛡️ ${playerStats.defense}`, 
        inline: true 
      },
      { 
        name: '🦴 Beast Stats', 
        value: `HP: ${createHealthBar(beastStats.hp, beastStats.hp)} ${beastStats.hp}\nAttack: ⚔️ ${beastStats.attack} Defense: 🛡️ ${beastStats.defense}`, 
        inline: true 
      },
              { 
          name: '💎 Potential Loot', 
          value: (() => {
            // Calculate boss loot if this is a boss
            if (isBoss) {
              // Calculate boss-specific coin rewards (much higher than regular beasts)
              const bossIndex = bossNames.indexOf(beast.name);
              const baseCoins = 10000 + (bossIndex * 5000); // 10K for first boss, 15K for second, etc.
              const minCoins = Math.floor(baseCoins * 0.8); // 80% of base
              const maxCoins = Math.floor(baseCoins * 1.2); // 120% of base
              const estimatedItems = Math.floor(beast.baseHp / 50) + 20; // More items for bosses
              return `📦 ~${estimatedItems} items\n💰 +${minCoins.toLocaleString()} - ${maxCoins.toLocaleString()} coins`;
            } else {
              return foundItems.length > 0 ? `📦 ${foundItems.length} items\n💰 +${chestCoins} coins` : `💰 +${chestCoins} coins`;
            }
          })(), 
          inline: true 
        }
    )
    .setImage(beastImageUrl || null) // Use setImage for larger display
    .setTimestamp();

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('battle_fight')
        .setLabel('⚔️ Fight')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('battle_flee')
        .setLabel('🚪 Flee')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

// Handle battle fight - initialize the battle
async function handleBattleFight(interaction) {
  try {
    console.log('[DEBUG] handleBattleFight started');
    const discordId = interaction.user.id;
    console.log('[DEBUG] Discord ID:', discordId);
    
    // IMMEDIATELY check for stored encounter beast first
    console.log('[DEBUG] Checking global.encounterBeasts:', global.encounterBeasts ? 'exists' : 'null');
    let beast = null;
    let storedStats = null;
    
    if (global.encounterBeasts && global.encounterBeasts.has(discordId)) {
      console.log('[DEBUG] Found stored encounter for user');
      const encounterData = global.encounterBeasts.get(discordId);
      beast = encounterData.beast;
      storedStats = encounterData.stats;
      console.log('[DEBUG] Beast from storage:', beast?.name, beast?.rarity);
      // DON'T delete yet - only after successful battle initialization
    } else {
      console.log('[DEBUG] No stored encounter, getting random beast');
      // Fallback: get a random beast for the user's current zone
      beast = await BattleSystem.getRandomBeastForRegion(user.currentZone || 'Jungle Ruins');
      console.log('[DEBUG] Random beast:', beast?.name, beast?.rarity);
    }
    
    if (!beast) {
      console.log('[DEBUG] Beast not found');
      await interaction.editReply({
        content: '❌ Beast not found.',
        ephemeral: true
      });
      return;
    }
    console.log('[DEBUG] Beast found:', beast.name, beast.rarity);

    // Get user data AFTER we have the beast
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      console.log('[DEBUG] User not found');
      await interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
      return;
    }
        console.log('[DEBUG] User found:', user.id);

    // Get the BattleSystem
    const BattleSystem = require('./battle-system');

    // Initialize the battle with stored stats if available
    console.log('[DEBUG] Initializing battle...');
    const battleState = await BattleSystem.initializeBattle(user, beast, storedStats);
    console.log('[DEBUG] Battle initialized, state:', battleState ? 'valid' : 'null');
  
  // Store battle state in a simple way (in production, you'd want to use a proper cache/database)
  // For now, we'll store it in a global variable (not ideal but works for demo)
  if (!global.activeBattles) {
    global.activeBattles = new Map();
  }
  global.activeBattles.set(discordId, { battleState, beast, user });
  console.log('[DEBUG] Battle stored in global.activeBattles, size:', global.activeBattles.size);
  console.log('[DEBUG] Stored beast details - Name:', beast.name, 'Rarity:', beast.rarity, 'ID:', beast.id);
  
  // Now that battle is successfully initialized, we can safely remove the encounter beast
  if (global.encounterBeasts && global.encounterBeasts.has(discordId)) {
    console.log('[DEBUG] Removing encounter beast from storage after successful battle initialization');
    global.encounterBeasts.delete(discordId);
  }
  
  // Show the battle interface with action buttons
  console.log('[DEBUG] Calling showBattleInterface...');
  await showBattleInterface(interaction, battleState, beast, user);
  console.log('[DEBUG] showBattleInterface completed');
  } catch (error) {
    console.error('Error in handleBattleFight:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while starting the battle.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Show battle interface with action buttons
async function showBattleInterface(interaction, battleState, beast, user) {
  console.log('[DEBUG] showBattleInterface started');
  const BattleSystem = require('./battle-system');
  const { getBeastImage } = require('./beast-images');
  
  // Validate battle state
  console.log('[DEBUG] Validating battle state:', battleState ? 'exists' : 'null');
  if (!battleState || !battleState.playerStats) {
    console.error('Invalid battle state or missing player stats:', battleState);
    await interaction.editReply({
      content: '❌ Error: Battle state is invalid. Please try again.',
      ephemeral: true
    });
    return;
  }
  console.log('[DEBUG] Battle state is valid');
  
  // Create health bar function
  const createHealthBar = (current, max, length = 10) => {
    const percentage = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${current}/${max}`;
  };

  // Get rarity emoji and color
  const rarityEmoji = {
    'UNCOMMON': '🟢',
    'RARE': '🔵', 
    'LEGENDARY': '🟡',
    'MYTHIC': '🔴'
  };
  const rarityColor = {
    'UNCOMMON': '#00FF00',
    'RARE': '#0080FF',
    'LEGENDARY': '#FFD700', 
    'MYTHIC': '#FF0000'
  };

  // Check if beast is sparkling
  const isSparkling = battleState.beastStats?.isSparkling || false;
  const sparkleEmoji = isSparkling ? '✨ ' : '';
  
  // Check if this is a boss
  const bossNames = [
    'Ancient Guardian of the Jungle',
    'Frost Giant King', 
    'Desert Pharaoh',
    'Abyssal Leviathan',
    'Volcanic Titan',
    'Shadow Lord',
    'Storm Dragon',
    'Void Emperor',
    'Celestial Archon',
    'Divine Seraph'
  ];
  const isBoss = bossNames.includes(beast.name);
  const bossEmoji = isBoss ? '🏰 ' : '';
  const bossTitle = isBoss ? 'BOSS BATTLE!' : 'Battle in Progress!';
  const bossColor = isBoss ? '#FF0000' : (rarityColor[beast.rarity] || '#FF0000');
  
  // Get beast image if available
  const beastImageUrl = getBeastImage(beast.name);
  
  const embed = new EmbedBuilder()
    .setColor(bossColor)
    .setTitle(`${bossEmoji}${getItemEmoji(beast.name || "Beast", beast.rarity)} ${bossTitle}`)
    .setDescription(`${sparkleEmoji}**${beast.name}** - ${beast.rarity}${isSparkling ? ' ✨' : ''}\n${beast.description}${isSparkling ? '\n\n✨ **This beast is sparkling with extra power!**\n└ **Sparkling Modifiers:** +50% loot quantity, +30% higher tier chance' : ''}${isBoss ? '\n\n🏰 **You are fighting a ZONE BOSS!**' : ''}`)
    .addFields(
      { 
        name: '👤 Your Stats', 
        value: `HP: ${createHealthBar(battleState.playerHp, battleState.playerMaxHp)}\n⚔️ **Attack:** ${battleState.playerStats.attack}\n🛡️ **Defense:** ${battleState.playerStats.defense}`, 
        inline: true 
      },
      { 
        name: '🦴 Beast Stats', 
        value: `HP: ${createHealthBar(battleState.beastHp, battleState.beastMaxHp)}\n⚔️ **Attack:** ${battleState.beastStats.attack}\n🛡️ **Defense:** ${battleState.beastStats.defense}`, 
        inline: true 
      },
      { 
        name: '⚔️ Round', 
        value: `**${battleState.currentRound}**`, 
        inline: true 
      },
      {
        name: '⚡ Energy',
        value: `${battleState.energy}/100`,
        inline: true
      },
      {
        name: '🌟 Ultimate',
        value: `${battleState.ultimateProgress}%${battleState.ultimateReady ? ' **READY!**' : ''}`,
        inline: true
      },
      {
        name: '😤 Beast Rage',
        value: `${Math.round(battleState.beastRage * 100)}%`,
        inline: true
      }
    );
    
    // Add stun status if beast is stunned
    if (battleState.beastStunned && battleState.beastStunned > 0) {
      embed.addFields({
        name: '💫 Beast Status',
        value: `🦴 ${beast.name} is **STUNNED** for ${battleState.beastStunned} more round${battleState.beastStunned !== 1 ? 's' : ''}!`,
        inline: false
      });
    }
    
    embed.setImage(beastImageUrl || null) // Use setImage for larger display
    .setTimestamp();

  // Add battle log if there are any actions (optimized)
  if (battleState.battleLog.length > 0) {
    const lastRoundLogs = battleState.battleLog.filter(log => log.round === battleState.currentRound - 1);
    if (lastRoundLogs.length > 0) {
      // Simplified battle log processing for better performance
      const log = lastRoundLogs[0]; // Take the first log entry for simplicity
      let roundText = '';
      
      // Player action summary
      if (log.playerDodged) {
        roundText += `👤 **You attack!** 🗡️\n🦴 ${beast.name} **DODGED!** 💨\n`;
      } else if (log.playerDamage) {
        const damageEmoji = log.playerCritical ? '💥' : '⚔️';
        const criticalHit = log.playerCritical ? ' **CRITICAL!**' : '';
        roundText += `👤 **You attack!** ${damageEmoji} ${log.playerDamage} damage${criticalHit}\n`;
      } else if (log.playerDefended) {
        roundText += `👤 **You defend!** 🛡️\n`;
      } else if (log.playerSkill) {
        roundText += `👤 **${log.skillName}!** ${log.playerDamage || 0} damage\n`;
      }
      
      // Beast action summary
      if (log.beastDodged) {
        roundText += `🦴 **${beast.name} attacks!** 🦴\n👤 You **DODGED!** 💨\n`;
      } else if (log.beastDamage) {
        const damageEmoji = log.beastCritical ? '💥' : '🦴';
        const criticalHit = log.beastCritical ? ' **CRITICAL!**' : '';
        roundText += `🦴 **${beast.name} attacks!** ${damageEmoji} ${log.beastDamage} damage${criticalHit}\n`;
      }
      
      if (roundText) {
        embed.addFields({
          name: `⚔️ Round ${battleState.currentRound - 1} Results`,
          value: roundText,
          inline: false
        });
      }
    }
  }

  // Create action buttons with cooldowns and energy costs (optimized)
  const actions = await BattleSystem.getPlayerActions(user.id);
  
  // Create skill action buttons (4 slots) - FIRST ROW
  const skillActionButtons = new ActionRowBuilder();
  const skillActions = actions.filter(action => action.id.startsWith('skill_'));
  
  // Optimized skill slot creation
  for (let slot = 1; slot <= 4; slot++) {
    const skillAction = skillActions.find(action => action.slot === slot);
    
    if (skillAction) {
      const skillId = skillAction.skillId;
      const skillCooldown = battleState.skillCooldowns?.[skillId] || 0;
      
      let buttonLabel = skillAction.name;
      let buttonStyle = ButtonStyle.Success;
      let disabled = false;
      
      // Quick cooldown and energy checks
      if (skillCooldown > 0) {
        buttonLabel = `${skillAction.name} (${skillCooldown})`;
        buttonStyle = ButtonStyle.Secondary;
        disabled = true;
      } else if (skillAction.type === 'ACTIVE' && battleState.energy < 30) {
        buttonLabel = `${skillAction.name} (No Energy)`;
        buttonStyle = ButtonStyle.Secondary;
        disabled = true;
      } else if (skillAction.type === 'ULTIMATE' && !battleState.ultimateReady) {
        buttonLabel = `${skillAction.name} (${battleState.ultimateProgress}%)`;
        buttonStyle = ButtonStyle.Secondary;
        disabled = true;
      } else if (skillAction.type === 'ULTIMATE' && battleState.ultimateReady) {
        buttonLabel = `${skillAction.name} (READY!)`;
        buttonStyle = ButtonStyle.Danger;
      }
      
      skillActionButtons.addComponents(
        new ButtonBuilder()
          .setCustomId(`battle_action_${skillAction.id}`)
          .setLabel(buttonLabel)
          .setStyle(buttonStyle)
          .setDisabled(disabled)
      );
    } else {
      // Empty slot
      skillActionButtons.addComponents(
        new ButtonBuilder()
          .setCustomId(`empty_slot_${slot}`)
          .setLabel('No slotted ability')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );
    }
  }

  // Create basic action buttons (attack, defend, ultimate, flee) - SECOND ROW
  const basicActionButtons = new ActionRowBuilder();
  const basicActions = actions.filter(action => !action.id.startsWith('skill_'));
  
  // Optimized basic action button creation
  basicActions.forEach(action => {
    let buttonLabel = action.name;
    let buttonStyle = ButtonStyle.Primary;
    let disabled = false;
    
    // Quick cooldown check for defend
    if (action.id === 'defend' && battleState.actionCooldowns.defend > 0) {
      buttonLabel = `🛡️ Defend (${battleState.actionCooldowns.defend} rounds)`;
      buttonStyle = ButtonStyle.Secondary;
      disabled = true;
    }
    
    basicActionButtons.addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_action_${action.id}`)
        .setLabel(buttonLabel)
        .setStyle(buttonStyle)
        .setDisabled(disabled)
    );
  });

  // Add ultimate button to the same row (optimized)
  const ultimateSkill = skillActions.find(action => action.type === 'ULTIMATE');
  if (ultimateSkill) {
    const isReady = battleState.ultimateReady;
    const ultimateLabel = isReady ? `${ultimateSkill.name} (READY!)` : `🌟 Ultimate (${battleState.ultimateProgress}%)`;
    const ultimateStyle = isReady ? ButtonStyle.Danger : ButtonStyle.Secondary;
    const ultimateDisabled = !isReady;
    
    basicActionButtons.addComponents(
      new ButtonBuilder()
        .setCustomId(`battle_action_${ultimateSkill.id}`)
        .setLabel(ultimateLabel)
        .setStyle(ultimateStyle)
        .setDisabled(ultimateDisabled)
    );
  } else {
    // No ultimate equipped - show greyed out button
    basicActionButtons.addComponents(
      new ButtonBuilder()
        .setCustomId('ultimate_not_equipped')
        .setLabel('🌟 Ultimate (Not Equipped)')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
  }
  
  // Add flee button to the same row
  basicActionButtons.addComponents(
    new ButtonBuilder()
      .setCustomId('battle_flee_during_battle')
      .setLabel('🚪 Flee Battle')
      .setStyle(ButtonStyle.Secondary)
  );

  console.log('[DEBUG] About to send battle interface reply');
  await interaction.editReply({
    embeds: [embed],
    components: [skillActionButtons, basicActionButtons]
  });
  console.log('[DEBUG] Battle interface reply sent successfully');
  // This function will be replaced by the new turn-based system
  // The old battle result code has been removed
}

// Handle battle action (attack, defend, special)
async function handleBattleAction(interaction, action) {
  try {
    console.log('[DEBUG] handleBattleAction started for action:', action);
    const discordId = interaction.user.id;
    console.log('[DEBUG] Discord ID:', discordId);
    console.log('[DEBUG] global.activeBattles exists:', !!global.activeBattles);
    console.log('[DEBUG] global.activeBattles size:', global.activeBattles ? global.activeBattles.size : 'N/A');
    console.log('[DEBUG] Has battle for user:', global.activeBattles ? global.activeBattles.has(discordId) : false);
    
    // Get the active battle
    if (!global.activeBattles || !global.activeBattles.has(discordId)) {
      console.log('[DEBUG] No active battle found for user:', discordId);
      console.log('[DEBUG] Available battles:', global.activeBattles ? Array.from(global.activeBattles.keys()) : 'none');
      await interaction.editReply({
        content: '❌ No active battle found.',
        ephemeral: true
      });
      return;
    }
  
  const { battleState, beast, user } = global.activeBattles.get(discordId);
  console.log('[DEBUG] Retrieved battle data - beast:', beast?.name, 'rarity:', beast?.rarity, 'ID:', beast?.id, 'round:', battleState?.currentRound);
  const BattleSystem = require('./battle-system');
  
  try {
    // Execute the player's action with optimized processing
    const updatedBattleState = await BattleSystem.executePlayerAction(battleState, action);
    
    // Update the stored battle state
    global.activeBattles.set(discordId, { battleState: updatedBattleState, beast, user });
    console.log('[DEBUG] Updated battle state, new round:', updatedBattleState.currentRound);
    console.log('[DEBUG] global.activeBattles size after update:', global.activeBattles.size);
    
    // Check if battle is complete
    console.log('[DEBUG] Battle state isComplete:', updatedBattleState.isComplete);
    console.log('[DEBUG] Player HP:', updatedBattleState.playerHp, '/', updatedBattleState.playerMaxHp);
    console.log('[DEBUG] Beast HP:', updatedBattleState.beastHp, '/', updatedBattleState.beastMaxHp);
    
    if (updatedBattleState.isComplete) {
      console.log('[DEBUG] Battle is complete, calling handleBattleComplete');
      await handleBattleComplete(interaction, updatedBattleState, beast, user);
    } else {
      // Show the next round interface with optimized rendering
      console.log('[DEBUG] Battle continuing, calling showBattleInterface');
      await showBattleInterface(interaction, updatedBattleState, beast, user);
    }
  } catch (error) {
    console.error('Error in handleBattleAction:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred during battle. Please try again.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
  } catch (error) {
    console.error('Error in handleBattleAction:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred during battle. Please try again.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Handle battle completion
async function handleBattleComplete(interaction, battleState, beast, user) {
  console.log('[DEBUG] handleBattleComplete called - this should only happen when battle is truly complete');
  console.log('[DEBUG] Battle result - Player won:', battleState.playerWon, 'Beast won:', battleState.beastWon);
  const BattleSystem = require('./battle-system');
  
  // Calculate base coins for reward calculation
  const baseCoins = 50; // Base exploration coins
  
  // Create a battle result object for the reward system
  const battleResult = {
    playerWon: battleState.playerWon,
    beastWon: battleState.beastWon,
    battleLog: battleState.battleLog,
    finalPlayerHp: battleState.playerHp,
    finalBeastHp: battleState.beastHp,
    rounds: battleState.currentRound - 1
  };
  
  // Process battle results
  const results = await BattleSystem.processBattleResults(user, beast, battleResult, baseCoins);
  
  // Check if this was a boss
  const bossNames = [
    'Ancient Guardian of the Jungle',
    'Frost Giant King', 
    'Desert Pharaoh',
    'Abyssal Leviathan',
    'Volcanic Titan',
    'Shadow Lord',
    'Storm Dragon',
    'Void Emperor',
    'Celestial Archon',
    'Divine Seraph'
  ];
  const isBoss = bossNames.includes(beast.name);
  const bossEmoji = isBoss ? '🏰 ' : '';
  const bossTitle = battleState.playerWon ? 
    (isBoss ? '🏰 BOSS VICTORY!' : '🏆 Victory!') : 
    '💀 Defeat!';
  const bossColor = isBoss ? '#FF0000' : (battleState.playerWon ? '#00FF00' : '#FF0000');
  
  // Create battle result embed
  const embed = new EmbedBuilder()
    .setColor(bossColor)
    .setTitle(`${bossEmoji}${bossTitle}`)
    .setDescription(battleState.playerWon ? results.message : `The ${beast.name} was too powerful...`);

  // Create concise battle log
  const playerMaxHp = battleState.playerMaxHp;
  const beastMaxHp = battleState.beastMaxHp;
  const totalRounds = battleState.currentRound - 1;
  
  // Create health bar function
  const createHealthBar = (current, max, length = 10) => {
    const percentage = Math.max(0, Math.min(1, current / max));
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    return bar;
  };

  // Analyze battle for key moments
  const keyMoments = [];
  let maxPlayerDamage = 0;
  let maxBeastDamage = 0;
  let criticalHits = 0;
  let dodges = 0;
  let stuns = 0;
  let ultimateUsed = false;
  let specialUsed = false;
  let totalHealing = 0;
  let maxHealing = 0;
  let statusEffects = new Set();
  let skillUses = 0;

  battleState.battleLog.forEach((log) => {
    // Track statistics
    if (log.playerDamage && log.playerDamage > maxPlayerDamage) maxPlayerDamage = log.playerDamage;
    if (log.beastDamage && log.beastDamage > maxBeastDamage) maxBeastDamage = log.beastDamage;
    if (log.playerCritical || log.beastCritical) criticalHits++;
    if (log.playerDodged || log.beastDodged) dodges++;
    if (log.beastStunned) stuns++;
    if (log.playerUltimate) ultimateUsed = true;
    if (log.playerSpecial) specialUsed = true;
    
    // Track healing and status effects
    if (log.playerHealing) {
      totalHealing += log.playerHealing;
      if (log.playerHealing > maxHealing) maxHealing = log.playerHealing;
    }
    if (log.passiveHealing) {
      totalHealing += log.passiveHealing;
      if (log.passiveHealing > maxHealing) maxHealing = log.passiveHealing;
    }
    if (log.playerSkill) skillUses++;
    
    // Track status effects
    if (log.statusEffects && log.statusEffects.length > 0) {
      log.statusEffects.forEach(effect => {
        if (effect.includes('Bleeding')) statusEffects.add('Bleeding');
        if (effect.includes('Poison')) statusEffects.add('Poison');
        if (effect.includes('Burning')) statusEffects.add('Burning');
        if (effect.includes('Frozen')) statusEffects.add('Frozen');
        if (effect.includes('Stunned')) statusEffects.add('Stunned');
      });
    }

    // Record key moments (first 3 rounds, last 3 rounds, and any special events)
    if (log.round <= 3 || log.round >= totalRounds - 2 || 
        log.playerCritical || log.beastCritical || 
        log.playerUltimate || log.beastStunned || 
        log.playerDodged || log.beastDodged) {
      keyMoments.push(log);
    }
  });

  // Create simplified battle summary
  let battleSummaryText = '';
  
  // Battle statistics
  battleSummaryText += `**⚔️ Statistics:**\n`;
  battleSummaryText += `• **Duration:** ${totalRounds} round${totalRounds !== 1 ? 's' : ''}\n`;
  battleSummaryText += `• **Your Max Damage:** ${maxPlayerDamage}\n`;
  battleSummaryText += `• **Beast Max Damage:** ${maxBeastDamage}\n`;
  
  if (criticalHits > 0) battleSummaryText += `• **Critical Hits:** ${criticalHits}\n`;
  if (dodges > 0) battleSummaryText += `• **Dodges:** ${dodges}\n`;
  if (stuns > 0) battleSummaryText += `• **Stuns:** ${stuns}\n`;
  if (ultimateUsed) battleSummaryText += `• **Ultimate Used:** Yes\n`;
  if (specialUsed) battleSummaryText += `• **Special Attacks:** Yes\n`;
  if (skillUses > 0) battleSummaryText += `• **Skills Used:** ${skillUses}\n`;
  
  // Add final health to the same section
  const finalPlayerHp = battleState.playerHp;
  const finalBeastHp = battleState.beastHp;
  battleSummaryText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  battleSummaryText += `**📊 Final Health:**\n`;
  battleSummaryText += `👤 You: ${createHealthBar(finalPlayerHp, playerMaxHp)} ${finalPlayerHp}/${playerMaxHp}\n`;
  battleSummaryText += `🦴 ${beast.name}: ${createHealthBar(finalBeastHp, beastMaxHp)} ${finalBeastHp}/${beastMaxHp}`;
  
  // Key moments with enhanced features
  const keyEvents = [];
  if (maxPlayerDamage > 0) keyEvents.push(`💥 **${maxPlayerDamage} damage** (your best hit)`);
  if (maxBeastDamage > 0) keyEvents.push(`🦴 **${maxBeastDamage} damage** (beast's best hit)`);
  if (criticalHits > 0) keyEvents.push(`💥 **${criticalHits} critical hits**`);
  if (ultimateUsed) keyEvents.push(`🌟 **Ultimate attack**`);
  if (stuns > 0) keyEvents.push(`💫 **${stuns} stuns**`);
  
  // Add healing and status effects to key moments
  if (totalHealing > 0) keyEvents.push(`💚 **${totalHealing} total healing**`);
  if (maxHealing > 0) keyEvents.push(`💚 **${maxHealing} best heal**`);
  if (statusEffects.size > 0) {
    const statusList = Array.from(statusEffects).map(status => {
      const emoji = status === 'Bleeding' ? '🩸' : 
                   status === 'Poison' ? '☠️' : 
                   status === 'Burning' ? '🔥' : 
                   status === 'Frozen' ? '❄️' : 
                   status === 'Stunned' ? '💫' : '❓';
      return `${emoji} ${status}`;
    }).join(', ');
    keyEvents.push(`⚡ **Status effects**: ${statusList}`);
  }
  
  if (keyEvents.length > 0) {
    battleSummaryText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    battleSummaryText += `**🎯 Key Moments:**\n`;
    battleSummaryText += keyEvents.join('\n');
  }
  
  battleLogText = battleSummaryText;

  if (battleLogText) {
    // Add battle summary field
    embed.addFields({
      name: '⚔️ Battle Summary',
      value: battleLogText,
      inline: false
    });
  }

  // Add rewards if won
  if (battleState.playerWon && results.loot) {
    const lootText = results.loot.map(lootItem => 
      `${lootItem.item.rarity === 'MYTHIC' ? '🔴' : 
       lootItem.item.rarity === 'LEGENDARY' ? '🟡' : 
       lootItem.item.rarity === 'RARE' ? '🔵' : 
       lootItem.item.rarity === 'UNCOMMON' ? '🟢' : '⚪'} **${lootItem.item.name}**`
    ).join('\n');

    embed.addFields({
      name: '🎁 Battle Loot',
      value: lootText || 'No special loot this time.',
      inline: false
    });

    if (results.coinReward > 0) {
      embed.addFields({
        name: '💰 Coin Reward',
        value: `+${results.coinReward} coins`,
        inline: true
      });
    }

    if (results.xpReward > 0) {
      embed.addFields({
        name: '⭐ XP Reward',
        value: `+${results.xpReward} XP`,
        inline: true
      });
    }
  } else if (!battleState.playerWon && results.coinPenalty) {
    embed.addFields({
      name: '💰 Coin Penalty',
      value: `-${results.coinPenalty} coins`,
      inline: true
    });
  }

  // Add navigation buttons
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🏠 Main Menu')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('explore')
        .setLabel('🔍 Explore Again')
        .setStyle(ButtonStyle.Primary)
    );

  // Clean up the active battle
  console.log('[DEBUG] Cleaning up battle from global.activeBattles for user:', interaction.user.id);
  global.activeBattles.delete(interaction.user.id);
  console.log('[DEBUG] Battle cleanup completed');

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

// Handle battle flee (from encounter)
async function handleBattleFlee(interaction) {
  try {
    const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle('🏃‍♂️ You Fled!')
    .setDescription('You chose to flee from the encounter. No rewards, but no penalties either.')
    .setTimestamp();

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🏠 Main Menu')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
  } catch (error) {
    console.error('Error in handleBattleFlee:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fleeing from the encounter.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Handle battle flee (during active battle)
async function handleBattleFleeDuringBattle(interaction) {
  try {
    const discordId = interaction.user.id;
    
    // Get the active battle
    if (!global.activeBattles || !global.activeBattles.has(discordId)) {
      await interaction.editReply({
        content: '❌ No active battle found.',
        ephemeral: true
      });
      return;
    }
  
  const { battleState, beast, user } = global.activeBattles.get(discordId);
  
  // Calculate flee penalty (higher than normal loss penalty)
  const baseCoins = 50;
  const fleePenalty = Math.min(150, Math.floor(baseCoins * 0.4)); // 40% of base coins, max 150
  
  // Apply penalty
  await prisma.user.update({
    where: { id: user.id },
    data: {
      coins: { decrement: fleePenalty }
    }
  });
  
  // Clean up the active battle
  global.activeBattles.delete(discordId);
  
  const embed = new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('🏃‍♂️ You Fled from Battle!')
    .setDescription(`You chose to flee from the ${beast.name} during combat. This cowardice comes with a price...`)
    .addFields({
      name: '💰 Coin Penalty',
      value: `-${fleePenalty} coins`,
      inline: true
    })
    .setTimestamp();

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back')
        .setLabel('🏠 Main Menu')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('explore')
        .setLabel('🔍 Explore Again')
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
  } catch (error) {
    console.error('Error in handleBattleFleeDuringBattle:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while fleeing from battle.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Crafting button handlers
async function handleCraftingStations(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const stations = await CraftingSystem.getAvailableStations(user.id);
    
    // Debug: Log user info and station data
    console.log(`User level: ${user.level}, coins: ${user.coins}`);
    console.log('Stations data:', stations.map(s => ({
      name: s.name,
      unlocked: s.unlocked,
      canUnlock: s.canUnlock,
      requiredLevel: s.requiredLevel,
      unlockCost: s.unlockCost
    })));
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🏭 Crafting Stations')
      .setDescription(`Unlock new crafting stations to access more recipes!\n\n**Your Level:** ${user.level} | **Your Coins:** ${user.coins.toLocaleString()}`);

    for (const station of stations) {
      let status = '🔒 Locked';
      let description = station.description;
      
      if (station.unlocked) {
        status = '✅ Unlocked';
      } else if (station.canUnlock) {
        status = '🔓 Can Unlock';
        description += `\n**Click to unlock for ${station.unlockCost} coins**`;
      } else {
        if (user.level < station.requiredLevel) {
          description += `\n**Requires Level ${station.requiredLevel}**`;
        }
        if (user.coins < station.unlockCost) {
          description += `\n**Requires ${station.unlockCost} coins**`;
        }
      }

      embed.addFields({
        name: `${status} ${station.name}`,
        value: description,
        inline: false
      });
    }

    const buttons = [];
    for (const station of stations) {
      if (!station.unlocked && station.canUnlock) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`unlock_station_${station.id}`)
            .setLabel(`Unlock ${station.name}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔓')
        );
      }
    }

    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      buttonRows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft')
          .setLabel('🔙 Back to Crafting')
          .setStyle(ButtonStyle.Secondary)
      );

    if (buttonRows.length > 0) {
      buttonRows.push(backButton);
    } else {
      buttonRows.push(backButton);
    }

    await interaction.editReply({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling crafting stations:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading crafting stations.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleCraftingProgress(interaction) {
  try {
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const progress = await CraftingSystem.getUserCraftingProgress(user.id);
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('📊 Crafting Progress')
      .setDescription('Your crafting achievements and statistics!');

    if (progress.length === 0) {
      embed.addFields({
        name: '📋 No Progress Yet',
        value: 'Start crafting items to see your progress here!',
        inline: false
      });
    } else {
      for (const item of progress) {
        embed.addFields({
          name: `${item.recipe.resultItem.name}`,
          value: `**Crafted:** ${item.timesCrafted} times\n**Last Crafted:** ${item.lastCrafted ? new Date(item.lastCrafted).toLocaleDateString() : 'Never'}`,
          inline: true
        });
      }
    }

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory_craft')
          .setLabel('🔙 Back to Crafting')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  } catch (error) {
    console.error('Error handling crafting progress:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading crafting progress.',
      ephemeral: true
    });
  }
}

async function handleCraftingButton(interaction, customId) {
  try {
    const recipeId = customId.replace('craft_', '');
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const result = await CraftingSystem.craftItem(user.id, recipeId);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔨 Crafting Successful!')
        .setDescription(result.message)
        .addFields(
          {
            name: '🎯 Crafted Item',
            value: `${result.quantity}x **${result.craftedItem.name}**`,
            inline: true
          },
          {
            name: '💰 Cost',
            value: `${result.cost} coins`,
            inline: true
          },
          {
            name: '📊 Rarity',
            value: result.craftedItem.rarity,
            inline: true
          }
        );

      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling crafting button:', error);
    await interaction.reply({
      content: '❌ An error occurred while crafting the item.',
      ephemeral: true
    });
  }
}

async function handleUnlockStation(interaction, customId) {
  try {
    const stationId = customId.replace('unlock_station_', '');
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const result = await CraftingSystem.unlockStation(user.id, stationId);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔓 Station Unlocked!')
        .setDescription(result.message)
        .addFields(
          {
            name: '🏭 Station',
            value: result.station.name,
            inline: true
          },
          {
            name: '💰 Cost',
            value: `${result.station.unlockCost} coins`,
            inline: true
          }
        );

      // Add back button to return to crafting menu
      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('craft')
            .setLabel('Back to Crafting')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ embeds: [embed], components: [backButton] });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling unlock station:', error);
    await interaction.reply({
      content: '❌ An error occurred while unlocking the station.',
      ephemeral: true
    });
  }
}

async function handleCraftingMenu(interaction) {
  try {
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get all available crafting stations
    const CraftingSystem = require('./crafting-system');
    const allStations = await CraftingSystem.getAvailableStations(user.id);
    const unlockedStations = await CraftingSystem.getUserStations(user.id);
    
    // Create a map of unlocked station IDs for quick lookup
    const unlockedStationIds = new Set(unlockedStations.map(s => s.stationId));
    

    
    // If no stations are available, show a message with station info
    if (allStations.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🏭 Equipment Crafting')
        .setDescription('No crafting stations are available yet!\n\n**To get started:**\n• Reach higher levels to unlock crafting stations\n• Complete boss fights for special stations\n• Each station provides different equipment recipes');

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('craft_stations')
            .setLabel('View Available Stations')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏭'),
          new ButtonBuilder()
            .setCustomId('back')
            .setLabel('Back to Menu')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️')
        );

      return interaction.update({ embeds: [embed], components: [buttons] });
    }
    
    // Always show all available stations, whether unlocked or not
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🏭 Equipment Crafting')
      .setDescription('Unlock crafting stations to access equipment recipes!');

    // Add station information
    for (const station of allStations) {
      const isUnlocked = unlockedStationIds.has(station.id);
      const canUnlock = user.level >= station.requiredLevel && user.coins >= station.unlockCost;
      
      let status = '🔒';
      if (isUnlocked) {
        status = '✅';
      } else if (canUnlock) {
        status = '🔓';
      }
      
      const costText = isUnlocked ? '' : ` (${station.unlockCost} coins)`;
      const levelText = isUnlocked ? '' : ` | Level ${station.requiredLevel}`;
      const requirementText = isUnlocked ? '' : ` | You need Level ${station.requiredLevel} and ${station.unlockCost} coins`;
      
      embed.addFields({
        name: `${status} ${station.name}`,
        value: `${station.description}${costText}${levelText}${requirementText}`,
        inline: false
      });
    }

    // Create station buttons - both unlocked and locked
    const stationButtons = [];
    for (const station of allStations) {
      const isUnlocked = unlockedStationIds.has(station.id);
      const canUnlock = user.level >= station.requiredLevel && user.coins >= station.unlockCost;
      
      if (isUnlocked) {
        // Unlocked stations - can be used for crafting (Green)
        stationButtons.push(
          new ButtonBuilder()
            .setCustomId(`craft_station_${station.id}`)
            .setLabel(station.name)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🏭')
        );
      } else if (canUnlock) {
        // Locked stations that can be unlocked (Green)
        stationButtons.push(
          new ButtonBuilder()
            .setCustomId(`unlock_station_${station.id}`)
            .setLabel(`${station.name} (${station.unlockCost} coins)`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔓')
        );
      } else {
        // Locked stations that cannot be unlocked (Gray/Disabled)
        stationButtons.push(
          new ButtonBuilder()
            .setCustomId(`unlock_station_${station.id}`)
            .setLabel(`${station.name} (${station.unlockCost} coins)`)
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔒')
            .setDisabled(true)
        );
      }
    }

    // Split buttons into rows of 3
    const buttonRows = [];
    for (let i = 0; i < stationButtons.length; i += 3) {
      buttonRows.push(new ActionRowBuilder().addComponents(stationButtons.slice(i, i + 3)));
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('back')
          .setLabel('Back to Menu')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⬅️')
      );

    buttonRows.push(backButton);

    return interaction.editReply({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error in crafting menu:', error);
    await interaction.editReply({
      content: '❌ An error occurred while loading the crafting menu.',
      ephemeral: true
    });
  }
}

async function handleInventoryCraft(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const recipes = await CraftingSystem.getAvailableRecipes(user.id);
    
    if (recipes.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle('🎒 Inventory - Crafting')
        .setDescription('You don\'t have any recipes available yet!\n\n**To get started:**\n• Unlock crafting stations with the Stations button\n• Collect items from exploration and battles\n• Combine lower tier items into higher tier ones')
        .setFooter({ text: 'Crafting allows you to combine items for better value!' });

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('craft_stations')
            .setLabel('🏭 Stations')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('inventory')
            .setLabel('🔙 Back to Inventory')
            .setStyle(ButtonStyle.Secondary)
        );

      return interaction.editReply({ embeds: [embed], components: [buttons] });
    }

    // Group recipes by station
    const recipesByStation = {};
    recipes.forEach(recipe => {
      if (!recipesByStation[recipe.stationName]) {
        recipesByStation[recipe.stationName] = [];
      }
      recipesByStation[recipe.stationName].push(recipe);
    });

    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle('🎒 Inventory - Crafting')
      .setDescription(`**${interaction.user.username}**'s available recipes:`);

    for (const [stationName, stationRecipes] of Object.entries(recipesByStation)) {
      let stationText = `\n**${stationName}:**\n`;
      
      stationRecipes.forEach(recipe => {
        const status = recipe.canCraft ? '✅' : '❌';
        const costText = recipe.craftingCost > 0 ? ` (${recipe.craftingCost} coins)` : '';
        stationText += `${status} **${recipe.name}**${costText}\n`;
      });
      
      embed.addFields({
        name: stationName,
        value: stationText,
        inline: false
      });
    }

    embed.addFields({
      name: '📋 How to Craft',
      value: 'Use `/craft create [recipe_name]` to craft an item\nUse `/craft recipe [recipe_name]` to view recipe details\nUse the Stations button to unlock new crafting stations',
      inline: false
    });

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_stations')
          .setLabel('🏭 Stations')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('craft_progress')
          .setLabel('📊 Progress')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('inventory')
          .setLabel('🔙 Back to Inventory')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({ embeds: [embed], components: [buttons] });
  } catch (error) {
    console.error('Error in inventory crafting:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading the crafting menu.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

// Class selection and profile navigation handlers
async function handleClassSelection(interaction) {
  try {
    const className = interaction.customId.replace('choose_class_', '');
    const userId = interaction.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Change class
    const SkillSystem = require('./skill-system');
    const result = await SkillSystem.changeClass(user.id, className);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎭 Class Selected!')
        .setDescription(`**${interaction.user.username}** is now a **${className}**!`)
        .addFields({
          name: '📊 New Base Stats',
          value: `HP: ${result.class.baseHp} (+${result.class.hpPerLevel}/level)\nAttack: ${result.class.baseAttack} (+${result.class.attackPerLevel}/level)\nDefense: ${result.class.baseDefense} (+${result.class.defensePerLevel}/level)`,
          inline: true
        })
        .addFields({
          name: '🎯 Next Steps',
          value: 'Use `/profile` to view your character\nUse `/skills tree` to explore your skill tree\nUse `/skills learn <skill_name>` to learn abilities',
          inline: true
        });

      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling class selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while selecting your class.',
      ephemeral: true
    });
  }
}

async function handleViewSkillTree(interaction) {
  try {
    const userId = interaction.user.id;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user || !user.playerClass) {
      return interaction.reply({
        content: '❌ You need to choose a class first!',
        ephemeral: true
      });
    }

    // Redirect to skills tree command
    const { execute } = require('../commands/skills');
    const mockInteraction = {
      ...interaction,
      options: {
        getSubcommand: () => 'tree',
        getString: () => null
      }
    };

    await execute(mockInteraction);
  } catch (error) {
    console.error('Error handling view skill tree:', error);
    await interaction.reply({
      content: '❌ An error occurred while viewing your skill tree.',
      ephemeral: true
    });
  }
}

async function handleViewEquipment(interaction) {
  try {
    const userId = interaction.user.id;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Redirect to equipment command
    const { execute } = require('../commands/equipment');
    const mockInteraction = {
      ...interaction,
      options: {
        getSubcommand: () => 'view'
      }
    };

    await execute(mockInteraction);
  } catch (error) {
    console.error('Error handling view equipment:', error);
    await interaction.reply({
      content: '❌ An error occurred while viewing your equipment.',
      ephemeral: true
    });
  }
}

async function handleChangeClass(interaction) {
  try {
    await interaction.deferUpdate();
    
    const userId = interaction.user.id;
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    // Check if user has completed tutorial
    if (!user.tutorialCompleted) {
      // Allow free class change before tutorial completion
      const { execute } = require('../commands/skills');
      const mockInteraction = {
        ...interaction,
        options: {
          getSubcommand: () => 'class',
          getString: () => null
        }
      };

      await execute(mockInteraction);
      return;
    }

    // Post-tutorial class change requires high cost
    const classChangeCost = 100000; // 100k coins
    const requiredLevel = 50; // Level 50 requirement

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔄 Class Change')
      .setDescription('Changing your class after completing the tutorial requires a significant investment.')
      .addFields(
        {
          name: '💰 Cost',
          value: `${classChangeCost.toLocaleString()} coins`,
          inline: true
        },
        {
          name: '⭐ Level Requirement',
          value: `Level ${requiredLevel}+`,
          inline: true
        },
        {
          name: '⚠️ Warning',
          value: 'Changing your class will:\n• Reset all learned skills\n• Reset skill points\n• Keep your level and coins',
          inline: false
        }
      );

    // Check if user meets requirements
    const canAfford = user.coins >= classChangeCost;
    const meetsLevel = user.level >= requiredLevel;
    
    if (!canAfford || !meetsLevel) {
      embed.addFields({
        name: '❌ Requirements Not Met',
        value: `${!meetsLevel ? `• Need level ${requiredLevel}+ (current: ${user.level})\n` : ''}${!canAfford ? `• Need ${classChangeCost.toLocaleString()} coins (current: ${user.coins.toLocaleString()})` : ''}`,
        inline: false
      });
      
      embed.setColor('#FF0000');
      
      // Add back button even when requirements aren't met
      const backButton = new ButtonBuilder()
        .setCustomId('class_menu')
        .setLabel('🔙 Back to Class')
        .setStyle(ButtonStyle.Secondary);

      const buttonRow = new ActionRowBuilder().addComponents(backButton);
      
      await interaction.editReply({
        embeds: [embed],
        components: [buttonRow]
      });
      return;
    }

    // User meets requirements, show confirmation
    embed.setColor('#00FF00');
    embed.addFields({
      name: '✅ Requirements Met',
      value: 'You can change your class! Click the button below to proceed.',
      inline: false
    });

    const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_class_change')
      .setLabel('🔄 Confirm Class Change')
      .setStyle(ButtonStyle.Danger);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_class_change')
      .setLabel('❌ Cancel')
      .setStyle(ButtonStyle.Secondary);

    const backButton = new ButtonBuilder()
      .setCustomId('class_menu')
      .setLabel('🔙 Back to Class')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder().addComponents(confirmButton, cancelButton, backButton);

    await interaction.editReply({
      embeds: [embed],
      components: [buttonRow]
    });

  } catch (error) {
    console.error('Error handling change class:', error);
    await interaction.editReply('❌ An error occurred while changing your class.');
  }
}

// Class menu handler
async function handleClassMenu(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    if (!user.playerClass) {
      return interaction.editReply('❌ You need to choose a class first! Use `/profile` to select your class.');
    }

    // Get class information
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: user.playerClass }
    });

    if (!playerClass) {
      return interaction.editReply('❌ Class information not found.');
    }

    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });

    // Get class skill branches
    const classSkills = await prisma.classSkill.findMany({
      where: { classId: playerClass.id },
      include: { skill: true }
    });

    const branches = [...new Set(classSkills.map(cs => cs.branch))].filter(b => b !== 'General');

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle(`🎭 ${user.playerClass} - Class Information`)
      .setDescription(`${playerClass.description}`)
      .addFields(
        {
          name: '📊 Base Stats',
          value: `HP: ${playerClass.baseHp} (+${playerClass.hpPerLevel}/level)\nAttack: ${playerClass.baseAttack} (+${playerClass.attackPerLevel}/level)\nDefense: ${playerClass.baseDefense} (+${playerClass.defensePerLevel}/level)`,
          inline: true
        },
        {
          name: '🎯 Skill Points',
          value: `${user.skillPoints || 0} available (${user.totalSkillPoints || 0} total)\nEarn 2 points every 5 levels!`,
          inline: true
        },
        {
          name: '🌳 Skill Branches',
          value: branches.map(branch => {
            // Get all skills in this branch that the user has learned
            const branchSkills = userSkills.filter(us => {
              // Check if this user skill's skill belongs to this branch
              const classSkill = classSkills.find(cs => 
                cs.skillId === us.skillId && cs.branch === branch
              );
              return classSkill;
            });
            const totalBranchSkills = classSkills.filter(cs => cs.branch === branch).length;
            return `• **${branch}**: ${branchSkills.length}/${totalBranchSkills} skills learned`;
          }).join('\n'),
          inline: false
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    // Create branch selection buttons with proper styling
    const branchButtons = [];
    for (const branch of branches) {
      const isSelectedBranch = user.selectedBranch === branch;
      const branchSkills = userSkills.filter(us => {
        // Check if this user skill's skill belongs to this branch
        const classSkill = classSkills.find(cs => 
          cs.skillId === us.skillId && cs.branch === branch
        );
        return classSkill;
      });
      const totalBranchSkills = classSkills.filter(cs => cs.branch === branch).length;
      
      branchButtons.push(
        new ButtonBuilder()
          .setCustomId(`view_branch_${branch}`)
          .setLabel(`🌳 ${branch}`)
          .setStyle(isSelectedBranch ? ButtonStyle.Success : ButtonStyle.Secondary)
      );
    }

    // Add change class button
    const changeClassButton = new ButtonBuilder()
      .setCustomId('change_class')
      .setLabel('🔄 Change Class')
      .setStyle(ButtonStyle.Primary);

    // Create button rows - ensure proper alignment
    const allButtons = [...branchButtons, changeClassButton];
    
    // Discord allows max 5 buttons per row, so we should be fine with 4 buttons
    const buttonRow = new ActionRowBuilder().addComponents(allButtons);

    // Add navigation row
    const navRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.CHARACTER_BACK)
        .setLabel('🔙 Back to Character')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      embeds: [embed],
      components: [buttonRow, navRow]
    });

  } catch (error) {
    console.error('Error in class menu handler:', error);
    await interaction.editReply('❌ An error occurred while loading the class menu.');
  }
}

// Tutorial system handlers
async function handleTutorialStart(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    // Validate that this user owns the tutorial
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id }
    });
    
    if (!user || user.tutorialCompleted) {
      return interaction.editReply('❌ This tutorial is not available for you.');
    }
    
    const TutorialSystem = require('./tutorial-system');
    const { embed, components } = await TutorialSystem.showTutorialStep1(interaction);
    
    await interaction.editReply({ embeds: [embed], components: components });
  } catch (error) {
    console.error('Error starting tutorial:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while starting the tutorial.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleTutorialSkip(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const discordId = interaction.user.id;
    const TutorialSystem = require('./tutorial-system');
    
    // Get user by Discord ID
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found. Please try again.');
    }
    
    const result = await TutorialSystem.skipTutorial(user.id);
    
    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#FF9800')
        .setTitle('⏭️ Tutorial Skipped')
        .setDescription('You\'ve skipped the tutorial. You can always access class selection through `/profile` or the character menu.')
        .addFields({
          name: '🎯 Next Steps',
          value: '• Use `/explore` to start your adventure\n• Use `/profile` to choose your class\n• Use `/skills` to manage your abilities',
          inline: false
        });

      await interaction.editReply({ embeds: [embed], components: [] });
    } else {
      await interaction.editReply(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('Error skipping tutorial:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while skipping the tutorial.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleTutorialStep2(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const TutorialSystem = require('./tutorial-system');
    const { embed, components } = await TutorialSystem.showTutorialStep2(interaction);
    
    await interaction.editReply({ embeds: [embed], components: components });
  } catch (error) {
    console.error('Error showing tutorial step 2:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading tutorial step 2.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleTutorialClassSelection(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    // Validate that this user owns the tutorial
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id }
    });
    
    if (!user || user.tutorialCompleted) {
      return interaction.editReply('❌ This tutorial is not available for you.');
    }
    
    const className = interaction.customId.replace('tutorial_class_', '');
    
    // Save the class selection to the database
    await prisma.user.update({
      where: { discordId: interaction.user.id },
      data: {
        playerClass: className,
        selectedBranch: null // Clear any previous branch selection
      }
    });
    
    const TutorialSystem = require('./tutorial-system');
    
    const { embed, components } = await TutorialSystem.showTutorialStep3(interaction, className);
    
    await interaction.editReply({ embeds: [embed], components: components });
  } catch (error) {
    console.error('Error handling tutorial class selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while selecting your class.',
      ephemeral: true
    });
  }
}

async function handleTutorialBranchSelection(interaction) {
  try {
    // Validate that this user owns the tutorial
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id }
    });
    
    if (!user || user.tutorialCompleted) {
      return interaction.editReply('❌ This tutorial is not available for you.');
    }
    
    const parts = interaction.customId.replace('tutorial_branch_', '').split('_');
    const className = parts[0];
    const branchName = parts.slice(1).join('_'); // Handle branch names with spaces
    
    // Save the class and branch selection to the database
    await prisma.user.update({
      where: { discordId: interaction.user.id },
      data: {
        playerClass: className,
        selectedBranch: branchName
      }
    });
    
    const TutorialSystem = require('./tutorial-system');
    
    const { embed, components } = await TutorialSystem.showTutorialStep4(interaction, className, branchName);
    
    await interaction.editReply({ embeds: [embed], components: components });
  } catch (error) {
    console.error('Error handling tutorial branch selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while selecting your branch.',
      ephemeral: true
    });
  }
}

async function handleTutorialComplete(interaction) {
  try {
    const discordId = interaction.user.id;
    const TutorialSystem = require('./tutorial-system');
    
    // Get the user's current class and branch from the database
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user || !user.playerClass || !user.selectedBranch) {
      return interaction.editReply('❌ Tutorial completion data not found. Please restart the tutorial.');
    }
    
    const result = await TutorialSystem.completeTutorial(user.id, user.playerClass, user.selectedBranch);
    
    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎉 Welcome to Relic Raider!')
        .setDescription(`**${interaction.user.username}**, your adventure begins now!`)
        .addFields({
          name: '🎭 Your Character',
          value: `**Class:** ${user.playerClass}\n**Specialization:** ${user.selectedBranch}\n**Level:** ${user.level}\n**Skill Points:** ${user.skillPoints || 0}`,
          inline: true
        },
        {
          name: '🚀 Ready to Explore',
          value: 'Use `/explore` to start your adventure and discover treasures!',
          inline: true
        });

      await interaction.editReply({ embeds: [embed], components: [] });
    } else {
      await interaction.editReply(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('Error completing tutorial:', error);
    await interaction.reply({
      content: '❌ An error occurred while completing the tutorial.',
      ephemeral: true
    });
  }
}

async function handleTutorialRestart(interaction) {
  try {
    const discordId = interaction.user.id;
    
    // Reset user's tutorial progress
    await prisma.user.update({
      where: { discordId: discordId },
      data: {
        playerClass: null,
        selectedBranch: null,
        tutorialCompleted: false,
        skillPoints: 0,
        totalSkillPoints: 0
      }
    });

    // Start tutorial from beginning
    const TutorialSystem = require('./tutorial-system');
    const { embed, components } = await TutorialSystem.startTutorial(interaction, { username: interaction.user.username });
    
    await interaction.editReply({ embeds: [embed], components: components });
  } catch (error) {
    console.error('Error restarting tutorial:', error);
    await interaction.reply({
      content: '❌ An error occurred while restarting the tutorial.',
      ephemeral: true
    });
  }
}

async function handleTutorialBackToClasses(interaction) {
  try {
    // Validate that this user owns the tutorial
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id }
    });
    
    if (!user || user.tutorialCompleted) {
      return interaction.editReply('❌ This tutorial is not available for you.');
    }
    
    // Clear any selected class to allow re-selection
    await prisma.user.update({
      where: { discordId: interaction.user.id },
      data: {
        playerClass: null,
        selectedBranch: null
      }
    });

    // Go back to class selection
    const TutorialSystem = require('./tutorial-system');
    const { embed, components } = await TutorialSystem.showTutorialStep2(interaction);
    
    await interaction.editReply({ embeds: [embed], components: components });
  } catch (error) {
    console.error('Error going back to class selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while going back to class selection.',
      ephemeral: true
    });
  }
}

async function handleTutorialExplore(interaction) {
  try {
    // Validate that this user owns the tutorial
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id }
    });
    
    if (!user || !user.tutorialCompleted) {
      return interaction.editReply('❌ You must complete the tutorial first.');
    }
    
    // Call the explore handler directly
    await handleExplore(interaction);
  } catch (error) {
    console.error('Error handling tutorial explore:', error);
    await interaction.reply({
      content: '❌ An error occurred while starting exploration.',
      ephemeral: true
    });
  }
}

async function handleTutorialHub(interaction) {
  try {
    // Validate that this user owns the tutorial
    const user = await prisma.user.findUnique({
      where: { discordId: interaction.user.id }
    });
    
    if (!user || !user.tutorialCompleted) {
      return interaction.editReply('❌ You must complete the tutorial first.');
    }
    
    // Call the menu handler to show the main hub
    await handleMenu(interaction);
  } catch (error) {
    console.error('Error handling tutorial hub:', error);
    await interaction.reply({
      content: '❌ An error occurred while opening the hub.',
      ephemeral: true
    });
  }
}

async function handleViewBranch(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    if (!user.playerClass) {
      return interaction.editReply('❌ You need to choose a class first!');
    }

    const branchName = interaction.customId.replace('view_branch_', '');
    
    // Get class information
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: user.playerClass }
    });

    if (!playerClass) {
      return interaction.editReply('❌ Class information not found.');
    }

    // Get branch skills
    const classSkills = await prisma.classSkill.findMany({
      where: { 
        classId: playerClass.id,
        branch: branchName
      },
      include: { skill: true },
      orderBy: { unlockLevel: 'asc' }
    });

    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });

    // Check if this is the user's selected branch from tutorial
    const isSelectedBranch = user.selectedBranch === branchName;
    const pointsInBranch = userSkills.filter(us => {
      const classSkill = us.skill.classSkills?.find(cs => cs.branch === branchName);
      return classSkill;
    }).length;

    // Check if user can access this branch (10 points in selected branch or level 25+)
    const canAccessBranch = isSelectedBranch || user.level >= 25 || pointsInBranch >= 10;

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle(`🌳 ${branchName} - ${user.playerClass}`)
      .setDescription(`${branchName} specialization for ${user.playerClass}`);

    // Add branch status with better highlighting
    if (isSelectedBranch) {
      embed.addFields({
        name: '🎯 Branch Status',
        value: '🌟 **YOUR SELECTED BRANCH** - This is your primary specialization! 🌟',
        inline: false
      });
      embed.setColor('#FFD700'); // Gold color for selected branch
    } else if (canAccessBranch) {
      embed.addFields({
        name: '🎯 Branch Status',
        value: '✅ **Available** - You can learn skills here!',
        inline: false
      });
    } else {
      embed.addFields({
        name: '🎯 Branch Status',
        value: '🔒 **Locked** - Requires 10 points in your selected branch or level 25+',
        inline: false
      });
    }

    // Add skill points info
    embed.addFields({
      name: '🎯 Skill Points',
      value: `${user.skillPoints || 0} available (${user.totalSkillPoints || 0} total)\nPoints in this branch: ${pointsInBranch}`,
      inline: true
    });

    // Group skills by type
    const passiveSkills = classSkills.filter(cs => cs.skill.type === 'PASSIVE');
    const activeSkills = classSkills.filter(cs => cs.skill.type === 'ACTIVE');
    const ultimateSkills = classSkills.filter(cs => cs.skill.type === 'ULTIMATE');

    // Add skills summary
    const skillsSummary = [];
    if (passiveSkills.length > 0) {
      const learnedPassives = passiveSkills.filter(cs => {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        return !!userSkill;
      }).length;
      skillsSummary.push(`🛡️ **Passive Skills**: ${learnedPassives}/${passiveSkills.length} learned`);
    }
    
    if (activeSkills.length > 0) {
      const learnedActives = activeSkills.filter(cs => {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        return !!userSkill;
      }).length;
      skillsSummary.push(`⚔️ **Active Skills**: ${learnedActives}/${activeSkills.length} learned`);
    }
    
    if (ultimateSkills.length > 0) {
      const learnedUltimates = ultimateSkills.filter(cs => {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        return !!userSkill;
      }).length;
      skillsSummary.push(`🌟 **Ultimate Skills**: ${learnedUltimates}/${ultimateSkills.length} learned`);
    }

    embed.addFields({
      name: '⚔️ Skills Overview',
      value: skillsSummary.join('\n') || 'No skills available in this branch.',
      inline: false
    });

    // Create category buttons
    const buttons = [];
    
    if (canAccessBranch) {
      // Passive Skills button
      if (passiveSkills.length > 0) {
        const learnedPassives = passiveSkills.filter(cs => {
          const userSkill = userSkills.find(us => us.skillId === cs.skillId);
          return !!userSkill;
        }).length;
        
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`view_skills_${branchName}_PASSIVE`)
            .setLabel(`🛡️ Passive Skills (${learnedPassives}/${passiveSkills.length})`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      
      // Active Skills button
      if (activeSkills.length > 0) {
        const learnedActives = activeSkills.filter(cs => {
          const userSkill = userSkills.find(us => us.skillId === cs.skillId);
          return !!userSkill;
        }).length;
        
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`view_skills_${branchName}_ACTIVE`)
            .setLabel(`⚔️ Active Skills (${learnedActives}/${activeSkills.length})`)
            .setStyle(ButtonStyle.Success)
        );
      }
      
      // Ultimate Skills button
      if (ultimateSkills.length > 0) {
        const learnedUltimates = ultimateSkills.filter(cs => {
          const userSkill = userSkills.find(us => us.skillId === cs.skillId);
          return !!userSkill;
        }).length;
        
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`view_skills_${branchName}_ULTIMATE`)
            .setLabel(`🌟 Ultimate Skills (${learnedUltimates}/${ultimateSkills.length})`)
            .setStyle(ButtonStyle.Danger)
        );
      }
    }

    // Add navigation button
    buttons.push(
      new ButtonBuilder()
        .setCustomId('class_menu')
        .setLabel('🔙 Back to Class')
        .setStyle(ButtonStyle.Secondary)
    );

    // Create button rows (max 3 buttons per row)
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 3) {
      const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
      buttonRows.push(row);
    }

    await interaction.editReply({
      embeds: [embed],
      components: buttonRows
    });

  } catch (error) {
    console.error('Error viewing branch:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while viewing the branch.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleLearnSkill(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    if (!user.playerClass) {
      return interaction.editReply('❌ You need to choose a class first!');
    }

    const skillId = interaction.customId.replace('learn_skill_', '');
    
    // Get the skill
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        classSkills: {
          include: {
            playerClass: true
          }
        }
      }
    });

    if (!skill) {
      return interaction.editReply('❌ Skill not found.');
    }

    // Check if user already knows this skill
    const existingSkill = await prisma.userSkill.findFirst({
      where: {
        userId: user.id,
        skillId: skillId
      }
    });

    // Check if user meets the level requirement
    const classSkill = skill.classSkills.find(cs => cs.playerClass.name === user.playerClass);
    if (!classSkill) {
      return interaction.editReply('❌ This skill is not available for your class.');
    }

    if (user.level < classSkill.unlockLevel) {
      return interaction.editReply(`❌ You need to be level ${classSkill.unlockLevel} to learn this skill.`);
    }

    // Check branch access restrictions
    const isSelectedBranch = user.selectedBranch === classSkill.branch;
    const pointsInBranch = await prisma.userSkill.count({
      where: {
        userId: user.id,
        skill: {
          classSkills: {
            some: {
              branch: classSkill.branch,
              playerClass: {
                name: user.playerClass
              }
            }
          }
        }
      }
    });

    const canAccessBranch = isSelectedBranch || user.level >= 25 || pointsInBranch >= 10;
    
    if (!canAccessBranch) {
      return interaction.editReply('❌ You need 10 points in your selected branch or level 25+ to access other branches.');
    }

    const maxLevel = skill.type === 'ACTIVE' ? 3 : 2;
    const availablePoints = user.skillPoints || 0;
    
    if (existingSkill) {
      // Upgrade existing skill
      const currentLevel = existingSkill.level;
      const pointsNeeded = currentLevel + 1;
      
      if (currentLevel >= maxLevel) {
        return interaction.editReply('❌ This skill is already at maximum level!');
      }
      
      if (availablePoints < pointsNeeded) {
        return interaction.editReply(`❌ You need ${pointsNeeded} skill points to upgrade this skill to level ${currentLevel + 1}.`);
      }
      
      // Upgrade the skill
      await prisma.userSkill.update({
        where: { id: existingSkill.id },
        data: { level: { increment: 1 } }
      });
      
      // Deduct skill points
      await prisma.user.update({
        where: { id: user.id },
        data: { skillPoints: { decrement: pointsNeeded } }
      });
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Skill Upgraded!')
        .setDescription(`**${skill.name}** has been upgraded to level ${currentLevel + 1}/${maxLevel}!`)
        .addFields({
          name: '📊 Skill Details',
          value: `**Current Effect**: ${skill.baseEffect + (skill.effectPerLevel * (currentLevel + 1))}\n**Next Level**: ${currentLevel + 2 <= maxLevel ? skill.baseEffect + (skill.effectPerLevel * (currentLevel + 2)) : 'Max Level'}`,
          inline: true
        })
        .addFields({
          name: '🎯 Points Spent',
          value: `${pointsNeeded} skill points\nRemaining: ${availablePoints - pointsNeeded}`,
          inline: true
        });
      
      await interaction.editReply({ embeds: [embed] });
      
      // Note: Button labels will update when you navigate back to the skill menu
      
    } else {
      // Learn new skill
      if (availablePoints < 1) {
        return interaction.editReply('❌ You need at least 1 skill point to learn a skill!');
      }
      
      // Learn the skill
      await prisma.userSkill.create({
        data: {
          userId: user.id,
          skillId: skillId,
          level: 1
        }
      });

      // Deduct skill points
      await prisma.user.update({
        where: { id: user.id },
        data: { skillPoints: { decrement: 1 } }
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Skill Learned!')
        .setDescription(`**${skill.name}** has been learned!`)
        .addFields({
          name: '📊 Skill Details',
          value: `**Current Effect**: ${skill.baseEffect + skill.effectPerLevel}\n**Next Level**: ${skill.baseEffect + (skill.effectPerLevel * 2)}`,
          inline: true
        })
        .addFields({
          name: '🎯 Points Spent',
          value: `1 skill point\nRemaining: ${availablePoints - 1}`,
          inline: true
        });

      await interaction.editReply({ embeds: [embed] });
      
      // Note: Button labels will update when you navigate back to the skill menu
    }

    // Check if user reached level 25 and can access other branches
    if (user.level >= 25 && !user.level25NotificationSent) {
      setTimeout(async () => {
        try {
          await interaction.followUp({
            content: '🎉 **Congratulations!** You\'ve reached level 25 and can now learn skills from other branches!',
            ephemeral: true
          });
        } catch (error) {
          console.error('Error sending level 25 notification:', error);
        }
      }, 2000);
    }

  } catch (error) {
    console.error('Error learning skill:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while learning the skill.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleConfirmClassChange(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    const classChangeCost = 100000;
    
    // Double-check requirements
    if (user.coins < classChangeCost || user.level < 50) {
      return interaction.editReply('❌ You no longer meet the requirements for class change.');
    }

    // Deduct coins and reset skills
    await prisma.user.update({
      where: { id: user.id },
      data: {
        coins: { decrement: classChangeCost },
        playerClass: null,
        selectedBranch: null,
        skillPoints: 0,
        totalSkillPoints: 0
      }
    });

    // Delete all user skills
    await prisma.userSkill.deleteMany({
      where: { userId: user.id }
    });

    // Delete all equipped skills
    await prisma.equippedSkill.deleteMany({
      where: { userId: user.id }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🔄 Class Changed Successfully!')
      .setDescription('Your class has been reset. You can now choose a new class.')
      .addFields(
        {
          name: '💰 Cost Paid',
          value: `${classChangeCost.toLocaleString()} coins`,
          inline: true
        },
        {
          name: '📊 Remaining Coins',
          value: `${(user.coins - classChangeCost).toLocaleString()} coins`,
          inline: true
        },
        {
          name: '🎯 Next Steps',
          value: 'Use `/profile` to choose your new class and specialization.',
          inline: false
        }
      );

    await interaction.editReply({
      embeds: [embed],
      components: []
    });

  } catch (error) {
    console.error('Error confirming class change:', error);
    await interaction.editReply('❌ An error occurred while changing your class.');
  }
}

async function handleCancelClassChange(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    // Return to class menu
    await handleClassMenu(interaction);

  } catch (error) {
    console.error('Error canceling class change:', error);
    await interaction.editReply('❌ An error occurred while canceling the class change.');
  }
}

async function handleUpgradeSkill(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    if (!user.playerClass) {
      return interaction.editReply('❌ You need to choose a class first!');
    }

    const skillId = interaction.customId.replace('upgrade_skill_', '');
    
    // Get the skill
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      include: {
        classSkills: {
          include: {
            playerClass: true
          }
        }
      }
    });

    if (!skill) {
      return interaction.editReply('❌ Skill not found.');
    }

    // Get user's current skill level
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        userId: user.id,
        skillId: skillId
      }
    });

    if (!userSkill) {
      return interaction.editReply('❌ You haven\'t learned this skill yet!');
    }

    // Check max level
    const maxLevel = skill.type === 'ACTIVE' ? 3 : 2;
    if (userSkill.level >= maxLevel) {
      return interaction.editReply('❌ This skill is already at maximum level!');
    }

    // Check if user has enough skill points
    const upgradeCost = userSkill.level + 1; // Level 1->2 costs 2 points, 2->3 costs 3 points
    if ((user.skillPoints || 0) < upgradeCost) {
      return interaction.editReply(`❌ You need ${upgradeCost} skill points to upgrade this skill from level ${userSkill.level} to ${userSkill.level + 1}. You have ${user.skillPoints || 0} points available.`);
    }

    // Check branch access restrictions
    const classSkill = skill.classSkills.find(cs => cs.playerClass.name === user.playerClass);
    if (!classSkill) {
      return interaction.editReply('❌ This skill is not available for your class.');
    }

    const isSelectedBranch = user.selectedBranch === classSkill.branch;
    const pointsInBranch = await prisma.userSkill.count({
      where: {
        userId: user.id,
        skill: {
          classSkills: {
            some: {
              branch: classSkill.branch,
              playerClass: {
                name: user.playerClass
              }
            }
          }
        }
      }
    });

    const canAccessBranch = isSelectedBranch || user.level >= 25 || pointsInBranch >= 10;
    
    if (!canAccessBranch) {
      return interaction.editReply('❌ You need 10 points in your selected branch or level 25+ to access other branches.');
    }

    // Upgrade the skill
    await prisma.userSkill.update({
      where: { id: userSkill.id },
      data: { level: { increment: 1 } }
    });

    // Deduct skill points
    await prisma.user.update({
      where: { id: user.id },
      data: {
        skillPoints: { decrement: upgradeCost }
      }
    });

    // Get updated user data after upgrading the skill
    const updatedUser = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    // Calculate effect values
    const oldEffect = skill.baseEffect + (skill.effectPerLevel * userSkill.level);
    const newEffect = skill.baseEffect + (skill.effectPerLevel * (userSkill.level + 1));
    
    // Show success message
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('⬆️ Skill Upgraded!')
      .setDescription(`You have successfully upgraded **${skill.name}** to level ${userSkill.level + 1}!`)
      .addFields(
        {
          name: '🎯 Skill Details',
          value: `**${skill.name}** - ${skill.description}`,
          inline: false
        },
        {
          name: '📊 Effect Improvement',
          value: `${oldEffect} → ${newEffect}`,
          inline: true
        },
        {
          name: '🌳 Branch',
          value: classSkill.branch,
          inline: true
        },
        {
          name: '📊 New Level',
          value: `${userSkill.level + 1}/${maxLevel}`,
          inline: true
        },
        {
          name: '💰 Cost Paid',
          value: `${upgradeCost} skill points`,
          inline: true
        },
        {
          name: '📊 Remaining Points',
          value: `${updatedUser.skillPoints || 0} available`,
          inline: true
        }
      );

    // Create updated buttons for the branch
    const branchName = classSkill.branch;
    
    // Get class information
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: updatedUser.playerClass }
    });

    // Get branch skills
    const classSkills = await prisma.classSkill.findMany({
      where: { 
        classId: playerClass.id,
        branch: branchName
      },
      include: { skill: true },
      orderBy: { unlockLevel: 'asc' }
    });

    // Get user's updated learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: updatedUser.id },
      include: { skill: true }
    });

    // Check if this is the user's selected branch
    const isSelectedBranchUpgrade = updatedUser.selectedBranch === branchName;
    const pointsInBranchUpgrade = userSkills.filter(us => {
      const classSkill = us.skill.classSkills?.find(cs => cs.branch === branchName);
      return classSkill;
    }).length;

    // Check if user can access this branch
    const canAccessBranchUpgrade = isSelectedBranchUpgrade || updatedUser.level >= 25 || pointsInBranchUpgrade >= 10;

    // Create updated buttons
    const buttons = [];
    
    if (canAccessBranchUpgrade) {
      // Add learn buttons for available skills
      const availableSkills = classSkills.filter(cs => {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        const isLearned = !!userSkill;
        const canLearn = updatedUser.level >= cs.unlockLevel && !isLearned;
        return canLearn;
      });

      // Add upgrade buttons for learned skills
      const upgradeableSkills = classSkills.filter(cs => {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        if (!userSkill) return false;
        
        const maxLevel = cs.skill.type === 'ACTIVE' ? 3 : 2;
        const canUpgrade = userSkill.level < maxLevel;
        return canUpgrade;
      });

      // Combine learn and upgrade buttons, prioritizing upgrades
      const allActionableSkills = [...upgradeableSkills, ...availableSkills].slice(0, 3);

      for (const skill of allActionableSkills) {
        const userSkill = userSkills.find(us => us.skillId === skill.skillId);
        const isLearned = !!userSkill;
        const hasPoints = (updatedUser.skillPoints || 0) > 0;
        
        if (isLearned) {
          // Upgrade button
          const currentLevel = userSkill.level;
          const maxLevel = skill.skill.type === 'ACTIVE' ? 3 : 2;
          const upgradeCost = currentLevel + 1; // Level 1->2 costs 2 points, 2->3 costs 3 points
          const canUpgrade = hasPoints && (updatedUser.skillPoints || 0) >= upgradeCost;
          
          // Calculate next level effect
          const currentEffect = skill.skill.baseEffect + (skill.skill.effectPerLevel * currentLevel);
          const nextEffect = skill.skill.baseEffect + (skill.skill.effectPerLevel * (currentLevel + 1));
          
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`upgrade_skill_${skill.skillId}`)
              .setLabel(`${skill.skill.name} (${currentLevel}/${maxLevel}) - ${currentEffect}→${nextEffect}`)
              .setStyle(canUpgrade ? ButtonStyle.Primary : ButtonStyle.Secondary)
              .setDisabled(!canUpgrade)
          );
        } else {
          // Learn button
          const maxLevel = skill.skill.type === 'ACTIVE' ? 3 : 2;
          const canLearn = hasPoints && updatedUser.level >= skill.unlockLevel;
          
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`learn_skill_${skill.skillId}`)
              .setLabel(`${skill.skill.name} (0/${maxLevel})`)
              .setStyle(canLearn ? ButtonStyle.Success : ButtonStyle.Secondary)
              .setDisabled(!canLearn)
          );
        }
      }
    }

    // Add navigation button
    buttons.push(
      new ButtonBuilder()
        .setCustomId('class_menu')
        .setLabel('🔙 Back to Class')
        .setStyle(ButtonStyle.Secondary)
    );

    // Put all buttons in one row
    const buttonRow = new ActionRowBuilder().addComponents(buttons);

    await interaction.editReply({ 
      embeds: [embed],
      components: [buttonRow]
    });

  } catch (error) {
    console.error('Error upgrading skill:', error);
    await interaction.reply({
      content: '❌ An error occurred while upgrading the skill.',
      ephemeral: true
    });
  }
}

async function handleEquipmentCraftingProgress(interaction) {
  try {
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const userClass = user.playerClass || 'Adventurer';
    const progress = await CraftingSystem.getEquipmentCraftingProgress(user.id, userClass);
    
    if (progress.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('📊 Equipment Crafting Progress')
        .setDescription(`No equipment crafting progress found for ${userClass}!\n\n**To start crafting equipment:**\n• Use \`/craft equipment\` to view available recipes\n• Craft your first piece of equipment\n• Track your progress here`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('📊 Equipment Crafting Progress')
      .setDescription(`**${userClass}** Equipment Crafting History`);

    // Group by equipment type
    const progressByType = {};
    for (const item of progress) {
      const equipmentType = item.recipe.resultEquipment.type;
      if (!progressByType[equipmentType]) {
        progressByType[equipmentType] = [];
      }
      progressByType[equipmentType].push(item);
    }

    for (const [type, items] of Object.entries(progressByType)) {
      let typeText = '';
      for (const item of items) {
        const equipment = item.recipe.resultEquipment;
        const lastCrafted = item.lastCrafted ? 
          new Date(item.lastCrafted).toLocaleDateString() : 'Never';
        typeText += `• **${equipment.name}** - Crafted ${item.timesCrafted}x (Last: ${lastCrafted})\n`;
      }
      
      embed.addFields({
        name: `${type === 'ARMOR' ? '🛡️' : '⚔️'} ${type}`,
        value: typeText,
        inline: false
      });
    }

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_equipment')
          .setLabel('Back to Equipment')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.reply({ embeds: [embed], components: [backButton], ephemeral: true });
  } catch (error) {
    console.error('Error handling equipment crafting progress:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading equipment crafting progress.',
      ephemeral: true
    });
  }
}

async function handleEquipmentCraftingRecommendations(interaction) {
  try {
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const CraftingSystem = require('./crafting-system');
    const userClass = user.playerClass || 'Adventurer';
    const recommendations = await CraftingSystem.getRecommendedEquipment(user.id, userClass);
    
    if (recommendations.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('📈 Equipment Recommendations')
        .setDescription(`No equipment recommendations found for ${userClass}!\n\n**Possible reasons:**\n• You already have the best equipment for your level\n• You need to level up to access better gear\n• You haven't crafted any equipment yet`);

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('📈 Equipment Recommendations')
      .setDescription(`**${userClass}** Recommended Next Crafts`);

    for (const rec of recommendations) {
      const equipment = rec.equipment;
      const status = rec.canCraft ? '✅' : '❌';
      const upgradeText = rec.isUpgrade ? ' (Upgrade)' : '';
      
      let requirementsText = '';
      if (!rec.canCraft) {
        const requirements = [];
        if (user.level < rec.recipe.requiredLevel) {
          requirements.push(`Level ${rec.recipe.requiredLevel}`);
        }
        if (user.coins < rec.recipe.craftingCost) {
          requirements.push(`${rec.recipe.craftingCost} coins`);
        }
        if (requirements.length > 0) {
          requirementsText = `\n**Missing:** ${requirements.join(', ')}`;
        }
      }

      embed.addFields({
        name: `${status} ${equipment.name}${upgradeText}`,
        value: `Level: ${equipment.level} | Rarity: ${equipment.rarity}\nHP: +${equipment.hpBonus || 0} | ATK: +${equipment.attackBonus || 0} | DEF: +${equipment.defenseBonus || 0}${requirementsText}`,
        inline: false
      });
    }

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_equipment')
          .setLabel('Back to Equipment')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.reply({ embeds: [embed], components: [backButton], ephemeral: true });
  } catch (error) {
    console.error('Error handling equipment crafting recommendations:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading equipment recommendations.',
      ephemeral: true
    });
  }
}

async function handleCraftStationSelection(interaction, customId) {
  try {
    const stationId = customId.replace('craft_station_', '');
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get station details
    const station = await prisma.craftingStation.findUnique({
      where: { id: stationId }
    });

    if (!station) {
      return interaction.reply({
        content: '❌ Station not found.',
        ephemeral: true
      });
    }

    // Check if this is the Research Table (material combination)
    if (station.name === 'Research Table') {
      await handleResearchTable(interaction, station);
      return;
    }

    // For other stations (Blacksmith's Forge, Shadow Altar), show equipment crafting
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle(`🏭 ${station.name}`)
      .setDescription('Select your class to view available equipment:');

    // Create class selection buttons
    const classButtons = [
      new ButtonBuilder()
        .setCustomId(`craft_class_${stationId}_Paladin`)
        .setLabel('Paladin')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🛡️'),
      new ButtonBuilder()
        .setCustomId(`craft_class_${stationId}_Rogue`)
        .setLabel('Rogue')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🗡️'),
      new ButtonBuilder()
        .setCustomId(`craft_class_${stationId}_Hunter`)
        .setLabel('Hunter')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🏹'),
      new ButtonBuilder()
        .setCustomId(`craft_class_${stationId}_Mage`)
        .setLabel('Mage')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔮')
    ];

    const buttonRow = new ActionRowBuilder().addComponents(classButtons);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_equipment')
          .setLabel('Back to Stations')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ embeds: [embed], components: [buttonRow, backButton] });
  } catch (error) {
    console.error('Error handling craft station selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading station selection.',
      ephemeral: true
    });
  }
}

async function handleCraftClassSelection(interaction, customId) {
  try {
    const parts = customId.replace('craft_class_', '').split('_');
    const stationId = parts[0];
    const playerClass = parts[1];
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle(`🏭 ${playerClass} Equipment`)
      .setDescription('Select equipment type to view available items:');

    // Create type selection buttons
    const typeButtons = [
      new ButtonBuilder()
        .setCustomId(`craft_type_${stationId}_${playerClass}_ARMOR`)
        .setLabel('Armor Sets')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🛡️'),
      new ButtonBuilder()
        .setCustomId(`craft_type_${stationId}_${playerClass}_WEAPON`)
        .setLabel('Weapons')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('⚔️')
    ];

    const buttonRow = new ActionRowBuilder().addComponents(typeButtons);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`craft_station_${stationId}`)
          .setLabel('Back to Classes')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ embeds: [embed], components: [buttonRow, backButton] });
  } catch (error) {
    console.error('Error handling craft class selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading class selection.',
      ephemeral: true
    });
  }
}

async function handleCraftTypeSelection(interaction, customId) {
  try {
    const parts = customId.replace('craft_type_', '').split('_');
    const stationId = parts[0];
    const playerClass = parts[1];
    const equipmentType = parts[2];
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get equipment recipes for this station, class, and type
    const CraftingSystem = require('./crafting-system');
    const recipes = await CraftingSystem.getEquipmentRecipesForStation(user.id, stationId, playerClass, equipmentType);
    
    if (recipes.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle(`🏭 ${playerClass} ${equipmentType}`)
        .setDescription(`No ${equipmentType.toLowerCase()} recipes available for ${playerClass} at this station!\n\n**To get recipes:**\n• Unlock higher level stations\n• Reach the required level for recipes\n• Complete boss fights for ascended gear`);

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`craft_class_${stationId}_${playerClass}`)
            .setLabel('Back to Types')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [backButton] });
    }

    // Show first page of items (4 per page)
    await showCraftItemsPage(interaction, recipes, stationId, playerClass, equipmentType, 0);
  } catch (error) {
    console.error('Error handling craft type selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading equipment type.',
      ephemeral: true
    });
  }
}

async function handleCraftItemSelection(interaction, customId) {
  try {
    const parts = customId.replace('craft_item_', '').split('_');
    const stationId = parts[0];
    const playerClass = parts[1];
    const equipmentType = parts[2];
    const page = parseInt(parts[3]);
    const recipeId = parts[4];
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get recipe details
    const recipe = await prisma.craftingRecipe.findUnique({
      where: { id: recipeId },
      include: {
        resultEquipment: true,
        recipeIngredients: {
          include: {
            item: true
          }
        }
      }
    });

    if (!recipe) {
      return interaction.reply({
        content: '❌ Recipe not found.',
        ephemeral: true
      });
    }

    // Check if user can craft this recipe
    const CraftingSystem = require('./crafting-system');
    const canCraft = await CraftingSystem.canCraftRecipe(user.id, recipeId);

    const embed = new EmbedBuilder()
      .setColor(canCraft ? '#00FF00' : '#FF0000')
      .setTitle(`🔨 ${recipe.resultEquipment.name}`)
      .setDescription(recipe.description)
      .addFields({
        name: '📊 Stats',
        value: `HP: +${recipe.resultEquipment.hpBonus || 0}\nAttack: +${recipe.resultEquipment.attackBonus || 0}\nDefense: +${recipe.resultEquipment.defenseBonus || 0}`,
        inline: true
      })
      .addFields({
        name: '📋 Requirements',
        value: `Level: ${recipe.requiredLevel}\nCost: ${recipe.craftingCost} coins\nRarity: ${recipe.resultEquipment.rarity}`,
        inline: true
      });

    // Add ingredients
    let ingredientsText = '';
    for (const ingredient of recipe.recipeIngredients) {
      const userItem = await prisma.inventoryItem.findUnique({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: ingredient.itemId
          }
        }
      });

      const userQuantity = userItem ? userItem.quantity : 0;
      const status = userQuantity >= ingredient.quantity ? '✅' : '❌';
      ingredientsText += `${status} **${ingredient.item.name}** (${userQuantity}/${ingredient.quantity})\n`;
    }

    embed.addFields({
      name: '📦 Required Ingredients',
      value: ingredientsText || 'No ingredients required',
      inline: false
    });

    if (canCraft) {
      embed.addFields({
        name: '✅ Status',
        value: 'You can craft this item!',
        inline: false
      });
    } else {
      embed.addFields({
        name: '❌ Status',
        value: 'You cannot craft this item. Check your level, coins, and ingredients.',
        inline: false
      });
    }

    // Create buttons
    const buttons = [];
    if (canCraft) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`craft_create_${recipeId}_${stationId}_${playerClass}_${equipmentType}_${page}`)
          .setLabel('Craft Item')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🔨')
      );
    }

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`craft_type_${stationId}_${playerClass}_${equipmentType}`)
          .setLabel('Back to Items')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    const allButtons = buttons.length > 0 ? [new ActionRowBuilder().addComponents(buttons), backButton] : [backButton];

    await interaction.update({ embeds: [embed], components: allButtons });
  } catch (error) {
    console.error('Error handling craft item selection:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading item details.',
      ephemeral: true
    });
  }
}

async function showCraftItemsPage(interaction, recipes, stationId, playerClass, equipmentType, page) {
  const itemsPerPage = 4;
  const startIndex = page * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = recipes.slice(startIndex, endIndex);
  const totalPages = Math.ceil(recipes.length / itemsPerPage);

  // Get user's equipment to check what's already crafted
  const userId = interaction.user.id;
  const user = await prisma.user.findUnique({
    where: { discordId: userId }
  });

  const userEquipment = await prisma.userEquipment.findMany({
    where: { userId: user.id },
    include: { equipment: true }
  });

  const equippedGear = await prisma.equippedGear.findMany({
    where: { userId: user.id },
    include: { equipment: true }
  });

  const embed = new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle(`🏭 ${playerClass} ${equipmentType}`)
    .setDescription(`Page ${page + 1} of ${totalPages} • ${recipes.length} items available`);

  // Add item fields
  for (const recipe of pageItems) {
    const equipment = recipe.resultEquipment;
    
    // Check if user already has this equipment
    const userHasEquipment = userEquipment.find(ue => ue.equipmentId === equipment.id);
    const isCrafted = userHasEquipment && userHasEquipment.quantity > 0;
    const isEquipped = equippedGear.some(eg => eg.equipmentId === equipment.id);
    
    let status = '❌';
    if (isCrafted) {
      status = isEquipped ? '⚔️' : '✅';
    } else if (recipe.canCraft) {
      status = '🔨';
    }
    
    const costText = recipe.craftingCost > 0 ? ` (${recipe.craftingCost} coins)` : '';
    
    // Get set information
    let setInfo = '';
    if (equipmentType === 'ARMOR') {
      const setNames = ['Stonewall', 'Undying', 'Ironskin', 'Shadow', 'Mythic'];
      for (const setName of setNames) {
        if (equipment.name.includes(setName)) {
          setInfo = `\n**Set:** ${setName}`;
          break;
        }
      }
    } else if (equipmentType === 'WEAPON') {
      const weaponSeries = {
        'paladin': ['Ironbrand', 'Warprayer', 'Vindicator'],
        'rogue': ['Fangpiercer', 'Shadowfang', 'Silent'],
        'hunter': ['Wolfsight', 'Bonehook', 'Tracker'],
        'mage': ['Cinderstick', 'Frostroot', 'Sparkstone']
      };
      const series = weaponSeries[playerClass.toLowerCase()] || [];
      for (const seriesName of series) {
        if (equipment.name.includes(seriesName)) {
          setInfo = `\n**Series:** ${seriesName}`;
          break;
        }
      }
    }
    
    // Parse special effects for display
    let specialEffectsText = '';
    if (equipment.specialEffect) {
      try {
        const effects = JSON.parse(equipment.specialEffect);
        const effectList = [];
        
        if (effects.crit_chance) effectList.push(`Crit: +${(effects.crit_chance * 100).toFixed(0)}%`);
        if (effects.bleed_chance) effectList.push(`Bleed: +${(effects.bleed_chance * 100).toFixed(0)}%`);
        if (effects.poison_chance) effectList.push(`Poison: +${(effects.poison_chance * 100).toFixed(0)}%`);
        if (effects.stun_chance) effectList.push(`Stun: +${(effects.stun_chance * 100).toFixed(0)}%`);
        if (effects.block_chance) effectList.push(`Block: +${(effects.block_chance * 100).toFixed(0)}%`);
        if (effects.stealth_bonus) effectList.push(`Stealth: +${(effects.stealth_bonus * 100).toFixed(0)}%`);
        if (effects.evasion) effectList.push(`Evasion: +${(effects.evasion * 100).toFixed(0)}%`);
        if (effects.range_bonus) effectList.push(`Range: +${(effects.range_bonus * 100).toFixed(0)}%`);
        if (effects.loot_bonus) effectList.push(`Loot: +${(effects.loot_bonus * 100).toFixed(0)}%`);
        if (effects.fire_damage) effectList.push(`Fire: +${(effects.fire_damage * 100).toFixed(0)}%`);
        if (effects.freeze_chance) effectList.push(`Freeze: +${(effects.freeze_chance * 100).toFixed(0)}%`);
        if (effects.chain_lightning) effectList.push(`Chain: +${(effects.chain_lightning * 100).toFixed(0)}%`);
        if (effects.mana_regen) effectList.push(`Mana: +${(effects.mana_regen * 100).toFixed(0)}%`);
        
        if (effectList.length > 0) {
          specialEffectsText = `\n**Special:** ${effectList.join(', ')}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    embed.addFields({
      name: `${status} ${equipment.name}`,
      value: `Level: ${equipment.level} | Rarity: ${equipment.rarity}\nHP: +${equipment.hpBonus || 0} | ATK: +${equipment.attackBonus || 0} | DEF: +${equipment.defenseBonus || 0}${costText}${specialEffectsText}${setInfo}`,
      inline: false
    });
  }

  // Create navigation buttons
  const buttons = [];
  for (let i = 0; i < pageItems.length; i++) {
    const recipe = pageItems[i];
    const equipment = recipe.resultEquipment;
    const userHasEquipment = userEquipment.find(ue => ue.equipmentId === equipment.id);
    const isCrafted = userHasEquipment && userHasEquipment.quantity > 0;
    
    let buttonStyle = ButtonStyle.Secondary;
    let emoji = '🔒';
    
    if (isCrafted) {
      buttonStyle = ButtonStyle.Secondary;
      emoji = '✅';
    } else if (recipe.canCraft) {
      buttonStyle = ButtonStyle.Success;
      emoji = '🔨';
    }
    
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`craft_item_${stationId}_${playerClass}_${equipmentType}_${page}_${recipe.id}`)
        .setLabel(recipe.resultEquipment.name.length > 20 ? recipe.resultEquipment.name.substring(0, 17) + '...' : recipe.resultEquipment.name)
        .setStyle(buttonStyle)
        .setEmoji(emoji)
        .setDisabled(isCrafted) // Disable button if already crafted
    );
  }

  // Split buttons into rows of 2
  const buttonRows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    buttonRows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 2)));
  }

  // Add navigation buttons
  const navButtons = [];
  if (page > 0) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`craft_page_${stationId}_${playerClass}_${equipmentType}_${page - 1}`)
        .setLabel('◀️ Previous')
        .setStyle(ButtonStyle.Secondary)
    );
  }
  if (page < totalPages - 1) {
    navButtons.push(
      new ButtonBuilder()
        .setCustomId(`craft_page_${stationId}_${playerClass}_${equipmentType}_${page + 1}`)
        .setLabel('Next ▶️')
        .setStyle(ButtonStyle.Secondary)
    );
  }

  if (navButtons.length > 0) {
    buttonRows.push(new ActionRowBuilder().addComponents(navButtons));
  }

  // Add back button
  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`craft_class_${stationId}_${playerClass}`)
        .setLabel('Back to Types')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔙')
    );

  buttonRows.push(backButton);

  await interaction.update({ embeds: [embed], components: buttonRows });
}

async function handleCraftPageNavigation(interaction, customId) {
  try {
    const parts = customId.replace('craft_page_', '').split('_');
    const stationId = parts[0];
    const playerClass = parts[1];
    const equipmentType = parts[2];
    const page = parseInt(parts[3]);
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get equipment recipes for this station, class, and type
    const CraftingSystem = require('./crafting-system');
    const recipes = await CraftingSystem.getEquipmentRecipesForStation(user.id, stationId, playerClass, equipmentType);
    
    if (recipes.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle(`🏭 ${playerClass} ${equipmentType}`)
        .setDescription(`No ${equipmentType.toLowerCase()} recipes available for ${playerClass} at this station!`);

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`craft_class_${stationId}_${playerClass}`)
            .setLabel('Back to Types')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      return interaction.update({ embeds: [embed], components: [backButton] });
    }

    // Show the requested page
    await showCraftItemsPage(interaction, recipes, stationId, playerClass, equipmentType, page);
  } catch (error) {
    console.error('Error handling craft page navigation:', error);
    await interaction.reply({
      content: '❌ An error occurred while navigating pages.',
      ephemeral: true
    });
  }
}

async function handleCraftCreate(interaction, customId) {
  try {
    const parts = customId.replace('craft_create_', '').split('_');
    const recipeId = parts[0];
    const stationId = parts[1];
    const playerClass = parts[2];
    const equipmentType = parts[3];
    const page = parts[4];
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get recipe details
    const recipe = await prisma.craftingRecipe.findUnique({
      where: { id: recipeId },
      include: {
        resultEquipment: true,
        recipeIngredients: {
          include: {
            item: true
          }
        }
      }
    });

    if (!recipe) {
      return interaction.reply({
        content: '❌ Recipe not found.',
        ephemeral: true
      });
    }

    // Check if user can craft this recipe
    const CraftingSystem = require('./crafting-system');
    const canCraft = await CraftingSystem.canCraftRecipe(user.id, recipeId);

    if (!canCraft) {
      return interaction.reply({
        content: '❌ You cannot craft this item. Check your level, coins, and ingredients.',
        ephemeral: true
      });
    }

    // Craft the item
    const result = await CraftingSystem.craftItem(user.id, recipeId);

    if (result.success) {
      // Parse special effects for display
      let specialEffectsText = '';
      if (recipe.resultEquipment.specialEffect) {
        try {
          const effects = JSON.parse(recipe.resultEquipment.specialEffect);
          const effectList = [];
          
          if (effects.crit_chance) effectList.push(`Crit: +${(effects.crit_chance * 100).toFixed(0)}%`);
          if (effects.bleed_chance) effectList.push(`Bleed: +${(effects.bleed_chance * 100).toFixed(0)}%`);
          if (effects.poison_chance) effectList.push(`Poison: +${(effects.poison_chance * 100).toFixed(0)}%`);
          if (effects.stun_chance) effectList.push(`Stun: +${(effects.stun_chance * 100).toFixed(0)}%`);
          if (effects.block_chance) effectList.push(`Block: +${(effects.block_chance * 100).toFixed(0)}%`);
          if (effects.stealth_bonus) effectList.push(`Stealth: +${(effects.stealth_bonus * 100).toFixed(0)}%`);
          if (effects.evasion) effectList.push(`Evasion: +${(effects.evasion * 100).toFixed(0)}%`);
          if (effects.range_bonus) effectList.push(`Range: +${(effects.range_bonus * 100).toFixed(0)}%`);
          if (effects.loot_bonus) effectList.push(`Loot: +${(effects.loot_bonus * 100).toFixed(0)}%`);
          if (effects.fire_damage) effectList.push(`Fire: +${(effects.fire_damage * 100).toFixed(0)}%`);
          if (effects.freeze_chance) effectList.push(`Freeze: +${(effects.freeze_chance * 100).toFixed(0)}%`);
          if (effects.chain_lightning) effectList.push(`Chain: +${(effects.chain_lightning * 100).toFixed(0)}%`);
          if (effects.mana_regen) effectList.push(`Mana: +${(effects.mana_regen * 100).toFixed(0)}%`);
          
          if (effectList.length > 0) {
            specialEffectsText = `\n**Special:** ${effectList.join(', ')}`;
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔨 Crafting Successful!')
        .setDescription(`You have successfully crafted **${recipe.resultEquipment.name}**!`)
        .addFields({
          name: '📊 Equipment Stats',
          value: `HP: +${recipe.resultEquipment.hpBonus || 0}\nAttack: +${recipe.resultEquipment.attackBonus || 0}\nDefense: +${recipe.resultEquipment.defenseBonus || 0}${specialEffectsText}`,
          inline: true
        })
        .addFields({
          name: '💰 Cost',
          value: `${recipe.craftingCost} coins spent`,
          inline: true
        });

      // Create buttons
      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`equip_equipment_${recipe.resultEquipmentId}`)
            .setLabel('Equip Now')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️'),
          new ButtonBuilder()
            .setCustomId(`craft_back_to_items_${stationId}_${playerClass}_${equipmentType}_${page}`)
            .setLabel('Back to Items')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ embeds: [embed], components: [buttons] });
    } else {
      await interaction.reply({
        content: `❌ Crafting failed: ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling craft create:', error);
    await interaction.reply({
      content: '❌ An error occurred while crafting the item.',
      ephemeral: true
    });
  }
}

async function handleEquipEquipment(interaction, customId) {
  try {
    const equipmentId = customId.replace('equip_equipment_', '');
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get equipment details
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId }
    });

    if (!equipment) {
      return interaction.reply({
        content: '❌ Equipment not found.',
        ephemeral: true
      });
    }

    // Check if user has this equipment
    const userEquipment = await prisma.userEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId: user.id,
          equipmentId: equipmentId
        }
      }
    });

    if (!userEquipment || userEquipment.quantity <= 0) {
      return interaction.reply({
        content: '❌ You do not own this equipment.',
        ephemeral: true
      });
    }

    // Unequip current weapon if equipping a weapon
    if (equipment.type === 'WEAPON') {
      await prisma.equippedGear.deleteMany({
        where: {
          userId: user.id,
          slot: 'WEAPON'
        }
      });
    }

    // Equip the new equipment
    await prisma.equippedGear.upsert({
      where: {
        userId_slot: {
          userId: user.id,
          slot: equipment.type === 'WEAPON' ? 'WEAPON' : 'ARMOR'
        }
      },
      update: {
        equipmentId: equipmentId,
        equippedAt: new Date()
      },
      create: {
        userId: user.id,
        equipmentId: equipmentId,
        slot: equipment.type === 'WEAPON' ? 'WEAPON' : 'ARMOR',
        equippedAt: new Date()
      }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('⚔️ Equipment Equipped!')
      .setDescription(`You have equipped **${equipment.name}**!`)
      .addFields({
        name: '📊 Stats',
        value: `HP: +${equipment.hpBonus || 0}\nAttack: +${equipment.attackBonus || 0}\nDefense: +${equipment.defenseBonus || 0}`,
        inline: true
      });

    await interaction.update({ embeds: [embed] });
  } catch (error) {
    console.error('Error equipping equipment:', error);
    await interaction.reply({
      content: '❌ An error occurred while equipping the equipment.',
      ephemeral: true
    });
  }
}

async function handleCraftBackToItems(interaction, customId) {
  try {
    // Extract the original context from the customId
    const context = customId.replace('craft_back_to_items_', '');
    const [stationId, playerClass, equipmentType, page] = context.split('_');
    
    // Get recipes for this context
    const CraftingSystem = require('./crafting-system');
    const recipes = await CraftingSystem.getEquipmentRecipesForStation(
      interaction.user.id, 
      stationId, 
      playerClass, 
      equipmentType
    );

    // Show the items page again
    await showCraftItemsPage(interaction, recipes, stationId, playerClass, equipmentType, parseInt(page) || 0);
  } catch (error) {
    console.error('Error going back to items:', error);
    await interaction.reply({
      content: '❌ An error occurred while returning to items.',
      ephemeral: true
    });
  }
}

async function handleInventoryRelics(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get relic materials (items that don't contain 'beast' in the name)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { 
        userId: user.id,
        item: {
          name: { not: { contains: 'beast' } }
        }
      },
      include: { item: true }
    });

    if (inventoryItems.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle('🏺 Relic Materials')
        .setDescription('You have no relic materials.')
        .addFields({
          name: '💡 Tip',
          value: 'Explore different zones to find relic materials!',
          inline: false
        });

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('inventory')
            .setLabel('Back to Inventory')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ embeds: [embed], components: [backButton] });
      return;
    }

    // Group by rarity
    const rarityOrder = { 'MYTHIC': 5, 'LEGENDARY': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
    const groupedByRarity = {};
    
    inventoryItems.forEach(invItem => {
      const rarity = invItem.item.rarity;
      if (!groupedByRarity[rarity]) {
        groupedByRarity[rarity] = [];
      }
      groupedByRarity[rarity].push(invItem);
    });

    // Sort rarities
    const sortedRarities = Object.keys(groupedByRarity).sort((a, b) => 
      (rarityOrder[b] || 0) - (rarityOrder[a] || 0)
    );

    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle('🏺 Relic Materials')
      .setDescription(`You have **${inventoryItems.length}** different relic materials.`);

    // Add fields for each rarity
    for (const rarity of sortedRarities) {
      const items = groupedByRarity[rarity];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      const itemsList = items.map(invItem => 
        `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity}`
      ).join('\n');

      embed.addFields({
        name: `${getRarityEmoji(rarity)} ${rarity} Relics (${totalQuantity} total)`,
        value: itemsList,
        inline: false
      });
    }

    // Create rarity selection buttons
    const rarityButtons = [];
    for (const rarity of sortedRarities) {
      const items = groupedByRarity[rarity];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalQuantity > 0) {
        rarityButtons.push(
          new ButtonBuilder()
            .setCustomId(`relics_rarity_${rarity}`)
            .setLabel(`${rarity} Relics`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(getRarityEmoji(rarity))
        );
      }
    }

    // Create button rows (max 3 buttons per row)
    const buttonRows = [];
    for (let i = 0; i < rarityButtons.length; i += 3) {
      const row = new ActionRowBuilder().addComponents(rarityButtons.slice(i, i + 3));
      buttonRows.push(row);
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory')
          .setLabel('Back to Inventory')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    buttonRows.push(backButton);

    await interaction.editReply({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling inventory relics:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading relic materials.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleInventoryBeasts(interaction) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get beast materials (items that contain 'beast' in the name)
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { 
        userId: user.id,
        item: {
          name: { contains: 'beast' }
        }
      },
      include: { item: true }
    });

    if (inventoryItems.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle('🦴 Beast Materials')
        .setDescription('You have no beast materials.')
        .addFields({
          name: '💡 Tip',
          value: 'Defeat beasts in battle to get beast materials!',
          inline: false
        });

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('inventory')
            .setLabel('Back to Inventory')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.editReply({ embeds: [embed], components: [backButton] });
      return;
    }

    // Group by rarity
    const rarityOrder = { 'MYTHIC': 5, 'LEGENDARY': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1 };
    const groupedByRarity = {};
    
    inventoryItems.forEach(invItem => {
      const rarity = invItem.item.rarity;
      if (!groupedByRarity[rarity]) {
        groupedByRarity[rarity] = [];
      }
      groupedByRarity[rarity].push(invItem);
    });

    // Sort rarities
    const sortedRarities = Object.keys(groupedByRarity).sort((a, b) => 
      (rarityOrder[b] || 0) - (rarityOrder[a] || 0)
    );

    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle('🦴 Beast Materials')
      .setDescription(`You have **${inventoryItems.length}** different beast materials.`);

    // Add fields for each rarity
    for (const rarity of sortedRarities) {
      const items = groupedByRarity[rarity];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      const itemsList = items.map(invItem => 
        `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity}`
      ).join('\n');

      embed.addFields({
        name: `${getRarityEmoji(rarity)} ${rarity} Beast Materials (${totalQuantity} total)`,
        value: itemsList,
        inline: false
      });
    }

    // Create rarity selection buttons
    const rarityButtons = [];
    for (const rarity of sortedRarities) {
      const items = groupedByRarity[rarity];
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalQuantity > 0) {
        rarityButtons.push(
          new ButtonBuilder()
            .setCustomId(`beasts_rarity_${rarity}`)
            .setLabel(`${rarity} Beasts`)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(getRarityEmoji(rarity))
        );
      }
    }

    // Create button rows (max 3 buttons per row)
    const buttonRows = [];
    for (let i = 0; i < rarityButtons.length; i += 3) {
      const row = new ActionRowBuilder().addComponents(rarityButtons.slice(i, i + 3));
      buttonRows.push(row);
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory')
          .setLabel('Back to Inventory')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    buttonRows.push(backButton);

    await interaction.editReply({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling inventory beasts:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading beast materials.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleInventoryEquipment(interaction) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get user's equipment and equipped gear
    const userEquipment = await prisma.userEquipment.findMany({
      where: { userId: user.id },
      include: { equipment: true }
    });

    const equippedGear = await prisma.equippedGear.findMany({
      where: { userId: user.id },
      include: { equipment: true }
    });

    const ownedEquipment = userEquipment.filter(ue => ue.quantity > 0);

    if (ownedEquipment.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle('⚔️ Equipment')
        .setDescription('You have no equipment.')
        .addFields({
          name: '💡 Tip',
          value: 'Craft equipment at the Blacksmith\'s Forge!',
          inline: false
        });

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('inventory')
            .setLabel('Back to Inventory')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.editReply({ embeds: [embed], components: [backButton] });
      return;
    }

    // Group by type (weapon/armor)
    const weapons = ownedEquipment.filter(ue => ue.equipment.type === 'WEAPON');
    const armor = ownedEquipment.filter(ue => ue.equipment.type === 'ARMOR');

    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle('⚔️ Equipment')
      .setDescription(`You have **${ownedEquipment.length}** pieces of equipment.`);

    // Add weapons section
    if (weapons.length > 0) {
      const weaponsList = weapons.map(ue => {
        const isEquipped = equippedGear.some(eg => eg.equipmentId === ue.equipmentId && eg.slot === 'WEAPON');
        const status = isEquipped ? '⚔️' : '✅';
        return `${status} **${ue.equipment.name}** x${ue.quantity} (${ue.equipment.rarity})`;
      }).join('\n');

      embed.addFields({
        name: '🗡️ Weapons',
        value: weaponsList,
        inline: false
      });
    }

    // Add armor section
    if (armor.length > 0) {
      const armorList = armor.map(ue => {
        const isEquipped = equippedGear.some(eg => eg.equipmentId === ue.equipmentId && eg.slot === 'ARMOR');
        const status = isEquipped ? '⚔️' : '✅';
        return `${status} **${ue.equipment.name}** x${ue.quantity} (${ue.equipment.rarity})`;
      }).join('\n');

      embed.addFields({
        name: '🛡️ Armor',
        value: armorList,
        inline: false
      });
    }

    // Create equipment action buttons
    const equipmentButtons = [];
    for (const ue of ownedEquipment) {
      const isEquipped = equippedGear.some(eg => eg.equipmentId === ue.equipmentId);
      if (!isEquipped) {
        equipmentButtons.push(
          new ButtonBuilder()
            .setCustomId(`equip_equipment_${ue.equipmentId}`)
            .setLabel(`Equip ${ue.equipment.name}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️')
        );
      }
    }

    // Create button rows (max 3 buttons per row for equipment)
    const buttonRows = [];
    for (let i = 0; i < equipmentButtons.length; i += 3) {
      const row = new ActionRowBuilder().addComponents(equipmentButtons.slice(i, i + 3));
      buttonRows.push(row);
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory')
          .setLabel('Back to Inventory')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    buttonRows.push(backButton);

    await interaction.editReply({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling inventory equipment:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading equipment.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleRelicsRarity(interaction, customId) {
  try {
    await safeDeferUpdate(interaction);
    
    const rarity = customId.replace('relics_rarity_', '');
    
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get relic materials of the specified rarity
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { 
        userId: user.id,
        item: {
          AND: [
            { rarity: rarity },
            { name: { not: { contains: 'beast' } } }
          ]
        }
      },
      include: { item: true }
    });

    if (inventoryItems.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle(`🏺 ${rarity} Relic Materials`)
        .setDescription(`You have no ${rarity} relic materials.`)
        .addFields({
          name: '💡 Tip',
          value: 'Explore different zones to find relic materials!',
          inline: false
        });

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('inventory_relics')
            .setLabel('Back to Relics')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ embeds: [embed], components: [backButton] });
      return;
    }

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate values
    const { calculateDynamicValue } = require('./loot-system');
    // For relics, use the first item's name as a sample (all should be relic materials)
    const sampleItemName = inventoryItems[0]?.item.name || '';
    const dynamicValue = calculateDynamicValue(rarity, 'Jungle Ruins', sampleItemName);
    
    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle(`🏺 ${rarity} Relic Materials`)
      .setDescription(`You have **${totalQuantity}** ${rarity} relic materials.`);

    // Add items list with individual values
    const itemsList = inventoryItems.map(invItem => {
      const itemValue = dynamicValue.value * invItem.quantity;
      return `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity} (${itemValue} coins)`;
    }).join('\n');

    const totalValue = totalQuantity * dynamicValue.value;

    embed.addFields({
      name: `${getRarityEmoji(rarity)} ${rarity} Items`,
      value: itemsList,
      inline: false
    });

    embed.addFields({
      name: '💰 Total Value',
      value: `**${totalValue} coins** (${totalQuantity} items × ${dynamicValue.value} coins each)`,
      inline: false
    });

    // Create sell buttons (1, 5, 10, 50, all)
    const sellButtons = [];
    
    // Sell 1x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_relics_${rarity}_1`)
        .setLabel('Sell 1x')
        .setStyle(totalQuantity >= 1 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 1)
    );
    
    // Sell 5x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_relics_${rarity}_5`)
        .setLabel('Sell 5x')
        .setStyle(totalQuantity >= 5 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 5)
    );
    
    // Sell 10x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_relics_${rarity}_10`)
        .setLabel('Sell 10x')
        .setStyle(totalQuantity >= 10 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 10)
    );
    
    // Sell 50x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_relics_${rarity}_50`)
        .setLabel('Sell 50x')
        .setStyle(totalQuantity >= 50 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 50)
    );
    
    // Sell All button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_relics_${rarity}_all`)
        .setLabel('Sell All')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('💰')
    );

    // Create button rows (5 buttons per row)
    const buttonRows = [];
    const sellRow = new ActionRowBuilder().addComponents(sellButtons);
    buttonRows.push(sellRow);

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory_relics')
          .setLabel('Back to Relics')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    buttonRows.push(backButton);

    await interaction.editReply({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling relics rarity:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while loading relic materials.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleBeastsRarity(interaction, customId) {
  try {
    const rarity = customId.replace('beasts_rarity_', '');
    
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get beast materials of the specified rarity
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { 
        userId: user.id,
        item: {
          AND: [
            { rarity: rarity },
            { name: { contains: 'beast' } }
          ]
        }
      },
      include: { item: true }
    });

    if (inventoryItems.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle(`🦴 ${rarity} Beast Materials`)
        .setDescription(`You have no ${rarity} beast materials.`)
        .addFields({
          name: '💡 Tip',
          value: 'Defeat beasts in battle to get beast materials!',
          inline: false
        });

      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('inventory_beasts')
            .setLabel('Back to Beasts')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      await interaction.update({ embeds: [embed], components: [backButton] });
      return;
    }

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate values
    const { calculateDynamicValue } = require('./loot-system');
    // For beasts, use the first item's name as a sample (all should be beast materials)
    const sampleItemName = inventoryItems[0]?.item.name || '';
    const dynamicValue = calculateDynamicValue(rarity, 'Jungle Ruins', sampleItemName);
    
    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle(`🦴 ${rarity} Beast Materials`)
      .setDescription(`You have **${totalQuantity}** ${rarity} beast materials.`);

    // Add items list with individual values
    const itemsList = inventoryItems.map(invItem => {
      const itemValue = dynamicValue.value * invItem.quantity;
      return `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity} (${itemValue} coins)`;
    }).join('\n');

    const totalValue = totalQuantity * dynamicValue.value;

    embed.addFields({
      name: `${getRarityEmoji(rarity)} ${rarity} Items`,
      value: itemsList,
      inline: false
    });

    embed.addFields({
      name: '💰 Total Value',
      value: `**${totalValue} coins** (${totalQuantity} items × ${dynamicValue.value} coins each)`,
      inline: false
    });

    // Create sell buttons (1, 5, 10, 50, all)
    const sellButtons = [];
    
    // Sell 1x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_beasts_${rarity}_1`)
        .setLabel('Sell 1x')
        .setStyle(totalQuantity >= 1 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 1)
    );
    
    // Sell 5x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_beasts_${rarity}_5`)
        .setLabel('Sell 5x')
        .setStyle(totalQuantity >= 5 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 5)
    );
    
    // Sell 10x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_beasts_${rarity}_10`)
        .setLabel('Sell 10x')
        .setStyle(totalQuantity >= 10 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 10)
    );
    
    // Sell 50x button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_beasts_${rarity}_50`)
        .setLabel('Sell 50x')
        .setStyle(totalQuantity >= 50 ? ButtonStyle.Danger : ButtonStyle.Secondary)
        .setEmoji('💰')
        .setDisabled(totalQuantity < 50)
    );
    
    // Sell All button
    sellButtons.push(
      new ButtonBuilder()
        .setCustomId(`sell_beasts_${rarity}_all`)
        .setLabel('Sell All')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('💰')
    );

    // Create button rows (5 buttons per row)
    const buttonRows = [];
    const sellRow = new ActionRowBuilder().addComponents(sellButtons);
    buttonRows.push(sellRow);

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory_beasts')
          .setLabel('Back to Beasts')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );
    buttonRows.push(backButton);

    await interaction.update({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling beasts rarity:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading beast materials.',
      ephemeral: true
    });
  }
}

async function handleSellRelics(interaction, customId) {
  try {
    const parts = customId.replace('sell_relics_', '').split('_');
    const rarity = parts[0];
    const amount = parts[1];
    
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get relic materials of the specified rarity
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { 
        userId: user.id,
        item: {
          AND: [
            { rarity: rarity },
            { name: { not: { contains: 'beast' } } }
          ]
        }
      },
      include: { item: true }
    });

    if (inventoryItems.length === 0) {
      return interaction.reply({
        content: `❌ You have no ${rarity} relic materials to sell.`,
        ephemeral: true
      });
    }

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    let sellQuantity = 0;
    let sellValue = 0;

    if (amount === 'all') {
      sellQuantity = totalQuantity;
    } else {
      sellQuantity = Math.min(parseInt(amount), totalQuantity);
    }

    if (sellQuantity === 0) {
      return interaction.reply({
        content: `❌ You don't have enough ${rarity} relic materials to sell.`,
        ephemeral: true
      });
    }

    // Calculate sell value
    const { calculateDynamicValue } = require('./loot-system');
    // For relics, use the first item's name as a sample
    const sampleItemName = inventoryItems[0]?.item.name || '';
    const dynamicValue = calculateDynamicValue(rarity, 'Jungle Ruins', sampleItemName);
    sellValue = dynamicValue.value * sellQuantity;

    // Sell the items
    let remainingToSell = sellQuantity;
    for (const invItem of inventoryItems) {
      if (remainingToSell <= 0) break;
      
      const sellFromThisItem = Math.min(remainingToSell, invItem.quantity);
      
      await prisma.inventoryItem.update({
        where: { id: invItem.id },
        data: { quantity: { decrement: sellFromThisItem } }
      });

      // Delete item if quantity becomes 0
      const updatedItem = await prisma.inventoryItem.findUnique({
        where: { id: invItem.id }
      });
      
      if (updatedItem && updatedItem.quantity <= 0) {
        await prisma.inventoryItem.delete({
          where: { id: invItem.id }
        });
      }

      remainingToSell -= sellFromThisItem;
    }

    // Add coins to user
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: sellValue } }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💰 Sale Complete!')
      .setDescription(`Successfully sold **${sellQuantity}x ${rarity}** relic materials for **${sellValue} coins**!`)
      .addFields({
        name: '📊 Summary',
        value: `Sold: ${sellQuantity} items\nValue: ${sellValue} coins\nNew Balance: ${user.coins + sellValue} coins`,
        inline: true
      });

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory_relics')
          .setLabel('Back to Relics')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  } catch (error) {
    console.error('Error selling relics:', error);
    await interaction.reply({
      content: '❌ An error occurred while selling relics.',
      ephemeral: true
    });
  }
}

async function handleSellBeasts(interaction, customId) {
  try {
    const parts = customId.replace('sell_beasts_', '').split('_');
    const rarity = parts[0];
    const amount = parts[1];
    
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get beast materials of the specified rarity
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { 
        userId: user.id,
        item: {
          AND: [
            { rarity: rarity },
            { name: { contains: 'beast' } }
          ]
        }
      },
      include: { item: true }
    });

    if (inventoryItems.length === 0) {
      return interaction.reply({
        content: `❌ You have no ${rarity} beast materials to sell.`,
        ephemeral: true
      });
    }

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
    let sellQuantity = 0;
    let sellValue = 0;

    if (amount === 'all') {
      sellQuantity = totalQuantity;
    } else {
      sellQuantity = Math.min(parseInt(amount), totalQuantity);
    }

    if (sellQuantity === 0) {
      return interaction.reply({
        content: `❌ You don't have enough ${rarity} beast materials to sell.`,
        ephemeral: true
      });
    }

    // Calculate sell value
    const { calculateDynamicValue } = require('./loot-system');
    // For beasts, use the first item's name as a sample
    const sampleItemName = inventoryItems[0]?.item.name || '';
    const dynamicValue = calculateDynamicValue(rarity, 'Jungle Ruins', sampleItemName);
    sellValue = dynamicValue.value * sellQuantity;

    // Sell the items
    let remainingToSell = sellQuantity;
    for (const invItem of inventoryItems) {
      if (remainingToSell <= 0) break;
      
      const sellFromThisItem = Math.min(remainingToSell, invItem.quantity);
      
      await prisma.inventoryItem.update({
        where: { id: invItem.id },
        data: { quantity: { decrement: sellFromThisItem } }
      });

      // Delete item if quantity becomes 0
      const updatedItem = await prisma.inventoryItem.findUnique({
        where: { id: invItem.id }
      });
      
      if (updatedItem && updatedItem.quantity <= 0) {
        await prisma.inventoryItem.delete({
          where: { id: invItem.id }
        });
      }

      remainingToSell -= sellFromThisItem;
    }

    // Add coins to user
    await prisma.user.update({
      where: { id: user.id },
      data: { coins: { increment: sellValue } }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💰 Sale Complete!')
      .setDescription(`Successfully sold **${sellQuantity}x ${rarity}** beast materials for **${sellValue} coins**!`)
      .addFields({
        name: '📊 Summary',
        value: `Sold: ${sellQuantity} items\nValue: ${sellValue} coins\nNew Balance: ${user.coins + sellValue} coins`,
        inline: true
      });

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('inventory_beasts')
          .setLabel('Back to Beasts')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ embeds: [embed], components: [backButton] });
  } catch (error) {
    console.error('Error selling beasts:', error);
    await interaction.reply({
      content: '❌ An error occurred while selling beast materials.',
      ephemeral: true
    });
  }
}

async function handleResearchRelics(interaction) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get user's inventory to see what materials they have
    const userInventory = await prisma.inventoryItem.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    // Define relic upgrade recipes (any common relics, not specific ones)
    const relicRecipes = [
      {
        name: 'Upgrade Common Relics',
        description: 'Combine 10 Common relics into 1 Uncommon relic',
        inputRarity: 'COMMON',
        inputQuantity: 10,
        outputItem: { name: 'Uncommon Relic', rarity: 'UNCOMMON' },
        cost: 100
      },
      {
        name: 'Upgrade Uncommon Relics',
        description: 'Combine 10 Uncommon relics into 1 Rare relic',
        inputRarity: 'UNCOMMON',
        inputQuantity: 10,
        outputItem: { name: 'Rare Relic', rarity: 'RARE' },
        cost: 500
      },
      {
        name: 'Upgrade Rare Relics',
        description: 'Combine 10 Rare relics into 1 Legendary relic',
        inputRarity: 'RARE',
        inputQuantity: 10,
        outputItem: { name: 'Legendary Relic', rarity: 'LEGENDARY' },
        cost: 1000
      },
      {
        name: 'Upgrade Legendary Relics',
        description: 'Combine 4 Legendary relics into 1 Mythic relic',
        inputRarity: 'LEGENDARY',
        inputQuantity: 4,
        outputItem: { name: 'Mythic Relic', rarity: 'MYTHIC' },
        cost: 2500
      }
    ];

    // Check which recipes the user can make
    const availableRecipes = [];
    
    for (const recipe of relicRecipes) {
      // Count total relics of the required rarity (excluding beast drops)
      const totalRelics = userInventory
        .filter(item => 
          item.item.rarity === recipe.inputRarity && 
          !item.item.name.toLowerCase().includes('beast') &&
          (item.item.category === 'RELIC' || item.item.category === undefined) // Handle undefined categories
        )
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const canMake = totalRelics >= recipe.inputQuantity && user.coins >= recipe.cost;
      const missingItems = [];
      
      if (totalRelics < recipe.inputQuantity) {
        missingItems.push(`${recipe.inputQuantity} Common relics`);
      }
      
      if (user.coins < recipe.cost) {
        missingItems.push(`${recipe.cost} coins`);
      }
      
      availableRecipes.push({
        ...recipe,
        canMake,
        missingItems,
        availableQuantity: totalRelics
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🏺 Relic Materials Upgrade')
      .setDescription('Combine exploration relics to create higher-tier materials:');

    // Add recipe information to embed
    for (let i = 0; i < availableRecipes.length; i++) {
      const recipe = availableRecipes[i];
      const status = recipe.canMake ? '✅' : '❌';
      const missingText = recipe.missingItems.length > 0 ? `\nMissing: ${recipe.missingItems.join(', ')}` : '';
      const availableText = `\nAvailable: ${recipe.availableQuantity}/${recipe.inputQuantity} ${recipe.inputRarity} relics`;
      
      embed.addFields({
        name: `${status} ${recipe.name}`,
        value: `${recipe.description}\nCost: ${recipe.cost} coins${availableText}${missingText}`,
        inline: false
      });
    }

    // Add divider and crafting status
    embed.addFields({
      name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      value: '**Crafting Status**',
      inline: false
    });

    // Add current material counts
    const materialCounts = [];
    for (const recipe of relicRecipes) {
      const totalRelics = userInventory
        .filter(item => 
          item.item.rarity === recipe.inputRarity && 
          !item.item.name.toLowerCase().includes('beast') &&
          (item.item.category === 'RELIC' || item.item.category === undefined)
        )
        .reduce((sum, item) => sum + item.quantity, 0);
      
      materialCounts.push(`${recipe.inputRarity}: ${totalRelics} relics`);
    }

    embed.addFields({
      name: '📦 Current Materials',
      value: materialCounts.join('\n'),
      inline: false
    });

    // Create buttons for available recipes
    const buttons = [];
    for (let i = 0; i < availableRecipes.length; i++) {
      const recipe = availableRecipes[i];
      const button = new ButtonBuilder()
        .setCustomId(`research_combine_relic_${i}`)
        .setLabel(recipe.name)
        .setStyle(recipe.canMake ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji(recipe.canMake ? '🔬' : '🔒')
        .setDisabled(!recipe.canMake);
      
      buttons.push(button);
    }

    // Split buttons into rows of 2
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 2));
      buttonRows.push(row);
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_station_cmdnjagnd0000l6d8f62w2175') // Research Table ID
          .setLabel('Back to Research Table')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    buttonRows.push(backButton);

    await interaction.update({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling research relics:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading relic upgrades.',
      ephemeral: true
    });
  }
}

async function handleResearchBeasts(interaction) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get user's inventory to see what materials they have
    const userInventory = await prisma.inventoryItem.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    // Define beast material upgrade recipes
    const beastRecipes = [
      {
        name: 'Upgrade Common Beast Materials',
        description: 'Combine 10 Common beast materials into 1 Uncommon beast material',
        inputRarity: 'COMMON',
        inputQuantity: 10,
        outputItem: { name: 'Uncommon Beast Material', rarity: 'UNCOMMON' },
        cost: 100
      },
      {
        name: 'Upgrade Uncommon Beast Materials',
        description: 'Combine 10 Uncommon beast materials into 1 Rare beast material',
        inputRarity: 'UNCOMMON',
        inputQuantity: 10,
        outputItem: { name: 'Rare Beast Material', rarity: 'RARE' },
        cost: 500
      },
      {
        name: 'Upgrade Rare Beast Materials',
        description: 'Combine 10 Rare beast materials into 1 Legendary beast material',
        inputRarity: 'RARE',
        inputQuantity: 10,
        outputItem: { name: 'Legendary Beast Material', rarity: 'LEGENDARY' },
        cost: 1000
      },
      {
        name: 'Upgrade Legendary Beast Materials',
        description: 'Combine 4 Legendary beast materials into 1 Mythic beast material',
        inputRarity: 'LEGENDARY',
        inputQuantity: 4,
        outputItem: { name: 'Mythic Beast Material', rarity: 'MYTHIC' },
        cost: 2500
      }
    ];

    // Check which recipes the user can make
    const availableRecipes = [];
    
    for (const recipe of beastRecipes) {
      // Count total beast materials of the required rarity
      const totalBeastMaterials = userInventory
        .filter(item => 
          item.item.rarity === recipe.inputRarity && 
          (item.item.category === 'BEAST' || item.item.name.toLowerCase().includes('beast'))
        )
        .reduce((sum, item) => sum + item.quantity, 0);
      
      const canMake = totalBeastMaterials >= recipe.inputQuantity && user.coins >= recipe.cost;
      const missingItems = [];
      
      if (totalBeastMaterials < recipe.inputQuantity) {
        missingItems.push(`${recipe.inputQuantity} ${recipe.inputRarity} beast materials`);
      }
      
      if (user.coins < recipe.cost) {
        missingItems.push(`${recipe.cost} coins`);
      }
      
      availableRecipes.push({
        ...recipe,
        canMake,
        missingItems,
        availableQuantity: totalBeastMaterials
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🦁 Beast Material Upgrades')
      .setDescription('Combine beast materials to create higher-tier materials:');

    // Add recipe information to embed
    for (let i = 0; i < availableRecipes.length; i++) {
      const recipe = availableRecipes[i];
      const status = recipe.canMake ? '✅' : '❌';
      const missingText = recipe.missingItems.length > 0 ? `\nMissing: ${recipe.missingItems.join(', ')}` : '';
      const availableText = `\nAvailable: ${recipe.availableQuantity}/${recipe.inputQuantity} ${recipe.inputRarity} beast materials`;
      
      embed.addFields({
        name: `${status} ${recipe.name}`,
        value: `${recipe.description}\nCost: ${recipe.cost} coins${availableText}${missingText}`,
        inline: false
      });
    }

    // Add divider and crafting status
    embed.addFields({
      name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      value: '**Crafting Status**',
      inline: false
    });

    // Add current material counts
    const materialCounts = [];
    for (const recipe of beastRecipes) {
      const totalBeastMaterials = userInventory
        .filter(item => 
          item.item.rarity === recipe.inputRarity && 
          (item.item.category === 'BEAST' || item.item.name.toLowerCase().includes('beast'))
        )
        .reduce((sum, item) => sum + item.quantity, 0);
      
      materialCounts.push(`${recipe.inputRarity}: ${totalBeastMaterials} beast materials`);
    }

    embed.addFields({
      name: '📦 Current Materials',
      value: materialCounts.join('\n'),
      inline: false
    });

    // Create buttons for available recipes
    const buttons = [];
    for (let i = 0; i < availableRecipes.length; i++) {
      const recipe = availableRecipes[i];
      const button = new ButtonBuilder()
        .setCustomId(`research_combine_beast_${i}`)
        .setLabel(recipe.name)
        .setStyle(recipe.canMake ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setEmoji(recipe.canMake ? '🔬' : '🔒')
        .setDisabled(!recipe.canMake);
      
      buttons.push(button);
    }

    // Split buttons into rows of 2
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 2) {
      const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 2));
      buttonRows.push(row);
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_station_cmdnjagnd0000l6d8f62w2175') // Research Table ID
          .setLabel('Back to Research Table')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    buttonRows.push(backButton);

    await interaction.update({ embeds: [embed], components: buttonRows });
  } catch (error) {
    console.error('Error handling research beasts:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading beast upgrades.',
      ephemeral: true
    });
  }
}

async function updateResearchEmbed(interaction, type) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Get user's updated inventory
    const userInventory = await prisma.inventoryItem.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    if (type === 'relic') {
      // Define relic upgrade recipes
      const relicRecipes = [
        {
          name: 'Upgrade Common Relics',
          description: 'Combine 10 Common relics into 1 Uncommon relic',
          inputRarity: 'COMMON',
          inputQuantity: 10,
          outputItem: { name: 'Uncommon Relic', rarity: 'UNCOMMON' },
          cost: 100
        },
        {
          name: 'Upgrade Uncommon Relics',
          description: 'Combine 10 Uncommon relics into 1 Rare relic',
          inputRarity: 'UNCOMMON',
          inputQuantity: 10,
          outputItem: { name: 'Rare Relic', rarity: 'RARE' },
          cost: 500
        },
        {
          name: 'Upgrade Rare Relics',
          description: 'Combine 10 Rare relics into 1 Legendary relic',
          inputRarity: 'RARE',
          inputQuantity: 10,
          outputItem: { name: 'Legendary Relic', rarity: 'LEGENDARY' },
          cost: 1000
        },
        {
          name: 'Upgrade Legendary Relics',
          description: 'Combine 4 Legendary relics into 1 Mythic relic',
          inputRarity: 'LEGENDARY',
          inputQuantity: 4,
          outputItem: { name: 'Mythic Relic', rarity: 'MYTHIC' },
          cost: 2500
        }
      ];

      // Check which recipes the user can make
      const availableRecipes = [];
      
      for (const recipe of relicRecipes) {
        const totalRelics = userInventory
          .filter(item => 
            item.item.rarity === recipe.inputRarity && 
            !item.item.name.toLowerCase().includes('beast') &&
            (item.item.category === 'RELIC' || item.item.category === undefined)
          )
          .reduce((sum, item) => sum + item.quantity, 0);
        
        const canMake = totalRelics >= recipe.inputQuantity && user.coins >= recipe.cost;
        const missingItems = [];
        
        if (totalRelics < recipe.inputQuantity) {
          missingItems.push(`${recipe.inputQuantity} Common relics`);
        }
        
        if (user.coins < recipe.cost) {
          missingItems.push(`${recipe.cost} coins`);
        }
        
        availableRecipes.push({
          ...recipe,
          canMake,
          missingItems,
          availableQuantity: totalRelics
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🏺 Relic Materials Upgrade')
        .setDescription('Combine exploration relics to create higher-tier materials:');

      // Add recipe information to embed
      for (let i = 0; i < availableRecipes.length; i++) {
        const recipe = availableRecipes[i];
        const status = recipe.canMake ? '✅' : '❌';
        const missingText = recipe.missingItems.length > 0 ? `\nMissing: ${recipe.missingItems.join(', ')}` : '';
        const availableText = `\nAvailable: ${recipe.availableQuantity}/${recipe.inputQuantity} ${recipe.inputRarity} relics`;
        
        embed.addFields({
          name: `${status} ${recipe.name}`,
          value: `${recipe.description}\nCost: ${recipe.cost} coins${availableText}${missingText}`,
          inline: false
        });
      }

      // Add divider and crafting status
      embed.addFields({
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: '**Crafting Status**',
        inline: false
      });

      // Add current material counts
      const materialCounts = [];
      for (const recipe of relicRecipes) {
        const totalRelics = userInventory
          .filter(item => 
            item.item.rarity === recipe.inputRarity && 
            !item.item.name.toLowerCase().includes('beast') &&
            (item.item.category === 'RELIC' || item.item.category === undefined)
          )
          .reduce((sum, item) => sum + item.quantity, 0);
        
        materialCounts.push(`${recipe.inputRarity}: ${totalRelics} relics`);
      }

      embed.addFields({
        name: '📦 Current Materials',
        value: materialCounts.join('\n'),
        inline: false
      });

      // Create buttons for available recipes
      const buttons = [];
      for (let i = 0; i < availableRecipes.length; i++) {
        const recipe = availableRecipes[i];
        const button = new ButtonBuilder()
          .setCustomId(`research_combine_relic_${i}`)
          .setLabel(recipe.name)
          .setStyle(recipe.canMake ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setEmoji(recipe.canMake ? '🔬' : '🔒')
          .setDisabled(!recipe.canMake);
        
        buttons.push(button);
      }

      // Split buttons into rows of 2
      const buttonRows = [];
      for (let i = 0; i < buttons.length; i += 2) {
        const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 2));
        buttonRows.push(row);
      }

      // Add back button
      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('craft_station_cmdnjagnd0000l6d8f62w2175') // Research Table ID
            .setLabel('Back to Research Table')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      buttonRows.push(backButton);

      await interaction.update({ embeds: [embed], components: buttonRows });
    } else if (type === 'beast') {
      // Similar logic for beast materials
      const beastRecipes = [
        {
          name: 'Upgrade Common Beast Materials',
          description: 'Combine 10 Common beast materials into 1 Uncommon beast material',
          inputRarity: 'COMMON',
          inputQuantity: 10,
          outputItem: { name: 'Uncommon Beast Material', rarity: 'UNCOMMON' },
          cost: 100
        },
        {
          name: 'Upgrade Uncommon Beast Materials',
          description: 'Combine 10 Uncommon beast materials into 1 Rare beast material',
          inputRarity: 'UNCOMMON',
          inputQuantity: 10,
          outputItem: { name: 'Rare Beast Material', rarity: 'RARE' },
          cost: 500
        },
        {
          name: 'Upgrade Rare Beast Materials',
          description: 'Combine 10 Rare beast materials into 1 Legendary beast material',
          inputRarity: 'RARE',
          inputQuantity: 10,
          outputItem: { name: 'Legendary Beast Material', rarity: 'LEGENDARY' },
          cost: 1000
        },
        {
          name: 'Upgrade Legendary Beast Materials',
          description: 'Combine 4 Legendary beast materials into 1 Mythic beast material',
          inputRarity: 'LEGENDARY',
          inputQuantity: 4,
          outputItem: { name: 'Mythic Beast Material', rarity: 'MYTHIC' },
          cost: 2500
        }
      ];

      // Check which recipes the user can make
      const availableRecipes = [];
      
      for (const recipe of beastRecipes) {
        const totalBeastMaterials = userInventory
          .filter(item => 
            item.item.rarity === recipe.inputRarity && 
            (item.item.category === 'BEAST' || item.item.name.toLowerCase().includes('beast'))
          )
          .reduce((sum, item) => sum + item.quantity, 0);
        
        const canMake = totalBeastMaterials >= recipe.inputQuantity && user.coins >= recipe.cost;
        const missingItems = [];
        
        if (totalBeastMaterials < recipe.inputQuantity) {
          missingItems.push(`${recipe.inputQuantity} ${recipe.inputRarity} beast materials`);
        }
        
        if (user.coins < recipe.cost) {
          missingItems.push(`${recipe.cost} coins`);
        }
        
        availableRecipes.push({
          ...recipe,
          canMake,
          missingItems,
          availableQuantity: totalBeastMaterials
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🦁 Beast Material Upgrades')
        .setDescription('Combine beast materials to create higher-tier materials:');

      // Add recipe information to embed
      for (let i = 0; i < availableRecipes.length; i++) {
        const recipe = availableRecipes[i];
        const status = recipe.canMake ? '✅' : '❌';
        const missingText = recipe.missingItems.length > 0 ? `\nMissing: ${recipe.missingItems.join(', ')}` : '';
        const availableText = `\nAvailable: ${recipe.availableQuantity}/${recipe.inputQuantity} ${recipe.inputRarity} beast materials`;
        
        embed.addFields({
          name: `${status} ${recipe.name}`,
          value: `${recipe.description}\nCost: ${recipe.cost} coins${availableText}${missingText}`,
          inline: false
        });
      }

      // Add divider and crafting status
      embed.addFields({
        name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        value: '**Crafting Status**',
        inline: false
      });

      // Add current material counts
      const materialCounts = [];
      for (const recipe of beastRecipes) {
        const totalBeastMaterials = userInventory
          .filter(item => 
            item.item.rarity === recipe.inputRarity && 
            (item.item.category === 'BEAST' || item.item.name.toLowerCase().includes('beast'))
          )
          .reduce((sum, item) => sum + item.quantity, 0);
        
        materialCounts.push(`${recipe.inputRarity}: ${totalBeastMaterials} beast materials`);
      }

      embed.addFields({
        name: '📦 Current Materials',
        value: materialCounts.join('\n'),
        inline: false
      });

      // Create buttons for available recipes
      const buttons = [];
      for (let i = 0; i < availableRecipes.length; i++) {
        const recipe = availableRecipes[i];
        const button = new ButtonBuilder()
          .setCustomId(`research_combine_beast_${i}`)
          .setLabel(recipe.name)
          .setStyle(recipe.canMake ? ButtonStyle.Success : ButtonStyle.Secondary)
          .setEmoji(recipe.canMake ? '🔬' : '🔒')
          .setDisabled(!recipe.canMake);
        
        buttons.push(button);
      }

      // Split buttons into rows of 2
      const buttonRows = [];
      for (let i = 0; i < buttons.length; i += 2) {
        const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 2));
        buttonRows.push(row);
      }

      // Add back button
      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('craft_station_cmdnjagnd0000l6d8f62w2175') // Research Table ID
            .setLabel('Back to Research Table')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔙')
        );

      buttonRows.push(backButton);

      await interaction.update({ embeds: [embed], components: buttonRows });
    }
  } catch (error) {
    console.error('Error updating research embed:', error);
    await interaction.reply({
      content: '❌ An error occurred while updating the research table.',
      ephemeral: true
    });
  }
}

async function handleResearchCombine(interaction, customId) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    // Parse the custom ID to determine type and recipe index
    const parts = customId.replace('research_combine_', '').split('_');
    const type = parts[0]; // 'relic' or 'beast'
    const recipeIndex = parseInt(parts[1]);

    // Define recipes based on type
    let recipes, category, itemType;
    
    if (type === 'relic') {
      recipes = [
        {
          name: 'Upgrade Common Relics',
          description: 'Combine 10 Common relics into 1 Uncommon relic',
          inputRarity: 'COMMON',
          inputQuantity: 10,
          outputItem: { name: 'Uncommon Relic', rarity: 'UNCOMMON' },
          cost: 100
        },
        {
          name: 'Upgrade Uncommon Relics',
          description: 'Combine 10 Uncommon relics into 1 Rare relic',
          inputRarity: 'UNCOMMON',
          inputQuantity: 10,
          outputItem: { name: 'Rare Relic', rarity: 'RARE' },
          cost: 500
        },
        {
          name: 'Upgrade Rare Relics',
          description: 'Combine 10 Rare relics into 1 Legendary relic',
          inputRarity: 'RARE',
          inputQuantity: 10,
          outputItem: { name: 'Legendary Relic', rarity: 'LEGENDARY' },
          cost: 1000
        },
        {
          name: 'Upgrade Legendary Relics',
          description: 'Combine 4 Legendary relics into 1 Mythic relic',
          inputRarity: 'LEGENDARY',
          inputQuantity: 4,
          outputItem: { name: 'Mythic Relic', rarity: 'MYTHIC' },
          cost: 2500
        }
      ];
      category = 'RELIC';
      itemType = 'relic';
    } else if (type === 'beast') {
      recipes = [
        {
          name: 'Upgrade Common Beast Materials',
          description: 'Combine 10 Common beast materials into 1 Uncommon beast material',
          inputRarity: 'COMMON',
          inputQuantity: 10,
          outputItem: { name: 'Uncommon Beast Material', rarity: 'UNCOMMON' },
          cost: 100
        },
        {
          name: 'Upgrade Uncommon Beast Materials',
          description: 'Combine 10 Uncommon beast materials into 1 Rare beast material',
          inputRarity: 'UNCOMMON',
          inputQuantity: 10,
          outputItem: { name: 'Rare Beast Material', rarity: 'RARE' },
          cost: 500
        },
        {
          name: 'Upgrade Rare Beast Materials',
          description: 'Combine 10 Rare beast materials into 1 Legendary beast material',
          inputRarity: 'RARE',
          inputQuantity: 10,
          outputItem: { name: 'Legendary Beast Material', rarity: 'LEGENDARY' },
          cost: 1000
        },
        {
          name: 'Upgrade Legendary Beast Materials',
          description: 'Combine 4 Legendary beast materials into 1 Mythic beast material',
          inputRarity: 'LEGENDARY',
          inputQuantity: 4,
          outputItem: { name: 'Mythic Beast Material', rarity: 'MYTHIC' },
          cost: 2500
        }
      ];
      category = 'BEAST';
      itemType = 'beast material';
    } else {
      return interaction.reply({
        content: '❌ Invalid combination type.',
        ephemeral: true
      });
    }

    const recipe = recipes[recipeIndex];
    if (!recipe) {
      return interaction.reply({
        content: '❌ Recipe not found.',
        ephemeral: true
      });
    }

    // Check if user has enough coins
    if (user.coins < recipe.cost) {
      return interaction.reply({
        content: `❌ You need ${recipe.cost} coins to perform this combination.`,
        ephemeral: true
      });
    }

    // Get user's inventory
    const userInventory = await prisma.inventoryItem.findMany({
      where: { userId: user.id },
      include: { item: true }
    });

    // Count available materials of the required rarity and category
    const availableMaterials = userInventory
      .filter(item => {
        if (category === 'RELIC') {
          return item.item.rarity === recipe.inputRarity && 
                 !item.item.name.toLowerCase().includes('beast') &&
                 (item.item.category === 'RELIC' || item.item.category === undefined);
        } else if (category === 'BEAST') {
          return item.item.rarity === recipe.inputRarity && 
                 (item.item.category === 'BEAST' || item.item.name.toLowerCase().includes('beast'));
        }
        return false;
      })
      .reduce((sum, item) => sum + item.quantity, 0);

    if (availableMaterials < recipe.inputQuantity) {
      return interaction.reply({
        content: `❌ You need ${recipe.inputQuantity} ${recipe.inputRarity} ${itemType}s to perform this combination. You have ${availableMaterials}.`,
        ephemeral: true
      });
    }

    // Perform the combination
    try {
      await prisma.$transaction(async (tx) => {
        // Remove input materials (take from any items of the required rarity/category)
        let remainingToRemove = recipe.inputQuantity;
        
        const itemsToRemove = userInventory.filter(item => {
          if (category === 'RELIC') {
            return item.item.rarity === recipe.inputRarity && 
                   !item.item.name.toLowerCase().includes('beast') &&
                   (item.item.category === 'RELIC' || item.item.category === undefined);
          } else if (category === 'BEAST') {
            return item.item.rarity === recipe.inputRarity && 
                   (item.item.category === 'BEAST' || item.item.name.toLowerCase().includes('beast'));
          }
          return false;
        }).sort((a, b) => a.quantity - b.quantity); // Remove from smallest quantities first
        
        for (const inventoryItem of itemsToRemove) {
          if (remainingToRemove <= 0) break;
          
          const toRemove = Math.min(remainingToRemove, inventoryItem.quantity);
          
          if (inventoryItem.quantity === toRemove) {
            // Delete the item if quantity becomes 0
            await tx.inventoryItem.delete({
              where: { id: inventoryItem.id }
            });
          } else {
            // Reduce quantity
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { quantity: inventoryItem.quantity - toRemove }
            });
          }
          
          remainingToRemove -= toRemove;
        }

        // Deduct coins
        await tx.user.update({
          where: { id: user.id },
          data: { coins: user.coins - recipe.cost }
        });

        // Add output item
        let outputItem = await tx.item.findFirst({
          where: { name: recipe.outputItem.name }
        });

        if (!outputItem) {
          // Create the item if it doesn't exist
          outputItem = await tx.item.create({
            data: {
              name: recipe.outputItem.name,
              description: `A ${recipe.outputItem.rarity.toLowerCase()} tier ${itemType}`,
              rarity: recipe.outputItem.rarity,
              value: recipe.cost * 2 // Value based on cost
            }
          });
        }

        // Add to user's inventory
        const existingItem = await tx.inventoryItem.findFirst({
          where: {
            userId: user.id,
            itemId: outputItem.id
          }
        });

        if (existingItem) {
          await tx.inventoryItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + 1 }
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              userId: user.id,
              itemId: outputItem.id,
              quantity: 1
            }
          });
        }
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔬 Research Successful!')
        .setDescription(`You have successfully combined materials to create **${recipe.outputItem.name}**!`)
        .addFields({
          name: '📦 Materials Used',
          value: `${recipe.inputQuantity} ${recipe.inputRarity} ${itemType}s`,
          inline: true
        })
        .addFields({
          name: '💰 Cost',
          value: `${recipe.cost} coins spent`,
          inline: true
        })
        .addFields({
          name: '🎁 Result',
          value: `1x ${recipe.outputItem.name} (${recipe.outputItem.rarity})`,
          inline: true
        });

      // After successful combination, update the original embed
      await updateResearchEmbed(interaction, type);
    } catch (error) {
      console.error('Error during research combination:', error);
      await interaction.reply({
        content: '❌ An error occurred during the combination process.',
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error handling research combine:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing the combination.',
      ephemeral: true
    });
  }
}

async function handleResearchTable(interaction, station) {
  try {
    const userId = interaction.user.id;
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ User not found.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle(`🔬 ${station.name}`)
      .setDescription('Choose a material upgrade path:');

    // Create two main buttons for the upgrade paths
    const buttonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('research_relics')
          .setLabel('Relic Materials Upgrade')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏺'),
        new ButtonBuilder()
          .setCustomId('research_beasts')
          .setLabel('Beast Material Upgrades')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🦁')
      );

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_equipment')
          .setLabel('Back to Stations')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔙')
      );

    await interaction.update({ embeds: [embed], components: [buttonRow, backButton] });
  } catch (error) {
    console.error('Error handling research table:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading the research table.',
      ephemeral: true
    });
  }
}

async function handleViewSkillsByCategory(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    if (!user.playerClass) {
      return interaction.editReply('❌ You need to choose a class first!');
    }

    // Parse branch and skill type from customId
    const customId = interaction.customId.replace('view_skills_', '');
    const [branchName, skillType] = customId.split('_');
    
    // Get class information
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: user.playerClass }
    });

    if (!playerClass) {
      return interaction.editReply('❌ Class information not found.');
    }

    // Get skills of the specified type in this branch
    const classSkills = await prisma.classSkill.findMany({
      where: { 
        classId: playerClass.id,
        branch: branchName,
        skill: {
          type: skillType
        }
      },
      include: { skill: true },
      orderBy: { unlockLevel: 'asc' }
    });

    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });

    // Check if this is the user's selected branch from tutorial
    const isSelectedBranch = user.selectedBranch === branchName;
    const pointsInBranch = userSkills.filter(us => {
      const classSkill = us.skill.classSkills?.find(cs => cs.branch === branchName);
      return classSkill;
    }).length;

    // Check if user can access this branch (10 points in selected branch or level 25+)
    const canAccessBranch = isSelectedBranch || user.level >= 25 || pointsInBranch >= 10;

    const skillTypeEmoji = skillType === 'PASSIVE' ? '🛡️' : skillType === 'ACTIVE' ? '⚔️' : '🌟';
    const skillTypeColor = skillType === 'PASSIVE' ? '#4CAF50' : skillType === 'ACTIVE' ? '#FF9800' : '#E91E63';

    const embed = new EmbedBuilder()
      .setColor(skillTypeColor)
      .setTitle(`${skillTypeEmoji} ${skillType} Skills - ${branchName}`)
      .setDescription(`${skillType} skills for ${branchName} specialization`);

    // Add skill points info
    embed.addFields({
      name: '🎯 Skill Points',
      value: `${user.skillPoints || 0} available (${user.totalSkillPoints || 0} total)`,
      inline: true
    });

    // Add skills list with detailed information
    const skillsList = classSkills.map(cs => {
      const userSkill = userSkills.find(us => us.skillId === cs.skillId);
      const isLearned = !!userSkill;
      const currentLevel = userSkill ? userSkill.level : 0;
      const maxLevel = cs.skill.type === 'ACTIVE' ? 3 : 2;
      const canLearn = user.level >= cs.unlockLevel && (user.skillPoints || 0) > 0 && !isLearned;
      const canUpgrade = isLearned && currentLevel < maxLevel && (user.skillPoints || 0) >= (currentLevel + 1);
      
      // Calculate current effect
      const currentEffect = isLearned ? 
        cs.skill.baseEffect + (cs.skill.effectPerLevel * (currentLevel - 1)) : 
        cs.skill.baseEffect;
      
      // Calculate next level effect
      const nextLevelEffect = currentLevel < maxLevel ? 
        cs.skill.baseEffect + (cs.skill.effectPerLevel * currentLevel) : 
        currentEffect;
      
      let status = '🔒';
      if (isLearned) {
        status = currentLevel === maxLevel ? '🌟' : '✅';
      } else if (canLearn) {
        status = '🔓';
      }
      
      const levelText = isLearned ? ` (Level ${currentLevel}/${maxLevel})` : ` (Level ${cs.unlockLevel})`;
      
      // Format effect based on skill type
      let currentEffectText = '';
      let nextEffectText = '';
      
      if (skillType === 'PASSIVE') {
        // For passive skills, show percentage effects
        currentEffectText = `Current: ${currentEffect}%`;
        if (currentLevel < maxLevel) {
          nextEffectText = `Next: ${nextLevelEffect}%`;
        }
      } else {
        // For active/ultimate skills, show raw effects
        currentEffectText = `Current: ${currentEffect}`;
        if (currentLevel < maxLevel) {
          nextEffectText = `Next: ${nextLevelEffect}`;
        }
      }
      
      let skillText = `${status} **${cs.skill.name}**${levelText}\n└ ${cs.skill.description}\n└ ${currentEffectText}`;
      
      if (nextEffectText && currentLevel < maxLevel) {
        skillText += ` | ${nextEffectText}`;
      }
      
      return skillText;
    }).join('\n\n');

    embed.addFields({
      name: `${skillTypeEmoji} ${skillType} Skills`,
      value: skillsList || `No ${skillType.toLowerCase()} skills available in this branch.`,
      inline: false
    });

    // Add divider
    embed.addFields({
      name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      value: '',
      inline: false
    });

    // Add upgrade information
    if (skillType === 'PASSIVE') {
      embed.addFields({
        name: '💡 Skill Upgrade Information',
        value: '• **Level 1 → 2**: Requires 2 skill points\n• **Level 2 → 3**: Requires 3 skill points\n• **Skill points earned**: 2 points every 4 levels\n• **Max level**: 2 for passive skills',
        inline: false
      });
    } else if (skillType === 'ACTIVE') {
      embed.addFields({
        name: '💡 Skill Upgrade Information',
        value: '• **Level 1 → 2**: Requires 2 skill points\n• **Level 2 → 3**: Requires 3 skill points\n• **Level 3 → 4**: Requires 4 skill points\n• **Skill points earned**: 2 points every 4 levels\n• **Max level**: 3 for active skills',
        inline: false
      });
    } else {
      embed.addFields({
        name: '💡 Skill Upgrade Information',
        value: '• **Level 1 → 2**: Requires 2 skill points\n• **Level 2 → 3**: Requires 3 skill points\n• **Skill points earned**: 2 points every 4 levels\n• **Max level**: 2 for ultimate skills',
        inline: false
      });
    }

    // Create skill buttons
    const buttons = [];
    
    if (canAccessBranch) {
      for (const cs of classSkills) {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        const isLearned = !!userSkill;
        const currentLevel = userSkill ? userSkill.level : 0;
        const maxLevel = cs.skill.type === 'ACTIVE' ? 3 : 2;
        const canLearn = user.level >= cs.unlockLevel && (user.skillPoints || 0) > 0 && !isLearned;
        const canUpgrade = isLearned && currentLevel < maxLevel && (user.skillPoints || 0) >= (currentLevel + 1);
        
        let buttonStyle = ButtonStyle.Secondary;
        let buttonLabel = `${cs.skill.name} (${currentLevel}/${maxLevel})`;
        
        if (canLearn) {
          buttonStyle = ButtonStyle.Primary;
          buttonLabel = `${cs.skill.name} (0/${maxLevel})`;
        } else if (canUpgrade) {
          buttonStyle = ButtonStyle.Success;
          buttonLabel = `${cs.skill.name} (${currentLevel}/${maxLevel})`;
        } else if (isLearned && currentLevel === maxLevel) {
          buttonStyle = ButtonStyle.Secondary;
          buttonLabel = `${cs.skill.name} (${currentLevel}/${maxLevel})`;
        } else if (isLearned && currentLevel < maxLevel) {
          // Skill is learned but can't be upgraded (not enough points)
          buttonStyle = ButtonStyle.Secondary;
          buttonLabel = `${cs.skill.name} (${currentLevel}/${maxLevel})`;
        }
        
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`learn_skill_${cs.skillId}`)
            .setLabel(buttonLabel)
            .setStyle(buttonStyle)
            .setDisabled(!canLearn && !canUpgrade)
        );
      }

      // Add respec button for this category
      const learnedSkillsInCategory = classSkills.filter(cs => {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        return !!userSkill;
      });

      if (learnedSkillsInCategory.length > 0) {
        // Check cooldown status
        const cooldownField = skillType === 'PASSIVE' ? 'lastPassiveRespecTime' : 
                             skillType === 'ACTIVE' ? 'lastActiveRespecTime' : 'lastUltimateRespecTime';
        
        const lastRespecTime = user[cooldownField];
        const cooldownHours = 24;
        const cooldownMs = cooldownHours * 60 * 60 * 1000;
        
        let respecLabel = `🔄 Respec ${skillType}`;
        let respecStyle = ButtonStyle.Danger;
        let isDisabled = false;
        
        if (lastRespecTime) {
          const timeSinceLastRespec = Date.now() - lastRespecTime.getTime();
          const remainingTime = cooldownMs - timeSinceLastRespec;
          
          if (remainingTime > 0) {
            const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
            const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
            respecLabel = `⏰ Respec ${skillType} (${remainingHours}h ${remainingMinutes}m)`;
            respecStyle = ButtonStyle.Secondary;
            isDisabled = true;
          }
        }
        
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`respec_category_${branchName}_${skillType}`)
            .setLabel(respecLabel)
            .setStyle(respecStyle)
            .setDisabled(isDisabled)
        );
      }
    }

    // Add navigation buttons
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`view_branch_${branchName}`)
        .setLabel('🔙 Back to Branch')
        .setStyle(ButtonStyle.Secondary)
    );

    // Create button rows (max 3 buttons per row)
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 3) {
      const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
      buttonRows.push(row);
    }

    await interaction.editReply({
      embeds: [embed],
      components: buttonRows
    });

  } catch (error) {
    console.error('Error viewing skills by category:', error);
    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: '❌ An error occurred while viewing skills.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error('Error sending error response:', replyError);
    }
  }
}

async function handleRespecCategory(interaction) {
  try {
    await safeDeferUpdate(interaction);
    
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    // Parse branch and skill type from customId
    const customId = interaction.customId.replace('respec_category_', '');
    const [branchName, skillType] = customId.split('_');
    
    // Get class information
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: user.playerClass }
    });

    if (!playerClass) {
      return interaction.editReply('❌ Class information not found.');
    }

    // Get skills of the specified type in this branch
    const classSkills = await prisma.classSkill.findMany({
      where: { 
        classId: playerClass.id,
        branch: branchName,
        skill: {
          type: skillType
        }
      },
      include: { skill: true }
    });

    // Get user's learned skills in this category
    const userSkills = await prisma.userSkill.findMany({
      where: { 
        userId: user.id,
        skillId: {
          in: classSkills.map(cs => cs.skillId)
        }
      },
      include: { skill: true }
    });

    if (userSkills.length === 0) {
      return interaction.editReply('❌ You have no skills to respec in this category.');
    }

    // Check cooldown
    const cooldownField = skillType === 'PASSIVE' ? 'lastPassiveRespecTime' : 
                         skillType === 'ACTIVE' ? 'lastActiveRespecTime' : 'lastUltimateRespecTime';
    
    const lastRespecTime = user[cooldownField];
    const cooldownHours = 24;
    const cooldownMs = cooldownHours * 60 * 60 * 1000;
    
    if (lastRespecTime) {
      const timeSinceLastRespec = Date.now() - lastRespecTime.getTime();
      const remainingTime = cooldownMs - timeSinceLastRespec;
      
      if (remainingTime > 0) {
        const remainingHours = Math.floor(remainingTime / (60 * 60 * 1000));
        const remainingMinutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        
        return interaction.editReply(`⏰ **Respec on Cooldown!**\n\nYou can respec ${skillType.toLowerCase()} skills again in **${remainingHours}h ${remainingMinutes}m**.\n\nCooldown: 24 hours per category`);
      }
    }

    // Calculate total skill points to refund
    const totalPointsToRefund = userSkills.reduce((total, us) => total + us.level, 0);

    // Delete all learned skills in this category and update cooldown
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        skillPoints: { increment: totalPointsToRefund },
        [cooldownField]: new Date()
      }
    });

    // Delete all learned skills in this category
    await prisma.userSkill.deleteMany({
      where: { 
        userId: user.id,
        skillId: {
          in: classSkills.map(cs => cs.skillId)
        }
      }
    });

    // Remove equipped skills that were respecced
    await prisma.equippedSkill.deleteMany({
      where: { 
        userId: user.id,
        skillId: {
          in: classSkills.map(cs => cs.skillId)
        }
      }
    });

    const skillTypeEmoji = skillType === 'PASSIVE' ? '🛡️' : skillType === 'ACTIVE' ? '⚔️' : '🌟';

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🔄 Category Respec Complete!')
      .setDescription(`Successfully respecced all ${skillType.toLowerCase()} skills in ${branchName}.`)
      .addFields({
        name: '📊 Summary',
        value: `Refunded: ${totalPointsToRefund} skill points\nCategory: ${skillTypeEmoji} ${skillType} Skills\nBranch: ${branchName}`,
        inline: true
      });

    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`view_skills_${branchName}_${skillType}`)
          .setLabel('🔙 Back to Skills')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [backButton]
    });

  } catch (error) {
    console.error('Error respeccing category:', error);
    await interaction.reply({
      content: '❌ An error occurred while respeccing skills.',
      ephemeral: true
    });
  }
}



async function handleEquippedSkills(interaction) {
  try {
    const userId = interaction.user.id;
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    if (!user.playerClass) {
      return interaction.editReply('❌ You need to choose a class first!');
    }

    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });

    // Get user's equipped skills
    const equippedSkills = await prisma.equippedSkill.findMany({
      where: { userId: user.id },
      include: { skill: true },
      orderBy: { slot: 'asc' }
    });

    // Get class information
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: user.playerClass }
    });

    if (!playerClass) {
      return interaction.editReply('❌ Class information not found.');
    }

    // Get all skills for this class
    const classSkills = await prisma.classSkill.findMany({
      where: { classId: playerClass.id },
      include: { skill: true },
      orderBy: [
        { branch: 'asc' },
        { unlockLevel: 'asc' },
        { skill: { name: 'asc' } }
      ]
    });

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('⚔️ Equipped Skills')
      .setDescription(`Manage your battle skills for **${user.playerClass}**`);

    // Show currently equipped skills
    if (equippedSkills.length > 0) {
      const equippedList = equippedSkills.map(es => {
        const userSkill = userSkills.find(us => us.skillId === es.skillId);
        const level = userSkill ? userSkill.level : 0;
        const maxLevel = es.skill.type === 'ACTIVE' ? 3 : 2;
        return `**Slot ${es.slot}**: ${es.skill.name} (Level ${level}/${maxLevel}) - ${es.skill.description}`;
      }).join('\n');
      
      embed.addFields({
        name: '🎯 Currently Equipped',
        value: equippedList,
        inline: false
      });
    } else {
      embed.addFields({
        name: '🎯 Currently Equipped',
        value: 'No skills equipped for battle',
        inline: false
      });
    }

    // Calculate total modifiers from equipped skills and passive skills
    let totalModifiers = {
      attack: 0,
      defense: 0,
      hp: 0,
      effects: []
    };

    // Calculate modifiers from equipped skills
    for (const equippedSkill of equippedSkills) {
      const userSkill = userSkills.find(us => us.skillId === equippedSkill.skillId);
      const level = userSkill ? userSkill.level : 1;
      const effect = equippedSkill.skill.baseEffect + (equippedSkill.skill.effectPerLevel * (level - 1));
      
      // Calculate modifiers based on skill effects
      if (equippedSkill.skill.name.includes('Attack') || equippedSkill.skill.name.includes('Damage')) {
        totalModifiers.attack += effect;
      } else if (equippedSkill.skill.name.includes('Defense') || equippedSkill.skill.name.includes('Shield')) {
        totalModifiers.defense += effect;
      } else if (equippedSkill.skill.name.includes('HP') || equippedSkill.skill.name.includes('Heal')) {
        totalModifiers.hp += effect;
      }
      
      totalModifiers.effects.push(`${equippedSkill.skill.name}: ${equippedSkill.skill.description}`);
    }

    // Calculate modifiers from passive skills (auto-active)
    for (const cs of classSkills) {
      if (cs.skill.type === 'PASSIVE') {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        if (userSkill) {
          const level = userSkill.level;
          const effect = cs.skill.baseEffect + (cs.skill.effectPerLevel * (level - 1));
          
          // Calculate modifiers based on skill effects
          if (cs.skill.name.includes('Attack') || cs.skill.name.includes('Damage')) {
            totalModifiers.attack += effect;
          } else if (cs.skill.name.includes('Defense') || cs.skill.name.includes('Shield')) {
            totalModifiers.defense += effect;
          } else if (cs.skill.name.includes('HP') || cs.skill.name.includes('Heal')) {
            totalModifiers.hp += effect;
          }
          
          totalModifiers.effects.push(`${cs.skill.name} (Passive): ${cs.skill.description}`);
        }
      }
    }

    // Add divider
    embed.addFields({
      name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      value: '',
      inline: false
    });

    // Add information
    embed.addFields({
      name: '📋 How to Equip Skills',
      value: '• **Active Skills**: Can equip up to 4 skills (slots 1-4)\n• **Ultimate Skills**: Can equip 1 skill (slot 1)\n• **Passive Skills**: Automatically active when learned (not shown for equipping)\n• **Click skill buttons** to equip/unequip skills for battle',
      inline: false
    });

    // Add passive skills section
    const passiveSkills = [];
    for (const cs of classSkills) {
      if (cs.skill.type === 'PASSIVE') {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        if (userSkill) {
          const level = userSkill.level;
          const effect = cs.skill.baseEffect + (cs.skill.effectPerLevel * (level - 1));
          passiveSkills.push({
            name: cs.skill.name,
            level: level,
            maxLevel: cs.skill.maxLevel,
            description: cs.skill.description,
            effect: effect
          });
        }
      }
    }

    if (passiveSkills.length > 0) {
      let passiveText = '';
      for (const passive of passiveSkills) {
        passiveText += `🛡️ **${passive.name}** (Level ${passive.level}/${passive.maxLevel})\n`;
        passiveText += `└ ${passive.description} (${passive.effect} effect)\n\n`;
      }
      
      embed.addFields({
        name: '🛡️ Passive Skills (Auto-Active)',
        value: passiveText,
        inline: false
      });
    }

    // Add total modifiers
    if (totalModifiers.attack > 0 || totalModifiers.defense > 0 || totalModifiers.hp > 0) {
      let modifiersText = '';
      if (totalModifiers.attack > 0) modifiersText += `• **Attack Bonus**: +${totalModifiers.attack}\n`;
      if (totalModifiers.defense > 0) modifiersText += `• **Defense Bonus**: +${totalModifiers.defense}\n`;
      if (totalModifiers.hp > 0) modifiersText += `• **HP Bonus**: +${totalModifiers.hp}\n`;
      
      embed.addFields({
        name: '📊 Total Skill Modifiers',
        value: modifiersText,
        inline: true
      });
    }

    // Create skill buttons for equipping/unequipping (only active and ultimate skills)
    const buttons = [];
    
    // Get all class skills and filter for equippable ones
    for (const cs of classSkills) {
      if ((cs.skill.type === 'ACTIVE' || cs.skill.type === 'ULTIMATE')) {
        const userSkill = userSkills.find(us => us.skillId === cs.skillId);
        const isLearned = !!userSkill;
        
        if (isLearned) {
          const isEquipped = equippedSkills.some(es => es.skillId === cs.skillId);
          const equippedSlot = isEquipped ? equippedSkills.find(es => es.skillId === cs.skillId)?.slot : null;
          
          let buttonLabel = cs.skill.name;
          let buttonStyle = ButtonStyle.Secondary;
          
          if (isEquipped) {
            buttonLabel = `⚔️ ${cs.skill.name} (Slot ${equippedSlot})`;
            buttonStyle = ButtonStyle.Success;
          } else {
            buttonLabel = `🔓 ${cs.skill.name}`;
            buttonStyle = ButtonStyle.Primary;
          }
          
          buttons.push(
            new ButtonBuilder()
              .setCustomId(`equip_skill_${cs.skillId}`)
              .setLabel(buttonLabel)
              .setStyle(buttonStyle)
          );
        }
      }
    }

    // Add navigation buttons
    buttons.push(
      new ButtonBuilder()
        .setCustomId('skills')
        .setLabel('🔙 Back to Skills')
        .setStyle(ButtonStyle.Secondary)
    );

    // Create button rows (max 3 buttons per row)
    const buttonRows = [];
    for (let i = 0; i < buttons.length; i += 3) {
      const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
      buttonRows.push(row);
    }

    await interaction.editReply({
      embeds: [embed],
      components: buttonRows
    });

  } catch (error) {
    console.error('Error handling equipped skills:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading equipped skills.',
      ephemeral: true
    });
  }
}

async function handleEquipSkill(interaction) {
  try {
    const userId = interaction.user.id;
    const skillId = interaction.customId.replace('equip_skill_', '');
    
    const user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.editReply('❌ User not found.');
    }

    // Get the skill
    const skill = await prisma.skill.findUnique({
      where: { id: skillId }
    });

    if (!skill) {
      return interaction.editReply('❌ Skill not found.');
    }

    // Check if user has learned this skill
    const userSkill = await prisma.userSkill.findFirst({
      where: {
        userId: user.id,
        skillId: skillId
      }
    });

    if (!userSkill) {
      return interaction.editReply('❌ You need to learn this skill first!');
    }

    // Check if skill is already equipped
    const existingEquipped = await prisma.equippedSkill.findFirst({
      where: {
        userId: user.id,
        skillId: skillId
      }
    });

    if (existingEquipped) {
      // Unequip the skill
      await prisma.equippedSkill.delete({
        where: { id: existingEquipped.id }
      });

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🔓 Skill Unequipped!')
        .setDescription(`**${skill.name}** has been unequipped from battle.`)
        .addFields({
          name: '📊 Skill Details',
          value: `**Type**: ${skill.type}\n**Level**: ${userSkill.level}/${skill.maxLevel}\n**Description**: ${skill.description}`,
          inline: true
        });

      await interaction.editReply({ embeds: [embed] });
      
      // Send success message - user can refresh manually if needed
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Equip the skill
    let slot = 1;
    
    // Find next available slot based on skill type
    if (skill.type === 'ACTIVE') {
      // Find next available slot (1-4)
      for (let i = 1; i <= 4; i++) {
        const slotTaken = await prisma.equippedSkill.findFirst({
          where: {
            userId: user.id,
            slot: i
          }
        });
        if (!slotTaken) {
          slot = i;
          break;
        }
      }
      
      if (slot > 4) {
        return interaction.editReply('❌ You can only equip up to 4 active skills. Unequip one first!');
      }
    } else if (skill.type === 'ULTIMATE') {
      // Check if ultimate slot is taken
      const ultimateSlot = await prisma.equippedSkill.findFirst({
        where: {
          userId: user.id,
          slot: 1
        }
      });
      
      if (ultimateSlot) {
        return interaction.editReply('❌ You can only equip 1 ultimate skill. Unequip the current one first!');
      }
      slot = 1;
    } else {
      // Passive skills are automatically active, no need to equip
      return interaction.editReply('❌ Passive skills are automatically active when learned!');
    }

    // Equip the skill
    await prisma.equippedSkill.create({
      data: {
        userId: user.id,
        skillId: skillId,
        slot: slot
      }
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('⚔️ Skill Equipped!')
      .setDescription(`**${skill.name}** has been equipped for battle in slot ${slot}!`)
      .addFields({
        name: '📊 Skill Details',
        value: `**Type**: ${skill.type}\n**Level**: ${userSkill.level}/${skill.maxLevel}\n**Slot**: ${slot}\n**Description**: ${skill.description}`,
        inline: true
      });

    await interaction.editReply({ embeds: [embed] });
    
    // Immediately refresh the equipped skills view
    try {
      await handleEquippedSkills(interaction);
    } catch (error) {
      console.error('Error refreshing equipped skills interface:', error);
    }

  } catch (error) {
    console.error('Error equipping skill:', error);
    await interaction.reply({
      content: '❌ An error occurred while equipping the skill.',
      ephemeral: true
    });
  }
}

module.exports = {
  handleButtonInteraction
};