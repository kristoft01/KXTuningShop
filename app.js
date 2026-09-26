const SUPABASE_URL = 'https://kgcareaxamxisilmwyvi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_oXGqd9Xf9u50GeQcsY8G2g_1X639MFE';

const sb = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const WA = '40753911677';


/* ========================================================
   TRANSPORT
======================================================== */

const SHIPPING_COST = 25;
const FREE_SHIPPING_FROM = 500;


/* ========================================================
   SERVICII FALLBACK
======================================================== */

const fallbackServices = [
  [
    'Interior Custom',
    'Retapițare plafon, stâlpi și fețe de uși • Alcantara • colantări'
  ],
  [
    'Ambient & Light Design',
    'Lumini ambientale premium • plafon înstelat • stele în uși'
  ],
  [
    'Personalizare',
    'Centuri colorate • design interior unic • elemente custom'
  ],
  [
    'Multimedia & Audio',
    'Navigații CarPlay • camere reverse • sisteme audio'
  ],
  [
    'Detailing',
    'Detailing interior complet • polish faruri'
  ],
  [
    'Service & Software',
    'Mentenanță • diagnoză • codări & adaptări'
  ]
];


/* ========================================================
   PRODUSE
======================================================== */

let allProducts = [];
let filteredProducts = [];
let selectedCategory = 'all';
let visibleProducts = 12;

const PRODUCTS_PER_PAGE = 12;


/* ========================================================
   COȘ
======================================================== */

let cart = JSON.parse(
  localStorage.getItem('kxCart') || '[]'
);


/* ========================================================
   ESCAPE HTML
======================================================== */

function esc(s = '') {
  return String(s).replace(
    /[&<>'"]/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c])
  );
}


/* ========================================================
   NORMALIZARE TEXT
======================================================== */

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}


/* ========================================================
   MENIU MOBIL
======================================================== */

function toggleMobileMenu() {
  const menu =
    document.getElementById('mobileMenu');

  if (!menu) return;

  const willOpen =
    menu.classList.contains('hidden');

  menu.classList.toggle('hidden');

  document.body.classList.toggle(
    'no-scroll',
    willOpen
  );
}


function closeMobileMenu() {
  const menu =
    document.getElementById('mobileMenu');

  if (!menu) return;

  menu.classList.add('hidden');

  document.body.classList.remove(
    'no-scroll'
  );
}


/* ========================================================
   COȘ - SALVARE
======================================================== */

function saveCart() {
  localStorage.setItem(
    'kxCart',
    JSON.stringify(cart)
  );

  updateCartUI();
}


/* ========================================================
   NUMĂR PRODUSE COȘ
======================================================== */

function cartCount() {
  return cart.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );
}


/* ========================================================
   SUBTOTAL PRODUSE
======================================================== */

function productsTotal() {
  return cart.reduce(
    (sum, item) =>
      sum +
      (Number(item.price) || 0) *
      Number(item.quantity || 0),
    0
  );
}


/* ========================================================
   TRANSPORT
======================================================== */

function shippingCost() {
  const subtotal = productsTotal();

  if (subtotal <= 0) {
    return 0;
  }

  if (subtotal >= FREE_SHIPPING_FROM) {
    return 0;
  }

  return SHIPPING_COST;
}


/* ========================================================
   TOTAL FINAL
======================================================== */

function cartTotal() {
  return productsTotal() + shippingCost();
}


/* ========================================================
   ACTUALIZARE COȘ
======================================================== */

