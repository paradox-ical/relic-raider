const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const prisma = require('../lib/database');
const { getItemEmoji } = require('../lib/emoji-config');
const SkillSystem = require('../lib/skill-system');
const EquipmentSystem = require('../lib/equipment-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your profile and character information')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view profile for (optional)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;
    
    try {
      // Get user data
      let user = await prisma.user.findUnique({
        where: { discordId: userId },
        include: {
          inventoryItems: {
            include: {
              item: true
            }
          }
        }
      });
      
      if (!user) {
        if (targetUser.id === interaction.user.id) {
          return interaction.editReply('❌ You haven\'t started your adventure yet! Use `/explore` to begin.');
        } else {
          return interaction.editReply('❌ This user hasn\'t started their adventure yet!');
        }
      }

      // If viewing someone else's profile, show basic info
      if (targetUser.id !== interaction.user.id) {
        return await showOtherUserProfile(interaction, user, targetUser);
      }

      // If user hasn't chosen a class, show class selection
      if (!user.playerClass) {
        return await showClassSelection(interaction, user);
      }

      // User has a class, show their profile with skill tree options
      return await showUserProfile(interaction, user);
      
    } catch (error) {
      console.error('Error in profile command:', error);
      return interaction.editReply('❌ An error occurred while loading your profile.');
    }
  }
};

async function showClassSelection(interaction, user) {
  try {
    // Get all available classes
    const classes = await SkillSystem.getAllClasses();
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🎭 Choose Your Class')
      .setDescription(`**${interaction.user.username}**, choose a class to specialize your character!\n\nEach class has unique abilities and skill trees that define your playstyle.`);

    for (const playerClass of classes) {
      // Get skill branches for this class
      const classSkills = await prisma.classSkill.findMany({
        where: { classId: playerClass.id },
        include: { skill: true }
      });
      const branches = [...new Set(classSkills.map(cs => cs.branch))].filter(b => b !== 'General');
      
      embed.addFields({
        name: `${playerClass.name}`,
        value: `${playerClass.description}\n\n**Base Stats:**\nHP: ${playerClass.baseHp} (+${playerClass.hpPerLevel}/level)\nAttack: ${playerClass.baseAttack} (+${playerClass.attackPerLevel}/level)\nDefense: ${playerClass.baseDefense} (+${playerClass.defensePerLevel}/level)\n\n**Skill Branches:**\n${branches.map(b => `• ${b}`).join('\n')}`,
        inline: false
      });
    }

    embed.addFields({
      name: '📋 How to Choose',
      value: 'Click one of the buttons below to select your class. You can change your class later using `/skills class`.',
      inline: false
    });

    // Create buttons for each class
    const buttons = [];
    for (const playerClass of classes) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`choose_class_${playerClass.name}`)
          .setLabel(`Choose ${playerClass.name}`)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const buttonRow = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
    await interaction.editReply({ embeds: [embed], components: [buttonRow] });
  } catch (error) {
    console.error('Error showing class selection:', error);
    await interaction.editReply('❌ An error occurred while loading class selection.');
  }
}

