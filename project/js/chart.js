let playing;
const size = 70;
let start = 0;
let playCtlIntval, chartData;

async function draw_chart() {
    let covidCsv = `./data/${dataSource}/full_data.csv`;
    const csv_data = await d3.csv(covidCsv);
    
    if (chartType === 'tree') {
        const grouped_data = _.groupBy(csv_data, 'location');
        chartData = _.map(grouped_data, (items, location) => {
            const count = _.reduce(items, (sum, item) => {
                return sum += Number(item[selectedProperty.name] || 0);
            }, 0);
            return {
                name: location,
                count,
                code: items[0].Country_code
            };
        });
    } else {
        const grouped_data = _.groupBy(csv_data, 'date');
        chartData = _.map(grouped_data, (items, date) => {
            const count = _.reduce(items, (sum, item) => {
                return sum += Number(item[selectedProperty.name] || 0);
            }, 0);
            return {
                date,
                count
            };
        });
    }

    d3.select(".chart").selectAll("svg").remove();
    switch (chartType) {
        case "bar":
        d3.selectAll(".chart .progress-container").style("display", "inline-block");
        start = 0;
        draw_bar_chart();
        break;

        case "area":
        case "tree":
        playing = false;
        clearInterval(playCtlIntval);
        setTimeout(() => {
            d3.selectAll(".chart .progress-container").style("display", "none");
            if (chartType === 'area') {
                draw_area_chart();
            } else {
                draw_tree_chart();
            }
        }, 500);
        break;
    }
}

