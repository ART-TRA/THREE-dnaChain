attribute float randoms;
attribute float colorRandoms;

varying float vColorRandom;
varying vec2 vUv;

void main() {
    vec4 modelPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (20.0 * randoms + 5.0) * (1.0 / -modelPosition.z);
    gl_Position = projectionMatrix * modelPosition;

    vColorRandom = colorRandoms;
    vUv = uv;
}