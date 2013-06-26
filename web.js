var request = require('jsdom/node_modules/request');
var express = require('express');
var jsdom = require("jsdom");
var iconv = require('iconv');
var fs = require('fs');

var app = express();
app.use(express.logger());

app.get('/', function(req, res) {
  res.send('Hello World!');
});
app.get('/fatch', function(req, res) {
	fatchPage(req, res);
});
app.get('/json', function(req, res) {
	getJSON(req, res);
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});

//functions
function fatchPage(req, res) {
	request({uri: 'http://www.5tu.cn/colors/yansezhongwenming.html', encoding: 'binary'}, function(error, response, body) {
			var bodyBuffer = new Buffer(body, 'binary');
			var conv = new iconv.Iconv('gb2312', 'utf8');
			var buffer = conv.convert(bodyBuffer);
			body = buffer.toString();
			parseDOM(body, req, res);
	});
}

function parseDOM(body, req, res) {//jsdom can not use gbk
	var jquery = fs.readFileSync(__dirname + '/lib/jquery.js').toString();
	jsdom.env({
		html: body,
		src: [jquery],
		//scripts: ['http://code.jquery.com/jquery.js'],
		done: function (errors, window) {
			var $ = window.$;
			var arr = getData($);
			saveJSON(arr);
			res.send(arr);
		}
	});
}

function getData($) {
	var arr = [];
	$("#color tr:gt(0)").each(function(){
		var obj = {};
		var $tr = $(this);
		var $tds = $tr.children("td");
		obj.en = $tds.eq(1).html();
		obj.zh = $tds.eq(2).html();
		obj.hex = $tds.eq(3).html();
		obj.rgb = $tds.eq(4).html();
		arr.push(obj);
	});
	return arr;
}

var filepath = __dirname + '/json/color.json';

function saveJSON(data) {
	data = JSON.stringify(data || []);
	fs.writeFile(filepath, data, function (err, data) {
		if (err) throw err;
		console.log(filepath + " saved!");
	});
}

function getJSON(req, res) {
	fs.exists(filepath, function (exists) {
		if(!exists) {
			return [];
		}
		fs.readFile(filepath, {encoding: "utf8"}, function (err, data) {
			if (err) throw err;
			res.send(data);
			//res.send(JSON.parse(data));
		});
	});
}
