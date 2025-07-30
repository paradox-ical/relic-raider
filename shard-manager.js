const { ShardingManager } = require('discord.js');
const path = require('path');
require('dotenv').config();

// Create a new sharding manager
const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
  token: process.env.DISCORD_TOKEN,
  totalShards: 'auto', // Let Discord.js determine the optimal number of shards
  respawn: false, // Don't automatically respawn shards (prevents auto-restart on shutdown)
  spawnTimeout: 30000, // 30 seconds timeout for spawning shards
  mode: 'process' // Use process mode for better isolation
});

// Log when shards are spawned
manager.on('shardCreate', shard => {
  console.log(`🚀 Launched shard ${shard.id}`);
  
  // Log when shard is ready
  shard.on('ready', () => {
    console.log(`✅ Shard ${shard.id} is ready!`);
  });
  
  // Log shard errors
  shard.on('error', error => {
    console.error(`❌ Shard ${shard.id} encountered an error:`, error);
  });
  
  // Log when shard disconnects
  shard.on('disconnect', () => {
    console.log(`🔌 Shard ${shard.id} disconnected`);
  });
  
  // Log when shard reconnects
  shard.on('reconnecting', () => {
    console.log(`🔄 Shard ${shard.id} is reconnecting...`);
  });
});

// Log when all shards are ready
manager.on('allShardsReady', () => {
  console.log('🎉 All shards are ready!');
  console.log(`📊 Total shards: ${manager.totalShards}`);
  
  // Set activity for all shards
  manager.broadcastEval(client => {
    client.user.setActivity('for ancient relics', { type: 'WATCHING' });
  });
});

// Handle graceful shutdown
let isShuttingDown = false;

process.on('SIGINT', async () => {
  if (isShuttingDown) return; // Prevent multiple shutdown attempts
  isShuttingDown = true;
  
  console.log('\n🛑 Shutting down sharding manager...');
  
  try {
    // Broadcast shutdown to all shards with error handling
    try {
      await manager.broadcastEval(client => {
        client.destroy();
      });
    } catch (broadcastError) {
      // Ignore EPIPE errors during shutdown - they're expected when shards are already terminated
      if (broadcastError.code !== 'EPIPE') {
        console.error('⚠️ Warning during broadcast shutdown:', broadcastError.message);
      }
    }
    
    // Kill all shards with error handling
    for (const shard of manager.shards.values()) {
      try {
        if (shard.process && !shard.process.killed) {
          shard.kill();
        }
      } catch (killError) {
        // Ignore errors when killing already terminated shards
        console.log(`ℹ️ Shard ${shard.id} was already terminated`);
      }
    }
    
    console.log('✅ Sharding manager shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error shutting down sharding manager:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  if (isShuttingDown) return; // Prevent multiple shutdown attempts
  isShuttingDown = true;
  
  console.log('\n🛑 Received SIGTERM, shutting down...');
  
  try {
    // Broadcast shutdown to all shards with error handling
    try {
      await manager.broadcastEval(client => {
        client.destroy();
      });
    } catch (broadcastError) {
      // Ignore EPIPE errors during shutdown - they're expected when shards are already terminated
      if (broadcastError.code !== 'EPIPE') {
        console.error('⚠️ Warning during broadcast shutdown:', broadcastError.message);
      }
    }
    
    // Kill all shards with error handling
    for (const shard of manager.shards.values()) {
      try {
        if (shard.process && !shard.process.killed) {
          shard.kill();
        }
      } catch (killError) {
        // Ignore errors when killing already terminated shards
        console.log(`ℹ️ Shard ${shard.id} was already terminated`);
      }
    }
    
    console.log('✅ Sharding manager shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error shutting down sharding manager:', error);
    process.exit(1);
  }
});

// Spawn the shards
console.log('🚀 Starting sharding manager...');
manager.spawn(); 