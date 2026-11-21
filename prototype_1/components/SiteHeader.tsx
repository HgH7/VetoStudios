'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Text, Lang } from './copy';
import CartDrawer from './CartDrawer';
import { CART_OPEN_EVENT, getCartItems, subscribe, type CartItem } from '@/lib/cart';
import { commerceCopy } from './commerce-copy';

type Props = { t: Text; lang: Lang; onToggleLang: () => void; home?: boolean };

function Wordmark({home}:{home:boolean}) { return <a href={home?'#top':'/#top'} className="wordmark" aria-label="VETO home">VETO</a>; }

export default function SiteHeader({t,lang,onToggleLang,home=false}:Props) {
 const [cartOpen,setCartOpen]=useState(false);
 const [items,setItems]=useState<CartItem[]>([]);
 const closeCart=useCallback(()=>setCartOpen(false),[]);
 const anchor=(id:string)=>home?`#${id}`:`/#${id}`;
 useEffect(()=>{
  setItems(getCartItems());
  const unsubscribe=subscribe(()=>setItems(getCartItems()));
  const open=()=>setCartOpen(true);
  window.addEventListener(CART_OPEN_EVENT,open);
  return()=>{unsubscribe();window.removeEventListener(CART_OPEN_EVENT,open);};
 },[]);
 const count=items.reduce((sum,item)=>sum+item.qty,0);
 const commerce=commerceCopy[lang];
 return <>
  <header><Wordmark home={home}/><nav><a href={anchor('belts')}>{t.belts}</a><a href={anchor('build')}>{t.build}</a><a href={anchor('size')}>{t.size}</a><a href={anchor('drop')}>{t.drop}</a><button className="cart-trigger" type="button" aria-label={`${commerce.cartTitle} (${count})`} aria-haspopup="dialog" aria-expanded={cartOpen} aria-controls="cart-dialog" onClick={()=>setCartOpen(true)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.3a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>{count>0&&<span className="cart-badge" aria-hidden="true">{count>99?'99+':count}</span>}</button><button className="lang" onClick={onToggleLang}>{lang==='en'?'ع':'EN'}</button></nav></header>
  <CartDrawer open={cartOpen} lang={lang} onClose={closeCart}/>
 </>;
}
