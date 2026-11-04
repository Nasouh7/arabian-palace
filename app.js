/* =====================================================================
   ARABIAN PALACE — site behaviour
   languages · menu · dish sheet · photo viewer · ratings · online orders
   sent on WhatsApp · menu-only view for the table QR codes · gallery · profile viewer
   ===================================================================== */
(function () {
  "use strict";
  var D = window.ARABIAN_PALACE, TX = window.MENU_TEXT || {}, UNC = window.MENU_UNCERTAIN || [];
  var STK = (window.STOCK && window.STOCK.items) || {}, AMB = (window.STOCK && window.STOCK.ambient) || {};
  var I = window.I18N, C = window.AP_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var LANGS = ["en", "ar", "sw"];
  var params = new URLSearchParams(location.search);
  var REVIEW_MODE = params.has("check");

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function ssGet(k, d) { try { var v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function ssSet(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function slug(s) { return s.normalize("NFKD").replace(/[^\x00-\x7f]/g, "").toLowerCase().replace(/'/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
  function num(n) { return Number(n).toLocaleString("en-US"); }
  function ksh(n) { return "KSh " + num(n); }

  /* ---------------- language ---------------- */
  var lang = (function () {
    var q = params.get("lang"); if (LANGS.indexOf(q) >= 0) return q;
    var s = lsGet("ap-lang", null); if (LANGS.indexOf(s) >= 0) return s;
    var n = (navigator.language || "en").slice(0, 2).toLowerCase();
    return n === "ar" ? "ar" : n === "sw" ? "sw" : "en";
  })();
  function t(key, vars) {
    var s = (I.ui[lang] && I.ui[lang][key]) || I.ui.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function term(s) { if (!s || lang === "en") return s; var x = I.terms[s]; return (x && x[lang]) || s; }
  function alName(c) { var a = I.allergens[c]; return a ? a[lang] || a.en : c; }

  /* ---------------- data ---------------- */
  var ITEMS = [], BY = {}, CATS = D.categories;
  CATS.forEach(function (c) {
    c.items.forEach(function (it) {
      it.id = it.id || slug(it.name); it.cat = c.id; it.ix = ITEMS.length;   // `id` in menu-data.js keeps photos, translations and ratings when a name changes
      ITEMS.push(it); BY[it.id] = it;
    });
  });
  function tx(it) { return TX[it.id] || null; }
  function nm(it, l) { l = l || lang; if (l === "en") return it.name; var x = tx(it); return (x && x[l]) || it.name; }
  function desc(it) { var x = tx(it); return x ? x.d[lang] || x.d.en : (it.desc || ""); }
  function ingr(it) { var x = tx(it); return x ? x.i[lang] || x.i.en : []; }
  function allergens(it) { var x = tx(it); return x ? x.al : []; }
  function isVeg(it) { var x = tx(it); return !!(x && x.veg); }
  function catName(c) { if (lang === "en") return c.name; var x = I.cats[c.id]; return (x && x[lang] && x[lang][0]) || c.name; }
  function catNote(c) { if (lang === "en") return c.note || ""; var x = I.cats[c.id]; return (x && x[lang] && x[lang][1]) || (c.note ? "" : ""); }
  function minPrice(it) { return it.variants ? Math.min.apply(null, it.variants.map(function (v) { return v.price; })) : it.price; }

  var FAILED = {}; // stand-in photos that could not load (offline, blocked): fall back to the ornament
  function photo(it) {
    if (it.img) return { thumb: "img/thumbs/" + it.img + ".webp", mid: "img/photos/" + it.img + ".webp", full: "img/photos/" + it.img + ".webp", own: true };
    var e = STK[it.id];
    if (e && !FAILED[it.id]) return { thumb: "img/stock/" + (window.AP_ARTIFACT ? "mid/" : "thumb/") + it.id + ".webp", mid: "img/stock/mid/" + it.id + ".webp", full: "img/stock/mid/" + it.id + ".webp", own: false, e: e };
    return null;
  }

  /* ---------------- i18n of static markup ---------------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    $$("[data-i18n-html]").forEach(function (el) { el.innerHTML = t(el.getAttribute("data-i18n-html")); });
    $$("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var p = pair.split(":"); if (p.length === 2) el.setAttribute(p[0].trim(), t(p[1].trim()));
      });
    });
    $$(".lang button, .np-lang button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === lang)); });
    var isMenu = document.documentElement.getAttribute("data-view") === "menu";
    var TITLES = {
      en: ["Arabian Palace | Halal Arabian & Yemeni Restaurant in Kilimani, Nairobi", "Online menu | Arabian Palace, Kilimani, Nairobi",
           "Halal Arabian restaurant in Kilimani, Nairobi. Yemeni mandi, mixed grills, shawarma, saltah and kunafa on Marcus Garvey Road. Open daily 8am–11:30pm. Full service in Arabic, Swahili & English. Book: 0797 666 667."],
      ar: ["القصر العربي | مطعم عربي ويمني حلال في كيليماني، نيروبي", "القائمة الإلكترونية | القصر العربي، كيليماني، نيروبي",
           "مطعم عربي حلال في كيليماني، نيروبي. مندي يمني ومشاوي مشكّلة وشاورما وسلتة وكنافة في شارع ماركوس غارفي. مفتوح يومياً من 8 صباحاً حتى 11:30 مساءً. خدمة كاملة بالعربية والسواحيلية والإنجليزية. للحجز: 0797 666 667."],
      sw: ["Arabian Palace | Mgahawa wa Kiarabu wa Halali, Kilimani Nairobi", "Menyu ya mtandaoni | Arabian Palace, Kilimani, Nairobi",
           "Mgahawa wa Kiarabu wa halali Kilimani, Nairobi. Mandi ya Kiyemeni, nyama choma mchanganyiko, shawarma, saltah na kunafa, Barabara ya Marcus Garvey. Wazi kila siku saa 2 asubuhi hadi saa 5:30 usiku. Huduma kamili kwa Kiarabu, Kiswahili na Kiingereza."]
    };
    document.title = TITLES[lang][isMenu ? 1 : 0];
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", TITLES[lang][2]);
    var hs = $(".hero .arabic"), h1 = $(".hero h1");
    if (lang === "ar") { hs.textContent = "Arabian Palace"; hs.lang = "en"; hs.classList.add("lat"); h1.textContent = "القصر العربي"; }
    else { hs.textContent = "القصر العربي"; hs.lang = "ar"; hs.classList.remove("lat"); h1.textContent = "Arabian Palace"; }
    var h = C.halal || {}, cert = $("#halalCert");
    if (cert) { if (h.certifier) { cert.hidden = false; cert.textContent = t("halal.cert", { who: h.certifier, no: h.number || "—", until: h.validUntil || "—" }); } else cert.hidden = true; }
  }
  function setLang(l) {
    if (l === lang || LANGS.indexOf(l) < 0) return;
    lang = l; lsSet("ap-lang", l);
    applyStatic(); renderAll();
    if (sheetItem) fillSheet(sheetItem);
  }
  $$(".lang button, .np-lang button").forEach(function (b) { b.addEventListener("click", function () { setLang(b.getAttribute("data-lang")); }); });
  try { history.scrollRestoration = "manual"; } catch (e) {}

  /* ---------------- icons ---------------- */
  var ICON = {
    zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4-4"/></svg>',
    plus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>',
    minus: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 8h10"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19 13 11"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star" width="24" height="24"/></svg>',
    seal: '<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#o-halal" width="120" height="120"/></svg>',
    orn: '<svg viewBox="0 0 40 40" aria-hidden="true"><use href="#o-star" width="40" height="40"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.4 7.6L3.5 20.5l1.4-4.3a8.5 8.5 0 1 1 15.6-4.6Z"/><path d="M9 8.6c.2-.5.6-.6 1-.5l.9 2.1-.7.9a6 6 0 0 0 2.8 2.8l.9-.7 2.1.9c.1.4 0 .8-.5 1.1-1 .7-2.6.4-4.3-1.1-1.8-1.6-2.8-3.6-2.2-4.6Z"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z"/><path d="M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2"/></svg>'
  };
  function stars(v, cls) {
    var r = Math.round(v), s = "";
    for (var i = 1; i <= 5; i++) s += '<svg viewBox="0 0 24 24" class="' + (i <= r ? "" : "off") + '" aria-hidden="true"><use href="#i-star" width="24" height="24"/></svg>';
    return '<span class="stars ' + (cls || "") + '">' + s + "</span>";
  }

  /* ---------------- ratings state ---------------- */
  var RAT = {}, backend = null, rated = lsGet("ap-rated", {});
  function ratingOf(id) { var r = RAT[id]; return r && r.n ? { n: r.n, avg: r.s / r.n } : null; }

  /* ---------------- QR on the table: the menu to look at, the waiter takes the order ---------------- */
  var QR = (function () {
    if (params.has("qr") || params.has("t") || params.has("table")) { ssSet("ap-qr", 1); return true; }
    return !!ssGet("ap-qr", 0);
  })();
  var TYPES = (C.orderTypes && C.orderTypes.length ? C.orderTypes : ["delivery", "pickup"]).filter(function (x) { return x === "delivery" || x === "pickup"; });
  function applyMode() {
    document.body.classList.toggle("browse-only", QR);
    $("#cartBtn").classList.toggle("on", !QR);
    var dine = $("#dine");
    dine.classList.toggle("qr", QR);
    dine.innerHTML = QR ? ICON.qr + "<span>" + esc(t("dine.qr")) + "</span>"
      : ICON.wa + "<span>" + esc(t(TYPES.length > 1 ? "dine.online" : TYPES[0] === "pickup" ? "dine.online.p" : "dine.online.d")) + "</span>";
    updateCartBadges();
  }

  /* ---------------- signatures ---------------- */
  function renderSignatures() {
    $("#signatures").innerHTML = D.signatures.map(function (s) {
      var x = I.sig[s.name], name = lang === "en" || !x ? s.name : x[lang][0], blurb = lang === "en" || !x ? s.blurb : x[lang][1];
      return '<article class="sig" data-rv>' +
        '<button type="button" class="gate" data-open="' + esc(s.item) + '" aria-label="' + esc(name) + '"><div class="fill"></div>' +
        '<svg class="arch"><use href="#o-arch" width="100%" height="100%"/></svg><svg class="arch inner"><use href="#o-arch" width="100%" height="100%"/></svg>' +
        '<img class="dish" src="img/dishes/' + esc(s.img) + '.webp" alt="" loading="lazy"><span class="plinth"></span></button>' +
        "<h3>" + esc(name) + "</h3><p>" + esc(blurb) + '</p><span class="price"><small>' + esc(t("sig.from")) + "</small>" + ksh(s.from) + "</span>" +
        '<button type="button" class="link" data-open="' + esc(s.item) + '">' + esc(t("sig.see")) + "</button></article>";
    }).join("");
  }

  /* ---------------- menu ---------------- */
  var filters = new Set(), vegOnly = false, query = "";
  var NO_VEG_TAG = ["hot-drinks", "cold-drinks", "desserts"]; // obvious there; the label would only add noise
  function priceHtml(it) {
    if (it.variants) return "<small>" + esc(t("sh.from")) + "</small>" + num(minPrice(it));
    return num(it.price);
  }
  function metaHtml(it) {
    var r = ratingOf(it.id), al = allergens(it), out = "";
    out += '<span class="rate">' + ICON.star + (r ? r.avg.toFixed(1) + " <em>(" + r.n + ")</em>" : "5.0 <em>" + esc(t("rate.new")) + "</em>") + "</span>";
    if (al.length) out += '<span class="allergens">' + ICON.warn + esc(al.map(alName).join(lang === "ar" ? "، " : ", ")) + "</span>";
    if (isVeg(it) && NO_VEG_TAG.indexOf(it.cat) < 0) out += '<span class="veg">' + ICON.leaf + esc(t("sh.veg")) + "</span>";
    if (REVIEW_MODE && UNC.indexOf(it.id) >= 0) out += '<span class="check">' + esc(t("sh.check")) + "</span>";
    return out;
  }
  function itemHtml(it) {
    var p = photo(it), n = nm(it);
    var th = p
      ? '<button type="button" class="thumb-btn" data-zoom="' + it.id + '" aria-label="' + esc(t("sh.zoom") + ": " + n) + '"><img class="thumb" src="' + esc(p.thumb) + '" alt="" loading="lazy" decoding="async" width="64" height="64"' + (p.own ? "" : ' referrerpolicy="no-referrer" data-ext="' + it.id + '"') + '><span class="zoom">' + ICON.zoom + "</span></button>"
      : '<span class="thumb-empty" aria-hidden="true">' + ICON.orn + "</span>";
    var pick = "";
    if (it.variants || it.choices) {
      var opts = it.variants ? it.variants.map(function (v, i) { return '<button type="button" class="chip" data-add="' + it.id + '" data-v="' + i + '">' + esc(term(v.label)) + "<b>" + num(v.price) + "</b></button>"; })
        : it.choices.items.map(function (c, i) { return '<button type="button" class="chip" data-add="' + it.id + '" data-c="' + i + '">' + esc(term(c)) + "</button>"; });
      pick = '<div class="picker"><span class="lbl">' + esc(it.choices ? term(it.choices.label) : t("sh.choose")) + "</span>" + opts.join("") + "</div>";
    }
    return '<div class="item" data-id="' + it.id + '">' + th +
      '<div class="info"><div class="head"><button type="button" class="name" data-open="' + it.id + '">' + esc(n) +
      (it.tag ? '<span class="tag">' + esc(term(it.tag)) + "</span>" : "") + '</button><span class="lead"></span></div>' +
      (desc(it) ? '<p class="desc">' + esc(desc(it)) + "</p>" : "") +
      '<div class="meta">' + metaHtml(it) + "</div></div>" +
      '<div class="price-wrap"><span class="price">' + priceHtml(it) + "</span></div>" +
      '<button type="button" class="add" data-addbtn="' + it.id + '" aria-label="' + esc(t("sh.add") + ": " + n) + '">' + ICON.plus + "</button>" + pick + "</div>";
  }
  function renderMenu() {
    $("#rail").innerHTML = CATS.map(function (c) { return '<a href="#cat-' + c.id + '" data-cat="' + c.id + '">' + esc(catName(c)) + "</a>"; }).join("");
    $("#cats").innerHTML = CATS.map(function (c) {
      var note = catNote(c);
      return '<section class="cat" id="cat-' + c.id + '" data-cat="' + c.id + '"><div class="cat-head"><h3>' + esc(catName(c)) + "</h3>" +
        (note ? "<p>" + esc(note) + "</p>" : "") + '<span class="strip thin"></span></div><div class="items">' + c.items.map(itemHtml).join("") + "</div></section>";
    }).join("");
    renderFilters(); applyFilter(); updateCartBadges(); observeRail();
  }
  function refreshMeta() { ITEMS.forEach(function (it) { var el = $('.item[data-id="' + it.id + '"] .meta'); if (el) el.innerHTML = metaHtml(it); }); }

  /* search + allergy filter */
  function norm(s) {
    return String(s).toLowerCase().normalize("NFKD").replace(/[̀-ًͯ-ٰٟ]/g, "")
      .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي");
  }
  var HAY = {};
  function hay(it) {
    var k = it.id + lang; if (HAY[k]) return HAY[k];
    var x = tx(it), parts = [it.name, nm(it, "ar"), nm(it, "sw"), desc(it), ingr(it).join(" "), it.desc || ""];
    if (x) parts.push(x.i.en.join(" "));
    return (HAY[k] = norm(parts.join(" ")));
  }
  function visible(it) {
    if (vegOnly && !isVeg(it)) return false;
    if (filters.size && allergens(it).some(function (a) { return filters.has(a); })) return false;
    if (query && hay(it).indexOf(norm(query)) < 0) return false;
    return true;
  }
  function applyFilter() {
    var hidden = 0, shown = 0;
    CATS.forEach(function (c) {
      var any = false;
      c.items.forEach(function (it) {
        var v = visible(it), el = $('.item[data-id="' + it.id + '"]');
        if (el) el.classList.toggle("hidden", !v);
        if (v) { any = true; shown++; } else if (!query) hidden++;
      });
      var sec = $("#cat-" + c.id); if (sec) sec.hidden = !any;
      var a = $('#rail a[data-cat="' + c.id + '"]'); if (a) a.hidden = !any;
    });
    var es = $("#emptySearch"); es.classList.toggle("on", shown === 0); es.textContent = shown === 0 ? t("menu.empty", { q: query || "…" }) : "";
    var fb = $("#filterBtn"), n = filters.size + (vegOnly ? 1 : 0);
    fb.classList.toggle("has", n > 0); $("#filterN").textContent = n;
    var note = $("#filterNote"), msg = "";
    if (filters.size) msg = t("filter.note", { n: hidden, list: Array.from(filters).map(alName).join(lang === "ar" ? "، " : ", ") });
    else if (vegOnly) msg = t("filter.note.veg");
    note.textContent = msg; note.classList.toggle("on", !!msg);
  }
  function renderFilters() {
    $("#filterOpts").innerHTML = Object.keys(I.allergens).map(function (c) {
      return '<button type="button" class="fchip" data-f="' + c + '" aria-pressed="' + filters.has(c) + '">' + esc(alName(c)) + "</button>";
    }).join("") + '<button type="button" class="fchip veg" data-f="veg" aria-pressed="' + vegOnly + '">' + ICON.leaf + esc(t("filter.veg")) + "</button>";
  }
  $("#filterOpts").addEventListener("click", function (e) {
    var b = e.target.closest(".fchip"); if (!b) return;
    var f = b.getAttribute("data-f");
    if (f === "veg") vegOnly = !vegOnly; else if (filters.has(f)) filters.delete(f); else filters.add(f);
    b.setAttribute("aria-pressed", f === "veg" ? vegOnly : filters.has(f)); applyFilter();
  });
  function toggleFilters(on) {
    var p = $("#filters"); on = on == null ? !p.classList.contains("on") : on;
    p.classList.toggle("on", on); $("#filterBtn").setAttribute("aria-expanded", String(on));
  }
  $("#filterBtn").addEventListener("click", function (e) { e.stopPropagation(); toggleFilters(); });
  $("#filterDone").addEventListener("click", function () { toggleFilters(false); });
  $("#filterClear").addEventListener("click", function () { filters.clear(); vegOnly = false; renderFilters(); applyFilter(); });
  document.addEventListener("click", function (e) { if ($("#filters").classList.contains("on") && !e.target.closest("#filters, #filterBtn")) toggleFilters(false); });
  var qt;
  $("#q").addEventListener("input", function (e) {
    clearTimeout(qt); var v = e.target.value.trim();
    qt = setTimeout(function () { query = v; applyFilter(); }, 120);
  });

  /* category rail */
  var railObs;
  function observeRail() {
    if (railObs) railObs.disconnect();
    if (!("IntersectionObserver" in window)) return;
    railObs = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.getAttribute("data-cat");
        $$("#rail a").forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-cat") === id); });
        var a = $('#rail a[data-cat="' + id + '"]'), rail = $("#rail");
        if (a && rail.scrollWidth > rail.clientWidth) {
          var ar = a.getBoundingClientRect(), rr = rail.getBoundingClientRect();
          if (ar.left < rr.left || ar.right > rr.right) rail.scrollBy({ left: ar.left - rr.left - rr.width / 2 + ar.width / 2, behavior: "smooth" });
        }
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    $$(".cat").forEach(function (s) { railObs.observe(s); });
  }
  $("#rail").addEventListener("click", function (e) {
    var a = e.target.closest("a"); if (!a) return; e.preventDefault();
    var sec = $(a.getAttribute("href")); if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ---------------- overlay stack (Esc + phone back button) ---------------- */
  var layers = [], ignorePop = 0;
  function pushLayer(name, close, focusBack) {
    layers.push({ name: name, close: close, focusBack: focusBack || document.activeElement });
    document.body.classList.add("no-scroll");
    try { history.pushState({ apLayer: layers.length }, ""); } catch (e) {}
  }
  function closeLayer(name, fromPop) {
    var i = -1; for (var k = layers.length - 1; k >= 0; k--) if (layers[k].name === name) { i = k; break; }
    if (i < 0) return;
    var l = layers.splice(i, 1)[0]; l.close();
    if (!layers.length) document.body.classList.remove("no-scroll");
    if (!fromPop) { ignorePop++; try { history.back(); } catch (e) { ignorePop--; } }
    if (l.focusBack && l.focusBack.focus) try { l.focusBack.focus({ preventScroll: true }); } catch (e) {}
  }
  function topLayer() { return layers.length ? layers[layers.length - 1].name : null; }
  function isOpen(name) { return layers.some(function (l) { return l.name === name; }); }
  window.addEventListener("popstate", function () {
    if (ignorePop) { ignorePop--; return; }
    var top = topLayer(); if (top) closeLayer(top, true);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { var top = topLayer(); if (top) { e.preventDefault(); closeLayer(top); } else toggleFilters(false); }
    if (topLayer() === "lb") { if (e.key === "ArrowRight") lbStep(lang === "ar" ? -1 : 1); if (e.key === "ArrowLeft") lbStep(lang === "ar" ? 1 : -1); }
    if (topLayer() === "sheet" && !/INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || "")) {
      if (e.key === "ArrowRight") sheetStep(lang === "ar" ? -1 : 1); if (e.key === "ArrowLeft") sheetStep(lang === "ar" ? 1 : -1);
    }
  });
  function showScrim(on) { $("#scrim").classList.toggle("on", on); }

  /* ---------------- dish sheet ---------------- */
  var sheetItem = null, sheetUnsub = null;
  function openSheet(id) {
    var it = BY[id]; if (!it) return;
    var was = isOpen("sheet");
    sheetItem = it; fillSheet(it);
    if (!was) {
      $("#sheet").classList.add("on"); $("#sheet").setAttribute("aria-hidden", "false"); showScrim(true);
      pushLayer("sheet", function () { $("#sheet").classList.remove("on"); $("#sheet").setAttribute("aria-hidden", "true"); showScrim(false); sheetItem = null; });
      setTimeout(function () { $("#shClose").focus({ preventScroll: true }); }, 60);
    }
    $("#sheetCard").scrollTop = 0;
  }
  function visibleOrder() { return ITEMS.filter(function (it) { return visible(it); }); }
  function sheetStep(d) {
    if (!sheetItem) return;
    var list = visibleOrder(); if (!list.length) list = ITEMS;
    var i = list.indexOf(sheetItem); if (i < 0) i = 0;
    openSheet(list[(i + d + list.length) % list.length].id);
  }
  function fillSheet(it) {
    var p = photo(it), n = nm(it), x = tx(it);
    $("#shName").textContent = n;
    var alt = $("#shAlt");
    if (lang === "ar") { alt.textContent = it.name; alt.className = "alt lat"; alt.lang = "en"; alt.dir = "ltr"; }
    else { alt.textContent = x ? x.ar : ""; alt.className = "alt"; alt.lang = "ar"; alt.dir = "rtl"; }
    var gate = $("#shGate"), img = $("#shImg");
    gate.classList.toggle("noimg", !p);
    var oldPh = gate.querySelector(".ph"); if (oldPh) oldPh.remove();
    if (p) {
      img.hidden = false; img.alt = n;
      if (p.own) { img.removeAttribute("referrerpolicy"); delete img.dataset.ext; } else { img.setAttribute("referrerpolicy", "no-referrer"); img.dataset.ext = it.id; }
      img.src = p.mid;
      $("#shZoom").hidden = false;
    } else {
      img.hidden = true; img.removeAttribute("src"); $("#shZoom").hidden = true;
      var ph = document.createElement("div"); ph.className = "ph"; ph.innerHTML = ICON.orn + "<span>" + esc(t("sh.nophoto")) + "</span>";
      gate.querySelector(".fill").after(ph);
    }
    var cr = $("#shCredit");
    if (p && !p.own) cr.innerHTML = '<span class="ill">' + esc(t("sh.ill")) + "</span>" + t("sh.by", { by: '<a href="' + esc(p.e.pg) + '" target="_blank" rel="noopener">' + esc(p.e.by) + "</a>", lic: esc(p.e.lic) });
    else cr.textContent = p ? t("sh.own") : "";
    var b = '<span class="badge b-halal">' + ICON.seal + esc(t("sh.halal")) + "</span>";
    if (isVeg(it)) b += '<span class="badge veg">' + ICON.leaf + esc(t("sh.veg")) + "</span>";
    if (it.tag) b += '<span class="badge">' + esc(term(it.tag)) + "</span>";
    $("#shBadges").innerHTML = b;
    $("#shPrice").innerHTML = it.variants
      ? it.variants.map(function (v) { return "<small>" + esc(term(v.label)) + "</small>" + ksh(v.price); }).join('<span class="sep"> · </span>')
      : ksh(it.price);
    $("#shDesc").textContent = desc(it);
    var ing = ingr(it);
    $("#shIng").textContent = ing.join(lang === "ar" ? "، " : ", ");
    $("#shIng").parentNode.hidden = !ing.length;
    var al = allergens(it), box = $("#shAllergy");
    box.classList.toggle("none", !al.length);
    box.innerHTML = al.length
      ? '<div class="sh-label">' + ICON.warn + esc(t("sh.contains")) + '</div><div class="al-list">' + al.map(function (a) { return '<span class="al">' + esc(alName(a)) + "</span>"; }).join("") + "</div><p>" + esc(t("sh.allergy.p")) + "</p>"
      : '<div class="sh-label">' + esc(t("sh.noal")) + "</div><p>" + esc(t("sh.noal.p")) + "</p>";
    $("#shAnat").hidden = !ANAT[it.id];
    fillOrder(it);
    fillRatings(it);
  }
  function fillOrder(it) {
    var o = $("#shOrder");
    if (QR) { o.innerHTML = '<div class="sh-note">' + ICON.qr + "<span>" + esc(t("sh.qronly")) + "</span></div>"; return; }
    var chips = "";
    if (it.variants) chips = it.variants.map(function (v, i) { return '<button type="button" class="chip" data-add="' + it.id + '" data-v="' + i + '">' + esc(term(v.label)) + "<b>" + num(v.price) + "</b></button>"; }).join("");
    else if (it.choices) chips = it.choices.items.map(function (c, i) { return '<button type="button" class="chip" data-add="' + it.id + '" data-c="' + i + '">' + esc(term(c)) + "</button>"; }).join("");
    o.innerHTML = chips
      ? '<div class="sh-label">' + esc(it.choices ? term(it.choices.label) : t("sh.choose")) + '</div><div class="picker">' + chips + "</div>"
      : '<div class="qline"><button type="button" class="btn btn-gold" data-add="' + it.id + '">' + ICON.plus + esc(t("sh.add")) + "</button>" + qtyNote(it) + "</div>";
  }
  function qtyNote(it) { var q = cart.filter(function (l) { return l.id === it.id; }).reduce(function (a, l) { return a + l.qty; }, 0); return q ? '<span class="in-cart">' + esc(t("sh.added")) + " · " + q + "</span>" : ""; }

  $("#shClose").addEventListener("click", function () { closeLayer("sheet"); });
  $("#sheet").addEventListener("click", function (e) { if (e.target === $("#sheet")) closeLayer("sheet"); });
  $("#shPrev").addEventListener("click", function () { sheetStep(-1); });
  $("#shNext").addEventListener("click", function () { sheetStep(1); });
  function sheetZoom() { if (sheetItem && photo(sheetItem)) openLB([lbEntry(sheetItem)], 0); }
  $("#shZoom").addEventListener("click", sheetZoom);
  $("#shAnat").addEventListener("click", function () { if (sheetItem && ANAT[sheetItem.id]) openLB([anatEntry(sheetItem.id)], 0); });
  $("#shImg").addEventListener("click", sheetZoom);
  // swipe between dishes on the photo area (phones)
  (function () {
    var sx = 0, sy = 0, on = false, el = $(".sh-media");
    el.addEventListener("touchstart", function (e) { if (e.touches.length !== 1) return; on = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (!on) return; on = false; var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) sheetStep((dx < 0 ? 1 : -1) * (lang === "ar" ? -1 : 1));
    });
  })();

  /* ---------------- ratings + reviews ---------------- */
  var revShown = 5;
  function fillRatings(it) {
    var box = $("#shRate"), r = ratingOf(it.id), mine = rated[it.id];
    revShown = 5;
    box.innerHTML = '<div class="sh-label">' + esc(t("rate.title")) + '</div><div class="sh-rate-head" id="rHead">' + rateHead(r) + "</div>" +
      (mine ? '<p class="rate-done">' + stars(mine) + " " + esc(t("rate.done")) + "</p>"
            : '<button type="button" class="btn btn-line sm" id="rOpen">' + esc(t("rate.cta")) + "</button>") +
      '<form class="rate-form" id="rForm" novalidate>' +
        '<div class="star-pick" role="radiogroup" aria-label="' + esc(t("rate.your")) + '">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" role="radio" aria-checked="false" data-star="' + n + '" aria-label="' + esc(t("rate.star", { n: n })) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star" width="24" height="24"/></svg></button>'; }).join("") +
        "</div>" +
        '<textarea id="rText" maxlength="280" rows="3" placeholder="' + esc(t("rate.ph")) + '"></textarea>' +
        '<input type="text" id="rName" maxlength="30" autocomplete="given-name" placeholder="' + esc(t("rate.name")) + '">' +
        '<input type="text" class="hp" id="rHp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<p class="err" id="rErr" role="alert"></p>' +
        '<div class="row"><span class="count" id="rCount">' + esc(t("rate.chars", { n: 280 })) + '</span><span><button type="button" class="clear" id="rCancel">' + esc(t("rate.cancel")) + '</button> <button type="submit" class="btn btn-ink sm" id="rSend">' + esc(t("rate.send")) + "</button></span></div>" +
        (backend && backend.type === "local" ? '<p class="fine-print">' + esc(t("rate.local")) + "</p>" : "") +
      "</form>" +
      '<div class="reviews" id="rList"></div>';
    wireRateForm(it);
    loadReviews(it);
  }
  function rateHead(r) {
    return r ? stars(r.avg) + '<span class="rating-num">' + r.avg.toFixed(1) + '</span><span class="rating-count">' + esc(r.n === 1 ? t("rate.one") : t("rate.count", { n: r.n })) + "</span>"
             : stars(5) + '<span class="rating-num">5.0</span><span class="rating-count">' + esc(t("rate.none")) + "</span>";
  }
  var revCache = {};
  function loadReviews(it) {
    var list = $("#rList");
    function draw(rows) {
      if (!sheetItem || sheetItem.id !== it.id) return;
      var withText = rows.filter(function (r) { return r.text; });
      list.innerHTML = withText.slice(0, revShown).map(function (r) {
        return '<div class="review"><div class="who">' + stars(r.stars) + "<b>" + esc(r.name || t("rate.guest")) + "</b><span>" + esc(when(r.ts)) + "</span></div><p" + (r.lang ? ' lang="' + esc(r.lang) + '" dir="auto"' : ' dir="auto"') + ">" + esc(r.text) + "</p></div>";
      }).join("") + (withText.length > revShown ? '<button type="button" class="clear more" id="rMore">' + esc(t("rate.more")) + "</button>" : "");
      var m = $("#rMore"); if (m) m.addEventListener("click", function () { revShown += 10; draw(rows); });
    }
    if (revCache[it.id]) draw(revCache[it.id]);
    if (!backend) return;
    backend.reviews(it.id).then(function (rows) {
      revCache[it.id] = rows || [];
      // keep the summary in step with what we just read
      if (rows && rows.length) { RAT[it.id] = { n: rows.length, s: rows.reduce(function (a, r) { return a + (+r.stars || 0); }, 0) }; var h = $("#rHead"); if (h && sheetItem && sheetItem.id === it.id) h.innerHTML = rateHead(ratingOf(it.id)); }
      draw(revCache[it.id]);
    }).catch(function () {});
  }
  function when(ts) {
    try { return new Date(ts).toLocaleDateString(lang === "ar" ? "ar-EG-u-nu-latn" : lang === "sw" ? "sw-KE" : "en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch (e) { return ""; }
  }
  function wireRateForm(it) {
    var form = $("#rForm"), open = $("#rOpen"), pick = 0;
    if (open) open.addEventListener("click", function () { form.classList.add("on"); open.hidden = true; var f = form.querySelector("[data-star]"); if (f) f.focus(); });
    $("#rCancel").addEventListener("click", function () { form.classList.remove("on"); if (open) open.hidden = false; });
    $$("[data-star]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        pick = +b.getAttribute("data-star");
        $$("[data-star]", form).forEach(function (x) { var on = +x.getAttribute("data-star") <= pick; x.classList.toggle("on", on); x.setAttribute("aria-checked", String(+x.getAttribute("data-star") === pick)); });
        $("#rErr").classList.remove("on");
      });
    });
    $("#rText").addEventListener("input", function (e) { $("#rCount").textContent = t("rate.chars", { n: 280 - e.target.value.length }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("#rErr");
      if (!pick) { err.textContent = t("rate.err.stars"); err.classList.add("on"); return; }
      if ($("#rHp").value) return; // bots
      var btn = $("#rSend"); btn.disabled = true;
      var rv = { item: it.id, stars: pick, text: $("#rText").value, name: $("#rName").value, lang: lang, hp: $("#rHp").value };
      (backend ? backend.addReview(rv) : Promise.reject()).then(function (saved) {
        rated[it.id] = pick; lsSet("ap-rated", rated);
        var cur = RAT[it.id] || { n: 0, s: 0 }; RAT[it.id] = { n: cur.n + 1, s: cur.s + pick };
        revCache[it.id] = [Object.assign({ ts: Date.now() }, rv, saved || {})].concat(revCache[it.id] || []);
        refreshMeta(); toast(t("rate.thanks"));
        if (sheetItem && sheetItem.id === it.id) fillRatings(it);
      }).catch(function () { btn.disabled = false; err.textContent = t("rate.err.save"); err.classList.add("on"); });
    });
  }

  /* ---------------- photo viewer (zoom / pan / swipe) ---------------- */
  var LB = { list: [], i: 0, s: 1, x: 0, y: 0 };
  var lbImg = $("#lbImg"), lbStage = $("#lbStage");
  function lbEntry(it) {
    var p = photo(it);
    return { src: p.full, name: nm(it), sub: p.own ? "" : t("sh.ill") + " · " + p.e.by, ext: !p.own };
  }
  function openLB(list, i) {
    LB.list = list; LB.i = i; lbShow();
    if (!isOpen("lb")) {
      $("#lb").classList.add("on"); $("#lb").setAttribute("aria-hidden", "false");
      pushLayer("lb", function () { $("#lb").classList.remove("on"); $("#lb").setAttribute("aria-hidden", "true"); lbReset(); });
      setTimeout(function () { $("#lbClose").focus({ preventScroll: true }); }, 60);
    }
  }
  function lbShow() {
    var e = LB.list[LB.i]; lbReset();
    if (e.ext) lbImg.setAttribute("referrerpolicy", "no-referrer"); else lbImg.removeAttribute("referrerpolicy");
    lbImg.src = e.src; lbImg.alt = e.name;
    $("#lbName").textContent = e.name; $("#lbSub").textContent = e.sub || "";
    var many = LB.list.length > 1; $("#lbPrev").hidden = !many; $("#lbNext").hidden = !many;
  }
  function lbStep(d) { if (LB.list.length < 2) return; LB.i = (LB.i + d + LB.list.length) % LB.list.length; lbShow(); }
  function lbApply(anim) {
    lbImg.style.transition = anim ? "transform .28s cubic-bezier(.2,.7,.2,1)" : "none";
    lbImg.style.transform = "translate(" + LB.x + "px," + LB.y + "px) scale(" + LB.s + ")";
    $("#lb").classList.toggle("zoomed", LB.s > 1.01);
  }
  function lbReset() { LB.s = 1; LB.x = 0; LB.y = 0; lbApply(false); }
  function lbBase() { var r = lbImg.getBoundingClientRect(); return { l: r.left - LB.x, t: r.top - LB.y, w: r.width / LB.s, h: r.height / LB.s }; }
  function lbClamp() {
    var b = lbBase(), st = lbStage.getBoundingClientRect(), w = b.w * LB.s, h = b.h * LB.s;
    LB.x = w <= st.width ? (st.width - w) / 2 + st.left - b.l : Math.min(st.left - b.l, Math.max(st.right - w - b.l, LB.x));
    LB.y = h <= st.height ? (st.height - h) / 2 + st.top - b.t : Math.min(st.top - b.t, Math.max(st.bottom - h - b.t, LB.y));
  }
  function lbZoomAt(ns, px, py, anim) {
    ns = Math.max(1, Math.min(5, ns));
    var b = lbBase(), qx = (px - b.l - LB.x) / LB.s, qy = (py - b.t - LB.y) / LB.s;
    LB.s = ns; LB.x = px - b.l - ns * qx; LB.y = py - b.t - ns * qy;
    if (ns === 1) { LB.x = 0; LB.y = 0; } else lbClamp();
    lbApply(anim);
  }
  function lbToggleZoom(px, py) {
    if (LB.s > 1.01) lbZoomAt(1, px, py, true);
    else { var r = lbImg.getBoundingClientRect(); if (px == null) { px = r.left + r.width / 2; py = r.top + r.height / 2; } lbZoomAt(2.6, px, py, true); }
  }
  $("#lbZoom").addEventListener("click", function () { lbToggleZoom(); });
  $("#lbClose").addEventListener("click", function () { closeLayer("lb"); });
  $("#lbPrev").addEventListener("click", function () { lbStep(-1); });
  $("#lbNext").addEventListener("click", function () { lbStep(1); });
  lbImg.addEventListener("dblclick", function (e) { e.preventDefault(); lbToggleZoom(e.clientX, e.clientY); });
  lbStage.addEventListener("wheel", function (e) { if (!isOpen("lb")) return; e.preventDefault(); lbZoomAt(LB.s * (e.deltaY < 0 ? 1.18 : 1 / 1.18), e.clientX, e.clientY, false); }, { passive: false });
  lbStage.addEventListener("click", function (e) { if (e.target === lbStage) closeLayer("lb"); });
  (function () {
    var pts = {}, start = null, lastTap = 0, moved = false;
    function list() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
    lbStage.addEventListener("pointerdown", function (e) {
      if (e.target !== lbImg) return;
      lbImg.setPointerCapture && lbImg.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY }; moved = false;
      var l = list();
      if (l.length === 1) start = { x: e.clientX, y: e.clientY, ox: LB.x, oy: LB.y, t: Date.now() };
      if (l.length === 2) start = { d: Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y), s: LB.s, cx: (l[0].x + l[1].x) / 2, cy: (l[0].y + l[1].y) / 2 };
    });
    lbStage.addEventListener("pointermove", function (e) {
      if (!pts[e.pointerId] || !start) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var l = list();
      if (l.length === 2 && start.d) {
        moved = true; var d = Math.hypot(l[0].x - l[1].x, l[0].y - l[1].y);
        lbZoomAt(start.s * d / start.d, start.cx, start.cy, false);
      } else if (l.length === 1 && start.ox != null) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        if (LB.s > 1.01) { LB.x = start.ox + dx; LB.y = start.oy + dy; lbClamp(); lbApply(false); }
        else { lbImg.style.transition = "none"; lbImg.style.transform = "translate(" + dx + "px,0)"; }
      }
    });
    function end(e) {
      if (!pts[e.pointerId]) return;
      var l = list();
      if (l.length === 1 && start && start.ox != null) {
        var dx = e.clientX - start.x, dy = e.clientY - start.y;
        if (LB.s <= 1.01) {
          if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy)) lbStep((dx < 0 ? 1 : -1) * (lang === "ar" ? -1 : 1)); else lbApply(true);
        }
        if (!moved && e.pointerType !== "mouse") {
          var now = Date.now();
          if (now - lastTap < 300) { lbToggleZoom(e.clientX, e.clientY); lastTap = 0; } else lastTap = now;
        }
      }
      delete pts[e.pointerId];
      var rest = list();
      start = rest.length === 1 ? { x: rest[0].x, y: rest[0].y, ox: LB.x, oy: LB.y } : null;
      if (LB.s < 1.02 && LB.s !== 1) lbZoomAt(1, 0, 0, true);
    }
    lbStage.addEventListener("pointerup", end); lbStage.addEventListener("pointercancel", end);
  })();

  /* ---------------- gallery ---------------- */
  var STORY_IMG = ["roast-lamb-rice", "whole-roast-goat"];
  var GAL = D.gallery.filter(function (g) { return STORY_IMG.indexOf(g.img) < 0; });
  function galName(g) { if (lang === "en") return g.name; var x = I.gal[g.img]; return (x && x[lang]) || g.name; }
  function renderGallery() {
    $$("[data-gal-img]").forEach(function (el) { var g = D.gallery.filter(function (x) { return x.img === el.getAttribute("data-gal-img"); })[0]; if (g) el.setAttribute("aria-label", t("sh.zoom") + ": " + galName(g)); });
    $("#galTrack").innerHTML = GAL.map(function (g, i) {
      return '<button type="button" class="tile" role="listitem" data-gal="' + i + '"><span class="gate"><span class="fill"></span><img class="photo" src="img/gallery/' + esc(g.img) + '.webp" alt="" loading="lazy" decoding="async" width="600" height="800">' +
        '<svg class="arch"><use href="#o-arch" width="100%" height="100%"/></svg><span class="plinth"></span></span><span class="cap">' + esc(galName(g)) + (g.note ? "<small>" + esc(g.note === "Pre-order a day ahead" && lang !== "en" ? term("Pre-order") : g.note) + "</small>" : "") + "</span></button>";
    }).join("");
  }
  $("#galTrack").addEventListener("click", function (e) {
    var b = e.target.closest("[data-gal]"); if (!b) return;
    openLB(GAL.map(function (g) { return { src: "img/photos/" + g.img + ".webp", name: galName(g), sub: "" }; }), +b.getAttribute("data-gal"));
  });
  function openStory(el) {
    var list = STORY_IMG.map(function (s) { var g = D.gallery.filter(function (x) { return x.img === s; })[0]; return { src: "img/photos/" + s + ".webp", name: g ? galName(g) : "", sub: "" }; });
    openLB(list, Math.max(0, STORY_IMG.indexOf(el.getAttribute("data-gal-img"))));
  }
  $$("[data-gal-img]").forEach(function (el) {
    el.addEventListener("click", function () { openStory(el); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStory(el); } });
  });
  function galScroll(d) { var tr = $("#galTrack"); tr.scrollBy({ left: d * tr.clientWidth * 0.8 * (lang === "ar" ? -1 : 1), behavior: "smooth" }); }
  $("#galPrev").addEventListener("click", function () { galScroll(-1); });
  $("#galNext").addEventListener("click", function () { galScroll(1); });

  /* ---------------- souq (atmosphere photos, free-licence) ---------------- */
  var SOUQ = [
    ["amb-spices", { en: "Spices from the souq", ar: "بهارات من السوق", sw: "Viungo kutoka sokoni" }],
    ["amb-coffee-dates", { en: "Arabic coffee", ar: "القهوة العربية", sw: "Kahawa ya Kiarabu" }],
    ["amb-dates-bowl", { en: "Dates for every guest", ar: "تمر لكل ضيف", sw: "Tende kwa kila mgeni" }],
    ["amb-grill", { en: "Over the coals", ar: "على الجمر", sw: "Juu ya makaa" }],
    ["amb-mint-tea", { en: "Tea, poured slowly", ar: "شاي يُصبّ على مهل", sw: "Chai, inayomiminwa taratibu" }]
  ];
  function renderSouq() {
    var g = $("#souqGrid"); if (!g) return;
    var rows = SOUQ.filter(function (s) { return AMB[s[0]]; });
    $("#souq").hidden = !rows.length;
    g.innerHTML = rows.map(function (s, i) {
      var e = AMB[s[0]];
      return '<figure class="souq-tile" data-souq="' + i + '" data-amb="' + s[0] + '"><button type="button" class="gate" aria-label="' + esc(s[1][lang]) + '"><span class="fill"></span><img class="photo" src="' + "img/stock/amb/" + s[0] + ".webp" + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="600" height="800">' +
        '<svg class="arch"><use href="#o-arch" width="100%" height="100%"/></svg></button><figcaption>' + esc(s[1][lang]) + "</figcaption></figure>";
    }).join("");
    g.onclick = function (ev) {
      var f = ev.target.closest("[data-souq]"); if (!f) return;
      openLB(rows.map(function (s) { var e = AMB[s[0]]; return { src: "img/stock/amb-full/" + s[0] + ".webp", name: s[1][lang], sub: t("sh.ill") + " · " + e.by, ext: true }; }), +f.getAttribute("data-souq"));
    };
  }

  /* ---------------- basket (online orders, sent on WhatsApp) ---------------- */
  var cart = QR ? [] : ssGet("ap-cart", []);
  function saveCart() { ssSet("ap-cart", cart); }
  function cartCount() { return cart.reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartSum() { return cart.reduce(function (a, l) { return a + l.qty * l.price; }, 0); }
  function addToCart(id, vi, ci, btn) {
    var it = BY[id]; if (!it || QR) return;
    var price = it.price, opt = "", key = id;
    if (vi != null && it.variants) { price = it.variants[vi].price; opt = it.variants[vi].label; key += "|v" + vi; }
    if (ci != null && it.choices) { opt = it.choices.items[ci]; key += "|c" + ci; }
    var l = cart.filter(function (x) { return x.key === key; })[0];
    if (l) l.qty++; else cart.push({ key: key, id: id, opt: opt, price: price, qty: 1 });
    saveCart(); renderCart(); updateCartBadges();
    toast(t("toast.added", { name: nm(it) + (opt ? " · " + term(opt) : "") }));
    var row = $('.item[data-id="' + id + '"]'); if (row) row.classList.remove("open");
    if (btn) { btn.classList.add("in"); setTimeout(function () { btn.classList.remove("in"); }, 700); }
    if (sheetItem && sheetItem.id === id) fillOrder(it);
  }
  function updateCartBadges() {
    var n = cartCount(), c = $("#cartCount");
    c.textContent = n; c.classList.toggle("on", n > 0);
    var ob = $("#orderbar");
    ob.classList.toggle("on", !QR && n > 0 && !isOpen("drawer"));
    $("#obCount").textContent = n === 1 ? t("ob.item") : t("ob.items", { n: n });
    $("#obSum").textContent = ksh(cartSum());
    var ac = $("#abCount"); if (ac) { ac.textContent = n; ac.classList.toggle("on", n > 0); $("#abSum").textContent = n ? ksh(cartSum()) : ""; }
  }
  function renderCart() {
    var has = cart.length > 0, sentOn = $("#sent").classList.contains("on");
    $("#cartEmpty").hidden = has || sentOn;
    $("#cartFilled").hidden = !has || sentOn;
    $("#drawerFoot").hidden = !has || sentOn;
    $("#lines").innerHTML = cart.map(function (l, i) {
      var it = BY[l.id], n = it ? nm(it) : l.id;
      return '<div class="line"><div><div class="n">' + esc(n) + "</div>" + (l.opt ? '<div class="v">' + esc(term(l.opt)) + "</div>" : "") +
        '<div class="qty"><button type="button" data-q="' + i + '" data-d="-1" aria-label="' + esc(l.qty > 1 ? t("cart.less") : t("cart.remove", { name: n })) + '">' + ICON.minus + "</button><output>" + l.qty + '</output><button type="button" data-q="' + i + '" data-d="1" aria-label="' + esc(t("cart.plus")) + '">' + ICON.plus + "</button></div></div>" +
        '<div class="p">' + ksh(l.qty * l.price) + "</div></div>";
    }).join("");
    $("#tCount").textContent = cartCount(); $("#tSum").textContent = ksh(cartSum());
    renderType();
  }
  $("#lines").addEventListener("click", function (e) {
    var b = e.target.closest("[data-q]"); if (!b) return;
    var i = +b.getAttribute("data-q"), d = +b.getAttribute("data-d");
    cart[i].qty += d; if (cart[i].qty <= 0) cart.splice(i, 1);
    saveCart(); renderCart(); updateCartBadges();
  });
  function openDrawer() {
    if (isOpen("drawer")) return;
    renderCart();
    $("#drawer").classList.add("on"); $("#drawer").setAttribute("aria-hidden", "false"); showScrim(true);
    pushLayer("drawer", function () { $("#drawer").classList.remove("on"); $("#drawer").setAttribute("aria-hidden", "true"); if (!isOpen("sheet")) showScrim(false); updateCartBadges(); });
    updateCartBadges();
    setTimeout(function () { $("#closeDrawer").focus({ preventScroll: true }); }, 60);
  }
  $("#cartBtn").addEventListener("click", openDrawer);
  $("#orderbar").addEventListener("click", openDrawer);
  $("#closeDrawer").addEventListener("click", function () { closeLayer("drawer"); });
  $("#scrim").addEventListener("click", function () { var top = topLayer(); if (top === "drawer" || top === "sheet") closeLayer(top); });
  $("#emptyGo").addEventListener("click", function () { closeLayer("drawer"); $("#menu").scrollIntoView({ behavior: "smooth" }); });

  var otype = ssGet("ap-otype", TYPES[0]); if (TYPES.indexOf(otype) < 0) otype = TYPES[0];
  (function () {
    var g = $("#oType");
    g.innerHTML = TYPES.map(function (x) { return '<button type="button" role="radio" data-otype="' + x + '"><span data-i18n="cart.' + x + '"></span></button>'; }).join("");
    $("#oTypeWrap").hidden = TYPES.length < 2;
    g.addEventListener("click", function (e) { var b = e.target.closest("[data-otype]"); if (!b) return; otype = b.getAttribute("data-otype"); ssSet("ap-otype", otype); renderType(); });
    var keep = ssGet("ap-who", {});
    $("#oName").value = keep.name || ""; $("#oAddr").value = keep.addr || "";
    ["#oName", "#oAddr", "#fNotes"].forEach(function (sel) { $(sel).addEventListener("input", function () { ssSet("ap-who", { name: $("#oName").value, addr: $("#oAddr").value }); $("#oErr").classList.remove("on"); }); });
  })();
  function renderType() {
    $$("#oType [data-otype]").forEach(function (b) { var on = b.getAttribute("data-otype") === otype; b.setAttribute("aria-checked", String(on)); b.querySelector("span").textContent = t("cart." + b.getAttribute("data-otype")); });
    $("#oAddrField").hidden = otype !== "delivery";
  }
  function waNumber() { return String(C.whatsapp || "254797666667").replace(/\D/g, ""); }
  function waLink(text) { return "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(text); }
  function waText() {
    var name = $("#oName").value.trim(), addr = $("#oAddr").value.trim(), notes = $("#fNotes").value.trim();
    var s = t("wa.hello") + "\n\n" + cart.map(function (l) {
      var it = BY[l.id];
      return "• " + l.qty + " × " + (it ? it.name : l.id) + (lang !== "en" && it ? " / " + nm(it) : "") + (l.opt ? " (" + l.opt + ")" : "") + " — " + ksh(l.qty * l.price);
    }).join("\n");
    s += "\n\n" + t("cart.subtotal") + ": " + ksh(cartSum());
    s += "\n" + t("wa.name") + ": " + name;
    s += "\n" + (otype === "delivery" ? t("wa.delivery") + ": " + addr : t("wa.pickup"));
    if (notes) s += "\n" + t("wa.notes") + ": " + notes;
    return s;
  }
  function sendOrder(e) {
    var a = $("#sendBtn"), err = $("#oErr");
    if (!cart.length) { e.preventDefault(); return; }
    var miss = !$("#oName").value.trim() ? ["cart.need.name", "#oName"] : otype === "delivery" && !$("#oAddr").value.trim() ? ["cart.need.addr", "#oAddr"] : null;
    if (miss) { e.preventDefault(); err.textContent = t(miss[0]); err.classList.add("on"); $(miss[1]).focus(); return; }
    a.href = waLink(waText());   // the link opens WhatsApp (app or web) with the order written out
    lastWa = a.href;
    setTimeout(function () { $("#sent").classList.add("on"); renderCart(); }, 400);
  }
  var lastWa = "";
  $("#sendBtn").addEventListener("click", sendOrder);
  $("#waAgain").addEventListener("click", function () { if (lastWa) $("#waAgain").href = lastWa; });
  $("#newOrder").addEventListener("click", function () { cart = []; saveCart(); $("#fNotes").value = ""; $("#sent").classList.remove("on"); renderCart(); updateCartBadges(); closeLayer("drawer"); });
  $("#backOrder").addEventListener("click", function () { $("#sent").classList.remove("on"); renderCart(); });

  /* ---------------- modals ---------------- */
  function openModal(id, onClose) {
    var m = $("#" + id); m.classList.add("on"); m.setAttribute("aria-hidden", "false");
    pushLayer(id, function () { m.classList.remove("on"); m.setAttribute("aria-hidden", "true"); if (onClose) onClose(); });
    setTimeout(function () { var c = m.querySelector("[data-close-modal]"); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  $$("[data-close-modal]").forEach(function (b) { b.addEventListener("click", function () { closeLayer(b.closest(".modal").id); }); });
  $$(".modal").forEach(function (m) { m.addEventListener("click", function (e) { if (e.target === m) closeLayer(m.id); }); });

  /* ---------------- credits ---------------- */
  $("#creditsBtn").addEventListener("click", function () {
    var rows = ITEMS.filter(function (it) { return !it.img && STK[it.id]; }).map(function (it) { return [nm(it), STK[it.id]]; });
    SOUQ.forEach(function (s) { if (AMB[s[0]]) rows.push([s[1][lang], AMB[s[0]]]); });
    var GT = (window.STOCK && window.STOCK.gates) || {}, GN = { en: "English · London", ar: "العربية · نزوى", sw: "Kiswahili · Zanzibar" };
    Object.keys(GT).forEach(function (k) { rows.push([GN[k] || k, GT[k]]); });
    rows.sort(function (a, b) { return a[0].localeCompare(b[0], lang); });
    $("#crList").innerHTML = rows.map(function (r) {
      return "<div><span>" + esc(r[0]) + '</span><a href="' + esc(r[1].pg) + '" target="_blank" rel="noopener">' + esc(r[1].by) + " · " + esc(r[1].lic) + "</a></div>";
    }).join("") + '<p class="fine-print" style="margin-top:.6rem">' + esc(t("cr.own")) + "</p>";
    openModal("credits");
  });

  /* ---------------- profile viewer ---------------- */
  var PAGES = Math.max(1, +C.profilePages || 6), pg = 1;
  function pdfShow() {
    $("#pdfImg").src = "profile/page-" + pg + ".webp"; $("#pdfImg").alt = t("prof.page", { n: pg, t: PAGES });
    $("#pdfPg").textContent = t("prof.page", { n: pg, t: PAGES });
    $("#pdfPrev").disabled = pg === 1; $("#pdfNext").disabled = pg === PAGES;
    if (pg < PAGES) { var pre = new Image(); pre.src = "profile/page-" + (pg + 1) + ".webp"; }
  }
  function openProfile() { pg = 1; pdfShow(); openModal("pdfModal"); }
  $("#pdfPrev").addEventListener("click", function () { if (pg > 1) { pg--; pdfShow(); } });
  $("#pdfNext").addEventListener("click", function () { if (pg < PAGES) { pg++; pdfShow(); } });
  $("#pdfImg").addEventListener("click", function () { openLB(Array.from({ length: PAGES }, function (_, i) { return { src: "profile/page-" + (i + 1) + ".webp", name: t("prof.title2"), sub: t("prof.page", { n: i + 1, t: PAGES }) }; }), pg - 1); });
  (function () {
    var sx = 0, v = $(".pdf-view");
    v.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    v.addEventListener("touchend", function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 60) { var d = (dx < 0 ? 1 : -1) * (lang === "ar" ? -1 : 1); pg = Math.max(1, Math.min(PAGES, pg + d)); pdfShow(); } });
  })();
  $("#pdfView").addEventListener("click", openProfile);
  $("#pdfCover").addEventListener("click", openProfile);
  $("#heroProfile").addEventListener("click", openProfile);

  /* ---------------- global click delegation ---------------- */
  document.addEventListener("click", function (e) {
    var o = e.target.closest("[data-open]"); if (o) { e.preventDefault(); openSheet(o.getAttribute("data-open")); return; }
    var z = e.target.closest("[data-zoom]");
    if (z) {
      var id = z.getAttribute("data-zoom"), row = z.closest(".items");
      var list = (row ? $$(".item:not(.hidden)", row) : []).map(function (el) { return BY[el.getAttribute("data-id")]; }).filter(function (it) { return it && photo(it); });
      var i = list.indexOf(BY[id]); if (i < 0) { list = [BY[id]]; i = 0; }
      openLB(list.map(lbEntry), i); return;
    }
    var ab = e.target.closest("[data-addbtn]");
    if (ab) {
      var it = BY[ab.getAttribute("data-addbtn")];
      if (it.variants || it.choices) { var r = ab.closest(".item"); $$(".item.open").forEach(function (x) { if (x !== r) x.classList.remove("open"); }); r.classList.toggle("open"); }
      else addToCart(it.id, null, null, ab);
      return;
    }
    var ad = e.target.closest("[data-add]");
    if (ad) { addToCart(ad.getAttribute("data-add"), ad.hasAttribute("data-v") ? +ad.getAttribute("data-v") : null, ad.hasAttribute("data-c") ? +ad.getAttribute("data-c") : null, ad); return; }
  });

  /* stand-in photo failed to load: swap in the ornament, never a broken image */
  document.addEventListener("error", function (e) {
    var el = e.target; if (!el || el.tagName !== "IMG") return;
    var tile = el.closest && el.closest(".souq-tile");
    if (tile) { tile.hidden = true; if (!$$(".souq-tile:not([hidden])").length) $("#souq").hidden = true; return; }
    var id = el.getAttribute("data-ext"); if (!id) return;
    FAILED[id] = true;
    var btn = el.closest(".thumb-btn");
    if (btn) { var s = document.createElement("span"); s.className = "thumb-empty"; s.setAttribute("aria-hidden", "true"); s.innerHTML = ICON.orn; btn.replaceWith(s); return; }
    if (el.id === "shImg" && sheetItem && sheetItem.id === id) fillSheet(sheetItem);
  }, true);

  /* ---------------- misc ---------------- */
  var toastT;
  function toast(msg) { var el = $("#toast"); el.textContent = msg; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("on"); }, 2600); }
  $("#copyPhone").addEventListener("click", function () {
    var n = "0797 666 667";
    (navigator.clipboard ? navigator.clipboard.writeText(n) : Promise.reject()).then(function () { toast(t("visit.copied")); }).catch(function () {
      var r = document.createRange(); r.selectNodeContents($("#phoneText")); var s = getSelection(); s.removeAllRanges(); s.addRange(r);
    });
  });
  $("#year").textContent = new Date().getFullYear();

  var rvObs = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches
    ? new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); rvObs.unobserve(en.target); } }); }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  function reveal() {
    if (!rvObs) return;
    $$("[data-rv]:not(.rv)").forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) return; // already on screen: leave it
      el.classList.add("rv"); rvObs.observe(el);
    });
  }

  /* ---------------- hero: the food-anatomy posters ----------------
     Four restaurant posters stacked like cards. The front one opens the dish; the tabs (or a swipe) bring
     another to the front. It turns over on its own every few seconds until the guest picks one, and never
     when they prefer reduced motion, while the pointer or focus is on it, or while it is off screen. */
  var ANAT = { "laham-mandi": 1, "laham-hanidh": 1, "zurbian": 1, "laham-madhbi": 1 };
  /* ---------------- food-anatomy labels ----------------
     The posters' printed words were cleared; the dish name and what is on the plate are drawn here, in the
     guest's language: as SVG over the photo in the hero, and onto a canvas for the large view.
     Positions: dots in poster pixels, labels in units of a 900 px tall view (see tools/anat_clean.py). */
  var ANAT_L = {"laham-mandi":{"w":1086,"h":1448,"title":141,"dots":{"green":[359,522],"sahawiq":[660,478],"salad":[827,686],"mandirice":[336,1044],"meat":[562,993]},"labels":[["green","L",22,243],["sahawiq","R",655,222],["salad","R",657,330],["mandirice","L",30,768],["meat","C",348,836]]},"laham-hanidh":{"w":1214,"h":1295,"title":141,"dots":{"sahawiq":[399,502],"whiterice":[732,412],"salad":[952,632],"green":[327,876],"meat":[602,864]},"labels":[["sahawiq","L",36,220],["whiterice","R",806,220],["salad","R",818,345],["green","L",36,786],["meat","C",418,852]]},"laham-madhbi":{"w":1215,"h":1295,"title":146,"dots":{"sahawiq":[459,421],"green":[331,576],"meat":[660,572],"raisins":[909,666],"salad":[268,936],"whiterice":[664,1095]},"labels":[["sahawiq","L",100,220],["green","L",20,316],["meat","R",818,228],["raisins","R",828,352,150],["salad","L",40,742],["whiterice","R",652,857]]},"zurbian":{"w":1086,"h":1448,"title":158,"dots":{"green":[326,572],"sahawiq":[600,480],"salad":[803,674],"potato":[410,952],"meat":[554,871],"zurbianrice":[699,1082]},"labels":[["green","L",24,262],["sahawiq","R",588,229],["salad","R",652,330],["potato","L",30,741],["meat","C",340,812],["zurbianrice","R",640,773]]}};
  var anCtx = null;
  function anFont(kind, v) {
    var ar = lang === "ar";
    if (kind === "title") return (ar ? "800 " : "600 ") + Math.round((ar ? 50 : 44) * v) + "px " + (ar ? "Tajawal, Tahoma, sans-serif" : "Fraunces, Georgia, serif");
    if (kind === "sub") return (ar ? "700 " : "700 ") + Math.round((ar ? 17 : 12.5) * v) + "px " + (ar ? "Tajawal, Tahoma, sans-serif" : "Manrope, 'Segoe UI', sans-serif");
    return (ar ? "700 " : "600 ") + Math.round((ar ? 22.5 : 19) * v) + "px " + (ar ? "Tajawal, Tahoma, sans-serif" : "Fraunces, Georgia, serif");
  }
  function anMeasure(s, font, sp) {
    if (!anCtx) anCtx = document.createElement("canvas").getContext("2d");
    anCtx.font = font; return anCtx.measureText(s).width + (sp || 0) * Math.max(0, s.length - 1);
  }
  function anText(key) { var s = t("anat." + key); return lang === "ar" ? s : s.toLocaleUpperCase(lang === "sw" ? "sw" : "en"); }
  function anList(a) {
    if (a.length < 2) return a.join("");
    var and = lang === "ar" ? " و" : lang === "sw" ? " na " : " and ", sep = lang === "ar" ? "، " : ", ";
    return a.slice(0, -1).join(sep) + and + a[a.length - 1];
  }
  function anAlt(id) {
    var L = ANAT_L[id], it = BY[id]; if (!L || !it) return "";
    var parts = L.labels.filter(function (l) { return l[0] !== "meat"; }).map(function (l) { return t("anat." + l[0]).toLocaleLowerCase(); });
    if (lang === "ar") parts = L.labels.filter(function (l) { return l[0] !== "meat"; }).map(function (l) { return t("anat." + l[0]); });
    return t("hero.anat.alt2", { dish: nm(it), parts: anList(parts) });
  }
  /* everything to draw, in poster pixels */
  function anGeo(id) {
    var L = ANAT_L[id], it = BY[id]; if (!L) return null;
    var v = L.h / 900, W = L.w, ar = lang === "ar", o = { W: W, H: L.h, v: v, items: [] };
    // title, divider, subtitle
    var title = ar ? nm(it) : nm(it).toLocaleUpperCase(lang === "sw" ? "sw" : "en"), tf = anFont("title", v), tsp = ar ? 0 : 1.6 * v;
    var tw = anMeasure(title, tf, tsp), max = W * .78;
    if (tw > max) { var sc = max / tw; tf = tf.replace(/(\d+)px/, function (m, n) { return Math.floor(n * sc) + "px"; }); tw = max; }
    var ty = L.title * v;
    o.items.push({ k: "text", s: title, x: W / 2, y: ty, a: "middle", f: tf, sp: tsp, fill: "url(#anG-" + id + ")", cls: "an-title" });
    var dl = Math.max(Math.min(tw * .86, W * .62), 170 * v), dy = ty + 13 * v;
    o.items.push({ k: "line", x1: W / 2 - dl / 2, y1: dy, x2: W / 2 + dl / 2, y2: dy, w: 1.5 * v, cls: "an-rule" });
    o.items.push({ k: "dia", x: W / 2, y: dy, r: 4.2 * v });
    var sub = ar ? t("anat.sub") : t("anat.sub").toLocaleUpperCase(lang === "sw" ? "sw" : "en"), sf = anFont("sub", v), ssp = ar ? 0 : 5.2 * v;
    o.items.push({ k: "text", s: sub, x: W / 2, y: dy + (ar ? 30 : 27) * v, a: "middle", f: sf, sp: ssp, fill: "#E9CF8E", cls: "an-sub" });
    // labels
    var lf = anFont("label", v), lsp = ar ? 0 : 1.1 * v, lh = (ar ? 26 : 22) * v;
    L.labels.forEach(function (l, i) {
      var key = l[0], side = l[1], x = l[2] * v, u = l[3] * v, d = L.dots[key]; if (!d) return;
      var s = anText(key), lines = [s];
      var maxw = l[4] ? l[4] * v : W * .3;
      if (anMeasure(s, lf, lsp) > maxw && s.indexOf(" ") > 0) {      // long names wrap onto two lines
        var ws = s.split(" "), best = null;
        for (var j = 1; j < ws.length; j++) { var a = ws.slice(0, j).join(" "), b = ws.slice(j).join(" "), m = Math.max(anMeasure(a, lf, lsp), anMeasure(b, lf, lsp)); if (!best || m < best[0]) best = [m, a, b]; }
        lines = [best[1], best[2]];
      }
      var w = Math.max.apply(null, lines.map(function (q) { return anMeasure(q, lf, lsp); }));
      var x0 = side === "L" ? x : side === "R" ? x - w : x - w / 2, x1 = x0 + w, base = u - 9 * v, pad = 5 * v, ext = 16 * v;
      var anchor = side === "L" ? "start" : side === "R" ? "end" : "middle", tx = side === "L" ? x0 : side === "R" ? x1 : x;
      if (ar) { anchor = "middle"; tx = (x0 + x1) / 2; }
      lines.forEach(function (q, j) { o.items.push({ k: "text", s: q, x: tx, y: base - (lines.length - 1 - j) * lh, a: anchor, f: lf, sp: lsp, fill: "#F8F1E4", cls: "an-t", n: i }); });
      var ux0 = x0 - pad, ux1 = x1 + pad, from;
      if (side === "L") { ux1 += ext; from = [ux1, u]; }
      else if (side === "R") { ux0 -= ext; from = [ux0, u]; }
      else from = [x, base - (lines.length - 1) * lh - 20 * v];
      o.items.push({ k: "line", x1: ux0, y1: u, x2: ux1, y2: u, w: 1.7 * v, cls: "an-u", n: i });
      o.items.push({ k: "dia", x: (x0 + x1) / 2, y: u, r: 4.4 * v, n: i });
      o.items.push({ k: "line", x1: from[0], y1: from[1], x2: d[0], y2: d[1], w: 2.1 * v, cls: "an-l", n: i });
      o.items.push({ k: "dot", x: d[0], y: d[1], r: 6.4 * v, n: i });
    });
    return o;
  }
  var SVGNS = "http://www.w3.org/2000/svg";
  function anSvg(id) {
    var g = anGeo(id); if (!g) return null;
    var el = function (n, a) { var e = document.createElementNS(SVGNS, n); for (var k in a) e.setAttribute(k, a[k]); return e; };
    var svg = el("svg", { "class": "sc-anat", viewBox: "0 0 " + g.W + " " + g.H, "aria-hidden": "true", focusable: "false" });
    var defs = el("defs", {}), gr = el("linearGradient", { id: "anG-" + id, x1: "0", y1: "0", x2: "0", y2: "1" });
    [["0", "#FBE7A9"], [".55", "#D9AE55"], ["1", "#A9782A"]].forEach(function (s) { gr.appendChild(el("stop", { offset: s[0], "stop-color": s[1] })); });
    defs.appendChild(gr); svg.appendChild(defs);
    g.items.forEach(function (it) {
      var d = it.n != null ? { style: "--i:" + it.n } : {};
      if (it.k === "text") {
        var e = el("text", Object.assign(d, { x: it.x.toFixed(1), y: it.y.toFixed(1), "text-anchor": it.a, fill: it.fill, "class": it.cls }));
        e.style.font = it.f; if (it.sp) e.setAttribute("letter-spacing", it.sp.toFixed(2)); if (lang === "ar") e.setAttribute("direction", "rtl");
        e.textContent = it.s; svg.appendChild(e);
      } else if (it.k === "line") {
        svg.appendChild(el("line", Object.assign(d, { x1: it.x1.toFixed(1), y1: it.y1.toFixed(1), x2: it.x2.toFixed(1), y2: it.y2.toFixed(1), "stroke-width": it.w.toFixed(2), "class": it.cls, pathLength: "1" })));
      } else if (it.k === "dia") {
        var r = it.r; svg.appendChild(el("path", Object.assign(d, { d: "M" + it.x + " " + (it.y - r) + "L" + (it.x + r) + " " + it.y + "L" + it.x + " " + (it.y + r) + "L" + (it.x - r) + " " + it.y + "Z", "class": "an-d" })));
      } else if (it.k === "dot") {
        svg.appendChild(el("circle", Object.assign({}, d, { cx: it.x, cy: it.y, r: (it.r * 1.75).toFixed(1), "class": "an-ring" })));
        svg.appendChild(el("circle", Object.assign({}, d, { cx: it.x, cy: it.y, r: it.r.toFixed(1), "class": "an-dot" })));
      }
    });
    return svg;
  }
  function anDraw() {
    document.querySelectorAll(".sc-card").forEach(function (c) {
      var old = c.querySelector(".sc-anat"); if (old) old.remove();
      var s = anSvg(c.dataset.id); if (s) c.appendChild(s);
    });
  }
  /* the large view: the clean photo with the same labels painted on */
  function anCanvas(id, img) {
    var g = anGeo(id); if (!g || !img || !img.naturalWidth) return null;
    var sc = Math.min(1, 1400 / g.W), c = document.createElement("canvas"); c.width = Math.round(g.W * sc); c.height = Math.round(g.H * sc);
    var x = c.getContext("2d"); x.scale(sc, sc); x.drawImage(img, 0, 0, g.W, g.H);
    var grad = x.createLinearGradient(0, 0, 0, g.H * .13); grad.addColorStop(0, "#FBE7A9"); grad.addColorStop(.12, "#FBE7A9"); grad.addColorStop(.5, "#D9AE55"); grad.addColorStop(1, "#A9782A");
    g.items.forEach(function (it) {
      if (it.k === "text") {
        x.font = it.f; x.fillStyle = it.fill.indexOf("url(") === 0 ? grad : it.fill; x.textBaseline = "alphabetic"; x.direction = lang === "ar" ? "rtl" : "ltr";
        if (!it.sp) { x.textAlign = it.a === "middle" ? "center" : it.a === "end" ? (lang === "ar" ? "left" : "right") : (lang === "ar" ? "right" : "left"); x.fillText(it.s, it.x, it.y); }
        else {   // letter-spaced Latin: set glyph by glyph
          var w = anMeasure(it.s, it.f, it.sp), cx = it.a === "middle" ? it.x - w / 2 : it.a === "end" ? it.x - w : it.x; x.textAlign = "left";
          for (var i = 0; i < it.s.length; i++) { x.fillText(it.s[i], cx, it.y); x.font = it.f; cx += x.measureText(it.s[i]).width + it.sp; }
        }
      } else if (it.k === "line") { x.strokeStyle = it.cls === "an-rule" ? "rgba(217,174,85,.75)" : "#D9B25E"; x.lineWidth = it.w; x.beginPath(); x.moveTo(it.x1, it.y1); x.lineTo(it.x2, it.y2); x.stroke(); }
      else if (it.k === "dia") { x.fillStyle = "#E3C178"; x.beginPath(); x.moveTo(it.x, it.y - it.r); x.lineTo(it.x + it.r, it.y); x.lineTo(it.x, it.y + it.r); x.lineTo(it.x - it.r, it.y); x.closePath(); x.fill(); }
      else if (it.k === "dot") { x.fillStyle = "rgba(247,231,184,.28)"; x.beginPath(); x.arc(it.x, it.y, it.r * 1.75, 0, 7); x.fill(); x.fillStyle = "#F7E7B8"; x.strokeStyle = "#C99A45"; x.lineWidth = 1.4 * g.v; x.beginPath(); x.arc(it.x, it.y, it.r, 0, 7); x.fill(); x.stroke(); }
    });
    try { return c.toDataURL("image/jpeg", .9); } catch (e) { return null; }
  }
  function anatEntry(id) {
    var it = BY[id], card = document.querySelector('.sc-card[data-id="' + id + '"] img');
    var src = card ? anCanvas(id, card) : null;
    return { src: src || "img/hero/" + id + "-plate-960.webp", name: it ? nm(it) : "", sub: t("hero.anat.sub") };
  }
  var SC = { i: 0, cards: [], tabs: [], hold: {}, swiped: false };
  function scRender() {
    var box = $("#showcase"); if (!box) return;
    SC.cards.forEach(function (c) {
      var it = BY[c.dataset.id], n = it ? nm(it) : "";
      c.querySelector("img").alt = anAlt(c.dataset.id) || t("hero.anat.alt", { dish: n });
      c.setAttribute("aria-label", t("hero.anat.card", { dish: n }));
    });
    var it = BY[SC.cards[SC.i].dataset.id];
    $("#scPrice").textContent = it ? ksh(it.price) : "";
    $("#scOpen").textContent = QR ? t("sig.see") : t("hero.anat.open");
    if (SC.drawnLang !== lang) { SC.drawnLang = lang; anDraw(); }
  }
  function scRun() {
    var box = $("#showcase"); if (!box) return;
    var held = Object.keys(SC.hold).some(function (k) { return SC.hold[k]; });
    box.classList.toggle("paused", held);
  }
  function scGo(n, manual) {
    var N = SC.cards.length; n = ((n % N) + N) % N;
    var box = $("#showcase");
    if (manual) box.classList.add("manual");
    SC.i = n;
    SC.cards.forEach(function (c, i) {
      var pos = (i - n + N) % N;
      c.dataset.pos = pos; c.tabIndex = pos ? -1 : 0;
      if (pos) c.setAttribute("aria-hidden", "true"); else c.removeAttribute("aria-hidden");
    });
    SC.tabs.forEach(function (b, i) {
      var on = i === n; b.setAttribute("aria-selected", on ? "true" : "false"); b.tabIndex = on ? 0 : -1;
      var bar = b.querySelector("i"); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = "";
    });
    scRender();
  }
  (function scInit() {
    var st = $("#scStage"); if (!st) return;
    var box = $("#showcase");
    SC.cards = [].slice.call(st.querySelectorAll(".sc-card"));
    SC.tabs = [].slice.call(document.querySelectorAll("#scTabs [role=tab]"));
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) box.classList.add("manual");
    SC.cards.forEach(function (c, i) {
      c.querySelector("img").draggable = false;
      c.addEventListener("click", function () {
        if (SC.swiped) { SC.swiped = false; return; }
        if (+c.dataset.pos === 0) openSheet(c.dataset.id); else scGo(i, true);
      });
    });
    SC.tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { scGo(i, true); });
      b.querySelector("i").addEventListener("animationend", function () { if (+b.getAttribute("aria-selected") || b.getAttribute("aria-selected") === "true") scGo(SC.i + 1); });
    });
    $("#scTabs").addEventListener("keydown", function (e) {
      var k = e.key, d = k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0;
      if (lang === "ar") d = -d;
      if (k === "Home" || k === "End" || d) {
        e.preventDefault();
        scGo(k === "Home" ? 0 : k === "End" ? SC.cards.length - 1 : SC.i + d, true);
        SC.tabs[SC.i].focus();
      }
    });
    $("#scOpen").addEventListener("click", function () { openSheet(SC.cards[SC.i].dataset.id); });
    // swipe on phones (and drag with a mouse)
    var x0 = null, y0 = 0;
    st.addEventListener("pointerdown", function (e) { x0 = e.clientX; y0 = e.clientY; });
    st.addEventListener("pointercancel", function () { x0 = null; });
    st.addEventListener("pointerup", function (e) {
      if (x0 == null) return;
      var dx = e.clientX - x0, dy = e.clientY - y0; x0 = null;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        SC.swiped = true; setTimeout(function () { SC.swiped = false; }, 400);
        scGo(SC.i + ((dx < 0) !== (lang === "ar") ? 1 : -1), true);
      }
    });
    box.addEventListener("mouseenter", function () { SC.hold.hover = true; scRun(); });
    box.addEventListener("mouseleave", function () { SC.hold.hover = false; scRun(); });
    box.addEventListener("focusin", function () { SC.hold.focus = true; scRun(); });
    box.addEventListener("focusout", function (e) { if (!box.contains(e.relatedTarget)) { SC.hold.focus = false; scRun(); } });
    document.addEventListener("visibilitychange", function () { SC.hold.tab = document.hidden; scRun(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { SC.hold.off = !en[0].isIntersecting; scRun(); }, { threshold: .35 }).observe(st);
    scGo(0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { anDraw(); });
  })();

  function renderAll() { HAY = {}; scRender(); renderSignatures(); renderMenu(); renderGallery(); renderSouq(); applyMode(); renderCart(); reveal(); }

  /* ---------------- views: website · online menu ---------------- */
  function setView(v) {
    var html = document.documentElement;
    html.setAttribute("data-view", v);
    try { var u = new URL(location.href); u.hash = ""; if (v === "site") u.searchParams.delete("view"); else u.searchParams.set("view", v); history.replaceState(null, "", u.toString()); } catch (e) {}
    applyStatic(); renderAll(); window.scrollTo(0, 0);
  }
  $$("#toMenuView, #toSiteView").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); setView(a.id === "toMenuView" ? "menu" : "site"); }); });

  /* ---------------- complaint: straight to the manager on WhatsApp ---------------- */
  var cpTopic = "";
  function openComplaint() {
    $("#cpForm").hidden = false; $("#cpDone").hidden = true; $("#cpErr").classList.remove("on");
    openModal("cpModal");
    setTimeout(function () { $("#cpText").focus({ preventScroll: true }); }, 120);
  }
  $("#cpTopics").addEventListener("click", function (e) {
    var b = e.target.closest("[data-topic]"); if (!b) return;
    cpTopic = b.getAttribute("data-topic");
    $$("#cpTopics [data-topic]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
  });
  $("#cpSend").addEventListener("click", function (e) {
    var text = $("#cpText").value.trim(), err = $("#cpErr");
    if (text.length < 3) { e.preventDefault(); err.textContent = t("cp.need"); err.classList.add("on"); return; }
    var tb = cpTopic ? $('#cpTopics [data-topic="' + cpTopic + '"]') : null, name = $("#cpName").value.trim();
    var msg = t("wa.complaint") + (tb ? " (" + tb.textContent.trim() + ")" : "") + ":\n\n" + text + (name ? "\n\n" + t("wa.name") + ": " + name : "");
    $("#cpSend").href = waLink(msg);
    setTimeout(function () {
      $("#cpForm").hidden = true; $("#cpDone").hidden = false; $("#cpDoneText").textContent = t("cp.thanks");
      $("#cpText").value = ""; cpTopic = ""; $$("#cpTopics [data-topic]").forEach(function (x) { x.setAttribute("aria-checked", "false"); });
    }, 400);
  });
  $("#abComplain").addEventListener("click", openComplaint);
  $("#abOrder").addEventListener("click", openDrawer);

  /* inside the Claude preview, files are handed over through the viewer's save dialog */
  if (window.claude && typeof window.claude.use === "function") {
    window.claude.use("downloads").then(function (dl) {
      if (!dl) return;
      document.addEventListener("click", function (e) {
        var a = e.target.closest("a[download]"); if (!a) return;
        e.preventDefault();
        fetch(a.getAttribute("href")).then(function (r) { return r.blob(); })
          .then(function (blob) { return dl.save({ filename: (a.getAttribute("href").split("/").pop() || "arabian-palace-profile.pdf"), data: blob }); })
          .catch(function () {});
      }, true);
    }).catch(function () {});
  }

  /* menu panel (phones, tablets, narrow windows) */
  (function () {
    var panel = $("#navPanel"), btn = $("#menuBtn"); if (!panel || !btn) return;
    function open() {
      if (isOpen("nav")) return;
      panel.classList.add("on"); panel.setAttribute("aria-hidden", "false"); btn.setAttribute("aria-expanded", "true");
      pushLayer("nav", function () { panel.classList.remove("on"); panel.setAttribute("aria-hidden", "true"); btn.setAttribute("aria-expanded", "false"); }, btn);
      setTimeout(function () { var a = $(".np-links a", panel); if (a) a.focus({ preventScroll: true }); }, 80);
    }
    btn.addEventListener("click", open);
    $("#npClose").addEventListener("click", function () { closeLayer("nav"); });
    $$(".np-links a, .np-contact a", panel).forEach(function (a) {
      a.addEventListener("click", function (e) {
        var href = a.getAttribute("href");
        if (href.charAt(0) !== "#") { closeLayer("nav"); return; }
        e.preventDefault(); closeLayer("nav");
        setTimeout(function () { var el = $(href); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 90);
      });
    });
  })();

  /* header: the logo medallion settles into the bar once the page moves */
  var scrolled = null;
  function onScroll() { var s = (window.scrollY || document.documentElement.scrollTop) > 40; if (s !== scrolled) { scrolled = s; document.body.classList.toggle("scrolled", s); } }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------------- welcome gate: pick a language, walk in ---------------- */
  (function () {
    var w = $("#welcome"); if (!w) return;
    var html = document.documentElement;
    if (!html.classList.contains("ask-lang")) { w.remove(); return; }
    var saved = lsGet("ap-lang", null);
    var g = $('.wl-gate[data-enter="' + (LANGS.indexOf(saved) >= 0 ? saved : lang) + '"]');
    if (g) g.classList.add("last");
    setTimeout(function () { var f = $(".wl-gate.last") || $(".wl-gate"); if (f) f.focus({ preventScroll: true }); }, 400);
    function enter(l, btn) {
      if (w.classList.contains("leaving")) return;
      if (l !== lang) setLang(l); else lsSet("ap-lang", l);
      ssSet("ap-entered", 1);
      if (btn) btn.classList.add("picked");
      w.classList.add("leaving");
      html.classList.remove("ask-lang");
      window.scrollTo(0, 0);
      setTimeout(function () { w.remove(); }, 750);
    }
    $$(".wl-gate", w).forEach(function (b) { b.addEventListener("click", function () { enter(b.getAttribute("data-enter"), b); }); });
    w.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); enter(lang, $(".wl-gate.last")); }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var gs = $$(".wl-gate", w), i = gs.indexOf(document.activeElement);
        if (i >= 0) { e.preventDefault(); gs[(i + (e.key === "ArrowRight" ? 1 : -1) + gs.length) % gs.length].focus(); }
      }
    });
  })();

  /* ---------------- start ---------------- */
  applyStatic();
  renderAll();
  window.AP_BACKEND.ready.then(function (b) {
    backend = b;
    document.body.setAttribute("data-backend", b.type);
    return b.ratings();
  }).then(function (m) { RAT = m || {}; refreshMeta(); if (sheetItem) { var h = $("#rHead"); if (h) h.innerHTML = rateHead(ratingOf(sheetItem.id)); } }).catch(function () {});
  window.AP = { openSheet: openSheet, setLang: setLang, items: ITEMS };
})();
