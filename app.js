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
  });

  class rqService extends app.Service {
    async breakerRequest(url, opts, fallback) {
      if (arguments.length === 2 && typeof opts === 'function') {
        [ opts, fallback ] = [ fallback, opts ];
      }
      opts = Object.assign({
        timeout: [ '30s', '30s' ],
        dataType: 'json',
      }, opts);

      const { ctx } = this;
      const breaker = circuitBreaker(async function() {
        return await ctx.curl(url, opts);
      }, breakerConf);
      const defaultFallback = err => {
        ctx.logger.error(`[circuitBreaker]-fallback: ${url} got error`, err);
        return {
          code: '502',
          message: '服务无法访问',
          data: '',
        };
      }
      breaker.fallback(fallback || defaultFallback);

      this.logger.info('request external service: %s with params', url, opts && opts.data);
      const t1 = Date.now();
      return await breaker.fire()
        .then(r => {
          const cost = Date.now() - t1;
          this.logger.debug('[%sms]response from [%s]: %j', cost, url, r);
          return r && r.data;
        });
    }
  }

  app.Service = rqService;
};
