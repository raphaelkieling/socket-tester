export default class Command {
    name: string;
    source: object;
    id: any;

    constructor(name: string, source: object) {
        this.name = name;
        this.id = Math.random();
        this.source = source;
    }

    static fromJson(source: any): Command {
        const command = new Command(source.name, source.source);
        command.id = source.id;
        return command;
    }
}