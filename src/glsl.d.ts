// vite-plugin-glsl でインポートするシェーダーファイルの型宣言
declare module '*.glsl' {
    const value: string
    export default value
}
declare module '*.vert' {
    const value: string
    export default value
}
declare module '*.frag' {
    const value: string
    export default value
}
