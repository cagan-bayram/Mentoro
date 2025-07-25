import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/Header";
import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "Mentoro - Connect with Mentors",
  description: "Learn from expert mentors in any subject",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen bg-gray-50">
            {children}
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
} 