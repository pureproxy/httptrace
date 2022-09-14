#!/usr/bin/env node

import cluster from 'cluster'

import HttpTrace from '../lib/index.js'

if (cluster.isMaster) {
  console.log(`* master ${process.pid} started`)

  const cpus = require('os').cpus().length

  for (let i = 0; i < cpus; i++) {
    cluster.fork()
  }
} else {
  console.log(`* worker ${process.pid} started`)

  const server = new HttpTrace()

  server.listen(process.env.PORT || 8080)
}
