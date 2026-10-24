/* ============ interprete de mensajes bancarios ============ */
const MESESTXT={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,
  septiembre:8,sept:8,sep:8,octubre:9,noviembre:10,diciembre:11};
function montoSMS(x){
  let v=String(x||'').replace(/[^\d.,]/g,'');
  const d=v.match(/[.,](\d{1,2})$/);
  const ent=(d?v.slice(0,v.length-d[0].length):v).replace(/\D/g,'');
  return parseFloat(ent+(d?'.'+d[1]:''))||0;
}
function fechaSMS(t){
  let m=t.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if(m){let y=+m[3];if(y<100)y+=2000;return new Date(y,+m[2]-1,+m[1],12).getTime();}
  m=t.match(/(\d{1,2})\s+(?:de\s+)?([a-záéíóúA-ZÁÉÍÓÚ]+)\s+(?:de\s+)?(\d{4})/);
  if(m){const k=MESESTXT[m[2].toLowerCase()];if(k!==undefined)return new Date(+m[3],k,+m[1],12).getTime();}
  return null;
}
const limpiaTxt=x=>String(x||'').replace(/\s+/g,' ').trim().replace(/[.,]$/,'');
const REGLAS=[
 {id:'transferencia enviada',re:/transferiste\s+\$?([\d.,]+)\s+a la llave\s+(\S+)\s+desde tu cuenta\s+\*?(\d+)\s+a\s+(.+?)\s+el\s/i,
  arma:m=>({t:'out',amount:montoSMS(m[1]),desc:limpiaTxt(m[4])})},
 {id:'transferencia recibida',re:/recibiste una transferencia de\s+(.+?)\s+por\s+\$?([\d.,]+)\s+en tu cuenta\s+\*?(\d+)/i,
  arma:m=>({t:'in',amount:montoSMS(m[2]),desc:limpiaTxt(m[1])})},
 {id:'pago QR',re:/pagaste\s+\$?([\d.,]+)\s+por codigo qr desde tu cuenta\s+\*?(\d+)\s+a la llave\s+(\S+)/i,
  arma:m=>({t:'out',amount:montoSMS(m[1]),desc:'Pago QR '+limpiaTxt(m[3])})},
 {id:'botón Bancolombia',re:/transferiste\s+\$?([\d.,]+)\s+por bot[oó]n bancolombia a\s+(.+?)\s+desde producto/i,
  arma:m=>({t:'out',amount:montoSMS(m[1]),desc:limpiaTxt(m[2])})},
 {id:'pago a comercio',re:/pagaste\s+\$?([\d.,]+)\s+a\s+(.+?)\s+desde tu producto/i,
  arma:m=>({t:'out',amount:montoSMS(m[1]),desc:limpiaTxt(m[2])})},
 {id:'retiro',re:/retiraste\s+\$?([\d.,]+)\s+en nuestro corresponsal\s+(.+?),?\s+el\s/i,
  arma:m=>({t:'move',amount:montoSMS(m[1]),desc:'Retiro '+limpiaTxt(m[2])})},
 {id:'compra',re:/compra(?:ste)?\s+(?:aprobada\s+)?(?:de\s+|por\s+)?\$?\s?([\d.,]+)\s+en\s+(.+?)(?:[.,]|$)/i,
  arma:m=>({t:'out',amount:montoSMS(m[1]),desc:limpiaTxt(m[2])})},
 {id:'Google Pay',re:/^(?:cop|usd|\$)\s?([\d.,]+)[\s\S]{0,60}?\b(?:en|at)\s+(.+?)(?:\n|$)/i,
  arma:m=>({t:'out',amount:montoSMS(m[1]),desc:limpiaTxt(m[2])})},
];
/* ===== vocabulario para clasificar por lo que escribes en la nota =====
   Se lee de arriba hacia abajo: gana la primera que coincida.
   Las reglas que tú vas confirmando pesan más que esto. */
