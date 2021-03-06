let selectedProperty, percentType, covid_data, dataSource, worldMapData;
let mappedPopulation;
const prop_fields = ['new_cases', 'new_deaths', 'total_cases', 'people_vaccinated', 'total_deaths', 'weekly_cases', 'weekly_deaths', 'biweekly_cases', 'biweekly_deaths'].map(field => {
    const label = _.startCase(field.split('_').join(' '));
    return {
        name: field,
        label
    };
});

window.onload = function () {
    load_options();

    load_map_topology()
    .then(() => {        
        return load_covid_data();
    })
   .then(() => {
        draw_world_map();
    });
}

async function load_map_topology() {
    let worldMapJson = './data/world.geo.json';
    worldMapData = await d3.json(worldMapJson);
}

function load_options() {
    const modes = [
        {name: 'world-map', label: 'Map'},
        {name: 'table', label: 'Table'},
        {name: 'chart', label: 'Chart'}
    ];
    d3.select("#drp-mode")
    .selectAll('mode-options')
    .data(modes)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    
    d3.select("#drp-mode").on("change", function(d) {
        const selectedOption = d3.select(this).property("value");
        d3.selectAll('.container-box .item').style("display", "none");
        d3.select('.' + selectedOption).style("display", "inline-block");
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
        draw_world_map();
    });

    // 
    const percent_options = [
        {name: 'population', label: 'Country Population'},
        {name: 'total_count', label: 'Total Occurance'}
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
        draw_world_map();
    });

    // Data sources
    const data_src_options = [
        {name: 'owid', label: 'OWID'},
        {name: 'ecdc', label: 'ECDC'},
        {name: 'jhu', label: 'JHU'},
        {name: 'who', label: 'WHO'}
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
            draw_world_map();
        });
    });
}

async function load_covid_data() {
    let covidCsv = `./data/${dataSource}/full_data.csv`;
    covid_data = await d3.csv(covidCsv);
    total_cases = _.reduce(covid_data, (sum, item) => {
        return sum += Number(item.total_cases || 0);
    }, 0);

    covid_data = _.map(covid_data, (record) => {
        const year = new Date(record['last_updated_date']).getFullYear();
        const total_cases = Number(Number(record['total_cases'] || 0).toFixed(0));
        const population = record.population || (mappedPopulation && mappedPopulation[record.location] && mappedPopulation[record.location].population);
        return {
            ...record,
            country: record['location'],
            population,
            total_cases,
            code: record['iso_code'],
            date: record['last_updated_date'],
            year
        };
    });
    if (!mappedPopulation) {
        mappedPopulation = _.keyBy(covid_data, 'location');
    }

    covid_data = _(covid_data)
        .keyBy('code')
        .merge(_.keyBy(worldMapData.features, 'properties.iso_a3'))
        .values()
        .value();
}
