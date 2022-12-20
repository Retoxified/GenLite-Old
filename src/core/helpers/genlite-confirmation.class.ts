export class GenliteConfirmation {
    static async confirm(message: string) {
        return window.confirm(message);
    }
}