export type ConfigDefinition<
  TKey extends string,
  TValue
> = {
  key: TKey;
  fileName: string;
  defaultValue: TValue;
  normalize: (raw: unknown) => TValue;
};

export type ConfigObject<
  TDefinitions extends readonly ConfigDefinition<string, unknown>[]
> = {
  [Def in TDefinitions[number] as Def["key"]]: ReturnType<Def["normalize"]>;
};

export type AnyConfigDefinition = ConfigDefinition<string, unknown>;
