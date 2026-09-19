```javascript
/* =========================================================
   KXTuningShop - ADMIN
   ========================================================= */

/* ---------------------------------------------------------
   Tabele administrabile
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */

function aesc(s = '') {
  return String(s).replace(/[&<>'"]/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[c]));
}


function el(id) {
  return document.getElementById(id);
}


function formatDate(value) {
  if (!value) return '-';

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) {
    return value;
  }

  return d.toLocaleString('ro-RO');
}


function formatPrice(value) {
  const number = Number(value || 0);

  return number.toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' lei';
}


/* ---------------------------------------------------------
   AUTH
--------------------------------------------------------- */

async function requireUser() {
  const {
    data: { session },
    error
  } = await sb.auth.getSession();

  if (error) {
    console.error('Eroare verificare sesiune:', error);
  }

  if (!session) {
    showLogin();
    return null;
  }

  const userBox = el('adminUser');

  if (userBox) {
    userBox.textContent =
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


  const loginBtn = el('loginBtn');
  const emailInput = el('email');
  const passwordInput = el('password');
  const loginMsg = el('loginMsg');


  loginBtn.onclick = async () => {

    loginBtn.disabled = true;
    loginBtn.textContent = 'SE CONECTEAZĂ...';

    const {
      error
    } = await sb.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) {

      loginMsg.textContent =
        error.message;

      loginBtn.disabled = false;
      loginBtn.textContent =
        'INTRĂ ÎN PANOU';

      return;
    }

    location.reload();
  };
}


/* ---------------------------------------------------------
   COUNT
--------------------------------------------------------- */

async function count(tableName) {

  const {
    count,
    error
  } = await sb
    .from(tableName)
    .select('*', {
      count: 'exact',
      head: true
    });

  if (error) {
    console.error(
      `Eroare count ${tableName}:`,
      error
    );

    return 0;
  }

  return count || 0;
}


/* ---------------------------------------------------------
   DASHBOARD
--------------------------------------------------------- */

async function renderDash() {

  const dash = el('dash');

  if (!dash) return;

  dash.innerHTML = `
    <div class="panel">
      Se încarcă panoul...
    </div>
  `;


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
          onclick="openTab('orders')"
        >
          🛒 Vezi comenzile
        </button>

      </div>

    </div>
  `;
}


/* ---------------------------------------------------------
   GENERIC TABLE / CRUD
--------------------------------------------------------- */

async function renderTable(tableName) {

  const container = el(tableName);

  if (!container) return;

  const config = tables[tableName];

  if (!config) return;


  container.innerHTML = `
    <div class="panel">
      Se încarcă ${aesc(config.label)}...
    </div>
  `;


  const {
    data,
    error
  } = await sb
    .from(tableName)
    .select('*')
    .order('created_at', {
      ascending: false
    });


  if (error) {

    console.error(
      `Eroare ${tableName}:`,
      error
    );

    container.innerHTML = `
      <div class="panel">

        <h2>
          Eroare
        </h2>

        <p>
          Nu pot încărca ${aesc(config.label)}.
        </p>

        <p>
          ${aesc(error.message)}
        </p>

      </div>
    `;

    return;
  }


  const rows = data || [];


  let html = `

    <div class="page-head">

      <div>
        <div class="eyebrow">
          KXTUNINGSHOP
        </div>

        <h1>
          ${aesc(config.label)}
        </h1>
      </div>

      <button
        class="btn primary"
        onclick="showEditForm('${tableName}')"
      >
        + Adaugă
      </button>

    </div>


    <div id="${tableName}FormBox"></div>


    <div class="panel">

      <div style="overflow-x:auto">

        <table class="admin-table">

          <thead>
            <tr>
  `;


  config.fields.forEach(field => {
    html += `
      <th>
        ${aesc(field)}
      </th>
    `;
  });


  html += `
            <th>
              Acțiuni
            </th>
          </tr>
        </thead>

        <tbody>
  `;


  if (!rows.length) {

    html += `
      <tr>
        <td
          colspan="${config.fields.length + 1}"
        >
          Nu există încă înregistrări.
        </td>
      </tr>
    `;

  } else {

    rows.forEach(row => {

      html += `
        <tr>
      `;


      config.fields.forEach(field => {

        let value = row[field];

        if (
          field === 'available' ||
          field === 'active'
        ) {

          value = value
            ? 'Da'
            : 'Nu';

        }

        html += `
          <td>
            ${aesc(value ?? '')}
          </td>
        `;
      });


      html += `

          <td>

            <button
              onclick="showEditForm(
                '${tableName}',
                '${aesc(row.id)}'
              )"
            >
              Editează
            </button>

            <button
              onclick="deleteRow(
                '${tableName}',
                '${aesc(row.id)}'
              )"
            >
              Șterge
            </button>

          </td>

        </tr>
      `;
    });
  }


  html += `
        </tbody>

      </table>

    </div>

  </div>
  `;


  container.innerHTML = html;
}


