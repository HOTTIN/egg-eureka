'use strict';

/**
 * egg-eureka-plugin default config
 * @member Config#eureka
 * @property {String} SOME_KEY - some description
 */
exports.eureka = {
  client: {
    instance: {
      instanceId: '__HOST__:node-rest:__PORT__',
      app: 'node-rest',
      hostName: '__IPADDR__',
      ipAddr: '__IPADDR__',
      // preferIpAddress: true, // default is false and host will be used.
      // homePageUrl: 'http://localhost:4001/info',
      statusPageUrl: 'http://__IPADDR__:__PORT__/info',
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
