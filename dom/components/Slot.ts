import { Context, NodeComponent, intoDom } from '..';
import { propAlias } from '../prop-util';
import { Properties } from '../../util-type';

export default function (props: Properties = {}, component: Context = {}): NodeComponent[] | void {
    if (component._super) {
        const { children, extracts, params, _super } = component;
        if (props.for === _super.slotname) {
            const nextParams = propAlias(params, extracts, params);
            return intoDom(children, nextParams, _super);
        }
    }
}
