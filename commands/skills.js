const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const SkillSystem = require('../lib/skill-system');
const prisma = require('../lib/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skills')
    .setDescription('Manage your character class and skills')
    .addSubcommand(subcommand =>
      subcommand
        .setName('class')
        .setDescription('View or change your character class')
        .addStringOption(option =>
          option.setName('class_name')
            .setDescription('Name of the class to change to (optional)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('tree')
        .setDescription('View your skill tree and branches')
        .addStringOption(option =>
          option.setName('branch')
            .setDescription('Specific branch to view (optional)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('View your current skills and available skills'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('learn')
        .setDescription('Learn or upgrade a skill')
        .addStringOption(option =>
          option.setName('skill_name')
            .setDescription('Name of the skill to learn/upgrade')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const userId = interaction.user.id;

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { discordId: userId }
    });

    if (!user) {
      return interaction.reply({
        content: '❌ You need to start playing first! Use `/raid` to begin your adventure.',
        ephemeral: true
      });
    }

    switch (subcommand) {
      case 'class':
        await handleClassCommand(interaction, user);
        break;
      case 'tree':
        await handleSkillTree(interaction, user);
        break;
      case 'list':
        await handleListSkills(interaction, user);
        break;
      case 'learn':
        await handleLearnSkill(interaction, user);
        break;
    }
  }
};

async function handleClassCommand(interaction, user) {
  try {
    const className = interaction.options.getString('class_name');

    if (!className) {
      // Show available classes
      const classes = await SkillSystem.getAllClasses();
      
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🎭 Character Classes')
        .setDescription(`Your current class: **${user.playerClass || 'Adventurer'}**\n\nChoose a class to specialize your character:`);

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
        name: '📋 How to Change Class',
        value: 'Use `/skills class [class_name]` to change your class\nUse `/skills tree` to view your skill tree\nUse `/skills list` to view available skills for your class',
        inline: false
      });

      const buttons = [];
      for (const playerClass of classes) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`change_class_${playerClass.name}`)
            .setLabel(`Choose ${playerClass.name}`)
            .setStyle(ButtonStyle.Primary)
        );
      }

      const buttonRow = new ActionRowBuilder().addComponents(buttons.slice(0, 5));
      await interaction.reply({ embeds: [embed], components: [buttonRow], ephemeral: true });
    } else {
      // Change class
      const result = await SkillSystem.changeClass(user.id, className);

      if (result.success) {
        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🎭 Class Changed!')
          .setDescription(result.message)
          .addFields({
            name: '📊 New Base Stats',
            value: `HP: ${result.class.baseHp} (+${result.class.hpPerLevel}/level)\nAttack: ${result.class.baseAttack} (+${result.class.attackPerLevel}/level)\nDefense: ${result.class.baseDefense} (+${result.class.defensePerLevel}/level)`,
            inline: true
          })
          .addFields({
            name: '🎯 Next Steps',
            value: 'Use `/skills tree` to view your skill tree\nUse `/skills list` to see available skills\nUse `/skills learn [skill_name]` to learn skills',
            inline: true
          });

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({
          content: `❌ ${result.message}`,
          ephemeral: true
        });
      }
    }
  } catch (error) {
    console.error('Error handling class command:', error);
    await interaction.reply({
      content: '❌ An error occurred while handling the class command.',
      ephemeral: true
    });
  }
}

