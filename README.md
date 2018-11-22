# egg-eureka-plugin

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-eureka-plugin.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-eureka-plugin
[travis-image]: https://img.shields.io/travis/eggjs/egg-eureka-plugin.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-eureka-plugin
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-eureka-plugin.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-eureka-plugin?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-eureka-plugin.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-eureka-plugin
[snyk-image]: https://snyk.io/test/npm/egg-eureka-plugin/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-eureka-plugin
[download-image]: https://img.shields.io/npm/dm/egg-eureka-plugin.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-eureka-plugin

<!--
Description here.
-->

## Install

```bash
$ npm i egg-eureka-plugin --save
```

## Usage

```js
// {app_root}/config/plugin.js
exports.eureka = {
  enable: true,
  package: 'egg-eureka-plugin',
};
```

## Configuration

```js
// {app_root}/config/config.default.js
// 熔断配置
exports.circuitBreaker = {
  timeout: 30000, // If our function takes longer than 30 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
  resetTimeout: 30000, // After 30 seconds, try again.
};

// 多进程增强模式apiclient配置
exports.apiClient = {
  // 通过egg apiclient 完成对微服务信息的订阅功能
  subMap: {
    // 自定义foo，作为在service中获取订阅信息的key值
    foo: {
      // bar 是你需要订阅的微服务的vipAddress，一般和app name相同
      // 填写后agent会在registryUpdated事件触发时更新微服务实例信息，并发布给各个follwer
      dataId: 'bar',
    },
  },
};

// eureka配置
exports.eureka = {
  client: {
    // instance信息不是必须的，如果你清楚知道自己将要部署的服务信息，可以自行填写，
    // 如果是部署在docker中，需要自行填写，
    // 否则，应用会读取服务器信息以及egg应用的启动信息自动填写配置
    instance: {
      instanceId: '127.0.0.1:node-rest:7001',
      app: 'node-rest',
      hostName: '127.0.0.1',
      ipAddr: '127.0.0.1',
      // preferIpAddress: true, // default is false and host will be used.
      // homePageUrl: 'http://127.0.0.1:7001/info',
      statusPageUrl: 'http://127.0.0.1:7001/info',
      // healthCheckUrl: 'http://127.0.0.1:7001/info',
      port: {
        $: 7001,
        '@enabled': 'true',
      },
      // Important, otherwise spring-apigateway cannot find instance of node-rest
      vipAddress: 'node-rest',
      // secureVipAddress: 'node-rest',
      dataCenterInfo: {
        '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
        name: 'MyOwn',
      },
    },
    // requestMiddleware: (requestOpts, done) => {
    //   requestOpts.auth = {
    //     user: 'admin',
    //     password: '123456',
    //   };
    //   done(requestOpts);
    // },
    eureka: {
      fetchRegistry: true,
      // host: '127.0.0.1',
      // port: 3000,
      // servicePath: '/eureka/apps/',
      serviceUrls: {
        default: [
          'http://127.0.0.1:3000/eureka/apps/',
          'http://127.0.0.2:3000/eureka/apps/',
        ],
      },
      ssl: false,
      useDns: false,
      fetchMetadata: false,
      preferIpAddress: true,
      // maxRetries: 0,
    },
  },
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## Example

插件在app上封装了breakerRequest方法，通过opossum封装了内置ctx.curl
使用时需要从app.Service继承

```js
'use strict';

// const Service = require('egg').Service;

module.exports = app => {
  class accountService extends app.Service {
    constructor(ctx) {
      super(ctx);
      this.appId = 'foo';
    }
    _getServerUrl() {
      const eurekaUtil = this.ctx.app.eurekaUtil;
      const kernelInstances = this.ctx.app.apiClient.get(this.appId);
      if (!Array.isArray(kernelInstances) || kernelInstances.length === 0) {
        // this.ctx.logger.error('get 0 kernelInstances!!');
        this.ctx.throw('get 0 kernelInstances!!');
      }
      const ins = eurekaUtil.getOneInstanceFromAll(kernelInstances);
      const serverUrl = eurekaUtil.getServerPath(ins);

      return serverUrl;
    }

    async account(userId, accountType) {
      const url = `${this._getServerUrl()}/account/${userId}`;
      return await this.breakerRequest(url);
    }
  }
  return accountService;
};


## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
