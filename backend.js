/* =====================================================================
   Ratings + table orders: one interface, three places to keep the data.
     "script" – Google Apps Script web app + Google Sheet (production; see backend/README.md)
     "db"     – the shared database of the Claude preview page (owner and invited editors only)
     "local"  – this browser only (demo fallback)
   ===================================================================== */
(function () {
  "use strict";
  var C = window.AP_CONFIG || {};
  var SCRIPT = (C.backend && C.backend.scriptUrl) || "";

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function code() { var a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = ""; for (var i = 0; i < 4; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function agg(list) {
    var m = {};
    list.forEach(function (r) { if (r.hidden) return; var x = m[r.item] || (m[r.item] = { n: 0, s: 0 }); x.n++; x.s += +r.stars || 0; });
    return m;
  }
  function cleanReview(r) {
    return {
      item: String(r.item || "").slice(0, 80),
      stars: Math.max(1, Math.min(5, Math.round(+r.stars || 0))),
      text: String(r.text || "").replace(/\s+/g, " ").trim().slice(0, 280),
      name: String(r.name || "").replace(/\s+/g, " ").trim().slice(0, 30),
      lang: String(r.lang || "en").slice(0, 2),
      ts: Date.now()
    };
  }
  function cleanOrder(o) {
    return {
      no: code(),
      table: +o.table || 0,
      lines: (o.lines || []).slice(0, 60).map(function (l) {
        return { id: String(l.id).slice(0, 80), name: String(l.name).slice(0, 80), opt: String(l.opt || "").slice(0, 40), qty: Math.max(1, Math.min(50, +l.qty || 1)), price: +l.price || 0 };
      }),
      notes: String(o.notes || "").trim().slice(0, 400),
      total: +o.total || 0,
      lang: String(o.lang || "en").slice(0, 2),
      status: "new",
      ts: Date.now()
    };
  }

  function cleanCall(c) {
    return { table: +c.table || 0, type: c.type === "bill" ? "bill" : "waiter", note: String(c.note || "").trim().slice(0, 140), lang: String(c.lang || "en").slice(0, 2), status: "new", ts: Date.now() };
  }
  function cleanComplaint(c) {
    var topics = ["food", "service", "cleanliness", "wait", "other"];
    return { table: +c.table || 0, topic: topics.indexOf(c.topic) >= 0 ? c.topic : "other", text: String(c.text || "").trim().slice(0, 800),
      name: String(c.name || "").trim().slice(0, 40), phone: String(c.phone || "").replace(/[^0-9+ ]/g, "").slice(0, 20), lang: String(c.lang || "en").slice(0, 2), status: "new", ts: Date.now() };
  }
  function since(list, h) { var t = Date.now() - h * 3600e3; return list.filter(function (x) { return x.ts > t; }); }

  /* ---------- local (this device only) ---------- */
  var local = {
    type: "local",
    ratings: function () { return Promise.resolve(agg(lsGet("ap-reviews", []))); },
    reviews: function (item) {
      return Promise.resolve(lsGet("ap-reviews", []).filter(function (r) { return r.item === item && !r.hidden; }).sort(function (a, b) { return b.ts - a.ts; }));
    },
    addReview: function (r) { var x = cleanReview(r), all = lsGet("ap-reviews", []); x.id = uid(); all.push(x); lsSet("ap-reviews", all); return Promise.resolve(x); },
    sendOrder: function (o) { var x = cleanOrder(o), all = lsGet("ap-orders", []); x.id = uid(); all.push(x); lsSet("ap-orders", all.slice(-200)); return Promise.resolve(x); },
    orders: function () { return Promise.resolve(lsGet("ap-orders", []).slice().sort(function (a, b) { return b.ts - a.ts; })); },
    setStatus: function (id, s) { var all = lsGet("ap-orders", []); all.forEach(function (o) { if (o.id === id) o.status = s; }); lsSet("ap-orders", all); return Promise.resolve(); },
    watchOrder: function (id, cb) {
      function tick() { var o = lsGet("ap-orders", []).filter(function (x) { return x.id === id; })[0]; if (o) cb(o); }
      tick(); var t = setInterval(tick, 3000); window.addEventListener("storage", tick);
      return function () { clearInterval(t); window.removeEventListener("storage", tick); };
    },
    watchOrders: function (cb) {
      function tick() { local.orders().then(cb); }
      tick(); var t = setInterval(tick, 3000); window.addEventListener("storage", tick);
      return function () { clearInterval(t); window.removeEventListener("storage", tick); };
    },
    sendCall: function (c) { var x = cleanCall(c), all = lsGet("ap-calls", []); x.id = uid(); all.push(x); lsSet("ap-calls", all.slice(-200)); return Promise.resolve(x); },
    sendComplaint: function (c) { var x = cleanComplaint(c), all = lsGet("ap-complaints", []); x.id = uid(); all.push(x); lsSet("ap-complaints", all.slice(-200)); return Promise.resolve(x); },
    setCallStatus: function (id, s) { var all = lsGet("ap-calls", []); all.forEach(function (o) { if (o.id === id) o.status = s; }); lsSet("ap-calls", all); return Promise.resolve(); },
    setComplaintStatus: function (id, s) { var all = lsGet("ap-complaints", []); all.forEach(function (o) { if (o.id === id) o.status = s; }); lsSet("ap-complaints", all); return Promise.resolve(); },
    allReviews: function () { return Promise.resolve(lsGet("ap-reviews", []).slice().sort(function (a, b) { return b.ts - a.ts; }).slice(0, 300)); },
    hideReview: function (id, hidden) { var all = lsGet("ap-reviews", []); all.forEach(function (r) { if (r.id === id) r.hidden = !!hidden; }); lsSet("ap-reviews", all); return Promise.resolve(); },
    watchFeed: function (cb) {
      function tick() { cb({ orders: since(lsGet("ap-orders", []), 16), calls: since(lsGet("ap-calls", []), 16), complaints: since(lsGet("ap-complaints", []), 72) }); }
      tick(); var t = setInterval(tick, 3000); window.addEventListener("storage", tick);
      return function () { clearInterval(t); window.removeEventListener("storage", tick); };
    }
  };

  /* ---------- Google Apps Script ---------- */
  function get(params) {
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(SCRIPT + (SCRIPT.indexOf("?") < 0 ? "?" : "&") + q, { method: "GET", redirect: "follow" })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "failed"); return j.data; });
  }
  function post(body) {
    // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight
    return fetch(SCRIPT, { method: "POST", redirect: "follow", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "failed"); return j.data; });
  }
  var script = {
    type: "script",
    ratings: function () { return get({ a: "ratings" }); },
    reviews: function (item) { return get({ a: "reviews", item: item }); },
    addReview: function (r) { var x = cleanReview(r); x.a = "review"; x.hp = r.hp || ""; return post(x); },
    sendOrder: function (o) { var x = cleanOrder(o); x.a = "order"; return post(x).then(function (d) { x.id = d.id; x.no = d.no || x.no; return x; }); },
    orders: function () { return get({ a: "orders", key: lsGet("ap-kitchen-key", "") }); },
    setStatus: function (id, s) { return post({ a: "status", id: id, status: s, key: lsGet("ap-kitchen-key", "") }); },
    watchOrder: function (id, cb) {
      var stop = false;
      function tick() { if (stop) return; get({ a: "order", id: id }).then(function (o) { if (!stop && o) cb(o); }).catch(function () {}); }
      tick(); var t = setInterval(tick, 8000);
      return function () { stop = true; clearInterval(t); };
    },
    watchOrders: function (cb, err) {
      var stop = false;
      function tick() { if (stop) return; script.orders().then(function (l) { if (!stop) cb(l); }).catch(function (e) { if (err) err(e); }); }
      tick(); var t = setInterval(tick, 6000);
      return function () { stop = true; clearInterval(t); };
    },
    sendCall: function (c) { var x = cleanCall(c); x.a = "call"; return post(x).then(function (d) { x.id = d.id; return x; }); },
    sendComplaint: function (c) { var x = cleanComplaint(c); x.a = "complaint"; return post(x).then(function (d) { x.id = d.id; return x; }); },
    setCallStatus: function (id, s) { return post({ a: "callstatus", id: id, status: s, key: lsGet("ap-kitchen-key", "") }); },
    setComplaintStatus: function (id, s) { return post({ a: "complaintstatus", id: id, status: s, key: lsGet("ap-kitchen-key", "") }); },
    allReviews: function () { return get({ a: "allreviews", key: lsGet("ap-kitchen-key", "") }); },
    hideReview: function (id, hidden) { return post({ a: "hide", id: id, hidden: !!hidden, key: lsGet("ap-kitchen-key", "") }); },
    watchFeed: function (cb, err) {
      var stop = false;
      function tick() { if (stop) return; get({ a: "feed", key: lsGet("ap-kitchen-key", "") }).then(function (d) { if (!stop) cb(d); }).catch(function (e) { if (err) err(e); }); }
      tick(); var t = setInterval(tick, 5000);
      return function () { stop = true; clearInterval(t); };
    }
  };

  /* ---------- Claude preview page database ---------- */
  function makeDb(db, user) {
    function rows(snap) { return snap.docs.map(function (d) { var o = Object.assign({}, d.data()); o.id = d.id; return o; }); }
    return {
      type: "db",
      user: user,
      ratings: function () { return db.collection("reviews").orderBy("ts", "desc").limit(1000).get().then(function (s) { return agg(rows(s)); }); },
      reviews: function (item) {
        return db.collection("reviews").where("item", "==", item).limit(200).get().then(function (s) {
          return rows(s).filter(function (r) { return !r.hidden; }).sort(function (a, b) { return b.ts - a.ts; });
        });
      },
      addReview: function (r) { var x = cleanReview(r); return db.collection("reviews").add(x).then(function (ref) { x.id = ref.id; return x; }); },
      sendOrder: function (o) { var x = cleanOrder(o); return db.collection("orders").add(x).then(function (ref) { x.id = ref.id; return x; }); },
      orders: function () { return db.collection("orders").orderBy("ts", "desc").limit(120).get().then(rows); },
      setStatus: function (id, s) { return db.doc("orders/" + id).update({ status: s }); },
      watchOrder: function (id, cb) {
        return db.doc("orders/" + id).onSnapshot(function (d) { if (d.exists) { var o = Object.assign({}, d.data()); o.id = d.id; cb(o); } }, function () {});
      },
      watchOrders: function (cb, err) {
        return db.collection("orders").orderBy("ts", "desc").limit(120).onSnapshot(function (s) { cb(rows(s)); }, function (e) { if (err) err(e); });
      },
      sendCall: function (c) { var x = cleanCall(c); return db.collection("calls").add(x).then(function (ref) { x.id = ref.id; return x; }); },
      sendComplaint: function (c) { var x = cleanComplaint(c); return db.collection("complaints").add(x).then(function (ref) { x.id = ref.id; return x; }); },
      setCallStatus: function (id, s) { return db.doc("calls/" + id).update({ status: s }); },
      setComplaintStatus: function (id, s) { return db.doc("complaints/" + id).update({ status: s }); },
      allReviews: function () { return db.collection("reviews").orderBy("ts", "desc").limit(300).get().then(rows); },
      hideReview: function (id, hidden) { return db.doc("reviews/" + id).update({ hidden: !!hidden }); },
      watchFeed: function (cb, err) {
        var state = { orders: [], calls: [], complaints: [] }, subs = [];
        function sub(name, n) {
          subs.push(db.collection(name).orderBy("ts", "desc").limit(n).onSnapshot(function (s) { state[name] = rows(s); cb({ orders: state.orders, calls: state.calls, complaints: state.complaints }); }, function (e) { if (err) err(e); }));
        }
        sub("orders", 120); sub("calls", 80); sub("complaints", 80);
        return function () { subs.forEach(function (u) { try { u(); } catch (e) {} }); };
      }
    };
  }

  /* ---------- pick one ---------- */
  var ready;
  if (SCRIPT) ready = Promise.resolve(script);
  else if (window.claude && typeof window.claude.use === "function") {
    ready = Promise.all([window.claude.use("db").catch(function () { return null; }), window.claude.use("user").catch(function () { return null; })])
      .then(function (r) {
        if (!r[0]) return local;
        /* a shared viewer who may not write shared data tests on their own device instead */
        var u = r[1];
        if (!u || typeof u.can !== "function") return makeDb(r[0], u);
        return u.can("data.write").then(function (w) { return w === false ? local : makeDb(r[0], u); }, function () { return makeDb(r[0], u); });
      })
      .catch(function () { return local; });
  } else ready = Promise.resolve(local);

  window.AP_BACKEND = {
    ready: ready,
    kitchenKey: function (k) { if (k != null) lsSet("ap-kitchen-key", k); return lsGet("ap-kitchen-key", ""); },
    needsKey: !!SCRIPT
  };
})();
