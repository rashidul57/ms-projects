let selectedProperty, percentType, covid_data, dataSource, chartType, worldMapData, selectedMode;
let mappedCovidData, progressChart;
const prop_fields = ['total_cases', 'vaccinated', 'total_deaths'].map(field => {
    const label = _.startCase(field.split('_').join(' '));
    return {
        name: field,
        label
    };
});

window.onload = init;

async function init() {
    load_options();
    update_ui();
}


async function load_map_data() {
    let worldMapJson = './data/world.geo.json';
    worldMapData = await d3.json(worldMapJson);
    await load_covid_data();
}

function load_options() {
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

    // Data sources
    const data_src_options = [
        {name: 'who', label: 'WHO'},
        {name: 'owid', label: 'OWID'},
        {name: 'ecdc', label: 'ECDC'},
        {name: 'jhu', label: 'JHU'}
    ];
    dataSource = data_src_options[0].name;
    d3.select("#drp-data-source")
    .selectAll('data-source-options')
    .data(data_src_options)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    
    d3.select("#drp-data-source").on("change", function(d) {
        const property = d3.select(this).property("value");
        dataSource = data_src_options.find(opt => opt.name === property).name;
        load_covid_data().then(() => {
            update_ui();
        });
    });

    // Data sources
    const chart_options = [
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
            let visibility = 'none';
            if ((progressChart || (!progressChart && chartType === 'bar'))) {
                visibility = 'inline-block';
            }
            const chk_progress_vis = chartType === 'bar' ? 'none' : 'inline-block';
            d3.selectAll('.progress-mode').style("display", chk_progress_vis);
            d3.selectAll('.progress-container, .summary-svg').style("display", visibility);
            d3.selectAll('.chart-option, .field-prop').style("display", "inline-block");
            d3.selectAll('.chart.item').classed('progress-visible', visibility === 'inline-block');
            draw_chart();
            break;
    }
}

async function load_covid_data() {
    let covidCsv = `./data/${dataSource}/full_data.csv`;
    covid_data = await d3.csv(covidCsv);
    total_cases = _.reduce(covid_data, (sum, item) => {
        return sum += Number(item.total_cases || 0);
    }, 0);

    if (!mappedCovidData && covid_data.columns.indexOf('population') === -1) {
        let populationUrl = `./data/owid/full_data.csv`;
        const population_data = await d3.csv(populationUrl);
        mappedCovidData = _.keyBy(population_data, 'location');
    }

    covid_data = _.map(covid_data, (record) => {
        const year = new Date(record['last_updated_date']).getFullYear();
        const total_cases = Number(Number(record['total_cases'] || 0).toFixed(0));
        const population = Number(record.population || (mappedCovidData && mappedCovidData[record.location] && mappedCovidData[record.location].population));
        const code = record.iso_code || (mappedCovidData && mappedCovidData[record.location] && mappedCovidData[record.location].iso_code);
        const rec = {
            ...record,
            country: record['location'],
            population,
            total_cases,
            code,
            date: record['last_updated_date'] || record['date'],
            year
        };
        return rec;
    });
    if (!mappedCovidData) {
        mappedCovidData = _.keyBy(covid_data, 'location');
    }

    const grouped_data = _.groupBy(covid_data, 'country');
    covid_data = _.map(grouped_data, ((items, country) => {
        // const record = {country, population: items[0].population, code: items[0].code};
        const record = {...items[items.length-1]};
        prop_fields.forEach(field => {
            items.forEach(item => {
                record[field.name] = Number(item[field.name]) || 0;
                record[field.name] += Number(item[field.name]) || 0;
            });
        });
        return record;
    }));

    covid_data = _(covid_data)
        .keyBy('code')
        .merge(_.keyBy(worldMapData.features, 'properties.iso_a3'))
        .values()
        .value();
}
