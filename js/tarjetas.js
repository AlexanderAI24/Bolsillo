/* ============ gastos fijos ============ */
function renderFixed(){
  const F=flat(),R=DB.cfg.fixed||[];
  $('fixedit').innerHTML=R.length?R.map((r,i)=>`
    <div class="ed"><div class="hd"><span>Fijo ${i+1}</span><button data-delfx="${i}">Quitar</button></div>
      <input data-fx="name" data-i="${i}" value="${r.name||''}" placeholder="Nombre (ej. Netflix)">
      <input data-fx="amount" data-i="${i}" inputmode="decimal" data-money value="${mv(r.amount)}" placeholder="Valor">
      <div class="dlbl"><span>Tipo</span><span>Día del mes</span></div>
      <div class="duo">
        <select data-fx="t" data-i="${i}">
          <option value="out" ${r.t!=='in'?'selected':''}>Gasto</option>
          <option value="in" ${r.t==='in'?'selected':''}>Ingreso</option></select>
        <input data-fx="day" data-i="${i}" type="number" min="1" max="31" value="${r.day||1}">
      </div>
      <div class="duo">
        <select data-fx="src" data-i="${i}">${F.map(x=>
          `<option value="${x.id}" ${r.src===x.id?'selected':''}>${x.n}</option>`).join('')}
          ${DB.cfg.cards.map(c=>`<option value="${c.id}" ${r.src===c.id?'selected':''}>${c.name}</option>`).join('')}</select>
        <select data-fx="cat" data-i="${i}">${(r.t==='in'?CATS.in:CATS.out).map(([n])=>
          `<option value="${n}" ${r.cat===n?'selected':''}>${n}</option>`).join('')}</select>
      </div>
      <div class="qd"><span>${r.last?'Último registro: '+r.last:'Todavía no se ha registrado'}</span>
        <b style="font-size:11.5px;color:var(--text-dim)">día ${r.day||1}</b></div>
    </div>`).join('')
    :`<div class="hint" style="margin:0">Aún no tienes gastos fijos. Sirven para el arriendo,
      las suscripciones o el gimnasio: los defines una vez y la app los registra sola cada mes.</div>`;
}
$('fixedit').addEventListener('input',async e=>{
  const t=e.target;if(!t.dataset.fx||t.tagName!=='INPUT')return;
  const r=DB.cfg.fixed[+t.dataset.i],f=t.dataset.fx;
  if(f==='name')r.name=t.value;
  else if(f==='amount')r.amount=clean(t.value);
  else if(f==='day'){const n=parseInt(t.value,10);r.day=(n>=1&&n<=31)?n:1;}
  await Store.save(DB);});
$('fixedit').addEventListener('change',async e=>{
  const t=e.target;if(!t.dataset.fx||t.tagName!=='SELECT')return;
  const r=DB.cfg.fixed[+t.dataset.i];r[t.dataset.fx]=t.value;
  if(t.dataset.fx==='t')r.cat=(t.value==='in'?'Salario':'Otro');
  await Store.save(DB);renderFixed();});
$('fixedit').addEventListener('click',async e=>{
  const b=e.target.closest('[data-delfx]');if(!b)return;
  const r=await modal({title:'Quitar gasto fijo',text:'Los movimientos ya registrados se conservan.',ok:'Quitar'});
  if(r.action!=='ok')return;
  DB.cfg.fixed.splice(+b.dataset.delfx,1);await Store.save(DB);renderFixed();});
$('addfix').onclick=async()=>{
  if(!DB.cfg.accounts.length)return toast('Primero crea una cuenta');
  DB.cfg.fixed=DB.cfg.fixed||[];
  DB.cfg.fixed.push({id:'f'+Date.now(),name:'Nuevo gasto fijo',amount:0,t:'out',
    day:1,src:flat()[0].id,cat:'Otro',last:null});
  await Store.save(DB);renderFixed();};

