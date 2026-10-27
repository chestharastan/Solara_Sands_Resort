/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GLSL for the scene.
 *
 * KEY PERFORMANCE IDEA – the sky *and* the sea are drawn by ONE full-screen
 * fragment shader (SKY_FRAG). Instead of rendering a huge, tessellated water
 * mesh, each pixel casts a ray from the camera and either hits the sky or the
 * analytic plane y = 0 (the sea). That gives us:
 *   • infinite, seamless water to the horizon at zero vertex cost,
 *   • physically-motivated Fresnel reflection of the *same* sky colours,
 *   • a sun glitter path, drifting clouds, stars and a moon,
 * for the price of a single draw call. Real 3D geometry (island, villa, palms,
 * boat) is then depth-tested on top of it.
 *
 * `#define OCTAVES` is injected from JS so weaker devices run fewer noise octaves.
 */

export const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Full-screen triangle pair pinned to the far plane – ignores camera matrices.
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`;

export const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform mat4 uCamWorld;   // camera.matrixWorld
  uniform mat4 uProjInv;    // camera.projectionMatrixInverse
  uniform vec3 uCamPos;
  uniform float uTime;

  uniform vec3 uSunDir;
  uniform vec3 uMoonDir;
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uGlow;
  uniform vec3 uSunColor;
  uniform vec3 uSeaDeep;
  uniform vec3 uSeaShallow;
  uniform float uStars;     // 0‥1 night amount
  uniform float uSunAmt;    // 0‥1 how much the sun lights the sky (fades through twilight)
  uniform float uCloud;     // 0‥1 coverage
  uniform float uFog;       // sea → horizon fog density

  #ifndef OCTAVES
  #define OCTAVES 4
  #endif

  float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float hash31(vec3 p) { p = fract(p * vec3(443.897, 441.423, 437.195)); p += dot(p, p.yzx + 19.19); return fract((p.x + p.y) * p.z); }

  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i), b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0)), d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < OCTAVES; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
    return s;
  }

  // Sky gradient + sun/moon glow. Cheap – also used for the sea's reflection.
  vec3 skyBase(vec3 rd) {
    float h = max(rd.y, 0.0);
    vec3 c = mix(uZenith, uHorizon, pow(1.0 - h, 4.0));
    float sd = max(dot(rd, uSunDir), 0.0);
    c += uGlow * (pow(sd, 6.0) * 0.25 + pow(sd, 40.0) * 0.6) * uSunAmt;
    float md = max(dot(rd, uMoonDir), 0.0);
    c += vec3(0.55, 0.65, 0.9) * pow(md, 24.0) * 0.14 * uStars;
    return c;
  }

  vec3 skyFull(vec3 rd) {
    vec3 c = skyBase(rd);

    // Stars: hash a 3D grid on the unit sphere, light the cell's single star.
    if (uStars > 0.01) {
      vec3 sp = rd * 140.0;
      vec3 ci = floor(sp);
      vec3 cf = fract(sp);
      float r = hash31(ci);
      vec3 off = vec3(hash31(ci + 7.1), hash31(ci + 13.7), hash31(ci + 19.3));
      float st = smoothstep(0.17, 0.0, length(cf - off)) * step(0.965, r);
      st *= 0.6 + 0.4 * sin(uTime * 1.7 + r * 60.0);
      c += vec3(0.9, 0.95, 1.0) * st * uStars * smoothstep(0.0, 0.25, rd.y);
    }

    // Sun disc + moon disc.
    c += uSunColor * smoothstep(0.99935, 0.99975, dot(rd, uSunDir)) * 4.0 * uSunAmt;
    c = mix(c, vec3(0.9, 0.93, 1.0), smoothstep(0.9992, 0.9996, dot(rd, uMoonDir)) * uStars);

    // Clouds: fbm sampled on a virtual plane overhead (perspective-correct, drifting).
    vec2 cp = rd.xz / (rd.y + 0.18) * 1.1 + vec2(uTime * 0.012, uTime * 0.004);
    float cov = smoothstep(0.5 - uCloud * 0.18, 0.86, fbm(cp * 1.3)) * smoothstep(0.0, 0.22, rd.y);
    float sd2 = max(dot(rd, uSunDir), 0.0);
    vec3 cc = mix(uZenith, uHorizon, 0.6) * 1.15 + uGlow * (0.3 + pow(sd2, 4.0) * 1.2) * uSunAmt;
    c = mix(c, cc, cov * 0.85);
    return c;
  }

  // Analytic wave slope (sum of directional sines + a little noise) → surface normal.
  vec3 waveNormal(vec2 p, float dist) {
    vec2 g = vec2(0.0);
    vec2 d1 = normalize(vec2(1.0, 0.4));  g += d1 * cos(dot(p, d1) * 0.35 + uTime * 0.8) * 0.35 * 0.35;
    vec2 d2 = normalize(vec2(-0.6, 1.0)); g += d2 * cos(dot(p, d2) * 0.8 + uTime * 1.1) * 0.8 * 0.18;
    vec2 d3 = normalize(vec2(0.3, -1.0)); g += d3 * cos(dot(p, d3) * 1.7 + uTime * 1.5) * 1.7 * 0.07;
    #if OCTAVES >= 3
      float e = 0.05;
      float n0 = vnoise(p * 2.3 + uTime * 0.15);
      float nx = vnoise((p + vec2(e, 0.0)) * 2.3 + uTime * 0.15);
      float nz = vnoise((p + vec2(0.0, e)) * 2.3 + uTime * 0.15);
      g += vec2(nx - n0, nz - n0) / e * 0.05;
    #endif
    g *= 1.0 / (1.0 + dist * 0.04); // flatten with distance → no shimmering at the horizon
    return normalize(vec3(-g.x, 1.0, -g.y));
  }

  void main() {
    // Rebuild this pixel's world-space ray from the camera matrices.
    vec4 vp = uProjInv * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
    vec3 rd = normalize((uCamWorld * vec4(normalize(vp.xyz / vp.w), 0.0)).xyz);
    vec3 col;

    if (rd.y >= 0.0) {
      col = skyFull(rd);
    } else {
      float t = -uCamPos.y / rd.y;               // distance to the sea plane
      vec3 p = uCamPos + rd * t;
      vec3 n = waveNormal(p.xz, t);
      vec3 rf = reflect(rd, n);
      rf.y = abs(rf.y);
      float fres = 0.03 + 0.97 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);

      vec3 refl = skyBase(rf);
      float sd = max(dot(rf, uSunDir), 0.0);
      refl += uSunColor * (pow(sd, 380.0) * 9.0 + pow(sd, 36.0) * 0.45) * uSunAmt; // glitter path

      vec3 body = mix(uSeaDeep, uSeaShallow, exp(-t * 0.028) * 0.75 + 0.1 * (n.x * 0.5 + 0.5));
      col = mix(body, refl, fres);

      // Atmospheric perspective: the far sea melts into the horizon band.
      vec3 hz = skyBase(normalize(vec3(rd.x, 0.001, rd.z)));
      col = mix(col, hz, 1.0 - exp(-t * uFog));
    }

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* -------------------------------------------------------------------------- */
/*  Shallow lagoon + animated foam ring around the island                      */
/* -------------------------------------------------------------------------- */

export const LAGOON_VERT = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const LAGOON_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vP;
  uniform float uR;
  uniform float uTime;
  uniform vec3 uShallow;
  uniform vec3 uFoam;
  uniform float uLight;   // overall brightness (night dims it)

  // Must match coastRadius() in kit.ts so the foam hugs the real shoreline.
  float coast(float a) {
    return uR * (1.0 + 0.08 * sin(3.0 * a + 1.0) + 0.05 * sin(5.0 * a + 2.0) + 0.03 * sin(9.0 * a));
  }

  void main() {
    float r = length(vP);
    float a = atan(vP.y, vP.x);
    float d = r - coast(a);                // >0 outside the beach
    if (d < -0.04) discard;

    float lag = 1.0 - smoothstep(0.0, uR * 0.5, d);
    float wave = sin(d * 5.0 - uTime * 0.8 + sin(a * 7.0 + uTime * 0.2) * 1.5);
    float foam = smoothstep(0.55, 1.0, wave) * (1.0 - smoothstep(0.0, 1.3, d)) * 0.55;
    float edge = smoothstep(0.0, 0.18, d) * (1.0 - smoothstep(0.18, 0.55, d)) * 0.5;

    vec3 col = uShallow * uLight + uFoam * (foam + edge) * uLight;
    float alpha = clamp(lag * 0.62 + foam + edge, 0.0, 0.9);
    gl_FragColor = vec4(col, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* -------------------------------------------------------------------------- */
/*  Pool water                                                                 */
/* -------------------------------------------------------------------------- */

export const POOL_VERT = /* glsl */ `
  varying vec3 vL;
  void main() {
    vL = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const POOL_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vL;
  uniform float uTime;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uGlow;   // pool lights at night
  void main() {
    float l = sin((vL.x * 4.0 + sin(vL.z * 3.0 + uTime)) * 3.0 + uTime * 1.5) * 0.5 + 0.5;
    float l2 = sin((vL.z * 5.0 + sin(vL.x * 2.0 - uTime * 0.7)) * 3.0 - uTime) * 0.5 + 0.5;
    vec3 c = mix(uA, uB, 0.25 + 0.35 * l + 0.25 * l2);
    c += uB * uGlow * 0.9;
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

/* -------------------------------------------------------------------------- */
/*  Floating light particles (sand glints by day, fireflies by night)          */
/* -------------------------------------------------------------------------- */

export const PARTICLE_VERT = /* glsl */ `
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uPR;
  varying float vA;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.15 + aSeed * 30.0) * 1.2;
    p.y += sin(uTime * 0.20 + aSeed * 17.0) * 0.8;
    p.z += cos(uTime * 0.12 + aSeed * 11.0) * 1.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * uPR * (0.4 + aSeed) * (30.0 / -mv.z), 1.0, 26.0 * uPR);
    vA = 0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 40.0);
  }
`;

export const PARTICLE_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uAlpha;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a;
    gl_FragColor = vec4(uColor, a * vA * uAlpha);
    #include <colorspace_fragment>
  }
`;

/* -------------------------------------------------------------------------- */
/*  Diorama water "puck" (island explorer)                                     */
/* -------------------------------------------------------------------------- */

export const PUCK_VERT = /* glsl */ `
  varying vec3 vL;
  void main() {
    vL = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const PUCK_FRAG = /* glsl */ `
  precision highp float;
  varying vec3 vL;
  uniform float uTime;
  uniform float uR;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  void main() {
    float r = length(vL.xz);
    float k = smoothstep(uR * 0.35, uR, r);
    vec3 c = mix(uShallow, uDeep, k);
    float w = sin(r * 1.6 - uTime * 0.9 + sin(atan(vL.z, vL.x) * 5.0) * 0.6) * 0.5 + 0.5;
    c += vec3(0.08, 0.2, 0.22) * w * (1.0 - k) * 0.6;
    float rim = smoothstep(uR * 0.96, uR, r);
    c = mix(c, vec3(0.55, 0.9, 0.9), rim * 0.55);
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
