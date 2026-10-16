import { Pinecone } from "@pinecone-database/pinecone";

// Validate environment variables
if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is required but not found in environment variables");
}

export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!
  // Do NOT include 'environment' in v5+ (uses serverless by default)
});

// Get index name from environment or use default
export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || "lexinote";

// Function to check if Pinecone index exists and is ready
export const checkPineconeHealth = async (indexName: string = PINECONE_INDEX_NAME) => {
  try {
    const index = pinecone.Index(indexName);
    const stats = await index.describeIndexStats();
    console.log(`🔍 Pinecone index '${indexName}' stats:`, stats);
    console.log(`📊 Total vectors: ${stats.totalRecordCount || 0}`);
    return true;
  } catch (error) {
    console.error(`❌ Pinecone health check failed for index '${indexName}':`, error);
    return false;
  }
};

// Function to get or create Pinecone index
export const getPineconeIndex = (indexName: string = PINECONE_INDEX_NAME) => {
  return pinecone.Index(indexName);
};