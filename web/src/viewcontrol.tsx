// Rotate and tilt the map from on-screen buttons: any direction on top (W up, E down…), free spin, and tilt for 3D.
// Mouse: right-drag or Ctrl+drag also rotates/tilts; on a phone, twist two fingers to rotate and drag them up to tilt.
import { useEffect, useState } from 'react';
import type { Map } from 'maplibre-gl';

const UP: [string, number][] = [['N', 0], ['E', 90], ['S', 180], ['W', 270]];
const name = (b: number) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((((b % 360) + 360) % 360) / 45) % 8];

export function ViewControl({ map }: { map: Map }) {
  const [view, setView] = useState({ bearing: map.getBearing(), pitch: map.getPitch() });
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setView({ bearing: map.getBearing(), pitch: map.getPitch() });
    map.on('rotate', on);
    map.on('pitch', on);
    return () => { map.off('rotate', on); map.off('pitch', on); };
  }, [map]);
  const b = ((view.bearing % 360) + 360) % 360;
  const turn = (deg: number) => map.easeTo({ bearing: map.getBearing() + deg, duration: 400 });

  return (
    <div className="viewctl">
      <button className="dial" onClick={() => setOpen(!open)} title="Rotate / tilt the map">
        <span style={{ transform: `rotate(${-b}deg)` }}>▲<small>N</small></span>
      </button>
      {open && (
        <div className="viewctl-box">
          <div className="row">
            <button onClick={() => turn(-45)} title="Rotate left 45°">⟲</button>
            <strong className="grow">{name(b)} on top · {Math.round(b)}°</strong>
            <button onClick={() => turn(45)} title="Rotate right 45°">⟳</button>
          </div>
          <div className="row">
            {UP.map(([d, deg]) => (
              <button key={d} className={Math.round(b) === deg ? 'active' : ''} onClick={() => map.easeTo({ bearing: deg, duration: 600 })}>{d} up</button>
            ))}
          </div>
          <label>Spin<input type="range" min={0} max={359} value={Math.round(b)} onChange={(e) => map.setBearing(Number(e.target.value))} /></label>
          <label>Tilt {Math.round(view.pitch)}°<input type="range" min={0} max={85} value={Math.round(view.pitch)} onChange={(e) => map.setPitch(Number(e.target.value))} /></label>
          <button onClick={() => map.easeTo({ bearing: 0, pitch: 0, duration: 600 })}>Reset (north up, flat)</button>
          <p className="muted small">Mouse: right-click drag (or Ctrl + drag) to spin and tilt. Phone: twist two fingers to spin, slide two fingers up to tilt. Turn on ⛰️ 3D to see the hills.</p>
        </div>
      )}
    </div>
  );
}
