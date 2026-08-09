import Phaser from "phaser";

const WIDTH = 900;
const HEIGHT = 520;

function addCloud(scene, x, y, scale = 1) {
  const cloud = scene.add.container(x, y).setScale(scale);
  cloud.add(scene.add.circle(0, 10, 24, 0xffffff, 0.62));
  cloud.add(scene.add.circle(28, 0, 32, 0xffffff, 0.72));
  cloud.add(scene.add.circle(62, 12, 22, 0xffffff, 0.62));
  return cloud;
}

export default class LetterCaseScene extends Phaser.Scene {
  constructor() {
    super({ key: "LetterCaseScene" });
    this.effects = [];
  }

  create() {
    this.drawWorld();

    this.events.on("game:feedback", ({ type }) => {
      if (type === "correct") this.celebrate();
      if (type === "retry") this.nudge();
    });

    this.registry.get("onReady")?.(this);
  }

  drawWorld() {
    this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0xdff5ef);
    this.add.rectangle(WIDTH / 2, 442, WIDTH, 156, 0xfff8d9);

    addCloud(this, 78, 92, 0.78);
    addCloud(this, 760, 76, 0.64);

    this.add.circle(110, 392, 52, 0xb7e5d7, 0.8);
    this.add.circle(796, 390, 68, 0xb7e5d7, 0.75);
    this.add.rectangle(450, 445, 660, 14, 0xbedfcf, 0.92).setOrigin(0.5);

    const mailbox = this.add.container(450, 167);
    mailbox.add(this.add.rectangle(0, 32, 238, 120, 0xffd8cd).setStrokeStyle(4, 0x19384a));
    mailbox.add(this.add.rectangle(0, -22, 188, 72, 0xf4a08d).setStrokeStyle(4, 0x19384a));
    mailbox.add(this.add.circle(-94, -22, 36, 0xf4a08d).setStrokeStyle(4, 0x19384a));
    mailbox.add(this.add.rectangle(0, 62, 252, 18, 0x19384a, 0.16));
    mailbox.add(this.add.circle(84, -37, 9, 0xfff0b1).setStrokeStyle(3, 0x19384a));

    const flag = this.add.container(130, 142);
    flag.add(this.add.rectangle(0, 22, 5, 78, 0x19384a));
    flag.add(this.add.rectangle(20, -14, 42, 27, 0xfff0b1).setStrokeStyle(3, 0x19384a));

    this.add.text(450, 265, "Cari pasangan huruf!", {
      fontFamily: "Nunito, Trebuchet MS, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#19384a"
    }).setOrigin(0.5).setAlpha(0.86);

    this.add.text(450, 490, "Tekan kad yang sepadan", {
      fontFamily: "Nunito, Trebuchet MS, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#19384a"
    }).setOrigin(0.5).setAlpha(0.52);
  }

  celebrate() {
    const colors = [0xfff0b1, 0xf4a08d, 0x9ddcc9, 0x9fb8f4];
    for (let index = 0; index < 10; index += 1) {
      const star = this.add.star(
        450 + Phaser.Math.Between(-210, 210),
        170 + Phaser.Math.Between(-42, 62),
        5,
        5,
        13,
        colors[index % colors.length]
      );
      star.setAlpha(0);
      this.effects.push(star);
      this.tweens.add({
        targets: star,
        y: star.y - Phaser.Math.Between(42, 92),
        angle: Phaser.Math.Between(-60, 60),
        alpha: { from: 0, to: 1 },
        scale: { from: 0.4, to: 1 },
        duration: 540,
        ease: "Back.out",
        onComplete: () => {
          this.tweens.add({
            targets: star,
            alpha: 0,
            y: star.y - 18,
            duration: 320,
            onComplete: () => star.destroy()
          });
        }
      });
    }
  }

  nudge() {
    this.cameras.main.shake(90, 0.0025, false);
  }
}

export { WIDTH as LETTER_CASE_GAME_WIDTH, HEIGHT as LETTER_CASE_GAME_HEIGHT };
