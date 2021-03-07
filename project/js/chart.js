async function draw_chart() {
    let covidCsv = `./data/${dataSource}/full_data.csv`;
    const csv_data = await d3.csv(covidCsv);
    const grouped_data = _.groupBy(csv_data, 'date');
    const data = _.map(grouped_data, (items, date) => {
        const count = _.reduce(items, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
        return {
            name: date,
            value: count
        };
    });

    const size = 70;
    let start = 0;
    setInterval(() => {
        let cov_data = _.filter(data, (item, index) => {
            return index >= start && index <= (start + size);
        });
        if (cov_data.length < size) {
            const firstItems = _.take(data, size - cov_data.length);
            cov_data = cov_data.concat(firstItems);
        }
        refresh_chart(cov_data);
        start += 5;
        if (start > data.length) {
            start = 0;
        }
    }, 100);
}


function refresh_chart(data) {

    var margin = {top: 20, right: 20, bottom: 70, left: 70},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// set the ranges
var x = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y = d3.scaleLinear()
          .range([height, 0]);
          
// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin
d3.select(".chart").select("svg").remove();
var svg = d3.select(".chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

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

      svg.append("text")             
      .attr("transform",
            "translate(" + (width/2) + " ," + 
                           (height + margin.top + 50) + ")")
      .style("text-anchor", "middle")
      .text("Date");

  // add the y Axis
  svg.append("g")
      .call(d3.axisLeft(y));


}