const VOCAB=[
 ['Mercado',       ['mercado','supermerc','exito','jeronimo','jerónimo','d1','tienda d1','ara','ísimo',
                    'carulla','olimpica','olímpica','euro','makro','justo','zapatoca','colsubsidio',
                    'surtimax','consumo','granero','fruver','verdura','carniceria','carnicería','huevos',
                    'canasta','despensa','abarrotes','la vaquita','mercar']],
 ['Restaurante',   ['restaurante','almuerzo','almorzar','cena','cenar','desayuno','comida en','comimos',
                    'burger','hamburguesa','pizza','sushi','asado','bandeja','corrientazo','mcdonald',
                    'kfc','frisby','crepes','sandwich','sánduche','empanada','panaderia','panadería',
                    'cafe','café','juan valdez','tostao','starbucks','postre','helado','bar ','cerveza',
                    'salchipapa','perro caliente','arepa','comida rapida','comida rápida']],
 ['Domicilios',    ['rappi','domicilio','ifood','didi food','pedidosya','uber eats','entrega a domicilio']],
 ['Transporte',    ['uber','didi','cabify','indriver','taxi','bus','metro','transmilenio','pasaje',
                    'peaje','flypass','gasolina','gasofa','terpel','texaco','biomax','primax','mobil',
                    'estacion de servicio','estación de servicio','parqueadero','parqueo','tanquear',
                    'combustible','acpm','pico y placa','grua','grúa','soat','tecnomecanica','tecnomecánica']],
 ['Carro',         ['carro','vehiculo','vehículo','taller','mecanico','mecánico','llantas','aceite',
                    'lavada de carro','lavado de carro','repuesto','bateria del carro','batería del carro',
                    'alineacion','alineación','frenos','mantenimiento carro','moto','motocicleta']],
 ['Arriendo',      ['arriendo','alquiler','renta del apartamento','canon']],
 ['Hogar',         ['hogar','cuota del hogar','casa','mercado del hogar','ferreteria','ferretería',
                    'homecenter','easy','muebles','decoracion','decoración','cortinas','colchon','colchón',
                    'electrodomestico','electrodoméstico','olla','sarten','sartén','utensilio']],
 ['Servicios',     ['servicios','epm','empresas publicas','empresas públicas','energia','energía','luz',
                    'agua','acueducto','alcantarillado','gas','internet','wifi','claro','movistar','tigo',
                    'comcel','etb','une','factura de','recibo de','celular plan','recarga','minutos',
                    'administracion','administración']],
 ['Salud',         ['salud','medico','médico','cita medica','cita médica','consulta','eps','clinica',
                    'clínica','hospital','droguería','drogueria','farmacia','cruz verde','la rebaja',
                    'farmatodo','medicamento','pastillas','examen','laboratorio','odontolog','dentista',
                    'optica','óptica','gafas','psicolog','terapia','vacuna','ips','urgencias']],
 ['Gimnasio',      ['gimnasio','gym','smart fit','smartfit','bodytech','stark','crossfit','entrenador',
                    'mensualidad gym','proteina','proteína','suplemento']],
 ['Suscripciones', ['suscripcion','suscripción','netflix','spotify','disney','hbo','max','prime video',
                    'youtube premium','apple','icloud','drive','office','canva','chatgpt','claude',
                    'plan mensual','membresia','membresía']],
 ['Ocio',          ['ocio','cine','teatro','concierto','fiesta','rumba','salida','juego','videojuego',
                    'steam','playstation','xbox','nintendo','parque','entrada','boleta','paseo','piscina',
                    'bolos','billar','karaoke']],
 ['Viajes',        ['viaje','vuelo','avion','avión','tiquete','hotel','hospedaje','airbnb','hostal',
                    'avianca','latam','wingo','maleta','turismo','excursion','excursión','finca']],
 ['Ropa',          ['ropa','camisa','camiseta','pantalon','pantalón','zapatos','tenis','zapatillas',
                    'vestido','chaqueta','ropa interior','medias','miniso','dollarcity','falabella',
                    'zara','h&m','adidas','nike','arturo calle','koaj','temu','shein','accesorio','gorra']],
 ['Tecnología',    ['tecnologia','tecnología','computador','portatil','portátil','celular','telefono',
                    'teléfono','audifonos','audífonos','cargador','cable','mouse','teclado','monitor',
                    'disco','memoria','usb','impresora','ktronix','alkosto','falabella tecno','mercado libre']],
 ['Educación',     ['educacion','educación','curso','universidad','semestre','matricula','matrícula',
                    'libro','diplomado','certificacion','certificación','clase','ingles','inglés',
                    'platzi','udemy','coursera','colegio','pension del colegio','pensión del colegio',
                    'utiles','útiles','papeleria','papelería']],
 ['Familia',       ['familia','mama','mamá','papa','papá','hermano','hermana','hijo','hija','sobrino',
                    'abuela','abuelo','esposa','novia','raquel','regalo para','cumpleanos','cumpleaños',
                    'mesada','ayuda a']],
 ['Iglesia',       ['iglesia','diezmo','ofrenda','donacion','donación','primicia']],
 ['Aseo',          ['aseo','limpieza','detergente','jabon','jabón','shampoo','papel higienico',
                    'papel higiénico','escoba','trapeador','senora del aseo','señora del aseo',
                    'empleada','lavanderia','lavandería','peluqueria','peluquería','barberia','barbería',
                    'corte de pelo','manicure','cosmetico','cosmético','crema','desodorante']],
 ['Personal',      ['personal','mi gusto','antojo','capricho','para mi','para mí']],
 ['Salario',       ['salario','nomina','nómina','sueldo','pago de nomina','pago de nómina','quincena']],
 ['Freelance',     ['freelance','proyecto','trabajo extra','asesoria','asesoría','consultoria','consultoría']],
 ['Reembolso',     ['reembolso','devolucion','devolución','me devolvieron','reintegro de']],
 ['Regalo',        ['regalo','obsequio','me regalaron']],
 ['Venta',         ['venta','vendi','vendí','vendido']]
];
/* índice rápido: palabra -> categoría */
const VOCAB_IDX=(()=>{const m=new Map();
  VOCAB.forEach(([cat,palabras])=>palabras.forEach(p=>{if(!m.has(p))m.set(p,cat);}));
  return m;})();