function updateCartUI() {
  const count =
    document.getElementById('cartCount');

  if (count) {
    count.textContent = cartCount();
  }


  const total =
    document.getElementById('cartTotal');

  if (total) {
    total.textContent =
      cartTotal().toFixed(2) + ' lei';
  }


  const box =
    document.getElementById('cartItems');

  if (!box) return;


  if (!cart.length) {
    box.innerHTML = `
      <div class="empty">
        Coșul este gol.
      </div>
    `;

    return;
  }


  const subtotal = productsTotal();
  const shipping = shippingCost();

  const amountUntilFreeShipping =
    Math.max(
      0,
      FREE_SHIPPING_FROM - subtotal
    );


  const itemsHtml =
    cart.map(item => `
      <div class="cart-item">

        <div>
          <strong>
            ${esc(item.name)}
          </strong>

          <small>
            ${Number(item.price).toFixed(2)} lei / buc.
          </small>
        </div>

        <div class="cart-controls">

          <button
            type="button"
            onclick="changeQuantity('${item.id}', -1)"
          >
            −
          </button>

          <span>
            ${item.quantity}
          </span>

          <button
            type="button"
            onclick="changeQuantity('${item.id}', 1)"
          >
            +
          </button>

          <button
            type="button"
            class="danger"
            onclick="removeFromCart('${item.id}')"
          >
            Șterge
          </button>

        </div>

      </div>
    `).join('');


  const shippingHtml = `
    <div class="cart-shipping-summary">

      <div class="cart-summary-row">
        <span>Produse</span>

        <strong>
          ${subtotal.toFixed(2)} lei
        </strong>
      </div>

      <div class="cart-summary-row">
        <span>Transport</span>

        <strong>
          ${
            shipping === 0
              ? 'GRATUIT'
              : `${shipping.toFixed(2)} lei`
          }
        </strong>
      </div>

      ${
        shipping > 0
          ? `
            <div class="free-shipping-message">
              Mai adaugă
              <strong>
                ${amountUntilFreeShipping.toFixed(2)} lei
              </strong>
              pentru transport gratuit.
            </div>
          `
          : `
            <div class="free-shipping-message">
              ✓ Ai transport gratuit!
            </div>
          `
      }

    </div>
  `;


  box.innerHTML =
    itemsHtml + shippingHtml;
}


/* ========================================================
   DESCHIDE / ÎNCHIDE COȘ
======================================================== */

function toggleCart() {
  const overlay =
    document.getElementById('cartOverlay');

  if (!overlay) return;

  const willOpen =
    overlay.classList.contains('hidden');

  if (willOpen) {
    overlay.classList.remove('hidden');

    document.body.classList.add(
      'no-scroll'
    );
  } else {
    overlay.classList.add('hidden');

    document.body.classList.remove(
      'no-scroll'
    );
  }

  updateCartUI();
}


/* ========================================================
   ÎNCHIDE COȘ DIN FUNDAL
======================================================== */

function closeCartFromOverlay(event) {
  const overlay =
    document.getElementById('cartOverlay');

  if (!overlay) return;

  if (event.target === overlay) {
    overlay.classList.add('hidden');

    document.body.classList.remove(
      'no-scroll'
    );
  }
}


/* ========================================================
   ADAUGĂ ÎN COȘ
======================================================== */

function addToCart(product) {
  const existing =
    cart.find(
      item =>
        String(item.id) ===
        String(product.id)
    );

  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      quantity: 1
    });
  }

  saveCart();

  const overlay =
    document.getElementById('cartOverlay');

  if (
    overlay &&
    overlay.classList.contains('hidden')
  ) {
    overlay.classList.remove('hidden');

    document.body.classList.add(
      'no-scroll'
    );
  }
}


/* ========================================================
   SCHIMBĂ CANTITATE
======================================================== */

function changeQuantity(id, change) {
  const item =
    cart.find(
      item =>
        String(item.id) === String(id)
    );

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(
      item =>
        String(item.id) !== String(id)
    );
  }

  saveCart();
}


/* ========================================================
   ȘTERGE DIN COȘ
======================================================== */

function removeFromCart(id) {
  cart = cart.filter(
    item =>
      String(item.id) !== String(id)
  );

  saveCart();
}


/* ========================================================
   CHECKOUT
======================================================== */

