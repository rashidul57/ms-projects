
function load_world_map() {
    const width = 1000;
    const height = 700;

    const projection = d3.geoMercator()
        .translate([width / 2, window.innerHeight / 1.6])    // translate to center of screen
        .scale([150]);

    const path = d3.geoPath().projection(projection);
    let zoom = d3.zoom()
        .scaleExtent([1, 10])
        .translateExtent([[-500,-300], [1500, 1000]])
        .on('zoom', () => {
            // svg.attr('transform', d3.event.transform)
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

    // container.call(zoom);

    const render = (path, data) => svg.selectAll()
    .data(data)
    .enter()
    .append('path')
    .attr('d', path)
    .attr('class', 'country')
    .style('fill', function (d) {
        return fill_country(d, 'out');
    })
    .on('mouseover', function (event, d) {
        d3.select(this)
        .style('fill', function () {
            return fill_country(d, 'over');
        });
        last_country = d.country;
        update_tooltip_position(event, tooltip, d);
    })
    .on('mouseout', function (d) {
        d3.select(this)
        .style('fill', function (d) {
            return fill_country(d, 'out');
        });
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
    let total = d.population;
    if (percentType === 'total_count') {
        total = _.reduce(covid_data, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
    }
    const count = Number(d[selectedProperty.name] || 0);
    let perc = count * 100 / Number(total);
    perc = perc > 1 ? 1 : perc;
    const factor = action === 'over' ? 0.6 : 1;
    perc = perc * factor;
    const color = `rgba(255, 0, 0, ${perc})`;
    return color;
}