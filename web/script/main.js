$(function () {
	var map = L.map('map');

	map.fitWorld();
	map.setZoom(map.getZoom() + 1);
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
			setColors(probe)
			//probe.fillColor = (['#eee', '#8e8', '#e88', '#eee'])[probe.status];
			//probe.strokeColor = (['#888', '#484', '#844', '#888'])[probe.status];
			//probe.r = 3;
		});

		canvasLayer.setPoints(probes);
	});


	var socket = io("https://atlas-stream.ripe.net:443", {path: "/stream/socket.io"});

	socket.on("atlas_probestatus", function (event, err) {
		if (err) console.log(err);
		console.log("I received ");
		console.log(event);

	});

	socket.on("connect", function (con) {
		//socket.emit("atlas_subscribe", {stream_type: "probestatus", sendBacklog: true});
		socket.emit('atlas_subscribe', {stream_type: "probestatus"});

		// Do something when the subscription has been terminated
		socket.on("atlas_unsubscribed", function (what) {
			console.log("The client has been unsubscribed from " + what);
		});

		socket.on("atlas_error", function (err) {
			console.log(err);
		});

	});

	function setColors(probe) {
		switch (probe.status) {
			case 0 :
				probe.fillColor = 'rgba(255,215,0, 0.5)';
				probe.strokeColor = 'rgba(255,215,0, 0.8)';
				break;
			case 1:
				probe.fillColor = 'rgba(111,200,51, 0.5)';
				probe.strokeColor = 'rgba(111,200,51, 0.8)';
				break;
			case 2:
				probe.fillColor = 'rgba(189,31,48, 0.5)';
				probe.strokeColor = 'rgba(189,31,48, 0.8)';
				break;

			case 3:
				probe.fillColor = 'rgba(98,98,98, 0.5)';
				probe.strokeColor = 'rgba(98,98,98, 0.5)';
				break;
		}
	}

})