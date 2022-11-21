import { EScene, screenHeight, screenWidth } from "../config";
import Piece, { TVec2 } from "../objects/pieces/piece";
import Skeleton from "../objects/pieces/skeleton";
import Camel from "../objects/pieces/camel";
import Phaser from "phaser";
import Elephant from "../objects/pieces/elephant";
import SkeletonKing from "../objects/pieces/skeletonKing";
import Wolf from "../objects/pieces/wolf";

export const IMAGE_FOLDER = "assets/images";

export enum EMouseEvent {
  PointerDown = "pointerdown",
  PointerOver = "pointerover",
  PointerOut = "pointerout",
  PointerUp = "pointerup",
}

export enum EImageKey {
  Camel = "camel1",
  Elephant = "elephant2",
  Skeletons = "skeletons",
  Outline = "outline",
  Circle = "circle",
  Highlight = "highlight",
  BorderHighlight = "border_highlight",
  Arrow = "arrow_small",
  MoveIcon = "move_icon_small",
  SkeletonKing = "skeleton_king",
  Slime = "slime",
  Wolf = "wolf",
}

const DEFAULT_BOARD = [
  [2, 3, 4, 5, 3, 2],
  [1, 1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1],
  [2, 3, 4, 5, 3, 2],
];

// const DEFAULT_BOARD = [
//   [2, 3, 3, 4, 5, 3, 3, 2],
//   [1, 1, 1, 1, 1, 1, 1, 1],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0, 0, 0],
//   [1, 1, 1, 1, 1, 1, 1, 1],
//   [2, 3, 3, 4, 5, 3, 3, 2],
// ];

const MS = 1000;
export const GRID_WIDTH = DEFAULT_BOARD.length;
export const GRID_HEIGHT = DEFAULT_BOARD[0]?.length || 1;
export const GRID_SIZE = 984 / GRID_HEIGHT;
export const TOTAL_GRID_WIDTH = GRID_WIDTH * GRID_SIZE;
export const TOTAL_GRID_HEIGHT = GRID_HEIGHT * GRID_SIZE;
export const ATTACK_ANIMATION_DURATION = 0.3 * MS;
export const DELAY_DURATION = 0.1 * MS;
export const FONT_SIZE = GRID_SIZE / 4;
export const NUMBER_SIZE = FONT_SIZE + 4;

// const DEFAULT_BOARD = [
//   [2, 3, 4, 5, 3, 2],
//   [1, 1, 1, 1, 1, 1],
//   [0, 0, 0, 0, 0, 0],
//   [0, 0, 0, 0, 0, 0],
//   [1, 1, 1, 1, 1, 1],
//   [2, 3, 4, 5, 3, 2],
// ];

export const safeSet = <T>(array: T[][], i: number, j: number, value: T) => {
  const row = array[i];
  if (row) {
    row[j] = value;
  }
};

export const getPieceOffset = () => {
  return {
    x: (screenWidth - TOTAL_GRID_WIDTH + GRID_SIZE) / 2,
    y: (screenHeight - TOTAL_GRID_HEIGHT + GRID_SIZE) / 2,
  };
};

export interface IGridTile {
  canMove: boolean;
  piece?: Piece;
}

enum ETurnPhase {
  Moving = "Moving",
  AnimatingAttack = "AnimatingAttack",
}

type TAttack = {
  piece: Piece;
  enemy: Piece;
};

export default class Planning extends Phaser.Scene {
  // private selectedOffsetX: number;
  // private selectedOffsetY: number;
  private zoom: number;
  private clickOffsetX: number;
  private clickOffsetY: number;
  private belowHints?: Phaser.GameObjects.RenderTexture;
  private aboveHints?: Phaser.GameObjects.RenderTexture;
  private moveHint?: Phaser.GameObjects.Image;
  private highlight?: Phaser.GameObjects.Image;
  private borderHighlight?: Phaser.GameObjects.Image;
  private arrow?: Phaser.GameObjects.Image;
  private moveIcon?: Phaser.GameObjects.Image;
  private wKey?: Phaser.Input.Keyboard.Key;
  private aKey?: Phaser.Input.Keyboard.Key;
  private sKey?: Phaser.Input.Keyboard.Key;
  private dKey?: Phaser.Input.Keyboard.Key;
  private upKey?: Phaser.Input.Keyboard.Key;
  private downKey?: Phaser.Input.Keyboard.Key;
  private space?: Phaser.Input.Keyboard.Key;

  private grid: IGridTile[][];
  private selected?: Piece;
  private selectedCount: number;
  private dragging: boolean;
  private isEnemyTurn: boolean;
  private leftButtonWasDown: boolean;
  private clickedPos: TVec2;
  private phase: ETurnPhase;
  private animationCount: number;
  private delayCount: number;
  private queuedAttacks: TAttack[];
  private currentAttack?: TAttack;

