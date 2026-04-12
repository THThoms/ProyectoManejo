import Phaser from "phaser";

export class IslandScene extends Phaser.Scene {
  constructor(options) {
    super("IslandScene");
    this.options = options;
    this.playerNodes = new Map();
    this.decorations = [];
  }

  preload() {}

  create() {
    this.createTextures();
    this.drawBackground();

    this.add.text(24, 24, "Island Game", {
      fontFamily: "Trebuchet MS",
      fontSize: "24px",
      color: "#14324a"
    });

    this.add.text(24, 52, "Haz clic para mover tu sprite", {
      fontFamily: "Trebuchet MS",
      fontSize: "14px",
      color: "#214e63"
    });

    this.input.on("pointerdown", async (pointer) => {
      const x = Phaser.Math.Clamp(pointer.x, 72, 888);
      const y = Phaser.Math.Clamp(pointer.y, 112, 568);
      await this.options.onMoveRequest({ x, y });
    });
  }

  update() {
    const players = this.options.getPlayers();
    const myUserId = this.options.getMyUserId();
    const liveIds = new Set(players.map((player) => player.id));

    for (const [id, node] of this.playerNodes.entries()) {
      if (!liveIds.has(id)) {
        node.shadow.destroy();
        node.sprite.destroy();
        node.label.destroy();
        this.playerNodes.delete(id);
      }
    }

    for (const player of players) {
      let node = this.playerNodes.get(player.id);
      const texturePrefix = player.id === myUserId ? "avatar-me" : "avatar-other";

      if (!node) {
        const shadow = this.add.ellipse(player.posX, player.posY + 20, 28, 10, 0x000000, 0.18);
        shadow.setDepth(3);

        const sprite = this.add.image(player.posX, player.posY, `${texturePrefix}-idle`);
        sprite.setScale(2);
        sprite.setDepth(5);

        const label = this.add.text(player.posX, player.posY + 30, player.nombre, {
          fontFamily: "Trebuchet MS",
          fontSize: "12px",
          color: "#16324f",
          backgroundColor: "#fff7e9",
          padding: { left: 7, right: 7, top: 3, bottom: 3 }
        });
        label.setOrigin(0.5);
        label.setDepth(6);

        node = {
          shadow,
          sprite,
          label,
          displayX: player.posX,
          displayY: player.posY,
          targetX: player.posX,
          targetY: player.posY,
          lastDirectionX: 1
        };
        this.playerNodes.set(player.id, node);
      }

      node.targetX = player.posX;
      node.targetY = player.posY;

      const dx = node.targetX - node.displayX;
      const dy = node.targetY - node.displayY;
      const distance = Math.hypot(dx, dy);
      const moving = distance > 0.6;

      if (moving) {
        node.displayX += dx * 0.18;
        node.displayY += dy * 0.18;
        if (Math.abs(dx) > 0.1) {
          node.lastDirectionX = Math.sign(dx);
        }
      } else {
        node.displayX = node.targetX;
        node.displayY = node.targetY;
      }

      const walkFrame = moving
        ? Math.floor(this.time.now / 140) % 2 === 0
          ? "walk-a"
          : "walk-b"
        : "idle";
      const bob = moving
        ? Math.sin(this.time.now / 80) * 1.5
        : Math.sin(this.time.now / 220 + node.displayX * 0.01) * 1.2;

      node.sprite.setTexture(`${texturePrefix}-${walkFrame}`);
      node.sprite.setFlipX(node.lastDirectionX < 0);
      node.shadow.setPosition(node.displayX, node.displayY + 20);
      node.sprite.setPosition(node.displayX, node.displayY + bob);
      node.label.setText(player.nombre);
      node.label.setPosition(node.displayX, node.displayY + 34);
    }
  }

