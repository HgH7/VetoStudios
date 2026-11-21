import type { CartItem, CartTotals } from '@/lib/cart';

export type OrderCustomer = {
 name:string;
 phone:string;
 governorate:string;
 area:string;
 street:string;
 building:string;
 notes:string;
};
export type OrderItem = CartItem & { unitPrice:number };
export type VetoOrder = {
 id:string;
 items:OrderItem[];
 totals:CartTotals;
 customer:OrderCustomer;
 createdAt:string;
 status:'received';
};

const STORAGE_KEY='veto-orders';

function isOrder(value:unknown):value is VetoOrder {
 if(!value||typeof value!=='object')return false;
 const order=value as Record<string,unknown>;
 if(typeof order.id!=='string'||!Array.isArray(order.items)||typeof order.createdAt!=='string'||order.status!=='received')return false;
 if(!order.totals||typeof order.totals!=='object'||!order.customer||typeof order.customer!=='object')return false;
 const totals=order.totals as Record<string,unknown>;
 const customer=order.customer as Record<string,unknown>;
 return order.items.every(item=>{
  if(!item||typeof item!=='object')return false;
  const line=item as Record<string,unknown>;
  return typeof line.color==='string'&&['red','black','white'].includes(line.color)&&typeof line.size==='number'&&[85,95,100].includes(line.size)&&
   typeof line.qty==='number'&&Number.isInteger(line.qty)&&line.qty>=1&&line.qty<=5&&typeof line.unitPrice==='number'&&Number.isFinite(line.unitPrice)&&line.unitPrice>=0;
 })&&['subtotal','delivery','total'].every(key=>Number.isFinite(totals[key])&&Number(totals[key])>=0)&&
  ['name','phone','governorate','area','street','building','notes'].every(key=>typeof customer[key]==='string');
}

export function readOrders():VetoOrder[] {
 const raw=window.localStorage.getItem(STORAGE_KEY);
 if(raw===null)return [];
 const parsed:unknown=JSON.parse(raw);
 if(!Array.isArray(parsed))throw new Error('Stored orders are not a list.');
 return parsed.filter(isOrder);
}

export function getOrder(id:string):VetoOrder|undefined {
 return readOrders().find(order=>order.id===id);
}

export function saveOrder(order:VetoOrder) {
 const orders=readOrders();
 window.localStorage.setItem(STORAGE_KEY,JSON.stringify([...orders,order]));
}

export function createOrderId(orders:VetoOrder[]) {
 const next=orders.reduce((highest,order)=>{
  const match=/^VETO-(\d+)$/.exec(order.id);
  return match?Math.max(highest,Number(match[1])):highest;
 },0)+1;
 return `VETO-${String(next).padStart(4,'0')}`;
}
