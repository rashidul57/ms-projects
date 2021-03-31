let playing;
const size = 70;
let start = 0;
let playCtlIntval, chartData, progressData;
let line_chart_state = {};
const selected_countries = {};
let top_or_selected = 'Top';
const date_format = 'Y-M-D';

async function draw_chart() {
    let start_date, end_date;
    let csv_data = await load_jhu_data();
    csv_data = csv_data.filter(item => {
        return ['World', 'North America', 'Europe', 'Asia', 'Africa', 'European Union', 'South America'].indexOf(item.location) === -1;
    });
    chartData = _.orderBy(csv_data, [(item) => {
        if (mapped_owid_data[item.location]) {
            item.code = mapped_owid_data[item.location].iso_code;
            item.code = mapped_owid_data[item.location].iso_code;
            item.vaccinated = parseInt(mapped_owid_data[item.location] && mapped_owid_data[item.location].people_vaccinated || 0);
        }
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
    } else if (chartType !== 'line') {
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

        const sd_format = moment(start_date).format("LL");
        const ed_format = moment(end_date).format("LL");
        
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
                break;
                case "line":
                draw_lines_chart(csv_data);
                break;
            }
        }, 500);
    }
}

function get_grouped_data(csv_data, group_by) {
    let grouped_data = _.groupBy(csv_data, group_by);
    grouped_data = _.map(grouped_data, (items, key) => {
        const count = _.reduce(items, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
        const item = {
            name: key,
            count,
            code: items[0].code
        };
        if (group_by === 'date' && !item.date) {
            item.date = key;
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
                } else if (chartType !== 'line') {
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
                    case 'line':
                    draw_lines_chart(cov_data);
                    break;
                }

                start += 1;
                if (start > num_of_days) {
                    start = 0;
                }
                document.getElementById('slider-range').value = start*100/num_of_days;
                const text = start > 22 && start < 415 ? moment(cur_date).format("LL") : '';
                d3.select('.current-date')
                    .attr('x', (start*2.1 + 50))
                    .text(text);
            }
        }, chartType === 'line' ? 700 : 100);
    } else {
        d3.select('.btn-control .play-text').style("display", "inline-block");
        d3.select('.btn-control .pause-text').style("display", "none");
        clearInterval(playCtlIntval);
    }
}

function draw_tree_chart(cov_data) {
    let margin = {top: 10, right: 10, bottom: 10, left: 10},
    width = 1000 - margin.left - margin.right;
    const height = progressChart ? 605 : 680;
    let cur_scale = 1;

    d3.selectAll('.tree-chart').remove();
    // Append the svg object to the body of the page
    let svg = d3.select(".chart")
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
    let root = d3.stratify()
      .id(function(d) { return d.name; })   
      .parentId(function(d) { return d.parent; }) 
      (data);
    // Compute the numeric value for each entity
    root.sum(function(d) { return +d.count })   

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

    const color_range = get_color_range();
    let colorSpace = d3.scaleSequential().domain([data[1].count, data[data.length-1].count])
    .range(color_range)

    // use this information to add rectangles:
    svg.selectAll("rect")
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
            set_cell_tooltip_position(event, tooltip, d);
        })
        .on('mouseout', function (d) {
            tooltip.hide();
        })
        .on("mousemove", function(event, d){
            set_cell_tooltip_position(event, tooltip, d);
        })
        .on('mousedown', function (d) {
            tooltip.hide()
        });

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
            const perc = get_cell_perc_color(data, d);
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
    // sort data by count
    data = _.orderBy(data, [(item)=> new Date(item.date).getTime()], ['asc']);

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

    let clip = svg.append("defs").append("svg:clipPath")
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

    const gy = svg.append("g")
        .call(yAxis, y);
    
    gy.append("g")
    .attr('class', 'area-y-axis')
    .attr("x", margin.left)
    .attr("dx", margin.left)
    .call(d3.axisLeft(y));

    svg.call(zoom)
        .transition()
        .duration(1000)
        .call(zoom.scaleTo, 0, [x(Date.UTC(2001, 8, 1)), 0]);

    function zoomed(event) {
        const xz = event.transform.rescaleX(x);
        path.attr("d", area(data, xz));
        gx.call(xAxis, xz);
        // const yz = event.transform.rescaleY(y);
        // path_y.attr("d", area(data, yz));
        // gy.call(yAxis, yz);
    }

    return svg.node();
}



