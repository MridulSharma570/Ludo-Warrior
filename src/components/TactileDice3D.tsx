import React, { useEffect, useState } from 'react';
import { FACTIONS, FactionColor } from '../engine/ludoEngine';

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
  activeColor,
  onRoll,
  size = 'md',
}) => {
  const faction = FACTIONS[activeColor];
  const displayFace = value ?? 6;
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

  const cubePx = size === 'lg' ? 62 : size === 'md' ? 50 : 42;
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
      onClick={() => {
        if (canRoll && !rolling) onRoll();
      }}
      disabled={!canRoll || rolling}
      title={canRoll ? 'Tap or press SPACE to Roll Dice' : ''}
      className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 select-none ${
        canRoll
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : 'cursor-default'
      }`}
      style={{
        width: cubePx + 18,
        height: cubePx + 18,
        perspective: '550px',
        background: canRoll
          ? `radial-gradient(circle, ${faction.lightHex}33 0%, rgba(15, 23, 42, 0.9) 100%)`
          : 'rgba(15, 23, 42, 0.75)',
        border: canRoll ? '2.5px solid #FACC15' : '2px solid rgba(255,255,255,0.18)',
        boxShadow: canRoll
          ? '0 0 22px rgba(250, 204, 21, 0.65), inset 0 2px 6px rgba(255,255,255,0.25)'
          : 'inset 0 2px 5px rgba(0,0,0,0.6)',
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
            ? 'transform 0.44s cubic-bezier(0.18, 0.89, 0.32, 1.24)'
            : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {faces.map(({ faceNum, transform }) => {
          const pips = PIP_LAYOUTS[faceNum];
          const isOne = faceNum === 1;
          const isSix = faceNum === 6;

          return (
            <div
              key={faceNum}
              style={{
                width: cubePx,
                height: cubePx,
                transform,
                backfaceVisibility: 'hidden',
                background:
                  'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 55%, #FDE68A 100%)',
                border: '2px solid #D97706',
                boxShadow:
                  'inset 0 2px 4px rgba(255,255,255,0.95), inset 0 -3px 6px rgba(180, 83, 9, 0.28), 0 4px 10px rgba(0,0,0,0.45)',
              }}
              className="absolute inset-0 rounded-xl p-1.5 grid grid-cols-3 grid-rows-3 gap-0.5 items-center justify-items-center"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cellIdx) => {
                const hasPip = pips.includes(cellIdx);
                if (!hasPip) return <span key={cellIdx} />;
                return (
                  <span
                    key={cellIdx}
                    className="rounded-full"
                    style={{
                      width: isOne ? cubePx * 0.27 : cubePx * 0.18,
                      height: isOne ? cubePx * 0.27 : cubePx * 0.18,
                      background: isOne
                        ? 'radial-gradient(circle at 35% 35%, #FB7185, #E11D48 65%, #881337 100%)'
                        : isSix
                        ? 'radial-gradient(circle at 35% 35%, #F87171, #DC2626 65%, #7F1D1D 100%)'
                        : 'radial-gradient(circle at 35% 35%, #334155, #0F172A 75%, #020617 100%)',
                      boxShadow:
                        'inset 0 1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.8)',
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
