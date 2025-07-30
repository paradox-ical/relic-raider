// Centralized emoji configuration
// Update this file when new emojis are uploaded to the dev portal

// New custom emojis from Discord developer portal
const RARITY_EMOJIS = {
  'COMMON': '<:statueflamecommon:1399403069212590220>',      // Statue of Flames Common
  'UNCOMMON': '<:statueflameuncommon:1399403101634695309>',  // Statue of Flames Uncommon
  'RARE': '<:statueflamerare:1399403135738318879>',          // Statue of Flames Rare
  'LEGENDARY': '<:statueflamelegendary:1399403168860737699>', // Statue of Flames Legendary
  'MYTHIC': '<:statueflamemythic:1399403212812980379>',      // Statue of Flames Mythic
  'ASCENDED': '<:statueflamemythic:1399403212812980379>'     // Using Mythic for Ascended (or add specific ascended emoji)
};

// Brush emojis for cooldown reduction items
const BRUSH_EMOJIS = {
  'COMMON': '<:frayedstrawbrush:1399400654480605265>',       // Frayed Straw Brush
  'UNCOMMON': '<:wornboarbristlebrush:1399400694246670417>', // Worn Boar Bristle Brush
  'RARE': '<:polishedwoodbrush:1399400777029652520>',        // Polished Wood Brush
  'LEGENDARY': '<:ivroybrush:1399400847754137670>',          // Ivory Brush
  'MYTHIC': '<:quartzbrush:1399400957233860730>',            // Quartz Brush
  'ASCENDED': '<:phoenixbrush:1399400986262372403>',         // Phoenix Brush
  'CELESTIAL': '<:celestialbrush:1399401106303614996>'       // Celestial Dust Brush
};

// Map emojis for drop rate boost items
const MAP_EMOJIS = {
  'COMMON': '<:tatteredmap:1399401260146364466>',            // Tattered Map
  'UNCOMMON': '<:leatherscroll:1399401301623832617>',        // Leather Scroll
  'RARE': '<:silkchart:1399401338810536028>',                // Silk Chart
  'LEGENDARY': '<:crystalatlas:1399401391239331840>',        // Crystal Atlas
  'MYTHIC': '<:crystalatlas:1399401391239331840>',           // Using Crystal Atlas for Mythic
  'ASCENDED': '<:crystalatlas:1399401391239331840>'          // Using Crystal Atlas for Ascended
};

// Talisman of Flames emojis
const TALISMAN_EMOJIS = {
  'COMMON': '<:talismanflamescommon:1399402568412565554>',   // Talisman of Flames Common
  'UNCOMMON': '<:talismanflamesuncommon:1399402616126967958>', // Talisman of Flames Uncommon
  'RARE': '<:talismanflamesrare:1399402658862727229>',       // Talisman of Flames Rare
  'LEGENDARY': '<:talismanflameslegendary:1399402726508724345>', // Talisman of Flames Legendary
  'MYTHIC': '<:talismanflamesmythic:1399402756137156768>',   // Talisman of Flames Mythic
  'ASCENDED': '<:talismanflamesmythic:1399402756137156768>'  // Using Mythic for Ascended
};

// Aztec Tablet emojis
const TABLET_EMOJIS = {
  'COMMON': '<:tabletazteccommon:1399403517864706078>',      // Aztec Tablet Common
  'UNCOMMON': '<:tabletaztecuncommon:1399403601688002661>',  // Aztec Tablet Uncommon
  'RARE': '<:tabletaztecrare:1399403637985382541>',          // Aztec Tablet Rare
  'LEGENDARY': '<:tabletazteclegendary:1399403697384984576>', // Aztec Tablet Legendary
  'MYTHIC': '<:tabletaztecmythic:1399403739017908354>',      // Aztec Tablet Mythic
  'ASCENDED': '<:tabletaztecmythic:1399403739017908354>'     // Using Mythic for Ascended
};

