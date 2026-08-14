let hasUserInteracted = false;
let isRapunzelActive = false;


(function feb8FooterFireworks(){
  try {
    const now = new Date();
    const isFeb8 = (now.getMonth() === 1) && (now.getDate() === 8); 
    if (!isFeb8) return;

    document.body && document.body.classList.add('feb8');

    const canvas = document.getElementById('feb8-fireworks');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const state = {
      dpr: 1,
      w: 0,
      h: 0,
      lastT: 0,
      particles: [],
      nextBurstAt: 0
    };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      state.dpr = dpr;
      const cssW = rect.width || canvas.clientWidth || window.innerWidth || 1;
      const cssH = rect.height || canvas.clientHeight || window.innerHeight || 1;
      state.w = Math.max(1, Math.floor(cssW * dpr));
      state.h = Math.max(1, Math.floor(cssH * dpr));
      canvas.width = state.w;
      canvas.height = state.h;
    }

    function rand(min, max) {
      return min + Math.random() * (max - min);
    }

    function pickColor() {
      const hue = Math.floor(rand(0, 360));
      
      return { h: hue, s: rand(62, 84), l: rand(48, 62) };
    }

    function hsla(c, a) {
      return `hsla(${c.h}, ${c.s}%, ${c.l}%, ${a})`;
    }

    function explodeAt(x, y, c) {
      
      const left = x;
      const right = state.w - x;
      const top = y;
      const bottom = state.h - y;
      const maxR = Math.max(40 * state.dpr, Math.min(left, right, top, bottom) * 0.92);

      
      const life = rand(2400, 3400);
      const baseSpeed = Math.max(0.10, Math.min(0.26, (maxR / life) / 0.62)); 
      const count = Math.floor(rand(80, 120));

      for (let i = 0; i < count; i++) {
        const ang = rand(0, Math.PI * 2);
        const sp = baseSpeed * rand(0.65, 1.05);
        const vx = Math.cos(ang) * sp;
        const vy = Math.sin(ang) * sp;

        state.particles.push({
          x,
          y,
          trail: [{ x, y }],
          vx,
          vy,
          color: c,
          age: 0,
          life,
          size: rand(1.0, 2.2) * state.dpr,
          drag: rand(0.993, 0.997),
          
          g: rand(0.000014, 0.000030) 
        });
      }
    }

    function step(t) {
      if (!state.lastT) state.lastT = t;
      const dt = Math.min(34, t - state.lastT); 
      state.lastT = t;

      
      ctx.clearRect(0, 0, state.w, state.h);

      
      if (t >= state.nextBurstAt) {
        const x = rand(state.w * 0.22, state.w * 0.78);
        const y = rand(state.h * 0.20, state.h * 0.52);
        explodeAt(x, y, pickColor());
        state.nextBurstAt = t + rand(1000, 4000);
      }

      
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.age += dt;
        if (p.age >= p.life) {
          state.particles.splice(i, 1);
          continue;
        }

        
        const ox = p.x;
        const oy = p.y;

        try {
          if (!Array.isArray(p.trail)) p.trail = [];
          p.trail.unshift({ x: ox, y: oy });
          
          const maxTrail = Math.max(12, Math.min(24, Math.floor(20 * state.dpr)));
          if (p.trail.length > maxTrail) p.trail.length = maxTrail;
        } catch (e) { console.warn('[RAPUNZEL] preload error', e); }

        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        
        if (p.x < -80 * state.dpr || p.x > state.w + 80 * state.dpr || p.y < -80 * state.dpr || p.y > state.h + 80 * state.dpr) {
          state.particles.splice(i, 1);
          continue;
        }

        const a = Math.max(0, 1 - p.age / p.life);
        const alpha = 0.38 * a;

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        
        const trail = Array.isArray(p.trail) ? p.trail : [];
        const maxSeg = Math.min(trail.length, 18);
        for (let k = 0; k < maxSeg; k++) {
          const t0 = (k === 0) ? { x: p.x, y: p.y } : trail[k - 1];
          const t1 = trail[k];
          const fade = Math.max(0, 1 - (k / (maxSeg + 0.0001)));
          
          const segAlpha = Math.max(0, alpha * 1.05 * fade * fade);
          if (segAlpha <= 0.001) continue;

          ctx.strokeStyle = hsla(p.color, segAlpha);
          ctx.lineWidth = Math.max(1, p.size * (1.55 * fade));
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(t0.x, t0.y);
          ctx.lineTo(t1.x, t1.y);
          ctx.stroke();
        }

        
        ctx.fillStyle = hsla(p.color, Math.max(0, alpha));
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.9, p.size * 0.85), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      
      if (state.particles.length > 1400) {
        state.particles.splice(0, state.particles.length - 1400);
      }

      requestAnimationFrame(step);
    }

    
    resize();
    window.addEventListener('resize', resize, { passive: true });

    
    state.nextBurstAt = performance.now() + rand(450, 1100);

    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(step);
  } catch (e) {
    
  }
})();


function chooseDisplayName(discordUser) {
  if (!discordUser) return '';
  const g = (discordUser.global_name || '').toString().trim();
  const u = (discordUser.username || '').toString().trim();
  return g.length > 0 ? g : u;
}

// --- Flor / Rapunzel handler: preload + smooth transition + persistent aura ---
document.addEventListener('DOMContentLoaded', () => {
  console.log('[FLOR] Script loaded and DOM ready');
  try {
    const flor = document.getElementById('flor-badge');
    const backgroundVideo = document.getElementById('background');
    const overlay = document.getElementById('bg-transition-overlay');
    if (!flor || !backgroundVideo) return;

    // Hover effect: 15% chance to show tigre.png on mouseenter
    let isMouseOverFlor = false;
    
    flor.addEventListener('mouseenter', () => {
      try {
        isMouseOverFlor = true;
        // Don't change to tigre if Rapunzel is playing
        if (isRapunzelActive || window.__rapunzelActive) {
          return;
        }
        // 15% chance to show tigre.png
        const probability = 0.15;
        if (Math.random() < probability) {
          flor.src = 'assets/tigre.png';
          console.log('[FLOR] tigre.png activated');
        }
      } catch (e) {}
    });

    flor.addEventListener('mouseleave', () => {
      try {
        isMouseOverFlor = false;
        // Don't change if Rapunzel is playing
        if (isRapunzelActive || window.__rapunzelActive) {
          return;
        }
        // Always revert to flor.png when mouse leaves
        flor.src = 'assets/flor.png';
        console.log('[FLOR] reverted to flor.png');
      } catch (e) {}
    });
    
    // Global mousemove to ensure tigre only shows when mouse is over flor
    document.addEventListener('mousemove', () => {
      try {
        if (!isMouseOverFlor && !isRapunzelActive && !window.__rapunzelActive) {
          // Force revert to flor.png if mouse is not over flor
          if (flor.src.includes('tigre.png')) {
            flor.src = 'assets/flor.png';
            console.log('[FLOR] forced revert to flor.png (global check)');
          }
        }
      } catch (e) {}
    });

    flor.addEventListener('click', async (ev) => {
      try {
        console.log('[RAPUNZEL] flor click handler fired');
        ev.preventDefault();
        const florContainer = flor.closest('.badge-container');
        // save previous background state to restore after Rapunzel
        let prevBg = null;
        let overlayVideo = null;
        try {
          prevBg = {
            src: backgroundVideo.currentSrc || backgroundVideo.src || (backgroundVideo.getAttribute && backgroundVideo.getAttribute('src')) || null,
            bgIndex: (backgroundVideo && backgroundVideo.dataset) ? backgroundVideo.dataset.bgIndex : undefined,
            currentTime: (typeof backgroundVideo.currentTime === 'number') ? backgroundVideo.currentTime : 0,
            loop: !!backgroundVideo.loop
          };
        } catch (e) { prevBg = null; }
        // keep aura
        if (florContainer) florContainer.classList.add('force-sparkles');
        // show sticker in the bg index button immediately (direct DOM update for this scope)
        try {
          const display = document.getElementById('bg-index-display');
          if (display) display.innerHTML = '<img src="assets/sticker.gif" alt="sticker" style="width:20px;height:20px;display:block;">';
        } catch (e) {}
        // disable background-cycle button while Rapunzel plays
        try {
          const bgCycleBtn = document.getElementById('bg-cycle-button');
          if (bgCycleBtn) {
            bgCycleBtn.disabled = true;
            bgCycleBtn.classList.add('disabled-during-rapunzel');
          }
        } catch (e) {}

        // guard against double-activation (recover if flags are stale)
        try {
          console.log('[RAPUNZEL] flags before guard', window.__rapunzelActive, isRapunzelActive);
          if (window.__rapunzelActive || isRapunzelActive) {
            const overlayExists = !!document.getElementById('rapunzel-overlay-video');
            const bgSrc = (backgroundVideo && (backgroundVideo.currentSrc || backgroundVideo.src || ''));
            const rapBackgroundActive = bgSrc.includes('rapunzel');
            if (!overlayExists && !rapBackgroundActive) {
              console.log('[RAPUNZEL] stale active flags detected — resetting');
              window.__rapunzelActive = false;
              isRapunzelActive = false;
            } else {
              console.log('[RAPUNZEL] already active and running, ignoring');
              return;
            }
          }
        } catch (e) { console.error('[RAPUNZEL] guard check failed', e); }
        isRapunzelActive = true;
        window.__rapunzelActive = true;
        console.log('[RAPUNZEL] marked active');
        try { if (typeof updateBgIndexDisplay === 'function') updateBgIndexDisplay(); } catch (e) {}

        // show overlay (fade in) if available and perform same UI class changes as normal transitions
        try {
          if (overlay) {
            const fadeIn = 0.48;
            try {
              gsap.to(overlay, {
                opacity: 1,
                duration: fadeIn,
                ease: 'power2.in',
                onComplete: () => {
                  try {
                    document.body.classList.add('home-theme');
                    if (hackerOverlay) hackerOverlay.classList.add('hidden');
                    if (snowOverlay) snowOverlay.classList.add('hidden');
                    if (resultsButtonContainer) resultsButtonContainer.classList.add('hidden');
                    if (skillsBlock) skillsBlock.classList.add('hidden');
                    if (resultsHint) resultsHint.classList.add('hidden');
                    if (profileBlock) profileBlock.classList.remove('hidden');
                  } catch (e) {}
                }
              });
            } catch (e) {
              overlay.style.transition = `opacity ${fadeIn}s ease`;
              overlay.style.opacity = '1';
              try {
                    document.body.classList.add('home-theme');
                if (hackerOverlay) hackerOverlay.classList.add('hidden');
                if (snowOverlay) snowOverlay.classList.add('hidden');
                if (resultsButtonContainer) resultsButtonContainer.classList.add('hidden');
                if (skillsBlock) skillsBlock.classList.add('hidden');
                if (resultsHint) resultsHint.classList.add('hidden');
                if (profileBlock) profileBlock.classList.remove('hidden');
              } catch (e) {}
            }
          }
        } catch (e) { if (overlay) { overlay.style.transition = 'opacity 0.6s ease'; overlay.style.opacity = '1'; } }

        // preload rapunzel
        let pre = document.createElement('video');
        pre.src = 'assets/rapunzel.mp4';
        pre.preload = 'auto';
        pre.playsInline = true;
        let ready = false;
        const t = setTimeout(() => { if (!ready) ready = false; }, 3000);
        try {
          await new Promise((resolve) => {
            const onCan = () => { ready = true; pre.removeEventListener('canplay', onCan); resolve(true); };
            pre.addEventListener('canplay', onCan);
            pre.load();
            setTimeout(() => resolve(false), 2500);
          });
        } catch (e) {}

        // if preloaded, try to capture first frame as poster to avoid black frames
        try {
          if (pre && ready && pre.videoWidth && pre.videoHeight) {
            try {
              const c = document.createElement('canvas');
              c.width = pre.videoWidth;
              c.height = pre.videoHeight;
              const ctx = c.getContext('2d');
              ctx.drawImage(pre, 0, 0, c.width, c.height);
              const data = c.toDataURL('image/jpeg', 0.8);
              try { backgroundVideo.setAttribute('poster', data); } catch (e) {}
            } catch (e) { console.warn('[RAPUNZEL] poster capture failed', e); }
          }
        } catch (e) {}

        console.log('[RAPUNZEL] preload ready=', ready);

                    // keep aura
                    if (florContainer) { florContainer.classList.add('force-sparkles'); console.log('[RAPUNZEL] aura applied'); }
        try { backgroundVideo.loop = false; console.log('[RAPUNZEL] background.loop set false'); } catch (e) {}
        // suspend auto-resume behaviour while we switch to Rapunzel
        try { if (backgroundVideo && backgroundVideo.dataset) backgroundVideo.dataset.suspendAutoResume = '1'; } catch (e) {}
        // also set global suspend flag to stop other auto-resume hooks
        try { window.__suspendBgAutoResume = true; } catch (e) {}
        try { window.__suppressLowering = true; } catch (e) {}
        // temporarily disable loop-after-lobby lowering logic
        try { window.__countLoopsAfterLobby = false; } catch (e) {}
        try { window.__didLowerAfterFirstBgLoop = true; } catch (e) {}
        // pause/mute other audio sources (background-music)
        try {
          const bgMusicEl = document.getElementById('background-music');
          if (bgMusicEl) {
            try { bgMusicEl.pause(); } catch (e) {}
            try { bgMusicEl.muted = true; } catch (e) {}
            if (!bgMusicEl.dataset.origVolume) bgMusicEl.dataset.origVolume = String(bgMusicEl.volume || 0.5);
          }
        } catch (e) {}
        // Force Rapunzel as the main background (replace #background) to avoid overlay issues
        try {
          const nextSrc = pre && ready ? pre.src : 'assets/rapunzel.mp4';
          const fadeIn = 1.0;
          const fadeOut = 0.58;
                        console.log('[RAPUNZEL] bg-cycle button disabled');
          bgTransitionLock = true;

          console.log('[RAPUNZEL] starting transition to rapunzel, nextSrc=', nextSrc);

          // Step 1: Fade overlay to black (background -> negro)
          try {
            overlay.style.display = 'block';
            overlay.style.opacity = '0';
            overlay.style.zIndex = '2';
            overlay.style.pointerEvents = 'none';
            
            // Fade overlay to black
            setTimeout(() => {
              overlay.style.transition = `opacity ${fadeIn}s ease`;
              overlay.style.opacity = '1';
            }, 50);
          } catch (e) {}

          // Step 2: After overlay is black, change video and fade out overlay (negro -> rapunzel.mp4)
          setTimeout(() => {
            try {
              document.body.classList.add('home-theme');
              const hackerOverlayEl = document.getElementById('hacker-overlay');
              const snowOverlayEl = document.getElementById('snow-overlay');
              const resultsBtnCont = document.getElementById('results-button-container');
              const skillsBlockEl = document.getElementById('skills-block');
              const resultsHintEl = document.getElementById('results-hint');
              const profileBlockEl = document.getElementById('profile-block');
              if (hackerOverlayEl) hackerOverlayEl.classList.add('hidden');
              if (snowOverlayEl) snowOverlayEl.classList.add('hidden');
              if (resultsBtnCont) resultsBtnCont.classList.add('hidden');
              if (skillsBlockEl) skillsBlockEl.classList.add('hidden');
              if (resultsHintEl) resultsHintEl.classList.add('hidden');
              if (profileBlockEl) profileBlockEl.classList.remove('hidden');

              // Make background visible before changing to rapunzel
              backgroundVideo.style.visibility = 'visible';
              backgroundVideo.style.display = 'block';
              backgroundVideo.style.zIndex = '1';
              
              // Change video to rapunzel (but don't play yet)
              backgroundVideo.src = nextSrc;
              backgroundVideo.loop = false;
              backgroundVideo.muted = false;
              backgroundVideo.volume = 1.0;
              backgroundVideo.removeAttribute('muted');
              backgroundVideo.load();
              try { backgroundVideo.currentTime = 0; } catch (e) {}
              
              // Ensure user interaction for audio
              hasUserInteracted = true;
              
              // Wait for video to be ready, then wait 1 more second before playing and fading
              let videoReady = false;
              const onVideoReady = () => {
                if (videoReady) return;
                videoReady = true;
                backgroundVideo.removeEventListener('loadeddata', onVideoReady);
                backgroundVideo.removeEventListener('canplay', onVideoReady);
                
                console.log('[RAPUNZEL] video ready, waiting 1 second before play and fade');
                
                // Apply 60% transparency to menu
                try {
                  const profileBlock = document.getElementById('profile-block');
                  if (profileBlock) {
                    profileBlock.style.transition = 'opacity 0.5s ease';
                    profileBlock.style.opacity = '0.4';
                    console.log('[RAPUNZEL] menu opacity set to 0.4');
                  }
                } catch (e) {}
                
                // Wait 1 second before starting play and fade
                setTimeout(() => {
                  console.log('[RAPUNZEL] starting play and fade simultaneously');
                  
                  // Start playing video
                  backgroundVideo.play().then(() => {
                    console.log('[RAPUNZEL] rapunzel video playing with audio');
                    backgroundVideo.muted = false;
                    backgroundVideo.volume = 1.0;
                    refreshNameColorForCurrentBackground('#00CED1');
                  }).catch(err => { 
                    console.warn('[RAPUNZEL] background rapunzel play rejected', err); 
                    refreshNameColorForCurrentBackground('#00CED1');
                    try { 
                      backgroundVideo.muted = true; 
                      backgroundVideo.volume = 1.0; 
                      backgroundVideo.play().catch(()=>{}); 
                    } catch(e){} 
                  });
                  
                  // Fade out overlay simultaneously
                  overlay.style.transition = 'opacity 0.58s ease';
                  overlay.style.opacity = '0';
                  console.log('[RAPUNZEL] overlay fading out');
                  
                  bgTransitionLock = false;
                  console.log('[RAPUNZEL] transition complete');
                }, 1000); // Wait 1 second in black
              };
              
              backgroundVideo.addEventListener('loadeddata', onVideoReady, { once: true });
              backgroundVideo.addEventListener('canplay', onVideoReady, { once: true });
              
              // Fallback: if video doesn't load in 2 seconds, proceed anyway
              setTimeout(onVideoReady, 2000);
            } catch (e) { console.warn('[RAPUNZEL] transition error', e); }
          }, fadeIn * 1000 + 100); // Wait for overlay to fade to black
        } catch (e) { console.warn('[RAPUNZEL] forced background swap failed', e); }

        // on end: remove aura and advance
        const onEnd = (ev) => {
          try {
              // Only handle ended events triggered by the overlayVideo ending.
              try {
                if (ev && ev.target && overlayVideo && ev.target !== overlayVideo) {
                  console.log('[RAPUNZEL] onEnd ignored; not overlay');
                  return;
                }
              } catch (e) {}

              // remove any overlay video (not used in this swap mode)
              try {
                if (overlayVideo && overlayVideo.parentNode) {
                  try { overlayVideo.pause(); } catch (e) {}
                  try { overlayVideo.parentNode.removeChild(overlayVideo); } catch (e) {}
                  overlayVideo = null;
                }
              } catch (e) {}

              if (florContainer) florContainer.classList.remove('force-sparkles');
              isRapunzelActive = false;
              window.__rapunzelActive = false;
              bgTransitionLock = false;

              try { if (backgroundVideo && backgroundVideo.dataset) delete backgroundVideo.dataset.suspendAutoResume; } catch (e) {}

              // restore global suspend flag and keep normal background video audio
              try { window.__suspendBgAutoResume = false; } catch (e) {}
              try { window.__suppressLowering = false; } catch (e) {}
              try { window.__countLoopsAfterLobby = true; } catch(e) {}
              try { window.__bgSequenceManaged = true; } catch (e) {}
              try { window.__didLowerAfterFirstBgLoop = false; } catch(e) {}
              try {
                const bgMusicEl = document.getElementById('background-music');
                if (bgMusicEl) {
                  try { bgMusicEl.pause(); } catch (e) {}
                  try { bgMusicEl.muted = true; } catch (e) {}
                }
              } catch (e) {}

              // restore the previous background that was playing before Rapunzel with black transition
              try {
                console.log('[RAPUNZEL] starting transition back to background');
                
                // Restore menu opacity to normal
                try {
                  const profileBlock = document.getElementById('profile-block');
                  if (profileBlock) {
                    profileBlock.style.transition = 'opacity 0.5s ease';
                    profileBlock.style.opacity = '1';
                    console.log('[RAPUNZEL] menu opacity restored to 1');
                  }
                } catch (e) {}
                
                // Step 1: Fade overlay to black (rapunzel ends in black screen)
                try {
                  overlay.style.display = 'block';
                  overlay.style.opacity = '0';
                  overlay.style.zIndex = '2';
                  overlay.style.transition = 'opacity 0.5s ease';
                  setTimeout(() => {
                    overlay.style.opacity = '1';
                    console.log('[RAPUNZEL] overlay faded to black');
                  }, 50);
                } catch (e) {}
                
                // Step 2: After overlay is black, change to background and fade out overlay
                setTimeout(() => {
                  console.log('[RAPUNZEL] changing to background video');
                  try { backgroundVideo.style.display = 'block'; } catch(e) {}
                  try { backgroundVideo.style.visibility = 'visible'; } catch(e) {}
                  try { backgroundVideo.style.zIndex = '1'; } catch(e) {} // Restore z-index
                  try { backgroundVideo.pause(); } catch(e) {}
                  try { backgroundVideo.removeAttribute('poster'); } catch(e) {}
                  
                  // Use the previous background source if available, otherwise pick next
                  let restoreSrc = prevBg && prevBg.src ? prevBg.src : null;
                  if (!restoreSrc) {
                    restoreSrc = pickNextBackgroundSrc();
                  }
                  console.log('[RAPUNZEL] restoring background:', restoreSrc);
                  
                  backgroundVideo.src = restoreSrc;
                  backgroundVideo.loop = true;
                  backgroundVideo.muted = false;
                  backgroundVideo.volume = 0.08;
                  
                  // Restore bgIndex from prevBg if available
                  if (prevBg && typeof prevBg.bgIndex !== 'undefined') {
                    backgroundVideo.dataset.bgIndex = String(prevBg.bgIndex);
                    setLastBackgroundIndex(prevBg.bgIndex);
                  } else {
                    const match = restoreSrc.match(/background(\d+)/);
                    if (match) {
                      backgroundVideo.dataset.bgIndex = match[1];
                    } else {
                      try { delete backgroundVideo.dataset.bgIndex; } catch (e) {}
                    }
                  }
                  
                  backgroundVideo.load();
                  backgroundVideo.play().then(() => {
                    console.log('[RAPUNZEL] background video playing');
                  }).catch(err => { console.warn('[RAPUNZEL] background restore play rejected', err); try { backgroundVideo.muted = true; backgroundVideo.play().catch(()=>{}); } catch(e){} });
                  
                  // Fade out overlay to reveal background
                  setTimeout(() => {
                    console.log('[RAPUNZEL] fading out overlay to reveal background');
                    overlay.style.transition = 'opacity 0.58s ease';
                    overlay.style.opacity = '0';
                  }, 200);
                }, 600); // Wait for overlay to fade to black
                
                // Fallback: ensure overlay fades out after 2 seconds
                setTimeout(() => {
                  console.log('[RAPUNZEL] fallback: forcing overlay to fade out');
                  overlay.style.transition = 'opacity 0.58s ease';
                  overlay.style.opacity = '0';
                }, 2000);
              } catch (e) { console.warn('[RAPUNZEL] background restore failed', e); }

              try { if (typeof updateBgIndexDisplay === 'function') updateBgIndexDisplay(); } catch (e) {}
              // restore numeric display as a fallback for this scope
              try {
                const display = document.getElementById('bg-index-display');
                const bgIndex = (backgroundVideo && backgroundVideo.dataset && backgroundVideo.dataset.bgIndex) ? backgroundVideo.dataset.bgIndex : (sessionStorage.getItem('__bgVideoLastIndex') || '1');
                if (display) display.textContent = String(bgIndex);
              } catch (e) {}
              // re-enable background-cycle button
              try {
                const bgCycleBtn = document.getElementById('bg-cycle-button');
                if (bgCycleBtn) {
                  bgCycleBtn.disabled = false;
                  bgCycleBtn.classList.remove('disabled-during-rapunzel');
                }
              } catch (e) {}
              // ensure overlay hidden and reset for future use
              try { 
                if (overlay) {
                  overlay.style.display = 'block';
                  overlay.style.zIndex = '2';
                  overlay.style.transition = 'none';
                  overlay.style.opacity = '0';
                  // Force a reflow to ensure the opacity change takes effect
                  void overlay.offsetWidth;
                }
              } catch (e) { 
                if (overlay) { 
                  overlay.style.display = 'block';
                  overlay.style.zIndex = '2';
                  overlay.style.transition = 'none';
                  overlay.style.opacity = '0'; 
                } 
              }

          } catch (e) {}
        };

        try {
          if (overlayVideo) overlayVideo.addEventListener('ended', onEnd, { once: true });
          else backgroundVideo.addEventListener('ended', onEnd, { once: true });
        } catch (e) {}
      } catch (e) {}
    });
  } catch (e) {}
});


