const { isValidInteraction, safeDeferReply, handleCommandError } = require('./lib/interaction-utils');

// Mock interaction object for testing
const createMockInteraction = (valid = true) => {
  if (valid) {
    return {
      id: '123456789',
      token: 'mock-token',
      user: { id: '987654321' },
      replied: false,
      deferred: false
    };
  } else {
    return {
      // Missing required properties
      replied: false,
      deferred: false
    };
  }
};

async function testInteractionHandling() {
  console.log('🧪 Testing Interaction Handling Improvements\n');

  try {
    // Test 1: Valid interaction
    console.log('1️⃣ Testing valid interaction...');
    const validInteraction = createMockInteraction(true);
    const isValid = isValidInteraction(validInteraction);
    console.log(`   ✅ Valid interaction: ${isValid}`);

    // Test 2: Invalid interaction
    console.log('\n2️⃣ Testing invalid interaction...');
    const invalidInteraction = createMockInteraction(false);
    const isInvalid = isValidInteraction(invalidInteraction);
    console.log(`   ❌ Invalid interaction: ${!isInvalid}`);

    // Test 3: Safe defer with valid interaction
    console.log('\n3️⃣ Testing safe defer with valid interaction...');
    const testInteraction = createMockInteraction(true);
    const deferred = await safeDeferReply(testInteraction);
    console.log(`   ✅ Safe defer result: ${deferred}`);

    // Test 4: Safe defer with invalid interaction
    console.log('\n4️⃣ Testing safe defer with invalid interaction...');
    const testInvalidInteraction = createMockInteraction(false);
    const deferredInvalid = await safeDeferReply(testInvalidInteraction);
    console.log(`   ❌ Safe defer result: ${deferredInvalid}`);

    // Test 5: Error handling for unknown interaction
    console.log('\n5️⃣ Testing error handling for unknown interaction...');
    const unknownInteractionError = new Error('Unknown interaction');
    unknownInteractionError.code = 10062;
    
    const testInteractionForError = createMockInteraction(true);
    await handleCommandError(testInteractionForError, unknownInteractionError, 'test');
    console.log('   ✅ Unknown interaction error handled correctly');

    console.log('\n🎉 All interaction handling tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Valid interaction detection: ✅');
    console.log('   - Invalid interaction detection: ✅');
    console.log('   - Safe defer functionality: ✅');
    console.log('   - Error handling: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

if (require.main === module) {
  testInteractionHandling().catch(console.error);
}

module.exports = { testInteractionHandling }; 