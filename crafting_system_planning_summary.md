# Relic Raider - Complete Loot Table & Crafting System Planning

## Overview
This document provides a comprehensive breakdown of all obtainable items in Relic Raider, organized by source type, rarity, and zone. Use this information to design a crafting system that allows players to combine items for better rarity, craft gear, and create high-value items.

## Item Sources

### 1. Zone Exploration Items
Items found during exploration of different zones. Drop rates and quantities vary by rarity.

**Drop Rate Structure:**
- **COMMON**: 60% chance, 3-8 items
- **UNCOMMON**: 30% chance, 2-5 items  
- **RARE**: 8% chance, 1-3 items
- **LEGENDARY**: 1.5% chance, 1-2 items
- **MYTHIC**: 0.5% chance, 1 item

**Zone Value Modifiers:**
- Jungle Ruins (Level 1-10): 1.0x (baseline)
- Frozen Crypt (Level 11-20): 1.3x (+30% value)
- Mirage Dunes (Level 21-30): 1.6x (+60% value)
- Sunken Temple (Level 31-40): 2.0x (+100% value)
- Volcanic Forge (Level 41-50): 2.5x (+150% value)
- Twilight Moor (Level 51-60): 3.0x (+200% value)
- Skyreach Spires (Level 61-70): 3.5x (+250% value)
- Obsidian Wastes (Level 71-80): 4.0x (+300% value)
- Astral Caverns (Level 81-90): 4.5x (+350% value)
- Ethereal Sanctum (Level 91-100): 5.0x (+400% value)

### 2. Beast Loot Drops
Items dropped by defeating beasts in battle. All beasts drop 100% of their loot table.

**Beast Rarity Loot Tiers:**
- **UNCOMMON**: 3-6 common + 2-3 uncommon items
- **RARE**: 4-7 common + 3-4 uncommon + 2-3 rare items
- **LEGENDARY**: 5-8 common + 3-5 uncommon + 3-4 rare + 2-3 legendary items
- **MYTHIC**: 6-10 common + 4-6 uncommon + 3-5 rare + 3-4 legendary + 2-3 mythic items

**Additional Drop Chances:**
- **UNCOMMON**: 25% rare, 10% legendary, 2% mythic
- **RARE**: 30% legendary, 15% mythic
- **LEGENDARY**: 35% mythic
- **MYTHIC**: 50% legendary

### 3. Boss Loot Drops
Special items dropped by zone bosses. Bosses get 2x loot multiplier.

**Boss-Specific Items:**
Each boss has a unique mythic item (25% drop rate) and its fragment (50% drop rate).

## Item Categories by Rarity

### COMMON Items (Base Value: 10)
**Zone Exploration Items:**
- All zones have 12-15 common items each
- Examples: Tablet of [Zone], Statue of [Element], Coin of [Zone], etc.

**Beast Loot Items:**
- Beast Claw (15 value)
- Frayed Hide (15 value)
- Mossy Charm (15 value)
- Cracked Fang (15 value)

### UNCOMMON Items (Base Value: 40)
**Zone Exploration Items:**
- All zones have 6-8 uncommon items each
- Examples: Relic of [Zone], Talisman of [Element], etc.

**Beast Loot Items:**
- Uncommon Relic Shard (45 value)
- Duskwalker Idol (45 value)
- Bone Carving (45 value)
- Runed Talisman (45 value)
- Sealed Coin (45 value)

### RARE Items (Base Value: 120)
**Zone Exploration Items:**
- All zones have 4-6 rare items each
- Examples: Idol of [Element], Statue of [Element], etc.

**Beast Loot Items:**
- Rare Beast Fang (125 value)
- Echoing Horn (125 value)
- Fireheart Gem (125 value)
- Runic Blade (125 value)

### LEGENDARY Items (Base Value: 400)
**Zone Exploration Items:**
- All zones have 2-3 legendary items each
- Examples: Charm of [Element], Coin of [Element], etc.

**Beast Loot Items:**
- Ancient Beast Core (405 value)
- Primal Totem (405 value)

**Boss Fragment Items:**
- [Boss Name] Fragment (500 value)

### MYTHIC Items (Base Value: 1200)
**Zone Exploration Items:**
- All zones have 1 mythic item each
- Examples: Tablet of [Element], Coin of [Element], etc.

