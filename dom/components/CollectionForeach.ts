import { isList } from '@aldinh777/reactive-utils/validator';
import {
    ListViewMapped,
    StateCollection,
    OperationHandler,
    StateList
} from '@aldinh777/reactive/collection';
import { Subscription } from '@aldinh777/reactive/helper/subscription-helper';
import { mount } from '..';
import { Properties } from '../../common/types';
import { readAlias, propAlias } from '../../common/prop-util';
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

export default async function CollectionForeach(
    props: Properties = {},
    component: Component = {}
): Promise<RenderedResult[] | void> {
    if (typeof props.list !== 'string') {
        return;
    }
    const { children, params, _super } = component;
    const list = params[props.list];
    const alias = props.as as string;
    const extracts = typeof props.extract === 'string' ? readAlias(props.extract) : [];
    if (!isList(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid StateCollection in 'collect:list' property of 'foreach' element`
        );
    }
    const submounters = new ListViewMapped(list, async (item) => {
        const localParams = typeof item === 'object' ? propAlias(params, extracts, item) : {};
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        const renderer = await render(children, localParams, _super);
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
    let updateSubscription: Subscription<StateList, OperationHandler<number, Promise<MounterData>>>;
    let insertSubscription: Subscription<StateList, OperationHandler<number, Promise<MounterData>>>;
    let deleteSubscription: Subscription<StateList, OperationHandler<number, Promise<MounterData>>>;
    const mounter = createMounter('lc', component, {
        preventDismount: () => true,
        async onMount() {
            for await (const submounter of submounters.raw) {
                mounter.mount(submounter.rendered);
            }
            updateSubscription = submounters.onUpdate(
                async (index, next, previous: Promise<MounterData>) => {
                    removeSubmounter(mounter, await previous);
                    appendSubmounter(mounter, await next, await submounters.get(index + 1));
                }
            );
            insertSubscription = submounters.onInsert(async (index, inserted) => {
                appendSubmounter(mounter, await inserted, await submounters.get(index + 1));
            });
            deleteSubscription = submounters.onDelete(async (_, deleted) => {
                removeSubmounter(mounter, await deleted);
            });
        },
        async onDismount() {
            for await (const submounter of submounters.raw) {
                submounter.dismount();
            }
            updateSubscription?.unsub?.();
            insertSubscription?.unsub?.();
            deleteSubscription?.unsub?.();
        }
    });
    return mounter.rendered;
}
