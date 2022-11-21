import Phaser from "phaser";
import config from "./config";
import PlanningScene from "./scenes/planning";

const loadFont = (name: string) => {
  const newFont = new FontFace(name, `url("assets/fonts/${name}.ttf")`);
  newFont.load().then(function (loaded) {
    document.fonts.add(loaded);
  });
};

loadFont("bangers");
loadFont("concert_one");

new Phaser.Game(
  Object.assign(config, {
    scene: [PlanningScene],
  })
);
