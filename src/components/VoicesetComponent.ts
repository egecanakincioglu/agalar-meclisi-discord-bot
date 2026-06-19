import type { Component } from "../types/Component.js";
import { handleVoiceInteraction } from "../features/VoiceFeature.js";

const component: Component = {
  customIdPrefix: "voiceset:",
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isChannelSelectMenu()) return;
    await handleVoiceInteraction(interaction);
  },
};
export default component;
