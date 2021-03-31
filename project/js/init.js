let selectedProperty, percentType, chartType, worldMapData, selectedMode;
let mapped_owid_data, progressChart;
const prop_fields = ['total_cases', 'total_deaths', 'vaccinated', 'total_tests'].map(field => {
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
            d3.selectAll('.chart.item').classed('progress-visible', visibility === 'inline-block');
            if (chartType === 'line') {
                d3.selectAll('.btn-change-country').style("display", "inline-block");
            }
            draw_chart();
            break;
    }
}

async function load_jhu_data() {
    let covidCsv = `./data/jhu/full_data.csv`;
    let csv_data = await d3.csv(covidCsv);
    csv_data = csv_data.filter(item => {
        return ['World', 'North America', 'Europe', 'Asia', 'Africa', 'European Union', 'South America'].indexOf(item.location) === -1;
    });
    return csv_data;
}

async function load_owd_data() {
    let owid_path = `./data/owid/full_data.csv`;
    const owid_data = await d3.csv(owid_path);
    mapped_owid_data = _.keyBy(owid_data, 'location');
}

async function load_covid_data() {
    let covid_data = await load_jhu_data();
    await load_owd_data();
    total_cases = _.reduce(covid_data, (sum, item) => {
        return sum += Number(item.total_cases || 0);
    }, 0);

    covid_data = _.map(covid_data, (record) => {
        const year = new Date(record['last_updated_date']).getFullYear();
        const total_cases = Number(Number(record['total_cases'] || 0).toFixed(0));
        const population = Number(record.population || (mapped_owid_data && mapped_owid_data[record.location] && mapped_owid_data[record.location].population));
        const code = record.iso_code || (mapped_owid_data && mapped_owid_data[record.location] && mapped_owid_data[record.location].iso_code);
        const vaccinated = parseInt(mapped_owid_data[record.location] && mapped_owid_data[record.location].people_vaccinated || 0);
        const rec = {
            ...record,
            country: record['location'],
            population,
            total_cases,
            code,
            date: record['last_updated_date'] || record['date'],
            year,
            vaccinated
        };
        return rec;
    });

    const grouped_data = _.groupBy(covid_data, 'country');
    covid_data = _.map(grouped_data, ((items, country) => {
        const record = {...items[items.length-1]};
        prop_fields.forEach(field => {
            items.forEach(item => {
                record[field.name] = Number(item[field.name]) || 0;
                record[field.name] += Number(item[field.name]) || 0;
            });
        });
        return record;
    }));

    return covid_data;
}

function get_grouped_data1(csv_data, group_by) {
    let grouped_data = _.groupBy(csv_data, group_by);
    grouped_data = _.map(grouped_data, (items, key) => {
        const count = _.reduce(items, (sum, item) => {
            return sum += Number(item[selectedProperty.name] || 0);
        }, 0);
        // const item = {
        //     name: key,
        //     count,
        //     code: items[0].code
        // };
        // if (group_by === 'date' && !item.date) {
        //     item.date = key;
        // }
        const record = {
            ...items[items.length-1],
            count,
            name: key,
        };
        prop_fields.forEach(field => {
            items.forEach(item => {
                record[field.name] = Number(item[field.name]) || 0;
                record[field.name] += Number(item[field.name]) || 0;
            });
        });
        return record;
    });
    return grouped_data;
}

async function load_map_data() {
    const worldMapJson = './data/world.geo.json';
    const worldMapData = await d3.json(worldMapJson);
    let covid_data = await load_covid_data();
    covid_data = _(covid_data)
        .keyBy('code')
        .merge(_.keyBy(worldMapData.features, 'properties.iso_a3'))
        .values()
        .value();
    return covid_data;
}