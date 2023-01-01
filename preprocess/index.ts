import preprocessChildren from './children';
import preprocessSlot from './slot';
import preprocessComponent from './component';
import preprocessControl from './control';
import preprocessDestruct from './destruct';
import preprocessExtract from './extract';
import preprocessBinding from './binding';
import preprocessList from './list';

export const DEFAULT_PREPROCESSOR = [
    preprocessChildren,
    preprocessSlot,
    preprocessControl,
    preprocessList,
    preprocessDestruct,
    preprocessComponent,
    preprocessExtract,
    preprocessBinding
];
