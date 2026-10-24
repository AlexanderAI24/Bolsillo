/* ============ capturador ============ */
const srcRef=()=>(d.t==='out'||d.t==='in')&&d.acc&&!isCard(d.acc)
  ?d.acc+(d.sub?':'+d.sub:''):d.acc;
function openSheet(t){
  const a0=DB.cfg.accounts[0];
  d={t:t||'out',amt:'',acc:a0?a0.id:null,sub:null,dst:null,owner:null,cat:null,ownerOpen:false,
     date:isoToday(),editId:null};
  if(d.t==='pay'){d.cat='Pago tarjeta';d.dst=DB.cfg.cards[0]&&DB.cfg.cards[0].id;}
  if(d.t==='move')d.cat='Traslado';
  verTodasCats=false;d.catManual=false;d.verCats=false;d.pista=null;
  $('note').value='';if($('clasif'))$('clasif').innerHTML='';
  $('cur').textContent=SYM[DB.cfg.cur];
  $('save').textContent='Guardar';
  sync();$('sheet').classList.add('open');$('sheet').scrollTop=0;repisar();
}
async function editMov(id){
  const m=DB.mov.find(x=>x.id===id);if(!m)return;
  if(m.t==='pay'){
    const r=await modal({title:'Pago de tarjeta',
      text:'Los pagos no se editan porque están ligados a compras concretas. Puedes borrarlo y registrarlo de nuevo.',
      ok:'Borrar el pago',cancel:'Dejarlo así'});
    if(r.action==='ok')await delMov(id);
    return;}
  if(m.t==='adj')return toast('Los ajustes de saldo no se editan, se borran');
  openSheet(m.t);
  d.editId=id;
  d.amt=String(m.amount).replace('.',',');
  d.date=isoOf(new Date(m.ts));
  d.cat=m.cat;d.dst=m.dst||null;
  if(isCard(m.src))d.acc=m.src;
  else{const [a,pk]=String(m.src).split(':');d.acc=a;d.sub=pk||null;}
  if(m.t==='move'){d.acc=m.src;}
  if(m.owner&&m.owner!==m.src){d.ownerOpen=true;d.owner=m.owner;}
  $('note').value=m.note||'';
  d.catManual=true;d.verCats=false;
  $('save').textContent='Guardar cambios';
  sync();
}
async function delMov(id){
  const gone=DB.mov.find(m=>m.id===id);
  if(gone&&gone.t==='pay'&&gone.alloc)gone.alloc.forEach(a=>{
    const t=DB.mov.find(m=>m.id===a.id);if(t)t.paidAmt=Math.max(0,(t.paidAmt||0)-a.amt);});
  /* si se borra una compra que ya tenia abonos, se recorta el pago asociado */
  if(gone&&gone.t==='out'&&isCard(gone.src)){
    DB.mov.forEach(pg=>{
      if(pg.t!=='pay'||!pg.alloc)return;
      const k=pg.alloc.findIndex(a=>a.id===gone.id);
      if(k<0)return;
      pg.amount=Math.max(0,pg.amount-pg.alloc[k].amt);
      pg.alloc.splice(k,1);});
    DB.mov=DB.mov.filter(pg=>!(pg.t==='pay'&&pg.alloc&&!pg.alloc.length&&pg.amount<=0.009));
  }
  /* y su traslado de respaldo, si lo tenia */
  if(gone&&gone.resMovId)DB.mov=DB.mov.filter(m=>m.id!==gone.resMovId);
  DB.mov=DB.mov.filter(m=>m.id!==id);
  Object.values(DB.cfg.plans).forEach(p=>{
    p.items.forEach(it=>{if(it.movId===id||it.adjId===id){it.done=false;it.movId=null;it.adjId=null;}});
    if(p.incomeMovId===id){p.incomeDone=false;p.incomeMovId=null;}});
  await Store.save(DB);render();
}
const chip=(l,sel,a)=>l.map(o=>`<button data-${a}="${o.id}" class="${sel===o.id||(sel===null&&o.id==='')?'on':''}">
  ${o.c?`<i class="bulb" style="background:${o.c}"></i>`:''}${o.n}</button>`).join('');
