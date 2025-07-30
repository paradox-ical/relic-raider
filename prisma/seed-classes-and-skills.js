const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function main() {
  console.log('🎭 Seeding classes and skill trees...');

  // Define the four main classes
    const classes = [
      {
      name: 'Paladin',
      description: 'Holy warriors who excel at defense and support. Masters of protection and divine magic.',
        baseHp: 120,
        baseAttack: 12,
        baseDefense: 8,
        hpPerLevel: 12,
        attackPerLevel: 2,
      defensePerLevel: 1.5
      },
      {
      name: 'Rogue',
      description: 'Stealthy assassins who rely on speed, precision, and deadly poisons.',
      baseHp: 90,
        baseAttack: 15,
      baseDefense: 4,
        hpPerLevel: 8,
        attackPerLevel: 3,
      defensePerLevel: 0.5
      },
      {
      name: 'Hunter',
      description: 'Skilled hunters who excel at beast hunting and precision combat.',
        baseHp: 100,
      baseAttack: 14,
      baseDefense: 6,
        hpPerLevel: 10,
      attackPerLevel: 2.5,
        defensePerLevel: 1
      },
      {
      name: 'Mage',
      description: 'Powerful spellcasters who wield destructive magic and mystical abilities.',
      baseHp: 80,
      baseAttack: 18,
      baseDefense: 3,
      hpPerLevel: 6,
      attackPerLevel: 3.5,
      defensePerLevel: 0.5
      }
    ];

    // Create classes
    for (const classData of classes) {
      await prisma.playerClass.upsert({
        where: { name: classData.name },
        update: classData,
        create: classData
      });
  }

  console.log('✅ Classes created successfully!');

  // Read and parse skill tree CSV files
  const skillTreeFiles = [
    'Revised_Paladin_Skill_Tree__Solo_Combat_.csv',
    'Rogue_Skill_Tree__Solo_Combat_.csv',
    'Hunter_Skill_Tree__Solo_Combat_.csv',
    'Mage_Skill_Tree__Solo_Combat_.csv'
  ];

  const allSkills = [];

  for (const filename of skillTreeFiles) {
    const filePath = path.join(__dirname, '..', 'skilltree', filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').slice(1); // Skip header

    for (const line of lines) {
      if (line.trim()) {
        // Use a more robust CSV parsing that handles commas in descriptions
        const parts = line.split(',');
        if (parts.length >= 5) {
          const className = parts[0].trim();
          const branch = parts[1].trim();
          const skillName = parts[2].trim();
          const type = parts[3].trim().toUpperCase();
          const description = parts.slice(4).join(',').trim(); // Join remaining parts for description
          
          allSkills.push({
            className,
            branch,
            skillName,
            type,
            description
          });
        }
      }
    }
    }

    // Create skills
  for (const skillData of allSkills) {
    // Determine skill category based on branch
    let category = 'COMBAT';
    if (skillData.branch.includes('Guardian') || skillData.branch.includes('Lightbound')) {
      category = 'UTILITY';
    } else if (skillData.branch.includes('Beast') || skillData.branch.includes('Trapcraft')) {
      category = 'EXPLORATION';
    }

    // Determine base effect and effect per level based on skill type and description
    let baseEffect = 1.0;
    let effectPerLevel = 0.2;
    let energyCost = 0;
    let cooldown = 0;
    let requiredLevel = 1;

    // Set specific values based on skill type and description
    if (skillData.type === 'PASSIVE') {
      baseEffect = 1.0;
      effectPerLevel = 0.1;
      energyCost = 0;
      cooldown = 0;
    } else if (skillData.type === 'ACTIVE') {
      baseEffect = 1.5;
      effectPerLevel = 0.2;
      energyCost = 25;
      cooldown = 3;
      requiredLevel = 10;
    } else if (skillData.type === 'ULTIMATE') {
      baseEffect = 3.0;
      effectPerLevel = 0.5;
      energyCost = 100;
      cooldown = 8;
      requiredLevel = 25;
    }

    // Create the skill
    const skill = await prisma.skill.upsert({
      where: { name: skillData.skillName },
      update: {
        description: skillData.description,
        type: skillData.type,
        category: category,
        baseEffect: baseEffect,
        effectPerLevel: effectPerLevel,
        energyCost: energyCost,
        cooldown: cooldown,
        requiredLevel: requiredLevel
      },
      create: {
        name: skillData.skillName,
        description: skillData.description,
        type: skillData.type,
        category: category,
        baseEffect: baseEffect,
        effectPerLevel: effectPerLevel,
        energyCost: energyCost,
        cooldown: cooldown,
        requiredLevel: requiredLevel
      }
    });

    // Get the class
      const playerClass = await prisma.playerClass.findUnique({
      where: { name: skillData.className }
      });

    if (playerClass) {
      // Create class-skill relationship
        await prisma.classSkill.upsert({
          where: {
            classId_skillId: {
              classId: playerClass.id,
              skillId: skill.id
            }
          },
          update: {},
          create: {
            classId: playerClass.id,
            skillId: skill.id,
          branch: skillData.branch,
          unlockLevel: requiredLevel
          }
        });
    }
  }

  console.log('✅ Skills and class relationships created successfully!');
  console.log(`📊 Created ${allSkills.length} skills across 4 classes`);

  // Display summary
  for (const classData of classes) {
    const playerClass = await prisma.playerClass.findUnique({
      where: { name: classData.name }
    });
    
    if (playerClass) {
      const classSkills = await prisma.classSkill.findMany({
        where: {
          classId: playerClass.id
        },
        include: {
          skill: true
  }
      });

          const branches = [...new Set(classSkills.map(cs => cs.branch))];
      console.log(`\n${classData.name}:`);
      console.log(`  - ${classSkills.length} skills`);
      console.log(`  - ${branches.length} branches: ${branches.join(', ')}`);
    }
  }

  console.log('\n🎉 Class and skill tree system seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding classes and skills:', e);
      process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 