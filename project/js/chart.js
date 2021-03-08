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
                refresh_chart(cov_data);
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


function refresh_chart(data) {
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