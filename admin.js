```javascript
const tables = {
  products: {
    label: 'Piese auto',
    fields: [
      'name',
      'description',
      'price',
      'category',
      'image_url',
      'available'
    ]
  },

  services: {
    label: 'Servicii',
    fields: [
      'name',
      'description',
      'price_from',
      'image_url',
      'active'
    ]
  },

  projects: {
    label: 'Lucrări',
    fields: [
      'title',
      'description',
      'car_make',
      'car_model',
      'service',
      'image_url'
    ]
  }
};


let current = 'dash';


function aesc(s = '') {
  return String(s).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}


/* =========================
   LOGIN / USER
========================= */

async function requireUser() {

  const {
    data: { session }
  } = await sb.auth.getSession();

  if (!session) {
    showLogin();
    return null;
  }

  const adminUser =
    document.getElementById('adminUser');

  if (adminUser) {
    adminUser.textContent =
      session.user.email || 'Administrator';
  }

  return session;
}


function showLogin() {

  document.body.innerHTML = `
    <div class="login">

      <img src="logo.jpg" alt="KXTuningShop">

      <div class="login-box">

        <h1>ADMIN KXTUNINGSHOP</h1>

        <p>
          Intră în panoul de administrare.
        </p>

        <input
          id="email"
          type="email"
          placeholder="Email"
        >

        <input
          id="password"
          type="password"
          placeholder="Parolă"
        >

        <button
          class="btn primary"
          id="loginBtn"
        >
          INTRĂ ÎN PANOU
        </button>

        <p id="loginMsg"></p>

        <a href="index.html">
          ← Înapoi la site
        </a>

      </div>

    </div>
  `;


  document.getElementById('loginBtn').onclick =
    async () => {

      const {
        error
      } = await sb.auth.signInWithPassword({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      });


      document.getElementById('loginMsg').textContent =
        error ? error.message : '';


      if (!error) {
        location.reload();
      }
    };
}


/* =========================
   COUNT
========================= */

async function count(t) {

  const {
    count
  } = await sb
    .from(t)
    .select('*', {
      count: 'exact',
      head: true
    });

  return count || 0;
}


/* =========================
   DASHBOARD
========================= */

async function renderDash() {

  const [
    p,
    s,
    pr,
    q,
    o
  ] = await Promise.all([
    'products',
    'services',
    'projects',
    'quote_requests',
    'orders'
  ].map(count));


  const dash =
    document.getElementById('dash');


  dash.innerHTML = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          KXTUNINGSHOP
        </div>

        <h1>
          Panou principal
        </h1>

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

      <h2>
        Acțiuni rapide
      </h2>

      <div class="quick">

        <button
          onclick="openTab('products')"
        >
          + Adaugă produs
        </button>

        <button
          onclick="openTab('services')"
        >
          + Adaugă serviciu
        </button>

        <button
          onclick="openTab('projects')"
        >
          + Adaugă lucrare
        </button>

        <button
          onclick="openTab('quotes')"
        >
          Vezi cereri
        </button>

        <button
          onclick="openTab('orders')"
        >
          🛒 Vezi comenzi
        </button>

      </div>

    </div>
  `;
}


/* =========================
   PRODUCTS / SERVICES /
   PROJECTS
========================= */

