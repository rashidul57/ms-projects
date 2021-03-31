let sortInfo, table_data, tableFields;
const filter_params = {field: undefined, start: undefined, end: undefined};

async function draw_table() {
    let covid_data = await load_covid_data();

    tableFields = _.cloneDeep(prop_fields);
    tableFields.unshift({name: 'population', label: 'Population'});
    tableFields.unshift({name: 'country', label: 'Country'});
    tableFields.push({name: 'perc_vaccinated', label: '% Vaccinated'});
    tableFields.push({name: 'perc_infected', label: '% Infected'});
    tableFields.push({name: 'perc_death', label: '% Death'});

    load_filter_options();

    if (!sortInfo) {
      set_sort_info(tableFields[0]);
    }
    const dataProps = Object.keys(covid_data[0]);
    const tableProps = tableFields.map(field => field.name);
    covid_data = covid_data.map(item => {
      dataProps.forEach(prop => {
          if (tableProps.indexOf(prop) === -1) {
              delete item[prop];
          }
        });
        return item;
    });
    const header = {};
    tableFields.forEach(field => {
        Object.assign(header, {
            [field.name]: field.label
        });
    });
    
    table_data = covid_data
      .filter(item => Object.keys(item).length)
      .map(item => {
          item.vaccinated = parseInt(mapped_owid_data[item.country] && mapped_owid_data[item.country].people_vaccinated || 0);
          item.perc_vaccinated = item.population ? (item.vaccinated/item.population) : 0;
          item.perc_infected = item.population ? (item.total_cases/item.population) : 0;
          item.perc_death = item.total_cases ? (item.total_deaths/item.total_cases) : 0;
          item.perc_vaccinated = d3.format(".2%")(item.perc_vaccinated);
          item.perc_infected = d3.format(".2%")(item.perc_infected);
          item.perc_death = d3.format(".2%")(item.perc_death);
          return item;
      });
    table_data.unshift(header);
    refresh_table(table_data, header);
}

function load_filter_options() {
    d3.select("#drp-table-fields option").remove();

    const filter_fields = tableFields.filter(field => field.name !== 'country');
    d3.select("#drp-table-fields")
    .selectAll('table-filter-fields')
    .data(filter_fields)
    .enter()
    .append('option')
    .text((d) => { return d.label; })
    .attr("value", (d) => { return d.name; });

    d3.selectAll(".btn-apply-filter, .btn-clear-filter")
    .on("click", function(ev) {
        const clear = ev.target.className.indexOf('clear') > -1;
        if (clear) {
            d3.selectAll("#range-start, #range-end").property("value", "");
            Object.assign(filter_params, {start:undefined, end:undefined, field:undefined});
        }
        apply_filter();
    });

    d3.selectAll("#range-start, #range-end, #drp-table-fields")
    .on("change", function(ev, d) {
        let start = d3.select("#range-start").property("value");
        start = start ? Number(start) : undefined;
        let end = d3.select("#range-end").property("value");
        end = end ? Number(end) : undefined;
        const field = d3.select("#drp-table-fields").property("value");
        Object.assign(filter_params, {start, end, field});
    });
}

function apply_filter() {
    const header = table_data[0];
    // let data = table_data;
    const t_data = _.cloneDeep(table_data);
    let data = t_data.splice(1);
    if (filter_params.start !== undefined && filter_params.end !== undefined && filter_params.field) {
        const f_name = filter_params.field;
        data = data.filter(item => {
            let value = Number((item[f_name] || '').toString().replace('%', ''));
            return value >= filter_params.start && value <= filter_params.end;
        });
    } else {
        const t_data = _.cloneDeep(table_data);
        data = t_data.splice(1);
    }
    data = _.orderBy(data, [(item) => {
        let value = item[sortInfo.name] || '';
        if (value.toString().indexOf('%')) {
            value = Number(value.toString().replace('%', ''));
        }
        return value;
    }], [sortInfo.order]);
    data.unshift(header);
    refresh_table(data, header);
    
}

function set_sort_info(field) {
    sortInfo = _.cloneDeep(field);
    sortInfo.order = 'asc';
}

function sortTable(d) {
    const sort_field = tableFields.find(field => field.label === d);
    if (sort_field.name === sortInfo.name) {
        sortInfo.order = sortInfo.order === 'asc' ? 'desc' : 'asc';
    } else {
        set_sort_info(sort_field);
    }
    apply_filter();
}

function refresh_table(table_data, header) {
    d3.select(".table").selectAll("tr").remove();
    const tr = d3.select(".table")
    .selectAll("tr")
    .data(table_data)
    .enter()
    .append("tr");

    const headerCaptions = Object.values(header);
    const td = tr.selectAll("td")
    .data(function(d, i) {
      return tableFields.map(field => {
          return d[field.name];
      });
    })
    .enter()
    .append("td")
    .attr('class', function(d, i){
        return i > 0 ? 'ta-right' : '';
    })
    .text(function(d, i) {
      if (i > 0 && typeof(d) == 'number') {
        d = d3.format(",")(d);
      }
      return d;
    })
    .on('click', (ev, d) => {
        sortTable(d);
    });

    td.append('i')
    .attr('class', 'sort-icon material-icons md-18')
    .text(function(d) { 
        let text = '';
        if (headerCaptions.indexOf(d) > -1 && sortInfo.label === d) {
            text = sortInfo.order === 'asc' ? 'arrow_downward' : 'arrow_upward';
        }
        return text;
    })
    .on('click', (ev, d) => {
        sortTable(d);
    });
}

