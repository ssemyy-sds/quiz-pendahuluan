import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  LogOut, Search, Trash2, Download, Clock, AlertCircle,
  Settings, Lock, ArrowRight, ArrowLeft, CheckCircle2, XCircle,
  BarChart3, Users, BookOpen
} from 'lucide-react';

// ==========================================
// 1. KONFIGURASI FIREBASE
// Silakan ganti dengan konfigurasi Firebase Anda
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAhU5LRLyxyuNJkcVk7ZN5ScVMuqJKg_Y8",
  authDomain: "kuis-elektronika-digital.firebaseapp.com",
  projectId: "kuis-elektronika-digital",
  storageBucket: "kuis-elektronika-digital.firebasestorage.app",
  messagingSenderId: "1038657998027",
  appId: "1:1038657998027:web:5a28a3f37557c986e4df4e",
  measurementId: "G-DK1S5C74K8"
};

// Inisialisasi Firebase (Bungkus dalam try-catch agar tidak crash jika config kosong)
let app, db: any, auth: any;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase belum dikonfigurasi dengan benar:", error);
}

// ==========================================
// 2. DATA SOAL
// ==========================================
const QUESTIONS = [
  {
    id: 1,
    question: "Berdasarkan modul, bagaimana karakteristik utama sinyal keluaran dari gerbang logika AND?",
    options: [
      "Keluaran akan bernilai tinggi (1) hanya jika semua sinyal masukan dalam keadaan tinggi (1).",
      "Keluaran akan bernilai tinggi (1) jika salah satu dari sinyal masukan dalam keadaan tinggi (1).",
      "Keluaran akan bernilai rendah (0) hanya jika semua sinyal masukan dalam keadaan tinggi (1).",
      "Keluaran akan selalu bernilai sama dengan input yang memiliki nilai terendah."
    ],
    correctIndex: 0
  },
  {
    id: 2,
    question: "Menurut aturan dasar yang dituliskan pada prosedur langkah kerja gerbang logika di modul, kondisi manakah yang merepresentasikan logika 0?",
    options: [
      "Saklar dalam kondisi tertutup dan lampu LED menyala.",
      "Saklar dalam kondisi terbuka dan lampu LED mati.",
      "Tegangan mencapai di atas 5 Volt.",
      "Saklar dalam kondisi terbuka namun lampu LED berkedip."
    ],
    correctIndex: 1
  },
  {
    id: 3,
    question: "Pada Percobaan II mengenai Gerbang OR, tipe IC (Integrated Circuit) apa yang diinstruksikan untuk digunakan pada rangkaian?",
    options: ["IC 7408", "IC 7432", "IC 7476", "IC 74151"],
    correctIndex: 1
  },
  {
    id: 4,
    question: "Berdasarkan tabel kebenaran JK Flip-Flop, keadaan 'Toggle' (keluaran berbalik dari kondisi sebelumnya) akan terjadi jika parameter masukan berada pada kondisi...",
    options: [
      "J = LOW dan K = LOW dengan transisi Clock",
      "J = HIGH dan K = LOW dengan transisi Clock",
      "J = HIGH dan K = HIGH dengan adanya transisi Clock",
      "J = LOW dan K = HIGH dengan transisi Clock"
    ],
    correctIndex: 2
  },
  {
    id: 5,
    question: "Pada operasi rangkaian JK Flip-Flop menggunakan IC 7476, apa mode atau hasil yang didapat pada keluaran Q jika kondisi kaki asinkronnya diset PRE = 0 dan CLR = 1?",
    options: ["Mode SET (Q = 1, Q' = 0)", "Mode RESET (Q = 0, Q' = 1)", "Mode No Change", "Mode Toggle"],
    correctIndex: 0
  },
  {
    id: 6,
    question: "Sesuai penjelasan dalam modul, apa definisi paling tepat untuk perangkat Multiplexer?",
    options: [
      "Perangkat yang mengambil data dari satu saluran input dan membaginya ke banyak saluran keluaran.",
      "Suatu rangkaian di mana jalur data yang banyak diseleksi salurannya ke dalam sebuah jalur keluaran tunggal.",
      "Sistem yang mampu mengubah sinyal listrik analog menjadi sinyal bilangan biner digital.",
      "Rangkaian sekuensial yang selalu mempertahankan kondisi keluaran secara permanen hingga daya dimatikan."
    ],
    correctIndex: 1
  },
  {
    id: 7,
    question: "Dalam eksperimen Multiplexer 8-ke-1 dengan menggunakan IC 74151, berapa jumlah bit selektor data (input pemilih data) yang diperlukan untuk bisa memilih 8 saluran masukannya?",
    options: ["1 bit", "2 bit", "3 bit", "8 bit"],
    correctIndex: 2
  },
  {
    id: 8,
    question: "Proses mentransmisikan data masukan yang datang dari sebuah kanal tunggal lalu didistribusikan ke salah satu dari beberapa jalur keluaran disebut?",
    options: ["Multiplexing", "Demultiplexing", "Toggling", "Synchronizing"],
    correctIndex: 1
  },
  {
    id: 9,
    question: "Pada Percobaan IV, ketika membangun rangkaian Demultiplexer 1 ke 2 menggunakan IC 7400 gerbang NAND, jalur data mana yang menjadi pemilih/selektor (selector)?",
    options: ["Jalur D", "Jalur A", "Jalur Y0", "Jalur Y1"],
    correctIndex: 1
  },
  {
    id: 10,
    question: "Perbedaan fungsional paling mencolok antara rangkaian kombinasi dasar (seperti AND, OR) yang dipraktekkan di awal modul dengan JK Flip-Flop adalah...",
    options: [
      "Gerbang kombinasi tidak memiliki siklus 'Clock' dan tidak dapat menyimpan status/data.",
      "Gerbang kombinasi memerlukan lebih banyak tegangan dibandingkan Flip-Flop.",
      "Flip-flop JK hanya memiliki satu masukan sinyal sedangkan gerbang logika punya banyak.",
      "Flip-flop selalu mengubah sinyal digital menjadi sinyal analog."
    ],
    correctIndex: 0
  }
];

