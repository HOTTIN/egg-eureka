'use strict';

const APIClientBase = require('cluster-client').APIClientBase;
const RegistryClient = require('./registry_client');

class APIClient extends APIClientBase {
  constructor(options) {
    super(options);

    this._cache = {};

    // subMap:
    // {
    //   foo: reg1,
    //   bar: reg2,
    // }
    const subMap = options.subMap;

    for (const key in subMap) {
      this.subscribe(subMap[key], value => {
        this._cache[key] = value;
      });
    }
  }
  // 返回原始的客户端类
  get DataClient() {
    return RegistryClient;
  }

  // 用于设置 cluster-client 相关参数，等同于 cluster 方法的第二个参数
  get clusterOptions() {
    return {
      responseTimeout: 120 * 1000,
    };
  }

  subscribe(reg, listener) {
    this._client.subscribe(reg, listener);
  }

  publish(reg) {
    this._client.publish(reg);
  }

  get(key) {
    return this._cache[key];
  }
}

module.exports = APIClient;
