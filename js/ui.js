// Renderizado y eventos de la app (vistas, acciones, listeners). El estado vive aquí; la persistencia en db.js.
import {last,fm,need,nextMatch,rname,stats,lastMain,podium,sh,needDraw,pct,rankMap,fstats,topOp,champOf,build} from './tournament.js';
import {sync} from './db.js';
import {uploadFighterImage} from './cloudinary.js';
import {logout as signOutUser} from './auth.js';
let S={series:[],trash:[]},USER={name:''};export const setData=d=>{S=d};export const getData=()=>S;export const setUser=u=>{USER=u};
const save=()=>sync(()=>S).then(ch=>{if(ch)render()});
let stT;export function status(kind,msg){const e=$('#status');clearTimeout(stT);e.hidden=false;e.className='st '+kind;e.textContent=kind=='saving'?(msg||'Guardando…'):kind=='saved'?'✓ Guardado':'⚠ '+msg;if(kind=='saved')stT=setTimeout(()=>e.hidden=true,1800)}
export function resetView(){Object.assign(V,{page:'home',sid:null,tab:'t',fight:null,sel:null,low:0,stat:null,cmp:null,sx:false,bk:null,hs:null,rv:null})}
const $=s=>document.querySelector(s),uid=()=>Math.random().toString(36).slice(2,9);
const esc=t=>String(t||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let MED={};let V={page:'home',sid:null,tab:'t',fight:null,sel:null,low:0};
const cur=()=>S.series.find(x=>x.id===V.sid);
// ---------- Vistas ----------
const av0=(f,c='')=>f&&f.img?`<img class="av ${c}" src="${f.img}" alt="${esc(f.name)}">`:`<div class="av ${c}">${esc((f&&f.name||'?')[0]||'?').toUpperCase()}</div>`;
const av=(f,c='',nom)=>{const m=!nom&&f&&MED[f.id],h=av0(f,c);return m?`<span class="mw ${m}">${h}</span>`:h};
// Historial: resultados de cualquier temporada ya jugada
function histTable(s,q){const st=stats(s,q),ids=new Set();q.bracket.forEach(rd=>rd.forEach(m=>{ids.add(m.a);ids.add(m.b)}));
 const r=s.fighters.filter(f=>ids.has(f.id)).map(f=>({f,w:st[f.id].w,l:st[f.id].l})).sort((a,b)=>b.w-a.w||(b.w-b.l)-(a.w-a.l));
 return `<table><tr><th>#</th><th>Peleador</th><th>Pts</th><th>Rounds perdidos</th><th>Dif.</th></tr>${r.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.f.name||'—')} ${x.f.id==q.champ?'<span class="badge">👑 Campeón</span>':''}</td><td><b>${x.w}</b></td><td>${x.l}</td><td>${x.w-x.l}</td></tr>`).join('')}</table>`}
function hist(s){const ps=s.seasons.filter(q=>q.bracket);if(!ps.length)return '<p class="mut">Aún no hay temporadas jugadas.</p>';
 const q=ps.find(x=>x.n==V.hs)||ps[ps.length-1],c=fm(s,q.champ);
 return `<div class="row" style="margin-bottom:10px">${ps.map(x=>`<button class="${x.n==q.n?'':'g'}" data-act="hs" data-n="${x.n}">Temporada ${x.n}</button>`).join('')}</div>
