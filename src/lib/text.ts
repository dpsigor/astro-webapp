import { signGlyphUnicode } from './sweph';

export function formatTableAngle(angle: number) {
  let deg = Math.floor(angle);
  const sign = signGlyphUnicode[Math.floor(deg / 30)];
  const min = Math.floor((angle - deg) * 60);
  const sec = Math.floor(((angle - deg) * 60 - min) * 60);
  deg = deg % 30;
  return `${sign} ${deg}° ${min}' ${sec}"`;
}
