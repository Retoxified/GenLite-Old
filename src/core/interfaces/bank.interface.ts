interface BankSlot {
    item: string,
    slot: number,
    stored: number
    base_item_id?: string,
    contained_items?: Record<string, string>,
    stored_amounts?: Record<string, number>,
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
}
