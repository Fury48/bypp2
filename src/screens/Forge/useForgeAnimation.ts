import { useRef } from 'react';
import gsap from 'gsap';
import type { RefObject } from 'react';

export interface ForgeRefs {
  overlay: RefObject<HTMLDivElement>;
  stage: RefObject<HTMLDivElement>;
  altar: RefObject<HTMLDivElement>;
  slotA: RefObject<HTMLDivElement>;
  slotB: RefObject<HTMLDivElement>;
  slotC: RefObject<HTMLDivElement>;
  flash: RefObject<HTMLDivElement>;
  backCard: RefObject<HTMLDivElement>;
  particles: RefObject<HTMLDivElement>;
}

function spawnParticles(container: HTMLDivElement) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('div');
    dot.className = 'forge-particle';
    container.appendChild(dot);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = 80 + Math.random() * 60;
    gsap.fromTo(
      dot,
      { x: 0, y: 0, opacity: 1, scale: 1 },
      {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: 0,
        scale: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => dot.remove(),
      }
    );
  }
}

export function useForgeAnimation(refs: ForgeRefs) {
  const introTl = useRef<gsap.core.Timeline>();

  function playIntro() {
    if (!refs.overlay.current || !refs.altar.current || !refs.stage.current) return;
    introTl.current?.kill();
    gsap.killTweensOf([
      refs.overlay.current,
      refs.stage.current,
      refs.altar.current,
      refs.slotA.current,
      refs.slotB.current,
      refs.slotC.current,
    ]);
    introTl.current = gsap
      .timeline()
      .set(refs.altar.current, { y: 200, opacity: 0 })
      .set([refs.slotA.current, refs.slotB.current, refs.slotC.current], { opacity: 0 })
      .to(refs.overlay.current, { opacity: 0.7, duration: 0.3 })
      .to(refs.altar.current, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' })
      .to(refs.stage.current, { x: 8, duration: 0.05, repeat: 5, yoyo: true })
      .fromTo(refs.slotA.current, { x: -260, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, '<')
      .fromTo(refs.slotB.current, { y: 30, scale: 0.85, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.4 }, '<0.05')
      .fromTo(refs.slotC.current, { x: 260, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4 }, '<0.05');
  }

  function playCombine(onRevealReady: () => void) {
    if (!refs.slotA.current || !refs.slotB.current || !refs.slotC.current || !refs.flash.current || !refs.backCard.current) return;
    gsap
      .timeline()
      .to([refs.slotA.current, refs.slotB.current, refs.slotC.current], {
        x: 0,
        y: 0,
        scale: 0.2,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      })
      .call(() => {
        if (refs.particles.current) spawnParticles(refs.particles.current);
      })
      .to(refs.flash.current, { opacity: 1, duration: 0.08 })
      .to(refs.flash.current, { opacity: 0, duration: 0.3 })
      .set(refs.backCard.current, { display: 'block', rotateY: 0, opacity: 1 })
      .call(onRevealReady)
      .to(refs.backCard.current, { rotateY: 180, duration: 0.6, ease: 'power2.inOut' });
  }

  function reset() {
    if (refs.backCard.current) {
      gsap.set(refs.backCard.current, { display: 'none', rotateY: 0 });
    }
    for (const slot of [refs.slotA, refs.slotB, refs.slotC]) {
      if (slot.current) gsap.set(slot.current, { x: 0, y: 0, scale: 1, opacity: 1 });
    }
  }

  function killIntro() {
    introTl.current?.kill();
  }

  return { playIntro, playCombine, reset, killIntro };
}
