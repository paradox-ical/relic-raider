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
      dropMultiplier: 1.2,
      price: 25000,
      tier: 1
    },
    {
      name: 'Leather Scroll',
      description: 'A durable map on treated leather',
      dropMultiplier: 1.4,
      price: 50000,
      tier: 2
    },
    {
      name: 'Silk Chart',
      description: 'An elegant map woven from fine silk',
      dropMultiplier: 1.7,
      price: 75000,
      tier: 3
    },
    {
      name: 'Crystal Atlas',
      description: 'A legendary map that seems to glow with ancient knowledge',
      dropMultiplier: 2.0,
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
    { name: 'Totem of Aztec', description: 'Aztec power totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Flame', description: 'Aztec flame talisman', rarity: 'RARE', value: 120 },
    { name: 'Statue of Time', description: 'Aztec time statue', rarity: 'RARE', value: 120 },
    { name: 'Idol of Power', description: 'Aztec power idol', rarity: 'RARE', value: 120 },
    { name: 'Totem of Wisdom', description: 'Aztec wisdom totem', rarity: 'RARE', value: 120 },
    { name: 'Idol of Time', description: 'Aztec time idol', rarity: 'RARE', value: 120 },
    { name: 'Charm of Flame', description: 'Aztec flame charm', rarity: 'LEGENDARY', value: 400 },

    // Frozen Crypt (Norse) Items
    { name: 'Charm of Shadows', description: 'Norse shadow charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Power', description: 'Norse power relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Flame', description: 'Norse flame idol', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Power', description: 'Norse power totem', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Norse', description: 'Norse talisman', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Time', description: 'Norse time tablet', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Wisdom', description: 'Norse wisdom charm', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Wisdom', description: 'Norse wisdom talisman', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Time', description: 'Norse time relic', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Norse', description: 'Norse idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Norse', description: 'Norse relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Norse', description: 'Norse talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Power', description: 'Norse power statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Power', description: 'Norse power relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Shadows', description: 'Norse shadow relic', rarity: 'RARE', value: 120 },
    { name: 'Statue of Power', description: 'Norse power statue', rarity: 'RARE', value: 120 },
    { name: 'Relic of Wisdom', description: 'Norse wisdom relic', rarity: 'LEGENDARY', value: 400 },

    // Mirage Dunes (Egyptian) Items
    { name: 'Charm of Egyptian', description: 'Egyptian charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Flame', description: 'Egyptian flame relic', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Shadows', description: 'Egyptian shadow charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Wisdom', description: 'Egyptian wisdom relic', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Egyptian wisdom tablet', rarity: 'COMMON', value: 10 },
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
    { name: 'Statue of Egyptian', description: 'Egyptian statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Time', description: 'Egyptian time relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Egyptian', description: 'Egyptian idol', rarity: 'RARE', value: 120 },
    { name: 'Statue of Time', description: 'Egyptian time statue', rarity: 'RARE', value: 120 },
    { name: 'Tablet of Time', description: 'Egyptian time tablet', rarity: 'MYTHIC', value: 1200 },

    // Sunken Temple (Atlantean) Items
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
    { name: 'Talisman of Flame', description: 'Atlantean flame talisman', rarity: 'UNCOMMON', value: 40 },
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

    // Twilight Moor (Gothic) Items
    { name: 'Tablet of Power', description: 'Gothic power tablet', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Flame', description: 'Gothic flame talisman', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Wisdom', description: 'Gothic wisdom idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Wisdom', description: 'Gothic wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Power', description: 'Gothic power charm', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Wisdom', description: 'Gothic wisdom statue', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Gothic', description: 'Gothic charm', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Shadows', description: 'Gothic shadow talisman', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Flame', description: 'Gothic flame charm', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Shadows', description: 'Gothic shadow relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Gothic time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Wisdom', description: 'Gothic wisdom relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Gothic', description: 'Gothic relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Wisdom', description: 'Gothic wisdom tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Time', description: 'Gothic time talisman', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Wisdom', description: 'Gothic wisdom relic', rarity: 'RARE', value: 120 },
    { name: 'Idol of Shadows', description: 'Gothic shadow idol', rarity: 'RARE', value: 120 },
    { name: 'Relic of Flame', description: 'Gothic flame relic', rarity: 'RARE', value: 120 },
    { name: 'Statue of Gothic', description: 'Gothic statue', rarity: 'LEGENDARY', value: 400 },

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
    { name: 'Idol of Flame', description: 'Cloud Kingdom flame idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Cloud Kingdom', description: 'Cloud Kingdom statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Totem of Wisdom', description: 'Cloud Kingdom wisdom totem', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Wisdom', description: 'Cloud Kingdom wisdom relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Shadows', description: 'Cloud Kingdom shadow relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Time', description: 'Cloud Kingdom time tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Power', description: 'Cloud Kingdom power idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Talisman of Power', description: 'Cloud Kingdom power talisman', rarity: 'RARE', value: 120 },
    { name: 'Statue of Wisdom', description: 'Cloud Kingdom wisdom statue', rarity: 'RARE', value: 120 },
    { name: 'Charm of Shadows', description: 'Cloud Kingdom shadow charm', rarity: 'RARE', value: 120 },
    { name: 'Idol of Flame', description: 'Cloud Kingdom flame idol', rarity: 'LEGENDARY', value: 400 },
    { name: 'Tablet of Flame', description: 'Cloud Kingdom flame tablet', rarity: 'LEGENDARY', value: 400 },
    { name: 'Statue of Cloud Kingdom', description: 'Cloud Kingdom statue', rarity: 'MYTHIC', value: 1200 },

    // Obsidian Wastes (Dark Realm) Items
    { name: 'Tablet of Shadows', description: 'Dark Realm shadow tablet', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Dark Realm', description: 'Dark Realm charm', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Dark Realm', description: 'Dark Realm idol', rarity: 'COMMON', value: 10 },
    { name: 'Statue of Flame', description: 'Dark Realm flame statue', rarity: 'COMMON', value: 10 },
    { name: 'Totem of Wisdom', description: 'Dark Realm wisdom totem', rarity: 'COMMON', value: 10 },
    { name: 'Talisman of Flame', description: 'Dark Realm flame talisman', rarity: 'COMMON', value: 10 },
    { name: 'Relic of Wisdom', description: 'Dark Realm wisdom relic', rarity: 'COMMON', value: 10 },
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
    { name: 'Statue of Dark Realm', description: 'Dark Realm statue', rarity: 'LEGENDARY', value: 400 },
    { name: 'Idol of Dark Realm', description: 'Dark Realm idol', rarity: 'LEGENDARY', value: 400 },

    // Astral Caverns (Cosmic) Items
    { name: 'Idol of Time', description: 'Cosmic time idol', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Time', description: 'Cosmic time idol', rarity: 'COMMON', value: 10 },
    { name: 'Charm of Wisdom', description: 'Cosmic wisdom charm', rarity: 'COMMON', value: 10 },
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
    { name: 'Tablet of Wisdom', description: 'Divine wisdom tablet', rarity: 'COMMON', value: 10 },
    { name: 'Idol of Power', description: 'Divine power idol', rarity: 'COMMON', value: 10 },
    { name: 'Tablet of Divine', description: 'Divine tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Shadows', description: 'Divine shadow relic', rarity: 'UNCOMMON', value: 40 },
    { name: 'Tablet of Power', description: 'Divine power tablet', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Power', description: 'Divine power charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Idol of Flame', description: 'Divine flame idol', rarity: 'UNCOMMON', value: 40 },
    { name: 'Statue of Divine', description: 'Divine statue', rarity: 'UNCOMMON', value: 40 },
    { name: 'Charm of Time', description: 'Divine time charm', rarity: 'UNCOMMON', value: 40 },
    { name: 'Relic of Time', description: 'Divine time relic', rarity: 'RARE', value: 120 },
    { name: 'Relic of Power', description: 'Divine power relic', rarity: 'RARE', value: 120 },
    { name: 'Totem of Divine', description: 'Divine totem', rarity: 'LEGENDARY', value: 400 },
    { name: 'Idol of Power', description: 'Divine power idol', rarity: 'LEGENDARY', value: 400 },
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

  // Create zone-item relationships with drop rates
  const zoneItems = [
    // Jungle Ruins (Aztec) - Level 1
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Aztec', dropRate: 0.4 },
    { zoneName: 'Jungle Ruins', itemName: 'Statue of Flame', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Relic of Time', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Shadows', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Talisman of Flame', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Totem of Power', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Statue of Shadows', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Wisdom', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Time', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Wisdom', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Coin of Aztec', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Totem of Aztec', dropRate: 0.3 },
    { zoneName: 'Jungle Ruins', itemName: 'Coin of Aztec', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Coin of Wisdom', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Shadows', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Totem of Aztec', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Coin of Power', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Relic of Wisdom', dropRate: 0.2 },
    { zoneName: 'Jungle Ruins', itemName: 'Talisman of Flame', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Statue of Time', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Power', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Totem of Wisdom', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Idol of Time', dropRate: 0.1 },
    { zoneName: 'Jungle Ruins', itemName: 'Charm of Flame', dropRate: 0.05 },
    { zoneName: 'Jungle Ruins', itemName: 'Coin of Power', dropRate: 0.05 },
    { zoneName: 'Jungle Ruins', itemName: 'Tablet of Power', dropRate: 0.01 },

    // Frozen Crypt (Norse) - Level 11
    { zoneName: 'Frozen Crypt', itemName: 'Charm of Shadows', dropRate: 0.4 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Norse', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Wisdom', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Power', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Idol of Flame', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Flame', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Tablet of Flame', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Totem of Power', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Talisman of Norse', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Tablet of Time', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Charm of Wisdom', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Power', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Tablet of Wisdom', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Talisman of Wisdom', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Time', dropRate: 0.3 },
    { zoneName: 'Frozen Crypt', itemName: 'Idol of Norse', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Norse', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Talisman of Norse', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Power', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Power', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Wisdom', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Tablet of Norse', dropRate: 0.2 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Power', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Shadows', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Shadows', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Statue of Power', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Shadows', dropRate: 0.1 },
    { zoneName: 'Frozen Crypt', itemName: 'Talisman of Wisdom', dropRate: 0.05 },
    { zoneName: 'Frozen Crypt', itemName: 'Relic of Wisdom', dropRate: 0.05 },
    { zoneName: 'Frozen Crypt', itemName: 'Coin of Flame', dropRate: 0.01 }
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