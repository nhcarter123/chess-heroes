import Phaser from "phaser";
import {
  EImageKey,
  FONT_SIZE,
  getPieceOffset,
  GRID_SIZE,
  IGridTile,
  isInsideGrid,
  NUMBER_SIZE,
  safeSet,
} from "../../scenes/planning";
import { compact } from "lodash";

export type TPieceOverrides = Partial<
  Pick<Piece, "attack" | "health" | "speed">
> & {
  imageKey: EImageKey;
};

export type TVec2 = {
  x: number;
  y: number;
};

export default class Piece {
  public image: Phaser.GameObjects.Image;
  public outline: Phaser.GameObjects.Image;
  private attackText: Phaser.GameObjects.Text;
  private healthText: Phaser.GameObjects.Text;
  public gridX: number;
  public gridY: number;
  public isEnemy: boolean;
  public attack: number;
  public health: number;
  public speed: number;
  public hasHitEnemy: boolean;

  constructor(
    add: Phaser.GameObjects.GameObjectFactory,
    gridX: number,
    gridY: number,
    isEnemy: boolean,
    overrides: TPieceOverrides
  ) {
    this.gridX = gridX;
    this.gridY = gridY;
    this.isEnemy = isEnemy;
    this.speed = overrides.speed ? overrides.speed : 1;
    this.hasHitEnemy = false;

    const offset = getPieceOffset();
    const x = offset.x + this.gridX * GRID_SIZE;
    const y = offset.y + this.gridY * GRID_SIZE;

    this.image = add.image(x, y, overrides.imageKey);
    this.image.scale = GRID_SIZE / 650;
    this.outline = add.image(x, y, EImageKey.Highlight);
    this.outline.scale = GRID_SIZE / 150;

    if (this.isEnemy) {
      this.outline.tint = Phaser.Display.Color.ValueToColor("#b8e1ff").color;
    } else {
      this.outline.tint = Phaser.Display.Color.ValueToColor("#662e23").color;
    }

    this.attack = overrides.attack ? overrides.attack : 1;
    this.health = overrides.health ? overrides.health : 1;

    const fontStyle = {
      fontSize: `${FONT_SIZE}px`,
      // fontFamily: "Verdana",
      fontFamily: "concert_one",
      align: "center",
      strokeThickness: 1,
      fixedWidth: NUMBER_SIZE,
      fixedHeight: NUMBER_SIZE,
    };

    this.attackText = add.text(0, 0, this.attack.toString(), fontStyle);
    this.healthText = add.text(0, 0, this.health.toString(), fontStyle);

    this.moveTo(this.gridX, this.gridY);
  }

  create() {}

  update(time: number, delta: number) {}

  private static getTextPos(x: number, y: number) {
    const textSpace = GRID_SIZE / 4;
    const textHeight = GRID_SIZE / 8;

    return {
      attackTextX: x - textSpace - NUMBER_SIZE / 2,
      attackTextY: y + textHeight,
      healthTextX: x + textSpace - NUMBER_SIZE / 2,
      healthTextY: y + textHeight,
    };
  }

  private moveObjects(x: number, y: number, depth: number) {
    this.outline.x = x;
    this.outline.y = y;
    this.outline.depth = depth + 2;

    this.image.x = x;
    this.image.y = y;
    this.image.depth = depth + 3;

    const textPos = Piece.getTextPos(x, y);
    this.attackText.x = textPos.attackTextX;
    this.attackText.y = textPos.attackTextY;
    this.attackText.depth = depth + 4;
    this.healthText.x = textPos.healthTextX;
    this.healthText.y = textPos.healthTextY;
    this.healthText.depth = depth + 4;
  }

  drag(x: number, y: number) {
    this.moveObjects(x, y, 10);
  }

  getMoves(grid: IGridTile[][]) {
    const pos = { x: this.gridX, y: this.gridY };
    const directions = [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ];
    const moves: TVec2[] = directions.flatMap((dir) =>
      getMovesInDirection(pos, dir, grid, this.speed)
    );

    return moves;
  }

  getNeighborEnemies(grid: IGridTile[][]) {
    return compact([
      grid[this.gridX + 1]?.[this.gridY]?.piece,
      grid[this.gridX + 1]?.[this.gridY + 1]?.piece,
      grid[this.gridX]?.[this.gridY + 1]?.piece,
      grid[this.gridX - 1]?.[this.gridY + 1]?.piece,
      grid[this.gridX - 1]?.[this.gridY]?.piece,
      grid[this.gridX - 1]?.[this.gridY - 1]?.piece,
      grid[this.gridX]?.[this.gridY - 1]?.piece,
      grid[this.gridX + 1]?.[this.gridY - 1]?.piece,
    ]).filter((piece) => piece.isEnemy !== this.isEnemy);
  }

  moveTo(gridX: number, gridY: number) {
    const offset = getPieceOffset();

    this.gridX = gridX;
    this.gridY = gridY;
    this.moveObjects(
      offset.x + this.gridX * GRID_SIZE,
      offset.y + this.gridY * GRID_SIZE,
      2
    );
  }

  animateAttack(enemy: Piece, pct: number, grid: IGridTile[][]) {
    let travel: number;
    const dist = 0.75;

    if (pct <= 0.5) {
      travel = dist * (1 / (-pct + 1) - 1);
    } else {
      travel = dist * (1 / pct - 1);

      if (!this.hasHitEnemy) {
        this.hasHitEnemy = true;
        this.attackEnemy(enemy);
        enemy.handleDeath(grid);
      }
    }

    const offset = getPieceOffset();
    const x1 = this.gridX * GRID_SIZE + offset.x;
    const y1 = this.gridY * GRID_SIZE + offset.y;
    const x2 = enemy.gridX * GRID_SIZE + offset.x;
    const y2 = enemy.gridY * GRID_SIZE + offset.y;

    const x = x1 * (1 - travel) + x2 * travel;
    const y = y1 * (1 - travel) + y2 * travel;

    this.drag(x, y);
  }

  handleDeath(grid: IGridTile[][]) {
    if (this.health <= 0) {
      this.image.destroy();
      this.outline.destroy();
      this.attackText.destroy();
      this.healthText.destroy();

      const tile = grid[this.gridX]?.[this.gridY];

      if (tile) {
        safeSet(grid, this.gridX, this.gridY, {
          ...tile,
          piece: undefined,
        });
      }
    }
  }

  attackEnemy(piece: Piece) {
    piece.health = piece.health - this.attack;
    piece.healthText.text = piece.health.toString();
  }
}

const getMovesInDirection = (
  position: TVec2,
  direction: TVec2,
  grid: IGridTile[][],
  speed: number
): TVec2[] => {
  const moves = [];

  let x = position.x;
  let y = position.y;
  let dirX = direction.x;
  let dirY = direction.y;

  let canMove = true;
  while (canMove) {
    x = x + dirX;
    y = y + dirY;

    speed = speed - 1;

    if (speed <= 0) {
      canMove = false;
    }

    if (isInsideGrid(x, y)) {
      const tile = grid[x]?.[y];

      if (tile?.piece) {
        canMove = false;
      } else {
        moves.push({ x, y });
      }
    } else {
      canMove = false;
    }
  }

  return moves;
};
