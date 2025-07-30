# Relic Raider - Sharding Guide

## Overview

Relic Raider uses Discord.js sharding to handle thousands of servers efficiently. Each shard manages a subset of guilds, and they all share the same database.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shard 0       │    │   Shard 1       │    │   Shard N       │
│ (Guilds 0-2500) │    │ (Guilds 2501-   │    │ (Guilds ...)    │
│                 │    │  5000)          │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   MySQL Database│
                    │   (Shared)      │
                    └─────────────────┘
```

## Commands

### Development
```powershell
# Run with sharding (recommended)
npm run dev

# Run single instance (for testing)
npm run single

# Deploy commands
npm run deploy
```

### Production
```powershell
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs relic-raider-shard-manager
```

## Sharding Benefits

1. **Scalability**: Handle 2500+ guilds per shard
2. **Performance**: Distribute load across multiple processes
3. **Reliability**: If one shard crashes, others continue
4. **Resource Management**: Better memory and CPU utilization

## Database Considerations

- **Connection Pooling**: Prisma handles multiple connections efficiently
- **Shared Data**: All shards access the same database
- **Transactions**: Safe across shards with proper error handling

## Monitoring

### Commands
- `/status` - View bot statistics across all shards
- Check logs for shard-specific information

### Logs
- Each log entry includes shard ID
- Format: `[timestamp] [Shard X] message`

## Deployment Checklist

### Local Development
- [ ] Database migration: `npm run db:migrate`
- [ ] Seed data: `npm run db:seed`
- [ ] Deploy commands: `npm run deploy`
- [ ] Start bot: `npm run dev`

### Production (Cybrancee)
- [ ] Update `ecosystem.config.js` with your server details
- [ ] Set environment variables
- [ ] Install PM2: `npm install -g pm2`
- [ ] Deploy: `pm2 deploy production`

## Environment Variables

```env
# Required
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DATABASE_URL=mysql://user:pass@host:port/db

# Optional
NODE_ENV=production
PORT=3000
```

## Troubleshooting

### Shard Not Starting
- Check Discord token validity
- Verify bot permissions
- Check database connection

### High Memory Usage
- Monitor with `pm2 monit`
- Consider reducing shard count
- Check for memory leaks in commands

### Database Connection Issues
- Verify DATABASE_URL
- Check MySQL server status
- Review connection pool settings

## Performance Tips

1. **Use connection pooling** (already configured)
2. **Cache frequently accessed data**
3. **Optimize database queries**
4. **Monitor shard performance**
5. **Use proper error handling**

## Scaling

### When to Add Shards
- Bot reaches 2500+ guilds
- High memory usage (>1GB per shard)
- Slow response times

### How to Scale
1. Discord.js automatically determines optimal shard count
2. Update `totalShards` in `shard-manager.js` if needed
3. Monitor performance and adjust

## Security

- Keep bot token secure
- Use environment variables
- Regular security updates
- Monitor for suspicious activity 