function openCheckout() {
  if (!cart.length) {
    alert('Coșul este gol.');
    return;
  }

  const box =
    document.getElementById('cartItems');

  if (!box) return;


  const old =
    document.getElementById('checkoutForm');

  if (old) {
    old.remove();
  }


  document
    .querySelectorAll(
      'button[onclick="openCheckout()"]'
    )
    .forEach(button => {
      button.style.display = 'none';
    });


  const subtotal = productsTotal();
  const shipping = shippingCost();
  const total = cartTotal();


  const form =
    document.createElement('div');

  form.id = 'checkoutForm';
  form.className = 'checkout-form';


  form.innerHTML = `

    <div class="eyebrow">
      DATE CLIENT
    </div>

    <h3>
      Finalizează comanda
    </h3>

    <div class="checkout-order-summary">

      <div>
        <span>Produse</span>
        <strong>${subtotal.toFixed(2)} lei</strong>
      </div>

      <div>
        <span>Transport</span>
        <strong>
          ${
            shipping === 0
              ? 'GRATUIT'
              : `${shipping.toFixed(2)} lei`
          }
        </strong>
      </div>

      <div class="checkout-final-total">
        <span>Total</span>
        <strong>${total.toFixed(2)} lei</strong>
      </div>

    </div>

    <label>
      Nume*

      <input
        id="checkoutName"
        required
        autocomplete="name"
        placeholder="Numele tău"
      >
    </label>

    <label>
      Telefon*

      <input
        id="checkoutPhone"
        type="tel"
        required
        autocomplete="tel"
        inputmode="tel"
        placeholder="07xx xxx xxx"
      >
    </label>

    <div class="row two">

      <label>
        Județ*

        <input
          id="checkoutCounty"
          required
          autocomplete="address-level1"
          placeholder="Ex: Bihor"
        >
      </label>

      <label>
        Localitate*

        <input
          id="checkoutCity"
          required
          autocomplete="address-level2"
          placeholder="Ex: Oradea"
        >
      </label>

    </div>

    <label>
      Stradă și număr*

      <input
        id="checkoutStreet"
        required
        autocomplete="street-address"
        placeholder="Ex: Str. Republicii nr. 10"
      >
    </label>

    <label>
      Cod poștal

      <input
        id="checkoutPostalCode"
        inputmode="numeric"
        autocomplete="postal-code"
        placeholder="Ex: 410000"
      >
    </label>

    <label>
      Observații

      <textarea
        id="checkoutNotes"
        placeholder="Detalii suplimentare despre comandă"
      ></textarea>
    </label>

    <div class="checkout-payment">

      <div class="eyebrow">
        METODĂ DE PLATĂ
      </div>

      <div class="payment-options">

        <label class="payment-option">

          <input
            type="radio"
            name="paymentMethod"
            value="cash"
            checked
            onchange="updatePaymentMethod()"
          >

          <span>
            <strong>
              💵 Ramburs
            </strong>

            <small>
              Plătești la primirea coletului
            </small>
          </span>

        </label>

        <label class="payment-option">

          <input
            type="radio"
            name="paymentMethod"
            value="card"
            onchange="updatePaymentMethod()"
          >

          <span>
            <strong>
              💳 Card
            </strong>

            <small>
              Plată online cu cardul
            </small>
          </span>

        </label>

      </div>

      <div
        id="cardPaymentInfo"
        class="card-payment-info hidden"
      >
        Plata online cu cardul este în curs de activare.
        Pentru moment poți finaliza comanda prin ramburs.
      </div>

    </div>

    <button
      id="placeOrderButton"
      class="btn primary"
      type="button"
      onclick="placeOrder()"
    >
      PLASEAZĂ COMANDA →
    </button>

    <p
      id="checkoutMessage"
      class="success"
    ></p>

  `;


  box.appendChild(form);


  setTimeout(() => {
    form.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, 100);
}


/* ========================================================
   METODĂ DE PLATĂ
======================================================== */

function updatePaymentMethod() {
  const selected =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    );

  const cardInfo =
    document.getElementById(
      'cardPaymentInfo'
    );

  const button =
    document.getElementById(
      'placeOrderButton'
    );

  if (!selected) return;


  if (selected.value === 'card') {
    if (cardInfo) {
      cardInfo.classList.remove('hidden');
    }

    if (button) {
      button.textContent =
        'CARD - ÎN CURS DE ACTIVARE';
    }
  } else {
    if (cardInfo) {
      cardInfo.classList.add('hidden');
    }

    if (button) {
      button.textContent =
        'PLASEAZĂ COMANDA →';
    }
  }
}


