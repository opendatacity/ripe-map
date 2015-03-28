function CanvasLayer (map) {
	var me = {};

	var updateFunctions = [];

	var markers = [];

	for (var i = 0; i < 1000; i++) {
		markers.push({
			lat: (Math.random()-0.5)*170,
			lng: (Math.random()-0.5)*360,
			color: 'rgb('+Math.round(Math.random()*256)+','+Math.round(Math.random()*256)+','+Math.round(Math.random()*256)+')'
		})
	}

	markers.forEach(function (marker) { marker.levelPosition = [] });

	var layoutedLevel = [];

	var canvasTiles = L.tileLayer.canvas();

	canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
		if (!layoutedLevel[zoom]) layoutLevel(zoom);

		var size = canvas.width;
		var ctx = canvas.getContext('2d');

		var zoomExp = Math.pow(2, zoom);
		var x0 = tilePoint.x*size;
		var y0 = tilePoint.y*size;
		var x1 = x0 + size;
		var y1 = y0 + size;

		markers.forEach(function (marker) {
			var point = marker.levelPosition[zoom];
			var r = point.r;

			if (point.x + r < x0) return;
			if (point.x - r > x1) return;
			if (point.y + r < y0) return;
			if (point.y - r > y1) return;

			ctx.beginPath();
			ctx.arc(
				point.x - x0,
				point.y - y0,
				r, 0, Math.PI*2, false);
			ctx.fillStyle = marker.color;
			ctx.fill();
		})
	}

	function layoutLevel(zoom) {
		markers.forEach(function (marker) {
			var p =  map.project([marker.lat, marker.lng], zoom);
			marker.levelPosition[zoom] = { x0:p.x, y0:p.y, x:p.x, y:p.y, r:5 }
		})
	}

	canvasTiles.addTo(map);

	return me;
}