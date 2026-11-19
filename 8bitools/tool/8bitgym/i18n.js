window.IRONLOG_I18N = (() => {
  'use strict';

  const DICT = {
    id: {
      appTitle: '8BitGym',
      brandTagline: 'Minimalist Tracker',
      themeTooltip: 'Ganti Tema (Gelap / Terang)',
      lblTheme: 'Tampilan (Tema)',
      optThemeDark: 'Mode Gelap (Dark)',
      optThemeLight: 'Mode Terang (Light)',
      summaryTitle: 'Ringkasan',
      activityRingsTitle: 'Activity Rings',
      ringMoveLabel: 'Volume',
      ringExLabel: 'Durasi',
      ringStandLabel: 'Set',
      heroLastSession: 'Terakhir: {name} • {date}',
      heroNoSession: 'Belum ada sesi tercatat',
      heroStreak: '{n} minggu streak',
      kpiWorkouts: 'Workout',
      kpiWorkoutsSub: '+{n} minggu ini',
      kpiTotalVol: 'Total Volume',
      kpiTotalVolSub: '{vol} minggu ini',
      kpiPrs: 'PR Tercapai',
      kpiPrsSubEmpty: 'Belum ada PR',
      kpiAvgDur: 'Rata-rata Durasi',
      kpiAvgDurSub: '{sets} total set',
      weeklyVolTitle: 'Volume Mingguan',
      weeklyVolTotal: '{vol} total',
      muscleFocusTitle: 'Distribusi Otot',
      muscleFocusEmpty: 'Catat workout untuk melihat diagram otot.',
      trendUp: 'Naik vs mgg lalu',
      trendDown: 'Turun vs mgg lalu',
      trendSteady: 'Minggu ini',
      dowShortList: 'S,S,R,K,J,S,M',
      exMovementsBadge: '{count} gerakan',
      chipAll: 'Semua',
      btn3dView: '3D',
      headerSubEmpty: '{exCount} latihan siap pakai',
      headerSubCount: '{wkCount} workout • {exCount} latihan',
      syncTooltip: 'Sinkronisasi Akun Google',
      syncGoogleSync: 'Google Sync',
      syncSynced: 'Tersinkron',
      syncNeedLogin: 'Perlu Login',
      syncSaving: 'Menyimpan...',
      syncPulling: 'Mengambil...',
      syncConnecting: 'Menghubungkan...',
      syncFailed: 'Gagal Sync',
      installBtn: 'Install',
      settingsAria: 'Pengaturan & Backup',
      heroTitle: 'Mulai Latihan',
      heroDesc: 'Catat set, beban, reps, dan RPE secara real-time.',
      startEmptyBtn: 'Mulai Workout',
      routinesHeading: 'Routines / Template',
      newFolderBtn: '+ Folder',
      newRoutineBtn: '+ Buat Routine',
      historyHeading: 'Riwayat Workout',
      allDatesBtn: 'Semua Tanggal',
      exercisesHeading: 'Daftar Latihan & Progress',
      customExBtn: '+ Custom',
      searchExPlaceholder: 'Cari latihan (mis. Bench Press)...',
      allMusclesOpt: 'Semua Otot ({count})',
      allEquipOpt: 'Semua Alat ({count})',
      bodyHeading: 'Body Measurements',
      addMeasBtn: '+ Catat Ukuran',
      minWorkoutTitle: 'Workout Aktif',
      resumeBtn: 'Buka',
      restLabel: 'Istirahat',
      skipBtn: 'Skip',
      navWorkout: 'Beranda',
      navHistory: 'Riwayat',
      navExercises: 'Latihan',
      navBody: 'Body',
      minimizeTitle: 'Perkecil',
      workoutNameAria: 'Nama workout',
      finishBtn: 'Selesai',
      addExToWkBtn: '+ Tambah Latihan',
      discardWkBtn: 'Batalkan Workout',
      newWorkoutDefault: 'Workout Baru',
      emptyRoutines: 'Belum ada routine. Buat template latihan agar mulai workout lebih cepat.',
      emptyFolder: 'Folder kosong',
      exCountLabel: '{count} latihan',
      emptyWord: 'Kosong',
      btnStart: 'Mulai',
      btnEdit: 'Edit',
      btnDup: 'Duplikat',
      btnDelete: 'Hapus',
      copySuffix: '(Salinan)',
      confirmDelFolder: 'Hapus folder ini? Routine di dalamnya tetap tersimpan di luar folder.',
      promptRenameFolder: 'Nama folder baru:',
      promptNewFolder: 'Nama folder routine baru (mis. Cutting / Bulking):',
      confirmDelRoutine: 'Hapus routine ini?',
      confirmReplaceActive: 'Masih ada workout aktif. Ganti dengan workout baru?',
      confirmReplaceRoutine: 'Masih ada workout aktif. Ganti dengan routine ini?',
      emptyActiveWk: 'Belum ada latihan. Tekan <strong>+ Tambah Latihan</strong> di bawah untuk mulai mencatat set.',
      pinnedNotePh: 'Pinned note (mis. bangku lubang 3, grip lebar)...',
      perHandVol: '• (×2 vol)',
      moveUpTitle: 'Naik',
      moveDownTitle: 'Turun',
      btnDemo: 'Demo',
      btnRest: 'Rest: {sec}d',
      btnSuperset: 'Superset',
      btnPlate: 'Plate',
      btnWarmup: '+ Warmup',
      thSet: 'Set',
      thPrev: 'Prev',
      thReps: 'Reps',
      thSec: 'Detik',
      thKm: 'km',
      thMin: 'Mnt',
      thRpe: 'RPE',
      btnAddSet: '+ Tambah Set',
      titleToggleSet: 'Tandai Selesai',
      titleDelSet: 'Hapus Set',
      setTypeNormal: 'Normal Set (klik untuk ubah)',
      setTypeWarmup: 'Warmup Set (klik untuk ubah)',
      setTypeDropset: 'Dropset (klik untuk ubah)',
      setTypeFailure: 'Failure Set (klik untuk ubah)',
      alertNeedOneSet: 'Catat minimal 1 set yang selesai sebelum menyimpan workout.',
      confirmDiscardWk: 'Batalkan workout ini? Semua set yang belum disimpan akan hilang.',
      unitSec: 'dtk',
      unitMin: 'mnt',
      statWorkouts: 'Workout',
      statSets: 'Total Set',
      statVol: 'Vol ({unit})',
      monthlyReportTitle: 'Laporan Bulanan ({month})',
      monthlyReportLine: '<strong>{count}</strong> workout • <strong>{sets}</strong> set • <strong>{vol} {unit}</strong> • <strong>{mins}</strong> menit total',
      weekStreakBadge: '{n} minggu streak',
      dowList: 'Sen,Sel,Rab,Kam,Jum,Sab,Min',
      muscleDistTitle: 'Distribusi Otot (Primary + 0.5× Secondary)',
      muscleDistEmptyTitle: 'Distribusi Otot',
      muscleDistEmptyDesc: 'Catat workout untuk melihat sebaran latihan per kelompok otot.',
      setsCountPct: '{val} ({pct}%)',
      historyEmptyDate: 'Tidak ada workout pada tanggal yang dipilih.',
      historyEmptyAll: 'Belum ada riwayat workout. Mulai latihan pertamamu!',
      btnDetail: 'Detail',
      confirmDelWorkout: 'Hapus riwayat workout ini?',
      deletedExercise: 'Latihan Dihapus',
      btnProgress: 'Progress',
      btnVisualTitle: 'Visual & Panduan',
      emptyExercises: 'Latihan tidak ditemukan.',
      showingLimit: 'Menampilkan 150 dari {total} latihan. Gunakan pencarian atau filter untuk hasil lebih spesifik.',
      btnClose: 'Tutup',
      btnCancel: 'Batal',
      btnSave: 'Simpan',
      secMusclesLabel: 'Otot Sekunder: {list}',
      exTypeLabel: 'Tipe: {label}',
      exNoData: 'Belum ada data latihan untuk gerakan ini.',
      best1RM: 'Best Est. 1RM',
      bestWeight: 'Best Weight',
      bestSetVol: 'Best Set Vol',
      metric1RM: 'Est. 1RM',
      metricWeight: 'Beban Maks',
      metricVolume: 'Volume Sesi',
      bodyTrendTitle: 'Tren Berat Badan',
      bodyEmptyChart: 'Catat ukuran tubuh pertama Anda untuk melihat grafik perkembangan.',
      bodyEmptyList: 'Belum ada catatan ukuran tubuh.',
      lblBW: 'BB',
      lblBF: 'BF',
      lblWaist: 'Pinggang',
      lblChest: 'Dada',
      lblArms: 'Lengan',
      lblThigh: 'Paha',
      modalMeasTitle: 'Catat Body Measurement',
      lblWeightUnit: 'Berat Badan ({unit})',
      phWeight: 'Mis. 70.5',
      lblBodyFat: 'Body Fat (%)',
      phOptional: 'Opsional',
      lblWaistCm: 'Pinggang (cm)',
      lblChestCm: 'Dada (cm)',
      lblArmsCm: 'Lengan (cm)',
      lblThighCm: 'Paha (cm)',
      btnSaveEntry: 'Simpan Catatan',
      alertNeedOneMeas: 'Isi minimal satu ukuran.',
      modalExRestTitle: 'Rest Timer: {name}',
      lblRestSec: 'Durasi Istirahat (detik)',
      modalPlateTitle: 'Plate Calculator',
      lblTargetWeight: 'Target ({unit})',
      lblBarWeight: 'Berat Bar ({unit})',
      plateLowMsg: 'Target beban ≤ berat barbel ({bar} {unit}). Tidak perlu plate tambahan.',
      platePerSide: 'Per sisi: <strong>{list} {unit}</strong>',
      plateStandardErr: 'Tidak ada kombinasi plate standar.',
      plateRem: ' (sisa {rem} {unit}/sisi)',
      modalWarmupTitle: 'Warmup Calculator',
      lblWarmupTarget: 'Working Weight Target ({unit})',
      btnInsertWarmup: 'Tambahkan Set Warmup',
      warmupStep: 'Warmup {n}',
      modalDemoHint: 'Drag: 360° • Zoom',
      cam34: '3/4',
      camSide: 'Samping',
      camFront: 'Depan',
      demoLoading3D: 'Memuat 3D View...',
      demo3DLabel: '3D View 1:1 ({pattern})',
      demo2DLabel: 'Animasi 2D 1:1 ({pattern})',
      demoPhotoLabel: 'Posisi {cur} / {total}',
      btnMode3D: '3D',
      btnMode2D: '2D',
      btnModePhoto: 'Foto',
      guideTitle: 'Panduan Gerakan',
      guideCustom: 'Gerakan custom.',
      modalPickerTitle: 'Pilih Latihan',
      phPickerSearch: 'Cari latihan...',
      btnPick: '+ Pilih',
      notFound: 'Tidak ditemukan',
      modalEditRoutine: 'Edit Routine',
      modalNewRoutine: 'Buat Routine Baru',
      lblRoutineName: 'Nama Routine',
      phRoutineName: 'Mis. Upper Body A',
      lblFolder: 'Folder',
      optNoFolder: 'Tanpa Folder',
      emptyRoutineEx: 'Belum ada latihan di routine ini.',
      btnRoutineAddEx: '+ Tambah Latihan ke Routine',
      btnSaveRoutine: 'Simpan Routine',
      alertRoutineName: 'Isi nama routine terlebih dahulu.',
      modalCustomExTitle: 'Tambah Latihan Custom',
      lblCustomExName: 'Nama Latihan',
      phCustomExName: 'Mis. Single-Leg Press',
      lblPrimaryMuscle: 'Otot Utama',
      lblEquipment: 'Alat (Equipment)',
      lblInputCategory: 'Kategori Input',
      lblSecondaryMuscles: 'Otot Sekunder (Opsional)',
      btnSaveEx: 'Simpan Latihan',
      alertExName: 'Nama latihan wajib diisi.',
      wkFinishedTitle: 'Workout Selesai!',
      prBanner: 'Personal Record Baru!',
      btnUpdateRoutine: 'Perbarui Template "{name}"',
      btnRoutineUpdated: 'Template Routine Diperbarui',
      modalSettingsTitle: 'Pengaturan & Akun Google',
      driveBoxTitle: 'Cloud Sync (Google + Firestore)',
      accLabel: 'Akun',
      accActive: 'Aktif',
      accRelogin: 'Perlu Login Ulang',
      accNone: 'Belum login ke akun Google.',
      lastSyncLabel: 'Sync terakhir: {time}',
      btnPushDrive: 'Simpan ke Cloud',
      btnPullDrive: 'Pulihkan dari Cloud',
      btnDisconnect: 'Keluar',
      btnLoginSave: 'Login Google & Simpan',
      btnLoginPull: 'Login Google & Pulihkan',
      confirmPullDrive: 'Timpa data lokal saat ini dengan data dari Cloud?',
      firebaseNotReadyHint: 'Isi <code>firebaseConfig</code> di <code>firebase-config.js</code> untuk mengaktifkan Login Google.',
      lblLanguage: 'Bahasa / Language',
      lblWeightUnitSetting: 'Satuan Beban',
      optKg: 'Kilogram (kg)',
      optLbs: 'Pounds (lbs)',
      lblDefaultRest: 'Default Rest Timer (detik)',
      lblDbPerHand: 'Mode Dumbbell Per Tangan (kalikan 2× pada total volume)',
      btnSaveSettings: 'Simpan Pengaturan',
      btnExportJson: 'Export JSON',
      btnImportJson: 'Import JSON',
      alertImportOk: 'Data berhasil di-import!',
      alertImportErr: 'Gagal import JSON: {msg}',
      alertInvalidJson: 'Format JSON tidak valid',
      alertDriveSaved: 'Progress berhasil disimpan ke Cloud!',
      alertDriveSaveErr: 'Gagal sync ke Cloud: {msg}',
      alertDriveEmpty: 'Belum ada data 8BitGym di Cloud untuk akun ini.',
      alertDrivePulled: 'Data berhasil dipulihkan dari Cloud!',
      alertDrivePullErr: 'Gagal mengambil data dari Cloud: {msg}',
      alertNeedClientId: 'firebaseConfig di firebase-config.js belum diisi.',
      alertGisNotReady: 'Firebase Cloud belum siap (periksa koneksi internet).',
      alertGoogleLoginErr: 'Login Google gagal: {err}',
      alertNotLoggedIn: 'Belum login ke akun Google',
      alertSessionExpired: 'Sesi Google berakhir. Silakan hubungkan ulang.'
    },
    en: {
      appTitle: '8BitGym',
      brandTagline: 'Minimalist Tracker',
      themeTooltip: 'Switch Theme (Dark / Light)',
      lblTheme: 'Appearance (Theme)',
      optThemeDark: 'Dark Mode',
      optThemeLight: 'Light Mode',
      summaryTitle: 'Summary',
      activityRingsTitle: 'Activity Rings',
      ringMoveLabel: 'Volume',
      ringExLabel: 'Exercise',
      ringStandLabel: 'Sets',
      heroLastSession: 'Last: {name} • {date}',
      heroNoSession: 'No sessions logged yet',
      heroStreak: '{n} wk streak',
      kpiWorkouts: 'Workouts',
      kpiWorkoutsSub: '+{n} this week',
      kpiTotalVol: 'Total Volume',
      kpiTotalVolSub: '{vol} this week',
      kpiPrs: 'PRs Set',
      kpiPrsSubEmpty: 'No PRs yet',
      kpiAvgDur: 'Avg Duration',
      kpiAvgDurSub: '{sets} total sets',
      weeklyVolTitle: 'Weekly Volume',
      weeklyVolTotal: '{vol} total',
      muscleFocusTitle: 'Muscle Focus',
      muscleFocusEmpty: 'Log workouts to view muscle breakdown.',
      trendUp: 'Up vs last wk',
      trendDown: 'Down vs last wk',
      trendSteady: 'This week',
      dowShortList: 'M,T,W,T,F,S,S',
      exMovementsBadge: '{count} movements',
      chipAll: 'All',
      btn3dView: '3D',
      headerSubEmpty: '{exCount} exercises ready',
      headerSubCount: '{wkCount} workouts • {exCount} exercises',
      syncTooltip: 'Google Account Sync',
      syncGoogleSync: 'Google Sync',
      syncSynced: 'Synced',
      syncNeedLogin: 'Sign In',
      syncSaving: 'Saving...',
      syncPulling: 'Fetching...',
      syncConnecting: 'Connecting...',
      syncFailed: 'Sync Error',
      installBtn: 'Install',
      settingsAria: 'Settings & Backup',
      heroTitle: 'Quick Start',
      heroDesc: 'Log sets, weight, reps, and RPE in real time.',
      startEmptyBtn: 'Start Workout',
      routinesHeading: 'Routines / Templates',
      newFolderBtn: '+ Folder',
      newRoutineBtn: '+ New Routine',
      historyHeading: 'Workout History',
      allDatesBtn: 'All Dates',
      exercisesHeading: 'Exercises & Progress',
      customExBtn: '+ Custom',
      searchExPlaceholder: 'Search exercise (e.g. Bench Press)...',
      allMusclesOpt: 'All Muscles ({count})',
      allEquipOpt: 'All Equipment ({count})',
      bodyHeading: 'Body Measurements',
      addMeasBtn: '+ Log Measurement',
      minWorkoutTitle: 'Active Workout',
      resumeBtn: 'Open',
      restLabel: 'Rest',
      skipBtn: 'Skip',
      navWorkout: 'Home',
      navHistory: 'History',
      navExercises: 'Exercises',
      navBody: 'Body',
      minimizeTitle: 'Minimize',
      workoutNameAria: 'Workout name',
      finishBtn: 'Finish',
      addExToWkBtn: '+ Add Exercise',
      discardWkBtn: 'Discard Workout',
      newWorkoutDefault: 'New Workout',
      emptyRoutines: 'No routines yet. Create a workout template to start faster.',
      emptyFolder: 'Empty folder',
      exCountLabel: '{count} exercises',
      emptyWord: 'Empty',
      btnStart: 'Start',
      btnEdit: 'Edit',
      btnDup: 'Duplicate',
      btnDelete: 'Delete',
      copySuffix: '(Copy)',
      confirmDelFolder: 'Delete this folder? Routines inside will be kept outside folders.',
      promptRenameFolder: 'New folder name:',
      promptNewFolder: 'New routine folder name (e.g. Cutting / Bulking):',
      confirmDelRoutine: 'Delete this routine?',
      confirmReplaceActive: 'An active workout is in progress. Replace it with a new workout?',
      confirmReplaceRoutine: 'An active workout is in progress. Replace it with this routine?',
      emptyActiveWk: 'No exercises yet. Tap <strong>+ Add Exercise</strong> below to start logging sets.',
      pinnedNotePh: 'Pinned note (e.g. seat pin 3, wide grip)...',
      perHandVol: '• (×2 vol)',
      moveUpTitle: 'Move Up',
      moveDownTitle: 'Move Down',
      btnDemo: 'Demo',
      btnRest: 'Rest: {sec}s',
      btnSuperset: 'Superset',
      btnPlate: 'Plate',
      btnWarmup: '+ Warmup',
      thSet: 'Set',
      thPrev: 'Prev',
      thReps: 'Reps',
      thSec: 'Sec',
      thKm: 'km',
      thMin: 'Min',
      thRpe: 'RPE',
      btnAddSet: '+ Add Set',
      titleToggleSet: 'Mark Completed',
      titleDelSet: 'Remove Set',
      setTypeNormal: 'Normal Set (tap to change)',
      setTypeWarmup: 'Warmup Set (tap to change)',
      setTypeDropset: 'Dropset (tap to change)',
      setTypeFailure: 'Failure Set (tap to change)',
      alertNeedOneSet: 'Log at least 1 completed set before saving the workout.',
      confirmDiscardWk: 'Discard this workout? Unsaved sets will be lost.',
      unitSec: 's',
      unitMin: 'm',
      statWorkouts: 'Workouts',
      statSets: 'Total Sets',
      statVol: 'Vol ({unit})',
      monthlyReportTitle: 'Monthly Report ({month})',
      monthlyReportLine: '<strong>{count}</strong> workouts • <strong>{sets}</strong> sets • <strong>{vol} {unit}</strong> • <strong>{mins}</strong> min total',
      weekStreakBadge: '{n}-week streak',
      dowList: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      muscleDistTitle: 'Muscle Distribution (Primary + 0.5× Secondary)',
      muscleDistEmptyTitle: 'Muscle Distribution',
      muscleDistEmptyDesc: 'Log a workout to see set distribution across muscle groups.',
      setsCountPct: '{val} ({pct}%)',
      historyEmptyDate: 'No workouts logged on the selected date.',
      historyEmptyAll: 'No workout history yet. Start your first session!',
      btnDetail: 'Details',
      confirmDelWorkout: 'Delete this workout from history?',
      deletedExercise: 'Deleted Exercise',
      btnProgress: 'Progress',
      btnVisualTitle: 'Visual & Guide',
      emptyExercises: 'No exercises found.',
      showingLimit: 'Showing 150 of {total} exercises. Use search or filters to narrow down.',
      btnClose: 'Close',
      btnCancel: 'Cancel',
      btnSave: 'Save',
      secMusclesLabel: 'Secondary Muscles: {list}',
      exTypeLabel: 'Type: {label}',
      exNoData: 'No workout data logged for this exercise yet.',
      best1RM: 'Best Est. 1RM',
      bestWeight: 'Best Weight',
      bestSetVol: 'Best Set Vol',
      metric1RM: 'Est. 1RM',
      metricWeight: 'Max Weight',
      metricVolume: 'Session Volume',
      bodyTrendTitle: 'Body Weight Trend',
      bodyEmptyChart: 'Log your first body measurement to view your weight trend chart.',
      bodyEmptyList: 'No body measurements recorded yet.',
      lblBW: 'BW',
      lblBF: 'BF',
      lblWaist: 'Waist',
      lblChest: 'Chest',
      lblArms: 'Arms',
      lblThigh: 'Thigh',
      modalMeasTitle: 'Log Body Measurement',
      lblWeightUnit: 'Body Weight ({unit})',
      phWeight: 'e.g. 70.5',
      lblBodyFat: 'Body Fat (%)',
      phOptional: 'Optional',
      lblWaistCm: 'Waist (cm)',
      lblChestCm: 'Chest (cm)',
      lblArmsCm: 'Arms (cm)',
      lblThighCm: 'Thigh (cm)',
      btnSaveEntry: 'Save Measurement',
      alertNeedOneMeas: 'Enter at least one measurement.',
      modalExRestTitle: 'Rest Timer: {name}',
      lblRestSec: 'Rest Duration (seconds)',
      modalPlateTitle: 'Plate Calculator',
      lblTargetWeight: 'Target ({unit})',
      lblBarWeight: 'Bar Weight ({unit})',
      plateLowMsg: 'Target weight ≤ bar weight ({bar} {unit}). No extra plates needed.',
      platePerSide: 'Per side: <strong>{list} {unit}</strong>',
      plateStandardErr: 'No standard plate combination.',
      plateRem: ' ({rem} {unit} remainder/side)',
      modalWarmupTitle: 'Warmup Calculator',
      lblWarmupTarget: 'Target Working Weight ({unit})',
      btnInsertWarmup: 'Add Warmup Sets',
      warmupStep: 'Warmup {n}',
      modalDemoHint: 'Drag: 360° • Zoom',
      cam34: '3/4',
      camSide: 'Side',
      camFront: 'Front',
      demoLoading3D: 'Loading 3D View...',
      demo3DLabel: '3D View 1:1 ({pattern})',
      demo2DLabel: '2D Animation 1:1 ({pattern})',
      demoPhotoLabel: 'Position {cur} / {total}',
      btnMode3D: '3D',
      btnMode2D: '2D',
      btnModePhoto: 'Photo',
      guideTitle: 'Exercise Instructions',
      guideCustom: 'Custom exercise.',
      modalPickerTitle: 'Select Exercise',
      phPickerSearch: 'Search exercise...',
      btnPick: '+ Select',
      notFound: 'Not found',
      modalEditRoutine: 'Edit Routine',
      modalNewRoutine: 'Create New Routine',
      lblRoutineName: 'Routine Name',
      phRoutineName: 'e.g. Upper Body A',
      lblFolder: 'Folder',
      optNoFolder: 'No Folder',
      emptyRoutineEx: 'No exercises in this routine yet.',
      btnRoutineAddEx: '+ Add Exercise to Routine',
      btnSaveRoutine: 'Save Routine',
      alertRoutineName: 'Please enter a routine name first.',
      modalCustomExTitle: 'Add Custom Exercise',
      lblCustomExName: 'Exercise Name',
      phCustomExName: 'e.g. Single-Leg Press',
      lblPrimaryMuscle: 'Primary Muscle',
      lblEquipment: 'Equipment',
      lblInputCategory: 'Input Category',
      lblSecondaryMuscles: 'Secondary Muscles (Optional)',
      btnSaveEx: 'Save Exercise',
      alertExName: 'Exercise name is required.',
      wkFinishedTitle: 'Workout Completed!',
      prBanner: 'New Personal Record!',
      btnUpdateRoutine: 'Update Template "{name}"',
      btnRoutineUpdated: 'Routine Template Updated',
      modalSettingsTitle: 'Settings & Google Sync',
      driveBoxTitle: 'Cloud Sync (Google + Firestore)',
      accLabel: 'Account',
      accActive: 'Active',
      accRelogin: 'Re-login Needed',
      accNone: 'Not signed in with Google.',
      lastSyncLabel: 'Last synced: {time}',
      btnPushDrive: 'Save to Cloud',
      btnPullDrive: 'Restore from Cloud',
      btnDisconnect: 'Sign Out',
      btnLoginSave: 'Sign in with Google & Save',
      btnLoginPull: 'Sign in with Google & Restore',
      confirmPullDrive: 'Overwrite local data with data from Cloud?',
      firebaseNotReadyHint: 'Fill <code>firebaseConfig</code> in <code>firebase-config.js</code> to enable Google Sign-In.',
      lblLanguage: 'Language / Bahasa',
      lblWeightUnitSetting: 'Weight Unit',
      optKg: 'Kilograms (kg)',
      optLbs: 'Pounds (lbs)',
      lblDefaultRest: 'Default Rest Timer (seconds)',
      lblDbPerHand: 'Dumbbell Per-Hand Mode (multiply total volume by 2×)',
      btnSaveSettings: 'Save Settings',
      btnExportJson: 'Export JSON',
      btnImportJson: 'Import JSON',
      alertImportOk: 'Data imported successfully!',
      alertImportErr: 'Failed to import JSON: {msg}',
      alertInvalidJson: 'Invalid JSON format',
      alertDriveSaved: 'Progress saved to Cloud!',
      alertDriveSaveErr: 'Failed to sync to Cloud: {msg}',
      alertDriveEmpty: 'No 8BitGym backup found in Cloud for this account yet.',
      alertDrivePulled: 'Data restored from Cloud!',
      alertDrivePullErr: 'Failed to fetch data from Cloud: {msg}',
      alertNeedClientId: 'firebaseConfig in firebase-config.js is not configured yet.',
      alertGisNotReady: 'Firebase Cloud is not ready yet (check internet connection).',
      alertGoogleLoginErr: 'Google sign-in failed: {err}',
      alertNotLoggedIn: 'Not signed in to a Google account',
      alertSessionExpired: 'Google session expired. Please reconnect.'
    }
  };

  const MUSCLE_MAP = {
    Chest: { id: 'Dada (Chest)', en: 'Chest' },
    Lats: { id: 'Sayap (Lats)', en: 'Lats' },
    'Upper Back': { id: 'Punggung Atas', en: 'Upper Back' },
    'Lower Back': { id: 'Punggung Bawah', en: 'Lower Back' },
    Traps: { id: 'Trapezius', en: 'Traps' },
    Shoulders: { id: 'Bahu', en: 'Shoulders' },
    Biceps: { id: 'Bisep', en: 'Biceps' },
    Triceps: { id: 'Trisep', en: 'Triceps' },
    Forearms: { id: 'Lengan Bawah', en: 'Forearms' },
    Quadriceps: { id: 'Paha Depan (Quads)', en: 'Quadriceps' },
    Hamstrings: { id: 'Paha Belakang', en: 'Hamstrings' },
    Glutes: { id: 'Bokong (Glutes)', en: 'Glutes' },
    Calves: { id: 'Betis', en: 'Calves' },
    Adductors: { id: 'Paha Dalam', en: 'Adductors' },
    Abductors: { id: 'Paha Luar', en: 'Abductors' },
    Abdominals: { id: 'Perut (Abs)', en: 'Abdominals' },
    Cardio: { id: 'Kardio', en: 'Cardio' },
    'Full Body': { id: 'Seluruh Tubuh', en: 'Full Body' },
    Other: { id: 'Lainnya', en: 'Other' }
  };

  const EQUIP_MAP = {
    Barbell: { id: 'Barbel', en: 'Barbell' },
    Dumbbell: { id: 'Dumbbell', en: 'Dumbbell' },
    Cable: { id: 'Kabel', en: 'Cable' },
    Machine: { id: 'Mesin', en: 'Machine' },
    'Smith Machine': { id: 'Mesin Smith', en: 'Smith Machine' },
    'EZ Bar': { id: 'EZ Bar', en: 'EZ Bar' },
    Kettlebell: { id: 'Kettlebell', en: 'Kettlebell' },
    'Trap Bar': { id: 'Trap Bar', en: 'Trap Bar' },
    Bodyweight: { id: 'Berat Badan', en: 'Bodyweight' },
    'Resistance Band': { id: 'Resistance Band', en: 'Resistance Band' },
    'Cardio Machine': { id: 'Mesin Kardio', en: 'Cardio Machine' },
    Other: { id: 'Lainnya', en: 'Other' }
  };

  const TYPE_MAP = {
    weight_reps: { id: 'Beban & Reps (kg × reps)', en: 'Weight & Reps (kg/lbs × reps)' },
    weighted_bodyweight: { id: 'Weighted Bodyweight (+kg × reps)', en: 'Weighted Bodyweight (+weight × reps)' },
    assisted_bodyweight: { id: 'Assisted Bodyweight (-kg × reps)', en: 'Assisted Bodyweight (-weight × reps)' },
    reps_only: { id: 'Bodyweight (Reps saja)', en: 'Bodyweight (Reps only)' },
    duration: { id: 'Durasi (Detik)', en: 'Duration (Seconds)' },
    distance_duration: { id: 'Jarak & Durasi (km & menit)', en: 'Distance & Duration (km & min)' }
  };

  const LEVEL_MAP = {
    beginner: { id: 'Pemula', en: 'Beginner' },
    intermediate: { id: 'Menengah', en: 'Intermediate' },
    expert: { id: 'Mahir', en: 'Expert' }
  };

  const MECH_MAP = {
    compound: { id: 'Compound (Majemuk)', en: 'Compound' },
    isolation: { id: 'Isolasi', en: 'Isolation' }
  };

  const GUIDE_STEPS = {
    id: {
      press_flat: [
        'Berbaring telentang di bangku datar, telapak kaki menapak kuat di lantai, dan rapatkan belikat.',
        'Pegang beban tepat di atas dada dengan siku membentuk sudut ~45° dari badan.',
        'Turunkan beban secara terkontrol hingga mendekati dada bagian tengah tanpa memantulkannya.',
        'Dorong kembali ke atas hingga lengan hampir lurus sambil menjaga kontrol napas.'
      ],
      press_incline: [
        'Atur sandaran bangku miring ~30–45° dan posisikan punggung serta bahu menempel stabil.',
        'Angkat beban di atas dada bagian atas dengan pergelangan tangan lurus.',
        'Turunkan beban perlahan ke arah dada atas sambil membuka siku ~45°.',
        'Dorong beban naik kembali secara eksplosif namun tetap terkendali.'
      ],
      press_decline: [
        'Kaitkan kaki pada bantalan bangku decline dan berbaring dengan bahu stabil.',
        'Pegang barbel selebar bahu di atas dada bagian bawah.',
        'Turunkan barbel perlahan ke garis dada bawah sambil menjaga siku terkontrol.',
        'Dorong kembali ke posisi awal tanpa mengunci siku secara kasar.'
      ],
      fly_chest: [
        'Posisikan bahu ditarik ke belakang dan tekuk siku sedikit secara konstan.',
        'Buka lengan lebar hingga terasa regangan lembut pada otot dada.',
        'Rapikan/satukan kedua tangan di depan dada seolah memeluk pohon besar.',
        'Tahan puncak kontraksi 1 detik lalu kembali ke posisi terbuka perlahan.'
      ],
      chest_mach: [
        'Sesuaikan tinggi kursi agar pegangan sejajar dengan garis dada tengah.',
        'Sandarkan punggung rapat dan dorong pegangan ke depan hingga lengan hampir lurus.',
        'Kembali perlahan ke posisi awal tanpa membiarkan tumpukan beban membentur.'
      ],
      pushup: [
        'Posisikan telapak tangan sedikit lebih lebar dari bahu dan tubuh membentuk garis lurus.',
        'Kencangkan otot perut dan bokong, lalu turunkan dada mendekati lantai.',
        'Dorong lantai menjauh hingga lengan lurus kembali tanpa menjatuhkan pinggul.'
      ],
      dip: [
        'Pegang palang sejajar dengan lengan lurus dan bahu ditekan turun menjauhi telinga.',
        'Condongkan badan sedikit ke depan (untuk dada) atau tegak (untuk trisep), lalu tekuk siku turun perlahan.',
        'Dorong tubuh naik kembali hingga lengan lurus.'
      ],
      ohp: [
        'Posisikan beban di depan bahu atas dengan otot perut dan bokong dikencangkan.',
        'Dorong beban lurus ke atas kepala hingga lengan sejajar telinga tanpa melengkungkan punggung bawah.',
        'Turunkan beban kembali ke bahu secara terkendali.'
      ],
      raise_delt: [
        'Berdiri tegak (atau condong untuk rear delt) dengan siku sedikit ditekuk.',
        'Angkat beban ke samping/depan hingga sejajar tinggi bahu tanpa mengayunkan pinggang.',
        'Turunkan kembali perlahan dan rasakan ketegangan pada otot bahu.'
      ],
      squat: [
        'Berdiri dengan kaki selebar bahu dan jari kaki sedikit mengarah keluar.',
        'Tarik napas, kunci otot perut, lalu dorong pinggul ke belakang sambil menekuk lutut turun.',
        'Turun hingga paha minimal sejajar lantai dengan punggung tetap netral.',
        'Dorong lantai kuat melalui tengah telapak kaki untuk berdiri tegak kembali.'
      ],
      lunge: [
        'Ambil posisi melangkah depan-belakang dengan tubuh tetap tegak.',
        'Turunkan lutut belakang mendekati lantai hingga kedua lutut membentuk sudut ~90°.',
        'Dorong melalui tumit kaki depan untuk naik kembali.'
      ],
      leg_press: [
        'Duduk rapat dengan punggung bawah dan pinggul menempel penuh di sandaran mesin.',
        'Letakkan kaki selebar bahu di pijakan, buka kunci pengaman, dan tekuk lutut mendekati dada.',
        'Dorong pijakan ke atas tanpa mengunci lutut secara penuh.'
      ],
      deadlift: [
        'Berdiri dengan bagian tengah kaki tepat di bawah barbel, pegang bar selebar luar kaki.',
        'Turunkan pinggul, angkat dada agar punggung lurus, dan tarik kendur barbel.',
        'Dorong lantai menjauh dan luruskan pinggul serta lutut bersamaan hingga berdiri tegak.',
        'Turunkan kembali dengan mendorong pinggul ke belakang sebelum menekuk lutut.'
      ],
      back_ext: [
        'Atur bantalan tepat di bawah lipatan pinggul dengan punggung tetap lurus.',
        'Turunkan tubuh bagian atas secara terkontrol dengan engsel di pinggul.',
        'Kencangkan otot bokong dan punggung bawah untuk naik kembali sejajar garis tubuh.'
      ],
      pullup: [
        'Genggam palang lebih lebar dari bahu dengan posisi menggantung penuh.',
        'Tarik belikat turun lalu tarik tubuh ke atas hingga dagu melewati palang.',
        'Turunkan badan perlahan hingga lengan kembali lurus sempurna.'
      ],
      pulldown: [
        'Duduk stabil di bawah bantalan paha dengan genggaman lebar pada palang kabel.',
        'Tarik palang ke arah dada atas sambil mengarahkan siku ke bawah dan belakang.',
        'Kembalikan palang ke atas secara terkendali hingga sayap punggung terasa teregang.'
      ],
      row: [
        'Jaga punggung netral dengan dada tegap dan bahu tidak membungkuk.',
        'Tarik beban ke arah perut/pinggang dengan menggerakkan siku ke belakang.',
        'Remas belikat di puncak gerakan, lalu lepaskan perlahan ke posisi awal.'
      ],
      shrug: [
        'Berdiri tegak memegang beban di sisi tubuh atau depan paha dengan lengan lurus.',
        'Angkat kedua bahu lurus ke arah telinga tanpa menekuk siku.',
        'Tahan 1 detik di puncak lalu turunkan bahu perlahan.'
      ],
      curl: [
        'Kunci posisi siku tetap di sisi tubuh (atau di bantalan preacher) dan hindari ayunan badan.',
        'Tekuk siku untuk mengangkat beban ke arah bahu sambil meremas otot bisep.',
        'Turunkan beban perlahan sampai lengan hampir lurus penuh.'
      ],
      tricep: [
        'Jaga posisi lengan atas tetap stabil di samping tubuh atau di atas kepala.',
        'Ekstensikan/luruskan siku hingga otot trisep berkontraksi penuh.',
        'Kembalikan ke posisi tertekuk secara terkendali tanpa menggerakkan bahu.'
      ],
      leg_iso: [
        'Atur sandaran dan posisi engsel mesin agar sejajar dengan sendi lutut.',
        'Gerakkan bantalan beban secara halus melalui rentang gerak penuh tanpa menghentak.',
        'Tahan kontraksi sejenak di puncak lalu kembali perlahan.'
      ],
      calf: [
        'Posisikan bola telapak kaki di ujung pijakan dan turunkan tumit hingga betis teregang.',
        'Dorong tumit naik setinggi mungkin, tahan 1 detik, lalu turunkan perlahan.'
      ],
      hip_thrust: [
        'Sandarkan bagian bawah belikat di tepi bangku dengan telapak kaki menapak rata di lantai.',
        'Dorong pinggul ke atas sambil mengencangkan bokong hingga tubuh sejajar horizontal.',
        'Turunkan pinggul perlahan sambil menjaga dagu sedikit menunduk.'
      ],
      kickback: [
        'Pegang tiang kabel untuk stabilitas dan condongkan badan sedikit ke depan.',
        'Dorong satu kaki ke belakang dengan lutut hampir lurus sambil meremas bokong.',
        'Kembali ke posisi awal secara terkontrol.'
      ],
      core_flex: [
        'Kencangkan otot perut dan hindari menarik leher dengan tangan.',
        'Lipat/tekuk tulang belakang atau angkat kaki menggunakan kontraksi perut, bukan momentum.',
        'Kembali ke posisi awal perlahan sambil menjaga ketegangan di otot inti.'
      ],
      plank: [
        'Bertumpu pada lengan bawah dan ujung jari kaki dengan tubuh lurus dari kepala hingga tumit.',
        'Kencangkan otot perut, bokong, dan paha agar pinggul tidak turun atau naik terlalu tinggi.',
        'Tahan posisi dengan napas teratur sesuai durasi target.'
      ],
      cardio: [
        'Atur kecepatan/resistensi awal dengan postur tubuh tegak dan bahu rileks.',
        'Pertahankan ritme gerakan yang stabil dan napas teratur sepanjang sesi.',
        'Turunkan intensitas perlahan di akhir sesi untuk pendinginan.'
      ],
      kb_swing: [
        'Berdiri selebar bahu, tekuk pinggul ke belakang dengan punggung lurus.',
        'Ledakkan pinggul ke depan untuk mengayunkan kettlebell setinggi dada (bukan mengangkat dengan bahu).',
        'Biarkan beban berayun turun kembali di antara kedua kaki mengikuti engsel pinggul.'
      ]
    },
    en: {
      press_flat: [
        'Lie flat on the bench with feet planted firmly and shoulder blades pinched together.',
        'Hold the weight directly above your chest with elbows tucked at roughly 45°.',
        'Lower the weight with control to your mid-chest without bouncing.',
        'Press back up to lockout while maintaining steady breathing and core tension.'
      ],
      press_incline: [
        'Set the bench to a 30–45° incline and keep your upper back pressed firmly against the pad.',
        'Hold the weight over your upper chest with neutral wrists.',
        'Lower slowly toward your upper chest with elbows angled at ~45°.',
        'Drive the weight back up cleanly to the starting position.'
      ],
      press_decline: [
        'Secure your legs under the decline roller pads and lie back with pinched shoulder blades.',
        'Unrack or position the barbell above your lower chest.',
        'Lower smoothly to your lower chest line, then press back up with control.'
      ],
      fly_chest: [
        'Keep your shoulders retracted and maintain a slight, fixed bend in your elbows.',
        'Open your arms wide until you feel a comfortable stretch across your chest.',
        'Bring your hands together in a wide hugging arc over your chest and squeeze for 1 second.'
      ],
      chest_mach: [
        'Adjust the seat so the handles align with your mid-chest.',
        'Press forward smoothly until arms are nearly extended without locking out harshly.',
        'Return slowly without letting the weight stack slam.'
      ],
      pushup: [
        'Place hands slightly wider than shoulder-width with your body forming a straight line.',
        'Brace your core and lower your chest toward the floor with elbows at ~45°.',
        'Push the floor away until your arms return to full extension.'
      ],
      dip: [
        'Support yourself on parallel bars with straight arms and shoulders pressed down.',
        'Lean slightly forward (chest) or stay upright (triceps) and bend elbows under control.',
        'Press back up cleanly to the top position.'
      ],
      ohp: [
        'Hold the weight at upper-chest/shoulder height while bracing your abs and glutes.',
        'Press straight overhead until arms align beside your ears without over-arching your lower back.',
        'Lower smoothly back to shoulder level.'
      ],
      raise_delt: [
        'Stand tall (or hinged forward for rear delts) with a slight bend in your elbows.',
        'Raise the weight out to shoulder height without swinging your torso.',
        'Lower slowly under tension.'
      ],
      squat: [
        'Stand with feet roughly shoulder-width apart and toes slightly turned out.',
        'Brace your core, push your hips back, and bend your knees to descend.',
        'Reach at least parallel thigh depth while keeping a neutral spine.',
        'Drive firmly through mid-foot to stand tall again.'
      ],
      lunge: [
        'Take a controlled split stance with an upright torso.',
        'Lower your back knee toward the floor until both knees bend near 90°.',
        'Drive through your front heel to return to standing.'
      ],
      leg_press: [
        'Sit with your lower back and hips pressed flat against the pad.',
        'Place feet shoulder-width on the sled, release safeties, and bend knees toward chest.',
        'Press the sled up without locking your knees completely.'
      ],
      deadlift: [
        'Stand with mid-foot under the bar and grip just outside your shins.',
        'Drop your hips slightly, lift your chest to flatten your back, and take slack out of the bar.',
        'Push the floor away and extend hips and knees together to stand tall.',
        'Hinge hips back first as you lower the bar under control.'
      ],
      back_ext: [
        'Adjust the pad just below your hip crease while keeping a neutral spine.',
        'Hinge forward smoothly at the hips under control.',
        'Squeeze glutes and lower back to raise your torso back in line with your legs.'
      ],
      pullup: [
        'Grip the bar wider than shoulder-width from a dead hang.',
        'Depress shoulder blades and pull your chest toward the bar until chin clears it.',
        'Lower slowly back to a full stretch.'
      ],
      pulldown: [
        'Secure thighs under the pad and take a wide grip on the bar.',
        'Pull the bar down to your upper chest by driving elbows downward.',
        'Return smoothly overhead for a full lat stretch.'
      ],
      row: [
        'Maintain a neutral spine with chest proud and shoulders down.',
        'Pull the weight toward your lower ribs/waist by driving elbows back.',
        'Squeeze shoulder blades at the top, then lower with control.'
      ],
      shrug: [
        'Stand tall holding weights at your sides or front with straight arms.',
        'Elevate shoulders straight up toward your ears without bending elbows.',
        'Pause briefly at the top, then lower slowly.'
      ],
      curl: [
        'Keep elbows pinned at your sides (or on the preacher pad) and avoid body swing.',
        'Flex at the elbows to curl the weight up and squeeze your biceps.',
        'Lower under control to near full extension.'
      ],
      tricep: [
        'Keep upper arms steady at your sides or overhead.',
        'Extend your elbows completely to contract the triceps.',
        'Return smoothly to the flexed start position without flaring shoulders.'
      ],
      leg_iso: [
        'Align the machine pivot with your knee joint.',
        'Move smoothly through the full range of motion without jerking.',
        'Pause briefly at peak contraction, then return slowly.'
      ],
      calf: [
        'Place the balls of your feet on the block and lower heels for a deep calf stretch.',
        'Press up onto your toes as high as possible, pause 1 second, then lower slowly.'
      ],
      hip_thrust: [
        'Rest your lower shoulder blades against the bench with feet planted flat.',
        'Drive through your heels and squeeze glutes until hips align horizontally.',
        'Lower hips smoothly while keeping your chin tucked.'
      ],
      kickback: [
        'Hold the cable frame for balance and lean slightly forward.',
        'Extend one leg straight back using your glutes.',
        'Return slowly to the starting position.'
      ],
      core_flex: [
        'Brace your abs and avoid pulling on your neck.',
        'Curl your spine or raise your legs through controlled abdominal contraction.',
        'Lower back down slowly while keeping core tension.'
      ],
      plank: [
        'Support yourself on forearms and toes with a straight body line from head to heels.',
        'Brace abs and glutes so hips neither sag nor pike up.',
        'Hold steadily with even breathing for the target duration.'
      ],
      cardio: [
        'Start at a comfortable pace/resistance with tall posture and relaxed shoulders.',
        'Maintain a steady rhythm and controlled breathing throughout.',
        'Gradually reduce intensity at the end to cool down.'
      ],
      kb_swing: [
        'Stand shoulder-width apart and hinge hips back with a flat back.',
        'Snap hips forward powerfully to float the kettlebell to chest height.',
        'Let the bell swing back between your thighs as you hinge again.'
      ]
    }
  };

  function patternToGuideKey(pattern) {
    if (pattern === 'bench_bb' || pattern === 'bench_db') return 'press_flat';
    if (pattern === 'incline_bb' || pattern === 'incline_db') return 'press_incline';
    if (pattern === 'decline_bb') return 'press_decline';
    if (pattern === 'fly_db' || pattern === 'cable_fly' || pattern === 'pec_deck') return 'fly_chest';
    if (pattern === 'chest_press_mach') return 'chest_mach';
    if (pattern === 'pushup') return 'pushup';
    if (pattern === 'dip') return 'dip';
    if (pattern === 'ohp_bb' || pattern === 'ohp_seated') return 'ohp';
    if (pattern === 'lateral_raise' || pattern === 'front_raise' || pattern === 'rear_delt' || pattern === 'upright_row') return 'raise_delt';
    if (pattern === 'squat_back' || pattern === 'squat_front') return 'squat';
    if (pattern === 'lunge') return 'lunge';
    if (pattern === 'leg_press') return 'leg_press';
    if (pattern === 'deadlift') return 'deadlift';
    if (pattern === 'back_ext') return 'back_ext';
    if (pattern === 'pullup' || pattern === 'dead_hang') return 'pullup';
    if (pattern === 'pulldown' || pattern === 'straight_arm_pd' || pattern === 'pullover_db') return 'pulldown';
    if (pattern === 'row_bb' || pattern === 'row_db' || pattern === 'row_incline' || pattern === 'seated_row' || pattern === 'face_pull' || pattern === 'inverted_row') return 'row';
    if (pattern === 'shrug') return 'shrug';
    if (pattern === 'curl_bb' || pattern === 'curl_db' || pattern === 'curl_cable' || pattern === 'preacher_curl') return 'curl';
    if (pattern === 'tricep_pushdown' || pattern === 'tricep_overhead' || pattern === 'skullcrusher') return 'tricep';
    if (pattern === 'leg_ext' || pattern === 'seated_leg_curl' || pattern === 'lying_leg_curl') return 'leg_iso';
    if (pattern === 'calf_standing' || pattern === 'calf_seated') return 'calf';
    if (pattern === 'hip_thrust' || pattern === 'glute_bridge') return 'hip_thrust';
    if (pattern === 'kickback') return 'kickback';
    if (pattern === 'cable_crunch' || pattern === 'hanging_leg_raise' || pattern === 'ab_wheel' || pattern === 'crunch') return 'core_flex';
    if (pattern === 'plank') return 'plank';
    if (pattern === 'kb_swing') return 'kb_swing';
    return 'cardio';
  }

  function t(lang, key, vars = {}) {
    const l = lang === 'en' ? 'en' : 'id';
    let str = (DICT[l] && DICT[l][key]) ?? DICT.id[key] ?? key;
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v ?? ''));
    }
    return str;
  }

  function tMuscle(muscle, lang) {
    const l = lang === 'en' ? 'en' : 'id';
    return (MUSCLE_MAP[muscle] && MUSCLE_MAP[muscle][l]) || muscle;
  }

  function tEquip(equip, lang) {
    const l = lang === 'en' ? 'en' : 'id';
    return (EQUIP_MAP[equip] && EQUIP_MAP[equip][l]) || equip;
  }

  function tExType(typeId, lang) {
    const l = lang === 'en' ? 'en' : 'id';
    return (TYPE_MAP[typeId] && TYPE_MAP[typeId][l]) || typeId;
  }

  function tLevel(level, lang) {
    const l = lang === 'en' ? 'en' : 'id';
    const key = String(level || '').toLowerCase();
    return (LEVEL_MAP[key] && LEVEL_MAP[key][l]) || level;
  }

  function tMech(mech, lang) {
    const l = lang === 'en' ? 'en' : 'id';
    const key = String(mech || '').toLowerCase();
    return (MECH_MAP[key] && MECH_MAP[key][l]) || mech;
  }

  function getInstructions(exMeta, pattern, lang, dbItem) {
    const l = lang === 'en' ? 'en' : 'id';
    if (l === 'en' && dbItem?.instructions?.length) {
      return dbItem.instructions;
    }
    const gKey = patternToGuideKey(pattern);
    return (GUIDE_STEPS[l] && GUIDE_STEPS[l][gKey]) || GUIDE_STEPS[l].squat;
  }

  return {
    DICT,
    MUSCLE_MAP,
    EQUIP_MAP,
    TYPE_MAP,
    t,
    tMuscle,
    tEquip,
    tExType,
    tLevel,
    tMech,
    getInstructions
  };
})();