/* ========================================================
   PLASEAZĂ COMANDA
======================================================== */
async function placeOrder() {
  if (!cart.length) return;

  const name =
    document.getElementById('checkoutName')
      ?.value.trim();

  const phone =
    document.getElementById('checkoutPhone')
      ?.value.trim();

  const county =
    document.getElementById('checkoutCounty')
      ?.value.trim();

  const city =
    document.getElementById('checkoutCity')
      ?.value.trim();

  const street =
    document.getElementById('checkoutStreet')
      ?.value.trim();

  const postalCode =
    document.getElementById('checkoutPostalCode')
      ?.value.trim() || '';

  const notes =
    document.getElementById('checkoutNotes')
      ?.value.trim() || '';

  const paymentMethod =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value || 'cash';

  const message =
    document.getElementById('checkoutMessage');

  const button =
    document.getElementById('placeOrderButton');

  if (!message) return;


  /* =========================
     VALIDARE
  ========================= */

  if (
    !name ||
    !phone ||
    !county ||
    !city ||
    !street
  ) {
    message.textContent =
      'Completează toate câmpurile obligatorii.';

    message.className = 'error';

    return;
  }


  if (paymentMethod === 'card') {
    message.textContent =
      'Plata cu cardul nu este încă activă. Selectează Ramburs pentru a continua.';

    message.className = 'error';

    return;
  }


  /* =========================
     ADRESĂ
  ========================= */

  const addressParts = [
    street,
    city,
    county
  ];

  if (postalCode) {
    addressParts.push(
      `Cod poștal: ${postalCode}`
    );
  }

  const address =
    addressParts.join(', ');


  /* =========================
     TOTALURI
  ========================= */

  const subtotal =
    productsTotal();

  const shipping =
    shippingCost();

  const total =
    cartTotal();


  const paymentText =
    paymentMethod === 'cash'
      ? 'Ramburs'
      : 'Card';


  /* =========================
     OBSERVAȚII COMANDĂ
  ========================= */

  let finalNotes =
    `Metodă de plată: ${paymentText}\n` +
    `Produse: ${subtotal.toFixed(2)} lei\n` +
    `Transport: ${
      shipping === 0
        ? 'GRATUIT'
        : shipping.toFixed(2) + ' lei'
    }\n` +
    `Total: ${total.toFixed(2)} lei`;

  if (notes) {
    finalNotes +=
      `\nObservații: ${notes}`;
  }


  /* =========================
     LOADING
  ========================= */

  if (button) {
    button.disabled = true;

    button.textContent =
      'SE TRIMITE COMANDA...';
  }

  message.textContent =
    'Se trimite comanda...';

  message.className =
    'success';


  const orderId =
    crypto.randomUUID();


  /* ========================================================
     SALVARE COMANDĂ
  ======================================================== */

  const {
    error: orderError
  } = await sb
    .from('orders')
    .insert({
      id: orderId,

      customer_name:
        name,

      customer_phone:
        phone,

      customer_address:
        address,

      /*
        IMPORTANT:
        aici salvăm TOTALUL FINAL,
        adică produse + transport.
      */
      total:
        total,

      status:
        'new',

      notes:
        finalNotes
    });


  if (orderError) {
    console.error(
      'Eroare creare comandă:',
      orderError
    );

    message.textContent =
      'Nu am putut trimite comanda. Încearcă din nou.';

    message.className =
      'error';

    if (button) {
      button.disabled = false;

      button.textContent =
        'PLASEAZĂ COMANDA →';
    }

    return;
  }


  /* ========================================================
     PRODUSELE COMENZII
  ======================================================== */

  const items =
    cart.map(item => ({
      order_id:
        orderId,

      product_id:
        item.id,

      product_name:
        item.name,

      quantity:
        item.quantity,

      price:
        Number(item.price) || 0
    }));


  const {
    error: itemError
  } = await sb
    .from('order_items')
    .insert(items);


  if (itemError) {
    console.error(
      'Eroare produse comandă:',
      itemError
    );

    message.textContent =
      'Comanda a fost creată, dar produsele nu au putut fi salvate.';

    message.className =
      'error';

    if (button) {
      button.disabled = false;

      button.textContent =
        'PLASEAZĂ COMANDA →';
    }

    return;
  }


  /* ========================================================
     EMAIL COMANDĂ
  ======================================================== */

  try {
    const notificationResult =
      await sb.functions.invoke(
        'order-notification',
        {
          body: {
            order_id:
              orderId,

            customer_name:
              name,

            customer_phone:
              phone,

            customer_address:
              address,

            /*
              Totalul final
            */
            total:
              total.toFixed(2),

            /*
              Trimitem și valorile separat.
              Vom modifica Edge Function-ul
              după ce testăm coșul.
            */
            subtotal:
              subtotal.toFixed(2),

            shipping:
              shipping.toFixed(2),

            free_shipping:
              shipping === 0,

            notes:
              finalNotes,

            payment_method:
              paymentText,

            items:
              items.map(item => ({
                product_name:
                  item.product_name,

                quantity:
                  item.quantity,

                price:
                  item.price
              }))
          }
        }
      );


    if (notificationResult.error) {
      console.error(
        'Comanda a fost salvată, dar notificarea email nu a fost trimisă:',
        notificationResult.error
      );
    }

  } catch (notificationError) {
    console.error(
      'Comanda a fost salvată, dar notificarea email a eșuat:',
      notificationError
    );
  }


  /* ========================================================
     NUMĂR COMANDĂ
  ======================================================== */

  const orderNumber =
    orderId
      .slice(0, 8)
      .toUpperCase();


  /* ========================================================
     WHATSAPP
  ======================================================== */

  const shippingText =
    shipping === 0
      ? 'GRATUIT'
      : `${shipping.toFixed(2)} lei`;


  const whatsappMessage =
    `Salut! Am plasat o comandă pe KXTuningShop.\n\n` +

    `Comanda: ${orderNumber}\n` +

    `Nume: ${name}\n` +

    `Telefon: ${phone}\n` +

    `Adresă: ${address}\n\n` +

    `Produse: ${subtotal.toFixed(2)} lei\n` +

    `Transport: ${shippingText}\n` +

    `TOTAL: ${total.toFixed(2)} lei\n\n` +

    `Plată: ${paymentText}`;


  const whatsappUrl =
    `https://wa.me/${WA}?text=` +
    encodeURIComponent(
      whatsappMessage
    );


  /* ========================================================
     PĂSTRĂM FORMULARUL PENTRU CONFIRMARE
  ======================================================== */

  const checkoutForm =
    document.getElementById(
      'checkoutForm'
    );


  /* ========================================================
     GOLIM COȘUL
     FĂRĂ saveCart()
  ======================================================== */

  cart = [];

  localStorage.setItem(
    'kxCart',
    JSON.stringify(cart)
  );


  /*
    Actualizăm doar badge-ul.
    NU chemăm updateCartUI(),
    pentru că ar șterge confirmarea.
  */

  const cartCountElement =
    document.getElementById(
      'cartCount'
    );

  if (cartCountElement) {
    cartCountElement.textContent =
      '0';
  }


  const cartTotalElement =
    document.getElementById(
      'cartTotal'
    );

  if (cartTotalElement) {
    cartTotalElement.textContent =
      '0.00 lei';
  }


  /* ========================================================
     CONFIRMARE PE ECRAN
  ======================================================== */

  if (checkoutForm) {
    checkoutForm.innerHTML = `

      <div class="eyebrow">
        COMANDĂ CONFIRMATĂ
      </div>

      <h3>
        ✅ Comandă plasată cu succes!
      </h3>

      <p>
        Comanda ta a fost înregistrată.
      </p>


      <div class="checkout-order-summary">

        <div>
          <span>
            Număr comandă
          </span>

          <strong>
            ${esc(orderNumber)}
          </strong>
        </div>


        <div>
          <span>
            Produse
          </span>

          <strong>
            ${esc(subtotal.toFixed(2))} lei
          </strong>
        </div>


        <div>
          <span>
            Transport
          </span>

          <strong>
            ${esc(shippingText)}
          </strong>
        </div>


        <div>
          <span>
            Metodă de plată
          </span>

          <strong>
            ${esc(paymentText)}
          </strong>
        </div>


        <div class="checkout-final-total">

          <span>
            TOTAL
          </span>

          <strong>
            ${esc(total.toFixed(2))} lei
          </strong>

        </div>

      </div>


      <p>
        Te vom contacta telefonic pentru
        confirmarea comenzii.
      </p>


      <a
        class="btn primary"
        href="${esc(whatsappUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        💬 TRIMITE ȘI PE WHATSAPP
      </a>

    `;


    checkoutForm.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}


/* ========================================================
   CATEGORII PRODUSE
======================================================== */

function buildProductCategories() {
  const container =
    document.getElementById(
      'productCategories'
    );

  if (!container) return;


  const categories = [
    ...new Set(
      allProducts
        .map(product =>
          String(
            product.category || ''
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        'ro'
      )
  );


  container.innerHTML = `
    <button
      class="category-button active"
      type="button"
      data-category="all"
      onclick="selectCategory('all', this)"
    >
      TOATE
    </button>
  `;


  categories.forEach(category => {
    const button =
      document.createElement(
        'button'
      );

    button.type =
      'button';

    button.className =
      'category-button';

    button.dataset.category =
      category;

    button.textContent =
      category.toUpperCase();


    button.addEventListener(
      'click',
      () => {
        selectCategory(
          category,
          button
        );
      }
    );


    container.appendChild(
      button
    );
  });
}


/* ========================================================
   SELECTARE CATEGORIE
======================================================== */

function selectCategory(
  category,
  button
) {
  selectedCategory =
    category;

  visibleProducts =
    PRODUCTS_PER_PAGE;


  document
    .querySelectorAll(
      '.category-button'
    )
    .forEach(btn => {
      btn.classList.remove(
        'active'
      );
    });


  if (button) {
    button.classList.add(
      'active'
    );
  }


  filterProducts();
}


/* ========================================================
   FILTRARE PRODUSE
======================================================== */

function filterProducts() {
  const searchInput =
    document.getElementById(
      'productSearch'
    );


  const search =
    normalizeText(
      searchInput?.value || ''
    );


  filteredProducts =
    allProducts.filter(product => {

      const productCategory =
        String(
          product.category || ''
        ).trim();


      const categoryMatch =
        selectedCategory === 'all' ||
        productCategory ===
          selectedCategory;


      const searchableText =
        normalizeText(
          `${product.name || ''} ` +
          `${product.description || ''} ` +
          `${product.category || ''}`
        );


      const searchMatch =
        !search ||
        searchableText.includes(
          search
        );


      return (
        categoryMatch &&
        searchMatch
      );
    });


  visibleProducts =
    PRODUCTS_PER_PAGE;


  renderProducts();
}


/* ========================================================
   CARD PRODUS
======================================================== */

function createProductCard(x) {
  const price =
    x.price != null
      ? Number(x.price)
      : null;


  const productForCart = {
    id:
      x.id,

    name:
      x.name,

    price:
      price
  };


  return `

    <article class="product-card">

      ${
        x.image_url
          ? `
            <img
              src="${esc(x.image_url)}"
              alt="${esc(x.name)}"
              loading="lazy"
            >
          `
          : ''
      }

      <div>

        <small>
          ${esc(x.category || 'Produs')}
        </small>

        <h3>
          ${esc(x.name)}
        </h3>

        <p>
          ${esc(x.description || '')}
        </p>

        <strong>
          ${
            price != null &&
            Number.isFinite(price)
              ? `${price.toFixed(2)} lei`
              : 'Cere preț'
          }
        </strong>

        ${
          price != null &&
          Number.isFinite(price)
            ? `
              <button
                class="btn primary add-cart"
                type="button"
                onclick='addToCart(${JSON.stringify(
                  productForCart
                )})'
              >
                🛒 ADAUGĂ ÎN COȘ
              </button>
            `
            : ''
        }

      </div>

    </article>

  `;
}


