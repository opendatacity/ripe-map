function CanvasLayer (map) {
	var me = {};

	var minZoom = 4;
	var maxZoom = 22;

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
		var roundBy = 1000;

		markers.forEach(function (marker) {
			marker.latitude  = Math.round(marker.latitude*roundBy);
			marker.longitude = Math.round(marker.longitude*roundBy);
		})

		var dups = markers;

		var f = 1;
		while (dups.length > 0) {
			
			f /= 2; dups = splitDups(dups, f, 0.5, [[-1,-1],[1,1],[1,-1],[-1,1]]);
			//f /= 2; dups = splitDups(dups, f, 0.56, [[0,1],[0.866,-0.5],[-0.866,-0.5]]);
			//f /= 3; dups = splitDups(dups, f, 1, [[-1,-1],[1,1],[-1,1],[1,-1],[0,-1],[0,1],[1,0],[-1,0]]);
		}

		markers.forEach(function (marker) {
			marker.latitude  /= roundBy;
			marker.longitude /= roundBy;
		})


		markers.forEach(function (marker) {
			marker.levelPosition = [];
			var p = map.project([marker.latitude, marker.longitude], maxZoom);
			marker.levelPosition[maxZoom] = { x0:p.x, y0:p.y, x:p.x, y:p.y, r:radius }
		})

		for (var zoom = maxZoom-1; zoom >= 0; zoom--) {
			markers.forEach(function (marker) {
				var p = marker.levelPosition[zoom+1];
				marker.levelPosition[zoom] = {
					x0:p.x0/2,
					y0:p.y0/2,
					x: p.x/2,
					y: p.y/2,
					r: (zoom < minZoom) ? p.r/2 : radius
				};
			})
		}

		function splitDups(list, spread, scale, frac) {
			spread *= scale;

			var lookup = {};

			list.forEach(function (entry) {
				var key = [entry.latitude, entry.longitude];
				if (!lookup[key]) lookup[key] = [];
				lookup[key].push(entry);
			})

			var dups = [];

			Object.keys(lookup).forEach(function (key) {
				var entries = lookup[key];
				if (entries.length > 1) {
					var f = Math.cos(entries[0].latitude*Math.PI/(180*roundBy));
					entries.forEach(function (entry, index) {
						var dir = frac[index % frac.length];
						entry.longitude += dir[0]*spread;
						entry.latitude  += dir[1]*spread*f;
						dups.push(entry);
					})
				}
			})
			return dups;
		}
	}

	canvasLayer.addTo(map);

	map.on('click', function (e) {
		if (!handlers.click) return;
		var zoom = map.getZoom();
		var mousePoint = map.project(e.latlng, zoom);
		var bestMarker = false;
		var bestDistance = 1e100;
		markers.forEach(function (marker) {
			var point = marker.levelPosition[zoom];
			var d = Math.sqrt(sqr(mousePoint.x - point.x) + sqr(mousePoint.y - point.y));
			if ((d <= (point.r+1)) && (d < bestDistance)) {
				bestDistance = d;
				bestMarker = marker;
			}
		})
		if (bestMarker) {
			handlers.click.forEach(function (handler) {
				handler(bestMarker);
			})
		}
	})

	var handlers = {};

	me.on = function (name, f) {
		if (!handlers[name]) handlers[name] = [];
		handlers[name].push(f);
	}

	return me;

	function sqr(x) {
		return x*x;
	}
}





