import * as THREE from "three"
import { Pane } from "tweakpane"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const pane = new Pane()
let controls

export function devSetup(camera, canvas) {
    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.target.y = 3
    controls.enableDamping = true


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
}

export function getPane() {
    return pane
}

export function render() {
    controls.update()
}



