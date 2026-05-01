const axios = require('axios');
axios.get('https://i.ibb.co/3pY8D0H/avatar-contact.png', { responseType: 'arraybuffer' })
    .then(res => console.log('Success:', res.status))
    .catch(err => console.log('Error:', err.message));
