/**
 * UGLYFOOD AI — INTERACTIVE APPLICATION CONTROLLER
 * Harmonizes Lumina Design System (window.LuminaDesign) with Apple HIG Liquid Glass Chrome.
 */
(function () {
  const STORAGE_KEY = 'uglyfood_ai_state_v1';

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
      role: 'b2c', // 'b2c' | 'b2b' | 'farmer'
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

  const ui = {
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
    isScanning: false,
    isScanComplete: true,
    activeModalCropId: null,
    modalQty: 1,
    shareStyle: 'etched',
    checkoutSuccessOrder: null,
    cursorCtrl: null
  };

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not persist localStorage state:', e);
    }
  }

  function formatPhp(num) {
    return '₱' + Number(num || 0).toLocaleString('en-PH');
  }

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

  /* ------------------------------------------------------------------------
     1. ROLE SWITCHER (B2C / B2B / Local Farmer)
     ------------------------------------------------------------------------ */
  function setRole(newRole, { scrollToSection = false } = {}) {
    state.role = newRole;
    saveState();

    // Update Max Price slider range for B2C vs B2B
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

    document.querySelectorAll('[data-role-btn]').forEach((btn) => {
      const isMatch = btn.getAttribute('data-role-btn') === newRole;
      btn.classList.toggle('is-active', isMatch);
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });

    const roleBannerText = document.getElementById('hero-role-indicator');
    if (roleBannerText) {
      const labels = {
        b2c: 'ACTIVE VIEW: INDIVIDUAL BUYER (B2C RETAIL PACKS · 1–5 KG)',
        b2b: 'ACTIVE VIEW: COMMERCIAL BUYER (B2B WHOLESALE CRATES · 25–100 KG)',
        farmer: 'ACTIVE VIEW: LOCAL FARMER (AI CROP SCANNER & SUPPLIER ATELIER)'
      };
      roleBannerText.textContent = labels[newRole] || labels.b2c;
    }

    if (window.LuminaDesign) {
      window.LuminaDesign.playPaperRustle(0.045);
      const toastLabels = {
        b2c: 'Switched to Individual Buyer (B2C Retail Pricing)',
        b2b: 'Switched to Commercial Buyer (B2B Bulk Crate Pricing)',
        farmer: 'Switched to Local Farmer (AI Scanner & Supplier View)'
      };
      window.LuminaDesign.showToast(toastLabels[newRole]);
    }

    renderMarketplace();
    renderCart();
    renderFarmerDashboard();

    if (scrollToSection) {
      const targetId = newRole === 'farmer' ? 'scanner' : 'marketplace';
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* ------------------------------------------------------------------------
     2. LIVE IMPACT TICKER & HERO FOLIO SLAB
     ------------------------------------------------------------------------ */
  function renderImpactTicker() {
    const wasteEl = document.getElementById('ticker-waste-kg');
    const earnEl = document.getElementById('ticker-farmer-php');
    const saveEl = document.getElementById('ticker-savings-pct');
    const batchEl = document.getElementById('ticker-batches');

    if (wasteEl) wasteEl.textContent = state.platformStats.wasteDivertedKg.toLocaleString('en-PH') + ' kg';
    if (earnEl) earnEl.textContent = formatPhp(state.platformStats.farmerEarningsPhp);
    if (saveEl) saveEl.textContent = state.platformStats.avgSavingsPct + '%';
    if (batchEl) batchEl.textContent = state.platformStats.verifiedBatches.toLocaleString('en-PH');
  }

  /* ------------------------------------------------------------------------
     3. MARKETPLACE RENDERER & FILTERING
     ------------------------------------------------------------------------ */
  function renderMarketplace() {
    const grid = document.getElementById('marketplace-grid');
    const countLabel = document.getElementById('marketplace-count-label');
    const priceLabel = document.getElementById('filter-price-display');
    const modeSubnote = document.getElementById('marketplace-mode-note');

    if (priceLabel) {
      const unitSuffix = state.role === 'b2b' ? ' / 25kg crate' : ' / kg';
      priceLabel.textContent = formatPhp(ui.filters.maxPrice) + unitSuffix;
    }

    if (modeSubnote) {
      if (state.role === 'b2b') {
        modeSubnote.textContent = 'Commercial B2B Mode active — showing 25 kg wholesale crates with direct commissary discounts (-47% to -52% vs. Divisoria wholesale).';
      } else if (state.role === 'farmer') {
        modeSubnote.textContent = 'Farmer Preview Mode — showing live crops currently published to buyers. Scan a new harvest below to add an immediate listing.';
      } else {
        modeSubnote.textContent = 'Individual B2C Mode active — showing 1 kg retail packs harvested within 24 hours and verified 100% safe by computer vision.';
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
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchFarm = item.farmName.toLowerCase().includes(q);
        const matchRegion = item.region.toLowerCase().includes(q);
        const matchDefect = (item.cosmeticDefects || []).join(' ').toLowerCase().includes(q);
        if (!matchTitle && !matchFarm && !matchRegion && !matchDefect) return false;
      }
      return true;
    });

    if (countLabel) {
      countLabel.textContent = `SHOWING ${filtered.length} OF ${state.listings.filter((l) => l.active).length} AI-VERIFIED HARVEST LOTS`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="uf-kpi-card" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem;">
          <span class="lumina-kicker">ARCHIVE QUERY EMPTY</span>
          <h3 class="lumina-heading" style="font-size: 1.75rem; margin: 0.4rem 0;">No imperfect harvest lots match those exact filter criteria.</h3>
          <p style="color: var(--ink-secondary); margin: 0 0 1.25rem;">Try resetting the maximum price slider or viewing all regional hubs.</p>
          <div><button type="button" class="ctrl-btn hover-target" id="reset-filters-empty-btn">Reset All Filters</button></div>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-empty-btn');
      if (resetBtn) resetBtn.addEventListener('click', resetFilters);
      return;
    }

    grid.innerHTML = filtered
      .map((crop) => {
        const pricing = getActivePrice(crop);
        const defectSummary = crop.cosmeticDefects && crop.cosmeticDefects[0] ? crop.cosmeticDefects[0] : 'Cosmetic asymmetry only — 100% edible.';
        return `
          <article class="uf-product-card" data-crop-id="${crop.id}">
            <div class="uf-product-media" data-open-report="${crop.id}" data-cursor-inspect="REPORT">
              <img src="${crop.image}" alt="${crop.title}" loading="lazy">
              <div class="uf-badge-row-top">
                <span class="uf-trust-badge">
                  <span style="width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block;"></span>
                  AI SAFE · ${crop.freshnessScore}% FRESH
                </span>
                <span class="uf-discount-tag">-${pricing.discountPct}% OFF</span>
              </div>
              ${crop.isNewlyScanned ? `<span class="uf-new-scan-ribbon">NEWLY SCANNED LOT</span>` : ''}
            </div>

            <div class="uf-product-body">
              <div class="uf-product-meta-top">
                <span class="uf-grade-pill">${crop.gradeLabel}</span>
                <span class="lumina-label">${crop.stockKg} KG AVAIL</span>
              </div>

              <h3 class="uf-product-title">${crop.title}</h3>

              <div class="uf-product-farm">
                <span>${crop.farmName}</span>
                <span>&middot;</span>
                <span>${crop.region}</span>
              </div>

              <p class="uf-product-defect-note">&ldquo;${defectSummary}&rdquo;</p>

              <div class="uf-product-pricing-box">
                <div>
                  <span class="uf-price-primary">${formatPhp(pricing.price)}</span>
                  <span class="uf-price-strike">${formatPhp(pricing.market)}</span>
                  <div class="uf-price-unit">${pricing.unit}</div>
                </div>
                <div style="text-align:right;">
                  <span class="lumina-kicker" style="color:var(--emerald-trust);">SAVE ${formatPhp(pricing.market - pricing.price)}</span>
                  <div class="uf-price-unit">CV Conf: ${crop.cvConfidence}%</div>
                </div>
              </div>
            </div>

            <div class="uf-product-actions">
              <button type="button" class="ctrl-btn hover-target" data-open-report="${crop.id}">
                AI Report
              </button>
              <button type="button" class="ctrl-btn is-active hover-target" data-add-cart="${crop.id}">
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

    if (ui.cursorCtrl) ui.cursorCtrl.bindTargets(grid);
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
     4. CONCENTRIC INSET AI TRUST REPORT SHEET (Product Detail Modal)
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
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding-bottom:1.15rem;border-bottom:1px solid var(--border-hairline);margin-bottom:1.35rem;">
          <div>
            <span class="lumina-kicker">COMPUTER VISION CERTIFICATE &middot; ${crop.harvestDate}</span>
            <h2 class="lumina-heading" style="font-size:clamp(1.65rem,3vw,2.35rem);margin:0.25rem 0 0;">${crop.title}</h2>
          </div>
          <button type="button" class="lumina-nav-arrow hover-target" id="close-trust-modal-btn" aria-label="Close AI Report">&times;</button>
        </div>

        <div class="uf-trust-grid">
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div style="position:relative;border-radius:var(--radius-sharp);overflow:hidden;border:1px solid var(--border-subtle);aspect-ratio:4/3;">
              <img src="${crop.image}" alt="${crop.title}" style="width:100%;height:100%;object-fit:cover;display:block;">
              <div class="lg-media-dimmer"></div>
              <div class="liquid-glass--clear uf-media-hud-bar">
                <span class="uf-media-hud-text">PASSED &middot; ${crop.edibilityScore}% EDIBLE</span>
                <span class="uf-media-hud-text">CV CONFIDENCE: ${crop.cvConfidence}%</span>
              </div>
            </div>

            <div style="border:1px solid var(--border-subtle);background:var(--bg-paper);padding:1rem 1.15rem;border-radius:var(--radius-sharp);">
              <span class="lumina-kicker">${farm.kicker}</span>
              <h3 class="lumina-heading" style="font-size:1.3rem;margin:0.25rem 0;">${crop.farmName} (${crop.region})</h3>
              <p style="font-size:0.84rem;color:var(--ink-secondary);margin:0.35rem 0 0.65rem;line-height:1.55;">${farm.bio}</p>
              <div style="display:flex;justify-content:space-between;font-family:var(--font-display);font-size:0.48rem;letter-spacing:0.16em;color:var(--emerald-trust);padding-top:0.55rem;border-top:1px solid var(--border-hairline);">
                <span>DIRECT FARMER PAYOUT: ${farm.directSharePct}%</span>
                <span>0 MIDDLEMEN</span>
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;justify-content:space-between;gap:1.1rem;">
            <div>
              <div class="uf-score-grid" style="margin-bottom:1rem;">
                <div class="uf-score-cell">
                  <span class="lumina-label">FRESHNESS</span>
                  <div class="uf-score-val" style="color:var(--emerald-trust);">${crop.freshnessScore}%</div>
                </div>
                <div class="uf-score-cell">
                  <span class="lumina-label">EDIBILITY</span>
                  <div class="uf-score-val" style="color:var(--emerald-trust);">${crop.edibilityScore}%</div>
                </div>
                <div class="uf-score-cell">
                  <span class="lumina-label">VISUAL GRADE</span>
                  <div class="uf-score-val" style="color:var(--accent-warm);">${crop.grade}</div>
                </div>
              </div>

              <p style="font-size:0.92rem;line-height:1.65;color:var(--ink-secondary);margin:0 0 1rem;">${crop.description}</p>

              <div style="border:1px solid var(--border-subtle);background:var(--bg-paper);padding:0.95rem 1.1rem;border-radius:var(--radius-sharp);margin-bottom:1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                  <span class="lumina-kicker">DETECTED COSMETIC IMPERFECTIONS</span>
                  <span class="lumina-label">${crop.brixIndex || '99.2% Purity'}</span>
                </div>
                <ul style="margin:0;padding-left:1.1rem;font-size:0.84rem;color:var(--ink-primary);line-height:1.65;">
                  ${(crop.cosmeticDefects || []).map((d) => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="border-top:1px solid var(--border-subtle);padding-top:1.1rem;display:flex;flex-direction:column;gap:0.95rem;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span class="lumina-label">ACTIVE MODE (${state.role.toUpperCase()})</span>
                  <div style="display:flex;align-items:baseline;gap:0.5rem;margin-top:0.2rem;">
                    <span class="uf-price-primary">${formatPhp(totalCost)}</span>
                    <span class="uf-price-strike">${formatPhp(pricing.market * ui.modalQty)}</span>
                    <span class="uf-price-unit">(${totalKg} kg rescued)</span>
                  </div>
                </div>

                <div class="uf-qty-stepper" aria-label="Quantity selector">
                  <button type="button" class="uf-qty-btn" id="modal-qty-dec" aria-label="Decrease quantity">&minus;</button>
                  <span style="padding:0 0.85rem;font-family:var(--font-display);font-size:0.62rem;">${ui.modalQty}</span>
                  <button type="button" class="uf-qty-btn" id="modal-qty-inc" aria-label="Increase quantity">+</button>
                </div>
              </div>

              <div style="display:flex;gap:0.75rem;">
                <button type="button" class="lumina-cta hover-target" id="modal-add-cart-btn" style="flex:1;justify-content:center;">
                  Add ${ui.modalQty} &times; ${state.role === 'b2b' ? '25kg Crate' : '1kg Pack'} &middot; Save ${formatPhp(totalSaved)}
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const closeBtn = document.getElementById('close-trust-modal-btn');
      const decBtn = document.getElementById('modal-qty-dec');
      const incBtn = document.getElementById('modal-qty-inc');
      const addBtn = document.getElementById('modal-add-cart-btn');

      if (closeBtn) closeBtn.addEventListener('click', closeProductReportModal);
      if (decBtn) {
        decBtn.addEventListener('click', () => {
          if (ui.modalQty > 1) {
            ui.modalQty -= 1;
            renderModalInner();
          }
        });
      }
      if (incBtn) {
        incBtn.addEventListener('click', () => {
          ui.modalQty += 1;
          renderModalInner();
        });
      }
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          addToCart(crop.id, ui.modalQty);
          closeProductReportModal();
          openCartDrawer();
        });
      }
    }

    renderModalInner();
    backdrop.classList.add('is-open');
    document.body.classList.add('modal-open');
    if (window.LuminaDesign) window.LuminaDesign.playPaperRustle(0.04);
  }

  function closeProductReportModal() {
    const backdrop = document.getElementById('trust-report-modal');
    if (backdrop) backdrop.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }

  /* ------------------------------------------------------------------------
     5. AI PRODUCE SCANNER & COMPUTER VISION GRADER (Farmer View)
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

    if (hudStatus) hudStatus.textContent = 'SCANNING EPIDERMAL GEOMETRY...';
    if (hudConf) hudConf.textContent = 'NIR SPECTROMETER ACTIVE';
    if (telemetryEl) {
      telemetryEl.textContent = '[CV-NET v4.2] Acquiring multispectral frames... Mapping surface scars, turgor pressure, and pathogen exclusion markers...';
    }

    if (window.LuminaDesign) window.LuminaDesign.playPaperRustle(0.05);

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

      if (hudStatus) hudStatus.textContent = `PASSED · ${preset.edibility}% SAFE FOR CONSUMPTION`;
      if (hudConf) hudConf.textContent = `${preset.gradeLabel} (${preset.confidence}% CONF)`;
      if (telemetryEl) {
        const prefix = ui.customUploadName ? `[UPLOAD: ${ui.customUploadName}] ` : '';
        telemetryEl.textContent = prefix + preset.telemetry;
      }

      // Update output scores & prefill form
      const gradeOut = document.getElementById('scan-out-grade');
      const freshOut = document.getElementById('scan-out-freshness');
      const safetyOut = document.getElementById('scan-out-safety');
      if (gradeOut) gradeOut.textContent = preset.grade;
      if (freshOut) freshOut.textContent = preset.freshness + '%';
      if (safetyOut) safetyOut.textContent = 'PASSED';

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
    }, 950);
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
      harvestDate: 'Scanned & Verified Just Now · Live Batch',
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
      description: `Direct farm-scanned harvest lot verified by UglyFood AI Computer Vision (${preset.confidence}% confidence). Safe, nutrient-dense produce rescued at source.`
    };

    state.listings.unshift(newListing);
    state.platformStats.wasteDivertedKg += stockKg;
    state.platformStats.verifiedBatches += 1;
    saveState();

    renderImpactTicker();
    renderMarketplace();
    renderFarmerDashboard();

    if (window.LuminaDesign) {
      window.LuminaDesign.playPaperRustle(0.06);
      window.LuminaDesign.showToast(`Published "${title}" (${stockKg} kg) to Live Marketplace`);
    }

    const marketEl = document.getElementById('marketplace');
    if (marketEl) marketEl.scrollIntoView({ behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------------
     6. FARMER SUPPLIER ATELIER (Dashboard & Inventory Controls)
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
    if (countEl) countEl.textContent = `${activeListings.length} Active / ${state.listings.length} Total`;

    const invBody = document.getElementById('farmer-inventory-tbody');
    if (invBody) {
      invBody.innerHTML = state.listings
        .slice(0, 7)
        .map(
          (item) => `
          <tr>
            <td>
              <div style="font-weight:600;color:var(--ink-primary);">${item.title}</div>
              <div style="font-size:0.75rem;color:var(--ink-secondary);">${item.gradeLabel} &middot; ${item.farmName}</div>
            </td>
            <td>
              <span style="font-family:var(--font-serif);font-size:1.1rem;font-weight:600;">${item.stockKg} kg</span>
            </td>
            <td>
              <div>${formatPhp(item.priceB2C)}/kg</div>
              <div style="font-size:0.74rem;color:var(--ink-secondary);">${formatPhp(item.priceB2B)}/crate</div>
            </td>
            <td>
              <button
                type="button"
                class="lg-toggle-switch ${item.active ? 'is-on' : ''}"
                data-toggle-listing="${item.id}"
                aria-label="Toggle listing availability for ${item.title}"
                title="${item.active ? 'Active in Marketplace' : 'Paused'}"
              >
                <span class="lg-toggle-knob"></span>
              </button>
            </td>
            <td style="text-align:right;">
              <button type="button" class="ctrl-btn hover-target" data-restock-listing="${item.id}" style="padding:0.35rem 0.65rem;font-size:0.46rem;">+50 kg</button>
              <button type="button" class="ctrl-btn hover-target" data-delete-listing="${item.id}" style="padding:0.35rem 0.65rem;font-size:0.46rem;" aria-label="Delete ${item.title}">&times;</button>
            </td>
          </tr>
        `
        )
        .join('');

      invBody.querySelectorAll('[data-toggle-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-listing');
          const target = state.listings.find((l) => l.id === id);
          if (target) {
            target.active = !target.active;
            saveState();
            renderFarmerDashboard();
            renderMarketplace();
            if (window.LuminaDesign) {
              window.LuminaDesign.playPaperRustle(0.035);
              window.LuminaDesign.showToast(`${target.title} ${target.active ? 'Activated' : 'Paused'}`);
            }
          }
        });
      });

      invBody.querySelectorAll('[data-restock-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-restock-listing');
          const target = state.listings.find((l) => l.id === id);
          if (target) {
            target.stockKg += 50;
            saveState();
            renderFarmerDashboard();
            renderMarketplace();
            if (window.LuminaDesign) window.LuminaDesign.showToast(`Added +50 kg harvest stock to ${target.title}`);
          }
        });
      });

      invBody.querySelectorAll('[data-delete-listing]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-delete-listing');
          if (state.listings.length <= 3) {
            if (window.LuminaDesign) window.LuminaDesign.showToast('Keep at least 3 active demo listings in the archive');
            return;
          }
          state.listings = state.listings.filter((l) => l.id !== id);
          saveState();
          renderFarmerDashboard();
          renderMarketplace();
          if (window.LuminaDesign) window.LuminaDesign.showToast('Listing removed from inventory ledger');
        });
      });
    }

    const ordersBody = document.getElementById('farmer-orders-tbody');
    if (ordersBody) {
      ordersBody.innerHTML = state.incomingOrders
        .slice(0, 6)
        .map(
          (ord) => `
          <tr>
            <td>
              <span class="lumina-kicker">${ord.id} &middot; ${ord.timeAgo}</span>
              <div style="font-weight:600;color:var(--ink-primary);margin-top:0.15rem;">${ord.buyerName}</div>
            </td>
            <td>
              <div>${ord.cropTitle}</div>
              <div style="font-size:0.75rem;color:var(--ink-secondary);">${ord.quantityLabel}</div>
            </td>
            <td>
              <span style="font-family:var(--font-serif);font-size:1.1rem;font-weight:600;">${formatPhp(ord.totalPhp)}</span>
              <div style="font-size:0.72rem;color:var(--emerald-trust);">${ord.status}</div>
            </td>
          </tr>
        `
        )
        .join('');
    }
  }

  /* ------------------------------------------------------------------------
     7. SUSTAINABILITY & SOCIAL IMPACT ARCHIVE (UN SDGs & Share Card)
     ------------------------------------------------------------------------ */
  function renderPersonalImpact() {
    const summaryEl = document.getElementById('personal-impact-quote');
    const kgEl = document.getElementById('personal-saved-kg');
    const phpEl = document.getElementById('personal-saved-php');
    const co2El = document.getElementById('personal-saved-co2');
    const shareQuoteEl = document.getElementById('share-card-quote-text');

    if (summaryEl) {
      summaryEl.innerHTML = `&ldquo;Your direct farm orders have rescued <em>${state.userImpact.savedKg.toFixed(1)} kg</em> of nutrient-dense produce and saved <em>${formatPhp(state.userImpact.savedPhp)}</em> this month.&rdquo;`;
    }
    if (kgEl) kgEl.textContent = state.userImpact.savedKg.toFixed(1) + ' kg';
    if (phpEl) phpEl.textContent = formatPhp(state.userImpact.savedPhp);
    if (co2El) co2El.textContent = state.userImpact.co2AvoidedKg.toFixed(1) + ' kg CO₂e';
    if (shareQuoteEl) {
      shareQuoteEl.textContent = `"We rescued ${state.userImpact.savedKg.toFixed(1)} kg of imperfect local harvests—unlocking ${formatPhp(state.userImpact.savedPhp)} in direct farm-to-table value with zero middleman waste."`;
    }
  }

  /* ------------------------------------------------------------------------
     8. CART DRAWER & MOCK CHECKOUT
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

    if (window.LuminaDesign) {
      window.LuminaDesign.playPaperRustle(0.045);
      const unitLabel = state.role === 'b2b' ? '25kg crate(s)' : '1kg pack(s)';
      window.LuminaDesign.showToast(`Added ${qty} ${unitLabel} of ${crop.title} to Cart`);
    }
  }

  function updateCartQty(cropId, delta) {
    const idx = state.cart.findIndex((i) => i.cropId === cropId);
    if (idx === -1) return;
    state.cart[idx].qty += delta;
    if (state.cart[idx].qty <= 0) {
      state.cart.splice(idx, 1);
    }
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
        <div style="border:1px solid var(--emerald-trust-border);background:var(--emerald-trust-bg);padding:1.5rem;border-radius:var(--radius-sharp);margin-top:0.75rem;">
          <span class="lumina-kicker" style="color:var(--emerald-trust);">ORDER CONFIRMED &middot; ${ord.id}</span>
          <h3 class="lumina-heading" style="font-size:1.65rem;margin:0.35rem 0 0.65rem;">Thank you for rescuing ${ord.rescuedKg} kg of local harvest.</h3>
          <p style="font-size:0.88rem;color:var(--ink-secondary);line-height:1.6;margin:0 0 1rem;">
            Your direct farm order for <strong>${ord.buyerName}</strong> has been transmitted to our regional farm hubs with <strong>89% direct farmer payout</strong>.
          </p>
          <div style="border-top:1px solid var(--border-hairline);padding-top:0.85rem;display:flex;flex-direction:column;gap:0.4rem;font-size:0.84rem;">
            <div style="display:flex;justify-content:space-between;"><span>Total Paid:</span><strong>${formatPhp(ord.totalPhp)}</strong></div>
            <div style="display:flex;justify-content:space-between;color:var(--emerald-trust);"><span>Savings vs. Supermarket:</span><strong>${formatPhp(ord.savedPhp)}</strong></div>
            <div style="display:flex;justify-content:space-between;"><span>Methane / CO₂e Diverted:</span><strong>${(ord.rescuedKg * 2.5).toFixed(1)} kg CO₂e</strong></div>
          </div>
          <button type="button" class="ctrl-btn is-active hover-target" id="cart-continue-shopping-btn" style="width:100%;margin-top:1.25rem;">Continue Exploring Harvests</button>
        </div>
      `;
      summaryEl.innerHTML = '';
      const contBtn = document.getElementById('cart-continue-shopping-btn');
      if (contBtn) {
        contBtn.addEventListener('click', () => {
          ui.checkoutSuccessOrder = null;
          closeCartDrawer();
          renderCart();
        });
      }
      return;
    }

    if (state.cart.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:3rem 1rem;">
          <span class="lumina-kicker">HARVEST BASKET EMPTY</span>
          <p class="lumina-epigraph" style="font-size:1.15rem;margin:0.5rem 0 1.25rem;">Select AI-verified imperfect produce from the Marketplace to begin rescuing local crops.</p>
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
              <div style="font-family:var(--font-serif);font-size:1.1rem;font-weight:500;color:var(--ink-primary);">${crop.title}</div>
              <div style="font-size:0.75rem;color:var(--ink-secondary);">${formatPhp(pricing.price)} ${pricing.unit} &middot; ${lineKg} kg</div>
              <div style="font-size:0.72rem;color:var(--emerald-trust);">Save ${formatPhp(lineMarket - lineTotal)}</div>
            </div>
            <div class="uf-qty-stepper">
              <button type="button" class="uf-qty-btn" data-cart-dec="${crop.id}" aria-label="Decrease ${crop.title}">&minus;</button>
              <span style="padding:0 0.55rem;font-family:var(--font-display);font-size:0.52rem;">${entry.qty}</span>
              <button type="button" class="uf-qty-btn" data-cart-inc="${crop.id}" aria-label="Increase ${crop.title}">+</button>
            </div>
          </div>
        `;
      })
      .join('');

    const totalSavings = marketTotal - subtotal;

    summaryEl.innerHTML = `
      <div style="border-top:1px solid var(--border-subtle);padding-top:1.1rem;display:flex;flex-direction:column;gap:0.85rem;">
        <div style="display:flex;flex-direction:column;gap:0.35rem;font-size:0.86rem;">
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>Traditional Retail / Wholesale Benchmark</span>
            <span style="text-decoration:line-through;">${formatPhp(marketTotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--emerald-trust);font-weight:600;">
            <span>Total Rescued Savings (${Math.round((totalSavings / marketTotal) * 100)}% OFF)</span>
            <span>&minus;${formatPhp(totalSavings)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;color:var(--ink-secondary);">
            <span>Food Waste Diverted from Landfill</span>
            <strong>${totalRescuedKg} kg</strong>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:0.5rem;border-top:1px solid var(--border-hairline);">
            <span class="lumina-kicker">DIRECT FARM SUBTOTAL (${state.role.toUpperCase()})</span>
            <span style="font-family:var(--font-serif);font-size:1.75rem;font-weight:600;">${formatPhp(subtotal)}</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.55rem;">
          <input type="text" id="checkout-buyer-name" class="uf-input" placeholder="${state.role === 'b2b' ? 'Business / Commissary Name' : 'Your Name (Demo)'}" value="${state.role === 'b2b' ? 'Solstice Kitchen Commissary' : 'Elena Reyes'}" style="font-size:0.8rem;padding:0.55rem 0.75rem;">
          <select id="checkout-fulfillment" class="uf-select" style="font-size:0.8rem;padding:0.55rem 0.75rem;" aria-label="Fulfillment Method">
            <option value="Direct Hub Pickup">Direct Farm Hub Pickup (₱0)</option>
            <option value="Cold-Chain Delivery">Metro Cold-Chain Delivery</option>
          </select>
        </div>

        <button type="button" class="lumina-cta hover-target" id="confirm-mock-order-btn" style="width:100%;justify-content:center;">
          Confirm Rescued Order &middot; ${formatPhp(subtotal)}
        </button>
      </div>
    `;

    listEl.querySelectorAll('[data-cart-dec]').forEach((btn) => {
      btn.addEventListener('click', () => updateCartQty(btn.getAttribute('data-cart-dec'), -1));
    });
    listEl.querySelectorAll('[data-cart-inc]').forEach((btn) => {
      btn.addEventListener('click', () => updateCartQty(btn.getAttribute('data-cart-inc'), 1));
    });

    const confirmBtn = document.getElementById('confirm-mock-order-btn');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const buyerName = (document.getElementById('checkout-buyer-name')?.value || 'Elena Reyes').trim();
        const fulfillment = document.getElementById('checkout-fulfillment')?.value || 'Direct Hub Pickup';
        const firstCrop = state.listings.find((c) => c.id === state.cart[0]?.cropId);

        const orderRecord = {
          id: 'ORD-' + Math.floor(9000 + Math.random() * 900),
          buyerName: `${buyerName} (${state.role === 'b2b' ? 'B2B' : 'B2C'})`,
          buyerType: state.role === 'b2b' ? 'Commercial Buyer (B2B)' : 'Individual Buyer (B2C)',
          cropTitle: firstCrop ? `${firstCrop.title}${state.cart.length > 1 ? ` + ${state.cart.length - 1} more` : ''}` : 'Rescued Produce Lot',
          quantityLabel: `${totalRescuedKg} kg total (${fulfillment})`,
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
        state.userImpact.co2AvoidedKg += Number((totalRescuedKg * 2.5).toFixed(1));
        state.cart = [];
        ui.checkoutSuccessOrder = orderRecord;

        saveState();
        renderImpactTicker();
        renderFarmerDashboard();
        renderPersonalImpact();
        renderCart();

        if (window.LuminaDesign) {
          window.LuminaDesign.playPaperRustle(0.06);
          window.LuminaDesign.showToast(`Order ${orderRecord.id} Confirmed! Rescued ${totalRescuedKg} kg of food.`);
        }
      });
    }
  }

  function openCartDrawer() {
    const backdrop = document.getElementById('cart-sheet-backdrop');
    if (backdrop) {
      backdrop.classList.add('is-open');
      document.body.classList.add('modal-open');
      if (window.LuminaDesign) window.LuminaDesign.playPaperRustle(0.035);
    }
  }

  function closeCartDrawer() {
    const backdrop = document.getElementById('cart-sheet-backdrop');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      document.body.classList.remove('modal-open');
    }
  }

  /* ------------------------------------------------------------------------
     9. INITIALIZATION & EVENT BINDINGS
     ------------------------------------------------------------------------ */
  function initApp() {
    // 1. Initialize Lumina Design System Core
    if (window.LuminaDesign) {
      const activeTheme = window.LuminaDesign.initTheme();
      updateThemeButtonLabel(activeTheme);
      ui.cursorCtrl = window.LuminaDesign.initCursor();
      window.LuminaDesign.initRadialAura('.volume-band, .accordion-strip');
      window.LuminaDesign.initScrollProgress();
      window.LuminaDesign.playCurtain({
        title: 'UGLYFOOD AI.',
        subtitle: 'Archival Harvest Marketplace & Computer Vision Grader',
        holdMs: 740
      });
    }

    // 2. Render dynamic sections
    renderImpactTicker();
    renderMarketplace();
    renderFarmerDashboard();
    renderPersonalImpact();
    renderCart();
    selectScannerPreset('preset-carrots');

    // 3. Role Switcher buttons
    document.querySelectorAll('[data-role-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextRole = btn.getAttribute('data-role-btn');
        setRole(nextRole, { scrollToSection: nextRole === 'farmer' });
      });
    });

    // 4. Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn && window.LuminaDesign) {
      themeBtn.addEventListener('click', () => {
        const next = window.LuminaDesign.toggleTheme();
        updateThemeButtonLabel(next);
        window.LuminaDesign.showToast(next === 'dark' ? 'Gallery Noir Theme Active' : 'Museum Paper Theme Active');
      });
    }

    // 5. Mobile Frame Simulator Toggle (for Desktop Reviewers)
    const mobileFrameBtn = document.getElementById('mobile-frame-toggle-btn');
    if (mobileFrameBtn) {
      mobileFrameBtn.addEventListener('click', () => {
        const isMobileFrame = document.body.classList.toggle('is-mobile-frame-mode');
        mobileFrameBtn.classList.toggle('is-active', isMobileFrame);
        if (window.LuminaDesign) {
          window.LuminaDesign.playPaperRustle(0.04);
          window.LuminaDesign.showToast(
            isMobileFrame ? 'Mobile Viewport Frame Active (430px iOS Liquid Glass Dock)' : 'Full Desktop Canvas Active'
          );
        }
      });
    }

    // 6. Marketplace Filters + Transient Liquid Glass Slider Interaction
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        ui.filters.search = e.target.value;
        renderMarketplace();
      });
    }

    const gradeSelect = document.getElementById('filter-grade');
    if (gradeSelect) {
      gradeSelect.addEventListener('change', (e) => {
        ui.filters.grade = e.target.value;
        renderMarketplace();
      });
    }

    const regionSelect = document.getElementById('filter-region');
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        ui.filters.region = e.target.value;
        renderMarketplace();
      });
    }

    const priceSlider = document.getElementById('filter-max-price');
    if (priceSlider) {
      priceSlider.addEventListener('pointerdown', () => priceSlider.classList.add('is-Interacting'));
      priceSlider.addEventListener('pointerup', () => priceSlider.classList.remove('is-Interacting'));
      priceSlider.addEventListener('input', (e) => {
        ui.filters.maxPrice = Number(e.target.value);
        renderMarketplace();
      });
    }

    document.querySelectorAll('[data-category-pill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.filters.category = btn.getAttribute('data-category-pill');
        document.querySelectorAll('[data-category-pill]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        renderMarketplace();
      });
    });

    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetFilters);

    // 7. AI Scanner Presets, Custom File Upload, Re-Scan & One-Click Publish
    document.querySelectorAll('[data-scanner-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectScannerPreset(btn.getAttribute('data-scanner-preset'));
      });
    });

    const rescanBtn = document.getElementById('trigger-cv-scan-btn');
    if (rescanBtn) rescanBtn.addEventListener('click', runSimulatedCvScan);

    const fileInput = document.getElementById('scanner-file-input');
    const uploadZone = document.getElementById('scanner-upload-zone');
    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', () => fileInput.click());
      uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--accent-warm)';
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

    const publishForm = document.getElementById('scanner-publish-form');
    if (publishForm) publishForm.addEventListener('submit', handlePublishScannedCrop);

    // 8. Cart Drawer & Modal triggers
    document.querySelectorAll('[data-open-cart]').forEach((btn) => {
      btn.addEventListener('click', openCartDrawer);
    });
    const closeCartBtn = document.getElementById('close-cart-btn');
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCartDrawer);

    const cartBackdrop = document.getElementById('cart-sheet-backdrop');
    if (cartBackdrop) {
      cartBackdrop.addEventListener('click', (e) => {
        if (e.target === cartBackdrop) closeCartDrawer();
      });
    }

    const trustBackdrop = document.getElementById('trust-report-modal');
    if (trustBackdrop) {
      trustBackdrop.addEventListener('click', (e) => {
        if (e.target === trustBackdrop) closeProductReportModal();
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeProductReportModal();
        closeCartDrawer();
      }
    });

    // 9. Lumina 5 Share Card Archetypes Switcher & Export
    document.querySelectorAll('[data-share-style-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const style = btn.getAttribute('data-share-style-btn');
        const frame = document.getElementById('impact-share-card');
        if (frame) frame.setAttribute('data-style', style);
        document.querySelectorAll('[data-share-style-btn]').forEach((b) => {
          b.classList.toggle('is-active', b === btn);
        });
        if (window.LuminaDesign) window.LuminaDesign.playPaperRustle(0.035);
      });
    });

    const copyImpactBtn = document.getElementById('copy-impact-card-btn');
    if (copyImpactBtn) {
      copyImpactBtn.addEventListener('click', () => {
        const text = `UGLYFOOD AI · VERIFIED IMPACT LEDGER: Rescued ${state.userImpact.savedKg.toFixed(1)} kg of imperfect local produce, saved ${formatPhp(state.userImpact.savedPhp)}, and prevented ${state.userImpact.co2AvoidedKg.toFixed(1)} kg CO2e landfill emissions.`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        if (window.LuminaDesign) {
          window.LuminaDesign.playPaperRustle(0.045);
          window.LuminaDesign.showToast('Impact Certificate Citation Copied to Clipboard');
        }
      });
    }

    // 10. Floating Mobile Bottom Tab Bar — Auto-Minimize on Scroll Down, Expand on Scroll Up (HIG Rule 6)
    let lastScrollY = window.scrollY;
    const mobileDock = document.getElementById('mobile-liquid-dock');
    window.addEventListener(
      'scroll',
      () => {
        const currentY = window.scrollY;
        if (mobileDock) {
          if (currentY > lastScrollY + 14 && currentY > 180) {
            mobileDock.classList.add('is-minimized');
          } else if (currentY < lastScrollY - 10 || currentY < 100) {
            mobileDock.classList.remove('is-minimized');
          }
        }
        lastScrollY = currentY;
      },
      { passive: true }
    );

    // Mobile tab navigation highlight + semantic search focus
    document.querySelectorAll('[data-mobile-nav]').forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-mobile-nav');
        document.querySelectorAll('[data-mobile-nav]').forEach((t) => t.classList.toggle('is-active', t === tab));
        if (targetId === 'cart') {
          openCartDrawer();
          return;
        }
        const section = document.getElementById(targetId);
        if (section) section.scrollIntoView({ behavior: 'smooth' });
      });
    });

    const semanticSearchBtns = document.querySelectorAll('[data-focus-search]');
    semanticSearchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const marketEl = document.getElementById('marketplace');
        const input = document.getElementById('filter-search');
        if (marketEl) marketEl.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          if (input) input.focus();
        }, 420);
      });
    });
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

  function updateThemeButtonLabel(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Museum Paper Light Mode' : 'Switch to Gallery Noir Dark Mode');
    btn.title = theme === 'dark' ? 'Switch to Museum Paper Light Mode' : 'Switch to Gallery Noir Dark Mode';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
