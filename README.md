# WhatsAppSydney: Your BingAI-powered WhatsApp Assistant

This GitHub repository showcases a chatbot named Sydney, powered by the [waylaidwanderer/node-chatgpt-api](https://github.com/waylaidwanderer/node-chatgpt-api) BingAIClient. Sydney is a versatile AI assistant that remains continuously connected to the internet, enabling it to provide users with reliable and up-to-date information. Leveraging the capabilities of the BingAI jailbreak, Sydney delivers accurate responses by harnessing the vast resources available online. The best part is that the API used in this project is completely free, allowing you to enjoy the benefits of an internet-connected chatbot without any associated charges.

|                          Screenshot 1                           |                          Screenshot 2                           |                          Screenshot 3                           |
| :-------------------------------------------------------------: | :-------------------------------------------------------------: | :-------------------------------------------------------------: |
| ![Screenshot 1](/demos/Screenshot_20230604_204741_WhatsApp.jpg) | ![Screenshot 2](/demos/Screenshot_20230604_205104_WhatsApp.jpg) | ![Screenshot 3](/demos/Screenshot_20230604_215518_WhatsApp.jpg) |

# Table of Contents

- [WhatsAppSydney: Your BingAI-powered WhatsApp Assistant](#whatsappsydney-your-bingai-powered-whatsapp-assistant)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Test the Chatbot](#test-the-chatbot)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Usage](#usage)
    - [Voice Messages](#voice-messages)
    - [Group Chat](#group-chat)
    - [Available commands](#available-commands)
  - [Contribute](#contribute)
  - [Hire Us](#hire-us)

## Features

- [x] Engage in conversations with Sydney, powered by the BingAI jailbreak
- [x] Group chat compatibility
- [x] Voice message capability (Sydney listens to messages)
- [ ] Create reminders
- [ ] PDF and OCR reading
- [ ] Image generation

## Getting Started

### Test the Chatbot

You can test the Sydney chatbot by sending a message to the following WhatsApp account: [Sydney AI](https://wa.me/4915237793520). Feel free to ask questions or engage in a conversation with Sydney to experience its capabilities.

**NOTE:** !tone are disabled for the public bot. For privacy reasons, we also strongly recommend self-hosting it.

_(Audio Transcription has been activated for an indefinite time)_

### Prerequisites

To chat with Sydney, you will need:

- Node.js >= 18.15.0
- A spare WhatsApp number (chatting with yourself is not ideal, but also works)
- FFMPEG must be installed in order to use audio transcription **(OPTIONAL)**.

### Installation

You can configure the project automatically by running either the `setup.bat` file (for Windows) or the `setup.sh` file (for Ubuntu/Debian).

Alternatively, you have the option to perform a manual installation by following the steps below:

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

4. Edit `.env`'s `BING_COOKIES` environment variable to the `cookies` string from [bing.com](https://bing.com) GET request header

To obtain the cookies string, perform the following steps:

- Open the developer tools in your browser (by pressing `F12` or right-clicking anywhere and selecting `Inspect element`).
- Select the `Network` tab within the devtools.
- Ensure you're logged in to [Bing](https://bing.com) using your Microsoft account.
- With the devtools panel open, press `F5` to reload the page.
- Locate the first listed network request (a GET request to the [bing.com](https://bing.com) endpoint/url).
- Right-click on the `cookie` value in the request headers and select the "Copy value" option.
- Paste the the copied value into the `BING_COOKIES` environment variable in the `.env` file.

**Note:** If you did this and it worked, skip to step 5. If not, try step 4.1
**Note:** You don't need to specify both `BING_COOKIES` and `BING_TOKEN`. In fact, if you specify both, `BING_COOKIES` will be the preferred method. If that's not working, comment the `BING_COOKIES` line and leave only `BING_TOKEN`.

4.1 Edit `.env`'s `BING_TOKEN` environment variable to the `_U` cookie value from [bing.com](https://bing.com)

To get the `_U` cookie, follow these steps:

- Log in to [Bing](https://bing.com) using your Microsoft account.
- Open the developer tools in your browser (by pressing `F12` or right-clicking anywhere and selecting `Inspect element`).
- Select the `Storage` tab and click on the `Cookies` option to view all cookies associated with the website.
- Look for the `_U` cookie and click on it to expand its details.
- Copy the value of the `_U` cookie (it should look like a long string of letters and numbers).

**Note:** While specifying cookies is no longer mandatory in the latest `waylaidwanderer/node-chatgpt-api` update, we do recommende providing them. Occasional stability issues have been observed when those were not configured, and having them ensures a more reliable experience.

5. Start the bot

```
yarn dev
```

6. Connect your WhatsApp account to the bot by scanning the generated QR Code in the CLI.

   **Note:** You likely won't need to ever scan the QR Code again, as WhatsApp session data is persisted in the `./puppeteer` folder (created in the root directory right after you scan the QR Code).

7. Send a message to your WhatsApp account to start a conversation with Sydney!

## Usage

Sydney is designed to respond to natural language queries from users. You can ask Sydney questions, or just have a casual conversation.

### Voice Messages

To utilize voice messages, make sure you have FFMPEG installed on your machine and an OpenAI API key. Please note that using the voice transcription API (Whisper AI) provided by OpenAI comes with a cost of US$0.06 per 10 minutes.

Once you have installed FFMPEG and obtained your OpenAI API key, you will need to place the key in the `.env` file under the `OPENAI_API_KEY` variable. Additionally, set `TRANSCRIPTION_ENABLED` to `"TRUE"`. After restarting the bot, you can proceed to utilize it.

### Group Chat

To utilize it in a group chat, you will need to either mention it by using her username with the "@" symbol (e.g., @Sydney) or reply directly to her last message.

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

Both creators of this project, [Veigamann](https://github.com/veigamann) and [Luisotee](https://github.com/Luisotee), are currently seeking new job opportunities.

- [Veigamann](https://github.com/veigamann) is seeking a junior position.
- [Luisotee](https://github.com/Luisotee) is actively looking for an internship or junior developer position.

If you have any job opportunities, please feel free to contact us through the emails provided in our GitHub profiles.
