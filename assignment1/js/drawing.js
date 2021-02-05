let maxPercColor,secMaxPercColor;

async function add_left_bar_texts() {
    const data = await d3.json("./../data/left-bar-text.json");
    const wrapper = d3.select("#wrapper")
    wrapper
        .selectAll("text")
        .data(data)
        .enter()
        .append('text')
        .transition()
        .duration(1000)
        .style("position", 'absolute')
        .style("left", function(d){ return d.position.left;})
        .style("top", function(d){ return d.position.top;})
        .style("font-size", (d) => {return d.fontSize})
        .style("font-weight", (d) => {return d.fontWeight || 'inherit'})
        .style("color", (d) => {return d.color})
        .text(d => d.text)
}

async function draw_business_impact() {
    const data = await d3.json("./../data/business-impact-donut.json");
    // reused all over the page
    maxPercColor = data.colors[1];
    secMaxPercColor = data.colors[4];

    const title_svg = d3.select("#wrapper")
        .append('svg')
        .attr("width", 200)
        .attr("height", 40)
        .style("position", 'absolute')
        .style("left", '250px')
        .style("top", '15px')

    title_svg
    .append('text')
    .transition()
    .duration(1000)
    .attr('font-size', '15px')
    .style("font-weight", '400')
    .attr('dx', 0)
    .attr('dy', 20)  
    .text(data.title);

    title_svg.append('text')
    .transition()
    .duration(1000)
    .attr('font-size', '13px')
    .style("font-weight", '400')
    .attr('dx', 0)
    .attr('dy', 36)  
    .text(data.title2);

    const width = 140,
        height = 140,
        radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal()
        .range(data.colors);

    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(15);

    const labelArc = d3.arc()
        .outerRadius(radius - 55)
        .innerRadius(radius - 40);

    const pie = d3.pie()
        .sort(null)
        .value((d) => { return d; });

    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 170)
        .style("position", 'absolute')
        .style("left", '250px')
        .style("top", '70px')
        .append("g")
        .attr("transform", "translate(" + ((width / 2) + 10) + "," + ((height / 2) + 10)  + ")");

    const arc_g = svg.selectAll(".arc")
    .data(pie(data.values))
    .enter()
    .append("g")
    .attr("class", "arc");

    arc_g.append("path")
    .transition()
    .duration(1000)
    .attr("d", arc)
    .style("fill", (d) => { return color(d.data); });

    arc_g.append("text")
    .transition()
    .duration(1000)
    .attr("transform", (d) => {return "translate(" + labelArc.centroid(d) + ")";})
    .attr("dx", (d) => {return data.label[d.data].left + 'px';})
    .attr("dy", (d) => {return data.label[d.data].top + 'px';})
    .style("font-size", '15px')
    .style("font-weight", 'bold')
    .style("fill", (d) => {return data.label[d.data].color;})
    .text((d) => { return d.data; });

    arc_g.append("text")
    .transition()
    .duration(1000)
    .attr("transform", (d) => {return "translate(" + labelArc.centroid(d) + ")";})
    .attr("dx", (d) => {
        const buffer = d.data > 9 ? 17 : 8;
        return (data.label[d.data].left + buffer) + 'px';
    })
    .attr("dy", (d) => {return data.label[d.data].top + 'px';})
    .style("font-size", '12px')
    .style("fill", (d) => {return data.label[d.data].color;})
    .text((d) => { return '%'; });
    
    const note_g = svg.selectAll(".hint")
    .data(pie(data.values))
    .enter()
    .append("g")
    .attr("class", "hint");

    note_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left})
    .attr('y', (d) => { return data.hints[d.data].top - 10})
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d) => { return color(d.data);});

    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left + 15})
    .attr('y', (d) => { return data.hints[d.data].top - 3})
    .style("font-size", '10px')
    .style("font-weight", '500')
    .text(d => {return data.hints[d.data].key})

    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left + 15})
    .attr('y', (d) => { return data.hints[d.data].top + 7})
    .style("font-size", '8px')
    .text(d => {return data.hints[d.data].note1})

    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left + 15})
    .attr('y', (d) => { return data.hints[d.data].top + 17})
    .style("font-size", '8px')
    .text(d => {return data.hints[d.data].note2 || ''})

}

