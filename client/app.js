import { createMeadowWorldEngine } from "./voxel/meadow_engine.js";
import { createCharacterBuilderController } from "./character_builder.js";
import { createMultiplayerClient } from "./multiplayer_client.js";
import { createKidsModeController, filterWorldForKidsMode } from "./kids_mode.js";
import { createLearningAcademy } from "./learning_academy.js";
import {
  ALL_GAMES,
  ARCADE_GAMES,
  IN_WORLD_GAMES,
  findGame,
} from "./games_catalogue.js";
import {
  addRemoteScore,
  awardAchievement,
  getAchievementCount,
  getBest,
  getLastResult,
  getLowest,
  getProgress,
  getSetting,
  recordLastResult,
  resetGameProgress,
  setSetting,
  subscribeProgress,
} from "./game_progress.js";
import {
  getGameAudioSettings,
  setGameAudioMuted,
  setGameAudioVolume,
} from "./voxel/game_audio.js";
import {
  ISLANDS as SHOALS_ISLANDS,
  fetchIslandConfig,
  getDeeds,
  getIslandDisplayName,
  beginIslandPurchase,
  fulfillPendingPurchase,
  verifyDeedsWithServer,
  renameOwnedIsland,
  exportDeedBundle,
  importDeedBundle,
  getCatalogIsland,
  formatPrice,
} from "./island_deeds.js";

const urlParams = new URLSearchParams(location.search);
const isOgCapture = urlParams.get("og") === "1";
if (isOgCapture) {
  document.body.dataset.ogCapture = "1";
}

const worldCanvas = document.getElementById("world-canvas");

const addBtn = document.getElementById("add-btn");
const pickSpotPill = document.getElementById("pick-spot-pill");
const cancelPickBtn = document.getElementById("cancel-pick-btn");
const islandDeedsBtn = document.getElementById("island-deeds-btn");
const islandDeedsDialog = document.getElementById("island-deeds-dialog");
const islandDeedsCloseBtn = document.getElementById("island-deeds-close-btn");
const islandDeedsGrid = document.getElementById("island-deeds-grid");
const islandDeedsStatus = document.getElementById("island-deeds-status");
const islandDeedsStatusText = document.getElementById("island-deeds-status-text");
const islandDeedsOwnedCount = document.getElementById("island-deeds-owned-count");
const islandRestoreInput = document.getElementById("island-restore-input");
const islandRestoreBtn = document.getElementById("island-restore-btn");
const islandExportBtn = document.getElementById("island-export-btn");
const islandLocationPill = document.getElementById("island-location-pill");
const islandLocationName = document.getElementById("island-location-name");
const islandReturnBtn = document.getElementById("island-return-btn");
const parentGateDialog = document.getElementById("parent-gate-dialog");
const parentGateMath = document.getElementById("parent-gate-math");
const parentGateAnswer = document.getElementById("parent-gate-answer");
const parentGateHold = document.getElementById("parent-gate-hold");
const parentGateHoldFill = parentGateHold?.querySelector(".parent-gate-hold-fill");
const parentGateError = document.getElementById("parent-gate-error");
const parentGateCancel = document.getElementById("parent-gate-cancel");

const bottomBuilder = document.getElementById("bottom-builder");
const moveSpotBtn = document.getElementById("move-spot-btn");
const closeBuilderBtn = document.getElementById("close-builder-btn");

const dropZone = document.getElementById("drop-zone");
const imageInput = document.getElementById("image-input");
const dropEmpty = document.getElementById("drop-empty");
const dropPreviewWrap = document.getElementById("drop-preview-wrap");
const dropPreviewImg = document.getElementById("drop-preview-img");
const clearImageBtn = document.getElementById("clear-image-btn");
const promptInput = document.getElementById("prompt-input");
const sculptBtn = document.getElementById("sculpt-btn");
const formError = document.getElementById("form-error");

const buildingPill = document.getElementById("building-pill");
const buildingPillLabel = document.getElementById("building-pill-label");
const buildingPillSub = document.getElementById("building-pill-sub");
const readyGotoBtn = document.getElementById("ready-goto-btn");
const readyGotoLabel = document.getElementById("ready-goto-label");
const locateMineBtn = document.getElementById("locate-mine-btn");
const locateMineLabel = document.getElementById("locate-mine-label");

const hoverCard = document.getElementById("hover-card");
const hoverName = document.getElementById("hover-name");
const hoverFeed = document.getElementById("hover-feed");
const hoverStatus = document.getElementById("hover-status");
const weaveToast = document.getElementById("weave-toast");

const camPanBtn = document.getElementById("cam-pan-btn");
const camOrbitBtn = document.getElementById("cam-orbit-btn");
const camWalkBtn = document.getElementById("cam-walk-btn");
const recenterBtn = document.getElementById("recenter-btn");
const recenterCompass = document.getElementById("recenter-compass");
const avatarBtn = document.getElementById("avatar-btn");
const avatarSwatchDot = document.getElementById("avatar-swatch-dot");
const onlinePill = document.getElementById("online-pill");
const onlineCountEl = document.getElementById("online-count");
const interactPromptBtn = document.getElementById("interact-prompt");
const interactKeyEl = document.getElementById("interact-key");
const interactLabelEl = document.getElementById("interact-label");
const walkEscHintBtn = document.getElementById("walk-esc-hint");
const avatarDialog = document.getElementById("avatar-dialog");

const walkJoystick = document.getElementById("walk-joystick");
const walkJoystickKnob = document.getElementById("walk-joystick-knob");
const walkJoyUp = document.getElementById("walk-joy-up");
const walkJoyDown = document.getElementById("walk-joy-down");
const walkJoyLeft = document.getElementById("walk-joy-left");
const walkJoyRight = document.getElementById("walk-joy-right");

const arcadeHud = document.getElementById("arcade-hud");
const arcadeTitleEl = document.getElementById("arcade-title");
const arcadeScoreEl = document.getElementById("arcade-score");
const arcadeSubEl = document.getElementById("arcade-sub");
const arcadeExitBtn = document.getElementById("arcade-exit-btn");
const arcadeCountdownEl = document.getElementById("arcade-countdown");
const arcadeGameOverCard = document.getElementById("arcade-gameover-card");
const arcadeGameOverBadge = document.getElementById("arcade-gameover-badge");
const arcadeGameOverText = document.getElementById("arcade-gameover-text");
const arcadePlayAgainBtn = document.getElementById("arcade-play-again-btn");
const arcadeGameOverExitBtn = document.getElementById("arcade-gameover-exit-btn");
const arcadeCarControls = document.getElementById("arcade-car-controls");
const arcadeHonkBtn = document.getElementById("arcade-honk-btn");
const arcadeAutoDriveBtn = document.getElementById("arcade-autodrive-btn");
const arcadeRunnerControls = document.getElementById("arcade-runner-controls");
const arcadeBalloonControls = document.getElementById("arcade-balloon-controls");
const arcadeBalloonMissionEl = document.getElementById("arcade-balloon-mission");
const arcadeCarLevelsEl = document.getElementById("arcade-car-levels");
const arcadeCarLevelBtns = arcadeCarLevelsEl
  ? Array.from(arcadeCarLevelsEl.querySelectorAll("[data-car-level]"))
  : [];

const gamesLaunchBtn = document.getElementById("games-launch-btn");
const learnLaunchBtn = document.getElementById("learn-launch-btn");
const gamesOpenLearnBtn = document.getElementById("games-open-learn-btn");
const gamesDialog = document.getElementById("games-dialog");
const gamesCloseBtn = document.getElementById("games-close-btn");
const gamesListEl = document.getElementById("games-list");
const gamesDifficultyEl = document.getElementById("games-ai-difficulty");
const gamesVolumeEl = document.getElementById("games-volume");
const gamesOnlineBoardEl = document.getElementById("games-online-board");
const gamesAchievementsEl = document.getElementById("games-achievements");
const gamesLeaderboardEl = document.getElementById("games-leaderboard");
const gamesResetBtn = document.getElementById("games-reset-btn");
const gamesSpectateEl = document.getElementById("games-spectate");
const gamesSpectateRefreshBtn = document.getElementById("games-spectate-refresh");
const gameTargetMarkerEl = document.getElementById("game-target-marker");
const gameTargetArrowEl = document.getElementById("game-target-arrow");
const gameTargetLabelEl = document.getElementById("game-target-label");
const audioMuteBtn = document.getElementById("audio-mute-btn");
const audioMuteIcon = document.getElementById("audio-mute-icon");
const audioMuteLabel = document.getElementById("audio-mute-label");

// UI states: "idle" | "picking" | "composing" | "building" | "ready" | "placed"
let uiState = "idle";
let myCreationId = null;
let readyCreation = null;
let rawWorldData = null;
let worldData = null;
let selectedImageDataUrl = null;
let chosenSpot = null;
let toastTimer = null;

// Live multi-user build queue state
let activeJob = null;
let jobPollInterval = null;
let jobPollInFlight = false;

const VISITOR_STORAGE_KEY = "geminisland_visitor_token_v1";
let cachedVisitorToken = (() => {
  try {
    return typeof localStorage !== "undefined" ? localStorage.getItem(VISITOR_STORAGE_KEY) : null;
  } catch {
    return null;
  }
})();

const CLIENT_TIMEZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
})();

function storeVisitorToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return;
  cachedVisitorToken = token;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(VISITOR_STORAGE_KEY, token);
    }
  } catch {
    // Sandboxed iframes without storage access fall back to in-memory cachedVisitorToken
  }
}

function buildVisitorHeaders(extra = {}) {
  const headers = { ...extra };
  if (cachedVisitorToken) {
    headers["x-meadow-visitor"] = cachedVisitorToken;
  }
  if (CLIENT_TIMEZONE) {
    headers["x-meadow-tz"] = CLIENT_TIMEZONE;
  }
  return headers;
}
window.__geminIslandVisitorHeaders = buildVisitorHeaders;

