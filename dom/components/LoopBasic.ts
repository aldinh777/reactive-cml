import { ComponentChildren, intoDom, NodeComponent } from '..';
import { RCMLResult } from '../../src';
import { Properties } from '../../util';
import { cloneSetVal } from '../prop-util';

function createFlatListElement(
    params: Properties,
    alias: string,
    items: any[],
    tree: RCMLResult[],
    cc?: ComponentChildren
): NodeComponent[] {
    const elems: NodeComponent[] = [];
    for (const item of items) {
        const localParams: Properties = cloneSetVal(params, alias, item);
        elems.push(...intoDom(tree, localParams, cc));
    }
    return elems;
}

export default function (
    props: Properties = {},
    _children?: ComponentChildren
): NodeComponent[] | void {
    if (!_children || typeof props.list !== 'string' || typeof props.as !== 'string') {
        return;
    }
    const { tree, params, _super } = _children;
    const list = params[props.list];
    const alias = props.as;
    const result: NodeComponent[] = [];
    for (const item of list) {
        const localParams = cloneSetVal(params, alias, item);
        result.push(...intoDom(tree, localParams, _super));
    }
    return result;
}
