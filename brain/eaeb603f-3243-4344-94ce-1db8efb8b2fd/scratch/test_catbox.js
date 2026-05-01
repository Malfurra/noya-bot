const axios = require('axios');
axios.get('https://files.catbox.moe/6v0m18.png', { responseType: 'arraybuffer' })
    .then(res => console.log('Success:', res.status))
    .catch(err => console.log('Error:', err.message));