async function draw_market_disruption() {
    const data = await d3.json("./../data/market-disruption.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 228)
        .style("position", 'absolute')
        .style("left", '525px')
        .style("top", '15px');

        svg.append('text')
        .transition()
        .duration(1000)
        .attr('font-size', '16px')
        .style("font-weight", '500')
        .attr('dx', 0)
        .attr('dy', 20)  
        .text(data.title);

        svg.append('text')
        .transition()
        .duration(1000)
        .attr('font-size', '16px')
        .style("font-weight", '500')
        .attr('dx', 0)
        .attr('dy', 38)  
        .text(data.title2);

        svg.append('text')
        .transition()
        .duration(1000)
        .attr('font-size', '11px')
        .style("font-weight", '400')
        .style("font-style", 'italic')
        .attr('dx', 0)
        .attr('dy', 55)  
        .text(data.subTitle);

    const row_g = svg.selectAll(".row")
        .data(data.data)
        .enter()
        .append("g")
        .attr("class", "row");
    
    for (let k = 1; k <= 5; k++) {
        row_g.append('text')
        .transition()
        .duration(1000)
        .attr("dx", '0px')
        .attr('dy', (d, index) => {return 65 + index * 45 + k * 11;})
        .style("font-size", '8px')
        .style("font-weight", '600')
        .attr('fill', '#585757')
        .text(d => {return data.rowTexts[d]['text' + k]});

        if (k <= 2) {
            row_g.append("line")
            .transition()
            .duration(1000)
            .style("stroke", "#cbcdcd")
            .attr("x1", (d) => {return 0})
            .attr("y1", (d) => {return 108 + (k-1) * 43})
            .attr("x2", (d) => {return 200})
            .attr("y2", (d) => {return 108 + (k-1) * 43});
        }
    }
    
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", '120px')
    .attr('dy', (d, index) => {return 92 + index * 49})
    .style("font-size", '30px')
    .style("font-weight", 'bold')
    .attr('fill', maxPercColor)
    .text(d => d);
    
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", '152px')
    .attr('dy', (d, index) => {return 92 + index * 49})
    .style("font-size", '25px')
    .style("font-weight", '100')
    .attr('fill', maxPercColor)
    .text('%');

    var arc = d3.symbol().type(d3.symbolTriangle);
    row_g
    .append('path')
    .transition()
    .duration(1000)
    .attr('d', arc)
    .attr('fill', maxPercColor)
    .attr('stroke', maxPercColor)
    .attr('stroke-width', 3)
    .attr('transform', (d, index) => {
        return "translate(" + 190 + "," + (82 + index * 52) + ")";
    });
}

async function draw_print_volumes() {
    const data = await d3.json("./../data/print-volumes.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 228)
        .style("position", 'absolute')
        .style("left", '745px')
        .style("top", '10px');

    const textRows = data["text-rows"];
    const title_g = svg.append("g");
    title_g.selectAll("text")
    .data(textRows)
    .enter()
    .append("text")
    .transition()
    .duration(1000)
    .attr('font-size', (d, k) => { return textRows[k].fontSize;})
    .style("font-weight", (d, k) => { return textRows[k].fontWeight;})
    .style("font-style", (d, k) => { return textRows[k].fontStyle;})
    .attr('dx', (d, k) => { return textRows[k].left;})
    .attr('dy', (d, k) => { return textRows[k].top;})
    .text((d, k) => { return textRows[k].text;});

    let sx = 170, sy = 63;
    const x_inc1 = 25, y_inc1 = 14, x_inc2 = 57, y_inc2 = -3;
    const rx = sx + 1, ry = sy - 5;
    var poly = [
        {"x": rx, "y": ry + 2},
        {"x": rx + x_inc1 - 1, "y": ry + y_inc1 + 1},
        {"x": rx + x_inc2 - 2, "y": ry + y_inc2 + 2},
        {"x": rx + 31, "y": ry - 12}
    ];
  svg.selectAll("polygon")
    .data([poly])
    .enter()
    .append("polygon")
    .transition()
    .duration(1000)
    .ease(d3.easePolyInOut)
    .style("stroke", "#2EE7D2")
    .style("fill", "#2EE7D2")
    .attr("points", (d) => { 
        return d.map((d) => {
            return [d.x, d.y].join(",");
        }).join(" ");
    });

    const len = 32;
    for (let k = 0; k < len; k++) {
        const diff = len - k;
        if (diff <= 2) {
            color = '#575868';
        } else if (diff > 2 && diff < 12) {
            color = '#008BE9';
        } else {
            color = "#2EE7D2";
        }
        
        svg.append("line")
        .transition()
        .duration(1000)
        .style("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("x1", sx)
        .attr("y1", sy)
        .attr("x2", sx+x_inc1)
        .attr("y2", sy+y_inc1);

        svg.append("line")
        .transition()
        .duration(1000)
        .style("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("x1", sx+x_inc1)
        .attr("y1", sy+y_inc1)
        .attr("x2", sx+x_inc2)
        .attr("y2", sy-y_inc2-6);
        sy += 4.8;
    }

    // Top stains
    for (let k = 0; k < 6; k++) {
        svg.append("line")
        .transition()
        .duration(1000)
        .style("stroke", '#fff')
        .attr("stroke-width", 1.5)
        .attr("x1", rx+7 + k*4.5)
        .attr("y1", ry+2 - k*2)
        .attr("x2", rx+x_inc1+1.2 + k*4.4)
        .attr("y2", ry+y_inc1-2 - k*2.2);
    }

    const row_g = svg.selectAll(".vol-row")
        .data(data.percents)
        .enter()
        .append("g")
        .attr("class", "vol-row");
    
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", (d) => {return d.left})
    .attr('dy', (d) => {return d.top})
    .style("font-size", (d) => {return d.fontSize})
    .style("font-weight", (d) => {return d.fontWeight})
    .attr('fill', (d) => {return d.color})
    .text(d => {return d.perc;});
    
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", (d, i) => {
        const buf_left = i === 0 ? 33 : (i === 1) ? 23 : 11;
        return d.left + buf_left;
    })
    .attr('dy', (d) => {return d.top})
    .style("font-size", (d) => {return d.fontSize})
    .style("font-weight", '100')
    .attr('fill', (d) => {return d.color})
    .text(d => '%');

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", (d, i) => {
        const buf_left = i === 0 ? 65 : (i === 1) ? 45 : 31;
        return d.left + buf_left;
    })
    .attr('dy', (d) => {return d.top})
    .style("font-size", '11px')
    .style("font-weight", '600')
    .attr('fill', (d) => {return d.color})
    .text(d => {return d.note1;});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", (d, i) => {
        const buf_left = i === 0 ? 65 : (i === 1) ? 45 : 31;
        return d.left + buf_left;
    })
    .attr('dy', (d) => {return d.top - 14})
    .style("font-size", '11px')
    .style("font-weight", '600')
    .attr('fill', (d) => {return d.color})
    .text(d => {return d.note2;});

    svg.append("line")
    .transition()
    .duration(1000)
    .style("stroke", "#797E7C")
    .attr("x1", 0)
    .attr("y1", 115)
    .attr("x2", 160)
    .attr("y2", 115);

    var triangle = [
        {"x": 140, "y": 90},
        {"x": 157, "y": 90},
        {"x": 148, "y": 103}
    ];
    svg.selectAll("polygon")
    .data([triangle])
    .enter()
    .append("polygon")
    .transition()
    .duration(1000)
    .style("stroke", "#2EE7D2")
    .style("fill", "#2EE7D2")
    .attr("points", (d) => { 
        return d.map((d) => {
            return [d.x, d.y].join(",");
        }).join(" ");
    });
}

