CREATE TABLE "PdfHighlight" (
    "id" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "normalized" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT 'Highlighted text',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileId" TEXT NOT NULL,

    CONSTRAINT "PdfHighlight_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PdfHighlight_fileId_pageNumber_idx" ON "PdfHighlight"("fileId", "pageNumber");

ALTER TABLE "PdfHighlight"
ADD CONSTRAINT "PdfHighlight_fileId_fkey"
FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
