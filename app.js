/* =====================================================================
   ARABIAN PALACE — site behaviour
   languages · menu · dish sheet · photo viewer · ratings · table ordering
   · kitchen screen (#kitchen) · gallery · profile viewer
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
      it.id = slug(it.name); it.cat = c.id; it.ix = ITEMS.length;
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
    var adm = adminMode();   // the admin screen is English and left-to-right for the staff, whatever language was last chosen
    document.documentElement.lang = adm ? "en" : lang;
    document.documentElement.dir = lang === "ar" && !adm ? "rtl" : "ltr";
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
    table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9h16M6 9v10M18 9v10M3 9l1.5-4h15L21 9"/></svg>',
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

  /* ---------------- table mode ---------------- */
  var TABLES = Math.max(1, +C.tables || 30);
  var table = (function () {
    var q = parseInt(params.get("t") || params.get("table"), 10);
    if (q >= 1 && q <= TABLES) { ssSet("ap-table", q); return q; }
    var s = ssGet("ap-table", null); return s >= 1 && s <= TABLES ? s : null;
  })();
  function setTable(n) {
    table = n; ssSet("ap-table", n);
    if (!n) { cart = []; saveCart(); }
    applyTable(); renderMenu(); renderCart();
  }
  function applyTable() {
    document.body.classList.toggle("at-table", !!table);
    var chip = $("#tableChip"); chip.classList.toggle("on", !!table);
    $("#tableChipText").innerHTML = table ? '<span class="tl">' + esc(t("tbl.chip", { n: "" }).trim()) + "</span> <b>" + table + "</b>" : "";
    $("#cartBtn").classList.toggle("on", !!table);
    var dine = $("#dine");
    dine.classList.toggle("at-table", !!table);
    if (table) dine.innerHTML = ICON.table + '<span>' + t("dine.at", { n: table }) + '</span><button type="button" class="linkish" data-act="pick-table">' + esc(t("dine.change")) + "</button>";
    else dine.innerHTML = ICON.qr + "<span>" + esc(t("dine.not")) + "</span>" + (C.tablePicker ? '<button type="button" class="linkish" data-act="pick-table">' + esc(t("dine.pick")) + "</button>" : "");
    $("#drawerTable").textContent = table ? t("cart.table", { n: table }) : "";
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
    fillOrder(it);
    fillRatings(it);
  }
  function fillOrder(it) {
    var o = $("#shOrder");
    if (!table) {
      o.innerHTML = '<div class="sh-note">' + ICON.qr + "<span>" + esc(t("sh.tableonly")) + "</span>" +
        (C.tablePicker ? '<button type="button" class="linkish" data-act="pick-table">' + esc(t("sh.pick")) + "</button>" : "") + "</div>";
      return;
    }
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

  /* ---------------- cart (table orders) ---------------- */
  var cart = table ? ssGet("ap-cart", []) : [];
  function saveCart() { ssSet("ap-cart", cart); }
  function cartCount() { return cart.reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartSum() { return cart.reduce(function (a, l) { return a + l.qty * l.price; }, 0); }
  function addToCart(id, vi, ci, btn) {
    var it = BY[id]; if (!it || !table) return;
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
    ob.classList.toggle("on", !!table && n > 0 && !isOpen("drawer"));
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
    var wa = $("#waBtn");
    if (wa) { wa.textContent = t("cart.wa"); wa.hidden = !(backend && backend.type === "local") && !lastSendFailed; }
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

  var lastSendFailed = false, orderUnsub = null;
  function waText() {
    var s = t("wa.order", { n: table }) + "\n" + cart.map(function (l) { var it = BY[l.id]; return l.qty + " × " + (it ? it.name : l.id) + (l.opt ? " (" + l.opt + ")" : "") + " — " + ksh(l.qty * l.price); }).join("\n");
    var notes = $("#fNotes").value.trim(); if (notes) s += "\n" + notes;
    return s + "\n" + t("cart.subtotal") + ": " + ksh(cartSum());
  }
  function sendOrder() {
    if (!table) { toast(t("cart.notable")); return; }
    if (!cart.length || !backend) return;
    var btn = $("#sendBtn"); btn.disabled = true; $("#sendLabel").textContent = t("cart.sending");
    var order = {
      table: table, lang: lang, notes: $("#fNotes").value, total: cartSum(),
      lines: cart.map(function (l) { var it = BY[l.id]; return { id: l.id, name: it ? it.name : l.id, opt: l.opt, qty: l.qty, price: l.price }; })
    };
    backend.sendOrder(order).then(function (o) {
      lastSendFailed = false;
      cart = []; saveCart(); $("#fNotes").value = "";
      $("#sent").classList.add("on");
      $("#sentNo").textContent = t("cart.sent.no", { no: o.no, n: o.table });
      $("#sentMsg").textContent = backend.type === "local" ? t("cart.sent.local") : t("cart.sent.p");
      $("#track").hidden = false; trackStatus("new");
      if (orderUnsub) orderUnsub();
      if (o.id) orderUnsub = backend.watchOrder(o.id, function (x) { trackStatus(x.status); });
      ssSet("ap-last-order", { id: o.id, no: o.no, table: o.table });
      renderCart(); updateCartBadges();
    }).catch(function () {
      lastSendFailed = true; toast(t("cart.err")); renderCart();
    }).then(function () { btn.disabled = false; $("#sendLabel").textContent = t("cart.send"); });
  }
  function trackStatus(s) {
    var order = ["new", "accepted", "ready"], k = order.indexOf(s === "done" ? "ready" : s);
    $$("#track div").forEach(function (d, i) { d.classList.toggle("done", i <= k); });
  }
  $("#sendBtn").addEventListener("click", sendOrder);
  $("#newOrder").addEventListener("click", function () { $("#sent").classList.remove("on"); $("#track").hidden = true; renderCart(); closeLayer("drawer"); });
  (function () {
    var foot = $("#drawerFoot"), a = document.createElement("a");
    a.id = "waBtn"; a.className = "btn btn-line"; a.target = "_blank"; a.rel = "noopener"; a.hidden = true;
    a.href = "#"; a.addEventListener("click", function () { a.href = "https://wa.me/" + (C.whatsapp || "254797666667") + "?text=" + encodeURIComponent(waText()); });
    foot.insertBefore(a, $("#sendFine"));
  })();

  /* ---------------- table picker ---------------- */
  function openModal(id, onClose) {
    var m = $("#" + id); m.classList.add("on"); m.setAttribute("aria-hidden", "false");
    pushLayer(id, function () { m.classList.remove("on"); m.setAttribute("aria-hidden", "true"); if (onClose) onClose(); });
    setTimeout(function () { var c = m.querySelector("[data-close-modal]"); if (c) c.focus({ preventScroll: true }); }, 60);
  }
  $$("[data-close-modal]").forEach(function (b) { b.addEventListener("click", function () { closeLayer(b.closest(".modal").id); }); });
  $$(".modal").forEach(function (m) { m.addEventListener("click", function (e) { if (e.target === m) closeLayer(m.id); }); });
  function openTablePicker() {
    var g = $("#tblGrid"), h = "";
    for (var n = 1; n <= TABLES; n++) h += '<button type="button" data-tbl="' + n + '"' + (n === table ? ' class="cur" aria-current="true"' : "") + ">" + n + "</button>";
    g.innerHTML = h;
    var leave = $("#tblLeave");
    if (!leave) { leave = document.createElement("button"); leave.type = "button"; leave.id = "tblLeave"; leave.className = "clear"; leave.style.marginTop = "1rem"; g.after(leave); leave.addEventListener("click", function () { closeLayer("tableModal"); setTable(null); }); }
    leave.textContent = t("tbl.leave"); leave.hidden = !table;
    openModal("tableModal");
  }
  $("#tblGrid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tbl]"); if (!b) return;
    var n = +b.getAttribute("data-tbl"); closeLayer("tableModal"); setTable(n);
    if (sheetItem) fillOrder(sheetItem);
  });
  $("#tableChip").addEventListener("click", openTablePicker);

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
    var act = e.target.closest("[data-act]");
    if (act && act.getAttribute("data-act") === "pick-table") { openTablePicker(); return; }
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

  function renderAll() { HAY = {}; renderSignatures(); renderMenu(); renderGallery(); renderSouq(); applyTable(); renderCart(); reveal(); }

  /* ---------------- admin screen (#admin): orders, waiter calls, complaints, reviews ---------------- */
  function adminMode() { return document.documentElement.getAttribute("data-view") === "admin"; }
  var A = { unsub: null, seen: null, tab: "orders", feed: { orders: [], calls: [], complaints: [] }, sound: lsGet("ap-k-sound", true), ac: null, remind: null, reviews: [] };
  function tone(freqs, gap, len, vol) {
    if (!A.sound || !A.ac) return;
    try {
      var ac = A.ac; if (ac.state === "suspended") ac.resume();
      freqs.forEach(function (f, i) {
        var d = i * gap, o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        g.gain.setValueAtTime(.0001, ac.currentTime + d); g.gain.exponentialRampToValueAtTime(vol || .35, ac.currentTime + d + .02);
        g.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + d + (len || .45)); o.start(ac.currentTime + d); o.stop(ac.currentTime + d + (len || .45) + .05);
      });
    } catch (e) {}
  }
  var SOUND = {
    order: function () { tone([880, 1175, 1568], .18, .5); },
    call: function () { tone([1319, 1319, 1319], .22, .25, .3); },
    complaint: function () { tone([523, 392], .3, .6, .3); },
    remind: function () { tone([988], 0, .35, .18); }
  };
  function ago(ts) { var m = Math.max(0, Math.round((Date.now() - ts) / 60000)); return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.floor(m / 60) + " h " + (m % 60) + " min ago"; }
  function startAdmin() {
    document.documentElement.setAttribute("data-view", "admin");
    var k = $("#admin");
    if (!k) { k = document.createElement("div"); k.id = "admin"; document.body.appendChild(k); }
    k.innerHTML =
      '<header class="ad-head"><img src="img/brand/arabian-palace-logo-dark.svg" alt="" width="48" height="48"><div><h1>Arabian Palace · Admin</h1><span id="adMode"></span></div>' +
      '<div class="ad-tools"><button type="button" class="btn btn-line sm" id="adSound"></button><a class="btn btn-line sm" href="tables.html" target="_blank" rel="noopener">Table QR cards</a><a class="btn btn-line sm" href="?view=menu" id="adMenu">Online menu</a><a class="btn btn-line sm" href="?view=site" id="adExit">Website</a></div></header>' +
      '<div id="adStart" class="ad-start"><div><h2>Start your shift</h2><p>Tap once so this screen can ring for new orders, waiter calls and complaints. Keep it open on the kitchen tablet or the till.</p><button type="button" class="btn btn-gold" id="adGo">Start receiving orders</button></div></div>' +
      '<div id="adKey" class="k-key" hidden><p>Enter the admin key (the KITCHEN_KEY from the Apps Script setup).</p><form id="adKeyForm"><input id="adKeyIn" type="password" autocomplete="off" placeholder="Admin key"><button class="btn btn-gold sm">Open</button></form><p class="err" id="adErr"></p></div>' +
      '<p class="ad-denied" id="adDenied" hidden>Only the restaurant team can open this screen.</p>' +
      '<nav class="ad-tabs" id="adTabs"><button type="button" data-tab="orders">Orders <b id="cOrders"></b></button><button type="button" data-tab="calls">Waiter calls <b id="cCalls"></b></button><button type="button" data-tab="complaints">Complaints <b id="cComplaints"></b></button><button type="button" data-tab="reviews">Reviews</button></nav>' +
      '<section class="ad-pane" data-pane="orders"><div class="k-board"><section data-col="new"><h2>New</h2><div class="k-list"></div></section><section data-col="accepted"><h2>Preparing</h2><div class="k-list"></div></section><section data-col="ready"><h2>Ready to serve</h2><div class="k-list"></div></section></div><details class="k-done"><summary>Served today</summary><div class="k-list" data-col="done"></div></details></section>' +
      '<section class="ad-pane" data-pane="calls"><div class="ad-list" id="adCalls"></div></section>' +
      '<section class="ad-pane" data-pane="complaints"><div class="ad-list" id="adComplaints"></div></section>' +
      '<section class="ad-pane" data-pane="reviews"><div class="ad-rev-head"><p id="adRevSum"></p><button type="button" class="btn btn-line sm" id="adRevRefresh">Refresh</button></div><div class="ad-list" id="adReviews"></div></section>';
    soundLabel();
    $("#adSound").addEventListener("click", function () { A.sound = !A.sound; lsSet("ap-k-sound", A.sound); soundLabel(); unlock(); if (A.sound) SOUND.order(); });
    $("#adGo").addEventListener("click", function () { unlock(); SOUND.order(); $("#adStart").hidden = true; });
    $("#adMenu").addEventListener("click", function (e) { e.preventDefault(); stopAdmin(); setView("menu"); });
    $("#adExit").addEventListener("click", function (e) { e.preventDefault(); stopAdmin(); setView("site"); });
    $("#adKeyForm").addEventListener("submit", function (e) { e.preventDefault(); window.AP_BACKEND.kitchenKey($("#adKeyIn").value.trim()); $("#adKey").hidden = true; runAdmin(); });
    $("#adTabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) showTab(b.getAttribute("data-tab")); });
    $("#adRevRefresh").addEventListener("click", loadAdminReviews);
    k.addEventListener("click", adminAction);
    showTab(A.tab);
    window.AP_BACKEND.ready.then(function (b) { backend = b; runAdmin(); });
  }
  function unlock() { try { if (!A.ac) { var AC = window.AudioContext || window.webkitAudioContext; A.ac = new AC(); } if (A.ac.state === "suspended") A.ac.resume(); } catch (e) {} }
  function soundLabel() { var b = $("#adSound"); if (b) b.textContent = A.sound ? "Sound: on" : "Sound: off"; }
  function showTab(tab) {
    A.tab = tab;
    $$("#adTabs [data-tab]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === tab); });
    $$("#admin .ad-pane").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== tab; });
    if (tab === "reviews") loadAdminReviews();
  }
  function adErr(m) { var e = $("#adErr"); if (e) { e.textContent = m; $("#adKey").hidden = false; } }
  function runAdmin() {
    $("#adMode").textContent = backend.type === "script" ? "Live · Google Sheet" : backend.type === "db" ? "Live · preview database" : "Demo · this device only (connect the Google Sheet for real orders)";
    if (backend.type === "db" && backend.user && !A.checked) {
      var u = backend.user;
      Promise.all([u.isOwner ? u.isOwner() : false, u.canEdit ? u.canEdit() : false]).then(function (r) {
        if (!(r[0] || r[1])) { $("#adDenied").hidden = false; $("#adStart").hidden = true; return; }
        A.checked = true; runAdmin();
      }, function () { A.checked = true; runAdmin(); });
      return;
    }
    if (backend.type === "script" && !window.AP_BACKEND.kitchenKey()) { $("#adKey").hidden = false; return; }
    if (A.unsub) A.unsub();
    A.seen = null;
    A.unsub = backend.watchFeed(drawAdmin, function () { adErr("Couldn't load the live feed. Check the admin key and the connection."); });
    clearInterval(A.remind);
    A.remind = setInterval(function () {   // keep reminding while something is waiting
      var f = A.feed, waiting = f.orders.some(function (o) { return (o.status || "new") === "new"; }) || f.calls.some(function (c) { return (c.status || "new") === "new"; });
      if (waiting) SOUND.remind();
    }, 20000);
  }
  function drawAdmin(feed) {
    var cut = Date.now() - 16 * 3600e3;
    var orders = (feed.orders || []).filter(function (o) { return o.ts > cut; }).sort(function (a, b) { return a.ts - b.ts; });
    var calls = (feed.calls || []).filter(function (o) { return o.ts > cut; }).sort(function (a, b) { return b.ts - a.ts; });
    var comps = (feed.complaints || []).slice().sort(function (a, b) { return b.ts - a.ts; });
    A.feed = { orders: orders, calls: calls, complaints: comps };
    // alerts for anything new since the last look
    var ids = {}; orders.concat(calls, comps).forEach(function (x) { ids[x.id] = 1; });
    if (A.seen) {
      var fresh = function (x) { return (x.status || "new") === "new" && !A.seen[x.id]; };
      if (orders.some(fresh)) SOUND.order(); else if (calls.some(fresh)) SOUND.call(); else if (comps.some(fresh)) SOUND.complaint();
      if (orders.some(fresh) || calls.some(fresh) || comps.some(fresh)) flashTitle();
    }
    A.seen = ids;
    var nNew = orders.filter(function (o) { return (o.status || "new") === "new"; }).length, nCalls = calls.filter(function (c) { return (c.status || "new") === "new"; }).length,
      nComp = comps.filter(function (c) { return (c.status || "new") === "new"; }).length;
    $("#cOrders").textContent = nNew || ""; $("#cCalls").textContent = nCalls || ""; $("#cComplaints").textContent = nComp || "";
    document.title = (nNew + nCalls + nComp ? "(" + (nNew + nCalls + nComp) + ") " : "") + "Arabian Palace · Admin";
    // orders board
    var next = { new: ["accepted", "Accept"], accepted: ["ready", "Ready"], ready: ["done", "Served"] };
    ["new", "accepted", "ready", "done"].forEach(function (col) {
      var box = $('#admin [data-col="' + col + '"]'); box = box.classList.contains("k-list") ? box : box.querySelector(".k-list");
      var rows = orders.filter(function (o) { return (o.status || "new") === col; });
      if (col === "done") rows = rows.reverse().slice(0, 40);
      box.innerHTML = rows.length ? rows.map(function (o) {
        return '<article class="k-card s-' + col + '"><div class="k-top"><b class="k-tbl">Table ' + esc(o.table) + '</b><span>#' + esc(o.no) + " · " + esc(ago(o.ts)) + "</span></div>" +
          '<ul>' + (o.lines || []).map(function (l) { return "<li><b>" + esc(l.qty) + "×</b> " + esc(l.name) + (l.opt ? " <i>" + esc(l.opt) + "</i>" : "") + "</li>"; }).join("") + "</ul>" +
          (o.notes ? '<p class="k-notes">' + esc(o.notes) + "</p>" : "") +
          '<div class="k-foot"><span>' + ksh(o.total || 0) + (o.lang && o.lang !== "en" ? " · " + esc(String(o.lang).toUpperCase()) : "") + "</span>" +
          (next[col] ? '<button type="button" class="btn btn-ink sm" data-ost="' + next[col][0] + '" data-id="' + esc(o.id) + '">' + next[col][1] + "</button>" : "") +
          (col === "new" ? '<button type="button" class="clear" data-ost="cancelled" data-id="' + esc(o.id) + '">Cancel</button>' : "") + "</div></article>";
      }).join("") : '<p class="k-empty">Nothing here</p>';
    });
    var h = $('#admin section[data-col="new"] h2'); if (h) h.textContent = "New (" + nNew + ")";
    // waiter calls
    $("#adCalls").innerHTML = calls.length ? calls.map(function (c) {
      var open = (c.status || "new") === "new";
      return '<article class="ad-item' + (open ? " open" : "") + '"><div class="ad-ic ' + (c.type === "bill" ? "bill" : "waiter") + '">' + (c.type === "bill" ? "Bill" : "Waiter") + '</div>' +
        '<div class="ad-main"><b>Table ' + esc(c.table) + "</b> " + (c.type === "bill" ? "asked for the bill" : "is calling a waiter") + (c.note ? " · " + esc(c.note) : "") + '<span class="ad-time">' + esc(ago(c.ts)) + (c.lang && c.lang !== "en" ? " · " + esc(String(c.lang).toUpperCase()) : "") + "</span></div>" +
        (open ? '<button type="button" class="btn btn-ink sm" data-cst="done" data-id="' + esc(c.id) + '">On my way</button>' : '<span class="ad-done">Done</span>') + "</article>";
    }).join("") : '<p class="k-empty">No calls yet today.</p>';
    // complaints
    var TOP = { food: "The food", service: "The service", wait: "Waiting time", cleanliness: "Cleanliness", other: "Something else" };
    $("#adComplaints").innerHTML = comps.length ? comps.map(function (c) {
      var st = c.status || "new";
      return '<article class="ad-item cp' + (st === "new" ? " open" : "") + '"><div class="ad-ic complaint">' + esc(TOP[c.topic] || "Other") + '</div>' +
        '<div class="ad-main"><b>' + (c.table ? "Table " + esc(c.table) : "No table given") + "</b>" + (c.name ? " · " + esc(c.name) : "") + (c.phone ? ' · <a href="tel:' + esc(String(c.phone).replace(/\s/g, "")) + '">' + esc(c.phone) + "</a>" : "") +
        '<p class="ad-text" dir="auto">' + esc(c.text) + '</p><span class="ad-time">' + esc(ago(c.ts)) + (c.lang && c.lang !== "en" ? " · " + esc(String(c.lang).toUpperCase()) : "") + "</span></div>" +
        (st === "resolved" ? '<span class="ad-done">Resolved</span>' : '<button type="button" class="btn btn-ink sm" data-pst="resolved" data-id="' + esc(c.id) + '">Resolved</button>') + "</article>";
    }).join("") : '<p class="k-empty">No complaints. Long may it last.</p>';
  }
  var flashT;
  function flashTitle() {
    clearInterval(flashT); var n = 0, base = document.title;
    flashT = setInterval(function () { document.title = n++ % 2 ? base : "● New · Arabian Palace"; if (n > 12) { clearInterval(flashT); document.title = base; } }, 900);
  }
  function loadAdminReviews() {
    if (!backend || !backend.allReviews) return;
    backend.allReviews().then(function (rows) {
      A.reviews = rows || [];
      var by = {}; A.reviews.forEach(function (r) { if (r.hidden) return; var x = by[r.item] || (by[r.item] = { n: 0, s: 0 }); x.n++; x.s += +r.stars || 0; });
      var low = Object.keys(by).map(function (k) { return [k, by[k].s / by[k].n, by[k].n]; }).filter(function (x) { return x[1] < 4; }).sort(function (a, b) { return a[1] - b[1]; }).slice(0, 5);
      $("#adRevSum").innerHTML = A.reviews.length + " reviews" + (low.length ? ' · Needs attention: ' + low.map(function (x) { return esc((BY[x[0]] || {}).name || x[0]) + " (" + x[1].toFixed(1) + "★, " + x[2] + ")"; }).join(", ") : "");
      $("#adReviews").innerHTML = A.reviews.length ? A.reviews.map(function (r) {
        var it = BY[r.item];
        return '<article class="ad-item rv' + (r.hidden ? " hid" : "") + '"><div class="ad-ic stars-ic">' + stars(r.stars) + '</div><div class="ad-main"><b>' + esc(it ? it.name : r.item) + "</b>" + (r.name ? " · " + esc(r.name) : "") +
          (r.text ? '<p class="ad-text" dir="auto">' + esc(r.text) + "</p>" : "") + '<span class="ad-time">' + esc(ago(r.ts)) + (r.hidden ? " · hidden from the website" : "") + "</span></div>" +
          '<button type="button" class="clear" data-rvh="' + (r.hidden ? "0" : "1") + '" data-id="' + esc(r.id) + '">' + (r.hidden ? "Show" : "Hide") + "</button></article>";
      }).join("") : '<p class="k-empty">No reviews yet.</p>';
    }).catch(function () { $("#adRevSum").textContent = "Couldn't load reviews."; });
  }
  function adminAction(e) {
    var b = e.target.closest("[data-ost],[data-cst],[data-pst],[data-rvh]"); if (!b || !backend) return;
    var id = b.getAttribute("data-id"), p;
    b.disabled = true;
    if (b.hasAttribute("data-ost")) p = backend.setStatus(id, b.getAttribute("data-ost"));
    else if (b.hasAttribute("data-cst")) p = backend.setCallStatus(id, b.getAttribute("data-cst"));
    else if (b.hasAttribute("data-pst")) p = backend.setComplaintStatus(id, b.getAttribute("data-pst"));
    else p = backend.hideReview(id, b.getAttribute("data-rvh") === "1").then(loadAdminReviews);
    p.catch(function () { b.disabled = false; adErr("Couldn't save that change. Check the connection."); });
  }
  function stopAdmin() { if (A.unsub) A.unsub(); A.unsub = null; clearInterval(A.remind); var k = $("#admin"); if (k) k.remove(); document.title = "Arabian Palace"; }
  window.addEventListener("hashchange", function () { if ((location.hash === "#admin" || location.hash === "#kitchen") && !$("#admin")) startAdmin(); });

  /* ---------------- views: website · online menu (QR) · admin ---------------- */
  function setView(v) {
    var html = document.documentElement, was = html.getAttribute("data-view");
    html.setAttribute("data-view", v);
    try { var u = new URL(location.href); u.hash = ""; if (v === "site") u.searchParams.delete("view"); else u.searchParams.set("view", v); history.replaceState(null, "", u.toString()); } catch (e) {}
    if (v === "admin") { applyStatic(); if (!$("#admin")) startAdmin(); return; }
    if (was === "admin") stopAdmin();
    applyStatic(); renderAll(); window.scrollTo(0, 0);
    if (v === "menu") askTable();
  }
  function askTable() { if (document.documentElement.getAttribute("data-view") === "menu" && !table && !ssGet("ap-browsing", false)) setTimeout(openTablePicker, 350); }
  $$("#toMenuView, #toSiteView").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); setView(a.id === "toMenuView" ? "menu" : "site"); }); });

  /* ---------------- at the table: call a waiter, complain ---------------- */
  function openCall() {
    if (!table) { toast(t("call.notable")); openTablePicker(); return; }
    $("#callSub").textContent = t("call.sub", { n: table });
    $("#callDone").hidden = true;
    $$(".call-opt").forEach(function (b) { b.disabled = false; });
    openModal("callModal");
  }
  $$(".call-opt").forEach(function (b) {
    b.addEventListener("click", function () {
      var type = b.getAttribute("data-call"), key = "ap-call-" + type + "-" + table, last = ssGet(key, 0), done = $("#callDone");
      if (Date.now() - last < 90000) { done.hidden = false; done.textContent = t("call.wait"); return; }
      if (!backend) return;
      $$(".call-opt").forEach(function (x) { x.disabled = true; });
      backend.sendCall({ table: table, type: type, lang: lang }).then(function () {
        ssSet(key, Date.now()); done.hidden = false; done.textContent = t(type === "bill" ? "call.sent.bill" : "call.sent.waiter", { n: table });
        toast(t(type === "bill" ? "call.sent.bill" : "call.sent.waiter", { n: table }));
        setTimeout(function () { if (isOpen("callModal")) closeLayer("callModal"); }, 2200);
      }).catch(function () { done.hidden = false; done.textContent = t("call.err"); $$(".call-opt").forEach(function (x) { x.disabled = false; }); });
    });
  });
  var cpTopic = "";
  function openComplaint() {
    $("#cpForm").hidden = false; $("#cpDone").hidden = true; $("#cpErr").classList.remove("on");
    $("#cpTable").textContent = table ? t("cp.table", { n: table }) : "";
    openModal("cpModal");
    setTimeout(function () { $("#cpText").focus({ preventScroll: true }); }, 120);
  }
  $("#cpTopics").addEventListener("click", function (e) {
    var b = e.target.closest("[data-topic]"); if (!b) return;
    cpTopic = b.getAttribute("data-topic");
    $$("#cpTopics [data-topic]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); });
  });
  $("#cpForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var text = $("#cpText").value.trim(), err = $("#cpErr");
    if (text.length < 3) { err.textContent = t("cp.need"); err.classList.add("on"); return; }
    if (!backend) return;
    var btn = $("#cpSend"); btn.disabled = true;
    backend.sendComplaint({ table: table || 0, topic: cpTopic || "other", text: text, name: $("#cpName").value, phone: $("#cpPhone").value, lang: lang }).then(function () {
      $("#cpForm").hidden = true; $("#cpDone").hidden = false; $("#cpDoneText").textContent = table ? t("cp.thanks.t", { n: table }) : t("cp.thanks");
      $("#cpText").value = ""; cpTopic = ""; $$("#cpTopics [data-topic]").forEach(function (x) { x.setAttribute("aria-checked", "false"); });
    }).catch(function () { err.textContent = t("cp.err"); err.classList.add("on"); }).then(function () { btn.disabled = false; });
  });
  $("#abCall").addEventListener("click", openCall);
  $("#abComplain").addEventListener("click", openComplaint);
  $("#abOrder").addEventListener("click", function () { if (!table) { openTablePicker(); return; } openDrawer(); });
  $("#tblSkip").addEventListener("click", function () { ssSet("ap-browsing", true); closeLayer("tableModal"); });

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
    if (table) {
      var tb = $("#wlTable"); tb.hidden = false;
      tb.innerHTML = '<span lang="en">Table ' + table + '</span> · <span lang="ar" dir="rtl" class="ar">طاولة ' + table + '</span> · <span lang="sw">Meza ' + table + "</span>";
    }
    setTimeout(function () { var f = $(".wl-gate.last") || $(".wl-gate"); if (f) f.focus({ preventScroll: true }); }, 400);
    function enter(l, btn) {
      if (w.classList.contains("leaving")) return;
      if (l !== lang) setLang(l); else lsSet("ap-lang", l);
      ssSet("ap-entered", 1);
      if (btn) btn.classList.add("picked");
      w.classList.add("leaving");
      html.classList.remove("ask-lang");
      window.scrollTo(0, 0);
      setTimeout(function () { w.remove(); askTable(); }, 750);
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
  if (adminMode()) startAdmin();
  else if (!document.documentElement.classList.contains("ask-lang")) askTable();
  window.AP_BACKEND.ready.then(function (b) {
    backend = b;
    document.body.setAttribute("data-backend", b.type);
    renderCart();
    function adminLink() { var nav = $("footer nav"), a = document.createElement("a"); a.href = "?view=admin"; a.textContent = "Admin"; a.addEventListener("click", function (e) { e.preventDefault(); setView("admin"); }); nav.appendChild(a); }
    if (window.AP_ARTIFACT) adminLink();   // preview link: everyone can try the admin screen on their own device
    else if (b.type === "db" && b.user && b.user.isOwner) Promise.resolve(b.user.isOwner()).then(function (o) { if (o) adminLink(); }, function () {});
    return b.ratings();
  }).then(function (m) { RAT = m || {}; refreshMeta(); if (sheetItem) { var h = $("#rHead"); if (h) h.innerHTML = rateHead(ratingOf(sheetItem.id)); } }).catch(function () {});
  // an order sent earlier in this visit keeps showing its status
  var last = ssGet("ap-last-order", null);
  if (last && table && last.table === table) window.AP_BACKEND.ready.then(function (b) {
    if (!last.id) return;
    orderUnsub = b.watchOrder(last.id, function (x) { if (x.status !== "done" && x.status !== "cancelled") { $("#sent").classList.add("on"); $("#sentNo").textContent = t("cart.sent.no", { no: x.no, n: x.table }); $("#track").hidden = false; trackStatus(x.status); renderCart(); } });
  });
  window.AP = { openSheet: openSheet, setLang: setLang, setTable: setTable, items: ITEMS };
})();
