// D3 v7 — 3 charts (line+bar+pie) with explicit column mapping support.
// Usage: AnalyticsPage.loadThree({ line:{src,x,y}, bar:{src,cat,val}, pie:{src,cat,val} })
(function (global) {
  const fmt = d3.format(",");
  const readStyles = () => getComputedStyle(document.documentElement);
  const resolveColors = (overrides = {}) => {
    const styles = readStyles();
    const pie = [];
    for (let i = 1; i <= 12; i++) {
      const val = styles.getPropertyValue(`--chart-pie-${i}`).trim();
      if (val) pie.push(val);
    }
    if (!pie.length) {
      pie.push("#56e0a0", "#d869c6", "#f2c14e", "#6c5b7b", "#45b7d1", "#f67280");
    }
    return {
      bar: overrides.bar || styles.getPropertyValue('--chart-bar').trim() || "#7aa294",
      line: overrides.line || styles.getPropertyValue('--chart-line').trim() || "#56e0a0",
      pie: Array.isArray(overrides.pie) && overrides.pie.length ? overrides.pie : pie
    };
  };

  const cloneVal = (val) => {
    if (Array.isArray(val)) return val.map(cloneVal);
    if (val && typeof val === "object") return { ...val };
    return val;
  };
  let lastArgs = null;
  let currentPalette = null;

  function applyPalette(palette){
    if (!palette) return;
    const t = d3.transition().duration(500);

    const barSVG = d3.select("#barChart");
    if (!barSVG.empty()){
      barSVG.selectAll("rect.bar").transition(t).attr("fill", palette.bar);
    }

    const lineSVG = d3.select("#lineChart");
    if (!lineSVG.empty()){
      const linePaths = lineSVG.selectAll("path.line-path");
      linePaths.transition(t).attr("stroke", palette.line);
      linePaths.each(function(){ this._baseColor = palette.line; });

      const linePoints = lineSVG.selectAll("circle.line-point");
      linePoints.transition(t).attr("fill", palette.line);
      linePoints.each(function(){
        this._originalFill = palette.line;
      });
    }

    const pieSVG = d3.select("#pieChart");
    const pieNode = pieSVG.node();
    if (pieNode && pieNode.__pieLastData && Array.isArray(pieNode.__pieLastData)){
      const labels = pieNode.__pieLastData.map(d=>d[0]);
      const color = d3.scaleOrdinal().domain(labels).range(palette.pie);
      pieSVG.selectAll("path.pie-slice").transition(t).attr("fill", function(d){
        const label = d?.data?.[0] ?? d?.[0];
        const col = color(label);
        this._originalFill = col;
        return col;
      });
      const legend = d3.select(pieNode.parentNode).selectAll(".pie-legend .item");
      legend.select(".swatch").transition(t).style("background", d => color(d));
    }
  }

  // ---- helpers ----
  const aliasState = (s) => {
    if (!s) return "";
    const t = String(s).trim();
    const m = { nsw:"New South Wales", vic:"Victoria", qld:"Queensland", sa:"South Australia",
      wa:"Western Australia", tas:"Tasmania", nt:"Northern Territory", act:"Australian Capital Territory" };
    return m[t.toLowerCase()] || t;
  };
  const toNum = (v) => {
    if (v == null) return NaN;
    const s = String(v).replace(/,/g,"").trim();
    if (!s || /^n\/?a$/i.test(s)) return NaN;
    const n = +s; return Number.isFinite(n) ? n : NaN;
  };
  const nkey = (s) => String(s||"").toLowerCase().replace(/[^a-z0-9]+/g,"");
  function pickKey(cols, prefer = [], fallbackRegex) {
    for (const want of prefer) { const hit = cols.find(c => nkey(c) === nkey(want)); if (hit) return hit; }
    if (fallbackRegex) { const re = new RegExp(fallbackRegex,"i"); const hit = cols.find(c => re.test(c)); if (hit) return hit; }
    return cols[0] || null;
  }
  function mostNumericColumn(rows, ignore = new Set()) {
    if (!rows.length) return null;
    const cols = Object.keys(rows[0]).filter(c=>!ignore.has(c));
    let best=null, score=-1;
    for (const c of cols) {
      const s = rows.reduce((a,r)=>a+(Number.isFinite(toNum(r[c]))?1:0),0);
      if (s>score){best=c;score=s;}
    }
    return best;
  }

  // tooltip
  const tooltip = (() => {
    let el = document.querySelector(".viz-tooltip");
    if (!el){ el=document.createElement("div"); el.className="viz-tooltip"; el.setAttribute("aria-hidden","true"); document.body.appendChild(el); }
    return d3.select(el);
  })();
  const showTip=(html,e)=>tooltip.html(html).style("left",e.clientX+14+"px").style("top",e.clientY+14+"px").attr("aria-hidden","false");
  const hideTip=()=>tooltip.attr("aria-hidden","true");

  // ---- BAR ----
  function renderBar(svg, data, color) {
    const g = svg.selectAll("g.main").data([null]).join("g").attr("class","main").attr("transform","translate(60,20)");
    const width = svg.node().clientWidth || 720, height = (+svg.attr("height")||420) - 60, plotW = width - 100;

    const arr = [...data].sort((a,b)=>d3.descending(a[1],b[1]));
    const x = d3.scaleBand().domain(arr.map(d=>d[0])).range([0,plotW]).padding(0.18);
    const y = d3.scaleLinear().domain([0,d3.max(arr,d=>d[1])||1]).nice().range([height,0]);

    g.selectAll("*").remove();
    g.append("g").call(d3.axisLeft(y).ticks(6).tickSize(-plotW).tickFormat("")).selectAll("line").attr("stroke","rgba(255,255,255,.06)");
    g.select(".domain")?.remove();
    g.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x))
      .selectAll("text").attr("transform", null).style("text-anchor","middle");
    g.append("g").call(d3.axisLeft(y).ticks(6));

    g.selectAll("rect.bar").data(arr, d=>d[0]).join(
      enter=>enter.append("rect").attr("class","bar")
        .attr("x",d=>x(d[0])).attr("y",height).attr("width",x.bandwidth()).attr("height",0)
        .attr("rx",7).attr("ry",7).attr("fill",color)
        .attr("opacity",1)
        .attr("stroke","none")
        .attr("stroke-width",2)
        .on("mouseenter",function(ev,d){
          d3.select(this).transition().duration(200)
            .attr("opacity",0.8)
            .attr("stroke","rgba(255,255,255,0.5)")
            .attr("stroke-width",2);
        })
        .on("mousemove",(ev,d)=>showTip(`<b>${d[0]}</b><br>${fmt(d[1])}`,ev))
        .on("mouseleave",function(ev,d){
          d3.select(this).transition().duration(200)
            .attr("opacity",1)
            .attr("stroke","none")
            .attr("stroke-width",0);
          hideTip();
        })
        .call(e=>e.transition().duration(800).attr("y",d=>y(d[1])).attr("height",d=>height-y(d[1]))),
      update=>update.call(u=>u.transition().duration(600)
        .attr("x",d=>x(d[0])).attr("y",d=>y(d[1])).attr("width",x.bandwidth()).attr("height",d=>height-y(d[1])))
    );

    g.selectAll("text.val").data(arr, d=>d[0]).join(
      enter=>enter.append("text").attr("class","val").attr("text-anchor","middle").attr("opacity",0)
        .attr("fill","white")
        .style("font-weight","600")
        .attr("x",d=>x(d[0])+x.bandwidth()/2).attr("y",d=>y(d[1])-6).text(d=>fmt(d[1]))
        .call(e=>e.transition().delay(400).duration(500).attr("opacity",.9)),
      update=>update.call(u=>u.transition().duration(600)
        .attr("x",d=>x(d[0])+x.bandwidth()/2).attr("y",d=>y(d[1])-6).text(d=>fmt(d[1]))
        .attr("fill","white")
        .style("font-weight","600"))
    );
  }

  // ---- LINE (robust parse + aggregate by YEAR) ----
  function renderLine(svg, rows, xKey, yKey, color) {
    const g = svg.selectAll("g.main").data([null]).join("g").attr("class","main").attr("transform","translate(50,20)");
    const width = svg.node().clientWidth || 720, height = (+svg.attr("height")||420) - 60, plotW = width - 90;

    const pYear=d3.timeParse("%Y"), pYM=d3.timeParse("%Y-%m"), pYMD=d3.timeParse("%Y-%m-%d"),
          pDMY=d3.timeParse("%d/%m/%Y"), pMDY=d3.timeParse("%m/%d/%Y");
    const parseAny = (v)=>{ if(v==null) return null; const s=String(v).trim(); if(/^\d{4}$/.test(s)) return pYear(s);
      return pYMD(s)||pYM(s)||pDMY(s)||pMDY(s)||(isFinite(Date.parse(s))?new Date(s):null); };

    const catKey = Object.keys(rows[0] || {}).find(c => /^(metric|category|type)$/i.test(c)) || null;
    const detailed = rows.map(r=>{
      let y = null;
      if (/year/i.test(xKey)) { const yy = toNum(r[xKey]); if (Number.isFinite(yy)) y = +yy; }
      else { const d = parseAny(r[xKey]); if (d && !isNaN(d)) y = d.getFullYear(); }
      const val = toNum(r[yKey]);
      const cat = catKey ? String(r[catKey]).trim() : "";
      return [y, val, cat];
    }).filter(d=>Number.isFinite(d[0]) && Number.isFinite(d[1]));

    // De-duplicate identical [year, value, category] rows before aggregating
    const seen = new Set();
    const dedup = detailed.filter(d=>{ const k = `${d[0]}|${d[2]}|${d[1]}`; if (seen.has(k)) return false; seen.add(k); return true; });

    const byYear = d3.rollup(dedup, v=>d3.sum(v,d=>d[1]), d=>d[0]);
    const data = Array.from(byYear, ([yy,val])=>[yy,val]).sort((a,b)=>d3.ascending(a[0],b[0]));
    if (!data.length){ g.selectAll("*").remove(); return; }

    const x = d3.scaleLinear().domain(d3.extent(data,d=>d[0])).range([0,plotW]).nice();
    const y = d3.scaleLinear().domain([0,d3.max(data,d=>d[1])||1]).nice().range([height,0]);

    g.selectAll("*").remove();
    g.append("g").call(d3.axisLeft(y).ticks(6).tickSize(-plotW).tickFormat("")).selectAll("line").attr("stroke","rgba(255,255,255,.06)");
    g.select(".domain")?.remove();
    g.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x).ticks(Math.min(10,data.length)).tickFormat(d3.format("d")));
    g.append("g").call(d3.axisLeft(y).ticks(6));

    const line = d3.line().x(d=>x(d[0])).y(d=>y(d[1]));
    const path = g.append("path").datum(data).attr("class","line-path")
      .attr("fill","none")
      .attr("stroke",color)
      .attr("stroke-width",2)
      .attr("d",line)
      .style("cursor","pointer")
      .style("filter","none");
    path.each(function(){ this._baseColor = color; });
    const L = path.node().getTotalLength();
    path.attr("stroke-dasharray",`${L} ${L}`).attr("stroke-dashoffset",L).transition().duration(800).attr("stroke-dashoffset",0);

    // Add hover effect to line path
    path.on("mouseenter",function(){
      const base = this._baseColor || color;
      const rgb = d3.rgb(base);
      const brightened = rgb.brighter(0.4);
      d3.select(this).transition().duration(250)
        .attr("stroke",brightened)
        .attr("stroke-width",3)
        .style("filter","drop-shadow(0 0 8px rgba(86,224,160,0.5))");
    })
    .on("mouseleave",function(){
      const base = this._baseColor || color;
      d3.select(this).transition().duration(250)
        .attr("stroke",base)
        .attr("stroke-width",2)
        .style("filter","none");
    });

    g.selectAll("circle").data(data).join("circle")
      .attr("class","line-point")
      .attr("cx",d=>x(d[0]))
      .attr("cy",d=>y(d[1]))
      .attr("r",3.8)
      .attr("fill",color)
      .attr("stroke","none")
      .attr("stroke-width",0)
      .attr("opacity",1)
      .style("cursor","pointer")
      .style("filter","none")
      .each(function(d){
        this._originalFill = color;
        this._originalRadius = 3.8;
      })
      .on("mouseenter",function(ev,d){
        const circle = d3.select(this);
        const originalFill = this._originalFill || color;
        const originalRadius = this._originalRadius || 3.8;
        const rgb = d3.rgb(originalFill);
        const brightened = rgb.brighter(0.6);
        
        // Expand, brighten, and add glow to circle on hover
        circle.transition().duration(250)
          .attr("r",originalRadius * 1.8)
          .attr("fill",brightened)
          .attr("stroke","rgba(255,255,255,0.9)")
          .attr("stroke-width",2.5)
          .attr("opacity",1)
          .style("filter","drop-shadow(0 0 10px rgba(255,255,255,0.5))");
        
        // Also brighten the line on hover
        const baseLine = (path.node() && path.node()._baseColor) || color;
        const lineRgb = d3.rgb(baseLine);
        const lineBrightened = lineRgb.brighter(0.3);
        path.transition().duration(250)
          .attr("stroke",lineBrightened)
          .attr("stroke-width",2.5);
      })
      .on("mousemove",(ev,d)=>showTip(`<b>${d[0]}</b><br>${fmt(d[1])}`,ev))
      .on("mouseleave",function(ev,d){
        const circle = d3.select(this);
        const originalFill = this._originalFill || color;
        const originalRadius = this._originalRadius || 3.8;
        
        // Restore circle appearance
        circle.transition().duration(250)
          .attr("r",originalRadius)
          .attr("fill",originalFill)
          .attr("stroke","none")
          .attr("stroke-width",0)
          .attr("opacity",1)
          .style("filter","none");
        
        // Restore line appearance
        const baseLine = (path.node() && path.node()._baseColor) || color;
        path.transition().duration(250)
          .attr("stroke",baseLine)
          .attr("stroke-width",2);
        
        hideTip();
      });
  }

  // ---- PIE ----
  function renderPie(svg, data, scheme) {
    const node = svg.node();
    const g = svg.selectAll("g.main").data([null]).join("g").attr("class","main");
    const width = node.clientWidth || 520, height = (+svg.attr("height")||420), r = Math.min(width,height)/2 - 20;
    g.attr("transform",`translate(${width/2},${height/2})`);

    // Persist hidden categories across re-renders
    const hidden = node.__pieHidden || new Set();
    node.__pieHidden = hidden;
    node.__pieLastData = data;

    const allLabels = data.map(d=>d[0]);
    const color = d3.scaleOrdinal().domain(allLabels).range(scheme || d3.schemeTableau10);

    const pie = d3.pie().value(d=>d[1]).sort(null);
    const arc = d3.arc().innerRadius(0).outerRadius(r);

    const filtered = data.filter(d => !hidden.has(d[0]) && d[1] > 0);

    const paths = g.selectAll("path").data(pie(filtered), d=>d.data[0]).join(
      enter=>enter.append("path").attr("class","pie-slice")
        .attr("fill",d=>color(d.data[0]))
        .attr("stroke","none")
        .attr("stroke-width",0)
        .attr("opacity",1)
        .style("cursor","pointer")
        .style("filter","none")
        .each(function(d){
          this._current=d;
          this._originalFill=color(d.data[0]);
        })
        .on("mouseenter",function(ev,d){
          const pathEl = d3.select(this);
          const originalFill = this._originalFill || color(d.data[0]);
          const rgb = d3.rgb(originalFill);
          const brightened = rgb.brighter(0.5);
          
          // Store original arc for restoration
          this._hovered = true;
          
          // Expand and brighten the slice on hover
          pathEl.transition().duration(250)
            .attrTween("d", function() {
              const current = this._current;
              const target = {
                startAngle: current.startAngle,
                endAngle: current.endAngle,
                padAngle: current.padAngle || 0,
                data: current.data,
                index: current.index,
                value: current.value
              };
              const interpolate = d3.interpolate(
                { outerRadius: r },
                { outerRadius: r + 8 }
              );
              return function(t) {
                const expandedArc = d3.arc()
                  .innerRadius(0)
                  .outerRadius(interpolate(t).outerRadius);
                return expandedArc(target);
              };
            })
            .attr("fill", brightened)
            .attr("stroke","rgba(255,255,255,0.9)")
            .attr("stroke-width",2.5)
            .attr("opacity",1)
            .style("filter","drop-shadow(0 0 12px rgba(255,255,255,0.4))");
        })
        .on("mousemove",(ev,d)=>showTip(`<b>${d.data[0]}</b><br>${fmt(d.value)}`,ev))
        .on("mouseleave",function(ev,d){
          const pathEl = d3.select(this);
          const originalFill = this._originalFill || color(d.data[0]);
          
          this._hovered = false;
          
          // Restore original arc size and appearance
          pathEl.transition().duration(250)
            .attrTween("d", function() {
              const current = this._current;
              const target = {
                startAngle: current.startAngle,
                endAngle: current.endAngle,
                padAngle: current.padAngle || 0,
                data: current.data,
                index: current.index,
                value: current.value
              };
              const interpolate = d3.interpolate(
                { outerRadius: r + 8 },
                { outerRadius: r }
              );
              return function(t) {
                const restoredArc = d3.arc()
                  .innerRadius(0)
                  .outerRadius(interpolate(t).outerRadius);
                return restoredArc(target);
              };
            })
            .attr("fill", originalFill)
            .attr("stroke","none")
            .attr("stroke-width",0)
            .attr("opacity",1)
            .style("filter","none");
          
          hideTip();
        })
        .call(e=>e.transition().duration(700).attrTween("d",d=>{const i=d3.interpolate({startAngle:d.startAngle,endAngle:d.startAngle},d);return t=>arc(i(t));})),
      update=>update.call(u=>u
        .attr("fill",d=>color(d.data[0]))
        .each(function(d){ this._originalFill = color(d.data[0]); })
        .transition().duration(600).attrTween("d",function(d){const i=d3.interpolate(this._current,d);this._current=i(1);return t=>arc(i(t));})),
      exit=>exit.call(x=>x.transition().duration(400).attrTween("d",function(d){const i=d3.interpolate(this._current,{startAngle:d.endAngle,endAngle:d.endAngle});return t=>arc(i(t));}).remove())
    );

    paths.each(function(d){
      this._originalFill = color(d.data[0]);
    }).attr("fill",d=>color(d.data[0]));

    // Legend (below the pie, clickable to toggle)
    const wrap = d3.select(node.parentNode);
    const legend = wrap.selectAll(".pie-legend").data([null]).join("div").attr("class","pie-legend");
    const items = legend.selectAll("button.item").data(allLabels, d=>d);
    const itemsEnter = items.enter().append("button").attr("type","button").attr("class","item");
    itemsEnter.append("span").attr("class","swatch").style("background", d=>color(d));
    itemsEnter.append("span").attr("class","label").text(d=>d);
    const itemsAll = itemsEnter.merge(items);
    itemsAll.classed("off", d=>hidden.has(d));
    itemsAll.select(".swatch").style("background", d=>color(d));
    itemsAll.select(".label").text(d=>d);
    itemsAll.on("click", (ev, d) => {
      if (hidden.has(d)) hidden.delete(d); else hidden.add(d);
      svg.node().__pieHidden = hidden;
      renderPie(svg, svg.node().__pieLastData, scheme);
    });
    items.exit().remove();

    // Note: Reset button is provided in the controls row next to Top slices
  }

  // ---- main loader with explicit mapping ----
  function refreshPaletteFromTheme(){
    if (!lastArgs) return;
    const palette = resolveColors(lastArgs.colors || {});
    currentPalette = palette;
    applyPalette(palette);
  }

  async function loadThree(args) {
    const { line, bar, pie, colors = {} } = args;
    lastArgs = {
      line: cloneVal(line),
      bar: cloneVal(bar),
      pie: cloneVal(pie),
      colors: cloneVal(colors)
    };

    const palette = resolveColors(colors);
    const barSVG=d3.select("#barChart"), lineSVG=d3.select("#lineChart"), pieSVG=d3.select("#pieChart");
    const kpiTotal=document.getElementById("kpiTotal"), kpiMax=document.getElementById("kpiMax"), kpiMin=document.getElementById("kpiMin");
    const tbody=d3.select("#tbl tbody");

    try {
      // Ensure line controls (year range) sit below the line chart, not inside it (non-fines pages)
      try {
        const lineEl = lineSVG.node();
        if (lineEl && lineEl.parentElement) {
          const chartBox = lineEl.parentElement;
          const innerControls = chartBox.querySelector(':scope > .controls');
          if (innerControls && chartBox.parentElement) {
            chartBox.parentElement.insertBefore(innerControls, chartBox.nextSibling);
            innerControls.style.margin = '12px 0 18px';
          }
        }
      } catch(_) {}
      // BAR
      const b = await d3.csv(bar.src || bar);
      const bcols = Object.keys(b[0] || {});
      // Preferred category for fines page: METRIC; else fallback to prior detection
      let cat = bar.cat || bcols.find(c => /^METRIC$/i.test(c)) || pickKey(bcols, ["JURISDICTION","Jurisdiction","state","State","Drug_Type","Drug Type"], "(jurisdiction|state|drug[_ ]?type)");
      const val = bar.val || pickKey(bcols, ["Sum(COUNT)","total_tests","total tests","Sum(Positive_Test_Count)","Sum(FINES)","Sum(ARRESTS)","SUM (CHARGES)"], "(sum\\(|total)") || mostNumericColumn(b,new Set([cat]));

      // Fines-specific controls exist only on fines page; otherwise keep generic behaviour
      const hasFinesControls = !!(document.getElementById('applyMetrics') || document.getElementById('barMetric') || document.getElementById('barCompareCount'));

      let barAll;
      if (!hasFinesControls) {
        // Generic bar data for other pages
        barAll = b.map(r=>[aliasState(r[cat]), toNum(r[val])]).filter(d=>d[0] && Number.isFinite(d[1]));
      renderBar(barSVG, barAll, palette.bar);
      } else {
        // Precompute totals and unique metrics (fines)
        barAll = b.map(r=>{
          const alias = aliasState(r[cat]);
          const fallback = r[cat] == null ? '' : String(r[cat]).trim();
          return [(alias && alias.trim()) || fallback, toNum(r[val])];
        }).filter(d=>d[0] && Number.isFinite(d[1]));
        const metrics = Array.from(new Set(barAll.map(d=>d[0]))).sort();

        // Controls: one multi-select for metrics + compare count
        const selCount = document.getElementById('barCompareCount');
        const selMet = document.getElementById('barMetric');
        const resetMode = selCount?.dataset.resetMode || 'default';

        // Top order by value (for defaults)
        const topOrder = [...barAll].sort((a,b)=>d3.descending(a[1],b[1])).map(d=>d[0]);

        const initBarFilters = () => {
          const shortLabel = (s) => {
            const map = { mobile_phone_use:'Mobile Phone', non_wearing_seatbelts:'Seatbelts', speed_fines:'Speed Fines', unlicensed_driving:'Unlicensed' };
            if (!s) return '';
            const key = String(s).trim();
            if (map[key] != null) return map[key];
            return key.replace(/[_\s]+/g,' ').replace(/\b(And|Of|The|In|On|For)\b/gi, m=>m.toLowerCase()).replace(/(^|\s)\w/g, m=>m.toUpperCase()).trim();
          };
          if (selMet && !selMet.dataset.ready) {
            selMet.innerHTML = '';
            metrics.forEach(m => { const o=document.createElement('option'); o.value=m; o.textContent=shortLabel(m); selMet.appendChild(o); });
            selMet.dataset.ready = '1';
            // Enhance to custom multi-select dropdown
            try { enhanceMultiSelectDown('barMetric', { maxProvider: () => (parseInt(selCount?.value||'1',10)||1) }); } catch(e){}
          }
          if (selCount && !selCount.dataset.ready) {
            selCount.innerHTML = '';
            const max = Math.max(1, Math.min(10, metrics.length));
            for (let i=1;i<=max;i++){ const o=document.createElement('option'); o.value=String(i); o.textContent=String(i); selCount.appendChild(o); }
            const initialCount = Math.min(5, max);
            const resetCount = resetMode === 'all' ? max : initialCount;
            selCount.value = String(initialCount);
            selCount.dataset.defaultValue = String(resetCount);
            selCount.dataset.ready = '1';
          }
          // Default selection = top N
          const n = selCount ? (parseInt(selCount.value,10)||1) : 1;
          if (selMet) {
            const want = new Set(topOrder.slice(0,n));
            Array.from(selMet.options).forEach(o => { o.selected = want.has(o.value); });
            selMet.dispatchEvent(new Event('change', { bubbles:true }));
          }
        };

        const getSelected = () => selMet ? Array.from(selMet.options).filter(o=>o.selected).map(o=>o.value) : [];
        const clampSelection = () => {
          if (!selMet || !selCount) return;
          const max = parseInt(selCount.value,10) || 1;
          const sel = Array.from(selMet.options).filter(o=>o.selected);
          if (sel.length > max) sel.slice(max).forEach(o => { o.selected = false; });
        };

        const updateBar = () => {
          const max = selCount ? (parseInt(selCount.value,10)||1) : 1;
          let chosen = getSelected();
          if (!chosen.length) chosen = topOrder.slice(0,max);
          else if (chosen.length > max) chosen = chosen.slice(0,max);
          const data = barAll.filter(d => chosen.includes(d[0]));
          renderBar(barSVG, data, palette.bar);
        };

        initBarFilters();
        // Do not auto-apply on change; wait for Apply Metrics
        if (selMet) selMet.addEventListener('change', () => { clampSelection(); /* wait for apply */ });
        if (selCount) selCount.addEventListener('change', () => { clampSelection();
          // if nothing remains selected, reapply top-N defaults
          if (selMet && getSelected().length === 0) {
            const n = parseInt(selCount.value,10)||1;
            const want = new Set(topOrder.slice(0,n));
            Array.from(selMet.options).forEach(o => { o.selected = want.has(o.value); });
          }
          // Trigger UI refresh for custom multi-select (chips)
          if (selMet) selMet.dispatchEvent(new Event('change', { bubbles:true }));
        });

        // Apply/Reset buttons for metrics
        const btnApply = document.getElementById('applyMetrics');
        if (btnApply) btnApply.addEventListener('click', () => { updateBar(); });
        const btnResetCharts = document.getElementById('resetCharts');
        if (btnResetCharts) btnResetCharts.addEventListener('click', () => {
          // Reset to comparing top 4 metrics by default
          const targetN = Math.min(selCount ? (parseInt(selCount.dataset.defaultValue,10) || Math.min(4, metrics.length)) : Math.min(4, metrics.length), metrics.length);
          if (selCount) {
            selCount.value = String(targetN);
            selCount.dispatchEvent(new Event('change', { bubbles:true }));
          }
          if (selMet){
            const want = new Set(topOrder.slice(0, targetN));
            Array.from(selMet.options).forEach(o => { o.selected = want.has(o.value); });
            // Trigger UI refresh for custom multi-select (chips)
            selMet.dispatchEvent(new Event('change', { bubbles:true }));
          }
          updateBar();
          // Also reset year range if control present
          const resetBtn = document.getElementById('resetRange');
          if (resetBtn) resetBtn.click();
          // Reset pie top-N to default 6 if present
          const pieTop = document.getElementById('pieTopN');
          if (pieTop) {
            // Clear legend hidden state first
            const pieSvgEl = document.getElementById('pieChart');
            if (pieSvgEl && pieSvgEl.__pieHidden) pieSvgEl.__pieHidden.clear();
            pieTop.value = '6';
            pieTop.dispatchEvent(new Event('change', { bubbles:true }));
          }
          // No separate pie year filter; nothing else to reset here
        });

        // Initial render with default top-N
        updateBar();
      }

      // KPIs/table
      const sorted=[...barAll].sort((a,b)=>d3.descending(a[1],b[1]));
      const total=d3.sum(sorted,d=>d[1]); const mx=sorted[0]||["—",0]; const mn=sorted.filter(d=>d[1]>0).at(-1)||["—",0];
      if (kpiTotal) kpiTotal.textContent = fmt(total||0);
      if (kpiMax)   kpiMax.textContent   = `${mx[0]} — ${fmt(mx[1]||0)}`;
      if (kpiMin)   kpiMin.textContent   = (mn[0]==="—"?"—":`${mn[0]} — ${fmt(mn[1]||0)}`);
      // normalize KPI separators to ASCII dash
      if (kpiMax) kpiMax.textContent = `${mx[0]} - ${fmt(mx[1]||0)}`;
      if (kpiMin) kpiMin.textContent = (mn[0] === "-" ? "-" : `${mn[0]} - ${fmt(mn[1]||0)}`);
      if (!tbody.empty()) {
        tbody.selectAll("tr").data(sorted, d=>d[0]).join(
          e=>{const tr=e.append("tr"); tr.append("td").text(d=>d[0]); tr.append("td").text(d=>fmt(d[1]||0));},
          u=>{u.select("td:nth-child(1)").text(d=>d[0]); u.select("td:nth-child(2)").text(d=>fmt(d[1]||0));}
        );
      }

      // LINE
      const l = await d3.csv(line.src || line);
      const lcols = Object.keys(l[0] || {});
      const x = line.x || pickKey(lcols, ["START_DATE","Year","year","DATE","date"], "(year|date)");
      const y = line.y || pickKey(lcols, ["Sum(COUNT)","Sum(Positive_Test_Count)","total_tests","total tests","Sum(Drug_Value)"], "(sum\\(|total)") || mostNumericColumn(l,new Set([x]));
      let lrows = l;
      const pickYear = (val)=>{
        if (val == null) return NaN;
        const s = String(val).trim();
        if (/^\d{4}$/.test(s)) return +s;
        const d = new Date(s);
        const yy = d.getFullYear();
        return Number.isFinite(yy) ? yy : NaN;
      };
      if (line && Array.isArray(line.filterRange) && line.filterRange.length === 2) {
        const a = +line.filterRange[0];
        const b = +line.filterRange[1];
        const lo = Math.min(a,b), hi = Math.max(a,b);
        lrows = l.filter(r => {
          const yy = /year/i.test(x) ? toNum(r[x]) : pickYear(r[x]);
          return Number.isFinite(yy) && yy >= lo && yy <= hi;
        });
      } else if (line && line.filterYear != null) {
        const want = +line.filterYear;
        lrows = l.filter(r => {
          const yy = /year/i.test(x) ? toNum(r[x]) : pickYear(r[x]);
          return Number.isFinite(yy) && yy === want;
        });
      }
      renderLine(lineSVG, lrows, x, y, palette.line);

      
      

      // PIE with Top-N + 'Other' (independent of line)
      const p = await d3.csv(pie.src || pie);
      const pcols = Object.keys(p[0] || {});
      const pc = pie.cat || pickKey(pcols, ["DETECTION_METHOD","Detection_Method","Detection Method","Drug_Type","Drug Type","JURISDICTION","Jurisdiction","state","State"], "(detection|drug[_ ]?type|jurisdiction|state)");
      const pv = pie.val || pickKey(pcols, ["Sum(FINES)","Mean(Arrest_Rate_Percent)","Sum(Drug_Value)","total_tests","total tests","Sum(Positive_Test_Count)"], "(sum\\(|mean\\(|total)") || mostNumericColumn(p,new Set([pc]));

      const selTop = document.getElementById('pieTopN');
      const getTopN = () => Math.max(1, Math.min(10, parseInt(selTop?.value||'6',10) || 6));

      const pieScheme = palette.pie;

      const buildPieData = () => {
        // Aggregate whole dataset by category
        const totals = d3.rollup(p, v => d3.sum(v, r => toNum(r[pv])), r => String(r[pc]).trim());
        const arr = Array.from(totals, ([k,v]) => [k, v]).filter(d=>d[0] && Number.isFinite(d[1]));
        arr.sort((a,b)=>d3.descending(a[1], b[1]));
        const n = getTopN();
        if (arr.length <= n) return arr;
        const top = arr.slice(0,n);
        const other = d3.sum(arr.slice(n), d=>d[1]);
        if (other > 0) top.push(["Other", other]);
        return top;
      };

      const updatePie = () => {
        const data = buildPieData();
        renderPie(pieSVG, data, pieScheme);
      };

      if (selTop && !selTop.dataset.ready) {
        selTop.dataset.ready = '1';
        selTop.addEventListener('change', updatePie);
      }
      const btnResetPie = document.getElementById('resetPie');
      if (btnResetPie && !btnResetPie.dataset.ready) {
        btnResetPie.dataset.ready = '1';
        btnResetPie.addEventListener('click', () => {
          const pieSvgEl = document.getElementById('pieChart');
          if (pieSvgEl && pieSvgEl.__pieHidden) pieSvgEl.__pieHidden.clear();
          if (selTop) {
            selTop.value = '6';
            selTop.dispatchEvent(new Event('change', { bubbles:true }));
          } else {
            updatePie();
          }
        });
      }
      // no separate year control for pie

      updatePie();

    } catch (err) {
      console.error("Error loading analytics CSVs:", err);
    }
    currentPalette = palette;
  }

  global.AnalyticsPage = {
    loadThree,
    refreshPalette: refreshPaletteFromTheme
  };
  global.addEventListener?.('colorSchemeChanged', refreshPaletteFromTheme);

  // ======== Enhance selects to always open downward ========
  // Wraps #yearFrom and #yearTo with a custom menu that opens below the control.
  function closeAllSelectDown(except){
    document.querySelectorAll('.select-down.open, .multi-down.open').forEach(w => {
      if (except && w === except) return;
      // Keep metrics multi-select open until it meets compare limit
      if (w.classList.contains('multi-down')) {
        const curr = parseInt(w.dataset.sel || '0', 10);
        const max  = parseInt(w.dataset.max || '0', 10);
        if (Number.isFinite(curr) && Number.isFinite(max) && curr < max) {
          return; // do not close yet
        }
      }
      w.classList.remove('open');
      const b = w.querySelector('.select-button');
      if (b) b.setAttribute('aria-expanded','false');
      const mb = w.querySelector('.ms-button');
      if (mb) mb.setAttribute('aria-expanded','false');
    });
  }

  function enhanceSelectDown(id){
    const sel = document.getElementById(id);
    if (!sel || sel.multiple || sel.dataset.enhanced === '1') return;
    // Only enhance visible selects (skip hidden top placeholders)
    const style = getComputedStyle(sel);
    if (style.display === 'none' || style.visibility === 'hidden') return;

    sel.dataset.enhanced = '1';
    const wrap = document.createElement('div');
    wrap.className = 'select-down';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'select-button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    const menu = document.createElement('ul');
    menu.className = 'menu';
    menu.setAttribute('role','listbox');

    // Insert wrapper and move select inside (kept for state/compat)
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('native-select');
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    const setLabel = () => {
      const opt = sel.selectedOptions && sel.selectedOptions[0];
      btn.textContent = opt ? opt.textContent : (sel.value || 'Select');
    };

    const rebuild = () => {
      // Build items from current options
      menu.innerHTML = '';
      const opts = Array.from(sel.options || []);
      opts.forEach(o => {
        const li = document.createElement('li');
        li.textContent = o.textContent;
        li.setAttribute('role','option');
        li.dataset.value = o.value;
        if (o.selected) li.setAttribute('aria-selected','true');
        li.addEventListener('click', () => {
          sel.value = o.value;
          opts.forEach(p => p.selected = (p === o));
          // reflect selection
          Array.from(menu.children).forEach(c => c.removeAttribute('aria-selected'));
          li.setAttribute('aria-selected','true');
          setLabel();
          // bubble change for existing listeners
          sel.dispatchEvent(new Event('change', { bubbles:true }));
          wrap.classList.remove('open');
          btn.setAttribute('aria-expanded','false');
        });
        menu.appendChild(li);
      });
      setLabel();
    };

    // Keep in sync when page code rebuilds options
    const mo = new MutationObserver(rebuild);
    mo.observe(sel, { childList:true, subtree:true });
    sel.addEventListener('change', () => { setLabel(); });

    // Toggle menu
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = wrap.classList.contains('open');
      closeAllSelectDown(wrap);
      const nowOpen = !wasOpen; // toggle this one after closing others
      wrap.classList.toggle('open', nowOpen);
      btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) { wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    });

    // Initial build
    rebuild();
  }

  // Multi-select dropdown with checkboxes that always opens downward
  function enhanceMultiSelectDown(id, opts={}){
    const sel = document.getElementById(id);
    if (!sel || sel.dataset.enhanced === '1') return;
    if (!sel.multiple) return; // only for multi-select
    const style = getComputedStyle(sel);
    if (style.display === 'none' || style.visibility === 'hidden') return;

    const getMax = () => {
      try { return Math.max(1, parseInt((opts.maxProvider && opts.maxProvider()) || 1,10)); } catch(e){ return 1; }
    };
    const placeholder = sel.dataset.placeholder || 'Select metrics';

    sel.dataset.enhanced = '1';
    const wrap = document.createElement('div');
    wrap.className = 'multi-down';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ms-button';
    btn.setAttribute('aria-haspopup','listbox');
    btn.setAttribute('aria-expanded','false');
    const chips = document.createElement('div');
    chips.className = 'chips';
    btn.appendChild(chips);
    const menu = document.createElement('div');
    menu.className = 'menu';
    menu.setAttribute('role','listbox');

    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('native-select');
    wrap.appendChild(btn);
    wrap.appendChild(menu);

    function selectedValues(){
      return Array.from(sel.options).filter(o=>o.selected).map(o=>o.value);
    }
    function selectedEntries(){
      return Array.from(sel.options).filter(o=>o.selected).map(o=>({ value:o.value, label:o.textContent }));
    }
    function syncChips(){
      const entries = selectedEntries();
      chips.innerHTML = '';
      if (!entries.length){ const span=document.createElement('span'); span.className='placeholder'; span.textContent=placeholder; chips.appendChild(span); return; }
      const shown = entries.slice(0,3);
      shown.forEach(e=>{ const c=document.createElement('span'); c.className='chip'; c.textContent=e.label; chips.appendChild(c); });
      if (entries.length > shown.length){ const more=document.createElement('span'); more.className='chip'; more.textContent = `+${entries.length - shown.length} more`; chips.appendChild(more); }
    }
    function rebuild(){
      const max = getMax();
      const current = selectedValues();
      // reflect counts for global closer logic
      wrap.dataset.max = String(max);
      wrap.dataset.sel = String(current.length);
      menu.innerHTML='';
      Array.from(sel.options).forEach(o => {
        const item = document.createElement('div'); item.className='item';
        const cb = document.createElement('input'); cb.type='checkbox'; cb.checked = o.selected; cb.id = `${id}_${o.value}`;
        const lab = document.createElement('label'); lab.setAttribute('for',cb.id); lab.textContent = o.textContent;
        item.appendChild(cb); item.appendChild(lab);
        const atMax = current.length >= max;
        if (atMax && !o.selected){ item.classList.add('disabled'); cb.disabled = true; }
        cb.addEventListener('click', (e) => {
          e.stopPropagation();
          const maxNow = getMax();
          const curr = selectedValues();
          if (!cb.checked && o.selected){
            o.selected = false;
          } else if (cb.checked && !o.selected){
            if (curr.length >= maxNow){ cb.checked = false; return; }
            o.selected = true;
          }
          sel.dispatchEvent(new Event('change', { bubbles:true }));
          rebuild();
          syncChips();
          // Keep menu open until selection meets compare limit
          const after = selectedValues();
          const atLimit = after.length >= getMax();
          if (atLimit){
            wrap.classList.remove('open');
            btn.setAttribute('aria-expanded','false');
          } else {
            wrap.classList.add('open');
            btn.setAttribute('aria-expanded','true');
          }
        });
        item.addEventListener('click', (e) => { e.stopPropagation(); cb.click(); });
        menu.appendChild(item);
      });
      syncChips();
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = wrap.classList.contains('open');
      closeAllSelectDown(wrap);
      const nowOpen = !wasOpen;
      wrap.classList.toggle('open', nowOpen);
      btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        const n = selectedValues().length, m = getMax();
        if (n >= m) { wrap.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
        else { wrap.classList.add('open'); btn.setAttribute('aria-expanded','true'); }
      }
    });

    const mo = new MutationObserver(() => { rebuild(); });
    mo.observe(sel, { childList:true, subtree:true });
    sel.addEventListener('change', () => {
      rebuild();
      const n = selectedValues().length, m = getMax();
      if (n < m) {
        wrap.classList.add('open');
        btn.setAttribute('aria-expanded','true');
      }
      // sync dataset counts
      wrap.dataset.sel = String(n);
      wrap.dataset.max = String(m);
    });

    rebuild();
  }

  // Activate on analytics pages once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    ['yearFrom','yearTo','barCompareCount','pieTopN'].forEach(enhanceSelectDown);
  });
})(window);

// ==========================================
// ===== GLOW EFFECT (Robust / Async) =====
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Check if there is a hash (e.g., #pieChart)
  if (window.location.hash) {
    const targetId = window.location.hash.substring(1); // remove '#'
    
    // 2. Poll for the element every 100ms (Wait for D3 to render it)
    const waitForElement = setInterval(() => {
      const targetElement = document.getElementById(targetId);
      
      // If found, stop checking and run the glow logic
      if (targetElement) {
        clearInterval(waitForElement);
        
        const chartContainer = targetElement.closest('.chart');
        if (chartContainer) {
          // Scroll roughly to center
          chartContainer.scrollIntoView({ behavior: "smooth", block: "center" });

          // Add glow class
          chartContainer.classList.add("chart-highlight");

          // Remove after 3 seconds
          setTimeout(() => {
            chartContainer.classList.remove("chart-highlight");
          }, 3000);
        }
      }
    }, 100); // Check every 0.1 seconds

    // 3. Safety timeout: Stop checking after 8 seconds if not found
    setTimeout(() => clearInterval(waitForElement), 8000);
  }
});