/* lista desplegable para cuando hay muchas opciones */
const selector=(l,sel,a)=>`<select class="selgrande" data-sel="${a}">
  ${l.map(o=>`<option value="${o.id}" ${sel===o.id||(sel===null&&o.id==='')?'selected':''}>${o.n}</option>`).join('')}
</select>`;
function sync(){
  document.querySelectorAll('#seg button').forEach(b=>b.classList.toggle('on',b.dataset.t===d.t));
  const accs=DB.cfg.accounts.map(a=>({id:a.id,n:a.name,c:ACOLORS[a.color%ACOLORS.length]}));
  const cards=DB.cfg.cards.map(c=>({id:c.id,n:c.name,c:'var(--expense)'}));
  const F=flat();
  if(d.t==='out'||d.t==='in'){
    $('k1').textContent=d.t==='out'?'Pagué con':'Entró a';
    $('src').innerHTML=chip(d.t==='out'?accs.concat(cards):accs,d.acc,'s');
    const pk=isCard(d.acc)?[]:pocketsOf(d.acc),show=pk.length>1;
    $('rsub').style.display=show?'block':'none';
    $('k2').textContent=d.t==='out'?'¿De dónde salió?':'¿A dónde entra?';
    /* con pocos bolsillos van chips; con muchos, una lista para no deslizar tanto */
    if(show)$('sub').innerHTML=pk.length>4
      ?selector(pk,d.sub||'','p')
      :chip(pk,d.sub||'','p');
    $('rdst').style.display=(d.t==='out'&&d.ownerOpen)?'block':'none';
    $('rowner').style.display=(d.t==='out'&&!isCard(d.acc))?'block':'none';
    if(d.t==='out'&&d.ownerOpen){
      $('k3').textContent='Era plata de';$('owneroff').style.display='block';
      $('dst').innerHTML=chip(F.filter(x=>x.id!==srcRef()),d.owner,'d');}
  }else if(d.t==='move'){
    $('k1').textContent='Sale de';
    $('src').innerHTML=F.length>4?dobleSelector('movsrc',d.acc,'Cuenta'):chip(F,d.acc,'s');
    $('rsub').style.display='none';$('rowner').style.display='none';$('rdst').style.display='block';
    $('k3').textContent='Entra a';$('owneroff').style.display='none';
    const dest=F.filter(x=>x.id!==d.acc);
    $('dst').innerHTML=dest.length>4?dobleSelector('movdst',d.dst||dest[0].id,'Cuenta')
      :chip(dest,d.dst,'d');
    if(dest.length>4&&!d.dst)d.dst=refDoble('movdst');
  }else{
    $('k1').textContent='Pago desde';
    $('src').innerHTML=F.length>4?dobleSelector('paydesde',d.acc,'Cuenta'):chip(F,d.acc,'s');
    $('rsub').style.display='none';$('rowner').style.display='none';$('rdst').style.display='block';
    $('k3').textContent='Tarjeta';$('owneroff').style.display='none';$('dst').innerHTML=chip(cards,d.dst,'d');}
  $('cats').style.display=(d.t!=='pay'&&d.verCats)?'flex':'none';
  if(d.verCats)$('cats').innerHTML=chipsCategoria(CATS[d.t]||[],d.cat,d.t);
  pintarClasif();
  $('warnbox').innerHTML=(d.t==='out'&&d.ownerOpen&&d.owner&&d.owner!==srcRef())
    ?`<div class="warn">Pagas con <b>${nameOf(srcRef())}</b> algo que corresponde a <b>${nameOf(d.owner)}</b>.
      Queda como deuda entre bolsillos y la saldas cuando quieras.</div>`:'';
  if(!d.date)d.date=isoToday();
  $('mdate').value=d.date;
  const t2=new Date();const ayer=(t2.setDate(t2.getDate()-1),isoOf(t2));
  document.querySelectorAll('.drow [data-day]').forEach(b=>
    b.classList.toggle('on',(b.dataset.day==='0'&&d.date===isoToday())||(b.dataset.day==='1'&&d.date===ayer)));
  let hint=dateWord(d.date);
  if(d.t==='out'&&isCard(d.acc)){
    const c=DB.cfg.cards.find(x=>x.id===d.acc),cy=c&&cycleOf(c,isoTs(d.date));
    hint+=cy?' · se paga el '+DFMT(cy.pay):' · sin fecha de corte configurada';
  }
  $('datehint').textContent=hint;
  pintarAtajos();
  const val=amtVal();
  $('amt').textContent=d.amt?d.amt.replace(/^(\d+)/,x=>grp(x)):'0';
  const needDst=(d.t==='move'||d.t==='pay');
  const nota=($('note').value||'').trim();
  $('save').disabled=!(val>0&&d.acc&&(nota||d.t==='pay')&&(!needDst||d.dst));
}
const amtVal=()=>parseFloat(String(d.amt||'0').replace(',','.'))||0;
$('pad').innerHTML=['1','2','3','4','5','6','7','8','9',',','0','del','000']
  .map(k=>`<button class="key ${k===','||k==='del'||k==='000'?'fn':''}"
    ${k==='000'?'style="grid-column:span 3"':''} data-k="${k}">${k==='del'?'⌫':k}</button>`).join('');