async function handleSkillTree(interaction, user) {
  try {
    const branchName = interaction.options.getString('branch');
    const userClass = user.playerClass || 'Adventurer';

    if (userClass === 'Adventurer') {
      return interaction.reply({
        content: '❌ You need to choose a class first! Use `/skills class` to select your class.',
        ephemeral: true
      });
    }

    // Get the player class
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: userClass }
    });

    if (!playerClass) {
      return interaction.reply({
        content: '❌ Class not found. Please contact an administrator.',
        ephemeral: true
      });
    }

    // Get all skills for this class
    const classSkills = await prisma.classSkill.findMany({
      where: { classId: playerClass.id },
      include: { skill: true },
      orderBy: [
        { branch: 'asc' },
        { unlockLevel: 'asc' },
        { skill: { name: 'asc' } }
      ]
    });

    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });

    const userSkillMap = new Map(userSkills.map(us => [us.skillId, us.level]));

    if (branchName) {
      // Show specific branch
      const branchSkills = classSkills.filter(cs => cs.branch === branchName);
      
      if (branchSkills.length === 0) {
        return interaction.reply({
          content: `❌ Branch "${branchName}" not found for ${userClass}. Use \`/skills tree\` to see available branches.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle(`🌳 ${userClass} - ${branchName}`)
        .setDescription(`Skill tree branch for **${userClass}**`);

      // Group skills by type
      const passiveSkills = branchSkills.filter(cs => cs.skill.type === 'PASSIVE');
      const activeSkills = branchSkills.filter(cs => cs.skill.type === 'ACTIVE');
      const ultimateSkills = branchSkills.filter(cs => cs.skill.type === 'ULTIMATE');

      if (passiveSkills.length > 0) {
        const passiveList = passiveSkills.map(cs => {
          const userLevel = userSkillMap.get(cs.skillId) || 0;
          const status = userLevel > 0 ? `✅ Lv.${userLevel}` : `🔒 Lv.${cs.unlockLevel}+`;
          return `${status} **${cs.skill.name}** - ${cs.skill.description}`;
        }).join('\n');
        
        embed.addFields({
          name: '🛡️ Passive Skills',
          value: passiveList,
          inline: false
        });
      }

      if (activeSkills.length > 0) {
        const activeList = activeSkills.map(cs => {
          const userLevel = userSkillMap.get(cs.skillId) || 0;
          const status = userLevel > 0 ? `✅ Lv.${userLevel}` : `🔒 Lv.${cs.unlockLevel}+`;
          return `${status} **${cs.skill.name}** - ${cs.skill.description}`;
        }).join('\n');
        
        embed.addFields({
          name: '⚔️ Active Skills',
          value: activeList,
          inline: false
        });
      }

      if (ultimateSkills.length > 0) {
        const ultimateList = ultimateSkills.map(cs => {
          const userLevel = userSkillMap.get(cs.skillId) || 0;
          const status = userLevel > 0 ? `✅ Lv.${userLevel}` : `🔒 Lv.${cs.unlockLevel}+`;
          return `${status} **${cs.skill.name}** - ${cs.skill.description}`;
        }).join('\n');
        
        embed.addFields({
          name: '🌟 Ultimate Skills',
          value: ultimateList,
          inline: false
        });
      }

      embed.setFooter({ text: 'Use /skills learn <skill_name> to learn skills' });

      return interaction.reply({ embeds: [embed] });
    } else {
      // Show all branches
      const branches = [...new Set(classSkills.map(cs => cs.branch))].filter(b => b !== 'General');
      
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle(`🌳 ${userClass} Skill Tree`)
        .setDescription(`Your skill tree branches for **${userClass}**`);

      for (const branch of branches) {
        const branchSkills = classSkills.filter(cs => cs.branch === branch);
        const learnedCount = branchSkills.filter(cs => userSkillMap.has(cs.skillId)).length;
        const totalCount = branchSkills.length;
        
        embed.addFields({
          name: `🌿 ${branch}`,
          value: `${learnedCount}/${totalCount} skills learned\nUse \`/skills tree ${branch}\` to view details`,
          inline: true
        });
      }

      embed.addFields({
        name: '📊 Skill Points',
        value: `Available: ${user.skillPoints || 0}\nTotal Learned: ${userSkills.length}`,
        inline: false
      });

      embed.setFooter({ text: 'Use /skills tree <branch> to view specific branches' });

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error handling skill tree:', error);
    return interaction.reply({
      content: '❌ An error occurred while viewing the skill tree.',
      ephemeral: true
    });
  }
}

