// Coordinates follow a shared 100 × 100 drawing space. Each entry is one
// complete acceptable form; an array of paths may contain separate strokes.
// Short E/O forms are allowed alone only for this isolated-symbol workbench.
// In words they must attach to another letter; doubles use short then full.
export const alphabet = {
  A: [['M20 25 L80 25 L50 78 Z']],
  B: [['M28 20 L28 80', 'M20 20 C98 12 98 88 20 80']],
  C: [['M19 19 L24 29 C65 -6 98 45 72 70 C57 84 32 79 27 66']],
  D: [['M20 28 C12 7 37 9 31 35 L28 66 L78 66', 'M59 18 L59 83']],
  E: [['M15 50 L85 50'], ['M24 25 L77 25 L50 79 Z', 'M15 46 L85 46']],
  F: [['M35 84 L35 19', 'M24 20 C79 2 85 60 36 51']],
  G: [['M76 18 L76 27 C16 -2 7 95 74 76']],
  H: [['M20 78 L50 23 L80 78 Z']],
  I: [['M80 50 C80 12 20 12 20 50 C20 88 80 88 80 50']],
  J: [['M58 20 L58 70 C58 90 34 84 34 72', 'M51 20 L65 20']],
  K: [['M18 80 L50 22 L82 80', 'M12 80 L25 80', 'M75 80 L88 80']],
  L: [['M20 36 L20 28 L79 28 L79 83']],
  M: [['M18 80 L18 20 L50 64 L82 20 L82 80', 'M12 20 L24 20', 'M76 20 L88 20']],
  N: [['M23 20 L23 76 L77 24 L77 80']],
  O: [['M50 15 L50 85'], ['M80 50 C80 10 20 10 20 50 C20 90 80 90 80 50', 'M50 20 L50 80']],
  P: [['M30 16 L30 80', 'M30 48 C84 29 89 88 30 80', 'M23 16 L37 16']],
  Q: [['M68 33 C68 8 32 8 32 33 C32 58 68 58 68 33', 'M50 52 L50 86', 'M37 72 L63 72']],
  R: [['M16 77 C38 83 30 40 27 24 L75 24 C72 40 65 83 86 77']],
  S: [['M30 15 L30 23 C109 23 21 52 30 73 C33 83 59 82 74 81']],
  T: [['M20 25 L80 25', 'M50 25 L50 83', 'M20 20 L20 30', 'M80 20 L80 30']],
  U: [['M21 35 C50 -7 99 31 80 66 C63 96 32 83 20 65 C66 91 79 14 21 35']],
  V: [['M22 23 L50 79 L78 23', 'M16 23 L28 23', 'M72 23 L84 23']],
  W: [['M80 49 C80 10 20 10 20 49 C20 88 80 88 80 49', 'M59 63 L82 81']],
  X: [['M13 30 L19 34 C41 0 64 40 76 80', 'M69 80 L83 80']],
  Y: [['M79 30 L79 23 L25 23 L47 50 L25 79 L79 79 L79 72']],
  Z: [['M23 23 L79 23 L23 79 L79 79', 'M23 18 L23 28', 'M79 74 L79 84']]
};

export function symbolSvg(paths) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'symbol');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    for (const [key, value] of Object.entries({ d, fill: 'none', stroke: 'currentColor', 'stroke-width': '4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })) path.setAttribute(key, value);
    svg.append(path);
  }
  return svg;
}

export function makeTemplates() {
  const templates = [];
  for (const [letter, variants] of Object.entries(alphabet)) {
    for (const paths of variants) {
      const svg = symbolSvg(paths);
      // Use uniform arc-length samples so drawing speed never affects shape.
      const points = [...svg.children].map(path => {
        const length = path.getTotalLength();
        const count = Math.max(2, Math.ceil(length / 2));
        return Array.from({ length: count }, (_, i) => {
          const p = path.getPointAtLength(i * length / (count - 1));
          return { x: p.x, y: p.y };
        });
      });
      templates.push({ letter, strokes: points });
    }
  }
  return templates;
}
