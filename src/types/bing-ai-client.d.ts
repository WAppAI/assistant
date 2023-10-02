declare module "@waylaidwanderer/chatgpt-api" {
  export class BingAIClient {
    constructor(options: BingAIClientOptions);

    setOptions(options: BingAIClientOptions): void;

    sendMessage(
      message: string,
      options?: BingAIClientSendMessageOptions
    ): Promise<BingAIClientResponse>;
  }

  interface BingAIClientOptions {
    host?: string;
    userToken?: string;
    cookies?: string;
    proxy?: string;
    debug?: boolean;
  }

  interface BingAIClientSendMessageOptions {
    jailbreakConversationId?: boolean | string;
    conversationId?: string;
    conversationSignature?: string;
    clientId?: string;
    toneStyle?: "balanced" | "creative" | "precise" | "fast";
    invocationId?: number;
    systemMessage?: string;
    context?: string;
    parentMessageId?: string;
    onProgress?: (progress: string) => void;
  }

  interface BingAIClientResponse {
    jailbreakConversationId?: string;
    conversationId: string;
    conversationSignature: string;
    clientId: string;
    invocationId: number;
    conversationExpiryTime: string;
    response: string;
    details: any;
  }
}