/* corre al abrir la app: registra los fijos que ya tocaban este mes */
async function runFixed(){
  const R=DB.cfg.fixed||[];if(!R.length)return 0;
  const hoy=new Date(),k=mkey(hoy);let n=0;
  R.forEach(r=>{
    if(!r.amount||r.last===k)return;
    /* la cuenta debe existir todavia */
    const ok=isCard(r.src)||resolve(r.src).kind!=='gone';
    if(!ok)return;
    /* si el dia no existe en este mes (31 en abril) se usa el ultimo */
    const dia=clampDia(hoy.getFullYear(),hoy.getMonth(),r.day||1);
    if(hoy.getDate()<dia)return;
    const ts=new Date(hoy.getFullYear(),hoy.getMonth(),dia,12).getTime();
    const m={id:'fx'+Date.now()+n,ts,t:r.t==='in'?'in':'out',amount:r.amount,
      src:r.src,cat:r.cat||'Otro',note:r.name,fixed:1};
    if(m.t==='out'&&isCard(m.src))m.paidAmt=0;
    DB.mov.push(m);r.last=k;n++;});
  if(n)await Store.save(DB);
  return n;
}

/* ============ pago de tarjeta ============ */
let pay={card:null,mode:'sel',src:null,sel:{},amt:''};
function openPay(cardId){
  const c=DB.cfg.cards.find(x=>x.id===cardId);if(!c)return;
  const F=flat();if(!F.length)return toast('Primero crea una cuenta');
  const sug=(c.pocket&&F.some(x=>x.id===c.pocket))?c.pocket:F[0].id;
  pay={card:c,mode:'sel',src:sug,sel:{},amt:'',parcial:{}};
  $('pay-card').textContent=c.name;$('pay-cur').textContent=SYM[DB.cfg.cur];
  syncPay();$('paysheet').classList.add('open');$('paysheet').scrollTop=0;repisar();
}
function payTotal(){
  if(pay.mode==='free')return parseFloat(String(pay.amt||'0').replace(',','.'))||0;
  return cardBuys(pay.card.id).filter(m=>pay.sel[m.id])
    .reduce((s,m)=>s+montoDe(m),0);
}
/* cuanto se va a abonar a esta compra: todo lo pendiente, o lo que el usuario escriba */
function montoDe(m){
  const v=pay.parcial[m.id];
  if(v===undefined||v===null||v==='')return pend(m);
  return Math.min(pend(m),parseFloat(String(v).replace(',','.'))||0);
}
function syncPay(){
  document.querySelectorAll('#pay-mode button').forEach(b=>b.classList.toggle('on',b.dataset.m===pay.mode));
  $('pay-src').innerHTML=dobleSelector('paysrc',pay.src,'Cuenta');
  const sp=cardSplit(pay.card);
  if(pay.mode==='sel'){
    const blk=(t,arr)=>arr.length?`<div class="grp">${t}</div>`+arr.map(m=>{
      const c=cycleOf(pay.card,m.ts);
      const marcada=!!pay.sel[m.id];
      const parcial=montoDe(m)<pend(m)-0.009;
      return `<div class="buy ${marcada?'on':''}" data-b="${m.id}">
        <div style="display:flex;align-items:center;gap:11px;width:100%">
          <button class="bk"></button>
          <div class="bm"><div class="bn">${m.cat}${m.note?' · '+m.note:''}</div>
            <div class="bd">${DFMT(new Date(m.ts))}${c?' · vence '+DFMT(c.pay):''}</div>
            <button class="rz ${m.res?'on':''}" data-res="${m.id}">${
            !m.res?'Sin guardar'
            :(resDe(m)<pend(m)-0.009?'◐ '+money(resDe(m))+' guardados'
            :'✓ En bolsillo')}</button></div>
          <div class="ba num">${money(Math.max(0,pend(m)-resDe(m)))}
            ${((m.paidAmt||0)>0.009||resDe(m)>0.009)
              ?`<i>de ${money(m.amount)}</i>`:''}</div>
        </div>
        ${marcada?`<div class="abono">
          <span>Abonar</span>
          <input data-ab="${m.id}" inputmode="decimal" data-money
            value="${mv(montoDe(m))}" placeholder="${mv(pend(m))}">
          ${parcial?`<b>quedan ${money(pend(m)-montoDe(m))}</b>`:'<b>completa</b>'}
        </div>`:''}
      </div>`;}).join(''):'';
    const html=blk('Ya facturado · toca pagarlo',sp.due)+blk('Aún no te lo cobran',sp.next);
    $('pay-list').innerHTML=(html?`<div class="hint" style="margin:4px 0 12px">
      Toca una compra para incluirla en el pago. La etiqueta de abajo te dice si ya
      apartaste esa plata en un bolsillo o si todavía te falta guardarla.</div>`+html:'')
      ||'<div class="empty"><b>Nada pendiente</b>Esta tarjeta está al día.</div>';
    $('pay-list').querySelectorAll('[data-b]').forEach(el=>el.onclick=ev=>{
      if(ev.target.closest('.abono'))return;
      const id=el.dataset.b;pay.sel[id]=!pay.sel[id];
      if(!pay.sel[id])delete pay.parcial[id];
      syncPay();});
    $('pay-list').querySelectorAll('[data-ab]').forEach(inp=>{
      inp.onclick=ev=>ev.stopPropagation();
      inp.oninput=()=>{
        pay.parcial[inp.dataset.ab]=clean(inp.value);
        const t=payTotal();
        $('pay-amt').textContent=fmt(t);
        $('pay-ok').disabled=!(t>0&&pay.src);
        const fila=inp.closest('[data-b]'),m=DB.mov.find(x=>x.id===inp.dataset.ab);
        const b=fila&&fila.querySelector('.abono b');
        if(b&&m){const q=pend(m)-montoDe(m);
          b.textContent=q>0.009?'quedan '+money(q):'completa';}
      };});
    $('pay-list').querySelectorAll('[data-res]').forEach(b=>b.onclick=async ev=>{
      ev.stopPropagation();
      const m=DB.mov.find(x=>x.id===b.dataset.res);if(!m)return;
      await toggleRes(m);});
  }else{
    $('pay-list').innerHTML=`<div class="hint" style="margin-top:4px">
      Escribe cuánto vas a pagar. Se abona a las compras más antiguas primero,
      y lo que quede sin cubrir sigue pendiente para el próximo corte.</div>
      <div class="pad" style="padding:14px 0 0" id="pay-pad"></div>`;
    $('pay-pad').innerHTML=['1','2','3','4','5','6','7','8','9',',','0','del','000']
      .map(k=>`<button class="key ${k===','||k==='del'||k==='000'?'fn':''}"
        ${k==='000'?'style="grid-column:span 3"':''} data-k="${k}">${k==='del'?'⌫':k}</button>`).join('');
    $('pay-pad').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;
      let a=pay.amt||'';
      if(k==='del')a=a.slice(0,-1);
      else if(k===','){if(a.indexOf(',')<0)a=(a||'0')+',';}
      else{const i=a.indexOf(',');
        if(i>=0){if(a.length-i-1<2)a+=k;}
        else if(a.replace(/\D/g,'').length<11)a=(a+k).replace(/^0+(?=\d)/,'');}
      pay.amt=a;if(navigator.vibrate)navigator.vibrate(8);syncPay();};
  }
  const t=payTotal();
  $('pay-amt').textContent=pay.mode==='free'
    ?(pay.amt?pay.amt.replace(/^(\d+)/,x=>grp(x)):'0'):fmt(t);
  $('pay-ok').disabled=!(t>0&&pay.src);
}
/* cuanto de esta compra ya tienes guardado */
const resDe=m=>Math.min(pend(m),+m.resMonto||0);
async function toggleRes(m){
  const card=DB.cfg.cards.find(c=>c.id===m.src);if(!card)return;
  const yaGuardado=resDe(m);
  const falta=pend(m)-yaGuardado;

  /* si ya hay algo guardado, preguntamos qué hacer */
  if(yaGuardado>0.009){
    const opciones=[];
    if(falta>0.009)opciones.push({id:'mas',n:'Guardar '+money(falta)+' más',extra:'completar'});
    opciones.push({id:'quitar',n:'Quitar el respaldo',extra:money(yaGuardado)});
    const q=await modalPick({title:'Ya guardaste '+money(yaGuardado),
      text:`De esta compra de <b>${money(pend(m))}</b> ya tienes apartado
        <b>${money(yaGuardado)}</b>${falta>0.009?', faltan '+money(falta):' (completa)'}.`,
      options:opciones});
    if(!q)return;
    if(q==='quitar'){
      (m.resMovs||[]).forEach(id=>{DB.mov=DB.mov.filter(x=>x.id!==id);});
      if(m.resMovId)DB.mov=DB.mov.filter(x=>x.id!==m.resMovId);
      m.res=false;m.resMonto=0;m.resMovs=[];m.resMovId=null;
      await Store.save(DB);syncPay();render();
      return toast('Respaldo deshecho');}
  }

  const destino=card.pocket&&resolve(card.pocket).kind!=='gone'?card.pocket:null;
  if(!destino){
    const r=await modal({title:'Falta el bolsillo de '+card.name,
      text:'Asígnale un bolsillo a esta tarjeta y la app moverá la plata sola cada vez que marques una compra.',
      ok:'Asignar bolsillo ahora',alt:'Solo marcarla, sin mover plata'});
    if(r.action==='cancel')return;
    if(r.action==='ok'){$('paysheet').classList.remove('open');go('s-card');return;}
    m.res=true;m.resMovId=null;await Store.save(DB);syncPay();render();
    toast('Marcada, pero sin mover plata');return;}

  const B=balances();
  /* primero cuánto vas a guardar: puede ser una parte */
  const rm=await modal({title:'¿Cuánto vas a guardar?',
    text:`Esta compra debe <b>${money(pend(m))}</b>${yaGuardado>0.009
      ?' y ya tienes '+money(yaGuardado):''}. Puedes apartar solo una parte.`,
    input:true,value:falta>0.009?falta:pend(m),ok:'Continuar'});
  if(rm.action!=='ok')return;
  const monto=Math.min(falta>0.009?falta:pend(m),rm.value||0);
  if(monto<=0.009)return toast('Escribe un monto');

  const ops=[{id:'YA',n:'Ya lo aparté yo mismo',extra:'no mover nada'}]
    .concat(flat().filter(x=>x.id!==destino)
      .map(x=>({id:x.id,n:x.n,extra:money(B.bal[x.id]||0)})));
  const origen=await modalPick({title:'¿De dónde sale la plata?',
    text:`Se van a apartar <b>${money(monto)}</b> hacia ${resolve(destino).name}, el bolsillo de ${card.name}.`,
    options:ops});
  if(!origen)return;
  if(origen==='YA'){
    m.res=true;m.resMonto=yaGuardado+monto;m.resMovs=m.resMovs||[];
    await Store.save(DB);syncPay();render();
    return toast('Marcados '+money(monto)+'. No se movió plata.');}
  if((B.bal[origen]||0)<monto){
    const r=await modal({title:'No alcanza',
      text:`${nameOf(origen)} tiene ${money(B.bal[origen]||0)} y necesitas ${money(monto)}. ¿Lo hago igual?`,
      ok:'Hacerlo igual'});
    if(r.action!=='ok')return;}
  const id='rs'+Date.now()+Math.floor(Math.random()*99);
  DB.mov.push({id,ts:Date.now(),t:'move',src:origen,dst:destino,amount:monto,
    cat:'Apartado',note:'Respaldo '+(m.note||m.cat||card.name)});
  m.res=true;
  m.resMonto=yaGuardado+monto;
  m.resMovs=(m.resMovs||[]).concat([id]);
  await Store.save(DB);syncPay();render();
  const resta=pend(m)-m.resMonto;
  toast(resta>0.009
    ?money(monto)+' guardados · faltan '+money(resta)
    :money(monto)+' guardados · esta compra queda cubierta');
}
$('pay-mode').onclick=e=>{const b=e.target.closest('[data-m]');if(!b)return;pay.mode=b.dataset.m;syncPay();};
$('pay-src').addEventListener('change',e=>{
  const parte=e.target.dataset.parte;
  if(parte==='cuenta'){
    /* al cambiar de cuenta hay que volver a listar sus bolsillos */
    pay.src=e.target.value;
    $('pay-src').innerHTML=dobleSelector('paysrc',pay.src,'Cuenta');
  }else{
    const r=refDoble('paysrc');if(r)pay.src=r;
  }
  const t=payTotal();
  $('pay-ok').disabled=!(t>0&&pay.src);});
