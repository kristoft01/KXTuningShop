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


const IMAGE_BUCKET = 'imagini produse';

let current = 'dash';


/* ========================================================
   ESCAPE HTML
======================================================== */

function aesc(s) {
  if (
    s === undefined ||
    s === null
  ) {
    return '';
  }

  return String(s).replace(
    /[&<>'"]/g,
    function(c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[c];
    }
  );
}


/* ========================================================
   VERIFICARE LOGIN
======================================================== */

async function requireUser() {
  const result =
    await sb.auth.getSession();

  const session =
    result.data.session;

  if (!session) {
    showLogin();
    return null;
  }

  const adminUser =
    document.getElementById(
      'adminUser'
    );

  if (adminUser) {
    adminUser.textContent =
      session.user.email ||
      'Administrator';
  }

  return session;
}


/* ========================================================
   LOGIN
======================================================== */

function showLogin() {
  document.body.innerHTML = `
    <div class="login">

      <img src="logo.jpg">

      <div class="login-box">

        <h1>
          ADMIN KXTUNINGSHOP
        </h1>

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

  document
    .getElementById('loginBtn')
    .onclick =
    async function() {

      const email =
        document
          .getElementById('email')
          .value;

      const password =
        document
          .getElementById('password')
          .value;

      const result =
        await sb.auth
          .signInWithPassword({
            email: email,
            password: password
          });

      document
        .getElementById('loginMsg')
        .textContent =
        result.error
          ? result.error.message
          : '';

      if (!result.error) {
        location.reload();
      }
    };
}


/* ========================================================
   COUNT
======================================================== */

async function count(table) {
  const result =
    await sb
      .from(table)
      .select('*', {
        count: 'exact',
        head: true
      });

  return result.count || 0;
}


/* ========================================================
   UPLOAD IMAGINE PRODUS
======================================================== */

async function uploadProductImage(file) {
  if (!file) {
    return null;
  }

  const extension =
    file.name &&
    file.name.indexOf('.') !== -1
      ? file.name
          .split('.')
          .pop()
          .toLowerCase()
      : 'jpg';

  const safeExtension =
    extension.replace(
      /[^a-z0-9]/g,
      ''
    ) || 'jpg';

  const fileName =
    'products/' +
    Date.now() +
    '-' +
    Math.random()
      .toString(36)
      .substring(2, 10) +
    '.' +
    safeExtension;

  const uploadResult =
    await sb.storage
      .from(IMAGE_BUCKET)
      .upload(
        fileName,
        file,
        {
          cacheControl: '3600',
          upsert: false
        }
      );

  if (uploadResult.error) {
    throw uploadResult.error;
  }

  const publicResult =
    sb.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(fileName);

  if (
    !publicResult ||
    !publicResult.data ||
    !publicResult.data.publicUrl
  ) {
    throw new Error(
      'Nu s-a putut obține adresa imaginii.'
    );
  }

  return publicResult.data.publicUrl;
}


/* ========================================================
   DASHBOARD
======================================================== */

async function renderDash() {
  const p =
    await count('products');

  const s =
    await count('services');

  const pr =
    await count('projects');

  const q =
    await count('quote_requests');

  const o =
    await count('orders');

  document
    .getElementById('dash')
    .innerHTML = `

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


/* ========================================================
   TABEL PRODUSE / SERVICII / LUCRĂRI
======================================================== */

async function renderTable(tab) {
  const cfg =
    tables[tab];

  const result =
    await sb
      .from(tab)
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  if (result.error) {
    document
      .getElementById(tab)
      .innerHTML =
      '<p class="error">' +
      aesc(result.error.message) +
      '</p>';

    return;
  }

  const data =
    result.data || [];

  let rows = '';


  data.forEach(
    function(x) {

      const itemName =
        x.name ||
        x.title ||
        'Fără nume';


      let priceText = '';

      if (x.price != null) {

        priceText =
          aesc(x.price) +
          ' lei';

      } else if (
        x.price_from != null
      ) {

        priceText =
          'de ' +
          aesc(x.price_from) +
          ' lei';

      } else if (
        tab === 'products'
      ) {

        priceText =
          'Cere preț';

      }


      /* ==================================================
         PRODUSE
         FĂRĂ DESCRIERE ÎN TABEL
      ================================================== */

      if (tab === 'products') {

        rows += `

          <tr>

            <td
              style="
                width:40%;
                vertical-align:middle;
              "
            >

              <div
                style="
                  display:flex;
                  align-items:center;
                  gap:12px;
                "
              >

                ${
                  x.image_url
                    ? `
                      <img
                        src="${aesc(x.image_url)}"
                        alt="${aesc(itemName)}"
                        style="
                          width:65px;
                          height:65px;
                          flex:0 0 65px;
                          object-fit:contain;
                          border-radius:8px;
                          background:#fff;
                        "
                      >
                    `
                    : `
                      <div
                        style="
                          width:65px;
                          height:65px;
                          flex:0 0 65px;
                          border-radius:8px;
                          display:flex;
                          align-items:center;
                          justify-content:center;
                          background:rgba(255,255,255,.05);
                          font-size:11px;
                          text-align:center;
                        "
                      >
                        Fără imagine
                      </div>
                    `
                }


                <div>

                  <b>
                    ${aesc(itemName)}
                  </b>

                </div>

              </div>

            </td>


            <td
              style="
                width:20%;
                vertical-align:middle;
              "
            >
              ${aesc(
                x.category ||
                'Fără categorie'
              )}
            </td>


            <td
              style="
                width:15%;
                vertical-align:middle;
                white-space:nowrap;
              "
            >

              <b>
                ${priceText}
              </b>

            </td>


            <td
              style="
                width:25%;
                vertical-align:middle;
                white-space:nowrap;
              "
            >

              <button
                type="button"
                class="btn primary"
                style="
                  display:inline-block;
                  margin:3px;
                  padding:9px 12px;
                "
                onclick='editItem(
                  ${JSON.stringify(tab)},
                  ${JSON.stringify(x)}
                )'
              >
                ✏️ EDITEAZĂ
              </button>


              <button
                type="button"
                class="danger"
                style="
                  display:inline-block;
                  margin:3px;
                  padding:9px 12px;
                "
                onclick='deleteItem(
                  ${JSON.stringify(tab)},
                  ${JSON.stringify(x.id)}
                )'
              >
                🗑️ ȘTERGE
              </button>

            </td>

          </tr>

        `;

        return;
      }


      /* ==================================================
         SERVICII / LUCRĂRI
      ================================================== */

      rows += `

        <tr>

          <td>
            <b>
              ${aesc(itemName)}
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
            <b>
              ${priceText}
            </b>
          </td>


          <td
            style="
              white-space:nowrap;
            "
          >

            <button
              type="button"
              class="btn primary"
              style="
                display:inline-block;
                margin:3px;
                padding:9px 12px;
              "
              onclick='editItem(
                ${JSON.stringify(tab)},
                ${JSON.stringify(x)}
              )'
            >
              ✏️ EDITEAZĂ
            </button>


            <button
              type="button"
              class="danger"
              style="
                display:inline-block;
                margin:3px;
                padding:9px 12px;
              "
              onclick='deleteItem(
                ${JSON.stringify(tab)},
                ${JSON.stringify(x.id)}
              )'
            >
              🗑️ ȘTERGE
            </button>

          </td>

        </tr>

      `;
    }
  );


  if (!rows) {

    rows = `
      <tr>
        <td colspan="4">
          Nu există elemente.
        </td>
      </tr>
    `;

  }


  const tableHead =
    tab === 'products'
      ? `
        <tr>
          <th>Produs</th>
          <th>Categorie</th>
          <th>Preț</th>
          <th>Acțiuni</th>
        </tr>
      `
      : `
        <tr>
          <th>Nume</th>
          <th>Descriere</th>
          <th>Preț</th>
          <th>Acțiuni</th>
        </tr>
      `;


  document
    .getElementById(tab)
    .innerHTML = `

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


      <div
        class="panel"
        style="
          overflow-x:auto;
          -webkit-overflow-scrolling:touch;
        "
      >

        <table
          style="
            width:100%;
            table-layout:auto;
          "
        >

          <thead>
            ${tableHead}
          </thead>

          <tbody>
            ${rows}
          </tbody>

        </table>

      </div>
  `;
}


/* ========================================================
   CERERI OFERTĂ
======================================================== */

async function renderQuotes() {
  const result =
    await sb
      .from('quote_requests')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );

  const data =
    result.data || [];

  let rows = '';


  data.forEach(
    function(x) {

      rows += `

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
            <a
              href="tel:${aesc(x.phone)}"
            >
              ${aesc(x.phone)}
            </a>
          </td>

          <td>
            ${
              x.created_at
                ? new Date(
                    x.created_at
                  ).toLocaleString(
                    'ro-RO'
                  )
                : ''
            }
          </td>

        </tr>

      `;
    }
  );


  if (result.error) {

    rows = `
      <tr>
        <td colspan="5">
          ${aesc(
            result.error.message
          )}
        </td>
      </tr>
    `;

  }


  if (!rows) {

    rows = `
      <tr>
        <td colspan="5">
          Nicio cerere.
        </td>
      </tr>
    `;

  }


  document
    .getElementById('quotes')
    .innerHTML = `

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


      <div
        class="panel"
        style="overflow-x:auto;"
      >

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


  const badge =
    document.getElementById(
      'badge'
    );

  if (badge) {

    badge.textContent =
      data.length;

  }
}


/* ========================================================
   STATUS COMANDĂ
======================================================== */

async function updateOrderStatus(
  id,
  status
) {

  const result =
    await sb
      .from('orders')
      .update({
        status: status
      })
      .eq(
        'id',
        id
      );


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


window.updateOrderStatus =
  updateOrderStatus;


/* ========================================================
   ȘTERGE COMANDĂ
======================================================== */

async function deleteOrder(id) {

  const confirmDelete =
    confirm(
      'Sigur vrei să ștergi această comandă?'
    );


  if (!confirmDelete) {
    return;
  }


  const itemsResult =
    await sb
      .from('order_items')
      .delete()
      .eq(
        'order_id',
        id
      );


  if (itemsResult.error) {

    alert(
      'Nu s-au putut șterge produsele comenzii: ' +
      itemsResult.error.message
    );

    return;
  }


  const orderResult =
    await sb
      .from('orders')
      .delete()
      .eq(
        'id',
        id
      );


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


window.deleteOrder =
  deleteOrder;


/* ========================================================
   COMENZI
======================================================== */

async function renderOrders() {

  const result =
    await sb
      .from('orders')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  if (result.error) {

    document
      .getElementById('orders')
      .innerHTML = `

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

          <p class="error">
            ${aesc(
              result.error.message
            )}
          </p>

        </div>
    `;

    return;
  }


  const orders =
    result.data || [];


  let rows = '';


  for (
    let i = 0;
    i < orders.length;
    i++
  ) {

    const order =
      orders[i];


    const itemResult =
      await sb
        .from('order_items')
        .select('*')
        .eq(
          'order_id',
          order.id
        )
        .order(
          'created_at',
          {
            ascending: true
          }
        );


    let products = '';


    if (itemResult.error) {

      products =
        'Eroare la produsele comenzii';

    } else if (
      itemResult.data &&
      itemResult.data.length
    ) {

      itemResult.data.forEach(
        function(item) {

          products +=
            aesc(
              item.product_name
            ) +
            ' × ' +
            aesc(
              item.quantity
            ) +
            ' — ' +
            aesc(
              item.price
            ) +
            ' lei<br>';

        }
      );

    } else {

      products =
        'Fără produse';

    }


    const status =
      order.status ||
      'noua';


    rows += `

      <tr>

        <td>

          <b>
            ${aesc(
              order.customer_name ||
              'Client'
            )}
          </b>

          <br>

          ${aesc(
            order.customer_phone ||
            ''
          )}

        </td>


        <td>
          ${aesc(
            order.customer_address ||
            ''
          )}
        </td>


        <td>
          ${products}
        </td>


        <td>

          <b>
            ${aesc(
              order.total || 0
            )} lei
          </b>

        </td>


        <td>

          <select
            onchange="
              updateOrderStatus(
                '${aesc(order.id)}',
                this.value
              )
            "
          >

            <option
              value="noua"
              ${
                status === 'noua' ||
                status === 'nou'
                  ? 'selected'
                  : ''
              }
            >
              🆕 Nouă
            </option>


            <option
              value="procesare"
              ${
                status === 'procesare'
                  ? 'selected'
                  : ''
              }
            >
              🔧 În procesare
            </option>


            <option
              value="finalizata"
              ${
                status === 'finalizata'
                  ? 'selected'
                  : ''
              }
            >
              ✅ Finalizată
            </option>


            <option
              value="anulata"
              ${
                status === 'anulata'
                  ? 'selected'
                  : ''
              }
            >
              ❌ Anulată
            </option>

          </select>

        </td>


        <td>

          ${
            order.created_at
              ? new Date(
                  order.created_at
                ).toLocaleString(
                  'ro-RO'
                )
              : ''
          }

        </td>


        <td>

          <button
            class="danger"
            onclick="
              deleteOrder(
                '${aesc(order.id)}'
              )
            "
          >
            🗑️ Șterge
          </button>

        </td>

      </tr>

    `;
  }


  if (!rows) {

    rows = `
      <tr>
        <td colspan="7">
          Nu există comenzi.
        </td>
      </tr>
    `;

  }


  document
    .getElementById('orders')
    .innerHTML = `

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


      <div
        class="panel"
        style="overflow-x:auto;"
      >

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


/* ========================================================
   MODAL ADMIN
======================================================== */

function modal(html) {

  const d =
    document.createElement(
      'div'
    );


  d.className =
    'modal-wrap';


  d.innerHTML =
    '<div class="modal">' +
    '<button class="x" onclick="this.closest(\'.modal-wrap\').remove()">×</button>' +
    html +
    '</div>';


  document.body.appendChild(d);
} 
/* ========================================================
   CÂMPURI FORMULAR
======================================================== */

function createFieldHtml(
  tab,
  field,
  value,
  editing
) {

  const checkbox =
    field === 'available' ||
    field === 'active';


  if (checkbox) {

    const checked =
      editing
        ? (
            value
              ? 'checked'
              : ''
          )
        : 'checked';


    const label =
      field === 'available'
        ? 'Produs disponibil'
        : 'Activ';


    return `

      <label
        style="
          display:flex;
          gap:10px;
          align-items:center;
          margin-top:15px;
          margin-bottom:15px;
        "
      >

        <input
          name="${field}"
          type="checkbox"
          ${checked}
          style="
            width:auto;
            margin:0;
          "
        >

        <span>
          ${label}
        </span>

      </label>

    `;
  }


  /* ======================================================
     IMAGINE PRODUS
  ====================================================== */

  if (
    tab === 'products' &&
    field === 'image_url'
  ) {

    let preview = '';


    if (
      editing &&
      value
    ) {

      preview = `

        <div
          style="
            margin-top:12px;
            margin-bottom:12px;
          "
        >

          <div
            style="
              font-size:12px;
              opacity:.7;
              margin-bottom:6px;
            "
          >
            Imagine actuală:
          </div>


          <img
            src="${aesc(value)}"
            alt="Imagine produs"
            style="
              width:180px;
              max-width:100%;
              height:180px;
              object-fit:contain;
              border-radius:8px;
              background:#fff;
            "
          >

        </div>

      `;
    }


    return `

      <label>

        Imagine produs

        <input
          name="product_image"
          type="file"
          accept="image/*"
        >

      </label>


      ${
        editing
          ? `
            <small
              style="
                display:block;
                margin-top:5px;
                opacity:.7;
              "
            >
              Dacă nu alegi altă imagine,
              rămâne imaginea actuală.
            </small>
          `
          : `
            <small
              style="
                display:block;
                margin-top:5px;
                opacity:.7;
              "
            >
              Poți alege imaginea produsului
              din calculator sau telefon.
            </small>
          `
      }


      ${preview}


      <label>

        URL imagine

        <input
          name="image_url"
          type="text"
          value="${aesc(value || '')}"
          placeholder="https://..."
        >

      </label>

    `;
  }


  /* ======================================================
     DESCRIERE
  ====================================================== */

  if (field === 'description') {

    return `

      <label>

        Descriere

        <textarea
          name="${field}"
          rows="8"
          style="
            width:100%;
            resize:vertical;
          "
        >${aesc(value || '')}</textarea>

      </label>

    `;
  }


  /* ======================================================
     PREȚ
  ====================================================== */

  if (
    field === 'price' ||
    field === 'price_from'
  ) {

    return `

      <label>

        ${
          field === 'price'
            ? 'Preț'
            : 'Preț de la'
        }

        <input
          name="${field}"
          type="number"
          step="0.01"
          min="0"
          value="${aesc(
            value != null
              ? value
              : ''
          )}"
          placeholder="Lasă gol pentru Cere preț"
        >

      </label>

    `;
  }


  /* ======================================================
     CATEGORIE PRODUS
  ====================================================== */

  if (
    tab === 'products' &&
    field === 'category'
  ) {

    return `

      <label>

        Categorie

        <input
          name="category"
          type="text"
          value="${aesc(value || '')}"
          placeholder="Ex: LED-uri auto"
        >

      </label>

    `;
  }


  /* ======================================================
     NUME PRODUS
  ====================================================== */

  if (
    tab === 'products' &&
    field === 'name'
  ) {

    return `

      <label>

        Nume produs

        <input
          name="name"
          type="text"
          value="${aesc(value || '')}"
          required
        >

      </label>

    `;
  }


  /* ======================================================
     RESTUL CÂMPURILOR
  ====================================================== */

  return `

    <label>

      ${field}

      <input
        name="${field}"
        value="${aesc(value || '')}"
      >

    </label>

  `;
}


/* ========================================================
   ADAUGĂ ELEMENT
======================================================== */

window.newItem =
  function(tab) {

    const c =
      tables[tab];


    if (!c) {
      return;
    }


    let fields = '';


    c.fields.forEach(
      function(f) {

        fields +=
          createFieldHtml(
            tab,
            f,
            '',
            false
          );

      }
    );


    modal(`

      <h2>
        Adaugă ${c.label}
      </h2>


      <form id="itemForm">

        ${fields}


        <button
          class="btn primary"
          type="submit"
          style="
            width:100%;
            margin-top:20px;
          "
        >
          SALVEAZĂ
        </button>

      </form>

    `);


    document
      .getElementById(
        'itemForm'
      )
      .onsubmit =
      async function(e) {

        e.preventDefault();


        const form =
          document.getElementById(
            'itemForm'
          );


        const saveButton =
          form.querySelector(
            'button[type="submit"]'
          );


        saveButton.disabled =
          true;


        saveButton.textContent =
          'SE SALVEAZĂ...';


        try {

          let uploadedImageUrl =
            null;


          /* ===============================================
             UPLOAD IMAGINE PRODUS
          =============================================== */

          if (
            tab === 'products'
          ) {

            const fileInput =
              form.elements[
                'product_image'
              ];


            if (
              fileInput &&
              fileInput.files &&
              fileInput.files.length
            ) {

              saveButton.textContent =
                'SE ÎNCARCĂ IMAGINEA...';


              uploadedImageUrl =
                await uploadProductImage(
                  fileInput.files[0]
                );

            }
          }


          /* ===============================================
             DATE FORMULAR
          =============================================== */

          const o = {};


          c.fields.forEach(
            function(f) {

              const el =
                form.elements[f];


              if (!el) {
                return;
              }


              if (
                el.type ===
                'checkbox'
              ) {

                o[f] =
                  el.checked;

              } else {

                const rawValue =
                  el.value.trim();


                o[f] =
                  rawValue === ''
                    ? null
                    : rawValue;

              }


              if (
                (
                  f === 'price' ||
                  f === 'price_from'
                ) &&
                o[f] != null
              ) {

                o[f] =
                  Number(o[f]);

              }

            }
          );


          /* ===============================================
             IMAGINE NOUĂ
          =============================================== */

          if (
            tab === 'products' &&
            uploadedImageUrl
          ) {

            o.image_url =
              uploadedImageUrl;

          }


          saveButton.textContent =
            'SE SALVEAZĂ...';


          /* ===============================================
             INSERT SUPABASE
          =============================================== */

          const result =
            await sb
              .from(tab)
              .insert(o);


          if (result.error) {

            alert(
              'Eroare: ' +
              result.error.message
            );

            return;
          }


          const modalWrap =
            document.querySelector(
              '.modal-wrap'
            );


          if (modalWrap) {
            modalWrap.remove();
          }


          await renderTable(tab);

          await renderDash();


        } catch (error) {

          console.error(
            error
          );


          alert(
            'Nu s-a putut salva: ' +
            (
              error.message ||
              error
            )
          );


        } finally {

          if (
            document.body.contains(
              saveButton
            )
          ) {

            saveButton.disabled =
              false;

            saveButton.textContent =
              'SALVEAZĂ';

          }
        }
      };
  };


/* ========================================================
   EDITEAZĂ ELEMENT
======================================================== */

window.editItem =
  function(tab, x) {

    const c =
      tables[tab];


    if (
      !c ||
      !x
    ) {
      return;
    }


    let fields = '';


    c.fields.forEach(
      function(f) {

        fields +=
          createFieldHtml(
            tab,
            f,
            x[f],
            true
          );

      }
    );


    modal(`

      <div
        style="
          margin-bottom:20px;
        "
      >

        <div
          style="
            font-size:12px;
            opacity:.7;
            margin-bottom:5px;
          "
        >
          EDITARE
        </div>


        <h2
          style="
            margin:0;
          "
        >

          ${
            tab === 'products'
              ? '✏️ Editează produsul'
              : 'Editează ' + c.label
          }

        </h2>

      </div>


      <form id="itemForm">

        ${fields}


        <button
          class="btn primary"
          type="submit"
          style="
            width:100%;
            margin-top:20px;
            padding:14px;
            font-weight:700;
          "
        >
          💾 SALVEAZĂ MODIFICĂRILE
        </button>

      </form>

    `);


    document
      .getElementById(
        'itemForm'
      )
      .onsubmit =
      async function(e) {

        e.preventDefault();


        const form =
          document.getElementById(
            'itemForm'
          );


        const saveButton =
          form.querySelector(
            'button[type="submit"]'
          );


        saveButton.disabled =
          true;


        saveButton.textContent =
          'SE SALVEAZĂ...';


        try {

          let uploadedImageUrl =
            null;


          /* ===============================================
             IMAGINE NOUĂ
          =============================================== */

          if (
            tab === 'products'
          ) {

            const fileInput =
              form.elements[
                'product_image'
              ];


            if (
              fileInput &&
              fileInput.files &&
              fileInput.files.length
            ) {

              saveButton.textContent =
                'SE ÎNCARCĂ IMAGINEA...';


              uploadedImageUrl =
                await uploadProductImage(
                  fileInput.files[0]
                );

            }
          }


          /* ===============================================
             CITIM CÂMPURILE
          =============================================== */

          const o = {};


          c.fields.forEach(
            function(f) {

              const el =
                form.elements[f];


              if (!el) {
                return;
              }


              if (
                el.type ===
                'checkbox'
              ) {

                o[f] =
                  el.checked;

              } else {

                const rawValue =
                  el.value.trim();


                o[f] =
                  rawValue === ''
                    ? null
                    : rawValue;

              }


              /* ===========================================
                 PREȚ
              =========================================== */

              if (
                (
                  f === 'price' ||
                  f === 'price_from'
                ) &&
                o[f] != null
              ) {

                o[f] =
                  Number(o[f]);

              }

            }
          );


          /* ===============================================
             PĂSTRĂM / SCHIMBĂM IMAGINEA
          =============================================== */

          if (
            tab === 'products' &&
            uploadedImageUrl
          ) {

            o.image_url =
              uploadedImageUrl;

          }


          saveButton.textContent =
            'SE SALVEAZĂ...';


          /* ===============================================
             UPDATE SUPABASE
          =============================================== */

          const result =
            await sb
              .from(tab)
              .update(o)
              .eq(
                'id',
                x.id
              );


          if (result.error) {

            console.error(
              'Eroare editare:',
              result.error
            );


            alert(
              'Nu s-a putut salva: ' +
              result.error.message
            );

            return;
          }


          /* ===============================================
             ÎNCHIDEM FEREASTRA
          =============================================== */

          const modalWrap =
            document.querySelector(
              '.modal-wrap'
            );


          if (modalWrap) {
            modalWrap.remove();
          }


          /* ===============================================
             ACTUALIZĂM ADMINUL
          =============================================== */

          await renderTable(tab);

          await renderDash();


        } catch (error) {

          console.error(
            'Eroare editare:',
            error
          );


          alert(
            'Nu s-a putut salva modificarea: ' +
            (
              error.message ||
              error
            )
          );


        } finally {

          if (
            document.body.contains(
              saveButton
            )
          ) {

            saveButton.disabled =
              false;


            saveButton.textContent =
              '💾 SALVEAZĂ MODIFICĂRILE';

          }
        }
      };
  };


/* ========================================================
   ȘTERGE ELEMENT
======================================================== */

window.deleteItem =
  async function(
    tab,
    id
  ) {

    if (
      !confirm(
        'Sigur vrei să ștergi?'
      )
    ) {
      return;
    }


    const result =
      await sb
        .from(tab)
        .delete()
        .eq(
          'id',
          id
        );


    if (result.error) {

      alert(
        'Nu s-a putut șterge: ' +
        result.error.message
      );

      return;
    }


    await renderTable(tab);

    await renderDash();
  };


/* ========================================================
   DESCHIDERE TAB
======================================================== */

window.openTab =
  async function(tab) {

    current = tab;


    document
      .querySelectorAll(
        '.tab'
      )
      .forEach(
        function(x) {

          x.classList.add(
            'hidden'
          );

        }
      );


    const target =
      document.getElementById(
        tab
      );


    if (!target) {

      console.error(
        'Nu există secțiunea cu id="' +
        tab +
        '" în admin.html'
      );

      return;
    }


    target.classList.remove(
      'hidden'
    );


    document
      .querySelectorAll(
        'aside button[data-tab]'
      )
      .forEach(
        function(x) {

          x.classList.toggle(
            'active',
            x.dataset.tab === tab
          );

        }
      );


    if (
      tab === 'dash'
    ) {

      await renderDash();

    } else if (
      tab === 'quotes'
    ) {

      await renderQuotes();

    } else if (
      tab === 'orders'
    ) {

      await renderOrders();

    } else {

      await renderTable(tab);

    }
  };


/* ========================================================
   PORNIRE ADMIN
======================================================== */

document.addEventListener(
  'DOMContentLoaded',
  async function() {

    const u =
      await requireUser();


    if (!u) {
      return;
    }


    /* ====================================================
       MENIU ADMIN
    ==================================================== */

    document
      .querySelectorAll(
        'aside button[data-tab]'
      )
      .forEach(
        function(b) {

          b.onclick =
            function() {

              openTab(
                b.dataset.tab
              );

            };

        }
      );


    /* ====================================================
       LOGOUT
    ==================================================== */

    const logout =
      document.getElementById(
        'logout'
      );


    if (logout) {

      logout.onclick =
        async function() {

          await sb.auth
            .signOut();

          location.reload();

        };
    }


    /* ====================================================
       DESCHIDEM DASHBOARD
    ==================================================== */

    openTab('dash');
  }
);
