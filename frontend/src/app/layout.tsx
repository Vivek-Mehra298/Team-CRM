import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "TeamCRM | Premium SaaS CRM Workspace",
  description: "Enterprise-grade CRM with isolated tenant spaces, real-time chat, pipeline management, and advanced analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full light bg-background">
      <body className="min-h-full flex flex-col font-sans text-foreground antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
