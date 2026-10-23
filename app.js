const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1wx8Ps4-mTL9MpdbwV3FTv8gGEqwuQL_LisSoyUBu6ZU/export?format=csv&gid=0";
const REFRESH_INTERVAL_MS = 10_000;
// Apps Script web app (google-apps-script.gs) that writes scans to the pallet_scan tab.
const SCAN_LOG_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyZ5l9bzoskwKvYpLX13GYKhdugNnIa99PXemHHxj1TVUdGvpBG3YAclBvq6tFmJqg1/exec";
const SCAN_LOG_QUEUE_KEY = "shipping-scan-log-queue";
const SCAN_LOG_RETRY_MS = 10_000;
const SCAN_LOG_TIMEOUT_MS = 30_000;
const HISTORY_TIMEOUT_MS = 20_000;
const LOOKUP_GROUP_LIMIT = 5;
const ADMIN_TIMEOUT_MS = 60_000;
// Only the session token the script hands out is kept, never the password.
const ADMIN_TOKEN_KEY = "shipping-admin-token";
const translations = {
  ar: {
    pageTitle: "مراجعة شحن البالتات",
    homeLabel: "الصفحة الرئيسية",
    lastUpdatedInitial: "لم يتم تحديث البيانات بعد",
    designerCredit: "تصميم إبراهيم عفيفي",
    brand: "مراجعة الشحن",
    stepOne: "١",
    stepTwo: "٢",
    progressTextLabel: "تقدم المسح",
    introEyebrow: "تأكيد البالتات والتوت",
    introTitle: "كل حاجة جاهزة للشحن؟",
    introCopy: "امسح البالتة، وبعدها امسح كل توت عليها للتأكد إنه تابع لها.",
    palletHeading: "امسح باركود البالتة",
    palletDescription: "هنعرض لك التوت المسجل على البالتة دي.",
    palletLabel: "باركود البالتة",
    palletPlaceholder: "مثال: FPIA1B1HNLSFJ",
    palletSubmit: "تأكيد البالتة",
    reviewerLabel: "اسم المراجع",
    reviewerPlaceholder: "اختار اسمك",
    reviewerRequired: "اختار اسمك الأول قبل ما تسكان البالتة.",
    reviewerDetail: "المراجع: {name}",
    shiftLabel: "الشيفت",
    shiftPlaceholder: "اختار الشيفت",
    shiftNight: "Night · من 2 لـ 8 الصبح",
    shiftMorning: "Morning · من 8 الصبح لـ 5",
    shiftMiddle: "Middle · من 5 لـ 2 بالليل",
    shiftRequired: "اختار الشيفت الأول قبل ما تسكان البالتة.",
    stageLabel: "المرحلة",
    stagePlaceholder: "اختار المرحلة",
    stageReview: "Review · مراجعة",
    stageDispatch: "Dispatch · ديسبتش",
    stageRequired: "اختار المرحلة (Review ولا Dispatch) قبل ما تسكان البالتة.",
    reviewChecking: "بنتأكد إذا كانت البالتة اتراجعت قبل كده...",
    reviewedBefore: "البالتة {pallet} اتراجعت قبل كده. آخر مراجعة: {details}. اتسكان عليها {scanned} من {total} توت.",
    reviewCheckFailed: "مقدرناش نتأكد إذا كانت البالتة {pallet} اتراجعت قبل كده. {message}",
    reviewContinue: "كمّل المراجعة",
    reviewCancel: "رجوع",
    leaveWarning: "لسه {remaining} من {total} توت متسكانوش على البالتة {pallet}. متأكد إنك عايز تسيبها؟",
    leaveStay: "كمّل الاسكان",
    leaveConfirm: "سيبها وغيّر البالتة",
    lookupHeading: "بحث عن توت ميسنج",
    lookupDescription: "اسكان أو اكتب كود التوت عشان تعرف كان على أنهي بالتة ولأنهي فرع، واتسكان إمتى ومين سكانه.",
    lookupLabel: "كود التوت",
    lookupPlaceholder: "مثال: TGI64D09HAXEEG",
    lookupSubmit: "بحث",
    lookupSearching: "بندوّر على التوت {tote}...",
    lookupScanned: "آخر مرة التوت {tote} كان على البالتة {pallet} بتاعة فرع {branch}، واتسكان عليها، يعني خرج من عندنا على البالتة بتاعته.",
    lookupNotScanned: "آخر مرة التوت {tote} كان على البالتة {pallet} بتاعة فرع {branch}، ومتسكانش عليها خالص.",
    lookupUnknown: "الكود {tote} مش موجود في الأرشيف ولا في الاسكانات.",
    lookupFailed: "مقدرناش ندوّر على التوت {tote}. {message}",
    lookupCreated: "البالتة اتعملت {created} · التوت {tote}",
    lookupNoScans: "متسكانش على البالتة دي.",
    lookupOlder: "وفيه {count} بالتة أقدم كان عليها التوت ده.",
    adminEyebrow: "لوحة الإدارة",
    adminTitle: "أداء المراجعين",
    adminLoginHeading: "تسجيل دخول الإدارة",
    adminUsername: "اسم المستخدم",
    adminPassword: "الباسورد",
    adminLoginSubmit: "دخول",
    adminWrongLogin: "اسم المستخدم أو الباسورد غلط.",
    adminNotSetUp: "دخول الإدارة لسه متظبطش. لازم ADMIN_USERNAME وADMIN_PASSWORD يتحطوا في إعدادات السكربت.",
    adminSessionEnded: "جلسة الإدارة خلصت، ادخل تاني.",
    adminFrom: "من يوم",
    adminTo: "لحد يوم",
    adminShow: "عرض",
    adminLogout: "خروج",
    adminLoading: "بنجهّز الأرقام...",
    adminFailed: "مقدرناش نجيب الأرقام. {message}",
    adminEmpty: "مفيش اسكانات في الأيام دي.",
    adminTotalReviewers: "المراجعين",
    adminTotalPallets: "البالتات",
    adminTotalTotes: "التوت",
    adminTotalActive: "وقت الشغل الفعلي",
    adminTotalIncomplete: "بالتات اتسابت ناقصة",
    adminPallets: "البالتات",
    adminTotes: "التوت",
    adminFromTo: "من - لحد",
    adminActive: "وقت الشغل الفعلي",
    adminAvgPallet: "متوسط البالتة",
    adminTotesPerHour: "توت في الساعة",
    adminIncomplete: "بالتات ناقصة",
    adminShifts: "الشيفت: {shifts} · Review: {review} · Dispatch: {dispatch}",
    adminBranches: "الفروع: {branches}",
    adminBranch: "{branch} ({pallets} بالتة، {totes} توت)",
    adminDetails: "تفاصيل البالتات ({count})",
    adminColTime: "الوقت",
    adminColPallet: "البالتة",
    adminColBranch: "الفرع",
    adminColStage: "المرحلة",
    adminColTotes: "التوت",
    adminColMinutes: "المدة",
    adminNote: "وقت الشغل الفعلي هو مجموع الوقت بين الاسكانات، من غير أي وقفة أطول من {minutes} دقايق. البالتة الناقصة هي اللي اتسكان عليها توت أقل من المفروض.",
    adminHoursMinutes: "{hours}س {minutes}د",
    adminMinutesOnly: "{minutes} د",
    tabScan: "الاسكان",
    tabBranches: "الفروع",
    tabAdmin: "الإدارة",
    adminTabReviewers: "المراجعين",
    reviewerListFailed: "مقدرناش نجيب قايمة الأسماء. حدّث الصفحة.",
    adminNamesHeading: "أسماء المراجعين",
    adminNamesList: "الأسماء اللي في القايمة: {names}",
    adminNewName: "اسم جديد",
    adminAddName: "إضافة",
    adminNameAdded: "اتضاف {name} للقايمة.",
    adminNameDuplicate: "الاسم ده موجود في القايمة.",
    adminNameInvalid: "الاسم لازم يكون من 2 لـ 60 حرف.",
    branchesEyebrow: "تقدم المراجعة",
    branchesTitle: "الفروع",
    branchesRefresh: "تحديث",
    branchesUpdated: "آخر تحديث {time}. البالتة بتتحسب خلصت لما كل التوت بتاعها يتسكان Review.",
    branchesLoading: "بنجيب تقدم الفروع...",
    branchesFailed: "مقدرناش نجيب تقدم الفروع. {message}",
    branchesEmpty: "مفيش بالتات مستنية في dispatching دلوقتي.",
    branchTotalBranches: "الفروع",
    branchTotalDone: "بالتات اتراجعت",
    branchTotalLeft: "بالتات فاضلة",
    branchTotalTotesDone: "توت اتسكان",
    branchTotalTotesLeft: "توت فاضل",
    branchPallets: "البالتات",
    branchPalletsValue: "{done} من {total}",
    branchPalletsLeft: "بالتات فاضلة",
    branchTotes: "التوت",
    branchTotesLeft: "توت فاضل",
    branchDone: "الفرع ده خلص.",
    branchDetails: "البالتات الفاضلة ({count})",
    branchColPallet: "البالتة",
    branchColLocation: "المكان",
    branchColStatus: "الحالة",
    branchColTotes: "التوت",
    branchNotStarted: "لسه متراجعتش",
    branchIncomplete: "ناقصة",
    scanHint: "استخدم جهاز الاسكانر أو اكتب الكود واضغط Enter.",
    currentPallet: "البالتة الحالية",
    changePallet: "تغيير البالتة",
    progressLabel: "تقدم مسح التوت",
    containerHeading: "امسح باركود التوت",
    containerDescription: "التوت الصح هيتعلم بالأخضر، وأي كود مش تابع للبالتة هيظهر كخطأ. لاحقة النسخة زي _v22 مش مطلوبة في الاسكان.",
    containerLabel: "باركود التوت",
    containerPlaceholder: "امسح باركود التوت",
    containerSubmit: "فحص التوت",
    containerListHeading: "التوت المطلوب",
    refresh: "تحديث البيانات",
    switchLanguage: "English",
    switchLanguageLabel: "Switch to English",
    themeDark: "التغيير إلى الوضع الليلي",
    themeLight: "التغيير إلى الوضع النهاري",
    loadingInitial: "جاري تحميل بيانات الشيت...",
    loading: "جاري تحديث بيانات الشيت...",
    connected: "الشيت متصل",
    connectionError: "مشكلة في الاتصال بالشيت",
    latestUpdate: "آخر تحديث {time} · {count} بالتة",
    palletCount: "{count} توت",
    scanned: "تم التأكيد",
    pending: "في انتظار المسح",
    scanLogSaved: "كل الاسكانات اتسجلت في الشيت",
    scanLogSaving: "جاري تسجيل {count} اسكان في الشيت...",
    scanLogRetrying: "{count} اسكان لسه متسجلوش في الشيت، هنحاول تاني",
    scanLogNotConfigured: "تسجيل الاسكان في الشيت لسه مش متوصل",
    scanLogHttpError: "تعذر الوصول لسكربت الشيت (HTTP {status}).",
    scanLogTimeout: "انتهت مهلة انتظار رد الشيت.",
    scanLogUnknownError: "حدث خطأ غير معروف أثناء تسجيل الاسكان.",
    sheetHttpError: "تعذر تحميل بيانات الشيت (HTTP {status}).",
    sheetColumns: "الشيت لازم يحتوي على عمودي palletBarcode و containerBarcode.",
    similarContainers: "في أكواد توت متشابهة بعد حذف لاحقة النسخة على البالتة {pallet}.",
    noValidRows: "الشيت مفيهوش بالتات وكونتينرات صالحة للمسح.",
    unknownError: "حدث خطأ غير معروف أثناء تحميل الشيت.",
    missingPallet: "البالتة الحالية لم تعد موجودة في الشيت بعد التحديث. امسح بالتة موجودة للمتابعة.",
    sheetPermission: "تأكد أن الشيت متاح للعرض لأي شخص لديه الرابط، ثم حاول التحديث.",
    freshRequiredPallet: "بيانات الشيت مش محدثة حاليًا، مش ممكن تأكيد البالتة. اضغط تحديث البيانات وحاول تاني.",
    freshRequiredContainer: "بيانات الشيت مش محدثة، تم إيقاف التحقق. حدّث البيانات قبل متابعة المسح.",
    palletNotFound: "كود البالتة مش موجود في بيانات الشيت. راجع الكود أو حدّث البيانات.",
    sheetNotLoaded: "بيانات الشيت لسه محملتش. حدّث الصفحة أو اضغط تحديث البيانات قبل المسح.",
    unavailablePallet: "البالتة غير متاحة في بيانات الشيت. امسح البالتة مرة أخرى.",
    wrongContainer: "خطأ: التوت {container} مش تابع للبالتة {pallet}.",
    wrongTotePallet: "التوت {container} مش تابع للبالتة الحالية {currentPallet}؛ هو مسجل على البالتة أو البالتات دي:",
    unknownTote: "التوت {container} مش موجود في بيانات الشيت على أي بالتة.",
    assignmentPallet: "البالتة {pallet} · الفرع: {branch}",
    toteDetails: "تفاصيل التوت في الشيت",
    toteBarcode: "باركود التوت المسجل",
    stagingLocation: "موقع التجهيز",
    orderNumber: "رقم الطلب",
    sourceWarehouse: "مخزن المصدر",
    destination: "الفرع",
    destinationCode: "كود الفرع",
    targetShippedAt: "موعد الشحن المستهدف",
    requestCreationDate: "تاريخ إنشاء الطلب",
    palletCreationDate: "تاريخ إنشاء البالتة",
    shippingCutoff: "آخر موعد للشحن",
    ageingHours: "ساعات الانتظار",
    numberOfItems: "عدد الأصناف",
    markContainerLost: "إعداد تحديد التوت كمفقود",
    duplicateContainer: "تنبيه: التوت {container} اتعمله مسح قبل كده.",
    allScanned: "تمام! كل التوت الـ {count} على البالتة {pallet} اتأكد.",
    containerAccepted: "تمام، التوت {container} تابع للبالتة. باقي {count} توت.",
    palletDetailsFallback: "بيانات البالتة من الشيت",
    sheetLoadFailure: "{message} تأكد من صلاحية عرض الشيت لأي شخص لديه الرابط، ثم حاول التحديث.",
  },
  en: {
    pageTitle: "Pallet Shipping Check",
    homeLabel: "Home",
    lastUpdatedInitial: "Data has not been refreshed yet",
    designerCredit: "Designed by Ibrahim Afify",
    brand: "Shipping Check",
    stepOne: "1",
    stepTwo: "2",
    progressTextLabel: "Scan progress",
    introEyebrow: "Pallet and tote verification",
    introTitle: "Ready to ship?",
    introCopy: "Scan a pallet, then scan each tote on it to confirm it belongs.",
    palletHeading: "Scan the pallet barcode",
    palletDescription: "We’ll show the totes listed for this pallet.",
    palletLabel: "Pallet barcode",
    palletPlaceholder: "Example: FPIA1B1HNLSFJ",
    palletSubmit: "Confirm pallet",
    reviewerLabel: "Reviewer name",
    reviewerPlaceholder: "Choose your name",
    reviewerRequired: "Choose your name before scanning a pallet.",
    reviewerDetail: "Reviewer: {name}",
    shiftLabel: "Shift",
    shiftPlaceholder: "Choose a shift",
    shiftNight: "Night · 02:00–08:00",
    shiftMorning: "Morning · 08:00–17:00",
    shiftMiddle: "Middle · 17:00–02:00",
    shiftRequired: "Choose the shift before scanning a pallet.",
    stageLabel: "Stage",
    stagePlaceholder: "Choose a stage",
    stageReview: "Review",
    stageDispatch: "Dispatch",
    stageRequired: "Choose the stage (Review or Dispatch) before scanning a pallet.",
    reviewChecking: "Checking whether this pallet was reviewed before...",
    reviewedBefore: "Pallet {pallet} was reviewed before. Last review: {details}. {scanned} of {total} totes were scanned on it.",
    reviewCheckFailed: "Couldn't check whether pallet {pallet} was reviewed before. {message}",
    reviewContinue: "Continue review",
    reviewCancel: "Go back",
    leaveWarning: "{remaining} of {total} totes on pallet {pallet} haven't been scanned. Leave this pallet anyway?",
    leaveStay: "Keep scanning",
    leaveConfirm: "Leave and change pallet",
    lookupHeading: "Find a missing tote",
    lookupDescription: "Scan or type a tote barcode to see which pallet and branch it was on, and when it was scanned and by whom.",
    lookupLabel: "Tote barcode",
    lookupPlaceholder: "Example: TGI64D09HAXEEG",
    lookupSubmit: "Search",
    lookupSearching: "Looking up tote {tote}...",
    lookupScanned: "Tote {tote} was last on pallet {pallet} for {branch} and was scanned on it, so it left us on its own pallet.",
    lookupNotScanned: "Tote {tote} was last on pallet {pallet} for {branch} and was never scanned on it.",
    lookupUnknown: "Barcode {tote} isn't in the archive or the scans.",
    lookupFailed: "Couldn't look up tote {tote}. {message}",
    lookupCreated: "Pallet created {created} · tote {tote}",
    lookupNoScans: "Not scanned on this pallet.",
    lookupOlder: "{count} older pallets also had this tote.",
    adminEyebrow: "Admin",
    adminTitle: "Reviewer performance",
    adminLoginHeading: "Admin login",
    adminUsername: "Username",
    adminPassword: "Password",
    adminLoginSubmit: "Log in",
    adminWrongLogin: "Wrong username or password.",
    adminNotSetUp: "Admin login isn't set up yet. ADMIN_USERNAME and ADMIN_PASSWORD have to be added to the script properties.",
    adminSessionEnded: "The admin session ended. Log in again.",
    adminFrom: "From",
    adminTo: "To",
    adminShow: "Show",
    adminLogout: "Log out",
    adminLoading: "Building the report...",
    adminFailed: "Couldn't load the report. {message}",
    adminEmpty: "No scans on these days.",
    adminTotalReviewers: "Reviewers",
    adminTotalPallets: "Pallets",
    adminTotalTotes: "Totes",
    adminTotalActive: "Working time",
    adminTotalIncomplete: "Pallets left incomplete",
    adminPallets: "Pallets",
    adminTotes: "Totes",
    adminFromTo: "From - to",
    adminActive: "Working time",
    adminAvgPallet: "Average pallet",
    adminTotesPerHour: "Totes per hour",
    adminIncomplete: "Incomplete pallets",
    adminShifts: "Shift: {shifts} · Review: {review} · Dispatch: {dispatch}",
    adminBranches: "Branches: {branches}",
    adminBranch: "{branch} ({pallets} pallets, {totes} totes)",
    adminDetails: "Pallet details ({count})",
    adminColTime: "Time",
    adminColPallet: "Pallet",
    adminColBranch: "Branch",
    adminColStage: "Stage",
    adminColTotes: "Totes",
    adminColMinutes: "Duration",
    adminNote: "Working time adds up the time between scans and leaves out any pause longer than {minutes} minutes. An incomplete pallet had fewer totes scanned than it should have.",
    adminHoursMinutes: "{hours}h {minutes}m",
    adminMinutesOnly: "{minutes} min",
    tabScan: "Scanning",
    tabBranches: "Branches",
    tabAdmin: "Admin",
    adminTabReviewers: "Reviewers",
    reviewerListFailed: "Couldn't load the list of names. Refresh the page.",
    adminNamesHeading: "Reviewer names",
    adminNamesList: "Names in the list: {names}",
    adminNewName: "New name",
    adminAddName: "Add",
    adminNameAdded: "{name} was added to the list.",
    adminNameDuplicate: "That name is already in the list.",
    adminNameInvalid: "A name needs 2 to 60 characters.",
    branchesEyebrow: "Review progress",
    branchesTitle: "Branches",
    branchesRefresh: "Refresh",
    branchesUpdated: "Updated {time}. A pallet counts as done when all its totes were scanned in Review.",
    branchesLoading: "Loading branch progress...",
    branchesFailed: "Couldn't load branch progress. {message}",
    branchesEmpty: "No pallets are waiting in dispatching right now.",
    branchTotalBranches: "Branches",
    branchTotalDone: "Pallets reviewed",
    branchTotalLeft: "Pallets left",
    branchTotalTotesDone: "Totes scanned",
    branchTotalTotesLeft: "Totes left",
    branchPallets: "Pallets",
    branchPalletsValue: "{done} of {total}",
    branchPalletsLeft: "Pallets left",
    branchTotes: "Totes",
    branchTotesLeft: "Totes left",
    branchDone: "This branch is done.",
    branchDetails: "Pallets left ({count})",
    branchColPallet: "Pallet",
    branchColLocation: "Location",
    branchColStatus: "Status",
    branchColTotes: "Totes",
    branchNotStarted: "Not reviewed yet",
    branchIncomplete: "Incomplete",
    scanHint: "Use a barcode scanner, or type the code and press Enter.",
    currentPallet: "Current pallet",
    changePallet: "Change pallet",
    progressLabel: "Tote scan progress",
    containerHeading: "Scan the tote barcode",
    containerDescription: "A matching tote turns green. A code that doesn’t belong to this pallet will show an error. Version suffixes such as _v22 are not required.",
    containerLabel: "Tote barcode",
    containerPlaceholder: "Scan a tote barcode",
    containerSubmit: "Check tote",
    containerListHeading: "Expected totes",
    refresh: "Refresh data",
    switchLanguage: "العربية",
    switchLanguageLabel: "التغيير إلى العربية",
    themeDark: "Switch to dark mode",
    themeLight: "Switch to light mode",
    loadingInitial: "Loading spreadsheet data...",
    loading: "Refreshing spreadsheet data...",
    connected: "Spreadsheet connected",
    connectionError: "Spreadsheet connection problem",
    latestUpdate: "Last updated {time} · {count} pallets",
    palletCount: "{count} totes",
    scanned: "Confirmed",
    pending: "Waiting to scan",
    scanLogSaved: "All scans saved to the sheet",
    scanLogSaving: "Saving {count} scans to the sheet...",
    scanLogRetrying: "{count} scans not saved to the sheet yet. Retrying.",
    scanLogNotConfigured: "Saving scans to the sheet is not set up",
    scanLogHttpError: "Could not reach the sheet script (HTTP {status}).",
    scanLogTimeout: "Timed out waiting for the sheet.",
    scanLogUnknownError: "An unknown error occurred while saving the scan.",
    sheetHttpError: "Could not load spreadsheet data (HTTP {status}).",
    sheetColumns: "The spreadsheet must include palletBarcode and containerBarcode columns.",
    similarContainers: "Tote barcodes become ambiguous after removing the version suffix on pallet {pallet}.",
    noValidRows: "The spreadsheet contains no valid pallet and container rows.",
    unknownError: "An unknown error occurred while loading the spreadsheet.",
    missingPallet: "The current pallet is no longer in the spreadsheet. Scan an available pallet to continue.",
    sheetPermission: "Make sure the spreadsheet is shared with anyone who has the link as a viewer, then try again.",
    freshRequiredPallet: "Spreadsheet data is not up to date, so the pallet cannot be confirmed. Refresh the data and try again.",
    freshRequiredContainer: "Spreadsheet data is not up to date. Verification is paused; refresh before continuing.",
    palletNotFound: "Pallet barcode not found in the spreadsheet. Check the code or refresh the data.",
    sheetNotLoaded: "Spreadsheet data has not loaded yet. Refresh the page or click Refresh data before scanning.",
    unavailablePallet: "This pallet is not available in the spreadsheet. Scan the pallet again.",
    wrongContainer: "Error: tote {container} does not belong to pallet {pallet}.",
    wrongTotePallet: "Tote {container} does not belong to the current pallet {currentPallet}. It is listed under:",
    unknownTote: "Tote {container} is not listed in the spreadsheet under any pallet.",
    assignmentPallet: "Pallet {pallet} · Branch: {branch}",
    toteDetails: "Tote details from spreadsheet",
    toteBarcode: "Registered tote barcode",
    stagingLocation: "Staging location",
    orderNumber: "Order number",
    sourceWarehouse: "Source warehouse",
    destination: "Branch",
    destinationCode: "Branch code",
    targetShippedAt: "Target ship time",
    requestCreationDate: "Request creation date",
    palletCreationDate: "Pallet creation date",
    shippingCutoff: "Shipping cutoff",
    ageingHours: "Ageing hours",
    numberOfItems: "Number of items",
    markContainerLost: "Mark tote lost setting",
    duplicateContainer: "Notice: tote {container} has already been scanned.",
    allScanned: "Done! All {count} totes on pallet {pallet} are confirmed.",
    containerAccepted: "Good, tote {container} belongs to this pallet. {count} remaining.",
    palletDetailsFallback: "Pallet details from spreadsheet",
    sheetLoadFailure: "{message} Make sure the spreadsheet is shared with anyone who has the link as a viewer, then try again.",
  },
};

