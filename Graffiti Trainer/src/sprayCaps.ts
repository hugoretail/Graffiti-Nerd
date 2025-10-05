//spray cap configuration definitions
export type SprayCap = {
  id: string;
  label: string;
  //radius range in pixels for base spray radius
  minRadius: number;
  maxRadius: number;
  //density factor base dots per pixel moved
  density: number;
  //alpha fade control (multiplies dynamic fade)
  alphaFactor: number;
  //edge softness exponent (higher = softer)
  falloffPow: number;
  //overspray halo multiplier (0 = none)
  halo: number;
  //drip probability per frame when velocity below threshold
  dripChance: number;
  //max drips per emission burst
  maxDrips: number;
};

//skinny: tighter radius, lower density, sharper edge
export const skinnyCap: SprayCap = {
  id: 'skinny',
  label: 'Skinny Cap',
  minRadius: 4,
  maxRadius: 14,
  density: 26,
  alphaFactor: 0.9,
  falloffPow: 1.2,
  halo: 0.15,
  dripChance: 0.0,
  maxDrips: 0,
};

//medium: balanced
export const mediumCap: SprayCap = {
  id: 'medium',
  label: 'Medium Cap',
  minRadius: 8,
  maxRadius: 22,
  density: 34,
  alphaFactor: 1.0,
  falloffPow: 1.5,
  halo: 0.25,
  dripChance: 0.02,
  maxDrips: 1,
};

//fat: big radius, lots of paint, drips
export const fatCap: SprayCap = {
  id: 'fat',
  label: 'Fat Cap',
  minRadius: 14,
  maxRadius: 40,
  density: 46,
  alphaFactor: 1.1,
  falloffPow: 1.9,
  halo: 0.4,
  dripChance: 0.08,
  maxDrips: 3,
};

export const caps: SprayCap[] = [skinnyCap, mediumCap, fatCap];
