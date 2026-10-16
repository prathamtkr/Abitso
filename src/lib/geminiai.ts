import { GoogleGenAI } from "@google/genai";
import { Embeddings } from "@langchain/core/embeddings";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is required but not found in environment variables");
}

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSION = 768;
const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenAI({ apiKey });

export const GEMINI_CONFIG = {
  model: EMBEDDING_MODEL,
  dimension: EMBEDDING_DIMENSION,
};

class GeminiEmbeddings extends Embeddings {
  private async embedTexts(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY") {
    const response = await genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: texts,
      config: {
        taskType,
        outputDimensionality: EMBEDDING_DIMENSION,
      },
    });

    const embeddings = response.embeddings?.map((embedding) => embedding.values ?? []);
    if (!embeddings || embeddings.length !== texts.length) {
      throw new Error(`Gemini returned an unexpected embedding count for ${EMBEDDING_MODEL}`);
    }

    for (const embedding of embeddings) {
      if (embedding.length !== EMBEDDING_DIMENSION) {
        throw new Error(
          `Gemini ${EMBEDDING_MODEL} returned ${embedding.length} dimensions; expected ${EMBEDDING_DIMENSION}`
        );
      }
    }

    return embeddings;
  }

  embedDocuments(documents: string[]) {
    return this.embedTexts(documents, "RETRIEVAL_DOCUMENT");
  }

  async embedQuery(document: string) {
    const [embedding] = await this.embedTexts([document], "RETRIEVAL_QUERY");
    return embedding;
  }
}

export const createEmbeddings = () => new GeminiEmbeddings({});

export const testGeminiConnection = async () => {
  const embedding = await createEmbeddings().embedQuery(
    "This is a test sentence for checking Gemini API connectivity."
  );

  console.log("Gemini embedding API test successful");
  console.log(`Embedding dimension: ${embedding.length}`);
  console.log(`Model: ${EMBEDDING_MODEL}`);
  return true;
};