/* ========================================================
   AFIȘARE PRODUSE
======================================================== */

function renderProducts() {
  const productsBox =
    document.getElementById(
      'products'
    );


  const resultsCount =
    document.getElementById(
      'productResultsCount'
    );


  const loadMoreWrap =
    document.getElementById(
      'loadMoreWrap'
    );


  if (!productsBox) return;


  if (resultsCount) {
    const total =
      filteredProducts.length;

    resultsCount.textContent =
      total === 1
        ? '1 produs'
        : `${total} produse`;
  }


  if (!filteredProducts.length) {
    productsBox.innerHTML = `
      <div class="empty">
        Nu am găsit produse pentru această căutare.
      </div>
    `;


    if (loadMoreWrap) {
      loadMoreWrap.classList.add(
        'hidden'
      );
    }

    return;
  }


  const productsToShow =
    filteredProducts.slice(
      0,
      visibleProducts
    );


  productsBox.innerHTML =
    productsToShow
      .map(createProductCard)
      .join('');


  if (loadMoreWrap) {
    if (
      visibleProducts <
      filteredProducts.length
    ) {
      loadMoreWrap.classList.remove(
        'hidden'
      );
    } else {
      loadMoreWrap.classList.add(
        'hidden'
      );
    }
  }
}


/* ========================================================
   ÎNCARCĂ MAI MULTE
======================================================== */

