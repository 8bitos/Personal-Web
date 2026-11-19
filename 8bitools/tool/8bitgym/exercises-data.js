window.IRONLOG_CATALOG = (() => {
  'use strict';

  const MUSCLE_GROUPS = [
    'Chest',
    'Lats',
    'Upper Back',
    'Lower Back',
    'Traps',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Forearms',
    'Quadriceps',
    'Hamstrings',
    'Glutes',
    'Calves',
    'Adductors',
    'Abductors',
    'Abdominals',
    'Cardio',
    'Full Body'
  ];

  const EQUIPMENT_LIST = [
    'Barbell',
    'Dumbbell',
    'Cable',
    'Machine',
    'Smith Machine',
    'EZ Bar',
    'Kettlebell',
    'Trap Bar',
    'Bodyweight',
    'Resistance Band',
    'Cardio Machine',
    'Other'
  ];

  const EXERCISE_TYPES = [
    { id: 'weight_reps', label: 'Beban & Reps (kg × reps)' },
    { id: 'weighted_bodyweight', label: 'Weighted Bodyweight (+kg × reps)' },
    { id: 'assisted_bodyweight', label: 'Assisted Bodyweight (-kg × reps)' },
    { id: 'reps_only', label: 'Bodyweight (Reps saja)' },
    { id: 'duration', label: 'Durasi (Detik)' },
    { id: 'distance_duration', label: 'Jarak & Durasi (km & menit)' }
  ];

  // Comprehensive exercise library modeled after Hevy muscle & equipment taxonomy
  const EXERCISES = [
    // --- CHEST ---
    { id: 'ex-bench', name: 'Barbell Bench Press', muscle: 'Chest', secondary: ['Shoulders', 'Triceps'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Bench_Press_-_Medium_Grip' },
    { id: 'ex-incline-bb-bench', name: 'Incline Barbell Bench Press', muscle: 'Chest', secondary: ['Shoulders', 'Triceps'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Incline_Bench_Press_-_Medium_Grip' },
    { id: 'ex-decline-bb-bench', name: 'Decline Barbell Bench Press', muscle: 'Chest', secondary: ['Triceps'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Decline_Barbell_Bench_Press' },
    { id: 'ex-db-bench', name: 'Dumbbell Bench Press', muscle: 'Chest', secondary: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Bench_Press' },
    { id: 'ex-incline-db', name: 'Incline Dumbbell Press', muscle: 'Chest', secondary: ['Shoulders', 'Triceps'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Incline_Dumbbell_Press' },
    { id: 'ex-db-fly', name: 'Dumbbell Chest Fly', muscle: 'Chest', secondary: ['Shoulders'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Flyes' },
    { id: 'ex-cable-fly', name: 'Cable Chest Fly', muscle: 'Chest', secondary: ['Shoulders'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Cable_Crossover' },
    { id: 'ex-low-cable-fly', name: 'Low-to-High Cable Fly', muscle: 'Chest', secondary: ['Shoulders'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Low_Cable_Crossover' },
    { id: 'ex-pec-deck', name: 'Pec Deck Machine Fly', muscle: 'Chest', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Butterfly' },
    { id: 'ex-chest-press-mach', name: 'Seated Chest Press Machine', muscle: 'Chest', secondary: ['Triceps'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Machine_Bench_Press' },
    { id: 'ex-smith-incline', name: 'Smith Machine Incline Press', muscle: 'Chest', secondary: ['Shoulders', 'Triceps'], equipment: 'Smith Machine', type: 'weight_reps' , freeDbId: 'Smith_Machine_Incline_Bench_Press' },
    { id: 'ex-pushup', name: 'Push Up', muscle: 'Chest', secondary: ['Shoulders', 'Triceps'], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Pushups' },
    { id: 'ex-chest-dip', name: 'Chest Dip (Weighted)', muscle: 'Chest', secondary: ['Triceps', 'Shoulders'], equipment: 'Bodyweight', type: 'weighted_bodyweight' , freeDbId: 'Dips_-_Chest_Version' },

    // --- LATS ---
    { id: 'ex-pullup', name: 'Pull Up', muscle: 'Lats', secondary: ['Biceps', 'Upper Back'], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Scapular_Pull-Up' },
    { id: 'ex-weighted-pullup', name: 'Weighted Pull Up', muscle: 'Lats', secondary: ['Biceps', 'Upper Back'], equipment: 'Bodyweight', type: 'weighted_bodyweight' , freeDbId: 'Pullups' },
    { id: 'ex-assisted-pullup', name: 'Assisted Pull Up', muscle: 'Lats', secondary: ['Biceps'], equipment: 'Machine', type: 'assisted_bodyweight' , freeDbId: 'Band_Assisted_Pull-Up' },
    { id: 'ex-chinup', name: 'Chin Up', muscle: 'Lats', secondary: ['Biceps'], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Chin-Up' },
    { id: 'ex-lat-pulldown', name: 'Lat Pulldown (Wide Grip)', muscle: 'Lats', secondary: ['Biceps', 'Upper Back'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Wide-Grip_Lat_Pulldown' },
    { id: 'ex-close-lat-pulldown', name: 'Close-Grip Lat Pulldown', muscle: 'Lats', secondary: ['Biceps'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Close-Grip_Front_Lat_Pulldown' },
    { id: 'ex-straight-arm-pulldown', name: 'Straight-Arm Cable Pulldown', muscle: 'Lats', secondary: ['Triceps'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Straight-Arm_Pulldown' },
    { id: 'ex-pullover-db', name: 'Dumbbell Pullover', muscle: 'Lats', secondary: ['Chest'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Straight-Arm_Dumbbell_Pullover' },

    // --- UPPER BACK ---
    { id: 'ex-bb-row', name: 'Barbell Bent-Over Row', muscle: 'Upper Back', secondary: ['Lats', 'Biceps', 'Lower Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Bent_Over_Barbell_Row' },
    { id: 'ex-pendlay-row', name: 'Pendlay Row', muscle: 'Upper Back', secondary: ['Lats', 'Lower Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Bent_Over_Barbell_Row' },
    { id: 'ex-tbar-row', name: 'T-Bar Row', muscle: 'Upper Back', secondary: ['Lats', 'Biceps'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Lying_T-Bar_Row' },
    { id: 'ex-one-arm-db-row', name: 'Single-Arm Dumbbell Row', muscle: 'Upper Back', secondary: ['Lats', 'Biceps'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'One-Arm_Dumbbell_Row' },
    { id: 'ex-chest-supported-row', name: 'Chest-Supported Dumbbell Row', muscle: 'Upper Back', secondary: ['Lats'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Incline_Row' },
    { id: 'ex-seated-cable-row', name: 'Seated Cable Row', muscle: 'Upper Back', secondary: ['Lats', 'Biceps'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Seated_Cable_Rows' },
    { id: 'ex-machine-row', name: 'Iso-Lateral Machine Row', muscle: 'Upper Back', secondary: ['Lats', 'Biceps'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Leverage_Iso_Row' },
    { id: 'ex-face-pull', name: 'Cable Face Pull', muscle: 'Upper Back', secondary: ['Shoulders', 'Traps'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Face_Pull' },
    { id: 'ex-inverted-row', name: 'Inverted Row', muscle: 'Upper Back', secondary: ['Biceps'], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Inverted_Row' },

    // --- LOWER BACK ---
    { id: 'ex-deadlift', name: 'Conventional Deadlift', muscle: 'Lower Back', secondary: ['Hamstrings', 'Glutes', 'Traps'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Deadlift' },
    { id: 'ex-back-extension', name: 'Back Extension (Hyperextension)', muscle: 'Lower Back', secondary: ['Glutes', 'Hamstrings'], equipment: 'Bodyweight', type: 'weighted_bodyweight' , freeDbId: 'Hyperextensions_Back_Extensions' },
    { id: 'ex-good-morning', name: 'Barbell Good Morning', muscle: 'Lower Back', secondary: ['Hamstrings', 'Glutes'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Good_Morning' },

    // --- TRAPS ---
    { id: 'ex-bb-shrug', name: 'Barbell Shrug', muscle: 'Traps', secondary: ['Forearms'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Shrug' },
    { id: 'ex-db-shrug', name: 'Dumbbell Shrug', muscle: 'Traps', secondary: ['Forearms'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Shrug' },
    { id: 'ex-rack-pull', name: 'Rack Pull', muscle: 'Traps', secondary: ['Lower Back', 'Upper Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Rack_Pulls' },

    // --- SHOULDERS ---
    { id: 'ex-ohp', name: 'Barbell Overhead Press', muscle: 'Shoulders', secondary: ['Triceps', 'Upper Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Standing_Military_Press' },
    { id: 'ex-db-shoulder-press', name: 'Seated Dumbbell Shoulder Press', muscle: 'Shoulders', secondary: ['Triceps'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Shoulder_Press' },
    { id: 'ex-arnold-press', name: 'Arnold Press', muscle: 'Shoulders', secondary: ['Triceps'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Arnold_Dumbbell_Press' },
    { id: 'ex-mach-shoulder-press', name: 'Machine Shoulder Press', muscle: 'Shoulders', secondary: ['Triceps'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Machine_Shoulder_Military_Press' },
    { id: 'ex-lat-raise', name: 'Dumbbell Lateral Raise', muscle: 'Shoulders', secondary: [], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Side_Lateral_Raise' },
    { id: 'ex-cable-lat-raise', name: 'Cable Lateral Raise', muscle: 'Shoulders', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Cable_Seated_Lateral_Raise' },
    { id: 'ex-front-raise', name: 'Dumbbell Front Raise', muscle: 'Shoulders', secondary: [], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Front_Dumbbell_Raise' },
    { id: 'ex-rev-pec-deck', name: 'Reverse Pec Deck (Rear Delt)', muscle: 'Shoulders', secondary: ['Upper Back'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Reverse_Machine_Flyes' },
    { id: 'ex-rear-delt-fly', name: 'Bent-Over Dumbbell Rear Delt Fly', muscle: 'Shoulders', secondary: ['Upper Back'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Seated_Bent-Over_Rear_Delt_Raise' },
    { id: 'ex-upright-row', name: 'Cable Upright Row', muscle: 'Shoulders', secondary: ['Traps'], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Upright_Cable_Row' },

    // --- BICEPS ---
    { id: 'ex-bb-curl', name: 'Barbell Bicep Curl', muscle: 'Biceps', secondary: ['Forearms'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Curl' },
    { id: 'ex-ez-curl', name: 'EZ-Bar Bicep Curl', muscle: 'Biceps', secondary: ['Forearms'], equipment: 'EZ Bar', type: 'weight_reps' , freeDbId: 'EZ-Bar_Curl' },
    { id: 'ex-preacher-curl', name: 'EZ-Bar Preacher Curl', muscle: 'Biceps', secondary: [], equipment: 'EZ Bar', type: 'weight_reps' , freeDbId: 'EZ-Bar_Curl' },
    { id: 'ex-db-curl', name: 'Dumbbell Bicep Curl', muscle: 'Biceps', secondary: ['Forearms'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Bicep_Curl' },
    { id: 'ex-incline-db-curl', name: 'Incline Dumbbell Curl', muscle: 'Biceps', secondary: [], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Incline_Dumbbell_Curl' },
    { id: 'ex-hammer-curl', name: 'Dumbbell Hammer Curl', muscle: 'Biceps', secondary: ['Forearms'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Preacher_Hammer_Dumbbell_Curl' },
    { id: 'ex-conc-curl', name: 'Concentration Curl', muscle: 'Biceps', secondary: [], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Standing_Concentration_Curl' },
    { id: 'ex-cable-curl', name: 'Cable Bicep Curl', muscle: 'Biceps', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Standing_Biceps_Cable_Curl' },

    // --- TRICEPS ---
    { id: 'ex-tricep-push', name: 'Tricep Rope Pushdown', muscle: 'Triceps', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Triceps_Pushdown_-_Rope_Attachment' },
    { id: 'ex-tricep-bar-push', name: 'Tricep Straight-Bar Pushdown', muscle: 'Triceps', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Triceps_Pushdown' },
    { id: 'ex-overhead-cable-ext', name: 'Overhead Cable Tricep Extension', muscle: 'Triceps', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Cable_Lying_Triceps_Extension' },
    { id: 'ex-skullcrusher', name: 'EZ-Bar Skullcrusher', muscle: 'Triceps', secondary: [], equipment: 'EZ Bar', type: 'weight_reps' , freeDbId: 'EZ-Bar_Skullcrusher' },
    { id: 'ex-db-overhead-ext', name: 'Dumbbell Overhead Tricep Extension', muscle: 'Triceps', secondary: [], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Lying_Dumbbell_Tricep_Extension' },
    { id: 'ex-close-bench', name: 'Close-Grip Barbell Bench Press', muscle: 'Triceps', secondary: ['Chest', 'Shoulders'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Close-Grip_Barbell_Bench_Press' },
    { id: 'ex-tricep-dip', name: 'Tricep Dip', muscle: 'Triceps', secondary: ['Chest', 'Shoulders'], equipment: 'Bodyweight', type: 'weighted_bodyweight' , freeDbId: 'Dips_-_Triceps_Version' },
    { id: 'ex-assisted-dip', name: 'Assisted Dip', muscle: 'Triceps', secondary: ['Chest'], equipment: 'Machine', type: 'assisted_bodyweight' , freeDbId: 'Dip_Machine' },

    // --- FOREARMS ---
    { id: 'ex-wrist-curl', name: 'Barbell Wrist Curl', muscle: 'Forearms', secondary: [], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Curl' },
    { id: 'ex-rev-curl', name: 'EZ-Bar Reverse Curl', muscle: 'Forearms', secondary: ['Biceps'], equipment: 'EZ Bar', type: 'weight_reps' , freeDbId: 'EZ-Bar_Curl' },
    { id: 'ex-dead-hang', name: 'Dead Hang', muscle: 'Forearms', secondary: ['Lats'], equipment: 'Bodyweight', type: 'duration' , freeDbId: 'Pullups' },

    // --- QUADRICEPS ---
    { id: 'ex-squat', name: 'Barbell Back Squat', muscle: 'Quadriceps', secondary: ['Glutes', 'Lower Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Squat' },
    { id: 'ex-front-squat', name: 'Barbell Front Squat', muscle: 'Quadriceps', secondary: ['Glutes', 'Abdominals'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Front_Barbell_Squat' },
    { id: 'ex-hack-squat', name: 'Hack Squat Machine', muscle: 'Quadriceps', secondary: ['Glutes'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Hack_Squat' },
    { id: 'ex-leg-press', name: 'Leg Press', muscle: 'Quadriceps', secondary: ['Glutes'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Leg_Press' },
    { id: 'ex-leg-ext', name: 'Leg Extension', muscle: 'Quadriceps', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Single-Leg_Leg_Extension' },
    { id: 'ex-goblet-squat', name: 'Goblet Squat', muscle: 'Quadriceps', secondary: ['Glutes'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Goblet_Squat' },
    { id: 'ex-bulgarian-split', name: 'Bulgarian Split Squat', muscle: 'Quadriceps', secondary: ['Glutes'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Split_Squats' },
    { id: 'ex-walking-lunge', name: 'Dumbbell Walking Lunge', muscle: 'Quadriceps', secondary: ['Glutes', 'Hamstrings'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Dumbbell_Lunges' },
    { id: 'ex-smith-squat', name: 'Smith Machine Squat', muscle: 'Quadriceps', secondary: ['Glutes'], equipment: 'Smith Machine', type: 'weight_reps' , freeDbId: 'Smith_Machine_Squat' },

    // --- HAMSTRINGS ---
    { id: 'ex-rdl', name: 'Romanian Deadlift (Barbell)', muscle: 'Hamstrings', secondary: ['Glutes', 'Lower Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Romanian_Deadlift' },
    { id: 'ex-db-rdl', name: 'Dumbbell Romanian Deadlift', muscle: 'Hamstrings', secondary: ['Glutes'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Romanian_Deadlift' },
    { id: 'ex-stiff-dl', name: 'Stiff-Leg Deadlift', muscle: 'Hamstrings', secondary: ['Glutes', 'Lower Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Stiff-Legged_Barbell_Deadlift' },
    { id: 'ex-leg-curl', name: 'Seated Leg Curl', muscle: 'Hamstrings', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Seated_Leg_Curl' },
    { id: 'ex-lying-leg-curl', name: 'Lying Leg Curl', muscle: 'Hamstrings', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Lying_Leg_Curls' },

    // --- GLUTES ---
    { id: 'ex-hip-thrust', name: 'Barbell Hip Thrust', muscle: 'Glutes', secondary: ['Hamstrings'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Barbell_Hip_Thrust' },
    { id: 'ex-glute-bridge', name: 'Glute Bridge Machine', muscle: 'Glutes', secondary: ['Hamstrings'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Barbell_Glute_Bridge' },
    { id: 'ex-cable-kickback', name: 'Cable Glute Kickback', muscle: 'Glutes', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Glute_Kickback' },
    { id: 'ex-sumo-deadlift', name: 'Sumo Deadlift', muscle: 'Glutes', secondary: ['Quadriceps', 'Adductors', 'Lower Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Sumo_Deadlift' },

    // --- CALVES ---
    { id: 'ex-standing-calf', name: 'Standing Calf Raise', muscle: 'Calves', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Rocking_Standing_Calf_Raise' },
    { id: 'ex-seated-calf', name: 'Seated Calf Raise', muscle: 'Calves', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Seated_Calf_Raise' },
    { id: 'ex-legpress-calf', name: 'Leg Press Calf Raise', muscle: 'Calves', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Calf_Press_On_The_Leg_Press_Machine' },

    // --- ADDUCTORS & ABDUCTORS ---
    { id: 'ex-hip-adduction', name: 'Hip Adduction Machine', muscle: 'Adductors', secondary: [], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Thigh_Adductor' },
    { id: 'ex-hip-abduction', name: 'Hip Abduction Machine', muscle: 'Abductors', secondary: ['Glutes'], equipment: 'Machine', type: 'weight_reps' , freeDbId: 'Thigh_Abductor' },

    // --- ABDOMINALS ---
    { id: 'ex-cable-crunch', name: 'Cable Crunch', muscle: 'Abdominals', secondary: [], equipment: 'Cable', type: 'weight_reps' , freeDbId: 'Cable_Crunch' },
    { id: 'ex-hanging-leg-raise', name: 'Hanging Leg Raise', muscle: 'Abdominals', secondary: [], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Hanging_Leg_Raise' },
    { id: 'ex-ab-wheel', name: 'Ab Wheel Rollout', muscle: 'Abdominals', secondary: [], equipment: 'Other', type: 'reps_only' , freeDbId: 'Ab_Roller' },
    { id: 'ex-crunch', name: 'Bodyweight Crunch', muscle: 'Abdominals', secondary: [], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Crunches' },
    { id: 'ex-plank', name: 'Plank', muscle: 'Abdominals', secondary: [], equipment: 'Bodyweight', type: 'duration' , freeDbId: 'Plank' },
    { id: 'ex-russian-twist', name: 'Weighted Russian Twist', muscle: 'Abdominals', secondary: [], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Russian_Twist' },

    // --- CARDIO & FULL BODY ---
    { id: 'ex-treadmill', name: 'Treadmill Run', muscle: 'Cardio', secondary: [], equipment: 'Cardio Machine', type: 'distance_duration' , freeDbId: 'Running_Treadmill' },
    { id: 'ex-incline-walk', name: 'Incline Treadmill Walk', muscle: 'Cardio', secondary: ['Calves', 'Glutes'], equipment: 'Cardio Machine', type: 'distance_duration' , freeDbId: 'Walking_Treadmill' },
    { id: 'ex-stationary-bike', name: 'Stationary Bike', muscle: 'Cardio', secondary: ['Quadriceps'], equipment: 'Cardio Machine', type: 'distance_duration' , freeDbId: 'Bicycling_Stationary' },
    { id: 'ex-rowing-mach', name: 'Rowing Machine', muscle: 'Cardio', secondary: ['Upper Back', 'Quadriceps'], equipment: 'Cardio Machine', type: 'distance_duration' , freeDbId: 'Rowing_Stationary' },
    { id: 'ex-stairmaster', name: 'Stair Climber', muscle: 'Cardio', secondary: ['Quadriceps', 'Glutes'], equipment: 'Cardio Machine', type: 'duration' , freeDbId: 'Stairmaster' },
    { id: 'ex-jump-rope', name: 'Jump Rope', muscle: 'Cardio', secondary: ['Calves'], equipment: 'Other', type: 'duration' , freeDbId: 'Rope_Jumping' },
    { id: 'ex-kb-swing', name: 'Kettlebell Swing', muscle: 'Full Body', secondary: ['Hamstrings', 'Glutes', 'Lower Back'], equipment: 'Kettlebell', type: 'weight_reps' , freeDbId: 'One-Arm_Kettlebell_Swings' },
    { id: 'ex-trap-dl', name: 'Trap Bar Deadlift', muscle: 'Full Body', secondary: ['Quadriceps', 'Glutes', 'Lower Back'], equipment: 'Trap Bar', type: 'weight_reps' , freeDbId: 'Trap_Bar_Deadlift' },
    { id: 'ex-burpee', name: 'Burpee', muscle: 'Full Body', secondary: ['Chest', 'Quadriceps'], equipment: 'Bodyweight', type: 'reps_only' , freeDbId: 'Bodyweight_Squat' },
    { id: 'ex-clean-press', name: 'Barbell Clean & Press', muscle: 'Full Body', secondary: ['Shoulders', 'Quadriceps', 'Upper Back'], equipment: 'Barbell', type: 'weight_reps' , freeDbId: 'Clean_and_Press' },
    { id: 'ex-farmer-walk', name: 'Dumbbell Farmers Walk', muscle: 'Full Body', secondary: ['Forearms', 'Traps'], equipment: 'Dumbbell', type: 'weight_reps' , freeDbId: 'Farmers_Walk' }
  ];

  return { MUSCLE_GROUPS, EQUIPMENT_LIST, EXERCISE_TYPES, EXERCISES };
})();