function showToast(text, durationMs = 4200) {
  if (!text || isOgCapture) return;
  weaveToast.textContent = text;
  weaveToast.hidden = false;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    weaveToast.hidden = true;
  }, durationMs);
}

function renderActiveJobLabel() {
  if (buildingPillSub) {
    buildingPillSub.textContent = "Being built with Gemini 4 Hydrogen";
  }
  if (!activeJob) {
    buildingPillLabel.textContent = "Approving query…";
    return;
  }
  if (activeJob.status === "queued" && activeJob.position >= 1) {
    buildingPillLabel.textContent =
      activeJob.position === 1 ? "Next in queue…" : `Waiting in queue (#${activeJob.position})…`;
  } else if (activeJob.phase === "approving") {
    buildingPillLabel.textContent = "Approving query…";
  } else if (activeJob.phase === "reviewing") {
    buildingPillLabel.textContent = "Reviewing 3D model…";
  } else if (activeJob.phase === "refining") {
    buildingPillLabel.textContent = "Polishing details…";
  } else if (activeJob.phase === "placing") {
    buildingPillLabel.textContent = "Placing on island…";
  } else {
    buildingPillLabel.textContent = "Sculpting voxels…";
  }
}

function stopJobTracking() {
  activeJob = null;
  if (jobPollInterval) {
    clearInterval(jobPollInterval);
    jobPollInterval = null;
  }
}

let engine = null;
let characterBuilder = null;
let kidsMode = null;
let mpClient = null;
let activeInteractionPrompt = null;
let lastAvatarDialogCloseMs = -1000;
let currentCamMode = "pan";
let sawTouchInput = false;
let joyPointerId = null;

function syncArcadeHud(hudState) {
  if (!arcadeHud || isOgCapture) return;
  if (!hudState) {
    arcadeHud.hidden = true;
    delete document.body.dataset.arcadeActive;
    if (arcadeCountdownEl) arcadeCountdownEl.hidden = true;
    if (arcadeGameOverCard) arcadeGameOverCard.hidden = true;
    if (arcadeCarControls) arcadeCarControls.hidden = true;
    if (arcadeRunnerControls) arcadeRunnerControls.hidden = true;
    if (arcadeBalloonControls) arcadeBalloonControls.hidden = true;
    return;
  }

  document.body.dataset.arcadeActive = "1";
  arcadeHud.hidden = false;
  hoverCard.hidden = true;

  if (arcadeTitleEl) arcadeTitleEl.textContent = hudState.title || "Arcade";
  if (arcadeScoreEl) arcadeScoreEl.textContent = hudState.scoreLabel || "";
  if (arcadeSubEl) arcadeSubEl.textContent = hudState.subLabel || "";

  if (arcadeCountdownEl) {
    if (hudState.countdownText) {
      arcadeCountdownEl.hidden = false;
      arcadeCountdownEl.textContent = hudState.countdownText;
    } else {
      arcadeCountdownEl.hidden = true;
    }
  }

  const mode = hudState.mode;
  const isFinishedOverlay =
    (mode === "subway_runner" && Boolean(hudState.gameOver)) ||
    (mode === "balloon_pop" && Boolean(hudState.gameOver)) ||
    (mode === "car_drive" && Boolean(hudState.raceFinished));

  if (arcadeCarControls) {
    arcadeCarControls.hidden = mode !== "car_drive" || Boolean(hudState.raceFinished);
  }
  if (arcadeRunnerControls) {
    arcadeRunnerControls.hidden = mode !== "subway_runner" || Boolean(hudState.gameOver);
  }
  if (arcadeBalloonControls) {
    arcadeBalloonControls.hidden = mode !== "balloon_pop" || Boolean(hudState.gameOver);
  }

  if (mode === "car_drive" && arcadeCarLevelBtns.length) {
    const activeLevel = Number(hudState.carLevel ?? 1);
    for (const btn of arcadeCarLevelBtns) {
      const isActive = Number(btn.getAttribute("data-car-level")) === activeLevel;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    }
  }
  if (mode === "car_drive" && arcadeAutoDriveBtn) {
    const autoOn = Boolean(hudState.autoDrive);
    arcadeAutoDriveBtn.classList.toggle("is-active", autoOn);
    arcadeAutoDriveBtn.setAttribute("aria-pressed", autoOn ? "true" : "false");
    arcadeAutoDriveBtn.textContent = autoOn ? "🤖 Auto: ON" : "🤖 Auto-Drive";
  }

  if (arcadeGameOverCard) {
    arcadeGameOverCard.hidden = !isFinishedOverlay;
    if (isFinishedOverlay) {
      if (arcadeGameOverBadge) {
        arcadeGameOverBadge.textContent = hudState.finishBadge || (mode === "car_drive" ? "🏆 Race Complete!" : "🏄 Great Run!");
      }
      if (arcadeGameOverText) {
        arcadeGameOverText.textContent = hudState.finishText || hudState.subLabel || "Great job!";
      }
      if (arcadePlayAgainBtn) {
        arcadePlayAgainBtn.textContent = mode === "car_drive" ? "🏁 Race Again" : "🔄 Play Again";
      }
      const resultKey = `${mode}:${hudState.finishText || hudState.subLabel || ""}`;
      if (resultKey !== lastRecordedResultKey) {
        lastRecordedResultKey = resultKey;
        recordLastResult(mode, {
          score: hudState.scoreValue,
          label: hudState.finishText || hudState.subLabel || "Round complete",
        });
      }
      void publishGameScore(mode, hudState.scoreValue);
    }
  }

  if (mode === "balloon_pop" && arcadeBalloonMissionEl) {
    const col = String(hudState.targetColor || "Red").toUpperCase();
    arcadeBalloonMissionEl.textContent = `🎈 Tap ${col} balloons in the sky! (${hudState.scoreLabel || ""})`;
  }
}

function applyEffectiveWorld(raw) {
  if (!raw) return;
  rawWorldData = raw;
  worldData = kidsMode?.isEnabled?.() ? filterWorldForKidsMode(raw) : raw;
  engine?.applyWorldSnapshot?.(worldData);
  kidsMode?.setWorldCreations?.(worldData?.creations || []);
}

function syncAvatarSwatchDot(app) {
  if (!avatarSwatchDot || !app || typeof app !== "object") return;
  const swatchColor =
    (typeof app.topColor === "string" && app.topColor) ||
    (typeof app.hatColor === "string" && app.hatColor) ||
    "#4c82d4";
  avatarSwatchDot.style.backgroundColor = swatchColor;
}

function updateOnlinePill(count) {
  if (!onlinePill) return;
  if (isOgCapture || typeof count !== "number" || !Number.isFinite(count) || count < 1) {
    onlinePill.hidden = true;
    return;
  }
  const clean = Math.max(1, Math.trunc(count));
  if (onlineCountEl) {
    onlineCountEl.textContent = String(clean);
  }
  onlinePill.hidden = false;
}

function isMobileWalkViewport() {
  if (sawTouchInput) return true;
  if (window.matchMedia?.("(pointer: coarse)")?.matches) return true;
  return window.innerWidth <= 768;
}

function resetWalkJoystick() {
  joyPointerId = null;
  walkJoystick?.classList.remove("is-active");
  walkJoystickKnob?.setAttribute("transform", "translate(0 0)");
  walkJoyUp?.classList.remove("is-lit");
  walkJoyDown?.classList.remove("is-lit");
  walkJoyLeft?.classList.remove("is-lit");
  walkJoyRight?.classList.remove("is-lit");
  engine?.setJoystickInput(0, 0);
}

function syncWalkJoystickVisibility() {
  const show = !isOgCapture && currentCamMode === "walk" && isMobileWalkViewport();
  if (walkJoystick) {
    walkJoystick.hidden = !show;
  }
  if (show) {
    document.body.dataset.walkMobile = "1";
  } else {
    delete document.body.dataset.walkMobile;
    resetWalkJoystick();
  }
}

function syncCameraModeUI(mode) {
  currentCamMode = mode;
  const isPan = mode === "pan";
  const isOrbit = mode === "orbit";
  const isWalk = mode === "walk";
  if (camPanBtn) {
    camPanBtn.classList.toggle("is-active", isPan);
    camPanBtn.setAttribute("aria-pressed", isPan ? "true" : "false");
  }
  if (camOrbitBtn) {
    camOrbitBtn.classList.toggle("is-active", isOrbit);
    camOrbitBtn.setAttribute("aria-pressed", isOrbit ? "true" : "false");
  }
  if (camWalkBtn) {
    camWalkBtn.classList.toggle("is-active", isWalk);
    camWalkBtn.setAttribute("aria-pressed", isWalk ? "true" : "false");
  }
  syncWalkJoystickVisibility();
  if (walkEscHintBtn) {
    walkEscHintBtn.hidden = isOgCapture || !isWalk || isMobileWalkViewport();
  }
}

const demoClickTimers = new WeakMap();

function triggerCameraButtonClickFX(mode) {
  syncCameraModeUI(mode);
  const btn = mode === "walk" ? camWalkBtn : mode === "orbit" ? camOrbitBtn : camPanBtn;
  if (!btn || isOgCapture) return;
  const prevTimer = demoClickTimers.get(btn);
  if (prevTimer) clearTimeout(prevTimer);
  btn.classList.remove("is-demo-click");
  void btn.offsetWidth;
  btn.classList.add("is-demo-click");
  demoClickTimers.set(
    btn,
    setTimeout(() => {
      btn.classList.remove("is-demo-click");
    }, 740),
  );
}

