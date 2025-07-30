const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const prisma = require('./database');
const SkillSystem = require('./skill-system');

class TutorialSystem {
  /**
   * Check if user needs tutorial
   */
  static async needsTutorial(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    return !user || !user.tutorialCompleted;
  }

  /**
   * Start the tutorial for a new user
   */
  static async startTutorial(interaction, user) {
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🎮 Welcome to Relic Raider!')
      .setDescription(`**${interaction.user.username}**, welcome to your adventure!\n\nI'm here to guide you through the basics and help you choose your path as an adventurer.`)
      .addFields(
        {
          name: '🎯 What You\'ll Learn',
          value: '• How to explore and find treasures\n• How to choose your class and specialization\n• How to develop your character\n• How to craft powerful equipment',
          inline: false
        },
        {
          name: '⏱️ Duration',
          value: 'This tutorial will take about 2-3 minutes to complete.',
          inline: false
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp();

    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tutorial_start')
          .setLabel('🚀 Start Tutorial')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('tutorial_skip')
          .setLabel('⏭️ Skip Tutorial')
          .setStyle(ButtonStyle.Secondary)
      );

    return { embed, components: [button] };
  }

  /**
   * Show tutorial step 1: Basic exploration
   */
  static async showTutorialStep1(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('🔍 Step 1: Exploration Basics')
      .setDescription('Let\'s start with the foundation of your adventure - **exploration**!')
      .addFields(
        {
          name: '🗺️ How to Explore',
          value: '• This bot is primarily **button-focused** - use `/raid` for the main hub\n• From the hub, click **Explore** to search for treasures\n• You can also use `/explore` directly if you prefer commands\n• Each exploration costs energy\n• You\'ll find items, coins, and sometimes encounter beasts\n• Different zones have different loot and challenges',
          inline: false
        },
        {
          name: '💎 What You\'ll Find',
          value: '• **Common items**: Basic materials and coins\n• **Rare items**: Valuable crafting materials\n• **Relics**: Special items for advanced crafting\n• **Beasts**: Dangerous creatures that drop unique loot',
          inline: false
        },
        {
          name: '⚡ Energy System',
          value: '• You have limited energy per day\n• Energy regenerates over time\n• Use it wisely to maximize your gains',
          inline: false
        }
      )
      .setFooter({ text: 'Step 1 of 4' });

    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tutorial_step_2')
          .setLabel('➡️ Next: Classes')
          .setStyle(ButtonStyle.Primary)
      );

    return { embed, components: [button] };
  }

