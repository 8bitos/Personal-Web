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

      /* Tricep Pushdown / Skullcrusher / Overhead */
      .an-tp-fa { transform-origin: 108px 120px; animation: anTp 1.7s ease-in-out infinite; }
      @keyframes anTp { 0%, 100% { transform: rotate(-36deg); } 50% { transform: rotate(76deg); } }
      .an-te-fa { transform-origin: 78px 108px; animation: anTe 1.8s ease-in-out infinite; }
      @keyframes anTe { 0%, 100% { transform: rotate(-100deg); } 50% { transform: rotate(0deg); } }
      .an-ohe-fa { transform-origin: 118px 48px; animation: anOhe 1.8s ease-in-out infinite; }
      @keyframes anOhe { 0%, 100% { transform: rotate(-110deg); } 50% { transform: rotate(0deg); } }

      /* Lateral / Front / Rear Delt Raise */
      .an-lr-l { transform-origin: 98px 82px;  animation: anLrL 1.8s ease-in-out infinite; }
      .an-lr-r { transform-origin: 142px 82px; animation: anLrR 1.8s ease-in-out infinite; }
      @keyframes anLrL { 0%, 100% { transform: rotate(12deg); }  50% { transform: rotate(86deg); } }
      @keyframes anLrR { 0%, 100% { transform: rotate(-12deg); } 50% { transform: rotate(-86deg); } }
      .an-fr-arm { transform-origin: 116px 82px; animation: anFr 1.8s ease-in-out infinite; }
      @keyframes anFr { 0%, 100% { transform: rotate(82deg); } 50% { transform: rotate(0deg); } }

      /* Leg Ext / Lying Curl / Seated Curl / Calf */
      .an-le-shin { transform-origin: 146px 144px; animation: anLe 1.8s ease-in-out infinite; }
      @keyframes anLe { 0%, 100% { transform: rotate(78deg); } 50% { transform: rotate(4deg); } }
      .an-lc-shin { transform-origin: 146px 144px; animation: anLc 1.8s ease-in-out infinite; }
      @keyframes anLc { 0%, 100% { transform: rotate(6deg); } 50% { transform: rotate(78deg); } }
      .an-lyc-shin { transform-origin: 142px 144px; animation: anLyc 1.8s ease-in-out infinite; }
      @keyframes anLyc { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-82deg); } }
      .an-calf-lift { animation: anCalf 1.5s ease-in-out infinite; }
      @keyframes anCalf { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }

      /* Hip Thrust / Glute Bridge / Kickback */
      .an-ht-body { transform-origin: 90px 146px; animation: anHt 1.9s ease-in-out infinite; }
      .an-ht-shin { transform-origin: 168px 204px; animation: anHtShin 1.9s ease-in-out infinite; }
      @keyframes anHt     { 0%, 100% { transform: rotate(26deg); } 50% { transform: rotate(0deg); } }
      @keyframes anHtShin { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(0deg); } }
      .an-gb-body { transform-origin: 76px 194px; animation: anGb 1.9s ease-in-out infinite; }
      @keyframes anGb { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-22deg); } }
      .an-kb-leg { transform-origin: 112px 134px; animation: anKb 1.7s ease-in-out infinite; }
      @keyframes anKb { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(45deg); } }

      /* Core: Crunch / Hanging Leg Raise / Ab Wheel / Plank / Twist */
      .an-cr-torso { transform-origin: 124px 186px; animation: anCr 1.8s ease-in-out infinite; }
      @keyframes anCr { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(36deg); } }
      .an-hlr-leg { transform-origin: 120px 124px; animation: anHlr 1.9s ease-in-out infinite; }
      @keyframes anHlr { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-82deg); } }
      .an-abw-arm { transform-origin: 84px 196px; animation: anAbw 2s ease-in-out infinite; }
      @keyframes anAbw { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(28deg); } }
      .an-pl-body { transform-origin: 186px 182px; animation: anPl 2.4s ease-in-out infinite; }
      @keyframes anPl { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-1.2deg); } }

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
    'ex-bench': 'bench_bb',
    'ex-incline-bb-bench': 'incline_bb',
    'ex-decline-bb-bench': 'decline_bb',
    'ex-db-bench': 'bench_db',
    'ex-incline-db': 'incline_db',
    'ex-db-fly': 'fly_db',
    'ex-cable-fly': 'cable_fly',
    'ex-low-cable-fly': 'cable_fly',
    'ex-pec-deck': 'pec_deck',
    'ex-chest-press-mach': 'chest_press_mach',
    'ex-smith-incline': 'incline_bb',
    'ex-pushup': 'pushup',
    'ex-chest-dip': 'dip',
    'ex-pullup': 'pullup',
    'ex-weighted-pullup': 'pullup',
    'ex-assisted-pullup': 'pullup',
    'ex-chinup': 'pullup',
    'ex-lat-pulldown': 'pulldown',
    'ex-close-lat-pulldown': 'pulldown',
    'ex-straight-arm-pulldown': 'straight_arm_pd',
    'ex-pullover-db': 'pullover_db',
    'ex-bb-row': 'row_bb',
    'ex-pendlay-row': 'row_bb',
    'ex-tbar-row': 'row_bb',
    'ex-one-arm-db-row': 'row_db',
    'ex-chest-supported-row': 'row_incline',
    'ex-seated-cable-row': 'seated_row',
    'ex-machine-row': 'seated_row',
    'ex-face-pull': 'face_pull',
    'ex-inverted-row': 'inverted_row',
    'ex-deadlift': 'deadlift',
    'ex-back-extension': 'back_ext',
    'ex-good-morning': 'back_ext',
    'ex-bb-shrug': 'shrug',
    'ex-db-shrug': 'shrug',
    'ex-rack-pull': 'deadlift',
    'ex-ohp': 'ohp_bb',
    'ex-db-shoulder-press': 'ohp_seated',
    'ex-arnold-press': 'ohp_seated',
    'ex-mach-shoulder-press': 'ohp_seated',
    'ex-lat-raise': 'lateral_raise',
    'ex-cable-lat-raise': 'lateral_raise',
    'ex-front-raise': 'front_raise',
    'ex-rev-pec-deck': 'rear_delt',
    'ex-rear-delt-fly': 'rear_delt',
    'ex-upright-row': 'upright_row',
    'ex-bb-curl': 'curl_bb',
    'ex-ez-curl': 'curl_bb',
    'ex-preacher-curl': 'preacher_curl',
    'ex-db-curl': 'curl_db',
    'ex-incline-db-curl': 'curl_db',
    'ex-hammer-curl': 'curl_db',
    'ex-conc-curl': 'preacher_curl',
    'ex-cable-curl': 'curl_cable',
    'ex-tricep-push': 'tricep_pushdown',
    'ex-tricep-bar-push': 'tricep_pushdown',
    'ex-overhead-cable-ext': 'tricep_overhead',
    'ex-skullcrusher': 'skullcrusher',
    'ex-db-overhead-ext': 'tricep_overhead',
    'ex-close-bench': 'bench_bb',
    'ex-tricep-dip': 'dip',
    'ex-assisted-dip': 'dip',
    'ex-wrist-curl': 'preacher_curl',
    'ex-rev-curl': 'curl_bb',
    'ex-dead-hang': 'dead_hang',
    'ex-squat': 'squat_back',
    'ex-front-squat': 'squat_front',
    'ex-hack-squat': 'leg_press',
    'ex-leg-press': 'leg_press',
    'ex-leg-ext': 'leg_ext',
    'ex-goblet-squat': 'squat_front',
    'ex-bulgarian-split': 'lunge',
    'ex-walking-lunge': 'lunge',
    'ex-smith-squat': 'squat_back',
    'ex-rdl': 'deadlift',
    'ex-db-rdl': 'deadlift',
    'ex-stiff-dl': 'deadlift',
    'ex-leg-curl': 'seated_leg_curl',
    'ex-lying-leg-curl': 'lying_leg_curl',
    'ex-hip-thrust': 'hip_thrust',
    'ex-glute-bridge': 'glute_bridge',
    'ex-cable-kickback': 'kickback',
    'ex-sumo-deadlift': 'deadlift',
    'ex-standing-calf': 'calf_standing',
    'ex-seated-calf': 'calf_seated',
    'ex-legpress-calf': 'leg_press',
    'ex-hip-adduction': 'seated_leg_curl',
    'ex-hip-abduction': 'seated_leg_curl',
    'ex-cable-crunch': 'cable_crunch',
    'ex-hanging-leg-raise': 'hanging_leg_raise',
    'ex-ab-wheel': 'ab_wheel',
    'ex-crunch': 'crunch',
    'ex-plank': 'plank',
    'ex-russian-twist': 'crunch',
    'ex-treadmill': 'treadmill',
    'ex-incline-walk': 'treadmill',
    'ex-stationary-bike': 'bike',
    'ex-rowing-mach': 'rowing_mach',
    'ex-stairmaster': 'treadmill',
    'ex-jump-rope': 'jump_rope',
    'ex-kb-swing': 'kb_swing',
    'ex-trap-dl': 'deadlift',
    'ex-burpee': 'pushup',
    'ex-clean-press': 'ohp_bb',
    'ex-farmer-walk': 'shrug'
  };

  function getPattern(ex) {
    if (ex.id && EXERCISE_RIG_MAP[ex.id]) return EXERCISE_RIG_MAP[ex.id];
    const name = (ex.name || '').toLowerCase();
    const muscle = (ex.muscle || '').toLowerCase();
    const equip = (ex.equipment || '').toLowerCase();
    if (/bike|cycling/.test(name)) return 'bike';
    if (/rowing/.test(name)) return 'rowing_mach';
    if (/jump rope/.test(name)) return 'jump_rope';
    if (muscle === 'cardio' || /treadmill|run|walk|stair/.test(name)) return 'treadmill';
    if (/plank/.test(name)) return 'plank';
    if (/hang/.test(name)) return 'dead_hang';
    if (/ab wheel/.test(name)) return 'ab_wheel';
    if (/leg raise/.test(name)) return 'hanging_leg_raise';
    if (/cable crunch/.test(name)) return 'cable_crunch';
    if (muscle === 'abdominals' || /crunch|sit-up/.test(name)) return 'crunch';
    if (/hip thrust/.test(name)) return 'hip_thrust';
    if (/glute bridge/.test(name)) return 'glute_bridge';
    if (/kickback/.test(name)) return 'kickback';
    if (/lying.*curl/.test(name)) return 'lying_leg_curl';
    if (/leg curl/.test(name)) return 'seated_leg_curl';
    if (/leg ext/.test(name)) return 'leg_ext';
    if (/seated.*calf/.test(name)) return 'calf_seated';
    if (/calf/.test(name)) return 'calf_standing';
    if (/leg press|hack squat/.test(name)) return 'leg_press';
    if (/lunge|split squat/.test(name)) return 'lunge';
    if (/front squat|goblet/.test(name)) return 'squat_front';
    if (/squat/.test(name)) return 'squat_back';
    if (/back ext|good morning/.test(name)) return 'back_ext';
    if (/deadlift|rdl|rack pull/.test(name)) return 'deadlift';
    if (/shrug|farmer/.test(name)) return 'shrug';
    if (/incline.*press/.test(name)) return equip === 'dumbbell' ? 'incline_db' : 'incline_bb';
    if (/decline.*press/.test(name)) return 'decline_bb';
    if (/pec deck/.test(name)) return 'pec_deck';
    if (/cable.*fly|crossover/.test(name)) return 'cable_fly';
    if (/fly/.test(name) && muscle === 'chest') return 'fly_db';
    if (/chest press/.test(name)) return 'chest_press_mach';
    if (/push up|push-up/.test(name)) return 'pushup';
    if (/bench press/.test(name)) return equip === 'dumbbell' ? 'bench_db' : 'bench_bb';
    if (/dip/.test(name)) return 'dip';
    if (/pull up|pull-up|chin up/.test(name)) return 'pullup';
    if (/pullover/.test(name)) return 'pullover_db';
    if (/straight-arm/.test(name)) return 'straight_arm_pd';
    if (/pulldown/.test(name)) return 'pulldown';
    if (/face pull/.test(name)) return 'face_pull';
    if (/seated.*row|cable row/.test(name)) return 'seated_row';
    if (/row/.test(name)) return equip === 'dumbbell' ? 'row_db' : 'row_bb';
    if (/skullcrusher/.test(name)) return 'skullcrusher';
    if (/overhead.*ext/.test(name)) return 'tricep_overhead';
    if (/pushdown/.test(name) || muscle === 'triceps') return 'tricep_pushdown';
    if (/preacher/.test(name)) return 'preacher_curl';
    if (/curl/.test(name) || muscle === 'biceps') return equip === 'cable' ? 'curl_cable' : equip === 'dumbbell' ? 'curl_db' : 'curl_bb';
    if (/rear delt|reverse/.test(name)) return 'rear_delt';
    if (/front raise/.test(name)) return 'front_raise';
    if (/lateral raise/.test(name)) return 'lateral_raise';
    if (/overhead|shoulder press|military/.test(name) || muscle === 'shoulders') return 'ohp_bb';
    if (/kettlebell swing/.test(name)) return 'kb_swing';
    return 'squat_back';
  }

  function buildScene(pattern) {
    const F = `<line x1="24" y1="206" x2="216" y2="206" class="an-floor"/>`;
    switch (pattern) {
      case 'bench_bb':
      case 'bench_db': {
        const weight = pattern === 'bench_db'
          ? `<rect x="96" y="80" width="16" height="10" rx="3" class="an-plate"/>`
          : `<circle cx="104" cy="86" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/><circle cx="104" cy="86" r="4" fill="#e2e8f0"/>`;
        return `${F}
          <rect x="46" y="152" width="136" height="10" rx="4" class="an-equip"/>
          <line x1="66" y1="162" x2="66" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="162" y1="162" x2="162" y2="206" class="an-equip" stroke-width="8"/>
          <circle cx="64" cy="138" r="12" class="an-body"/>
          <path d="M78 144 L148 144 L178 156 L184 204" fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <ellipse cx="104" cy="138" rx="14" ry="7" class="an-glow"/>
          <g class="an-bp-ua">
            <line x1="104" y1="140" x2="104" y2="114" class="an-limb" stroke-width="10"/>
            <g class="an-bp-fa">
              <line x1="104" y1="114" x2="104" y2="86" class="an-limb" stroke-width="8"/>
              ${weight}
            </g>
          </g>`;
      }
      case 'incline_bb':
      case 'incline_db': {
        const weight = pattern === 'incline_db'
          ? `<rect x="88" y="58" width="16" height="10" rx="3" class="an-plate"/>`
          : `<circle cx="96" cy="64" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/><circle cx="96" cy="64" r="4" fill="#e2e8f0"/>`;
        return `${F}
          <!-- 35-deg incline bench grounded at y=206 -->
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
        return `${F}
          <!-- Front/head-on bench view for wide fly arc -->
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
        return `${F}
          <!-- Dual cable towers grounded at y=206 -->
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
        return `${F}
          <g class="an-pu-body">
            <line x1="68" y1="146" x2="184" y2="196" stroke="#94a3b8" stroke-width="14" stroke-linecap="round"/>
            <circle cx="54" cy="134" r="11" class="an-body"/>
            <ellipse cx="88" cy="158" rx="12" ry="6" transform="rotate(24 88 158)" class="an-glow"/>
          </g>
          <!-- Grounded arm support at floor -->
          <line x1="76" y1="154" x2="76" y2="204" class="an-limb" stroke-width="9"/>`;
      case 'dip':
        return `${F}
          <!-- Dip station bars grounded at y=206 -->
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
      case 'ohp_seated': {
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
      case 'squat_front': {
        const barX = pattern === 'squat_front' ? 128 : 112;
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
                <circle cx="${barX}" cy="64" r="14" fill="none" stroke="#3b82f6" stroke-width="5"/>
                <circle cx="${barX}" cy="64" r="4" fill="#e2e8f0"/>
              </g>
            </g>
          </g>`;
      }
      case 'leg_press':
        return `${F}
          <!-- 45-deg Leg Press sled grounded at y=206 -->
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
        return `${F}
          <!-- Grounded rear bench for Bulgarian / Lunge depth -->
          <rect x="44" y="164" width="40" height="10" rx="4" class="an-equip"/>
          <line x1="64" y1="174" x2="64" y2="206" class="an-equip" stroke-width="8"/>
          <g class="an-lng-body">
            <circle cx="128" cy="48" r="12" class="an-body"/>
            <rect x="114" y="64" width="28" height="58" rx="10" class="an-body"/>
            <path d="M128 122 L154 158 L154 198" fill="none" stroke="#cbd5e1" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M120 122 L80 158" fill="none" stroke="#94a3b8" stroke-width="11" stroke-linecap="round"/>
            <ellipse cx="144" cy="142" rx="7" ry="14" transform="rotate(-30 144 142)" class="an-glow"/>
          </g>`;
      case 'deadlift':
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
                <g class="an-dl-arm">
                  <line x1="110" y1="64" x2="110" y2="122" class="an-limb" stroke-width="9"/>
                  <circle cx="110" cy="126" r="16" fill="none" stroke="#3b82f6" stroke-width="5"/>
                  <circle cx="110" cy="126" r="4" fill="#e2e8f0"/>
                </g>
              </g>
            </g>
          </g>`;
      case 'back_ext':
        return `${F}
          <!-- Roman chair grounded at y=206 -->
          <line x1="80" y1="164" x2="120" y2="138" class="an-equip" stroke-width="10"/>
          <line x1="104" y1="150" x2="104" y2="206" class="an-equip" stroke-width="8"/>
          <line x1="74" y1="178" x2="114" y2="138" stroke="#94a3b8" stroke-width="13" stroke-linecap="round"/>
          <g class="an-be-torso">
            <line x1="114" y1="138" x2="158" y2="94" stroke="#94a3b8" stroke-width="15" stroke-linecap="round"/>
            <line x1="122" y1="128" x2="142" y2="108" class="an-glow-s" stroke-width="6"/>
            <circle cx="170" cy="82" r="11" class="an-body"/>
          </g>`;
      case 'row_bb':
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
      case 'curl_cable': {
        const cable = pattern === 'curl_cable'
          ? `<line x1="184" y1="40" x2="184" y2="206" class="an-equip" stroke-width="8"/><line x1="158" y1="196" x2="184" y2="196" stroke="#475569" stroke-width="2" stroke-dasharray="4 3"/>`
          : '';
        const wt = pattern === 'curl_bb'
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
