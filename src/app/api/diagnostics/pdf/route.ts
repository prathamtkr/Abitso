import { NextRequest } from "next/server";
import { checkPineconeHealth, PINECONE_INDEX_NAME } from "@/lib/pinecone";
import { testGeminiConnection, GEMINI_CONFIG } from "@/lib/geminiai";

export async function GET(request: NextRequest) {
  try {
    console.log("Running PDF processing diagnostics...");
    
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET',
        PINECONE_API_KEY: process.env.PINECONE_API_KEY ? 'SET' : 'NOT SET',
        PINECONE_INDEX_NAME: PINECONE_INDEX_NAME,
        NODE_ENV: process.env.NODE_ENV,
      },
      geminiConfig: {
        model: GEMINI_CONFIG.model,
        dimension: GEMINI_CONFIG.dimension,
      },
      tests: {
        geminiConnection: false,
        pineconeConnection: false,
      },
      geminiConnectionError: undefined as string | undefined,
    };

    // Test Gemini connection
    try {
      diagnostics.tests.geminiConnection = await testGeminiConnection();
    } catch (error) {
      console.error("Gemini test failed:", error);
      diagnostics.geminiConnectionError =
        error instanceof Error ? error.message : "Unknown Gemini connection error";
    }

    // Test Pinecone connection
    try {
      diagnostics.tests.pineconeConnection = await checkPineconeHealth();
    } catch (error) {
      console.error("Pinecone test failed:", error);
    }

    return Response.json(diagnostics, { status: 200 });
    
  } catch (error: any) {
    return Response.json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}