function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, ' ');
}

function _svgMusicNote() {
  return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';
}

function _svgController() {
  return '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="currentColor" d="M7 8h10a4 4 0 0 1 4 4v4a2 2 0 0 1-3.55 1.28L15.5 15h-7l-1.95 2.28A2 2 0 0 1 3 16v-4a4 4 0 0 1 4-4Zm1 4H6v2h2v2h2v-2h2v-2h-2v-2H8v2Zm10 0h-2v2h2v-2Zm-2 3h-2v2h2v-2Z"/>' +
    '</svg>';
}

function statusLabelEs(status) {
  const s = String(status || '').toLowerCase();
  const statusMap = {
    online: '',
    idle: 'Ausente',
    dnd: 'No molestar',
    offline: 'Desconectado'
  };
  return statusMap[s] || '';
}

function isPlaceholderActivity(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return true;
  return t === 'nada por ahora' || t === 'sin actividad' || t === 'none';
}

function cleanSpotifySongDisplay(text) {
  return String(text || '')
    .replace(/^escuchando\s*[:\-–—]?\s*/i, '')
    .replace(/^listening\s+to\s*[:\-–—]?\s*/i, '')
    .replace(/Spotify\s*[-–—:\s]*/ig, '')
    .trim();
}

function isListeningToSpotify(presenceLike) {
  try {
    const v = presenceLike ? presenceLike.listening_to_spotify : undefined;
    if (v === true) return true;
    if (v === false) return false;

    
    const hasSpotifyObj = !!(presenceLike && presenceLike.spotify);
    const hasSong = !!(hasSpotifyObj && (presenceLike.spotify.song || presenceLike.spotify.album_art_url));
    const acts = Array.isArray(presenceLike && presenceLike.activities) ? presenceLike.activities : [];
    const hasSpotifyAct = acts.some(a => a && String(a.name || '').toLowerCase() === 'spotify' && (a.details || a.state || a.assets));
    return hasSong || hasSpotifyAct;
  } catch (e) {
    return false;
  }
}


let _lastSpotifyTransitionKey = '';

function _buildSpotifyTransitionKey(presenceLike, spotifySong, spotifyArtist, albumArtUrl) {
  try {
    const p = presenceLike || {};
    const sp = (p && p.spotify) ? p.spotify : {};
    const trackId = String(sp.track_id || sp.trackId || '').trim();
    const song = String(spotifySong || sp.song || '').trim();
    const artist = String(spotifyArtist || sp.artist || '').trim();
    const art = String(albumArtUrl || sp.album_art_url || sp.albumArtUrl || '').trim();
    
    return [trackId || '(no-track-id)', song, artist, art].join('||');
  } catch (e) {
    return '';
  }
}

function _beginSpotifySwapIfChanged(handleCard, newKey) {
  try {
    const card = handleCard || document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
    if (!card) return { active: false, card: null };

    const key = String(newKey || '').trim();

    
    if (!key) {
      _lastSpotifyTransitionKey = '';
      try { card.classList.remove('spotify-swap'); } catch(e) {}
      return { active: false, card };
    }

    const isSame = !!(_lastSpotifyTransitionKey && key === _lastSpotifyTransitionKey);
    const isSongToSongChange = !!(_lastSpotifyTransitionKey && !isSame);
    _lastSpotifyTransitionKey = key;

    if (isSongToSongChange) {
      try { card.classList.add('spotify-swap'); } catch(e) {}
      return { active: true, card };
    }

    return { active: false, card };
  } catch (e) {
    return { active: false, card: null };
  }
}

function _endSpotifySwap(cardLike) {
  try {
    const card = cardLike || document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
    if (!card) return;
    
    try {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try { card.classList.remove('spotify-swap'); } catch(e) {}
        });
      });
    } catch (e) {
      setTimeout(() => { try { card.classList.remove('spotify-swap'); } catch(_){} }, 0);
    }
  } catch (e) {}
}

function pickBestNonSpotifyActivity(activities) {
  const list = Array.isArray(activities) ? activities : [];
  const visible = filterIgnoredActivities(list).filter(a => a && a.type !== 4);
  const nonSpotify = visible.filter(a => String(a.name || '').toLowerCase() !== 'spotify');
  return (
    nonSpotify.find(a => a.type === 0 && a.name) ||
    nonSpotify.find(a => a.name) ||
    null
  );
}


