document.addEventListener('DOMContentLoaded', () => {
  // Normalize text and placeholders
  document.title = 'Positive Breath Tests - Analytics';
  const titles = ['Top States - Bar','Total Over Time - Line','Share by State - Pie'];
  document.querySelectorAll('.section-title').forEach((el,i)=>{ if(titles[i]) el.textContent = titles[i]; });
  ['kpiTotal','kpiMax','kpiMin'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='-'; });

  const cfg = {
    line: { src: "csv/data 1 - positive breath test.csv", x: "START_DATE", y: "Sum(COUNT)" },
    bar:  { src: "csv/data 2 - positive breath test.csv",  cat: "JURISDICTION", val: "Sum(COUNT)" },
    pie:  { src: "csv/data 3 - positive breath test.csv",  cat: "JURISDICTION", val: "Mean(Arrest_Rate_Percent)" }
  };

  const selFrom = document.getElementById('yearFrom');
  const selTo   = document.getElementById('yearTo');
  function renderForRange(lo, hi){
    if (lo == null || hi == null) { AnalyticsPage.loadThree(cfg); return; }
    const lineCfg = Object.assign({}, cfg.line, { filterRange: [lo, hi] });
    AnalyticsPage.loadThree({ line: lineCfg, bar: cfg.bar, pie: cfg.pie });
  }

  if (selFrom && selTo) {
    d3.csv(cfg.line.src).then(rows => {
      const years = Array.from(new Set(rows.map(r => {
        const s = String(r[cfg.line.x] || '').trim();
        if (/^\d{4}$/.test(s)) return +s;
        const d = new Date(s); const y = d.getFullYear();
        return Number.isFinite(y) ? y : null;
      }).filter(v => v != null))).sort((a,b)=>a-b);

      const fill = (sel) => { sel.innerHTML=''; years.forEach(y=>{const o=document.createElement('option'); o.value=String(y); o.textContent=String(y); sel.appendChild(o);}); };
      fill(selFrom); fill(selTo);

      const earliest = years[0] ?? null;
      const latest   = years.at(-1) ?? null;
      if (earliest != null) selFrom.value = String(earliest);
      if (latest   != null) selTo.value   = String(latest);

      // Rebuild option lists so users only see valid years
      const fillOptions = (sel, arr) => {
        sel.innerHTML = '';
        arr.forEach(y => { const o=document.createElement('option'); o.value=String(y); o.textContent=String(y); sel.appendChild(o); });
      };
      const rebuildTo = () => {
        const a = +selFrom.value;
        const allowed = years.filter(y => y >= a);
        const prev = +selTo.value;
        fillOptions(selTo, allowed);
        if (!allowed.length) return;
        const next = allowed.includes(prev) ? prev : allowed[allowed.length-1];
        selTo.value = String(next);
      };
      const rebuildFrom = () => {
        const b = +selTo.value;
        const allowed = years.filter(y => y <= b);
        const prev = +selFrom.value;
        fillOptions(selFrom, allowed);
        if (!allowed.length) return;
        const next = allowed.includes(prev) ? prev : allowed[0];
        selFrom.value = String(next);
      };

      // Initial render full range
      renderForRange(earliest, latest);

      const apply = () => {
        const a = +selFrom.value, b = +selTo.value;
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        if (a > b) return; // invalid range; constrained by disabled options
        renderForRange(a,b);
      };
      const btn = document.getElementById('applyRange');
      if (btn) btn.addEventListener('click', apply);
      const reset = document.getElementById('resetRange');
      if (reset) reset.addEventListener('click', () => {
        selFrom.value = String(earliest);
        rebuildTo();
        selTo.value = String(latest);
        rebuildFrom();
        renderForRange(earliest, latest);
      });
      // Only rebuild dropdowns on change; do not re-render until Apply is clicked
      selFrom.addEventListener('change', () => { rebuildTo(); });
      selTo.addEventListener('change',   () => { rebuildFrom(); });

      // initialize constrained lists
      rebuildTo();
      rebuildFrom();
    }).catch(() => AnalyticsPage.loadThree(cfg));
  } else {
    AnalyticsPage.loadThree(cfg);
  }

});