$('pad').onclick=e=>{const b=e.target.closest('[data-k]');if(!b)return;const k=b.dataset.k;
  let a=d.amt||'';
  if(k==='del')a=a.slice(0,-1);
  else if(k===','){if(a.indexOf(',')<0)a=(a||'0')+',';}
  else{
    const i=a.indexOf(',');
    if(i>=0){if(a.length-i-1<2)a+=k;}
    else if(a.replace(/\D/g,'').length<11)a=(a+k).replace(/^0+(?=\d)/,'');
  }
  d.amt=a;
  if(navigator.vibrate)navigator.vibrate(8);sync();};
$('seg').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;
  if(b.dataset.t==='pay'){
    $('sheet').classList.remove('open');
    if(!DB.cfg.cards.length)return toast('No tienes tarjetas registradas');
    if(DB.cfg.cards.length===1)return openPay(DB.cfg.cards[0].id);
    go('cards');return toast('Elige la tarjeta que vas a pagar');
  }
  const amt=d.amt;openSheet(b.dataset.t);d.amt=amt;sync();};
function elegir(valor,cual){
  if(cual==='s'){d.acc=valor;d.sub=null;d.owner=null;if(d.dst===d.acc)d.dst=null;}
  else if(cual==='p'){d.sub=valor||null;d.owner=null;}
  else{if(d.t==='out')d.owner=valor;else d.dst=valor;}
  sync();
}
['src','sub','dst'].forEach(id=>$(id).addEventListener('change',e=>{
  const sel=e.target.closest('[data-sel]');
  if(sel){elegir(sel.value,sel.dataset.sel);return;}
  /* selector de dos pasos */
  const dob=e.target.closest('[data-dob]');
  if(!dob)return;
  const cual=dob.dataset.dob;
  if(dob.dataset.parte==='cuenta'){
    /* al cambiar de cuenta se recarga la lista de bolsillos */
    if(cual==='movdst')d.dst=dob.value; else d.acc=dob.value;
    const cont=cual==='movdst'?'dst':'src';
    $(cont).innerHTML=dobleSelector(cual,dob.value,'Cuenta');
  }else{
    const ref=refDoble(cual);
    if(cual==='movdst')d.dst=ref; else {d.acc=ref;d.sub=null;}
  }
  if(d.t==='move'&&d.dst===d.acc)d.dst=null;
  sync();}));
