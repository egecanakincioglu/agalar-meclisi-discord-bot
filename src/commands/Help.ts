import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../types/Command.js";

const command: Command = {
  data: new SlashCommandBuilder().setName("help").setDescription("Tüm komutları listeler."),
  async execute(interaction) {
    const embed = new EmbedBuilder().setColor(0x2b2d31).setTitle("📚 Komut Listesi").setDescription("Agalar Meclisi bot komutları aşağıdadır.")
      .addFields(
        { name: "👤 Kullanıcı", value: "`/level` — Seviye ve XP bilgini gösterir.\n`/lb` — Seviye sıralamasını gösterir.\n`/user` — Kullanıcı detay bilgisi.\n`/avatar` — Avatar gösterir.\n`/invites` — Davet bilgilerini gösterir.\n`/top` — Davet sıralaması.", inline: false },
        { name: "ℹ️ Bilgi", value: "`/server` — Sunucu detay bilgisi.\n`/status` — Bot durum raporu.\n`/help` — Bu menü.", inline: false },
        { name: "🛠️ Yönetim", value: "`/welcome` — Hoş geldin sistemi.\n`/leave` — Ayrılma mesaj sistemi.\n`/autorole` — Otomatik rol sistemi.\n`/voiceset` — Ses kanalı bağlantı sistemi.\n`/levelset` — Seviye sistemi yönetimi.\n`/announce` — Duyuru gönderir.\n`/delete` — Toplu mesaj siler.\n`/kick` — Kullanıcı atar.\n`/ban` — Kullanıcı banlar.", inline: false },
      )
      .setFooter({ text: `İsteyen: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
    await interaction.reply({ embeds: [embed] });
  },
};
export default command;
