/* ============ navegación ============ */
const VIEWS=['home','plan','planedit','cards','stats','set','s-acc','s-card','s-fix','s-inbox','s-scan','s-style','s-gen','s-back'];
let pila=[];          /* historial de pantallas dentro de la app */
let navegandoAtras=false;
function go(v,desdeAtras){
  /* cada pantalla nueva deja una marca para que el boton atras del
     celular retroceda dentro de la app en vez de cerrarla */
  if(!desdeAtras){
    const actual=pila[pila.length-1];
    if(actual!==v){
      pila.push(v);
      try{history.pushState({v},'');}catch(e){}
    }
  }
  VIEWS.forEach(x=>$('v-'+x).style.display=(x===v)?'block':'none');
  const tab=v.startsWith('s-')||v==='set'?'set':(v==='planedit'?'plan':(v==='cards'?'home':v));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.v===tab));
  if(v==='planedit')renderPlanEdit();
  if(v==='s-acc')renderAccts();
  if(v==='s-card')renderCardEdit();
  if(v==='s-style'){renderThemes();renderPaleta();}
  if(v==='s-fix')renderFixed();
  if(v==='s-scan')renderScan();
  if(v==='s-inbox')renderInbox();
  if(v==='plan')renderPlan();
  window.scrollTo(0,0);
}
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>go(t.dataset.v));
/* acciones rápidas de Inicio: abren el capturador ya en el modo correcto */
document.querySelectorAll('[data-rap]').forEach(b=>b.onclick=async()=>{
  if(!DB.cfg.accounts.length){
    const r=await modal({title:'Primero una cuenta',
      text:'Para registrar movimientos necesitas al menos una cuenta.',ok:'Crear cuenta'});
    if(r.action==='ok')go('s-acc');return;}
  openSheet(b.dataset.rap);});
/* atras del celular: cierra primero lo que este abierto, luego retrocede */
window.addEventListener('popstate',()=>{
  if($('modal').classList.contains('on')){$('modal').classList.remove('on');repisar();return;}
  if($('paysheet').classList.contains('open')){$('paysheet').classList.remove('open');repisar();return;}
  if($('sheet').classList.contains('open')){$('sheet').classList.remove('open');repisar();return;}
  pila.pop();
  const anterior=pila[pila.length-1]||'home';
  go(anterior,true);
  if(pila.length<=1)repisar();
});
/* vuelve a dejar una marca para no quedarnos sin historial */
function repisar(){try{history.pushState({v:pila[pila.length-1]||'home'},'');}catch(e){}}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>go(b.dataset.back));
$('cardpill').onclick=()=>go('cards');
document.querySelectorAll('.nav2 button[data-s]').forEach(b=>
  b.onclick=()=>{cursor.setMonth(cursor.getMonth()+ +b.dataset.s);render();});
['list','clist'].forEach(id=>$(id).onclick=async e=>{
  const row=e.target.closest('.row');
  const b=e.target.closest('[data-id]');
  if(!b){if(row&&row.dataset.mov)editMov(row.dataset.mov);return;}
  const r=await modal({title:'Borrar movimiento',text:'Esta acción no se puede deshacer.',ok:'Borrar'});
  if(r.action!=='ok')return;
  await delMov(b.dataset.id);});