async function showUserProfile(interaction, user) {
  try {
    // Get user stats including skills and equipment
    const userStats = await SkillSystem.calculateUserStats(user.id);
    const equipmentBonuses = await EquipmentSystem.calculateEquipmentBonuses(user.id);
    
    // Calculate experience progress
    const currentLevelExp = user.experience % 100;
    const expToNextLevel = 100 - currentLevelExp;
    
    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });

    // Get class skill branches
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: user.playerClass }
    });

    let skillBranches = [];
    if (playerClass) {
      const classSkills = await prisma.classSkill.findMany({
        where: { classId: playerClass.id },
        include: { skill: true }
      });
      skillBranches = [...new Set(classSkills.map(cs => cs.branch))].filter(b => b !== 'General');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`📊 ${user.username}'s Profile`)
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: '⭐ Level', value: `${user.level}`, inline: true },
        { name: '📊 Experience', value: `${user.experience} XP`, inline: true },
        { name: '💰 Coins', value: `${user.coins}`, inline: true },
        { name: '📈 Progress to Next Level', value: `${currentLevelExp}/100 XP (${expToNextLevel} XP needed)`, inline: false }
      )
      .setTimestamp();
    
    // Add class information section
    if (user.playerClass) {
      const classInfo = await prisma.playerClass.findUnique({
        where: { name: user.playerClass }
      });
      
      if (classInfo) {
        embed.addFields(
          { 
            name: '🎭 Class Information', 
            value: `**${user.playerClass}**\n${classInfo.description}\n\n**Base Stats:**\nHP: ${classInfo.baseHp} (+${classInfo.hpPerLevel}/level)\nAttack: ${classInfo.baseAttack} (+${classInfo.attackPerLevel}/level)\nDefense: ${classInfo.baseDefense} (+${classInfo.defensePerLevel}/level)`, 
            inline: false 
          },
          { name: '⚔️ Skill Points', value: `${user.skillPoints || 0} available (${user.totalSkillPoints || 0} total)`, inline: true },
          { name: '🎯 Skills Learned', value: `${userSkills.length}`, inline: true },
          { name: '📅 Member Since', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`, inline: true }
        );
        
        // Add specialization info if user has selected a branch
        if (user.selectedBranch) {
          embed.addFields({
            name: '🌳 Specialization',
            value: `**${user.selectedBranch}** - Your chosen skill tree branch`,
            inline: false
          });
        }
      }
    } else {
      embed.addFields(
        { name: '🎭 Class', value: 'No class selected', inline: true },
        { name: '⚔️ Skill Points', value: `${user.skillPoints || 0} available (${user.totalSkillPoints || 0} total)`, inline: true },
        { name: '🎯 Skills Learned', value: `${userSkills.length}`, inline: true },
        { name: '📅 Member Since', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`, inline: true }
      );
    }
    
    // Show inventory items (top 5 most valuable)
    if (user.inventoryItems.length > 0) {
      const sortedItems = user.inventoryItems
        .sort((a, b) => (b.item.value * b.quantity) - (a.item.value * a.quantity))
        .slice(0, 5);
      
      const inventoryList = sortedItems.map(invItem => {
        return `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity} (${invItem.item.value * invItem.quantity} coins)`;
      }).join('\n');
      
      embed.addFields({ name: '💎 Top Items', value: inventoryList });
    }
    
    // Add combat stats if available
    if (userStats) {
      embed.addFields(
        { 
          name: '⚔️ Combat Stats', 
          value: `HP: ${userStats.total.hp}\nAttack: ${userStats.total.attack}\nDefense: ${userStats.total.defense}`, 
          inline: true 
        },
        { 
          name: '📊 Stat Breakdown', 
          value: `Base: ${userStats.base.hp} HP, ${userStats.base.attack} ATK, ${userStats.base.defense} DEF\nEquipment: +${equipmentBonuses.hpBonus || 0} HP, +${equipmentBonuses.attackBonus || 0} ATK, +${equipmentBonuses.defenseBonus || 0} DEF\nSkills: +${userStats.skills.hp} HP, +${userStats.skills.attack} ATK, +${userStats.skills.defense} DEF`, 
          inline: false 
        }
      );
    }

    // Add skill tree information
    if (skillBranches.length > 0) {
      const branchProgress = skillBranches.map(branch => {
        const branchSkills = userSkills.filter(us => {
          const classSkill = us.skill.classSkills?.find(cs => cs.branch === branch);
          return classSkill;
        });
        const isSelectedBranch = user.selectedBranch === branch;
        const canAccess = isSelectedBranch || user.level >= 25 || branchSkills.length >= 10;
        const status = isSelectedBranch ? '🎯' : (canAccess ? '✅' : '🔒');
        return `${status} **${branch}**: ${branchSkills.length} skills learned${isSelectedBranch ? ' (Selected)' : ''}`;
      }).join('\n');

      embed.addFields({
        name: '🌳 Skill Tree Progress',
        value: branchProgress || 'No skills learned yet',
        inline: false
      });
      
      // Add branch access info
      if (user.selectedBranch) {
        const selectedBranchSkills = userSkills.filter(us => {
          const classSkill = us.skill.classSkills?.find(cs => cs.branch === user.selectedBranch);
          return classSkill;
        });
        
        if (selectedBranchSkills.length < 10 && user.level < 25) {
          embed.addFields({
            name: '🔒 Branch Access',
            value: `You need **${10 - selectedBranchSkills.length} more points** in ${user.selectedBranch} or **level 25+** to access other branches.`,
            inline: false
          });
        } else if (user.level >= 25) {
          embed.addFields({
            name: '✅ Branch Access',
            value: 'You can now learn skills from any branch!',
            inline: false
          });
        }
      }
    }

    // Create buttons for skill tree navigation
    const buttons = [];
    
    // Add skill tree button
    buttons.push(
      new ButtonBuilder()
        .setCustomId('view_skill_tree')
        .setLabel('🌳 View Skill Tree')
        .setStyle(ButtonStyle.Secondary)
    );

    // Add equipment button
    buttons.push(
      new ButtonBuilder()
        .setCustomId('view_equipment')
        .setLabel('⚔️ View Equipment')
        .setStyle(ButtonStyle.Secondary)
    );

    // Add change class button
    buttons.push(
      new ButtonBuilder()
        .setCustomId('change_class')
        .setLabel('🎭 Change Class')
        .setStyle(ButtonStyle.Secondary)
    );

    const buttonRow = new ActionRowBuilder().addComponents(buttons);
    await interaction.editReply({ embeds: [embed], components: [buttonRow] });
  } catch (error) {
    console.error('Error showing user profile:', error);
    await interaction.editReply('❌ An error occurred while loading your profile.');
  }
}