const elements = {
  languageButton: document.querySelector("#languageButton"),
  themeButton: document.querySelector("#themeButton"),
  syncIndicator: document.querySelector("#syncIndicator"),
  syncText: document.querySelector("#syncText"),
  scanLogIndicator: document.querySelector("#scanLogIndicator"),
  scanLogText: document.querySelector("#scanLogText"),
  notice: document.querySelector("#notice"),
  palletScanCard: document.querySelector("#palletScanCard"),
  reviewerSelect: document.querySelector("#reviewerSelect"),
  shiftSelect: document.querySelector("#shiftSelect"),
  stageSelect: document.querySelector("#stageSelect"),
  palletForm: document.querySelector("#palletForm"),
  reviewWarning: document.querySelector("#reviewWarning"),
  reviewWarningText: document.querySelector("#reviewWarningText"),
  reviewContinueButton: document.querySelector("#reviewContinueButton"),
  reviewCancelButton: document.querySelector("#reviewCancelButton"),
  leaveWarning: document.querySelector("#leaveWarning"),
  leaveWarningText: document.querySelector("#leaveWarningText"),
  leaveStayButton: document.querySelector("#leaveStayButton"),
  leaveConfirmButton: document.querySelector("#leaveConfirmButton"),
  lookupForm: document.querySelector("#lookupForm"),
  lookupInput: document.querySelector("#lookupInput"),
  lookupResult: document.querySelector("#lookupResult"),
  scanView: document.querySelector("#scanView"),
  viewTabs: [...document.querySelectorAll(".view-tab[data-view]")],
  adminTabs: [...document.querySelectorAll(".view-tab[data-admin-tab]")],
  adminBranches: document.querySelector("#adminBranches"),
  adminReviewersSection: document.querySelector("#adminReviewersSection"),
  branchRefreshButton: document.querySelector("#branchRefreshButton"),
  branchUpdated: document.querySelector("#branchUpdated"),
  branchStatus: document.querySelector("#branchStatus"),
  branchTotals: document.querySelector("#branchTotals"),
  branchList: document.querySelector("#branchList"),
  adminView: document.querySelector("#adminView"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminUsername: document.querySelector("#adminUsername"),
  adminPassword: document.querySelector("#adminPassword"),
  adminLoginError: document.querySelector("#adminLoginError"),
  adminPanel: document.querySelector("#adminPanel"),
  adminFilterForm: document.querySelector("#adminFilterForm"),
  adminFrom: document.querySelector("#adminFrom"),
  adminTo: document.querySelector("#adminTo"),
  adminLogoutButton: document.querySelector("#adminLogoutButton"),
  adminStatus: document.querySelector("#adminStatus"),
  adminTotals: document.querySelector("#adminTotals"),
  adminNote: document.querySelector("#adminNote"),
  adminReviewers: document.querySelector("#adminReviewers"),
  adminNameForm: document.querySelector("#adminNameForm"),
  adminNamesList: document.querySelector("#adminNamesList"),
  adminNewName: document.querySelector("#adminNewName"),
  adminNameStatus: document.querySelector("#adminNameStatus"),
  palletInput: document.querySelector("#palletInput"),
  palletResult: document.querySelector("#palletResult"),
  selectedPallet: document.querySelector("#selectedPallet"),
  palletDetails: document.querySelector("#palletDetails"),
  changePalletButton: document.querySelector("#changePalletButton"),
  containerForm: document.querySelector("#containerForm"),
  containerInput: document.querySelector("#containerInput"),
  scanFeedback: document.querySelector("#scanFeedback"),
  containerList: document.querySelector("#containerList"),
  containerCount: document.querySelector("#containerCount"),
  progressText: document.querySelector("#progressText"),
  progressBar: document.querySelector("#progressBar"),
  progressFill: document.querySelector("#progressFill"),
  lastUpdated: document.querySelector("#lastUpdated"),
  refreshButton: document.querySelector("#refreshButton"),
};

let pallets = new Map();
let toteAssignments = new Map();
let currentPalletBarcode = "";
let scannedContainers = new Set();
let isRefreshing = false;
let hasFreshSheet = false;
let scanLogQueue = loadScanLogQueue();
let isSendingScanLog = false;
let isCheckingHistory = false;
let pendingReviewPallet = null;
let isLookingUp = false;
let lastLookup = null;
let audioContext = null;
let adminReport = null;
let adminMessages = {};
let scanLogRetryTimer = 0;
let scanLogError = "";
let reviewerName = (localStorage.getItem("shipping-check-reviewer") || "").trim();
// The fixed list of names, kept on the device so the page works before the script answers.
let reviewerNames = loadCachedReviewerNames();
let branchProgress = null;
let branchMessage = null;
// Shift and stage are kept only for this tab, so the next shift has to pick its own.
let selectedShift = sessionStorage.getItem("shipping-check-shift") || "";
let selectedStage = sessionStorage.getItem("shipping-check-stage") || "";
let currentLanguage = localStorage.getItem("shipping-check-language") === "en" ? "en" : "ar";
let currentTheme = localStorage.getItem("shipping-check-theme") === "dark" ? "dark" : "light";

function t(key, values = {}) {
  return translations[currentLanguage][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  document.title = t("pageTitle");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-placeholder]")) {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  }
  elements.languageButton.textContent = t("switchLanguage");
  elements.languageButton.setAttribute("aria-label", t("switchLanguageLabel"));
  elements.themeButton.textContent = currentTheme === "dark" ? "☀️" : "🌙";
  elements.themeButton.setAttribute("aria-label", t(currentTheme === "dark" ? "themeLight" : "themeDark"));
  elements.syncText.textContent = t(elements.syncIndicator.dataset.messageKey || "loadingInitial");
  renderScanLogState();
  if (elements.lastUpdated.dataset.updateTime) {
    elements.lastUpdated.textContent = t("latestUpdate", {
      time: formatTime(new Date(elements.lastUpdated.dataset.updateTime)),
      count: elements.lastUpdated.dataset.palletCount,
    });
  }
  if (!elements.palletResult.hidden && currentPalletBarcode) {
    const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
    if (pallet) renderPallet(pallet);
  }
  if (elements.notice.dataset.messageKey) {
    elements.notice.textContent = t(elements.notice.dataset.messageKey, JSON.parse(elements.notice.dataset.messageValues || "{}"));
  }
  if (elements.scanFeedback.dataset.messageKey) renderScanFeedback();
  if (elements.reviewWarning.dataset.messageKey) renderReviewWarning();
  if (elements.leaveWarning.dataset.messageKey) renderLeaveWarning();
  if (lastLookup) renderLookup();
  renderAdminMessages();
  if (adminReport && !elements.adminView.hidden) renderAdminReport();
  renderReviewerOptions();
  renderBranchStatus();
  if (branchProgress) renderBranchProgress();
  document.querySelector('meta[name="theme-color"]').content = currentTheme === "dark" ? "#111a17" : "#102a27";
}

function applyTheme() {
  document.documentElement.dataset.theme = currentTheme;
  applyLanguage();
}

function normalizeBarcode(value) {
  return value.trim().toLocaleUpperCase();
}

function containerMatchKey(value) {
  return normalizeBarcode(value).replace(/_V\d+$/, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function buildPalletIndex(csv) {
  const rows = parseCsv(csv.replace(/^\uFEFF/, ""));
  const headers = rows.shift()?.map((header) => header.trim()) ?? [];
  const palletIndex = headers.indexOf("palletBarcode");
  const containerIndex = headers.indexOf("containerBarcode");
  const locationIndex = headers.indexOf("staging_location");
  const destinationIndex = headers.indexOf("destination_darkstore");

  if (palletIndex < 0 || containerIndex < 0) {
    throw new Error(t("sheetColumns"));
  }

  const index = new Map();
  const assignments = new Map();
  const detailColumns = [
    ["stagingLocation", "staging_location"],
    ["orderNumber", "order_nr"],
    ["sourceWarehouse", "source_warehouse_code"],
    ["destination", "destination_darkstore"],
    ["destinationCode", "destination_ds_code"],
    ["targetShippedAt", "target_shipped_at"],
    ["requestCreationDate", "request_creation_date"],
    ["palletCreationDate", "pallet_creation_date"],
    ["shippingCutoff", "shipping_cutoff"],
    ["ageingHours", "ageing_hours"],
    ["numberOfItems", "number_of_items"],
    ["markContainerLost", "enable_mark_container_lost"],
  ].map(([key, header]) => [key, headers.indexOf(header)]);

  for (const row of rows) {
    const palletBarcode = row[palletIndex]?.trim();
    const containerBarcode = row[containerIndex]?.trim();
    if (!palletBarcode || !containerBarcode) continue;

    let pallet = index.get(normalizeBarcode(palletBarcode));
    if (!pallet) {
      pallet = {
        barcode: palletBarcode,
        location: row[locationIndex]?.trim() ?? "",
        destination: row[destinationIndex]?.trim() ?? "",
        containers: new Map(),
      };
      index.set(normalizeBarcode(palletBarcode), pallet);
    }

    const containerKey = containerMatchKey(containerBarcode);
    const existingContainer = pallet.containers.get(containerKey);
    if (existingContainer && normalizeBarcode(existingContainer) !== normalizeBarcode(containerBarcode)) {
      throw new Error(t("similarContainers", { pallet: palletBarcode }));
    }
    if (!existingContainer) {
      pallet.containers.set(containerKey, containerBarcode);
    }

    let palletAssignments = assignments.get(containerKey);
    if (!palletAssignments) {
      palletAssignments = new Map();
      assignments.set(containerKey, palletAssignments);
    }

    let assignment = palletAssignments.get(normalizeBarcode(palletBarcode));
    if (!assignment) {
      assignment = {
        palletBarcode,
        containerBarcodes: new Set(),
        fields: new Map(),
      };
      palletAssignments.set(normalizeBarcode(palletBarcode), assignment);
    }
    assignment.containerBarcodes.add(containerBarcode);

    for (const [key, columnIndex] of detailColumns) {
      const value = columnIndex < 0 ? "" : row[columnIndex]?.trim() ?? "";
      if (!value) continue;
      let values = assignment.fields.get(key);
      if (!values) {
        values = new Set();
        assignment.fields.set(key, values);
      }
      values.add(value);
    }
  }

  if (index.size === 0) {
    throw new Error(t("noValidRows"));
  }

  const toteIndex = new Map();
  for (const [containerKey, palletAssignments] of assignments) {
    const details = [];
    for (const assignment of palletAssignments.values()) {
      const fields = Object.fromEntries(
        [...assignment.fields].map(([key, values]) => [key, [...values]]),
      );
      details.push({
        palletBarcode: assignment.palletBarcode,
        containerBarcodes: [...assignment.containerBarcodes],
        fields,
      });
    }
    toteIndex.set(containerKey, details);
  }

  return { pallets: index, toteAssignments: toteIndex };
}

function setSyncState(state, messageKey) {
  elements.syncIndicator.dataset.state = state;
  elements.syncIndicator.dataset.messageKey = messageKey;
  elements.syncText.textContent = t(messageKey);
}

function showNotice(messageKey, values = {}, state = "error") {
  elements.notice.dataset.messageKey = messageKey;
  elements.notice.dataset.messageValues = JSON.stringify(values);
  elements.notice.textContent = t(messageKey, values);
  elements.notice.dataset.state = state;
  elements.notice.hidden = false;
}

function clearNotice() {
  elements.notice.hidden = true;
  elements.notice.textContent = "";
  delete elements.notice.dataset.messageKey;
  delete elements.notice.dataset.messageValues;
}

function loadSheetCsv() {
  const separator = SHEET_CSV_URL.includes("?") ? "&" : "?";
  return fetch(`${SHEET_CSV_URL}${separator}_=${Date.now()}`, {
    cache: "no-store",
  }).then((response) => {
    if (!response.ok) {
      throw new Error(t("sheetHttpError", { status: response.status }));
    }
    return response.text();
  });
}

function loadScanLogQueue() {
  try {
    const queue = JSON.parse(localStorage.getItem(SCAN_LOG_QUEUE_KEY) || "[]");
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

function saveScanLogQueue() {
  try {
    localStorage.setItem(SCAN_LOG_QUEUE_KEY, JSON.stringify(scanLogQueue));
  } catch {
    // Storage can be full or blocked; the queue still lives in memory for this page.
  }
}

// Scans wait in a saved queue and go to the sheet one at a time, in scan order,
// so a slow or offline connection never holds up scanning.
function queueScanLog(eventType, pallet, containerBarcode = "") {
  if (!SCAN_LOG_ENDPOINT) return;
  scanLogQueue.push({
    requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    eventType,
    palletBarcode: pallet.barcode,
    containerBarcode,
    branch: pallet.destination,
    reviewer: reviewerName,
    shift: selectedShift,
    stage: selectedStage,
    scannedAt: new Date().toISOString(),
  });
  saveScanLogQueue();
  renderScanLogState();
  sendScanLogQueue();
}

async function sendScanLogQueue() {
  if (isSendingScanLog || !SCAN_LOG_ENDPOINT) return;
  window.clearTimeout(scanLogRetryTimer);
  isSendingScanLog = true;
  try {
    while (scanLogQueue.length) {
      renderScanLogState();
      await postScanLog(scanLogQueue[0]);
      scanLogQueue.shift();
      saveScanLogQueue();
      scanLogError = "";
    }
  } catch (error) {
    scanLogError = error instanceof Error ? error.message : t("scanLogUnknownError");
    scanLogRetryTimer = window.setTimeout(sendScanLogQueue, SCAN_LOG_RETRY_MS);
  } finally {
    isSendingScanLog = false;
    renderScanLogState();
  }
}

async function postScanLog(entry) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SCAN_LOG_TIMEOUT_MS);
  try {
    const response = await fetch(SCAN_LOG_ENDPOINT, {
      method: "POST",
      body: new URLSearchParams(entry),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(t("scanLogHttpError", { status: response.status }));
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.message || t("scanLogUnknownError"));
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(t("scanLogTimeout"));
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderScanLogState() {
  let state = "ok";
  let messageKey = "scanLogSaved";
  if (!SCAN_LOG_ENDPOINT) {
    state = "idle";
    messageKey = "scanLogNotConfigured";
  } else if (scanLogError) {
    state = "error";
    messageKey = "scanLogRetrying";
  } else if (scanLogQueue.length) {
    state = "loading";
    messageKey = "scanLogSaving";
  }
  elements.scanLogIndicator.dataset.state = state;
  elements.scanLogIndicator.title = scanLogError;
  elements.scanLogText.textContent = t(messageKey, { count: scanLogQueue.length });
}

// Questions to the Apps Script: GET for the read-only lookups, POST for the admin calls
// so a password never goes into a URL. A failed answer keeps the script's error code.
async function fetchScriptJson(parameters, { method = "GET", timeoutMs = HISTORY_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const body = new URLSearchParams(parameters);
    const response = method === "POST"
      ? await fetch(SCAN_LOG_ENDPOINT, { method, body, cache: "no-store", signal: controller.signal })
      : await fetch(`${SCAN_LOG_ENDPOINT}?${body}`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) {
      throw new Error(t("scanLogHttpError", { status: response.status }));
    }
    const result = await response.json();
    if (!result.success) {
      const error = new Error(result.message || t("scanLogUnknownError"));
      error.code = result.code;
      throw error;
    }
    return result;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(t("scanLogTimeout"));
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Joins the sheet's answer with Review scans of this pallet still waiting in this
// device's queue, which the sheet hasn't seen yet. Scans with no stage count as Review.
function earlierReviews(pallet, history) {
  const palletKey = normalizeBarcode(pallet.barcode);
  const queued = scanLogQueue.filter((entry) =>
    normalizeBarcode(entry.palletBarcode) === palletKey && entry.stage !== "Dispatch");
  const queuedPallets = queued.filter((entry) => entry.eventType === "pallet");
  const toteKeys = new Set([
    ...history.totes,
    ...queued.filter((entry) => entry.eventType === "tote").map((entry) => entry.containerBarcode),
  ].map(containerMatchKey));

  const latestQueued = queuedPallets[queuedPallets.length - 1];
  const last = latestQueued
    ? { scannedAt: formatDateTime(new Date(latestQueued.scannedAt)), reviewer: latestQueued.reviewer, shift: latestQueued.shift }
    : history.lastReview;
  return {
    reviewed: history.reviews + queuedPallets.length > 0,
    // Each part is isolated so a date like 2026-10-20 12:27 isn't reordered inside Arabic text.
    details: last
      ? [last.scannedAt, last.reviewer, last.shift].filter(Boolean).map((part) => `⁨${part}⁩`).join(" · ")
      : "",
    scanned: [...pallet.containers.keys()].filter((key) => toteKeys.has(key)).length,
    total: pallet.containers.size,
  };
}

function renderReviewWarning() {
  const { messageKey, messageValues } = elements.reviewWarning.dataset;
  elements.reviewWarningText.textContent = t(messageKey, JSON.parse(messageValues || "{}"));
}

// The reviewer has to pick Continue or Go back. Focus sits on the box itself, so a
// barcode scanned by mistake lands nowhere instead of pressing a button.
function showReviewWarning(pallet, messageKey, values) {
  pendingReviewPallet = pallet;
  elements.reviewWarning.dataset.messageKey = messageKey;
  elements.reviewWarning.dataset.messageValues = JSON.stringify(values);
  renderReviewWarning();
  elements.reviewWarning.hidden = false;
  elements.palletInput.disabled = true;
  elements.palletForm.querySelector('button[type="submit"]').disabled = true;
  elements.reviewWarning.focus();
}

function hideReviewWarning() {
  pendingReviewPallet = null;
  elements.reviewWarning.hidden = true;
  delete elements.reviewWarning.dataset.messageKey;
  delete elements.reviewWarning.dataset.messageValues;
  elements.palletInput.disabled = false;
  elements.palletForm.querySelector('button[type="submit"]').disabled = false;
}

function renderLeaveWarning() {
  const { messageKey, messageValues } = elements.leaveWarning.dataset;
  elements.leaveWarningText.textContent = t(messageKey, JSON.parse(messageValues || "{}"));
}

// Same pattern as the review prompt: the tote field is locked and focus sits on the box,
// so a tote scanned while it is open can't be read as an answer.
function showLeaveWarning(pallet, remaining) {
  elements.leaveWarning.dataset.messageKey = "leaveWarning";
  elements.leaveWarning.dataset.messageValues = JSON.stringify({
    remaining,
    total: pallet.containers.size,
    pallet: pallet.barcode,
  });
  renderLeaveWarning();
  elements.leaveWarning.hidden = false;
  elements.containerInput.disabled = true;
  elements.containerForm.querySelector('button[type="submit"]').disabled = true;
  elements.changePalletButton.disabled = true;
  elements.leaveWarning.focus();
}

function hideLeaveWarning() {
  elements.leaveWarning.hidden = true;
  delete elements.leaveWarning.dataset.messageKey;
  delete elements.leaveWarning.dataset.messageValues;
  elements.containerInput.disabled = false;
  elements.containerForm.querySelector('button[type="submit"]').disabled = false;
  elements.changePalletButton.disabled = false;
}

function leavePallet() {
  hideLeaveWarning();
  currentPalletBarcode = "";
  scannedContainers.clear();
  elements.palletResult.hidden = true;
  elements.palletScanCard.hidden = false;
  elements.scanFeedback.hidden = true;
  elements.palletInput.focus();
}

// A short low double buzz and a vibration, so a wrong tote is noticed without looking at the screen.
function signalWrongTote() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      if (!audioContext) audioContext = new AudioContextClass();
      if (audioContext.state === "suspended") audioContext.resume();
      const start = audioContext.currentTime;
      for (const [offset, frequency] of [[0, 300], [0.22, 200]]) {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "square";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + offset);
        gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(start + offset);
        oscillator.stop(start + offset + 0.2);
      }
    }
  } catch {
    // The sound is extra; the error message on screen still shows.
  }
  if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
}

// One entry per pallet the tote was on, newest first, each with that pallet's scans of it.
function buildToteGroups(result) {
  const groups = new Map();
  for (const assignment of result.assignments) {
    groups.set(normalizeBarcode(assignment.pallet), { ...assignment, scans: [] });
  }
  for (const scan of result.scans) {
    const key = normalizeBarcode(scan.pallet);
    if (!groups.has(key)) {
      groups.set(key, { pallet: scan.pallet, tote: scan.tote, branch: scan.branch, created: "", scans: [] });
    }
    groups.get(key).scans.push(scan);
  }
  const latest = (group) => [group.created, ...group.scans.map((scan) => scan.scannedAt)].sort().pop() || "";
  return [...groups.values()]
    .map((group) => ({ ...group, scans: group.scans.sort((a, b) => a.scannedAt.localeCompare(b.scannedAt)) }))
    .sort((a, b) => latest(b).localeCompare(latest(a)));
}

const isolate = (text) => `⁨${text}⁩`;

function renderLookup() {
  const result = elements.lookupResult;
  result.replaceChildren();
  result.hidden = !lastLookup;
  if (!lastLookup) return;

  const tote = isolate(lastLookup.query);
  const status = document.createElement("div");
  status.className = "scan-feedback";
  result.append(status);

  if (lastLookup.loading) {
    status.dataset.state = "warning";
    status.textContent = t("lookupSearching", { tote });
    return;
  }
  if (lastLookup.error) {
    status.dataset.state = "error";
    status.textContent = t("lookupFailed", { tote, message: lastLookup.error });
    return;
  }

  const groups = lastLookup.groups;
  if (!groups.length) {
    status.dataset.state = "error";
    status.textContent = t("lookupUnknown", { tote });
    return;
  }
  const [newest] = groups;
  status.dataset.state = newest.scans.length ? "success" : "error";
  status.textContent = t(newest.scans.length ? "lookupScanned" : "lookupNotScanned", {
    tote,
    pallet: isolate(newest.pallet),
    branch: isolate(newest.branch),
  });

  const list = document.createElement("ul");
  list.className = "lookup-groups";
  for (const group of groups.slice(0, LOOKUP_GROUP_LIMIT)) {
    const item = document.createElement("li");
    item.dataset.state = group.scans.length ? "scanned" : "missing";
    const heading = document.createElement("h3");
    heading.textContent = [group.pallet, group.branch].filter(Boolean).map(isolate).join(" · ");
    const created = document.createElement("p");
    created.textContent = t("lookupCreated", { created: isolate(group.created || "-"), tote: isolate(group.tote) });
    item.append(heading, created);

    if (group.scans.length) {
      const scans = document.createElement("ul");
      scans.className = "lookup-scans";
      for (const scan of group.scans) {
        const line = document.createElement("li");
        line.textContent = [scan.stage, scan.scannedAt, scan.reviewer, scan.shift].filter(Boolean).map(isolate).join(" · ");
        scans.append(line);
      }
      item.append(scans);
    } else {
      const missing = document.createElement("p");
      missing.dataset.state = "missing";
      missing.textContent = t("lookupNoScans");
      item.append(missing);
    }
    list.append(item);
  }
  result.append(list);

  if (groups.length > LOOKUP_GROUP_LIMIT) {
    const older = document.createElement("p");
    older.className = "scan-hint";
    older.textContent = t("lookupOlder", { count: groups.length - LOOKUP_GROUP_LIMIT });
    result.append(older);
  }
}

function localDateString(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Short durations keep one decimal (1.3 min); an hour or more shows hours and minutes.
function formatMinutes(total) {
  if (total < 60) return t("adminMinutesOnly", { minutes: Math.round(total * 10) / 10 });
  return t("adminHoursMinutes", { hours: Math.floor(total / 60), minutes: Math.round(total % 60) });
}

// Messages are kept as keys so switching language redraws them.
function setAdminMessage(target, messageKey, values = {}, state = "error") {
  adminMessages[target] = messageKey ? { messageKey, values, state } : null;
  renderAdminMessages();
}

function renderAdminMessages() {
  for (const [target, element] of [["status", elements.adminStatus], ["login", elements.adminLoginError], ["name", elements.adminNameStatus]]) {
    const message = adminMessages[target];
    element.hidden = !message;
    if (!message) continue;
    element.dataset.state = message.state;
    element.textContent = t(message.messageKey, message.values);
  }
}

function showAdminLogin(messageKey) {
  adminReport = null;
  elements.adminPanel.hidden = true;
  elements.adminLoginForm.hidden = false;
  setAdminMessage("status", null);
  setAdminMessage("login", messageKey || null);
  elements.adminUsername.focus();
}

function showView(view) {
  elements.scanView.hidden = view !== "scan";
  elements.adminView.hidden = view !== "admin";
  for (const tab of elements.viewTabs) tab.setAttribute("aria-pressed", String(tab.dataset.view === view));
  if (view === "scan") elements.palletInput.focus();
  if (view === "admin") openAdmin();
}

function loadCachedReviewerNames() {
  try {
    const names = JSON.parse(localStorage.getItem("shipping-reviewer-names") || "[]");
    return Array.isArray(names) ? names : [];
  } catch {
    return [];
  }
}

// The dropdown only offers names from the list, so the same person is always spelled the same way.
function renderReviewerOptions() {
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("reviewerPlaceholder");
  const options = reviewerNames.map((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    return option;
  });
  elements.reviewerSelect.replaceChildren(placeholder, ...options);
  reviewerName = reviewerNames.includes(reviewerName) ? reviewerName : "";
  elements.reviewerSelect.value = reviewerName;
  elements.adminNamesList.textContent = t("adminNamesList", { names: reviewerNames.join("، ") || "-" });
}

function setReviewerNames(names) {
  reviewerNames = names;
  try {
    localStorage.setItem("shipping-reviewer-names", JSON.stringify(names));
  } catch {
    // The list still works for this page.
  }
  renderReviewerOptions();
}

async function loadReviewerNames() {
  if (!SCAN_LOG_ENDPOINT) return;
  try {
    const result = await fetchScriptJson({ action: "reviewers" });
    setReviewerNames(result.names);
  } catch {
    if (!reviewerNames.length) showNotice("reviewerListFailed");
  }
}

function renderBranchStatus() {
  elements.branchStatus.hidden = !branchMessage;
  if (!branchMessage) return;
  elements.branchStatus.dataset.state = branchMessage.state;
  elements.branchStatus.textContent = t(branchMessage.messageKey, branchMessage.values);
}

function showAdminTab(tab) {
  elements.adminReviewersSection.hidden = tab !== "reviewers";
  elements.adminBranches.hidden = tab !== "branches";
  for (const button of elements.adminTabs) button.setAttribute("aria-pressed", String(button.dataset.adminTab === tab));
  if (tab === "branches") loadBranchProgress();
}

async function loadBranchProgress() {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    showAdminLogin();
    return;
  }
  elements.branchRefreshButton.disabled = true;
  branchMessage = { messageKey: "branchesLoading", values: {}, state: "warning" };
  renderBranchStatus();
  try {
    if (!SCAN_LOG_ENDPOINT) throw new Error(t("scanLogNotConfigured"));
    branchProgress = await fetchScriptJson({ action: "branchProgress", token }, { method: "POST", timeoutMs: ADMIN_TIMEOUT_MS });
    branchMessage = branchProgress.branches.length ? null : { messageKey: "branchesEmpty", values: {}, state: "warning" };
    renderBranchProgress();
  } catch (error) {
    if (error.code === "expired") {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      branchMessage = null;
      showAdminLogin("adminSessionEnded");
      return;
    }
    branchMessage = { messageKey: "branchesFailed", values: { message: error instanceof Error ? error.message : "" }, state: "error" };
  } finally {
    elements.branchRefreshButton.disabled = false;
    renderBranchStatus();
  }
}

function renderBranchProgress() {
  if (!branchProgress) return;
  const { totals, branches, updatedAt } = branchProgress;
  elements.branchUpdated.hidden = false;
  elements.branchUpdated.textContent = t("branchesUpdated", { time: isolate(updatedAt) });

  elements.branchTotals.replaceChildren(...[
    ["branchTotalBranches", totals.branches],
    ["branchTotalDone", t("branchPalletsValue", { done: totals.donePallets, total: totals.pallets })],
    ["branchTotalLeft", totals.pallets - totals.donePallets],
    ["branchTotalTotesDone", t("branchPalletsValue", { done: totals.doneTotes, total: totals.totes })],
    ["branchTotalTotesLeft", totals.totes - totals.doneTotes],
  ].map(([key, value]) => {
    const card = document.createElement("div");
    card.className = "admin-total";
    const label = document.createElement("span");
    label.textContent = t(key);
    const number = document.createElement("strong");
    number.textContent = value;
    card.append(label, number);
    return card;
  }));

  elements.branchList.replaceChildren(...branches.map((branch) => {
    const card = document.createElement("article");
    card.className = "reviewer-card";
    const name = document.createElement("h3");
    name.textContent = branch.branch;
    const bar = document.createElement("div");
    bar.className = "branch-bar";
    const fill = document.createElement("span");
    fill.style.width = `${branch.totes ? Math.round((branch.doneTotes / branch.totes) * 100) : 100}%`;
    bar.append(fill);

    const left = branch.pallets - branch.donePallets;
    const stats = document.createElement("dl");
    stats.className = "reviewer-stats";
    stats.append(
      adminStat(t("branchPallets"), t("branchPalletsValue", { done: branch.donePallets, total: branch.pallets })),
      adminStat(t("branchPalletsLeft"), left, left > 0),
      adminStat(t("branchTotes"), t("branchPalletsValue", { done: branch.doneTotes, total: branch.totes })),
      adminStat(t("branchTotesLeft"), branch.totes - branch.doneTotes, branch.totes > branch.doneTotes),
    );
    card.append(name, bar, stats);

    if (!branch.remaining.length) {
      const done = document.createElement("p");
      done.className = "reviewer-meta";
      done.textContent = t("branchDone");
      card.append(done);
      return card;
    }
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = t("branchDetails", { count: branch.remaining.length });
    const wrap = document.createElement("div");
    wrap.className = "session-table-wrap";
    const table = document.createElement("table");
    table.className = "session-table";
    const head = table.createTHead().insertRow();
    for (const key of ["branchColPallet", "branchColLocation", "branchColStatus", "branchColTotes"]) {
      const cell = document.createElement("th");
      cell.textContent = t(key);
      head.append(cell);
    }
    const body = table.createTBody();
    for (const pallet of branch.remaining) {
      const row = body.insertRow();
      row.dataset.state = "incomplete";
      for (const value of [
        pallet.pallet,
        pallet.location,
        t(pallet.scanned ? "branchIncomplete" : "branchNotStarted"),
        t("branchPalletsValue", { done: pallet.scanned, total: pallet.expected }),
      ]) {
        row.insertCell().textContent = value;
      }
    }
    wrap.append(table);
    details.append(summary, wrap);
    card.append(details);
    return card;
  }));
}

function openAdmin() {
  if (!elements.adminFrom.value) elements.adminFrom.value = localDateString();
  if (!elements.adminTo.value) elements.adminTo.value = localDateString();
  if (!sessionStorage.getItem(ADMIN_TOKEN_KEY)) {
    showAdminLogin();
    return;
  }
  elements.adminLoginForm.hidden = true;
  elements.adminPanel.hidden = false;
  if (adminReport) renderAdminReport();
  else loadAdminReport();
}

async function loadAdminReport() {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  if (!token) {
    showAdminLogin();
    return;
  }
  const submitButton = elements.adminFilterForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setAdminMessage("status", "adminLoading", {}, "warning");
  try {
    adminReport = await fetchScriptJson(
      { action: "adminStats", token, from: elements.adminFrom.value, to: elements.adminTo.value },
      { method: "POST", timeoutMs: ADMIN_TIMEOUT_MS },
    );
    setAdminMessage("status", adminReport.reviewers.length ? null : "adminEmpty", {}, "warning");
    renderAdminReport();
  } catch (error) {
    if (error.code === "expired") {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      showAdminLogin("adminSessionEnded");
      return;
    }
    setAdminMessage("status", "adminFailed", { message: error instanceof Error ? error.message : "" });
  } finally {
    submitButton.disabled = false;
  }
}

function adminStat(label, value, warning = false) {
  const item = document.createElement("div");
  if (warning) item.dataset.state = "warning";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value;
  item.append(term, detail);
  return item;
}

function renderAdminReport() {
  if (!adminReport) return;
  const { totals, reviewers, from, to, idleGapMinutes } = adminReport;
  const oneDay = from === to;
  const clock = (stamp) => isolate(oneDay ? stamp.slice(11) : stamp);

  elements.adminTotals.replaceChildren(...[
    ["adminTotalReviewers", totals.reviewers],
    ["adminTotalPallets", totals.pallets],
    ["adminTotalTotes", totals.totes],
    ["adminTotalActive", formatMinutes(totals.activeMinutes)],
    ["adminTotalIncomplete", totals.incompletePallets],
  ].map(([key, value]) => {
    const card = document.createElement("div");
    card.className = "admin-total";
    const label = document.createElement("span");
    label.textContent = t(key);
    const number = document.createElement("strong");
    number.textContent = value;
    card.append(label, number);
    return card;
  }));

  elements.adminNote.hidden = false;
  elements.adminNote.textContent = t("adminNote", { minutes: idleGapMinutes });

  elements.adminReviewers.replaceChildren(...reviewers.map((reviewer) => {
    const card = document.createElement("article");
    card.className = "reviewer-card";
    const name = document.createElement("h3");
    name.textContent = reviewer.name;
    const meta = document.createElement("p");
    meta.className = "reviewer-meta";
    meta.textContent = t("adminShifts", {
      shifts: reviewer.shifts.join("، ") || "-",
      review: reviewer.stages.Review || 0,
      dispatch: reviewer.stages.Dispatch || 0,
    });

    const stats = document.createElement("dl");
    stats.className = "reviewer-stats";
    stats.append(
      adminStat(t("adminPallets"), reviewer.pallets),
      adminStat(t("adminTotes"), reviewer.totes),
      adminStat(t("adminFromTo"), `${clock(reviewer.firstScan)} - ${clock(reviewer.lastScan)}`),
      adminStat(t("adminActive"), formatMinutes(reviewer.activeMinutes)),
      adminStat(t("adminAvgPallet"), formatMinutes(reviewer.avgMinutesPerPallet)),
      adminStat(t("adminTotesPerHour"), reviewer.totesPerHour),
      adminStat(t("adminIncomplete"), reviewer.incompletePallets, reviewer.incompletePallets > 0),
    );

    const branches = document.createElement("p");
    branches.className = "reviewer-branches";
    branches.textContent = t("adminBranches", {
      branches: reviewer.branches
        .map((branch) => t("adminBranch", { branch: isolate(branch.branch), pallets: branch.pallets, totes: branch.totes }))
        .join(" · "),
    });

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = t("adminDetails", { count: reviewer.sessions.length });
    const wrap = document.createElement("div");
    wrap.className = "session-table-wrap";
    const table = document.createElement("table");
    table.className = "session-table";
    const head = table.createTHead().insertRow();
    for (const key of ["adminColTime", "adminColPallet", "adminColBranch", "adminColStage", "adminColTotes", "adminColMinutes"]) {
      const cell = document.createElement("th");
      cell.textContent = t(key);
      head.append(cell);
    }
    const body = table.createTBody();
    for (const session of [...reviewer.sessions].reverse()) {
      const row = body.insertRow();
      if (session.expected && session.scanned < session.expected) row.dataset.state = "incomplete";
      const values = [
        clock(session.start),
        session.pallet,
        session.branch,
        session.stage,
        session.expected ? `${session.scanned} / ${session.expected}` : session.scanned,
        formatMinutes(session.minutes),
      ];
      for (const value of values) row.insertCell().textContent = value;
    }
    wrap.append(table);
    details.append(summary, wrap);

    card.append(name, meta, stats, branches, details);
    return card;
  }));
}

function startPallet(pallet) {
  currentPalletBarcode = pallet.barcode;
  scannedContainers.clear();
  elements.palletInput.value = "";
  elements.palletScanCard.hidden = true;
  elements.scanFeedback.hidden = true;
  renderPallet(pallet);
  queueScanLog("pallet", pallet);
  elements.containerInput.focus();
}

async function checkEarlierReviews(pallet) {
  isCheckingHistory = true;
  elements.palletForm.querySelector('button[type="submit"]').disabled = true;
  showNotice("reviewChecking", {}, "info");
  try {
    const history = SCAN_LOG_ENDPOINT
      ? await fetchScriptJson({ action: "palletHistory", pallet: pallet.barcode })
      : { reviews: 0, totes: [], lastReview: null };
    const earlier = earlierReviews(pallet, history);
    clearNotice();
    if (!earlier.reviewed) {
      startPallet(pallet);
      return;
    }
    showReviewWarning(pallet, "reviewedBefore", {
      pallet: pallet.barcode,
      details: earlier.details,
      scanned: earlier.scanned,
      total: earlier.total,
    });
  } catch (error) {
    clearNotice();
    showReviewWarning(pallet, "reviewCheckFailed", {
      pallet: pallet.barcode,
      message: error instanceof Error ? error.message : t("scanLogUnknownError"),
    });
  } finally {
    isCheckingHistory = false;
    if (!pendingReviewPallet) elements.palletForm.querySelector('button[type="submit"]').disabled = false;
  }
}

function formatTime(date) {
  return new Intl.DateTimeFormat(currentLanguage === "ar" ? "ar-EG" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

async function refreshSheet() {
  if (isRefreshing) return;

  isRefreshing = true;
  elements.refreshButton.disabled = true;
  setSyncState("loading", "loading");
  try {
    const sheetData = buildPalletIndex(await loadSheetCsv());
    pallets = sheetData.pallets;
    toteAssignments = sheetData.toteAssignments;
    hasFreshSheet = true;
    elements.lastUpdated.dataset.updateTime = new Date().toISOString();
    elements.lastUpdated.dataset.palletCount = String(pallets.size);
    elements.lastUpdated.textContent = t("latestUpdate", {
      time: formatTime(new Date(elements.lastUpdated.dataset.updateTime)),
      count: pallets.size,
    });
    setSyncState("ok", "connected");
    clearNotice();

    if (currentPalletBarcode) {
      const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
      if (!pallet) {
        hideLeaveWarning();
        currentPalletBarcode = "";
        scannedContainers.clear();
        elements.palletScanCard.hidden = false;
        elements.palletResult.hidden = true;
        elements.palletInput.focus();
        showNotice("missingPallet");
      } else {
        const validScans = new Set(pallet.containers.keys());
        scannedContainers = new Set([...scannedContainers].filter((code) => validScans.has(code)));
        renderPallet(pallet);
      }
    }
  } catch (error) {
    hasFreshSheet = false;
    const message = error instanceof Error ? error.message : t("unknownError");
    setSyncState("error", "connectionError");
    showNotice("sheetLoadFailure", { message });
  } finally {
    isRefreshing = false;
    elements.refreshButton.disabled = false;
  }
}

function renderPallet(pallet) {
  elements.palletResult.hidden = false;
  elements.selectedPallet.textContent = pallet.barcode;
  const details = [pallet.location, pallet.destination].filter(Boolean);
  if (!details.length) details.push(t("palletDetailsFallback"));
  if (reviewerName) details.push(t("reviewerDetail", { name: reviewerName }));
  details.push(...[selectedShift, selectedStage].filter(Boolean));
  elements.palletDetails.textContent = details.join(" · ");
  elements.containerCount.textContent = t("palletCount", { count: pallet.containers.size });

  const list = document.createDocumentFragment();
  for (const [normalizedCode, barcode] of pallet.containers) {
    const item = document.createElement("li");
    item.className = "container-row";
    item.dataset.state = scannedContainers.has(normalizedCode) ? "scanned" : "pending";

    const code = document.createElement("span");
    code.className = "container-code";
    code.textContent = barcode;

    const state = document.createElement("span");
    state.className = "container-state";
    state.textContent = scannedContainers.has(normalizedCode) ? t("scanned") : t("pending");

    item.append(code, state);
    list.append(item);
  }
  elements.containerList.replaceChildren(list);

  const total = pallet.containers.size;
  const scanned = scannedContainers.size;
  const progress = total ? Math.round((scanned / total) * 100) : 0;
  elements.progressText.textContent = `${scanned} / ${total}`;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressBar.setAttribute("aria-valuemax", String(total));
  elements.progressBar.setAttribute("aria-valuenow", String(scanned));
}

function showScanFeedback(messageKey, values = {}, state = "success") {
  elements.scanFeedback.dataset.messageKey = messageKey;
  elements.scanFeedback.dataset.messageValues = JSON.stringify(values);
  elements.scanFeedback.dataset.state = state;
  elements.scanFeedback.hidden = false;
  renderScanFeedback();
}

function renderScanFeedback() {
  const messageKey = elements.scanFeedback.dataset.messageKey;
  const values = JSON.parse(elements.scanFeedback.dataset.messageValues || "{}");
  const message = document.createElement("div");
  message.className = "feedback-message";
  message.textContent = t(messageKey, values);
  elements.scanFeedback.replaceChildren(message);

  if (messageKey !== "wrongTotePallet") return;

  const assignmentList = document.createElement("ul");
  assignmentList.className = "assignment-list";
  for (const assignment of values.assignments) {
    const item = document.createElement("li");
    const branch = assignment.fields.destination?.join(", ") || t("palletDetailsFallback");
    const heading = document.createElement("h3");
    heading.textContent = t("assignmentPallet", {
      pallet: assignment.palletBarcode,
      branch,
    });
    item.append(heading);

    const details = document.createElement("dl");
    details.className = "assignment-details";
    const fields = {
      toteBarcode: assignment.containerBarcodes,
      ...assignment.fields,
    };
    for (const [key, fieldValues] of Object.entries(fields)) {
      if (!fieldValues?.length) continue;
      const group = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = t(key);
      const value = document.createElement("dd");
      value.textContent = fieldValues.join(", ");
      group.append(term, value);
      details.append(group);
    }
    item.append(details);
    assignmentList.append(item);
  }
  elements.scanFeedback.append(assignmentList);
}

elements.palletForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (isCheckingHistory || pendingReviewPallet) return;
  if (!hasFreshSheet) {
    showNotice("freshRequiredPallet");
    return;
  }
  if (!reviewerName) {
    showNotice("reviewerRequired");
    elements.reviewerSelect.focus();
    return;
  }
  if (!selectedShift) {
    showNotice("shiftRequired");
    elements.shiftSelect.focus();
    return;
  }
  if (!selectedStage) {
    showNotice("stageRequired");
    elements.stageSelect.focus();
    return;
  }

  const barcode = elements.palletInput.value.trim();
  const pallet = pallets.get(normalizeBarcode(barcode));

  if (!pallet) {
    showNotice(
      pallets.size
        ? "palletNotFound"
        : "sheetNotLoaded",
    );
    elements.palletInput.select();
    return;
  }

  clearNotice();
  // Only a Review is checked against earlier reviews; Dispatch scans a reviewed pallet on purpose.
  if (selectedStage === "Review") {
    checkEarlierReviews(pallet);
  } else {
    startPallet(pallet);
  }
});

elements.reviewContinueButton.addEventListener("click", () => {
  const pallet = pendingReviewPallet && pallets.get(normalizeBarcode(pendingReviewPallet.barcode));
  hideReviewWarning();
  if (!pallet) {
    showNotice("unavailablePallet");
    elements.palletInput.focus();
    return;
  }
  startPallet(pallet);
});

elements.reviewCancelButton.addEventListener("click", () => {
  hideReviewWarning();
  elements.palletInput.value = "";
  elements.palletInput.focus();
});

elements.containerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const scannedBarcode = elements.containerInput.value.trim();
  if (!scannedBarcode) return;

  if (!hasFreshSheet) {
    elements.containerInput.value = "";
    showScanFeedback("freshRequiredContainer", {}, "error");
    return;
  }

  const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
  if (!pallet) {
    elements.containerInput.value = "";
    showScanFeedback("unavailablePallet", {}, "error");
    return;
  }

  const normalizedCode = containerMatchKey(scannedBarcode);
  if (!pallet.containers.has(normalizedCode)) {
    elements.containerInput.value = "";
    const assignments = toteAssignments.get(normalizedCode) ?? [];
    if (assignments.length) {
      showScanFeedback(
        "wrongTotePallet",
        { container: scannedBarcode, currentPallet: pallet.barcode, assignments },
        "error",
      );
    } else {
      showScanFeedback("unknownTote", { container: scannedBarcode }, "error");
    }
    signalWrongTote();
    return;
  }

  if (scannedContainers.has(normalizedCode)) {
    elements.containerInput.value = "";
    showScanFeedback("duplicateContainer", { container: scannedBarcode }, "warning");
    return;
  }

  elements.containerInput.value = "";
  scannedContainers.add(normalizedCode);
  renderPallet(pallet);
  queueScanLog("tote", pallet, pallet.containers.get(normalizedCode));
  const remaining = pallet.containers.size - scannedContainers.size;
  showScanFeedback(
    remaining === 0
      ? "allScanned"
      : "containerAccepted",
    remaining === 0
      ? { count: pallet.containers.size, pallet: pallet.barcode }
      : { container: scannedBarcode, count: remaining },
  );
  elements.containerInput.focus();
});

elements.changePalletButton.addEventListener("click", () => {
  const pallet = pallets.get(normalizeBarcode(currentPalletBarcode));
  const remaining = pallet ? pallet.containers.size - scannedContainers.size : 0;
  if (remaining > 0) {
    showLeaveWarning(pallet, remaining);
    return;
  }
  leavePallet();
});

elements.leaveStayButton.addEventListener("click", () => {
  hideLeaveWarning();
  elements.containerInput.focus();
});

elements.leaveConfirmButton.addEventListener("click", leavePallet);

elements.lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = elements.lookupInput.value.trim();
  if (!query || isLookingUp) return;

  const submitButton = elements.lookupForm.querySelector('button[type="submit"]');
  isLookingUp = true;
  submitButton.disabled = true;
  lastLookup = { query, loading: true };
  renderLookup();
  try {
    if (!SCAN_LOG_ENDPOINT) throw new Error(t("scanLogNotConfigured"));
    const result = await fetchScriptJson({ action: "toteHistory", tote: query });
    lastLookup = { query, groups: buildToteGroups(result) };
  } catch (error) {
    lastLookup = { query, error: error instanceof Error ? error.message : t("scanLogUnknownError") };
  } finally {
    isLookingUp = false;
    submitButton.disabled = false;
  }
  renderLookup();
  elements.lookupInput.select();
});

