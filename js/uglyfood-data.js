/**
 * UGLYFOOD AI — INITIAL MOCK DATASET & AI COMPUTER VISION PRESETS
 * Persisted via localStorage so newly scanned crops and mock checkouts
 * update the Marketplace, Farmer Atelier, and Impact Ledger in real time.
 */
window.UGLYFOOD_INITIAL_DATA = {
  platformStats: {
    wasteDivertedKg: 148920,
    farmerEarningsPhp: 6420500,
    avgSavingsPct: 48,
    verifiedBatches: 3842
  },

  userImpact: {
    ordersCount: 6,
    savedKg: 18.5,
    savedPhp: 1140,
    co2AvoidedKg: 46.2
  },

  farms: [
    {
      id: 'farm-atok',
      kicker: 'FARM ARCHIVE 01 · BENGUET',
      name: 'Atok Highland Collective',
      region: 'Benguet (< 50 km Hub)',
      farmer: 'Manong Ernesto & 14 Igorot Smallholders',
      bio: 'High-altitude terraced root crops grown at 2,100 meters. Frost and rocky mountain loam create forked, intertwined carrots with extraordinary sugar density.',
      wasteDivertedKg: 38400,
      directSharePct: 89
    },
    {
      id: 'farm-bukidnon',
      kicker: 'FARM ARCHIVE 02 · BUKIDNON',
      name: 'Bukidnon Volcanic Terraces',
      region: 'Bukidnon',
      farmer: 'Aling Marites & Kitanglad Growers',
      bio: 'Heirloom open-pollinated tomatoes and nightshades. Heavy mountain mist causes natural cat-facing ribs rejected by supermarket chains despite peak lycopene levels.',
      wasteDivertedKg: 31200,
      directSharePct: 88
    },
    {
      id: 'farm-zambales',
      kicker: 'FARM ARCHIVE 03 · ZAMBALES',
      name: 'Zambales Orchard Cooperative',
      region: 'Zambales',
      farmer: 'Kuya Dante & Palauig Mango Guild',
      bio: 'Century-old Carabao mango trees harvested at full tree-ripened maturity. Sugar freckles on the peel indicate 19° Brix sweetness without calcium carbide ripening.',
      wasteDivertedKg: 27850,
      directSharePct: 91
    },
    {
      id: 'farm-laguna',
      kicker: 'FARM ARCHIVE 04 · LAGUNA',
      name: 'Calauan Lakefront Plots',
      region: 'Laguna (< 35 km Hub)',
      farmer: 'Nanay Rosa & Laguna Basin Permaculture',
      bio: 'Pesticide-free eggplants, squash, and bananas grown in alluvial silt. Wind-curved fruits bypass 4 layers of Divisoria middlemen to reach kitchens within 14 hours.',
      wasteDivertedKg: 24100,
      directSharePct: 87
    },
    {
      id: 'farm-batangas',
      kicker: 'FARM ARCHIVE 05 · BATANGAS',
      name: 'Lipa Volcanic Ridges',
      region: 'Batangas',
      farmer: 'Ka Julio & Taal Upland Stewards',
      bio: 'Mineral-rich volcanic soil producing dense, multi-lobed bell peppers, russet papayas, and aromatic native ginger.',
      wasteDivertedKg: 19650,
      directSharePct: 88
    }
  ],

  listings: [
    {
      id: 'uf-crop-01',
      title: 'Twin & Twisted Heirloom Carrots',
      category: 'Root Crops',
      grade: 'Grade B',
      gradeLabel: 'Grade B · Oddly Shaped',
      farmName: 'Atok Highland Collective',
      region: 'Benguet (< 50 km Hub)',
      harvestDate: 'Harvested 11 hrs ago · Batch #ATK-904',
      image: './assets/carrots.jpg',
      priceB2C: 68,
      marketPriceB2C: 130,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1450,
      marketPriceB2B: 2900,
      unitB2B: 'per 25 kg crate',
      stockKg: 340,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 99,
      edibilityScore: 100,
      cvConfidence: 99.4,
      brixIndex: '11.4° Bx (High Highland Sweetness)',
      cosmeticDefects: [
        'Bifurcated twin taproot geometry caused by rocky mountain loam',
        'Natural helical twist along lower root — 0% vascular bruising',
        'Zero fungal mycelium or soft-rot signature under NIR scan'
      ],
      description: 'Crisp, cold-sweetened highland carrots rejected by retail chains solely for intertwined twin roots. Identical cellular crunch and beta-carotene profile to Grade-AAA exports.'
    },
    {
      id: 'uf-crop-02',
      title: 'Cat-Faced Heirloom Beefsteak Tomatoes',
      category: 'Vegetables',
      grade: 'Grade A-',
      gradeLabel: 'Grade A- · Slight Blemish',
      farmName: 'Bukidnon Volcanic Terraces',
      region: 'Bukidnon',
      harvestDate: 'Harvested 16 hrs ago · Batch #BUK-412',
      image: './assets/tomatoes.jpg',
      priceB2C: 74,
      marketPriceB2C: 140,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1580,
      marketPriceB2B: 3200,
      unitB2B: 'per 25 kg crate',
      stockKg: 425,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 98,
      edibilityScore: 100,
      cvConfidence: 99.1,
      brixIndex: '7.8° Bx · Rich Umami Glutamates',
      cosmeticDefects: [
        'Epidermal ribbed ribbing & blossom-end seam lines (12% surface area)',
        'Asymmetrical multi-locule chamber growth',
        'Skin barrier 100% sealed — zero bacterial ingress or fermentation'
      ],
      description: 'Heavy, deeply ribbed heirloom tomatoes with natural corky seam lines from cool mountain nights. Exceptional flesh-to-seed ratio ideal for fresh slicing, roasting, and commercial sauces.'
    },
    {
      id: 'uf-crop-03',
      title: 'Sun-Freckled Carabao Mangoes',
      category: 'Fruits',
      grade: 'Grade A-',
      gradeLabel: 'Grade A- · Slight Blemish',
      farmName: 'Zambales Orchard Cooperative',
      region: 'Zambales',
      harvestDate: 'Harvested 9 hrs ago · Batch #ZMB-778',
      image: './assets/mangoes.jpg',
      priceB2C: 95,
      marketPriceB2C: 180,
      unitB2C: 'per 1 kg pack',
      priceB2B: 2100,
      marketPriceB2B: 4100,
      unitB2B: 'per 25 kg crate',
      stockKg: 280,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 99,
      edibilityScore: 100,
      cvConfidence: 99.6,
      brixIndex: '19.2° Bx (Peak Tree-Ripened Honey)',
      cosmeticDefects: [
        'Superficial dark sugar lenticel freckles on outer peel (18% area)',
        'Slight crescent curvature at stem shoulder',
        'Internal mesocarp 100% pristine golden fiberless pulp'
      ],
      description: 'Export supermarkets demand spotless yellow skin, forcing farmers to discard their sweetest tree-ripened mangoes. These sugar-freckled fruits offer unmatched aroma and zero chemical ripeners.'
    },
    {
      id: 'uf-crop-04',
      title: 'Crescent-Curved Heirloom Talong',
      category: 'Vegetables',
      grade: 'Grade B',
      gradeLabel: 'Grade B · Oddly Shaped',
      farmName: 'Calauan Lakefront Plots',
      region: 'Laguna (< 35 km Hub)',
      harvestDate: 'Harvested 7 hrs ago · Batch #LAG-209',
      image: './assets/eggplants.jpg',
      priceB2C: 58,
      marketPriceB2C: 110,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1250,
      marketPriceB2B: 2450,
      unitB2B: 'per 25 kg crate',
      stockKg: 190,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 98,
      edibilityScore: 100,
      cvConfidence: 98.9,
      brixIndex: 'Low-Seed Creamy Pith · 94% Moisture',
      cosmeticDefects: [
        'Pronounced 45° crescent arc from monsoon wind exposure',
        'Minor tan wind-rubbed russeting near calyx',
        'Zero fruit-borer perforation — verified pesticide-free'
      ],
      description: 'Glossy deep-aubergine eggplants that curved naturally in open-field lake winds. Tender skin, virtually seedless interior, and harvested this morning.'
    },
    {
      id: 'uf-crop-05',
      title: 'Heart-Knotted Highland Potatoes',
      category: 'Root Crops',
      grade: 'Grade B',
      gradeLabel: 'Grade B · Oddly Shaped',
      farmName: 'Atok Highland Collective',
      region: 'Benguet (< 50 km Hub)',
      harvestDate: 'Harvested 18 hrs ago · Batch #ATK-918',
      image: './assets/potatoes.jpg',
      priceB2C: 62,
      marketPriceB2C: 118,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1340,
      marketPriceB2B: 2650,
      unitB2B: 'per 25 kg crate',
      stockKg: 610,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 99,
      edibilityScore: 100,
      cvConfidence: 99.3,
      brixIndex: '21.8% Dry Matter (Crisp Roasting Grade)',
      cosmeticDefects: [
        'Heart-shaped bilobed tuber geometry & knobby secondary growth',
        'Dry mountain soil patina — zero green solanine chlorophyll',
        'Internal starch density 100% uniform on acoustic check'
      ],
      description: 'High-starch Cordillera Granola potatoes with heart-shaped and knobby contours that fail automated supermarket sizers. Ideal for golden mash, fries, and stews.'
    },
    {
      id: 'uf-crop-06',
      title: 'Sugar-Flecked Lakatan & Saba Bananas',
      category: 'Fruits',
      grade: 'Grade A-',
      gradeLabel: 'Grade A- · Slight Blemish',
      farmName: 'Calauan Lakefront Plots',
      region: 'Laguna (< 35 km Hub)',
      harvestDate: 'Harvested 12 hrs ago · Batch #LAG-315',
      image: './assets/bananas.jpg',
      priceB2C: 52,
      marketPriceB2C: 96,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1120,
      marketPriceB2B: 2200,
      unitB2B: 'per 25 kg crate',
      stockKg: 310,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 97,
      edibilityScore: 100,
      cvConfidence: 98.8,
      brixIndex: '20.5° Bx · High Potassium Density',
      cosmeticDefects: [
        'Leaf-rubbed peel streaks from natural bunch sway',
        'Uneven hand finger sizing (petite & jumbo fingers mixed)',
        'Inner fruit firm, creamy, and 100% unbruised'
      ],
      description: 'Naturally bunched Lakatan and Saba hands with leaf-scuffed skins. Bypassing cold-storage middlemen preserves their custard-like sweetness.'
    },
    {
      id: 'uf-crop-07',
      title: 'Asymmetrical Four-Lobed Bell Peppers',
      category: 'Vegetables',
      grade: 'Grade B',
      gradeLabel: 'Grade B · Oddly Shaped',
      farmName: 'Lipa Volcanic Ridges',
      region: 'Batangas',
      harvestDate: 'Harvested 10 hrs ago · Batch #BAT-114',
      image: './assets/peppers-squash.jpg',
      priceB2C: 88,
      marketPriceB2C: 175,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1890,
      marketPriceB2B: 3850,
      unitB2B: 'per 25 kg crate',
      stockKg: 175,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 98,
      edibilityScore: 100,
      cvConfidence: 99.0,
      brixIndex: '6.9° Bx · Thick Pericarp Wall (6.4mm)',
      cosmeticDefects: [
        'Twisted 4-lobe shoulder asymmetry & transitional red/olive blush',
        'Minor sun-fleck corking on upper shoulder',
        'Crisp turgor pressure verified at 98.4%'
      ],
      description: 'Thick-walled volcanic bell peppers caught mid-ripening between emerald green and terracotta red. Twice the vitamin C of forced greenhouse peppers at half the price.'
    },
    {
      id: 'uf-crop-08',
      title: 'Russet-Skinned Golden Solo Papaya',
      category: 'Fruits',
      grade: 'Grade C',
      gradeLabel: 'Grade C · Processing & Bulk Ready',
      farmName: 'Lipa Volcanic Ridges',
      region: 'Batangas',
      harvestDate: 'Harvested 14 hrs ago · Batch #BAT-204',
      image: './assets/papaya-citrus.jpg',
      priceB2C: 46,
      marketPriceB2C: 95,
      unitB2C: 'per 1 kg pack',
      priceB2B: 980,
      marketPriceB2B: 2100,
      unitB2B: 'per 25 kg crate',
      stockKg: 490,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 97,
      edibilityScore: 100,
      cvConfidence: 98.7,
      brixIndex: '13.8° Bx · High Papain Enzyme Activity',
      cosmeticDefects: [
        'Superficial corky russet freckling across 28% of exocarp',
        'Pear-drop asymmetrical waist contour',
        'Deep salmon-orange mesocarp completely unaffected'
      ],
      description: 'Sweet volcanic papayas with superficial skin russeting. An extraordinary value for home breakfast bowls, smoothies, and commercial commissary kitchens.'
    },
    {
      id: 'uf-crop-09',
      title: 'Gnarled Multi-Thumb Native Ginger & Camote',
      category: 'Root Crops',
      grade: 'Grade C',
      gradeLabel: 'Grade C · Processing & Bulk Ready',
      farmName: 'Atok Highland Collective',
      region: 'Benguet (< 50 km Hub)',
      harvestDate: 'Harvested 20 hrs ago · Batch #ATK-932',
      image: './assets/papaya-citrus.jpg',
      priceB2C: 72,
      marketPriceB2C: 150,
      unitB2C: 'per 1 kg pack',
      priceB2B: 1550,
      marketPriceB2B: 3350,
      unitB2B: 'per 25 kg crate',
      stockKg: 380,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 99,
      edibilityScore: 100,
      cvConfidence: 99.5,
      brixIndex: 'High Gingerol Essential Oil (3.4%)',
      cosmeticDefects: [
        'Dense multi-thumb branching rhizome clusters',
        'Rough corky outer periderm from 10-month maturity',
        'Zero desiccation or mold — intense aromatic pungency'
      ],
      description: 'Small-knuckled native Luya (ginger) and crooked sweet potatoes that pack far more essential oil and spice than bloated imported tubers.'
    },
    {
      id: 'uf-crop-10',
      title: 'Warted Heirloom Calabaza Squash',
      category: 'Vegetables',
      grade: 'Grade C',
      gradeLabel: 'Grade C · Processing & Bulk Ready',
      farmName: 'Calauan Lakefront Plots',
      region: 'Laguna (< 35 km Hub)',
      harvestDate: 'Harvested 15 hrs ago · Batch #LAG-401',
      image: './assets/peppers-squash.jpg',
      priceB2C: 42,
      marketPriceB2C: 88,
      unitB2C: 'per 1 kg pack',
      priceB2B: 890,
      marketPriceB2B: 1950,
      unitB2B: 'per 25 kg crate',
      stockKg: 540,
      active: true,
      isNewlyScanned: false,
      freshnessScore: 99,
      edibilityScore: 100,
      cvConfidence: 99.6,
      brixIndex: '12.1° Bx · Dense Nutty Carotenoid Flesh',
      cosmeticDefects: [
        'Pronounced corky sugar warts & uneven ribbed segments',
        'Natural ground-spot bronzing on resting hemisphere',
        'Rind hardness & shelf stability rated 45+ days'
      ],
      description: 'In traditional Philippine farming, warted Kalabasa skin signals maximum starch-to-sugar conversion inside. Rich, velvety flesh for ginataan, soups, and purees.'
    }
  ],

  scannerPresets: [
    {
      id: 'preset-carrots',
      name: 'Twisted Highland Carrots',
      category: 'Root Crops',
      image: './assets/carrots.jpg',
      grade: 'Grade B',
      gradeLabel: 'Grade B · Oddly Shaped',
      freshness: 99,
      edibility: 100,
      confidence: 99.4,
      recommendedB2C: 66,
      marketB2C: 130,
      recommendedB2B: 1420,
      marketB2B: 2900,
      defaultWeightKg: 180,
      farmName: 'Atok Highland Collective',
      region: 'Benguet (< 50 km Hub)',
      brix: '11.6° Bx · Highland Frost-Sweetened',
      telemetry: '[CV-NET v4.2] Spectral reflectance 680nm: 99.4% epidermal continuity. Twin taproot bifurcation detected (cosmetic only). Zero Erwinia soft-rot or fungal spore signature. Status: PASSED.',
      defects: [
        'Intertwined twin taproot curvature (34% axial deviation)',
        'Minor loam rootlet whiskers — zero structural splitting'
      ],
      boxes: [
        { top: '28%', left: '36%', width: '28%', height: '44%', label: 'COSMETIC: TWIN HELIX ROOT', safe: false },
        { top: '12%', left: '22%', width: '54%', height: '76%', label: 'EDIBILITY: 100% SAFE · 99.4% CONF', safe: true }
      ]
    },
    {
      id: 'preset-mangoes',
      name: 'Spotted Carabao Mangoes',
      category: 'Fruits',
      image: './assets/mangoes.jpg',
      grade: 'Grade A-',
      gradeLabel: 'Grade A- · Slight Blemish',
      freshness: 99,
      edibility: 100,
      confidence: 99.6,
      recommendedB2C: 92,
      marketB2C: 180,
      recommendedB2B: 2050,
      marketB2B: 4100,
      defaultWeightKg: 220,
      farmName: 'Zambales Orchard Cooperative',
      region: 'Zambales',
      brix: '19.4° Bx · Peak Tree-Ripened Sucrose',
      telemetry: '[CV-NET v4.2] Peel lenticel freckling mapped at 16.8% surface area. NIR sub-surface scan confirms 0% anthracnose penetration into mesocarp. Sugar density: 19.4° Brix. Status: PASSED.',
      defects: [
        'Superficial sugar freckles on golden exocarp (16.8% area)',
        'Natural asymmetry across ventral shoulder — pulp 100% intact'
      ],
      boxes: [
        { top: '34%', left: '28%', width: '32%', height: '36%', label: 'SUGAR FRECKLES · 19.4° BRIX', safe: false },
        { top: '24%', left: '16%', width: '68%', height: '56%', label: 'PULP INTEGRITY: 100% VERIFIED SAFE', safe: true }
      ]
    },
    {
      id: 'preset-tomatoes',
      name: 'Oversized Ribbed Tomatoes',
      category: 'Vegetables',
      image: './assets/tomatoes.jpg',
      grade: 'Grade A-',
      gradeLabel: 'Grade A- · Slight Blemish',
      freshness: 98,
      edibility: 100,
      confidence: 99.2,
      recommendedB2C: 72,
      marketB2C: 140,
      recommendedB2B: 1550,
      marketB2B: 3200,
      defaultWeightKg: 260,
      farmName: 'Bukidnon Volcanic Terraces',
      region: 'Bukidnon',
      brix: '7.9° Bx · High Lycopene & Glutamate',
      telemetry: '[CV-NET v4.2] Cat-facing radial seams detected along upper calyx. Cuticle seal 100% continuous (no micro-fissures or exudate). Acoustic firmness index: 98.2%. Status: PASSED.',
      defects: [
        'Radial cat-facing seam lines across locule ribs',
        'Oversized 420g heirloom geometry — zero cellular rot'
      ],
      boxes: [
        { top: '26%', left: '34%', width: '32%', height: '42%', label: 'RADIAL SEAM RIBBING · SEALED', safe: false },
        { top: '20%', left: '12%', width: '76%', height: '58%', label: 'PATHOGEN CHECK: 0.00% · SAFE', safe: true }
      ]
    },
    {
      id: 'preset-eggplants',
      name: 'Curved Lakefront Eggplants',
      category: 'Vegetables',
      image: './assets/eggplants.jpg',
      grade: 'Grade B',
      gradeLabel: 'Grade B · Oddly Shaped',
      freshness: 98,
      edibility: 100,
      confidence: 99.0,
      recommendedB2C: 56,
      marketB2C: 110,
      recommendedB2B: 1220,
      marketB2B: 2450,
      defaultWeightKg: 150,
      farmName: 'Calauan Lakefront Plots',
      region: 'Laguna (< 35 km Hub)',
      brix: '94.2% Moisture · Zero Borer Puncture',
      telemetry: '[CV-NET v4.2] Curvature vector 44.5° exceeds retail straightness spec. Surface russeting 8.2% wind-scuff only. Epidermal puncture count: 0. Status: PASSED.',
      defects: [
        '44.5° crescent curvature from open-field lake breeze',
        'Superficial tan wind-russet line — zero pest entry'
      ],
      boxes: [
        { top: '30%', left: '32%', width: '38%', height: '42%', label: '44.5° CRESCENT CURVE · COSMETIC', safe: false },
        { top: '18%', left: '16%', width: '70%', height: '64%', label: 'PESTICIDE-FREE · 100% EDIBLE', safe: true }
      ]
    }
  ],

  incomingOrders: [
    {
      id: 'ORD-8841',
      buyerName: 'Kusina Lokal Commissary (B2B)',
      buyerType: 'Commercial Buyer (B2B)',
      cropTitle: 'Cat-Faced Heirloom Beefsteak Tomatoes',
      quantityLabel: '3 × 25 kg Crates (75 kg)',
      totalPhp: 4740,
      savedPhp: 4860,
      status: 'Dispatched · Direct Farm Truck',
      timeAgo: '24 mins ago'
    },
    {
      id: 'ORD-8839',
      buyerName: 'Clara Villanueva (B2C)',
      buyerType: 'Individual Buyer (B2C)',
      cropTitle: 'Twin & Twisted Heirloom Carrots',
      quantityLabel: '3 × 1 kg Packs (3 kg)',
      totalPhp: 204,
      savedPhp: 186,
      status: 'Packed at Atok Hub',
      timeAgo: '1 hr ago'
    },
    {
      id: 'ORD-8835',
      buyerName: 'Greenbelt Farm-to-Table Bistro (B2B)',
      buyerType: 'Commercial Buyer (B2B)',
      cropTitle: 'Heart-Knotted Highland Potatoes',
      quantityLabel: '4 × 25 kg Crates (100 kg)',
      totalPhp: 5360,
      savedPhp: 5240,
      status: 'Delivered · Cold Chain Verified',
      timeAgo: '3 hrs ago'
    },
    {
      id: 'ORD-8831',
      buyerName: 'Marco Santos (B2C)',
      buyerType: 'Individual Buyer (B2C)',
      cropTitle: 'Sun-Freckled Carabao Mangoes',
      quantityLabel: '2 × 1 kg Packs (2 kg)',
      totalPhp: 190,
      savedPhp: 170,
      status: 'Delivered · Direct Rider',
      timeAgo: '5 hrs ago'
    }
  ]
};
