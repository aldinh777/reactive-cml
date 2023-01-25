import { ListViewMapped } from '@aldinh777/reactive/collection/view/ListViewMapped';
import { isList } from '@aldinh777/reactive-utils/validator';
import { readAlias, propAlias } from '../../core/prop-util';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { Component, RenderResult } from '../../core/types';
import { render } from '../../core/render';
import { createMounter, MounterData } from '../component-helper';
import { mount, removeAll } from '..';

function removeSubmounter(mounter: MounterData, submounter: MounterData) {
    const { start, end } = submounter.marker;
    const parent = mounter.marker.end?.parentNode;
    submounter.dismount();
    removeAll(parent, [start, end]);
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

export default function (
    props: Properties<any> = {},
    component: Component = {}
): RenderResult[] | void {
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
    const mounter = createMounter('lc', component, {
        preventDismount: () => true,
        onMount() {
            for (const submounter of submounters.raw) {
                mounter.mount(submounter.rendered);
            }
        },
        onDismount() {
            for (const submounter of submounters.raw) {
                submounter.dismount();
            }
        }
    });
    submounters.onUpdate((index, next, previous: MounterData) => {
        if (mounter.isMounted) {
            removeSubmounter(mounter, previous);
            appendSubmounter(mounter, next, submounters.get(index + 1));
        }
    });
    submounters.onInsert((index, inserted) => {
        if (mounter.isMounted) {
            appendSubmounter(mounter, inserted, submounters.get(index + 1));
        }
    });
    submounters.onDelete((_, deleted) => {
        if (mounter.isMounted) {
            removeSubmounter(mounter, deleted);
        }
    });
    return mounter.rendered;
}