/* ============ ajustes: cuentas ============ */
function renderAccts(){
  const B=balances();
  if(!DB.cfg.accounts.length){
    $('acctedit').innerHTML=`<div class="hint" style="margin:0 0 4px">Todavía no tienes cuentas.
      Crea una por cada banco o billetera que uses, y otra para tu efectivo.</div>`;
    return;}
  $('acctedit').innerHTML=DB.cfg.accounts.map((a,i)=>{
    const av=B.bal[a.id]||0;
    return `<div class="ed"><div class="hd"><span>Cuenta ${i+1}</span><button data-dela="${a.id}">Quitar</button></div>
      <input data-af="name" data-i="${i}" value="${a.name}" placeholder="Nombre de la cuenta">
      <input data-af="balance" data-i="${i}" inputmode="decimal" data-money value="${mv(B.accTotal[a.id]||0)}" placeholder="Saldo total hoy">
      <input data-af="fin" data-i="${i}" inputmode="numeric" maxlength="4" value="${a.fin||''}"
        placeholder="Últimos 4 dígitos (opcional)">
      <div class="swatches">${ACOLORS.map((c,ci)=>
        `<button class="sw ${a.color===ci?'on':''}" data-ac="${ci}" data-i="${i}" style="background:${c}"></button>`).join('')}</div>
      <div class="subh"><span>Bolsillos</span>
        <span>Disponible <b style="color:${av<0?'var(--expense)':'inherit'}">${money(av)}</b></span></div>
      ${a.pockets.map((p,pi)=>({p,pi}))
         .sort((x,y)=>(B.bal[a.id+':'+y.p.id]||0)-(B.bal[a.id+':'+x.p.id]||0))
         .map(({p,pi})=>`<div class="duo">
        <input data-pf="name" data-i="${i}" data-p="${pi}" value="${p.name}" placeholder="Nombre">
        <input class="sm" data-pf="balance" data-i="${i}" data-p="${pi}" inputmode="decimal" data-money value="${mv(B.bal[a.id+':'+p.id]||0)}" placeholder="Saldo hoy">
        <button data-delp="${pi}" data-i="${i}">✕</button></div>`).join('')}
      <button class="mini" data-addp="${i}">+ Agregar bolsillo</button></div>`;}).join('');
}
$('acctedit').addEventListener('input',async e=>{
  const t=e.target;
  if(t.dataset.af){const a=DB.cfg.accounts[+t.dataset.i];
    if(t.dataset.af==='name')a.name=t.value;
    else if(t.dataset.af==='fin')a.fin=t.value.replace(/\D/g,'').slice(0,4);
    else{const B=balances();a.balance+=clean(t.value)-(B.accTotal[a.id]||0);}
    await Store.save(DB);render();updateAvail();return;}
  if(t.dataset.pf){const a=DB.cfg.accounts[+t.dataset.i],p=a.pockets[+t.dataset.p];
    if(t.dataset.pf==='name')p.name=t.value;
    else{const B=balances();p.balance+=clean(t.value)-(B.bal[a.id+':'+p.id]||0);}
    await Store.save(DB);render();updateAvail();}});
function updateAvail(){
  const B=balances();
  document.querySelectorAll('#acctedit .ed').forEach((ed,i)=>{
    const a=DB.cfg.accounts[i];if(!a)return;const av=B.bal[a.id]||0;
    const s=ed.querySelector('.subh span:last-child');
    if(s)s.innerHTML=`Disponible <b style="color:${av<0?'var(--expense)':'inherit'}">${money(av)}</b>`;});
}
$('acctedit').addEventListener('click',async e=>{
  const c=e.target.closest('[data-ac]');
  if(c){DB.cfg.accounts[+c.dataset.i].color=+c.dataset.ac;await Store.save(DB);renderAccts();render();return;}
  const ap=e.target.closest('[data-addp]');
  if(ap){DB.cfg.accounts[+ap.dataset.addp].pockets.push({id:'p'+Date.now(),name:'Bolsillo',balance:0});
    await Store.save(DB);renderAccts();render();return;}
  const dp=e.target.closest('[data-delp]');
  if(dp){const r=await modal({title:'Quitar bolsillo',text:'Su plata vuelve al disponible de la cuenta.',ok:'Quitar'});
    if(r.action!=='ok')return;
    DB.cfg.accounts[+dp.dataset.i].pockets.splice(+dp.dataset.delp,1);
    await Store.save(DB);renderAccts();render();return;}
  const da=e.target.closest('[data-dela]');
  if(da){const r=await modal({title:'Quitar cuenta',text:'Sus movimientos quedan en el historial.',ok:'Quitar'});
    if(r.action!=='ok')return;
    DB.cfg.accounts=DB.cfg.accounts.filter(a=>a.id!==da.dataset.dela);
    await Store.save(DB);renderAccts();render();}});
$('addcash').onclick=async()=>{
  DB.cfg.accounts.push({id:'a'+Date.now(),name:'Efectivo',balance:0,color:2,
    pockets:[{id:'p'+Date.now(),name:'Gastos del día',balance:0}]});
  await Store.save(DB);renderAccts();render();
  toast('Efectivo creado. Usa Traslado para registrar retiros del cajero');};
$('addacct').onclick=async()=>{
  DB.cfg.accounts.push({id:'a'+Date.now(),name:'Mi cuenta',balance:0,
    color:DB.cfg.accounts.length%ACOLORS.length,pockets:[]});
  await Store.save(DB);renderAccts();render();};

