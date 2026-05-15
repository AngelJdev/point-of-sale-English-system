const https = require('https');

https.get('https://loremflickr.com/400/400/brakepad', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers['location']); // Should be a 302 redirect
});
