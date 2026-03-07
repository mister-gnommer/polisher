export interface PolishOptions {
  apiKey: string;
  inputText: string;
  systemPrompt: string;
}

export interface PolisherProvider {
  id: string;
  name: string;
  polish(options: PolishOptions): Promise<string>;
}
