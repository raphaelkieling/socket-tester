<template>
  <el-card shadow="never">
    <div class="card-container">
      <small>{{command.name}}</small>
      <div class="card-container-action">
        <el-button
          v-if="selected"
          @click="$emit('unselect', command)"
          size="mini"
          type="primary"
          round
        >unselect</el-button>
        <el-button v-else @click="$emit('select', command)" size="mini" type="primary" round>select</el-button>

        <el-button
          @click="$emit('remove', command)"
          :disabled="selected"
          size="mini"
          type="danger"
          round
        >remove</el-button>
      </div>
    </div>
  </el-card>
</template>

<script>
import Command from "@/data/Command";

export default {
  props: {
    command: Command,
    selected: Boolean
  }
};
</script>

<style lang="scss">
.card-container {
  display: flex;
  flex-direction: column;

  &-action {
    display: flex;
    margin-top: 10px;
  }
}
</style>