let playing;
const size = 70;
let start = 0;
let playCtlIntval, chartData;

async function draw_chart() {
    if (!chartData) {
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
    }

    switch (chartType) {
        case "bar":
        d3.selectAll(".chart .progress-container").style("display", "inline-block");
        start = 0;
        draw_bar_chart();
        break;

        case "area":
        playing = false;
        clearInterval(playCtlIntval);
        setTimeout(() => {
            d3.selectAll(".chart .progress-container").style("display", "none");
            d3.select(".chart").selectAll("svg").remove();
            draw_area_chart();
        }, 500);
        break;
    }

}

// Area chart section
function draw_area_chart() {
    // set the dimensions and margins of the graph
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    // parse the date / time
    var parseTime = d3.timeParse("%d-%b-%y");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y = d3.scaleLinear().range([height, 0]);

    // define the area
    var	area = d3.area()	
    .x(function(d) { return x(d.date); })	
    .y0(height)					
    .y1(function(d) { return y(d.count); });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

        

    // Get the data
    // d3.csv("./data.csv").then(function(data) {
    data = chartData;

    // format the data
    data.forEach(function(d) {
        d.date = new Date(d.date);
        d.count = +d.count;
    });

    // Scale the range of the data
    x.domain(d3.extent(data, function(d) { return d.date; }));
    y.domain([0, d3.max(data, function(d) { return d.count; })]);

    // set the gradient
    svg.append("linearGradient")				
    .attr("id", "area-gradient")			
    .attr("gradientUnits", "userSpaceOnUse")	
    .attr("x1", 0).attr("y1", y(0))			
    .attr("x2", 0).attr("y2", y(1000))		
    .selectAll("stop")						
    .data([								
    {offset: "0%", color: "red"},		
    {offset: "30%", color: "red"},	
    {offset: "45%", color: "black"},		
    {offset: "55%", color: "black"},		
    {offset: "60%", color: "lawngreen"},	
    {offset: "100%", color: "lawngreen"}	
    ])					
    .enter().append("stop")			
    .attr("offset", function(d) { return d.offset; })	
    .attr("stop-color", function(d) { return d.color; });

    // Add the area.
    svg.append("path")
    .data([data])
    .attr("class", "area")
    .attr("d", area);

    // Add the X Axis
    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
    .call(d3.axisLeft(y));
    // });

    let zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[-500,-300], [1500, 1000]])
    .on('zoom', (event) => {
        svg.attr('transform', event.transform)
    });


    svg.call(zoom);
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
    start = parseInt(Number(document.getElementById('slider-range').value)) * 9/2.1;
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

                const text = chartData[start] && start > 22 && start < 800 ? chartData[start].date : '';
                d3.select('.current-date')
                    .attr('x', (start*2) + 60)
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