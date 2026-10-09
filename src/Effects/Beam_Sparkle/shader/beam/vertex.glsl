uniform vec3 uTail;
uniform vec3 uHead;
uniform float uHalfWidth;

varying vec2 vLocal;
varying float vLength;

/**
 * position.x: 0 = tail, 1 = head
 * position.y: -1 ~ 1 = side
 * カメラ空間で tail -> head の線分をカメラに正対した帯(カプセル)として展開する
 */
void main() {
    vec4 tailView = viewMatrix * vec4(uTail, 1.0);
    vec4 headView = viewMatrix * vec4(uHead, 1.0);

    vec2 segment = headView.xy - tailView.xy;
    float len = length(segment);
    vec2 dir = len > 0.0001 ? segment / len : vec2(1.0, 0.0);
    vec2 side = vec2(-dir.y, dir.x);

    // 両端を半幅ぶん延ばして丸いキャップの分の余白をとる
    float along = position.x * 2.0 - 1.0;
    vec4 viewPosition = mix(tailView, headView, position.x);
    viewPosition.xy += dir * along * uHalfWidth + side * position.y * uHalfWidth;

    gl_Position = projectionMatrix * viewPosition;

    /**
    * Varyings
    */
    vLocal = vec2(position.x * len + along * uHalfWidth, position.y * uHalfWidth);
    vLength = len;
}