// Statue of Time emojis
const STATUE_TIME_EMOJIS = {
  'COMMON': '<:statuetimecommon:1399403977887453204>',       // Statue of Time Common
  'UNCOMMON': '<:statuetimeuncommon:1399404128874270731>',   // Statue of Time Uncommon
  'RARE': '<:statuetimerare:1399404548249878678>',           // Statue of Time Rare
  'LEGENDARY': '<:statuetimelegendary:1399404584845443132>', // Statue of Time Legendary
  'MYTHIC': '<:statuetimemythic:1399404693427458081>',       // Statue of Time Mythic
  'ASCENDED': '<:statuetimemythic:1399404693427458081>'      // Using Mythic for Ascended
};

// Relic Wisdom emojis
const RELIC_WISDOM_EMOJIS = {
  'COMMON': '<:relicwisdomcommon:1399404781130485780>',      // Relic Wisdom Common
  'UNCOMMON': '<:relicwisdomuncommon:1399404808531742922>',  // Relic Wisdom Uncommon
  'RARE': '<:relicwisdomrare:1399404931982823444>',          // Relic Wisdom Rare
  'LEGENDARY': '<:relicwisdomlegendary:1399404967927873667>', // Relic Wisdom Legendary
  'MYTHIC': '<:relicwisdommythic:1399405001440493628>',      // Relic Wisdom Mythic
  'ASCENDED': '<:relicwisdommythic:1399405001440493628>'     // Using Mythic for Ascended
};

// Idol Time emojis
const IDOL_TIME_EMOJIS = {
  'COMMON': '<:idoltimecommon:1399405209415057459>',         // Idol Time Common
  'UNCOMMON': '<:idoltimeuncommon:1399405283599581234>',     // Idol Time Uncommon
  'RARE': '<:idoltimerare:1399405371138773072>',             // Idol Time Rare
  'LEGENDARY': '<:idoltimelegendary:1399405468811657317>',   // Idol Time Legendary
  'MYTHIC': '<:idoltimemythic:1399405634247725118>',         // Idol Time Mythic
  'ASCENDED': '<:idoltimemythic:1399405634247725118>'        // Using Mythic for Ascended
};

// Totem Aztec emojis
const TOTEM_AZTEC_EMOJIS = {
  'COMMON': '<:totemazteccommon:1399405680141668475>',       // Totem Aztec Common
  'UNCOMMON': '<:totemaztecuncommon:1399405732734173356>',   // Totem Aztec Uncommon
  'RARE': '<:totemaztecrare:1399405810857283655>',           // Totem Aztec Rare
  'LEGENDARY': '<:totemazteclegendary:1399405861092331721>', // Totem Aztec Legendary
  'MYTHIC': '<:totemaztecmythic:1399405901227753602>',       // Totem Aztec Mythic
  'ASCENDED': '<:totemaztecmythic:1399405901227753602>'      // Using Mythic for Ascended
};

// Tablet Shadow emojis
const TABLET_SHADOW_EMOJIS = {
  'COMMON': '<:tabletshadowcommon:1399405981015998575>',     // Tablet Shadow Common
  'UNCOMMON': '<:tabletshadowuncommon:1399406021923049472>', // Tablet Shadow Uncommon
  'RARE': '<:tabletshadowrare:1399406078269325515>',         // Tablet Shadow Rare
  'LEGENDARY': '<:tabletshadowlegendary:1399406121768189994>', // Tablet Shadow Legendary
  'MYTHIC': '<:tabletshadowmythic:1399406153359949875>',     // Tablet Shadow Mythic
  'ASCENDED': '<:tabletshadowmythic:1399406153359949875>'    // Using Mythic for Ascended
};

// Idol Power emojis
const IDOL_POWER_EMOJIS = {
  'COMMON': '<:idolpowercommon:1399406210796490913>',        // Idol Power Common
  'UNCOMMON': '<:idolpoweruncommon:1399406242790641664>',    // Idol Power Uncommon
  'RARE': '<:idolpowerrare:1399406297073324094>',            // Idol Power Rare
  'LEGENDARY': '<:idolpowerlegendary:1399406396616740936>',  // Idol Power Legendary
  'MYTHIC': '<:idolpowermythic:1399406422088749076>',        // Idol Power Mythic
  'ASCENDED': '<:idolpowermythic:1399406422088749076>'       // Using Mythic for Ascended
};

