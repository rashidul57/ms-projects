
async function draw_business_impact() {
    const width = 100;
    const height = 100;
    const data = await d3.json("./../data/business-impact-donut.json");

    const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.quantize(t => {
        const c = d3.interpolateSpectral(t * 0.8 + 0.1);
        // console.log(t, c)
        return c;
    }, data.length).reverse());

    const arc = d3.arc()
    .innerRadius(10)
    .outerRadius(15);

    arcLabel = () => {
        const radius = Math.min(width, height) / 2 * 0.8;
        return d3.arc().innerRadius(radius).outerRadius(radius);
    }

    const pie = d3.pie()
    .sort(null)
    .value(d => d.value);

    const arcs = pie(data);
    const wrapper = d3.select("#wrapper")
    const svg = wrapper.append("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

  svg.append("g")
      .attr("stroke", "white")
    .selectAll("path")
    .data(arcs)
    .join("path")
      .attr("fill", d => color(d.data.name))
      .attr("d", arc)
    .append("title")
      .text(d => `${d.data.name}: ${d.data.value.toLocaleString()}`);

  svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", '12px')
      .attr("text-anchor", "middle")
    .selectAll("text")
    .data(arcs)
    .join("text")
      .attr("transform", d => `translate(${arcLabel().centroid(d)})`)
      .call(text => text.append("tspan")
          .attr("x", '0px')
          .attr("y", "1px")
          .attr("font-weight", "bold")
          .text(d => d.data.name))
      .call(text => text.filter(d => (d.endAngle - d.startAngle) > 0.25).append("tspan")
          .attr("x", '0px')
          .attr("y", "1px")
          .attr("fill-opacity", 0.7)
          .text(d => d.data.value.toLocaleString()));

    svg.node();
}

async function add_plain_texts() {
    const data = await d3.json("./../data/left-bar-text.json");
    const wrapper = d3.select("#wrapper")
    wrapper
        .selectAll("text")
        .data(data)
        .enter()
        .append('text')
        .style("position", 'absolute')
        .style("left", function(d){ return d.position.left;})
        .style("top", function(d){ return d.position.top;})
        .style("font-size", (d) => {return d.fontSize})
        .style("font-weight", (d) => {return d.fontWeight || 'inherit'})
        .style("color", (d) => {return d.color})
        .html(d => d.text)
        .node()
}

window.onload = () => {
    add_plain_texts();
    draw_business_impact();
}