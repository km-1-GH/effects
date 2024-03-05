import * as THREE from "three"
import { Pane } from "tweakpane"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const guiParam = {}

let controls

export function devSetup(camera, canvas) {
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

    return pane
}

export function render() {
    controls.update()
}



