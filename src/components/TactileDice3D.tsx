import React, { useEffect, useRef, useState } from 'react';
import { FactionColor } from '../engine/ludoEngine';

interface TactileDice3DProps {
  value: number | null;
  rolling: boolean;
  canRoll: boolean;
  activeColor: FactionColor;
  onRoll: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

// Authentic Ludo King tumbling sprite-frame poses during a roll
const TUMBLE_POSES = [
  { rotZ: 24, rotX: 22, rotY: -18, scale: 0.9 },
  { rotZ: -32, rotX: -20, rotY: 25, scale: 0.94 },
  { rotZ: 48, rotX: 18, rotY: 22, scale: 0.88 },
  { rotZ: -18, rotX: -25, rotY: -20, scale: 0.95 },
  { rotZ: 35, rotX: 15, rotY: -24, scale: 0.91 },
  { rotZ: -42, rotX: 24, rotY: 16, scale: 0.93 },
];

export const TactileDice3D: React.FC<TactileDice3DProps> = ({
  value,
  rolling,
  canRoll,
  onRoll,
  size = 'md',
}) => {
  // Preserve last rolled face so the dice never snaps back to 1 after a move
  const lastValidFaceRef = useRef<number>(value ?? 6);
  if (value !== null && value >= 1 && value <= 6) {
    lastValidFaceRef.current = value;
  }

  const [cyclingFace, setCyclingFace] = useState<number>(lastValidFaceRef.current);
  const [poseIdx, setPoseIdx] = useState<number>(0);

  // Rapid frame-by-frame Ludo King dice number & tumble cycling while rolling
  useEffect(() => {
    if (!rolling) {
      setCyclingFace(lastValidFaceRef.current);
      setPoseIdx(0);
      return;
    }

    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      setPoseIdx(step % TUMBLE_POSES.length);
      setCyclingFace((prev) => {
        // Pick a different face (1..6) on every frame so numbers visibly change like Ludo King
        const candidates = [1, 2, 3, 4, 5, 6].filter((n) => n !== prev);
        return candidates[Math.floor(Math.random() * candidates.length)];
      });
    }, 45);

    return () => window.clearInterval(interval);
  }, [rolling]);

  const activeFace = rolling ? cyclingFace : value ?? lastValidFaceRef.current;
  const pips = PIP_LAYOUTS[activeFace] || PIP_LAYOUTS[6];
  const isOne = activeFace === 1;

  const cubePx = size === 'lg' ? 54 : size === 'md' ? 46 : 40;
  const pose = rolling ? TUMBLE_POSES[poseIdx] : { rotZ: 0, rotX: 0, rotY: 0, scale: 1 };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (canRoll && !rolling) onRoll();
      }}
      disabled={!canRoll || rolling}
      title={canRoll ? 'Tap to Roll Dice' : ''}
      className={`relative flex items-center justify-center select-none ${
        canRoll ? 'cursor-pointer active:scale-90' : 'cursor-default'
      }`}
      style={{
        width: cubePx,
        height: cubePx,
        perspective: '420px',
      }}
    >
      <div
        style={{
          width: cubePx,
          height: cubePx,
          transform: `scale(${pose.scale}) rotateX(${pose.rotX}deg) rotateY(${pose.rotY}deg) rotateZ(${pose.rotZ}deg)`,
          transition: rolling ? 'transform 0.045s linear' : 'transform 0.14s cubic-bezier(0.22, 1, 0.36, 1)',
          background: 'linear-gradient(145deg, #FFFFFF 0%, #F1F3F5 58%, #D6D9DC 100%)',
          border: '1.5px solid #8E9297',
          boxShadow: rolling
            ? 'inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -3px 5px rgba(0, 0, 0, 0.25), 0 6px 12px rgba(0,0,0,0.45)'
            : 'inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -3px 5px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0,0,0,0.35)',
        }}
        className="rounded-[10px] p-1.5 grid grid-cols-3 grid-rows-3 gap-0.5 items-center justify-items-center"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => {
          const hasPip = pips.includes(cellIdx);
          if (!hasPip) return <span key={cellIdx} />;
          return (
            <span
              key={cellIdx}
              className="rounded-full"
              style={{
                width: isOne ? cubePx * 0.28 : cubePx * 0.19,
                height: isOne ? cubePx * 0.28 : cubePx * 0.19,
                background:
                  'radial-gradient(circle at 35% 35%, #2B2B2B, #0B0B0B 75%, #000000 100%)',
                boxShadow:
                  'inset 0 1px 2px rgba(0,0,0,0.8), 0 1px 1px rgba(255,255,255,0.85)',
              }}
            />
          );
        })}
      </div>
    </button>
  );
};