const lastIncidentSentByVehicle = new Map();

async function reportTrafficIncidentToObserver(incident) {
  if (isOgCapture || !incident || typeof incident.vehicleId !== "string") return;
  const nowMs = Date.now();
  const prevMs = lastIncidentSentByVehicle.get(incident.vehicleId) || 0;
  if (nowMs - prevMs < 25_000) return;
  lastIncidentSentByVehicle.set(incident.vehicleId, nowMs);
  try {
    await fetch("/api/traffic-incident", {
      method: "POST",
      headers: buildVisitorHeaders({
        "content-type": "application/json",
        "x-meadow-client": "1",
      }),
      body: JSON.stringify({
        vehicleId: incident.vehicleId,
        peerVehicleId: incident.peerVehicleId || null,
        x: incident.x,
        z: incident.z,
        reason: incident.reason || "self_restored",
      }),
    });
  } catch {
    // Ignore transient network errors during background telemetry
  }
}

engine = createMeadowWorldEngine(
  worldCanvas,
  {
    onHoverCreation(creation, clientX, clientY, reading) {
      if (
        !creation ||
        uiState === "picking" ||
        isOgCapture ||
        (activeInteractionPrompt && engine?.isFirstPerson?.())
      ) {
        hoverCard.hidden = true;
        return;
      }
      hoverName.textContent = creation.name;
      if (reading?.summary) {
        hoverFeed.textContent = reading.summary;
        hoverFeed.hidden = false;
      } else {
        hoverFeed.hidden = true;
      }
      hoverStatus.textContent = creation.description || creation.behavior?.statusLine || "";
      hoverCard.style.left = `${clientX}px`;
      hoverCard.style.top = `${clientY}px`;
      hoverCard.hidden = false;
    },
    onSelectCreation(creation, reading) {
      if (!creation || isOgCapture) return;
      const baseDesc = creation.description || creation.behavior?.statusLine || "";
      const detail = reading?.summary
        ? baseDesc
          ? `${reading.summary} · ${baseDesc}`
          : reading.summary
        : baseDesc;
      showToast(detail ? `${creation.name} — ${detail}` : creation.name);
    },
    onInteractiveEvent(_creation, message) {
      if (!message || isOgCapture) return;
      showToast(message);
    },
    onPickGroundSpot(x, z) {
      chosenSpot = { x, z };
      uiState = "composing";
      syncDockUI();
      if (window.innerWidth > 640) {
        promptInput.focus({ preventScroll: true });
      }
    },
    onAutoNudgeSpot(x, z) {
      if (chosenSpot) {
        chosenSpot = { x, z };
      }
    },
    onDragModeChange(mode) {
      syncCameraModeUI(mode);
    },
    onIntroDemoStep(mode) {
      triggerCameraButtonClickFX(mode);
    },
    onCameraChange(camState) {
      if (recenterCompass && typeof camState?.azDeltaFromHome === "number") {
        const deg = ((camState.azDeltaFromHome * 180) / Math.PI).toFixed(1);
        recenterCompass.setAttribute("transform", `rotate(${deg} 12 12)`);
      }
    },
    onInteractionPromptChange(promptInfo) {
      activeInteractionPrompt = promptInfo || null;
      if (!interactPromptBtn) return;
      if (!promptInfo || isOgCapture) {
        interactPromptBtn.hidden = true;
        return;
      }
      if (interactKeyEl) {
        interactKeyEl.textContent = promptInfo.keyHint || "E";
      }
      if (interactLabelEl) {
        interactLabelEl.textContent = promptInfo.label || "Interact";
      }
      interactPromptBtn.hidden = false;
      if (engine?.isFirstPerson?.()) {
        hoverCard.hidden = true;
      }
    },
    onLocalEmote(kind) {
      mpClient?.sendEmote(kind);
    },
    onInteriorChange(roomInfo) {
      if (roomInfo) {
        document.body.dataset.inInterior = "1";
        if (uiState === "picking" || uiState === "composing") {
          hideError();
          chosenSpot = null;
          uiState = "idle";
          syncDockUI();
        }
      } else {
        delete document.body.dataset.inInterior;
      }
      hoverCard.hidden = true;
      mpClient?.forcePoseSync();
    },
    onTrafficIncident(incident) {
      void reportTrafficIncidentToObserver(incident);
    },
    onArcadeHudChange(hudState) {
      syncArcadeHud(hudState);
    },
    onArcadeEarnStar(starId) {
      kidsMode?.awardStar?.(starId, "You earned a Game Star!");
    },
    onArcadeExit() {
      syncArcadeHud(null);
    },
    onIslandChange(island) {
      if (island) {
        if (islandLocationName) {
          islandLocationName.textContent = `${getIslandDisplayName(island)} — The Outer Shoals`;
        }
        if (islandLocationPill) islandLocationPill.hidden = false;
      } else if (islandLocationPill) {
        islandLocationPill.hidden = true;
      }
    },
    onBuildLocked(island) {
      const label = island?.name || "That Unnamed Isle";
      showToast(`${label} is for sale — buy its deed to build here.`, 4200);
      openIslandDeeds(island?.id || null);
    },
  },
  { ogMode: isOgCapture },
);

window.__geminIslandCam = () => engine.getCameraState();
window.__geminIslandEngine = engine;

interactPromptBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  engine?.triggerActiveInteraction?.();
  interactPromptBtn.blur();
});

characterBuilder = createCharacterBuilderController({
  dialogEl: avatarDialog,
  onChange(app) {
    engine?.setLocalAppearance?.(app);
    syncAvatarSwatchDot(app);
  },
  onSave(app) {
    engine?.setLocalAppearance?.(app);
    syncAvatarSwatchDot(app);
    mpClient?.sendProfile(app);
  },
});

avatarDialog?.addEventListener("close", () => {
  lastAvatarDialogCloseMs = performance.now();
  avatarBtn?.blur();
  queueMicrotask(() => avatarBtn?.blur());
});

avatarDialog?.querySelector('[data-cb-action="wave"]')?.addEventListener("click", () => {
  engine?.triggerLocalWave?.();
  mpClient?.sendEmote("wave");
});

syncAvatarSwatchDot(engine?.getLocalAppearance?.() || characterBuilder?.getAppearance?.());

avatarBtn?.addEventListener("click", () => {
  if (isOgCapture) return;
  avatarBtn?.blur();
  hoverCard.hidden = true;
  resetWalkJoystick();
  engine?.releaseWalkPointerLock?.();
  characterBuilder?.open(engine?.getLocalAppearance?.());
});

walkEscHintBtn?.addEventListener("click", () => {
  hoverCard.hidden = true;
  engine?.setDragMode("pan");
  walkEscHintBtn.blur();
});

window.__geminIslandCharacterBuilder = characterBuilder;

if (!isOgCapture) {
  kidsMode = createKidsModeController({
    onToggleKidsMode() {
      if (rawWorldData) {
        applyEffectiveWorld(rawWorldData);
      }
    },
    onFocusCreation(id) {
      if (!id) return;
      hoverCard.hidden = true;
      engine?.focusCreationById?.(id);
    },
    onLaunchArcade(gameId) {
      if (!gameId || isOgCapture) return;
      hoverCard.hidden = true;
      if (uiState === "picking" || uiState === "composing") {
        hideError();
        chosenSpot = null;
        uiState = "idle";
        syncDockUI();
      }
      engine?.startArcadeGame?.(gameId);
    },
    onSelectQuickPrompt(prompt) {
      promptInput.value = prompt;
      engine?.setPreviewPrompt?.(prompt);
      promptInput.focus();
    },
    onHighlightUpdate(entries) {
      engine?.setKidsHighlights?.(entries);
    },
    onToast(msg) {
      showToast(msg, 4600);
    },
  });
  window.__geminIslandKidsMode = kidsMode;
}

const learningAcademy = createLearningAcademy({
  onReward(starId, reason) {
    const awarded = kidsMode?.awardStar?.(starId, reason);
    if (!awarded) showToast(`★ ${reason}`, 3400);
  },
  onToast(message) {
    showToast(message, 3800);
  },
  speak(text) {
    if (kidsMode?.isEnabled?.() && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(String(text || ""));
        utter.rate = 0.95;
        utter.pitch = 1.08;
        window.speechSynthesis.speak(utter);
      } catch {
        // speech synthesis is best-effort
      }
    }
  },
});
window.__geminIslandLearning = learningAcademy;

learnLaunchBtn?.addEventListener("click", () => {
  learningAcademy.open();
  learnLaunchBtn.blur();
});

gamesOpenLearnBtn?.addEventListener("click", () => {
  if (typeof gamesDialog?.close === "function") gamesDialog.close();
  else if (gamesDialog) gamesDialog.hidden = true;
  learningAcademy.open();
  gamesOpenLearnBtn.blur();
});

arcadeExitBtn?.addEventListener("click", () => {
  engine?.stopArcadeGame?.();
  arcadeExitBtn.blur();
});

arcadeGameOverExitBtn?.addEventListener("click", () => {
  engine?.stopArcadeGame?.();
  arcadeGameOverExitBtn.blur();
});

arcadePlayAgainBtn?.addEventListener("click", () => {
  engine?.arcadeControl?.("restart");
  arcadePlayAgainBtn.blur();
});

arcadeHonkBtn?.addEventListener("click", () => {
  engine?.arcadeControl?.("honk");
  arcadeHonkBtn.blur();
});

arcadeAutoDriveBtn?.addEventListener("click", () => {
  engine?.arcadeControl?.("autoDrive");
  arcadeAutoDriveBtn.blur();
});

arcadeCarLevelBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const level = Number(btn.getAttribute("data-car-level"));
    if (!Number.isFinite(level)) return;
    engine?.arcadeControl?.("carLevel", level);
    btn.blur();
  });
});

