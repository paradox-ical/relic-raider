const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDamageCalculation() {
  console.log('🧪 Testing Damage Calculation Formula\n');

  try {
    // Get Void Pulse skill
    const voidPulse = await prisma.skill.findUnique({
      where: { name: 'Void Pulse' }
    });

    if (!voidPulse) {
      console.log('❌ Void Pulse skill not found');
      return;
    }

    console.log(`📊 Void Pulse (Level 1):`);
    console.log(`   Base Effect: ${voidPulse.baseEffect}%`);
    console.log(`   Effect Per Level: ${voidPulse.effectPerLevel}%`);
    
    const level1Effect = voidPulse.baseEffect + (voidPulse.effectPerLevel * (1 - 1));
    const level2Effect = voidPulse.baseEffect + (voidPulse.effectPerLevel * (2 - 1));
    const level3Effect = voidPulse.baseEffect + (voidPulse.effectPerLevel * (3 - 1));
    
    console.log(`   Level 1 Effect: ${level1Effect}%`);
    console.log(`   Level 2 Effect: ${level2Effect}%`);
    console.log(`   Level 3 Effect: ${level3Effect}%`);

    // Test damage calculation with different player stats
    const testCases = [
      { playerAttack: 100, beastDefense: 10, level: 1, description: 'Low Level Player' },
      { playerAttack: 500, beastDefense: 50, level: 1, description: 'Mid Level Player' },
      { playerAttack: 1000, beastDefense: 100, level: 1, description: 'High Level Player' },
      { playerAttack: 100, beastDefense: 10, level: 3, description: 'Low Level Player (Level 3 Skill)' }
    ];

    console.log('\n⚔️ Damage Calculation Examples:');
    console.log('=' .repeat(60));

    for (const testCase of testCases) {
      const baseDamage = Math.max(1, testCase.playerAttack - testCase.beastDefense);
      const skillEffect = voidPulse.baseEffect + (voidPulse.effectPerLevel * (testCase.level - 1));
      const damageBonus = Math.floor(baseDamage * (skillEffect / 100));
      const damage = Math.floor(baseDamage + damageBonus + Math.random() * 5);

      console.log(`\n${testCase.description}:`);
      console.log(`   Player Attack: ${testCase.playerAttack}`);
      console.log(`   Beast Defense: ${testCase.beastDefense}`);
      console.log(`   Skill Level: ${testCase.level}`);
      console.log(`   Skill Effect: ${skillEffect}%`);
      console.log(`   Base Damage: ${baseDamage}`);
      console.log(`   Damage Bonus: ${damageBonus}`);
      console.log(`   Total Damage: ${damage}`);
      
      // Calculate old formula for comparison
      const oldDamage = Math.floor(baseDamage * skillEffect + Math.random() * 5);
      console.log(`   Old Formula Damage: ${oldDamage}`);
      console.log(`   Damage Reduction: ${Math.floor(((oldDamage - damage) / oldDamage) * 100)}%`);
    }

    // Test with Arcane Focus passive
    console.log('\n🔮 Testing with Arcane Focus Passive:');
    const arcaneFocus = await prisma.skill.findUnique({
      where: { name: 'Arcane Focus' }
    });

    if (arcaneFocus) {
      const passiveEffect = arcaneFocus.baseEffect + (arcaneFocus.effectPerLevel * (2 - 1)); // Level 2
      console.log(`   Arcane Focus (Level 2): ${passiveEffect}% magic damage bonus`);
      
      const testCase = { playerAttack: 500, beastDefense: 50, level: 1 };
      const baseDamage = Math.max(1, testCase.playerAttack - testCase.beastDefense);
      const skillEffect = voidPulse.baseEffect + (voidPulse.effectPerLevel * (testCase.level - 1));
      const totalEffect = skillEffect + passiveEffect; // Combined effect
      const damageBonus = Math.floor(baseDamage * (totalEffect / 100));
      const damage = Math.floor(baseDamage + damageBonus + Math.random() * 5);

      console.log(`   Combined Effect: ${skillEffect}% + ${passiveEffect}% = ${totalEffect}%`);
      console.log(`   Total Damage with Passive: ${damage}`);
    }

  } catch (error) {
    console.error('❌ Error testing damage calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testDamageCalculation().catch(console.error);
}

module.exports = { testDamageCalculation }; 