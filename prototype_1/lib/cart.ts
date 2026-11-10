export type CartItem = { color: 'red' | 'black' | 'white'; size: 85 | 95 | 100; qty: number };
type Listener = () => void;
const STORAGE_KEY = 'veto-cart';
let items: CartItem[] = [];
let loaded = false;
const listeners = new Set<Listener>();

function readStorage() {
 if(loaded||typeof window==='undefined')return;
 loaded=true;
 try {
  const parsed=JSON.parse(window.localStorage.getItem(STORAGE_KEY)??'[]');
  if(Array.isArray(parsed))items=parsed.filter((item):item is CartItem=>item&&['red','black','white'].includes(item.color)&&[85,95,100].includes(item.size)&&Number.isInteger(item.qty)&&item.qty>0);
 } catch { items=[]; }
}
function publish() {
 if(typeof window!=='undefined')window.localStorage.setItem(STORAGE_KEY,JSON.stringify(items));
 listeners.forEach(listener=>listener());
}
export function getCartItems() { readStorage(); return items.map(item=>({...item})); }
export function subscribe(listener:Listener) {
 readStorage();
 listeners.add(listener);
 const onStorage=(event:StorageEvent)=>{if(event.key===STORAGE_KEY){loaded=false;readStorage();listeners.forEach(callback=>callback());}};
 window.addEventListener('storage',onStorage);
 return ()=>{listeners.delete(listener);window.removeEventListener('storage',onStorage);};
}
export function add(color:CartItem['color'],size:CartItem['size']) {
 readStorage();
 const existing=items.find(item=>item.color===color&&item.size===size);
 items=existing?items.map(item=>item===existing?{...item,qty:item.qty+1}:item):[...items,{color,size,qty:1}];
 publish();
}
export function remove(color:CartItem['color'],size:CartItem['size']) {
 readStorage();
 items=items.filter(item=>item.color!==color||item.size!==size);
 publish();
}
export function clear() { readStorage(); items=[]; publish(); }

export const subscribeCart=subscribe;
export const addToCart=add;
export const removeFromCart=remove;
export const clearCart=clear;
