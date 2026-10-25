/* =====================================================================
   ARABIAN PALACE — SITE SETTINGS
   ---------------------------------------------------------------------
   siteUrl     Public address of the website once it is live, e.g.
               "https://arabianpalace.co.ke/". Used by tables.html to print
               the QR codes. Leave "" while testing.
   tables      How many numbered tables have a QR card.
   tablePicker true lets guests pick a table by hand ("Choose your table").
               Set false once the QR cards are on the tables, so only a scan
               opens ordering.
   backend     Where ratings and table orders are kept.
                 scriptUrl   the Google Apps Script web-app URL from
                             backend/README.md. When it is "" the site keeps
                             ratings and orders on the guest's own device
                             (fine for a demo, not for the restaurant).
   kitchenKey  Not stored here. The kitchen screen asks for it once.
   halal       Fill these in to print the certificate line in the halal
               section, e.g. certifier: "Kenya Bureau of Halal Certification".
   ===================================================================== */
window.AP_CONFIG = {
  siteUrl: "",
  tables: 30,
  tablePicker: true,
  backend: {
    scriptUrl: ""
  },
  halal: {
    certifier: "",
    number: "",
    validUntil: ""
  },
  profilePages: 6,
  whatsapp: "254797666667",
  phone: "+254797666667"
};
