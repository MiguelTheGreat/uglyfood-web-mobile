/**
 * UGLYFOOD — GROCERY-FIRST APPLE LIQUID GLASS APP CONTROLLER
 * Fast 2-col mobile / 4-col desktop grocery storefront with inline morphing
 * quantity steppers, floating live basket bar, Mystery Ugly Box, AI Scanner,
 * Farmer Seller Hub, and private Owner Testing Access.
 */
(function () {
  const STORAGE_KEY = 'uglyfood_grocery_state_v3';
  const THEME_KEY = 'uglyfood_theme_v2';
  const defaultData = window.UGLYFOOD_INITIAL_DATA;

  const MYSTERY_BOX = {
    id: 'uf-mystery-box',
    title: '5 kg Mystery Ugly Box',
    category: 'Vegetables',
    grade: 'Grade B',
    gradeLabel: 'Assorted Farm Steal',
    farmName: 'Multi-Farm Morning Harvest',
    region: 'Benguet & Laguna',
    harvestDate: 'Packed This Morning',
    image: './assets/carrots.jpg',
    priceB2C: 249,
    marketPriceB2C: 510,
    unitB2C: '5 kg box',
    priceB2B: 1150,
    marketPriceB2B: 2400,
    unitB2B: '25 kg crate',
    stockKg: 500,
    active: true,
    freshnessScore: 99,
    edibilityScore: 100,
    cvConfidence: 99.4,
    cosmeticDefects: ['Assorted crooked carrots, ribbed tomatoes, sweet mangoes & greens — 100% crisp inside.'],
    description: 'Our best-value 5 kg surprise box packed fresh every morning with whichever perfectly edible ugly veggies & fruits need rescuing most.'
  };

  const DELIVERY_SLOTS = [
    'Deliver to Metro Manila · Today, 2–4 PM',
    'Deliver to Metro Manila · Today, 6–8 PM',
    'Deliver to Metro Manila · Tomorrow, 8–10 AM',
    'Farm Hub Pickup · Quezon City (Free)'
  ];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.listings) && parsed.listings.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read localStorage state:', e);
    }
    return {
      ownerUnlocked: false,
      pricingMode: 'retail', // 'retail' | 'wholesale' (only toggleable via Owner Testing Access)
      deliverySlotIdx: 0,
      listings: JSON.parse(JSON.stringify(defaultData.listings)),
      incomingOrders: JSON.parse(JSON.stringify(defaultData.incomingOrders)),
      platformStats: JSON.parse(JSON.stringify(defaultData.platformStats)),
      cart: [
        { cropId: 'uf-crop-01', qty: 2 },
        { cropId: 'uf-crop-03', qty: 1 }
      ]
    };
  }

  let state = loadState();
  let toastTimer = null;

  const ui = {
    activeView: 'marketplace',
    filters: {
      search: '',
      category: 'All',
      sort: 'featured'
    },
    activePresetId: 'preset-carrots',
    customUploadDataUrl: null,
    customUploadName: null,
    modalQty: 1,
    checkoutSuccessOrder: null
  };

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist state:', e);
    }
  }

  function formatPhp(num) {
    return '₱' + Number(num || 0).toLocaleString('en-PH');
  }

  function showToast(message, duration = 2200) {
    const el = document.getElementById('uf-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
  }

  function findCropById(cropId) {
    if (cropId === MYSTERY_BOX.id) return MYSTERY_BOX;
    return state.listings.find((c) => c.id === cropId);
  }

  function getActivePrice(crop) {
    if (state.ownerUnlocked && state.pricingMode === 'wholesale') {
      return {
        price: crop.priceB2B,
        market: crop.marketPriceB2B,
        unit: crop.unitB2B || '25 kg crate',
        kgPerUnit: 25,
        discountPct: Math.round(((crop.marketPriceB2B - crop.priceB2B) / crop.marketPriceB2B) * 100)
      };
    }
    return {
      price: crop.priceB2C,
      market: crop.marketPriceB2C,
      unit: crop.unitB2C || '1 kg pack',
      kgPerUnit: crop.id === MYSTERY_BOX.id ? 5 : 1,
      discountPct: Math.round(((crop.marketPriceB2C - crop.priceB2C) / crop.marketPriceB2C) * 100)
    };
  }

  function getCartQty(cropId) {
    const item = state.cart.find((i) => i.cropId === cropId);
    return item ? item.qty : 0;
  }

  /* ------------------------------------------------------------------------
     1. APPLE SPRING SLIDING GLASS INDICATORS & VIEW NAVIGATION
     ------------------------------------------------------------------------ */
  function positionSpringIndicator(trackEl, immediate = false) {
    if (!trackEl) return;
    const indicator = trackEl.querySelector('.lg-spring-indicator');
    const activeItem = trackEl.querySelector('.lg-spring-item.is-active');
    if (!indicator || !activeItem) return;

    const width = activeItem.offsetWidth;
    const offsetLeft = activeItem.offsetLeft;
    if (width === 0) return;

    if (immediate) indicator.style.transition = 'none';
    indicator.style.width = `${width}px`;
    indicator.style.transform = `translate3d(${offsetLeft}px, 0, 0)`;

    if (immediate) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }

  function syncAllSpringIndicators(immediate = false) {
    ['top-nav-track', 'mobile-nav-track'].forEach((id) => {
      positionSpringIndicator(document.getElementById(id), immediate);
    });
  }

  function setActiveNavSection(sectionId) {
    const topTrack = document.getElementById('top-nav-track');
    if (topTrack) {
      topTrack.querySelectorAll('[data-top-nav]').forEach((item) => {
        item.classList.toggle('is-active', item.getAttribute('data-top-nav') === sectionId);
      });
      positionSpringIndicator(topTrack);
    }

    const mobileTrack = document.getElementById('mobile-nav-track');
    if (mobileTrack) {
      mobileTrack.querySelectorAll('[data-mobile-nav]').forEach((item) => {
        item.classList.toggle('is-active', item.getAttribute('data-mobile-nav') === sectionId);
      });
      positionSpringIndicator(mobileTrack);
    }
  }

  function navigateToSection(sectionId, { updateHash = true } = {}) {
    if (sectionId === 'cart') {
      setActiveNavSection('cart');
      openCartDrawer();
      return;
    }

    const validViews = ['marketplace', 'scanner', 'farmer-dashboard'];
    const targetView = validViews.includes(sectionId) ? sectionId : 'marketplace';
    ui.activeView = targetView;

    document.querySelectorAll('.uf-view').forEach((viewEl) => {
      viewEl.classList.toggle('is-active', viewEl.getAttribute('data-view') === targetView);
    });

    setActiveNavSection(targetView);
    syncLiveCartBarVisibility();

    if (updateHash && window.location.hash !== `#${targetView}`) {
      history.replaceState(null, '', `#${targetView}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------------
     2. THEME & OWNER TESTING ACCESS (Private)
     ------------------------------------------------------------------------ */
  function setTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }

  function initTheme() {
    let saved = 'light';
    try {
      saved = localStorage.getItem(THEME_KEY) || 'light';
    } catch {}
    setTheme(saved);
  }

  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    showToast(next === 'dark' ? 'Dark Glass Mode' : 'Light Glass Mode');
  }

  function syncOwnerUI() {
    const ownerBtn = document.getElementById('owner-access-btn');
    const unlockedPanel = document.getElementById('owner-unlocked-panel');
    const ownerChip = document.getElementById('owner-mode-chip');

    ownerBtn?.classList.toggle('is-owner-active', Boolean(state.ownerUnlocked));
    if (unlockedPanel) {
      unlockedPanel.style.display = state.ownerUnlocked ? 'flex' : 'none';
    }

    document.querySelectorAll('[data-owner-mode]').forEach((card) => {
      card.classList.toggle('is-active', card.getAttribute('data-owner-mode') === state.pricingMode);
    });

    if (ownerChip) {
      if (state.ownerUnlocked && state.pricingMode === 'wholesale') {
        ownerChip.style.display = 'inline-block';
        ownerChip.textContent = 'Owner Test Mode: 25 kg Wholesale Crates';
      } else {
        ownerChip.style.display = 'none';
      }
    }
  }

  function openOwnerModal() {
    syncOwnerUI();
    document.getElementById('owner-access-modal')?.classList.add('is-open');
  }

  function closeOwnerModal() {
    document.getElementById('owner-access-modal')?.classList.remove('is-open');
  }

  /* ------------------------------------------------------------------------
     3. GROCERY STOREFRONT GRID (2-Col Mobile / 4-Col Desktop + Inline Steppers)
     ------------------------------------------------------------------------ */
  function renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    const countLabel = document.getElementById('marketplace-count-label');
    if (!grid) return;

    let filtered = state.listings.filter((item) => {
      if (!item.active) return false;
      const pricing = getActivePrice(item);

      if (ui.filters.category === 'Steals') {
        if (item.priceB2C > 70) return false;
      } else if (ui.filters.category === 'Benguet' || ui.filters.category === 'Laguna') {
        if (!item.region.toLowerCase().includes(ui.filters.category.toLowerCase())) return false;
      } else if (ui.filters.category !== 'All' && item.category !== ui.filters.category) {
        return false;
      }

      if (ui.filters.search.trim()) {
        const q = ui.filters.search.toLowerCase();
        const hay = `${item.title} ${item.farmName} ${item.region} ${item.category} ${(item.cosmeticDefects || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // Apply Sort
    if (ui.filters.sort === 'price-asc') {
      filtered.sort((a, b) => getActivePrice(a).price - getActivePrice(b).price);
    } else if (ui.filters.sort === 'discount-desc') {
      filtered.sort((a, b) => getActivePrice(b).discountPct - getActivePrice(a).discountPct);
    } else if (ui.filters.sort === 'fresh-desc') {
      filtered.sort((a, b) => b.freshnessScore - a.freshnessScore);
    }

    if (countLabel) {
      countLabel.textContent = `${filtered.length} deals available`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="lg-card" style="grid-column:1/-1;text-align:center;padding:2.75rem 1.25rem;">
          <h3 class="uf-heading" style="font-size:1.45rem;margin-bottom:0.45rem;">No produce matches that search.</h3>
          <p style="font-size:0.86rem;color:var(--ink-secondary);margin:0 0 1.1rem;">Try searching carrots, mangoes, potatoes, or tap All Deals.</p>
          <button type="button" class="lg-btn lg-btn--prominent" id="clear-search-empty-btn">Show All Deals</button>
        </div>
      `;
      document.getElementById('clear-search-empty-btn')?.addEventListener('click', () => {
        ui.filters.search = '';
        ui.filters.category = 'All';
        const input = document.getElementById('filter-search');
        if (input) input.value = '';
        document.querySelectorAll('[data-category-pill]').forEach((b) => {
          b.classList.toggle('is-active', b.getAttribute('data-category-pill') === 'All');
        });
        renderMarketplace();
      });
      return;
    }

    grid.innerHTML = filtered
      .map((crop) => {
        const pricing = getActivePrice(crop);
        const qtyInCart = getCartQty(crop.id);
        const shortWhy = crop.cosmeticDefects && crop.cosmeticDefects[0] ? crop.cosmeticDefects[0] : 'Oddly shaped · 100% crisp';

        const quickCtrlHtml =
          qtyInCart > 0
            ? `
              <div class="uf-inline-stepper" data-stop-prop>
                <button type="button" class="uf-inline-step-btn" data-card-dec="${crop.id}" aria-label="Remove one ${crop.title}">&minus;</button>
                <span class="uf-inline-step-qty uf-tabular">${qtyInCart}</span>
                <button type="button" class="uf-inline-step-btn" data-card-inc="${crop.id}" aria-label="Add one more ${crop.title}">+</button>
              </div>
            `
            : `
              <button type="button" class="uf-quick-add-orb" data-card-add="${crop.id}" aria-label="Add ${crop.title} to basket">+</button>
            `;

        return `
          <article class="lg-card lg-card--interactive uf-grocery-card">
            <div class="uf-grocery-media" data-open-report="${crop.id}">
              <img src="${crop.image}" alt="${crop.title}" loading="lazy">
              <div class="uf-grocery-badges">
                <span class="uf-off-pill uf-tabular">-${pricing.discountPct}%</span>
                <span class="uf-fresh-pill uf-tabular">${crop.freshnessScore}% Fresh</span>
              </div>
              <div class="uf-card-quick-ctrl">
                ${quickCtrlHtml}
              </div>
            </div>

            <div class="uf-grocery-info" data-open-report="${crop.id}">
              <div class="uf-grocery-price-line">
                <span class="uf-price-main uf-tabular">${formatPhp(pricing.price)}</span>
                <span class="uf-price-strike uf-tabular">${formatPhp(pricing.market)}</span>
              </div>
              <h3 class="uf-grocery-title">${crop.title}</h3>
              <div class="uf-grocery-sub">${pricing.unit} · ${crop.farmName}</div>
              <div class="uf-grocery-why-cheap">${shortWhy}</div>
            </div>
          </article>
        `;
      })
      .join('');

    // Wire up quick inline add / stepper controls without opening product modal
    grid.querySelectorAll('[data-card-add]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(btn.getAttribute('data-card-add'), 1);
      });
    });

    grid.querySelectorAll('[data-card-inc]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateCartQty(btn.getAttribute('data-card-inc'), 1);
      });
    });

    grid.querySelectorAll('[data-card-dec]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        updateCartQty(btn.getAttribute('data-card-dec'), -1);
      });
    });

    grid.querySelectorAll('[data-stop-prop]').forEach((el) => {
      el.addEventListener('click', (e) => e.stopPropagation());
    });

    grid.querySelectorAll('[data-open-report]').forEach((el) => {
      el.addEventListener('click', () => openProductReportModal(el.getAttribute('data-open-report')));
    });
  }

  /* ------------------------------------------------------------------------
     4. PRODUCT DETAIL & FRESHNESS REPORT SHEET
     ------------------------------------------------------------------------ */
  function openProductReportModal(cropId) {
    const crop = findCropById(cropId);
    if (!crop) return;

    ui.modalQty = Math.max(1, getCartQty(cropId));
    const backdrop = document.getElementById('trust-report-modal');
    const content = document.getElementById('trust-report-content');
    if (!backdrop || !content) return;

    const pricing = getActivePrice(crop);
    const farm = defaultData.farms.find((f) => f.name === crop.farmName) || defaultData.farms[0];

    function renderModalInner() {
      const totalCost = pricing.price * ui.modalQty;
      const totalSaved = (pricing.market - pricing.price) * ui.modalQty;

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding-bottom:0.9rem;border-bottom:1px solid var(--lg-border-subtle);margin-bottom:1.15rem;">
          <div>
            <span class="uf-kicker">${crop.harvestDate}</span>
            <h2 class="uf-heading" style="font-size:clamp(1.45rem,3vw,2rem);margin-top:0.2rem;">${crop.title}</h2>
          </div>
          <button type="button" class="uf-close-orb" id="close-trust-modal-btn" aria-label="Close">&times;</button>
        </div>

        <div class="uf-trust-grid">
          <div style="display:flex;flex-direction:column;gap:0.85rem;">
            <div style="position:relative;border-radius:20px;overflow:hidden;aspect-ratio:4/3;">
              <img src="${crop.image}" alt="${crop.title}" style="width:100%;height:100%;object-fit:cover;display:block;">
              <div class="lg-media-dimmer"></div>
              <div class="lg-clear uf-media-hud-bar">
                <span>AI Verified · ${crop.edibilityScore}% Safe</span>
                <span class="uf-tabular">${crop.freshnessScore}% Fresh</span>
              </div>
            </div>

            <div style="border-radius:18px;background:var(--lg-surface-bg);border:1px solid var(--lg-border-subtle);padding:0.9rem 1rem;">
              <span class="uf-kicker">Grown By</span>
              <div style="font-weight:700;font-size:0.95rem;margin:0.2rem 0;">${crop.farmName} · ${crop.region}</div>
              <p style="font-size:0.82rem;color:var(--ink-secondary);margin:0;line-height:1.48;">${farm.bio}</p>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;justify-content:space-between;gap:0.95rem;">
            <div>
              <div class="uf-score-grid" style="margin-bottom:0.85rem;">
                <div class="uf-score-pill-card">
                  <span style="font-size:0.7rem;color:var(--ink-secondary);font-weight:600;">Freshness</span>
                  <div class="uf-score-val uf-tabular" style="color:var(--accent-primary);">${crop.freshnessScore}%</div>
                </div>
                <div class="uf-score-pill-card">
                  <span style="font-size:0.7rem;color:var(--ink-secondary);font-weight:600;">Edibility</span>
                  <div class="uf-score-val uf-tabular" style="color:var(--accent-primary);">${crop.edibilityScore}%</div>
                </div>
                <div class="uf-score-pill-card">
                  <span style="font-size:0.7rem;color:var(--ink-secondary);font-weight:600;">Savings</span>
                  <div class="uf-score-val uf-tabular" style="color:var(--accent-bronze);">-${pricing.discountPct}%</div>
                </div>
              </div>

              <p style="font-size:0.88rem;line-height:1.55;color:var(--ink-secondary);margin:0 0 0.85rem;">${crop.description}</p>

              <div style="border-radius:18px;background:var(--lg-surface-bg);border:1px solid var(--lg-border-subtle);padding:0.85rem 1rem;">
                <span class="uf-kicker">Why It's So Cheap</span>
                <ul style="margin:0.4rem 0 0;padding-left:1.1rem;font-size:0.83rem;color:var(--ink-primary);line-height:1.55;">
                  ${(crop.cosmeticDefects || []).map((d) => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="border-top:1px solid var(--lg-border-subtle);padding-top:0.9rem;display:flex;flex-direction:column;gap:0.8rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;">
                <div>
                  <span class="uf-price-main uf-tabular" style="font-size:1.55rem;">${formatPhp(totalCost)}</span>
                  <span class="uf-price-strike uf-tabular">${formatPhp(pricing.market * ui.modalQty)}</span>
                  <div style="font-size:0.76rem;color:var(--accent-primary);font-weight:700;">Save ${formatPhp(totalSaved)}</div>
                </div>

                <div class="uf-qty-stepper">
                  <button type="button" class="uf-qty-btn" id="modal-qty-dec" aria-label="Decrease">&minus;</button>
                  <span class="uf-tabular" style="padding:0 0.7rem;font-weight:700;">${ui.modalQty}</span>
                  <button type="button" class="uf-qty-btn" id="modal-qty-inc" aria-label="Increase">+</button>
                </div>
              </div>

              <button type="button" class="lg-btn lg-btn--tangerine" id="modal-add-cart-btn" style="width:100%;padding:0.86rem;font-size:0.9rem;">
                Add to Basket · ${formatPhp(totalCost)}
              </button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('close-trust-modal-btn')?.addEventListener('click', closeProductReportModal);
      document.getElementById('modal-qty-dec')?.addEventListener('click', () => {
        if (ui.modalQty > 1) {
          ui.modalQty -= 1;
          renderModalInner();
        }
      });
      document.getElementById('modal-qty-inc')?.addEventListener('click', () => {
        ui.modalQty += 1;
        renderModalInner();
      });
      document.getElementById('modal-add-cart-btn')?.addEventListener('click', () => {
        addToCart(crop.id, ui.modalQty);
        closeProductReportModal();
      });
    }

    renderModalInner();
    backdrop.classList.add('is-open');
  }

  function closeProductReportModal() {
    document.getElementById('trust-report-modal')?.classList.remove('is-open');
  }

  /* ------------------------------------------------------------------------
     5. AI PRODUCE SCANNER
     ------------------------------------------------------------------------ */
  function getActivePreset() {
    return defaultData.scannerPresets.find((p) => p.id === ui.activePresetId) || defaultData.scannerPresets[0];
  }

  function selectScannerPreset(presetId) {
    ui.activePresetId = presetId;
    ui.customUploadDataUrl = null;
    ui.customUploadName = null;

    document.querySelectorAll('[data-scanner-preset]').forEach((btn) => {
      btn.classList.toggle('is-selected', btn.getAttribute('data-scanner-preset') === presetId);
    });

    runSimulatedCvScan();
  }

  function runSimulatedCvScan() {
    const preset = getActivePreset();
    const viewport = document.getElementById('cv-viewport');
    const imgEl = document.getElementById('cv-preview-img');
    const boxesContainer = document.getElementById('cv-boxes-layer');
    const hudStatus = document.getElementById('cv-hud-status');
    const hudConf = document.getElementById('cv-hud-confidence');
    const telemetryEl = document.getElementById('cv-telemetry-console');

    if (!viewport || !imgEl || !boxesContainer) return;

    imgEl.src = ui.customUploadDataUrl || preset.image;
    viewport.classList.remove('is-analyzed');
    viewport.classList.add('is-scanning');

    if (hudStatus) hudStatus.textContent = 'Scanning freshness & surface...';
    if (hudConf) hudConf.textContent = 'AI Check Running';

    setTimeout(() => {
      viewport.classList.remove('is-scanning');
      viewport.classList.add('is-analyzed');

      boxesContainer.innerHTML = preset.boxes
        .map(
          (b) => `
          <div class="uf-cv-box ${b.safe ? 'uf-cv-box--safe' : ''}" style="top:${b.top};left:${b.left};width:${b.width};height:${b.height};">
            <span class="uf-cv-box-tag">${b.label}</span>
          </div>
        `
        )
        .join('');

      if (hudStatus) hudStatus.textContent = `Passed · ${preset.edibility}% Safe to Eat`;
      if (hudConf) hudConf.textContent = `${preset.grade} · ${preset.confidence}%`;
      if (telemetryEl) {
        const cleanNote = preset.telemetry.replace('[CV-NET v4.2] ', '');
        const prefix = ui.customUploadName ? `Uploaded (${ui.customUploadName}): ` : '';
        telemetryEl.textContent = prefix + cleanNote;
      }

      document.getElementById('scan-out-grade').textContent = preset.grade;
      document.getElementById('scan-out-freshness').textContent = preset.freshness + '%';
      document.getElementById('scan-out-safety').textContent = 'Passed';

      const titleInput = document.getElementById('publish-crop-title');
      const catInput = document.getElementById('publish-crop-category');
      const weightInput = document.getElementById('publish-crop-weight');
      const priceInput = document.getElementById('publish-price-b2c');
      const farmInput = document.getElementById('publish-farm-name');
      const defectInput = document.getElementById('publish-defect-note');

      if (titleInput) {
        titleInput.value = ui.customUploadName
          ? `Rescued ${ui.customUploadName.replace(/\.[^/.]+$/, '')}`
          : preset.name;
      }
      if (catInput) catInput.value = preset.category;
      if (weightInput) weightInput.value = String(preset.defaultWeightKg);
      if (priceInput) priceInput.value = String(preset.recommendedB2C);
      if (farmInput) farmInput.value = `${preset.farmName} · ${preset.region}`;
      if (defectInput) defectInput.value = preset.defects[0];
    }, 800);
  }

  function handlePublishScannedCrop(e) {
    e.preventDefault();
    const preset = getActivePreset();

    const title = (document.getElementById('publish-crop-title')?.value || preset.name).trim();
    const category = document.getElementById('publish-crop-category')?.value || preset.category;
    const stockKg = Math.max(10, Number(document.getElementById('publish-crop-weight')?.value || preset.defaultWeightKg));
    const priceB2C = Math.max(15, Number(document.getElementById('publish-price-b2c')?.value || preset.recommendedB2C));
    const farmRaw = (document.getElementById('publish-farm-name')?.value || `${preset.farmName} · ${preset.region}`).trim();
    const defectNote = (document.getElementById('publish-defect-note')?.value || preset.defects[0]).trim();

    const [farmNamePart, regionPart] = farmRaw.includes('·')
      ? farmRaw.split('·').map((s) => s.trim())
      : [farmRaw, preset.region];

    const newListing = {
      id: 'uf-scan-' + Date.now(),
      title,
      category,
      grade: preset.grade,
      gradeLabel: preset.gradeLabel,
      farmName: farmNamePart || preset.farmName,
      region: regionPart || preset.region,
      harvestDate: 'Verified Just Now',
      image: ui.customUploadDataUrl || preset.image,
      priceB2C,
      marketPriceB2C: Math.round(priceB2C * 1.92),
      unitB2C: '1 kg pack',
      priceB2B: Math.round(priceB2C * 21),
      marketPriceB2B: Math.round(priceB2C * 42),
      unitB2B: '25 kg crate',
      stockKg,
      active: true,
      freshnessScore: preset.freshness,
      edibilityScore: preset.edibility,
      cvConfidence: preset.confidence,
      cosmeticDefects: [defectNote, ...preset.defects.slice(1)],
      description: `Freshly scanned harvest verified ${preset.confidence}% safe by UglyFood AI.`
    };

    state.listings.unshift(newListing);
    saveState();
    renderMarketplace();
    renderFarmerDashboard();

    showToast(`Posted "${title}" to Shop!`);
    navigateToSection('marketplace');
  }

  /* ------------------------------------------------------------------------
     6. FARMER SELLER HUB
     ------------------------------------------------------------------------ */
  function renderFarmerDashboard() {
    const activeListings = state.listings.filter((l) => l.active);
    const totalRescuedKg = state.listings.reduce((acc, item) => acc + Number(item.stockKg || 0), 3420);
    const totalRevenuePhp = state.incomingOrders.reduce((acc, ord) => acc + Number(ord.totalPhp || 0), 174200);

    const revEl = document.getElementById('farmer-kpi-revenue');
    const kgEl = document.getElementById('farmer-kpi-kg');
    const countEl = document.getElementById('farmer-kpi-listings');

    if (revEl) revEl.textContent = formatPhp(totalRevenuePhp);
    if (kgEl) kgEl.textContent = totalRescuedKg.toLocaleString('en-PH') + ' kg';
    if (countEl) countEl.textContent = `${activeListings.length} Active`;

    const invList = document.getElementById('farmer-inventory-list');
    if (invList) {
      invList.innerHTML = state.listings
        .slice(0, 6)
        .map(
          (item) => `
          <div class="uf-inventory-row-card">
            <div style="flex:1 1 180px;">
              <div style="font-weight:700;font-size:0.9rem;">${item.title}</div>
              <div style="font-size:0.76rem;color:var(--ink-secondary);margin-top:0.15rem;">
                <strong class="uf-tabular" style="color:var(--ink-primary);">${item.stockKg} kg</strong> · ${formatPhp(item.priceB2C)}/kg
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:0.5rem;">
              <button type="button" class="lg-toggle-switch ${item.active ? 'is-on' : ''}" data-toggle-listing="${item.id}" aria-label="Toggle ${item.title}">
                <span class="lg-toggle-knob"></span>
              </button>
              <button type="button" class="lg-btn" data-restock-listing="${item.id}" style="padding:0.4rem 0.72rem;font-size:0.74rem;">+50 kg</button>
              <button type="button" class="uf-close-orb" data-delete-listing="${item.id}" style="width:30px;height:30px;font-size:0.95rem;" aria-label="Remove">&times;</button>
            </div>
          </div>
        `
        )
        .join('');

      invList.querySelectorAll('[data-toggle-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = state.listings.find((l) => l.id === btn.getAttribute('data-toggle-listing'));
          if (target) {
            target.active = !target.active;
            saveState();
            renderFarmerDashboard();
            renderMarketplace();
            showToast(`${target.title} ${target.active ? 'Live' : 'Paused'}`);
          }
        });
      });

      invList.querySelectorAll('[data-restock-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = state.listings.find((l) => l.id === btn.getAttribute('data-restock-listing'));
          if (target) {
            target.stockKg += 50;
            saveState();
            renderFarmerDashboard();
            renderMarketplace();
            showToast(`Added +50 kg to ${target.title}`);
          }
        });
      });

      invList.querySelectorAll('[data-delete-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (state.listings.length <= 3) {
            showToast('Keep at least 3 active items');
            return;
          }
          state.listings = state.listings.filter((l) => l.id !== btn.getAttribute('data-delete-listing'));
          saveState();
          renderFarmerDashboard();
          renderMarketplace();
          showToast('Item removed');
        });
      });
    }

    const ordersList = document.getElementById('farmer-orders-list');
    if (ordersList) {
      ordersList.innerHTML = state.incomingOrders
        .slice(0, 5)
        .map(
          (ord) => `
          <div class="uf-order-row-card">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
              <span class="uf-kicker">${ord.id} · ${ord.timeAgo}</span>
              <strong class="uf-tabular" style="font-family:var(--font-display);font-size:1.1rem;">${formatPhp(ord.totalPhp)}</strong>
            </div>
            <div style="font-weight:700;font-size:0.88rem;">${ord.buyerName.replace(/\s*\(B2[BC]\)/g, '')}</div>
            <div style="font-size:0.8rem;color:var(--ink-secondary);">${ord.cropTitle} · ${ord.quantityLabel}</div>
            <div style="font-size:0.74rem;font-weight:600;color:var(--accent-primary);">${ord.status}</div>
          </div>
        `
        )
        .join('');
    }
  }

  function renderPartnerFarms() {
    const grid = document.getElementById('partner-farms-grid');
    if (!grid) return;

    grid.innerHTML = defaultData.farms
      .map(
        (farm) => `
        <article class="lg-card lg-card--interactive uf-farm-card" data-filter-farm="${farm.region.split(' ')[0]}">
          <div>
            <span class="uf-kicker">${farm.region}</span>
            <h4 class="uf-heading" style="font-size:1.25rem;margin:0.2rem 0 0.4rem;">${farm.name}</h4>
            <p style="font-size:0.82rem;color:var(--ink-secondary);line-height:1.48;margin:0;">${farm.bio}</p>
          </div>
          <div style="display:flex;justify-content:space-between;padding-top:0.65rem;border-top:1px solid var(--lg-border-subtle);font-size:0.74rem;font-weight:700;">
            <span class="uf-tabular" style="color:var(--accent-emerald);">${farm.wasteDivertedKg.toLocaleString('en-PH')} kg rescued</span>
            <span style="color:var(--accent-bronze);">Shop Farm &rarr;</span>
          </div>
        </article>
      `
      )
      .join('');

    grid.querySelectorAll('[data-filter-farm]').forEach((card) => {
      card.addEventListener('click', () => {
        const region = card.getAttribute('data-filter-farm');
        ui.filters.search = region;
        const input = document.getElementById('filter-search');
        if (input) input.value = region;
        renderMarketplace();
        navigateToSection('marketplace');
        showToast(`Showing fresh harvests from ${region}`);
      });
    });
  }

  /* ------------------------------------------------------------------------
     7. GROCERY BASKET, FLOATING LIVE BAR & 1-TAP CHECKOUT
     ------------------------------------------------------------------------ */
  function popCartBadges() {
    document.querySelectorAll('[data-cart-badge]').forEach((badge) => {
      badge.classList.remove('is-popping');
      void badge.offsetWidth;
      badge.classList.add('is-popping');
    });
  }

  function addToCart(cropId, qty = 1) {
    const crop = findCropById(cropId);
    if (!crop) return;

    const existing = state.cart.find((item) => item.cropId === cropId);
    if (existing) {
      existing.qty += qty;
    } else {
      state.cart.push({ cropId, qty });
    }
    ui.checkoutSuccessOrder = null;
    saveState();
    renderCart();
    renderMarketplace();
    popCartBadges();
    showToast(`Added ${crop.title} to basket`);
  }

  function updateCartQty(cropId, delta) {
    const idx = state.cart.findIndex((i) => i.cropId === cropId);
    if (idx === -1) return;
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
    saveState();
    renderCart();
    renderMarketplace();
    popCartBadges();
  }

  function syncLiveCartBarVisibility() {
    const bar = document.getElementById('live-cart-bar');
    if (!bar) return;
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const shouldShow = totalCount > 0 && ui.activeView === 'marketplace';
    bar.classList.toggle('is-visible', shouldShow);
  }

  function renderCart() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('[data-cart-badge]').forEach((badge) => {
      badge.textContent = String(totalCount);
    });

    let subtotal = 0;
    let marketTotal = 0;
    let totalRescuedKg = 0;

    state.cart.forEach((entry) => {
      const crop = findCropById(entry.cropId);
      if (!crop) return;
      const pricing = getActivePrice(crop);
      subtotal += pricing.price * entry.qty;
      marketTotal += pricing.market * entry.qty;
      totalRescuedKg += pricing.kgPerUnit * entry.qty;
    });

    const totalSavings = Math.max(0, marketTotal - subtotal);

    // Update Floating Live Basket Bar
    const liveMain = document.getElementById('live-cart-main');
    const liveSavings = document.getElementById('live-cart-savings');
    if (liveMain) liveMain.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'} · ${formatPhp(subtotal)}`;
    if (liveSavings) liveSavings.textContent = `You save ${formatPhp(totalSavings)} vs. supermarket`;
    syncLiveCartBarVisibility();

    const listEl = document.getElementById('cart-items-container');
    const summaryEl = document.getElementById('cart-summary-footer');
    if (!listEl || !summaryEl) return;

    if (ui.checkoutSuccessOrder) {
      const ord = ui.checkoutSuccessOrder;
      listEl.innerHTML = `
        <div style="border-radius:22px;background:var(--accent-emerald-soft);border:1px solid rgba(38,105,74,0.28);padding:1.35rem;margin-top:0.75rem;">
          <span class="uf-kicker" style="color:var(--accent-emerald);">Order Confirmed · ${ord.id}</span>
          <h3 class="uf-heading" style="font-size:1.45rem;margin:0.35rem 0 0.55rem;">Your rescued produce is on the way!</h3>
          <p style="font-size:0.84rem;color:var(--ink-secondary);line-height:1.52;margin:0 0 0.9rem;">
            Packed fresh for <strong>${ord.buyerName}</strong> (${ord.rescuedKg} kg rescued).
          </p>
          <div style="border-top:1px solid var(--lg-border-subtle);padding-top:0.75rem;display:flex;flex-direction:column;gap:0.35rem;font-size:0.84rem;">
            <div style="display:flex;justify-content:space-between;"><span>Total Paid</span><strong class="uf-tabular">${formatPhp(ord.totalPhp)}</strong></div>
            <div style="display:flex;justify-content:space-between;color:var(--accent-emerald);"><span>Saved vs. Grocery</span><strong class="uf-tabular">${formatPhp(ord.savedPhp)}</strong></div>
          </div>
          <button type="button" class="lg-btn lg-btn--prominent" id="cart-continue-shopping-btn" style="width:100%;margin-top:1.1rem;">Back to Shop</button>
        </div>
      `;
      summaryEl.innerHTML = '';
      document.getElementById('cart-continue-shopping-btn')?.addEventListener('click', () => {
        ui.checkoutSuccessOrder = null;
        closeCartDrawer();
        renderCart();
      });
      return;
    }

    if (state.cart.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span class="uf-kicker">Basket Empty</span>
          <p style="font-size:0.9rem;color:var(--ink-secondary);margin:0.5rem 0 0;">Tap + on any cheap produce deal to fill your basket.</p>
        </div>
      `;
      summaryEl.innerHTML = '';
      return;
    }

    listEl.innerHTML = state.cart
      .map((entry) => {
        const crop = findCropById(entry.cropId);
        if (!crop) return '';
        const pricing = getActivePrice(crop);
        const lineTotal = pricing.price * entry.qty;
        const lineMarket = pricing.market * entry.qty;

        return `
          <div class="uf-cart-item">
            <img src="${crop.image}" alt="${crop.title}">
            <div>
              <div style="font-weight:700;font-size:0.88rem;">${crop.title}</div>
              <div class="uf-tabular" style="font-size:0.75rem;color:var(--ink-secondary);">${formatPhp(pricing.price)} · ${pricing.unit}</div>
              <div class="uf-tabular" style="font-size:0.72rem;font-weight:700;color:var(--accent-emerald);">Save ${formatPhp(lineMarket - lineTotal)}</div>
            </div>
            <div class="uf-qty-stepper">
              <button type="button" class="uf-qty-btn" data-cart-dec="${crop.id}" aria-label="Decrease">&minus;</button>
              <span class="uf-tabular" style="padding:0 0.45rem;font-weight:700;font-size:0.82rem;">${entry.qty}</span>
              <button type="button" class="uf-qty-btn" data-cart-inc="${crop.id}" aria-label="Increase">+</button>
            </div>
          </div>
        `;
      })
      .join('');

    summaryEl.innerHTML = `
      <div style="border-top:1px solid var(--lg-border-subtle);padding-top:0.95rem;display:flex;flex-direction:column;gap:0.75rem;">
        <div style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.84rem;">
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>Supermarket Price</span>
            <span class="uf-tabular" style="text-decoration:line-through;">${formatPhp(marketTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--accent-emerald);font-weight:700;">
            <span>Total Savings (${marketTotal > 0 ? Math.round((totalSavings / marketTotal) * 100) : 0}% Off)</span>
            <span class="uf-tabular">&minus;${formatPhp(totalSavings)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:0.45rem;border-top:1px solid var(--lg-border-subtle);">
            <span class="uf-kicker">Total</span>
            <span class="uf-tabular" style="font-family:var(--font-display);font-size:1.6rem;font-weight:600;">${formatPhp(subtotal)}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
          <input type="text" id="checkout-buyer-name" class="uf-input" value="Elena Reyes" style="font-size:0.82rem;padding:0.58rem 0.8rem;">
          <select id="checkout-fulfillment" class="uf-select" style="font-size:0.82rem;padding:0.58rem 0.8rem;" aria-label="Delivery Method">
            <option value="Today 2–4 PM">Today 2–4 PM</option>
            <option value="Hub Pickup (Free)">Hub Pickup (₱0)</option>
          </select>
        </div>

        <button type="button" class="lg-btn lg-btn--emerald" id="confirm-mock-order-btn" style="width:100%;padding:0.88rem;font-size:0.9rem;">
          Place Order · ${formatPhp(subtotal)}
        </button>
      </div>
    `;

    listEl.querySelectorAll('[data-cart-dec]').forEach((btn) => {
      btn.addEventListener('click', () => updateCartQty(btn.getAttribute('data-cart-dec'), -1));
    });
    listEl.querySelectorAll('[data-cart-inc]').forEach((btn) => {
      btn.addEventListener('click', () => updateCartQty(btn.getAttribute('data-cart-inc'), 1));
    });

    document.getElementById('confirm-mock-order-btn')?.addEventListener('click', () => {
      const buyerName = (document.getElementById('checkout-buyer-name')?.value || 'Elena Reyes').trim();
      const fulfillment = document.getElementById('checkout-fulfillment')?.value || 'Today 2–4 PM';
      const firstCrop = findCropById(state.cart[0]?.cropId);

      const orderRecord = {
        id: 'ORD-' + Math.floor(9000 + Math.random() * 900),
        buyerName,
        cropTitle: firstCrop ? `${firstCrop.title}${state.cart.length > 1 ? ` + ${state.cart.length - 1} more` : ''}` : 'Rescued Produce',
        quantityLabel: `${totalRescuedKg} kg (${fulfillment})`,
        totalPhp: subtotal,
        savedPhp: totalSavings,
        rescuedKg: totalRescuedKg,
        status: `Confirmed · ${fulfillment}`,
        timeAgo: 'Just now'
      };

      state.incomingOrders.unshift(orderRecord);
      state.cart = [];
      ui.checkoutSuccessOrder = orderRecord;

      saveState();
      renderFarmerDashboard();
      renderMarketplace();
      renderCart();
      showToast(`Order ${orderRecord.id} placed!`);
    });
  }

  function openCartDrawer() {
    document.getElementById('cart-sheet-backdrop')?.classList.add('is-open');
  }

  function closeCartDrawer() {
    document.getElementById('cart-sheet-backdrop')?.classList.remove('is-open');
    setActiveNavSection(ui.activeView || 'marketplace');
  }

  /* ------------------------------------------------------------------------
     8. INITIALIZATION & EVENT BINDINGS
     ------------------------------------------------------------------------ */
  function initApp() {
    initTheme();
    syncOwnerUI();
    renderMarketplace();
    renderFarmerDashboard();
    renderPartnerFarms();
    renderCart();
    selectScannerPreset('preset-carrots');

    const initialHash = window.location.hash.replace('#', '');
    if (['marketplace', 'scanner', 'farmer-dashboard'].includes(initialHash)) {
      navigateToSection(initialHash, { updateHash: false });
    }

    requestAnimationFrame(() => syncAllSpringIndicators(true));
    window.addEventListener('resize', () => syncAllSpringIndicators(true));

    // Brand link -> Shop
    document.querySelector('.uf-brand')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSection('marketplace');
    });

    // Top Nav & Fixed Mobile Bottom Dock
    document.querySelectorAll('[data-top-nav]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToSection(link.getAttribute('data-top-nav'));
      });
    });

    document.querySelectorAll('[data-mobile-nav]').forEach((tab) => {
      tab.addEventListener('click', () => navigateToSection(tab.getAttribute('data-mobile-nav')));
    });

    document.querySelectorAll('[data-jump-section]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToSection(el.getAttribute('data-jump-section'));
      });
    });

    // Delivery Slot Cycle Pill
    const slotText = document.getElementById('delivery-slot-text');
    if (slotText) slotText.textContent = DELIVERY_SLOTS[state.deliverySlotIdx || 0];
    document.getElementById('delivery-slot-btn')?.addEventListener('click', () => {
      state.deliverySlotIdx = ((state.deliverySlotIdx || 0) + 1) % DELIVERY_SLOTS.length;
      saveState();
      if (slotText) slotText.textContent = DELIVERY_SLOTS[state.deliverySlotIdx];
      showToast(DELIVERY_SLOTS[state.deliverySlotIdx]);
    });

    // 1-Tap Mystery Ugly Box
    document.getElementById('add-mystery-box-btn')?.addEventListener('click', () => {
      addToCart(MYSTERY_BOX.id, 1);
    });

    // Live Floating Cart Bar -> Open Basket
    document.getElementById('live-cart-bar')?.addEventListener('click', openCartDrawer);

    // Search, Sort & Category Chips
    document.getElementById('filter-search')?.addEventListener('input', (e) => {
      ui.filters.search = e.target.value;
      renderMarketplace();
    });

    document.getElementById('filter-sort')?.addEventListener('change', (e) => {
      ui.filters.sort = e.target.value;
      renderMarketplace();
    });

    document.querySelectorAll('[data-category-pill]').forEach((chip) => {
      chip.addEventListener('click', () => {
        ui.filters.category = chip.getAttribute('data-category-pill');
        document.querySelectorAll('[data-category-pill]').forEach((c) => c.classList.toggle('is-active', c === chip));
        renderMarketplace();
      });
    });

    // Owner Testing Access (Private)
    document.getElementById('owner-access-btn')?.addEventListener('click', openOwnerModal);
    document.getElementById('close-owner-access-btn')?.addEventListener('click', closeOwnerModal);
    document.getElementById('owner-access-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'owner-access-modal') closeOwnerModal();
    });

    document.getElementById('owner-auth-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('owner-passcode-input');
      const code = (input?.value || '').trim().toUpperCase();
      if (code === 'OWNER' || code === 'BULK25' || code === 'FARM89' || code === 'ADMIN') {
        state.ownerUnlocked = true;
        if (code === 'BULK25') state.pricingMode = 'wholesale';
        saveState();
        syncOwnerUI();
        renderMarketplace();
        renderCart();
        if (input) input.value = '';
        showToast('Owner Testing Access Unlocked');
      } else {
        showToast('Invalid owner key (use OWNER)');
      }
    });

    document.querySelectorAll('[data-owner-mode]').forEach((card) => {
      card.addEventListener('click', () => {
        state.pricingMode = card.getAttribute('data-owner-mode');
        saveState();
        syncOwnerUI();
        renderMarketplace();
        renderCart();
        showToast(state.pricingMode === 'wholesale' ? 'Owner Test: 25 kg Wholesale Crates' : 'Standard 1 kg Grocery Packs');
      });
    });

    document.getElementById('owner-lock-btn')?.addEventListener('click', () => {
      state.ownerUnlocked = false;
      state.pricingMode = 'retail';
      saveState();
      syncOwnerUI();
      renderMarketplace();
      renderCart();
      closeOwnerModal();
      showToast('Owner Testing Mode Locked');
    });

    // Theme & Mobile Frame Preview
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

    const mobileFrameBtn = document.getElementById('mobile-frame-toggle-btn');
    mobileFrameBtn?.addEventListener('click', () => {
      const active = document.body.classList.toggle('is-mobile-frame-mode');
      mobileFrameBtn.classList.toggle('is-active', active);
      setTimeout(() => syncAllSpringIndicators(false), 120);
      showToast(active ? 'Mobile Preview Active' : 'Desktop View Active');
    });

    // AI Scanner Presets, Upload & Publish
    document.querySelectorAll('[data-scanner-preset]').forEach((btn) => {
      btn.addEventListener('click', () => selectScannerPreset(btn.getAttribute('data-scanner-preset')));
    });

    document.getElementById('trigger-cv-scan-btn')?.addEventListener('click', runSimulatedCvScan);

    const fileInput = document.getElementById('scanner-file-input');
    const uploadZone = document.getElementById('scanner-upload-zone');
    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', () => fileInput.click());
      uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--accent-bronze)';
      });
      uploadZone.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '';
      });
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '';
        const file = e.dataTransfer?.files?.[0];
        if (file) handleCustomCropImage(file);
      });
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) handleCustomCropImage(file);
      });
    }

    document.getElementById('scanner-publish-form')?.addEventListener('submit', handlePublishScannedCrop);

    // Basket & Modal Controls
    document.querySelectorAll('[data-open-cart]').forEach((btn) => btn.addEventListener('click', openCartDrawer));
    document.getElementById('close-cart-btn')?.addEventListener('click', closeCartDrawer);
    document.getElementById('cart-sheet-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'cart-sheet-backdrop') closeCartDrawer();
    });
    document.getElementById('trust-report-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'trust-report-modal') closeProductReportModal();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductReportModal();
        closeCartDrawer();
        closeOwnerModal();
      }
    });

    // Floating Back-to-Top Button
    const backToTopBtn = document.getElementById('back-to-top-btn');
    backToTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener(
      'scroll',
      () => {
        if (backToTopBtn) backToTopBtn.classList.toggle('is-visible', window.scrollY > 360);
      },
      { passive: true }
    );

    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  function handleCustomCropImage(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      ui.customUploadDataUrl = ev.target?.result;
      ui.customUploadName = file.name;
      runSimulatedCvScan();
    };
    reader.readAsDataURL(file);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