async function renderTable(tab) {

  const cfg = tables[tab];


  const {
    data,
    error
  } = await sb
    .from(tab)
    .select('*')
    .order('created_at', {
      ascending: false
    });


  if (error) {

    document.getElementById(tab).innerHTML = `
      <p class="error">
        ${aesc(error.message)}
      </p>
    `;

    return;
  }


  const rows = (data || [])
    .map(x => `

      <tr>

        <td>
          <b>
            ${aesc(x.name || x.title)}
          </b>
        </td>

        <td>
          ${aesc(
            x.description ||
            x.service ||
            ''
          )}
        </td>

        <td>
          ${
            x.price != null
              ? aesc(x.price) + ' lei'
              : x.price_from != null
                ? 'de ' + aesc(x.price_from) + ' lei'
                : ''
          }
        </td>

        <td>

          <button
            onclick='editItem(
              ${JSON.stringify(tab)},
              ${JSON.stringify(x)}
            )'
          >
            Editează
          </button>

          <button
            class="danger"
            onclick='deleteItem(
              ${JSON.stringify(tab)},
              ${JSON.stringify(x.id)}
            )'
          >
            Șterge
          </button>

        </td>

      </tr>

    `)
    .join('');


  document.getElementById(tab).innerHTML = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          ADMIN
        </div>

        <h1>
          ${cfg.label}
        </h1>

      </div>

      <button
        class="btn primary"
        onclick='newItem("${tab}")'
      >
        + ADAUGĂ
      </button>

    </div>


    <div class="panel">

      <table>

        <thead>

          <tr>

            <th>
              Nume
            </th>

            <th>
              Descriere
            </th>

            <th>
              Preț
            </th>

            <th></th>

          </tr>

        </thead>

        <tbody>

          ${
            rows ||
            '<tr><td colspan="4">Nu există elemente.</td></tr>'
          }

        </tbody>

      </table>

    </div>
  `;
}


/* =========================
   CERERI OFERTĂ
========================= */

async function renderQuotes() {

  const {
    data,
    error
  } = await sb
    .from('quote_requests')
    .select('*')
    .order('created_at', {
      ascending: false
    });


  const quotes =
    document.getElementById('quotes');


  quotes.innerHTML = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          ADMIN
        </div>

        <h1>
          Cereri de ofertă
        </h1>

      </div>

    </div>


    <div class="panel">

      <table>

        <thead>

          <tr>

            <th>
              Client
            </th>

            <th>
              Mașină
            </th>

            <th>
              Serviciu
            </th>

            <th>
              Telefon
            </th>

            <th>
              Data
            </th>

          </tr>

        </thead>

        <tbody>

          ${
            error

              ? `
                <tr>
                  <td colspan="5">
                    ${aesc(error.message)}
                  </td>
                </tr>
              `

              : (data || [])
                  .map(x => `

                    <tr>

                      <td>
                        <b>
                          ${aesc(x.name)}
                        </b>
                      </td>

                      <td>
                        ${aesc(x.car_make)}
                        ${aesc(x.car_model)}
                        ${x.car_year || ''}
                      </td>

                      <td>
                        ${aesc(x.service)}
                      </td>

                      <td>
                        <a href="tel:${aesc(x.phone)}">
                          ${aesc(x.phone)}
                        </a>
                      </td>

                      <td>
                        ${
                          x.created_at
                            ? new Date(
                                x.created_at
                              ).toLocaleString('ro-RO')
                            : ''
                        }
                      </td>

                    </tr>

                  `)
                  .join('') ||
                '<tr><td colspan="5">Nicio cerere.</td></tr>'
          }

        </tbody>

      </table>

    </div>
  `;


  const badge =
    document.getElementById('badge');

  if (badge) {
    badge.textContent =
      (data || []).length;
  }
}


/* =========================
   COMENZI
========================= */