$('pay-close').onclick=()=>$('paysheet').classList.remove('open');
$('pay-x').onclick=()=>$('paysheet').classList.remove('open');
$('sheet-x').onclick=()=>$('sheet').classList.remove('open');
$('pay-ok').onclick=async()=>{
  let total=payTotal();if(total<=0)return;
  const Bp=balances(),hay=Bp.bal[pay.src]||0;
  if(hay-total<-TOL){
    const r=await modal({title:'No alcanza',
      text:`${nameOf(pay.src)} tiene ${money(hay)} y el pago lo deja en <b>${money(hay-total)}</b>.`,
      ok:'Pagar igual',cancel:'Cambiar origen'});
    if(r.action!=='ok')return;}
  const alloc=[];
  if(pay.mode==='sel'){
    cardBuys(pay.card.id).filter(m=>pay.sel[m.id]).forEach(m=>{
      const x=montoDe(m);if(x<=0.009)return;
      m.paidAmt=(m.paidAmt||0)+x;
      if(pend(m)<=0.009){m.res=false;m.resMovId=null;}
      alloc.push({id:m.id,amt:x});});
  }else{
    let rest=total;
    for(const m of cardBuys(pay.card.id)){
      if(rest<=0.009)break;
      const x=Math.min(pend(m),rest);
      if(x>0.009){m.paidAmt=(m.paidAmt||0)+x;alloc.push({id:m.id,amt:x});rest-=x;}
    }
  }
  DB.mov.push({id:Date.now()+''+Math.floor(Math.random()*999)+'p',ts:Date.now(),t:'pay',
    amount:total,src:pay.src,dst:pay.card.id,cat:'Pago tarjeta',note:'',alloc});
  await Store.save(DB);$('paysheet').classList.remove('open');render();
  toast('Pago registrado por '+money(total));
};

