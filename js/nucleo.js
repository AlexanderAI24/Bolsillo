/* ============ temas ============ */
const THEMES=[
 {id:'fintech',name:'Fintech Moderna',desc:'Limpio y tecnológico',
  t:{'--bg':'#F8FAFC','--surface':'#FFFFFF','--surface-2':'#F1F5F9','--line':'#E2E8F0','--text':'#0F172A',
     '--text-dim':'#475569','--neutral':'#64748B','--income':'#10B981','--expense':'#EF4444','--cta':'#2563EB',
     '--cta-lt':'#60A5FA','--on-cta':'#FFFFFF','--glow':'rgba(37,99,235,.13)','--nav':'rgba(248,250,252,.92)',
     '--shadow':'0 1px 2px rgba(15,23,42,.05)','--shadow-lg':'0 10px 28px rgba(15,23,42,.10)'}},
 {id:'noir',name:'Neo-Noir',desc:'Modo oscuro premium',
  t:{'--bg':'#0B0F19','--surface':'#161F30','--surface-2':'#1E2A3F','--line':'#253048','--text':'#F1F5F9',
     '--text-dim':'#94A3B8','--neutral':'#475569','--income':'#34D399','--expense':'#F87171','--cta':'#818CF8',
     '--cta-lt':'#A5B4FC','--on-cta':'#0B0F19','--glow':'rgba(129,140,248,.20)','--nav':'rgba(11,15,25,.9)',
     '--shadow':'none','--shadow-lg':'0 12px 30px rgba(0,0,0,.45)'}},
 {id:'eco',name:'Orgánico',desc:'Calma y control',
  t:{'--bg':'#F4F3EF','--surface':'#FFFFFF','--surface-2':'#EEEDE7','--line':'#E1DFD6','--text':'#2D312E',
     '--text-dim':'#626864','--neutral':'#8B948E','--income':'#4E8752','--expense':'#C05C46','--cta':'#D4A373',
     '--cta-lt':'#E7C6A0','--on-cta':'#2D312E','--glow':'rgba(212,163,115,.20)','--nav':'rgba(244,243,239,.92)',
     '--shadow':'0 1px 2px rgba(45,49,46,.05)','--shadow-lg':'0 10px 28px rgba(45,49,46,.10)'}},
 {id:'creative',name:'Energía Creativa',desc:'Vibrante y juvenil',
  t:{'--bg':'#FAF7FF','--surface':'#FFFFFF','--surface-2':'#F3EDFF','--line':'#EAE1F7','--text':'#2A004E',
     '--text-dim':'#6B5E7B','--neutral':'#A0AEC0','--income':'#00C49F','--expense':'#FF6B6B','--cta':'#7928CA',
     '--cta-lt':'#A855F7','--on-cta':'#FFFFFF','--glow':'rgba(121,40,202,.14)','--nav':'rgba(250,247,255,.92)',
     '--shadow':'0 1px 2px rgba(42,0,78,.05)','--shadow-lg':'0 10px 30px rgba(42,0,78,.12)'}},
 {id:'medianoche',name:'Medianoche',desc:'Negro profundo, descansa la vista',
  t:{'--bg':'#000000','--surface':'#0E1114','--surface-2':'#171B20','--line':'#22272E',
     '--text':'#E8EDF2','--text-dim':'#8A949F','--neutral':'#4A535C','--income':'#2DD4A7',
     '--expense':'#FF5C7C','--cta':'#2DD4A7','--cta-lt':'#6EE7C7','--on-cta':'#00120C',
     '--glow':'rgba(45,212,167,.16)','--nav':'rgba(0,0,0,.92)',
     '--shadow':'none','--shadow-lg':'0 12px 32px rgba(0,0,0,.7)'}},
 {id:'arena',name:'Arena',desc:'Claro y cálido, fácil de leer',
  t:{'--bg':'#FBF7F2','--surface':'#FFFFFF','--surface-2':'#F3ECE3','--line':'#E7DED2',
     '--text':'#2B2622','--text-dim':'#6E6358','--neutral':'#9A8E80','--income':'#2F855A',
     '--expense':'#C53030','--cta':'#B45309','--cta-lt':'#D98324','--on-cta':'#FFFFFF',
     '--glow':'rgba(180,83,9,.14)','--nav':'rgba(251,247,242,.93)',
     '--shadow':'0 1px 2px rgba(43,38,34,.06)','--shadow-lg':'0 10px 28px rgba(43,38,34,.12)'}},
 {id:'oceano',name:'Océano',desc:'Azul profundo, sobrio',
  t:{'--bg':'#07131F','--surface':'#0E2033','--surface-2':'#152C44','--line':'#1E3A56',
     '--text':'#E6F1FA','--text-dim':'#8FAAC4','--neutral':'#49698A','--income':'#4ADE80',
     '--expense':'#FB7185','--cta':'#38BDF8','--cta-lt':'#7DD3FC','--on-cta':'#04121C',
     '--glow':'rgba(56,189,248,.18)','--nav':'rgba(7,19,31,.92)',
     '--shadow':'none','--shadow-lg':'0 12px 30px rgba(0,0,0,.5)'}},
 {id:'heritage',name:'Clásico Patrimonial',desc:'Institucional y seguro',
  t:{'--bg':'#FDFDFD','--surface':'#F1F3F5','--surface-2':'#E7EAEE','--line':'#DDE2E7','--text':'#1A2B49',
     '--text-dim':'#5A6578','--neutral':'#78909C','--income':'#2E7D32','--expense':'#C62828','--cta':'#B39250',
     '--cta-lt':'#D4B678','--on-cta':'#1A2B49','--glow':'rgba(179,146,80,.16)','--nav':'rgba(253,253,253,.93)',
     '--shadow':'0 1px 2px rgba(26,43,73,.06)','--shadow-lg':'0 10px 26px rgba(26,43,73,.12)'}}
];
/* Qué colores puede retocar el usuario, uno por uno, encima de la base elegida */
const RETOQUES=[
  {k:'--bg',     n:'Fondo'},
  {k:'--surface',n:'Tarjetas'},
  {k:'--text',   n:'Texto'},
  {k:'--cta',    n:'Color principal'},
  {k:'--income', n:'Ingresos'},
  {k:'--expense',n:'Gastos'}
];
function applyTheme(id){
  const th=THEMES.find(x=>x.id===id)||THEMES[1];
  const base={...th.t};
  const mios=(DB.cfg&&DB.cfg.colores)||{};
  /* los retoques del usuario mandan sobre la paleta base */
  Object.keys(mios).forEach(k=>{if(mios[k])base[k]=mios[k];});
  /* dos derivados se recalculan para que todo siga combinando */
  if(mios['--cta']){
    base['--cta-lt']=aclarar(mios['--cta'],0.3);
    base['--glow']=conAlfa(mios['--cta'],0.18);
    base['--on-cta']=claro(mios['--cta'])?'#10131A':'#FFFFFF';
  }
  if(mios['--surface'])base['--surface-2']=mezclar(mios['--surface'],base['--text'],0.07);
  if(mios['--bg'])base['--nav']=conAlfa(mios['--bg'],0.92);
  Object.entries(base).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  const tc=document.getElementById('tcolor');
  if(tc)tc.setAttribute('content',base['--bg']);
}
/* utilidades de color */
function aHex(c){
  c=String(c||'').trim();
  if(/^#[0-9a-f]{6}$/i.test(c))return c;
  if(/^#[0-9a-f]{3}$/i.test(c))return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];
  const m=c.match(/rgba?\(([^)]+)\)/);
  if(m){const p=m[1].split(',').map(x=>parseFloat(x));
    return '#'+p.slice(0,3).map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');}
  return '#000000';
}
const rgb=c=>{const h=aHex(c);return [1,3,5].map(i=>parseInt(h.substr(i,2),16));};
const hex=a=>'#'+a.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');
const aclarar=(c,t)=>hex(rgb(c).map(x=>x+(255-x)*t));
const mezclar=(a,b,t)=>{const x=rgb(a),y=rgb(b);return hex(x.map((v,i)=>v+(y[i]-v)*t));};
const conAlfa=(c,a)=>{const x=rgb(c);return `rgba(${x[0]},${x[1]},${x[2]},${a})`;};
const claro=c=>{const x=rgb(c);return (x[0]*299+x[1]*587+x[2]*114)/1000>150;};

/* Selector en dos pasos: primero la cuenta, luego el bolsillo.
   Evita listas enormes donde todo sale revuelto. */
function dobleSelector(id,ref,etiqueta){
  const [aid,pid]=String(ref||'').split(':');
  const cta=DB.cfg.accounts.find(a=>a.id===aid)||DB.cfg.accounts[0];
  if(!cta)return '';
  const bolsillos=[{id:'',n:'Disponible'}].concat(
    pocketsOrd(cta).map(p=>({id:p.id,n:p.name})));
  return `<div class="doble">
    <div class="dcampo">
      <span>${etiqueta||'Cuenta'}</span>
      <select data-dob="${id}" data-parte="cuenta">
        ${DB.cfg.accounts.map(a=>`<option value="${a.id}" ${a.id===cta.id?'selected':''}>${a.name}</option>`).join('')}
      </select>
    </div>
    ${bolsillos.length>1?`<div class="dcampo">
      <span>Bolsillo</span>
      <select data-dob="${id}" data-parte="bolsillo">
        ${bolsillos.map(b=>`<option value="${b.id}" ${b.id===(pid||'')?'selected':''}>${b.n}</option>`).join('')}
      </select>
    </div>`:''}
  </div>`;
}
/* arma la referencia a partir de los dos desplegables */
function refDoble(id){
  const c=document.querySelector(`[data-dob="${id}"][data-parte="cuenta"]`);
  const b=document.querySelector(`[data-dob="${id}"][data-parte="bolsillo"]`);
  if(!c)return null;
  return c.value+(b&&b.value?':'+b.value:'');
}

/* ============ persistencia ============ */
const KEY='bolsillo:v6',OLDS=['bolsillo:v5','bolsillo:v4','bolsillo:v2'];
const Store={
  async get(k){try{
    if(window.storage){const r=await window.storage.get(k);return r&&r.value?JSON.parse(r.value):null;}
    const raw=window.localStorage.getItem(k);return raw?JSON.parse(raw):null;}catch(e){return null;}},
  async save(d){try{
    if(window.storage){await window.storage.set(KEY,JSON.stringify(d));return;}
    window.localStorage.setItem(KEY,JSON.stringify(d));}catch(e){toast('No se pudo guardar');}}
};

/* ============ iconos ============ */
const S=p=>`<svg viewBox="0 0 24 24">${p}</svg>`;
const I={
  cart:S('<path d="M3 5h2l2.2 9.2a1 1 0 001 .8h7.6a1 1 0 001-.8L19 8H6"/><circle cx="9" cy="19" r="1.3"/><circle cx="16" cy="19" r="1.3"/>'),
  fork:S('<path d="M8 3v6a2 2 0 004 0V3M10 11v10M16.5 3c-1.2 2-1.2 5.5 0 7.5V21"/>'),
  bag:S('<path d="M5 8h14l-1.2 11.2a1 1 0 01-1 .8H7.2a1 1 0 01-1-.8L5 8zM9 8V6a3 3 0 016 0v2"/>'),
  car:S('<path d="M4 15l1.4-4.6A2 2 0 017.3 9h9.4a2 2 0 011.9 1.4L20 15v4h-3v-2H7v2H4z"/><path d="M7 15h.01M17 15h.01"/>'),
  home:S('<path d="M4 11l8-6 8 6v8a1 1 0 01-1 1H5a1 1 0 01-1-1z"/>'),
  bolt:S('<path d="M13 3L5.5 13.5H11l-1 7.5L18.5 10H13l1-7z"/>'),
  health:S('<path d="M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z"/>'),
  game:S('<rect x="3" y="8" width="18" height="9" rx="4"/><path d="M7.5 11v3M6 12.5h3M16 12h.01M18 14h.01"/>'),
  tv:S('<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M9 21h6"/>'),
  tag:S('<path d="M6 6h5.6a2 2 0 011.5.6l6 6a2 2 0 010 2.8l-3.7 3.7a2 2 0 01-2.8 0l-6-6A2 2 0 016 11.6z"/><path d="M9.5 9.5h.01"/>'),
  laptop:S('<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2 19h20"/>'),
  book:S('<path d="M5 5a2 2 0 012-2h12v18H7a2 2 0 01-2-2z"/><path d="M9 3v18"/>'),
  users:S('<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0M17 6.5a3 3 0 010 5.6M18.5 20a5.5 5.5 0 00-2-4"/>'),
  gift:S('<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M3 13h18M12 9v11M12 9S9 3.5 7 6s5 3 5 3zM12 9s3-5.5 5-3-5 3-5 3z"/>'),
  wallet:S('<path d="M4 8a2 2 0 012-2h11a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M16 12h3M4 8V6.5A1.5 1.5 0 015.5 5H16"/>'),
  code:S('<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>'),
  back:S('<path d="M4 12h13M12 7l5 5-5 5M20 5v14"/>'),
  atm:S('<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 9h8M8 13h4"/>'),
  card:S('<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/>'),
  dots:S('<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'),
  swap:S('<path d="M7 8h11l-3-3M17 16H6l3 3"/>'),
  plane:S('<path d="M11 3l9 9-4 1-3 6-2-6-6-2 6-3z"/>'),
  cut:S('<circle cx="7" cy="7" r="2.5"/><circle cx="7" cy="17" r="2.5"/><path d="M9 9l10 9M9 15L19 6"/>'),
  church:S('<path d="M12 3v6M9 6h6M6 21V11l6-4 6 4v10z"/>'),
  piggy:S('<path d="M4 12a6 6 0 016-6h4a6 6 0 016 6v3a2 2 0 01-2 2h-1v2h-3v-2H9v2H6v-2.5A6 6 0 014 12z"/><path d="M16 11h.01"/>'),
  heart:S('<path d="M12 20s-7-4.4-7-9a4 4 0 017-2.6A4 4 0 0119 11c0 4.6-7 9-7 9z"/>'),
  scale:S('<path d="M12 4v16M6 8l-3 6h6zM18 8l-3 6h6zM5 8h14"/>')
};

/* ============ datos ============ */
const CATS={
  out:[['Mercado','cart'],['Restaurante','fork'],['Domicilios','bag'],['Transporte','car'],['Arriendo','home'],
       ['Hogar','home'],['Servicios','bolt'],['Salud','health'],['Ocio','game'],['Suscripciones','tv'],
       ['Ropa','tag'],['Tecnología','laptop'],['Educación','book'],['Familia','users'],['Viajes','plane'],
       ['Gimnasio','heart'],['Carro','car'],['Iglesia','church'],['Aseo','home'],['Personal','cut'],['Otro','dots']],
  in:[['Salario','wallet'],['Freelance','code'],['Reembolso','back'],['Regalo','gift'],['Venta','tag'],['Otro','dots']],
  move:[['Retiro en cajero','atm'],['Traslado','swap'],['Apartado','piggy'],['Reintegro','back']],
  pay:[['Pago tarjeta','card']]
};
const CATICON={};Object.values(CATS).flat().forEach(([n,i])=>CATICON[n]=i);
CATICON['Ajuste de saldo']='scale';
const GRADS=[['#1E2530','#0B0E14'],['#820AD1','#C13BFF'],['#0F3D3E','#0A2426'],['#8A6A2E','#D9B25F'],
             ['#1D3557','#2A6F97'],['#4A0E2E','#8E1B4F']];
const ACOLORS=['#2563EB','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#EF4444','#64748B'];
const DEC={COP:0,ARS:0,USD:2,EUR:2,MXN:2,PEN:2};
const SYM={COP:'$',ARS:'$',USD:'$',EUR:'€',MXN:'$',PEN:'S/'};

let DB={mov:[],cfg:{cur:'COP',budget:0,theme:'noir',accounts:[],cards:[],plans:{},fixed:[],totals_v5:1}};
let cursor=new Date();cursor.setDate(1);
let pcur=new Date();pcur.setDate(1);
let d={t:'out',amt:'',acc:null,sub:null,dst:null,owner:null,cat:null,ownerOpen:false,date:null};
const isoOf=dt=>dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
const isoToday=()=>isoOf(new Date());
function isoTs(iso){
  if(!iso)return Date.now();
  if(iso===isoToday())return Date.now();
  const [y,m,dd]=iso.split('-').map(Number);
  return new Date(y,m-1,dd,12,0,0).getTime();
}
function dateWord(iso){
  if(!iso)return '';
  const t=new Date();const a=isoOf(t);
  t.setDate(t.getDate()-1);const b=isoOf(t);
  if(iso===a)return 'hoy';
  if(iso===b)return 'ayer';
  const [y,m,dd]=iso.split('-').map(Number);
  const dias=Math.round((Date.now()-new Date(y,m-1,dd,12).getTime())/86400000);
  return dd+' de '+MO[m-1].toLowerCase()+(dias>0?' · hace '+dias+' días':dias<0?' · en el futuro':'');
}
let openAcc={};let homeAcc='all';
const belongs=(m,aid)=>String(m.src||'').split(':')[0]===aid||String(m.dst||'').split(':')[0]===aid
  ||String(m.owner||'').split(':')[0]===aid;

const dec=()=>DEC[DB.cfg.cur]??2;
const TOL=1;  /* tolerancia en pesos, para no molestar por centavos de redondeo */
const fmt=n=>new Intl.NumberFormat('es',{minimumFractionDigits:dec(),
  maximumFractionDigits:Math.max(dec(),2)}).format(Math.abs(n||0)<0.005?0:(n||0));
/* devuelve la lista de saldos que quedaron en rojo */
function enRojo(){
  const B=balances(),malos=[];
  DB.cfg.accounts.forEach(a=>{
    if((B.bal[a.id]||0)<-TOL)malos.push({ref:a.id,n:a.name+' · Disponible',v:B.bal[a.id]});
    a.pockets.forEach(p=>{const r=a.id+':'+p.id;
      if((B.bal[r]||0)<-TOL)malos.push({ref:r,n:a.name+' · '+p.name,v:B.bal[r]});});
  });
  return malos;
}
const money=n=>SYM[DB.cfg.cur]+' '+fmt(n);
const MO=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const $=i=>document.getElementById(i);
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');setTimeout(()=>e.classList.remove('on'),2600);}
const clean=v=>{const n=parseFloat(rawFromField(v));return isNaN(n)?0:n;};
/* valor formateado para los campos de dinero */
const mv=n=>(+n)?money(+n):'';
/* todo input con data-money se formatea mientras se escribe */
const grp=x=>String(x).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
/* El campo muestra texto con formato, pero el valor real se guarda aparte en
   data-raw. Asi ni el punto de miles ni el borrado confunden la lectura. */
function rawFromField(v){
  const s=String(v).replace(/[^\d.,]/g,'');
  const i=s.indexOf(',');
  if(i<0)return s.replace(/\./g,'');
  return s.slice(0,i).replace(/\./g,'')+'.'+s.slice(i+1).replace(/\D/g,'').slice(0,2);
}
function fmtField(raw){
  if(raw===''||raw==null)return '';
  const dot=String(raw).indexOf('.');
  const ip=(dot<0?String(raw):String(raw).slice(0,dot)).replace(/\D/g,'');
  const dp=dot<0?null:String(raw).slice(dot+1).replace(/\D/g,'');
  return SYM[DB.cfg.cur]+' '+grp(ip||'0')+(dp!==null?','+dp:'');
}
/* al enfocar se fija el valor real; si no, la primera tecla se contaria dos veces */
document.addEventListener('focusin',e=>{
  const el=e.target;
  if(el&&el.matches&&el.matches('input[data-money]')&&el.dataset.raw===undefined)
    el.dataset.raw=rawFromField(el.value);
},true);
document.addEventListener('input',e=>{
  const el=e.target;
  if(!el||!el.matches||!el.matches('input[data-money]'))return;
  if(el.dataset.raw===undefined){
    el.dataset.raw=rawFromField(el.value);
    const o=fmtField(el.dataset.raw);
    if(o!==el.value){el.value=o;try{el.setSelectionRange(o.length,o.length);}catch(_){}}
    return;
  }
  let raw=el.dataset.raw;
  /* venia todo seleccionado: lo que escribas arranca de cero */
  if(el.dataset.limpiar==='1'){raw='';delete el.dataset.limpiar;}
  const it=e.inputType||'';
  if(it.indexOf('delete')===0)raw=raw.slice(0,-1);
  else if(e.data){
    for(const ch of e.data){
      if(ch>='0'&&ch<='9'){
        const d=raw.indexOf('.');
        if(d>=0&&raw.length-d-1>=2)continue;
        raw+=ch;
      }else if((ch==='.'||ch===',')&&raw.indexOf('.')<0)raw=(raw||'0')+'.';
    }
  }else raw=rawFromField(el.value);
  el.dataset.raw=raw;
  const out=fmtField(raw);
  if(out!==el.value){
    el.value=out;
    try{el.setSelectionRange(out.length,out.length);}catch(_){}
  }
},true);
const mkey=dt=>dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
const mlabel=dt=>MO[dt.getMonth()]+' '+dt.getFullYear();

/* ============ modal ============ */
function modal(o){
  return new Promise(res=>{
    const box=$('mbox');
    box.innerHTML=`<h4>${o.title}</h4>${o.text?`<p>${o.text}</p>`:''}
      ${o.input?`<input id="minput" inputmode="decimal" data-money value="${mv(o.value)}">`:''}
      <div class="mbtns">
        <button class="pri" data-r="ok">${o.ok||'Aceptar'}</button>
        ${o.alt?`<button data-r="alt">${o.alt}</button>`:''}
        <button data-r="cancel">${o.cancel||'Cancelar'}</button></div>`;
    $('modal').classList.add('on');
    const inp=$('minput');
    if(inp)setTimeout(()=>{
      inp.dataset.raw=rawFromField(inp.value);
      inp.dataset.limpiar='1';     /* la primera tecla reemplaza todo */
      inp.focus();
      try{inp.setSelectionRange(0,inp.value.length);}catch(_){}
    },80);
    box.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{
      const v=inp?clean(inp.value):null;
      $('modal').classList.remove('on');
      res({action:b.dataset.r,value:v});});
  });
}
$('modal').onclick=e=>{if(e.target.id==='modal')$('modal').classList.remove('on');};
/* modal con lista de opciones: devuelve el id elegido o null */
function modalPick(o){
  return new Promise(res=>{
    const box=$('mbox');
    box.innerHTML=`<h4>${o.title}</h4>${o.text?`<p>${o.text}</p>`:''}
      <div class="mbtns">${o.options.map(x=>`<button data-p="${x.id}" style="text-align:left">
        <span style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <span>${x.n}</span><span style="font-weight:700;color:var(--text)">${x.extra||''}</span></span>
        </button>`).join('')}
        <button data-p="">Cancelar</button></div>`;
    $('modal').classList.add('on');
    box.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{
      $('modal').classList.remove('on');res(b.dataset.p||null);});
  });
}

