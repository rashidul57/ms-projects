let selectedProperty, percentType, covid_data;
window.onload = function () {
    
    load_data().then(() => {
        load_options();
        load_world_map();
    });
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
    });;

    const prop_options = [
        {name: 'total_cases', label: 'Total Cases'},
        {name: 'new_cases', label: 'New Cases'},
        {name: 'total_deaths', label: 'Total Deaths'},
        // {name: 'reproduction_rate', label: 'Reproduction Rate', type: 'rate'},
        {name: 'icu_patients', label: 'ICU Patients'},
        {name: 'total_tests', label: 'Total Tests'},
        // {name: 'positive_rate', label: 'Positive Rate', type: 'rate'},
        {name: 'people_vaccinated', label: 'Vaccinated'},
        // {name: 'population', label: 'Population'},
        // {name: 'population_density', label: 'Population Density'},
        {name: 'median_age', label: 'Median Age'},
        {name: 'aged_65_older', label: 'Aged Over 65'},
        {name: 'aged_70_older', label: 'Agred Over 70'},
        {name: 'diabetes_prevalence', label: 'Diabetes Prevalence'},
        // {name: 'life_expectancy', label: 'Life Expectancy'}
    ];
    selectedProperty = prop_options[0];
    d3.select("#drp-property")
    .selectAll('prop-options')
    .data(prop_options)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });
    
    d3.select("#drp-property").on("change", function(d) {
        const property = d3.select(this).property("value");
        selectedProperty = prop_options.find(opt => opt.name === property);
        load_world_map();
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
        load_world_map();
    });
}

async function load_data() {
    let covidCsv = './data/owid/full-data.csv';
    let worldMapJson = './data/world.geo.json';
    covid_data = await d3.csv(covidCsv);
    const worldMap = await d3.json(worldMapJson);

    total_cases = _.reduce(covid_data, (sum, item) => {
        return sum += Number(item.total_cases || 0);
    }, 0);

    covid_data = _.map(covid_data, (record) => {
        const year = new Date(record['last_updated_date']).getFullYear();
        const total_cases = Number(Number(record['total_cases'] || 0).toFixed(0));
        return {
            ...record,
            country: record['location'],
            population: record['population'],
            total_cases,
            code: record['iso_code'],
            date: record['last_updated_date'],
            year
        };
    });

    covid_data = _(covid_data)
        .keyBy('code')
        .merge(_.keyBy(worldMap.features, 'properties.iso_a3'))
        .values()
        .value();
}