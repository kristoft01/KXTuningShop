const tables = {
  products: {
    label: 'Piese auto',
    fields: ['name', 'description', 'price', 'category', 'image_url', 'available']
  },
  services: {
    label: 'Servicii',
    fields: ['name', 'description', 'price_from', 'image_url', 'active']
  },
  projects: {
    label: 'Lucrări',
    fields: ['title', 'description', 'car_make', 'car_model', 'service', 'image_url']
  }
};

let current = 'dash';

function aesc(s) {
  if (s === undefined || s === null) return '';

  return String(s).replace(/[&<>'"]/g, function(c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c];
  });
}

async function requireUser() {
  const result = await sb.auth.getSession();
  const session = result.data.session;

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
      <img src="logo.jpg">

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

  document.getElementById('loginBtn').onclick = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const result = await sb.auth.signInWithPassword({
      email: email,
      password: password
    });

    document.getElementById('loginMsg').textContent =
      result.error ? result.error.message : '';

    if (!result.error) {
      location.reload();
    }
  };
}

async function count(table) {
  const result = await sb
    .from(table)
    .select('*', {
      count: 'exact',
      head: true
    });

  return result.count || 0;
}

async function renderDash() {
  const p = await count('products');
  const s = await count('services');
  const pr = await count('projects');
  const q = await count('quote_requests');
  const o = await count('orders');

  document.getElementById('dash').innerHTML = `
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
          + Adaugă lucrare
        </button>

        <button onclick="openTab('quotes')">
          Vezi cereri
        </button>

        <button onclick="openTab('orders')">
          🛒 Vezi comenzi
        </button>
      </div>
    </div>
  `;
}

async function renderTable(tab) {
  const cfg = tables[tab];

  const result = await sb
    .from(tab)
    .select('*')
    .order('created_at', {
      ascending: false
    });

  if (result.error) {
    document.getElementById(tab).innerHTML =
      '<p class="error">' +
      aesc(result.error.message) +
      '</p>';

    return;
  }

  const data = result.data || [];

  let rows = '';

  data.forEach(function(x) {
    rows += `
      <tr>
        <td>
          <b>${aesc(x.name || x.title)}</b>
        </td>

        <td>
          ${aesc(x.description || x.service || '')}
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
          <button onclick='editItem(${JSON.stringify(tab)}, ${JSON.stringify(x)})'>
            Editează
          </button>

          <button
            class="danger"
            onclick='deleteItem(${JSON.stringify(tab)}, ${JSON.stringify(x.id)})'>
            Șterge
          </button>
        </td>
      </tr>
    `;
  });

  if (!rows) {
    rows =
      '<tr>' +
      '<td colspan="4">Nu există elemente.</td>' +
      '</tr>';
  }

  document.getElementById(tab).innerHTML = `
    <div class="page-head">
      <div>
        <div class="eyebrow">ADMIN</div>
        <h1>${cfg.label}</h1>
      </div>

      <button
        class="btn primary"
        onclick='newItem("${tab}")'>
        + ADAUGĂ
      </button>
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
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

async function renderQuotes() {
  const result = await sb
    .from('quote_requests')
    .select('*')
    .order('created_at', {
      ascending: false
    });

  const data = result.data || [];

  let rows = '';

  data.forEach(function(x) {
    rows += `
      <tr>
        <td>
          <b>${aesc(x.name)}</b>
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
              ? new Date(x.created_at).toLocaleString('ro-RO')
              : ''
          }
        </td>
      </tr>
    `;
  });

  if (result.error) {
    rows =
      '<tr>' +
      '<td colspan="5">' +
      aesc(result.error.message) +
      '</td>' +
      '</tr>';
  }

  if (!rows) {
    rows =
      '<tr>' +
      '<td colspan="5">Nicio cerere.</td>' +
      '</tr>';
  }

  document.getElementById('quotes').innerHTML = `
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
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  const badge = document.getElementById('badge');

  if (badge) {
    badge.textContent = data.length;
  }
}

