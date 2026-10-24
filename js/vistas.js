/* ============ render principal ============ */
function render(){
  const B=balances();
  if(homeAcc!=='all'&&homeAcc!=='tarjetas'&&!DB.cfg.accounts.some(a=>a.id===homeAcc))homeAcc='all';
  let mv=monthMov();
  if(homeAcc==='tarjetas')mv=mv.filter(m=>isCard(m.src)||isCard(m.dst));
  else if(homeAcc!=='all')mv=mv.filter(m=>belongs(m,homeAcc)&&!isCard(m.src));

  /* selector de cuenta */
  const chips=[{id:'all',n:'Todo',c:'var(--neutral)'}]
    .concat(DB.cfg.accounts.map(a=>({id:a.id,n:a.name,c:ACOLORS[a.color%ACOLORS.length]})));
  if(DB.cfg.cards.length)chips.push({id:'tarjetas',n:'Tarjetas',c:'var(--expense)'});
  $('accsel').innerHTML=chips.length>2
    ?chips.map(o=>`<button data-ha="${o.id}" class="${homeAcc===o.id?'on':''}">
        <i class="bulb" style="background:${o.c}"></i>${o.n}</button>`).join('')
    :'';
  $('accsel').querySelectorAll('[data-ha]').forEach(b=>b.onclick=()=>{homeAcc=b.dataset.ha;render();});

  /* cifras segun lo seleccionado */
  const scope=(homeAcc==='all'||homeAcc==='tarjetas')?DB.cfg.accounts
    :DB.cfg.accounts.filter(a=>a.id===homeAcc);
  let libre=0,guardado=0;
  scope.forEach(a=>{libre+=B.bal[a.id]||0;
    a.pockets.forEach(pk=>guardado+=B.bal[a.id+':'+pk.id]||0);});
  $('totlbl').textContent=homeAcc==='tarjetas'?'Disponible'
    :homeAcc==='all'?'Disponible'
    :'Disponible en '+((DB.cfg.accounts.find(a=>a.id===homeAcc)||{}).name||'');
  $('total').innerHTML='<small>'+SYM[DB.cfg.cur]+'</small>'+fmt(libre);
  $('total').style.color=libre<0?'var(--expense)':'var(--text)';
  $('split').innerHTML=DB.cfg.accounts.length?`
    <div><div class="k">Guardado en bolsillos</div><div class="v num"
      style="color:var(--cta)">${money(guardado)}</div></div>
    <div><div class="k">Total con bolsillos</div><div class="v num">${money(libre+guardado)}</div></div>`:'';
  $('cardpill').style.display=DB.cfg.cards.length?'inline-flex':'none';
  $('cardpill').innerHTML=`<svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:var(--expense);stroke-width:1.8;fill:none"><rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18"/></svg>
    Tarjetas <b>${money(B.cardTotal)}</b><span class="ch">›</span>`;

  if(!DB.cfg.accounts.length){
    $('accts').innerHTML=`<div class="acc" style="padding:22px 18px;text-align:center">
      <div style="font-size:15px;font-weight:700;margin-bottom:6px">Bienvenido a Bolsillo</div>
      <div style="font-size:13.5px;color:var(--text-dim);line-height:1.55;margin-bottom:16px">
        Empieza creando tu primera cuenta: el banco donde te cae la nómina, o tu efectivo.
        Después le agregas bolsillos y tarjetas si las usas.</div>
      <button id="firstacc" style="width:100%;padding:13px;border-radius:13px;font-size:13.5px;
        font-weight:700;background:var(--cta);color:var(--on-cta)">Crear mi primera cuenta</button></div>`;
    $('firstacc').onclick=()=>go('s-acc');
  }else
  $('accts').innerHTML=scope.map(a=>{
    const c=ACOLORS[a.color%ACOLORS.length];
    return `<div class="acc ${openAcc[a.id]?'open':''}" data-acc="${a.id}">
      <button class="hd"><i class="bulb" style="background:${c}"></i><span class="n">${a.name}</span>
        <span class="v num">${money(B.accTotal[a.id]||0)}</span>
        <span class="ar">${a.pockets.length?'▸':''}</span></button>
      ${a.pockets.length?`<div class="pk">
        <div class="pkr"><span class="lbl">Disponible</span>
          <b class="num" ${B.bal[a.id]<0?'style="color:var(--expense)"':''}>${money(B.bal[a.id]||0)}</b></div>
        ${pocketsOrd(a,B).map(p=>`<div class="pkr"><span class="lbl">${p.name}</span>
          <b class="num">${money(B.bal[a.id+':'+p.id]||0)}</b></div>`).join('')}</div>`:''}</div>`;}).join('');
  document.querySelectorAll('.acc .hd').forEach(b=>b.onclick=()=>{
    const id=b.parentElement.dataset.acc;openAcc[id]=!openAcc[id];render();});

  const rojos=enRojo();
  const avisoRojo=rojos.length?`<div class="debt" style="border-left-color:var(--expense)">
    <div class="txt">${rojos.length===1?'Un saldo quedó en rojo':'Hay '+rojos.length+' saldos en rojo'}
      <b style="color:var(--expense)">${rojos.slice(0,2).map(x=>x.n+' '+money(x.v)).join(' · ')}</b></div>
    <button id="verrojo">Revisar</button></div>`:'';
  const D=debts();
  $('debtbox').innerHTML=avisoRojo+D.map((x,i)=>`<div class="debt">
    <div class="txt">${resolve(x.from).name} le debe a ${resolve(x.to).name}<b class="num">${money(x.amt)}</b></div>
    <button data-d="${i}">Saldar</button></div>`).join('');
  if($('verrojo'))$('verrojo').onclick=()=>modal({title:'Saldos en rojo',
    text:'No se puede tener plata negativa. Suele pasar si apartaste más de lo que había, '+
      'o si falta registrar un ingreso.<br><br>'+
      rojos.map(x=>x.n+': <b>'+money(x.v)+'</b>').join('<br>'),
    ok:'Ir a Cuentas'}).then(r=>{if(r.action==='ok')go('s-acc');});
  $('debtbox').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{
    const x=D[+b.dataset.d];openSheet('move');d.cat='Reintegro';d.acc=x.from;d.dst=x.to;
    d.amt=String(x.amt).replace('.',',');sync();});

  const ing=mv.filter(m=>m.t==='in').reduce((s,m)=>s+m.amount,0);
  const gas=mv.filter(m=>m.t==='out').reduce((s,m)=>s+m.amount,0);
  $('m1').textContent=mlabel(cursor);$('m2').textContent=mlabel(cursor);
  $('f-in').textContent=money(ing);$('f-out').textContent=money(gas);
  $('s-in').textContent=money(ing);$('s-out').textContent=money(gas);
  $('s-net').innerHTML='<small>'+SYM[DB.cfg.cur]+'</small>'+fmt(ing-gas);
  $('s-net').style.color=(ing-gas)<0?'var(--expense)':'var(--text)';
  $('list').innerHTML=rowsHTML(mv);
  $('clist').innerHTML=rowsHTML(mv.filter(m=>(m.t==='out'&&isCard(m.src))||m.t==='pay'));

  $('c-total').innerHTML='<small>'+SYM[DB.cfg.cur]+'</small>'+fmt(B.cardTotal);
  $('rail').innerHTML=DB.cfg.cards.map(c=>{
    const g=GRADS[c.g%GRADS.length],deb=B.cards[c.id]||0;
    const pct=c.limit>0?Math.min(100,deb/c.limit*100):0;
    return `<div class="cc" style="background:linear-gradient(140deg,${g[1]},${g[0]})"><div class="shine"></div>
      <div class="nm">${c.name}</div><div><div class="dl">Deuda total</div><div class="dv num">${money(deb)}</div>
      ${c.limit>0?`<div class="track"><i style="width:${pct}%"></i></div>
      <div class="ft" style="margin-top:7px"><span>Cupo ${money(c.limit)}</span>
      <span>Libre ${money(Math.max(0,c.limit-deb))}</span></div>`:''}</div></div>`;}).join('')
    ||'<div class="empty">Agrega tus tarjetas en Ajustes.</div>';

  /* detalle por corte */
  $('cycles').innerHTML=DB.cfg.cards.map(c=>{
    const sp=cardSplit(c);
    if(!c.cutoff)return `<div class="cyc"><div class="ch"><b>${c.name}</b></div>
      <div class="cr" style="color:var(--text-dim)">Ponle fecha de corte y de pago en Ajustes
        para ver qué debes pagar este mes.</div></div>`;
    const late=sp.payBy&&sp.payBy.getTime()<Date.now();
    return `<div class="cyc"><div class="ch"><b>${c.name}</b>
        <span>corte ${c.cutoff} · pago ${c.due||c.cutoff}</span></div>
      <div class="cr"><span>Para pagar ${sp.payBy?'antes del '+DFMT(sp.payBy):'ahora'}
        ${late?'<i style="color:var(--expense)">vencido</i>':''}</span>
        <b class="num" style="color:${sp.dueTotal>0?'var(--expense)':'var(--income)'}">${money(sp.dueTotal)}</b></div>
      <div class="cr"><span>Va al corte del ${sp.nextClose?DFMT(sp.nextClose):'próximo mes'}</span>
        <b class="num">${money(sp.nextTotal)}</b></div>
      <div class="cr" style="border-top:1px solid var(--line);margin-top:6px;padding-top:9px">
        <span>De eso ya lo tienes en bolsillo</span>
        <b class="num" style="color:var(--income)">${money(sp.listo)}</b></div>
      <div class="cr"><span>Te falta guardar</span>
        <b class="num" style="color:${sp.falta>0?'var(--expense)':'var(--income)'}">${money(sp.falta)}</b></div>
      <button class="cpay" data-pay="${c.id}">Ver compras y pagar</button></div>`;}).join('');
  $('cycles').querySelectorAll('[data-pay]').forEach(b=>b.onclick=()=>openPay(b.dataset.pay));

  const byCat={};mv.filter(m=>m.t==='out').forEach(m=>byCat[m.cat]=(byCat[m.cat]||0)+m.amount);
  $('bars').innerHTML=barsHTML(byCat,gas,'var(--cta)');
  if(DB.cfg.budget>0){
    const p=Math.min(100,gas/DB.cfg.budget*100);
    $('bars').insertAdjacentHTML('afterbegin',`<div class="bar" style="margin-bottom:20px">
      <div class="r"><span>Presupuesto</span><span>${money(gas)} de ${money(DB.cfg.budget)}</span></div>
      <div class="track"><div class="fill" style="width:${p}%;background:${p>100?'var(--expense)':'var(--income)'}"></div></div></div>`);}
  const bySrc={};mv.filter(m=>m.t==='out').forEach(m=>{const n=nameOf(m.src);bySrc[n]=(bySrc[n]||0)+m.amount;});
  $('srcbars').innerHTML=barsHTML(bySrc,gas,'var(--cta-lt)');
  renderPlan();
}
function barsHTML(obj,total,color){
  const r=Object.entries(obj).sort((a,b)=>b[1]-a[1]);
  if(!r.length)return '<div class="empty">Nada registrado este mes.</div>';
  const max=r[0][1];
  return r.map(([k,v])=>`<div class="bar"><div class="r"><span>${k}</span>
    <span>${money(v)} · ${Math.round(v/total*100)}%</span></div>
    <div class="track"><div class="fill" style="width:${Math.max(3,v/max*100)}%;background:${color}"></div></div></div>`).join('');
}
function moveLabel(m){
  const sa=String(m.src).split(':')[0],da=String(m.dst||'').split(':')[0];
  const sn=String(m.src).includes(':')?resolve(m.src).name:'Disponible';
  const dn=String(m.dst||'').includes(':')?resolve(m.dst).name:'Disponible';
  if(sa===da)return resolve(sa).name+': '+sn+' → '+dn;
  return nameOf(m.src)+' → '+nameOf(m.dst);
}
function rowsHTML(mv){
  if(!mv.length)return `<div class="empty"><b>Nada por aquí todavía</b>Toca el botón + para registrar tu primer movimiento.</div>`;
  const days={};mv.forEach(m=>{const k=new Date(m.ts).toDateString();(days[k]=days[k]||[]).push(m);});
  return Object.keys(days).map(k=>{
    const dd=new Date(k),hoy=new Date().toDateString()===k;
    const tot=days[k].filter(m=>m.t==='out').reduce((s,m)=>s+m.amount,0);
    return `<div class="day"><span>${hoy?'Hoy':dd.getDate()+' de '+MO[dd.getMonth()].toLowerCase()}</span>
      <span>${tot?'− '+money(tot):''}</span></div>`+
      days[k].map(m=>{
        const col=m.t==='in'?'var(--income)':m.t==='out'?'var(--expense)':
          m.t==='adj'?(m.amount<0?'var(--expense)':'var(--income)'):'var(--text-dim)';
        const sig=m.t==='in'?'+':m.t==='out'?'−':m.t==='adj'?(m.amount<0?'−':'+'):'';
        let sub='';
        if(m.t==='out')sub=nameOf(m.src)+(m.owner&&m.owner!==m.src?' · a cuenta de '+resolve(m.owner).name:'');
        else if(m.t==='in'||m.t==='adj')sub=nameOf(m.src);
        else sub=moveLabel(m);
        const title=m.t==='pay'?'Pago '+resolve(m.dst).name:(m.plan&&m.note?m.note:m.cat);
        return `<div class="row" data-mov="${m.id}"><div class="ic">${I[CATICON[m.cat]]||I.dots}</div>
          <div class="mid"><div class="c1">${title}</div><div class="c2">${m.note&&!m.plan?m.note+' · ':''}${sub}</div></div>
          <div class="amt num" style="color:${col}">${sig} ${fmt(Math.abs(m.amount))}</div>
          <button class="x" data-id="${m.id}">✕</button></div>`;}).join('');
  }).join('');
}

