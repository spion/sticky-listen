var IPHasher = require('../lib/ip-hash')
var parse = require('../lib/header-parser')

function testHasher() {
    var h = new IPHasher();
    var ip = '123.123.123.123';
    var ipBuf = Buffer(ip);
    console.log(h.hashString(ip), h.hashBytes(ipBuf, 0, ipBuf.length))

    console.time('str x 1M');
    for (var k = 0; k < 1000000; ++k) h.hashString(ip)
    console.timeEnd('str x 1M');
    console.time('byte x 1M')
    for (var k = 0; k < 1000000; ++k) h.hashBytes(ipBuf, 0, ipBuf.length)
    console.timeEnd('byte x 1M');
}

function noop(){}

function testHeader() {
    var data = require('fs').readFileSync('header.txt');

    for (var k = 0; k < 1000000; ++k) parse(data);
    console.time('real-header x 1M');
    for (var k = 0; k < 1000000; ++k) parse(data);
    console.timeEnd('real-header x 1M');
    var pos = parse(data);
    if (pos == null) {
        console.log("No header");
    }
    else {
        console.log(data.slice(pos.start+1, pos.end).toString('utf8'))
    }
}

console.log("Hashing tests")

testHasher()

console.log("Parsing tests")

testHeader();

