# WhatsApp AI Assistant: Your AI-powered WhatsApp Assistant

Welcome to the WhatsApp AI Assistant repository, where you'll find a remarkable WhatsApp chatbot designed to function as your very own AI-powered personal assistant. This chatbot leverages the power of Language Model (LLM) technology. As of now, it only supports Bing Chat and the jailbreak for it, codenamed Sydney.


|                          Sydney                            |                          GPT 3.5                            |                          Claude                           |
| :-------------------------------------------------------------: | :-------------------------------------------------------------: | :-------------------------------------------------------------: |
| ![Screenshot 1](/demos/Screenshot_20230604_204741_WhatsApp.jpg) | ![Screenshot 2](/demos/Screenshot_20230604_215518_WhatsApp.jpg) | ![Screenshot 3](/demos/Screenshot_20230604_205104_WhatsApp.jpg) |

## Features

| Feature                       | Sydney (BingAI Jailbreak) | GPT 3.5                   | Claude                    |
|-------------------------------|---------------------------|---------------------------|---------------------------|
| Chatbot Interface             | ✅                        | ❌                        | ❌                        |
| Group Chat Compatibility      | ✅                        | ❌                        | ❌                        |
| Voice Message Capability      | ✅                        | ❌                        | ❌                        |
| Create Reminders              | ✅                        | ❌                        | ❌                        |
| Image Recognition             | ✅                        | ❌                        | ❌                        |
| PDF and OCR Reading           | ❌                        | ❌                        | ❌                        |
| Image Generation              | ❌                        | ❌                        | ❌                        |

## Getting Started

### Prerequisites

- Node.js >= 18.15.0
- A spare WhatsApp number (chatting with yourself is not ideal, but also works)

### Installation

<details>
<summary><b>Sydney/BingChat</b></summary>
<br>

1. Clone this repository

```
git clone https://github.com/veigamann/sydney-whatsapp-chatbot.git
```

2. Install the dependencies

```
pnpm install
```

3. Rename [.env.example](../master/.env.example) to `.env`

```
cp .env.example .env
```

4. Edit `.env`'s `BING_COOKIES` environment variable to the `cookies` string from [bing.com](https://bing.com) GET request header.

To obtain the cookies string, perform the following steps:

- Open the developer tools in your browser (by pressing `F12` or right-clicking anywhere and selecting `Inspect element`).
- Select the `Network` tab within the devtools.
- Ensure you're logged in to [Bing](https://bing.com) using your Microsoft account.
- With the devtools panel open, press `F5` to reload the page.
- Locate the first listed network request (a GET request to the [bing.com](https://bing.com) endpoint/url).
- Right-click on the `cookie` value in the request headers and select the "Copy value" option.
- Paste the the copied value into the `BING_COOKIES` environment variable in the `.env` file.

5. Start the bot

```
pnpm start
```

6. Connect your WhatsApp account to the bot by scanning the generated QR Code in the CLI.

   **Note:** You likely won't need to ever scan the QR Code again, as WhatsApp session data is persisted in the `./puppeteer` folder (created in the root directory right after you scan the QR Code).

7. Send a message to your WhatsApp account to start a conversation with Sydney!

</details>

## Usage

The AI's are designed to respond to natural language queries from users. You can ask them questions, or just have a casual conversation.

### Voice Messages

When dealing with voice messages, you have two options for transcription: utilizing the Whisper API or the local method. Each option has its own considerations, including cost and performance.

<details>
<summary><strong>Whisper API:</strong></summary>

   - **Cost:** Utilizing the Whisper API incurs a cost of US$0.06 per 10 minutes of audio.
   - **Setup:**
     1. Obtain an OpenAI API key and place it in the `.env` file under the `OPENAI_API_KEY` variable.
     2. Set `TRANSCRIPTION_ENABLED` to `"true"` and `TRANSCRIPTION_METHOD` to `"whisper-api"`. While setting a language in `TRANSCRIPTION_LANGUAGE` is not mandatory, it is recommended for better performance.
</details>
<details>
<summary><strong>Local Mode:</strong></summary>

   - **Cost:** The local method is free but may be slower and less precise.
   - **Setup:**
     1. Download a model of your choice from [here](https://huggingface.co/ggerganov/whisper.cpp/tree/main). Download any `.bin` file and place it in the `./whisper/models` folder.
     2. Modify the `.env` file by changing `TRANSCRIPTION_ENABLED` to `"true"`, `TRANSCRIPTION_METHOD` to `"local"`, and `"TRANSCRIPTION_MODEL"` with the name of the model you downloaded.
</details>

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
