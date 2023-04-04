/*
    Copyright (C) 2022-2023 KKonaOG
*/
/*
    This file is part of GenLite.
    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

export class GenLiteLogger {
    constructor() {
        if (process.env.NODE_ENV === 'production') {
            this.log = (message: string) => {};
            this.debug = (message: string) => {};
        }

        // Override console methods
        console.log = this.log;
        console.debug = this.debug;
        console.warn = this.warn;
        console.error = this.error
    }

    warn(message: string) {
        // Yellow Warning Text that looks good on a dark and light background
        console.info(`%c[GenLite - Warning]: ${message}`, 'color: #F7B500');
    }

    error(message: string) {
        // Red Error Text that looks good on a dark and light background
        console.info(`%c[GenLite - Error]: ${message}`, 'color: #FF4F4F');
    }

    log(message: string) {
        // Blue Debug Text that looks good on a dark and light background
        console.info(`%c[GenLite - Log]: ${message}`, 'color: #0C7D9D');
    }

    debug(message: string) {
        // Blue Debug Text that looks good on a dark and light background
        console.info(`%c[GenLite - Log]: ${message}`, 'color: #0C7D9D');
    }
}