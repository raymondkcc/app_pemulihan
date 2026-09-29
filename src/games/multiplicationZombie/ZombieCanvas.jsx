import { useEffect, useRef } from "react";
import { DIFFICULTY_INFO } from "./multiplicationFacts.js";

const WIDTH = 1280;
const HEIGHT = 600;
const TRACK_LEFT = 156;
const TRACK_RIGHT = 1198;
const TRACK_TOP = 198;
const TRACK_BOTTOM = 502;
const BRAIN_X = 104;
const BRAIN_GROUND = 451;
const CANNON_X = 250;
const CANNON_GROUND = 469;
const ZOMBIE_START_X = 1138;
const ZOMBIE_DANGER_X = 193;
const ZOMBIE_GROUND = 459;
const ZOMBIE_SCALE = 0.88;
const MAX_DELTA_MS = 48;
const PACE_FACTOR = 0.25; // The difficulty speeds are tuned in distance units per millisecond.

const COLORS = {
  ink: "#202538",
  inkSoft: "#40506a",
  skyTop: "#a9ddfa",
  skyBottom: "#e8f7ff",
  grass: "#8dcc78",
  grassDark: "#5fa467",
  lane: "#e9f7db",
  laneEdge: "#a7cf8c",
  laneStripe: "#b5d798",
  cream: "#fff8e8",
  purple: "#7059e8",
  purpleDark: "#40339d",
  orange: "#ffbd59",
  gold: "#ffd45c",
  red: "#eb596e",
  pink: "#ff9fbe",
  brain: "#ff9ebc",
  brainDark: "#d86f9b",
  zombie: "#669c57",
  zombieDark: "#3d6848",
  shirt: "#587494",
  shirtDark: "#3f5872",
  purpleBag: "#725277",
  slime: "#6ed16c",
  slimeDark: "#3d9b5a",
  white: "#ffffff"
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(amount) {
  const t = clamp(amount, 0, 1);
  return 1 - ((1 - t) ** 3);
}

function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 2) {
  roundRectPath(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawCloud(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.ellipse(x, y, 46 * scale, 19 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 32 * scale, y + 7 * scale, 30 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 28 * scale, y + 4 * scale, 33 * scale, 16 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBush(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.fillStyle = "#4d9d63";
  ctx.beginPath();
  ctx.ellipse(x, y, 36 * scale, 12 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x - 22 * scale, y + 2 * scale, 23 * scale, 10 * scale, 0, 0, Math.PI * 2);
  ctx.ellipse(x + 23 * scale, y + 1 * scale, 25 * scale, 11 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#76b86c";
  ctx.beginPath();
  ctx.ellipse(x - 9 * scale, y - 9 * scale, 17 * scale, 9 * scale, -0.35, 0, Math.PI * 2);
  ctx.ellipse(x + 13 * scale, y - 8 * scale, 15 * scale, 8 * scale, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(0.64, COLORS.skyBottom);
  sky.addColorStop(0.65, COLORS.grass);
  sky.addColorStop(1, COLORS.grassDark);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255, 235, 151, .82)";
  ctx.beginPath();
  ctx.arc(1085, 74, 38, 0, Math.PI * 2);
  ctx.fill();

  drawCloud(ctx, 184 + Math.sin(time / 9000) * 12, 78, 0.92);
  drawCloud(ctx, 766 - Math.sin(time / 11000) * 15, 106, 0.72);
  drawCloud(ctx, 1036 + Math.sin(time / 13000) * 18, 154, 0.54);

  ctx.fillStyle = "rgba(71, 137, 98, .28)";
  ctx.beginPath();
  ctx.moveTo(0, 294);
  ctx.quadraticCurveTo(150, 236, 310, 294);
  ctx.quadraticCurveTo(482, 220, 660, 292);
  ctx.quadraticCurveTo(850, 226, 1034, 286);
  ctx.quadraticCurveTo(1150, 248, WIDTH, 286);
  ctx.lineTo(WIDTH, 382);
  ctx.lineTo(0, 382);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, .17)";
  ctx.fillRect(0, 354, WIDTH, 8);

  drawBush(ctx, 48, 405, 0.9);
  drawBush(ctx, 392, 397, 0.72);
  drawBush(ctx, 713, 402, 0.88);
  drawBush(ctx, 1015, 392, 0.7);
  drawBush(ctx, 1212, 411, 0.92);

  ctx.save();
  ctx.shadowColor = "rgba(33, 38, 61, .22)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 8;
  fillRoundRect(ctx, TRACK_LEFT, TRACK_TOP, TRACK_RIGHT - TRACK_LEFT, TRACK_BOTTOM - TRACK_TOP, 142, COLORS.lane);
  ctx.restore();
  strokeRoundRect(ctx, TRACK_LEFT, TRACK_TOP, TRACK_RIGHT - TRACK_LEFT, TRACK_BOTTOM - TRACK_TOP, 142, COLORS.laneEdge, 5);

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = COLORS.laneStripe;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.setLineDash([22, 22]);
  ctx.beginPath();
  ctx.moveTo(TRACK_LEFT + 75, 430);
  ctx.lineTo(TRACK_RIGHT - 75, 430);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(44, 96, 70, .19)";
  ctx.fillRect(0, 505, WIDTH, 95);
  for (let index = 0; index < 18; index += 1) {
    const x = 14 + index * 76;
    const y = 528 + (index % 3) * 17;
    ctx.fillStyle = index % 2 ? "#4f9861" : "#75b96c";
    ctx.beginPath();
    ctx.ellipse(x, y, 27, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBrain(ctx, x, groundY) {
  ctx.save();
  ctx.translate(x, groundY);

  ctx.fillStyle = "rgba(32, 37, 56, .2)";
  ctx.beginPath();
  ctx.ellipse(0, 24, 72, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, .78)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-48, -74);
  ctx.quadraticCurveTo(-73, -20, -49, 8);
  ctx.quadraticCurveTo(0, 36, 49, 8);
  ctx.quadraticCurveTo(73, -20, 48, -74);
  ctx.stroke();

  fillRoundRect(ctx, -46, 8, 92, 24, 10, COLORS.purpleDark);
  fillRoundRect(ctx, -34, 2, 68, 17, 8, COLORS.purple);

  ctx.fillStyle = COLORS.brain;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-25, -22, 23, 0.2, Math.PI * 2 - 0.1);
  ctx.arc(0, -36, 29, Math.PI * 0.92, Math.PI * 2.04);
  ctx.arc(28, -24, 23, Math.PI * 1.1, Math.PI * 2.15);
  ctx.arc(6, -8, 28, 0.1, Math.PI * 0.95);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = COLORS.brainDark;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  [[-27, -38, -12, -25], [-1, -57, 8, -39], [20, -42, 12, -26], [-10, -14, 2, -28], [13, -9, 24, -22]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 - 5, y1 + 8, x2 + 5, y2 - 8, x2, y2);
    ctx.stroke();
  });

  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '900 13px "Nunito", "Trebuchet MS", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("BRAIN", 0, 55);
  ctx.restore();
}

function drawWheel(ctx, x, y, radius) {
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.orange;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.purpleDark;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,.7)";
  ctx.lineWidth = 3;
  for (let spoke = 0; spoke < 4; spoke += 1) {
    const angle = spoke * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * 4, y + Math.sin(angle) * 4);
    ctx.lineTo(x + Math.cos(angle) * (radius - 5), y + Math.sin(angle) * (radius - 5));
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.purpleDark;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawCannon(ctx, x, groundY, recoil = 0, flash = 0) {
  ctx.save();
  ctx.translate(x, groundY);

  ctx.fillStyle = "rgba(32, 37, 56, .22)";
  ctx.beginPath();
  ctx.ellipse(12, 39, 91, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  drawWheel(ctx, -36, 25, 27);
  drawWheel(ctx, 38, 25, 27);

  fillRoundRect(ctx, -63, -5, 112, 43, 14, COLORS.purpleDark);
  strokeRoundRect(ctx, -63, -5, 112, 43, 14, COLORS.ink, 4);
  fillRoundRect(ctx, -52, 2, 90, 25, 10, COLORS.purple);

  ctx.save();
  ctx.translate(-recoil * 16, -recoil * 2);
  ctx.rotate(-0.09);
  fillRoundRect(ctx, -3, -28, 120, 29, 12, COLORS.purpleDark);
  strokeRoundRect(ctx, -3, -28, 120, 29, 12, COLORS.ink, 4);
  fillRoundRect(ctx, 11, -22, 94, 14, 6, COLORS.purple);
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(116, -13, 8, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(125, -13, 23 + flash * 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = COLORS.orange;
  ctx.beginPath();
  ctx.arc(-4, -6, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(-4, -6, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(-10, -13, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawZombieShadow(ctx, x, groundY, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = 0.18 * alpha;
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(x, groundY + 8, 78, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLimb(ctx, fromX, fromY, toX, toY, outerWidth, innerWidth, outerColor, innerColor) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outerColor;
  ctx.lineWidth = outerWidth;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.strokeStyle = innerColor;
  ctx.lineWidth = innerWidth;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function drawZombie(ctx, x, groundY, phase, { scale = ZOMBIE_SCALE, alpha = 1, deathProgress = 0 } = {}) {
  const step = Math.sin(phase);
  const trailing = Math.max(0, -step) * 12;
  const bob = Math.sin(phase * 1.04) * 4;
  const lean = -0.09 + Math.sin(phase * 0.53 + 0.6) * 0.022;
  const armSway = Math.sin(phase + 0.8) * 5;
  const deathLift = deathProgress * 34;
  const deathScale = 1 - deathProgress * 0.22;

  ctx.save();
  ctx.translate(x, groundY + bob + deathLift);
  ctx.rotate(lean + deathProgress * 0.48);
  ctx.scale(scale * deathScale, scale * deathScale);
  ctx.globalAlpha = alpha;

  const leftFootX = -27 + step * 23 - trailing;
  const rightFootX = 23 - step * 17 - Math.max(0, step) * 10;
  drawLimb(ctx, -18, -22, leftFootX, 0, 19, 12, COLORS.zombieDark, COLORS.zombie);
  drawLimb(ctx, 18, -22, rightFootX, 0, 19, 12, COLORS.zombieDark, COLORS.zombie);
  fillRoundRect(ctx, leftFootX - 19, -1, 33, 14, 6, COLORS.shirtDark);
  fillRoundRect(ctx, rightFootX - 8, -1, 34, 14, 6, COLORS.shirtDark);

  const leftHandX = -112 + armSway;
  const rightHandX = -96 - armSway * 0.64;
  drawLimb(ctx, -32, -92, leftHandX, -79 + armSway * 0.4, 22, 14, COLORS.zombieDark, COLORS.zombie);
  drawLimb(ctx, 30, -88, rightHandX, -61 - armSway * 0.35, 22, 14, COLORS.zombieDark, COLORS.zombie);

  ctx.fillStyle = COLORS.shirt;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-45, -111);
  ctx.lineTo(42, -111);
  ctx.lineTo(48, -20);
  ctx.lineTo(34, -12);
  ctx.lineTo(23, -22);
  ctx.lineTo(8, -11);
  ctx.lineTo(-6, -23);
  ctx.lineTo(-18, -12);
  ctx.lineTo(-31, -22);
  ctx.lineTo(-47, -15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.shirtDark;
  ctx.globalAlpha = alpha * 0.7;
  ctx.beginPath();
  ctx.moveTo(-44, -100);
  ctx.lineTo(-14, -100);
  ctx.lineTo(-19, -70);
  ctx.lineTo(-44, -78);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = alpha;

  ctx.strokeStyle = "rgba(232, 247, 219, .55)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-25, -87);
  ctx.lineTo(-11, -77);
  ctx.lineTo(-20, -63);
  ctx.moveTo(20, -91);
  ctx.lineTo(32, -78);
  ctx.lineTo(24, -67);
  ctx.stroke();

  ctx.fillStyle = COLORS.zombie;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  roundRectPath(ctx, -17, -128, 34, 28, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.zombie;
  ctx.beginPath();
  ctx.ellipse(0, -158, 54, 58, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.brain;
  ctx.beginPath();
  ctx.arc(15, -204, 24, Math.PI * 0.12, Math.PI * 1.14);
  ctx.arc(38, -195, 21, Math.PI * 1.05, Math.PI * 1.94);
  ctx.arc(26, -185, 24, Math.PI * 1.2, Math.PI * 1.96);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.strokeStyle = COLORS.brainDark;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  [[4, -207, 16, -193], [18, -218, 26, -201], [31, -211, 35, -195], [21, -182, 35, -188]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 - 5, y1 + 7, x2 + 5, y2 - 7, x2, y2);
    ctx.stroke();
  });

  ctx.fillStyle = COLORS.white;
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(-25, -165, 18, 23, -0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = COLORS.red;
  ctx.beginPath();
  ctx.arc(-22, -162, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(-20, -162, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.arc(-17, -167, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.purpleBag;
  ctx.globalAlpha = alpha * 0.78;
  ctx.beginPath();
  ctx.ellipse(24, -149, 23, 10, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#d8ecd1";
  ctx.beginPath();
  ctx.ellipse(24, -163, 18, 13, 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.ellipse(28, -162, 4, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.zombieDark;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(24, -165, 22, Math.PI * 1.04, Math.PI * 1.8);
  ctx.stroke();

  ctx.strokeStyle = COLORS.zombieDark;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1, -151);
  ctx.lineTo(-2, -135);
  ctx.lineTo(9, -136);
  ctx.stroke();

  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(15, -137);
  ctx.lineTo(42, -132);
  ctx.stroke();
  for (let stitch = 0; stitch < 4; stitch += 1) {
    const stitchX = 18 + stitch * 7;
    ctx.beginPath();
    ctx.moveTo(stitchX - 3, -140);
    ctx.lineTo(stitchX + 3, -130);
    ctx.stroke();
  }

  ctx.fillStyle = "#2b2030";
  ctx.beginPath();
  ctx.ellipse(1, -118, 29, 19, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "#c7a345";
  ctx.beginPath();
  ctx.moveTo(7, -121);
  ctx.lineTo(17, -119);
  ctx.lineTo(15, -105);
  ctx.lineTo(5, -108);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#8a6727";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = COLORS.zombie;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  [[leftHandX, -79 + armSway, leftHandX - 11, -85 + armSway], [leftHandX, -79 + armSway, leftHandX - 11, -76 + armSway], [rightHandX, -61 - armSway * 0.35, rightHandX - 10, -68 - armSway * 0.35], [rightHandX, -61 - armSway * 0.35, rightHandX - 10, -58 - armSway * 0.35]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  ctx.restore();
}

function drawHitFlash(ctx, x, groundY, phase, amount) {
  if (amount <= 0) return;
  ctx.save();
  const centerY = groundY - 146 + Math.sin(phase) * 3;
  const glow = ctx.createRadialGradient(x, centerY, 8, x, centerY, 98);
  glow.addColorStop(0, "rgba(255,255,255," + (0.78 * amount) + ")");
  glow.addColorStop(0.44, "rgba(255,255,255," + (0.35 * amount) + ")");
  glow.addColorStop(1, "rgba(235,89,110,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, centerY, 100, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.6 * amount;
  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(x, centerY, 65 + (1 - amount) * 17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = COLORS.white;
  ctx.lineWidth = 4;
  for (let ray = 0; ray < 8; ray += 1) {
    const angle = ray * Math.PI / 4 + phase * 0.04;
    const inner = 72;
    const outer = 92 + amount * 18;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * inner, centerY + Math.sin(angle) * inner);
    ctx.lineTo(x + Math.cos(angle) * outer, centerY + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawProjectile(ctx, projectile) {
  ctx.save();
  const trail = projectile.trail || [];
  trail.forEach((point, index) => {
    const alpha = (1 - index / Math.max(1, trail.length)) * 0.4;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath();
    ctx.arc(point.x, point.y, Math.max(2, 9 - index), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.shadowColor = "rgba(255, 212, 92, .95)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.arc(projectile.x - 4, projectile.y - 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  particles.forEach((particle) => {
    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation || 0);
    if (particle.kind === "spark") {
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-particle.size * 2, 0);
      ctx.lineTo(particle.size * 2, 0);
      ctx.moveTo(0, -particle.size * 2);
      ctx.lineTo(0, particle.size * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawHud(ctx, state, animation) {
  ctx.fillStyle = COLORS.ink;
  ctx.font = '1000 26px "Nunito", "Trebuchet MS", sans-serif';
  ctx.textAlign = "left";
  ctx.fillText("ZOMBIE DEFENSE", 28, 38);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '800 14px "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText((state?.operationInfo?.label || "Matematik") + " · Jawab pantas. Lindungi otak!", 30, 62);

  const difficulty = DIFFICULTY_INFO[state?.difficulty] || DIFFICULTY_INFO.easy;
  fillRoundRect(ctx, 28, 82, 156, 31, 15, "rgba(255,255,255,.66)");
  ctx.fillStyle = COLORS.purpleDark;
  ctx.font = '1000 13px "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText(difficulty.label + " / " + difficulty.english, 45, 103);

  ctx.save();
  ctx.shadowColor = "rgba(32,37,56,.12)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  fillRoundRect(ctx, 386, 26, 508, 83, 25, COLORS.cream);
  ctx.restore();
  strokeRoundRect(ctx, 386, 26, 508, 83, 25, "rgba(32,37,56,.62)", 4);
  ctx.fillStyle = COLORS.ink;
  ctx.font = '1000 36px "Nunito", "Trebuchet MS", sans-serif';
  ctx.textAlign = "center";
  const question = state?.question;
  ctx.fillText(question ? question.first + " " + (state?.operationInfo?.symbol || "×") + " " + question.second + " = ?" : "Get ready!", 640, 78);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '900 13px "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText((state?.answeredCount || 0) + " / " + (state?.questionCount || 15) + " soalan", 640, 101);

  const progress = clamp(animation.zombieDistance / 100, 0, 1);
  fillRoundRect(ctx, 34, 292, 150, 18, 9, "rgba(37,53,82,.26)");
  fillRoundRect(ctx, 34, 292, 150 * progress, 18, 9, COLORS.red);
  ctx.textAlign = "center";
  ctx.fillStyle = "#743348";
  ctx.font = '1000 12px "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText("BRAIN ALERT", 109, 280);

  const zombieX = animation.zombieX;
  const hpWidth = 134;
  const hpX = clamp(zombieX - hpWidth / 2, 220, 1054);
  fillRoundRect(ctx, hpX, 172, hpWidth, 16, 8, "rgba(37,53,82,.38)");
  fillRoundRect(ctx, hpX, 172, hpWidth * (animation.zombieHp / 3), 16, 8, COLORS.orange);
  ctx.fillStyle = COLORS.inkSoft;
  ctx.font = '1000 12px "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText("ZOMBIE HP " + animation.zombieHp + "/3", hpX + hpWidth / 2, 160);

  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(32,37,56,.62)";
  ctx.font = '800 12px "Nunito", "Trebuchet MS", sans-serif';
  ctx.fillText("CANON MAGIK", CANNON_X - 55, CANNON_GROUND + 63);
  ctx.textAlign = "right";
  ctx.fillText("JANGAN BIAR DIA SAMPAI!", WIDTH - 30, HEIGHT - 24);
}

function addParticles(animation, x, y, count, palette, { speed = 110, gravity = 70, kind = "blob" } = {}) {
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const magnitude = speed * (0.5 + Math.random() * 0.75);
    const life = 0.36 + Math.random() * 0.42;
    animation.particles.push({
      x,
      y,
      vx: Math.cos(angle) * magnitude,
      vy: Math.sin(angle) * magnitude - speed * 0.35,
      gravity,
      life,
      maxLife: life,
      size: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      color: palette[index % palette.length],
      kind
    });
  }
}

function createAnimationState() {
  return {
    active: false,
    phase: "setup",
    sessionId: null,
    lastActionId: null,
    difficulty: "easy",
    zombieDistance: 0,
    zombieHp: 3,
    zombieX: ZOMBIE_START_X,
    walkPhase: 0,
    knockback: null,
    projectiles: [],
    particles: [],
    hitFlash: 0,
    laneFlash: 0,
    shake: 0,
    cannonRecoil: 0,
    cannonFlash: 0,
    lungeOffset: 0,
    death: null,
    brainReachedSent: false,
    lastTime: 0,
    cssWidth: WIDTH,
    cssHeight: HEIGHT,
    scaleX: 1,
    scaleY: 1,
    dpr: 1,
    reducedMotion: false
  };
}

function getZombieX(animation) {
  const baseX = lerp(ZOMBIE_START_X, ZOMBIE_DANGER_X, clamp(animation.zombieDistance / 100, 0, 1));
  return baseX + animation.lungeOffset;
}

export default function ZombieCanvas({ state, onBrainReached, onZombieDefeated, onReady }) {
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const syncStateRef = useRef(null);
  const stateRef = useRef(state);
  const brainReachedRef = useRef(onBrainReached);
  const zombieDefeatedRef = useRef(onZombieDefeated);
  const readyRef = useRef(onReady);

  stateRef.current = state;
  brainReachedRef.current = onBrainReached;
  zombieDefeatedRef.current = onZombieDefeated;
  readyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const animation = createAnimationState();
    animation.reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    animationRef.current = animation;

    const resizeCanvas = () => {
      const rect = host.getBoundingClientRect();
      const cssWidth = Math.max(1, rect.width || WIDTH);
      const cssHeight = Math.max(1, rect.height || (cssWidth * HEIGHT) / WIDTH);
      const dpr = clamp(window.devicePixelRatio || 1, 1, 3);
      animation.cssWidth = cssWidth;
      animation.cssHeight = cssHeight;
      animation.dpr = dpr;
      animation.scaleX = cssWidth / WIDTH;
      animation.scaleY = cssHeight / HEIGHT;
      canvas.width = Math.max(1, Math.round(cssWidth * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.imageSmoothingEnabled = true;
    };

    const resetSession = (sessionId) => {
      animation.sessionId = sessionId;
      animation.lastActionId = null;
      animation.zombieDistance = 0;
      animation.zombieHp = 3;
      animation.zombieX = ZOMBIE_START_X;
      animation.walkPhase = 0;
      animation.knockback = null;
      animation.projectiles = [];
      animation.particles = [];
      animation.hitFlash = 0;
      animation.laneFlash = 0;
      animation.shake = 0;
      animation.cannonRecoil = 0;
      animation.cannonFlash = 0;
      animation.lungeOffset = 0;
      animation.death = null;
      animation.brainReachedSent = false;
    };

    const triggerAction = (correct) => {
      if (!animation.active || animation.death) return;
      if (!correct) {
        animation.zombieDistance = clamp(animation.zombieDistance + 4, 0, 100);
        animation.laneFlash = 0.42;
        animation.shake = 0.34;
        animation.lungeOffset = -18;
        return;
      }

      animation.cannonRecoil = 1;
      animation.cannonFlash = 1;
      const targetX = getZombieX(animation) - 30;
      const targetY = ZOMBIE_GROUND - 132;
      const startX = CANNON_X + 125;
      const startY = CANNON_GROUND - 13;
      animation.projectiles.push({
        x: startX,
        y: startY,
        startX,
        startY,
        targetX,
        targetY,
        elapsed: 0,
        duration: animation.reducedMotion ? 230 : 345,
        trail: [],
        resolved: false
      });
    };

    const syncState = (nextState) => {
      const nextSessionId = nextState?.sessionId || null;
      if (animation.sessionId !== nextSessionId) resetSession(nextSessionId);
      animation.active = nextState?.phase === "playing";
      animation.phase = nextState?.phase || "setup";
      animation.difficulty = nextState?.difficulty || "easy";
      animation.state = nextState;

      const action = nextState?.action;
      if (action?.id && action.id !== animation.lastActionId) {
        animation.lastActionId = action.id;
        triggerAction(Boolean(action.correct));
      }
    };
    syncStateRef.current = syncState;
    syncState(stateRef.current);

    const resolveProjectile = (projectile) => {
      if (projectile.resolved) return;
      projectile.resolved = true;
      animation.zombieHp = Math.max(0, animation.zombieHp - 1);
      animation.knockback = { elapsed: 0, duration: 550, distance: 9, applied: 0 };
      animation.hitFlash = 0.72;
      addParticles(animation, projectile.targetX, projectile.targetY, 14, [COLORS.slime, COLORS.slimeDark, COLORS.white], { speed: 126, gravity: 90 });
      addParticles(animation, projectile.targetX, projectile.targetY, 8, [COLORS.gold, COLORS.orange, COLORS.white], { speed: 170, gravity: 30, kind: "spark" });
      if (animation.zombieHp <= 0) {
        animation.death = { elapsed: 0, duration: animation.reducedMotion ? 420 : 760 };
        addParticles(animation, projectile.targetX, projectile.targetY, 24, [COLORS.slime, COLORS.pink, COLORS.gold, COLORS.white], { speed: 180, gravity: 120 });
      }
    };

    const updateAnimation = (deltaMs) => {
      const delta = Math.min(deltaMs, MAX_DELTA_MS);
      const difficultySpeed = DIFFICULTY_INFO[animation.difficulty]?.speed || DIFFICULTY_INFO.easy.speed;
      animation.cannonRecoil = Math.max(0, animation.cannonRecoil - delta / 180);
      animation.cannonFlash = Math.max(0, animation.cannonFlash - delta / 130);
      animation.hitFlash = Math.max(0, animation.hitFlash - delta / 520);
      animation.laneFlash = Math.max(0, animation.laneFlash - delta / 430);
      animation.shake = Math.max(0, animation.shake - delta / 360);
      animation.lungeOffset = lerp(animation.lungeOffset, 0, clamp(delta / 170, 0, 1));
      animation.walkPhase += delta * (0.007 * (1 + difficultySpeed * 9));

      if (animation.active && !animation.death) {
        if (animation.knockback) {
          const recoil = animation.knockback;
          recoil.elapsed += delta;
          const eased = easeOutCubic(clamp(recoil.elapsed / recoil.duration, 0, 1));
          animation.zombieDistance = Math.max(0, animation.zombieDistance - (eased - recoil.applied) * recoil.distance);
          recoil.applied = eased;
          if (eased >= 1) animation.knockback = null;
        } else {
          animation.zombieDistance = clamp(animation.zombieDistance + difficultySpeed * delta * PACE_FACTOR, 0, 100);
        }
        // An already-fired shot has a chance to land before declaring game over.
        if (animation.zombieDistance >= 100 && !animation.projectiles.length && !animation.brainReachedSent) {
          animation.brainReachedSent = true;
          brainReachedRef.current?.();
        }
      }

      animation.projectiles.forEach((projectile) => {
        if (projectile.resolved) return;
        projectile.elapsed += delta;
        const progress = clamp(projectile.elapsed / projectile.duration, 0, 1);
        projectile.x = lerp(projectile.startX, projectile.targetX, easeOutCubic(progress));
        projectile.y = lerp(projectile.startY, projectile.targetY, progress) - Math.sin(progress * Math.PI) * 42;
        projectile.trail.unshift({ x: projectile.x, y: projectile.y });
        if (projectile.trail.length > 7) projectile.trail.pop();
        if (progress >= 1) resolveProjectile(projectile);
      });
      animation.projectiles = animation.projectiles.filter((projectile) => !projectile.resolved);

      animation.particles.forEach((particle) => {
        particle.life -= delta / 1000;
        particle.x += particle.vx * delta / 1000;
        particle.y += particle.vy * delta / 1000;
        particle.vy += particle.gravity * delta / 1000;
        particle.rotation = (particle.rotation || 0) + delta * 0.004;
      });
      animation.particles = animation.particles.filter((particle) => particle.life > 0);

      if (animation.death) {
        animation.death.elapsed += delta;
        if (animation.death.elapsed >= animation.death.duration) {
          animation.death = null;
          animation.zombieHp = 3;
          animation.zombieDistance = 0;
          animation.knockback = null;
          animation.brainReachedSent = false;
          zombieDefeatedRef.current?.();
        }
      }

      animation.zombieX = getZombieX(animation);
    };

    const render = (time) => {
      const scaleX = animation.scaleX;
      const scaleY = animation.scaleY;
      ctx.setTransform(scaleX * animation.dpr, 0, 0, scaleY * animation.dpr, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const shakeAmount = animation.shake > 0 ? animation.shake * 7 : 0;
      const shakeX = Math.sin(time * 0.09) * shakeAmount;
      const shakeY = Math.cos(time * 0.12) * shakeAmount * 0.55;
      ctx.save();
      ctx.translate(shakeX, shakeY);
      drawBackground(ctx, time);
      drawBrain(ctx, BRAIN_X, BRAIN_GROUND);
      drawCannon(ctx, CANNON_X, CANNON_GROUND, animation.cannonRecoil, animation.cannonFlash);
      animation.projectiles.forEach((projectile) => drawProjectile(ctx, projectile));
      drawZombieShadow(ctx, animation.zombieX, ZOMBIE_GROUND, animation.death ? 1 - animation.death.elapsed / animation.death.duration : 1);
      const deathProgress = animation.death ? clamp(animation.death.elapsed / animation.death.duration, 0, 1) : 0;
      drawZombie(ctx, animation.zombieX, ZOMBIE_GROUND, animation.walkPhase, { deathProgress, alpha: 1 - deathProgress });
      drawHitFlash(ctx, animation.zombieX, ZOMBIE_GROUND, animation.walkPhase, animation.hitFlash);
      drawParticles(ctx, animation.particles);
      if (animation.laneFlash > 0) {
        ctx.save();
        ctx.globalAlpha = animation.laneFlash * 0.55;
        fillRoundRect(ctx, TRACK_LEFT, TRACK_TOP, TRACK_RIGHT - TRACK_LEFT, TRACK_BOTTOM - TRACK_TOP, 142, COLORS.red);
        ctx.restore();
      }
      drawHud(ctx, animation.state, animation);
      ctx.restore();
    };

    resizeCanvas();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resizeCanvas) : null;
    observer?.observe(host);
    window.addEventListener("resize", resizeCanvas);

    let frameId = 0;
    const frame = (time) => {
      if (!animation.lastTime) animation.lastTime = time;
      updateAnimation(time - animation.lastTime);
      animation.lastTime = time;
      render(time);
      frameId = window.requestAnimationFrame(frame);
    };
    frameId = window.requestAnimationFrame(frame);
    const readyTimer = window.setTimeout(() => readyRef.current?.(), 0);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(readyTimer);
      observer?.disconnect();
      window.removeEventListener("resize", resizeCanvas);
      syncStateRef.current = null;
      animationRef.current = null;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
  }, []);

  useEffect(() => {
    stateRef.current = state;
    syncStateRef.current?.(state);
  }, [state]);

  return (
    <div className="mz-canvas" ref={hostRef} aria-label="Zombie Defense maths game">
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
