import Phaser from "phaser";
import { EImageKey } from "../../scenes/planning";
import Piece, { TPieceOverrides } from "./piece";

export default class Elephant extends Piece {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    gridX: number,
    gridY: number,
    isEnemy: boolean
  ) {
    const overrides: TPieceOverrides = {
      attack: 3,
      health: 6,
      imageKey: EImageKey.Elephant,
      speed: 2,
    };

    super(add, gridX, gridY, isEnemy, overrides);
  }
}
