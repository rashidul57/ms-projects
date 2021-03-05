
window.onload = function () {
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
    const svg = container.append("svg");

    const tooltip = d3.tip().attr('class', 'd3-tip')
        .html(function (event, d) {
            if (d.country) {
                // tooltip.hide();
                const cases = d.total_cases.toLocaleString('en-US');
                return `<div>
                <p>Country: ${d.country}</p>
                <p>Infected: ${cases}</p>
                </div>`;
            }
        });
    // var tip = d3.tip().attr('class', 'd3-tip').html((EVENT,d)=> d );

    svg.on('mousedown', function (d) {
        tooltip.hide()
    });
    svg.attr("width", width)
        .attr("height", height)
        //.style("background", 'ivory')
        .append('g')
        .call(tooltip);

    container.call(zoom);

    let last_country;
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
    })
    .on("mousemove", function(event, d){
        update_tooltip_position(event, tooltip, d);
    })
    .on('mousedown', function (d) {
        // tooltip.hide()
    });


    load_data().then(covid_data => {
        load_options(covid_data);
        render(path, covid_data);
    });
    
}

function load_options() {
    const modes = [
        {name: 'map', label: 'Map'},
        {name: 'table', label: 'Table'},
        {name: 'chart', label: 'Chart'}
    ];
    d3.select("#drp-mode")
    .selectAll('mode-options')
    .data(modes)
    .enter()
    .append('option')
    .text(function (d) { return d.label; })
    .attr("value", function (d) { return d.name; });
    
    const prop_options = [
        {name: 'total_cases', label: 'Total Cases'},
        {name: 'new_cases', label: 'New Cases'},
        {name: 'total_deaths', label: 'Total Deaths'},
        {name: 'reproduction_rate', label: 'Reproduction Rate'},
        {name: 'icu_patients', label: 'ICU Patients'},
        {name: 'total_tests', label: 'Total Tests'},
        {name: 'positive_rate', label: 'Positive Rate'},
        {name: 'people_vaccinated', label: 'Vaccinated'},
        {name: 'population', label: 'Population'},
        {name: 'population_density', label: 'Population Density'},
        {name: 'median_age', label: 'Median Age'},
        {name: 'aged_65_older', label: 'Aged Over 65'},
        {name: 'aged_70_older', label: 'Agred Over 70'},
        {name: 'diabetes_prevalence', label: 'Diabetes Prevalence'},
        {name: 'life_expectancy', label: 'Life Expectancy'}
    ];
    d3.select("#drp-property")
    .selectAll('prop-options')
    .data(prop_options)
    .enter()
    .append('option')
    .text(function (d) { return d.label; })
    .attr("value", function (d) { return d.name; });
}

async function load_data() {
    let covidCsv = './data1/covid.csv';
    let worldMapJson = './data1/world.geo.json';
    let covid_data = await d3.csv(covidCsv);
    const worldMap = await d3.json(worldMapJson);

    total_cases = _.reduce(covid_data, (sum, item) => {
        return sum += Number(item.total_cases || 0);
    }, 0);

    covid_data = _.map(covid_data, (record) => {
        const year = new Date(record['last_updated_date']).getFullYear();
        const total_cases = Number(Number(record['total_cases'] || 0).toFixed(0));
        return {
            country: record['location'],
            population: record['population'],
            total_cases,
            code: record['iso_code'],
            date: record['last_updated_date'],
            year
        };
    });

    const formatted_covid_data = _(covid_data)
        .keyBy('code')
        .merge(_.keyBy(worldMap.features, 'properties.iso_a3'))
        .values()
        .value();

    return formatted_covid_data;
}

function update_tooltip_position(event, tooltip, d) {
    const x = Math.abs(event.pageX) - 50;
    let y = Math.abs(event.pageY) + 15;
    tooltip.show(event, d)
    $('.d3-tip').css({"left": (x + "px"), "top": (y + "px")});
}

function fill_country(d, action) {
    // let perc = Number(d.total_cases || 0) * 100 /total_cases;
    let perc = Number(d.total_cases || 0) * 100 /Number(d.population);
    perc = perc > 1 ? 1 : perc;
    const factor = action === 'over' ? 0.6 : 1;
    perc = perc * factor;
    const color = `rgba(255, 0, 0, ${perc})`;
    return color;
}

