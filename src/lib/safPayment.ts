/** Arithmetic only: no bank offers, qualification or current unit prices are asserted. */
export function monthlyPayment(price:number,deposit:number,annualRate:number,years:number):number|null {
  if(![price,deposit,annualRate,years].every(Number.isFinite)||price<=0||deposit<0||deposit>price||annualRate<0||annualRate>100||years<1||years>50)return null;
  const principal=price-deposit,n=Math.round(years*12),r=annualRate/1200;
  if(r===0)return principal/n;
  return principal*r/(1-Math.pow(1+r,-n));
}
