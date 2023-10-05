declare module "@waylaidwanderer/chatgpt-api" {
  export class BingAIClient {
    constructor(options: BingAIClientOptions);

    setOptions(options: BingAIClientOptions): void;

    sendMessage(
      message: string,
      options?: BingAIClientSendMessageOptions
    ): Promise<BingAIClientResponse>;

    uploadImage(imageBase64: string): Promise<string>;
  }

  interface BingAIClientOptions {
    host?: string;
    userToken?: string;
    cookies?: string;
    proxy?: string;
    debug?: boolean;
    cache: { store: Keyv<any, { table: string; busyTimeout: number }> };
  }

  interface BingAIClientSendMessageOptions {
    jailbreakConversationId?: boolean | string;
    conversationId?: string;
    encryptedConversationSignature?: string;
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
    messageId?: string;
    conversationId: string;
    encryptedConversationSignature: string;
    clientId: string;
    invocationId: number;
    conversationExpiryTime: string;
    response: string;
    details: BingAIClientResponseDetails;
  }

  interface BingAIClientResponseDetails {
    text: string;
    author: string;
    createdAt: string;
    timestamp: string;
    messageId: string;
    requestId: string;
    offense: string;
    adaptiveCards: AdaptiveCard[];
    sourceAttributions: SourceAttribution[];
    feedback: Feedback;
    contentOrigin: string;
    scores: Score[];
    suggestedResponses: SuggestedResponse[];
  }

  interface AdaptiveCard {
    type: string;
    version: string;
    body: any[];
  }

  interface SourceAttribution {
    providerDisplayName: string;
    seeMoreUrl: string;
    searchQuery?: string;
    provider: string;
    imageLink?: string;
    imageWidth?: string;
    imageHeight?: string;
    imageFavicon?: string;
    sourceType?: string;
  }

  interface Feedback {
    tag: string | null;
    updatedOn: string | null;
    type: string;
  }

  interface Score {
    component: string;
    score: number;
  }

  interface SuggestedResponse {
    text: string;
    author: string;
    createdAt: string;
    timestamp: string;
    messageId: string;
    messageType: string;
    offense: string;
    feedback: Feedback;
    contentOrigin: string;
  }
}