  drawBackground() {
    const skyTop = this.add.rectangle(480, 160, 960, 320, 0xa8dadc);
    skyTop.setDepth(-30);

    const skyBottom = this.add.rectangle(480, 320, 960, 640, 0x8ecae6);
    skyBottom.setDepth(-29);

    const seaFar = this.add.ellipse(480, 380, 980, 620, 0x2a9dbe, 1);
    seaFar.setDepth(-28);

    const seaNear = this.add.ellipse(480, 400, 930, 540, 0x219ebc, 1);
    seaNear.setDepth(-27);

    const foam = this.add.ellipse(480, 395, 700, 380, 0xbee9f7, 0.3);
    foam.setDepth(-26);

    const beach = this.add.ellipse(480, 360, 560, 340, 0xf4d58d, 1);
    beach.setDepth(-25);

    const grass = this.add.ellipse(480, 360, 450, 250, 0x7cc576, 1);
    grass.setDepth(-24);

    const ridge = this.add.ellipse(480, 370, 370, 170, 0x5dbb63, 0.85);
    ridge.setDepth(-23);

    [
      { x: 250, y: 250, scale: 2.4 },
      { x: 720, y: 235, scale: 2.7 },
      { x: 770, y: 470, scale: 2.2 },
      { x: 195, y: 455, scale: 2.5 }
    ].forEach((item) => {
      const tree = this.add.image(item.x, item.y, "tree");
      tree.setScale(item.scale);
      tree.setDepth(2);
      this.decorations.push(tree);
    });

    [
      { x: 380, y: 455, scale: 2.2 },
      { x: 610, y: 300, scale: 2.1 },
      { x: 510, y: 240, scale: 1.7 }
    ].forEach((item) => {
      const rock = this.add.image(item.x, item.y, "rock");
      rock.setScale(item.scale);
      rock.setDepth(2);
      this.decorations.push(rock);
    });
  }

  createTextures() {
    if (!this.textures.exists("avatar-me-idle")) {
      this.buildAvatarTexture("avatar-me-idle", 0xf4a261, 0x2a2a2a, "idle");
      this.buildAvatarTexture("avatar-me-walk-a", 0xf4a261, 0x2a2a2a, "walk-a");
      this.buildAvatarTexture("avatar-me-walk-b", 0xf4a261, 0x2a2a2a, "walk-b");
    }

    if (!this.textures.exists("avatar-other-idle")) {
      this.buildAvatarTexture("avatar-other-idle", 0x0f8b8d, 0x23404a, "idle");
      this.buildAvatarTexture("avatar-other-walk-a", 0x0f8b8d, 0x23404a, "walk-a");
      this.buildAvatarTexture("avatar-other-walk-b", 0x0f8b8d, 0x23404a, "walk-b");
    }

    if (!this.textures.exists("tree")) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x8d5524, 1);
      g.fillRect(14, 18, 6, 14);
      g.fillStyle(0x2a9d8f, 1);
      g.fillEllipse(9, 18, 18, 12);
      g.fillEllipse(24, 18, 18, 12);
      g.fillEllipse(16, 10, 20, 14);
      g.generateTexture("tree", 32, 32);
      g.destroy();
    }

    if (!this.textures.exists("rock")) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x7d8597, 1);
      g.fillRoundedRect(4, 12, 24, 14, 5);
      g.fillStyle(0xaeb5c0, 1);
      g.fillRoundedRect(7, 14, 10, 5, 3);
      g.generateTexture("rock", 32, 32);
      g.destroy();
    }
  }

  buildAvatarTexture(key, shirtColor, outlineColor, pose) {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xf1c27d, 1);
    g.fillRect(5, 2, 6, 5);
    g.fillStyle(shirtColor, 1);
    g.fillRect(4, 8, 8, 6);
    g.fillStyle(0xffffff, 1);
    g.fillRect(6, 3, 1, 1);
    g.fillRect(9, 3, 1, 1);
    g.fillStyle(outlineColor, 1);

    if (pose === "walk-a") {
      g.fillRect(4, 14, 2, 2);
      g.fillRect(10, 14, 2, 2);
      g.fillRect(3, 12, 1, 3);
      g.fillRect(12, 12, 1, 3);
    } else if (pose === "walk-b") {
      g.fillRect(5, 14, 2, 2);
      g.fillRect(9, 14, 2, 2);
      g.fillRect(4, 12, 1, 3);
      g.fillRect(11, 12, 1, 3);
      g.fillRect(3, 8, 1, 2);
      g.fillRect(12, 8, 1, 2);
    } else {
      g.fillRect(4, 14, 3, 2);
      g.fillRect(9, 14, 3, 2);
    }

    g.lineStyle(1, 0x16324f, 1);
    g.strokeRect(4.5, 8.5, 7, 5);
    g.strokeRect(5.5, 2.5, 5, 4);
    g.generateTexture(key, 16, 18);
    g.destroy();
  }
}
