'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1542790500430_1585';

  // add your config here
  config.middleware = [];

  // 订阅配置
  config.apiClient = {
    subMap: {
      foo: {
        // dataId填写需要订阅的微服务vipaddress
        dataId: 'bar',
      },
    },
  };

  // eureka配置
  config.eureka = {
    client: {
      instance: {
        instanceId: '__HOST__:node-rest:__PORT__',
        app: 'node-rest',
        hostName: '__IPADDR__',
        ipAddr: '__IPADDR__',
        // preferIpAddress: true, // default is false and host will be used.
        // homePageUrl: 'http://localhost:4001/info',
        statusPageUrl: 'http://__IPADDR__:__PORT__/',
        // healthCheckUrl: 'http://localhost:4001/info',
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
      requestMiddleware: (requestOpts, done) => {
        requestOpts.auth = {
          user: 'XXXX',
          password: 'XXXX',
        };
        done(requestOpts);
      },
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

  return config;
};
