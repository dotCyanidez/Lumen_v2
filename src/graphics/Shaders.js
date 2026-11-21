import { Filter, GlProgram, UniformGroup, defaultFilterVert } from 'pixi.js';

const BACKDROP_FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uCameraOffset;
uniform vec2 uPlayerPos;
uniform float uPlayerGlow;
uniform vec4 uWave0;
uniform vec4 uWave1;
uniform vec4 uWave2;
uniform vec4 uWave3;
uniform vec3 uColorDeep;
uniform vec3 uColorMid;
uniform vec3 uColorGlow;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = rot * p * 2.03 + vec2(1.7, 9.2);
    amp *= 0.5;
  }
  return value;
}

float causticRay(vec2 uv, float slant, float scale, float speed, float time) {
  float x = uv.x * scale + uv.y * slant;
  float wave1 = sin(x * 3.1 + time * speed + sin(uv.y * 2.2 - time * 0.45));
  float wave2 = cos(x * 5.7 - time * (speed * 0.72) + uv.y * 1.4);
  float beam = smoothstep(0.15, 0.95, 0.5 + 0.32 * wave1 + 0.22 * wave2);
  float verticalFade = pow(max(0.0, 1.0 - uv.y * 0.92), 1.45);
  return beam * verticalFade;
}

vec3 evalMistWave(vec2 uv, vec2 res, float aspect, vec3 glowCol, vec4 wave) {
  if (wave.z <= 0.0 || wave.z >= 1.25 || wave.w <= 0.001) return vec3(0.0);
  vec2 shockUV = wave.xy / max(res, vec2(1.0));
  float dShock = length((uv - shockUV) * vec2(aspect, 1.0));
  float ringR = wave.z * 0.72;
  float ringBand = exp(-pow((dShock - ringR) * 13.0, 2.0)) * (1.0 - wave.z / 1.25);
  return mix(glowCol, vec3(1.0, 0.92, 0.65), 0.45) * ringBand * 0.10 * wave.w;
}

void main() {
  vec2 uv = (vTextureCoord * uInputSize.xy) / max(uOutputFrame.zw, vec2(1.0));
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);

  vec2 camShift = uCameraOffset * 0.0012;
  vec2 mistUV = vec2(p.x * 2.1 + uTime * 0.028 + camShift.x, p.y * 2.1 - uTime * 0.018 + camShift.y);
  float n1 = fbm(mistUV);
  float n2 = fbm(mistUV * 1.85 - vec2(uTime * 0.04, n1 * 0.6));
  float nebula = smoothstep(0.28, 0.88, n1 * 0.62 + n2 * 0.38);

  float depthT = smoothstep(0.0, 1.0, uv.y + (n1 - 0.5) * 0.12);
  vec3 col = mix(uColorMid, uColorDeep, depthT);

  col += uColorGlow * nebula * (0.08 + 0.08 * (1.0 - uv.y));

  float rayA = causticRay(uv + camShift * 0.25, -0.34, 2.2, 0.35, uTime);
  float rayB = causticRay(uv + camShift * 0.25 + vec2(0.18, 0.0), -0.26, 3.3, 0.24, uTime + 4.1);
  float rays = rayA * 0.55 + rayB * 0.45;
  col += mix(uColorGlow, vec3(0.75, 0.98, 1.0), 0.32) * rays * 0.09;

  vec2 playerUV = uPlayerPos / max(uResolution, vec2(1.0));
  vec2 dPlayer = (uv - playerUV) * vec2(aspect, 1.0);
  float distPlayer = length(dPlayer);
  float lightPool = exp(-distPlayer * distPlayer * (12.0 - uPlayerGlow * 2.2));
  col += uColorGlow * lightPool * (0.06 + uPlayerGlow * 0.06);

  col += evalMistWave(uv, uResolution, aspect, uColorGlow, uWave0);
  col += evalMistWave(uv, uResolution, aspect, uColorGlow, uWave1);
  col += evalMistWave(uv, uResolution, aspect, uColorGlow, uWave2);
  col += evalMistWave(uv, uResolution, aspect, uColorGlow, uWave3);

  float edgeDist = length(uv - vec2(0.5));
  float vig = smoothstep(0.88, 0.28, edgeDist);
  col *= mix(0.62, 1.0, vig);

  float dither = (hash21(gl_FragCoord.xy + fract(uTime) * 17.0) - 0.5) / 255.0;
  col = max(vec3(0.0), col + dither);

  finalColor = vec4(col, 1.0);
}
`;

const ATMOSPHERE_FRAGMENT = /* glsl */ `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec4 uOutputFrame;

