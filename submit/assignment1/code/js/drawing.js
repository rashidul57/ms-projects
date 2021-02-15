// Two most common colors widely used
let max_perc_color, sec_max_perc_color;

/**
 * Adds the text inside the left black box 
 */
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

/**
 * Common method used to add text for all of the blocks
 * @param {*} svg 
 * @param {*} level 
 * @param {*} dx 
 * @param {*} dy 
 * @param {*} text 
 */
function draw_title_el(svg, level, dx, dy, text) {
    const cls = level === 1 ? 'section-title' : 'sub-title';
    return svg
    .append('text')
    .transition()
    .duration(1000)
    .attr('class', cls)
    .attr('dx', dx)
    .attr('dy', dy)  
    .text(text);
}

/**
 * Draws the block with heading as 
 * "Impact of COVID-19 on business"
 */
async function draw_business_impact() {
    const data = await d3.json("./../data/business-impact-donut.json");
    // reused all over the page
    max_perc_color = data.colors[1];
    sec_max_perc_color = data.colors[4];

    const title_svg = d3.select("#wrapper")
        .append('svg')
        .attr("width", 200)
        .attr("height", 40)
        .style("position", 'absolute')
        .style("left", '250px')
        .style("top", '15px')

    // draw titles text of the block
    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        draw_title_el(title_svg, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    const width = 140,
        height = 140,
        radius = Math.min(width, height) / 2;

    // Draw pie chart in this block 
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
    .attr("fill", (d) => { return color(d.data); });

    // add hover effect to show color change effect
    arc_g.on('mousemove', function(ev, d) {
        const color = data.colors[d.index];
        d3.select(this).select('path').attr("fill", color + '80');
    })
    arc_g.on('mouseout', function(ev, d, i) {
        const color = data.colors[d.index];
        d3.select(this).select('path').attr("fill", color);
    });

    // Add the percentage of the pie arc
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

    // Add % inside the pie arc
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
    
    // Draw list of hints with rectangular boxes
    const note_g = svg.selectAll(".hint")
    .data(pie(data.values))
    .enter()
    .append("g")
    .attr("class", "hint");

    // Draw rectangular boxes
    note_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left})
    .attr('y', (d) => { return data.hints[d.data].top - 10})
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d) => { return color(d.data);});

    // bold text row of hints
    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left + 15})
    .attr('y', (d) => { return data.hints[d.data].top - 3})
    .attr('class', 'text-10-thick')
    .text(d => {return data.hints[d.data].key})

    // first row of hint note
    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left + 15})
    .attr('y', (d) => { return data.hints[d.data].top + 7})
    .attr('class', 'text-8-thin')
    .text(d => {return data.hints[d.data].note1})

    // second row of hint note
    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.hints[d.data].left + 15})
    .attr('y', (d) => { return data.hints[d.data].top + 17})
    .attr('class', 'text-8-thin')
    .text(d => {return data.hints[d.data].note2 || ''})

}

/**
 * Draws the block with heading as 
 * "Market disruption will drive innovation"
 */
