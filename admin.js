const tables={products:{label:'Piese auto',fields:['name','description','price','category','image_url','available']},services:{label:'Servicii',fields:['name','description','price_from','image_url','active']},projects:{label:'Lucrări',fields:['title','description','car_make','car_model','service','image_url']}};
let current='dash';
function aesc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function requireUser(){
  const {data:{session}}=await sb.auth.getSession();
  if(!session){showLogin();return null;}
  document.getElementById('adminUser').textContent=session.user.email||'Administrator';
  return session;
}
function showLogin(){
  document.body.innerHTML=`<div class="login"><img src="logo.jpg"><div class="login-box"><h1>ADMIN KXTUNINGSHOP</h1><p>Intră în panoul de administrare.</p><input id="email" type="email" placeholder="Email"><input id="password" type="password" placeholder="Parolă"><button class="btn primary" id="loginBtn">INTRĂ ÎN PANOU</button><p id="loginMsg"></p><a href="index.html">← Înapoi la site</a></div></div>`;
  document.getElementById('loginBtn').onclick=async()=>{
    const {error}=await sb.auth.signInWithPassword({email:email.value,password:password.value});
    loginMsg.textContent=error?error.message:'';
    if(!error)location.reload();
  };
}
async function count(t){
  const {count}=await sb.from(t).select('*',{count:'exact',head:true});
  return count||0;
}
async function renderDash(){
  const [p,s,pr,q,o]=await Promise.all(['products','services','projects','quote_requests','orders'].map(count));
  dash.innerHTML=`
    <div class="page-head">
      <div>
        <div class="eyebrow">KXTUNINGSHOP</div>
        <h1>Panou principal</h1>
      </div>
    </div>
    <div class="stats">
      <div><b>${p}</b><span>Produse</span></div>
      <div><b>${s}</b><span>Servicii</span></div>
      <div><b>${pr}</b><span>Lucrări</span></div>
      <div><b>${q}</b><span>Cereri ofertă</span></div>
      <div><b>${o}</b><span>Comenzi</span></div>
    </div>
    <div class="panel">
      <h2>Acțiuni rapide</h2>
      <div class="quick">
        <button onclick="openTab('products')">+ Adaugă produs</button>
        <button onclick="openTab('services')">+ Adaugă serviciu</button>
        <button onclick="openTab('projects')">+ Adaugă lucrare</button>
        <button onclick="openTab('quotes')">Vezi cereri</button>
        <button onclick="openTab('orders')">🛒 Vezi comenzi</button>
      </div>
    </div>
  `;
}
async function renderTable(tab){
  const cfg=tables[tab];
  const {data,error}=await sb.from(tab).select('*').order('created_at',{ascending:false});
  if(error){
    document.getElementById(tab).innerHTML=`<p class="error">${aesc(error.message)}</p>`;
    return;
  }
  const rows=(data||[]).map(x=>`
    <tr>
      <td><b>${aesc(x.name||x.title)}</b></td>
      <td>${aesc(x.description||x.service||'')}</td>
      <td>${x.price!=null?aesc(x.price)+' lei':x.price_from!=null?'de '+aesc(x.price_from)+' lei':''}</td>
      <td>
        <button onclick='editItem(${JSON.stringify(tab)},${JSON.stringify(x)})'>Editează</button>
        <button class="danger" onclick='deleteItem(${JSON.stringify(tab)},${JSON.stringify(x.id)})'>Șterge</button>
      </td>
    </tr>
  `).join('');
  document.getElementById(tab).innerHTML=`
    <div class="page-head">
      <div>
        <div class="eyebrow">ADMIN</div>
        <h1>${cfg.label}</h1>
      </div>
      <button class="btn primary" onclick='newItem("${tab}")'>+ ADAUGĂ</button>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr>
            <th>Nume</th>
            <th>Descriere</th>
            <th>Preț</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${rows||'<tr><td colspan="4">Nu există elemente.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}
async function renderQuotes(){
  const {data,error}=await sb.from('quote_requests').select('*').order('created_at',{ascending:false});
  quotes.innerHTML=`
    <div class="page-head">
      <div>
        <div class="eyebrow">ADMIN</div>
        <h1>Cereri de ofertă</h1>
      </div>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Mașină</th>
            <th>Serviciu</th>
            <th>Telefon</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${error
            ? `<tr><td colspan="5">${aesc(error.message)}</td></tr>`
            : (data||[]).map(x=>`
              <tr>
                <td><b>${aesc(x.name)}</b></td>
                <td>${aesc(x.car_make)} ${aesc(x.car_model)} ${x.car_year||''}</td>
                <td>${aesc(x.service)}</td>
                <td><a href="tel:${aesc(x.phone)}">${aesc(x.phone)}</a></td>
                <td>${new Date(x.created_at).toLocaleString('ro-RO')}</td>
              </tr>
            `).join('')||'<tr><td colspan="5">Nicio cerere.</td></tr>'
          }
        </tbody>
      </table>
    </div>
  `;
  badge.textContent=(data||[]).length;
}
async function renderOrders(){
  const {data,error}=await sb
    .from('orders')
    .select('*')
    .order('created_at',{ascending:false});
  if(error){
    document.getElementById('orders').innerHTML=`
      <div class="page-head">
        <div>
          <div class="eyebrow">ADMIN</div>
          <h1>Comenzi</h1>
        </div>
      </div>
      <div class="panel">
        <p class="error">${aesc(error.message)}</p>
      </div>
    `;
    return;
  }
  const orders=data||[];
  let rows='';
  for(const order of orders){
    const {data:items,error:itemError}=await sb
      .from('order_items')
      .select('*')
      .eq('order_id',order.id)
      .order('created_at',{ascending:true});
    const products=itemError
      ? 'Eroare la produsele comenzii'
      : (items||[]).length
        ? (items||[]).map(item=>
            `${aesc(item.product_name)} × ${aesc(item.quantity)} — ${aesc(item.price)} lei`
          ).join('<br>')
        : 'Fără produse';
    rows+=`
      <tr>
        <td>
          <b>${aesc(order.customer_name||'Client')}</b>
          <br>
          ${aesc(order.customer_phone||'')}
        </td>
        <td>
          ${aesc(order.customer_address||'')}
        </td>
        <td>
          ${products}
        </td>
        <td>
          <b>${aesc(order.total||0)} lei</b>
        </td>
        <td>
          ${aesc(order.status||'nouă')}
        </td>
        <td>
          ${order.created_at
            ? new Date(order.created_at).toLocaleString('ro-RO')
            : ''}
        </td>
      </tr>
    `;
  }
  document.getElementById('orders').innerHTML=`
    <div class="page-head">
      <div>
        <div class="eyebrow">ADMIN</div>
        <h1>Comenzi</h1>
      </div>
    </div>
    <div class="panel">
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Adresă</th>
            <th>Produse</th>
            <th>Total</th>
            <th>Status</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          ${rows||'<tr><td colspan="6">Nu există comenzi.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}
function modal(html){
  const d=document.createElement('div');
  d.className='modal-wrap';
  d.innerHTML=`<div class="modal"><button class="x" onclick="this.closest('.modal-wrap').remove()">×</button>${html}</div>`;
  document.body.appendChild(d);
}
window.newItem=tab=>{
  const c=tables[tab];
  const fields=c.fields.map(f=>
    `<label>${f}<input name="${f}" ${['available','active'].includes(f)?'type="checkbox" checked':''}></label>`
  ).join('');
  modal(`
    <h2>Adaugă ${c.label}</h2>
    <form id="itemForm">
      ${fields}
      <button class="btn primary">SALVEAZĂ</button>
    </form>
  `);
  itemForm.onsubmit=async e=>{
    e.preventDefault();
    const o={};
    for(const f of c.fields){
      const el=itemForm.elements[f];
      o[f]=el.type==='checkbox'?el.checked:el.value||null;
      if(['price','price_from'].includes(f)&&o[f])
        o[f]=Number(o[f]);
    }
    const {error}=await sb.from(tab).insert(o);
    if(error)
      alert(error.message);
    else{
      document.querySelector('.modal-wrap').remove();
      renderTable(tab);
    }
  };
};
window.editItem=(tab,x)=>{
  const c=tables[tab];
  const fields=c.fields.map(f=>
    `<label>${f}<input name="${f}" ${['available','active'].includes(f)?'type="checkbox"':''} ${['available','active'].includes(f)?(x[f]?'checked':''):`value="${aesc(x[f]??'')}"`}></label>`
  ).join('');
  modal(`
    <h2>Editează ${c.label}</h2>
    <form id="itemForm">
      ${fields}
      <button class="btn primary">SALVEAZĂ</button>
    </form>
  `);
  itemForm.onsubmit=async e=>{
    e.preventDefault();
    const o={};
    for(const f of c.fields){
      const el=itemForm.elements[f];
      o[f]=el.type==='checkbox'?el.checked:el.value||null;
      if(['price','price_from'].includes(f)&&o[f])
        o[f]=Number(o[f]);
    }
    const {error}=await sb.from(tab).update(o).eq('id',x.id);
    if(error)
      alert(error.message);
    else{
      document.querySelector('.modal-wrap').remove();
      renderTable(tab);
    }
  };
};
window.deleteItem=async(tab,id)=>{
  if(!confirm('Sigur vrei să ștergi?'))return;
  const {error}=await sb.from(tab).delete().eq('id',id);
  if(error)
    alert(error.message);
  else
    renderTable(tab);
};
window.openTab=async tab=>{
  current=tab;
  document.querySelectorAll('.tab').forEach(x=>x.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
  document.querySelectorAll('aside button[data-tab]').forEach(x=>
    x.classList.toggle('active',x.dataset.tab===tab)
  );
  if(tab==='dash')
    renderDash();
  else if(tab==='quotes')
    renderQuotes();
  else if(tab==='orders')
    renderOrders();
  else
    renderTable(tab);
};
document.addEventListener('DOMContentLoaded',async()=>{
  const u=await requireUser();
  if(!u)return;
  document.querySelectorAll('aside button[data-tab]').forEach(b=>
    b.onclick=()=>openTab(b.dataset.tab)
  );
  document.getElementById('logout').onclick=async()=>{
    await sb.auth.signOut();
    location.reload();
  };
  openTab('dash');
});