  constructor() {
    super(EScene.Planning);

    this.zoom = 3;
    this.clickOffsetX = 0;
    this.clickOffsetY = 0;
    this.animationCount = 0;
    this.delayCount = 0;

    this.grid = [];
    this.selectedCount = 0;
    this.dragging = false;
    this.isEnemyTurn = false;
    this.leftButtonWasDown = false;
    this.clickedPos = { x: 0, y: 0 };
    this.phase = ETurnPhase.Moving;
    this.queuedAttacks = [];
  }

  preload() {
    Object.values(EImageKey).forEach((key) =>
      this.load.image(key, `${IMAGE_FOLDER}/${key}.png`)
    );
  }

  create() {
    this.wKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.sKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.upKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.DOWN
    );
    this.space = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );

    this.add
      .grid(
        screenWidth / 2,
        screenHeight / 2,
        TOTAL_GRID_WIDTH,
        TOTAL_GRID_HEIGHT,
        GRID_SIZE,
        GRID_SIZE,
        Phaser.Display.Color.ValueToColor("#d4bb4c").color
      )
      .setAltFillStyle(Phaser.Display.Color.ValueToColor("#a98a34").color)
      .setOutlineStyle();

    for (let i = 0; i < GRID_WIDTH; i++) {
      this.grid[i] = [];

      for (let j = 0; j < GRID_HEIGHT; j++) {
        const pieceId = DEFAULT_BOARD[j]?.[i];
        let piece: Piece | undefined = undefined;
        const isEnemy = j > GRID_HEIGHT / 2;

        if (pieceId) {
          switch (pieceId) {
            case 1:
              piece = new Skeleton(this.add, i, j, isEnemy);
              break;
            case 2:
              piece = new Camel(this.add, i, j, isEnemy);
              break;
            case 3:
              piece = new Elephant(this.add, i, j, isEnemy);
              break;
            case 4:
              piece = new SkeletonKing(this.add, i, j, isEnemy);
              break;
            case 5:
              piece = new Wolf(this.add, i, j, isEnemy);
              break;
          }
        }

        safeSet(this.grid, i, j, { piece, canMove: false });
      }
    }

    this.belowHints = this.add.renderTexture(
      screenWidth / 2,
      screenHeight / 2,
      TOTAL_GRID_WIDTH,
      TOTAL_GRID_HEIGHT
    );
    this.belowHints.setOrigin(0.5);
    this.belowHints.alpha = 0.4;

    this.aboveHints = this.add.renderTexture(
      screenWidth / 2,
      screenHeight / 2,
      TOTAL_GRID_WIDTH,
      TOTAL_GRID_HEIGHT
    );
    this.aboveHints.setOrigin(0.5);
    this.aboveHints.depth = 20;

    this.moveHint = this.add.image(0, 0, EImageKey.Circle);
    this.moveHint.scale = 0.5;
    this.moveHint.visible = false;

    this.highlight = this.add.image(0, 0, EImageKey.Highlight);
    this.highlight.tint = Phaser.Display.Color.ValueToColor("#26cd00").color;
    this.highlight.alpha = 0.6;
    this.highlight.scale = GRID_SIZE / 128;
    this.highlight.visible = false;

    this.arrow = this.add.image(0, 0, EImageKey.Arrow);
    this.arrow.tint = Phaser.Display.Color.ValueToColor("#ffffff").color;
    this.arrow.scale = 0.5;
    this.arrow.alpha = 0.6;
    this.arrow.visible = false;

    this.moveIcon = this.add.image(0, 0, EImageKey.MoveIcon);
    this.moveIcon.tint = Phaser.Display.Color.ValueToColor("#cd0000").color;
    this.moveIcon.visible = false;

    // this.borderHighlight = this.add.image(0, 0, EImageKey.BorderHighlight);
    // this.borderHighlight.tint =
    //   Phaser.Display.Color.ValueToColor("#ffffff").color;
    // this.borderHighlight.alpha = 0.8;
    // this.borderHighlight.scale = 1.02;
    // this.borderHighlight.visible = false;
  }

  update(time: number, delta: number) {
    super.update(time, delta);

    const mouse = this.input.mousePointer;
    const gridPos = toGrid(mouse.x, mouse.y);

    if (mouse.leftButtonDown()) {
      if (!this.leftButtonWasDown) {
        this.leftButtonWasDown = true;

        if (this.phase === ETurnPhase.Moving) {
          this.dragging = false;

          const previouslySelected = this.selected;
          this.selected = this.grid[gridPos.x]?.[gridPos.y]?.piece;

          if (this.selected) {
            if (this.selected === previouslySelected) {
              if (
                gridPos.x === this.selected.gridX &&
                gridPos.y === this.selected.gridY &&
                this.dragging
              ) {
              } else {
                this.moveTo(gridPos);
              }
            } else {
              this.selectedCount = 0;
              this.clickedPos = { ...gridPos };
              this.setHints(this.selected);
            }

            this.clickOffsetX = this.selected.image.x - mouse.x;
            this.clickOffsetY = this.selected.image.y - mouse.y;
          } else if (previouslySelected) {
            this.selected = previouslySelected;
            this.moveTo(gridPos);
          }
        }
      }

      if (this.selected) {
        if (this.phase === ETurnPhase.Moving) {
          const currentOffsetX = this.selected.image.x - mouse.x;
          const currentOffsetY = this.selected.image.y - mouse.y;
          const dist = pointDist(
            currentOffsetX,
            currentOffsetY,
            this.clickOffsetX,
            this.clickOffsetY
          );

          if (dist > 15) {
            this.dragging = true;
          }
        }
      }
    }

    if (mouse.leftButtonReleased() && this.leftButtonWasDown) {
      this.leftButtonWasDown = false;

      if (this.selected) {
        if (this.phase === ETurnPhase.Moving) {
          if (
            this.clickedPos.x === gridPos.x &&
            this.clickedPos.y === gridPos.y
          ) {
            this.selectedCount = this.selectedCount + 1;

            if (this.dragging) {
              this.dragging = false;
              this.selected.moveTo(this.selected.gridX, this.selected.gridY);
            }

            if (this.selectedCount > 1) {
              this.selectedCount = 0;
              this.selected = undefined;
              this.clearHints();
            }
          } else {
            this.moveTo(gridPos);
          }
        }
      }
    }

    if (this.selected && this.dragging) {
      this.selected.drag(
        mouse.x, // + this.clickOffsetX,
        mouse.y // + this.clickOffsetY
      );
    }

    if (
      this.wKey &&
      this.aKey &&
      this.sKey &&
      this.dKey &&
      this.upKey &&
      this.downKey &&
      this.space
    ) {
      if (Phaser.Input.Keyboard.JustDown(this.space)) {
        console.log("sdfs");
      }

      if (Phaser.Input.Keyboard.JustDown(this.wKey)) {
      }

      if (Phaser.Input.Keyboard.JustDown(this.aKey)) {
      }

      if (Phaser.Input.Keyboard.JustDown(this.sKey)) {
      }

      if (Phaser.Input.Keyboard.JustDown(this.dKey)) {
      }

      if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      }

      if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      }
    }

    if (this.phase === ETurnPhase.AnimatingAttack) {
      if (this.animationCount <= 0 && this.delayCount <= 0) {
        if (this.currentAttack) {
          this.currentAttack.piece.moveTo(
            this.currentAttack.piece.gridX,
            this.currentAttack.piece.gridY
          );
        }
        this.delayCount = DELAY_DURATION;
      }

      if (this.delayCount > 0) {
        this.delayCount = this.delayCount - delta;

        if (this.delayCount <= 0) {
          this.currentAttack = undefined;

          while (this.queuedAttacks.length > 0 && !this.currentAttack) {
            this.currentAttack = this.queuedAttacks.shift();
            if ((this.currentAttack?.enemy.health || 0) <= 0) {
              this.currentAttack = undefined;
            }
          }

          if (this.currentAttack) {
            this.animationCount = ATTACK_ANIMATION_DURATION;
            this.currentAttack.piece.hasHitEnemy = false;
          } else {
            this.nextPhase();
          }
        }
      }

      if (this.animationCount > 0) {
        this.animationCount = this.animationCount - delta;

        if (this.currentAttack) {
          const pct = 1 - this.animationCount / ATTACK_ANIMATION_DURATION;
          this.currentAttack.piece.animateAttack(
            this.currentAttack.enemy,
            pct,
            this.grid
          );
        }
      }
    }
  }

  // enemy.attackEnemy(this.selected);
  //
  // this.selected.handleDeath(this.grid);
  // enemy.handleDeath(this.grid);

  clearHints() {
    this.belowHints?.clear();
    this.aboveHints?.clear();
  }

  setHints(piece: Piece, showMoves = true) {
    if (this.aboveHints && this.belowHints) {
      this.clearHints();

      if (showMoves) {
        const moves = piece.getMoves(this.grid);

        for (let i = 0; i < moves.length; i++) {
          const move = moves[i];

          if (move) {
            // safeSet(this.grid, i, j, { piece, canMove: false });

            const x = (move.x + 0.5) * GRID_SIZE;
            const y = (move.y + 0.5) * GRID_SIZE;

            this.belowHints.draw(this.moveHint, x, y);
          }
        }

        const pieceX = (piece.gridX + 0.5) * GRID_SIZE;
        const pieceY = (piece.gridY + 0.5) * GRID_SIZE;
        this.belowHints.draw(this.highlight, pieceX, pieceY);
        this.belowHints.draw(piece.outline, pieceX, pieceY);
        this.belowHints.draw(piece.image, pieceX, pieceY);
      }

      // const attacks = piece.getAttacks(this.grid);
      //
      // for (let i = 0; i < attacks.length; i++) {
      //   const attack = attacks[i];
      //
      //   if (attack) {
      //     const x = (0.5 * (piece.gridX + attack.x) + 0.5) * GRID_SIZE;
      //     const y = (0.5 * (piece.gridY + attack.y) + 0.5) * GRID_SIZE;
      //
      //     if (this.arrow) {
      //       this.arrow.rotation = pointDir(
      //         piece.gridX,
      //         piece.gridY,
      //         attack.x,
      //         attack.y
      //       );
      //       this.aboveHints.draw(this.arrow, x, y);
      //     }
      //   }
      // }
    }
  }

  moveTo(pos: TVec2) {
    if (this.selected) {
      const previousTile =
        this.grid[this.selected.gridX]?.[this.selected.gridY];
      const tile = this.grid[pos.x]?.[pos.y];
      const moves = this.selected.getMoves(this.grid);
      const legalMove = moves.some(
        (move) => move.x === pos.x && move.y === pos.y
      );

      if (tile?.piece) {
        this.clearHints();
        this.selected.moveTo(this.selected.gridX, this.selected.gridY);
        this.dragging = false;
        this.selected = tile.piece;
        this.selectedCount = 1;
        this.clickedPos = { x: tile.piece.gridX, y: tile.piece.gridY };
        this.setHints(this.selected);
      } else {
        if (previousTile && tile && !tile?.piece && legalMove) {
          safeSet(this.grid, this.selected.gridX, this.selected.gridY, {
            ...previousTile,
            piece: undefined,
          });

          this.selected.moveTo(pos.x, pos.y);

          safeSet(this.grid, pos.x, pos.y, {
            ...tile,
            piece: this.selected,
          });

          this.nextPhase();
        } else {
          this.selected.moveTo(this.selected.gridX, this.selected.gridY);
          this.selected = undefined;
          this.clearHints();
        }

        this.dragging = false;
      }
    }
  }

  nextPhase() {
    switch (this.phase) {
      case ETurnPhase.Moving:
        this.queuedAttacks = [];
        for (let i = 0; i < GRID_WIDTH; i++) {
          for (let j = 0; j < GRID_HEIGHT; j++) {
            const piece = this.grid[i]?.[j]?.piece;

            if (piece && piece.isEnemy === this.selected?.isEnemy) {
              const enemies = piece.getNeighborEnemies(this.grid);
              this.queuedAttacks.push(
                ...enemies.map((enemy) => ({ piece, enemy }))
              );
            }
          }
        }

        this.selected = undefined;
        this.clearHints();

        if (this.queuedAttacks.length > 0) {
          this.phase = ETurnPhase.AnimatingAttack;
        } else {
          this.phase = ETurnPhase.Moving;
          this.isEnemyTurn = !this.isEnemyTurn;
        }
        break;
      case ETurnPhase.AnimatingAttack:
        this.phase = ETurnPhase.Moving;
        this.isEnemyTurn = !this.isEnemyTurn;
        break;
    }
  }
}

