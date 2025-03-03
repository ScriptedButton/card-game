"use client";

import React from "react";

// This is a fallback component for framer-motion while waiting for React 19 compatibility
type MotionProps = {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  variants?: any;
  whileHover?: any;
  // Add any other props you need
  [key: string]: any;
};

function createMotionComponent(element: keyof JSX.IntrinsicElements) {
  return function MotionComponent({
    children,
    className,
    style,
    ...props
  }: MotionProps) {
    // Just render the base component with className and style, ignoring motion props
    return React.createElement(element, { className, style }, children);
  };
}

// Create fallback components
const motion = {
  div: createMotionComponent("div"),
  section: createMotionComponent("section"),
  p: createMotionComponent("p"),
  h1: createMotionComponent("h1"),
  h2: createMotionComponent("h2"),
  h3: createMotionComponent("h3"),
  span: createMotionComponent("span"),
  img: createMotionComponent("img"),
  button: createMotionComponent("button"),
  a: createMotionComponent("a"),
  ul: createMotionComponent("ul"),
  li: createMotionComponent("li"),
};

export { motion };
