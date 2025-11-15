document.addEventListener('DOMContentLoaded', () => {
  const cfg = {
    line: { src: "csv/data 2 - fines.csv", x: "START_DATE", y: "Sum(FINES)" },
    bar:  { src: "csv/data 1 - fines.csv",  cat: "METRIC", val: "Sum(FINES)" },
    pie:  { src: "csv/data 3 - fines.csv",  cat: "DETECTION_METHOD", val: "Sum(FINES)" },
    colors: {
      line: "#56e0a0",
      bar:  "#7aa294",
      pie:  ["#6e3b2f", "#8f513e", "#b36b4e", "#cf8a6a", "#e2a88a", "#f0c7ad"]
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
    // Populate years from the line CSV
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

      // Initial full-range render
      renderForRange(earliest, latest);

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
      const apply = () => {
        const a = +selFrom.value, b = +selTo.value;
        if (!Number.isFinite(a) || !Number.isFinite(b)) return;
        if (a > b) return; // invalid range; guards via disabled options
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

      // initialize constrained option lists
      rebuildTo();
      rebuildFrom();

    }).catch(() => { AnalyticsPage.loadThree(cfg); });
  } else {
    AnalyticsPage.loadThree(cfg);
  }
});
