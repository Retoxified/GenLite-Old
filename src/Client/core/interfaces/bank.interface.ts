/*
    Copyright (C) 2023 FrozenReality dpeGit
*/
/*
    This file is part of GenLite.

    GenLite is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
    
    GenLite is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
    
    You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>.
*/

interface BankSlot {
    item: string,
    slot: number,
    stored: number
    base_item_id?: string,
    contained_items?: Record<string, string>,
    stored_amounts?: Record<string, number>,
    original_item?: any //TODO what is this
}

interface BankDomSlot {
    div: HTMLElement,
    quality: HTMLElement,
    quantity: HTMLElement,
    quantity_span: HTMLElement,
}

interface Bank {
    slots: Record<number, BankSlot>,
    DOM_anchor: HTMLElement,
    DOM_slots: Record<number, BankDomSlot>,
    inventory_forced_open: boolean,
    quality_DOM_slots: Record<string, BankDomSlot>,
    quality_slots: Record<string, {
        item: string,
        stored: number
    }>,
    saved_withdraw_x: number,
    visible: boolean,
    selected_page: number,
}