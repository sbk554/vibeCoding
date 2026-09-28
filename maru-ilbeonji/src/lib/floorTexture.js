import * as THREE from 'three';
import { shade, isLight, seeded } from './color.js';

/**
 * 외부 이미지 없이 Canvas로 마루 텍스처를 절차적으로 생성합니다.
 * type: 'wood' | 'herringbone' | 'stone'
 */
const cache = new Map();
const SIZE = 1024;

function drawGrain(ctx, x, y, w, h, base, rand, vertical = false) {
  const lines = 7;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  for (let i = 0; i < lines; i++) {
    ctx.strokeStyle = shade(base, (rand() - 0.5) * 0.18);
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1 + rand() * 1.5;
    ctx.beginPath();
    if (vertical) {
      const gx = x + rand() * w;
      ctx.moveTo(gx, y);
      ctx.bezierCurveTo(gx + (rand() - 0.5) * 8, y + h * 0.33, gx + (rand() - 0.5) * 8, y + h * 0.66, gx, y + h);
    } else {
      const gy = y + rand() * h;
      ctx.moveTo(x, gy);
      ctx.bezierCurveTo(x + w * 0.33, gy + (rand() - 0.5) * 8, x + w * 0.66, gy + (rand() - 0.5) * 8, x + w, gy);
    }
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawWood(ctx, color, rand) {
  const rows = 8;
  const plankH = SIZE / rows;
  const plankW = SIZE / 2;
  const seam = isLight(color) ? shade(color, -0.22) : shade(color, -0.35);
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2 === 0 ? 0 : plankW * 0.5) + (r % 3) * 60;
    for (let c = -1; c < 3; c++) {
      const x = c * plankW + offset;
      const y = r * plankH;
      const tone = shade(color, (rand() - 0.5) * 0.14);
      ctx.fillStyle = tone;
      ctx.fillRect(x, y, plankW, plankH);
      drawGrain(ctx, x, y, plankW, plankH, tone, rand);
      ctx.strokeStyle = seam;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, plankW, plankH);
    }
  }
}

function drawHerringbone(ctx, color, rand) {
  // 브릭 2a x a, 격자 (a,a)/(2a,-2a) → 4a x 4a 타일이 캔버스에 정확히 반복되어 이음새 없이 타일링
  const a = 64;
  const T = a * 4;
  const seam = shade(color, isLight(color) ? -0.2 : -0.4);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const brick = (x, y, w, h, vertical) => {
    const tone = shade(color, (rand() - 0.5) * 0.12);
    ctx.fillStyle = tone;
    ctx.fillRect(x, y, w, h);
    drawGrain(ctx, x, y, w, h, tone, rand, vertical);
    ctx.strokeStyle = seam;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
  };
  for (let ty = -T; ty < SIZE + T; ty += T) {
    for (let tx = -T; tx < SIZE + T; tx += T) {
      for (let m = 0; m < 4; m++) {
        brick(tx + a * m, ty + a * m, a * 2, a, false);
        brick(tx + a * m, ty + a * m + a, a, a * 2, true);
      }
    }
  }
}

function drawStone(ctx, color, rand) {
  const n = 4;
  const t = SIZE / n;
  const grout = shade(color, -0.3);
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, SIZE, SIZE);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const tone = shade(color, (rand() - 0.5) * 0.12);
      ctx.fillStyle = tone;
      ctx.fillRect(c * t + 3, r * t + 3, t - 6, t - 6);
      // 대리석 결 / 반점
      for (let k = 0; k < 40; k++) {
        ctx.fillStyle = shade(tone, (rand() - 0.5) * 0.25);
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(c * t + 3 + rand() * (t - 6), r * t + 3 + rand() * (t - 6), rand() * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = shade(tone, 0.35);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(c * t + rand() * t, r * t);
      ctx.quadraticCurveTo(c * t + rand() * t, r * t + t / 2, c * t + rand() * t, r * t + t);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

export function getFloorTexture(material) {
  const key = `${material.id}-${material.color}-${material.type}`;
  if (cache.has(key)) return cache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const rand = seeded(material.id.split('').reduce((a, ch) => a + ch.charCodeAt(0), 7) * 97);

  if (material.type === 'herringbone') drawHerringbone(ctx, material.color, rand);
  else if (material.type === 'stone') drawStone(ctx, material.color, rand);
  else drawWood(ctx, material.color, rand);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}
