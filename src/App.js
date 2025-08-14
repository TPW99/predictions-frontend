import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Config ---
const BACKEND_URL = 'https://predictions-backend-api.onrender.com';

// --- Data for Dropdowns ---
// UPDATED for 2025/26 Season
const premierLeagueTeams = ["Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton & Hove Albion", "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham", "Leeds United", "Liverpool", "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers"];
const goldenBootContenders = ["Erling Haaland", "Cole Palmer", "Alexander Isak", "Ollie Watkins", "Phil Foden", "Dominic Solanke", "Mohamed Salah", "Son Heung-min", "Bukayo Saka", "Jarrod Bowen", "Jean-Philippe Mateta", "Nicolas Jackson", "Darwin Núñez", "Christopher Nkunku", "Ivan Toney", "Kai Havertz", "Julian Alvarez", "Rasmus Højlund", "Diogo Jota", "Marcus Rashford", "Richarlison", "Evan Ferguson", "Yoane Wissa", "Hwang Hee-chan", "Other (Please Specify)"];
// UPDATED for 2025/26 Season
const premierLeagueManagers = ["Mikel Arteta", "Unai Emery", "Andoni Iraola", "Keith Andrews", "Fabian Hürzeler", "Scott Parker", "Enzo Maresca", "Oliver Glasner", "David Moyes", "Marco Silva", "Daniel Farke", "Arne Slot", "Pep Guardiola", "Ruben Amorim", "Eddie Howe", "Nuno Espírito Santo", "Régis Le Bris", "Thomas Frank", "Graham Potter", "Vítor Pereira"];


const DEADLINE_HOUR_OFFSET = 1;

// --- Child Components ---