/* ============ atajos de gastos frecuentes ============
   Mira tu historial, agrupa lo que repites y lo ofrece listo para un toque. */
function gastosFrecuentes(tipo){
  const grupos={};
  DB.mov.forEach(m=>{
    if(m.t!==tipo)return;
    const k=comercio(m.note||'')||('cat:'+m.cat);
    const g=grupos[k]||(grupos[k]={n:0,montos:[],cat:m.cat,src:m.src,
      nombre:(m.note||m.cat||'').slice(0,22),ult:0});
    g.n++;g.montos.push(m.amount);g.cat=m.cat;g.src=m.src;
    if(m.ts>g.ult){g.ult=m.ts;g.nombre=(m.note||m.cat||'').slice(0,22);}
  });
  return Object.values(grupos)
    .filter(g=>g.n>=2&&g.nombre)
    .map(g=>{
      const ord=[...g.montos].sort((a,b)=>a-b);
      g.monto=ord[Math.floor(ord.length/2)];   /* el monto tipico, no el promedio */
      return g;})
    .sort((a,b)=>(b.n-a.n)||(b.ult-a.ult))
    .slice(0,6);
}
function pintarAtajos(){
  if(d.editId||d.t==='pay'||d.t==='move'||d.amt){$('atajos').innerHTML='';return;}
  const fr=gastosFrecuentes(d.t);
  if(!fr.length){$('atajos').innerHTML='';return;}
  $('atajos').innerHTML=`<div class="atajo-k">Lo que repites</div>
    <div class="atajos">${fr.map((g,i)=>`<button data-at="${i}">
      <span class="an">${g.nombre}</span>
      <span class="am num">${money(g.monto)}</span></button>`).join('')}</div>`;
  $('atajos').querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{
    const g=fr[+b.dataset.at];
    d.amt=String(g.monto).replace('.',',');
    d.cat=g.cat;
    if(g.src){
      if(isCard(g.src))d.acc=g.src;
      else{const [a,pk]=String(g.src).split(':');
        if(DB.cfg.accounts.some(x=>x.id===a)){d.acc=a;d.sub=pk||null;}}
    }
    $('note').value=g.nombre;d.catManual=true;
    sync();
    if(navigator.vibrate)navigator.vibrate(10);
  });
}
