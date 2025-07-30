const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSkillEffects() {
  console.log('🔄 Updating skill effects to use proper percentage values...');

  try {
    // Update PASSIVE skills
    const passiveSkills = await prisma.skill.findMany({
      where: { type: 'PASSIVE' }
    });

    for (const skill of passiveSkills) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          baseEffect: 10.0, // 10% bonus
          effectPerLevel: 2.0 // +2% per level
        }
      });
    }

    // Update ACTIVE skills
    const activeSkills = await prisma.skill.findMany({
      where: { type: 'ACTIVE' }
    });

    for (const skill of activeSkills) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          baseEffect: 50.0, // 50% bonus
          effectPerLevel: 10.0 // +10% per level
        }
      });
    }

    // Update ULTIMATE skills
    const ultimateSkills = await prisma.skill.findMany({
      where: { type: 'ULTIMATE' }
    });

    for (const skill of ultimateSkills) {
      await prisma.skill.update({
        where: { id: skill.id },
        data: {
          baseEffect: 150.0, // 150% bonus
          effectPerLevel: 25.0 // +25% per level
        }
      });
    }

    console.log(`✅ Updated ${passiveSkills.length} passive skills`);
    console.log(`✅ Updated ${activeSkills.length} active skills`);
    console.log(`✅ Updated ${ultimateSkills.length} ultimate skills`);

    // Show some examples
    const examples = await prisma.skill.findMany({
      where: {
        name: {
          in: ['Void Pulse', 'Arcane Focus', 'Cataclysm']
        }
      }
    });

    console.log('\n📊 Example skill effects:');
    for (const skill of examples) {
      console.log(`   ${skill.name} (${skill.type}): ${skill.baseEffect}% + ${skill.effectPerLevel}% per level`);
    }

  } catch (error) {
    console.error('❌ Error updating skill effects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateSkillEffects().catch(console.error);
}

module.exports = { updateSkillEffects }; 