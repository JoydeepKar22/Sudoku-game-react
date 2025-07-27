import React, { useState, useEffect, useCallback } from 'react';

// --- Utility Functions (sudokuLogic.js) ---

// Function to generate a solved Sudoku board using backtracking
const generateSudoku = () => {
    const board = Array(9).fill(0).map(() => Array(9).fill(0));
    solveSudoku(board);
    return board;
};

// Backtracking solver
const solveSudoku = (board) => {
    const findEmpty = (b) => {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (b[r][c] === 0) return [r, c];
            }
        }
        return null;
    };

    const isValid = (b, num, pos) => {
        const [r, c] = pos;
        // Check row
        for (let i = 0; i < 9; i++) {
            if (b[r][i] === num && c !== i) return false;
        }
        // Check column
        for (let i = 0; i < 9; i++) {
            if (b[i][c] === num && r !== i) return false;
        }
        // Check 3x3 box
        const boxX = Math.floor(c / 3);
        const boxY = Math.floor(r / 3);
        for (let i = boxY * 3; i < boxY * 3 + 3; i++) {
            for (let j = boxX * 3; j < boxX * 3 + 3; j++) {
                if (b[i][j] === num && (i !== r || j !== c)) return false;
            }
        }
        return true;
    };

    const solve = () => {
        const emptyPos = findEmpty(board);
        if (!emptyPos) return true;

        const [row, col] = emptyPos;
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

        for (let i = 0; i < nums.length; i++) {
            const num = nums[i];
            if (isValid(board, num, [row, col])) {
                board[row][col] = num;
                if (solve()) return true;
                board[row][col] = 0;
            }
        }
        return false;
    };
    
    solve();
    return board;
};


// Function to create a puzzle by removing numbers from a solved board
const createPuzzle = (solution, difficulty) => {
    const puzzle = solution.map(row => [...row]);
    const removals = {
        easy: 35,
        medium: 45,
        hard: 55,
    };
    let count = removals[difficulty] || 45;

    while (count > 0) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (puzzle[row][col] !== 0) {
            puzzle[row][col] = 0;
            count--;
        }
    }
    return puzzle;
};

// --- React Components ---

// Cell Component: Renders a single cell in the grid
const Cell = ({ value, isEditable, isSelected, isPeer, isSameValue, isError, onClick }) => {
    const cellClasses = [
        'flex items-center justify-center',
        'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
        'text-lg sm:text-xl md:text-2xl font-bold',
        'border border-gray-300',
        'transition-colors duration-200',
        'cursor-pointer',
    ];

    if (!isEditable) {
        cellClasses.push('text-gray-800 bg-gray-100');
    } else {
        cellClasses.push('text-blue-600');
    }

    if (isSelected) {
        cellClasses.push('bg-blue-200');
    } else if (isPeer) {
        cellClasses.push('bg-blue-50');
    } else if (isSameValue && isSelected) {
        cellClasses.push('bg-blue-100');
    }
    
    if (isError && isEditable) {
        cellClasses.push('text-red-500');
    }

    return (
        <div className={cellClasses.join(' ')} onClick={onClick}>
            {value !== 0 ? value : ''}
        </div>
    );
};

// Board Component: Renders the 9x9 Sudoku board
const Board = ({ grid, initialGrid, selectedCell, onCellClick, errors }) => {
    const getCellProps = (row, col) => {
        const value = grid[row][col];
        const selectedValue = selectedCell ? grid[selectedCell.row][selectedCell.col] : 0;

        return {
            value: value,
            isEditable: initialGrid[row][col] === 0,
            isSelected: selectedCell && selectedCell.row === row && selectedCell.col === col,
            isPeer: selectedCell && (selectedCell.row === row || selectedCell.col === col || (Math.floor(selectedCell.row / 3) === Math.floor(row / 3) && Math.floor(selectedCell.col / 3) === Math.floor(col / 3))),
            isSameValue: value !== 0 && selectedValue !== 0 && value === selectedValue,
            isError: errors.some(err => err.row === row && err.col === col),
            onClick: () => onCellClick(row, col),
        };
    };
    
    return (
        <div className="grid grid-cols-9 bg-gray-400 border-2 border-gray-600 rounded-lg shadow-lg" style={{ width: 'fit-content' }}>
            {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                    const cellProps = getCellProps(rowIndex, colIndex);
                    const borderClasses = [];
                    if ((colIndex + 1) % 3 === 0 && colIndex < 8) borderClasses.push('border-r-2 border-r-gray-600');
                    if ((rowIndex + 1) % 3 === 0 && rowIndex < 8) borderClasses.push('border-b-2 border-b-gray-600');
                    if (colIndex % 3 === 0 && colIndex > 0) borderClasses.push('border-l-2 border-l-gray-600');
                    if (rowIndex % 3 === 0 && rowIndex > 0) borderClasses.push('border-t-2 border-t-gray-600');

                    return (
                        <div key={`${rowIndex}-${colIndex}`} className={borderClasses.join(' ')}>
                            <Cell {...cellProps} />
                        </div>
                    );
                })
            )}
        </div>
    );
};

