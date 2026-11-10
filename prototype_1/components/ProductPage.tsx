'use client';

import { useEffect, useRef, useState } from 'react';
import type { CartItem } from '@/lib/cart';
import { addToCart } from '@/lib/cart';
import products from '@/data/products.json';
import { copy, type Lang } from './copy';
import { useLang } from './LangProvider';
import SiteHeader from './SiteHeader';
import SizeFinder from './SizeFinder';

type BeltColor = CartItem['color'];
type ProductData = typeof products.red;
type Props = { color: BeltColor; product: ProductData };
const colors: BeltColor[]=['red','black','white'];
const sizes: CartItem['size'][]=[85,95,100];

function ProductGallery({color,lang}:{color:BeltColor;lang:Lang}) {
 const frameRef=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0);
 const [progress,setProgress]=useState(0);
 const reduceMotion=useRef(false);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{reduceMotion.current=media.matches;};
  update();media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[]);
 const scrollToIndex=(index:number)=>{
  const frame=frameRef.current;
  if(!frame)return;
  const target=frame.children[index] as HTMLElement|undefined;
  target?.scrollIntoView({behavior:reduceMotion.current?'instant':'smooth',block:'nearest',inline:'start'});
 };
 const updateActive=()=>{
  const frame=frameRef.current;
  if(!frame)return;
    const maxScroll=frame.scrollWidth-frame.clientWidth;
    const currentProgress=maxScroll>0?Math.max(0,Math.min(1,frame.scrollLeft/maxScroll)):0;
    setProgress(currentProgress);
    setActive(Math.round(currentProgress*3));
 };
 const keyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  const isRtl=document.documentElement.dir==='rtl';
  const delta=(event.key==='ArrowRight'?1:-1)*(isRtl?-1:1);
  scrollToIndex(Math.max(0,Math.min(3,active+delta)));
 };
 const positionTrack=(event:React.MouseEvent<HTMLButtonElement>)=>{
  const rect=event.currentTarget.getBoundingClientRect();
  const physical=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width));
  const logical=document.documentElement.dir==='rtl'?1-physical:physical;
  scrollToIndex(Math.round(logical*3));
 };
 const altColor=products[color].name[lang];
 const fullAlt=lang==='en'?`${altColor} belt, full view`:`حزام ${altColor}، عرض كامل`;
 const buckleAlt=lang==='en'?`${altColor} belt buckle detail`:`تفاصيل إبزيم حزام ${altColor}`;
 const freeAlt=lang==='en'?`${altColor} belt holes and free end`:`فتحات حزام ${altColor} وطرفه`;
 const photoLabel=lang==='en'?`Photo ${active+1} of 4`:`الصورة ${active+1} من 4`;
 return <aside className="product-gallery" aria-label={lang==='en'?`${altColor} belt photos`:`صور حزام ${altColor}`}>
  <div className="product-gallery-frame" ref={frameRef} role="region" aria-roledescription="carousel" aria-label={lang==='en'?'Product photos':'صور المنتج'} tabIndex={0} onKeyDown={keyDown} onScroll={updateActive}>
  <div className="product-slide wide-slide full-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'1 of 4, full belt':'١ من ٤، الحزام كاملاً'}><img src={`/belts/${color}/belt-${color}-full.webp`} alt={fullAlt} width="2400" height="332" loading="eager" fetchPriority="high" decoding="async" /></div>
  <div className="product-slide macro-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'2 of 4, buckle detail':'٢ من ٤، تفاصيل الإبزيم'}><img src={`/belts/${color}/belt-${color}-buckle-macro.webp`} alt={buckleAlt} width="1400" height="1221" loading="lazy" decoding="async" /></div>
  <div className="product-slide wide-slide free-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'3 of 4, belt holes and tip':'٣ من ٤، فتحات الحزام والطرف'}><img src={`/belts/${color}/belt-${color}-free-end.webp`} alt={freeAlt} width="2400" height="332" loading="lazy" decoding="async" /></div>
   <div className="product-slide worn-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'4 of 4, worn on model':'٤ من ٤، الحزام على العارض'}>
    <img className="worn-scene" src="/builder/scenes/street.webp" alt="" width="1264" height="843" loading="lazy" decoding="async" />
    <div className="worn-shadow"><img src="/builder/outfits/cut-01.png" alt="" width="896" height="1200" loading="lazy" decoding="async" /></div>
    <div className="worn-model"><img className="worn-outfit" src="/builder/outfits/cut-01.png" alt="" width="896" height="1200" loading="lazy" decoding="async" /><img className="worn-belt" src={`/builder/worn/worn-${color}-cut-01.png`} alt="" width="1792" height="2400" loading="lazy" decoding="async" /></div>
    <div className="worn-grade" aria-hidden="true" />
   </div>
  </div>
  <button type="button" className="gallery-track" onClick={positionTrack} aria-label={lang==='en'?'Choose product photo':'اختر صورة المنتج'}>
    <span className="gallery-track-line"><i style={{left:`${documentDirectionPosition(progress,lang)}%`}} /></span>
  </button>
  <p className="gallery-live" aria-live="polite" aria-atomic="true">{photoLabel}</p>
 </aside>;
}
function documentDirectionPosition(progress:number,lang:Lang) { return (lang==='ar'?1-progress:progress)*75; }