const toGrid = (x: number, y: number) => {
  const offsetX = screenWidth / 2 - (GRID_WIDTH * GRID_SIZE) / 2;
  const offsetY = screenHeight / 2 - (GRID_HEIGHT * GRID_SIZE) / 2;

  const adjustedPosX = clamp(
    -1,
    Math.floor((x - offsetX) / GRID_SIZE),
    GRID_WIDTH
  );
  const adjustedPosY = clamp(
    -1,
    Math.floor((y - offsetY) / GRID_SIZE),
    GRID_HEIGHT
  );

  return {
    x: adjustedPosX,
    y: adjustedPosY,
  };
};

export const isInsideGrid = (x: number, y: number) => {
  return x > -1 && x < GRID_WIDTH && y > -1 && y < GRID_HEIGHT;
};

const clamp = (min: number, v: number, max: number) => {
  return Math.min(Math.max(v, min), max);
};

const toRad = (v: number) => (Math.PI * v) / 180;

const angle = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

export const lerp = (start: number, end: number, amt: number) =>
  (1 - amt) * start + amt * end;

export const lengthDirX = (dist: number, angle: number): number =>
  dist * Math.cos(angle);

export const lengthDirY = (dist: number, angle: number): number =>
  dist * Math.sin(angle);

export const pointDir = (x1: number, y1: number, x2: number, y2: number) => {
  const dy = y2 - y1;
  const dx = x2 - x1;
  return Math.atan2(dy, dx);
};

export const pointDist = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
