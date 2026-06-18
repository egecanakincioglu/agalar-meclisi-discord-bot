import type { Component } from "../types/Component.js";
import { handleLeaveInteraction } from "../features/LeaveFeature.js";

const component: Component = {
  customIdPrefix: "leave:",
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isChannelSelectMenu()) return;
    await handleLeaveInteraction(interaction);
  },
};
export default component;
