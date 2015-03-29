$(function () {

	var map = L.map('map', {zoomAnimation: false, maxZoom: 22});
	map.fitWorld();
	map.setZoom(map.getZoom() + 1);
	//map.setView([50,10], 5);


	// add an OpenStreetMap tile layer
	L.tileLayer('https://{s}.tiles.mapbox.com/v4/michaelkreil.opruxcpf/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibWljaGFlbGtyZWlsIiwiYSI6InloMHBnMUkifQ.A5ZAmIPkC-y7yRgNva0chQ', {
		attribution: '&copy; OpenDataCity'
	}).addTo(map);

	var canvasLayer = new CanvasLayer(map);

	var probes;
	var country = [];
	var stability = [];

	var margin = {
		top: 20,
		bottom: 20,
		left: 20,
		right: 5
	};

	var width = $('#m').innerWidth() - margin.left - margin.right,
		height = $('#m').innerHeight() - margin.top - margin.bottom;


	var tooltip = d3.select("#tooltip")
		.append("div")
		.attr("class", "tipp")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden");


	var activity = d3.select('#viz').append('svg')
		.attr('width', $('#m').innerWidth())
		.attr('height', $('#m').innerHeight())
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


	$.getJSON('data/probes.json', function (data) {
		probes = [];

		Object.keys(data).forEach(function (key) {
			data[key].forEach(function (value, index) {
				if (!probes[index]) probes[index] = {};
				probes[index][key] = value;
			})
		})

		probes = probes.filter(function (probe) {
			return probe.status > 0;
		})

		probes.forEach(function (probe) {
			setColors(probe);
		});

		prepareData(probes);
		initChart();
		canvasLayer.setPoints(probes);
	});

	var popup = L.popup();
	canvasLayer.on('click', function (marker) {
		var html = [];
		html.push('<td><b>Probe</b></td><td>#' + marker.id + '</td>');
		html.push('<td><b>ASN (v4)</b></td><td>' + marker.asn_v4 + '</td>');
		html.push('<td><b>Prefix (v4)</b></td><td>' + marker.prefix_v4 + '</td>');
		html.push('<td><b>Status (v4)</b></td><td>' + marker.status_name + '<br>Since ' + (new Date(marker.status_since * 1000)).toISOString() + '</td>');
		html = html.join('</tr><tr>');
		html = '<table><tr>' + html + '</tr></table>';

		popup
			.setLatLng([marker.latitude, marker.longitude])
			.setContent(html)
			.openOn(map);
	})


	var socket = io('https://atlas-stream.ripe.net:443', {path: '/stream/socket.io'});

	socket.on('atlas_probestatus', function (event, err) {
		if (err) console.log(err);

		probes.forEach(function (probe) {
			if (probe.id == event.prb_id) {
				//console.log((new Date()).getTime());
				console.log(probe);
				probe.status = setStatus(event.event);
				setColors(probe);
				canvasLayer.redraw();


				//var c = d3.select('#country_'+probe.counrty_code);
				//console.log(c);

				var r = 50;
				var c = L.circleMarker(
					[probe.latitude, probe.longitude],
					{fillColor: probe.fillColor, fillOpacity: 1, stroke: false}
				).addTo(map);
				var startTime = (new Date()).getTime();
				redrawCircle();
				var interval = setInterval(redrawCircle, 40);

				function redrawCircle() {
					var time = (new Date()).getTime();
					var v = (time - startTime) / 1000;
					c.setRadius(r * v);
					var opacity = 1 - Math.pow(v, 2);
					c.setStyle({fillOpacity: opacity});

					if (time > startTime + 1000) {
						map.removeLayer(c);
						clearInterval(interval);
					}
				}
			}
		})
	});

	socket.on('connect', function (con) {
		//socket.emit('atlas_subscribe', {stream_type: 'probestatus', sendBacklog: true});
		socket.emit('atlas_subscribe', {stream_type: 'probestatus'});

		// Do something when the subscription has been terminated
		socket.on('atlas_unsubscribed', function (what) {
			console.log('The client has been unsubscribed from ' + what);
		});

		socket.on('atlas_error', function (err) {
			console.log(err);
		});

	});

	function prepareData(probes) {
		probes.forEach(function (p) {
			if (country.indexOf(p.country_code) == -1) {
				var i = country.push(p.country_code);
				stability[i - 1] = {
					country: p.country_code,
					id: i - 1,
					online: 0,
					offline: 0,
					probes: 0,
					last_activities: []
				}
			}
		});

		probes.forEach(function (p) {
			var i = country.indexOf(p.country_code);
			if (p.status == 1) {
				stability[i].probes++;
				stability[i].online++;
			} else if (p.status == 2) {
				stability[i].probes++;
				stability[i].offline++;
			}
		});

	}

	function initChart() {

		stability = stability.filter(function (country) {
			return (country.probes > 0);
		})

		var radius = Math.sqrt(width*height/stability.length)*0.93 - 4;
		
		var w = radius/2,	h = 2;

		stability.sort(function (a, b) {
			return b.online - a.online;
		});

		stability.forEach(function (country) {
			var on_perc = 100 * country.online / country.probes;
			var off_perc = 100 - on_perc;

			if (on_perc == 100) {
				on_perc = 99;
				off_perc = 1;
			} else if (off_perc == 100) {
				off_perc = 99;
				on_perc = 1;
			}
			var angleOnline = (Math.PI * 2 ) / 100 * on_perc;
			var angleOffline = (Math.PI * 2 ) / 100 * off_perc;

			if ((w + radius + 4) > width) {
				w = radius/2;
				h = (h + radius + 4);
			}

			var c = activity.append('g')
				.attr('class', 'country_' + country.country)
				.attr('transform', 'translate(' + w + ',' + h + ')')
				.datum(country)
				.on('mouseover', function (d) {
					var s = "<b>" + d.country + "</b><br>Online: " + d.online + " <br> Offline: " + d.offline + " <br> Probes: " + d.probes;
					return tooltip.style("visibility", "visible")
						.html(s);
				})
				.on('mousemove', function (d) {
					return tooltip.style("top", (d3.event.layerY - 10) + "px")
						.style("left", (d3.event.layerX + 10) + "px");
				})
				.on('mouseout', function (d) {
					return tooltip.style("visibility", "hidden");
				})

			var x1 =  (radius / 2) * Math.sin(0);
			var y1 = -(radius / 2) * Math.cos(0);
			var x2 =  (radius / 2) * Math.sin(angleOnline);
			var y2 = -(radius / 2) * Math.cos(angleOnline);

			var big = 0;
			if (angleOnline > Math.PI) {
				big = 1;
			}

			var d = "M " + 0 + "," + 0 +					// Start at circle center
				" L " + x1 + "," + y1 +				 // Draw line to (x1,y1)
				" A " + (radius / 2) + "," + (radius / 2) + // Draw an arc of radius r
				" 0 " + big + ", 1 " +				   // Arc details...
				x2 + "," + y2 +						 // Arc goes to to (x2,y2)
				" Z";

			c.append('path')
				.attr('id', country.country)
				.attr('class', 'online')
				.attr('d', d);

			var x1_ =  (radius / 2) * Math.sin(angleOnline);
			var y1_ = -(radius / 2) * Math.cos(angleOnline);
			var x2_ =  (radius / 2) * Math.sin(angleOnline + angleOffline);
			var y2_ = -(radius / 2) * Math.cos(angleOnline + angleOffline);

			var big_ = 1 - big;

			var d_ = "M " + 0 + "," + 0 +					// Start at circle center
				" L " + x1_ + "," + y1_ +				 // Draw line to (x1,y1)
				" A " + (radius / 2) + "," + (radius / 2) + // Draw an arc of radius r
				" 0 " + big_ + ", 1 " +				   // Arc details...
				x2_ + "," + y2_ +						 // Arc goes to to (x2,y2)
				" Z";

			c.append('path')
				.attr('id', country.country)
				.attr('class', 'offline')
				.attr('d', d_);

			w = (w + radius + 4);
		});

		stability.sort(function (a, b) {
			return a.id - b.id;
		});
	}

	function setStatus(val) {
		if (val == 'connect') {
			return 1;
		} else if (val == 'disconnect') {
			return 2;
		}
	}

	function setColors(probe) {
		switch (probe.status) {
			case 0 :
				probe.fillColor = 'rgba(234,196,0,1.0)';
				probe.strokeColor = 'rgba(0,0,0,0.1)';
				break;
			case 1:
				probe.fillColor = 'rgba(67,168,0,1.0)';
				probe.strokeColor = 'rgba(0,0,0,0.1)';
				break;
			case 2:
				probe.fillColor = 'rgba(168,0,17,1.0)';
				probe.strokeColor = 'rgba(0,0,0,0.1)';
				break;

			case 3:
				probe.fillColor = 'rgba(120,120,120,1.0)';
				probe.strokeColor = 'rgba(0,0,0,0.1)';
				break;
		}
	}

})