async function handleListSkills(interaction, user) {
  try {
    const userSkills = await SkillSystem.getUserSkills(user.id);
    const availableSkills = await SkillSystem.getAvailableSkills(user.id);

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🎯 Skills Overview')
      .setDescription(`**${interaction.user.username}**'s Skills`);

    if (userSkills.length === 0) {
      embed.addFields({
        name: '📚 Learned Skills',
        value: 'You haven\'t learned any skills yet!\n\n**To get started:**\n• Choose a class with `/skills class`\n• View your skill tree with `/skills tree`\n• Learn skills with `/skills learn [skill_name]`',
        inline: false
      });
    } else {
      // Group skills by type
      const passiveSkills = userSkills.filter(us => us.skill.type === 'PASSIVE');
      const activeSkills = userSkills.filter(us => us.skill.type === 'ACTIVE');
      const ultimateSkills = userSkills.filter(us => us.skill.type === 'ULTIMATE');

      if (passiveSkills.length > 0) {
        const passiveList = passiveSkills.map(us => `**${us.skill.name}** (Lv.${us.level}) - ${us.skill.description}`).join('\n');
        embed.addFields({
          name: `🛡️ Passive Skills (${passiveSkills.length})`,
          value: passiveList,
          inline: false
        });
      }

      if (activeSkills.length > 0) {
        const activeList = activeSkills.map(us => `**${us.skill.name}** (Lv.${us.level}) - ${us.skill.description}`).join('\n');
        embed.addFields({
          name: `⚔️ Active Skills (${activeSkills.length})`,
          value: activeList,
          inline: false
        });
      }

      if (ultimateSkills.length > 0) {
        const ultimateList = ultimateSkills.map(us => `**${us.skill.name}** (Lv.${us.level}) - ${us.skill.description}`).join('\n');
        embed.addFields({
          name: `🌟 Ultimate Skills (${ultimateSkills.length})`,
          value: ultimateList,
          inline: false
        });
      }
    }

    if (availableSkills.length > 0) {
      const availableList = availableSkills.slice(0, 5).map(skill => 
        `**${skill.name}** (Lv.${skill.requiredLevel}) - ${skill.description}`
      ).join('\n');
      
      embed.addFields({
        name: `🔓 Available Skills (${availableSkills.length})`,
        value: availableList + (availableSkills.length > 5 ? '\n*... and more*' : ''),
        inline: false
      });
    }

    embed.addFields({
      name: '📊 Skill Points',
      value: `Available: ${user.skillPoints || 0}\nTotal Learned: ${userSkills.length}`,
      inline: false
    });

    embed.setFooter({ text: 'Use /skills learn <skill_name> to learn skills' });

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error listing skills:', error);
    await interaction.reply({
      content: '❌ An error occurred while listing skills.',
      ephemeral: true
    });
  }
}

async function handleLearnSkill(interaction, user) {
  try {
    const skillName = interaction.options.getString('skill_name');
    
    // Find the skill
    const skill = await prisma.skill.findFirst({
      where: {
        name: {
          contains: skillName,
          mode: 'insensitive'
        }
      }
    });

    if (!skill) {
      return interaction.reply({
        content: `❌ Skill "${skillName}" not found. Use \`/skills tree\` to see available skills.`,
        ephemeral: true
      });
    }

    // Check if user can learn this skill
    const canLearn = await SkillSystem.canLearnSkill(user.id, skill.id);
    
    if (!canLearn.success) {
      return interaction.reply({
        content: `❌ ${canLearn.message}`,
        ephemeral: true
      });
    }

    // Learn the skill
    const result = await SkillSystem.learnSkill(user.id, skill.id);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎯 Skill Learned!')
        .setDescription(result.message)
        .addFields({
          name: '📋 Skill Details',
          value: `**${skill.name}**\nType: ${skill.type}\nCategory: ${skill.category}\nDescription: ${skill.description}`,
          inline: false
        })
        .addFields({
          name: '📊 Effect',
          value: `Base: ${skill.baseEffect}\nPer Level: +${skill.effectPerLevel}`,
          inline: true
        });

      if (skill.energyCost > 0) {
        embed.addFields({
          name: '⚡ Cost & Cooldown',
          value: `Energy: ${skill.energyCost}\nCooldown: ${skill.cooldown}s`,
          inline: true
        });
      }

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error learning skill:', error);
    await interaction.reply({
      content: '❌ An error occurred while learning the skill.',
      ephemeral: true
    });
  }
} 