**Beast Loot Items:**
- Mythic Beast Bone (1205 value)
- Ethereal Relic (1205 value)
- Shard of Ascension (1205 value)
- Veilstone (1205 value)
- Astral Sigil (1205 value)

**Boss-Specific Items:**
- Crown of Vaelith (2000 value) - Jungle Ruins Boss
- Heart of the Frozen Titan (2000 value) - Frozen Crypt Boss
- Scarab of the Mirage King (2000 value) - Mirage Dunes Boss
- Tear of the Deep (2000 value) - Sunken Temple Boss
- Core of the Forge Wyrm (2000 value) - Volcanic Forge Boss
- Veil of the Moor Queen (2000 value) - Twilight Moor Boss
- Feather of the Sky God (2000 value) - Skyreach Spires Boss
- Obsidian Soulbrand (2000 value) - Obsidian Wastes Boss
- Starforged Eye (2000 value) - Astral Caverns Boss
- Halo of the Divine Sentinel (2000 value) - Ethereal Sanctum Boss

## Crafting System Recommendations

### 1. Item Combination Recipes
**Common + Common = Uncommon**
- Combine 3-5 common items of the same zone/element
- Example: 3 "Tablet of Aztec" + 2 "Statue of Flame" = "Relic of Aztec"

**Uncommon + Uncommon = Rare**
- Combine 2-3 uncommon items of the same zone/element
- Example: 2 "Duskwalker Idol" + 1 "Runed Talisman" = "Rare Beast Fang"

**Rare + Rare = Legendary**
- Combine 2 rare items of the same zone/element
- Example: "Fireheart Gem" + "Echoing Horn" = "Ancient Beast Core"

**Legendary + Legendary = Mythic**
- Combine 2 legendary items of the same zone/element
- Example: "Ancient Beast Core" + "Primal Totem" = "Mythic Beast Bone"

### 2. Boss Fragment Crafting
**Fragment + Fragment = Boss Item**
- Combine 3-5 boss fragments to create the full boss item
- Example: 3 "Crown of Vaelith Fragment" = "Crown of Vaelith"

### 3. Cross-Zone Crafting
**Zone-Specific Combinations**
- Combine items from different zones to create unique items
- Example: "Tablet of Aztec" + "Coin of Norse" + "Charm of Egyptian" = "Cross-Realm Artifact"

### 4. Gear Crafting System
**Weapon Crafting:**
- Combine "Runic Blade" + "Fireheart Gem" + "Ancient Beast Core" = "Flameforged Sword"
- Combine "Echoing Horn" + "Primal Totem" + "Mythic Beast Bone" = "Primal Warhorn"

**Armor Crafting:**
- Combine "Frayed Hide" + "Beast Claw" + "Bone Carving" = "Beast Hide Armor"
- Combine "Ethereal Relic" + "Veilstone" + "Astral Sigil" = "Ethereal Plate"

**Accessory Crafting:**
- Combine "Mossy Charm" + "Sealed Coin" + "Duskwalker Idol" = "Lucky Charm"
- Combine "Shard of Ascension" + "Boss Fragment" + "Mythic Item" = "Ascension Amulet"

### 5. High-Value Item Crafting
**Relic Fusion:**
- Combine 5 mythic items from different zones = "Omnirelic"
- Combine all boss fragments = "Master Key"

**Elemental Artifacts:**
- Combine all flame-related items = "Eternal Flame"
- Combine all shadow-related items = "Shadow Veil"
- Combine all time-related items = "Chronometer"

## Implementation Notes

### Database Schema Additions Needed:
1. **Crafting Recipes Table**
   - Recipe ID, Name, Description
   - Required items and quantities
   - Result item and quantity
   - Crafting cost (coins)
   - Required level

2. **Crafting Stations Table**
   - Station ID, Name, Location
   - Required items to unlock
   - Available recipes

3. **Player Crafting Progress Table**
   - Player ID, Recipe ID
   - Times crafted, mastery level

### Command Structure:
- `/craft` - Open crafting interface
- `/craft recipe [recipe_name]` - View specific recipe
- `/craft station [station_name]` - Access specific crafting station
- `/craft create [recipe_name]` - Craft an item

### UI Considerations:
- Recipe browser with filtering by zone, rarity, item type
- Ingredient highlighting (owned vs needed)
- Success rate display based on player level
- Crafting animation and results display
- Recipe discovery system

This comprehensive loot table provides the foundation for a rich crafting system that encourages exploration, collection, and strategic item combination across all zones and rarities. 