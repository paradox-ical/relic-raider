const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EquipmentSystem = require('../lib/equipment-system');
const CraftingSystem = require('../lib/crafting-system');
const prisma = require('../lib/database');
const { getItemEmoji } = require('../lib/emoji-config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('equipment')
    .setDescription('Manage your equipment and gear')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View your equipped gear'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('equip')
        .setDescription('Equip a gear set')
        .addStringOption(option =>
          option.setName('gear_name')
            .setDescription('Name of the gear set to equip')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('unequip')
        .setDescription('Unequip your current gear')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('Type of gear to unequip')
            .setRequired(true)
            .addChoices(
              { name: 'Armor', value: 'ARMOR' },
              { name: 'Weapon', value: 'WEAPON' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('inventory')
        .setDescription('View your equipment inventory'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('sets')
        .setDescription('View available gear sets for your class')
        .addStringOption(option =>
          option.setName('rarity')
            .setDescription('Filter by rarity')
            .setRequired(false)
            .addChoices(
              { name: 'Common', value: 'COMMON' },
              { name: 'Uncommon', value: 'UNCOMMON' },
              { name: 'Rare', value: 'RARE' },
              { name: 'Legendary', value: 'LEGENDARY' },
              { name: 'Mythic', value: 'MYTHIC' },
              { name: 'Ascended', value: 'ASCENDED' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('craft')
        .setDescription('View crafting recipes for gear sets')
        .addStringOption(option =>
          option.setName('gear_name')
            .setDescription('Name of the gear set to view recipe for')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('upgrades')
        .setDescription('View recommended equipment upgrades for your class'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('compare')
        .setDescription('Compare equipment stats')
        .addStringOption(option =>
          option.setName('equipment_name')
            .setDescription('Name of the equipment to compare with current gear')
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
      case 'view':
        await handleViewEquipment(interaction, user);
        break;
      case 'equip':
        await handleEquipGearSet(interaction, user);
        break;
      case 'unequip':
        await handleUnequipGearSet(interaction, user);
        break;
      case 'inventory':
        await handleEquipmentInventory(interaction, user);
        break;
      case 'sets':
        await handleViewGearSets(interaction, user);
        break;
      case 'craft':
        await handleViewCraftingRecipes(interaction, user);
        break;
      case 'upgrades':
        await handleEquipmentUpgrades(interaction, user);
        break;
      case 'compare':
        await handleEquipmentCompare(interaction, user);
        break;
    }
  }
};

async function handleViewEquipment(interaction, user) {
  try {
    const equippedGearSets = await EquipmentSystem.getUserEquippedGearSets(user.id);
    const equipmentBonuses = await EquipmentSystem.calculateEquipmentBonuses(user.id);
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('⚔️ Equipped Gear')
      .setDescription(`**${interaction.user.username}**'s Equipment`);

    // Show equipped gear sets
    if (equippedGearSets.armor) {
        embed.addFields({
        name: '🛡️ Armor Set',
        value: `**${equippedGearSets.armor.name}**\nRarity: ${equippedGearSets.armor.rarity}\nLevel: ${equippedGearSets.armor.level}`,
        inline: true
        });
      } else {
        embed.addFields({
        name: '🛡️ Armor Set',
        value: 'None equipped',
          inline: true
        });
    }

    if (equippedGearSets.weapon) {
    embed.addFields({
        name: '⚔️ Weapon',
        value: `**${equippedGearSets.weapon.name}**\nRarity: ${equippedGearSets.weapon.rarity}\nLevel: ${equippedGearSets.weapon.level}`,
      inline: true
    });
    } else {
      embed.addFields({
        name: '⚔️ Weapon',
        value: 'None equipped',
        inline: true
      });
    }

    // Show total bonuses
    embed.addFields({
      name: '📊 Total Bonuses',
      value: `HP: +${equipmentBonuses.hpBonus}\nAttack: +${equipmentBonuses.attackBonus}\nDefense: +${equipmentBonuses.defenseBonus}`,
      inline: false
    });

    embed.setFooter({ text: 'Use /equipment sets to view available gear for your class' });

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error viewing equipment:', error);
    return interaction.reply({
      content: '❌ An error occurred while viewing your equipment.',
      ephemeral: true
    });
  }
}

async function handleEquipGearSet(interaction, user) {
  try {
    const gearName = interaction.options.getString('gear_name');

    // Find the equipment by name
    const equipment = await prisma.equipment.findFirst({
      where: {
        name: {
          contains: gearName,
          mode: 'insensitive'
        }
      }
    });

    if (!equipment) {
      return interaction.reply({
        content: `❌ Gear set "${gearName}" not found. Use \`/equipment sets\` to see available gear.`,
        ephemeral: true
      });
    }

    // Check if user owns this equipment
    const userEquipment = await prisma.userEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId: user.id,
          equipmentId: equipment.id
        }
      }
    });

    if (!userEquipment || userEquipment.quantity < 1) {
      return interaction.reply({
        content: `❌ You don't own ${equipment.name}. You need to craft it first!`,
        ephemeral: true
      });
    }

    // Equip the gear set
    const result = await EquipmentSystem.equipGearSet(user.id, equipment.id);
    
    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('✅ Gear Equipped!')
        .setDescription(result.message)
        .addFields({
          name: '📊 Stats',
          value: `HP: +${equipment.hpBonus || 0}\nAttack: +${equipment.attackBonus || 0}\nDefense: +${equipment.defenseBonus || 0}`,
          inline: true
        })
        .addFields({
          name: '📋 Requirements',
          value: `Level: ${equipment.level}\nRarity: ${equipment.rarity}`,
            inline: true
        });

      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error equipping gear set:', error);
    return interaction.reply({
      content: '❌ An error occurred while equipping the gear set.',
      ephemeral: true
    });
  }
}

async function handleUnequipGearSet(interaction, user) {
  try {
    const gearType = interaction.options.getString('type');

    const result = await EquipmentSystem.unequipGearSet(user.id, gearType);
    
    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🔄 Gear Unequipped!')
        .setDescription(result.message);

      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error unequipping gear set:', error);
    return interaction.reply({
      content: '❌ An error occurred while unequipping the gear set.',
      ephemeral: true
    });
  }
}

async function handleEquipmentInventory(interaction, user) {
  try {
    const ownedEquipment = await EquipmentSystem.getUserOwnedEquipment(user.id);

    if (ownedEquipment.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🎒 Equipment Inventory')
        .setDescription('You don\'t own any equipment yet!\n\n**To get equipment:**\n• Craft gear sets using `/craft menu`\n• Complete boss fights for ascended gear\n• Use `/equipment sets` to see what\'s available');

      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🎒 Equipment Inventory')
      .setDescription(`**${interaction.user.username}**'s Owned Equipment`);

    // Group by rarity
    const groupedEquipment = {};
    for (const item of ownedEquipment) {
      const rarity = item.equipment.rarity;
      if (!groupedEquipment[rarity]) {
        groupedEquipment[rarity] = [];
      }
      groupedEquipment[rarity].push(item);
    }

    // Add fields for each rarity
    const rarityOrder = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY', 'MYTHIC', 'ASCENDED'];
    for (const rarity of rarityOrder) {
      if (groupedEquipment[rarity]) {
        const equipmentList = groupedEquipment[rarity]
          .map(item => `• ${item.equipment.name} (x${item.quantity})`)
          .join('\n');
        
        embed.addFields({
          name: `${getItemEmoji("Equipment", rarity)} ${rarity}`,
          value: equipmentList,
          inline: false
        });
      }
    }

    embed.setFooter({ text: 'Use /equipment equip <name> to equip gear sets' });

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error viewing equipment inventory:', error);
    return interaction.reply({
      content: '❌ An error occurred while viewing your equipment inventory.',
      ephemeral: true
    });
  }
}

async function handleViewGearSets(interaction, user) {
  try {
    const rarity = interaction.options.getString('rarity');
    const userClass = user.playerClass || 'Adventurer';
    
    let equipment;
    if (rarity) {
      equipment = await EquipmentSystem.getEquipmentByClassAndRarity(userClass, rarity);
    } else {
      // Get all gear sets for the user's class
      const gearSetNames = EquipmentSystem.getClassGearSetNames(userClass);
      equipment = await prisma.equipment.findMany({
        where: {
          type: 'ARMOR',
          name: {
            contains: gearSetNames
          }
        },
        orderBy: [
          { rarity: 'asc' },
          { level: 'asc' },
          { name: 'asc' }
        ]
      });
    }

    if (equipment.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🛡️ Gear Sets')
        .setDescription(`No gear sets found for ${userClass}${rarity ? ` (${rarity})` : ''}.\n\n**Available classes:**\n• Paladin: Stonewall, Undying, Ironskin\n• Rogue: Shadowleaf, Silent Fang, Velvet Coil\n• Hunter: Snarehide, Wolfsight, Trailwalker\n• Mage: Runespun, Dustwoven, Kindling`);

      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🛡️ Available Gear Sets')
      .setDescription(`**${userClass}** Gear Sets${rarity ? ` (${rarity})` : ''}`);

    // Group by gear set type
    const gearSets = {};
    for (const gear of equipment) {
      const baseName = gear.name.replace(/\s+(Tough|Hardened|Blazing|Godforged|Ascended)\s+/, ' ').trim();
      if (!gearSets[baseName]) {
        gearSets[baseName] = [];
      }
      gearSets[baseName].push(gear);
    }

    // Add fields for each gear set
    for (const [setName, variants] of Object.entries(gearSets)) {
      const variantsList = variants
        .map(gear => `${getItemEmoji(gear.name, gear.rarity)} **${gear.name}** (Lv.${gear.level})`)
        .join('\n');
      
      embed.addFields({
        name: `🛡️ ${setName}`,
        value: variantsList,
        inline: false
      });
    }

    embed.setFooter({ text: 'Use /equipment craft <name> to view crafting recipes' });

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error viewing gear sets:', error);
    return interaction.reply({
      content: '❌ An error occurred while viewing gear sets.',
      ephemeral: true
    });
  }
}

async function handleViewCraftingRecipes(interaction, user) {
  try {
    const gearName = interaction.options.getString('gear_name');
    
    if (gearName) {
      // View specific recipe
      const recipe = await prisma.craftingRecipe.findFirst({
        where: {
          name: {
            contains: gearName,
            mode: 'insensitive'
          }
        },
        include: {
          resultEquipment: true,
          recipeIngredients: {
            include: {
              item: true
            }
          }
        }
      });

      if (!recipe) {
        return interaction.reply({
          content: `❌ No crafting recipe found for "${gearName}". Use \`/equipment sets\` to see available gear.`,
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🔨 Crafting Recipe')
        .setDescription(`**${recipe.resultEquipment.name}**`)
        .addFields({
          name: '📋 Requirements',
          value: `Level: ${recipe.requiredLevel}\nCost: ${recipe.craftingCost} coins`,
          inline: true
        });

      // Add ingredients
      const ingredientsList = recipe.recipeIngredients
        .map(ingredient => `• ${ingredient.item.name} x${ingredient.quantity}`)
        .join('\n');

    embed.addFields({
        name: '🧪 Ingredients',
        value: ingredientsList,
      inline: false
    });

      return interaction.reply({ embeds: [embed] });
    } else {
      // View all available recipes for user's class
      const userClass = user.playerClass || 'Adventurer';
      const gearSetNames = EquipmentSystem.getClassGearSetNames(userClass);
      
      const recipes = await prisma.craftingRecipe.findMany({
        where: {
          resultEquipment: {
            name: {
              contains: gearSetNames
            }
          }
        },
        include: {
          resultEquipment: true
        },
        orderBy: [
          { requiredLevel: 'asc' },
          { name: 'asc' }
        ]
      });

      if (recipes.length === 0) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('🔨 Crafting Recipes')
          .setDescription(`No crafting recipes found for ${userClass}.\n\n**To get recipes:**\n• Unlock crafting stations with \`/craft stations\`\n• Reach the required level for each recipe`);

        return interaction.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🔨 Available Crafting Recipes')
        .setDescription(`**${userClass}** Gear Recipes`);

      // Group by gear set
      const recipeGroups = {};
      for (const recipe of recipes) {
        const baseName = recipe.resultEquipment.name.replace(/\s+(Tough|Hardened|Blazing|Godforged|Ascended)\s+/, ' ').trim();
        if (!recipeGroups[baseName]) {
          recipeGroups[baseName] = [];
        }
        recipeGroups[baseName].push(recipe);
      }

      for (const [setName, setRecipes] of Object.entries(recipeGroups)) {
        const recipesList = setRecipes
          .map(recipe => `${getItemEmoji(recipe.resultEquipment.name, recipe.resultEquipment.rarity)} **${recipe.resultEquipment.name}** (Lv.${recipe.requiredLevel})`)
          .join('\n');
        
        embed.addFields({
          name: `🛡️ ${setName}`,
          value: recipesList,
          inline: false
        });
      }

      embed.setFooter({ text: 'Use /equipment craft <name> to view specific recipe details' });

      return interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error viewing crafting recipes:', error);
    return interaction.reply({
      content: '❌ An error occurred while viewing crafting recipes.',
      ephemeral: true
    });
  }
}

async function handleEquipmentUpgrades(interaction, user) {
  try {
    const userClass = user.playerClass || 'Adventurer';
    const upgrades = await EquipmentSystem.getEquipmentUpgradePath(user.id, userClass);
    
    if (upgrades.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('📈 Equipment Upgrades')
        .setDescription('No upgrade recommendations found!\n\n**Possible reasons:**\n• You already have the best equipment for your level\n• You need to level up to access better gear\n• You haven\'t equipped any gear yet\n\n**To get better equipment:**\n• Craft gear using `/craft menu`\n• Complete boss fights for ascended gear\n• Use `/equipment sets` to see available gear');

      return interaction.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('📈 Equipment Upgrade Recommendations')
      .setDescription(`**${userClass}** Upgrade Path`);

    for (const upgrade of upgrades) {
      const currentGear = upgrade.current;
      const recommendations = upgrade.recommendations;
      
      let upgradeText = `**Current:** ${currentGear.name} (Lv.${currentGear.level})\n\n**Recommendations:**\n`;
      
      for (const rec of recommendations) {
        const comparison = EquipmentSystem.compareEquipment(currentGear, rec);
        const statChanges = [];
        
        if (comparison.hpBonus.difference > 0) statChanges.push(`HP +${comparison.hpBonus.difference}`);
        if (comparison.attackBonus.difference > 0) statChanges.push(`ATK +${comparison.attackBonus.difference}`);
        if (comparison.defenseBonus.difference > 0) statChanges.push(`DEF +${comparison.defenseBonus.difference}`);
        
        const changesText = statChanges.length > 0 ? ` (${statChanges.join(', ')})` : '';
        upgradeText += `• ${getItemEmoji(rec.name, rec.rarity)} **${rec.name}** (Lv.${rec.level})${changesText}\n`;
      }
      
      embed.addFields({
        name: `${upgrade.type === 'ARMOR' ? '🛡️' : '⚔️'} ${upgrade.type} Upgrades`,
        value: upgradeText,
        inline: false
      });
    }

    embed.setFooter({ text: 'Use /equipment craft <name> to view crafting recipes for these upgrades' });

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error viewing equipment upgrades:', error);
    return interaction.reply({
      content: '❌ An error occurred while viewing equipment upgrades.',
      ephemeral: true
    });
  }
}

async function handleEquipmentCompare(interaction, user) {
  try {
    const equipmentName = interaction.options.getString('equipment_name');
    
    // Find the equipment to compare
    const equipment = await prisma.equipment.findFirst({
      where: {
        name: {
          contains: equipmentName,
          mode: 'insensitive'
        }
      }
    });

    if (!equipment) {
      return interaction.reply({
        content: `❌ Equipment "${equipmentName}" not found. Use \`/equipment sets\` to see available gear.`,
        ephemeral: true
      });
    }

    // Get user's currently equipped gear
    const equippedGear = await EquipmentSystem.getUserEquippedGearSets(user.id);
    const currentEquipment = equipment.type === 'ARMOR' ? equippedGear.armor : equippedGear.weapon;
    
    if (!currentEquipment) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('📊 Equipment Comparison')
        .setDescription(`**${equipment.name}** vs **No Equipment**`)
        .addFields({
          name: '📈 Stats',
          value: `HP: +${equipment.hpBonus || 0}\nAttack: +${equipment.attackBonus || 0}\nDefense: +${equipment.defenseBonus || 0}`,
          inline: true
        })
        .addFields({
          name: '📋 Requirements',
          value: `Level: ${equipment.level}\nRarity: ${equipment.rarity}`,
          inline: true
        });

      return interaction.reply({ embeds: [embed] });
    }

    // Compare equipment
    const comparison = EquipmentSystem.compareEquipment(currentEquipment, equipment);
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('📊 Equipment Comparison')
      .setDescription(`**${equipment.name}** vs **${currentEquipment.name}**`);

    // Current equipment stats
    embed.addFields({
      name: '🛡️ Current Equipment',
      value: `**${currentEquipment.name}**\nHP: +${currentEquipment.hpBonus || 0}\nAttack: +${currentEquipment.attackBonus || 0}\nDefense: +${currentEquipment.defenseBonus || 0}`,
      inline: true
    });

    // New equipment stats
    embed.addFields({
      name: '⚔️ New Equipment',
      value: `**${equipment.name}**\nHP: +${equipment.hpBonus || 0}\nAttack: +${equipment.attackBonus || 0}\nDefense: +${equipment.defenseBonus || 0}`,
      inline: true
    });

    // Stat differences
    const differences = [];
    if (comparison.hpBonus.difference !== 0) {
      const sign = comparison.hpBonus.difference > 0 ? '+' : '';
      differences.push(`HP: ${sign}${comparison.hpBonus.difference}`);
    }
    if (comparison.attackBonus.difference !== 0) {
      const sign = comparison.attackBonus.difference > 0 ? '+' : '';
      differences.push(`Attack: ${sign}${comparison.attackBonus.difference}`);
    }
    if (comparison.defenseBonus.difference !== 0) {
      const sign = comparison.defenseBonus.difference > 0 ? '+' : '';
      differences.push(`Defense: ${sign}${comparison.defenseBonus.difference}`);
    }

    const differenceText = differences.length > 0 ? differences.join('\n') : 'No stat changes';
    const isUpgrade = comparison.totalDifference > 0;
    
    embed.addFields({
      name: `${isUpgrade ? '📈' : '📉'} Stat Changes`,
      value: differenceText,
      inline: false
    });

    // Requirements
    embed.addFields({
      name: '📋 Requirements',
      value: `Level: ${equipment.level}\nRarity: ${equipment.rarity}`,
      inline: true
    });

    // Check if user owns this equipment
    const userEquipment = await prisma.userEquipment.findUnique({
      where: {
        userId_equipmentId: {
          userId: user.id,
          equipmentId: equipment.id
        }
      }
    });

    if (userEquipment) {
      embed.addFields({
        name: '✅ Ownership',
        value: `You own ${userEquipment.quantity}x ${equipment.name}`,
        inline: true
      });
    } else {
      embed.addFields({
        name: '❌ Ownership',
        value: `You don't own ${equipment.name}`,
        inline: true
      });
    }

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error comparing equipment:', error);
    return interaction.reply({
      content: '❌ An error occurred while comparing equipment.',
      ephemeral: true
    });
  }
} 