/* ============ plan mensual ============ */
const firstRef=()=>{const f=flat();return f.length?f[0].id:null;};
function getPlan(key,create){
  const k=key||mkey(pcur);
  if(!DB.cfg.plans[k]&&create)
    DB.cfg.plans[k]={income:0,src:firstRef(),incomeDone:false,incomeMovId:null,items:[]};
  const P=DB.cfg.plans[k]||{income:0,src:firstRef(),incomeDone:false,items:[]};
  /* si la cuenta del plan ya no existe, se reengancha a la primera disponible */
  if(P.src&&resolve(P.src).kind==='gone')P.src=firstRef();
  if(!P.src)P.src=firstRef();
  return P;
}
function planTs(){
  const now=new Date();
  if(mkey(now)===mkey(pcur))return Date.now();
  return new Date(pcur.getFullYear(),pcur.getMonth(),1,12,0,0).getTime();
}
function renderPlan(){
  if(!DB.cfg.accounts.length){
    $('p-month').textContent=mlabel(pcur);
    $('p-left').innerHTML='<small>'+SYM[DB.cfg.cur]+'</small>0';
    $('incbar').className='incbar';$('incbar').innerHTML='';$('p-sum').innerHTML='';
    $('planlist').innerHTML=`<div class="empty"><b>Necesitas una cuenta primero</b>
      El plan reparte la plata que te entra, así que antes hay que decirle a la app
      dónde cae tu nómina.
      <button id="planfirst" style="margin-top:16px;width:100%;padding:13px;border-radius:13px;
        font-size:13.5px;font-weight:700;background:var(--cta);color:var(--on-cta)">Crear mi cuenta</button></div>`;
    $('planfirst').onclick=()=>go('s-acc');
    return;
  }
  const P=getPlan();
  $('p-month').textContent=mlabel(pcur);
  $('incbar').className='incbar'+(P.incomeDone?' done':'');
  $('incbar').innerHTML=`<button class="ck"></button>
    <div class="mid"><div class="k">Lo que entra</div><div class="v num">${money(P.income)}</div>
      <div class="s">${P.incomeDone?'Ya registrado en '+nameOf(P.src):'Cae en '+nameOf(P.src)}</div></div>`;
  $('incbar').querySelector('.ck').onclick=toggleIncome;

  const apart=P.items.filter(x=>x.kind==='pocket').reduce((s,x)=>s+x.amount,0);
  const pag=P.items.filter(x=>x.kind!=='pocket').reduce((s,x)=>s+x.amount,0);
  $('p-sum').innerHTML=`
    <div><div class="k">Va a bolsillos</div><div class="v num" style="color:var(--cta)">${money(apart)}</div></div>
    <div><div class="k">Sale de la cuenta</div><div class="v num" style="color:var(--expense)">${money(pag)}</div></div>`;

  let left=P.income;
  $('planlist').innerHTML=P.items.length?P.items.map((it,i)=>{
    left-=it.amount;
    const dest=it.kind==='pocket'
      ?'Apartar en '+nameOf(it.target)+' · sigue siendo tuyo'
      :'Sale de '+nameOf(P.src)+' · '+(it.cat||'Otro');
    return `<div class="pln ${it.done?'done':''}" data-p="${i}">
      <button class="ck"></button>
      <div class="mid"><div class="n">${it.name}</div><div class="s">${dest}</div></div>
      <div class="rt"><div class="a num" style="color:${it.kind==='pocket'?'var(--cta)':'var(--expense)'}">${money(it.amount)}</div>
        <div class="rest num">queda ${money(left)}</div></div></div>`;}).join('')
    :`<div class="empty"><b>Sin plan para ${mlabel(pcur).toLowerCase()}</b>
       Toca Editar plan para armarlo, o copia el del mes anterior.</div>`;
  $('p-left').innerHTML='<small>'+SYM[DB.cfg.cur]+'</small>'+fmt(left);
  $('p-left').style.color=left<0?'var(--expense)':'var(--text)';
  $('planlist').querySelectorAll('.pln').forEach(el=>
    el.querySelector('.ck').onclick=()=>togglePlan(+el.dataset.p));
}
async function toggleIncome(){
  const P=getPlan(null,true);
  if(P.incomeDone){
    DB.mov=DB.mov.filter(m=>m.id!==P.incomeMovId);
    P.incomeDone=false;P.incomeMovId=null;
    await Store.save(DB);render();toast('Ingreso deshecho');return;
  }
  if(!P.income)return toast('Primero define cuánto te entra');
  const r=await modal({title:'Registrar lo que entró',
    text:`Se suman <b>${money(P.income)}</b> a ${nameOf(P.src)}.`,ok:'Registrar'});
  if(r.action!=='ok')return;
  const id=Date.now()+''+Math.floor(Math.random()*999);
  DB.mov.push({id,ts:planTs(),t:'in',amount:P.income,src:P.src,cat:'Salario',note:'Nómina '+mlabel(pcur),plan:1});
  P.incomeDone=true;P.incomeMovId=id;
  await Store.save(DB);render();toast('Ingreso registrado');
}
async function togglePlan(i){
  const P=getPlan(null,true),it=P.items[i];
  if(it.done){
    DB.mov=DB.mov.filter(m=>m.id!==it.movId&&m.id!==it.adjId);
    it.done=false;it.movId=null;it.adjId=null;
    await Store.save(DB);render();toast('Marca deshecha');return;
  }
  if(!it.amount)return toast('Ese concepto no tiene valor');
  if(!P.incomeDone&&P.income>0){
    const rg=await modal({title:'Falta registrar lo que entra',
      text:`Todavía no has registrado los <b>${money(P.income)}</b> de ${mlabel(pcur).toLowerCase()}.
        Si repartes antes de que entre la plata, el disponible te va a quedar en negativo.`,
      ok:'Registrar el ingreso primero',alt:'Repartir de todos modos'});
    if(rg.action==='cancel')return;
    if(rg.action==='ok'){
      const iid=Date.now()+''+Math.floor(Math.random()*999)+'i';
      DB.mov.push({id:iid,ts:planTs(),t:'in',amount:P.income,src:P.src,cat:'Salario',
        note:'Nómina '+mlabel(pcur),plan:1});
      P.incomeDone=true;P.incomeMovId=iid;await Store.save(DB);render();
    }
  }
  const ts=planTs();let adjId=null;

  if(it.kind==='pocket'&&it.target&&resolve(it.target).kind==='gone'){
    const r=await modal({title:'Ese bolsillo ya no existe',
      text:`El concepto <b>${it.name}</b> apuntaba a un bolsillo que borraste. Elige otro en Editar plan.`,
      ok:'Ir a editar el plan'});
    if(r.action==='ok')go('planedit');
    return;}
  if(it.kind==='pocket'&&it.target){
    const B=balances(),actual=B.bal[it.target]||0;
    const r=await modal({title:'Actualizar '+resolve(it.target).name,
      text:`La app tiene <b>${money(actual)}</b> en este bolsillo. ¿Ese saldo ya coincide con el de tu banco?`,
      ok:'Sí, coincide',alt:'No, corregirlo'});
    if(r.action==='cancel')return;
    if(r.action==='alt'){
      const r2=await modal({title:'Saldo real del bolsillo',
        text:'Escribe lo que tiene el bolsillo hoy según tu banco.',
        input:true,value:actual,ok:'Aceptar'});
      if(r2.action!=='ok')return;
      const delta=r2.value-actual;
      if(Math.abs(delta)>0.009){
        adjId=Date.now()+''+Math.floor(Math.random()*999);
        DB.mov.push({id:adjId,ts,t:'adj',amount:delta,src:it.target,cat:'Ajuste de saldo',
          note:'Corrección con el banco'});
      }
    }
    const B2=balances(),ac=resolve(it.target).acc;
    const r3=await modal({title:'Actualizar bolsillo',
      text:`Se pasan <b>${money(it.amount)}</b> del disponible de ${ac.name} al bolsillo ${resolve(it.target).name}.
        Tu saldo total no cambia, la plata solo se mueve de lugar.
        ${(B2.bal[ac.id]||0)<it.amount?'<br><br>Ojo: el disponible de '+ac.name+' es '+money(B2.bal[ac.id]||0)+', te va a quedar en negativo.':''}`,
      ok:'Actualizar'});
    if(r3.action!=='ok'){if(adjId)DB.mov=DB.mov.filter(m=>m.id!==adjId);return;}
  }

  const id=Date.now()+''+Math.floor(Math.random()*999)+'b';
  const m={id,ts,amount:it.amount,src:P.src,note:it.name,plan:1};
  if(it.kind==='pocket'){m.t='move';m.dst=it.target;m.cat='Apartado';}
  else{m.t='out';m.cat=it.cat||'Otro';}
  DB.mov.push(m);it.done=true;it.movId=id;it.adjId=adjId;
  await Store.save(DB);render();
  toast(it.kind==='pocket'?'Bolsillo actualizado':it.name+' aplicado');
}
$('p-copy').onclick=async()=>{
  if(!DB.cfg.accounts.length)return toast('Primero crea una cuenta');
  const prev=new Date(pcur.getFullYear(),pcur.getMonth()-1,1);
  const src=DB.cfg.plans[mkey(prev)];
  if(!src||!src.items.length)return toast('No hay plan en '+mlabel(prev).toLowerCase());
  const cur=getPlan(null,true);
  if(cur.items.length){
    const r=await modal({title:'Copiar plan',
      text:`Ya hay ${cur.items.length} conceptos en ${mlabel(pcur).toLowerCase()}. ¿Los reemplazas por los de ${mlabel(prev).toLowerCase()}?`,
      ok:'Reemplazar'});
    if(r.action!=='ok')return;
  }
  cur.income=src.income;cur.src=src.src;
  cur.items=src.items.map(it=>({name:it.name,amount:it.amount,kind:it.kind,cat:it.cat,
    target:it.target,done:false,movId:null,adjId:null}));
  await Store.save(DB);render();toast('Plan copiado de '+mlabel(prev).toLowerCase());
};
$('p-all').onclick=async()=>{
  if(!DB.cfg.accounts.length)return toast('Primero crea una cuenta');
  const P=getPlan(null,true);
  const faltan=P.items.filter(it=>!it.done&&it.amount>0);
  if(!faltan.length&&P.incomeDone)return toast('Ya está todo marcado');
  const apart=faltan.filter(x=>x.kind==='pocket').reduce((s,x)=>s+x.amount,0);
  const pag=faltan.filter(x=>x.kind!=='pocket').reduce((s,x)=>s+x.amount,0);
  const r=await modal({title:'Marcar todo el plan',
    text:`Se aplican <b>${pend.length}</b> conceptos de ${mlabel(pcur).toLowerCase()}:
      ${money(apart)} a bolsillos y ${money(pag)} en pagos.
      ${!P.incomeDone&&P.income>0?'También se registra el ingreso de '+money(P.income)+'.':''}
      No se te va a preguntar por cada bolsillo.`,ok:'Aplicar todo'});
  if(r.action!=='ok')return;
  const ts=planTs();
  if(!P.incomeDone&&P.income>0){
    const iid=Date.now()+''+Math.floor(Math.random()*999)+'i';
    DB.mov.push({id:iid,ts,t:'in',amount:P.income,src:P.src,cat:'Salario',
      note:'Nómina '+mlabel(pcur),plan:1});
    P.incomeDone=true;P.incomeMovId=iid;
  }
  faltan.forEach((it,n)=>{
    const id=Date.now()+''+n+Math.floor(Math.random()*999)+'b';
    const m={id,ts,amount:it.amount,src:P.src,note:it.name,plan:1};
    if(it.kind==='pocket'&&it.target){m.t='move';m.dst=it.target;m.cat='Apartado';}
    else{m.t='out';m.cat=it.cat||'Otro';}
    DB.mov.push(m);it.done=true;it.movId=id;it.adjId=null;
  });
  await Store.save(DB);render();toast('Plan aplicado completo');
};
$('p-edit').onclick=()=>{getPlan(null,true);go('planedit');};

