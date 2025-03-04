"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface PlayerNameInputProps {
  onSubmit: (name: string) => void;
  initialValue?: string;
}

export default function PlayerNameInput({
  onSubmit,
  initialValue = "",
}: PlayerNameInputProps) {
  const [name, setName] = useState(initialValue);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }

    if (trimmedName.length > 20) {
      setError("Name must be less than 20 characters");
      return;
    }

    setError("");
    onSubmit(trimmedName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-black/80 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/10"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Enter Your Name</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            maxLength={20}
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-sm mt-2"
            >
              {error}
            </motion.p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
        >
          Start Playing
        </Button>
      </form>
    </motion.div>
  );
}
