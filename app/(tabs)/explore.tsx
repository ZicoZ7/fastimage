import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface GameResult {
    score: number;
    reward: string;
}

export default function GameScreen() {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [showGame, setShowGame] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [showResult, setShowResult] = useState(false);

    const webViewRef = useRef<WebView>(null);

    const startGame = () => {
        setShowGame(true);
        setGameResult(null);
        setShowResult(false);
    };

    const handleWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'gameOver') {
                const result = calculateReward(data.score);
                setGameResult(result);
                setShowResult(true);
            }
        } catch (error) {
            console.error('Error parsing WebView message:', error);
        }
    };

    const calculateReward = (score: number): GameResult => {
        if (score >= 100) {
            return { score, reward: '🏆 LEGENDARY! Amazing Skills!' };
        } else if (score >= 40) {
            return { score, reward: '🥈 EPIC! Great Performance!' };
        } else if (score >= 15) {
            return { score, reward: '🥉 NICE! Good Job!' };
        } else {
            return { score, reward: '💔 Keep Practicing!' };
        }
    };

    const resetGame = () => {
        setShowGame(false);
        setGameResult(null);
        setShowResult(false);
    };

    const createGameHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        html, body {
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-family: Arial, sans-serif;
            overflow: hidden;
            touch-action: manipulation;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
        }
        #gameContainer {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #87CEEB 0%, #98FB98 100%);
            cursor: pointer;
        }
        canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: linear-gradient(135deg, #87CEEB 0%, #98FB98 100%);
        }
        .ui {
            position: absolute;
            top: 30px;
            left: 30px;
            color: white;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 10;
        }
        .instructions {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            z-index: 10;
        }
        .game-over {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            font-size: 28px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
            background: rgba(0,0,0,0.8);
            padding: 30px;
            border-radius: 15px;
            z-index: 10;
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas"></canvas>
        <div class="ui">
            <div>Score: <span id="score">0</span></div>
        </div>
        <div id="instructions" class="instructions">
            <p><strong>TAP TO START</strong></p>
        </div>
        <div id="gameOver" class="game-over" style="display: none;">
            <h2>Game Over!</h2>
            <p>Final Score: <span id="finalScore">0</span></p>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const gameContainer = document.getElementById('gameContainer');
        const scoreElement = document.getElementById('score');
        const instructionsElement = document.getElementById('instructions');
        const gameOverElement = document.getElementById('gameOver');
        const finalScoreElement = document.getElementById('finalScore');

        // Game state
        let gameState = 'start'; // 'start', 'playing', 'gameOver'
        let score = 0;
        let gameSpeed = 1.5; // Slower speed for easier start
        let baseGameSpeed = 1.5;
        let difficultyLevel = 0;

        // Diamond (player)
        const diamond = {
            x: 0,
            y: 0,
            width: 40,
            height: 40,
            velocity: 0,
            gravity: 0.4, // Much lighter gravity for easier start
            baseGravity: 0.4,
            jumpPower: -8, // Gentler jump for easier control
            baseJumpPower: -8,
            color: '#FFD700'
        };

        // Obstacles
        const obstacles = [];
        let obstacleWidth = 80;
        let obstacleGap = 250; // Much bigger gap for easier start
        let baseObstacleGap = 250;
        let obstacleTimer = 0;
        let obstacleSpawnRate = 100; // Slower spawning for easier start
        
        // Moving obstacles
        const movingObstacles = [];
        let enableMovingObstacles = false;
        
        // Wind effect
        let windForce = 0;
        let windTimer = 0;
        let enableWind = false;

        // Resize canvas to fit full screen
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            diamond.x = canvas.width * 0.2;
            diamond.y = canvas.height / 2;
            obstacleWidth = Math.max(60, canvas.width * 0.15);
            obstacleGap = Math.max(150, canvas.height * 0.25);
        }

        // Initialize
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Draw diamond
        function drawDiamond() {
            ctx.save();
            ctx.translate(diamond.x + diamond.width/2, diamond.y + diamond.height/2);
            ctx.rotate(diamond.velocity * 0.05);
            
            // Diamond shape
            ctx.beginPath();
            ctx.moveTo(0, -diamond.height/2);
            ctx.lineTo(diamond.width/2, 0);
            ctx.lineTo(0, diamond.height/2);
            ctx.lineTo(-diamond.width/2, 0);
            ctx.closePath();
            
            // Gradient fill
            const gradient = ctx.createLinearGradient(-15, -15, 15, 15);
            gradient.addColorStop(0, '#FFD700');
            gradient.addColorStop(0.5, '#FFA500');
            gradient.addColorStop(1, '#FF8C00');
            
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.strokeStyle = '#B8860B';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
        }

        // Draw obstacles
        function drawObstacles() {
            // Static obstacles
            ctx.fillStyle = '#228B22';
            obstacles.forEach(obstacle => {
                // Top obstacle
                ctx.fillRect(obstacle.x, 0, obstacleWidth, obstacle.top);
                // Bottom obstacle
                ctx.fillRect(obstacle.x, obstacle.bottom, obstacleWidth, canvas.height - obstacle.bottom);
                
                // Add some decoration
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(obstacle.x + 5, 5, obstacleWidth - 10, obstacle.top - 10);
                ctx.fillRect(obstacle.x + 5, obstacle.bottom + 5, obstacleWidth - 10, canvas.height - obstacle.bottom - 10);
                ctx.fillStyle = '#228B22';
            });
            
            // Moving obstacles
            movingObstacles.forEach(movingObstacle => {
                ctx.fillStyle = '#FF4500';
                ctx.fillRect(movingObstacle.x, movingObstacle.y, movingObstacle.width, movingObstacle.height);
                
                // Add glow effect
                ctx.shadowColor = '#FF4500';
                ctx.shadowBlur = 10;
                ctx.fillRect(movingObstacle.x + 5, movingObstacle.y + 5, movingObstacle.width - 10, movingObstacle.height - 10);
                ctx.shadowBlur = 0;
            });
        }

        // Update game
        function update() {
            if (gameState !== 'playing') return;

            // Update diamond
            diamond.velocity += diamond.gravity;
            diamond.y += diamond.velocity;

            // Update obstacles
            obstacles.forEach((obstacle, index) => {
                obstacle.x -= gameSpeed;
                
                // Score when passing obstacle
                if (!obstacle.passed && obstacle.x + obstacleWidth < diamond.x) {
                    obstacle.passed = true;
                    score++;
                    scoreElement.textContent = score;
                    
                    // Easy mode ends at score 7 - make it harder
                    if (score === 7) {
                        // Transition from easy mode to normal mode
                        diamond.gravity = 0.6; // Normal gravity
                        diamond.jumpPower = -10; // Normal jump power
                        obstacleGap = 200; // Normal gap size
                        obstacleSpawnRate = 90; // Normal spawn rate
                        gameSpeed = 2; // Normal speed
                    }
                    
                    // Hard mode starts at score 37
                    if (score === 37) {
                        // Transition to hard mode
                        diamond.gravity = 0.7; // Harder gravity (falls faster)
                        diamond.jumpPower = -10; // Keep normal jump power
                        obstacleGap = 180; // Smaller gap size
                        obstacleSpawnRate = 80; // Faster spawn rate
                        gameSpeed = 2.4; // Faster speed
                    }
                    
                    // WIN THE GAME at 100 points!
                    if (score >= 100) {
                        winGame();
                        return;
                    }
                }
                
                // Remove off-screen obstacles
                if (obstacle.x + obstacleWidth < 0) {
                    obstacles.splice(index, 1);
                }
            });

            // Generate obstacles - maintain consistent spacing
            obstacleTimer++;
            if (obstacleTimer > obstacleSpawnRate) {
                const minGapTop = canvas.height * 0.1;
                const maxGapTop = canvas.height - obstacleGap - (canvas.height * 0.1);
                const gapStart = Math.random() * (maxGapTop - minGapTop) + minGapTop;
                
                const newObstacle = {
                    x: canvas.width,
                    top: gapStart,
                    bottom: gapStart + obstacleGap,
                    passed: false
                };
                
                obstacles.push(newObstacle);
                obstacleTimer = 0;
            }

            // Check collisions
            checkCollisions();
        }

        // Check collisions
        function checkCollisions() {
            // Ground and ceiling
            if (diamond.y <= 0 || diamond.y + diamond.height >= canvas.height) {
                gameOver();
                return;
            }

            // Static obstacles
            obstacles.forEach(obstacle => {
                if (diamond.x < obstacle.x + obstacleWidth &&
                    diamond.x + diamond.width > obstacle.x) {
                    if (diamond.y < obstacle.top || diamond.y + diamond.height > obstacle.bottom) {
                        gameOver();
                    }
                }
            });
            
            // Moving obstacles
            movingObstacles.forEach(movingObstacle => {
                if (diamond.x < movingObstacle.x + movingObstacle.width &&
                    diamond.x + diamond.width > movingObstacle.x &&
                    diamond.y < movingObstacle.y + movingObstacle.height &&
                    diamond.y + diamond.height > movingObstacle.y) {
                    gameOver();
                }
            });
        }

        // Game over
        function gameOver() {
            gameState = 'gameOver';
            finalScoreElement.textContent = score;
            
            // Send score to React Native immediately
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'gameOver',
                    score: score
                }));
            }
        }
        
        // WIN GAME at 100 points!
        function winGame() {
            gameState = 'gameOver';
            finalScoreElement.textContent = score;
            gameOverElement.querySelector('h2').textContent = '🏆 YOU WON! 🏆';
            
            // Send score to React Native immediately
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'gameOver',
                    score: score
                }));
            }
        }

        // Start game
        function startGame() {
            gameState = 'playing';
            score = 0;
            gameSpeed = baseGameSpeed;
            difficultyLevel = 0;
            
            // Reset diamond properties
            diamond.y = canvas.height / 2;
            diamond.velocity = 0;
            diamond.gravity = diamond.baseGravity;
            diamond.jumpPower = diamond.baseJumpPower;
            
            // Reset obstacles (start with easy mode settings)
            obstacles.length = 0;
            movingObstacles.length = 0;
            obstacleTimer = 0;
            obstacleGap = baseObstacleGap; // 250 (easy mode)
            obstacleSpawnRate = 120; // Slower spawning (easy mode)
            
            // Reset special effects
            enableMovingObstacles = false;
            enableWind = false;
            windForce = 0;
            windTimer = 0;
            
            scoreElement.textContent = '0';
            instructionsElement.style.display = 'none';
        }

        // Jump
        function jump() {
            if (gameState === 'start') {
                startGame();
            } else if (gameState === 'playing') {
                diamond.velocity = diamond.jumpPower;
            }
            // Removed restart functionality - game over means game over!
        }

        // Input handling - Make entire screen tappable
        gameContainer.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            jump();
        });

        gameContainer.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        gameContainer.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            jump();
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            jump();
        });

        canvas.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            jump();
        });

        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            jump();
        });

        document.addEventListener('click', (e) => {
            e.preventDefault();
            jump();
        });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                jump();
            }
        });

        // Game loop
        function gameLoop() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Update and draw
            update();
            drawObstacles();
            drawDiamond();
            
            requestAnimationFrame(gameLoop);
        }

        // Start the game loop
        gameLoop();
    </script>