/* ============ ajustes: tarjetas ============ */
function renderCardEdit(){
  if(!DB.cfg.cards.length){
    $('cardedit').innerHTML=`<div class="hint" style="margin:0 0 4px">No tienes tarjetas registradas.
      Agrégalas solo si quieres llevar el control de lo que debes en ellas.</div>`;
    return;}
  $('cardedit').innerHTML=DB.cfg.cards.map((c,i)=>`
    <div class="ed"><div class="hd"><span>Tarjeta ${i+1}</span><button data-del="${c.id}">Quitar</button></div>
      <input data-f="name" data-i="${i}" value="${c.name}" placeholder="Nombre">
      <input data-f="limit" data-i="${i}" inputmode="decimal" data-money value="${mv(c.limit)}" placeholder="Cupo total (opcional)">
      <input data-f="fin" data-i="${i}" inputmode="numeric" maxlength="4" value="${c.fin||''}"
        placeholder="Últimos 4 dígitos (para reconocerla en capturas)">
      <div class="dlbl"><span>Día de corte</span><span>Día de pago</span></div>
      <div class="duo">
        <input data-f="cutoff" data-i="${i}" type="number" min="1" max="31" inputmode="numeric"
          value="${c.cutoff||''}" placeholder="ej. 15">
        <input data-f="due" data-i="${i}" type="number" min="1" max="31" inputmode="numeric"
          value="${c.due||''}" placeholder="ej. 30">
      </div>
      <div class="dlbl" style="margin-top:8px"><span>Bolsillo donde guardas la plata de esta tarjeta</span></div>
      <select data-f="pocket" data-i="${i}">
        <option value="">Ninguno</option>
        ${flat().filter(x=>x.id.includes(':')).map(x=>
          `<option value="${x.id}" ${c.pocket===x.id?'selected':''}>${x.n}</option>`).join('')}
      </select>
      ${c.cutoff?`<div class="hint" style="margin:2px 0 0">Compras hasta el ${c.cutoff} se pagan el
        ${c.due||c.cutoff} ${(+c.due||+c.cutoff)<=+c.cutoff?'del mes siguiente':'de ese mismo mes'}.</div>`:''}
      <div class="swatches">${GRADS.map((g,gi)=>`<button class="sw ${c.g===gi?'on':''}" data-g="${gi}" data-i="${i}"
        style="background:linear-gradient(140deg,${g[1]},${g[0]})"></button>`).join('')}</div></div>`).join('');
}
async function cardField(t){
  if(!t.dataset.f)return;const c=DB.cfg.cards[+t.dataset.i];if(!c)return;
  const f=t.dataset.f;
  if(f==='name')c.name=t.value;
  else if(f==='limit')c.limit=clean(t.value);
  else if(f==='pocket')c.pocket=t.value||null;
  else if(f==='fin')c.fin=t.value.replace(/\D/g,'').slice(0,4);
  else{const n=parseInt(t.value,10);c[f]=(n>=1&&n<=31)?n:null;}
  await Store.save(DB);render();}
$('cardedit').addEventListener('input',e=>{if(e.target.tagName==='INPUT')cardField(e.target);});
$('cardedit').addEventListener('change',e=>{if(e.target.tagName==='SELECT')cardField(e.target);});
$('cardedit').addEventListener('click',async e=>{
  const g=e.target.closest('[data-g]');
  if(g){DB.cfg.cards[+g.dataset.i].g=+g.dataset.g;await Store.save(DB);renderCardEdit();render();return;}
  const dl=e.target.closest('[data-del]');
  if(dl){const r=await modal({title:'Quitar tarjeta',text:'Sus movimientos quedan en el historial.',ok:'Quitar'});
    if(r.action!=='ok')return;
    DB.cfg.cards=DB.cfg.cards.filter(c=>c.id!==dl.dataset.del);await Store.save(DB);renderCardEdit();render();}});
$('addcard').onclick=async()=>{
  DB.cfg.cards.push({id:'c'+Date.now(),name:'Mi tarjeta',limit:0,g:DB.cfg.cards.length%GRADS.length});
  await Store.save(DB);renderCardEdit();render();};