<div class="card"><h3>Temporada ${q.n}${q.champ?'':' (en curso)'}</h3>${c?`<div class="row">${av(c,'sm',1)}<div><span class="badge">👑 Campeón</span> <b>${esc(c.name)}</b></div></div>`:'<p class="mut">Sin campeón todavía.</p>'}</div>
<div class="card"><h3>Llaves</h3>${bracket(s,q)}</div><div class="card"><h3>Tabla final</h3>${histTable(s,q)}</div>`}
// ---------- Estadísticas de peleadores, comparador y papelera ----------
const rs=p=>p.res.slice().sort((a,b)=>a.k-b.k).map(x=>`<span style='color:${x.win?'#3ddc84':'#ff4d4d'}'>${x.t}</span>`).join(' · ');
function opc(s,p,t){const f=fm(s,p.id);return f?`<div class='card row' data-act='stat' data-id='${f.id}' style='cursor:pointer'>${av(f,'md',1)}<div>${t?`<div class='mut'>${t}</div>`:''}<div class='fn' style='font-size:24px'>${esc(f.name)}</div><div>${p.w}-${p.l} en ${p.w+p.l} pelea(s) · ${rs(p)}</div></div></div>`:''}
const ring=(w,l)=>{const p=w+l?100*w/(w+l):0;return `<div class='ring' style='background:${w+l?`conic-gradient(#3ddc84 0 ${p}%,#ff4d4d 0)`:'#2a3350'}'><i><b>${w+l?Math.round(p)+'%':'–'}</b></i></div>`};
function detail(s,f,X,RK){const bw=topOp(X.op,'w','kw'),bl=topOp(X.op,'l','kl'),ops=Object.values(X.op).filter(p=>fm(s,p.id)).sort((a,b)=>(b.w+b.l)-(a.w+a.l)||Math.max(b.kw,b.kl)-Math.max(a.kw,a.kl));
 return `<div class='row'>${av(f,'md',1)}<div><h2 style='margin:0'>${esc(f.name)}</h2><div class='sty fn'>${esc(f.style||'Sin estilo')}</div><div class='mut'>Posición en la tabla general: <b>${RK[f.id]}</b></div></div></div>
<div class='row' style='margin:14px 0'>${ring(X.rw,X.rl)}<div><div><b>${X.f}</b> peleas (con play-offs): <span style='color:#3ddc84'>${X.w} G</span> · <span style='color:#ff4d4d'>${X.l} P</span> (${pct(X.w,X.l)}% victorias)</div><div>Rounds: <span style='color:#3ddc84'>${X.rw} ganados</span> · <span style='color:#ff4d4d'>${X.rl} perdidos</span></div></div></div>
${bw?opc(s,bw,'Víctima favorita'):''}${bl?opc(s,bl,'Mayor rival'):''}
<h3>Rivales enfrentados</h3>${ops.length?ops.map(p=>opc(s,p,'')).join(''):'<p class="mut">Aún sin peleas.</p>'}
<div class='card row'><select id='cs' style='flex:1'>${s.fighters.filter(x=>x.id!=f.id).map(x=>`<option value='${x.id}'>${esc(x.name)}</option>`).join('')}</select><button data-act='cmp'>Comparar</button></div>`}
// Comparador: tasa de victorias y de rounds (suavizadas) + ventaja directa
function cmpView(s,a,b){const A=fstats(s,a.id),B=fstats(s,b.id),n=need(s),h=A.op[b.id]||{w:0,l:0},hf=h.w+h.l;
 const m=X=>({wr:(X.w+1)/(X.f+2),rr:(X.rw+1)/(X.rw+X.rl+2),dp:X.f?(X.rw-X.rl)/X.f:0}),ma=m(A),mb=m(B);
 const ra=.5*ma.wr+.5*ma.rr,rb=.5*mb.wr+.5*mb.rr;let p=ra/(ra+rb);if(hf)p=.7*p+.3*((h.w+1)/(hf+2));
 const w=p>=.5?a:b,pw=Math.max(p,1-p),lo=Math.min(n-1,Math.round(n*(1-pw)/pw)),conf=pw<.55?'muy parejo':pw<.65?'ligera ventaja':'favorito claro',why=[];
 if(A.f+B.f==0)why.push('ninguno tiene historial: 50/50');else{
  if(ma.wr!=mb.wr)why.push(`${esc((ma.wr>mb.wr?a:b).name)} tiene mejor % de victorias (${pct(A.w,A.l)}% vs ${pct(B.w,B.l)}%)`);
  if(ma.dp!=mb.dp)why.push(`${esc((ma.dp>mb.dp?a:b).name)} tiene mejor diferencia de rounds por pelea`);
  why.push(hf?`cara a cara: ${h.w}-${h.l} para ${esc(a.name)}`:'nunca se han enfrentado: pesa solo su historial general')}
 const row=(l,x,y)=>`<tr><td>${x}</td><th style='text-align:center'>${l}</th><td style='text-align:right'>${y}</td></tr>`,dp=X=>(X.f?(X.rw-X.rl)/X.f:0).toFixed(1);
 return `<button class='g' data-act='cmpOff'>← Volver</button>
<div class='stage' style='margin:8px 0'><div class='side'>${av(a,'md',1)}<span class='fn'>${esc(a.name)}</span></div><div class='vs'>VS</div><div class='side'>${av(b,'md',1)}<span class='fn'>${esc(b.name)}</span></div></div>
<table>${row('Peleas',A.f,B.f)}${row('% victorias',pct(A.w,A.l)+'%',pct(B.w,B.l)+'%')}${row('Rounds G/P',A.rw+'/'+A.rl,B.rw+'/'+B.rl)}${row('Dif. por pelea',dp(A),dp(B))}${row('Cara a cara',h.w,h.l)}</table>
<div class='card' style='margin-top:12px;border-left:4px solid var(--gold)'><h3 style='margin:0'>🏆 ${A.f+B.f?esc(w.name)+' ('+Math.round(pw*100)+'%, '+conf+')':'Sin favorito'}</h3>${A.f+B.f?`<p>Resultado probable: <b>${n}-${lo}</b> a favor de ${esc(w.name)}.</p>`:''}<ul>${why.map(x=>`<li>${x}</li>`).join('')}</ul></div>`}
function modal(s){const f=fm(s,V.stat);if(!f)return '';const o=V.cmp&&fm(s,V.cmp)?cmpView(s,f,fm(s,V.cmp)):detail(s,f,fstats(s,f.id),rankMap(s,last(s)));
 return `<div class='ov'><div class='bg' data-act='xs'></div><div class='mod'><button class='g' data-act='xs' style='float:right'>✕</button>${o}</div></div>`}
function trashHtml(){const t=S.trash||[];return t.length?`<h3 style='margin-top:22px'>🗑 Papelera</h3>${t.map(x=>`<div class='card row'><div style='flex:1'><b>${esc(x.name)}</b> <span class='mut'>${x.fighters.length} peleadores · eliminada ${new Date(x.del).toLocaleDateString()}</span></div><button data-act='restore' data-id='${x.id}'>Restaurar</button><button class='g' data-act='purge' data-id='${x.id}'>Eliminar definitivamente</button></div>`).join('')}`:''}
// Copia de seguridad: mostrar los datos como texto (copiar/pegar) o importarlos en otra copia de la app
function backupHtml(){return `<div class='card' style='margin-top:22px'><h3>Copia de seguridad</h3><div class='row'><button class='g' data-act='bkOut'>Exportar todo</button><button class='g' data-act='bkIn'>Importar datos</button></div>${V.bk=='out'?`<textarea id='bk' rows='5' readonly onclick='this.select()'>${esc(JSON.stringify(S))}</textarea><button data-act='allDl'>Descargar .json</button><p class='mut'>Copia todo el texto y pégalo en "Importar datos" de la otra copia (o guárdalo en un .json).</p>`:V.bk=='in'?`<input type='file' accept='.json,application/json' data-imp='1'><textarea id='bk' rows='5' placeholder='O pega aquí el texto exportado (una serie o una copia completa)'></textarea><button data-act='bkGo' style='margin-top:8px'>Importar</button>`:''}</div>`}
// Exportar / importar una serie (JSON). Descargar funciona al abrir la app en local; copiar texto funciona siempre.
function dl(o,n){const b=new Blob([JSON.stringify(o)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click()}
function sxHtml(s){return `<div class='card'><h3>Exportar «${esc(s.name)}»</h3><textarea id='sxt' rows='4' readonly onclick='this.select()'>${esc(JSON.stringify({arena:'serie',v:1,serie:s}))}</textarea><div class='row' style='margin-top:8px'><button data-act='sxDl'>Descargar .json</button><button class='g' data-act='sxCp'>Copiar texto</button></div><p class='mut'>Incluye peleadores (con imágenes), temporadas, llaves y resultados. Para importarla: en el inicio, Copia de seguridad → Importar datos.</p></div>`}
function home(){return `<div class="card"><h3>Nueva serie</h3><div class="row"><input id="ns" placeholder="Nombre de la serie" style="flex:1;min-width:180px"><select id="nr" style="width:auto"><option value="1">1 round</option><option value="3" selected>Mejor de 3</option><option value="5">Mejor de 5</option></select><button data-act="newS">Crear</button></div></div>
${S.series.length?S.series.map(s=>{const c=champOf(s);return `<div class="card row"><div style="flex:1"><h3 style="margin:0">${esc(s.name)}</h3><span class="mut">${s.fighters.length} peleadores · Temporada ${s.seasons.length}</span> ${c?`<span class="badge">👑 ${esc(fm(s,c)?.name)}</span>`:''}</div><button data-act="open" data-id="${s.id}">Abrir</button><button class="g" data-act="delS" data-id="${s.id}">Papelera</button></div>`}).join(''):'<p class="mut">Aún no tienes series. Crea la primera arriba.</p>'}${trashHtml()}${backupHtml()}`}
function ser(){const s=cur(),tabs=[['t','Torneo'],['f','Peleadores'],['x','Tablas'],['h','Historial']];
 return `<div class="row"><button class="g" data-act="home">← Series</button><h2 style="margin:0">${esc(s.name)}</h2><button class="g" data-act="sx" style="margin-left:auto">Exportar serie</button></div>${V.sx?sxHtml(s):''}
<div class="tabs">${tabs.map(([k,n])=>`<div class="tab ${V.tab==k?'on':''}" data-act="tab" data-k="${k}">${n}</div>`).join('')}</div>${V.tab=='f'?fighters(s):V.tab=='x'?tables(s):V.tab=='h'?hist(s):tourney(s)}`}
function fighters(s){const se=last(s),lock=!!se.bracket;
 return `<div class="card row"><label>Nombre <input data-s="name" value="${esc(s.name)}"></label><label>Rounds por pelea <select data-s="rounds">${[1,3,5,7].map(n=>`<option value="${n}" ${s.rounds==n?'selected':''}>${n}</option>`).join('')}</select></label></div>
<datalist id="st">${['Agresivo','Defensivo','Equilibrado','Contraataque','Presión','Técnico'].map(x=>`<option>${x}</option>`).join('')}</datalist>
${s.fighters.map(f=>`<div class="card frow"><label style="cursor:pointer">${av(f)}<input type="file" accept="image/*" hidden data-img="${f.id}"></label><div class="f"><input data-f="name" data-id="${f.id}" placeholder="Nombre" value="${esc(f.name)}"><input data-f="style" data-id="${f.id}" list="st" placeholder="Estilo de pelea" value="${esc(f.style)}"><textarea data-f="desc" data-id="${f.id}" rows="2" placeholder="Descripción / contexto">${esc(f.desc)}</textarea>${lock?'':`<button class="g" data-act="delF" data-id="${f.id}">Quitar</button>`}</div></div>`).join('')}
${lock?'<p class="mut">La temporada ya empezó: puedes editar datos, no la cantidad de peleadores.</p>':`<div class="row"><button data-act="addF" data-n="1">+ Peleador</button><button class="g" data-act="addF" data-n="4">+4</button><span class="mut">${s.fighters.length} (mínimo 3; si no son 4, 8, 16, 32… se juegan play-offs)</span></div>`}`}
function tourney(s){const se=last(s);
 if(!se.bracket){const n=s.fighters.length,ok=n>=3&&s.fighters.every(f=>f.name);let P=1;while(P*2<=n)P*=2;return `<div class="card"><h3>Temporada ${se.n}</h3><p>${ok?(n>P?`${n} peleadores: ${n-P} play-off(s) entre los ${2*(n-P)} peor ubicados en la tabla general; cuadro principal de ${P} (la primera ronda se sortea al terminar los play-offs).`:`Cuadro de ${P} con emparejamiento aleatorio.`):'Necesitas al menos 3 peleadores, todos con nombre.'}</p><button data-act="start" ${ok?'':'disabled'}>Iniciar torneo</button></div>`}
 if(V.fight)return fight(s,se);const nm=nextMatch(se),c=se.champ&&fm(s,se.champ);
 return (c?`<div class="card champ"><div class="crown">👑</div>${av(c,'',1)}<h2>${esc(c.name)}</h2><p>Campeón de la temporada ${se.n}</p><button data-act="seq">Crear secuela</button></div>`:needDraw(se)?`<button data-act="draw" style="margin-bottom:12px" ${V.rv!=null?'disabled':''}>🎲 Sortear primera ronda</button>`:`<button data-act="go" style="margin-bottom:12px" ${V.rv!=null?'disabled':''}>Siguiente pelea</button>`)+bracket(s,se)}
function bracket(s,se){const T=se.bracket.length;return `<div class="br">${se.bracket.map((rd,r)=>`<div class="col"><h4>${rname(r,se)}</h4>${rd.map((m,mi)=>`<div class="m ${V.rv!=null&&se.po&&r==1&&mi==V.rv-1?'new':''}">${[['a','sa'],['b','sb']].map(([k,sc])=>{const f=V.rv!=null&&se.po&&r==1&&mi>=V.rv?null:fm(s,m[k]);return `<div class="${m.w&&m.w==m[k]?'w':''}">${f?av(f,'sm'):''}<span class="n">${f?esc(f.name):'—'}</span><span>${m.w?m[sc]:''}</span></div>`}).join('')}</div>`).join('')}</div>`).join('')}</div>`}
function fight(s,se){const RK=rankMap(s,se),m=se.bracket[V.fight.r][V.fight.i],A=fm(s,m.a),B=fm(s,m.b),n=need(s);
 const side=(f,k)=>`<div class="side ${V.sel==k?'win':''}" data-act="pick" data-k="${k}"><div class="pw">${av(f,'xl')}<span class="pos" data-act="stat" data-id="${f.id}" title="Ver estadísticas">${RK[f.id]}</span></div><span class="fn">${esc(f.name)}</span></div>`;
 const pn=f=>`<div class="card"><div class="fn sty">${esc(f.style||'Sin estilo')}</div><p>${esc(f.desc||'Sin descripción.')}</p></div>`;
 return `<div class="row"><button class="g" data-act="back">← Llaves</button><h3 style="margin:0">${rname(V.fight.r,se)} · a ${n} rounds</h3></div>
<div class="stage" key="${V.fight.r}-${V.fight.i}">${side(A,'a')}<div class="vs">VS</div>${side(B,'b')}</div>
${V.sel?`<div class="info"><div><h4>${esc(A.name)}</h4>${pn(A)}</div><div><h4>${esc(B.name)}</h4>${pn(B)}</div></div>
<div class="card row"><span>Rounds del perdedor:</span>${Array.from({length:n},(_,i)=>`<button class="${V.low==i?'':'g'}" data-act="low" data-n="${i}">${i}</button>`).join('')}<button data-act="ok" style="margin-left:auto">Confirmar ganador</button></div>`:'<p class="mut" style="text-align:center">Toca a quien gana la pelea.</p>'}`}
export function render(){MED=V.page=='s'&&V.tab!='f'&&V.tab!='h'?podium(cur()):{};let h;if(V.page=='home')h=home();else h=ser();$('#app').innerHTML=`<header><h1 data-act="home">Arena</h1><span class="mut who">${esc(USER.name)}</span><button class="g" data-act="logout">Salir</button></header>`+h+(V.stat&&V.page=='s'&&cur()?modal(cur()):'');
 // Tabla de temporada: añadir columnas de rounds
 }
function tables(s){const se=last(s),ch=champOf(s),st=stats(s,se);
 const sr=s.fighters.map(f=>({f,w:st[f.id].w,l:st[f.id].l,p:st[f.id].w,d:st[f.id].w-st[f.id].l})).sort((a,b)=>b.p-a.p||b.d-a.d||b.w-a.w);
 const gen=s.fighters.map(f=>{let t=0,p=0,d=0;s.seasons.forEach(q=>{const x=stats(s,q)[f.id];t+=x.t;p+=x.w;d+=x.w-x.l});return{f,t,p,d}}).sort((a,b)=>b.p-a.p||b.d-a.d||b.t-a.t);
 const lm=lastMain(se),ps=stats(s,se,lm),
 prS=s.fighters.map(f=>({f,w:ps[f.id].w,p:ps[f.id].w,d:ps[f.id].w-ps[f.id].l})).sort((a,b)=>b.p-a.p||b.d-a.d||b.w-a.w).map(r=>r.f.id),
 prG=s.fighters.map(f=>{let t=0,p=0,d=0;s.seasons.forEach(q=>{const x=stats(s,q,q===se?lm:null)[f.id];t+=x.t;p+=x.w;d+=x.w-x.l});return{f,t,p,d}}).sort((a,b)=>b.p-a.p||b.d-a.d||b.t-a.t).map(r=>r.f.id),
 mv=(id,i,pr)=>{const j=pr.indexOf(id);return !lm||j==i?'<span style="color:#8a94b2">–</span>':j>i?'<span style="color:#3ddc84">▲</span>':'<span style="color:#ff4d4d">▼</span>'};
 const nm=f=>`${esc(f.name||'—')} ${f.id==ch?'<span class="badge">👑 Campeón</span>':''}`;
 return `<div class="card"><h3>Temporada ${se.n}</h3>${se.bracket?`<table><tr><th>#</th><th>Peleador</th><th>Pts</th><th>Rounds perdidos</th><th>Dif.</th></tr>${sr.map((r,i)=>`<tr><td>${i+1} ${mv(r.f.id,i,prS)}</td><td>${nm(r.f)}</td><td><b>${r.p}</b></td><td>${r.l}</td><td>${r.d}</td></tr>`).join('')}</table>`:'<p class="mut">Aún no empieza.</p>'}</div>
<div class="card"><h3>Tabla general</h3><table><tr><th>#</th><th>Peleador</th><th>Pts</th><th>Títulos</th><th>Dif. total</th></tr>${gen.map((r,i)=>`<tr><td>${i+1} ${mv(r.f.id,i,prG)}</td><td>${nm(r.f)}</td><td><b>${r.p}</b></td><td>${r.t}</td><td>${r.d}</td></tr>`).join('')}</table></div>`}
// ---------- Acciones ----------
const A={
 logout(){signOutUser()},
 home(){V.page='home';V.fight=null;V.stat=null;V.cmp=null;render()},
 newS(){const n=$('#ns').value.trim();if(!n)return $('#ns').focus();S.series.push({id:uid(),ts:Date.now(),name:n,rounds:+$('#nr').value,fighters:[],seasons:[{n:1,bracket:null,champ:null}]});save();render()},
 open(t){V.sid=t.dataset.id;V.sx=false;V.stat=null;V.cmp=null;V.page='s';V.tab='t';V.fight=null;render()},
delS(t){if(confirm('¿Mover esta serie a la papelera?')){const x=S.series.find(q=>q.id==t.dataset.id);S.series=S.series.filter(q=>q!==x);x.del=Date.now();S.trash.unshift(x);save();render()}},
 restore(t){const x=S.trash.find(q=>q.id==t.dataset.id);S.trash=S.trash.filter(q=>q!==x);delete x.del;S.series.push(x);save();render()},
 purge(t){if(confirm('Se eliminará para siempre. ¿Continuar?')){S.trash=S.trash.filter(q=>q.id!=t.dataset.id);save();render()}},
 stat(t){V.stat=t.dataset.id;V.cmp=null;render()},
 xs(){V.stat=null;V.cmp=null;render()},
 cmp(){V.cmp=$('#cs').value;render()},
 cmpOff(){V.cmp=null;render()},
 bkOut(){V.bk=V.bk=='out'?null:'out';render()},
 bkIn(){V.bk=V.bk=='in'?null:'in';render()},
 sx(){V.sx=!V.sx;render()},
 sxDl(){const s=cur();dl({arena:'serie',v:1,serie:s},(s.name.replace(/[^\w-]+/g,'_')||'serie')+'.json')},
 sxCp(){const t=$('#sxt');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}},
 allDl(){dl(S,'arena-copia-completa.json')},
 bkGo(){try{const d=JSON.parse($('#bk').value);
  if(d.arena=='serie'&&d.serie&&d.serie.fighters&&d.serie.seasons){const x=d.serie;if(S.series.some(q=>q.id==x.id)||S.trash.some(q=>q.id==x.id)){x.id=uid();x.name+=' (importada)'}delete x.del;S.series.push(x);alert('Serie importada: '+x.name)}
  else if(d.series){if(!confirm('Esto reemplaza TODOS los datos actuales. ¿Continuar?'))return;S=d;S.trash=S.trash||[]}
  else throw 0;save();V.bk=null;render()}catch(e){alert('Datos no válidos')}},
 tab(t){V.tab=t.dataset.k;V.fight=null;render()},
 addF(t){const s=cur();for(let i=0;i<+t.dataset.n;i++)s.fighters.push({id:uid(),name:'',img:'',desc:'',style:''});save();render()},
 delF(t){const s=cur();s.fighters=s.fighters.filter(f=>f.id!=t.dataset.id);save();render()},
 start(){build(cur());save();render()},
 go(){V.fight=nextMatch(last(cur()));V.sel=null;V.low=0;render()},
 back(){V.fight=null;render()},
 pick(t){V.sel=t.dataset.k;render()},
 low(t){V.low=+t.dataset.n;render()},
 ok(){const s=cur(),se=last(s),{r,i}=V.fight,m=se.bracket[r][i],n=need(s);
  m.n=(se.cnt=(se.cnt||0)+1);m.w=V.sel=='a'?m.a:m.b;m.sa=V.sel=='a'?n:V.low;m.sb=V.sel=='b'?n:V.low;
  if(m.to)se.bracket[r+1][m.to[0]][m.to[1]]=m.w;else if(se.po&&r==0){}else if(r+1<se.bracket.length){const nx=se.bracket[r+1][i>>1];nx[i%2?'b':'a']=m.w}else se.champ=m.w;
  V.fight=null;V.sel=null;save();render()},
 draw(){const s=cur(),se=last(s),r1=se.bracket[1],pool=new Set(se.direct||[]);
  r1.forEach(m=>{if(m.a)pool.add(m.a);if(m.b)pool.add(m.b)});se.bracket[0].forEach(m=>{if(!m.to)pool.add(m.w)});
  const ids=sh([...pool]);r1.forEach((m,i)=>{m.a=ids[2*i];m.b=ids[2*i+1]});se.drawn=true;save();
  V.rv=0;render();const tm=setInterval(()=>{V.rv++;if(V.rv>r1.length){clearInterval(tm);V.rv=null}render()},1100)},
 hs(t){V.hs=+t.dataset.n;render()},
 seq(){const s=cur();s.seasons.push({n:s.seasons.length+1,bracket:null,champ:null});V.tab='t';save();render()}
};
document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(t&&A[t.dataset.act])A[t.dataset.act](t)});
document.addEventListener('change',e=>{const t=e.target,s=V.sid&&cur();
 if(t.dataset.f){fm(s,t.dataset.id)[t.dataset.f]=t.value;save()}
 else if(t.dataset.s){s[t.dataset.s]=t.dataset.s=='rounds'?+t.value:t.value;save()}
 else if(t.dataset.imp&&t.files[0]){const r=new FileReader();r.onload=()=>{$('#bk').value=r.result};r.readAsText(t.files[0])}else if(t.dataset.img&&t.files[0]){const f=fm(s,t.dataset.img);status('saving','Subiendo imagen…');uploadFighterImage(t.files[0]).then(u=>{f.img=u;save();render()}).catch(e=>status('error',e.message))}});