uniform vec2 uResolution;
uniform vec4 uWave0;
uniform vec4 uWave1;
uniform vec4 uWave2;
uniform vec4 uWave3;
uniform float uDamageFlash;
uniform float uDangerVignette;
uniform vec4 uEdgeGlow;
uniform float uBloomScale;

vec3 accumWaveOffset(vec2 uv, vec2 res, float aspect, vec4 wave) {
  if (wave.w <= 0.001 || wave.z <= 0.0 || wave.z >= 1.0) return vec3(0.0);
  vec2 centerUV = wave.xy / max(res, vec2(1.0));
  vec2 delta = (uv - centerUV) * vec2(aspect, 1.0);
  float dist = max(length(delta), 0.0001);
  float ringR = wave.z * 0.68;
  float waveAmp = exp(-pow((dist - ringR) * 20.0, 2.0)) * (1.0 - wave.z);
  vec2 dir = delta / dist;
  dir.x /= aspect;
  return vec3(dir * waveAmp * wave.w * 0.019, waveAmp * wave.w * 0.0036);
}

vec3 sampleBloomTap(vec2 coord, vec2 offset) {
  vec2 tapUV = clamp(coord + offset, uInputClamp.xy, uInputClamp.zw);
  vec3 tapCol = texture(uTexture, tapUV).rgb;
  float luma = max(tapCol.r, max(tapCol.g, tapCol.b));
  float knee = max(0.0, luma - 0.72) / max(luma, 0.001);
  return tapCol * knee;
}