$('src').onclick=e=>{const b=e.target.closest('[data-s]');if(!b)return;
  d.acc=b.dataset.s;d.sub=null;d.owner=null;if(d.dst===d.acc)d.dst=null;sync();};
$('sub').onclick=e=>{const b=e.target.closest('[data-p]');if(!b)return;d.sub=b.dataset.p||null;d.owner=null;sync();};
$('dst').onclick=e=>{const b=e.target.closest('[data-d]');if(!b)return;
  if(d.t==='out')d.owner=b.dataset.d;else d.dst=b.dataset.d;sync();};
$('mdate').onchange=()=>{if($('mdate').value)d.date=$('mdate').value;sync();};
document.querySelectorAll('.drow [data-day]').forEach(b=>b.onclick=()=>{
  const t=new Date();t.setDate(t.getDate()-(+b.dataset.day));d.date=isoOf(t);sync();});
$('owneron').onclick=()=>{d.ownerOpen=true;sync();};
$('owneroff').onclick=()=>{d.ownerOpen=false;d.owner=null;sync();};
/* lee la nota, propone categoría y la muestra */
function pintarClasif(){
  if(!$('clasif'))return;
  if(d.t==='pay'){$('clasif').innerHTML='';return;}
  const nota=($('note')&&$('note').value||'').trim();
  if(!d.catManual){
    const v=clasificar(nota,d.t);
    d.cat=v?v.cat:(nota?'Otro':null);
    d.pista=v?v.palabra:null;
  }
  if(!nota){
    $('clasif').innerHTML=`<div class="clasif aviso">Escribe en qué fue el movimiento.
      Con eso la app le pone la categoría sola.</div>`;return;}
  const i=CATICON[d.cat]||'dots';
  $('clasif').innerHTML=`<div class="clasif">
    <span class="cic">${I[i]}</span>
    <span class="ctx">${d.cat||'Otro'}${d.catManual?' · elegida por ti'
      :(d.pista?' · por "'+d.pista+'"':' · no la reconocí')}</span>
    <button id="cambiar-cat">${d.verCats?'listo':'cambiar'}</button></div>`;
  $('cambiar-cat').onclick=()=>{d.verCats=!d.verCats;sync();};
}
let verTodasCats=false;
/* ordena por lo que mas usas y deja el resto detras de un boton */
function usoDeCategorias(tipo){
  const uso={};
  DB.mov.forEach(m=>{if(m.t===tipo&&m.cat)uso[m.cat]=(uso[m.cat]||0)+1;});
  return uso;
}
function chipsCategoria(lista,sel,tipo){
  const uso=usoDeCategorias(tipo);
  const orden=[...lista].sort((a,b)=>(uso[b[0]]||0)-(uso[a[0]]||0));
  const usadas=orden.filter(x=>uso[x[0]]);
  const visibles=verTodasCats?orden
    :(usadas.length>=4?usadas.slice(0,8):orden.slice(0,8));
  const faltan=orden.length-visibles.length;
  if(sel&&!visibles.some(x=>x[0]===sel)){
    const e=orden.find(x=>x[0]===sel);if(e)visibles.unshift(e);
  }
  return visibles.map(([n,i])=>
    `<button class="cb ${sel===n?'on':''}" data-c="${n}">${I[i]}${n}</button>`).join('')
    +(faltan>0&&!verTodasCats
      ?`<button class="cb mas" data-mas="1">+${faltan} más</button>`
      :(verTodasCats?`<button class="cb mas" data-mas="0">Ver menos</button>`:''));
}
$('note').addEventListener('input',()=>{d.catManual=false;pintarClasif();
  const val=amtVal(),nota=($('note').value||'').trim();
  const needDst=(d.t==='move'||d.t==='pay');
  $('save').disabled=!(val>0&&d.acc&&(nota||d.t==='pay')&&(!needDst||d.dst));});
