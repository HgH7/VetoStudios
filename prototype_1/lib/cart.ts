import products from '@/data/products.json';
import { SHIPPING_FEE } from '@/lib/config';

export type CartItem = { color: 'red' | 'black' | 'white'; size: 85 | 95 | 100; qty: number };
export type CartTotals = { subtotal: number; delivery: number; total: number };
type Listener = () => void;

const STORAGE_KEY = 'veto-cart';
export const CART_OPEN_EVENT = 'veto:open-cart';
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<Listener>();

function isCartItem(value: unknown): value is CartItem {
 if(!value||typeof value!=='object')return false;
 const item=value as Record<string,unknown>;
 return typeof item.color==='string'&&['red','black','white'].includes(item.color)&&typeof item.size==='number'&&[85,95,100].includes(item.size)&&
  typeof item.qty==='number'&&Number.isInteger(item.qty)&&item.qty>0;
}

function readStorage() {
 if(loaded||typeof window==='undefined')return;
 loaded=true;
 items=[];
 try {
  const parsed:unknown=JSON.parse(window.localStorage.getItem(STORAGE_KEY)??'[]');
  if(!Array.isArray(parsed))return;
  const merged=new Map<string,CartItem>();
  for(const candidate of parsed) {
   if(!isCartItem(candidate))continue;
   const key=`${candidate.color}-${candidate.size}`;
   const existing=merged.get(key);
   const qty=Math.min(5,candidate.qty);
   merged.set(key,existing?{...existing,qty:Math.min(5,existing.qty+qty)}:{color:candidate.color,size:candidate.size,qty});
  }
  items=[...merged.values()];
 } catch {
  items=[];
 }
}

function publish() {
 if(typeof window!=='undefined')window.localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
 listeners.forEach(listener=>listener());
}

export function getCartItems() {
 readStorage();
 return items.map(item=>({...item}));
}

export function getCartTotals(cartItems:CartItem[]=getCartItems()):CartTotals {
 const subtotal=cartItems.reduce((sum,item)=>sum+products[item.color].price*item.qty,0);
 return {subtotal,delivery:SHIPPING_FEE,total:subtotal+SHIPPING_FEE};
}

export function subscribe(listener:Listener) {
 readStorage();
 listeners.add(listener);
 if(typeof window==='undefined')return ()=>{listeners.delete(listener);};
 const onStorage=(event:StorageEvent)=>{
  if(event.key!==STORAGE_KEY&&event.key!==null)return;
  loaded=false;
  readStorage();
  listeners.forEach(callback=>callback());
 };
 window.addEventListener('storage',onStorage);
 return ()=>{listeners.delete(listener);window.removeEventListener('storage',onStorage);};
}

export function add(color:CartItem['color'],size:CartItem['size']) {
 readStorage();
 const existing=items.find(item=>item.color===color&&item.size===size);
 items=existing?items.map(item=>item===existing?{...item,qty:Math.min(5,item.qty+1)}:item):[...items,{color,size,qty:1}];
 publish();
 if(typeof window!=='undefined')window.dispatchEvent(new Event(CART_OPEN_EVENT));
}

export function setQuantity(color:CartItem['color'],size:CartItem['size'],qty:number) {
 readStorage();
 const quantity=Math.max(1,Math.min(5,Math.trunc(qty)));
 items=items.map(item=>item.color===color&&item.size===size?{...item,qty:quantity}:item);
 publish();
}

export function remove(color:CartItem['color'],size:CartItem['size']) {
 readStorage();
 items=items.filter(item=>item.color!==color||item.size!==size);
 publish();
}

export function clear() {
 readStorage();
 items=[];
 publish();
}

export const subscribeCart=subscribe;
export const addToCart=add;
export const removeFromCart=remove;
export const clearCart=clear;
