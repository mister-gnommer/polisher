export interface PolishOptions {
  apiKey: string;
  inputText: string;
  systemPrompt: string;
  model?: string;
}

export interface PolisherProvider {
  id: string;
  name: string;
  modelSource: "fixed" | "user";
  polish(options: PolishOptions): Promise<string>;
}
