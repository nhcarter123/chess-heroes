import Phaser from "phaser";
import { EImageKey } from "../../scenes/planning";
import Piece, { TPieceOverrides } from "./piece";

export default class Skeleton extends Piece {
  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    gridX: number,
    gridY: number,
    isEnemy: boolean
  ) {
    const overrides: TPieceOverrides = {
      attack: 1,
      health: 3,
      imageKey: EImageKey.Skeletons,
    };

    super(add, gridX, gridY, isEnemy, overrides);
  }
}
