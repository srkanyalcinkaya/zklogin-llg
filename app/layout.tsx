"use client"
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const inter = Inter({ subsets: ['latin'] });


const { networkConfig } = createNetworkConfig({
  devnet: { url: getFullnodeUrl("devnet") },
});
const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networkConfig} network="devnet">
            <AuthProvider>{children}</AuthProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}