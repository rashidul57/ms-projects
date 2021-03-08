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
            name: date,
            value: count
        };
    });

}

function togglePlay() {
    playing = !playing;
    if (playing) {
        d3.select('.btn-control .play-text').style("display", "inline-block");
        d3.select('.btn-control .pause-text').style("display", "none");
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
                document.getElementById('range').value = start*100/chartData.length;
            }
        }, 100);
    } else {
        d3.select('.btn-control .pause-text').style("display", "inline-block");
        d3.select('.btn-control .play-text').style("display", "none");
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
            
    // append the svg object to the body of the page
    // append a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    d3.select(".chart").select("svg").remove();
    const svg = d3.select(".chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // format the data
    data.forEach(function(d) {
        d.value = +d.value;
    });

    //   console.log(d3.max(data, function(d) { return d.value; }))
    // Scale the range of the data in the domains
    x.domain(data.map(function(d) { return d.name; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("fill", "steelblue")
      .attr("x", function(d) { return x(d.name); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) {
          return y(d.value);
       })
      .attr("height", function(d) { return height - y(d.value); });

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