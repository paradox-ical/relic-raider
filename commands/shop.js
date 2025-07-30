const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const prisma = require('../lib/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Browse and buy items from the shop')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View available items in the shop')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('buy')
        .setDescription('Buy an item from the shop')
        .addStringOption(option =>
          option.setName('item')
            .setDescription('The item to buy')
            .setRequired(true)
            .addChoices(
              { name: '🖌️ Worn Boar Bristle - 300 coins', value: 'Worn Boar Bristle' },
              { name: '🖌️ Polished Wood Brush - 600 coins', value: 'Polished Wood Brush' },
              { name: '🖌️ Bronze Detail Brush - 1200 coins', value: 'Bronze Detail Brush' },
              { name: '🖌️ Ivory Precision Brush - 2500 coins', value: 'Ivory Precision Brush' },
              { name: '🖌️ Quartz Fiber Brush - 5000 coins', value: 'Quartz Fiber Brush' },
              { name: '🖌️ Phoenix Feather Brush - 10000 coins', value: 'Phoenix Feather Brush' },
              { name: '🖌️ Celestial Dust Brush - 25000 coins', value: 'Celestial Dust Brush' },
              { name: '🗺️ Tattered Parchment - 25,000 coins', value: 'Tattered Parchment' },
              { name: '🗺️ Leather Scroll - 50,000 coins', value: 'Leather Scroll' },
              { name: '🗺️ Silk Chart - 75,000 coins', value: 'Silk Chart' },
              { name: '🗺️ Crystal Atlas - 100,000 coins', value: 'Crystal Atlas' }
            )
        )
    ),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'view') {
      await this.showShop(interaction);
    } else if (subcommand === 'buy') {
      await this.buyItem(interaction);
    }
  },
  
  async showShop(interaction) {
    await interaction.deferReply();
    
    try {
      // Get all brushes and maps from database
      const brushes = await prisma.brush.findMany({
        orderBy: { tier: 'asc' }
      });
      
      const maps = await prisma.map.findMany({
        orderBy: { tier: 'asc' }
      });
      

      
      const embed = new EmbedBuilder()
        .setColor('#ffd700')
        .setTitle('🏪 Relic Raider Shop')
        .setDescription('Buy brushes to reduce your explore cooldown and maps to increase drop chances!')
        .setTimestamp();
      
      // Add brushes section
      embed.addFields({
        name: '🖌️ Brushes - Reduce Cooldown',
        value: 'Brushes help you explore more frequently by reducing cooldown times.',
        inline: false
      });
      
      for (const brush of brushes) {
        const cooldownReduction = Math.floor((1 - brush.multiplier) * 100);
        const exactCooldown = (brush.multiplier * 4).toFixed(1);
        // Use the actual price (no multiplier needed since we already reduced prices)
        const displayPrice = brush.price;
        embed.addFields({
          name: `🖌️ ${brush.name} - ${displayPrice} coins`,
          value: `${brush.description}\n⏰ **${cooldownReduction}% cooldown reduction** (${exactCooldown}s cooldown)`,
          inline: false
        });
      }
      
      // Add maps section
      embed.addFields({
        name: '🗺️ Maps - Increase Drop Chances',
        value: 'Maps increase your chances of finding better items during exploration.',
        inline: false
      });
      
      for (const map of maps) {
        const dropIncrease = Math.floor((map.dropMultiplier - 1) * 100);
        embed.addFields({
          name: `🗺️ ${map.name} - ${map.price.toLocaleString()} coins`,
          value: `${map.description}\n📈 **${dropIncrease}% drop rate increase**`,
          inline: false
        });
      }
      
      embed.addFields({
        name: '💡 How to Buy',
        value: 'Use `/shop buy <item>` to purchase an item!',
        inline: false
      });
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error showing shop:', error);
      await interaction.editReply('❌ An error occurred while loading the shop.');
    }
  },
  
  async buyItem(interaction) {
    await interaction.deferReply();
    
    const itemName = interaction.options.getString('item');
    const userId = interaction.user.id;
    
    try {
      // Get user
      let user = await prisma.user.findUnique({
        where: { discordId: userId }
      });
      
      if (!user) {
        return interaction.editReply('❌ You need to start your adventure first! Use `/explore` to begin.');
      }
      
      // Get the brush or map
      let brush = await prisma.brush.findUnique({
        where: { name: itemName }
      });
      
      let map = null;
      if (!brush) {
        map = await prisma.map.findUnique({
          where: { name: itemName }
        });
      }
      
      if (!brush && !map) {
        return interaction.editReply('❌ Item not found in shop!');
      }
      
      const item = brush || map;
      const isMap = !!map;
      
      // Check if user has enough coins
      if (user.coins < item.price) {
        return interaction.editReply(`❌ You don't have enough coins! You need ${item.price.toLocaleString()} coins, but you have ${user.coins} coins.`);
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
          data: { coins: { decrement: item.price } }
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
        .setDescription(`You bought a **${item.name}** for ${item.price.toLocaleString()} coins!`)
        .addFields(
          { name: '💰 Remaining Coins', value: `${user.coins - item.price}`, inline: true }
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
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error buying item:', error);
      await interaction.editReply('❌ An error occurred while processing your purchase.');
    }
  }
}; 