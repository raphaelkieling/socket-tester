<template>
  <div id="app">
    <div class="workspace">
      <aside>
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
          <el-button :disabled="!hasWsConnection" @click="handleSend" type="primary">Send</el-button>
        </div>
      </main>

      <div class="editor-logger">
        <el-divider content-position="left">Response Source</el-divider>
        <div v-for="(log, index) in logger" :key="index">
          <json-viewer :value="log" :expand-depth="5" copyable></json-viewer>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import CommandCard from "./components/CommandCard.vue";
import Command from "./data/Command";

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
  public sessionName: string = "socket-tester";

  isSelected(command: Command): boolean {
    return this.commandSelected.id === command.id;
  }

  get hasWsConnection(): boolean {
    return !!this.ws;
  }

  import(sessionImported: any) {
    this.socketUrl = sessionImported.socketUrl;
    this.commands = sessionImported.commands.map((command: any) => {
      return Command.fromJson(command);
    });
  }

  export() {
    const toExport = {
      socketUrl: this.socketUrl,
      commands: this.commands
    };

    const sessionImported = sessionStorage.setItem(
      this.sessionName,
      JSON.stringify(toExport)
    );
  }

  mounted() {
    const sessionImported = sessionStorage.getItem(this.sessionName);
    if (sessionImported) {
      this.import(JSON.parse(sessionImported));
    } else {
      console.warn("Session not found data");
    }
  }

  wsConnect(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = e => {
      this.log("[open] Connection established");
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
      this.log("[sended] Data not sended because has a error");
      this.$message({
        type: "error",
        message: "Need a websocket connection to send"
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
  }

  handleChangeCommandSelected(command: Command) {
    this.commandSelected = Object.assign({}, command);
  }

  handleConnect() {
    this.wsConnect(this.socketUrl);
  }

  handleDisconnect() {
    this.wsDisconnect();
  }

  handleRemove(command: Command) {
    this.commands = this.commands.filter(c => c !== command);
  }

  handleCancel() {
    this.commandSelected = new Command("", {});
  }

  handleSend() {
    this.wsSend(this.commandSelected.source);
  }

  handleSave() {
    const finded = this.commands.find(c => c.id === this.commandSelected.id);
    if (finded) {
      this.commands.forEach(command => {
        if (command.id === this.commandSelected.id) {
          command = Object.assign(command, this.commandSelected);
        }
      });
    } else {
      const newCommand = new Command("", {});
      this.commands.push(Object.assign(newCommand, this.commandSelected));
      this.handleCancel();
    }

    this.export();
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
    overflow-y: scroll;
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
