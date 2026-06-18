import type { Component } from "../types/Component.js";
import { handleWelcomeInteraction } from "../features/WelcomeFeature.js";

const component: Component = {
  customIdPrefix: "welcome:",
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isChannelSelectMenu()) return;
    await handleWelcomeInteraction(interaction);
  },
};
export default component;