async function draw_market_disruption() {
    const data = await d3.json("./../data/market-disruption.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 228)
        .style("position", 'absolute')
        .style("left", '525px')
        .style("top", '15px');

    // Draw title text of the block
    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        draw_title_el(svg, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    // Create a g element in svg to hold data from array
    const row_g = svg.selectAll(".row")
        .data(data.data)
        .enter()
        .append("g")
        .attr("class", "row");
    
    for (let k = 1; k <= 5; k++) {
        // Draw left column multi-row text
        row_g.append('text')
        .transition()
        .duration(1000)
        .attr("dx", '0px')
        .attr('dy', (d, index) => {return 65 + index * 45 + k * 11;})
        .attr('class', 'text-10-thick')
        .text(d => {return data.rowTexts[d]['text' + k]});

        if (k <= 2) {
            // Draw row separting lines
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
    
    // Add percentages of each row
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", '120px')
    .attr('dy', (d, index) => {return 92 + index * 49})
    .style("font-size", '30px')
    .style("font-weight", 'bold')
    .attr('fill', max_perc_color)
    .text(d => d);
    
    // Add '%' of each row
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", '152px')
    .attr('dy', (d, index) => {return 92 + index * 49})
    .style("font-size", '25px')
    .style("font-weight", '100')
    .attr('fill', max_perc_color)
    .text('%');

    // Draw triangles of every row
    var arc = d3.symbol().type(d3.symbolTriangle);
    row_g
    .append('path')
    .transition()
    .duration(1000)
    .attr('d', arc)
    .attr('fill', max_perc_color)
    .attr('stroke', max_perc_color)
    .attr('stroke-width', 3)
    .attr('transform', (d, index) => {
        return "translate(" + 190 + "," + (82 + index * 52) + ")";
    });
}

/**
 * Draws the block with heading as 
 * "Office print volumes are in free fall"
 */
async function draw_print_volumes() {
    const data = await d3.json("./../data/print-volumes.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 228)
        .style("position", 'absolute')
        .style("left", '745px')
        .style("top", '10px');

    // Add titles of the block
    const titles = data.titles;
    const title_g = svg.append("g");
    for (let k = 0; k < titles.length; k++) {
        draw_title_el(title_g, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    // Configuration for polygon
    let sx = 170, sy = 63;
    const x_inc1 = 25, y_inc1 = 14, x_inc2 = 57, y_inc2 = -3;
    const rx = sx + 1, ry = sy - 5;
    var poly = [
        {"x": rx, "y": ry + 2},
        {"x": rx + x_inc1 - 1, "y": ry + y_inc1 + 1},
        {"x": rx + x_inc2 - 2, "y": ry + y_inc2 + 2},
        {"x": rx + 31, "y": ry - 12}
    ];

    // Draw filled polygon of the top of the piles
    svg.selectAll("polygon")
    .data([poly])
    .enter()
    .append("polygon")
    .transition()
    .duration(1000)
    .ease(d3.easePolyInOut)
    .style("stroke", max_perc_color)
    .style("fill", max_perc_color)
    .attr("points", (d) => { 
        return d.map((d) => {
            return [d.x, d.y].join(",");
        }).join(" ");
    });

    // Draw piles of books
    const len = 32;
    for (let k = 0; k < len; k++) {
        const diff = len - k;
        if (diff <= 2) {
            color = '#575868';
        } else if (diff > 2 && diff < 12) {
            color = '#008BE9';
        } else {
            color = max_perc_color;
        }
        
        // Draw lines(left) of the pile
        svg.append("line")
        .transition()
        .duration(1000)
        .style("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("x1", sx)
        .attr("y1", sy)
        .attr("x2", sx+x_inc1)
        .attr("y2", sy+y_inc1);

        // Draw lines(right) of the pile
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

    // Top stains of the filled roof
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
        .data(data.percent_rows)
        .enter()
        .append("g")
        .attr("class", "vol-row");
    
    // Draw percentage(numbers)
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("dx", (d) => {return d.left})
    .attr('dy', (d) => {return d.top})
    .style("font-size", (d) => {return d.fontSize})
    .style("font-weight", (d) => {return d.fontWeight})
    .attr('fill', (d) => {return d.color})
    .text(d => {return d.perc;});
    
    // Add '%' for each of the rows
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

    // Add note1(first line)
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

    // Add note2(second line)
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

    // Draw separating line
    svg.append("line")
    .transition()
    .duration(1000)
    .style("stroke", "#797E7C")
    .attr("x1", 0)
    .attr("y1", 115)
    .attr("x2", 160)
    .attr("y2", 115);

    // Draw flipped triangle
    var triangle = [
        {"x": 140, "y": 90},
        {"x": 157, "y": 90},
        {"x": 148, "y": 103}
    ];
    svg.selectAll("rev-triangle")
    .data([triangle])
    .enter()
    .append("polygon")
    .transition()
    .duration(1000)
    .style("stroke", max_perc_color)
    .style("fill", max_perc_color)
    .attr("points", (d) => { 
        return d.map((d) => {
            return [d.x, d.y].join(",");
        }).join(" ");
    });
}

/**
 * Draws the block with heading as 
 * "Vertical demand varies"
 */
async function draw_vertical_demand() {
    const data = await d3.json("./../data/vertical-demand.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 475)
        .attr("height", 230)
        .style("position", 'absolute')
        .style("left", '255px')
        .style("top", '250px');

    // Add title of the block
    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        draw_title_el(svg, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    // Add increase/decrease boxes and text
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

    // create g element for each of the row
    const row_g = svg.selectAll(".demand-row")
            .data(data.demand_rows)
            .enter()
            .append("g")
            .attr("class", "demand-row");

    // Add label on the first column like Education
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
    .attr('class', 'text-9-thick')
    .text(d => {return d.label})

    // Add label2(second line)
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {return data.row_start.top + 6 + i*30;})
    .attr('class', 'text-9-thick')
    .text(d => {return d.label2})

    // Draw row separating line
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

    // Draw bars of left side
    const bar_middle = 295;
    const times = 2.15;
    row_g.append('rect')
    .transition()
    .duration(1000)
    .attr('class', 'left-bar')
    .attr("x", (d, i) => { return bar_middle + data.row_start.left + times*d.left_perc;})
    .attr('y', (d, i) => { return data.row_start.top + i*30 - 13;})
    .attr('width', (d, i) => { return Math.abs(times*d.left_perc);})
    .attr('height', 19)
    .attr('fill', sec_max_perc_color);

    // Add left side pecentage(number)
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_middle + data.row_start.left + times*d.left_perc - 50;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '600')
    .attr('fill', sec_max_perc_color)
    .text(d => {return d.left_perc})

    // Add left '%' of the bars
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_middle + data.row_start.left + times*d.left_perc - 20;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '100')
    .attr('fill', sec_max_perc_color)
    .text('%')

    // Draw bars of right side
    row_g.append('rect')
    .transition()
    .duration(1000)
    .attr('class', 'right-bar')
    .attr("x", (d, i) => { return bar_middle + data.row_start.left;})
    .attr('y', (d, i) => { return data.row_start.top + i*30 - 13;})
    .attr('width', (d, i) => { return Math.abs(times*d.right_perc);})
    .attr('height', 19)
    .attr('fill', max_perc_color)

    // Add hover effects
    row_g.on('mousemove', function(ev, d) {
        on_hover(ev, d, 'move', this);
    })
    row_g.on('mouseout', function(ev, d) {
        on_hover(ev, d, 'out', this);
    });

    // Add right side pecentage(number)
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_middle + data.row_start.left + times*d.right_perc + 5;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 4;})
    .style("font-size", '20px')
    .style("font-weight", '600')
    .attr('fill', max_perc_color)
    .text(d => {return '+' + d.right_perc})

    // Add '%' text for each row
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
    .attr('fill', max_perc_color)
    .text('%');

    // Common method for hover effects
    function on_hover(ev, d, action, me) {
        let selector;
        if (ev.target.classList.contains('left-bar')) {
            selector = 'left-bar';
        }
        if (ev.target.classList.contains('right-bar')) {
            selector = 'right-bar';
        }
        if (selector) {
            let color = selector === 'left-bar' ? sec_max_perc_color : max_perc_color;
            if (action === 'move') {
                color = color + '80';
            }
            d3.select(me).select('rect.' + selector).attr("fill", color);
        }
    }
}

/**
 * Draws the block with heading as 
 * "Collaboration, cloud and digitization opportunities"
 */
async function draw_collab_cloud_opp() {
    const data = await d3.json("./../data/collab-cloud-digi.json");
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 475)
        .attr("height", 230)
        .style("position", 'absolute')
        .style("left", '745px')
        .style("top", '250px');

    // Add titles
    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        draw_title_el(svg, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    const row_g = svg.selectAll(".oppo-row")
    .data(data.opportunity_rows)
    .enter()
    .append("g")
    .attr("class", "oppo-row");

    // Add label1(first line)
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
    .attr('class', 'text-10-thick')
    .text(d => {return d.label1});

    // Add label2(second line)
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr('class', 'text-10-thick')
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {return data.row_start.top + i*50 + 12;})
    .text(d => {return d.label2});

    // Add percentange(number) for each row
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left + 150;})
    .attr('y', (d, i) => {return data.row_start.top + i*50 + 15;})
    .style("font-size", '30px')
    .style("font-weight", '600')
    .attr('fill', max_perc_color)
    .text(d => {return d.perc});

    // Add '%' text
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left + 182;})
    .attr('y', (d, i) => {return data.row_start.top + i*50 + 15;})
    .style("font-size", '30px')
    .style("font-weight", '100')
    .attr('fill', max_perc_color)
    .text('%');

    // Draw line
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

    // Add triangle
    var arc = d3.symbol().type(d3.symbolTriangle);
    row_g
    .append('path')
    .transition()
    .duration(1000)
    .attr('d', arc)
    .attr('fill', max_perc_color)
    .attr('stroke', max_perc_color)
    .attr('stroke-width', 3)
    .attr('transform', (d, index) => {
        return "translate(" + 225 + "," + (92 + index * 52) + ")";
    });
}

/**
 * Draws the block with heading as 
 * "Channel partners expect more support from their suppliers"
 */
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
        draw_title_el(svg, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    // create 'g' element for every row
    const row_g = svg.selectAll(".supplier-row")
    .data(data.supplier_rows)
    .enter()
    .append("g")
    .attr("class", "supplier-row");

    // Add label1 of first line
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
    .attr('class', 'text-10-thick')
    .text(d => {return d.label1});

    // Add label1 of second line
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return data.row_start.left;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 12;})
    .attr('class', 'text-10-thick')
    .text(d => {return d.label2});

    // draw bar charts of each row
    const bar_start = 140;
    const times = 3;
    row_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return bar_start + data.row_start.left;})
    .attr('y', (d, i) => { return data.row_start.top + i*30 - 8;})
    .attr('width', (d, i) => { return Math.abs(times*d.perc);})
    .attr('height', 19)
    .attr('fill', max_perc_color);
    row_g.on('mousemove', function(ev, d) {
        d3.select(this).select('rect').attr("fill", max_perc_color + '80');
    })
    row_g.on('mouseout', function(ev, d) {
        d3.select(this).select('rect').attr("fill", max_perc_color);
    });

    // add percentages(number) of each row
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => { return bar_start + data.row_start.left + times*d.perc + 3;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 8;})
    .style("font-size", '20px')
    .style("font-weight", '600')
    .text(d => {return d.perc})
    .attr('fill', max_perc_color);

    
    // add '%' of each row
    row_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d) => {return bar_start + data.row_start.left + times*d.perc + 25;})
    .attr('y', (d, i) => {return data.row_start.top + i*30 + 7;})
    .style("font-size", '20px')
    .style("font-weight", '100')
    .text('%')
    .attr('fill', max_perc_color);

    // Add the bottom cells of percentage from 0%-100%
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
    .attr('class', 'text-7-thin')
    .text(d => {return d + '%';})
    .attr('fill', (d) => { return d.color;});
}