async function renderOrders() {

  const ordersBox =
    document.getElementById('orders');


  if (!ordersBox) return;


  ordersBox.innerHTML = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          ADMIN
        </div>

        <h1>
          Comenzi
        </h1>

      </div>

      <button
        class="btn primary"
        onclick="renderOrders()"
      >
        ↻ REÎMPROSPĂTEAZĂ
      </button>

    </div>

    <div class="panel">
      Se încarcă comenzile...
    </div>
  `;


  /* -------------------------
     CITIM ORDERS
  ------------------------- */

  const {
    data: orders,
    error: ordersError
  } = await sb
    .from('orders')
    .select(`
      id,
      customer_name,
      customer_phone,
      customer_address,
      total,
      status,
      created_at
    `)
    .order('created_at', {
      ascending: false
    });


  /* -------------------------
     EROARE ORDERS
  ------------------------- */

  if (ordersError) {

    console.error(
      'Eroare orders:',
      ordersError
    );


    ordersBox.innerHTML = `

      <div class="page-head">

        <div>

          <div class="eyebrow">
            ADMIN
          </div>

          <h1>
            Comenzi
          </h1>

        </div>

      </div>


      <div class="panel">

        <h2>
          Eroare la încărcarea comenzilor
        </h2>

        <p>
          ${aesc(ordersError.message)}
        </p>

        <p>
          Cod:
          ${aesc(ordersError.code || '-')}
        </p>

      </div>
    `;

    return;
  }


  const orderList =
    orders || [];


  /* -------------------------
     CITIM ORDER_ITEMS
  ------------------------- */

  let items = [];


  if (orderList.length) {

    const orderIds =
      orderList.map(order => order.id);


    const {
      data: itemData,
      error: itemError
    } = await sb
      .from('order_items')
      .select(`
        id,
        order_id,
        product_name,
        quantity,
        price
      `)
      .in('order_id', orderIds);


    if (itemError) {

      console.error(
        'Eroare order_items:',
        itemError
      );

    } else {

      items =
        itemData || [];
    }
  }


  /* -------------------------
     FĂRĂ COMENZI
  ------------------------- */

  if (!orderList.length) {

    ordersBox.innerHTML = `

      <div class="page-head">

        <div>

          <div class="eyebrow">
            ADMIN
          </div>

          <h1>
            Comenzi
          </h1>

        </div>

        <button
          class="btn primary"
          onclick="renderOrders()"
        >
          ↻ REÎMPROSPĂTEAZĂ
        </button>

      </div>


      <div class="panel">

        <h2>
          Nu există comenzi
        </h2>

        <p>
          Nu există momentan nicio comandă.
        </p>

      </div>
    `;

    return;
  }


  /* -------------------------
     CONSTRUIM PAGINA
  ------------------------- */

  let html = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          ADMIN
        </div>

        <h1>
          Comenzi
        </h1>

        <p>
          ${orderList.length}
          ${
            orderList.length === 1
              ? 'comandă'
              : 'comenzi'
          }
        </p>

      </div>

      <button
        class="btn primary"
        onclick="renderOrders()"
      >
        ↻ REÎMPROSPĂTEAZĂ
      </button>

    </div>

  `;


  /* -------------------------
     FIECARE COMANDĂ
  ------------------------- */

  orderList.forEach((order, index) => {

    const orderItems =
      items.filter(
        item =>
          item.order_id === order.id
      );


    const total =
      Number(order.total || 0);


    html += `

      <div class="panel">

        <div class="page-head">

          <div>

            <div class="eyebrow">
              COMANDA #${index + 1}
            </div>

            <h2>
              ${aesc(
                order.customer_name ||
                'Client'
              )}
            </h2>

          </div>

          <strong>
            ${total.toLocaleString('ro-RO')}
            lei
          </strong>

        </div>


        <p>
          <b>Telefon:</b>
          ${aesc(
            order.customer_phone || '-'
          )}
        </p>


        <p>
          <b>Adresă:</b>
          ${aesc(
            order.customer_address || '-'
          )}
        </p>


        <p>
          <b>Status:</b>
          ${aesc(
            order.status || 'nouă'
          )}
        </p>


        <p>
          <b>Data:</b>
          ${
            order.created_at
              ? new Date(
                  order.created_at
                ).toLocaleString('ro-RO')
              : '-'
          }
        </p>


        <h3>
          Produse
        </h3>

    `;


    if (!orderItems.length) {

      html += `

        <p>
          Nu există produse salvate
          pentru această comandă.
        </p>

      `;

    } else {

      html += `

        <table>

          <thead>

            <tr>

              <th>
                Produs
              </th>

              <th>
                Cantitate
              </th>

              <th>
                Preț
              </th>

              <th>
                Subtotal
              </th>

            </tr>

          </thead>

          <tbody>

      `;


      orderItems.forEach(item => {

        const quantity =
          Number(item.quantity || 0);

        const price =
          Number(item.price || 0);

        const subtotal =
          quantity * price;


        html += `

          <tr>

            <td>
              ${aesc(
                item.product_name || '-'
              )}
            </td>

            <td>
              ${quantity}
            </td>

            <td>
              ${price.toLocaleString('ro-RO')}
              lei
            </td>

            <td>
              ${subtotal.toLocaleString('ro-RO')}
              lei
            </td>

          </tr>

        `;
      });


      html += `

          </tbody>

        </table>

      `;
    }


    html += `

        <div class="cart-total">

          <span>
            Total comandă
          </span>

          <strong>
            ${total.toLocaleString('ro-RO')}
            lei
          </strong>

        </div>

      </div>

    `;
  });


  ordersBox.innerHTML = html;
}


/* =========================
   MODAL
========================= */

function modal(html) {

  const d =
    document.createElement('div');

  d.className =
    'modal-wrap';

  d.innerHTML = `

    <div class="modal">

      <button
        class="x"
        onclick="this.closest('.modal-wrap').remove()"
      >
        ×
      </button>

      ${html}

    </div>
  `;


  document.body.appendChild(d);

  return d;
}


