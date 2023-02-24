import {GenLitePlugin} from '../interfaces/plugin.interface';

export class ExamplePlugin implements GenLitePlugin {
    static pluginName = 'My Plugin';
    async init() {}
}
