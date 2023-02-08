import { isList } from '@aldinh777/reactive-utils/validator';
import { ListViewMapped, StateCollection, OperationHandler } from '@aldinh777/reactive/collection';
import { Subscription } from '@aldinh777/reactive/helper/subscription-helper';
import { mount } from '..';
import { Properties } from '../../common/types';
import { readAlias, propAlias } from '../../core/prop-util';
import { render } from '../../core/render';
import { Component, RenderedResult } from '../../core/types';
import ComponentError from '../../error/ComponentError';
import { MounterData, createMounter } from '../component-helper';
import { remove } from '../dom-util';

function removeSubmounter(mounter: MounterData, submounter: MounterData) {
    const { start, end } = submounter.marker;
    const parent = mounter.marker.end?.parentNode;
    submounter.dismount();
    remove(parent, [start, end]);
}

function appendSubmounter(
    mounter: MounterData,
    submounter: MounterData,
    before: MounterData = mounter
) {
    const { start, end } = before.marker;
    const insertBefore = mounter === before ? end : start;
    const parent = insertBefore.parentNode;
    mount(parent, submounter.rendered, insertBefore);
}

export default function LoopCollect(
    props: Properties<any> = {},
    component: Component = {}
): RenderedResult[] | void {
    if (typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const list = params[props.list];
    const alias = props.as;
    const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isList<any>(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid StateCollection in 'collect:list' property of 'foreach' element`
        );
    }
    const submounters = new ListViewMapped(list, (item) => {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        const renderer = render(children, localParams, _super);
        const submounter = createMounter(
            'lci',
            {},
            {
                onMount() {
                    submounter.mount(renderer);
                }
            }
        );
        return submounter;
    });
    let updateSubscription: Subscription<
        StateCollection<number, MounterData, MounterData[]>,
        OperationHandler<number, MounterData>
    >;
    let insertSubscription: Subscription<
        StateCollection<number, MounterData, MounterData[]>,
        OperationHandler<number, MounterData>
    >;
    let deleteSubscription: Subscription<
        StateCollection<number, MounterData, MounterData[]>,
        OperationHandler<number, MounterData>
    >;
    const mounter = createMounter('lc', component, {
        preventDismount: () => true,
        onMount() {
            for (const submounter of submounters.raw) {
                mounter.mount(submounter.rendered);
            }
            updateSubscription = submounters.onUpdate((index, next, previous: MounterData) => {
                removeSubmounter(mounter, previous);
                appendSubmounter(mounter, next, submounters.get(index + 1));
            });
            insertSubscription = submounters.onInsert((index, inserted) => {
                appendSubmounter(mounter, inserted, submounters.get(index + 1));
            });
            deleteSubscription = submounters.onDelete((_, deleted) => {
                removeSubmounter(mounter, deleted);
            });
        },
        onDismount() {
            for (const submounter of submounters.raw) {
                submounter.dismount();
            }
            updateSubscription?.unsub?.();
            insertSubscription?.unsub?.();
            deleteSubscription?.unsub?.();
        }
    });
    return mounter.rendered;
}
