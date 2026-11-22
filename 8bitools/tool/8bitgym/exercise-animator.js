window.IRONLOG_ANIMATOR = (() => {
  'use strict';

  // Grounded at y = 206. Nested joint hierarchies ensure limbs & equipment never float or detach.
  const STATIC_CSS = `
    <style>
      .an-floor { stroke: #1e293b; stroke-width: 3; stroke-linecap: round; }
      .an-equip { stroke: #334155; fill: #334155; stroke-linecap: round; stroke-linejoin: round; }
      .an-equip-l { stroke: #475569; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .an-body  { stroke: #94a3b8; fill: #94a3b8; stroke-linecap: round; stroke-linejoin: round; }
      .an-limb  { stroke: #cbd5e1; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .an-bar   { stroke: #e2e8f0; stroke-linecap: round; }
      .an-plate { fill: #3b82f6; }
      .an-glow  { fill: #38bdf8; opacity: 0.85; }
      .an-glow-s { stroke: #38bdf8; fill: none; stroke-linecap: round; opacity: 0.85; }
    </style>
  `;

  const SHARED_CSS = `
    <style>
      .an-floor { stroke: #1e293b; stroke-width: 3; stroke-linecap: round; }
      .an-equip { stroke: #334155; fill: #334155; stroke-linecap: round; stroke-linejoin: round; }
      .an-equip-l { stroke: #475569; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .an-body  { stroke: #94a3b8; fill: #94a3b8; stroke-linecap: round; stroke-linejoin: round; }
      .an-limb  { stroke: #cbd5e1; fill: none; stroke-linecap: round; stroke-linejoin: round; }
      .an-bar   { stroke: #e2e8f0; stroke-linecap: round; }
      .an-plate { fill: #3b82f6; }
      .an-glow  { fill: #38bdf8; animation: anPulse 1.8s ease-in-out infinite; }
      .an-glow-s { stroke: #38bdf8; fill: none; stroke-linecap: round; animation: anPulse 1.8s ease-in-out infinite; }
      @keyframes anPulse { 0%, 100% { opacity: 0.38; } 50% { opacity: 1; } }

      /* Press (2-link IK vertical) */
      .an-bp-ua { transform-origin: 104px 140px; animation: anBpUa 1.9s ease-in-out infinite; }
      .an-bp-fa { transform-origin: 104px 114px; animation: anBpFa 1.9s ease-in-out infinite; }
      @keyframes anBpUa { 0%, 100% { transform: rotate(-48deg); } 50% { transform: rotate(0deg); } }
      @keyframes anBpFa { 0%, 100% { transform: rotate(96deg); }  50% { transform: rotate(0deg); } }

      /* Incline Press (pivoted around tilted shoulder) */
      .an-ibp-ua { transform-origin: 96px 118px; animation: anIbpUa 1.9s ease-in-out infinite; }
      .an-ibp-fa { transform-origin: 96px 92px;  animation: anIbpFa 1.9s ease-in-out infinite; }
      @keyframes anIbpUa { 0%, 100% { transform: rotate(-45deg); } 50% { transform: rotate(4deg); } }
      @keyframes anIbpFa { 0%, 100% { transform: rotate(90deg); }  50% { transform: rotate(-4deg); } }

      /* Decline Press */
      .an-dbp-ua { transform-origin: 108px 146px; animation: anDbpUa 1.9s ease-in-out infinite; }
      .an-dbp-fa { transform-origin: 108px 120px; animation: anDbpFa 1.9s ease-in-out infinite; }
      @keyframes anDbpUa { 0%, 100% { transform: rotate(-46deg); } 50% { transform: rotate(2deg); } }
      @keyframes anDbpFa { 0%, 100% { transform: rotate(92deg); }  50% { transform: rotate(-2deg); } }

      /* Seated Chest Press (horizontal push) */
      .an-cp-ua { transform-origin: 98px 98px;  animation: anCpUa 1.8s ease-in-out infinite; }
      .an-cp-fa { transform-origin: 124px 98px; animation: anCpFa 1.8s ease-in-out infinite; }
      @keyframes anCpUa { 0%, 100% { transform: rotate(38deg); }  50% { transform: rotate(0deg); } }
      @keyframes anCpFa { 0%, 100% { transform: rotate(-76deg); } 50% { transform: rotate(0deg); } }

      /* Dumbbell Fly (wide arc) */
      .an-fly-l { transform-origin: 104px 96px; animation: anFlyL 2s ease-in-out infinite; }
      .an-fly-r { transform-origin: 136px 96px; animation: anFlyR 2s ease-in-out infinite; }
      @keyframes anFlyL { 0%, 100% { transform: rotate(-72deg); } 50% { transform: rotate(-8deg); } }
      @keyframes anFlyR { 0%, 100% { transform: rotate(72deg); }  50% { transform: rotate(8deg); } }

      /* Cable Crossover / Fly */
      .an-cf-l { transform-origin: 102px 84px; animation: anCfL 1.9s ease-in-out infinite; }
      .an-cf-r { transform-origin: 138px 84px; animation: anCfR 1.9s ease-in-out infinite; }
      @keyframes anCfL { 0%, 100% { transform: rotate(65deg); }  50% { transform: rotate(-10deg); } }
      @keyframes anCfR { 0%, 100% { transform: rotate(-65deg); } 50% { transform: rotate(10deg); } }

      /* Push Up (grounded hands & toes) */
      .an-pu-body { transform-origin: 184px 196px; animation: anPu 1.8s ease-in-out infinite; }
      @keyframes anPu { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-14deg); } }

      /* Dip (body moves vertically along dip bars) */
      .an-dip-body { animation: anDip 1.9s ease-in-out infinite; }
      @keyframes anDip { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(28px); } }

      /* Overhead Press */
      .an-ohp-ua { transform-origin: 120px 82px; animation: anOhpUa 1.9s ease-in-out infinite; }
      .an-ohp-fa { transform-origin: 120px 56px; animation: anOhpFa 1.9s ease-in-out infinite; }
      @keyframes anOhpUa { 0%, 100% { transform: rotate(-55deg); } 50% { transform: rotate(0deg); } }
      @keyframes anOhpFa { 0%, 100% { transform: rotate(110deg); } 50% { transform: rotate(0deg); } }

      /* Squat (3-link grounded at ankle) */
      .an-sq-shin  { transform-origin: 118px 204px; animation: anSqShin 2.1s ease-in-out infinite; }
      .an-sq-thigh { transform-origin: 118px 160px; animation: anSqThigh 2.1s ease-in-out infinite; }
      .an-sq-torso { transform-origin: 118px 114px; animation: anSqTorso 2.1s ease-in-out infinite; }
      @keyframes anSqShin  { 0%, 100% { transform: rotate(4deg); }   50% { transform: rotate(22deg); } }
      @keyframes anSqThigh { 0%, 100% { transform: rotate(-8deg); }  50% { transform: rotate(-76deg); } }
      @keyframes anSqTorso { 0%, 100% { transform: rotate(4deg); }   50% { transform: rotate(54deg); } }

      /* Leg Press (angled 45 deg sled) */
      .an-lp-thigh { transform-origin: 90px 166px; animation: anLpT 2s ease-in-out infinite; }
      .an-lp-shin  { transform-origin: 132px 136px; animation: anLpS 2s ease-in-out infinite; }
      @keyframes anLpT { 0%, 100% { transform: rotate(0deg); }  50% { transform: rotate(-32deg); } }
      @keyframes anLpS { 0%, 100% { transform: rotate(0deg); }  50% { transform: rotate(64deg); } }

      /* Lunge / Split Squat */
      .an-lng-body { animation: anLng 2s ease-in-out infinite; }
      @keyframes anLng { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(26px); } }

      /* Deadlift / RDL */
      .an-dl-shin  { transform-origin: 110px 204px; animation: anDlShin 2.1s ease-in-out infinite; }
      .an-dl-thigh { transform-origin: 110px 160px; animation: anDlThigh 2.1s ease-in-out infinite; }
      .an-dl-torso { transform-origin: 110px 114px; animation: anDlTorso 2.1s ease-in-out infinite; }
      .an-dl-arm   { transform-origin: 110px 64px;  animation: anDlArm 2.1s ease-in-out infinite; }
      @keyframes anDlShin  { 0%, 100% { transform: rotate(14deg); }  50% { transform: rotate(2deg); } }
      @keyframes anDlThigh { 0%, 100% { transform: rotate(-34deg); } 50% { transform: rotate(-4deg); } }
      @keyframes anDlTorso { 0%, 100% { transform: rotate(74deg); }  50% { transform: rotate(4deg); } }
      @keyframes anDlArm   { 0%, 100% { transform: rotate(-54deg); } 50% { transform: rotate(-2deg); } }

      /* Back Extension */
      .an-be-torso { transform-origin: 114px 138px; animation: anBe 2s ease-in-out infinite; }
      @keyframes anBe { 0%, 100% { transform: rotate(52deg); } 50% { transform: rotate(0deg); } }

      /* Row */
      .an-row-ua { transform-origin: 136px 90px;  animation: anRowUa 1.8s ease-in-out infinite; }
      .an-row-fa { transform-origin: 136px 122px; animation: anRowFa 1.8s ease-in-out infinite; }
      @keyframes anRowUa { 0%, 100% { transform: rotate(0deg); }  50% { transform: rotate(-42deg); } }
      @keyframes anRowFa { 0%, 100% { transform: rotate(0deg); }  50% { transform: rotate(42deg); } }

      /* Seated Cable Row */
      .an-sr-ua { transform-origin: 96px 104px; animation: anSrUa 1.8s ease-in-out infinite; }
      .an-sr-fa { transform-origin: 126px 104px; animation: anSrFa 1.8s ease-in-out infinite; }
      @keyframes anSrUa { 0%, 100% { transform: rotate(0deg); }   50% { transform: rotate(38deg); } }
      @keyframes anSrFa { 0%, 100% { transform: rotate(0deg); }   50% { transform: rotate(-76deg); } }

      /* Pull Up (body rises up to bar) */
      .an-pullup-body { animation: anPullUp 2s ease-in-out infinite; }
      @keyframes anPullUp { 0%, 100% { transform: translateY(28px); } 50% { transform: translateY(0px); } }

      /* Pulldown */
      .an-pd-ua { transform-origin: 120px 104px; animation: anPdUa 1.9s ease-in-out infinite; }
      .an-pd-fa { transform-origin: 120px 76px;  animation: anPdFa 1.9s ease-in-out infinite; }
      .an-pd-cable { transform-origin: 120px 18px; animation: anPdCab 1.9s ease-in-out infinite; }
      @keyframes anPdUa  { 0%, 100% { transform: rotate(0deg); }   50% { transform: rotate(52deg); } }
      @keyframes anPdFa  { 0%, 100% { transform: rotate(0deg); }   50% { transform: rotate(-104deg); } }
      @keyframes anPdCab { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }

      /* Straight-Arm Pulldown / Pullover */
      .an-sap-arm { transform-origin: 100px 84px; animation: anSap 1.9s ease-in-out infinite; }
      @keyframes anSap { 0%, 100% { transform: rotate(-55deg); } 50% { transform: rotate(15deg); } }
      .an-po-arm { transform-origin: 96px 140px; animation: anPo 2s ease-in-out infinite; }
      @keyframes anPo { 0%, 100% { transform: rotate(-68deg); } 50% { transform: rotate(0deg); } }

      /* Shrug */
      .an-shrug { animation: anShrug 1.5s ease-in-out infinite; }
      @keyframes anShrug { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }

      /* Curl */
      .an-curl-fa { transform-origin: 124px 120px; animation: anCurl 1.7s ease-in-out infinite; }
      @keyframes anCurl { 0%, 100% { transform: rotate(75deg); } 50% { transform: rotate(-38deg); } }
      .an-preach-fa { transform-origin: 128px 116px; animation: anPreach 1.7s ease-in-out infinite; }
      @keyframes anPreach { 0%, 100% { transform: rotate(35deg); } 50% { transform: rotate(-55deg); } }

      /* Tricep Pushdown / Skullcrusher / Overhead / Kickback */
      .an-tp-fa { transform-origin: 108px 120px; animation: anTp 1.7s ease-in-out infinite; }
      @keyframes anTp { 0%, 100% { transform: rotate(-36deg); } 50% { transform: rotate(76deg); } }
      .an-te-fa { transform-origin: 78px 108px; animation: anTe 1.8s ease-in-out infinite; }
      @keyframes anTe { 0%, 100% { transform: rotate(-100deg); } 50% { transform: rotate(0deg); } }
      .an-ohe-fa { transform-origin: 118px 48px; animation: anOhe 1.8s ease-in-out infinite; }
      @keyframes anOhe { 0%, 100% { transform: rotate(-110deg); } 50% { transform: rotate(0deg); } }
      .an-tkb-fa { transform-origin: 112px 102px; animation: anTkb 1.7s ease-in-out infinite; }
      @keyframes anTkb { 0%, 100% { transform: rotate(78deg); } 50% { transform: rotate(0deg); } }

      /* Lateral / Front / Rear Delt Raise */
      .an-lr-l { transform-origin: 98px 82px;  animation: anLrL 1.8s ease-in-out infinite; }
      .an-lr-r { transform-origin: 142px 82px; animation: anLrR 1.8s ease-in-out infinite; }
      @keyframes anLrL { 0%, 100% { transform: rotate(12deg); }  50% { transform: rotate(86deg); } }
      @keyframes anLrR { 0%, 100% { transform: rotate(-12deg); } 50% { transform: rotate(-86deg); } }
      .an-fr-arm { transform-origin: 116px 82px; animation: anFr 1.8s ease-in-out infinite; }
      @keyframes anFr { 0%, 100% { transform: rotate(82deg); } 50% { transform: rotate(0deg); } }

      /* Leg Ext / Lying Curl / Seated Curl / Calf / Hip Adduction & Abduction */
      .an-le-shin { transform-origin: 146px 144px; animation: anLe 1.8s ease-in-out infinite; }
      @keyframes anLe { 0%, 100% { transform: rotate(78deg); } 50% { transform: rotate(4deg); } }
      .an-lc-shin { transform-origin: 146px 144px; animation: anLc 1.8s ease-in-out infinite; }
      @keyframes anLc { 0%, 100% { transform: rotate(6deg); } 50% { transform: rotate(78deg); } }
      .an-lyc-shin { transform-origin: 142px 144px; animation: anLyc 1.8s ease-in-out infinite; }
      @keyframes anLyc { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-82deg); } }
      .an-calf-lift { animation: anCalf 1.5s ease-in-out infinite; }
      @keyframes anCalf { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      .an-add-l { transform-origin: 108px 142px; animation: anAddL 1.8s ease-in-out infinite; }
      .an-add-r { transform-origin: 132px 142px; animation: anAddR 1.8s ease-in-out infinite; }
      @keyframes anAddL { 0%, 100% { transform: rotate(24deg); }  50% { transform: rotate(2deg); } }
      @keyframes anAddR { 0%, 100% { transform: rotate(-24deg); } 50% { transform: rotate(-2deg); } }
      .an-abd-l { transform-origin: 108px 142px; animation: anAbdL 1.8s ease-in-out infinite; }
      .an-abd-r { transform-origin: 132px 142px; animation: anAbdR 1.8s ease-in-out infinite; }
      @keyframes anAbdL { 0%, 100% { transform: rotate(2deg); }  50% { transform: rotate(26deg); } }
      @keyframes anAbdR { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(-26deg); } }

      /* Hip Thrust / Glute Bridge / Kickback */
      .an-ht-body { transform-origin: 90px 146px; animation: anHt 1.9s ease-in-out infinite; }
      .an-ht-shin { transform-origin: 168px 204px; animation: anHtShin 1.9s ease-in-out infinite; }
      @keyframes anHt     { 0%, 100% { transform: rotate(26deg); } 50% { transform: rotate(0deg); } }
      @keyframes anHtShin { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(0deg); } }
      .an-gb-body { transform-origin: 76px 194px; animation: anGb 1.9s ease-in-out infinite; }
      @keyframes anGb { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-22deg); } }
      .an-kb-leg { transform-origin: 112px 134px; animation: anKb 1.7s ease-in-out infinite; }
      @keyframes anKb { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(45deg); } }

      /* Core: Crunch / Hanging Leg Raise / Lying Leg Raise / Ab Wheel / Plank / Twist */
      .an-cr-torso { transform-origin: 124px 186px; animation: anCr 1.8s ease-in-out infinite; }
      @keyframes anCr { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(36deg); } }
      .an-hlr-leg { transform-origin: 120px 124px; animation: anHlr 1.9s ease-in-out infinite; }
      @keyframes anHlr { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-82deg); } }
      .an-llr-leg { transform-origin: 116px 186px; animation: anLlr 1.9s ease-in-out infinite; }
      @keyframes anLlr { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-76deg); } }
      .an-abw-arm { transform-origin: 84px 196px; animation: anAbw 2s ease-in-out infinite; }
      @keyframes anAbw { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(28deg); } }
      .an-pl-body { transform-origin: 186px 182px; animation: anPl 2.4s ease-in-out infinite; }
      @keyframes anPl { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-1.2deg); } }
      .an-tw-arm { animation: anTw 1.6s ease-in-out infinite; }
      @keyframes anTw { 0%, 100% { transform: translateX(-18px); } 50% { transform: translateX(18px); } }

      /* Cardio: Run / Bike / Rower / Jump Rope / KB Swing */
      .an-cd-l1 { transform-origin: 116px 128px; animation: anCd1 0.8s ease-in-out infinite; }
      .an-cd-l2 { transform-origin: 116px 128px; animation: anCd2 0.8s ease-in-out infinite; }
      @keyframes anCd1 { 0%, 100% { transform: rotate(-28deg); } 50% { transform: rotate(28deg); } }
      @keyframes anCd2 { 0%, 100% { transform: rotate(28deg); }  50% { transform: rotate(-28deg); } }
      .an-bike-pedal { transform-origin: 126px 168px; animation: anSpin 1.2s linear infinite; }
      @keyframes anSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      .an-row-slide { animation: anRower 1.8s ease-in-out infinite; }
      @keyframes anRower { 0%, 100% { transform: translateX(0px); } 50% { transform: translateX(-24px); } }
      .an-kbs-arm { transform-origin: 112px 92px; animation: anKbs 1.6s ease-in-out infinite; }
      @keyframes anKbs { 0%, 100% { transform: rotate(25deg); } 50% { transform: rotate(-70deg); } }
    </style>
  `;

  // Exact mapping for every built-in exercise ID -> specific biomechanical rig & equipment
  const EXERCISE_RIG_MAP = {
    // 1. CHEST
    'ex-bench': 'bench_bb',
    'ex-incline-bb-bench': 'incline_bb',
    'ex-decline-bb-bench': 'decline_bb',
    'ex-wide-bb-bench': 'bench_bb',
    'ex-spoto-press': 'bench_bb',
    'ex-bb-floor-press': 'floor_press',
    'ex-db-bench': 'bench_db',
    'ex-incline-db': 'incline_db',
    'ex-decline-db-bench': 'decline_bb',
    'ex-neutral-db-bench': 'bench_db',
    'ex-hex-press': 'bench_db',
    'ex-db-floor-press': 'floor_press',
    'ex-one-arm-db-bench': 'bench_db',
    'ex-db-fly': 'fly_db',
    'ex-incline-db-fly': 'incline_fly_db',
    'ex-decline-db-fly': 'fly_db',
    'ex-around-the-world': 'fly_db',
    'ex-cable-fly': 'cable_fly',
    'ex-high-cable-fly': 'cable_fly',
    'ex-low-cable-fly': 'low_cable_fly',
    'ex-seated-cable-fly': 'pec_deck',
    'ex-single-arm-cable-fly': 'cable_fly',
    'ex-cable-chest-press': 'chest_press_mach',
    'ex-pec-deck': 'pec_deck',
    'ex-chest-press-mach': 'chest_press_mach',
    'ex-iso-chest-press': 'chest_press_mach',
    'ex-iso-incline-press': 'incline_bb',
    'ex-iso-decline-press': 'decline_bb',
    'ex-smith-bench': 'bench_bb',
    'ex-smith-incline': 'incline_bb',
    'ex-smith-decline': 'decline_bb',
    'ex-pushup': 'pushup',
    'ex-weighted-pushup': 'pushup',
    'ex-incline-pushup': 'pushup',
    'ex-decline-pushup': 'pushup',
    'ex-wide-pushup': 'pushup',
    'ex-kneeling-pushup': 'pushup',
    'ex-archer-pushup': 'pushup',
    'ex-clap-pushup': 'pushup',
    'ex-chest-dip': 'dip',
    'ex-assisted-chest-dip': 'dip',
    'ex-svend-press': 'chest_press_mach',

    // 2. LATS
    'ex-pullup': 'pullup',
    'ex-weighted-pullup': 'pullup',
    'ex-assisted-pullup': 'pullup',
    'ex-wide-pullup': 'pullup',
    'ex-neutral-pullup': 'pullup',
    'ex-chinup': 'pullup',
    'ex-weighted-chinup': 'pullup',
    'ex-assisted-chinup': 'pullup',
    'ex-scapular-pullup': 'dead_hang',
    'ex-lat-pulldown': 'pulldown',
    'ex-close-lat-pulldown': 'pulldown',
    'ex-rev-lat-pulldown': 'pulldown',
    'ex-vbar-lat-pulldown': 'pulldown',
    'ex-single-arm-pulldown': 'pulldown',
    'ex-kneeling-pulldown': 'pulldown',
    'ex-mach-lat-pulldown': 'pulldown',
    'ex-iso-lat-pulldown': 'pulldown',
    'ex-straight-arm-pulldown': 'straight_arm_pd',
    'ex-rope-straight-pulldown': 'straight_arm_pd',
    'ex-pullover-db': 'pullover_db',
    'ex-pullover-bb': 'pullover_db',
    'ex-pullover-mach': 'pullover_db',

    // 3. UPPER BACK
    'ex-bb-row': 'row_bb',
    'ex-underhand-bb-row': 'row_bb',
    'ex-pendlay-row': 'row_bb',
    'ex-seal-row-bb': 'row_incline',
    'ex-landmine-row': 'tbar_row',
    'ex-meadows-row': 'row_db',
    'ex-tbar-row': 'tbar_row',
    'ex-chest-supp-tbar': 'row_incline',
    'ex-one-arm-db-row': 'row_db',
    'ex-two-arm-db-row': 'row_db',
    'ex-chest-supported-row': 'row_incline',
    'ex-renegade-row': 'pushup',
    'ex-gorilla-row': 'row_db',
    'ex-seated-cable-row': 'seated_row',
    'ex-wide-cable-row': 'seated_row',
    'ex-single-arm-cable-row': 'seated_row',
    'ex-machine-row': 'seated_row',
    'ex-chest-supp-mach-row': 'seated_row',
    'ex-low-row-mach': 'seated_row',
    'ex-smith-row': 'row_bb',
    'ex-face-pull': 'face_pull',
    'ex-band-pull-apart': 'face_pull',
    'ex-inverted-row': 'inverted_row',

    // 4. LOWER BACK
    'ex-deadlift': 'deadlift',
    'ex-deficit-deadlift': 'deadlift',
    'ex-paused-deadlift': 'deadlift',
    'ex-back-extension': 'back_ext',
    'ex-mach-back-ext': 'back_ext',
    'ex-reverse-hyper': 'back_ext',
    'ex-superman': 'back_ext',
    'ex-good-morning': 'good_morning',
    'ex-seated-good-morning': 'good_morning',

    // 5. TRAPS
    'ex-bb-shrug': 'shrug',
    'ex-behind-back-shrug': 'shrug',
    'ex-db-shrug': 'shrug',
    'ex-incline-db-shrug': 'shrug',
    'ex-trap-bar-shrug': 'shrug',
    'ex-cable-shrug': 'shrug',
    'ex-smith-shrug': 'shrug',
    'ex-rack-pull': 'rack_pull',

    // 6. SHOULDERS
    'ex-ohp': 'ohp_bb',
    'ex-seated-bb-ohp': 'ohp_seated',
    'ex-push-press': 'ohp_bb',
    'ex-behind-neck-press': 'ohp_bb',
    'ex-landmine-press': 'ohp_bb',
    'ex-z-press': 'ohp_seated',
    'ex-db-shoulder-press': 'ohp_seated',
    'ex-standing-db-ohp': 'ohp_bb',
    'ex-one-arm-db-ohp': 'ohp_bb',
    'ex-arnold-press': 'ohp_seated',
    'ex-mach-shoulder-press': 'ohp_seated',
    'ex-iso-shoulder-press': 'ohp_seated',
    'ex-smith-ohp': 'ohp_seated',
    'ex-handstand-pushup': 'pushup',
    'ex-pike-pushup': 'pushup',
    'ex-lat-raise': 'lateral_raise',
    'ex-seated-lat-raise': 'lateral_raise',
    'ex-cable-lat-raise': 'lateral_raise',
    'ex-behind-cable-lat-raise': 'lateral_raise',
    'ex-mach-lat-raise': 'lateral_raise',
    'ex-lu-raise': 'lateral_raise',
    'ex-front-raise': 'front_raise',
    'ex-bb-front-raise': 'front_raise',
    'ex-cable-front-raise': 'front_raise',
    'ex-plate-front-raise': 'front_raise',
    'ex-rev-pec-deck': 'rear_delt',
    'ex-rear-delt-fly': 'rear_delt',
    'ex-incline-rear-delt': 'rear_delt',
    'ex-cable-rear-delt-fly': 'face_pull',
    'ex-upright-row': 'upright_row',
    'ex-bb-upright-row': 'upright_row',
    'ex-ez-upright-row': 'upright_row',
    'ex-db-upright-row': 'upright_row',
    'ex-cable-ext-rot': 'face_pull',

    // 7. BICEPS
    'ex-bb-curl': 'curl_bb',
    'ex-wide-bb-curl': 'curl_bb',
    'ex-close-bb-curl': 'curl_bb',
    'ex-drag-curl': 'curl_bb',
    'ex-ez-curl': 'curl_bb',
    'ex-close-ez-curl': 'curl_bb',
    'ex-preacher-curl': 'preacher_curl',
    'ex-db-preacher-curl': 'preacher_curl',
    'ex-mach-preacher-curl': 'preacher_curl',
    'ex-cable-preacher-curl': 'preacher_curl',
    'ex-spider-curl-ez': 'preacher_curl',
    'ex-spider-curl-db': 'preacher_curl',
    'ex-db-curl': 'curl_db',
    'ex-alt-db-curl': 'curl_db',
    'ex-seated-db-curl': 'incline_curl',
    'ex-incline-db-curl': 'incline_curl',
    'ex-zottman-curl': 'curl_db',
    'ex-waiter-curl': 'curl_db',
    'ex-hammer-curl': 'curl_db',
    'ex-cross-hammer-curl': 'curl_db',
    'ex-rope-hammer-curl': 'curl_cable',
    'ex-conc-curl': 'conc_curl',
    'ex-cable-curl': 'curl_cable',
    'ex-single-cable-curl': 'curl_cable',
    'ex-bayesian-curl': 'curl_cable',
    'ex-crucifix-curl': 'curl_cable',

    // 8. TRICEPS
    'ex-tricep-push': 'tricep_pushdown',
    'ex-tricep-bar-push': 'tricep_pushdown',
    'ex-tricep-vbar-push': 'tricep_pushdown',
    'ex-rev-tricep-push': 'tricep_pushdown',
    'ex-single-tricep-push': 'tricep_pushdown',
    'ex-overhead-cable-ext': 'tricep_overhead',
    'ex-single-oh-cable-ext': 'tricep_overhead',
    'ex-skullcrusher': 'skullcrusher',
    'ex-bb-skullcrusher': 'skullcrusher',
    'ex-db-skullcrusher': 'skullcrusher',
    'ex-jm-press': 'close_bench',
    'ex-tate-press': 'skullcrusher',
    'ex-db-overhead-ext': 'tricep_overhead',
    'ex-single-db-oh-ext': 'tricep_overhead',
    'ex-ez-overhead-ext': 'tricep_overhead',
    'ex-db-kickback': 'tricep_kickback',
    'ex-cable-tricep-kickback': 'tricep_kickback',
    'ex-close-bench': 'close_bench',
    'ex-diamond-pushup': 'pushup',
    'ex-tricep-dip': 'dip',
    'ex-bench-dip': 'bench_dip',
    'ex-assisted-dip': 'dip',
    'ex-mach-tricep-dip': 'dip',
    'ex-mach-tricep-ext': 'tricep_pushdown',

    // 9. FOREARMS
    'ex-wrist-curl': 'wrist_curl',
    'ex-db-wrist-curl': 'wrist_curl',
    'ex-behind-back-wrist-curl': 'shrug',
    'ex-rev-wrist-curl': 'wrist_curl',
    'ex-db-rev-wrist-curl': 'wrist_curl',
    'ex-rev-curl': 'curl_bb',
    'ex-bb-rev-curl': 'curl_bb',
    'ex-db-rev-curl': 'curl_db',
    'ex-cable-rev-curl': 'curl_cable',
    'ex-wrist-roller': 'front_raise',
    'ex-plate-pinch': 'shrug',
    'ex-dead-hang': 'dead_hang',

    // 10. QUADRICEPS
    'ex-squat': 'squat_back',
    'ex-low-bar-squat': 'squat_back',
    'ex-paused-squat': 'squat_back',
    'ex-box-squat': 'squat_back',
    'ex-safety-bar-squat': 'squat_back',
    'ex-front-squat': 'squat_front',
    'ex-zercher-squat': 'squat_front',
    'ex-overhead-squat': 'squat_back',
    'ex-hack-squat': 'squat_front',
    'ex-pendulum-squat': 'squat_front',
    'ex-belt-squat': 'squat_back',
    'ex-sissy-squat': 'squat_front',
    'ex-leg-press': 'leg_press',
    'ex-horiz-leg-press': 'leg_press',
    'ex-single-leg-press': 'leg_press',
    'ex-leg-ext': 'leg_ext',
    'ex-single-leg-ext': 'leg_ext',
    'ex-goblet-squat': 'goblet_squat',
    'ex-kb-goblet-squat': 'goblet_squat',
    'ex-db-squat': 'lunge',
    'ex-bulgarian-split': 'bulgarian_split',
    'ex-bb-bulgarian-split': 'bulgarian_split',
    'ex-bw-split-squat': 'lunge',
    'ex-walking-lunge': 'lunge',
    'ex-bb-walking-lunge': 'lunge',
    'ex-reverse-lunge-db': 'lunge',
    'ex-reverse-lunge-bb': 'lunge',
    'ex-bw-lunge': 'lunge',
    'ex-db-step-up': 'lunge',
    'ex-bb-step-up': 'lunge',
    'ex-pistol-squat': 'goblet_squat',
    'ex-bw-squat': 'goblet_squat',
    'ex-jump-squat': 'goblet_squat',
    'ex-wall-sit': 'goblet_squat',
    'ex-smith-squat': 'squat_back',

    // 11. HAMSTRINGS
    'ex-rdl': 'rdl',
    'ex-db-rdl': 'rdl',
    'ex-single-leg-rdl-db': 'rdl',
    'ex-smith-rdl': 'rdl',
    'ex-stiff-dl': 'rdl',
    'ex-db-stiff-dl': 'rdl',
    'ex-leg-curl': 'seated_leg_curl',
    'ex-single-seated-leg-curl': 'seated_leg_curl',
    'ex-lying-leg-curl': 'lying_leg_curl',
    'ex-single-lying-leg-curl': 'lying_leg_curl',
    'ex-standing-leg-curl': 'kickback',
    'ex-nordic-curl': 'lying_leg_curl',
    'ex-ghr': 'back_ext',
    'ex-ball-leg-curl': 'glute_bridge',

    // 12. GLUTES
    'ex-hip-thrust': 'hip_thrust',
    'ex-mach-hip-thrust': 'hip_thrust',
    'ex-smith-hip-thrust': 'hip_thrust',
    'ex-db-hip-thrust': 'hip_thrust',
    'ex-single-leg-hip-thrust': 'hip_thrust',
    'ex-glute-bridge': 'glute_bridge',
    'ex-bb-glute-bridge': 'glute_bridge',
    'ex-bw-glute-bridge': 'glute_bridge',
    'ex-frog-pump': 'glute_bridge',
    'ex-cable-kickback': 'kickback',
    'ex-mach-kickback': 'kickback',
    'ex-donkey-kick': 'kickback',
    'ex-cable-pull-through': 'kb_swing',
    'ex-sumo-deadlift': 'sumo_deadlift',
    'ex-db-sumo-squat': 'sumo_deadlift',
    'ex-curtsy-lunge': 'lunge',

    // 13. CALVES
    'ex-standing-calf': 'calf_standing',
    'ex-bb-standing-calf': 'calf_standing',
    'ex-db-standing-calf': 'calf_standing',
    'ex-smith-standing-calf': 'calf_standing',
    'ex-bw-standing-calf': 'calf_standing',
    'ex-seated-calf': 'calf_seated',
    'ex-bb-seated-calf': 'calf_seated',
    'ex-legpress-calf': 'legpress_calf',
    'ex-donkey-calf': 'calf_standing',
    'ex-tibialis-raise': 'calf_standing',

    // 14. ADDUCTORS & ABDUCTORS
    'ex-hip-adduction': 'hip_adduction',
    'ex-cable-hip-adduction': 'hip_adduction',
    'ex-copenhagen-plank': 'plank',
    'ex-lateral-lunge': 'sumo_deadlift',
    'ex-hip-abduction': 'hip_abduction',
    'ex-cable-hip-abduction': 'hip_abduction',
    'ex-banded-clamshell': 'hip_abduction',

    // 15. ABDOMINALS
    'ex-cable-crunch': 'cable_crunch',
    'ex-mach-crunch': 'cable_crunch',
    'ex-hanging-leg-raise': 'hanging_leg_raise',
    'ex-hanging-knee-raise': 'hanging_leg_raise',
    'ex-toes-to-bar': 'hanging_leg_raise',
    'ex-captains-chair-raise': 'hanging_leg_raise',
    'ex-lying-leg-raise': 'lying_leg_raise',
    'ex-reverse-crunch': 'lying_leg_raise',
    'ex-dragon-flag': 'lying_leg_raise',
    'ex-v-up': 'lying_leg_raise',
    'ex-dead-bug': 'lying_leg_raise',
    'ex-ab-wheel': 'ab_wheel',
    'ex-bb-rollout': 'ab_wheel',
    'ex-crunch': 'crunch',
    'ex-situp': 'crunch',
    'ex-decline-crunch': 'crunch',
    'ex-bicycle-crunch': 'crunch',
    'ex-heel-touch': 'crunch',
    'ex-plank': 'plank',
    'ex-weighted-plank': 'plank',
    'ex-side-plank': 'plank',
    'ex-mountain-climber': 'plank',
    'ex-l-sit': 'dip',
    'ex-russian-twist': 'russian_twist',
    'ex-bw-russian-twist': 'russian_twist',
    'ex-cable-woodchop': 'russian_twist',
    'ex-pallof-press': 'russian_twist',
    'ex-db-side-bend': 'side_bend',

    // 16. CARDIO
    'ex-treadmill': 'treadmill',
    'ex-incline-walk': 'treadmill',
    'ex-outdoor-run': 'treadmill',
    'ex-sprint': 'treadmill',
    'ex-stationary-bike': 'bike',
    'ex-air-bike': 'bike',
    'ex-recumbent-bike': 'bike',
    'ex-rowing-mach': 'rowing_mach',
    'ex-skierg': 'straight_arm_pd',
    'ex-elliptical': 'treadmill',
    'ex-stairmaster': 'stairmaster',
    'ex-jump-rope': 'jump_rope',
    'ex-double-unders': 'jump_rope',
    'ex-jumping-jacks': 'jump_rope',
    'ex-high-knees': 'stairmaster',
    'ex-box-jump': 'stairmaster',
    'ex-battle-ropes': 'kb_swing',

    // 17. FULL BODY
    'ex-kb-swing': 'kb_swing',
    'ex-single-kb-swing': 'kb_swing',
    'ex-kb-snatch': 'clean_press',
    'ex-kb-clean-press': 'clean_press',
    'ex-trap-dl': 'deadlift',
    'ex-burpee': 'burpee',
    'ex-devils-press': 'burpee',
    'ex-clean-press': 'clean_press',
    'ex-power-clean': 'clean_press',
    'ex-hang-clean': 'clean_press',
    'ex-bb-snatch': 'clean_press',
    'ex-db-snatch': 'clean_press',
    'ex-bb-thruster': 'clean_press',
    'ex-db-thruster': 'clean_press',
    'ex-wall-ball': 'clean_press',
    'ex-med-ball-slam': 'kb_swing',
    'ex-farmer-walk': 'farmer_walk',
    'ex-trap-farmer-walk': 'farmer_walk',
    'ex-sled-push': 'treadmill'
  };

  function getPattern(ex) {
    if (ex.id && EXERCISE_RIG_MAP[ex.id]) return EXERCISE_RIG_MAP[ex.id];
    const name = (ex.name || '').toLowerCase();
    const muscle = (ex.muscle || '').toLowerCase();
    const equip = (ex.equipment || '').toLowerCase();
    if (/bike|cycling/.test(name)) return 'bike';
    if (/rowing/.test(name)) return 'rowing_mach';
    if (/jump rope|double under|jumping jack/.test(name)) return 'jump_rope';
    if (/stair|box jump|high knee/.test(name)) return 'stairmaster';
    if (muscle === 'cardio' || /treadmill|run|walk|sprint|elliptical|sled/.test(name)) return 'treadmill';
    if (/burpee|devil/.test(name)) return 'burpee';
    if (/clean|snatch|thruster|wall ball/.test(name)) return 'clean_press';
    if (/farmer|carry/.test(name)) return 'farmer_walk';
    if (/russian twist|woodchop|pallof/.test(name)) return 'russian_twist';
    if (/side bend/.test(name)) return 'side_bend';
    if (/plank|mountain climber/.test(name)) return 'plank';
    if (/hang/.test(name) && !/leg|knee/.test(name)) return 'dead_hang';
    if (/ab wheel|rollout/.test(name)) return 'ab_wheel';
    if (/lying.*leg raise|reverse crunch|dragon flag|v-up|dead bug/.test(name)) return 'lying_leg_raise';
    if (/leg raise|knee raise|toes to bar/.test(name)) return 'hanging_leg_raise';
    if (/cable crunch|mach.*crunch/.test(name)) return 'cable_crunch';
    if (muscle === 'abdominals' || /crunch|sit-up|situp|heel touch/.test(name)) return 'crunch';
    if (/adduct/.test(name) || muscle === 'adductors') return 'hip_adduction';
    if (/abduct|clamshell/.test(name) || muscle === 'abductors') return 'hip_abduction';
    if (/hip thrust/.test(name)) return 'hip_thrust';
    if (/glute bridge|frog pump/.test(name)) return 'glute_bridge';
    if (/tricep.*kickback/.test(name) || (muscle === 'triceps' && /kickback/.test(name))) return 'tricep_kickback';
    if (/kickback|donkey kick/.test(name)) return 'kickback';
    if (/lying.*curl|nordic/.test(name)) return 'lying_leg_curl';
    if (/leg curl/.test(name)) return 'seated_leg_curl';
    if (/leg ext/.test(name)) return 'leg_ext';
    if (/leg press.*calf/.test(name)) return 'legpress_calf';
    if (/seated.*calf/.test(name)) return 'calf_seated';
    if (/calf|tibialis/.test(name)) return 'calf_standing';
    if (/leg press/.test(name)) return 'leg_press';
    if (/bulgarian/.test(name)) return 'bulgarian_split';
    if (/lunge|split squat|step up/.test(name)) return 'lunge';
    if (/goblet|pistol|air squat|jump squat|wall sit/.test(name)) return 'goblet_squat';
    if (/front squat|zercher|hack squat|pendulum|sissy/.test(name)) return 'squat_front';
    if (/sumo/.test(name)) return 'sumo_deadlift';
    if (/squat/.test(name)) return 'squat_back';
    if (/good morning/.test(name)) return 'good_morning';
    if (/back ext|hyper|superman|ghr/.test(name)) return 'back_ext';
    if (/rack pull|block pull/.test(name)) return 'rack_pull';
    if (/romanian|rdl|stiff-leg/.test(name)) return 'rdl';
    if (/deadlift/.test(name)) return 'deadlift';
    if (/shrug/.test(name)) return 'shrug';
    if (/floor press/.test(name)) return 'floor_press';
    if (/close-grip.*bench|jm press/.test(name)) return 'close_bench';
    if (/incline.*fly/.test(name)) return 'incline_fly_db';
    if (/incline.*press/.test(name)) return equip === 'dumbbell' ? 'incline_db' : 'incline_bb';
    if (/decline.*press/.test(name)) return 'decline_bb';
    if (/pec deck/.test(name)) return 'pec_deck';
    if (/low.*cable.*fly/.test(name)) return 'low_cable_fly';
    if (/cable.*fly|crossover/.test(name)) return 'cable_fly';
    if (/fly/.test(name) && muscle === 'chest') return 'fly_db';
    if (/chest press|svend/.test(name)) return 'chest_press_mach';
    if (/push up|push-up/.test(name)) return 'pushup';
    if (/bench press|hex press/.test(name)) return equip === 'dumbbell' ? 'bench_db' : 'bench_bb';
    if (/bench dip/.test(name)) return 'bench_dip';
    if (/dip/.test(name)) return 'dip';
    if (/pull up|pull-up|chin up/.test(name)) return 'pullup';
    if (/pullover/.test(name)) return 'pullover_db';
    if (/straight-arm/.test(name)) return 'straight_arm_pd';
    if (/pulldown/.test(name)) return 'pulldown';
    if (/face pull|pull-apart/.test(name)) return 'face_pull';
    if (/t-bar|landmine row/.test(name)) return 'tbar_row';
    if (/chest-supported|incline.*row|seal row/.test(name)) return 'row_incline';
    if (/seated.*row|cable row|machine row|low row/.test(name)) return 'seated_row';
    if (/inverted row/.test(name)) return 'inverted_row';
    if (/row/.test(name)) return equip === 'dumbbell' ? 'row_db' : 'row_bb';
    if (/skullcrusher|tate press/.test(name)) return 'skullcrusher';
    if (/overhead.*ext/.test(name)) return 'tricep_overhead';
    if (/pushdown/.test(name) || muscle === 'triceps') return 'tricep_pushdown';
    if (/wrist curl/.test(name)) return 'wrist_curl';
    if (/concentration/.test(name)) return 'conc_curl';
    if (/incline.*curl|seated.*curl/.test(name)) return 'incline_curl';
    if (/preacher|spider/.test(name)) return 'preacher_curl';
    if (/curl/.test(name) || muscle === 'biceps') return equip === 'cable' ? 'curl_cable' : equip === 'dumbbell' ? 'curl_db' : 'curl_bb';
    if (/rear delt|reverse/.test(name)) return 'rear_delt';
    if (/front raise/.test(name)) return 'front_raise';
    if (/lateral raise|lu raise/.test(name)) return 'lateral_raise';
    if (/upright row/.test(name)) return 'upright_row';
    if (/overhead|shoulder press|military|arnold/.test(name) || muscle === 'shoulders') return equip === 'dumbbell' ? 'ohp_seated' : 'ohp_bb';
    if (/kettlebell swing/.test(name)) return 'kb_swing';
    return 'squat_back';
  }

  function buildScene(pattern) {
    const F = `<line x1="24" y1="206" x2="216" y2="206" class="an-floor"/>`;
    switch (pattern) {
      case 'bench_bb':
      case 'close_bench':
      case 'bench_db':
      case 'floor_press': {
        const isFloor = pattern === 'floor_press';
        const weight = pattern === 'bench_db'
          ? `<rect x="96" y="80" width="16" height="10" rx="3" class="an-plate"/>`
          : `<circle cx="104" cy="86" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/><circle cx="104" cy="86" r="4" fill="#e2e8f0"/>`;
        const benchSvg = isFloor
          ? ''
          : `<rect x="46" y="152" width="136" height="10" rx="4" class="an-equip"/><line x1="66" y1="162" x2="66" y2="206" class="an-equip" stroke-width="8"/><line x1="162" y1="162" x2="162" y2="206" class="an-equip" stroke-width="8"/>`;
        const yShift = isFloor ? 50 : 0;
        return `${F}${benchSvg}
          <g transform="translate(0, ${yShift})">
            <circle cx="64" cy="138" r="12" class="an-body"/>
            <path d="${isFloor ? 'M78 144 L148 144 L168 118 L188 148' : 'M78 144 L148 144 L178 156 L184 204'}" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
            <ellipse cx="104" cy="138" rx="14" ry="7" class="an-glow"/>
            <g class="an-bp-ua">
              <line x1="104" y1="140" x2="104" y2="114" class="an-limb" stroke-width="10"/>
              <g class="an-bp-fa">
                <line x1="104" y1="114" x2="104" y2="86" class="an-limb" stroke-width="8"/>
                ${weight}
              </g>
            </g>
          </g>`;
      }
      case 'incline_bb':
      case 'incline_db': {
        const weight = pattern === 'incline_db'
          ? `<rect x="88" y="58" width="16" height="10" rx="3" class="an-plate"/>`
          : `<circle cx="96" cy="64" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/><circle cx="96" cy="64" r="4" fill="#e2e8f0"/>`;
        return `${F}
          <line x1="56" y1="114" x2="128" y2="162" class="an-equip" stroke-width="10"/>
          <rect x="122" y="158" width="46" height="10" rx="4" class="an-equip"/>
          <line x1="74" y1="128" x2="74" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="154" y1="168" x2="154" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="68" cy="100" r="12" class="an-body"/>
          <path d="M80 112 L130 148 L166 156 L176 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="96" cy="116" rx="12" ry="7" transform="rotate(35 96 116)" class="an-glow"/>
          <g class="an-ibp-ua">
            <line x1="96" y1="118" x2="96" y2="92" class="an-limb" stroke-width="10"/>
            <g class="an-ibp-fa">
              <line x1="96" y1="92" x2="96" y2="64" class="an-limb" stroke-width="8"/>
              ${weight}
            </g>
          </g>`;
      }
      case 'decline_bb':
        return `${F}
          <line x1="52" y1="162" x2="138" y2="134" class="an-equip" stroke-width="10"/>
          <line x1="72" y1="158" x2="72" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="138" y1="138" x2="138" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="60" cy="154" r="11" class="an-body"/>
          <path d="M74 150 L142 128 L168 158" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="106" cy="142" rx="14" ry="7" transform="rotate(-18 106 142)" class="an-glow"/>
          <g class="an-dbp-ua">
            <line x1="108" y1="146" x2="108" y2="120" class="an-limb" stroke-width="10"/>
            <g class="an-dbp-fa">
              <line x1="108" y1="120" x2="108" y2="92" class="an-limb" stroke-width="8"/>
              <circle cx="108" cy="92" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/>
              <circle cx="108" cy="92" r="4" fill="#e2e8f0"/>
            </g>
          </g>`;
      case 'fly_db':
      case 'incline_fly_db':
        return `${F}
          <rect x="94" y="136" width="52" height="10" rx="4" class="an-equip"/>
          <line x1="120" y1="146" x2="120" y2="206" class="an-equip" stroke-width="10"/>
          <circle cx="120" cy="68" r="12" class="an-body"/>
          <rect x="102" y="84" width="36" height="52" rx="10" class="an-body"/>
          <ellipse cx="120" cy="98" rx="14" ry="8" class="an-glow"/>
          <g class="an-fly-l">
            <line x1="104" y1="96" x2="104" y2="46" class="an-limb" stroke-width="9"/>
            <rect x="96" y="40" width="16" height="9" rx="3" class="an-plate"/>
          </g>
          <g class="an-fly-r">
            <line x1="136" y1="96" x2="136" y2="46" class="an-limb" stroke-width="9"/>
            <rect x="128" y="40" width="16" height="9" rx="3" class="an-plate"/>
          </g>`;
      case 'cable_fly':
      case 'low_cable_fly':
        return `${F}
          <line x1="36" y1="30" x2="36" y2="206" class="an-equip" stroke-width="7"/>
          <line x1="204" y1="30" x2="204" y2="206" class="an-equip" stroke-width="7"/>
          <circle cx="120" cy="52" r="12" class="an-body"/>
          <rect x="102" y="70" width="36" height="66" rx="10" class="an-body"/>
          <line x1="112" y1="136" x2="106" y2="204" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <line x1="128" y1="136" x2="134" y2="204" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <ellipse cx="120" cy="88" rx="14" ry="8" class="an-glow"/>
          <g class="an-cf-l">
            <line x1="102" y1="84" x2="102" y2="136" class="an-limb" stroke-width="9"/>
            <circle cx="102" cy="138" r="5" class="an-plate"/>
          </g>
          <g class="an-cf-r">
            <line x1="138" y1="84" x2="138" y2="136" class="an-limb" stroke-width="9"/>
            <circle cx="138" cy="138" r="5" class="an-plate"/>
          </g>`;
      case 'pec_deck':
      case 'chest_press_mach':
        return `${F}
          <rect x="74" y="148" width="54" height="10" rx="4" class="an-equip"/>
          <line x1="76" y1="78" x2="76" y2="206" class="an-equip" stroke-width="10"/>
          <line x1="112" y1="158" x2="112" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="96" cy="70" r="12" class="an-body"/>
          <path d="M96 86 L96 142 L134 146 L140 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="104" cy="100" rx="10" ry="10" class="an-glow"/>
          <g class="an-cp-ua">
            <line x1="98" y1="98" x2="124" y2="98" class="an-limb" stroke-width="10"/>
            <g class="an-cp-fa">
              <line x1="124" y1="98" x2="152" y2="98" class="an-limb" stroke-width="8"/>
              <line x1="152" y1="84" x2="152" y2="112" class="an-bar" stroke-width="5"/>
            </g>
          </g>`;
      case 'pushup':
      case 'burpee':
        return `${F}
          <g class="an-pu-body">
            <line x1="68" y1="146" x2="184" y2="196" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
            <circle cx="54" cy="134" r="11" class="an-body"/>
            <ellipse cx="88" cy="158" rx="12" ry="6" transform="rotate(24 88 158)" class="an-glow"/>
          </g>
          <line x1="76" y1="154" x2="76" y2="204" class="an-limb" stroke-width="9"/>`;
      case 'dip':
      case 'bench_dip':
        return `${F}
          <line x1="76" y1="106" x2="76" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="164" y1="106" x2="164" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="76" y1="106" x2="164" y2="106" class="an-equip" stroke-width="6"/>
          <g class="an-dip-body">
            <circle cx="120" cy="54" r="11" class="an-body"/>
            <rect x="104" y="68" width="32" height="58" rx="10" class="an-body"/>
            <path d="M110 126 L108 168 M130 126 L132 168" fill="none" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
            <ellipse cx="120" cy="86" rx="14" ry="8" class="an-glow"/>
          </g>`;
      case 'ohp_bb':
      case 'ohp_seated':
      case 'clean_press': {
        const seat = pattern === 'ohp_seated'
          ? `<rect x="92" y="148" width="56" height="10" rx="4" class="an-equip"/><line x1="120" y1="158" x2="120" y2="206" class="an-equip" stroke-width="8"/>`
          : `<line x1="112" y1="136" x2="106" y2="204" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/><line x1="128" y1="136" x2="134" y2="204" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>`;
        return `${F}${seat}
          <rect x="106" y="76" width="28" height="62" rx="10" class="an-body"/>
          <circle cx="120" cy="56" r="12" class="an-body"/>
          <ellipse cx="120" cy="82" rx="18" ry="8" class="an-glow"/>
          <g class="an-ohp-ua">
            <line x1="120" y1="82" x2="120" y2="56" class="an-limb" stroke-width="10"/>
            <g class="an-ohp-fa">
              <line x1="120" y1="56" x2="120" y2="28" class="an-limb" stroke-width="8"/>
              <line x1="78" y1="28" x2="162" y2="28" class="an-bar" stroke-width="4"/>
              <rect x="74" y="16" width="8" height="24" rx="2" class="an-plate"/>
              <rect x="158" y="16" width="8" height="24" rx="2" class="an-plate"/>
            </g>
          </g>`;
      }
      case 'squat_back':
      case 'squat_front':
      case 'goblet_squat': {
        const barX = pattern === 'squat_front' || pattern === 'goblet_squat' ? 128 : 112;
        const wt = pattern === 'goblet_squat'
          ? `<rect x="122" y="64" width="12" height="18" rx="3" class="an-plate"/>`
          : `<circle cx="${barX}" cy="64" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/><circle cx="${barX}" cy="64" r="4" fill="#e2e8f0"/>`;
        return `${F}
          <line x1="110" y1="204" x2="130" y2="204" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>
          <g class="an-sq-shin">
            <line x1="118" y1="204" x2="118" y2="160" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <g class="an-sq-thigh">
              <line x1="118" y1="160" x2="118" y2="114" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
              <ellipse cx="118" cy="138" rx="7" ry="16" class="an-glow"/>
              <g class="an-sq-torso">
                <line x1="118" y1="114" x2="118" y2="62" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
                <circle cx="118" cy="44" r="12" class="an-body"/>
                <line x1="118" y1="68" x2="${barX}" y2="74" class="an-limb" stroke-width="8"/>
                ${wt}
              </g>
            </g>
          </g>`;
      }
      case 'leg_press':
      case 'legpress_calf':
        return `${F}
          <line x1="54" y1="184" x2="188" y2="96" class="an-equip" stroke-width="8"/>
          <line x1="66" y1="178" x2="66" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="168" y1="110" x2="168" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="56" cy="146" r="11" class="an-body"/>
          <line x1="66" y1="154" x2="90" y2="166" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <g class="an-lp-thigh">
            <line x1="90" y1="166" x2="132" y2="136" stroke="#94a3b8" stroke-width="13" stroke-linecap="round"/>
            <ellipse cx="112" cy="150" rx="14" ry="7" transform="rotate(-35 112 150)" class="an-glow"/>
            <g class="an-lp-shin">
              <line x1="132" y1="136" x2="168" y2="98" class="an-limb" stroke-width="11"/>
              <rect x="162" y="76" width="12" height="36" rx="3" transform="rotate(-35 168 94)" class="an-plate"/>
            </g>
          </g>`;
      case 'lunge':
      case 'bulgarian_split': {
        const rearBench = pattern === 'bulgarian_split'
          ? `<rect x="44" y="164" width="40" height="10" rx="4" class="an-equip"/><line x1="64" y1="174" x2="64" y2="206" class="an-equip" stroke-width="8"/>`
          : '';
        return `${F}${rearBench}
          <g class="an-lng-body">
            <circle cx="128" cy="48" r="12" class="an-body"/>
            <rect x="114" y="64" width="28" height="58" rx="10" class="an-body"/>
            <path d="M128 122 L154 158 L154 198" fill="none" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="${pattern === 'bulgarian_split' ? 'M120 122 L80 158' : 'M120 122 L88 164 L76 198'}" fill="none" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
            <ellipse cx="144" cy="142" rx="7" ry="14" transform="rotate(-30 144 142)" class="an-glow"/>
          </g>`;
      }
      case 'deadlift':
      case 'sumo_deadlift':
      case 'rdl':
      case 'rack_pull':
      case 'good_morning':
        return `${F}
          <line x1="102" y1="204" x2="124" y2="204" stroke="#64748b" stroke-width="7" stroke-linecap="round"/>
          <g class="an-dl-shin">
            <line x1="110" y1="204" x2="110" y2="160" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <g class="an-dl-thigh">
              <line x1="110" y1="160" x2="110" y2="114" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
              <ellipse cx="107" cy="136" rx="6" ry="15" class="an-glow"/>
              <g class="an-dl-torso">
                <line x1="110" y1="114" x2="110" y2="60" stroke="#94a3b8" stroke-width="16" stroke-linecap="round"/>
                <line x1="106" y1="86" x2="106" y2="112" class="an-glow-s" stroke-width="6"/>
                <circle cx="110" cy="42" r="12" class="an-body"/>
                ${pattern === 'good_morning' ? `<circle cx="106" cy="62" r="13" fill="none" stroke="#3b82f6" stroke-width="5"/>` : `
                <g class="an-dl-arm">
                  <line x1="110" y1="64" x2="110" y2="122" class="an-limb" stroke-width="9"/>
                  <circle cx="110" cy="126" r="16" fill="none" stroke="#3b82f6" stroke-width="5"/>
                  <circle cx="110" cy="126" r="4" fill="#e2e8f0"/>
                </g>`}
              </g>
            </g>
          </g>`;
      case 'back_ext':
        return `${F}
          <line x1="80" y1="164" x2="120" y2="138" class="an-equip" stroke-width="10"/>
          <line x1="104" y1="150" x2="104" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="74" y1="178" x2="114" y2="138" stroke="#94a3b8" stroke-width="13" stroke-linecap="round"/>
          <g class="an-be-torso">
            <line x1="114" y1="138" x2="158" y2="94" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
            <line x1="122" y1="128" x2="142" y2="108" class="an-glow-s" stroke-width="6"/>
            <circle cx="170" cy="82" r="11" class="an-body"/>
          </g>`;
      case 'row_bb':
      case 'tbar_row':
      case 'row_db':
      case 'row_incline': {
        const bench = pattern === 'row_incline'
          ? `<line x1="88" y1="136" x2="144" y2="94" class="an-equip" stroke-width="10"/><line x1="116" y1="116" x2="116" y2="206" class="an-equip" stroke-width="8"/>`
          : '';
        const wt = pattern === 'row_db' || pattern === 'row_incline'
          ? `<rect x="128" y="150" width="16" height="9" rx="3" class="an-plate"/>`
          : `<circle cx="136" cy="156" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/><circle cx="136" cy="156" r="4" fill="#e2e8f0"/>`;
        return `${F}${bench}
          <path d="M98 204 L94 162 L98 122 L136 90" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="150" cy="76" r="12" class="an-body"/>
          <ellipse cx="118" cy="100" rx="14" ry="7" transform="rotate(-38 118 100)" class="an-glow"/>
          <g class="an-row-ua">
            <line x1="136" y1="90" x2="136" y2="122" class="an-limb" stroke-width="10"/>
            <g class="an-row-fa">
              <line x1="136" y1="122" x2="136" y2="152" class="an-limb" stroke-width="8"/>
              ${wt}
            </g>
          </g>`;
      }
      case 'seated_row':
      case 'face_pull': {
        const isFP = pattern === 'face_pull';
        const yOff = isFP ? -20 : 0;
        return `${F}
          <line x1="194" y1="30" x2="194" y2="206" class="an-equip" stroke-width="8"/>
          ${isFP ? '' : '<rect x="64" y="148" width="60" height="10" rx="4" class="an-equip"/><line x1="94" y1="158" x2="94" y2="206" class="an-equip" stroke-width="8"/>'}
          <path d="${isFP ? 'M88 204 L96 142 L96 84' : 'M148 152 L96 142 L96 84'}" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="96" cy="64" r="12" class="an-body"/>
          <ellipse cx="94" cy="106" rx="7" ry="14" class="an-glow"/>
          <line x1="156" y1="${104 + yOff}" x2="194" y2="${104 + yOff}" stroke="#475569" stroke-width="2" stroke-dasharray="4 3"/>
          <g class="an-sr-ua" style="transform-origin:96px ${104 + yOff}px">
            <line x1="96" y1="${104 + yOff}" x2="126" y2="${104 + yOff}" class="an-limb" stroke-width="10"/>
            <g class="an-sr-fa" style="transform-origin:126px ${104 + yOff}px">
              <line x1="126" y1="${104 + yOff}" x2="156" y2="${104 + yOff}" class="an-limb" stroke-width="8"/>
              <rect x="152" y="${96 + yOff}" width="8" height="16" rx="2" class="an-plate"/>
            </g>
          </g>`;
      }
      case 'inverted_row':
        return `${F}
          <line x1="76" y1="110" x2="76" y2="206" class="an-equip" stroke-width="7"/>
          <line x1="66" y1="110" x2="132" y2="110" class="an-bar" stroke-width="5"/>
          <g class="an-gb-body">
            <line x1="76" y1="156" x2="180" y2="202" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
            <circle cx="60" cy="148" r="11" class="an-body"/>
            <ellipse cx="102" cy="166" rx="14" ry="7" transform="rotate(24 102 166)" class="an-glow"/>
          </g>
          <line x1="88" y1="112" x2="88" y2="154" class="an-limb" stroke-width="9"/>`;
      case 'pullup':
      case 'dead_hang': {
        const cls = pattern === 'dead_hang' ? '' : 'an-pullup-body';
        return `${F}
          <line x1="66" y1="32" x2="66" y2="206" class="an-equip" stroke-width="7"/>
          <line x1="174" y1="32" x2="174" y2="206" class="an-equip" stroke-width="7"/>
          <line x1="66" y1="32" x2="174" y2="32" class="an-bar" stroke-width="5"/>
          <g class="${cls}">
            <circle cx="120" cy="64" r="11" class="an-body"/>
            <rect x="104" y="78" width="32" height="54" rx="10" class="an-body"/>
            <path d="M110 132 L110 170 M130 132 L130 170" fill="none" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
            <path d="M104 84 L90 34 M136 84 L150 34" fill="none" stroke="#cbd5e1" stroke-width="9" stroke-linecap="round"/>
            <ellipse cx="106" cy="100" rx="6" ry="14" class="an-glow"/>
            <ellipse cx="134" cy="100" rx="6" ry="14" class="an-glow"/>
          </g>`;
      }
      case 'pulldown':
        return `${F}
          <rect x="86" y="158" width="68" height="10" rx="4" class="an-equip"/>
          <line x1="120" y1="168" x2="120" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="120" y1="18" x2="120" y2="80" stroke="#475569" stroke-width="3" class="an-pd-cable"/>
          <rect x="104" y="102" width="32" height="56" rx="10" class="an-body"/>
          <circle cx="120" cy="84" r="12" class="an-body"/>
          <ellipse cx="106" cy="124" rx="6" ry="14" class="an-glow"/>
          <ellipse cx="134" cy="124" rx="6" ry="14" class="an-glow"/>
          <g class="an-pd-ua">
            <line x1="120" y1="104" x2="120" y2="76" class="an-limb" stroke-width="10"/>
            <g class="an-pd-fa">
              <line x1="120" y1="76" x2="120" y2="48" class="an-limb" stroke-width="8"/>
              <line x1="76" y1="48" x2="164" y2="48" class="an-bar" stroke-width="5"/>
            </g>
          </g>`;
      case 'straight_arm_pd':
        return `${F}
          <line x1="176" y1="24" x2="176" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="96" cy="54" r="12" class="an-body"/>
          <path d="M98 70 L94 138 L88 204 M94 138 L104 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <ellipse cx="94" cy="104" rx="6" ry="14" class="an-glow"/>
          <g class="an-sap-arm">
            <line x1="100" y1="84" x2="148" y2="84" class="an-limb" stroke-width="9"/>
            <rect x="144" y="78" width="10" height="12" rx="3" class="an-plate"/>
          </g>`;
      case 'pullover_db':
        return `${F}
          <rect x="52" y="152" width="128" height="10" rx="4" class="an-equip"/>
          <line x1="72" y1="162" x2="72" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="158" y1="162" x2="158" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="64" cy="138" r="11" class="an-body"/>
          <path d="M76 144 L146 144 L176 156 L182 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <ellipse cx="104" cy="140" rx="14" ry="7" class="an-glow"/>
          <g class="an-po-arm">
            <line x1="96" y1="140" x2="96" y2="86" class="an-limb" stroke-width="9"/>
            <rect x="88" y="80" width="16" height="10" rx="3" class="an-plate"/>
          </g>`;
      case 'shrug':
      case 'farmer_walk':
      case 'side_bend':
        return `${F}
          <line x1="110" y1="136" x2="106" y2="204" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <line x1="130" y1="136" x2="134" y2="204" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <rect x="102" y="72" width="36" height="66" rx="12" class="an-body"/>
          <circle cx="120" cy="52" r="12" class="an-body"/>
          <g class="an-shrug">
            <ellipse cx="106" cy="72" rx="10" ry="6" class="an-glow"/>
            <ellipse cx="134" cy="72" rx="10" ry="6" class="an-glow"/>
            <line x1="98" y1="80" x2="96" y2="142" class="an-limb" stroke-width="9"/>
            <line x1="142" y1="80" x2="144" y2="142" class="an-limb" stroke-width="9"/>
            <rect x="88" y="140" width="16" height="10" rx="3" class="an-plate"/>
            <rect x="136" y="140" width="16" height="10" rx="3" class="an-plate"/>
          </g>`;
      case 'curl_bb':
      case 'curl_db':
      case 'incline_curl':
      case 'conc_curl':
      case 'wrist_curl':
      case 'curl_cable': {
        const cable = pattern === 'curl_cable'
          ? `<line x1="184" y1="40" x2="184" y2="206" class="an-equip" stroke-width="8"/><line x1="158" y1="196" x2="184" y2="196" stroke="#475569" stroke-width="2" stroke-dasharray="4 3"/>`
          : '';
        const wt = pattern === 'curl_bb' || pattern === 'wrist_curl'
          ? `<circle cx="162" cy="120" r="12" fill="none" stroke="#3b82f6" stroke-width="4"/><circle cx="162" cy="120" r="3" fill="#e2e8f0"/>`
          : `<rect x="157" y="108" width="10" height="24" rx="3" class="an-plate"/>`;
        return `${F}${cable}
          <circle cx="114" cy="52" r="12" class="an-body"/>
          <path d="M114 68 L114 138 L104 204 M114 138 L124 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="116" y1="82" x2="124" y2="120" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
          <ellipse cx="122" cy="100" rx="6" ry="11" class="an-glow"/>
          <g class="an-curl-fa">
            <line x1="124" y1="120" x2="162" y2="120" class="an-limb" stroke-width="9"/>
            ${wt}
          </g>`;
      }
      case 'preacher_curl':
        return `${F}
          <rect x="66" y="152" width="46" height="10" rx="4" class="an-equip"/>
          <line x1="88" y1="162" x2="88" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="120" y1="100" x2="136" y2="132" class="an-equip" stroke-width="10"/>
          <line x1="128" y1="118" x2="128" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="88" cy="76" r="12" class="an-body"/>
          <path d="M88 92 L88 148 L112 152 L114 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="94" y1="96" x2="128" y2="116" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="112" cy="104" rx="10" ry="6" transform="rotate(30 112 104)" class="an-glow"/>
          <g class="an-preach-fa">
            <line x1="128" y1="116" x2="164" y2="116" class="an-limb" stroke-width="9"/>
            <circle cx="164" cy="116" r="11" fill="none" stroke="#3b82f6" stroke-width="4"/>
            <circle cx="164" cy="116" r="3" fill="#e2e8f0"/>
          </g>`;
      case 'tricep_pushdown':
        return `${F}
          <line x1="176" y1="24" x2="176" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="146" y1="24" x2="178" y2="24" class="an-equip" stroke-width="6"/>
          <line x1="150" y1="26" x2="150" y2="120" stroke="#475569" stroke-width="2" stroke-dasharray="4 3"/>
          <circle cx="100" cy="52" r="12" class="an-body"/>
          <path d="M100 68 L100 138 L92 204 M100 138 L110 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="102" y1="82" x2="108" y2="120" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
          <ellipse cx="101" cy="101" rx="5" ry="11" class="an-glow"/>
          <g class="an-tp-fa">
            <line x1="108" y1="120" x2="146" y2="120" class="an-limb" stroke-width="9"/>
            <rect x="142" y="114" width="10" height="12" rx="3" class="an-plate"/>
          </g>`;
      case 'tricep_kickback':
        return `${F}
          <path d="M98 204 L94 162 L98 122 L136 90" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="150" cy="76" r="12" class="an-body"/>
          <line x1="136" y1="90" x2="112" y2="102" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="124" cy="96" rx="9" ry="5" transform="rotate(-24 124 96)" class="an-glow"/>
          <g class="an-tkb-fa">
            <line x1="112" y1="102" x2="78" y2="118" class="an-limb" stroke-width="8"/>
            <rect x="70" y="114" width="14" height="9" rx="3" class="an-plate"/>
          </g>`;
      case 'skullcrusher':
        return `${F}
          <rect x="46" y="152" width="136" height="10" rx="4" class="an-equip"/>
          <line x1="66" y1="162" x2="66" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="162" y1="162" x2="162" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="64" cy="138" r="12" class="an-body"/>
          <path d="M78 144 L148 144 L178 156 L184 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="94" y1="140" x2="78" y2="108" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="89" cy="123" rx="5" ry="10" transform="rotate(-25 89 123)" class="an-glow"/>
          <g class="an-te-fa">
            <line x1="78" y1="108" x2="78" y2="74" class="an-limb" stroke-width="8"/>
            <circle cx="78" cy="72" r="11" fill="none" stroke="#3b82f6" stroke-width="4"/>
            <circle cx="78" cy="72" r="3" fill="#e2e8f0"/>
          </g>`;
      case 'tricep_overhead':
        return `${F}
          <circle cx="114" cy="68" r="12" class="an-body"/>
          <path d="M114 84 L114 142 L104 204 M114 142 L124 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="116" y1="88" x2="118" y2="48" stroke="#94a3b8" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="112" cy="68" rx="5" ry="11" class="an-glow"/>
          <g class="an-ohe-fa">
            <line x1="118" y1="48" x2="118" y2="18" class="an-limb" stroke-width="8"/>
            <rect x="111" y="12" width="14" height="10" rx="3" class="an-plate"/>
          </g>`;
      case 'lateral_raise':
        return `${F}
          <circle cx="120" cy="52" r="12" class="an-body"/>
          <rect x="102" y="70" width="36" height="68" rx="12" class="an-body"/>
          <line x1="110" y1="136" x2="106" y2="204" stroke="#94a3b8" stroke-width="13" stroke-linecap="round"/>
          <line x1="130" y1="136" x2="134" y2="204" stroke="#94a3b8" stroke-width="13" stroke-linecap="round"/>
          <ellipse cx="99" cy="80" rx="8" ry="7" class="an-glow"/>
          <ellipse cx="141" cy="80" rx="8" ry="7" class="an-glow"/>
          <g class="an-lr-l">
            <line x1="98" y1="82" x2="98" y2="138" class="an-limb" stroke-width="9"/>
            <rect x="90" y="134" width="16" height="9" rx="3" class="an-plate"/>
          </g>
          <g class="an-lr-r">
            <line x1="142" y1="82" x2="142" y2="138" class="an-limb" stroke-width="9"/>
            <rect x="134" y="134" width="16" height="9" rx="3" class="an-plate"/>
          </g>`;
      case 'front_raise':
      case 'upright_row':
        return `${F}
          <circle cx="114" cy="52" r="12" class="an-body"/>
          <path d="M114 68 L114 138 L104 204 M114 138 L124 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="118" cy="80" rx="9" ry="7" class="an-glow"/>
          <g class="an-fr-arm">
            <line x1="116" y1="82" x2="168" y2="82" class="an-limb" stroke-width="9"/>
            <rect x="164" y="74" width="10" height="16" rx="3" class="an-plate"/>
          </g>`;
      case 'rear_delt':
        return `${F}
          <path d="M98 204 L94 162 L98 122 L136 90" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="150" cy="76" r="12" class="an-body"/>
          <ellipse cx="132" cy="88" rx="9" ry="7" class="an-glow"/>
          <g class="an-row-ua">
            <line x1="136" y1="90" x2="136" y2="146" class="an-limb" stroke-width="9"/>
            <rect x="128" y="142" width="16" height="9" rx="3" class="an-plate"/>
          </g>`;
      case 'leg_ext':
      case 'seated_leg_curl': {
        const cls = pattern === 'leg_ext' ? 'an-le-shin' : 'an-lc-shin';
        const glowY = pattern === 'leg_ext' ? 136 : 150;
        return `${F}
          <rect x="78" y="148" width="70" height="10" rx="4" class="an-equip"/>
          <line x1="96" y1="158" x2="96" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="78" y1="98" x2="78" y2="152" class="an-equip" stroke-width="10"/>
          <circle cx="94" cy="80" r="12" class="an-body"/>
          <path d="M94 96 L94 142 L146 144" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="122" cy="${glowY}" rx="16" ry="6" class="an-glow"/>
          <g class="${cls}">
            <line x1="146" y1="144" x2="190" y2="144" class="an-limb" stroke-width="11"/>
            <circle cx="186" cy="144" r="7" class="an-plate"/>
          </g>`;
      }
      case 'lying_leg_curl':
        return `${F}
          <rect x="46" y="146" width="110" height="10" rx="4" class="an-equip"/>
          <line x1="66" y1="156" x2="66" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="142" y1="156" x2="142" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="56" cy="134" r="11" class="an-body"/>
          <line x1="68" y1="138" x2="142" y2="144" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <ellipse cx="124" cy="136" rx="14" ry="6" class="an-glow"/>
          <g class="an-lyc-shin">
            <line x1="142" y1="144" x2="188" y2="144" class="an-limb" stroke-width="11"/>
            <circle cx="184" cy="144" r="7" class="an-plate"/>
          </g>`;
      case 'hip_adduction':
      case 'hip_abduction': {
        const clsL = pattern === 'hip_adduction' ? 'an-add-l' : 'an-abd-l';
        const clsR = pattern === 'hip_adduction' ? 'an-add-r' : 'an-abd-r';
        return `${F}
          <rect x="92" y="146" width="56" height="10" rx="4" class="an-equip"/>
          <line x1="120" y1="156" x2="120" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="120" cy="64" r="12" class="an-body"/>
          <rect x="104" y="80" width="32" height="62" rx="10" class="an-body"/>
          <g class="${clsL}">
            <line x1="108" y1="142" x2="96" y2="200" class="an-limb" stroke-width="12"/>
            <ellipse cx="102" cy="166" rx="6" ry="12" class="an-glow"/>
          </g>
          <g class="${clsR}">
            <line x1="132" y1="142" x2="144" y2="200" class="an-limb" stroke-width="12"/>
            <ellipse cx="138" cy="166" rx="6" ry="12" class="an-glow"/>
          </g>`;
      }
      case 'calf_standing':
        return `${F}
          <rect x="96" y="196" width="48" height="10" rx="2" class="an-equip"/>
          <g class="an-calf-lift">
            <circle cx="120" cy="48" r="12" class="an-body"/>
            <rect x="106" y="64" width="28" height="62" rx="10" class="an-body"/>
            <line x1="112" y1="126" x2="112" y2="196" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <line x1="128" y1="126" x2="128" y2="196" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <ellipse cx="109" cy="172" rx="5" ry="12" class="an-glow"/>
            <ellipse cx="131" cy="172" rx="5" ry="12" class="an-glow"/>
          </g>`;
      case 'calf_seated':
        return `${F}
          <rect x="76" y="148" width="52" height="10" rx="4" class="an-equip"/>
          <line x1="96" y1="158" x2="96" y2="206" class="an-equip" stroke-width="8"/>
          <rect x="132" y="196" width="32" height="10" rx="2" class="an-equip"/>
          <circle cx="96" cy="80" r="12" class="an-body"/>
          <path d="M96 96 L96 142 L144 142" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <g class="an-calf-lift">
            <line x1="144" y1="142" x2="144" y2="196" class="an-limb" stroke-width="12"/>
            <ellipse cx="140" cy="172" rx="5" ry="12" class="an-glow"/>
          </g>`;
      case 'hip_thrust':
        return `${F}
          <rect x="42" y="146" width="48" height="60" rx="4" class="an-equip"/>
          <g class="an-ht-shin">
            <line x1="168" y1="204" x2="168" y2="146" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          </g>
          <g class="an-ht-body">
            <line x1="88" y1="146" x2="168" y2="146" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
            <circle cx="72" cy="134" r="11" class="an-body"/>
            <ellipse cx="128" cy="146" rx="14" ry="8" class="an-glow"/>
            <circle cx="128" cy="136" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/>
            <circle cx="128" cy="136" r="4" fill="#e2e8f0"/>
          </g>`;
      case 'glute_bridge':
        return `${F}
          <line x1="156" y1="204" x2="156" y2="162" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <g class="an-gb-body">
            <line x1="76" y1="194" x2="156" y2="194" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
            <circle cx="58" cy="190" r="11" class="an-body"/>
            <ellipse cx="122" cy="190" rx="14" ry="7" class="an-glow"/>
          </g>`;
      case 'kickback':
        return `${F}
          <line x1="178" y1="40" x2="178" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="112" cy="54" r="12" class="an-body"/>
          <path d="M112 70 L112 134 L112 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <line x1="114" y1="84" x2="174" y2="96" class="an-limb" stroke-width="8"/>
          <ellipse cx="106" cy="134" rx="10" ry="8" class="an-glow"/>
          <g class="an-kb-leg">
            <line x1="112" y1="134" x2="112" y2="202" class="an-limb" stroke-width="12"/>
          </g>`;
      case 'cable_crunch':
        return `${F}
          <line x1="176" y1="30" x2="176" y2="206" class="an-equip" stroke-width="8"/>
          <path d="M84 202 L124 202 L124 164" fill="none" stroke="#94a3b8" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
          <g class="an-cr-torso" style="transform-origin:124px 164px">
            <line x1="124" y1="164" x2="124" y2="108" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
            <circle cx="124" cy="90" r="11" class="an-body"/>
            <ellipse cx="128" cy="136" rx="7" ry="14" class="an-glow"/>
          </g>`;
      case 'hanging_leg_raise':
        return `${F}
          <line x1="66" y1="32" x2="66" y2="206" class="an-equip" stroke-width="7"/>
          <line x1="174" y1="32" x2="174" y2="206" class="an-equip" stroke-width="7"/>
          <line x1="66" y1="32" x2="174" y2="32" class="an-bar" stroke-width="5"/>
          <path d="M106 72 L94 34 M134 72 L146 34" fill="none" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/>
          <circle cx="120" cy="54" r="11" class="an-body"/>
          <rect x="106" y="68" width="28" height="56" rx="10" class="an-body"/>
          <ellipse cx="120" cy="108" rx="10" ry="12" class="an-glow"/>
          <g class="an-hlr-leg">
            <line x1="120" y1="124" x2="120" y2="188" class="an-limb" stroke-width="12"/>
          </g>`;
      case 'lying_leg_raise':
        return `${F}
          <line x1="62" y1="186" x2="116" y2="186" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
          <circle cx="46" cy="182" r="11" class="an-body"/>
          <ellipse cx="96" cy="180" rx="14" ry="6" class="an-glow"/>
          <g class="an-llr-leg">
            <line x1="116" y1="186" x2="186" y2="186" class="an-limb" stroke-width="12"/>
          </g>`;
      case 'ab_wheel':
        return `${F}
          <line x1="56" y1="202" x2="90" y2="202" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
          <g class="an-abw-arm">
            <line x1="84" y1="196" x2="128" y2="148" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
            <circle cx="140" cy="136" r="11" class="an-body"/>
            <ellipse cx="106" cy="176" rx="12" ry="6" transform="rotate(-48 106 176)" class="an-glow"/>
            <line x1="128" y1="148" x2="156" y2="194" class="an-limb" stroke-width="9"/>
            <circle cx="156" cy="196" r="10" fill="none" stroke="#3b82f6" stroke-width="5"/>
          </g>`;
      case 'crunch':
        return `${F}
          <path d="M124 186 L158 148 L184 202" fill="none" stroke="#94a3b8" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
          <g class="an-cr-torso">
            <line x1="124" y1="186" x2="72" y2="186" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
            <circle cx="54" cy="182" r="11" class="an-body"/>
            <ellipse cx="102" cy="182" rx="14" ry="6" class="an-glow"/>
          </g>`;
      case 'russian_twist':
        return `${F}
          <path d="M116 196 L154 156 L178 186" fill="none" stroke="#94a3b8" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="116" y1="196" x2="82" y2="144" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
          <circle cx="72" cy="128" r="11" class="an-body"/>
          <ellipse cx="102" cy="170" rx="10" ry="12" class="an-glow"/>
          <g class="an-tw-arm">
            <line x1="94" y1="156" x2="128" y2="156" class="an-limb" stroke-width="8"/>
            <circle cx="132" cy="156" r="8" class="an-plate"/>
          </g>`;
      case 'plank':
        return `${F}
          <g class="an-pl-body">
            <line x1="74" y1="158" x2="186" y2="172" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
            <circle cx="58" cy="150" r="11" class="an-body"/>
            <path d="M74 162 L74 202 L94 202" fill="none" stroke="#cbd5e1" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="186" y1="174" x2="186" y2="202" stroke="#94a3b8" stroke-width="9" stroke-linecap="round"/>
            <ellipse cx="126" cy="168" rx="22" ry="6" class="an-glow"/>
          </g>`;
      case 'bike':
        return `${F}
          <line x1="76" y1="146" x2="76" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="158" y1="104" x2="168" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="66" y1="200" x2="176" y2="200" class="an-equip" stroke-width="8"/>
          <circle cx="90" cy="76" r="12" class="an-body"/>
          <path d="M90 92 L82 142 L118 158" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <line x1="94" y1="98" x2="158" y2="104" class="an-limb" stroke-width="9"/>
          <ellipse cx="104" cy="150" rx="14" ry="7" class="an-glow"/>
          <g class="an-bike-pedal">
            <circle cx="126" cy="168" r="16" fill="none" stroke="#3b82f6" stroke-width="4"/>
            <line x1="112" y1="168" x2="140" y2="168" class="an-bar" stroke-width="4"/>
          </g>`;
      case 'rowing_mach':
        return `${F}
          <line x1="48" y1="184" x2="196" y2="184" class="an-equip" stroke-width="8"/>
          <line x1="182" y1="136" x2="182" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="64" y1="184" x2="64" y2="206" class="an-equip" stroke-width="8"/>
          <g class="an-row-slide">
            <circle cx="110" cy="108" r="11" class="an-body"/>
            <line x1="110" y1="124" x2="102" y2="172" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
            <line x1="112" y1="130" x2="152" y2="146" class="an-limb" stroke-width="9"/>
            <ellipse cx="106" cy="146" rx="7" ry="14" class="an-glow"/>
          </g>`;
      case 'jump_rope':
        return `${F}
          <g class="an-calf-lift">
            <circle cx="120" cy="52" r="12" class="an-body"/>
            <rect x="104" y="68" width="32" height="64" rx="10" class="an-body"/>
            <line x1="112" y1="132" x2="110" y2="200" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <line x1="128" y1="132" x2="130" y2="200" stroke="#94a3b8" stroke-width="12" stroke-linecap="round"/>
            <ellipse cx="110" cy="176" rx="5" ry="12" class="an-glow"/>
            <ellipse cx="130" cy="176" rx="5" ry="12" class="an-glow"/>
          </g>
          <path d="M74 114 Q120 206 166 114" fill="none" stroke="#38bdf8" stroke-width="3" class="an-glow-s"/>`;
      case 'kb_swing':
        return `${F}
          <path d="M108 204 L104 160 L112 120 L112 72" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="114" cy="54" r="12" class="an-body"/>
          <ellipse cx="108" cy="142" rx="7" ry="14" class="an-glow"/>
          <g class="an-kbs-arm">
            <line x1="112" y1="92" x2="162" y2="92" class="an-limb" stroke-width="9"/>
            <circle cx="168" cy="92" r="9" class="an-plate"/>
          </g>`;
      case 'stairmaster':
      case 'treadmill':
      default:
        return `${F}
          <line x1="56" y1="196" x2="182" y2="196" class="an-equip" stroke-width="8"/>
          <line x1="168" y1="112" x2="176" y2="196" class="an-equip" stroke-width="7"/>
          <line x1="146" y1="112" x2="170" y2="112" class="an-equip" stroke-width="6"/>
          <circle cx="124" cy="54" r="12" class="an-body"/>
          <line x1="120" y1="70" x2="116" y2="128" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
          <ellipse cx="116" cy="146" rx="14" ry="8" class="an-glow"/>
          <g class="an-cd-l1">
            <path d="M116 128 L128 160 L114 190" fill="none" stroke="#cbd5e1" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
          </g>
          <g class="an-cd-l2">
            <path d="M116 128 L104 160 L92 190" fill="none" stroke="#94a3b8" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
          </g>`;
    }
  }

  function renderThumbSvg(exMeta) {
    const pattern = getPattern(exMeta || {});
    return `<svg viewBox="0 0 240 240" width="100%" height="100%" style="display:block;background:#070d1a">${STATIC_CSS}${buildScene(pattern)}</svg>`;
  }

  function renderSvg(exMeta) {
    const pattern = getPattern(exMeta || {});
    return `<svg viewBox="0 0 240 240" width="100%" height="100%" style="display:block;background:#070d1a">${SHARED_CSS}${buildScene(pattern)}</svg>`;
  }

  return { getPattern, renderThumbSvg, renderSvg, EXERCISE_RIG_MAP };
})();
