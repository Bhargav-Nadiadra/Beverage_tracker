'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, ArrowLeft, Calendar, Target, User, Medal } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Participant {
    name: string;
    score: number;
}

interface Challenge {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    target_type: string;
    target_value: number | null;
}

export default function ChallengeLeaderboardPage() {
    const params = useParams();
    const router = useRouter();
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`/api/challenges/${params.id}/leaderboard`);
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                setChallenge(data.challenge);
                setLeaderboard(data.leaderboard);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [params.id]);

    if (loading) return <ChallengeSkeleton />;
    if (!challenge) return <div className="p-10 text-center text-gray-500">Challenge not found.</div>;

    const isActive = new Date(challenge.start_date) <= new Date() && new Date(challenge.end_date) >= new Date();
    const isCompleted = new Date(challenge.end_date) < new Date();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <span className="text-xl font-bold text-green-600 dark:text-green-500">Beverage Tracker</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Challenge Summary Header */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden relative">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -tr-y-1/2 translate-x-1/4 w-64 h-64 bg-green-50 dark:bg-green-900/10 rounded-full blur-3xl -z-10" />
                        <div className="absolute bottom-0 left-0 tr-y-1/2 -translate-x-1/4 w-64 h-64 bg-amber-50 dark:bg-amber-900/10 rounded-full blur-3xl -z-10" />

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-4 max-w-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-2xl">
                                        <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full inline-block ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900' : isCompleted ? 'bg-gray-100 text-gray-600 dark:bg-gray-800' : 'bg-blue-100 text-blue-700 dark:bg-blue-900'}`}>
                                            {isActive ? 'Active Challenge' : isCompleted ? 'Challenge Finalized' : 'Upcoming Challenge'}
                                        </span>
                                        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mt-1">{challenge.title}</h1>
                                    </div>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-lg font-medium leading-relaxed">
                                    {challenge.description || 'Competition brings out the best in everyone! Join the challenge and climb the leaderboard.'}
                                </p>
                                
                                <div className="flex flex-wrap gap-4 pt-4">
                                    <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Timeline</span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 px-4 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                        <Target className="w-5 h-5 text-gray-400" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Target</span>
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                {challenge.target_type.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard Section */}
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 transition-all">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                            <h2 className="text-xl font-black text-gray-900 dark:text-gray-100">Leaderboard Rankings</h2>
                            <div className="text-xs text-gray-500 font-bold bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full uppercase tracking-widest">
                                {leaderboard.length} Participants
                            </div>
                        </div>
                        
                        <div className="p-4 sm:p-8">
                            <div className="space-y-4">
                                {leaderboard.length === 0 ? (
                                    <div className="text-center py-20">
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <User className="w-10 h-10 text-gray-300" />
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 font-bold italic">No logs recorded yet for this challenge.</p>
                                        <p className="text-xs text-gray-400 mt-2">Logs will appear automatically as team members track beverages.</p>
                                    </div>
                                ) : (
                                    leaderboard.map((user, index) => {
                                        const isTopThree = index < 3;
                                        const medalColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-amber-600';
                                        
                                        return (
                                            <div key={user.name} className={`flex items-center gap-6 p-4 rounded-2xl transition-all hover:translate-x-2 ${isTopThree ? 'bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-900/30 border border-gray-100 dark:border-gray-800' : ''}`}>
                                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm relative ${index === 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                                                    {isTopThree ? (
                                                        <Medal className={`w-6 h-6 ${medalColor}`} />
                                                    ) : (
                                                       <span className="text-lg font-black text-gray-300 dark:text-gray-600">{index + 1}</span> 
                                                    )}
                                                    {index === 0 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>}
                                                </div>
                                                
                                                <div className="flex-grow flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className={`text-lg font-black ${isTopThree ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {user.name}
                                                        </span>
                                                        {index === 0 && <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">Current Champion</span>}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <div className="text-2xl font-black text-green-600 dark:text-green-500 leading-none">{user.score}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Points Earned</div>
                                                        </div>
                                                        <div className="h-10 w-1 bg-gray-100 dark:bg-gray-800 rounded-full" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function ChallengeSkeleton() {
    return (
        <div className="max-w-4xl mx-auto py-20 px-4 animate-pulse space-y-10">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800/50 rounded-2xl" />
                ))}
            </div>
        </div>
    );
}