/* Clasifica por la nota. Devuelve la categoría y qué palabra la disparó. */
function clasificar(texto,tipo){
  const t=' '+String(texto||'').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ')+' ';
  const validas=(tipo==='in'?CATS.in:CATS.out).map(([n])=>n);
  /* gana lo que se menciona primero; si empatan, la palabra más específica */
  let mejor=null,pos=1e9,largo=0;
  for(const [palabra,cat] of VOCAB_IDX){
    if(!validas.includes(cat))continue;
    const p=' '+palabra.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-z0-9ñ ]/g,' ').replace(/\s+/g,' ');
    const i=t.indexOf(p);
    if(i<0)continue;
    if(i<pos||(i===pos&&palabra.length>largo)){mejor={cat,palabra};pos=i;largo=palabra.length;}
  }
  return mejor;
}

const PISTAS=[[/exito|jeronimo|d1|ara|carulla|olimpica|euro|mercado|supermerc/i,'Mercado'],
 [/rappi|domicilio/i,'Domicilios'],[/miniso|dollarcity|falabella|zara|temu/i,'Ropa'],
 [/uber|didi|cabify|taxi|flypass|peaje|terpel|gasolin|estacion/i,'Transporte'],
 [/comcel|claro|movistar|tigo|epm|empresas publicas|acueducto|energia|gas/i,'Servicios'],
 [/smart ?fit|gym|gimnasio|bodytech/i,'Gimnasio'],
 [/netflix|spotify|disney|hbo|max|prime|suscrip/i,'Suscripciones'],
 [/drogueria|farmacia|eps|clinica|medic/i,'Salud'],
 [/cine|bar |restaurante|burger|pizza|mcdonald|frisby|crepes/i,'Restaurante']];
function categoriza(desc,t){
  const v=clasificar(desc,t);
  if(v)return v.cat;
  if(t==='in')return 'Otro';
  for(const [re,c] of PISTAS)if(re.test(desc))return c;
  return 'Otro';
}
function interpretar(texto){
  const t=String(texto).replace(/\s+/g,' ').trim();
  if(t.length<8)return null;
  for(const r of REGLAS){
    const m=t.match(r.re);
    if(m){const o=r.arma(m);
      if(o.amount>0){o.regla=r.id;o.ts=fechaSMS(t)||Date.now();o.raw=t;return o;}}
  }
  const m=t.match(/(?:\$|COP)\s?([\d.,]+)/i);
  if(!m)return null;
  const val=montoSMS(m[1]);if(!val)return null;
  const inn=/recib|abono|consign|deposit|ingres|nomina|te (?:enviaron|transfirieron)/i.test(t);
  return {t:inn?'in':'out',amount:val,desc:limpiaTxt(t.slice(0,45)),
    regla:'sin identificar',ts:fechaSMS(t)||Date.now(),raw:t};
}
/* ===== intérprete de LISTAS de movimientos (Nu, BBVA, Google Pay) ===== */
const MESLISTA={ene:0,enero:0,feb:1,febrero:1,mar:2,marzo:2,abr:3,abril:3,may:4,mayo:4,
 jun:5,junio:5,jul:6,julio:6,ago:7,agosto:7,sep:8,sept:8,septiembre:8,
 oct:9,octubre:9,nov:10,noviembre:10,dic:11,diciembre:11};
