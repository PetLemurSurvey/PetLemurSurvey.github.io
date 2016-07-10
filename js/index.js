var admin2_KV, 
		admin1_KV,
		lemur_category_KV,
		row1_height,
		row2_height,
		map_height,
		map_width,
		item_width,
		rowChartBarColor	

//import data from survey, and provide values for codes returned from API ("KV" = key/value)

	d3.json('https://cors.io/?u=https://lemursurvey.herokuapp.com/', function(error, data) {		
		month_KV = {
			"no_response":"No response",
			"i_dont_know":"I dont know",
			"january":"Jan","february":"Feb","march":"Mar","april":"Apr","may":"May","june":"Jun","july":"July","august":"Aug","september":"Sept","october":"Oct","november":"Nov","december":"Dec"
		};
		year_KV = {
			"no_response":"No response",
			"i_dont_know":"I don't know",
			"2016":"2016","2015":"2015","2014":"2014","2013":"2013","2012":"2012","2011":"2011","2010":"2010","2009":"2009","2008":"2008","2007":"2007","2006":"2006","2005":"2005","2004":"2004","2003":"2003","2002":"2002","2001":"2001","2000":"2000","1999":"1999","1998":"1998","1997":"1997","1996":"1996","1995":"1995","1994":"1994","1993":"1993","1992":"1992","1991":"1991","1990":"1990","1989":"1989","1988":"1988","1987":"1987","1986":"1986","1985":"1985","1984":"1984","1983":"1983","1982":"1982","1981":"1981","1980":"1980","1979":"1979","1978":"1978","1977":"1977","1976":"1976","1975":"1975","1974":"1974","1973":"1973","1972":"1972","1971":"1971","1970":"1970","1969":"1969","1968":"1968","1967":"1967","1966":"1966","1965":"1965","1964":"1964","1963":"1963","1962":"1962","1961":"1961","1960":"1960"
			// ,
			// "before_1960":"before 1960",
		};
		quantity_KV = {
			"no_answer":"No response",
			"i_don_t_know":"I don't know",
			"1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","10":"10","11":"11","12":"12","13":"13","14":"14","15":"15","16":"16","17":"17","18":"18","19":"19","20":"20"
			,"more_than_20":"21 or more"
		}
		admin1_KV = {
			"antananarivo":"Antananarivo","antsiranana":"Antsiranana","fianarantsoa":"Fianarantsoa","mahajanga":"Mahajanga","toamasina":"Toamasina","toliara":"Toliara","other":"Other","no_response":"No response"
		};
		admin2_KV = {
			"alaotra-mangoro":"Alaotra-Mangoro","amoron.i_mania":"Amoron'I Mania","analamanga":"Analamanga","analanjirofo":"Analanjirofo","androy":"Androy","anosy":"Anosy","atsimo-andrefana":"Atsimo-Andrefana","atsimo-atsinanana":"Atsimo-Atsinanana","atsinanana":"Atsinanana","betsiboka":"Betsiboka","boeny":"Boeny","bongolava":"Bongolava","diana":"Diana","haute_matsiatra":"Haute Matsiatra","ihorombe":"Ihorombe","itasy":"Itasy","melaky":"Melaky","menabe":"Menabe","sava":"Sava","sofia":"Sofia","vakinankaratra":"Vakinankaratra","vatovavy-fitovinany":"Vatovavy-Fitovinany","no_response":"No response","other":"Other"
		};
		lemur_category_KV = {
			"aye_aye":"Aye Aye","bamboo_lemur":"Bamboo lemur","brown_lemur":"Brown lemur","dwarf_lemur":"Dwarf lemur","fork_marked_lemur":"Fork marked lemur","giant_mouse_lemurs":"Giant mouse lemurs","greater_bamboo_lemur":"Greater bamboo lemur","indri":"Indri","mouse_lemur":"Mouse lemur","ring-tailed_lemur":"Ring-tailed lemur","ruffed_lemurs":"Ruffed lemurs","sifaka":"Sifaka","sportive_lemur":"Sportive lemur","woolly_lemur":"Woolly lemur","I_dont_remembe":"I don't remember","no_response":"No response","other":"Other"
		}
		var lemurData = data.responses;
		var fullDateFormat = d3.time.format('%Y-%m-%d');
		var yearFormat = d3.time.format('%Y');
		var monthFormat = d3.time.format('%b'); 

		//normalize/parse data for dc.js
		lemurData.forEach(function(d) {
			d.count = +d.count;
			d.lemurs_quantity = quantity_KV[d.lemurs_quantity];
			d.categoryName = lemur_category_KV[d.lemur_category];
			d.month = month_KV[d.month];
			d.year = year_KV[d.year];
			d.location_admin1_chart = admin1_KV[d.location_admin1];
			d.location_admin1_map = d.location_admin1;
			d.location_admin2_chart = admin2_KV[d.location_admin2];
			d.location_admin2_map = d.location_admin2
		});

		//set crossfilter
		var ndx = crossfilter(lemurData);

		//create dimensions (x-axis values)
		var quantityDim = ndx.dimension(function(d) {return d.lemurs_quantity}),
				//dc.pluck:  short hand for same kind of anonymous function we used for yearDim
				// monthDim = ndx.dimension(dc.pluck('when_seen_month')),
				monthDim = ndx.dimension(function(d) {return d.month}),
				yearDim = ndx.dimension(function(d) {return d.year}),
				categoryNameDim = ndx.dimension(function(d) {return d.categoryName;}),
				admin1ChartDim = ndx.dimension(function(d) {return d.location_admin1_chart}),
				admin2ChartDim = ndx.dimension(function(d) {return d.location_admin2_chart}),
				admin1MapDim = ndx.dimension(function(d) {return d.location_admin1_map}),
				admin2MapDim = ndx.dimension(function(d) {return d.location_admin2_map}),
				allDim = ndx.dimension(function(d) {return d;});

		//creating groups (y-axis values)
		var all = ndx.groupAll();
		var countPerYear = yearDim.group().reduceCount(),
				countPerMonth = monthDim.group().reduceCount(),
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
		d3.json("data/mdg_admin1.json", function(admin1JSON) {
				d3.json("data/mdg_admin2.json", function(admin2JSON){

				row1_height = 200;
				row2_height = 400;
				item_width = 300
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
					// .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
	        .colorDomain([0, 200])
	        .colorCalculator(function (d) { return d ? admin1Map.colors()(d) : '#ccc'; })
					.projection(projection)
					.overlayGeoJson(admin1JSON.features, "mdg_adm1",
						function(d) {
							return d.properties.code;
						})
					;

				admin2Map
				.width(map_width)
				.height(map_height)
				.dimension(admin2MapDim)
				.group(admin2MapGroup)
				.colors(d3.scale.quantize().range(colorbrewer.Blues[9]))
				// .colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
        .colorDomain([0, 200])
        .colorCalculator(function (d) { return d ? admin2Map.colors()(d) : '#ccc'; })
				.projection(projection)
				.overlayGeoJson(admin2JSON.features, "mdg_adm2",
					function(d) {
						return d.properties.code_adm2;
					})
				;

				//other charts
				yearChart
					.width(row1_height)
					.height(row1_height)
					.dimension(yearDim)
					.group(countPerYear)
					.innerRadius(20);

				monthChart
					.width(row1_height)
					.height(row1_height)
					.dimension(monthDim)
					.group(countPerMonth)
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
						function (d) { return d.month; },
						function (d) { return d.year; },
						function (d) { return d.categoryName; },
						function (d) { return d.lemurs_quantity; },
						function (d) { return d.location_admin2_chart; },
						function (d) { return d.location_admin1_chart; },
					])
					.sortBy(function (d) { return d.month_and_year; })
					.order(d3.descending)
					.on('renderlet', function (table) {
						//each time table is rendered remove extra row dc.js insists on adding
						table.select('tr.dc-table-group').remove();

			// Map markers
		      // breweryMarkers.clearLayers();
		      // _.each(allDim.top(Infinity), function (d) {
		      //   var loc = d.brewery.location;
		      //   var name = d.brewery.brewery_name;
		      //   var marker = L.marker([loc.lat, loc.lng]);
		      //   marker.bindPopup("<p>" + name + " " + loc.brewery_city + " " + loc.brewery_state + "</p>");
		      //   breweryMarkers.addLayer(marker);
		      // });
		      // map.addLayer(breweryMarkers);
		      // map.fitBounds(breweryMarkers.getBounds());
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
			// d3.select(self.frameElement).style("height", height + "px");

		});
	});

})
.header('Access-Control-Allow-Origin',"*");