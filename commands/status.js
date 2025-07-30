const { SlashCommandBuilder } = require('discord.js');
const { createStatusEmbed } = require('../lib/shard-utils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('View bot status and shard information'),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const embed = await createStatusEmbed(interaction.client);
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in status command:', error);
      await interaction.editReply('❌ An error occurred while fetching bot status.');
    }
  },
}; 