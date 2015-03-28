$(function () {

	var map = L.map('map', {zoomAnimation:false});
	map.fitWorld();
	map.setZoom(map.getZoom()+1);
	//map.setView([50,10], 5);


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
			setColors(probe);
		});

		canvasLayer.setPoints(probes);
	});


	var socket = io("https://atlas-stream.ripe.net:443", {path: "/stream/socket.io"});

	socket.on("atlas_probestatus", function (event, err) {
		if (err) console.log(err);
		//console.log("I received ");
		//console.log(event);

		probes.forEach(function (probe) {
			if(probe.id == event.prb_id){
				console.log((new Date()).getTime());
				console.log(probe);
				probe.status = setStatus(event.event);
				setColors(probe);
				canvasLayer.redraw();

				var r = 50;
				var c = L.circleMarker([probe.latitude, probe.longitude], {fillColor: probe.fillColor, color: probe.strokeColor, fillOpacity: 1}).addTo(map);
				var startTime = (new Date()).getTime();
				var interval = setInterval(function () {
					var time = (new Date()).getTime();
					c.setRadius( r*(0-startTime+time)/1000);
					if (time > startTime+1000) {
						map.removeLayer(c);
						clearInterval(interval);
					}
				}, 40);



			}
		})

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

	function setStatus(val){
		if(val == 'connect'){
			return 1;
		}else if(val == 'disconnect'){
			return 2;
		}

	}

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