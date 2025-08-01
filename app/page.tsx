'use client'

import React, { useState } from 'react';
import PlatformerGame from '../components/PlatformerGame';
import MainMenu from '../components/MainMenu';
import LevelEditor from '../components/LevelEditor';
import styles from '../styles/home.module.css';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [editorMode, setEditorMode] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
    setEditorMode(false);
  };

  const handleToggleEditor = () => {
    setEditorMode(!editorMode);
    setGameStarted(false); // Ensure game is not running when in editor
  };

  return (
    <main className={styles.main}>
      <button onClick={handleToggleEditor} className={styles.modeToggleButton}>
        {editorMode ? 'Play Game' : 'Level Editor'}
      </button>
      {editorMode ? (
        <LevelEditor />
      ) : gameStarted ? (
        <PlatformerGame />
      ) : (
        <MainMenu onStartGame={handleStartGame} />
      )}
    </main>
  );
}
