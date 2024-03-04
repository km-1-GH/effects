import * as THREE from "three"
import { Pane } from "tweakpane"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const guiParam = {}

let controls

export function devSetup(camera, canvas, items) {
    console.log(items);

    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.target.y = 3
    controls.enableDamping = true

    // gui
    const pane = new Pane()

    /*
    *   reset control
    */
    pane.addButton({
        title: "Reset Orbit Controls",
    }).on("click", () => {
        controls.reset()
        controls.target.y = 3
        controls.enableDamping = true
    })

    /**
     * Smoke Puff
     */
    const SmokePuffFolder = pane.addFolder({title: 'Smoke Puff' })

    SmokePuffFolder.addBinding(
        items.smokePuff, 
        'destScale', 
        { min: 0, max: 10 }
    ).on('change', value => { console.log('destScale: ', value.value) })

    SmokePuffFolder.addBinding(
        items.smokePuff, 
        'speed', 
        { min: 0, max: 2 }
    ).on('change', value => { console.log('speed: ', value.value) })

    SmokePuffFolder.addBinding(
        items.smokePuff, 
        'size', 
        { min: 0, max: 10 }
    ).on('change', value => { 
        items.smokePuff.anchor.material.uniforms.uSize.value = items.smokePuff.PARTICLE_SIZE * value.value 
    })

    guiParam.color1 = items.smokePuff.anchor.material.uniforms.uColor1.value
    SmokePuffFolder.addBinding(
        guiParam, 'color1', 
        {color: {type: 'float'}}
    ).on('change', value => {
        items.smokePuff.anchor.material.uniforms.uColor1.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
        .convertLinearToSRGB()
        console.log(`0x${items.smokePuff.anchor.material.uniforms.uColor1.value.getHexString()}`)
    })

    guiParam.color2 = items.smokePuff.anchor.material.uniforms.uColor2.value
    SmokePuffFolder.addBinding(
        guiParam, 
        'color2', 
        {color: {type: 'float'}}
    ).on('change', value => {
        items.smokePuff.anchor.material.uniforms.uColor2.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
        .convertLinearToSRGB()
        console.log(`0x${items.smokePuff.anchor.material.uniforms.uColor2.value.getHexString()}`)
    })

    /**
     * Smoke Coffee
     */
    const smokeCoffeeFolder = pane.addFolder({title: 'Smoke Coffee' })

    smokeCoffeeFolder.addBinding(
        items.smokeCoffee, 
        'scale', 
        { min: 0, max: 10 }
    ).on('change', 
        value => { console.log('scale: ', value.value)
        items.smokeCoffee.anchor.scale.setScalar(value.value) 
    })

    smokeCoffeeFolder.addBinding(
        items.smokeCoffee, 
        'speed', 
        { min: 0, max: 20 }
    ).on('change', value => { console.log('speed: ', value.value) })

    guiParam.color3 = items.smokeCoffee.anchor.material.uniforms.uColor.value
    smokeCoffeeFolder.addBinding(
        guiParam, 
        'color3', 
        {color: {type: 'float'}}
    ).on('change', value => {
        items.smokeCoffee.anchor.material.uniforms.uColor.value = new THREE.Color(value.value.r, value.value.g, value.value.b)
        .convertLinearToSRGB()
        console.log(`0x${items.smokeCoffee.anchor.material.uniforms.uColor.value.getHexString()}`)
    })
}

export function render() {
    controls.update()
}



