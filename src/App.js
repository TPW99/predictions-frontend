import React, { useState, useEffect, useMemo, useCallback } from 'react';

// --- Config ---
// PASTE YOUR LIVE RENDER URL HERE
const BACKEND_URL = 'https://predictions-backend-api.onrender.com'; 

// --- Data for Dropdowns ---
const premierLeagueTeams = ["Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton & Hove Albion", "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham", "Leeds United", "Liverpool", "Manchester City", "Manchester United", "Newcastle United", "Nottingham Forest", "Sunderland", "Tottenham Hotspur", "West Ham United", "Wolverhampton Wanderers"];
const goldenBootContenders = [
    "Alexander Isak", "Benjamin Sesko", "Bryan Mbeumo", "Bukayo Saka", "Christopher Nkunku",
    "Cole Palmer", "Dominic Solanke", "Erling Haaland", "Evan Ferguson", "Hugo Ekitike",
    "Hwang Hee-chan", "Jarrod Bowen", "Jean-Philippe Mateta", "Julian Alvarez", "Kai Havertz",
    "Matheus Cunha", "Nicolas Jackson", "Ollie Watkins", "Phil Foden", "Rasmus Højlund", 
    "Viktor Gyökeres", "Yoane Wissa",
    "Other (Please Specify)"
];
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
                    if(onDeadlinePass) onDeadlinePass();
                }
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [deadline, isExpired, onDeadlinePass]);

    return (
        <div className="text-center">
            <h3 className={`font-bold text-lg ${isExpired ? 'text-red-600' : ''}`}>{timeLeft || 'Loading...'}</h3>
            <p className="text-sm text-gray-500">Prediction Deadline</p>
        </div>
    );
};

const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg relative">
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

