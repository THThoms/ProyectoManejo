import Phaser from "phaser";
import { IslandScene } from "./IslandScene";

export function createIslandGame(container, options) {
  const scene = new IslandScene(options);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: container,
    width: 960,
    height: 640,
    backgroundColor: "#8ecae6",
    pixelArt: true,
    scene: [scene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });

  return () => {
    game.destroy(true);
  };
}