/* =========================
   ADAUGĂ
========================= */

window.newItem = tab => {

  const c =
    tables[tab];


  const fields =
    c.fields
      .map(f => `

        <label>

          ${f}

          <input
            name="${f}"
            ${
              ['available', 'active'].includes(f)
                ? 'type="checkbox" checked'
                : ''
            }
          >

        </label>

      `)
      .join('');


  const box =
    modal(`

      <h2>
        Adaugă ${c.label}
      </h2>

      <form id="itemForm">

        ${fields}

        <button
          class="btn primary"
        >
          SALVEAZĂ
        </button>

      </form>

    `);


  const form =
    box.querySelector('#itemForm');


  form.onsubmit =
    async e => {

      e.preventDefault();


      const o = {};


      for (const f of c.fields) {

        const input =
          form.elements[f];


        o[f] =
          input.type === 'checkbox'
            ? input.checked
            : input.value || null;


        if (
          ['price', 'price_from'].includes(f) &&
          o[f]
        ) {
          o[f] =
            Number(o[f]);
        }
      }


      const {
        error
      } = await sb
        .from(tab)
        .insert(o);


      if (error) {

        alert(
          error.message
        );

      } else {

        box.remove();

        renderTable(tab);
      }
    };
};


/* =========================
   EDITARE
========================= */

window.editItem =
  (tab, x) => {

    const c =
      tables[tab];


    const fields =
      c.fields
        .map(f => `

          <label>

            ${f}

            <input
              name="${f}"
              ${
                ['available', 'active'].includes(f)
                  ? 'type="checkbox"'
                  : ''
              }

              ${
                ['available', 'active'].includes(f)
                  ? (x[f] ? 'checked' : '')
                  : `value="${aesc(x[f] ?? '')}"`
              }
            >

          </label>

        `)
        .join('');


    const box =
      modal(`

        <h2>
          Editează ${c.label}
        </h2>

        <form id="itemForm">

          ${fields}

          <button
            class="btn primary"
          >
            SALVEAZĂ
          </button>

        </form>

      `);


    const form =
      box.querySelector('#itemForm');


    form.onsubmit =
      async e => {

        e.preventDefault();


        const o = {};


        for (const f of c.fields) {

          const input =
            form.elements[f];


          o[f] =
            input.type === 'checkbox'
              ? input.checked
              : input.value || null;


          if (
            ['price', 'price_from'].includes(f) &&
            o[f]
          ) {
            o[f] =
              Number(o[f]);
          }
        }


        const {
          error
        } = await sb
          .from(tab)
          .update(o)
          .eq('id', x.id);


        if (error) {

          alert(
            error.message
          );

        } else {

          box.remove();

          renderTable(tab);
        }
      };
};


/* =========================
   ȘTERGERE
========================= */

window.deleteItem =
  async (tab, id) => {

    if (
      !confirm(
        'Sigur vrei să ștergi?'
      )
    ) {
      return;
    }


    const {
      error
    } = await sb
      .from(tab)
      .delete()
      .eq('id', id);


    if (error) {

      alert(
        error.message
      );

    } else {

      renderTable(tab);
    }
  };


/* =========================
   NAVIGARE TABURI
========================= */

window.openTab =
  async tab => {

    current = tab;


    document
      .querySelectorAll('.tab')
      .forEach(x => {
        x.classList.add('hidden');
      });


    const target =
      document.getElementById(tab);


    if (target) {
      target.classList.remove('hidden');
    }


    document
      .querySelectorAll(
        'aside button[data-tab]'
      )
      .forEach(x => {

        x.classList.toggle(
          'active',
          x.dataset.tab === tab
        );

      });


    if (tab === 'dash') {

      await renderDash();

    } else if (tab === 'quotes') {

      await renderQuotes();

    } else if (tab === 'orders') {

      await renderOrders();

    } else if (tables[tab]) {

      await renderTable(tab);

    }
  };


/* =========================
   START ADMIN
========================= */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    const user =
      await requireUser();


    if (!user) {
      return;
    }


    document
      .querySelectorAll(
        'aside button[data-tab]'
      )
      .forEach(button => {

        button.onclick =
          () => openTab(
            button.dataset.tab
          );

      });


    const logout =
      document.getElementById('logout');


    if (logout) {

      logout.onclick =
        async () => {

          await sb.auth.signOut();

          location.reload();

        };
    }


    openTab('dash');

  }
);
```