/* ============ estilo y general ============ */
/* ---- paleta propia: se ajusta un color a la vez sobre la base elegida ---- */
function colorActual(k){
  const mios=DB.cfg.colores||{};
  if(mios[k])return aHex(mios[k]);
  const th=THEMES.find(x=>x.id===DB.cfg.theme)||THEMES[1];
  return aHex(th.t[k]);
}
function renderPaleta(){
  const mios=DB.cfg.colores||{};
  const tocados=Object.keys(mios).filter(k=>mios[k]).length;
  $('paleta').innerHTML=`
    <div class="ed" style="margin-top:0">
      <div class="hd"><span>Tus colores</span>
        ${tocados?`<button id="pal-reset">Volver a la base</button>`:''}</div>
      <div class="hint" style="margin:0 0 10px">Cambia uno a la vez. Lo que no toques
        se queda como en la paleta que elegiste arriba.</div>
      ${RETOQUES.map(r=>`
        <div class="colfila">
          <label for="col-${r.k.replace('--','')}">${r.n}</label>
          <span class="colval">${colorActual(r.k).toUpperCase()}</span>
          <input type="color" id="col-${r.k.replace('--','')}" data-col="${r.k}"
            value="${colorActual(r.k)}">
          ${mios[r.k]?`<button class="colx" data-colx="${r.k}" title="quitar">✕</button>`:''}
        </div>`).join('')}
    </div>`;
  $('paleta').querySelectorAll('[data-col]').forEach(inp=>{
    inp.oninput=()=>{
      DB.cfg.colores=DB.cfg.colores||{};
      DB.cfg.colores[inp.dataset.col]=inp.value;
      applyTheme(DB.cfg.theme);
      const v=inp.parentElement.querySelector('.colval');
      if(v)v.textContent=inp.value.toUpperCase();
    };
    inp.onchange=async()=>{await Store.save(DB);renderPaleta();render();};
  });
  $('paleta').querySelectorAll('[data-colx]').forEach(b=>b.onclick=async()=>{
    delete DB.cfg.colores[b.dataset.colx];
    applyTheme(DB.cfg.theme);await Store.save(DB);renderPaleta();render();});
  if($('pal-reset'))$('pal-reset').onclick=async()=>{
    DB.cfg.colores={};applyTheme(DB.cfg.theme);await Store.save(DB);
    renderPaleta();render();toast('Colores de la paleta restaurados');};
}

function renderThemes(){
  $('themes').innerHTML=THEMES.map(t=>`
    <button class="th ${DB.cfg.theme===t.id?'on':''}" data-th="${t.id}">
      <div class="prev" style="background:${t.t['--bg']};border:1px solid ${t.t['--line']}">
        <div class="card" style="background:${t.t['--surface']};border:1px solid ${t.t['--line']}"></div>
        <div class="dots"><i style="background:${t.t['--income']}"></i><i style="background:${t.t['--expense']}"></i>
          <i style="background:${t.t['--cta']}"></i></div></div>
      <div class="meta"><div class="n">${t.name}</div><div class="d">${t.desc}</div></div>
      <div class="chk"></div></button>`).join('');
}
$('themes').onclick=async e=>{const b=e.target.closest('[data-th]');if(!b)return;
  DB.cfg.theme=b.dataset.th;applyTheme(DB.cfg.theme);
  renderThemes();renderPaleta();await Store.save(DB);render();toast('Estilo aplicado');};
$('cfg-cur').onchange=async()=>{DB.cfg.cur=$('cfg-cur').value;await Store.save(DB);render();};
$('cfg-budget').onchange=async()=>{DB.cfg.budget=clean($('cfg-budget').value);await Store.save(DB);render();};

/* ============ datos ============ */
function download(n,t,ty){
  if(NATIVO&&window.Android.guardarArchivo){
    if(window.Android.guardarArchivo(n,t))return;
  }
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([t],{type:ty}));a.download=n;a.click();URL.revokeObjectURL(a.href);}
$('exp-csv').onclick=()=>{
  const T={in:'ingreso',out:'gasto',move:'traslado',pay:'pago tarjeta',adj:'ajuste'};
  const rows=[['fecha','tipo','categoria','nota','origen','destino','a_cuenta_de','monto']]
    .concat([...DB.mov].sort((a,b)=>a.ts-b.ts).map(m=>[new Date(m.ts).toISOString().slice(0,10),
      T[m.t],m.cat||'',m.note||'',nameOf(m.src),m.dst?nameOf(m.dst):'',m.owner?nameOf(m.owner):'',m.amount]));
  download('bolsillo.csv','\uFEFF'+rows.map(r=>r.map(c=>`"${String(c??'').replace(/"/g,'""')}"`).join(';')).join('\n'),'text/csv');};