function renderPlanEdit(){
  if(!DB.cfg.accounts.length){go('plan');return toast('Primero crea una cuenta');}
  const P=getPlan(null,true),F=flat();
  $('pe-month').textContent='Plan de '+mlabel(pcur);
  $('pl-inc').value=mv(P.income);
  if(!F.some(x=>x.id===P.src))P.src=F.length?F[0].id:null;
  $('pl-src').innerHTML=F.map(x=>`<option value="${x.id}" ${P.src===x.id?'selected':''}>${x.n}</option>`).join('')
    ||'<option value="">Crea una cuenta primero</option>';
  let queda=P.income;
  const bolsillos=F.filter(x=>x.id.includes(':'));
  P.items.forEach(it=>{
    if(it.kind==='pocket'&&(!it.target||!bolsillos.some(b=>b.id===it.target)))
      it.target=bolsillos.length?bolsillos[0].id:null;});
  $('planedit').innerHTML=P.items.map((it,i)=>{
    queda-=(+it.amount||0);
    return `
    <div class="ed" data-idx="${i}"><div class="hd">
      <span class="grab" data-grab="${i}">⠿ Concepto ${i+1}</span>
      <span class="ordbox">
        <button class="ord" data-mov="up" data-i="${i}" ${i===0?'disabled':''}>▲</button>
        <button class="ord" data-mov="dn" data-i="${i}" ${i===P.items.length-1?'disabled':''}>▼</button>
        <button data-delpl="${i}">Quitar</button>
      </span></div>
      <input data-pl="name" data-i="${i}" value="${it.name}" placeholder="Nombre">
      <input data-pl="amount" data-i="${i}" inputmode="decimal" data-money value="${mv(it.amount)}" placeholder="Valor">
      <div class="duo">
        <select data-pl="kind" data-i="${i}">
          <option value="expense" ${it.kind==='expense'?'selected':''}>Pago o transferencia · sale de la cuenta</option>
          <option value="pocket" ${it.kind==='pocket'?'selected':''}>Apartar en bolsillo · queda en la cuenta</option></select>
        ${it.kind==='pocket'
          ?`<select data-pl="target" data-i="${i}">${F.filter(x=>x.id.includes(':')).map(x=>
              `<option value="${x.id}" ${it.target===x.id?'selected':''}>${x.n}</option>`).join('')||'<option>Crea un bolsillo</option>'}</select>`
          :`<select data-pl="cat" data-i="${i}">${CATS.out.map(([n])=>
              `<option value="${n}" ${it.cat===n?'selected':''}>${n}</option>`).join('')}</select>`}
      </div>
      <div class="qd"><span>Después de este concepto queda</span>
        <b class="num" style="color:${queda<0?'var(--expense)':'var(--text)'}">${money(queda)}</b></div>
    </div>`;}).join('');
  $('pe-left').innerHTML=`<div class="two" style="padding:0">
    <div><div class="k">Repartido</div><div class="v num">${money(P.income-queda)}</div></div>
    <div><div class="k">Sin repartir</div><div class="v num"
      style="color:${queda<0?'var(--expense)':'var(--income)'}">${money(queda)}</div></div></div>`;
}
$('planedit').addEventListener('change',async e=>{
  const t=e.target;if(!t.dataset.pl)return;
  const P=getPlan(null,true),it=P.items[+t.dataset.i],f=t.dataset.pl;
  if(f==='name')it.name=t.value;
  else if(f==='amount')it.amount=clean(t.value);
  else if(f==='kind'){it.kind=t.value;
    if(it.kind==='pocket'&&!it.target){const p=flat().find(x=>x.id.includes(':'));it.target=p?p.id:null;}}
  else it[f]=t.value;
  await Store.save(DB);renderPlanEdit();render();});
