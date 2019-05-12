const HttpTrace = require('../lib/index')

const server = new HttpTrace()

server.listen(process.env.PORT || 8080)