$('exp-json').onclick=()=>download('bolsillo-respaldo.json',JSON.stringify(DB),'application/json');
$('imp-json').onclick=()=>$('fjson').click();
$('imp-pegar').onclick=()=>{
  if($('pegarbox').innerHTML){$('pegarbox').innerHTML='';return;}
  $('pegarbox').innerHTML=`<div class="ed">
    <div class="hint" style="margin:0 0 8px">Abre el archivo de respaldo, copia todo su
      contenido y pégalo aquí. Sirve cuando el selector de archivos no deja escogerlo.</div>
    <textarea id="pegar-txt" rows="4" style="width:100%;padding:10px 12px;border-radius:11px;
      background:var(--bg);border:1px solid var(--line);font-size:12px;font-family:inherit;
      color:var(--text);outline:none;resize:vertical" placeholder='{"mov":[...' ></textarea>
    <button class="mini" id="pegar-ok" style="margin-top:8px;border-style:solid;color:var(--cta)">
      Restaurar</button></div>`;
  $('pegar-ok').onclick=async()=>{
    try{
      const x=JSON.parse($('pegar-txt').value.trim());
      if(!x.mov)throw 0;
      DB=migrate(x);applyTheme(DB.cfg.theme);await Store.save(DB);
      fill();render();$('pegarbox').innerHTML='';toast('Respaldo restaurado');
    }catch(e){toast('Ese texto no es un respaldo válido');}};
};
$('fjson').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=async()=>{try{const x=JSON.parse(r.result);if(!x.mov)throw 0;DB=migrate(x);
    applyTheme(DB.cfg.theme);await Store.save(DB);fill();render();toast('Respaldo restaurado');
  }catch(err){toast('No pude leer ese archivo. Debe ser el JSON de respaldo.');}};
  r.onerror=()=>toast('No se pudo abrir el archivo');
  r.readAsText(f);};

function splitCSV(line,sep){
  const out=[];let cur='',q=false;
  for(let i=0;i<line.length;i++){const c=line[i];
    if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++;}else q=!q;}
    else if(c===sep&&!q){out.push(cur);cur='';}else cur+=c;}
  out.push(cur);return out.map(s=>s.trim());
}
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
function parseDate(s){
  s=String(s).trim();
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]).getTime();
  m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1]).getTime();}
  const t=Date.parse(s);return isNaN(t)?null:t;
}
$('imp-csv').onclick=()=>$('fcsv').click();
$('fcsv').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=async()=>{try{
    const text=String(r.result).replace(/^\uFEFF/,'');
    const lines=text.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length<2)return toast('El archivo está vacío');
    const sep=(lines[0].match(/;/g)||[]).length>=(lines[0].match(/,/g)||[]).length?';':',';
    const head=splitCSV(lines[0],sep).map(norm);
    const col=n=>head.findIndex(h=>h===n||h.includes(n));
    const iF=col('fecha')>=0?col('fecha'):col('date');
    const iM=col('monto')>=0?col('monto'):(col('valor')>=0?col('valor'):col('importe'));
    if(iF<0||iM<0)return toast('El CSV necesita columnas de fecha y monto');
    const iC=col('categoria'),iN=col('nota')>=0?col('nota'):col('descripcion'),
          iT=col('tipo'),iO=col('origen')>=0?col('origen'):col('cuenta');
    const cats=CATS.out.map(([n])=>n),acc0=DB.cfg.accounts[0];
    if(!acc0)return toast('Primero crea al menos una cuenta');
    const F=flat();let ok=0,skip=0;
    lines.slice(1).forEach(l=>{
      const c=splitCSV(l,sep),ts=parseDate(c[iF]||''),amt=Math.abs(clean(c[iM]||0));
      if(!ts||!amt){skip++;return;}
      const tipo=norm(c[iT]||'');
      const t=tipo.includes('ingres')||tipo.includes('nomina')||tipo.includes('salario')?'in':'out';
      const rawCat=(c[iC]||'').trim();
      const cat=cats.find(x=>norm(x)===norm(rawCat))||'Otro';
      const sn=norm(c[iO]||'');
      const hit=F.find(x=>norm(x.n)===sn||(sn.length>2&&norm(x.n).includes(sn)));
      DB.mov.push({id:ts+''+Math.floor(Math.random()*9999),ts,t,amount:amt,
        src:hit?hit.id:acc0.id,cat,note:(c[iN]||rawCat||'').slice(0,60)});
      ok++;});
    await Store.save(DB);render();
    toast(`Importados ${ok} movimientos${skip?', omitidos '+skip:''}`);
  }catch(err){toast('No se pudo leer el archivo');}};r.readAsText(f);};