const RE_MONTO=/(?:COP|\$)\s*(-?\s*[\d][\d.,]*)/i;
const RE_FECHALISTA=/^(\d{1,2})\s+(?:de\s+)?([a-záéíóúA-ZÁÉÍÓÚ]{3,12})\.?(?:\s+(?:de\s+)?(\d{4}))?$/;
/* ruido que va en medio de un movimiento: se salta sin perder la descripción */
const RUIDO_LINEA=/^(pendiente|aprobad[oa]|a \d+ meses?|\d{1,2}:\d{2}(:\d{2})?)$/i;
/* ruido de encabezado: corta lo que se venía acumulando */
/* la barra de estado del celular: "4:26 Vo LTE 4.5G 70%" */
const RUIDO_BARRA=/^\d{1,2}:\d{2}\b.*(lte|4g|5g|4\.5g|wi-?fi|\d{1,3}\s?%)/i;
const RUIDO_BLOQUE=/^(volver|explorar|tarjetas|[úu]ltimos movimientos|buscar|revisa tu resumen|lleg[oó] tu fecha|ya puedes ver|mastercard|visa|tu cupo|disponible|usado|resumen|per[ií]odo|fecha de corte|fecha l[ií]mite|(tus|mis) bolsillos|ocultar saldos|crear bolsillo|inicio|transacciones|tr[áa]mites|ajustes|hola,)/i;
function fechaLista(l){
  const m=l.match(RE_FECHALISTA);if(!m)return null;
  const k=MESLISTA[m[2].toLowerCase().replace(/\.$/,'')];
  if(k===undefined)return null;
  const hoy=new Date();let y=m[3]?+m[3]:hoy.getFullYear();
  const d=new Date(y,k,+m[1],12);
  if(!m[3]&&d.getTime()-hoy.getTime()>15*86400000)d.setFullYear(y-1);
  return d;
}
const comercio=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[*].*$/,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim().slice(0,28);
function parseLista(texto){
  const lineas=String(texto).split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const items=[];let cab=null,buf=[],ultimo=null,desdeAmt=0;
  for(const l of lineas){
    if(RUIDO_LINEA.test(l))continue;
    if(RUIDO_BARRA.test(l)||RUIDO_BLOQUE.test(l)){buf=[];continue;}
    /* frases de la interfaz, no nombres de comercio */
    const pal=l.split(/\s+/).length;
    if((pal>6&&!/\d/.test(l))||(pal>=3&&/[.:]$/.test(l))){buf=[];continue;}
    const f=fechaLista(l);
    if(f){
      if(ultimo&&!ultimo.fecha&&desdeAmt<=1){
        ultimo.fecha=f;
        /* lo que se acumulo entre el monto y la fecha es la cola del nombre */
        if(buf.length){
          ultimo.desc=(ultimo.desc+' '+buf.join(' ')).replace(/\s+/g,' ').trim().slice(0,60);
          buf=[];}
      }else cab=new Date(f);
      continue;}
    /* una fecha pegada al final de la linea, como "ENVIGADO 10 sept" */
    if(ultimo&&!ultimo.fecha&&desdeAmt<=1){
      const fp=l.match(/^(.*?)\s+(\d{1,2}\s+(?:de\s+)?[a-záéíóúA-ZÁÉÍÓÚ]{3,12}\.?(?:\s+\d{4})?)$/);
      if(fp){
        const f2=fechaLista(fp[2].trim());
        if(f2){
          ultimo.fecha=f2;
          const cola=(fp[1]||'').trim();
          if(cola)ultimo.desc=(ultimo.desc+' '+cola).replace(/\s+/g,' ').trim().slice(0,60);
          buf=[];continue;}
      }
    }
    const m=l.match(RE_MONTO);
    if(m){
      const antes=l.slice(0,m.index).trim();if(antes)buf.push(antes);
      let d=buf.join(' ').replace(/\s+/g,' ').trim();
      d=d.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*$/,'')       // hora al final
         .replace(/\s+a \d+\s+meses?\s*$/i,'')               // cuotas
         .replace(/\s+pendiente\s*$/i,'').trim();
      const val=montoSMS(m[1]);
      if(val>0){
        const pago=/gracias por tu pago|pagaste|abono|pago recibido/i.test(d);
        ultimo={desc:d.slice(0,60),monto:val,t:pago?'pay':'out',
          fecha:cab?new Date(cab):null,sinFecha:!cab,neg:/-/.test(m[1])};
        items.push(ultimo);}
      buf=[];desdeAmt=0;continue;}
    buf.push(l);desdeAmt++;
  }
  return items.filter(x=>x.monto>0);
}
/* categoría aprendida de lo que ya clasificaste antes */
function categoriaDe(desc,t){
  const k=comercio(desc);
  const r=(DB.cfg.reglas||{})[k];
  if(r&&r.cat)return r.cat;
  return categoriza(desc,t);
}
function aprender(desc,cat){
  if(!cat||cat==='Otro')return;
  DB.cfg.reglas=DB.cfg.reglas||{};
  const k=comercio(desc);if(!k)return;
  DB.cfg.reglas[k]={cat};
}