// Main App Component
export default function App() {
    const [solution, setSolution] = useState([]);
    const [initialGrid, setInitialGrid] = useState([]);
    const [grid, setGrid] = useState([]);
    const [selectedCell, setSelectedCell] = useState(null);
    const [difficulty, setDifficulty] = useState('medium');
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [errors, setErrors] = useState([]);
    const [isSolved, setIsSolved] = useState(false);

    // --- Game Initialization ---
    const newGame = useCallback((diff) => {
        const newSolution = generateSudoku();
        const newPuzzle = createPuzzle(newSolution, diff);
        
        setSolution(newSolution);
        setInitialGrid(newPuzzle.map(row => [...row]));
        setGrid(newPuzzle.map(row => [...row]));
        setSelectedCell(null);
        setErrors([]);
        setTime(0);
        setIsActive(true);
        setIsSolved(false);
    }, []);
    
    useEffect(() => {
        newGame(difficulty);
    }, [difficulty, newGame]);

    // --- Timer Logic ---
    useEffect(() => {
        let interval = null;
        if (isActive && !isSolved) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else if (!isActive && time !== 0) {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive, time, isSolved]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Cell Interaction and Validation ---
    const handleCellClick = (row, col) => {
        if (initialGrid[row][col] === 0) {
            setSelectedCell({ row, col });
        } else {
            setSelectedCell(null); // Deselect if clicking a non-editable cell
        }
    };
    
    const validateCell = (board, num, pos) => {
        const [r, c] = pos;
        // Check row
        for (let i = 0; i < 9; i++) {
            if (board[r][i] === num && c !== i) return false;
        }
        // Check column
        for (let i = 0; i < 9; i++) {
            if (board[i][c] === num && r !== i) return false;
        }
        // Check 3x3 box
        const boxX = Math.floor(c / 3);
        const boxY = Math.floor(r / 3);
        for (let i = boxY * 3; i < boxY * 3 + 3; i++) {
            for (let j = boxX * 3; j < boxX * 3 + 3; j++) {
                if (b[i][j] === num && (i !== r || j !== c)) return false;
            }
        }
        return true;
    };
    
    const checkForWin = (board) => {
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if(board[r][c] === 0 || !validateCell(board, board[r][c], [r, c])) {
                    return false;
                }
            }
        }
        return true;
    };
    
    const handleNumberInput = (num) => {
        if (!selectedCell || isSolved) return;
        
        const { row, col } = selectedCell;
        const newGrid = grid.map(r => [...r]);
        newGrid[row][col] = num;
        
        // Validate and update errors
        const newErrors = [];
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (newGrid[r][c] !== 0 && !validateCell(newGrid, newGrid[r][c], [r, c])) {
                    newErrors.push({ row: r, col: c });
                }
            }
        }
        setErrors(newErrors);
        setGrid(newGrid);
        
        if (checkForWin(newGrid)) {
            setIsSolved(true);
            setIsActive(false);
            alert("Congratulations! You've solved the Sudoku!");
        }
    };
    
    const handleErase = () => {
        if (!selectedCell || isSolved) return;
        handleNumberInput(0);
    };

    // --- Game Controls ---
    const handleSolve = () => {
        setGrid(solution.map(row => [...row]));
        setIsSolved(true);
        setIsActive(false);
        setErrors([]);
    };

    const handleReset = () => {
        newGame(difficulty);
    };

    // --- Keyboard Input ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (selectedCell && !isSolved) {
                if (e.key >= '1' && e.key <= '9') {
                    handleNumberInput(parseInt(e.key, 10));
                } else if (e.key === 'Backspace' || e.key === 'Delete') {
                    handleErase();
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedCell, isSolved, grid]);

    if (grid.length === 0) {
        return <div className="flex items-center justify-center min-h-screen bg-gray-100">Loading...</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 font-sans">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Sudoku</h1>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex flex-col items-center">
                    <div className="flex justify-between w-full mb-2 text-lg">
                        <span className="font-semibold text-gray-600">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</span>
                        <span className="font-semibold text-gray-600">{formatTime(time)}</span>
                    </div>
                    <Board 
                        grid={grid} 
                        initialGrid={initialGrid}
                        selectedCell={selectedCell}
                        onCellClick={handleCellClick}
                        errors={errors}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {/* Number Pad */}
                    <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
                            <button key={num} onClick={() => handleNumberInput(num)} className="w-12 h-12 text-xl font-semibold bg-white border-2 border-blue-400 text-blue-600 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                {num}
                            </button>
                        ))}
                         <button onClick={handleErase} className="col-span-3 w-full h-12 text-xl font-semibold bg-white border-2 border-red-400 text-red-600 rounded-lg hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all">
                                Erase
                         </button>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-2">
                         <div className="flex gap-2">
                            <button onClick={() => setDifficulty('easy')} className={`flex-1 p-2 rounded-lg font-semibold transition ${difficulty === 'easy' ? 'bg-green-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Easy</button>
                            <button onClick={() => setDifficulty('medium')} className={`flex-1 p-2 rounded-lg font-semibold transition ${difficulty === 'medium' ? 'bg-yellow-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Medium</button>
                            <button onClick={() => setDifficulty('hard')} className={`flex-1 p-2 rounded-lg font-semibold transition ${difficulty === 'hard' ? 'bg-red-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>Hard</button>
                        </div>
                        <button onClick={handleSolve} className="w-full p-3 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition-colors">Solve</button>
                        <button onClick={handleReset} className="w-full p-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors">New Game</button>
                    </div>
                </div>
            </div>
             {isSolved && <div className="mt-4 p-4 bg-green-100 text-green-800 border border-green-400 rounded-lg text-center font-bold text-xl">Congratulations! You solved it!</div>}
        </div>
    );
}
