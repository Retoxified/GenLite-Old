export interface GenLitePlugin {
    init: () => Promise<void>,
    loginOK?: () => void,
    logoutOK?: () => void,
    action?: (verb: string, params: any) => void // TODO: provide proper type
    handle?: (verb: string, payload: any) => void,
    update?: (dt: number) => void,
    updateXP?: (xp: any) => void, // TODO: provide proper type
    updateTooltip?: () => void,
    updateSkills?: () => void,
    initializeUI?: () => void,
    combatUpdate?: (update: any) => void,
    setHealth?: (current: number, max: number) => void,
    handleUpdatePacket?: (packet: any) => void,
}
