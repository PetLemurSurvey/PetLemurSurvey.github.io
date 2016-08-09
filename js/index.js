var row1_height,
		row2_height,
		map_height,
		map_width,
		item_width,
		rowChartBarColor;

d3.json('https://petlemursurvey.herokuapp.com/', function(error, data) {	
// d3.json('http://petlemursurvey-staging.herokuapp.com', function(error, data) {	
// d3.json('http://localhost:3000/', function(error, data) {		

	var lemurData = data.responses;
	var fullDateFormat = d3.time.format('%Y-%m-%d');
	var yearFormat = d3.time.format('%Y');
	var monthFormat = d3.time.format('%b'); 

	//normalize/parse data for dc.js
	lemurData.forEach(function(d) {
		d.count = +d.count;
		d.lemurs_quantity = quantity_KV[d.lemurs_quantity];
		d.categoryName = lemur_category_KV[d.lemur_category];
		d.month_abbr = month_KV_abbr[d.month];
		d.month_full= month_KV_full[d.month];
		// d.month_digit= month_KV_digit[d.month];
		d.year = year_KV[d.year];
		d.decade = decade_KV[d.decade];
		d.location_admin1_chart = admin1_KV[d.location_admin1];
		d.location_admin1_map = d.location_admin1;
		d.location_admin2_chart = admin2_KV[d.location_admin2];
		d.location_admin2_map = d.location_admin2;
	});

	//set crossfilter
	var ndx = crossfilter(lemurData);

	//create dimensions (x-axis values)
	var quantityDim = ndx.dimension(function(d) {return d.lemurs_quantity}),
			//dc.pluck:  short hand for same kind of anonymous function we used for yearDim
			// monthDim = ndx.dimension(dc.pluck('when_seen_month')),
			monthDim_abbr = ndx.dimension(function(d) {return d.month_abbr}),
			monthDim_full = ndx.dimension(function(d) {return d.month_full}),
			// monthDim_digit = ndx.dimension(function(d) {return d.month_digit}),
			decadeDim = ndx.dimension(function(d) {return d.decade}),
			yearDim = ndx.dimension(function(d) {return d.year}),
			categoryNameDim = ndx.dimension(function(d) {return d.categoryName;}),
			admin1ChartDim = ndx.dimension(function(d) {return d.location_admin1_chart}),
			admin2ChartDim = ndx.dimension(function(d) {return d.location_admin2_chart}),
			admin1MapDim = ndx.dimension(function(d) {return d.location_admin1_map}),
			admin2MapDim = ndx.dimension(function(d) {return d.location_admin2_map}),
			allDim = ndx.dimension(function(d) {return d;});

	//creating groups (y-axis values)
	var all = ndx.groupAll();
	var countPerDecade = decadeDim.group().reduceCount(),
			countPerYear = yearDim.group().reduceCount(),
			countPerMonth_abbr = monthDim_abbr.group().reduceCount(),
			countPerMonth_full = monthDim_full.group().reduceCount(),
			// countPerMonth_digit = monthDim_digit.group().reduceCount(),
			categoryGroup = categoryNameDim.group().reduceCount(),
			admin1ChartGroup = admin1ChartDim.group().reduceCount(),
			admin2ChartGroup = admin2ChartDim.group().reduceCount(),
			admin1MapGroup = admin1MapDim.group().reduceCount(),
			admin2MapGroup = admin2MapDim.group().reduceCount();

	//creating charts
	var yearChart = dc.pieChart('#chart-ring-year'),
			monthChart = dc.pieChart('#chart-ring-month'),
			categoryChart = dc.rowChart("#chart_row_category"),
			admin1Chart = dc.rowChart("#chart_row_admin1"),
			admin2Chart = dc.rowChart("#chart_row_admin2"),
			admin1Map = dc.geoChoroplethChart("#map_admin1"),
			admin2Map = dc.geoChoroplethChart("#map_admin2"),
			dataCount = dc.dataCount('#data-count'),
			dataTable = dc.dataTable('#data-table');


	//set up maps
	d3.json("data/mg_admin1.json", function(admin1JSON) {
		d3.json("data/mg_admin2.json", function(admin2JSON){

			row1_height = 200;
			row2_height = 400;
			item_width = 300;
			map_width = item_width;
			map_height = row2_height;
			rowChartBarColor = "#3182BD"; //3182BD	

			var projection = d3.geo.mercator();
			var path = d3.geo.path().projection(projection);
			
			//set up scale and translate
			var bounds, scale, offset;
			projection.scale(1).translate([0,0]);
			var bounds = path.bounds(admin1JSON);
			var scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / map_width, (bounds[1][1] - bounds[0][1]) / map_height);
			var offset = [(map_width - scale * (bounds[1][0] + bounds[0][0])) /2, (map_height - scale * (bounds[1][1] + bounds[0][1])) /2 ]; 
			projection.scale(scale).translate(offset);

		////chart configuration.  must be under map data import and set up.
			admin1Map
				.width(map_width)
				.height(map_height)
				.dimension(admin1MapDim)
				.group(admin1MapGroup)
				.colors(d3.scale.quantize().range(colorbrewer.Blues[9]))
        .colorDomain([0, 200])
        .colorCalculator(function (d) { return d ? admin1Map.colors()(d) : '#ccc'; })
				.projection(projection)
				.overlayGeoJson(admin1JSON.features, "mdg_adm1",
					function(d) {
						return d.properties.code;
					}
				)
			;

			admin2Map
				.width(map_width)
				.height(map_height)
				.dimension(admin2MapDim)
				.group(admin2MapGroup)
				.colors(d3.scale.quantize().range(colorbrewer.Blues[9]))
	      .colorDomain([0, 200])
	      .colorCalculator(function (d) { return d ? admin2Map.colors()(d) : '#ccc'; })
				.projection(projection)
				.overlayGeoJson(admin2JSON.features, "mdg_adm2",
					function(d) {
						return d.properties.code_adm2;
					}
				)
			;

			//other charts
			yearChart
				.width(row1_height)
				.height(row1_height)
				.dimension(decadeDim)
				.group(countPerDecade)
				.innerRadius(20);

			monthChart
				.width(row1_height)
				.height(row1_height)
				.dimension(monthDim_abbr)
				.group(countPerMonth_abbr)
				.innerRadius(20)
				.ordering(function(d){
					var order = {
						'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12
					};
					return order[d.key];
				})
			;

			categoryChart
				.width(item_width)
				.height(row1_height)
				.dimension(categoryNameDim)
				.group(categoryGroup)
				.elasticX(true)
				.margins({top: 10, left: 20, right: 10, bottom: 20})
				.colors(rowChartBarColor)
			;

			admin1Chart
				.width(item_width)
				.height(row2_height)
				.dimension(admin1ChartDim)
				.group(admin1ChartGroup)
				.elasticX(true)
				.margins({top: 10, left: 20, right: 10, bottom: 20})
				.colors(rowChartBarColor)
				.ordering(function(d){
					var order = {			
						"Antananarivo":1,"Antsiranana":2,"Fianarantsoa":3,"Mahajanga":4,"Toamasina":5,"Toliara":6,"Other":7,"No response":8
					};
					return order[d.key];
				})
			;

			admin2Chart
				.width(item_width)
				.height(row2_height)
				.dimension(admin2ChartDim)
				.group(admin2ChartGroup)
				.elasticX(true)
				.margins({top: 10, left: 20, right: 10, bottom: 20})
				.colors(rowChartBarColor)
				.ordering(function(d){
					var order = {			
						"Alaotra-Mangoro":1,"Amoron'I Mania":2,"Analamanga":3,"Analanjirofo":4,"Androy":5,"Anosy":6,"Atsimo-Andrefana":7,"Atsimo-Atsinanana":8,"Atsinanana":9,"Betsiboka":10,"Boeny":11,"Bongolava":12,"Diana":13,"Haute Matsiatra":14,"Ihorombe":15,"Itasy":16,"Melaky":17,"Menabe":18,"Sava":19,"Sofia":20,"Vakinankaratra":21,"Vatovavy-Fitovinany":22,"No Data":23, "Other":24, "No response":25
					};
					return order[d.key];
				})
			;

			dataCount
				.dimension(ndx)
				.group(all);

			//data table
			dataTable
				.dimension(allDim)
				.group(function (d) { return 'dc.js insists on putting a row here so I remove it using js'; })
				.size(100)
				.columns([
					function (d) { return d.month_full; },
					function (d) { return d.year; },
					function (d) { return d.categoryName; },
					function (d) { return d.lemurs_quantity; },
					function (d) { return d.location_admin2_chart; },
					function (d) { return d.location_admin1_chart; },
				])
				.sortBy(function (d) { return d.month_abbr; })
				.order(d3.descending)
				.on('renderlet', function (table) {
					// remove extra row dc.js insists on adding when table is rendered
					table.select('tr.dc-table-group').remove();
	    });

			d3.selectAll('a#all').on('click', function() {
				dc.filterAll();
				dc.renderAll();
			});
			d3.selectAll('a#year').on('click', function() {
				yearChart.filterAll();
				dc.redrawAll();
			});
			d3.selectAll('a#month').on('click', function() {
				monthChart.filterAll();
				dc.redrawAll();
			});
			d3.selectAll('a#admin1_chart').on('click', function() {
				admin1Chart.filterAll();
				dc.redrawAll();
			});
			d3.selectAll('a#admin2_chart').on('click', function() {
				admin2Chart.filterAll();
				dc.redrawAll();
			});
			d3.selectAll('a#category').on('click', function() {
				categoryChart.filterAll();
				dc.redrawAll();
			});
			d3.selectAll('a#admin1_map').on('click', function() {
				admin1Map.filterAll();
				dc.redrawAll();
			});
			d3.selectAll('a#admin2_map').on('click', function() {
				admin2Map.filterAll();
				dc.redrawAll();
			});
			dc.renderAll();
			d3.select('.spinner').style("display", "none");
		});
	});
})
;