// Scatter plot
function draw_scatter_chart(data) {
    // sort data by count
    data = _.orderBy(data, ['count'], ['desc']);

    const margin = {top: 20, right: 20, bottom: 20, left: 20},
    width = 1000 - margin.left - margin.right;
    const height = progressChart ? 580 : 660;
    const color_range = get_color_range();
    let color_space = d3.scaleSequential()
    .domain([data[0].count, data[data.length-1].count])
    .range(color_range);

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

    
    const tooltip = d3.tip().attr('class', 'd3-tip')
    .html(function (event, d, x, y) {
        const value = (d.data.count || 0).toLocaleString('en-US');
        const name = d.data.name || 'Greenland';
        return `<div>
        <p>Country: <strong>${name}</strong></p>
        <p>${selectedProperty.label}: <strong>${value}</strong></p>
        </div>`;
    });

    svg.on('mousedown', function (d) {
        // tooltip.hide()
        tooltip.style("opacity", 0);
    });
    svg.attr("width", width)
        .attr("height", height)
        .style("background", 'ivory')
        .append('g')
        .call(tooltip);
    
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
        .attr("fill", d => color_space(d.data.count))
        .on('mouseover', function (event, d) {
            set_cell_tooltip_position(event, tooltip, d);
        })
        .on('mouseout', function (d) {
            tooltip.hide();
        })
        .on("mousemove", function(event, d){
            set_cell_tooltip_position(event, tooltip, d);
        })
        .on('mousedown', function (d) {
            tooltip.hide()
        });

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
            const perc = get_cell_perc_color(data, d);
            const color = perc <= 0.5 ? 'black' : 'white';
            return color;
        });
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
            .text('Top ' + data.length + ' Countries/Areas based on ' + selectedProperty.label)
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

function get_cell_perc_color(data, d) {
    const total = _.reduce(data, (sum, item) => {
        return sum += Number(item.count || 0);
    }, 0);
    count = Number(d.data.count || 0);
    let perc = count * 10 / Number(total);
    perc = perc > 1 ? 1 : perc;
    return perc;
}

function set_cell_tooltip_position(event, tooltip, d) {
    let x = Math.abs(event.pageX) - 50;
    let y = Math.abs(event.pageY) + 15;
    if (y > 620) {
        y = 600;
        if (x > 500) {
            x -= 150;
        } else {
            x += 150;
        }
    }
    tooltip.show(event, d);
    $('.d3-tip').css({"left": (x + "px"), "top": (y + "px")});
}


// Draw lines chart

function toggle_country_list() {
    const panel = d3.select('.country-list');
    panel.selectAll('label').remove();
    const visible = panel.style('display');
    panel.style("display", visible === 'none' ? 'inline-block' : 'none');
    if (visible === 'none') {
        let grp_data = get_grouped_data(chartData, 'location');
        grp_data = _.orderBy(grp_data, ['count'], ['desc']);
        let countries = _.map(grp_data, 'name');
        const top_countries = Object.keys(selected_countries).length === 0;
        if (top_countries) {
            countries.forEach((name, indx) => {
                if (indx < 10) {
                    selected_countries[name] = true;
                }
            });
        }
        countries.sort();

        labels = panel.selectAll(".sel-country")
        .data(countries)
        .enter()
        .append('label')
            .attr('for', function(d,i){ return 'chk-sel-' + _.camelCase(d); })
            .text(function(d, i) {
                return d;
            })
        .append("input")
            .attr('class', 'sel-country')
            .attr("checked", function (d, i) {
                return selected_countries[d];
            })
            .attr("type", "checkbox")
            .attr("id", function(d,i) { return 'chk-sel-' + _.camelCase(d); })
            .on("click", function (ev, d) {
                top_or_selected = 'Selected';
                selected_countries[d] = ev.target.checked;
            });
    }
}


