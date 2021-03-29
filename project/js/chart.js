let playing;
const size = 70;
let start = 0;
let playCtlIntval, chartData, progressData;

async function draw_chart() {
    let start_date, end_date;
    const src = 'who';
    let covidCsv = `./data/${src}/full_data.csv`;
    const csv_data = await d3.csv(covidCsv);
    chartData = _.orderBy(csv_data, [(item) => {
        return new Date(item.date).getTime();
    }], ['asc']);

    if (progressChart) {
        start_date = new Date(chartData[0].date);
        end_date = new Date(chartData[chartData.length-1].date);
        const num_of_days = moment(end_date).diff(moment(start_date), 'days');
        progressData = {start_date, end_date, num_of_days, chartData};
        start = 1;
    } else if (['bar', 'tree', 'scatter'].indexOf(chartType) > -1) {
        chartData = get_grouped_data(csv_data, 'location');
    } else {
        chartData = get_grouped_data(csv_data, 'date');
    }

    d3.select(".chart").selectAll("svg").remove();
    if (progressChart) {
        const summary_svg = d3.select(".chart")
            .append("svg")
            .attr("width", 1000)
            .attr("height", 35)
            .attr("class", "summary-svg")
            .style("display", 'inline-block');

        const sd_format = moment(start_date).format("MMMM Do YYYY");
        const ed_format = moment(end_date).format("MMMM Do YYYY");
        
        const summaries = [
            {name: 'start-date', x: 65, y: 12, text: sd_format},
            {name: 'current-date', x: 460, y: 12, text: ''},
            {name: 'end-date', x: 905, y: 12, text: ed_format}
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
    } else {
        playing = false;
        clearInterval(playCtlIntval);
        setTimeout(() => {
            switch (chartType) {
                case 'bar':
                chartData = _.orderBy(chartData, ['count'], ['desc']);
                chartData = _.take(chartData, 20);
                refresh_bar_chart(chartData, 'code');
                break;
                case "tree":
                draw_tree_chart(chartData);
                break;
                case "area":
                draw_area_chart(chartData);
                break;
                case "scatter":
                draw_scatter_chart(chartData);
            }
        }, 500);
    }

    
}

function get_grouped_data(csv_data, group_by) {
    let grouped_data = _.groupBy(csv_data, group_by);
    grouped_data = _.map(grouped_data, (items, location) => {
        const count = _.reduce(items, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
        const item = {
            name: location,
            count,
            code: items[0].Country_code
        };
        if (group_by === 'date') {
            item.date = items[0].date;
        }
        return item;
    });
    return grouped_data;
}

function togglePlay() {
    playing = !playing;
    if (playing) {
        d3.select('.btn-control .pause-text').style("display", "inline-block");
        d3.select('.btn-control .play-text').style("display", "none");
        playCtlIntval = setInterval(() => {
            if (playing) {
                const {start_date, end_date, num_of_days, chartData} = progressData;
                const cur_date = moment(start_date).add(start, 'days').toDate();
                cov_data = _.filter(chartData, (item) => {
                    return new Date(item.date).getTime() >= start_date.getTime() && new Date(item.date).getTime() <= cur_date.getTime();
                });
                if (['tree', 'scatter'].indexOf(chartType) > -1) {
                    cov_data = get_grouped_data(cov_data, 'location');
                } else {
                    cov_data = get_grouped_data(cov_data, 'date');
                }

                if (chartType === 'bar' && cov_data.length > size) {
                    cov_data = _.takeRight(cov_data, size);
                }

                switch (chartType) {
                    case "bar":
                    refresh_bar_chart(cov_data, 'date');
                    break;
                    case "tree":
                    draw_tree_chart(cov_data);
                    break;
                    case "area":
                    draw_area_chart(cov_data);
                    break;
                    case 'scatter':
                    draw_scatter_chart(cov_data);
                    break;
                }

                start += 1;
                if (start > num_of_days) {
                    start = 0;
                }
                document.getElementById('slider-range').value = start*100/num_of_days;
                const text = start > 22 && start < 415 ? moment(cur_date).format("MMMM Do YYYY") : '';
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

function draw_tree_chart(cov_data) {
    var margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right;
    // height = 700 - margin.top - margin.bottom;
    const height = progressChart ? 605 : 680;
    let cur_scale = 1;

    d3.selectAll('.tree-chart').remove();
    // Append the svg object to the body of the page
    var svg = d3.select(".chart")
    .append("svg")
    .attr('class', 'tree-chart')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Read data
    let total_count = 0;
    let data = cov_data.map(item => {
        item.parent = 'root';
        total_count += item.count || 0;
        return item;
    });
    if (total_count > 1000000) {
        data = data.filter(item => item.count > 10000);
    }
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

    var colorSpace = d3.scaleSequential().domain([data[1].count, data[data.length-1].count])
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
    redraw_tree_box_text(root, svg, cur_scale);

    let zoom = d3.zoom()
    .scaleExtent([1, 50])
    .translateExtent([[-1500,-1000], [1500, 1000]])
    .on('zoom', (event) => {
        svg.attr('transform', event.transform)
        cur_scale = event.transform.k;
        redraw_tree_box_text(root, svg, cur_scale)
    });
    d3.select(".chart").call(zoom);

    function update_tooltip_position(event, tooltip, d) {
        const x = Math.abs(event.pageX) - 50;
        let y = Math.abs(event.pageY) + 15;
        tooltip.show(event, d);
        $('.d3-tip').css({"left": (x + "px"), "top": (y + "px")});
    }

    function get_color_perc(d) {
        const total = _.reduce(cov_data, (sum, item) => {
            return sum += Number(item.count || 0);
        }, 0);
        count = Number(d.data.count || 0);
        let perc = count * 10 / Number(total);
        perc = perc > 1 ? 1 : perc;
        return perc;
    }

    function redraw_tree_box_text(root, svg, cur_scale) {
        svg.selectAll(".country-text").remove();

        svg
        .selectAll("country-text")
        .data(root.leaves())
        .enter()
        .append("text")
        .attr('class', 'country-text')
        .attr("x", function(d){ 
            const text_len = d.data.code ? (d.data.code.length/2 * 5/cur_scale) : 0;
            let x = d.x0+ (d.x1 - d.x0)/2 - text_len;
            x = x < 10 ? 10 : x;
            
            return x;
        })
        .attr("y", function(d){ return d.y0+ (d.y1 - d.y0)/2})
        .text(function(d){
            return get_cell_label(total_count, cur_scale, d);
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

function get_cell_label(total_count, cur_scale, d) {
    let text = d.data.code;
    if ((progressChart && total_count > 100000000) || !progressChart) {
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
        if (cur_scale >= 17 && cur_scale < 45 && d.data.count < 50000) {
            text = '';
        }
    }
    return text;
}


// Area chart section
function draw_area_chart(data) {
    d3.selectAll('svg.area-svg').remove();
    const height = (progressChart || chartType === 'bar') ? 620 : 700;
    const width = 1000;
    margin = ({top: 20, right: 20, bottom: 30, left: 70});

    data = data.map(d => {
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

    const svg = d3.select('.chart')
        .append("svg")
        .attr('class', 'area-svg')
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

// Scatter plot
function draw_scatter_chart(data) {
    const margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 1000 - margin.left - margin.right;
    const height = progressChart ? 580 : 660;

    data = _.orderBy(data, ['count'], ['desc'])
    // const color = d3.scaleOrdinal(data.map(d => d.code), d3.schemeCategory10)
    var color = d3.scaleSequential()
    .domain([data[1].count, data[data.length-1].count])
    .range(["#ff0000", "#f4a2a2"])

    let total_count = 0;
    data.forEach(item => {
        total_count += item.count || 0;
    });

    const pack = data => d3.pack()
    .size([width - 2, height - 2])(d3.hierarchy({children: data})
    .sum(d => d.count))
    const root = pack(data);

    d3.selectAll('.chart svg.scatter-svg').remove();
    const svg = d3.select('.chart')
        .append("svg")
        .attr('class', 'scatter-svg')
        .attr("viewBox", [0, 0, width, height]);
    
    let cur_scale = 1;
    redraw_bubble_text(root, svg, cur_scale);

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[-500,-300], [1500, 1000]])
        .on("zoom", (event) => {
            svg.attr('transform', event.transform)
            cur_scale = event.transform.k;
            redraw_bubble_text(root, svg, cur_scale)
        });
    svg.call(zoom);


    function redraw_bubble_text(root, svg, cur_scale) {
        svg.selectAll(".country-code").remove();

        const leaf = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x + 1},${d.y + 1})`);

        leaf.append("circle")
        .attr("id", d => (d.data.code + '-' + d.data.count))
        .attr("r", d => d.r)
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.count));

        leaf.append("text")
        .attr("y", 5)
        .attr("x", (d, i, nodes) => {
            return (-d.data.code.length*4) + 'px';
        })
        .text(function(d){
            return get_cell_label(total_count, cur_scale, d);
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

    function get_color_perc(d) {
        const total = _.reduce(data, (sum, item) => {
            return sum += Number(item.count || 0);
        }, 0);
        count = Number(d.data.count || 0);
        let perc = count * 10 / Number(total);
        perc = perc > 1 ? 1 : perc;
        return perc;
    }
}



// Bar chart section
function resetSlider() {
    start = parseInt(Number(document.getElementById('slider-range').value) * 9/2.1);
}

function stopPlay() {
    playing = false;
    clearInterval(playCtlIntval);
    d3.select('.btn-control .play-text').style("display", "inline-block");
    d3.select('.btn-control .pause-text').style("display", "none");
}

function refresh_bar_chart(data, by_prop) {
    const margin = {top: 60, right: 20, bottom: 70, left: 90},
    width = 1000 - margin.left - margin.right;
    let height = progressChart ? 500 : 600;

    // set the ranges
    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);
        const y = d3.scaleLinear()
        .range([height, 0]);

    d3.select(".chart").selectAll("svg.bars-svg").remove();
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
    x.domain(data.map(function(d) { return d[by_prop]; }));
    y.domain([0, d3.max(data, function(d) { return d.count; })]);

    // append the rectangles for the bar chart
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("fill", "steelblue")
      .attr("x", function(d) { return x(d[by_prop]); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) {
          return y(d.count);
       })
      .attr("height", function(d) { 
          return height - y(d.count);
    });

    if (!progressChart) {
        svg.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .text(function(d){
            return d.name;
        })
        .attr("x", function(d) {
            const label_len = d.name.length * 8;
            let label_y = y(d.count);
            if (label_y < label_len) {
                label_y = - label_len - 5;
                d.inside = true;
            } else {
                label_y = -label_y + 10;
            }
            return label_y;
        })
        .attr("y", function(d, i) { 
            return i * (x.bandwidth() + 4.5) + 30;
        })
        .attr('fill', (d) => {
            return d.inside ? 'white' : 'black';
        })
        .attr("transform", "rotate(-90)");

        svg.append('text')
            .text('Top ' + data.length + ' Countries based on ' + selectedProperty.label)
            .attr('class', 'top-countries')
            .attr("x", 200)
            .attr('y', 10);
    }

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