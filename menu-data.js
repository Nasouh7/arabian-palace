/* =====================================================================
   ARABIAN PALACE — MENU DATA
   ---------------------------------------------------------------------
   Edit prices and items here. The website reads this file on load.
   Prices are in Kenyan shillings (KSh), no commas.

   Item fields:
     name      – dish name shown on the site
     price     – price in KSh (omit when using `variants`)
     desc      – optional one-line description
     img       – optional photo key (file in img/thumbs + img/dishes)
     id        – optional fixed key; keeps the photo, translations and ratings
                 when the name changes (otherwise the key is the name, lower-case
                 with dashes)
     variants  – optional sizes with their own price, e.g.
                 [{ label: "Half", price: 3200 }, { label: "Full", price: 6000 }]
     choices   – optional flavour/type list at the same price, e.g.
                 { label: "Flavour", items: ["Mango", "Passion"] }
     tag       – optional short label, e.g. "Pre-order", "Signature"

   Arabic/Swahili names, descriptions, ingredients and allergens for each
   dish are in menu-text.js, matched by the dish name (lower-case, dashes).
   If you rename a dish here, rename its key there too.
   ===================================================================== */

window.ARABIAN_PALACE = {
  restaurant: {
    name: "Arabian Palace",
    arabicName: "القصر العربي",
    tagline: "Your authentic Arabian cuisine",
    phoneDisplay: "0797 666 667",
    phoneIntl: "+254 797 666 667",
    whatsapp: "254797666667",          // digits only, country code first
    address: "Marcus Garvey Road, off Argwings Kodhek Road, Kilimani, Nairobi",
    hours: "Open every day, 8:00 am – 11:30 pm",
    mapsUrl: "https://maps.app.goo.gl/BGMQisgszoaheaHf7",
    instagram: "https://www.instagram.com/arabianpalaceke/",
    instagramHandle: "@arabianpalaceke",
    googleRating: "4.4",
    googleReviews: "690+",
  },

  signatures: [
    { name: "Mixed Grill Platter", item: "mixed-grill-platter", img: "mixed-grill-platter", blurb: "Kebabs, chicken, lamb and shish tawook for the whole table. The full platter adds tajin, rashush and starters.", from: 3700, cat: "barbeque" },
    { name: "Mandi", item: "laham-mandi", img: "laham-mandi", blurb: "Chicken or mutton over smoked, spiced rice, the Hadhrami way. For gatherings, pre-order a whole goat a day ahead.", from: 1150, cat: "chicken" },
    { name: "Shawarma Plate", item: "shawarma-plate", img: "beef-shawarma-rice", blurb: "Shaved beef or chicken over rice with tahini, pickles and slaw. The lunch half of Kilimani runs on.", from: 1000, cat: "shawarma" },
    { name: "Kunafa", item: "kunafa", img: "kunafa", blurb: "Crisp shredded pastry over soft cheese, finished with syrup. Chocolate and ice-cream versions too.", from: 700, cat: "desserts" },
  ],

  gallery: [
    { img: "whole-roast-goat", name: "Whole roast goat", note: "Pre-order a day ahead" },
    { img: "grand-platter", name: "The grand platter" },
    { img: "roast-lamb-rice", name: "Roast lamb on saffron rice" },
    { img: "pepperoni-pizza", name: "Pepperoni pizza" },
    { img: "zaatar-cheese", name: "Zaatar and cheese" },
    { img: "beef-cheese-pizza", name: "Beef and cheese" },
    { img: "falafel", name: "Falafel" },
    { img: "baba-ghanoush", name: "Baba ghanoush" },
    { img: "salad-platter", name: "Salad platter with flaky bread" },
    { img: "hummus-shawarma", name: "Hummus with shawarma" },
    { img: "chicken-shawarma-wraps", name: "Chicken shawarma wraps" },
    { img: "chicken-shawarma-rice", name: "Chicken shawarma on rice" },
    { img: "chicken-shawarma-plate", name: "Chicken shawarma plate" },
    { img: "beef-shawarma-plate", name: "Beef shawarma plate" },
    { img: "burger-plate", name: "Burgers" },
    { img: "shawarma-burger", name: "Shawarma burger" },
    { img: "vegetable-rice", name: "Vegetable rice" },
    { img: "koshari", name: "Koshari" },
    { img: "okra-tajin", name: "Okra tajin" },
    { img: "cucumber-yoghurt", name: "Cucumber yoghurt" },
    { img: "garlic-naan", name: "Garlic naan" },
    { img: "chicken-pepper-sauce", name: "Chicken in pepper sauce" },
    { img: "kunafa-cream", name: "Kunafa with cream" },
    { img: "spaghetti-tomato", name: "Spaghetti in tomato sauce" },
  ],

  categories: [
    { id: "breakfast", name: "Breakfast", note: "Special prices at breakfast time only.", items: [
      { id: "kebda-breakfast", name: "Kebda", img: "kebda-liver", price: 500 },
      { id: "laham-sughar-breakfast", name: "Laham sughar", price: 600 },
      { name: "Lahsa", price: 600, desc: "Shakshuka with cheese" },
      { name: "Minced meat", img: "minced-meat", price: 400 },
      { name: "Foul", img: "foul", price: 300, desc: "Fava beans with olive oil and spices" },
      { id: "fasolia-breakfast", name: "Fasolia", img: "kidney-beans-with-sauce", price: 300, desc: "Kidney beans in sauce" },
      { id: "kidney-beans-dry", name: "Kidney beans", price: 300 },
      { name: "Shakshuka", price: 300, choices: { label: "Style", items: ["White", "Red"] } },
      { name: "Mbaazi", price: 250 },
      { name: "Mahamri (5 pcs)", price: 150 },
      { name: "Samosa (4 pcs)", price: 250, choices: { label: "Filling", items: ["Vegetable", "Chicken", "Beef"] } },
      { id: "bajia", name: "Bhajia", price: 150 },
      { name: "Maru bhajia", price: 150 },
      { name: "Indian bhajia", price: 150 },
      { id: "swahili-potatoes", name: "Viazi karai", price: 150 },
      { name: "Swahili kebab (4 pcs)", price: 150, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
    ]},

    { id: "salads", name: "Salads & Starters", items: [
      { name: "Arabian Palace salad", img: "arabian-palace-salad", variants: [{ label: "Half, with naan", price: 800 }, { label: "Full, with rashush", price: 1400 }] },
      { name: "Hummus", img: "hummus", price: 500, desc: "With olive oil and warm bread" },
      { name: "Mutabal", img: "mutabal", price: 500, desc: "Smoky aubergine with tahini" },
      { name: "Baba ghanoush", img: "baba-ghanoush", price: 500 },
      { name: "Tabbouleh", img: "tabbouleh", price: 500, desc: "Parsley, bulgur, tomato and lemon" },
      { name: "Fattoush", img: "fattoush", price: 500, desc: "Crisp greens, tomato and cucumber with toasted bread and sumac" },
      { name: "Chicken salad", img: "chicken-salad", price: 700 },
      { name: "Garden salad", price: 600 },
      { name: "Arabian salad", img: "arabian-salad", price: 300 },
      { name: "Yoghurt with cucumber", img: "cucumber-yoghurt", price: 500 },
    ]},

    { id: "yemeni", name: "Yemeni & Arabian Dishes", note: "From the Yemeni kitchen: slow-cooked, sizzling and made to share.", items: [
      { name: "Saltah", price: 800, desc: "Yemen's national dish — bubbling lamb stew with fenugreek foam, served in a stone pot" },
      { id: "fahsa", name: "Fahsa laham", img: "fahsa", price: 1200, desc: "Shredded lamb in rich broth, served sizzling" },
      { name: "Agda laham", img: "agda-laham", price: 1200, desc: "Mutton stew with vegetables" },
      { name: "Agda chicken", price: 800 },
      { name: "Agda samak", price: 1300, desc: "Fish stew" },
      { name: "Laham sughar", price: 1200 },
      { name: "Chicken sughar", price: 1000 },
      { id: "kebda-liver", name: "Kebda", img: "kebda-liver", price: 1000 },
      { name: "Goat kidney", price: 1200 },
      { name: "Foul galaba", price: 500 },
      { id: "kidney-beans-with-sauce", name: "Fasolia (kidney beans)", img: "kidney-beans-with-sauce", price: 800 },
      { name: "Fatta marag laham", img: "fatta-lahma", price: 1500 },
      { name: "Fatta tamer", price: 600, desc: "With dates" },
      { name: "Fatta mouz", price: 600, desc: "With banana" },
    ]},

    { id: "mutton", name: "Mutton Specialties", note: "Rice dishes come with the house soup, salad and sauces.", items: [
      { name: "Laham mandi", img: "laham-mandi", price: 1300, tag: "Signature", desc: "Tender mutton over smoked rice" },
      { name: "Laham madhbi", price: 1300, desc: "Grilled on hot stones" },
      { name: "Laham burma", price: 1300 },
      { name: "Laham hanidh", img: "laham-hanidh", price: 1200 },
      { id: "zurbian", name: "Laham zurbian", img: "zurbian", price: 1200, desc: "Mutton biryani with potatoes and saffron rice" },
      { name: "Mukalkal", price: 2500 },
      { name: "Maktum laham", variants: [{ label: "Regular", price: 1300 }, { label: "Large", price: 2500 }] },
      { name: "Extra meat", price: 900 },
      { name: "Whole goat mandi", img: "whole-roast-goat", tag: "Pre-order", desc: "With rice. Order a day ahead.", variants: [{ label: "Quarter", price: 5000 }, { label: "Half", price: 11000 }, { label: "Full", price: 21000 }, { label: "VIP, with nuts", price: 25000 }] },
      { name: "Whole goat hanidh", img: "whole-roast-goat", tag: "Pre-order", price: 18000, desc: "Order a day ahead." },
    ]},

    { id: "chicken", name: "Chicken Specialties", note: "Rice dishes come with the house soup, salad and sauces.", items: [
      { name: "Chicken mandi", img: "chicken-mandi", price: 1150, tag: "Signature", desc: "Smoked chicken over long-grain rice spiced the Hadhrami way" },
      { name: "Chicken hanidh", price: 1150, desc: "Slow-roasted until it falls off the bone" },
      { name: "Chicken madhbi", img: "chicken-madhbi", price: 1150, desc: "Grilled on hot stones" },
      { id: "chicken-madghout", name: "Madghout, full chicken", img: "chicken-madghout", price: 2500, desc: "A whole chicken pressure-cooked with rice and whole spices" },
      { name: "Chicken shawaya", variants: [{ label: "Half", price: 1000 }, { label: "Full", price: 1800 }] },
    ]},

    { id: "fish", name: "Fish Specialties", items: [
      { name: "Sayadiya", price: 1300, desc: "Fried fish over caramelised-onion rice" },
      { id: "deep-fried-fish", name: "Deep-fried fish", price: 1000 },
      { id: "grilled-fish", name: "Grilled fish with rice", price: 1300 },
      { name: "Arabian Palace fish", variants: [{ label: "Small", price: 1300 }, { label: "Medium", price: 1800 }, { label: "Large", price: 2500 }] },
    ]},

    { id: "barbeque", name: "BBQ & Grills", items: [
      { name: "Mixed grill platter", img: "mixed-grill-platter", tag: "For sharing", desc: "Kebabs, chicken, lamb and tawook. The full platter adds tajin, rashush, fattoush and hummus or mutabal.", variants: [{ label: "Half", price: 3700 }, { label: "Full", price: 6500 }] },
      { name: "T-bone steak", img: "t-bone-steak", price: 1200, desc: "With rice and chips" },
      { name: "Lamb chops", img: "lamb-chops", price: 1700 },
      { id: "grilled-chicken", name: "Chicken grill", img: "grilled-chicken", price: 1100 },
      { name: "Shish tawook", img: "shish-tawook", price: 1150, desc: "Marinated chicken skewers with garlic sauce" },
      { name: "Mshikaki", img: "mshikaki", price: 1150 },
      { name: "Beef kebab", img: "beef-kebab", price: 1150 },
      { name: "Chicken kebab", img: "chicken-kebab", price: 1150 },
      { id: "grilled-wings", name: "Chicken wings (8 pcs)", price: 900 },
      { id: "chicken-wings-honey-glazed", name: "Honey-glazed wings", img: "chicken-wings-honey-glazed", price: 800 },
      { id: "poussin-chicken", name: "Chicken poussin, full chicken", price: 2500 },
      { name: "Kebda grill (goat)", price: 800 },
    ]},

    { id: "shawarma", name: "Shawarma", items: [
      { name: "Arabian Palace shawarma", img: "arabian-palace-shawarma", price: 650, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
      { name: "Shawarma sandwich", img: "shawarma-sandwich", price: 550, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
      { name: "Shawarma plate", img: "shawarma-plate", price: 1000, desc: "Over rice with tahini, pickles and slaw", choices: { label: "Meat", items: ["Chicken", "Beef"] } },
    ]},

    { id: "sandwiches", name: "Sandwiches", items: [
      { name: "Zinger sandwich", img: "zinger-sandwich", price: 800 },
      { name: "Fajita sandwich", price: 600, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
      { name: "Shish tawook sandwich", price: 600 },
      { name: "Kebab sandwich", price: 600, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
      { id: "cordon-bleu-sandwich", name: "Cordon bleu", price: 1000 },
      { name: "Minced meat sandwich", price: 500 },
      { name: "Vegetarian sandwich", price: 500 },
    ]},

    { id: "burgers", name: "Burgers", note: "Beef burgers come with honey mustard sauce, cocktail sauce and cheese.", items: [
      { name: "Classic beef burger", img: "classic-beef-burger", variants: [{ label: "Single", price: 650 }, { label: "Double", price: 1100 }] },
      { name: "Caramelised beef burger", variants: [{ label: "Single", price: 800 }, { label: "Double", price: 1500 }] },
      { name: "Smash burger", variants: [{ label: "Single", price: 700 }, { label: "Double", price: 1300 }] },
      { name: "Smoked beef burger", variants: [{ label: "Single", price: 800 }, { label: "Double", price: 1500 }] },
      { name: "Mushroom burger", variants: [{ label: "Single", price: 600 }, { label: "Double", price: 1600 }] },
      { name: "Classic chicken burger", variants: [{ label: "Single", price: 600 }, { label: "Double", price: 1100 }] },
      { name: "Chicken grill burger", variants: [{ label: "Single", price: 750 }, { label: "Double", price: 1400 }] },
      { id: "chicken-crunch-burger", name: "Crunchy chicken burger", variants: [{ label: "Single", price: 800 }, { label: "Double", price: 1500 }] },
      { id: "vegetarian-cheese-burger", name: "Vegetarian burger", price: 1000 },
      { id: "crunchy-chicken-wings", name: "Crunchy chicken wings (8 pcs)", price: 1000, desc: "With fries" },
      { id: "chicken-strips", name: "Chicken strips (6 pcs)", img: "chicken-strips", price: 1000, desc: "With fries" },
      { id: "chicken-nuggets", name: "Chicken nuggets (9 pcs)", price: 900, desc: "With fries" },
    ]},

    { id: "international", name: "International Specialties", items: [
      { id: "shorba-adas", name: "Lentil soup", img: "shorba-adas", price: 300 },
      { id: "vegetable-shurba", name: "Vegetable soup", img: "vegetable-shurba", price: 300 },
      { name: "Butter chicken", img: "butter-chicken", price: 1100 },
      { name: "Chicken korma", img: "chicken-korma", price: 1200 },
      { name: "Chicken curry", price: 1000 },
      { id: "shanghai-chicken", name: "Chicken Shanghai", img: "shanghai-chicken", price: 1200 },
      { id: "stir-fry-chicken", name: "Stir-fry chicken", price: 1200 },
      { id: "oyster-beef-chicken", name: "Oyster chicken or beef", img: "oyster-beef-chicken", price: 1200, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
      { name: "Beef sizzler", img: "beef-sizzler", price: 1250 },
      { name: "Pepper steak", img: "pepper-steak", price: 1500 },
      { name: "Mutton stew", price: 1500 },
      { name: "Hummus with meat", img: "hummus-shawarma", price: 1000 },
      { name: "Rice with chickpeas", price: 1000 },
      { name: "Rice with vegetables", img: "vegetable-rice", price: 1000 },
      { name: "Mixed vegetable makhani", price: 800 },
      { id: "grilled-vegetables", name: "Grilled mixed vegetables", img: "grilled-vegetables", price: 800 },
    ]},

    { id: "steaks", name: "Steaks & Fillets", note: "Served with your choice of rice, mash, chips, grilled vegetables or sauté potatoes.", items: [
      { name: "Beef steak, grilled", price: 1800 },
      { name: "Fillet beef, grilled", price: 1200 },
      { name: "Fillet with mushroom sauce", img: "fillet-with-mushroom-sauce", price: 1800 },
      { name: "Fillet with pepper sauce", price: 1800 },
      { name: "Piccata with mushroom sauce", price: 1400 },
      { name: "Piccata with pepper sauce", price: 1400 },
      { name: "Piccata with lemon sauce", price: 1800 },
      { name: "Chicken with lemon sauce", price: 1200 },
      { name: "Chicken with pepper sauce", img: "chicken-pepper-sauce", price: 1200 },
      { name: "Mountain chicken", price: 1400 },
      { name: "Chicken grill (fillet breast)", price: 1400 },
      { name: "Salmon with dill sauce", price: 1600 },
    ]},

    { id: "egyptian", name: "Egyptian Cuisine", note: "From our Egyptian kitchen.", items: [
      { name: "Tajin beef with onion", price: 1000 },
      { id: "tajin-bamia-okra", name: "Tajin laham bamia", img: "tajin-bamia-okra", price: 1000, desc: "Okra with meat" },
      { id: "tajin-potato", name: "Tajin potatoes with meat", img: "tajin-potato", price: 1000 },
      { id: "tajin-macaroni-bechamel", name: "Tajin béchamel with meat", img: "tajin-macaroni-bechamel", price: 800 },
      { id: "tajin-macaroni-negresco", name: "Tajin béchamel with chicken", img: "tajin-macaroni-negresco", price: 800 },
      { name: "Moussaka", price: 500 },
      { name: "Molokhia", price: 500 },
      { name: "Bamia, plain", img: "okra-tajin", price: 500 },
      { id: "warq-enab-with-beef", name: "Warq enab (12 pcs)", img: "warq-enab-with-beef", price: 800, desc: "Vine leaves" },
      { name: "Hawawshi", img: "hawawshi", price: 400, desc: "Spiced minced beef baked in bread" },
      { name: "Fateer meshaltet", price: 800 },
      { name: "Koshari", img: "koshari", price: 700 },
      { name: "Falafel (1 pc)", img: "falafel", price: 50 },
      { name: "Foul masri", price: 500 },
      { name: "Eggplant pickles", price: 300 },
      { id: "shareya-rice", name: "Rice with sha'reya", img: "shareya-rice", price: 450, desc: "Rice with vermicelli" },
    ]},

    { id: "pasta", name: "Pasta", items: [
      { name: "Spaghetti sarada", img: "spaghetti-tomato", price: 500 },
      { name: "Spaghetti, white sauce", price: 500 },
      { name: "Penne sarada", price: 700 },
      { name: "Penne, white sauce", price: 700 },
      { name: "Chicken alfredo", img: "chicken-alfredo", price: 1000 },
      { name: "Spaghetti bolognese", img: "spaghetti-bolognese", price: 1000 },
      { name: "Penne arrabbiata", img: "penne-arrabbiata", price: 1000 },
      { name: "Penne carbonara", price: 1000 },
    ]},

    { id: "pizza", name: "Pizza", items: [
      { name: "Margherita pizza", variants: [{ label: "Medium", price: 700 }, { label: "Large", price: 1100 }] },
      { name: "Pepperoni pizza", img: "pepperoni-pizza", variants: [{ label: "Medium", price: 900 }, { label: "Large", price: 1300 }] },
      { name: "Beef BBQ pizza", img: "beef-cheese-pizza", variants: [{ label: "Medium", price: 800 }, { label: "Large", price: 1200 }] },
      { name: "Chicken BBQ pizza", variants: [{ label: "Medium", price: 800 }, { label: "Large", price: 1200 }] },
      { name: "Chicken strips pizza", variants: [{ label: "Medium", price: 800 }, { label: "Large", price: 1200 }] },
      { name: "Chicken ranch pizza", variants: [{ label: "Medium", price: 900 }, { label: "Large", price: 1300 }] },
      { name: "Mexicano pizza", desc: "Spicy, with chicken or beef", variants: [{ label: "Medium", price: 800 }, { label: "Large", price: 1200 }] },
      { name: "Chicken shawarma pizza", variants: [{ label: "Medium", price: 800 }, { label: "Large", price: 1200 }] },
      { name: "Mixed pizza, half metre", tag: "For sharing", price: 2500 },
    ]},

    { id: "manoushe", name: "Manoushe", items: [
      { name: "Manoushe zaatar", price: 800 },
      { name: "Manoushe cheese and zaatar", img: "zaatar-cheese", price: 800 },
      { name: "Manoushe cheese and vegetables", price: 800 },
      { name: "Manoushe cheese with black seeds", price: 800 },
      { name: "Manoushe mix", price: 800 },
      { name: "Manoushe sujuk", price: 800 },
      { name: "Manoushe lahm bi ajeen", price: 800 },
      { name: "Manoushe plain", price: 800 },
      { name: "Manoushe chocolate and cheese", price: 1000 },
      { name: "Manoushe black olives and cheese", price: 1000 },
    ]},

    { id: "bread", name: "Bread", items: [
      { name: "Rashush", img: "rashush", price: 350, desc: "Yemeni tandoor flatbread, small" },
      { name: "Rateb", img: "rateb", price: 400, desc: "Small" },
      { name: "Naan", img: "naan", variants: [{ label: "Plain", price: 80 }, { label: "Butter", price: 100 }, { label: "Garlic", price: 100 }, { label: "Brown", price: 100 }, { label: "Pakistani", price: 200 }] },
    ]},

    { id: "sides", name: "Fries & Sides", items: [
      { name: "Plain chips", price: 350 },
      { name: "Masala chips", price: 500 },
      { name: "Garlic chips", price: 500 },
      { name: "Poussin chips", price: 500 },
      { name: "Loaded chips", price: 800, choices: { label: "Meat", items: ["Chicken", "Beef"] } },
      { name: "Arabian Palace chips", img: "arabian-palace-chips", price: 1000, desc: "Loaded" },
      { name: "Nachos chips", price: 1000 },
      { name: "Lebanese spicy potatoes", price: 700 },
      { name: "Potato wedges", price: 600 },
      { name: "Roasted potatoes", price: 600 },
      { name: "Sauté potatoes", price: 600 },
      { name: "Mashed potatoes", price: 500 },
    ]},

    { id: "sauces", name: "Extra Sauces", items: [
      { name: "Garlic sauce", img: "garlic-sauce", price: 150 },
      { name: "Tahini sauce", img: "tahini-sauce", price: 150 },
      { name: "Sahawiq", price: 100 },
      { name: "Sahawiq with cheese", price: 200 },
      { name: "Chutney", price: 200 },
      { name: "Poussin sauce", img: "poussin-sauce", price: 300 },
      { name: "Pepper sauce", img: "pepper-sauce", price: 300 },
      { name: "Mushroom sauce", img: "mushroom-sauce", price: 300 },
      { name: "Yoghurt", img: "yoghurt", price: 300 },
    ]},

    { id: "desserts", name: "Arabian Desserts", items: [
      { name: "Kunafa", img: "kunafa", price: 700, tag: "Signature" },
      { name: "Kunafa chocolate", img: "kunafa-chocolate", price: 800 },
      { name: "Kunafa pistachio", price: 1000 },
      { name: "Kunafa Lotus", price: 1000 },
      { id: "kunafa-ice-cream", name: "Kunafa with chocolate ice cream", price: 900 },
      { name: "Maasoub", img: "maasoub", price: 900, desc: "Banana, bread, cream and honey" },
      { name: "Arika", img: "arika", price: 700, desc: "Dates, bread, honey and cream" },
      { name: "Basbousa", price: 400 },
    ]},

    { id: "cakes", name: "Cakes & Pastries", items: [
      { name: "Cheesecake", price: 600, desc: "Served cold or hot", choices: { label: "Flavour", items: ["Chocolate", "Lotus", "Strawberry"] } },
      { name: "Milk cake", price: 500, choices: { label: "Flavour", items: ["Chocolate", "Kiwi", "Mango", "Lotus"] } },
      { name: "Tiramisu", price: 600 },
      { name: "San Sebastián cheesecake", price: 700 },
      { name: "Mousse cake", price: 600 },
      { name: "Chocolate cake", price: 400 },
      { name: "Gâteau", price: 400 },
      { name: "Brownies", price: 400 },
      { name: "Éclair", price: 200 },
      { name: "Doughnut", price: 200 },
    ]},

    { id: "hot-drinks", name: "Hot Drinks", items: [
      { name: "Karak tea with milk", img: "karak-tea-with-milk", price: 150, tag: "House favourite" },
      { name: "Spicy karak tea", price: 150 },
      { name: "Turkish coffee", price: 350 },
      { name: "Espresso", variants: [{ label: "Small", price: 200 }, { label: "Large", price: 300 }] },
      { name: "Espresso macchiato", price: 400 },
      { name: "Espresso con panna", price: 400 },
      { name: "Ristretto", price: 400 },
      { name: "Lungo", price: 400 },
      { name: "Piccolo", price: 400, desc: "Single espresso" },
      { name: "Cortado", price: 500 },
      { name: "Long black", variants: [{ label: "Small", price: 350 }, { label: "Large", price: 400 }] },
      { name: "Americano", price: 400 },
      { name: "Flat white", price: 400 },
      { name: "Latte", price: 400 },
      { name: "Spanish latte", price: 500 },
      { name: "Cappuccino", img: "cappuccino", variants: [{ label: "Small", price: 400 }, { label: "Large", price: 500 }] },
      { name: "Extra cappuccino", price: 500 },
      { name: "Affogato", price: 500 },
      { name: "Vanilla latte", price: 500 },
      { name: "Very vanilla latte", price: 500 },
      { name: "Caramel latte", price: 500 },
      { name: "Cinnamon latte", price: 450 },
      { name: "Mocha", price: 500 },
      { name: "Mint mocha", price: 500 },
      { name: "White mocha", price: 500 },
      { name: "Hot chocolate", price: 400 },
    ]},

    { id: "tea", name: "Tea & Milk", items: [
      { name: "Red tea", price: 150 },
      { name: "Tea with flavours", price: 200 },
      { name: "Lemon tea", price: 200 },
      { name: "Dawa tea", price: 300, desc: "Ginger, lemon and honey" },
      { name: "Hot milk", price: 300 },
      { name: "Simo hot", price: 400 },
      { name: "Macchiato for kids", price: 400 },
    ]},

    { id: "iced-coffee", name: "Iced Coffee", items: [
      { name: "Iced americano", price: 450 },
      { name: "Iced latte", price: 450 },
      { name: "Iced Spanish latte", price: 450 },
      { name: "Iced vanilla latte", price: 450 },
      { name: "Iced caramel latte", price: 450 },
      { name: "Iced caramel macchiato", price: 450 },
      { name: "Iced mocha", price: 450 },
      { name: "Iced cappuccino", price: 400 },
      { name: "Frappuccino", price: 500 },
    ]},

    { id: "shakes", name: "Milkshakes & Smoothies", items: [
      { name: "Milkshake", price: 450, choices: { label: "Flavour", items: ["Vanilla", "Caramel", "Hazelnut", "Chocolate", "Strawberry", "Raspberry", "Blueberry", "Blackberry", "Kiwi", "Avocado", "Mango", "Pineapple", "Caramel coffee"] } },
      { id: "iced-chocolate", name: "Ice chocolate", price: 450 },
      { name: "Banana split", price: 450 },
      { name: "Smoothie", img: "smoothie", price: 500, choices: { label: "Flavour", items: ["Strawberry", "Raspberry", "Kiwi", "Avocado"] } },
    ]},

    { id: "juices", name: "Juices, Mojitos & Lemonades", items: [
      { name: "Fresh juice", price: 450, choices: { label: "Fruit", items: ["Mixed", "Orange", "Lemon", "Pineapple", "Passion", "Watermelon", "Avocado", "Mango", "Kiwi", "Papaya", "Carrot", "Tangerine", "Cucumber"] } },
      { name: "Juice blends", price: 450, choices: { label: "Blend", items: ["Watermelon mint", "Pineapple mint", "Carrot orange", "Strawberry mango", "Mango passion", "Apple ginger", "Watermelon mango"] } },
      { name: "Mojito", img: "mojito", price: 450, choices: { label: "Flavour", items: ["Mint", "Lemon", "Orange", "Passion", "Watermelon", "Black grape", "Blue lagoon", "Pinnacle"] } },
      { name: "Lemonade", price: 450, choices: { label: "Flavour", items: ["Classic", "Strawberry", "Mint", "Elderflower", "Blueberry", "Passion", "Cucumber", "Watermelon"] } },
      { name: "Ginger shot", price: 300 },
    ]},

    { id: "mocktails", name: "Mocktails & Cold Specials", items: [
      { name: "Mocktail", price: 550 },
      { name: "Tropical", price: 550 },
      { name: "Mango lassi", price: 550 },
      { name: "Lian", price: 550 },
      { name: "Elaine", price: 550, desc: "Kiwi, strawberry, raspberry and ice cream" },
      { name: "Green mountain", price: 450 },
      { name: "Three juices", price: 450 },
      { id: "fakhfakhina", name: "Fakhfakhina fruit", price: 600, desc: "Layered fruit and ice cream" },
      { name: "Araisi", price: 600 },
      { id: "iced-tea-with-flavour", name: "Iced tea", price: 450, choices: { label: "Flavour", items: ["Lemon", "Raspberry", "Peach", "Apple", "Passion"] } },
      { name: "Ice cream", price: 450 },
      { name: "Fruit ice cream plate", price: 600 },
    ]},

    { id: "soft-drinks", name: "Soft Drinks & Water", items: [
      { id: "soda", name: "Soda (can)", price: 250 },
      { name: "Sparkling water", price: 250 },
      { name: "Water", price: 150 },
    ]},
  ],
};
