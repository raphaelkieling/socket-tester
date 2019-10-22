<template>
  <div id="app">
    <div class="workspace">
      <aside>
        <div>
          <el-button @click="handleImport">Import</el-button>
          <el-button @click="handleExport">Export</el-button>
          <el-divider></el-divider>
        </div>

        <command-card
          v-for="command in commands"
          :key="command.id"
          :command="command"
          @select="handleChangeCommandSelected"
          @unselect="handleCancel"
          @remove="handleRemove($event)"
          :selected="isSelected(command)"
          class="command-card"
        />
      </aside>
      <main>
        <div class="editor-connect">
          <el-input v-model="socketUrl" type="text" placeholder="Socket url" />
          <el-button v-if="hasWsConnection" type="danger" @click="handleDisconnect">Disconnect</el-button>
          <el-button v-else @click="handleConnect">Connect</el-button>
        </div>

        <div class="editor-name">
          <el-input v-model="commandSelected.name" type="text" placeholder="Command name" />
        </div>

        <v-jsoneditor class="editor-json" v-model="commandSelected.source" :plus="false" />

        <div class="editor-action">
          <el-button @click="handleCancel">Cancel</el-button>
          <el-button @click="handleSave">Save</el-button>
          <div style="flex:1"></div>
          <el-button @click="handleSend" type="primary">Send</el-button>
        </div>
      </main>

      <div class="editor-logger">
        <div class="editor-logger-header">
          <el-divider content-position="left">Response Source</el-divider>
        </div>

        <div class="editor-logger-body">
          <div v-for="(log, index) in logger" :key="index">
            <json-viewer :value="log" :expand-depth="5" copyable></json-viewer>
          </div>
        </div>

        <div class="editor-logger-footer">
          <el-button size="small" @click="handleClearLogger">
            <i class="el-icon-delete"></i>
          </el-button>
          <el-checkbox class="editor-logger-footer-lockscroll" v-model="lockScroll">Lock scroll</el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import CommandCard from "./components/CommandCard.vue";
import Command from "./data/Command";
import ClientStorage from "./storage";

@Component({
  components: {
    CommandCard
  }
})
export default class App extends Vue {
  public socketUrl: string = "";
  public commands: Command[] = [];
  public commandSelected: Command = new Command("", {});
  public ws: WebSocket | null = null;
  public logger: (string | object)[] = [];
  public lockScroll: boolean = true;
  public storage: ClientStorage = new ClientStorage();

  @Watch("lockScroll")
  handlerChangeLockScroll(value: boolean) {
    if (value) this.scrollEditorLoggerToBottom();
  }

  isSelected(command: Command): boolean {
    return this.commandSelected.id === command.id;
  }

  get hasWsConnection(): boolean {
    return !!this.ws;
  }

  populateSource(dataToImport: any = null) {
    const sourceFromStorage = dataToImport || this.storage.getSource();

    try {
      const source = JSON.parse(sourceFromStorage);

      this.$message({
        type: "success",
        message: "Success on import source"
      });

      this.socketUrl = source.socketUrl;
      this.commands = source.commands.map((command: any) => {
        return Command.fromJson(command);
      });
    } catch (err) {
      this.$message({
        type: "error",
        message: "Error on import source"
      });
    }
  }

  saveSource() {
    this.$message({
      type: "success",
      message: "Success on save source"
    });

    const toSave = {
      socketUrl: this.socketUrl,
      commands: this.commands
    };

    this.storage.saveSource(toSave);
  }

  mounted() {
    this.populateSource();
  }

  wsConnect(url: string, done: any) {
    this.ws = new WebSocket(url);
    this.ws.onopen = e => {
      this.log("[open] Connection established");
      done();
    };
    this.ws.onerror = e => {
      this.log("[error] Connection error");
    };

    this.ws.onmessage = e => {
      try {
        this.log(JSON.parse(e.data));
      } catch (e) {
        this.log(e.data);
      }
    };

    this.ws.onclose = e => {
      this.log("[close] Disconnected");
      this.ws = null;
    };
  }