function renderActivity(activityText, spotifySong, spotifyArtist) {
  const act = (activityText || '').toString().trim();
  const spotifyRaw = spotifySong ? spotifySong.toString() : '';
  const spotifyClean = spotifyRaw.replace(/Spotify\s*[-–—:\s]*/ig, '').trim();
  const hasSong = spotifyClean.length > 0;

  const artistRaw = (spotifyArtist || '').toString();
  const artistClean = artistRaw
    .replace(/Spotify\s*[-–—:\s]*/ig, '')
    .replace(/\s*;\s*/g, ', ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const hasArtist = artistClean.length > 0;

  function truncateWithDots(str, maxChars) {
    const s = String(str || '');
    const n = Math.max(0, Number(maxChars) || 0);
    if (!n) return '';
    return s.length > n ? (s.slice(0, n) + '...') : s;
  }
  const activityShort = truncateWithDots(act, 16);
  const safeAct = activityShort.length > 0 ? escapeHtml(activityShort) : '';
  const activityLine = safeAct
    ? ('<span class="handle-activity-line">' +
        '<span class="activity-controller">' + _svgController() + '</span>' +
        '<span class="handle-activity-title">' + safeAct + '</span>' +
      '</span>')
    : '';

  if (hasSong) {
    const noteHtml = '<span class="global-name-note">' + _svgMusicNote() + '</span>';
    const songShort = truncateWithDots(spotifyClean, 18);
    const artistShort = truncateWithDots(artistClean, 9);
    const combinedText = hasArtist
      ? `${songShort} | ${artistShort}`
      : `${songShort}`;
    const right = '<span class="handle-spotify">' + noteHtml + '<span class="handle-spotify-title">' + escapeHtml(combinedText) + '</span></span>';

    
    if (activityLine) {
      return (
        '<div class="handle-activity-top is-spotify">' + right + '</div>' +
        '<div class="handle-activity-bottom is-activity">' + activityLine + '</div>'
      );
    }

    
    return '<div class="handle-activity-top only is-spotify">' + right + '</div>';
  }

  if (activityLine) return '<div class="handle-activity-top only is-activity">' + activityLine + '</div>';
  return '';
}


function filterIgnoredActivities(arr) {
  try {
    const list = Array.isArray(arr) ? arr : (arr ? [arr] : []);
    return list.filter(a => {
      if (!a) return false;
      const appId = String((a.applicationId || a.application_id || (a.application && a.application.id) || '')).trim();
      return appId !== '914970580812447764';
    });
  } catch (e) {
    return Array.isArray(arr) ? arr : [];
  }
}

function cleanActivityLabel(text) {
  const t = String(text || '').trim();
  if (!t) return '';
  
  return t
    .replace(/^jugando\s+a\s*[:\-–—]?\s*/i, '')
    .replace(/^viendo\s+[:\-–—]?\s*/i, '')
    .replace(/^escuchando\s+[:\-–—]?\s*/i, '')
    .trim();
}




function normalizePresencePayload(raw) {
  const obj = (raw && typeof raw === 'object') ? raw : {};

  
  if (obj.discord_user || obj.activities || obj.spotify) {
    
    try {
      if (obj.discord_user && !obj.discord_user.avatar_url && obj.avatar_url) {
        obj.discord_user.avatar_url = obj.avatar_url;
      }
    } catch (e) {}
    
    if (!obj.last_seen_timestamp && obj.last_seen) {
      const ms = Date.parse(obj.last_seen);
      if (!Number.isNaN(ms)) obj.last_seen_timestamp = ms;
    }

    
    try {
      if (!obj.activities && Array.isArray(obj.discord_activities)) {
        obj.activities = obj.discord_activities;
      }
    } catch (e) {}

    return obj;
  }

  
  const discordId = obj.discord_id || obj.id || obj.user_id;
  const username = obj.username || obj.discord_username;
  const globalName = obj.discord_global_name || obj.global_name || obj.display_name;
  const avatarUrl = obj.avatar_url || obj.discord_avatar || obj.avatar;
  const decorationUrl = obj.discord_decoration || obj.avatar_decoration_url;
  const discordStatus = (obj.discord_status || obj.status || '').toString().toLowerCase();

  const activityText = obj.activity || obj.song || '';
  let activityClean = cleanActivityLabel(activityText);
  if (isPlaceholderActivity(activityClean)) activityClean = '';
  const artUrl = obj.song_art_url || obj.activity_art_url || obj.art_url || null;

  
  
  let listeningToSpotify = undefined;
  try {
    if (typeof obj.listening_to_spotify === 'boolean') listeningToSpotify = obj.listening_to_spotify;
    else if (typeof obj.listeningToSpotify === 'boolean') listeningToSpotify = obj.listeningToSpotify;
  } catch (e) {}
  if (typeof listeningToSpotify !== 'boolean') {
    const hasSongText = !!String(obj.song || obj.spotify_song || '').trim();
    const hasArt = !!String(artUrl || '').trim();
    listeningToSpotify = hasSongText || hasArt;
  }

  
  const activities = activityClean
    ? [{ type: 0, name: activityClean }]
    : [];

  
  const discordActivities = Array.isArray(obj.discord_activities) ? obj.discord_activities : null;

  
  const robloxUser = {
    username: obj.roblox_username || null,
    display_name: obj.roblox_display_name || null,
    avatar_url: obj.roblox_avatar || null,
    body_avatar_url: obj.roblox_body_avatar || null,
    friends_count: typeof obj.roblox_friends === 'number' ? obj.roblox_friends : null,
    bio: obj.roblox_bio || null,
    link: obj.roblox_link || null
  };

  const out = {
    discord_status: discordStatus,
    status: discordStatus,
    discord_user: {
      id: discordId,
      username: username,
      global_name: globalName,
      avatar_url: avatarUrl,
      avatar_decoration_url: decorationUrl
    },
    activities: discordActivities || activities,
    
    spotify: (listeningToSpotify && artUrl) ? { album_art_url: artUrl } : null,
    listening_to_spotify: !!listeningToSpotify,
    roblox_user: (robloxUser.username || robloxUser.display_name || robloxUser.avatar_url) ? robloxUser : null
  };

  
  if (obj.last_seen) {
    const ms = Date.parse(obj.last_seen);
    if (!Number.isNaN(ms)) out.last_seen_timestamp = ms;
  }

  return out;
}



function resolveStatusFromDesktop(presenceObj, payloadObj) {
  try {
    const fallback = (presenceObj && (presenceObj.discord_status || presenceObj.status)) || (payloadObj && (payloadObj.discord_status || payloadObj.status)) || null;
    if (fallback) {
      const sf = String(fallback).toLowerCase();
      if (sf === 'do not disturb' || sf === 'do_not_disturb') return 'dnd';
      if (sf === 'away' || sf === 'idle') return 'idle';
      if (sf === 'online' || sf === 'active') return 'online';
      if (sf === 'offline' || sf === 'invisible') return 'offline';
      if (['online','idle','dnd','offline'].includes(sf)) return sf;
    }

    const hasDesktop = !!(presenceObj && presenceObj.active_on_discord_desktop) || !!(payloadObj && payloadObj.active_on_discord_desktop);
    const hasMobile = !!(presenceObj && presenceObj.active_on_discord_mobile) || !!(payloadObj && payloadObj.active_on_discord_mobile);
    const hasWeb = !!(presenceObj && presenceObj.active_on_discord_web) || !!(payloadObj && payloadObj.active_on_discord_web);
    if (hasDesktop || hasMobile || hasWeb) return 'online';
    return 'offline';
  } catch (e) { return 'offline'; }
}




let _lastOfflineAt = null;
try {
  const stored = localStorage.getItem('lastOfflineAt');
  if (stored) _lastOfflineAt = parseInt(stored, 10) || null;
} catch (e) { _lastOfflineAt = null; }
let _offlineTickerId = null;

function formatTimeAgo(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} ${s === 1 ? 'segundo' : 'segundos'}`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(m / 60);
  if (h < 24) {
    const remMin = m % 60;
    if (remMin === 0) return `${h} ${h === 1 ? 'hora' : 'horas'}`;
    return `${h} ${h === 1 ? 'hora' : 'horas'} ${remMin} ${remMin === 1 ? 'minuto' : 'minutos'}`;
  }
  const d = Math.floor(h / 24);
  const remH = h % 24;
  if (remH === 0) return `${d} ${d === 1 ? 'día' : 'días'}`;
  return `${d} ${d === 1 ? 'día' : 'días'} ${remH} ${remH === 1 ? 'hora' : 'horas'}`;
}

function getOfflineText() {
  if (!_lastOfflineAt) return 'Desconectado';
  const diff = Date.now() - _lastOfflineAt;
  return `Desconectado hace ${formatTimeAgo(diff)}`;
}


function getTiempoDesconectadoText() {
  try {
    const el = document.getElementById('tiempo-desconectado');
    if (!el) return null;
    const t = String(el.textContent || '').trim();
    return t && t.length ? t : null;
  } catch (e) { return null; }
}





function updateInlineAlbum(url) {
  try {
    
    try {
      document.querySelectorAll('.handle-album-art.inline').forEach(n => {
        try { n.remove(); } catch(e) {}
      });
    } catch (e) {}

    const handleCard = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
    if (!handleCard) return;
    const album = handleCard.querySelector('.handle-album-art:not(.inline)') || handleCard.querySelector('.handle-album-art');
    if (!album) return;

    if (!url) {
      try { album.src = ''; } catch(e) {}
      try { album.style.display = 'none'; } catch(e) {}
      return;
    }

    const srcToSet = url + '?_=' + Date.now();
    album.src = srcToSet;
    album.alt = 'Album art';
    album.style.display = '';
    album.classList.remove('inline');
    album.onerror = function() {
      try {
        this.onerror = null;
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">'
                  + '<rect fill="#1DB954" width="24" height="24" rx="4"/>'
                  + '<path fill="#fff" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>'
                  + '</svg>';
        this.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
        this.style.display = '';
      } catch(e) { try { this.style.display = 'none'; } catch(_){} }
    };
  } catch (e) { console.warn('updateInlineAlbum error', e); }
}


function setHandleMusicState(hasMusic) {
  try {
    const handleCard = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
    if (!handleCard) return;
    if (hasMusic) {
      handleCard.classList.remove('no-music');
      handleCard.classList.add('has-music');
    } else {
      handleCard.classList.remove('has-music');
      handleCard.classList.add('no-music');
      _lastSpotifyTransitionKey = '';
      
      try { const inlineAlbum = handleCard.querySelector('.handle-album-art.inline'); if (inlineAlbum) inlineAlbum.remove(); } catch(e){}
      try { const abs = handleCard.querySelector('.handle-album-art:not(.inline)'); if (abs) abs.style.display = 'none'; } catch(e){}
    }
  } catch(e) { }
}

function syncHandleActivityState(activityEl) {
  try {
    if (!activityEl) return;
    const hasStructuredContent = !!activityEl.querySelector('.handle-activity-top, .handle-activity-bottom, .handle-activity-line, .handle-spotify, .handle-spotify-title');
    const plainText = String(activityEl.textContent || '').replace(/\u200B/g, '').trim();
    const hasContent = hasStructuredContent || plainText.length > 0;

    activityEl.classList.toggle('has-content', hasContent);

    const textWrap = activityEl.closest('.handle-text-content');
    if (textWrap) textWrap.classList.toggle('has-activity', hasContent);

    if (!hasContent) {
      try { activityEl.innerHTML = ''; } catch (e) {}
      try {
        activityEl.style.display = '';
        activityEl.style.fontSize = '';
        activityEl.style.fontStyle = '';
        activityEl.style.verticalAlign = '';
      } catch (e) {}
    }
  } catch (e) {}
}

function bindHandleActivityWatcher() {
  try {
    const activityEl = document.querySelector('#discord-handle-global .handle-activity') || document.querySelector('.discord-handle .handle-activity');
    if (!activityEl) return;

    if (activityEl.dataset.activityWatcherBound !== '1') {
      const observer = new MutationObserver(() => syncHandleActivityState(activityEl));
      observer.observe(activityEl, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      activityEl.dataset.activityWatcherBound = '1';
    }

    syncHandleActivityState(activityEl);
  } catch (e) {}
}

function startOfflineTicker(activityEl) {
  if (_offlineTickerId) return; 
  if (!activityEl) return;
  
  activityEl.style.fontSize = '13px';
  activityEl.style.fontStyle = 'normal';
  activityEl.style.display = 'inline-flex';
  activityEl.style.verticalAlign = 'middle';
  activityEl.textContent = getTiempoDesconectadoText() || getOfflineText();
  syncHandleActivityState(activityEl);
  _offlineTickerId = setInterval(() => {
    try {
      activityEl.textContent = getTiempoDesconectadoText() || getOfflineText();
      syncHandleActivityState(activityEl);
    } catch (e) {}
  }, 60000); 
}

function stopOfflineTicker(activityEl) {
  if (_offlineTickerId) { clearInterval(_offlineTickerId); _offlineTickerId = null; }
  _lastOfflineAt = null;
  try { localStorage.removeItem('lastOfflineAt'); } catch(e) {}
  if (activityEl) {
    
    try { activityEl.textContent = ''; activityEl.style.fontSize = ''; activityEl.style.fontStyle = ''; activityEl.style.display = ''; } catch (e) {}
    syncHandleActivityState(activityEl);
  }
}



try {
  if (_lastOfflineAt) {
    const initialActivityEl = document.querySelector('.handle-activity');
    if (initialActivityEl) startOfflineTicker(initialActivityEl);
  }
} catch (e) {}

document.addEventListener('DOMContentLoaded', () => {
  try { bindHandleActivityWatcher(); } catch (e) {}
});

function initMedia() {
  console.log("initMedia called");
  const backgroundMusic = document.getElementById('background-music');
  const backgroundElem = document.getElementById('background');
  if (!backgroundMusic || !backgroundElem) {
    console.error("Media elements not found");
    return;
  }
  backgroundMusic.volume = 0.3;
  
  try {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      if (!backgroundMusic.dataset.origVolume) backgroundMusic.dataset.origVolume = String(backgroundMusic.volume);
      try { backgroundMusic.volume = 0.06; } catch (e) {}
    }
  } catch (e) {}
  
  
  if (backgroundElem.tagName === 'VIDEO') {
    if (!window.__bgSequenceManaged) {
      backgroundElem.muted = true;
      // don't forcibly pause here — startup sequencing may set up playback later
    }
    try { ensureBackgroundVideoUnpausable(backgroundElem); } catch (e) {}
  } else {
    
    backgroundElem.style.display = 'none';
  }
}

function ensureBackgroundVideoUnpausable(videoEl) {
  try {
    if (!videoEl || videoEl.tagName !== 'VIDEO') return;
    if (videoEl.dataset && videoEl.dataset.unpausableBound === '1') return;
    try { if (videoEl.dataset) videoEl.dataset.unpausableBound = '1'; } catch (e) {}

    
    try { videoEl.controls = false; } catch (e) {}
    try { videoEl.disablePictureInPicture = true; } catch (e) {}
    try { videoEl.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback'); } catch (e) {}
    try { videoEl.setAttribute('playsinline', ''); } catch (e) {}
    try { videoEl.loop = true; } catch (e) {}
    try { videoEl.preload = 'auto'; } catch (e) {}

    const tryResume = () => {
      try {
        // if page hidden, or caller requested suspension, don't auto-resume
        try {
          if (document.hidden) return;
          // do not resume if Rapunzel is active
          if (typeof window !== 'undefined' && (window.__rapunzelActive === true || (typeof isRapunzelActive !== 'undefined' && isRapunzelActive))) return;
          if (videoEl.dataset && videoEl.dataset.suspendAutoResume === '1') return;
          if (typeof window !== 'undefined' && window.__suspendBgAutoResume === true) return;
        } catch (e) {}
        if (videoEl.paused) videoEl.play().catch(() => {
          try { videoEl.muted = true; videoEl.play().catch(() => {}); } catch (e) {}
        });
      } catch (e) {}
    };

    
    videoEl.addEventListener('pause', tryResume, { passive: true });
    videoEl.addEventListener('ended', tryResume, { passive: true });
    videoEl.addEventListener('emptied', tryResume, { passive: true });

    
    document.addEventListener('visibilitychange', () => {
      try { if (!document.hidden) tryResume(); } catch (e) {}
    }, { passive: true });

    
    setTimeout(tryResume, 60);
    setTimeout(tryResume, 350);
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const startText = document.getElementById('start-text');
  
  const profileBio = document.getElementById('profile-bio');
  const visitorCount = document.getElementById('visitor-count');
  const backgroundMusic = document.getElementById('background-music');
  const homeButton = document.getElementById('home-theme');
  const bgCycleButton = document.getElementById('bg-cycle-button');
  const resultsButtonContainer = document.getElementById('results-button-container');
  const resultsButton = document.getElementById('results-theme');
  const volumeIcon = document.getElementById('volume-icon');
  const volumeSlider = document.getElementById('volume-slider');
  const transparencySlider = document.getElementById('transparency-slider');
  const backgroundVideo = document.getElementById('background');
  const hackerOverlay = document.getElementById('hacker-overlay');
  const snowOverlay = document.getElementById('snow-overlay');
  const glitchOverlay = document.querySelector('.glitch-overlay');
  const profileBlock = document.getElementById('profile-block');
  const skillsBlock = document.getElementById('skills-block');
  const pythonBar = document.getElementById('python-bar');
  const cppBar = document.getElementById('cpp-bar');
  const csharpBar = document.getElementById('csharp-bar');
  const resultsHint = document.getElementById('results-hint');
  const profilePicture = document.querySelector('.profile-picture');
  const profileContainer = document.querySelector('.profile-container');
  const socialIcons = document.querySelectorAll('.social-icon');
  const badges = document.querySelectorAll('.badge');

  // Background debug instrumentation (enable by setting window.__bgDebug = true before load)
  try {
    if (typeof window !== 'undefined') {
      try {
        window.enableBgDebug = function() { try { window.__bgDebug = true; console.log('[BGDBG] set __bgDebug=true; reload to activate'); } catch(e){} };
        window.disableBgDebug = function() { try { window.__bgDebug = false; console.log('[BGDBG] set __bgDebug=false'); } catch(e){} };
      } catch (e) {}
    }
    if (window.__bgDebug && backgroundVideo) {
      const dbg = (ev) => {
        try {
          console.log('[BGDBG]', ev.type, { time: new Date().toISOString(), src: backgroundVideo.currentSrc || backgroundVideo.src, currentTime: backgroundVideo.currentTime, paused: backgroundVideo.paused });
          if (ev.type === 'error') console.log('[BGDBG] videoError', backgroundVideo.error);
        } catch (e) {}
      };
      ['play','playing','pause','waiting','stalled','timeupdate','ended','error','loadeddata','canplay'].forEach(name => {
        try { backgroundVideo.addEventListener(name, dbg); } catch (e) {}
      });
      console.log('[BGDBG] instrumentation installed');
    }
  } catch (e) {}

  const BG_MIN = 1;
  const BG_MAX = 12;
  const BG_LAST_KEY = '__bgVideoLastIndex';
  const BG_BAG_KEY = '__bgVideoBag';

  function clampBackgroundIndex(n) {
    const value = parseInt(n, 10);
    if (!Number.isFinite(value)) return null;
    return Math.max(BG_MIN, Math.min(BG_MAX, value));
  }

  function buildBackgroundSrc(index) {
    return 'assets/background' + index + '.mp4';
  }

  function shuffleBackgroundBag(bag) {
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = bag[i];
      bag[i] = bag[j];
      bag[j] = tmp;
    }
    return bag;
  }

  function buildAllBackgroundIndices() {
    const indices = [];
    for (let i = BG_MIN; i <= BG_MAX; i++) indices.push(i);
    return indices;
  }

  function loadBackgroundBag() {
    try {
      const raw = sessionStorage.getItem(BG_BAG_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return null;
      const filtered = parsed
        .map(value => clampBackgroundIndex(value))
        .filter(value => typeof value === 'number');
      return filtered.length ? filtered : null;
    } catch (e) {
      return null;
    }
  }

  function saveBackgroundBag(bag) {
    try { sessionStorage.setItem(BG_BAG_KEY, JSON.stringify(bag || [])); } catch (e) {}
  }

  function getLastBackgroundIndex() {
    try { return clampBackgroundIndex(sessionStorage.getItem(BG_LAST_KEY)); } catch (e) { return null; }
  }

  function setLastBackgroundIndex(index) {
    try { sessionStorage.setItem(BG_LAST_KEY, String(index)); } catch (e) {}
  }

  function updateBgIndexDisplay() {
    try {
      const display = document.getElementById('bg-index-display');
      if (!display || !backgroundVideo) return;
      const rapunzelActive = (typeof window !== 'undefined' && window.__rapunzelActive === true) || (typeof isRapunzelActive !== 'undefined' && isRapunzelActive);
      if (rapunzelActive) {
        display.innerHTML = '<img src="assets/sticker.gif" alt="sticker" style="width:20px;height:20px;display:block">';
        return;
      }
      const bgIndex = backgroundVideo.dataset.bgIndex || getLastBackgroundIndex();
      if (bgIndex) display.textContent = String(bgIndex);
    } catch (e) {}
  }

  // activateRapunzel() was replaced by a more robust handler added at the end

  function refillBackgroundBagAvoidingRepeat(lastIndex) {
    const bag = shuffleBackgroundBag(buildAllBackgroundIndices());
    if (typeof lastIndex === 'number' && bag.length > 1 && bag[0] === lastIndex) {
      const swapIndex = 1 + Math.floor(Math.random() * (bag.length - 1));
      const tmp = bag[0];
      bag[0] = bag[swapIndex];
      bag[swapIndex] = tmp;
    }
    return bag;
  }

  function pickNextBackgroundSrc() {
    try {
      let bag = loadBackgroundBag();
      const lastIndex = getLastBackgroundIndex();
      if (!bag || !bag.length) {
        bag = refillBackgroundBagAvoidingRepeat(lastIndex);
      }

      let chosenIndex = null;
      while (bag.length) {
        const candidate = clampBackgroundIndex(bag.shift());
        if (typeof candidate === 'number' && candidate !== lastIndex) {
          chosenIndex = candidate;
          break;
        }
      }

      if (chosenIndex === null) {
        const remaining = buildAllBackgroundIndices().filter(index => index !== lastIndex);
        chosenIndex = remaining.length ? remaining[Math.floor(Math.random() * remaining.length)] : (lastIndex || BG_MIN);
      }

      saveBackgroundBag(bag);
      setLastBackgroundIndex(chosenIndex);
      return buildBackgroundSrc(chosenIndex);
    } catch (e) {
      const fallbackIndex = Math.floor(Math.random() * (BG_MAX - BG_MIN + 1)) + BG_MIN;
      try { setLastBackgroundIndex(fallbackIndex); } catch (err) {}
      return buildBackgroundSrc(fallbackIndex);
    }
  }

  const controlsBar = document.querySelector('.controls');

  
  const cursor = document.querySelector('.custom-cursor');
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

  const nameColorCanvas = document.createElement('canvas');
  nameColorCanvas.width = 32;
  nameColorCanvas.height = 18;
  const nameColorCtx = nameColorCanvas.getContext('2d', { willReadFrequently: true });
  const nameColorState = {
    r: 64,
    g: 95,
    b: 202,
  };

  function updateNameStroke(color) {
    try {
      const red = Math.max(0, Math.min(255, Number(color && color.r) || 0));
      const green = Math.max(0, Math.min(255, Number(color && color.g) || 0));
      const blue = Math.max(0, Math.min(255, Number(color && color.b) || 0));
      const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      const stroke = luminance < 0.42
        ? 'rgba(255, 255, 255, 0.28)'
        : 'rgba(0, 0, 0, 0.22)';
      document.body.style.setProperty('--name-stroke', stroke);
    } catch (e) {}
  }

  function rgbToCssVars(color) {
    const next = {
      r: Math.max(0, Math.min(255, Math.round(color.r))),
      g: Math.max(0, Math.min(255, Math.round(color.g))),
      b: Math.max(0, Math.min(255, Math.round(color.b))),
    };

    nameColorState.r = next.r;
    nameColorState.g = next.g;
    nameColorState.b = next.b;

    try {
      document.body.style.setProperty('--name-r', String(next.r));
      document.body.style.setProperty('--name-g', String(next.g));
      document.body.style.setProperty('--name-b', String(next.b));
      updateNameStroke(next);
    } catch (e) {}
  }

  function mixNameColor(color, amount = 0.28) {
    const a = Math.max(0, Math.min(1, amount));
    rgbToCssVars({
      r: nameColorState.r + (color.r - nameColorState.r) * a,
      g: nameColorState.g + (color.g - nameColorState.g) * a,
      b: nameColorState.b + (color.b - nameColorState.b) * a,
    });
  }

  function vivifyNameColor(color) {
    const rawR = Math.max(0, Math.min(255, color.r));
    const rawG = Math.max(0, Math.min(255, color.g));
    const rawB = Math.max(0, Math.min(255, color.b));
    const rawLuminance = (0.2126 * rawR + 0.7152 * rawG + 0.0722 * rawB) / 255;

    if (rawLuminance <= 0.24) {
      return { r: rawR, g: rawG, b: rawB };
    }

    let r = rawR / 255;
    let g = rawG / 255;
    let b = rawB / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    if (delta !== 0) {
      s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
      h /= 6;
      if (h < 0) h += 1;
    }

    s = Math.min(1, s * 1.35 + 0.12);
    l = Math.min(0.72, Math.max(0.18, l));

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let nr;
    let ng;
    let nb;
    if (s === 0) {
      nr = ng = nb = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      nr = hue2rgb(p, q, h + 1 / 3);
      ng = hue2rgb(p, q, h);
      nb = hue2rgb(p, q, h - 1 / 3);
    }

    return { r: nr * 255, g: ng * 255, b: nb * 255 };
  }

  function applyReadableTextColor(color) {
    try {
      const red = Math.max(0, Math.min(255, Number(color && color.r) || 0));
      const green = Math.max(0, Math.min(255, Number(color && color.g) || 0));
      const blue = Math.max(0, Math.min(255, Number(color && color.b) || 0));
      const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
      const textColor = luminance > 0.55 ? '#000000' : '#ffffff';
      document.documentElement.style.setProperty('--video-text-color', textColor);
    } catch (e) {}
  }

  function ambientizeNameColor(color) {
    const red = Math.max(0, Math.min(255, color.r));
    const green = Math.max(0, Math.min(255, color.g));
    const blue = Math.max(0, Math.min(255, color.b));
    const average = (red + green + blue) / 3;
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
    const softness = 0.34;
    const lightnessLift = luminance < 0.45 ? 1.12 : 0.92;

    return {
      r: (average + (red - average) * (1 - softness)) * lightnessLift,
      g: (average + (green - average) * (1 - softness)) * lightnessLift,
      b: (average + (blue - average) * (1 - softness)) * lightnessLift,
    };
  }

  function setNameColorFallback(hexColor) {
    const cleanHex = String(hexColor || '').replace('#', '');
    const value = cleanHex.length === 3
      ? cleanHex.split('').map((char) => char + char).join('')
      : cleanHex;
    const parsed = parseInt(value || '4075ca', 16);
    const fallbackColor = {
      r: (parsed >> 16) & 255,
      g: (parsed >> 8) & 255,
      b: parsed & 255,
    };
    rgbToCssVars(vivifyNameColor(fallbackColor));
    applyReadableTextColor(fallbackColor);
  }

  function deriveColorFromFrame() {
    if (!backgroundVideo || !nameColorCtx) return null;

    const width = backgroundVideo.videoWidth || backgroundVideo.naturalWidth || backgroundVideo.clientWidth || 0;
    const height = backgroundVideo.videoHeight || backgroundVideo.naturalHeight || backgroundVideo.clientHeight || 0;
    if (!width || !height) return null;

    try {
      nameColorCtx.drawImage(backgroundVideo, 0, 0, nameColorCanvas.width, nameColorCanvas.height);
      const pixels = nameColorCtx.getImageData(0, 0, nameColorCanvas.width, nameColorCanvas.height).data;

      let bestVividness = 0;
      let bestColor = null;
      const step = 4; // Sample every 4th pixel for performance

      for (let i = 0; i < pixels.length; i += 4 * step) {
        const red = pixels[i];
        const green = pixels[i + 1];
        const blue = pixels[i + 2];
        const alpha = pixels[i + 3] / 255;
        
        if (alpha <= 0.1) continue; // Skip transparent pixels

        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);
        const saturation = max === 0 ? 0 : (max - min) / max;
        const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
        
        // Calculate vividness (how eye-catching the color is)
        // High saturation and medium luminance make colors more eye-catching
        const vividness = saturation * saturation * (1 - Math.abs(luminance - 0.5) * 0.5);
        
        if (vividness > bestVividness) {
          bestVividness = vividness;
          bestColor = { r: red, g: green, b: blue };
        }
      }

      if (!bestColor) return null;

      // Boost the vivid color even more
      const max = Math.max(bestColor.r, bestColor.g, bestColor.b);
      const min = Math.min(bestColor.r, bestColor.g, bestColor.b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      
      const boost = 1.5;
      const avg = (bestColor.r + bestColor.g + bestColor.b) / 3;
      
      return {
        r: Math.min(255, Math.max(0, avg + (bestColor.r - avg) * boost)),
        g: Math.min(255, Math.max(0, avg + (bestColor.g - avg) * boost)),
        b: Math.min(255, Math.max(0, avg + (bestColor.b - avg) * boost)),
      };
    } catch (e) {
      return null;
    }
  }

  function sampleNameColorFromBackground() {
    const sampled = deriveColorFromFrame();
    if (sampled) {
      // Apply the dominant color directly for more visible changes
      rgbToCssVars(vivifyNameColor(sampled));
      applyReadableTextColor(sampled);
    }
  }

  function stopNameColorTracking() {
    nameColorState.active = false;
    if (nameColorState.timerId) {
      try { clearInterval(nameColorState.timerId); } catch (e) {}
      nameColorState.timerId = 0;
    }
    if (nameColorState.videoFrameId && backgroundVideo && typeof backgroundVideo.cancelVideoFrameCallback === 'function') {
      try { backgroundVideo.cancelVideoFrameCallback(nameColorState.videoFrameId); } catch (e) {}
      nameColorState.videoFrameId = 0;
    }
  }

  function startNameColorTracking() {
    if (!backgroundVideo) return;
    if (nameColorState.active) return;
    stopNameColorTracking();
    nameColorState.active = true;

    const isVideo = backgroundVideo.tagName === 'VIDEO';
    if (!isVideo) {
      sampleNameColorFromBackground();
      return;
    }

    const tick = () => {
      if (!nameColorState.active) return;
      sampleNameColorFromBackground();

      if (typeof backgroundVideo.requestVideoFrameCallback === 'function') {
        try {
          nameColorState.videoFrameId = backgroundVideo.requestVideoFrameCallback(() => tick());
        } catch (e) {
          nameColorState.timerId = window.setTimeout(tick, 30);
        }
      } else {
        nameColorState.timerId = window.setTimeout(tick, 30);
      }
    };

    tick();
  }

  function refreshNameColorForCurrentBackground(primaryColor) {
    if (!backgroundVideo) return;

    if (backgroundVideo.tagName === 'VIDEO') {
      startNameColorTracking();
    } else {
      stopNameColorTracking();
      setNameColorFallback(primaryColor);
    }
  }

  if (backgroundVideo) {
    const syncNameColor = () => {
      if (backgroundVideo.tagName === 'VIDEO') {
        startNameColorTracking();
      } else {
        sampleNameColorFromBackground();
      }
    };

    const stopWhenUnavailable = () => {
      stopNameColorTracking();
    };

    ['load', 'loadeddata', 'loadedmetadata', 'canplay', 'seeked', 'playing'].forEach((eventName) => {
      try {
        backgroundVideo.addEventListener(eventName, syncNameColor, { passive: true });
      } catch (e) {}
    });

    try {
      backgroundVideo.addEventListener('timeupdate', () => {
        if (backgroundVideo.tagName === 'VIDEO' && nameColorState.active) {
          sampleNameColorFromBackground();
        }
      }, { passive: true });
    } catch (e) {}

    ['pause', 'ended', 'emptied', 'error'].forEach((eventName) => {
      try {
        backgroundVideo.addEventListener(eventName, stopWhenUnavailable, { passive: true });
      } catch (e) {}
    });

    syncNameColor();
  }

  
  
  (function setupRobloxHoverTooltip(){
    try {
      const robloxCard = document.getElementById('roblox-card');
      if (!robloxCard) return;

      const robloxIconImg = document.querySelector('.footer-social-vertical img[alt="Roblox"]') ||
                            document.querySelector('img[src="assets/roblox.png"]');
      if (!robloxIconImg) return;

      const anchor = robloxIconImg.closest('a');
      if (!anchor) return;

      try { anchor.classList.add('roblox-tooltip-anchor'); } catch (e) {}

      
      try {
        robloxCard.classList.remove('roblox-hover-card');
        robloxCard.classList.remove('show');
        robloxCard.classList.add('roblox-tooltip-card');
      } catch (e) {}

      
      try {
        if (robloxCard.parentElement !== anchor) {
          anchor.appendChild(robloxCard);
        }
      } catch (e) {}
    } catch (e) {}
  })();

  
  
  function enforceCustomCursorOnInteractive() {
    try {
      const custom = "url('assets/gta5cursor.cur'), url('assets/custom_cursor.png') 16 16, auto";
      
      const sel = 'a, button, input, [role="link"], [onclick], .social-icon, .badge-container, .play-pause-btn, .mini-player, [style*="cursor:"]';
      document.querySelectorAll(sel).forEach(el => {
        try {
          
          el.style.cursor = custom;
        } catch (e) {}
      });

      
      const mo = new MutationObserver(muts => {
        for (const m of muts) {
          if (m.addedNodes && m.addedNodes.length) {
            m.addedNodes.forEach(n => {
              if (!n || n.nodeType !== Node.ELEMENT_NODE) return;
              try {
                if (n.matches && (n.matches(sel) || (n.getAttribute && String(n.getAttribute('style') || '').includes('cursor:')))) {
                  n.style.cursor = custom;
                }
                
                n.querySelectorAll && n.querySelectorAll(sel).forEach(ch => { try { ch.style.cursor = custom; } catch(e){} });
              } catch(e){}
            });
          }
          if (m.type === 'attributes' && m.attributeName === 'style' && m.target) {
            try { if (m.target && m.target.style) m.target.style.cursor = custom; } catch(e){}
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    } catch (e) { console.warn('enforceCustomCursorOnInteractive error', e); }
  }

  
  setTimeout(enforceCustomCursorOnInteractive, 120);
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      cursor.style.left = touch.clientX + 'px';
      cursor.style.top = touch.clientY + 'px';
      cursor.style.display = 'block';
    });

    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      cursor.style.left = touch.clientX + 'px';
      cursor.style.top = touch.clientY + 'px';
      cursor.style.display = 'block';
    });

    document.addEventListener('touchend', () => {
      cursor.style.display = 'none'; 
    });
  } else {

    if (cursor) {
      document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursor.style.display = 'block';
      });
    }

    
    
    
    (function setupProfileBlockHoverTilt() {
      try {
        const pb = document.getElementById('profile-block');
        if (!pb) return;

        const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
        const MAX_ROT_X = 6;
        const MAX_ROT_Y = 6;

        let hovering = false;
        let rotX = 0;
        let rotY = 0;
        let rafId = 0;

        function render() {
          rafId = 0;
          pb.style.setProperty('--pb-tilt-x', `${rotX}deg`);
          pb.style.setProperty('--pb-tilt-y', `${rotY}deg`);
        }

        function schedule() {
          if (!rafId) rafId = requestAnimationFrame(render);
        }

        pb.addEventListener('mouseenter', () => {
          hovering = true;
        });

        pb.addEventListener('mouseleave', () => {
          hovering = false;
          rotX = 0;
          rotY = 0;
          schedule();
        });

        pb.addEventListener('mousemove', (e) => {
          if (!hovering) return;
          const rect = pb.getBoundingClientRect();
          if (!rect || rect.width <= 0 || rect.height <= 0) return;

          const px = (e.clientX - rect.left) / rect.width;   
          const py = (e.clientY - rect.top) / rect.height;   
          const dx = clamp((px - 0.5) / 0.5, -1, 1);         
          const dy = clamp((py - 0.5) / 0.5, -1, 1);         

          rotX = dy * MAX_ROT_X;
          rotY = -dx * MAX_ROT_Y;
          schedule();
        }, { passive: true });
      } catch (e) {}
    })();

    if (cursor) {
      document.addEventListener('mousedown', () => {
        cursor.style.transform = 'scale(0.8) translate(0, 0)';
      });

      document.addEventListener('mouseup', () => {
        cursor.style.transform = 'scale(1) translate(0, 0)';
      });
    }
  }

  
  try {
    const existingActivityEls = document.querySelectorAll('.handle-activity');
    existingActivityEls.forEach(el => {
      try {
        
        el.querySelectorAll('.handle-spotify-img').forEach(n=>n.remove());
      } catch(e){}
      try {
        
        const txt = (el.textContent || '').toString();
        const cleaned = txt.replace(/Spotify\s*[-–—:\s]*/ig, '').trim();
        if (cleaned !== txt) el.textContent = cleaned;
      } catch (e) {}
    });
  } catch (e) {}

  
  try {
    const sanitize = (el) => {
      if (!el) return;
      try { el.querySelectorAll('.handle-spotify-img').forEach(n=>n.remove()); } catch(e){}
      try {
        const txt = (el.textContent || '').toString();
        const cleaned = txt.replace(/Spotify\s*[-–—:\s]*/ig, '').trim();
        if (cleaned !== txt) el.textContent = cleaned;
      } catch(e){}
    };
    
    const pending = new Set();
    let pendingTimer = null;
    const scheduleProcess = () => {
      if (pendingTimer) return;
      pendingTimer = setTimeout(() => {
        try {
          pending.forEach(el => { try { sanitize(el); } catch(e){} });
        } catch(e) {}
        pending.clear();
        pendingTimer = null;
      }, 80);
    };

    const mo = new MutationObserver(muts => {
      try {
        
        if (!muts || muts.length > 200) {
          
          document.querySelectorAll && document.querySelectorAll('.handle-activity').forEach(el => pending.add(el));
          scheduleProcess();
          return;
        }

        for (const m of muts) {
          if (m.type === 'characterData') {
            const parent = m.target && m.target.parentElement;
            if (parent && parent.classList && parent.classList.contains('handle-activity')) pending.add(parent);
          }
          if (m.addedNodes && m.addedNodes.length) {
            m.addedNodes.forEach(n => {
              if (!n) return;
              if (n.nodeType === Node.ELEMENT_NODE) {
                if (n.classList && n.classList.contains('handle-activity')) pending.add(n);
                try {
                  n.querySelectorAll && n.querySelectorAll('.handle-activity').forEach(a=>pending.add(a));
                } catch(e){}
              }
            });
          }
        }
        if (pending.size) scheduleProcess();
      } catch(e) { }
    });

    
    const observeRoot = document.querySelector('.discord-handle') || document.querySelector('.social-icon-container[aria-label="Discord"]');
    if (observeRoot) mo.observe(observeRoot, { childList: true, subtree: true, characterData: true });
  } catch(e) {}


  const startMessage = "Bendiciones";
  let startTextContent = '';
  let startIndex = 0;
  let startCursorVisible = true;

  function typeWriterStart() {
    if (!startText) return;
    if (startIndex < startMessage.length) {
      startTextContent = startMessage.slice(0, startIndex + 1);
      startIndex++;
    }
    startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
    setTimeout(typeWriterStart, 100);
  }

  if (startText) {
    setInterval(() => {
        startCursorVisible = !startCursorVisible;
        if(startText) {
            startText.textContent = startTextContent + (startCursorVisible ? '|' : ' ');
        }
    }, 500);
  }


  function initializeVisitorCounter() {
    let totalVisitors = localStorage.getItem('totalVisitorCount');
    if (!totalVisitors) {
      totalVisitors = 4;
      localStorage.setItem('totalVisitorCount', totalVisitors);
    } else {
      totalVisitors = parseInt(totalVisitors);
    }

    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      totalVisitors++;
      localStorage.setItem('totalVisitorCount', totalVisitors);
      localStorage.setItem('hasVisited', 'true');
    }

    if (visitorCount) {
        visitorCount.textContent = totalVisitors.toLocaleString();
    }
  }


  initializeVisitorCounter();

  if (startScreen) {
    startScreen.addEventListener('click', () => {
      
      
      

        startScreen.classList.add('hidden');
        try {
          if (!window.__bgIsVideo) {
            backgroundMusic.muted = false;
            backgroundMusic.play().catch(err => { console.error("Failed to play music after start screen click:", err); });
          } else {
            try { backgroundMusic.pause(); backgroundMusic.muted = true; } catch(e){}
          }
        } catch(e) {}
        profileBlock.classList.remove('hidden');
        gsap.fromTo(profileBlock,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', onComplete: () => {
            profileBlock.classList.add('profile-appear');
            profileContainer.classList.add('orbit');
        }}
        );
        if (!isTouchDevice) {
        try {
            new cursorTrailEffect({
            length: 10,
            size: 8,
            speed: 0.2
            });
            console.log("Cursor trail initialized");
        } catch (err) {
            console.error("Failed to initialize cursor trail effect:", err);
        }
        }
    });

    startScreen.addEventListener('touchstart', (e) => {
      e.preventDefault();
      
      

        startScreen.classList.add('hidden');
        try {
          if (!window.__bgIsVideo) {
            backgroundMusic.muted = false;
            backgroundMusic.play().catch(err => { console.error("Failed to play music after start screen touch:", err); });
          } else {
            try { backgroundMusic.pause(); backgroundMusic.muted = true; } catch(e){}
          }
        } catch(e) {}
        profileBlock.classList.remove('hidden');
        gsap.fromTo(profileBlock,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out', onComplete: () => {
            profileBlock.classList.add('profile-appear');
            profileContainer.classList.add('orbit');
        }}
        );
        if (!isTouchDevice) {
        try {
            new cursorTrailEffect({
            length: 10,
            size: 8,
            speed: 0.2
            });
            console.log("Cursor trail initialized");
        } catch (err) {
            console.error("Failed to initialize cursor trail effect:", err);
        }
        }
    });
  }




  let currentAudio = backgroundMusic;
  let isMuted = false;

  if (volumeIcon) {
    volumeIcon.addEventListener('click', () => {
      isMuted = !isMuted;
      currentAudio.muted = isMuted;
      volumeIcon.innerHTML = isMuted
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    });

    volumeIcon.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isMuted = !isMuted;
      currentAudio.muted = isMuted;
      volumeIcon.innerHTML = isMuted
        ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
        : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      currentAudio.volume = volumeSlider.value;
      isMuted = false;
      currentAudio.muted = false;
      if (volumeIcon) {
        volumeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
      }
    });
  }

  if (transparencySlider) {
    transparencySlider.addEventListener('input', () => {
      const opacity = transparencySlider.value;
      if (opacity == 0) {
        profileBlock.style.background = '';
        profileBlock.style.borderOpacity = '0';
        profileBlock.style.borderColor = 'transparent';
        skillsBlock.style.background = 'rgba(0, 0, 0, 0)';
        skillsBlock.style.borderOpacity = '0';
        skillsBlock.style.borderColor = 'transparent';
   
        profileBlock.style.pointerEvents = 'auto';
        socialIcons.forEach(icon => {
          icon.style.pointerEvents = 'auto';
          icon.style.opacity = '1';
        });
        badges.forEach(badge => {
          badge.style.pointerEvents = 'auto';
          badge.style.opacity = '1';
        });
        profilePicture.style.pointerEvents = 'auto';
        profilePicture.style.opacity = '1';
        
        if (profileBio) profileBio.style.opacity = '1';
        visitorCount.style.opacity = '1';
      } else {
        profileBlock.style.background = '';
        profileBlock.style.borderOpacity = opacity;
        profileBlock.style.borderColor = '';
        skillsBlock.style.background = `rgba(0, 0, 0, ${opacity})`;
        skillsBlock.style.borderOpacity = opacity;
        skillsBlock.style.borderColor = '';
        profileBlock.style.pointerEvents = 'auto';
        socialIcons.forEach(icon => {
          icon.style.pointerEvents = 'auto';
          icon.style.opacity = '1';
        });
        badges.forEach(badge => {
          badge.style.pointerEvents = 'auto';
          badge.style.opacity = '1';
        });
        profilePicture.style.pointerEvents = 'auto';
        profilePicture.style.opacity = '1';
        
        if (profileBio) profileBio.style.opacity = '1';
        visitorCount.style.opacity = '1';
      }
    });
  }


  
  
  
  (function setupProfileAuraFromBackground() {
    try {
      const profileBlockEl = document.getElementById('profile-block');
      if (!profileBlockEl) return;

      
      let auraEl = profileBlockEl.querySelector('.profile-aura');

      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 36;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      let lastPickedKey = null;
      let retryTimer = null;
      let retryCount = 0;
      let boundBg = null;
      let bgEventsBound = false;

      function clampByte(v) {
        return Math.max(0, Math.min(255, v | 0));
      }

      function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        const d = max - min;
        if (d !== 0) {
          s = d / (1 - Math.abs(2 * l - 1));
          switch (max) {
            case r: h = ((g - b) / d) % 6; break;
            case g: h = (b - r) / d + 2; break;
            default: h = (r - g) / d + 4; break;
          }
          h *= 60;
          if (h < 0) h += 360;
        }
        return { h, s, l };
      }

      function hslToRgb(h, s, l) {
        h = (h % 360 + 360) % 360;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let rp = 0, gp = 0, bp = 0;
        if (h < 60)      { rp = c; gp = x; bp = 0; }
        else if (h < 120){ rp = x; gp = c; bp = 0; }
        else if (h < 180){ rp = 0; gp = c; bp = x; }
        else if (h < 240){ rp = 0; gp = x; bp = c; }
        else if (h < 300){ rp = x; gp = 0; bp = c; }
        else             { rp = c; gp = 0; bp = x; }
        return {
          r: (rp + m) * 255,
          g: (gp + m) * 255,
          b: (bp + m) * 255,
        };
      }

      function boostVibrance(rgb) {
        if (!rgb) return null;
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        const s = Math.max(hsl.s, 0.35);
        const l = Math.min(0.78, Math.max(hsl.l, 0.28));
        return hslToRgb(hsl.h, s, l);
      }

      function applyAura(r, g, b) {
        profileBlockEl.style.setProperty('--aura-rgb', `${clampByte(r)}, ${clampByte(g)}, ${clampByte(b)}`);
      }

      function sampleElement(el) {
        if (!el) return null;
        const tag = el.tagName;
        if (tag === 'VIDEO') {
          if (el.readyState < 2) return null;
          
          if (!el.videoWidth || !el.videoHeight) return null;
        }
        if (tag === 'IMG') {
          if (!el.complete) return null;
          if (!el.naturalWidth || !el.naturalHeight) return null;
        }

        try {
          
          
          if (!auraEl) auraEl = profileBlockEl.querySelector('.profile-aura');

          const viewW = window.innerWidth || document.documentElement.clientWidth || 1;
          const viewH = window.innerHeight || document.documentElement.clientHeight || 1;

          let rect = null;
          try {
            rect = auraEl ? auraEl.getBoundingClientRect() : null;
          } catch (e) {
            rect = null;
          }

          const left = rect ? Math.max(0, rect.left) : 0;
          const top = rect ? Math.max(0, rect.top) : 0;
          const right = rect ? Math.min(viewW, rect.right) : viewW;
          const bottom = rect ? Math.min(viewH, rect.bottom) : Math.max(1, Math.floor(viewH * 0.35));

          if (tag === 'VIDEO') {
            const vw = el.videoWidth;
            const vh = el.videoHeight;

            const sx = Math.max(0, Math.floor((left / viewW) * vw));
            const sy = Math.max(0, Math.floor((top / viewH) * vh));
            const sw = Math.max(1, Math.floor(((right - left) / viewW) * vw));
            const sh = Math.max(1, Math.floor(((bottom - top) / viewH) * vh));

            ctx.drawImage(el, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          } else {
            const iw = el.naturalWidth || canvas.width;
            const ih = el.naturalHeight || canvas.height;

            const sx = Math.max(0, Math.floor((left / viewW) * iw));
            const sy = Math.max(0, Math.floor((top / viewH) * ih));
            const sw = Math.max(1, Math.floor(((right - left) / viewW) * iw));
            const sh = Math.max(1, Math.floor(((bottom - top) / viewH) * ih));

            ctx.drawImage(el, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
          }
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = img.data;

          
          
          const pixelCount = (data.length / 4) | 0;
          const candidates = [];
          const maxTries = 80;
          const maxCandidates = 16;
          for (let t = 0; t < maxTries; t++) {
            const p = (Math.random() * pixelCount) | 0;
            const i = p * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 120) continue;

            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            if (luma < 18 || luma > 245) continue;

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const chroma = (max - min) / 255;
            if (chroma < 0.06) continue;

            candidates.push({ r, g, b });
            if (candidates.length >= maxCandidates) break;
          }

          if (candidates.length) {
            const pick = candidates[(Math.random() * candidates.length) | 0];
            return boostVibrance(pick);
          }

          
          let sumR = 0, sumG = 0, sumB = 0, sumW = 0;
          const step = 4 * 6;
          for (let i = 0; i < data.length; i += step) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 90) continue;
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const chroma = (max - min) / 255;
            const w = 0.35 + chroma * 2.2 + (luma / 255) * 0.55;
            sumR += r * w;
            sumG += g * w;
            sumB += b * w;
            sumW += w;
          }
          if (!sumW) return null;
          return boostVibrance({ r: sumR / sumW, g: sumG / sumW, b: sumB / sumW });
        } catch (e) {
          
          return null;
        }
      }

      function getBgKey(bgEl) {
        try {
          if (!bgEl) return '';
          return bgEl.currentSrc || bgEl.src || bgEl.getAttribute('src') || '';
        } catch (e) {
          return '';
        }
      }

      function stopRetry() {
        if (retryTimer) {
          try { clearTimeout(retryTimer); } catch (e) {}
          retryTimer = null;
        }
        retryCount = 0;
      }

      function scheduleRetrySoon() {
        
        if (retryTimer) return;
        retryTimer = setTimeout(() => {
          retryTimer = null;
          pickOnce();
        }, 180);
      }

      function pickOnce() {
        const bg = document.getElementById('background');
        if (!bg) return;

        
        const key = getBgKey(bg);
        
        if (lastPickedKey === '__picked__' && key) {
          lastPickedKey = key;
          stopRetry();
          return;
        }
        if (key && key === lastPickedKey) return;

        const picked = sampleElement(bg);
        if (!picked) {
          
          if (retryCount < 40) {
            retryCount++;
            scheduleRetrySoon();
          }
          return;
        }

        lastPickedKey = key || '__picked__';
        applyAura(picked.r, picked.g, picked.b);
        stopRetry();
      }

      
      try {
        const tryPlayOnGesture = () => {
          try {
            // if Rapunzel is active or suspension is set, don't resume the background
            try { if (window.__suspendBgAutoResume === true || (typeof isRapunzelActive !== 'undefined' && isRapunzelActive)) return; } catch (e) {}
            const bg = document.getElementById('background');
            if (!bg || bg.tagName !== 'VIDEO') return;
            const isIOS = /iP(ad|hone|od)/.test(navigator.userAgent) ||
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (window.__bgSequenceManaged && !isIOS && bg.muted) {
               try { bg.muted = false; } catch (e) {}
             }
             try { if (bg.paused) bg.play().catch(()=>{}); } catch (e) {}
          } catch (e) {}
        };
        window.addEventListener('pointerdown', tryPlayOnGesture, { passive: true });
        window.addEventListener('keydown', tryPlayOnGesture, { passive: true });
      } catch (e) {}

      
      function attachVideoOneShot(videoEl) {
        try {
          if (!videoEl || videoEl.tagName !== 'VIDEO') return;
          if (typeof videoEl.requestVideoFrameCallback !== 'function') return;
          try { videoEl.requestVideoFrameCallback(() => pickOnce()); } catch (e) {}
        } catch (e) {}
      }

      function bindToBackgroundElement(bgEl) {
        try {
          if (!bgEl || bgEl === boundBg) return;
          boundBg = bgEl;
          bgEventsBound = false;

          
          if (bgEl.tagName === 'VIDEO') {
            try { ensureBackgroundVideoUnpausable(bgEl); } catch (e) {}
            if (!bgEventsBound) {
              bgEventsBound = true;
              bgEl.addEventListener('loadeddata', pickOnce, { passive: true });
              bgEl.addEventListener('canplay', pickOnce, { passive: true });
              bgEl.addEventListener('play', pickOnce, { passive: true });
            }
            attachVideoOneShot(bgEl);
          } else {
            
            try { bgEl.addEventListener('load', pickOnce, { passive: true }); } catch (e) {}
          }

          
          setTimeout(pickOnce, 30);
          setTimeout(pickOnce, 220);
        } catch (e) {}
      }

      
      try {
        const bg = document.getElementById('background');
        if (bg) {
          const mo = new MutationObserver(() => {
            lastPickedKey = null;
            stopRetry();
            try { bindToBackgroundElement(document.getElementById('background')); } catch (e) {}
            setTimeout(pickOnce, 60);
          });
          mo.observe(bg, { attributes: true, attributeFilter: ['src'] });
          try { bindToBackgroundElement(bg); } catch (e) {}
        }
      } catch (e) {}

      
      try {
        const mo2 = new MutationObserver(() => {
          try { bindToBackgroundElement(document.getElementById('background')); } catch (e) {}
        });
        mo2.observe(document.body, { childList: true, subtree: true });
      } catch (e) {}

      
      applyAura(255, 102, 255);
      pickOnce();
    } catch (e) {}
  })();


    
    (function ensureDiscordCardCentered(){
      try {
        function moveCardToSocialBlock() {
          const social = document.querySelector('.social-block');
          const card = document.querySelector('.discord-card');
          if (!social || !card) return;
          if (card.parentElement === social) return;
          
          social.appendChild(card);
          card.style.position = 'absolute';
          card.style.left = '50%';
          card.style.transform = 'translateX(-50%) translateY(8px)';
          card.style.bottom = 'calc(100% + 10px)';
          card.style.right = 'auto';
          card.style.zIndex = 200;
        }

        
        moveCardToSocialBlock();
        const mo = new MutationObserver(() => moveCardToSocialBlock());
        mo.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('DOMContentLoaded', () => setTimeout(moveCardToSocialBlock, 50));
      } catch (e) {}
    })();


  let bgTransitionLock = false;
  let isRapunzelActive = false;

  function getCurrentBackgroundSrc() {
    try {
      const src = backgroundVideo.currentSrc || backgroundVideo.src || backgroundVideo.getAttribute('src');
      if (src) return src;
    } catch (e) {}
    return buildBackgroundSrc(BG_MIN);
  }

  function cycleBackgroundVideo() {
    if (bgTransitionLock || !backgroundVideo) return;
    if (isRapunzelActive) return; // don't cycle while Rapunzel is playing

    const overlay = document.getElementById('bg-transition-overlay');
    if (!overlay) return;

    bgTransitionLock = true;
    const nextSrc = pickNextBackgroundSrc();
    const fadeIn = 0.48;
    const fadeOut = 0.58;

    gsap.to(overlay, {
      opacity: 1,
      duration: fadeIn,
      ease: 'power2.in',
      onComplete: () => {
                    document.body.classList.add('home-theme');
         if (hackerOverlay) hackerOverlay.classList.add('hidden');
         if (snowOverlay) snowOverlay.classList.add('hidden');
         if (resultsButtonContainer) resultsButtonContainer.classList.add('hidden');
         if (skillsBlock) skillsBlock.classList.add('hidden');
         if (resultsHint) resultsHint.classList.add('hidden');
         if (profileBlock) profileBlock.classList.remove('hidden');

        let finished = false;
        const finishTransition = () => {
          if (finished) return;
          finished = true;
          backgroundVideo.removeEventListener('loadeddata', finishTransition);
          backgroundVideo.removeEventListener('canplay', finishTransition);
          try {
            if (typeof window.resetBackgroundVolumeLoopRule === 'function') {
              window.resetBackgroundVolumeLoopRule();
            }
          } catch (e) {}
          backgroundVideo.play().catch(() => {});
          refreshNameColorForCurrentBackground('#00CED1');
          gsap.to(overlay, {
            opacity: 0,
            duration: fadeOut,
            ease: 'power2.out',
            onComplete: () => { bgTransitionLock = false; }
          });
        };

        backgroundVideo.addEventListener('loadeddata', finishTransition, { once: true });
        backgroundVideo.addEventListener('canplay', finishTransition, { once: true });
        backgroundVideo.src = nextSrc;
        try {
          const match = nextSrc.match(/background(\d+)/);
          if (match) {
            backgroundVideo.dataset.bgIndex = match[1];
            updateBgIndexDisplay();
          }
        } catch (e) {}
        backgroundVideo.load();
        setTimeout(finishTransition, 1800);
      }
    });
  }

  function switchTheme(videoSrc, audio, themeClass, overlay = null, overlayOverProfile = false) {
    let primaryColor = '#00CED1';
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    const hexToRgb = (hex) => {
      const cleanHex = hex.replace('#', '');
      const value = cleanHex.length === 3
        ? cleanHex.split('').map((char) => char + char).join('')
        : cleanHex;
      const number = parseInt(value, 16);
      return {
        r: (number >> 16) & 255,
        g: (number >> 8) & 255,
        b: number & 255,
      };
    };
    const accent = hexToRgb(primaryColor);
    try {
      document.body.style.setProperty('--accent-r', String(accent.r));
      document.body.style.setProperty('--accent-g', String(accent.g));
      document.body.style.setProperty('--accent-b', String(accent.b));
    } catch (e) {}
    refreshNameColorForCurrentBackground(primaryColor);

    gsap.to(backgroundVideo, {
      opacity: 0,
      duration: 0.5,
      ease: 'power2.in',
      onComplete: () => {
        backgroundVideo.src = videoSrc; 

        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        currentAudio = audio;
        currentAudio.volume = volumeSlider.value;
        currentAudio.muted = isMuted;
        currentAudio.play().catch(err => console.error("Failed to play theme music:", err));

                            document.body.classList.add('home-theme');

        gsap.to(backgroundVideo, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            profileContainer.classList.remove('orbit');
            void profileContainer.offsetWidth;
            profileContainer.classList.add('orbit');
          }
        });
      }
    });
  }


  if (homeButton) {
    homeButton.addEventListener('click', () => {
      switchTheme(getCurrentBackgroundSrc(), backgroundMusic, 'home-theme');
    });
    homeButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      switchTheme(getCurrentBackgroundSrc(), backgroundMusic, 'home-theme');
    });
  }

  if (bgCycleButton) {
    bgCycleButton.addEventListener('click', () => {
      cycleBackgroundVideo();
    });
    bgCycleButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      cycleBackgroundVideo();
    });
  }

  // Flor badge - play Rapunzel background and keep aura while it plays
  try {
    // Legacy wrapper removed: the robust Rapunzel handler attaches earlier.
    const florBadge = document.getElementById('flor-badge');
    if (florBadge) {
      // no-op: click handled by main Rapunzel logic
    }
  } catch (e) {}

 
  function handleTilt(e, element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let clientX, clientY;

    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const mouseX = clientX - centerX;
    const mouseY = clientY - centerY;

    const maxTilt = 6;
    const tiltX = (mouseY / rect.height) * maxTilt;
    const tiltY = -(mouseX / rect.width) * maxTilt;

    gsap.to(element, {
      rotationX: tiltX,
      rotationY: tiltY,
      duration: 0.3,
      ease: 'power2.out',
      transformPerspective: 1000
    });
  }

  if (skillsBlock) {
    skillsBlock.addEventListener('mousemove', (e) => handleTilt(e, skillsBlock));
    skillsBlock.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handleTilt(e, skillsBlock);
    });

    skillsBlock.addEventListener('mouseleave', () => {
      gsap.to(skillsBlock, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    });
    skillsBlock.addEventListener('touchend', () => {
      gsap.to(skillsBlock, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: 'power2.out'
      });
    });
  }


  profilePicture.addEventListener('mouseenter', () => {
    glitchOverlay.style.opacity = '1';
    setTimeout(() => {
      glitchOverlay.style.opacity = '0';
    }, 500);
  });


  profilePicture.addEventListener('click', () => {
    profileContainer.classList.remove('fast-orbit');
    profileContainer.classList.remove('orbit');
    void profileContainer.offsetWidth;
    profileContainer.classList.add('fast-orbit');
    setTimeout(() => {
      profileContainer.classList.remove('fast-orbit');
      void profileContainer.offsetWidth;
      profileContainer.classList.add('orbit');
    }, 500);
  });

  profilePicture.addEventListener('touchstart', (e) => {
    e.preventDefault();
    profileContainer.classList.remove('fast-orbit');
    profileContainer.classList.remove('orbit');
    void profileContainer.offsetWidth;
    profileContainer.classList.add('fast-orbit');
    setTimeout(() => {
      profileContainer.classList.remove('fast-orbit');
      void profileContainer.offsetWidth;
      profileContainer.classList.add('orbit');
    }, 500);
  });

 
  let isShowingSkills = false;
  if (resultsButton) {
    resultsButton.addEventListener('click', () => {
      if (!isShowingSkills) {
        gsap.to(profileBlock, {
          x: -100,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            profileBlock.classList.add('hidden');
            skillsBlock.classList.remove('hidden');
            gsap.fromTo(skillsBlock,
              { x: 100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
            gsap.to(pythonBar, { width: '87%', duration: 2, ease: 'power2.out' });
            gsap.to(cppBar, { width: '75%', duration: 2, ease: 'power2.out' });
            gsap.to(csharpBar, { width: '80%', duration: 2, ease: 'power2.out' });
          }
        });
        resultsHint.classList.remove('hidden');
        isShowingSkills = true;
      } else {
        gsap.to(skillsBlock, {
          x: 100,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            skillsBlock.classList.add('hidden');
            profileBlock.classList.remove('hidden');
            gsap.fromTo(profileBlock,
              { x: -100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
          }
        });
        resultsHint.classList.add('hidden');
        isShowingSkills = false;
      }
    });

    resultsButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (!isShowingSkills) {
        gsap.to(profileBlock, {
          x: -100,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            profileBlock.classList.add('hidden');
            skillsBlock.classList.remove('hidden');
            gsap.fromTo(skillsBlock,
              { x: 100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
            gsap.to(pythonBar, { width: '87%', duration: 2, ease: 'power2.out' });
            gsap.to(cppBar, { width: '75%', duration: 2, ease: 'power2.out' });
            gsap.to(csharpBar, { width: '80%', duration: 2, ease: 'power2.out' });
          }
        });
        resultsHint.classList.remove('hidden');
        isShowingSkills = true;
      } else {
        gsap.to(skillsBlock, {
          x: 100,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.in',
          onComplete: () => {
            skillsBlock.classList.add('hidden');
            profileBlock.classList.remove('hidden');
            gsap.fromTo(profileBlock,
              { x: -100, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
            );
          }
        });
        resultsHint.classList.add('hidden');
        isShowingSkills = false;
      }
    });
  }


  typeWriterStart();
  updateBgIndexDisplay();
});


document.addEventListener('DOMContentLoaded', () => {
  try {
    const discordContainer = document.querySelector('.social-icon-container[aria-label="Discord"]');
    if (discordContainer) {
      const globalHandle = document.getElementById('discord-handle-global');
      if (globalHandle) {
        const manualPosition = (globalHandle.dataset && globalHandle.dataset.manualPosition === '1') || globalHandle.classList.contains('manual-position');
        
        globalHandle.classList.add('show');
        
        
        function positionDiscordHandle() {
          try {
            const socialBlock = document.querySelector('.social-block');
            if (!socialBlock) return;
            
            if (globalHandle.classList && globalHandle.classList.contains('inline-presence')) return;
            if (manualPosition) return;
            const socialRect = socialBlock.getBoundingClientRect();
            const profileBlock = document.getElementById('profile-block');
            if (profileBlock) {
              const profileRect = profileBlock.getBoundingClientRect();
              const offsetInside = 12; 
              const leftPx = Math.round(profileRect.left - socialRect.left + offsetInside);
              globalHandle.style.left = leftPx + 'px';
              globalHandle.style.transform = 'translateX(0) translateY(0)';
              
              globalHandle.style.right = 'auto';
              globalHandle.style.width = 'auto';
              const available = Math.max(140, Math.round(socialRect.width - leftPx - 16));
              globalHandle.style.maxWidth = available + 'px';
              globalHandle.style.boxSizing = 'border-box';
            } else {
              
              const discordRect = discordContainer.getBoundingClientRect();
              const centerX = discordRect.left + discordRect.width / 2;
              const leftPx = Math.round(centerX - socialRect.left);
              globalHandle.style.left = leftPx + 'px';
              globalHandle.style.transform = 'translateX(-50%) translateY(0)';
            }
          } catch (e) { }
        }

        
        if (!manualPosition) {
          positionDiscordHandle();
          window.addEventListener('resize', positionDiscordHandle);
        }
      }
    }
  } catch (e) { }
});


document.addEventListener('DOMContentLoaded', () => {
  try { setHandleMusicState(false); } catch(e) {}
});





let _discordHasEverLoaded = false;


function ensureDiscordLoadingOverlay() {
  const container = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
  if (!container) return null;
  let overlay = container.querySelector('.discord-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'discord-loading-overlay hidden';
    overlay.setAttribute('role', 'status');
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span class="loading-text">Cargando...</span>';
    
    const cs = getComputedStyle(container);
    if (cs.position === 'static' || !cs.position) container.style.position = 'relative';
    container.appendChild(overlay);
  }
  return overlay;
}

function showDiscordLoading(force = false) {
  try {
    if (!force && _discordHasEverLoaded) return;
    const overlay = ensureDiscordLoadingOverlay();
    if (!overlay) return;
    
    try { document.body.classList.add('discord-loading-active'); } catch(e){}
    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    
    try { hideHandleInnerInline(); } catch(e){}
  } catch (e) { }
}

function hideDiscordLoading() {
  try {
    const container = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
    if (!container) return;
    const overlay = container.querySelector('.discord-loading-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.style.display = 'none';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    try { document.body.classList.remove('discord-loading-active'); } catch(e){}
    
    try { restoreHandleInnerInline(); } catch(e){}
  } catch (e) { }
}


function hideHandleInnerInline() {
  try {
    const nodes = document.querySelectorAll('.handle-inner');
    nodes.forEach(n => {
      try {
        if (n.dataset.hidByLoading === '1') return; 
        n.dataset.hidByLoading = '1';
        n.dataset.prevStyle = n.getAttribute('style') || '';
        
        n.style.setProperty('display', 'none', 'important');
        n.style.setProperty('visibility', 'hidden', 'important');
        n.setAttribute('aria-hidden', 'true');
      } catch(e) {}
    });
  } catch (e) {}
}


function restoreHandleInnerInline() {
  try {
    const nodes = document.querySelectorAll('[data-hid-by-loading="1"]');
    nodes.forEach(n => {
      try {
        const prev = n.dataset.prevStyle || '';
        if (prev) n.setAttribute('style', prev);
        else n.removeAttribute('style');
        n.removeAttribute('aria-hidden');
        delete n.dataset.prevStyle;
        delete n.dataset.hidByLoading;
      } catch(e) {}
    });
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const LANYARD_WS = 'wss://apifracapi.koyeb.app/socket';
  const USER_ID = '344060291543334914';
  const container = document.querySelector('.social-icon-container[aria-label="Discord"]');
  const globalHandle = document.getElementById('discord-handle-global');
  if (!container || !globalHandle) return;
  
  try { showDiscordLoading(); } catch(e) {}

  const handleStatusTextEl = globalHandle.querySelector('.handle-status-text');
  const avatarImg = globalHandle.querySelector('.handle-avatar');
  const nameEl = globalHandle.querySelector('.handle-name');
  const activityEl = globalHandle.querySelector('.handle-activity');
  const statusDot = globalHandle.querySelector('.handle-status');

  let ws;
  let heartbeatIntervalId = null;

  function connect() {
    ws = new WebSocket(LANYARD_WS);
    ws.addEventListener('open', () => {
      console.log('Lanyard WS connected');
    });

    ws.addEventListener('message', (ev) => {
      try {
        const payload = JSON.parse(ev.data);

        
        if ((payload.op === 2 && payload.d && payload.d.heartbeat_interval) || (payload.d && payload.d.heartbeat_interval)) {
          const interval = payload.d.heartbeat_interval;
          if (heartbeatIntervalId) clearInterval(heartbeatIntervalId);
          heartbeatIntervalId = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ op: 3 }));
            }
          }, interval);

          
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: USER_ID } }));
          }
          return;
        }

        
        if (payload.op === 0 && payload.t) {
          
          const d = payload.d || {};
          const presence = d.presence || d;
          try { console.debug('Lanyard presence object (spotify):', presence.spotify); } catch(e) {}

          
          const discordUser = presence.discord_user || d.discord_user || {};
          const uid = discordUser.id || USER_ID;
          const avatarHash = discordUser.avatar;
          if (avatarHash && avatarImg) {
            const isAnimated = avatarHash.startsWith('a_');
            const ext = isAnimated ? 'gif' : 'png';
            avatarImg.src = `https://cdn.discordapp.com/avatars/${uid}/${avatarHash}.${ext}?size=128`;
          }

          
          if (discordUser && discordUser.global_name && nameEl) {
            try {
              const activitiesForName = filterIgnoredActivities(presence.activities || d.activities || []);
              const customActivity = activitiesForName.find(a => (a && (a.type === 4 || String(a.name).toLowerCase() === 'custom status')) && (a.state || a.details));
              if (customActivity) {
                const cs = String(customActivity.state || customActivity.details || '').replace(/"/g, '');
                nameEl.innerHTML = escapeHtml(discordUser.global_name) + ' <span class="custom-status-quote">"' + escapeHtml(cs) + '"</span>';
              } else {
                nameEl.innerHTML = escapeHtml(discordUser.global_name);
              }
            } catch (e) {
              try { nameEl.innerHTML = escapeHtml(discordUser.global_name); } catch(_) { nameEl.textContent = discordUser.global_name; }
            }
          }

          const status = resolveStatusFromDesktop(presence, d);
          if (statusDot) {
            statusDot.classList.remove('online','idle','dnd','offline');
            statusDot.classList.add(status || 'offline');
          }
          try {
            if (handleStatusTextEl) {
              handleStatusTextEl.textContent = '';
              handleStatusTextEl.style.display = 'none';
            }
          } catch(e) {}
          let activities = (presence.activities || d.activities || []).filter(a => a && a.type !== 4);
          activities = filterIgnoredActivities(activities);
          let activity = activities.find(a => a.type === 0 && a.name) || activities.find(a => a.name) || null;

          let activityDisplay = '';
          try {
            if (activity && activity.name && String(activity.name).toLowerCase() !== 'spotify') {
              activityDisplay = activity.state ? `${activity.name} — ${activity.state}` : activity.name;
            }
          } catch (e) { activityDisplay = ''; }

          let spotifySong = '';
          let spotifyArtist = '';
          try {
            const listening = isListeningToSpotify(presence);
            if (listening && presence && presence.spotify && presence.spotify.song) spotifySong = cleanSpotifySongDisplay(presence.spotify.song);
            else if (listening && activity && String(activity.name).toLowerCase() === 'spotify' && activity.details) spotifySong = cleanSpotifySongDisplay(activity.details);

            if (listening && presence && presence.spotify && presence.spotify.artist) spotifyArtist = String(presence.spotify.artist || '').trim();
            else if (listening && activity && String(activity.name).toLowerCase() === 'spotify' && activity.state) spotifyArtist = String(activity.state || '').trim();
          } catch (e) { spotifySong = ''; }

          let _swap = { active: false, card: null };
          try {
            const listening = isListeningToSpotify(presence);
            const hasSong = !!(listening && spotifySong && String(spotifySong).trim().length);
            const art = (presence && presence.spotify) ? presence.spotify.album_art_url : null;
            const key = hasSong ? _buildSpotifyTransitionKey(presence, spotifySong, spotifyArtist, art) : '';
            _swap = _beginSpotifySwapIfChanged(globalHandle, key);

            if (listening && art) updateInlineAlbum(art);
            else updateInlineAlbum(null);

            setHandleMusicState(!!(listening && spotifySong && String(spotifySong).trim().length));
          } catch (e) {}

          try {
            if (activityEl) {
              const combined = renderActivity(activityDisplay, spotifySong, spotifyArtist);
              if (!combined || combined.length === 0) activityEl.textContent = '';
              else activityEl.innerHTML = combined;
            }
          } catch (e) { try { activityEl.textContent = activityDisplay || ''; } catch(_){} }

          try { if (_swap && _swap.active) _endSpotifySwap(_swap.card || globalHandle); } catch(e) {}
          try {
            if (status === 'offline') {
              if (!_lastOfflineAt) {
                _lastOfflineAt = Date.now();
                try { localStorage.setItem('lastOfflineAt', String(_lastOfflineAt)); } catch(e) {}
              }
              startOfflineTicker(activityEl);
            } else {
              if (_offlineTickerId) stopOfflineTicker(activityEl);
            }
          } catch (e) {}
          _discordHasEverLoaded = true;
          try { hideDiscordLoading(); } catch(e) {}
        }
      } catch (err) {
        console.error('Lanyard WS message parse error', err);
      }
    });

    ws.addEventListener('close', () => {
      console.log('Lanyard WS closed, reconnecting in 5s');
      if (heartbeatIntervalId) { clearInterval(heartbeatIntervalId); heartbeatIntervalId = null; }
      setTimeout(connect, 5000);
    });
    ws.addEventListener('error', (e) => {
      console.error('Lanyard WS error', e);
      try { ws.close(); } catch(e){}
    });
  }

  connect();
});

