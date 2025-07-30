const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPassiveSkills() {
  try {
    // Replace with your Discord ID
    const discordId = 'YOUR_DISCORD_ID'; // You'll need to replace this
    
    console.log('🔍 Testing Passive Skills System...\n');
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { discordId: discordId }
    });
    
    if (!user) {
      console.log('❌ User not found. Please replace YOUR_DISCORD_ID with your actual Discord ID');
      return;
    }
    
    console.log(`👤 User: ${user.username} (Level ${user.level})`);
    console.log(`🎭 Class: ${user.playerClass}`);
    console.log(`🌳 Selected Branch: ${user.selectedBranch}\n`);
    
    // Get user's learned skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: user.id },
      include: { skill: true }
    });
    
    console.log('📚 Learned Skills:');
    for (const userSkill of userSkills) {
      const skill = userSkill.skill;
      console.log(`  • ${skill.name} (${userSkill.level}/${skill.maxLevel}) - ${skill.type} - ${skill.category}`);
      console.log(`    Description: ${skill.description}`);
      console.log(`    Base Effect: ${skill.baseEffect}, Effect Per Level: ${skill.effectPerLevel}`);
      console.log(`    Current Effect: ${skill.baseEffect + (skill.effectPerLevel * (userSkill.level - 1))}`);
      console.log('');
    }
    
    // Test the battle skill effects system
    const SkillSystem = require('./lib/skill-system');
    const skillEffects = await SkillSystem.getBattleSkillEffects(user.id);
    
    console.log('⚔️ Battle Skill Effects:');
    console.log('Passive Bonuses:', skillEffects.passiveBonuses);
    console.log('Active Skills:', skillEffects.activeSkills.length);
    console.log('Ultimate Skill:', skillEffects.ultimateSkill ? skillEffects.ultimateSkill.name : 'None');
    
    // Test specific passive skills
    if (skillEffects.passiveBonuses['Radiant Shield']) {
      console.log('\n✅ Radiant Shield found with effect:', skillEffects.passiveBonuses['Radiant Shield']);
    } else {
      console.log('\n❌ Radiant Shield not found in passive bonuses');
    }
    
    if (skillEffects.passiveBonuses['Sanctified Armor']) {
      console.log('✅ Sanctified Armor found with effect:', skillEffects.passiveBonuses['Sanctified Armor']);
    } else {
      console.log('❌ Sanctified Armor not found in passive bonuses');
    }
    
    if (skillEffects.passiveBonuses['Smite']) {
      console.log('✅ Smite found with effect:', skillEffects.passiveBonuses['Smite']);
    } else {
      console.log('❌ Smite not found in passive bonuses');
    }
    
  } catch (error) {
    console.error('❌ Error testing passive skills:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPassiveSkills(); 