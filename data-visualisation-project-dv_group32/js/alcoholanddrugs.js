document.addEventListener("DOMContentLoaded", () => {
    const dataDir = "data/Alcohol_drugs/";
    const dataPaths = {
        line: `${dataDir}data%201%20-%20alcohol%20and%20drug%20test.csv`,
        bar: `${dataDir}data%202%20-%20alcohol%20and%20drug%20test.csv`,
        pie: `${dataDir}data%203%20-%20alcohol%20and%20drug%20test.csv`
    };

    Promise.all([
        d3.csv(dataPaths.line, parseYearRow),
        d3.csv(dataPaths.bar, parseStateRow),
        d3.csv(dataPaths.pie, parseStateRow)
    ])
        .then(([lineData, barData, pieData]) => {
            renderLineChart(lineData);
            renderBarChart(barData);
            renderPieChart(pieData);
        })
        .catch((error) => {
            console.error("Failed to load alcohol & drug datasets:", error);
            const container = document.querySelector("main");
            if (container) {
                const notice = document.createElement("p");
                notice.className = "chart-empty";
                notice.textContent = "Unable to load datasets. Please try refreshing the page.";
                container.appendChild(notice);
            }
        });
});

function parseYearRow(row) {
    return {
        year: +row.year,
        total: +row.total_tests
    };
}

function parseStateRow(row) {
    return {
        state: row.state,
        total: +row.total_tests
    };
}

function renderLineChart(data) {
    const container = d3.select("#ad-line-chart");
    if (container.empty() || !data.length) return;

    container.selectAll("*").remove();

    const margin = { top: 56, right: 32, bottom: 48, left: 72 };
    const width = container.node().clientWidth || 860;
    const height = 380;

    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, (d) => d.year))
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, (d) => d.total)]).nice()
        .range([height - margin.bottom, margin.top]);

    const line = d3.line()
        .x((d) => xScale(d.year))
        .y((d) => yScale(d.total))
        .curve(d3.curveMonotoneX);

    const area = d3.area()
        .x((d) => xScale(d.year))
        .y0(yScale(0))
        .y1((d) => yScale(d.total))
        .curve(d3.curveMonotoneX);

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    svg.append("path")
        .datum(data)
        .attr("fill", "rgba(79, 70, 229, 0.18)")
        .attr("d", area);

    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#4F46E5")
        .attr("stroke-width", 3)
        .attr("d", line);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(formatMillions);

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(xAxis)
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(yAxis)
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.selectAll(".tick line").attr("stroke", "rgba(148, 163, 184, 0.35)");
    svg.selectAll(".domain").attr("stroke", "rgba(148, 163, 184, 0.35)");

    svg.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("cx", (d) => xScale(d.year))
        .attr("cy", (d) => yScale(d.total))
        .attr("r", 4)
        .attr("fill", "#fff");
}

function renderBarChart(data) {
    const container = d3.select("#ad-bar-chart");
    if (container.empty() || !data.length) return;

    container.selectAll("*").remove();

    const sortedData = [...data].sort((a, b) => b.total - a.total);

    const margin = { top: 48, right: 32, bottom: 48, left: 120 };
    const width = container.node().clientWidth || 860;
    const height = 420;

    const yScale = d3.scaleBand()
        .domain(sortedData.map((d) => d.state))
        .range([margin.top, height - margin.bottom])
        .padding(0.25);

    const xScale = d3.scaleLinear()
        .domain([0, d3.max(sortedData, (d) => d.total)]).nice()
        .range([margin.left, width - margin.right]);

    const colourScale = d3.scaleSequential(d3.interpolateBlues)
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
        .attr("y", (d) => yScale(d.state))
        .attr("width", (d) => xScale(d.total) - margin.left)
        .attr("height", yScale.bandwidth())
        .attr("fill", (d, i) => colourScale(i))
        .attr("rx", 10);

    svg.append("g")
        .selectAll("text")
        .data(sortedData)
        .join("text")
        .attr("x", (d) => xScale(d.total) + 8)
        .attr("y", (d) => yScale(d.state) + yScale.bandwidth() / 2)
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-weight", 600)
        .attr("font-size", 12)
        .text((d) => formatMillions(d.total));

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(6).tickFormat(formatMillions))
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .attr("fill", "#e2e8f0");

    svg.selectAll(".tick line").attr("stroke", "rgba(148, 163, 184, 0.25)");
    svg.selectAll(".domain").attr("stroke", "rgba(148, 163, 184, 0.4)");
}

function renderPieChart(data) {
    const container = d3.select("#ad-pie-chart");
    if (container.empty() || !data.length) return;

    container.selectAll("*").remove();

    const width = container.node().clientWidth || 820;
    const height = 420;
    const radius = Math.min(width, height) / 2 - 30;

    const total = d3.sum(data, (d) => d.total);

    const colourScale = d3.scaleOrdinal()
        .domain(data.map((d) => d.state))
        .range(d3.schemeTableau10);

    const pie = d3.pie()
        .sort(null)
        .value((d) => d.total);

    const arc = d3.arc()
        .innerRadius(radius * 0.55)
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

    const arcs = pie(data);

    chartGroup.selectAll("path")
        .data(arcs)
        .join("path")
        .attr("d", arc)
        .attr("fill", (d) => colourScale(d.data.state))
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
        .text((d) => `${d.data.state} ${formatPercent(d.data.total / total)}`);

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 240}, ${height / 2 - data.length * 16})`);

    const legendItems = legend.selectAll("g")
        .data(data)
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
        .attr("fill", (d) => colourScale(d.state));

    legendItems.append("text")
        .attr("x", 28)
        .attr("y", 11)
        .attr("dominant-baseline", "middle")
        .attr("fill", "#e2e8f0")
        .attr("font-size", 11)
        .attr("font-weight", 600)
        .text((d) => `${d.state}: ${formatPercent(d.total / total)} (${formatMillions(d.total)})`);
}

function formatMillions(value) {
    if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`;
    }
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