  wsSend(data: object) {
    if (this.ws) {
      this.log("[sended] Data was sended");
      this.ws.send(JSON.stringify(data));
    } else {
      this.log(
        "[info] Need a web socket connection but ok, i'm gonna try resolve for you"
      );

      this.wsConnect(this.socketUrl, () => {
        this.wsSend(data);
      });
    }
  }

  wsDisconnect() {
    if (this.ws) {
      this.ws.close();
    } else {
      this.$message({
        type: "error",
        message: "Need a websocket connection to disconnect"
      });
    }
  }

  log(toLog: string | object) {
    this.logger.push(toLog);

    if (!this.lockScroll) return;
    this.$nextTick(() => {
      this.scrollEditorLoggerToBottom();
    });
  }

  handleChangeCommandSelected(command: Command) {
    this.commandSelected = Object.assign({}, command);
  }

  handleConnect() {
    this.wsConnect(this.socketUrl, () => {
      this.$message({
        type: "success",
        message: "Success on connect to a websocket protocol"
      });
    });
  }

  handleImport() {
    this.$prompt("Please paste the data exported", "Import", {
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      inputType: "textarea"
    }).then(({ value }: any) => {
      this.populateSource(value);
      this.saveSource();
    });
  }

  handleExport() {
    const source = this.storage.getSource() || "";

    navigator.clipboard.writeText(source).then(() => {
      this.$message({
        type: "success",
        message: "Exported to your clipboard"
      });
    });
  }

  handleDisconnect() {
    this.wsDisconnect();
  }

  handleRemove(command: Command) {
    this.commands = this.commands.filter(c => c !== command);
    this.saveSource();
  }

  handleCancel() {
    this.commandSelected = new Command("", {});
  }

  handleSend() {
    this.wsSend(this.commandSelected.source);
  }

  get loggerScrollableBody(): HTMLElement | null {
    return this.$el.querySelector(".editor-logger-body");
  }

  scrollEditorLoggerToBottom() {
    if (this.loggerScrollableBody) {
      this.loggerScrollableBody.scrollTop =
        this.loggerScrollableBody.scrollHeight -
        this.loggerScrollableBody.clientHeight;
    }
  }

  handleClearLogger() {
    this.logger = [];
  }

  handleSave() {
    const finded = this.commands.find(c => c.id === this.commandSelected.id);
    if (finded) {
      this.commands.forEach(command => {
        if (command.id === this.commandSelected.id) {
          command = Object.assign(command, this.commandSelected);
        }
      });
      this.$message({
        type: "success",
        message: "Saved with success"
      });
    } else {
      const newCommand = new Command("", {});
      this.commands.push(Object.assign(newCommand, this.commandSelected));
      this.handleCancel();
      this.$message({
        type: "success",
        message: "Created a new command with success"
      });
    }

    this.saveSource();
  }
}
</script>

<style lang="scss">
body {
  margin: 0;
  padding: 0;
}

.command-card {
  margin-bottom: 10px;
}

.workspace {
  display: flex;
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;

  aside {
    padding: 10px;
    max-width: 300px;
  }

  .editor-logger {
    flex: 1;
    display: flex;
    flex-direction: column;

    &-header {
    }

    &-body {
      flex: 1;
      overflow-y: scroll;
    }

    &-footer {
      padding: 10px;

      &-lockscroll {
        margin-left: 10px;
      }
    }
  }

  main {
    flex: 2;
    padding: 10px;
    display: flex;
    flex-direction: column;

    .editor-connect {
      display: flex;

      button {
        margin-left: 10px;
      }
    }

    .editor-name {
      margin-top: 10px;
    }

    .editor-json {
      flex: 1;
      margin-top: 10px;
    }

    .editor-action {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
