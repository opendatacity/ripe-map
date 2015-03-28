var fs = require('fs');
var util = require('util');
var async = require('async');
var request = require('request');

var n = 14000;
var nPerPage = 100;

var probes = [];

var pages = [];

for (var i = 0; i < n/nPerPage; i++) pages.push(i);

async.eachLimit(pages, 4, function (i, callback) {
	console.log('Downloading '+i*nPerPage+'/'+n);

	request(
		{
			url: 'https://atlas.ripe.net/api/v1/probe/?limit='+nPerPage+'&offset='+i*nPerPage,
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}
		}, function (error, response, body) {
			body = JSON.parse(body);
			body.objects.forEach(function (probe) {
				probes.push(probe);
			})
			callback();
		}
	)
}, function () {
	var keys = [
		'address_v4',
		'address_v6',
		'asn_v4',
		'asn_v6',
		'country_code',
		'id',
		'is_anchor',
		'is_public',
		'latitude',
		'longitude',
		'prefix_v4',
		'prefix_v6',
		'status',
		'status_name',
		'status_since',
		'tags'
	];
	
	var data = {};

	keys.forEach(function (key) {
		data[key] = probes.map(function (probe) { return probe[key] })
	})

	data = JSON.stringify(data);
	fs.writeFileSync('../web/data/probes.json', data, 'utf8');
})