function loadMoreProducts() {
  visibleProducts +=
    PRODUCTS_PER_PAGE;

  renderProducts();
}


/* ========================================================
   ÎNCĂRCARE SITE
======================================================== */

async function loadPublic() {

  const servicesResult =
    await sb
      .from('services')
      .select('*')
      .eq('active', true)
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  const projectsResult =
    await sb
      .from('projects')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  const productsResult =
    await sb
      .from('products')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );


  const services =
    servicesResult.data;

  const projects =
    projectsResult.data;

  const products =
    productsResult.data;


  /* =========================
     SERVICII
  ========================= */

  const s =
    services?.length
      ? services
      : fallbackServices.map(
          ([name, description]) => ({
            name,
            description
          })
        );


  const servicesBox =
    document.getElementById(
      'services'
    );


  if (servicesBox) {
    servicesBox.innerHTML =
      s.map(x => `
        <article class="card service-card">

          <div class="card-icon">
            ✦
          </div>

          <h3>
            ${esc(x.name)}
          </h3>

          <p>
            ${esc(x.description || '')}
          </p>

        </article>
      `).join('');
  }


  /* =========================
     SELECT SERVICII
  ========================= */

  const serviceSelect =
    document.getElementById(
      'serviceSelect'
    );


  if (serviceSelect) {
    serviceSelect.innerHTML =
      '<option value="">Alege serviciul</option>' +
      s.map(x => `
        <option value="${esc(x.name)}">
          ${esc(x.name)}
        </option>
      `).join('');
  }


  /* =========================
     LUCRĂRI
  ========================= */

  const projectsBox =
    document.getElementById(
      'projects'
    );


  if (projectsBox) {
    if (projects?.length) {
      projectsBox.innerHTML =
        projects.map(x => `
          <article class="project-card">

            ${
              x.image_url
                ? `
                  <img
                    src="${esc(x.image_url)}"
                    alt="${esc(x.title)}"
                    loading="lazy"
                  >
                `
                : ''
            }

            <div>

              <small>
                ${esc(x.car_make || '')}
                ${esc(x.car_model || '')}
              </small>

              <h3>
                ${esc(x.title)}
              </h3>

              <p>
                ${esc(
                  x.description ||
                  x.service ||
                  ''
                )}
              </p>

            </div>

          </article>
        `).join('');
    } else {
      projectsBox.innerHTML = `
        <div class="empty">
          Lucrările vor apărea aici în curând.
        </div>
      `;
    }
  }


  /* =========================
     PRODUSE
  ========================= */

  const productsBox =
    document.getElementById(
      'products'
    );


  if (productsBox) {
    if (productsResult.error) {
      console.error(
        'Eroare produse:',
        productsResult.error
      );

      productsBox.innerHTML = `
        <div class="empty">
          Nu am putut încărca produsele.
        </div>
      `;

    } else if (products?.length) {
      allProducts =
        products;

      filteredProducts =
        [...allProducts];

      visibleProducts =
        PRODUCTS_PER_PAGE;

      buildProductCategories();

      renderProducts();

    } else {
      allProducts = [];
      filteredProducts = [];

      productsBox.innerHTML = `
        <div class="empty">
          Nu există produse momentan.
        </div>
      `;


      const loadMoreWrap =
        document.getElementById(
          'loadMoreWrap'
        );


      if (loadMoreWrap) {
        loadMoreWrap.classList.add(
          'hidden'
        );
      }
    }
  }


  updateCartUI();
}


