const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createMainMenuButtonsWithBosses } = require('../lib/buttons');
const prisma = require('../lib/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Open the main Relic Raider hub'),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
    } catch (error) {
      if (error.code === 10062) {
        console.warn(`[Raid Command] Interaction already expired. Skipping.`);
        return;
      }
      throw error;
    }
    
    try {
      const userId = interaction.user.id;
      const username = interaction.user.username;
      
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
            coins: 0,
            tutorialCompleted: false
          }
        });
      }

      // Check if user needs tutorial
      const TutorialSystem = require('../lib/tutorial-system');
      const needsTutorial = await TutorialSystem.needsTutorial(user.id);
      
      if (needsTutorial) {
        const { embed, components } = await TutorialSystem.startTutorial(interaction, user);
        await interaction.editReply({ embeds: [embed], components: components });
        return;
      }
      
      // Calculate XP progress to next level
      const { calculateLevelProgress } = require('../lib/xp-system');
      const levelProgress = calculateLevelProgress(user.experience, user.currentZone);
      
      // Get current region
      const currentZone = user.currentZone || 'Jungle Ruins';
      
      // Get active challenges and their completion status
      const ChallengeSystem = require('../lib/challenge-system');
      const activeChallenges = await ChallengeSystem.getActiveChallenges(user.id);
      const completedChallenges = activeChallenges.filter(c => c.userProgress?.isCompleted).length;
      const totalChallenges = activeChallenges.length;
      
      // Create progress bar for level
      const createProgressBar = (percentage) => {
        const filled = Math.round(percentage / 10);
        const empty = 10 - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
      };
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
      console.error('Error in raid command:', error);
      await interaction.editReply('❌ An error occurred while opening the hub.');
    }
  },
}; 