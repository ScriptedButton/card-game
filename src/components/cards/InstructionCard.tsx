"use client";

import React from "react";
import PlayingCard from "./PlayingCard";

interface InstructionCardProps {
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const InstructionCard: React.FC<InstructionCardProps> = ({
  title,
  content,
  icon,
  className = "",
}) => {
  return (
    <PlayingCard
      className={className}
      backContent={
        <div className="h-full w-full flex flex-col items-center justify-between py-6 px-4 text-white">
          <h3 className="text-xl font-bold text-center">{title}</h3>
          {icon && <div className="text-4xl my-4">{icon}</div>}
          <div className="text-sm text-center">{content}</div>
          <div className="text-xs mt-4 text-center text-white/70">
            Click to flip back
          </div>
        </div>
      }
    />
  );
};

export default InstructionCard;
