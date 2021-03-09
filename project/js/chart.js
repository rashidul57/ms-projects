let playing;
const size = 70;
let start = 0;
let playCtlIntval, chartData;

async function draw_chart() {
    let covidCsv = `./data/${dataSource}/full_data.csv`;
    const csv_data = await d3.csv(covidCsv);
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