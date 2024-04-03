import * as THREE from "three"
import { Pane } from "tweakpane"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

const pane = new Pane()
let controls

const effectFolder = pane.addFolder({
    title: "Effects",
    index: 1,
    expanded: true,
})

effectFolder.addButton({
    title: "Close Folders",
    index: 1,
}).on("click", () => {
    effectFolder.children.forEach((child) => {
        child.expanded = false
    })
})

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
        index: 0,
    }).on("click", () => {
        controls.reset()
        controls.target.y = 3
        controls.enableDamping = true
    })
}

export function getPane() {
    return effectFolder
}

export function render() {
    controls.update()
}