/**
 * Draws the block with heading as 
 * "Most are cautious about business recovery time"
 */
async function draw_business_recovery() {
    const data = await d3.json("./../data/business-recovery-pie.json");

    // Add svg for title
    const title_svg = d3.select("#wrapper")
        .append('svg')
        .attr("width", 200)
        .attr("height", 40)
        .style("position", 'absolute')
        .style("left", '750px')
        .style("top", '490px')

    // titles in the svg
    const titles = data["titles"];
    for (let k = 0; k < titles.length; k++) {
        draw_title_el(title_svg, titles[k].level, titles[k].left, titles[k].top, titles[k].text);
    }

    // configs of pie chart
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

    // add svg for pie chart
    const svg = d3.select("#wrapper")
        .append("svg")
        .attr("width", 266)
        .attr("height", 170)
        .style("position", 'absolute')
        .style("left", '727px')
        .style("top", '535px')
        .append("g")
        .attr("transform", "translate(" + ((width / 2) + 10) + "," + ((height / 2) + 10)  + ")");

    // add g element for each of arc
    const arc_g = svg.selectAll(".arc")
    .data(pie(data.values))
    .enter()
    .append("g")
    .attr("class", "arc");

    // fill the arc with defined color in json
    arc_g.append("path")
    .transition()
    .duration(1000)
    .attr("d", arc)
    .attr("fill", (d, i) => {
        return data.colors[i];
    });

    // Add mouse hover effect
    arc_g.on('mousemove', function(ev, d) {
        const color = data.colors[d.index];
        d3.select(this).select('path').attr("fill", color + '80');
    })
    arc_g.on('mouseout', function(ev, d, i) {
        const color = data.colors[d.index];
        d3.select(this).select('path').attr("fill", color);
    });

    // 
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

    // Add rectangular small boxes to the right side of list
    note_g.append('rect')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return get_item(d, i, 'hints').left})
    .attr('y', (d, i) => { return get_item(d, i, 'hints').top - 10})
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d, i) => {return data.colors[i];});

    // add note1 along with rect boxes
    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return get_item(d, i, 'hints').left + 15})
    .attr('y', (d, i) => { return get_item(d, i, 'hints').top - 2})
    .attr('class', 'text-10-thin')
    .text((d,i) => {return get_item(d, i, 'hints').note1})

    // add note2(second line) along the rect boxes
    note_g.append('text')
    .transition()
    .duration(1000)
    .attr("x", (d, i) => { return get_item(d, i, 'hints').left + 15})
    .attr('y', (d, i) => { return get_item(d, i, 'hints').top + 10})
    .attr('class', 'text-10-thin')
    .text((d, i) => {return get_item(d, i, 'hints').note2 || ''})

    // common method for geting element
    function get_item(d, i, prop) {
        let indx = d.data;
        if (indx === 6) {
            indx = i === 0 ? ('6-' + 1) : ('6-' + 2);
        }
        return data[prop][indx];
      }
}

window.onload = () => {
    // Black(left) box texts
    add_left_bar_texts();

    // Top row blocks
    draw_business_impact();
    draw_market_disruption();
    draw_print_volumes();
    
    // Middle row blocks
    draw_vertical_demand();
    draw_collab_cloud_opp();

    // Bottom row blocks
    draw_channel_partners();
    draw_business_recovery();
}