arcadeCarControls?.querySelectorAll("[data-arcade-hold]").forEach((btn) => {
  const key = btn.getAttribute("data-arcade-hold");
  if (!key) return;
  const setDown = (e) => {
    e.preventDefault();
    btn.classList.add("is-pressed");
    engine?.arcadeControl?.("input", { key, active: true });
  };
  const setUp = () => {
    btn.classList.remove("is-pressed");
    engine?.arcadeControl?.("input", { key, active: false });
  };
  btn.addEventListener("pointerdown", setDown);
  btn.addEventListener("pointerup", setUp);
  btn.addEventListener("pointercancel", setUp);
  btn.addEventListener("pointerleave", setUp);
});

arcadeRunnerControls?.querySelectorAll("[data-arcade-tap]").forEach((btn) => {
  const act = btn.getAttribute("data-arcade-tap");
  if (!act) return;
  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    if (act === "lane-left") engine?.arcadeControl?.("lane", -1);
    else if (act === "lane-right") engine?.arcadeControl?.("lane", 1);
    else if (act === "jump") engine?.arcadeControl?.("jump");
    else if (act === "slide") engine?.arcadeControl?.("slide");
  });
});

// ─── Universal Play Browser & shared game progress ──────────────────────────
let gamesFilter = "all";
let lastPublishedScoreKey = "";
let lastRecordedResultKey = "";
const gameEventListeners = new Set();
const spectateEvents = [];
const sharedLeaderboards = {};
const liveRaceGhosts = new Map();
let gameTarget = null;
const gameClientId = `gi-${Math.random().toString(36).slice(2, 10)}`;

window.__geminIslandGameEvents = {
  clientId: gameClientId,
  subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    gameEventListeners.add(listener);
    return () => gameEventListeners.delete(listener);
  },
  publish(payload) {
    gameEventListeners.forEach((listener) => listener(payload));
    if (staticSnapshotMode) return Promise.resolve(null);
    return fetch("/api/game-events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-meadow-client": "1",
        ...buildVisitorHeaders(),
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  },
};

function escapeGameHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function syncAudioControls() {
  const audio = getGameAudioSettings();
  audioMuteBtn?.classList.toggle("is-muted", audio.muted);
  audioMuteBtn?.setAttribute("aria-pressed", audio.muted ? "true" : "false");
  if (audioMuteIcon) audioMuteIcon.textContent = audio.muted ? "🔇" : "🔊";
  if (audioMuteLabel) audioMuteLabel.textContent = audio.muted ? "Muted" : "Sound";
  if (gamesVolumeEl) gamesVolumeEl.value = String(Math.round(audio.volume * 100));
}

function currentGameHighlightEntries() {
  const byKind = new Map();
  for (const entry of engine?.getInteractiveDirectory?.() || []) {
    if (entry.kind && !byKind.has(entry.kind)) byKind.set(entry.kind, entry);
  }
  return IN_WORLD_GAMES.map((game) => {
    const target = byKind.get(game.id);
    return target
      ? { id: target.id, name: game.title, x: target.x, z: target.z, color: game.color }
      : null;
  }).filter(Boolean);
}

function updateGameTargetMarker() {
  if (!gameTargetMarkerEl) return;
  if (!gameTarget || engine?.isArcadeActive?.()) {
    gameTargetMarkerEl.hidden = true;
    return;
  }
  const cam = engine?.getCameraState?.() || {};
  const from = engine?.getCameraTarget?.() || { x: 0, z: 0 };
  const dx = gameTarget.x - from.x;
  const dz = gameTarget.z - from.z;
  const distance = Math.hypot(dx, dz);
  if (!Number.isFinite(distance)) {
    gameTargetMarkerEl.hidden = true;
    return;
  }
  gameTargetMarkerEl.hidden = false;
  const fwdX = cam.fpActive ? -Math.sin(cam.fpYaw || 0) : Math.sin(cam.az || 0);
  const fwdZ = cam.fpActive ? -Math.cos(cam.fpYaw || 0) : Math.cos(cam.az || 0);
  const rightX = cam.fpActive ? Math.cos(cam.fpYaw || 0) : Math.cos(cam.az || 0);
  const rightZ = cam.fpActive ? -Math.sin(cam.fpYaw || 0) : -Math.sin(cam.az || 0);
  const angle = Math.atan2(dx * rightX + dz * rightZ, dx * fwdX + dz * fwdZ);
  if (gameTargetArrowEl) {
    gameTargetArrowEl.style.transform = `rotate(${(angle * 180) / Math.PI - 90}deg)`;
  }
  if (gameTargetLabelEl) {
    gameTargetLabelEl.textContent = `${gameTarget.name} · ${Math.round(distance)}m away`;
  }
}

function focusGameTarget(target) {
  gameTarget = target || null;
  engine?.focusCreationById?.(target.id);
  showToast(`${target.name} — follow the glowing marker and compass arrow!`, 4200);
  updateGameTargetMarker();
}

window.setInterval(updateGameTargetMarker, 200);

function currentInteractiveTargets() {
  const byKind = new Map();
  const directory = engine?.getInteractiveDirectory?.() || [];
  for (const entry of directory) {
    if (entry.kind && !byKind.has(entry.kind)) byKind.set(entry.kind, entry);
  }
  return byKind;
}

function renderGamesMenu() {
  if (!gamesListEl) return;
  const targets = currentInteractiveTargets();
  const visibleGames =
    gamesFilter === "arcade"
      ? ARCADE_GAMES
      : gamesFilter === "in_world"
        ? IN_WORLD_GAMES
        : ALL_GAMES;

  gamesListEl.innerHTML = visibleGames
    .map((game) => {
      const isArcade = ARCADE_GAMES.includes(game);
      const target = isArcade ? null : targets.get(game.id);
      // A game that exists in the raw world but vanished from the kids-filtered
      // world is intentionally hidden (e.g. the Jackpot Automaton) — say so.
      const hiddenByKidsMode =
        !isArcade &&
        !target &&
        Boolean(kidsMode?.isEnabled?.()) &&
        (rawWorldData?.creations || []).some((c) => c?.blueprint?.interaction?.kind === game.id);
      const rawBest = game.bestMetric === "moves"
        ? getLowest(game.id, game.bestMetric)
        : getBest(game.id, game.bestMetric);
      const bestText = rawBest > 0 ? `Best ${rawBest}` : "No record yet";
      const buttonLabel = isArcade ? "Launch" : target ? "Go there" : hiddenByKidsMode ? "🔒 Kids Mode" : "Not placed";
      const statusText = isArcade
        ? "Dedicated 3D arena"
        : target
          ? `In the world · ${escapeGameHtml(target.name)}`
          : hiddenByKidsMode
            ? "Hidden in Kids Mode — turn off Kids Mode (top-left toggle) to play"
            : "Sculpt one or find it later";
      const lastResult = getLastResult(game.id);
      const lastText = lastResult
        ? `Last round: ${escapeGameHtml(lastResult.label)}${lastResult.score > 0 ? ` · ${lastResult.score}` : ""}`
        : "No round played yet";
      return `
        <article class="game-card">
          <div class="game-card-head">
            <span class="game-card-icon" style="background:${escapeGameHtml(game.color)}" aria-hidden="true">${escapeGameHtml(game.icon)}</span>
            <span class="game-card-title">${escapeGameHtml(game.title)}</span>
            <span class="game-card-tag">${escapeGameHtml(game.category)}</span>
          </div>
          <div class="game-card-howto">
            <p><strong>How to play</strong></p>
            <p>🎯 ${escapeGameHtml(game.objective)}</p>
            <p>🕹️ ${escapeGameHtml(game.controls)}</p>
            <p>🏁 ${escapeGameHtml(game.winCondition || "Beat your personal best.")}</p>
            <span class="game-card-last">${lastText}</span>
          </div>
          <div class="game-card-footer">
            <span class="game-card-best">🏆 ${bestText}</span>
            <button type="button" class="game-card-button" data-game-id="${escapeGameHtml(game.id)}" ${!isArcade && !target ? "disabled" : ""}>${buttonLabel}</button>
          </div>
          <span class="game-card-controls">${statusText}</span>
        </article>`;
    })
    .join("");

  engine?.setGameHighlights?.(currentGameHighlightEntries());
  if (gamesAchievementsEl) {
    gamesAchievementsEl.textContent = `🏆 ${getAchievementCount()} achievements`;
  }
  if (gamesDifficultyEl) gamesDifficultyEl.value = getSetting("aiDifficulty", "normal");
  if (gamesOnlineBoardEl) gamesOnlineBoardEl.checked = getSetting("boardMode", "local") === "online";
  updateGamesLeaderboard();
}

