import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import prisma from '@/db'
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { pinecone, PINECONE_INDEX_NAME, checkPineconeHealth } from '@/lib/pinecone';
import { PineconeStore } from "@langchain/pinecone";
import { getUserSubscriptionPlan } from "@/lib/stripe";
import { PLANS } from "@/config/stripe";
import { createEmbeddings, testGeminiConnection, GEMINI_CONFIG } from '@/lib/geminiai';

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  // This code runs on your server before upload
  const user = await getUser();

  if (!user || !user.id) throw new UploadThingError("Unauthorized");

  const subscriptionPlan = await getUserSubscriptionPlan();

  return { userId: user.id, subscriptionPlan };
}

const onUploadComplete = async ({ metadata, file }: {
  metadata: Awaited<ReturnType<typeof middleware>>, file: {
    key: string,
    name: string,
    ufsUrl: string,
}}) => {

  const isFileExists = await prisma.file.findFirst({
    where: {
      key: file.key
    }
  })

  if (isFileExists) {
    return;
  }
  
  const createdFile = await prisma.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: file.ufsUrl,
      uploadStatus: "PROCESSING"
    }
  })

  try {
    console.log(`Starting processing for file: ${file.name} (${file.key})`);
    
    const response = await fetch(file.ufsUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`File downloaded successfully, size: ${blob.size} bytes`);

    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    
    console.log(`PDF loaded with ${docs.length} pages`);

    const pagesAmount = docs.length;

    const { subscriptionPlan } = metadata;
    const { isSubscribed } = subscriptionPlan;

    const isProExceeded = pagesAmount > PLANS.find(plan => plan.name === "Pro")!.pagesPerPdf;
    const isFreeExceeded = pagesAmount > PLANS.find(plan => plan.name === "Free")!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (!isSubscribed && isFreeExceeded)) {
      console.log(`Page limit exceeded: ${pagesAmount} pages (${isSubscribed ? 'Pro' : 'Free'} plan)`);
      await prisma.file.update({
        data: { uploadStatus: "FAILED" },
        where: { id: createdFile.id }
      });
      return;
    }

    // Validate environment variables and services
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not set in environment variables");
    }
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not set in environment variables");
    }

    console.log(`Starting vectorization for ${docs.length} documents...`);
    console.log(`Using embedding model: ${GEMINI_CONFIG.model}`);
    console.log(`Expected embedding dimension: ${GEMINI_CONFIG.dimension}`);

    // Test connections before processing
    await testGeminiConnection();

    const pineconeHealthy = await checkPineconeHealth(PINECONE_INDEX_NAME);
    if (!pineconeHealthy) {
      throw new Error(`Pinecone index '${PINECONE_INDEX_NAME}' is not accessible. Please check your configuration.`);
    }

    // vectorise and index entire document
    const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);
    const embeddings = createEmbeddings();

    // Process documents in smaller chunks to avoid memory and API rate limit issues
    const chunkSize = 5; // Smaller chunks for better reliability
    let totalProcessed = 0;
    
    for (let i = 0; i < docs.length; i += chunkSize) {
      const chunk = docs.slice(i, i + chunkSize);
      const chunkEnd = Math.min(i + chunkSize, docs.length);
      console.log(`Processing documents ${i + 1}-${chunkEnd} of ${docs.length}`);
      
      try {
        await PineconeStore.fromDocuments(
          chunk,
          embeddings, 
          {
            pineconeIndex,
            namespace: createdFile.id,
            textKey: 'text', // Ensure text field mapping
          }
        );
        
        totalProcessed += chunk.length;
        console.log(`Successfully processed chunk ${Math.floor(i / chunkSize) + 1}, total: ${totalProcessed}/${docs.length}`);
        
        // Add delay between chunks to respect API limits
        if (i + chunkSize < docs.length) {
          console.log(`Waiting 2 seconds before next chunk...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (chunkError) {
        console.error(`Error processing chunk ${i + 1}-${chunkEnd}:`, chunkError);
        throw new Error(`Failed to process documents chunk ${i + 1}-${chunkEnd}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`);
      }
    }

    console.log(`Successfully vectorized and indexed ${docs.length} documents to Pinecone`);
    
    await prisma.file.update({
      data: {
        uploadStatus: "SUCCESS"
      },
      where: {
        id: createdFile.id
      }
    })
    
    console.log(`File processing completed successfully: ${file.name}`);
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileId: createdFile.id,
      fileName: file.name
    });
    
    await prisma.file.update({
      data: { 
        uploadStatus: "FAILED"
      },
      where: { id: createdFile.id }
    });
    
    // Re-throw the error so it can be handled by UploadThing
    throw error;
  }
}

export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: "4MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: "16MB" } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;