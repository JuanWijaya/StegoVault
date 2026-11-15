import React, { useRef, useState } from 'react';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
  className?: string;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  spotlightColor = 'rgba(59, 91, 255, 0.08)',
  className = '',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setCoords(null);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ${className}`}
      {...props}
    >
      {coords && (
        <div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10"
          style={{
            background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, ${spotlightColor}, transparent 70%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};
