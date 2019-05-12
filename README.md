[![Follow on Twitter](https://img.shields.io/twitter/follow/pdp.svg?logo=twitter)](https://twitter.com/pdp)
[![NPM](https://img.shields.io/npm/v/@pureproxy/httptrace.svg)](https://www.npmjs.com/package/@pureproxy/httptrace)

# HttpTrace

HttpTrace is a s simple tracing HTTP proxy. It is mean to be used as a demo of [mitmproxy](https://github.com/pureproxy/pureproxy) but it is an actual tool.

## How To Install

You need to install this library as a dependency like this:

```
$ npm install @pureproxy/httptrace
```

Install the httptrace binary like this:

```
$ npm install -g @pureproxy/httptrace
```

## How To Use

Simply invoke the tool from the command line:

```
$ httptrace
```

To define the default listening port, provide a `PORT` environment variable:

```
$ PORT=8888 httptrace
```

Set the proxy settings to `localhost:8888` or `localhost:8080` in default configuration. This is how you can do it for command line tools such as curl:

```
export http_proxy=http://localhost:8080
export https_proxy=http://localhost:8080
```

All requests and responses that pass through the proxy will be serialised to files in the current work directory.