$('cats').onclick=e=>{
  const mas=e.target.closest('[data-mas]');
  if(mas){verTodasCats=mas.dataset.mas==='1';sync();return;}
  const b=e.target.closest('[data-c]');if(!b)return;
  d.cat=b.dataset.c;d.catManual=true;d.verCats=false;sync();};
$('open').onclick=async()=>{
  if(!DB.cfg.accounts.length){
    const r=await modal({title:'Primero una cuenta',
      text:'Para registrar movimientos necesitas al menos una cuenta: tu banco o tu efectivo.',
      ok:'Crear cuenta'});
    if(r.action==='ok')go('s-acc');
    return;}
  openSheet('out');};
$('close').onclick=()=>$('sheet').classList.remove('open');
$('btn-buy').onclick=()=>{
  if(!DB.cfg.cards.length)return toast('Primero agrega una tarjeta en Ajustes');
  openSheet('out');d.acc=DB.cfg.cards[0].id;sync();};
$('save').onclick=async()=>{
  const val=amtVal();
  const ts=isoTs(d.date);
  const prev=d.editId?DB.mov.find(x=>x.id===d.editId):null;
  const m=prev||{id:Date.now()+''+Math.floor(Math.random()*999)};
  m.ts=ts;m.t=d.t;m.amount=val;m.src=srcRef();m.cat=d.cat;m.note=$('note').value.trim();
  m.owner=(d.t==='out'&&d.ownerOpen&&d.owner)?d.owner:undefined;
  m.dst=(d.t==='move'||d.t==='pay')?d.dst:undefined;
  if(d.t==='out'&&isCard(m.src)){if(m.paidAmt===undefined)m.paidAmt=0;}
  else{delete m.paidAmt;delete m.res;}
  /* aviso si este movimiento deja un saldo en negativo */
  if((d.t==='out'||d.t==='move'||d.t==='pay')&&!isCard(m.src)){
    const Bp=balances(),antes=Bp.bal[m.src]||0;
    const gastado=prev&&prev.src===m.src?val-(prev.amount||0):val;
    if(antes-gastado<-TOL){
      const r=await modal({title:'No alcanza',
        text:`${nameOf(m.src)} tiene ${money(antes)} y este movimiento lo deja en
          <b>${money(antes-gastado)}</b>. Revisa el saldo o de dónde sale la plata.`,
        ok:'Guardar igual',cancel:'Corregir'});
      if(r.action!=='ok')return;}
  }
  /* si corregiste la categoría a mano, la app se queda con la palabra clave */
  if(d.catManual&&m.note&&m.cat){
    const p=aprenderPalabra(m.note,m.cat,d.pista);
    if(p)setTimeout(()=>toast('Aprendí: "'+p+'" es '+m.cat),1200);
  }
  if(!prev)DB.mov.push(m);
  else{
    /* si la compra tenia plata apartada, el traslado se ajusta al nuevo monto */
    if(prev.resMovId){
      const tr=DB.mov.find(x=>x.id===prev.resMovId);
      if(tr){
        const falta=Math.max(0,val-(m.paidAmt||0));
        if(falta<=0.009){DB.mov=DB.mov.filter(x=>x.id!==prev.resMovId);
          m.res=false;m.resMovId=null;}
        else tr.amount=falta;
      }else{m.res=false;m.resMovId=null;}
    }
    if(prev.plan)
      Object.values(DB.cfg.plans).forEach(P=>
        P.items.forEach(it=>{if(it.movId===prev.id){it.amount=val;it.name=m.note||it.name;}}));
  }
  await Store.save(DB);
  cursor=new Date(ts);cursor.setDate(1);
  const era=!!prev;d.editId=null;
  $('sheet').classList.remove('open');render();
  toast(era?'Cambios guardados':'Guardado · '+dateWord(d.date));};

/* ============ puente con el celular ============ */
const NATIVO=(()=>{try{return !!(window.Android&&window.Android.esNativo&&window.Android.esNativo());}
  catch(e){return false;}})();
