
$(function () {
	var map = L.map('map');
	map.fitWorld();
	map.setZoom(map.getZoom()+1);

	// add an OpenStreetMap tile layer
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	var canvasLayer = new CanvasLayer(map);

	var probes;

	$.getJSON('data/probes.json', function (data) {
		probes = [];
		Object.keys(data).forEach(function (key) {
			data[key].forEach(function (value, index) {
				if (!probes[index]) probes[index] = {};
				probes[index][key] = value;
			})
		})

		probes.forEach(function (probe) {
			probe.fillColor   = (['#eee','#8d9','#faa','#eee'])[probe.status];
			probe.strokeColor = (['#888','#485','#855','#888'])[probe.status];
			//probe.r = 3;
		});

		canvasLayer.setPoints(probes);
	})
})