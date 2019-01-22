#!/usr/bin/env node
require('dotenv').config()
const figlet = require('figlet');
const axios = require('axios')
const bitpipe = require('bitpipe')
const chalk = require('chalk')
const moment = require('moment')
const readline = require('readline');
const EventSource = require('eventsource')
const notifier = require('node-notifier');
var bitsocket
const query = {
  "v": 3,
  "q": {
    "find": {
      "out.b0": { "op": 106 },
      "out.b1": { "op": 0 }
    },
    "limit": 200
  },
  "r": {
    "f": "[.[] | { m: .out[0].s2, t: .timestamp, h: .tx.h }]"
  }
}
const sock = {
  "v": 3,
  "q": {
    "find": {
      "out.b0": { "op": 106 },
      "out.b1": { "op": 0 }
    }
  },
  "r": {
    "f": "[.[] | { m: .out[0].s2, t: .timestamp, h: .tx.h }]"
  }
}

const header = `
Realtime Chat on the Bitcoin Blockchain.

1. Your messages are stored on Bitcoin forever as an OP_RETURN transaction
2. View each transaction on a block explorer by clicking the timestamp.

Brought to you by Bitdb.network & Bitsocket.org.
Powered by Bitcoin SV.\n\n`

const listen = function() {
  var b64 = Buffer.from(JSON.stringify(sock)).toString("base64")
  bitsocket = new EventSource('https://chronos.bitdb.network/s/1P6o45vqLdo6X8HRCZk8XuDsniURmXqiXo/'+b64)
  bitsocket.onmessage = function(e) {
    let o = JSON.parse(e.data)
    if (o.type === 't') {
      render(o.data)
      notifier.notify({
        message: o.data[0].m
      });
    }
  }
}
const load = function() {
  let s = JSON.stringify(query);
  let b64 = Buffer.from(s).toString('base64');
  return axios.get('https://chronos.bitdb.network/q/1P6o45vqLdo6X8HRCZk8XuDsniURmXqiXo/' + b64, {
    headers: { key: "13cJQeQ7WTQMCUbPLi2juqCrZpqdpMJm5Y" }
  })
}
const render = function(content) {
  return new Promise(function(resolve, reject) {
    content.forEach(function(line) {
      let t = moment(line.t).format('M D, hh:mm:ss a');
      console.log(chalk.black(chalk.bgGreen(t)), chalk.green(line.m))
    })
    resolve()
  })
}
const send = function(line) {
  axios.post("http://localhost:8082/bitpipe", {
    data: ["", line]
  }).then(function(res) {
  }).catch(function(e) {
    console.log("Error", e)
  })
}
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  //terminal: false
});
rl.on('line', (input) => {
  send(input)
  process.stdout.moveCursor(0,-1);
  process.stdout.clearLine();
});
bitpipe.start({
  port: 8082,
  lambda: function(req, payload, pipe) {
    payload.data[1] = process.env.USERNAME + ": " + payload.data[1]
    pipe(null, payload)
  },
  onconnect: function() {
    figlet("  Bitchat", '3D-ASCII', function(err, text) {
      if (err) {
        console.log('something went wrong...');
        console.dir(err);
      } else {
        load().then(function(content) {
          render(content.data.t.reverse())
        }).then(function() {
          console.log("\n\n")
          console.log(chalk.green(text))
          console.log(chalk.green(header))
        }).then(listen)
      }
    })
  }
})
