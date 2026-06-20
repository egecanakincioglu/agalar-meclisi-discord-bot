import type { Component } from "../types/Component.js";
import { handleLevelInteraction } from "../features/LevelFeature.js";

const component: Component = {
  customIdPrefix: "levelset:",
  async execute(interaction) {
    if (!interaction.isButton()) return;
    await handleLevelInteraction(interaction);
  },
};
export default component;
