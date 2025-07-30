const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../lib/database');
const { getItemEmoji } = require('../lib/emoji-config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell items from your inventory for coins')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The item to sell')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('How many to sell (default: 1)')
        .setRequired(false)
        .setMinValue(1)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const itemName = interaction.options.getString('item');
    const quantity = interaction.options.getInteger('quantity') || 1;
    const userId = interaction.user.id;
    
    try {
      // Get user
      let user = await prisma.user.findUnique({
        where: { discordId: userId }
      });
      
      if (!user) {
        return interaction.editReply('❌ You need to start your adventure first! Use `/explore` to begin.');
      }
      
      // Get the item
      const item = await prisma.item.findUnique({
        where: { name: itemName }
      });
      
      if (!item) {
        return interaction.editReply('❌ Item not found!');
      }
      
      // Get user's inventory item
      const inventoryItem = await prisma.inventoryItem.findUnique({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: item.id
          }
        }
      });
      
      if (!inventoryItem) {
        return interaction.editReply(`❌ You don't own any ${item.name}!`);
      }
      
      if (inventoryItem.quantity < quantity) {
        return interaction.editReply(`❌ You only have ${inventoryItem.quantity} ${item.name}, but you're trying to sell ${quantity}!`);
      }
      
      // Calculate sale value
      const totalValue = item.value * quantity;
      
      // Process the sale
      await prisma.$transaction([
        // Add coins to user
        prisma.user.update({
          where: { id: user.id },
          data: { coins: { increment: totalValue } }
        }),
        // Remove items from inventory
        prisma.inventoryItem.update({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: item.id
            }
          },
          data: { quantity: { decrement: quantity } }
        })
      ]);
      
      // Delete inventory item if quantity becomes 0
      if (inventoryItem.quantity - quantity === 0) {
        await prisma.inventoryItem.delete({
          where: {
            userId_itemId: {
              userId: user.id,
              itemId: item.id
            }
          }
        });
      }
      
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('💰 Sale Successful!')
        .setDescription(`You sold ${quantity}x ${getItemEmoji(item.name, item.rarity)} **${item.name}** for ${totalValue} coins!`)
        .addFields(
          { name: '📦 Items Sold', value: `${quantity}x ${item.name}`, inline: true },
          { name: '💰 Value per Item', value: `${item.value} coins`, inline: true },
          { name: '💎 Total Earned', value: `${totalValue} coins`, inline: true },
          { name: '💰 New Balance', value: `${user.coins + totalValue} coins`, inline: false }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error in sell command:', error);
      await interaction.editReply('❌ An error occurred while processing the sale.');
    }
  },
  
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const userId = interaction.user.id;
    
    try {
      // Get user's inventory items
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { userId: { discordId: userId } },
        include: { item: true }
      });
      
      // Filter items that match the input
      const filtered = inventoryItems
        .filter(invItem => invItem.item.name.toLowerCase().includes(focusedValue.toLowerCase()))
        .slice(0, 25); // Discord limit
      
      const choices = filtered.map(invItem => ({
        name: `${invItem.item.name} (x${invItem.quantity})`,
        value: invItem.item.name
      }));
      
      await interaction.respond(choices);
    } catch (error) {
      console.error('Error in sell autocomplete:', error);
      await interaction.respond([]);
    }
  }
}; 