'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { copy } from '@/components/copy';
import { commerceCopy } from '@/components/commerce-copy';
import SiteHeader from '@/components/SiteHeader';
import products from '@/data/products.json';
import { formatMoney } from '@/lib/format-money';
import { governorates } from '@/lib/governorates';
import { PROTOTYPE_MODE, WHATSAPP_NUMBER } from '@/lib/config';
import { readOrders, type VetoOrder } from '@/lib/orders';

function Draft({children}:{children:React.ReactNode}) {
 return <span className="draft">[DRAFT] {children}</span>;
}

export default function OrderPage() {
 const {lang,setLang}=useLang();
 const t=commerceCopy[lang];
 const [order,setOrder]=useState<VetoOrder|null>(null);
 const [loading,setLoading]=useState(true);
 const [storageError,setStorageError]=useState(false);

 useEffect(()=>{
  const id=new URLSearchParams(window.location.search).get('id');
  try {
   const found=id?readOrders().find(candidate=>candidate.id===id):undefined;
   setOrder(found??null);
  } catch {
   setStorageError(true);
  } finally {
   setLoading(false);
  }
 },[]);

 const whatsappNumber=WHATSAPP_NUMBER.replace(/\D/g,'');
 const whatsappReady=WHATSAPP_NUMBER!=='REPLACE_ME'&&whatsappNumber.length>0;
 const whatsappText=useMemo(()=>{
  if(!order)return '';
  const lines=order.items.map(item=>`${products[item.color].name[lang]} / ${item.size} × ${item.qty} — ${formatMoney(item.unitPrice*item.qty,lang)}`);
  return [`VETO ORDER ${order.id}`,...lines,`Subtotal: ${formatMoney(order.totals.subtotal,lang)}`,`Delivery: ${order.totals.delivery===0?t.deliveryUnconfirmed:formatMoney(order.totals.delivery,lang)}`,`Total: ${formatMoney(order.totals.total,lang)}`,`Name: ${order.customer.name}`,`Mobile: ${order.customer.phone}`,`Address: ${[order.customer.area,order.customer.street,order.customer.building,order.customer.governorate].filter(Boolean).join(', ')}`].join('\n');
 },[lang,order,t.deliveryUnconfirmed]);
 const governorate=order?governorates.find(([en])=>en===order.customer.governorate)?.[lang==='en'?0:1]??order.customer.governorate:'';

 return <main className="commerce-page">
  <SiteHeader t={copy[lang]} lang={lang} onToggleLang={()=>setLang(lang==='en'?'ar':'en')}/>
  {loading?<p className="commerce-status" role="status">{lang==='en'?'LOADING ORDER…':'جارٍ تحميل الطلب…'}</p>:!order?<section className="order-missing" role="alert"><h1>{storageError?t.storageError:t.notFound}</h1><p>{t.notFoundMessage}</p><a className="text-link" href="/">{t.backHome} →</a></section>:
   <article className="order-page">
    <div className="order-confirmation">
     <p className="kicker">{PROTOTYPE_MODE?'PROTOTYPE / LOCAL STORAGE':'VETO / 001'}</p>
     <h1>{t.received}</h1>
     <p className="order-number-label">{t.orderNumber}</p>
     <strong className="order-number">{order.id}</strong>
     {PROTOTYPE_MODE&&<p className="prototype-notice" role="note">{t.prototypeNotice}</p>}
    </div>
    <div className="order-content-grid">
     <section className="order-details-block" aria-labelledby="delivery-details-title">
      <h2 id="delivery-details-title">{t.deliveryDetails}</h2>
      <dl className="order-address">
       <div><dt>{t.name}</dt><dd>{order.customer.name}</dd></div>
       <div><dt>{t.phone}</dt><dd dir="ltr">{order.customer.phone}</dd></div>
       <div><dt>{t.governorate}</dt><dd>{governorate}</dd></div>
       <div><dt>{t.area}</dt><dd>{order.customer.area}</dd></div>
       <div><dt>{t.street}</dt><dd>{order.customer.street}</dd></div>
       <div><dt>{t.building}</dt><dd>{order.customer.building}</dd></div>
       {order.customer.notes&&<div><dt>{t.notes}</dt><dd>{order.customer.notes}</dd></div>}
      </dl>
      <h2 className="next-heading">{t.whatNext}</h2>
      <ol className="next-steps"><li>{t.nextOne}</li><li><Draft>{t.nextTwo}</Draft></li><li><Draft>{t.nextThree}</Draft></li></ol>
     </section>
     <aside className="order-summary-block" aria-labelledby="order-summary-title">
      <h2 id="order-summary-title">{t.orderSummary}</h2>
      <div className="checkout-summary-lines">{order.items.map(item=><div className="checkout-summary-line" key={`${item.color}-${item.size}`}>
       <img src={`/belts/${item.color}/belt-${item.color}-buckle-half.webp`} alt=""/>
       <div><strong>{products[item.color].name[lang]} / {item.size}</strong><span>× {item.qty}</span></div>
       <strong>{formatMoney(item.unitPrice*item.qty,lang)}</strong>
      </div>)}</div>
      <div className="cart-totals">
       <p><span>{t.subtotal}</span><strong>{formatMoney(order.totals.subtotal,lang)}</strong></p>
       <p><span>{t.delivery}</span><strong>{order.totals.delivery===0?t.deliveryUnconfirmed:formatMoney(order.totals.delivery,lang)}</strong></p>
       <p className="cart-total"><span>{t.total}</span><strong>{formatMoney(order.totals.total,lang)}</strong></p>
      </div>
     </aside>
    </div>
    <div className="order-actions">
     {whatsappReady?<a className="whatsapp-button" href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}`} target="_blank" rel="noreferrer">{t.whatsapp}</a>:<button className="whatsapp-button" type="button" disabled>{t.whatsapp}</button>}
     {!whatsappReady&&<p className="whatsapp-note">{t.whatsappDisabled}</p>}
     <a className="text-link" href="/">{t.backHome} →</a>
    </div>
   </article>}
 </main>;
}
