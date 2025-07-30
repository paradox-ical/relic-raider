const { EmbedBuilder } = require('discord.js');

/**
 * Get bot statistics across all shards
 * @param {Client} client - Discord client
 * @returns {Promise<Object>} Bot statistics
 */
async function getBotStats(client) {
  if (client.shard) {
    // We're in a shard, get stats from all shards
    const promises = [
      client.shard.fetchClientValues('guilds.cache.size'),
      client.shard.fetchClientValues('users.cache.size'),
      client.shard.fetchClientValues('channels.cache.size'),
      client.shard.fetchClientValues('ws.ping')
    ];

    const results = await Promise.all(promises);
    
    return {
      guilds: results[0].reduce((acc, guildCount) => acc + guildCount, 0),
      users: results[1].reduce((acc, userCount) => acc + userCount, 0),
      channels: results[2].reduce((acc, channelCount) => acc + channelCount, 0),
      ping: Math.round(results[3].reduce((acc, ping) => acc + ping, 0) / results[3].length),
      shards: client.shard.count
    };
  } else {
    // Single instance (no sharding)
    return {
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      channels: client.channels.cache.size,
      ping: Math.round(client.ws.ping),
      shards: 1
    };
  }
}

/**
 * Broadcast a message to all shards
 * @param {Client} client - Discord client
 * @param {string} event - Event name
 * @param {*} data - Data to broadcast
 */
async function broadcastToShards(client, event, data) {
  if (client.shard) {
    await client.shard.broadcastEval((c, { event, data }) => {
      c.emit(event, data);
    }, { context: { event, data } });
  } else {
    client.emit(event, data);
  }
}

/**
 * Get shard info for a specific guild
 * @param {Client} client - Discord client
 * @param {string} guildId - Guild ID
 * @returns {Promise<number>} Shard ID
 */
async function getShardForGuild(client, guildId) {
  if (client.shard) {
    return client.shard.ids[0];
  } else {
    return 0;
  }
}

/**
 * Create a status embed showing shard information
 * @param {Client} client - Discord client
 * @returns {Promise<EmbedBuilder>} Status embed
 */
async function createStatusEmbed(client) {
  const stats = await getBotStats(client);
  
  const embed = new EmbedBuilder()
    .setColor('#00ff00')
    .setTitle('🤖 Bot Status')
    .setDescription('Current bot statistics and shard information')
    .addFields(
      { name: '📊 Servers', value: stats.guilds.toLocaleString(), inline: true },
      { name: '👥 Users', value: stats.users.toLocaleString(), inline: true },
      { name: '📝 Channels', value: stats.channels.toLocaleString(), inline: true },
      { name: '🏓 Ping', value: `${stats.ping}ms`, inline: true },
      { name: '🔧 Shards', value: stats.shards.toString(), inline: true },
      { name: '🆔 Current Shard', value: client.shard ? client.shard.ids[0].toString() : '0', inline: true }
    )
    .setTimestamp();
  
  return embed;
}

/**
 * Log message with shard information
 * @param {Client} client - Discord client
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
function logWithShard(client, message, level = 'info') {
  const shardId = client.shard ? client.shard.ids[0] : 0;
  const timestamp = new Date().toISOString();
  
  const logMessage = `[${timestamp}] [Shard ${shardId}] ${message}`;
  
  switch (level) {
    case 'warn':
      console.warn(`⚠️  ${logMessage}`);
      break;
    case 'error':
      console.error(`❌ ${logMessage}`);
      break;
    default:
      console.log(logMessage);
  }
}

module.exports = {
  getBotStats,
  broadcastToShards,
  getShardForGuild,
  createStatusEmbed,
  logWithShard
}; 