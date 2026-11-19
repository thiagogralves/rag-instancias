import DarkVeil from "./bits/DarkVeil"

export function GateFx() {
  return (
    <div className="fx-layer" aria-hidden="true">
      <DarkVeil
        color="#dafa9c"
        speed={0.55}
        scale={1.1}
        warp={0.35}
        brightness={0.55}
        sheen={0.4}
        glow={0.55}
        grain={0.12}
        opacity={0.85}
        mouseInteraction
      />
    </div>
  )
}

export function BoardFx() {
  return (
    <div className="fx-layer soft" aria-hidden="true">
      <DarkVeil
        color="#dafa9c"
        speed={0.35}
        scale={1.25}
        warp={0.2}
        brightness={0.28}
        sheen={0.25}
        glow={0.35}
        grain={0.08}
        opacity={0.55}
        mouseInteraction={false}
      />
    </div>
  )
}
