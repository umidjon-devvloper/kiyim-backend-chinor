// Test script to verify notification endpoints
import fetch from 'node-fetch';

const API_URL = 'https://kiyim-backend-chinor-production-beab.up.railway.app';

async function testNotificationEndpoints() {
  console.log('🧪 Testing notification endpoints...\n');

  // Test 1: Health check
  try {
    const health = await fetch(`${API_URL}/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return;
  }

  console.log('\n⚠️  To test FCM token endpoint, you need a valid JWT token.');
  console.log('Please login first and then run this test with the token.');
  console.log('\nExample endpoint to test:');
  console.log(`PUT ${API_URL}/api/user/fcm-token`);
  console.log('Body: { "fcmToken": "ExponentPushToken[...]" }');
  console.log('Headers: { "Authorization": "Bearer YOUR_JWT_TOKEN" }');
}

testNotificationEndpoints();
