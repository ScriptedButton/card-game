"use client";

// This is a fallback for framer-motion to make it more maintainable
// when used with TypeScript and for components that don't rely on animations.

// Disable ESLint for this file as it requires flexibility with types
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import React, { HTMLAttributes, ButtonHTMLAttributes } from "react";

// Define a simple interface that matches common motion props
interface MotionProps extends HTMLAttributes<HTMLElement> {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  variants?: any;
  whileHover?: any;
  // Add any other props you need
  [key: string]: any;
}

// Create a component that just passes through children without any animation
const motion = {
  div: (props: MotionProps) => <div {...props} />,
  span: (props: MotionProps) => <span {...props} />,
  button: (props: MotionProps & ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props} />
  ),
  // Add more HTML elements as needed
};

// Simplified AnimatePresence component that just renders children
const AnimatePresence = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export { motion, AnimatePresence };
