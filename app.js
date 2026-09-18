const SUPABASE_URL='https://kgcareaxamxisilmwyvi.supabase.co';
const SUPABASE_KEY='sb_publishable_oXGqd9Xf9u50GeQcsY8G2g_1X639MFE';
const sb=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const WA='40753911677';
const fallbackServices=[['Interior Custom','Retapițare plafon, stâlpi și fețe de uși • Alcantara • colantări'],['Ambient & Light Design','Lumini ambientale premium • plafon înstelat • stele în uși'],['Personalizare','Centuri colorate • design interior unic • elemente custom'],['Multimedia & Audio','Navigații CarPlay • camere reverse • sisteme audio'],['Detailing','Detailing interior complet • polish faruri'],['Service & Software','Mentenanță • diagnoză • codări & adaptări']];
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
async function loadPublic(){
 const [{data:services},{data:projects},{data:products}]=await Promise.all([
  sb.from('services').select('*').eq('active',true).order('created_at',{ascending:false}),
  sb.from('projects').select('*').order('created_at',{ascending:false}),
  sb.from('products').select('*').eq('available',true).order('created_at',{ascending:false})
 ]);
 const s=services?.length?services:fallbackServices.map(([name,description])=>({name,description}));
 document.getElementById('services').innerHTML=s.map(x=>`<article class="card service-card"><div class="card-icon">✦</div><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p></article>`).join('');
 document.getElementById('serviceSelect').innerHTML='<option value="">Alege serviciul</option>'+s.map(x=>`<option>${esc(x.name)}</option>`).join('');
 document.getElementById('projects').innerHTML=projects?.length?projects.map(x=>`<article class="project-card">${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.title)}">`:''}<div><small>${esc(x.car_make||'')} ${esc(x.car_model||'')}</small><h3>${esc(x.title)}</h3><p>${esc(x.description||x.service||'')}</p></div></article>`).join(''):'<div class="empty">Lucrările vor apărea aici în curând.</div>';
 document.getElementById('products').innerHTML=products?.length?products.map(x=>`<article class="product-card">${x.image_url?`<img src="${esc(x.image_url)}" alt="${esc(x.name)}">`:''}<div><small>${esc(x.category||'')}</small><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p><strong>${x.price!=null?esc(x.price)+' lei':'Cere preț'}</strong></div></article>`).join(''):'<div class="empty">Produsele le vei adăuga din panoul de administrare.</div>';
}
function whatsapp(message){return `https://wa.me/${WA}?text=${encodeURIComponent(message)}`;}
document.addEventListener('DOMContentLoaded',async()=>{
 if(document.getElementById('services')) await loadPublic();
 const f=document.getElementById('quoteForm'); if(f) f.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(f);const q={name:fd.get('nume'),phone:fd.get('telefon'),car_make:fd.get('marca'),car_model:fd.get('model'),car_year:fd.get('an')?Number(fd.get('an')):null,service:fd.get('serviciu'),message:`Motorizare: ${fd.get('motor')||'-'}\n${fd.get('detalii')||''}`};const {error}=await sb.from('quote_requests').insert(q);const msg=document.getElementById('success');if(error){msg.textContent='Nu am putut trimite cererea. Încearcă WhatsApp.';document.getElementById('formWhatsApp').href=whatsapp(`Salut! Vreau o ofertă pentru ${q.car_make} ${q.car_model}. ${q.service}. ${q.message}`);return;}msg.textContent='Cererea a fost trimisă! Te vom contacta cât mai repede.';document.getElementById('formWhatsApp').href=whatsapp(`Salut! Am trimis o cerere pe site pentru ${q.car_make} ${q.car_model}.`);f.reset();});
});
