document.addEventListener('DOMContentLoaded', () => {
  // Normalize text and placeholders
  document.title = 'Alcohol & Drug Tests - Analytics';
  const titles = ['Top States - Bar','Total Over Time - Line','Share by State - Pie'];
  document.querySelectorAll('.section-title').forEach((el,i)=>{ if(titles[i]) el.textContent = titles[i]; });
  ['kpiTotal','kpiMax','kpiMin'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='-'; });

  const cfg = {
    line: { src: "csv/data 1 - alcohol and drug test.csv" },
    bar:  "csv/data 2 - alcohol and drug test.csv",
    pie:  "csv/data 3 - alcohol and drug test.csv",
    colors: {
      line: "#56e0a0",
      bar:  "#7aa294",
      pie:  ["#2f2a5a", "#463f85", "#5f57a8", "#7a70c6", "#9a93db", "#beb8ec"]
    }
  };

  const selFrom = document.getElementById('yearFrom');
  const selTo   = document.getElementById('yearTo');

  function renderForRange(lo, hi){
    if (lo == null || hi == null) { AnalyticsPage.loadThree(cfg); return; }
    const lineCfg = Object.assign({}, cfg.line, { filterRange: [lo, hi] });
    AnalyticsPage.loadThree({ line: lineCfg, bar: cfg.bar, pie: cfg.pie, colors: cfg.colors });
  }

  if (selFrom && selTo) {
    d3.csv(cfg.line.src).then(rows => {
      const guessX = Object.keys(rows[0] || {}).find(c => /(year|date)/i.test(c)) || 'year';
      const years = Array.from(new Set(rows.map(r => {
        const s = String(r[guessX] || '').trim();
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

      // Initial render full range
      renderForRange(earliest, latest);

      const fillOptions = (sel, arr) => { sel.innerHTML=''; arr.forEach(y=>{const o=document.createElement('option'); o.value=String(y); o.textContent=String(y); sel.appendChild(o);}); };
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

      const apply = () => {
        const a = +selFrom.value, b = +selTo.value;
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        if (a > b) return;
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
      selFrom.addEventListener('change', () => { rebuildTo(); /* apply only on button */ });
      selTo.addEventListener('change',   () => { rebuildFrom(); /* apply only on button */ });

      // initialize constrained lists
      rebuildTo();
      rebuildFrom();
    }).catch(() => AnalyticsPage.loadThree(cfg));
  } else {
    AnalyticsPage.loadThree(cfg);
  }
});




