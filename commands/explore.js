const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../lib/database');
const { canExplore, updateLastExplore, getBestBrush, getBestMap } = require('../lib/cooldown');
const { calculateExplorationXP, awardXP } = require('../lib/xp-system');
const { getItemEmoji } = require('../lib/emoji-config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('explore')
    .setDescription('Explore to find ancient relics and treasures'),
  
  cooldown: 0, // We handle cooldown manually now
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const userId = interaction.user.id;
    const username = interaction.user.username;
    
    try {
      // Get or create user
      let user = await prisma.user.findUnique({
        where: { discordId: userId }
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            discordId: userId,
            username: username,
            guildId: interaction.guildId || null,
            level: 1,
            experience: 0,
            coins: 0
          }
        });
      }
      
      // Get all zones and find the best one for the user's level
      const zones = await prisma.zone.findMany({
        include: {
          zoneItems: {
            include: {
              item: true
            }
          }
        },
        orderBy: {
          minLevel: 'asc'
        }
      });
      
      // Find the highest level zone the user can access
      let selectedZone = null;
      for (const zone of zones) {
        if (user.level >= zone.minLevel) {
          selectedZone = zone;
        } else {
          break; // Zones are ordered by minLevel, so we can stop here
        }
      }
      
      if (!selectedZone) {
        return interaction.editReply('❌ No suitable zones found for your level!');
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
        
        return interaction.editReply(cooldownMessage);
      }
      
      // Calculate XP gained from exploration
      const experienceGained = calculateExplorationXP(user.level, selectedZone.name);
      
      // Get user's best map for drop rate multiplier
      const bestMap = await getBestMap(user.id);
      const mapMultiplier = bestMap ? bestMap.map.dropMultiplier : 1.0;
      
      // Use the loot system to generate items with map multiplier
      const { simulateExploration } = require('../lib/loot-system');
      const explorationResult = await simulateExploration(selectedZone, mapMultiplier);
      const foundItems = explorationResult.foundItems;
      const chest = explorationResult.chest;
      const chestItem = explorationResult.chestItem;
      
      // Add regular items to user's inventory
      const { addItemsToInventory } = require('../lib/loot-system');
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
      
      // Award XP using the new system
      const xpResult = await awardXP(user.id, experienceGained, selectedZone.name);
      const levelUp = xpResult.leveledUp;
      const skillPointsAwarded = xpResult.skillPointsAwarded || 0;
      
      // Update last explore timestamp
      await updateLastExplore(user.id);
      
      // Create embed response
      const embed = new EmbedBuilder()
        .setColor(foundItems.length > 0 ? '#00ff00' : '#ffaa00')
        .setTitle(`🔍 Exploring ${selectedZone.name}`)
        .setDescription(selectedZone.description)
        .addFields(
          { name: '📊 Experience Gained', value: `+${experienceGained} XP`, inline: true },
          { name: '⭐ Level', value: `${xpResult.newLevel}${levelUp ? ' 🎉' : ''}`, inline: true },
          { name: '💰 Total Coins', value: `${user.coins}`, inline: true }
        );
      
      // Add modifiers info to embed
      const bestBrush = await getBestBrush(user.id);
      let modifiersText = '';
      
      if (bestBrush) {
        const cooldownReduction = Math.floor((1 - bestBrush.brush.multiplier) * 100);
        modifiersText += `🖌️ **${bestBrush.brush.name}** (${cooldownReduction}% cooldown reduction)\n`;
      }
      
      if (bestMap) {
        const rarityIncrease = Math.floor((bestMap.map.dropMultiplier - 1) * 100);
        modifiersText += `🗺️ **${bestMap.map.name}** (${rarityIncrease}% rarity boost)`;
      }
      
      if (modifiersText) {
        embed.addFields({ 
          name: '⚡ Modifiers', 
          value: modifiersText, 
          inline: false 
        });
      }
      
      embed.setTimestamp();
      
      if (foundItems.length > 0) {
        const itemsList = foundItems.map(foundItem => {
          const rarityName = foundItem.item.rarity.charAt(0) + foundItem.item.rarity.slice(1).toLowerCase();
          return `${getItemEmoji(foundItem.item.name, foundItem.item.rarity)} **${foundItem.item.name}** x${foundItem.quantity} (${rarityName})`;
        }).join('\n');
        
        embed.addFields({ name: '🎁 Items Found', value: itemsList });
      } else {
        embed.addFields({ name: '🎁 Items Found', value: 'Nothing this time... Keep exploring!' });
      }
      
      // Add chest information if found
      if (chest && chestItem) {
        const rarityName = chestItem.item.rarity.slice(0, 1) + chestItem.item.rarity.slice(1).toLowerCase();
        
        embed.addFields(
          { 
            name: `${chest.emoji} ${chest.name} Found!`, 
            value: `You found a ${chest.name.toLowerCase()}!`, 
            inline: false 
          },
          { 
            name: '📦 Chest Contents', 
            value: `${getItemEmoji(chestItem.item.name, chestItem.item.rarity)} **${chestItem.item.name}** x${chestItem.quantity} (${rarityName})\n💰 **${chestCoins} coins** added to your balance!`, 
            inline: false 
          }
        );
      }
      
      if (levelUp) {
        let levelUpMessage = `Congratulations! You reached level ${xpResult.newLevel}!`;
        if (skillPointsAwarded > 0) {
          levelUpMessage += `\n⚔️ You earned ${skillPointsAwarded} skill points! Use \`/skills list\` to learn new abilities.`;
        }
        embed.addFields({ name: '🎉 Level Up!', value: levelUpMessage });
      }
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in explore command:', error);
      await interaction.editReply('❌ An error occurred while exploring. Please try again.');
    }
  },
}; 