elements.reviewerSelect.addEventListener("change", () => {
  reviewerName = elements.reviewerSelect.value;
  localStorage.setItem("shipping-check-reviewer", reviewerName);
  if (reviewerName && elements.notice.dataset.messageKey === "reviewerRequired") clearNotice();
});

elements.shiftSelect.addEventListener("change", () => {
  selectedShift = elements.shiftSelect.value;
  sessionStorage.setItem("shipping-check-shift", selectedShift);
  if (selectedShift && elements.notice.dataset.messageKey === "shiftRequired") clearNotice();
});

elements.stageSelect.addEventListener("change", () => {
  selectedStage = elements.stageSelect.value;
  sessionStorage.setItem("shipping-check-stage", selectedStage);
  if (selectedStage && elements.notice.dataset.messageKey === "stageRequired") clearNotice();
});

for (const tab of elements.viewTabs) {
  tab.addEventListener("click", () => showView(tab.dataset.view));
}
elements.branchRefreshButton.addEventListener("click", loadBranchProgress);
for (const tab of elements.adminTabs) {
  tab.addEventListener("click", () => showAdminTab(tab.dataset.adminTab));
}

elements.adminNameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.adminNameForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const result = await fetchScriptJson(
      { action: "addReviewer", token: sessionStorage.getItem(ADMIN_TOKEN_KEY) || "", name: elements.adminNewName.value },
      { method: "POST" },
    );
    setReviewerNames(result.names);
    elements.adminNewName.value = "";
    setAdminMessage("name", "adminNameAdded", { name: result.name }, "success");
  } catch (error) {
    if (error.code === "expired") {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      showAdminLogin("adminSessionEnded");
      return;
    }
    const messageKey = { duplicate: "adminNameDuplicate", invalidName: "adminNameInvalid" }[error.code] || "adminFailed";
    setAdminMessage("name", messageKey, { message: error instanceof Error ? error.message : "" });
  } finally {
    submitButton.disabled = false;
  }
});

