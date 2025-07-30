const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View server and global leaderboards')
    .addStringOption(option =>
      option.setName('type')
        .setDescription('Type of leaderboard to view')
        .setRequired(false)
        .addChoices(
          { name: '🏆 Levels', value: 'levels' },
          { name: '💰 Coins', value: 'coins' },
          { name: '🎒 Relics Found', value: 'relics' },
          { name: '🔴 Mythic Relics', value: 'mythics' },
          { name: '📊 All Categories', value: 'all' }
        )),

  async execute(interaction) {
    await interaction.deferReply();

    const type = interaction.options.getString('type') || 'all';
    const guildId = interaction.guildId;

    try {
      if (type === 'all') {
        await showAllLeaderboards(interaction, guildId);
      } else {
        await showSpecificLeaderboard(interaction, type, guildId);
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
      await interaction.editReply({
        content: '❌ An error occurred while fetching the leaderboard data.',
        ephemeral: true
      });
    }
  }
};

async function showAllLeaderboards(interaction, guildId) {
  const embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('🏆 Relic Raider Leaderboards')
    .setDescription('Choose a category to view detailed rankings')
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  const buttons = new ActionRowBuilder()
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

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

async function showSpecificLeaderboard(interaction, type, guildId) {
  let embed, title, description;
  let globalData, serverData;

  switch (type) {
    case 'levels':
      title = '🏆 Level Leaderboard';
      description = 'Top players by level';
      globalData = await getLevelLeaderboard();
      serverData = await getLevelLeaderboard(guildId);
      break;
    case 'coins':
      title = '💰 Coin Leaderboard';
      description = 'Top players by total coins';
      globalData = await getCoinLeaderboard();
      serverData = await getCoinLeaderboard(guildId);
      break;
    case 'relics':
      title = '🎒 Relic Leaderboard';
      description = 'Top players by total relics found';
      globalData = await getRelicLeaderboard();
      serverData = await getRelicLeaderboard(guildId);
      break;
    case 'mythics':
      title = '🔴 Mythic Relic Leaderboard';
      description = 'Top players by mythic relics found';
      globalData = await getMythicLeaderboard();
      serverData = await getMythicLeaderboard(guildId);
      break;
  }

  embed = new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(interaction.guild.iconURL())
    .setTimestamp();

  // Add global rankings
  if (globalData.length > 0) {
    const globalField = formatLeaderboardField('🌍 Global Rankings', globalData, type);
    embed.addFields(globalField);
  }

  // Add server rankings
  if (serverData.length > 0) {
    const serverField = formatLeaderboardField(`🏠 ${interaction.guild.name} Rankings`, serverData, type);
    embed.addFields(serverField);
  }

  // Add navigation buttons
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('lb_all')
        .setLabel('📊 All Categories')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('lb_levels')
        .setLabel('🏆 Levels')
        .setStyle(type === 'levels' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_coins')
        .setLabel('💰 Coins')
        .setStyle(type === 'coins' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_relics')
        .setLabel('🎒 Relics')
        .setStyle(type === 'relics' ? ButtonStyle.Success : ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('lb_mythics')
        .setLabel('🔴 Mythics')
        .setStyle(type === 'mythics' ? ButtonStyle.Success : ButtonStyle.Primary)
    );

  await interaction.editReply({
    embeds: [embed],
    components: [buttons]
  });
}

async function getLevelLeaderboard(guildId = null) {
  const whereClause = guildId ? { guildId: guildId } : {};
  
  return await prisma.user.findMany({
    where: whereClause,
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
  const whereClause = guildId ? { guildId: guildId } : {};
  
  return await prisma.user.findMany({
    where: whereClause,
    select: {
      username: true,
      coins: true
    },
    orderBy: { coins: 'desc' },
    take: 10
  });
}

async function getRelicLeaderboard(guildId = null) {
  const whereClause = guildId ? { user: { guildId: guildId } } : {};
  
  return await prisma.inventoryItem.groupBy({
    by: ['userId'],
    where: whereClause,
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
}

async function getMythicLeaderboard(guildId = null) {
  const whereClause = guildId ? { user: { guildId: guildId } } : {};
  
  return await prisma.inventoryItem.findMany({
    where: {
      ...whereClause,
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
  if (data.length === 0) {
    return { name: title, value: 'No data available', inline: false };
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  
  let formattedData;
  
  switch (type) {
    case 'levels':
      formattedData = data.map((user, index) => {
        const medal = medals[index] || `${index + 1}.`;
        return `${medal} **${user.username}** - Level ${user.level} (${user.experience} XP)`;
      });
      break;
    case 'coins':
      formattedData = data.map((user, index) => {
        const medal = medals[index] || `${index + 1}.`;
        return `${medal} **${user.username}** - ${user.coins.toLocaleString()} coins`;
      });
      break;
    case 'relics':
      formattedData = data.map((item, index) => {
        const medal = medals[index] || `${index + 1}.`;
        return `${medal} **${item.user.username}** - ${item._sum.quantity} relics`;
      });
      break;
    case 'mythics':
      formattedData = data.map((item, index) => {
        const medal = medals[index] || `${index + 1}.`;
        return `${medal} **${item.user.username}** - ${item.quantity} mythic relics`;
      });
      break;
  }

  return {
    name: title,
    value: formattedData.join('\n'),
    inline: false
  };
} 