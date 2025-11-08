document.addEventListener("DOMContentLoaded", () => {
    const dataDir = "data/positive%20drug%20test/";
    const sources = {
        line: `${dataDir}data%201%20-%20positive%20drug%20test.csv`,
        bar: `${dataDir}data%202%20-%20positive%20drug%20test.csv`,
        pie: `${dataDir}data%203%20-%20positive%20drug%20test.csv`
    };

    Promise.all([
        d3.csv(sources.line, parseDateRow),
        d3.csv(sources.bar, parseJurisdictionRow),
        d3.csv(sources.pie, parseDrugTypeRow)
    ])
        .then(([lineData, barData, pieData]) => {
            renderPositiveLine(lineData);
            renderPositiveBar(barData);
            renderPositivePie(pieData);
        })
        .catch((error) => {
            console.error("Unable to load positive drug test datasets:", error);
            const container = document.querySelector("main");
            if (container) {
                const notice = document.createElement("p");
                notice.className = "chart-empty";
                notice.textContent = "Unable to load datasets. Please refresh the page.";
                container.appendChild(notice);
            }
        });
});

function parseDateRow(row) {
    return {
        date: d3.timeParse("%d/%m/%Y")(row.START_DATE),
        total: +row.Sum_Positive_Test_Count || +row["Sum(Positive_Test_Count)"]
    };
}

function parseJurisdictionRow(row) {
    return {
        jurisdiction: row.JURISDICTION,
        total: +row.Sum_Positive_Test_Count || +row["Sum(Positive_Test_Count)"]
    };
}

function parseDrugTypeRow(row) {
    return {
        drug: (row.Drug_Type || row["Drug_Type"] || "").replace("_transformed", ""),
        total: +row.Sum_Drug_Value || +row["Sum(Drug_Value)"]
    };
}

function renderPositiveLine(data) {
    const container = d3.select("#pd-line-chart");
    if (container.empty()) return;

    const cleanData = data.filter((d) => d.date && !Number.isNaN(d.total));
    if (!cleanData.length) {
        container.append("p").attr("class", "chart-empty").text("No time-series data available.");
        return;
    }

    cleanData.sort((a, b) => d3.ascending(a.date, b.date));

    container.selectAll("*").remove();

    const margin = { top: 56, right: 28, bottom: 56, left: 80 };
    const width = container.node().clientWidth || 860;
    const height = 380;

    const xScale = d3.scaleTime()
        .domain(d3.extent(cleanData, (d) => d.date))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(cleanData, (d) => d.total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x((d) => xScale(d.date))
        .y((d) => yScale(d.total))
        .curve(d3.curveMonotoneX);

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    svg.append("path")
        .datum(cleanData)
        .attr("fill", "none")
        .attr("stroke", "#f97316")
        .attr("stroke-width", 3)
        .attr("d", line);

    svg.append("path")
        .datum(cleanData)
        .attr("fill", "url(#positive-line-area)")
        .attr("d", d3.area()
            .x((d) => xScale(d.date))
            .y0(yScale(0))
            .y1((d) => yScale(d.total))
            .curve(d3.curveMonotoneX)
        );

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
        .attr("id", "positive-line-area")
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(249, 115, 22, 0.25)");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(249, 115, 22, 0)");

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(10))
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(6).tickFormat(formatThousands))
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.selectAll(".tick line").attr("stroke", "rgba(148, 163, 184, 0.25)");
    svg.selectAll(".domain").attr("stroke", "rgba(148, 163, 184, 0.35)");
}

