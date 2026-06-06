import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { UploadCloud, Briefcase, Users, CheckCircle, Loader2, BarChart2, Info } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Master dictionary of tech skills to power the Gap Analysis Engine
const TECH_DICTIONARY = [
  "python", "java", "javascript", "react", "fastapi", "sql", "docker", 
  "kubernetes", "aws", "azure", "machine learning", "nlp", "pandas", 
  "numpy", "scikit-learn", "tensorflow", "pytorch", "node.js", "express", "mongodb", "html", "css", "c++"
];

const EJLogo = () => (
  <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <rect width="100" height="100" rx="20" fill="url(#grad)" />
    <path d="M30 30 H60 M30 50 H50 M30 70 H60 M30 30 V70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M55 30 H80 M70 30 V60 C70 70 60 75 50 70" stroke="#60A5FA" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1E3A8A" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
  </svg>
);

function App() {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [rankings, setRankings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- Advanced Skill Gap Engine ---
  const analyzeGaps = useCallback((candidateSkills) => {
    const jdLower = jobDescription.toLowerCase();
    const requiredSkills = TECH_DICTIONARY.filter(skill => jdLower.includes(skill));
    const candSkillsLower = candidateSkills.map(s => s.toLowerCase());
    const missing = requiredSkills.filter(skill => !candSkillsLower.includes(skill));
    
    return {
      required: requiredSkills.length,
      missing: missing
    };
  }, [jobDescription]);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/jobs?title=${encodeURIComponent(jobTitle)}&description=${encodeURIComponent(jobDescription)}`);
      setActiveJobId(response.data.job_id);
      toast.success('Job Profile Locked. Ready for resumes!', { style: { background: '#1e293b', color: '#fff' }});
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create job.', { style: { background: '#7f1d1d', color: '#fff' }});
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setIsLoading(true);
    const toastId = toast.loading('Parsing candidate data...', { style: { background: '#1e293b', color: '#fff' }});

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(`${API_BASE_URL}/resumes/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        setUploadedResumes(prev => [...prev, {
          filename: file.name,
          candidate: response.data.candidate_detected || 'Unknown',
          status: 'success'
        }]);
      } catch (error) {
        toast.error(`Failed to parse ${file.name}`, { style: { background: '#7f1d1d', color: '#fff' }});
      }
    }
    toast.dismiss(toastId);
    toast.success('Upload complete!', { style: { background: '#1e293b', color: '#fff' }});
    setIsLoading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'] } });

  const handleRankCandidates = async () => {
    if (!activeJobId) return;
    setIsLoading(true);
    const toastId = toast.loading('Calculating match scores...', { style: { background: '#1e293b', color: '#fff' }});

    try {
      const response = await axios.post(`${API_BASE_URL}/jobs/${activeJobId}/rank`);
      setRankings(response.data.rankings);
      toast.success('Analysis Complete!', { id: toastId, style: { background: '#1e293b', color: '#fff' }});
    } catch (error) {
      toast.error('Failed to rank candidates.', { id: toastId, style: { background: '#7f1d1d', color: '#fff' }});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-900 selection:text-blue-100 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <Toaster position="top-right" />
      
      <header className="max-w-7xl mx-auto mb-10 pt-8 px-8 relative z-10">
        <h1 className="text-5xl font-black flex items-center gap-4 tracking-tight text-white">
          <motion.div whileHover={{ rotate: -5, scale: 1.05 }} className="cursor-pointer">
            <EJLogo />
          </motion.div>
          Resume GPT
        </h1>
        <p className="text-slate-400 mt-3 text-lg font-medium tracking-wide">Automated candidate screening and semantic skills validation.</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 px-8 pb-12 relative z-10">
        
        {/* Left Panel: Inputs */}
        <div className="xl:col-span-4 space-y-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-slate-800">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-white"><Briefcase className="w-5 h-5 text-blue-400"/> 1. Define Target Profile</h2>
            <form onSubmit={handleCreateJob} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Title</label>
                <input 
                  type="text" required
                  className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all text-white placeholder-slate-600"
                  value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Python Engineer"
                  disabled={activeJobId !== null}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Description & Requirements</label>
                <textarea 
                  required rows="6"
                  className="w-full p-4 bg-slate-950/50 border border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none text-white placeholder-slate-600"
                  value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  disabled={activeJobId !== null}
                />
              </div>
              {!activeJobId ? (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-900/30">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Lock Job Requirements'}
                </motion.button>
              ) : (
                <div className="bg-emerald-950/50 text-emerald-400 p-4 rounded-xl flex items-center justify-center gap-2 font-bold border border-emerald-900/50">
                  <CheckCircle className="w-5 h-5"/> Job Profile Active
                </div>
              )}
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className={`bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-slate-800 transition-all duration-500 ${!activeJobId ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
             <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-white"><UploadCloud className="w-5 h-5 text-blue-400"/> 2. Upload Resumes</h2>
             <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${isDragActive ? 'border-blue-400 bg-blue-900/20 scale-[1.02] shadow-[0_0_30px_rgba(59,130,246,0.2)]' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}>
                <input {...getInputProps()} />
                <UploadCloud className={`w-12 h-12 mx-auto mb-4 transition-colors ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <p className="text-sm font-bold text-slate-300">Drop Candidate Resumes (.pdf)</p>
                <p className="text-xs text-slate-500 mt-2">Upload multiple files at once</p>
             </div>
             
             {/* RESTORED: Uploaded Files List */}
             {uploadedResumes.length > 0 && (
               <div className="mt-5 space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                 {uploadedResumes.map((res, idx) => (
                   <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} key={idx} className="text-xs font-medium p-3 rounded-xl bg-slate-950/50 text-slate-300 flex justify-between items-center border border-slate-800">
                     <span className="truncate max-w-[200px]">{res.filename}</span>
                     <CheckCircle className="w-4 h-4 text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"/>
                   </motion.div>
                 ))}
               </div>
             )}
          </motion.div>
        </div>

        {/* Right Panel: Data Table */}
        <div className="xl:col-span-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-slate-800 min-h-[750px] flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black flex items-center gap-3 text-white"><Users className="w-6 h-6 text-blue-400"/> 3. Candidate Match Insights</h2>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleRankCandidates}
                disabled={!activeJobId || uploadedResumes.length === 0 || isLoading}
                className="bg-slate-100 hover:bg-white disabled:bg-slate-800 disabled:text-slate-500 text-slate-900 font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:shadow-none"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <><BarChart2 className="w-5 h-5"/> Generate Match Report</>}
              </motion.button>
            </div>

            {rankings ? (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, filter: 'blur(10px)' }} animate={{ opacity: 1, filter: 'blur(0px)' }} className="flex-1 flex flex-col gap-10">
                  
                  {/* Clean Horizontal Leaderboard Chart */}
                  <div className="h-72 w-full bg-slate-950/50 rounded-2xl border border-slate-800/50 p-6 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={rankings} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{fontSize: 12, fill: '#94a3b8'}} />
                        <YAxis dataKey="candidate_name" type="category" stroke="#64748b" tick={{fontSize: 12, fill: '#e2e8f0', fontWeight: 'bold'}} width={100} tickFormatter={(val) => val ? val.split(' ')[0] : 'Unknown'} />
                        <RechartsTooltip cursor={{fill: '#0f172a'}} formatter={(value) => [`${value}%`, 'Match Score']} contentStyle={{backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px', color: '#fff'}} />
                        <Bar dataKey="match_percentage" radius={[0, 6, 6, 0]} barSize={24}>
                          {rankings.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.match_percentage >= 70 ? '#10b981' : entry.match_percentage >= 40 ? '#eab308' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Highly Readable Dashboard Table with Tooltips */}
                  <div className="overflow-visible rounded-2xl border border-slate-800 bg-slate-950/30">
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 border-b border-slate-800">
                        <tr className="text-slate-400 text-xs uppercase tracking-widest font-black">
                          <th className="py-5 px-6 w-16">Rank</th>
                          <th className="py-5 px-6">Candidate</th>
                          <th className="py-5 px-6 w-56">Match Score</th>
                          <th className="py-5 px-6">Validated Skills</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {rankings.map((candidate, idx) => {
                          const gapData = analyzeGaps(candidate.skills);
                          
                          // DYNAMIC PENALTY LOGIC
                          let penaltyStatus = "";
                          let penaltyColor = "";
                          
                          if (candidate.match_percentage >= 80) {
                             penaltyStatus = "Exceptional Match: Semantic profile aligns highly with job context.";
                             penaltyColor = "text-emerald-400";
                          } else if (candidate.match_percentage >= 60) {
                             penaltyStatus = "Minor Gap: Lacks specific secondary requirements.";
                             penaltyColor = "text-yellow-400";
                          } else if (candidate.match_percentage >= 40) {
                             penaltyStatus = "Significant Gap: Semantic matrix detects missing core capabilities.";
                             penaltyColor = "text-orange-400";
                          } else {
                             penaltyStatus = "Critical Misalignment: Resume context does not match job scope.";
                             penaltyColor = "text-red-400";
                          }
                          
                          return (
                            <motion.tr 
                              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                              key={candidate.resume_id} className="hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-5 px-6">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 'bg-slate-800 text-slate-400'}`}>
                                  #{candidate.rank}
                                </span>
                              </td>
                              <td className="py-5 px-6">
                                <p className="font-bold text-slate-200 text-base">{candidate.candidate_name || 'Unknown'}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{candidate.filename}</p>
                              </td>
                              
                              {/* HOVER TOOLTIP CELL */}
                              <td className="py-5 px-6 relative group cursor-help">
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between items-center pr-4">
                                    <span className="font-bold text-slate-300">{candidate.match_percentage}%</span>
                                    <Info className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors"/>
                                  </div>
                                  <div className="w-full bg-slate-800 rounded-full h-1.5 pr-4">
                                    <div 
                                      className={`h-1.5 rounded-full ${candidate.match_percentage >= 70 ? 'bg-emerald-500' : candidate.match_percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                      style={{ width: `${candidate.match_percentage}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {/* Dynamic Glassmorphism Tooltip */}
                                <div className="absolute left-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-5 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 transform group-hover:translate-y-0 translate-y-2">
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">AI Gap Analysis</p>
                                  
                                  {/* Dynamic Status Text */}
                                  <p className={`text-sm font-medium mb-4 ${penaltyColor}`}>{penaltyStatus}</p>
                                  
                                  {gapData.missing.length > 0 && (
                                    <div>
                                      <p className="text-xs text-slate-500 mb-2">Flagged Missing Skills:</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {gapData.missing.map((ms, i) => (
                                          <span key={i} className="text-[10px] uppercase font-bold bg-slate-950/80 text-slate-300 border border-slate-700 px-2 py-1 rounded">
                                            {ms}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {gapData.missing.length === 0 && candidate.match_percentage < 80 && (
                                    <p className="text-xs text-slate-400 italic">No specific hard-skill gaps found, but overall experience scope lacks semantic relevance.</p>
                                  )}
                                </div>
                              </td>

                              <td className="py-5 px-6">
                                <div className="flex flex-wrap gap-2">
                                  {candidate.skills.slice(0, 3).map((skill, i) => (
                                    <span key={i} className="bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                                      {skill}
                                    </span>
                                  ))}
                                  {candidate.skills.length > 3 && <span className="text-xs font-bold text-slate-500 py-1.5">+{candidate.skills.length - 3}</span>}
                                  {candidate.skills.length === 0 && <span className="text-xs text-slate-500 italic">No exact skills mapped</span>}
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                <div className="w-24 h-24 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center mb-6 shadow-inner">
                  <BarChart2 className="w-10 h-10 text-slate-700" />
                </div>
                <p className="text-lg font-bold text-slate-400">Waiting for Data</p>
                <p className="text-sm mt-2 text-slate-600">Lock in a job profile and upload resumes to view insights.</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default App;