/**
 * Utility functions for safely handling Discord interactions
 */

/**
 * Check if an interaction is still valid and can be responded to
 * @param {Interaction} interaction - The Discord interaction
 * @returns {boolean} Whether the interaction is valid
 */
function isValidInteraction(interaction) {
  // Check if interaction has required properties
  if (!interaction || !interaction.id || !interaction.token) {
    return false;
  }
  
  // Check if interaction is from a valid source
  if (!interaction.user || !interaction.user.id) {
    return false;
  }
  
  return true;
}

/**
 * Safely respond to an interaction, handling cases where it has already been responded to
 * @param {Interaction} interaction - The Discord interaction
 * @param {Object} options - Response options
 * @param {string|EmbedBuilder|Array} options.content - Content to send
 * @param {Array} options.components - Components to include
 * @param {boolean} options.ephemeral - Whether the response should be ephemeral
 * @param {boolean} options.followUp - Whether to use followUp instead of reply
 * @returns {Promise<Message>} The sent message
 */
async function safeRespond(interaction, options = {}) {
  const { content, components, ephemeral = false, followUp = false } = options;
  
  try {
    // First check if interaction is still valid
    if (!isValidInteraction(interaction)) {
      console.error('Invalid interaction detected');
      throw new Error('Invalid interaction');
    }
    
    // Check interaction state
    if (interaction.replied) {
      // Already replied, use followUp
      return await interaction.followUp({
        content: typeof content === 'string' ? content : undefined,
        embeds: Array.isArray(content) ? content : (content && !typeof content === 'string' ? [content] : undefined),
        components: components,
        flags: ephemeral ? 64 : undefined
      });
    } else if (interaction.deferred) {
      // Deferred but not replied, use editReply
      return await interaction.editReply({
        content: typeof content === 'string' ? content : undefined,
        embeds: Array.isArray(content) ? content : (content && !typeof content === 'string' ? [content] : undefined),
        components: components
      });
    } else {
      // Not responded to yet, use reply
      return await interaction.reply({
        content: typeof content === 'string' ? content : undefined,
        embeds: Array.isArray(content) ? content : (content && !typeof content === 'string' ? [content] : undefined),
        components: components,
        flags: ephemeral ? 64 : undefined
      });
    }
  } catch (error) {
    console.error('Error in safeRespond:', error);
    
    // If all else fails, try to acknowledge the interaction
    try {
      if (!interaction.replied && !interaction.deferred && isValidInteraction(interaction)) {
        await interaction.deferReply({ ephemeral: true });
        await interaction.editReply({ content: 'An error occurred while processing your request.' });
      }
    } catch (ackError) {
      console.error('Failed to acknowledge interaction:', ackError);
    }
    
    throw error;
  }
}

/**
 * Safely defer an interaction reply
 * @param {Interaction} interaction - The Discord interaction
 * @param {Object} options - Defer options
 * @returns {Promise<boolean>} Whether the defer was successful
 */
async function safeDeferReply(interaction, options = {}) {
  try {
    if (!isValidInteraction(interaction)) {
      console.error('Cannot defer invalid interaction');
      return false;
    }
    
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferReply(options);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deferring reply:', error);
    return false;
  }
}

/**
 * Safely handle errors in command execution
 * @param {Interaction} interaction - The Discord interaction
 * @param {Error} error - The error that occurred
 * @param {string} commandName - Name of the command that failed
 */
async function handleCommandError(interaction, error, commandName = 'Unknown') {
  console.error(`Error executing command ${commandName}:`, error);
  
  // Check if this is an "Unknown interaction" error
  if (error.code === 10062) {
    console.error('Interaction has become invalid (timed out or expired)');
    return; // Don't try to respond to invalid interactions
  }
  
  const errorMessage = 'There was an error while executing this command!';
  
  try {
    await safeRespond(interaction, {
      content: errorMessage,
      ephemeral: true
    });
  } catch (respondError) {
    console.error('Error sending error response:', respondError);
  }
}

/**
 * Safely handle errors in button interactions
 * @param {Interaction} interaction - The Discord interaction
 * @param {Error} error - The error that occurred
 * @param {string} buttonId - ID of the button that failed
 */
async function handleButtonError(interaction, error, buttonId = 'Unknown') {
  console.error(`Error handling button ${buttonId}:`, error);
  
  // Check if this is an "Unknown interaction" error
  if (error.code === 10062) {
    console.error('Button interaction has become invalid (timed out or expired)');
    return; // Don't try to respond to invalid interactions
  }
  
  try {
    // For button interactions, we can only update the original message
    if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({ content: 'An error occurred while processing your request.' });
    } else if (!interaction.replied) {
      await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
    } else {
      await interaction.followUp({ content: 'An error occurred while processing your request.', ephemeral: true });
    }
  } catch (respondError) {
    console.error('Error sending button error response:', respondError);
  }
}

/**
 * Check if an interaction can be responded to
 * @param {Interaction} interaction - The Discord interaction
 * @returns {boolean} Whether the interaction can be responded to
 */
function canRespond(interaction) {
  return isValidInteraction(interaction) && !interaction.replied && !interaction.deferred;
}

/**
 * Check if an interaction has been responded to
 * @param {Interaction} interaction - The Discord interaction
 * @returns {boolean} Whether the interaction has been responded to
 */
function hasResponded(interaction) {
  return interaction.replied || interaction.deferred;
}

module.exports = {
  safeRespond,
  safeDeferReply,
  handleCommandError,
  handleButtonError,
  canRespond,
  hasResponded,
  isValidInteraction
}; 