/* ===== captura de SALDOS de bolsillos =====
   No son movimientos: son una foto de como esta la plata hoy.
   Se emparejan por nombre y se ajusta la diferencia. */
function esCapturaSaldos(txt,items){
  if(/tus bolsillos|mis bolsillos|crear bolsillo/i.test(txt))return true;
  return items.length>=3&&items.every(x=>x.sinFecha);
}
function bolsilloPara(nombre){
  const k=comercio(nombre);if(!k)return null;
  const al=(DB.cfg.aliasBolsillo||{})[k];
  if(al&&resolve(al).kind!=='gone')return al;
  for(const a of DB.cfg.accounts)for(const p of a.pockets)
    if(comercio(p.name)===k)return a.id+':'+p.id;
  return null;
}
let saldos={filas:[],cuenta:null,msgId:null};
function prepararSaldos(items){
  const B=balances();
  saldos.cuenta=saldos.cuenta||(DB.cfg.accounts[0]||{}).id;
  saldos.filas=items.map((x,i)=>{
    const ref=bolsilloPara(x.desc);
    return {i,nombre:x.desc,valor:x.monto,ref:ref||'',
      actual:ref?(B.bal[ref]||0):null,nuevo:!ref};
  });
}
function dibujarSaldos(cont){
  const B=balances();
  const bolsillos=flat().filter(x=>x.id.includes(':'));
  const cuentas=DB.cfg.accounts.map(a=>`<option value="${a.id}" ${saldos.cuenta===a.id?'selected':''}>${a.name}</option>`).join('');
  $(cont).innerHTML=`
    <div class="hint" style="margin:4px 0 10px">Esto son <b>saldos</b>, no movimientos.
      La app va a dejar cada bolsillo con el valor que muestra tu banco.</div>
    <div class="ed" style="margin-top:0"><div class="hd"><span>Cuenta de estos bolsillos</span></div>
      <select id="sal-cuenta">${cuentas}</select></div>`
    +saldos.filas.map(f=>{
      const dif=f.ref?(f.valor-(B.bal[f.ref]||0)):null;
      return `<div class="ed">
        <div class="hd"><span>${f.nombre}</span>
          <b style="font-size:14px;font-weight:700;color:var(--text)">${money(f.valor)}</b></div>
        <select data-sal="${f.i}">
          <option value="">— No lo relaciones, ignóralo —</option>
          <option value="NUEVO" ${f.ref===''&&f.nuevo?'selected':''}>Crear bolsillo "${f.nombre}"</option>
          ${bolsillos.map(b=>`<option value="${b.id}" ${f.ref===b.id?'selected':''}>${b.n}</option>`).join('')}
        </select>
        ${f.ref?`<div class="qd"><span>Hoy tiene ${money(B.bal[f.ref]||0)}</span>
          <b style="color:${dif>0?'var(--income)':dif<0?'var(--expense)':'var(--text-dim)'}">
            ${dif>0?'+':''}${money(dif)}</b></div>`
          :`<div class="qd"><span>Sin relacionar</span><b style="font-size:11px;color:var(--text-dim)">
            elige uno o créalo</b></div>`}
      </div>`;}).join('')
    +`<button class="btn" id="sal-ok" style="background:var(--cta);color:var(--on-cta);border-color:var(--cta)">
        Actualizar saldos</button>
      <button class="btn" id="sal-no">Descartar esta captura</button>`;
  $('sal-no').onclick=()=>{
    if(saldos.msgId){try{window.Android.consumir(JSON.stringify([saldos.msgId]));}catch(e){}}
    saldos.filas=[];saldos.msgId=null;$(cont).innerHTML='';
    if(NATIVO)cargarBandeja();};
  $('sal-cuenta').onchange=()=>{saldos.cuenta=$('sal-cuenta').value;};
  $(cont).querySelectorAll('[data-sal]').forEach(sel=>sel.onchange=()=>{
    const f=saldos.filas[+sel.dataset.sal];
    f.ref=sel.value==='NUEVO'?'':sel.value;
    f.nuevo=sel.value==='NUEVO';
    dibujarSaldos(cont);});
  $('sal-ok').onclick=async()=>{
    const a=DB.cfg.accounts.find(x=>x.id===saldos.cuenta);
    if(!a)return toast('Elige la cuenta');
    let n=0,creados=0;
    DB.cfg.aliasBolsillo=DB.cfg.aliasBolsillo||{};
    for(const f of saldos.filas){
      if(f.nuevo){
        const id='p'+Date.now()+'x'+(n)+Math.floor(Math.random()*9999);
        a.pockets.push({id,name:f.nombre.slice(0,24),balance:f.valor});
        DB.cfg.aliasBolsillo[comercio(f.nombre)]=a.id+':'+id;
        creados++;n++;continue;}
      if(!f.ref)continue;
      DB.cfg.aliasBolsillo[comercio(f.nombre)]=f.ref;
      const B2=balances(),dif=f.valor-(B2.bal[f.ref]||0);
      if(Math.abs(dif)>0.009){
        DB.mov.push({id:'aj'+Date.now()+n,ts:Date.now(),t:'adj',amount:dif,
          src:f.ref,cat:'Ajuste de saldo',note:'Saldo del banco'});}
      n++;}
    await Store.save(DB);
    const Bf=balances(),libre=Bf.bal[a.id]||0;
    if(saldos.msgId){try{window.Android.consumir(JSON.stringify([saldos.msgId]));}catch(e){}}
    saldos.filas=[];saldos.msgId=null;$(cont).innerHTML='';render();
    toast(n?'Se actualizaron '+n+' bolsillos'+(creados?', '+creados+' nuevos':''):'No se cambió nada');
    if(libre<0)setTimeout(()=>modal({title:'Revisa el saldo de la cuenta',
      text:`Los bolsillos suman más de lo que la app cree que tienes en ${a.name},
        así que el disponible quedó en ${money(libre)}.
        Actualiza el saldo total de la cuenta en Ajustes.`,
      ok:'Ir a Cuentas',cancel:'Después'}).then(r=>{if(r.action==='ok')go('s-acc');}),700);};
}

