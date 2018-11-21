'use strict';
const eureka = require('./lib/eureka').eureka;
const APIClient = require('./lib/apiClient');

module.exports = agent => {
  const config = agent.config.apiClient;
  agent.apiClient = new APIClient(Object.assign({}, config, { cluster: agent.cluster }));
  agent.beforeStart(async () => {
    eureka(agent);
    await agent.apiClient.ready();
  });
};
