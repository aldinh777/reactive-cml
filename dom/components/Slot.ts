import { Context, NodeComponent, intoDom } from '..';
import { Properties } from '../../util';
import { propAlias } from '../prop-util';

export default function (props: Properties = {}, context?: Context): NodeComponent[] | void {
    if (context && context._super) {
        const { children, extracts, params, _super } = context;
        if (props.for === _super.slotname) {
            const nextParams = propAlias(params, extracts, params);
            return intoDom(children, nextParams, _super);
        }
    }
}
