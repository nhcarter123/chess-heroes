import Phaser from "phaser";
import { EImageKey } from "../../scenes/planning";
import Piece, { TPieceOverrides } from "./piece";

export default class Wolf extends Piece {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    gridX: number,
    gridY: number,
    isEnemy: boolean
  ) {
    const overrides: TPieceOverrides = {
      attack: 3,
      health: 4,
      imageKey: EImageKey.Wolf,
      speed: 10,
    };

    super(add, gridX, gridY, isEnemy, overrides);
  }
}
