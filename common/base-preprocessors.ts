import preprocessExtract from './preprocessor/extract';
import preprocessBinding from './preprocessor/binding';
import preprocessChildren from './preprocessor/children';
import preprocessSlot from './preprocessor/slot';
import preprocessComponent from './preprocessor/component';
import preprocessBasicIf from './preprocessor/basic-if';
import preprocessBasicDestruct from './preprocessor/basic-foreach';
import preprocessBasicForeach from './preprocessor/basic-destruct';

export default [
    preprocessChildren,
    preprocessSlot,
    preprocessBasicIf,
    preprocessBasicDestruct,
    preprocessBasicForeach,
    preprocessComponent,
    preprocessExtract,
    preprocessBinding
];
