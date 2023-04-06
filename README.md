## Introduction

This project utilizes [waylaidwanderer/node-chatgpt-api](https://github.com/waylaidwanderer/node-chatgpt-api/)'s BingAIClient (see [here](https://github.com/waylaidwanderer/node-chatgpt-api/blob/main/demos/use-bing-client.js)) to generate conversational responses to user queries. This chatbot is designed to work with WhatsApp, making it easy for users to interact with Bing AI's "jailbroken" alter-ego, Sydney, using the popular messaging platform.

## Getting Started

### Prerequisites

To chat with Sydney, you will need:

- Node.js >= 18.15.0
- a spare WhatsApp number (chatting with yourself is not ideal, but I plan on implementing that soon)

### Installation

1. Clone this repository
```
git clone https://github.com/veigamann/sydney-whatsapp-chatbot.git
```

2. Install the dependencies
```
yarn install
```

3. Copy [.env.example](../master/.env.example) to a new file called `.env`
```
cp .env.example .env
```

4. Edit `.env`'s `BING_TOKEN` environment variable to the `_U` cookie value from [bing.com](https://bing.com)

   **Note:** You must be logged in your Microsoft account AND have access to Bing Chat.

5. Start the bot
```
yarn start
```

6. Connect your WhatsApp account to the bot by scanning the generated QR Code in the CLI.

    **Note:** You likely won't need to ever scan the QR Code again, as WhatsApp session data is persisted in the `./puppeteer` folder (created in the root directory right after you scan the QR Code).
  
7. Send a message to your WhatsApp account to start a conversation with Sydney!

## Demo 

https://user-images.githubusercontent.com/50471205/230191169-2e3bff68-2b25-4e32-a0d0-43270570403a.mp4


## Usage

Sydney is designed to respond to natural language queries from users. You can ask Sydney questions, or just have a casual conversation. Here are some example queries that Sydney can respond to:

- "What is the weather like in Sydney today?"
- "Tell me a joke"
- "Can you recommend a good Italian restaurant?"
- "What's the meaning of life?"

Conversations with Sydney will be stored on the `./conversations_cache.sqlite` file (created automatically after Sydney's first response to a new chat).

### Available commands

- `!help`: Shows you a little help message withe the available commands.
- `!ping`: Tells you if the bot is still running.
- `!tone args?`: Lets you check the current tone that Sydney is replying. `args` can be either `creative`, `balanced` or `precise`. I personally suggest `creative`. If you don't pass `args`, the bot will reply with the current configured tone and the available options.
- `!pending`: Gives you a list of the prompts that you made and Sydney hasn't replied yet. Since we can't edit sent messages in WhatsApp, and by consequence we can't stream Sydney's responses token by token, this is useful to know if Sydney is still thinking on your past messages.
- `!reset`: Deletes the current conversation history. Sydney will lose all of it's context and won't remember past messages.

## Caveats

- The `!tone` command uses a plain JS object to store Sydney's tone. That means the tone is global for every chat you have with Sydney. If UserA and UserB are talking with Sydney, and UserA sends a `!tone balanced` command, UserB's tone will also be affected. This is very simple to resolve by storing the tone within the conversation history in the Keyv adapter to sqlite, but truth is I didnt bother to do this yet.
- I have seen reports of overusage, resulting in a temporary "ban" (kind of) to Bing Chat. That means your account will temporarily (or for an undetermined amount of time) lose access to Bing, so you'll need to make a new account and change the BING_TOKEN env variable.

## Contributing
If you'd like to contribute to Sydney, please fork this repository and submit a pull request. We welcome contributions of all types, from bugfixes to new features.

## License
This project is licensed under the MIT License - see the LICENSE file for details.