function planCascade(){
  const P=getPlan(null,true);let q=P.income;
  document.querySelectorAll('#planedit .ed').forEach((ed,i)=>{
    q-=(+((P.items[i]||{}).amount)||0);
    const b=ed.querySelector('.qd b');
    if(b){b.textContent=money(q);b.style.color=q<0?'var(--expense)':'var(--text)';}});
  const el=$('pe-left');
  if(el)el.innerHTML=`<div class="two" style="padding:0">
    <div><div class="k">Repartido</div><div class="v num">${money(P.income-q)}</div></div>
    <div><div class="k">Sin repartir</div><div class="v num"
      style="color:${q<0?'var(--expense)':'var(--income)'}">${money(q)}</div></div></div>`;
}
$('planedit').addEventListener('input',async e=>{
  const t=e.target;if(t.dataset.pl!=='name'&&t.dataset.pl!=='amount')return;
  const it=getPlan(null,true).items[+t.dataset.i];
  if(t.dataset.pl==='name')it.name=t.value;else it.amount=clean(t.value);
  await Store.save(DB);planCascade();render();});
$('planedit').addEventListener('click',async e=>{
  const b=e.target.closest('[data-delpl]');if(!b)return;
  const r=await modal({title:'Quitar concepto',text:'Se elimina del plan de este mes.',ok:'Quitar'});
  if(r.action!=='ok')return;
  getPlan(null,true).items.splice(+b.dataset.delpl,1);
  await Store.save(DB);renderPlanEdit();render();});