function updateGamesLeaderboard() {
  if (!gamesLeaderboardEl) return;
  const rows = ARCADE_GAMES.map((game) => ({
    title: game.title,
    score: getBest(game.id, game.bestMetric),
  }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const shared = Object.entries(sharedLeaderboards)
    .map(([gameId, entries]) => {
      const top = Array.isArray(entries) ? entries[0] : null;
      return top && Number(top.score) > 0
        ? `${findGame(gameId)?.shortLabel || findGame(gameId)?.title || gameId}: ${escapeGameHtml(String(top.name))} ${Number(top.score)}`
        : null;
    })
    .filter(Boolean)
    .slice(0, 3);
  const localText = rows.length
    ? `Your bests: ${rows.map((row) => `<strong>${escapeGameHtml(row.title)} ${row.score}</strong>`).join(" · ")}`
    : "Play a game to start your local leaderboard.";
  gamesLeaderboardEl.innerHTML = `${localText}${shared.length ? `<br />Live leaders: ${shared.join(" · ")}` : ""}`;
}

function renderSpectateFeed(rows) {
  if (!gamesSpectateEl) return;
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    gamesSpectateEl.innerHTML = '<div class="games-spectate-row">No live games yet — open a board or start a race.</div>';
    return;
  }
  gamesSpectateEl.innerHTML = list
    .slice(0, 8)
    .map((entry) => {
      const gameTitle = findGame(entry.game)?.title || escapeGameHtml(String(entry.game || "Game"));
      const detail =
        entry.kind === "score"
          ? `score ${Number(entry.score) || 0}`
          : entry.kind === "challenge"
            ? "issued a challenge"
            : entry.kind === "move"
              ? `played move ${Number(entry.move) || 0}`
              : `lap ${Number(entry.lap) || 1} · ${Number(entry.rank) || 4}${ordinalSuffix(Number(entry.rank) || 4)}`;
      return `<div class="games-spectate-row">👀 ${escapeGameHtml(String(entry.name || "Explorer"))} · ${escapeGameHtml(gameTitle)} · ${escapeGameHtml(detail)}</div>`;
    })
    .join("");
}

function ordinalSuffix(n) {
  return n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
}

async function refreshSpectateFeed() {
  if (staticSnapshotMode) {
    renderSpectateFeed([]);
    return;
  }
  try {
    const response = await fetch("/api/game-events", { headers: buildVisitorHeaders() });
    if (!response.ok) return;
    const data = await response.json();
    spectateEvents.length = 0;
    spectateEvents.push(...(Array.isArray(data?.recentEvents) ? data.recentEvents.slice(0, 8) : []));
    if (data?.leaderboards && typeof data.leaderboards === "object") {
      Object.keys(sharedLeaderboards).forEach((key) => delete sharedLeaderboards[key]);
      Object.assign(sharedLeaderboards, data.leaderboards);
    }
    renderSpectateFeed(spectateEvents);
    updateGamesLeaderboard();
  } catch {
    renderSpectateFeed([]);
  }
}

gamesSpectateRefreshBtn?.addEventListener("click", () => {
  void refreshSpectateFeed();
  gamesSpectateRefreshBtn.blur();
});

function openGamesMenu() {
  if (!gamesDialog) return;
  renderGamesMenu();
  void refreshSpectateFeed();
  if (typeof gamesDialog.showModal === "function") gamesDialog.showModal();
  else gamesDialog.hidden = false;
}

async function publishGameScore(gameId, score) {
  if (staticSnapshotMode) return;
  const numeric = Number(score);
  if (!Number.isFinite(numeric) || numeric < 0) return;
  const key = `${gameId}:${Math.round(numeric)}`;
  if (key === lastPublishedScoreKey) return;
  lastPublishedScoreKey = key;
  try {
    await fetch("/api/game-events", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-meadow-client": "1",
        ...buildVisitorHeaders(),
      },
      body: JSON.stringify({ kind: "score", game: gameId, score: Math.round(numeric) }),
    });
  } catch {
    // Shared leaderboards are best-effort; local bests are already stored.
  }
}

gamesLaunchBtn?.addEventListener("click", () => {
  openGamesMenu();
  gamesLaunchBtn.blur();
});

gamesCloseBtn?.addEventListener("click", () => {
  if (typeof gamesDialog?.close === "function") gamesDialog.close();
  else if (gamesDialog) gamesDialog.hidden = true;
});
gamesDialog?.addEventListener("close", () => {
  engine?.setGameHighlights?.([]);
});

document.querySelectorAll("[data-games-filter]").forEach((tab) => {
  tab.addEventListener("click", () => {
    gamesFilter = tab.getAttribute("data-games-filter") || "all";
    document.querySelectorAll("[data-games-filter]").forEach((other) => {
      const active = other === tab;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-selected", active ? "true" : "false");
    });
    renderGamesMenu();
  });
});

gamesListEl?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-game-id]");
  if (!button || button.disabled) return;
  const game = findGame(button.getAttribute("data-game-id"));
  if (!game) return;
  if (typeof gamesDialog?.close === "function") gamesDialog.close();
  else if (gamesDialog) gamesDialog.hidden = true;
  if (ARCADE_GAMES.includes(game)) {
    gameTarget = null;
    if (gameTargetMarkerEl) gameTargetMarkerEl.hidden = true;
    engine?.startArcadeGame?.(game.id);
    return;
  }
  const target = currentInteractiveTargets().get(game.id);
  if (target) {
    focusGameTarget({ id: target.id, x: target.x, z: target.z, name: game.title });
  }
});

gamesDifficultyEl?.addEventListener("change", () => {
  setSetting("aiDifficulty", gamesDifficultyEl.value);
  showToast(`Board game difficulty: ${gamesDifficultyEl.selectedOptions[0]?.textContent || gamesDifficultyEl.value}`);
});

gamesOnlineBoardEl?.addEventListener("change", () => {
  setSetting("boardMode", gamesOnlineBoardEl.checked ? "online" : "local");
  showToast(
    gamesOnlineBoardEl.checked
      ? "Online board games on — open a board to invite a visitor."
      : "Board games are local again.",
  );
});

gamesVolumeEl?.addEventListener("input", () => {
  setGameAudioVolume(Number(gamesVolumeEl.value) / 100);
  syncAudioControls();
});

audioMuteBtn?.addEventListener("click", () => {
  const audio = getGameAudioSettings();
  setGameAudioMuted(!audio.muted);
  syncAudioControls();
  audioMuteBtn.blur();
});

gamesResetBtn?.addEventListener("click", () => {
  if (!window.confirm("Reset all game bests and achievements?")) return;
  resetGameProgress();
  setGameAudioVolume(getSetting("audioVolume", 0.8));
  setGameAudioMuted(Boolean(getSetting("audioMuted", false)));
  setSetting("aiDifficulty", "normal");
  setSetting("boardMode", "local");
  syncAudioControls();
  renderGamesMenu();
  showToast("Game progress reset.");
});

subscribeProgress(() => {
  syncAudioControls();
  if (gamesDialog && !gamesDialog.hidden) renderGamesMenu();
});
syncAudioControls();

camPanBtn?.addEventListener("click", () => {
  engine.setDragMode("pan");
});

camOrbitBtn?.addEventListener("click", () => {
  engine.setDragMode("orbit");
});

camWalkBtn?.addEventListener("click", () => {
  hoverCard.hidden = true;
  if (engine.isFirstPerson()) {
    engine.setDragMode("pan");
    return;
  }
  if (uiState === "picking" || uiState === "composing") {
    hideError();
    chosenSpot = null;
    uiState = "idle";
    syncDockUI();
  }
  engine.setDragMode("walk");
  camWalkBtn.blur();
});

recenterBtn?.addEventListener("click", () => {
  engine.recenterCamera();
  engine.setDragMode("pan");
});

window.addEventListener(
  "pointerdown",
  (e) => {
    if (e.pointerType === "touch" && !sawTouchInput) {
      sawTouchInput = true;
      syncWalkJoystickVisibility();
    }
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  syncWalkJoystickVisibility();
  if (walkEscHintBtn) {
    walkEscHintBtn.hidden = isOgCapture || currentCamMode !== "walk" || isMobileWalkViewport();
  }
});

window.addEventListener("blur", () => {
  if (joyPointerId !== null) resetWalkJoystick();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" && joyPointerId !== null) {
    resetWalkJoystick();
  }
});

function updateWalkJoystickFromPoint(clientX, clientY) {
  if (!walkJoystick) return;
  const rect = walkJoystick.getBoundingClientRect();
  const cx = rect.left + rect.width * 0.5;
  const cy = rect.top + rect.height * 0.5;
  const maxPx = Math.max(24, rect.width * 0.31);
  const dx = clientX - cx;
  const dy = clientY - cy;
  const dist = Math.hypot(dx, dy);
  const clampedPx = Math.min(maxPx, dist);
  const ux = dist > 1e-4 ? dx / dist : 0;
  const uy = dist > 1e-4 ? dy / dist : 0;

  const maxSvg = 34;
  const svgX = ux * (clampedPx / maxPx) * maxSvg;
  const svgY = uy * (clampedPx / maxPx) * maxSvg;
  walkJoystickKnob?.setAttribute("transform", `translate(${svgX.toFixed(1)} ${svgY.toFixed(1)})`);

  const rawMag = clampedPx / maxPx;
  const deadzone = 0.08;
  const eff = rawMag <= deadzone ? 0 : (rawMag - deadzone) / (1 - deadzone);
  const moveRight = ux * eff;
  const moveFwd = -uy * eff;

  walkJoyUp?.classList.toggle("is-lit", moveFwd > 0.28);
  walkJoyDown?.classList.toggle("is-lit", moveFwd < -0.28);
  walkJoyLeft?.classList.toggle("is-lit", moveRight < -0.28);
  walkJoyRight?.classList.toggle("is-lit", moveRight > 0.28);

  engine?.setJoystickInput(moveRight, moveFwd);
}

if (walkJoystick) {
  walkJoystick.addEventListener("contextmenu", (e) => e.preventDefault());

  walkJoystick.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (joyPointerId !== null) return;
    joyPointerId = e.pointerId;
    walkJoystick.classList.add("is-active");
    hoverCard.hidden = true;
    try {
      walkJoystick.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer events in tests may omit active capture handles
    }
    updateWalkJoystickFromPoint(e.clientX, e.clientY);
  });

  walkJoystick.addEventListener("pointermove", (e) => {
    if (joyPointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();
    updateWalkJoystickFromPoint(e.clientX, e.clientY);
  });

  const endJoystickGesture = (e) => {
    if (joyPointerId !== e.pointerId) return;
    e.stopPropagation();
    resetWalkJoystick();
  };

  walkJoystick.addEventListener("pointerup", endJoystickGesture);
  walkJoystick.addEventListener("pointercancel", endJoystickGesture);
  walkJoystick.addEventListener("lostpointercapture", endJoystickGesture);
}

