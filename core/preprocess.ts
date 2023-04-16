import { renderCML } from '../core';
import { Preprocessor } from './types';
import { BASE_COMPONENT_SET } from './constants';

import basePreprocessors from './base-preprocessors';

const COMPONENT_PATH = '@aldinh777/reactive-cml/core/components';
const RENDER_PATH = '@aldinh777/reactive-cml/core/render';

export = function (): Preprocessor {
    return {
        buildScript(cmlRoot, [dependencies, params], addImport) {
            /** add internal dependencies to import */
            const internalComponents = dependencies.filter((dep: string) =>
                BASE_COMPONENT_SET.includes(dep)
            );
            for (const component of internalComponents) {
                addImport([`${COMPONENT_PATH}/${component}`, component]);
            }

            /** component rendering process */
            const flatResult = renderCML(cmlRoot);
            const fullparams = params.concat(dependencies);
            const stringifiedResult = JSON.stringify(flatResult, null, 2);
            addImport([RENDER_PATH, ['render']]);
            return `return render(${stringifiedResult}, {${fullparams.join()}}, component, true)`;
        },
        relativeBlacklist: BASE_COMPONENT_SET,
        preprocessors: basePreprocessors
    };
};
