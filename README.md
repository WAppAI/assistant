# WhatsApp BingAI: Your BingAI-powered WhatsApp Assistant

This GitHub repository showcases a chatbot named Sydney, powered by the `waylaidwanderer/node-chatgpt-api`'s BingAIClient. Sydney is a versatile AI assistant that remains continuously connected to the internet, enabling it to provide users with reliable and up-to-date information. Leveraging the capabilities of the BingAI jailbreak, Sydney delivers accurate responses by harnessing the vast resources available online. The best part is that the API used in this project is completely free, allowing you to enjoy the benefits of an internet-connected chatbot without any associated charges.

Screenshot 1             | Screenshot 2             | Screenshot 3
:-------------------------:|:-------------------------:|:-------------------------:
![Screenshot 1](/demos/Screenshot_20230527_183419_WhatsApp.jpg) | ![Screenshot 2](/demos/Screenshot_20230527_184042_WhatsApp.jpg) | ![Screenshot 3](/demos/Screenshot_20230527_184050_WhatsApp.jpg)

## Features

- [x] Engage in conversations with Sydney, powered by the BingAI jailbreak
- [ ] Create reminders (Work-in-Progress)
- [ ] Group chat compatibility (It works but not optimal)
- [ ] PDF and OCR reading
- [ ] Voice message capability (Sydney listens to messages)
- [ ] Image generation


## Getting Started

### Prerequisites

To chat with Sydney, you will need:

- Node.js >= 18.15.0
- a spare WhatsApp number (chatting with yourself is not ideal, but also works)

### Installation

1. Clone this repository
```
git clone https://github.com/veigamann/sydney-whatsapp-chatbot.git
```

2. Install the dependencies
```
yarn install
```

3. Rename [.env.example](../master/.env.example) to `.env`
```
cp .env.example .env
```

4. Edit `.env`'s `BING_TOKEN` environment variable to the `_U` cookie value from [bing.com](https://bing.com)

    To get the `_U` cookie, follow these steps:
   - Log in to [Bing](https://bing.com) using your Microsoft account.
   - Open the developer tools in your browser (usually by pressing `F12` or right-clicking and selecting `Inspect element`).
   - Select the `Storage` tab and click on the `Cookies` option to view all cookies associated with the website.
   - Look for the `_U` cookie and click on it to expand its details.
   - Copy the value of the `_U` cookie (it should look like a long string of letters and numbers).

   **Note:** While specifying your API is no longer mandatory in the latest `waylaidwanderer/node-chatgpt-api` updates, it is strongly recommended to provide a valid API key. Occasional stability issues have been observed when an API key is not configured, and having one ensures a more reliable experience.

5. Start the bot
```
yarn dev
```

6. Connect your WhatsApp account to the bot by scanning the generated QR Code in the CLI.

    **Note:** You likely won't need to ever scan the QR Code again, as WhatsApp session data is persisted in the `./puppeteer` folder (created in the root directory right after you scan the QR Code).
  
7. Send a message to your WhatsApp account to start a conversation with Sydney!

## Usage

Sydney is designed to respond to natural language queries from users. You can ask Sydney questions, or just have a casual conversation.

Conversations with Sydney will be stored on the `./conversations_cache.sqlite` file (created automatically after Sydney's first response to a new chat).

### Available commands

- `!help`: Shows you a little help message withe the available commands.
- `!ping`: Tells you if the bot is still running.
- `!tone args?`: Lets you check the current tone that Sydney is replying. `args` can be either `creative`, `balanced` or `precise`. I personally suggest `creative`. If you don't pass `args`, the bot will reply with the current configured tone and the available options.
- `!pending`: Gives you a list of the prompts that you made and Sydney hasn't replied yet. Since we can't edit sent messages in WhatsApp, and by consequence we can't stream Sydney's responses token by token, this is useful to know if Sydney is still thinking on your past messages.
- `!reset`: Deletes the current conversation history. Sydney will lose all of it's context and won't remember past messages.

**Note**: The `!tone` command uses a shared JavaScript object to store Sydney's tone, making it global for all users. This means that if UserA modifies the tone using `!tone balanced`, it will also affect UserB's conversation. Currently, there is no implementation to store the tone within individual conversation histories.

## Contribute 
If you'd like to contribute to Sydney, please fork this repository and submit a pull request. We welcome contributions of all types, from bugfixes to new features.

- [Roadmap](https://github.com/users/veigamann/projects/1)
- [Open Issues](https://github.com/veigamann/sydney-whatsapp-chatbot/issues)
- [Open Pull Requests](https://github.com/veigamann/sydney-whatsapp-chatbot/pulls)

## Hire Us

Both creators of this project, [Veigamann](https://github.com/veigamann) and  [Luisotee](https://github.com/Luisotee), are currently seeking new job opportunities. 

- **Veigamann** is seeking a junior position.
- **Luisotee** is actively looking for an internship or junior developer position.

If you have any job opportunities, please feel free to contact us through the emails provided in our GitHub profiles.

