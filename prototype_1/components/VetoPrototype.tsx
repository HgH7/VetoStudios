'use client';

import gsap from 'gsap';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import outfits from '@/data/outfits.json';
import beltGeometry from '../public/belts/geometry.json';
import { getDrop, getMembers, getSizeChart } from '@/lib/data';

type Lang = 'en' | 'ar';
const copy = {
  en: { enter:'ENTER', nav:'MENU', belts:'BELTS', build:'BUILD', size:'SIZE', drop:'DROP', members:'MEMBERS', refuse:'REFUSE BASIC.', price:'EGP 1,900', finder:'FIND MY SIZE', add:'ADD TO WALL', waist:'WAIST', cm:'CM', inch:'IN', rec:'RECOMMENDED', hole:'USE HOLE', scenes:'SCENE', outfit:'OUTFIT', belt:'BELT', payment:'PAYMENT OPTIONS', cod:'CASH ON DELIVERY', card:'CARD', wallet:'MOBILE WALLET', join:'JOIN THE WALL', name:'YOUR NAME', hide:'HIDE ME FROM THE WALL', locked:'BUCKLE LOCKED', remaining:'UNITS REMAINING', starts:'DROP STARTS IN', live:'SIMULATED LIVE DATA', rule:['RULE 01: DON’T.','RULE 02: STAY SHARP.','RULE 03: KEEP IT CLEAN.'], choice:'CHOOSE A BELT', noWall:'YOUR NUMBER IS PRIVATE.' },
  ar: { enter:'ادخل', nav:'قائمة', belts:'الأحزمة', build:'ركّب', size:'المقاس', drop:'الإصدار', members:'الأعضاء', refuse:'ارفض العادي.', price:'١٩٠٠ ج.م', finder:'اعرف مقاسك', add:'أضف إلى الجدار', waist:'محيط الخصر', cm:'سم', inch:'بوصة', rec:'المقاس المقترح', hole:'استخدم الفتحة', scenes:'المشهد', outfit:'الملبس', belt:'الحزام', payment:'خيارات الدفع', cod:'الدفع عند الاستلام', card:'بطاقة', wallet:'محفظة إلكترونية', join:'انضم إلى الجدار', name:'اسمك', hide:'أخفني من الجدار', locked:'تم قفل البَكْلة', remaining:'قطعة متبقية', starts:'يبدأ الإصدار خلال', live:'بيانات تجريبية مباشرة', rule:['القاعدة ٠١: لا.','القاعدة ٠٢: كن حاداً.','القاعدة ٠٣: ابقَ نظيفاً.'], choice:'اختر حزاماً', noWall:'رقمك خاص.' }
} as const;
type Text = typeof copy.en | typeof copy.ar;

function Wordmark() { return <a href="#top" className="wordmark" aria-label="VETO home">VETO</a>; }

const entryAssets = [
 '/belts/red/belt-red-entry-left-noprong.webp',
 '/belts/red/belt-red-entry-right.webp',
 '/belts/entry-prong.webp',
 '/belts/red/belt-red-entry-left-noprong.webp',
];

function LockIcon({open,shackleRef}:{open:boolean;shackleRef:React.RefObject<SVGPathElement|null>}) { return <svg className="lock-icon" viewBox="0 0 24 24" aria-hidden="true"><path ref={shackleRef} className={open?'is-open':''} d="M7 10V7a5 5 0 0 1 10 0v2"/><rect x="4" y="10" width="16" height="11" rx="1"/></svg>; }