// Totem Wisdom emojis
const TOTEM_WISDOM_EMOJIS = {
  'COMMON': '<:totemwisdomcommon:1399406477281591409>',      // Totem Wisdom Common
  'UNCOMMON': '<:totemwisdomuncommon:1399406517521875055>',  // Totem Wisdom Uncommon
  'RARE': '<:totemwisdomrare:1399406557636198590>',          // Totem Wisdom Rare
  'LEGENDARY': '<:totemwisdomlegendary:1399406614837985352>', // Totem Wisdom Legendary
  'MYTHIC': '<:totemwisdommythic:1399406643560579184>',      // Totem Wisdom Mythic
  'ASCENDED': '<:totemwisdommythic:1399406643560579184>'     // Using Mythic for Ascended
};

// Relic Time emojis
const RELIC_TIME_EMOJIS = {
  'COMMON': '<:relictimecommon:1399406687726735370>',        // Relic Time Common
  'UNCOMMON': '<:relictimeuncommon:1399406706743836682>',    // Relic Time Uncommon
  'RARE': '<:relictimerare:1399406750200762429>',            // Relic Time Rare
  'LEGENDARY': '<:relictimelegendary:1399406771130597426>',  // Relic Time Legendary
  'MYTHIC': '<:relictimemythic:1399406791011602474>',        // Relic Time Mythic
  'ASCENDED': '<:relictimemythic:1399406791011602474>'       // Using Mythic for Ascended
};

// Get emoji for a given rarity (default to statue emojis for general items)
function getRarityEmoji(rarity) {
  return RARITY_EMOJIS[rarity] || RARITY_EMOJIS['COMMON'];
}

// Get brush emoji for a given rarity
function getBrushEmoji(rarity) {
  return BRUSH_EMOJIS[rarity] || BRUSH_EMOJIS['COMMON'];
}

// Get map emoji for a given rarity
function getMapEmoji(rarity) {
  return MAP_EMOJIS[rarity] || MAP_EMOJIS['COMMON'];
}

// Get talisman emoji for a given rarity
function getTalismanEmoji(rarity) {
  return TALISMAN_EMOJIS[rarity] || TALISMAN_EMOJIS['COMMON'];
}

// Get tablet emoji for a given rarity
function getTabletEmoji(rarity) {
  return TABLET_EMOJIS[rarity] || TABLET_EMOJIS['COMMON'];
}

// Get statue of time emoji for a given rarity
function getStatueTimeEmoji(rarity) {
  return STATUE_TIME_EMOJIS[rarity] || STATUE_TIME_EMOJIS['COMMON'];
}

// Get relic wisdom emoji for a given rarity
function getRelicWisdomEmoji(rarity) {
  return RELIC_WISDOM_EMOJIS[rarity] || RELIC_WISDOM_EMOJIS['COMMON'];
}

// Get idol time emoji for a given rarity
function getIdolTimeEmoji(rarity) {
  return IDOL_TIME_EMOJIS[rarity] || IDOL_TIME_EMOJIS['COMMON'];
}

// Get totem aztec emoji for a given rarity
function getTotemAztecEmoji(rarity) {
  return TOTEM_AZTEC_EMOJIS[rarity] || TOTEM_AZTEC_EMOJIS['COMMON'];
}

// Get tablet shadow emoji for a given rarity
function getTabletShadowEmoji(rarity) {
  return TABLET_SHADOW_EMOJIS[rarity] || TABLET_SHADOW_EMOJIS['COMMON'];
}

// Get idol power emoji for a given rarity
function getIdolPowerEmoji(rarity) {
  return IDOL_POWER_EMOJIS[rarity] || IDOL_POWER_EMOJIS['COMMON'];
}

// Get totem wisdom emoji for a given rarity
function getTotemWisdomEmoji(rarity) {
  return TOTEM_WISDOM_EMOJIS[rarity] || TOTEM_WISDOM_EMOJIS['COMMON'];
}

// Get relic time emoji for a given rarity
function getRelicTimeEmoji(rarity) {
  return RELIC_TIME_EMOJIS[rarity] || RELIC_TIME_EMOJIS['COMMON'];
}

