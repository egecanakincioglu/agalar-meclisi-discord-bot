import { Collection } from "discord.js";
import type { Component } from "../types/Component.js";

const componentCollection = new Collection<string, Component>();

export function loadComponents(components: Component[]) {
  for (const component of components) {
    componentCollection.set(component.customIdPrefix, component);
    console.log(`Component yüklendi: ${component.customIdPrefix}`);
  }
}

export function getComponent(customId: string) {
  for (const [prefix, component] of componentCollection) {
    if (customId.startsWith(prefix)) return component;
  }
  return null;
}
