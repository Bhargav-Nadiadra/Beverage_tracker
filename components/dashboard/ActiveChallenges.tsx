'use client';

import { useState, useEffect } from 'react';
import { Trophy, Clock, Target, Calendar } from 'lucide-react';

interface Challenge {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    target_type: 'MOST_LOGS' | 'LEAST_LOGS' | 'MOST_TEA' | 'MOST_COFFEE';
    target_value: number | null;
    creator_name: string;
}

export function ActiveChallenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChallenges() {
            try {
                const response = await fetch('/api/challenges');
                const data = await response.json();
                setChallenges(data.challenges || []);
            } catch (error) {
                console.error('Failed to fetch challenges:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchChallenges();
    }, []);

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="h-64 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-gray-300 animate-spin" />
                </div>
            </div>
        );
    }

    if (challenges.length === 0) {
        return null; // Don't show anything if no challenges
    }

    return (
        <div className="bg-white dark:bg-gray-900 shadow rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Team Challenges
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Compete with your team and earn bragging rights!</p>
            </div>
            <div className="p-4 space-y-4">
                {challenges.map((challenge) => {
                    const isActive = new Date(challenge.start_date) <= new Date() && new Date(challenge.end_date) >= new Date();
                    
                    return (
                        <div key={challenge.id} className="relative group">
                            <div className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${isActive ? 'bg-amber-50/30 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30' : 'bg-gray-50/50 border-gray-100 dark:bg-gray-800/30 dark:border-gray-800'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100">{challenge.title}</h4>
                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'}`}>
                                        {isActive ? 'Active' : 'Upcoming'}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                                    {challenge.description || 'No description provided.'}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 text-[11px] text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                        <span>Ends {new Date(challenge.end_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Target className="w-3.5 h-3.5 text-gray-400" />
                                        <span>{challenge.target_type.replace('_', ' ')}</span>
                                    </div>
                                </div>

                                <div className="mt-5">
                                    <a 
                                        href={`/dashboard/challenges/${challenge.id}`}
                                        className="w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                    >
                                        View Leaderboard
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
