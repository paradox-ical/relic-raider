// Beast image mappings for Jungle Ruins region
const beastImages = {
  // Jungle Ruins beasts
  'Twisted Serpent of Aztec': 'https://i.imgur.com/a/hoWR9Vr.png',
  'Ancient Stalker of Aztec': 'https://i.imgur.com/o4t3za4.png',
  'Barbed Construct of Aztec': 'https://i.imgur.com/q1e4IKF.png', // Rare version
  'Savage Construct of Aztec': 'https://i.imgur.com/T95FlVw.png', // Legendary version
  'Colossus of Aztec': 'https://i.imgur.com/RCmk3sj.png', // Boss
  
  // Additional rarity variants (if the system needs to distinguish)
  // Note: The main beast names above will be used for all rarities
  // These are here for reference if needed later
  'Barbed Construct of Aztec (Legendary)': 'https://i.imgur.com/muaZEQn.png',
  'Savage Construct of Aztec (Mythic)': 'https://i.imgur.com/aNV01FJ.png',
  
  // Add more beasts as images become available
};

// Function to get beast image URL
function getBeastImage(beastName) {
  return beastImages[beastName] || null;
}

// Function to check if beast has a custom image
function hasBeastImage(beastName) {
  return beastImages.hasOwnProperty(beastName);
}

module.exports = {
  beastImages,
  getBeastImage,
  hasBeastImage
}; 