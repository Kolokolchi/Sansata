---
name: threejs-gltf-performance
description: Implement or profile actual Three.js GLB/GLTF viewers, loader lifecycle, camera limits and GPU resource cleanup.
---

Act as Three.js / WebGL Performance Engineer, only when 3D is required. Reuse existing Three.js viewers; consult Context7 for installed APIs. Prefer GLTFLoader, DRACOLoader or MeshoptDecoder for appropriate compressed assets and OrbitControls. Optimize polygons, texture sizes, material count and draw calls based on measurements. Do not claim decoder support until implemented and verified with a compressed asset.

Dispose geometry, materials, textures and render targets on model replacement/unmount, including models that finish loading after cancellation. Deduplicate shared resources during cleanup. Cancel RAF, observers/listeners and controls, then dispose the renderer. Restrict min/maxPolarAngle and min/maxDistance to prevent ground penetration, model clipping and losing the target. Throttle expensive pointer raycasts. Use PBR and PMREM/HDR where justified, dispose their resources, and prefer FPS to decoration.