/* ¿este movimiento ya estaba registrado? compara monto, fecha y comercio,
   asi reconoce tambien los que metiste a mano */
/* ¿este movimiento ya estaba? compara monto, fecha y comercio contra TODO
   el historial, sin importar si lo metiste a mano o por captura.
   Tambien mira los que vienen en el mismo lote, para no duplicar dentro
   de una sola lectura. */
function yaEstaba(r,ref,loteYa){
  const t0=isoTs(r.fecha),dia=86400000,k=comercio(r.desc);
  /* repetido dentro de la misma captura */
  if(loteYa){
    for(const x of loteYa){
      if(Math.abs(x.monto-r.monto)>0.5)continue;
      if(x.fecha!==r.fecha)continue;
      if(comercio(x.desc)===k)return 'exacto';
    }
  }
  for(const m of DB.mov){
    if(m.ref&&ref&&m.ref===ref)return 'exacto';
    if(Math.abs((m.amount||0)-r.monto)>0.5)continue;
    if(Math.abs(m.ts-t0)>3*dia)continue;      /* las apps muestran fechas distintas */
    const km=comercio(m.note||'');
    if(k&&km){
      const a=k.slice(0,7),b=km.slice(0,7);
      if(km.indexOf(a)>=0||k.indexOf(b)>=0)return 'exacto';
      /* mismo monto y misma fecha exacta: casi seguro es el mismo */
      if(Math.abs(m.ts-t0)<dia)return 'probable';
    }else return 'probable';
  }
  return null;
}

/* busca los ultimos 4 digitos en el texto y devuelve la tarjeta o cuenta que coincida */
function detectarOrigen(txt){
  const t=String(txt);
  const halladas=new Set();
  /* formatos: ••6192   •••• 1894   ....1210   *6562   termina en 4417 */
  const patrones=[
    /(?:[•·*.\u2022]\s?){1,4}\s?(\d{4})\b/g,                      // ••6192  ···· 1894
    /termina(?:da)?\s+en\s+(\d{4})\b/gi,                           // termina en 4417
    /(?:cuenta|producto|tarjeta)\s*[•·*.\u2022]*\s*(\d{4})\b/gi    // producto 6562
  ];
  patrones.forEach(re=>{let m;while((m=re.exec(t)))halladas.add(m[1]);});
  if(!halladas.size)return null;
  for(const c of DB.cfg.cards)if(c.fin&&halladas.has(c.fin))return c.id;
  for(const a of DB.cfg.accounts)if(a.fin&&halladas.has(a.fin))return a.id;
  return {desconocida:[...halladas][0]};
}

