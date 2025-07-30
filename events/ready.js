const { Events, EmbedBuilder } = require('discord.js');
const { logWithShard, getBotStats } = require('../lib/shard-utils');
const ServerBossSystem = require('../lib/server-boss-system');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    const shardId = client.shard ? client.shard.ids[0] : 0;
    
    // Set bot status (only for this shard)
    client.user.setActivity('for ancient relics', { type: 'WATCHING' });
    
    // Log shard startup with clean formatting
    console.log(`\n🚀 Shard ${shardId} is ready!`);
    console.log(`   └ Logged in as: ${client.user.tag}`);
    console.log(`   └ Serving: ${client.guilds.cache.size} guilds`);
    
    // Log total stats if this is shard 0 or single instance
    if (shardId === 0 || !client.shard) {
      try {
        const stats = await getBotStats(client);
        console.log(`\n📊 Bot Statistics:`);
        console.log(`   └ Total Servers: ${stats.guilds.toLocaleString()}`);
        console.log(`   └ Total Users: ${stats.users.toLocaleString()}`);
        console.log(`   └ Active Shards: ${stats.shards}`);
        console.log(`   └ Average Ping: ${stats.ping}ms`);
        console.log(`\n✨ Relic Raider is now online and ready for adventure!\n`);
      } catch (error) {
        logWithShard(client, `Error getting bot stats: ${error.message}`, 'error');
      }
    }
    
    // Start boss notification checker
    startBossNotificationChecker(client);
  },
};

// Boss notification checker
function startBossNotificationChecker(client) {
  setInterval(async () => {
    try {
      // Check all guilds this shard is responsible for
      for (const guild of client.guilds.cache.values()) {
        const notification = ServerBossSystem.getServerBossNotification(guild.id);
        
        if (notification) {
          // Find a suitable channel to send the notification
          const channel = findNotificationChannel(guild);
          
          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(notification.bossWon ? '#FF6B35' : '#FF0000')
              .setTitle(notification.bossWon ? '🏰 **SERVER BOSS VICTORIOUS!**' : '🏰 **SERVER BOSS DEFEATED!**')
              .setDescription(notification.bossWon ? 
                `**${notification.bossName}** has emerged victorious in **${notification.zone}**!` :
                `**${notification.bossName}** has been defeated in **${notification.zone}**!`)
              .addFields(
                {
                  name: notification.bossWon ? '💀 Defeated Player' : '🎯 Defeated By',
                  value: `<@${notification.defeatedByUserId}>`,
                  inline: true
                },
                {
                  name: '⏰ Server Cooldown',
                  value: `${notification.cooldownHours} hours`,
                  inline: true
                },
                {
                  name: '📢 Server Notice',
                  value: notification.bossWon ?
                    'This boss has proven its might and is now on cooldown. All players must wait before it can spawn again.' :
                    'This boss is now on cooldown for the entire server. All players must wait before it can spawn again.',
                  inline: false
                }
              )
              .setTimestamp(notification.timestamp)
              .setFooter({ text: 'Relic Raider - Server Boss System' });
            
            await channel.send({ embeds: [embed] });
          }
        }
      }
    } catch (error) {
      console.error('Error in boss notification checker:', error);
    }
  }, 5000); // Check every 5 seconds
}

// Find a suitable channel for notifications
function findNotificationChannel(guild) {
  // Priority order: general, announcements, first available text channel
  const channelNames = ['general', 'announcements', 'bot-commands', 'relic-raider'];
  
  for (const channelName of channelNames) {
    const channel = guild.channels.cache.find(
      ch => ch.name.toLowerCase().includes(channelName) && ch.type === 0 // 0 = text channel
    );
    if (channel) return channel;
  }
  
  // Fallback: first text channel with send permissions
  return guild.channels.cache.find(
    ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages')
  );
} 