
$(function () {
	var map = L.map('map');
	map.fitWorld();
	map.setZoom(map.getZoom()+1);

	// add an OpenStreetMap tile layer
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	}).addTo(map);

	var canvasLayer = new CanvasLayer(map);
})