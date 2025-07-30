const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const AchievementSystem = require('../lib/achievement-system');
const prisma = new PrismaClient();
const { getItemEmoji } = require('../lib/emoji-config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('View your achievements and titles')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('What to view')
        .setRequired(false)
        .addChoices(
          { name: '🏆 Achievements', value: 'achievements' },
          { name: '👑 Titles', value: 'titles' },
          { name: '📊 Progress', value: 'progress' }
        )),

  async execute(interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('type') || 'achievements';
    const discordId = interaction.user.id;

    try {
      // Get user
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

      switch (type) {
        case 'achievements':
          await showAchievements(interaction, user);
          break;
        case 'titles':
          await showTitles(interaction, user);
          break;
        case 'progress':
          await showProgress(interaction, user);
          break;
        default:
          await showAchievements(interaction, user);
      }
    } catch (error) {
      console.error('Achievements command error:', error);
      await interaction.editReply({
        content: '❌ An error occurred while fetching achievements.',
        ephemeral: true
      });
    }
  }
};

async function showAchievements(interaction, user) {
  // Check for new achievements first
  const newlyCompleted = await AchievementSystem.checkAchievements(user.id);
  
  // Get user's achievements
  const userAchievements = await AchievementSystem.getUserAchievements(user.id);
  
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏆 Achievements')
    .setDescription(`**${user.username}**'s achievement progress`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .setTimestamp();

  // Show newly completed achievements
  if (newlyCompleted.length > 0) {
    const newAchievementsText = newlyCompleted.map(achievement => 
      `🎉 **${achievement.name}** - ${achievement.description}`
    ).join('\n');
    
    embed.addFields({
      name: '🎉 Newly Unlocked!',
      value: newAchievementsText,
      inline: false
    });
  }

  // Group achievements by category
  const categories = {};
  userAchievements.forEach(ua => {
    const category = ua.achievement.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(ua);
  });

  // Add each category to the embed
  for (const [category, achievements] of Object.entries(categories)) {
    const categoryEmoji = {
      'exploration': '🔍',
      'collection': '🎒',
      'economic': '💰',
      'level': '⭐'
    };

    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    const emoji = categoryEmoji[category] || '🏆';
    
    const completed = achievements.filter(ua => ua.isCompleted).length;
    const total = achievements.length;
    
    const achievementsText = achievements.map(ua => {
      const status = ua.isCompleted ? '✅' : '⏳';
      const progress = ua.isCompleted ? 
        `${ua.achievement.requirementValue}/${ua.achievement.requirementValue}` :
        `${ua.progress}/${ua.achievement.requirementValue}`;
      
      return `${status} **${ua.achievement.name}** (${progress})`;
    }).join('\n');

    embed.addFields({
      name: `${emoji} ${categoryName} (${completed}/${total})`,
      value: achievementsText,
      inline: false
    });
  }

  // Add navigation buttons
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('achievements_view')
        .setLabel('🏆 Achievements')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('titles_view')
        .setLabel('👑 Titles')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('progress_view')
        .setLabel('📊 Progress')
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

async function showTitles(interaction, user) {
  const userTitles = await AchievementSystem.getUserTitles(user.id);
  const equippedTitle = await AchievementSystem.getEquippedTitle(user.id);
  
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

  if (userTitles.length > 0) {
    const titlesText = userTitles.map(ut => {
      const status = ut.isEquipped ? '👑' : '📜';
      
              return `${status} ${getItemEmoji(ut.title.name, ut.title.rarity)} **${ut.title.name}** - ${ut.title.description}`;
    }).join('\n');

    embed.addFields({
      name: `📜 Earned Titles (${userTitles.length})`,
      value: titlesText,
      inline: false
    });
  } else {
    embed.addFields({
      name: '📜 Earned Titles',
      value: 'No titles earned yet. Complete achievements to unlock titles!',
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
        .setCustomId('titles_view')
        .setLabel('👑 Titles')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('progress_view')
        .setLabel('📊 Progress')
        .setStyle(ButtonStyle.Primary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

async function showProgress(interaction, user) {
  const userStats = await AchievementSystem.getUserStats(user.id);
  const userAchievements = await AchievementSystem.getUserAchievements(user.id);
  
  const completedAchievements = userAchievements.filter(ua => ua.isCompleted).length;
  const totalAchievements = userAchievements.length;
  
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
        .setStyle(ButtonStyle.Success)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
} 