async function draw_vertical_demand() {
    const data = await d3.json("./../data/vertical-demand.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 475)
        .attr("height", 230)
        .style("position", 'absolute')
        .style("left", '255px')
        .style("top", '250px');

    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        svg.append('text')
        .transition()
        .duration(1000)
        .attr('font-size', titles[k].fontSize)
        .style("font-weight", titles[k].fontWeight)
        .style("font-style", titles[k].fontStyle)
        .attr('dx', titles[k].left)
        .attr('dy', titles[k].top)
        .text(titles[k].text);
    }

    for (let k = 0; k < data.boxes.length; k++) {
        svg.append('rect')
        .transition()
        .duration(1000)
        .attr("x", data.boxes[k].left)
        .attr('y', data.boxes[k].top)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', data.boxes[k].color);

        svg.append('text')
        .transition()
        .duration(1000)
        .attr("x", data.boxes[k].left + 15)
        .attr('y', data.boxes[k].top + 8)
        .style("font-size", '9px')
        .text(data.boxes[k].label)
    }

    const row_g = svg.selectAll(".demand-row")
            .data(data.demand_rows)
            .enter()
            .append("g")
            .attr("class", "demand-row");

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {
        let _top = data.row_start.top + i*30;
        if (d.label2) {
            _top -= 5;
        }
        return _top;
    })
    .style("font-size", '10px')
    .style("font-weight", '500')
    .text(d => {return d.label})

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {return data.row_start.top + 6 + i*30;})
    .style("font-size", '10px')
    .style("font-weight", '500')
    .text(d => {return d.label2})

    row_g.append("line")
    .transition()
    .duration(1000)
    .style("stroke", (d, i) => {
        return i < data.demand_rows.length-1 ? "#D3E1DF" : '';
    })
    .attr("x1", (d) => { return data.row_start.left;})
    .attr("y1", (d, i) => { return data.row_start.top + 12 + i*30;})
    .attr("x2", (d) => { return data.row_start.left + 470;})
    .attr("y2", (d, i) => { return data.row_start.top + 12 + i*30;});

    const bar_middle = 295;
    const times = 2.15;
    row_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return bar_middle + data.row_start.left + times*d.left_perc;})
    .attr('y', (d, i) => { return data.row_start.top + i*30 - 13;})
    .attr('width', (d, i) => { return Math.abs(times*d.left_perc);})
    .attr('height', 19)
    .attr('fill', (d) => { return d.colors[0];});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_middle + data.row_start.left + times*d.left_perc - 50;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '600')
    .attr('fill', (d) => { return d.colors[0];})
    .text(d => {return d.left_perc})

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_middle + data.row_start.left + times*d.left_perc - 20;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '100')
    .attr('fill', (d) => { return d.colors[0];})
    .text('%')

    row_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return bar_middle + data.row_start.left;})
    .attr('y', (d, i) => { return data.row_start.top + i*30 - 13;})
    .attr('width', (d, i) => { return Math.abs(times*d.right_perc);})
    .attr('height', 19)
    .attr('fill', (d) => { return d.colors[1];})

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_middle + data.row_start.left + times*d.right_perc + 5;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '600')
    .attr('fill', (d) => { return d.colors[1];})
    .text(d => {return '+' + d.right_perc})

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { 
        let pos_x = bar_middle + data.row_start.left + times*d.right_perc + 38;
        if (d.right_perc < 10) {
            pos_x -= 10;
        }
        return pos_x;
    })
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '100')
    .attr('fill', (d) => { return d.colors[1];})
    .text('%');
}

