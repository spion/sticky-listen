'use strict';
var IPHasher = require('../lib/ip-hash');
var parse = require('../lib/header-parser').parse;

function testHasher() {
    var h = new IPHasher();
    var ip = '123.123.123.123';
    console.log(h.hashString(ip));

    console.time('str');
    for (var k = 0; k < 1000000; ++k) h.hashString(ip);
    console.timeEnd('str');
}

function testHeader() {
    var data = require('fs').readFileSync('header.txt');

    console.time('parse');
    for (var k = 0; k < 1000000; ++k) parse(data);
    console.timeEnd('parse');
    var pos = parse(data);
    if (pos == null) {
        console.log('No header');
    }
    else {
        console.log(pos);
    }
}

testHasher();

testHeader();

