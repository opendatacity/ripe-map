# ripe-map
Visualizing RIP Atlas Probes and there activitiy, using leaflet and...

##Branch - master
Using streaming api for live tracking on map. Current probe dump is used for pseudo dashboard with pi charts.

##Branch - historical
Using streaming api with historical data (experimental state).
Probes are not on the map, just there events show the geolocation. Pi Chart also not visible.
### TODO
* user input for historical data
* Adding streamgraph for online/offline activities off probes 


## Dev Stuff
#### Probe Status
 * 0 - not active (recently bought)
 * 1 - connected
 * 2 - disconnected
 * 3 - abadonned 