  /**
   * Show tutorial step 2: Class selection
   */
  static async showTutorialStep2(interaction) {
    const classes = await SkillSystem.getAllClasses();
    
    const embed = new EmbedBuilder()
      .setColor('#2196F3')
      .setTitle('🎭 Step 2: Choose Your Class')
      .setDescription('Now it\'s time to choose your character class! Each class has unique abilities and playstyles.')
      .addFields(
        {
          name: '📋 Available Classes',
          value: 'Below you\'ll see all available classes. Each has different base stats and skill trees.',
          inline: false
        }
      )
      .setFooter({ text: 'Step 2 of 4' });

    // Add class information
    for (let i = 0; i < classes.length; i++) {
      const playerClass = classes[i];
      const classSkills = await prisma.classSkill.findMany({
        where: { classId: playerClass.id },
        include: { skill: true }
      });
      const branches = [...new Set(classSkills.map(cs => cs.branch))].filter(b => b !== 'General');
      
      embed.addFields({
        name: `🎭 ${playerClass.name}`,
        value: `**${playerClass.description}**\n\n📊 **Base Stats:**\n• **HP:** ${playerClass.baseHp} (+${playerClass.hpPerLevel}/level)\n• **Attack:** ${playerClass.baseAttack} (+${playerClass.attackPerLevel}/level)\n• **Defense:** ${playerClass.baseDefense} (+${playerClass.defensePerLevel}/level)\n\n🌳 **Skill Branches:**\n${branches.map(b => `• **${b}**`).join('\n')}`,
        inline: false
      });
      
      // Add divider between classes (except after the last one)
      if (i < classes.length - 1) {
        embed.addFields({
          name: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '',
          inline: false
        });
      }
    }

    // Create class selection buttons
    const buttons = [];
    for (const playerClass of classes) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`tutorial_class_${playerClass.name}`)
          .setLabel(`Choose ${playerClass.name}`)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const buttonRow = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
    return { embed, components: [buttonRow] };
  }

  /**
   * Show tutorial step 3: Skill branch selection
   */
  static async showTutorialStep3(interaction, className) {
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: className }
    });

    if (!playerClass) {
      throw new Error('Class not found');
    }

    const classSkills = await prisma.classSkill.findMany({
      where: { classId: playerClass.id },
      include: { skill: true }
    });

    const branches = [...new Set(classSkills.map(cs => cs.branch))].filter(b => b !== 'General');
    
    const embed = new EmbedBuilder()
      .setColor('#9C27B0')
      .setTitle(`🌳 Step 3: Choose Your Specialization`)
      .setDescription(`**${className}** - Now choose your primary skill branch!`)
      .addFields(
        {
          name: '📊 Skill Point System',
          value: '• You earn 2 skill points every 5 levels\n• By level 100, you\'ll have 40 skill points\n• This allows you to master 2 full branches OR parts of 3 branches\n• Choose wisely - your specialization defines your playstyle!',
          inline: false
        },
        {
          name: '🎯 Available Branches',
          value: 'Below are the skill branches available to your class. Each branch focuses on different abilities and strategies.',
          inline: false
        }
      )
      .setFooter({ text: 'Step 3 of 4' });

    // Add branch information
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      const branchSkills = classSkills.filter(cs => cs.branch === branch);
      const totalCost = branchSkills.reduce((sum, cs) => sum + (cs.skill.requiredLevel || 1), 0);
      
      embed.addFields({
        name: `🌳 ${branch}`,
        value: `**${branchSkills.length} skills available** • **~${totalCost} total skill points**\n\n🎯 **Sample Skills:**\n${branchSkills.slice(0, 3).map(cs => `• **${cs.skill.name}:** ${cs.skill.description}`).join('\n')}${branchSkills.length > 3 ? '\n• **... and more!**' : ''}\n\n💡 **Branch Focus:** ${getBranchFocus(branch)}`,
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

    // Create branch selection buttons
    const buttons = [];
    for (const branch of branches) {
      buttons.push(
        new ButtonBuilder()
          .setCustomId(`tutorial_branch_${className}_${branch}`)
          .setLabel(`Choose ${branch}`)
          .setStyle(ButtonStyle.Primary)
      );
    }

    // Add back button to return to class selection
    buttons.push(
      new ButtonBuilder()
        .setCustomId('tutorial_back_to_classes')
        .setLabel('🔙 Back to Classes')
        .setStyle(ButtonStyle.Secondary)
    );

    const buttonRow = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
    return { embed, components: [buttonRow] };
  }

  /**
   * Show tutorial step 4: Completion and next steps
   */
  static async showTutorialStep4(interaction, className, selectedBranch) {
    const embed = new EmbedBuilder()
      .setColor('#FF9800')
      .setTitle('🎉 Tutorial Complete!')
      .setDescription(`**${interaction.user.username}**, congratulations! You're now a **${className}** specializing in **${selectedBranch}**!`)
      .addFields(
        {
          name: '🎭 Your Character',
          value: `**Class:** ${className}\n**Specialization:** ${selectedBranch}\n**Level:** 1\n**Skill Points:** 0 (earn more by leveling up!)`,
          inline: true
        },
        {
          name: '🎯 Next Steps',
          value: '• Use `/explore` to start your adventure\n• Use `/profile` to view your character\n• Use `/skills tree` to see your skill tree\n• Use `/skills learn <skill_name>` when you have points',
          inline: true
        },
        {
          name: '📚 Key Commands',
          value: '• `/explore` - Search for treasures\n• `/profile` - View character info\n• `/skills` - Manage skills and class\n• `/equipment` - View and craft gear\n• `/shop` - Buy items and upgrades',
          inline: false
        },
        {
          name: '🌟 Pro Tips',
          value: '• Focus on your chosen branch first\n• Save skill points for higher-level abilities\n• Explore regularly to earn experience and items\n• Craft gear that complements your class\n• Join raids and boss fights for rare loot!',
          inline: false
        }
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .setFooter({ text: 'Welcome to Relic Raider!' });

    const button = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tutorial_complete')
          .setLabel('🚀 Start Adventure!')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('tutorial_explore')
          .setLabel('🗺️ Explore Now')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('tutorial_hub')
          .setLabel('🏠 Open Hub')
          .setStyle(ButtonStyle.Primary)
      );

    const button2 = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('tutorial_restart')
          .setLabel('🔄 Restart Tutorial')
          .setStyle(ButtonStyle.Secondary)
      );

    return { embed, components: [button, button2] };
  }

  /**
   * Complete the tutorial and set up the user
   */
  static async completeTutorial(userId, className, selectedBranch) {
    try {
      // Update user with class and tutorial completion
      await prisma.user.update({
        where: { id: userId },
        data: {
          playerClass: className,
          selectedBranch: selectedBranch,
          tutorialCompleted: true,
          skillPoints: 0, // Start with 0, earn through leveling
          totalSkillPoints: 0
        }
      });

      return {
        success: true,
        message: 'Tutorial completed successfully!'
      };
    } catch (error) {
      console.error('Error completing tutorial:', error);
      return {
        success: false,
        message: 'Failed to complete tutorial'
      };
    }
  }

  /**
   * Skip tutorial (for experienced players)
   */
  static async skipTutorial(userId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          tutorialCompleted: true
        }
      });

      return {
        success: true,
        message: 'Tutorial skipped'
      };
    } catch (error) {
      console.error('Error skipping tutorial:', error);
      return {
        success: false,
        message: 'Failed to skip tutorial'
      };
    }
  }

  /**
   * Get tutorial progress for a user
   */
  static async getTutorialProgress(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { completed: false, step: 0 };
    }

    if (user.tutorialCompleted) {
      return { 
        completed: true, 
        class: user.playerClass, 
        branch: user.selectedBranch 
      };
    }

    return { completed: false, step: 0 };
  }
}

// Helper function to get branch focus description
function getBranchFocus(branch) {
  const branchFocuses = {
    // Paladin branches
    "Guardian's Oath": "Defensive tanking and protection abilities",
    "Crusader's Fury": "Offensive holy damage and boss slaying",
    "Lightbound Path": "Healing, support, and utility abilities",
    
    // Rogue branches
    "Shadow Dance": "Stealth, mobility, and evasion",
    "Venomcraft": "Poison damage and debuff abilities",
    "Dagger Arts": "Precision strikes and critical damage",
    
    // Hunter branches
    "Wild Precision": "Ranged combat and accuracy",
    "Beast Mastery": "Beast hunting and animal companions",
    "Trapcraft": "Traps, crowd control, and utility",
    
    // Mage branches
    "Elementalism": "Elemental damage and area effects",
    "Runeweaving": "Magical enhancement and buffs",
    "Chronomancy": "Time manipulation and control"
  };
  
  return branchFocuses[branch] || "Specialized abilities and unique playstyle";
}

module.exports = TutorialSystem; 