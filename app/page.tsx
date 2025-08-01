'use client'

import React, { useState } from 'react';
import PlatformerGame from '../components/PlatformerGame';
import MainMenu from '../components/MainMenu';
import styles from '../styles/home.module.css'; // Keep this for main styling if needed, or remove if platformer.module.css is sufficient

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <main className={styles.main}>
      {gameStarted ? (
        <PlatformerGame />
      ) : (
        <MainMenu onStartGame={handleStartGame} />
      )}
    </main>
  );
}