function syncDockUI() {
  if (isOgCapture) return;

  addBtn.hidden = true;
  pickSpotPill.hidden = true;
  bottomBuilder.hidden = true;
  buildingPill.hidden = true;
  readyGotoBtn.hidden = true;
  locateMineBtn.hidden = true;

  if (myCreationId && uiState !== "ready") {
    uiState = "placed";
  }

  document.body.dataset.kidsUiBusy =
    uiState === "picking" || uiState === "composing" || uiState === "building" ? "1" : "0";

  switch (uiState) {
    case "picking":
      pickSpotPill.hidden = false;
      engine.setSpotPickerState({
        mode: "picking",
        ...(chosenSpot ? { x: chosenSpot.x, z: chosenSpot.z } : {}),
      });
      break;
    case "composing":
      bottomBuilder.hidden = false;
      engine.setPreviewPrompt(promptInput.value);
      engine.setSpotPickerState({
        mode: "staked",
        x: chosenSpot?.x ?? 16,
        z: chosenSpot?.z ?? 10,
      });
      break;
    case "building":
      buildingPill.hidden = false;
      renderActiveJobLabel();
      engine.setSpotPickerState({
        mode: "building",
        x: chosenSpot?.x ?? 16,
        z: chosenSpot?.z ?? 10,
      });
      break;
    case "ready": {
      readyGotoBtn.hidden = false;
      const name = readyCreation?.name || "your creation";
      readyGotoLabel.textContent = `Ready · Go to ${name}`;
      engine.setSpotPickerState({ mode: "hidden" });
      break;
    }
    case "placed": {
      locateMineBtn.hidden = false;
      const mine = worldData?.creations?.find((c) => c.id === myCreationId);
      locateMineLabel.textContent = mine ? `Locate · ${mine.name}` : "Locate yours";
      engine.setSpotPickerState({ mode: "hidden" });
      break;
    }
    default:
      addBtn.hidden = false;
      engine.setSpotPickerState({ mode: "hidden" });
      break;
  }
}

async function pollActiveJob() {
  if (!activeJob || jobPollInFlight) return;
  jobPollInFlight = true;
  try {
    const res = await fetch(`/api/job?id=${encodeURIComponent(activeJob.jobId)}`, {
      headers: buildVisitorHeaders(),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data?.visitorToken) storeVisitorToken(data.visitorToken);
    if (!data.ok || !data.job) return;

    const job = data.job;
    if (job.status === "done") {
      stopJobTracking();
      sculptBtn.disabled = false;
      if (data.world) {
        applyEffectiveWorld(data.world);
      }
      if (data.feeds) {
        engine.applyLiveFeeds(data.feeds);
      }
      myCreationId = job.creationId || data.world?.myCreationId || myCreationId;
      readyCreation =
        job.creation || worldData?.creations?.find((c) => c.id === myCreationId) || null;
      uiState = "ready";
      syncDockUI();
      return;
    }

    if (job.status === "failed") {
      stopJobTracking();
      sculptBtn.disabled = false;
      if (job.creationId) {
        myCreationId = job.creationId;
        uiState = "placed";
        syncDockUI();
        return;
      }
      uiState = "composing";
      syncDockUI();
      showFormError(job.error || "Could not build that right now — try again.");
      return;
    }

    activeJob = { ...job };
    renderActiveJobLabel();
  } catch {
    // ignore transient poll hiccups; next tick or WS broadcast will recover
  } finally {
    jobPollInFlight = false;
  }
}

function startTrackingJob(jobInfo) {
  stopJobTracking();
  activeJob = { ...jobInfo };
  uiState = "building";
  syncDockUI();

  jobPollInterval = setInterval(() => {
    if (uiState === "building" && activeJob) {
      pollActiveJob();
    }
  }, 2500);
}

// Dynamically resize the 3D staked plot on the island as the visitor describes tiny vs colossal subjects!
promptInput.addEventListener("input", () => {
  engine.setPreviewPrompt(promptInput.value);
});

// 1. Click "+ Add" -> pick where on the island it will go
addBtn.addEventListener("click", () => {
  if (engine.isFirstPerson()) {
    engine.setDragMode("pan");
  }
  if (myCreationId) {
    uiState = "placed";
    syncDockUI();
    return;
  }
  hoverCard.hidden = true;
  engine.setPreviewPrompt(promptInput.value);
  uiState = "picking";
  syncDockUI();
});

cancelPickBtn.addEventListener("click", () => {
  chosenSpot = null;
  uiState = "idle";
  syncDockUI();
});

moveSpotBtn.addEventListener("click", () => {
  uiState = "picking";
  syncDockUI();
});

closeBuilderBtn.addEventListener("click", () => {
  hideError();
  chosenSpot = null;
  uiState = "idle";
  syncDockUI();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (
      characterBuilder?.isOpen?.() ||
      (avatarDialog &&
        (avatarDialog.open || (e.target instanceof Node && avatarDialog.contains(e.target)))) ||
      performance.now() - lastAvatarDialogCloseMs < 80
    ) {
      return;
    }
    if (uiState === "picking" || uiState === "composing") {
      e.preventDefault();
      hideError();
      chosenSpot = null;
      uiState = "idle";
      syncDockUI();
    } else if (engine.isFirstPerson()) {
      e.preventDefault();
      hoverCard.hidden = true;
      engine.setDragMode("pan");
    }
  }
});

worldCanvas.addEventListener("pointerleave", () => {
  hoverCard.hidden = true;
});

readyGotoBtn.addEventListener("click", () => {
  if (!myCreationId) return;
  hoverCard.hidden = true;
  uiState = "placed";
  syncDockUI();
  engine.focusCreationById(myCreationId);
  const mine = worldData?.creations?.find((c) => c.id === myCreationId) || readyCreation;
  if (mine) {
    const desc = mine.description || mine.behavior?.statusLine || "";
    showToast(desc ? `${mine.name} — ${desc}` : mine.name, 4600);
  }
});

locateMineBtn.addEventListener("click", () => {
  if (!myCreationId) return;
  hoverCard.hidden = true;
  engine.focusCreationById(myCreationId);
  const mine = worldData?.creations?.find((c) => c.id === myCreationId);
  if (mine) {
    const desc = mine.description || mine.behavior?.statusLine || "";
    showToast(desc ? `${mine.name} — ${desc}` : mine.name);
  }
});

async function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Unsupported image format"));
      img.onload = () => {
        const maxSide = 960;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const c = document.createElement("canvas");
        c.width = Math.max(1, width);
        c.height = Math.max(1, height);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.86));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function showFormError(msg) {
  formError.textContent = msg;
  formError.hidden = false;
}

function hideError() {
  formError.hidden = true;
}

async function handleSelectedFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    showFormError("Choose a PNG, JPG, or WebP image.");
    return;
  }
  hideError();
  try {
    selectedImageDataUrl = await resizeImageFile(file);
    dropPreviewImg.src = selectedImageDataUrl;
    dropEmpty.hidden = true;
    dropPreviewWrap.hidden = false;
  } catch (err) {
    showFormError(err.message || "Could not process that image.");
  }
}

imageInput.addEventListener("change", () => {
  const file = imageInput.files?.[0];
  if (file) handleSelectedFile(file);
});

clearImageBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  selectedImageDataUrl = null;
  imageInput.value = "";
  dropPreviewImg.removeAttribute("src");
  dropPreviewWrap.hidden = true;
  dropEmpty.hidden = false;
});

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer?.files?.[0];
  if (file) handleSelectedFile(file);
});

window.addEventListener("paste", (e) => {
  if (uiState !== "composing") return;
  const items = e.clipboardData?.items || [];
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      const f = item.getAsFile();
      if (f) handleSelectedFile(f);
      break;
    }
  }
});

// Enqueue build into the multi-user workshop queue -> close builder immediately so visitor can explore while watching live build stages!
sculptBtn.addEventListener("click", async () => {
  if (uiState === "building") return;
  hideError();
  const prompt = promptInput.value.trim();
  if (!prompt && !selectedImageDataUrl) {
    showFormError("Add a photo or short description first.");
    return;
  }

  engine.setPreviewPrompt(prompt);
  const spotX = chosenSpot?.x ?? null;
  const spotZ = chosenSpot?.z ?? null;

  uiState = "building";
  sculptBtn.disabled = true;
  buildingPillLabel.textContent = "Approving query…";
  if (buildingPillSub) {
    buildingPillSub.textContent = "Being built with Gemini 4 Hydrogen";
  }
  syncDockUI();

  try {
    const res = await fetch("/api/build", {
      method: "POST",
      headers: buildVisitorHeaders({
        "content-type": "application/json",
        "x-meadow-client": "1",
      }),
      body: JSON.stringify({
        prompt,
        imageDataUrl: selectedImageDataUrl || undefined,
        x: spotX,
        z: spotZ,
      }),
    });
    const data = await res.json();
    if (data?.visitorToken) storeVisitorToken(data.visitorToken);

    if (!res.ok || !data.ok) {
      sculptBtn.disabled = false;
      if (data.alreadyPlaced && data.myCreationId) {
        myCreationId = data.myCreationId;
        uiState = "placed";
        syncDockUI();
        return;
      }
      uiState = "composing";
      syncDockUI();
      showFormError(data.error || "Could not build that right now — try again.");
      return;
    }

    if (data.job) {
      startTrackingJob(data.job);
      return;
    }

    // Direct synchronous fallback if ever returned
    sculptBtn.disabled = false;
    myCreationId = data.creation.id;
    readyCreation = data.creation;
    if (data.feeds) engine.applyLiveFeeds(data.feeds);
    applyEffectiveWorld(data.world);
    uiState = "ready";
    syncDockUI();
  } catch {
    sculptBtn.disabled = false;
    uiState = "composing";
    syncDockUI();
    showFormError("Network hiccup while building — try again.");
  }
});

promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sculptBtn.click();
  }
});

async function refreshLiveFeeds() {
  if (staticSnapshotMode) return;
  try {
    const res = await fetch("/api/feeds");
    if (!res.ok) return;
    const data = await res.json();
    if (data.ok && data.feeds) {
      engine.applyLiveFeeds(data.feeds);
    }
  } catch {
    // ignore transient feed errors
  }
}

async function refreshDailyEligibility() {
  if (staticSnapshotMode) return;
  if (isOgCapture || uiState === "building" || uiState === "ready") return;
  try {
    const res = await fetch("/api/world", {
      headers: buildVisitorHeaders(),
    });
    if (!res.ok) return;
    const latest = await res.json();
    if (latest?.visitorToken) storeVisitorToken(latest.visitorToken);
    myCreationId = latest.myCreationId || null;
    applyEffectiveWorld(latest);
    if (latest.myActiveJob && !myCreationId) {
      startTrackingJob(latest.myActiveJob);
    } else if (!myCreationId && uiState === "placed") {
      uiState = "idle";
      syncDockUI();
    }
  } catch {
    // ignore transient network errors
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    if (uiState === "building" && activeJob) {
      pollActiveJob();
    } else {
      refreshDailyEligibility();
    }
  }
});

function handleWorldMessage(msg) {
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "game_event") {
    spectateEvents.unshift(msg);
    spectateEvents.length = Math.min(spectateEvents.length, 8);
    if (gamesDialog && !gamesDialog.hidden) renderSpectateFeed(spectateEvents);
    if (msg.kind === "score") {
      addRemoteScore(msg.game, { name: msg.name || "Explorer", score: msg.score });
      updateGamesLeaderboard();
      gameEventListeners.forEach((listener) => listener(msg));
    } else if (msg.kind === "challenge") {
      showToast(`${msg.name || "An explorer"} challenged you to ${findGame(msg.game)?.title || "a game"}!`, 5200);
      gameEventListeners.forEach((listener) => listener(msg));
    } else if (msg.kind === "move") {
      gameEventListeners.forEach((listener) => listener(msg));
    } else if (msg.kind === "position") {
      if (msg.clientId && msg.clientId !== gameClientId) {
        liveRaceGhosts.set(msg.clientId, { ...msg, seenAt: Date.now() });
      }
      const now = Date.now();
      for (const [id, ghost] of liveRaceGhosts) {
        if (now - ghost.seenAt > 5_000) liveRaceGhosts.delete(id);
      }
      engine?.setRemoteRaceGhosts?.([...liveRaceGhosts.values()]);
      gameEventListeners.forEach((listener) => listener(msg));
    }
    return;
  }
  if (msg.type === "queue_tick" && activeJob && uiState === "building") {
    const qIdx = Array.isArray(msg.queuedIds) ? msg.queuedIds.indexOf(activeJob.jobId) : -1;
    const activeEntry = Array.isArray(msg.sculpting)
      ? msg.sculpting.find((s) => s.jobId === activeJob.jobId)
      : null;
    if (qIdx >= 0) {
      activeJob.status = "queued";
      activeJob.phase = "queued";
      activeJob.position = qIdx + 1;
      renderActiveJobLabel();
    } else if (activeEntry) {
      activeJob.status = "sculpting";
      if (activeEntry.phase) {
        activeJob.phase = activeEntry.phase;
      } else if (activeJob.phase === "queued") {
        activeJob.phase = "sculpting";
      }
      activeJob.position = 0;
      renderActiveJobLabel();
    }
    pollActiveJob();
    return;
  }

  if ((msg.type === "creation_placed" || msg.type === "world_updated") && msg.world) {
    applyEffectiveWorld({
      ...msg.world,
      myCreationId,
    });
    if (uiState === "building" && activeJob) {
      pollActiveJob();
    } else if (uiState === "placed" || uiState === "ready") {
      syncDockUI();
    }
    refreshLiveFeeds();

    if (
      msg.type === "creation_placed" &&
      msg.creation &&
      msg.creation.id !== myCreationId &&
      uiState !== "building"
    ) {
      showToast(`Someone added "${msg.creation.name}" to IREOLUWA!`, 4200);
    }
  }
}

function initMultiplayer() {
  if (mpClient || isOgCapture || typeof window === "undefined") return;
  // Multiplayer needs the live server; this is only called once the live /api/world
  // has responded, so the static deployment never opens a WebSocket.
  mpClient = createMultiplayerClient({
    multiplayerEnabled: true,
    getLocalPose: () => engine?.getLocalMultiplayerPose?.(),
    getLocalProfile: () => engine?.getLocalAppearance?.(),
    getExtraHeaders: () => buildVisitorHeaders(),
    onWorldMessage: handleWorldMessage,
    onWelcome(msg) {
      engine?.syncMultiplayerWelcome?.(msg?.players || []);
      if (typeof msg?.onlineCount === "number") {
        updateOnlinePill(msg.onlineCount);
      }
    },
    onPeerJoin(player, msg) {
      engine?.upsertRemotePlayer?.(player);
      if (typeof msg?.onlineCount === "number") {
        updateOnlinePill(msg.onlineCount);
      }
    },
    onPeerPose(poseMsg) {
      engine?.updateRemotePlayerPose?.(poseMsg);
    },
    onPeerProfile(profileMsg) {
      engine?.updateRemotePlayerProfile?.(profileMsg);
    },
    onPeerEmote(emoteMsg) {
      engine?.triggerRemotePlayerEmote?.(emoteMsg);
    },
    onPeerLeave(id, msg) {
      engine?.removeRemotePlayer?.(id);
      if (typeof msg?.onlineCount === "number") {
        updateOnlinePill(msg.onlineCount);
      }
    },
    onOnlineCountChange(count) {
      updateOnlinePill(count);
    },
  });
  window.__geminIslandMp = mpClient;
}

let staticSnapshotMode = false;

async function applyStaticSnapshot() {
  staticSnapshotMode = true;
  const res = await fetch("/world-snapshot.json", { cache: "force-cache" });
  if (!res.ok) throw new Error(`world snapshot ${res.status}`);
  const snapshot = await res.json();
  myCreationId = null;
  applyEffectiveWorld(snapshot);
  if (!isOgCapture) {
    if (uiState !== "building" && uiState !== "ready") {
      uiState = "idle";
    }
    syncDockUI();
  }
}

async function initWorld() {
  let loadedLive = false;
  try {
    const res = await fetch("/api/world", {
      headers: buildVisitorHeaders(),
    });
    if (res.ok) {
      const initialWorld = await res.json();
      if (initialWorld?.visitorToken) storeVisitorToken(initialWorld.visitorToken);
      myCreationId = initialWorld.myCreationId || myCreationId || null;
      applyEffectiveWorld(initialWorld);
      loadedLive = true;
      initMultiplayer();
      if (!isOgCapture) {
        if (myCreationId) {
          uiState = "placed";
          syncDockUI();
        } else if (worldData.myActiveJob) {
          startTrackingJob(worldData.myActiveJob);
        } else {
          uiState = "idle";
          syncDockUI();
        }
      }
    }
  } catch (err) {
    console.warn("Live world unavailable; loading built-in island snapshot.", err);
  }
  if (!loadedLive && !rawWorldData) {
    showToast("Live server not reachable — playing on the built-in IREOLUWA island.", 4600);
    try {
      await applyStaticSnapshot();
    } catch (snapshotErr) {
      console.error("Failed to load island snapshot:", snapshotErr);
    }
  }

  refreshLiveFeeds();
  if (!isOgCapture) {
    setInterval(refreshLiveFeeds, 90_000);
    setInterval(refreshDailyEligibility, 10 * 60_000);
  }
}

// ─── Island Deeds — The Outer Shoals marketplace ───────────────────────────────
const islandStore = { enabled: false, testMode: false };
const BIOME_LABEL = {
  meadow_clover: "Clover Meadow",
  sandy_shore: "Beach",
  misty_moss: "Misty Moss",
  volcanic_basalt: "Volcanic",
  snow_frost: "Snow & Frost",
  stone_plaza: "Stone Plaza",
  autumn_grove: "Autumn Grove",
  desert_mesa: "Desert Mesa",
};

function updateIslandDeedsStatus() {
  const owned = getDeeds().length;
  if (islandDeedsOwnedCount) islandDeedsOwnedCount.textContent = `${owned} of 20 deeds owned`;
  if (!islandDeedsStatus) return;
  if (islandStore.enabled) {
    islandDeedsStatus.dataset.state = islandStore.testMode ? "test" : "open";
    islandDeedsStatusText.textContent = islandStore.testMode
      ? "Deed office in TEST MODE — checkout is free local magic, no card charged"
      : "Deed office open — secure Stripe checkout";
  } else {
    islandDeedsStatus.dataset.state = "closed";
    islandDeedsStatusText.textContent = "The deed office is opening at launch — card payments not switched on yet.";
  }
}