$('wipe').onclick=async()=>{
  const r=await modal({title:'Borrar datos',
    text:'<b>Empezar de cero</b> deja la app como recién instalada: sin cuentas, bolsillos, tarjetas, planes ni movimientos.<br><br><b>Solo movimientos</b> conserva tu configuración.',
    ok:'Empezar de cero',alt:'Solo movimientos'});
  if(r.action==='cancel')return;
  if(r.action==='ok'){
    DB={mov:[],cfg:{cur:DB.cfg.cur,budget:0,theme:DB.cfg.theme,accounts:[],cards:[],plans:{},fixed:[],totals_v5:1}};
    openAcc={};
  }else{
    DB.mov=[];
    Object.values(DB.cfg.plans).forEach(p=>{p.incomeDone=false;p.incomeMovId=null;
      p.items.forEach(it=>{it.done=false;it.movId=null;it.adjId=null;});});
  }
  await Store.save(DB);fill();renderAccts();renderCardEdit();render();
  toast(r.action==='ok'?'App reiniciada':'Movimientos borrados');};
function fill(){$('cfg-cur').value=DB.cfg.cur;$('cfg-budget').value=mv(DB.cfg.budget);}

/* ============ migración ============ */
function migrate(x){
  const c=x.cfg||{};let out;
  if(c.accounts){
    out={mov:x.mov||[],cfg:c};
    if(!c.totals_v5){out.cfg.accounts.forEach(a=>{
      if(a.pockets&&a.pockets.length)a.balance=(+a.balance||0)+a.pockets.reduce((s,p)=>s+(+p.balance||0),0);});
      out.cfg.totals_v5=1;}
  }else{
    const accounts=[{id:'a1',name:'Cuenta',balance:+c.bank||0,color:0,pockets:[]},
      {id:'a2',name:'Efectivo',balance:(+c.food||0)+(+c.own||0),color:2,pockets:[
        {id:'p1',name:'Comida',balance:+c.food||0},{id:'p2',name:'Mi dinero',balance:+c.own||0}]}];
    const map={bank:'a1',food:'a2:p1',own:'a2:p2'};
    out={mov:(x.mov||[]).map(m=>({...m,src:map[m.src]||m.src,dst:map[m.dst]||m.dst,owner:map[m.owner]||m.owner})),
      cfg:{cur:c.cur||'COP',budget:c.budget||0,theme:c.theme||'noir',accounts,cards:c.cards||[],totals_v5:1}};
  }
  if(!out.cfg.plans){
    out.cfg.plans={};
    const old=out.cfg.plan;
    if(old&&old.items&&old.items.length){
      out.cfg.plans[mkey(new Date())]={income:old.income||0,src:old.src,incomeDone:false,incomeMovId:null,
        items:old.items.map(it=>({name:it.name,amount:it.amount,kind:it.kind,cat:it.cat,target:it.target,
          done:!!it.done,movId:it.movId||null,adjId:null}))};
    }
    delete out.cfg.plan;
  }
  if(!out.cfg.cards)out.cfg.cards=[];
  return out;
}

/* ============ arranque ============ */
(async()=>{
  let s=await Store.get(KEY);
  if(!s)for(const k of OLDS){const o=await Store.get(k);if(o&&o.mov){s=migrate(o);await Store.save(s);break;}}
  if(s&&s.mov)DB=migrate(s);
  DB.cfg.accounts.forEach(a=>{if(a.pockets&&a.pockets.length)openAcc[a.id]=true;});
  /* arregla planes y sus movimientos si apuntaban a una cuenta que ya no existe */
  const f0=flat()[0];
  if(f0)Object.values(DB.cfg.plans||{}).forEach(P=>{
    const bad=!P.src||resolve(P.src).kind==='gone';
    if(bad){
      const old=P.src;P.src=f0.id;
      DB.mov.forEach(m=>{if(m.plan&&m.src===old)m.src=f0.id;});
    }
  });
  if(!DB.cfg.fixed)DB.cfg.fixed=[];
  if(NATIVO){
    try{const pend=JSON.parse(window.Android.pendientes()||'[]');
      if(pend.length)setTimeout(()=>toast(pend.length+' movimientos esperando en la bandeja'),900);
    }catch(e){}
  }
  try{history.replaceState({v:'home'},'');history.pushState({v:'home'},'');}catch(e){}
  pila=['home'];
  applyTheme(DB.cfg.theme);fill();
  const nf=await runFixed();
  render();go('home');
  if(nf)toast(nf===1?'Se registró 1 gasto fijo del mes':'Se registraron '+nf+' gastos fijos del mes');
})();
