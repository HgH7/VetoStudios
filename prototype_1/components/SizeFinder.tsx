'use client';

import { useState } from 'react';
import { getSizeChart } from '@/lib/data';
import type { Text } from './copy';

export default function SizeFinder({t}:{t:Text}) {
 const chart=getSizeChart();
 const [mode,setMode]=useState<'waist'|'body'>('waist');
 const [unit,setUnit]=useState<'cm'|'in'>('cm');
 const [waist,setWaist]=useState('82');
 const [height,setHeight]=useState('');
 const [weight,setWeight]=useState('');
 const waistValue=waist.trim()===''?Number.NaN:Number(waist)*(unit==='cm'?1:2.54);
 const heightValue=height.trim()===''?Number.NaN:Number(height);
 const weightValue=weight.trim()===''?Number.NaN:Number(weight);
 const bodyInputsValid=Number.isFinite(heightValue)&&Number.isFinite(weightValue)&&heightValue>=chart.limits.height[0]&&heightValue<=chart.limits.height[1]&&weightValue>=chart.limits.weight[0]&&weightValue<=chart.limits.weight[1];
 const waistInputsValid=Number.isFinite(waistValue)&&waistValue>=chart.limits.waist[0]&&waistValue<=chart.limits.waist[1];
 const inputsValid=mode==='waist'?waistInputsValid:bodyInputsValid;
 const estimatedWaist=mode==='body'&&bodyInputsValid?chart.estimate.slope*(weightValue/((heightValue/100)**2))+chart.estimate.intercept:Number.NaN;
 const targetWaist=mode==='waist'?waistValue:estimatedWaist;
 const inSizeRange=inputsValid&&targetWaist>=chart.range.min&&targetWaist<=chart.range.max;
 const selectedSize=inSizeRange?chart.sizes.reduce((best,size)=>{
  const bestDistance=Math.abs(best.holes[2]-targetWaist);
  const distance=Math.abs(size.holes[2]-targetWaist);
  return distance<bestDistance||(distance===bestDistance&&size.size>best.size)?size:best;
 },chart.sizes[0]):null;
 const nearBoundary=inSizeRange&&[90,97.5].some(boundary=>Math.abs(targetWaist-boundary)<=1.5);
 const invalidMessage=!inputsValid?t.invalidInput:null;
 return <section id="size" className="size-finder">
  <div className="section-heading"><p className="kicker">03 / {t.size}</p><h2>{t.finder}</h2></div>
  <div className="size-grid">
   <div className="size-inputs">
    <div className="unit size-mode" role="group" aria-label="Sizing method">
     <button type="button" className={mode==='waist'?'active':''} aria-pressed={mode==='waist'} onClick={()=>setMode('waist')}>{t.waistMode}</button>
     <button type="button" className={mode==='body'?'active':''} aria-pressed={mode==='body'} onClick={()=>setMode('body')}>{t.bodyMode}</button>
    </div>
    {mode==='waist'?<>
     <label>{t.waistMode}<input type="number" min={chart.limits.waist[0]} max={chart.limits.waist[1]} step="any" inputMode="decimal" value={waist} onChange={event=>setWaist(event.target.value)} /></label>
     <div className="unit" role="group" aria-label="Waist units">
      <button type="button" className={unit==='cm'?'active':''} aria-pressed={unit==='cm'} onClick={()=>setUnit('cm')}>{t.cm}</button>
      <button type="button" className={unit==='in'?'active':''} aria-pressed={unit==='in'} onClick={()=>setUnit('in')}>{t.inch}</button>
     </div>
    </>:<div className="body-inputs">
     <label>{t.height}<input type="number" min={chart.limits.height[0]} max={chart.limits.height[1]} step="any" inputMode="decimal" value={height} onChange={event=>setHeight(event.target.value)} /></label>
     <label>{t.weight}<input type="number" min={chart.limits.weight[0]} max={chart.limits.weight[1]} step="any" inputMode="decimal" value={weight} onChange={event=>setWeight(event.target.value)} /></label>
    </div>}
   </div>
   <div className="result" aria-live="polite" aria-atomic="true">
    {invalidMessage?<p className="size-message" role="status">{invalidMessage}</p>:!inSizeRange?<p className="size-message" role="status">{t.outsideRange}</p>:selectedSize&&<>
     <p>{t.yourSize}</p>
     <strong>{selectedSize.size}</strong>
     <span>{t.fitsWaist} {selectedSize.holes[0]}-{selectedSize.holes[4]} cm</span>
     {nearBoundary&&<span className="size-message">{t.betweenSizes}</span>}
     {mode==='body'&&<small>{t.estimateNote}</small>}
     <div className="hole-visual" aria-hidden="true"><img src="/belts/red/belt-red-free-end.webp" alt="" width="2200" height="332" loading="lazy" decoding="async" /></div>
    </>}
   </div>
  </div>
 </section>;
}
