import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { inspect } from "node:util";
import type { Command } from "../types/Command.js";
import { getConfig } from "../handlers/ConfigHandler.js";

const command: Command = {
  data: new SlashCommandBuilder()
    .setName("eval").setDescription("Kod çalıştırır. Sadece bot geliştiricileri kullanabilir.")
    .addStringOption(option => option.setName("code").setDescription("Çalıştırılacak kod.").setRequired(true))
    .addBooleanOption(option => option.setName("silent").setDescription("Sonuç sadece sana gösterilsin mi?").setRequired(false)),

  async execute(interaction) {
    const config = getConfig();
    const developerIds = config.bot.developer.developerIds;
    if (!developerIds.includes(interaction.user.id)) { await interaction.reply({ content: "Bu komutu kullanma yetkin yok.", flags: 64 }); return; }

    const code = interaction.options.getString("code", true);
    const silent = interaction.options.getBoolean("silent") ?? false;
    const cleanCode = code.replace(/^```(?:js|ts|javascript|typescript)?\n?/i, "").replace(/\n?```$/, "");

    const isStatement = /^(const |let |var |if |for |while |do |function |class |import |export |switch |try |catch |throw |break |continue |return |await )/m.test(cleanCode) || cleanCode.includes(";") || cleanCode.includes("\n");
    const wrappedCode = isStatement ? `(async () => {\n${cleanCode}\n})()` : `(async () => { return ${cleanCode} })()`;

    let result: unknown; let isError = false;
    const startTime = performance.now();
    try { result = await eval(wrappedCode); } catch (error) { result = error; isError = true; }
    const elapsed = (performance.now() - startTime).toFixed(2);

    const inspected = inspect(result, { depth: 2, maxArrayLength: 50, maxStringLength: 500 });

    function wrapInCodeBlock(content: string): string { return `\`\`\`js\n${content}\n\`\`\``; }
    function splitToChunks(text: string, maxContentPerChunk: number, maxChunks: number): string[] {
      const chunks: string[] = [];
      let remaining = text;
      while (remaining.length > 0 && chunks.length < maxChunks) {
        const cutAt = Math.min(remaining.length, maxContentPerChunk);
        chunks.push(remaining.slice(0, cutAt));
        remaining = remaining.slice(cutAt);
      }
      return chunks;
    }

    const MAX_CONTENT = 1013; const MAX_OUTPUT_CHUNKS = 10;
    const inputContent = cleanCode.length > 1000 ? cleanCode.slice(0, 1000) + "\n... (kırpıldı)" : cleanCode;
    const outputChunks = splitToChunks(inspected, MAX_CONTENT, MAX_OUTPUT_CHUNKS);

    if (outputChunks.length === MAX_OUTPUT_CHUNKS && inspected.length > MAX_CONTENT * MAX_OUTPUT_CHUNKS) {
      const last = outputChunks[outputChunks.length - 1];
      const suffix = "\n... (kırpıldı)";
      outputChunks[outputChunks.length - 1] = last.slice(0, MAX_CONTENT - suffix.length) + suffix;
    }

    const fields: Array<{ name: string; value: string; inline: boolean }> = [{ name: "📥 Giriş", value: wrapInCodeBlock(inputContent), inline: false }];
    for (let i = 0; i < outputChunks.length; i++) {
      fields.push({ name: i === 0 ? "📤 Çıkış" : `📤 Çıkış (${i + 1})`, value: wrapInCodeBlock(outputChunks[i]), inline: false });
    }

    const embed = new EmbedBuilder().setColor(isError ? 0xed4245 : 0x57f287).setTitle(isError ? "❌ Hata" : "✅ Başarılı")
      .addFields(fields).setFooter({ text: `${elapsed}ms • ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    const replyPayload: Record<string, unknown> = { embeds: [embed] };
    if (silent) replyPayload.flags = 64;
    await interaction.reply(replyPayload);
  },
};

export default command;