function renderIslandDeeds(flashId = null) {
  if (!islandDeedsGrid) return;
  const deeds = getDeeds();
  const deedById = new Map(deeds.map((d) => [d.islandId, d]));
  const cards = [];
  for (const island of SHOALS_ISLANDS) {
    const deed = deedById.get(island.id);
    const owned = Boolean(deed);
    const deedName = deed?.name || null;
    const title = island.name || deedName || "Unnamed Isle";
    const biome = BIOME_LABEL[island.biome] || island.biome;
    const sizeLine = `${island.diameterMeters} m across · ${island.areaSqm.toLocaleString()} m²`;
    const price = formatPrice(island.priceCents);
    const ownedBlock = owned
      ? `
        <span class="island-owned-badge">✓ YOUR DEED</span>
        ${
          island.name
            ? `<div class="island-card-meta">Name of the Shoals — permanent.</div>`
            : `<div class="island-card-meta">You named it <strong>${escapeGameHtml(deedName || "Unnamed Isle")}</strong></div>
               <div class="island-rename-row" style="display:flex;gap:6px;">
                 <input class="island-name-input" data-rename-for="${island.id}" maxlength="24" value="${escapeGameHtml(deedName || "")}" aria-label="Rename island" />
                 <button type="button" class="island-rename-btn" data-action="rename" data-island-id="${island.id}">Rename</button>
               </div>`
        }
        <button type="button" class="island-visit-btn" data-action="visit" data-island-id="${island.id}">🧭 Visit my island</button>`
      : `
        <div class="island-card-price">${price}<small>one-time deed</small></div>
        ${
          island.name
            ? ""
            : `<input class="island-name-input" data-name-for="${island.id}" maxlength="24" placeholder="Name your island…" aria-label="Name your island" />`
        }
        <button type="button" class="island-buy-btn" data-action="buy" data-island-id="${island.id}">Buy — ${price}</button>`;
    cards.push(`
      <article class="island-card${owned ? " is-owned" : ""}${flashId === island.id ? " is-flash" : ""}" data-island-id="${island.id}">
        <div class="island-card-top">
          <h3 class="island-card-name">${escapeGameHtml(title)}</h3>
          <span class="island-card-biome">${escapeGameHtml(biome)}</span>
        </div>
        <div class="island-card-meta">${escapeGameHtml(sizeLine)}</div>
        <p class="island-card-blurb">${escapeGameHtml(island.blurb)}</p>
        ${ownedBlock}
      </article>`);
  }
  islandDeedsGrid.innerHTML = cards.join("");
  updateIslandDeedsStatus();
}

async function openIslandDeeds(flashId = null) {
  if (!islandDeedsDialog) return;
  try {
    const cfg = await fetchIslandConfig();
    islandStore.enabled = cfg.enabled;
    islandStore.testMode = cfg.testMode;
  } catch {
    islandStore.enabled = false;
    islandStore.testMode = false;
  }
  renderIslandDeeds(flashId);
  if (!islandDeedsDialog.open) islandDeedsDialog.showModal();
  if (flashId) {
    const target = islandDeedsGrid?.querySelector(`.island-card[data-island-id="${flashId}"]`);
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

async function requestIslandPurchase(island, customName) {
  const result = await beginIslandPurchase(island.id, customName, "Explorer");
  if (result.ok && result.redirectUrl) {
    window.location.assign(result.redirectUrl);
    return;
  }
  showToast(result.error || "Could not start checkout.", 4600);
}

function onBuyIslandClick(island) {
  if (!islandStore.enabled) {
    showToast("The deed office opens at launch — check back soon!", 4200);
    return;
  }
  let customName = "";
  if (!island.name) {
    const input = islandDeedsGrid?.querySelector(`[data-name-for="${island.id}"]`);
    customName = input?.value?.trim() || "";
    if (!customName) {
      showToast("Name your island before buying its deed.", 3600);
      input?.focus();
      return;
    }
  }
  const proceed = () => requestIslandPurchase(island, customName);
  if (kidsMode?.isEnabled?.()) {
    openParentGate(proceed);
  } else {
    proceed();
  }
}

// ── Parent gate (kids mode): math check + press-and-hold to confirm ───────────
const PARENT_GATE_HOLD_MS = 1200;
let parentGatePass = null;
let parentGateHoldTimer = 0;

function resetParentGateHold() {
  clearTimeout(parentGateHoldTimer);
  parentGateHoldTimer = 0;
  if (parentGateHold) {
    parentGateHold.dataset.holding = "0";
    if (parentGateHoldFill) {
      parentGateHoldFill.style.transition = "none";
      parentGateHoldFill.style.width = "0%";
    }
  }
}

function openParentGate(onPass) {
  if (!parentGateDialog) {
    onPass();
    return;
  }
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 2 + Math.floor(Math.random() * 8);
  parentGateDialog.dataset.sum = String(a + b);
  if (parentGateMath) parentGateMath.textContent = `${a} + ${b} = ?`;
  if (parentGateAnswer) parentGateAnswer.value = "";
  if (parentGateError) parentGateError.textContent = "";
  resetParentGateHold();
  parentGatePass = onPass;
  if (!parentGateDialog.open) parentGateDialog.showModal();
  parentGateAnswer?.focus();
}

function completeParentGate() {
  resetParentGateHold();
  parentGateDialog?.close();
  const cb = parentGatePass;
  parentGatePass = null;
  cb?.();
}

parentGateHold?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  const sum = Number(parentGateDialog?.dataset?.sum || -1);
  const answer = Number(parentGateAnswer?.value ?? NaN);
  if (answer !== sum) {
    if (parentGateError) parentGateError.textContent = "Solve the sum first, then hold the green button.";
    parentGateAnswer?.focus();
    return;
  }
  if (parentGateError) parentGateError.textContent = "";
  parentGateHold.dataset.holding = "1";
  if (parentGateHoldFill) {
    parentGateHoldFill.style.transition = `width ${PARENT_GATE_HOLD_MS}ms linear`;
    // Force a style flush so the transition always starts from 0%.
    void parentGateHoldFill.offsetWidth;
    parentGateHoldFill.style.width = "100%";
  }
  clearTimeout(parentGateHoldTimer);
  parentGateHoldTimer = window.setTimeout(completeParentGate, PARENT_GATE_HOLD_MS);
});
["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
  parentGateHold?.addEventListener(type, () => resetParentGateHold());
});
parentGateCancel?.addEventListener("click", () => {
  resetParentGateHold();
  parentGatePass = null;
  parentGateDialog?.close();
});

islandDeedsBtn?.addEventListener("click", () => {
  void openIslandDeeds();
});
islandDeedsCloseBtn?.addEventListener("click", () => islandDeedsDialog?.close());
islandReturnBtn?.addEventListener("click", () => {
  engine?.teleportHomeIsland?.();
});
islandExportBtn?.addEventListener("click", async () => {
  const bundle = exportDeedBundle();
  if (!bundle) {
    showToast("No deeds yet — buy an island first!", 3600);
    return;
  }
  try {
    await navigator.clipboard.writeText(bundle);
    showToast("Deed code copied — paste it on any device to restore your islands.", 4600);
  } catch {
    showToast("Could not copy automatically — your deed code is in the store console.", 3600);
    console.info("Island deed code:", bundle);
  }
});
islandRestoreBtn?.addEventListener("click", () => {
  const raw = islandRestoreInput?.value?.trim();
  if (!raw) {
    showToast("Paste a deed code first.", 3200);
    return;
  }
  const result = importDeedBundle(raw);
  if (!result.ok) {
    showToast(result.error || "That deed code did not work.", 4200);
    return;
  }
  islandRestoreInput.value = "";
  showToast(`Restored ${result.added} deed${result.added === 1 ? "" : "s"} — welcome back, landowner!`, 4600);
  engine?.refreshIslandDeeds?.();
  renderIslandDeeds();
});
islandDeedsGrid?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-action]");
  if (!btn) return;
  const id = btn.dataset.islandId;
  const island = getCatalogIsland(id);
  if (!island) return;
  const action = btn.dataset.action;

  if (action === "buy") {
    onBuyIslandClick(island);
    return;
  }
  if (action === "visit") {
    engine?.teleportToIslandId?.(island.id);
    islandDeedsDialog?.close();
    showToast(`Welcome to ${getIslandDisplayName(island)} — press + Add to build your dream.`, 4600);
    return;
  }
  if (action === "rename") {
    const input = islandDeedsGrid.querySelector(`[data-rename-for="${island.id}"]`);
    const nextName = input?.value?.trim() || "";
    if (!nextName) {
      showToast("Type the new name first.", 3200);
      return;
    }
    void renameOwnedIsland(island.id, nextName).then((result) => {
      if (result.ok) {
        showToast(`Renamed to ${result.name} — the Shoals approve.`, 4200);
        engine?.refreshIslandDeeds?.();
        renderIslandDeeds(island.id);
      } else {
        showToast(result.error || "Rename failed.", 4200);
      }
    });
  }
});

// Returning from Stripe Checkout? Fulfil the pending deed.
const deedSession = urlParams.get("deed_session");
const deedCancelled = urlParams.get("deed_cancelled");
if (deedSession || deedCancelled) {
  urlParams.delete("deed_session");
  urlParams.delete("deed_cancelled");
  const clean = `${location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${location.hash}`;
  try {
    history.replaceState(null, "", clean);
  } catch {
    // non-fatal
  }
}

async function handleDeedBoot() {
  if (deedCancelled) {
    showToast("Checkout cancelled — everything stays as it was.", 3800);
  }
  if (deedSession) {
    const result = await fulfillPendingPurchase(deedSession);
    if (result.ok) {
      showToast(`🎉 ${result.name} is officially yours!`, 5200);
      engine?.refreshIslandDeeds?.();
      await openIslandDeeds(result.island?.id || null);
      return;
    }
    showToast(result.error || "We couldn't confirm that purchase.", 5200);
    await openIslandDeeds();
    return;
  }
  // Quietly verify cached deeds against the server; drop anything rejected.
  try {
    await verifyDeedsWithServer();
    engine?.refreshIslandDeeds?.();
  } catch {
    // offline — keep local deeds
  }
  updateIslandDeedsStatus();
}
handleDeedBoot();

initWorld();
