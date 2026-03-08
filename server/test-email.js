require('dotenv').config();
const { sendResetEmail } = require('./utils/email');

(async () => {
    console.log('Testing email...');
    const result = await sendResetEmail('jafolayan03@gmail.com', 'test-token');
    console.log('Send result:', result);
    process.exit(0);
})();
