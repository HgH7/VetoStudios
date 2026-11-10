import type { Metadata } from 'next';
import { LangProvider } from '@/components/LangProvider';
import './globals.css';

export const metadata: Metadata = { title: 'VETO / REFUSE BASIC', description: 'VETO belt prototype' };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en"><body><LangProvider>{children}</LangProvider></body></html>; }