function Entry({onEnter, t}:{onEnter:()=>void;t:Text}) {
 const [assetsReady, setAssetsReady] = useState(false);
 const [failedAssets, setFailedAssets] = useState<string[]>([]);
 const [unlocked, setUnlocked] = useState(false);
 const [reducedMotion, setReducedMotion] = useState(false);
 const [lockOpen, setLockOpen] = useState(false);
 const originRef = useRef<HTMLDivElement|null>(null);
 const leftRef = useRef<HTMLDivElement|null>(null);
 const buckleRef = useRef<HTMLDivElement|null>(null);
 const tailRef = useRef<HTMLImageElement|null>(null);
 const prongRef = useRef<HTMLImageElement|null>(null);
 const shadowRef = useRef<HTMLDivElement|null>(null);
 const shackleRef = useRef<SVGPathElement|null>(null);
 const timelineRef = useRef<gsap.core.Timeline|null>(null);

 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>setReducedMotion(media.matches);
  update();
  media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[]);

 useEffect(()=>{
  let cancelled=false;
  const failures:string[]=[];
  Promise.all(entryAssets.map(src=>new Promise<void>(resolve=>{
   const image=new Image();
   image.onload=()=>resolve();
   image.onerror=()=>{failures.push(src);resolve();};
   image.src=src;
  }))).then(()=>{
   if(cancelled)return;
   setFailedAssets([...new Set(failures)]);
   setAssetsReady(true);
  });
  return()=>{cancelled=true;};
 },[]);

 useEffect(()=>{
  if(!assetsReady||!originRef.current)return;
  const leftGroups=[leftRef.current,buckleRef.current].filter((element):element is HTMLDivElement=>element!==null);
  const movingGroups=[...leftGroups,tailRef.current].filter((element):element is HTMLDivElement|HTMLImageElement=>element!==null);
  const fullWidth=beltGeometry.image_full_res[0];
  const renderedWidth=originRef.current.clientWidth;
  const holes=beltGeometry.entry_right.hole_cols;
  const holePitch=holes[1]-holes[0];
  const targetHole=holes[0]+holePitch*2;
  const tailOffset=(beltGeometry.entry_left.prong_tip_closed[0]-targetHole)/fullWidth*renderedWidth;
  const stagingOffset=tailOffset+renderedWidth*.22;
  const timeline=gsap.timeline();
  timelineRef.current=timeline;

  if(reducedMotion){
    gsap.set(movingGroups,{x:0});
    if(prongRef.current)gsap.set(prongRef.current,{scaleY:1,y:0});
   gsap.set(shadowRef.current,{opacity:.16,filter:'blur(1px)'});
   gsap.set(shackleRef.current,{rotation:27,x:2,y:-2,transformOrigin:'7px 10px'});
   setLockOpen(true);
   setUnlocked(true);
   return()=>{timeline.kill();timelineRef.current=null;};
  }

  if(prongRef.current)gsap.set(prongRef.current,{scaleY:1,y:0,transformOrigin:`${beltGeometry.entry_prong.closed_tip_px[0]/fullWidth*100}% ${beltGeometry.entry_prong.closed_tip_px[1]/beltGeometry.image_full_res[1]*100}%`});
  gsap.set(shadowRef.current,{opacity:.16,filter:'blur(6px)'});
  leftGroups.forEach((element)=>timeline.fromTo(element,{x:-window.innerWidth},{x:0,duration:1.05,ease:'power3.out'},0));
  if(tailRef.current)timeline.fromTo(tailRef.current,{x:window.innerWidth+stagingOffset},{x:stagingOffset,duration:1.05,ease:'power3.out'},0)
   .to(tailRef.current,{x:tailOffset,duration:1.05,ease:'power2.inOut'},1.05);
  if(prongRef.current)timeline.fromTo(prongRef.current,{scaleY:1.08},{scaleY:1,duration:.12,ease:'back.out(1.7)',immediateRender:false},2.1);
  if(movingGroups.length)timeline.to(movingGroups,{x:'+=1',duration:.045,yoyo:true,repeat:1,ease:'power1.out'},2.1);
  timeline.to(shadowRef.current,{opacity:.2,filter:'blur(1px)',duration:.12,ease:'sine.out'},2.1)
   .call(()=>setLockOpen(true),[],2.1)
   .to(shackleRef.current,{rotation:27,x:2,y:-2,transformOrigin:'7px 10px',duration:.18,ease:'power2.out'},2.1)
   .call(()=>setUnlocked(true),[],2.28);
  return()=>{timeline.kill();timelineRef.current=null;};
 },[assetsReady,reducedMotion]);

 const canvasWidth=beltGeometry.image_full_res[0];
 const frame=beltGeometry.entry_left.frame_clip_cols;
 const buckleCenter=(frame[0]+frame[1])/2/canvasWidth*100;
 const clip=(cols:number[])=>`inset(0 ${(canvasWidth-cols[1])/canvasWidth*100}% 0 ${cols[0]/canvasWidth*100}%)`;
 const failedCount=failedAssets.length;
 return <main className="entry" aria-label="VETO entry">
  <div className="entry-meta"><span>VETO / 001</span><span>{assetsReady?(failedCount?`${failedCount} IMAGE FALLBACK`:'100%'):'LOADING'}</span></div>
  <div className="entry-stage">
   {assetsReady&&<div className="entry-belt-origin" ref={originRef} style={{transform:`translate(${-buckleCenter}%, -50%)`}}>
    <div className="entry-belt-shadow" ref={shadowRef}/>
    {!failedAssets.includes(entryAssets[0])&&<div className="entry-belt-left" ref={leftRef}><img className="entry-belt-image" src={entryAssets[0]} alt="" width="2200" height="332"/></div>}
    {!failedAssets.includes(entryAssets[3])&&<div className="entry-belt-buckle" ref={buckleRef}>
     {!failedAssets.includes(entryAssets[3])&&<img className="entry-belt-image entry-frame" src={entryAssets[3]} alt="" width="2200" height="332" style={{clipPath:clip(beltGeometry.entry_left.frame_clip_cols)}}/>}
     {beltGeometry.entry_left.keeper_cols.map((cols,index)=>!failedAssets.includes(entryAssets[3])&&<img key={index} className="entry-belt-image entry-keeper" src={entryAssets[3]} alt="" width="2200" height="332" style={{clipPath:clip(cols)}}/>)}
     {!failedAssets.includes(entryAssets[2])&&<img className="entry-belt-image entry-prong" ref={prongRef} src={entryAssets[2]} alt="" width="2200" height="332"/>}
    </div>}
    {!failedAssets.includes(entryAssets[1])&&<img className="entry-belt-image entry-tail" ref={tailRef} src={entryAssets[1]} alt="" width="2200" height="332"/>}
   </div>}
   {!assetsReady&&<div className="entry-loader" aria-live="polite"><i/><span>LOADING BELT / 04 IMAGES</span></div>}
   {failedCount>0&&<div className="entry-fallback" role="status">BELT IMAGE FALLBACK / {failedCount} ASSET{failedCount===1?'':'S'} UNAVAILABLE</div>}
  </div>
  <div className="entry-action"><button className={'enter '+(unlocked?'is-unlocked':'')} disabled={!unlocked} onClick={onEnter}><LockIcon open={lockOpen} shackleRef={shackleRef}/><span>{t.enter}</span>{unlocked&&<b>→</b>}</button></div>
 </main>;
}

