'use strict';

const APIClient = require('./lib/apiClient');
const circuitBreaker = require('opossum');
const eurekaUtil = require('./lib/eureka').eurekaUtil;

module.exports = app => {
  const config = app.config.apiClient;
  const breakerConf = app.config.circuitBreaker;
  app.apiClient = new APIClient(Object.assign({}, config, { cluster: app.cluster }));
  app.eurekaUtil = eurekaUtil;
  app.beforeStart(async () => {
    await app.apiClient.ready();

    // 在app上挂载单例circuitBreaker，
    const breakerConfig = app.config.circuitBreaker;
    app.circuitBreaker = circuitBreaker(async (url, opts) => {
      return await app.curl(url, opts);
    }, breakerConfig);
  });

  class rqService extends app.Service {
    async request(url, opts) {
      opts = Object.assign(
        {
          timeout: [ '30s', '30s' ],
          dataType: 'json',
        },
        opts
      );
      app.circuitBreaker.fallback(err => {
        this.logger.error(`[circuitBreaker]-fallback: ${url} got error`, err);
        return {
          code: '502',
          message: '服务无法访问',
          data: '',
        };
      });

      this.logger.info(
        '[circuitBreaker]-request external service: %s with params',
        url,
        opts && opts.data
      );
      const t1 = Date.now();
      const result = await app.circuitBreaker.fire(url, opts).then(r => {
        const cost = Date.now() - t1;
        this.logger.info('[circuitBreaker]-[%sms]response from [%s]: %j', cost, url, r);
        return r && r.data;
      });
      return result;
    }
  }

  app.Service = rqService;
};