elements.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = elements.adminLoginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setAdminMessage("login", null);
  try {
    if (!SCAN_LOG_ENDPOINT) throw new Error(t("scanLogNotConfigured"));
    const result = await fetchScriptJson(
      { action: "adminLogin", username: elements.adminUsername.value.trim(), password: elements.adminPassword.value },
      { method: "POST" },
    );
    sessionStorage.setItem(ADMIN_TOKEN_KEY, result.token);
    elements.adminLoginForm.hidden = true;
    elements.adminPanel.hidden = false;
    loadAdminReport();
  } catch (error) {
    const messageKey = { notSetUp: "adminNotSetUp", wrongLogin: "adminWrongLogin" }[error.code] || "adminFailed";
    setAdminMessage("login", messageKey, { message: error instanceof Error ? error.message : "" });
  } finally {
    elements.adminPassword.value = "";
    submitButton.disabled = false;
  }
});

elements.adminFilterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadAdminReport();
});

elements.adminLogoutButton.addEventListener("click", () => {
  const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  if (token && SCAN_LOG_ENDPOINT) {
    fetchScriptJson({ action: "adminLogout", token }, { method: "POST" }).catch(() => {});
  }
  elements.adminTotals.replaceChildren();
  elements.adminReviewers.replaceChildren();
  elements.adminNote.hidden = true;
  showAdminLogin();
});

elements.refreshButton.addEventListener("click", refreshSheet);
window.addEventListener("online", refreshSheet);
window.addEventListener("online", sendScanLogQueue);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshSheet();
});

elements.languageButton.addEventListener("click", () => {
  currentLanguage = currentLanguage === "ar" ? "en" : "ar";
  localStorage.setItem("shipping-check-language", currentLanguage);
  applyLanguage();
});

elements.themeButton.addEventListener("click", () => {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  localStorage.setItem("shipping-check-theme", currentTheme);
  applyTheme();
});

renderReviewerOptions();
loadReviewerNames();
elements.shiftSelect.value = selectedShift;
elements.stageSelect.value = selectedStage;
selectedShift = elements.shiftSelect.value;
selectedStage = elements.stageSelect.value;
applyTheme();
refreshSheet();
sendScanLogQueue();
window.setInterval(refreshSheet, REFRESH_INTERVAL_MS);