function draw_tree_chart() {
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;
    let cur_scale = 1;

  // Append the svg object to the body of the page
  var svg = d3.select(".chart")
  .append("svg")
    .attr('class', 'tree-chart')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Read data
    let data = chartData.map(item => {
        item.parent = 'root';
        return item;
    })
    .filter(item => item.count > 10000);
    data = _.orderBy(data, ['count'], ['desc']);
    data.unshift({name: 'root', parent: '', count: ''})

    // stratify the data: reformatting for d3.js
    var root = d3.stratify()
      .id(function(d) { return d.name; })   // Name of the entity (column name is name in csv)
      .parentId(function(d) { return d.parent; })   // Name of the parent (column name is parent in csv)
      (data);
    root.sum(function(d) { return +d.count })   // Compute the numeric value for each entity

    // Then d3.treemap computes the position of each element of the hierarchy
    // The coordinates are added to the root object above
    d3.treemap()
      .size([width, height])
      .padding(1)
      (root);
    
    const tooltip = d3.tip().attr('class', 'd3-tip')
    .html(function (event, d) {
        const value = (d.data.count || 0).toLocaleString('en-US');
        const name = d.data.name || 'Greenland';
        return `<div>
        <p>Country: <strong>${name}</strong></p>
        <p>${selectedProperty.label}: <strong>${value}</strong></p>
        </div>`;
    });

    svg.on('mousedown', function (d) {
        tooltip.hide()
    });
    svg.attr("width", width)
        .attr("height", height)
        .style("background", 'ivory')
        .append('g')
        .call(tooltip);

    var colorSpace = d3.scaleSequential().domain([data[1].count,data[data.length-1].count])
    .range(["#ff0000", "#f4a2a2"])

    // use this information to add rectangles:
    svg
      .selectAll("rect")
      .data(root.leaves())
      .enter()
      .append("rect")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("stroke", "black")
        .style("fill", (d) => {
            return colorSpace(d.data.count);
        })
        .on('mouseover', function (event, d) {
            update_tooltip_position(event, tooltip, d);
        })
        .on('mouseout', function (d) {
            tooltip.hide();
        })
        .on("mousemove", function(event, d){
            update_tooltip_position(event, tooltip, d);
        })
        .on('mousedown', function (d) {
            tooltip.hide()
        });;

    // and to add the text labels
    redraw_text(root, svg, cur_scale);

    let zoom = d3.zoom()
    .scaleExtent([1, 30])
    .translateExtent([[-1500,-1000], [1500, 1000]])
    .on('zoom', (event) => {
        svg.attr('transform', event.transform)
        cur_scale = event.transform.k;
        redraw_text(root, svg, cur_scale)
    });
    d3.select(".chart").call(zoom);


    function update_tooltip_position(event, tooltip, d) {
        const x = Math.abs(event.pageX) - 50;
        let y = Math.abs(event.pageY) + 15;
        tooltip.show(event, d);
        $('.d3-tip').css({"left": (x + "px"), "top": (y + "px")});
    }

    function get_color_perc(d) {
        const total = _.reduce(chartData, (sum, item) => {
            return sum += Number(item.count || 0);
        }, 0);
        count = Number(d.data.count || 0);
        let perc = count * 10 / Number(total);
        perc = perc > 1 ? 1 : perc;
        return perc;
    }


    function redraw_text(root, svg, cur_scale) {
        svg.selectAll(".country-text").remove();

        svg
        .selectAll("country-text")
        .data(root.leaves())
        .enter()
        .append("text")
        .attr('class', 'country-text')
        .attr("x", function(d){ 
            const text_len = (d.data.code.length/2 * 5/cur_scale);
            let x = d.x0+ (d.x1 - d.x0)/2 - text_len;
            x = x < 10 ? 10 : x;
            
            return x;
        })
        .attr("y", function(d){ return d.y0+ (d.y1 - d.y0)/2})
        .text(function(d){
            let text = d.data.code;
            if (cur_scale < 2 && d.data.count < 8000000) {
                text = '';
            }
            if (cur_scale >= 2 && cur_scale < 3 && d.data.count < 2000000) {
                text = '';
            }
            if (cur_scale >= 3 && cur_scale < 5 && d.data.count < 1500000) {
                text = '';
            }
            if (cur_scale >= 5 && cur_scale < 7 && d.data.count < 1000000) {
                text = '';
            }
            if (cur_scale >= 7 && cur_scale < 10 && d.data.count < 500000) {
                text = '';
            }
            if (cur_scale >= 10 && cur_scale < 14 && d.data.count < 300000) {
                text = '';
            }
            if (cur_scale >= 14 && cur_scale < 17 && d.data.count < 100000) {
                text = '';
            }
            if (cur_scale >= 17 && cur_scale < 20 && d.data.count < 50000) {
                text = '';
            }
            return text;
        })
        .attr("font-size", (d) => {
            let size = 10 / cur_scale;
            return size + 'px';
        })
        .attr("fill", (d) => {
            const perc = get_color_perc(d);
            const color = perc <= 0.5 ? 'black' : 'white';
            return color;
        });
    }

}


// Area chart section
function draw_area_chart() {
    // https://observablehq.com/d/78b66425ae803199
    const height = 700;
    const width = 1000;
    margin = ({top: 20, right: 20, bottom: 30, left: 70});

    const data = chartData.map(d => {
        return { date : new Date(d.date), value : d.count }
    });

    x = d3.scaleUtc()
    .domain(d3.extent(data, d => d.date))
    .range([margin.left, width - margin.right])

    y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)]).nice()
    .range([height - margin.bottom, margin.top])

    xAxis = (g, x) => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))

    yAxis = (g, y) => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null, "s"))
    .call(g => g.select(".domain").remove())
    .call(g => g.select(".tick:last-of-type text").clone()
        .attr("x", 3)
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(data.y))

    area = (data, x) => d3.area()
        .curve(d3.curveStepAfter)
        .x(d => x(d.date))
        .y0(y(0))
        .y1(d => y(d.value))
      (data)

    const zoom = d3.zoom()
      .scaleExtent([1, 32])
      .extent([[margin.left, 0], [width - margin.right, height]])
      .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
      .on("zoom", zoomed);

    const svg = d3.select('.chart').append("svg")
        .attr("viewBox", [0, 0, width, height]);

    var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("width", width )
        .attr("height", height )
        .attr("x", margin.left)
        .attr("y", 0);

    svg.append("clipPath")
        .attr("id", clip.id)
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    const path = svg.append("path")
        .attr("clip-path", "url(#clip)")
        .attr("fill", "steelblue")
        .attr("d", area(data, x));

    const gx = svg.append("g")
        .call(xAxis, x);

    svg.append("g")
        .call(yAxis, y);

    svg.call(zoom)
        .transition()
        .duration(1000)
        .call(zoom.scaleTo, 0, [x(Date.UTC(2001, 8, 1)), 0]);

    function zoomed(event) {
        const xz = event.transform.rescaleX(x);
        path.attr("d", area(data, xz));
        gx.call(xAxis, xz);
    }

    return svg.node();

}


