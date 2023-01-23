import { ListViewMapped } from '@aldinh777/reactive/collection/view/ListViewMapped';
import { isList } from '@aldinh777/reactive-utils/validator';
import { readAlias, propAlias } from '../../core/prop-util';
import ComponentError from '../../error/ComponentError';
import { Properties } from '../../common/types';
import { Component, RenderResult } from '../../core/types';
import { render } from '../../core/render';

interface MirrorElement {
    items: RenderResult[];
    start: Text;
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
    if (!isList(list)) {
        throw new ComponentError(
            `'${props.list}' are not a valid StateCollection in 'collect:list' property of 'foreach' element`
        );
    }
    let isMounted = false;
    component.onMount = () => (isMounted = true);
    component.onDismount = () => (isMounted = false);
    const marker = _text('');
    const listMirror: ListViewMapped<any, MirrorElement> = new ListViewMapped(list, (item) => {
        const localParams = propAlias(params, extracts, item);
        if (alias) {
            Object.assign(localParams, { [alias]: item });
        }
        return {
            items: render(children, localParams, _super),
            start: _text('')
        };
    });
    const mappedElement: ListViewMapped<MirrorElement, RenderResult> = new ListViewMapped(
        listMirror,
        (mirror) => ({ items: mirror ? [mirror.start, ...mirror.items] : [] })
    );
    const result: RenderResult = { items: mappedElement.raw, component };
    listMirror.onUpdate((_, next, prev: MirrorElement) => {
        const { parentNode } = prev.start;
        if (parentNode) {
            if (isMounted) {
                mount(parentNode, [next.start, ...next.items], prev.start);
                dismount(parentNode, [prev.start, ...prev.items]);
            } else {
                append(parentNode, [next.start, ...next.items], prev.start);
                remove(parentNode, [prev.start, ...prev.items]);
            }
        }
    });
    listMirror.onInsert((index, inserted) => {
        const nextElem = listMirror.get(index + 1);
        const nextMarker = nextElem ? nextElem.start : marker;
        const { parentNode } = marker;
        if (parentNode) {
            if (isMounted) {
                mount(parentNode, [inserted.start, ...inserted.items], nextMarker);
            } else {
                append(parentNode, [inserted.start, ...inserted.items], nextMarker);
            }
        }
    });
    listMirror.onDelete((_, deleted) => {
        const { parentNode } = deleted.start;
        if (parentNode) {
            if (isMounted) {
                dismount(parentNode, [deleted.start, ...deleted.items]);
            } else {
                remove(parentNode, [deleted.start, ...deleted.items]);
            }
        }
    });
    return [result, marker];
}
