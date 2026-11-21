import type { Lang } from '@/components/copy';

export function formatMoney(amount:number,lang:Lang) {
 return new Intl.NumberFormat(lang==='en'?'en-EG':'ar-EG',{
  style:'currency',
  currency:'EGP',
  maximumFractionDigits:0
 }).format(amount);
}
