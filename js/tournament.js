// Lógica pura de torneos: llaves, play-offs, tablas, estadísticas, podio y comparador (sin DOM ni red).
export const last=s=>s.seasons[s.seasons.length-1],fm=(s,id)=>s.fighters.find(f=>f.id===id);
// ---------- Lógica de torneo (eliminación simple, potencias de 2) ----------
export const need=s=>Math.ceil(s.rounds/2);
export const isPow2=n=>n>=2&&(n&(n-1))===0;
// Regla Score7: si hay más peleadores que el tamaño estándar (potencia de 2), los peor ubicados de la tabla general juegan play-offs
export function ranked(s){const t={};s.fighters.forEach(f=>t[f.id]={t:0,p:0,d:0,r:Math.random()});s.seasons.forEach(q=>{const x=stats(s,q);s.fighters.forEach(f=>{t[f.id].t+=x[f.id].t;t[f.id].p+=x[f.id].w;t[f.id].d+=x[f.id].w-x[f.id].l})});return s.fighters.map(f=>f.id).sort((a,b)=>t[b].p-t[a].p||t[b].d-t[a].d||t[b].r-t[a].r)}
export function build(s){const se=last(s),n=s.fighters.length;let P=1;while(P*2<=n)P*=2;const k=n-P,rk=ranked(s);
 const po=rk.slice(n-2*k),direct=rk.slice(0,n-2*k).sort(()=>Math.random()-.5);
 // Play-offs: mejor vs peor del grupo; el ganador de la pelea j ocupa el hueco j del primer round del cuadro principal
 const r0=Array.from({length:k},(_,j)=>({a:po[j],b:po[2*k-1-j]}));
 const r1=Array.from({length:P/2},()=>({}));se.drawn=false;if(k)se.direct=direct;else direct.forEach((id,q)=>{r1[q>>1][q%2?'b':'a']=id});
 const rs=[];if(k)rs.push(r0);rs.push(r1);for(let m=P/2;m>1;m/=2)rs.push(Array.from({length:m/2},()=>({})));se.po=k>0;se.bracket=rs}
export function nextMatch(se){for(let r=0;r<se.bracket.length;r++)for(let i=0;i<se.bracket[r].length;i++){const m=se.bracket[r][i];if(m.a&&m.b&&!m.w)return{r,i}}return null}
export function rname(r,se){if(se.po&&r==0)return 'Play-offs';const o=se.po?1:0,t=se.bracket.length-o,q=r-o,l=t-q;return l==1?'Final':l==2?'Semifinal':l==3?'Cuartos':l==4?'Octavos':'Ronda '+(q+1)}
export function stats(s,se,skip){const o={};s.fighters.forEach(f=>o[f.id]={w:0,l:0,t:0,p:0});
 (se.bracket||[]).forEach((rd,ri)=>rd.forEach(m=>{if(!m.w||m===skip||(se.po&&ri==0))return;if(o[m.w])o[m.w].p++;if(o[m.a]){o[m.a].w+=m.sa;o[m.a].l+=m.sb}if(o[m.b]){o[m.b].w+=m.sb;o[m.b].l+=m.sa}}));
 if(se.champ&&!skip&&o[se.champ])o[se.champ].t=1;return o}
// Última pelea del cuadro principal (los play-offs no mueven la tabla)
export function lastMain(se){let b=null;(se.bracket||[]).forEach((rd,ri)=>rd.forEach(m=>{if(m.w&&m.n&&(!b||m.n>b.m.n))b={m,ri}}));return b&&!(se.po&&b.ri==0)?b.m:null}
// Podio de la temporada pasada: campeón (oro), finalista (plata) y mejor de la tabla entre el resto (bronce)
export function podium(s){const q=s.seasons[s.seasons.length-2],o={};if(!q||!q.champ||!q.bracket)return o;
 const fin=q.bracket[q.bracket.length-1][0],ru=fin.a==q.champ?fin.b:fin.a,st=stats(s,q);
 const th=s.fighters.map(f=>f.id).filter(id=>id!=q.champ&&id!=ru).sort((a,b)=>st[b].w-st[a].w||(st[b].w-st[b].l)-(st[a].w-st[a].l))[0];
 o[q.champ]='gold';o[ru]='silver';if(th)o[th]='bronze';return o}
// Sorteo: mezcla Fisher-Yates y comprobación de si toca sortear la primera ronda tras los play-offs
export const sh=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
export const needDraw=se=>se.po&&!se.drawn&&se.bracket[0].every(m=>m.w)&&!se.bracket[1].some(m=>m.w);
export const pct=(a,b)=>a+b?Math.round(100*a/(a+b)):0;
// Posición en la tabla GENERAL (puntos y diferencia acumulados de todas las temporadas; títulos desempatan)
export function rankMap(s){const o={};s.fighters.map(f=>{let p=0,d=0,t=0,g=0;s.seasons.forEach(q=>{const x=stats(s,q)[f.id];p+=x.w;d+=x.w-x.l;t+=x.t;g+=x.w+x.l});return{id:f.id,p,d,t,g}}).sort((a,b)=>b.p-a.p||b.d-a.d||b.t-a.t).forEach((r,i)=>o[r.id]=r.g?i+1:'–');return o}
// Historial completo de un peleador (todas las temporadas, play-offs incluidos)
export function fstats(s,id){const o={f:0,w:0,l:0,rw:0,rl:0,op:{}};
 s.seasons.forEach(q=>(q.bracket||[]).forEach((rd,ri)=>rd.forEach((m,mi)=>{if(!m.w||(m.a!=id&&m.b!=id))return;
  const me=m.a==id,r=me?m.sa:m.sb,x=me?m.sb:m.sa,e=me?m.b:m.a,win=m.w==id,k=q.n*1e5+(m.n||ri*100+mi),po=q.po&&ri==0;
  o.f++;win?o.w++:o.l++;o.rw+=r;o.rl+=x;
  const p=o.op[e]=o.op[e]||{id:e,w:0,l:0,kw:0,kl:0,res:[]};
  if(win){p.w++;p.kw=Math.max(p.kw,k)}else{p.l++;p.kl=Math.max(p.kl,k)}p.res.push({t:r+'-'+x+(po?'*':''),win,k})})));return o}
// Más ganado / mayor rival: el de más veces; si hay empate, el más reciente
export function topOp(op,k,kk){const a=Object.values(op).filter(p=>p[k]>0).sort((x,y)=>y[kk]-x[kk]);if(!a.length)return null;const mx=Math.max(...a.map(p=>p[k])),t=a.filter(p=>p[k]==mx);return t.length==1?t[0]:a[0]}
export const champOf=s=>{const x=[...s.seasons].reverse().find(q=>q.champ);return x&&x.champ};