let bandeja=[];
function renderInbox(){
  if(!NATIVO){$('inb-status').textContent='Esta pantalla solo funciona dentro de la app instalada.';return;}
  $('inb-perm').innerHTML=`
    <div class="hint" style="margin:4px 0 0">Comparte hacia Bolsillo un pantallazo de tus
      movimientos, o el texto de un mensaje del banco. La app lee el contenido dentro del
      celular, sin enviarlo a ninguna parte.</div>`;
  const _viejo="";
  cargarBandeja();
}
function cargarBandeja(){
  if(!NATIVO)return;
  let crudos=[];
  try{crudos=JSON.parse(window.Android.pendientes()||'[]');}catch(e){}
  const vistos=new Set(DB.mov.map(m=>m.ref).filter(Boolean));
  bandeja=[];let ya=0,sin=0;
  if(saldos.filas.length)return;   /* no borrar una captura de saldos en pantalla */
  for(const c of crudos){
    const res=interpretarTexto(c.texto);
    if(res.length&&esCapturaSaldos(c.texto,res)){
      prepararSaldos(res);
      saldos.msgId=c.id;
      $('inb-status').textContent='Esa captura trae '+res.length+' bolsillos con su saldo.';
      dibujarSaldos('inb-list');
      return;}
  }
  crudos.forEach(c=>{
    const res=interpretarTexto(c.texto);
    if(!res.length){sin++;return;}
    res.forEach((r,k)=>{
      const ref='sms:'+r.monto+':'+r.fecha+':'+comercio(r.desc).slice(0,18);
      const dup=yaEstaba(r,ref,bandeja);
      if(dup==='exacto'){ya++;return;}
      const o=detectarOrigen(c.texto);
      bandeja.push({id:c.id,idx:k,app:c.app,fecha:r.fecha,desc:r.desc,
        origenDetectado:(typeof o==='string'),
        monto:r.monto,t:r.t,cat:categoriaDe(r.desc,r.t),regla:r.regla,ref,
        on:dup!=='probable',repetido:dup==='probable',
        src:(typeof o==='string')?o:(flat()[0]||{}).id,dst:null,pagoDesde:(flat()[0]||{}).id,
        raw:c.texto.slice(0,80)});
    });
  });
  /* si la captura no dice de que tarjeta o cuenta es, se pregunta una sola vez */
  const sinOrigen=bandeja.length&&!bandeja[0].origenDetectado;
  $('inb-origen').innerHTML=bandeja.length?`
    <div class="ed" style="margin-top:0">
      <div class="hd"><span>${sinOrigen?'¿De dónde son estos movimientos?':'Origen detectado'}</span></div>
      ${sinOrigen?'<div class="hint" style="margin:0 0 8px">No pude reconocerlo solo. Elígelo y se aplica a todos.</div>':''}
      <select id="inb-todos">
        ${DB.cfg.cards.map(c=>`<option value="${c.id}" ${bandeja[0].src===c.id?'selected':''}>${c.name} (tarjeta)</option>`).join('')}
        ${flat().map(o=>`<option value="${o.id}" ${bandeja[0].src===o.id?'selected':''}>${o.n}</option>`).join('')}
      </select>
    </div>`:'';
  if($('inb-todos'))$('inb-todos').onchange=()=>{
    bandeja.forEach(x=>x.src=$('inb-todos').value);drawInbox();};
  $('inb-status').textContent=bandeja.length
    ?bandeja.length+' por revisar'+(ya?' · '+ya+' ya estaban':'')
    :(crudos.length?(sin?'No entendí lo que llegó. Mira abajo qué leyó la app.':'Nada nuevo'):'Todavía no ha llegado nada.');
  drawInbox();
  /* si no se entendio nada, se muestra el texto crudo para poder revisarlo */
  const nada=crudos.filter(c=>!interpretarTexto(c.texto).length);
  $('inb-crudo').innerHTML=(!bandeja.length&&nada.length)?nada.map(c=>`
    <div class="ed"><div class="hd"><span>Texto leído · ${c.app}</span>
      <button data-desc="${c.id}">Descartar</button></div>
      <div style="font-size:11.5px;color:var(--text-dim);line-height:1.5;
        white-space:pre-wrap;max-height:260px;overflow:auto">${(c.texto||'').replace(/</g,'&lt;')}</div>
      <button class="mini" data-copiar="${c.id}" style="margin-top:8px;border-style:solid">Copiar este texto</button>
    </div>`).join(''):'';
  $('inb-crudo').querySelectorAll('[data-desc]').forEach(b=>b.onclick=()=>{
    try{window.Android.consumir(JSON.stringify([b.dataset.desc]));}catch(e){}
    cargarBandeja();});
  $('inb-crudo').querySelectorAll('[data-copiar]').forEach(b=>b.onclick=()=>{
    const c=crudos.find(x=>x.id===b.dataset.copiar);if(!c)return;
    try{navigator.clipboard.writeText(c.texto);toast('Texto copiado');}
    catch(e){toast('No se pudo copiar');}});
}
function drawInbox(){
  if(!bandeja.length){
    if(!saldos.filas.length)$('inb-list').innerHTML='';
    return;}
  const F=flat().concat(DB.cfg.cards.map(c=>({id:c.id,n:c.name+' (tarjeta)'})));
  const cats=CATS.out.map(([n])=>n),cin=CATS.in.map(([n])=>n);
  $('inb-list').innerHTML=bandeja.map((x,i)=>`
    <div class="ed">
      <div class="hd"><span>${x.app} · ${x.t==='in'?'Ingreso':x.t==='move'?'Retiro':x.t==='pay'?'Pago de tarjeta':'Gasto'}${x.repetido?' · YA REGISTRADO':''}</span>
        <button data-ib="${i}">Descartar</button></div>
      ${x.repetido?`<div class="hint" style="margin:0 0 8px;color:var(--expense)">
        Parece que este ya lo tienes. Se agrega solo si lo marcas.</div>
        <button class="mini" data-inc="${i}" style="border-style:solid;margin-bottom:8px;
          color:${x.on?'var(--income)':'var(--text-dim)'}">${x.on?'Se va a agregar':'Agregar de todos modos'}</button>`:''}
      <input data-if="desc" data-i="${i}" value="${x.desc.replace(/"/g,'&quot;')}">
      <div class="duo">
        <input class="sm" data-if="monto" data-i="${i}" inputmode="decimal" data-money value="${mv(x.monto)}">
        <select data-if="cat" data-i="${i}">${(x.t==='in'?cin:cats).map(n=>
          `<option value="${n}" ${x.cat===n?'selected':''}>${n}</option>`).join('')}</select>
      </div>
      <div class="duo">
        <input data-if="fecha" data-i="${i}" type="date" value="${x.fecha}">
        <select data-if="src" data-i="${i}">${F.map(o=>
          `<option value="${o.id}" ${x.src===o.id?'selected':''}>${o.n}</option>`).join('')}</select>
      </div>
      ${x.t==='pay'?`<select data-if="pagoDesde" data-i="${i}">
        ${flat().map(o=>`<option value="${o.id}" ${x.pagoDesde===o.id?'selected':''}>Pagado desde ${o.n}</option>`).join('')}</select>`:''}
      ${x.t==='move'?`<select data-if="dst" data-i="${i}">
        <option value="">¿A dónde entró el efectivo?</option>
        ${flat().filter(o=>o.id!==x.src).map(o=>
          `<option value="${o.id}" ${x.dst===o.id?'selected':''}>${o.n}</option>`).join('')}</select>`:''}
      <div class="qd"><span>${x.regla}</span><b style="font-size:11px;color:var(--text-dim)">
        ${x.raw.slice(0,42)}…</b></div>
    </div>`).join('')
    +`<button class="btn" id="inb-add" style="background:var(--cta);color:var(--on-cta);border-color:var(--cta)">
       Registrar ${bandeja.filter(x=>x.on!==false).length} movimientos</button>`;
  $('inb-add').onclick=async()=>{
    if(bandeja.some(x=>x.t==='move'&&!x.dst))return toast('Falta decir a dónde entró el efectivo');
    const ids=[];
    bandeja.filter(x=>x.on!==false).forEach((x,n)=>{
      if(x.t==='pay'){
        DB.mov.push({id:'in'+Date.now()+n,ts:isoTs(x.fecha),t:'pay',amount:x.monto,
          src:x.pagoDesde,dst:x.src,cat:'Pago tarjeta',note:x.desc,ref:x.ref,alloc:[]});
        ids.push(x.id);return;}
      const m={id:'in'+Date.now()+n,ts:isoTs(x.fecha),t:x.t,amount:x.monto,
        src:x.src,cat:x.t==='move'?'Retiro en cajero':x.cat,note:x.desc,ref:x.ref};
      if(x.t==='move')m.dst=x.dst;
      if(x.t==='out'&&isCard(x.src))m.paidAmt=0;
      aprender(x.desc,x.cat);
      DB.mov.push(m);ids.push(x.id);});
    try{window.Android.consumir(JSON.stringify([...new Set(ids)]));}catch(e){}
    await Store.save(DB);cargarBandeja();render();
    toast('Se registraron '+ids.length+' movimientos');};
}
$('inb-list').addEventListener('input',e=>{
  const t=e.target;if(!t.dataset.if)return;const x=bandeja[+t.dataset.i];
  if(t.dataset.if==='desc')x.desc=t.value;
  else if(t.dataset.if==='monto')x.monto=clean(t.value);});
$('inb-list').addEventListener('change',e=>{
  const t=e.target;if(!t.dataset.if)return;const x=bandeja[+t.dataset.i];
  if(['cat','fecha','src','dst','pagoDesde'].includes(t.dataset.if)){x[t.dataset.if]=t.value;
    if(t.dataset.if==='src')drawInbox();}});
$('inb-list').addEventListener('click',e=>{
  const inc=e.target.closest('[data-inc]');
  if(inc){const x=bandeja[+inc.dataset.inc];x.on=!x.on;drawInbox();return;}
  const b=e.target.closest('[data-ib]');if(!b)return;
  const x=bandeja[+b.dataset.ib];
  try{window.Android.consumir(JSON.stringify([x.id]));}catch(err){}
  bandeja.splice(+b.dataset.ib,1);drawInbox();
  $('inb-status').textContent=bandeja.length+' por revisar';});

$('inb-log').onclick=()=>{
  if(!NATIVO)return;
  let r=[];try{r=JSON.parse(window.Android.registro()||'[]');}catch(e){}
  $('inb-logbox').innerHTML=r.length?r.slice(-40).reverse().map(x=>
    `<div class="ed" style="padding:10px 12px"><div class="hd" style="margin-bottom:4px">
      <span>${x.app}</span><span style="font-size:10px;color:var(--text-dim)">${x.origen}</span></div>
      <div style="font-size:12px;color:var(--text-dim);line-height:1.45">${x.texto}</div></div>`).join('')
    :'<div class="hint">Todavía no ha capturado nada.</div>';
};
window.onMensajesNuevos=()=>{if(NATIVO&&$('v-s-inbox').style.display==='block')cargarBandeja();};
/* la app Android llama esto cuando le compartes algo */
window.abrirBandeja=()=>{
  if(!NATIVO)return;
  /* cierra lo que este encima: si no, la captura queda escondida detras */
  const m=document.getElementById('modal'); if(m)m.classList.remove('on');
  const p=document.getElementById('paysheet'); if(p)p.classList.remove('open');
  const s=document.getElementById('sheet'); if(s)s.classList.remove('open');
  saldos.filas=[];saldos.msgId=null;
  go('s-inbox');
  cargarBandeja();
};