</body>
</html>`;
    };

    return (
        <ThemedView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.header}>
                    <ThemedText style={styles.title}>Diamond Dash</ThemedText>
                    <ThemedText style={styles.subtitle}>Free to play skill game</ThemedText>
                </View>

                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <ThemedText style={styles.cardTitle}>💎 Diamond Dash</ThemedText>
                    <ThemedText style={styles.gameDescription}>
                        Navigate your diamond through obstacles! Tap to jump and avoid the green pipes.
                    </ThemedText>
                    <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.tint }]} onPress={startGame}>
                        <ThemedText style={styles.playButtonText}>Play Now - Free!</ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <Modal visible={showGame} animationType="slide" onRequestClose={resetGame} presentationStyle="fullScreen">
                <View style={styles.fullScreenGameContainer}>
                    <WebView
                        ref={webViewRef}
                        source={{ html: createGameHTML() }}
                        style={styles.fullScreenWebView}
                        onMessage={handleWebViewMessage}
                        javaScriptEnabled={true}
                        scalesPageToFit={false}
                        scrollEnabled={false}
                    />
                    <TouchableOpacity onPress={resetGame} style={styles.fullScreenCloseButton}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Modal>

            <Modal visible={showResult} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetGame}>
                <ThemedView style={styles.resultContainer}>
                    <View style={styles.resultHeader}>
                        <ThemedText style={styles.resultTitle}>Game Result</ThemedText>
                        <TouchableOpacity onPress={resetGame} style={styles.resultCloseButton}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    {gameResult && (
                        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                            <ThemedText style={styles.cardTitle}>📊 Your Score: {gameResult.score}</ThemedText>
                            <ThemedText style={styles.rewardText}>{gameResult.reward}</ThemedText>
                            <TouchableOpacity onPress={() => { resetGame(); setTimeout(() => startGame(), 100); }}
                                style={[styles.playButton, { backgroundColor: colors.tint }]}>
                                <ThemedText style={styles.playButtonText}>🎮 Play Again</ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </ThemedView>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1, paddingHorizontal: 20 },
    header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 20, alignItems: 'center' },
    title: { fontSize: 32, fontWeight: '700', marginBottom: 8 },
    subtitle: { fontSize: 16, opacity: 0.7 },
    card: { borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    cardTitle: { fontSize: 20, fontWeight: '600', marginBottom: 16 },
    gameDescription: { fontSize: 16, opacity: 0.8, marginBottom: 20, lineHeight: 22 },
    playButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    playButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    fullScreenGameContainer: { flex: 1, backgroundColor: '#000' },
    fullScreenWebView: { flex: 1 },
    fullScreenCloseButton: { position: 'absolute', top: 50, right: 20, width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(0, 0, 0, 0.7)', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    resultContainer: { flex: 1, padding: 20 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 30, paddingBottom: 16 },
    resultTitle: { fontSize: 24, fontWeight: '600' },
    resultCloseButton: { padding: 4 },
    rewardText: { fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 24, marginBottom: 20 },
}); 