'use client';

import type { Text, Lang } from './copy';

type Props = { t: Text; lang: Lang; onToggleLang: () => void; home?: boolean };

function Wordmark({home}:{home:boolean}) { return <a href={home?'#top':'/#top'} className="wordmark" aria-label="VETO home">VETO</a>; }

export default function SiteHeader({t,lang,onToggleLang,home=false}:Props) {
 const anchor=(id:string)=>home?`#${id}`:`/#${id}`;
 return <header><Wordmark home={home}/><nav><a href={anchor('belts')}>{t.belts}</a><a href={anchor('build')}>{t.build}</a><a href={anchor('size')}>{t.size}</a><a href={anchor('drop')}>{t.drop}</a><button className="lang" onClick={onToggleLang}>{lang==='en'?'ع':'EN'}</button></nav></header>;
}