/* ---------------------------------------------------------
   EDIT FORM
--------------------------------------------------------- */

async function showEditForm(tableName, rowId = null) {

  const config = tables[tableName];

  if (!config) return;


  const box = el(`${tableName}FormBox`);

  if (!box) return;


  let row = {};


  if (rowId) {

    const {
      data,
      error
    } = await sb
      .from(tableName)
      .select('*')
      .eq('id', rowId)
      .single();


    if (error) {

      alert(
        'Nu pot încărca înregistrarea: ' +
        error.message
      );

      return;
    }

    row = data || {};
  }


  let html = `

    <div class="panel">

      <h2>
        ${rowId ? 'Editează' : 'Adaugă'}
        ${aesc(config.label)}
      </h2>

      <form id="${tableName}EditForm">

  `;


  config.fields.forEach(field => {

    const value = row[field];

    const isBoolean =
      field === 'available' ||
      field === 'active';

    if (isBoolean) {

      html += `
        <label>

          ${aesc(field)}

          <select name="${aesc(field)}">

            <option
              value="true"
              ${value === true ? 'selected' : ''}
            >
              Da
            </option>

            <option
              value="false"
              ${value === false ? 'selected' : ''}
            >
              Nu
            </option>

          </select>

        </label>
      `;

    } else if (
      field === 'description'
    ) {

      html += `
        <label>

          ${aesc(field)}

          <textarea
            name="${aesc(field)}"
          >${aesc(value ?? '')}</textarea>

        </label>
      `;

    } else {

      html += `
        <label>

          ${aesc(field)}

          <input
            name="${aesc(field)}"
            value="${aesc(value ?? '')}"
          >

        </label>
      `;
    }
  });


  html += `

        <div class="form-actions">

          <button
            class="btn primary"
            type="submit"
          >
            SALVEAZĂ
          </button>

          <button
            type="button"
            onclick="cancelEdit('${tableName}')"
          >
            Anulează
          </button>

        </div>

      </form>

    </div>

  `;


  box.innerHTML = html;


  el(`${tableName}EditForm`).onsubmit =
    async event => {

      event.preventDefault();

      const form =
        event.currentTarget;

      const payload = {};


      config.fields.forEach(field => {

        const input =
          form.elements[field];

        if (!input) return;

        if (
          field === 'available' ||
          field === 'active'
        ) {

          payload[field] =
            input.value === 'true';

        } else if (
          field === 'price' ||
          field === 'price_from'
        ) {

          payload[field] =
            input.value === ''
              ? null
              : Number(input.value);

        } else {

          payload[field] =
            input.value.trim();
        }
      });


      let result;


      if (rowId) {

        result = await sb
          .from(tableName)
          .update(payload)
          .eq('id', rowId);

      } else {

        result = await sb
          .from(tableName)
          .insert(payload);
      }


      if (result.error) {

        alert(
          'Eroare la salvare:\n\n' +
          result.error.message
        );

        console.error(
          result.error
        );

        return;
      }


      alert(
        'Salvat cu succes.'
      );


      renderTable(tableName);
    };
}


function cancelEdit(tableName) {

  const box =
    el(`${tableName}FormBox`);

  if (box) {
    box.innerHTML = '';
  }
}


/* ---------------------------------------------------------
   DELETE
--------------------------------------------------------- */

async function deleteRow(
  tableName,
  rowId
) {

  const ok =
    confirm(
      'Sigur vrei să ștergi această înregistrare?'
    );

  if (!ok) return;


  const {
    error
  } = await sb
    .from(tableName)
    .delete()
    .eq('id', rowId);


  if (error) {

    alert(
      'Eroare la ștergere:\n\n' +
      error.message
    );

    console.error(error);

    return;
  }


  renderTable(tableName);
}


/* ---------------------------------------------------------
   QUOTE REQUESTS
--------------------------------------------------------- */

