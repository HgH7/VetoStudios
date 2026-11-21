'use client';

import { useEffect, useRef, useState } from 'react';
import products from '@/data/products.json';
import { getCartItems, getCartTotals, removeFromCart, setQuantity, subscribe, type CartItem } from '@/lib/cart';
import { formatMoney } from '@/lib/format-money';
import type { Lang } from './copy';
import { commerceCopy } from './commerce-copy';

type Props = { open:boolean; lang:Lang; onClose:()=>void };

export default function CartDrawer({open,lang,onClose}:Props) {
 const [items,setItems]=useState<CartItem[]>([]);
 const dialogRef=useRef<HTMLElement>(null);
 const t=commerceCopy[lang];

 useEffect(()=>{
  setItems(getCartItems());
  return subscribe(()=>setItems(getCartItems()));
 },[]);

 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement as HTMLElement|null;
  const dialog=dialogRef.current;
  const focusables=()=>dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])')??[];
  focusables()[0]?.focus();
  const priorOverflow=document.body.style.overflow;
  const priorPadding=document.body.style.paddingInlineEnd;
  const scrollbarWidth=window.innerWidth-document.documentElement.clientWidth;
  if(scrollbarWidth>0) {
   const currentPadding=Number.parseFloat(window.getComputedStyle(document.body).paddingInlineEnd)||0;
   document.body.style.paddingInlineEnd=`${currentPadding+scrollbarWidth}px`;
  }
  document.body.style.overflow='hidden';
  const handleKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return;}
   if(event.key!=='Tab')return;
   const targets=focusables();
   if(!targets.length){event.preventDefault();return;}
   if(event.shiftKey&&document.activeElement===targets[0]){event.preventDefault();targets[targets.length-1].focus();}
   else if(!event.shiftKey&&document.activeElement===targets[targets.length-1]){event.preventDefault();targets[0].focus();}
  };
  document.addEventListener('keydown',handleKey);
  return()=>{
   document.removeEventListener('keydown',handleKey);
   document.body.style.overflow=priorOverflow;
   document.body.style.paddingInlineEnd=priorPadding;
   if(previous?.isConnected)previous.focus();
  };
 },[open,onClose]);

 if(!open)return null;
 const totals=getCartTotals(items);
 const colorName=(color:CartItem['color'])=>products[color].name[lang];
 return <div className="cart-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose();}}>
  <section className="cart-drawer" id="cart-dialog" role="dialog" aria-modal="true" aria-labelledby="cart-title" ref={dialogRef}>
   <header className="cart-drawer-header">
    <h2 id="cart-title">{t.cartTitle} <span>({items.reduce((sum,item)=>sum+item.qty,0)})</span></h2>
    <button className="cart-close" type="button" onClick={onClose} aria-label={t.close}>×</button>
   </header>
   {items.length===0?<div className="cart-empty">
    <p>{t.empty}</p><p>{t.emptyDescription}</p><a href="/#belts" onClick={onClose}>{t.browseBelts} →</a>
   </div>:<>
    <div className="cart-lines">
     {items.map(item=><article className="cart-line" key={`${item.color}-${item.size}`}>
      <img src={`/belts/${item.color}/belt-${item.color}-buckle-half.webp`} alt={lang==='en'?`${colorName(item.color)} belt buckle`:`إبزيم حزام ${colorName(item.color)}`} />
      <div className="cart-line-content">
       <div className="cart-line-title"><strong>{colorName(item.color)}</strong><span>{lang==='en'?'SIZE':'المقاس'} {item.size}</span></div>
       <span className="cart-line-price">{formatMoney(products[item.color].price*item.qty,lang)}</span>
       <div className="cart-line-controls">
        <div className="quantity-stepper" role="group" aria-label={`${t.quantity}: ${colorName(item.color)} ${item.size}`}>
         <button type="button" disabled={item.qty<=1} onClick={()=>setQuantity(item.color,item.size,item.qty-1)} aria-label={t.decrease}>−</button>
         <span aria-live="polite">{item.qty}</span>
         <button type="button" disabled={item.qty>=5} onClick={()=>setQuantity(item.color,item.size,item.qty+1)} aria-label={t.increase}>+</button>
        </div>
        <button className="cart-remove" type="button" onClick={()=>removeFromCart(item.color,item.size)}>{t.remove}</button>
       </div>
      </div>
     </article>)}
    </div>
    <div className="cart-totals">
     <p><span>{t.subtotal}</span><strong>{formatMoney(totals.subtotal,lang)}</strong></p>
     <p><span>{t.delivery}</span><strong>{totals.delivery===0?t.deliveryUnconfirmed:formatMoney(totals.delivery,lang)}</strong></p>
     <p className="cart-total"><span>{t.total}</span><strong>{formatMoney(totals.total,lang)}</strong></p>
     <a className="cart-checkout" href="/checkout" onClick={onClose}>{t.checkout}</a>
    </div>
   </>}
  </section>
 </div>;
}