/* Reordenar conceptos.
   En el celular el navegador interpreta el deslizamiento como scroll,
   asi que el arrastre solo empieza desde el asa, que tiene el scroll
   desactivado, y se toma el control del dedo con setPointerCapture. */
let dg={i:null,el:null,y0:0,to:null,pid:null};
function dgFin(cancelar){
  if(dg.el){
    dg.el.classList.remove('dragging');
    dg.el.style.transform='';
    try{dg.el.releasePointerCapture(dg.pid);}catch(_){}
  }
  document.querySelectorAll('#planedit .ed').forEach(x=>x.classList.remove('slot'));
  const de=dg.i,a=dg.to;
  dg={i:null,el:null,y0:0,to:null,pid:null};
  if(!cancelar&&de!==null&&a!==null&&a!==de)moverConcepto(de,a);
}
async function moverConcepto(de,a){
  const P=getPlan(null,true);
  if(de<0||a<0||de>=P.items.length||a>=P.items.length||de===a)return;
  const it=P.items.splice(de,1)[0];
  P.items.splice(a,0,it);
  await Store.save(DB);renderPlanEdit();render();
  if(navigator.vibrate)navigator.vibrate(12);
}
$('planedit').addEventListener('pointerdown',e=>{
  const asa=e.target.closest('[data-grab]');if(!asa)return;
  const ed=asa.closest('.ed');if(!ed)return;
  e.preventDefault();
  dg.i=+ed.dataset.idx;dg.el=ed;dg.y0=e.clientY;dg.to=dg.i;dg.pid=e.pointerId;
  ed.classList.add('dragging');
  try{ed.setPointerCapture(e.pointerId);}catch(_){}
  if(navigator.vibrate)navigator.vibrate(10);
});
$('planedit').addEventListener('pointermove',e=>{
  if(dg.i===null)return;
  e.preventDefault();
  dg.el.style.transform='translateY('+(e.clientY-dg.y0)+'px)';
  const eds=[...$('planedit').querySelectorAll('.ed')];
  let to=dg.i;
  eds.forEach((x,k)=>{
    if(k===dg.i)return;
    const r=x.getBoundingClientRect(),mitad=r.top+r.height/2;
    if(k<dg.i&&e.clientY<mitad)to=Math.min(to,k);
    if(k>dg.i&&e.clientY>mitad)to=Math.max(to,k);
  });
  dg.to=to;
  eds.forEach((x,k)=>x.classList.toggle('slot',k===to&&k!==dg.i));
});
$('planedit').addEventListener('pointerup',()=>dgFin(false));
$('planedit').addEventListener('pointercancel',()=>dgFin(true));
/* flechas: alternativa segura en cualquier dispositivo */
$('planedit').addEventListener('click',e=>{
  const b=e.target.closest('[data-mov]');if(!b)return;
  e.stopPropagation();
  const i=+b.dataset.i;
  moverConcepto(i,b.dataset.mov==='up'?i-1:i+1);
});

$('addplan').onclick=async()=>{
  getPlan(null,true).items.push({name:'Nuevo concepto',amount:0,kind:'expense',cat:'Otro',target:null,done:false});
  await Store.save(DB);renderPlanEdit();render();};
$('pl-inc').oninput=async()=>{getPlan(null,true).income=clean($('pl-inc').value);
  await Store.save(DB);planCascade();render();};
$('pl-src').onchange=async()=>{getPlan(null,true).src=$('pl-src').value;await Store.save(DB);render();};
document.querySelectorAll('[data-p]').forEach(b=>{
  if(b.closest('.nav2'))b.onclick=()=>{pcur.setMonth(pcur.getMonth()+ +b.dataset.p);renderPlan();};});
