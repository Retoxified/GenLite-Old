export class GenLiteConfirmation {
    static async confirm(message: string) {
        return window.confirm(message);
    }
}