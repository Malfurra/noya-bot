const axios = require('axios');
axios.get('https://i.ibb.co/S36j9mX/avatar-contact.png', { responseType: 'arraybuffer' })
    .then(res => console.log('Success:', res.status))
    .catch(err => console.log('Error:', err.message));
