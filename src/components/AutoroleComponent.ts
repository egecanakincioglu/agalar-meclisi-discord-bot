import type { Component } from "../types/Component.js";
import { handleAutoroleInteraction } from "../features/AutoroleFeature.js";

const component: Component = {
  customIdPrefix: "autorole:",
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isRoleSelectMenu()) return;
    await handleAutoroleInteraction(interaction);
  },
};
export default component;
