import Phaser from "phaser";
import { EImageKey, GRID_SIZE } from "../../scenes/planning";
import Piece, { TPieceOverrides } from "./piece";

export default class SkeletonKing extends Piece {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    gridX: number,
    gridY: number,
    isEnemy: boolean
  ) {
    const overrides: TPieceOverrides = {
      attack: 2,
      health: 2,
      imageKey: EImageKey.SkeletonKing,
      speed: 1,
    };

    super(add, gridX, gridY, isEnemy, overrides);
  }
}