// Bar chart section
function draw_bar_chart() {
    d3.select(".chart").select("svg.summary-svg").remove();
    const summary_svg = d3.select(".chart")
        .append("svg")
        .attr("width", 1000)
        .attr("height", 35)
        .attr("class", "summary-svg");

    const summaries = [
        {name: 'start-date', x: 65, y: 12, text: chartData[0].date},
        {name: 'current-date', x: 460, y: 12, text: ''},
        {name: 'end-date', x: 930, y: 12, text: chartData[chartData.length-1].date}
    ];
    const row_g = summary_svg.append('g');
    row_g
    .selectAll("text")
    .data(summaries)
    .enter()
    .append('text')
    .style('font-size', 12)
    .attr("x", (d) => d.x)
    .attr('y', (d) => d.y)
    .attr("class", (d) => d.name)
    .text(d => d.text);

    togglePlay();
}

function resetSlider() {
    start = parseInt(Number(document.getElementById('slider-range').value) * 9/2.1);
}

function stopPlay() {
    playing = false;
    clearInterval(playCtlIntval);
    d3.select('.btn-control .play-text').style("display", "inline-block");
    d3.select('.btn-control .pause-text').style("display", "none");
}

function togglePlay() {
    playing = !playing;
    if (playing) {
        d3.select('.btn-control .pause-text').style("display", "inline-block");
        d3.select('.btn-control .play-text').style("display", "none");
        playCtlIntval = setInterval(() => {
            if (playing) {
                let cov_data = _.filter(chartData, (item, index) => {
                    return index >= start && index <= (start + size);
                });
                if (cov_data.length < size) {
                    const firstItems = _.take(chartData, size - cov_data.length);
                    cov_data = cov_data.concat(firstItems);
                }
                refresh_bar_chart(cov_data);
                start += 1;
                if (start > chartData.length) {
                    start = 0;
                }
                document.getElementById('slider-range').value = start*100/chartData.length;
                const text = chartData[start] && start > 22 && start < 415 ? chartData[start].date : '';
                d3.select('.current-date')
                    .attr('x', (start*2.1 + 50))
                    .text(text);
            }
        }, 100);
    } else {
        d3.select('.btn-control .play-text').style("display", "inline-block");
        d3.select('.btn-control .pause-text').style("display", "none");
        clearInterval(playCtlIntval);
    }
}


function refresh_bar_chart(data) {
    const margin = {top: 60, right: 20, bottom: 70, left: 70},
    width = 1000 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

    // set the ranges
    const x = d3.scaleBand()
            .range([0, width])
            .padding(0.1);
            const y = d3.scaleLinear()
            .range([height, 0]);

    d3.select(".chart").select("svg.bars-svg").remove();
    const svg = d3.select(".chart")
        .append("svg")
        .attr("class", "bars-svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function(d) {
        d.count = +d.count;
    });

    //   console.log(d3.max(data, function(d) { return d.count; }))
    // Scale the range of the data in the domains
    x.domain(data.map(function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.count; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("fill", "steelblue")
      .attr("x", function(d) { return x(d.date); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) {
          return y(d.count);
       })
      .attr("height", function(d) { return height - y(d.count); });

    // add the x Axis
    svg.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", function (d) {
        return "rotate(-90)";
    });

    // add the y Axis
    svg.append("g")
      .call(d3.axisLeft(y));

}