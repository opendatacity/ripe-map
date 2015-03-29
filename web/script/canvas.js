function CanvasLayer (map) {
	var me = {};

	var minZoom = 4;
	var maxZoom = 20;

	var radius = 3;

	var tiles = {};

	var markers = [];

	me.setPoints = function (list) {
		markers = list;
		resetLayout();
		me.redraw();
	}
	
	me.redraw = function () {
		Object.keys(tiles).forEach(function (key) {
			var tile = tiles[key];
			if ($(tile.canvas).parent().length < 1) {
				delete tiles[key];
				return
			}
			tile.redraw();
		});
	}

	var canvasLayer = L.tileLayer.canvas();

	canvasLayer.drawTile = function (canvas, tilePoint, zoom) {
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

		var key = [zoom, tilePoint.x, tilePoint.y].join('_');
		tiles[key] = {
			canvas:canvas,
			redraw:drawTile
		}
	}

	function resetLayout() {
		markers.forEach(function (marker) {
			marker.levelPosition = [];
			var p = map.project([marker.latitude, marker.longitude], maxZoom);
			marker.levelPosition[maxZoom] = { x0:p.x, y0:p.y, x:p.x, y:p.y }
		})

		for (var zoom = maxZoom-1; zoom >= minZoom; zoom--) {
			markers.forEach(function (marker) {
				var p = marker.levelPosition[zoom+1];
				marker.levelPosition[zoom] = {
					x0:p.x0/2,
					y0:p.y0/2,
					x: p.x/2,
					y: p.y/2
				};
			})
		}
	}

	canvasLayer.addTo(map);

	return me;
}





