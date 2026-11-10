'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { Lang } from './copy';

type LangContextValue = { lang: Lang; setLang: (lang: Lang) => void };
const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
 const [lang,setLang]=useState<Lang>('en');
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  const stored=window.localStorage.getItem('veto-language');
  if(stored==='en'||stored==='ar')setLang(stored);
  setReady(true);
 },[]);
 useEffect(()=>{
  document.documentElement.lang=lang;
  document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    if(ready)window.localStorage.setItem('veto-language',lang);
 },[lang,ready]);
 return <LangContext.Provider value={{lang,setLang}}>{children}</LangContext.Provider>;
}

export function useLang() {
 const value=useContext(LangContext);
 if(!value)throw new Error('useLang must be used within LangProvider');
 return value;
}
