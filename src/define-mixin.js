import { getInstanceConfigFactory } from './handle-configs.js';
import { getUpdateTagFunction, shouldMapStateToOpts } from './get-updater.js';
import { throwIfAlreadyInitialized } from './utils.js';

export function riotReduxConnect(riot, store, globalOptions = {}) {
  const getInstanceConfig = getInstanceConfigFactory(globalOptions);
  const { mixinName = 'reduxConnect' } = globalOptions;
  riot.mixin({
    [mixinName](mapStateToOpts, mapDispatchToMethods = null, localOptions = {}) {
      throwIfAlreadyInitialized(this, { mixinName });

      const additionalOptions = {
        store, mapStateToOpts, mapDispatchToMethods, tagInstance: this,
      };
      const instanceConfig = getInstanceConfig(localOptions, additionalOptions);
      const updateTag = getUpdateTagFunction(instanceConfig);

      this.mixin({
        init() {
          updateTag();
          if (shouldMapStateToOpts(mapStateToOpts)) {
            const unsubscribe = store.subscribe(updateTag);
            this.on('before-unmount', unsubscribe);
          }
          onReduxSyncEvent(instanceConfig, updateTag);
        },
      });
    },
  });
}

function onReduxSyncEvent(instanceConfig, handler) {
  const { reduxSyncEventName, tagInstance } = instanceConfig;
  tagInstance.on(reduxSyncEventName, handler);
}
