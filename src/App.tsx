/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  RefreshCcw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sprout,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Globe
} from 'lucide-react';
import { analyzeCropImage, DiagnosisResult } from './services/geminiService';

type AppState = 'home' | 'preview' | 'analyzing' | 'result';

type Language = 'English' | 'Hindi' | 'Telugu' | 'Tamil' | 'Kannada' | 'Marathi';

const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'हिन्दी (Hindi)' },
  { code: 'Telugu', name: 'తెలుగు (Telugu)' },
  { code: 'Tamil', name: 'தமிழ் (Tamil)' },
  { code: 'Kannada', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'Marathi', name: 'मराठी (Marathi)' },
];

const TRANSLATIONS: Record<Language, any> = {
  English: {
    title: "Detect Crop Diseases Instantly",
    subtitle: "Protect your harvest with AI-powered plant diagnosis. Simple, fast, and accurate.",
    takePhoto: "Take Photo",
    uploadImage: "Upload Image",
    accurate: "Accurate",
    fast: "Fast",
    reliable: "Reliable",
    retake: "Re-take",
    analyze: "Analyze",
    analyzing: "Analyzing your crop...",
    identifying: "Our AI is identifying potential issues.",
    diagnosisResult: "Diagnosis Result",
    confidence: "Confidence",
    diseaseName: "Disease Name",
    treatmentPlan: "Treatment Plan",
    pesticides: "Recommended Pesticides",
    organic: "Organic",
    chemical: "Chemical",
    controlMeasures: "Control Measures",
    preventionMethods: "Prevention Methods",
    plantLifespan: "Plant Lifespan Info",
    remedies: "Remedies",
    startNew: "Start New Diagnosis",
    footer: "Empowering Farmers",
  },
  Hindi: {
    title: "फसल रोगों का तुरंत पता लगाएं",
    subtitle: "AI-संचालित पौधों के निदान के साथ अपनी फसल की रक्षा करें। सरल, तेज़ और सटीक।",
    takePhoto: "फोटो लें",
    uploadImage: "छवि अपलोड करें",
    accurate: "सटीक",
    fast: "तेज़",
    reliable: "विश्वसनीय",
    retake: "फिर से लें",
    analyze: "विश्लेषण करें",
    analyzing: "आपकी फसल का विश्लेषण किया जा रहा है...",
    identifying: "हमारा AI संभावित समस्याओं की पहचान कर रहा है।",
    diagnosisResult: "निदान परिणाम",
    confidence: "आत्मविश्वास",
    diseaseName: "रोग का नाम",
    treatmentPlan: "उपचार योजना",
    pesticides: "अनुशंसित कीटनाशक",
    organic: "जैविक",
    chemical: "रासायनिक",
    controlMeasures: "नियंत्रण उपाय",
    preventionMethods: "रोकथाम के तरीके",
    plantLifespan: "पौधे के जीवनकाल की जानकारी",
    remedies: "उपचार",
    startNew: "नया निदान शुरू करें",
    footer: "किसानों को सशक्त बनाना",
  },
  Telugu: {
    title: "పంట వ్యాధులను తక్షణమే గుర్తించండి",
    subtitle: "AI-ఆధారిత మొక్కల నిర్ధారణతో మీ పంటను రక్షించుకోండి. సరళమైనది, వేగవంతమైనది మరియు ఖచ్చితమైనది.",
    takePhoto: "ఫోటో తీయండి",
    uploadImage: "చిత్రాన్ని అప్‌లోడ్ చేయండి",
    accurate: "ఖచ్చితమైనది",
    fast: "వేగవంతమైనది",
    reliable: "నమ్మదగినది",
    retake: "మళ్ళీ తీయండి",
    analyze: "విశ్లేషించండి",
    analyzing: "మీ పంటను విశ్లేషిస్తోంది...",
    identifying: "మా AI సంభావ్య సమస్యలను గుర్తిస్తోంది.",
    diagnosisResult: "నిర్ధారణ ఫలితం",
    confidence: "ఖచ్చితత్వం",
    diseaseName: "వ్యాధి పేరు",
    treatmentPlan: "చికిత్స ప్రణాళిక",
    pesticides: "సిఫార్సు చేయబడిన పురుగుమందులు",
    organic: "సేంద్రియ",
    chemical: "రసాయన",
    controlMeasures: "నియంత్రణ చర్యలు",
    preventionMethods: "నివారణ పద్ధతులు",
    plantLifespan: "మొక్క జీవితకాల సమాచారం",
    remedies: "నివారణలు",
    startNew: "కొత్త నిర్ధారణను ప్రారంభించండి",
    footer: "రైతులకు సాధికారత",
  },
  Tamil: {
    title: "பயிர் நோய்களை உடனடியாகக் கண்டறியவும்",
    subtitle: "AI-ஆல் இயங்கும் தாவர நோயறிதல் மூலம் உங்கள் அறுவடையைப் பாதுகாக்கவும். எளிமையானது, வேகமானது மற்றும் துல்லியமானது.",
    takePhoto: "புகைப்படம் எடுக்கவும்",
    uploadImage: "படத்தைப் பதிவேற்றவும்",
    accurate: "துல்லியமானது",
    fast: "வேகமானது",
    reliable: "நம்பகமானது",
    retake: "மீண்டும் எடுக்கவும்",
    analyze: "பகுப்பாய்வு செய்",
    analyzing: "உங்கள் பயிரைப் பகுப்பாய்வு செய்கிறது...",
    identifying: "எங்கள் AI சாத்தியமான சிக்கல்களைக் கண்டறிகிறது.",
    diagnosisResult: "நோயறிதல் முடிவு",
    confidence: "நம்பிக்கை",
    diseaseName: "நோயின் பெயர்",
    treatmentPlan: "சிகிச்சை திட்டம்",
    pesticides: "பரிந்துரைக்கப்பட்ட பூச்சிக்கொல்லிகள்",
    organic: "இயற்கை",
    chemical: "ரசாயனம்",
    controlMeasures: "கட்டுப்பாட்டு நடவடிக்கைகள்",
    preventionMethods: "தடுப்பு முறைகள்",
    plantLifespan: "தாவர ஆயுட்காலம் தகவல்",
    remedies: "தீர்வுகள்",
    startNew: "புதிய நோயறிதலைத் தொடங்கவும்",
    footer: "விவசாயிகளுக்கு அதிகாரம் அளித்தல்",
  },
  Kannada: {
    title: "ಬೆಳೆ ರೋಗಗಳನ್ನು ತಕ್ಷಣವೇ ಪತ್ತೆಹಚ್ಚಿ",
    subtitle: "AI-ಚಾಲಿತ ಸಸ್ಯ ರೋಗನಿರ್ಣಯದೊಂದಿಗೆ ನಿಮ್ಮ ಸುಗ್ಗಿಯನ್ನು ರಕ್ಷಿಸಿ. ಸರಳ, ವೇಗ ಮತ್ತು ನಿಖರ.",
    takePhoto: "ಫೋಟೋ ತೆಗೆಯಿರಿ",
    uploadImage: "ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    accurate: "ನಿಖರ",
    fast: "ವೇಗ",
    reliable: "ನಂಬಲರ್ಹ",
    retake: "ಮತ್ತೆ ತೆಗೆಯಿರಿ",
    analyze: "ವಿಶ್ಲೇಷಿಸಿ",
    analyzing: "ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...",
    identifying: "ನಮ್ಮ AI ಸಂಭಾವ್ಯ ಸಮಸ್ಯೆಗಳನ್ನು ಗುರುತಿಸುತ್ತಿದೆ.",
    diagnosisResult: "ರೋಗನಿರ್ಣಯದ ಫಲಿತಾಂಶ",
    confidence: "ಆತ್ಮವಿಶ್ವಾಸ",
    diseaseName: "ರೋಗದ ಹೆಸರು",
    treatmentPlan: "ಚಿಕಿತ್ಸಾ ಯೋಜನೆ",
    pesticides: "ಶಿಫಾರಸು ಮಾಡಿದ ಕೀಟನಾಶಕಗಳು",
    organic: "ಸಾವಯವ",
    chemical: "ರಾಸಾಯನಿಕ",
    controlMeasures: "ನಿಯಂತ್ರಣ ಕ್ರಮಗಳು",
    preventionMethods: "ತಡೆಗಟ್ಟುವ ವಿಧಾನಗಳು",
    plantLifespan: "ಸಸ್ಯದ ಜೀವಿತಾವಧಿಯ ಮಾಹಿತಿ",
    remedies: "ಪರಿಹಾರಗಳು",
    startNew: "ಹೊಸ ರೋಗನಿರ್ಣಯವನ್ನು ಪ್ರಾರಂಭಿಸಿ",
    footer: "ರೈತರ ಸಬಲೀಕರಣ",
  },
  Marathi: {
    title: "पिकांवरील रोगांचे त्वरित निदान करा",
    subtitle: "AI-आधारित वनस्पती निदानासह आपल्या पिकाचे रक्षण करा. सोपे, जलद आणि अचूक.",
    takePhoto: "फोटो काढा",
    uploadImage: "फोटो अपलोड करा",
    accurate: "अचूक",
    fast: "जलद",
    reliable: "विश्वसनीय",
    retake: "पुन्हा घ्या",
    analyze: "विश्लेषण करा",
    analyzing: "तुमच्या पिकाचे विश्लेषण करत आहे...",
    identifying: "आमचे AI संभाव्य समस्या ओळखत आहे.",
    diagnosisResult: "निदान निकाल",
    confidence: "आत्मविश्वास",
    diseaseName: "रोगाचे नाव",
    treatmentPlan: "उपचार योजना",
    pesticides: "शिफारस केलेली कीटकनाशके",
    organic: "सेंद्रिय",
    chemical: "रासायनिक",
    controlMeasures: "नियंत्रण उपाय",
    preventionMethods: "प्रतिबंधात्मक पद्धती",
    plantLifespan: "वनस्पती आयुर्मान माहिती",
    remedies: "उपाय",
    startNew: "नवीन निदान सुरू करा",
    footer: "शेतकऱ्यांचे सक्षमीकरण",
  },
};