function draw_lines_chart(csv_data) {
    // clean old content if exists
    d3.selectAll('.chart svg.lines-chart, .legend-line, .legend-text, .top-countries').remove();

    // Process data 
    let country_data = get_grouped_data(csv_data, 'location');
    country_data = _.orderBy(country_data, [(item) => {
        return item.count;
    }], ['desc']);
    const top_countries = Object.keys(selected_countries).length === 0;
    if (top_countries) {
        country_data = _.take(country_data, 10);
    } else {
        country_data = country_data.filter(item => selected_countries[item.name]);
    }
    const country_names = country_data.map(item => item.name);
    let lines_data = csv_data.filter(item => country_names.indexOf(item.location) > -1);
    lines_data = get_grouped_data(lines_data, 'date');
    lines_data = lines_data.map(item => {
        item.count = item.count/country_data.length;
        return item;
    });
    lines_data = _.orderBy(lines_data, [(item) => new Date(item.date)], ['asc']);

    // Draw line for average count
    draw_a_line(lines_data, 'Average', 0, country_data.length);

    // Draw a line for each of top/selected countries
    country_data.forEach((country, indx) => {
        let c_data = csv_data.filter(item => item.location === country.name);
        c_data = get_grouped_data(c_data, 'date');
        c_data = _.orderBy(c_data, [(item) => new Date(item.date)], ['asc']);
        draw_a_line(c_data, country.name, indx+1, country_data.length);
    });
}

