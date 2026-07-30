/* =====================================================================
   store.js — capa de datos compartida (Supabase + carrito)
   Requiere: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
             <script src="lib/supabase-config.js"></script>
   Expone: window.LCH
   ===================================================================== */
(function () {
  "use strict";

  var cfg = window.LCH_CONFIG || {};
  var configured = cfg.SUPABASE_URL && cfg.SUPABASE_URL.indexOf("http") === 0 &&
                   cfg.SUPABASE_ANON_KEY && cfg.SUPABASE_ANON_KEY.indexOf("PEGA_AQUI") !== 0;

  var client = null;
  if (configured && window.supabase && window.supabase.createClient) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }

  var CUR = cfg.CURRENCY || "Bs";
  var WA = cfg.WHATSAPP || "";

  function fmt(n) {
    var v = Number(n || 0);
    return CUR + " " + (Math.round(v) === v ? v : v.toFixed(2));
  }

  /* ---------------- Productos ---------------- */
  async function fetchProducts(opts) {
    opts = opts || {};
    if (!client) return { data: [], count: 0 };
    var q = client.from("products").select("*", { count: "exact" }).eq("active", true);
    if (opts.search) {
      var s = "%" + opts.search + "%";
      q = q.or("name.ilike." + s + ",team.ilike." + s + ",description.ilike." + s);
    }
    if (opts.categories && opts.categories.length) q = q.overlaps("categories", opts.categories);
    if (opts.sizes && opts.sizes.length) q = q.overlaps("sizes", opts.sizes);
    if (opts.promo) q = q.eq("is_promo", true);
    q = q.order("created_at", { ascending: false });
    if (typeof opts.offset === "number" && typeof opts.limit === "number") {
      q = q.range(opts.offset, opts.offset + opts.limit - 1);
    }
    var res = await q;
    if (res.error) { console.warn("fetchProducts", res.error); return { data: [], count: 0 }; }
    return { data: res.data || [], count: res.count || 0 };
  }

  async function fetchAllProducts() {
    if (!client) return [];
    var res = await client.from("products").select("*").eq("active", true).order("created_at", { ascending: false });
    if (res.error) { console.warn("fetchAllProducts", res.error); return []; }
    return res.data || [];
  }

  async function fetchProduct(id) {
    if (!client) return null;
    var res = await client.from("products").select("*").eq("id", id).single();
    if (res.error) { console.warn("fetchProduct", res.error); return null; }
    return res.data;
  }

  /* ---------------- Reseñas ---------------- */
  async function fetchReviews(productId) {
    if (!client) return [];
    var res = await client.from("reviews").select("*")
      .eq("product_id", productId).eq("approved", true)
      .order("created_at", { ascending: false });
    if (res.error) { console.warn("fetchReviews", res.error); return []; }
    return res.data || [];
  }

  async function addReview(review, photoFile) {
    if (!client) throw new Error("no-config");
    var photoUrl = null;
    if (photoFile) photoUrl = await uploadImage("resenas", photoFile);
    // Reseñas con foto quedan pendientes de aprobación (moderación) para evitar
    // imágenes inapropiadas; las de solo texto se publican al instante.
    var row = {
      product_id: review.product_id,
      author: review.author || "Cliente",
      rating: review.rating,
      comment: review.comment || "",
      photo: photoUrl,
      approved: photoUrl ? false : true
    };
    var res = await client.from("reviews").insert([row]);
    if (res.error) throw res.error;
    return { pending: !!photoUrl };
  }

  async function productRating(productId) {
    var list = await fetchReviews(productId);
    if (!list.length) return { avg: 0, count: 0 };
    var sum = list.reduce(function (a, r) { return a + (r.rating || 0); }, 0);
    return { avg: sum / list.length, count: list.length };
  }

  /* ---------------- Pedidos ---------------- */
  async function createOrder(order) {
    if (!client) throw new Error("no-config");
    // Sin .select(): el visitante anónimo puede INSERTAR pero no leer pedidos
    // (por seguridad). Pedir la fila de vuelta fallaba por RLS y el pedido no
    // se guardaba. Así el pedido queda registrado correctamente.
    var res = await client.from("orders").insert([order]);
    if (res.error) throw res.error;
    return true;
  }

  /* ---------------- Ajustes ---------------- */
  async function getSettings() {
    if (!client) return {};
    var res = await client.from("settings").select("*");
    if (res.error) return {};
    var out = {};
    (res.data || []).forEach(function (r) { out[r.key] = r.value; });
    return out;
  }

  /* ---------------- Almacenamiento ---------------- */
  async function uploadImage(bucket, file) {
    if (!client) throw new Error("no-config");
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    var path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    var up = await client.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
    if (up.error) throw up.error;
    var pub = client.storage.from(bucket).getPublicUrl(path);
    return pub.data.publicUrl;
  }

  /* ---------------- Carrito (localStorage) ---------------- */
  var CART_KEY = "lch_cart_v1";
  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); } catch (e) { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    document.dispatchEvent(new CustomEvent("cart:change"));
  }
  function addToCart(item) {
    var cart = getCart();
    // clave única: producto + talla + personalización
    var key = item.product_id + "|" + item.size + "|" + (item.custom_name || "") + "|" + (item.custom_number || "");
    var found = cart.find(function (c) {
      return (c.product_id + "|" + c.size + "|" + (c.custom_name || "") + "|" + (c.custom_number || "")) === key;
    });
    if (found) found.qty += item.qty || 1;
    else cart.push(Object.assign({ qty: 1 }, item));
    saveCart(cart);
  }
  function updateQty(index, qty) {
    var cart = getCart();
    if (!cart[index]) return;
    cart[index].qty = Math.max(1, qty);
    saveCart(cart);
  }
  function removeFromCart(index) {
    var cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  }
  function clearCart() { saveCart([]); }
  function cartCount() { return getCart().reduce(function (a, c) { return a + (c.qty || 1); }, 0); }
  function cartTotal() { return getCart().reduce(function (a, c) { return a + (c.price || 0) * (c.qty || 1); }, 0); }

  /* ---------------- Auth (admin) ---------------- */
  async function signIn(email, password) {
    if (!client) throw new Error("no-config");
    var res = await client.auth.signInWithPassword({ email: email, password: password });
    if (res.error) throw res.error;
    return res.data;
  }
  async function signOut() { if (client) await client.auth.signOut(); }
  async function currentUser() {
    if (!client) return null;
    var res = await client.auth.getUser();
    return res.data ? res.data.user : null;
  }

  window.LCH = {
    configured: !!client,
    client: client,
    WA: WA, CUR: CUR, fmt: fmt,
    fetchProducts: fetchProducts, fetchAllProducts: fetchAllProducts, fetchProduct: fetchProduct,
    fetchReviews: fetchReviews, addReview: addReview, productRating: productRating,
    createOrder: createOrder, getSettings: getSettings, uploadImage: uploadImage,
    getCart: getCart, addToCart: addToCart, updateQty: updateQty,
    removeFromCart: removeFromCart, clearCart: clearCart,
    cartCount: cartCount, cartTotal: cartTotal,
    signIn: signIn, signOut: signOut, currentUser: currentUser,
    waUrl: function (msg) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg); }
  };
})();
