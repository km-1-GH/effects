        import * as THREE from 'three'

/**
 * @module Beam
 * Beam effect from mouse click position to the rounded square mesh.
 * @param {THREE.Object3D} target - The target object for the beam effect.
 */

export default class Beam {
    target: THREE.Object3D

    constructor(target: THREE.Object3D) {
        this.target = target
    }
}