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
 const stripRef=useRef<HTMLDivElement>(null);
 const trackRef=useRef<HTMLDivElement>(null);
 const [active,setActive]=useState(0);
 const activeRef=useRef(0);
 const progressRef=useRef(0);
 const targetRef=useRef(0);
 const scheduleRenderRef=useRef<()=>void>(()=>{});
 const reduceMotion=useRef(false);
 const dragRef=useRef<{pointerId:number;startX:number;startProgress:number;source:'gallery'|'track';moved:boolean}|null>(null);
 const animationRef=useRef<{from:number;to:number;startedAt:number;duration:number}|null>(null);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const update=()=>{
   reduceMotion.current=media.matches;
   if(media.matches&&animationRef.current){
    progressRef.current=targetRef.current;
    animationRef.current=null;
    scheduleRenderRef.current();
   }
  };
  update();media.addEventListener('change',update);
  return()=>media.removeEventListener('change',update);
 },[]);
 const clampProgress=(value:number)=>Math.max(0,Math.min(1,value));
 const animateTo=(value:number,duration=600)=>{
  const to=clampProgress(value);
  targetRef.current=to;
  if(reduceMotion.current){progressRef.current=to;animationRef.current=null;scheduleRenderRef.current();return;}
  animationRef.current={from:progressRef.current,to,startedAt:performance.now(),duration};
  scheduleRenderRef.current();
 };
 const settle=()=>animateTo(Math.round(targetRef.current*3)/3);
 const keyDown=(event:React.KeyboardEvent<HTMLDivElement>)=>{
  if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;
  event.preventDefault();
  const delta=(event.key==='ArrowRight'?1:-1)*(lang==='ar'?-1:1);
  animateTo(Math.max(0,Math.min(3,Math.round(targetRef.current*3)+delta))/3);
 };
 const beginPointer=(event:React.PointerEvent<HTMLDivElement>,source:'gallery'|'track')=>{
  if(event.button!==0&&event.pointerType==='mouse')return;
  const frame=frameRef.current;
  if(!frame)return;
  let startProgress=progressRef.current;
  animationRef.current=null;
  targetRef.current=progressRef.current;
  if(source==='track'){
   const track=trackRef.current;
   const thumb=track?.querySelector<HTMLElement>('.gallery-thumb');
   const thumbRect=thumb?.getBoundingClientRect();
   const onThumb=thumbRect&&event.clientX>=thumbRect.left&&event.clientX<=thumbRect.right;
   if(track&&!onThumb){
    const rect=track.getBoundingClientRect();
    const thumbWidth=track.querySelector('.gallery-thumb')?.getBoundingClientRect().width??0;
    const position=clampProgress((event.clientX-rect.left-thumbWidth/2)/Math.max(1,rect.width-thumbWidth));
    startProgress=lang==='ar'?1-position:position;
    animateTo(startProgress,350);
    event.preventDefault();
    return;
   }
  }
  dragRef.current={pointerId:event.pointerId,startX:event.clientX,startProgress,source,moved:false};
  event.currentTarget.setPointerCapture(event.pointerId);
  scheduleRenderRef.current();
  event.preventDefault();
 };
 const movePointer=(event:React.PointerEvent<HTMLDivElement>,source:'gallery'|'track')=>{
  const drag=dragRef.current;
  const frame=frameRef.current;
  if(!drag||drag.pointerId!==event.pointerId||drag.source!==source||!frame)return;
  const track=trackRef.current;
  const thumb=track?.querySelector<HTMLElement>('.gallery-thumb');
  const range=track&&thumb?Math.max(1,track.clientWidth-thumb.offsetWidth):1;
  const progressDelta=source==='track'
   ?(event.clientX-drag.startX)/range*(lang==='ar'?-1:1)
   :(event.clientX-drag.startX)/(frame.clientWidth*3)*(lang==='ar'?1:-1);
  drag.moved=true;
  targetRef.current=clampProgress(drag.startProgress+progressDelta);
  animationRef.current=null;
  scheduleRenderRef.current();
  event.preventDefault();
 };
 const endPointer=(event:React.PointerEvent<HTMLDivElement>)=>{
  const drag=dragRef.current;
  if(drag?.pointerId!==event.pointerId)return;
  dragRef.current=null;
  if(drag.source==='gallery'||drag.moved){
   progressRef.current=targetRef.current;
   settle();
  }
 };
 const photoLabel=lang==='en'?`Photo ${active+1} of 4`:`الصورة ${active+1} من 4`;
 useEffect(()=>{
  const frame=frameRef.current;
  if(!frame)return;
  let animationFrame=0;
  let wheelSettle:ReturnType<typeof setTimeout>|null=null;
  let schedule=()=>{};
  const render=(time:number)=>{
   animationFrame=0;
   const animation=animationRef.current;
   if(animation){
    const elapsed=Math.min(1,(time-animation.startedAt)/animation.duration);
    const eased=1-Math.pow(1-elapsed,3);
    progressRef.current=animation.from+(animation.to-animation.from)*eased;
    if(elapsed>=1)animationRef.current=null;
   }else if(dragRef.current||reduceMotion.current){
    progressRef.current=targetRef.current;
   }else{
    progressRef.current+=(targetRef.current-progressRef.current)*.22;
    if(Math.abs(targetRef.current-progressRef.current)<.0005)progressRef.current=targetRef.current;
   }
   const progress=clampProgress(progressRef.current);
   if(stripRef.current)stripRef.current.style.transform=lang==='ar'?`translate3d(calc(-75% + ${progress*75}%),0,0)`:`translate3d(${-progress*75}%,0,0)`;
   const physical=lang==='ar'?1-progress:progress;
   const thumb=trackRef.current?.querySelector<HTMLElement>('.gallery-thumb');
   if(thumb)thumb.style.left=`${physical*82}%`;
   const index=Math.round(progress*3);
   if(index!==activeRef.current){activeRef.current=index;setActive(index);}
   trackRef.current?.setAttribute('aria-valuenow',(progress*3).toFixed(2));
   if(animationRef.current||dragRef.current||Math.abs(targetRef.current-progressRef.current)>=.0005)animationFrame=requestAnimationFrame(render);
  };
  schedule=()=>{if(!animationFrame)animationFrame=requestAnimationFrame(render);};
  scheduleRenderRef.current=schedule;
  const onWheel=(event:WheelEvent)=>{
   if(Math.abs(event.deltaX)<=Math.abs(event.deltaY))return;
   event.preventDefault();
   targetRef.current=clampProgress(targetRef.current+(lang==='ar'?-1:1)*event.deltaX/(frame.clientWidth*3));
   animationRef.current=null;
   schedule();
   if(wheelSettle)clearTimeout(wheelSettle);
   wheelSettle=setTimeout(settle,140);
  };
  frame.addEventListener('wheel',onWheel,{passive:false});
  schedule();
  return()=>{
   frame.removeEventListener('wheel',onWheel);
   cancelAnimationFrame(animationFrame);
   scheduleRenderRef.current=()=>{};
   if(wheelSettle)clearTimeout(wheelSettle);
  };
 },[lang]);
 const altColor=products[color].name[lang];
 const buckleHalfAlt=lang==='en'?`${altColor} belt buckle and strap`:`إبزيم حزام ${altColor} والحزام`;
 const buckleAlt=lang==='en'?`${altColor} belt buckle detail`:`تفاصيل إبزيم حزام ${altColor}`;
 const freeAlt=lang==='en'?`${altColor} belt holes and free end`:`فتحات حزام ${altColor} وطرفه`;
 return <aside className="product-gallery" aria-label={lang==='en'?`${altColor} belt photos`:`صور حزام ${altColor}`}>
  <div className="product-gallery-frame" ref={frameRef} role="region" aria-roledescription="carousel" aria-label={lang==='en'?'Product photos':'صور المنتج'} tabIndex={0} onKeyDown={keyDown} onPointerDown={event=>beginPointer(event,'gallery')} onPointerMove={event=>movePointer(event,'gallery')} onPointerUp={endPointer} onPointerCancel={endPointer}>
   <div className={`product-gallery-strip${lang==='ar'?' is-rtl':''}`} ref={stripRef}>
    <div className="product-slide wide-slide full-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'1 of 4, buckle and strap':'١ من ٤، الإبزيم والحزام'}><img draggable="false" src={`/belts/${color}/belt-${color}-buckle-half.webp`} alt={buckleHalfAlt} width="2200" height="332" loading="eager" fetchPriority="high" decoding="async" /></div>
    <div className="product-slide macro-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'2 of 4, buckle detail':'٢ من ٤، تفاصيل الإبزيم'}><img draggable="false" src={`/belts/${color}/belt-${color}-buckle-macro.webp`} alt={buckleAlt} width="1400" height="1221" loading="lazy" decoding="async" /></div>
    <div className="product-slide wide-slide free-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'3 of 4, belt holes and tip':'٣ من ٤، فتحات الحزام والطرف'}><img draggable="false" src={`/belts/${color}/belt-${color}-free-end.webp`} alt={freeAlt} width="2200" height="332" loading="lazy" decoding="async" /></div>
    <div className="product-slide worn-slide" role="group" aria-roledescription="slide" aria-label={lang==='en'?'4 of 4, worn on model':'٤ من ٤، الحزام على العارض'}>
    <img className="worn-scene" src="/builder/scenes/street.webp" alt="" width="1264" height="843" loading="lazy" decoding="async" />
    <div className="worn-shadow"><img src="/builder/outfits/cut-01.png" alt="" width="896" height="1200" loading="lazy" decoding="async" /></div>
    <div className="worn-model"><img className="worn-outfit" src="/builder/outfits/cut-01.png" alt="" width="896" height="1200" loading="lazy" decoding="async" /><img className="worn-belt" src={`/builder/worn/worn-${color}-cut-01.png`} alt="" width="1792" height="2400" loading="lazy" decoding="async" /></div>
    <div className="worn-grade" aria-hidden="true" />
    </div>
   </div>
  </div>
  <div ref={trackRef} className="gallery-track" role="slider" tabIndex={0} aria-label={lang==='en'?'Choose product photo':'اختر صورة المنتج'} aria-valuemin={0} aria-valuemax={3} aria-valuenow={0} aria-valuetext={photoLabel} onKeyDown={keyDown} onPointerDown={event=>beginPointer(event,'track')} onPointerMove={event=>movePointer(event,'track')} onPointerUp={endPointer} onPointerCancel={endPointer}>
    <span className="gallery-track-line"><i className="gallery-thumb" /></span>
  </div>
  <p className="gallery-live" aria-live="polite" aria-atomic="true">{photoLabel}</p>
 </aside>;
}

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
     <section className="product-chapter" aria-labelledby="material-title"><p className="kicker">02 / VETO</p><h2 id="material-title">{t.materialCraft}</h2><p>{facts.material[lang]}</p><p>{facts.craft[lang]}</p></section>
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
