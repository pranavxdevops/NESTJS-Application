import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@shared/config/config.service";
import OpenAI from "openai";

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOpenaiApiKey() || "",
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.configService.getOpenaiModel();

      const response = await this.openai.embeddings.create({
        model,
        input: text.replace(/\n/g, " ").trim(),
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const model = this.configService.getOpenaiModel();
      const cleanedTexts = texts.map((text) => text.replace(/\n/g, " ").trim());

      const response = await this.openai.embeddings.create({
        model,
        input: cleanedTexts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      this.logger.error("Error generating embeddings:", error);
      throw new Error("Failed to generate embeddings");
    }
  }
}
