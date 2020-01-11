const fs = require('fs')
const util = require('util')
const zlib = require('zlib')
const MitmProxy = require('@pureproxy/mitmproxy')
const Interceptor = require('@pureproxy/utils/lib/interceptor')
const { HTTPParser, methods } = require('@pureproxy/pureproxy/lib/parser')

const kOnHeadersComplete = HTTPParser.kOnHeadersComplete | 0
const kOnBody = HTTPParser.kOnBody | 0
const kOnMessageComplete = HTTPParser.kOnMessageComplete | 0

const writeFileAsync = util.promisify(fs.writeFile.bind(fs))
const gunzipAsync = util.promisify(zlib.gunzip.bind(zlib))
const deflateAsync = util.promisify(zlib.deflate.bind(zlib))
const brotliDecompressAsync = util.promisify(zlib.brotliDecompress.bind(zlib))

class HttpTrace extends MitmProxy {
    makeWriter() {
        return {
            parts: [],

            write: function(data) {
                this.parts.push(Buffer.from(data))
            },

            join: function() {
                return Buffer.concat(this.parts)
            }
        }
    }

    saveToFile(filename, data) {
        writeFileAsync(filename, data)
    }

    async serializeRequest(request) {
        console.log(Date.now(), 0, request.id, request.subject.hostname, request.subject.port, methods[request.method], request.uri, request.versionMajor, request.versionMinor)

        const w = this.makeWriter()

        this.writeRequestLine(w, methods[request.method], request.uri, request.versionMajor, request.versionMinor)
        this.writeHeaders(w, request.headers)

        const bodyChunks = []

        request.bodyChunks.forEach((chunk) => bodyChunks.push(chunk))

        let body = Buffer.concat(bodyChunks)

        const contentEncoding = this.getHttpHeader(request.headers, 'content-encoding')

        if (contentEncoding === 'gzip') {
            body = await gunzipAsync(body)
        }
        else
        if (contentEncoding === 'deflate') {
            body = await deflateAsync(body)
        }
        else
        if (contentEncoding === 'br') {
            body = await brotliDecompressAsync(body)
        }

        w.write(body)

        this.saveToFile(`${request.id}.http.request`, w.join(), request.subject)
    }

    async serializeResponse(response) {
        console.log(Date.now(), 1, response.id, response.subject.hostname, response.subject.port, response.versionMajor, response.versionMinor, response.statusCode, response.statusMessage)

        const w = this.makeWriter()

        this.writeResponseLine(w, response.versionMajor, response.versionMinor, response.statusCode, response.statusMessage)
        this.writeHeaders(w, response.headers)

        const bodyChunks = []

        response.bodyChunks.forEach((chunk) => bodyChunks.push(chunk))

        let body = Buffer.concat(bodyChunks)

        const contentEncoding = this.getHttpHeader(response.headers, 'content-encoding')

        if (contentEncoding === 'gzip') {
            body = await gunzipAsync(body)
        }
        else
        if (contentEncoding === 'deflate') {
            body = await deflateAsync(body)
        }
        else
        if (contentEncoding === 'br') {
            body = await brotliDecompressAsync(body)
        }

        w.write(body)

        this.saveToFile(`${response.id}.http.response`, w.join(), response.subject)
    }

    makeRequestParser(id, subject) {
        const self = this

        const requestParser = new HTTPParser(HTTPParser.REQUEST)

        requestParser[kOnHeadersComplete] = function(info) {
            let { versionMajor, versionMinor, headers, method, url: uri, statusCode, statusMessage, upgrade, shouldKeepAlive } = info

            this.info = {
                id: id,
                subject: subject,

                versionMajor,
                versionMinor,
                headers,
                method,
                uri,

                bodyChunks: []
            }
        }

        requestParser[kOnBody] = function(buffer, start, len) {
            buffer = buffer.slice(start, start + len)

            this.info.bodyChunks.push(buffer)
        }

        requestParser[kOnMessageComplete] = function() {
            self.serializeRequest(this.info)

            delete this.info
        }

        return requestParser
    }

    makeResponseParser(id, subject) {
        const self = this

        const responseParser = new HTTPParser(HTTPParser.RESPONSE)

        responseParser[kOnHeadersComplete] = function(info) {
            let { versionMajor, versionMinor, headers, method, url: uri, statusCode, statusMessage, upgrade, shouldKeepAlive } = info

            this.info = {
                id: id,
                subject: subject,

                versionMajor,
                versionMinor,
                headers,
                statusCode,
                statusMessage,

                bodyChunks: []
            }
        }

        responseParser[kOnBody] = function(buffer, start, len) {
            buffer = buffer.slice(start, start + len)

            this.info.bodyChunks.push(buffer)
        }

        responseParser[kOnMessageComplete] = function() {
            self.serializeResponse(this.info)

            delete this.info
        }

        return responseParser
    }

    wrapClientForObservableStreaming(client, subject) {
        const id = Date.now()

        const requestParser = this.makeRequestParser(id, subject)
        const responseParser = this.makeResponseParser(id, subject)

        return new class extends Interceptor {
            constructor() {
                super(client)

                this.writeFore = this._writeFore
                this.writeBack = this._writeBack

                this.writeFore = this._sniffIt
            }

            _sniffIt(data) {
                this.writeFore = this._writeFore

                this.writeFore(data)
            }

            _writeFore(data) {
                requestParser.execute(data)

                super.writeFore(data)
            }

            _writeBack(data) {
                responseParser.execute(data)

                super.writeBack(data)
            }
        }
    }

    shouldIntercept() {
        return true
    }
}

module.exports = HttpTrace
