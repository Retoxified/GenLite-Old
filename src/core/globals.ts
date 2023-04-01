/*
    Copyright (C) 2022-2023 Retoxified, FrozenReality, dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

/** Browser globals */
declare interface Window {
    [key: string]: any,
}

declare interface CommandSpec {
    command: string,
    handler: (a: string) => void,
    helpFunction: (a: string) => string,
    helpText: string,
    echo: boolean,
}

declare type Settings = {
    [key: string]: {
        type: string,
        value: any,
        stateHandler: Function,

        // This should be removed in the future as it is only used for backwards compatibility with the old settings system
        oldKey?: string,

        // Any Children that are enabled/disabled when this setting is enabled/disabled
        children?: Settings,

        // If a popup message is needed when the setting is enabled then enter the message here
        alert?: string

        // Ranges
        min?: number,
        max?: number,
        step?: number

        // Select
        options?: any[],

        // Tooltips
        description?: string,
    }
}
