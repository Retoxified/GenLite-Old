/*
    Copyright (C) 2023 FrozenReality dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/


/* note if copying change import to `../core/interfaces/plugin.interface` */
import {GenLitePlugin} from '../interfaces/plugin.class';

export class ExamplePlugin extends GenLitePlugin {
    static pluginName = 'My Plugin';
    async init() {}
    handlePluginState(state: boolean) {}
}
