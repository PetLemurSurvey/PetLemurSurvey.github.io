
var admin2_KV, 
		admin1_KV,
		lemur_category_KV

	// var map = L.map('map');
	// var breweryMarkers = new L.FeatureGroup();

	// L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	// 	maxZoom: 19,
	// 	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	// 	}).addTo(map);


	d3.json('data/lemurSample_20160705-0137.json', function(error, data) {

		// key/values for codes returned from API source
		admin2_KV = {
			"alaotra-mangoro":"Alaotra-Mangoro",
			"amoron.i_mania":"Amoron'I Mania",
			"analamanga":"Analamanga",
			"analanjirofo":"Analanjirofo",
			"androy":"Androy",
			"anosy":"Anosy",
			"atsimo-andrefana":"Atsimo-Andrefana",
			"atsimo-atsinanana":"Atsimo-Atsinanana",
			"atsinanana":"Atsinanana",
			"betsiboka":"Betsiboka",
			"boeny":"Boeny",
			"bongolava":"Bongolava",
			"diana":"Diana",
			"haute_matsiatra":"Haute Matsiatra",
			"ihorombe":"Ihorombe",
			"itasy":"Itasy",
			"melaky":"Melaky",
			"menabe":"Menabe",
			"sava":"Sava",
			"sofia":"Sofia",
			"vakinankaratra":"Vakinankaratra",
			"vatovavy-fitovinany":"Vatovavy-Fitovinany",
			"noData":"No Data",
			"other":"Other"
		};
		admin1_KV = {
			"antananarivo":"Antananarivo",
			"antsiranana":"Antsiranana",
			"fianarantsoa":"Fianarantsoa",
			"mahajanga":"Mahajanga",
			"toamasina":"Toamasina",
			"toliara":"Toliara",
			"other":"Other"
		}
		lemur_category_KV = {
			"aye_aye":"Aye Aye",
			"bamboo_lemur":"Bamboo lemur",
			"brown_lemur":"Brown lemur",
			"dwarf_lemur":"Dwarf lemur",
			"fork_marked_lemur":"Fork marked lemur",
			"giant_mouse_lemurs":"Giant mouse lemurs",
			"greater_bamboo_lemur":"Greater bamboo lemur",
			"indri":"Indri",
			"mouse_lemur":"Mouse lemur",
			"ring-tailed_lemur":"Ring-tailed lemur",
			"ruffed_lemurs":"Ruffed lemurs",
			"sifaka":"Sifaka",
			"sportive_lemur":"Sportive lemur",
			"woolly_lemur":"Woolly lemur",
			"I_dont_remembe":"Didn't Remember"
		}
		var lemurData = data.kobo_data;
		var fullDateFormat = d3.time.format('%Y-%m-%d');
		var yearFormat = d3.time.format('%Y');
		var monthFormat = d3.time.format('%b'); 

		//normalize/parse data so dc can coorrectly sort and bin them
		lemurData.forEach(function(d) {
			d.count = +d.count;
			d.lemurs_quantity = d.lemurs_quantity;
			d.categoryName = lemur_category_KV[d.lemur_category];
			d.when_seen_dt = fullDateFormat.parse(d.month_and_year);
			d.when_seen_year = yearFormat(d.when_seen_dt);
			d.when_seen_month = monthFormat(d.when_seen_dt);
			d.location_admin1_chart = admin1_KV[d.location_admin1];
			d.location_admin1_map = d.location_admin1;
			d.location_admin2_chart = admin2_KV[d.location_admin2];
			d.location_admin2_map = d.location_admin2
		});

		//set crossfilter
		var ndx = crossfilter(lemurData);

		//create dimensions (x-axis values)
		var quantityDim = ndx.dimension(function(d) {return d.lemurs_quantity})
				yearDim = ndx.dimension(function(d) {return d.when_seen_year;}),
				//dc.pluck:  short hand for same kind of anonymous function we used for yearDim
				monthDim = ndx.dimension(dc.pluck('when_seen_month')),
				categoryNameDim = ndx.dimension(function(d) {return d.categoryName;}),
				admin1ChartDim = ndx.dimension(function(d) {return d.location_admin1_chart}),
				admin2ChartDim = ndx.dimension(function(d) {return d.location_admin2_chart})
				admin1MapDim = ndx.dimension(function(d) {return d.location_admin1_map})
				admin2MapDim = ndx.dimension(function(d) {return d.location_admin2_map})
				allDim = ndx.dimension(function(d) {return d;});


		//creating groups (y-axis values)
		var all = ndx.groupAll();
		var countPerYear = yearDim.group().reduceCount(),
				countPerMonth = monthDim.group().reduceCount(),
				categoryGroup = categoryNameDim.group().reduceCount()
				admin1ChartGroup = admin1ChartDim.group().reduceCount()
				admin2ChartGroup = admin2ChartDim.group().reduceCount()
				admin1MapGroup = admin1MapDim.group().reduceCount()
				admin2MapGroup = admin2MapDim.group().reduceCount();

		//creating charts
		var yearChart = dc.pieChart('#chart-ring-year'),
				monthChart = dc.pieChart('#chart-ring-month'),
				categoryChart = dc.rowChart("#chart_row_category")
				admin1Chart = dc.rowChart("#chart_row_admin1")
				admin2Chart = dc.rowChart("#chart_row_admin2")
				admin1Map = dc.geoChoroplethChart("#map_admin1");
				admin2Map = dc.geoChoroplethChart("#map_admin2");
				dataCount = dc.dataCount('#data-count'),
				dataTable = dc.dataTable('#data-table');



		d3.json("data/mdg_admin1.json", function(admin1JSON) {
				d3.json("data/mdg_admin2.json", function(admin2JSON){

				console.log(admin1JSON, admin2JSON)
				var width = 300;
				var height = 450
				var projection = d3.geo.mercator();
				var path = d3.geo.path().projection(projection);
				

				//set up scale and translate
				var bounds, scale, offset;
				projection.scale(1).translate([0,0]);
				var bounds = path.bounds(admin1JSON);
				var scale = .95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
				var offset = [(width - scale * (bounds[1][0] + bounds[0][0])) /2, (height - scale * (bounds[1][1] + bounds[0][1])) /2 ]; 
				projection.scale(scale).translate(offset);



			////chart configuration
				admin1Map
					.width(width)
					.height(height)
					.dimension(admin1MapDim)
					.group(admin1MapGroup)
					.colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
	        .colorDomain([0, 200])
	        .colorCalculator(function (d) { return d ? admin1Map.colors()(d) : '#ccc'; })
					.projection(projection)
					.overlayGeoJson(admin1JSON.features, "mdg_adm1",
						function(d) {
							return d.properties.code;
						})

				admin2Map
				.width(width)
				.height(height)
				.dimension(admin2MapDim)
				.group(admin2MapGroup)
				.colors(d3.scale.quantize().range(["#E2F2FF", "#C4E4FF", "#9ED2FF", "#81C5FF", "#6BBAFF", "#51AEFF", "#36A2FF", "#1E96FF", "#0089FF", "#0061B5"]))
        .colorDomain([0, 200])
        .colorCalculator(function (d) { return d ? admin2Map.colors()(d) : '#ccc'; })
				.projection(projection)
				.overlayGeoJson(admin2JSON.features, "mdg_adm2",
					function(d) {
						return d.properties.code_adm2;
					})

				//circle charts
				yearChart
					.width(150)
					.height(150)
					.dimension(yearDim)
					.group(countPerYear)
					.innerRadius(20);

				monthChart
					.width(150)
					.height(150)
					.dimension(monthDim)
					.group(countPerMonth)
					.innerRadius(20)
					.ordering(function(d){
						var order = {
							'Jan':1,'Feb':2,'Mar':3,'Apr':4,'May':5,'Jun':6,'Jul':7,'Aug':8,'Sep':9,'Oct':10,'Nov':11,'Dec':12
						};
						return order[d.key];
					});

				categoryChart
					.width(300)
					.height(450)
					.dimension(categoryNameDim)
					.group(categoryGroup)
					.elasticX(true)
					.margins({top: 10, left: 20, right: 10, bottom: 20})
					// .xAxis().tickValues([0, 1, 2, 3, 4, 5]);

				admin1Chart
					.width(300)
					.height(300)
					.dimension(admin1ChartDim)
					.group(admin1ChartGroup)
					.elasticX(true)
					.margins({top: 10, left: 20, right: 10, bottom: 20})
					// .xAxis().tickValues([0, 1, 2, 3, 4, 5]);
					.ordering(function(d){
						var order = {			
							"Antananarivo":1,"Antsiranana":2,"Fianarantsoa":3,"Mahajanga":4,"Toamasina":5,"Toliara":6,"Other":7
						};
						return order[d.key];
					});

				admin2Chart
					.width(300)
					.height(300)
					.dimension(admin2ChartDim)
					.group(admin2ChartGroup)
					.elasticX(true)
					.margins({top: 10, left: 20, right: 10, bottom: 20})
					.ordering(function(d){
						var order = {			
							"Alaotra-Mangoro":1,"Amoron'I Mania":2,"Analamanga":3,"Analanjirofo":4,"Androy":5,"Anosy":6,"Atsimo-Andrefana":7,"Atsimo-Atsinanana":8,"Atsinanana":9,"Betsiboka":10,"Boeny":11,"Bongolava":12,"Diana":13,"Haute Matsiatra":14,"Ihorombe":15,"Itasy":16,"Melaky":17,"Menabe":18,"Sava":19,"Sofia":20,"Vakinankaratra":21,"Vatovavy-Fitovinany":22,"No Data":23, "Other":24
						};
						return order[d.key];
					});


				dataCount
					.dimension(ndx)
					.group(all);

				//data table
				dataTable
					.dimension(allDim)
					.group(function (d) { return 'dc.js insists on putting a row here so I remove it using js'; })
					.size(100)
					.columns([
						function (d) { return d.month_and_year; },
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

});