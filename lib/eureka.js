'use strict';

const assert = require('assert');
const Eureka = require('eureka-js-client').Eureka;
const os = require('os');
const ip = require('./ip');

const clientDesc = config =>
  [ config.host, config.port, ...config.serviceUrls.default ].filter(c => !!c).join(':');

const eurekaUtil = {
  getRootUrlByVipAdress(client, vipAddress) {
    const instances = client.getInstancesByVipAddress(vipAddress);
    client.logger.info(
      `get instances for vipAddress [${vipAddress}]: `,
      instances
    );
    const oneInstance = this.getOneInstanceFromAll(instances);
    return this.getServerPath(oneInstance);
  },

  /**
   * 获取某个可用服务,随机取
   * @param {*} instances 所有实例
   * @return {*} json
   */
  getOneInstanceFromAll(instances) {
    if (instances != null) {
      const upInstances = [];
      for (const i of instances) {
        if (i.status.toUpperCase() === 'UP') {
          upInstances.push(i);
        }
      }
      if (upInstances.length > 0) {
        const instanceIndex =
          upInstances.length === 1 ? 0 : Date.now() % upInstances.length;
        return upInstances[instanceIndex];
      }
      return '';

    }
    return '';

  },

  /** Thanks to  coordinator-node-client */
  /**
   * 根据实例获取一个完整的ip方式的服务地址。
   * @param {*} instance  app的实例。
   * @return {string}  url地址,包括协议，ip和端口。例如:http://192.168.1.100:8080。
   */
  getServerPath(instance) {
    let url = '';
    const http = 'http://';
    const https = 'https://';
    if (instance) {
      if (instance.port && instance.port['@enabled'] === 'true') {
        url = http + instance.ipAddr + ':' + instance.port.$;
      } else if (
        instance.securePort &&
        instance.securePort['@enabled'] === 'true'
      ) {
        url = https + instance.ipAddr + ':' + instance.securePort.$;
      }
    }
    return url;
  },
};

function init(agent) {
  agent.eurekaLogger = agent.getLogger('eureka') || agent.logger;
  agent.messenger.on('egg-ready', info => {
    agent.eurekaLogger.info('egg-ready', info);

    agent.addSingleton('eureka', (config, app) => {
      const connection = config.eureka;
      const instance = config.instance;
      assert(
        connection.serviceUrls || (connection.host && connection.port),
        '[egg-eureka] serviceUrls or host&port needed'
      );

      const done = app.readyCallback('eureka');
      transConfig(instance, info);
      app.eurekaLogger.info('[egg-eureka] regist with instance %j', instance);
      const client = new Eureka({
        logger: app.eurekaLogger,
        ...config
      });
      client.start(error => {
        error
          ? app.eurekaLogger.error(error)
          : app.eurekaLogger.info(
            `[egg-eureka] server ${clientDesc(connection)} status OK.`
          );
        renewEurekaInstances();
        done(error, client);
      });
      return client;
    });

    agent.eureka.on('registryUpdated', () => {
      renewEurekaInstances();
    });

  });

  // 获取需要订阅的微服务实例信息
  function renewEurekaInstances() {
    const subMap = agent.config.apiClient.subMap;
    for (const key in subMap) {
      const vipAddress = subMap[key].dataId;
      agent.logger.info('getInstancesByVipAddress: %s', vipAddress);
      const instances = agent.eureka.getInstancesByVipAddress(vipAddress);
      agent.apiClient.publish({
        dataId: subMap[key].dataId,
        publishData: instances,
      });
    }
  }
}

// 获取实时配置替换配置信息
function transConfig(conf, appInfo) {
  assert(
    conf.instanceId && conf.hostName && conf.ipAddr && conf.statusPageUrl,
    '[egg-eureka] should have instance conf info.'
  );
  const hostname = os.hostname();
  const ipAddr = ip.getIPAdress();
  const { port = 7001 } = appInfo;
  for (const key in conf) {
    if (conf.hasOwnProperty(key) && typeof conf[key] === 'string') {
      conf[key] = conf[key].replace(/__HOST__/g, hostname);
      conf[key] = conf[key].replace(/__PORT__/g, port);
      conf[key] = conf[key].replace(/__IPADDR__/g, ipAddr);
    }
  }
  conf.port.$ = port;
  return conf;
}

module.exports = {
  eureka: app => {
    init(app);
  },
  eurekaUtil,
};
