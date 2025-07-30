const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const CraftingSystem = require('../lib/crafting-system');
const prisma = require('../lib/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('craft')
    .setDescription('Access the crafting system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('menu')
        .setDescription('Open the crafting menu'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('recipe')
        .setDescription('View a specific recipe')
        .addStringOption(option =>
          option.setName('recipe_name')
            .setDescription('Name of the recipe to view')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Craft an item')
        .addStringOption(option =>
          option.setName('recipe_name')
            .setDescription('Name of the recipe to craft')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stations')
        .setDescription('View and unlock crafting stations'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('equipment')
        .setDescription('Interactive equipment crafting system')),

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

    // Ensure user has basic crafting table unlocked
    const basicStation = await prisma.craftingStation.findUnique({
      where: { name: 'Basic Crafting Table' }
    });

    if (basicStation) {
      await prisma.userCraftingStation.upsert({
        where: {
          userId_stationId: {
            userId: user.id,
            stationId: basicStation.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          stationId: basicStation.id
        }
      });
    }

    switch (subcommand) {
      case 'menu':
        await handleCraftingMenu(interaction, user);
        break;
      case 'recipe':
        await handleViewRecipe(interaction, user);
        break;
      case 'create':
        await handleCraftItem(interaction, user);
        break;
      case 'stations':
        await handleCraftingStations(interaction, user);
        break;
      case 'equipment':
        await handleEquipmentCrafting(interaction, user);
        break;
    }
  }
};

async function handleCraftingMenu(interaction, user) {
  try {
    const recipes = await CraftingSystem.getAvailableRecipes(user.id);
    
    if (recipes.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🔨 Crafting System')
        .setDescription('You don\'t have any recipes available yet!\n\n**To get started:**\n• Unlock crafting stations with `/craft stations`\n• Collect items from exploration and battles\n• Combine lower tier items into higher tier ones')
        .setFooter({ text: 'Crafting allows you to combine items for better value!' });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Group recipes by station
    const recipesByStation = {};
    recipes.forEach(recipe => {
      if (!recipesByStation[recipe.stationName]) {
        recipesByStation[recipe.stationName] = [];
      }
      recipesByStation[recipe.stationName].push(recipe);
    });

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔨 Crafting Menu')
      .setDescription(`Welcome to the crafting system, ${interaction.user.username}!\n\n**Your Recipes:**`);

    for (const [stationName, stationRecipes] of Object.entries(recipesByStation)) {
      let stationText = `\n**${stationName}:**\n`;
      
      stationRecipes.forEach(recipe => {
        const status = recipe.canCraft ? '✅' : '❌';
        const costText = recipe.craftingCost > 0 ? ` (${recipe.craftingCost} coins)` : '';
        stationText += `${status} **${recipe.name}**${costText}\n`;
      });
      
      embed.addFields({
        name: stationName,
        value: stationText,
        inline: false
      });
    }

    embed.addFields({
      name: '📋 How to Craft',
      value: 'Use `/craft create [recipe_name]` to craft an item\nUse `/craft recipe [recipe_name]` to view recipe details\nUse `/craft stations` to unlock new crafting stations',
      inline: false
    });

    const buttons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_stations')
          .setLabel('Stations')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏭'),
        new ButtonBuilder()
          .setCustomId('craft_progress')
          .setLabel('Progress')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📊'),
        new ButtonBuilder()
          .setCustomId('craft_close')
          .setLabel('Close')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
  } catch (error) {
    console.error('Error in crafting menu:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading the crafting menu.',
      ephemeral: true
    });
  }
}

async function handleViewRecipe(interaction, user) {
  try {
    const recipeName = interaction.options.getString('recipe_name');
    
    const recipe = await prisma.craftingRecipe.findFirst({
      where: { name: { contains: recipeName, mode: 'insensitive' } },
      include: {
        recipeIngredients: {
          include: {
            item: true
          }
        },
        resultItem: true
      }
    });

    if (!recipe) {
      return interaction.reply({
        content: `❌ Recipe "${recipeName}" not found. Use \`/craft menu\` to see available recipes.`,
        ephemeral: true
      });
    }

    // Check if user can craft this recipe
    const canCraft = await CraftingSystem.canCraftRecipe(user.id, recipe.id);

    const embed = new EmbedBuilder()
      .setColor(canCraft ? '#00FF00' : '#FF0000')
      .setTitle(`📋 Recipe: ${recipe.name}`)
      .setDescription(recipe.description)
      .addFields(
        {
          name: '🎯 Result',
          value: `${recipe.resultQuantity}x **${recipe.resultItem.name}** (${recipe.resultItem.rarity})`,
          inline: true
        },
        {
          name: '💰 Cost',
          value: `${recipe.craftingCost} coins`,
          inline: true
        },
        {
          name: '📊 Level Required',
          value: `Level ${recipe.requiredLevel}`,
          inline: true
        }
      );

    // Add ingredients
    let ingredientsText = '';
    for (const ingredient of recipe.recipeIngredients) {
      const userItem = await prisma.inventoryItem.findUnique({
        where: {
          userId_itemId: {
            userId: user.id,
            itemId: ingredient.itemId
          }
        }
      });

      const userQuantity = userItem ? userItem.quantity : 0;
      const status = userQuantity >= ingredient.quantity ? '✅' : '❌';
      ingredientsText += `${status} **${ingredient.item.name}** (${userQuantity}/${ingredient.quantity})\n`;
    }

    embed.addFields({
      name: '📦 Required Ingredients',
      value: ingredientsText || 'No ingredients required',
      inline: false
    });

    if (canCraft) {
      embed.addFields({
        name: '✅ Status',
        value: 'You can craft this recipe!',
        inline: false
      });

      const button = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`craft_${recipe.id}`)
            .setLabel('Craft Item')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔨')
        );

      await interaction.reply({ embeds: [embed], components: [button], ephemeral: true });
    } else {
      embed.addFields({
        name: '❌ Status',
        value: 'You cannot craft this recipe. Check your level, coins, and ingredients.',
        inline: false
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    console.error('Error viewing recipe:', error);
    await interaction.reply({
      content: '❌ An error occurred while viewing the recipe.',
      ephemeral: true
    });
  }
}

async function handleCraftItem(interaction, user) {
  try {
    const recipeName = interaction.options.getString('recipe_name');
    
    const recipe = await prisma.craftingRecipe.findFirst({
      where: { name: { contains: recipeName, mode: 'insensitive' } }
    });

    if (!recipe) {
      return interaction.reply({
        content: `❌ Recipe "${recipeName}" not found. Use \`/craft menu\` to see available recipes.`,
        ephemeral: true
      });
    }

    const result = await CraftingSystem.craftItem(user.id, recipe.id);

    if (result.success) {
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🔨 Crafting Successful!')
        .setDescription(result.message)
        .addFields(
          {
            name: '🎯 Crafted Item',
            value: `${result.quantity}x **${result.craftedItem.name}**`,
            inline: true
          },
          {
            name: '💰 Cost',
            value: `${result.cost} coins`,
            inline: true
          },
          {
            name: '📊 Rarity',
            value: result.craftedItem.rarity,
            inline: true
          }
        );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error('Error crafting item:', error);
    await interaction.reply({
      content: '❌ An error occurred while crafting the item.',
      ephemeral: true
    });
  }
}

async function handleCraftingStations(interaction, user) {
  try {
    const stations = await CraftingSystem.getAvailableStations(user.id);
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🏭 Crafting Stations')
      .setDescription('Unlock new crafting stations to access more recipes!');

    for (const station of stations) {
      let status = '🔒 Locked';
      let description = station.description;
      
      if (station.unlocked) {
        status = '✅ Unlocked';
      } else if (station.canUnlock) {
        status = '🔓 Can Unlock';
        description += `\n**Click to unlock for ${station.unlockCost} coins**`;
      } else {
        if (user.level < station.requiredLevel) {
          description += `\n**Requires Level ${station.requiredLevel}**`;
        }
        if (user.coins < station.unlockCost) {
          description += `\n**Requires ${station.unlockCost} coins**`;
        }
      }

      embed.addFields({
        name: `${status} ${station.name}`,
        value: description,
        inline: false
      });
    }

    const buttons = [];
    for (const station of stations) {
      if (!station.unlocked && station.canUnlock) {
        buttons.push(
          new ButtonBuilder()
            .setCustomId(`unlock_station_${station.id}`)
            .setLabel(`Unlock ${station.name}`)
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔓')
        );
      }
    }

    if (buttons.length > 0) {
      const buttonRow = new ActionRowBuilder().addComponents(buttons.slice(0, 5));
      await interaction.reply({ embeds: [embed], components: [buttonRow], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  } catch (error) {
    console.error('Error viewing crafting stations:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading crafting stations.',
      ephemeral: true
    });
  }
}

async function handleEquipmentCrafting(interaction, user) {
  try {
    // Get user's unlocked crafting stations
    const CraftingSystem = require('./crafting-system');
    const stations = await CraftingSystem.getUserStations(user.id);
    
    if (stations.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle('🏭 Equipment Crafting')
        .setDescription('You need to unlock crafting stations first!\n\n**To get started:**\n• Use `/craft stations` to unlock crafting stations\n• Each station provides different equipment recipes\n• Higher level stations unlock better gear');

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🏭 Equipment Crafting')
      .setDescription('Select a crafting station to begin crafting equipment:');

    // Add station information
    for (const station of stations) {
      embed.addFields({
        name: `🏭 ${station.station.name}`,
        value: station.station.description,
        inline: false
      });
    }

    // Create station selection buttons
    const stationButtons = [];
    for (const station of stations) {
      stationButtons.push(
        new ButtonBuilder()
          .setCustomId(`craft_station_${station.station.id}`)
          .setLabel(station.station.name)
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🏭')
      );
    }

    // Split buttons into rows of 3
    const buttonRows = [];
    for (let i = 0; i < stationButtons.length; i += 3) {
      buttonRows.push(new ActionRowBuilder().addComponents(stationButtons.slice(i, i + 3)));
    }

    // Add back button
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('craft_close')
          .setLabel('Back to Menu')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

    buttonRows.push(backButton);

    await interaction.reply({ embeds: [embed], components: buttonRows, ephemeral: true });
  } catch (error) {
    console.error('Error in equipment crafting:', error);
    await interaction.reply({
      content: '❌ An error occurred while loading equipment crafting.',
      ephemeral: true
    });
  }
} 