// Get the appropriate emoji based on item name and rarity
function getItemEmoji(itemName, rarity) {
  const name = itemName.toLowerCase();
  
  // Map item names to their specific emoji sets
  if (name === 'tablet of aztec') {
    return getTabletEmoji(rarity);
  }
  if (name === 'tablet of shadows') {
    return getTabletShadowEmoji(rarity);
  }
  if (name === 'tablet of power') {
    return getTabletEmoji(rarity); // Use Aztec Tablet emojis for Tablet of Power
  }
  if (name === 'relic of wisdom') {
    return getRelicWisdomEmoji(rarity);
  }
  if (name === 'relic of time') {
    return getRelicTimeEmoji(rarity);
  }
  if (name === 'idol of time') {
    return getIdolTimeEmoji(rarity);
  }
  if (name === 'idol of power') {
    return getIdolPowerEmoji(rarity);
  }
  if (name === 'totem of aztec') {
    return getTotemAztecEmoji(rarity);
  }
  if (name === 'totem of wisdom') {
    return getTotemWisdomEmoji(rarity);
  }
  if (name === 'statue of time') {
    return getStatueTimeEmoji(rarity);
  }
  if (name === 'talisman of flames') {
    return getTalismanEmoji(rarity);
  }
  
  // Brush items - use specific brush emojis
  if (name === 'frayed straw brush') {
    return '<:frayedstrawbrush:1399400654480605265>';
  }
  if (name === 'worn boar bristle brush') {
    return '<:wornboarbristlebrush:1399400694246670417>';
  }
  if (name === 'polished wood brush') {
    return '<:polishedwoodbrush:1399400777029652520>';
  }
  if (name === 'bronze detail brush') {
    return '<:bronzebrush:1399430619863449610>';
  }
  if (name === 'ivory precision brush') {
    return '<:ivroybrush:1399400847754137670>';
  }
  if (name === 'quartz fiber brush') {
    return '<:quartzbrush:1399400957233860730>';
  }
  if (name === 'phoenix feather brush') {
    return '<:phoenixbrush:1399400986262372403>';
  }
  if (name === 'celestial dust brush') {
    return '<:celestialbrush:1399401106303614996>';
  }
  
  // Map items - use specific map emojis
  if (name === 'tattered parchment') {
    return '<:tatteredmap:1399401260146364466>';
  }
  if (name === 'leather scroll') {
    return '<:leatherscroll:1399401301623832617>';
  }
  if (name === 'silk chart') {
    return '<:silkchart:1399401338810536028>';
  }
  if (name === 'crystal atlas') {
    return '<:crystalatlas:1399401391239331840>';
  }
  
  // Generic brush/map fallbacks
  if (name.includes('brush')) {
    return getBrushEmoji(rarity);
  }
  if (name.includes('map') || name.includes('chart') || name.includes('scroll') || name.includes('atlas') || name.includes('parchment')) {
    return getMapEmoji(rarity);
  }
  
  // Default to statue emojis for other items
  return getRarityEmoji(rarity);
}

// Get all rarity emojis
function getAllRarityEmojis() {
  return RARITY_EMOJIS;
}

module.exports = {
  RARITY_EMOJIS,
  BRUSH_EMOJIS,
  MAP_EMOJIS,
  TALISMAN_EMOJIS,
  TABLET_EMOJIS,
  STATUE_TIME_EMOJIS,
  RELIC_WISDOM_EMOJIS,
  IDOL_TIME_EMOJIS,
  TOTEM_AZTEC_EMOJIS,
  TABLET_SHADOW_EMOJIS,
  IDOL_POWER_EMOJIS,
  TOTEM_WISDOM_EMOJIS,
  RELIC_TIME_EMOJIS,
  getRarityEmoji,
  getBrushEmoji,
  getMapEmoji,
  getTalismanEmoji,
  getTabletEmoji,
  getStatueTimeEmoji,
  getRelicWisdomEmoji,
  getIdolTimeEmoji,
  getTotemAztecEmoji,
  getTabletShadowEmoji,
  getIdolPowerEmoji,
  getTotemWisdomEmoji,
  getRelicTimeEmoji,
  getItemEmoji,
  getAllRarityEmojis
}; 