const PredictionHistoryModal = ({ historyData, onClose }) => {
    if (!historyData) return null;

    return (
        <Modal onClose={onClose}>
            <h2 className="text-2xl font-bold text-center mb-6">{historyData.userName}'s Predictions</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
                {historyData.history.length === 0 ? (
                    <p className="text-center text-gray-500">No predictions to show for this gameweek.</p>
                ) : (
                    historyData.history.map(({ fixture, prediction }) => (
                        <div key={fixture._id} className="bg-gray-100 p-3 rounded-md">
                            <p className="font-semibold text-center">{fixture.homeTeam} vs {fixture.awayTeam}</p>
                            <p className="text-center">
                                Predicted: {prediction ? `${prediction.homeScore} - ${prediction.awayScore}` : 'N/A'}
                            </p>
                            {fixture.actualScore && fixture.actualScore.home !== null && (
                                <p className="text-center font-bold text-green-700">
                                    Actual: {fixture.actualScore.home} - {fixture.actualScore.away}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Modal>
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
    const [gameweeks, setGameweeks] = useState([]);
    const [currentGameweek, setCurrentGameweek] = useState(null);
    const [groupedFixtures, setGroupedFixtures] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [message, setMessage] = useState('');
    const [showPropheciesModal, setShowPropheciesModal] = useState(false);
    const [prophecies, setProphecies] = useState({ winner: '', relegation: ['', '', ''], goldenBoot: '', firstSacking: '', goldenBootOther: '' });
    const [propheciesLocked, setPropheciesLocked] = useState(false);
    const [joker, setJoker] = useState({ fixtureId: null, usedInSeason: false });
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [hasSubmittedForDay, setHasSubmittedForDay] = useState({});

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
        fetchFixtures: async (gameweek) => {
            const url = gameweek ? `${BACKEND_URL}/api/fixtures/${gameweek}` : `${BACKEND_URL}/api/fixtures`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch fixtures');
            return await response.json();
        },
        fetchGameweeks: async () => {
            const response = await fetch(`${BACKEND_URL}/api/gameweeks`);
            if (!response.ok) throw new Error('Failed to fetch gameweeks');
            return await response.json();
        },
        fetchLeaderboard: async () => {
            const response = await fetch(`${BACKEND_URL}/api/leaderboard`);
            if (!response.ok) throw new Error('Failed to fetch leaderboard');
            return await response.json();
        },
        fetchPredictionHistory: async (userId, gameweek) => {
            const response = await fetch(`${BACKEND_URL}/api/predictions/${userId}/${gameweek}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch prediction history');
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
        setCurrentGameweek(null);
        setGameweeks([]);
    }, []);

    const loadGameData = useCallback(async (currentToken, gameweek) => {
        if (currentToken) {
            setIsLoading(true);
            try {
                const payload = JSON.parse(atob(currentToken.split('.')[1]));
                setUser({ name: payload.name, id: payload.userId });

                const [fixtureData, userData, fetchedLeaderboard, allGameweeks] = await Promise.all([
                    api.fetchFixtures(gameweek),
                    api.getUserData(currentToken),
                    api.fetchLeaderboard(),
                    api.fetchGameweeks()
                ]);
                
                const { fixtures: fetchedFixtures, gameweek: fetchedGameweek } = fixtureData;
                setCurrentGameweek(fetchedGameweek);
                setGameweeks(allGameweeks);

                const groups = fetchedFixtures.reduce((acc, fixture) => {
                    const date = new Date(fixture.kickoffTime).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    if (!acc[date]) acc[date] = { fixtures: [], deadline: null };
                    acc[date].fixtures.push(fixture);
                    return acc;
                }, {});

                for (const date in groups) {
                    const firstKickoff = new Date(groups[date].fixtures[0].kickoffTime);
                    groups[date].deadline = new Date(firstKickoff.getTime() - DEADLINE_HOUR_OFFSET * 60 * 60 * 1000);
                }
                setGroupedFixtures(groups);
                
                setLeaderboard(fetchedLeaderboard);

                const initialPreds = {};
                userData.predictions.forEach(p => {
                    initialPreds[p.fixtureId] = {
                        homeScore: p.homeScore,
                        awayScore: p.awayScore
                    };
                });
                fetchedFixtures.forEach(f => {
                    if (!initialPreds[f._id]) {
                         initialPreds[f._id] = { homeScore: '', awayScore: '' };
                    }
                });
                setPredictions(initialPreds);

                 // Check submission status for each day
                const submissionStatus = {};
                Object.entries(groups).forEach(([date, group]) => {
                    const dayHasPrediction = group.fixtures.some(f => 
                        userData.predictions.some(p => p.fixtureId === f._id)
                    );
                    submissionStatus[date] = dayHasPrediction;
                });
                setHasSubmittedForDay(submissionStatus);

                if (userData.prophecies && userData.prophecies.winner) {
                    setProphecies(userData.prophecies);
                    setPropheciesLocked(true);
                }
                
                setJoker({
                    fixtureId: userData.chips.jokerFixtureId || null,
                    usedInSeason: userData.chips.jokerUsedInSeason || false
                });

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
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token) {
            loadGameData(token, currentGameweek);
        }
    }, [token, currentGameweek, loadGameData]);

    const handleGameweekChange = (direction) => {
        const currentIndex = gameweeks.indexOf(currentGameweek);
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < gameweeks.length) {
            setCurrentGameweek(gameweeks[newIndex]);
        }
    };

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

    const handleSubmit = async (date) => {
        try {
            const predictionsForDay = groupedFixtures[date].fixtures.reduce((acc, f) => {
                acc[f._id] = predictions[f._id];
                return acc;
            }, {});

            await api.savePredictions({ predictions: predictionsForDay, jokerFixtureId: joker.fixtureId });
            setHasSubmittedForDay(prev => ({ ...prev, [date]: true }));

            if (joker.fixtureId && groupedFixtures[date].fixtures.some(f => f._id === joker.fixtureId)) {
                setJoker(prev => ({ ...prev, usedInSeason: true }));
            }
            setMessage({ type: 'success', text: `Predictions for ${date} submitted! Good luck!` });
        } catch(error) {
            console.error("Error saving predictions:", error);
            setMessage({type: 'error', text: 'Failed to save predictions.'});
        }
    };
    
    const handleEdit = (date) => {
        setHasSubmittedForDay(prev => ({ ...prev, [date]: false }));
        setMessage({ type: 'info', text: `You can now edit your predictions for ${date}.` });
    };

    const handleReveal = async () => {
        try {
            const result = await api.scoreGameweek();
            setMessage({ type: 'success', text: result.message });
            await loadGameData(token, currentGameweek);
        } catch(error) {
            console.error("Error revealing scores:", error);
            setMessage({type: 'error', text: 'Failed to reveal scores.'});
        }
    };

    const handlePlayerClick = async (playerId) => {
        try {
            const data = await api.fetchPredictionHistory(playerId, currentGameweek);
            setHistoryData(data);
            setShowHistoryModal(true);
        } catch (error) {
            console.error("Error fetching prediction history:", error);
            setMessage({ type: 'error', text: 'Could not load prediction history.' });
        }
    };
    
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
    
    const hasJokerBeenPlayedThisWeek = Object.values(groupedFixtures).flatMap(g => g.fixtures).some(f => f._id === joker.fixtureId);

    return (
        <div className="bg-gray-100 text-gray-800 font-sans min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
                    <div>
                        <button onClick={handleReveal} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300 shadow-md">
                            Refresh Scores
                        </button>
                        <button onClick={handleLogout} className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 ml-2">Logout</button>
                    </div>
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
                             <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <button onClick={() => handleGameweekChange(-1)} disabled={gameweeks.length === 0 || currentGameweek <= gameweeks[0]} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">&lt; Prev</button>
                                <h2 className="text-2xl font-semibold">Gameweek {currentGameweek}</h2>
                                <button onClick={() => handleGameweekChange(1)} disabled={gameweeks.length === 0 || currentGameweek >= gameweeks[gameweeks.length - 1]} className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50">Next &gt;</button>
                             </div>
                             {message.text && <div className={`text-center mb-4 font-semibold ${message.type === 'error' ? 'text-red-500' : 'text-blue-500'}`}>{message.text}</div>}
                             <div className="space-y-8">
                                {Object.entries(groupedFixtures).map(([date, group]) => {
                                    const deadlineDate = new Date(group.deadline);
                                    const gracePeriodEndDate = new Date(deadlineDate.getTime() + 60 * 60 * 1000);
                                    const inGracePeriod = new Date() > deadlineDate && new Date() < gracePeriodEndDate;
                                    const isLocked = new Date() > gracePeriodEndDate;
                                    const daySubmitted = hasSubmittedForDay[date];

                                    return (
                                        <div key={date}>
                                            <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 rounded-md">
                                                <h3 className="text-xl font-bold">{date}</h3>
                                                <Countdown deadline={deadlineDate} />
                                            </div>
                                             {inGracePeriod && !isLocked && !daySubmitted && (
                                                <p className="text-center text-red-500 font-semibold mb-4">
                                                    You are in the grace period! Submissions now will incur a -3 point penalty.
                                                </p>
                                            )}
                                            <div className="space-y-6">
                                                {group.fixtures.map(f => <Fixture key={f._id} fixture={f} prediction={predictions[f._id] || {}} onPredictionChange={handlePredictionChange} isLocked={isLocked || daySubmitted} joker={{isActive: joker.fixtureId === f._id}} onJoker={handleJoker} hasJokerBeenPlayedThisWeek={hasJokerBeenPlayedThisWeek} isJokerUsedInSeason={joker.usedInSeason} />)}
                                            </div>
                                             <div className="text-center mt-4">
                                                {!isLocked && (
                                                    <button onClick={() => daySubmitted ? handleEdit(date) : handleSubmit(date)} className={`${daySubmitted ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-md`}>
                                                        {daySubmitted ? 'Edit' : 'Submit'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                             </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <h2 className="text-2xl font-semibold">Leaderboard</h2>
                            <button onClick={() => loadGameData(token, currentGameweek)} className="text-sm bg-gray-200 hover:bg-gray-300 p-2 rounded-md">Refresh</button>
                        </div>
                        <div className="space-y-4">
                            {leaderboard.map((player, index) => (
                                <div key={player._id || index} className={`flex items-center justify-between p-3 rounded-lg ${player.name === user?.name ? 'bg-blue-100' : 'bg-gray-50'}`}>
                                    <div className="flex items-center">
                                        <span className="font-bold text-lg mr-4 w-6 text-center">{index + 1}</span>
                                        <button onClick={() => handlePlayerClick(player._id)} className="font-semibold hover:underline">{player.name}</button>
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
            {showHistoryModal && (
                <PredictionHistoryModal historyData={historyData} onClose={() => setShowHistoryModal(false)} />
            )}
        </div>
    );
}