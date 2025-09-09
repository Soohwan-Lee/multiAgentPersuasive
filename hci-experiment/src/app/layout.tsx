import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AbandonmentTracker } from '@/components/AbandonmentTracker';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multi-Agent Chat Experiment",
  description: "A study exploring decision-making after brief chats with multiple AI assistants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const idleMinutes = Number(process.env.NEXT_PUBLIC_IDLE_MINUTES || '30');
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* 세션 저장소에 있는 participantId를 AbandonmentTracker가 직접 읽도록 전달 생략 */}
        <AbandonmentTracker participantId={typeof window !== 'undefined' ? sessionStorage.getItem('participantId') : null} idleMinutes={idleMinutes} />
        {children}
      </body>
    </html>
  );
}
