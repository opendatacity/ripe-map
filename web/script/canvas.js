function CanvasLayer (map) {
	var me = {};

	var minZoom = 4;
	var maxZoom = 20;

	var radius = 3;

	var updateFunctions = [];

	var markers = [];

	me.setPoints = function (list) {
		markers = list;
		layoutLevels();
		me.redraw();
	}

	me.redraw = function () {
		updateFunctions.forEach(function (update) { update() });
	}

	var canvasTiles = L.tileLayer.canvas();

	canvasTiles.drawTile = function (canvas, tilePoint, zoom) {
		var size = canvas.width;
		var ctx = canvas.getContext('2d');

		var zoomExp = Math.pow(2, zoom);
		var x0 = tilePoint.x*size;
		var y0 = tilePoint.y*size;
		var x1 = x0 + size;
		var y1 = y0 + size;
		
		var levelZoom = Math.min(maxZoom, Math.max(zoom, minZoom));
		
		var scale = Math.pow(2, zoom-levelZoom);
		var r = radius*scale;

		function drawTile () {
			ctx.clearRect(0,0,size,size);

			markers.forEach(function (marker) {
				var point = marker.levelPosition[levelZoom];
				var x = point.x*scale;
				var y = point.y*scale;

				if (x + r < x0) return;
				if (x - r > x1) return;
				if (y + r < y0) return;
				if (y - r > y1) return;

				ctx.beginPath();
				ctx.arc(
					x - x0,
					y - y0,
					r, 0, Math.PI*2, false);
				ctx.fillStyle = marker.fillColor;
				ctx.fill();
				ctx.lineWidth = scale;
				ctx.strokeStyle = marker.strokeColor;
				ctx.stroke();
			})
		}

		drawTile();

		updateFunctions.push(drawTile);
	}

	function layoutLevels() {
		markers.forEach(function (marker) {
			marker.levelPosition = [];
		});

		markers.forEach(function (marker) {
			var p = map.project([marker.latitude, marker.longitude], maxZoom);
			marker.levelPosition[maxZoom] = { x0:p.x, y0:p.y, x:p.x, y:p.y }
		})

		layout(maxZoom);

		for (var zoom = maxZoom-1; zoom >= minZoom; zoom--) {
			markers.forEach(function (marker) {
				var p0 = map.project([marker.latitude, marker.longitude], zoom);
				var p = marker.levelPosition[zoom+1];
				marker.levelPosition[zoom] = {
					x0:p.x0/2,
					y0:p.y0/2,
					x: p0.x,
					y: p0.y
				};
			})
			layout(zoom);
		}

		function layout(zoom) {

		}
	}

	canvasTiles.addTo(map);

	return me;
}