export default function ProductPage({color,product}:Props) {
 const {lang,setLang}=useLang();
 const t=copy[lang];
 const [selectedSize,setSelectedSize]=useState<CartItem['size']|null>(null);
 const [message,setMessage]=useState('');
 const [added,setAdded]=useState(false);
 const [dialogOpen,setDialogOpen]=useState(false);
 const [cartTimer,setCartTimer]=useState<ReturnType<typeof setTimeout>|null>(null);
 const triggerRef=useRef<HTMLButtonElement>(null);
 const dialogRef=useRef<HTMLDivElement>(null);
 const facts=product.facts;
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(media.matches)return;
  let context:{revert:()=>void}|undefined;
  let observer:IntersectionObserver|undefined;
  let cancelled=false;
  void (async()=>{
   const [{gsap},{ScrollTrigger}]=await Promise.all([import('gsap'),import('gsap/ScrollTrigger')]);
   if(cancelled)return;
   gsap.registerPlugin(ScrollTrigger);
   const revealed=new WeakSet<HTMLElement>();
   observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    const chapter=entry.target as HTMLElement;
    if(entry.isIntersecting&&entry.boundingClientRect.top<window.innerHeight*.86){
     if(!revealed.has(chapter)){revealed.add(chapter);gsap.to(chapter,{autoAlpha:1,y:0,duration:.65,ease:'power2.out',overwrite:true});}
    }
   }),{threshold:0});
   context=gsap.context(()=>{
    gsap.utils.toArray<HTMLElement>('.product-chapter').forEach(chapter=>{
     gsap.set(chapter,{autoAlpha:0,y:24});
     observer?.observe(chapter);
     const reveal=()=>{if(!revealed.has(chapter)){revealed.add(chapter);gsap.to(chapter,{autoAlpha:1,y:0,duration:.65,ease:'power2.out',overwrite:true});}};
     const trigger=ScrollTrigger.create({trigger:chapter,start:'top 86%',once:true,onEnter:reveal});
     if(chapter.getBoundingClientRect().top<=window.innerHeight*.86){trigger.kill();reveal();}
    });
    ScrollTrigger.refresh();
   });
  })();
  return()=>{cancelled=true;observer?.disconnect();context?.revert();};
 },[]);
 useEffect(()=>()=>{if(cartTimer)clearTimeout(cartTimer);},[cartTimer]);
 useEffect(()=>{
  if(!dialogOpen)return;
  const previous=document.activeElement as HTMLElement|null;
  const dialog=dialogRef.current;
  const focusables=()=>dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')??[];
  focusables()[0]?.focus();
  const handleKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();setDialogOpen(false);return;}
   if(event.key!=='Tab')return;
   const items=focusables();
   if(!items.length){event.preventDefault();return;}
   if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus();}
   else if(!event.shiftKey&&document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus();}
  };
  document.addEventListener('keydown',handleKey);
  const priorOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return()=>{document.removeEventListener('keydown',handleKey);document.body.style.overflow=priorOverflow;previous?.focus();};
 },[dialogOpen]);
 const openSizeDialog=()=>{triggerRef.current=document.activeElement as HTMLButtonElement;setDialogOpen(true);};
 const addItem=()=>{
  if(!selectedSize){setMessage(t.chooseSize);return;}
  addToCart(color,selectedSize);
  setMessage('');setAdded(true);
  if(cartTimer)clearTimeout(cartTimer);
  setCartTimer(setTimeout(()=>setAdded(false),2000));
 };
 const colorName=product.name[lang];
 return <div className="product-site">
  <SiteHeader t={t} lang={lang} onToggleLang={()=>setLang(lang==='en'?'ar':'en')} />
  <main className="product-page">
   <ProductGallery color={color} lang={lang}/>
   <div className="product-detail-column">
    <div className="product-details">
     <section className="product-chapter product-intro" aria-labelledby="product-title">
      <p className="kicker">01 / VETO BELT</p><h1 id="product-title">{colorName}</h1><p className="product-price">{t.price}</p>
      <div className="product-choice"><p>{t.color}</p><div className="product-colors" role="group" aria-label={t.color}>{colors.map(option=><a key={option} href={`/belts/${option}`} aria-current={option===color?'page':undefined} aria-label={products[option].name[lang]}>{products[option].name[lang]}</a>)}</div></div>
      <div className="product-choice"><p>{t.sizeLabel}</p><div className="product-sizes" role="group" aria-label={t.sizeLabel}>{sizes.map(size=><button type="button" key={size} aria-pressed={selectedSize===size} className={selectedSize===size?'is-selected':''} onClick={()=>{setSelectedSize(size);setMessage('');}}>{size}</button>)}</div></div>
      {message&&<p className="cart-message" role="status">{message}</p>}
      <div className="product-actions"><button className="product-cart" type="button" onClick={addItem}>{added?t.added:t.addToCart}</button><button className="product-size-link" type="button" onClick={openSizeDialog}>{t.finder} →</button></div>
     </section>
     <section className="product-chapter" aria-labelledby="material-title"><p className="kicker">02 / VETO</p><h2 id="material-title">{t.materialCraft}</h2><p>{facts.material[lang]}</p><p>{facts.craft[lang]}</p><img className="chapter-macro" src={`/belts/${color}/belt-${color}-buckle-macro.webp`} alt={`${colorName} belt buckle close-up`} width="1400" height="1221" loading="lazy" decoding="async" /></section>
    <section className="product-chapter product-specs" aria-labelledby="specs-title"><p className="kicker">03 / VETO</p><h2 id="specs-title">{t.specs}</h2><dl><div><dt>{t.width}</dt><dd>{lang==='en'?'4 cm':'٤ سم'}</dd></div><div><dt>{t.sizeLabel}</dt><dd>85 / 95 / 100</dd></div><div><dt>{t.holes}</dt><dd>{lang==='en'?'5 / 2.5 cm apart':'٥ / تفصل بينها ٢٫٥ سم'}</dd></div><div><dt>{t.hardware}</dt><dd>{facts.hardware[lang]}</dd></div></dl></section>
     <section className="product-chapter product-size-chapter" aria-labelledby="size-title"><p className="kicker">04 / VETO</p><h2 id="size-title">{t.sizeChapter}</h2><button className="product-size-link" type="button" onClick={openSizeDialog}>{t.finder} →</button></section>
     <section className="product-chapter" aria-labelledby="delivery-title"><p className="kicker">05 / VETO</p><h2 id="delivery-title">{t.deliveryReturns}</h2><ul className="delivery-list">{facts.delivery[lang].map(line=><li key={line}>{line}</li>)}</ul><a href="/delivery-returns" className="product-size-link">{t.deliveryLink} →</a></section>
    </div>
    <section className="product-range" aria-labelledby="range-title"><h2 id="range-title">{t.range}</h2><div className="range-cards">{colors.map((option,index)=><a key={option} href={`/belts/${option}`} className={`range-card${option===color?' is-current':''}`} aria-current={option===color?'page':undefined}><span>{`0${index+1} / ${products[option].name[lang]}`}</span><img src={`/belts/${option}/belt-${option}-buckle-half.webp`} alt={`${products[option].name[lang]} belt buckle`} width="2200" height="332" loading="lazy" decoding="async" /></a>)}</div></section>
   </div>
  </main>
  {dialogOpen&&<div className="size-dialog-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setDialogOpen(false);}}><div className="size-dialog" role="dialog" aria-modal="true" aria-label={t.finder} ref={dialogRef}><button type="button" className="dialog-close" onClick={()=>setDialogOpen(false)} aria-label={t.close}>×</button><SizeFinder t={t}/></div></div>}
 </div>;
}
