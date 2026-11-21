import type { Metadata } from 'next';
import type { Viewport } from 'next';
import { LangProvider } from '@/components/LangProvider';
import './globals.css';

export const metadata: Metadata = {
 title:'VETO / REFUSE BASIC',
 description:'VETO belt prototype',
 icons:{icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="%23111"/><text x="32" y="43" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="%23d9d8d3">V</text></svg>'}
};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#d9d8d3'};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:"document.documentElement.classList.add('js')"}} /></head><body><LangProvider>{children}</LangProvider></body></html>; }
