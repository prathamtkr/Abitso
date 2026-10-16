import Navbar from "@/components/Navbar";
import Providers from "@/components/Providers";
import { cn, constructMetadata } from "@/lib/utils";
import "@uploadthing/react/styles.css";
import { Manrope } from "next/font/google";
import 'react-loading-skeleton/dist/skeleton.css';
import "simplebar-react/dist/simplebar.min.css";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata = constructMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen font-sans antialiased", manrope.variable)}>
        
        <Providers>
          {/* Keep Server Component as a child; Next.js supports passing Server Components through Client wrappers */}
           <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
