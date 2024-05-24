# WhatsApp AI Assistant

Welcome to the WhatsApp AI Assistant repository, where you'll find a remarkable WhatsApp chatbot designed to function as your very own AI-powered personal assistant. This chatbot leverages the power of Language Model (LLM) technology.


|                                                 Sydney                                                 | OpenRouter Models* |
| :----------------------------------------------------------------------------------------------------: | :----------------: |
| <video src="https://github.com/WAppAI/assistant/assets/50471205/5d300910-099d-4ceb-9f87-0852389a4c5b"> |  <video  src="https://github.com/WAppAI/assistant/assets/50471205/e8e8aabe-9ef7-4e3e-b0dc-156071c425f8">    |

## Feature Comparison

| Feature                     | Sydney (BingAI Jailbreak) | OpenRouter Models* |
| :-------------------------- | :-----------------------: | :----------------: |
| Google/Bing Searching       |             ✅             |         ✅          |
| Google Calendar             |             ❌             |         ✅          |
| Gmail                       |             ❌             |         ❌          |
| Communication Capability    |             ✅             |         ✅          |
| Group Chat Compatibility    |             ✅             |         ✅          |
| Voice Message Capability    |             ✅             |         ✅          |
| Create Basic Text Reminders |             ✅             |         ❌          |
| Image Recognition           |             ✅             |         ❌          |
| Image Generation            |             ❌             |         ✅          |
| PDF Reading                 |             ❌             |         ❌          |

**NOTE:** We do not test every LLM that OpenRouter provides. Typically, we only test OpenAI GPT-3.5 and Google Gemini Pro.

**NOTE:** Currently, GPT has a significant better performance than others due to it's agent type.

## Getting Started

### Prerequisites

- Node.js >= 18.15.0
- Node.js version >= 20.x.x users you should use `node --loader ts-node/esm src/index.ts` instead of `pnpm start`
- A spare WhatsApp number 

### Installation

<details>
<summary><b>Sydney/BingChat</b></summary>
<br>

1. Clone this repository

```
git clone https://github.com/WAppAI/assistant.git
```

2. Install the dependencies

```
pnpm install
```

3. Rename [.env.example](../master/.env.example) to `.env`

```
cp .env.example .env
```

4. Login with your Bing account and edit `.env`'s `BING_COOKIES` environment variable to the cookies string from [bing.com](https://bing.com). For detailed instructions [here](https://github.com/danny-avila/LibreChat/issues/370#issuecomment-1560382302).

   **NOTE:** Occasionally, you might encounter an error stating, `User needs to solve CAPTCHA to continue.` To resolve this issue, please solve the captcha [here]https://www.bing.com/turing/captcha/challenge, while logged in with the same account associated with your BING_COOKIES.

5. Read and fill in the remaining information in the `.env` file.

6. Run 

```
pnpm build
```

7. Start the bot

```
pnpm start
```

8. Connect your WhatsApp account to the bot by scanning the generated QR Code in the CLI.

9. Send a message to your WhatsApp account to start a conversation with Sydney!

</details>

<details>
<summary><b>OpenRouter</b></summary>
<br>

1. Clone this repository

```
git clone https://github.com/WAppAI/assistant.git
```

2. Install the dependencies

```
pnpm install
```

3. Rename [.env.example](../master/.env.example) to `.env`

```
cp .env.example .env
```

4. Read and fill in the remaining information in the `.env` file.

5.  Instructions on how to use langchain tools like Google Calendar and search will be in the `.env`

6. Run 

```
pnpm build
```

6. Start the bot

```
pnpm start
```

7. Connect your WhatsApp account to the bot by scanning the generated QR Code in the CLI.

8. Send a message to your WhatsApp account to start a conversation with the bot!

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
     2. Modify the `.env` file by changing `TRANSCRIPTION_ENABLED` to `"true"`, `TRANSCRIPTION_METHOD` to `"local"`, and `"TRANSCRIPTION_MODEL"` with the name of the model you downloaded. While setting a language in `TRANSCRIPTION_LANGUAGE` is not mandatory, it is recommended for better performance.
</details>

### Group Chat

To utilize it in a group chat, you will need to either mention it by using her username with the "@" symbol (e.g., @Sydney) or reply directly to her last message.

### Available commands

- `!help`: Displays a message listing all available commands.
- `!help` followed by a specific command, e.g., `!help reset`: Provides detailed information about the selected command.
- If you wish to customize the command prefix, you can do so in the `.env` file to better suit your preferences.

## Contribute

Your contributions to Sydney are welcome in any form. Whether you'd like to:

- Report Issues: If you come across bugs or have ideas for new features, please open an issue to discuss and track these items.

- Submit Pull Requests (PRs): Feel free to contribute directly by opening pull requests. Your contributions are greatly appreciated and help improve Sydney.

- If you want us to add a tool from the js langchain open an issue asking for it.

Your involvement is valued, and you're encouraged to contribute in the way that suits you best.

## Hire Us

Both creators of this project, [Veigamann](https://github.com/veigamann) and [Luisotee](https://github.com/Luisotee), are currently seeking new job opportunities.

If you have any job opportunities, please feel free to contact us through the emails provided in our GitHub profiles.