/* decide si el texto es una lista de movimientos o mensajes sueltos,
   y devuelve siempre la misma forma de resultado */
function interpretarTexto(txt){
  const lineas=String(txt).split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const encabezados=lineas.filter(l=>fechaLista(l)).length;
  const soloMonto=lineas.filter(l=>/^(?:COP|\$)\s*-?\s*[\d][\d.,]*$/i.test(l)).length;
  /* filas de "nombre  $monto", como la pantalla de bolsillos */
  const filas=lineas.filter(l=>/^[^$\d][^$]{1,34}(?:COP|\$)\s*-?\s*[\d][\d.,]*\s*$/i.test(l)).length;
  if(encabezados>=1||soloMonto>=2||filas>=2){
    return parseLista(txt).map(x=>({fecha:isoOf(x.fecha||new Date()),desc:x.desc,
      monto:x.monto,t:x.t,sinFecha:!x.fecha,
      regla:x.t==='pay'?'pago de tarjeta':'lista de movimientos'}));
  }
  const out=[];
  partirMensajes(txt).forEach(linea=>{
    const r=interpretar(linea);
    if(r)out.push({fecha:isoOf(new Date(r.ts)),desc:r.desc,monto:r.amount,
      t:r.t,regla:r.regla});});
  return out;
}

/* separa un pegado largo en mensajes sueltos */
function partirMensajes(txt){
  let x=String(txt).replace(/\r/g,'');
  x=x.replace(/(?!^)(Bancolombia\s*:)/g,'\n$1');
  return x.split(/\n{1,}/).map(l=>l.trim()).filter(l=>l.length>8);
}

/* ============ leer una captura ============ */
let scan={items:[],src:null};
function renderScan(){
  const F=flat().concat(DB.cfg.cards.map(c=>({id:c.id,n:c.name+' (tarjeta)'})));
  if(!F.length){$('scan-res').innerHTML='<div class="hint">Primero crea una cuenta o una tarjeta.</div>';return;}
  if(!scan.src||!F.some(x=>x.id===scan.src))scan.src=F[0].id;
  $('scan-src').innerHTML=F.map(x=>`<option value="${x.id}" ${scan.src===x.id?'selected':''}>${x.n}</option>`).join('');
  drawScan();
}
$('scan-src').onchange=()=>{scan.src=$('scan-src').value;};
$('scan-read').onclick=()=>{
  const txt=$('scan-txt').value;
  if(!txt.trim())return toast('Pega primero los mensajes');
  const vistos=new Set(DB.mov.map(m=>m.ref).filter(Boolean));
  let rep=0;
  const items=[];
  const crudos=interpretarTexto(txt);
  if(esCapturaSaldos(txt,crudos)){
    scan.items=[];
    prepararSaldos(crudos);
    $('scan-status').textContent='Reconocí '+crudos.length+' bolsillos con su saldo.';
    dibujarSaldos('scan-res');
    return;}
  const orig=detectarOrigen(txt);
  if(orig&&typeof orig==='string'){scan.src=orig;$('scan-src').value=orig;}
  crudos.forEach((r,i)=>{
    const ref='sms:'+r.monto+':'+r.fecha+':'+comercio(r.desc).slice(0,18);
    const dup=yaEstaba(r,ref,items);
    if(dup==='exacto'){rep++;return;}
    items.push({id:'s'+i,fecha:r.fecha,desc:r.desc,monto:r.monto,t:r.t,
      cat:categoriaDe(r.desc,r.t),on:dup!=='probable',regla:r.regla,ref,dst:null,
      repetido:dup==='probable',pagoDesde:(flat()[0]||{}).id});
  });
  scan.items=items;
  const aviso=orig?(typeof orig==='string'
      ?' · reconocí que son de '+nameOf(orig)
      :' · vi una tarjeta terminada en '+orig.desconocida+', ponle esos dígitos en Ajustes para que la reconozca sola')
    :'';
  $('scan-status').textContent=items.length
    ?'Reconocí '+items.length+' movimientos'+(rep?' ('+rep+' ya estaban)':'')+aviso+'. Revisa y agrega.'
    :(rep?'Esos '+rep+' movimientos ya estaban registrados.':'No reconocí ningún movimiento en ese texto.');
  drawScan();
};

