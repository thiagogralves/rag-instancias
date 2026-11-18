import Aurora from "./bits/Aurora"
import LightRays from "./bits/LightRays"
import Particles from "./bits/Particles"
import type { Person } from "./types"

export function GateFx() {
  return (
    <>
      <div className="fx-layer fx-rays" aria-hidden="true">
        <LightRays
          raysOrigin="top-center"
          raysColor="#7ad7ff"
          raysSpeed={0.65}
          lightSpread={0.85}
          rayLength={1.4}
          intensity={0.7}
          pulsating
          fadeDistance={1.1}
        />
      </div>
      <div className="fx-layer fx-aurora" aria-hidden="true">
        <Aurora
          colorStops={["#4ef0d3", "#7ad7ff", "#9b8cff"]}
          amplitude={1}
          blend={0.6}
          speed={0.75}
          height={1.15}
          opacity={0.5}
          mouseInteraction={false}
        />
      </div>
      <div className="fx-layer fx-particles" aria-hidden="true">
        <Particles
          particleCount={90}
          particleSpread={9}
          speed={0.18}
          particleColors={["#4ef0d3", "#7ad7ff", "#ffd56a", "#9b8cff"]}
          alphaParticles
          particleBaseSize={70}
          sizeRandomness={0.8}
          shape="sparkle"
          glow={1.4}
          twinkle={0.7}
          drift="up"
          driftSpeed={0.15}
          moveParticlesOnHover={false}
          opacity={0.7}
        />
      </div>
    </>
  )
}

export function BoardFx({ user }: { user: Person }) {
  const colors =
    user === "thiago"
      ? ["#4ef0d3", "#7ad7ff", "#9b8cff", "#ffd56a"]
      : ["#ffb4c8", "#9b8cff", "#7ad7ff", "#ffd56a"]

  return (
    <>
      <div className="fx-layer fx-aurora soft" aria-hidden="true">
        <Aurora
          colorStops={colors.slice(0, 3)}
          amplitude={0.75}
          blend={0.5}
          speed={0.5}
          height={1}
          opacity={0.22}
          mouseInteraction={false}
        />
      </div>
      <div className="fx-layer fx-particles soft" aria-hidden="true">
        <Particles
          particleCount={55}
          particleSpread={11}
          speed={0.12}
          particleColors={colors}
          alphaParticles
          particleBaseSize={55}
          shape="sparkle"
          glow={1.1}
          twinkle={0.55}
          drift="up"
          driftSpeed={0.1}
          moveParticlesOnHover={false}
          opacity={0.45}
        />
      </div>
      <div className="midgard-veil" aria-hidden="true" />
    </>
  )
}
