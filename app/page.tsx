'use client'

import PlatformerGame from '../components/PlatformerGame';
import styles from '../styles/home.module.css'; // Keep this for main styling if needed, or remove if platformer.module.css is sufficient

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Simple Platformer Game</h1>
      <PlatformerGame />
    </main>
  );
}