/* ============ refs ============ */
const isCard=ref=>DB.cfg.cards.some(c=>c.id===ref);
function resolve(ref){
  if(!ref)return{name:'—',full:'—'};
  const card=DB.cfg.cards.find(c=>c.id===ref);
  if(card)return{kind:'card',name:card.name,full:card.name};
  const [aid,pid]=ref.split(':');
  const a=DB.cfg.accounts.find(x=>x.id===aid);
  if(!a)return{kind:'gone',name:'Eliminado',full:'Eliminado'};
  if(!pid)return{kind:'acct',name:a.name,full:a.name,color:ACOLORS[a.color%ACOLORS.length],acc:a};
  const p=a.pockets.find(x=>x.id===pid);
  if(!p)return{kind:'gone',name:'Eliminado',full:'Eliminado'};
  return{kind:'pocket',name:p.name,full:a.name+' · '+p.name,color:ACOLORS[a.color%ACOLORS.length],acc:a,pk:p};
}
const nameOf=r=>resolve(r).full;
/* los bolsillos se muestran de mayor a menor saldo */
function pocketsOrd(a,B){
  B=B||balances();
  return [...a.pockets].sort((x,y)=>
    (B.bal[a.id+':'+y.id]||0)-(B.bal[a.id+':'+x.id]||0));
}
function flat(){
  const out=[],B=balances();
  DB.cfg.accounts.forEach(a=>{
    const c=ACOLORS[a.color%ACOLORS.length];
    out.push({id:a.id,n:a.pockets.length?a.name+' · Disponible':a.name,c});
    pocketsOrd(a,B).forEach(p=>out.push({id:a.id+':'+p.id,n:a.name+' · '+p.name,c}));});
  return out;
}
function pocketsOf(aid){
  const a=DB.cfg.accounts.find(x=>x.id===aid);if(!a)return[];
  const c=ACOLORS[a.color%ACOLORS.length];
  return [{id:'',n:'Disponible',c}].concat(pocketsOrd(a).map(p=>({id:p.id,n:p.name,c})));
}

