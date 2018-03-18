import {
    isShallowEqual,
    memoize as memoizeDefault,
    throwIfNotObjectReturned,
    riotTagUpdate as updateWithStateToOptsAndMethodsToTagInstance,
    throwIfAlreadyInitialized,
} from './utils.js';

import applyMdtm from './applyMapDispatchToMethods.js';

export default function riotReduxConnect(riot, store, globalOptions = {}) {
    const {
        mixinName = 'reduxConnect',
        defaultOnStateChange = updateWithStateToOptsAndMethodsToTagInstance,
        defaultImplicitDispatchOptName = 'dispatch',
        memoizeByFirstArgReference: memoize = memoizeDefault,
    } = globalOptions;

    const applyMdtmMemoized = memoize(applyMdtm);

    riot.mixin({
        [mixinName](
            mapStateToOpts,
            mapDispatchToMethods = null,
            options = {},
        ) {
            throwIfAlreadyInitialized(this);

            const {
                onStateChange = defaultOnStateChange,
                implicitDispatchOptName = defaultImplicitDispatchOptName,
            } = options;

            let prevStateOpts = {};
            let prevDispatchMethods = {};

            const updateTag = () => {
                const state = store.getState();

                const stateOpts = mapStateToOpts(state, this);
                throwIfNotObjectReturned('mapStateToOpts', stateOpts);

                let dispatchMethods = {};
                if (mapDispatchToMethods === null) {
                    stateOpts[implicitDispatchOptName] = store.dispatch;
                } else {
                    dispatchMethods = applyMdtmMemoized(
                        mapDispatchToMethods,
                        store.dispatch,
                        this
                    );
                }

                const isSameStateOpts = isShallowEqual(
                    stateOpts,
                    prevStateOpts
                );
                const isSameDispatchMethods = (
                    dispatchMethods === prevDispatchMethods
                );
                if (isSameStateOpts && isSameDispatchMethods) return;

                onStateChange.call(this, stateOpts, dispatchMethods);

                prevStateOpts = stateOpts;
                prevDispatchMethods = dispatchMethods;
            };

            this.mixin({
                init() {
                    updateTag();
                    const unsubscribe = store.subscribe(updateTag);
                    this.on('before-unmount', unsubscribe);
                },
            });
        },
    });
}
