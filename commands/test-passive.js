const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('testpassive')
    .setDescription('Test your passive skills and see their effects'),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const userId = interaction.user.id;
      const user = await prisma.user.findUnique({
        where: { discordId: userId }
      });

      if (!user) {
        return interaction.editReply('❌ User not found.');
      }

      // Get user's passive skills
      const userSkills = await prisma.userSkill.findMany({
        where: { 
          userId: user.id,
          skill: {
            type: 'PASSIVE'
          }
        },
        include: {
          skill: true
        }
      });

      if (userSkills.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('🔍 Passive Skills Test')
          .setDescription('You have no passive skills learned yet.')
          .addFields({
            name: '💡 How to get passive skills',
            value: 'Use `/skills` to view and learn passive skills from your class skill tree.',
            inline: false
          });

        return interaction.editReply({ embeds: [embed] });
      }

      // Test the battle skill effects system
      const SkillSystem = require('../lib/skill-system');
      const skillEffects = await SkillSystem.getBattleSkillEffects(user.id);

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🔍 Passive Skills Test')
        .setDescription(`Testing passive skills for **${user.username}** (Level ${user.level})`)
        .addFields({
          name: '📚 Your Passive Skills',
          value: userSkills.map(us => {
            const skill = us.skill;
            const effect = skill.baseEffect + (skill.effectPerLevel * (us.level - 1));
            return `• **${skill.name}** (${us.level}/${skill.maxLevel}) - ${skill.category}\n  └ ${skill.description}\n  └ Effect: ${effect * 100}%`;
          }).join('\n\n'),
          inline: false
        });

      // Test battle effects
      if (skillEffects.passiveBonuses && Object.keys(skillEffects.passiveBonuses).length > 0) {
        embed.addFields({
          name: '⚔️ Battle Effects',
          value: Object.entries(skillEffects.passiveBonuses).map(([name, effect]) => 
            `• **${name}**: ${effect * 100}% effect`
          ).join('\n'),
          inline: false
        });
      } else {
        embed.addFields({
          name: '⚔️ Battle Effects',
          value: 'No passive skills are active in battle.',
          inline: false
        });
      }

      // Test specific skills
      const testResults = [];
      
      if (skillEffects.passiveBonuses['Radiant Shield']) {
        testResults.push('✅ **Radiant Shield** - Will heal when defending');
      } else {
        testResults.push('❌ **Radiant Shield** - Not found in battle effects');
      }

      if (skillEffects.passiveBonuses['Sanctified Armor']) {
        testResults.push('✅ **Sanctified Armor** - Will regenerate HP each turn');
      } else {
        testResults.push('❌ **Sanctified Armor** - Not found in battle effects');
      }

      if (skillEffects.passiveBonuses['Smite']) {
        testResults.push('✅ **Smite** - Will add bonus damage vs bosses');
      } else {
        testResults.push('❌ **Smite** - Not found in battle effects');
      }

      if (skillEffects.passiveBonuses['Bulwark']) {
        testResults.push('✅ **Bulwark** - Will reduce damage when HP < 30%');
      } else {
        testResults.push('❌ **Bulwark** - Not found in battle effects');
      }

      embed.addFields({
        name: '🧪 Test Results',
        value: testResults.join('\n'),
        inline: false
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error testing passive skills:', error);
      await interaction.editReply('❌ An error occurred while testing passive skills.');
    }
  }
}; 