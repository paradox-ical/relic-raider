const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prisma = require('../lib/database');
const BossSystem = require('../lib/boss-system');
const ServerBossSystem = require('../lib/server-boss-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('boss')
    .setDescription('Check boss spawn information for your current zone'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { discordId: interaction.user.id }
      });

      if (!user) {
        await interaction.editReply('❌ User not found. Please use `/start` to create your account.');
        return;
      }

      const currentZone = user.currentZone || 'Jungle Ruins';
      const guildId = interaction.guildId || 'global';
      
      // Get both individual and server boss info
      const bossInfo = await BossSystem.getBossSpawnInfo(user, currentZone);
      const serverBossInfo = await ServerBossSystem.getServerBossSpawnInfo(guildId, currentZone, user);

      if (!bossInfo.hasBoss) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('🏰 Boss Information')
          .setDescription(`**${currentZone}**\n\n❌ This zone has no boss.`)
          .setTimestamp();
        
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(serverBossInfo.canSpawn ? '#00FF00' : '#FF6B35')
        .setTitle('🏰 Server Boss Information')
        .setDescription(`**${currentZone}**\n\n**${serverBossInfo.bossName}**`)
        .addFields(
          {
            name: '🎯 Server Spawn Status',
            value: serverBossInfo.canSpawn ? '✅ **Can Spawn**' : `❌ **Cannot Spawn**\n*${serverBossInfo.reason}*`,
            inline: false
          },
          {
            name: '📊 Server Spawn Chance',
            value: `${serverBossInfo.spawnChance}%`,
            inline: true
          },
          {
            name: '📋 Server Requirements',
            value: `Level: ${serverBossInfo.requirements.level}\nServer Beasts: ${serverBossInfo.requirements.serverBeastsRequired.toLocaleString()}`,
            inline: true
          }
        );

      // Add server cooldown information if applicable
      if (serverBossInfo.cooldown && serverBossInfo.cooldown.remaining > 0) {
        const hoursRemaining = Math.ceil(serverBossInfo.cooldown.remaining / (60 * 60 * 1000));
        const minutesRemaining = Math.ceil((serverBossInfo.cooldown.remaining % (60 * 60 * 1000)) / (60 * 1000));
        
        embed.addFields({
          name: '⏰ Server Cooldown',
          value: `${hoursRemaining}h ${minutesRemaining}m remaining`,
          inline: true
        });
      }

      // Add server progress
      embed.addFields({
        name: '📈 Server Progress',
        value: `Beasts Slain: ${serverBossInfo.serverProgress.beastKills.toLocaleString()}/${serverBossInfo.requirements.serverBeastsRequired.toLocaleString()} (${Math.round(serverBossInfo.serverProgress.progressPercent)}%)`,
        inline: false
      });
      
      // Add individual progress
      const levelProgress = Math.min(100, (user.level / serverBossInfo.requirements.level) * 100);
      embed.addFields({
        name: '👤 Your Progress',
        value: `Level: ${user.level}/${serverBossInfo.requirements.level} (${Math.round(levelProgress)}%)\nYour Beasts Slain: ${user.beastsSlain}`,
        inline: false
      });

      // Add boss stats preview
      const bossBeast = await ServerBossSystem.getBossBeast(serverBossInfo.bossName);
      if (bossBeast) {
        const bossStats = ServerBossSystem.calculateBeastStats ? 
          ServerBossSystem.calculateBeastStats(bossBeast, user.level, currentZone) : 
          { hp: bossBeast.baseHp, attack: bossBeast.baseAttack, defense: bossBeast.baseDefense };

        embed.addFields({
          name: '⚔️ Boss Stats (Estimated)',
          value: `HP: ${bossStats.hp}\nAttack: ${bossStats.attack}\nDefense: ${bossStats.defense}`,
          inline: true
        });
      }

      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in boss command:', error);
      await interaction.editReply('❌ An error occurred while fetching boss information.');
    }
  }
}; 