'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import products from '@/data/products.json';
import { copy } from '@/components/copy';
import { commerceCopy } from '@/components/commerce-copy';
import { useLang } from '@/components/LangProvider';
import SiteHeader from '@/components/SiteHeader';
import { clearCart, getCartItems, getCartTotals, subscribe, type CartItem } from '@/lib/cart';
import { SHIPPING_FEE, PROTOTYPE_MODE } from '@/lib/config';
import { formatMoney } from '@/lib/format-money';
import { governorates } from '@/lib/governorates';
import { createOrderId, readOrders, saveOrder, type OrderCustomer, type VetoOrder } from '@/lib/orders';

type Field='name'|'phone'|'governorate'|'area'|'street'|'building';
type ErrorKey='nameError'|'phoneError'|'governorateError'|'areaError'|'streetError'|'buildingError';
type FormValues=OrderCustomer;
type FormErrors=Partial<Record<Field,ErrorKey>>;

const initialForm:FormValues={name:'',phone:'',governorate:'',area:'',street:'',building:'',notes:''};

function formatFor(lang:'en'|'ar',value:number) { return formatMoney(value,lang); }

export default function CheckoutPage() {
 const router=useRouter();
 const {lang,setLang}=useLang();
 const t=commerceCopy[lang];
 const [items,setItems]=useState<CartItem[]>([]);
 const [ready,setReady]=useState(false);
 const [values,setValues]=useState<FormValues>(initialForm);
 const [errors,setErrors]=useState<FormErrors>({});
 const [saveError,setSaveError]=useState('');
 const orderWasPlaced=useRef(false);
 const fields=useRef<Record<Field,HTMLElement|null>>({name:null,phone:null,governorate:null,area:null,street:null,building:null});

 useEffect(()=>{
  setItems(getCartItems());
  setReady(true);
  return subscribe(()=>setItems(getCartItems()));
 },[]);

 useEffect(()=>{
  if(!ready||items.length>0||orderWasPlaced.current)return;
  window.sessionStorage.setItem('veto-empty-cart-notice','1');
  router.replace('/#belts');
 },[items.length,ready,router]);

 const update=(field:keyof FormValues,value:string)=>{
  setValues(current=>({...current,[field]:value}));
  if(field!=='notes')setErrors(current=>({...current,[field]:undefined}));
  setSaveError('');
 };
 const totals=getCartTotals(items);
 const validate=():FormErrors=>{
  const next:FormErrors={};
  if(!values.name.trim())next.name='nameError';
  if(!/^01\d{9}$/.test(values.phone.trim()))next.phone='phoneError';
  if(!values.governorate)next.governorate='governorateError';
  if(!values.area.trim())next.area='areaError';
  if(!values.street.trim())next.street='streetError';
  if(!values.building.trim())next.building='buildingError';
  return next;
 };

 const placeOrder=(event:React.FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  const validation=validate();
  setErrors(validation);
  const firstError=(Object.keys(validation) as Field[])[0];
  if(firstError){fields.current[firstError]?.focus();return;}
  const customer={...values,name:values.name.trim(),phone:values.phone.trim(),area:values.area.trim(),street:values.street.trim(),building:values.building.trim(),notes:values.notes.trim()};
  const currentTotals=getCartTotals(items);
  try {
   const existing=readOrders();
   const order:VetoOrder={
    id:createOrderId(existing),
    items:items.map(item=>({...item,unitPrice:products[item.color].price})),
    totals:currentTotals,
    customer,
    createdAt:new Date().toISOString(),
    status:'received'
   };
   saveOrder(order);
   orderWasPlaced.current=true;
   clearCart();
   router.push(`/order?id=${encodeURIComponent(order.id)}`);
  } catch {
   setSaveError(t.orderSaveError);
  }
 };

 const fieldError=(field:Field)=>errors[field]?t[errors[field] as ErrorKey]:undefined;
 const inputProps=(field:Field)=>({
  'aria-invalid':Boolean(errors[field]),
  'aria-describedby':errors[field]?`${field}-error`:undefined,
  'aria-required':true
 });

 if(!ready||items.length===0)return <main className="commerce-page"><SiteHeader t={copy[lang]} lang={lang} onToggleLang={()=>setLang(lang==='en'?'ar':'en')}/><p className="commerce-status" role="status">{t.emptyRedirect}</p></main>;
 return <main className="commerce-page">
  <SiteHeader t={copy[lang]} lang={lang} onToggleLang={()=>setLang(lang==='en'?'ar':'en')}/>
  <div className="checkout-layout">
   <section className="checkout-form-column" aria-labelledby="checkout-title">
    <p className="kicker">VETO / 001</p><h1 id="checkout-title">{t.checkoutTitle}</h1>
    {PROTOTYPE_MODE&&<p className="prototype-notice" role="note">{t.prototypeNotice}</p>}
    <form className="checkout-form" onSubmit={placeOrder} noValidate>
     <fieldset className="checkout-fieldset">
      <legend>{t.contact}</legend>
      <label>{t.name}<input ref={element=>{fields.current.name=element;}} type="text" autoComplete="name" value={values.name} onChange={event=>update('name',event.target.value)} {...inputProps('name')}/>{fieldError('name')&&<span className="field-error" id="name-error">{fieldError('name')}</span>}</label>
      <label>{t.phone}<input ref={element=>{fields.current.phone=element;}} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={11} value={values.phone} onChange={event=>update('phone',event.target.value.replace(/\D/g,'').slice(0,11))} {...inputProps('phone')}/>{fieldError('phone')&&<span className="field-error" id="phone-error">{fieldError('phone')}</span>}</label>
     </fieldset>
     <fieldset className="checkout-fieldset">
      <legend>{lang==='en'?'DELIVERY ADDRESS':'عنوان التوصيل'}</legend>
      <label>{t.governorate}<select ref={element=>{fields.current.governorate=element;}} value={values.governorate} onChange={event=>update('governorate',event.target.value)} {...inputProps('governorate')}><option value="">{lang==='en'?'SELECT GOVERNORATE':'اختر المحافظة'}</option>{governorates.map(([en,ar])=><option key={en} value={en}>{lang==='en'?en:ar}</option>)}</select>{fieldError('governorate')&&<span className="field-error" id="governorate-error">{fieldError('governorate')}</span>}</label>
      <label>{t.area}<input ref={element=>{fields.current.area=element;}} type="text" autoComplete="address-level3" value={values.area} onChange={event=>update('area',event.target.value)} {...inputProps('area')}/>{fieldError('area')&&<span className="field-error" id="area-error">{fieldError('area')}</span>}</label>
      <label>{t.street}<input ref={element=>{fields.current.street=element;}} type="text" autoComplete="street-address" value={values.street} onChange={event=>update('street',event.target.value)} {...inputProps('street')}/>{fieldError('street')&&<span className="field-error" id="street-error">{fieldError('street')}</span>}</label>
      <label>{t.building}<input ref={element=>{fields.current.building=element;}} type="text" value={values.building} onChange={event=>update('building',event.target.value)} {...inputProps('building')}/>{fieldError('building')&&<span className="field-error" id="building-error">{fieldError('building')}</span>}</label>
      <label>{t.notes}<textarea rows={3} value={values.notes} onChange={event=>update('notes',event.target.value)}/></label>
     </fieldset>
     <fieldset className="checkout-fieldset payment-options">
      <legend>{t.payment}</legend>
      <label className="payment-option"><input type="radio" name="payment" checked readOnly/><span>{t.cod}</span></label>
      <label className="payment-option is-disabled"><input type="radio" name="payment-disabled" disabled/><span>{t.cardComingSoon}</span></label>
     </fieldset>
     {saveError&&<p className="field-error" role="alert">{saveError}</p>}
     <button className="place-order-button" type="submit">{t.placeOrder} →</button>
    </form>
   </section>
   <aside className="checkout-summary" aria-labelledby="summary-title">
    <h2 id="summary-title">{t.orderSummary}</h2>
    <div className="checkout-summary-lines">{items.map(item=><div className="checkout-summary-line" key={`${item.color}-${item.size}`}>
     <img src={`/belts/${item.color}/belt-${item.color}-buckle-half.webp`} alt=""/>
     <div><strong>{products[item.color].name[lang]} / {item.size}</strong><span>× {item.qty}</span></div>
     <strong>{formatFor(lang,products[item.color].price*item.qty)}</strong>
    </div>)}</div>
    <div className="cart-totals">
     <p><span>{t.subtotal}</span><strong>{formatFor(lang,totals.subtotal)}</strong></p>
     <p><span>{t.delivery}</span><strong>{SHIPPING_FEE===0?t.deliveryUnconfirmed:formatFor(lang,totals.delivery)}</strong></p>
     <p className="cart-total"><span>{t.total}</span><strong>{formatFor(lang,totals.total)}</strong></p>
    </div>
   </aside>
  </div>
 </main>;
}