async function draw_collab_cloud_opp() {
    const data = await d3.json("./../data/collab-cloud-digi.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 475)
        .attr("height", 230)
        .style("position", 'absolute')
        .style("left", '745px')
        .style("top", '250px');

    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        svg.append('text')
        .transition()
        .duration(1000)
        .attr('font-size', titles[k].fontSize)
        .style("font-weight", titles[k].fontWeight)
        .style("font-style", titles[k].fontStyle)
        .attr('dx', titles[k].left)
        .attr('dy', titles[k].top)
        .text(titles[k].text);
    }

    const row_g = svg.selectAll(".oppo-row")
    .data(data.opportunity_rows)
    .enter()
    .append("g")
    .attr("class", "oppo-row");

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {
        let pos_y = data.row_start.top + i*50;
        if (!d.label2) {
            pos_y += 5;
        }
        return pos_y;
    })
    .style("font-size", '10px')
    .style("font-weight", '600')
    .text(d => {return d.label1});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {return data.row_start.top + i*50 + 12;})
    .style("font-size", '10px')
    .style("font-weight", '600')
    .text(d => {return d.label2});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left + 150;})
    .attr('y', (d, i) => {return data.row_start.top + i*50 + 15;})
    .style("font-size", '30px')
    .style("font-weight", '600')
    .attr('fill', (d) => { return d.color;})
    .text(d => {return d.perc});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left + 182;})
    .attr('y', (d, i) => {return data.row_start.top + i*50 + 15;})
    .style("font-size", '30px')
    .style("font-weight", '100')
    .attr('fill', (d) => { return d.color;})
    .text('%');

    row_g.append("line")
    .transition()
    .duration(1000)
    .style("stroke", (d, i) => {
        return i < data.opportunity_rows.length - 1 ? '#B2BEBD' : '';
    })
    .attr("x1", (d) => { return data.row_start.left;})
    .attr("y1", (d, i) => { return data.row_start.top + 30 + i*50;})
    .attr("x2", (d) => { return data.row_start.left + 240;})
    .attr("y2", (d, i) => { return data.row_start.top + 30 + i*50;});

    var arc = d3.symbol().type(d3.symbolTriangle);
    row_g
    .append('path')
    .transition()
    .duration(1000)
    .attr('d', arc)
    .attr('fill', maxPercColor)
    .attr('stroke', maxPercColor)
    .attr('stroke-width', 3)
    .attr('transform', (d, index) => {
        return "translate(" + 225 + "," + (92 + index * 52) + ")";
    });
}

