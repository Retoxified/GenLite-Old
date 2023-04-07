/*
    Copyright (C) 2023 dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/
interface Inventory {
    DOM_anchor: HTMLDivElement,
    DOM_slots: {
        [slotNum: number]: invDom

    },
    context_map: invContextMap,
    item_reductions: {
        [itemKey: string]: number
    },
    items: {
        [slotNum: number]: itemSlot
    },
    quantity_overrides: object, //TODO dunno what this does
    state: string,
    visible: boolean,

    countItemTotal(itemKey: string): number
}

interface invContextMap {
    normal: () => void,
    bank: () => void,
    crafting_slots: () => void,
    shop: () => void,
    trade: () => void
}
interface invDom {
    item_div: HTMLDivElement,
    item_extra: HTMLDivElement,
    item_icon: HTMLImageElement,
    item_quality: HTMLImageElement,
    item_quantity: HTMLDivElement
}

interface itemSlot {
    item: string,
    max_quantity: number,
    quantity: number,
    original_item?: any //TODO what is this
}