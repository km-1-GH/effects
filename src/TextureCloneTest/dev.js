import * as THREE from "three"
import { Pane } from "tweakpane"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import Stats from "three/examples/jsm/libs/stats.module.js"

const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)

const pane = new Pane()
let controls

export function devSetup(camera, canvas) {
    // Controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true

    /*
    *   reset control
    */
    pane.addButton({
        title: "Reset Orbit Controls",
        index: 0,
    }).on("click", () => {
        controls.reset()
        controls.enableDamping = true
    })
}

export function getPane() {
}

export function render() {
    controls.update()
    stats.update()

}



