'use strict';

const APIClient = require('./lib/apiClient');
const circuitBreaker = require('opossum');

module.exports = app => {
  const config = app.config.apiClient;
  app.apiClient = new APIClient(Object.assign({}, config, { cluster: app.cluster }));
  app.beforeStart(async () => {
    await app.apiClient.ready();
  });

  class rqService extends app.Service {
    async request(url, opts) {
      opts = Object.assign({
        timeout: [ '30s', '30s' ],
        dataType: 'json',
      }, opts);

      const { ctx } = this;
      const breaker = circuitBreaker(async function() {
        return await ctx.curl(url, opts);
      }, {
        timeout: 30000, // If our function takes longer than 30 seconds, trigger a failure
        errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
        resetTimeout: 30000, // After 30 seconds, try again.
      });
      breaker.fallback(err => {
        ctx.logger.error(`[circuitBreaker]-fallback: ${url} got error`, err);
        return {
          code: '502',
          message: '服务无法访问',
          data: '',
        };
      });

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
