# Abitso

Abitso is an AI-assisted PDF workspace. Upload and organize documents, read and annotate PDFs, and ask questions about a document from an in-context assistant.

## Features

- **PDF library:** Upload PDFs, review processing status, search and manage files from the dashboard.
- **Document chat:** Ask questions about an uploaded PDF and get responses grounded in retrieved document content.
- **PDF reader:** Navigate pages, zoom, rotate, and view documents full screen.
- **Highlights and notes:** Add color highlights, attach notes, revisit saved annotations, and manage highlights from the document workspace.
- **Document assistance:** Switch between chat, summary, and key-points views.
- **Account and preferences:** Sign in with Kinde, manage profile and appearance settings, and choose light, dark, or system theme.
- **Plans and billing:** View Free and Pro plans and manage Stripe-backed subscriptions.

## Technology

- Next.js 14 App Router, React 18, and TypeScript
- Tailwind CSS, Radix UI, and Lucide icons
- tRPC and TanStack Query for typed application APIs
- Prisma and PostgreSQL for application data
- Kinde for authentication
- UploadThing for PDF uploads
- LangChain, Google Gemini for document embeddings and AI, and Pinecone for vector search
- Stripe for subscriptions
- Vercel-compatible deployment

## Getting started

### Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL
- Accounts and API credentials for the external services used by the features you enable (Kinde, Google AI, Pinecone, and UploadThing; Stripe for billing)

### 1. Clone and install

```bash
git clone https://github.com/prathamtkr/Abitso.git
cd Abitso
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root. Put your own credentials in the file; do not commit it.

```env
# PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"

# Kinde authentication
KINDE_CLIENT_ID=""
KINDE_CLIENT_SECRET=""
KINDE_ISSUER_URL="https://YOUR_KINDE_DOMAIN"
KINDE_SITE_URL="http://localhost:3000"
KINDE_POST_LOGOUT_REDIRECT_URL="http://localhost:3000"
KINDE_POST_LOGIN_REDIRECT_URL="http://localhost:3000/dashboard"

# Google AI and Pinecone (PDF processing, embeddings, and chat)
GOOGLE_API_KEY=""
PINECONE_API_KEY=""
PINECONE_INDEX_NAME="lexinote"

# UploadThing
UPLOADTHING_TOKEN=""

# Stripe (required for subscription checkout and webhooks)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_MONTHLY_PRICE_ID=""
STRIPE_PRO_YEARLY_PRICE_ID=""
STRIPE_PRO_MONTHLY_PRICE_ID_PRODUCTION=""
STRIPE_PRO_YEARLY_PRICE_ID_PRODUCTION=""

# Optional: canonical site URL used when constructing absolute URLs
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Configure the Kinde application callback URLs for your local site and the production domain. Create the Pinecone index with **768 dimensions** to match the configured `gemini-embedding-001` embeddings. If the index already contains vectors created with a different embedding model or dimension, re-index documents before using semantic retrieval.

Stripe price IDs are selected by environment: local development uses the test price IDs, and production uses the `*_PRODUCTION` IDs. The Pro plan is configured for CAD $5 monthly or CAD $45 yearly.

### 3. Generate Prisma client and prepare the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production application |
| `npm start` | Start the production server after building |
| `npm run lint` | Run the Next.js ESLint checks |
| `npx prisma generate` | Generate the Prisma client |
| `npx prisma db push` | Synchronize the Prisma schema with the database |

## Project layout

```text
src/
  app/                    Next.js routes, pages, and API handlers
    api/                  tRPC, chat, uploads, Stripe webhooks, diagnostics
    dashboard/            Document library, PDF workspace, settings, billing
    pricing/              Plan comparison and upgrade entry points
  components/
    chat/                 Assistant and chat interface
    ui/                   Reusable UI components
    DocumentWorkspace.tsx PDF and assistant workspace
    PdfRenderer.tsx       PDF rendering and annotation tools
    Navbar.tsx            Responsive authenticated/public navigation
  config/                 Pricing and query configuration
  db/                     Prisma client
  lib/                    AI, upload, Stripe, and shared helpers
  trpc/                   Typed API router and request context
prisma/
  schema.prisma           PostgreSQL data models
  migrations/             Database migrations
```

## Document processing overview

1. An authenticated user uploads a PDF through UploadThing.
2. The upload handler extracts and chunks PDF content, generates Gemini embeddings, and indexes the content in Pinecone.
3. File metadata, processing status, chat messages, user preferences, and PDF highlights are stored in PostgreSQL through Prisma.
4. The assistant retrieves relevant document content to provide context for questions about that PDF.

## Plans

The pricing page currently describes these configured limits:

| Plan | Upload quota | Maximum PDF pages | Maximum PDF size |
| --- | ---: | ---: | ---: |
| Free | 10 | 10* | 4 MB |
| Pro | 70 | 35 | 16 MB |

Pro billing is configured at CAD $5 per month or CAD $45 per year. Confirm your Stripe price configuration and deployment environment before enabling live checkout.

*The Free plan pricing page currently describes an 8-page limit, while the upload processor enforces a 10-page limit. The table reflects the processing configuration; align these values if the intended product limit changes.

## API surface

The application uses a tRPC router at `/api/trpc` for authenticated file, settings, message, highlight, and subscription operations. Additional Next.js handlers include:

- `/api/uploadthing` for file uploads
- `/api/message` for document chat
- `/api/webhooks/stripe` for Stripe events
- `/api/diagnostics/pdf` for PDF processing diagnostics (disabled in production)

## Deployment

Deploy to a Next.js-compatible host such as Vercel:

1. Provision PostgreSQL and configure all required environment variables in the hosting provider.
2. Configure Kinde callback URLs, UploadThing, Google AI, and Pinecone for the deployment domain.
3. Configure Stripe test or live price IDs and the webhook endpoint for the matching environment.
4. Build with `npm run build` and run database setup as appropriate for your release process.

Never commit `.env.local` or publish API credentials.

## Contributing

1. Create a branch for your change.
2. Keep changes focused and follow the existing TypeScript and component patterns.
3. Run the relevant lint, type-check, or build commands.
4. Update this README when setup steps, integrations, or user-facing capabilities change.
5. Submit a pull request with a concise description and validation notes.

## License

No license file is currently included. Contact the repository owner before redistributing this project.