async function updateOrderStatus(id, status) {
  const result = await sb
    .from('orders')
    .update({
      status: status
    })
    .eq('id', id);

  if (result.error) {
    alert(
      'Nu s-a putut schimba statusul: ' +
      result.error.message
    );

    renderOrders();
    return;
  }

  renderOrders();
}

window.updateOrderStatus = updateOrderStatus;

async function deleteOrder(id) {
  const confirmDelete = confirm(
    'Sigur vrei să ștergi această comandă?'
  );

  if (!confirmDelete) {
    return;
  }

  const itemsResult = await sb
    .from('order_items')
    .delete()
    .eq('order_id', id);

  if (itemsResult.error) {
    alert(
      'Nu s-au putut șterge produsele comenzii: ' +
      itemsResult.error.message
    );
    return;
  }

  const orderResult = await sb
    .from('orders')
    .delete()
    .eq('id', id);

  if (orderResult.error) {
    alert(
      'Nu s-a putut șterge comanda: ' +
      orderResult.error.message
    );
    return;
  }

  await renderOrders();
  await renderDash();
}

window.deleteOrder = deleteOrder;

async function renderOrders() {
  const result = await sb
    .from('orders')
    .select('*')
    .order('created_at', {
      ascending: false
    });

  if (result.error) {
    document.getElementById('orders').innerHTML = `
      <div class="page-head">
        <div>
          <div class="eyebrow">ADMIN</div>
          <h1>Comenzi</h1>
        </div>
      </div>

      <div class="panel">
        <p class="error">
          ${aesc(result.error.message)}
        </p>
      </div>
    `;

    return;
  }

  const orders = result.data || [];

  let rows = '';

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];

    const itemResult = await sb
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', {
        ascending: true
      });

    let products = '';

    if (itemResult.error) {
      products = 'Eroare la produsele comenzii';
    } else if (
      itemResult.data &&
      itemResult.data.length
    ) {
      itemResult.data.forEach(function(item) {
        products +=
          aesc(item.product_name) +
          ' × ' +
          aesc(item.quantity) +
          ' — ' +
          aesc(item.price) +
          ' lei<br>';
      });
    } else {
      products = 'Fără produse';
    }

    const status = order.status || 'noua';

    rows += `
      <tr>
        <td>
          <b>
            ${aesc(order.customer_name || 'Client')}
          </b>

          <br>

          ${aesc(order.customer_phone || '')}
        </td>

        <td>
          ${aesc(order.customer_address || '')}
        </td>

        <td>
          ${products}
        </td>

        <td>
          <b>
            ${aesc(order.total || 0)} lei
          </b>
        </td>

        <td>
          <select onchange="updateOrderStatus('${aesc(order.id)}', this.value)">
            <option
              value="noua"
              ${status === 'noua' || status === 'nou' ? 'selected' : ''}>
              🆕 Nouă
            </option>

            <option
              value="procesare"
              ${status === 'procesare' ? 'selected' : ''}>
              🔧 În procesare
            </option>

            <option
              value="finalizata"
              ${status === 'finalizata' ? 'selected' : ''}>
              ✅ Finalizată
            </option>

            <option
              value="anulata"
              ${status === 'anulata' ? 'selected' : ''}>
              ❌ Anulată
            </option>
          </select>
        </td>

        <td>
          ${
            order.created_at
              ? new Date(order.created_at).toLocaleString('ro-RO')
              : ''
          }
        </td>

        <td>
          <button
            class="danger"
            onclick="deleteOrder('${aesc(order.id)}')">
            🗑️ Șterge
          </button>
        </td>
      </tr>
    `;
  }

  if (!rows) {
    rows =
      '<tr>' +
      '<td colspan="7">Nu există comenzi.</td>' +
      '</tr>';
  }

  document.getElementById('orders').innerHTML = `
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
            <th>Acțiuni</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

function modal(html) {
  const d = document.createElement('div');

  d.className = 'modal-wrap';

  d.innerHTML =
    '<div class="modal">' +
    '<button class="x" onclick="this.closest(\'.modal-wrap\').remove()">×</button>' +
    html +
    '</div>';

  document.body.appendChild(d);
}

window.newItem = function(tab) {
  const c = tables[tab];

  let fields = '';

  c.fields.forEach(function(f) {
    const checkbox =
      f === 'available' || f === 'active';

    fields += `
      <label>
        ${f}

        <input
          name="${f}"
          ${
            checkbox
              ? 'type="checkbox" checked'
              : ''
          }>
      </label>
    `;
  });

  modal(`
    <h2>Adaugă ${c.label}</h2>

    <form id="itemForm">
      ${fields}

      <button class="btn primary">
        SALVEAZĂ
      </button>
    </form>
  `);

  document.getElementById('itemForm').onsubmit =
    async function(e) {
      e.preventDefault();

      const form = document.getElementById('itemForm');
      const o = {};

      c.fields.forEach(function(f) {
        const el = form.elements[f];

        if (el.type === 'checkbox') {
          o[f] = el.checked;
        } else {
          o[f] = el.value || null;
        }

        if (
          (f === 'price' || f === 'price_from') &&
          o[f]
        ) {
          o[f] = Number(o[f]);
        }
      });

      const result = await sb
        .from(tab)
        .insert(o);

      if (result.error) {
        alert(result.error.message);
        return;
      }

      document
        .querySelector('.modal-wrap')
        .remove();

      renderTable(tab);
    };
};

window.editItem = function(tab, x) {
  const c = tables[tab];

  let fields = '';

  c.fields.forEach(function(f) {
    const checkbox =
      f === 'available' || f === 'active';

    fields += `
      <label>
        ${f}

        <input
          name="${f}"
          ${
            checkbox
              ? 'type="checkbox"'
              : ''
          }

          ${
            checkbox
              ? (x[f] ? 'checked' : '')
              : 'value="' + aesc(x[f] || '') + '"'
          }>
      </label>
    `;
  });

  modal(`
    <h2>Editează ${c.label}</h2>

    <form id="itemForm">
      ${fields}

      <button class="btn primary">
        SALVEAZĂ
      </button>
    </form>
  `);

  document.getElementById('itemForm').onsubmit =
    async function(e) {
      e.preventDefault();

      const form = document.getElementById('itemForm');
      const o = {};

      c.fields.forEach(function(f) {
        const el = form.elements[f];

        if (el.type === 'checkbox') {
          o[f] = el.checked;
        } else {
          o[f] = el.value || null;
        }

        if (
          (f === 'price' || f === 'price_from') &&
          o[f]
        ) {
          o[f] = Number(o[f]);
        }
      });

      const result = await sb
        .from(tab)
        .update(o)
        .eq('id', x.id);

      if (result.error) {
        alert(result.error.message);
        return;
      }

      document
        .querySelector('.modal-wrap')
        .remove();

      renderTable(tab);
    };
};

window.deleteItem = async function(tab, id) {
  if (!confirm('Sigur vrei să ștergi?')) {
    return;
  }

  const result = await sb
    .from(tab)
    .delete()
    .eq('id', id);

  if (result.error) {
    alert(result.error.message);
    return;
  }

  renderTable(tab);
};

window.openTab = async function(tab) {
  current = tab;

  document
    .querySelectorAll('.tab')
    .forEach(function(x) {
      x.classList.add('hidden');
    });

  document
    .getElementById(tab)
    .classList.remove('hidden');

  document
    .querySelectorAll('aside button[data-tab]')
    .forEach(function(x) {
      x.classList.toggle(
        'active',
        x.dataset.tab === tab
      );
    });

  if (tab === 'dash') {
    renderDash();
  } else if (tab === 'quotes') {
    renderQuotes();
  } else if (tab === 'orders') {
    renderOrders();
  } else {
    renderTable(tab);
  }
};

document.addEventListener(
  'DOMContentLoaded',
  async function() {
    const u = await requireUser();

    if (!u) {
      return;
    }

    document
      .querySelectorAll('aside button[data-tab]')
      .forEach(function(b) {
        b.onclick = function() {
          openTab(b.dataset.tab);
        };
      });

    document.getElementById('logout').onclick =
      async function() {
        await sb.auth.signOut();
        location.reload();
      };

    openTab('dash');
  }
);
