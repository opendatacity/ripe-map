
$(function () {
	var map = L.map('map');
	//map.fitWorld();
	//map.setZoom(map.getZoom()+);
	map.setView([50,10], 5);

	// add an OpenStreetMap tile layer
	L.tileLayer('http://odcdn.de:7772/europe2/{z}/{x}/{y}.png', {
		attribution: '&copy; OpenDataCity'
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
			probe.fillColor   = (['#eee','#8e8','#e88','#eee'])[probe.status];
			probe.strokeColor = (['#888','#484','#844','#888'])[probe.status];
			//probe.r = 3;
		});

		canvasLayer.setPoints(probes);
	})
})