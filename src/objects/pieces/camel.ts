import Phaser from "phaser";
import { EImageKey } from "../../scenes/planning";
import Piece, { TPieceOverrides } from "./piece";

export default class Camel extends Piece {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    gridX: number,
    gridY: number,
    isEnemy: boolean
  ) {
    const overrides: TPieceOverrides = {
      attack: 2,
      health: 3,
      imageKey: EImageKey.Camel,
      speed: 2,
    };

    super(add, gridX, gridY, isEnemy, overrides);
  }
}
