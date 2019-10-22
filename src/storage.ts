export default class ClientStorage {
    public sessionName: string = "socket-tester";

    saveSource(data: any) {
        localStorage.setItem(
            this.sessionName,
            JSON.stringify(data)
        );
    }

    getSource(): any {
        return localStorage.getItem(this.sessionName);
    }
}