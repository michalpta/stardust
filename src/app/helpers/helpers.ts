export function cantorPairing(x: number, y: number): number {
  return 0.5 * (x + y) * (x + y + 1) + y;
}

export class SpaceProceduralGenerator {
  constructor(public seed: number) { }
  random(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
}