void main() {
  vec2 uv = (vTextureCoord * uInputSize.xy) / max(uOutputFrame.zw, vec2(1.0));
  float aspect = uResolution.x / max(uResolution.y, 1.0);

  vec3 wOff = accumWaveOffset(uv, uResolution, aspect, uWave0)
    + accumWaveOffset(uv, uResolution, aspect, uWave1)
    + accumWaveOffset(uv, uResolution, aspect, uWave2)
    + accumWaveOffset(uv, uResolution, aspect, uWave3);

  vec2 sampleOffset = wOff.xy;
  float chroma = uDamageFlash * 0.0055 + wOff.z;
  float peakShock = max(max(uWave0.w, uWave1.w), max(uWave2.w, uWave3.w));

  vec2 texRatio = (uOutputFrame.zw * uInputSize.zw);
  vec2 offsetUV = sampleOffset * texRatio;
  vec2 chromaUV = vec2(chroma * texRatio.x, chroma * 0.35 * texRatio.y);

  vec2 baseCoord = clamp(vTextureCoord - offsetUV, uInputClamp.xy, uInputClamp.zw);
  vec4 baseCol = texture(uTexture, baseCoord);

  if (chroma > 0.0003) {
    vec2 rCoord = clamp(baseCoord + chromaUV, uInputClamp.xy, uInputClamp.zw);
    vec2 bCoord = clamp(baseCoord - chromaUV, uInputClamp.xy, uInputClamp.zw);
    baseCol.r = texture(uTexture, rCoord).r;
    baseCol.b = texture(uTexture, bCoord).b;
  }

  // Dual-ring staggered 12-tap Poisson bright-threshold bloom (controlled highlight aura)
  vec2 stepInner = uInputSize.zw * 2.4;
  vec2 stepOuter = uInputSize.zw * 5.6;
  vec3 innerSum = vec3(0.0);
  vec3 outerSum = vec3(0.0);
  for (int i = 0; i < 6; i++) {
    float a1 = float(i) * 1.04719755;
    float a2 = a1 + 0.52359877;
    innerSum += sampleBloomTap(baseCoord, vec2(cos(a1), sin(a1)) * stepInner);
    outerSum += sampleBloomTap(baseCoord, vec2(cos(a2), sin(a2)) * stepOuter);
  }
  vec3 bloom = ((innerSum * 0.1666) * 0.58 + (outerSum * 0.1666) * 0.42) * (0.17 + peakShock * 0.12) * uBloomScale;

  vec3 tint = baseCol.rgb + bloom;
  // Filmic highlight shoulder keeps the light spirit readable inside intense bursts
  vec3 over = max(vec3(0.0), tint - 0.72);
  tint = min(tint, vec3(0.72) + over / (vec3(1.0) + over * 1.65));

  // Sanctuary edge ward shimmer when skimming borders
  float leftBand = exp(-uv.x * 26.0) * uEdgeGlow.x;
  float rightBand = exp(-(1.0 - uv.x) * 26.0) * uEdgeGlow.y;
  float topBand = exp(-uv.y * 18.0) * uEdgeGlow.z;
  float botBand = exp(-(1.0 - uv.y) * 18.0) * uEdgeGlow.w;
  float edgeWard = clamp(leftBand + rightBand + topBand + botBand, 0.0, 1.0);
  tint += vec3(0.32, 0.94, 0.92) * edgeWard * 0.34;

  float edge = smoothstep(0.38, 0.92, length(uv - vec2(0.5)));
  if (uDamageFlash > 0.001) {
    tint = mix(tint, vec3(1.0, 0.24, 0.44), uDamageFlash * (0.28 + 0.35 * edge));
  }
  if (uDangerVignette > 0.001) {
    tint = mix(tint, vec3(0.45, 0.04, 0.16), edge * uDangerVignette * 0.32);
  }

  finalColor = vec4(tint, baseCol.a);
}
`;

export class AbyssBackdropFilter extends Filter {
  constructor() {
    const uniforms = new UniformGroup({
      uTime: { value: 0, type: 'f32' },
      uResolution: { value: [1280, 720], type: 'vec2<f32>' },
      uCameraOffset: { value: [0, 0], type: 'vec2<f32>' },
      uPlayerPos: { value: [640, 360], type: 'vec2<f32>' },
      uPlayerGlow: { value: 0.35, type: 'f32' },
      uWave0: { value: [0, 0, 2.0, 0], type: 'vec4<f32>' },
      uWave1: { value: [0, 0, 2.0, 0], type: 'vec4<f32>' },
      uWave2: { value: [0, 0, 2.0, 0], type: 'vec4<f32>' },
      uWave3: { value: [0, 0, 2.0, 0], type: 'vec4<f32>' },
      uColorDeep: { value: [0.02, 0.035, 0.095], type: 'vec3<f32>' },
      uColorMid: { value: [0.045, 0.115, 0.235], type: 'vec3<f32>' },
      uColorGlow: { value: [0.16, 0.72, 0.76], type: 'vec3<f32>' },
    });

    const glProgram = GlProgram.from({
      vertex: defaultFilterVert,
      fragment: BACKDROP_FRAGMENT,
      preferredFragmentPrecision: 'highp',
      name: 'abyss-backdrop-filter',
    });

    super({
      glProgram,
      resources: { backdropUniforms: uniforms },
    });

    this.uniforms = uniforms.uniforms;
    this.uniformGroup = uniforms;
  }

  sync() {
    this.uniformGroup.update();
  }
}

export class AtmosphereFilter extends Filter {
  constructor() {
    const uniforms = new UniformGroup({
      uResolution: { value: [1280, 720], type: 'vec2<f32>' },
      uWave0: { value: [0, 0, 1.0, 0], type: 'vec4<f32>' },
      uWave1: { value: [0, 0, 1.0, 0], type: 'vec4<f32>' },
      uWave2: { value: [0, 0, 1.0, 0], type: 'vec4<f32>' },
      uWave3: { value: [0, 0, 1.0, 0], type: 'vec4<f32>' },
      uDamageFlash: { value: 0.0, type: 'f32' },
      uDangerVignette: { value: 0.0, type: 'f32' },
      uEdgeGlow: { value: [0, 0, 0, 0], type: 'vec4<f32>' },
      uBloomScale: { value: 0.65, type: 'f32' },
    });

    const glProgram = GlProgram.from({
      vertex: defaultFilterVert,
      fragment: ATMOSPHERE_FRAGMENT,
      preferredFragmentPrecision: 'highp',
      name: 'atmosphere-post-filter',
    });

    super({
      glProgram,
      resources: { atmosphereUniforms: uniforms },
    });

    this.uniforms = uniforms.uniforms;
    this.uniformGroup = uniforms;
  }

  sync() {
    this.uniformGroup.update();
  }
}