async function showOtherUserProfile(interaction, user, targetUser) {
  try {
    // Get user stats including skills and equipment
    const userStats = await SkillSystem.calculateUserStats(user.id);
    const equipmentBonuses = await EquipmentSystem.calculateEquipmentBonuses(user.id);
      
      // Calculate experience progress
      const currentLevelExp = user.experience % 100;
      const expToNextLevel = 100 - currentLevelExp;
    
    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📊 ${user.username}'s Profile`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '⭐ Level', value: `${user.level}`, inline: true },
          { name: '📊 Experience', value: `${user.experience} XP`, inline: true },
          { name: '💰 Coins', value: `${user.coins}`, inline: true },
          { name: '📈 Progress to Next Level', value: `${currentLevelExp}/100 XP (${expToNextLevel} XP needed)`, inline: false },
          { name: '🎭 Class', value: `${user.playerClass || 'Adventurer'}`, inline: true },
        { name: '🎯 Skills Learned', value: `${userSkills.length}`, inline: true },
          { name: '📅 Member Since', value: `<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>`, inline: true }
        )
        .setTimestamp();
      
      // Show inventory items (top 5 most valuable)
      if (user.inventoryItems.length > 0) {
        const sortedItems = user.inventoryItems
          .sort((a, b) => (b.item.value * b.quantity) - (a.item.value * a.quantity))
          .slice(0, 5);
        
        const inventoryList = sortedItems.map(invItem => {
          return `${getItemEmoji(invItem.item.name, invItem.item.rarity)} **${invItem.item.name}** x${invItem.quantity} (${invItem.item.value * invItem.quantity} coins)`;
        }).join('\n');
        
        embed.addFields({ name: '💎 Top Items', value: inventoryList });
      }
      
      // Add combat stats if available
      if (userStats) {
        embed.addFields(
          { 
            name: '⚔️ Combat Stats', 
            value: `HP: ${userStats.total.hp}\nAttack: ${userStats.total.attack}\nDefense: ${userStats.total.defense}`, 
            inline: true 
          },
          { 
            name: '📊 Stat Breakdown', 
          value: `Base: ${userStats.base.hp} HP, ${userStats.base.attack} ATK, ${userStats.base.defense} DEF\nEquipment: +${equipmentBonuses.hpBonus || 0} HP, +${equipmentBonuses.attackBonus || 0} ATK, +${equipmentBonuses.defenseBonus || 0} DEF\nSkills: +${userStats.skills.hp} HP, +${userStats.skills.attack} ATK, +${userStats.skills.defense} DEF`, 
            inline: false 
          }
        );
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
    console.error('Error showing other user profile:', error);
    await interaction.editReply('❌ An error occurred while loading the profile.');
  }
    }