function drawScan(){
  if(!scan.items.length){$('scan-res').innerHTML='';return;}
  const cats=CATS.out.map(([n])=>n),cin=CATS.in.map(([n])=>n);
  $('scan-res').innerHTML=scan.items.map((x,i)=>`
    <div class="ed" style="${x.on?'':'opacity:.45'}">
      <div class="hd"><span>${x.t==='in'?'Ingreso':x.t==='move'?'Retiro':'Gasto'} · ${x.fecha}${x.repetido?' · YA REGISTRADO':''}</span>
        <button data-sc="${i}" style="color:${x.on?'var(--expense)':'var(--cta)'}">${x.on?'Quitar':'Incluir'}</button></div>
      <input data-sf="desc" data-i="${i}" value="${x.desc.replace(/"/g,'&quot;')}" placeholder="Descripción">
      <div class="duo">
        <input class="sm" data-sf="monto" data-i="${i}" inputmode="decimal" data-money value="${mv(x.monto)}">
        <select data-sf="cat" data-i="${i}">${(x.t==='in'?cin:cats).map(n=>
          `<option value="${n}" ${x.cat===n?'selected':''}>${n}</option>`).join('')}</select>
      </div>
      <input data-sf="fecha" data-i="${i}" type="date" value="${x.fecha}">
      ${x.t==='pay'?`<select data-sf="pagoDesde" data-i="${i}">
        ${flat().map(o=>`<option value="${o.id}" ${x.pagoDesde===o.id?'selected':''}>Pagado desde ${o.n}</option>`).join('')}</select>`:''}
      ${x.t==='move'?`<select data-sf="dst" data-i="${i}">
        <option value="">¿A dónde entró el efectivo?</option>
        ${flat().filter(o=>o.id!==scan.src).map(o=>
          `<option value="${o.id}" ${x.dst===o.id?'selected':''}>${o.n}</option>`).join('')}</select>`:''}
    </div>`).join('')
    +`<button class="btn" id="scan-add" style="background:var(--cta);color:var(--on-cta);border-color:var(--cta)">
        Agregar ${scan.items.filter(x=>x.on).length} movimientos</button>`;
  $('scan-add').onclick=async()=>{
    const sel=scan.items.filter(x=>x.on&&x.monto>0);
    if(!sel.length)return toast('No hay nada seleccionado');
    if(sel.some(x=>x.t==='move'&&!x.dst))return toast('Dile a dónde entró el efectivo del retiro');
    sel.forEach((x,n)=>{
      if(x.t==='pay'){
        DB.mov.push({id:'sc'+Date.now()+n,ts:isoTs(x.fecha),t:'pay',amount:x.monto,
          src:x.pagoDesde,dst:scan.src,cat:'Pago tarjeta',note:x.desc,ref:x.ref,alloc:[]});
        return;}
      const m={id:'sc'+Date.now()+n,ts:isoTs(x.fecha),t:x.t,amount:x.monto,
        src:scan.src,cat:x.t==='move'?'Retiro en cajero':x.cat,note:x.desc,ref:x.ref};
      if(x.t==='move')m.dst=x.dst;
      if(x.t==='out'&&isCard(scan.src))m.paidAmt=0;
      aprender(x.desc,x.cat);
      DB.mov.push(m);});
    await Store.save(DB);scan.items=[];drawScan();
    $('scan-status').textContent='';render();
    toast('Se agregaron '+sel.length+' movimientos');};
}
$('scan-res').addEventListener('input',e=>{
  const t=e.target;if(!t.dataset.sf)return;
  const x=scan.items[+t.dataset.i],f=t.dataset.sf;
  if(f==='desc')x.desc=t.value;
  else if(f==='monto')x.monto=clean(t.value);
  else if(f==='fecha')x.fecha=t.value;});
$('scan-res').addEventListener('change',e=>{
  const t=e.target;if(!t.dataset.sf)return;
  if(t.dataset.sf==='cat')scan.items[+t.dataset.i].cat=t.value;
  if(t.dataset.sf==='dst')scan.items[+t.dataset.i].dst=t.value;
  if(t.dataset.sf==='pagoDesde')scan.items[+t.dataset.i].pagoDesde=t.value;
  if(t.dataset.sf==='fecha')scan.items[+t.dataset.i].fecha=t.value;});
$('scan-res').addEventListener('click',e=>{
  const b=e.target.closest('[data-sc]');if(!b)return;
  const x=scan.items[+b.dataset.sc];x.on=!x.on;drawScan();});
