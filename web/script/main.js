$(function () {

	var map = L.map('map', {zoomAnimation: false, maxZoom: 22});
	map.fitWorld();
	map.setZoom(map.getZoom() + 1);
	//map.setView([50,10], 5);

	var since, until, speed;


	// Amsterdam Power outage
	//since 1427446800 -> 27th March 2015 09:00 am
	//until 1427500800 -> 28th March 2015 00:00

	if(location.hash !== ''){
		var a = location.hash.split('_');
		since = a[0];
		until = a[1];
		speed = a[2];
	}else{
		// 1 day -> 24h -> 1440 min -> 86400 sec
		since = Math.floor(Date.now()/1000) - 86400;
		until = Math.floor(Date.now()/1000);
		speed = 10.0;
	}

	console.log('since: '+since+' until: '+until+' speed: '+speed);


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

	//var width = $('#m').innerWidth() - margin.left - margin.right,
	//	height = $('#m').innerHeight() - margin.top - margin.bottom;

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
		//initChart();
		//canvasLayer.setPoints(probes); -> probes are not available for history data
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


	// TODO every node that appear as an event should be placed on the map
	socket.on('atlas_probestatus', function (event, err) {
		if (err) console.log(err);

		console.log(event);

		probes.forEach(function (probe) {
			if (probe.id == event.prb_id) {
				//console.log(probe);
				probe.status = setStatus(event.event);
				setColors(probe);
				canvasLayer.redraw();

				//if(probe.event == 'disconnect'){
				//	stability[country.indexOf(probe.country_code)].online--;
				//	stability[country.indexOf(probe.country_code)].offline++;
				//}else if(probe.event == 'connect'){
				//	stability[country.indexOf(probe.country_code)].online++;@
				//	stability[country.indexOf(probe.country_code)].online--;
				//}

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
		});
	});


	socket.on('connect', function (con) {
		//socket.emit('atlas_subscribe', {stream_type: 'probestatus', sendBacklog: true});
		socket.emit('atlas_subscribe', {
			stream_type: 'probestatus',
			startTime: since,
			endTime: until,
			speed: speed
		});

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