/* ========================================================
   WHATSAPP
======================================================== */

function whatsapp(message) {
  return (
    `https://wa.me/${WA}?text=` +
    encodeURIComponent(message)
  );
}


/* ========================================================
   ESC - ÎNCHIDE MENIU / COȘ
======================================================== */

document.addEventListener(
  'keydown',
  event => {

    if (event.key !== 'Escape') {
      return;
    }


    const menu =
      document.getElementById(
        'mobileMenu'
      );


    if (menu) {
      menu.classList.add(
        'hidden'
      );
    }


    const cartOverlay =
      document.getElementById(
        'cartOverlay'
      );


    if (cartOverlay) {
      cartOverlay.classList.add(
        'hidden'
      );
    }


    document.body.classList.remove(
      'no-scroll'
    );
  }
);


/* ========================================================
   DOM READY
======================================================== */

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    if (
      document.getElementById(
        'services'
      )
    ) {
      await loadPublic();
    }


    updateCartUI();


    /* ====================================================
       FORMULAR OFERTĂ
    ==================================================== */

    const f =
      document.getElementById(
        'quoteForm'
      );


    if (f) {
      f.addEventListener(
        'submit',
        async event => {

          event.preventDefault();


          const fd =
            new FormData(f);


          const q = {
            name:
              fd.get('nume'),

            phone:
              fd.get('telefon'),

            car_make:
              fd.get('marca'),

            car_model:
              fd.get('model'),

            car_year:
              fd.get('an')
                ? Number(
                    fd.get('an')
                  )
                : null,

            service:
              fd.get('serviciu'),

            message:
              `Motorizare: ${
                fd.get('motor') || '-'
              }\n` +
              `${fd.get('detalii') || ''}`
          };


          const {
            error
          } = await sb
            .from('quote_requests')
            .insert(q);


          const msg =
            document.getElementById(
              'success'
            );


          const formWhatsApp =
            document.getElementById(
              'formWhatsApp'
            );


          if (error) {
            console.error(
              'Eroare cerere ofertă:',
              error
            );


            if (msg) {
              msg.textContent =
                'Nu am putut trimite cererea. Încearcă WhatsApp.';

              msg.className =
                'error';
            }


            if (formWhatsApp) {
              formWhatsApp.href =
                whatsapp(
                  `Salut! Vreau o ofertă pentru ` +
                  `${q.car_make} ${q.car_model}. ` +
                  `${q.service}. ${q.message}`
                );
            }

            return;
          }


          if (msg) {
            msg.textContent =
              'Cererea a fost trimisă! Te vom contacta cât mai repede.';

            msg.className =
              'success';
          }


          if (formWhatsApp) {
            formWhatsApp.href =
              whatsapp(
                `Salut! Am trimis o cerere pe site pentru ` +
                `${q.car_make} ${q.car_model}.`
              );
          }


          f.reset();
        }
      );
    }
  }
);
