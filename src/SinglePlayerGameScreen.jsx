import {ReactComponent as Player1} from "./assets/clean/player1-clean.svg";
import {ReactComponent as Player1Pistol} from "./assets/clean/player1pistol-clean.svg";
import machineGunTurretImg from "./assets/raw/machinegunturret.jpg"; // For menu display
import machineGunTurretNoBackgroundImg from "./assets/clean/machinegunturret-clean.png"; // For placed turrets
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { db } from "./backend";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import meteorImg from "./assets/raw/meteor.png";

// Game component

const SingleGamePage = () => {
    const navigate = useNavigate();
    const [playerX, setPlayerX] = useState(5); // Initial X position (in tiles)
    const [playerY, setPlayerY] = useState(5); // Initial Y position (in tiles)
    const [loading, setLoading] = useState(true);
    const TURRET_LIMITS = {1: 2, 2: 3, 3: 5, 4: 5, 5: 10};
    
    // Circle effect state
    const [showCircle, setShowCircle] = useState(false);
    const circleRadius = 3; // Radius in tiles - can be adjusted as needed
    
    // Game stats
    const [score, setScore] = useState(0);
    const [level, setLevel] = useState(1);
    const [path, setPath] = useState([]);
    const [enemies, setEnemies] = useState([]);
    const [selectedEnemy, setSelectedEnemy] = useState(null);
    const [hearts, setHearts] = useState(20);
    
    // Shooting mechanics
    const [isShooting, setIsShooting] = useState(false);
    const [shots, setShots] = useState([]);
    const [ammunition, setAmmunition] = useState(10); // Limited ammunition
    
    // Turret menu state
    const [showTurretMenu, setShowTurretMenu] = useState(false);
    const [hoveredTurret, setHoveredTurret] = useState(null);
    
    // Turret costs and properties
    const TURRET_COSTS = {
        machineGun: { iron: 20, titanium: 0, gold: 0 }
    };
    
    // Turret attack properties
    const TURRET_PROPERTIES = {
        machineGun: { range: 3, damage: 0.2, attackSpeed: 10 } // 1 attack per second
    };
    
    // Placed turrets
    const [turrets, setTurrets] = useState([]);
    
    // Counter to force turret updates
    const [turretUpdateCounter, setTurretUpdateCounter] = useState(0);
    
    // Resources
    const [resources, setResources] = useState({
        iron: 0,
        titanium: 0,
        gold: 0
    });
    
    // Track initial resources for each level
    const [initialLevelResources, setInitialLevelResources] = useState({
        iron: 0,
        titanium: 0,
        gold: 0
    });
    
    // Function to update resources in Firebase
    const updateResourcesInFirebase = async (newResources) => {
        try {
            const username = Cookies.get('username');
            const gameIndex = Cookies.get('game');
            
            if (!username || gameIndex === undefined) return;
            
            const gameDocRef = doc(db, "Users", username, "spgamesdata", gameIndex);
            await updateDoc(gameDocRef, {
                "coins.iron": newResources.iron,
                "coins.titanium": newResources.titanium,
                "coins.gold": newResources.gold
            });
            
            console.log("Resources updated in Firebase:", newResources);
        } catch (error) {
            console.error("Error updating resources in Firebase:", error);
        }
    };
    
    // Function to update turrets in Firebase
    const updateTurretsInFirebase = async (turretsList) => {
        try {
            const username = Cookies.get('username');
            const gameIndex = Cookies.get('game');
            
            if (!username || gameIndex === undefined) return;
            
            const gameDocRef = doc(db, "Users", username, "spgamesdata", gameIndex);
            
            // Convert turrets to a format suitable for Firestore
            const turretData = turretsList.map(turret => ({
                id: turret.id,
                type: turret.type,
                x: turret.x,
                y: turret.y,
                angle: turret.angle
            }));
            
            await updateDoc(gameDocRef, {
                "turrets": turretData
            });
            
            console.log("Turrets updated in Firebase:", turretData);
        } catch (error) {
            console.error("Error updating turrets in Firebase:", error);
        }
    };
    
    // Enemy types and their health points
    const ENEMY_TYPES = {
        IRON: { type: 'iron', hp: 5, color: 'gray', hearts: 1, drop: 15},
        TITANIUM: { type: 'titanium', hp: 20, color: 'red', hearts: 3, drop: 1},
        GOLD: { type: 'gold', hp: 50, color: 'gold', hearts: 5, drop: 1},
        BOSS: { type: 'boss', hp: 500, color: 'darkgray', scale: 1.5, hearts: 20, drop: 1500}
    };
    
    // State to track which enemies have recently been damaged
    const [damagedEnemies, setDamagedEnemies] = useState({});
    // State to track which enemies are being hovered
    const [hoveredEnemies, setHoveredEnemies] = useState({});
    
    // Enemy wave configurations for each level
    const enemyWaves = [
        // Level 1: 20 enemies (15 iron, 5 titanium)
        [
            ...Array(15).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM)
        ],
        
        // Level 2: 40 enemies (30 iron, 10 titanium in 2 groups)
        [
            ...Array(15).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ...Array(15).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM)
        ],
        
        // Level 3: 50 enemies (39 iron, 10 titanium in 2 groups, 1 gold)
        [
            ...Array(19).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ...Array(20).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD
        ],
        
        // Level 4: 75 enemies (60 iron, 15 titanium in 3 groups, 2 gold)
        [
            ...Array(20).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD,
            ...Array(20).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ...Array(20).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD
        ],
        
        // Level 5: 150 enemies (119 iron, 25 titanium in 5 groups, 5 gold, 1 boss)
        [
            ...Array(24).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD,
            ...Array(24).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD,
            ...Array(24).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD,
            ...Array(24).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD,
            ...Array(23).fill(ENEMY_TYPES.IRON),
            ...Array(5).fill(ENEMY_TYPES.TITANIUM),
            ENEMY_TYPES.GOLD,
            ENEMY_TYPES.BOSS
        ]
    ];
    
    // Fixed grid width of 35 tiles
    const gridWidth = 35;
    
    // Calculate tile size based on screen width (75% of screen width divided by 35 tiles)
    const tileSize = Math.floor((window.innerWidth * 0.75) / gridWidth);
    
    // Calculate grid height based on screen size and tile size
    const gridHeight = Math.floor(window.innerHeight / tileSize);
    
    // Function to generate enemies for a specific level
    const generateEnemiesForLevel = (level) => {
        // Default to level 1 if out of range
        const levelIndex = Math.min(Math.max(level - 1, 0), 4);
        
        // Get enemy configuration for this level
        const waveConfig = enemyWaves[levelIndex];
        
        // Enemy spacing for 1 second between spawns
        // Since enemies move at 0.05 positions per update (50ms),
        // they move 1 position per second (0.05 * 20 updates)
        const enemySpacing = 1; // Smaller spacing to make enemies appear sooner
        
        console.log("Generating enemies for level:", level);
        console.log("Wave config length:", waveConfig.length);
        
        // Create enemy instances with position, health, and alive status
        const enemies = waveConfig.map((enemyType, index) => {
            // Place first few enemies on screen, rest spaced out
            let position;
            if (index < 5) {
                position = index * 2; // First 5 enemies on screen, spaced out
            } else {
                position = 10 + index; // Rest start after position 10
            }
            console.log(position);
            const enemy = {
                id: index,
                type: enemyType.type,
                hp: enemyType.hp,
                maxHp: enemyType.hp,
                alive: true,
                position: -position,
                color: enemyType.color,
                scale: enemyType.scale || 1
            };
            
            console.log(`Generated enemy ${index} at position ${position}`);
            return enemy;
        });
        
        console.log("Generated enemies:", enemies);
        return enemies;
    };
    
    // Function to generate path for a specific level
    const generatePathForLevel = (level) => {
        // Default to level 1 if out of range
        const levelIndex = Math.min(Math.max(level - 1, 0), 4);
        
        // Starting y-coordinates for each level
        const startingY = [5, 3, 2, 8, 10];
        
        // Define complete paths for each level with manual coordinates (from x=34 to x=0)
        const manualPaths = [
            // Level 1 - Straight horizontal path
            [
                // Extended path from x=34 to x=21
                {x: 34, y: 5}, {x: 33, y: 5}, {x: 32, y: 5}, {x: 31, y: 5}, {x: 30, y: 5},
                {x: 29, y: 5}, {x: 28, y: 5}, {x: 27, y: 5}, {x: 26, y: 5}, {x: 25, y: 5},
                {x: 24, y: 5}, {x: 23, y: 5}, {x: 22, y: 5}, {x: 21, y: 5},
                // Original path from x=20 to x=0
                {x: 20, y: 5}, {x: 19, y: 5}, {x: 18, y: 5}, {x: 17, y: 5}, {x: 16, y: 5},
                {x: 15, y: 5}, {x: 14, y: 5}, {x: 13, y: 5}, {x: 12, y: 5}, {x: 11, y: 5},
                {x: 10, y: 5}, {x: 9, y: 5}, {x: 8, y: 5}, {x: 7, y: 5}, {x: 6, y: 5},
                {x: 5, y: 5}, {x: 4, y: 5}, {x: 3, y: 5}, {x: 2, y: 5}, {x: 1, y: 5}, {x: 0, y: 5}
            ],
            
            // Level 2 - Zigzag path
            [
                // Extended path from x=34 to x=21
                {x: 34, y: 3}, {x: 33, y: 3}, {x: 32, y: 3}, {x: 31, y: 3}, {x: 30, y: 3},
                {x: 29, y: 3}, {x: 28, y: 3}, {x: 27, y: 3}, {x: 26, y: 3}, {x: 25, y: 3},
                {x: 24, y: 3}, {x: 23, y: 3}, {x: 22, y: 3}, {x: 21, y: 3},
                // Original path
                {x: 20, y: 3}, {x: 19, y: 3}, {x: 18, y: 3}, {x: 17, y: 3}, {x: 16, y: 3},
                // First zigzag down
                {x: 15, y: 3}, {x: 15, y: 4}, {x: 15, y: 5}, {x: 15, y: 6}, {x: 15, y: 7},
                {x: 14, y: 7}, {x: 13, y: 7}, {x: 12, y: 7}, {x: 11, y: 7}, {x: 10, y: 7},
                // Second zigzag up
                {x: 10, y: 6}, {x: 10, y: 5}, {x: 10, y: 4}, {x: 10, y: 3}, {x: 10, y: 2},
                {x: 9, y: 2}, {x: 8, y: 2}, {x: 7, y: 2}, {x: 6, y: 2}, {x: 5, y: 2},
                // Final stretch to goal
                {x: 4, y: 2}, {x: 3, y: 2}, {x: 2, y: 2}, {x: 1, y: 2}, {x: 0, y: 2}
            ],
            
            // Level 3 - S-shaped path
            [
                // Extended path from x=34 to x=21
                {x: 34, y: 2}, {x: 33, y: 2}, {x: 32, y: 2}, {x: 31, y: 2}, {x: 30, y: 2},
                {x: 29, y: 2}, {x: 28, y: 2}, {x: 27, y: 2}, {x: 26, y: 2}, {x: 25, y: 2},
                {x: 24, y: 2}, {x: 23, y: 2}, {x: 22, y: 2}, {x: 21, y: 2},
                // Original path
                {x: 20, y: 2}, {x: 19, y: 2}, {x: 18, y: 2}, {x: 17, y: 2},
                // Curve down
                {x: 16, y: 3}, {x: 15, y: 4}, {x: 14, y: 5}, {x: 13, y: 6}, {x: 12, y: 7},
                // Middle section
                {x: 11, y: 7}, {x: 10, y: 7}, {x: 9, y: 7},
                // Curve up
                {x: 8, y: 6}, {x: 7, y: 5}, {x: 6, y: 4}, {x: 5, y: 3}, {x: 4, y: 2},
                // Final stretch to goal
                {x: 3, y: 2}, {x: 2, y: 2}, {x: 1, y: 2}, {x: 0, y: 2}
            ],
            
            // Level 4 - Double zigzag
            [
                // Extended path from x=34 to x=21 with gradual descent
                {x: 34, y: 4}, {x: 33, y: 5}, {x: 32, y: 6}, {x: 31, y: 7}, {x: 30, y: 8},
                {x: 29, y: 8}, {x: 28, y: 8}, {x: 27, y: 8}, {x: 26, y: 8}, {x: 25, y: 8},
                {x: 24, y: 8}, {x: 23, y: 8}, {x: 22, y: 8}, {x: 21, y: 8},
                // Original path
                {x: 20, y: 8}, {x: 19, y: 7}, {x: 18, y: 6}, {x: 17, y: 5}, {x: 16, y: 4},
                {x: 15, y: 3}, {x: 14, y: 3}, {x: 13, y: 3}, {x: 12, y: 4}, {x: 11, y: 5},
                {x: 10, y: 6}, {x: 9, y: 7}, {x: 8, y: 8}, {x: 7, y: 7}, {x: 6, y: 6},
                {x: 5, y: 5}, {x: 4, y: 4}, {x: 3, y: 3}, {x: 2, y: 3}, {x: 1, y: 3}, {x: 0, y: 3}
            ],
            
            // Level 5 - Complex winding path
            [
                // Extended path from x=34 to x=21 with wave pattern
                {x: 34, y: 6}, {x: 33, y: 7}, {x: 32, y: 8}, {x: 31, y: 9}, {x: 30, y: 10},
                {x: 29, y: 11}, {x: 28, y: 12}, {x: 27, y: 12}, {x: 26, y: 11}, {x: 25, y: 10},
                {x: 24, y: 10}, {x: 23, y: 10}, {x: 22, y: 10}, {x: 21, y: 10},
                // Original path
                {x: 20, y: 10}, {x: 19, y: 9}, {x: 18, y: 8}, {x: 17, y: 7}, {x: 16, y: 6},
                {x: 15, y: 5}, {x: 14, y: 4}, {x: 13, y: 3}, {x: 12, y: 3}, {x: 11, y: 4},
                {x: 10, y: 5}, {x: 9, y: 6}, {x: 8, y: 7}, {x: 7, y: 8}, {x: 6, y: 9},
                {x: 5, y: 10}, {x: 4, y: 10}, {x: 3, y: 10}, {x: 2, y: 10}, {x: 1, y: 10}, {x: 0, y: 10}
            ]
        ];
        
        // Get the complete manual path for the current level
        const completePath = manualPaths[levelIndex];
        
        // Return the complete path with manual coordinates
        return completePath;
    };
    
    // Function to set initial iron based on level
    const getInitialIronForLevel = (level) => {
        if (level <= 2) return 20;
        else if (level <= 4) return 25;
        else return 30;
    };
    
    // Get game data from Firebase
    useEffect(() => {
        const fetchGameData = async () => {
            try {
                const username = Cookies.get('username');
                const gameIndex = Cookies.get('game');
                
                if (!username || gameIndex === undefined) {
                    console.error("Missing username or game index");
                    navigate('/singlestart');
                    return;
                }
                
                const gameDocRef = doc(db, "Users", username, "spgamesdata", gameIndex);
                const gameDoc = await getDoc(gameDocRef);
                
                if (gameDoc.exists()) {
                    const gameData = gameDoc.data();
                    setPlayerX(gameData.player.x);
                    setPlayerY(gameData.player.y);
                    setScore(gameData.score || 0);
                    const currentLevel = gameData.level || 1;
                    setLevel(currentLevel);
                    
                    // Always generate a new path based on current level
                    const newPath = generatePathForLevel(currentLevel, gridWidth);
                    setPath(newPath);
                    
                    // Load or generate enemies
                    let gameEnemies;
                    if (gameData.enemies && gameData.enemies.length > 0) {
                        gameEnemies = gameData.enemies;
                    } else {
                        gameEnemies = generateEnemiesForLevel(currentLevel);
                    }
                    setEnemies(gameEnemies);
                    
                    // Set initial resources based on level
                    const initialIron = getInitialIronForLevel(currentLevel);
                    const initialResources = {
                        iron: initialIron,
                        titanium: 0,
                        gold: 0
                    };
                    
                    setResources(initialResources);
                    
                    // Store initial resources for this level
                    setInitialLevelResources(initialResources);
                    
                    // Update resources in Firebase
                    await updateResourcesInFirebase(initialResources);
                    
                    // Set ammunition to 10
                    setAmmunition(10);
                    
                    // Check if there are existing resources in Firebase
                    if (gameData.coins) {
                        // Use existing resources from Firebase
                        const existingResources = {
                            iron: gameData.coins.iron || initialIron,
                            titanium: gameData.coins.titanium || 0,
                            gold: gameData.coins.gold || 0
                        };
                        
                        setResources(existingResources);
                        setInitialLevelResources(existingResources);
                    }
                    
                    // Save path and enemies to Firebase
                    await updateDoc(gameDocRef, {
                        path: newPath,
                        enemies: gameEnemies
                    });
                } else {
                    console.error("Game data not found");
                    navigate('/singlestart');
                }
            } catch (error) {
                console.error("Error fetching game data:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchGameData();
    }, [navigate, level]);
    
    // Update Firebase when player position changes
    const updatePlayerPosition = async (x, y) => {
        try {
            const username = Cookies.get('username');
            const gameIndex = Cookies.get('game');
            
            if (!username || gameIndex === undefined) return;
            
            const gameDocRef = doc(db, "Users", username, "spgamesdata", gameIndex);
            await updateDoc(gameDocRef, {
                "player.x": x,
                "player.y": y
            });
        } catch (error) {
            console.error("Error updating player position:", error);
        }
    };
    
    // Function to update level and regenerate path and enemies
    const updateLevel = async (newLevel) => {
        try {
            const username = Cookies.get('username');
            const gameIndex = Cookies.get('game');
            
            if (!username || gameIndex === undefined) return;
            
            // Generate new path and enemies for the new level
            const newPath = generatePathForLevel(newLevel, gridWidth);
            const newEnemies = generateEnemiesForLevel(newLevel);
            
            // Update level, path, and enemies in Firebase
            const gameDocRef = doc(db, "Users", username, "spgamesdata", gameIndex);
            await updateDoc(gameDocRef, {
                level: newLevel,
                path: newPath,
                enemies: newEnemies
            });
            
            // Update local state
            setLevel(newLevel);
            setPath(newPath);
            setEnemies(newEnemies);
            setSelectedEnemy(null); // Clear selected enemy
            setHearts(20); // Reset hearts
            setAmmunition(10); // Reset ammunition to exactly 10
            
            // Clear turrets when changing level
            setTurrets([]);
            
            // Set initial resources for the new level
            const initialIron = getInitialIronForLevel(newLevel);
            const newResources = {
                iron: initialIron,
                titanium: resources.titanium, // Keep titanium from previous level
                gold: resources.gold // Keep gold from previous level
            };
            
            // Update resources
            setResources(newResources);
            
            // Store initial resources for this level
            setInitialLevelResources(newResources);
            
            // Update resources in Firebase
            await updateResourcesInFirebase(newResources);
        } catch (error) {
            console.error("Error updating level:", error);
        }
    };
    
    // Function to restart the current level
    const restartLevel = async () => {
        try {
            const username = Cookies.get('username');
            const gameIndex = Cookies.get('game');
            
            if (!username || gameIndex === undefined) return;
            
            // Generate new enemies for the current level
            const newEnemies = generateEnemiesForLevel(level);
            
            // Update enemies in Firebase
            const gameDocRef = doc(db, "Users", username, "spgamesdata", gameIndex);
            await updateDoc(gameDocRef, {
                enemies: newEnemies,
                hearts: 20
            });
            
            // Update local state
            setEnemies(newEnemies);
            setSelectedEnemy(null); // Clear selected enemy
            setHearts(20); // Reset hearts
            setAmmunition(10); // Reset ammunition to exactly 10
            
            // Reset resources to what they were at the start of the level
            const resetResources = {...initialLevelResources};
            setResources(resetResources);
            
            // Clear turrets when restarting level
            setTurrets([]);
            
            // Update resources in Firebase
            await updateResourcesInFirebase(resetResources);
        } catch (error) {
            console.error("Error restarting level:", error);
        }
    };
    
    // Effect to show circle when in turret menu or hovering over a turret
    useEffect(() => {
        // Show circle when turret menu is open or a turret is being hovered
        setShowCircle(showTurretMenu || hoveredTurret !== null);
    }, [showTurretMenu, hoveredTurret]);
    
    // Effect to handle escape key to close turret menu
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showTurretMenu) {
                setShowTurretMenu(false);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showTurretMenu]);
    
    // Function to handle enemy damage
    const damageEnemy = (enemyId, damage) => {
        console.log(`Attempting to damage enemy ${enemyId} with ${damage} damage`);
        
        if (enemyId != 0 && !enemyId) {
            console.log("No enemy ID provided");
            return;
        }
        console.log(enemies[enemyId.hp]);
        // Update enemy health and remove dead enemies
        setEnemies((prevEnemies) => {
            console.log("Current enemies:", prevEnemies);
            
            // First, check if the enemy will die from this damage
            const targetEnemy = prevEnemies.find(enemy => enemy.id === enemyId);
            
            if (!targetEnemy) {
                console.log(`Enemy ${enemyId} not found`);
                return prevEnemies;
            }
            
            console.log(`Found enemy ${enemyId}, current HP: ${targetEnemy.hp}`);
            
            const newHp = Math.max(0, targetEnemy.hp - damage);
            console.log(`New HP will be: ${newHp}`);
            
            const willDie = newHp <= 0;
            
            if (willDie) {
                console.log(`Enemy ${enemyId} killed`);
                
                // Add resources based on enemy type when killed
                const enemyType = targetEnemy.type;
                if (enemyType === 'iron') {
                    setResources(prev => {
                        const newResources = {
                            ...prev,
                            iron: prev.iron + ENEMY_TYPES.IRON.drop
                        };
                        updateResourcesInFirebase(newResources);
                        return newResources;
                    });
                } else if (enemyType === 'titanium') {
                    setResources(prev => {
                        const newResources = {
                            ...prev,
                            titanium: prev.titanium + ENEMY_TYPES.TITANIUM.drop
                        };
                        updateResourcesInFirebase(newResources);
                        return newResources;
                    });
                } else if (enemyType === 'gold') {
                    setResources(prev => {
                        const newResources = {
                            ...prev,
                            gold: prev.gold + ENEMY_TYPES.GOLD.drop
                        };
                        updateResourcesInFirebase(newResources);
                        return newResources;
                    });
                } else if (enemyType === 'boss') {
                    setResources(prev => {
                        const newResources = {
                            ...prev,
                            iron: prev.iron + ENEMY_TYPES.BOSS.drop,
                            titanium: prev.titanium + 100,
                            gold: prev.gold + 50
                        };
                        updateResourcesInFirebase(newResources);
                        return newResources;
                    });
                }
                
                // No ammunition gain from killing enemies
                
                // Remove the enemy completely if it's dead
                return prevEnemies.filter(enemy => enemy.id !== enemyId);
            } else {
                console.log(`Enemy ${enemyId} damaged, HP: ${targetEnemy.hp} -> ${newHp}`);
                // Just update the HP if the enemy survives
                return prevEnemies.map(enemy => {
                    console.log(enemy.id + " vs " + enemyId);
                    if (enemy.id !== enemyId) return enemy;
                    let newEnemy = enemy;
                    console.log("Old enemy: \n Type: " + enemy.type.charAt(0).toUpperCase() + enemy.type.slice(1) + "\n" + 
                        "HP: " + enemy.hp + "/" + enemy.maxHp);
                    newEnemy.hp = newHp;
                    console.log("New enemy: \n Type: " + newEnemy.type.charAt(0).toUpperCase() + newEnemy.type.slice(1) + "\n" + 
                        "HP: " + newEnemy.hp + "/" + newEnemy.maxHp);
                    return newEnemy;
                });
            }
        });
        
        // Mark enemy as recently damaged
        setDamagedEnemies(prev => ({...prev, [enemyId]: true}));
        
        // Clear the damaged status after 0.2 seconds
        setTimeout(() => {
            setDamagedEnemies(prev => ({...prev, [enemyId]: false}));
        }, 200);
    };
    
    // Function to shoot manually at a target
    const shootAtTarget = (targetX, targetY, targetId) => {
        if (ammunition <= 0) {
            console.log("Out of ammunition!");
            return;
        }
        
        // Calculate vertical center offset (same as path)
        const verticalOffset = Math.floor(gridHeight / 2) - 6;
        
        // Set shooting state temporarily
        setIsShooting(true);
        setTimeout(() => setIsShooting(false), 500); // Reset after 500ms
        
        // Create a new shot
        const newShot = {
            id: Date.now(),
            startX: playerX,
            startY: playerY - 0.3, // Adjust to be at the gun position
            targetX: targetX,
            targetY: targetY,
            progress: 0,
            targetId: targetId
        };
        
        console.log("Firing shot at position", targetX, targetY);
        
        // Add the new shot
        setShots(prev => [...prev, newShot]);
        
        // Reduce ammunition
        setAmmunition(prev => prev - 1);
        
        // Damage will be applied when the shot reaches the target
        if (targetId) {
            console.log(`Shot created with target enemy ${targetId}`);
        }
    };
    const getEnemyCoordinates = (enemyPosition) => {
        if (enemyPosition < 0 || !path || path.length === 0) {
            return null;
        }
        
        const verticalOffset = Math.floor(gridHeight / 2) + 7;
        
        // Get enemy position on the path
        const pathPosition = Math.floor(enemyPosition);
        if (pathPosition >= path.length) {
            return null;
        }
    
        const pathRemainder = enemyPosition - pathPosition;
        const currentTile = path[pathPosition];
        const nextTile = path[Math.min(pathPosition + 1, path.length - 1)];
    
        if (!currentTile || !nextTile) {
            return null;
        }
        // Interpolate position between current and next tile
        const x = currentTile.x + (nextTile.x - currentTile.x) * pathRemainder;
        const y = currentTile.y + (nextTile.y - currentTile.y) * pathRemainder;
    
        return {
            x,
            y,
            adjustedY: y + verticalOffset / tileSize, // Y position adjusted for vertical offset
            screenX: x * tileSize,
            screenY: (y + verticalOffset) * tileSize
        };
    };
    // Function to handle mouse click on game grid
    const handleGridClick = (e) => {
        if (ammunition <= 0) return;
        
        // Get click position relative to grid
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / tileSize;
        const y = (e.clientY - rect.top) / tileSize;
        
        console.log(`Click at grid position: (${x.toFixed(2)}, ${y.toFixed(2)})`);
        console.log("Current enemies:", enemies);
        
        // Find if any enemy was clicked
        let targetEnemy = null;
        const verticalOffset = Math.floor(gridHeight / 2) - 6;
        
        // Increase detection radius
        const detectionRadius = 2; // Larger detection radius
        
        for (const enemy of enemies) {
            console.log(`Checking enemy ${enemy.id}, position: ${enemy.position}`);
            
            if (enemy.position < 0 || enemy.position >= path.length) {
                console.log(`Enemy ${enemy.id} not on path`);
                continue;
            }
            
            // Get enemy position on the path
            const pathPosition = Math.floor(enemy.position);
            const pathRemainder = enemy.position - pathPosition;
            
            if (pathPosition >= path.length) {
                console.log(`Enemy ${enemy.id} path position out of bounds`);
                continue;
            }
            
            const currentTile = path[pathPosition];
            const nextTile = path[Math.min(pathPosition + 1, path.length - 1)];
            
            if (!currentTile || !nextTile) {
                console.log(`Enemy ${enemy.id} missing path tiles`);
                continue;
            }
            
            // Interpolate position between current and next tile
            const enemyX = currentTile.x + (nextTile.x - currentTile.x) * pathRemainder;
            const enemyY = currentTile.y + (nextTile.y - currentTile.y) * pathRemainder + verticalOffset / tileSize;
            
            console.log(`Enemy ${enemy.id} at (${enemyX.toFixed(2)}, ${enemyY.toFixed(2)})`);
            
            // Check if click is near enemy (within detection radius)
            const dx = x - enemyX;
            const dy = y - enemyY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            console.log(`Distance to enemy ${enemy.id}: ${distance.toFixed(2)}`);
            
            if (distance < detectionRadius) {
                console.log(`Hit enemy ${enemy.id}!`);
                targetEnemy = enemy;
                break;
            }
        }
        
        // Shoot at the clicked position, with enemy ID if an enemy was clicked
        if (targetEnemy) {
            console.log(`Targeting enemy ${targetEnemy.id}`);
        } else {
            console.log("No enemy targeted");
        }
    };
    
    // Effect to animate shots
    useEffect(() => {
        if (shots.length === 0) return;
        
        const animateInterval = setInterval(() => {
            setShots(prevShots => {
                const updatedShots = [];
                
                prevShots.forEach(shot => {
                    // Update shot progress
                    const newProgress = shot.progress + 0.1; // Move 10% of the way each frame
                    
                    // If shot reached target or is at 100% progress, remove it
                    if (newProgress >= 1) {
                        console.log(`Shot ${shot.id} reached target`);
                        
                        // No need to apply damage here, it's already applied when clicked
                        if (shot.targetId) {
                            console.log(`Shot ${shot.id} reached enemy ${shot.targetId}`);
                        }
                        
                        // Shot reached target, don't keep it
                    } else {
                        // Keep shot in the array if it hasn't reached target
                        updatedShots.push({ ...shot, progress: newProgress });
                    }
                });
                
                return updatedShots;
            });
        }, 50);
        
        return () => clearInterval(animateInterval);
    }, [shots]);
    
    // Effect to update turret angles periodically
    useEffect(() => {
        if (turrets.length === 0 || enemies.length === 0) return;
        
        // Update turret angles every 200ms
        const updateInterval = setInterval(() => {
            setTurrets(prevTurrets => {
                // Don't update if there are no changes
                if (prevTurrets.length === 0) return prevTurrets;
                
                return prevTurrets.map(turret => {
                    // Find nearest enemy
                    let nearestEnemy = null;
                    let minDistance = Infinity;
                    
                    for (const enemy of enemies) {
                        if (enemy && enemy.position >= 0 && enemy.position < path.length) {
                            const coords = getEnemyCoordinates(enemy.position);
                            if (coords) {
                                const dx = turret.x - coords.x;
                                const dy = turret.y - coords.adjustedY;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (distance < minDistance) {
                                    minDistance = distance;
                                    nearestEnemy = coords;
                                }
                            }
                        }
                    }
                    
                    // Update angle if there's a nearest enemy
                    if (nearestEnemy) {
                        const angle = Math.atan2(
                            nearestEnemy.adjustedY - (turret.y - 0.25),
                            nearestEnemy.x - (turret.x + 0.25)
                        ) * 180 / Math.PI;
                        
                        return { ...turret, angle };
                    }
                    
                    return turret;
                });
            });
        }, 200);
        
        return () => clearInterval(updateInterval);
    }, [enemies.length, turrets.length]);
    
    // State to track enemy positions for turret targeting
    const [enemyPositions, setEnemyPositions] = useState([]);
    
    // Update enemy positions for turret targeting
    useEffect(() => {
        if (enemies.length === 0 || path.length === 0) return;
        
        // Create a simplified representation of enemy positions
        const positions = enemies.map(enemy => ({
            id: enemy.id,
            position: enemy.position,
            timestamp: Date.now()
        }));
        
        setEnemyPositions(positions);
    }, [enemies]);
    
    // Counter to force turret attack effect to run periodically
    const [attackCounter, setAttackCounter] = useState(0);
    
    // Update attack counter 10 times per second
    useEffect(() => {
        const counterInterval = setInterval(() => {
            setAttackCounter(prev => prev + 1);
        }, 100); // 100ms = 10 times per second
        
        return () => clearInterval(counterInterval);
    }, []);
    
    // Effect to handle turret attacks
    useEffect(() => {
        if (turrets.length === 0 || enemies.length === 0) return;
        
        console.log(`Turrets: ${turrets.length}, Enemies: ${enemies.length}, Counter: ${attackCounter}`);
        console.log("Starting attack interval");
        
        // Process turrets immediately and then set up interval with a slower rate
        processTurrets();
        
        // Attack interval for machine gun turrets (1 attack per second)
        const attackInterval = setInterval(() => {
            processTurrets();
        }, 1000); // Attack once per second for better performance
        
        // Function to process turrets and attack enemies
        function processTurrets() {
            console.log("Attack interval tick");
            
            // Process each turret
            turrets.forEach((turret) => {
                if (turret.type === 'machineGun') {
                    const turretProps = TURRET_PROPERTIES.machineGun;
                    console.log(`Processing turret at (${turret.x}, ${turret.y})`);
                    
                    // Find enemies in range
                    const enemiesInRange = [];
                    
                    for (const enemy of enemies) {
                        if (enemy && enemy.position >= 0 && enemy.position < path.length) {
                            // Use enemy's stored coordinates if available
                            let enemyX = enemy.x;
                            let enemyY = enemy.y;
                            let adjustedY = enemy.y;
                            
                            // If coordinates aren't stored, calculate them
                            if (enemyX === undefined || enemyY === undefined) {
                                const pathPosition = Math.floor(enemy.position);
                                const pathRemainder = enemy.position - pathPosition;
                                
                                if (pathPosition < path.length) {
                                    const currentTile = path[pathPosition];
                                    const nextTile = path[Math.min(pathPosition + 1, path.length - 1)];
                                    
                                    if (currentTile && nextTile) {
                                        enemyX = currentTile.x + (nextTile.x - currentTile.x) * pathRemainder;
                                        enemyY = currentTile.y + (nextTile.y - currentTile.y) * pathRemainder;
                                        
                                        // Calculate vertical offset
                                        const verticalOffset = Math.floor(gridHeight / 2) - 6;
                                        adjustedY = enemyY + verticalOffset / tileSize;
                                    }
                                }
                            }
                            
                            if (enemyX !== undefined && enemyY !== undefined) {
                                console.log(`Enemy ${enemy.id} at (${enemyX}, ${enemyY})`);
                                
                                // Calculate distance from turret to enemy
                                const dx = turret.x - enemyX;
                                const dy = turret.y - adjustedY;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                console.log(`Distance to enemy ${enemy.id}: ${distance.toFixed(2)}`);
                                
                                // Check if enemy is within turret range (use a much larger range for testing)
                                console.log(`Checking if enemy ${enemy.id} is in range: ${distance} <= ${turretProps.range}`);
                                if (distance <= turretProps.range) { // Temporarily use a much larger range for testing
                                    console.log(`Enemy ${enemy.id} in range!`);
                                    enemiesInRange.push({
                                        enemy,
                                        distance,
                                        x: enemyX,
                                        y: adjustedY
                                    });
                                }
                            }
                        }
                    }
                    
                    console.log(`Enemies in range: ${enemiesInRange.length}`);
                    
                    // Sort enemies by ID (lowest first)
                    enemiesInRange.sort((a, b) => a.enemy.id - b.enemy.id);
                    
                    // Attack the enemy with the lowest ID if any are in range
                    if (enemiesInRange.length > 0) {
                        const target = enemiesInRange[0];
                        
                        // Add cooldown check
                        const now = Date.now();
                        const lastFired = turret.lastFired || 0;
                        const cooldown = 1000; // 1 second cooldown between shots
                        
                        if (now - lastFired >= cooldown) {
                            console.log(`Turret attacking enemy ${target.enemy.id}`);
                            
                            // Update turret's last fired timestamp
                            turret.lastFired = now;
                            
                            // Apply damage (0.2 damage per second is more balanced)
                            damageEnemy(target.enemy.id, 2);
                            
                            // Create a shot effect
                            const newShot = {
                                id: Date.now() + Math.random(),
                                startX: turret.x,
                                startY: turret.y,
                                targetX: target.x,
                                targetY: target.y,
                                progress: 0,
                                targetId: target.enemy.id,
                                fromTurret: true
                            };
                        
                        setShots(prev => [...prev, newShot]);
                    }
                }
            }
        });
    }
        
        return () => clearInterval(attackInterval);
    }, [turrets, enemies, enemyPositions, attackCounter]);
    
    // Function to calculate turret angles (called during render)
    const calculateTurretAngles = () => {
        if (turrets.length === 0 || enemies.length === 0 || path.length === 0) {
            return turrets;
        }
        
        try {
            return turrets.map(turret => {
                // Find nearest enemy
                let nearestEnemy = null;
                let minDistance = Infinity;
                
                for (const enemy of enemies) {
                    if (enemy && enemy.position >= 0 && enemy.position < path.length) {
                        const coords = getEnemyCoordinates(enemy.position);
                        if (coords) {
                            const dx = turret.x - coords.x;
                            const dy = turret.y - coords.adjustedY;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearestEnemy = coords;
                            }
                        }
                    }
                }
                
                // Update angle if there's a nearest enemy
                if (nearestEnemy) {
                    // Calculate angle from top right corner of turret to enemy
                    const angle = Math.atan2(
                        nearestEnemy.adjustedY - (turret.y - 0.25),
                        nearestEnemy.x - (turret.x + 0.25)
                    ) * 180 / Math.PI;
                    
                    return { ...turret, angle };
                }
                
                return turret;
            });
        } catch (error) {
            console.error("Error calculating turret angles:", error);
            return turrets;
        }
    };
    
    // Effect to move enemies along the path
    useEffect(() => {
        if (loading || enemies.length === 0 || path.length === 0) return;
        
        console.log("Enemy movement effect running");
        
        // Enemy movement speed (positions per second)
        const moveSpeed = 0.05;
        
        // Calculate spacing needed for 1 second between enemies
        // Since we update every 50ms and move 0.05 positions each time,
        // an enemy moves 1 position per second (0.05 * 20 updates)
        // So we need 20 position units between enemies for 1 second spacing
        
        const moveInterval = setInterval(() => {
            setEnemies(prevEnemies => {
                let enemiesReachedEnd = 0;
                
                // Move each enemy forward and filter out enemies that reached the end
                const updatedEnemies = prevEnemies
                    .filter(enemy => enemy.alive) // Only keep alive enemies
                    .map(enemy => {
                        // Move enemy forward
                        const newPosition = enemy.position + moveSpeed;
                        
                        // Check if enemy reached the end of the path
                        if (newPosition >= path.length - 1) {
                            // Enemy reached the end, count it but don't include in result
                            enemiesReachedEnd += 1;
                            return null; // Will be filtered out
                        }
                        
                        // Calculate enemy's x and y coordinates for reference
                        let x = 0;
                        let y = 0;
                        const verticalOffset = Math.floor(gridHeight / 2) - 6;
                        
                        if (newPosition >= 0 && newPosition < path.length) {
                            const pathPosition = Math.floor(newPosition);
                            const pathRemainder = newPosition - pathPosition;
                            const currentTile = path[pathPosition];
                            const nextTile = path[Math.min(pathPosition + 1, path.length - 1)];
                            
                            if (currentTile && nextTile) {
                                x = currentTile.x + (nextTile.x - currentTile.x) * pathRemainder;
                                y = currentTile.y + (nextTile.y - currentTile.y) * pathRemainder;
                            }
                        }
                        
                        return { 
                            ...enemy, 
                            position: newPosition,
                            x: x,
                            y: y + verticalOffset
                        };
                    })
                    .filter(enemy => enemy !== null); // Remove null entries (enemies that reached the end)
                
                // If any enemies reached the end, reduce hearts
                if (enemiesReachedEnd > 0) {
                    console.log(`${enemiesReachedEnd} enemies reached the end`);
                    setHearts(prev => Math.max(0, prev - enemiesReachedEnd));
                }
                
                return updatedEnemies;
            });
        }, 50); // Update every 50ms for smooth movement
        
        return () => clearInterval(moveInterval);
    }, [loading, path.length]);
    
    // Handle keyboard movement with debounced Firebase updates
    useEffect(() => {
        const handleKeyDown = (e) => {
            let newX = playerX;
            let newY = playerY;
            
            switch(e.key) {
                case 'ArrowUp':
                    newY = Math.max(0, playerY - 1);
                    setPlayerY(newY);
                    break;
                case 'ArrowDown':
                    newY = Math.min(gridHeight - 2, playerY + 1); // Subtract 2 to account for player height
                    setPlayerY(newY);
                    break;
                case 'ArrowLeft':
                    newX = Math.max(0, playerX - 1);
                    setPlayerX(newX);
                    break;
                case 'ArrowRight':
                    newX = Math.min(gridWidth - 1, playerX + 1);
                    setPlayerX(newX);
                    break;
                case 'Tab':
                    // Toggle turret menu when Tab is pressed
                    e.preventDefault(); // Prevent default tab behavior
                    setShowTurretMenu(prev => !prev);
                    break;
                default:
                    return;
            }
            
            // Update Firebase with new position
            updatePlayerPosition(newX, newY);
        };
        
        if (!loading) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [playerX, playerY, gridWidth, gridHeight, loading]);
    
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',
                height: '100vh',
                background: 'black',
                color: 'white',
                fontFamily: 'monospace'
            }}>
                Loading game data...
            </div>
        );
    }
    
    return (
        <div id="GameContainer" style={{
            display: 'flex',
            width: '100vw',
            height: '100vh',
            background: 'black',
            overflow: 'hidden'
        }}>
            {/* Game grid area */}
            <div 
                id="GameGrid" 
                onClick={handleGridClick}
                style={{
                    position: 'relative',
                    width: `${gridWidth * tileSize}px`, // Exactly 34 tiles wide
                    height: `${gridHeight * tileSize}px`,
                    border: '1px solid #333',
                    cursor: ammunition > 0 ? 'crosshair' : 'not-allowed'
                }}>
                {/* Path tiles - centered vertically */}
                {path.map((tile, index) => {
                    // Calculate vertical center offset
                    const verticalOffset = Math.floor(gridHeight / 2) - 6; // 6 is the average path height
                    
                    return (
                        <div
                            key={`path-${index}`}
                            style={{
                                position: 'absolute',
                                left: `${tile.x * tileSize}px`,
                                top: `${(tile.y + verticalOffset) * tileSize}px`,
                                width: `${tileSize}px`,
                                height: `${tileSize}px`,
                                backgroundColor: index === path.length - 1 ? '#5D4037' : '#8D6E63', // Dark brown for goal, light brown for path
                                border: '1px solid #3E2723'
                            }}
                        />
                    );
                })}
                
                {/* Circle effect when in turret menu or hovering over a turret */}
                {showCircle && (
                    <div
                        style={{
                            position: 'absolute',
                            left: `${(playerX - circleRadius + 0.5) * tileSize}px`,
                            top: `${(playerY - circleRadius + 0.5) * tileSize}px`,
                            width: `${circleRadius * 2 * tileSize}px`,
                            height: `${circleRadius * 2 * tileSize}px`,
                            borderRadius: '50%',
                            border: `2px solid ${hoveredTurret ? '#4CAF50' : 'white'}`,
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            zIndex: 9,
                            pointerEvents: 'none',
                            transition: 'opacity 0.3s ease-in-out, border-color 0.3s ease-in-out'
                        }}
                    />
                )}
                
                {/* Enemies */}
                {enemies.map((enemy, index) => {
                    if (enemy.position < 0) return null; // Only check position since dead enemies are removed
                    
                    // Calculate vertical center offset (same as path)
                    const verticalOffset = Math.floor(gridHeight / 2) - 6;
                    
                    // Get enemy position on the path
                    const pathPosition = Math.floor(enemy.position);
                    const pathRemainder = enemy.position - pathPosition;
                    
                    // Get current and next path tiles
                    const currentTile = path[pathPosition];
                    const nextTile = path[Math.min(pathPosition + 1, path.length - 1)];
                    
                    if (!currentTile || !nextTile) return null;
                    
                    // Interpolate position between current and next tile
                    const x = currentTile.x + (nextTile.x - currentTile.x) * pathRemainder;
                    const y = currentTile.y + (nextTile.y - currentTile.y) * pathRemainder;
                    // Calculate size based on enemy type
                    const size = tileSize * enemy.scale;
                    
                    // Apply color filter based on enemy type
                    let filter = '';
                    if (enemy.type === 'titanium') {
                        filter = 'sepia(100%) saturate(300%) brightness(70%) hue-rotate(300deg)';
                    } else if (enemy.type === 'gold') {
                        filter = 'sepia(100%) saturate(500%) brightness(120%) hue-rotate(40deg)';
                    } else if (enemy.type === 'boss') {
                        filter = 'contrast(150%) brightness(50%)';
                    }
                    // Store position for reference but don't update state during render
                    // ENEMY STYLING
                    return (
                        <div
                            key={`enemy-${enemy.id}`}
                            style={{
                                position: 'absolute',
                                left: `${x * tileSize}px`,
                                top: `${(y + verticalOffset) * tileSize - size}px`,
                                width: `${size}px`,
                                height: `${size}px`,
                                backgroundImage: `url(${meteorImg})`,
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                filter: filter,
                                zIndex: 8,
                                cursor: 'pointer',
                                transform: 'translate(0%, 100%) scaleX(-1)',
                            }}
                            onMouseEnter={() => setHoveredEnemies(prev => ({...prev, [enemy.id]: true}))}
                            onMouseLeave={() => setHoveredEnemies(prev => ({...prev, [enemy.id]: false}))}
                            onClick={() => {
                                setSelectedEnemy(enemy);
                                if (ammunition > 0) {
                                    setTimeout(() => {
                                        shootAtTarget(x, y + verticalOffset, enemy.id);
                                        damageEnemy(enemy.id, 1);
                                    }, 1000);
                                }
                            }}
                        >
                            {/* Health bar on top - only shown when damaged or hovered */}
                            {(damagedEnemies[enemy.id] || hoveredEnemies[enemy.id]) && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    left: '25%',
                                    width: '50%', // Make the health bar half the width of the enemy
                                    height: '3px',
                                    backgroundColor: '#333',
                                    borderRadius: '1px',
                                    opacity: damagedEnemies[enemy.id] ? 1 : 0.7, // Full opacity when damaged, slightly transparent when just hovered
                                    transition: 'opacity 0.2s ease-in-out'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${(enemy.hp / enemy.maxHp) * 100}%`,
                                        backgroundColor: enemy.hp > enemy.maxHp * 0.5 ? 'green' : 
                                                        enemy.hp > enemy.maxHp * 0.2 ? 'orange' : 'red',
                                        borderRadius: '1px'
                                    }}/>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {/* Placed Turrets - Calculate angles on each render */}
                {turrets.map(turret => {
                    // Simplified turret rendering without complex calculations during render
                    return (
                        <div
                            key={`turret-${turret.id}`}
                            style={{
                                position: 'absolute',
                                left: `${turret.x * tileSize}px`,
                                top: `${turret.y * tileSize}px`,
                                width: `${tileSize}px`,
                                height: `${tileSize}px`,
                                backgroundImage: `url(${machineGunTurretNoBackgroundImg})`,
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                transformOrigin: 'top right', // Set rotation origin to top right
                                transform: `rotate(${turret.angle || 0}deg)`,
                                zIndex: 9,
                                pointerEvents: 'none'
                            }}
                        />
                    );
                })}
                
                {/* Player character */}
                {isShooting ? (
                    <Player1Pistol 
                        className="player1pistol" 
                        style={{
                            position: 'absolute',
                            left: `${playerX * tileSize}px`,
                            top: `${(playerY === 0 ? -0.1 : playerY - 0.55) * tileSize}px`,
                            width: `${tileSize}px`,
                            height: `${tileSize * 2}px`,
                            zIndex: 10 // Ensure player is above path tiles
                        }}
                    />
                ) : (
                    <Player1 
                        className="player1" 
                        style={{
                            position: 'absolute',
                            left: `${playerX * tileSize}px`,
                            top: `${(playerY === 0 ? -0.1 : playerY - 0.55) * tileSize}px`,
                            width: `${tileSize}px`,
                            height: `${tileSize * 2}px`,
                            zIndex: 10 // Ensure player is above path tiles
                        }}
                    />
                )}
                
                {/* Shots */}
                {shots.map(shot => {
                    // Calculate current position based on progress
                    const x = shot.startX + (shot.targetX - shot.startX) * shot.progress;
                    const y = shot.startY + (shot.targetY - shot.startY) * shot.progress;
                    
                    // Calculate angle for shot rotation
                    const angle = Math.atan2(shot.targetY - shot.startY, shot.targetX - shot.startX) * 180 / Math.PI;
                    
                    return (
                        <div
                            key={`shot-${shot.id}`}
                            style={{
                                position: 'absolute',
                                left: `${x * tileSize}px`,
                                top: `${y * tileSize}px`,
                                width: '30px',
                                height: '12px',
                                backgroundColor: '#ffff00', // Bright yellow
                                boxShadow: '0 0 15px 8px rgba(255, 255, 0, 0.9)', // Very strong glow effect
                                zIndex: 20, // Higher than everything else
                                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                                borderRadius: '6px'
                            }}
                        />
                    );
                })}
                
                {/* Turret Menu */}
                {showTurretMenu && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '20px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '200px',
                            height: '300px',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            border: '2px solid #555',
                            borderRadius: '8px',
                            padding: '10px',
                            zIndex: 30,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <h3 style={{ color: 'white', marginBottom: '15px' }}>Turrets</h3>
                        
                        {/* Machine Gun Turret */}
                        <div
                            style={{
                                width: '150px',
                                height: '180px',
                                backgroundColor: '#333',
                                border: hoveredTurret === 'machineGun' ? 
                                    (resources.iron >= TURRET_COSTS.machineGun.iron ? '2px solid #4CAF50' : '2px solid #FF5252') : 
                                    '1px solid #666',
                                borderRadius: '5px',
                                padding: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            onClick={() => {
                                console.log("Machine Gun Turret selected");
                                
                                // Check if player has enough resources
                                // Define turret limits per level
                                const TURRET_LIMITS = {
                                    1: 2, 2: 3, 3: 5, 4: 5, 5: 10
                                };
                                
                                // Check resources and turret limit
                                if (resources.iron >= TURRET_COSTS.machineGun.iron && 
                                    turrets.length < TURRET_LIMITS[level]) {
                                    // Find nearest enemy for orientation
                                    let nearestEnemy = null;
                                    let minDistance = Infinity;
                                    
                                    enemies.forEach(enemy => {
                                        if (enemy.position >= 0 && enemy.position < path.length) {
                                            const coords = getEnemyCoordinates(enemy.position);
                                            if (coords) {
                                                const dx = playerX - coords.x;
                                                const dy = playerY - coords.adjustedY;
                                                const distance = Math.sqrt(dx * dx + dy * dy);
                                                
                                                if (distance < minDistance) {
                                                    minDistance = distance;
                                                    nearestEnemy = coords;
                                                }
                                            }
                                        }
                                    });
                                    
                                    // Calculate angle to nearest enemy
                                    let angle = 0;
                                    if (nearestEnemy) {
                                        angle = Math.atan2(
                                            nearestEnemy.adjustedY - playerY,
                                            nearestEnemy.x - playerX
                                        ) * 180 / Math.PI;
                                    }
                                    
                                    // Create new turret
                                    const newTurret = {
                                        id: Date.now(),
                                        type: 'machineGun',
                                        x: playerX,
                                        y: playerY,
                                        angle: Math.atan2(
                                            nearestEnemy.adjustedY - (playerY - 0.25), // Adjust Y for top
                                            nearestEnemy.x - (playerX + 0.25) // Adjust X for right
                                        ) * 180 / Math.PI,
                                        lastAttack: 0 // Track last attack time
                                    };
                                    
                                    // Add turret to list and update Firebase
                                    setTurrets(prev => {
                                        const updatedTurrets = [...prev, newTurret];
                                        updateTurretsInFirebase(updatedTurrets);
                                        return updatedTurrets;
                                    });
                                    
                                    // Deduct resources
                                    setResources(prev => {
                                        const newResources = {
                                            ...prev,
                                            iron: prev.iron - TURRET_COSTS.machineGun.iron
                                        };
                                        updateResourcesInFirebase(newResources);
                                        return newResources;
                                    });
                                    
                                    // Close turret menu
                                    setShowTurretMenu(false);
                                } else {
                                    if (turrets.length >= TURRET_LIMITS[level]) {
                                        console.log(`Maximum turret limit (${TURRET_LIMITS[level]}) reached for level ${level}`);
                                    } else {
                                        console.log("Not enough resources to build Machine Gun Turret");
                                    }
                                }
                            }}
                            onMouseEnter={() => setHoveredTurret('machineGun')}
                            onMouseLeave={() => setHoveredTurret(null)}
                        >
                            <div
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    backgroundImage: `url(${machineGunTurretImg})`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    marginBottom: '10px'
                                }}
                            />
                            <div style={{ color: 'white', textAlign: 'center' }}>
                                Machine Gun Turret
                                <div style={{ fontSize: '12px', marginTop: '5px', color: '#AAA' }}>
                                    Cost: 20 Iron
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Stats area in top right */}
            <div id="StatsPanel" style={{
                width: '25%',
                height: '100%',
                background: '#111',
                padding: '10px',
                color: 'white',
                fontFamily: 'monospace'
            }}>
                <h3>Game Stats</h3>
                <p>Game: {+Cookies.get('game')+1}</p>
                <p>Level: {level}</p>
                <p>Ammunition: {ammunition}</p>
                {/* Resources display */}
                <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                    <h4 style={{ margin: '0 0 5px 0' }}>Resources</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ 
                                color: hoveredTurret === 'machineGun' ? 
                                    (resources.iron >= TURRET_COSTS.machineGun.iron ? '#4CAF50' : '#FF5252') : 
                                    '#A19D94',
                                fontWeight: hoveredTurret === 'machineGun' ? 'bold' : 'normal'
                            }}>
                                Iron:
                            </span> {resources.iron}
                            {hoveredTurret === 'machineGun' && (
                                <span style={{ 
                                    marginLeft: '5px',
                                    color: resources.iron >= TURRET_COSTS.machineGun.iron ? '#4CAF50' : '#FF5252'
                                }}>
                                    (-{TURRET_COSTS.machineGun.iron})
                                </span>
                            )}
                        </div>
                        <div>
                            <span style={{ color: '#E57373' }}>Titanium:</span> {resources.titanium}
                        </div>
                        <div>
                            <span style={{ color: '#FFD700' }}>Gold:</span> {resources.gold}
                        </div>
                    </div>
                </div>

                <p>Turrets: {turrets.length}/{TURRET_LIMITS ? TURRET_LIMITS[level] : '?'}</p>
                <p style={{ 
                    color: hearts <= 5 ? '#f44336' : hearts <= 10 ? '#ff9800' : 'white',
                    fontWeight: hearts <= 10 ? 'bold' : 'normal'
                }}>
                    Hearts: {hearts}
                </p>
                
                {/* Selected Enemy Info */}
                {selectedEnemy && (
                    <div style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '10px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}>Selected Meteorite</h4>
                        <p style={{ margin: '4px 0' }}>Type: {selectedEnemy.type.charAt(0).toUpperCase() + selectedEnemy.type.slice(1)}</p>
                        <p style={{ margin: '4px 0' }}>HP: {selectedEnemy.hp}/{selectedEnemy.maxHp}</p>
                        <p style={{ margin: '4px 0' }}>Hearts: {
                            // Find the hearts value from ENEMY_TYPES
                            Object.values(ENEMY_TYPES).find(type => type.type === selectedEnemy.type)?.hearts || '?'
                        }</p>
                    </div>
                )}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px'}}>
                    <button 
                        onClick={() => updateLevel(Math.max(1, level - 1))}
                        className="startbutton"
                        style={{ padding: '5px 10px', display: level == 1 ? 'none' : 'block'}}
                        disabled={level <= 1}
                    >
                        Prev Level
                    </button>
                    <button 
                        onClick={() => updateLevel(Math.min(5, level + 1))}
                        className="startbutton"
                        style={{ padding: '5px 10px', display: enemies.length > 0 ? 'none' : 'block'}}
                        disabled={level >= 5}
                    >
                        Next Level
                    </button>
                </div>
                
                {/* Restart Level Button */}
                <button 
                    onClick={restartLevel}
                    className="startbutton"
                    style={{ 
                        padding: '5px 10px',
                        marginBottom: '10px',
                        backgroundColor: '#d32f2f',
                        color: 'white'
                    }}
                >
                    Restart Level
                </button>
                <button 
                    onClick={() => navigate('/singleplayerstart')}
                    className="startbutton"
                    style={{
                        marginLeft: "0.5vw"
                    }}
                >
                    Back to Games
                </button>
            </div>
        </div>
    );
}

export default SingleGamePage;