function renderPositiveBar(data) {
    const container = d3.select("#pd-bar-chart");
    if (container.empty()) return;

    const cleanData = data.filter((d) => d.jurisdiction && !Number.isNaN(d.total));
    if (!cleanData.length) {
        container.append("p").attr("class", "chart-empty").text("No jurisdiction data available.");
        return;
    }

    const sortedData = [...cleanData].sort((a, b) => b.total - a.total);

    container.selectAll("*").remove();

    const margin = { top: 48, right: 28, bottom: 48, left: 120 };
    const width = container.node().clientWidth || 860;
    const height = 420;

    const yScale = d3.scaleBand()
        .domain(sortedData.map((d) => d.jurisdiction))
        .range([margin.top, height - margin.bottom])
        .padding(0.25);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(sortedData, (d) => d.total)]).nice()
        .range([margin.left, width - margin.right]);

    const colourScale = d3.scaleSequential(d3.interpolateInferno)
        .domain([0, sortedData.length]);

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    svg.append("g")
        .selectAll("rect")
        .data(sortedData)
        .join("rect")
        .attr("x", margin.left)
        .attr("y", (d) => yScale(d.jurisdiction))
        .attr("width", (d) => xScale(d.total) - margin.left)
        .attr("height", yScale.bandwidth())
        .attr("rx", 10)
        .attr("fill", (d, i) => colourScale(i));

    svg.append("g")
        .selectAll("text")
        .data(sortedData)
        .join("text")
        .attr("x", (d) => xScale(d.total) + 8)
        .attr("y", (d) => yScale(d.jurisdiction) + yScale.bandwidth() / 2)
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-weight", 600)
        .attr("font-size", 12)
        .text((d) => formatThousands(d.total));

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(formatThousands))
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.selectAll(".tick line").attr("stroke", "rgba(148, 163, 184, 0.25)");
    svg.selectAll(".domain").attr("stroke", "rgba(148, 163, 184, 0.35)");
}

function renderPositivePie(data) {
    const container = d3.select("#pd-pie-chart");
    if (container.empty()) return;

    const cleanData = data.filter((d) => d.drug && !Number.isNaN(d.total));
    if (!cleanData.length) {
        container.append("p").attr("class", "chart-empty").text("No drug-type data available.");
        return;
    }

    container.selectAll("*").remove();

    const width = container.node().clientWidth || 820;
    const height = 420;
    const radius = Math.min(width, height) / 2 - 30;
    const total = d3.sum(cleanData, (d) => d.total);

    const colourScale = d3.scaleOrdinal()
        .domain(cleanData.map((d) => d.drug))
        .range(d3.schemeSet2);

    const pie = d3.pie()
        .sort(null)
        .value((d) => d.total);

    const arc = d3.arc()
        .innerRadius(radius * 0.5)
        .outerRadius(radius);

    const labelArc = d3.arc()
        .innerRadius(radius * 0.75)
        .outerRadius(radius * 0.75);

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${width / 2 - 120}, ${height / 2})`);

    const arcs = pie(cleanData);

    chartGroup.selectAll("path")
        .data(arcs)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => colourScale(d.data.drug))
        .attr("stroke", "#0f172a")
        .attr("stroke-width", 1.2);

    chartGroup.selectAll("text")
        .data(arcs)
        .join("text")
        .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("fill", "#0f172a")
        .attr("font-size", 11)
        .attr("font-weight", 700)
        .text((d) => `${formatDrugName(d.data.drug)} ${formatPercent(d.data.total / total)}`);

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 240}, ${height / 2 - cleanData.length * 16})`);

    const legendItems = legend.selectAll("g")
        .data(cleanData)
        .join("g")
        .attr("transform", (_, i) => `translate(0, ${i * 28})`);

    legendItems.append("rect")
        .attr("width", 200)
        .attr("height", 22)
        .attr("rx", 8)
        .attr("fill", "rgba(15, 23, 42, 0.65)");

    legendItems.append("rect")
        .attr("x", 10)
        .attr("y", 6)
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 4)
        .attr("fill", (d) => colourScale(d.drug));

    legendItems.append("text")
        .attr("x", 28)
        .attr("y", 11)
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text((d) => `${formatDrugName(d.drug)}: ${formatPercent(d.total / total)} (${formatThousands(d.total)})`);
}

function formatThousands(value) {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
}

function formatPercent(value) {
    return d3.format(".1%")(value);
}

function formatDrugName(name) {
    return name.replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

