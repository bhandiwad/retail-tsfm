import React from 'react';

interface FootwearVisualProps {
  silhouetteType: string;
  colorHex: string;
  swatchName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FootwearVisual: React.FC<FootwearVisualProps> = ({
  silhouetteType,
  colorHex,
  swatchName,
  size = 'md',
  className = '',
}) => {
  const dimensions =
    size === 'sm'
      ? 'w-14 h-11'
      : size === 'lg'
      ? 'w-44 h-28'
      : 'w-24 h-16';

  const renderShoeSvg = () => {
    switch (silhouetteType) {
      case 'espadrille':
        return (
          <svg viewBox="0 0 180 100" className="w-full h-full drop-shadow-xs">
            <path
              d="M16 74 Q90 80 164 72 L166 84 Q90 90 14 84 Z"
              fill="#d6b88c"
              stroke="#9c7e50"
              strokeWidth="1.5"
            />
            <path
              d="M25 75 L20 84 M40 76 L35 85 M55 77 L50 85 M70 77 L65 86 M85 77 L80 86 M100 77 L95 86 M115 76 L110 85 M130 75 L125 84 M145 74 L140 83"
              stroke="#8b6d40"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M16 74 C14 55 24 38 42 36 C56 54 78 56 96 42 C118 46 148 52 164 72 Z"
              fill={colorHex}
              stroke="#33415540"
              strokeWidth="1.5"
            />
            <path d="M92 43 L99 54 L106 45 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
            <path
              d="M32 45 C42 56 52 64 56 74"
              stroke="#ffffff90"
              strokeWidth="1.3"
              strokeDasharray="3 2"
              fill="none"
            />
          </svg>
        );

      case 'platform_mule':
        return (
          <svg viewBox="0 0 180 100" className="w-full h-full drop-shadow-xs">
            <path
              d="M18 68 L162 68 L165 86 L148 86 L145 81 L132 81 L129 86 L110 86 L107 81 L94 81 L91 86 L70 86 L67 81 L54 81 L51 86 L15 86 Z"
              fill="#3d2b24"
              stroke="#5c4238"
              strokeWidth="1.2"
            />
            <path
              d="M62 68 C68 42 88 32 114 34 C138 36 158 50 162 68 Z"
              fill={colorHex}
              stroke="#33415540"
              strokeWidth="1.5"
            />
            <path d="M18 65 L68 65 L68 69 L18 69 Z" fill="#ebd9c8" />
            <path
              d="M72 58 Q118 52 156 62"
              stroke="#ffffff85"
              strokeWidth="1.5"
              strokeDasharray="3 2"
              fill="none"
            />
          </svg>
        );

      case 'slide_sandal':
        return (
          <svg viewBox="0 0 180 100" className="w-full h-full drop-shadow-xs">
            <path
              d="M16 74 Q90 81 164 72 L166 84 Q90 90 14 84 Z"
              fill="#c5a882"
              stroke="#8c7250"
              strokeWidth="1.5"
            />
            <path
              d="M74 74 C76 42 98 34 128 39 C140 44 146 58 148 72 Z"
              fill={colorHex}
              stroke="#8c7250"
              strokeWidth="1.5"
            />
            <path
              d="M86 68 L112 42 M98 70 L124 44 M110 71 L134 48 M88 46 L118 70 M102 42 L132 68"
              stroke="#785e3c"
              strokeWidth="1.5"
              opacity="0.7"
            />
          </svg>
        );

      case 'chelsea_boot':
        return (
          <svg viewBox="0 0 180 100" className="w-full h-full drop-shadow-xs">
            <path
              d="M16 74 L164 74 L166 88 L18 88 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <path
              d="M24 74 L28 18 L86 18 C92 38 106 48 134 52 C152 55 162 62 164 74 Z"
              fill={colorHex}
              stroke="#33415550"
              strokeWidth="1.5"
            />
            <path
              d="M46 20 L72 20 L70 54 C62 58 52 58 46 52 Z"
              fill="#1e241e"
              stroke="#ffffff30"
              strokeWidth="1"
            />
            <path d="M22 12 L32 12 L32 22 L22 22 Z" fill="#d97706" rx="2" />
          </svg>
        );

      case 'court_sneaker':
        return (
          <svg viewBox="0 0 180 100" className="w-full h-full drop-shadow-xs">
            <path
              d="M14 72 L166 72 L164 86 L16 86 Z"
              fill="#c88a4b"
              stroke="#9a6530"
              strokeWidth="1.4"
            />
            <path
              d="M16 72 C16 50 26 36 44 36 C58 48 76 48 92 34 L128 52 C148 54 162 60 164 72 Z"
              fill={colorHex}
              stroke="#33415540"
              strokeWidth="1.5"
            />
            <path
              d="M52 68 C74 54 98 52 126 68"
              stroke="#ffffff"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M95 36 L104 32 M103 41 L112 37 M111 46 L120 42"
              stroke="#ffffff"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 180 100" className="w-full h-full drop-shadow-xs">
            <path
              d="M16 73 Q90 78 164 71 L165 85 Q90 89 15 85 Z"
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="1.4"
            />
            <path
              d="M16 73 C16 52 28 36 46 36 C60 52 82 54 98 40 C122 46 150 52 164 71 Z"
              fill={colorHex}
              stroke="#33415540"
              strokeWidth="1.5"
            />
            <path d="M92 41 L98 53 L105 43 Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 via-white to-slate-100/90 border border-slate-200/90 p-1.5 overflow-hidden shrink-0 shadow-2xs ${dimensions} ${className}`}
    >
      <div
        className="absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl opacity-25 pointer-events-none"
        style={{ backgroundColor: colorHex }}
      />
      {renderShoeSvg()}
      {swatchName && size === 'lg' && (
        <span className="mt-1 text-[10px] font-medium text-slate-600 tracking-tight truncate max-w-full px-1">
          {swatchName}
        </span>
      )}
    </div>
  );
};