/* ============ cálculos ============ */
function balances(){
  const accTotal={},pocket={};
  DB.cfg.accounts.forEach(a=>{
    accTotal[a.id]=+a.balance||0;
    a.pockets.forEach(p=>pocket[a.id+':'+p.id]=+p.balance||0);});
  const cards={};DB.cfg.cards.forEach(c=>cards[c.id]=0);
  const apply=(ref,delta)=>{
    if(!ref)return;const [aid,pid]=ref.split(':');
    if(!(aid in accTotal))return;
    accTotal[aid]+=delta;
    if(pid&&(ref in pocket))pocket[ref]+=delta;};
  DB.mov.forEach(m=>{
    if(m.t==='in')apply(m.src,m.amount);
    else if(m.t==='adj')apply(m.src,m.amount);
    else if(m.t==='out'){if(isCard(m.src))cards[m.src]+=m.amount;else apply(m.src,-m.amount);}
    else if(m.t==='move'){apply(m.src,-m.amount);apply(m.dst,m.amount);}
    else if(m.t==='pay'){apply(m.src,-m.amount);if(m.dst in cards)cards[m.dst]-=m.amount;}});
  const bal={};
  DB.cfg.accounts.forEach(a=>{
    let sum=0;a.pockets.forEach(p=>{const r=a.id+':'+p.id;bal[r]=pocket[r]||0;sum+=bal[r];});
    bal[a.id]=(accTotal[a.id]||0)-sum;});
  return {bal,accTotal,cards,cardTotal:Object.values(cards).reduce((s,v)=>s+v,0),
    total:Object.values(accTotal).reduce((s,v)=>s+v,0)};
}
function debts(){
  const raw={},add=(de,a,x)=>{const k=de+'>'+a;raw[k]=(raw[k]||0)+x;};
  DB.mov.forEach(m=>{
    if(m.t==='out'&&m.owner&&m.owner!==m.src)add(m.owner,m.src,m.amount);
    if(m.t==='move'&&m.cat==='Reintegro')add(m.src,m.dst,-m.amount);});
  const seen={},out=[];
  Object.keys(raw).forEach(k=>{
    const [a,b]=k.split('>');if(seen[b+'>'+a]||seen[k])return;seen[k]=1;
    const net=(raw[k]||0)-(raw[b+'>'+a]||0);
    if(Math.abs(net)>0.009)out.push(net>0?{from:a,to:b,amt:net}:{from:b,to:a,amt:-net});});
  return out.filter(x=>resolve(x.from).kind!=='gone'&&resolve(x.to).kind!=='gone');
}
/* ===== ciclo de facturacion de tarjetas =====
   Una compra entra al corte del mes si se hizo hasta el dia de corte;
   si fue despues, pasa al corte siguiente. */
