import Phaser from "phaser";

export const screenWidth = 1080;
export const screenHeight = 1080;

export enum EScene {
  Planning = "Planning",
  Battle = "Battle",
}

export default {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#323232",
  scale: {
    width: screenWidth,
    height: screenHeight,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // pixelArt: true,
  // roundPixels: true,
  // antialiasGL: true,
  // renderer: { mipmapFilter: "LINEAR_MIPMAP_NEAREST" },
};