function draw_a_line(dataset, country_name, indx, country_count) {
    const mappedData = _.keyBy(dataset, 'date');
    // Init configurations
    let bounds, xScale, yScale, xAccessor, yAccessor, clip;
    let svg = d3.select(".chart svg.lines-chart");
    let axesExists = svg.size() > 0;
    let height = progressChart ? 610 : 680;
    let dimensions = {
        width: 1000,
        height: height,
        margin: {
            top: 15,
            right: 25,
            bottom: 20,
            left: 80
        }
    }

    if (!axesExists) {
        xAccessor = d => new Date(d.date);
        yAccessor = d => d.count;
        
        // Create chart dimensions
        dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
        dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

        // Draw canvas
        svg = d3.select(".chart")
        .append("svg")
        .attr("class", "lines-chart")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

        bounds = svg.append("g")
            .attr("transform", `translate(${
                dimensions.margin.left
            }, ${
                dimensions.margin.top
            })`);

        bounds.append("defs").append("clipPath")
            .attr("id", "bounds-clip-path")
            .append("rect")
            .attr("width", dimensions.boundedWidth)
            .attr("height", dimensions.boundedHeight)
        clip = bounds.append("g")
            .attr("clip-path", "url(#bounds-clip-path)")

        // Create scales
        yScale = d3.scaleLinear()
            .domain(d3.extent(dataset, yAccessor))
            .range([dimensions.boundedHeight, 0])

        xScale = d3.scaleTime()
            .domain(d3.extent(dataset, xAccessor))
            .range([0, dimensions.boundedWidth])
    } else {
        bounds = line_chart_state.bounds;
        xScale = line_chart_state.xScale;
        yScale = line_chart_state.yScale;
        xAccessor = line_chart_state.xAccessor;
        yAccessor = line_chart_state.yAccessor;
        clip = line_chart_state.clip;
    }

    const tooltip = d3.tip().attr('class', 'd3-tip')
    .html(function (event, d) {
        const dated_count = (d.data.dated_count || 0).toLocaleString('en-US');
        const total_count = (d.data.total_count || 0).toLocaleString('en-US');
        const name = d.data.name || 'Greenland';
        return `<div>
        <p>Country: <strong>${name}</strong></p>
        <p>Date: <strong>${d.data.date}</strong></p>
        <p>Dated Count: <strong>${dated_count}</strong></p>
        <p>${selectedProperty.label}: <strong>${total_count}</strong></p>
        </div>`;
    });

    svg.on('mousedown', function (d) {
        tooltip.hide()
    });
    svg.append('g').call(tooltip);

    // Draw data
    const lineGenerator = d3.line()
        .x(d => xScale(xAccessor(d)))
        .y(d => yScale(yAccessor(d)));
    const line_data = lineGenerator(dataset);

    const country_colors = ['#6c4242', '#ff1e00', '#00ff0e', '#20BEFF', '#1600ff', '#568f3c', '#00ffd6', '#c4c411', '#212121', '#6e6ae1', '#e929e7'];
    clip.append("path")
    .attr("class", "line")
    .attr("d", line_data)
    .attr("stroke", country_colors[indx%11])
    .style("stroke-dasharray", () => {
        return country_name === 'Average' ? "3, 3" : "0, 0";
    })
    .attr("stroke-width", () => {
        return country_name === 'Average' ? 3 : 2;
    })
    .on('mouseover', function (event, d) {
        show_dated_tip(event);
    })
    .on('mouseout', function (d) {
        tooltip.hide();
    })
    .on("mousemove", function(event, d){
        show_dated_tip(event);
    })
    .on('mousedown', function (d) {
        tooltip.hide()
    });;

    clip.append('path')
    .attr("class", "legend-line")
    .style('stroke', country_colors[indx%11])
    .attr("stroke-width", 2)
    .style("stroke-dasharray", () => {
        return country_name === 'Average' ? "3, 3" : "0, 0";
    })
    .attr('d', `M20,${50+indx*22},L60,${50+indx*22}`);
    
    clip.append('text')
    .attr("class", "legend-text")
    .attr('fill', country_colors[indx%11])
    .attr("x", 65)
    .attr("y", 55+indx*22)
    .html(country_name);

    // Draw peripherals
    if (!axesExists) {
        clip.append('text')
        .attr("class", "top-countries")
        .attr('fill', 'Black')
        .attr("x", 15)
        .attr("y", 30)
        .html(`${top_or_selected} ${country_count} Countries`);

        const yAxisGenerator = d3.axisLeft()
            .scale(yScale)

        const yAxis = bounds.append("g")
            .attr("class", "y-axis")
            .call(yAxisGenerator)

        const xAxisGenerator = d3.axisBottom()
            .scale(xScale)

        const xAxis = bounds.append("g")
            .attr("class", "x-axis")
            .style("transform", `translateY(${dimensions.boundedHeight}px)`)
            .call(xAxisGenerator)
    }


    if (!axesExists) {
        line_chart_state = {bounds, xScale, yScale, xAccessor, yAccessor, clip};
    }

    function show_dated_tip(event) {
        const mousePosition = d3.pointer(event);
        let date = xScale.invert(mousePosition[0]);
        date = moment(date).format("LL").replace('00', '20');
        const dated_count = mappedData[date] && mappedData[date].count || 0;
        const cur_date = new Date(date);
        const total_count = _.reduce(dataset, (sum, item) => {
            const in_date = new Date(item.date).getTime() <= cur_date.getTime();
            return sum += in_date ? (item.count || 0) : 0;
        }, 0);
        set_cell_tooltip_position(event, tooltip, {data: {name: country_name, date, dated_count, total_count}});
    }

}


// Common methods

function get_color_range() {
    let color_range;
    switch (selectedProperty.name) {
        case "total_cases":
        color_range = ["#a30f15", "#e39295"];
        break;
        case "total_deaths":
        color_range = ["#ff0000", "#f4a2a2"];
        break;
        case "vaccinated":
        color_range = ["#008d00", "#9bf29b"];
        break;
    }
    return color_range;
}