const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create brushes
  const brushes = [
    {
      name: 'Frayed Straw Brush',
      description: 'A basic straw brush that has seen better days',
      multiplier: 1.0,
      price: 0,
      tier: 1
    },
    {
      name: 'Worn Boar Bristle',
      description: 'A durable brush made from aged boar bristles',
      multiplier: 0.875,
      price: 7500,
      tier: 2
    },
    {
      name: 'Polished Wood Brush',
      description: 'A finely crafted wooden brush with smooth bristles',
      multiplier: 0.75,
      price: 15000,
      tier: 3
    },
    {
      name: 'Bronze Detail Brush',
      description: 'A precision brush with bronze-tipped bristles',
      multiplier: 0.625,
      price: 30000,
      tier: 4
    },
    {
      name: 'Ivory Precision Brush',
      description: 'An elegant brush carved from pure ivory',
      multiplier: 0.5,
      price: 62500,
      tier: 5
    },
    {
      name: 'Quartz Fiber Brush',
      description: 'A brush woven with crystalline quartz fibers',
      multiplier: 0.425,
      price: 125000,
      tier: 6
    },
    {
      name: 'Phoenix Feather Brush',
      description: 'A mystical brush crafted from phoenix feathers',
      multiplier: 0.325,
      price: 250000,
      tier: 7
    },
    {
      name: 'Celestial Dust Brush',
      description: 'A legendary brush that seems to clean with starlight',
      multiplier: 0.25,
      price: 625000,
      tier: 8
    }
  ];

  for (const brush of brushes) {
    await prisma.brush.upsert({
      where: { name: brush.name },
      update: {},
      create: brush
    });
  }

  // Create maps
  const maps = [
    {
      name: 'Tattered Parchment',
      description: 'A worn map with faded markings',
      dropMultiplier: 1.1,
      price: 25000,
      tier: 1
    },
    {
      name: 'Leather Scroll',
      description: 'A durable map on treated leather',
      dropMultiplier: 1.15,
      price: 50000,
      tier: 2
    },
    {
      name: 'Silk Chart',
      description: 'An elegant map woven from fine silk',
      dropMultiplier: 1.3,
      price: 75000,
      tier: 3
    },
    {
      name: 'Crystal Atlas',
      description: 'A legendary map that seems to glow with ancient knowledge',
      dropMultiplier: 1.5,
      price: 100000,
      tier: 4
    }
  ];

  for (const map of maps) {
    await prisma.map.upsert({
      where: { name: map.name },
      update: {},
      create: map
    });
  }

  // Create items/relics - All items from the comprehensive loot table
  const items = [
    // Jungle Ruins (Aztec) Items
    { name: 'Tablet of Aztec', description: 'Ancient Aztec tablet with mysterious glyphs', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Aztec statue representing the fire god', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Time', description: 'Time-worn Aztec artifact', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Shadows', description: 'Dark tablet from Aztec rituals', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Flame', description: 'Aztec talisman of fire magic', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Power', description: 'Aztec totem of strength', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Shadows', description: 'Shadowy Aztec statue', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Aztec tablet of knowledge', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Time', description: 'Aztec idol of time', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Aztec flame statue', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Aztec wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Aztec', description: 'Ancient Aztec coin', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Aztec', description: 'Aztec tribal totem', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Aztec', description: 'Aztec currency', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Wisdom', description: 'Aztec wisdom coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Shadows', description: 'Aztec shadow tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Totem of Aztec', description: 'Aztec power totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Power', description: 'Aztec power coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Wisdom', description: 'Aztec wisdom relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Flame', description: 'Aztec flame talisman', rarity: 'RARE', value: 120 },
    { name: 'Statue of Time', description: 'Aztec time statue', rarity: 'RARE', value: 120 },
    { name: 'Idol of Power', description: 'Aztec power idol', rarity: 'RARE', value: 120 },
    { name: 'Totem of Wisdom', description: 'Aztec wisdom totem', rarity: 'RARE', value: 120 },
    { name: 'Idol of Time', description: 'Aztec time idol', rarity: 'RARE', value: 120 },
    { name: 'Charm of Flame', description: 'Aztec flame charm', rarity: 'LEGENDARY', value: 400 },
    { name: 'Coin of Power', description: 'Aztec power coin', rarity: 'LEGENDARY', value: 400 },
    { name: 'Tablet of Power', description: 'Aztec power tablet', rarity: 'MYTHIC', value: 1200 },

    // Frozen Crypt (Norse) Items
    { name: 'Charm of Shadows', description: 'Norse shadow charm', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Norse', description: 'Ancient Norse coin', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Wisdom', description: 'Norse wisdom statue', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Power', description: 'Norse power relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Flame', description: 'Norse flame idol', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Flame', description: 'Norse flame coin', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Flame', description: 'Norse flame tablet', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Power', description: 'Norse power totem', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Norse', description: 'Norse talisman', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Time', description: 'Norse time tablet', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Wisdom', description: 'Norse wisdom charm', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Power', description: 'Norse power coin', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Norse wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Wisdom', description: 'Norse wisdom talisman', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Time', description: 'Norse time relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Norse', description: 'Norse idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Norse', description: 'Norse relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Norse', description: 'Norse talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Power', description: 'Norse power statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Power', description: 'Norse power relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Wisdom', description: 'Norse wisdom coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Norse', description: 'Norse tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Power', description: 'Norse power coin', rarity: 'RARE', value: 120 },
    { name: 'Statue of Shadows', description: 'Norse shadow statue', rarity: 'RARE', value: 120 },
    { name: 'Relic of Shadows', description: 'Norse shadow relic', rarity: 'RARE', value: 120 },
    { name: 'Statue of Power', description: 'Norse power statue', rarity: 'RARE', value: 120 },
    { name: 'Coin of Shadows', description: 'Norse shadow coin', rarity: 'RARE', value: 120 },
    { name: 'Talisman of Wisdom', description: 'Norse wisdom talisman', rarity: 'LEGENDARY', value: 400 },
    { name: 'Relic of Wisdom', description: 'Norse wisdom relic', rarity: 'LEGENDARY', value: 400 },
    { name: 'Coin of Flame', description: 'Norse flame coin', rarity: 'MYTHIC', value: 1200 },

    // Mirage Dunes (Egyptian) Items
    { name: 'Charm of Egyptian', description: 'Egyptian charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Flame', description: 'Egyptian flame relic', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Shadows', description: 'Egyptian shadow charm', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Time', description: 'Egyptian time coin', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Wisdom', description: 'Egyptian wisdom talisman', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Wisdom', description: 'Egyptian wisdom relic', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Egyptian wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Shadows', description: 'Egyptian shadow coin', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Time', description: 'Egyptian time relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Egyptian wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Power', description: 'Egyptian power idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Wisdom', description: 'Egyptian wisdom statue', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Egyptian', description: 'Egyptian statue', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Egyptian flame statue', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Wisdom', description: 'Egyptian wisdom totem', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Wisdom', description: 'Egyptian wisdom relic', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Flame', description: 'Egyptian flame relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Egyptian', description: 'Egyptian idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Shadows', description: 'Egyptian shadow idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Egyptian time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Flame', description: 'Egyptian flame coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Shadows', description: 'Egyptian shadow statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Egyptian', description: 'Egyptian statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Time', description: 'Egyptian time relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Egyptian', description: 'Egyptian idol', rarity: 'RARE', value: 120 },
    { name: 'Statue of Time', description: 'Egyptian time statue', rarity: 'RARE', value: 120 },
    { name: 'Coin of Wisdom', description: 'Egyptian wisdom coin', rarity: 'RARE', value: 120 },
    { name: 'Coin of Time', description: 'Egyptian time coin', rarity: 'RARE', value: 120 },
    { name: 'Idol of Wisdom', description: 'Egyptian wisdom idol', rarity: 'RARE', value: 120 },
    { name: 'Coin of Power', description: 'Egyptian power coin', rarity: 'LEGENDARY', value: 400 },
    { name: 'Totem of Egyptian', description: 'Egyptian totem', rarity: 'LEGENDARY', value: 400 },
    { name: 'Tablet of Time', description: 'Egyptian time tablet', rarity: 'MYTHIC', value: 1200 },

    // Sunken Temple (Atlantean) Items
    { name: 'Coin of Atlantean', description: 'Atlantean coin', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Power', description: 'Atlantean power totem', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Power', description: 'Atlantean power idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Time', description: 'Atlantean time statue', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Shadows', description: 'Atlantean shadow idol', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Power', description: 'Atlantean power talisman', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Wisdom', description: 'Atlantean wisdom totem', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Atlantean wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Flame', description: 'Atlantean flame charm', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Shadows', description: 'Atlantean shadow totem', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Shadows', description: 'Atlantean shadow relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Atlantean wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Shadows', description: 'Atlantean shadow tablet', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Flame', description: 'Atlantean flame coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Wisdom', description: 'Atlantean wisdom tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Flame', description: 'Atlantean flame talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Time', description: 'Atlantean time coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Atlantean time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Time', description: 'Atlantean time tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Totem of Flame', description: 'Atlantean flame totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Power', description: 'Atlantean power charm', rarity: 'RARE', value: 120 },
    { name: 'Statue of Flame', description: 'Atlantean flame statue', rarity: 'RARE', value: 120 },
    { name: 'Statue of Atlantean', description: 'Atlantean statue', rarity: 'RARE', value: 120 },
    { name: 'Tablet of Wisdom', description: 'Atlantean wisdom tablet', rarity: 'RARE', value: 120 },
    { name: 'Tablet of Power', description: 'Atlantean power tablet', rarity: 'LEGENDARY', value: 400 },
    { name: 'Statue of Flame', description: 'Atlantean flame statue', rarity: 'LEGENDARY', value: 400 },
    { name: 'Totem of Power', description: 'Atlantean power totem', rarity: 'MYTHIC', value: 1200 },

    // Volcanic Forge (Dwarven) Items
    { name: 'Talisman of Wisdom', description: 'Dwarven wisdom talisman', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Shadows', description: 'Dwarven shadow relic', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Power', description: 'Dwarven power totem', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Power', description: 'Dwarven power relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Power', description: 'Dwarven power idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Power', description: 'Dwarven power tablet', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Flame', description: 'Dwarven flame idol', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Flame', description: 'Dwarven flame totem', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Time', description: 'Dwarven time totem', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Power', description: 'Dwarven power charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Wisdom', description: 'Dwarven wisdom relic', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Time', description: 'Dwarven time statue', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Shadows', description: 'Dwarven shadow charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Dwarven', description: 'Dwarven relic', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Power', description: 'Dwarven power charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Shadows', description: 'Dwarven shadow statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Wisdom', description: 'Dwarven wisdom idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Totem of Flame', description: 'Dwarven flame totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Dwarven', description: 'Dwarven statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Power', description: 'Dwarven power idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Flame', description: 'Dwarven flame relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Dwarven time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Wisdom', description: 'Dwarven wisdom talisman', rarity: 'RARE', value: 120 },
    { name: 'Relic of Wisdom', description: 'Dwarven wisdom relic', rarity: 'RARE', value: 120 },
    { name: 'Totem of Flame', description: 'Dwarven flame totem', rarity: 'RARE', value: 120 },
    { name: 'Tablet of Power', description: 'Dwarven power tablet', rarity: 'RARE', value: 120 },
    { name: 'Statue of Wisdom', description: 'Dwarven wisdom statue', rarity: 'RARE', value: 120 },
    { name: 'Coin of Power', description: 'Dwarven power coin', rarity: 'LEGENDARY', value: 400 },
    { name: 'Relic of Dwarven', description: 'Dwarven relic', rarity: 'LEGENDARY', value: 400 },
    { name: 'Coin of Wisdom', description: 'Dwarven wisdom coin', rarity: 'MYTHIC', value: 1200 },

    // Twilight Moor (Gothic) Items
    { name: 'Tablet of Power', description: 'Gothic power tablet', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Flame', description: 'Gothic flame talisman', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Gothic wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Gothic wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Flame', description: 'Gothic flame coin', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Gothic', description: 'Gothic statue', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Power', description: 'Gothic power charm', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Wisdom', description: 'Gothic wisdom statue', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Gothic', description: 'Gothic charm', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Power', description: 'Gothic power coin', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Time', description: 'Gothic time idol', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Shadows', description: 'Gothic shadow talisman', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Flame', description: 'Gothic flame charm', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Gothic', description: 'Gothic coin', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Power', description: 'Gothic power tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Shadows', description: 'Gothic shadow relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Gothic time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Wisdom', description: 'Gothic wisdom relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Gothic', description: 'Gothic relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Wisdom', description: 'Gothic wisdom tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Time', description: 'Gothic time talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Flame', description: 'Gothic flame coin', rarity: 'RARE', value: 120 },
    { name: 'Talisman of Power', description: 'Gothic power talisman', rarity: 'RARE', value: 120 },
    { name: 'Relic of Wisdom', description: 'Gothic wisdom relic', rarity: 'RARE', value: 120 },
    { name: 'Idol of Shadows', description: 'Gothic shadow idol', rarity: 'RARE', value: 120 },
    { name: 'Relic of Flame', description: 'Gothic flame relic', rarity: 'RARE', value: 120 },
    { name: 'Statue of Gothic', description: 'Gothic statue', rarity: 'LEGENDARY', value: 400 },
    { name: 'Coin of Time', description: 'Gothic time coin', rarity: 'LEGENDARY', value: 400 },
    { name: 'Totem of Flame', description: 'Gothic flame totem', rarity: 'MYTHIC', value: 1200 },

    // Skyreach Spires (Cloud Kingdom) Items
    { name: 'Totem of Wisdom', description: 'Cloud Kingdom wisdom totem', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Time', description: 'Cloud Kingdom time charm', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Time', description: 'Cloud Kingdom time totem', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Power', description: 'Cloud Kingdom power charm', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Cloud Kingdom', description: 'Cloud Kingdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Wisdom', description: 'Cloud Kingdom wisdom statue', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Time', description: 'Cloud Kingdom time relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Shadows', description: 'Cloud Kingdom shadow idol', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Wisdom', description: 'Cloud Kingdom wisdom talisman', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Flame', description: 'Cloud Kingdom flame charm', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Cloud Kingdom flame statue', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Wisdom', description: 'Cloud Kingdom wisdom coin', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Time', description: 'Cloud Kingdom time relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Flame', description: 'Cloud Kingdom flame idol', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Wisdom', description: 'Cloud Kingdom wisdom coin', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Power', description: 'Cloud Kingdom power charm', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Cloud Kingdom', description: 'Cloud Kingdom statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Totem of Wisdom', description: 'Cloud Kingdom wisdom totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Wisdom', description: 'Cloud Kingdom wisdom relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Shadows', description: 'Cloud Kingdom shadow relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Time', description: 'Cloud Kingdom time tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Power', description: 'Cloud Kingdom power idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Power', description: 'Cloud Kingdom power talisman', rarity: 'RARE', value: 120 },
    { name: 'Coin of Time', description: 'Cloud Kingdom time coin', rarity: 'RARE', value: 120 },
    { name: 'Relic of Flame', description: 'Cloud Kingdom flame relic', rarity: 'RARE', value: 120 },
    { name: 'Statue of Wisdom', description: 'Cloud Kingdom wisdom statue', rarity: 'RARE', value: 120 },
    { name: 'Charm of Shadows', description: 'Cloud Kingdom shadow charm', rarity: 'RARE', value: 120 },
    { name: 'Idol of Flame', description: 'Cloud Kingdom flame idol', rarity: 'LEGENDARY', value: 400 },
    { name: 'Tablet of Flame', description: 'Cloud Kingdom flame tablet', rarity: 'LEGENDARY', value: 400 },
    { name: 'Statue of Cloud Kingdom', description: 'Cloud Kingdom statue', rarity: 'MYTHIC', value: 1200 },

    // Obsidian Wastes (Dark Realm) Items
    { name: 'Tablet of Shadows', description: 'Dark Realm shadow tablet', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Shadows', description: 'Dark Realm shadow coin', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Dark Realm', description: 'Dark Realm coin', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Time', description: 'Dark Realm time talisman', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Dark Realm', description: 'Dark Realm charm', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Dark Realm', description: 'Dark Realm idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Dark Realm flame statue', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Power', description: 'Dark Realm power coin', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Shadows', description: 'Dark Realm shadow totem', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Wisdom', description: 'Dark Realm wisdom totem', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Flame', description: 'Dark Realm flame talisman', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Wisdom', description: 'Dark Realm wisdom relic', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Flame', description: 'Dark Realm flame coin', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Power', description: 'Dark Realm power idol', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Flame', description: 'Dark Realm flame coin', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Dark Realm flame statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Power', description: 'Dark Realm power statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Flame', description: 'Dark Realm flame tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Dark Realm time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Shadows', description: 'Dark Realm shadow talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Shadows', description: 'Dark Realm shadow tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Flame', description: 'Dark Realm flame talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Totem of Wisdom', description: 'Dark Realm wisdom totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Shadows', description: 'Dark Realm shadow talisman', rarity: 'RARE', value: 120 },
    { name: 'Relic of Flame', description: 'Dark Realm flame relic', rarity: 'RARE', value: 120 },
    { name: 'Idol of Flame', description: 'Dark Realm flame idol', rarity: 'RARE', value: 120 },
    { name: 'Coin of Power', description: 'Dark Realm power coin', rarity: 'RARE', value: 120 },
    { name: 'Relic of Flame', description: 'Dark Realm flame relic', rarity: 'RARE', value: 120 },
    { name: 'Statue of Dark Realm', description: 'Dark Realm statue', rarity: 'LEGENDARY', value: 400 },
    { name: 'Idol of Dark Realm', description: 'Dark Realm idol', rarity: 'LEGENDARY', value: 400 },
    { name: 'Coin of Wisdom', description: 'Dark Realm wisdom coin', rarity: 'MYTHIC', value: 1200 },

    // Astral Caverns (Cosmic) Items
    { name: 'Idol of Time', description: 'Cosmic time idol', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Power', description: 'Cosmic power coin', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Wisdom', description: 'Cosmic wisdom totem', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Time', description: 'Cosmic time idol', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Cosmic', description: 'Cosmic coin', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Flame', description: 'Cosmic flame charm', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Wisdom', description: 'Cosmic wisdom charm', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Power', description: 'Cosmic power coin', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Time', description: 'Cosmic time totem', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Shadows', description: 'Cosmic shadow coin', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Shadows', description: 'Cosmic shadow relic', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Flame', description: 'Cosmic flame charm', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Time', description: 'Cosmic time statue', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Power', description: 'Cosmic power totem', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Cosmic wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Cosmic', description: 'Cosmic tablet', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Cosmic', description: 'Cosmic totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Wisdom', description: 'Cosmic wisdom tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Power', description: 'Cosmic power tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Wisdom', description: 'Cosmic wisdom talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Power', description: 'Cosmic power talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Wisdom', description: 'Cosmic wisdom charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Cosmic', description: 'Cosmic idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Cosmic time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Cosmic time charm', rarity: 'RARE', value: 120 },
    { name: 'Talisman of Cosmic', description: 'Cosmic talisman', rarity: 'RARE', value: 120 },
    { name: 'Relic of Time', description: 'Cosmic time relic', rarity: 'RARE', value: 120 },
    { name: 'Totem of Shadows', description: 'Cosmic shadow totem', rarity: 'RARE', value: 120 },
    { name: 'Idol of Time', description: 'Cosmic time idol', rarity: 'RARE', value: 120 },
    { name: 'Relic of Time', description: 'Cosmic time relic', rarity: 'LEGENDARY', value: 400 },
    { name: 'Totem of Time', description: 'Cosmic time totem', rarity: 'LEGENDARY', value: 400 },
    { name: 'Statue of Cosmic', description: 'Cosmic statue', rarity: 'MYTHIC', value: 1200 },

    // Ethereal Sanctum (Divine) Items
    { name: 'Tablet of Time', description: 'Divine time tablet', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Wisdom', description: 'Divine wisdom charm', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Shadows', description: 'Divine shadow talisman', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Divine', description: 'Divine idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Power', description: 'Divine power statue', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Divine wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Shadows', description: 'Divine shadow totem', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Power', description: 'Divine power relic', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Shadows', description: 'Divine shadow relic', rarity: 'COMMON', value: 10 },
    { name: 'Coin of Shadows', description: 'Divine shadow coin', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Flame', description: 'Divine flame talisman', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Divine wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Power', description: 'Divine power idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Divine', description: 'Divine tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Shadows', description: 'Divine shadow relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Power', description: 'Divine power tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Power', description: 'Divine power charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Flame', description: 'Divine flame idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Divine', description: 'Divine statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Divine time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Coin of Time', description: 'Divine time coin', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Wisdom', description: 'Divine wisdom charm', rarity: 'RARE', value: 120 },
    { name: 'Relic of Time', description: 'Divine time relic', rarity: 'RARE', value: 120 },
    { name: 'Relic of Power', description: 'Divine power relic', rarity: 'RARE', value: 120 },
    { name: 'Coin of Divine', description: 'Divine coin', rarity: 'RARE', value: 120 },
    { name: 'Charm of Shadows', description: 'Divine shadow charm', rarity: 'RARE', value: 120 },
    { name: 'Totem of Divine', description: 'Divine totem', rarity: 'LEGENDARY', value: 400 },
    { name: 'Idol of Power', description: 'Divine power idol', rarity: 'LEGENDARY', value: 400 },
    { name: 'Coin of Wisdom', description: 'Divine wisdom coin', rarity: 'MYTHIC', value: 1200 },
    
    // Beast-specific loot items
    { name: 'Beast Claw', description: 'A sharp claw from a defeated beast', rarity: 'COMMON', value: 15 },
    { name: 'Frayed Hide', description: 'Tattered hide from a beast', rarity: 'COMMON', value: 15 },
    { name: 'Mossy Charm', description: 'A charm covered in ancient moss', rarity: 'COMMON', value: 15 },
    { name: 'Cracked Fang', description: 'A broken fang from a beast', rarity: 'COMMON', value: 15 },
    { name: 'Uncommon Relic Shard', description: 'A fragment of an uncommon relic', rarity: 'UNCOMMON', value: 45 },
    { name: 'Duskwalker Idol', description: 'An idol of the duskwalker', rarity: 'UNCOMMON', value: 45 },
    { name: 'Bone Carving', description: 'An intricately carved bone', rarity: 'UNCOMMON', value: 45 },
    { name: 'Runed Talisman', description: 'A talisman covered in ancient runes', rarity: 'UNCOMMON', value: 45 },
    { name: 'Sealed Coin', description: 'A coin sealed with ancient magic', rarity: 'UNCOMMON', value: 45 },
    { name: 'Rare Beast Fang', description: 'A rare fang from a powerful beast', rarity: 'RARE', value: 125 },
    { name: 'Echoing Horn', description: 'A horn that echoes with ancient power', rarity: 'RARE', value: 125 },
    { name: 'Fireheart Gem', description: 'A gem that burns with eternal flame', rarity: 'RARE', value: 125 },
    { name: 'Runic Blade', description: 'A blade inscribed with powerful runes', rarity: 'RARE', value: 125 },
    { name: 'Ancient Beast Core', description: 'The core of an ancient beast', rarity: 'LEGENDARY', value: 405 },
    { name: 'Primal Totem', description: 'A totem of primal power', rarity: 'LEGENDARY', value: 405 },
    { name: 'Mythic Beast Bone', description: 'A bone from a mythic beast', rarity: 'MYTHIC', value: 1205 },
    { name: 'Ethereal Relic', description: 'A relic that exists between worlds', rarity: 'MYTHIC', value: 1205 },
    { name: 'Shard of Ascension', description: 'A shard that holds the power of ascension', rarity: 'MYTHIC', value: 1205 },
    { name: 'Veilstone', description: 'A stone that can pierce the veil between realms', rarity: 'MYTHIC', value: 1205 },
    { name: 'Astral Sigil', description: 'A sigil that channels astral power', rarity: 'MYTHIC', value: 1205 },
    
    // Boss-specific loot items
    { name: 'Crown of Vaelith', description: 'The legendary crown of Vaelith, ruler of the Aztec realm', rarity: 'MYTHIC', value: 2000 },
    { name: 'Crown of Vaelith Fragment', description: 'A fragment of the legendary Crown of Vaelith', rarity: 'LEGENDARY', value: 500 },
    { name: 'Heart of the Frozen Titan', description: 'The frozen heart of an ancient Norse titan', rarity: 'MYTHIC', value: 2000 },
    { name: 'Heart of the Frozen Titan Fragment', description: 'A fragment of the Heart of the Frozen Titan', rarity: 'LEGENDARY', value: 500 },
    { name: 'Scarab of the Mirage King', description: 'The sacred scarab of the Egyptian Mirage King', rarity: 'MYTHIC', value: 2000 },
    { name: 'Scarab of the Mirage King Fragment', description: 'A fragment of the Scarab of the Mirage King', rarity: 'LEGENDARY', value: 500 },
    { name: 'Tear of the Deep', description: 'A tear from the depths of the Atlantean realm', rarity: 'MYTHIC', value: 2000 },
    { name: 'Tear of the Deep Fragment', description: 'A fragment of the Tear of the Deep', rarity: 'LEGENDARY', value: 500 },
    { name: 'Core of the Forge Wyrm', description: 'The molten core of a legendary forge wyrm', rarity: 'MYTHIC', value: 2000 },
    { name: 'Core of the Forge Wyrm Fragment', description: 'A fragment of the Core of the Forge Wyrm', rarity: 'LEGENDARY', value: 500 },
    { name: 'Veil of the Moor Queen', description: 'The mystical veil of the Gothic Moor Queen', rarity: 'MYTHIC', value: 2000 },
    { name: 'Veil of the Moor Queen Fragment', description: 'A fragment of the Veil of the Moor Queen', rarity: 'LEGENDARY', value: 500 },
    { name: 'Feather of the Sky God', description: 'A divine feather from the Cloud Kingdom Sky God', rarity: 'MYTHIC', value: 2000 },
    { name: 'Feather of the Sky God Fragment', description: 'A fragment of the Feather of the Sky God', rarity: 'LEGENDARY', value: 500 },
    { name: 'Obsidian Soulbrand', description: 'The legendary obsidian blade of the Dark Realm', rarity: 'MYTHIC', value: 2000 },
    { name: 'Obsidian Soulbrand Fragment', description: 'A fragment of the Obsidian Soulbrand', rarity: 'LEGENDARY', value: 500 },
    { name: 'Starforged Eye', description: 'An eye forged from the stars of the Cosmic realm', rarity: 'MYTHIC', value: 2000 },
    { name: 'Starforged Eye Fragment', description: 'A fragment of the Starforged Eye', rarity: 'LEGENDARY', value: 500 },
    { name: 'Halo of the Divine Sentinel', description: 'The sacred halo of the Divine Sentinel', rarity: 'MYTHIC', value: 2000 },
    { name: 'Halo of the Divine Sentinel Fragment', description: 'A fragment of the Halo of the Divine Sentinel', rarity: 'LEGENDARY', value: 500 }
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: {},
      create: item
    });
  }

  // Create zones
  const zones = [
    {
      name: 'Jungle Ruins',
      description: 'Ancient Aztec ruins hidden in dense jungle',
      minLevel: 1,
      maxLevel: 10
    },
    {
      name: 'Frozen Crypt',
      description: 'Norse burial chambers frozen in eternal ice',
      minLevel: 11,
      maxLevel: 20
    },
    {
      name: 'Mirage Dunes',
      description: 'Egyptian pyramids rising from shifting sands',
      minLevel: 21,
      maxLevel: 30
    },
    {
      name: 'Sunken Temple',
      description: 'Atlantean temple lost beneath the waves',
      minLevel: 31,
      maxLevel: 40
    },
    {
      name: 'Volcanic Forge',
      description: 'Dwarven forges deep within volcanic mountains',
      minLevel: 41,
      maxLevel: 50
    },
    {
      name: 'Twilight Moor',
      description: 'Gothic ruins shrouded in eternal twilight',
      minLevel: 51,
      maxLevel: 60
    },
    {
      name: 'Skyreach Spires',
      description: 'Cloud Kingdom towers floating in the sky',
      minLevel: 61,
      maxLevel: 70
    },
    {
      name: 'Obsidian Wastes',
      description: 'Dark Realm corrupted by ancient evil',
      minLevel: 71,
      maxLevel: 80
    },
    {
      name: 'Astral Caverns',
      description: 'Cosmic caves where reality bends',
      minLevel: 81,
      maxLevel: 90
    },
    {
      name: 'Ethereal Sanctum',
      description: 'Divine realm where gods once walked',
      minLevel: 91,
      maxLevel: 100
    }
  ];

  for (const zone of zones) {
    await prisma.zone.upsert({
      where: { name: zone.name },
      update: {},
      create: zone
    });
  }

  // Create zone-item relationships with focused loot tables (no coins)
  const zoneItems = [
    // Jungle Ruins (Aztec) - 15 items total
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Aztec', dropRate: 0.4 },
    { zoneName: 'Jungle Ruins', itemName: 'Statue of Flame', dropRate: 0.4 },
    { zoneName: 'Jungle Ruins', itemName: 'Relic of Time', dropRate: 0.4 },
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Shadows', dropRate: 0.4 },
    { zoneName: 'Jungle Ruins', itemName: 'Talisman of Flame', dropRate: 0.4 },
    { zoneName: 'Jungle Ruins', itemName: 'Totem of Aztec', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Aztec', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Charm of Aztec', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Relic of Wisdom', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Statue of Time', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Power', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Totem of Wisdom', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Charm of Flame', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Time', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Power', dropRate: 0.01 },

    // Frozen Crypt (Norse) - 15 items total
    { zoneName: 'Frozen Crypt', itemName: 'Charm of Shadows', dropRate: 0.4 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Norse', dropRate: 0.4 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Wisdom', dropRate: 0.4 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Power', dropRate: 0.4 },
    { zoneName: 'Frozen Crypt', itemName: 'Idol of Flame', dropRate: 0.4 },
    { zoneName: 'Frozen Crypt', itemName: 'Idol of Norse', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Norse', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Talisman of Norse', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Power', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Totem of Power', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Shadows', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Shadows', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Talisman of Wisdom', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Wisdom', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Charm of Flame', dropRate: 0.01 },

    // Mirage Dunes (Egyptian) - 15 items total
    { zoneName: 'Mirage Dunes', itemName: 'Charm of Egyptian', dropRate: 0.4 },
    { zoneName: 'Mirage Dunes', itemName: 'Relic of Flame', dropRate: 0.4 },
    { zoneName: 'Mirage Dunes', itemName: 'Charm of Shadows', dropRate: 0.4 },
    { zoneName: 'Mirage Dunes', itemName: 'Tablet of Time', dropRate: 0.4 },
    { zoneName: 'Mirage Dunes', itemName: 'Talisman of Wisdom', dropRate: 0.4 },
    { zoneName: 'Mirage Dunes', itemName: 'Relic of Wisdom', dropRate: 0.3 },
    { zoneName: 'Mirage Dunes', itemName: 'Idol of Egyptian', dropRate: 0.3 },
    { zoneName: 'Mirage Dunes', itemName: 'Idol of Shadows', dropRate: 0.3 },
    { zoneName: 'Mirage Dunes', itemName: 'Charm of Time', dropRate: 0.3 },
    { zoneName: 'Mirage Dunes', itemName: 'Statue of Time', dropRate: 0.2 },
    { zoneName: 'Mirage Dunes', itemName: 'Totem of Wisdom', dropRate: 0.2 },
    { zoneName: 'Mirage Dunes', itemName: 'Idol of Wisdom', dropRate: 0.2 },
    { zoneName: 'Mirage Dunes', itemName: 'Totem of Power', dropRate: 0.1 },
    { zoneName: 'Mirage Dunes', itemName: 'Totem of Egyptian', dropRate: 0.1 },
    { zoneName: 'Mirage Dunes', itemName: 'Tablet of Time', dropRate: 0.01 },

    // Sunken Temple (Atlantean) - 15 items total
    { zoneName: 'Sunken Temple', itemName: 'Totem of Atlantean', dropRate: 0.4 },
    { zoneName: 'Sunken Temple', itemName: 'Totem of Power', dropRate: 0.4 },
    { zoneName: 'Sunken Temple', itemName: 'Idol of Power', dropRate: 0.4 },
    { zoneName: 'Sunken Temple', itemName: 'Statue of Time', dropRate: 0.4 },
    { zoneName: 'Sunken Temple', itemName: 'Idol of Shadows', dropRate: 0.4 },
    { zoneName: 'Sunken Temple', itemName: 'Talisman of Power', dropRate: 0.3 },
    { zoneName: 'Sunken Temple', itemName: 'Totem of Wisdom', dropRate: 0.3 },
    { zoneName: 'Sunken Temple', itemName: 'Tablet of Wisdom', dropRate: 0.3 },
    { zoneName: 'Sunken Temple', itemName: 'Talisman of Flame', dropRate: 0.3 },
    { zoneName: 'Sunken Temple', itemName: 'Charm of Power', dropRate: 0.2 },
    { zoneName: 'Sunken Temple', itemName: 'Statue of Flame', dropRate: 0.2 },
    { zoneName: 'Sunken Temple', itemName: 'Statue of Atlantean', dropRate: 0.2 },
    { zoneName: 'Sunken Temple', itemName: 'Tablet of Power', dropRate: 0.1 },
    { zoneName: 'Sunken Temple', itemName: 'Tablet of Wisdom', dropRate: 0.1 },
    { zoneName: 'Sunken Temple', itemName: 'Totem of Power', dropRate: 0.01 },

    // Volcanic Forge (Dwarven) - 15 items total
    { zoneName: 'Volcanic Forge', itemName: 'Talisman of Wisdom', dropRate: 0.4 },
    { zoneName: 'Volcanic Forge', itemName: 'Relic of Shadows', dropRate: 0.4 },
    { zoneName: 'Volcanic Forge', itemName: 'Totem of Power', dropRate: 0.4 },
    { zoneName: 'Volcanic Forge', itemName: 'Relic of Power', dropRate: 0.4 },
    { zoneName: 'Volcanic Forge', itemName: 'Idol of Power', dropRate: 0.4 },
    { zoneName: 'Volcanic Forge', itemName: 'Tablet of Power', dropRate: 0.3 },
    { zoneName: 'Volcanic Forge', itemName: 'Idol of Flame', dropRate: 0.3 },
    { zoneName: 'Volcanic Forge', itemName: 'Totem of Flame', dropRate: 0.3 },
    { zoneName: 'Volcanic Forge', itemName: 'Totem of Time', dropRate: 0.3 },
    { zoneName: 'Volcanic Forge', itemName: 'Charm of Power', dropRate: 0.2 },
    { zoneName: 'Volcanic Forge', itemName: 'Statue of Shadows', dropRate: 0.2 },
    { zoneName: 'Volcanic Forge', itemName: 'Idol of Wisdom', dropRate: 0.2 },
    { zoneName: 'Volcanic Forge', itemName: 'Totem of Dwarven', dropRate: 0.1 },
    { zoneName: 'Volcanic Forge', itemName: 'Relic of Dwarven', dropRate: 0.1 },
    { zoneName: 'Volcanic Forge', itemName: 'Charm of Wisdom', dropRate: 0.01 },

    // Twilight Moor (Gothic) - 15 items total
    { zoneName: 'Twilight Moor', itemName: 'Tablet of Power', dropRate: 0.4 },
    { zoneName: 'Twilight Moor', itemName: 'Talisman of Flame', dropRate: 0.4 },
    { zoneName: 'Twilight Moor', itemName: 'Idol of Wisdom', dropRate: 0.4 },
    { zoneName: 'Twilight Moor', itemName: 'Tablet of Wisdom', dropRate: 0.4 },
    { zoneName: 'Twilight Moor', itemName: 'Charm of Flame', dropRate: 0.4 },
    { zoneName: 'Twilight Moor', itemName: 'Statue of Gothic', dropRate: 0.3 },
    { zoneName: 'Twilight Moor', itemName: 'Charm of Power', dropRate: 0.3 },
    { zoneName: 'Twilight Moor', itemName: 'Statue of Wisdom', dropRate: 0.3 },
    { zoneName: 'Twilight Moor', itemName: 'Charm of Gothic', dropRate: 0.3 },
    { zoneName: 'Twilight Moor', itemName: 'Totem of Power', dropRate: 0.2 },
    { zoneName: 'Twilight Moor', itemName: 'Idol of Time', dropRate: 0.2 },
    { zoneName: 'Twilight Moor', itemName: 'Talisman of Shadows', dropRate: 0.2 },
    { zoneName: 'Twilight Moor', itemName: 'Charm of Flame', dropRate: 0.1 },
    { zoneName: 'Twilight Moor', itemName: 'Relic of Gothic', dropRate: 0.1 },
    { zoneName: 'Twilight Moor', itemName: 'Totem of Flame', dropRate: 0.01 },

    // Skyreach Spires (Cloud Kingdom) - 15 items total
    { zoneName: 'Skyreach Spires', itemName: 'Totem of Wisdom', dropRate: 0.4 },
    { zoneName: 'Skyreach Spires', itemName: 'Charm of Time', dropRate: 0.4 },
    { zoneName: 'Skyreach Spires', itemName: 'Totem of Time', dropRate: 0.4 },
    { zoneName: 'Skyreach Spires', itemName: 'Charm of Power', dropRate: 0.4 },
    { zoneName: 'Skyreach Spires', itemName: 'Idol of Cloud Kingdom', dropRate: 0.4 },
    { zoneName: 'Skyreach Spires', itemName: 'Statue of Wisdom', dropRate: 0.3 },
    { zoneName: 'Skyreach Spires', itemName: 'Relic of Time', dropRate: 0.3 },
    { zoneName: 'Skyreach Spires', itemName: 'Idol of Shadows', dropRate: 0.3 },
    { zoneName: 'Skyreach Spires', itemName: 'Talisman of Wisdom', dropRate: 0.3 },
    { zoneName: 'Skyreach Spires', itemName: 'Charm of Flame', dropRate: 0.2 },
    { zoneName: 'Skyreach Spires', itemName: 'Statue of Flame', dropRate: 0.2 },
    { zoneName: 'Skyreach Spires', itemName: 'Totem of Cloud Kingdom', dropRate: 0.2 },
    { zoneName: 'Skyreach Spires', itemName: 'Talisman of Power', dropRate: 0.1 },
    { zoneName: 'Skyreach Spires', itemName: 'Relic of Time', dropRate: 0.1 },
    { zoneName: 'Skyreach Spires', itemName: 'Statue of Cloud Kingdom', dropRate: 0.01 },

    // Obsidian Wastes (Dark Realm) - 15 items total
    { zoneName: 'Obsidian Wastes', itemName: 'Tablet of Shadows', dropRate: 0.4 },
    { zoneName: 'Obsidian Wastes', itemName: 'Totem of Shadows', dropRate: 0.4 },
    { zoneName: 'Obsidian Wastes', itemName: 'Totem of Dark Realm', dropRate: 0.4 },
    { zoneName: 'Obsidian Wastes', itemName: 'Talisman of Time', dropRate: 0.4 },
    { zoneName: 'Obsidian Wastes', itemName: 'Charm of Dark Realm', dropRate: 0.4 },
    { zoneName: 'Obsidian Wastes', itemName: 'Idol of Dark Realm', dropRate: 0.3 },
    { zoneName: 'Obsidian Wastes', itemName: 'Statue of Flame', dropRate: 0.3 },
    { zoneName: 'Obsidian Wastes', itemName: 'Totem of Power', dropRate: 0.3 },
    { zoneName: 'Obsidian Wastes', itemName: 'Totem of Wisdom', dropRate: 0.3 },
    { zoneName: 'Obsidian Wastes', itemName: 'Talisman of Flame', dropRate: 0.2 },
    { zoneName: 'Obsidian Wastes', itemName: 'Relic of Wisdom', dropRate: 0.2 },
    { zoneName: 'Obsidian Wastes', itemName: 'Charm of Shadows', dropRate: 0.2 },
    { zoneName: 'Obsidian Wastes', itemName: 'Talisman of Shadows', dropRate: 0.1 },
    { zoneName: 'Obsidian Wastes', itemName: 'Relic of Flame', dropRate: 0.1 },
    { zoneName: 'Obsidian Wastes', itemName: 'Statue of Dark Realm', dropRate: 0.01 },

    // Astral Caverns (Cosmic) - 15 items total
    { zoneName: 'Astral Caverns', itemName: 'Idol of Time', dropRate: 0.4 },
    { zoneName: 'Astral Caverns', itemName: 'Totem of Power', dropRate: 0.4 },
    { zoneName: 'Astral Caverns', itemName: 'Totem of Wisdom', dropRate: 0.4 },
    { zoneName: 'Astral Caverns', itemName: 'Totem of Cosmic', dropRate: 0.4 },
    { zoneName: 'Astral Caverns', itemName: 'Charm of Flame', dropRate: 0.4 },
    { zoneName: 'Astral Caverns', itemName: 'Charm of Wisdom', dropRate: 0.3 },
    { zoneName: 'Astral Caverns', itemName: 'Totem of Time', dropRate: 0.3 },
    { zoneName: 'Astral Caverns', itemName: 'Totem of Shadows', dropRate: 0.3 },
    { zoneName: 'Astral Caverns', itemName: 'Relic of Shadows', dropRate: 0.3 },
    { zoneName: 'Astral Caverns', itemName: 'Charm of Flame', dropRate: 0.2 },
    { zoneName: 'Astral Caverns', itemName: 'Statue of Time', dropRate: 0.2 },
    { zoneName: 'Astral Caverns', itemName: 'Idol of Cosmic', dropRate: 0.2 },
    { zoneName: 'Astral Caverns', itemName: 'Totem of Power', dropRate: 0.1 },
    { zoneName: 'Astral Caverns', itemName: 'Idol of Wisdom', dropRate: 0.1 },
    { zoneName: 'Astral Caverns', itemName: 'Statue of Cosmic', dropRate: 0.01 },

    // Ethereal Sanctum (Divine) - 15 items total
    { zoneName: 'Ethereal Sanctum', itemName: 'Tablet of Time', dropRate: 0.4 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Charm of Wisdom', dropRate: 0.4 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Talisman of Shadows', dropRate: 0.4 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Idol of Divine', dropRate: 0.4 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Statue of Power', dropRate: 0.4 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Idol of Wisdom', dropRate: 0.3 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Totem of Shadows', dropRate: 0.3 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Relic of Power', dropRate: 0.3 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Relic of Shadows', dropRate: 0.3 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Totem of Divine', dropRate: 0.2 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Talisman of Flame', dropRate: 0.2 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Tablet of Wisdom', dropRate: 0.2 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Charm of Power', dropRate: 0.1 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Idol of Power', dropRate: 0.1 },
    { zoneName: 'Ethereal Sanctum', itemName: 'Charm of Divine', dropRate: 0.01 }
  ];

  for (const zoneItem of zoneItems) {
    const zone = await prisma.zone.findUnique({ where: { name: zoneItem.zoneName } });
    const item = await prisma.item.findUnique({ where: { name: zoneItem.itemName } });
    
    if (zone && item) {
      await prisma.zoneItem.upsert({
        where: { zoneId_itemId: { zoneId: zone.id, itemId: item.id } },
        update: { dropRate: zoneItem.dropRate },
        create: {
          zoneId: zone.id,
          itemId: item.id,
          dropRate: zoneItem.dropRate
        }
      });
    }
  }

  // Create collections
  const collections = [
    {
      name: 'Coin Collector',
      description: 'Collect ancient coins from various civilizations',
      reward: 500
    },
    {
      name: 'Crystal Hunter',
      description: 'Gather crystals of different types and colors',
      reward: 1000
    },
    {
      name: 'Dragon Slayer',
      description: 'Collect dragon scales and related artifacts',
      reward: 2500
    }
  ];

  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { name: collection.name },
      update: {},
      create: collection
    });
  }

  // Add items to collections
  const collectionItems = [
    { collectionName: 'Coin Collector', itemName: 'Ancient Coin' },
    { collectionName: 'Crystal Hunter', itemName: 'Crystal Shard' },
    { collectionName: 'Dragon Slayer', itemName: 'Dragon Scale' }
  ];

  for (const collectionItem of collectionItems) {
    const collection = await prisma.collection.findUnique({ where: { name: collectionItem.collectionName } });
    const item = await prisma.item.findUnique({ where: { name: collectionItem.itemName } });
    
    if (collection && item) {
      await prisma.collectionItem.upsert({
        where: { collectionId_itemId: { collectionId: collection.id, itemId: item.id } },
        update: {},
        create: {
          collectionId: collection.id,
          itemId: item.id
        }
      });
    }
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 