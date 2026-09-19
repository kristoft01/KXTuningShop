```javascript
const tables = {
  products: {
    label: 'Piese auto',
    fields: ['name','description','price','category','image_url','available']
  },
  services: {
    label: 'Servicii',
    fields: ['name','description','price_from','image_url','active']
  },
  projects: {
    label: 'Lucrări',
    fields: ['title','description','car_make','car_model','service','image_url']
  }
};

let current = 'dash';

function aesc(s='') {
  return String(s).replace(/[&<>'"]/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}


async function requireUser() {
  const {
    data: { session }
  } = await sb.auth.getSession();

  if (!session) {
    showLogin();
    return null;
  }

  document.getElementById('adminUser').textContent =
    session.user.email || 'Administrator';

  return session;
}


function showLogin() {
  document.body.innerHTML = `
    <div class="login">
      <img src="logo.jpg" alt="KXTuningShop">

      <div class="login-box">
        <h1>ADMIN KXTUNINGSHOP</h1>
        <p>Intră în panoul de administrare.</p>

        <input id="email" type="email" placeholder="Email">
        <input id="password" type="password" placeholder="Parolă">

        <button class="btn primary" id="loginBtn">
          INTRĂ ÎN PANOU
        </button>

        <p id="loginMsg"></p>

        <a href="index.html">
          ← Înapoi la site
        </a>
      </div>
    </div>
  `;

  document.getElementById('loginBtn').onclick = async () => {
    const {
      error
    } = await sb.auth.signInWithPassword({
      email: email.value,
      password: password.value
    });

    loginMsg.textContent = error ? error.message : '';

    if (!error) {
      location.reload();
    }
  };
}


async function count(t) {
  const { count } = await sb
    .from(t)
    .select('*', {
      count: 'exact',
      head: true
    });

  return count || 0;
}


async function renderDash() {
  const [p, s, pr, q, o] = await Promise.all([
    'products',
    'services',
    'projects',
    'quote_requests',
    'orders'
  ].map(count));

  dash.innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">KXTUNINGSHOP</div>
        <h1>Panou principal</h1>
      </div>
    </div>

    <div class="stats">

      <div>
        <b>${p}</b>
        <span>Produse</span>
      </div>

      <div>
        <b>${s}</b>
        <span>Servicii</span>
      </div>

      <div>
        <b>${pr}</b>
        <span>Lucrări</span>
      </div>

      <div>
        <b>${q}</b>
        <span>Cereri ofertă</span>
      </div>

      <div>
        <b>${o}</b>
        <span>Comenzi</span>
      </div>

    </div>

    <div class="panel">
      <h2>Acțiuni rapide</h2>

      <div class="quick">
        <button onclick="openTab('products')">
          + Adaugă produs
        </button>

        <button onclick="openTab('services')">
          + Adaugă serviciu
        </button>

        <button onclick="openTab('projects')">
```
