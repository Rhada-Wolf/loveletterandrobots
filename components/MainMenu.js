'use client'

import React from 'react';
import styles from '../styles/home.module.css'; // Reusing home.module.css for general styling

const MainMenu = ({ onStartGame }) => {
  return (
    <div className={styles.main}>
      <h1>Welcome to the Platformer Game!</h1>
      <button className={styles.button} onClick={onStartGame}>Start Game</button>
    </div>
  );
};

export default MainMenu;