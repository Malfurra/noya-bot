# Noya Store AI

Welcome to Noya Store AI! A smart, friendly, and reliable virtual assistant built to manage Noya Store operations smoothly. From taking care of WhatsApp community groups to providing a lovely customer service experience using advanced AI, Noya is here to make everything easier.

## Key Features

- Smart Customer Service: Powered by a hybrid AI (Groq Llama 3 and a local database) to answer customer inquiries naturally and politely.
- Personal Touch: Noya remembers customer preferences and facts to provide a sweet, personalized shopping experience.
- Automated Store Management: Automatically opens/closes store groups, manages catalogs, and sends scheduled morning or night greetings.
- Always Aware: Noya knows the exact real-time schedule and monitors server health to ensure she is always ready to help.

## Installation Guide

### Prerequisites
- Node.js v18 or higher
- MongoDB Atlas Account
- Groq API Key (gsk_...)

### Setup Steps

1. **Clone the Repository** Download the project files to your local machine or server.

    ```bash
    git clone https://github.com/username/noya-bot.git
    cd noya-bot
    ```

2. **Install Dependencies** Install all the necessary libraries and modules required for Noya to function.

    ```bash
    npm install
    ```

3. **Configure config.js** Open the `config.js` file and update it with your own credentials. Make sure to replace the placeholders with your actual data.

    ```javascript
    {
      mongoUrl: 'YOUR_MONGODB_URL_HERE',
      groqApiKey: 'YOUR_GROQ_API_KEY_HERE',
      ownerNumbers: ['YOUR_PHONE_NUMBER@s.whatsapp.net']
    }
    ```

4. **Launch the Bot** Fire up Noya and let her start working for your store.

    ```bash
    npm start
    ```

---
Thank you for trusting Noya with your store. Congratulations and have a wonderful day! >_<
