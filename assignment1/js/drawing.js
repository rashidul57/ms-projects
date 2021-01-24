
async function draw_business_impact() {
    const data = await d3.json("./../data/business-impact-donut.json");

    const title_svg = d3.select("#wrapper")
        .append('svg')
        .attr("width", 200)
        .attr("height", 40)
        .style("position", 'absolute')
        .style("left", '250px')
        .style("top", '15px')

    title_svg.append('text')
    .attr('font-size', '15px')
    .style("font-weight", '400')
    .attr('dx', 0)
    .attr('dy', 20)  
    .html(data.title);

    title_svg.append('text')
    .attr('font-size', '13px')
    .style("font-weight", '400')
    .attr('dx', 0)
    .attr('dy', 36)  
    .html(data.title2);

    const width = 120,
        height = 120,
        radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal()
        .range(data.colors);

    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(15);

    const labelArc = d3.arc()
        .outerRadius(radius - 55)
        .innerRadius(radius - 40);

    const pie = d3.pie()
        .sort(null)
        .value((d) => { return d; });

    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 170)
        .style("position", 'absolute')
        .style("left", '250px')
        .style("top", '60px')
        .append("g")
        .attr("transform", "translate(" + ((width / 2) + 10) + "," + ((height / 2) + 10)  + ")");


    const arc_g = svg.selectAll(".arc")
    .data(pie(data.values))
    .enter()
    .append("g")
    .attr("class", "arc");

    arc_g.append("path")
      .attr("d", arc)
      .style("fill", (d) => { return color(d.data); });

    arc_g.append("text")
      .attr("transform", (d) => {return "translate(" + labelArc.centroid(d) + ")";})
      .attr("dx", (d) => {return data.label[d.data].left + 'px';})
      .attr("dy", (d) => {return data.label[d.data].top + 'px';})
      .style("font-size", '14px')
      .style("font-weight", 'bold')
      .style("fill", (d) => {return data.label[d.data].color;})
      .text((d) => { return d.data; });

      arc_g.append("text")
      .attr("transform", (d) => {return "translate(" + labelArc.centroid(d) + ")";})
      .attr("dx", (d) => {
          const buffer = d.data > 9 ? 17 : 8;
          return (data.label[d.data].left + buffer) + 'px';
      })
      .attr("dy", (d) => {return data.label[d.data].top + 'px';})
      .style("font-size", '12px')
      .style("fill", (d) => {return data.label[d.data].color;})
      .text((d) => { return '%'; });
    
    const note_g = svg.selectAll(".hint")
            .data(pie(data.values))
            .enter()
            .append("g")
            .attr("class", "hint");

    note_g.append('rect')
        .attr("x", (d) => { return data.hints[d.data].left})
        .attr('y', (d) => { return data.hints[d.data].top - 10})
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', (d) => { return color(d.data);})
        
    note_g.append('text')
        .attr("x", (d) => { return data.hints[d.data].left + 15})
        .attr('y', (d) => { return data.hints[d.data].top - 1})
        .style("font-size", '12px')
        .style("font-weight", '500')
        .text(d => {return data.hints[d.data].key})

    note_g.append('text')
        .attr("x", (d) => { return data.hints[d.data].left + 15})
        .attr('y', (d) => { return data.hints[d.data].top + 10})
        .style("font-size", '9px')
        .text(d => {return data.hints[d.data].note})

        note_g.append('text')
        .attr("x", (d) => { return data.hints[d.data].left + 15})
        .attr('y', (d) => { return data.hints[d.data].top + 20})
        .style("font-size", '9px')
        .text(d => {return data.hints[d.data].note2 || ''})

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
}

window.onload = () => {
    add_plain_texts();
    draw_business_impact();
}