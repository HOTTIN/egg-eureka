'use strict';

/**
 * egg-eureka-plugin default config
 * @member Config#eureka
 * @property {String} SOME_KEY - some description
 */
exports.circuitBreaker = {
  timeout: 30000, // If our function takes longer than 30 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
  resetTimeout: 30000, // After 30 seconds, try again.
};

// exports.apiClient = {
//   subMap: {
//     foo: {
//       dataId: 'bar',
//     },
//   },
// };

exports.eureka = {
  client: {
    // requestMiddleware: (requestOpts, done) => {
    //   requestOpts.auth = {
    //     user: 'admin',
    //     password: '123456',
    //   };
    //   done(requestOpts);
    // },
  },
};