const AuthForm = ({ isLogin, onSubmit, onToggle, message }) => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">{isLogin ? 'Login' : 'Register'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                    <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required className="w-full p-3 border rounded-md" />
                )}
                <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-3 border rounded-md" />
                <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="w-full p-3 border rounded-md" />
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition duration-300">
                    {isLogin ? 'Login' : 'Create Account'}
                </button>
            </form>
            {message && <p className={`mt-4 text-center font-semibold ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>{message.text}</p>}
            <p className="mt-6 text-center">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button onClick={onToggle} className="text-blue-600 font-semibold ml-2 hover:underline">
                    {isLogin ? 'Register' : 'Login'}
                </button>
            </p>
        </div>
    );
};


const Countdown = ({ deadline, onDeadlinePass }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (!deadline) return;
        const interval = setInterval(() => {
            const now = new Date();
            const distance = new Date(deadline) - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft("DEADLINE PASSED");
                if (!isExpired) {
                    setIsExpired(true);
                    onDeadlinePass();
                }
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline, onDeadlinePass, isExpired]);

    return (
        <div className="text-center">
            <h3 className={`font-bold text-lg ${isExpired ? 'text-red-600' : ''}`}>{timeLeft || 'Loading...'}</h3>
            <p className="text-sm text-gray-500">Prediction Deadline</p>
        </div>
    );
};

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            {children}
        </div>
    </div>
);

const SeasonProphecies = ({ onSave, prophecies, isLocked }) => {
    const [localProphecies, setLocalProphecies] = useState(prophecies);

    const handleChange = (field, value, index = null) => {
        if (field === 'relegation') {
            const newRelegation = [...localProphecies.relegation];
            newRelegation[index] = value;
            setLocalProphecies(p => ({ ...p, relegation: newRelegation }));
        } else {
            setLocalProphecies(p => ({ ...p, [field]: value }));
        }
    };

    const handleSaveClick = () => { onSave(localProphecies); };

    const renderSelect = (label, field, options, points) => (
         <div>
            <label className="font-semibold">{label} ({points} Pts)</label>
            <select value={localProphecies[field]} onChange={e => handleChange(field, e.target.value)} disabled={isLocked} className="w-full p-2 border rounded-md mt-1 disabled:bg-gray-200">
                <option value="">-- Select --</option>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    return (
        <div>
            <h2 className="text-3xl font-bold text-center mb-6">Season Prophecies</h2>
            <p className="text-center text-gray-600 mb-8">Lock in your predictions for the season. These can only be set once!</p>
            <div className="space-y-4">
                {renderSelect("League Winner", "winner", premierLeagueTeams, 10)}
                <div>
                    <label className="font-semibold">Relegation Trio (5 Pts each)</label>
                    {[0, 1, 2].map(i => (
                        <select key={i} value={localProphecies.relegation[i]} onChange={e => handleChange('relegation', e.target.value, i)} disabled={isLocked} className="w-full p-2 border rounded-md mt-1 disabled:bg-gray-200">
                             <option value="">-- Select Team {i + 1} --</option>
                             {premierLeagueTeams.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ))}
                </div>
                <div>
                    <label className="font-semibold">Golden Boot Winner (15 Pts)</label>
                    <select value={localProphecies.goldenBoot} onChange={e => handleChange('goldenBoot', e.target.value)} disabled={isLocked} className="w-full p-2 border rounded-md mt-1 disabled:bg-gray-200">
                        <option value="">-- Select --</option>
                        {goldenBootContenders.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {localProphecies.goldenBoot === 'Other (Please Specify)' && (
                        <input 
                            type="text" 
                            placeholder="Enter player name"
                            value={localProphecies.goldenBootOther}
                            onChange={e => handleChange('goldenBootOther', e.target.value)}
                            disabled={isLocked}
                            className="w-full p-2 border rounded-md mt-2"
                        />
                    )}
                </div>
                {renderSelect("First Manager Sacked", "firstSacking", premierLeagueManagers, 15)}
            </div>
            {!isLocked && (
                <div className="text-center mt-8">
                    <button onClick={handleSaveClick} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-md">
                        Lock In Prophecies
                    </button>
                </div>
            )}
        </div>
    );
};


const Fixture = ({ fixture, prediction, onPredictionChange, isLocked, joker, onJoker, hasJokerBeenPlayedThisWeek, isJokerUsedInSeason }) => {
    return (
        <div className={`bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 transition-opacity ${isLocked ? 'opacity-60' : ''} relative`}>
            {fixture.isDerby && (
                <div className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">🔥 DERBY DAY x2</div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center w-2/5">
                    <img src={fixture.homeLogo} alt={fixture.homeTeam} className="w-10 h-10 mr-3" />
                    <span className="font-semibold text-lg hidden sm:inline">{fixture.homeTeam}</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                    <input type="number" min="0" value={prediction.homeScore} onChange={e => onPredictionChange(fixture._id, 'homeScore', e.target.value)} disabled={isLocked} className="w-16 text-center border rounded-md p-2" />
                    <span className="font-bold text-xl">-</span>
                    <input type="number" min="0" value={prediction.awayScore} onChange={e => onPredictionChange(fixture._id, 'awayScore', e.target.value)} disabled={isLocked} className="w-16 text-center border rounded-md p-2" />
                </div>
                <div className="flex items-center justify-end w-2/5">
                    <span className="font-semibold text-lg mr-3 hidden sm:inline">{fixture.awayTeam}</span>
                    <img src={fixture.awayLogo} alt={fixture.awayTeam} className="w-10 h-10" />
                </div>
            </div>
            {fixture.actualScore && fixture.actualScore.home !== null && (
                 <div className="text-center mt-2 font-bold text-green-600">
                    Actual Score: {fixture.actualScore.home} - {fixture.actualScore.away}
                 </div>
            )}
            <div className="mt-4 text-center">
                 <button 
                    onClick={() => onJoker(fixture._id)} 
                    disabled={isLocked || isJokerUsedInSeason || (hasJokerBeenPlayedThisWeek && !joker.isActive)}
                    className={`font-semibold py-2 px-4 rounded-lg transition duration-300 text-sm shadow
                        ${joker.isActive ? 'bg-yellow-400 text-black ring-2 ring-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    🃏 {joker.isActive ? 'Joker Active' : 'Play Joker'}
                </button>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
    // Auth State
    const [token, setToken] = useState(null);
    const [isLoginView, setIsLoginView] = useState(true);
    const [authMessage, setAuthMessage] = useState('');
    const [user, setUser] = useState(null);
    
    // Game State
    const [isLoading, setIsLoading] = useState(true);
    const [fixtures, setFixtures] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [gameweekDeadline, setGameweekDeadline] = useState(null);
    const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
    const [message, setMessage] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const [showPropheciesModal, setShowPropheciesModal] = useState(false);
    const [prophecies, setProphecies] = useState({ winner: '', relegation: ['', '', ''], goldenBoot: '', firstSacking: '', goldenBootOther: '' });
    const [propheciesLocked, setPropheciesLocked] = useState(false);
    const [joker, setJoker] = useState({ fixtureId: null, usedInSeason: false });

    const api = useMemo(() => ({
        register: async (userData) => {
            const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            return response;
        },
        login: async (credentials) => {
            const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            return response;
        },
        getUserData: async (authToken) => {
            const response = await fetch(`${BACKEND_URL}/api/user/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('Failed to fetch user data');
            return await response.json();
        },
        fetchFixtures: async () => {
            const response = await fetch(`${BACKEND_URL}/api/fixtures`);
            if (!response.ok) throw new Error('Failed to fetch fixtures');
            return await response.json();
        },
        fetchLeaderboard: async () => {
            const response = await fetch(`${BACKEND_URL}/api/leaderboard`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            return await response.json();
        },
        savePredictions: async (predictionsToSave) => {
            const response = await fetch(`${BACKEND_URL}/api/predictions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(predictionsToSave)
            });
            if (!response.ok) throw new Error('Failed to save predictions');
            return await response.json();
        },
        saveProphecies: async (propheciesToSave) => {
            const response = await fetch(`${BACKEND_URL}/api/prophecies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(propheciesToSave)
            });
            if (!response.ok) throw new Error('Failed to save prophecies');
            return await response.json();
        },
        scoreGameweek: async () => {
             const response = await fetch(`${BACKEND_URL}/api/admin/score-gameweek`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to score gameweek');
            return await response.json();
        }
    }), [token]);
    
    const handleLogout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    }, []);

    const loadGameData = useCallback(async (currentToken) => {
        if (currentToken) {
            setIsLoading(true);
            try {
                const payload = JSON.parse(atob(currentToken.split('.')[1]));
                setUser({ name: payload.name, id: payload.userId });

                const [fetchedFixtures, userData, fetchedLeaderboard] = await Promise.all([
                    api.fetchFixtures(),
                    api.getUserData(currentToken),
                    api.fetchLeaderboard()
                ]);
                
                setFixtures(fetchedFixtures);
                setLeaderboard(fetchedLeaderboard);

                const initialPreds = {};
                fetchedFixtures.forEach(f => {
                    const savedPrediction = userData.predictions.find(p => p.fixtureId === f._id);
                    initialPreds[f._id] = {
                        homeScore: savedPrediction ? savedPrediction.homeScore : '',
                        awayScore: savedPrediction ? savedPrediction.awayScore : ''
                    };
                });
                setPredictions(initialPreds);
                if (userData.predictions && userData.predictions.length > 0) {
                    setHasSubmitted(true);
                }

                if (userData.prophecies && userData.prophecies.winner) {
                    setProphecies(userData.prophecies);
                    setPropheciesLocked(true);
                }
                
                setJoker({
                    fixtureId: userData.chips.jokerFixtureId || null,
                    usedInSeason: userData.chips.jokerUsedInSeason || false
                });

                if (fetchedFixtures.length > 0) {
                    const deadline = new Date(new Date(fetchedFixtures[0].kickoffTime).getTime() - DEADLINE_HOUR_OFFSET * 60 * 60 * 1000);
                    setGameweekDeadline(deadline);
                }
            } catch (error) {
                console.error("Error loading game data:", error);
                setMessage({type: 'error', text: 'Could not load game data.'});
                handleLogout();
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [api, handleLogout]);
    
    useEffect(() => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            setToken(currentToken);
            loadGameData(currentToken);
        } else {
            setIsLoading(false);
        }
    }, [loadGameData]);

    const handleRegister = async (formData) => {
        try {
            const response = await api.register(formData);
            const data = await response.json();
            if (response.ok) {
                setAuthMessage({ type: 'success', text: data.message + ' Please log in.' });
                setIsLoginView(true);
            } else {
                setAuthMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setAuthMessage({ type: 'error', text: 'Could not connect to the server.' });
        }
    };

    const handleLogin = async (formData) => {
        try {
            const response = await api.login(formData);
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                setToken(data.token);
                setAuthMessage('');
            } else {
                setAuthMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setAuthMessage({ type: 'error', text: 'Could not connect to the server.' });
        }
    };
    
    const handlePredictionChange = (fixtureId, team, value) => {
        setPredictions(prev => ({ ...prev, [fixtureId]: { ...prev[fixtureId], [team]: value } }));
    };

    const handleJoker = (fixtureId) => {
        if (joker.usedInSeason) {
            setMessage({ type: 'error', text: 'You have already used your Joker chip this season.' });
            return;
        }
        setJoker(prev => ({ ...prev, fixtureId: prev.fixtureId === fixtureId ? null : fixtureId }));
    };

    const handleSaveProphecies = async (propheciesData) => {
        const finalProphecies = { ...propheciesData };
        if (finalProphecies.goldenBoot === 'Other (Please Specify)') {
            finalProphecies.goldenBoot = finalProphecies.goldenBootOther;
        }
        delete finalProphecies.goldenBootOther;

        try {
            await api.saveProphecies({ prophecies: finalProphecies });
            setProphecies(propheciesData);
            setPropheciesLocked(true);
            setShowPropheciesModal(false);
            setMessage({ type: 'success', text: 'Your season prophecies have been locked in!' });
        } catch(error) {
            console.error("Error saving prophecies:", error);
            setMessage({type: 'error', text: 'Failed to save prophecies.'});
        }
    };

    const handleSubmit = async () => {
        const isAllFilled = fixtures.every(f => predictions[f._id].homeScore !== '' && predictions[f._id].awayScore !== '');
        if (!isAllFilled) {
            setMessage({ type: 'error', text: 'Please fill in all score predictions.' });
            return;
        }
        
        try {
            const result = await api.savePredictions({ predictions, jokerFixtureId: joker.fixtureId });
            setHasSubmitted(true);
            if (joker.fixtureId) {
                setJoker(prev => ({ ...prev, usedInSeason: true }));
            }
            const wasLate = new Date(result.submittedAt) > gameweekDeadline;
            setMessage({ type: 'success', text: `Predictions submitted! ${wasLate ? 'A penalty will be applied.' : 'Good luck!'}` });
        } catch(error) {
            console.error("Error saving predictions:", error);
            setMessage({type: 'error', text: 'Failed to save predictions.'});
        }
    };
    
    const handleEdit = () => {
        setHasSubmitted(false);
        setMessage({ type: 'info', text: 'You can now edit your predictions.' });
    };

    const handleReveal = async () => {
        if (!hasSubmitted) {
            setMessage({ type: 'error', text: 'You must submit your predictions first!' });
            return;
        }
        try {
            const result = await api.scoreGameweek();
            setMessage({ type: 'success', text: result.message });
            setHasRevealed(true);
            await loadGameData(token);
        } catch(error) {
            console.error("Error revealing scores:", error);
            setMessage({type: 'error', text: 'Failed to reveal scores.'});
        }
    };

    const hasJokerBeenPlayedThisWeek = useMemo(() => !!joker.fixtureId, [joker.fixtureId]);
    
    if (isLoading) {
        return <div className="bg-gray-100 min-h-screen flex items-center justify-center"><p className="text-2xl font-semibold">Loading...</p></div>;
    }

    if (!token) {
        return (
             <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
                <header className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Premier League Predictions</h1>
                    <p className="text-gray-600 mt-2">Welcome! Please log in or register to play.</p>
                </header>
                <AuthForm 
                    isLogin={isLoginView} 
                    onSubmit={isLoginView ? handleLogin : handleRegister}
                    onToggle={() => setIsLoginView(!isLoginView)}
                    message={authMessage}
                />
            </div>
        );
    }

    return (
        <div className="bg-gray-100 text-gray-800 font-sans min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
                    <button onClick={handleLogout} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">Logout</button>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                             <h2 className="text-2xl font-semibold mb-2">Season Prophecies</h2>
                             <p className="text-gray-600 mb-4">{propheciesLocked ? "Your prophecies are locked in for the season!" : "Make your season-long predictions before the first gameweek!"}</p>
                             <button onClick={() => setShowPropheciesModal(true)} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 transition duration-300 shadow-md">
                                {propheciesLocked ? "View Your Prophecies" : "Make Your Prophecies"}
                             </button>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <div className="flex flex-wrap justify-between items-center border-b pb-4 mb-6 gap-4">
                                 <h2 className="text-2xl font-semibold">Gameweek 1</h2>
                                 {gameweekDeadline && <Countdown deadline={gameweekDeadline} onDeadlinePass={() => setIsDeadlinePassed(true)} />}
                                 <div>
                                    <button 
                                        onClick={hasSubmitted ? handleEdit : handleSubmit} 
                                        disabled={isDeadlinePassed} 
                                        className={`${hasSubmitted ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {hasSubmitted ? 'Edit Predictions' : 'Submit'}
                                    </button>
                                    <button 
                                        onClick={handleReveal} 
                                        disabled={hasRevealed || !hasSubmitted} 
                                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 shadow-md ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Reveal
                                    </button>
                                </div>
                            </div>
                            {message.text && <div className={`text-center mb-4 font-semibold ${message.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>{message.text}</div>}
                            <div className="space-y-6">
                               {fixtures.map(f => <Fixture key={f._id} fixture={f} prediction={predictions[f._id] || {}} onPredictionChange={handlePredictionChange} isLocked={isDeadlinePassed || hasSubmitted} joker={{isActive: joker.fixtureId === f._id}} onJoker={handleJoker} hasJokerBeenPlayedThisWeek={hasJokerBeenPlayedThisWeek} isJokerUsedInSeason={joker.usedInSeason} />)}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-semibold">Leaderboard</h2>
                            <button onClick={() => loadGameData(token)} className="text-sm bg-gray-200 hover:bg-gray-300 p-2 rounded-md">Refresh</button>
                        </div>
                        <div className="space-y-4">
                            {leaderboard.map((player, index) => (
                                <div key={player._id || index} className={`flex items-center justify-between p-3 rounded-lg ${player.name === user?.name ? 'bg-blue-100' : 'bg-gray-50'}`}>
                                    <div className="flex items-center">
                                        <span className="font-bold text-lg mr-4 w-6 text-center">{index + 1}</span>
                                        <p className="font-semibold">{player.name}</p>
                                    </div>
                                    <p className="font-bold text-lg">{player.score} pts</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
             {showPropheciesModal && (
                <Modal onClose={() => setShowPropheciesModal(false)}>
                    <SeasonProphecies onSave={handleSaveProphecies} prophecies={prophecies} isLocked={propheciesLocked} />
                </Modal>
            )}
        </div>
    );
}
