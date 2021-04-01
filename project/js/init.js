let selectedProperty, percentType, chartType, worldMapData, selectedMode;
let progressChart, full_covid_data;
const prop_fields = ['new_cases', 'total_cases', 'new_deaths', 'total_deaths', 'reproduction_rate', 'vaccinated', 'total_tests', 'icu_patients', 'hosp_patients', 'positive_rate'].map(field => {
    const label = _.startCase(field.split('_').join(' '));
    return {
        name: field,
        label,
        type: 'number'
    };
});

window.onload = init;

async function init() {
    load_options();
    update_ui();
}


async function load_options() {
    const modes = [
        {name: 'world-map', label: 'Map'},
        {name: 'chart', label: 'Chart'},
        {name: 'table', label: 'Table'}
    ];
    d3.select("#drp-mode")
    .selectAll('mode-options')
    .data(modes)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    selectedMode = modes[0].name;
    
    d3.select("#drp-mode").on("change", function(d) {
        d3.selectAll('.' + selectedMode + ' svg, tr').remove();
        selectedMode = d3.select(this).property("value");
        update_ui();
    });

    selectedProperty = prop_fields[0];
    d3.select("#drp-property")
    .selectAll('prop-options')
    .data(prop_fields)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    
    d3.select("#drp-property").on("change", function(d) {
        const property = d3.select(this).property("value");
        selectedProperty = prop_fields.find(opt => opt.name === property);
        update_ui();
    });

    // 
    const percent_options = [
        {name: 'population', label: 'Country Population'},
        {name: 'total_count', label: 'Total Occurrence'}
    ];
    percentType = percent_options[0].name;
    d3.select("#drp-percent-type")
    .selectAll('percent-options')
    .data(percent_options)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    
    d3.select("#drp-percent-type").on("change", function(d) {
        const property = d3.select(this).property("value");
        percentType = percent_options.find(opt => opt.name === property).name;
        update_ui();
    });

    // Chart options
    const chart_options = [
        {name: 'line', label: 'Line Chart'},
        {name: 'bar', label: 'Bar Chart'},
        {name: 'area', label: 'Area Chart'},
        {name: 'tree', label: 'Tree Chart'},
        {name: 'scatter', label: 'Scatter Chart'}
    ];
    chartType = chart_options[0].name;
    d3.select("#drp-chart-type")
    .selectAll('data-chart-type')
    .data(chart_options)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    
    d3.select("#drp-chart-type").on("change", function(d) {
        const value = d3.select(this).property("value");
        chartType = chart_options.find(opt => opt.name === value).name;
        playing = false;
        update_ui();
    });

    d3.select("#chk-progress").on("change", function(d) {
        progressChart = d3.select(this).property('checked');
        update_ui();
    });

    d3.select(".btn-change-country")
    .on("click", function (){
        toggle_country_list();
    });
    d3.select(".btn-apply-country-sel")
    .on("click", function (){
        draw_lines_chart(_.cloneDeep(chartData));
        toggle_country_list();
    });
    
}

function update_ui() {
    // Container [map, chart, table] show/hide
    d3.selectAll('.item').style("display", "none");
    d3.selectAll('.' + selectedMode).style("display", "inline-block");
    
    switch (selectedMode) {
        case 'world-map':
            d3.selectAll(".calc-by, .data-source, .field-prop").style("display", "inline-block");
            draw_world_map();
            break;
        case 'table':
            d3.selectAll(".calc-by, .data-source, .field-prop").style("display", "none");
            d3.selectAll(".table-filter-fields, .table-filter-range, .btn-apply-filter, .btn-clear-filter").style("display", "inline-block");
            draw_table();
            break;
        case 'chart':
            let visibility = progressChart ? 'inline-block' : 'none';
            d3.selectAll('.progress-container, .summary-svg').style("display", visibility);
            d3.selectAll('.chart-option, .field-prop, .progress-checkbox').style("display", "inline-block");
            d3.selectAll('.chart').classed('progress-visible', visibility === 'inline-block');
            if (chartType === 'line') {
                d3.selectAll('.btn-change-country').style("display", "inline-block");
            }
            draw_chart();
            break;
    }
}


function get_grouped_data(csv_data, group_by) {
    let grouped_data = _.groupBy(csv_data, group_by);
    grouped_data = _.map(grouped_data, (items, key) => {
        const count = _.reduce(items, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
        const item = {
            ...items[items.length-1],
            name: key,
            count,
            [selectedProperty.name]: count,
            code: items[0].code
        };
        if (group_by === 'date' && !item.date) {
            item.date = key;
        }
        return item;
    });
    return grouped_data;
}


/**
 * Load whole covid data
 */
async function load_covid_data() {
    let covidCsv = `./data/covid-owid.csv`;
    let covid_data = await d3.csv(covidCsv);
    covid_data = covid_data.filter(item => {
        return ['World', 'North America', 'Europe', 'Asia', 'Africa', 'European Union', 'South America'].indexOf(item.location) === -1;
    });
    total_cases = _.reduce(covid_data, (sum, item) => {
        return sum += Number(item.total_cases || 0);
    }, 0);

    full_covid_data = _.map(covid_data, (record) => {
        const year = new Date(record['last_updated_date']).getFullYear();
        const total_cases = Number(Number(record['total_cases'] || 0).toFixed(0));
        const country = record['location'];
        const rec = {
            ...record,
            country,
            population: record.population,
            total_cases,
            code: record.iso_code,
            date: record['last_updated_date'] || record['date'],
            year,
            vaccinated: record.people_vaccinated
        };
        return rec;
    });

    return full_covid_data;
}

/**
 * Load world map topology data
 */
async function load_map_data() {
    const worldMapJson = './data/world.geo.json';
    const worldMapData = await d3.json(worldMapJson);
    let covid_data = await load_covid_data();
    covid_data = get_grouped_data(covid_data, 'country');
    covid_data = _(covid_data)
        .keyBy('code')
        .merge(_.keyBy(worldMapData.features, 'properties.iso_a3'))
        .values()
        .value();
    return covid_data;
}