async function draw_channel_partners() {
    const data = await d3.json("./../data/channel-partners.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 475)
        .attr("height", 230)
        .style("position", 'absolute')
        .style("left", '255px')
        .style("top", '490px');

    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        svg.append('text')
        .transition()
        .duration(1000)
        .attr('font-size', titles[k].fontSize)
        .style("font-weight", titles[k].fontWeight)
        .style("font-style", titles[k].fontStyle)
        .attr('dx', titles[k].left)
        .attr('dy', titles[k].top)
        .text(titles[k].text);
    }

    const row_g = svg.selectAll(".supplier-row")
    .data(data.supplier_rows)
    .enter()
    .append("g")
    .attr("class", "supplier-row");

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {
        let pos_y = data.row_start.top + i*30;
        if (!d.label2) {
            pos_y += 5;
        }
        return pos_y;
    })
    .style("font-size", '10px')
    .style("font-weight", '600')
    .text(d => {return d.label1});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 12;})
    .style("font-size", '10px')
    .style("font-weight", '600')
    .text(d => {return d.label2});

    const bar_start = 140;
    const times = 3;
    row_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return bar_start + data.row_start.left;})
    .attr('y', (d, i) => { return data.row_start.top + i*30 - 8;})
    .attr('width', (d, i) => { return Math.abs(times*d.perc);})
    .attr('height', 19)
    .attr('fill', (d) => { return d.color;})

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_start + data.row_start.left + times*d.perc + 3;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 8;})
    .style("font-size", '20px')
    .style("font-weight", '600')
    .text(d => {return d.perc})
    .attr('fill', (d) => { return d.color;});

    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => {return bar_start + data.row_start.left + times*d.perc + 25;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 7;})
    .style("font-size", '20px')
    .style("font-weight", '100')
    .text('%')
    .attr('fill', (d) => { return d.color;});

    svg.selectAll(".percent")
    .data(data.percents)
    .enter()
    .append("text")
    .transition()
    .duration(1000)
    .attr("x", (d, i) => {
        const len = (d === 0) ? 0 : (d.toString().length * 0);
        return bar_start + times * d - len;
    })
    .attr('y', 200)
    .style("font-size", '7px')
    .style("font-weight", '100')
    .text(d => {return d + '%';})
    .attr('fill', (d) => { return d.color;});
}

