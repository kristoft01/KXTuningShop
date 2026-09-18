const SUPABASE_URL='https://kgcareaxamxisilmwyvi.supabase.co';
const SUPABASE_KEY='sb_publishable_oXGqd9Xf9u50GeQcsY8G2g_1X639MFE';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const WA='40753911677';

const fallbackServices=[
  ['Interior Custom','Retapițare plafon, stâlpi și fețe de uși • Alcantara • colantări'],
  ['Ambient & Light Design','Lumini ambientale premium • plafon înstelat • stele în uși'],
  ['Personalizare','Centuri colorate • design interior unic • elemente custom'],
  ['Multimedia & Audio','Navigații CarPlay • camere reverse • sisteme audio'],
  ['Detailing','Detailing interior complet • polish faruri'],
  ['Service & Software','Mentenanță • diagnoză • codări & adaptări']
];

let cart=JSON.parse(localStorage.getItem('kxCart')||'[]');

function esc(s=''){
  return String(s).replace(/[&<>'"]/g,c=>({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

function saveCart(){
  localStorage.setItem('kxCart',JSON.stringify(cart));
  updateCartUI();
}

function cartCount(){
  return cart.reduce((sum,item)=>sum+item.quantity,0);
}

function cartTotal(){
  return cart.reduce((sum,item)=>sum+(Number(item.price)||0)*item.quantity,0);
}

function updateCartUI(){
  const count=document.getElementById('cartCount');
  if(count) count.textContent=cartCount();

  const total=document.getElementById('cartTotal');
  if(total) total.textContent=cartTotal().toFixed(2)+' lei';

  const box=document.getElementById('cartItems');
  if(!box) return;

  if(!cart.length){
    box.innerHTML='<div class="empty">Coșul este gol.</div>';
    return;
  }

  box.innerHTML=cart.map(item=>`
    <div class="cart-item">
      <div>
        <strong>${esc(item.name)}</strong>
        <small>${Number(item.price).toFixed(2)} lei / buc.</small>
      </div>

      <div class="cart-controls">
        <button onclick="changeQuantity('${item.id}',-1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQuantity('${item.id}',1)">+</button>
        <button class="danger" onclick="removeFromCart('${item.id}')">Șterge</button>
      </div>
    </div>
  `).join('');
}

function addToCart(product){
  const existing=cart.find(x=>x.id===product.id);

  if(existing){
    existing.quantity++;
  }else{
    cart.push({
      id:product.id,
      name:product.name,
      price:Number(product.price)||0,
      quantity:1
    });
  }

  saveCart();

  const box=document.getElementById('cartBox');
  if(box) box.classList.remove('hidden');
}

function changeQuantity(id,change){
  const item=cart.find(x=>x.id===id);
  if(!item) return;

  item.quantity+=change;

  if(item.quantity<=0){
    cart=cart.filter(x=>x.id!==id);
  }

  saveCart();
}

function removeFromCart(id){
  cart=cart.filter(x=>x.id!==id);
  saveCart();
}

function toggleCart(){
  const box=document.getElementById('cartBox');
  if(box) box.classList.toggle('hidden');
  updateCartUI();
}

function openCheckout(){
  if(!cart.length){
    alert('Coșul este gol.');
    return;
  }

  const box=document.getElementById('cartBox');

  const old=document.getElementById('checkoutForm');
  if(old) old.remove();

  const form=document.createElement('div');
  form.id='checkoutForm';
  form.className='checkout-form';

  form.innerHTML=`
    <div class="eyebrow">DATE CLIENT</div>
    <h3>Finalizează comanda</h3>

    <label>Nume*
      <input id="checkoutName" required placeholder="Numele tău">
    </label>

    <label>Telefon*
      <input id="checkoutPhone" required placeholder="07xx xxx xxx">
    </label>

    <label>Adresă de livrare*
      <textarea id="checkoutAddress" required placeholder="Stradă, număr, localitate, județ"></textarea>
    </label>

    <label>Observații
      <textarea id="checkoutNotes" placeholder="Detalii suplimentare despre comandă"></textarea>
    </label>

    <button class="btn primary" onclick="placeOrder()">
      PLASEAZĂ COMANDA →
    </button>

    <p id="checkoutMessage" class="success"></p>
  `;

  box.appendChild(form);
  form.scrollIntoView({behavior:'smooth',block:'center'});
}

async function placeOrder(){
  if(!cart.length) return;

  const name=document.getElementById('checkoutName')?.value.trim();
  const phone=document.getElementById('checkoutPhone')?.value.trim();
  const address=document.getElementById('checkoutAddress')?.value.trim();
  const notes=document.getElementById('checkoutNotes')?.value.trim()||'';

  const message=document.getElementById('checkoutMessage');

  if(!name||!phone||!address){
    message.textContent='Completează numele, telefonul și adresa.';
    message.className='error';
    return;
  }

  message.textContent='Se trimite comanda...';
  message.className='success';

  const total=cartTotal();

  const {
    data:order,
    error:orderError
  }=await sb.from('orders').insert({
    customer_name:name,
    customer_phone:phone,
    customer_address:address,
    total:total,
    status:'new',
    notes:notes
  }).select().single();

  if(orderError){
    message.textContent='Nu am putut trimite comanda. Încearcă din nou.';
    message.className='error';
    console.error(orderError);
    return;
  }

  const items=cart.map(item=>({
    order_id:order.id,
    product_id:item.id,
    product_name:item.name,
    quantity:item.quantity,
    price:Number(item.price)||0
  }));

  const {error:itemError}=await sb.from('order_items').insert(items);

  if(itemError){
    message.textContent='Comanda a fost creată, dar produsele nu au putut fi salvate.';
    message.className='error';
    console.error(itemError);
    return;
  }

  message.textContent='Comanda a fost trimisă cu succes! Te vom contacta cât mai repede.';

  const whatsappMessage=
    `Salut! Am plasat o comandă pe KXTuningShop.%0A`+
    `Nume: ${encodeURIComponent(name)}%0A`+
    `Telefon: ${encodeURIComponent(phone)}%0A`+
    `Total: ${encodeURIComponent(total.toFixed(2))} lei`;

  cart=[];
  saveCart();

  setTimeout(()=>{
    window.open(`https://wa.me/${WA}?text=${whatsappMessage}`,'_blank');
  },500);
}

async function loadPublic(){
  const [
    {data:services},
    {data:projects},
    {data:products}
  ]=await Promise.all([
    sb.from('services')
      .select('*')
      .eq('active',true)
      .order('created_at',{ascending:false}),

    sb.from('projects')
      .select('*')
      .order('created_at',{ascending:false}),

    sb.from('products')
      .select('*')
      .eq('available',true)
      .order('created_at',{ascending:false})
  ]);

  const s=services?.length
    ?services
    :fallbackServices.map(([name,description])=>({name,description}));

  document.getElementById('services').innerHTML=s.map(x=>`
    <article class="card service-card">
      <div class="card-icon">✦</div>
      <h3>${esc(x.name)}</h3>
      <p>${esc(x.description||'')}</p>
    </article>
  `).join('');

  document.getElementById('serviceSelect').innerHTML=
    '<option value="">Alege serviciul</option>'+
    s.map(x=>`<option>${esc(x.name)}</option>`).join('');

  document.getElementById('projects').innerHTML=
    projects?.length
    ?projects.map(x=>`
      <article class="project-card">
        ${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.title)}">`:''}
        <div>
          <small>${esc(x.car_make||'')} ${esc(x.car_model||'')}</small>
          <h3>${esc(x.title)}</h3>
          <p>${esc(x.description||x.service||'')}</p>
        </div>
      </article>
    `).join('')
    :'<div class="empty">Lucrările vor apărea aici în curând.</div>';

  document.getElementById('products').innerHTML=
    products?.length
    ?products.map(x=>`
      <article class="product-card">
        ${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.name)}">`:''}
        <div>
          <small>${esc(x.category||'')}</small>
          <h3>${esc(x.name)}</h3>
          <p>${esc(x.description||'')}</p>
          <strong>${x.price!=null?esc(x.price)+' lei':'Cere preț'}</strong>

          ${x.price!=null?`
            <button
              class="btn primary add-cart"
              onclick='addToCart(${JSON.stringify(x)})'>
              🛒 ADAUGĂ ÎN COȘ
            </button>
          `:''}
        </div>
      </article>
    `).join('')
    :'<div class="empty">Produsele le vei adăuga din panoul de administrare.</div>';

  updateCartUI();
}

function whatsapp(message){
  return `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;
}

document.addEventListener('DOMContentLoaded',async()=>{
  if(document.getElementById('services')){
    await loadPublic();
  }

  updateCartUI();

  const f=document.getElementById('quoteForm');

  if(f){
    f.addEventListener('submit',async e=>{
      e.preventDefault();

      const fd=new FormData(f);

      const q={
        name:fd.get('nume'),
        phone:fd.get('telefon'),
        car_make:fd.get('marca'),
        car_model:fd.get('model'),
        car_year:fd.get('an')?Number(fd.get('an')):null,
        service:fd.get('serviciu'),
        message:`Motorizare: ${fd.get('motor')||'-'}\n${fd.get('detalii')||''}`
      };

      const {error}=await sb.from('quote_requests').insert(q);

      const msg=document.getElementById('success');

      if(error){
        msg.textContent='Nu am putut trimite cererea. Încearcă WhatsApp.';
        document.getElementById('formWhatsApp').href=
          whatsapp(`Salut! Vreau o ofertă pentru ${q.car_make} ${q.car_model}. ${q.service}. ${q.message}`);
        return;
      }

      msg.textContent='Cererea a fost trimisă! Te vom contacta cât mai repede.';

      document.getElementById('formWhatsApp').href=
        whatsapp(`Salut! Am trimis o cerere pe site pentru ${q.car_make} ${q.car_model}.`);

      f.reset();
    });
  }
});
