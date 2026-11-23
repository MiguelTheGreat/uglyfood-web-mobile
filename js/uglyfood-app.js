/**
 * UGLYFOOD AI — APPLE LIQUID GLASS INTERACTION & SPRING MOTION CONTROLLER
 * Zero external dependencies. Implements Apple HIG spring sliding indicators
 * for top & bottom menus, curved Liquid Glass cards, simulated CV scanning,
 * and localStorage persistence.
 */
(function () {
  const STORAGE_KEY = 'uglyfood_ai_state_v2';
  const THEME_KEY = 'uglyfood_theme_v2';
  const defaultData = window.UGLYFOOD_INITIAL_DATA;

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
      role: 'b2c',
      listings: JSON.parse(JSON.stringify(defaultData.listings)),
      incomingOrders: JSON.parse(JSON.stringify(defaultData.incomingOrders)),
      platformStats: JSON.parse(JSON.stringify(defaultData.platformStats)),
      userImpact: JSON.parse(JSON.stringify(defaultData.userImpact)),
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
      grade: 'All',
      region: 'All',
      maxPrice: 250
    },
    activePresetId: 'preset-carrots',
    customUploadDataUrl: null,
    customUploadName: null,
    activeModalCropId: null,
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

  function showToast(message, duration = 2400) {
    const el = document.getElementById('uf-toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), duration);
  }

  /* ------------------------------------------------------------------------
     1. APPLE HIG SPRING SLIDING GLASS INDICATOR ENGINE (Top & Bottom Menus)
     ------------------------------------------------------------------------ */
  function positionSpringIndicator(trackEl, immediate = false) {
    if (!trackEl) return;
    const indicator = trackEl.querySelector('.lg-spring-indicator');
    const activeItem = trackEl.querySelector('.lg-spring-item.is-active');
    if (!indicator || !activeItem) return;

    const width = activeItem.offsetWidth;
    const offsetLeft = activeItem.offsetLeft;
    if (width === 0) return;

    if (immediate) {
      indicator.style.transition = 'none';
    }
    indicator.style.width = `${width}px`;
    indicator.style.transform = `translate3d(${offsetLeft}px, 0, 0)`;

    if (immediate) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }

  function syncAllSpringIndicators(immediate = false) {
    ['top-nav-track', 'role-switcher-track', 'mobile-nav-track'].forEach((id) => {
      positionSpringIndicator(document.getElementById(id), immediate);
    });
  }

  function setActiveNavSection(sectionId) {
    // Update Top Nav Track
    const topTrack = document.getElementById('top-nav-track');
    if (topTrack) {
      topTrack.querySelectorAll('[data-top-nav]').forEach((item) => {
        item.classList.toggle('is-active', item.getAttribute('data-top-nav') === sectionId);
      });
      positionSpringIndicator(topTrack);
    }

    // Update Mobile Bottom Dock Track
    const mobileTrack = document.getElementById('mobile-nav-track');
    if (mobileTrack) {
      mobileTrack.querySelectorAll('[data-mobile-nav]').forEach((item) => {
        item.classList.toggle('is-active', item.getAttribute('data-mobile-nav') === sectionId);
      });
      positionSpringIndicator(mobileTrack);
    }
  }

  function triggerAppleSectionSpring(sectionEl) {
    if (!sectionEl) return;
    sectionEl.classList.remove('apple-spring-enter');
    void sectionEl.offsetWidth;
    sectionEl.classList.add('apple-spring-enter');
  }

  function navigateToSection(sectionId, { updateHash = true } = {}) {
    document.getElementById('mobile-liquid-dock')?.classList.remove('is-minimized');
    if (sectionId === 'cart') {
      setActiveNavSection('cart');
      openCartDrawer();
      return;
    }

    const validViews = ['marketplace', 'scanner', 'farmer-dashboard'];
    const targetView = validViews.includes(sectionId) ? sectionId : 'marketplace';
    ui.activeView = targetView;

    document.querySelectorAll('.uf-view').forEach((viewEl) => {
      const isMatch = viewEl.getAttribute('data-view') === targetView;
      viewEl.classList.toggle('is-active', isMatch);
    });

    setActiveNavSection(targetView);

    if (updateHash && window.location.hash !== `#${targetView}`) {
      history.replaceState(null, '', `#${targetView}`);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------------
     2. THEME CONTROLLER (Warm Museum Paper <-> Gallery Noir)
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
    showToast(next === 'dark' ? 'Dark Glass Mode Active' : 'Warm Light Glass Mode Active');
  }

  /* ------------------------------------------------------------------------
     3. ROLE SWITCHER (B2C Buyer · B2B Bulk · Farmer)
     ------------------------------------------------------------------------ */
  function getActivePrice(crop, role = state.role) {
    if (role === 'b2b') {
      return {
        price: crop.priceB2B,
        market: crop.marketPriceB2B,
        unit: crop.unitB2B || 'per 25 kg crate',
        kgPerUnit: 25,
        discountPct: Math.round(((crop.marketPriceB2B - crop.priceB2B) / crop.marketPriceB2B) * 100)
      };
    }
    return {
      price: crop.priceB2C,
      market: crop.marketPriceB2C,
      unit: crop.unitB2C || 'per 1 kg pack',
      kgPerUnit: 1,
      discountPct: Math.round(((crop.marketPriceB2C - crop.priceB2C) / crop.marketPriceB2C) * 100)
    };
  }

  function setRole(newRole, { scrollToSection = false } = {}) {
    state.role = newRole;
    saveState();

    const priceSlider = document.getElementById('filter-max-price');
    if (priceSlider) {
      if (newRole === 'b2b') {
        priceSlider.max = '3000';
        priceSlider.step = '50';
        if (ui.filters.maxPrice <= 250) ui.filters.maxPrice = 3000;
        priceSlider.value = String(ui.filters.maxPrice);
      } else {
        priceSlider.max = '250';
        priceSlider.step = '5';
        if (ui.filters.maxPrice > 250) ui.filters.maxPrice = 250;
        priceSlider.value = String(ui.filters.maxPrice);
      }
    }

    const roleTrack = document.getElementById('role-switcher-track');
    if (roleTrack) {
      roleTrack.querySelectorAll('[data-role-btn]').forEach((btn) => {
        const isMatch = btn.getAttribute('data-role-btn') === newRole;
        btn.classList.toggle('is-active', isMatch);
        btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
      });
      positionSpringIndicator(roleTrack);
    }

    const roleBanner = document.getElementById('hero-role-indicator');
    if (roleBanner) {
      const labels = {
        b2c: 'Individual Buyer · 1–5 kg Retail Packs',
        b2b: 'Commercial Buyer · 25–100 kg Wholesale Crates',
        farmer: 'Local Farmer · AI Crop Scanner & Supplier Atelier'
      };
      roleBanner.textContent = labels[newRole] || labels.b2c;
    }

    const toastLabels = {
      b2c: 'Individual Buyer Mode (B2C Retail Pricing)',
      b2b: 'Commercial Buyer Mode (B2B Wholesale Crates)',
      farmer: 'Local Farmer Mode (AI Scanner & Dashboard)'
    };
    showToast(toastLabels[newRole]);

    renderMarketplace();
    renderCart();
    renderFarmerDashboard();

    if (scrollToSection) {
      navigateToSection(newRole === 'farmer' ? 'scanner' : 'marketplace');
    }
  }

  /* ------------------------------------------------------------------------
     4. LIVE METRICS STRIP
     ------------------------------------------------------------------------ */
  function renderImpactStrip() {
    const wasteEl = document.getElementById('ticker-waste-kg');
    const earnEl = document.getElementById('ticker-farmer-php');
    const saveEl = document.getElementById('ticker-savings-pct');
    const personalEl = document.getElementById('personal-saved-summary');

    if (wasteEl) wasteEl.textContent = state.platformStats.wasteDivertedKg.toLocaleString('en-PH') + ' kg';
    if (earnEl) earnEl.textContent = formatPhp(state.platformStats.farmerEarningsPhp);
    if (saveEl) saveEl.textContent = state.platformStats.avgSavingsPct + '% Off';
    if (personalEl) personalEl.textContent = `${state.userImpact.savedKg.toFixed(1)} kg · ${formatPhp(state.userImpact.savedPhp)}`;
  }

  /* ------------------------------------------------------------------------
     5. MARKETPLACE (Curved Liquid Glass Cards)
     ------------------------------------------------------------------------ */
  function renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    const countLabel = document.getElementById('marketplace-count-label');
    const priceLabel = document.getElementById('filter-price-display');
    const modeNote = document.getElementById('marketplace-mode-note');

    if (priceLabel) {
      const suffix = state.role === 'b2b' ? ' / 25 kg crate' : ' / kg';
      priceLabel.textContent = formatPhp(ui.filters.maxPrice) + suffix;
    }

    if (modeNote) {
      if (state.role === 'b2b') {
        modeNote.textContent = 'Commercial B2B mode — showing 25 kg wholesale crates with direct commissary pricing (-47% to -52% vs. traditional wholesale).';
      } else if (state.role === 'farmer') {
        modeNote.textContent = 'Farmer Preview mode — showing your live crops currently visible to buyers. Scan a harvest below to publish instantly.';
      } else {
        modeNote.textContent = 'Individual Buyer mode — showing 1 kg retail packs harvested within 24 hours and verified 100% safe by computer vision.';
      }
    }

    if (!grid) return;

    const filtered = state.listings.filter((item) => {
      if (!item.active && state.role !== 'farmer') return false;
      const pricing = getActivePrice(item);
      if (pricing.price > ui.filters.maxPrice) return false;
      if (ui.filters.category !== 'All' && item.category !== ui.filters.category) return false;
      if (ui.filters.grade !== 'All' && item.grade !== ui.filters.grade) return false;
      if (ui.filters.region !== 'All' && !item.region.toLowerCase().includes(ui.filters.region.toLowerCase())) return false;
      if (ui.filters.search.trim()) {
        const q = ui.filters.search.toLowerCase();
        const hay = `${item.title} ${item.farmName} ${item.region} ${(item.cosmeticDefects || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (countLabel) {
      countLabel.textContent = `${filtered.length} of ${state.listings.filter((l) => l.active).length} verified lots`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="lg-card" style="grid-column:1/-1;text-align:center;padding:3rem 1.5rem;">
          <span class="uf-kicker">No Matching Lots</span>
          <h3 class="uf-heading" style="font-size:1.65rem;margin:0.45rem 0 0.65rem;">No rescued harvests match those filters.</h3>
          <p style="color:var(--ink-secondary);margin:0 0 1.25rem;">Try raising the price slider or clearing your search term.</p>
          <button type="button" class="lg-btn lg-btn--prominent" id="reset-filters-empty-btn">Reset All Filters</button>
        </div>
      `;
      document.getElementById('reset-filters-empty-btn')?.addEventListener('click', resetFilters);
      return;
    }

    grid.innerHTML = filtered
      .map((crop) => {
        const pricing = getActivePrice(crop);
        const defectNote = crop.cosmeticDefects && crop.cosmeticDefects[0] ? crop.cosmeticDefects[0] : 'Cosmetic variation only — 100% edible.';
        return `
          <article class="lg-card lg-card--interactive uf-product-card">
            <div class="uf-product-media" data-open-report="${crop.id}">
              <img src="${crop.image}" alt="${crop.title}" loading="lazy">
              <div class="uf-badge-overlay">
                <span class="uf-trust-pill uf-tabular">
                  <span style="width:7px;height:7px;border-radius:50%;background:#26694a;display:inline-block;"></span>
                  AI Safe · ${crop.freshnessScore}%
                </span>
                <span class="uf-discount-pill uf-tabular">-${pricing.discountPct}%</span>
              </div>
              ${crop.isNewlyScanned ? `<span class="uf-new-lot-pill">Newly Scanned</span>` : ''}
            </div>

            <div class="uf-product-body">
              <div class="uf-product-meta-row">
                <span class="uf-grade-chip">${crop.gradeLabel}</span>
                <span class="uf-tabular" style="font-size:0.75rem;color:var(--ink-secondary);font-weight:600;">${crop.stockKg} kg left</span>
              </div>

              <h3 class="uf-product-title">${crop.title}</h3>
              <div class="uf-product-farm">${crop.farmName} · ${crop.region}</div>

              <p class="uf-defect-bubble">${defectNote}</p>

              <div class="uf-pricing-row">
                <div>
                  <span class="uf-price-main uf-tabular">${formatPhp(pricing.price)}</span>
                  <span class="uf-price-strike uf-tabular">${formatPhp(pricing.market)}</span>
                  <div class="uf-price-unit">${pricing.unit}</div>
                </div>
                <div style="text-align:right;">
                  <div class="uf-tabular" style="font-size:0.76rem;font-weight:700;color:var(--accent-emerald);">Save ${formatPhp(pricing.market - pricing.price)}</div>
                  <div class="uf-price-unit uf-tabular">CV ${crop.cvConfidence}%</div>
                </div>
              </div>
            </div>

            <div class="uf-product-actions">
              <button type="button" class="lg-btn" data-open-report="${crop.id}">AI Report</button>
              <button type="button" class="lg-btn lg-btn--prominent" data-add-cart="${crop.id}">
                + Add ${state.role === 'b2b' ? 'Crate' : 'Pack'}
              </button>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-open-report]').forEach((el) => {
      el.addEventListener('click', () => openProductReportModal(el.getAttribute('data-open-report')));
    });

    grid.querySelectorAll('[data-add-cart]').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add-cart'), 1));
    });
  }

  function resetFilters() {
    ui.filters = {
      search: '',
      category: 'All',
      grade: 'All',
      region: 'All',
      maxPrice: state.role === 'b2b' ? 3000 : 250
    };
    const searchInput = document.getElementById('filter-search');
    const gradeSelect = document.getElementById('filter-grade');
    const regionSelect = document.getElementById('filter-region');
    const priceSlider = document.getElementById('filter-max-price');
    if (searchInput) searchInput.value = '';
    if (gradeSelect) gradeSelect.value = 'All';
    if (regionSelect) regionSelect.value = 'All';
    if (priceSlider) priceSlider.value = String(ui.filters.maxPrice);

    document.querySelectorAll('[data-category-pill]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-category-pill') === 'All');
    });

    renderMarketplace();
  }

  /* ------------------------------------------------------------------------
     6. CONCENTRIC INSET LIQUID GLASS AI TRUST REPORT MODAL
     ------------------------------------------------------------------------ */
  function openProductReportModal(cropId) {
    const crop = state.listings.find((item) => item.id === cropId);
    if (!crop) return;

    ui.activeModalCropId = cropId;
    ui.modalQty = 1;

    const backdrop = document.getElementById('trust-report-modal');
    const content = document.getElementById('trust-report-content');
    if (!backdrop || !content) return;

    const pricing = getActivePrice(crop);
    const farm = defaultData.farms.find((f) => f.name === crop.farmName) || defaultData.farms[0];

    function renderModalInner() {
      const totalCost = pricing.price * ui.modalQty;
      const totalSaved = (pricing.market - pricing.price) * ui.modalQty;
      const totalKg = pricing.kgPerUnit * ui.modalQty;

      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--lg-border-subtle);margin-bottom:1.25rem;">
          <div>
            <span class="uf-kicker">AI Quality Certificate · ${crop.harvestDate}</span>
            <h2 class="uf-heading" style="font-size:clamp(1.5rem,3vw,2.15rem);margin-top:0.25rem;">${crop.title}</h2>
          </div>
          <button type="button" class="uf-close-orb" id="close-trust-modal-btn" aria-label="Close AI Report">&times;</button>
        </div>

        <div class="uf-trust-grid">
          <div style="display:flex;flex-direction:column;gap:0.95rem;">
            <div style="position:relative;border-radius:20px;overflow:hidden;aspect-ratio:4/3;">
              <img src="${crop.image}" alt="${crop.title}" style="width:100%;height:100%;object-fit:cover;display:block;">
              <div class="lg-media-dimmer"></div>
              <div class="lg-clear uf-media-hud-bar">
                <span>Passed · ${crop.edibilityScore}% Edible</span>
                <span class="uf-tabular">${crop.cvConfidence}% Confidence</span>
              </div>
            </div>

            <div style="border-radius:20px;background:var(--lg-surface-bg);border:1px solid var(--lg-border-subtle);padding:1rem 1.15rem;">
              <span class="uf-kicker">Direct Farm Origin</span>
              <h3 class="uf-heading" style="font-size:1.22rem;margin:0.25rem 0 0.35rem;">${crop.farmName}</h3>
              <p style="font-size:0.84rem;color:var(--ink-secondary);margin:0 0 0.7rem;line-height:1.52;">${farm.bio}</p>
              <div style="display:flex;justify-content:space-between;font-size:0.76rem;font-weight:700;color:var(--accent-emerald);padding-top:0.55rem;border-top:1px solid var(--lg-border-subtle);">
                <span>${farm.directSharePct}% Direct Farmer Payout</span>
                <span>0 Middlemen</span>
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;justify-content:space-between;gap:1rem;">
            <div>
              <div class="uf-score-grid" style="margin-bottom:0.95rem;">
                <div class="uf-score-pill-card">
                  <span style="font-size:0.72rem;font-weight:600;color:var(--ink-secondary);">Freshness</span>
                  <div class="uf-score-val uf-tabular" style="color:var(--accent-emerald);">${crop.freshnessScore}%</div>
                </div>
                <div class="uf-score-pill-card">
                  <span style="font-size:0.72rem;font-weight:600;color:var(--ink-secondary);">Edibility</span>
                  <div class="uf-score-val uf-tabular" style="color:var(--accent-emerald);">${crop.edibilityScore}%</div>
                </div>
                <div class="uf-score-pill-card">
                  <span style="font-size:0.72rem;font-weight:600;color:var(--ink-secondary);">Grade</span>
                  <div class="uf-score-val" style="color:var(--accent-bronze);">${crop.grade}</div>
                </div>
              </div>

              <p style="font-size:0.9rem;line-height:1.6;color:var(--ink-secondary);margin:0 0 0.95rem;">${crop.description}</p>

              <div style="border-radius:20px;background:var(--lg-surface-bg);border:1px solid var(--lg-border-subtle);padding:0.95rem 1.1rem;">
                <div style="display:flex;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.45rem;">
                  <span class="uf-kicker">Cosmetic Notes</span>
                  <span style="font-size:0.76rem;font-weight:600;color:var(--ink-secondary);">${crop.brixIndex || '99.2% Purity'}</span>
                </div>
                <ul style="margin:0;padding-left:1.15rem;font-size:0.84rem;color:var(--ink-primary);line-height:1.6;">
                  ${(crop.cosmeticDefects || []).map((d) => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="border-top:1px solid var(--lg-border-subtle);padding-top:1rem;display:flex;flex-direction:column;gap:0.9rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                <div>
                  <span style="font-size:0.74rem;font-weight:700;color:var(--ink-secondary);">${state.role === 'b2b' ? 'B2B Bulk Pricing' : 'B2C Retail Pricing'}</span>
                  <div style="display:flex;align-items:baseline;gap:0.45rem;margin-top:0.15rem;">
                    <span class="uf-price-main uf-tabular">${formatPhp(totalCost)}</span>
                    <span class="uf-price-strike uf-tabular">${formatPhp(pricing.market * ui.modalQty)}</span>
                    <span class="uf-price-unit uf-tabular">(${totalKg} kg)</span>
                  </div>
                </div>

                <div class="uf-qty-stepper" aria-label="Quantity selector">
                  <button type="button" class="uf-qty-btn" id="modal-qty-dec" aria-label="Decrease quantity">&minus;</button>
                  <span class="uf-tabular" style="padding:0 0.75rem;font-weight:700;font-size:0.88rem;">${ui.modalQty}</span>
                  <button type="button" class="uf-qty-btn" id="modal-qty-inc" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <button type="button" class="lg-btn lg-btn--prominent" id="modal-add-cart-btn" style="width:100%;padding:0.88rem;font-size:0.9rem;">
                Add ${ui.modalQty} &times; ${state.role === 'b2b' ? '25 kg Crate' : '1 kg Pack'} · Save ${formatPhp(totalSaved)}
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
        openCartDrawer();
      });
    }

    renderModalInner();
    backdrop.classList.add('is-open');
  }

  function closeProductReportModal() {
    document.getElementById('trust-report-modal')?.classList.remove('is-open');
  }

  /* ------------------------------------------------------------------------
     7. AI PRODUCE SCANNER & COMPUTER VISION GRADER
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

    if (hudStatus) hudStatus.textContent = 'Scanning epidermal geometry...';
    if (hudConf) hudConf.textContent = 'Optical freshness check active';
    if (telemetryEl) {
      telemetryEl.textContent = 'Analyzing surface contours, natural skin markings, and freshness firmness to verify 100% food safety...';
    }

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

      if (hudStatus) hudStatus.textContent = `Passed · ${preset.edibility}% Safe for Consumption`;
      if (hudConf) hudConf.textContent = `${preset.grade} · ${preset.confidence}% Confidence`;
      if (telemetryEl) {
        const cleanNote = preset.telemetry.replace('[CV-NET v4.2] ', '');
        const prefix = ui.customUploadName ? `Uploaded (${ui.customUploadName}): ` : '';
        telemetryEl.textContent = prefix + cleanNote;
      }

      const gradeOut = document.getElementById('scan-out-grade');
      const freshOut = document.getElementById('scan-out-freshness');
      const safetyOut = document.getElementById('scan-out-safety');
      if (gradeOut) gradeOut.textContent = preset.grade;
      if (freshOut) freshOut.textContent = preset.freshness + '%';
      if (safetyOut) safetyOut.textContent = 'Passed';

      const titleInput = document.getElementById('publish-crop-title');
      const catInput = document.getElementById('publish-crop-category');
      const weightInput = document.getElementById('publish-crop-weight');
      const priceB2CInput = document.getElementById('publish-price-b2c');
      const priceB2BInput = document.getElementById('publish-price-b2b');
      const farmInput = document.getElementById('publish-farm-name');
      const defectInput = document.getElementById('publish-defect-note');

      if (titleInput) {
        titleInput.value = ui.customUploadName
          ? `Rescued ${ui.customUploadName.replace(/\.[^/.]+$/, '')} Lot`
          : preset.name;
      }
      if (catInput) catInput.value = preset.category;
      if (weightInput) weightInput.value = String(preset.defaultWeightKg);
      if (priceB2CInput) priceB2CInput.value = String(preset.recommendedB2C);
      if (priceB2BInput) priceB2BInput.value = String(preset.recommendedB2B);
      if (farmInput) farmInput.value = `${preset.farmName} · ${preset.region}`;
      if (defectInput) defectInput.value = preset.defects[0];
    }, 850);
  }

  function handlePublishScannedCrop(e) {
    e.preventDefault();
    const preset = getActivePreset();

    const title = (document.getElementById('publish-crop-title')?.value || preset.name).trim();
    const category = document.getElementById('publish-crop-category')?.value || preset.category;
    const stockKg = Math.max(10, Number(document.getElementById('publish-crop-weight')?.value || preset.defaultWeightKg));
    const priceB2C = Math.max(15, Number(document.getElementById('publish-price-b2c')?.value || preset.recommendedB2C));
    const priceB2B = Math.max(250, Number(document.getElementById('publish-price-b2b')?.value || preset.recommendedB2B));
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
      harvestDate: 'Verified Just Now · Live Batch',
      image: ui.customUploadDataUrl || preset.image,
      priceB2C,
      marketPriceB2C: Math.round(priceB2C * 1.92),
      unitB2C: 'per 1 kg pack',
      priceB2B,
      marketPriceB2B: Math.round(priceB2B * 1.95),
      unitB2B: 'per 25 kg crate',
      stockKg,
      active: true,
      isNewlyScanned: true,
      freshnessScore: preset.freshness,
      edibilityScore: preset.edibility,
      cvConfidence: preset.confidence,
      brixIndex: preset.brix,
      cosmeticDefects: [defectNote, ...preset.defects.slice(1)],
      description: `Direct farm-scanned harvest lot verified by UglyFood AI (${preset.confidence}% confidence). Safe, fresh produce rescued directly at source.`
    };

    state.listings.unshift(newListing);
    state.platformStats.wasteDivertedKg += stockKg;
    state.platformStats.verifiedBatches += 1;
    saveState();

    renderImpactStrip();
    renderMarketplace();
    renderFarmerDashboard();

    showToast(`Published "${title}" (${stockKg} kg) to Marketplace`);
    navigateToSection('marketplace');
  }

  /* ------------------------------------------------------------------------
     8. FARMER DASHBOARD & PARTNER FARMS (Curved Liquid Glass Cards)
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
    if (countEl) countEl.textContent = `${activeListings.length} Active / ${state.listings.length}`;

    const invList = document.getElementById('farmer-inventory-list');
    if (invList) {
      invList.innerHTML = state.listings
        .slice(0, 6)
        .map(
          (item) => `
          <div class="uf-inventory-row-card">
            <div style="flex:1 1 200px;">
              <div style="font-weight:700;font-size:0.94rem;color:var(--ink-primary);">${item.title}</div>
              <div style="font-size:0.78rem;color:var(--ink-secondary);margin-top:0.15rem;">
                ${item.gradeLabel} · <strong class="uf-tabular" style="color:var(--ink-primary);">${item.stockKg} kg</strong> · ${formatPhp(item.priceB2C)}/kg
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:0.55rem;flex-wrap:wrap;">
              <button
                type="button"
                class="lg-toggle-switch ${item.active ? 'is-on' : ''}"
                data-toggle-listing="${item.id}"
                aria-label="Toggle availability for ${item.title}"
                title="${item.active ? 'Active in Marketplace' : 'Paused'}"
              >
                <span class="lg-toggle-knob"></span>
              </button>
              <button type="button" class="lg-btn" data-restock-listing="${item.id}" style="padding:0.42rem 0.78rem;font-size:0.74rem;">+50 kg</button>
              <button type="button" class="uf-close-orb" data-delete-listing="${item.id}" style="width:32px;height:32px;font-size:1rem;" aria-label="Remove ${item.title}">&times;</button>
            </div>
          </div>
        `
        )
        .join('');

      invList.querySelectorAll('[data-toggle-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-listing');
          const target = state.listings.find((l) => l.id === id);
          if (target) {
            target.active = !target.active;
            saveState();
            renderFarmerDashboard();
            renderMarketplace();
            showToast(`${target.title} ${target.active ? 'Live in Marketplace' : 'Paused'}`);
          }
        });
      });

      invList.querySelectorAll('[data-restock-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-restock-listing');
          const target = state.listings.find((l) => l.id === id);
          if (target) {
            target.stockKg += 50;
            saveState();
            renderFarmerDashboard();
            renderMarketplace();
            showToast(`Added +50 kg stock to ${target.title}`);
          }
        });
      });

      invList.querySelectorAll('[data-delete-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-delete-listing');
          if (state.listings.length <= 3) {
            showToast('Keep at least 3 active lots in demo mode');
            return;
          }
          state.listings = state.listings.filter((l) => l.id !== id);
          saveState();
          renderFarmerDashboard();
          renderMarketplace();
          showToast('Harvest lot removed');
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
            <div style="display:flex;justify-content:space-between;align-items:baseline;gap:0.5rem;">
              <span class="uf-kicker">${ord.id} · ${ord.timeAgo}</span>
              <strong class="uf-tabular" style="font-family:var(--font-display);font-size:1.15rem;color:var(--ink-primary);">${formatPhp(ord.totalPhp)}</strong>
            </div>
            <div style="font-weight:700;font-size:0.92rem;color:var(--ink-primary);">${ord.buyerName}</div>
            <div style="font-size:0.82rem;color:var(--ink-secondary);">${ord.cropTitle} · ${ord.quantityLabel}</div>
            <div style="font-size:0.76rem;font-weight:600;color:var(--accent-emerald);">${ord.status}</div>
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
            <h4 class="uf-heading" style="font-size:1.3rem;margin:0.25rem 0 0.45rem;">${farm.name}</h4>
            <p style="font-size:0.84rem;color:var(--ink-secondary);line-height:1.52;margin:0;">${farm.bio}</p>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;padding-top:0.75rem;border-top:1px solid var(--lg-border-subtle);font-size:0.76rem;font-weight:700;">
            <span class="uf-tabular" style="color:var(--accent-emerald);">${farm.wasteDivertedKg.toLocaleString('en-PH')} kg rescued</span>
            <span style="color:var(--accent-bronze);">View Lots &rarr;</span>
          </div>
        </article>
      `
      )
      .join('');

    grid.querySelectorAll('[data-filter-farm]').forEach((card) => {
      card.addEventListener('click', () => {
        const region = card.getAttribute('data-filter-farm');
        const regionSelect = document.getElementById('filter-region');
        if (regionSelect) {
          regionSelect.value = region;
          ui.filters.region = region;
          renderMarketplace();
          navigateToSection('marketplace');
          showToast(`Filtered harvests from ${region}`);
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     9. CART DRAWER & MOCK CHECKOUT
     ------------------------------------------------------------------------ */
  function addToCart(cropId, qty = 1) {
    const crop = state.listings.find((c) => c.id === cropId);
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
    showToast(`Added ${qty} ${state.role === 'b2b' ? 'crate' : 'pack'} of ${crop.title}`);
  }

  function updateCartQty(cropId, delta) {
    const idx = state.cart.findIndex((i) => i.cropId === cropId);
    if (idx === -1) return;
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) state.cart.splice(idx, 1);
    saveState();
    renderCart();
  }

  function renderCart() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('[data-cart-badge]').forEach((badge) => {
      badge.textContent = String(totalCount);
    });

    const listEl = document.getElementById('cart-items-container');
    const summaryEl = document.getElementById('cart-summary-footer');
    if (!listEl || !summaryEl) return;

    if (ui.checkoutSuccessOrder) {
      const ord = ui.checkoutSuccessOrder;
      listEl.innerHTML = `
        <div style="border-radius:22px;background:var(--accent-emerald-soft);border:1px solid rgba(38,105,74,0.28);padding:1.4rem;margin-top:0.75rem;">
          <span class="uf-kicker" style="color:var(--accent-emerald);">Order Confirmed · ${ord.id}</span>
          <h3 class="uf-heading" style="font-size:1.5rem;margin:0.35rem 0 0.6rem;">You rescued ${ord.rescuedKg} kg of local harvest!</h3>
          <p style="font-size:0.86rem;color:var(--ink-secondary);line-height:1.55;margin:0 0 1rem;">
            Your direct order for <strong>${ord.buyerName}</strong> has been sent to our partner farm hubs with <strong>89% direct farmer payout</strong>.
          </p>
          <div style="border-top:1px solid var(--lg-border-subtle);padding-top:0.8rem;display:flex;flex-direction:column;gap:0.4rem;font-size:0.84rem;">
            <div style="display:flex;justify-content:space-between;"><span>Total Paid</span><strong class="uf-tabular">${formatPhp(ord.totalPhp)}</strong></div>
            <div style="display:flex;justify-content:space-between;color:var(--accent-emerald);"><span>Saved vs. Retail</span><strong class="uf-tabular">${formatPhp(ord.savedPhp)}</strong></div>
          </div>
          <button type="button" class="lg-btn lg-btn--prominent" id="cart-continue-shopping-btn" style="width:100%;margin-top:1.15rem;">Continue Shopping</button>
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
          <p style="font-size:0.94rem;color:var(--ink-secondary);margin:0.5rem 0 0;">Pick any AI-verified produce from the Marketplace to start rescuing local harvests.</p>
        </div>
      `;
      summaryEl.innerHTML = '';
      return;
    }

    let subtotal = 0;
    let marketTotal = 0;
    let totalRescuedKg = 0;

    listEl.innerHTML = state.cart
      .map((entry) => {
        const crop = state.listings.find((c) => c.id === entry.cropId);
        if (!crop) return '';
        const pricing = getActivePrice(crop);
        const lineTotal = pricing.price * entry.qty;
        const lineMarket = pricing.market * entry.qty;
        const lineKg = pricing.kgPerUnit * entry.qty;

        subtotal += lineTotal;
        marketTotal += lineMarket;
        totalRescuedKg += lineKg;

        return `
          <div class="uf-cart-item">
            <img src="${crop.image}" alt="${crop.title}">
            <div>
              <div style="font-weight:700;font-size:0.92rem;color:var(--ink-primary);">${crop.title}</div>
              <div class="uf-tabular" style="font-size:0.76rem;color:var(--ink-secondary);">${formatPhp(pricing.price)} ${pricing.unit} · ${lineKg} kg</div>
              <div class="uf-tabular" style="font-size:0.74rem;font-weight:600;color:var(--accent-emerald);">Save ${formatPhp(lineMarket - lineTotal)}</div>
            </div>
            <div class="uf-qty-stepper">
              <button type="button" class="uf-qty-btn" data-cart-dec="${crop.id}" aria-label="Decrease ${crop.title}">&minus;</button>
              <span class="uf-tabular" style="padding:0 0.5rem;font-weight:700;font-size:0.84rem;">${entry.qty}</span>
              <button type="button" class="uf-qty-btn" data-cart-inc="${crop.id}" aria-label="Increase ${crop.title}">+</button>
            </div>
          </div>
        `;
      })
      .join('');

    const totalSavings = marketTotal - subtotal;

    summaryEl.innerHTML = `
      <div style="border-top:1px solid var(--lg-border-subtle);padding-top:1rem;display:flex;flex-direction:column;gap:0.8rem;">
        <div style="display:flex;flex-direction:column;gap:0.35rem;font-size:0.84rem;">
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>Retail Benchmark</span>
            <span class="uf-tabular" style="text-decoration:line-through;">${formatPhp(marketTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--accent-emerald);font-weight:700;">
            <span>Your Savings (${Math.round((totalSavings / marketTotal) * 100)}% Off)</span>
            <span class="uf-tabular">&minus;${formatPhp(totalSavings)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>Harvest Rescued</span>
            <strong class="uf-tabular">${totalRescuedKg} kg</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:0.5rem;border-top:1px solid var(--lg-border-subtle);">
            <span class="uf-kicker">Direct Subtotal</span>
            <span class="uf-tabular" style="font-family:var(--font-display);font-size:1.65rem;font-weight:600;">${formatPhp(subtotal)}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
          <input type="text" id="checkout-buyer-name" class="uf-input" value="${state.role === 'b2b' ? 'Solstice Kitchen' : 'Elena Reyes'}" style="font-size:0.82rem;padding:0.6rem 0.85rem;">
          <select id="checkout-fulfillment" class="uf-select" style="font-size:0.82rem;padding:0.6rem 0.85rem;" aria-label="Fulfillment">
            <option value="Hub Pickup">Hub Pickup (₱0)</option>
            <option value="Cold Delivery">Cold-Chain Delivery</option>
          </select>
        </div>

        <button type="button" class="lg-btn lg-btn--emerald" id="confirm-mock-order-btn" style="width:100%;padding:0.88rem;font-size:0.9rem;">
          Confirm Rescued Order · ${formatPhp(subtotal)}
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
      const fulfillment = document.getElementById('checkout-fulfillment')?.value || 'Hub Pickup';
      const firstCrop = state.listings.find((c) => c.id === state.cart[0]?.cropId);

      const orderRecord = {
        id: 'ORD-' + Math.floor(9000 + Math.random() * 900),
        buyerName: `${buyerName} (${state.role === 'b2b' ? 'B2B' : 'B2C'})`,
        cropTitle: firstCrop ? `${firstCrop.title}${state.cart.length > 1 ? ` + ${state.cart.length - 1} more` : ''}` : 'Rescued Harvest',
        quantityLabel: `${totalRescuedKg} kg (${fulfillment})`,
        totalPhp: subtotal,
        savedPhp: totalSavings,
        rescuedKg: totalRescuedKg,
        status: `Confirmed · ${fulfillment}`,
        timeAgo: 'Just now'
      };

      state.incomingOrders.unshift(orderRecord);
      state.platformStats.wasteDivertedKg += totalRescuedKg;
      state.platformStats.farmerEarningsPhp += Math.round(subtotal * 0.89);
      state.userImpact.ordersCount += 1;
      state.userImpact.savedKg += totalRescuedKg;
      state.userImpact.savedPhp += totalSavings;
      state.cart = [];
      ui.checkoutSuccessOrder = orderRecord;

      saveState();
      renderImpactStrip();
      renderFarmerDashboard();
      renderCart();
      showToast(`Order ${orderRecord.id} confirmed! Rescued ${totalRescuedKg} kg.`);
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
     10. INITIALIZATION & EVENT BINDINGS
     ------------------------------------------------------------------------ */
  function initApp() {
    initTheme();
    renderImpactStrip();
    renderMarketplace();
    renderFarmerDashboard();
    renderPartnerFarms();
    renderCart();
    selectScannerPreset('preset-carrots');

    // Support initial URL hash (#scanner, #farmer-dashboard, #marketplace)
    const initialHash = window.location.hash.replace('#', '');
    if (['marketplace', 'scanner', 'farmer-dashboard'].includes(initialHash)) {
      navigateToSection(initialHash, { updateHash: false });
    }

    // Sync Apple spring sliding indicators on initial paint & resize
    requestAnimationFrame(() => syncAllSpringIndicators(true));
    window.addEventListener('resize', () => syncAllSpringIndicators(true));

    // Brand link returns to Market view
    document.querySelector('.uf-brand')?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToSection('marketplace');
    });

    // Top Navigation Spring Menu
    document.querySelectorAll('[data-top-nav]').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToSection(link.getAttribute('data-top-nav'));
      });
    });

    // Mobile Bottom Liquid Glass Dock
    document.querySelectorAll('[data-mobile-nav]').forEach((tab) => {
      tab.addEventListener('click', () => {
        navigateToSection(tab.getAttribute('data-mobile-nav'));
      });
    });

    // Hero CTAs
    document.getElementById('hero-shop-cta')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    document.querySelectorAll('[data-jump-section]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigateToSection(el.getAttribute('data-jump-section'));
      });
    });

    document.getElementById('hero-scan-cta')?.addEventListener('click', () => {
      setRole('farmer', { scrollToSection: false });
      navigateToSection('scanner');
    });

    // Role Switcher
    document.querySelectorAll('[data-role-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextRole = btn.getAttribute('data-role-btn');
        setRole(nextRole, { scrollToSection: false });
        if (nextRole === 'farmer') {
          navigateToSection('farmer-dashboard');
        } else if (ui.activeView !== 'marketplace') {
          navigateToSection('marketplace');
        }
      });
    });

    // Theme Toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

    // Desktop Mobile Frame Simulator Toggle
    const mobileFrameBtn = document.getElementById('mobile-frame-toggle-btn');
    mobileFrameBtn?.addEventListener('click', () => {
      const active = document.body.classList.toggle('is-mobile-frame-mode');
      mobileFrameBtn.classList.toggle('is-active', active);
      setTimeout(() => syncAllSpringIndicators(false), 120);
      showToast(active ? 'Mobile App Frame Preview Active' : 'Desktop View Active');
    });

    // Marketplace Filters
    document.getElementById('filter-search')?.addEventListener('input', (e) => {
      ui.filters.search = e.target.value;
      renderMarketplace();
    });

    document.getElementById('filter-grade')?.addEventListener('change', (e) => {
      ui.filters.grade = e.target.value;
      renderMarketplace();
    });

    document.getElementById('filter-region')?.addEventListener('change', (e) => {
      ui.filters.region = e.target.value;
      renderMarketplace();
    });

    const priceSlider = document.getElementById('filter-max-price');
    if (priceSlider) {
      priceSlider.addEventListener('pointerdown', () => priceSlider.classList.add('is-interacting'));
      priceSlider.addEventListener('pointerup', () => priceSlider.classList.remove('is-interacting'));
      priceSlider.addEventListener('input', (e) => {
        ui.filters.maxPrice = Number(e.target.value);
        renderMarketplace();
      });
    }

    document.querySelectorAll('[data-category-pill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.filters.category = btn.getAttribute('data-category-pill');
        document.querySelectorAll('[data-category-pill]').forEach((b) => b.classList.toggle('is-active', b === btn));
        renderMarketplace();
      });
    });

    document.getElementById('reset-filters-btn')?.addEventListener('click', resetFilters);

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

    // Cart & Modal Controls
    document.querySelectorAll('[data-open-cart]').forEach((btn) => {
      btn.addEventListener('click', openCartDrawer);
    });
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
      }
    });

    // Floating Back-to-Top Button
    const backToTopBtn = document.getElementById('back-to-top-btn');
    backToTopBtn?.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Mobile Dock Auto-Minimize + Back-to-Top Visibility (Apple HIG)
    let lastScrollY = window.scrollY;
    const mobileDock = document.getElementById('mobile-liquid-dock');

    window.addEventListener(
      'scroll',
      () => {
        const currentY = window.scrollY;
        if (backToTopBtn) {
          backToTopBtn.classList.toggle('is-visible', currentY > 360);
        }
        if (mobileDock) {
          if (currentY > lastScrollY + 18 && currentY > 220) {
            mobileDock.classList.add('is-minimized');
          } else if (currentY < lastScrollY - 10 || currentY < 120) {
            mobileDock.classList.remove('is-minimized');
          }
        }
        lastScrollY = currentY;
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
