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
  //extra core density multiplier (used to thicken center mass)
  coreDensityBoost: number;
  //extra core alpha boost applied after velocity mapping
  coreAlphaBoost: number;
  //halo attenuation factor (1 = unchanged, <1 reduces halo probability)
  haloAttenuation: number;
  //factor applied to minRadius for extreme high-speed thinning
  extremeRadiusFactor?: number;
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
  coreDensityBoost: 0.2,
  coreAlphaBoost: 0.05,
  haloAttenuation: 1,
  extremeRadiusFactor: 0.1,
};

//medium: balanced
export const mediumCap: SprayCap = {
  id: 'medium',
  label: 'Medium Cap',
  minRadius: 8,
  maxRadius: 22,
  density: 40, //slightly higher base
  alphaFactor: 1.05, //small lift
  falloffPow: 1.4, //a bit tighter core
  halo: 0.2, //less halo for less dusty feel
  dripChance: 0.02,
  maxDrips: 1,
  coreDensityBoost: 0.55,
  coreAlphaBoost: 0.12,
  haloAttenuation: 0.85,
  extremeRadiusFactor: 0.62,
};

//fat: big radius, lots of paint, drips
export const fatCap: SprayCap = {
  id: 'fat',
  label: 'Fat Cap',
  minRadius: 14,
  maxRadius: 40,
  density: 54, //more particles baseline
  alphaFactor: 1.15, //stronger opacity
  falloffPow: 1.7, //slightly tighter distribution
  halo: 0.32, //reduced fuzziness
  dripChance: 0.08,
  maxDrips: 3,
  coreDensityBoost: 0.9,
  coreAlphaBoost: 0.18,
  haloAttenuation: 0.7,
  extremeRadiusFactor: 0.45, //allow fat cap to become very thin at extreme speed
};

export const caps: SprayCap[] = [skinnyCap, mediumCap, fatCap];
