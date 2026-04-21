export type SfxKey =
  | "sfx_vent"
  | "sfx_flush"
  | "sfx_zap"
  | "sfx_server_fail"
  | "sfx_drain"
  | "sfx_overpressure"
  | "sfx_level_clear"
  | "sfx_game_over"
  | "sfx_click"
  | "sfx_jump";

export type MusicKey =
  | "music_menu"
  | "music_game"
  | "music_tension"
  | "music_game_over"
  | "music_win";

export interface AudioAsset {
  key: string;
  paths: string[];
}

export const SFX_ASSETS: { key: SfxKey; paths: string[] }[] = [
  { key: "sfx_vent", paths: ["assets/audio/vent.wav"] },
  { key: "sfx_flush", paths: ["assets/audio/flush.wav"] },
  { key: "sfx_zap", paths: ["assets/audio/zap.wav"] },
  { key: "sfx_server_fail", paths: ["assets/audio/server_fail.wav"] },
  { key: "sfx_drain", paths: ["assets/audio/drain.wav"] },
  { key: "sfx_overpressure", paths: ["assets/audio/overpressure.wav"] },
  { key: "sfx_level_clear", paths: ["assets/audio/level_clear.wav"] },
  { key: "sfx_game_over", paths: ["assets/audio/game_over.wav"] },
  { key: "sfx_click", paths: ["assets/audio/click.wav"] },
  { key: "sfx_jump", paths: ["assets/audio/jump.wav"] },
];

export const MUSIC_ASSETS: { key: MusicKey; paths: string[] }[] = [
  { key: "music_menu", paths: ["assets/audio/music_menu.mp3"] },
  { key: "music_game", paths: ["assets/audio/music_game.mp3"] },
  { key: "music_tension", paths: ["assets/audio/music_tension.mp3"] },
  { key: "music_game_over", paths: ["assets/audio/music_game_over.mp3"] },
  { key: "music_win", paths: ["assets/audio/music_win.mp3"] },
];