export default function App() {
  const [state, setState] = useState<AppState>('home');
  const [language, setLanguage] = useState<Language>('English');
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = TRANSLATIONS[language];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setState('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (isFallback = false) => {
    try {
      setError(null);
      setIsCameraActive(true);
      const constraints = isFallback 
        ? { video: true } 
        : { video: { facingMode: 'environment' } };
        
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      
      if (!isFallback && !(err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'))) {
        // Try fallback to any camera if environment camera fails for non-permission reasons
        startCamera(true);
        return;
      }

      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setError(
          language === 'English' 
            ? "Camera access is blocked. Please click the camera icon in your browser's address bar and select 'Allow', then try again."
            : language === 'Hindi'
            ? "कैमरा एक्सेस ब्लॉक है। कृपया अपने ब्राउज़र के एड्रेस बार में कैमरा आइकन पर क्लिक करें और 'Allow' चुनें, फिर से प्रयास करें।"
            : "Camera permission denied. Please enable it in settings or use 'Upload Image'."
        );
      } else {
        setError("Could not start camera. Please ensure your device has a camera and you are using a secure connection (HTTPS).");
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        setState('preview');
      }
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setState('analyzing');
    setError(null);
    try {
      const diagnosis = await analyzeCropImage(image, language);
      setResult(diagnosis);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setState('preview');
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setState('home');
    stopCamera();
  };

  return (
    <div className="min-h-screen bg-agri-light-green flex flex-col items-center p-4 sm:p-8">
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between mb-8 relative">
        <div className="flex items-center gap-2">
          <div className="bg-agri-green p-2 rounded-xl">
            <Sprout className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-agri-green tracking-tight">EverGrow</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1 px-3 py-2 bg-white rounded-xl shadow-sm border border-agri-green/10 text-agri-green font-bold text-sm"
            >
              <Globe className="w-4 h-4" />
              {LANGUAGES.find(l => l.code === language)?.name.split(' ')[0]}
            </button>
            
            <AnimatePresence>
              {showLangMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-agri-green/10 z-50 overflow-hidden"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-agri-light-green ${
                        language === lang.code ? 'text-agri-green bg-agri-light-green' : 'text-agri-brown'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {state !== 'home' && (
            <button 
              onClick={reset}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-agri-brown" />
            </button>
          )}
        </div>
      </header>

      <main className="w-full max-w-2xl flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* Home State */}
          {state === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col justify-center gap-8"
            >
              <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1.5 bg-agri-green/10 text-agri-green rounded-full text-sm font-bold tracking-wide mb-2">
                  Know the disease, grow the cure.
                </div>
                <h2 className="text-4xl font-bold text-agri-brown leading-tight">
                  {t.title.split(' ').map((word: string, i: number) => 
                    word === 'Instantly' || word === 'तुरंत' || word === 'తక్షణమే' || word === 'உடனடியாக' || word === 'ತಕ್ಷಣವೇ' || word === 'त्वरित' ? 
                    <span key={i} className="text-agri-green underline decoration-agri-accent">{word} </span> : word + ' '
                  )}
                </h2>
                <p className="text-agri-brown/70 text-lg max-w-md mx-auto">
                  {t.subtitle}
                </p>
              </div>

              <div className="grid gap-4">
                {isCameraActive ? (
                  <div className="relative rounded-3xl overflow-hidden bg-black aspect-square shadow-2xl">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                      <button onClick={takePhoto} className="btn-primary rounded-full w-20 h-20 p-0">
                        <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-full" />
                        </div>
                      </button>
                      <button onClick={stopCamera} className="btn-secondary rounded-full w-20 h-20 p-0 bg-white/20 border-white text-white">
                        <RefreshCcw className="w-8 h-8" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={startCamera} className="btn-primary py-8 text-xl">
                      <Camera className="w-8 h-8" />
                      {t.takePhoto}
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="btn-secondary py-8 text-xl">
                      <Upload className="w-8 h-8" />
                      {t.uploadImage}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />
                  </>
                )}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="text-agri-green w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">{t.accurate}</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Loader2 className="text-agri-green w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">{t.fast}</p>
                </div>
                <div className="space-y-2">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Info className="text-agri-green w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-60">{t.reliable}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Preview State */}
          {state === 'preview' && image && (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex-1 flex flex-col gap-6"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square bg-white">
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-3xl flex flex-col gap-4 text-red-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                    <p className="font-bold">{error}</p>
                  </div>
                  <button 
                    onClick={() => startCamera()}
                    className="bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button onClick={reset} className="btn-secondary">
                  <RefreshCcw className="w-5 h-5" />
                  {t.retake}
                </button>
                <button onClick={handleAnalyze} className="btn-primary">
                  <Search className="w-5 h-5" />
                  {t.analyze}
                </button>
              </div>
            </motion.div>
          )}

          {/* Analyzing State */}
          {state === 'analyzing' && (
            <motion.div 
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-8 text-center"
            >
              <div className="relative">
                <div className="w-32 h-32 border-8 border-agri-green/20 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-agri-green animate-spin" />
                </div>
                <motion.div 
                  className="absolute -inset-4 border-2 border-agri-green rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-agri-brown">{t.analyzing}</h3>
                <p className="text-agri-brown/60">EverGrow AI is identifying potential issues.</p>
              </div>
            </motion.div>
          )}

          {/* Result State */}
          {state === 'result' && result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col gap-6 pb-12"
            >
              {/* Status Banner */}
              <div className={`p-6 rounded-3xl flex items-center gap-4 shadow-lg ${
                result.status === 'Healthy' ? 'bg-agri-green text-white' : 'bg-orange-500 text-white'
              }`}>
                {result.status === 'Healthy' ? (
                  <CheckCircle2 className="w-12 h-12" />
                ) : (
                  <AlertTriangle className="w-12 h-12" />
                )}
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest opacity-80">{t.diagnosisResult}</p>
                  <h3 className="text-3xl font-bold">{result.status}</h3>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-bold opacity-80 uppercase">{t.confidence}</p>
                  <p className="text-2xl font-bold">{result.confidence}</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid gap-6">
                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-agri-green">
                    <Info className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-sm">{t.diseaseName}</h4>
                  </div>
                  <p className="text-2xl font-bold text-agri-brown">{result.diseaseName}</p>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-agri-green">
                    <RefreshCcw className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-sm">{t.treatmentPlan}</h4>
                  </div>
                  <ul className="space-y-3">
                    {result.treatmentPlan.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="bg-agri-light-green text-agri-green w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {i + 1}
                        </div>
                        <p className="text-agri-brown/80">{step}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-agri-green">
                    <AlertTriangle className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-sm">{t.pesticides}</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-agri-green uppercase mb-2">{t.organic}</p>
                      <div className="flex flex-wrap gap-2">
                        {result.pesticides.organic.map((p, i) => (
                          <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium border border-emerald-100">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-600 uppercase mb-2">{t.chemical}</p>
                      <div className="flex flex-wrap gap-2">
                        {result.pesticides.chemical.map((p, i) => (
                          <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium border border-orange-100">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-agri-green">
                    <RefreshCcw className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-sm">{t.controlMeasures}</h4>
                  </div>
                  <ul className="space-y-3">
                    {result.controlMeasures.map((measure, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="bg-agri-light-green text-agri-green w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {i + 1}
                        </div>
                        <p className="text-agri-brown/80">{measure}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-agri-green">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-sm">{t.preventionMethods}</h4>
                  </div>
                  <ul className="space-y-3">
                    {result.preventionMethods.map((method, i) => (
                      <li key={i} className="flex gap-3">
                        <div className="bg-agri-light-green text-agri-green w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <p className="text-agri-brown/80">{method}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-6 rounded-3xl space-y-4">
                  <div className="flex items-center gap-2 text-agri-green">
                    <Sprout className="w-5 h-5" />
                    <h4 className="font-bold uppercase tracking-wider text-sm">{t.plantLifespan}</h4>
                  </div>
                  <p className="text-agri-brown/80 leading-relaxed">{result.plantLifespan}</p>
                </div>
              </div>

              <button onClick={reset} className="btn-primary mt-4">
                <RefreshCcw className="w-5 h-5" />
                {t.startNew}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-agri-brown/40 text-sm font-medium">
        &copy; 2026 EverGrow AI • {t.footer}
      </footer>
    </div>
  );
}
