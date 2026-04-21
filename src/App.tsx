import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, 
  RotateCcw, 
  History, 
  CheckCircle2, 
  Sword,
  ShieldCheck,
  Zap,
  Target,
  User,
  Cpu
} from "lucide-react";

type GamePhase = "TOSS" | "TOSS_DECISION" | "PLAYING" | "INNINGS_BREAK" | "GAME_OVER";
type Team = "USER" | "CPU";
type Choice = "BAT" | "BOWL";
type TossResult = "HEADS" | "TAILS";

interface GameLog {
  user: number;
  cpu: number;
  result: "RUNS" | "OUT";
  scoreAtTime: number;
  runsScored?: number;
}

export default function App() {
  // Game State
  const [phase, setPhase] = useState<GamePhase>("TOSS");
  const [tossWinner, setTossWinner] = useState<Team | null>(null);
  const [battingTeam, setBattingTeam] = useState<Team | null>(null);
  const [innings, setInnings] = useState<number>(1);
  
  const [userScore, setUserScore] = useState<number>(0);
  const [cpuScore, setCpuScore] = useState<number>(0);
  const [target, setTarget] = useState<number | null>(null);
  const [isOut, setIsOut] = useState<boolean>(false);
  
  const [lastUserMove, setLastUserMove] = useState<number | null>(null);
  const [lastCpuMove, setLastCpuMove] = useState<number | null>(null);
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [message, setMessage] = useState<string>("Toss time! Heads or Tails?");

  // Stats
  const runRate = useMemo(() => {
    if (logs.length === 0) return "0.00";
    const totalRuns = battingTeam === "USER" ? userScore : cpuScore;
    return (totalRuns / logs.length).toFixed(2);
  }, [logs, userScore, cpuScore, battingTeam]);

  const winProb = useMemo(() => {
    if (innings === 1) return "50%";
    if (!target) return "50%";
    
    const chasing = battingTeam === "USER" ? userScore : cpuScore;
    const remaining = target - chasing;
    if (remaining <= 0) return "100%";
    
    // Simple heuristic
    const prob = Math.max(0, Math.min(100, 50 + (chasing / target) * 50 - (remaining / 50) * 10));
    return `${Math.round(prob)}%`;
  }, [innings, target, userScore, cpuScore, battingTeam]);

  // --- Game Actions ---

  const resetGame = () => {
    setPhase("TOSS");
    setTossWinner(null);
    setBattingTeam(null);
    setInnings(1);
    setUserScore(0);
    setCpuScore(0);
    setTarget(null);
    setIsOut(false);
    setLastUserMove(null);
    setLastCpuMove(null);
    setLogs([]);
    setMessage("Toss time! Heads or Tails?");
  };

  const handleToss = (choice: TossResult) => {
    const result = Math.random() > 0.5 ? "HEADS" : "TAILS";
    const winner = result === choice ? "USER" : "CPU";
    
    setTossWinner(winner);
    setPhase("TOSS_DECISION");
    
    if (winner === "CPU") {
      const cpuDecision = Math.random() > 0.5 ? "BAT" : "BOWL";
      setMessage(`CPU won the toss and chose to ${cpuDecision}!`);
      setTimeout(() => {
        setBattingTeam(cpuDecision === "BAT" ? "CPU" : "USER");
        setPhase("PLAYING");
        setMessage(cpuDecision === "BAT" ? "CPU Batting" : "You Batting");
      }, 1500);
    } else {
      setMessage("You won the toss! Select your role.");
    }
  };

  const handleTossDecision = (choice: Choice) => {
    setBattingTeam(choice === "BAT" ? "USER" : "CPU");
    setPhase("PLAYING");
    setMessage(choice === "BAT" ? "You Batting" : "CPU Batting");
  };

  const playTurn = (userNumber: number) => {
    if (isOut || phase !== "PLAYING") return;

    const cpuNumber = Math.floor(Math.random() * 6) + 1;
    setLastUserMove(userNumber);
    setLastCpuMove(cpuNumber);

    const isMatch = userNumber === cpuNumber;
    
    if (isMatch) {
      setIsOut(true);
      setMessage("OUT!");
      
      const currentScore = battingTeam === "USER" ? userScore : cpuScore;
      setLogs(prev => [{ user: userNumber, cpu: cpuNumber, result: "OUT", scoreAtTime: currentScore, runsScored: 0 }, ...prev]);

      setTimeout(() => {
        if (innings === 1) {
          setTarget(currentScore + 1);
          setPhase("INNINGS_BREAK");
          setMessage("End of Innings");
        } else {
          setPhase("GAME_OVER");
          setMessage("Game Over");
        }
      }, 1500);
    } else {
      const runs = battingTeam === "USER" ? userNumber : cpuNumber;
      
      if (battingTeam === "USER") {
        const newScore = userScore + runs;
        setUserScore(newScore);
        setLogs(prev => [{ user: userNumber, cpu: cpuNumber, result: "RUNS", scoreAtTime: newScore, runsScored: runs }, ...prev]);
        setMessage(`+${runs} Runs`);
        
        if (innings === 2 && target && newScore >= target) {
          setPhase("GAME_OVER");
          setMessage("User Wins!");
        }
      } else {
        const newScore = cpuScore + runs;
        setCpuScore(newScore);
        setLogs(prev => [{ user: userNumber, cpu: cpuNumber, result: "RUNS", scoreAtTime: newScore, runsScored: runs }, ...prev]);
        setMessage(`+${runs} Runs`);
        
        if (innings === 2 && target && newScore >= target) {
          setPhase("GAME_OVER");
          setMessage("CPU Wins!");
        }
      }
    }
  };

  const startSecondInnings = () => {
    setInnings(2);
    setBattingTeam(battingTeam === "USER" ? "CPU" : "USER");
    setIsOut(false);
    setLastUserMove(null);
    setLastCpuMove(null);
    setPhase("PLAYING");
    setMessage(battingTeam === "USER" ? "CPU Chasing" : "User Chasing");
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 font-sans select-none overflow-hidden">
      
      {/* Header */}
      <header className="flex-none h-20 border-b border-zinc-800 flex items-center justify-between px-10 bg-zinc-900/50 backdrop-blur-md z-50">
        <div className="flex items-center space-x-4">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse-soft"></div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Match Live</p>
            <h1 className="text-lg font-black tracking-tight uppercase">
              Championship Series <span className="text-zinc-600">/ Final</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">
              {battingTeam === "USER" ? <span className="text-emerald-500">User Batting</span> : "User Bowling"}
            </p>
            <p className="text-2xl font-black font-mono tracking-tighter">
              {userScore} <span className="text-zinc-600">/ {innings === 1 && battingTeam === "USER" ? "0" : (isOut && battingTeam === "USER" ? "1" : "0")}</span>
            </p>
          </div>
          <div className="w-px h-10 bg-zinc-800"></div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">
              Target
            </p>
            <p className="text-2xl font-black font-mono tracking-tighter text-amber-500">
              {target || "—"}
            </p>
          </div>
        </div>
      </header>

      {/* Main Gameplay Area */}
      <main className="flex-grow flex items-center justify-center p-12 relative overflow-hidden">
        
        {/* Background Grid Lines */}
        <div className="absolute inset-0 grid grid-cols-2 pointer-events-none opacity-5">
          <div className="border-r border-zinc-500"></div>
          <div></div>
        </div>

        <div className="w-full max-w-5xl z-10">
          <AnimatePresence mode="wait">
            
            {/* PLAYING PHASE */}
            {phase === "PLAYING" ? (
              <motion.div 
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-3 items-center gap-12"
              >
                {/* Player Move Card */}
                <div className="flex flex-col items-center space-y-6">
                  <div className={`card-move ${battingTeam === "USER" ? "card-move-player" : "card-move-cpu opacity-60"}`}>
                    <span className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] mb-4">Player Move</span>
                    <motion.div 
                      key={lastUserMove}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-9xl font-black font-mono text-white leading-none"
                    >
                      {lastUserMove || "—"}
                    </motion.div>
                  </div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Consistency: {(Math.random() * 10 + 90).toFixed(0)}%</p>
                </div>

                {/* Center Status */}
                <div className="flex flex-col items-center justify-center space-y-8">
                  <div className="text-center min-h-[140px] flex flex-col justify-center items-center">
                    <AnimatePresence mode="wait">
                      <motion.div 
                        key={message}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="badge-status mb-4">
                          <span className="badge-text">
                            {isOut ? "Wicket" : (lastUserMove ? "Safe Turn" : "Ready")}
                          </span>
                        </div>
                        <h2 className={`text-5xl font-black tracking-tighter italic uppercase ${isOut ? "text-red-500" : "text-white"}`}>
                          {message}
                        </h2>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  
                  <div className="w-16 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent"></div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-[280px]">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                      <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1 font-sans">Run Rate</p>
                      <p className="font-mono font-bold text-lg">{runRate}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 text-center">
                      <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1 font-sans">Prob. Win</p>
                      <p className="font-mono font-bold text-lg text-emerald-500">{winProb}</p>
                    </div>
                  </div>
                </div>

                {/* CPU Move Card */}
                <div className="flex flex-col items-center space-y-6">
                  <div className={`card-move ${battingTeam === "CPU" ? "card-move-player" : "card-move-cpu opacity-60"}`}>
                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-4">CPU Move</span>
                    <motion.div 
                      key={lastCpuMove}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-9xl font-black font-mono text-zinc-700 leading-none"
                    >
                      {lastCpuMove || "—"}
                    </motion.div>
                  </div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Difficulty: Grandmaster</p>
                </div>
              </motion.div>
            ) : phase === "GAME_OVER" ? (
              <motion.div 
                key="game-over"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-8"
              >
                <div className="flex justify-center space-x-12">
                   <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">User Total</p>
                      <p className="text-8xl font-black font-mono tracking-tighter text-white">{userScore}</p>
                   </div>
                   <div className="w-px h-24 bg-zinc-800 self-center"></div>
                   <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">CPU Total</p>
                      <p className="text-8xl font-black font-mono tracking-tighter text-zinc-700">{cpuScore}</p>
                   </div>
                </div>
                
                <h2 className="text-6xl font-black italic uppercase tracking-tighter">
                  {userScore > cpuScore ? "You Triumph" : userScore < cpuScore ? "CPU Dominates" : "Strategic Tie"}
                </h2>
                
                <button 
                  onClick={resetGame}
                  className="px-12 py-4 bg-emerald-500 text-zinc-950 rounded-full font-black uppercase tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-5 h-5" /> Replay Series
                </button>
              </motion.div>
            ) : phase === "INNINGS_BREAK" ? (
              <motion.div 
                key="break"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-6"
              >
                <h2 className="text-5xl font-black uppercase italic">Innings Switch</h2>
                <div className="badge-status">
                   <span className="badge-text italic">Target Score: {target}</span>
                </div>
                <button 
                  onClick={startSecondInnings}
                  className="block mx-auto px-12 py-4 border border-zinc-700 rounded-full font-black uppercase tracking-widest hover:bg-zinc-800 transition-all"
                >
                  Start Chase
                </button>
              </motion.div>
            ) : phase === "TOSS" ? (
              <motion.div 
                key="toss"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="badge-status mb-8">
                  <span className="badge-text">Match Initiation</span>
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tighter italic mb-12">Select Coin Face</h2>
                <div className="flex space-x-6">
                  <button 
                    onClick={() => handleToss("HEADS")}
                    className="w-48 h-48 rounded-full border-2 border-zinc-800 flex flex-col items-center justify-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                  >
                    <Zap className="w-12 h-12 text-zinc-500 group-hover:text-emerald-500 mb-2 transition-colors" />
                    <span className="font-black uppercase tracking-widest text-sm">Heads</span>
                  </button>
                  <button 
                    onClick={() => handleToss("TAILS")}
                    className="w-48 h-48 rounded-full border-2 border-zinc-800 flex flex-col items-center justify-center hover:border-emerald-500 hover:bg-emerald-500/5 transition-all group"
                  >
                    <Zap className="w-12 h-12 text-zinc-500 group-hover:text-emerald-500 mb-2 transition-colors" />
                    <span className="font-black uppercase tracking-widest text-sm">Tails</span>
                  </button>
                </div>
              </motion.div>
            ) : phase === "TOSS_DECISION" && tossWinner === "USER" ? (
              <motion.div 
                key="decision"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center"
              >
                <div className="badge-status mb-8">
                  <span className="badge-text">Toss Won</span>
                </div>
                <h2 className="text-5xl font-black uppercase tracking-tighter italic mb-12">Executive Decision</h2>
                <div className="flex space-x-6 justify-center">
                  <button 
                    onClick={() => handleTossDecision("BAT")}
                    className="px-16 py-6 bg-emerald-500 rounded-2xl flex flex-col items-center justify-center hover:bg-emerald-400 transition-all font-black text-zinc-950 uppercase tracking-widest"
                  >
                    <Sword className="w-8 h-8 mb-2" />
                    Batting
                  </button>
                  <button 
                    onClick={() => handleTossDecision("BOWL")}
                    className="px-16 py-6 border-2 border-zinc-700 rounded-2xl flex flex-col items-center justify-center hover:bg-zinc-800 transition-all font-black uppercase tracking-widest"
                  >
                    <ShieldCheck className="w-8 h-8 mb-2" />
                    Bowling
                  </button>
                </div>
              </motion.div>
            ) : (
               <div className="text-zinc-500 font-black uppercase tracking-widest animate-pulse">Calculating...</div>
            )}
            
          </AnimatePresence>
        </div>

        {/* Floating Page Indicators */}
        <div className="absolute bottom-10 left-10 flex space-x-2">
          <div className={`w-2 h-2 rounded-full ${phase === "TOSS" ? "bg-emerald-500" : "bg-zinc-800"}`} />
          <div className={`w-2 h-2 rounded-full ${phase === "PLAYING" ? "bg-emerald-500" : "bg-zinc-800"}`} />
          <div className={`w-2 h-2 rounded-full ${phase === "GAME_OVER" ? "bg-emerald-500" : "bg-zinc-800"}`} />
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="flex-none h-48 bg-zinc-900 border-t border-zinc-800 px-12 py-8 relative">
        <div className="max-w-4xl mx-auto flex flex-col items-center space-y-6">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
            Select Your Number
          </p>
          <div className="flex space-x-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                disabled={isOut || phase !== "PLAYING"}
                onClick={() => playTurn(num)}
                className={`btn-number ${lastUserMove === num ? "btn-number-active" : ""}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Mini Game History Slide-in (Optional sidebar-like detail) */}
        {logs.length > 0 && (
           <div className="absolute top-0 right-10 h-full flex items-center">
              <div className="flex space-x-1 opacity-20 hover:opacity-100 transition-opacity">
                 {logs.slice(0, 8).map((log, i) => (
                    <div key={i} className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold ${log.result === "OUT" ? "bg-red-500 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                       {log.runsScored || "W"}
                    </div>
                 ))}
              </div>
           </div>
        )}
      </footer>

    </div>
  );
}
