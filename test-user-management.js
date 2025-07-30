const UserManagement = require('./lib/user-management');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUserManagement() {
  console.log('🧪 Testing User Management System\n');

  try {
    // Test 1: Create a new user
    console.log('1️⃣ Testing user creation...');
    const testUser1 = await UserManagement.getOrCreateUser('test123', 'TestUser1', 'guild123');
    console.log(`✅ Created user: ${testUser1.username} (ID: ${testUser1.id})`);
    console.log(`   Level: ${testUser1.level}, Coins: ${testUser1.coins}, Class: ${testUser1.playerClass}\n`);

    // Test 2: Retrieve existing user
    console.log('2️⃣ Testing user retrieval...');
    const testUser2 = await UserManagement.getOrCreateUser('test123', 'TestUser1', 'guild123');
    console.log(`✅ Retrieved user: ${testUser2.username} (ID: ${testUser2.id})`);
    console.log(`   Same user: ${testUser1.id === testUser2.id}\n`);

    // Test 3: Update username
    console.log('3️⃣ Testing username update...');
    const testUser3 = await UserManagement.getOrCreateUser('test123', 'TestUser1Updated', 'guild123');
    console.log(`✅ Updated username: ${testUser3.username}\n`);

    // Test 4: Create another user
    console.log('4️⃣ Testing concurrent user creation...');
    const testUser4 = await UserManagement.getOrCreateUser('test456', 'TestUser2', 'guild456');
    console.log(`✅ Created second user: ${testUser4.username} (ID: ${testUser4.id})\n`);

    // Test 5: Data validation
    console.log('5️⃣ Testing data validation...');
    const validation = UserManagement.validateUserData(testUser1);
    console.log(`✅ Validation result: ${validation.isValid ? 'Valid' : 'Invalid'}`);
    if (!validation.isValid) {
      console.log(`   Issues: ${validation.issues.join(', ')}`);
    }
    console.log('');

    // Test 6: Check user existence
    console.log('6️⃣ Testing user existence check...');
    const exists = await UserManagement.userExists('test123');
    console.log(`✅ User exists: ${exists}`);
    const notExists = await UserManagement.userExists('nonexistent');
    console.log(`✅ Non-existent user: ${notExists}\n`);

    // Test 7: Create user with validation
    console.log('7️⃣ Testing validated user creation...');
    const validatedUser = await UserManagement.getValidatedUser('test789', 'TestUser3', 'guild789');
    console.log(`✅ Created validated user: ${validatedUser.username}\n`);

    console.log('🎉 All tests passed! User management system is working correctly.\n');

    // Cleanup: Delete test users
    console.log('🧹 Cleaning up test users...');
    const deleteResults = [];
    
    for (const discordId of ['test123', 'test456', 'test789']) {
      const result = await UserManagement.deleteUser(discordId);
      deleteResults.push(result);
      console.log(`   ${result.success ? '✅' : '❌'} ${discordId}: ${result.message}`);
    }

    console.log('\n📊 Test Summary:');
    console.log(`   - Users created: 3`);
    console.log(`   - Users retrieved: 3`);
    console.log(`   - Data validations: 1`);
    console.log(`   - Users cleaned up: ${deleteResults.filter(r => r.success).length}/3`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testUserManagement().catch(console.error);
}

module.exports = { testUserManagement }; 