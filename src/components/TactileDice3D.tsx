import React, { useEffect, useState } from 'react';
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

const FACE_ROTATIONS: Record<number, [number, number, number]> = {
  1: [0, 0, 0],
  2: [0, -180, 0],
  3: [0, -90, 0],
  4: [0, 90, 0],
  5: [-90, 0, 0],
  6: [90, 0, 0],
};

export const TactileDice3D: React.FC<TactileDice3DProps> = ({
  value,
  rolling,
  canRoll,
  onRoll,
  size = 'md',
}) => {
  const displayFace = value ?? 1;
  const [spinOffset, setSpinOffset] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (rolling) {
      setSpinOffset([
        720 + Math.floor(Math.random() * 2) * 360,
        1080 + Math.floor(Math.random() * 2) * 360,
        360,
      ]);
    }
  }, [rolling]);

  const baseRot = FACE_ROTATIONS[displayFace] || [0, 0, 0];
  const rotX = rolling ? baseRot[0] + spinOffset[0] : baseRot[0];
  const rotY = rolling ? baseRot[1] + spinOffset[1] : baseRot[1];
  const rotZ = rolling ? baseRot[2] + spinOffset[2] : baseRot[2];

  const cubePx = size === 'lg' ? 54 : size === 'md' ? 46 : 40;
  const half = cubePx / 2;

  const faces: { faceNum: number; transform: string }[] = [
    { faceNum: 1, transform: `rotateY(0deg) translateZ(${half}px)` },
    { faceNum: 2, transform: `rotateY(180deg) translateZ(${half}px)` },
    { faceNum: 3, transform: `rotateY(90deg) translateZ(${half}px)` },
    { faceNum: 4, transform: `rotateY(-90deg) translateZ(${half}px)` },
    { faceNum: 5, transform: `rotateX(90deg) translateZ(${half}px)` },
    { faceNum: 6, transform: `rotateX(-90deg) translateZ(${half}px)` },
  ];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (canRoll && !rolling) onRoll();
      }}
      disabled={!canRoll || rolling}
      title={canRoll ? 'Tap to Roll Dice' : ''}
      className={`relative flex items-center justify-center transition-transform duration-150 select-none ${
        canRoll ? 'cursor-pointer active:scale-90' : 'cursor-default'
      }`}
      style={{
        width: cubePx,
        height: cubePx,
        perspective: '500px',
      }}
    >
      <div
        style={{
          width: cubePx,
          height: cubePx,
          position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
          transition: rolling
            ? 'transform 0.42s cubic-bezier(0.18, 0.89, 0.32, 1.24)'
            : 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {faces.map(({ faceNum, transform }) => {
          const pips = PIP_LAYOUTS[faceNum];
          const isOne = faceNum === 1;

          return (
            <div
              key={faceNum}
              style={{
                width: cubePx,
                height: cubePx,
                transform,
                backfaceVisibility: 'hidden',
                background:
                  'linear-gradient(145deg, #FFFFFF 0%, #F1F3F5 58%, #D6D9DC 100%)',
                border: '1.5px solid #8E9297',
                boxShadow:
                  'inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -3px 5px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0,0,0,0.35)',
              }}
              className="absolute inset-0 rounded-[10px] p-1.5 grid grid-cols-3 grid-rows-3 gap-0.5 items-center justify-items-center"
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
          );
        })}
      </div>
    </button>
  );
};