export default function VetoPrototype(){
 const [entered,setEntered]=useState(false),[lang,setLang]=useState<Lang>('en'); const t=copy[lang];
 useEffect(()=>{document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';},[lang]);
 return !entered ? <Entry onEnter={()=>setEntered(true)} t={t}/> : <div id="top" className="site"><header><Wordmark/><nav><a href="#belts">{t.belts}</a><a href="#build">{t.build}</a><a href="#size">{t.size}</a><a href="#drop">{t.drop}</a><button className="lang" onClick={()=>setLang(lang==='en'?'ar':'en')}>{lang==='en'?'ع':'EN'}</button></nav></header><section className="mast"><p className="kicker">LOCAL / LEATHER / 2026</p><h1>{t.refuse}</h1></section><BeltSections t={t}/><OutfitSwitcher t={t}/><SizeFinder t={t}/><Drop t={t}/><Members t={t}/><section className="payments"><p className="kicker">{t.payment}</p><div><span>01 / {t.cod}</span><span>02 / {t.card}</span><span>03 / {t.wallet}</span></div></section></div>;
}

function BeltSections({t}:{t:Text}) { const colors=['RED','BLACK','WHITE']; return <section id="belts" className="belt-sections">{colors.map((color,i)=>{const shade=color.toLowerCase();return <article className={'product '+shade} key={color}><div className="product-index">0{i+1} / {color}</div><div className={`product-art product-art--${shade}`}><img className="showcase-half" src={`/belts/${shade}/belt-${shade}-buckle-half.webp`} alt={`VETO ${shade} leather belt with silver buckle`} width="2200" height="332" loading={i===0?'eager':'lazy'} decoding="async"/><img className="showcase-free" src={`/belts/${shade}/belt-${shade}-free-end.webp`} alt={`VETO ${shade} belt's perforated free end and tip`} width="2200" height="332" loading="lazy" decoding="async"/></div><div className="product-copy"><h2>{color}</h2><p className="price">{t.price}</p><a href="#size" className="outline">{t.finder} →</a></div></article>})}</section> }

type BuilderSelection = { scene: string; outfit: number; belt: string };

function OutfitSwitcher({t}:{t:Text}) {
 const [scene,setScene]=useState('STREET');
 const [outfit,setOutfit]=useState(0);
 const [belt,setBelt]=useState('red');
 const [previous,setPrevious]=useState<BuilderSelection|null>(null);
 const fadeTimer=useRef<number|null>(null);
 const selection={scene,outfit,belt};
 const change=(next:Partial<BuilderSelection>)=>{
  if(fadeTimer.current!==null)window.clearTimeout(fadeTimer.current);
  setPrevious(selection);
  setScene(next.scene??scene);
  setOutfit(next.outfit??outfit);
  setBelt(next.belt??belt);
  fadeTimer.current=window.setTimeout(()=>setPrevious(null),220);
 };
 useEffect(()=>()=>{if(fadeTimer.current!==null)window.clearTimeout(fadeTimer.current)},[]);
 const renderComposite=(choice:BuilderSelection,isPrevious=false)=>{
  const model=outfits[choice.outfit];
  return <div key={`${choice.scene}-${model.id}-${choice.belt}-${isPrevious?'old':'new'}`} className={`builder-composite${isPrevious?' is-previous':previous?' is-entering':''}`} aria-hidden={isPrevious}>
   <img className="scene-photo" src={`/builder/scenes/${choice.scene.toLowerCase()}.webp`} alt=""/>
   <div className="builder-model-shadow"><img src={`/builder/outfits/${model.id}.png`} alt=""/></div>
   <div className="builder-model">
    <img className="builder-outfit" src={`/builder/outfits/${model.id}.png`} alt=""/>
    <img className="builder-worn" src={`/builder/worn/worn-${choice.belt}-${model.id}.png`} alt="" width="1792" height="2400"/>
   </div>
   <div className={`builder-grade grade-${choice.scene.toLowerCase()}`}/>
  </div>;
 };
 const currentOutfit=outfits[outfit];
 return <section id="build" className={`builder scene-${scene.toLowerCase()}`}>
  <div className="section-heading"><p className="kicker">02 / {t.build}</p><h2>{t.choice}</h2></div>
  <div className="scene">
   {previous&&renderComposite(previous,true)}
   {renderComposite(selection)}
   <div className="scene-label">{scene} // {currentOutfit.name}</div>
  </div>
  <div className="build-controls">
   <fieldset><legend>{t.scenes}</legend>{['STREET','CLUB','ROOFTOP','NIGHT'].map(x=><button key={x} onClick={()=>change({scene:x})} className={scene===x?'active':''}>{x}</button>)}</fieldset>
   <fieldset><legend>{t.outfit}</legend>{outfits.map((x,i)=><button key={x.id} onClick={()=>change({outfit:i})} className={outfit===i?'active':''}>{x.name}</button>)}</fieldset>
   <fieldset><legend>{t.belt}</legend>{['red','black','white'].map(x=><button key={x} onClick={()=>change({belt:x})} className={belt===x?'active':''}>{x}</button>)}</fieldset>
  </div>
 </section>;
}

function SizeFinder({t}:{t:Text}){const [unit,setUnit]=useState<'cm'|'in'>('cm'),[value,setValue]=useState(82);const cm=unit==='cm'?value:value*2.54;const item=useMemo(()=>getSizeChart().find(x=>cm>=x.min&&cm<=x.max) || getSizeChart()[1],[cm]);const closest=item.holes.reduce((a,b)=>Math.abs(b-cm)<Math.abs(a-cm)?b:a);const hole=item.holes.indexOf(closest)+1;const holeX=beltGeometry.free_end.hole_fraction_x[5-hole]*100;const holeY=beltGeometry.free_end.hole_fraction_y*100;return <section id="size" className="size-finder"><div className="section-heading"><p className="kicker">03 / {t.size}</p><h2>{t.finder}</h2></div><div className="size-grid"><div><label>{t.waist}<input type="number" min="1" value={value} onChange={e=>setValue(Number(e.target.value))}/></label><div className="unit"><button className={unit==='cm'?'active':''} onClick={()=>setUnit('cm')}>{t.cm}</button><button className={unit==='in'?'active':''} onClick={()=>setUnit('in')}>{t.inch}</button></div></div><div className="result"><p>{t.rec}</p><strong>{item.size}</strong><span>{t.hole} {hole}/5</span><div className="hole-visual"><img src="/belts/red/belt-red-free-end.webp" alt="Red belt free end with five sizing holes and tip on the right" width="2200" height="332" loading="lazy" decoding="async"/><i className="hole-ring" style={{left:`${holeX}%`,top:`${holeY}%`}} aria-hidden="true"/></div></div></div></section>}

function Drop({t}:{t:Text}){const d=getDrop();const [units,setUnits]=useState(d.unitsRemaining),[now,setNow]=useState(Date.now());useEffect(()=>{const tick=setInterval(()=>setNow(Date.now()),1000);const sale=setInterval(()=>setUnits(n=>Math.max(0,n-1)),7000+Math.random()*6000);return()=>{clearInterval(tick);clearInterval(sale)}},[]);const diff=Math.max(0,new Date(d.startsAt).getTime()-now);const time=[Math.floor(diff/86400000),Math.floor(diff/3600000)%24,Math.floor(diff/60000)%60,Math.floor(diff/1000)%60].map(x=>String(x).padStart(2,'0')).join(':');return <section id="drop" className="drop"><img className="drop-buckle" src="/belts/red/belt-red-buckle-macro.webp" alt="Close-up of the red VETO belt buckle" width="1400" height="1221" loading="lazy" decoding="async"/><div><p className="kicker">04 / {d.name}</p><h2>{t.starts}</h2><output>{time}</output></div><div className="remaining"><p>{t.remaining}</p><strong>{String(units).padStart(3,'0')}</strong><small>{t.live}</small></div></section>}

function Members({t}:{t:Text}){const [members,setMembers]=useState(getMembers()),[name,setName]=useState(''),[hide,setHide]=useState(false),[notice,setNotice]=useState('');const join=(e:React.FormEvent)=>{e.preventDefault();if(!name.trim())return;const initials=name.trim().split(/\s+/).map(x=>x[0]?.toUpperCase()+'.').join('');const number=Math.max(...members.map(m=>m.number),0)+1;if(hide)setNotice(`#${String(number).padStart(4,'0')} ${t.noWall}`);else setMembers([{number,initials},...members]);setName('');};return <section id="members" className="members"><div className="section-heading"><p className="kicker">05 / {t.members}</p><h2>{t.join}</h2></div><div className="member-grid"><div className="wall">{members.map(m=><span key={m.number}>#{String(m.number).padStart(4,'0')} {m.initials}</span>)}</div><form onSubmit={join}><label>{t.name}<input value={name} onChange={e=>setName(e.target.value)} /></label><label className="check"><input type="checkbox" checked={hide} onChange={e=>setHide(e.target.checked)}/>{t.hide}</label><button className="enter">{t.add} →</button>{notice&&<p className="notice">{notice}</p>}</form></div></section>}
