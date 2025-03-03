"use client";

import React from "react";
import { motion } from "framer-motion";

const LoadingIndicator = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
        repeatDelay: 0.3,
      },
    }),
  };

  return (
    <div className="flex justify-center items-center gap-2">
      <motion.div
        className="w-8 h-10 bg-red-600 rounded-md shadow-md"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={0}
      />
      <motion.div
        className="w-8 h-10 bg-black rounded-md shadow-md"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={1}
      />
      <motion.div
        className="w-8 h-10 bg-red-600 rounded-md shadow-md"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={2}
      />
      <motion.div
        className="w-8 h-10 bg-black rounded-md shadow-md"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        custom={3}
      />
    </div>
  );
};

export default LoadingIndicator;