const QUIZ_DURATION = 300; // 5 menit dalam detik

// Helper function untuk acak array
function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function App() {
  const [appState, setAppState] = useState<'login' | 'quiz' | 'result' | 'adminLogin' | 'admin'>('login');
  const [student, setStudent] = useState({ name: '', npm: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<typeof QUESTIONS>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION);
  const [finalScore, setFinalScore] = useState(0);

  // Admin State
  const [adminPin, setAdminPin] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------
  // LOGIN LOGIC
  // ----------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!student.name || !student.npm) {
      setErrorMsg('Nama dan NPM wajib diisi!');
      return;
    }
    if (!db || !auth) {
      setErrorMsg('Sistem belum terhubung ke database. Harap cek konfigurasi Firebase.');
      return;
    }

    setLoading(true);
    try {
      // 1. Sign in Anonymously
      await signInAnonymously(auth);
      
      // 2. Cek apakah NPM sudah mengerjakan kuis
      const docRef = doc(db, 'quiz_results', student.npm.trim());
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setErrorMsg('NPM ini sudah pernah mengerjakan kuis. Anda tidak diizinkan mengulang.');
        setLoading(false);
        return;
      }

      // 3. Setup Quiz
      setQuizQuestions(shuffleArray(QUESTIONS));
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeLeft(QUIZ_DURATION);
      setAppState('quiz');
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // QUIZ LOGIC
  // ----------------------------------------
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (appState === 'quiz') {
      if (timeLeft <= 0) {
        submitQuiz();
      } else {
        timer = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [appState, timeLeft]);

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const submitQuiz = async () => {
    setLoading(true);
    let correctCount = 0;
    
    // Hitung skor berdasarkan referensi soal asli
    QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const calculatedScore = (correctCount / QUESTIONS.length) * 100;
    
    try {
      const docRef = doc(db, 'quiz_results', student.npm.trim());
      await setDoc(docRef, {
        nama: student.name,
        npm: student.npm.trim(),
        score: calculatedScore,
        answers: answers,
        completedAt: serverTimestamp()
      });
      setFinalScore(calculatedScore);
      setAppState('result');
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal menyimpan hasil kuis.');
      alert('Gagal menyimpan ke database. Mohon screenshot hasil jika error berlanjut.');
      setFinalScore(calculatedScore);
      setAppState('result');
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------
  // ADMIN LOGIC
  // ----------------------------------------
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin === 'admin123') {
      try {
        if (auth) {
          await signInAnonymously(auth);
        }
        setAppState('admin');
        fetchResults();
      } catch (err: any) {
        setErrorMsg('Gagal terhubung ke database. Pastikan konfigurasi Firebase benar.');
      }
    } else {
      setErrorMsg('PIN Admin salah!');
    }
  };

  const fetchResults = async () => {
    if (!db) return;
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'quiz_results'));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by completedAt descending
      data.sort((a, b) => {
        const timeA = a.completedAt?.seconds || 0;
        const timeB = b.completedAt?.seconds || 0;
        return timeB - timeA;
      });
      setResults(data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (npm: string) => {
    if (!db) return;
    if (window.confirm(`Yakin ingin menghapus data dengan NPM/ID ${npm}? Mahasiswa ini akan bisa mengulang kuis.`)) {
      try {
        await deleteDoc(doc(db, 'quiz_results', npm));
        await fetchResults(); // Wait for fetch
        alert('Data berhasil dihapus!');
      } catch (error: any) {
        console.error('Error deleting doc:', error);
        alert(`Gagal menghapus data. Pesan error: ${error.message}\n\nPastikan Rules Firestore Anda mengizinkan operasi delete (hapus).`);
      }
    }
  };

  const exportCSV = () => {
    const headers = ["NPM", "Nama", "Nilai", "Waktu Selesai"];
    const rows = results.map(r => {
      const dateStr = r.completedAt ? new Date(r.completedAt.seconds * 1000).toLocaleString('id-ID') : '-';
      return [r.npm, `"${r.nama}"`, r.score, `"${dateStr}"`];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rekap_nilai_kuis_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Item Analysis (Statistik Kesulitan Soal)
  const itemAnalysis = useMemo(() => {
    if (results.length === 0) return [];
    const analysis = QUESTIONS.map(q => {
      let wrongCount = 0;
      results.forEach(res => {
        const answer = res.answers?.[q.id];
        if (answer !== q.correctIndex) {
          wrongCount++;
        }
      });
      const wrongPercentage = Math.round((wrongCount / results.length) * 100);
      return { ...q, wrongPercentage, wrongCount };
    });
    return analysis.sort((a, b) => b.wrongPercentage - a.wrongPercentage).slice(0, 3);
  }, [results]);

  const filteredResults = results.filter(r => 
    r.npm.includes(searchQuery) || r.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // RENDERERS
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-200">
      
      {/* 1. LOGIN SCREEN */}
      {appState === 'login' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
            <div className="bg-blue-600 p-8 text-center text-white">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-100" />
              <h1 className="text-2xl font-bold tracking-tight">Kuis Post-test</h1>
              <p className="text-blue-100 mt-2 font-medium">Elektronika Digital</p>
            </div>
            <div className="p-8">
              {errorMsg && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg flex items-start text-sm border border-red-100">
                  <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                  <input
                    type="text"
                    value={student.name}
                    onChange={(e) => setStudent({ ...student, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">NPM</label>
                  <input
                    type="text"
                    value={student.npm}
                    onChange={(e) => setStudent({ ...student, npm: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Masukkan NPM (contoh: 2201010)"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors flex justify-center items-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                >
                  {loading ? 'Memproses...' : 'Mulai Kuis'}
                  {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                </button>
              </form>
            </div>
          </div>
          
          {/* Hidden Admin Button */}
          <button 
            onClick={() => { setAppState('adminLogin'); setErrorMsg(''); setAdminPin(''); }}
            className="absolute bottom-6 right-6 text-slate-300 hover:text-slate-500 transition-colors p-2"
            title="Admin Dashboard"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 2. ADMIN LOGIN SCREEN */}
      {appState === 'adminLogin' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="text-center mb-8">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Akses Asisten Dosen</h2>
            </div>
            
            {errorMsg && (
              <div className="mb-4 text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{errorMsg}</div>
            )}
            
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <input
                type="password"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 text-center text-lg tracking-[0.2em] outline-none"
                placeholder="PIN"
                required
              />
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setAppState('login'); setErrorMsg(''); }}
                className="w-full text-slate-500 hover:text-slate-700 py-2 text-sm font-medium mt-2"
              >
                Kembali
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. QUIZ SCREEN */}
      {appState === 'quiz' && (
        <div className="max-w-3xl mx-auto p-4 md:p-8 min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Kuis Post-test</p>
              <h2 className="text-xl font-bold text-slate-800">Elektronika Digital</h2>
            </div>
            <div className={`flex items-center px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
              <Clock className="w-5 h-5 mr-2" />
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-slate-500 mb-2">
              <span>Pertanyaan {currentQuestionIndex + 1} dari {quizQuestions.length}</span>
              <span>{Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}% Selesai</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="flex-grow">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <h3 className="text-lg md:text-xl font-medium text-slate-800 leading-relaxed mb-6">
                {quizQuestions[currentQuestionIndex]?.question}
              </h3>
              <div className="space-y-3">
                {quizQuestions[currentQuestionIndex]?.options.map((option, idx) => {
                  const isSelected = answers[quizQuestions[currentQuestionIndex].id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(quizQuestions[currentQuestionIndex].id, idx)}
                      className={`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-start group ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 shrink-0 flex items-center justify-center mt-0.5 transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 group-hover:border-blue-400'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className={`text-base leading-relaxed ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center mt-auto pt-6">
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="flex items-center px-6 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Sebelumnya
            </button>

            {currentQuestionIndex === quizQuestions.length - 1 ? (
              <button
                onClick={submitQuiz}
                disabled={loading}
                className="flex items-center px-8 py-3 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 disabled:opacity-70 transition-colors"
              >
                {loading ? 'Mengirim...' : 'Selesai & Kumpulkan'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(quizQuestions.length - 1, prev + 1))}
                className="flex items-center px-8 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-colors"
              >
                Selanjutnya
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. RESULT SCREEN */}
      {appState === 'result' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Terima Kasih!</h2>
            <p className="text-slate-500 mb-8 font-medium">{student.name} ({student.npm})</p>
            
            <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-200">
              <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">Nilai Akhir Anda</p>
              <div className="text-5xl font-black text-blue-600">{finalScore}</div>
            </div>

            <p className="text-sm text-slate-500">Jawaban Anda telah tersimpan dengan aman di database. Anda dapat menutup halaman ini sekarang.</p>
            
            <button
              onClick={() => window.location.reload()}
              className="mt-8 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      )}

      {/* 5. ADMIN DASHBOARD */}
      {appState === 'admin' && (
        <div className="h-screen bg-slate-100 flex flex-col font-sans overflow-hidden w-full">
          {/* Top Navigation Bar */}
          <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Lab Elektronika Digital</h1>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Administrator Dashboard • Pin: admin123</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari NPM atau Nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => { setAppState('login'); setAdminPin(''); }}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </nav>

          {/* Main Bento Grid Content */}
          <main className="p-6 grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-6 flex-1 overflow-auto md:overflow-hidden">
            
            {/* Stat Card 1: Total Participants */}
            <div className="md:col-span-3 md:row-span-1 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Peserta</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">{results.length}</span>
                <span className="text-green-500 text-sm font-bold mb-1 flex items-center">
                  <Users className="w-3 h-3 mr-1" /> Mhs
                </span>
              </div>
            </div>

            {/* Stat Card 2: Average Score */}
            <div className="md:col-span-3 md:row-span-1 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rata-rata Nilai</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">
                  {results.length > 0 ? (results.reduce((acc, curr) => acc + curr.score, 0) / results.length).toFixed(1) : '0'}
                </span>
                <span className="text-slate-400 text-sm font-medium mb-1">/ 100</span>
              </div>
            </div>

            {/* Stat Card 3: Highest Score / Completion */}
            <div className="md:col-span-3 md:row-span-1 bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-center shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Nilai Tertinggi</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800">
                  {results.length > 0 ? Math.max(...results.map(r => r.score)) : '0'}
                </span>
                <span className="text-amber-500 text-sm font-bold mb-1">Poin</span>
              </div>
            </div>

            {/* Stat Card 4: System Status */}
            <div className="md:col-span-3 md:row-span-1 bg-slate-900 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase truncate">Database Status</p>
                <p className="text-sm font-bold text-white truncate">Connected Firestore v10</p>
              </div>
            </div>

            {/* Main Data Table: Results Recap */}
            <div className="md:col-span-8 md:row-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h2 className="font-bold text-slate-800">Rekap Nilai Mahasiswa</h2>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-500">
                  Displaying {filteredResults.length} of {results.length} records
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase sticky top-0 border-b border-slate-100 z-10">
                    <tr>
                      <th className="px-6 py-4 whitespace-nowrap">Mahasiswa</th>
                      <th className="px-6 py-4 whitespace-nowrap">NPM</th>
                      <th className="px-6 py-4 whitespace-nowrap">Waktu Selesai</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">Nilai</th>
                      <th className="px-6 py-4 whitespace-nowrap text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">Memuat data...</td></tr>
                    ) : filteredResults.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">Tidak ada data ditemukan.</td></tr>
                    ) : (
                      filteredResults.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 font-semibold text-slate-700 whitespace-nowrap">{res.nama}</td>
                          <td className="px-6 py-4 font-mono text-slate-500 whitespace-nowrap">{res.npm}</td>
                          <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                            {res.completedAt ? new Date(res.completedAt.seconds * 1000).toLocaleTimeString('id-ID', {
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                              res.score >= 70 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {res.score}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleDelete(res.id)}
                              className="p-2 text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-2"
                              title="Hapus data agar bisa mengulang"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-xs font-semibold">Hapus</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Item Analysis: Hardest Questions */}
            <div className="md:col-span-4 md:row-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col p-5 overflow-hidden">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4 shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Analisis Soal Tersulit
              </h2>
              
              <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                {itemAnalysis.length > 0 ? itemAnalysis.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold text-slate-500 uppercase">Soal #{item.id}</span>
                      <span className="text-red-500 font-bold">{item.wrongPercentage}% Salah</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${item.wrongPercentage}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed" title={item.question}>
                      "{item.question}"
                    </p>
                  </div>
                )) : (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Belum ada data untuk dianalisis.
                  </div>
                )}

                {itemAnalysis.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-slate-100 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-900 mb-2">Rekomendasi Asisten:</h3>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Perhatikan soal dengan tingkat kesalahan tertinggi. Disarankan untuk memberikan penguatan materi pada topik tersebut sebelum praktikum modul berikutnya.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 pt-4 shrink-0">
                <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                  Real-time Engine Active
                </div>
              </div>
            </div>

          </main>
        </div>
      )}

    </div>
  );
}

