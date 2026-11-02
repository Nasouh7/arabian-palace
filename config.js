/* =====================================================================
   ARABIAN PALACE — SITE SETTINGS
   ---------------------------------------------------------------------
   siteUrl     Public address of the website. Used by tables.html for the
               QR codes and by the build for Google (canonical links, sitemap).
   whatsapp    The WhatsApp number online orders and complaints go to,
               country code first, digits only.
   orderTypes  What guests can choose when they order online:
               ["delivery", "pickup"], ["delivery"] or ["pickup"].
               In the restaurant, the QR codes on the tables open the menu
               for looking only; the waiter takes the order.
   backend     Where dish ratings and reviews are kept.
                 scriptUrl   the Google Apps Script web-app URL from
                             backend/README.md. When it is "" each guest's
                             ratings stay on their own phone.
   halal       Fill these in to print the certificate line in the halal
               section, e.g. certifier: "Kenya Bureau of Halal Certification".
   ===================================================================== */
window.AP_CONFIG = {
  siteUrl: "https://arabianpalace.co.ke/",
  whatsapp: "254797666667",
  phone: "+254797666667",
  orderTypes: ["delivery", "pickup"],
  backend: {
    scriptUrl: ""
  },
  halal: {
    certifier: "",
    number: "",
    validUntil: ""
  },
  profilePages: 6
};