(function startRailwayPoll(){
  const STATUS_API = 'https://apifracapi.koyeb.app/';
  const statusDot = document.querySelector('.handle-status');
  if (!statusDot) return;

  let _railwayInitialized = false;
  let _railwayLoadingTimer = null;
  const _railwayLoadingDelay = 800; // ms before showing loader

  let _pollInFlight = false;
  let _pollTimerId = null;
  let _pollDelayMs = 1000; // target: poll API once per second
  let _lastFingerprint = '';
  let _etag = '';
  let _lastModified = '';

  function _computePresenceFingerprint(data) {
    try {
      const u = data && data.discord_user ? data.discord_user : {};
      const acts = Array.isArray(data && data.activities) ? data.activities : [];
      const spotify = data && data.spotify ? data.spotify : null;
      const roblox = data && (data.roblox || data.roblox_user || data.robloxProfile) ? (data.roblox || data.roblox_user || data.robloxProfile) : null;

      const actBits = acts
        .filter(a => a)
        .map(a => {
          const name = String(a.name || '');
          const type = String(a.type ?? '');
          const state = String(a.state || '');
          const details = String(a.details || '');
          const appId = String((a.applicationId || a.application_id || (a.application && a.application.id) || '')).trim();
          return [type, name, state, details, appId].join('~');
        })
        .join('|');

      const spotifyBits = spotify
        ? [String(spotify.song || ''), String(spotify.album_art_url || ''), String(spotify.artist || ''), String(spotify.track_id || '')].join('~')
        : '';

      const robloxBits = roblox
        ? [
            String(roblox.username || roblox.name || ''),
            String(roblox.display_name || roblox.displayName || ''),
            String(roblox.avatar_url || roblox.avatar || roblox.avatarUrl || ''),
            String(roblox.friends_count ?? roblox.friends ?? roblox.friendCount ?? ''),
            String(roblox.link || ''),
            String(roblox.bio || '')
          ].join('~')
        : '';

      return [
        String(data && (data.discord_status || data.status) || ''),
        String(data && data.last_seen_timestamp || ''),
        String(u.id || ''),
        String(u.username || ''),
        String(u.global_name || ''),
        String(u.avatar || ''),
        String(u.avatar_url || ''),
        String(u.avatar_decoration_url || ''),
        actBits,
        spotifyBits,
        robloxBits
      ].join('||');
    } catch (e) {
      return '';
    }
  }

  function _getDesiredPollDelayMs() {
    return 1000;
  }

  function _scheduleNextPoll(nextDelayMs) {
    try {
      if (_pollTimerId) clearTimeout(_pollTimerId);
      const d = Math.max(600, Math.min(30000, Number(nextDelayMs) || 1000));
      _pollTimerId = setTimeout(() => {
        try { checkRailway(); } catch(e) {}
      }, d);
    } catch (e) {}
  }

  async function _fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const t = setTimeout(() => { try { controller.abort(); } catch(e) {} }, Math.max(400, timeoutMs || 4000));
    try {
      const res = await fetch(url, { ...(options || {}), signal: controller.signal });
      clearTimeout(t);
      return res;
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  async function checkRailway() {
    if (_pollInFlight) return;
    _pollInFlight = true;
    let _swap = { active: false, card: null };
    try {
      if (_railwayLoadingTimer) { clearTimeout(_railwayLoadingTimer); _railwayLoadingTimer = null; }
      if (!_discordHasEverLoaded) {
        _railwayLoadingTimer = setTimeout(() => { try { showDiscordLoading(); } catch(e){} }, _railwayLoadingDelay);
      }

      let res;
      try {
        const headers = {};
        if (_etag) headers['If-None-Match'] = _etag;
        if (_lastModified) headers['If-Modified-Since'] = _lastModified;
        res = await _fetchWithTimeout(
          STATUS_API,
          {
            cache: 'no-store',
            headers
          },
          4500
        );
      } catch (fetchErr) {
        if (_railwayLoadingTimer) { clearTimeout(_railwayLoadingTimer); _railwayLoadingTimer = null; }
        if (!_discordHasEverLoaded) { try { showDiscordLoading(); } catch(e){} }
        _pollDelayMs = Math.min(30000, Math.max(_getDesiredPollDelayMs(), Math.floor(_pollDelayMs * 1.7)));
        return;
      }

      if (_railwayLoadingTimer) { clearTimeout(_railwayLoadingTimer); _railwayLoadingTimer = null; }

      if (res.status === 304) {
        _pollDelayMs = _getDesiredPollDelayMs();
        return;
      }

      if (!res.ok) {
        if (!_discordHasEverLoaded) { try { showDiscordLoading(); } catch(e) {} }
        _pollDelayMs = Math.min(30000, Math.max(_getDesiredPollDelayMs(), Math.floor(_pollDelayMs * 1.3)));
        return;
      }

      try {
        const et = res.headers && res.headers.get ? res.headers.get('ETag') : null;
        if (et) _etag = et;
        const lm = res.headers && res.headers.get ? res.headers.get('Last-Modified') : null;
        if (lm) _lastModified = lm;
      } catch (e) {}

      const json = await res.json();
      let data = null;
      if (json && typeof json === 'object') {
        data = (json.data && typeof json.data === 'object') ? json.data : json;
      }
      data = normalizePresencePayload(data);
      if (!data) { if (!_discordHasEverLoaded) { try { showDiscordLoading(); } catch(e) {} } ; return; }

      try {
        const handleCard = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
        const listening = isListeningToSpotify(data);
        const song = listening && data.spotify && data.spotify.song ? cleanSpotifySongDisplay(data.spotify.song) : '';
        const artist = listening && data.spotify && data.spotify.artist ? String(data.spotify.artist || '').trim() : '';
        const art = (listening && data.spotify) ? data.spotify.album_art_url : null;
        const hasSong = !!(song && String(song).trim().length);
        const key = hasSong ? _buildSpotifyTransitionKey(data, song, artist, art) : '';
        _swap = _beginSpotifySwapIfChanged(handleCard, key);
      } catch (e) {}

      try {
        const fp = _computePresenceFingerprint(data);
        if (fp && _lastFingerprint && fp === _lastFingerprint) {
          _pollDelayMs = _getDesiredPollDelayMs();
          return;
        }
        if (fp) _lastFingerprint = fp;
      } catch (e) {}

      try {
        const robloxCard = document.getElementById('roblox-card');
        if (robloxCard && data) {
          const rAvatar = robloxCard.querySelector('.roblox-avatar');
          const rName = robloxCard.querySelector('.roblox-name');
          const rStats = robloxCard.querySelector('.roblox-stats');

          const robloxPayload = data.roblox || data.roblox_user || data.robloxProfile || null;

          if (robloxPayload) {
            const robloxAvatarUrl = robloxPayload.avatar_url || robloxPayload.avatar || robloxPayload.avatarUrl || null;
            if (robloxAvatarUrl && rAvatar) {
              try {
                const img = new Image();
                img.onload = () => { try { rAvatar.src = robloxAvatarUrl; rAvatar.style.display = ''; } catch(_){} };
                img.onerror = () => {  };
                img.src = robloxAvatarUrl;
              } catch(e){}
            }

            const robloxName = robloxPayload.username || robloxPayload.name || robloxPayload.displayName || robloxPayload.display_name || null;
            if (robloxName && rName) {
              try { rName.textContent = robloxName; } catch(e){}
            }

            const friends = (robloxPayload.friends_count ?? robloxPayload.friends ?? robloxPayload.friendCount);
            if (typeof friends !== 'undefined' && friends !== null && rStats) {
              try { rStats.textContent = `${friends} Amigos`; } catch(e){}
            }
          }
        }
      } catch (e) { console.warn('Roblox card update error', e); }

      try {
        const avatarImg = document.querySelector('.handle-avatar');
        const apiAvatar = data.discord_user && data.discord_user.avatar_url ? data.discord_user.avatar_url : null;
        if (apiAvatar && avatarImg) {
          if (avatarImg.src !== apiAvatar) {
            avatarImg.src = apiAvatar;
          }
        }
        try {
          const existing = document.querySelector('.handle-album-art');
          if (isListeningToSpotify(data) && data.spotify && data.spotify.album_art_url) {
            let album = existing;
            const handleCard = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
            if (!album) {
              album = document.createElement('img');
              album.className = 'handle-album-art';
              if (handleCard) handleCard.appendChild(album);
              else if (activityEl && activityEl.parentElement) activityEl.parentElement.appendChild(album);
            }
            try {
              const newUrl = data.spotify.album_art_url;
              console.debug('Setting album art (card):', newUrl);
              try { updateInlineAlbum(newUrl); } catch(e) {}
              try { setHandleMusicState(true); } catch(e) {}
              const srcToSet = newUrl + '?_=' + Date.now();
              album.src = srcToSet;
            } catch(e) { try { album.src = data.spotify.album_art_url; } catch(_){} }
            album.alt = 'Album art';
            album.style.display = '';
            album.dataset.generated = 'true';
            album.classList.remove('inline');
            album.onerror = function() {
              try {
                this.onerror = null;
                const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">'
                              + '<rect fill="#1DB954" width="24" height="24" rx="4"/>'
                              + '<path fill="#fff" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>'
                              + '</svg>';
                          + '<rect fill="#1DB954" width="24" height="24" rx="4"/>'
                          + '<path fill="#fff" d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>'
                          + '</svg>';
                this.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
                this.style.display = '';
              } catch(e) { try { this.style.display = 'none'; } catch(_){} }
            };
          } else {
            
            if (existing) {
              try { existing.src = ''; existing.style.display = 'none'; existing.dataset.generated = 'false'; } catch(e){}
            }
            try { updateInlineAlbum(null); } catch(e) {}
            try { setHandleMusicState(false); } catch(e) {}
          }
        } catch (e) { }
        
        try { console.debug('Railway response discord_user:', data.discord_user); } catch(e) {}
        
        try {
          const nameEl = document.querySelector('.handle-name');
          if (nameEl && data.discord_user) {
            try {
              const display = chooseDisplayName(data.discord_user);
              let csVal = null;
              try {
                const activities = filterIgnoredActivities(data.activities || []);
                const customActivity = activities.find(a => (a && (a.type === 4 || String(a.name).toLowerCase() === 'custom status')) && (a.state || a.details));
                if (customActivity) csVal = String(customActivity.state || customActivity.details || '').replace(/"/g, '');
              } catch(e) { csVal = null; }
              if (csVal) nameEl.innerHTML = escapeHtml(display) + ' <span class="custom-status-quote">"' + escapeHtml(csVal) + '"</span>';
              else if (display && display.length) nameEl.innerHTML = escapeHtml(display);
            } catch(e) { try { const display = chooseDisplayName(data.discord_user); if (display && display.length) nameEl.textContent = display; } catch(_){} }
          }
        } catch(e) {}
        try {
          const decoUrl = data.discord_user && data.discord_user.avatar_decoration_url ? data.discord_user.avatar_decoration_url : null;
          const avatarWrap = document.querySelector('.handle-avatar-wrap');
          if (decoUrl && avatarWrap) {
            let deco = avatarWrap.querySelector('.handle-avatar-decoration');
            if (!deco) {
              deco = document.createElement('img');
              deco.className = 'handle-avatar-decoration';
              avatarWrap.insertBefore(deco, avatarWrap.firstChild);
            }
            if (deco.dataset.decorationSrc !== decoUrl) {
              deco.src = decoUrl;
              deco.dataset.decorationSrc = decoUrl;
            }
            deco.alt = 'Avatar decoration';
            deco.onerror = function() { try { this.remove(); } catch(e){} };
          } else if (avatarWrap) {
            const existing = avatarWrap.querySelector('.handle-avatar-decoration');
            if (existing) try { existing.remove(); } catch(e){}
          }
        } catch (e) { }
      } catch (e) { }

      try {
        const activityEl = document.querySelector('.handle-activity');
        const nameEl = document.querySelector('.handle-name');

          if (data.activities && data.activities.length > 0) {
          let activitiesArr = (data.activities || []).filter(a => a && a.type !== 4);
          activitiesArr = filterIgnoredActivities(activitiesArr);
          const chosen = pickBestNonSpotifyActivity(activitiesArr);
          let activityDisplay = '';
          try {
            if (chosen && chosen.name && String(chosen.name).toLowerCase() !== 'spotify') {
              activityDisplay = chosen.state ? `${chosen.name} — ${chosen.state}` : chosen.name;
            }
          } catch(e) { activityDisplay = ''; }

          let spotifySong = '';
          let spotifyArtist = '';
          try {
            const listening = isListeningToSpotify(data);
            if (listening && data.spotify && data.spotify.song) spotifySong = cleanSpotifySongDisplay(data.spotify.song);
            else if (listening) {
              const spotifyAct = (activitiesArr || []).find(a => String(a.name || '').toLowerCase() === 'spotify');
              if (spotifyAct && spotifyAct.details) spotifySong = cleanSpotifySongDisplay(spotifyAct.details);
            }

            if (listening && data.spotify && data.spotify.artist) spotifyArtist = String(data.spotify.artist || '').trim();
            else if (listening) {
              const spotifyAct2 = (activitiesArr || []).find(a => String(a.name || '').toLowerCase() === 'spotify');
              if (spotifyAct2 && (spotifyAct2.state || spotifyAct2.assets)) {
                spotifyArtist = String(spotifyAct2.state || '').trim();
              }
            }
          } catch(e) { spotifySong = ''; }

          try { setHandleMusicState(!!(spotifySong && String(spotifySong).trim().length)); } catch(e){}

          if (activityEl) {
            try {
              const combined = renderActivity(activityDisplay, spotifySong, spotifyArtist);
              if (!combined || combined.length === 0) activityEl.textContent = '';
              else activityEl.innerHTML = combined;
              activityEl.style.fontSize = '';
              activityEl.style.fontStyle = '';
              activityEl.style.display = '';
            } catch(e) { activityEl.textContent = activityDisplay || ''; }
          }

        } else {
          const spotifyLinkHref = 'https://emoji.gg/emoji/35248-spotify';
          const spotifyImgSrc = 'spotify.png';

          if (data.listening_to_spotify === true && data.spotify && data.spotify.song) {
            if (activityEl) {
              activityEl.style.fontSize = '12px';
              activityEl.style.fontStyle = 'normal';
              activityEl.style.display = 'inline-flex';
              activityEl.style.verticalAlign = 'middle';
              try {
                const rawSong = String(data.spotify.song || '');
                const cleanSong = rawSong.replace(/Spotify\s*[-–—:\s]*/ig, '').trim();
                const artist = (data.spotify && data.spotify.artist) ? String(data.spotify.artist || '').trim() : '';
                activityEl.innerHTML = renderActivity('', cleanSong, artist);
              } catch(e) {
                try { activityEl.textContent = data.spotify.song; } catch(_){ }
              }
            }

            try {
              if (nameEl && nameEl.parentElement) {
                const existingImg = nameEl.parentElement.querySelector('.handle-spotify-img');
                if (existingImg) existingImg.remove();

                const img = document.createElement('img');
                img.className = 'handle-spotify-img';
                img.src = 'spotify.png';
                img.onerror = function() { try { this.remove(); } catch(e){} };
                img.alt = '';
                img.title = '';
                img.setAttribute('aria-hidden', 'true');
                img.style.width = '14px';
                img.style.height = '14px';
                img.style.objectFit = 'contain';
                img.style.marginLeft = '6px';
                img.style.verticalAlign = 'middle';
                img.style.display = 'inline-block';
                nameEl.parentElement.appendChild(img);
              }
            } catch (e) { }

            try { setHandleMusicState(true); } catch(e){}

            try {
              if (data.spotify.album_art_url && activityEl) {
                const abs = document.querySelector('.discord-handle > .handle-album-art:not(.inline)');
                if (abs) try { abs.remove(); } catch(e){}

                let album = activityEl.querySelector('.handle-album-art.inline');
                if (!album) {
                  album = document.createElement('img');
                  album.className = 'handle-album-art inline';
                  activityEl.appendChild(album);
                }
                try {
                  const newUrl = data.spotify.album_art_url;
                  console.debug('Setting album art (placeholder):', newUrl);
                  try { updateInlineAlbum(newUrl); } catch(e) {}
                  const srcToSet = newUrl + '?_=' + Date.now();
                  album.src = srcToSet;
                  try { album.style.display = ''; } catch(e) {}
                } catch(e) { try { album.src = data.spotify.album_art_url; } catch(_){} }
                album.alt = 'Album art';
                album.style.display = '';
                album.onerror = function() { try { this.remove(); } catch(e){} };
              } else {
                const inlineAlbum = document.querySelector('.handle-album-art.inline');
                if (inlineAlbum) try { inlineAlbum.remove(); } catch(e){}
                try { setHandleMusicState(false); } catch(e){}
              }
            } catch (e) { }

            try {
              if (data.spotify.album_art_url) {
                let album = document.querySelector('.handle-album-art');
                if (!album) {
                  album = document.createElement('img');
                  album.className = 'handle-album-art';
                  const handleCard = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
                  if (handleCard) handleCard.appendChild(album);
                  else if (activityEl && activityEl.parentElement) activityEl.parentElement.appendChild(album);
                }
                try {
                  const newUrl = data.spotify.album_art_url;
                  console.debug('Setting album art (inline):', newUrl);
                  try { updateInlineAlbum(newUrl); } catch(e) {}
                  try { setHandleMusicState(true); } catch(e) {}
                  const srcToSet = newUrl + '?_=' + Date.now();
                  album.src = srcToSet;
                } catch(e) { try { album.src = data.spotify.album_art_url; } catch(_){} }
                album.alt = 'Album art';
                album.onerror = function() { try { this.remove(); } catch(e){} };
              } else {
                const existing = document.querySelector('.discord-handle > .handle-album-art:not(.inline)') || document.querySelector('.handle-album-art');
                if (existing) try { existing.style.display = 'none'; existing.src = ''; } catch(e){}
                try { setHandleMusicState(false); } catch(e){}
              }
            } catch (e) { }
          } else {
            if (activityEl) {
              try { activityEl.textContent = ''; } catch(e) {}
              try { activityEl.innerHTML = ''; } catch(e) {}
              activityEl.style.fontSize = '';
              activityEl.style.fontStyle = '';
            }

            try { updateInlineAlbum(null); } catch(e) {}
            try { setHandleMusicState(false); } catch(e) {}

            try {
              const nameEl2 = document.querySelector('.handle-name');
              if (nameEl2) {
                const link = nameEl2.parentElement.querySelector('.handle-spotify-link');
                if (link) link.remove();
                try {
                  const activityEl2 = document.querySelector('.handle-activity');
                  let note = null;
                  if (activityEl2) note = activityEl2.querySelector('.global-name-note');
                  if (!note) note = nameEl2.querySelector('.global-name-note');
                } catch(e) {}
              }
            } catch (e) { }
          }
        }
        try {
          const timeDisplay = document.getElementById('tiempo-desconectado');
          if (timeDisplay) {
            if (data.discord_status === 'offline' && data.last_seen_timestamp) {
              const ahora = Date.now();
              const desconexion = Number(data.last_seen_timestamp) || 0;
              const diferencia = Math.max(0, ahora - desconexion);

              const segundos = Math.floor(diferencia / 1000);
              const minutos = Math.floor(segundos / 60);
              const horas = Math.floor(minutos / 60);
              const dias = Math.floor(horas / 24);

              let texto = '';
              if (dias > 0) texto = `Desconectado hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
              else if (horas > 0) texto = `Desconectado hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
              else if (minutos > 0) texto = `Desconectado hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
              else texto = 'Desconectado hace unos segundos';

              timeDisplay.innerText = texto;
              timeDisplay.style.display = 'block';
            } else if (data.discord_status && data.discord_status !== 'offline') {
              timeDisplay.style.display = 'none';
            } else {
              timeDisplay.innerText = 'Desconectado';
              timeDisplay.style.display = 'block';
            }
          }
        } catch (e) { }
      } catch (e) { }

      _discordHasEverLoaded = true;
      try { hideDiscordLoading(); } catch(e) {}
      _railwayInitialized = true;

      _pollDelayMs = _getDesiredPollDelayMs();

      const status = resolveStatusFromDesktop(data, data);
      statusDot.classList.remove('online','idle','dnd','offline');
      statusDot.classList.add(status || 'offline');

      try {
        const globalHandle = document.getElementById('discord-handle-global') || document.querySelector('.discord-handle');
        const handleStatusTextEl = globalHandle ? globalHandle.querySelector('.handle-status-text') : null;
        if (handleStatusTextEl) {
          handleStatusTextEl.textContent = '';
          handleStatusTextEl.style.display = 'none';
        }
      } catch (e) {}
      try {
        const activityEl = document.querySelector('.handle-activity');
        if (status === 'offline') {
          if (!_lastOfflineAt) _lastOfflineAt = Date.now();
          startOfflineTicker(activityEl);
        } else {
          if (_offlineTickerId) stopOfflineTicker(activityEl);
        }
      } catch (e) {}
    } catch (e) {
      console.warn('Railway poll failed:', e);
      _pollDelayMs = Math.min(30000, Math.max(_getDesiredPollDelayMs(), Math.floor(_pollDelayMs * 1.7)));
    } finally {
      _pollInFlight = false;
      try { if (_swap && _swap.active) _endSpotifySwap(_swap.card); } catch(e) {}
      _scheduleNextPoll(_pollDelayMs);
    }
  }

  try {
    document.addEventListener('visibilitychange', () => {
      try {
        _pollDelayMs = _getDesiredPollDelayMs();
        _scheduleNextPoll(_pollDelayMs);
      } catch(e) {}
    });
  } catch(e) {}

  checkRailway();
})();

const VISITOR_COUNT_WINDOW_MS = 5 * 60 * 1000;
const VISITOR_COUNT_STORAGE_KEY = 'paginaLastVisitCountedAt';

function _readLastVisitTimestamp() {
  return 0;
}

async function cargarVisitasReales() {
  const contadorElemento = document.getElementById('visitor-count');
  if (!contadorElemento) return;

  try {
    const respuesta = await fetch('/api/contador');
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos?.error || 'Falló la petición del contador');
    }

    const totalValue = typeof datos.total === 'number'
      ? datos.total
      : Number(datos.total);

    if (Number.isFinite(totalValue)) {
      contadorElemento.innerText = totalValue.toLocaleString();
      contadorElemento.style.opacity = 0;
      setTimeout(() => {
        contadorElemento.style.transition = 'opacity 0.5s';
        contadorElemento.style.opacity = 1;
      }, 100);
    }
  } catch (error) {
    console.error('Error cargando visitas:', error);
    contadorElemento.innerText = 'Error';
  }
}

window.addEventListener('load', cargarVisitasReales);

(function() {
    function restoreSimpleName() {
        const nameEl = document.getElementById('profile-name');
        if (nameEl) {
          nameEl.textContent = "frac on top";
        }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        restoreSimpleName();
      });
    } else {
        restoreSimpleName();
    }
})();