async function renderQuotes() {

  const container =
    el('quotes');

  if (!container) return;


  container.innerHTML = `
    <div class="panel">
      Se încarcă cererile...
    </div>
  `;


  const {
    data,
    error
  } = await sb
    .from('quote_requests')
    .select('*')
    .order('created_at', {
      ascending: false
    });


  if (error) {

    console.error(
      'Eroare cereri:',
      error
    );

    container.innerHTML = `
      <div class="panel">

        <h2>Eroare</h2>

        <p>
          ${aesc(error.message)}
        </p>

      </div>
    `;

    return;
  }


  const rows = data || [];


  let html = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          KXTUNINGSHOP
        </div>

        <h1>
          Cereri ofertă
        </h1>

      </div>

    </div>

    <div class="panel">

      <div style="overflow-x:auto">

        <table class="admin-table">

          <thead>
            <tr>

              <th>
                Data
              </th>

              <th>
                Nume
              </th>

              <th>
                Telefon
              </th>

              <th>
                Mașină
              </th>

              <th>
                Serviciu
              </th>

              <th>
                Detalii
              </th>

            </tr>
          </thead>

          <tbody>
  `;


  if (!rows.length) {

    html += `
      <tr>
        <td colspan="6">
          Nu există cereri.
        </td>
      </tr>
    `;

  } else {

    rows.forEach(row => {

      html += `

        <tr>

          <td>
            ${aesc(formatDate(row.created_at))}
          </td>

          <td>
            ${aesc(row.nume || row.name || '')}
          </td>

          <td>
            ${aesc(row.telefon || row.phone || '')}
          </td>

          <td>
            ${aesc(
              [
                row.marca,
                row.model,
                row.an
              ]
                .filter(Boolean)
                .join(' ')
            )}
          </td>

          <td>
            ${aesc(row.serviciu || '')}
          </td>

          <td>
            ${aesc(row.detalii || '')}
          </td>

        </tr>

      `;
    });
  }


  html += `

          </tbody>

        </table>

      </div>

    </div>
  `;


  container.innerHTML = html;


  const badge =
    el('badge');

  if (badge) {
    badge.textContent =
      rows.length;
  }
}


/* =========================================================
   COMENZI
   ========================================================= */

/*
   IMPORTANT:

   Comenzile sunt citite DIRECT din:

   public.orders
   public.order_items

   Nu depind de products sau de cart.
*/


async function renderOrders() {

  const container =
    el('orders');

  if (!container) return;


  container.innerHTML = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          KXTUNINGSHOP
        </div>

        <h1>
          Comenzi
        </h1>

      </div>

      <button
        class="btn primary"
        onclick="renderOrders()"
      >
        ↻ Reîmprospătează
      </button>

    </div>

    <div class="panel">
      Se încarcă comenzile...
    </div>

  `;


  /*
     1. Luăm comenzile
  */

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


  /*
     Dacă orders dă eroare,
     o afișăm DIRECT în Admin.
  */

  if (ordersError) {

    console.error(
      'EROARE ORDERS:',
      ordersError
    );


    container.innerHTML = `

      <div class="page-head">

        <div>

          <div class="eyebrow">
            KXTUNINGSHOP
          </div>

          <h1>
            Comenzi
          </h1>

        </div>

        <button
          class="btn primary"
          onclick="renderOrders()"
        >
          ↻ Reîncearcă
        </button>

      </div>


      <div class="panel">

        <h2>
          Nu pot încărca comenzile
        </h2>

        <p>
          Supabase a returnat următoarea eroare:
        </p>

        <p>
          <strong>
            ${aesc(ordersError.message)}
          </strong>
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


  /*
     2. Luăm produsele din order_items.

     Chiar dacă order_items are o problemă,
     comenzile tot vor fi afișate.
  */

  const orderIds =
    orderList.map(order => order.id);


  let items = [];
  let itemsError = null;


  if (orderIds.length) {

    const result =
      await sb
        .from('order_items')
        .select(`
          id,
          order_id,
          product_name,
          quantity,
          price
        `)
        .in('order_id', orderIds)
        .order('created_at', {
          ascending: true
        });


    items =
      result.data || [];

    itemsError =
      result.error || null;


    if (itemsError) {

      console.error(
        'EROARE ORDER_ITEMS:',
        itemsError
      );
    }
  }


  /*
     3. Grupăm produsele după order_id
  */

  const itemsByOrder = {};


  items.forEach(item => {

    if (!itemsByOrder[item.order_id]) {
      itemsByOrder[item.order_id] = [];
    }

    itemsByOrder[item.order_id].push(item);
  });


  /*
     4. Construim pagina
  */

  let html = `

    <div class="page-head">

      <div>

        <div class="eyebrow">
          KXTUNINGSHOP
        </div>

        <h1>
          Comenzi
        </h1>

        <p>
          ${orderList.length}
          ${orderList.length === 1
            ? 'comandă'
            : 'comenzi'}
        </p>

      </div>

      <button
        class="btn primary"
        onclick="renderOrders()"
      >
        ↻ Reîmprospătează
      </button>

    </div>
  `;


  /*
     Dacă order_items are eroare,
     afișăm avertisment, dar NU ascundem comenzile.
  */

  if (itemsError) {

    html += `

      <div class="panel">

        <strong>
          Atenție:
        </strong>

        comenzile sunt încărcate,
        dar produsele din comenzi nu pot fi citite.

        <br><br>

        ${aesc(itemsError.message)}

      </div>

    `;
  }


  /*
     Dacă nu există comenzi
  */

  if (!orderList.length) {

    html += `

      <div class="panel">

        <h2>
          Nu există comenzi
        </h2>

        <p>
          În acest moment nu există nicio comandă
          în tabela <strong>orders</strong>.
        </p>

      </div>

    `;

    container.innerHTML = html;

    return;
  }


  /*
     5. Afișăm fiecare comandă
  */

  orderList.forEach((order, index) => {

    const orderItems =
      itemsByOrder[order.id] || [];


    html += `

      <div class="panel order-card">

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

          <div>

            <strong>
              ${formatPrice(order.total)}
            </strong>

          </div>

        </div>


        <div class="order-info">

          <p>
            <strong>
              Data:
            </strong>

            ${aesc(
              formatDate(order.created_at)
            )}
          </p>


          <p>
            <strong>
              Telefon:
            </strong>

            ${aesc(
              order.customer_phone ||
              '-'
            )}
          </p>


          <p>
            <strong>
              Adresă:
            </strong>

            ${aesc(
              order.customer_address ||
              '-'
            )}
          </p>


          <p>
            <strong>
              Status:
            </strong>

            ${aesc(
              order.status ||
              'nouă'
            )}
          </p>

        </div>


        <h3>
          Produse
        </h3>

    `;


    if (!orderItems.length) {

      html += `

        <p>
          Nu există produse salvate pentru această comandă.
        </p>

      `;

    } else {

      html += `

        <div style="overflow-x:auto">

          <table class="admin-table">

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
                item.product_name ||
                '-'
              )}
            </td>

            <td>
              ${quantity}
            </td>

            <td>
              ${formatPrice(price)}
            </td>

            <td>
              ${formatPrice(subtotal)}
            </td>

          </tr>

        `;
      });


      html += `

            </tbody>

          </table>

        </div>

      `;
    }


    html += `

        <div class="cart-total">

          <span>
            Total comandă
          </span>

          <strong>
            ${formatPrice(order.total)}
          </strong>

        </div>

      </div>

    `;
  });


  container.innerHTML = html;
}


/* ---------------------------------------------------------
   TABS
--------------------------------------------------------- */

async function openTab(tabName) {

  current = tabName;


  document
    .querySelectorAll('.admin-content .tab')
    .forEach(tab => {
      tab.classList.add('hidden');
    });


  document
    .querySelectorAll('aside button[data-tab]')
    .forEach(button => {
      button.classList.remove('active');
    });


  const target =
    el(tabName);

  if (target) {
    target.classList.remove('hidden');
  }


  const activeButton =
    document.querySelector(
      `aside button[data-tab="${tabName}"]`
    );

  if (activeButton) {
    activeButton.classList.add('active');
  }


  if (tabName === 'dash') {

    await renderDash();

  } else if (tabName === 'quotes') {

    await renderQuotes();

  } else if (tabName === 'orders') {

    await renderOrders();

  } else if (tables[tabName]) {

    await renderTable(tabName);
  }
}


/* ---------------------------------------------------------
   TAB BUTTONS
--------------------------------------------------------- */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    /*
       Butoanele din sidebar
    */

    document
      .querySelectorAll(
        'aside button[data-tab]'
      )
      .forEach(button => {

        button.addEventListener(
          'click',
          () => {
            openTab(
              button.dataset.tab
            );
          }
        );

      });


    /*
       Logout
    */

    const logout =
      el('logout');

    if (logout) {

      logout.addEventListener(
        'click',
        async () => {

          await sb.auth.signOut();

          location.reload();

        }
      );
    }


    /*
       Verificăm autentificarea
    */

    const session =
      await requireUser();

    if (!session) {
      return;
    }


    /*
       Deschidem dashboard
    */

    await openTab('dash');

  }
);
```
