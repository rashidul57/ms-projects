
async function draw_world_map() {

    let covid_data = await load_map_data();

    const width = 1000;
    const height = 700;

    const projection = d3.geoMercator()
        .translate([width / 2, window.innerHeight / 1.6])    // translate to center of screen
        .scale([150]);

    const path = d3.geoPath().projection(projection);
    let zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[-500,-300], [1500, 1000]])
        .on('zoom', (event) => {
            svg.attr('transform', event.transform)
        });

    const container = d3.select(".world-map");
    container.selectAll("svg").remove();
    const svg = container.append("svg");
    const tooltip = d3.tip().attr('class', 'd3-tip')
        .html(function (event, d) {
            const value = (d[selectedProperty.name] || 0).toLocaleString('en-US');
            const country = d.country || 'Greenland';
            return `<div>
            <p>Country: <strong>${country}</strong></p>
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

    container.call(zoom);

    const color_range = get_color_range();
    const min_count = _.minBy(covid_data, selectedProperty.name)[selectedProperty.name];
    const max_count = _.maxBy(covid_data, selectedProperty.name)[selectedProperty.name];

    let color_space = d3.scaleSequential()
    .domain([max_count, min_count])
    .range(color_range);

    const render = (path, data) => svg.selectAll()
    .data(data)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('class', 'country')
    .style('stroke-width', 1)
    .style('stroke', 'darkslategrey')
    .style('fill', function (d) {
        const count = d[selectedProperty.name];
        const color = color_space(count);
        return color;
    })
    .on('mouseover', function (event, d) {
        d3.select(this)
        .style('stroke-width', 2)
        .style('stroke', 'black');

        update_tooltip_position(event, tooltip, d);
    })
    .on('mouseout', function (d) {
        d3.select(this)
        .style('stroke-width', 1)
        .style('stroke', 'darkslategrey');

        tooltip.hide();
    })
    .on("mousemove", function(event, d){
        update_tooltip_position(event, tooltip, d);
    })
    .on('mousedown', function (d) {
        tooltip.hide()
    });

    render(path, covid_data);
}

function update_tooltip_position(event, tooltip, d) {
    const x = Math.abs(event.pageX) - 50;
    let y = Math.abs(event.pageY) + 15;
    tooltip.show(event, d);
    $('.d3-tip').css({"left": (x + "px"), "top": (y + "px")});
}

function fill_country(d, action) {
    let total = Number(d.population || 0);
    if (percentType === 'total_count') {
        total = _.reduce(covid_data, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
    }
    count = Number(d[selectedProperty.name] || 0);
    let perc = count * 100 / Number(total);
    perc = perc > 1 ? 1 : perc;
    const factor = action === 'over' ? 0.6 : 1;
    perc = perc * factor;
    let color = `rgba(255, 0, 0, ${perc})`;
    if (selectedProperty.name.indexOf('vaccinated') > -1) {
        color = `rgba(46, 114, 101, ${perc})`;
    }
    return color;
}