const diasDe=(y,m)=>new Date(y,m+1,0).getDate();
const clampDia=(y,m,d)=>Math.min(d,diasDe(y,m));
function cycleOf(card,ts){
  const cut=+card.cutoff||0;if(!cut)return null;
  const dt=new Date(ts);
  let cy=dt.getFullYear(),cm=dt.getMonth();
  if(dt.getDate()>clampDia(cy,cm,cut)){cm++;if(cm>11){cm=0;cy++;}}
  const close=new Date(cy,cm,clampDia(cy,cm,cut),23,59,59);
  const due=+card.due||cut;
  let py=close.getFullYear(),pm=close.getMonth()+(due<=cut?1:0);
  if(pm>11){pm-=12;py++;}
  const pay=new Date(py,pm,clampDia(py,pm,due),23,59,59);
  return {close,pay,key:mkey(close)};
}
const DFMT=dt=>dt.getDate()+' '+MO[dt.getMonth()].toLowerCase().slice(0,3)+' '+dt.getFullYear();
const pend=m=>Math.max(0,m.amount-(m.paidAmt||0));
function cardBuys(cardId){
  return DB.mov.filter(m=>m.t==='out'&&m.src===cardId).sort((a,b)=>a.ts-b.ts);
}
/* separa lo ya facturado (hay que pagarlo) de lo que va al proximo corte */
function cardSplit(card){
  const now=Date.now(),due=[],next=[];
  cardBuys(card.id).forEach(m=>{
    if(pend(m)<=0.009)return;
    const c=cycleOf(card,m.ts);
    if(!c||c.close.getTime()<=now)due.push(m);else next.push(m);
  });
  const sum=a=>a.reduce((s,m)=>s+pend(m),0);
  /* Lo que "ya tienes guardado" es el saldo REAL del bolsillo de la tarjeta.
     Asi el numero de la tarjeta y el del bolsillo nunca se separan. */
  const totalDebe=sum(due)+sum(next);
  const B=balances();
  const enBolsillo=(card.pocket&&resolve(card.pocket).kind!=='gone')
    ?Math.max(0,B.bal[card.pocket]||0):0;
  const listo=Math.min(enBolsillo,totalDebe);
  const falta=Math.max(0,totalDebe-listo);
  const marcado=[...due,...next].reduce((s,m)=>s+Math.min(pend(m),+m.resMonto||(m.res?pend(m):0)),0);
  let nextClose=null,nextPay=null;
  if(next.length){const c=cycleOf(card,next[0].ts);nextClose=c.close;nextPay=c.pay;}
  let payBy=null;
  if(due.length){const c=cycleOf(card,due[due.length-1].ts);payBy=c?c.pay:null;}
  return {due,next,dueTotal:sum(due),nextTotal:sum(next),payBy,nextClose,nextPay,
    listo,falta,enBolsillo,marcado,totalDebe,dueListo:listo};
}
const inMonth=m=>{const x=new Date(m.ts);return x.getFullYear()===cursor.getFullYear()&&x.getMonth()===cursor.getMonth();};
const monthMov=()=>DB.mov.filter(inMonth).sort((a,b)=>b.ts-a.ts);