async function draw_business_recovery() {
    const data = await d3.json("./../data/business-recovery-pie.json");

    const title_svg = d3.select("#wrapper")
        .append('svg')
        .attr("width", 200)
        .attr("height", 40)
        .style("position", 'absolute')
        .style("left", '750px')
        .style("top", '490px')

    title_svg.append('text')
    .transition()
    .duration(1000)
    .attr('font-size', '15px')
    .style("font-weight", '600')
    .attr('dx', 0)
    .attr('dy', 20)  
    .text(data.title);

    title_svg.append('text')
    .transition()
    .duration(1000)
    .attr('font-size', '15px')
    .style("font-weight", '600')
    .attr('dx', 0)
    .attr('dy', 36)  
    .text(data.title2);

    const width = 140,
        height = 140,
        radius = Math.min(width, height) / 2;

    const arc = d3.arc()
        .outerRadius(radius - 10)
        .innerRadius(0);

    const labelArc = d3.arc()
        .outerRadius(radius - 55)
        .innerRadius(radius - 40);

    const pie = d3.pie()
        .sort(null)
        .value((d) => { return d; });

    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 170)
        .style("position", 'absolute')
        .style("left", '727px')
        .style("top", '535px')
        .append("g")
        .attr("transform", "translate(" + ((width / 2) + 10) + "," + ((height / 2) + 10)  + ")");


    const arc_g = svg.selectAll(".arc")
    .data(pie(data.values))
    .enter()
    .append("g")
    .attr("class", "arc");

    arc_g.append("path")
    .transition()
    .duration(1000)
    .attr("d", arc)
    .style("fill", (d, i) => { return data.colors[i]; });

    arc_g.append("text")
    .transition()
    .duration(1000)
    .attr("transform", (d) => {return "translate(" + labelArc.centroid(d) + ")";})
    .attr("dx", (d, i) => {return get_item(d, i, 'label').left + 'px';})
    .attr("dy", (d, i) => {return get_item(d, i, 'label').top + 'px';})
    .style("font-size", '14px')
    .style("font-weight", 'bold')
    .style("fill", (d, i) => {
        return get_item(d, i, 'label').color;
    })
    .text((d) => { return d.data; });

    arc_g.append("text")
    .transition()
    .duration(1000)
    .attr("transform", (d) => {return "translate(" + labelArc.centroid(d) + ")";})
    .attr("dx", (d, i) => {
        const buffer = d.data > 9 ? 17 : 8;
        return (get_item(d, i, 'label').left + buffer) + 'px';
    })
    .attr("dy", (d, i) => {return get_item(d, i, 'label').top + 'px';})
    .style("font-size", '12px')
    .style("fill", (d, i) => {return get_item(d, i, 'label').color;})
    .text((d) => { return '%'; });
    
    const note_g = svg.selectAll(".hint")
            .data(pie(data.values))
            .enter()
            .append("g")
            .attr("class", "hint");

    note_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return get_item(d, i, 'hints').left})
    .attr('y', (d, i) => { return get_item(d, i, 'hints').top - 10})
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d, i) => {return data.colors[i];});

    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return get_item(d, i, 'hints').left + 15})
    .attr('y', (d, i) => { return get_item(d, i, 'hints').top - 2})
    .style("font-size", '9px')
    .text((d,i) => {return get_item(d, i, 'hints').note1})

    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return get_item(d, i, 'hints').left + 15})
    .attr('y', (d, i) => { return get_item(d, i, 'hints').top + 10})
    .style("font-size", '9px')
    .text((d, i) => {return get_item(d, i, 'hints').note2 || ''})

    function get_item(d, i, prop) {
        let indx = d.data;
        if (indx === 6) {
            indx = i === 0 ? ('6-' + 1) : ('6-' + 2);
        }
        return data[prop][indx];
      }
}

window.onload = () => {
    add_left_bar_texts();

    draw_business_impact();
    draw_market_disruption();
    draw_print_volumes();
    
    draw_vertical_demand();
    draw_collab_cloud_opp();

    draw_channel_partners();
    draw_business_recovery();
    
    
    
}